interface RateLimiterOptions {
  limit: number;
  windowMs: number;
  maxKeys?: number;
}

export function createRateLimiter({ limit, windowMs, maxKeys = 2_000 }: RateLimiterOptions) {
  const buckets = new Map<string, number[]>();
  let checks = 0;

  function sweep(now: number) {
    for (const [key, timestamps] of buckets) {
      const active = timestamps.filter((timestamp) => now - timestamp < windowMs);
      if (active.length === 0) buckets.delete(key);
      else buckets.set(key, active);
    }

    while (buckets.size > maxKeys) {
      const oldestKey = buckets.keys().next().value;
      if (typeof oldestKey !== "string") break;
      buckets.delete(oldestKey);
    }
  }

  return (key: string) => {
    const now = Date.now();
    checks += 1;
    if (checks % 100 === 0 || buckets.size > maxKeys) sweep(now);

    const active = (buckets.get(key) ?? []).filter((timestamp) => now - timestamp < windowMs);
    if (active.length >= limit) {
      buckets.set(key, active);
      return true;
    }

    active.push(now);
    buckets.set(key, active);
    return false;
  };
}
