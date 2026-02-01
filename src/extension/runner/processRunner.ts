import { spawn, type ChildProcessWithoutNullStreams } from "child_process";
import * as path from "path";
import * as vscode from "vscode";

export interface RunResult {
  process: ChildProcessWithoutNullStreams;
}

export function runPython(
  cwd: string,
  outputChannel: vscode.OutputChannel,
  onStdErr?: (text: string) => void
): RunResult {
  const mainPy = path.join(cwd, "main.py");
  const proc = spawn("python", [mainPy], { cwd });
  proc.stdout.on("data", (data) => {
    outputChannel.append(data.toString());
  });
  proc.stderr.on("data", (data) => {
    const text = data.toString();
    outputChannel.append(text);
    onStdErr?.(text);
  });
  return { process: proc };
}

