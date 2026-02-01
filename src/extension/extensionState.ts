import type * as vscode from "vscode";
import type { ChildProcessWithoutNullStreams } from "child_process";
import type { ProjectStore } from "./storage/projectStore";

export interface ExtensionState {
  panel: vscode.WebviewPanel | null;
  outputChannel: vscode.OutputChannel;
  runningProcess: ChildProcessWithoutNullStreams | null;
  projectStore: ProjectStore;
  lastGeneratedDir: string | null;
}

