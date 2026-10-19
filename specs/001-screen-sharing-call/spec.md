# Feature Specification: Self-Hosted Voice & Screen Sharing Calls

**Feature Branch**: `001-screen-sharing-call`

**Created**: 2026-10-19

**Status**: Ready for Planning

**Input**: User description: "Discord self-hosted alternative with full screen, window, monitor, application audio, global PC audio, camera, and voice sharing in calls for friends on localhost."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Full-Screen Monitor Sharing with System Audio (Priority: P1)

As a call participant, I want to share my entire computer screen along with my global computer audio to everyone in the voice channel, so that my friends can watch gameplay, videos, or presentations with high fidelity and synchronized sound.

**Why this priority**: Screen and desktop audio sharing is the core value proposition of Screencord. Delivering this independently allows users to immediately start hosting screen-sharing sessions with friends on localhost.

**Independent Test**: Two users join a localhost call room; User A clicks "Share Screen", selects Monitor 1 with system audio enabled; User B instantly sees User A's screen at 30-60 FPS and hears User A's computer audio in real time.

**Acceptance Scenarios**:

1. **Given** a user is connected to a call room, **When** they initiate screen sharing and choose an entire display monitor with audio enabled, **Then** all participants in the room receive the live video feed of that monitor and hear the broadcasted system audio.
2. **Given** an active full-screen broadcast, **When** the presenter pauses or stops screen sharing, **Then** the stream stops immediately for all peers and the room UI returns to avatar/camera view without interrupting voice audio.

---

### User Story 2 - Specific Application Window Sharing with Window Audio (Priority: P2)

As a presenter, I want to share only a specific application or browser window and capture its dedicated audio without exposing the rest of my desktop, personal notifications, or other background tasks.

**Why this priority**: Window sharing protects presenter privacy and reduces bandwidth usage when users only want to stream a specific game or single tool.

**Independent Test**: User opens a game or media player alongside personal chat windows; User initiates stream selecting only that media player window; remote viewers see only that window even when the presenter switches tabs or windows on their own PC.

**Acceptance Scenarios**:

1. **Given** multiple applications running on the presenter's system, **When** the presenter selects "Share Window" and picks a target window, **Then** only that application's visual bounds and audio are transmitted to the call room.
2. **Given** an active window share, **When** the shared window is minimized or closed, **Then** the system gracefully pauses or ends the stream with a clear indicator to viewers.

---

### User Story 3 - Real-Time Multi-Party Voice & Webcam Calling (Priority: P3)

As a user, I want to join a voice call room with friends using a simple room URL or room code on localhost, speak via microphone, and toggle my webcam on or off.

**Why this priority**: Voice communication is essential for interactive screen-sharing sessions; webcam video provides face-to-face interaction alongside the stream.

**Independent Test**: Multiple users navigate to `http://localhost:3000/room/<roomId>`, enter nicknames, grant mic and camera permissions, and carry out a natural voice conversation with real-time audio levels and video tiles.

**Acceptance Scenarios**:

1. **Given** a user navigating to a room link, **When** they enter their nickname and join, **Then** they immediately hear other participants speaking and their speaking indicator lights up when they talk.
2. **Given** a connected participant, **When** they click "Mute Mic" or "Turn Off Camera", **Then** their audio or video ceases transmission instantly and a muted badge is shown to all peers.

---

### User Story 4 - Multi-Stream Layout & Remote Audio Mixing Controls (Priority: P4)

As a viewer in a call with multiple streams (e.g., one screen share and three webcams), I want to switch between focus mode and grid view, full-screen any shared screen, and independently adjust the volume of each presenter's audio and stream audio.

**Why this priority**: Gives viewers full control over their viewing and listening comfort during crowded or noisy sessions.

**Independent Test**: Viewer clicks on a shared screen tile to maximize it to full screen; viewer adjusts the stream volume slider down while keeping the presenter's voice volume at 100%.

**Acceptance Scenarios**:

1. **Given** an ongoing stream in the room, **When** a viewer double-clicks or selects the stream tile, **Then** that stream expands to theater/fullscreen mode while other participants remain in a compact side strip.
2. **Given** a remote participant's stream with loud background audio, **When** a viewer adjusts the stream volume slider, **Then** the volume is attenuated locally without affecting other participants.

---

### Edge Cases

- **No Audio Device / Screen Capture Permission Denied**: If a user cancels or denies screen capture permissions, the system displays an informative notification and retains existing microphone/video states without disconnecting.
- **Display Resolution Changes / Disconnected Monitor**: If an external monitor being shared is disconnected or resolution changes mid-call, the stream ends cleanly with a "Source disconnected" status rather than crashing the call session.
- **Network Glitches / Packet Loss**: If network jitter or transient packet loss occurs on localhost/LAN, adaptive bitrate control reduces resolution/framerate smoothly and recovers automatically once conditions stabilize.
- **Simultaneous Screen Shares**: If multiple users share screens simultaneously, the UI presents selectable tabs or side-by-side tiles allowing viewers to choose which stream to focus on.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow any user to create or join a call room using a unique room identifier or shareable URL on `localhost` or private network.
- **FR-002**: System MUST support capturing and transmitting full-screen desktop displays (monitors) at selectable frame rates (30 FPS, 60 FPS).
- **FR-003**: System MUST support capturing and transmitting individual application windows without leaking desktop background or sibling windows.
- **FR-004**: System MUST capture and broadcast computer system audio (global audio loopback) when sharing an entire display or window.
- **FR-005**: System MUST capture and broadcast application-specific audio when sharing a dedicated application window.
- **FR-006**: System MUST support simultaneous broadcasting of user microphone voice and screen/application audio with independent audio tracks.
- **FR-007**: System MUST support webcam video capture and broadcasting with instant toggle on/off.
- **FR-008**: System MUST support microphone mute/unmute and deafen toggles with visual speaking indicators for all peers.
- **FR-009**: System MUST allow viewers to expand any active screen share to theater view or browser full-screen.
- **FR-010**: System MUST allow viewers to independently adjust the local volume of each participant and each stream.
- **FR-011**: System MUST operate completely self-hosted without requiring cloud authentication, external STUN/TURN subscriptions on local networks, or third-party tracking.

### Key Entities *(include if feature involves data)*

- **Call Room**: Represents an active communication session identified by a unique `roomId`. Contains zero or more connected participants and active media streams.
- **Participant**: Represents an active user session in a room, including `userId`, `nickname`, microphone state (muted/speaking), camera state, and active streams.
- **Media Stream**: An active real-time transmission within a room, categorized by `type` (`camera`, `screen-monitor`, `screen-window`, `microphone`, `system-audio`), associated with a parent participant.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Time to create and join a call room on localhost is under 3 seconds.
- **SC-002**: Screen sharing latency over local network / localhost is under 150 milliseconds.
- **SC-003**: Audio and video sync drift during screen sharing remains under 50 milliseconds across a 30-minute session.
- **SC-004**: System supports at least 8 simultaneous voice/video/screen participants in a single room on modest local hardware without stream dropouts.
- **SC-005**: 100% of core calling, screen sharing, and audio capture features operate without any external internet connection (true offline / local-network capability).

## Assumptions

- Users run Screencord on modern Chromium-based or standards-compliant browsers (or packaged desktop environment) that provide Screen Capture and Audio APIs.
- For localhost and private LAN calls, direct WebRTC peer connections or local relay provide sufficient throughput without requiring external NAT traversal.
- Mobile browser viewing is secondary for v1; primary focus is desktop streaming experience (Windows/macOS/Linux).
