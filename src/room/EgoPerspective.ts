// Stellt die Sitzordnung egozentrisch dar: der eigene Platz liegt unten,
// gegenueberliegende Personen oben, links bleibt links, rechts bleibt rechts.
// Wichtig: relativeX wird sowohl fuer die Anzeige als auch fuer das Audio-Pan
// genutzt, damit Bild und Klang zusammenpassen.
import type { Seat } from '../types';

export type RelativeDirection = 'self' | 'left' | 'right' | 'across';

export interface EgoSeatView {
  seatId: string;
  isSelf: boolean;
  // Bildschirmkoordinaten: x in [-1,1] (links..rechts), y in [0,1] (vorne/unten..hinten/oben)
  screenX: number;
  screenY: number;
  // Fuer Audio-Pan: identisch zu screenX, damit Bild und Klang uebereinstimmen.
  relativeX: number;
  // Grobe Distanz 0..1 (eigener Platz 0, gegenueber am groessten).
  relativeDistance: number;
  direction: RelativeDirection;
}

const ACROSS_X_THRESHOLD = 0.34;

export function computeEgoViews(seats: Seat[], localSeatId: string): EgoSeatView[] {
  const local = seats.find((s) => s.id === localSeatId);
  const thetaLocal = local ? local.angleDeg : 0;

  return seats.map((seat) => {
    // Insel so drehen, dass der eigene Platz unten (Winkel 180) liegt.
    const aDeg = seat.angleDeg + 180 - thetaLocal;
    const a = (aDeg * Math.PI) / 180;
    const x = Math.sin(a);
    const z = Math.cos(a);
    const isSelf = seat.id === localSeatId;

    let direction: RelativeDirection;
    if (isSelf) {
      direction = 'self';
    } else if (Math.abs(x) < ACROSS_X_THRESHOLD && z > 0) {
      direction = 'across';
    } else if (x < 0) {
      direction = 'left';
    } else {
      direction = 'right';
    }

    return {
      seatId: seat.id,
      isSelf,
      screenX: x,
      screenY: (z + 1) / 2,
      relativeX: x,
      relativeDistance: isSelf ? 0 : Math.min(1, Math.hypot(x, z + 1) / 2),
      direction,
    };
  });
}