export type BlockSource =
  | { kind: "builtin"; packId: string; blockId: string }
  | { kind: "custom" };

export interface BlockNode {
  id: string;
  type: "codeBlock";
  title: string;
  code: string;
  outputBadge: string;
  source: BlockSource;
  ui: {
    x: number;
    y: number;
    collapsed: boolean;
  };
}

