import * as path from "path";

export function createDebugConfig(programDir: string) {
  return {
    name: "MLBlocks Debug",
    type: "python",
    request: "launch",
    program: path.join(programDir, "main.py"),
    cwd: programDir,
    console: "integratedTerminal"
  };
}

