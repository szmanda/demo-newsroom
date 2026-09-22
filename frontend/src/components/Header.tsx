import React, { useState } from 'react';
import { Radio, Plus, Key, Keyboard, Pause, Play, Check } from 'lucide-react';

interface HeaderProps {
  isLive: boolean;
  onToggleLive: () => void;
  onOpenPublish: () => void;
  dispatchesCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  isLive,
  onToggleLive,
  onOpenPublish,
  dispatchesCount,
}) => {
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(
    localStorage.getItem('pap_editorial_api_key') || 'secret-pap-editorial-key'
  );
  const [keySaved, setKeySaved] = useState(false);

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('pap_editorial_api_key', apiKeyInput);
    setKeySaved(true);
    setTimeout(() => {
      setKeySaved(false);
      setShowApiKeyModal(false);
    }, 1000);
  };

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-30 px-4 lg:px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Agency Wordmark & Tagline */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded bg-red-600 text-white font-black tracking-tighter text-lg shadow-lg shadow-red-900/30">
            PAP
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-100 tracking-wide">
                NEWSROOM WIRE DESK
              </h1>
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono tracking-wider font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                v1.0 HEADLESS
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono hidden md:block">
              Polska Agencja Prasowa • Bezpośredni strumień agencyjny
            </p>
          </div>
        </div>

        {/* Center: Live stream indicator & ticker */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleLive}
            title={isLive ? 'Kliknij, aby wstrzymać odświeżanie' : 'Kliknij, aby wznowić odświeżanie'}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono font-medium transition-all border ${
              isLive
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800 hover:bg-emerald-900/40'
                : 'bg-amber-950/40 text-amber-400 border-amber-800 hover:bg-amber-900/40'
            }`}
          >
            <span className="relative flex h-2 w-2">
              {isLive && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isLive ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
              ></span>
            </span>
            <span className="hidden sm:inline">
              {isLive ? 'STRUMIEŃ AKTYWNY' : 'WSTRZYMANO'}
            </span>
            {isLive ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          </button>

          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/80 rounded border border-slate-800 text-xs font-mono text-slate-400">
            <Radio className="w-3.5 h-3.5 text-slate-500" />
            <span>Depesze:</span>
            <span className="text-slate-200 font-bold">{dispatchesCount}</span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Key configuration button */}
          <button
            onClick={() => setShowApiKeyModal(!showApiKeyModal)}
            title="Klucz API Redakcji"
            className="p-2 rounded bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700 transition"
          >
            <Key className="w-4 h-4" />
          </button>

          {/* New Dispatch button */}
          <button
            onClick={onOpenPublish}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-medium text-xs sm:text-sm tracking-wide shadow-md shadow-red-900/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nowa depesza</span>
            <kbd className="hidden md:inline-block px-1 py-0.5 text-[10px] font-mono bg-red-700/60 rounded text-red-200 border border-red-500/30">
              N
            </kbd>
          </button>
        </div>
      </div>

      {/* API Key Modal / Dropdown */}
      {showApiKeyModal && (
        <div className="absolute right-4 top-14 w-80 p-4 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
              Klucz API Redakcji
            </span>
            <button
              onClick={() => setShowApiKeyModal(false)}
              className="text-slate-500 hover:text-slate-300 text-xs"
            >
              Zamknij
            </button>
          </div>
          <p className="text-xs text-slate-400 mb-3">
            Nagłówek <code className="text-slate-300 font-mono">X-Newsroom-Api-Key</code> autoryzujący publikację depesz do backendu Drupal.
          </p>
          <form onSubmit={handleSaveApiKey} className="space-y-3">
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded text-xs text-slate-200 font-mono focus:outline-none focus:border-red-500"
              placeholder="secret-pap-editorial-key"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium transition"
              >
                {keySaved ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Zapisano</span>
                  </>
                ) : (
                  <span>Zapisz klucz</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </header>
  );
};
