// Kleine Helfer fuer sichtbare und nachvollziehbare Fokusfuehrung.
const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function getFocusable(container: ParentNode): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE));
}

export function focusFirst(container: ParentNode): void {
  const [first] = getFocusable(container);
  first?.focus();
}