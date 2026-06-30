// Gemeinsamer Vertrag fuer Medienquellen (Ambiente, Musik, Podcast, ...).
// Neue Medientypen koennen ueber die MediaSourceRegistry ergaenzt werden,
// ohne die UI oder den Kern zu aendern.
import type { AmbientSource } from '../types';

export interface MediaPlayback {
  play(): void;
  stop(): void;
  setVolume(value: number): void;
  dispose(): void;
}

export interface MediaSourceHandler {
  readonly kind: string;
  readonly title: string;
  create(ctx: AudioContext, destination: AudioNode, source: AmbientSource): MediaPlayback;
}