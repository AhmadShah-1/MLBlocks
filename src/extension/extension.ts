import * as vscode from "vscode";
import { registerOpenCanvas } from "./commands/openCanvas";
import { registerConvert } from "./commands/convertProject";
import { registerRun } from "./commands/runProject";
import { registerDebug } from "./commands/debugProject";
import { registerStop } from "./commands/stopExecution";
import * as path from "path";
import { ProjectStore } from "./storage/projectStore";
import { loadBuiltinPacksFromDisk } from "../core/blocks/registry";
import { getMlblocksDir, getWorkspaceRoot } from "./fs/workspacePaths";
import type { ExtensionState } from "./extensionState";

export function activate(context: vscode.ExtensionContext) {
  const outputChannel = vscode.window.createOutputChannel("MLBlocks");
  const projectStore = new ProjectStore();
  const state: ExtensionState = {
    panel: null,
    outputChannel,
    runningProcess: null,
    projectStore,
    lastGeneratedDir: null
  };

  registerOpenCanvas(context, state);
  registerConvert(context, state);
  registerRun(context, state);
  registerDebug(context, state);
  registerStop(context, state);

  context.subscriptions.push(outputChannel);

  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(async (doc) => {
      const root = getWorkspaceRoot();
      const blocksDir = path.join(getMlblocksDir(root), "blocks");
      if (!doc.uri.fsPath.startsWith(blocksDir)) {
        return;
      }
      const nodeId = path.basename(doc.uri.fsPath, ".py");
      const project = await projectStore.loadProject();
      const updatedNodes = project.nodes.map((node) =>
        node.id === nodeId ? { ...node, code: doc.getText() } : node
      );
      const updatedProject = { ...project, nodes: updatedNodes };
      await projectStore.saveProject(updatedProject);
      if (state.panel) {
        const packs = loadBuiltinPacksFromDisk(context.extensionPath);
        state.panel.webview.postMessage({
          type: "PROJECT_LOADED",
          payload: { project: updatedProject, packs }
        });
      }
    })
  );
}

export function deactivate() {
  // No-op; VSCode disposes resources via subscriptions.
}

