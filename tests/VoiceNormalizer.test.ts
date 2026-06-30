import { describe, it, expect } from 'vitest';
import { VoiceNormalizer } from '../src/audio/VoiceNormalizer';

describe('VoiceNormalizer', () => {
  it('liefert 1 fuer unbekannte Stimmen', () => {
    const n = new VoiceNormalizer();
    expect(n.gainFor('x')).toBe(1);
  });

  it('daempft laute Stimmen unter 1', () => {
    const n = new VoiceNormalizer({ attack: 1 });
    expect(n.update('loud', 0.5, true)).toBeLessThan(1);
  });

  it('hebt leise Stimmen ueber 1 an', () => {
    const n = new VoiceNormalizer({ attack: 1 });
    expect(n.update('quiet', 0.02, true)).toBeGreaterThan(1);
  });

  it('fuehrt nur bei aktivem Sprechen nach', () => {
    const n = new VoiceNormalizer({ attack: 1 });
    n.update('idle', 0.5, false);
    expect(n.gainFor('idle')).toBe(1);
  });

  it('bleibt innerhalb der Grenzen', () => {
    const n = new VoiceNormalizer({ attack: 1, minGain: 0.5, maxGain: 2.4 });
    expect(n.update('vloud', 5, true)).toBeGreaterThanOrEqual(0.5);
    expect(n.update('vquiet', 0.006, true)).toBeLessThanOrEqual(2.4);
  });
});