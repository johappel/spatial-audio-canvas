import { LitElement, html, css, unsafeCSS } from 'lit';
import { ACCORDION_CSS } from './accordion';

export class HelpPanel extends LitElement {
  static styles = css`
    :host {
      display: block;
    }
    ${unsafeCSS(ACCORDION_CSS)}
    ul {
      margin: 0;
      padding-left: var(--sac-space-5);
      line-height: 1.7;
    }
  `;

  render() {
    return html`
      <details class="sac-accordion">
        <summary>
          <span class="ac-icon" aria-hidden="true">&#9432;</span>
          <span class="ac-title">So funktioniert es</span>
        </summary>
        <div class="ac-body">
          <ul>
            <li>Klicke auf einen freien Platz, um dich dorthin zu setzen.</li>
            <li>Personen links von dir hoerst du links, rechts hoerst du rechts.</li>
            <li>Wer spricht, dessen Punkt leuchtet auf.</li>
            <li>Mit dem Mikrofon-Knopf schaltest du dich stumm oder laut.</li>
          </ul>
        </div>
      </details>
    `;
  }
}

customElements.define('sac-help-panel', HelpPanel);