#!/usr/bin/env node
/**
 * Post-build checks on the static site in artifacts/proof-atlas/dist:
 * page structure, CSP meta, internal links, truthfulness labels, secrets and
 * per-page weight budgets (scripts/page-budgets.json; the homepage JavaScript
 * also has a hard 120 KiB cap). Runs at the end of `pnpm run build` and prints
 * a per-page weight table.
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { redirectFor } from "./vercel-routing.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "artifacts/proof-atlas/dist");
const vercel = JSON.parse(readFileSync(path.join(root, "vercel.json"), "utf8"));
const SITE = JSON.parse(readFileSync(path.join(root, "artifacts/proof-atlas-core/src/data/site.json"), "utf8")).url;
const HOME_JS_BUDGET = 120 * 1024;
const OUTCOME_QUALIFIER = "Approximate improvements reported by Anupam; not independently audited.";
const failures = [];
const check = (ok, message) => {
  if (!ok) failures.push(message);
};

if (!existsSync(path.join(dist, "index.html"))) {
  console.error("No build found. Run the site build first.");
  process.exit(1);
}

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
}
const files = walk(dist);
const htmlFiles = files.filter((f) => f.endsWith(".html"));
const rel = (f) => path.relative(dist, f);
const decode = (s) => s.replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"');

/** Maps a site path to the file Vercel would serve, following vercel.json redirects. */
function resolvePath(pathname, hops = 0) {
  if (hops > 3) return null;
  const target = redirectFor(vercel.redirects, pathname);
  if (target) return resolvePath(new URL(target.destination, SITE).pathname, hops + 1);
  const file = path.join(dist, decodeURIComponent(pathname), pathname.endsWith("/") ? "index.html" : "");
  return existsSync(file) ? file : null;
}

/* Sitemap covers real pages only */
const sitemap = readFileSync(path.join(dist, "sitemap.xml"), "utf8");
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
check(locs.length >= 20, `sitemap lists only ${locs.length} URLs`);
for (const loc of locs) {
  check(loc.startsWith(`${SITE}/`) && loc.endsWith("/"), `sitemap URL must be canonical with a trailing slash: ${loc}`);
  check(Boolean(resolvePath(new URL(loc).pathname)), `sitemap URL has no page: ${loc}`);
}
const robots = readFileSync(path.join(dist, "robots.txt"), "utf8");
check(/Disallow: \/certs\//.test(robots) && /Disallow: \/api\//.test(robots), "robots.txt must disallow /certs/ and /api/");
check(robots.includes(`${SITE}/sitemap.xml`), "robots.txt must point to the sitemap");

/* Every page */
const pageIds = new Map();
for (const file of htmlFiles) {
  const html = readFileSync(file, "utf8");
  const name = rel(file);
  check(/<html lang="en"/.test(html), `${name}: <html lang="en"> missing`);
  check((html.match(/<h1\b/g) ?? []).length === 1, `${name}: needs exactly one <h1>`);
  check(/<title>[^<]{3,}<\/title>/.test(html), `${name}: missing <title>`);
  check(/<meta name="description" content="[^"]{30,}"/.test(html), `${name}: missing meta description`);
  check(/<meta http-equiv="content-security-policy" content="[^"]*script-src 'self'/i.test(html), `${name}: CSP meta with script-src missing`);
  check(!/'unsafe-inline'/.test(html), `${name}: 'unsafe-inline' must not appear`);
  check(/<a[^>]+class="skip-link"[^>]*href="#main"/.test(html) || /href="#main"[^>]*class="skip-link"/.test(html), `${name}: skip link missing`);
  check(/<main[^>]+id="main"/.test(html), `${name}: <main id="main"> missing`);
  check(!/\sstyle="/.test(html), `${name}: inline style attributes are blocked by the CSP`);
  for (const m of html.matchAll(/<meta property="og:image" content="([^"]+)"/g)) {
    const og = new URL(m[1]);
    check(og.origin === SITE && existsSync(path.join(dist, og.pathname)), `${name}: og:image ${m[1]} is not in the build`);
  }
  if (name !== "404.html") check(/<link rel="canonical" href="https:\/\/anupam-roy\.vercel\.app\/[^"]*\/?"/.test(html), `${name}: canonical link missing`);
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  check(!dupes.length, `${name}: duplicate ids ${[...new Set(dupes)].join(", ")}`);
  pageIds.set(name, new Set(ids));

  /* Truthfulness */
  const text = decode(html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]+>/g, " "));
  check(!/\b74 verified\b|verified (certifications|credentials)/i.test(text), `${name}: forbidden credential wording`);
  if (/~?\s?(20|50)\s?%\s+(turnaround|reduction|lower|SME)/i.test(text) || /about (20|50)%/i.test(text))
    check(text.includes(OUTCOME_QUALIFIER), `${name}: outcome figures need the qualifier "${OUTCOME_QUALIFIER}"`);

  /* External links open safely */
  for (const m of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) check(/rel="[^"]*noopener/.test(m[0]), `${name}: target=_blank without rel=noopener`);
}
check(/<meta name="robots" content="noindex/.test(readFileSync(path.join(dist, "404.html"), "utf8")), "404.html must be noindex");

/* Internal links and fragments resolve */
for (const file of htmlFiles) {
  const html = readFileSync(file, "utf8");
  for (const m of html.matchAll(/\shref="([^"]+)"/g)) {
    const href = decode(m[1]);
    if (!href.startsWith("/") || href.startsWith("//") || href.startsWith("/api/")) continue;
    const url = new URL(href, SITE);
    const target = resolvePath(url.pathname);
    check(Boolean(target), `${rel(file)}: broken link ${href}`);
    if (target && url.hash && target.endsWith(".html")) {
      const ids = pageIds.get(rel(target));
      check(!ids || ids.has(decodeURIComponent(url.hash.slice(1))), `${rel(file)}: link ${href} points to a missing #${url.hash.slice(1)}`);
    }
  }
  for (const m of html.matchAll(/\shref="#([^"]+)"/g))
    check(pageIds.get(rel(file))?.has(decodeURIComponent(m[1])), `${rel(file)}: in-page link #${m[1]} has no target`);
}

/* No secrets or server-only names in shipped files */
for (const file of files.filter((f) => /\.(html|js|css|json|xml|txt)$/.test(f))) {
  const text = readFileSync(file, "utf8");
  check(!/AIza[0-9A-Za-z_-]{30,}|ghp_[0-9A-Za-z]{30,}|\bre_[0-9A-Za-z]{20,}/.test(text), `${rel(file)}: looks like a secret`);
}

/* Page weight budgets (compressed JS, CSS and HTML; preloaded fonts and every <img> src as served) */
const gz = (buf) => gzipSync(buf).length;
const fileAt = (src) => path.join(dist, src.split("?")[0]);
/** Bytes a page loads before any interaction: entry scripts and their static imports (dynamic imports load on demand). */
function pageWeight(html) {
  const scripts = new Set(
    [
      ...html.matchAll(/<script[^>]+src="(\/[^"]+\.js)"/g),
      ...html.matchAll(/<link[^>]+rel="modulepreload"[^>]+href="(\/[^"]+\.js)"/g),
      ...html.matchAll(/(?:component|renderer)-url="(\/[^"]+\.js)"/g),
    ].map((m) => m[1]),
  );
  const seen = new Set();
  const queue = [...scripts];
  let js = 0;
  while (queue.length) {
    const src = queue.shift();
    if (seen.has(src)) continue;
    seen.add(src);
    if (!existsSync(fileAt(src))) {
      check(false, `script missing: ${src}`);
      continue;
    }
    const code = readFileSync(fileAt(src));
    js += gz(code);
    for (const m of code.toString("utf8").matchAll(/(?:from|import)\s*["']\.\/([^"']+\.js)["']/g)) queue.push(path.posix.join(path.posix.dirname(src), m[1]));
  }
  for (const m of html.matchAll(/<script(?![^>]*src)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)) js += gz(m[1]);
  const css = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="(\/[^"]+\.css)"/g)].reduce((n, m) => n + (existsSync(fileAt(m[1])) ? gz(readFileSync(fileAt(m[1]))) : 0), 0);
  const font = [...html.matchAll(/<link[^>]+rel="preload"[^>]+href="(\/[^"]+\.woff2)"/g)].reduce((n, m) => n + (existsSync(fileAt(m[1])) ? readFileSync(fileAt(m[1])).length : 0), 0);
  const img = [...new Set([...html.matchAll(/<img[^>]*\ssrc="(\/[^"]+)"/g)].map((m) => m[1]))].reduce((n, src) => n + (existsSync(fileAt(src)) ? readFileSync(fileAt(src)).length : 0), 0);
  return { js, css, html: gz(html), font, img };
}

const budgetsFile = path.join(root, "scripts/page-budgets.json");
const writeBudgets = process.argv.includes("--write-budgets");
const budgets = existsSync(budgetsFile) ? JSON.parse(readFileSync(budgetsFile, "utf8")) : {};
const measured = {};
for (const file of htmlFiles.sort()) {
  const route = "/" + rel(file).replace(/index\.html$/, "").replace(/\.html$/, "");
  measured[route] = pageWeight(readFileSync(file, "utf8"));
}
const KINDS = ["js", "css", "html", "font", "img"];
if (writeBudgets) {
  // Budgets are the current measurement plus 15%, rounded up to the next KiB.
  const next = Object.fromEntries(Object.entries(measured).map(([r, w]) => [r, Object.fromEntries(KINDS.map((k) => [k, Math.ceil((w[k] * 1.15) / 1024) * 1024 || 1024]))]));
  writeFileSync(budgetsFile, `${JSON.stringify(next, null, 2)}\n`);
  console.log(`Wrote ${Object.keys(next).length} page budgets to scripts/page-budgets.json.`);
}
const kib = (n) => (n / 1024).toFixed(1).padStart(6);
const table = [`${"page".padEnd(52)}${KINDS.map((k) => k.padStart(8)).join("")}   (KiB; budget in brackets when over)`];
for (const [route, w] of Object.entries(measured)) {
  const b = (writeBudgets ? null : budgets[route]) ?? null;
  check(writeBudgets || Boolean(b), `${route}: no size budget in scripts/page-budgets.json (run with --write-budgets after review)`);
  const cells = KINDS.map((k) => {
    const over = b && w[k] > b[k];
    check(!over, `${route}: ${k} is ${kib(w[k]).trim()} KiB, over its ${(b?.[k] ?? 0) / 1024} KiB budget`);
    return over ? `${kib(w[k])}[${b[k] / 1024}]` : kib(w[k]).padStart(8);
  });
  table.push(`${route.padEnd(52)}${cells.join("")}`);
}
const homeBytes = measured["/"].js;
check(homeBytes <= HOME_JS_BUDGET, `homepage JavaScript is ${(homeBytes / 1024).toFixed(1)} KiB gzip; budget ${HOME_JS_BUDGET / 1024} KiB`);
console.log(table.join("\n"));
// CI uploads the table as an artifact.
if (process.env.PAGE_WEIGHTS_OUT) writeFileSync(path.resolve(process.env.PAGE_WEIGHTS_OUT), `${table.join("\n")}\n`);

if (failures.length) {
  console.error(`Build verification failed (${failures.length}):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log(`Build verification passed: ${htmlFiles.length} pages, ${locs.length} sitemap URLs, homepage JS ${(homeBytes / 1024).toFixed(1)} KiB gzip (budget ${HOME_JS_BUDGET / 1024} KiB).`);
