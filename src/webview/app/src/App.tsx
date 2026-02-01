import React, { useEffect, useMemo, useState, useCallback } from "react";
import { registerInbound } from "./bridge/inbound";
import { postProjectSave, requestConvert, requestDebug, requestRun, requestStop } from "./bridge/outbound";
import { useProjectStore } from "./state/projectStore";
import { deriveExecutionOrder } from "./state/selectors";
import Canvas from "./components/Canvas";
import Palette from "./components/Palette";
import OrderList from "./components/OrderList";

const SAVE_DEBOUNCE_MS = 500;

const App: React.FC = () => {
  const project = useProjectStore((state) => state.project);
  const packs = useProjectStore((state) => state.packs);
  const setProject = useProjectStore((state) => state.setProject);
  const setPacks = useProjectStore((state) => state.setPacks);
  const setGraphError = useProjectStore((state) => state.setGraphError);
  const graphError = useProjectStore((state) => state.graphError);
  const undo = useProjectStore((state) => state.undo);
  const redo = useProjectStore((state) => state.redo);
  const canUndo = useProjectStore((state) => state.canUndo);
  const canRedo = useProjectStore((state) => state.canRedo);
  const setNodeOutput = useProjectStore((state) => state.setNodeOutput);
  
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);
  const [lastOutputPath, setLastOutputPath] = useState<string | null>(null);
  const [paletteCollapsed, setPaletteCollapsed] = useState(false);
  const [orderListCollapsed, setOrderListCollapsed] = useState(false);

  useEffect(() => {
    registerInbound((message) => {
      if (message.type === "PROJECT_LOADED") {
        setProject(message.payload.project);
        setPacks(message.payload.packs);
      }
      if (message.type === "FOCUS_BLOCK") {
        setFocusNodeId(message.payload.nodeId);
      }
      if (message.type === "CONVERT_DONE") {
        setLastOutputPath(message.payload.outputPath);
      }
      if (message.type === "GRAPH_INVALID") {
        setGraphError(message.payload.reason);
      }
      if (message.type === "BLOCK_OUTPUT") {
        setNodeOutput(message.payload.nodeId, message.payload.output);
      }
    });
  }, [setProject, setPacks, setGraphError, setNodeOutput]);

  const orderResult = useMemo(() => {
    if (!project) return { order: [], error: null };
    return deriveExecutionOrder(project);
  }, [project]);

  useEffect(() => {
    setGraphError(orderResult.error);
  }, [orderResult.error, setGraphError]);

  useEffect(() => {
    if (!project) return;
    const handle = window.setTimeout(() => {
      postProjectSave(project);
    }, SAVE_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [project]);

  const handleUndo = useCallback(() => {
    if (canUndo()) undo();
  }, [canUndo, undo]);

  const handleRedo = useCallback(() => {
    if (canRedo()) redo();
  }, [canRedo, redo]);

  if (!project) {
    return <div className="loading">Loading MLBlocks...</div>;
  }

  // Calculate grid columns based on collapsed state
  const gridColumns = `${paletteCollapsed ? "48px" : "280px"} 1fr ${orderListCollapsed ? "48px" : "220px"}`;

  return (
    <div className="app">
      <header className="toolbar">
        <div className="toolbar-title">MLBlocks</div>
        <div className="toolbar-actions">
          <button onClick={handleUndo} disabled={!canUndo()} title="Undo (Ctrl+Z)">
            Undo
          </button>
          <button onClick={handleRedo} disabled={!canRedo()} title="Redo (Ctrl+Y)">
            Redo
          </button>
          <span className="toolbar-separator">|</span>
          <button onClick={requestConvert} disabled={!!graphError}>
            Convert
          </button>
          <button onClick={requestRun} disabled={!!graphError}>
            Run
          </button>
          <button onClick={requestDebug} disabled={!!graphError}>
            Debug
          </button>
          <button onClick={requestStop}>
            Stop
          </button>
        </div>
        {graphError && <div className="toolbar-error">{graphError}</div>}
        {lastOutputPath && <div className="toolbar-status">Output: {lastOutputPath}</div>}
      </header>
      <div className="main" style={{ gridTemplateColumns: gridColumns }}>
        <Palette 
          packs={packs} 
          collapsed={paletteCollapsed}
          onToggleCollapse={() => setPaletteCollapsed(!paletteCollapsed)}
        />
        <Canvas project={project} focusNodeId={focusNodeId} />
        <OrderList 
          project={project} 
          order={orderResult.order}
          collapsed={orderListCollapsed}
          onToggleCollapse={() => setOrderListCollapsed(!orderListCollapsed)}
        />
      </div>
    </div>
  );
};

export default App;
