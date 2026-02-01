import * as vscode from "vscode";
import type { ExtensionState } from "../extensionState";
import { convertProject } from "./convertProject";
import { startDebugging } from "../debug/debugLauncher";

export function registerDebug(context: vscode.ExtensionContext, state: ExtensionState) {
  const disposable = vscode.commands.registerCommand("mlblocks.debug", async () => {
    await debugProject(state, state.panel?.webview ?? null);
  });
  context.subscriptions.push(disposable);
}

export async function debugProject(
  state: ExtensionState,
  webview: vscode.Webview | null
): Promise<void> {
  if (!state.lastGeneratedDir) {
    await convertProject(state, webview);
  }
  if (!state.lastGeneratedDir) {
    return;
  }
  await startDebugging(state.lastGeneratedDir);
}

