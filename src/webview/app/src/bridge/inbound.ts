import type { BlockPack, Project, BlockOutput } from "../types";

export type InboundMessage =
  | { type: "PROJECT_LOADED"; payload: { project: Project; packs: BlockPack[] } }
  | { type: "CONVERT_DONE"; payload: { outputPath: string } }
  | { type: "RUN_ERROR"; payload: { message: string; nodeId?: string; line?: number } }
  | { type: "FOCUS_BLOCK"; payload: { nodeId: string; line?: number } }
  | { type: "GRAPH_INVALID"; payload: { reason: string } }
  | { type: "BLOCK_OUTPUT"; payload: { nodeId: string; output: BlockOutput } };

export function registerInbound(handler: (message: InboundMessage) => void) {
  window.addEventListener("message", (event) => {
    const message = event.data as InboundMessage;
    if (!message?.type) {
      return;
    }
    handler(message);
  });
}
