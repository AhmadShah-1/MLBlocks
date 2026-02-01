import type { WebviewToExtensionMessage } from "./protocol";

export function isWebviewMessage(value: unknown): value is WebviewToExtensionMessage {
  if (!value || typeof value !== "object") {
    return false;
  }
  const message = value as { type?: unknown; payload?: unknown };
  if (typeof message.type !== "string") {
    return false;
  }
  switch (message.type) {
    case "PROJECT_SAVE":
      return typeof message.payload === "object" && message.payload !== null;
    case "CONVERT_REQUEST":
      return typeof message.payload === "object" && message.payload !== null;
    case "RUN_REQUEST":
    case "DEBUG_REQUEST":
    case "STOP_REQUEST":
      return true;
    case "OPEN_BLOCK_IN_EDITOR":
    case "RUN_BLOCK_REQUEST":
      return typeof message.payload === "object" && message.payload !== null;
    default:
      return false;
  }
}
