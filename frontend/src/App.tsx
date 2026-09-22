import { useState, useMemo, useEffect } from 'react';
import { Header } from './components/Header';
import { FlashAlertTicker } from './components/FlashAlertTicker';
import { FilterBar } from './components/FilterBar';
import { WireFeed } from './components/WireFeed';
import { DispatchDetail } from './components/DispatchDetail';
import { PublishModal } from './components/PublishModal';
import { useWireDispatches } from './hooks/useWireDispatches';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import type { WireDispatch } from './types/wire';

export function App() {
  const [isLive, setIsLive] = useState(true);
  const [selectedUrgency, setSelectedUrgency] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDispatch, setSelectedDispatch] = useState<WireDispatch | null>(null);
  const [isPublishOpen, setIsPublishOpen] = useState(false);

  // Fetch dispatches with server-side filters and background polling
  const { data, isLoading, isError, error } = useWireDispatches(
    {
      urgency: selectedUrgency !== 'ALL' ? selectedUrgency : undefined,
      category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
      limit: 50,
    },
    isLive
  );

  const dispatches = data?.data || [];

  // Client-side search filtering
  const filteredDispatches = useMemo(() => {
    if (!searchQuery.trim()) return dispatches;
    const q = searchQuery.toLowerCase();
    return dispatches.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.lead.toLowerCase().includes(q) ||
        d.body.toLowerCase().includes(q) ||
        d.author_signature.toLowerCase().includes(q)
    );
  }, [dispatches, searchQuery]);

  // Find latest flash dispatch for breaking alert ticker
  const latestFlash = useMemo(() => {
    return dispatches.find((d) => d.urgency_level === 'FLASH' || d.is_flash) || null;
  }, [dispatches]);

  // Keep selection synchronized or auto-select first item on initial load
  useEffect(() => {
    if (filteredDispatches.length > 0) {
      if (!selectedDispatch) {
        setSelectedDispatch(filteredDispatches[0]);
      } else {
        // Keep updated item from new fetch
        const match = filteredDispatches.find((d) => d.id === selectedDispatch.id);
        if (match) {
          setSelectedDispatch(match);
        }
      }
    }
  }, [filteredDispatches, selectedDispatch]);

  // Keyboard navigation handlers
  const handleNextDispatch = () => {
    if (filteredDispatches.length === 0) return;
    const currentIndex = selectedDispatch
      ? filteredDispatches.findIndex((d) => d.id === selectedDispatch.id)
      : -1;
    const nextIndex =
      currentIndex < filteredDispatches.length - 1 ? currentIndex + 1 : 0;
    setSelectedDispatch(filteredDispatches[nextIndex]);
  };

  const handlePrevDispatch = () => {
    if (filteredDispatches.length === 0) return;
    const currentIndex = selectedDispatch
      ? filteredDispatches.findIndex((d) => d.id === selectedDispatch.id)
      : 0;
    const prevIndex =
      currentIndex > 0 ? currentIndex - 1 : filteredDispatches.length - 1;
    setSelectedDispatch(filteredDispatches[prevIndex]);
  };

  useKeyboardShortcuts({
    onNewDispatch: () => setIsPublishOpen(true),
    onNextDispatch: handleNextDispatch,
    onPrevDispatch: handlePrevDispatch,
    onClose: () => {
      if (isPublishOpen) {
        setIsPublishOpen(false);
      }
    },
    isModalOpen: isPublishOpen,
  });

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">
      {/* 1. Header */}
      <Header
        isLive={isLive}
        onToggleLive={() => setIsLive((prev) => !prev)}
        onOpenPublish={() => setIsPublishOpen(true)}
        dispatchesCount={filteredDispatches.length}
      />

      {/* 2. Breaking News FLASH Ticker */}
      <FlashAlertTicker
        flashDispatch={latestFlash}
        onSelect={(flash) => setSelectedDispatch(flash)}
      />

      {/* 3. Filter and Search Bar */}
      <FilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedUrgency={selectedUrgency}
        onUrgencyChange={setSelectedUrgency}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {/* 4. Split Terminal Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Chronological Wire Feed */}
        <div className="w-full sm:w-[380px] md:w-[420px] lg:w-[460px] border-r border-slate-800 bg-slate-950/40 flex flex-col shrink-0 h-full">
          <div className="px-4 py-2 border-b border-slate-800/80 bg-slate-900/30 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>STRUMIEŃ DEPESZ</span>
            <span>
              {filteredDispatches.length} {filteredDispatches.length === 1 ? 'pozycja' : 'pozycji'}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {isError ? (
              <div className="p-6 text-center text-red-400 text-xs space-y-2">
                <p>Nie udało się pobrać depesz z backendu.</p>
                <p className="text-slate-500 font-mono text-[10px]">
                  {error instanceof Error ? error.message : 'Błąd połączenia'}
                </p>
              </div>
            ) : (
              <WireFeed
                dispatches={filteredDispatches}
                selectedDispatch={selectedDispatch}
                onSelectDispatch={(d) => setSelectedDispatch(d)}
                isLoading={isLoading}
              />
            )}
          </div>
        </div>

        {/* Right Column: Full Reading Inspector */}
        <main className="flex-1 hidden sm:block bg-slate-900/20 h-full overflow-hidden">
          <DispatchDetail dispatch={selectedDispatch} />
        </main>
      </div>

      {/* 5. Publish Dispatch Modal */}
      <PublishModal
        isOpen={isPublishOpen}
        onClose={() => setIsPublishOpen(false)}
        onSuccess={(created) => {
          setSelectedDispatch(created);
        }}
      />
    </div>
  );
}

export default App;
