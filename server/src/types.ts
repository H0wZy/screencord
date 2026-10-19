export interface Participant {
  id: string;
  nickname: string;
  socketId: string;
  isMuted: boolean;
  isDeafened: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
  screenSourceType: 'monitor' | 'window' | null;
  hasScreenAudio: boolean;
  isSpeaking: boolean;
}

export interface Room {
  id: string;
  createdAt: number;
  participants: Map<string, Participant>;
}

// Signaling Messages
export type ClientMessage =
  | { type: 'join-room'; payload: { roomId: string; nickname: string } }
  | { type: 'signal-offer'; payload: { targetPeerId: string; sdp: RTCSessionDescriptionInit } }
  | { type: 'signal-answer'; payload: { targetPeerId: string; sdp: RTCSessionDescriptionInit } }
  | { type: 'signal-ice-candidate'; payload: { targetPeerId: string; candidate: RTCIceCandidateInit } }
  | {
      type: 'state-update';
      payload: Partial<
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
      >;
    }
  | { type: 'send-chat'; payload: { text: string } };

export interface ChatMessage {
  id: string;
  senderId: string;
  nickname: string;
  text: string;
  timestamp: number;
}

export type ServerMessage =
  | {
      type: 'room-joined';
      payload: {
        selfId: string;
        roomId: string;
        existingParticipants: Participant[];
      };
    }
  | { type: 'user-joined'; payload: Participant }
  | { type: 'user-left'; payload: { peerId: string } }
  | { type: 'signal-offer'; payload: { fromPeerId: string; sdp: RTCSessionDescriptionInit } }
  | { type: 'signal-answer'; payload: { fromPeerId: string; sdp: RTCSessionDescriptionInit } }
  | { type: 'signal-ice-candidate'; payload: { fromPeerId: string; candidate: RTCIceCandidateInit } }
  | {
      type: 'user-state-changed';
      payload: {
        peerId: string;
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
        >;
      };
    }
  | { type: 'chat-message'; payload: ChatMessage };
