import React from 'react';
import { PlayerColor } from '../types';

interface DiceProps {
  value: number;
  isRolling: boolean;
  onRoll: () => void;
  disabled: boolean;
  activeColor: PlayerColor;
  playerName: string;
}

export default function Dice({ value, isRolling, onRoll, disabled, activeColor, playerName }: DiceProps) {
  // Helper to render dice dots based on face value
  const renderDots = () => {
    const dots: Record<number, number[]> = {
      1: [4],
      2: [0, 8],
      3: [0, 4, 8],
      4: [0, 2, 6, 8],
      5: [0, 2, 4, 6, 8],
      6: [0, 2, 3, 5, 6, 8],
    };

    const activeDots = dots[value] || [4];

    return (
      <div className="grid grid-cols-3 grid-rows-3 gap-1.5 p-2.5 w-full h-full bg-white rounded-xl shadow-inner border border-gray-100">
        {Array.from({ length: 9 }).map((_, index) => {
          const hasDot = activeDots.includes(index);
          return (
            <div key={index} className="flex justify-center items-center w-full h-full">
              {hasDot && (
                <div
                  className={`w-3 h-3 rounded-full shadow-sm transition-all duration-300 ${
                    activeColor === 'RED' ? 'bg-red-600' :
                    activeColor === 'GREEN' ? 'bg-emerald-600' :
                    activeColor === 'YELLOW' ? 'bg-amber-500' : 'bg-blue-600'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const colorStyles: Record<PlayerColor, { bg: string; border: string; text: string; shadow: string; pulse: string }> = {
    GREEN: {
      bg: 'bg-emerald-500',
      border: 'border-emerald-600',
      text: 'text-emerald-700',
      shadow: 'shadow-emerald-200',
      pulse: 'animate-ping bg-emerald-400',
    },
    YELLOW: {
      bg: 'bg-amber-400',
      border: 'border-amber-500',
      text: 'text-amber-700',
      shadow: 'shadow-amber-100',
      pulse: 'animate-ping bg-amber-300',
    },
    BLUE: {
      bg: 'bg-blue-500',
      border: 'border-blue-600',
      text: 'text-blue-700',
      shadow: 'shadow-blue-200',
      pulse: 'animate-ping bg-blue-400',
    },
    RED: {
      bg: 'bg-red-500',
      border: 'border-red-600',
      text: 'text-red-700',
      shadow: 'shadow-red-200',
      pulse: 'animate-ping bg-red-400',
    },
  };

  const style = colorStyles[activeColor];

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm max-w-[200px] w-full">
      <span className={`text-xs font-semibold mb-2 uppercase tracking-wider ${style.text}`}>
        {playerName}'s Turn
      </span>

      <div className="relative">
        {/* Dynamic active glow pulse */}
        {!disabled && !isRolling && (
          <span className={`absolute -inset-1.5 rounded-2xl opacity-50 blur-sm ${style.bg} animate-pulse`} />
        )}

        <button
          id={`dice_roll_btn_${activeColor.toLowerCase()}`}
          disabled={disabled || isRolling}
          onClick={onRoll}
          className={`relative flex items-center justify-center w-20 h-20 rounded-2xl cursor-pointer border-b-4 active:border-b-0 active:translate-y-1 transition-all shadow-md ${
            style.bg
          } ${style.border} ${disabled ? 'opacity-60 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
        >
          {/* Inner 3D roll animation */}
          <div
            className={`w-16 h-16 transition-all duration-150 ${
              isRolling ? 'animate-spin scale-110 rotate-45' : 'rotate-0'
            }`}
          >
            {renderDots()}
          </div>
        </button>
      </div>

      <div className="mt-3 text-center">
        {isRolling ? (
          <p className="text-xs font-medium text-slate-500 animate-pulse">Rolling dice...</p>
        ) : (
          <p className="text-xs font-semibold text-slate-700">
            Rolled: <span className="text-sm font-bold text-slate-900">{value}</span>
          </p>
        )}
      </div>
    </div>
  );
}
