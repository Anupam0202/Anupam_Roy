#!/usr/bin/env node
/**
 * Renders the Open Graph images in public/og/ (1200 × 630) from the site's
 * own fonts and colours. Re-run after changing a title or thesis:
 *   node scripts/generate-og.mjs
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const here = path.dirname(fileURLToPath(import.meta.url));
const siteHost = new URL(JSON.parse(readFileSync(path.join(here, "../../proof-atlas-core/src/data/site.json"), "utf8")).url).host;
const require = createRequire(import.meta.url);
const font = (spec) => readFileSync(require.resolve(spec)).toString("base64");
const manrope = font("@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2");
const newsreader = font("@fontsource-variable/newsreader/files/newsreader-latin-wght-italic.woff2");
const plex = font("@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2");

/** Cards are defined once in src/lib/og-cards.json, which the layout also reads for alt text. */
const CARDS = Object.values(JSON.parse(readFileSync(path.join(here, "../src/lib/og-cards.json"), "utf8")));

const html = (c) => `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Manrope;src:url(data:font/woff2;base64,${manrope}) format("woff2");font-weight:200 800}
@font-face{font-family:Newsreader;font-style:italic;src:url(data:font/woff2;base64,${newsreader}) format("woff2");font-weight:200 800}
@font-face{font-family:Plex;src:url(data:font/woff2;base64,${plex}) format("woff2");font-weight:500}
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;background:#f2f0e8;color:#182321;font-family:Manrope;display:grid;grid-template-rows:auto 1fr auto;padding:64px 72px;position:relative;overflow:hidden}
.top{display:flex;align-items:center;gap:16px;font-family:Plex;font-size:22px;letter-spacing:.08em;text-transform:uppercase;color:#53605a}
.dot{width:18px;height:18px;border-radius:50%;background:#d9f28b;box-shadow:0 0 0 6px #182321}
h1{font-size:132px;font-weight:750;letter-spacing:-.045em;line-height:.95;align-self:end}
p{font-size:44px;line-height:1.2;margin-top:28px;max-width:960px;font-weight:500;text-wrap:balance}
em{font-family:Newsreader;font-style:italic;font-weight:500;color:#3a53b4}
.foot{display:flex;justify-content:space-between;font-family:Plex;font-size:22px;color:#53605a;border-top:2px solid #cbd0c6;padding-top:22px;margin-top:40px}
.rings,.rings::before,.rings::after{position:absolute;border-radius:50%;border:2px solid #dee1d8}
.rings{right:-140px;top:-140px;width:520px;height:520px;z-index:0}
.rings::before,.rings::after{content:"";inset:-62px}
.rings::after{inset:-124px}
body>div:not(.rings){position:relative;z-index:1}
</style></head><body><div class="rings"></div>
<div class="top"><span class="dot"></span>${c.eyebrow}</div>
<div><h1>${c.title}</h1><p>${c.thesis}</p></div>
<div class="foot"><span>${siteHost}</span><span>Every claim linked to its evidence</span></div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const card of CARDS) {
  await page.setContent(html(card), { waitUntil: "load" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(here, "../public/og", card.file), type: "png" });
  console.log(`public/og/${card.file}`);
}
await browser.close();
