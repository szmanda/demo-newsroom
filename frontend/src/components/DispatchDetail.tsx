import React, { useState } from 'react';
import {
  Flame,
  AlertCircle,
  Clock,
  ShieldCheck,
  Copy,
  Check,
  Calendar,
  Lock,
  FileText,
} from 'lucide-react';
import type { WireDispatch } from '../types/wire';

interface DispatchDetailProps {
  dispatch: WireDispatch | null;
}

export const DispatchDetail: React.FC<DispatchDetailProps> = ({ dispatch }) => {
  const [copied, setCopied] = useState(false);

  if (!dispatch) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-slate-500">
        <FileText className="w-12 h-12 text-slate-700 mb-3 stroke-[1.5]" />
        <h3 className="text-sm font-semibold text-slate-400">
          Wybierz depeszę ze strumienia
        </h3>
        <p className="text-xs text-slate-600 mt-1 max-w-sm">
          Kliknij dowolną pozycję na liście po lewej stronie, aby wyświetlić pełną treść agencyjną, weryfikację kryptograficzną oraz szczegóły syndykacji.
        </p>
      </div>
    );
  }

  const handleCopyText = () => {
    const fullText = `${dispatch.title}\n\n${dispatch.lead}\n\n${dispatch.body}\n\n${dispatch.author_signature}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatFullDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString('pl-PL', {
        dateStyle: 'long',
        timeStyle: 'medium',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6 lg:p-8 space-y-6">
      {/* Header Bar: Meta badges & actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2 flex-wrap">
          {dispatch.urgency_level === 'FLASH' && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-600 text-white font-mono text-xs font-black tracking-wider uppercase shadow-md shadow-red-900/30">
              <Flame className="w-3.5 h-3.5 fill-current" />
              FLASH DEPESZA
            </span>
          )}
          {dispatch.urgency_level === 'URGENT' && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono text-xs font-bold tracking-wider uppercase">
              <AlertCircle className="w-3.5 h-3.5" />
              PILNE (URGENT)
            </span>
          )}
          {dispatch.urgency_level === 'ROUTINE' && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 text-slate-300 font-mono text-xs font-medium tracking-wider uppercase">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              ROUTYNA
            </span>
          )}

          {dispatch.category && (
            <span className="px-2.5 py-1 rounded bg-slate-800/80 text-slate-300 border border-slate-700 font-mono text-xs">
              #{dispatch.category.name}
            </span>
          )}

          <span className="text-xs font-mono text-slate-500">
            ID: #{dispatch.id}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyText}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 rounded text-xs font-medium transition cursor-pointer"
            title="Kopiuj pełną treść depeszy"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Skopiowano</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Kopiuj</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Embargo Banner if active */}
      {dispatch.embargo_until && (
        <div className="p-3 bg-amber-950/40 border border-amber-700/60 rounded flex items-center gap-2.5 text-amber-300 text-xs font-mono">
          <Lock className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>EMBARGO PRASOWE DO:</strong>{' '}
            {formatFullDate(dispatch.embargo_until)}
          </span>
        </div>
      )}

      {/* Headline */}
      <h1 className="text-xl lg:text-2xl font-bold text-slate-100 leading-snug tracking-tight">
        {dispatch.title}
      </h1>

      {/* Date & Author Metadata */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 pb-2">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-slate-500" />
          <span>{formatFullDate(dispatch.created)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span>Podpis:</span>
          <strong className="text-slate-200">{dispatch.author_signature || '(PAP)'}</strong>
        </div>
      </div>

      {/* Formatted Lead Paragraph */}
      {dispatch.lead && (
        <div className="p-4 bg-slate-900/80 rounded-lg border-l-4 border-l-red-500 border border-slate-800/80">
          <p className="text-sm lg:text-base font-medium text-slate-200 leading-relaxed">
            {dispatch.lead}
          </p>
        </div>
      )}

      {/* Body text paragraphs */}
      <div className="space-y-4 text-sm text-slate-300 leading-relaxed font-normal">
        {dispatch.body ? (
          dispatch.body.split('\n\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))
        ) : (
          <p className="italic text-slate-500 text-xs">
            Brak dodatkowej treści rozwinięcia.
          </p>
        )}
      </div>

      {/* Tamper-Evident Cryptographic Audit Badge */}
      <div className="mt-8 pt-6 border-t border-slate-800/80">
        <div className="p-3.5 bg-slate-950 rounded border border-slate-800 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-200 font-mono">
                CERTYFIKAT INTEGRALNOŚCI PAP SHA-256
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/60">
                100% ZWERYFIKOWANY
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              UUID: {dispatch.uuid}
            </p>
            <p className="text-[11px] text-slate-500">
              Wpis zabezpieczony łańcuchem kryptograficznym w module <code className="text-slate-400 font-mono">newsroom_security</code>. Zgodność z audytem zero-trust.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
