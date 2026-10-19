# Phase 0 Research: Self-Hosted Voice & Screen Sharing Calls (Ultra-Lightweight / Zero-Electron)

## Research Context & Objectives
The goal is to build Screencord as an ultra-lightweight, self-hosted Discord alternative for gamers and friends to join voice/video calls and share screens/monitors, application windows, and computer audio over `localhost` or private networks.

Per Principle VI of the Screencord Constitution, **Electron is strictly excluded** due to its excessive binary size (>200 MB), heavy memory consumption (>300 MB idle RAM), and background Chromium processes that degrade in-game FPS and cause micro-stuttering.

---

## Technical Decisions

### Decision 1: Client Runtime Architecture (Web-First with Optional Tauri Wrapper)
- **Decision**: Primary client runs as an ultra-lightweight web application (Vite + React 19 + TypeScript + Tailwind CSS) accessible via any modern browser at `http://localhost:3000`. For optional standalone desktop execution, use **Tauri v2** (Rust + native OS WebView2) instead of Electron.
- **Rationale**:
  - Web browsers (Chrome, Edge, Brave, Firefox) already run on users' systems; running Screencord directly in a browser tab or PWA window costs virtually **0 additional background processes**.
  - If packaged with Tauri, the resulting binary is ~10 MB (vs Discord's 220+ MB) and idle RAM is ~25-40 MB (vs Discord's 300+ MB), satisfying the strict gaming performance constraint.
- **Alternatives Considered**:
  - *Electron*: Evaluated and rejected per Constitution Principle VI (too heavy, high RAM, causes game stutter).
  - *Qt / C++ Native GUI*: Highly complex to maintain across platforms; slower developer iteration.

---

### Decision 2: Screen, Window, and Audio Capture API
- **Decision**: Standard Web Screen Capture API (`navigator.mediaDevices.getDisplayMedia`) with `AudioContext` mixing.
- **Rationale**:
  - `getDisplayMedia({ video: { frameRate: { ideal: 60, max: 60 }, cursor: "always" }, audio: { echoCancellation: false, autoGainControl: false, noiseSuppression: false, channelCount: 2 } })`:
    - Native OS picker prompts the user to select either **Entire Screen / Monitor** or a **Specific Application Window**.
    - Supports capturing **System Audio Loopback** (global PC sound) and **Per-Application Sound** (window audio) directly through modern browser capabilities without requiring elevated kernel drivers or custom C++ hook DLLs.
  - Microphone audio is captured independently via `navigator.mediaDevices.getUserMedia({ audio: true, video: ... })` with echo cancellation enabled.
- **Alternatives Considered**:
  - *Native Windows Hook (Discord's `discord_voice.node` + `elevated_hook`)*: Requires running elevated helper executables, C++ node-gyp native compilation, and risks triggering anti-cheat software in competitive games. Browser-standard API is safe, zero-install, and sandboxed.

---

### Decision 3: Real-Time Media Transport (WebRTC P2P Mesh with Local Relay Fallback)
- **Decision**: WebRTC (`RTCPeerConnection`) with full mesh for small groups (2–8 users on localhost/LAN), with an optional lightweight media relay server for larger rooms.
- **Rationale**:
  - Ultra-low latency (<100ms on localhost/LAN).
  - WebRTC handles hardware video acceleration (NVENC, Intel QuickSync, AMD VCE) natively in the browser for VP8/VP9/H.264/AV1.
  - Opus codec used automatically for audio, ensuring 48 kHz stereo high-fidelity sound for games and music.
- **Alternatives Considered**:
  - *WebSockets binary streaming (canvas + audio chunks)*: Much higher latency (>500ms), lacks adaptive bitrate, lacks hardware decoding/encoding pipeline.
  - *Heavy SFU (Mediasoup / LiveKit)*: Overkill for initial self-hosted localhost calls with friends, adds heavy C++ build requirements. WebRTC mesh requires zero server media transcode load.

---

### Decision 4: Real-Time Signaling Server
- **Decision**: Node.js with native `ws` (or Fastify + `@fastify/websocket`) in TypeScript.
- **Rationale**:
  - Extremely lightweight (<25 MB RAM idle).
  - Handles JSON signaling messages: room creation, joining, SDP offer/answer exchange, and ICE candidate distribution.
  - Serves client static files on the same port, so `npm run dev` or `npm start` serves both the frontend and the signaling backend from a single localhost port (e.g., `3000`).
- **Alternatives Considered**:
  - *Socket.io*: Good, but `ws` is even lighter with zero client library overhead. We can use clean JSON over standard WebSocket.

---

### Decision 5: Remote Audio Mixing & Speaking Detection
- **Decision**: Web Audio API (`AudioContext`, `GainNode`, `AnalyserNode`).
- **Rationale**:
  - Allows independent volume adjustment (0% to 200%) per remote participant and per screen-share audio stream.
  - `AnalyserNode` performs fast Fast Fourier Transform (FFT) analysis on local and remote microphone streams to calculate RMS volume levels, driving the Discord-style green speaking indicator rings without CPU overhead.

---

## Summary of Technical Stack

| Component | Selected Technology | Memory/Resource Profile |
|---|---|---|
| **Backend / Signaling** | Node.js + TypeScript + `ws` | < 30 MB RAM, < 0.5% CPU |
| **Frontend UI** | React 19 + TypeScript + Vite + Tailwind CSS | Runs in browser / < 60 MB RAM |
| **Media Transport** | WebRTC (`RTCPeerConnection`, Opus + VP8/H.264) | Hardware accelerated |
| **Capture Engine** | Web Screen Capture (`getDisplayMedia` + `getUserMedia`) | Zero native drivers needed |
| **Audio Processing** | Web Audio API (`GainNode`, `AnalyserNode`) | Sub-millisecond DSP |
| **Desktop Option** | Tauri v2 (Rust + WebView2) [Future/Optional] | ~30 MB RAM vs 300+ MB Electron |
