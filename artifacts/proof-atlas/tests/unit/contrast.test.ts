import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("../../src/styles/tokens.css", import.meta.url), "utf8");

/** Returns the declarations inside the first block that follows `selector`. */
function block(selector: string): string {
  const at = css.indexOf(selector);
  if (at === -1) throw new Error(`Selector not found: ${selector}`);
  const open = css.indexOf("{", at);
  return css.slice(open + 1, css.indexOf("}", open));
}

function tokens(body: string, base: Record<string, string> = {}): Record<string, string> {
  const out = { ...base };
  for (const m of body.matchAll(/--([\w-]+):\s*([^;]+);/g)) out[m[1]] = m[2].trim();
  return out;
}

function resolve(map: Record<string, string>, name: string): string {
  let value = map[name];
  for (let i = 0; value && i < 5; i += 1) {
    const ref = /^var\(--([\w-]+)\)$/.exec(value);
    if (!ref) break;
    value = map[ref[1]];
  }
  if (!value || !/^#[0-9a-f]{6}$/i.test(value)) throw new Error(`--${name} is not a 6-digit hex colour (${value})`);
  return value;
}

const channel = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => channel(parseInt(hex.slice(i, i + 2), 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const light = tokens(block(':root[data-theme="light"]'));
const dark = tokens(block(':root[data-theme="dark"]'), light);
const mediaDark = tokens(block(':root:not([data-theme="light"])'), light);

/** Text (≥ 4.5:1) and UI-boundary (≥ 3:1) pairs: [foreground, background]. */
const TEXT: Array<[string, string]> = [
  ["ink", "paper"],
  ["ink", "surface"],
  ["ink-muted", "paper"],
  ["ink-muted", "surface"],
  ["ink-muted", "line-soft"],
  ["paper", "ink"],
  ["tech-ink", "paper"],
  ["tech-ink", "surface"],
  ["tech-ink", "tech-soft"],
  ["copper-ink", "paper"],
  ["copper-ink", "copper-soft"],
  ["danger", "paper"],
  ["danger", "surface"],
  ["signal-ink", "signal"],
  ["status-verified", "status-verified-bg"],
  ["status-documented", "status-documented-bg"],
  ["status-owner", "status-owner-bg"],
  ["status-illustrative", "status-illustrative-bg"],
  ["status-warning", "status-warning-bg"],
  ["selection-ink", "selection-bg"],
];
const UI: Array<[string, string]> = [
  ["line-strong", "paper"],
  ["line-strong", "surface"],
  ["focus-ring", "paper"],
  ["focus-ring", "surface"],
];

describe.each([
  ["light", light],
  ["dark", dark],
])("%s theme contrast (WCAG 2.2 AA)", (_name, map) => {
  it.each(TEXT)("text --%s on --%s is at least 4.5:1", (fg, bg) => {
    expect(contrast(resolve(map, fg), resolve(map, bg))).toBeGreaterThanOrEqual(4.5);
  });
  it.each(UI)("boundary --%s on --%s is at least 3:1", (fg, bg) => {
    expect(contrast(resolve(map, fg), resolve(map, bg))).toBeGreaterThanOrEqual(3);
  });
});

describe("dark theme definitions", () => {
  it("match between the media query and the explicit toggle", () => {
    expect(mediaDark).toEqual(dark);
  });
  it("computes the WCAG reference values", () => {
    expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrast("#777777", "#ffffff")).toBeCloseTo(4.48, 2);
  });
});
