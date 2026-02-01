import * as vscode from "vscode";
import type { ExtensionState } from "../extensionState";
import { isWebviewMessage } from "./validators";
import type { WebviewToExtensionMessage } from "./protocol";
import { convertProject } from "../commands/convertProject";
import { runProject } from "../commands/runProject";
import { debugProject } from "../commands/debugProject";
import { stopExecution } from "../commands/stopExecution";
import { findNodeById } from "../storage/projectUtils";
import { runSingleBlock } from "../runner/blockRunner";

export function registerMessageRouter(panel: vscode.WebviewPanel, state: ExtensionState) {
  panel.webview.onDidReceiveMessage(async (raw) => {
    if (!isWebviewMessage(raw)) {
      return;
    }
    await handleMessage(panel, state, raw);
  });
}

async function handleMessage(
  panel: vscode.WebviewPanel,
  state: ExtensionState,
  message: WebviewToExtensionMessage
) {
  switch (message.type) {
    case "PROJECT_SAVE":
      await state.projectStore.saveProject(message.payload.project);
      break;
    case "CONVERT_REQUEST":
      await convertProject(state, panel.webview);
      break;
    case "RUN_REQUEST":
      await runProject(state, panel.webview);
      break;
    case "DEBUG_REQUEST":
      await debugProject(state, panel.webview);
      break;
    case "STOP_REQUEST":
      await stopExecution(state);
      break;
    case "OPEN_BLOCK_IN_EDITOR": {
      const project = await state.projectStore.loadProject();
      const node = findNodeById(project, message.payload.nodeId);
      if (!node) {
        vscode.window.showWarningMessage("Block not found.");
        return;
      }
      const uri = await state.projectStore.openBlockFile(node.id, node.code);
      const doc = await vscode.workspace.openTextDocument(uri);
      await vscode.window.showTextDocument(doc, { preview: false });
      break;
    }
    case "RUN_BLOCK_REQUEST": {
      const project = await state.projectStore.loadProject();
      const node = findNodeById(project, message.payload.nodeId);
      if (!node) {
        vscode.window.showWarningMessage("Block not found.");
        return;
      }
      await runSingleBlock(node, panel.webview, state);
      break;
    }
    default:
      break;
  }
}
