import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { STATIC_ROUTES } from "../../src/lib/routes";

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"];

async function audit(page: import("@playwright/test").Page) {
  // Hydrate islands and open every disclosure so hidden content is checked too.
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => document.querySelectorAll("details").forEach((d) => (d.open = true)));
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  return violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.length} × ${v.nodes[0]?.target.join(" ")} — ${v.help}`);
}

for (const scheme of ["light", "dark"] as const) {
  test.describe(`axe, ${scheme} theme`, () => {
    test.use({ colorScheme: scheme });
    for (const route of [...STATIC_ROUTES, "/no-such-page/"]) {
      test(route, async ({ page }) => {
        await page.goto(route);
        expect(await audit(page)).toEqual([]);
      });
    }
  });
}

test.describe("mobile", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("menu dialog is accessible, traps focus and returns it", async ({ page }) => {
    await page.goto("/");
    const open = page.getByRole("button", { name: /menu/i });
    await open.click();
    const dialog = page.getByRole("dialog", { name: "Site menu" });
    await expect(dialog).toBeVisible();
    expect(await audit(page)).toEqual([]);
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(open).toBeFocused();
  });

  for (const route of STATIC_ROUTES) {
    test(`axe at phone width: ${route}`, async ({ page }) => {
      await page.goto(route);
      expect(await audit(page)).toEqual([]);
    });
  }
});

test("the first Tab reaches the skip link, which moves focus to main content", async ({ page }) => {
  await page.goto("/experience/");
  await page.keyboard.press("Tab");
  const skip = page.locator(".skip-link");
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main$/);
});

/* The same rules after interaction: results, errors, list views and the open menu. */
test.describe("axe in interacted states", () => {
  const hydrated = (page: import("@playwright/test").Page) => expect(page.locator("astro-island[ssr]")).toHaveCount(0);

  test("document workbench with results", async ({ page }) => {
    await page.goto("/workbench/documents/");
    await hydrated(page);
    await page.getByRole("button", { name: "Load synthetic-retrieval-notes.md" }).click();
    await page.getByRole("button", { name: "Load synthetic-incident-runbook.txt" }).click();
    await page.getByLabel("Question or phrase").fill("scanned PDF");
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await expect(page.locator(".result").first()).toBeVisible();
    expect(await audit(page)).toEqual([]);
  });

  test("repository tool with results, in list view, and with an input error", async ({ page }) => {
    const observedAt = "2026-10-25T12:00:00.000Z";
    await page.route("**/api/repository/analyze", (route) =>
      route.fulfill({
        json: {
          repository: { owner: "octo", name: "demo", url: "https://github.com/octo/demo", defaultBranch: "main", license: { spdx: "MIT", name: "MIT License" } },
          evidence: [
            { id: "repository", kind: "repository", label: "octo/demo", url: "https://github.com/octo/demo", observedAt },
            { id: "readme:README.md", kind: "readme", label: "README.md", path: "README.md", observedAt },
            { id: "manifest:package.json", kind: "manifest", label: "package.json", path: "package.json", observedAt, detail: "npm package manifest" },
          ],
          coverage: { overview: "observed", license: "observed", readme: "observed", releases: "not_found", languages: "not_requested", manifests: "observed", dependencies: "not_requested", vulnerabilities: "unsupported" },
          warnings: [],
          source: { provider: "github", fetchedAt: observedAt, cache: "miss" },
        },
      }),
    );
    await page.goto("/workbench/repository/");
    await hydrated(page);
    const input = page.getByLabel("Public GitHub repository");
    await input.fill("not a repo!");
    await input.press("Enter");
    await expect(input).toHaveAttribute("aria-invalid", "true");
    expect(await audit(page)).toEqual([]);
    await input.fill("octo/demo");
    await input.press("Enter");
    await expect(page.getByRole("heading", { name: /octo\/demo/ })).toBeVisible();
    expect(await audit(page)).toEqual([]);
    await page.getByRole("button", { name: "List", exact: true }).click();
    expect(await audit(page)).toEqual([]);
  });

  test("citation tool with an error, a record and the collection", async ({ page }) => {
    await page.route("**/api/citations/resolve", (route) =>
      route.fulfill({
        json: {
          record: { doi: "10.1234/abc", title: "A study of things", authors: [{ given: "Ada", family: "Lovelace" }], issued: { year: 2020 }, type: "journal-article", url: "https://doi.org/10.1234/abc", provider: "crossref", fetchedAt: "2026-10-25T12:00:00.000Z", missing: [] },
          warnings: [],
          source: { cache: "miss" },
        },
      }),
    );
    await page.goto("/workbench/citations/");
    await hydrated(page);
    await page.getByLabel("DOI").fill("not-a-doi");
    await page.getByRole("button", { name: "Resolve", exact: true }).click();
    await expect(page.getByRole("alert")).toBeVisible();
    expect(await audit(page)).toEqual([]);
    await page.getByLabel("DOI").fill("10.1234/abc");
    await page.getByRole("button", { name: "Resolve", exact: true }).click();
    await page.getByRole("button", { name: "Add to collection" }).click();
    expect(await audit(page)).toEqual([]);
  });

  test("credentials in list view and with no matches", async ({ page }) => {
    await page.goto("/credentials/?view=list");
    await hydrated(page);
    expect(await audit(page)).toEqual([]);
    await page.getByRole("search", { name: "Filter credentials" }).getByLabel("Search titles, issuers and IDs").fill("zzzz-no-such-credential");
    await expect(page.getByText("No records match these filters.")).toBeVisible();
    expect(await audit(page)).toEqual([]);
  });

  test("contact form with field errors", async ({ page }) => {
    await page.route("**/api/status", (route) => route.fulfill({ json: { contact: { configured: true } } }));
    await page.goto("/contact/");
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByText("Enter your name.")).toBeVisible();
    expect(await audit(page)).toEqual([]);
  });

  test("Ask the Atlas with ledger evidence", async ({ page }) => {
    await page.goto("/sources/");
    await hydrated(page);
    await page.getByLabel(/Your question/).fill("Are the credentials verified?");
    await page.getByRole("button", { name: "Ask", exact: true }).click();
    await expect(page.locator(".atlas-evidence")).toBeVisible();
    expect(await audit(page)).toEqual([]);
  });

  test.describe("dark theme at phone width", () => {
    test.use({ colorScheme: "dark", viewport: { width: 375, height: 812 } });
    test("the open menu", async ({ page }) => {
      await page.goto("/portfolio/");
      await page.getByRole("button", { name: "Open menu" }).click();
      await expect(page.getByRole("dialog", { name: "Site menu" })).toBeVisible();
      expect(await audit(page)).toEqual([]);
    });
  });
});
