// Rendert die UI-Beitraege der Plugins fuer eine bestimmte Region.
import { LitElement, html } from 'lit';
import { getAppController } from '../../app/AppController';
import type { UiRegion } from '../../core/UiRegions';
import { ACCORDION_CSS } from '../accordion';

export class PluginRegion extends LitElement {
  static properties = {
    region: {},
  };

  region: UiRegion = 'sidebar';
  private unsubscribe?: () => void;

  // Light DOM, damit eingehaengte Elemente die globalen Tokens nutzen.
  protected createRenderRoot(): HTMLElement {
    return this;
  }

  connectedCallback(): void {
    super.connectedCallback();
    this.unsubscribe = getAppController().ui.subscribe((region) => {
      if (region === this.region) {
        this.requestUpdate();
      }
    });
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.unsubscribe?.();
  }

  render() {
    const items = getAppController().ui.get(this.region);
    // Nur die Sidebar wird als einklappbare Abschnitte dargestellt. Andere
    // Regionen (z. B. island-toolbar) rendern ihre Beitraege schlicht.
    if (this.region !== 'sidebar') {
      return html`${items.map((item) => item.element)}`;
    }
    return html`
      <style>
        ${ACCORDION_CSS}
      </style>
      ${items.map(
        (item) => html`<details class="sac-accordion" ?open=${item.defaultOpen ?? false}>
          <summary>
            ${item.icon ? html`<span class="ac-icon" aria-hidden="true">${item.icon}</span>` : ''}
            <span class="ac-title">${item.title ?? item.pluginId}</span>
          </summary>
          <div class="ac-body">${item.element}</div>
        </details>`,
      )}
    `;
  }
}

customElements.define('sac-plugin-region', PluginRegion);