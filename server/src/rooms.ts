import { WebSocket } from 'ws';
import { Participant, Room } from './types.js';
import { randomUUID } from 'crypto';

export class RoomManager {
  private rooms = new Map<string, Room>();
  private socketToSession = new Map<WebSocket, { roomId: string; peerId: string }>();
  private peerToSocket = new Map<string, WebSocket>();

  joinRoom(
    roomId: string,
    nickname: string,
    socket: WebSocket
  ): { self: Participant; existing: Participant[] } {
    let room = this.rooms.get(roomId);
    if (!room) {
      room = {
        id: roomId,
        createdAt: Date.now(),
        participants: new Map(),
      };
      this.rooms.set(roomId, room);
    }

    const peerId = randomUUID();
    const newParticipant: Participant = {
      id: peerId,
      nickname: nickname?.trim() || `Gamer_${peerId.slice(0, 4)}`,
      socketId: peerId,
      isMuted: false,
      isDeafened: false,
      isCameraOn: false,
      isScreenSharing: false,
      screenSourceType: null,
      hasScreenAudio: false,
      isSpeaking: false,
    };

    const existing = Array.from(room.participants.values());

    room.participants.set(peerId, newParticipant);
    this.socketToSession.set(socket, { roomId, peerId });
    this.peerToSocket.set(peerId, socket);

    return { self: newParticipant, existing };
  }

  leaveRoom(socket: WebSocket): { roomId: string; peerId: string } | null {
    const session = this.socketToSession.get(socket);
    if (!session) return null;

    const { roomId, peerId } = session;
    const room = this.rooms.get(roomId);
    if (room) {
      room.participants.delete(peerId);
      if (room.participants.size === 0) {
        this.rooms.delete(roomId);
      }
    }

    this.socketToSession.delete(socket);
    this.peerToSocket.delete(peerId);

    return { roomId, peerId };
  }

  updateState(
    socket: WebSocket,
    state: Partial<Participant>
  ): { roomId: string; peerId: string; updatedState: Partial<Participant> } | null {
    const session = this.socketToSession.get(socket);
    if (!session) return null;

    const { roomId, peerId } = session;
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const participant = room.participants.get(peerId);
    if (!participant) return null;

    Object.assign(participant, state);
    return { roomId, peerId, updatedState: state };
  }

  getSession(socket: WebSocket): { roomId: string; peerId: string } | undefined {
    return this.socketToSession.get(socket);
  }

  getSocketByPeerId(peerId: string): WebSocket | undefined {
    return this.peerToSocket.get(peerId);
  }

  getRoomPeers(roomId: string): { peerId: string; socket: WebSocket }[] {
    const room = this.rooms.get(roomId);
    if (!room) return [];

    const peers: { peerId: string; socket: WebSocket }[] = [];
    for (const [peerId] of room.participants) {
      const socket = this.peerToSocket.get(peerId);
      if (socket && socket.readyState === WebSocket.OPEN) {
        peers.push({ peerId, socket });
      }
    }
    return peers;
  }
}
