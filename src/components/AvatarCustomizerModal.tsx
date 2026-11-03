import React, { useState } from 'react';
import { PlayerProfile } from '../types/domino';
import { useI18n } from '../utils/i18n';
import { AvatarDisplay } from './AvatarDisplay';
import { X, Check, Sparkles, User } from 'lucide-react';

interface AvatarCustomizerModalProps {
  isOpen: boolean;
  profile: PlayerProfile;
  onSave: (updated: PlayerProfile) => void;
  onClose: () => void;
}

const SKIN_TONES = [
  { label: 'Ivory Pale', labelEs: 'Marfil Pálido', value: '#ffd1b3' },
  { label: 'Golden Honey', labelEs: 'Miel Dorada', value: '#f1c27d' },
  { label: 'Warm Caramel', labelEs: 'Caramelo Cálido', value: '#e0ac69' },
  { label: 'Sun Bronzed', labelEs: 'Bronceado Solar', value: '#c68642' },
  { label: 'Rich Chestnut', labelEs: 'Castaño Intenso', value: '#8d5524' },
  { label: 'Deep Espresso', labelEs: 'Espresso Profundo', value: '#503322' },
];

const ACCESSORIES = [
  { label: 'Crown', labelEs: 'Corona', value: 'crown', icon: '👑' },
  { label: 'Captain', labelEs: 'Capitán', value: 'captain_hat', icon: '⚓' },
  { label: 'Monocle', labelEs: 'Monóculo', value: 'monocle', icon: '🧐' },
  { label: 'Fedora', labelEs: 'Fedora', value: 'fedora', icon: '🎩' },
  { label: 'Bandana', labelEs: 'Bandana', value: 'bandana', icon: '🤠' },
  { label: 'Headset', labelEs: 'Auriculares', value: 'headset', icon: '🎧' },
  { label: 'Laurel', labelEs: 'Laurel', value: 'laurel', icon: '🌿' },
  { label: 'Visor', labelEs: 'Visera', value: 'visor', icon: '🕶️' },
];

const BADGES = ['🎲', '👑', '💎', '⚡', '🐉', '⚓', '🛡️', '🏆', '🔥', '🌟', '🎯', '🍀'];

const BG_COLORS = [
  { label: 'Midnight', labelEs: 'Medianoche', value: '#1e293b' },
  { label: 'Royal Blue', labelEs: 'Azul Real', value: '#1d4ed8' },
  { label: 'Emerald Felt', labelEs: 'Fieltro Esmeralda', value: '#047857' },
  { label: 'Wine Velvet', labelEs: 'Terciopelo Vino', value: '#991b1b' },
  { label: 'Imperial Purple', labelEs: 'Púrpura Imperial', value: '#6b21a8' },
  { label: 'Amber Gold', labelEs: 'Oro Ámbar', value: '#b45309' },
];

const TITLES_EN = [
  'Domino Prodigy',
  'Havana Legend',
  'The Block Specialist',
  'Spinner Sovereign',
  'Double-Six Shark',
  'Grandmaster of Bones',
  'Tactical Ace',
  'Riverboat Gambler',
];

const TITLES_ES = [
  'Prodigio del Dominó',
  'Leyenda de La Habana',
  'Especialista en Tranca',
  'Soberano de la Mula',
  'Tiburón del Doble Seis',
  'Gran Maestro de Fichas',
  'As Táctico',
  'Jugador de Casino',
];

export const AvatarCustomizerModal: React.FC<AvatarCustomizerModalProps> = ({
  isOpen,
  profile,
  onSave,
  onClose,
}) => {
  const { t, language } = useI18n();
  const titles = language === 'es' ? TITLES_ES : TITLES_EN;

  const [name, setName] = useState(profile.name);
  const [title, setTitle] = useState(profile.title);
  const [skin, setSkin] = useState(profile.avatarSeed.skin || '#e0ac69');
  const [accessory, setAccessory] = useState(profile.avatarSeed.accessory || 'crown');
  const [dominoBadge, setDominoBadge] = useState(profile.avatarSeed.dominoBadge || '🎲');
  const [bgColor, setBgColor] = useState(profile.avatarSeed.bgColor || '#1e293b');

  if (!isOpen) return null;

  const currentAvatarSeed: PlayerProfile['avatarSeed'] = {
    skin,
    accessory,
    dominoBadge,
    bgColor,
    expression: profile.avatarSeed.expression || 'smile',
  };

  const handleSave = () => {
    onSave({
      ...profile,
      name: name.trim() || (language === 'es' ? 'Jugador' : 'Player'),
      title,
      avatarSeed: currentAvatarSeed,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={t.avatarStudioTitle}
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-gradient-to-b from-stone-900 to-stone-950 border border-amber-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.85)] max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between bg-stone-900/60">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-amber-100">{t.avatarStudioTitle}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label={t.close}
            className="w-8 h-8 rounded-full bg-stone-800 text-stone-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Live Preview Card */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-stone-950/60 border border-amber-500/20 shadow-inner">
            <AvatarDisplay
              avatarSeed={currentAvatarSeed}
              seasonTier={profile.seasonTier}
              size="lg"
            />
            <div>
              <span className="text-xs uppercase tracking-wider text-amber-400 font-semibold">
                {title}
              </span>
              <h3 className="text-lg font-bold text-white">{name || (language === 'es' ? 'Tu Nombre' : 'Your Name')}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
                  {language === 'es' ? `División ${profile.seasonTier}` : `${profile.seasonTier} Tier`}
                </span>
                <span className="text-xs text-stone-400 tabular-nums">
                  {profile.rankPoints} RP
                </span>
              </div>
            </div>
          </div>

          {/* Name & Title Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label htmlFor="player-name-input" className="block text-xs font-semibold text-stone-300 mb-1">
                {t.playerNameLabel}
              </label>
              <input
                id="player-name-input"
                type="text"
                value={name}
                maxLength={16}
                onChange={(e) => setName(e.target.value)}
                placeholder={language === 'es' ? 'Nombre de jugador' : 'Enter player name'}
                className="w-full px-3 py-2 rounded-lg bg-stone-950 border border-stone-700 text-white text-sm focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label htmlFor="player-title-select" className="block text-xs font-semibold text-stone-300 mb-1">
                {t.honorificTitleLabel}
              </label>
              <select
                id="player-title-select"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-stone-950 border border-stone-700 text-white text-sm focus:outline-none focus:border-amber-400"
              >
                {titles.map((tit) => (
                  <option key={tit} value={tit}>
                    {tit}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Skin Tone Selector */}
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-2">
              {t.skinToneLabel}
            </label>
            <div className="flex gap-2">
              {SKIN_TONES.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setSkin(item.value)}
                  aria-label={language === 'es' ? item.labelEs : item.label}
                  className={`w-9 h-9 rounded-full border-2 transition-transform ${
                    skin === item.value ? 'scale-110 border-amber-400 ring-2 ring-amber-400/50' : 'border-stone-700'
                  }`}
                  style={{ backgroundColor: item.value }}
                />
              ))}
            </div>
          </div>

          {/* Head Accessory */}
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-2">
              {t.accessoryLabel}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {ACCESSORIES.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setAccessory(item.value)}
                  className={`px-3 py-2 rounded-lg border text-xs font-medium flex items-center justify-center gap-1.5 transition ${
                    accessory === item.value
                      ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                      : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-white'
                  }`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{language === 'es' ? item.labelEs : item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Domino Badge Crest */}
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-2">
              {t.dominoBadgeLabel}
            </label>
            <div className="grid grid-cols-6 gap-2">
              {BADGES.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => setDominoBadge(b)}
                  className={`h-10 rounded-lg border text-lg flex items-center justify-center transition ${
                    dominoBadge === b
                      ? 'bg-amber-400/20 border-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.4)]'
                      : 'bg-stone-900 border-stone-800 hover:border-stone-600'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          {/* Frame Background Color */}
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-2">
              {t.bgColorLabel}
            </label>
            <div className="flex gap-2">
              {BG_COLORS.map((bg) => (
                <button
                  key={bg.value}
                  type="button"
                  onClick={() => setBgColor(bg.value)}
                  aria-label={language === 'es' ? bg.labelEs : bg.label}
                  className={`w-9 h-9 rounded-full border-2 transition-transform ${
                    bgColor === bg.value ? 'scale-110 border-amber-400 ring-2 ring-amber-400/50' : 'border-stone-700'
                  }`}
                  style={{ backgroundColor: bg.value }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-800 bg-stone-900/60 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-stone-400 hover:text-white transition"
          >
            {t.cancel}
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 flex items-center gap-1.5 transition shadow"
          >
            <Check className="w-4 h-4" /> {t.saveAvatarBtn}
          </button>
        </div>
      </div>
    </div>
  );
};

