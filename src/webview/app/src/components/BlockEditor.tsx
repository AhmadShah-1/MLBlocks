import React from "react";
import Editor from "@monaco-editor/react";

interface BlockEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const BlockEditor: React.FC<BlockEditorProps> = ({ value, onChange }) => {
  return (
    <div className="block-editor">
      <Editor
        height="200px"
        defaultLanguage="python"
        value={value}
        onChange={(val) => onChange(val ?? "")}
        options={{
          minimap: { enabled: false },
          fontSize: 12,
          scrollBeyondLastLine: false,
          wordWrap: "on"
        }}
      />
    </div>
  );
};

export default BlockEditor;

