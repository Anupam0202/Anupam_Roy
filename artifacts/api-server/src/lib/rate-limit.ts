interface RateLimiterOptions {
  limit: number;
  windowMs: number;
  /** Keys kept in memory; beyond this the least recently seen key is dropped. */
  maxKeys?: number;
  now?: () => number;
}

/**
 * Sliding-window limiter, in memory per server instance (not globally atomic).
 * Returns true when the key is over its limit.
 */
export function createRateLimiter({ limit, windowMs, maxKeys = 2_000, now = Date.now }: RateLimiterOptions) {
  const buckets = new Map<string, number[]>();
  let checks = 0;

  function sweep(at: number) {
    for (const [key, timestamps] of buckets) {
      const active = timestamps.filter((t) => at - t < windowMs);
      if (active.length === 0) buckets.delete(key);
      else buckets.set(key, active);
    }
    evict();
  }

  /** Map order is least recently seen first, because every hit re-inserts its key. */
  function evict() {
    while (buckets.size > maxKeys) {
      const oldestKey = buckets.keys().next().value;
      if (typeof oldestKey !== "string") break;
      buckets.delete(oldestKey);
    }
  }

  const limited = (key: string) => {
    const at = now();
    checks += 1;
    if (checks % 100 === 0) sweep(at);

    const active = (buckets.get(key) ?? []).filter((t) => at - t < windowMs);
    buckets.delete(key);
    if (active.length >= limit) {
      buckets.set(key, active);
      return true;
    }
    active.push(at);
    buckets.set(key, active);
    evict();
    return false;
  };
  limited.size = () => buckets.size;
  limited.has = (key: string) => buckets.has(key);
  return limited;
}
