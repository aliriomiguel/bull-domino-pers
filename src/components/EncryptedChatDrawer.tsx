import React, { useState, useEffect, useRef } from 'react';
import { EncryptedChatMessage } from '../types/domino';
import { useI18n } from '../utils/i18n';
import { encryptE2EEMessage, decryptE2EEMessage, generateRoomFingerprint } from '../utils/e2ee';
import { Shield, ShieldCheck, Send, Smile, X, Lock } from 'lucide-react';

interface EncryptedChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  roomKey: CryptoKey | null;
  currentUserId: string;
  currentUserName: string;
  currentUserColor: string;
  messages: EncryptedChatMessage[];
  onSendMessage: (payload: { encryptedData: string; iv: string; isQuickReaction?: boolean; quickReactionEmoji?: string }) => void;
}

interface DecryptedMessage {
  id: string;
  senderId: string;
  senderName: string;
  avatarColor: string;
  timestamp: number;
  text: string;
  isQuickReaction?: boolean;
  quickReactionEmoji?: string;
}

const QUICK_EMOJIS = ['👏', '🔥', '🤔', '🎲', '👑', '😂', '🎯', '⚡'];

const QUICK_PHRASES_EN = [
  'Good move!',
  'Domino coming!',
  'You blocked me!',
  'Double trouble!',
  'Gg partner!',
];

const QUICK_PHRASES_ES = [
  '¡Buena jugada!',
  '¡Se viene el dominó!',
  '¡Me trancaste!',
  '¡Cuidado con la mula!',
  '¡Buena partida!',
];

export const EncryptedChatDrawer: React.FC<EncryptedChatDrawerProps> = ({
  isOpen,
  onClose,
  roomCode,
  roomKey,
  currentUserId,
  currentUserName,
  currentUserColor,
  messages,
  onSendMessage,
}) => {
  const { t, language } = useI18n();
  const quickPhrases = language === 'es' ? QUICK_PHRASES_ES : QUICK_PHRASES_EN;

  const [inputText, setInputText] = useState('');
  const [decryptedMessages, setDecryptedMessages] = useState<DecryptedMessage[]>([]);
  const [fingerprint, setFingerprint] = useState<string[]>(['🛡️', '🎲', '⚡', '👑']);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Generate cryptographic room fingerprint
  useEffect(() => {
    if (roomCode) {
      generateRoomFingerprint(roomCode).then(setFingerprint).catch(console.error);
    }
  }, [roomCode]);

  // Decrypt incoming messages when new ones arrive or key changes
  useEffect(() => {
    let isCancelled = false;

    async function decryptAll() {
      if (!roomKey) return;
      const results: DecryptedMessage[] = [];

      for (const msg of messages) {
        try {
          let plain = '';
          if (msg.encryptedData && msg.iv) {
            plain = await decryptE2EEMessage(msg.encryptedData, msg.iv, roomKey);
          }
          results.push({
            id: msg.id,
            senderId: msg.senderId,
            senderName: msg.senderName,
            avatarColor: msg.avatarColor,
            timestamp: msg.timestamp,
            text: plain,
            isQuickReaction: msg.isQuickReaction,
            quickReactionEmoji: msg.quickReactionEmoji,
          });
        } catch (err) {
          results.push({
            id: msg.id,
            senderId: msg.senderId,
            senderName: msg.senderName,
            avatarColor: msg.avatarColor,
            timestamp: msg.timestamp,
            text: language === 'es' ? '[Mensaje cifrado - fallo de descifrado]' : '[Encrypted payload - decryption failed]',
          });
        }
      }

      if (!isCancelled) {
        setDecryptedMessages(results);
      }
    }

    decryptAll();

    return () => {
      isCancelled = true;
    };
  }, [messages, roomKey, language]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [decryptedMessages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const raw = (textToSend || inputText).trim();
    if (!raw || !roomKey) return;

    try {
      const { encryptedData, iv } = await encryptE2EEMessage(raw, roomKey);
      onSendMessage({ encryptedData, iv });
      if (!textToSend) setInputText('');
    } catch (err) {
      console.error('Failed to encrypt chat message:', err);
    }
  };

  const handleSendQuickReaction = async (emoji: string) => {
    if (!roomKey) return;
    try {
      const { encryptedData, iv } = await encryptE2EEMessage(`[Reaction ${emoji}]`, roomKey);
      onSendMessage({
        encryptedData,
        iv,
        isQuickReaction: true,
        quickReactionEmoji: emoji,
      });
    } catch (err) {
      console.error('Failed to send reaction:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-gradient-to-b from-stone-900 via-stone-950 to-black border-l border-amber-500/30 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
      role="region"
      aria-label={t.chatTitle}
    >
      {/* Header with E2EE Status Badge */}
      <div className="p-4 border-b border-stone-800 bg-stone-900/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-sm">{language === 'es' ? 'Chat de Partida' : 'Match Chat'}</h3>
          </div>
          <button
            onClick={onClose}
            aria-label={t.close}
            className="w-7 h-7 rounded-full bg-stone-800 text-stone-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* E2EE Crypto Verification Badge */}
        <div className="mt-2.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-[11px]">
          <span className="flex items-center gap-1.5 text-emerald-300 font-medium">
            <Lock className="w-3 h-3 text-emerald-400" />
            {language === 'es' ? 'E2EE Activo (AES-GCM 256)' : 'E2EE Active (AES-GCM 256)'}
          </span>
          <div className="flex items-center gap-1" title={language === 'es' ? 'Huella de Seguridad de Clave' : 'Room Key Safety Fingerprint'}>
            <span className="text-[10px] text-emerald-500 font-bold mr-1">{language === 'es' ? 'CLAVE:' : 'KEY:'}</span>
            {fingerprint.map((em, i) => (
              <span key={i} className="text-xs">{em}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {decryptedMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-500">
            <Shield className="w-10 h-10 text-emerald-500/40 mb-2" />
            <p className="text-xs">{language === 'es' ? 'Sala con Cifrado Extremo a Extremo' : 'End-to-End Encrypted Room'}</p>
            <p className="text-[11px] text-stone-600 mt-1">
              {language === 'es'
                ? `Los mensajes se cifran en tu dispositivo. Solo los jugadores en la sala ${roomCode} pueden leerlos.`
                : `Messages are encrypted on your device. Only players in room ${roomCode} can read them.`}
            </p>
          </div>
        ) : (
          decryptedMessages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-0.5 text-[10px] text-stone-400">
                  <span className="font-bold" style={{ color: msg.avatarColor || '#e0ac69' }}>
                    {isMe ? (language === 'es' ? 'Tú' : 'You') : msg.senderName}
                  </span>
                  <span>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {msg.isQuickReaction ? (
                  <div className="text-2xl px-3 py-1 rounded-2xl bg-stone-800/80 border border-stone-700/60 shadow">
                    {msg.quickReactionEmoji}
                  </div>
                ) : (
                  <div
                    className={`px-3 py-2 rounded-2xl text-xs max-w-[85%] break-words shadow ${
                      isMe
                        ? 'bg-amber-500 text-stone-950 font-medium rounded-tr-none'
                        : 'bg-stone-800 text-stone-200 border border-stone-700 rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Reactions Bar */}
      <div className="px-4 py-2 border-t border-stone-800/80 bg-stone-950/60 flex items-center justify-between gap-1 overflow-x-auto">
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleSendQuickReaction(emoji)}
            aria-label={`Reaction ${emoji}`}
            className="w-8 h-8 rounded-full hover:bg-stone-800 flex items-center justify-center text-base transition hover:scale-125"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Quick Phrases */}
      <div className="px-4 pb-2 bg-stone-950/60 flex items-center gap-1.5 overflow-x-auto text-[11px]">
        {quickPhrases.map((phrase) => (
          <button
            key={phrase}
            onClick={() => handleSend(phrase)}
            className="px-2 py-0.5 rounded-full bg-stone-900 border border-stone-700/60 text-stone-300 hover:text-amber-300 hover:border-amber-400/50 whitespace-nowrap transition"
          >
            {phrase}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-3 border-t border-stone-800 bg-stone-900 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          maxLength={140}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={language === 'es' ? 'Mensaje seguro...' : 'Encrypted message...'}
          className="flex-1 px-3 py-2 rounded-xl bg-stone-950 border border-stone-700 text-white text-xs focus:outline-none focus:border-amber-400"
        />
        <button
          onClick={() => handleSend()}
          disabled={!inputText.trim()}
          aria-label={t.sendBtn}
          className="w-9 h-9 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:pointer-events-none text-stone-950 flex items-center justify-center transition shadow"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

