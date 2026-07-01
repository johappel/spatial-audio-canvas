import { LitElement, html, css } from 'lit';

export interface GameListItem {
  id: string;
  title: string;
}

export class GamesPanel extends LitElement {
  static properties = {
    games: { state: true },
    prompt: { state: true },
  };

  games: GameListItem[] = [];
  prompt = '';
  onStart: (gameId: string) => void = () => {};

  static styles = css`
    :host {
      display: block;
    }
    .games {
      display: flex;
      gap: var(--sac-space-2);
      flex-wrap: wrap;
    }
    button {
      min-height: var(--sac-tap-target);
      padding: 0 var(--sac-space-3);
      border: none;
      border-radius: var(--sac-radius-sm);
      background: var(--sac-color-accent);
      color: var(--sac-color-accent-contrast);
      font-size: 1rem;
      cursor: pointer;
    }
    .prompt {
      margin-top: var(--sac-space-3);
      padding: var(--sac-space-3);
      border-radius: var(--sac-radius-sm);
      background: var(--sac-color-bg);
      min-height: 1.5em;
      font-size: 1.1rem;
    }
  `;

  showPrompt(text: string): void {
    this.prompt = text;
  }

  render() {
    return html`
      <section aria-label="Spiele">
        <div class="games">
          ${this.games.map(
            (game) => html`<button type="button" @click=${() => this.onStart(game.id)}>
              ${game.title} starten
            </button>`,
          )}
        </div>
        <p class="prompt" aria-live="polite">${this.prompt}</p>
      </section>
    `;
  }
}

customElements.define('sac-games-panel', GamesPanel);