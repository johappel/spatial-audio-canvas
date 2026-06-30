// Gleicht unterschiedliche Eingangslautstaerken aus (Auto-Leveling):
// laute Sprecher werden leiser, leise Sprecher lauter. Rein hoererseitig,
// pro Stimme ueber ein langsam nachgefuehrtes Lautheits-Mittel. Nur waehrend
// aktiven Sprechens wird nachgefuehrt, damit Rauschen/Stille nicht hochkommt.

export interface VoiceNormalizerOptions {
  target?: number; // Ziel-Lautheit (RMS), auf die normalisiert wird
  minGain?: number; // staerkste Daempfung fuer die lautesten Stimmen
  maxGain?: number; // staerkste Anhebung fuer die leisesten Stimmen
  attack?: number; // Nachfuehr-Glaettung (0..1, kleiner = traeger, weniger Pumpen)
}

export class VoiceNormalizer {
  private readonly target: number;
  private readonly minGain: number;
  private readonly maxGain: number;
  private readonly attack: number;
  private readonly loudness = new Map<string, number>();

  constructor(opts: VoiceNormalizerOptions = {}) {
    this.target = opts.target ?? 0.08;
    this.minGain = opts.minGain ?? 0.5;
    this.maxGain = opts.maxGain ?? 2.4;
    this.attack = opts.attack ?? 0.03;
  }

  // Fuehrt das Lautheits-Mittel nur bei aktivem Sprechen nach und liefert den
  // aktuellen Ausgleichsfaktor zurueck.
  update(id: string, level: number, speaking: boolean): number {
    if (speaking && level > 0.005) {
      const prev = this.loudness.get(id) ?? level;
      this.loudness.set(id, prev * (1 - this.attack) + level * this.attack);
    }
    return this.gainFor(id);
  }

  // Aktueller Ausgleichsfaktor ohne Nachfuehren (1 bei noch unbekannter Stimme).
  gainFor(id: string): number {
    const l = this.loudness.get(id);
    if (!l || l < 1e-4) {
      return 1;
    }
    return Math.max(this.minGain, Math.min(this.maxGain, this.target / l));
  }

  remove(id: string): void {
    this.loudness.delete(id);
  }
}