import { expect, test } from "@playwright/test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { claims } from "@workspace/proof-atlas-core/data/claims";
import { projects } from "@workspace/proof-atlas-core/data/projects";
import { STATIC_ROUTES } from "../../src/lib/routes";

/* Metadata contract, checked on the built files in dist/ (no browser needed). */

const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(here, "../../dist");
const pub = path.resolve(here, "../../public");
const coreData = (file: string) => JSON.parse(readFileSync(path.resolve(here, "../../../proof-atlas-core/src/data", file), "utf8"));
const SITE = coreData("site.json") as { url: string };
// Read as a file: Playwright's loader cannot import the JSON module that data/credentials.ts uses.
const credentials = coreData("credentials.json") as unknown[];

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
const htmlFor = (route: string) => readFileSync(path.join(dist, route, "index.html"), "utf8");
const meta = (html: string, attr: "name" | "property", key: string) =>
  new RegExp(`<meta ${attr}="${key.replace(/[.:]/g, "\\$&")}" content="([^"]*)"`).exec(html)?.[1];
const pages = STATIC_ROUTES.map((route) => ({ route, html: htmlFor(route) }));

/** Width and height from a PNG's IHDR chunk. */
function pngSize(file: string): [number, number] {
  const buf = readFileSync(file);
  expect(buf.subarray(1, 4).toString("latin1"), file).toBe("PNG");
  return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
}

test.describe("metadata contract", () => {
  test("every page has an existing 1200×630 og:image with alt text, and matching Twitter tags", () => {
    for (const { route, html } of pages) {
      const image = meta(html, "property", "og:image");
      expect(image, route).toMatch(new RegExp(`^${SITE.url}/og/[a-z-]+\\.png$`));
      expect(pngSize(path.join(pub, new URL(image!).pathname)), route).toEqual([1200, 630]);
      expect(meta(html, "property", "og:image:alt")?.length, route).toBeGreaterThan(10);
      expect(meta(html, "name", "twitter:card"), route).toBe("summary_large_image");
      expect(meta(html, "name", "twitter:image"), route).toBe(image);
      expect(meta(html, "property", "og:locale"), route).toBe("en_GB");
    }
  });

  test("descriptions are 70–160 characters, and titles and descriptions are unique", () => {
    const titles = new Map<string, string>();
    const descriptions = new Map<string, string>();
    for (const { route, html } of pages) {
      const title = /<title>([^<]+)<\/title>/.exec(html)?.[1];
      const description = meta(html, "name", "description");
      expect(title, route).toBeTruthy();
      expect(description?.length, `${route} description length`).toBeGreaterThanOrEqual(70);
      expect(description?.length, `${route} description length`).toBeLessThanOrEqual(160);
      expect(titles.get(title!), `${route} repeats the title of ${titles.get(title!)}`).toBeUndefined();
      expect(descriptions.get(description!), `${route} repeats the description of ${descriptions.get(description!)}`).toBeUndefined();
      titles.set(title!, route);
      descriptions.set(description!, route);
    }
  });

  test("JSON-LD parses, and case studies are articles with their source code", () => {
    for (const { route, html } of pages) {
      const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
      expect(blocks.length, route).toBeGreaterThan(0);
      for (const block of blocks) expect(block["@context"], route).toBe("https://schema.org");
      const types = blocks.flatMap((b) => b["@graph"] ?? [b]).flatMap((node) => [node["@type"]].flat());
      if (route !== "/") expect(types, route).toContain("BreadcrumbList");
      if (/^\/portfolio\/[^/]+\/$/.test(route)) {
        expect(meta(html, "property", "og:type"), route).toBe("article");
        expect(types, route).toContain("SoftwareSourceCode");
      }
    }
    const home = JSON.parse(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(htmlFor("/"))![1]);
    const person = (home["@graph"] ?? [home]).find((node: { "@type": string }) => node["@type"] === "Person");
    expect(person).toMatchObject({ "@type": "Person", alumniOf: expect.any(Object), homeLocation: expect.any(Object) });
    expect(person).not.toHaveProperty("image");
  });

  test("the 404 page is noindex and has no canonical link", () => {
    const html = readFileSync(path.join(dist, "404.html"), "utf8");
    expect(meta(html, "name", "robots")).toMatch(/noindex/);
    expect(html).not.toMatch(/rel="canonical"/);
  });

  test("every file in public/ is referenced by the built site", () => {
    const built = walk(dist)
      .filter((f) => /\.(html|css|js|webmanifest|xml|txt)$/.test(f))
      .map((f) => readFileSync(f, "utf8"))
      .join("\n");
    const unreferenced = walk(pub)
      .map((f) => `/${path.relative(pub, f).split(path.sep).join("/")}`)
      .filter((p) => !built.includes(p));
    expect(unreferenced).toEqual([]);
  });

  test("counts on pages come from the data", () => {
    // React separates text nodes with <!-- --> markers in server-rendered islands.
    const credentialsPage = htmlFor("/credentials/").replaceAll("<!-- -->", "");
    expect(credentialsPage).toContain(`${credentials.length} of ${credentials.length} records`);
    expect(htmlFor("/portfolio/")).toContain(`${projects.length} projects`);
    expect(htmlFor("/sources/")).toContain(`${claims.filter((c) => c.public).length} entries`);
    // No page template hard-codes these counts.
    const templates = walk(path.resolve(here, "../../src/pages")).filter((f) => f.endsWith(".astro"));
    for (const file of templates) {
      const source = readFileSync(file, "utf8").replace(/<style[\s\S]*?<\/style>/g, "");
      expect(source, path.relative(here, file)).not.toMatch(new RegExp(`\\b(${credentials.length}|${claims.filter((c) => c.public).length}) (records|credentials|entries)\\b`));
    }
  });
});
