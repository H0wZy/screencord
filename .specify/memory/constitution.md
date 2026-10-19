<!-- Sync Impact Report
Version change: 0.0.0 (template) → 1.0.0
List of modified principles:
- [PRINCIPLE_1_NAME] → I. Self-Hosted & Localhost-First (Zero Lock-in)
- [PRINCIPLE_2_NAME] → II. Screen-First Real-Time Media Architecture
- [PRINCIPLE_3_NAME] → III. Standards-Compliant WebRTC & Clean Signaling
- [PRINCIPLE_4_NAME] → IV. Modularity & Platform Portability
- [PRINCIPLE_5_NAME] → V. Privacy, Zero-Telemetry & Simplicity
Added sections:
- System & Media Architecture Standards
- Quality Gates & Testing Workflow
Removed sections:
- None (template placeholders replaced with concrete project governance)
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
This modularity ensures the application runs seamlessly in modern browsers and can be wrapped or enhanced with desktop native runtimes (e.g., Electron) without rewriting core logic.

### V. Privacy, Zero-Telemetry & Simplicity
Screencord MUST NOT collect, store, or transmit telemetry, user metrics, or behavioral analytics to any remote third party. All audio, video, and screen data MUST flow exclusively between call peers or through the self-hosted relay. Complexity MUST be justified; simple and robust architectures take precedence over unnecessary abstraction.

## System & Media Architecture Standards

1. **Audio Capture Guarantees**:
   - The application MUST allow capturing both user microphone input and system/application output simultaneously, providing distinct gain and mute controls.
   - Per-application audio and global audio mixing MUST be handled cleanly without feedback loops.
2. **Video & Screen Sharing Guarantees**:
   - Users MUST be able to select specific monitors or specific open windows.
   - Screen streams MUST support dynamic resolution and frame rate adjustments (up to 1080p 60fps where supported by hardware and network).
3. **Deployment & Runtime Guarantees**:
   - Node.js runtime environment for the signaling server with minimal dependencies.
   - Responsive web client supporting modern WebRTC and Screen Capture APIs (`getDisplayMedia`, `getUserMedia`).

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

**Version**: 1.0.0 | **Ratified**: 2026-10-19 | **Last Amended**: 2026-10-19
