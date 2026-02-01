import type { Project } from "../schema/project";

export interface BlockFile {
  blockId: string;
  fileName: string;
  content: string;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

export function buildBlockFiles(project: Project, order: string[]): BlockFile[] {
  const nodeById = new Map(project.nodes.map((node) => [node.id, node]));
  return order.map((id, index) => {
    const node = nodeById.get(id);
    const title = node?.title ?? `block_${index + 1}`;
    const slug = slugify(title || "block");
    const fileName = `block_${String(index + 1).padStart(3, "0")}_${slug}.py`;
    return {
      blockId: id,
      fileName,
      content: node?.code ?? ""
    };
  });
}

