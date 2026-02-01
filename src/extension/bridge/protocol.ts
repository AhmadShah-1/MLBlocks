import type { Project } from "../../core/schema/project";
import type { BlockPack } from "../../core/blocks/registry";

export type WebviewToExtensionMessage =
  | { type: "PROJECT_SAVE"; payload: { project: Project } }
  | { type: "CONVERT_REQUEST"; payload: { projectId: string } }
  | { type: "RUN_REQUEST" }
  | { type: "DEBUG_REQUEST" }
  | { type: "STOP_REQUEST" }
  | { type: "OPEN_BLOCK_IN_EDITOR"; payload: { nodeId: string } };

export type ExtensionToWebviewMessage =
  | { type: "PROJECT_LOADED"; payload: { project: Project; packs: BlockPack[] } }
  | { type: "CONVERT_DONE"; payload: { outputPath: string } }
  | { type: "RUN_OUTPUT"; payload: { text: string } }
  | { type: "RUN_ERROR"; payload: { message: string; nodeId?: string; line?: number } }
  | { type: "FOCUS_BLOCK"; payload: { nodeId: string; line?: number } }
  | { type: "GRAPH_INVALID"; payload: { reason: string } }
  | { type: "READY" };

