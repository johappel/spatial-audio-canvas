// Registry fuer UI-Mount-Punkte. Plugins haengen ihre Oberflaechen an
// definierte Regionen der App-Shell, ohne die Shell selbst zu kennen.

export type UiRegion = 'sidebar' | 'overlay' | 'island-toolbar';

export type UiContribution = {
  pluginId: string;
  element: HTMLElement;
  order?: number;
  /** Ueberschrift fuer einklappbare Abschnitte (z. B. in der Sidebar). */
  title?: string;
  /** Optionales Symbol (Emoji) vor der Ueberschrift. */
  icon?: string;
  /** Soll der Abschnitt anfangs geoeffnet sein? Standard: geschlossen. */
  defaultOpen?: boolean;
};

export class UiRegionRegistry {
  private regions = new Map<UiRegion, UiContribution[]>();
  private subscribers = new Set<(region: UiRegion) => void>();

  mount(region: UiRegion, contribution: UiContribution): () => void {
    const list = this.regions.get(region) ?? [];
    list.push(contribution);
    list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    this.regions.set(region, list);
    this.notify(region);
    return () => {
      const current = this.regions.get(region) ?? [];
      this.regions.set(
        region,
        current.filter((c) => c !== contribution),
      );
      this.notify(region);
    };
  }

  get(region: UiRegion): UiContribution[] {
    return this.regions.get(region) ?? [];
  }

  subscribe(listener: (region: UiRegion) => void): () => void {
    this.subscribers.add(listener);
    return () => this.subscribers.delete(listener);
  }

  private notify(region: UiRegion): void {
    this.subscribers.forEach((listener) => listener(region));
  }
}