export interface ShortcutConfig {
  toggleMute: string;
  toggleDeafen: string;
  toggleCamera: string;
  toggleScreen: string;
  pushToTalk: string;
}

export const DEFAULT_SHORTCUTS: ShortcutConfig;

export function formatShortcutDisplay(shortcutStr: string): string;

export function matchesShortcut(
  e: {
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    metaKey?: boolean;
    code?: string;
  },
  shortcutStr: string
): boolean;

export function parseKeyEvent(e: KeyboardEvent): string;

export function shouldIgnoreKeyEvent(e: KeyboardEvent): boolean;

export function loadShortcuts(): ShortcutConfig;

export function saveShortcuts(config: ShortcutConfig): void;
