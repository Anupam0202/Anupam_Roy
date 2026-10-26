import { expect, test } from "@playwright/test";

const hydrated = (page: import("@playwright/test").Page) => expect(page.locator("astro-island:not([ssr])")).toHaveCount(1);

test.describe("Reciprocal Rank Fusion explorer", () => {
  test("fuses the fixture, reacts to k, and rejects invalid k", async ({ page }) => {
    await page.goto("/lab/retrieval-fusion/");
    await hydrated(page);
    await expect(page.locator(".lab-summary").first()).toHaveText("Fused order: D1, D3, D2, D4");
    await expect(page.locator("tbody tr").first()).toContainText("0.032522");
    const k = page.getByLabel("k (smoothing constant)");
    for (const bad of ["0", "0.5", "1001"]) {
      await k.fill(bad);
      await expect(page.getByRole("alert")).toHaveText("k must be a whole number from 1 to 1000.");
    }
    await k.fill("1");
    await expect(page.locator("tbody tr").first()).toContainText("2 → 1/3 = 0.333333");
    await expect(page.locator("tbody tr").first()).toContainText("0.833333");
  });

  test("opens the NexusRAG comparison from the case-study deep link", async ({ page }) => {
    await page.goto("/lab/retrieval-fusion/?preset=nexusrag");
    await hydrated(page);
    await expect(page.getByRole("heading", { name: "NexusRAG gateway blend" })).toBeVisible();
    await page.getByLabel(/α \(dense weight\)/).fill("0");
    await expect(page.locator(".compare-panel [role=status]")).toContainText("Gateway order: D2");
  });
});

test.describe("Binary search explorer", () => {
  test("steps with the keyboard to an absent target", async ({ page }) => {
    await page.goto("/lab/binary-search/");
    await hydrated(page);
    await page.getByLabel("Target").fill("50");
    await page.getByRole("button", { name: "Next step" }).focus();
    for (let i = 0; i < 4; i += 1) await page.keyboard.press("Enter");
    await expect(page.locator(".lab-summary")).toContainText("Step 4 of 4");
    await expect(page.locator(".lab-summary")).toContainText("the target is not in the array");
    await expect(page.getByRole("button", { name: "Next step" })).toBeDisabled();
  });

  test("refuses unsorted input and offers to sort it", async ({ page }) => {
    await page.goto("/lab/binary-search/");
    await hydrated(page);
    await page.getByLabel("Sorted numbers").fill("5, 3, 9");
    await expect(page.locator(".error")).toContainText("not sorted");
    await page.getByRole("button", { name: "Sort it" }).click();
    await expect(page.getByLabel("Sorted numbers")).toHaveValue("3, 5, 9");
  });
});

test.describe("Dijkstra explorer", () => {
  test("finds the shortest path, reports unreachable nodes, rejects negative weights", async ({ page }) => {
    await page.goto("/lab/dijkstra/");
    await hydrated(page);
    await page.getByRole("button", { name: "Next step" }).click();
    await page.getByRole("button", { name: "Next step" }).click();
    await expect(page.locator("[role=status]").first()).toContainText("B: 4 → 3 via C");
    await page.getByRole("button", { name: "Run to end" }).click();
    await expect(page.locator("[role=status]").first()).toContainText("A → C → B → D → E → F, total 13");
    await page.getByLabel("Target").selectOption("G");
    await expect(page.locator("[role=status]").first()).toContainText("G is unreachable from A");
    await page.getByText("Edit edge weights").click();
    await page.getByLabel("A–B").fill("-1");
    await expect(page.getByRole("alert")).toContainText("Dijkstra's algorithm requires non-negative weights");
  });

  test("lists the edges in an adjacency table that follows the weight inputs, by keyboard", async ({ page }) => {
    await page.goto("/lab/dijkstra/");
    await hydrated(page);
    const edges = page.getByRole("table", { name: "Edges (undirected) with their current weights" });
    await expect(edges.getByRole("row")).toHaveCount(10);
    await expect(edges.getByRole("row").nth(1)).toHaveText(/A\s*B\s*4/);
    await page.getByText("Edit edge weights").focus();
    await page.keyboard.press("Enter");
    await page.getByLabel("A–B").focus();
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.type("7");
    await expect(edges.getByRole("row").nth(1)).toHaveText(/A\s*B\s*7/);
    await page.getByRole("button", { name: "Run to end" }).focus();
    await page.keyboard.press("Enter");
    await expect(edges.locator("tr.row--path")).toHaveCount(5);
    await expect(page.getByRole("table", { name: /Distances and predecessors/ })).toBeVisible();
  });
});
