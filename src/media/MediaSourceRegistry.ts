// Registry fuer Medientyp-Handler.
import type { AmbientSource } from '../types';
import type { MediaPlayback, MediaSourceHandler } from './MediaSource';
import { AmbientSourcePlayer } from '../audio/AmbientSourcePlayer';

export class MediaSourceRegistry {
  private handlers = new Map<string, MediaSourceHandler>();

  register(handler: MediaSourceHandler): void {
    if (this.handlers.has(handler.kind)) {
      console.warn('[MediaSourceRegistry] Medientyp bereits registriert:', handler.kind);
      return;
    }
    this.handlers.set(handler.kind, handler);
  }

  has(kind: string): boolean {
    return this.handlers.has(kind);
  }

  kinds(): string[] {
    return [...this.handlers.keys()];
  }

  create(ctx: AudioContext, destination: AudioNode, source: AmbientSource): MediaPlayback {
    const handler = this.handlers.get(source.kind);
    if (!handler) {
      throw new Error(`Kein Handler fuer Medientyp: ${source.kind}`);
    }
    return handler.create(ctx, destination, source);
  }
}

// Standard-Handler: spielt eine Quelle ueber den AmbientSourcePlayer ab.
// Deckt ambience/music/podcast/signal ab und dient als Vorlage fuer eigene Typen.
export function createDefaultMediaHandler(kind: string, title: string): MediaSourceHandler {
  return {
    kind,
    title,
    create(ctx, destination, source): MediaPlayback {
      return new AmbientSourcePlayer(ctx, destination, source);
    },
  };
}