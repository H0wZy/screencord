import { SignalingClient } from './signalingClient.js';

export interface RemoteTrackEvent {
  peerId: string;
  track: MediaStreamTrack;
  stream: MediaStream;
  isScreen: boolean;
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export class PeerManager {
  private peers = new Map<string, RTCPeerConnection>();
  private localUserStream: MediaStream | null = null;
  private localScreenStream: MediaStream | null = null;
  private signaling: SignalingClient;
  private selfId: string = '';

  public onRemoteTrack: ((event: RemoteTrackEvent) => void) | null = null;
  public onPeerDisconnected: ((peerId: string) => void) | null = null;

  constructor(signaling: SignalingClient) {
    this.signaling = signaling;
  }

  setSelfId(id: string) {
    this.selfId = id;
  }

  setLocalUserStream(stream: MediaStream | null) {
    this.localUserStream = stream;
    // Update or add tracks to all existing peer connections
    for (const [peerId, pc] of this.peers) {
      this.syncTracksToPeer(peerId, pc);
    }
  }

  setLocalScreenStream(stream: MediaStream | null) {
    this.localScreenStream = stream;
    for (const [peerId, pc] of this.peers) {
      this.syncTracksToPeer(peerId, pc);
      // Trigger renegotiation for screen share
      this.renegotiatePeer(peerId, pc);
    }
  }

  private syncTracksToPeer(peerId: string, pc: RTCPeerConnection) {
    const senders = pc.getSenders();

    // 1. Sync User Media Tracks (Mic / Cam)
    if (this.localUserStream) {
      for (const track of this.localUserStream.getTracks()) {
        const existingSender = senders.find((s) => s.track?.kind === track.kind && (s.track as any)?._isScreen !== true);
        if (existingSender) {
          if (existingSender.track !== track) {
            existingSender.replaceTrack(track).catch((e) => console.warn('replaceTrack error:', e));
          }
        } else {
          try {
            (track as any)._isScreen = false;
            pc.addTrack(track, this.localUserStream);
          } catch (err) {
            console.warn('[PeerManager] Error adding user track:', err);
          }
        }
      }
    }

    // 2. Sync Screen Tracks (Video + Loopback Audio)
    if (this.localScreenStream) {
      for (const track of this.localScreenStream.getTracks()) {
        (track as any)._isScreen = true;
        const existingSender = senders.find((s) => (s.track as any)?._isScreen === true && s.track?.kind === track.kind);
        if (existingSender) {
          if (existingSender.track !== track) {
            existingSender.replaceTrack(track).catch((e) => console.warn('replaceTrack screen error:', e));
          }
        } else {
          try {
            pc.addTrack(track, this.localScreenStream);
          } catch (err) {
            console.warn('[PeerManager] Error adding screen track:', err);
          }
        }
      }
    } else {
      // Remove any previously added screen senders
      for (const sender of senders) {
        if ((sender.track as any)?._isScreen === true) {
          try {
            pc.removeTrack(sender);
          } catch (e) {
            console.warn('Error removing screen sender:', e);
          }
        }
      }
    }
  }

  private async renegotiatePeer(peerId: string, pc: RTCPeerConnection) {
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      this.signaling.sendOffer(peerId, pc.localDescription!);
    } catch (err) {
      console.warn('[PeerManager] Renegotiation failed for peer:', peerId, err);
    }
  }

  createPeerConnection(peerId: string): RTCPeerConnection {
    let pc = this.peers.get(peerId);
    if (pc) return pc;

    pc = new RTCPeerConnection(RTC_CONFIG);
    this.peers.set(peerId, pc);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.signaling.sendIceCandidate(peerId, event.candidate.toJSON());
      }
    };

    pc.ontrack = (event) => {
      console.log('[PeerManager] Received remote track from', peerId, event.track.kind);
      const isScreen = event.streams[0]?.id?.includes('screen') || event.track.label.toLowerCase().includes('screen') || event.track.label.toLowerCase().includes('display');
      
      if (this.onRemoteTrack) {
        this.onRemoteTrack({
          peerId,
          track: event.track,
          stream: event.streams[0] || new MediaStream([event.track]),
          isScreen,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`[PeerManager] Connection state for ${peerId}:`, pc.connectionState);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.closePeer(peerId);
      }
    };

    // Add current local tracks
    this.syncTracksToPeer(peerId, pc);

    return pc;
  }

  async initiateCall(peerId: string) {
    const pc = this.createPeerConnection(peerId);
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      this.signaling.sendOffer(peerId, pc.localDescription!);
    } catch (err) {
      console.error('[PeerManager] Failed to create offer for', peerId, err);
    }
  }

  async handleOffer(fromPeerId: string, sdp: RTCSessionDescriptionInit) {
    const pc = this.createPeerConnection(fromPeerId);
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      this.signaling.sendAnswer(fromPeerId, pc.localDescription!);
    } catch (err) {
      console.error('[PeerManager] Failed to handle offer from', fromPeerId, err);
    }
  }

  async handleAnswer(fromPeerId: string, sdp: RTCSessionDescriptionInit) {
    const pc = this.peers.get(fromPeerId);
    if (!pc) return;
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    } catch (err) {
      console.error('[PeerManager] Failed to handle answer from', fromPeerId, err);
    }
  }

  async handleIceCandidate(fromPeerId: string, candidate: RTCIceCandidateInit) {
    const pc = this.peers.get(fromPeerId);
    if (!pc) return;
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.warn('[PeerManager] Failed to add ICE candidate:', err);
    }
  }

  closePeer(peerId: string) {
    const pc = this.peers.get(peerId);
    if (pc) {
      pc.close();
      this.peers.delete(peerId);
    }
    if (this.onPeerDisconnected) {
      this.onPeerDisconnected(peerId);
    }
  }

  closeAll() {
    for (const [peerId, pc] of this.peers) {
      pc.close();
    }
    this.peers.clear();
  }
}
