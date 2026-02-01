import * as vscode from "vscode";
import { createDebugConfig } from "./debugConfig";

export async function startDebugging(programDir: string): Promise<boolean> {
  const folder = vscode.workspace.workspaceFolders?.[0];
  if (!folder) {
    throw new Error("No workspace folder open.");
  }
  return vscode.debug.startDebugging(folder, createDebugConfig(programDir));
}

