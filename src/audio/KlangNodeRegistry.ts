// Registry fuer Klangnode-Fabriken. Plugins (z.B. Klanggesten) registrieren
// hier neue Klang-Typen, die dann ueberall erzeugt werden koennen.
import type { KlangNode, KlangNodeFactory, KlangNodeParams } from './KlangNode';

export class KlangNodeRegistry {
  private factories = new Map<string, KlangNodeFactory>();

  register(factory: KlangNodeFactory): void {
    if (this.factories.has(factory.kind)) {
      console.warn('[KlangNodeRegistry] Kind bereits registriert:', factory.kind);
      return;
    }
    this.factories.set(factory.kind, factory);
  }

  has(kind: string): boolean {
    return this.factories.has(kind);
  }

  kinds(): string[] {
    return [...this.factories.keys()];
  }

  create(kind: string, ctx: AudioContext, params?: KlangNodeParams): KlangNode {
    const factory = this.factories.get(kind);
    if (!factory) {
      throw new Error(`Unbekannter KlangNode-Typ: ${kind}`);
    }
    return factory.create(ctx, params);
  }
}