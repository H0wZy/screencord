export interface DevicesState {
  audioInputs: MediaDeviceInfo[];
  audioOutputs: MediaDeviceInfo[];
  videoInputs: MediaDeviceInfo[];
}

export async function enumerateMediaDevices(): Promise<DevicesState> {
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    return { audioInputs: [], audioOutputs: [], videoInputs: [] };
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioInputs = devices.filter((d) => d.kind === 'audioinput');
    const audioOutputs = devices.filter((d) => d.kind === 'audiooutput');
    const videoInputs = devices.filter((d) => d.kind === 'videoinput');

    return { audioInputs, audioOutputs, videoInputs };
  } catch (err) {
    console.warn('Failed to enumerate media devices:', err);
    return { audioInputs: [], audioOutputs: [], videoInputs: [] };
  }
}
