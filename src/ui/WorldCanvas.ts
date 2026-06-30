import { LitElement, html, css } from 'lit';
import { repeat } from 'lit/directives/repeat.js';
import { StoreController } from '@nanostores/lit';
import {
  $currentIslandId,
  $localParticipantId,
  $participants,
  $reducedMotion,
  $roomConfig,
} from '../core/Store';
import { STAGE_ASPECT, computeScreenSeats } from '../room/WorldLayout';
import { getAppController } from '../app/AppController';
import type { Participant } from '../types';
import './SeatButton';
import './ParticipantDot';

// Stabile Weltkarte: alle Inseln gleichzeitig sichtbar. Der eigene Avatar
// gleitet beim Platz-/Inselwechsel ueber den Canvas (keine Tischdrehung).
export class WorldCanvas extends LitElement {
  private cfg = new StoreController(this, $roomConfig);
  private participants = new StoreController(this, $participants);
  private localId = new StoreController(this, $localParticipantId);
  private currentIsland = new StoreController(this, $currentIslandId);
  private reduced = new StoreController(this, $reducedMotion);

  static styles = css`
    .stage {
      position: relative;
      width: 100%;
      max-width: 1000px;
      aspect-ratio: var(--stage-aspect, 1.778);
      margin: 0 auto;
      border-radius: var(--sac-radius-lg);
      background: radial-gradient(
        circle at 50% 50%,
        color-mix(in srgb, var(--sac-color-surface) 55%, transparent),
        transparent 78%
      );
      overflow: hidden;
    }
    .island-backdrop {
      position: absolute;
      transform: translate(-50%, -50%);
      border-radius: 50%;
      aspect-ratio: 1;
      border: 2px solid var(--sac-color-border);
      background: color-mix(in srgb, var(--sac-color-surface) 45%, transparent);
      display: grid;
      align-content: start;
      justify-items: center;
      transition: opacity var(--sac-motion-duration) ease;
    }
    .island-backdrop.dimmed {
      opacity: 0.4;
    }
    .island-label {
      margin-top: 8px;
      font-weight: 600;
      font-size: 0.9rem;
      color: var(--sac-color-muted);
    }
    .node {
      position: absolute;
      transform: translate(-50%, -50%);
      transition:
        left 600ms ease,
        top 600ms ease;
    }
    .node.reduced {
      transition: none;
    }
    .node.dimmed {
      opacity: 0.55;
    }
    button.dotbtn {
      border: none;
      background: none;
      padding: 0;
      cursor: pointer;
      border-radius: 50%;
    }
    button.dotbtn:focus-visible {
      outline: var(--sac-focus-ring);
      outline-offset: 4px;
    }
    .hint {
      text-align: center;
      color: var(--sac-color-muted);
      margin-top: var(--sac-space-3);
    }
  `;

  render() {
    const config = this.cfg.value;
    if (!config) {
      return html`<p>Raum wird geladen ...</p>`;
    }
    const participants = this.participants.value;
    const local = participants[this.localId.value];
    const localSeatId = local?.seatId ?? config.islands[0]?.seats[0]?.id ?? '';
    const screens = computeScreenSeats(config, localSeatId);
    const byId = new Map(screens.map((s) => [s.seatId, s]));
    const occupied = new Map<string, Participant>();
    Object.values(participants).forEach((p) => occupied.set(p.seatId, p));
    const currentIslandId = this.currentIsland.value;
    const reduced = this.reduced.value;
    const controller = getAppController();
    const allSeats = config.islands.flatMap((i) => i.seats);

    const backdrops = config.islands.map((island) => {
      const pts = island.seats
        .map((s) => byId.get(s.id))
        .filter((p): p is NonNullable<typeof p> => Boolean(p));
      if (pts.length === 0) {
        return html``;
      }
      const cx = pts.reduce((a, p) => a + p.x, 0) / pts.length;
      const cy = pts.reduce((a, p) => a + p.y, 0) / pts.length;
      const spanX = Math.max(...pts.map((p) => Math.abs(p.x - cx)));
      const spanY = Math.max(...pts.map((p) => Math.abs(p.y - cy)));
      const diameter = Math.max(spanX, spanY) * 2 + 0.14;
      const dimmed = island.id !== currentIslandId;
      return html`<div
        class="island-backdrop ${dimmed ? 'dimmed' : ''}"
        style="left:${(cx * 100).toFixed(2)}%; top:${(cy * 100).toFixed(2)}%; width:${(diameter * 100).toFixed(2)}%;"
      >
        <span class="island-label">${island.title}</span>
      </div>`;
    });

    const freeSeats = screens
      .filter((s) => !occupied.has(s.seatId))
      .map((s) => {
        const seat = allSeats.find((x) => x.id === s.seatId);
        if (!seat) {
          return html``;
        }
        return html`<div
          class="node ${reduced ? 'reduced' : ''} ${s.islandId !== currentIslandId ? 'dimmed' : ''}"
          style="left:${(s.x * 100).toFixed(2)}%; top:${(s.y * 100).toFixed(2)}%;"
        >
          <sac-seat-button
            .seat=${seat}
            ?reducedMotion=${reduced}
            .onSelect=${(id: string) => controller.selectSeat(id)}
          ></sac-seat-button>
        </div>`;
      });

    const dots = repeat(
      Object.values(participants),
      (p) => p.id,
      (p) => {
        const sp = byId.get(p.seatId);
        if (!sp) {
          return html``;
        }
        const dimmed = p.islandId !== currentIslandId;
        const dot = html`<sac-participant-dot
          .participant=${p}
          ?reducedMotion=${reduced}
        ></sac-participant-dot>`;
        return html`<div
          class="node ${reduced ? 'reduced' : ''} ${dimmed ? 'dimmed' : ''}"
          style="left:${(sp.x * 100).toFixed(2)}%; top:${(sp.y * 100).toFixed(2)}%;"
        >
          ${p.isLocal
            ? dot
            : html`<button
                class="dotbtn"
                aria-label=${`Zu ${p.displayName} setzen`}
                @click=${() => controller.sitNextToParticipant(p.id)}
              >
                ${dot}
              </button>`}
        </div>`;
      },
    );

    return html`
      <div
        class="stage"
        style="--stage-aspect:${STAGE_ASPECT};"
        role="group"
        aria-label="Begegnungsraum mit mehreren Gespraechsinseln"
      >
        ${backdrops} ${freeSeats} ${dots}
      </div>
      <p class="hint">
        Klicke auf einen freien Stuhl, um dich dorthin zu setzen - auch an einem anderen Tisch.
        Stimmen aus der Naehe sind lauter, weiter entfernte leiser.
      </p>
    `;
  }
}

customElements.define('sac-world-canvas', WorldCanvas);