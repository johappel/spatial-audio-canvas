import { describe, expect, it } from 'vitest';
import { computeScreenSeats, spatialFor } from '../src/room/WorldLayout';
import type { RoomConfig } from '../src/types';

const config: RoomConfig = {
  id: 'r',
  title: 'r',
  defaultIslandId: 'a',
  islands: [
    {
      id: 'a',
      title: 'A',
      type: 'round_table',
      maxParticipants: 2,
      centerX: -1,
      centerY: 0,
      seats: [
        { id: 'a0', islandId: 'a', label: 'a0', angleDeg: 0, radius: 1, x: 0, z: 1 },
        { id: 'a1', islandId: 'a', label: 'a1', angleDeg: 180, radius: 1, x: 0, z: -1 },
      ],
    },
    {
      id: 'b',
      title: 'B',
      type: 'cafe_table',
      maxParticipants: 2,
      centerX: 1,
      centerY: 0,
      seats: [
        { id: 'b0', islandId: 'b', label: 'b0', angleDeg: 0, radius: 1, x: 0, z: 1 },
        { id: 'b1', islandId: 'b', label: 'b1', angleDeg: 180, radius: 1, x: 0, z: -1 },
      ],
    },
  ],
};

describe('computeScreenSeats', () => {
  it('liefert fuer alle Sitze Positionen im Bereich 0..1', () => {
    const seats = computeScreenSeats(config, 'a0');
    expect(seats).toHaveLength(4);
    for (const s of seats) {
      expect(s.x).toBeGreaterThanOrEqual(0);
      expect(s.x).toBeLessThanOrEqual(1);
      expect(s.y).toBeGreaterThanOrEqual(0);
      expect(s.y).toBeLessThanOrEqual(1);
    }
  });

  it('markiert den eigenen Sitz', () => {
    const seats = computeScreenSeats(config, 'a0');
    expect(seats.find((s) => s.seatId === 'a0')?.isSelf).toBe(true);
    expect(seats.find((s) => s.seatId === 'b0')?.isSelf).toBe(false);
  });

  it('legt Insel A links und Insel B rechts an', () => {
    const seats = computeScreenSeats(config, 'a0');
    const a = seats.find((s) => s.seatId === 'a0')!;
    const b = seats.find((s) => s.seatId === 'b0')!;
    expect(a.x).toBeLessThan(b.x);
  });
});

describe('spatialFor', () => {
  it('gibt am eigenen Platz Pan 0 und volle Lautstaerke', () => {
    const r = spatialFor({ x: 0.5, y: 0.5 }, { x: 0.5, y: 0.5 });
    expect(r.pan).toBeCloseTo(0);
    expect(r.gain).toBeCloseTo(1);
  });

  it('pant nach rechts fuer Quellen weiter rechts', () => {
    const r = spatialFor({ x: 0.3, y: 0.5 }, { x: 0.7, y: 0.5 });
    expect(r.pan).toBeGreaterThan(0);
  });

  it('macht weiter entfernte Quellen leiser', () => {
    const near = spatialFor({ x: 0.5, y: 0.5 }, { x: 0.55, y: 0.5 }).gain;
    const far = spatialFor({ x: 0.5, y: 0.5 }, { x: 0.95, y: 0.5 }).gain;
    expect(far).toBeLessThan(near);
  });
});