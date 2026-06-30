import { describe, expect, it } from 'vitest';
import { computeEgoViews } from '../src/room/EgoPerspective';
import type { Seat } from '../src/types';

function seat(id: string, angleDeg: number): Seat {
  return { id, islandId: 'i', label: id, angleDeg, radius: 1, x: 0, z: 0 };
}

describe('computeEgoViews', () => {
  const seats = [seat('a', 0), seat('b', 90), seat('c', 180), seat('d', 270)];

  it('markiert den eigenen Platz als self', () => {
    const views = computeEgoViews(seats, 'a');
    const self = views.find((v) => v.seatId === 'a');
    expect(self?.direction).toBe('self');
    expect(self?.isSelf).toBe(true);
  });

  it('ordnet links, rechts und gegenueber korrekt zu', () => {
    const views = computeEgoViews(seats, 'a');
    const byId = new Map(views.map((v) => [v.seatId, v]));
    expect(byId.get('b')?.direction).toBe('left');
    expect(byId.get('d')?.direction).toBe('right');
    expect(byId.get('c')?.direction).toBe('across');
    expect(byId.get('b')?.relativeX).toBeLessThan(0);
    expect(byId.get('d')?.relativeX).toBeGreaterThan(0);
  });

  it('aendert die Perspektive beim Platzwechsel', () => {
    const views = computeEgoViews(seats, 'b');
    const self = views.find((v) => v.seatId === 'b');
    expect(self?.direction).toBe('self');
  });
});