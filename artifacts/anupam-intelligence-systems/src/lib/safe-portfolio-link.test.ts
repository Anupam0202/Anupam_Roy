import { describe, expect, it } from "vitest";
import { isSafePortfolioHref } from "./safe-portfolio-link";

describe("isSafePortfolioHref", () => {
  it("accepts portfolio sections, the public email, and known proof hosts", () => {
    expect(isSafePortfolioHref("#projects")).toBe(true);
    expect(isSafePortfolioHref("mailto:anupam020202@gmail.com")).toBe(true);
    expect(isSafePortfolioHref("https://github.com/Anupam0202/")).toBe(true);
    expect(
      isSafePortfolioHref("https://www.linkedin.com/in/anupam--roy/"),
    ).toBe(true);
  });

  it("rejects executable, deceptive, credentialed, and unknown links", () => {
    expect(isSafePortfolioHref("javascript:alert(1)")).toBe(false);
    expect(isSafePortfolioHref("data:text/html,unsafe")).toBe(false);
    expect(isSafePortfolioHref("https://github.com.evil.example/profile")).toBe(
      false,
    );
    expect(isSafePortfolioHref("https://user:pass@github.com/private")).toBe(
      false,
    );
    expect(isSafePortfolioHref("mailto:someone@example.com")).toBe(false);
  });
});
