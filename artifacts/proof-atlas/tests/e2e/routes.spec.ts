import { expect, test } from "@playwright/test";
import { STATIC_ROUTES } from "../../src/lib/routes";
import { readFileSync } from "node:fs";

const SITE = JSON.parse(readFileSync(new URL("../../../proof-atlas-core/src/data/site.json", import.meta.url), "utf8")) as { url: string };

test.describe("every route", () => {
  for (const route of STATIC_ROUTES) {
    test(`${route} renders with one h1, CSP and no console errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
      page.on("pageerror", (e) => errors.push(e.message));
      const response = await page.goto(route);
      expect(response?.status()).toBe(200);
      expect(response?.headers()["x-frame-options"]).toBe("DENY");
      expect(response?.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator('meta[http-equiv="content-security-policy"]')).toHaveCount(1);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${SITE.url}${route}`);
      await page.waitForLoadState("networkidle");
      expect(errors).toEqual([]);
    });
  }
});

test.describe("HTTP behaviour", () => {
  test("unknown paths get the custom page with a real 404", async ({ page }) => {
    const response = await page.goto("/no-such-page/");
    expect(response?.status()).toBe(404);
    await expect(page.locator("h1")).toContainText("isn't part of the atlas");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });

  test("legacy and slash-less paths redirect permanently", async ({ request }) => {
    const cases: Array<[string, string]> = [
      ["/lab", "/lab/"],
      ["/portfolio/nexusrag", "/portfolio/nexusrag/"],
      ["/work/", "/portfolio/"],
      ["/work/plantpal", "/portfolio/plantpal/"],
      ["/studio/", "/workbench/"],
      ["/studio/repository-lens/", "/workbench/repository/"],
      ["/studio/evidence-workbench/", "/workbench/documents/"],
      ["/studio/research-trail/", "/workbench/citations/"],
      ["/studio/earth-signals/", "/portfolio/plantpal/#earth-signals"],
    ];
    for (const [from, to] of cases) {
      const res = await request.get(from, { maxRedirects: 0 });
      expect(res.status(), from).toBe(308);
      expect(new URL(res.headers()["location"]!, "http://x").pathname + (to.includes("#") ? "#earth-signals" : ""), from).toBe(to);
    }
  });

  test("API paths are never redirected and answer JSON", async ({ request }) => {
    const status = await request.get("/api/status", { maxRedirects: 0 });
    expect(status.status()).toBe(200);
    expect(status.headers()["content-security-policy"]).toBe("default-src 'none'; frame-ancestors 'none'");
    const body = await status.json();
    expect(body.assistant.enabled).toBe(false);
    expect((await request.get("/api/missing", { maxRedirects: 0 })).status()).toBe(404);
  });

  test("sitemap and robots describe the public site", async ({ request }) => {
    const sitemap = await (await request.get("/sitemap.xml")).text();
    for (const route of STATIC_ROUTES) expect(sitemap).toContain(`<loc>${SITE.url}${route}</loc>`);
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toMatch(/Disallow: \/certs\//);
    expect(robots).toMatch(/Disallow: \/api\//);
  });

  test("certificate PDFs are served but not indexed", async ({ request }) => {
    const res = await request.get("/certs/aws-ml-engineer-associate.pdf");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toBe("application/pdf");
    expect(res.headers()["x-robots-tag"]).toContain("noindex");
  });
});
