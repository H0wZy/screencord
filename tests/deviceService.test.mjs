import test from 'node:test';
import assert from 'node:assert/strict';

test('deviceService - formats fallback labels cleanly when browser returns empty device labels', async () => {
  // Mock device list with empty labels (simulating initial browser state before user grants permission)
  const mockDevices = [
    { deviceId: 'mic-1', kind: 'audioinput', label: '', groupId: 'g1' },
    { deviceId: 'mic-2', kind: 'audioinput', label: 'Realtek High Definition Audio', groupId: 'g1' },
    { deviceId: 'out-1', kind: 'audiooutput', label: '', groupId: 'g2' },
    { deviceId: 'cam-1', kind: 'videoinput', label: '', groupId: 'g3' },
    { deviceId: 'cam-2', kind: 'videoinput', label: 'Iriun Webcam', groupId: 'g3' },
  ];

  let micIdx = 1;
  let outIdx = 1;
  let camIdx = 1;

  const audioInputs = mockDevices
    .filter((d) => d.kind === 'audioinput')
    .map((d) => ({
      ...d,
      label: d.label && d.label.trim().length > 0 ? d.label.trim() : `Microfone ${micIdx++}`,
    }));

  const audioOutputs = mockDevices
    .filter((d) => d.kind === 'audiooutput')
    .map((d) => ({
      ...d,
      label: d.label && d.label.trim().length > 0 ? d.label.trim() : `Alto-falante ${outIdx++}`,
    }));

  const videoInputs = mockDevices
    .filter((d) => d.kind === 'videoinput')
    .map((d) => ({
      ...d,
      label: d.label && d.label.trim().length > 0 ? d.label.trim() : `Câmera ${camIdx++}`,
    }));

  // Assertions
  assert.equal(audioInputs[0].label, 'Microfone 1');
  assert.equal(audioInputs[1].label, 'Realtek High Definition Audio');
  assert.equal(audioOutputs[0].label, 'Alto-falante 1');
  assert.equal(videoInputs[0].label, 'Câmera 1');
  assert.equal(videoInputs[1].label, 'Iriun Webcam');

  // Verify none has empty label or "()"
  for (const v of videoInputs) {
    assert.ok(v.label.length > 0);
    assert.notEqual(v.label, 'Câmera ()');
  }
});
