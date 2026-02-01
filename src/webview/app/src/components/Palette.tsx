import React from "react";
import type { BlockDefinition, BlockPack } from "../types";
import { useProjectStore } from "../state/projectStore";

interface PaletteProps {
  packs: BlockPack[];
}

const Palette: React.FC<PaletteProps> = ({ packs }) => {
  const addNodeFromDefinition = useProjectStore((state) => state.addNodeFromDefinition);

  const handleDragStart = (event: React.DragEvent, block: BlockDefinition) => {
    event.dataTransfer.setData("application/mlblocks", JSON.stringify(block));
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <aside className="palette">
      <h3>Block Palette</h3>
      {packs.map((pack) => (
        <div key={pack.packId} className="palette-pack">
          <div className="palette-pack-title">{pack.name}</div>
          {pack.categories.map((category) => (
            <div key={category.id} className="palette-category">
              <div className="palette-category-title">{category.name}</div>
              <div className="palette-blocks">
                {category.blocks.map((block) => {
                  const blockWithPack = { ...block, packId: pack.packId };
                  return (
                  <button
                    key={block.blockId}
                    draggable
                    onDragStart={(event) => handleDragStart(event, blockWithPack)}
                    onClick={() => addNodeFromDefinition(blockWithPack, { x: 120, y: 120 })}
                  >
                    {block.name}
                  </button>
                );
                })}
              </div>
            </div>
          ))}
        </div>
      ))}
    </aside>
  );
};

export default Palette;

