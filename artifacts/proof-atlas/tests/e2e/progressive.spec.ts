import { expect, test } from "@playwright/test";
import { claims } from "@workspace/proof-atlas-core/data/claims";

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the home page tells the whole story", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator(".sbc")).toHaveAttribute("data-stage", "5");
    await expect(page.getByText("Approximate improvements reported by Anupam; not independently audited.").first()).toBeVisible();
  });

  test("experience shows every role, credentials list all 74 records", async ({ page }) => {
    await page.goto("/experience/");
    await expect(page.getByText("AI/ML Analyst").first()).toBeVisible();
    await expect(page.getByText("Associate Software Engineer").first()).toBeVisible();
    await page.goto("/credentials/");
    await expect(page.locator(".cred")).toHaveCount(74);
  });

  test("the sources ledger lists every public claim", async ({ page }) => {
    await page.goto("/sources/");
    for (const c of claims.filter((x) => x.public)) await expect(page.locator(`[id="${c.id}"]`)).toHaveCount(1);
  });

  test("Lab results are computed at build time", async ({ page }) => {
    await page.goto("/lab/retrieval-fusion/");
    await expect(page.locator(".lab-summary").first()).toContainText("D1, D3, D2, D4");
    await page.goto("/lab/binary-search/");
    await page.getByText(/All \d+ steps as a table/).click();
    await expect(page.locator("details table tbody tr")).toHaveCount(2);
  });

  // Playwright's JS-off mode does not render <noscript>, so check the served HTML.
  test("tools and the contact form explain what needs JavaScript", async ({ request }) => {
    for (const path of ["/workbench/documents/", "/workbench/repository/", "/workbench/citations/"])
      expect(await (await request.get(path)).text()).toMatch(/<noscript><p[^>]*>This tool needs JavaScript\. The rest of the site works without it\./);
    expect(await (await request.get("/contact/")).text()).toMatch(/<noscript>\s*<p[^>]*>The form needs JavaScript\. Please email <a href="mailto:/);
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });
  test("no animation or smooth scrolling runs", async ({ page }) => {
    await page.goto("/");
    const moving = await page.evaluate(() =>
      [...document.querySelectorAll("*")]
        .map((el) => getComputedStyle(el))
        .filter((s) => s.animationName !== "none" && parseFloat(s.animationDuration) > 0.001)
        .map((s) => s.animationName),
    );
    expect(moving).toEqual([]);
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe("auto");
  });
});

test.describe("theme", () => {
  test("the toggle switches theme and remembers it", async ({ page }) => {
    await page.goto("/");
    const before = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    await page.getByRole("button", { name: /theme/i }).click();
    const after = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(after).not.toBe(before);
    await page.reload();
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(after);
  });
});

test.describe("keyboard", () => {
  test("experience tabs follow the ARIA tabs pattern and remember the view in the URL", async ({ page }) => {
    await page.goto("/experience/");
    const tabs = page.getByRole("tablist", { name: "Experience views" }).getByRole("tab");
    await expect(tabs.first()).toHaveAttribute("aria-selected", "true");
    await tabs.first().focus();
    await page.keyboard.press("ArrowRight");
    await expect(tabs.nth(1)).toBeFocused();
    await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("#view-systems")).toBeVisible();
    await expect(page.locator("#view-overview")).toBeHidden();
    await expect(page).toHaveURL(/[?&]view=systems/);
    await page.keyboard.press("End");
    await expect(tabs.last()).toBeFocused();
    await page.keyboard.press("Home");
    await expect(tabs.first()).toBeFocused();
    await page.goto("/experience/?view=technologies");
    await expect(page.locator("#view-technologies")).toBeVisible();
  });
});
