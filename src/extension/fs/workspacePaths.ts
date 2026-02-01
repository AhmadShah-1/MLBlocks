import * as path from "path";
import * as vscode from "vscode";

export function getWorkspaceRoot(): string {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    throw new Error("No workspace folder open.");
  }
  return folders[0].uri.fsPath;
}

export function getMlblocksDir(root: string): string {
  return path.join(root, ".mlblocks");
}

export function getGeneratedOutputDir(root: string): string {
  // Single output folder that gets overwritten each time
  return path.join(root, "mlblocks_output");
}
