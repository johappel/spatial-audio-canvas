import { LitElement, html, css } from 'lit';
import { StoreController } from '@nanostores/lit';
import { $currentIslandId, $roomConfig } from '../core/Store';
import { getAppController } from '../app/AppController';
import './IslandView';
import './AudioControls';
import './HelpPanel';
import './regions/PluginRegion';

export class ConversationCanvas extends LitElement {
  private cfg = new StoreController(this, $roomConfig);
  private islandId = new StoreController(this, $currentIslandId);

  static styles = css`
    .layout {
      display: grid;
      grid-template-columns: 1fr 320px;
      gap: var(--sac-space-5);
      padding: var(--sac-space-4);
      align-items: start;
    }
    @media (max-width: 860px) {
      .layout {
        grid-template-columns: 1fr;
      }
    }
    .main {
      min-width: 0;
    }
    .toolbar {
      margin-top: var(--sac-space-4);
      display: flex;
      flex-direction: column;
      gap: var(--sac-space-3);
    }
    .islands {
      display: flex;
      gap: var(--sac-space-2);
      flex-wrap: wrap;
      justify-content: center;
      margin-top: var(--sac-space-3);
    }
    .islands button {
      min-height: var(--sac-tap-target);
      padding: 0 var(--sac-space-3);
      border-radius: var(--sac-radius-pill);
      border: 1px solid var(--sac-color-border);
      background: var(--sac-color-surface);
      color: var(--sac-color-text);
      cursor: pointer;
    }
    .islands button[aria-current='true'] {
      background: var(--sac-color-accent);
      color: var(--sac-color-accent-contrast);
    }
    aside {
      display: flex;
      flex-direction: column;
      gap: var(--sac-space-4);
    }
  `;

  render() {
    const config = this.cfg.value;
    const controller = getAppController();
    return html`
      <div class="layout">
        <div class="main">
          <sac-island-view></sac-island-view>
          ${config && config.islands.length > 1
            ? html`<div class="islands" role="group" aria-label="Gespraechsinseln wechseln">
                ${config.islands.map(
                  (island) => html`<button
                    type="button"
                    aria-current=${island.id === this.islandId.value ? 'true' : 'false'}
                    @click=${() => controller.switchIsland(island.id)}
                  >
                    ${island.title}
                  </button>`,
                )}
              </div>`
            : ''}
          <div class="toolbar">
            <sac-plugin-region region="island-toolbar"></sac-plugin-region>
            <sac-audio-controls></sac-audio-controls>
          </div>
        </div>
        <aside>
          <sac-plugin-region region="sidebar"></sac-plugin-region>
          <sac-help-panel></sac-help-panel>
        </aside>
      </div>
    `;
  }
}

customElements.define('sac-conversation-canvas', ConversationCanvas);