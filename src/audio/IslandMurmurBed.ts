// Synthetisches Stimmengewirr ("Gemurmel") fuer eine ENTFERNTE Gespraechsinsel.
// Erzeugt aus gefiltertem Rauschen einen stimmhaften Klangteppich, dessen
// Lautstaerke aus der Aktivitaet der Insel (Belegung + Sprechen) abgeleitet
// wird. So entsteht ein Gefuehl von Anwesenheit, ohne echte Audiospuren der
// anderen Insel zu uebertragen (loest Bandbreite und Cocktailparty zugleich).
import type { AudioEngine } from './AudioEngine';

function makeNoise(ctx: AudioContext, seconds = 4): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

// Obergrenze, damit das Gemurmel nie die eigenen Stimmen ueberdeckt.
const MAX_GAIN = 0.25;

export class IslandMurmurBed {
  private readonly ctx: AudioContext;
  private readonly source: AudioBufferSourceNode;
  private readonly gain: GainNode;
  private readonly panner: StereoPannerNode;

  constructor(engine: AudioEngine) {
    this.ctx = engine.context;
    const ctx = this.ctx;

    this.source = ctx.createBufferSource();
    this.source.buffer = makeNoise(ctx);
    this.source.loop = true;

    // Bandpass im Sprachbereich macht das Rauschen "stimmhafter" als reines
    // Hintergrundrauschen, bleibt aber bewusst diffus.
    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 620;
    bandpass.Q.value = 0.8;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 2600;

    this.gain = ctx.createGain();
    this.gain.gain.value = 0;

    this.panner = ctx.createStereoPanner();
    this.panner.pan.value = 0;

    this.source.connect(bandpass);
    bandpass.connect(lowpass);
    lowpass.connect(this.gain);
    this.gain.connect(this.panner);
    this.panner.connect(engine.masterGain);
    this.source.start();
  }

  setPan(value: number): void {
    this.panner.pan.value = Math.max(-0.85, Math.min(0.85, value));
  }

  // Setzt die Ziel-Lautstaerke (0..1, intern auf MAX_GAIN begrenzt) und gleitet
  // weich dorthin, damit nichts klickt oder pumpt.
  setActivity(level: number): void {
    const target = Math.max(0, Math.min(1, level)) * MAX_GAIN;
    this.gain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.4);
  }

  dispose(): void {
    try {
      this.source.stop();
    } catch {
      // bereits gestoppt
    }
    this.gain.disconnect();
    this.panner.disconnect();
  }
}