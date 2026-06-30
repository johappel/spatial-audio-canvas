// Vertrag fuer einen erweiterbaren Klangnode.
// Ein KlangNode ist eine austauschbare Audio-Verarbeitungseinheit mit
// gemeinsamem Ein-/Ausgang, sodass neue Klang-Typen eingehaengt werden koennen.
export interface KlangNode {
  readonly id: string;
  readonly kind: string;
  // Ausgang, der weiterverbunden wird (z.B. an den Master).
  readonly output: AudioNode;
  // Optionaler Eingang fuer Quellen, die durch diesen Node laufen.
  readonly input?: AudioNode;
  dispose(): void;
}

export type KlangNodeParams = Record<string, unknown>;

export interface KlangNodeFactory {
  readonly kind: string;
  readonly title: string;
  create(ctx: AudioContext, params?: KlangNodeParams): KlangNode;
}