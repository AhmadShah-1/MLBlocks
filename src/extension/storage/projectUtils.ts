import type { Project } from "../../core/schema/project";
import type { BlockNode } from "../../core/schema/block";

export function findNodeById(project: Project, nodeId: string): BlockNode | undefined {
  return project.nodes.find((node) => node.id === nodeId);
}

