import type { BlockNode } from "./block";

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

export interface ProjectValidationResult {
  valid: boolean;
  errors: string[];
}

