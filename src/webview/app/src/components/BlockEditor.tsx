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
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate height based on actual line count (1-10 lines)
  const calculatedHeight = Math.max(1, Math.min(lineCount, 10)) * LINE_HEIGHT + PADDING;

  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;
    
    // Override paste handler to ensure it works in this specific editor
    editor.addAction({
      id: 'mlblocks-paste',
      label: 'Paste',
      keybindings: [2048 | 52], // CtrlCmd + V
      run: async (ed) => {
        try {
          const text = await navigator.clipboard.readText();
          const selection = ed.getSelection();
          if (selection) {
            ed.executeEdits("paste", [{
              range: selection,
              text: text,
              forceMoveMarkers: true
            }]);
            // Move cursor to end of pasted text
            const model = ed.getModel();
            if (model) {
              const newPos = model.getPositionAt(
                model.getOffsetAt(selection.getStartPosition()) + text.length
              );
              ed.setPosition(newPos);
            }
          }
        } catch (err) {
          // Fallback - trigger Monaco's default paste
          ed.trigger('keyboard', 'editor.action.clipboardPasteAction', null);
        }
      }
    });
  };

  // Handle paste event at the container level as backup
  const handlePaste = async (e: React.ClipboardEvent) => {
    e.stopPropagation();
    const editor = editorRef.current;
    if (!editor || !editor.hasTextFocus()) return;
    
    e.preventDefault();
    const text = e.clipboardData?.getData('text/plain') || '';
    const selection = editor.getSelection();
    if (selection) {
      editor.executeEdits("paste", [{
        range: selection,
        text: text,
        forceMoveMarkers: true
      }]);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="block-editor"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        // Focus the editor when clicking the container
        if (editorRef.current) {
          editorRef.current.focus();
        }
      }}
      onPaste={handlePaste}
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
