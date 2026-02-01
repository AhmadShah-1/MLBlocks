import { create } from "zustand";
import type { BlockDefinition, BlockPack, BlockNode, ControlEdge, Project, BlockOutput } from "../types";

const MAX_HISTORY = 50;

interface ProjectState {
  project: Project | null;
  packs: BlockPack[];
  graphError: string | null;
  clipboard: BlockNode | null;
  history: Project[];
  historyIndex: number;
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
  copyNode: (nodeId: string) => void;
  cutNode: (nodeId: string) => void;
  pasteNode: (position: { x: number; y: number }) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  setNodeOutput: (nodeId: string, output: BlockOutput) => void;
  clearNodeOutput: (nodeId: string) => void;
}

const createNodeId = () => `node_${crypto.randomUUID()}`;

const emptySource = { kind: "custom" } as const;

/**
 * Detect function return type from Python code
 * Looks for patterns like: def func(...) -> ReturnType:
 */
function detectFunctionReturnType(code: string): string | null {
  // Match function definition with return type annotation
  const funcMatch = code.match(/def\s+\w+\s*\([^)]*\)\s*->\s*([^:]+):/);
  if (funcMatch) {
    return funcMatch[1].trim();
  }
  return null;
}

/**
 * Push current project to history for undo support
 */
function pushHistory(state: ProjectState, newProject: Project): Partial<ProjectState> {
  const { history, historyIndex, project } = state;
  if (!project) return { project: newProject };
  
  // Truncate any redo history
  const newHistory = history.slice(0, historyIndex + 1);
  newHistory.push(project);
  
  // Limit history size
  if (newHistory.length > MAX_HISTORY) {
    newHistory.shift();
  }
  
  return {
    project: newProject,
    history: newHistory,
    historyIndex: newHistory.length - 1
  };
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  project: null,
  packs: [],
  graphError: null,
  clipboard: null,
  history: [],
  historyIndex: -1,
  
  setProject: (project) => set({ project, history: [], historyIndex: -1 }),
  setPacks: (packs) => set({ packs }),
  setGraphError: (graphError) => set({ graphError }),
  
  updateNode: (nodeId, patch) => {
    const state = get();
    const project = state.project;
    if (!project) return;
    
    // If code is being updated, check for function return type
    let finalPatch = { ...patch };
    if (patch.code !== undefined) {
      const returnType = detectFunctionReturnType(patch.code);
      if (returnType) {
        // Only update outputBadge if user hasn't manually set it
        const currentNode = project.nodes.find((n) => n.id === nodeId);
        if (currentNode && (currentNode.outputBadge === "None" || currentNode.outputBadge === "")) {
          finalPatch.outputBadge = returnType;
        }
      }
    }
    
    const nodes = project.nodes.map((node) =>
      node.id === nodeId ? { ...node, ...finalPatch } : node
    );
    const newProject = { ...project, nodes };
    
    // Don't push to history for every keystroke - only for significant changes
    if (patch.code === undefined) {
      set(pushHistory(state, newProject));
    } else {
      set({ project: newProject });
    }
  },
  
  setNodePosition: (nodeId, x, y) => {
    const state = get();
    const project = state.project;
    if (!project) return;
    const nodes = project.nodes.map((node) =>
      node.id === nodeId ? { ...node, ui: { ...node.ui, x, y } } : node
    );
    set({ project: { ...project, nodes } });
  },
  
  addNode: (node) => {
    const state = get();
    const project = state.project;
    if (!project) return;
    const newProject = { ...project, nodes: [...project.nodes, node] };
    set(pushHistory(state, newProject));
  },
  
  addNodeFromDefinition: (definition, position) => {
    const state = get();
    const project = state.project;
    if (!project) return;
    
    // Detect function return type
    let outputBadge = definition.defaultOutputBadge;
    const returnType = detectFunctionReturnType(definition.defaultCode);
    if (returnType) {
      outputBadge = returnType;
    }
    
    const node: BlockNode = {
      id: createNodeId(),
      type: "codeBlock",
      title: definition.name,
      code: definition.defaultCode,
      outputBadge,
      source: { kind: "builtin", packId: definition.packId ?? "unknown", blockId: definition.blockId },
      ui: { x: position.x, y: position.y, collapsed: false }
    };
    const newProject = { ...project, nodes: [...project.nodes, node] };
    set(pushHistory(state, newProject));
  },
  
  addCustomNode: (position) => {
    const state = get();
    const project = state.project;
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
    const newProject = { ...project, nodes: [...project.nodes, node] };
    set(pushHistory(state, newProject));
  },
  
  removeNode: (nodeId) => {
    const state = get();
    const project = state.project;
    if (!project) return;
    const nodes = project.nodes.filter((node) => node.id !== nodeId);
    const edges = project.edges.filter(
      (edge) => edge.from.nodeId !== nodeId && edge.to.nodeId !== nodeId
    );
    const newProject = { ...project, nodes, edges };
    set(pushHistory(state, newProject));
  },
  
  connectNodes: (fromId, toId) => {
    const state = get();
    const project = state.project;
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
    const newProject = { ...project, edges: [...filtered, newEdge] };
    set(pushHistory(state, newProject));
  },
  
  removeEdge: (edgeId) => {
    const state = get();
    const project = state.project;
    if (!project) return;
    const newProject = { ...project, edges: project.edges.filter((edge) => edge.id !== edgeId) };
    set(pushHistory(state, newProject));
  },
  
  copyNode: (nodeId) => {
    const project = get().project;
    if (!project) return;
    const node = project.nodes.find((n) => n.id === nodeId);
    if (node) {
      set({ clipboard: { ...node } });
    }
  },
  
  cutNode: (nodeId) => {
    const state = get();
    const project = state.project;
    if (!project) return;
    const node = project.nodes.find((n) => n.id === nodeId);
    if (node) {
      set({ clipboard: { ...node } });
      // Remove the node and its edges
      const nodes = project.nodes.filter((n) => n.id !== nodeId);
      const edges = project.edges.filter(
        (edge) => edge.from.nodeId !== nodeId && edge.to.nodeId !== nodeId
      );
      const newProject = { ...project, nodes, edges };
      set(pushHistory(state, newProject));
    }
  },
  
  pasteNode: (position) => {
    const state = get();
    const { clipboard, project } = state;
    if (!clipboard || !project) return;
    const newNode: BlockNode = {
      ...clipboard,
      id: createNodeId(),
      ui: { ...clipboard.ui, x: position.x, y: position.y }
    };
    const newProject = { ...project, nodes: [...project.nodes, newNode] };
    set(pushHistory(state, newProject));
  },
  
  undo: () => {
    const { history, historyIndex, project } = get();
    if (historyIndex < 0 || !project) return;
    
    const previousProject = history[historyIndex];
    if (!previousProject) return;
    
    // Save current state for redo
    const newHistory = [...history];
    newHistory[historyIndex] = project;
    
    set({
      project: previousProject,
      history: newHistory,
      historyIndex: historyIndex - 1
    });
  },
  
  redo: () => {
    const { history, historyIndex, project } = get();
    if (historyIndex >= history.length - 1 || !project) return;
    
    const nextIndex = historyIndex + 1;
    const nextProject = history[nextIndex];
    if (!nextProject) return;
    
    // Save current state
    const newHistory = [...history];
    newHistory[historyIndex + 1] = project;
    
    set({
      project: nextProject,
      history: newHistory,
      historyIndex: nextIndex
    });
  },
  
  canUndo: () => {
    const { historyIndex } = get();
    return historyIndex >= 0;
  },
  
  canRedo: () => {
    const { history, historyIndex } = get();
    return historyIndex < history.length - 1;
  },
  
  setNodeOutput: (nodeId, output) => {
    const project = get().project;
    if (!project) return;
    const nodes = project.nodes.map((node) =>
      node.id === nodeId ? { ...node, output } : node
    );
    set({ project: { ...project, nodes } });
  },
  
  clearNodeOutput: (nodeId) => {
    const project = get().project;
    if (!project) return;
    const nodes = project.nodes.map((node) =>
      node.id === nodeId ? { ...node, output: undefined } : node
    );
    set({ project: { ...project, nodes } });
  }
}));
