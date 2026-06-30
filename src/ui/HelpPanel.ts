import { LitElement, html, css } from 'lit';

export class HelpPanel extends LitElement {
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
      margin: 0;
      padding-left: var(--sac-space-5);
      line-height: 1.7;
    }
  `;

  render() {
    return html`
      <section aria-label="Hilfe">
        <h2>So funktioniert es</h2>
        <ul>
          <li>Klicke auf einen freien Platz, um dich dorthin zu setzen.</li>
          <li>Personen links von dir hoerst du links, rechts hoerst du rechts.</li>
          <li>Wer spricht, dessen Punkt leuchtet auf.</li>
          <li>Mit dem Mikrofon-Knopf schaltest du dich stumm oder laut.</li>
        </ul>
      </section>
    `;
  }
}

customElements.define('sac-help-panel', HelpPanel);