// Vertrag fuer Plugins: Manifest + Lebenszyklus.
import type { AppContext } from './context';

export type PluginCapability = 'message' | 'audio' | 'ui';

export interface PluginManifest {
  id: string;
  title: string;
  version: string;
  description?: string;
  capabilities?: PluginCapability[];
}

export interface SacPlugin {
  manifest: PluginManifest;
  // Wird einmalig beim Registrieren aufgerufen.
  setup(ctx: AppContext): void | Promise<void>;
  // Optional: Aufraeumen beim Entladen.
  dispose?(): void;
}