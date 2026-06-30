// Misst den Sprachpegel einer Quelle und glaettet ihn, um Flackern zu vermeiden.
export const LEVEL_SMOOTHING = 0.9;
export const SPEAKING_THRESHOLD = 0.02;

export function smoothLevel(previous: number, current: number, smoothing = LEVEL_SMOOTHING): number {
  return previous * smoothing + current * (1 - smoothing);
}

export class VoiceLevelAnalyser {
  private readonly analyser: AnalyserNode;
  private readonly buffer: Float32Array<ArrayBuffer>;
  private smoothed = 0;
  private raf = 0;

  constructor(
    ctx: AudioContext,
    source: AudioNode,
    private readonly threshold = SPEAKING_THRESHOLD,
  ) {
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 1024;
    this.buffer = new Float32Array(this.analyser.fftSize);
    source.connect(this.analyser);
  }

  get level(): number {
    return this.smoothed;
  }

  get isSpeaking(): boolean {
    return this.smoothed > this.threshold;
  }

  measure(): number {
    this.analyser.getFloatTimeDomainData(this.buffer);
    let sum = 0;
    for (let i = 0; i < this.buffer.length; i += 1) {
      sum += this.buffer[i] * this.buffer[i];
    }
    const rms = Math.sqrt(sum / this.buffer.length);
    this.smoothed = smoothLevel(this.smoothed, rms);
    return this.smoothed;
  }

  start(onUpdate: (level: number, speaking: boolean) => void): void {
    const tick = (): void => {
      const level = this.measure();
      onUpdate(level, this.isSpeaking);
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  stop(): void {
    if (this.raf) {
      cancelAnimationFrame(this.raf);
    }
    this.raf = 0;
  }

  dispose(): void {
    this.stop();
    this.analyser.disconnect();
  }
}