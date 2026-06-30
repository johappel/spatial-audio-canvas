// Minimaler WebSocket-Signalling-Server fuer das WebRTC-Mesh.
// Er vermittelt nur den Verbindungsaufbau; es laufen keine Audiodaten hierueber.
// Start: npm run signaling   (Standardport 8787, ueberschreibbar via PORT)
import { WebSocketServer } from 'ws';

const PORT = process.env.PORT ? Number(process.env.PORT) : 8766;
const wss = new WebSocketServer({ port: PORT });

/** roomId -> Map(peerId -> ws) */
const rooms = new Map();

function send(ws, message) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

wss.on('connection', (ws) => {
  let roomId = null;
  let peerId = null;

  ws.on('message', (raw) => {
    let message;
    try {
      message = JSON.parse(raw.toString());
    } catch {
      return;
    }

    switch (message.kind) {
      case 'join': {
        roomId = message.roomId;
        peerId = message.peerId;
        if (!rooms.has(roomId)) {
          rooms.set(roomId, new Map());
        }
        const room = rooms.get(roomId);
        room.set(peerId, ws);
        const peers = [...room.keys()];
        for (const client of room.values()) {
          send(client, { kind: 'peers', peers });
        }
        break;
      }
      case 'offer':
      case 'answer':
      case 'ice': {
        const room = rooms.get(roomId);
        const target = room?.get(message.to);
        if (target) {
          send(target, message);
        }
        break;
      }
      default:
        break;
    }
  });

  ws.on('close', () => {
    if (!roomId || !peerId) {
      return;
    }
    const room = rooms.get(roomId);
    if (!room) {
      return;
    }
    room.delete(peerId);
    for (const client of room.values()) {
      send(client, { kind: 'leave', peerId });
    }
    if (room.size === 0) {
      rooms.delete(roomId);
    }
  });
});

console.log(`[signaling] WebSocket-Server laeuft auf ws://localhost:${PORT}`);