import React, { useRef } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import type * as Monaco from "monaco-editor";

interface BlockEditorProps {
  value: string;
  onChange: (value: string) => void;
  lineCount?: number;
}

const LINE_HEIGHT = 19; // Monaco default line height
const PADDING = 8;

const BlockEditor: React.FC<BlockEditorProps> = ({ 
  value, 
  onChange, 
  lineCount = 5
}) => {
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);

  // Calculate height based on actual line count (1-10 lines)
  const calculatedHeight = Math.max(1, Math.min(lineCount, 10)) * LINE_HEIGHT + PADDING;

  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;
    
    // Enable paste from clipboard
    editor.addCommand(
      // Monaco.KeyMod.CtrlCmd | Monaco.KeyCode.KeyV
      2048 | 52, // CtrlCmd + V
      () => {
        navigator.clipboard.readText().then((text) => {
          const selection = editor.getSelection();
          if (selection) {
            editor.executeEdits("paste", [{
              range: selection,
              text: text,
              forceMoveMarkers: true
            }]);
          }
        }).catch(() => {
          // Fallback - let default paste work
          document.execCommand("paste");
        });
      }
    );
  };

  return (
    <div 
      className="block-editor"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <Editor
        height={`${calculatedHeight}px`}
        defaultLanguage="python"
        value={value}
        onChange={(val) => onChange(val ?? "")}
        onMount={handleEditorMount}
        options={{
          minimap: { enabled: false },
          fontSize: 12,
          lineHeight: LINE_HEIGHT,
          scrollBeyondLastLine: false,
          wordWrap: "on",
          lineNumbers: "on",
          glyphMargin: false,
          folding: false,
          lineDecorationsWidth: 0,
          lineNumbersMinChars: 3,
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          overviewRulerBorder: false,
          automaticLayout: true,
          scrollbar: {
            vertical: "auto",
            horizontal: "auto",
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8
          },
          // Clipboard options
          copyWithSyntaxHighlighting: false
        }}
      />
    </div>
  );
};

export default BlockEditor;
