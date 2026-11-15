/**
 * Keyboard roving tabindex helper for role="toolbar" and role="tablist" widgets
 * when native focusgroup is unavailable in the browser.
 */
export function handleRovingArrowKeyDown(
  event: KeyboardEvent,
  orientation: 'horizontal' | 'vertical',
  activateOnFocus = false,
): void {
  const container = event.currentTarget as HTMLElement | null;
  if (!container) return;

  const rtl =
    orientation === 'horizontal' &&
    typeof window !== 'undefined' &&
    getComputedStyle(container).direction === 'rtl';

  const prevKey =
    orientation === 'vertical'
      ? 'ArrowUp'
      : rtl
        ? 'ArrowRight'
        : 'ArrowLeft';
  const nextKey =
    orientation === 'vertical'
      ? 'ArrowDown'
      : rtl
        ? 'ArrowLeft'
        : 'ArrowRight';
  const key = event.key;

  if (key !== prevKey && key !== nextKey && key !== 'Home' && key !== 'End') {
    return;
  }

  const items = Array.from(
    container.querySelectorAll<HTMLButtonElement>('button:not([disabled])'),
  );
  if (items.length === 0) return;

  const active = document.activeElement as HTMLButtonElement | null;
  const currentIdx = active ? items.indexOf(active) : -1;
  if (currentIdx === -1) return;

  let nextIdx = currentIdx;
  if (key === nextKey) {
    nextIdx = (currentIdx + 1) % items.length;
  } else if (key === prevKey) {
    nextIdx = (currentIdx - 1 + items.length) % items.length;
  } else if (key === 'Home') {
    nextIdx = 0;
  } else if (key === 'End') {
    nextIdx = items.length - 1;
  }

  event.preventDefault();
  event.stopPropagation();
  const nextEl = items[nextIdx];
  if (!nextEl) return;

  items.forEach((btn, idx) => {
    btn.tabIndex = idx === nextIdx ? 0 : -1;
  });
  nextEl.focus();
  if (activateOnFocus) {
    nextEl.click();
  }
}

export function syncRovingTabIndexOnFocus(event: FocusEvent): void {
  const container = event.currentTarget as HTMLElement | null;
  const target = event.target;
  if (!container || !(target instanceof HTMLButtonElement)) return;

  const items = Array.from(
    container.querySelectorAll<HTMLButtonElement>('button:not([disabled])'),
  );
  if (!items.includes(target)) return;

  items.forEach((btn) => {
    btn.tabIndex = btn === target ? 0 : -1;
  });
}
