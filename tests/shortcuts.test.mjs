import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatShortcutDisplay,
  matchesShortcut,
  DEFAULT_SHORTCUTS,
} from '../client/src/services/shortcutManager.js';

test('formatShortcutDisplay - formats keys cleanly', () => {
  assert.equal(formatShortcutDisplay('Control+Shift+KeyM'), 'Ctrl + Shift + M');
  assert.equal(formatShortcutDisplay('Control+Shift+KeyD'), 'Ctrl + Shift + D');
  assert.equal(formatShortcutDisplay('Alt+KeyV'), 'Alt + V');
  assert.equal(formatShortcutDisplay('Space'), 'Space');
});

test('matchesShortcut - correctly matches KeyboardEvent', () => {
  const event = {
    ctrlKey: true,
    shiftKey: true,
    altKey: false,
    metaKey: false,
    code: 'KeyM',
  };

  assert.equal(matchesShortcut(event, 'Control+Shift+KeyM'), true);
  assert.equal(matchesShortcut(event, 'Control+Shift+KeyD'), false);
  assert.equal(matchesShortcut({ ...event, ctrlKey: false }, 'Control+Shift+KeyM'), false);
});

test('matchesShortcut - matches single key like Space for push-to-talk', () => {
  const event = {
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    metaKey: false,
    code: 'Space',
  };

  assert.equal(matchesShortcut(event, 'Space'), true);
  assert.equal(matchesShortcut(event, 'KeyV'), false);
});

test('DEFAULT_SHORTCUTS - provides default bindings for voice and screen actions', () => {
  assert.ok(DEFAULT_SHORTCUTS.toggleMute);
  assert.ok(DEFAULT_SHORTCUTS.toggleDeafen);
  assert.ok(DEFAULT_SHORTCUTS.toggleCamera);
  assert.ok(DEFAULT_SHORTCUTS.toggleScreen);
});
