import { expect, test, type Page } from "@playwright/test";
import { STATIC_ROUTES } from "../../src/lib/routes";

/** The spec's viewports plus the two narrowest phones in common use. */
const VIEWPORTS: Array<[number, number]> = [
  [320, 720],
  [360, 800],
  [375, 812],
  [390, 844],
  [768, 1024],
  [1024, 768],
  [1280, 800],
  [1440, 900],
  // A 1920 px laptop screen at 125% display scaling, where the owner saw clipped hero labels.
  [1536, 864],
  [1920, 1080],
];
const ROUTES = [...STATIC_ROUTES, "/no-such-page/"];

interface LayoutReport {
  overflowing: string[];
  clippedText: string[];
  escapedText: string[];
  wrappedControls: string[];
  orphanHeadings: string[];
  stretchedHeadings: string[];
}

/**
 * Layout defects that a screenshot would show, measured in the page:
 * - overflowing: elements sticking out past the viewport (outside scroll containers);
 * - clippedText: text wider than its own box (cut off or spilling out);
 * - escapedText: rendered text reaching past the box drawn around it (a button, card,
 *   chip or clipping container), including inline text that clippedText cannot see;
 * - wrappedControls: segmented controls whose buttons wrapped onto several rows;
 * - orphanHeadings: h1/h2 headings ending in a single short word under a line of three or more words;
 * - stretchedHeadings: headings with an italic serif phrase that are taller than a whole number
 *   of lines, because the second font pushed their lines apart.
 */
async function inspect(page: Page): Promise<LayoutReport> {
  return page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const describe = (el: Element) => `${el.tagName.toLowerCase()}${el.classList.length ? `.${[...el.classList].join(".")}` : ""} “${(el.textContent ?? "").trim().slice(0, 40)}”`;
    const inScroller = (el: Element | null): boolean => {
      for (let a = el?.parentElement; a && a !== document.body; a = a.parentElement) {
        const o = getComputedStyle(a).overflowX;
        if (o === "auto" || o === "scroll") return true;
      }
      return false;
    };
    const visible = (el: Element) => {
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      // 1 px boxes are the visually-hidden pattern (screen-reader text), not visible layout.
      return r.width > 1 && r.height > 1 && s.visibility !== "hidden" && !el.closest(".visually-hidden, [hidden], dialog:not([open])");
    };
    // Shapes and labels inside a drawing are positioned by the SVG itself; the drawing's own box is checked.
    const insideSvg = (el: Element) => el.tagName.toLowerCase() !== "svg" && Boolean(el.closest("svg"));

    const overflowing = [...document.querySelectorAll("body *")]
      .filter((el) => visible(el) && !insideSvg(el) && el.getBoundingClientRect().right > width + 1 && !inScroller(el) && getComputedStyle(el).position !== "fixed")
      .map(describe);

    const clippedText = [...document.querySelectorAll("body *")]
      .filter(
        (el) =>
          el.children.length === 0 &&
          (el.textContent ?? "").trim().length > 0 &&
          visible(el) &&
          !el.closest("svg") &&
          !inScroller(el) &&
          !["INPUT", "TEXTAREA", "SELECT", "OPTION", "SCRIPT", "STYLE", "CODE", "PRE"].includes(el.tagName) &&
          !["auto", "scroll"].includes(getComputedStyle(el).overflowX) &&
          el.scrollWidth > el.clientWidth + 1 &&
          getComputedStyle(el).display !== "inline",
      )
      .map(describe);

    // The nearest ancestor that draws a box (border or background) or clips its content.
    const drawsBox = (el: Element) => {
      const s = getComputedStyle(el);
      const border = (["Top", "Right", "Bottom", "Left"] as const).some((side) => parseFloat(s[`border${side}Width`]) > 0 && s[`border${side}Style`] !== "none");
      const background = s.backgroundColor !== "rgba(0, 0, 0, 0)" && s.backgroundColor !== "transparent";
      return border || background || s.overflowX !== "visible" || s.overflowY !== "visible";
    };
    const escapedText = new Set<string>();
    const texts = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = texts.nextNode(); n; n = texts.nextNode()) {
      const el = n.parentElement;
      if (!el || !(n.textContent ?? "").trim() || !visible(el) || inScroller(el)) continue;
      if (el.closest("svg, script, style, noscript, input, textarea, select, option, code, pre")) continue;
      let box: Element | null = el;
      while (box && box !== document.body && !drawsBox(box)) box = box.parentElement;
      if (!box || box === document.body || ["auto", "scroll"].includes(getComputedStyle(box).overflowX)) continue;
      const b = box.getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(n);
      const escapes = [...range.getClientRects()].some((r) => r.width >= 1 && (r.left < b.left - 2 || r.right > b.right + 2));
      if (escapes) escapedText.add(`${describe(el)} in ${describe(box)}`);
    }

    const wrappedControls = [...document.querySelectorAll(".segmented")]
      .filter((el) => visible(el))
      .filter((el) => new Set([...el.children].filter((c) => visible(c)).map((c) => Math.round((c as HTMLElement).offsetTop))).size > 1)
      .map(describe);

    const orphanHeadings = [...document.querySelectorAll("main h1, main h2")]
      .filter((h) => visible(h))
      .filter((h) => {
        const words: DOMRect[] = [];
        const walker = document.createTreeWalker(h, NodeFilter.SHOW_TEXT);
        for (let n = walker.nextNode(); n; n = walker.nextNode()) {
          const text = n.textContent ?? "";
          for (const m of text.matchAll(/\S+/g)) {
            const range = document.createRange();
            range.setStart(n, m.index!);
            range.setEnd(n, m.index! + m[0].length);
            const rect = range.getClientRects()[0];
            if (rect) words.push(rect);
          }
        }
        if (words.length < 4) return false;
        // Group word boxes into lines and measure each line's width.
        const lines: Array<{ top: number; left: number; right: number; words: number }> = [];
        for (const r of words) {
          const line = lines.find((l) => Math.abs(l.top - r.top) < r.height / 2);
          if (line) {
            line.left = Math.min(line.left, r.left);
            line.right = Math.max(line.right, r.right);
            line.words += 1;
          } else lines.push({ top: r.top, left: r.left, right: r.right, words: 1 });
        }
        lines.sort((a, b) => a.top - b.top);
        if (lines.length < 2) return false;
        const last = lines[lines.length - 1];
        const previous = lines[lines.length - 2];
        // A lone short word under a long line; one long word under a line of equal width is balanced, not orphaned.
        return last.words === 1 && previous.words >= 3 && last.right - last.left < 0.35 * (previous.right - previous.left);
      })
      .map(describe);

    const stretchedHeadings = [...document.querySelectorAll("main :is(h1, h2):has(.serif)")]
      .filter((h) => visible(h))
      .filter((h) => {
        const lineHeight = parseFloat(getComputedStyle(h).lineHeight);
        if (!Number.isFinite(lineHeight)) return false;
        const height = h.getBoundingClientRect().height;
        return Math.abs(height - Math.round(height / lineHeight) * lineHeight) > 2;
      })
      .map(describe);

    return { overflowing, clippedText, escapedText: [...escapedText], wrappedControls, orphanHeadings, stretchedHeadings };
  });
}

for (const colorScheme of ["light", "dark"] as const) {
  for (const [width, height] of VIEWPORTS) {
    test.describe(`${width}×${height} ${colorScheme}`, () => {
      test.use({ viewport: { width, height }, colorScheme });
      for (const route of ROUTES) {
        test(route, async ({ page }) => {
          await page.goto(route);
          await page.waitForLoadState("networkidle");
          await page.evaluate(() => document.querySelectorAll("details").forEach((d) => (d.open = true)));
          expect(await inspect(page)).toEqual({ overflowing: [], clippedText: [], escapedText: [], wrappedControls: [], orphanHeadings: [], stretchedHeadings: [] });
        });
      }
    });
  }
}

test.describe("navigation adapts to width", () => {
  test("phones get the menu button, desktops the full nav", async ({ browser }) => {
    const phone = await browser.newPage({ viewport: { width: 375, height: 800 } });
    await phone.goto("/");
    await expect(phone.getByRole("button", { name: /menu/i })).toBeVisible();
    await expect(phone.getByRole("navigation", { name: "Primary" })).toBeHidden();
    const desktop = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await desktop.goto("/");
    await expect(desktop.getByRole("navigation", { name: "Primary" })).toBeVisible();
    await expect(desktop.getByRole("button", { name: /menu/i })).toBeHidden();
  });
});

test.describe("target sizes", () => {
  // WCAG 2.5.8: standalone links and buttons that were 22 px tall are now at least 24 px.
  const cases: Array<[string, string]> = [
    ["/portfolio/nexusrag/", "a.target-24"],
    ["/portfolio/plantpal/", "a.target-24"],
    ["/sources/", "a.permalink"],
  ];
  for (const [route, selector] of cases) {
    test(`${selector} on ${route} is at least 24 px tall`, async ({ page }) => {
      await page.goto(route);
      const heights = await page.locator(selector).evaluateAll((els) => els.map((el) => el.getBoundingClientRect().height));
      expect(heights.length).toBeGreaterThan(0);
      expect(Math.min(...heights)).toBeGreaterThanOrEqual(24);
    });
  }

  test("each evidence link on NexusRAG has its own accessible name", async ({ page }) => {
    await page.goto("/portfolio/nexusrag/");
    const names = await page.locator("a.target-24").evaluateAll((els) => els.map((el) => el.textContent?.trim()));
    expect(new Set(names).size).toBe(names.length);
  });

  test("Restore example weights in Dijkstra is at least 24 px tall", async ({ page }) => {
    await page.goto("/lab/dijkstra/");
    await expect(page.locator("astro-island[ssr]")).toHaveCount(0);
    await page.getByText("Edit edge weights").click();
    const box = await page.getByRole("button", { name: "Restore example weights" }).boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(24);
  });
});
