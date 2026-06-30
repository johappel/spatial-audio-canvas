// Gemeinsamer Welt-Koordinatenraum fuer ALLE Inseln.
// Statt getrennter "Kanaele" liegen alle Inseln in einer Landschaft. Daraus
// werden Bildschirmpositionen (stabile Karte) und egozentrische Audiowerte
// (Pan/Gain relativ zum eigenen Sitz) berechnet - Bild und Klang passen so
// zusammen, und Nachbarinseln werden allein durch Distanz leiser.
import type { RoomConfig } from '../types';

const ISLAND_SPACING = 3.2; // Abstand der Inselzentren
const SEAT_RADIUS = 0.9; // Radius der Sitze um das Inselzentrum
const PADDING = 0.14; // Rand im Canvas (Anteil)

// Seitenverhaeltnis der Buehne (Breite/Hoehe). Der Canvas nutzt denselben Wert,
// damit Kreise rund bleiben und Distanzen stimmen.
export const STAGE_ASPECT = 16 / 9;

export interface WorldSeat {
  seatId: string;
  islandId: string;
  worldX: number;
  worldY: number;
}

export interface ScreenSeat {
  seatId: string;
  islandId: string;
  x: number; // 0..1 ueber die Breite
  y: number; // 0..1 ueber die Hoehe
  isSelf: boolean;
}

export function computeWorldSeats(config: RoomConfig): WorldSeat[] {
  const out: WorldSeat[] = [];
  for (const island of config.islands) {
    for (const seat of island.seats) {
      out.push({
        seatId: seat.id,
        islandId: island.id,
        worldX: island.centerX * ISLAND_SPACING + seat.x * SEAT_RADIUS,
        worldY: island.centerY * ISLAND_SPACING + seat.z * SEAT_RADIUS,
      });
    }
  }
  return out;
}

export function computeScreenSeats(
  config: RoomConfig,
  localSeatId: string,
  aspect: number = STAGE_ASPECT,
): ScreenSeat[] {
  const world = computeWorldSeats(config);
  if (world.length === 0) {
    return [];
  }
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const w of world) {
    minX = Math.min(minX, w.worldX);
    maxX = Math.max(maxX, w.worldX);
    minY = Math.min(minY, w.worldY);
    maxY = Math.max(maxY, w.worldY);
  }
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;
  // Einheitlicher Pixel-Massstab (Buehne hat Breite = aspect, Hoehe = 1).
  const scale = Math.min(aspect / spanX, 1 / spanY) * (1 - 2 * PADDING);
  const contentW = spanX * scale;
  const contentH = spanY * scale;
  const offX = (aspect - contentW) / 2;
  const offY = (1 - contentH) / 2;
  return world.map((w) => ({
    seatId: w.seatId,
    islandId: w.islandId,
    x: (offX + (w.worldX - minX) * scale) / aspect,
    y: offY + (w.worldY - minY) * scale,
    isSelf: w.seatId === localSeatId,
  }));
}

export interface SpatialResult {
  pan: number;
  gain: number;
}

// Egozentrische Audiowerte aus den Bildschirmpositionen.
export function spatialFor(
  local: { x: number; y: number },
  source: { x: number; y: number },
  aspect: number = STAGE_ASPECT,
): SpatialResult {
  const pan = Math.max(-0.65, Math.min(0.65, (source.x - local.x) * 1.5));
  const dx = (source.x - local.x) * aspect;
  const dy = source.y - local.y;
  const distance = Math.hypot(dx, dy);
  const gain = Math.max(0.06, 1 - distance * 1.2);
  return { pan, gain };
}