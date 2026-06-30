import { LitElement, html, css } from 'lit';

export interface GestureDef {
  id: string;
  label: string;
  freq: number;
}

export const DEFAULT_GESTURES: GestureDef[] = [
  { id: 'chime', label: 'Glocke', freq: 880 },
  { id: 'knock', label: 'Klopfen', freq: 160 },
  { id: 'bell', label: 'Helle Glocke', freq: 1320 },
];

export class GestureBar extends LitElement {
  onGesture: (id: string) => void = () => {};

  static styles = css`
    :host {
      display: block;
    }
    .row {
      display: flex;
      gap: var(--sac-space-2);
      flex-wrap: wrap;
    }
    button {
      min-height: var(--sac-tap-target);
      padding: 0 var(--sac-space-3);
      border: 1px solid var(--sac-color-border);
      border-radius: var(--sac-radius-pill);
      background: var(--sac-color-surface);
      color: var(--sac-color-text);
      font-size: 1rem;
      cursor: pointer;
    }
  `;

  render() {
    return html`
      <div class="row" role="group" aria-label="Klanggesten">
        ${DEFAULT_GESTURES.map(
          (gesture) => html`<button
            type="button"
            aria-label=${gesture.label}
            @click=${() => this.onGesture(gesture.id)}
          >
            ${gesture.label}
          </button>`,
        )}
      </div>
    `;
  }
}

customElements.define('sac-gesture-bar', GestureBar);