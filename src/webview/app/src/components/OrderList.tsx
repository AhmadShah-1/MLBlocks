import React from "react";
import type { Project, BlockNode } from "../types";

interface OrderListProps {
  project: Project;
  order: string[];
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const OrderList: React.FC<OrderListProps> = ({ project, order, collapsed, onToggleCollapse }) => {
  const nodeById = new Map<string, BlockNode>(project.nodes.map((node) => [node.id, node]));
  
  return (
    <aside className={`order-list ${collapsed ? "collapsed" : ""}`}>
      <div className="panel-header">
        <h3>Execution Order</h3>
        <button className="panel-toggle" onClick={onToggleCollapse}>
          {collapsed ? "◀" : "▶"}
        </button>
      </div>
      
      {!collapsed && (
        <div className="order-content">
          {order.length === 0 && <div className="order-empty">No valid chain.</div>}
          {order.map((id, index) => {
            const node = nodeById.get(id);
            return (
              <div key={id} className="order-item">
                <span className="order-index">{index + 1}.</span>
                <span className="order-title">{node?.title ?? id}</span>
                {node && (
                  <span className="order-output">{node.outputBadge}</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
};

export default OrderList;
