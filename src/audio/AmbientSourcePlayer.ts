// Spielt dezente Hintergrundklaenge pro Insel. Bewusst leise als Standard.
import type { AmbientSource } from '../types';

export class AmbientSourcePlayer {
  private element: HTMLAudioElement | null = null;
  private node: MediaElementAudioSourceNode | null = null;
  private readonly gain: GainNode;

  constructor(
    private readonly ctx: AudioContext,
    destination: AudioNode,
    private readonly source: AmbientSource,
  ) {
    this.gain = ctx.createGain();
    this.gain.gain.value = source.defaultVolume;
    this.gain.connect(destination);
  }

  play(): void {
    if (!this.element) {
      this.element = new Audio(this.source.src);
      this.element.loop = this.source.loop;
      this.element.crossOrigin = 'anonymous';
      this.node = this.ctx.createMediaElementSource(this.element);
      this.node.connect(this.gain);
    }
    void this.element.play().catch((error) => console.warn('[AmbientSourcePlayer]', error));
  }

  stop(): void {
    this.element?.pause();
  }

  setVolume(value: number): void {
    this.gain.gain.value = Math.max(0, Math.min(1, value));
  }

  dispose(): void {
    this.stop();
    this.node?.disconnect();
    this.gain.disconnect();
    this.element = null;
    this.node = null;
  }
}