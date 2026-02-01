import { create } from "zustand";
import type { BlockDefinition, BlockPack, BlockNode, ControlEdge, Project } from "../types";

interface ProjectState {
  project: Project | null;
  packs: BlockPack[];
  graphError: string | null;
  setProject: (project: Project) => void;
  setPacks: (packs: BlockPack[]) => void;
  setGraphError: (error: string | null) => void;
  updateNode: (nodeId: string, patch: Partial<BlockNode>) => void;
  setNodePosition: (nodeId: string, x: number, y: number) => void;
  addNode: (node: BlockNode) => void;
  addNodeFromDefinition: (definition: BlockDefinition, position: { x: number; y: number }) => void;
  addCustomNode: (position: { x: number; y: number }) => void;
  removeNode: (nodeId: string) => void;
  connectNodes: (fromId: string, toId: string) => void;
  removeEdge: (edgeId: string) => void;
}

const createNodeId = () => `node_${crypto.randomUUID()}`;

const emptySource = { kind: "custom" } as const;

export const useProjectStore = create<ProjectState>((set, get) => ({
  project: null,
  packs: [],
  graphError: null,
  setProject: (project) => set({ project }),
  setPacks: (packs) => set({ packs }),
  setGraphError: (graphError) => set({ graphError }),
  updateNode: (nodeId, patch) => {
    const project = get().project;
    if (!project) return;
    const nodes = project.nodes.map((node) =>
      node.id === nodeId ? { ...node, ...patch } : node
    );
    set({ project: { ...project, nodes } });
  },
  setNodePosition: (nodeId, x, y) => {
    const project = get().project;
    if (!project) return;
    const nodes = project.nodes.map((node) =>
      node.id === nodeId ? { ...node, ui: { ...node.ui, x, y } } : node
    );
    set({ project: { ...project, nodes } });
  },
  addNode: (node) => {
    const project = get().project;
    if (!project) return;
    set({ project: { ...project, nodes: [...project.nodes, node] } });
  },
  addNodeFromDefinition: (definition, position) => {
    const project = get().project;
    if (!project) return;
    const node: BlockNode = {
      id: createNodeId(),
      type: "codeBlock",
      title: definition.name,
      code: definition.defaultCode,
      outputBadge: definition.defaultOutputBadge,
      source: { kind: "builtin", packId: definition.packId ?? "unknown", blockId: definition.blockId },
      ui: { x: position.x, y: position.y, collapsed: false }
    };
    set({ project: { ...project, nodes: [...project.nodes, node] } });
  },
  addCustomNode: (position) => {
    const project = get().project;
    if (!project) return;
    const node: BlockNode = {
      id: createNodeId(),
      type: "codeBlock",
      title: "New Block",
      code: "",
      outputBadge: "None",
      source: emptySource,
      ui: { x: position.x, y: position.y, collapsed: false }
    };
    set({ project: { ...project, nodes: [...project.nodes, node] } });
  },
  removeNode: (nodeId) => {
    const project = get().project;
    if (!project) return;
    const nodes = project.nodes.filter((node) => node.id !== nodeId);
    const edges = project.edges.filter(
      (edge) => edge.from.nodeId !== nodeId && edge.to.nodeId !== nodeId
    );
    set({ project: { ...project, nodes, edges } });
  },
  connectNodes: (fromId, toId) => {
    const project = get().project;
    if (!project) return;
    const filtered = project.edges.filter(
      (edge) => edge.from.nodeId !== fromId && edge.to.nodeId !== toId
    );
    const newEdge: ControlEdge = {
      id: `edge_${crypto.randomUUID()}`,
      kind: "control",
      from: { nodeId: fromId, port: "controlOut" },
      to: { nodeId: toId, port: "controlIn" }
    };
    set({ project: { ...project, edges: [...filtered, newEdge] } });
  },
  removeEdge: (edgeId) => {
    const project = get().project;
    if (!project) return;
    set({ project: { ...project, edges: project.edges.filter((edge) => edge.id !== edgeId) } });
  }
}));

