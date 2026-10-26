import { expect, test, type Request } from "@playwright/test";

/**
 * Evidence for the ledger claim "site-local-documents": the Document
 * Workbench processes files in the browser and sends no document content to
 * any server. Every request after page load is recorded and inspected.
 */
const MARKER = "QUOKKA-7319";
const DOCUMENT = `# Field notes ${MARKER}\n\nThe scanned ledger needs optical character recognition before indexing.\nThe ${MARKER} archive stays on this laptop.\n`;

test.describe("Local Document Evidence", () => {
  test("indexes, searches and exports without sending document content anywhere", async ({ page }) => {
    await page.goto("/workbench/documents/");
    await expect(page.locator("astro-island:not([ssr])")).toHaveCount(1);

    const requests: Request[] = [];
    page.on("request", (r) => requests.push(r));

    await page.getByLabel("Add files").setInputFiles({ name: "notes.md", mimeType: "text/markdown", buffer: Buffer.from(DOCUMENT) });
    await expect(page.locator(".doc-name", { hasText: "notes.md" })).toBeVisible();

    await page.getByLabel("Question or phrase").fill("scanned ledger recognition");
    await page.getByRole("button", { name: "Search", exact: true }).click();
    const result = page.locator(".result").first();
    await expect(result).toContainText("optical character recognition");
    await expect(result).toContainText("lines 1");

    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export packet (JSON)" }).click();
    const packet = JSON.parse(await (await (await download).createReadStream())!.toArray().then((c) => Buffer.concat(c).toString("utf8")));
    const first = Array.isArray(packet) ? packet[0] : packet;
    expect(JSON.stringify(first)).toContain(MARKER);
    expect(JSON.stringify(first)).toMatch(/[0-9a-f]{64}/);

    for (const r of requests) {
      const body = r.postData() ?? "";
      expect(r.url(), "request URL").not.toContain(MARKER);
      expect(body, `body of ${r.method()} ${r.url()}`).not.toContain(MARKER);
      expect(body).not.toContain("scanned ledger");
    }
    expect(requests.filter((r) => r.url().includes("/api/"))).toEqual([]);
  });

  test("keeps working offline once loaded", async ({ page, context }) => {
    await page.goto("/workbench/documents/");
    await expect(page.locator("astro-island:not([ssr])")).toHaveCount(1);
    await context.setOffline(true);
    await page.getByLabel("Or paste text").fill(`Offline paste ${MARKER}: rank fusion merges lexical and semantic lists.`);
    await page.getByRole("button", { name: "Add pasted text" }).click();
    await page.getByLabel("Question or phrase").fill('"rank fusion"');
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await expect(page.locator(".result mark").first()).toHaveText(/rank fusion/i);
    await context.setOffline(false);
  });

  test("rejects unsupported files with a clear message", async ({ page }) => {
    await page.goto("/workbench/documents/");
    await expect(page.locator("astro-island:not([ssr])")).toHaveCount(1);
    await page.getByLabel("Add files").setInputFiles({ name: "scan.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.7") });
    await expect(page.getByRole("alert")).toContainText("unsupported type");
  });

  test("runs a sample query from a deep link", async ({ page }) => {
    await page.goto("/workbench/documents/?sample=retrieval");
    await expect(page.locator(".result").first()).toContainText("optical character recognition");
    await expect(page.getByLabel("Question or phrase")).toHaveValue("What handles a scanned PDF?");
  });
});
