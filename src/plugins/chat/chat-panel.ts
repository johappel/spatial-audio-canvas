import { LitElement, html, css } from 'lit';

export interface ChatEntry {
  senderId: string;
  senderName: string;
  text: string;
  sentAt: number;
  scope?: 'island' | 'global';
}

export class ChatPanel extends LitElement {
  static properties = {
    entries: { state: true },
    scope: { state: true },
  };

  entries: ChatEntry[] = [];
  scope: 'island' | 'global' = 'island';
  onSend: (text: string, scope: 'island' | 'global') => void = () => {};

  static styles = css`
    :host {
      display: block;
      background: var(--sac-color-surface);
      border: 1px solid var(--sac-color-border);
      border-radius: var(--sac-radius-md);
      padding: var(--sac-space-3);
    }
    h2 {
      font-size: 1rem;
      margin: 0 0 var(--sac-space-2);
    }
    ul {
      list-style: none;
      margin: 0 0 var(--sac-space-3);
      padding: 0;
      max-height: 220px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: var(--sac-space-2);
    }
    li {
      background: var(--sac-color-bg);
      border-radius: var(--sac-radius-sm);
      padding: var(--sac-space-2);
    }
    .name {
      font-weight: 600;
    }
    form {
      display: flex;
      gap: var(--sac-space-2);
    }
    input {
      flex: 1;
      min-height: var(--sac-tap-target);
      padding: 0 var(--sac-space-3);
      font-size: 1rem;
      border-radius: var(--sac-radius-sm);
      border: 1px solid var(--sac-color-border);
      background: var(--sac-color-bg);
      color: var(--sac-color-text);
    }
    button {
      min-height: var(--sac-tap-target);
      padding: 0 var(--sac-space-4);
      border: none;
      border-radius: var(--sac-radius-sm);
      background: var(--sac-color-accent);
      color: var(--sac-color-accent-contrast);
      font-size: 1rem;
      cursor: pointer;
    }
    .badge {
      font-size: 0.7rem;
      background: var(--sac-color-accent);
      color: var(--sac-color-accent-contrast);
      border-radius: var(--sac-radius-pill);
      padding: 0 6px;
    }
    .scope {
      display: flex;
      gap: var(--sac-space-2);
      align-items: center;
      margin-top: var(--sac-space-2);
      font-size: 0.9rem;
      color: var(--sac-color-muted);
    }
  `;

  addMessage(entry: ChatEntry): void {
    this.entries = [...this.entries, entry].slice(-50);
  }

  private submit(event: Event): void {
    event.preventDefault();
    const input = this.renderRoot.querySelector('input');
    const value = input?.value.trim();
    if (input && value) {
      this.onSend(value, this.scope);
      input.value = '';
    }
  }

  render() {
    return html`
      <section aria-label="Chat">
        <h2>Chat</h2>
        <ul>
          ${this.entries.map(
            (entry) => html`<li>
              ${entry.scope === 'global' ? html`<span class="badge">global</span> ` : ''}
              <span class="name">${entry.senderName}:</span> ${entry.text}
            </li>`,
          )}
        </ul>
        <form @submit=${(event: Event) => this.submit(event)}>
          <label class="sr-only" for="chat-input">Nachricht schreiben</label>
          <input id="chat-input" type="text" autocomplete="off" placeholder="Nachricht ..." />
          <button type="submit">Senden</button>
        </form>
        <label class="scope">
          <input
            type="checkbox"
            .checked=${this.scope === 'global'}
            @change=${(event: Event) =>
              (this.scope = (event.target as HTMLInputElement).checked ? 'global' : 'island')}
          />
          An alle Inseln senden (global)
        </label>
      </section>
    `;
  }
}

customElements.define('sac-chat-panel', ChatPanel);