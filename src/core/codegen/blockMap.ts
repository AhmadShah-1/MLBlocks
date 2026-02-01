import type { BlockRange } from "./concatMain";

export interface BlockMapEntry {
  startLine: number;
  endLine: number;
  index: number;
  title: string;
}

export interface BlockMap {
  mainPy: string;
  blocks: Record<string, BlockMapEntry>;
}

export function buildBlockMap(mainPyFileName: string, ranges: BlockRange[]): BlockMap {
  const blocks: Record<string, BlockMapEntry> = {};
  ranges.forEach((range) => {
    blocks[range.blockId] = {
      startLine: range.startLine,
      endLine: range.endLine,
      index: range.index,
      title: range.title
    };
  });
  return {
    mainPy: mainPyFileName,
    blocks
  };
}

