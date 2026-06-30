// Positioniert eine Stimme im Stereobild (Phase-1-Modell: StereoPanner + Gain).
// Die reinen Funktionen sind separat exportiert und damit gut testbar.

export function computePan(relativeX: number): number {
  return Math.max(-0.65, Math.min(0.65, relativeX));
}

export function computeGain(distance: number, sameIsland: boolean): number {
  if (!sameIsland) {
    return 0.08;
  }
  return Math.max(0.25, 1 - distance * 0.25);
}

export class VoiceSpatializer {
  private readonly gain: GainNode;
  private readonly panner: StereoPannerNode;

  constructor(ctx: AudioContext, source: AudioNode, destination: AudioNode) {
    this.gain = ctx.createGain();
    this.panner = ctx.createStereoPanner();
    source.connect(this.gain);
    this.gain.connect(this.panner);
    this.panner.connect(destination);
  }

  get output(): AudioNode {
    return this.panner;
  }

  setPan(relativeX: number): void {
    this.panner.pan.value = computePan(relativeX);
  }

  setGain(distance: number, sameIsland: boolean): void {
    this.gain.gain.value = computeGain(distance, sameIsland);
  }

  setGainValue(value: number): void {
    this.gain.gain.value = Math.max(0, Math.min(1, value));
  }

  dispose(): void {
    this.gain.disconnect();
    this.panner.disconnect();
  }
}