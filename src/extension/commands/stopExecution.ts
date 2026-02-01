import * as vscode from "vscode";
import type { ExtensionState } from "../extensionState";

export function registerStop(context: vscode.ExtensionContext, state: ExtensionState) {
  const disposable = vscode.commands.registerCommand("mlblocks.stop", async () => {
    await stopExecution(state);
  });
  context.subscriptions.push(disposable);
}

export async function stopExecution(state: ExtensionState): Promise<void> {
  if (state.runningProcess) {
    state.runningProcess.kill();
    state.runningProcess = null;
  }
  if (vscode.debug.activeDebugSession) {
    await vscode.debug.stopDebugging();
  }
}

