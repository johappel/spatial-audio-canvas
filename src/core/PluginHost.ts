// Verwaltet die Registrierung und den Lebenszyklus von Plugins.
import type { AppContext } from './context';
import type { PluginManifest, SacPlugin } from './PluginManifest';

export class PluginHost {
  private plugins: SacPlugin[] = [];

  constructor(private readonly ctx: AppContext) {}

  async register(plugin: SacPlugin): Promise<void> {
    if (this.plugins.some((p) => p.manifest.id === plugin.manifest.id)) {
      console.warn('[PluginHost] Plugin bereits registriert:', plugin.manifest.id);
      return;
    }
    this.plugins.push(plugin);
    await plugin.setup(this.ctx);
    console.info('[PluginHost] Plugin aktiv:', plugin.manifest.id);
  }

  async registerAll(plugins: SacPlugin[]): Promise<void> {
    for (const plugin of plugins) {
      await this.register(plugin);
    }
  }

  manifests(): PluginManifest[] {
    return this.plugins.map((p) => p.manifest);
  }

  dispose(): void {
    for (const plugin of this.plugins) {
      plugin.dispose?.();
    }
    this.plugins = [];
  }
}