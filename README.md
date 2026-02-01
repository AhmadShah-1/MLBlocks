# MLBlocks (VSCode Extension)

MLBlocks provides a visual, notebook-like block canvas for assembling Python ML workflows. Users can drag predefined blocks, edit inline or in a full editor, rewire the control-flow chain, and export to a runnable `main.py`.

Notable paths* Extension: src/extension/extension.ts, src/extension/commands/*, src/extension/bridge/*

* Core logic: src/core/schema/*, src/core/graph/*, src/core/codegen/*
* Webview app: src/webview/app/*, src/webview/app/src/*
* Block packs: src/core/blocks/builtins/*.json

## Development

1. Install dependencies for the extension root:
   - `npm install`
2. Install dependencies for the webview app:
   - `npm --prefix src/webview/app install`
3. Build:
   - `npm run build`
4. Run the extension:
   - Press `F5` in VSCode.

## Commands

- `MLBlocks: Open Canvas`
- `MLBlocks: Convert Project`
- `MLBlocks: Run Project`
- `MLBlocks: Debug Project`
- `MLBlocks: Stop Execution`
