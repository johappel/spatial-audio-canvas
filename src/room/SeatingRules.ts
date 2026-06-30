// Regeln fuer die Platzvergabe und das Aufloesen von Konflikten.
import type { ConversationIsland, Seat } from '../types';

export function isSeatFree(seatId: string, occupied: Record<string, string>): boolean {
  return !occupied[seatId];
}

export interface ClaimResult {
  ok: boolean;
  occupied: Record<string, string>;
  reason?: string;
}

export function claimSeat(
  occupied: Record<string, string>,
  seatId: string,
  participantId: string,
): ClaimResult {
  const current = occupied[seatId];
  if (current && current !== participantId) {
    return { ok: false, occupied, reason: 'Platz ist bereits belegt.' };
  }
  const next = { ...occupied };
  // Bisherigen Platz der Person freigeben.
  for (const [sid, pid] of Object.entries(next)) {
    if (pid === participantId) {
      delete next[sid];
    }
  }
  next[seatId] = participantId;
  return { ok: true, occupied: next };
}

export function firstFreeSeat(
  island: ConversationIsland,
  occupied: Record<string, string>,
): Seat | undefined {
  return island.seats.find((seat) => isSeatFree(seat.id, occupied));
}

export function seatNextTo(
  island: ConversationIsland,
  targetSeatId: string,
  occupied: Record<string, string>,
): Seat | undefined {
  const index = island.seats.findIndex((seat) => seat.id === targetSeatId);
  if (index < 0) {
    return firstFreeSeat(island, occupied);
  }
  const count = island.seats.length;
  for (let step = 1; step <= count; step += 1) {
    const candidates = [
      island.seats[(index + step) % count],
      island.seats[(index - step + count) % count],
    ];
    for (const candidate of candidates) {
      if (candidate && isSeatFree(candidate.id, occupied)) {
        return candidate;
      }
    }
  }
  return undefined;
}