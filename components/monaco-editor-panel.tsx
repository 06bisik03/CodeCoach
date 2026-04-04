"use client";

import Editor from "@monaco-editor/react";

const starterCode = `def two_sum(nums, target):
    seen = {}

    for index, value in enumerate(nums):
        complement = target - value
        if complement in seen:
            return [seen[complement], index]
        seen[value] = index

    return []
`;

export function MonacoEditorPanel() {
  return (
    <Editor
      height="100%"
      defaultLanguage="python"
      defaultValue={starterCode}
      theme="vs-dark"
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
