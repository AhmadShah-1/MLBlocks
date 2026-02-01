import type { Project } from "../schema/project";
import { deriveExecutionOrder } from "../graph/order";
import { buildBlockFiles } from "./blockWriter";
import { buildMainPy } from "./concatMain";
import { buildBlockMap, type BlockMap } from "./blockMap";
import { buildReadme } from "./templates/readme";
import { buildRequirements } from "./templates/requirements";

export interface GeneratedProjectFiles {
  mainPy: string;
  blockFiles: { fileName: string; content: string; blockId: string }[];
  blockMap: BlockMap;
  projectJson: string;
  readme: string;
  requirements: string;
}

export function generateProjectFiles(project: Project): GeneratedProjectFiles {
  const orderResult = deriveExecutionOrder(project);
  if (orderResult.errors.length > 0) {
    throw new Error(orderResult.errors.join(" "));
  }
  const blockFiles = buildBlockFiles(project, orderResult.order);
  const { mainPy, ranges } = buildMainPy(project, orderResult.order);
  const blockMap = buildBlockMap("main.py", ranges);
  return {
    mainPy,
    blockFiles,
    blockMap,
    projectJson: JSON.stringify(project, null, 2),
    readme: buildReadme(project.name),
    requirements: buildRequirements()
  };
}

