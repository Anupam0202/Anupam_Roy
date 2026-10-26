import type { FetchLike } from "@workspace/proof-atlas-core/security/egress";

/** Everything a route needs from the outside world, so tests can replace it. */
export interface Deps {
  fetch: FetchLike;
  env: Record<string, string | undefined>;
  now: () => number;
}

export const defaultDeps = (): Deps => ({
  fetch: (input, init) => fetch(input, init),
  env: process.env,
  now: () => Date.now(),
});
