export interface DevicesState {
  audioInputs: MediaDeviceInfo[];
  audioOutputs: MediaDeviceInfo[];
  videoInputs: MediaDeviceInfo[];
}

let hasRequestedPermissions = false;

/**
 * Pre-warms camera and microphone permissions by briefly requesting a stream
 * and immediately stopping all tracks. This unlocks real hardware device labels
 * (e.g. 'Iriun Webcam', 'OBS Virtual Camera', 'Realtek Audio') in modern browsers
 * and WebEngine runtimes without keeping the webcam LED on.
 */
export async function prewarmMediaPermissions(): Promise<void> {
  if (hasRequestedPermissions) return;
  if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return;
  }

  try {
    // Request both audio and video permission to unlock labels
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
    hasRequestedPermissions = true;
    // Immediately stop tracks so webcam light shuts off instantly (<50ms)
    stream.getTracks().forEach((track) => track.stop());
  } catch (err) {
    // If video fails (e.g. no physical/virtual camera or user dismissed camera prompt), try audio only
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      hasRequestedPermissions = true;
      audioStream.getTracks().forEach((track) => track.stop());
    } catch {
      // Hardware absent or permission denied
    }
  }
}

/**
 * Enumerate all audio input, audio output, and video input devices.
 * Automatically ensures permissions are pre-warmed so device labels are populated.
 */
export async function enumerateMediaDevices(forcePrewarm = false): Promise<DevicesState> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    return { audioInputs: [], audioOutputs: [], videoInputs: [] };
  }

  if (forcePrewarm || !hasRequestedPermissions) {
    await prewarmMediaPermissions();
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();

    let micIndex = 1;
    let outIndex = 1;
    let camIndex = 1;

    const audioInputs = devices
      .filter((d) => d.kind === 'audioinput')
      .map((d) => {
        const fallbackLabel = `Microfone ${micIndex++}`;
        const cleanLabel = d.label && d.label.trim().length > 0 ? d.label.trim() : fallbackLabel;
        return {
          deviceId: d.deviceId || `audioinput-${micIndex}`,
          groupId: d.groupId || '',
          kind: d.kind,
          label: cleanLabel,
          toJSON: () => ({ deviceId: d.deviceId, kind: d.kind, label: cleanLabel }),
        } as MediaDeviceInfo;
      });

    const audioOutputs = devices
      .filter((d) => d.kind === 'audiooutput')
      .map((d) => {
        const fallbackLabel = `Alto-falante ${outIndex++}`;
        const cleanLabel = d.label && d.label.trim().length > 0 ? d.label.trim() : fallbackLabel;
        return {
          deviceId: d.deviceId || `audiooutput-${outIndex}`,
          groupId: d.groupId || '',
          kind: d.kind,
          label: cleanLabel,
          toJSON: () => ({ deviceId: d.deviceId, kind: d.kind, label: cleanLabel }),
        } as MediaDeviceInfo;
      });

    const videoInputs = devices
      .filter((d) => d.kind === 'videoinput')
      .map((d) => {
        const fallbackLabel = `Câmera ${camIndex++}`;
        const cleanLabel = d.label && d.label.trim().length > 0 ? d.label.trim() : fallbackLabel;
        return {
          deviceId: d.deviceId || `videoinput-${camIndex}`,
          groupId: d.groupId || '',
          kind: d.kind,
          label: cleanLabel,
          toJSON: () => ({ deviceId: d.deviceId, kind: d.kind, label: cleanLabel }),
        } as MediaDeviceInfo;
      });

    return { audioInputs, audioOutputs, videoInputs };
  } catch (err) {
    console.warn('[DeviceService] Failed to enumerate media devices:', err);
    return { audioInputs: [], audioOutputs: [], videoInputs: [] };
  }
}
