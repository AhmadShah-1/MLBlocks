import React, { useEffect, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  ReactFlowProvider,
  type Connection,
  type Edge,
  type Node,
  useReactFlow
} from "reactflow";
import "reactflow/dist/style.css";
import type { Project } from "../types";
import { useProjectStore } from "../state/projectStore";
import BlockNode from "./BlockNode";

interface CanvasProps {
  project: Project;
  focusNodeId: string | null;
}

const nodeTypes = {
  codeBlock: BlockNode
};

const CanvasInner: React.FC<CanvasProps> = ({ project, focusNodeId }) => {
  const setNodePosition = useProjectStore((state) => state.setNodePosition);
  const connectNodes = useProjectStore((state) => state.connectNodes);
  const removeEdge = useProjectStore((state) => state.removeEdge);
  const addCustomNode = useProjectStore((state) => state.addCustomNode);
  const addNodeFromDefinition = useProjectStore((state) => state.addNodeFromDefinition);
  const { setCenter, project: projectPoint } = useReactFlow();

  const nodes = useMemo<Node[]>(() => {
    return project.nodes.map((node) => ({
      id: node.id,
      type: "codeBlock",
      position: { x: node.ui.x, y: node.ui.y },
      data: { node }
    }));
  }, [project.nodes]);

  const edges = useMemo<Edge[]>(() => {
    return project.edges.map((edge) => ({
      id: edge.id,
      source: edge.from.nodeId,
      target: edge.to.nodeId,
      type: "smoothstep"
    }));
  }, [project.edges]);

  useEffect(() => {
    if (!focusNodeId) return;
    const node = project.nodes.find((n) => n.id === focusNodeId);
    if (!node) return;
    setCenter(node.ui.x + 120, node.ui.y + 40, { zoom: 1.0, duration: 500 });
  }, [focusNodeId, project.nodes, setCenter]);

  const onConnect = (connection: Connection) => {
    if (connection.source && connection.target) {
      connectNodes(connection.source, connection.target);
    }
  };

  return (
    <div className="canvas">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onConnect={onConnect}
        onNodeDragStop={(_, node) => setNodePosition(node.id, node.position.x, node.position.y)}
        onEdgesDelete={(edgesToDelete) => edgesToDelete.forEach((edge) => removeEdge(edge.id))}
        onPaneDoubleClick={(event) => {
          const point = projectPoint({ x: event.clientX, y: event.clientY });
          addCustomNode({ x: point.x, y: point.y });
        }}
        onDrop={(event) => {
          event.preventDefault();
          const raw = event.dataTransfer.getData("application/mlblocks");
          if (!raw) return;
          try {
            const definition = JSON.parse(raw);
            const point = projectPoint({ x: event.clientX, y: event.clientY });
            addNodeFromDefinition(definition, point);
          } catch {
            // ignore invalid drops
          }
        }}
        onDragOver={(event) => event.preventDefault()}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
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

