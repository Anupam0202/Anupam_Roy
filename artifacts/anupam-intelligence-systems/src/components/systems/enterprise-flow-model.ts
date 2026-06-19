export interface FlowNode {
  id: string;
  x: number;
  y: number;
  label: string;
  highlight: boolean;
}

export interface MobileFlowStage {
  id: string;
  label: string;
  description: string;
  nodeIds: string[];
}

export const flowNodes: FlowNode[] = [
  { id: "1", x: 310, y: 40, label: "Enterprise Query Router", highlight: true },
  { id: "2", x: 60, y: 200, label: "Incident Intelligence", highlight: false },
  { id: "3", x: 310, y: 200, label: "RCA Engine", highlight: false },
  { id: "4", x: 560, y: 200, label: "Release Intelligence", highlight: false },
  { id: "5", x: 60, y: 360, label: "ITSM Automation", highlight: false },
  { id: "6", x: 310, y: 360, label: "Knowledge Retrieval Layer", highlight: true },
  { id: "7", x: 560, y: 360, label: "Compliance Intelligence", highlight: false },
];

export const flowEdges = [
  { from: "1", to: "2" },
  { from: "1", to: "3" },
  { from: "1", to: "4" },
  { from: "2", to: "6" },
  { from: "3", to: "6" },
  { from: "4", to: "6" },
  { from: "6", to: "5" },
  { from: "6", to: "7" },
];

export const mobileFlowStages: MobileFlowStage[] = [
  { id: "route", label: "Route", description: "Classify intent", nodeIds: ["1"] },
  { id: "reason", label: "Reason", description: "Parallel specialists", nodeIds: ["2", "3", "4"] },
  { id: "retrieve", label: "Retrieve", description: "Ground decisions", nodeIds: ["6"] },
  { id: "act", label: "Act", description: "Execute and govern", nodeIds: ["5", "7"] },
];

export function getFlowNode(id: string) {
  const node = flowNodes.find((candidate) => candidate.id === id);
  if (!node) throw new Error(`Unknown enterprise flow node: ${id}`);
  return node;
}
