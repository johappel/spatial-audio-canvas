import { LitElement, html, css } from 'lit';
import { StoreController } from '@nanostores/lit';
import { $ambientVolume, $localParticipantId, $micEnabled, $participants } from '../core/Store';
import { getAppController } from '../app/AppController';

export class AudioControls extends LitElement {
  static properties = {
    highContrast: { state: true },
  };

  private mic = new StoreController(this, $micEnabled);
  private participants = new StoreController(this, $participants);
  private localId = new StoreController(this, $localParticipantId);
  private ambient = new StoreController(this, $ambientVolume);
  highContrast = false;

  static styles = css`
    .controls {
      display: flex;
      flex-wrap: wrap;
      gap: var(--sac-space-3);
      align-items: center;
      background: var(--sac-color-surface);
      border: 1px solid var(--sac-color-border);
      border-radius: var(--sac-radius-md);
      padding: var(--sac-space-3);
    }
    button {
      min-height: var(--sac-tap-target);
      padding: 0 var(--sac-space-3);
      border-radius: var(--sac-radius-sm);
      border: 1px solid var(--sac-color-border);
      background: var(--sac-color-bg);
      color: var(--sac-color-text);
      font-size: 1rem;
      cursor: pointer;
    }
    button.mute {
      background: var(--sac-color-accent);
      color: var(--sac-color-accent-contrast);
      border: none;
    }
    button.mute.muted {
      background: var(--sac-color-danger);
    }
    .demo,
    label.ambient {
      display: flex;
      gap: var(--sac-space-2);
      align-items: center;
      flex-wrap: wrap;
    }
    input[type='range'] {
      min-width: 140px;
    }
    .people {
      display: flex;
      flex-direction: column;
      gap: var(--sac-space-2);
      width: 100%;
    }
    .person {
      display: flex;
      gap: var(--sac-space-2);
      align-items: center;
      flex-wrap: wrap;
    }
    .person-name {
      min-width: 90px;
    }
  `;

  private demoParticipants() {
    return Object.values(this.participants.value).filter((p) => p.id.startsWith('demo-'));
  }

  private otherParticipants() {
    return Object.values(this.participants.value).filter((p) => !p.isLocal);
  }

  private setPersonVolume(id: string, event: Event): void {
    getAppController().setParticipantVolume(id, Number((event.target as HTMLInputElement).value));
  }

  private setAmbient(event: Event): void {
    getAppController().setAmbientVolume(Number((event.target as HTMLInputElement).value));
  }

  private toggleContrast(): void {
    this.highContrast = !this.highContrast;
    document.body.classList.toggle('sac-high-contrast', this.highContrast);
  }

  render() {
    const local = this.participants.value[this.localId.value];
    const muted = local?.isMuted ?? false;
    const micAvailable = this.mic.value;
    return html`
      <section class="controls" aria-label="Audio-Steuerung">
        <button
          class="mute ${muted ? 'muted' : ''}"
          ?disabled=${!micAvailable}
          aria-pressed=${muted}
          @click=${() => getAppController().toggleMute()}
        >
          ${!micAvailable ? 'Kein Mikrofon' : muted ? 'Mikrofon ist aus' : 'Mikrofon ist an'}
        </button>

        ${this.demoParticipants().length > 0
          ? html`<div class="demo" role="group" aria-label="Demo: jemanden sprechen lassen">
              <span>Demo:</span>
              ${this.demoParticipants().map(
                (participant) => html`<button @click=${() => getAppController().speakAs(participant.id)}>
                  ${participant.displayName} spricht
                </button>`,
              )}
            </div>`
          : ''}

        <label class="ambient">
          Hintergrund
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            .value=${String(this.ambient.value)}
            @input=${(event: Event) => this.setAmbient(event)}
          />
        </label>

        ${this.otherParticipants().length > 0
          ? html`<div class="people" role="group" aria-label="Lautstaerke einzelner Personen">
              ${this.otherParticipants().map(
                (p) => html`<label class="person">
                  <span class="person-name">${p.displayName}</span>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.05"
                    .value=${String(getAppController().getParticipantVolume(p.id))}
                    aria-label=${`Lautstaerke von ${p.displayName}`}
                    @input=${(event: Event) => this.setPersonVolume(p.id, event)}
                  />
                </label>`,
              )}
            </div>`
          : ''}

        <button
          class="contrast"
          aria-pressed=${this.highContrast}
          @click=${() => this.toggleContrast()}
        >
          Hoher Kontrast: ${this.highContrast ? 'an' : 'aus'}
        </button>
      </section>
    `;
  }
}

customElements.define('sac-audio-controls', AudioControls);