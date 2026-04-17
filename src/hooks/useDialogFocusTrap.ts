import { useEffect, type RefObject } from 'react';

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export function useDialogFocusTrap(
  ref: RefObject<HTMLElement>,
  enabled: boolean,
  onClose?: () => void,
) {
  useEffect(() => {
    if (!enabled || !ref.current) {
      return;
    }

    const container = ref.current;
    const previousActive = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusable = Array.from(
      container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS),
    );
    const first = focusable[0] ?? container;
    const last = focusable[focusable.length - 1] ?? container;

    first.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose?.();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const currentActive = document.activeElement instanceof HTMLElement ? document.activeElement : null;

      if (event.shiftKey && currentActive === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && currentActive === last) {
        event.preventDefault();
        first.focus();
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      previousActive?.focus();
    };
  }, [enabled, onClose, ref]);
}
