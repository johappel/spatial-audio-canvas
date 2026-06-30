import { LitElement, html } from 'lit';
import { StoreController } from '@nanostores/lit';
import { $view } from '../core/Store';
import './JoinScreen';
import './PermissionScreen';
import './ConversationCanvas';

export class App extends LitElement {
  private view = new StoreController(this, $view);

  // Light DOM, damit globale Basis-Styles (Skip-Link, sr-only) gelten.
  protected createRenderRoot(): HTMLElement {
    return this;
  }

  render() {
    switch (this.view.value) {
      case 'join':
        return html`<sac-join-screen></sac-join-screen>`;
      case 'permission':
        return html`<sac-permission-screen></sac-permission-screen>`;
      case 'canvas':
        return html`<sac-conversation-canvas></sac-conversation-canvas>`;
      default:
        return html``;
    }
  }
}

customElements.define('sac-app', App);