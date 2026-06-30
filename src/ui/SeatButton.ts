import { LitElement, html, css } from 'lit';
import type { Participant, Seat } from '../types';
import type { RelativeDirection } from '../room/EgoPerspective';
import './ParticipantDot';

const DIRECTION_TEXT: Record<RelativeDirection, string> = {
  self: 'bei dir',
  left: 'links von dir',
  right: 'rechts von dir',
  across: 'dir gegenueber',
};

export class SeatButton extends LitElement {
  static properties = {
    seat: {},
    occupant: {},
    isSelf: { type: Boolean },
    direction: {},
    reducedMotion: { type: Boolean },
  };

  seat?: Seat;
  occupant?: Participant;
  isSelf = false;
  direction: RelativeDirection = 'across';
  reducedMotion = false;
  onSelect: (seatId: string) => void = () => {};

  static styles = css`
    button {
      width: 96px;
      height: 96px;
      border-radius: 50%;
      border: 2px dashed var(--sac-color-border);
      background: var(--sac-color-seat-free);
      display: grid;
      place-items: center;
      cursor: pointer;
      color: var(--sac-color-text);
      padding: 0;
    }
    button.occupied {
      border-style: solid;
      background: var(--sac-color-seat-occupied);
    }
    button.self {
      border-color: var(--sac-color-seat-self);
      background: var(--sac-color-seat-self);
      cursor: default;
    }
    .free {
      font-size: 0.95rem;
      color: var(--sac-color-muted);
    }
  `;

  private label(): string {
    const seatLabel = this.seat?.label ?? 'Platz';
    if (this.isSelf) {
      return `Dein Platz: ${seatLabel}.`;
    }
    if (this.occupant) {
      const dir = DIRECTION_TEXT[this.direction];
      const speaking = this.occupant.isSpeaking ? ' und spricht gerade' : '';
      const muted = this.occupant.isMuted ? ' und ist stummgeschaltet' : '';
      return `${this.occupant.displayName} sitzt ${dir}${speaking}${muted}. Aktivieren, um dich daneben zu setzen.`;
    }
    return `Freier Platz ${seatLabel}. Aktivieren, um dort Platz zu nehmen.`;
  }

  render() {
    const seat = this.seat;
    if (!seat) {
      return html``;
    }
    const occupied = Boolean(this.occupant);
    const classes = `${occupied ? 'occupied' : ''} ${this.isSelf ? 'self' : ''}`;
    return html`
      <button
        class=${classes}
        aria-label=${this.label()}
        @click=${() => this.onSelect(seat.id)}
      >
        ${occupied
          ? html`<sac-participant-dot
              .participant=${this.occupant}
              ?reducedMotion=${this.reducedMotion}
            ></sac-participant-dot>`
          : html`<span class="free">Frei</span>`}
      </button>
    `;
  }
}

customElements.define('sac-seat-button', SeatButton);