import React, { useEffect, useState } from 'react';
import { DominoPiece } from './DominoPiece';
import { AvatarDisplay } from './AvatarDisplay';
import { PlayerProfile } from '../types/domino';
import { sound } from '../utils/sound';
import { useI18n, LanguageSwitcherButton } from '../utils/i18n';
import {
  Play,
  Users,
  Swords,
  BookOpen,
  Trophy,
  User,
  Volume2,
  VolumeX,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface TitleScreenProps {
  userProfile: PlayerProfile;
  onQuickMatch: () => void;
  onOpenPrivateRoom: () => void;
  onOpenCampaign: () => void;
  onOpenTutorial: () => void;
  onOpenLeaderboard: () => void;
  onOpenAvatarStudio: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  userProfile,
  onQuickMatch,
  onOpenPrivateRoom,
  onOpenCampaign,
  onOpenTutorial,
  onOpenLeaderboard,
  onOpenAvatarStudio,
}) => {
  const { t, language } = useI18n();
  const [isMuted, setIsMuted] = useState(sound.isMuted());
  const [rotationAngle, setRotationAngle] = useState(0);

  // Key listeners for Enter / Space to start and M to mute
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        sound.playTileClack(true);
        onQuickMatch();
      } else if (e.key === 'm' || e.key === 'M') {
        const next = sound.toggleMute();
        setIsMuted(next);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onQuickMatch]);

  // Ambient gentle rotation for hero centerpiece
  useEffect(() => {
    const interval = setInterval(() => {
      setRotationAngle((prev) => (prev + 0.5) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const handleToggleMute = () => {
    const next = sound.toggleMute();
    setIsMuted(next);
  };

  return (
    <div
      className="relative w-full h-screen bg-[#071c12] text-stone-100 flex flex-col justify-between overflow-hidden select-none font-sans"
      style={{
        backgroundImage: `radial-gradient(circle at 50% 30%, #0d3824 0%, #061e13 55%, #020a06 100%)`,
      }}
    >
      {/* Background Decorative Domino Patterns */}
      <div className="absolute inset-0 pointer-events-none opacity-5 overflow-hidden">
        <div className="absolute -top-10 -left-10 rotate-12 scale-150">
          <DominoPiece tile={{ id: '6-6', left: 6, right: 6 }} size="lg" isFaceDown />
        </div>
        <div className="absolute top-1/4 -right-12 -rotate-45 scale-150">
          <DominoPiece tile={{ id: '5-5', left: 5, right: 5 }} size="lg" isFaceDown />
        </div>
        <div className="absolute bottom-10 left-12 rotate-45 scale-125">
          <DominoPiece tile={{ id: '4-4', left: 4, right: 4 }} size="lg" isFaceDown />
        </div>
      </div>

      {/* Top Bar: Profile Strip & Sound Utility */}
      <header className="relative z-10 w-full px-6 py-4 flex items-center justify-between">
        <button
          onClick={onOpenAvatarStudio}
          aria-label="Open Avatar Profile"
          className="flex items-center gap-3 p-1.5 pr-4 rounded-full bg-stone-900/80 border border-amber-500/30 hover:border-amber-400 hover:bg-stone-900 transition shadow-lg backdrop-blur-none group"
        >
          <AvatarDisplay
            avatarSeed={userProfile.avatarSeed}
            seasonTier={userProfile.seasonTier}
            size="sm"
          />
          <div className="text-left">
            <div className="text-xs font-bold text-white group-hover:text-amber-300 transition flex items-center gap-1.5">
              <span>{userProfile.name}</span>
              <span className="text-[10px] text-amber-400 font-normal">
                {userProfile.avatarSeed.dominoBadge}
              </span>
            </div>
            <div className="text-[10px] text-stone-400 flex items-center gap-1.5">
              <span>{userProfile.title}</span>
              <span>•</span>
              <span className="text-amber-300 font-semibold">{userProfile.rankPoints} RP</span>
            </div>
          </div>
        </button>

        <div className="flex items-center gap-2">
          {/* Language Switcher Button (ES | EN) */}
          <LanguageSwitcherButton size="md" />

          {/* E2EE Security Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-[11px] text-emerald-300 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t.e2eeNetwork}</span>
          </div>

          {/* Mute Button */}
          <button
            onClick={handleToggleMute}
            aria-label={isMuted ? t.unmuted : t.muted}
            title={isMuted ? t.unmuted : t.muted}
            className="w-9 h-9 rounded-full bg-stone-900/80 border border-stone-700/80 hover:border-amber-400/60 text-stone-300 hover:text-white flex items-center justify-center transition shadow"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </header>

      {/* Main Centerpiece Stage & Bespoke SVG Title */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 max-w-4xl mx-auto w-full text-center">
        {/* Interactive Hero Showcase Bull Domino Logo */}
        <div className="relative mb-3 cursor-pointer group flex items-center justify-center" onClick={() => sound.playTileClack(true)}>
          {/* Pulsing Backlight glow matching the logo's red, gold, and electric blue hues */}
          <div className="absolute -inset-8 bg-gradient-to-r from-rose-600/30 via-amber-500/25 to-blue-600/35 rounded-full blur-2xl pointer-events-none group-hover:scale-110 transition duration-500 -z-10" />

          {/* Interactive animated Bull Domino Logo */}
          <div
            className="transition-transform duration-300 transform group-hover:scale-105 active:scale-95 drop-shadow-[0_20px_35px_rgba(0,0,0,0.85)]"
            style={{ transform: `rotate(${Math.sin(rotationAngle * 0.04) * 2.5}deg)` }}
          >
            <img
              src="/bull-domino-logo.png"
              alt="Bull Domino Logo"
              className="w-44 sm:w-52 md:w-60 h-auto object-contain select-none"
            />
          </div>
        </div>

        {/* Bespoke Inline SVG Title Lockup */}
        <div className="mb-2">
          <svg
            viewBox="0 0 600 85"
            className="w-full max-w-[460px] sm:max-w-[540px] h-auto drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
            aria-label="Bull Domino Title Lockup"
          >
            <defs>
              <linearGradient id="goldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#eab308" />
                <stop offset="100%" stopColor="#ca8a04" />
              </linearGradient>
              <linearGradient id="silverGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#cbd5e1" />
              </linearGradient>
            </defs>
            {/* Crown icon on top */}
            <path
              d="M 300 6 L 308 17 L 320 10 L 316 23 L 284 23 L 280 10 L 292 17 Z"
              fill="url(#goldGradient)"
            />
            {/* Main Title Text */}
            <text
              x="300"
              y="54"
              textAnchor="middle"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fontSize="44"
              letterSpacing="4"
              fill="url(#goldGradient)"
              stroke="#451a03"
              strokeWidth="1.5"
              style={{ paintOrder: 'stroke fill' }}
            >
              BULL DOMINO
            </text>
            <text
              x="300"
              y="78"
              textAnchor="middle"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="800"
              fontSize="15"
              letterSpacing="7"
              fill="url(#silverGradient)"
            >
              {language === 'es' ? 'DOMINÓ ONLINE 1v1 & 2v2' : '1v1 & 2v2 ONLINE DOMINOES'}
            </text>
          </svg>
        </div>

        <p className="text-xs sm:text-sm text-stone-300 max-w-md mx-auto mb-8 font-medium">
          {language === 'es'
            ? 'Campeonato Táctico de Doble-Seis • WebSockets en Tiempo Real • Mesas Cifradas E2EE'
            : 'Tactical Double-Six Championship • Real-Time WebSockets • E2EE Encrypted Social Tables'}
        </p>

        {/* Primary Action Buttons */}
        <div className="w-full max-w-sm space-y-3">
          {/* Primary Quick Start CTA with data-start="true" */}
          <button
            data-start="true"
            onClick={() => {
              sound.playTileClack(true);
              onQuickMatch();
            }}
            aria-label={t.quickMatch}
            className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 transition transform hover:-translate-y-0.5 shadow-[0_10px_25px_rgba(234,179,8,0.4)] active:translate-y-0"
          >
            <Play className="w-4 h-4 fill-stone-950" />
            <span>{t.quickMatch}</span>
          </button>

          {/* Secondary Action Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => {
                sound.playTileClack();
                onOpenPrivateRoom();
              }}
              className="py-2.5 px-3 rounded-xl bg-stone-900/90 border border-stone-700/80 hover:border-amber-400 text-white text-xs font-bold flex items-center justify-center gap-2 transition hover:bg-stone-800"
            >
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.privateRoom}</span>
            </button>

            <button
              onClick={() => {
                sound.playTileClack();
                onOpenCampaign();
              }}
              className="py-2.5 px-3 rounded-xl bg-stone-900/90 border border-stone-700/80 hover:border-amber-400 text-white text-xs font-bold flex items-center justify-center gap-2 transition hover:bg-stone-800"
            >
              <Swords className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.soloCampaign}</span>
            </button>
          </div>

          {/* Tertiary Action Strip */}
          <div className="flex items-center justify-center gap-4 pt-1">
            <button
              onClick={onOpenTutorial}
              className="text-xs text-stone-300 hover:text-amber-300 font-semibold flex items-center gap-1.5 transition"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.tutorialRules}</span>
            </button>
            <span className="text-stone-600">•</span>
            <button
              onClick={onOpenLeaderboard}
              className="text-xs text-stone-300 hover:text-amber-300 font-semibold flex items-center gap-1.5 transition"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.leaderboard}</span>
            </button>
            <span className="text-stone-600">•</span>
            <button
              onClick={onOpenAvatarStudio}
              className="text-xs text-stone-300 hover:text-amber-300 font-semibold flex items-center gap-1.5 transition"
            >
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.avatarProfile}</span>
            </button>
          </div>
        </div>
      </main>

      {/* Bottom Safe Margin: Flat Single Control Hint Line */}
      <footer className="relative z-10 w-full py-4 text-center text-[11px] text-stone-400 tracking-wider">
        <span>{t.shortcutHint}</span>
      </footer>
    </div>
  );
};
