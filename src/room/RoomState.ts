// Lese-Hilfen rund um die Raumkonfiguration.
import type { ConversationIsland, RoomConfig, Seat } from '../types';

export function findIsland(config: RoomConfig, islandId: string): ConversationIsland | undefined {
  return config.islands.find((island) => island.id === islandId);
}

export function allSeats(config: RoomConfig): Seat[] {
  return config.islands.flatMap((island) => island.seats);
}

export function findSeat(config: RoomConfig, seatId: string): Seat | undefined {
  return allSeats(config).find((seat) => seat.id === seatId);
}

export function freeSeats(island: ConversationIsland, occupied: Record<string, string>): Seat[] {
  return island.seats.filter((seat) => !occupied[seat.id]);
}