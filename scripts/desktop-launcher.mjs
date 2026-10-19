import fs from 'node:fs';
import { spawn, execSync } from 'node:child_process';
import os from 'node:os';

/**
 * Returns prioritized list of browser executables supporting standalone --app mode.
 */
export function getCandidateExecutables(platform = os.platform(), env = process.env) {
  if (platform === 'win32') {
    const pf = env['PROGRAMFILES'] || 'C:\\Program Files';
    const pfx86 = env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
    const local = env['LOCALAPPDATA'] || '';

    return [
      // Edge (Default on Windows 10/11)
      `${pf}\\Microsoft\\Edge\\Application\\msedge.exe`,
      `${pfx86}\\Microsoft\\Edge\\Application\\msedge.exe`,
      ...(local ? [`${local}\\Microsoft\\Edge\\Application\\msedge.exe`] : []),

      // Chrome (Common for gamers)
      `${pf}\\Google\\Chrome\\Application\\chrome.exe`,
      `${pfx86}\\Google\\Chrome\\Application\\chrome.exe`,
      ...(local ? [`${local}\\Google\\Chrome\\Application\\chrome.exe`] : []),

      // Brave (Popular lightweight browser for gamers)
      `${pf}\\BraveSoftware\\Brave-Browser\\Application\\brave.exe`,
      `${pfx86}\\BraveSoftware\\Brave-Browser\\Application\\brave.exe`,
      ...(local ? [`${local}\\BraveSoftware\\Brave-Browser\\Application\\brave.exe`] : []),
    ];
  }

  if (platform === 'linux') {
    return [
      'google-chrome',
      'google-chrome-stable',
      'chromium',
      'chromium-browser',
      'brave-browser',
    ];
  }

  if (platform === 'darwin') {
    return [
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    ];
  }

  return [];
}

/**
 * Resolves the first executable path that actually exists on the filesystem.
 */
export function resolveAppRuntime(candidates, fileExistsFn = fs.existsSync) {
  for (const exe of candidates) {
    if (fileExistsFn(exe)) {
      return exe;
    }
  }
  return null;
}

/**
 * Returns arguments for launching in standalone, borderless desktop app mode.
 */
export function buildAppArgs(url, width = 1280, height = 820) {
  return [
    `--app=${url}`,
    `--window-size=${width},${height}`,
    '--app-id=screencord',
  ];
}

/**
 * Launches the app in standalone native desktop mode with graceful fallback.
 */
export function launchAppWindow({
  url,
  platform = os.platform(),
  env = process.env,
  fileExistsFn = fs.existsSync,
  spawnFn = spawn,
  execFn = execSync,
} = {}) {
  const candidates = getCandidateExecutables(platform, env);
  const runtime = resolveAppRuntime(candidates, fileExistsFn);

  if (runtime) {
    try {
      const args = buildAppArgs(url);
      const child = spawnFn(runtime, args, {
        detached: true,
        stdio: 'ignore',
      });

      // Crucial: attach error listener to prevent Node unhandled 'error' crash
      child.on('error', (err) => {
        console.warn(`[Desktop] App runtime warning: ${err.message}. Falling back to default launcher.`);
        fallbackLaunch(url, platform, execFn);
      });

      if (typeof child.unref === 'function') {
        child.unref();
      }

      return { mode: 'standalone', runtime };
    } catch {
      // Fallback if spawn fails synchronously
      fallbackLaunch(url, platform, execFn);
      return { mode: 'system_fallback', runtime: null };
    }
  }

  // If no standalone chromium-based executable exists, fallback to default OS opener
  fallbackLaunch(url, platform, execFn);
  return { mode: 'system_fallback', runtime: null };
}

function fallbackLaunch(url, platform, execFn) {
  try {
    if (platform === 'win32') {
      execFn(`start ${url}`);
    } else if (platform === 'darwin') {
      execFn(`open "${url}"`);
    } else {
      execFn(`xdg-open "${url}"`);
    }
  } catch (err) {
    console.error(`[Desktop] Failed to open URL in browser: ${err.message}`);
  }
}
