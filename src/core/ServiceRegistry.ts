// Einfacher, typsicherer Service-Container fuer Singletons.
export type ServiceKey<T> = symbol & { readonly __type?: T };

export function createServiceKey<T>(name: string): ServiceKey<T> {
  return Symbol(name) as ServiceKey<T>;
}

export class ServiceRegistry {
  private services = new Map<symbol, unknown>();

  set<T>(key: ServiceKey<T>, value: T): void {
    this.services.set(key, value);
  }

  get<T>(key: ServiceKey<T>): T {
    const value = this.services.get(key);
    if (value === undefined) {
      throw new Error(`Service nicht registriert: ${key.description ?? 'unbekannt'}`);
    }
    return value as T;
  }

  has<T>(key: ServiceKey<T>): boolean {
    return this.services.has(key);
  }
}