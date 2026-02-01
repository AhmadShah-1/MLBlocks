import React, { useMemo } from "react";
import { Handle, Position } from "reactflow";
import type { BlockNode as BlockNodeType } from "../types";
import { useProjectStore } from "../state/projectStore";
import { requestOpenBlock } from "../bridge/outbound";
import BlockEditor from "./BlockEditor";

interface BlockNodeProps {
  data: { node: BlockNodeType };
}

const BlockNode: React.FC<BlockNodeProps> = ({ data }) => {
  const { node } = data;
  const updateNode = useProjectStore((state) => state.updateNode);
  const removeNode = useProjectStore((state) => state.removeNode);
  const previewLines = useProjectStore((state) => state.project?.settings.previewLines ?? 50);

  const preview = useMemo(() => {
    return node.code.split(/\r?\n/).slice(0, previewLines).join("\n");
  }, [node.code, previewLines]);

  return (
    <div className={`block-node ${node.ui.collapsed ? "collapsed" : ""}`}>
      <Handle type="target" position={Position.Left} />
      <div className="block-header">
        <input
          className="block-title"
          value={node.title}
          onChange={(event) => updateNode(node.id, { title: event.target.value })}
        />
        <div className="block-actions">
          <button onClick={() => updateNode(node.id, { ui: { ...node.ui, collapsed: !node.ui.collapsed } })}>
            {node.ui.collapsed ? "Expand" : "Collapse"}
          </button>
          <button onClick={() => requestOpenBlock(node.id)}>Open</button>
          <button onClick={() => removeNode(node.id)}>Delete</button>
        </div>
      </div>
      {!node.ui.collapsed && (
        <>
          <div className="block-badge">
            <label>Output</label>
            <input
              value={node.outputBadge}
              onChange={(event) => updateNode(node.id, { outputBadge: event.target.value })}
            />
          </div>
          <div className="block-preview">
            <div className="preview-label">Preview</div>
            <pre>{preview}</pre>
          </div>
          <BlockEditor value={node.code} onChange={(value) => updateNode(node.id, { code: value })} />
        </>
      )}
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

export default BlockNode;

