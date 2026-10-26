/** Small in-memory LRU cache. Freshness is decided by the caller from storedAt. */
export interface CacheEntry<T> {
  value: T;
  storedAt: number;
  etag?: string;
  /** Approximate size, counted against maxBytes. */
  bytes?: number;
}

export class LruCache<T> {
  private readonly map = new Map<string, CacheEntry<T>>();
  private totalBytes = 0;

  constructor(
    private readonly maxEntries = 500,
    /** Upper bound on the sum of entry sizes. */
    private readonly maxBytes = Number.POSITIVE_INFINITY,
  ) {}

  get(key: string): CacheEntry<T> | undefined {
    const entry = this.map.get(key);
    if (entry) {
      this.map.delete(key);
      this.map.set(key, entry);
    }
    return entry;
  }

  set(key: string, entry: CacheEntry<T>): void {
    this.remove(key);
    if ((entry.bytes ?? 0) > this.maxBytes) return;
    this.map.set(key, entry);
    this.totalBytes += entry.bytes ?? 0;
    while (this.map.size > this.maxEntries || this.totalBytes > this.maxBytes) {
      const oldest = this.map.keys().next().value;
      if (oldest === undefined) break;
      this.remove(oldest);
    }
  }

  private remove(key: string) {
    const existing = this.map.get(key);
    if (!existing) return;
    this.totalBytes -= existing.bytes ?? 0;
    this.map.delete(key);
  }
}
