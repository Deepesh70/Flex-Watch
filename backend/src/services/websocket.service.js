const { WebSocketServer, WebSocket } = require('ws');
const { logger } = require('../middlewares/logger');

class WebSocketService {
  constructor() {
    this.wss = null;
    // Map: roomKey -> Set of WebSockets
    this.rooms = new Map();
    this.heartbeatInterval = null;
  }

  init(server) {
    if (this.wss) return;

    this.wss = new WebSocketServer({
      server,
      path: '/ws/seats',
    });

    this.wss.on('connection', (ws) => {
      ws.isAlive = true;
      ws.currentRoom = null;

      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString());
          this._handleClientMessage(ws, msg);
        } catch (err) {
          logger.debug({ err: err.message }, 'Invalid WS message format');
        }
      });

      ws.on('close', () => {
        this._leaveRoom(ws);
      });

      ws.on('error', (err) => {
        logger.debug({ err: err.message }, 'WebSocket client error');
        this._leaveRoom(ws);
      });

      ws.send(JSON.stringify({ type: 'CONNECTED', message: 'Flex-Watch Live Seat Gateway' }));
    });

    this.heartbeatInterval = setInterval(() => {
      if (!this.wss) return;
      this.wss.clients.forEach((ws) => {
        if (!ws.isAlive) {
          this._leaveRoom(ws);
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000).unref();

    logger.info('🛰️ Flex-Watch WebSocket Seat Gateway initialized on /ws/seats');
  }

  _getRoomKey(movieId, showtime) {
    const timeKey = new Date(showtime).toISOString();
    return `showtime:${movieId}:${timeKey}`;
  }

  _handleClientMessage(ws, msg) {
    if (msg.action === 'subscribe' && msg.movieId && msg.showtime) {
      this._leaveRoom(ws);
      const roomKey = this._getRoomKey(msg.movieId, msg.showtime);
      if (!this.rooms.has(roomKey)) {
        this.rooms.set(roomKey, new Set());
      }
      this.rooms.get(roomKey).add(ws);
      ws.currentRoom = roomKey;

      ws.send(JSON.stringify({
        type: 'SUBSCRIBED',
        room: roomKey,
        movieId: msg.movieId,
        showtime: msg.showtime,
      }));
    } else if (msg.action === 'unsubscribe') {
      this._leaveRoom(ws);
    }
  }

  _leaveRoom(ws) {
    if (ws.currentRoom && this.rooms.has(ws.currentRoom)) {
      const room = this.rooms.get(ws.currentRoom);
      room.delete(ws);
      if (room.size === 0) {
        this.rooms.delete(ws.currentRoom);
      }
      ws.currentRoom = null;
    }
  }

  broadcast(movieId, showtime, event) {
    const roomKey = this._getRoomKey(movieId, showtime);
    const room = this.rooms.get(roomKey);
    if (!room || room.size === 0) return;

    const payload = JSON.stringify(event);
    for (const client of room) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }

  close() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
    this.rooms.clear();
  }
}

const websocketService = new WebSocketService();

module.exports = { websocketService, WebSocketService };
