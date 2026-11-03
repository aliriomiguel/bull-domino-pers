import React, { useState, useEffect } from 'react';
import { PlayerProfile } from '../types/domino';
import { useI18n } from '../utils/i18n';
import { AvatarDisplay } from './AvatarDisplay';
import { X, Trophy, Gift, BarChart2, Crown, Flame, ShieldCheck, Clock } from 'lucide-react';

interface LeaderboardModalProps {
  isOpen: boolean;
  userProfile: PlayerProfile;
  onClose: () => void;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  title: string;
  seasonTier: PlayerProfile['seasonTier'];
  rankPoints: number;
  winRate: number;
  dominoesCount: number;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  userProfile,
  onClose,
}) => {
  const { t, language } = useI18n();
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'rewards' | 'analytics'>('leaderboard');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch('/api/leaderboard')
      .then((res) => res.json())
      .then((data) => {
        // Insert user dynamically into leaderboard if not present
        const list: LeaderboardEntry[] = data.leaderboard || [];
        const hasUser = list.some((e) => e.id === userProfile.id);
        if (!hasUser) {
          const userWinRate = userProfile.stats.matchesPlayed > 0
            ? Math.round((userProfile.stats.matchesWon / userProfile.stats.matchesPlayed) * 100)
            : 0;
          list.push({
            id: userProfile.id,
            name: userProfile.name,
            title: userProfile.title,
            seasonTier: userProfile.seasonTier,
            rankPoints: userProfile.rankPoints,
            winRate: userWinRate,
            dominoesCount: userProfile.stats.dominoesCount,
          });
          list.sort((a, b) => b.rankPoints - a.rankPoints);
        }
        setEntries(list);
        setLoading(false);
      })
      .catch(() => {
        // Fallback default list
        setEntries([
          { id: '1', name: 'DominoKing_99', title: language === 'es' ? 'Leyenda de La Habana' : 'Havana Legend', seasonTier: 'Domino Legend', rankPoints: 4850, winRate: 78, dominoesCount: 312 },
          { id: '2', name: 'BoneMaster_X', title: language === 'es' ? 'Maestro de la Mula' : 'Spinner Master', seasonTier: 'Diamond', rankPoints: 4210, winRate: 72, dominoesCount: 245 },
          { id: '3', name: 'TacticalDouble', title: language === 'es' ? 'As Táctico' : 'Master Tactician', seasonTier: 'Diamond', rankPoints: 3980, winRate: 69, dominoesCount: 210 },
          { id: userProfile.id, name: userProfile.name, title: userProfile.title, seasonTier: userProfile.seasonTier, rankPoints: userProfile.rankPoints, winRate: 65, dominoesCount: userProfile.stats.dominoesCount },
        ]);
        setLoading(false);
      });
  }, [isOpen, userProfile, language]);

  if (!isOpen) return null;

  const winRate = userProfile.stats.matchesPlayed > 0
    ? Math.round((userProfile.stats.matchesWon / userProfile.stats.matchesPlayed) * 100)
    : 0;

  const seasonalRewards = language === 'es' ? [
    {
      tier: 'Domino Legend',
      rp: '4500+ RP',
      border: 'border-purple-400/50 bg-purple-950/20',
      reward: 'Fichas Doradas Brillantes y Corona de Emperador',
      badge: '👑',
    },
    {
      tier: 'Diamond',
      rp: '3800 - 4499 RP',
      border: 'border-cyan-400/50 bg-cyan-950/20',
      reward: 'Fichas de Obsidiana Negra y Manto Real',
      badge: '💎',
    },
    {
      tier: 'Platinum',
      rp: '3000 - 3799 RP',
      border: 'border-emerald-400/50 bg-emerald-950/20',
      reward: 'Tapete de Terciopelo Esmeralda y Blasón de Diamante',
      badge: '🛡️',
    },
    {
      tier: 'Gold',
      rp: '2200 - 2999 RP',
      border: 'border-amber-400/50 bg-amber-950/20',
      reward: 'Puntos con Incrustación de Plata y Sombrero de Copa',
      badge: '🏆',
    },
    {
      tier: 'Silver',
      rp: '1500 - 2199 RP',
      border: 'border-slate-400/50 bg-slate-950/20',
      reward: '1,500 Monedas de Trofeo y Corona de Laurel',
      badge: '🌿',
    },
  ] : [
    {
      tier: 'Domino Legend',
      rp: '4500+ RP',
      border: 'border-purple-400/50 bg-purple-950/20',
      reward: 'Golden Spinner Bones & Emperor Crown',
      badge: '👑',
    },
    {
      tier: 'Diamond',
      rp: '3800 - 4499 RP',
      border: 'border-cyan-400/50 bg-cyan-950/20',
      reward: 'Obsidian Black Bones & Royal Mantle',
      badge: '💎',
    },
    {
      tier: 'Platinum',
      rp: '3000 - 3799 RP',
      border: 'border-emerald-400/50 bg-emerald-950/20',
      reward: 'Emerald Velvet Felt Mat & Diamond Crest',
      badge: '🛡️',
    },
    {
      tier: 'Gold',
      rp: '2200 - 2999 RP',
      border: 'border-amber-400/50 bg-amber-950/20',
      reward: 'Silver Pip Inlays & Top Hat Accessory',
      badge: '🏆',
    },
    {
      tier: 'Silver',
      rp: '1500 - 2199 RP',
      border: 'border-slate-400/50 bg-slate-950/20',
      reward: '1,500 Trophy Coins & Bronze Laurel',
      badge: '🌿',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={t.leaderboardTitle}
    >
      <div className="relative w-full max-w-2xl rounded-2xl bg-gradient-to-b from-stone-900 to-stone-950 border border-amber-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.85)] max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between bg-stone-900/70">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-lg font-bold text-amber-100">
                {language === 'es' ? 'Copa Gran Doble' : 'The Grand Spinner Cup'}
              </h2>
              <span className="text-xs text-amber-400/80 flex items-center gap-1">
                <Clock className="w-3 h-3" /> {language === 'es' ? 'Temporada 1 • 14 Días Restantes' : 'Season 1 • 14 Days Remaining'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label={t.close}
            className="w-8 h-8 rounded-full bg-stone-800 text-stone-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-stone-800 bg-stone-950/40 px-6 pt-2">
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
              activeTab === 'leaderboard'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Trophy className="w-4 h-4" /> {t.globalLeaderboardTab}
          </button>
          <button
            onClick={() => setActiveTab('rewards')}
            className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
              activeTab === 'rewards'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Gift className="w-4 h-4" /> {t.seasonRewardsTab}
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`pb-3 px-4 text-xs font-bold transition border-b-2 flex items-center gap-2 ${
              activeTab === 'analytics'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <BarChart2 className="w-4 h-4" /> {t.analyticsTab}
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'leaderboard' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs uppercase tracking-wider text-stone-500 font-semibold px-3">
                <span>{t.rankCol} & {t.playerCol}</span>
                <span className="flex items-center gap-6">
                  <span className="hidden sm:inline">{t.winRateCol}</span>
                  <span>{t.rpCol}</span>
                </span>
              </div>

              {loading ? (
                <div className="py-12 text-center text-stone-400 text-sm">
                  {language === 'es' ? 'Cargando clasificación del campeonato...' : 'Fetching championship standings...'}
                </div>
              ) : (
                entries.map((entry, idx) => {
                  const isCurrentUser = entry.id === userProfile.id;
                  const rankNum = idx + 1;
                  return (
                    <div
                      key={entry.id}
                      className={`flex items-center justify-between p-3 rounded-xl border transition ${
                        isCurrentUser
                          ? 'bg-amber-500/10 border-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.15)]'
                          : 'bg-stone-900/60 border-stone-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 text-center font-black text-sm">
                          {rankNum === 1 && <span className="text-amber-400 text-lg">🥇</span>}
                          {rankNum === 2 && <span className="text-slate-300 text-lg">🥈</span>}
                          {rankNum === 3 && <span className="text-amber-600 text-lg">🥉</span>}
                          {rankNum > 3 && <span className="text-stone-500">#{rankNum}</span>}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">
                              {entry.name}
                            </span>
                            {isCurrentUser && (
                              <span className="text-[10px] bg-amber-400 text-stone-950 font-black px-1.5 py-0.2 rounded">
                                {language === 'es' ? 'TÚ' : 'YOU'}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-stone-400 block">
                            {entry.title} • {entry.seasonTier}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="hidden sm:flex flex-col items-end">
                          <span className="text-xs font-bold text-emerald-400">{entry.winRate}%</span>
                          <span className="text-[10px] text-stone-500">
                            {entry.dominoesCount} {language === 'es' ? 'Dominós' : 'Dominoes'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-amber-400 tabular-nums">
                            {entry.rankPoints}
                          </span>
                          <span className="text-[10px] text-stone-400 block">RP</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'rewards' && (
            <div className="space-y-4">
              <p className="text-xs text-stone-400">
                {language === 'es'
                  ? 'Termina la temporada en la división más alta para desbloquear recompensas exclusivas, insignias y estilos de mesa.'
                  : 'End the season in the highest tier possible to unlock prestigious exclusive rewards, badges, and custom domino table materials!'}
              </p>

              <div className="space-y-3">
                {seasonalRewards.map((r) => (
                  <div
                    key={r.tier}
                    className={`p-4 rounded-xl border flex items-center justify-between ${r.border}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{r.badge}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-white text-sm">{r.tier}</strong>
                          <span className="text-xs text-stone-400 font-medium">({r.rp})</span>
                        </div>
                        <span className="text-xs text-amber-300 block">{r.reward}</span>
                      </div>
                    </div>
                    {userProfile.seasonTier === r.tier && (
                      <span className="text-xs px-2 py-1 rounded bg-amber-400 text-stone-950 font-black">
                        {language === 'es' ? 'División Actual' : 'Current Tier'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 text-center">
                  <span className="text-[10px] text-stone-400 uppercase font-semibold">{t.winRateCol}</span>
                  <div className="text-xl font-black text-emerald-400 mt-1">{winRate}%</div>
                  <span className="text-[10px] text-stone-500">
                    {language === 'es'
                      ? `${userProfile.stats.matchesWon} de ${userProfile.stats.matchesPlayed} partidas`
                      : `${userProfile.stats.matchesWon} of ${userProfile.stats.matchesPlayed} matches`}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 text-center">
                  <span className="text-[10px] text-stone-400 uppercase font-semibold">{t.statsDominoes}</span>
                  <div className="text-xl font-black text-amber-400 mt-1">{userProfile.stats.dominoesCount}</div>
                  <span className="text-[10px] text-stone-500">
                    {language === 'es' ? 'Manos vaciadas' : 'Hand clearances'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 text-center">
                  <span className="text-[10px] text-stone-400 uppercase font-semibold">{t.statsWinStreak}</span>
                  <div className="text-xl font-black text-rose-400 mt-1 flex items-center justify-center gap-1">
                    <Flame className="w-5 h-5 text-rose-500" />
                    {userProfile.stats.winStreak}
                  </div>
                  <span className="text-[10px] text-stone-500">
                    {language === 'es' ? 'Mejor:' : 'Best:'} {userProfile.stats.bestWinStreak}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 text-center">
                  <span className="text-[10px] text-stone-400 uppercase font-semibold">{t.statsHighestScore}</span>
                  <div className="text-xl font-black text-amber-300 mt-1">{userProfile.stats.highestScore}</div>
                  <span className="text-[10px] text-stone-500">
                    {language === 'es' ? 'En una ronda' : 'Single round'}
                  </span>
                </div>
              </div>

              {/* Performance Summary Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-stone-950 to-stone-900 border border-amber-500/30 flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase tracking-wider text-amber-400 font-bold">
                    {language === 'es' ? 'Posición Competitiva' : 'Competitive Standing'}
                  </span>
                  <h4 className="text-base font-bold text-white mt-0.5">
                    {language === 'es'
                      ? `División ${userProfile.seasonTier} • ${userProfile.rankPoints} Puntos`
                      : `${userProfile.seasonTier} Division • ${userProfile.rankPoints} Points`}
                  </h4>
                  <p className="text-xs text-stone-400 mt-1">
                    {language === 'es'
                      ? 'Top 12% entre todos los tácticos de dominó activos esta temporada.'
                      : 'Top 12% among all active domino tacticians this season.'}
                  </p>
                </div>
                <Crown className="w-10 h-10 text-amber-400/60" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

