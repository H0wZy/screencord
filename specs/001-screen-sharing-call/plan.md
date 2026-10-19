# Implementation Plan: Self-Hosted Voice & Screen Sharing Calls (Ultra-Lightweight / Zero-Electron)

**Branch**: `001-screen-sharing-call` | **Date**: 2026-10-19 | **Spec**: [spec.md](file:///C:/Users/h0wzy/projects/screencord/specs/001-screen-sharing-call/spec.md)

**Input**: Feature specification from `specs/001-screen-sharing-call/spec.md`

## Summary

Build Screencord as an ultra-lightweight, self-hosted Discord alternative enabling friends to enter call rooms on `localhost` and share screens (monitors, single windows, global PC audio loopback, per-app audio), webcams, and microphones. 
Per Constitution Principle VI, **Electron is strictly forbidden**. The implementation utilizes a minimal Node.js WebSocket signaling server (<30 MB RAM) paired with an optimized web client (React 19 + TypeScript + Vite + Tailwind CSS) communicating via WebRTC mesh and standard Screen Capture APIs (`getDisplayMedia` + `AudioContext`), providing a frictionless Discord-style dark mode experience with zero in-game performance overhead.

---

## Technical Context

**Language/Version**: TypeScript 5.x / Node.js 20+

**Primary Dependencies**:
- Server: `ws` (ultra-lightweight WebSocket server), `fastify` or native `http` for static serving.
- Client: React 19, Vite, Tailwind CSS, Lucide icons (Discord-inspired UI).
- Transport/Media: Open WebRTC (`RTCPeerConnection`), Web Audio API (`AudioContext`, `GainNode`, `AnalyserNode`), Screen Capture API (`navigator.mediaDevices.getDisplayMedia`).

**Storage**: In-memory room and peer state on signaling server (transient sessions, zero database overhead).

**Testing**: Vitest for unit & signaling state tests; Playwright / mock WebRTC peer test suite for integration testing.

**Target Platform**: Any modern web browser (Chrome, Edge, Brave, Firefox) on Windows, macOS, Linux, and localhost.

**Project Type**: Full-stack real-time web application (signaling server + web client).

**Performance Goals**:
- Latency: < 100 ms local network media transport.
- Screen sharing framerate: 60 FPS smooth video.
- Resource usage: Server < 30 MB RAM, client < 80 MB RAM, idle CPU < 1%.

**Constraints**:
- Strictly NO Electron (Zero-Electron Policy).
- 100% functional offline / on local private networks (no cloud auth or external subscriptions).
- Dual audio track mixing (microphone voice + system/app loopback audio) with independent volume sliders.

**Scale/Scope**: Up to 12 participants per room in peer-to-peer mesh on localhost/LAN.

---

## Constitution Check

*GATE: Evaluated against Screencord Constitution v1.1.0*

| Principle | Status | Evaluation |
|---|---|---|
| **I. Self-Hosted & Localhost-First** | PASS | 100% runnable via `npm run dev` on `localhost:3000` with zero external dependencies or proprietary logins. |
| **II. Screen-First Real-Time Architecture** | PASS | First-class support for monitor sharing, window sharing, system audio, and per-app audio with 60 FPS target. |
| **III. Standards-Compliant WebRTC** | PASS | Standard WebRTC RTCPeerConnection (Opus audio, VP8/H.264 video) and pure WebSocket JSON signaling. |
| **IV. Modularity & Platform Portability** | PASS | Clean separation: `server/` (signaling), `client/src/webrtc/` (engine), `client/src/components/` (UI). |
| **V. Privacy & Zero-Telemetry** | PASS | No analytics, trackers, or external reporting; all media stays strictly between local peers. |
| **VI. Ultra-Lightweight & Gamer-Optimized** | PASS | Electron eliminated completely; client runs in existing browser or lightweight webview with minimal RAM (<80MB). |

---

## Project Structure

### Documentation (this feature)

```text
specs/001-screen-sharing-call/
├── spec.md              # Feature specification
├── plan.md              # Implementation plan (/speckit-plan output)
├── research.md          # Phase 0 research decisions
├── data-model.md        # Phase 1 data entities and relationships
├── quickstart.md        # Phase 1 verification and launch guide
├── contracts/
│   └── signaling-protocol.md # WebSocket protocol specification
└── checklists/
    └── requirements.md  # Quality checklist
```

### Source Code (repository root layout)

```text
screencord/
├── package.json
├── tsconfig.json
├── server/
│   ├── index.ts              # HTTP + WebSocket signaling server entry
│   ├── rooms.ts              # In-memory room and peer state manager
│   └── types.ts              # Shared signaling types
└── client/
    ├── index.html            # Single-page app root
    ├── vite.config.ts        # Vite configuration with proxy
    ├── package.json
    └── src/
        ├── main.tsx          # Client entrypoint
        ├── App.tsx           # Main application container
        ├── types.ts          # Client types
        ├── webrtc/
        │   ├── peerManager.ts    # WebRTC RTCPeerConnection manager
        │   ├── mediaCapture.ts   # getUserMedia & getDisplayMedia helpers
        │   ├── audioMixer.ts     # Web Audio API GainNode and AnalyserNode
        │   └── signalingClient.ts# WebSocket client
        └── components/
            ├── ChannelView.tsx   # Discord-style voice channel view
            ├── StreamGrid.tsx    # Screen share + camera video tiles
            ├── ScreenPicker.tsx  # Screen/window selection dialog
            ├── UserTile.tsx      # Participant card with speaking halo
            ├── VolumeSlider.tsx  # Independent volume mixer popover
            └── ControlBar.tsx    # Bottom toolbar (Mute, Deafen, Video, Screen, Disconnect)
```

**Structure Decision**: Monorepo with dedicated `server/` and `client/` directories, unified by root npm scripts (`npm run dev`) for frictionless single-command startup on localhost.

---

## Complexity Tracking

> No constitution violations detected. Standardized WebRTC and WebSocket stack preserves maximum simplicity and zero runtime bloat.
