// Simulierte Stimme fuer die lokale Audio-Demo (ohne WebRTC).
// Erzeugt grob stimmhaftes, bandpassgefiltertes Rauschen, das ueber den
// VoiceSpatializer raeumlich positioniert wird. Ein VoiceLevelAnalyser liefert
// echte Pegel, sodass der zugehoerige Punkt realistisch pulsiert.
import type { AudioEngine } from './AudioEngine';
import { VoiceSpatializer } from './VoiceSpatializer';
import { VoiceLevelAnalyser } from './VoiceLevelAnalyser';

export function createVoiceishBuffer(ctx: AudioContext, seconds = 2): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) {
    const t = i / ctx.sampleRate;
    const modulation = 0.5 + 0.5 * Math.sin(2 * Math.PI * 4 * t);
    data[i] = (Math.random() * 2 - 1) * modulation * 0.7;
  }
  return buffer;
}

export class SimulatedVoice {
  private readonly ctx: AudioContext;
  private readonly source: AudioBufferSourceNode;
  private readonly filter: BiquadFilterNode;
  private readonly gate: GainNode;
  private readonly spatializer: VoiceSpatializer;
  private readonly analyser: VoiceLevelAnalyser;

  constructor(engine: AudioEngine, buffer: AudioBuffer) {
    this.ctx = engine.context;
    this.source = this.ctx.createBufferSource();
    this.source.buffer = buffer;
    this.source.loop = true;

    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = 'bandpass';
    this.filter.frequency.value = 900;
    this.filter.Q.value = 0.7;

    this.gate = this.ctx.createGain();
    this.gate.gain.value = 0;

    this.source.connect(this.filter);
    this.filter.connect(this.gate);

    this.spatializer = new VoiceSpatializer(this.ctx, this.gate, engine.masterGain);
    this.analyser = new VoiceLevelAnalyser(this.ctx, this.gate);
    this.source.start();
  }

  setPan(relativeX: number): void {
    this.spatializer.setPan(relativeX);
  }

  setDistance(distance: number): void {
    this.spatializer.setGain(distance, true);
  }

  setGainValue(value: number): void {
    this.spatializer.setGainValue(value);
  }

  measureLevel(): number {
    return this.analyser.measure();
  }

  speak(durationMs = 1800): void {
    const now = this.ctx.currentTime;
    const gain = this.gate.gain;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(Math.max(0.0001, gain.value), now);
    gain.linearRampToValueAtTime(0.8, now + 0.12);
    gain.linearRampToValueAtTime(0.0001, now + durationMs / 1000);
  }

  dispose(): void {
    try {
      this.source.stop();
    } catch {
      // bereits gestoppt
    }
    this.spatializer.dispose();
    this.analyser.dispose();
  }
}