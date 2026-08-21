import { describe, expect, it } from "vitest";
import { flowNodes, mobileFlowStages } from "./enterprise-flow-model";

describe("enterprise flow responsive model", () => {
  it("preserves the orchestration topology in four mobile stages", () => {
    expect(mobileFlowStages.map((stage) => stage.label)).toEqual([
      "Route",
      "Reason",
      "Retrieve",
      "Act",
    ]);
    expect(mobileFlowStages.map((stage) => stage.nodeIds)).toEqual([
      ["1"],
      ["2", "3", "4"],
      ["6"],
      ["5", "7"],
    ]);
  });

  it("includes every architecture node exactly once on mobile", () => {
    const renderedIds = mobileFlowStages.flatMap((stage) => stage.nodeIds);
    expect(renderedIds).toHaveLength(flowNodes.length);
    expect(new Set(renderedIds).size).toBe(flowNodes.length);
    expect(renderedIds.toSorted()).toEqual(
      flowNodes.map((node) => node.id).toSorted(),
    );
  });
});
