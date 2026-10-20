export class AudioDetector {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private animFrameId: number | null = null;
  private isSpeaking = false;
  private silenceTimer: any = null;
  private onSpeakingChange: (isSpeaking: boolean) => void;

  // Dual-threshold Schmitt trigger to eliminate VAD chatter / UI flickering
  private readonly thresholdHigh = 22; // Enter speaking state
  private readonly thresholdLow = 14;  // Maintain speaking state
  private readonly hangoverMs = 450;   // Hold speaking halo for 450ms after speech pause

  constructor(onSpeakingChange: (isSpeaking: boolean) => void) {
    this.onSpeakingChange = onSpeakingChange;
  }

  start(audioTrack: MediaStreamTrack) {
    this.stop();

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const mediaStream = new MediaStream([audioTrack]);
      this.sourceNode = this.audioContext.createMediaStreamSource(mediaStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.5;
      this.sourceNode.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        if (!this.analyser) return;

        this.analyser.getByteFrequencyData(dataArray);

        // Compute average volume level (RMS)
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;

        if (!this.isSpeaking) {
          // Require strong vocal signal to trigger speaking
          if (average >= this.thresholdHigh) {
            this.isSpeaking = true;
            this.onSpeakingChange(true);
            if (this.silenceTimer) {
              clearTimeout(this.silenceTimer);
              this.silenceTimer = null;
            }
          }
        } else {
          // Already speaking: maintain until falling below thresholdLow
          if (average >= this.thresholdLow) {
            if (this.silenceTimer) {
              clearTimeout(this.silenceTimer);
              this.silenceTimer = null;
            }
          } else if (!this.silenceTimer) {
            // Volume fell below thresholdLow: start hangover countdown
            this.silenceTimer = setTimeout(() => {
              this.isSpeaking = false;
              this.silenceTimer = null;
              this.onSpeakingChange(false);
            }, this.hangoverMs);
          }
        }

        this.animFrameId = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (err) {
      console.warn('[AudioDetector] Could not initialize voice activity detector:', err);
    }
  }

  stop() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    if (this.isSpeaking) {
      this.isSpeaking = false;
      this.onSpeakingChange(false);
    }
  }
}
