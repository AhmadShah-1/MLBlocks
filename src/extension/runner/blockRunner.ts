import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { spawn } from "child_process";
import type { BlockNode } from "../../core/schema/block";
import type { ExtensionState } from "../extensionState";
import { getMlblocksDir, getWorkspaceRoot } from "../fs/workspacePaths";
import type { Project } from "../../core/schema/project";
import { deriveExecutionOrder } from "../../core/graph/order";

/**
 * Run all blocks up to and including the target block
 */
export async function runBlocksUpTo(
  targetNodeId: string,
  project: Project,
  webview: vscode.Webview,
  state: ExtensionState
): Promise<void> {
  const { order, errors } = deriveExecutionOrder(project);
  
  if (errors.length > 0) {
    // Still try to run just the single block if there are order errors
    const node = project.nodes.find(n => n.id === targetNodeId);
    if (node) {
      await runSingleBlock(node, webview, state, project);
    }
    return;
  }
  
  // Find the index of the target block in execution order
  const targetIndex = order.indexOf(targetNodeId);
  if (targetIndex === -1) {
    // Node not in order chain, just run it alone
    const node = project.nodes.find(n => n.id === targetNodeId);
    if (node) {
      await runSingleBlock(node, webview, state, project);
    }
    return;
  }
  
  // Run all blocks from start to target
  const blocksToRun = order.slice(0, targetIndex + 1);
  const nodeMap = new Map(project.nodes.map(n => [n.id, n]));
  
  // Collect all code from previous blocks and run as one script
  // This preserves variable state between blocks
  const codeSegments: { nodeId: string; code: string; title: string }[] = [];
  for (const nodeId of blocksToRun) {
    const node = nodeMap.get(nodeId);
    if (node) {
      codeSegments.push({ nodeId: node.id, code: node.code, title: node.title });
    }
  }
  
  await runCombinedBlocks(codeSegments, targetNodeId, webview, state);
}

/**
 * Run combined blocks and report output for the target block
 */
async function runCombinedBlocks(
  codeSegments: { nodeId: string; code: string; title: string }[],
  targetNodeId: string,
  webview: vscode.Webview,
  state: ExtensionState
): Promise<void> {
  const root = getWorkspaceRoot();
  const tempDir = path.join(getMlblocksDir(root), "temp");
  
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  const tempFile = path.join(tempDir, `block_${targetNodeId}.py`);
  
  // Build combined code
  const combinedCode = codeSegments.map((seg, idx) => {
    const isLast = idx === codeSegments.length - 1;
    return `# === Block ${idx + 1}: ${seg.title} ===\n${seg.code}${isLast ? '' : '\n'}`;
  }).join('\n');
  
  // Wrap with figure capture
  const wrappedCode = `
import sys
import io

# Capture matplotlib figures if matplotlib is used
_mlblocks_figures = []
try:
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    
    _original_show = plt.show
    def _capture_show(*args, **kwargs):
        import base64
        for fig_num in plt.get_fignums():
            fig = plt.figure(fig_num)
            buf = io.BytesIO()
            fig.savefig(buf, format='png', bbox_inches='tight')
            buf.seek(0)
            _mlblocks_figures.append(base64.b64encode(buf.read()).decode('utf-8'))
            plt.close(fig)
    plt.show = _capture_show
except ImportError:
    pass

# Run the block code
${combinedCode}

# Output captured figures
if _mlblocks_figures:
    print("__MLBLOCKS_FIGURES__")
    for fig in _mlblocks_figures:
        print(fig)
    print("__MLBLOCKS_FIGURES_END__")
`;

  fs.writeFileSync(tempFile, wrappedCode, "utf8");
  
  const pythonPath = await getPythonPath();
  
  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    const images: string[] = [];
    
    const proc = spawn(pythonPath, [tempFile], {
      cwd: root,
      env: { ...process.env }
    });
    
    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });
    
    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });
    
    proc.on("close", () => {
      // Parse out matplotlib figures from stdout
      const figureMatch = stdout.match(/__MLBLOCKS_FIGURES__([\s\S]*?)__MLBLOCKS_FIGURES_END__/);
      if (figureMatch) {
        const figureData = figureMatch[1].trim().split("\n").filter(Boolean);
        images.push(...figureData);
        stdout = stdout.replace(/__MLBLOCKS_FIGURES__[\s\S]*?__MLBLOCKS_FIGURES_END__/, "").trim();
      }
      
      // Send output to webview for the target node
      webview.postMessage({
        type: "BLOCK_OUTPUT",
        payload: {
          nodeId: targetNodeId,
          output: {
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            images,
            timestamp: Date.now()
          }
        }
      });
      
      // Clean up
      try {
        fs.unlinkSync(tempFile);
      } catch {
        // Ignore
      }
      
      resolve();
    });
    
    proc.on("error", (err) => {
      webview.postMessage({
        type: "BLOCK_OUTPUT",
        payload: {
          nodeId: targetNodeId,
          output: {
            stdout: "",
            stderr: `Error: ${err.message}`,
            images: [],
            timestamp: Date.now()
          }
        }
      });
      resolve();
    });
  });
}

/**
 * Run a single block and capture its output
 */
export async function runSingleBlock(
  node: BlockNode,
  webview: vscode.Webview,
  state: ExtensionState,
  project?: Project
): Promise<void> {
  const root = getWorkspaceRoot();
  const tempDir = path.join(getMlblocksDir(root), "temp");
  
  // Ensure temp directory exists
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  // Write block code to temp file
  const tempFile = path.join(tempDir, `block_${node.id}.py`);
  
  // Wrap code to capture matplotlib figures
  const wrappedCode = `
import sys
import io

# Capture matplotlib figures if matplotlib is used
_mlblocks_figures = []
try:
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    
    _original_show = plt.show
    def _capture_show(*args, **kwargs):
        import base64
        for fig_num in plt.get_fignums():
            fig = plt.figure(fig_num)
            buf = io.BytesIO()
            fig.savefig(buf, format='png', bbox_inches='tight')
            buf.seek(0)
            _mlblocks_figures.append(base64.b64encode(buf.read()).decode('utf-8'))
            plt.close(fig)
    plt.show = _capture_show
except ImportError:
    pass

# Run the block code
${node.code}

# Output captured figures
if _mlblocks_figures:
    print("__MLBLOCKS_FIGURES__")
    for fig in _mlblocks_figures:
        print(fig)
    print("__MLBLOCKS_FIGURES_END__")
`;
  
  fs.writeFileSync(tempFile, wrappedCode, "utf8");
  
  // Run the block
  const pythonPath = await getPythonPath();
  
  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    const images: string[] = [];
    
    const proc = spawn(pythonPath, [tempFile], {
      cwd: root,
      env: { ...process.env }
    });
    
    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });
    
    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });
    
    proc.on("close", () => {
      // Parse out matplotlib figures from stdout
      const figureMatch = stdout.match(/__MLBLOCKS_FIGURES__([\s\S]*?)__MLBLOCKS_FIGURES_END__/);
      if (figureMatch) {
        const figureData = figureMatch[1].trim().split("\n").filter(Boolean);
        images.push(...figureData);
        // Remove figure markers from stdout
        stdout = stdout.replace(/__MLBLOCKS_FIGURES__[\s\S]*?__MLBLOCKS_FIGURES_END__/, "").trim();
      }
      
      // Send output to webview
      webview.postMessage({
        type: "BLOCK_OUTPUT",
        payload: {
          nodeId: node.id,
          output: {
            stdout: stdout.trim(),
            stderr: stderr.trim(),
            images,
            timestamp: Date.now()
          }
        }
      });
      
      // Clean up temp file
      try {
        fs.unlinkSync(tempFile);
      } catch {
        // Ignore cleanup errors
      }
      
      resolve();
    });
    
    proc.on("error", (err) => {
      webview.postMessage({
        type: "BLOCK_OUTPUT",
        payload: {
          nodeId: node.id,
          output: {
            stdout: "",
            stderr: `Error: ${err.message}`,
            images: [],
            timestamp: Date.now()
          }
        }
      });
      resolve();
    });
  });
}

async function getPythonPath(): Promise<string> {
  // Try to get Python path from VS Code Python extension
  const pythonExtension = vscode.extensions.getExtension("ms-python.python");
  if (pythonExtension) {
    if (!pythonExtension.isActive) {
      await pythonExtension.activate();
    }
    const pythonApi = pythonExtension.exports;
    if (pythonApi?.settings?.getExecutionDetails) {
      const details = pythonApi.settings.getExecutionDetails(vscode.workspace.workspaceFolders?.[0]?.uri);
      if (details?.execCommand?.[0]) {
        return details.execCommand[0];
      }
    }
  }
  
  // Fallback to system python
  return process.platform === "win32" ? "python" : "python3";
}

