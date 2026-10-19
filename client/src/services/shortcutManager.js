/**
 * @typedef {Object} ShortcutConfig
 * @property {string} toggleMute
 * @property {string} toggleDeafen
 * @property {string} toggleCamera
 * @property {string} toggleScreen
 * @property {string} pushToTalk
 */

/** @type {ShortcutConfig} */
export const DEFAULT_SHORTCUTS = {
  toggleMute: 'Control+Shift+KeyM',
  toggleDeafen: 'Control+Shift+KeyD',
  toggleCamera: 'Control+Shift+KeyV',
  toggleScreen: 'Control+Shift+KeyS',
  pushToTalk: '', // Optional push-to-talk key (e.g. 'Space')
};

/**
 * Formats a key combination code into human-friendly text
 * @param {string} shortcutStr
 * @returns {string}
 */
export function formatShortcutDisplay(shortcutStr) {
  if (!shortcutStr) return 'Nenhum';

  const parts = shortcutStr.split('+');
  return parts
    .map((p) => {
      if (p === 'Control') return 'Ctrl';
      if (p === 'Shift') return 'Shift';
      if (p === 'Alt') return 'Alt';
      if (p === 'Meta') return 'Win';
      if (p.startsWith('Key')) return p.slice(3);
      if (p.startsWith('Digit')) return p.slice(5);
      return p;
    })
    .join(' + ');
}

/**
 * Checks if a KeyboardEvent matches the configured shortcut
 * @param {Object} e
 * @param {boolean} [e.ctrlKey]
 * @param {boolean} [e.shiftKey]
 * @param {boolean} [e.altKey]
 * @param {boolean} [e.metaKey]
 * @param {string} [e.code]
 * @param {string} shortcutStr
 * @returns {boolean}
 */
export function matchesShortcut(e, shortcutStr) {
  if (!shortcutStr) return false;

  const parts = shortcutStr.split('+');
  const targetCode = parts[parts.length - 1];
  const requiresCtrl = parts.includes('Control');
  const requiresShift = parts.includes('Shift');
  const requiresAlt = parts.includes('Alt');
  const requiresMeta = parts.includes('Meta');

  if (e.code !== targetCode) return false;
  if (!!e.ctrlKey !== requiresCtrl) return false;
  if (!!e.shiftKey !== requiresShift) return false;
  if (!!e.altKey !== requiresAlt) return false;
  if (!!e.metaKey !== requiresMeta) return false;

  return true;
}

/**
 * Parses a keydown event into a serialized shortcut string
 * @param {KeyboardEvent} e
 * @returns {string}
 */
export function parseKeyEvent(e) {
  if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
    return '';
  }

  const parts = [];
  if (e.ctrlKey) parts.push('Control');
  if (e.shiftKey) parts.push('Shift');
  if (e.altKey) parts.push('Alt');
  if (e.metaKey) parts.push('Meta');
  parts.push(e.code);

  return parts.join('+');
}

/**
 * Determines whether shortcut processing should be skipped (e.g. user typing in an input field)
 * @param {KeyboardEvent} e
 * @returns {boolean}
 */
export function shouldIgnoreKeyEvent(e) {
  const target = /** @type {HTMLElement|null} */ (e.target);
  if (!target) return false;
  const tag = target.tagName?.toLowerCase();
  return (
    tag === 'input' ||
    tag === 'textarea' ||
    target.isContentEditable ||
    tag === 'select'
  );
}

/**
 * Loads shortcuts from localStorage with defaults
 * @returns {ShortcutConfig}
 */
export function loadShortcuts() {
  try {
    const raw = localStorage.getItem('screencord_shortcuts');
    if (raw) {
      return { ...DEFAULT_SHORTCUTS, ...JSON.parse(raw) };
    }
  } catch {
    // fallback
  }
  return { ...DEFAULT_SHORTCUTS };
}

/**
 * Persists shortcuts to localStorage
 * @param {ShortcutConfig} config
 */
export function saveShortcuts(config) {
  try {
    localStorage.setItem('screencord_shortcuts', JSON.stringify(config));
  } catch {
    // fallback
  }
}
