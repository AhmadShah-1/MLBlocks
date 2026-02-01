import React, { useState, useMemo, useRef, useEffect } from "react";
import type { BlockDefinition, BlockPack, BlockCategory, BlockSection } from "../types";
import { useProjectStore } from "../state/projectStore";

interface PaletteProps {
  packs: BlockPack[];
  collapsed: boolean;
  onToggleCollapse: () => void;
}

type NavigationLevel = "categories" | "sections" | "blocks";

interface NavigationState {
  level: NavigationLevel;
  selectedCategory: BlockCategory | null;
  selectedSection: BlockSection | null;
}

interface DragState {
  isDragging: boolean;
  block: BlockDefinition | null;
  position: { x: number; y: number };
}

const Palette: React.FC<PaletteProps> = ({ packs, collapsed, onToggleCollapse }) => {
  const addNodeFromDefinition = useProjectStore((state) => state.addNodeFromDefinition);
  const [nav, setNav] = useState<NavigationState>({
    level: "categories",
    selectedCategory: null,
    selectedSection: null
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<BlockDefinition[] | null>(null);
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    block: null,
    position: { x: 0, y: 0 }
  });
  const blockRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  // Flatten all blocks for search
  const allBlocks = useMemo(() => {
    const blocks: (BlockDefinition & { packId: string; categoryName: string; sectionName: string })[] = [];
    for (const pack of packs) {
      for (const category of pack.categories) {
        for (const section of category.sections) {
          for (const block of section.blocks) {
            blocks.push({
              ...block,
              packId: pack.packId,
              categoryName: category.name,
              sectionName: section.name
            });
          }
        }
      }
    }
    return blocks;
  }, [packs]);

  // Fuzzy search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults(null);
      setFocusedBlockId(null);
      return;
    }
    const lowerQuery = query.toLowerCase();
    const results = allBlocks.filter((block) =>
      block.name.toLowerCase().includes(lowerQuery) ||
      block.categoryName.toLowerCase().includes(lowerQuery) ||
      block.sectionName.toLowerCase().includes(lowerQuery)
    );
    setSearchResults(results);
  };

  // Navigate to block from search
  const navigateToBlock = (block: BlockDefinition & { packId: string; categoryName: string; sectionName: string }) => {
    const pack = packs.find((p) => p.packId === block.packId);
    if (!pack) return;
    const category = pack.categories.find((c) => c.name === block.categoryName);
    if (!category) return;
    const section = category.sections.find((s) => s.name === block.sectionName);
    if (!section) return;

    setNav({
      level: "blocks",
      selectedCategory: category,
      selectedSection: section
    });
    setSearchQuery("");
    setSearchResults(null);
    setFocusedBlockId(block.blockId);
  };

  // Scroll to focused block
  useEffect(() => {
    if (focusedBlockId) {
      const ref = blockRefs.current.get(focusedBlockId);
      if (ref) {
        ref.scrollIntoView({ behavior: "smooth", block: "center" });
        ref.focus();
      }
    }
  }, [focusedBlockId, nav.level]);

  const handleDragStart = (event: React.DragEvent, block: BlockDefinition, packId: string) => {
    const blockWithPack = { ...block, packId };
    event.dataTransfer.setData("application/mlblocks", JSON.stringify(blockWithPack));
    event.dataTransfer.effectAllowed = "move";

    // Start tracking drag for custom preview
    setDragState({
      isDragging: true,
      block: blockWithPack,
      position: { x: event.clientX, y: event.clientY }
    });

    // Create drag preview
    const preview = document.createElement("div");
    preview.className = "drag-preview";
    preview.textContent = block.name;
    preview.style.cssText = `
      position: fixed;
      padding: 8px 12px;
      background: #fff3d6;
      border: 2px solid #f0b45b;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      pointer-events: none;
      z-index: 9999;
      transform: translate(-50%, -50%);
    `;
    document.body.appendChild(preview);
    event.dataTransfer.setDragImage(preview, preview.offsetWidth / 2, preview.offsetHeight / 2);
    
    // Clean up preview after drag starts
    requestAnimationFrame(() => {
      document.body.removeChild(preview);
    });
  };

  const handleDragEnd = () => {
    setDragState({ isDragging: false, block: null, position: { x: 0, y: 0 } });
  };

  // Track mouse position during drag
  useEffect(() => {
    if (!dragState.isDragging) return;
    
    const handleDrag = (event: DragEvent) => {
      if (event.clientX > 0 && event.clientY > 0) {
        setDragState((prev) => ({
          ...prev,
          position: { x: event.clientX, y: event.clientY }
        }));
      }
    };
    
    document.addEventListener("drag", handleDrag);
    return () => document.removeEventListener("drag", handleDrag);
  }, [dragState.isDragging]);

  const goBack = () => {
    if (nav.level === "blocks") {
      setNav({ level: "sections", selectedCategory: nav.selectedCategory, selectedSection: null });
    } else if (nav.level === "sections") {
      setNav({ level: "categories", selectedCategory: null, selectedSection: null });
    }
    setFocusedBlockId(null);
  };

  const selectCategory = (category: BlockCategory) => {
    setNav({ level: "sections", selectedCategory: category, selectedSection: null });
    setFocusedBlockId(null);
  };

  const selectSection = (section: BlockSection) => {
    setNav({ level: "blocks", selectedCategory: nav.selectedCategory, selectedSection: section });
    setFocusedBlockId(null);
  };

  // All categories across all packs
  const allCategories = useMemo(() => {
    return packs.flatMap((pack) =>
      pack.categories.map((cat) => ({ ...cat, packId: pack.packId }))
    );
  }, [packs]);

  // Get packId for current navigation context
  const currentPackId = useMemo(() => {
    if (!nav.selectedCategory) return packs[0]?.packId || "categories";
    for (const pack of packs) {
      if (pack.categories.some((c) => c.id === nav.selectedCategory?.id)) {
        return pack.packId;
      }
    }
    return "categories";
  }, [nav.selectedCategory, packs]);

  return (
    <aside className={`palette ${collapsed ? "collapsed" : ""}`}>
      <div className="panel-header">
        <h3>Block Palette</h3>
        <button className="panel-toggle" onClick={onToggleCollapse}>
          {collapsed ? "▶" : "◀"}
        </button>
      </div>

      {!collapsed && (
        <>
          {/* Search */}
          <div className="palette-search">
            <input
              type="text"
              placeholder="Search blocks..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>

          {/* Search Results */}
          {searchResults !== null && (
            <div className="palette-search-results">
              <div className="palette-search-header">
                Search Results ({searchResults.length})
                <button className="palette-clear-search" onClick={() => handleSearch("")}>Clear</button>
              </div>
              {searchResults.length === 0 ? (
                <div className="palette-no-results">No blocks found</div>
              ) : (
                <div className="palette-blocks">
                  {searchResults.map((block) => (
                    <button
                      key={block.blockId}
                      className="palette-search-result"
                      onClick={() => navigateToBlock(block)}
                    >
                      <span className="block-name">{block.name}</span>
                      <span className="block-path">{block.categoryName} / {block.sectionName}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          {searchResults === null && (
            <>
              {/* Back button */}
              {nav.level !== "categories" && (
                <button className="palette-back" onClick={goBack}>
                  ← Back
                </button>
              )}

              {/* Categories */}
              {nav.level === "categories" && (
                <div className="palette-nav">
                  <div className="palette-nav-title">Categories</div>
                  <div className="palette-nav-items">
                    {allCategories.map((category) => (
                      <button
                        key={category.id}
                        className="palette-nav-item"
                        onClick={() => selectCategory(category)}
                      >
                        {category.name}
                        <span className="palette-nav-arrow">→</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sections */}
              {nav.level === "sections" && nav.selectedCategory && (
                <div className="palette-nav">
                  <div className="palette-nav-title">{nav.selectedCategory.name}</div>
                  <div className="palette-nav-items">
                    {nav.selectedCategory.sections.map((section) => (
                      <button
                        key={section.id}
                        className="palette-nav-item"
                        onClick={() => selectSection(section)}
                      >
                        {section.name}
                        <span className="palette-nav-count">({section.blocks.length})</span>
                        <span className="palette-nav-arrow">→</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Blocks */}
              {nav.level === "blocks" && nav.selectedSection && (
                <div className="palette-nav">
                  <div className="palette-nav-title">{nav.selectedSection.name}</div>
                  <div className="palette-blocks">
                    {nav.selectedSection.blocks.map((block) => {
                      const blockWithPack = { ...block, packId: currentPackId };
                      return (
                        <button
                          key={block.blockId}
                          ref={(el) => {
                            if (el) blockRefs.current.set(block.blockId, el);
                          }}
                          className={`palette-block ${focusedBlockId === block.blockId ? "focused" : ""}`}
                          draggable
                          onDragStart={(event) => handleDragStart(event, blockWithPack, currentPackId)}
                          onDragEnd={handleDragEnd}
                          onClick={() => addNodeFromDefinition(blockWithPack, { x: 120, y: 120 })}
                        >
                          <span className="block-name">{block.name}</span>
                          <span className="block-output">{block.defaultOutputBadge}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Custom drag preview overlay */}
      {dragState.isDragging && dragState.block && (
        <div
          className="drag-overlay"
          style={{
            position: "fixed",
            left: dragState.position.x,
            top: dragState.position.y,
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
            zIndex: 10000
          }}
        >
          <div className="drag-preview-live">
            {dragState.block.name}
          </div>
        </div>
      )}
    </aside>
  );
};

export default Palette;
