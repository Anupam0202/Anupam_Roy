import { describe, expect, it } from "vitest";
import { achievements } from "./achievements";

describe("achievement proof data", () => {
  it("keeps the verified CodeChef record accurate and linked", () => {
    const codeChef = achievements.find((achievement) =>
      achievement.title.includes("Competitive Programming"),
    );

    expect(codeChef?.proof).toContain("5-Star");
    expect(codeChef?.proof).toContain("2109");
    expect(codeChef?.metrics.map((metric) => metric.value)).toEqual([
      "5★",
      "2109",
    ]);
    expect(codeChef?.links[0]?.href).toBe(
      "https://www.codechef.com/users/anupam_roy",
    );
  });
});
