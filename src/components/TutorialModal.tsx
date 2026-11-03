import React, { useState } from 'react';
import { DominoPiece } from './DominoPiece';
import { useI18n } from '../utils/i18n';
import { X, ChevronRight, ChevronLeft, Award, Sparkles, BookOpen } from 'lucide-react';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState(0);
  const { t, language } = useI18n();

  if (!isOpen) return null;

  const steps = language === 'es' ? [
    {
      title: '1. Anatomía de una Ficha',
      subtitle: 'Las 28 Fichas del Doble Seis',
      content: (
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-stone-300 text-sm leading-relaxed max-w-md">
            Un juego tradicional de dominó consta de <strong>28 fichas únicas</strong> (llamadas huesos o fichas), desde la blanca doble [0|0] hasta el doble seis [6|6].
          </p>
          <div className="flex items-center gap-4 justify-center py-2">
            <div className="flex flex-col items-center gap-1">
              <DominoPiece tile={{ id: '3-5', left: 3, right: 5 }} size="md" />
              <span className="text-xs text-amber-300 font-medium">[3 | 5] Ficha Mixta</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <DominoPiece tile={{ id: '6-6', left: 6, right: 6 }} size="md" />
              <span className="text-xs text-amber-300 font-medium">[6 | 6] Doble / Mula</span>
            </div>
          </div>
          <p className="text-stone-400 text-xs">
            Las fichas con el mismo número en ambos lados se llaman <strong>Dobles o Mulas</strong>. ¡Actúan como pivotes estratégicos y se colocan cruzadas en la mesa!
          </p>
        </div>
      ),
    },
    {
      title: '2. Unir Extremos Abiertos',
      subtitle: 'Conectar la Cadena de Dominó',
      content: (
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-stone-300 text-sm leading-relaxed max-w-md">
            El dominó se juega en una hilera continua. Solo puedes colocar una ficha si uno de sus números coincide con uno de los dos <strong>extremos abiertos</strong> de la mesa.
          </p>
          <div className="flex items-center gap-2 justify-center py-3 bg-emerald-950/40 px-4 rounded-xl border border-emerald-900/40">
            <span className="text-xs font-bold text-amber-400 px-2 py-1 rounded bg-amber-950/60 border border-amber-500/40">
              Abierto: 2
            </span>
            <DominoPiece tile={{ id: '2-4', left: 2, right: 4 }} orientation="horizontal" size="sm" />
            <DominoPiece tile={{ id: '4-5', left: 4, right: 5 }} orientation="horizontal" size="sm" />
            <span className="text-xs font-bold text-amber-400 px-2 py-1 rounded bg-amber-950/60 border border-amber-500/40">
              Abierto: 5
            </span>
          </div>
          <p className="text-emerald-300 text-xs font-medium">
            El siguiente turno puede jugar cualquier ficha con un <strong>2</strong> o un <strong>5</strong>. Las puntas idénticas se tocan entre sí.
          </p>
        </div>
      ),
    },
    {
      title: '3. Robar del Pozo o Dar Paso',
      subtitle: 'Reglas del Pozo y el Golpe',
      content: (
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-stone-300 text-sm leading-relaxed max-w-md">
            Si no tienes ninguna ficha jugable en tu mano durante tu turno:
          </p>
          <div className="grid grid-cols-2 gap-3 max-w-md text-left text-xs">
            <div className="p-3 rounded-lg bg-stone-900/80 border border-amber-500/30">
              <span className="font-bold text-amber-300 block mb-1">Modo Robo (Draw)</span>
              <p className="text-stone-400">
                Debes robar fichas una a una del <strong>Pozo</strong> hasta encontrar una ficha jugable o hasta que el pozo se agote.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-stone-900/80 border border-emerald-500/30">
              <span className="font-bold text-emerald-300 block mb-1">Modo Clásico / Tranca</span>
              <p className="text-stone-400">
                No hay pozo. Si no puedes jugar, debes <strong>Pasar (dar golpe)</strong> y ceder el turno al siguiente jugador.
              </p>
            </div>
          </div>
          <p className="text-stone-400 text-xs">
            Robar demasiadas fichas aumenta tu penalización si tu rival cierra o hace dominó.
          </p>
        </div>
      ),
    },
    {
      title: '4. Puntuación y Victoria',
      subtitle: '¡Dominó! vs Mesa Trancada',
      content: (
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-stone-300 text-sm leading-relaxed max-w-md">
            Una ronda concluye bajo dos circunstancias:
          </p>
          <div className="space-y-3 max-w-md text-left text-xs">
            <div className="p-3 rounded-lg bg-stone-900/80 border border-amber-400/40 flex items-start gap-3">
              <span className="text-2xl">🎉</span>
              <div>
                <strong className="text-amber-300 block text-sm">¡Dominó! (Mano Vacía)</strong>
                <span className="text-stone-300">
                  El primer jugador en colocar todas sus fichas gana la ronda y suma todos los puntos (pips) que queden en las manos de sus oponentes.
                </span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-stone-900/80 border border-rose-500/30 flex items-start gap-3">
              <span className="text-2xl">🔒</span>
              <div>
                <strong className="text-rose-300 block text-sm">Mesa Trancada (Cierre)</strong>
                <span className="text-stone-300">
                  Cuando nadie puede jugar y el pozo está vacío, se cuentan los puntos en mano. ¡El jugador con <em>menor</em> puntuación se lleva la diferencia!
                </span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '5. Estrategia Pro y Todos los Cincos',
      subtitle: 'Mentalidad de Maestro',
      content: (
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-500/40 max-w-md text-left">
            <span className="flex items-center gap-2 font-bold text-amber-300 mb-1 text-xs">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Regla de Todos los Cincos (Muggins)
            </span>
            <p className="text-stone-300 text-xs leading-relaxed">
              En esta modalidad, cada vez que juegas una ficha y los extremos abiertos suman un múltiplo de 5 (ej: 2 + 3 = 5, o 6 + 4 = 10), ¡sumas esos puntos en tiempo real!
            </p>
          </div>
          <ul className="text-left text-stone-300 text-xs space-y-2 max-w-md list-disc list-inside">
            <li><strong>Deshazte de las mulas pesadas pronto:</strong> El [6|6] y [5|5] son 12 y 10 puntos en contra si te trancan.</li>
            <li><strong>Mantén variedad de puntas:</strong> Guarda números variados en tu mano para no quedar bloqueado.</li>
            <li><strong>Observa cuando el rival pasa:</strong> Si pasa con un 4, ¡intenta mantener la mesa abierta en 4!</li>
          </ul>
        </div>
      ),
    },
  ] : [
    {
      title: '1. Anatomy of a Domino',
      subtitle: 'The 28 Bones of Double-Six',
      content: (
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-stone-300 text-sm leading-relaxed max-w-md">
            A traditional domino set consists of <strong>28 unique tiles</strong> (called bones), ranging from blank [0|0] up to double-six [6|6].
          </p>
          <div className="flex items-center gap-4 justify-center py-2">
            <div className="flex flex-col items-center gap-1">
              <DominoPiece tile={{ id: '3-5', left: 3, right: 5 }} size="md" />
              <span className="text-xs text-amber-300 font-medium">[3 | 5] Regular</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <DominoPiece tile={{ id: '6-6', left: 6, right: 6 }} size="md" />
              <span className="text-xs text-amber-300 font-medium">[6 | 6] Double / Spinner</span>
            </div>
          </div>
          <p className="text-stone-400 text-xs">
            Tiles with identical numbers on both ends are called <strong>Doubles</strong>. They act as pivots and are placed crossways on the table!
          </p>
        </div>
      ),
    },
    {
      title: '2. Matching Open Ends',
      subtitle: 'Connecting the Domino Chain',
      content: (
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-stone-300 text-sm leading-relaxed max-w-md">
            Dominoes are played in a continuous line. You can only play a tile if one of its numbers matches one of the two <strong>open ends</strong> of the chain!
          </p>
          <div className="flex items-center gap-2 justify-center py-3 bg-emerald-950/40 px-4 rounded-xl border border-emerald-900/40">
            <span className="text-xs font-bold text-amber-400 px-2 py-1 rounded bg-amber-950/60 border border-amber-500/40">
              Open: 2
            </span>
            <DominoPiece tile={{ id: '2-4', left: 2, right: 4 }} orientation="horizontal" size="sm" />
            <DominoPiece tile={{ id: '4-5', left: 4, right: 5 }} orientation="horizontal" size="sm" />
            <span className="text-xs font-bold text-amber-400 px-2 py-1 rounded bg-amber-950/60 border border-amber-500/40">
              Open: 5
            </span>
          </div>
          <p className="text-emerald-300 text-xs font-medium">
            Next player can play any tile containing a <strong>2</strong> or a <strong>5</strong>. The matching ends touch each other.
          </p>
        </div>
      ),
    },
    {
      title: '3. Drawing & Passing',
      subtitle: 'Boneyard Rules',
      content: (
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-stone-300 text-sm leading-relaxed max-w-md">
            If you have no playable tiles in your hand:
          </p>
          <div className="grid grid-cols-2 gap-3 max-w-md text-left text-xs">
            <div className="p-3 rounded-lg bg-stone-900/80 border border-amber-500/30">
              <span className="font-bold text-amber-300 block mb-1">Draw Dominoes</span>
              <p className="text-stone-400">
                You must draw tiles one by one from the <strong>Boneyard</strong> until you find a playable tile or the boneyard is empty.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-stone-900/80 border border-emerald-500/30">
              <span className="font-bold text-emerald-300 block mb-1">Block Dominoes</span>
              <p className="text-stone-400">
                There is no boneyard. If you cannot play, you must <strong>Knock (Pass)</strong> and yield your turn to the next player!
              </p>
            </div>
          </div>
          <p className="text-stone-400 text-xs">
            Drawing too many tiles increases your pip liability if another player dominoes!
          </p>
        </div>
      ),
    },
    {
      title: '4. Scoring & Victory',
      subtitle: 'Domino! vs Blocked Game',
      content: (
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-stone-300 text-sm leading-relaxed max-w-md">
            A round ends under two conditions:
          </p>
          <div className="space-y-3 max-w-md text-left text-xs">
            <div className="p-3 rounded-lg bg-stone-900/80 border border-amber-400/40 flex items-start gap-3">
              <span className="text-2xl">🎉</span>
              <div>
                <strong className="text-amber-300 block text-sm">"Domino!" (Hand Emptied)</strong>
                <span className="text-stone-300">
                  The first player to play their last tile wins the round and earns points equal to the total sum of all pips left in opponents' hands.
                </span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-stone-900/80 border border-rose-500/30 flex items-start gap-3">
              <span className="text-2xl">🔒</span>
              <div>
                <strong className="text-rose-300 block text-sm">"Blocked Game"</strong>
                <span className="text-stone-300">
                  When neither player can move and the boneyard is empty, each player counts their pips. The player with the <em>lowest</em> pip sum wins the difference!
                </span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: '5. Pro Strategy & All-Fives',
      subtitle: 'The Champions Mindset',
      content: (
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-500/40 max-w-md text-left">
            <span className="flex items-center gap-2 font-bold text-amber-300 mb-1 text-xs">
              <Sparkles className="w-4 h-4 text-amber-400" />
              All-Fives (Muggins) Rule
            </span>
            <p className="text-stone-300 text-xs leading-relaxed">
              In All-Fives mode, whenever your move leaves the open ends adding up to a multiple of 5 (e.g., 2 + 3 = 5, or 6 + 4 = 10), you immediately score those points in real-time!
            </p>
          </div>
          <ul className="text-left text-stone-300 text-xs space-y-2 max-w-md list-disc list-inside">
            <li><strong>Shed heavy doubles early:</strong> [6|6] and [5|5] are 12 and 10 points liability.</li>
            <li><strong>Keep end variety:</strong> Try to keep tiles with diverse numbers in your hand.</li>
            <li><strong>Notice opponent passes:</strong> If an opponent knocks on a 4, try to keep 4 open!</li>
          </ul>
        </div>
      ),
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label={language === 'es' ? 'Tutorial de Dominó' : 'Domino Tutorial'}
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-gradient-to-b from-stone-900 to-stone-950 border border-amber-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-800 flex items-center justify-between bg-stone-900/60">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-amber-100 tracking-wide">
              {language === 'es' ? 'Clase Magistral de Dominó' : 'Domino Masterclass'}
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

        {/* Body */}
        <div className="p-6">
          <div className="mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400/90">
              {steps[step].subtitle}
            </span>
            <h3 className="text-xl font-black text-white mt-0.5">{steps[step].title}</h3>
          </div>

          <div className="min-h-[220px] flex items-center justify-center py-3">
            {steps[step].content}
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-1.5 my-4">
            {steps.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setStep(idx)}
                aria-label={`Step ${idx + 1}`}
                className={`h-2 rounded-full transition-all ${
                  idx === step ? 'w-6 bg-amber-400' : 'w-2 bg-stone-700'
                }`}
              />
            ))}
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-stone-800">
            <button
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-stone-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> {t.previous}
            </button>

            {step < steps.length - 1 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="px-5 py-2.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 flex items-center gap-1 transition shadow"
              >
                {t.next} <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-stone-950 flex items-center gap-1 transition shadow"
              >
                <Award className="w-4 h-4" /> {language === 'es' ? '¡Listo para Jugar!' : 'Ready to Play!'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

