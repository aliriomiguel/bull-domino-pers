import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  createDoubleSixSet,
  shuffleTiles,
  getPlayableMoves,
  applyMove,
  calculateAllFivesScore,
  evaluateRoundEnd,
  chooseAIMove,
} from './src/game/dominoCore.js';
import { GameMode, DominoTile, PlacedTile, PlayerProfile, MatchType } from './src/types/domino.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/api/ws' });

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'bull-domino',
    websocketPath: '/api/ws',
    timestamp: new Date().toISOString(),
  });
});

interface ServerPlayer {
  id: string;
  name: string;
  profile: PlayerProfile;
  ws: WebSocket | null;
  hand: DominoTile[];
  score: number;
  connected: boolean;
  team: 1 | 2;
  seatIndex: number;
  isBot?: boolean;
}

interface ServerRoom {
  id: string;
  isPrivate: boolean;
  mode: GameMode;
  matchType: MatchType;
  targetScore: number;
  turnTimeLimit: number; // seconds
  players: ServerPlayer[];
  hostId: string;
  status: 'waiting' | 'playing' | 'round_over' | 'game_over';
  board: PlacedTile[];
  leftEnd: number | null;
  rightEnd: number | null;
  boneyard: DominoTile[];
  currentTurnIndex: number;
  turnTimeRemaining: number;
  turnTimerInterval?: NodeJS.Timeout | null;
  winnerId: string | null;
  winningTeam?: 1 | 2 | null;
  roundWinnerId: string | null;
  roundWinningTeam?: 1 | 2 | null;
  roundPointsAwarded: number;
  roundEndReason: 'domino' | 'blocked' | null;
  consecutivePasses: number;
  team1Score: number;
  team2Score: number;
  rematchVotes: Set<string>;
}

const rooms = new Map<string, ServerRoom>();
const cloudSaves = new Map<string, any>();

// In-memory global seasonal leaderboard
const SEASON_LEADERBOARD = [
  { id: 'bot-1', name: 'DominoKing_99', title: 'Havana Legend', seasonTier: 'Domino Legend', rankPoints: 4850, winRate: 78, dominoesCount: 312 },
  { id: 'bot-2', name: 'BoneMaster_X', title: 'Spinner Master', seasonTier: 'Diamond', rankPoints: 4210, winRate: 72, dominoesCount: 245 },
  { id: 'bot-3', name: 'TacticalDouble', title: 'Master Tactician', seasonTier: 'Diamond', rankPoints: 3980, winRate: 69, dominoesCount: 210 },
  { id: 'bot-4', name: 'IvoryQueen', title: 'Grand Strategist', seasonTier: 'Platinum', rankPoints: 3450, winRate: 64, dominoesCount: 180 },
  { id: 'bot-5', name: 'PipSniper', title: 'Block Specialist', seasonTier: 'Platinum', rankPoints: 3120, winRate: 61, dominoesCount: 145 },
  { id: 'bot-6', name: 'LuckySixer', title: 'High Roller', seasonTier: 'Gold', rankPoints: 2750, winRate: 58, dominoesCount: 120 },
  { id: 'bot-7', name: 'FivesChaser', title: 'Speed Demon', seasonTier: 'Gold', rankPoints: 2420, winRate: 55, dominoesCount: 95 },
  { id: 'bot-8', name: 'BoneyardGhost', title: 'Silent Shark', seasonTier: 'Silver', rankPoints: 1980, winRate: 52, dominoesCount: 78 },
];

const BOT_ROSTER = [
  { name: 'Tactician Bot', title: 'Spinner Master', skin: '#8d5524', accessory: 'fedora', bgColor: '#047857', badge: '🤖' },
  { name: 'Ivory Queen', title: 'Grand Strategist', skin: '#e0ac69', accessory: 'crown', bgColor: '#7c3aed', badge: '👑' },
  { name: 'Pip Sniper', title: 'Block Specialist', skin: '#fcd34d', accessory: 'glasses', bgColor: '#b91c1c', badge: '🎯' },
  { name: 'Bone Master', title: 'Havana Legend', skin: '#ffdbac', accessory: 'bandana', bgColor: '#0284c7', badge: '🎲' },
];

function createBotPlayer(seatIndex: number, team: 1 | 2): ServerPlayer {
  const info = BOT_ROSTER[seatIndex % BOT_ROSTER.length];
  const botId = `bot-${Date.now()}-${seatIndex}-${Math.random().toString(36).substring(2, 6)}`;
  return {
    id: botId,
    name: info.name,
    profile: {
      id: botId,
      name: info.name,
      title: info.title,
      rankPoints: 1750,
      seasonTier: 'Gold',
      avatarSeed: {
        skin: info.skin,
        accessory: info.accessory,
        bgColor: info.bgColor,
        dominoBadge: info.badge,
        expression: 'neutral',
      },
      stats: {
        matchesPlayed: 35,
        matchesWon: 22,
        dominoesCount: 14,
        highestScore: 48,
        winStreak: 3,
        bestWinStreak: 5,
      },
    },
    ws: null,
    hand: [],
    score: 0,
    connected: true,
    team,
    seatIndex,
    isBot: true,
  };
}

// Helper to broadcast to all players in a room
function broadcastToRoom(room: ServerRoom, type: string, payload: any) {
  const message = JSON.stringify({ type, payload });
  for (const player of room.players) {
    if (player.ws && player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(message);
    }
  }
}

// Generate client-safe sanitized room state (hiding opponent hands!)
function getClientRoomState(room: ServerRoom, forPlayerId: string) {
  return {
    roomId: room.id,
    mode: room.mode,
    matchType: room.matchType,
    targetScore: room.targetScore,
    status: room.status,
    hostId: room.hostId,
    leftEnd: room.leftEnd,
    rightEnd: room.rightEnd,
    board: room.board,
    boneyardCount: room.boneyard.length,
    currentTurnIndex: room.currentTurnIndex,
    turnPlayerId: room.players[room.currentTurnIndex]?.id || null,
    turnTimeRemaining: room.turnTimeRemaining,
    turnTimeLimit: room.turnTimeLimit,
    winnerId: room.winnerId,
    winningTeam: room.winningTeam,
    roundWinnerId: room.roundWinnerId,
    roundWinningTeam: room.roundWinningTeam,
    roundPointsAwarded: room.roundPointsAwarded,
    roundEndReason: room.roundEndReason,
    team1Score: room.team1Score,
    team2Score: room.team2Score,
    rematchVotesCount: room.rematchVotes.size,
    maxPlayers: room.matchType === '2v2' ? 4 : 2,
    players: room.players.map((p, idx) => ({
      id: p.id,
      name: p.name,
      profile: p.profile,
      score: p.score,
      team: p.team,
      seatIndex: p.seatIndex,
      isBot: p.isBot || false,
      handCount: p.hand.length,
      // Only disclose actual hand to the requesting player (or when round is over)
      hand: (p.id === forPlayerId || room.status === 'round_over' || room.status === 'game_over') ? p.hand : [],
      isCurrentTurn: idx === room.currentTurnIndex,
      connected: p.connected,
    })),
  };
}

function syncRoomToAll(room: ServerRoom) {
  for (const player of room.players) {
    if (player.ws && player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(JSON.stringify({
        type: 'ROOM_UPDATE',
        payload: getClientRoomState(room, player.id),
      }));
    }
  }
}

function scheduleBotMoveIfNeeded(room: ServerRoom) {
  if (room.status !== 'playing') return;
  const currentP = room.players[room.currentTurnIndex];
  if (!currentP || !currentP.isBot) return;

  setTimeout(() => {
    if (room.status !== 'playing') return;
    const nowP = room.players[room.currentTurnIndex];
    if (!nowP || nowP.id !== currentP.id) return;

    const aiMove = chooseAIMove(
      nowP.hand,
      room.board,
      room.leftEnd,
      room.rightEnd,
      'tactician'
    );

    if (aiMove) {
      executeMove(room, nowP.id, aiMove.tile.id, aiMove.end);
    } else if (room.mode !== 'block' && room.boneyard.length > 0) {
      executeDraw(room, nowP.id);
    } else {
      executePass(room, nowP.id);
    }
  }, 1100);
}

function startTurnTimer(room: ServerRoom) {
  if (room.turnTimerInterval) {
    clearInterval(room.turnTimerInterval);
    room.turnTimerInterval = null;
  }

  if (room.turnTimeLimit <= 0 || room.status !== 'playing') return;

  room.turnTimeRemaining = room.turnTimeLimit;

  room.turnTimerInterval = setInterval(() => {
    room.turnTimeRemaining -= 1;
    if (room.turnTimeRemaining <= 0) {
      clearInterval(room.turnTimerInterval!);
      room.turnTimerInterval = null;
      handleTurnTimeout(room);
    } else {
      broadcastToRoom(room, 'TIMER_TICK', { remaining: room.turnTimeRemaining });
    }
  }, 1000);

  // If next player is an automated bot, schedule their turn
  scheduleBotMoveIfNeeded(room);
}

function handleTurnTimeout(room: ServerRoom) {
  if (room.status !== 'playing') return;
  const player = room.players[room.currentTurnIndex];
  if (!player) return;

  // Auto-play: try to play first playable move, or draw/pass
  const validMoves = getPlayableMoves(player.hand, room.leftEnd, room.rightEnd);
  if (validMoves.length > 0) {
    executeMove(room, player.id, validMoves[0].tile.id, validMoves[0].end);
  } else if (room.mode !== 'block' && room.boneyard.length > 0) {
    executeDraw(room, player.id);
  } else {
    executePass(room, player.id);
  }
}

function startRound(room: ServerRoom) {
  room.status = 'playing';
  room.board = [];
  room.leftEnd = null;
  room.rightEnd = null;
  room.roundWinnerId = null;
  room.roundWinningTeam = null;
  room.roundPointsAwarded = 0;
  room.roundEndReason = null;
  room.consecutivePasses = 0;
  room.rematchVotes.clear();

  const fullSet = shuffleTiles(createDoubleSixSet());
  
  // Deal tiles: 7 tiles per player always in standard dominoes (28 tiles total in 2v2!)
  const tilesPerPlayer = 7;
  for (const p of room.players) {
    p.hand = fullSet.splice(0, tilesPerPlayer);
  }
  // In 2v2 (4 players x 7 tiles = 28), boneyard is empty!
  room.boneyard = room.matchType === '2v2' ? [] : fullSet;

  // Determine starting player: player with highest double [6|6], [5|5], etc.
  let startIdx = 0;
  let highestDouble = -1;
  room.players.forEach((p, idx) => {
    for (const t of p.hand) {
      if (t.left === t.right && t.left > highestDouble) {
        highestDouble = t.left;
        startIdx = idx;
      }
    }
  });

  room.currentTurnIndex = startIdx;
  syncRoomToAll(room);
  startTurnTimer(room);
}

function executeMove(
  room: ServerRoom,
  playerId: string,
  tileId: string,
  end: 'left' | 'right',
  direction?: any
) {
  const currentP = room.players[room.currentTurnIndex];
  if (!currentP || currentP.id !== playerId) return;

  const tileIndex = currentP.hand.findIndex(t => t.id === tileId);
  if (tileIndex === -1) return;
  const tile = currentP.hand[tileIndex];

  try {
    const result = applyMove(room.board, room.leftEnd, room.rightEnd, tile, end, direction);
    room.board = result.board;
    room.leftEnd = result.newLeftEnd;
    room.rightEnd = result.newRightEnd;
    currentP.hand.splice(tileIndex, 1);
    room.consecutivePasses = 0;

    // Check All-Fives bonus score
    if (room.mode === 'all-fives') {
      const bonus = calculateAllFivesScore(room.leftEnd, room.rightEnd);
      if (bonus > 0) {
        currentP.score += bonus;
        if (room.matchType === '2v2') {
          if (currentP.team === 1) room.team1Score += bonus;
          else room.team2Score += bonus;
        }
        broadcastToRoom(room, 'ALL_FIVES_SCORE', {
          playerId: currentP.id,
          playerName: currentP.name,
          team: currentP.team,
          points: bonus,
          newTotal: currentP.score,
        });
      }
    }

    // Check round end
    const is2v2 = room.matchType === '2v2';
    const roundEval = evaluateRoundEnd(
      room.players.map(p => ({ id: p.id, hand: p.hand, team: p.team })),
      room.boneyard.length,
      room.leftEnd,
      room.rightEnd,
      room.mode,
      is2v2
    );

    if (roundEval.isOver) {
      if (room.turnTimerInterval) clearInterval(room.turnTimerInterval);
      room.status = 'round_over';
      room.roundWinnerId = roundEval.winnerPlayerId;
      room.roundWinningTeam = roundEval.winningTeam;
      room.roundPointsAwarded = roundEval.pointsAwarded;
      room.roundEndReason = roundEval.reason;

      if (is2v2 && roundEval.winningTeam) {
        if (roundEval.winningTeam === 1) {
          room.team1Score += roundEval.pointsAwarded;
        } else {
          room.team2Score += roundEval.pointsAwarded;
        }
        for (const p of room.players) {
          p.score = p.team === 1 ? room.team1Score : room.team2Score;
        }

        if (room.team1Score >= room.targetScore) {
          room.status = 'game_over';
          room.winningTeam = 1;
        } else if (room.team2Score >= room.targetScore) {
          room.status = 'game_over';
          room.winningTeam = 2;
        }
      } else if (roundEval.winnerPlayerId) {
        const winner = room.players.find(p => p.id === roundEval.winnerPlayerId);
        if (winner) {
          winner.score += roundEval.pointsAwarded;
          if (winner.score >= room.targetScore) {
            room.status = 'game_over';
            room.winnerId = winner.id;
          }
        }
      }

      syncRoomToAll(room);
      return;
    }

    // Advance turn to next player in clockwise rotation (0 -> 1 -> 2 -> 3)
    room.currentTurnIndex = (room.currentTurnIndex + 1) % room.players.length;
    syncRoomToAll(room);
    startTurnTimer(room);
  } catch (err) {
    console.error('Invalid move attempted:', err);
  }
}

function executeDraw(room: ServerRoom, playerId: string) {
  const currentP = room.players[room.currentTurnIndex];
  if (!currentP || currentP.id !== playerId) return;
  if (room.boneyard.length === 0) return;

  const drawnTile = room.boneyard.pop()!;
  currentP.hand.push(drawnTile);

  syncRoomToAll(room);
  // Re-check if bot can now move
  scheduleBotMoveIfNeeded(room);
}

function executePass(room: ServerRoom, playerId: string) {
  const currentP = room.players[room.currentTurnIndex];
  if (!currentP || currentP.id !== playerId) return;

  room.consecutivePasses += 1;

  // If every player passes consecutively, round is blocked
  if (room.consecutivePasses >= room.players.length) {
    const is2v2 = room.matchType === '2v2';
    const roundEval = evaluateRoundEnd(
      room.players.map(p => ({ id: p.id, hand: p.hand, team: p.team })),
      0, // Force check as boneyard empty/exhausted
      room.leftEnd,
      room.rightEnd,
      room.mode,
      is2v2
    );

    if (roundEval.isOver) {
      if (room.turnTimerInterval) clearInterval(room.turnTimerInterval);
      room.status = 'round_over';
      room.roundWinnerId = roundEval.winnerPlayerId;
      room.roundWinningTeam = roundEval.winningTeam;
      room.roundPointsAwarded = roundEval.pointsAwarded;
      room.roundEndReason = 'blocked';

      if (is2v2 && roundEval.winningTeam) {
        if (roundEval.winningTeam === 1) {
          room.team1Score += roundEval.pointsAwarded;
        } else {
          room.team2Score += roundEval.pointsAwarded;
        }
        for (const p of room.players) {
          p.score = p.team === 1 ? room.team1Score : room.team2Score;
        }

        if (room.team1Score >= room.targetScore) {
          room.status = 'game_over';
          room.winningTeam = 1;
        } else if (room.team2Score >= room.targetScore) {
          room.status = 'game_over';
          room.winningTeam = 2;
        }
      } else if (roundEval.winnerPlayerId) {
        const winner = room.players.find(p => p.id === roundEval.winnerPlayerId);
        if (winner) {
          winner.score += roundEval.pointsAwarded;
          if (winner.score >= room.targetScore) {
            room.status = 'game_over';
            room.winnerId = winner.id;
          }
        }
      }

      syncRoomToAll(room);
      return;
    }
  }

  room.currentTurnIndex = (room.currentTurnIndex + 1) % room.players.length;
  syncRoomToAll(room);
  startTurnTimer(room);
}

// WebSocket Connection Router
wss.on('connection', (ws: WebSocket) => {
  let boundPlayerId: string | null = null;
  let boundRoomId: string | null = null;

  ws.on('message', (data: string) => {
    try {
      const msg = JSON.parse(data.toString());
      const { type, payload } = msg;

      switch (type) {
        case 'CREATE_ROOM': {
          const roomId = (payload.customCode || Math.random().toString(36).substring(2, 8)).toUpperCase();
          const matchType: MatchType = payload.matchType === '2v2' ? '2v2' : '1v1';
          const newRoom: ServerRoom = {
            id: roomId,
            isPrivate: payload.isPrivate !== false,
            mode: payload.mode || 'draw',
            matchType,
            targetScore: payload.targetScore || 100,
            turnTimeLimit: payload.turnTimeLimit ?? 30,
            players: [{
              id: payload.profile.id,
              name: payload.profile.name,
              profile: payload.profile,
              ws,
              hand: [],
              score: 0,
              connected: true,
              team: 1,
              seatIndex: 0,
              isBot: false,
            }],
            hostId: payload.profile.id,
            status: 'waiting',
            board: [],
            leftEnd: null,
            rightEnd: null,
            boneyard: [],
            currentTurnIndex: 0,
            turnTimeRemaining: payload.turnTimeLimit ?? 30,
            winnerId: null,
            winningTeam: null,
            roundWinnerId: null,
            roundWinningTeam: null,
            roundPointsAwarded: 0,
            roundEndReason: null,
            consecutivePasses: 0,
            team1Score: 0,
            team2Score: 0,
            rematchVotes: new Set(),
          };

          rooms.set(roomId, newRoom);
          boundPlayerId = payload.profile.id;
          boundRoomId = roomId;

          ws.send(JSON.stringify({
            type: 'ROOM_CREATED',
            payload: { roomId },
          }));
          syncRoomToAll(newRoom);
          break;
        }

        case 'SYNC_ROOM': {
          // A client may miss the broadcast that transitions a room to playing.
          // Return the latest state to the requesting player without rebroadcasting
          // to every other participant.
          if (!boundRoomId || !boundPlayerId) break;
          const room = rooms.get(boundRoomId);
          const player = room?.players.find(p => p.id === boundPlayerId);
          if (room && player && player.ws === ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'ROOM_UPDATE',
              payload: getClientRoomState(room, boundPlayerId),
            }));
          }
          break;
        }

        case 'JOIN_ROOM': {
          const roomId = (payload.roomId || '').toUpperCase();
          const room = rooms.get(roomId);
          if (!room) {
            ws.send(JSON.stringify({ type: 'ERROR', payload: { message: `Sala ${roomId} no encontrada.` } }));
            return;
          }

          const maxPlayers = room.matchType === '2v2' ? 4 : 2;
          const existingPlayer = room.players.find(p => p.id === payload.profile.id);

          if (!existingPlayer && room.players.length >= maxPlayers) {
            ws.send(JSON.stringify({ type: 'ERROR', payload: { message: 'La sala ya está llena.' } }));
            return;
          }

          boundPlayerId = payload.profile.id;
          boundRoomId = roomId;

          if (existingPlayer) {
            existingPlayer.ws = ws;
            existingPlayer.connected = true;
          } else {
            const occupiedSeats = new Set(room.players.map(p => p.seatIndex));
            let nextSeat = 0;
            for (let i = 0; i < maxPlayers; i++) {
              if (!occupiedSeats.has(i)) {
                nextSeat = i;
                break;
              }
            }
            const team: 1 | 2 = room.matchType === '2v2'
              ? ((nextSeat === 0 || nextSeat === 2) ? 1 : 2)
              : (nextSeat === 0 ? 1 : 2);

            room.players.push({
              id: payload.profile.id,
              name: payload.profile.name,
              profile: payload.profile,
              ws,
              hand: [],
              score: 0,
              connected: true,
              team,
              seatIndex: nextSeat,
              isBot: false,
            });
            room.players.sort((a, b) => a.seatIndex - b.seatIndex);
          }

          syncRoomToAll(room);

          if (room.status === 'waiting' && room.players.length === maxPlayers) {
            startRound(room);
          }
          break;
        }

        case 'QUICK_MATCH': {
          const matchType: MatchType = payload.matchType === '2v2' ? '2v2' : '1v1';
          const mode: GameMode = payload.mode || 'draw';
          const maxPlayers = matchType === '2v2' ? 4 : 2;

          let foundRoom: ServerRoom | null = null;
          for (const r of rooms.values()) {
            if (!r.isPrivate && r.status === 'waiting' && r.matchType === matchType && r.players.length < maxPlayers) {
              foundRoom = r;
              break;
            }
          }

          if (foundRoom) {
            boundPlayerId = payload.profile.id;
            boundRoomId = foundRoom.id;
            const occupiedSeats = new Set(foundRoom.players.map(p => p.seatIndex));
            let nextSeat = 0;
            for (let i = 0; i < maxPlayers; i++) {
              if (!occupiedSeats.has(i)) {
                nextSeat = i;
                break;
              }
            }
            const team: 1 | 2 = matchType === '2v2'
              ? ((nextSeat === 0 || nextSeat === 2) ? 1 : 2)
              : (nextSeat === 0 ? 1 : 2);

            foundRoom.players.push({
              id: payload.profile.id,
              name: payload.profile.name,
              profile: payload.profile,
              ws,
              hand: [],
              score: 0,
              connected: true,
              team,
              seatIndex: nextSeat,
              isBot: false,
            });
            foundRoom.players.sort((a, b) => a.seatIndex - b.seatIndex);

            syncRoomToAll(foundRoom);
            if (foundRoom.players.length === maxPlayers) {
              startRound(foundRoom);
            }
          } else {
            const qRoomId = 'QM' + Math.random().toString(36).substring(2, 6).toUpperCase();
            const newRoom: ServerRoom = {
              id: qRoomId,
              isPrivate: false,
              mode,
              matchType,
              targetScore: 100,
              turnTimeLimit: 30,
              players: [{
                id: payload.profile.id,
                name: payload.profile.name,
                profile: payload.profile,
                ws,
                hand: [],
                score: 0,
                connected: true,
                team: 1,
                seatIndex: 0,
                isBot: false,
              }],
              hostId: payload.profile.id,
              status: 'waiting',
              board: [],
              leftEnd: null,
              rightEnd: null,
              boneyard: [],
              currentTurnIndex: 0,
              turnTimeRemaining: 30,
              winnerId: null,
              winningTeam: null,
              roundWinnerId: null,
              roundWinningTeam: null,
              roundPointsAwarded: 0,
              roundEndReason: null,
              consecutivePasses: 0,
              team1Score: 0,
              team2Score: 0,
              rematchVotes: new Set(),
            };
            rooms.set(qRoomId, newRoom);
            boundPlayerId = payload.profile.id;
            boundRoomId = qRoomId;
            syncRoomToAll(newRoom);
          }
          break;
        }

        case 'ADD_BOT': {
          if (!boundRoomId) return;
          const room = rooms.get(boundRoomId);
          if (!room || room.status !== 'waiting') return;
          const maxPlayers = room.matchType === '2v2' ? 4 : 2;
          if (room.players.length >= maxPlayers) return;

          const occupiedSeats = new Set(room.players.map(p => p.seatIndex));
          let nextSeat = 0;
          for (let i = 0; i < maxPlayers; i++) {
            if (!occupiedSeats.has(i)) {
              nextSeat = i;
              break;
            }
          }
          const team: 1 | 2 = room.matchType === '2v2'
            ? ((nextSeat === 0 || nextSeat === 2) ? 1 : 2)
            : (nextSeat === 0 ? 1 : 2);

          const botPlayer = createBotPlayer(nextSeat, team);
          room.players.push(botPlayer);
          room.players.sort((a, b) => a.seatIndex - b.seatIndex);
          syncRoomToAll(room);

          if (room.players.length === maxPlayers) {
            startRound(room);
          }
          break;
        }

        case 'KICK_BOT': {
          if (!boundRoomId) return;
          const room = rooms.get(boundRoomId);
          if (!room || room.status !== 'waiting') return;
          const botIdx = payload?.botId
            ? room.players.findIndex(p => p.id === payload.botId && p.isBot)
            : [...room.players].reverse().findIndex(p => p.isBot);

          if (botIdx !== -1) {
            const realIdx = payload?.botId ? botIdx : (room.players.length - 1 - botIdx);
            room.players.splice(realIdx, 1);
            syncRoomToAll(room);
          }
          break;
        }

        case 'FILL_BOTS_AND_START':
        case 'START_GAME': {
          if (!boundRoomId) return;
          const room = rooms.get(boundRoomId);
          if (!room || room.status !== 'waiting') return;
          const maxPlayers = room.matchType === '2v2' ? 4 : 2;

          while (room.players.length < maxPlayers) {
            const occupiedSeats = new Set(room.players.map(p => p.seatIndex));
            let nextSeat = 0;
            for (let i = 0; i < maxPlayers; i++) {
              if (!occupiedSeats.has(i)) {
                nextSeat = i;
                break;
              }
            }
            const team: 1 | 2 = room.matchType === '2v2'
              ? ((nextSeat === 0 || nextSeat === 2) ? 1 : 2)
              : (nextSeat === 0 ? 1 : 2);

            room.players.push(createBotPlayer(nextSeat, team));
          }

          room.players.sort((a, b) => a.seatIndex - b.seatIndex);
          startRound(room);
          break;
        }

        case 'LEAVE_ROOM': {
          if (!boundRoomId || !boundPlayerId) return;
          const room = rooms.get(boundRoomId);
          if (room) {
            if (room.status === 'waiting') {
              room.players = room.players.filter(p => p.id !== boundPlayerId);
              if (room.players.length === 0 || !room.players.some(p => !p.isBot)) {
                if (room.turnTimerInterval) clearInterval(room.turnTimerInterval);
                rooms.delete(boundRoomId);
              } else {
                if (room.hostId === boundPlayerId) {
                  const nextHost = room.players.find(p => !p.isBot);
                  if (nextHost) room.hostId = nextHost.id;
                }
                syncRoomToAll(room);
              }
            } else {
              const player = room.players.find(p => p.id === boundPlayerId);
              if (player) {
                player.connected = false;
                player.ws = null;
                syncRoomToAll(room);
              }
            }
          }
          boundRoomId = null;
          boundPlayerId = null;
          break;
        }

        case 'PLAY_TILE': {
          if (!boundRoomId || !boundPlayerId) return;
          const room = rooms.get(boundRoomId);
          if (room) {
            executeMove(room, boundPlayerId, payload.tileId, payload.end, payload.direction);
          }
          break;
        }

        case 'DRAW_TILE': {
          if (!boundRoomId || !boundPlayerId) return;
          const room = rooms.get(boundRoomId);
          if (room) {
            executeDraw(room, boundPlayerId);
          }
          break;
        }

        case 'PASS_TURN': {
          if (!boundRoomId || !boundPlayerId) return;
          const room = rooms.get(boundRoomId);
          if (room) {
            executePass(room, boundPlayerId);
          }
          break;
        }

        case 'E2EE_CHAT_MESSAGE': {
          if (!boundRoomId) return;
          const room = rooms.get(boundRoomId);
          if (room) {
            broadcastToRoom(room, 'E2EE_CHAT_RECEIVED', {
              id: 'chat-' + Math.random().toString(36).substring(2, 9),
              senderId: boundPlayerId,
              senderName: payload.senderName,
              avatarColor: payload.avatarColor,
              timestamp: Date.now(),
              encryptedData: payload.encryptedData,
              iv: payload.iv,
              isQuickReaction: payload.isQuickReaction,
              quickReactionEmoji: payload.quickReactionEmoji,
            });
          }
          break;
        }

        case 'REMATCH_VOTE': {
          if (!boundRoomId || !boundPlayerId) return;
          const room = rooms.get(boundRoomId);
          if (room && (room.status === 'round_over' || room.status === 'game_over')) {
            room.rematchVotes.add(boundPlayerId);
            for (const p of room.players) {
              if (p.isBot) room.rematchVotes.add(p.id);
            }
            const humanPlayers = room.players.filter(p => !p.isBot && p.connected);
            const neededVotes = humanPlayers.length > 0 ? humanPlayers.length : room.players.length;
            const humanVotes = [...room.rematchVotes].filter(id => humanPlayers.some(p => p.id === id)).length;

            if (humanVotes >= neededVotes) {
              if (room.status === 'game_over') {
                for (const p of room.players) p.score = 0;
                room.team1Score = 0;
                room.team2Score = 0;
                room.winnerId = null;
                room.winningTeam = null;
              }
              startRound(room);
            } else {
              syncRoomToAll(room);
            }
          }
          break;
        }
      }
    } catch (err) {
      console.error('WebSocket message parsing error:', err);
    }
  });

  ws.on('close', () => {
    if (boundRoomId && boundPlayerId) {
      const room = rooms.get(boundRoomId);
      if (room) {
        const player = room.players.find(p => p.id === boundPlayerId);
        if (player) {
          player.connected = false;
          player.ws = null;
        }

        // Clean up empty rooms after 5 minutes
        const active = room.players.some(p => p.connected);
        if (!active) {
          setTimeout(() => {
            const checkRoom = rooms.get(boundRoomId!);
            if (checkRoom && !checkRoom.players.some(p => p.connected)) {
              if (checkRoom.turnTimerInterval) clearInterval(checkRoom.turnTimerInterval);
              rooms.delete(boundRoomId!);
            }
          }, 300000);
        } else {
          syncRoomToAll(room);
        }
      }
    }
  });
});

// REST Endpoints
app.get('/api/leaderboard', (_req, res) => {
  res.json({
    season: 'Season 1: The Grand Spinner Cup',
    countdownDays: 14,
    leaderboard: SEASON_LEADERBOARD,
  });
});

app.get('/api/season', (_req, res) => {
  res.json({
    id: 1,
    name: 'The Grand Spinner Cup',
    theme: 'Imperial Ivory & Emerald Felt',
    endDate: '2026-11-15T00:00:00Z',
    rewards: [
      { tier: 'Domino Legend', reward: 'Golden Spinner Bones & Emperor Crown' },
      { tier: 'Diamond', reward: 'Obsidian Black Tiles & Royal Mantle' },
      { tier: 'Platinum', reward: 'Emerald Velvet Mat & Diamond Crest' },
      { tier: 'Gold', reward: 'Silver Pip Inlays & Top Hat' },
      { tier: 'Silver', reward: '1,500 Trophy Coins & Bronze Laurel' },
    ],
  });
});

app.post('/api/save', (req, res) => {
  const { playerId, data } = req.body;
  if (!playerId) {
    return res.status(400).json({ error: 'Missing playerId' });
  }
  cloudSaves.set(playerId, { ...data, updatedAt: Date.now() });
  return res.json({ success: true, savedAt: Date.now() });
});

app.get('/api/save/:playerId', (req, res) => {
  const save = cloudSaves.get(req.params.playerId);
  if (!save) {
    return res.status(404).json({ error: 'No cloud save found' });
  }
  return res.json(save);
});

// Vite middleware in dev or static files in production
async function startServer() {
  const PORT = process.env.PORT || 3000;

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Bull Domino Server listening on port ${PORT}`);
  });
}

// Vercel imports this HTTP server as a Function. Local development still
// starts the standalone server (including the Vite middleware) through tsx.
if (process.env.VERCEL !== '1') {
  startServer();
}

export default server;