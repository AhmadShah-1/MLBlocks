import type { Project } from "../types";

export function deriveExecutionOrder(project: Project): { order: string[]; error: string | null } {
  const incoming = new Map<string, number>();
  const outgoing = new Map<string, number>();
  project.edges.forEach((edge) => {
    incoming.set(edge.to.nodeId, (incoming.get(edge.to.nodeId) ?? 0) + 1);
    outgoing.set(edge.from.nodeId, (outgoing.get(edge.from.nodeId) ?? 0) + 1);
  });

  const startNodes = project.nodes.filter((node) => (incoming.get(node.id) ?? 0) === 0);
  if (startNodes.length !== 1) {
    return { order: [], error: "Exactly one start block required." };
  }

  const order: string[] = [];
  const visited = new Set<string>();
  let current = startNodes[0];
  const nodeById = new Map(project.nodes.map((node) => [node.id, node]));

  while (current) {
    if (visited.has(current.id)) {
      return { order: [], error: "Cycle detected." };
    }
    visited.add(current.id);
    order.push(current.id);
    const nextEdge = project.edges.find((edge) => edge.from.nodeId === current.id);
    if (!nextEdge) break;
    const nextNode = nodeById.get(nextEdge.to.nodeId);
    if (!nextNode) {
      return { order: [], error: "Broken link in control-flow chain." };
    }
    current = nextNode;
  }

  if (visited.size !== project.nodes.length) {
    return { order: [], error: "Control-flow chain does not include all blocks." };
  }
  return { order, error: null };
}

