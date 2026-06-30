// Besitzt den AudioContext und den Master-Ausgang.
// Der Context wird aus Autoplay-Gruenden erst nach einer Nutzergeste entsperrt.
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambient: GainNode | null = null;

  get isUnlocked(): boolean {
    return this.ctx !== null;
  }

  get context(): AudioContext {
    if (!this.ctx) {
      throw new Error('AudioEngine nicht entsperrt. Erst unlock() nach Nutzergeste aufrufen.');
    }
    return this.ctx;
  }

  get masterGain(): GainNode {
    if (!this.master) {
      throw new Error('AudioEngine nicht entsperrt.');
    }
    return this.master;
  }

  // Separate Schiene fuer Ambiente/Gemurmel: geht direkt zum Ausgang und wird
  // NICHT vom Stimmen-Limiter gedaempft (sonst verstummt das Ambiente, sobald
  // jemand spricht).
  get ambientGain(): GainNode {
    if (!this.ambient) {
      throw new Error('AudioEngine nicht entsperrt.');
    }
    return this.ambient;
  }

  async unlock(): Promise<void> {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      return;
    }
    const Ctor: typeof AudioContext =
      window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctor();
    // Watchdog: faellt der Context (z.B. nach Fokuswechsel oder Autoplay-Policy)
    // in 'suspended', sofort wieder aufnehmen - sonst verstummt alles nach kurzer Zeit.
    this.ctx.onstatechange = (): void => {
      if (this.ctx && this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
    };
    this.master = this.ctx.createGain();
    this.master.gain.value = 1;
    // Master-Limiter: faengt Spitzen ab, wenn leise Stimmen angehoben werden,
    // damit das Auto-Leveling nicht uebersteuert.
    const limiter = this.ctx.createDynamicsCompressor();
    limiter.threshold.value = -6;
    limiter.knee.value = 6;
    limiter.ratio.value = 12;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.25;
    this.master.connect(limiter);
    limiter.connect(this.ctx.destination);
    // Ambiente-Schiene parallel zum Limiter, direkt zum Ausgang.
    this.ambient = this.ctx.createGain();
    this.ambient.gain.value = 1;
    this.ambient.connect(this.ctx.destination);
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  setMasterVolume(value: number): void {
    if (this.master) {
      this.master.gain.value = Math.max(0, Math.min(1, value));
    }
  }
}