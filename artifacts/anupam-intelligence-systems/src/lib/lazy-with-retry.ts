import { lazy, type ComponentType, type LazyExoticComponent } from "react";

const RETRY_DELAYS_MS = [350, 1_000] as const;
const wait = (delay: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, delay));

export function lazyWithRetry<Props extends object>(
  loader: () => Promise<{ default: ComponentType<Props> }>,
): LazyExoticComponent<ComponentType<Props>> {
  return lazy(async () => {
    let lastError: unknown;
    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
      try {
        return await loader();
      } catch (error) {
        lastError = error;
        if (attempt < RETRY_DELAYS_MS.length)
          await wait(RETRY_DELAYS_MS[attempt]);
      }
    }
    throw lastError;
  });
}
