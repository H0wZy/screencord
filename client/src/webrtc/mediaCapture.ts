export interface ScreenCaptureResult {
  stream: MediaStream;
  surfaceType: 'monitor' | 'window';
  hasAudio: boolean;
}

export class MediaCaptureService {
  /**
   * Captures microphone and/or webcam video
   */
  static async captureUserMedia(options: { video?: boolean; audio?: boolean }): Promise<MediaStream> {
    const constraints: MediaStreamConstraints = {
      audio: options.audio
        ? {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          }
        : false,
      video: options.video
        ? {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
          }
        : false,
    };

    return await navigator.mediaDevices.getUserMedia(constraints);
  }

  /**
   * Captures full monitor or application window with optional system loopback audio
   */
  static async captureDisplayMedia(preferredSurface?: 'monitor' | 'window'): Promise<ScreenCaptureResult> {
    const displayMediaOptions: DisplayMediaStreamOptions = {
      video: {
        // High framerate target for gaming and smooth video
        frameRate: { ideal: 60, max: 60 },
        cursor: 'always',
        ...(preferredSurface ? { displaySurface: preferredSurface } : {}),
      } as any,
      audio: {
        // High fidelity audio without noise cancellation for game sound & music
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
        channelCount: 2,
      },
    };

    const stream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);

    // Detect actual surface type from video track settings
    const videoTrack = stream.getVideoTracks()[0];
    let surfaceType: 'monitor' | 'window' = 'monitor';

    if (videoTrack && 'getSettings' in videoTrack) {
      const settings = videoTrack.getSettings() as any;
      if (settings.displaySurface === 'window') {
        surfaceType = 'window';
      } else if (settings.displaySurface === 'monitor') {
        surfaceType = 'monitor';
      }
    }

    const hasAudio = stream.getAudioTracks().length > 0;

    return {
      stream,
      surfaceType,
      hasAudio,
    };
  }

  /**
   * Safely stops all tracks in a MediaStream
   */
  static stopStream(stream: MediaStream | null) {
    if (!stream) return;
    stream.getTracks().forEach((track) => {
      try {
        track.stop();
      } catch (err) {
        console.warn('[MediaCapture] Failed to stop track:', err);
      }
    });
  }
}
