import { LitElement, html, css } from 'lit';
import './WorldCanvas';
import './AudioControls';
import './HelpPanel';
import './regions/PluginRegion';

export class ConversationCanvas extends LitElement {
  static styles = css`
    .layout {
      display: grid;
      grid-template-columns: minmax(0, 1fr) var(--sac-sidebar-width);
      gap: var(--sac-space-5);
      padding: var(--sac-space-4);
      align-items: start;
      max-width: 1400px;
      margin: 0 auto;
    }
    @media (max-width: 980px) {
      .layout {
        grid-template-columns: 1fr;
      }
    }
    .main {
      min-width: 0;
    }
    .expression {
      margin-top: var(--sac-space-4);
      background: var(--sac-color-surface);
      border: 1px solid var(--sac-color-border);
      border-radius: var(--sac-radius-md);
      padding: var(--sac-space-3);
    }
    .expression-title {
      font-size: 0.85rem;
      font-weight: 600;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      color: var(--sac-color-muted);
      margin: 0 0 var(--sac-space-2);
    }
    sac-audio-controls {
      display: block;
      margin-top: var(--sac-space-3);
    }
    aside {
      display: flex;
      flex-direction: column;
      gap: var(--sac-space-4);
    }
    /* Auf schmalen Screens bleibt die Audio-Steuerung griffbereit. */
    @media (max-width: 980px) {
      sac-audio-controls {
        position: sticky;
        bottom: 0;
        z-index: 10;
      }
    }
  `;

  render() {
    return html`
      <div class="layout">
        <div class="main">
          <sac-world-canvas></sac-world-canvas>
          <section class="expression" aria-label="Reaktionen und Klaenge">
            <p class="expression-title">Reaktionen</p>
            <sac-plugin-region region="island-toolbar"></sac-plugin-region>
          </section>
          <sac-audio-controls></sac-audio-controls>
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