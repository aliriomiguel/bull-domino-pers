import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TitleScreen } from './components/TitleScreen';
import { GameBoard } from './components/GameBoard';
import { PrivateRoomModal } from './components/PrivateRoomModal';
import { CampaignModal } from './components/CampaignModal';
import { TutorialModal } from './components/TutorialModal';
import { AvatarCustomizerModal } from './components/AvatarCustomizerModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { SocialShareModal } from './components/SocialShareModal';
import { EncryptedChatDrawer } from './components/EncryptedChatDrawer';
import { MatchmakingModal } from './components/MatchmakingModal';
import {
  DominoTile,
  PlacedTile,
  GameMode,
  MatchType,
  PlayerState,
  PlayerProfile,
  CampaignStage,
  EncryptedChatMessage,
  PlacementDirection,
} from './types/domino';
import {
  createDoubleSixSet,
  shuffleTiles,
  getPlayableMoves,
  applyMove,
  calculateAllFivesScore,
  evaluateRoundEnd,
  chooseAIMove,
} from './game/dominoCore';
import { deriveRoomKey } from './utils/e2ee';
import { sound } from './utils/sound';

const DEFAULT_PROFILE: PlayerProfile = {
  id: 'player-' + Math.random().toString(36).substring(2, 9),
  name: 'DominoAce',
  avatarSeed: {
    skin: '#e0ac69',
    accessory: 'crown',
    bgColor: '#1e293b',
    dominoBadge: '🎲',
    expression: 'smile',
  },
  title: 'Domino Prodigy',
  rankPoints: 1250,
  seasonTier: 'Bronze',
  stats: {
    matchesPlayed: 14,
    matchesWon: 9,
    dominoesCount: 18,
    highestScore: 42,
    winStreak: 3,
    bestWinStreak: 5,
  },
};

export default function App() {
  // Screen state: 'title' | 'playing'
  const [screen, setScreen] = useState<'title' | 'playing'>('title');

  // Player Profile & Cloud Save State
  const [profile, setProfile] = useState<PlayerProfile>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('domino_clash_profile');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          // ignore
        }
      }
    }
    return DEFAULT_PROFILE;
  });

  const [campaignStars, setCampaignStars] = useState<Record<number, number>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('domino_campaign_stars');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          // ignore
        }
      }
    }
    return { 1: 3, 2: 2 }; // Starter progress
  });

  // Active Game State
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [matchType, setMatchType] = useState<MatchType>('2v2');
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null);
  const [waitingRoomId, setWaitingRoomId] = useState<string | null>(null);
  const [roomHostId, setRoomHostId] = useState<string | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>('draw');
  const [targetScore, setTargetScore] = useState(100);
  const [team1Score, setTeam1Score] = useState(0);
  const [team2Score, setTeam2Score] = useState(0);
  const [turnTimeLimit, setTurnTimeLimit] = useState(30);
  const [turnTimeRemaining, setTurnTimeRemaining] = useState(30);

  const [players, setPlayers] = useState<PlayerState[]>([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [board, setBoard] = useState<PlacedTile[]>([]);
  const [leftEnd, setLeftEnd] = useState<number | null>(null);
  const [rightEnd, setRightEnd] = useState<number | null>(null);
  const [boneyard, setBoneyard] = useState<DominoTile[]>([]);
  const [consecutivePasses, setConsecutivePasses] = useState(0);

  // Round / Game Status
  const [isRoundOver, setIsRoundOver] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [roundWinnerId, setRoundWinnerId] = useState<string | null>(null);
  const [roundWinningTeam, setRoundWinningTeam] = useState<1 | 2 | null>(null);
  const [roundPointsAwarded, setRoundPointsAwarded] = useState(0);
  const [roundEndReason, setRoundEndReason] = useState<'domino' | 'blocked' | null>(null);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [winningTeam, setWinningTeam] = useState<1 | 2 | null>(null);

  // E2EE & Chat State
  const [roomKey, setRoomKey] = useState<CryptoKey | null>(null);
  const [chatMessages, setChatMessages] = useState<EncryptedChatMessage[]>([]);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Modals
  const [isPrivateRoomModalOpen, setIsPrivateRoomModalOpen] = useState(false);
  const [isMatchmakingModalOpen, setIsMatchmakingModalOpen] = useState(false);
  const [isMatchmakingSearching, setIsMatchmakingSearching] = useState(false);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [isTutorialModalOpen, setIsTutorialModalOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isLeaderboardModalOpen, setIsLeaderboardModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Active Campaign stage reference if playing solo campaign
  const [activeCampaignStage, setActiveCampaignStage] = useState<CampaignStage | null>(null);

  // WebSocket Ref
  const wsRef = useRef<WebSocket | null>(null);

  // Sync document.body.dataset.state with ultra-mode requirements ('title', 'playing', 'paused', 'gameover')
  useEffect(() => {
    if (screen === 'title') {
      document.body.dataset.state = 'title';
    } else if (isGameOver) {
      document.body.dataset.state = 'gameover';
    } else {
      document.body.dataset.state = 'playing';
    }
  }, [screen, isGameOver]);

  // Persist profile locally and push to cloud save endpoint
  const saveProfile = useCallback((newProfile: PlayerProfile) => {
    setProfile(newProfile);
    if (typeof window !== 'undefined') {
      localStorage.setItem('domino_clash_profile', JSON.stringify(newProfile));
      // Cloud sync
      fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: newProfile.id, data: { profile: newProfile, campaignStars } }),
      }).catch(() => {
        // offline or local fallback
      });
    }
  }, [campaignStars]);

  const saveStars = useCallback((newStars: Record<number, number>) => {
    setCampaignStars(newStars);
    if (typeof window !== 'undefined') {
      localStorage.setItem('domino_campaign_stars', JSON.stringify(newStars));
      fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: profile.id, data: { profile, campaignStars: newStars } }),
      }).catch(() => {});
    }
  }, [profile]);

  // WebSocket Setup
  const setupWebSocket = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return wsRef.current;
    }

    const wsUrl = new URL('/api/ws', window.location.href);
    wsUrl.protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(wsUrl.toString());
    wsRef.current = ws;

    ws.onmessage = async (event) => {
      try {
        const { type, payload } = JSON.parse(event.data);
        switch (type) {
          case 'ROOM_CREATED':
            setWaitingRoomId(payload.roomId);
            setActiveRoomId(payload.roomId);
            setIsMultiplayer(true);
            break;

          case 'ROOM_UPDATE': {
            setActiveRoomId(payload.roomId);
            setIsMultiplayer(true);
            setGameMode(payload.mode);
            setMatchType(payload.matchType || '1v1');
            setTargetScore(payload.targetScore);
            setTeam1Score(payload.team1Score ?? 0);
            setTeam2Score(payload.team2Score ?? 0);
            setRoomHostId(payload.hostId || null);
            setTurnTimeLimit(payload.turnTimeLimit);
            setTurnTimeRemaining(payload.turnTimeRemaining);
            setBoard(payload.board || []);
            setLeftEnd(payload.leftEnd);
            setRightEnd(payload.rightEnd);
            setBoneyard(Array(payload.boneyardCount || 0).fill({ id: 'hidden', left: 0, right: 0 }));
            setCurrentTurnIndex(payload.currentTurnIndex);

            // Reconstruct players with placeholder hands for opponent counts
            const reconstructed = payload.players.map((p: any) => ({
              id: p.id,
              name: p.name,
              profile: p.profile,
              hand: p.hand && p.hand.length > 0
                ? p.hand
                : Array(p.handCount || 0).fill({ id: 'hidden', left: 0, right: 0 }),
              handCount: p.handCount ?? (p.hand ? p.hand.length : 0),
              score: p.score,
              team: p.team,
              seatIndex: p.seatIndex,
              isAI: p.isBot || false,
              isBot: p.isBot || false,
              connected: p.connected,
            }));
            setPlayers(reconstructed);

            // E2EE key initialization for the room
            if (payload.roomId) {
              deriveRoomKey(payload.roomId).then(setRoomKey).catch(console.error);
            }

            if (payload.status === 'waiting') {
              setWaitingRoomId(payload.roomId);
            } else if (payload.status === 'playing') {
              setWaitingRoomId(null);
              setIsPrivateRoomModalOpen(false);
              setIsMatchmakingModalOpen(false);
              setIsMatchmakingSearching(false);
              setScreen('playing');
              setIsRoundOver(false);
              setIsGameOver(false);
            } else if (payload.status === 'round_over') {
              setIsRoundOver(true);
              setRoundWinnerId(payload.roundWinnerId);
              setRoundWinningTeam(payload.roundWinningTeam);
              setRoundPointsAwarded(payload.roundPointsAwarded);
              setRoundEndReason(payload.roundEndReason);
            } else if (payload.status === 'game_over') {
              setIsGameOver(true);
              setWinnerId(payload.winnerId);
              setWinningTeam(payload.winningTeam);
              const myTeam = reconstructed.find((p: PlayerState) => p.id === profile.id)?.team;
              if (payload.winnerId === profile.id || (payload.winningTeam && myTeam === payload.winningTeam)) {
                sound.playVictoryFanfare();
              }
            }
            break;
          }

          case 'TIMER_TICK':
            setTurnTimeRemaining(payload.remaining);
            break;

          case 'E2EE_CHAT_RECEIVED':
            setChatMessages((prev) => [...prev, payload]);
            setUnreadChatCount((count) => count + 1);
            break;

          case 'ROOM_CLOSED':
            setScreen('title');
            setWaitingRoomId(null);
            setActiveRoomId(null);
            setRoomHostId(null);
            setIsMultiplayer(false);
            setIsChatOpen(false);
            setRoomKey(null);
            setChatMessages([]);
            setUnreadChatCount(0);
            alert('La partida ha terminado porque otro jugador ha abandonado la sala.');
            break;

          case 'ERROR':
            alert(payload.message || 'Error occurred');
            break;
        }
      } catch (err) {
        console.error('WS Error:', err);
      }
    };

    return ws;
  }, [profile.id]);

  // Recover missed room updates while the private-room lobby is waiting.
  // The server responds only to this socket with its latest player-safe room snapshot.
  useEffect(() => {
    if (!waitingRoomId || screen === 'playing') return;

    const requestRoomSync = () => {
      const ws = wsRef.current;
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'SYNC_ROOM', payload: {} }));
      }
    };

    requestRoomSync();
    const syncInterval = window.setInterval(requestRoomSync, 2500);
    return () => window.clearInterval(syncInterval);
  }, [waitingRoomId, screen]);

  // Handle URL Room parameters & autostart
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    const autoParam = params.get('autostart');

    if (roomParam) {
      const ws = setupWebSocket();
      const sendJoin = () => {
        ws.send(JSON.stringify({
          type: 'JOIN_ROOM',
          payload: { roomId: roomParam.toUpperCase(), profile },
        }));
      };
      if (ws.readyState === WebSocket.OPEN) {
        sendJoin();
      } else {
        ws.addEventListener('open', sendJoin, { once: true });
      }
    } else if (autoParam === '1') {
      startSoloGame('draw', 50, 'novice');
    }
  }, [setupWebSocket, profile]);

  // Start Solo Game (against AI or Campaign)
  const startSoloGame = (
    mode: GameMode,
    target: number,
    aiDiff: 'novice' | 'tactician' | 'grandmaster',
    stage?: CampaignStage,
    format: MatchType = '1v1'
  ) => {
    setIsMultiplayer(false);
    setActiveRoomId(null);
    setWaitingRoomId(null);
    setGameMode(mode);
    setMatchType(format);
    setTargetScore(target);
    setTeam1Score(0);
    setTeam2Score(0);
    setWinningTeam(null);
    setRoundWinningTeam(null);
    setTurnTimeLimit(30);
    setTurnTimeRemaining(30);
    setActiveCampaignStage(stage || null);

    const fullDeck = shuffleTiles(createDoubleSixSet());

    if (format === '2v2') {
      const userHand = fullDeck.splice(0, 7);
      const bot1Hand = fullDeck.splice(0, 7);
      const partnerHand = fullDeck.splice(0, 7);
      const bot2Hand = fullDeck.splice(0, 7);

      const bot1Profile: PlayerProfile = {
        id: 'ai-rival-1',
        name: 'Tactician Bot',
        title: 'Havana Tactician',
        avatarSeed: { skin: '#8d5524', accessory: 'fedora', bgColor: '#047857', dominoBadge: '🎲', expression: 'smirk' },
        rankPoints: 1600,
        seasonTier: 'Silver',
        stats: { matchesPlayed: 25, matchesWon: 14, dominoesCount: 10, highestScore: 40, winStreak: 2, bestWinStreak: 4 },
      };

      const partnerProfile: PlayerProfile = {
        id: 'ai-partner',
        name: 'Ivory Partner',
        title: 'Spinner Ally',
        avatarSeed: { skin: '#e0ac69', accessory: 'crown', bgColor: '#7c3aed', dominoBadge: '👑', expression: 'smile' },
        rankPoints: 1750,
        seasonTier: 'Gold',
        stats: { matchesPlayed: 30, matchesWon: 18, dominoesCount: 12, highestScore: 45, winStreak: 3, bestWinStreak: 5 },
      };

      const bot2Profile: PlayerProfile = {
        id: 'ai-rival-2',
        name: 'Pip Sniper',
        title: 'Block Specialist',
        avatarSeed: { skin: '#fcd34d', accessory: 'glasses', bgColor: '#b91c1c', dominoBadge: '🎯', expression: 'neutral' },
        rankPoints: 1700,
        seasonTier: 'Gold',
        stats: { matchesPlayed: 30, matchesWon: 16, dominoesCount: 11, highestScore: 42, winStreak: 1, bestWinStreak: 4 },
      };

      const soloPlayers: PlayerState[] = [
        { id: profile.id, name: profile.name, profile, hand: userHand, score: 0, team: 1, seatIndex: 0, connected: true },
        { id: 'ai-rival-1', name: bot1Profile.name, profile: bot1Profile, hand: bot1Hand, score: 0, team: 2, seatIndex: 1, isAI: true, isBot: true, aiDifficulty: aiDiff, connected: true },
        { id: 'ai-partner', name: partnerProfile.name, profile: partnerProfile, hand: partnerHand, score: 0, team: 1, seatIndex: 2, isAI: true, isBot: true, aiDifficulty: aiDiff, connected: true },
        { id: 'ai-rival-2', name: bot2Profile.name, profile: bot2Profile, hand: bot2Hand, score: 0, team: 2, seatIndex: 3, isAI: true, isBot: true, aiDifficulty: aiDiff, connected: true },
      ];

      setPlayers(soloPlayers);
      setBoard([]);
      setLeftEnd(null);
      setRightEnd(null);
      setBoneyard([]);
      setIsRoundOver(false);
      setIsGameOver(false);
      setRoundWinnerId(null);
      setRoundWinningTeam(null);
      setRoundPointsAwarded(0);
      setRoundEndReason(null);
      setWinnerId(null);
      setWinningTeam(null);
      setChatMessages([]);

      let startIdx = 0;
      let highestDouble = -1;
      let highestPip = -1;
      soloPlayers.forEach((p, idx) => {
        p.hand.forEach((t) => {
          if (t.left === t.right && t.left > highestDouble) {
            highestDouble = t.left;
            startIdx = idx;
          }
          if (highestDouble === -1 && t.left + t.right > highestPip) {
            highestPip = t.left + t.right;
            startIdx = idx;
          }
        });
      });

      setCurrentTurnIndex(startIdx);
      setScreen('playing');
      deriveRoomKey('SOLO-2V2-KEY').then(setRoomKey).catch(console.error);
    } else {
      const userHand = fullDeck.splice(0, 7);
      const aiHand = fullDeck.splice(0, 7);

      const opponentProfile: PlayerProfile = stage ? {
        id: 'ai-opponent',
        name: stage.aiName,
        title: stage.aiTitle,
        avatarSeed: stage.aiAvatar,
        rankPoints: 2400,
        seasonTier: 'Gold',
        stats: { matchesPlayed: 50, matchesWon: 30, dominoesCount: 20, highestScore: 60, winStreak: 2, bestWinStreak: 5 },
      } : {
        id: 'ai-opponent',
        name: 'Tactician Bot',
        title: 'Havana Tactician',
        avatarSeed: { skin: '#8d5524', accessory: 'fedora', bgColor: '#047857', dominoBadge: '🎲', expression: 'smirk' },
        rankPoints: 1500,
        seasonTier: 'Silver',
        stats: { matchesPlayed: 20, matchesWon: 10, dominoesCount: 8, highestScore: 35, winStreak: 1, bestWinStreak: 3 },
      };

      setPlayers([
        { id: profile.id, name: profile.name, profile, hand: userHand, score: 0, team: 1, seatIndex: 0, connected: true },
        { id: 'ai-opponent', name: opponentProfile.name, profile: opponentProfile, hand: aiHand, score: 0, team: 2, seatIndex: 1, isAI: true, isBot: true, aiDifficulty: aiDiff, connected: true },
      ]);

      setBoard([]);
      setLeftEnd(null);
      setRightEnd(null);
      setBoneyard(fullDeck);
      setIsRoundOver(false);
      setIsGameOver(false);
      setRoundWinnerId(null);
      setRoundWinningTeam(null);
      setRoundPointsAwarded(0);
      setRoundEndReason(null);
      setWinnerId(null);
      setWinningTeam(null);
      setChatMessages([]);

      let startIdx = 0;
      let highestDouble = -1;
      let highestPip = -1;
      userHand.forEach((t) => {
        if (t.left === t.right && t.left > highestDouble) {
          highestDouble = t.left;
          startIdx = 0;
        }
        if (highestDouble === -1 && t.left + t.right > highestPip) {
          highestPip = t.left + t.right;
          startIdx = 0;
        }
      });
      aiHand.forEach((t) => {
        if (t.left === t.right && t.left > highestDouble) {
          highestDouble = t.left;
          startIdx = 1;
        }
        if (highestDouble === -1 && t.left + t.right > highestPip) {
          highestPip = t.left + t.right;
          startIdx = 1;
        }
      });

      setCurrentTurnIndex(startIdx);
      setScreen('playing');
      deriveRoomKey('SOLO-CAMPAIGN-KEY').then(setRoomKey).catch(console.error);
    }
  };

  // Solo Turn Timer countdown
  useEffect(() => {
    if (screen !== 'playing' || isMultiplayer || isRoundOver || isGameOver) return;

    const timer = setInterval(() => {
      setTurnTimeRemaining((prev) => {
        if (prev <= 1) {
          // Timeout reached: Auto-action for current player
          const currentP = players[currentTurnIndex];
          if (currentP) {
            const validMoves = getPlayableMoves(currentP.hand, leftEnd, rightEnd);
            if (validMoves.length > 0) {
              executeLocalMove(currentP.id, validMoves[0].tile.id, validMoves[0].end);
            } else if (gameMode !== 'block' && boneyard.length > 0) {
              sound.playTileDraw();
              executeLocalDraw(currentP.id);
            } else {
              sound.playKnockPass();
              executeLocalPass(currentP.id);
            }
          }
          return turnTimeLimit;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [screen, isMultiplayer, isRoundOver, isGameOver, currentTurnIndex, players, leftEnd, rightEnd, boneyard, gameMode, turnTimeLimit, consecutivePasses]);

  // Solo AI Turn Engine
  useEffect(() => {
    if (screen !== 'playing' || isMultiplayer || isRoundOver || isGameOver) return;

    const currentP = players[currentTurnIndex];
    if (!currentP || !currentP.isAI) return;

    const timer = setTimeout(() => {
      try {
        const aiMove = chooseAIMove(
          currentP.hand,
          board,
          leftEnd,
          rightEnd,
          currentP.aiDifficulty || 'tactician'
        );

        if (aiMove) {
          sound.playTileClack(aiMove.tile.left === aiMove.tile.right);
          executeLocalMove(currentP.id, aiMove.tile.id, aiMove.end);
        } else if (gameMode !== 'block' && boneyard.length > 0) {
          sound.playTileDraw();
          executeLocalDraw(currentP.id);
        } else {
          sound.playKnockPass();
          executeLocalPass(currentP.id);
        }
      } catch (err) {
        console.error('AI Move Error:', err);
        executeLocalPass(currentP.id);
      }
    }, 1100);

    return () => clearTimeout(timer);
  }, [screen, isMultiplayer, currentTurnIndex, players, board, leftEnd, rightEnd, boneyard, isRoundOver, isGameOver, gameMode, consecutivePasses]);

  // Local Move Execution
  const executeLocalMove = (
    playerId: string,
    tileId: string,
    end: 'left' | 'right',
    direction?: PlacementDirection
  ) => {
    const pIdx = players.findIndex((p) => p.id === playerId);
    if (pIdx === -1) return;
    const player = players[pIdx];

    const tileIdx = player.hand.findIndex((t) => t.id === tileId);
    if (tileIdx === -1) return;
    const tile = player.hand[tileIdx];

    try {
      const moveRes = applyMove(board, leftEnd, rightEnd, tile, end, direction);
      const newBoard = moveRes.board;
      const newLeft = moveRes.newLeftEnd;
      const newRight = moveRes.newRightEnd;

      const updatedHand = [...player.hand];
      updatedHand.splice(tileIdx, 1);

      const updatedPlayers = [...players];
      updatedPlayers[pIdx] = { ...player, hand: updatedHand };

      // All Fives bonus
      if (gameMode === 'all-fives') {
        const bonus = calculateAllFivesScore(newLeft, newRight);
        if (bonus > 0) {
          updatedPlayers[pIdx].score += bonus;
        }
      }

      setBoard(newBoard);
      setLeftEnd(newLeft);
      setRightEnd(newRight);
      setPlayers(updatedPlayers);
      setConsecutivePasses(0);
      setTurnTimeRemaining(turnTimeLimit);

      // Evaluate Round End
      const roundEval = evaluateRoundEnd(
        updatedPlayers.map((p) => ({ id: p.id, hand: p.hand })),
        boneyard.length,
        newLeft,
        newRight,
        gameMode
      );

      if (roundEval.isOver) {
        setIsRoundOver(true);
        setRoundWinnerId(roundEval.winnerPlayerId);
        setRoundPointsAwarded(roundEval.pointsAwarded);
        setRoundEndReason(roundEval.reason);

        if (roundEval.winnerPlayerId) {
          const winnerP = updatedPlayers.find((p) => p.id === roundEval.winnerPlayerId);
          if (winnerP) {
            winnerP.score += roundEval.pointsAwarded;
            if (winnerP.score >= targetScore) {
              setIsGameOver(true);
              setWinnerId(winnerP.id);
              if (winnerP.id === profile.id) {
                sound.playVictoryFanfare();
                // Update stats
                const updatedStats = {
                  ...profile.stats,
                  matchesPlayed: profile.stats.matchesPlayed + 1,
                  matchesWon: profile.stats.matchesWon + 1,
                  dominoesCount: profile.stats.dominoesCount + (roundEval.reason === 'domino' ? 1 : 0),
                  highestScore: Math.max(profile.stats.highestScore, winnerP.score),
                  winStreak: profile.stats.winStreak + 1,
                  bestWinStreak: Math.max(profile.stats.bestWinStreak, profile.stats.winStreak + 1),
                };
                saveProfile({
                  ...profile,
                  rankPoints: profile.rankPoints + 50,
                  stats: updatedStats,
                });

                // Award Campaign Star
                if (activeCampaignStage) {
                  const currentStars = campaignStars[activeCampaignStage.id] || 0;
                  saveStars({ ...campaignStars, [activeCampaignStage.id]: Math.max(currentStars, 3) });
                }
              } else {
                sound.playBlockedSound();
                saveProfile({
                  ...profile,
                  stats: {
                    ...profile.stats,
                    matchesPlayed: profile.stats.matchesPlayed + 1,
                    winStreak: 0,
                  },
                });
              }
            }
          }
        }
        return;
      }

      setCurrentTurnIndex((prev) => (prev + 1) % players.length);
    } catch (err) {
      console.error('executeLocalMove error:', err);
    }
  };

  const executeLocalDraw = (playerId: string) => {
    if (boneyard.length === 0) return;
    const nextBoneyard = [...boneyard];
    const drawn = nextBoneyard.pop()!;

    setBoneyard(nextBoneyard);
    setPlayers((prev) =>
      prev.map((p) => (p.id === playerId ? { ...p, hand: [...p.hand, drawn] } : p))
    );
  };

  const executeLocalPass = (playerId: string) => {
    const nextPasses = consecutivePasses + 1;
    setConsecutivePasses(nextPasses);

    // If both/all players pass consecutively, round is blocked!
    if (nextPasses >= players.length) {
      const roundEval = evaluateRoundEnd(
        players.map((p) => ({ id: p.id, hand: p.hand })),
        0,
        leftEnd,
        rightEnd,
        gameMode
      );

      if (roundEval.isOver) {
        setIsRoundOver(true);
        setRoundWinnerId(roundEval.winnerPlayerId);
        setRoundPointsAwarded(roundEval.pointsAwarded);
        setRoundEndReason('blocked');
        sound.playBlockedSound();

        if (roundEval.winnerPlayerId) {
          const updatedPlayers = [...players];
          const winnerP = updatedPlayers.find((p) => p.id === roundEval.winnerPlayerId);
          if (winnerP) {
            winnerP.score += roundEval.pointsAwarded;
            if (winnerP.score >= targetScore) {
              setIsGameOver(true);
              setWinnerId(winnerP.id);
              if (winnerP.id === profile.id) {
                sound.playVictoryFanfare();
              }
            }
          }
          setPlayers(updatedPlayers);
        }
        return;
      }
    }

    setTurnTimeRemaining(turnTimeLimit);
    setCurrentTurnIndex((prev) => (prev + 1) % players.length);
  };

  // Next round reset in match
  const handleNextRound = () => {
    if (isMultiplayer) {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'REMATCH_VOTE', payload: {} }));
      }
      return;
    }

    // Local solo next round
    const fullDeck = shuffleTiles(createDoubleSixSet());
    const userHand = fullDeck.splice(0, 7);
    const aiHand = fullDeck.splice(0, 7);

    setPlayers((prev) => [
      { ...prev[0], hand: userHand },
      { ...prev[1], hand: aiHand },
    ]);

    setBoard([]);
    setLeftEnd(null);
    setRightEnd(null);
    setBoneyard(fullDeck);
    setIsRoundOver(false);
    setRoundWinnerId(null);
    setRoundPointsAwarded(0);
    setRoundEndReason(null);
    setConsecutivePasses(0);
    setTurnTimeRemaining(turnTimeLimit);
  };

  // Multiplayer Actions Dispatcher
  const handlePlayTile = (
    tileId: string,
    end: 'left' | 'right',
    direction?: PlacementDirection
  ) => {
    if (isMultiplayer) {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'PLAY_TILE',
          payload: { tileId, end, direction },
        }));
      }
    } else {
      executeLocalMove(profile.id, tileId, end, direction);
    }
  };

  const handleDrawTile = () => {
    if (isMultiplayer) {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'DRAW_TILE', payload: {} }));
      }
    } else {
      executeLocalDraw(profile.id);
    }
  };

  const handlePassTurn = () => {
    if (isMultiplayer) {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'PASS_TURN', payload: {} }));
      }
    } else {
      executeLocalPass(profile.id);
    }
  };

  // Quick Match Start - Opens Matchmaking Modal
  const handleQuickMatch = () => {
    setIsMatchmakingModalOpen(true);
    setIsMatchmakingSearching(false);
  };

  const handleStartQuickMatch = (type: MatchType) => {
    setMatchType(type);
    setIsMatchmakingSearching(true);
    const ws = setupWebSocket();
    const sendQM = () => {
      ws.send(JSON.stringify({
        type: 'QUICK_MATCH',
        payload: { profile, mode: 'draw', matchType: type },
      }));
    };
    if (ws.readyState === WebSocket.OPEN) {
      sendQM();
    } else {
      ws.addEventListener('open', sendQM, { once: true });
    }
  };

  // Add Bot to current waiting lobby
  const handleAddBot = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'ADD_BOT', payload: {} }));
    }
  };

  // Fill remaining slots with bots and launch game
  const handleFillBotsAndStart = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'FILL_BOTS_AND_START', payload: {} }));
    }
  };

  // Leave waiting lobby / room
  const handleLeaveRoom = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'LEAVE_ROOM', payload: {} }));
    }
    setWaitingRoomId(null);
    setActiveRoomId(null);
    setIsMultiplayer(false);
    setIsPrivateRoomModalOpen(false);
    setIsMatchmakingModalOpen(false);
    setIsMatchmakingSearching(false);
  };

  // Exit the current match and release this player's server-side room session.
  const handleExitToTitle = () => {
    const ws = wsRef.current;
    if (isMultiplayer && ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'LEAVE_ROOM', payload: {} }));
    }

    setScreen('title');
    setWaitingRoomId(null);
    setActiveRoomId(null);
    setRoomHostId(null);
    setIsMultiplayer(false);
    setIsPrivateRoomModalOpen(false);
    setIsMatchmakingModalOpen(false);
    setIsMatchmakingSearching(false);
    setIsChatOpen(false);
    setRoomKey(null);
    setChatMessages([]);
    setUnreadChatCount(0);
  };

  // Create Private Room
  const handleCreatePrivateRoom = (options: {
    mode: GameMode;
    matchType: MatchType;
    targetScore: number;
    turnTimeLimit: number;
    customCode?: string;
  }) => {
    setMatchType(options.matchType);
    const ws = setupWebSocket();
    const sendCreate = () => {
      ws.send(JSON.stringify({
        type: 'CREATE_ROOM',
        payload: {
          isPrivate: true,
          mode: options.mode,
          matchType: options.matchType,
          targetScore: options.targetScore,
          turnTimeLimit: options.turnTimeLimit,
          customCode: options.customCode,
          profile,
        },
      }));
    };
    if (ws.readyState === WebSocket.OPEN) {
      sendCreate();
    } else {
      ws.addEventListener('open', sendCreate, { once: true });
    }
  };

  // Join Private Room
  const handleJoinRoom = (roomCode: string) => {
    const ws = setupWebSocket();
    const sendJoin = () => {
      ws.send(JSON.stringify({
        type: 'JOIN_ROOM',
        payload: { roomId: roomCode.toUpperCase(), profile },
      }));
    };
    if (ws.readyState === WebSocket.OPEN) {
      sendJoin();
    } else {
      ws.addEventListener('open', sendJoin, { once: true });
    }
  };

  // Send Encrypted Chat Message
  const handleSendChatMessage = (payload: { encryptedData: string; iv: string; isQuickReaction?: boolean; quickReactionEmoji?: string }) => {
    if (isMultiplayer && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'E2EE_CHAT_MESSAGE',
        payload: {
          senderName: profile.name,
          avatarColor: profile.avatarSeed.bgColor,
          ...payload,
        },
      }));
    } else {
      // Local simulated echo
      setChatMessages((prev) => [
        ...prev,
        {
          id: 'local-' + Date.now(),
          senderId: profile.id,
          senderName: profile.name,
          avatarColor: profile.avatarSeed.bgColor,
          timestamp: Date.now(),
          ...payload,
        },
      ]);
    }
  };

  return (
    <div className="w-full h-screen bg-black text-stone-100 overflow-hidden select-none">
      {screen === 'title' ? (
        <TitleScreen
          userProfile={profile}
          onQuickMatch={handleQuickMatch}
          onOpenPrivateRoom={() => setIsPrivateRoomModalOpen(true)}
          onOpenCampaign={() => setIsCampaignModalOpen(true)}
          onOpenTutorial={() => setIsTutorialModalOpen(true)}
          onOpenLeaderboard={() => setIsLeaderboardModalOpen(true)}
          onOpenAvatarStudio={() => setIsAvatarModalOpen(true)}
        />
      ) : (
        <GameBoard
          mode={gameMode}
          matchType={matchType}
          team1Score={team1Score}
          team2Score={team2Score}
          winningTeam={winningTeam}
          roundWinningTeam={roundWinningTeam}
          targetScore={targetScore}
          players={players}
          currentTurnIndex={currentTurnIndex}
          board={board}
          leftEnd={leftEnd}
          rightEnd={rightEnd}
          boneyardCount={boneyard.length}
          turnTimeRemaining={turnTimeRemaining}
          turnTimeLimit={turnTimeLimit}
          userProfile={profile}
          isRoundOver={isRoundOver}
          isGameOver={isGameOver}
          roundWinnerId={roundWinnerId}
          roundPointsAwarded={roundPointsAwarded}
          roundEndReason={roundEndReason}
          winnerId={winnerId}
          unreadChatCount={unreadChatCount}
          onPlayTile={handlePlayTile}
          onDrawTile={handleDrawTile}
          onPassTurn={handlePassTurn}
          onNextRound={handleNextRound}
          onRestartMatch={() => {
            if (activeCampaignStage) {
              startSoloGame(activeCampaignStage.mode, activeCampaignStage.targetScore, activeCampaignStage.aiDifficulty, activeCampaignStage);
            } else {
              startSoloGame('draw', 100, 'tactician', undefined, matchType);
            }
          }}
          onExitToTitle={handleExitToTitle}
          onToggleChat={() => {
            setIsChatOpen((prev) => !prev);
            setUnreadChatCount(0);
          }}
          onOpenTutorial={() => setIsTutorialModalOpen(true)}
          onOpenShareModal={() => setIsShareModalOpen(true)}
          isMultiplayer={isMultiplayer}
        />
      )}

      {/* MODALS */}
      <MatchmakingModal
        isOpen={isMatchmakingModalOpen}
        onClose={handleLeaveRoom}
        matchType={matchType}
        players={players}
        isSearching={isMatchmakingSearching}
        onSelectMatchType={handleStartQuickMatch}
        onFillBotsAndStart={handleFillBotsAndStart}
      />

      <PrivateRoomModal
        isOpen={isPrivateRoomModalOpen}
        onClose={() => setIsPrivateRoomModalOpen(false)}
        onCreateRoom={handleCreatePrivateRoom}
        onJoinRoom={handleJoinRoom}
        activeWaitingRoomId={waitingRoomId}
        matchType={matchType}
        players={players}
        hostId={roomHostId || profile.id}
        currentUserId={profile.id}
        onAddBot={handleAddBot}
        onFillBotsAndStart={handleFillBotsAndStart}
        onLeaveRoom={handleLeaveRoom}
      />

      <CampaignModal
        isOpen={isCampaignModalOpen}
        onClose={() => setIsCampaignModalOpen(false)}
        campaignStars={campaignStars}
        onStartStage={(stage) => {
          startSoloGame(stage.mode, stage.targetScore, stage.aiDifficulty, stage);
        }}
      />

      <TutorialModal
        isOpen={isTutorialModalOpen}
        onClose={() => setIsTutorialModalOpen(false)}
      />

      <AvatarCustomizerModal
        isOpen={isAvatarModalOpen}
        profile={profile}
        onSave={saveProfile}
        onClose={() => setIsAvatarModalOpen(false)}
      />

      <LeaderboardModal
        isOpen={isLeaderboardModalOpen}
        userProfile={profile}
        onClose={() => setIsLeaderboardModalOpen(false)}
      />

      <SocialShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={winnerId === profile.id ? 'Bull Domino Match Victory!' : 'Bull Domino Showdown Complete'}
        achievementText={activeCampaignStage ? `Conquered ${activeCampaignStage.title}` : 'Triumphed in Bull Domino'}
        statsHighlight={`${profile.stats.matchesWon} Wins • ${profile.stats.dominoesCount} Dominoes`}
        userProfile={profile}
      />

      <EncryptedChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        roomCode={activeRoomId || 'SOLO-ROOM'}
        roomKey={roomKey}
        currentUserId={profile.id}
        currentUserName={profile.name}
        currentUserColor={profile.avatarSeed.bgColor}
        messages={chatMessages}
        onSendMessage={handleSendChatMessage}
      />
    </div>
  );
}
