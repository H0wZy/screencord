import http from 'http';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { RoomManager } from './rooms.js';
import { ClientMessage, ServerMessage, ChatMessage } from './types.js';
import { getNetworkAddresses } from './network.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLIENT_DIST = path.resolve(__dirname, '../../client/dist');

const PORT = parseInt(process.env.PORT || '3001', 10);
const roomManager = new RoomManager();

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'screencord-signaling', port: PORT }));
    return;
  }

  if (req.url === '/network-info') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(getNetworkAddresses(PORT)));
    return;
  }

  // Serve static files from client/dist if available
  if (fs.existsSync(CLIENT_DIST)) {
    const parsedUrl = new URL(req.url || '/', `http://${req.headers.host}`);
    let filePath = path.join(CLIENT_DIST, parsedUrl.pathname === '/' ? 'index.html' : parsedUrl.pathname);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
      return;
    }

    // SPA fallback to index.html
    const indexHtml = path.join(CLIENT_DIST, 'index.html');
    if (fs.existsSync(indexHtml)) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      fs.createReadStream(indexHtml).pipe(res);
      return;
    }
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok', service: 'screencord-signaling', port: PORT }));
});

const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url || '', `http://${request.headers.host}`).pathname;
  if (pathname === '/ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

function sendMessage(ws: WebSocket, message: ServerMessage) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

wss.on('connection', (ws: WebSocket) => {
  ws.on('message', (raw) => {
    try {
      const data = JSON.parse(raw.toString()) as ClientMessage;

      switch (data.type) {
        case 'join-room': {
          const { roomId, nickname } = data.payload;
          const { self, existing } = roomManager.joinRoom(roomId, nickname, ws);

          // 1. Send room-joined confirmation with current peers
          sendMessage(ws, {
            type: 'room-joined',
            payload: {
              selfId: self.id,
              roomId,
              existingParticipants: existing,
            },
          });

          // 2. Broadcast new peer arrival to all existing peers in the room
          const peers = roomManager.getRoomPeers(roomId);
          for (const peer of peers) {
            if (peer.peerId !== self.id) {
              sendMessage(peer.socket, {
                type: 'user-joined',
                payload: self,
              });
            }
          }
          break;
        }

        case 'signal-offer': {
          const { targetPeerId, sdp } = data.payload;
          const targetSocket = roomManager.getSocketByPeerId(targetPeerId);
          const session = roomManager.getSession(ws);
          if (targetSocket && session) {
            sendMessage(targetSocket, {
              type: 'signal-offer',
              payload: {
                fromPeerId: session.peerId,
                sdp,
              },
            });
          }
          break;
        }

        case 'signal-answer': {
          const { targetPeerId, sdp } = data.payload;
          const targetSocket = roomManager.getSocketByPeerId(targetPeerId);
          const session = roomManager.getSession(ws);
          if (targetSocket && session) {
            sendMessage(targetSocket, {
              type: 'signal-answer',
              payload: {
                fromPeerId: session.peerId,
                sdp,
              },
            });
          }
          break;
        }

        case 'signal-ice-candidate': {
          const { targetPeerId, candidate } = data.payload;
          const targetSocket = roomManager.getSocketByPeerId(targetPeerId);
          const session = roomManager.getSession(ws);
          if (targetSocket && session) {
            sendMessage(targetSocket, {
              type: 'signal-ice-candidate',
              payload: {
                fromPeerId: session.peerId,
                candidate,
              },
            });
          }
          break;
        }

        case 'state-update': {
          const res = roomManager.updateState(ws, data.payload);
          if (res) {
            const peers = roomManager.getRoomPeers(res.roomId);
            for (const peer of peers) {
              if (peer.peerId !== res.peerId) {
                sendMessage(peer.socket, {
                  type: 'user-state-changed',
                  payload: {
                    peerId: res.peerId,
                    state: res.updatedState,
                  },
                });
              }
            }
          }
          break;
        }

        case 'send-chat': {
          const session = roomManager.getSession(ws);
          if (session && data.payload?.text?.trim()) {
            const participant = roomManager.getParticipant(session.roomId, session.peerId);
            const chatMsg: ChatMessage = {
              id: crypto.randomUUID(),
              senderId: session.peerId,
              nickname: participant?.nickname || 'Gamer',
              text: data.payload.text.trim(),
              timestamp: Date.now(),
            };
            const peers = roomManager.getRoomPeers(session.roomId);
            for (const p of peers) {
              sendMessage(p.socket, {
                type: 'chat-message',
                payload: chatMsg,
              });
            }
          }
          break;
        }
      }
    } catch (err) {
      console.error('Error handling WebSocket message:', err);
    }
  });

  ws.on('close', () => {
    const left = roomManager.leaveRoom(ws);
    if (left) {
      const peers = roomManager.getRoomPeers(left.roomId);
      for (const peer of peers) {
        sendMessage(peer.socket, {
          type: 'user-left',
          payload: { peerId: left.peerId },
        });
      }
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  const net = getNetworkAddresses(PORT);
  console.log(`🚀 Screencord Signaling Server running at:`);
  console.log(`   - Localhost:       ${net.localhost}`);
  for (const lan of net.lan) {
    console.log(`   - Local Wi-Fi/LAN: ${lan}`);
  }
  for (const vpn of net.vpn) {
    console.log(`   - VPN (${vpn.type}):      ${vpn.url} (${vpn.iface})`);
  }
  console.log(`   (WebSocket endpoint: /ws)\n`);
});
