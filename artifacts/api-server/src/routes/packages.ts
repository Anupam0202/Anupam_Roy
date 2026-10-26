import { Router, type IRouter } from "express";
import {
  isValidPackageName,
  normalizeNpmLatest,
  normalizePypiName,
  normalizePypiProject,
  registryUrl,
  type Ecosystem,
  type PackageMetadata,
} from "@workspace/proof-atlas-core/github/dependencies";
import { PROVIDER_POLICIES } from "@workspace/proof-atlas-core/providers/policies";
import { LruCache } from "../lib/cache";
import type { Deps } from "../lib/deps";
import { clientKey, providerUnavailable, providerUserAgent, requireJson, str, tooMany } from "../lib/http";
import { EgressError, ProviderUnavailable, rateLimitSignal, type ProviderClient } from "../lib/providers";
import { createRateLimiter } from "../lib/rate-limit";

const LABEL: Record<Ecosystem, string> = { npm: "npm", pypi: "PyPI" };

/** Registry metadata for one package a visitor selects; never a bulk crawl. */
export function createPackagesRouter(deps: Deps, providers: ProviderClient): IRouter {
  const router = Router();
  const limited = createRateLimiter({ limit: 30, windowMs: 60_000 });
  const cache = new LruCache<PackageMetadata | null>(1_000);

  router.post("/packages/lookup", async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    if (!requireJson(req, res)) return;
    const body = (req.body ?? {}) as Record<string, unknown>;
    const ecosystem = body.ecosystem === "npm" || body.ecosystem === "pypi" ? (body.ecosystem as Ecosystem) : null;
    const rawName = str(body.name, 214);
    if (!ecosystem || !isValidPackageName(ecosystem, rawName)) return void res.status(400).json({ error: "Choose npm or PyPI and a valid package name." });
    const name = ecosystem === "pypi" ? normalizePypiName(rawName) : rawName;
    if (limited(clientKey(req))) return tooMany(res, 60, "Too many package lookups. Please wait a minute.");

    const key = `${ecosystem}:${name}`;
    const now = deps.now();
    const policy = PROVIDER_POLICIES[ecosystem];
    const cached = cache.get(key);
    const notFound = () => res.status(404).json({ error: `${LABEL[ecosystem]} has no package named ${name}.` });
    if (cached && now - cached.storedAt < policy.cacheTtlSeconds * 1_000) {
      if (!cached.value) return void notFound();
      return void res.json({ package: cached.value, source: { provider: ecosystem, cache: "hit" } });
    }
    const stale = () =>
      cached?.value && now - cached.storedAt < (policy.staleIfErrorSeconds ?? 0) * 1_000
        ? res.json({ package: cached.value, source: { provider: ecosystem, cache: "stale" } })
        : null;

    try {
      // Package lookups are nonessential enrichment: paused first when a registry budget runs low.
      const response = await providers.request(
        ecosystem,
        registryUrl(ecosystem, name),
        { headers: { Accept: "application/json", "User-Agent": providerUserAgent() } },
        { tier: "enrichment" },
      );
      if (response.status === 404) {
        cache.set(key, { value: null, storedAt: now });
        return void notFound();
      }
      if (response.status !== 200) {
        if (stale()) return;
        const wait = rateLimitSignal(ecosystem, response, now);
        if (wait !== null) return tooMany(res, wait, `${LABEL[ecosystem]} asked us to slow down. Try again in a minute or two.`);
        return void res.status(502).json({ error: `${LABEL[ecosystem]} is unavailable right now. Try again later.` });
      }
      const fetchedAt = new Date(now).toISOString();
      const json = JSON.parse(response.text) as unknown;
      const meta = ecosystem === "npm" ? normalizeNpmLatest(json, fetchedAt) : normalizePypiProject(json, fetchedAt);
      cache.set(key, { value: meta, storedAt: now });
      res.json({ package: meta, source: { provider: ecosystem, cache: "miss" } });
    } catch (error) {
      if (stale()) return;
      if (error instanceof ProviderUnavailable) return providerUnavailable(res, error, "Package lookup", now);
      const tooLarge = error instanceof EgressError && error.code === "response-too-large";
      res.status(502).json({
        error: tooLarge ? `${LABEL[ecosystem]}'s record for ${name} is too large to read here.` : `${LABEL[ecosystem]} could not be reached.`,
        registryUrl: ecosystem === "npm" ? `https://www.npmjs.com/package/${name}` : `https://pypi.org/project/${name}/`,
      });
    }
  });

  return router;
}
