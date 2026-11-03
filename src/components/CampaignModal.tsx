import React from 'react';
import { CAMPAIGN_STAGES } from '../game/campaignStages';
import { CampaignStage } from '../types/domino';
import { AvatarDisplay } from './AvatarDisplay';
import { useI18n } from '../utils/i18n';
import { X, Star, Lock, Swords, Sparkles } from 'lucide-react';

interface CampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignStars: Record<number, number>; // stageId -> stars
  onStartStage: (stage: CampaignStage) => void;
}

const STAGE_I18N_ES: Record<number, { title: string; subtitle: string; aiTitle: string; description: string; rewardSkin: string }> = {
  1: {
    title: 'Capítulo 1: El Salón de La Habana',
    subtitle: 'Aprende los fundamentos contra el Novato Rico',
    aiTitle: 'Callejero de La Habana',
    description: 'Un acogedor salón con aroma a tabaco en la vieja Habana. Rico juega dominó directo: ¡deshazte de tus fichas pesadas y vigila el pozo!',
    rewardSkin: 'Madera de Cedro de La Habana',
  },
  2: {
    title: 'Capítulo 2: El Barco de Vapor de Kingston',
    subtitle: 'Duelo en modo Tranca con el Capitán Cross',
    aiTitle: 'Tahúr del Río',
    description: '¡Sin la red de seguridad del pozo! Cada conteo de fichas importa. El Capitán Cross se especializa en cerrar los extremos cuando te quedas sin palos.',
    rewardSkin: 'Fieltro Esmeralda del Río',
  },
  3: {
    title: 'Capítulo 3: La Plaza de San Juan',
    subtitle: 'Maestría de Todos los Cincos con la Señora Carmen',
    aiTitle: 'Campeona de la Plaza',
    description: '¡Los extremos abiertos suman puntos cuando su suma es múltiplo de 5! Calcula con antelación para ganar puntos de bonificación inmediatos.',
    rewardSkin: 'Pintas de Marfil Imperial',
  },
  4: {
    title: 'Capítulo 4: Monte Carlo High Roller',
    subtitle: 'Partida rápida a altas apuestas con el Barón von Pip',
    aiTitle: 'Aristócrata de Mónaco',
    description: 'Campeonato de ritmo acelerado en Mónaco. El Barón anticipa tus robos del pozo y reserva sus mulas para hacer jugadas devastadoras.',
    rewardSkin: 'Mármol Real de Mónaco',
  },
  5: {
    title: 'Capítulo 5: Grand Slam del Caribe',
    subtitle: 'Partida de eliminación con el Maestro Chen',
    aiTitle: 'Gran Estratega',
    description: 'El Maestro Chen rastrea cada ficha jugada del conjunto de 28. Calcula matrices de probabilidad y te forzará a dar pasos desastrosos.',
    rewardSkin: 'Obsidiana Dorada del Dragón',
  },
  6: {
    title: 'Capítulo 6: El Cónclave de Campeones',
    subtitle: 'El enfrentamiento final de dominó mundial',
    aiTitle: 'Gran Maestra Absoluta',
    description: 'La prueba definitiva. Domina las 28 fichas, anticipa cada mula y reclama la Corona Mundial de Dominó.',
    rewardSkin: 'Corona Suprema de Oro y Diamante',
  },
};

export const CampaignModal: React.FC<CampaignModalProps> = ({
  isOpen,
  onClose,
  campaignStars,
  onStartStage,
}) => {
  const { t, language } = useI18n();
  if (!isOpen) return null;

  const totalStars = Object.values(campaignStars).reduce((a, b) => a + b, 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={t.campaignTitle}
    >
      <div className="relative w-full max-w-2xl rounded-2xl bg-gradient-to-b from-stone-900 to-stone-950 border border-amber-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.85)] max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between bg-stone-900/60">
          <div className="flex items-center gap-3">
            <Swords className="w-5 h-5 text-amber-400" />
            <div>
              <h2 className="text-lg font-bold text-amber-100">{t.campaignTitle}</h2>
              <span className="text-xs text-amber-300 flex items-center gap-1 font-semibold">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                {totalStars} / 18 {t.starsEarnedTotal}
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

        {/* Stages List */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {CAMPAIGN_STAGES.map((stage) => {
            const stars = campaignStars[stage.id] || 0;
            const isUnlocked = totalStars >= stage.unlockRequirementStars;
            const localized = language === 'es' ? STAGE_I18N_ES[stage.id] : null;

            const stageTitle = localized?.title || stage.title;
            const stageAiTitle = localized?.aiTitle || stage.aiTitle;
            const stageDesc = localized?.description || stage.description;
            const stageRewardSkin = localized?.rewardSkin || stage.rewardSkin;

            const localizedMode = stage.mode === 'draw' ? t.draw : stage.mode === 'block' ? (language === 'es' ? 'Tranca' : 'Block') : 'All-Fives';
            const localizedDifficulty = stage.aiDifficulty === 'novice' ? (language === 'es' ? 'Principiante' : 'Novice') : stage.aiDifficulty === 'tactician' ? (language === 'es' ? 'Táctico' : 'Tactician') : (language === 'es' ? 'Gran Maestro' : 'Grandmaster');

            return (
              <div
                key={stage.id}
                className={`p-4 rounded-xl border transition-all ${
                  isUnlocked
                    ? 'bg-stone-900/80 border-stone-800 hover:border-amber-500/50 hover:bg-stone-900 shadow-md'
                    : 'bg-stone-950/60 border-stone-900 opacity-60'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Opponent & Chapter Info */}
                  <div className="flex items-start sm:items-center gap-3">
                    <AvatarDisplay
                      avatarSeed={stage.aiAvatar}
                      seasonTier={
                        stage.aiDifficulty === 'grandmaster'
                          ? 'Domino Legend'
                          : stage.aiDifficulty === 'tactician'
                          ? 'Diamond'
                          : 'Bronze'
                      }
                      size="md"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase tracking-wider text-amber-400 font-bold">
                          {stageTitle}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-stone-800 text-stone-300 border border-stone-700 uppercase font-semibold">
                          {localizedMode} • {localizedDifficulty}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white mt-0.5">
                        vs. {stage.aiName} ({stageAiTitle})
                      </h3>
                      <p className="text-xs text-stone-400 mt-1 max-w-md">
                        {stageDesc}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-stone-400">
                        <span>{t.target}: <strong className="text-amber-300">{stage.targetScore} {t.points}</strong></span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-amber-300/90">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          {t.rewardSkinLabel}: {stageRewardSkin}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action & Stars */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-stone-800">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3].map((starIdx) => (
                        <Star
                          key={starIdx}
                          className={`w-4 h-4 ${
                            starIdx <= stars
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-stone-700'
                          }`}
                        />
                      ))}
                    </div>

                    {isUnlocked ? (
                      <button
                        onClick={() => {
                          onStartStage(stage);
                          onClose();
                        }}
                        className="px-4 py-2 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 flex items-center gap-1.5 transition shadow"
                      >
                        <Swords className="w-3.5 h-3.5" />
                        {stars > 0 ? (language === 'es' ? 'Repetir' : 'Replay') : (language === 'es' ? 'Duelo' : 'Duel')}
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 text-xs text-stone-500 font-medium">
                        <Lock className="w-3.5 h-3.5" />
                        <span>{t.lockedRequirement} {stage.unlockRequirementStars} {language === 'es' ? 'Estrellas' : 'Stars'}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
