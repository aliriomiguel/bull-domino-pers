import React from 'react';
import { MatchType, PlayerState } from '../types/domino';
import { useI18n } from '../utils/i18n';
import { AvatarDisplay } from './AvatarDisplay';
import { X, Users, Bot, Play, Sparkles, ShieldCheck, Swords, Loader2 } from 'lucide-react';

interface MatchmakingModalProps {
  isOpen: boolean;
  onClose: () => void;
  matchType: MatchType;
  players: PlayerState[];
  isSearching: boolean;
  onSelectMatchType: (type: MatchType) => void;
  onFillBotsAndStart: () => void;
}

export const MatchmakingModal: React.FC<MatchmakingModalProps> = ({
  isOpen,
  onClose,
  matchType,
  players,
  isSearching,
  onSelectMatchType,
  onFillBotsAndStart,
}) => {
  const { t, language } = useI18n();

  if (!isOpen) return null;

  const maxPlayers = matchType === '2v2' ? 4 : 2;
  const currentCount = players.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Online Matchmaking"
    >
      <div className="relative w-full max-w-md rounded-2xl bg-gradient-to-b from-stone-900 to-stone-950 border border-amber-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.85)] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between bg-stone-900/60">
          <div className="flex items-center gap-2.5">
            <img
              src="/bull-domino-logo.png"
              alt="Bull Domino"
              className="w-6 h-6 object-contain drop-shadow"
            />
            <h2 className="text-lg font-bold text-amber-100">
              {isSearching ? t.quickMatchQueue : t.matchTypeLabel}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label={t.close}
            className="w-8 h-8 rounded-full bg-stone-800 text-stone-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {!isSearching ? (
            /* Choose 1v1 or 2v2 */
            <div className="space-y-4">
              <p className="text-xs text-stone-300 text-center font-medium">
                {language === 'es'
                  ? 'Elige la modalidad para buscar rivales en tiempo real:'
                  : 'Choose format to match with real-time players:'}
              </p>

              <div className="grid grid-cols-1 gap-3">
                <button
                  type="button"
                  onClick={() => onSelectMatchType('2v2')}
                  className="p-4 rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent hover:border-amber-400 hover:from-amber-500/25 transition text-left flex items-center gap-4 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300 group-hover:scale-105 transition">
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white group-hover:text-amber-300 transition">
                        {t.matchType2v2}
                      </span>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400 text-stone-950">
                        {language === 'es' ? 'Destacado' : 'Popular'}
                      </span>
                    </div>
                    <span className="text-xs text-stone-400 block mt-0.5">
                      {t.matchType2v2Desc}
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onSelectMatchType('1v1')}
                  className="p-4 rounded-xl border border-stone-800 bg-stone-950/60 hover:border-stone-700 hover:bg-stone-900 transition text-left flex items-center gap-4 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-stone-800 border border-stone-700 flex items-center justify-center text-stone-300 group-hover:scale-105 transition">
                    <Swords className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <span className="font-bold text-sm text-white group-hover:text-amber-300 transition block">
                      {t.matchType1v1}
                    </span>
                    <span className="text-xs text-stone-400 block mt-0.5">
                      {t.matchType1v1Desc}
                    </span>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            /* Queue / Searching state */
            <div className="space-y-5 text-center">
              <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-amber-400/20 animate-ping" />
                <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-400/50 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-white mb-1">
                  {matchType === '2v2' ? 'Buscando Partida 2 vs 2...' : 'Buscando Rival 1 vs 1...'}
                </h3>
                <p className="text-xs text-stone-400">
                  {t.quickMatchQueueDesc} • ({currentCount}/{maxPlayers} {language === 'es' ? 'jugadores' : 'players'})
                </p>
              </div>

              {/* Slot Avatars */}
              <div className="flex justify-center items-center gap-3 py-2">
                {Array.from({ length: maxPlayers }).map((_, idx) => {
                  const p = players[idx];
                  return (
                    <div
                      key={idx}
                      className={`w-14 h-14 rounded-2xl border flex flex-col items-center justify-center p-1 transition ${
                        p
                          ? 'border-amber-400 bg-amber-500/10'
                          : 'border-dashed border-stone-700 bg-stone-950/40 text-stone-600'
                      }`}
                    >
                      {p ? (
                        <>
                          <AvatarDisplay avatarSeed={p.profile.avatarSeed} size="sm" />
                          <span className="text-[10px] text-white font-bold truncate max-w-[48px] mt-0.5">
                            {p.name}
                          </span>
                        </>
                      ) : (
                        <div className="text-[10px] font-bold text-stone-500">
                          {idx + 1}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Instant Fill Bot CTA */}
              <div className="pt-2 border-t border-stone-800 space-y-2">
                <button
                  type="button"
                  onClick={onFillBotsAndStart}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-stone-950 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-lg"
                >
                  <Bot className="w-4 h-4" />
                  <span>{t.fillBotsAndStart}</span>
                </button>
                <p className="text-[11px] text-stone-400">
                  {language === 'es'
                    ? '¿No quieres esperar? Completa los lugares vacíos con IA táctica al instante.'
                    : "Don't want to wait? Fill empty slots with tactical AI instantly."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
