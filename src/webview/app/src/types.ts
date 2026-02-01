export type BlockSource =
  | { kind: "builtin"; packId: string; blockId: string }
  | { kind: "custom" };

export interface BlockNode {
  id: string;
  type: "codeBlock";
  title: string;
  code: string;
  outputBadge: string;
  source: BlockSource;
  ui: {
    x: number;
    y: number;
    collapsed: boolean;
  };
}

export interface ControlEdge {
  id: string;
  kind: "control";
  from: { nodeId: string; port: "controlOut" };
  to: { nodeId: string; port: "controlIn" };
}

export interface Project {
  schemaVersion: number;
  projectId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  language: "python";
  settings: {
    previewLines: number;
  };
  nodes: BlockNode[];
  edges: ControlEdge[];
  ui: {
    viewport: {
      x: number;
      y: number;
      zoom: number;
    };
  };
}

export interface BlockDefinition {
  blockId: string;
  name: string;
  category: string;
  defaultCode: string;
  defaultOutputBadge: string;
  packId?: string;
}

export interface BlockCategory {
  id: string;
  name: string;
  blocks: BlockDefinition[];
}

export interface BlockPack {
  packId: string;
  name: string;
  categories: BlockCategory[];
}

