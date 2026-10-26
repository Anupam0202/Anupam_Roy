#!/usr/bin/env node
/**
 * Renders the PNG icons in public/ from public/favicon.svg. Re-run after
 * changing the SVG:
 *   node scripts/generate-icons.mjs
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../public");
const svg = readFileSync(path.join(publicDir, "favicon.svg"), "utf8");
// Touch and manifest icons get a solid square: platforms add their own rounding.
const ICONS = [
  { file: "favicon-32.png", size: 32, padded: false },
  { file: "apple-touch-icon.png", size: 180, padded: true },
  { file: "icon-192.png", size: 192, padded: true },
  { file: "icon-512.png", size: 512, padded: true },
];

const browser = await chromium.launch();
for (const icon of ICONS) {
  const page = await browser.newPage({ viewport: { width: icon.size, height: icon.size } });
  const inner = icon.padded ? Math.round(icon.size * 0.84) : icon.size;
  await page.setContent(
    `<!doctype html><html><body style="margin:0;width:${icon.size}px;height:${icon.size}px;display:grid;place-items:center;background:${icon.padded ? "#182321" : "transparent"}">` +
      svg.replace("<svg ", `<svg width="${inner}" height="${inner}" `) +
      "</body></html>",
  );
  await page.screenshot({ path: path.join(publicDir, icon.file), omitBackground: !icon.padded });
  console.log(`public/${icon.file}`);
  await page.close();
}
await browser.close();
