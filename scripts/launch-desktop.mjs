import { spawn, execSync } from 'child_process';
import http from 'http';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const PORT = 3001;
const APP_URL = `http://localhost:${PORT}`;

function isServerRunning(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/health`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function startServer() {
  const running = await isServerRunning(PORT);
  if (running) {
    console.log(`[Desktop] Server already running at ${APP_URL}`);
    return;
  }

  console.log('[Desktop] Starting Screencord server...');
  const serverProcess = spawn('node', ['server/dist/index.js'], {
    cwd: ROOT_DIR,
    stdio: 'inherit',
    detached: false,
  });

  // Wait for server to become healthy
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 200));
    if (await isServerRunning(PORT)) {
      console.log(`[Desktop] Server is ready at ${APP_URL}`);
      return;
    }
  }
}

function launchNativeAppWindow(url) {
  const platform = os.platform();
  console.log(`[Desktop] Launching standalone app window on ${platform}...`);

  if (platform === 'win32') {
    // Windows: Use native Edge / WebView2 App Mode (No tabs, no address bar, dedicated taskbar item)
    const edgePaths = [
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
      'msedge.exe',
    ];

    let launched = false;
    for (const exe of edgePaths) {
      try {
        const child = spawn(exe, [`--app=${url}`, '--window-size=1280,820', '--app-id=screencord'], {
          detached: true,
          stdio: 'ignore',
        });
        child.unref();
        launched = true;
        break;
      } catch (e) {
        // try next
      }
    }

    if (!launched) {
      // Fallback to start
      execSync(`start ${url}`);
    }
  } else if (platform === 'linux') {
    // Linux: Search for chromium/chrome in app mode or xdg-open
    const browsers = ['google-chrome', 'chromium', 'chromium-browser', 'brave-browser'];
    let launched = false;
    for (const b of browsers) {
      try {
        const child = spawn(b, [`--app=${url}`, '--window-size=1280,820'], {
          detached: true,
          stdio: 'ignore',
        });
        child.unref();
        launched = true;
        break;
      } catch (e) {
        // try next
      }
    }

    if (!launched) {
      execSync(`xdg-open ${url}`);
    }
  } else if (platform === 'darwin') {
    // macOS
    spawn('open', ['-na', 'Google Chrome', '--args', `--app=${url}`], { detached: true }).unref();
  }
}

async function main() {
  await startServer();
  launchNativeAppWindow(APP_URL);
  console.log('[Desktop] Screencord launched in standalone native desktop mode!');
}

main().catch(console.error);
