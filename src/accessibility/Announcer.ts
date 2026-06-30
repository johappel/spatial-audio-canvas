// Kapselt eine ARIA-Live-Region fuer Screenreader-Ansagen
// (Platzwechsel, Sprecherstatus, Hinweise).
export class Announcer {
  private readonly region: HTMLElement;

  constructor() {
    this.region = document.createElement('div');
    this.region.className = 'sr-only';
    this.region.setAttribute('aria-live', 'polite');
    this.region.setAttribute('aria-atomic', 'true');
    document.body.appendChild(this.region);
  }

  announce(message: string, assertive = false): void {
    this.region.setAttribute('aria-live', assertive ? 'assertive' : 'polite');
    this.region.textContent = '';
    window.setTimeout(() => {
      this.region.textContent = message;
    }, 30);
  }
}