// Besitzt den AudioContext und den Master-Ausgang.
// Der Context wird aus Autoplay-Gruenden erst nach einer Nutzergeste entsperrt.
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;

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