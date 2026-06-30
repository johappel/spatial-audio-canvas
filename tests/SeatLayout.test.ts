import { describe, expect, it } from 'vitest';
import { computeSeatPositions } from '../src/room/SeatLayout';

describe('computeSeatPositions', () => {
  it('verteilt vier Plaetze gleichmaessig auf dem Kreis', () => {
    const positions = computeSeatPositions(4, 1);
    expect(positions).toHaveLength(4);
    expect(positions[0].x).toBeCloseTo(0);
    expect(positions[0].z).toBeCloseTo(1);
    expect(positions[1].x).toBeCloseTo(1);
    expect(positions[1].z).toBeCloseTo(0);
    expect(positions[2].x).toBeCloseTo(0);
    expect(positions[2].z).toBeCloseTo(-1);
    expect(positions[3].x).toBeCloseTo(-1);
    expect(positions[3].z).toBeCloseTo(0);
  });

  it('liefert ein leeres Array bei count <= 0', () => {
    expect(computeSeatPositions(0)).toEqual([]);
  });
});