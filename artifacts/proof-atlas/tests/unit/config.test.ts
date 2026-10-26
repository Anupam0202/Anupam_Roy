import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SECURITY_HEADERS } from "@workspace/proof-atlas-core/site/headers";
import { STATIC_ROUTES } from "../../src/lib/routes";
// Plain JavaScript module shared with the local preview server.
import { redirectFor } from "../../../../scripts/vercel-routing.mjs";

const vercel = JSON.parse(readFileSync(new URL("../../../../vercel.json", import.meta.url), "utf8"));
const redirect = (path: string) => redirectFor(vercel.redirects, path) as { destination: string; permanent: boolean } | null;

describe("vercel.json", () => {
  it("serves the Astro build and routes only /api to the function", () => {
    expect(vercel.outputDirectory).toBe("artifacts/proof-atlas/dist");
    expect(vercel.rewrites).toEqual([{ source: "/api/:path*", destination: "/api/index" }]);
  });

  it("sends exactly the shared security headers on every path", () => {
    const all = vercel.headers.find((h: { source: string }) => h.source === "/(.*)");
    expect(all.headers).toEqual(SECURITY_HEADERS);
  });

  it("keeps certificate PDFs out of search indexes", () => {
    const certs = vercel.headers.find((h: { source: string }) => h.source === "/certs/(.*)");
    expect(certs.headers).toContainEqual({ key: "X-Robots-Tag", value: "noindex, noarchive" });
  });

  it.each([
    ["/work/", "/portfolio/"],
    ["/work/nexusrag", "/portfolio/nexusrag/"],
    ["/studio/", "/workbench/"],
    ["/studio/repository-lens/", "/workbench/repository/"],
    ["/studio/evidence-workbench/", "/workbench/documents/"],
    ["/studio/research-trail/", "/workbench/citations/"],
    ["/studio/earth-signals/", "/portfolio/plantpal/#earth-signals"],
  ])("redirects legacy %s to %s", (from, to) => {
    expect(redirect(from)).toEqual({ destination: to, permanent: true });
  });

  it("adds a trailing slash to page paths but never to API or file paths", () => {
    expect(redirect("/lab")?.destination).toBe("/lab/");
    expect(redirect("/portfolio/nexusrag")?.destination).toBe("/portfolio/nexusrag/");
    for (const path of ["/", "/lab/", "/api/status", "/api/ai/ask", "/api", "/robots.txt", "/certs/a.pdf", "/_astro/x.js"]) expect(redirect(path)).toBeNull();
  });

  it("does not redirect any canonical route", () => {
    for (const route of STATIC_ROUTES) expect(redirect(route)).toBeNull();
  });
});

describe("routes", () => {
  it("has a page source for every route in the sitemap list", () => {
    for (const route of STATIC_ROUTES) {
      const base = new URL(`../../src/pages${route === "/" ? "/index" : route.replace(/\/$/, "")}`, import.meta.url);
      const candidates = [`${base.pathname}.astro`, `${base.pathname}/index.astro`];
      const dynamic = route.startsWith("/portfolio/") && route !== "/portfolio/";
      expect(candidates.some(existsSync) || dynamic, route).toBe(true);
    }
  });
});
