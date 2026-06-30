import { LitElement, html, css } from 'lit';
import './WorldCanvas';
import './AudioControls';
import './HelpPanel';
import './regions/PluginRegion';

export class ConversationCanvas extends LitElement {
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
    aside {
      display: flex;
      flex-direction: column;
      gap: var(--sac-space-4);
    }
  `;

  render() {
    return html`
      <div class="layout">
        <div class="main">
          <sac-world-canvas></sac-world-canvas>
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