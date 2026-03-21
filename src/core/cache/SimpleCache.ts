export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export interface SimpleCacheOptions {
  ttlMs?: number;
  maxSize?: number;
}

/**
 * Simple in-memory cache with TTL
 */
export class SimpleCache<K, V> {
  private readonly ttlMs: number;
  private readonly maxSize: number;
  private cache = new Map<K, CacheEntry<V>>();
  private accessOrder: K[] = [];

  constructor(options: SimpleCacheOptions = {}) {
    this.ttlMs = options.ttlMs ?? 60000;
    this.maxSize = options.maxSize ?? 100;
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.accessOrder = this.accessOrder.filter((k) => k !== key);
      return undefined;
    }
    this.touch(key);
    return entry.value;
  }

  set(key: K, value: V): void {
    this.evictIfNeeded();
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs,
    });
    this.touch(key);
  }

  delete(key: K): boolean {
    const deleted = this.cache.delete(key);
    this.accessOrder = this.accessOrder.filter((k) => k !== key);
    return deleted;
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  private touch(key: K): void {
    this.accessOrder = this.accessOrder.filter((k) => k !== key);
    this.accessOrder.push(key);
  }

  private evictIfNeeded(): void {
    while (this.cache.size >= this.maxSize && this.accessOrder.length > 0) {
      const oldest = this.accessOrder.shift();
      if (oldest != null) {
        this.cache.delete(oldest);
      }
    }
  }
}
