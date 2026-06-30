// Rendert die UI-Beitraege der Plugins fuer eine bestimmte Region.
import { LitElement, html } from 'lit';
import { getAppController } from '../../app/AppController';
import type { UiRegion } from '../../core/UiRegions';

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
    return html`${items.map((item) => item.element)}`;
  }
}

customElements.define('sac-plugin-region', PluginRegion);