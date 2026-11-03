import React, { useState } from 'react';
import { GameMode, MatchType, PlayerState } from '../types/domino';
import { useI18n } from '../utils/i18n';
import { AvatarDisplay } from './AvatarDisplay';
import {
  X,
  Users,
  Key,
  Copy,
  Check,
  Share2,
  Sparkles,
  ShieldCheck,
  Swords,
  Bot,
  Play,
  LogOut,
} from 'lucide-react';

interface PrivateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (options: {
    mode: GameMode;
    matchType: MatchType;
    targetScore: number;
    turnTimeLimit: number;
    customCode?: string;
  }) => void;
  onJoinRoom: (roomCode: string) => void;
  activeWaitingRoomId?: string | null;
  matchType?: MatchType;
  players?: PlayerState[];
  hostId?: string;
  currentUserId?: string;
  onAddBot?: () => void;
  onFillBotsAndStart?: () => void;
  onLeaveRoom?: () => void;
}

export const PrivateRoomModal: React.FC<PrivateRoomModalProps> = ({
  isOpen,
  onClose,
  onCreateRoom,
  onJoinRoom,
  activeWaitingRoomId,
  matchType = '2v2',
  players = [],
  hostId,
  currentUserId,
  onAddBot,
  onFillBotsAndStart,
  onLeaveRoom,
}) => {
  const { t, language } = useI18n();
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [selectedMatchType, setSelectedMatchType] = useState<MatchType>('2v2');
  const [mode, setMode] = useState<GameMode>('draw');
  const [targetScore, setTargetScore] = useState<number>(100);
  const [turnTimeLimit, setTurnTimeLimit] = useState<number>(30);
  const [customCode, setCustomCode] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const isHost = hostId ? hostId === currentUserId : true;
  const activeFormat = activeWaitingRoomId ? matchType : selectedMatchType;
  const maxPlayers = activeFormat === '2v2' ? 4 : 2;

  const handleCopyCode = () => {
    if (!activeWaitingRoomId) return;
    navigator.clipboard.writeText(activeWaitingRoomId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyInviteLink = () => {
    if (!activeWaitingRoomId) return;
    const inviteUrl = `${window.location.origin}?room=${activeWaitingRoomId}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Private Match & Friends Lobby"
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-gradient-to-b from-stone-900 to-stone-950 border border-amber-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.85)] overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between bg-stone-900/60 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <img
              src="/bull-domino-logo.png"
              alt="Bull Domino"
              className="w-6 h-6 object-contain drop-shadow"
            />
            <h2 className="text-lg font-bold text-amber-100">
              {activeWaitingRoomId ? t.waitingPlayersLobby : t.privateRoomTitle}
            </h2>
          </div>
          <button
            onClick={activeWaitingRoomId && onLeaveRoom ? onLeaveRoom : onClose}
            aria-label={t.close}
            className="w-8 h-8 rounded-full bg-stone-800 text-stone-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {activeWaitingRoomId ? (
          /* Waiting Lobby View with 2v2 Table Grid */
          <div className="p-6 overflow-y-auto space-y-5 text-center">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                {t.roomLiveEncrypted}
              </div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider bg-stone-950 px-2.5 py-1 rounded-lg border border-stone-800">
                {activeFormat === '2v2' ? 'Modalidad 2 vs 2' : 'Modalidad 1 vs 1'}
              </span>
            </div>

            <div>
              <span className="text-xs text-stone-400 block mb-1 uppercase tracking-wider font-semibold">
                {t.shareRoomCodePrompt}
              </span>
              <div className="text-3xl sm:text-4xl font-black text-amber-400 tracking-widest bg-stone-950 py-3 px-6 rounded-xl border border-amber-500/30 inline-block shadow-inner select-all font-mono">
                {activeWaitingRoomId}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <button
                onClick={handleCopyCode}
                className="py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copiedCode ? t.codeCopied : t.copyRoomCode}
              </button>
              <button
                onClick={handleCopyInviteLink}
                className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold flex items-center justify-center gap-1.5 transition shadow"
              >
                {copiedLink ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                {copiedLink ? t.linkCopied : t.copyInviteLink}
              </button>
            </div>

            {/* Players Slots Table */}
            <div className="bg-stone-950/60 border border-stone-800 rounded-xl p-4 text-left">
              <div className="flex items-center justify-between mb-3 border-b border-stone-800 pb-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  {language === 'es' ? 'Jugadores en la Mesa' : 'Players at Table'} ({players.length}/{maxPlayers})
                </span>
                {isHost && players.length < maxPlayers && onAddBot && (
                  <button
                    type="button"
                    onClick={onAddBot}
                    className="text-[11px] font-bold text-amber-300 hover:text-amber-200 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 px-2.5 py-1 rounded-lg flex items-center gap-1 transition"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>{t.addBotBtn}</span>
                  </button>
                )}
              </div>

              {activeFormat === '2v2' ? (
                /* 2v2 Teams View */
                <div className="grid grid-cols-2 gap-3">
                  {/* Team 1 */}
                  <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
                    <span className="text-[11px] font-black text-emerald-300 uppercase tracking-wider block mb-2">
                      {t.team1} ({t.yourTeam})
                    </span>
                    <div className="space-y-2">
                      {/* Seat 0 */}
                      {(() => {
                        const p = players.find(x => x.seatIndex === 0) || players[0];
                        return (
                          <div className="flex items-center gap-2 p-1.5 rounded-lg bg-stone-900/60 border border-stone-800">
                            {p ? (
                              <>
                                <AvatarDisplay avatarSeed={p.profile.avatarSeed} size="sm" />
                                <div className="min-w-0">
                                  <span className="text-xs font-bold text-white block truncate">{p.name}</span>
                                  <span className="text-[9px] text-amber-400 block font-semibold">Anfitrión (Tú)</span>
                                </div>
                              </>
                            ) : (
                              <span className="text-xs text-stone-500 italic p-1">Vacante</span>
                            )}
                          </div>
                        );
                      })()}
                      {/* Seat 2: Partner */}
                      {(() => {
                        const p = players.find(x => x.seatIndex === 2) || (players.length > 2 ? players[2] : null);
                        return (
                          <div className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-stone-900/60 border border-stone-800">
                            {p ? (
                              <div className="flex items-center gap-2 min-w-0">
                                <AvatarDisplay avatarSeed={p.profile.avatarSeed} size="sm" />
                                <div className="min-w-0">
                                  <span className="text-xs font-bold text-white block truncate">{p.name}</span>
                                  <span className="text-[9px] text-emerald-400 block font-semibold">
                                    {p.isAI ? 'Compañero (IA)' : 'Compañero'}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between w-full">
                                <span className="text-xs text-stone-500 italic">Compañero vacante</span>
                                {isHost && onAddBot && (
                                  <button
                                    type="button"
                                    onClick={onAddBot}
                                    className="text-[10px] text-amber-300 font-bold bg-amber-500/20 px-2 py-0.5 rounded border border-amber-400/30 hover:bg-amber-500/40"
                                  >
                                    + Bot
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Team 2 */}
                  <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/30">
                    <span className="text-[11px] font-black text-rose-300 uppercase tracking-wider block mb-2">
                      {t.team2} ({t.rivalTeam})
                    </span>
                    <div className="space-y-2">
                      {/* Seat 1: Rival 1 */}
                      {(() => {
                        const p = players.find(x => x.seatIndex === 1) || (players.length > 1 ? players[1] : null);
                        return (
                          <div className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-stone-900/60 border border-stone-800">
                            {p ? (
                              <div className="flex items-center gap-2 min-w-0">
                                <AvatarDisplay avatarSeed={p.profile.avatarSeed} size="sm" />
                                <div className="min-w-0">
                                  <span className="text-xs font-bold text-white block truncate">{p.name}</span>
                                  <span className="text-[9px] text-rose-400 block font-semibold">
                                    {p.isAI ? 'Rival 1 (IA)' : 'Rival 1'}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between w-full">
                                <span className="text-xs text-stone-500 italic">Rival 1 vacante</span>
                                {isHost && onAddBot && (
                                  <button
                                    type="button"
                                    onClick={onAddBot}
                                    className="text-[10px] text-amber-300 font-bold bg-amber-500/20 px-2 py-0.5 rounded border border-amber-400/30 hover:bg-amber-500/40"
                                  >
                                    + Bot
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                      {/* Seat 3: Rival 2 */}
                      {(() => {
                        const p = players.find(x => x.seatIndex === 3) || (players.length > 3 ? players[3] : null);
                        return (
                          <div className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-stone-900/60 border border-stone-800">
                            {p ? (
                              <div className="flex items-center gap-2 min-w-0">
                                <AvatarDisplay avatarSeed={p.profile.avatarSeed} size="sm" />
                                <div className="min-w-0">
                                  <span className="text-xs font-bold text-white block truncate">{p.name}</span>
                                  <span className="text-[9px] text-rose-400 block font-semibold">
                                    {p.isAI ? 'Rival 2 (IA)' : 'Rival 2'}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between w-full">
                                <span className="text-xs text-stone-500 italic">Rival 2 vacante</span>
                                {isHost && onAddBot && (
                                  <button
                                    type="button"
                                    onClick={onAddBot}
                                    className="text-[10px] text-amber-300 font-bold bg-amber-500/20 px-2 py-0.5 rounded border border-amber-400/30 hover:bg-amber-500/40"
                                  >
                                    + Bot
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              ) : (
                /* 1v1 View */
                <div className="grid grid-cols-2 gap-3">
                  {Array.from({ length: 2 }).map((_, idx) => {
                    const p = players[idx];
                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-stone-900/80 border border-stone-800 flex items-center justify-between"
                      >
                        {p ? (
                          <div className="flex items-center gap-2 min-w-0">
                            <AvatarDisplay avatarSeed={p.profile.avatarSeed} size="sm" />
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-white block truncate">{p.name}</span>
                              <span className="text-[9px] text-amber-400 block">
                                {idx === 0 ? 'Anfitrión (Tú)' : p.isAI ? 'Rival (IA)' : 'Rival'}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between w-full">
                            <span className="text-xs text-stone-500 italic">Esperando rival...</span>
                            {isHost && onAddBot && (
                              <button
                                type="button"
                                onClick={onAddBot}
                                className="text-[10px] text-amber-300 font-bold bg-amber-500/20 px-2 py-0.5 rounded border border-amber-400/30 hover:bg-amber-500/40"
                              >
                                + Bot
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Launch / Fill Buttons */}
            <div className="space-y-2">
              {isHost && onFillBotsAndStart && (
                <button
                  type="button"
                  onClick={onFillBotsAndStart}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-stone-950 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-lg"
                >
                  <Play className="w-4 h-4 fill-stone-950" />
                  <span>
                    {players.length >= maxPlayers
                      ? (language === 'es' ? 'Iniciar Partida Ahora' : 'Start Match Now')
                      : t.fillBotsAndStart}
                  </span>
                </button>
              )}

              {onLeaveRoom && (
                <button
                  type="button"
                  onClick={onLeaveRoom}
                  className="w-full py-2.5 rounded-xl bg-stone-950 hover:bg-stone-800 text-stone-400 hover:text-white text-xs font-medium flex items-center justify-center gap-1.5 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t.leaveLobby}</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Create / Join Forms */
          <div className="overflow-y-auto">
            {/* Tab switch */}
            <div className="flex border-b border-stone-800 bg-stone-950/40 px-6 pt-2">
              <button
                onClick={() => setTab('create')}
                className={`pb-3 px-4 text-xs font-bold transition border-b-2 ${
                  tab === 'create'
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-stone-400 hover:text-stone-200'
                }`}
              >
                {t.createRoomTab}
              </button>
              <button
                onClick={() => setTab('join')}
                className={`pb-3 px-4 text-xs font-bold transition border-b-2 ${
                  tab === 'join'
                    ? 'border-amber-400 text-amber-300'
                    : 'border-transparent text-stone-400 hover:text-stone-200'
                }`}
              >
                {t.joinRoomTab}
              </button>
            </div>

            <div className="p-6 space-y-4">
              {tab === 'create' ? (
                <>
                  {/* Match Format: 1v1 vs 2v2 */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-2">
                      {t.matchTypeLabel}
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setSelectedMatchType('2v2')}
                        className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 ${
                          selectedMatchType === '2v2'
                            ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                            : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                        }`}
                      >
                        <Users className="w-5 h-5 text-amber-400 flex-shrink-0" />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-white">2 vs 2</span>
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-400 text-stone-950">
                              Parejas
                            </span>
                          </div>
                          <span className="text-[10px] text-stone-400 block mt-0.5">
                            4 jugadores • 7 fichas c/u
                          </span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedMatchType('1v1')}
                        className={`p-3 rounded-xl border text-left transition flex items-center gap-2.5 ${
                          selectedMatchType === '1v1'
                            ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                            : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                        }`}
                      >
                        <Swords className="w-5 h-5 text-amber-400 flex-shrink-0" />
                        <div>
                          <span className="font-bold text-xs text-white block">1 vs 1</span>
                          <span className="text-[10px] text-stone-400 block mt-0.5">
                            2 jugadores • Duelo individual
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Game Mode */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-2">
                      {t.gameModeLabel}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'draw', label: t.draw, desc: language === 'es' ? 'Con robo' : 'With draw' },
                        { id: 'block', label: language === 'es' ? 'Tranca' : 'Block', desc: language === 'es' ? 'Solo paso' : 'Pass only' },
                        { id: 'all-fives', label: 'All-Fives', desc: language === 'es' ? 'Múltiplos de 5' : 'Multiples of 5' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setMode(item.id as GameMode)}
                          className={`p-2.5 rounded-xl border text-left transition ${
                            mode === item.id
                              ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                              : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                          }`}
                        >
                          <span className="font-bold text-xs block">{item.label}</span>
                          <span className="text-[10px] text-stone-400 block mt-0.5">{item.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Target Score */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-2">
                      {t.targetScoreLabel}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[50, 100, 150].map((score) => (
                        <button
                          key={score}
                          type="button"
                          onClick={() => setTargetScore(score)}
                          className={`py-2 rounded-xl border text-xs font-bold transition ${
                            targetScore === score
                              ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                              : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                          }`}
                        >
                          {score} {t.points}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Turn Timer */}
                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-2">
                      {t.turnTimerLabel}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { sec: 15, label: language === 'es' ? '15s Rápido' : '15s Blitz' },
                        { sec: 30, label: language === 'es' ? '30s Estándar' : '30s Standard' },
                        { sec: 60, label: language === 'es' ? '60s Relajado' : '60s Relaxed' },
                      ].map((timer) => (
                        <button
                          key={timer.sec}
                          type="button"
                          onClick={() => setTurnTimeLimit(timer.sec)}
                          className={`py-2 rounded-xl border text-xs font-bold transition ${
                            turnTimeLimit === timer.sec
                              ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                              : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                          }`}
                        >
                          {timer.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Code (Optional) */}
                  <div>
                    <label htmlFor="custom-code-input" className="block text-xs font-semibold text-stone-300 mb-1">
                      {t.customCodeOptional}
                    </label>
                    <input
                      id="custom-code-input"
                      type="text"
                      maxLength={8}
                      value={customCode}
                      onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                      placeholder={language === 'es' ? 'Ej: DOMINO26 (Vacío para aleatorio)' : 'e.g. VIP2026 (Leave blank for random)'}
                      className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-700 text-white text-xs font-mono tracking-widest uppercase focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <button
                    onClick={() =>
                      onCreateRoom({
                        mode,
                        matchType: selectedMatchType,
                        targetScore,
                        turnTimeLimit,
                        customCode: customCode.trim() || undefined,
                      })
                    }
                    className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-lg mt-2"
                  >
                    <Sparkles className="w-4 h-4" /> {t.createAndLaunchRoom}
                  </button>
                </>
              ) : (
                <>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="room-code-input" className="block text-xs font-semibold text-stone-300 mb-1">
                        {t.enterRoomCodePrompt}
                      </label>
                      <input
                        id="room-code-input"
                        type="text"
                        maxLength={10}
                        value={joinCodeInput}
                        onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                        placeholder={language === 'es' ? 'Ej: HABANA' : 'e.g. HAVANA'}
                        className="w-full px-4 py-3 rounded-xl bg-stone-950 border border-stone-700 text-white text-center text-lg font-mono font-black tracking-widest uppercase focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <button
                      onClick={() => {
                        if (joinCodeInput.trim()) {
                          onJoinRoom(joinCodeInput.trim());
                        }
                      }}
                      disabled={!joinCodeInput.trim()}
                      className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:pointer-events-none text-stone-950 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-lg"
                    >
                      <Key className="w-4 h-4" /> {t.joinMatchBtn}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
