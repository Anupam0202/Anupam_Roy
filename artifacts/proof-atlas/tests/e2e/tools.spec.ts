import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

/* Workbench and Ask the Atlas UI states, with the API mocked at the network layer. */

const repo = {
  repository: { owner: "octo", name: "demo", url: "https://github.com/octo/demo", defaultBranch: "main", license: { spdx: "MIT", name: "MIT License" } },
  evidence: [
    { id: "repository", kind: "repository", label: "octo/demo", url: "https://github.com/octo/demo", observedAt: "2026-10-25T12:00:00.000Z" },
    { id: "license", kind: "license", label: "License: MIT", observedAt: "2026-10-25T12:00:00.000Z" },
    { id: "readme:README.md", kind: "readme", label: "README.md", path: "README.md", observedAt: "2026-10-25T12:00:00.000Z" },
    { id: "readme-heading:0", kind: "readme-heading", label: "## Install", path: "README.md", observedAt: "2026-10-25T12:00:00.000Z" },
    { id: "language:TypeScript", kind: "language", label: "TypeScript", observedAt: "2026-10-25T12:00:00.000Z", detail: "90.0% of detected code bytes" },
    { id: "manifest:package.json", kind: "manifest", label: "package.json", path: "package.json", observedAt: "2026-10-25T12:00:00.000Z", detail: "npm package manifest" },
  ],
  coverage: { overview: "observed", license: "observed", readme: "observed", releases: "not_found", languages: "observed", manifests: "observed", dependencies: "not_requested", vulnerabilities: "unsupported" },
  warnings: [],
  source: { provider: "github", fetchedAt: "2026-10-25T12:00:00.000Z", cache: "miss" },
};

test.describe("Repository Evidence Graph", () => {
  test("validates input locally, then shows evidence, coverage and downloads", async ({ page }) => {
    const bodies: unknown[] = [];
    await page.route("**/api/repository/analyze", async (route) => {
      bodies.push(route.request().postDataJSON());
      await route.fulfill({ json: repo });
    });
    await page.goto("/workbench/repository/");
    const input = page.getByLabel("Public GitHub repository");
    await input.fill("https://evil.example/x/y");
    await input.press("Enter");
    await expect(page.locator(".error", { hasText: "Only github.com repository URLs are supported." })).toBeVisible();
    expect(bodies).toEqual([]);

    await input.fill("https://github.com/octo/demo");
    await input.press("Enter");
    await expect(page.getByRole("heading", { name: /octo\/demo/ })).toBeFocused();
    expect(bodies[0]).toMatchObject({ owner: "octo", repo: "demo" });
    await expect(page.locator("table")).toContainText("Not inspected (out of scope)");
    await page.getByRole("button", { name: "List", exact: true }).click();
    await expect(page.locator(".evidence-tree")).toContainText("package.json");
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download CSV" }).click();
    expect((await download).suggestedFilename()).toBe("octo-demo-evidence.csv");
  });

  test("reads declared dependencies on request and looks up one package", async ({ page }) => {
    await page.route("**/api/repository/analyze", (route) => route.fulfill({ json: repo }));
    await page.route("**/api/repository/dependencies", (route) =>
      route.fulfill({
        json: {
          repository: { owner: "octo", name: "demo" },
          manifests: [
            { path: "package.json", ecosystem: "npm", state: "observed", count: 2 },
            { path: "pyproject.toml", ecosystem: "pypi", state: "not_found", count: 0 },
            { path: "requirements.txt", ecosystem: "pypi", state: "not_found", count: 0 },
          ],
          dependencies: [
            { ecosystem: "npm", name: "request", spec: "^2.88.0", scope: "runtime", manifest: "package.json", local: false },
            { ecosystem: "npm", name: "@workspace/core", spec: "workspace:*", scope: "runtime", manifest: "package.json", local: true },
          ],
          truncated: false,
          coverage: { dependencies: "observed", vulnerabilities: "unsupported" },
          notes: ["Versions are the declared ranges, not installed versions, so no vulnerability status is inferred."],
          source: { provider: "github", fetchedAt: "2026-10-25T12:00:00.000Z", cache: "miss" },
        },
      }),
    );
    const lookups: unknown[] = [];
    await page.route("**/api/packages/lookup", async (route) => {
      lookups.push(route.request().postDataJSON());
      await route.fulfill({
        json: {
          package: { ecosystem: "npm", name: "request", latestVersion: "2.88.2", license: "Apache-2.0", deprecated: "request has been deprecated", registryUrl: "https://www.npmjs.com/package/request", fetchedAt: "2026-10-25T12:00:00.000Z" },
          source: { provider: "npm", cache: "miss" },
        },
      });
    });
    await page.goto("/workbench/repository/");
    await page.getByLabel("Public GitHub repository").fill("octo/demo");
    await page.getByLabel("Public GitHub repository").press("Enter");
    const coverage = page.locator("table").first();
    await expect(coverage.getByRole("row", { name: /Declared dependencies/ })).toContainText("Not requested");
    await page.getByRole("button", { name: "Read declared dependencies" }).click();
    await expect(coverage.getByRole("row", { name: /Declared dependencies/ })).toContainText("Observed");
    await expect(page.getByText("Local or URL reference")).toBeVisible();
    await page.getByRole("button", { name: "Look up on npm request" }).click();
    await expect(page.getByText("Deprecated", { exact: true })).toBeVisible();
    expect(lookups).toEqual([{ ecosystem: "npm", name: "request" }]);
    const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(violations.map((v) => v.id)).toEqual([]);
  });

  test("explains rate limits with a retry time", async ({ page }) => {
    await page.route("**/api/repository/analyze", (route) =>
      route.fulfill({ status: 429, headers: { "Retry-After": "120" }, json: { error: "GitHub's rate limit was reached. Try again later." } }),
    );
    await page.goto("/workbench/repository/");
    await page.getByLabel("Public GitHub repository").fill("octo/demo");
    await page.getByLabel("Public GitHub repository").press("Enter");
    await expect(page.getByText(/rate limit was reached.*about 2 minute/)).toBeVisible();
  });
});

const record = {
  doi: "10.1234/abc",
  title: "A study of things",
  authors: [{ given: "Ada", family: "Lovelace" }],
  containerTitle: "Journal of Things",
  publisher: "Example Press",
  issued: { year: 2020, month: 5 },
  type: "journal-article",
  url: "https://doi.org/10.1234/abc",
  provider: "crossref",
  fetchedAt: "2026-10-25T12:00:00.000Z",
  missing: [],
};

test.describe("Citation Integrity", () => {
  test("resolves a DOI and exports BibTeX from the collection", async ({ page }) => {
    await page.route("**/api/citations/resolve", (route) => route.fulfill({ json: { record, warnings: [], source: { cache: "miss" } } }));
    await page.goto("/workbench/citations/");
    await page.getByLabel("DOI").fill("https://doi.org/10.1234/ABC");
    await page.getByRole("button", { name: "Resolve", exact: true }).click();
    await expect(page.getByRole("heading", { name: "A study of things" })).toBeVisible();
    await page.getByRole("button", { name: "Add to collection" }).click();
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "BibTeX", exact: true }).click();
    const text = (await (await download).createReadStream().then((s) => s.toArray())).map(String).join("");
    expect(text).toMatch(/@article\{lovelace2020/);
    expect(text).toContain("title = {A study of things}");
  });

  test("rejects malformed DOIs without calling the API", async ({ page }) => {
    let calls = 0;
    await page.route("**/api/citations/**", (route) => {
      calls += 1;
      return route.abort();
    });
    await page.goto("/workbench/citations/");
    await page.getByLabel("DOI").fill("not-a-doi");
    await page.getByRole("button", { name: "Resolve", exact: true }).click();
    await expect(page.getByRole("alert")).toBeVisible();
    expect(calls).toBe(0);
  });
});

test.describe("Ask the Atlas", () => {
  test("shows ledger evidence when AI is off (the default without a key)", async ({ page }) => {
    await page.goto("/sources/");
    await expect(page.locator("astro-island:not([ssr])")).toHaveCount(1);
    await page.getByLabel(/Your question/).fill("Are the credentials verified?");
    await page.getByRole("button", { name: "Ask", exact: true }).click();
    await expect(page.getByText("AI is turned off. Showing the closest ledger entries.")).toBeVisible();
    await expect(page.locator(".atlas-evidence a[href='#cred-records']")).toBeVisible();
  });

  test("renders cited answers as links to ledger entries", async ({ page }) => {
    await page.route("**/api/ai/ask", (route) =>
      route.fulfill({
        json: {
          mode: "ai",
          result: { answer: "The 74 records are backed by certificate PDFs [E1].", citationIds: ["E1"], state: "answered" },
          evidence: [{ id: "E1", claimId: "cred-records", title: "74 credential records", provenance: "repository_documented" }],
        },
      }),
    );
    await page.goto("/sources/");
    await expect(page.locator("astro-island:not([ssr])")).toHaveCount(1);
    await page.getByLabel(/Your question/).fill("Are the credentials verified?");
    await page.getByRole("button", { name: "Ask", exact: true }).click();
    const cite = page.getByRole("link", { name: /Source E1/ });
    await expect(cite).toHaveAttribute("href", "#cred-records");
    await cite.click();
    await expect(page.locator("#cred-records")).toBeInViewport();
  });
});
