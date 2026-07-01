import { LitElement, html, css } from 'lit';
import { getAppController } from '../app/AppController';
import './PrivacyNotice';

export class JoinScreen extends LitElement {
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
    form {
      display: flex;
      flex-direction: column;
      gap: var(--sac-space-3);
      margin-top: var(--sac-space-4);
    }
    label {
      font-weight: 600;
    }
    input {
      min-height: var(--sac-tap-target);
      padding: 0 var(--sac-space-3);
      font-size: 1.1rem;
      border-radius: var(--sac-radius-sm);
      border: 1px solid var(--sac-color-border);
      background: var(--sac-color-bg);
      color: var(--sac-color-text);
    }
    button {
      min-height: var(--sac-tap-target);
      font-size: 1.1rem;
      font-weight: 600;
      border: none;
      border-radius: var(--sac-radius-sm);
      background: var(--sac-color-accent);
      color: var(--sac-color-accent-contrast);
      cursor: pointer;
    }
  `;

  private submit(event: Event): void {
    event.preventDefault();
    const input = this.renderRoot.querySelector('input');
    getAppController().join(input?.value ?? '');
  }

  render() {
    return html`
      <section class="card">
        <h1>Spatial Audio Canvas</h1>
        <p>
          Ein ruhiger Begegnungsraum: Du nimmst an einer Gespraechsinsel Platz und hoerst Stimmen
          links, rechts und gegenueber. Keine Kamera, kein Konto.
        </p>
        <form @submit=${(event: Event) => this.submit(event)}>
          <label for="join-name">Dein Name oder Pseudonym</label>
          <input id="join-name" type="text" required autocomplete="nickname" />
          <button type="submit">Raum betreten</button>
        </form>
        <sac-privacy-notice></sac-privacy-notice>
      </section>
    `;
  }
}

customElements.define('sac-join-screen', JoinScreen);