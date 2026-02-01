import * as path from "path";
import * as vscode from "vscode";
import type { ExtensionState } from "../extensionState";
import { generateProjectFiles } from "../../core/codegen/generator";
import { getGeneratedOutputDir, getWorkspaceRoot } from "../fs/workspacePaths";
import { writeFileSafe, ensureDir } from "../fs/fileWriter";

export function registerConvert(context: vscode.ExtensionContext, state: ExtensionState) {
  const disposable = vscode.commands.registerCommand("mlblocks.convert", async () => {
    await convertProject(state, state.panel?.webview ?? null);
  });
  context.subscriptions.push(disposable);
}

export async function convertProject(
  state: ExtensionState,
  webview: vscode.Webview | null
): Promise<void> {
  const project = await state.projectStore.loadProject();
  let generated;
  try {
    generated = generateProjectFiles(project);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid graph.";
    vscode.window.showErrorMessage(message);
    webview?.postMessage({
      type: "GRAPH_INVALID",
      payload: { reason: message }
    });
    return;
  }

  const root = getWorkspaceRoot();
  const outDir = getGeneratedOutputDir(root);

  await ensureDir(outDir);
  const blocksDir = path.join(outDir, "blocks");
  await ensureDir(blocksDir);

  await writeFileSafe(path.join(outDir, "main.py"), generated.mainPy);
  await writeFileSafe(path.join(outDir, "blockmap.json"), JSON.stringify(generated.blockMap, null, 2));
  await writeFileSafe(path.join(outDir, "project.graph.json"), generated.projectJson);
  await writeFileSafe(path.join(outDir, "README.md"), generated.readme);
  await writeFileSafe(path.join(outDir, "requirements.txt"), generated.requirements);

  for (const blockFile of generated.blockFiles) {
    await writeFileSafe(path.join(blocksDir, blockFile.fileName), blockFile.content);
  }

  state.lastGeneratedDir = outDir;
  if (webview) {
    webview.postMessage({
      type: "CONVERT_DONE",
      payload: { outputPath: outDir }
    });
  }
}

