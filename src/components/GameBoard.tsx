import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  DominoTile,
  PlacedTile,
  GameMode,
  MatchType,
  PlayerState,
  PlayerProfile,
  PlacementDirection,
  CandidatePlacement,
} from '../types/domino';
import { DominoPiece } from './DominoPiece';
import { AvatarDisplay } from './AvatarDisplay';
import { sound } from '../utils/sound';
import { useI18n, LanguageSwitcherButton } from '../utils/i18n';
import {
  canPlayTile,
  getPlayableMoves,
  alignBoardDisplay,
  getCandidatePlacements,
} from '../game/dominoCore';
import {
  Volume2,
  VolumeX,
  MessageSquare,
  HelpCircle,
  Pause,
  RotateCcw,
  Play,
  Clock,
  Sparkles,
  Share2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  ArrowLeft,
} from 'lucide-react';

interface GameBoardProps {
  mode: GameMode;
  matchType?: MatchType;
  team1Score?: number;
  team2Score?: number;
  winningTeam?: 1 | 2 | null;
  roundWinningTeam?: 1 | 2 | null;
  targetScore: number;
  players: PlayerState[];
  currentTurnIndex: number;
  board: PlacedTile[];
  leftEnd: number | null;
  rightEnd: number | null;
  boneyardCount: number;
  turnTimeRemaining: number;
  turnTimeLimit: number;
  userProfile: PlayerProfile;
  isRoundOver: boolean;
  isGameOver: boolean;
  roundWinnerId: string | null;
  roundPointsAwarded: number;
  roundEndReason: 'domino' | 'blocked' | null;
  winnerId: string | null;
  unreadChatCount: number;
  onPlayTile: (tileId: string, end: 'left' | 'right', direction?: PlacementDirection) => void;
  onDrawTile: () => void;
  onPassTurn: () => void;
  onNextRound: () => void;
  onRestartMatch: () => void;
  onExitToTitle: () => void;
  onToggleChat: () => void;
  onOpenTutorial: () => void;
  onOpenShareModal: () => void;
  isMultiplayer?: boolean;
}

// 44px represents 1 half-domino unit (a full domino is 88px x 44px or 44px x 88px)
const CELL_SIZE = 44;

export const GameBoard: React.FC<GameBoardProps> = ({
  mode,
  matchType = '1v1',
  team1Score,
  team2Score,
  winningTeam,
  roundWinningTeam,
  targetScore,
  players,
  currentTurnIndex,
  board,
  leftEnd,
  rightEnd,
  boneyardCount,
  turnTimeRemaining,
  turnTimeLimit,
  userProfile,
  isRoundOver,
  isGameOver,
  roundWinnerId,
  roundPointsAwarded,
  roundEndReason,
  winnerId,
  unreadChatCount,
  onPlayTile,
  onDrawTile,
  onPassTurn,
  onNextRound,
  onRestartMatch,
  onExitToTitle,
  onToggleChat,
  onOpenTutorial,
  onOpenShareModal,
  isMultiplayer = false,
}) => {
  const { t, language } = useI18n();
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [hoveredCandidate, setHoveredCandidate] = useState<CandidatePlacement | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(sound.isMuted());

  // Interactive Viewport Navigation: Pan & Zoom
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });
  const tableViewportRef = useRef<HTMLDivElement>(null);

  const is2v2 = matchType === '2v2' || players.length === 4;

  const currentPlayer = players[currentTurnIndex];
  const userPlayer = players.find(p => p.id === userProfile.id) || players[0];
  const isMyTurn = currentPlayer?.id === userPlayer?.id && !isRoundOver && !isGameOver;

  const userTeam = userPlayer?.team || 1;
  const rivalTeam = userTeam === 1 ? 2 : 1;

  // Partner sits opposite (top)
  const partnerPlayer = is2v2
    ? (players.find(p => p.team === userTeam && p.id !== userPlayer?.id) || players[2] || null)
    : null;

  // Opponents sit right and left
  const opponentPlayers = is2v2
    ? players.filter(p => p.team === rivalTeam)
    : [players.find(p => p.id !== userPlayer?.id) || players[1] || players[0]];

  const opponentRight = opponentPlayers[0] || players[1] || null;
  const opponentLeft = opponentPlayers[1] || players[3] || null;

  const opponentPlayer = is2v2
    ? (partnerPlayer || players[1] || players[0])
    : (players.find(p => p.id !== userPlayer?.id) || players[1] || players[0]);

  // Scores
  const myTeamScore = userTeam === 1 ? (team1Score ?? userPlayer?.score ?? 0) : (team2Score ?? userPlayer?.score ?? 0);
  const rivalTeamScore = userTeam === 1 ? (team2Score ?? (opponentRight?.score ?? 0)) : (team1Score ?? (opponentRight?.score ?? 0));

  // Playable moves calculation for local user
  const playableMoves = userPlayer ? getPlayableMoves(userPlayer.hand, leftEnd, rightEnd) : [];
  const hasPlayableTile = playableMoves.length > 0;
  const canDraw = mode !== 'block' && boneyardCount > 0 && !hasPlayableTile && isMyTurn;
  const canPass = !hasPlayableTile && (!canDraw || boneyardCount === 0) && isMyTurn;

  // Align board to guarantee all 2D coordinates are present and pips match
  const alignedBoard = useMemo(() => {
    return alignBoardDisplay(board, leftEnd, rightEnd);
  }, [board, leftEnd, rightEnd]);

  // Selected tile details
  const selectedTile = userPlayer?.hand.find(t => t.id === selectedTileId) || null;

  // A double is crosswise ONLY when perpendicular to the line of play
  const isCrosswisePlaced = (placed: PlacedTile) => {
    const isDouble = placed.tile.left === placed.tile.right;
    if (!isDouble) return false;
    if (placed.placedEnd === 'root') return true;
    const dir = placed.direction ?? 'right';
    const isHorizLine = dir === 'right' || dir === 'left';
    if (isHorizLine && placed.orientation === 'vertical') return true;
    if (!isHorizLine && placed.orientation === 'horizontal') return true;
    return false;
  };

  const isCrosswiseCandidate = (cand: CandidatePlacement) => {
    if (!selectedTile || selectedTile.left !== selectedTile.right) return false;
    if (alignedBoard.length === 0) return true;
    const isHorizLine = cand.direction === 'right' || cand.direction === 'left';
    if (isHorizLine && cand.orientation === 'vertical') return true;
    if (!isHorizLine && cand.orientation === 'horizontal') return true;
    return false;
  };

  // Interactive candidate placements for selected tile
  const candidates: CandidatePlacement[] = useMemo(() => {
    if (!selectedTile || !isMyTurn) return [];
    return getCandidatePlacements(alignedBoard, leftEnd, rightEnd, selectedTile);
  }, [alignedBoard, leftEnd, rightEnd, selectedTile, isMyTurn]);

  // Compute 2D Bounding Box in grid coordinates
  const bounds = useMemo(() => {
    if (alignedBoard.length === 0) {
      return { minX: -2, maxX: 3, minY: -2, maxY: 2 };
    }
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const t of alignedBoard) {
      const isCross = isCrosswisePlaced(t);
      const x1 = t.x1 ?? 0;
      const x2 = t.x2 ?? 0;
      const y1 = t.y1 ?? 0;
      const y2 = t.y2 ?? 0;

      if (isCross && t.orientation === 'vertical') {
        minX = Math.min(minX, x1, x2);
        maxX = Math.max(maxX, x1, x2 + 1);
        minY = Math.min(minY, Math.min(y1, y2) - 0.5);
        maxY = Math.max(maxY, Math.max(y1, y2) + 1.5);
      } else if (isCross && t.orientation === 'horizontal') {
        minX = Math.min(minX, Math.min(x1, x2) - 0.5);
        maxX = Math.max(maxX, Math.max(x1, x2) + 1.5);
        minY = Math.min(minY, y1, y2);
        maxY = Math.max(maxY, y1, y2 + 1);
      } else {
        minX = Math.min(minX, x1, x2);
        maxX = Math.max(maxX, x1, x2 + 1);
        minY = Math.min(minY, y1, y2);
        maxY = Math.max(maxY, y1, y2 + 1);
      }
    }

    // Incorporate candidate positions so ghost overlays are in bounds
    for (const c of candidates) {
      minX = Math.min(minX, c.x1, c.x2);
      maxX = Math.max(maxX, c.x1, c.x2 + 1);
      minY = Math.min(minY, c.y1, c.y2);
      maxY = Math.max(maxY, c.y1, c.y2 + 1);
    }

    return { minX, maxX, minY, maxY };
  }, [alignedBoard, candidates]);

  // Center coordinate of the board in pixels
  const boardCenterPx = useMemo(() => {
    const cx = ((bounds.minX + bounds.maxX + 1) / 2) * CELL_SIZE;
    const cy = ((bounds.minY + bounds.maxY + 1) / 2) * CELL_SIZE;
    return { x: cx, y: cy };
  }, [bounds]);

  // Auto-fit zoom when board grows significantly
  useEffect(() => {
    if (alignedBoard.length === 0) {
      setPan({ x: 0, y: 0 });
      setZoom(1);
      return;
    }
    const widthCells = bounds.maxX - bounds.minX + 3;
    const heightCells = bounds.maxY - bounds.minY + 3;
    const vpW = tableViewportRef.current?.clientWidth || 900;
    const vpH = tableViewportRef.current?.clientHeight || 500;

    const boardWidthPx = widthCells * CELL_SIZE;
    const boardHeightPx = heightCells * CELL_SIZE;

    const fitScaleX = (vpW * 0.85) / boardWidthPx;
    const fitScaleY = (vpH * 0.8) / boardHeightPx;
    const idealZoom = Math.min(1.1, Math.max(0.55, Math.min(fitScaleX, fitScaleY)));

    // Smoothly adapt zoom if board stretches beyond viewport
    if (idealZoom < zoom) {
      setZoom(Number(idealZoom.toFixed(2)));
    }
  }, [alignedBoard.length, bounds]);

  // Reset viewport to center
  const handleResetView = () => {
    setPan({ x: 0, y: 0 });
    const widthCells = bounds.maxX - bounds.minX + 3;
    const heightCells = bounds.maxY - bounds.minY + 3;
    const vpW = tableViewportRef.current?.clientWidth || 900;
    const vpH = tableViewportRef.current?.clientHeight || 500;
    const fitScale = Math.min(1.1, Math.max(0.6, Math.min((vpW * 0.85) / (widthCells * CELL_SIZE), (vpH * 0.8) / (heightCells * CELL_SIZE))));
    setZoom(Number(fitScale.toFixed(2)));
  };

  // Drag to pan table handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Wheel zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom(prev => Math.min(1.8, Math.max(0.45, Number((prev * zoomFactor).toFixed(2)))));
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'Escape' || e.key === 'p' || e.key === 'P') {
        if (!isRoundOver && !isGameOver) {
          setIsPaused(prev => !prev);
        }
      } else if (e.key === 'm' || e.key === 'M') {
        const next = sound.toggleMute();
        setIsMuted(next);
      } else if (e.key === '0' || e.key === 'r' || e.key === 'R') {
        handleResetView();
      } else if (e.key === ' ' && isMyTurn) {
        e.preventDefault();
        if (canDraw) {
          sound.playTileDraw();
          onDrawTile();
        } else if (canPass) {
          sound.playKnockPass();
          onPassTurn();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMyTurn, canDraw, canPass, isRoundOver, isGameOver, onDrawTile, onPassTurn]);

  // Turn alert sound
  useEffect(() => {
    if (isMyTurn) {
      sound.playTurnPing();
    }
  }, [isMyTurn]);

  // Deselect tile when turn changes or round ends
  useEffect(() => {
    setSelectedTileId(null);
  }, [currentTurnIndex, isRoundOver, isGameOver]);

  // Handle tile click in player hand
  const handleTileClick = (tile: DominoTile) => {
    if (!isMyTurn) return;

    const check = canPlayTile(tile, leftEnd, rightEnd);
    if (!check.canLeft && !check.canRight) return;

    if (selectedTileId === tile.id) {
      setSelectedTileId(null);
    } else {
      setSelectedTileId(tile.id);
      sound.playTileDraw();
    }
  };

  // Execute placement
  const handleExecutePlacement = (candidate: CandidatePlacement) => {
    if (!selectedTile) return;
    sound.playTileClack(selectedTile.left === selectedTile.right);
    onPlayTile(selectedTile.id, candidate.end, candidate.direction);
    setSelectedTileId(null);
    setHoveredCandidate(null);
  };

  const handleToggleMute = () => {
    const next = sound.toggleMute();
    setIsMuted(next);
  };

  // Helper icon for direction
  const getDirectionIcon = (dir: PlacementDirection) => {
    switch (dir) {
      case 'right':
        return <ArrowRight className="w-3.5 h-3.5" />;
      case 'left':
        return <ArrowLeft className="w-3.5 h-3.5" />;
      case 'down':
        return <ArrowDown className="w-3.5 h-3.5" />;
      case 'up':
        return <ArrowUp className="w-3.5 h-3.5" />;
    }
  };

  const getTranslatedCandidateLabel = (cand: CandidatePlacement) => {
    if (cand.label === 'Salida Horizontal' || cand.label === 'Horizontal Lead') {
      return t.leadHorizontal;
    }
    if (cand.label === 'Salida Vertical' || cand.label === 'Vertical Lead' || cand.label === 'Vertical Lead (Crosswise)') {
      return t.leadVertical;
    }
    if (cand.label === 'Straight') return t.straight;
    if (cand.label === 'Turn Right') return t.turnRight;
    if (cand.label === 'Turn Left') return t.turnLeft;
    if (cand.label === 'Turn Up') return t.turnUp;
    if (cand.label === 'Turn Down') return t.turnDown;
    return cand.label;
  };

  const getTranslatedDirection = (dir: PlacementDirection) => {
    switch (dir) {
      case 'left': return t.directionLeft;
      case 'right': return t.directionRight;
      case 'up': return t.directionUp;
      case 'down': return t.directionDown;
    }
  };

  return (
    <div
      className="relative w-full h-screen bg-[#071d13] text-stone-100 flex flex-col justify-between overflow-hidden select-none"
      style={{
        backgroundImage: `radial-gradient(circle at 50% 50%, #0d3824 0%, #072216 65%, #020c08 100%)`,
      }}
    >
      {/* Table Felt Texture & Inset Wood Border */}
      <div className="absolute inset-0 border-[10px] sm:border-[16px] border-[#29170e] shadow-[inset_0_0_80px_rgba(0,0,0,0.85)] pointer-events-none z-0" />

      {/* TOP PERIMETER HUD (Opponent/Partner info, status cluster, utilities) */}
      <header className="relative z-20 w-full px-2 sm:px-6 pt-3 sm:pt-4 pb-1 flex items-center justify-between gap-1 pointer-events-auto">
        {/* Left/Partner cluster */}
        {is2v2 ? (
          partnerPlayer ? (
            <div className={`flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 sm:pr-4 rounded-xl sm:rounded-2xl border shadow-lg min-w-0 transition ${
              currentPlayer?.id === partnerPlayer.id
                ? 'bg-emerald-950/90 border-emerald-400 ring-2 ring-emerald-400/50'
                : 'bg-stone-900/85 border-stone-800'
            }`}>
              <AvatarDisplay
                avatarSeed={partnerPlayer.profile.avatarSeed}
                seasonTier={partnerPlayer.profile.seasonTier}
                size="sm"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-white truncate max-w-[75px] sm:max-w-none">{partnerPlayer.name}</span>
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {partnerPlayer.isAI ? 'Compañero (IA)' : 'Compañero'}
                  </span>
                  {currentPlayer?.id === partnerPlayer.id && (
                    <span className="text-[9px] sm:text-[10px] bg-amber-400 text-stone-950 px-1 py-0.2 rounded font-black animate-pulse">
                      {t.thinking}
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-stone-400 flex items-center gap-1.5">
                  <span>{partnerPlayer.handCount ?? partnerPlayer.hand.length} {t.bonesInHand}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-stone-900/85 p-2 rounded-xl border border-stone-800 text-xs text-stone-400">
              Esperando compañero...
            </div>
          )
        ) : (
          <div className="flex items-center gap-2 sm:gap-3 bg-stone-900/85 p-1.5 sm:p-2 sm:pr-4 rounded-xl sm:rounded-2xl border border-stone-800 shadow-lg min-w-0">
            <AvatarDisplay
              avatarSeed={opponentPlayer.profile.avatarSeed}
              seasonTier={opponentPlayer.profile.seasonTier}
              size="sm"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white truncate max-w-[70px] sm:max-w-none">{opponentPlayer.name}</span>
                {currentPlayer?.id === opponentPlayer.id && (
                  <span className="text-[9px] sm:text-[10px] bg-amber-400 text-stone-950 px-1 py-0.2 rounded font-black animate-pulse">
                    {t.thinking}
                  </span>
                )}
              </div>
              <div className="text-[10px] text-stone-400 flex items-center gap-1.5">
                <span>{t.score}: <strong className="text-amber-300 tabular-nums">{opponentPlayer.score}</strong></span>
                <span>•</span>
                <div className="flex items-center gap-0.5" title={`${opponentPlayer.hand.length} ${t.bonesInHand}`}>
                  <span className="text-stone-300">({opponentPlayer.hand.length} {t.bonesInHand})</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Center Match Status Cluster */}
        <div className="hidden sm:flex flex-col items-center">
          {is2v2 ? (
            <div className="px-3.5 py-1.5 rounded-full bg-stone-900/95 border border-amber-500/40 text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg">
              <span className="text-emerald-300">
                {t.yourTeam}: <strong className="text-white text-xs tabular-nums">{myTeamScore}</strong>
              </span>
              <span className="text-stone-500 font-normal">vs</span>
              <span className="text-rose-300">
                {t.rivalTeam}: <strong className="text-white text-xs tabular-nums">{rivalTeamScore}</strong>
              </span>
              <span className="text-stone-600">•</span>
              <span className="text-amber-300 font-mono text-[10px]">{t.target}: {targetScore}</span>
            </div>
          ) : (
            <div className="px-3 py-1 rounded-full bg-stone-900/90 border border-amber-500/30 text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5 shadow">
              <span>{mode === 'draw' ? t.modeDraw : mode === 'block' ? t.modeBlock : t.modeAllFives}</span>
              <span className="text-stone-500">•</span>
              <span>{t.target}: {targetScore}</span>
              {isMultiplayer && (
                <>
                  <span className="text-stone-500">•</span>
                  <span className="text-emerald-400">P2P LIVE</span>
                </>
              )}
            </div>
          )}

          {/* Turn timer bar */}
          {turnTimeLimit > 0 && !isRoundOver && !isGameOver && (
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-stone-300">
              {is2v2 && (
                <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                  isMyTurn
                    ? 'bg-amber-400 text-stone-950 font-black animate-pulse'
                    : currentPlayer?.id === partnerPlayer?.id
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}>
                  {isMyTurn ? '¡Tu Turno!' : `Turno: ${currentPlayer?.name || ''}`}
                </span>
              )}
              <Clock className="w-3 h-3 text-amber-400" />
              <span className="font-mono tabular-nums font-bold text-amber-300">{turnTimeRemaining}s</span>
              <div className="w-20 sm:w-28 h-1.5 bg-stone-800 rounded-full overflow-hidden border border-stone-700/60">
                <div
                  className={`h-full transition-all duration-1000 ${
                    turnTimeRemaining <= 5 ? 'bg-rose-500' : 'bg-amber-400'
                  }`}
                  style={{ width: `${Math.max(0, (turnTimeRemaining / turnTimeLimit) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Top-Right Utility Cluster */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Language Switcher */}
          <LanguageSwitcherButton size="sm" />

          <button
            onClick={onToggleChat}
            aria-label={t.encryptedChat}
            title={t.encryptedChat}
            className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-stone-900/80 border border-stone-700 hover:border-amber-400 text-stone-300 hover:text-white flex items-center justify-center transition shadow"
          >
            <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
            {unreadChatCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-stone-950 text-[10px] font-black flex items-center justify-center">
                {unreadChatCount}
              </span>
            )}
          </button>

          <button
            onClick={handleToggleMute}
            aria-label={isMuted ? t.unmuted : t.muted}
            title={isMuted ? t.unmuted : t.muted}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-stone-900/80 border border-stone-700 hover:border-amber-400 text-stone-300 hover:text-white flex items-center justify-center transition shadow"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />}
          </button>

          <button
            onClick={onOpenTutorial}
            aria-label={t.rulesHelp}
            title={t.rulesHelp}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-stone-900/80 border border-stone-700 hover:border-amber-400 text-stone-300 hover:text-white flex items-center justify-center transition shadow"
          >
            <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
          </button>

          <button
            onClick={() => setIsPaused(true)}
            aria-label={t.paused}
            title={t.paused}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-stone-900/80 border border-stone-700 hover:border-amber-400 text-stone-300 hover:text-white flex items-center justify-center transition shadow"
          >
            <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-stone-300" />
          </button>
        </div>
      </header>

      {/* 2D FELT TABLE VIEWPORT (Interactive Pan & Zoom Canvas) */}
      <main
        ref={tableViewportRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        className={`relative z-10 flex-1 w-full h-full overflow-hidden flex items-center justify-center select-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        {/* Table Felt Grid Subtle Guideline Lines */}
        <div
          className="absolute inset-0 pointer-events-none opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle, #fcd34d 1px, transparent 1px)`,
            backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
          }}
        />

        {/* Subtle Bull Domino Felt Watermark */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10 select-none">
          <img
            src="/bull-domino-logo.png"
            alt=""
            className="w-64 sm:w-80 md:w-96 max-w-[80vw] h-auto object-contain filter grayscale brightness-125 pointer-events-none"
          />
        </div>

        {/* In 2v2: Floating Left and Right Opponents HUD */}
        {is2v2 && opponentLeft && (
          <div className={`absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 z-30 pointer-events-auto p-2 sm:p-2.5 rounded-xl border shadow-2xl flex flex-col items-center gap-1 transition-all duration-300 ${
            currentPlayer?.id === opponentLeft.id
              ? 'bg-rose-950/90 border-rose-400 ring-2 ring-rose-400/50 scale-105'
              : 'bg-stone-900/85 border-stone-800'
          }`}>
            <AvatarDisplay avatarSeed={opponentLeft.profile.avatarSeed} seasonTier={opponentLeft.profile.seasonTier} size="sm" />
            <span className="text-[11px] font-bold text-white truncate max-w-[75px] text-center">{opponentLeft.name}</span>
            <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
              {opponentLeft.isAI ? 'Rival 2 (IA)' : 'Rival 2'}
            </span>
            <span className="text-[10px] text-stone-300 font-mono">
              {opponentLeft.handCount ?? opponentLeft.hand.length} {t.bonesInHand}
            </span>
            {currentPlayer?.id === opponentLeft.id && (
              <span className="text-[9px] font-bold text-amber-400 animate-pulse">{t.thinking}</span>
            )}
          </div>
        )}

        {is2v2 && opponentRight && (
          <div className={`absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-30 pointer-events-auto p-2 sm:p-2.5 rounded-xl border shadow-2xl flex flex-col items-center gap-1 transition-all duration-300 ${
            currentPlayer?.id === opponentRight.id
              ? 'bg-rose-950/90 border-rose-400 ring-2 ring-rose-400/50 scale-105'
              : 'bg-stone-900/85 border-stone-800'
          }`}>
            <AvatarDisplay avatarSeed={opponentRight.profile.avatarSeed} seasonTier={opponentRight.profile.seasonTier} size="sm" />
            <span className="text-[11px] font-bold text-white truncate max-w-[75px] text-center">{opponentRight.name}</span>
            <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
              {opponentRight.isAI ? 'Rival 1 (IA)' : 'Rival 1'}
            </span>
            <span className="text-[10px] text-stone-300 font-mono">
              {opponentRight.handCount ?? opponentRight.hand.length} {t.bonesInHand}
            </span>
            {currentPlayer?.id === opponentRight.id && (
              <span className="text-[9px] font-bold text-amber-400 animate-pulse">{t.thinking}</span>
            )}
          </div>
        )}

        {/* Viewport Floating Controls: Zoom In, Zoom Out, Center Fit */}
        <div className="absolute right-4 top-4 z-30 flex flex-col items-center gap-1.5 bg-stone-950/70 p-1.5 rounded-xl border border-stone-800 backdrop-blur-sm shadow-xl">
          <button
            onClick={() => setZoom(prev => Math.min(1.8, Number((prev + 0.15).toFixed(2))))}
            aria-label="Zoom In"
            title="Zoom In"
            className="w-8 h-8 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-amber-300 flex items-center justify-center transition"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="text-[10px] font-mono text-stone-400 py-0.5 tabular-nums">
            {Math.round(zoom * 100)}%
          </div>
          <button
            onClick={() => setZoom(prev => Math.max(0.45, Number((prev - 0.15).toFixed(2))))}
            aria-label="Zoom Out"
            title="Zoom Out"
            className="w-8 h-8 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-amber-300 flex items-center justify-center transition"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetView}
            aria-label="Reset & Fit View"
            title="Reset & Center View"
            className="w-8 h-8 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-amber-300 flex items-center justify-center transition border-t border-stone-800"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Empty Table Opening Prompt */}
        {alignedBoard.length === 0 ? (
          <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-stone-950/60 border border-amber-500/30 backdrop-blur-sm shadow-2xl max-w-sm">
            <span className="text-4xl mb-3 animate-bounce">🎲</span>
            <h3 className="text-lg font-black text-amber-300">The Board is Open</h3>
            <p className="text-xs text-stone-300 mt-1.5">
              {isMyTurn
                ? 'Select any tile from your hand to make the opening lead. You can place it horizontally or vertically.'
                : `Waiting for ${currentPlayer?.name} to place the first domino tile...`}
            </p>
          </div>
        ) : (
          /* 2D Placed Dominoes Canvas with Pan & Zoom Transform */
          <div
            className="relative will-change-transform transition-[transform] duration-75 ease-out"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
            }}
          >
            {/* Centered Anchor Wrapper: coordinates are offset relative to boardCenterPx */}
            <div
              className="relative"
              style={{
                width: 0,
                height: 0,
              }}
            >
              {/* Placed Domino Tiles */}
              {alignedBoard.map((placed, idx) => {
                const gx = Math.min(placed.x1 ?? 0, placed.x2 ?? 0);
                const gy = Math.min(placed.y1 ?? 0, placed.y2 ?? 0);
                const isHoriz = placed.orientation === 'horizontal';
                const isDouble = placed.tile.left === placed.tile.right;

                let leftPx = gx * CELL_SIZE - boardCenterPx.x;
                let topPx = gy * CELL_SIZE - boardCenterPx.y;

                // For double numbered pieces, attach in the middle ONLY if crosswise to line of play:
                // A vertical double centers on the horizontal chain (-CELL_SIZE / 2)
                // A horizontal double centers on the vertical chain (-CELL_SIZE / 2)
                if (isCrosswisePlaced(placed)) {
                  if (placed.orientation === 'vertical') {
                    topPx -= CELL_SIZE / 2;
                  } else {
                    leftPx -= CELL_SIZE / 2;
                  }
                }

                const tileWidth = isHoriz ? CELL_SIZE * 2 : CELL_SIZE;
                const tileHeight = isHoriz ? CELL_SIZE : CELL_SIZE * 2;

                return (
                  <div
                    key={`${placed.tile.id}-${idx}`}
                    className="absolute transition-all duration-300 shadow-md group"
                    style={{
                      left: `${leftPx}px`,
                      top: `${topPx}px`,
                      width: `${tileWidth}px`,
                      height: `${tileHeight}px`,
                    }}
                  >
                    <DominoPiece
                      tile={placed.tile}
                      displayLeft={placed.displayLeft}
                      displayRight={placed.displayRight}
                      orientation={placed.orientation}
                      size="sm"
                      className="!w-full !h-full"
                    />
                  </div>
                );
              })}

              {/* Open Ends Value Badges on the Table Felt */}
              {leftEnd !== null && alignedBoard.length > 0 && (
                (() => {
                  const head = alignedBoard[0];
                  const isRoot = head.placedEnd === 'root';
                  const isRootDouble = isRoot && head.tile.left === head.tile.right;
                  const isCross = isCrosswisePlaced(head);

                  let px = 0;
                  let py = 0;

                  if (isRoot) {
                    if (isRootDouble) {
                      if (head.orientation === 'horizontal') {
                        // Top side of horizontal double (matches user's red number 6 on top)
                        px = 0 * CELL_SIZE - boardCenterPx.x + CELL_SIZE / 2;
                        py = 0 * CELL_SIZE - boardCenterPx.y - 14;
                      } else {
                        // Left side of vertical double (matches user's green OK on left)
                        px = 0 * CELL_SIZE - boardCenterPx.x - 14;
                        py = 0 * CELL_SIZE - boardCenterPx.y + CELL_SIZE / 2;
                      }
                    } else {
                      // Mixed piece horizontal lead: left of x1=0
                      const ox = head.x1 ?? 0;
                      const oy = head.y1 ?? 0;
                      px = ox * CELL_SIZE - boardCenterPx.x - 14;
                      py = oy * CELL_SIZE - boardCenterPx.y + CELL_SIZE / 2;
                    }
                  } else {
                    const ox = head.x2 ?? 0;
                    const oy = head.y2 ?? 0;
                    if (isCross) {
                      if (head.orientation === 'vertical') {
                        px = ox * CELL_SIZE - boardCenterPx.x - 14;
                        py = oy * CELL_SIZE - boardCenterPx.y + CELL_SIZE / 2;
                      } else {
                        px = ox * CELL_SIZE - boardCenterPx.x + CELL_SIZE / 2;
                        py = oy * CELL_SIZE - boardCenterPx.y - 14;
                      }
                    } else {
                      const dir = head.direction ?? 'left';
                      if (dir === 'left') {
                        px = ox * CELL_SIZE - boardCenterPx.x - 14;
                        py = oy * CELL_SIZE - boardCenterPx.y + CELL_SIZE / 2;
                      } else if (dir === 'right') {
                        px = (ox + 1) * CELL_SIZE - boardCenterPx.x + 14;
                        py = oy * CELL_SIZE - boardCenterPx.y + CELL_SIZE / 2;
                      } else if (dir === 'up') {
                        px = ox * CELL_SIZE - boardCenterPx.x + CELL_SIZE / 2;
                        py = oy * CELL_SIZE - boardCenterPx.y - 14;
                      } else {
                        px = ox * CELL_SIZE - boardCenterPx.x + CELL_SIZE / 2;
                        py = (oy + 1) * CELL_SIZE - boardCenterPx.y + 14;
                      }
                    }
                  }

                  return (
                    <div
                      className="absolute z-20 pointer-events-none -translate-x-1/2 -translate-y-1/2"
                      style={{ left: `${px}px`, top: `${py}px` }}
                    >
                      <div
                        className="w-6 h-6 rounded-full bg-stone-950/95 border-2 border-amber-400 text-amber-400 flex items-center justify-center text-[11px] font-black shadow-[0_0_12px_rgba(251,191,36,0.6)]"
                        title={`Open Left End: ${leftEnd}`}
                      >
                        {leftEnd}
                      </div>
                    </div>
                  );
                })()
              )}

              {rightEnd !== null && alignedBoard.length > 0 && (
                (() => {
                  const tail = alignedBoard[alignedBoard.length - 1];
                  const isRoot = tail.placedEnd === 'root';
                  const isRootDouble = isRoot && tail.tile.left === tail.tile.right;
                  const isCross = isCrosswisePlaced(tail);

                  let px = 0;
                  let py = 0;

                  if (isRoot) {
                    if (isRootDouble) {
                      if (tail.orientation === 'horizontal') {
                        // Bottom side of horizontal double (matches user's red number 6 on bottom)
                        px = 0 * CELL_SIZE - boardCenterPx.x + CELL_SIZE / 2;
                        py = (0 + 1) * CELL_SIZE - boardCenterPx.y + 14;
                      } else {
                        // Right side of vertical double (matches user's green OK on right)
                        px = (0 + 1) * CELL_SIZE - boardCenterPx.x + 14;
                        py = 0 * CELL_SIZE - boardCenterPx.y + CELL_SIZE / 2;
                      }
                    } else {
                      // Mixed piece horizontal lead: right of x2=1
                      const ox = tail.x2 ?? 1;
                      const oy = tail.y2 ?? 0;
                      px = (ox + 1) * CELL_SIZE - boardCenterPx.x + 14;
                      py = oy * CELL_SIZE - boardCenterPx.y + CELL_SIZE / 2;
                    }
                  } else {
                    const ox = tail.x2 ?? 1;
                    const oy = tail.y2 ?? 0;
                    if (isCross) {
                      if (tail.orientation === 'vertical') {
                        px = (ox + 1) * CELL_SIZE - boardCenterPx.x + 14;
                        py = oy * CELL_SIZE - boardCenterPx.y + CELL_SIZE / 2;
                      } else {
                        px = ox * CELL_SIZE - boardCenterPx.x + CELL_SIZE / 2;
                        py = (oy + 1) * CELL_SIZE - boardCenterPx.y + 14;
                      }
                    } else {
                      const dir = tail.direction ?? 'right';
                      if (dir === 'right') {
                        px = (ox + 1) * CELL_SIZE - boardCenterPx.x + 14;
                        py = oy * CELL_SIZE - boardCenterPx.y + CELL_SIZE / 2;
                      } else if (dir === 'left') {
                        px = ox * CELL_SIZE - boardCenterPx.x - 14;
                        py = oy * CELL_SIZE - boardCenterPx.y + CELL_SIZE / 2;
                      } else if (dir === 'down') {
                        px = ox * CELL_SIZE - boardCenterPx.x + CELL_SIZE / 2;
                        py = (oy + 1) * CELL_SIZE - boardCenterPx.y + 14;
                      } else {
                        px = ox * CELL_SIZE - boardCenterPx.x + CELL_SIZE / 2;
                        py = oy * CELL_SIZE - boardCenterPx.y - 14;
                      }
                    }
                  }

                  return (
                    <div
                      className="absolute z-20 pointer-events-none -translate-x-1/2 -translate-y-1/2"
                      style={{ left: `${px}px`, top: `${py}px` }}
                    >
                      <div
                        className="w-6 h-6 rounded-full bg-stone-950/95 border-2 border-amber-400 text-amber-400 flex items-center justify-center text-[11px] font-black shadow-[0_0_12px_rgba(251,191,36,0.6)]"
                        title={`Open Right End: ${rightEnd}`}
                      >
                        {rightEnd}
                      </div>
                    </div>
                  );
                })()
              )}

              {/* INTERACTIVE PLACEMENT OVERLAY: TRANSLUCENT GHOST TILES */}
              {selectedTile && isMyTurn && candidates.map((candidate, idx) => {
                const isHoriz = candidate.orientation === 'horizontal';
                let leftPx = candidate.gx * CELL_SIZE - boardCenterPx.x;
                let topPx = candidate.gy * CELL_SIZE - boardCenterPx.y;

                if (isCrosswiseCandidate(candidate)) {
                  if (candidate.orientation === 'vertical') {
                    topPx -= CELL_SIZE / 2;
                  } else {
                    leftPx -= CELL_SIZE / 2;
                  }
                }

                const tileWidth = isHoriz ? CELL_SIZE * 2 : CELL_SIZE;
                const tileHeight = isHoriz ? CELL_SIZE : CELL_SIZE * 2;
                const isHovered = hoveredCandidate === candidate;

                return (
                  <div
                    key={`candidate-${candidate.end}-${candidate.direction}-${idx}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExecutePlacement(candidate);
                    }}
                    onMouseEnter={() => setHoveredCandidate(candidate)}
                    onMouseLeave={() => setHoveredCandidate(null)}
                    className={`absolute z-30 cursor-pointer rounded-lg transition-all duration-150 flex flex-col items-center justify-center overflow-hidden border-2 border-dashed ${
                      isHovered
                        ? 'border-amber-300 bg-amber-400/35 scale-[1.04] shadow-[0_0_25px_rgba(251,191,36,0.85)] ring-2 ring-amber-300'
                        : 'border-amber-400/90 bg-amber-400/20 shadow-[0_0_15px_rgba(251,191,36,0.45)] hover:bg-amber-400/30 animate-pulse'
                    }`}
                    style={{
                      left: `${leftPx}px`,
                      top: `${topPx}px`,
                      width: `${tileWidth}px`,
                      height: `${tileHeight}px`,
                    }}
                    role="button"
                    tabIndex={0}
                    aria-label={`${t.choosePlacementFor} ${selectedTile.left}|${selectedTile.right} ${getTranslatedCandidateLabel(candidate)}`}
                  >
                    {/* Ghost Tile Visual: Translucent Pips with Direction Badge */}
                    <div className="relative w-full h-full flex flex-col items-center justify-between p-1 backdrop-blur-[1px]">
                      {isHoriz ? (
                        <div className="w-full h-full flex items-center justify-between px-1">
                          {/* Left pip */}
                          <div className="w-7 h-7 rounded border border-amber-400/30 bg-amber-950/40 flex items-center justify-center text-xs font-mono font-black text-amber-300">
                            {candidate.pip1}
                          </div>
                          {/* Center Direction Badge */}
                          <div className="px-1 py-0.5 rounded bg-stone-950/90 border border-amber-400 text-amber-300 text-[9px] font-black flex items-center gap-0.5 shadow shrink-0">
                            {getDirectionIcon(candidate.direction)}
                            <span className="uppercase text-[8px]">{getTranslatedDirection(candidate.direction)}</span>
                          </div>
                          {/* Right pip */}
                          <div className="w-7 h-7 rounded border border-amber-400/30 bg-amber-950/40 flex items-center justify-center text-xs font-mono font-black text-amber-300">
                            {candidate.pip2}
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-between py-1">
                          {/* Top pip */}
                          <div className="w-7 h-7 rounded border border-amber-400/30 bg-amber-950/40 flex items-center justify-center text-xs font-mono font-black text-amber-300">
                            {candidate.pip1}
                          </div>
                          {/* Center Direction Badge */}
                          <div className="px-1 py-0.5 rounded bg-stone-950/90 border border-amber-400 text-amber-300 text-[8px] font-black flex items-center gap-0.5 shadow shrink-0">
                            {getDirectionIcon(candidate.direction)}
                            <span className="uppercase text-[8px]">{getTranslatedDirection(candidate.direction)}</span>
                          </div>
                          {/* Bottom pip */}
                          <div className="w-7 h-7 rounded border border-amber-400/30 bg-amber-950/40 flex items-center justify-center text-xs font-mono font-black text-amber-300">
                            {candidate.pip2}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* BOTTOM CONTROL DOCK & PLAYER HAND */}
      <footer className="relative z-20 w-full px-2 sm:px-4 pb-3 sm:pb-5 flex flex-col items-center pointer-events-auto">
        {/* INTERACTIVE PLACEMENT DIRECTION SELECTOR (When tile is selected) */}
        {selectedTile && isMyTurn && candidates.length > 0 && (
          <div className="w-full max-w-2xl mb-2 p-2 sm:p-2.5 rounded-2xl bg-stone-950/90 border border-amber-400 shadow-[0_8px_30px_rgba(251,191,36,0.3)] animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="flex items-center justify-between gap-2 px-1 mb-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span className="text-xs font-bold text-amber-200">
                  {t.choosePlacementFor} <strong className="text-white">[{selectedTile.left}|{selectedTile.right}]</strong>:
                </span>
              </div>
              <button
                onClick={() => setSelectedTileId(null)}
                className="text-[10px] font-bold text-stone-400 hover:text-white px-2 py-0.5 rounded bg-stone-900 hover:bg-stone-800 transition"
              >
                {t.cancel}
              </button>
            </div>

            {/* Candidate options list */}
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-full overflow-x-auto py-1">
              {candidates.map((cand, idx) => (
                <button
                  key={`btn-${cand.end}-${cand.direction}-${idx}`}
                  onClick={() => handleExecutePlacement(cand)}
                  onMouseEnter={() => setHoveredCandidate(cand)}
                  onMouseLeave={() => setHoveredCandidate(null)}
                  className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl border text-xs font-black uppercase tracking-wider transition-all transform hover:scale-105 active:scale-95 shadow-md ${
                    cand.end === 'left'
                      ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 border-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.6)]'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-stone-950 border-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.6)]'
                  }`}
                >
                  {getDirectionIcon(cand.direction)}
                  <span>{getTranslatedCandidateLabel(cand)}</span>
                  {leftEnd !== null && (
                    <span className="text-[10px] bg-black/30 px-1 py-0.2 rounded font-mono">
                      {cand.end === 'left' ? `${t.directionLeft} (${leftEnd})` : `${t.directionRight} (${rightEnd})`}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Turn Toast Banner */}
        <div className="mb-2">
          {isMyTurn ? (
            <div className="px-4 py-1.5 rounded-full bg-amber-500 text-stone-950 text-xs font-black uppercase tracking-wider shadow-[0_4px_12px_rgba(245,158,11,0.5)] flex items-center gap-1.5 animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {selectedTile
                  ? t.yourTurnDirectionPrompt
                  : hasPlayableTile
                  ? t.yourTurnPrompt
                  : canDraw
                  ? t.noMovesDraw
                  : t.noMovesPass}
              </span>
            </div>
          ) : (
            <div className="px-3 py-1 rounded-full bg-stone-900/90 border border-stone-800 text-stone-400 text-xs font-medium">
              {t.waitingForPlayer} {currentPlayer?.name}...
            </div>
          )}
        </div>

        {/* Action Buttons & Player Score Bar */}
        <div className="w-full max-w-xl flex items-center justify-between mb-2 px-1 sm:px-2 gap-1 sm:gap-2">
          {/* User Score cluster */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <AvatarDisplay
              avatarSeed={userProfile.avatarSeed}
              seasonTier={userProfile.seasonTier}
              size="sm"
            />
            <div className="min-w-0">
              <span className="text-[11px] sm:text-xs font-bold text-white truncate max-w-[80px] sm:max-w-none block">{userPlayer?.name}</span>
              <div className="text-[9px] sm:text-[10px] text-stone-400">
                {t.score}: <strong className="text-amber-400 tabular-nums">{userPlayer?.score || 0}</strong>/{targetScore}
              </div>
            </div>
          </div>

          {/* Boneyard and Pass buttons */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {mode !== 'block' && (
              <button
                onClick={() => {
                  sound.playTileDraw();
                  onDrawTile();
                }}
                disabled={!canDraw}
                className={`py-1 sm:py-1.5 px-2 sm:px-3 rounded-lg sm:rounded-xl border text-[10px] sm:text-xs font-bold transition flex items-center gap-1 shadow ${
                  canDraw
                    ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 border-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.6)] animate-pulse ring-2 ring-amber-400 cursor-pointer'
                    : 'bg-stone-900 border-amber-500/40 text-amber-300 disabled:opacity-30 disabled:pointer-events-none'
                }`}
              >
                <span>{t.drawBoneyard}</span>
                <span className={`px-1 py-0.2 rounded font-mono text-[9px] ${canDraw ? 'bg-black/30 text-stone-950 font-black' : 'bg-amber-500/20 text-amber-400'}`}>
                  {boneyardCount}
                </span>
              </button>
            )}

            <button
              onClick={() => {
                sound.playKnockPass();
                onPassTurn();
              }}
              disabled={!canPass}
              className={`py-1 sm:py-1.5 px-2 sm:px-3 rounded-lg sm:rounded-xl border text-[10px] sm:text-xs font-bold transition shadow ${
                canPass
                  ? 'bg-amber-500 hover:bg-amber-400 text-stone-950 border-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.6)] animate-pulse ring-2 ring-amber-400 cursor-pointer'
                  : 'bg-stone-900 border-stone-700 hover:border-rose-400 text-stone-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none'
              }`}
            >
              {t.passTurn}
            </button>
          </div>
        </div>

        {/* Player Hand Rack */}
        <div className="p-2 sm:p-3 rounded-2xl bg-stone-950/80 border border-stone-800/80 shadow-[0_8px_30px_rgba(0,0,0,0.8)] max-w-full overflow-x-auto">
          <div className="flex items-center justify-center gap-2 px-2 min-w-max">
            {userPlayer?.hand.map((tile) => {
              const check = canPlayTile(tile, leftEnd, rightEnd);
              const playable = isMyTurn && (check.canLeft || check.canRight);
              const isSelected = selectedTileId === tile.id;

              return (
                <div key={tile.id} className="transition-transform duration-150">
                  <DominoPiece
                    tile={tile}
                    orientation="vertical"
                    size="md"
                    isPlayable={playable}
                    isSelected={isSelected}
                    onClick={() => handleTileClick(tile)}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </footer>

      {/* PAUSE MODAL */}
      {isPaused && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in"
          role="dialog"
          aria-modal="true"
          aria-label={t.paused}
        >
          <div className="w-full max-w-xs rounded-2xl bg-stone-900 border border-amber-500/30 p-6 text-center space-y-4 shadow-2xl">
            <img
              src="/bull-domino-logo.png"
              alt="Bull Domino"
              className="w-16 h-16 mx-auto object-contain drop-shadow-md"
            />
            <h3 className="text-xl font-black text-amber-300">{t.paused}</h3>
            <p className="text-xs text-stone-400">
              {t.pausedSubtitle}
            </p>
            <div className="space-y-2 pt-2">
              <button
                onClick={() => setIsPaused(false)}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold flex items-center justify-center gap-2 transition"
              >
                <Play className="w-4 h-4 fill-stone-950" /> {t.resume}
              </button>
              {!isMultiplayer && (
                <button
                  onClick={() => {
                    setIsPaused(false);
                    onRestartMatch();
                  }}
                  className="w-full py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-bold flex items-center justify-center gap-2 transition"
                >
                  <RotateCcw className="w-4 h-4" /> {t.restart}
                </button>
              )}
              <button
                onClick={() => {
                  setIsPaused(false);
                  onExitToTitle();
                }}
                className="w-full py-2.5 rounded-xl bg-stone-950 hover:bg-stone-800 text-stone-400 hover:text-white text-xs font-medium transition"
              >
                {t.exitToTitle}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ROUND OVER / GAME OVER MODAL */}
      {(isRoundOver || isGameOver) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-label={isGameOver ? t.gameOver : t.roundOver}
        >
          <div className="w-full max-w-md rounded-2xl bg-gradient-to-b from-stone-900 to-stone-950 border border-amber-500/40 p-6 text-center shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden">
            {/* Bull Domino Logo */}
            <img
              src="/bull-domino-logo.png"
              alt="Bull Domino"
              className="w-16 h-16 mx-auto object-contain drop-shadow-md mb-2"
            />
            {/* Fanfare badge */}
            <div className="text-4xl mb-2">
              {isGameOver
                ? (is2v2 ? (winningTeam === userTeam ? '👑' : '🤝') : (winnerId === userProfile.id ? '👑' : '🤝'))
                : (is2v2 ? (roundWinningTeam === userTeam ? '🎉' : '🔒') : (roundWinnerId === userProfile.id ? '🎉' : '🔒'))}
            </div>

            <h3 className="text-2xl font-black text-amber-300">
              {is2v2 ? (
                isGameOver
                  ? (winningTeam === userTeam ? t.teamVictory : t.teamDefeat)
                  : (roundWinningTeam === userTeam
                      ? (language === 'es' ? '¡Tu Equipo Ganó la Ronda!' : 'Your Team Won the Round!')
                      : (language === 'es' ? '¡El Equipo Rival Ganó la Ronda!' : 'Opponents Won the Round!'))
              ) : (
                isGameOver
                  ? (winnerId === userProfile.id ? t.gameWonCongratulations : t.gameConcluded)
                  : (roundEndReason === 'domino' ? t.dominoHandEmptied : t.boardBlocked)
              )}
            </h3>

            <p className="text-xs text-stone-300 mt-1">
              {is2v2 ? (
                isGameOver
                  ? `${winningTeam === userTeam ? t.yourTeam : t.rivalTeam} ${t.playerReachedTarget} ${targetScore} ${t.points.toLowerCase()}!`
                  : `${roundWinningTeam === userTeam ? t.yourTeam : t.rivalTeam} ${t.roundWinnerClaimsPoints} ${roundPointsAwarded} ${t.points.toLowerCase()}!`
              ) : (
                isGameOver
                  ? `${players.find(p => p.id === winnerId)?.name || 'Player'} ${t.playerReachedTarget} ${targetScore} ${t.points.toLowerCase()}!`
                  : roundWinnerId
                  ? `${players.find(p => p.id === roundWinnerId)?.name || 'Player'} ${t.roundWinnerClaimsPoints} ${roundPointsAwarded} ${t.points.toLowerCase()}!`
                  : t.roundBlockedTie
              )}
            </p>

            {/* Scoreboard Tiles */}
            {is2v2 ? (
              <div className="my-5 space-y-3">
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-stone-950/70 border border-stone-800">
                  <div className={`p-3 rounded-xl border text-center ${
                    (isGameOver ? winningTeam === userTeam : roundWinningTeam === userTeam)
                      ? 'bg-emerald-500/15 border-emerald-400/60 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                      : 'bg-stone-900/40 border-stone-800'
                  }`}>
                    <span className="text-xs font-black text-emerald-300 uppercase block">{t.yourTeam}</span>
                    <div className="text-3xl font-black text-white tabular-nums my-1">{myTeamScore}</div>
                    <span className="text-[10px] text-stone-400">Total / {targetScore}</span>
                  </div>
                  <div className={`p-3 rounded-xl border text-center ${
                    (isGameOver ? winningTeam === rivalTeam : roundWinningTeam === rivalTeam)
                      ? 'bg-rose-500/15 border-rose-400/60 shadow-[0_0_15px_rgba(244,63,94,0.2)]'
                      : 'bg-stone-900/40 border-stone-800'
                  }`}>
                    <span className="text-xs font-black text-rose-300 uppercase block">{t.rivalTeam}</span>
                    <div className="text-3xl font-black text-white tabular-nums my-1">{rivalTeamScore}</div>
                    <span className="text-[10px] text-stone-400">Total / {targetScore}</span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 text-center">
                  {players.map((p) => (
                    <div key={p.id} className="p-1.5 rounded-lg bg-stone-900/60 border border-stone-800">
                      <span className="text-[10px] font-bold text-white block truncate">{p.name}</span>
                      <span className={`text-[9px] font-semibold block ${p.team === userTeam ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {p.team === userTeam ? 'Equipo 1' : 'Equipo 2'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="my-5 p-4 rounded-xl bg-stone-950/60 border border-stone-800 grid grid-cols-2 gap-4">
                {players.map((p) => {
                  const isWinner = isGameOver ? p.id === winnerId : p.id === roundWinnerId;
                  return (
                    <div
                      key={p.id}
                      className={`p-3 rounded-lg border text-center ${
                        isWinner
                          ? 'bg-amber-500/10 border-amber-400/50 shadow-[0_0_12px_rgba(251,191,36,0.2)]'
                          : 'bg-stone-900/40 border-stone-800'
                      }`}
                    >
                      <span className="text-xs font-bold text-white block truncate">{p.name}</span>
                      <div className="text-2xl font-black text-amber-400 tabular-nums my-1">
                        {p.score}
                      </div>
                      <span className="text-[10px] text-stone-400">{t.totalScore}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              {isGameOver ? (
                <>
                  {!isMultiplayer && (
                    <button
                      data-start="true"
                      onClick={onRestartMatch}
                      className="py-3 px-5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition shadow"
                    >
                      <RotateCcw className="w-4 h-4" /> {t.rematch}
                    </button>
                  )}
                  <button
                    onClick={onOpenShareModal}
                    className="py-3 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <Share2 className="w-4 h-4 text-amber-400" /> {t.share}
                  </button>
                  <button
                    onClick={onExitToTitle}
                    className="py-3 px-4 rounded-xl bg-stone-950 hover:bg-stone-800 text-stone-400 hover:text-white text-xs font-medium transition"
                  >
                    {t.exitToTitle}
                  </button>
                </>
              ) : (
                <>
                  <button
                    data-start="true"
                    onClick={onNextRound}
                    className="w-full py-3 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition shadow"
                  >
                    <Play className="w-4 h-4 fill-stone-950" /> {t.nextRound}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
