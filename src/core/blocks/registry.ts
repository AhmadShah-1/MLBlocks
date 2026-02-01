import * as fs from "fs";
import * as path from "path";

export interface BlockDefinition {
  blockId: string;
  name: string;
  category: string;
  defaultCode: string;
  defaultOutputBadge: string;
}

export interface BlockCategory {
  id: string;
  name: string;
  blocks: BlockDefinition[];
}

export interface BlockPack {
  packId: string;
  name: string;
  categories: BlockCategory[];
}

export function loadBuiltinPacksFromDisk(baseDir: string): BlockPack[] {
  const packsDir = path.join(baseDir, "src", "core", "blocks", "builtins");
  if (!fs.existsSync(packsDir)) {
    return [];
  }
  const files = fs.readdirSync(packsDir).filter((file) => file.endsWith(".json"));
  return files.map((file) => {
    const fullPath = path.join(packsDir, file);
    const raw = fs.readFileSync(fullPath, "utf8");
    return JSON.parse(raw) as BlockPack;
  });
}

