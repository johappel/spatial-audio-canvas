// Berechnet Sitzplaetze kreisfoermig um die Inselmitte.
// Reine Geometrie, daher gut testbar.

export interface SeatPosition {
  index: number;
  angleDeg: number;
  // x: links/rechts, z: vorne/hinten (Inselkoordinaten)
  x: number;
  z: number;
}

export function computeSeatPositions(count: number, radius = 1): SeatPosition[] {
  if (count <= 0) {
    return [];
  }
  const positions: SeatPosition[] = [];
  for (let i = 0; i < count; i += 1) {
    const angleDeg = (360 / count) * i;
    const rad = (angleDeg * Math.PI) / 180;
    positions.push({
      index: i,
      angleDeg,
      x: Math.sin(rad) * radius,
      z: Math.cos(rad) * radius,
    });
  }
  return positions;
}