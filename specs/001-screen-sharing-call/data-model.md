# Phase 1 Data Model: Self-Hosted Voice & Screen Sharing Calls

## Entities & Relationships

```mermaid
erDiagram
    ROOM ||--o{ PARTICIPANT : contains
    PARTICIPANT ||--o{ MEDIA_STREAM : publishes
    PARTICIPANT ||--o{ AUDIO_SETTING : customizes_for_peers
    ROOM {
        string id PK "Unique room slug/ID (e.g., 'gamer-den')"
        string createdAt "ISO timestamp"
        int maxParticipants "Default 12"
    }
    PARTICIPANT {
        string id PK "Unique session ID generated on join"
        string nickname "User-chosen display name"
        string socketId "Active WebSocket connection ID"
        boolean isMuted "Microphone mute state"
        boolean isDeafened "Audio output deafen state"
        boolean isCameraOn "Webcam video transmission state"
        boolean isScreenSharing "Screen video transmission state"
        boolean isSpeaking "Dynamic speaking state"
    }
    MEDIA_STREAM {
        string id PK "Unique stream identifier"
        string participantId FK "Owner participant ID"
        string kind "'video' | 'audio'"
        string type "'camera' | 'microphone' | 'screen-video' | 'screen-audio'"
        boolean active "Stream broadcast status"
    }
    AUDIO_SETTING {
        string targetParticipantId PK "Target peer ID"
        float userVolume "Volume factor (0.0 to 2.0, default 1.0)"
        float screenVolume "Screen audio factor (0.0 to 2.0, default 1.0)"
    }
```

---

## Entity Definitions

### 1. Room
Represents an isolated voice and screen-sharing channel on the self-hosted server.
- **Fields**:
  - `id`: `string` (alphanumeric slug or UUID, e.g., `"general"`, `"call-123"`).
  - `createdAt`: `number` (timestamp).
  - `participants`: `Map<string, Participant>` (in-memory map of active participants).
- **Rules**:
  - Rooms exist in memory on the signaling server while at least 1 participant is connected.
  - Automatically cleaned up when the last participant disconnects.
  - No database or disk persistence required for temporary call rooms.

### 2. Participant
Represents an active peer connected to a Room.
- **Fields**:
  - `id`: `string` (unique client session UUID).
  - `nickname`: `string` (1 to 32 characters, trimmed).
  - `socketId`: `string` (WebSocket identifier).
  - `isMuted`: `boolean` (default `false`).
  - `isDeafened`: `boolean` (default `false`).
  - `isCameraOn`: `boolean` (default `false`).
  - `isScreenSharing`: `boolean` (default `false`).
  - `screenSourceType`: `'monitor' | 'window' | null` (indicates source type of active share).
  - `hasScreenAudio`: `boolean` (indicates whether screen share includes audio track).
  - `isSpeaking`: `boolean` (real-time voice activity state).
- **State Transitions**:
  - `CONNECTED` → joins room with `id` and `nickname`.
  - `SPEAKING_ACTIVE` / `SPEAKING_IDLE` → triggered by local VAD / `AnalyserNode`.
  - `STREAMING_STARTED` → when `getDisplayMedia` successfully acquires tracks.
  - `DISCONNECTED` → on WebSocket closure or page unload.

### 3. MediaStream Descriptor
Represents a media track broadcasted over WebRTC.
- **Fields**:
  - `streamId`: `string` (WebRTC `MediaStream.id`).
  - `trackId`: `string` (WebRTC `MediaStreamTrack.id`).
  - `kind`: `'audio' | 'video'`.
  - `origin`: `'microphone' | 'camera' | 'screen' | 'system-audio'`.
  - `participantId`: `string`.

### 4. Local Audio Mixer State
Maintained on each viewer's client inside the Web Audio API context.
- **Fields**:
  - `peerVolumes`: `Record<string, number>` (mapped to `GainNode.gain.value`, range `0.0` to `2.0`).
  - `screenVolumes`: `Record<string, number>` (mapped to screen audio `GainNode.gain.value`, range `0.0` to `2.0`).
  - `isDeafened`: `boolean` (mutes all incoming audio nodes when `true`).
