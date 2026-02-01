import React, { useMemo, useState } from "react";
import { Handle, Position } from "reactflow";
import type { BlockNode as BlockNodeType } from "../types";
import { useProjectStore } from "../state/projectStore";
import { requestOpenBlock, requestRunBlock } from "../bridge/outbound";
import BlockEditor from "./BlockEditor";

interface BlockNodeProps {
  data: { node: BlockNodeType };
}

const BlockNode: React.FC<BlockNodeProps> = ({ data }) => {
  const { node } = data;
  const updateNode = useProjectStore((state) => state.updateNode);
  const removeNode = useProjectStore((state) => state.removeNode);
  const clearNodeOutput = useProjectStore((state) => state.clearNodeOutput);
  const [showOutput, setShowOutput] = useState(false);

  // Calculate line count for dynamic editor height
  const lineCount = useMemo(() => {
    const lines = node.code.split(/\r?\n/).length;
    return Math.max(1, Math.min(lines, 10)); // 1 to 10 lines
  }, [node.code]);

  const hasOutput = node.output && (node.output.stdout || node.output.stderr || node.output.images.length > 0);

  return (
    <div className={`block-node ${node.ui.collapsed ? "collapsed" : ""}`}>
      {/* Input handle - green */}
      <Handle 
        type="target" 
        position={Position.Left} 
        className="handle-input"
      />
      
      {/* Header is the drag handle */}
      <div className="block-header">
        <input
          className="block-title nodrag"
          value={node.title}
          onChange={(event) => updateNode(node.id, { title: (event.target as HTMLInputElement).value })}
          onMouseDown={(e) => e.stopPropagation()}
        />
        <div className="block-actions">
          <button onClick={() => updateNode(node.id, { ui: { ...node.ui, collapsed: !node.ui.collapsed } })}>
            {node.ui.collapsed ? "▼" : "▲"}
          </button>
          <button onClick={() => requestRunBlock(node.id)} title="Run this block">
            Run Block
          </button>
          <button onClick={() => requestOpenBlock(node.id)} title="Open in editor">
            Open Editor
          </button>
          <button onClick={() => removeNode(node.id)} title="Delete block">
            Delete Block
          </button>
        </div>
      </div>
      
      {!node.ui.collapsed && (
        <div className="nodrag nowheel">
          <div className="block-badge">
            <label>Output</label>
            <input
              value={node.outputBadge}
              onChange={(event) => updateNode(node.id, { outputBadge: (event.target as HTMLInputElement).value })}
              onMouseDown={(e) => e.stopPropagation()}
            />
          </div>
          <BlockEditor 
            value={node.code} 
            onChange={(value) => updateNode(node.id, { code: value })}
            lineCount={lineCount}
          />
          
          {/* Output Panel */}
          {hasOutput && (
            <div className="block-output-section">
              <div className="block-output-header">
                <button 
                  className="output-toggle"
                  onClick={() => setShowOutput(!showOutput)}
                >
                  {showOutput ? "▼ Hide Output" : "▶ Show Output"}
                </button>
                <button 
                  className="output-clear"
                  onClick={() => clearNodeOutput(node.id)}
                >
                  Clear
                </button>
              </div>
              {showOutput && (
                <div className="block-output-panel">
                  {node.output?.stdout && (
                    <pre>{node.output.stdout}</pre>
                  )}
                  {node.output?.stderr && (
                    <pre className="output-error">{node.output.stderr}</pre>
                  )}
                  {node.output?.images.map((img, i) => (
                    <img 
                      key={i} 
                      src={`data:image/png;base64,${img}`} 
                      alt={`Output ${i + 1}`}
                      className="output-image"
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Output handle - red */}
      <Handle 
        type="source" 
        position={Position.Right}
        className="handle-output"
      />
    </div>
  );
};

export default BlockNode;
