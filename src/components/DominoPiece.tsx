import React from 'react';
import { DominoTile } from '../types/domino';

interface DominoPieceProps {
  tile: DominoTile;
  displayLeft?: number;
  displayRight?: number;
  orientation?: 'vertical' | 'horizontal';
  isPlayable?: boolean;
  isSelected?: boolean;
  isFaceDown?: boolean;
  skin?: 'ivory' | 'obsidian' | 'marble' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
}

// 3x3 pip coordinates grid for numbers 0-6
const PIP_CONFIGS: Record<number, number[][]> = {
  0: [],
  1: [[1, 1]], // center
  2: [[0, 0], [2, 2]], // diagonal
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [2, 0], [0, 2], [2, 2]], // four corners
  5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]], // four corners + center
  6: [[0, 0], [2, 0], [0, 1], [2, 1], [0, 2], [2, 2]], // two columns of 3
};

export const DominoPiece: React.FC<DominoPieceProps> = ({
  tile,
  displayLeft,
  displayRight,
  orientation = 'vertical',
  isPlayable = false,
  isSelected = false,
  isFaceDown = false,
  skin = 'ivory',
  size = 'md',
  onClick,
  className = '',
}) => {
  const isDouble = tile.left === tile.right;
  const firstPip = displayLeft !== undefined ? displayLeft : tile.left;
  const secondPip = displayRight !== undefined ? displayRight : tile.right;

  // Scale dimensions
  const scale = size === 'sm' ? { w: 32, h: 64, pip: 4 } : size === 'lg' ? { w: 60, h: 120, pip: 8 } : { w: 46, h: 92, pip: 6 };
  const width = orientation === 'vertical' ? scale.w : scale.h;
  const height = orientation === 'vertical' ? scale.h : scale.w;

  // Visual themes
  const skinStyles = {
    ivory: {
      bg: 'bg-gradient-to-b from-[#fdfbf7] via-[#f7f2e7] to-[#ebe1cf]',
      border: 'border-[#cfc4b0]',
      shadow: 'shadow-[0_4px_12px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.9),inset_0_-2px_2px_rgba(0,0,0,0.15)]',
      pipColor: 'bg-[#1e1b18] shadow-[inset_0_1px_2px_rgba(0,0,0,0.8),0_1px_0_rgba(255,255,255,0.4)]',
      line: 'bg-[#c2b59f] shadow-[0_1px_1px_rgba(255,255,255,0.7)]',
      rivet: 'bg-amber-600 border-amber-400',
    },
    obsidian: {
      bg: 'bg-gradient-to-b from-[#2a2a2e] via-[#1b1b1e] to-[#0f0f12]',
      border: 'border-[#3d3d42]',
      shadow: 'shadow-[0_4px_12px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.2),inset_0_-2px_2px_rgba(0,0,0,0.5)]',
      pipColor: 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]',
      line: 'bg-[#3d3d42]',
      rivet: 'bg-amber-500 border-amber-300',
    },
    marble: {
      bg: 'bg-gradient-to-b from-[#e8eff5] via-[#d5e0ea] to-[#bcd0e0]',
      border: 'border-[#9ab4c9]',
      shadow: 'shadow-[0_4px_12px_rgba(0,0,0,0.3),inset_0_1px_1px_rgba(255,255,255,0.9)]',
      pipColor: 'bg-[#1e3a5f] shadow-[inset_0_1px_1px_rgba(0,0,0,0.5)]',
      line: 'bg-[#8faec7]',
      rivet: 'bg-blue-600 border-blue-400',
    },
    gold: {
      bg: 'bg-gradient-to-b from-[#fef08a] via-[#eab308] to-[#ca8a04]',
      border: 'border-[#a16207]',
      shadow: 'shadow-[0_4px_16px_rgba(202,138,4,0.5),inset_0_1px_2px_rgba(255,255,255,0.8)]',
      pipColor: 'bg-[#451a03] shadow-[inset_0_1px_2px_rgba(0,0,0,0.7)]',
      line: 'bg-[#854d0e]',
      rivet: 'bg-amber-800 border-amber-300',
    },
  }[skin];

  const renderPipGrid = (pipCount: number) => {
    const coords = PIP_CONFIGS[pipCount] || [];
    return (
      <div className="relative w-full h-full p-1 flex items-center justify-center">
        <div className="relative w-full h-full grid grid-cols-3 grid-rows-3">
          {[0, 1, 2].map(r =>
            [0, 1, 2].map(c => {
              const hasPip = coords.some(([pc, pr]) => pc === c && pr === r);
              return (
                <div key={`${r}-${c}`} className="flex items-center justify-center">
                  {hasPip && (
                    <div
                      className={`rounded-full ${skinStyles.pipColor}`}
                      style={{ width: `${scale.pip}px`, height: `${scale.pip}px` }}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  // Face down back design
  if (isFaceDown) {
    return (
      <div
        className={`relative rounded-md border ${skinStyles.border} ${skinStyles.bg} ${skinStyles.shadow} flex items-center justify-center select-none overflow-hidden ${className}`}
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <div className="w-[85%] h-[85%] rounded border border-amber-900/20 bg-amber-950/10 flex flex-col items-center justify-center p-1">
          <div className="w-4 h-4 rounded-full border border-amber-900/30 flex items-center justify-center text-[8px] font-black text-amber-900/60">
            🎲
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`Domino tile [${firstPip}|${secondPip}]${isPlayable ? ' Playable' : ''}`}
      className={`relative rounded-md border select-none transition-all duration-150 ${skinStyles.border} ${skinStyles.bg} ${skinStyles.shadow} ${
        isPlayable
          ? 'cursor-pointer hover:-translate-y-2 ring-2 ring-amber-400 ring-offset-2 ring-offset-emerald-950 hover:shadow-[0_8px_20px_rgba(251,191,36,0.6)]'
          : 'cursor-default'
      } ${isSelected ? '-translate-y-3 ring-4 ring-amber-300 ring-offset-2 ring-offset-emerald-950' : ''} ${className}`}
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      {orientation === 'vertical' ? (
        <div className="w-full h-full flex flex-col">
          {/* Top half */}
          <div className="flex-1 w-full flex items-center justify-center relative">
            {renderPipGrid(firstPip)}
          </div>

          {/* Divider line with center brass spinner pin */}
          <div className="relative w-full h-[2px] flex items-center justify-center">
            <div className={`w-[90%] h-[1.5px] ${skinStyles.line}`} />
            {isDouble && (
              <div
                className={`absolute w-2 h-2 rounded-full border ${skinStyles.rivet} shadow-sm z-10`}
                title="Spinner Pivot"
              />
            )}
          </div>

          {/* Bottom half */}
          <div className="flex-1 w-full flex items-center justify-center relative">
            {renderPipGrid(secondPip)}
          </div>
        </div>
      ) : (
        <div className="w-full h-full flex flex-row">
          {/* Left half */}
          <div className="flex-1 h-full flex items-center justify-center relative">
            {renderPipGrid(firstPip)}
          </div>

          {/* Divider line with center brass spinner pin */}
          <div className="relative h-full w-[2px] flex items-center justify-center">
            <div className={`h-[90%] w-[1.5px] ${skinStyles.line}`} />
            {isDouble && (
              <div
                className={`absolute w-2 h-2 rounded-full border ${skinStyles.rivet} shadow-sm z-10`}
                title="Spinner Pivot"
              />
            )}
          </div>

          {/* Right half */}
          <div className="flex-1 h-full flex items-center justify-center relative">
            {renderPipGrid(secondPip)}
          </div>
        </div>
      )}
    </div>
  );
};
