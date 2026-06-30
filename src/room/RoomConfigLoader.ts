// Laedt eine Raumkonfiguration als JSON (respektiert den gh-pages base-Pfad).
import type { RoomConfig } from '../types';

export async function loadRoomConfig(roomId: string): Promise<RoomConfig> {
  const base = import.meta.env.BASE_URL ?? '/';
  const url = `${base}rooms/${roomId}.json`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Raumkonfiguration nicht ladbar: ${url} (${response.status})`);
  }
  return (await response.json()) as RoomConfig;
}