import { describe, expect, it } from "vitest";
import { answerFromPortfolio } from "./assistant";

describe("offline portfolio knowledge", () => {
  it("routes hiring-fit questions to supported proof", () => {
    expect(answerFromPortfolio("Why should we hire Anupam?")).toContain(
      "strong AI/ML engineering hire",
    );
  });

  it("routes NexusRAG architecture questions", () => {
    expect(answerFromPortfolio("Explain NexusRAG architecture")).toContain(
      "Upload -> Parsing/OCR",
    );
  });

  it("returns the corrected competitive-programming record", () => {
    const answer = answerFromPortfolio("What is his CodeChef rating?");
    expect(answer).toContain("5-Star");
    expect(answer).toContain("2109");
  });

  it("honestly handles an unsupported question", () => {
    expect(answerFromPortfolio("What is his favorite movie?")).toContain(
      "offline portfolio mode",
    );
  });
});
