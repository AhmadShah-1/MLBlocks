import type { Project } from "../schema/project";

export interface ExecutionOrderResult {
  order: string[];
  errors: string[];
}

export function deriveExecutionOrder(project: Project): ExecutionOrderResult {
  const errors: string[] = [];
  const nodes = new Map(project.nodes.map((node) => [node.id, node]));
  const incoming = new Map<string, number>();
  const outgoing = new Map<string, number>();

  project.edges.forEach((edge) => {
    if (edge.kind !== "control") {
      return;
    }
    incoming.set(edge.to.nodeId, (incoming.get(edge.to.nodeId) ?? 0) + 1);
    outgoing.set(edge.from.nodeId, (outgoing.get(edge.from.nodeId) ?? 0) + 1);
  });

  for (const node of project.nodes) {
    const inCount = incoming.get(node.id) ?? 0;
    const outCount = outgoing.get(node.id) ?? 0;
    if (inCount > 1) {
      errors.push(`Block ${node.title} has multiple incoming links.`);
    }
    if (outCount > 1) {
      errors.push(`Block ${node.title} has multiple outgoing links.`);
    }
  }

  const startNodes = project.nodes.filter((node) => (incoming.get(node.id) ?? 0) === 0);
  if (startNodes.length === 0) {
    errors.push("No start block found (a block without incoming control link).");
  }
  if (startNodes.length > 1) {
    errors.push("Multiple start blocks found.");
  }

  if (errors.length > 0) {
    return { order: [], errors };
  }

  const order: string[] = [];
  const visited = new Set<string>();
  let current = startNodes[0];

  while (current) {
    if (visited.has(current.id)) {
      errors.push("Cycle detected in control-flow chain.");
      break;
    }
    visited.add(current.id);
    order.push(current.id);

    const nextEdge = project.edges.find(
      (edge) => edge.kind === "control" && edge.from.nodeId === current.id
    );
    if (!nextEdge) {
      break;
    }
    const nextNode = nodes.get(nextEdge.to.nodeId);
    if (!nextNode) {
      errors.push(`Missing node ${nextEdge.to.nodeId} referenced by edge.`);
      break;
    }
    current = nextNode;
  }

  if (visited.size !== project.nodes.length) {
    errors.push("Control-flow chain does not include all blocks.");
  }

  return { order: errors.length ? [] : order, errors };
}

