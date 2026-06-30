import { describe, expect, it } from 'vitest';
import { computeGain, computePan } from '../src/audio/VoiceSpatializer';
import { smoothLevel } from '../src/audio/VoiceLevelAnalyser';

describe('computePan', () => {
  it('begrenzt den Pan-Wert auf +/- 0.65', () => {
    expect(computePan(0)).toBe(0);
    expect(computePan(2)).toBeCloseTo(0.65);
    expect(computePan(-2)).toBeCloseTo(-0.65);
  });
});

describe('computeGain', () => {
  it('daempft andere Inseln stark', () => {
    expect(computeGain(0, false)).toBeCloseTo(0.08);
  });

  it('faellt mit der Distanz, aber nicht unter 0.25', () => {
    expect(computeGain(0, true)).toBeCloseTo(1);
    expect(computeGain(10, true)).toBeCloseTo(0.25);
  });
});

describe('smoothLevel', () => {
  it('mischt vorherigen und aktuellen Pegel (0.8/0.2)', () => {
    expect(smoothLevel(0, 1, 0.8)).toBeCloseTo(0.2);
    expect(smoothLevel(1, 1)).toBeCloseTo(1);
  });
});