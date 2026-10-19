# WebSocket Signaling Protocol Contract

This document defines the real-time JSON protocol between Screencord clients and the self-hosted signaling server over WebSocket (`ws://localhost:3000/ws` or `wss://...`).

---

## Message Format

Every message is a JSON string containing:
```typescript
interface SignalingMessage<T = unknown> {
  type: string;
  payload: T;
}
```

---

## Client to Server Messages

### 1. `join-room`
Sent by a client immediately after opening the WebSocket connection.
```json
{
  "type": "join-room",
  "payload": {
    "roomId": "general",
    "nickname": "Gamer123"
  }
}
```

### 2. `signal-offer`
Sends an SDP offer to initiate a WebRTC peer connection with a specific target peer.
```json
{
  "type": "signal-offer",
  "payload": {
    "targetPeerId": "peer-uuid-456",
    "sdp": "v=0\r\no=- ..."
  }
}
```

### 3. `signal-answer`
Sends an SDP answer back to the peer who created the offer.
```json
{
  "type": "signal-answer",
  "payload": {
    "targetPeerId": "peer-uuid-123",
    "sdp": "v=0\r\no=- ..."
  }
}
```

### 4. `signal-ice-candidate`
Exchanges an ICE candidate for NAT/network path resolution.
```json
{
  "type": "signal-ice-candidate",
  "payload": {
    "targetPeerId": "peer-uuid-456",
    "candidate": {
      "candidate": "candidate:...",
      "sdpMid": "0",
      "sdpMLineIndex": 0
    }
  }
}
```

### 5. `state-update`
Broadcasts changes in the client's local state (mute, camera, screen share, speaking).
```json
{
  "type": "state-update",
  "payload": {
    "isMuted": false,
    "isDeafened": false,
    "isCameraOn": true,
    "isScreenSharing": true,
    "screenSourceType": "window",
    "hasScreenAudio": true,
    "isSpeaking": true
  }
}
```

---

## Server to Client Messages

### 1. `room-joined`
Sent to the joining client with their assigned ID and list of existing participants in the room.
```json
{
  "type": "room-joined",
  "payload": {
    "selfId": "peer-uuid-123",
    "roomId": "general",
    "existingParticipants": [
      {
        "id": "peer-uuid-456",
        "nickname": "Alice",
        "isMuted": false,
        "isDeafened": false,
        "isCameraOn": false,
        "isScreenSharing": false,
        "isSpeaking": false
      }
    ]
  }
}
```

### 2. `user-joined`
Broadcast to all existing room members when a new peer enters.
```json
{
  "type": "user-joined",
  "payload": {
    "id": "peer-uuid-789",
    "nickname": "Bob",
    "isMuted": false,
    "isDeafened": false,
    "isCameraOn": false,
    "isScreenSharing": false,
    "isSpeaking": false
  }
}
```

### 3. `user-left`
Broadcast to all remaining peers when someone disconnects.
```json
{
  "type": "user-left",
  "payload": {
    "peerId": "peer-uuid-789"
  }
}
```

### 4. `signal-offer`, `signal-answer`, `signal-ice-candidate`
Relayed directly from the sender to the `targetPeerId`, augmented with the `fromPeerId`.
```json
{
  "type": "signal-offer",
  "payload": {
    "fromPeerId": "peer-uuid-123",
    "sdp": "v=0\r\no=- ..."
  }
}
```

### 5. `user-state-changed`
Broadcast when any participant updates their audio/video/screen/speaking status.
```json
{
  "type": "user-state-changed",
  "payload": {
    "peerId": "peer-uuid-123",
    "state": {
      "isMuted": true,
      "isSpeaking": false
    }
  }
}
```
