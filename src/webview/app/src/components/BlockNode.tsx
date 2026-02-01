import React, { useMemo, useState, useRef, useCallback } from "react";
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
  const [showOutput, setShowOutput] = useState(true);
  const [outputSize, setOutputSize] = useState({ width: 0, height: 150 });
  const resizeRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);
  const resizeStart = useRef({ x: 0, y: 0, width: 0, height: 0 });

  // Calculate line count for dynamic editor height
  const lineCount = useMemo(() => {
    const lines = node.code.split(/\r?\n/).length;
    return Math.max(1, Math.min(lines, 10)); // 1 to 10 lines
  }, [node.code]);

  const hasOutput = node.output && (node.output.stdout || node.output.stderr || node.output.images.length > 0);

  // Resize handlers
  const handleResizeStart = useCallback((e: React.MouseEvent, direction: 'vertical' | 'horizontal' | 'both') => {
    e.preventDefault();
    e.stopPropagation();
    isResizing.current = true;
    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      width: outputSize.width || (resizeRef.current?.offsetWidth || 300),
      height: outputSize.height
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizing.current) return;
      
      const deltaX = moveEvent.clientX - resizeStart.current.x;
      const deltaY = moveEvent.clientY - resizeStart.current.y;

      setOutputSize((prev) => ({
        width: direction !== 'vertical' ? Math.max(200, resizeStart.current.width + deltaX) : prev.width,
        height: direction !== 'horizontal' ? Math.max(50, resizeStart.current.height + deltaY) : prev.height
      }));
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [outputSize.width, outputSize.height]);

  return (
    <div 
      className={`block-node ${node.ui.collapsed ? "collapsed" : ""}`}
      style={outputSize.width > 0 ? { width: outputSize.width } : undefined}
    >
      {/* Input handle - green */}
      <Handle 
        type="target" 
        position={Position.Left} 
        className="handle-input"
      />
      
      {/* Header is the drag handle */}
      <div className="block-header">
        {/* Drag grip */}
        <div className="block-drag-grip" title="Drag to move">
          <span></span>
          <span></span>
          <span></span>
        </div>
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
            <div className="block-output-section" ref={resizeRef}>
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
                <div 
                  className="block-output-panel"
                  style={{ 
                    height: outputSize.height,
                    maxHeight: 'none'
                  }}
                >
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
                  {/* Resize handles */}
                  <div 
                    className="output-resize-handle output-resize-vertical"
                    onMouseDown={(e) => handleResizeStart(e, 'vertical')}
                    title="Drag to resize vertically"
                  />
                  <div 
                    className="output-resize-handle output-resize-horizontal"
                    onMouseDown={(e) => handleResizeStart(e, 'horizontal')}
                    title="Drag to resize horizontally"
                  />
                  <div 
                    className="output-resize-handle output-resize-corner"
                    onMouseDown={(e) => handleResizeStart(e, 'both')}
                    title="Drag to resize"
                  />
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
