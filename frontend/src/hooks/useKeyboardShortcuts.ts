import { useEffect } from 'react';

interface KeyboardShortcutHandlers {
  onNewDispatch: () => void;
  onNextDispatch: () => void;
  onPrevDispatch: () => void;
  onClose: () => void;
  isModalOpen: boolean;
}

export function useKeyboardShortcuts({
  onNewDispatch,
  onNextDispatch,
  onPrevDispatch,
  onClose,
  isModalOpen,
}: KeyboardShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        activeEl?.tagName === 'SELECT';

      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // If user is currently typing in an input/textarea, do not intercept regular letter keys
      if (isInput) {
        return;
      }

      if (isModalOpen) {
        return;
      }

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        onNewDispatch();
      } else if (e.key === 'j' || e.key === 'J' || e.key === 'ArrowDown') {
        e.preventDefault();
        onNextDispatch();
      } else if (e.key === 'k' || e.key === 'K' || e.key === 'ArrowUp') {
        e.preventDefault();
        onPrevDispatch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNewDispatch, onNextDispatch, onPrevDispatch, onClose, isModalOpen]);
}
