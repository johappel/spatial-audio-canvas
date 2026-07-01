import { LitElement, html, css } from 'lit';
import type { Participant } from '../types';

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}

// Wahrnehmungsgerechte Verstaerkung: kleine RMS-Pegel (leises Reden) werden
// ueber eine Wurzel-Kennlinie deutlich sichtbar gemacht.
function toIntensity(level: number): number {
  return Math.min(1, Math.sqrt(Math.max(0, level)) * 2.8);
}

export class ParticipantDot extends LitElement {
  static properties = {
    participant: {},
    reducedMotion: { type: Boolean },
  };

  participant?: Participant;
  reducedMotion = false;

  static styles = css`
    :host {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      gap: var(--sac-space-1);
    }
    .dot {
      width: clamp(44px, 11vw, 56px);
      height: clamp(44px, 11vw, 56px);
      border-radius: 50%;
      display: grid;
      place-items: center;
      color: #111;
      font-weight: 700;
      background: var(--dot-color, #ccc);
      border: 3px solid transparent;
      transition:
        transform 90ms ease-out,
        box-shadow 90ms ease-out,
        filter 90ms ease-out,
        border-color 90ms ease-out;
    }
    .dot.self {
      border-color: var(--sac-color-text);
    }
    /* Deutliches Pulsieren: Ring + Glow + Helligkeit skalieren mit dem Pegel. */
    .dot.active {
      border-color: var(--sac-color-speaking);
      filter: brightness(calc(1 + var(--level, 0) * 0.5));
      box-shadow:
        0 0 0 calc(3px + var(--level, 0) * 26px)
          rgba(242, 193, 78, calc(0.2 + var(--level, 0) * 0.55)),
        0 0 calc(var(--level, 0) * 22px) rgba(242, 193, 78, 0.8);
    }
    .name {
      font-size: 0.9rem;
      max-width: clamp(64px, 18vw, 96px);
      text-align: center;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .mute {
      font-size: 0.8rem;
    }
    .whisper {
      font-size: 0.8rem;
      color: var(--sac-color-accent);
    }
    .dot.whisper {
      border-style: dashed;
      border-color: var(--sac-color-accent);
    }
    @media (prefers-reduced-motion: reduce) {
      .dot {
        transition: none;
      }
    }
  `;

  render() {
    const participant = this.participant;
    if (!participant) {
      return html``;
    }
    const intensity = toIntensity(participant.speakingLevel ?? 0);
    const active = intensity > 0.04;
    // Bei reduzierter Bewegung: kein Groesser-Zoomen, aber Ring/Helligkeit bleiben als Signal.
    const scale = this.reducedMotion || !active ? 1 : 1 + intensity * 0.45;
    return html`
      <div
        class="dot ${active ? 'active' : ''} ${participant.isLocal ? 'self' : ''} ${participant.whisperWith ? 'whisper' : ''}"
        style="--dot-color:${participant.color}; --level:${intensity.toFixed(3)}; transform: scale(${scale.toFixed(3)});"
      >
        ${initials(participant.displayName)}
      </div>
      <span class="name">
        ${participant.displayName}${participant.isMuted
          ? html` <span class="mute">(stumm)</span>`
          : ''}${participant.whisperWith ? html` <span class="whisper">(tuschelt)</span>` : ''}
      </span>
    `;
  }
}

customElements.define('sac-participant-dot', ParticipantDot);