# Quickstart Validation Guide: Screencord Voice & Screen Sharing Calls

This guide provides step-by-step instructions to launch and validate Screencord locally on `localhost`.

---

## Prerequisites
- **Node.js**: v18+ or v20+
- **Browser**: Modern Chromium-based browser (Chrome, Edge, Brave) or Firefox with WebRTC support.
- **Hardware**: Working microphone and display output.

---

## Setup & Launch

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the self-hosted development server**:
   ```bash
   npm run dev
   ```
   *Expected output*:
   - Signaling & static server listening at `http://localhost:3000`
   - WebSocket endpoint active at `ws://localhost:3000/ws`

---

## End-to-End Validation Scenarios

### Scenario 1: Multi-User Room Connection
1. Open browser window 1: Navigate to `http://localhost:3000`. Enter nickname `Gamer1` and join room `lobby`.
2. Open browser window 2 (or incognito): Navigate to `http://localhost:3000`. Enter nickname `Gamer2` and join room `lobby`.
3. **Expected Outcome**:
   - Both windows show 2 connected participants.
   - WebRTC peer connection status transitions to `connected`.
   - Voice audio from Window 1 is heard in Window 2 and vice-versa.
   - Speaking indicator lights up around avatar when speaking.

---

### Scenario 2: Full Monitor & System Audio Sharing
1. In Window 1, click the **Share Screen** button.
2. Select **Entire Screen** (Monitor 1) and make sure **Share system audio** checkbox is checked.
3. **Expected Outcome**:
   - Window 2 immediately displays Window 1's live screen in high resolution (up to 60 FPS).
   - Any audio played on the PC (e.g. YouTube video or game) is received clearly in Window 2.
   - Window 1 shows an active screen sharing badge with a "Stop Sharing" button.

---

### Scenario 3: Single Application Window Sharing
1. In Window 1, stop full screen share and click **Share Screen** again.
2. Choose **Window** tab in the browser picker and select an open app (e.g., a text editor, game, or media player).
3. **Expected Outcome**:
   - Window 2 displays only the selected application window.
   - Switching away or covering the window on PC 1 does not leak the rest of Desktop 1 to Window 2.

---

### Scenario 4: Remote Audio Mixing & Stream Maximizing
1. In Window 2, locate Gamer 1's tile in the participant list or stream viewer.
2. Adjust Gamer 1's voice volume slider to 50% and screen audio slider to 120%.
3. **Expected Outcome**:
   - Volume scales immediately without popping or distortion.
   - Double-clicking the shared screen enters theater/fullscreen mode.

---

## Verifying Lightweight Resource Footprint
1. Open Windows Task Manager (`Ctrl + Shift + Esc`).
2. Observe Screencord server and browser tab processes:
   - Server process: `< 30 MB` RAM.
   - Client tab: `< 75 MB` RAM.
   - Idle CPU utilization: `< 1%`.
3. No Electron background services or extra helper executables running.
