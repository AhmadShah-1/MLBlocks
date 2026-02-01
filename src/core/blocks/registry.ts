import * as fs from "fs";
import * as path from "path";

export interface BlockDefinition {
  blockId: string;
  name: string;
  category: string;
  section: string;
  defaultCode: string;
  defaultOutputBadge: string;
}

export interface BlockSection {
  id: string;
  name: string;
  blocks: BlockDefinition[];
}

export interface BlockCategory {
  id: string;
  name: string;
  sections: BlockSection[];
}

export interface BlockPack {
  packId: string;
  name: string;
  categories: BlockCategory[];
}

/**
 * Parse a .py file with the format:
 * # Category: SectionName
 * # START
 * # Title: BlockTitle
 * # Output: OutputType
 * ...code...
 * # END
 */
function parsePyFile(filePath: string, categoryId: string, categoryName: string): BlockSection | null {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);

  // First line should be # Category: SectionName
  const categoryLine = lines[0];
  const categoryMatch = categoryLine.match(/^#\s*Category:\s*(.+)$/i);
  if (!categoryMatch) {
    return null;
  }
  const sectionName = categoryMatch[1].trim();
  const sectionId = sectionName.toLowerCase().replace(/\s+/g, "_");

  const blocks: BlockDefinition[] = [];
  let i = 1;

  while (i < lines.length) {
    // Look for # START
    if (lines[i].trim().match(/^#\s*START\s*$/i)) {
      i++;
      // Next line: # Title: ...
      const titleMatch = lines[i]?.match(/^#\s*Title:\s*(.+)$/i);
      if (!titleMatch) {
        i++;
        continue;
      }
      const title = titleMatch[1].trim();
      i++;

      // Next line: # Output: ...
      const outputMatch = lines[i]?.match(/^#\s*Output:\s*(.+)$/i);
      if (!outputMatch) {
        i++;
        continue;
      }
      const output = outputMatch[1].trim();
      i++;

      // Collect code until # END
      const codeLines: string[] = [];
      while (i < lines.length && !lines[i].trim().match(/^#\s*END\s*$/i)) {
        codeLines.push(lines[i]);
        i++;
      }
      // Skip the # END line
      i++;

      const blockId = `${categoryId}_${sectionId}_${title.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;
      blocks.push({
        blockId,
        name: title,
        category: categoryName,
        section: sectionName,
        defaultCode: codeLines.join("\n"),
        defaultOutputBadge: output
      });
    } else {
      i++;
    }
  }

  if (blocks.length === 0) {
    return null;
  }

  return {
    id: sectionId,
    name: sectionName,
    blocks
  };
}

/**
 * Load blocks from the Categories folder structure:
 * Categories/
 *   1. category_name/
 *     1. section_file.py
 *     2. another_section.py
 *   2. another_category/
 *     ...
 */
export function loadBuiltinPacksFromDisk(baseDir: string): BlockPack[] {
  const categoriesDir = path.join(baseDir, "src", "core", "blocks", "Categories");
  
  if (!fs.existsSync(categoriesDir)) {
    // Fallback to old JSON packs if Categories folder doesn't exist
    return loadJsonPacks(baseDir);
  }

  const categories: BlockCategory[] = [];
  
  // Read category folders (sorted by number prefix)
  const categoryFolders = fs.readdirSync(categoriesDir)
    .filter((name) => fs.statSync(path.join(categoriesDir, name)).isDirectory())
    .sort((a, b) => {
      const numA = parseInt(a.match(/^(\d+)/)?.[1] || "999", 10);
      const numB = parseInt(b.match(/^(\d+)/)?.[1] || "999", 10);
      return numA - numB;
    });

  for (const categoryFolder of categoryFolders) {
    const categoryPath = path.join(categoriesDir, categoryFolder);
    // Extract category name (remove number prefix)
    const categoryName = categoryFolder.replace(/^\d+\.\s*/, "").replace(/_/g, " ");
    const categoryId = categoryName.toLowerCase().replace(/\s+/g, "_");

    const sections: BlockSection[] = [];

    // Read .py files in category folder (sorted by number prefix)
    const pyFiles = fs.readdirSync(categoryPath)
      .filter((name) => name.endsWith(".py"))
      .sort((a, b) => {
        const numA = parseInt(a.match(/^(\d+)/)?.[1] || "999", 10);
        const numB = parseInt(b.match(/^(\d+)/)?.[1] || "999", 10);
        return numA - numB;
      });

    for (const pyFile of pyFiles) {
      const pyPath = path.join(categoryPath, pyFile);
      const section = parsePyFile(pyPath, categoryId, categoryName);
      if (section) {
        sections.push(section);
      }
    }

    if (sections.length > 0) {
      categories.push({
        id: categoryId,
        name: categoryName,
        sections
      });
    }
  }

  if (categories.length === 0) {
    return loadJsonPacks(baseDir);
  }

  return [{
    packId: "categories",
    name: "Block Library",
    categories
  }];
}

function loadJsonPacks(baseDir: string): BlockPack[] {
  const packsDir = path.join(baseDir, "src", "core", "blocks", "builtins");
  if (!fs.existsSync(packsDir)) {
    return [];
  }
  const files = fs.readdirSync(packsDir).filter((file) => file.endsWith(".json"));
  return files.map((file) => {
    const fullPath = path.join(packsDir, file);
    const raw = fs.readFileSync(fullPath, "utf8");
    const pack = JSON.parse(raw);
    // Convert old format (categories with blocks) to new format (categories with sections)
    return {
      packId: pack.packId,
      name: pack.name,
      categories: pack.categories.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        sections: [{
          id: cat.id,
          name: cat.name,
          blocks: cat.blocks
        }]
      }))
    } as BlockPack;
  });
}
