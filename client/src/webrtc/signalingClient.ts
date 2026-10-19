import { ClientMessage, ServerMessage, Participant } from '../types.js';

export type SignalingEventHandler = (msg: ServerMessage) => void;

export class SignalingClient {
  private ws: WebSocket | null = null;
  private url: string;
  private handlers = new Set<SignalingEventHandler>();
  private isExplicitlyClosed = false;
  private reconnectTimer: any = null;

  constructor(url?: string) {
    if (url) {
      this.url = url;
    } else {
      const loc = window.location;
      const protocol = loc.protocol === 'https:' ? 'wss:' : 'ws:';
      // In dev, proxy handles /ws or direct to port 3001
      this.url = `${protocol}//${loc.host}/ws`;
    }
  }

  connect(): Promise<void> {
    this.isExplicitlyClosed = false;
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('[Signaling] WebSocket connected to', this.url);
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as ServerMessage;
            for (const handler of this.handlers) {
              handler(data);
            }
          } catch (err) {
            console.error('[Signaling] Failed to parse incoming message:', err);
          }
        };

        this.ws.onerror = (err) => {
          console.warn('[Signaling] WebSocket error:', err);
        };

        this.ws.onclose = () => {
          console.log('[Signaling] WebSocket closed');
          if (!this.isExplicitlyClosed) {
            this.scheduleReconnect();
          }
        };
      } catch (err) {
        reject(err);
      }
    });
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      console.log('[Signaling] Attempting reconnect...');
      this.connect().catch((e) => console.warn('[Signaling] Reconnect failed:', e));
    }, 2000);
  }

  subscribe(handler: SignalingEventHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  send(message: ClientMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('[Signaling] Cannot send, socket not open:', message.type);
    }
  }

  joinRoom(roomId: string, nickname: string) {
    this.send({ type: 'join-room', payload: { roomId, nickname } });
  }

  sendOffer(targetPeerId: string, sdp: RTCSessionDescriptionInit) {
    this.send({ type: 'signal-offer', payload: { targetPeerId, sdp } });
  }

  sendAnswer(targetPeerId: string, sdp: RTCSessionDescriptionInit) {
    this.send({ type: 'signal-answer', payload: { targetPeerId, sdp } });
  }

  sendIceCandidate(targetPeerId: string, candidate: RTCIceCandidateInit) {
    this.send({ type: 'signal-ice-candidate', payload: { targetPeerId, candidate } });
  }

  updateState(
    state: Partial<
      Pick<
        Participant,
        | 'isMuted'
        | 'isDeafened'
        | 'isCameraOn'
        | 'isScreenSharing'
        | 'screenSourceType'
        | 'hasScreenAudio'
        | 'isSpeaking'
      >
    >
  ) {
    this.send({ type: 'state-update', payload: state });
  }

  sendChat(text: string) {
    this.send({ type: 'send-chat', payload: { text } });
  }

  disconnect() {
    this.isExplicitlyClosed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
