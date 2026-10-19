<!-- Sync Impact Report
Version change: 1.0.0 → 1.1.0
List of modified principles:
- IV. Modularity & Platform Portability (removed references to Electron, affirmed lightweight web/webview runtime architecture)
Added sections:
- VI. Ultra-Lightweight & Gamer-Optimized (Zero-Electron Policy)
Removed sections:
- None
Follow-up TODOs:
- None
-->

# Screencord Constitution

## Core Principles

### I. Self-Hosted & Localhost-First (Zero Lock-in)
Screencord MUST be completely runnable and functional out-of-the-box via `localhost` or self-hosted infrastructure. Any developer or user who clones or forks the repository MUST be able to start the application with a single command without requiring third-party proprietary services, paid subscriptions, or vendor lock-in.

### II. Screen-First Real-Time Media Architecture
Screen sharing is a foundational, first-class citizen of Screencord. The application MUST support full monitor capture, single-window application capture, system-wide audio capture (loopback), and individual window/application audio capture, alongside webcam video and microphone audio. Latency MUST remain minimal (target < 150ms over local networks) with adaptive frame rates and bitrate handling.

### III. Standards-Compliant WebRTC & Clean Signaling
Media transmission MUST adhere strictly to open WebRTC standards for media streams (utilizing Opus for high-fidelity voice/audio and VP8/VP9/H.264/AV1 for video). Real-time room orchestration, state sync, and SDP/ICE candidate negotiation MUST be handled through an efficient, isolated WebSocket signaling layer.

### IV. Modularity & Platform Portability
The codebase MUST enforce a strict separation of concerns across three layers:
1. Media Capture & WebRTC Transport Engine.
2. Real-time Signaling & Room Orchestration Server.
3. User Interface & Call Experience Layer.
This modularity ensures the application runs seamlessly in modern browsers and can be wrapped or enhanced with ultra-lightweight desktop native webview runtimes (e.g., Tauri / OS webview) without rewriting core logic.

### V. Privacy, Zero-Telemetry & Simplicity
Screencord MUST NOT collect, store, or transmit telemetry, user metrics, or behavioral analytics to any remote third party. All audio, video, and screen data MUST flow exclusively between call peers or through the self-hosted relay. Complexity MUST be justified; simple and robust architectures take precedence over unnecessary abstraction.

### VI. Ultra-Lightweight & Gamer-Optimized (Zero-Electron Policy)
Screencord MUST strictly reject Electron and similarly bloated runtimes that bundle heavy multi-process Chromium installations (>200 MB disk, >300 MB RAM idle). The project MUST maintain an ultra-low resource profile (<100 MB RAM idle, <1% CPU idle), ensuring that gamers can play demanding competitive titles while streaming screens and voice without frame drops, micro-stutters, or performance penalties.

## System & Media Architecture Standards

1. **Audio Capture Guarantees**:
   - The application MUST allow capturing both user microphone input and system/application output simultaneously, providing distinct gain and mute controls.
   - Per-application audio and global audio mixing MUST be handled cleanly without feedback loops.
2. **Video & Screen Sharing Guarantees**:
   - Users MUST be able to select specific monitors or specific open windows.
   - Screen streams MUST support dynamic resolution and frame rate adjustments (up to 1080p 60fps where supported by hardware and network).
3. **Deployment & Runtime Guarantees**:
   - Ultra-lightweight signaling server with minimal dependencies.
   - Zero-bloat responsive web client using native WebRTC and Screen Capture APIs (`getDisplayMedia`, `getUserMedia`), optional lightweight desktop wrapper via Tauri/native webview.

## Quality Gates & Testing Workflow

1. **Automated Verification**:
   - Signaling protocols and state transitions MUST have automated unit and integration tests.
   - WebRTC session establishment and peer connection negotiation MUST have reproducible end-to-end integration tests or mock suites.
2. **Code Quality & Review**:
   - All code MUST pass static linting and type checks before merge.
   - Code contributions MUST preserve backwards compatibility for self-hosted instances.

## Governance

This Constitution represents the supreme architectural and development authority for the Screencord project. Any proposed changes to principles, core transport protocols, or governance rules require an explicit constitution amendment with documentation, rationale, and a semantic version bump.

- **MAJOR (X.0.0)**: Redefinition, removal, or breaking change to core principles or project scope.
- **MINOR (1.X.0)**: Addition of new principles, architectural standards, or governance rules.
- **PATCH (1.0.X)**: Non-semantic clarifications, wording improvements, or typo fixes.

**Version**: 1.1.0 | **Ratified**: 2026-10-19 | **Last Amended**: 2026-10-19
