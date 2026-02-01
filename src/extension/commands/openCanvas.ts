import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import type { ExtensionState } from "../extensionState";
import { registerMessageRouter } from "../bridge/messageRouter";
import { loadBuiltinPacksFromDisk } from "../../core/blocks/registry";

export function registerOpenCanvas(context: vscode.ExtensionContext, state: ExtensionState) {
  const disposable = vscode.commands.registerCommand("mlblocks.openCanvas", async () => {
    if (state.panel) {
      state.panel.reveal(vscode.ViewColumn.One);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      "mlblocks.canvas",
      "MLBlocks Canvas",
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true
      }
    );

    state.panel = panel;

    panel.onDidDispose(() => {
      state.panel = null;
    });

    panel.webview.html = getWebviewHtml(context, panel.webview);
    registerMessageRouter(panel, state);

    const project = await state.projectStore.loadProject();
    const packs = loadBuiltinPacksFromDisk(context.extensionPath);
    panel.webview.postMessage({
      type: "PROJECT_LOADED",
      payload: { project, packs }
    });
  });

  context.subscriptions.push(disposable);
}

function getWebviewHtml(context: vscode.ExtensionContext, webview: vscode.Webview): string {
  const buildDir = path.join(context.extensionPath, "src", "webview", "build");
  const indexPath = path.join(buildDir, "index.html");
  if (!fs.existsSync(indexPath)) {
    return `
      <!DOCTYPE html>
      <html>
        <body>
          <h2>MLBlocks webview not built</h2>
          <p>Run <code>npm --prefix src/webview/app install</code> and <code>npm run build:webview</code>.</p>
        </body>
      </html>
    `;
  }
  const html = fs.readFileSync(indexPath, "utf8");
  return rewriteAssetUris(html, buildDir, webview);
}

function rewriteAssetUris(html: string, buildDir: string, webview: vscode.Webview): string {
  const prefixes = ['src="', 'href="'];
  let output = html;
  for (const prefix of prefixes) {
    let index = 0;
    while ((index = output.indexOf(prefix, index)) !== -1) {
      const start = index + prefix.length;
      const end = output.indexOf('"', start);
      if (end === -1) {
        break;
      }
      const url = output.slice(start, end);
      if (url.startsWith("./assets/") || url.startsWith("/assets/")) {
        let relativePath = url;
        if (relativePath.startsWith("./")) {
          relativePath = relativePath.slice(2);
        }
        if (relativePath.startsWith("/")) {
          relativePath = relativePath.slice(1);
        }
        const filePath = path.join(buildDir, relativePath);
        const uri = webview.asWebviewUri(vscode.Uri.file(filePath)).toString();
        output = output.slice(0, start) + uri + output.slice(end);
        index = start + uri.length;
      } else {
        index = end + 1;
      }
    }
  }
  return output;
}

