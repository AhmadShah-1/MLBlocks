import * as fs from "fs/promises";
import * as path from "path";
import * as vscode from "vscode";
import type { ExtensionState } from "../extensionState";
import { convertProject } from "./convertProject";
import { runPython } from "../runner/processRunner";
import { parseTraceback } from "../runner/errorParser";
import type { BlockMap } from "../../core/codegen/blockMap";

export function registerRun(context: vscode.ExtensionContext, state: ExtensionState) {
  const disposable = vscode.commands.registerCommand("mlblocks.run", async () => {
    await runProject(state, state.panel?.webview ?? null);
  });
  context.subscriptions.push(disposable);
}

export async function runProject(state: ExtensionState, webview: vscode.Webview | null): Promise<void> {
  if (state.runningProcess) {
    vscode.window.showWarningMessage("MLBlocks run already in progress.");
    return;
  }
  if (!state.lastGeneratedDir) {
    await convertProject(state, webview);
  }
  if (!state.lastGeneratedDir) {
    return;
  }

  const outputChannel = state.outputChannel;
  outputChannel.show(true);
  outputChannel.appendLine("=== MLBlocks: Run ===");

  const { process } = runPython(state.lastGeneratedDir, outputChannel, async (stderr) => {
    const parsed = parseTraceback(stderr);
    if (parsed.file && parsed.line) {
      const blockMapPath = path.join(state.lastGeneratedDir as string, "blockmap.json");
      try {
        const raw = await fs.readFile(blockMapPath, "utf8");
        const blockMap = JSON.parse(raw) as BlockMap;
        const blockId = findBlockByLine(blockMap, parsed.line);
        if (blockId && webview) {
          webview.postMessage({
            type: "FOCUS_BLOCK",
            payload: { nodeId: blockId, line: parsed.line }
          });
        }
      } catch {
        // Ignore blockmap errors.
      }
    }
    if (webview) {
      webview.postMessage({
        type: "RUN_ERROR",
        payload: { message: parsed.message }
      });
    }
  });

  state.runningProcess = process;
  process.on("exit", () => {
    state.runningProcess = null;
    outputChannel.appendLine("=== MLBlocks: Run finished ===");
  });
}

function findBlockByLine(blockMap: BlockMap, line: number): string | undefined {
  return Object.entries(blockMap.blocks).find(([, entry]) => {
    return line >= entry.startLine && line <= entry.endLine;
  })?.[0];
}

