import { spawn } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchAppWindow } from './desktop-launcher.mjs';

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
    req.setTimeout(800, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function ensureServerRunning() {
  if (await isServerRunning(PORT)) {
    console.log(`[Desktop] Server already active at ${APP_URL}`);
    return;
  }

  console.log('[Desktop] Starting Screencord server...');
  spawn('node', ['server/dist/index.js'], {
    cwd: ROOT_DIR,
    stdio: 'inherit',
    detached: false,
  });

  for (let i = 0; i < 25; i++) {
    await new Promise((r) => setTimeout(r, 200));
    if (await isServerRunning(PORT)) {
      console.log(`[Desktop] Server is ready at ${APP_URL}`);
      return;
    }
  }
}

async function main() {
  await ensureServerRunning();
  const result = launchAppWindow({ url: APP_URL });
  console.log(
    result.mode === 'standalone'
      ? `[Desktop] Screencord launched in standalone native desktop mode (${result.runtime})`
      : '[Desktop] Screencord opened via default browser fallback.'
  );
}

main().catch(console.error);
