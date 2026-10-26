import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { claims } from "@workspace/proof-atlas-core/data/claims";
import { projects } from "@workspace/proof-atlas-core/data/projects";
import { THEME_COLOR } from "../../src/lib/theme-script";

/* User flows for the defects fixed in this release, with the API mocked where a tool calls it. */

const credentials = JSON.parse(readFileSync(new URL("../../../proof-atlas-core/src/data/credentials.json", import.meta.url), "utf8")) as Array<{
  title: string;
  issuer: string;
  level: string;
  issuedOn: string;
  credentialId: string | null;
}>;
const searchable = (c: (typeof credentials)[number]) => `${c.title} ${c.issuer} ${c.level} ${c.credentialId ?? ""}`.toLowerCase();
const hydrated = (page: Page) => expect(page.locator("astro-island[ssr]")).toHaveCount(0);
const download = async (page: Page, click: () => Promise<void>) => {
  const pending = page.waitForEvent("download");
  await click();
  const stream = await (await pending).createReadStream();
  return Buffer.concat(await stream.toArray()).toString("utf8");
};

/* ---------- Contact ---------- */
test.describe("contact form", () => {
  const open = async (page: Page, configured = true) => {
    await page.route("**/api/status", (route) => route.fulfill({ json: { contact: { configured } } }));
    await page.goto("/contact/");
    if (configured) await expect(page.locator("form[data-contact-form]")).toBeVisible();
  };
  const fill = async (page: Page) => {
    await page.getByLabel("Name", { exact: true }).fill("Ada Lovelace");
    await page.getByLabel("Email", { exact: true }).fill("ada@example.com");
    await page.getByLabel("Subject", { exact: true }).fill("A role");
    await page.getByLabel("Message", { exact: true }).fill("Hello Anupam, I would like to talk about a role.");
  };
  const status = (page: Page) => page.locator("[data-status]");

  test("offers the email link instead of the form when the server cannot send mail", async ({ page }) => {
    await open(page, false);
    await expect(page.locator("[data-contact-unavailable]")).toBeVisible();
    await expect(page.locator("[data-contact-unavailable] a[href^='mailto:']")).toBeVisible();
    await expect(page.locator("form[data-contact-form]")).toBeHidden();
  });

  test("validates locally, focusing the first problem, and counts characters", async ({ page }) => {
    let calls = 0;
    await page.route("**/api/contact", (route) => {
      calls += 1;
      return route.abort();
    });
    await open(page);
    await page.getByRole("button", { name: "Send message" }).click();
    await expect(page.getByLabel("Name", { exact: true })).toBeFocused();
    await expect(page.getByLabel("Name", { exact: true })).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByText("Enter your name.")).toBeVisible();
    await page.getByLabel("Message", { exact: true }).fill("x".repeat(30));
    await expect(page.locator("[data-counter]")).toHaveText("30 / 5,000");
    expect(calls).toBe(0);
  });

  const failures: Array<[string, (route: import("@playwright/test").Route) => Promise<void>, RegExp]> = [
    ["a rejected field (400)", (r) => r.fulfill({ status: 400, json: { error: "Please provide a valid email address." } }), /^Please provide a valid email address\. You can also email \S+@\S+ directly\.$/],
    ["an unconfigured server (503)", (r) => r.fulfill({ status: 503, json: { error: "The contact form is not available right now. Please email Anupam directly." } }), /not available right now.*You can also email/],
    ["a rate limit (429)", (r) => r.fulfill({ status: 429, headers: { "Retry-After": "60" }, json: { error: "Too many" } }), /^Too many messages were sent from this connection\. Please wait a few minutes\. You can also email/],
    ["a dropped connection (offline)", (r) => r.abort("internetdisconnected"), /^The message could not be sent because the connection failed\. You can also email/],
  ];
  for (const [label, reply, expected] of failures) {
    test(`explains ${label} in plain language with an email link`, async ({ page }) => {
      await page.route("**/api/contact", reply);
      await open(page);
      await fill(page);
      await page.getByRole("button", { name: "Send message" }).click();
      await expect(status(page)).toHaveText(expected);
      await expect(status(page)).toHaveAttribute("data-tone", "error");
      await expect(status(page)).toBeFocused();
      await expect(status(page).locator("a[href^='mailto:']")).toBeVisible();
      await expect(page.getByLabel("Message", { exact: true })).not.toHaveValue("");
    });
  }

  test("sends by keyboard alone, confirms success and clears the form", async ({ page }) => {
    const bodies: unknown[] = [];
    await page.route("**/api/contact", async (route) => {
      bodies.push(route.request().postDataJSON());
      await route.fulfill({ json: { ok: true } });
    });
    await open(page);
    await page.getByLabel("Name", { exact: true }).focus();
    await page.keyboard.type("Ada Lovelace");
    await page.keyboard.press("Tab");
    await page.keyboard.type("ada@example.com");
    await page.keyboard.press("Tab");
    await page.keyboard.type("A role");
    await page.keyboard.press("Tab");
    await page.keyboard.type("Hello Anupam, I would like to talk about a role.");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Send message" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(status(page)).toHaveText("Sent. Thank you — Anupam will reply by email.");
    await expect(status(page)).toHaveAttribute("data-tone", "success");
    await expect(status(page)).toBeFocused();
    await expect(page.getByLabel("Message", { exact: true })).toHaveValue("");
    expect(bodies).toEqual([{ name: "Ada Lovelace", email: "ada@example.com", subject: "A role", message: "Hello Anupam, I would like to talk about a role.", company: "" }]);
  });
});

/* ---------- Credentials ---------- */
test.describe("credentials", () => {
  const index = (page: Page) => page.getByRole("search", { name: "Filter credentials" });
  const count = (page: Page) => page.locator(".cred-index [role=status]");
  /** The index has hydrated, and so has read the URL. */
  const ready = (page: Page) => hydrated(page);

  test("filters by search, issuer, issue year and verification, keeps the URL in step, and resets everything", async ({ page }) => {
    await page.goto("/credentials/");
    await ready(page);
    const form = index(page);
    await expect(count(page)).toHaveText(`${credentials.length} of ${credentials.length} records`);
    await form.getByLabel("Search titles, issuers and IDs").fill("generative");
    await expect(page).toHaveURL(/[?&]q=generative/);
    const afterSearch = Number((await count(page).textContent())!.split(" ")[0]);
    expect(afterSearch).toBeGreaterThan(0);
    expect(afterSearch).toBeLessThan(credentials.length);
    await form.getByLabel("Issued in").selectOption("2024");
    await expect(page).toHaveURL(/year=2024/);
    await expect(count(page)).toHaveText(
      `${credentials.filter((c) => c.issuedOn.startsWith("2024") && searchable(c).includes("generative")).length} of ${credentials.length} records`,
    );
    await form.getByLabel("Verification").selectOption({ index: 1 });
    await form.getByLabel("Sort").selectOption("title");
    await form.getByRole("button", { name: "List" }).click();
    await expect(page).toHaveURL(/check=/);
    await expect(page).toHaveURL(/sort=title/);
    await expect(page).toHaveURL(/view=list/);
    await expect(page.locator("ol.cred-list--list")).toHaveCount((await count(page).textContent())!.startsWith("0 ") ? 0 : 1);

    await form.getByLabel("Issuer", { exact: true }).selectOption({ index: 1 });
    await form.getByLabel("Search titles, issuers and IDs").fill("zzzz-no-such-credential");
    await expect(count(page)).toHaveText(`0 of ${credentials.length} records`);
    await expect(page.getByText("No records match these filters.")).toBeVisible();
    await page.getByRole("button", { name: "Reset filters" }).click();
    await expect(count(page)).toHaveText(`${credentials.length} of ${credentials.length} records`);
    await expect(form.getByRole("button", { name: "Grid" })).toHaveAttribute("aria-pressed", "true");
    await expect(page).toHaveURL(/\/credentials\/$/);
  });

  test("restores filters from the URL, and the hero search fills the index", async ({ page }) => {
    await page.goto("/credentials/?q=aws&view=list&sort=issued-asc");
    await ready(page);
    await expect(index(page).getByLabel("Search titles, issuers and IDs")).toHaveValue("aws");
    await expect(index(page).getByRole("button", { name: "List" })).toHaveAttribute("aria-pressed", "true");
    await expect(index(page).getByLabel("Sort")).toHaveValue("issued-asc");
    await page.goto("/credentials/");
    await ready(page);
    const hero = page.getByRole("search", { name: "Search all credentials" });
    await hero.getByRole("searchbox").fill("snowpro");
    await hero.getByRole("searchbox").press("Enter");
    await expect(index(page).getByLabel("Search titles, issuers and IDs")).toHaveValue("snowpro");
    await expect(index(page).getByLabel("Search titles, issuers and IDs")).toBeFocused();
  });

  test("works by keyboard alone", async ({ page }) => {
    await page.goto("/credentials/");
    await ready(page);
    const search = index(page).getByLabel("Search titles, issuers and IDs");
    await search.focus();
    await page.keyboard.type("azure");
    await page.keyboard.press("Tab");
    await expect(index(page).getByLabel("Issuer", { exact: true })).toBeFocused();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await expect(index(page).getByRole("button", { name: "Grid" })).toBeFocused();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    await expect(index(page).getByRole("button", { name: "List" })).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.press("Tab");
    await expect(index(page).getByRole("button", { name: "Reset" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(search).toHaveValue("");
  });

  test("shows issue dates only: no expiry wording, and nothing changes with the visitor's clock", async ({ page }) => {
    // Years after every listed issue date, so anything date-dependent would show.
    await page.clock.setFixedTime(new Date("2035-06-01T12:00:00Z"));
    await page.goto("/credentials/?status=expired");
    await ready(page);
    await expect(count(page)).toHaveText(`${credentials.length} of ${credentials.length} records`);
    expect(await page.locator("main").innerText()).not.toMatch(/expir|valid until|lapsed|lifecycle|as of today/i);
    await expect(page.locator(".cred-list > li")).toHaveCount(credentials.length);
    for (const card of await page.locator(".cred-list > li").all()) await expect(card).toContainText(/Issued on \d{1,2} \w+ \d{4}/);
    const featured = page.locator("[data-featured-item]");
    await expect(featured).toHaveCount(8);
    for (const item of await featured.all()) {
      await expect(item).toBeVisible();
      await expect(item).toContainText(/Issued on \d{1,2} \w+ \d{4}/);
    }
    const years = await page.locator("[data-year-count]").allTextContents();
    expect(years.map(Number).reduce((a, b) => a + b, 0)).toBe(credentials.length);
    for (const text of await page.locator("[aria-live]").allTextContents()) expect(text).not.toMatch(/today/i);
  });
});

/* ---------- Portfolio ---------- */
test.describe("portfolio index", () => {
  test("searches, filters by category, switches view and keeps the URL in step", async ({ page }) => {
    await page.goto("/portfolio/");
    const results = page.locator("[data-results]");
    await expect(results).toHaveText(`${projects.length} of ${projects.length} projects`);
    await page.getByRole("searchbox", { name: "Search" }).fill("rag");
    await expect(page).toHaveURL(/\?q=rag/);
    const shown = Number((await results.textContent())!.split(" ")[0]);
    expect(shown).toBeGreaterThan(0);
    expect(shown).toBeLessThan(projects.length);
    await page.getByRole("button", { name: "List", exact: true }).click();
    await expect(page.locator("[data-index]")).toHaveAttribute("data-view", "list");
    await expect(page).toHaveURL(/view=list/);
    await page.getByRole("searchbox", { name: "Search" }).fill("zzzz");
    await expect(page.locator("[data-empty]")).toBeVisible();
    await page.getByRole("button", { name: "Reset filters" }).click();
    await expect(results).toHaveText(`${projects.length} of ${projects.length} projects`);
    await expect(page.getByRole("searchbox", { name: "Search" })).toBeFocused();
    await page.goto("/portfolio/?category=AI%20%2F%20LLM&view=list#all-projects");
    await expect(page.getByRole("button", { name: "AI / LLM" })).toHaveAttribute("aria-pressed", "true");
    await expect(page).toHaveURL(/#all-projects$/);
  });

  test("works by keyboard alone", async ({ page }) => {
    await page.goto("/portfolio/");
    await page.getByRole("searchbox", { name: "Search" }).focus();
    await page.keyboard.type("plant");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "All", exact: true })).toBeFocused();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    await expect(page.locator("[data-category-group] [aria-pressed=true]")).not.toHaveText("All");
    await expect(page).toHaveURL(/category=/);
  });

  test("labels what was inspected for each project", async ({ page }) => {
    await page.goto("/portfolio/");
    const plate = page.locator("[data-project]").first();
    await expect(plate).toContainText(/Repository inspected \d{4}-\d{2}-\d{2}/);
    await expect(plate).toContainText(/last commit \d{4}-\d{2}-\d{2}/);
  });
});

/* ---------- Sources ---------- */
test.describe("sources ledger", () => {
  const total = claims.filter((c) => c.public).length;

  test("filters, shows an empty state with Reset, and reveals a hidden entry from a hash link", async ({ page }) => {
    await page.goto("/sources/");
    const count = page.locator("[data-count]");
    await expect(count).toHaveText(`${total} of ${total} entries`);
    await page.getByLabel("Evidence status").selectOption({ index: 1 });
    await expect(page).toHaveURL(/status=/);
    await page.locator("#ledger-q").fill("zzzz-nothing");
    await expect(count).toHaveText(`0 of ${total} entries`);
    await expect(page.locator("[data-empty]")).toBeVisible();
    await page.locator("[data-empty]").getByRole("button", { name: "Reset filters" }).click();
    await expect(count).toHaveText(`${total} of ${total} entries`);

    const target = claims.find((c) => c.public)!.id;
    await page.locator("#ledger-q").fill("zzzz-nothing");
    await expect(page.locator(`[id="${target}"]`)).toBeHidden();
    await page.evaluate((id) => (location.hash = id), target);
    await expect(page.locator(`[id="${target}"]`)).toBeVisible();
    await expect(count).toHaveText(`${total} of ${total} entries`);
  });

  test("opens a filtered-out entry from a link on load", async ({ page }) => {
    const target = claims.filter((c) => c.public).at(-1)!.id;
    await page.goto(`/sources/?q=zzzz-nothing#${target}`);
    await expect(page.locator(`[id="${target}"]`)).toBeInViewport();
  });
});

/* ---------- Navigation, theme and tabs ---------- */
test.describe("site chrome", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test("the menu traps focus, locks background scroll, lists Privacy and returns focus", async ({ page }) => {
    await page.goto("/experience/");
    const open = page.getByRole("button", { name: "Open menu" });
    await open.click();
    const dialog = page.getByRole("dialog", { name: "Site menu" });
    await expect(dialog.getByRole("link", { name: "Privacy" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.classList.contains("menu-open"))).toBe(true);
    await dialog.getByRole("link", { name: "Privacy" }).focus();
    await page.keyboard.press("Tab");
    await expect(dialog.getByRole("button", { name: "Close menu" })).toBeFocused();
    await page.keyboard.press("Shift+Tab");
    await expect(dialog.getByRole("link", { name: "Privacy" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(open).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.classList.contains("menu-open"))).toBe(false);
  });

  test("the theme toggle changes its icon and the theme-color, and remembers the choice", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    const toggle = page.locator("[data-theme-toggle]");
    await expect(toggle).toHaveAttribute("data-mode", "light");
    await expect(toggle.locator(".icon-moon")).toBeVisible();
    await toggle.click();
    await expect(toggle).toHaveAttribute("data-mode", "dark");
    await expect(toggle).toHaveAttribute("aria-label", "Switch to light theme");
    await expect(toggle.locator(".icon-sun")).toBeVisible();
    await expect(toggle.locator(".icon-moon")).toBeHidden();
    const colors = await page.locator('meta[name="theme-color"]').evaluateAll((els) => els.map((e) => e.getAttribute("content")));
    expect(colors).toEqual(colors.map(() => THEME_COLOR.dark));
    await page.reload();
    await expect(toggle).toHaveAttribute("data-mode", "dark");
    expect(await page.locator('meta[name="theme-color"]').first().getAttribute("content")).toBe(THEME_COLOR.dark);
  });

  test("tabs leave the URL alone on load and drop unknown views", async ({ page }) => {
    await page.goto("/experience/");
    await page.waitForLoadState("networkidle");
    expect(new URL(page.url()).search).toBe("");
    await page.goto("/experience/?view=bogus");
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("tab").first()).toHaveAttribute("aria-selected", "true");
    expect(new URL(page.url()).searchParams.get("view")).not.toBe("overview");
  });
});

test.describe("without JavaScript at phone width", () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 375, height: 812 } });

  test("every section is reachable from the footer, and the menu button stays hidden", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("[data-menu-open]")).toBeHidden();
    const footer = page.locator("footer");
    for (const href of ["/portfolio/", "/workbench/", "/lab/", "/experience/", "/credentials/", "/about/", "/contact/", "/sources/", "/privacy/"])
      await expect(footer.locator(`a[href="${href}"]`).first()).toBeVisible();
  });
});

/* ---------- PlantPal ---------- */
test("the PlantPal case study follows the spec's section order", async ({ page }) => {
  await page.goto("/portfolio/plantpal/");
  expect(await page.locator("main h2:not(.visually-hidden)").allTextContents()).toEqual([
    "Intended user problem",
    "Environmental signals: provider, freshness, resolution",
    "Normalised source architecture",
    "Uncertainty",
    "AI interpretation boundary",
    "Signal explorer",
    "Earth Signals exhibit",
    "Feature and source status",
    "Repository",
    "Limitations",
  ]);
});

/* ---------- Lab limits ---------- */
test.describe("lab input limits", () => {
  test("binary search refuses 100 values instead of answering wrongly", async ({ page }) => {
    await page.goto("/lab/binary-search/");
    await hydrated(page);
    await page.getByLabel("Sorted numbers").fill(Array.from({ length: 100 }, (_, i) => i).join(", "));
    await page.getByLabel("Target").fill("99");
    await expect(page.getByRole("alert")).toHaveText("Enter at most 64 numbers; this list has 100.");
    await expect(page.locator(".lab-summary")).not.toContainText("not in the array");
    await page.getByLabel("Sorted numbers").fill("1, 2, 3");
    await page.getByLabel("Target").fill("");
    await expect(page.getByRole("alert")).toHaveText("Enter a target number.");
  });

  test("retrieval fusion warns when a ranking has more than 20 ids", async ({ page }) => {
    await page.goto("/lab/retrieval-fusion/");
    await hydrated(page);
    await page.getByLabel("Lexical ranking (best first)").fill(Array.from({ length: 33 }, (_, i) => `D${i + 1}`).join(", "));
    await expect(page.getByText("Only the first 20 ids of the lexical ranking are used; it has 33.")).toBeVisible();
  });
});

/* ---------- Document Workbench ---------- */
test.describe("document workbench", () => {
  const open = async (page: Page) => {
    await page.goto("/workbench/documents/");
    await hydrated(page);
  };
  const search = async (page: Page, q: string) => {
    await page.getByLabel("Question or phrase").fill(q);
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await expect(page.locator(".result").first()).toBeVisible();
  };

  test("exports cleanly after a document is removed, keeping only what remains", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await open(page);
    await page.getByRole("button", { name: "Load synthetic-retrieval-notes.md" }).click();
    await page.getByRole("button", { name: "Load synthetic-incident-runbook.txt" }).click();
    await expect(page.locator(".doc-name")).toHaveCount(2);
    await search(page, "the");
    await page.getByRole("button", { name: "Remove synthetic-retrieval-notes.md" }).click();
    await expect(page.locator("[role=status]").filter({ hasText: /removed/i })).toBeVisible();
    await expect(page.locator(".doc-name")).toHaveCount(1);
    if (await page.getByRole("button", { name: "Export packet (JSON)" }).isVisible()) {
      const text = await download(page, () => page.getByRole("button", { name: "Export packet (JSON)" }).click());
      expect(text).not.toContain("synthetic-retrieval-notes.md");
    }
    expect(errors).toEqual([]);
  });

  test("labels and exports the ranking that produced the results after the mode changes", async ({ page }) => {
    await open(page);
    await page.getByRole("button", { name: "Load synthetic-retrieval-notes.md" }).click();
    await search(page, "scanned PDF recognition");
    await expect(page.locator(".result").first()).toContainText("RRF");
    await page.getByRole("button", { name: "BM25 only" }).click();
    await expect(page.locator(".result").first()).not.toContainText("RRF");
    const packet = JSON.parse(await download(page, () => page.getByRole("button", { name: "Export packet (JSON)" }).click()));
    expect(packet.method.ranking).toBe("bm25");
    await page.getByRole("button", { name: "RRF of BM25 + term coverage" }).click();
    await expect(page.locator(".result").first()).toContainText("RRF");
    const fused = JSON.parse(await download(page, () => page.getByRole("button", { name: "Export packet (JSON)" }).click()));
    expect(fused.method.ranking).toBe("rrf(bm25, term-coverage)");
  });

  test("sample buttons respect the three-document limit and duplicate samples stay separate", async ({ page }) => {
    await open(page);
    const sample = page.getByRole("button", { name: "Load synthetic-retrieval-notes.md" });
    for (let i = 0; i < 4; i += 1) await sample.click();
    await expect(page.locator(".doc-name")).toHaveCount(3);
    await expect(page.getByRole("alert")).toContainText(/3 documents/);
    await search(page, "scanned PDF");
    await expect(page.locator(".compare tbody tr")).toHaveCount(3);
  });

  test("moves between results with the arrow keys without changing the Tab order", async ({ page }) => {
    await open(page);
    await page.getByRole("button", { name: "Load synthetic-retrieval-notes.md" }).click();
    await search(page, "retrieval");
    const boxes = page.locator(".results input[type=checkbox]");
    expect(await boxes.count()).toBeGreaterThan(1);
    await boxes.first().focus();
    await page.keyboard.press("ArrowDown");
    await expect(boxes.nth(1)).toBeFocused();
    await page.keyboard.press("ArrowUp");
    await expect(boxes.first()).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(boxes.nth(1)).toBeFocused();
  });

  test("exports Markdown that keeps hostile text inert", async ({ page }) => {
    await open(page);
    await page.getByLabel("Or paste text").fill("Release notes\r# Not a heading <img src=x onerror=alert(1)>\nrank fusion merges lists.");
    await page.getByRole("button", { name: "Add pasted text" }).click();
    await search(page, "rank fusion");
    const md = await download(page, () => page.getByRole("button", { name: "Export Markdown" }).click());
    expect(md).not.toMatch(/^# Not a heading/m);
    // The tag stays visible as text but is escaped, so a Markdown viewer cannot render it.
    expect(md).not.toMatch(/(^|[^\\])<img/m);
    expect(md).toContain("\\<img");
  });
});

/* ---------- Repository and citation tools ---------- */
test.describe("repository evidence form", () => {
  test("reports an invalid input once, prefills from ?repo= without submitting, and explains a server error plainly", async ({ page }) => {
    let calls = 0;
    await page.route("**/api/repository/analyze", (route) => {
      calls += 1;
      return route.fulfill({ status: 500, contentType: "text/plain", body: "Internal Server Error" });
    });
    await page.goto("/workbench/repository/?repo=octo/demo");
    await hydrated(page);
    const input = page.getByLabel("Public GitHub repository");
    await expect(input).toHaveValue("octo/demo");
    expect(calls).toBe(0);
    await input.fill("not a repo!");
    await input.press("Enter");
    await expect(page.getByText(/Enter a GitHub repository|owner\/repo/).filter({ visible: true })).toHaveCount(1);
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await input.fill("octo/demo");
    await input.press("Enter");
    await expect(page.getByText("Something went wrong on the server. Please try again in a moment.")).toBeVisible();
    await expect(page.locator(".tool")).not.toContainText(/HTTP 500|Internal Server Error/);
    expect(calls).toBe(1);
  });

  test("works by keyboard alone", async ({ page }) => {
    await page.route("**/api/repository/analyze", (route) => route.fulfill({ status: 404, json: { error: "Repository not found, or it is not public." } }));
    await page.goto("/workbench/repository/");
    await hydrated(page);
    await page.getByLabel("Public GitHub repository").focus();
    await page.keyboard.type("octo/missing");
    await page.keyboard.press("Enter");
    await expect(page.getByText("Repository not found, or it is not public.")).toBeVisible();
  });
});

test.describe("citation form", () => {
  test("ties DOI errors to the input and reports rate limits in minutes", async ({ page }) => {
    await page.route("**/api/citations/resolve", (route) => route.fulfill({ status: 429, headers: { "Retry-After": "3600" }, json: { error: "The citation registries asked us to slow down." } }));
    await page.goto("/workbench/citations/");
    await hydrated(page);
    const doi = page.getByLabel("DOI");
    await doi.fill("not-a-doi");
    await doi.press("Enter");
    await expect(doi).toHaveAttribute("aria-invalid", "true");
    const describedBy = await doi.getAttribute("aria-describedby");
    await expect(page.locator(`[id="${describedBy}"]`)).toBeVisible();
    await doi.fill("10.1234/abc");
    await doi.press("Enter");
    await expect(page.getByRole("alert")).toContainText(/about 1 hour|about 60 minutes/);
    await expect(page.getByRole("alert")).not.toContainText("3600");
  });

  test("checks at most 20 DOIs and names the ones it skipped, by keyboard", async ({ page }) => {
    await page.route("**/api/citations/resolve", (route) => route.fulfill({ status: 404, json: { error: "Neither Crossref nor DataCite has a record for this DOI." } }));
    await page.goto("/workbench/citations/");
    await hydrated(page);
    await page.getByRole("button", { name: "Check a list" }).focus();
    await page.keyboard.press("Enter");
    const list = page.getByLabel("DOIs, one per line (up to 20)");
    await list.focus();
    await page.keyboard.insertText(Array.from({ length: 22 }, (_, i) => `10.1000/x${i}`).join("\n"));
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    await expect(page.getByText(/Not checked \(over the limit of 20/)).toContainText("10.1000/x20, 10.1000/x21");
  });
});

/* ---------- Ask the Atlas ---------- */
test("Ask the Atlas clears old evidence when a question is rejected", async ({ page }) => {
  await page.goto("/sources/");
  await hydrated(page);
  await page.getByLabel(/Your question/).fill("Are the credentials verified?");
  await page.getByRole("button", { name: "Ask", exact: true }).click();
  await expect(page.locator(".atlas-evidence")).toBeVisible();
  await page.getByLabel(/Your question/).fill("a");
  await page.getByRole("button", { name: "Ask", exact: true }).click();
  await expect(page.locator(".atlas-evidence")).toHaveCount(0);
  await expect(page.getByRole("group", { name: "Suggested questions" })).toBeVisible();
});

test("Ask the Atlas recovers when neither the assistant nor its offline evidence can load", async ({ page }) => {
  await page.goto("/sources/");
  await hydrated(page);
  // Offline after load: the API call fails and so does the on-demand ledger code.
  await page.route("**/api/ai/ask", (route) => route.abort("internetdisconnected"));
  await page.route("**/_astro/**", (route) => route.abort("internetdisconnected"));
  await page.getByLabel(/Your question/).fill("Are the credentials verified?");
  await page.getByRole("button", { name: "Ask", exact: true }).click();
  await expect(page.getByText(/The assistant could not be reached\. Check your connection/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Ask", exact: true })).toBeEnabled();
  // Back online, the next question works.
  await page.unrouteAll();
  await page.getByRole("button", { name: "Ask", exact: true }).click();
  await expect(page.locator(".atlas-evidence")).toBeVisible();
});

test("a malformed hash on Sources does not break later entry links", async ({ page }) => {
  const target = claims.filter((c) => c.public)[2].id;
  await page.goto("/sources/?q=zzzz-nothing#%zz");
  await expect(page.locator(`[id="${target}"]`)).toBeHidden();
  await page.evaluate((id) => (location.hash = id), target);
  await expect(page.locator(`[id="${target}"]`)).toBeVisible();
});

test("a credential search sent before the index hydrates still applies", async ({ page }) => {
  await page.goto("/credentials/");
  await page.getByRole("search", { name: "Search all credentials" }).getByRole("searchbox").fill("snowpro");
  await page.getByRole("search", { name: "Search all credentials" }).getByRole("searchbox").press("Enter");
  await expect(page).toHaveURL(/[?&]q=snowpro/);
  await expect(page.getByRole("search", { name: "Filter credentials" }).getByLabel("Search titles, issuers and IDs")).toHaveValue("snowpro");
});
