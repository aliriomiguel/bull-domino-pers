import React, { useState } from 'react';
import { PlayerProfile } from '../types/domino';
import { useI18n } from '../utils/i18n';
import { X, Share2, Copy, Check, Twitter, MessageCircle, Send, Award, Flame } from 'lucide-react';

interface SocialShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  achievementText: string;
  statsHighlight: string;
  userProfile: PlayerProfile;
}

export const SocialShareModal: React.FC<SocialShareModalProps> = ({
  isOpen,
  onClose,
  title,
  achievementText,
  statsHighlight,
  userProfile,
}) => {
  const { t, language } = useI18n();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareMessage = language === 'es'
    ? `🀄 ¡Victoria en Bull Domino!\n🏆 ${title}\n✨ "${achievementText}"\n🔥 División: ${userProfile.seasonTier} (${userProfile.rankPoints} RP) • ${statsHighlight}\n¡Juega y réfame en dominó en tiempo real!: ${window.location.origin}`
    : `🀄 Bull Domino Victory!\n🏆 ${title}\n✨ "${achievementText}"\n🔥 Rank: ${userProfile.seasonTier} (${userProfile.rankPoints} RP) • ${statsHighlight}\nPlay & challenge me in real-time dominoes: ${window.location.origin}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: language === 'es' ? 'Victoria en Bull Domino' : 'Bull Domino Victory',
          text: shareMessage,
          url: window.location.origin,
        });
      } catch (err) {
        // User cancelled or unsupported
      }
    } else {
      handleCopy();
    }
  };

  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`;
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(window.location.origin)}&text=${encodeURIComponent(shareMessage)}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={t.shareTitle}
    >
      <div className="relative w-full max-w-md rounded-2xl bg-gradient-to-b from-stone-900 to-stone-950 border border-amber-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.85)] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between bg-stone-900/60">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-amber-100">{t.shareTitle}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label={t.close}
            className="w-8 h-8 rounded-full bg-stone-800 text-stone-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Card Body */}
        <div className="p-6 space-y-4">
          {/* Visual Showcase Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-950/40 via-stone-900 to-emerald-950/40 border border-amber-500/30 shadow-lg text-center relative overflow-hidden">
            <div className="absolute top-2 right-2 text-2xl opacity-20">🎲</div>
            <img
              src="/bull-domino-logo.png"
              alt="Bull Domino"
              className="w-12 h-12 mx-auto object-contain drop-shadow-md mb-2"
            />
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold mb-2">
              <Award className="w-3.5 h-3.5" /> BULL DOMINO
            </div>
            <h3 className="text-xl font-black text-white">{title}</h3>
            <p className="text-xs text-amber-200/90 mt-1">{achievementText}</p>

            <div className="mt-3 pt-3 border-t border-amber-500/20 flex items-center justify-around text-xs">
              <div>
                <span className="text-[10px] text-stone-400 block">
                  {language === 'es' ? 'JUGADOR' : 'TACTICIAN'}
                </span>
                <strong className="text-white font-bold">{userProfile.name}</strong>
              </div>
              <div className="w-[1px] h-6 bg-stone-700" />
              <div>
                <span className="text-[10px] text-stone-400 block">
                  {language === 'es' ? 'DIVISIÓN' : 'DIVISION'}
                </span>
                <strong className="text-amber-400 font-bold">{userProfile.seasonTier}</strong>
              </div>
              <div className="w-[1px] h-6 bg-stone-700" />
              <div>
                <span className="text-[10px] text-stone-400 block">
                  {language === 'es' ? 'RACHA' : 'WIN STREAK'}
                </span>
                <strong className="text-rose-400 font-bold flex items-center justify-center gap-0.5">
                  <Flame className="w-3 h-3 text-rose-500" /> {userProfile.stats.winStreak}
                </strong>
              </div>
            </div>
          </div>

          {/* Social Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <a
              href={tweetUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t.shareViaTwitter}
              className="py-2.5 px-3 rounded-xl bg-stone-900 border border-stone-800 hover:border-sky-500 text-stone-300 hover:text-sky-400 flex flex-col items-center gap-1 text-xs font-medium transition"
            >
              <Twitter className="w-5 h-5 text-sky-400" />
              <span>X / Twitter</span>
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t.shareViaWhatsapp}
              className="py-2.5 px-3 rounded-xl bg-stone-900 border border-stone-800 hover:border-emerald-500 text-stone-300 hover:text-emerald-400 flex flex-col items-center gap-1 text-xs font-medium transition"
            >
              <MessageCircle className="w-5 h-5 text-emerald-400" />
              <span>WhatsApp</span>
            </a>
            <a
              href={telegramUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t.shareViaTelegram}
              className="py-2.5 px-3 rounded-xl bg-stone-900 border border-stone-800 hover:border-blue-500 text-stone-300 hover:text-blue-400 flex flex-col items-center gap-1 text-xs font-medium transition"
            >
              <Send className="w-5 h-5 text-blue-400" />
              <span>Telegram</span>
            </a>
          </div>

          {/* Direct Copy & Native Share */}
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex-1 py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? (language === 'es' ? '¡Copiado al Portapapeles!' : 'Copied to Clipboard!') : (language === 'es' ? 'Copiar Resumen' : 'Copy Summary')}
            </button>
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                onClick={handleNativeShare}
                className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold flex items-center justify-center gap-1.5 transition shadow"
              >
                <Share2 className="w-4 h-4" /> {t.share}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

