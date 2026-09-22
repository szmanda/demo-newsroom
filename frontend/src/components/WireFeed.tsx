import React from 'react';
import { Newspaper, Inbox } from 'lucide-react';
import { WireCard } from './WireCard';
import type { WireDispatch } from '../types/wire';

interface WireFeedProps {
  dispatches: WireDispatch[];
  selectedDispatch: WireDispatch | null;
  onSelectDispatch: (dispatch: WireDispatch) => void;
  isLoading: boolean;
}

export const WireFeed: React.FC<WireFeedProps> = ({
  dispatches,
  selectedDispatch,
  onSelectDispatch,
  isLoading,
}) => {
  if (isLoading && dispatches.length === 0) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="animate-pulse p-4 bg-slate-900/50 rounded border border-slate-800 space-y-2"
          >
            <div className="flex justify-between">
              <div className="h-4 bg-slate-800 rounded w-20"></div>
              <div className="h-4 bg-slate-800 rounded w-14"></div>
            </div>
            <div className="h-5 bg-slate-800 rounded w-5/6"></div>
            <div className="h-4 bg-slate-800/60 rounded w-full"></div>
            <div className="h-3 bg-slate-800/40 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (dispatches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-80 text-center p-6">
        <Inbox className="w-10 h-10 text-slate-600 mb-3" />
        <h4 className="text-sm font-semibold text-slate-300">Brak depesz</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">
          Nie znaleziono depesz spełniających wybrane filtry lub zapytanie wyszukiwania.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-800/60 overflow-y-auto h-full">
      {dispatches.map((dispatch) => (
        <WireCard
          key={dispatch.id}
          dispatch={dispatch}
          isSelected={selectedDispatch?.id === dispatch.id}
          onSelect={onSelectDispatch}
        />
      ))}
    </div>
  );
};
