import React, { useEffect, useMemo, useCallback, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  MarkerType,
  type Connection,
  type Edge,
  type Node,
  useReactFlow
} from "reactflow";
import "reactflow/dist/style.css";
import type { Project, BlockNode as BlockNodeType, BlockDefinition } from "../types";
import { useProjectStore } from "../state/projectStore";
import BlockNode from "./BlockNode";

interface CanvasProps {
  project: Project;
  focusNodeId: string | null;
}

const nodeTypes = {
  codeBlock: BlockNode
};

// Default edge style with arrow marker
const defaultEdgeOptions = {
  type: "smoothstep",
  markerEnd: {
    type: MarkerType.ArrowClosed,
    width: 20,
    height: 20,
    color: "#f0b45b"
  },
  style: {
    strokeWidth: 3,
    stroke: "#f0b45b"
  },
  animated: false
};

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  canvasX: number;
  canvasY: number;
  targetEdgeId: string | null;
}

const CanvasInner: React.FC<CanvasProps> = ({ project, focusNodeId }) => {
  const setNodePosition = useProjectStore((state) => state.setNodePosition);
  const connectNodes = useProjectStore((state) => state.connectNodes);
  const removeEdge = useProjectStore((state) => state.removeEdge);
  const addCustomNode = useProjectStore((state) => state.addCustomNode);
  const addNodeFromDefinition = useProjectStore((state) => state.addNodeFromDefinition);
  const copyNode = useProjectStore((state) => state.copyNode);
  const pasteNode = useProjectStore((state) => state.pasteNode);
  const cutNode = useProjectStore((state) => state.cutNode);
  const clipboard = useProjectStore((state) => state.clipboard);
  const undo = useProjectStore((state) => state.undo);
  const redo = useProjectStore((state) => state.redo);
  const canUndo = useProjectStore((state) => state.canUndo);
  const canRedo = useProjectStore((state) => state.canRedo);
  const { setCenter, project: projectPoint } = useReactFlow();

  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    canvasX: 0,
    canvasY: 0,
    targetEdgeId: null
  });

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  // Track dragging nodes locally to avoid state update lag
  const [draggingPositions, setDraggingPositions] = useState<Map<string, { x: number; y: number }>>(new Map());

  const nodes = useMemo<Node[]>(() => {
    return project.nodes.map((node) => {
      const dragPos = draggingPositions.get(node.id);
      return {
        id: node.id,
        type: "codeBlock",
        position: dragPos || { x: node.ui.x, y: node.ui.y },
        data: { node },
        selected: node.id === selectedNodeId,
        dragHandle: ".block-header"
      };
    });
  }, [project.nodes, selectedNodeId, draggingPositions]);

  const edges = useMemo<Edge[]>(() => {
    return project.edges.map((edge) => ({
      id: edge.id,
      source: edge.from.nodeId,
      target: edge.to.nodeId,
      selected: edge.id === selectedEdgeId,
      ...defaultEdgeOptions
    }));
  }, [project.edges, selectedEdgeId]);

  useEffect(() => {
    if (!focusNodeId) return;
    const node = project.nodes.find((n) => n.id === focusNodeId);
    if (!node) return;
    setCenter(node.ui.x + 120, node.ui.y + 40, { zoom: 1.0, duration: 500 });
  }, [focusNodeId, project.nodes, setCenter]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "z" && !event.shiftKey) {
        event.preventDefault();
        if (canUndo()) undo();
      }
      if ((event.ctrlKey || event.metaKey) && (event.key === "y" || (event.key === "z" && event.shiftKey))) {
        event.preventDefault();
        if (canRedo()) redo();
      }
      // Delete selected edge with Delete/Backspace
      if ((event.key === "Delete" || event.key === "Backspace") && selectedEdgeId && !selectedNodeId) {
        event.preventDefault();
        removeEdge(selectedEdgeId);
        setSelectedEdgeId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, canUndo, canRedo, selectedEdgeId, selectedNodeId, removeEdge]);

  const onConnect = (connection: Connection) => {
    if (connection.source && connection.target) {
      connectNodes(connection.source, connection.target);
    }
  };

  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    const point = projectPoint({ x: event.clientX, y: event.clientY });
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      canvasX: point.x,
      canvasY: point.y,
      targetEdgeId: selectedEdgeId
    });
  }, [projectPoint, selectedEdgeId]);

  const closeContextMenu = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, visible: false }));
  }, []);

  const handleCreateCustomBlock = useCallback(() => {
    addCustomNode({ x: contextMenu.canvasX, y: contextMenu.canvasY });
    closeContextMenu();
  }, [addCustomNode, contextMenu.canvasX, contextMenu.canvasY, closeContextMenu]);

  const handleCut = useCallback(() => {
    if (selectedNodeId) {
      cutNode(selectedNodeId);
    }
    closeContextMenu();
  }, [selectedNodeId, cutNode, closeContextMenu]);

  const handleCopy = useCallback(() => {
    if (selectedNodeId) {
      copyNode(selectedNodeId);
    }
    closeContextMenu();
  }, [selectedNodeId, copyNode, closeContextMenu]);

  const handlePaste = useCallback(() => {
    pasteNode({ x: contextMenu.canvasX, y: contextMenu.canvasY });
    closeContextMenu();
  }, [pasteNode, contextMenu.canvasX, contextMenu.canvasY, closeContextMenu]);

  const handleDeleteWire = useCallback(() => {
    if (contextMenu.targetEdgeId) {
      removeEdge(contextMenu.targetEdgeId);
      setSelectedEdgeId(null);
    }
    closeContextMenu();
  }, [contextMenu.targetEdgeId, removeEdge, closeContextMenu]);

  // Close context menu on click elsewhere
  useEffect(() => {
    const handleClick = () => closeContextMenu();
    if (contextMenu.visible) {
      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick);
    }
  }, [contextMenu.visible, closeContextMenu]);

  return (
    <div className="canvas">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        onConnect={onConnect}
        onNodeDrag={(_, node) => {
          setDraggingPositions((prev) => {
            const next = new Map(prev);
            next.set(node.id, node.position);
            return next;
          });
        }}
        onNodeDragStop={(_, node) => {
          // Persist to store
          setNodePosition(node.id, node.position.x, node.position.y);
          // Clear dragging state
          setDraggingPositions((prev) => {
            const next = new Map(prev);
            next.delete(node.id);
            return next;
          });
        }}
        onEdgesDelete={(edgesToDelete) => edgesToDelete.forEach((edge) => removeEdge(edge.id))}
        onNodeClick={(_, node) => {
          setSelectedNodeId(node.id);
          setSelectedEdgeId(null);
        }}
        onEdgeClick={(_, edge) => {
          setSelectedEdgeId(edge.id);
          setSelectedNodeId(null);
        }}
        onPaneClick={() => {
          setSelectedNodeId(null);
          setSelectedEdgeId(null);
        }}
        onDrop={(event: React.DragEvent) => {
          event.preventDefault();
          const raw = event.dataTransfer.getData("application/mlblocks");
          if (!raw) return;
          try {
            const definition = JSON.parse(raw) as BlockDefinition;
            const point = projectPoint({ x: event.clientX, y: event.clientY });
            addNodeFromDefinition(definition, point);
          } catch {
            // ignore invalid drops
          }
        }}
        onDragOver={(event: React.DragEvent) => event.preventDefault()}
        onContextMenu={handleContextMenu}
        nodeDragThreshold={5}
        fitView
        deleteKeyCode={null}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>

      {/* Context Menu */}
      {contextMenu.visible && (
        <div
          className="context-menu"
          style={{
            position: "fixed",
            left: contextMenu.x,
            top: contextMenu.y,
            zIndex: 1000
          }}
        >
          <button onClick={handleCreateCustomBlock}>Custom Block</button>
          <hr />
          <button onClick={handleCut} disabled={!selectedNodeId}>Cut Block</button>
          <button onClick={handleCopy} disabled={!selectedNodeId}>Copy Block</button>
          <button onClick={handlePaste} disabled={!clipboard}>Paste Block</button>
          <hr />
          <button onClick={handleDeleteWire} disabled={!contextMenu.targetEdgeId}>
            Delete Wire
          </button>
        </div>
      )}
    </div>
  );
};

const Canvas: React.FC<CanvasProps> = (props) => {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
};

export default Canvas;
