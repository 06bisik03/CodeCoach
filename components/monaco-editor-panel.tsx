"use client";

import Editor from "@monaco-editor/react";

type MonacoEditorPanelProps = {
  language: string;
  value: string;
  onChange: (value: string) => void;
};

export function MonacoEditorPanel({
  language,
  value,
  onChange,
}: MonacoEditorPanelProps) {
  return (
    <Editor
      height="100%"
      language={language}
      value={value}
      theme="vs-dark"
      onChange={(nextValue) => onChange(nextValue ?? "")}
      options={{
        automaticLayout: true,
        fontSize: 15,
        lineHeight: 24,
        minimap: { enabled: false },
        padding: { top: 20 },
        scrollBeyondLastLine: false,
        wordWrap: "on",
      }}
    />
  );
}
