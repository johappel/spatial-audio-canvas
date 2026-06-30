// Erzeugtes, dezentes Hintergrund-Klangbett (ohne Audiodatei).
// Gefiltertes braunes Rauschen als ruhige Atmosphaere, regelbar ueber die
// Lautstaerke. Bewusst leise gehalten - die Stimmen bleiben wichtiger.
import type { AudioEngine } from './AudioEngine';

function makeBrownNoise(ctx: AudioContext, seconds = 3): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < length; i += 1) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.5;
  }
  return buffer;
}

const MAX_GAIN = 0.35;

export class AmbientBed {
  private readonly source: AudioBufferSourceNode;
  private readonly gain: GainNode;
  // Filter-Referenz festhalten (sonst GC-bedingte Stille nach ~1 Sekunde).
  private readonly nodes: AudioNode[] = [];

  constructor(engine: AudioEngine, volume: number) {
    const ctx = engine.context;
    this.source = ctx.createBufferSource();
    this.source.buffer = makeBrownNoise(ctx);
    this.source.loop = true;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 520;

    this.gain = ctx.createGain();
    this.gain.gain.value = this.clamp(volume);

    this.source.connect(lowpass);
    lowpass.connect(this.gain);
    this.gain.connect(engine.ambientGain);
    this.source.start();
    this.nodes.push(lowpass);
  }

  private clamp(volume: number): number {
    return Math.max(0, Math.min(1, volume)) * MAX_GAIN;
  }

  setVolume(volume: number): void {
    this.gain.gain.value = this.clamp(volume);
  }

  dispose(): void {
    try {
      this.source.stop();
    } catch {
      // bereits gestoppt
    }
    this.gain.disconnect();
  }
}