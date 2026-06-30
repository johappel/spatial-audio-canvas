import { LitElement, html, css } from 'lit';

export interface ChatEntry {
  senderId: string;
  senderName: string;
  text: string;
  sentAt: number;
}

export class ChatPanel extends LitElement {
  static properties = {
    entries: { state: true },
  };

  entries: ChatEntry[] = [];
  onSend: (text: string) => void = () => {};

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
  `;

  addMessage(entry: ChatEntry): void {
    this.entries = [...this.entries, entry].slice(-50);
  }

  private submit(event: Event): void {
    event.preventDefault();
    const input = this.renderRoot.querySelector('input');
    const value = input?.value.trim();
    if (input && value) {
      this.onSend(value);
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
              <span class="name">${entry.senderName}:</span> ${entry.text}
            </li>`,
          )}
        </ul>
        <form @submit=${(event: Event) => this.submit(event)}>
          <label class="sr-only" for="chat-input">Nachricht schreiben</label>
          <input id="chat-input" type="text" autocomplete="off" placeholder="Nachricht ..." />
          <button type="submit">Senden</button>
        </form>
      </section>
    `;
  }
}

customElements.define('sac-chat-panel', ChatPanel);