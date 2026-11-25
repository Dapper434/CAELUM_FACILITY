import { useEffect } from 'react';

const FIELD = /^(INPUT|TEXTAREA|SELECT)$/;

function isField(target) {
  if (!target) return false;
  if (target.isContentEditable) return true;
  return FIELD.test(target.tagName);
}

function hasBlockingOverlay() {
  return Boolean(document.querySelector('[aria-modal="true"], [role="dialog"], [role="alertdialog"], [role="menu"]'));
}

/**
 * Run `onBack` when the user presses Escape, unless a field that can use Esc
 * has focus, or a modal / dialog / menu is already open.
 */
export function useEscapeBack(onBack, { enabled = true } = {}) {
  useEffect(() => {
    if (!enabled) return undefined;
    const onKey = (event) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      if (isField(event.target)) return;
      if (hasBlockingOverlay()) return;
      event.preventDefault();
      onBack();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [enabled, onBack]);
}
