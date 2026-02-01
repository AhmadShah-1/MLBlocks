import React, { useEffect, useMemo, useState } from "react";
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
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);
  const [lastOutputPath, setLastOutputPath] = useState<string | null>(null);

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
    });
  }, [setProject, setPacks, setGraphError]);

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

  if (!project) {
    return <div className="loading">Loading MLBlocks...</div>;
  }

  return (
    <div className="app">
      <header className="toolbar">
        <div className="toolbar-title">MLBlocks</div>
        <div className="toolbar-actions">
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
        {lastOutputPath && <div className="toolbar-status">Last export: {lastOutputPath}</div>}
      </header>
      <div className="main">
        <Palette packs={packs} />
        <Canvas project={project} focusNodeId={focusNodeId} />
        <OrderList project={project} order={orderResult.order} />
      </div>
    </div>
  );
};

export default App;

