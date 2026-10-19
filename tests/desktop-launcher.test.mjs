import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getCandidateExecutables,
  resolveAppRuntime,
  buildAppArgs,
  launchAppWindow,
} from '../scripts/desktop-launcher.mjs';

test('getCandidateExecutables - win32 returns Edge, Chrome, and Brave paths', () => {
  const env = {
    PROGRAMFILES: 'C:\\Program Files',
    'ProgramFiles(x86)': 'C:\\Program Files (x86)',
    LOCALAPPDATA: 'C:\\Users\\test\\AppData\\Local',
  };
  const candidates = getCandidateExecutables('win32', env);

  assert.ok(candidates.length > 0, 'Candidates should not be empty');
  // Check Edge paths
  assert.ok(candidates.some(c => c.includes('msedge.exe')), 'Should include msedge.exe');
  // Check Chrome paths
  assert.ok(candidates.some(c => c.includes('chrome.exe')), 'Should include chrome.exe');
  // Check Brave paths
  assert.ok(candidates.some(c => c.includes('brave.exe')), 'Should include brave.exe');
});

test('getCandidateExecutables - linux returns standard linux browser binaries', () => {
  const candidates = getCandidateExecutables('linux', {});
  assert.deepEqual(candidates, [
    'google-chrome',
    'google-chrome-stable',
    'chromium',
    'chromium-browser',
    'brave-browser',
  ]);
});

test('resolveAppRuntime - returns the first existing candidate', () => {
  const candidates = ['/bin/fake-1', '/bin/valid-browser', '/bin/fake-2'];
  const mockFileExists = (p) => p === '/bin/valid-browser';

  const resolved = resolveAppRuntime(candidates, mockFileExists);
  assert.equal(resolved, '/bin/valid-browser');
});

test('resolveAppRuntime - returns null when no candidate exists', () => {
  const candidates = ['/bin/fake-1', '/bin/fake-2'];
  const mockFileExists = () => false;

  const resolved = resolveAppRuntime(candidates, mockFileExists);
  assert.equal(resolved, null);
});

test('buildAppArgs - formats window and app flags correctly', () => {
  const args = buildAppArgs('http://localhost:3001', 1280, 820);
  assert.deepEqual(args, [
    '--app=http://localhost:3001',
    '--window-size=1280,820',
    '--app-id=screencord',
  ]);
});

test('launchAppWindow - spawns standalone runtime and attaches error listener without crashing', () => {
  let spawnedCmd = null;
  let spawnedArgs = null;
  let unrefCalled = false;
  let errorListenerAttached = false;

  const mockSpawn = (cmd, args, opts) => {
    spawnedCmd = cmd;
    spawnedArgs = args;
    return {
      unref: () => { unrefCalled = true; },
      on: (event, handler) => {
        if (event === 'error') {
          errorListenerAttached = true;
          // Simulate ENOENT error that caused the user crash
          handler(new Error('spawn ENOENT'));
        }
      },
    };
  };

  const result = launchAppWindow({
    url: 'http://localhost:3001',
    platform: 'win32',
    env: { PROGRAMFILES: 'C:\\Program Files' },
    fileExistsFn: (p) => p.includes('chrome.exe'),
    spawnFn: mockSpawn,
    execFn: () => {},
  });

  assert.equal(result.mode, 'standalone');
  assert.ok(spawnedCmd.includes('chrome.exe'), 'Spawned command should be chrome');
  assert.equal(unrefCalled, true, 'unref should be called');
  assert.equal(errorListenerAttached, true, 'error event handler MUST be attached to prevent crash');
});

test('launchAppWindow - falls back to system opener when no standalone browser is found', () => {
  let execCmd = null;
  const mockExec = (cmd) => {
    execCmd = cmd;
  };

  const result = launchAppWindow({
    url: 'http://localhost:3001',
    platform: 'win32',
    env: {},
    fileExistsFn: () => false,
    spawnFn: () => {},
    execFn: mockExec,
  });

  assert.equal(result.mode, 'system_fallback');
  assert.equal(execCmd, 'start http://localhost:3001');
});
