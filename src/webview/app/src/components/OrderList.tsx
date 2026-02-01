import React from "react";
import type { Project } from "../types";

interface OrderListProps {
  project: Project;
  order: string[];
}

const OrderList: React.FC<OrderListProps> = ({ project, order }) => {
  const nodeById = new Map(project.nodes.map((node) => [node.id, node]));
  return (
    <aside className="order-list">
      <h3>Execution Order</h3>
      {order.length === 0 && <div className="order-empty">No valid chain.</div>}
      {order.map((id, index) => (
        <div key={id} className="order-item">
          {index + 1}. {nodeById.get(id)?.title ?? id}
        </div>
      ))}
    </aside>
  );
};

export default OrderList;

