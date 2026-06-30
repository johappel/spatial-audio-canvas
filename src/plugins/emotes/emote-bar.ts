import { LitElement, html, css } from 'lit';

export interface EmoteDef {
  id: string;
  label: string;
  symbol: string;
}

export const DEFAULT_EMOTES: EmoteDef[] = [
  { id: 'wave', label: 'Winken', symbol: '~' },
  { id: 'applause', label: 'Applaus', symbol: '*' },
  { id: 'heart', label: 'Herz', symbol: '<3' },
  { id: 'hand', label: 'Melden', symbol: '!' },
];

export class EmoteBar extends LitElement {
  static properties = {
    recent: { state: true },
  };

  recent: string[] = [];
  onEmote: (id: string) => void = () => {};

  static styles = css`
    :host {
      display: block;
    }
    .row {
      display: flex;
      gap: var(--sac-space-2);
      flex-wrap: wrap;
      align-items: center;
    }
    button {
      min-height: var(--sac-tap-target);
      min-width: var(--sac-tap-target);
      padding: 0 var(--sac-space-3);
      border: 1px solid var(--sac-color-border);
      border-radius: var(--sac-radius-pill);
      background: var(--sac-color-surface);
      color: var(--sac-color-text);
      font-size: 1rem;
      cursor: pointer;
    }
    .recent {
      margin-left: var(--sac-space-3);
      color: var(--sac-color-muted);
      min-height: 1.5em;
    }
  `;

  flash(text: string): void {
    this.recent = [...this.recent, text].slice(-3);
    window.setTimeout(() => {
      this.recent = this.recent.slice(1);
    }, 2500);
  }

  render() {
    return html`
      <div class="row" role="group" aria-label="Emotes senden">
        ${DEFAULT_EMOTES.map(
          (emote) => html`<button
            type="button"
            title=${emote.label}
            aria-label=${emote.label}
            @click=${() => this.onEmote(emote.id)}
          >
            ${emote.symbol} ${emote.label}
          </button>`,
        )}
        <span class="recent" aria-live="polite">${this.recent.join('  ')}</span>
      </div>
    `;
  }
}

customElements.define('sac-emote-bar', EmoteBar);