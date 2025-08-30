type Constructor<T = {}> = new (...args: any[]) => T;
type ServiceFactory<T> = () => T;
type ServiceInstance<T> = T | ServiceFactory<T> | Constructor<T>;

export class DIContainer {
  private services = new Map<string | symbol, any>();
  private singletons = new Map<string | symbol, any>();

  register<T>(
    token: string | symbol,
    implementation: ServiceInstance<T>,
    options?: { singleton?: boolean }
  ): void {
    this.services.set(token, { implementation, options });
  }

  resolve<T>(token: string | symbol): T {
    const service = this.services.get(token);
    
    if (!service) {
      throw new Error(`Service ${String(token)} not registered`);
    }

    const { implementation, options } = service;

    // Check if it's a singleton and already instantiated
    if (options?.singleton && this.singletons.has(token)) {
      return this.singletons.get(token);
    }

    let instance: T;

    if (typeof implementation === 'function') {
      // Check if it's a constructor or factory function
      if (implementation.prototype && implementation.prototype.constructor === implementation) {
        // It's a constructor
        instance = new implementation();
      } else {
        // It's a factory function
        instance = implementation();
      }
    } else {
      // It's already an instance
      instance = implementation;
    }

    // Store singleton instance
    if (options?.singleton) {
      this.singletons.set(token, instance);
    }

    return instance;
  }

  has(token: string | symbol): boolean {
    return this.services.has(token);
  }

  clear(): void {
    this.services.clear();
    this.singletons.clear();
  }
}
