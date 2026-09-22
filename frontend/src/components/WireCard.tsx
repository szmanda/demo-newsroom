import React from 'react';
import { Flame, AlertCircle, Clock, ShieldCheck, Loader2 } from 'lucide-react';
import type { WireDispatch } from '../types/wire';

interface WireCardProps {
  dispatch: WireDispatch;
  isSelected: boolean;
  onSelect: (dispatch: WireDispatch) => void;
}

export const WireCard: React.FC<WireCardProps> = ({
  dispatch,
  isSelected,
  onSelect,
}) => {
  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString('pl-PL', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const getUrgencyBadge = () => {
    switch (dispatch.urgency_level) {
      case 'FLASH':
        return (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-600/90 text-white font-mono text-[10px] font-black tracking-wider uppercase">
            <Flame className="w-2.5 h-2.5 fill-current" />
            FLASH
          </span>
        );
      case 'URGENT':
        return (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono text-[10px] font-bold tracking-wider uppercase">
            <AlertCircle className="w-2.5 h-2.5" />
            PILNE
          </span>
        );
      case 'ROUTINE':
      default:
        return (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[10px] font-medium tracking-wider uppercase">
            <Clock className="w-2.5 h-2.5" />
            ROUTYNA
          </span>
        );
    }
  };

  return (
    <article
      onClick={() => onSelect(dispatch)}
      className={`p-3.5 border-b cursor-pointer transition-all relative ${
        dispatch.is_flash ? 'bg-red-950/20 hover:bg-red-950/30' : 'bg-slate-900/40 hover:bg-slate-850'
      } ${
        isSelected
          ? 'border-l-4 border-l-red-500 bg-slate-800/80 border-b-slate-700'
          : 'border-l-4 border-l-transparent border-b-slate-800/80 hover:border-l-slate-600'
      }`}
    >
      {/* Top row: Urgency, Category, Timestamp */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          {getUrgencyBadge()}
          {dispatch.category && (
            <span className="text-[11px] font-mono text-slate-400 font-medium">
              #{dispatch.category.name}
            </span>
          )}
          {dispatch.isOptimistic && (
            <span className="flex items-center gap-1 text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800">
              <Loader2 className="w-2.5 h-2.5 animate-spin" />
              Wysyłanie...
            </span>
          )}
        </div>

        <time className="text-[11px] font-mono text-slate-500 whitespace-nowrap">
          {formatTime(dispatch.created)}
        </time>
      </div>

      {/* Title */}
      <h3
        className={`text-sm font-semibold leading-snug line-clamp-2 mb-1 ${
          dispatch.is_flash ? 'text-red-100 font-bold' : 'text-slate-200'
        }`}
      >
        {dispatch.title}
      </h3>

      {/* Lead snippet */}
      {dispatch.lead && (
        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-2 font-normal">
          {dispatch.lead}
        </p>
      )}

      {/* Footer info: Signature & Tamper-proof icon */}
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1">
        <span>{dispatch.author_signature || '(PAP)'}</span>
        <span className="flex items-center gap-1 text-emerald-500/80 text-[10px]">
          <ShieldCheck className="w-3 h-3" />
          <span>SHA-256</span>
        </span>
      </div>
    </article>
  );
};
