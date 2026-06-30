import { LitElement, html, css } from 'lit';
import { getAppController } from '../app/AppController';

export class PermissionScreen extends LitElement {
  static properties = {
    busy: { state: true },
  };

  busy = false;

  static styles = css`
    .card {
      max-width: 480px;
      margin: var(--sac-space-6) auto;
      padding: var(--sac-space-5);
      background: var(--sac-color-surface);
      border: 1px solid var(--sac-color-border);
      border-radius: var(--sac-radius-lg);
      box-shadow: var(--sac-shadow);
    }
    h1 {
      margin-top: 0;
    }
    button {
      min-height: var(--sac-tap-target);
      font-size: 1.1rem;
      border: none;
      border-radius: var(--sac-radius-sm);
      background: var(--sac-color-accent);
      color: var(--sac-color-accent-contrast);
      cursor: pointer;
      padding: 0 var(--sac-space-5);
      margin-top: var(--sac-space-4);
    }
    ul {
      padding-left: var(--sac-space-5);
      color: var(--sac-color-muted);
    }
  `;

  private async enter(): Promise<void> {
    this.busy = true;
    try {
      await getAppController().enterWithMic();
    } finally {
      this.busy = false;
    }
  }

  render() {
    return html`
      <section class="card">
        <h1>Mikrofon erlauben</h1>
        <p>Damit andere dich hoeren koennen, wird dein Mikrofon benoetigt.</p>
        <ul>
          <li>Es wird keine Kamera verwendet.</li>
          <li>Kopfhoerer werden empfohlen, damit links und rechts gut hoerbar sind.</li>
          <li>Es findet keine Aufzeichnung statt.</li>
        </ul>
        <button type="button" ?disabled=${this.busy} @click=${() => this.enter()}>
          ${this.busy ? 'Einen Moment ...' : 'Mikrofon erlauben und beitreten'}
        </button>
      </section>
    `;
  }
}

customElements.define('sac-permission-screen', PermissionScreen);