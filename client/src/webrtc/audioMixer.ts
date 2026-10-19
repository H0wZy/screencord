export class AudioMixer {
  private audioContext: AudioContext;
  private peerGainNodes = new Map<string, { voice?: GainNode; screen?: GainNode }>();
  private masterGain: GainNode;
  private peerVolumes = new Map<string, { voice: number; screen: number }>();
  private isDeafened = false;

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.connect(this.audioContext.destination);
  }

  ensureContext() {
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  attachAudioTrack(peerId: string, track: MediaStreamTrack, type: 'voice' | 'screen'): void {
    this.ensureContext();
    const stream = new MediaStream([track]);
    const source = this.audioContext.createMediaStreamSource(stream);
    const gainNode = this.audioContext.createGain();

    const storedVolumes = this.peerVolumes.get(peerId) || { voice: 1.0, screen: 1.0 };
    gainNode.gain.value = type === 'voice' ? storedVolumes.voice : storedVolumes.screen;

    source.connect(gainNode);
    gainNode.connect(this.masterGain);

    let nodes = this.peerGainNodes.get(peerId);
    if (!nodes) {
      nodes = {};
      this.peerGainNodes.set(peerId, nodes);
    }
    nodes[type] = gainNode;
  }

  setVolume(peerId: string, type: 'voice' | 'screen', volume: number) {
    const clamped = Math.max(0, Math.min(2.0, volume));
    let stored = this.peerVolumes.get(peerId);
    if (!stored) {
      stored = { voice: 1.0, screen: 1.0 };
      this.peerVolumes.set(peerId, stored);
    }
    stored[type] = clamped;

    const nodes = this.peerGainNodes.get(peerId);
    if (nodes && nodes[type]) {
      nodes[type]!.gain.value = clamped;
    }
  }

  getVolume(peerId: string, type: 'voice' | 'screen'): number {
    return this.peerVolumes.get(peerId)?.[type] ?? 1.0;
  }

  setDeafen(deafen: boolean) {
    this.isDeafened = deafen;
    this.masterGain.gain.value = deafen ? 0 : 1.0;
  }

  cleanupPeer(peerId: string) {
    const nodes = this.peerGainNodes.get(peerId);
    if (nodes) {
      nodes.voice?.disconnect();
      nodes.screen?.disconnect();
      this.peerGainNodes.delete(peerId);
    }
    this.peerVolumes.delete(peerId);
  }
}
