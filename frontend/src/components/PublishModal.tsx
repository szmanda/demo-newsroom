import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  Flame,
  AlertCircle,
  Clock,
  Eye,
  Edit3,
  Loader2,
} from 'lucide-react';
import { usePublishDispatch } from '../hooks/usePublishDispatch';
import type { UrgencyLevel, CreateWirePayload, WireDispatch } from '../types/wire';
import { CATEGORIES } from './FilterBar';

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (dispatch: WireDispatch) => void;
}

export const PublishModal: React.FC<PublishModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [urgency, setUrgency] = useState<UrgencyLevel>('ROUTINE');
  const [category, setCategory] = useState<string>('Gospodarka');
  const [title, setTitle] = useState('');
  const [lead, setLead] = useState('');
  const [body, setBody] = useState('');
  const [authorSignature, setAuthorSignature] = useState('(PAP) desk/ red');
  const [embargoUntil, setEmbargoUntil] = useState('');
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const publishMutation = usePublishDispatch();

  // Reset form on open
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!title.trim()) {
      setErrorMessage('Tytuł depeszy jest wymagany.');
      return;
    }

    setErrorMessage(null);

    const payload: CreateWirePayload = {
      title: title.trim(),
      lead: lead.trim() || undefined,
      body: body.trim() || undefined,
      urgency_level: urgency,
      category: category,
      author_signature: authorSignature.trim() || undefined,
      embargo_until: embargoUntil ? new Date(embargoUntil).toISOString() : null,
    };

    try {
      const createdDispatch = await publishMutation.mutateAsync(payload);
      // Reset form
      setTitle('');
      setLead('');
      setBody('');
      onSuccess(createdDispatch);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Wystąpił błąd podczas publikacji depeszy.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <h2 className="text-base font-bold text-slate-100 tracking-wide font-mono">
              NADAWANIE DEPESZY AGENCYJNEJ
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {/* Tab switch */}
            <div className="flex bg-slate-800/80 p-0.5 rounded border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('edit')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition ${
                  activeTab === 'edit'
                    ? 'bg-slate-700 text-slate-100 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edycja</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition ${
                  activeTab === 'preview'
                    ? 'bg-slate-700 text-slate-100 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Podgląd</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {errorMessage && (
            <div className="p-3 bg-red-950/60 border border-red-700 rounded text-red-200 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {activeTab === 'edit' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Urgency Level Selector */}
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1.5">
                  Pilność depeszy (Priorytet):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setUrgency('FLASH')}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded border text-xs font-mono font-bold transition cursor-pointer ${
                      urgency === 'FLASH'
                        ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-900/40'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-red-900/60'
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5 fill-current" />
                    <span>FLASH (Błyskawiczna)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUrgency('URGENT')}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded border text-xs font-mono font-bold transition cursor-pointer ${
                      urgency === 'URGENT'
                        ? 'bg-amber-600/90 text-white border-amber-500 shadow-lg shadow-amber-900/40'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-amber-900/60'
                    }`}
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>PILNE (Urgent)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUrgency('ROUTINE')}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded border text-xs font-mono font-bold transition cursor-pointer ${
                      urgency === 'ROUTINE'
                        ? 'bg-slate-700 text-white border-slate-600 shadow-md'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>ROUTYNA (Standard)</span>
                  </button>
                </div>
              </div>

              {/* Category & Signature Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
                    Dział / Kategoria:
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 font-mono focus:outline-none focus:border-red-500"
                  >
                    {CATEGORIES.filter((c) => c !== 'Wszystkie').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
                    Sygnatura autora / depeszowca:
                  </label>
                  <input
                    type="text"
                    value={authorSignature}
                    onChange={(e) => setAuthorSignature(e.target.value)}
                    placeholder="(PAP) mkr/ agz"
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 font-mono focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* Embargo Row (optional) */}
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
                  Embargo publikacyjne (opcjonalne):
                </label>
                <input
                  type="datetime-local"
                  value={embargoUntil}
                  onChange={(e) => setEmbargoUntil(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 font-mono focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Title Input */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                    Nagłówek depeszy (Tytuł): *
                  </label>
                  <span className="text-[11px] font-mono text-slate-500">
                    {title.length} zn.
                  </span>
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="np. Pilne: RPP podnosi stopy procentowe o 50 pb"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-red-500 font-medium"
                />
              </div>

              {/* Lead Summary */}
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
                  Lead (Wstęp agencyjny):
                </label>
                <textarea
                  rows={2}
                  value={lead}
                  onChange={(e) => setLead(e.target.value)}
                  placeholder="Pierwsze 1-2 kluczowe zdania depeszy odpowiadające na pytania: Kto? Co? Gdzie? Kiedy?"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-red-500 leading-relaxed"
                />
              </div>

              {/* Full Body Text */}
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase tracking-wider mb-1">
                  Rozwinięcie depeszy (Treść agencyjna):
                </label>
                <textarea
                  rows={4}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Warszawa (PAP) - Pełne rozwinięcie wiadomości, wypowiedzi, tło wydarzeń..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-red-500 leading-relaxed font-mono"
                />
              </div>
            </form>
          ) : (
            /* Live Preview */
            <div className="space-y-4 p-4 bg-slate-950 rounded-lg border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-red-600 text-white">
                  {urgency}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  #{category}
                </span>
                <span className="text-xs font-mono text-slate-500 ml-auto">
                  {authorSignature}
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-100">
                {title || '<Brak tytułu>'}
              </h2>
              {lead && (
                <p className="text-xs text-slate-300 font-medium p-3 bg-slate-900 border-l-2 border-red-500 rounded">
                  {lead}
                </p>
              )}
              {body ? (
                <div className="text-xs text-slate-400 space-y-2 font-mono whitespace-pre-line">
                  {body}
                </div>
              ) : (
                <p className="italic text-xs text-slate-600">Brak rozwinięcia.</p>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="text-[11px] font-mono text-slate-500 hidden sm:block">
            Naciśnij <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-400">Ctrl + Enter</kbd>, aby natychmiast nadać depeszę.
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              Anuluj
            </button>
            <button
              type="button"
              disabled={publishMutation.isPending || !title.trim()}
              onClick={() => handleSubmit()}
              className="flex items-center gap-2 px-4 py-2 rounded bg-red-600 hover:bg-red-500 active:bg-red-700 disabled:opacity-50 text-white text-xs font-semibold font-mono tracking-wide shadow-lg shadow-red-900/30 transition cursor-pointer"
            >
              {publishMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Nadawanie...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Nadaj depeszę</span>
                  <span className="hidden md:inline text-[10px] opacity-80">
                    (Ctrl+Enter)
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
