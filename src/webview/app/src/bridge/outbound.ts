import { getVsCodeApi } from "./vscodeApi";
import type { Project } from "../types";

export function postProjectSave(project: Project) {
  getVsCodeApi().postMessage({
    type: "PROJECT_SAVE",
    payload: { project }
  });
}

export function requestConvert() {
  getVsCodeApi().postMessage({ type: "CONVERT_REQUEST", payload: { projectId: "" } });
}

export function requestRun() {
  getVsCodeApi().postMessage({ type: "RUN_REQUEST" });
}

export function requestDebug() {
  getVsCodeApi().postMessage({ type: "DEBUG_REQUEST" });
}

export function requestStop() {
  getVsCodeApi().postMessage({ type: "STOP_REQUEST" });
}

export function requestOpenBlock(nodeId: string) {
  getVsCodeApi().postMessage({ type: "OPEN_BLOCK_IN_EDITOR", payload: { nodeId } });
}

export function requestRunBlock(nodeId: string) {
  getVsCodeApi().postMessage({ type: "RUN_BLOCK_REQUEST", payload: { nodeId } });
}
