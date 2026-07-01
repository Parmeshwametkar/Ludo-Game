import express from 'express';
import { createServer as createHttpServer } from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { GameMode, GameState, PlayerColor, ChatMessage } from './src/types';

const app = express();
const httpServer = createHttpServer(app);
const PORT = 3000;

app.use(express.json());

// Simulated global databases for statistics, leaderboards, and user profiles
interface LeaderboardUser {
  name: string;
  avatarId: string;
  winRate: number;
  matchesPlayed: number;
  coins: number;
  xp: number;
  level: number;
}

const mockLeaderboard: LeaderboardUser[] = [
  { name: 'Ravi Kumar', avatarId: 'avatar_1', winRate: 72, matchesPlayed: 145, coins: 45000, xp: 8900, level: 12 },
  { name: 'Sarah Connor', avatarId: 'avatar_3', winRate: 65, matchesPlayed: 210, coins: 38200, xp: 7200, level: 10 },
  { name: 'Takashi M.', avatarId: 'avatar_4', winRate: 59, matchesPlayed: 98, coins: 21400, xp: 4500, level: 7 },
  { name: 'LudoMaster99', avatarId: 'avatar_2', winRate: 58, matchesPlayed: 320, coins: 124000, xp: 15600, level: 18 },
  { name: 'AI_Godmode', avatarId: 'avatar_5', winRate: 85, matchesPlayed: 50, coins: 15000, xp: 3200, level: 5 }
];

const mockHistory = [
  { id: 'm_102', date: '2026-06-30', mode: 'ONLINE', players: [{ name: 'You', color: 'RED', winner: true }, { name: 'Sarah Connor', color: 'BLUE', winner: false }, { name: 'Takashi M.', color: 'GREEN', winner: false }], winnerName: 'You', duration: '22 min' },
  { id: 'm_101', date: '2026-06-29', mode: 'AI', players: [{ name: 'You', color: 'GREEN', winner: false }, { name: 'AI (Medium)', color: 'YELLOW', winner: true }], winnerName: 'AI (Medium)', duration: '14 min' },
  { id: 'm_100', date: '2026-06-28', mode: 'LOCAL', players: [{ name: 'Player 1', color: 'RED', winner: true }, { name: 'Player 2', color: 'BLUE', winner: false }], winnerName: 'Player 1', duration: '18 min' }
];

// Profile data endpoint
app.get('/api/profile', (req, res) => {
  res.json({
    username: 'LudoPlayer',
    avatarId: 'avatar_2',
    coins: 5000,
    xp: 1200,
    level: 3,
    matchesPlayed: 12,
    wins: 6,
    achievements: [
      { id: 'first_win', name: 'First Victory', description: 'Win your first match', unlocked: true, unlockedDate: '2026-06-28' },
      { id: 'double_capture', name: 'Double Strike', description: 'Capture two tokens in a single turn', unlocked: true, unlockedDate: '2026-06-30' },
      { id: 'ludo_king', name: 'Base Master', description: 'Unlock all 4 tokens in a game', unlocked: false, progress: 75 }
    ]
  });
});

app.get('/api/leaderboard', (req, res) => {
  res.json(mockLeaderboard);
});

app.get('/api/history', (req, res) => {
  res.json(mockHistory);
});

// WebSocket Server Initialization
const wss = new WebSocketServer({ noServer: true });

// HTTP Upgrade routing for WebSockets
httpServer.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

interface ConnectedClient {
  ws: WebSocket;
  id: string;
  name: string;
  avatarId: string;
  roomId: string | null;
  color: PlayerColor | null;
}

const clients = new Map<string, ConnectedClient>();
const rooms = new Map<string, {
  id: string;
  mode: GameMode;
  clients: string[]; // Client IDs
  playerDetails: { id: string; name: string; avatarId: string; color: PlayerColor; isAI: boolean; isOnline: boolean }[];
  state: GameState | null;
}>();

let matchmakingQueue: string[] = []; // List of Client IDs waiting for a game

function broadcastToRoom(roomId: string, message: any) {
  const room = rooms.get(roomId);
  if (!room) return;
  const payload = JSON.stringify(message);
  room.clients.forEach(clientId => {
    const client = clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload);
    }
  });
}

function sendToClient(clientId: string, message: any) {
  const client = clients.get(clientId);
  if (client && client.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify(message));
  }
}

function updateLobbyList() {
  const publicRooms = Array.from(rooms.values())
    .filter(r => r.mode === 'ONLINE' && r.clients.length < 4 && !r.state?.gameStarted)
    .map(r => ({
      id: r.id,
      playerCount: r.clients.length,
      players: r.playerDetails.map(p => ({ name: p.name, color: p.color }))
    }));

  const payload = JSON.stringify({
    type: 'lobby_update',
    rooms: publicRooms,
    queueSize: matchmakingQueue.length
  });

  clients.forEach(client => {
    if (!client.roomId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload);
    }
  });
}

wss.on('connection', (ws) => {
  const clientId = 'c_' + Math.random().toString(36).substr(2, 9);
  const clientInfo: ConnectedClient = {
    ws,
    id: clientId,
    name: 'Guest_' + Math.floor(1000 + Math.random() * 9000),
    avatarId: 'avatar_' + Math.floor(1 + Math.random() * 6),
    roomId: null,
    color: null
  };
  
  clients.set(clientId, clientInfo);

  // Send initial registration response
  sendToClient(clientId, {
    type: 'registered',
    clientId,
    name: clientInfo.name,
    avatarId: clientInfo.avatarId
  });

  updateLobbyList();

  ws.on('message', (messageStr) => {
    try {
      const msg = JSON.parse(messageStr.toString());
      
      switch (msg.type) {
        case 'set_profile': {
          clientInfo.name = msg.name || clientInfo.name;
          clientInfo.avatarId = msg.avatarId || clientInfo.avatarId;
          updateLobbyList();
          break;
        }

        case 'create_room': {
          const roomId = msg.roomId || 'R_' + Math.floor(100000 + Math.random() * 900000);
          const mode: GameMode = msg.mode || 'ONLINE';
          
          const room = {
            id: roomId,
            mode,
            clients: [clientId],
            playerDetails: [{
              id: clientId,
              name: clientInfo.name,
              avatarId: clientInfo.avatarId,
              color: 'GREEN' as PlayerColor,
              isAI: false,
              isOnline: true
            }],
            state: null
          };

          rooms.set(roomId, room);
          clientInfo.roomId = roomId;
          clientInfo.color = 'GREEN';

          sendToClient(clientId, {
            type: 'room_created',
            roomId,
            color: 'GREEN'
          });

          updateLobbyList();
          break;
        }

        case 'join_room': {
          const roomId = msg.roomId;
          const room = rooms.get(roomId);
          if (!room) {
            sendToClient(clientId, { type: 'error', message: 'Room not found' });
            return;
          }

          if (room.clients.length >= 4) {
            sendToClient(clientId, { type: 'error', message: 'Room is full' });
            return;
          }

          // Assign available colors in order: GREEN, YELLOW, BLUE, RED
          const assignedColors: PlayerColor[] = ['GREEN', 'YELLOW', 'BLUE', 'RED'];
          const usedColors = room.playerDetails.map(p => p.color);
          const availableColor = assignedColors.find(c => !usedColors.includes(c)) || 'YELLOW';

          room.clients.push(clientId);
          room.playerDetails.push({
            id: clientId,
            name: clientInfo.name,
            avatarId: clientInfo.avatarId,
            color: availableColor,
            isAI: false,
            isOnline: true
          });

          clientInfo.roomId = roomId;
          clientInfo.color = availableColor;

          sendToClient(clientId, {
            type: 'room_joined',
            roomId,
            color: availableColor,
            players: room.playerDetails
          });

          // Notify other players
          broadcastToRoom(roomId, {
            type: 'player_joined',
            players: room.playerDetails
          });

          updateLobbyList();
          break;
        }

        case 'join_queue': {
          if (!matchmakingQueue.includes(clientId)) {
            matchmakingQueue.push(clientId);
          }
          sendToClient(clientId, { type: 'queue_joined' });

          // Try to match players
          if (matchmakingQueue.length >= 2) {
            // Match up to 4 players or start with what's available
            const matchedPlayers = matchmakingQueue.splice(0, Math.min(4, matchmakingQueue.length));
            const roomId = 'ARENA_' + Math.floor(100000 + Math.random() * 900000);
            const colors: PlayerColor[] = ['GREEN', 'YELLOW', 'BLUE', 'RED'];

            const playerDetails = matchedPlayers.map((id, index) => {
              const matchedClient = clients.get(id);
              return {
                id,
                name: matchedClient?.name || 'Player',
                avatarId: matchedClient?.avatarId || 'avatar_1',
                color: colors[index],
                isAI: false,
                isOnline: true
              };
            });

            const room = {
              id: roomId,
              mode: 'ONLINE' as GameMode,
              clients: matchedPlayers,
              playerDetails,
              state: null
            };

            rooms.set(roomId, room);

            matchedPlayers.forEach((id, index) => {
              const c = clients.get(id);
              if (c) {
                c.roomId = roomId;
                c.color = colors[index];
                sendToClient(id, {
                  type: 'match_found',
                  roomId,
                  color: colors[index],
                  players: playerDetails
                });
              }
            });
          }

          updateLobbyList();
          break;
        }

        case 'leave_queue': {
          matchmakingQueue = matchmakingQueue.filter(id => id !== clientId);
          sendToClient(clientId, { type: 'queue_left' });
          updateLobbyList();
          break;
        }

        case 'sync_game': {
          const roomId = clientInfo.roomId;
          if (roomId) {
            const room = rooms.get(roomId);
            if (room) {
              room.state = msg.state;
              broadcastToRoom(roomId, {
                type: 'game_synced',
                state: msg.state,
                senderId: clientId
              });
            }
          }
          break;
        }

        case 'game_action': {
          const roomId = clientInfo.roomId;
          if (roomId) {
            broadcastToRoom(roomId, {
              type: 'action_broadcast',
              action: msg.action,
              senderId: clientId
            });
          }
          break;
        }

        case 'send_chat': {
          const roomId = clientInfo.roomId;
          if (roomId) {
            const chatMsg: ChatMessage = {
              id: 'chat_' + Math.random().toString(36).substr(2, 9),
              sender: clientInfo.name,
              color: clientInfo.color || 'SYSTEM',
              text: msg.text,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            broadcastToRoom(roomId, {
              type: 'chat_received',
              message: chatMsg
            });
          }
          break;
        }

        case 'send_emoji': {
          const roomId = clientInfo.roomId;
          if (roomId) {
            broadcastToRoom(roomId, {
              type: 'emoji_received',
              senderName: clientInfo.name,
              color: clientInfo.color || 'SYSTEM',
              emoji: msg.emoji
            });
          }
          break;
        }

        case 'leave_room': {
          handleClientExit(clientId);
          break;
        }
      }
    } catch (err) {
      console.error('Error parsing WS message:', err);
    }
  });

  ws.on('close', () => {
    handleClientExit(clientId);
    clients.delete(clientId);
  });
});

function handleClientExit(clientId: string) {
  const client = clients.get(clientId);
  if (!client) return;

  // Remove from queue
  matchmakingQueue = matchmakingQueue.filter(id => id !== clientId);

  const roomId = client.roomId;
  if (roomId) {
    const room = rooms.get(roomId);
    if (room) {
      // Remove client from room lists
      room.clients = room.clients.filter(id => id !== clientId);
      room.playerDetails = room.playerDetails.filter(p => p.id !== clientId);

      if (room.clients.length === 0) {
        // Destroy room if empty
        rooms.delete(roomId);
      } else {
        // Broadcast leaving event
        broadcastToRoom(roomId, {
          type: 'player_left',
          clientId,
          players: room.playerDetails
        });

        // Set left player as AI so the game doesn't stall
        if (room.state) {
          const updatedPlayers = room.state.players.map(p => {
            if (p.color === client.color) {
              return { ...p, isAI: true, isOnline: false, name: p.name + ' (AI)' };
            }
            return p;
          });
          room.state.players = updatedPlayers;
          broadcastToRoom(roomId, {
            type: 'game_synced',
            state: room.state
          });
        }
      }
    }
  }

  client.roomId = null;
  client.color = null;
  updateLobbyList();
}

// Serve static assets in production or integrate Vite dev middleware in development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Ludo game server running on port ${PORT}`);
  });
}

startServer();
