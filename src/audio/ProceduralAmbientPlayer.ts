// Prozedurales Hintergrund-Klangbett pro Insel (ohne Audiodatei).
// Erfuellt den MediaPlayback-Vertrag, damit es ueber die MediaSourceRegistry
// wie eine normale Klangquelle behandelt werden kann. Das Preset wird aus
// AmbientSource.src abgeleitet. Bewusst leise - die Stimmen bleiben wichtiger.
import type { AmbientSource } from '../types';
import type { MediaPlayback } from '../media/MediaSource';

function makeNoise(ctx: AudioContext, seconds = 4): AudioBuffer {
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

interface Preset {
  lowpass: number;
  highpass: number;
  scale: number;
}

function presetFor(src: string): Preset {
  switch (src) {
    case 'cafe-room':
      return { lowpass: 900, highpass: 120, scale: 0.5 };
    case 'window-air':
      return { lowpass: 4200, highpass: 700, scale: 0.4 };
    default:
      return { lowpass: 1000, highpass: 80, scale: 0.45 };
  }
}

// Gesamtdeckel, damit prozedurales Ambiente nie dominanter wird als Stimmen.
const MASTER_SCALE = 0.3;

export class ProceduralAmbientPlayer implements MediaPlayback {
  private readonly source: AudioBufferSourceNode;
  private readonly gain: GainNode;
  private readonly preset: Preset;
  private volume: number;
  private started = false;
  private playing = false;

  constructor(
    private readonly ctx: AudioContext,
    destination: AudioNode,
    source: AmbientSource,
  ) {
    this.preset = presetFor(source.src);
    this.volume = source.defaultVolume;

    this.source = ctx.createBufferSource();
    this.source.buffer = makeNoise(ctx);
    this.source.loop = true;

    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = this.preset.highpass;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = this.preset.lowpass;

    this.gain = ctx.createGain();
    this.gain.gain.value = 0;

    this.source.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(this.gain);
    this.gain.connect(destination);
  }

  private targetGain(): number {
    return Math.max(0, Math.min(1, this.volume)) * this.preset.scale * MASTER_SCALE;
  }

  play(): void {
    if (!this.started) {
      this.source.start();
      this.started = true;
    }
    this.playing = true;
    this.gain.gain.setTargetAtTime(this.targetGain(), this.ctx.currentTime, 0.3);
  }

  stop(): void {
    this.playing = false;
    this.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.3);
  }

  setVolume(value: number): void {
    this.volume = value;
    if (this.playing) {
      this.gain.gain.setTargetAtTime(this.targetGain(), this.ctx.currentTime, 0.2);
    }
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