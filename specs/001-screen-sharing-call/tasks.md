# Tasks: Self-Hosted Voice & Screen Sharing Calls (Ultra-Lightweight / Zero-Electron)

**Feature**: `001-screen-sharing-call`  
**Input Documents**:
- Spec: [`specs/001-screen-sharing-call/spec.md`](file:///C:/Users/h0wzy/projects/screencord/specs/001-screen-sharing-call/spec.md)
- Plan: [`specs/001-screen-sharing-call/plan.md`](file:///C:/Users/h0wzy/projects/screencord/specs/001-screen-sharing-call/plan.md)
- Research: [`specs/001-screen-sharing-call/research.md`](file:///C:/Users/h0wzy/projects/screencord/specs/001-screen-sharing-call/research.md)
- Data Model: [`specs/001-screen-sharing-call/data-model.md`](file:///C:/Users/h0wzy/projects/screencord/specs/001-screen-sharing-call/data-model.md)
- Signaling Protocol: [`specs/001-screen-sharing-call/contracts/signaling-protocol.md`](file:///C:/Users/h0wzy/projects/screencord/specs/001-screen-sharing-call/contracts/signaling-protocol.md)
- Quickstart: [`specs/001-screen-sharing-call/quickstart.md`](file:///C:/Users/h0wzy/projects/screencord/specs/001-screen-sharing-call/quickstart.md)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and monorepo workspace configuration.

- [ ] T001 Initialize monorepo root configuration, start scripts, and TypeScript config in `package.json` and `tsconfig.json`
- [ ] T002 [P] Setup signaling server workspace with TypeScript, Node.js, and WebSocket dependencies in `server/package.json` and `server/tsconfig.json`
- [ ] T003 [P] Setup client workspace with React 19, Vite, Tailwind CSS, and Lucide icons in `client/package.json`, `client/vite.config.ts`, and `client/index.html`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core signaling, room orchestration, and WebRTC mesh foundation that all user stories depend on.

**⚠️ CRITICAL**: Must be completed before user story implementation begins.

- [ ] T004 Define shared WebSocket signaling protocol types and message schemas in `server/types.ts`
- [ ] T005 [P] Define client-side application, participant, and stream state types in `client/src/types.ts`
- [ ] T006 Implement in-memory Room and Participant lifecycle manager in `server/rooms.ts`
- [ ] T007 Implement HTTP server and WebSocket signaling endpoint with room routing in `server/index.ts`
- [ ] T008 [P] Implement client WebSocket signaling client with auto-reconnect and typed event dispatching in `client/src/webrtc/signalingClient.ts`
- [ ] T009 [P] Implement WebRTC PeerManager orchestrating multi-peer `RTCPeerConnection` mesh, ICE negotiation, and SDP exchange in `client/src/webrtc/peerManager.ts`

**Checkpoint**: Core signaling and WebRTC mesh foundation ready. User stories can now proceed.

---

## Phase 3: User Story 1 - Full-Screen Monitor Sharing with System Audio (Priority: P1) 🎯 MVP

**Goal**: Allow any participant in a call room to share an entire computer monitor alongside system audio loopback in real time with 60 FPS video and low latency.

**Independent Test**: Connect two browser windows to `http://localhost:3000`, join room `lobby`. Start screen share on Client 1 selecting Monitor 1 with system audio enabled. Verify Client 2 displays live 60 FPS video and plays PC audio without interrupting voice.

- [ ] T010 [US1] Implement monitor display and loopback system audio capture helpers using `getDisplayMedia` in `client/src/webrtc/mediaCapture.ts`
- [ ] T011 [US1] Implement screen track publishing, renegotiation, and track-stop handling in `client/src/webrtc/peerManager.ts`
- [ ] T012 [P] [US1] Create full-screen video player tile with stream statistics, presenter badge, and audio indicator in `client/src/components/StreamTile.tsx`
- [ ] T013 [US1] Create Discord-styled bottom control bar with Screen Share toggle button in `client/src/components/ControlBar.tsx`
- [ ] T014 [US1] Assemble primary voice channel view displaying the active screen share stream in `client/src/components/ChannelView.tsx`

**Checkpoint**: User Story 1 complete! Standalone MVP delivers full-screen monitor + system audio sharing over `localhost`.

---

## Phase 4: User Story 2 - Specific Application Window Sharing with Window Audio (Priority: P2)

**Goal**: Enable presenters to select and stream a single application window and capture only that window's dedicated audio without leaking desktop background or personal notifications.

**Independent Test**: Start window share on Client 1 selecting a specific game or app window. Verify Client 2 sees only that window's visuals and hears its audio, even when Client 1 minimizes or covers the window.

- [ ] T015 [US2] Enhance `mediaCapture.ts` with display surface detection (`monitor` vs `window`) and window audio extraction in `client/src/webrtc/mediaCapture.ts`
- [ ] T016 [P] [US2] Create screen share source selection modal dialog with Monitor and Window picker tabs in `client/src/components/ScreenPickerModal.tsx`
- [ ] T017 [US2] Handle window minimize/pause events and graceful stream recovery callbacks in `client/src/webrtc/mediaCapture.ts`
- [ ] T018 [US2] Integrate source picker modal into bottom toolbar in `client/src/components/ControlBar.tsx`

**Checkpoint**: User Story 2 complete! Both full-screen and per-window application streaming are functional.

---

## Phase 5: User Story 3 - Real-Time Multi-Party Voice & Webcam Calling (Priority: P3)

**Goal**: Provide multi-party two-way microphone voice and webcam video calling with mute/deafen controls and real-time speaking indicators.

**Independent Test**: Multiple users join via room URL. When users speak, green speaking rings illuminate around their avatars. Muting microphone or turning off camera stops transmission instantly.

- [ ] T019 [US3] Implement microphone voice and camera video capture helpers in `client/src/webrtc/mediaCapture.ts`
- [ ] T020 [P] [US3] Implement Web Audio API `AnalyserNode` for local voice activity detection (VAD) and speaking indicators in `client/src/webrtc/audioDetector.ts`
- [ ] T021 [P] [US3] Create participant avatar card with green speaking halo ring, mute badge, and camera tile in `client/src/components/UserTile.tsx`
- [ ] T022 [US3] Add Mute, Deafen, and Webcam toggle controls with hotkey support in `client/src/components/ControlBar.tsx`
- [ ] T023 [US3] Implement room join header with shareable room link and participant count in `client/src/components/RoomHeader.tsx`

**Checkpoint**: User Story 3 complete! Full voice, webcam, and speaking detection operating alongside screen streams.

---

## Phase 6: User Story 4 - Multi-Stream Layout & Remote Audio Mixing Controls (Priority: P4)

**Goal**: Allow viewers to switch between grid and theater view for active streams, and independently adjust the volume of each participant's voice and screen audio.

**Independent Test**: In a call with multiple streams, double-click a stream to enter theater mode. Adjust a remote user's voice volume to 50% and screen volume to 120% using local `GainNode` mixers.

- [ ] T024 [US4] Implement Web Audio API `AudioContext` and `GainNode` audio mixer for independent remote peer volume scaling in `client/src/webrtc/audioMixer.ts`
- [ ] T025 [P] [US4] Create popover volume slider component for participant voice and stream audio in `client/src/components/VolumeSlider.tsx`
- [ ] T026 [US4] Implement dynamic grid view with Theater and Fullscreen toggles for active screen shares in `client/src/components/StreamGrid.tsx`
- [ ] T027 [US4] Integrate audio mixer state and remote volume persistence in `client/src/components/ChannelView.tsx`

**Checkpoint**: User Story 4 complete! Advanced layout, theater mode, and fine-grained audio mixer active.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Styling, responsive optimization, and validation against Constitution performance gates.

- [ ] T028 [P] Refine Discord-inspired dark theme palette, typography, and responsive styles in `client/src/index.css`
- [ ] T029 Wire complete application state, room navigation, and room creation in `client/src/App.tsx`
- [ ] T030 Execute and verify all scenarios in `specs/001-screen-sharing-call/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies
- **Phase 1 (Setup)**: Can start immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1. Blocks all User Stories.
- **Phase 3 (US1 - MVP)**: Depends on Phase 2. Delivers working monitor and system audio sharing.
- **Phase 4 (US2)**: Depends on Phase 3. Adds application window sharing.
- **Phase 5 (US3)**: Depends on Phase 2. Adds voice, webcam, and speaking detection.
- **Phase 6 (US4)**: Depends on Phase 3 and Phase 5. Adds multi-stream layout and audio mixer.
- **Phase 7 (Polish)**: Depends on all desired user stories.

### Parallel Opportunities
- Setup: `T002` and `T003` can run in parallel.
- Foundational: `T005`, `T008`, and `T009` can be developed in parallel with server tasks `T006` and `T007`.
- US1: `T012` (StreamTile) can be created in parallel with `T010` (MediaCapture).
- US2: `T016` (ScreenPickerModal) can run in parallel with `T015` (MediaCapture enhancements).
- US3: `T020` (AudioDetector) and `T021` (UserTile) can run in parallel.
- US4: `T025` (VolumeSlider) can run in parallel with `T024` (AudioMixer).
- Polish: `T028` (Styling) can run in parallel.

---

## Implementation Strategy: MVP First

1. **Step 1**: Complete **Phase 1** (Setup) and **Phase 2** (Foundational) to get the signaling server and WebRTC mesh working.
2. **Step 2**: Implement **Phase 3** (User Story 1 - Screen & System Audio Sharing).
3. **Step 3 (Checkpoint)**: Run `npm run dev` and validate monitor screen sharing with computer audio between two localhost browser tabs. **MVP Delivered!**
4. **Step 4**: Progressively add **Phase 4** (Window sharing), **Phase 5** (Voice, webcam, speaking halos), and **Phase 6** (Volume mixers & theater mode).
5. **Step 5**: Polish styling and confirm memory consumption is `< 80 MB` with `< 1%` CPU utilization.
