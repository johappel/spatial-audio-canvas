import { LitElement, html, css } from 'lit';
import { PRIVACY_DETAILS, PRIVACY_SHORT } from '../privacy/privacyText';

export class PrivacyNotice extends LitElement {
  static styles = css`
    :host {
      display: block;
      margin-top: var(--sac-space-4);
      color: var(--sac-color-muted);
      font-size: 0.95rem;
    }
    details {
      margin-top: var(--sac-space-2);
    }
    summary {
      cursor: pointer;
      color: var(--sac-color-accent);
    }
    ul {
      margin: var(--sac-space-2) 0 0;
      padding-left: var(--sac-space-5);
    }
  `;

  render() {
    return html`
      <p>${PRIVACY_SHORT}</p>
      <details>
        <summary>Was wird verarbeitet?</summary>
        <ul>
          ${PRIVACY_DETAILS.map((item) => html`<li>${item}</li>`)}
        </ul>
      </details>
    `;
  }
}

customElements.define('sac-privacy-notice', PrivacyNotice);