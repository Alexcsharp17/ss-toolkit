import type { IPlatformAdapter } from '../contracts/IPlatformAdapter';
import type { PlatformCode } from '../contracts/types';

export class AdapterRegistry {
  private readonly adapters = new Map<PlatformCode, IPlatformAdapter>();

  register(platform: PlatformCode, adapter: IPlatformAdapter): void {
    if (adapter.platform !== platform) {
      throw new Error(`Adapter platform mismatch: expected ${platform}, got ${adapter.platform}`);
    }
    this.adapters.set(platform, adapter);
  }

  get(platform: PlatformCode): IPlatformAdapter {
    const a = this.adapters.get(platform);
    if (!a) {
      throw new Error(`No platform adapter registered for: ${platform}`);
    }
    return a;
  }

  has(platform: PlatformCode): boolean {
    return this.adapters.has(platform);
  }
}
