import { LitElement, html, css } from 'lit';
import { StoreController } from '@nanostores/lit';
import {
  $currentIslandId,
  $localParticipantId,
  $participants,
  $reducedMotion,
  $roomConfig,
} from '../core/Store';
import { computeEgoViews } from '../room/EgoPerspective';
import { findIsland } from '../room/RoomState';
import { getAppController } from '../app/AppController';
import type { Participant } from '../types';
import './SeatButton';

export class IslandView extends LitElement {
  private cfg = new StoreController(this, $roomConfig);
  private islandId = new StoreController(this, $currentIslandId);
  private localId = new StoreController(this, $localParticipantId);
  private participants = new StoreController(this, $participants);
  private reduced = new StoreController(this, $reducedMotion);

  static styles = css`
    .title {
      text-align: center;
      margin: 0 0 var(--sac-space-3);
    }
    .island {
      position: relative;
      width: min(70vmin, 520px);
      aspect-ratio: 1 / 1;
      margin: 0 auto;
      border-radius: 50%;
      background: radial-gradient(circle at 50% 45%, var(--sac-color-surface), transparent 72%);
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
    const island = findIsland(config, this.islandId.value);
    if (!island) {
      return html`<p>Keine Insel gefunden.</p>`;
    }
    const local = this.participants.value[this.localId.value];
    const localSeatId = local?.seatId ?? island.seats[0]?.id ?? '';
    const views = computeEgoViews(island.seats, localSeatId);
    const seatById = new Map(island.seats.map((seat) => [seat.id, seat]));
    const bySeat = new Map<string, Participant>();
    Object.values(this.participants.value).forEach((participant) => {
      if (participant.islandId === island.id) {
        bySeat.set(participant.seatId, participant);
      }
    });
    const controller = getAppController();

    return html`
      <h2 class="title">${island.title}</h2>
      <div class="island" role="group" aria-label=${`Sitzordnung der Insel ${island.title}`}>
        ${views.map((view) => {
          const seat = seatById.get(view.seatId);
          if (!seat) {
            return html``;
          }
          const occupant = bySeat.get(view.seatId);
          const left = 50 + view.screenX * 42;
          const top = 85 - view.screenY * 77;
          return html`<sac-seat-button
            style=${`position:absolute; left:${left}%; top:${top}%; transform:translate(-50%,-50%);`}
            .seat=${seat}
            .occupant=${occupant}
            ?isSelf=${view.isSelf}
            direction=${view.direction}
            ?reducedMotion=${this.reduced.value}
            .onSelect=${(id: string) => controller.selectSeat(id)}
          ></sac-seat-button>`;
        })}
      </div>
      <p class="hint">Links sitzt links, rechts sitzt rechts, gegenueber ist oben.</p>
    `;
  }
}

customElements.define('sac-island-view', IslandView);