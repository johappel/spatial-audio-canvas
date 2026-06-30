// Reaktiver App-Zustand auf Basis von nanostores (winzig, ohne Telemetrie).
import { atom, map } from 'nanostores';
import type { Participant, RoomConfig } from '../types';

export type AppView = 'join' | 'permission' | 'canvas';

export const $view = atom<AppView>('join');
export const $roomConfig = atom<RoomConfig | null>(null);
export const $localParticipantId = atom<string>('');
export const $currentIslandId = atom<string>('');
export const $participants = map<Record<string, Participant>>({});
export const $micEnabled = atom<boolean>(false);
export const $ambientVolume = atom<number>(0.2);
// Tuscheln (Phase G): aktueller Partner und eingehende Einladung.
export const $whisperPartnerId = atom<string | null>(null);
export const $whisperInvite = atom<{ fromId: string; fromName: string } | null>(null);
export const $reducedMotion = atom<boolean>(
  typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true,
);

export function upsertParticipant(participant: Participant): void {
  $participants.setKey(participant.id, participant);
}

export function removeParticipant(id: string): void {
  const next = { ...$participants.get() };
  delete next[id];
  $participants.set(next);
}

export function getLocalParticipant(): Participant | undefined {
  return $participants.get()[$localParticipantId.get()];
}

export function participantsInIsland(islandId: string): Participant[] {
  return Object.values($participants.get()).filter((p) => p.islandId === islandId);
}