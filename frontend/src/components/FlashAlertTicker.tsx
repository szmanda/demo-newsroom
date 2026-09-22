import React from 'react';
import { Flame, ChevronRight } from 'lucide-react';
import type { WireDispatch } from '../types/wire';

interface FlashAlertTickerProps {
  flashDispatch: WireDispatch | null;
  onSelect: (dispatch: WireDispatch) => void;
}

export const FlashAlertTicker: React.FC<FlashAlertTickerProps> = ({
  flashDispatch,
  onSelect,
}) => {
  if (!flashDispatch) return null;

  return (
    <div
      onClick={() => onSelect(flashDispatch)}
      className="bg-red-950/70 border-b border-red-800/80 px-4 py-2 cursor-pointer hover:bg-red-900/60 transition group flex items-center justify-between gap-3"
    >
      <div className="flex items-center gap-2.5 overflow-hidden">
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
        </span>

        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-600 text-white font-mono text-[11px] font-black tracking-wider uppercase shadow-sm">
          <Flame className="w-3.5 h-3.5 fill-current" />
          FLASH PAP
        </span>

        <span className="text-xs font-semibold text-slate-100 truncate group-hover:text-red-300 transition">
          {flashDispatch.title}
        </span>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-red-300/80 shrink-0 font-mono group-hover:text-red-200">
        <span className="hidden md:inline">Otwórz depeszę</span>
        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
      </div>
    </div>
  );
};
