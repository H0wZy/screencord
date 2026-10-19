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

### Decision 6: Standalone Desktop Runtime (Zero Electron / Native OS App Mode)
- **Decision**: Provide native desktop execution via lightweight OS WebView app mode (`launch-desktop.mjs` using Edge/WebView2 on Windows and Chromium/WebKit on Linux) and **Tauri v2** (`src-tauri/`) without requiring Google Chrome to be manually opened or running Electron.
- **Rationale**:
  - Running as a standalone desktop window gives users a borderless/standalone app experience (`--app=http://localhost:3001`) with no browser tabs, address bars, or extensions.
  - Zero RAM penalty of running a separate heavy browser profile: uses the shared OS WebView2 runtime installed on Windows 10/11.
  - Total process RAM: ~40-60 MB (compared to Discord Electron's >350 MB and standard Chrome's >500 MB).

---

## Discord Architecture & Protocol Research (Developer Documentation Ingestion)

Based on research into the official Discord Developer Documentation (`docs.discord.com`), voice gateway specifications, and media architecture:

### 1. Discord Voice Gateway (v9) & Opcodes Reference
Discord decouples the control-plane signaling gateway (`wss://gateway.discord.gg/?v=10`) from dedicated voice/streaming gateways (`wss://<endpoint>/?v=9`):

| Opcode | Name | Direction | Description |
| :---: | :--- | :---: | :--- |
| **0** | `Identify` | Client $\rightarrow$ Server | Voice session handshake (`server_id`, `user_id`, `session_id`, `token`). |
| **1** | `SelectProtocol` | Client $\rightarrow$ Server | Selects `udp` transport, encryption mode, discovered public IP/port, codecs. |
| **2** | `Ready` | Server $\rightarrow$ Client | Supplies client SSRC, UDP server IP/port, supported encryption modes. |
| **3** | `Heartbeat` | Client $\rightarrow$ Server | Periodic keepalive. |
| **4** | `SessionDescription` | Server $\rightarrow$ Client | Symmetric secret key (32 bytes) for AEAD encryption. |
| **5** | `Speaking` | Bidirectional | Bitmask flags: `1 = Mic`, `2 = Soundshare`, `4 = Priority`. |
| **12** | `Video` | Bidirectional | SSRC negotiation for screen/camera video and RTX retransmission. |

### 2. Media Codecs & Packet Framing
* **Audio (Opus)**: 48 kHz stereo, 20ms frames (960 samples/frame), standard 12-byte RTP header with Payload Type 120. In-band FEC (`useinbandfec=1`) is negotiated for packet loss concealment on unstable gamer Wi-Fi.
* **Encryption**: Discord migrated to `aead_aes256_gcm_rtpsize` and `aead_xchacha20_poly1305_rtpsize`.
* **Screen Sharing**: Video streams allocate paired SSRCs (primary video + retransmission RTX) supporting H.264, VP8, and AV1 hardware-accelerated streams up to 60 FPS.

### 3. Audio & Voice Settings Architecture ("Voz e Vídeo")
Reverse engineering Discord's desktop voice settings UI revealed key user requirements:
1. **Device Management**: Independent selection of input (Microphone) and output (Speakers/Headset) hardware devices using `navigator.mediaDevices.enumerateDevices()`.
2. **Real-time Microphone Test ("Teste do microfone")**:
   - Interactive button toggling loopback monitor.
   - **40-segment animated VU meter bar** with progressive gradient coloring (Discord green/gold/red) computed in real-time via Web Audio `AnalyserNode` FFT.
3. **Audio Profiles**:
   - *Isolamento de Voz*: Echo cancellation + deep noise suppression.
   - *Estúdio*: Crisp, high-fidelity unprocessed voice capture (no heavy filtering).
   - *Personalizado*: Manual fine-tuning of AGC, AEC, and Noise Suppression flags.
4. **Input Sensitivity**: Visual dB slider with auto-sensitivity toggle, controlling gate threshold before VAD speaking halos illuminate.

---

## Summary of Technical Stack

| Component | Selected Technology | Memory/Resource Profile |
|---|---|---|
| **Backend / Signaling** | Node.js + TypeScript + `ws` | < 30 MB RAM, < 0.5% CPU |
| **Frontend UI** | React 19 + TypeScript + Vite + Tailwind CSS | Runs in native WebView / < 60 MB RAM |
| **Media Transport** | WebRTC (`RTCPeerConnection`, Opus + VP8/H.264) | Hardware accelerated |
| **Capture Engine** | Web Screen Capture (`getDisplayMedia` + `getUserMedia`) | Native OS picker, Zero kernel drivers |
| **Audio Processing** | Web Audio API (`GainNode`, `AnalyserNode`, 40-bar VU) | Sub-millisecond DSP |
| **Desktop Runtime** | Standalone OS WebView / Tauri v2 (Zero Electron) | ~40-60 MB RAM vs 350+ MB Discord |
