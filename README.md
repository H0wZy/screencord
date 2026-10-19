# 🎮 Screencord

> **Ultra-lightweight, self-hosted Discord alternative for gamers and friends.**
> Built with zero Electron bloat, 100% native OS desktop window (PySide6 / Qt6), 60 FPS monitor and window sharing in true 16:9, crystal-clear loopback PC audio, Discord-exact call stage + channel text chat, and a minimalist Discord voice settings panel.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Zero Electron](https://img.shields.io/badge/Architecture-Zero--Electron-green.svg)](#zero-electron-policy)
[![Bundle Size](https://img.shields.io/badge/Client%20Bundle-%3C%20310%20KB-success.svg)](#performance--footprint)
[![Tests Passing](https://img.shields.io/badge/TDD%20Tests-13%20Passing-brightgreen.svg)](#testes-automatizados-tdd)

---

## ✨ Features

- 🖥️ **Full Monitor & Window Screen Sharing in 16:9**:
  - Locked to true 16:9 aspect ratio (`object-contain`) — zero cropping, never cuts off anime subtitles or game UI.
  - Dedicated call control bar sits outside the video stream bounds so buttons never cover what you're watching.
  - **Tela Cheia (True Fullscreen ⛶)**: Maximize screen share to 100% display size for watching videos or gaming together with friends.
- 👥 **Discord-Exact Call Layout**:
  - **Modo Voz (Sem câmera)**: Fila de avatares circulares centralizados com auréolas verdes dinâmicas quando falam (VAD) e apelido embaixo.
  - **Modo Vídeo / Câmera**: Grid responsivo lado a lado em 16:9 (igualzinho ao Discord), sem necessidade de rolar a tela (zero scroll vertical!).
  - **Chat de Texto Integrado**: Abaixo da chamada fica o canal de texto para conversar, enviar links e ver eventos da chamada.
- 🔊 **Global & App Audio Loopback**: Transmit game sounds, YouTube music, or full PC audio loopback simultaneously with your voice.
- 🌐 **Conexão Fácil com Amigos (Self-Host Multi-Redes)**:
  - **Tailscale (Recomendado)**: Conexão direta P2P WireGuard sem lag, sem precisar abrir portas no roteador (`http://100.x.y.z:3001`).
  - **Radmin VPN / Hamachi**: Suporte direto para redes virtuais gamer (`http://25.x.y.z:3001` ou `26.x.y.z`).
  - **Cloudflare Tunnel**: Execute `cloudflared tunnel --url http://localhost:3001` para gerar um link público HTTPS para amigos que não querem instalar VPN.
  - **Modal "Conectar Amigos"**: Detecta automaticamente seus IPs de rede e gera links prontos para copiar com um clique.
- 🎛️ **Discord "Voz e Vídeo" Settings Panel (Engrenagem ⚙️)**:
  - Input & output device selectors (`navigator.mediaDevices.enumerateDevices`).
  - **Live Microphone Test with a 40-segment animated VU meter bar** (`AnalyserNode` FFT).
  - Audio Profiles: *Isolamento de Voz* (noise suppression + echo cancellation), *Estúdio* (crisp unprocessed voice), and *Personalizado*.
  - Input Sensitivity slider with live decibel gate detection.
- 🚀 **100% Native Desktop Window (Zero-Electron)**:
  - Executado nativamente via **PySide6 / Qt6 WebEngine** como uma janela real do Windows / Linux / macOS.
  - Permissões de captura de tela e microfone aprovadas nativamente pelo app Qt, sem banners chatos do navegador.
  - Pode ser compilado em um executável nativo único (`Screencord.exe`) via PyInstaller.
- 🆓 **100% Free & Open Source**: Zero paywalls, zero assinaturas, zero telemetria, zero bloat de Nitro.

---

## ⚡ Zero-Electron Policy & Benchmark

| Métrica | Discord (Desktop Oficial) | Screencord (Desktop Nativo Qt) | Vantagem |
| :--- | :---: | :---: | :---: |
| **Tamanho do Binário** | ~220 MB | **< 310 KB** (Web) / **~15 MB** (Nativo) | **> 90% menor** |
| **Memória RAM Ociosa** | ~350 MB - 600 MB | **~50 MB - 80 MB** | **> 80% mais leve** |
| **Processos em Segundo Plano** | 5 a 8 processos | **1 processo** | **Minimalista** |
| **Queda de FPS em Jogos** | Micro-travamentos perceptíveis | **Zero impacto** | **Otimizado para Gamers** |

---

## 🚀 Como Executar

### 1. Instalação
```bash
git clone https://github.com/H0wZy/screencord.git
cd screencord
npm run install:all
```

### 2. Rodar como Aplicativo Desktop Nativo (Windows / Linux / Mac)
```bash
npm run desktop
```
> Inicia o servidor local de sinalização e abre a janela desktop nativa do Screencord com acelerador gráfico habilitado!

### 3. Conectar com Amigos
Na barra superior da chamada, clique em **"Conectar Amigos"**:
- **Tailscale / Radmin VPN**: Copie o endereço virtual IP gerado automaticamente.
- **Rede Local (Wi-Fi)**: Para amigos na mesma casa.
- **Cloudflare Tunnel**: Rode `cloudflared tunnel --url http://localhost:3001` no terminal e envie o link HTTPS gerado para quem não usa VPN.

### 4. Rodar Testes Automatizados (TDD)
```bash
npm test
```
Executa a suíte de testes unitários Node.js e Pytest validando detecção de IP, sinalização, tolerância a falhas e inicializador desktop nativo.

### 5. Compilar Executável Nativo Único (.exe / Binário)
```bash
npm run build:desktop
```
Gera a pasta com o executável nativo `Screencord.exe` dentro de `dist/`.

---

## 📜 Licença
MIT License. Desenvolvido por [H0wZy](https://github.com/H0wZy).
