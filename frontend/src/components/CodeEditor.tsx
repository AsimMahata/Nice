import { useRef } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import * as monaco from "monaco-editor";

type CodeEditorProps = {
  code: string,
  setCode: (value: string) => void,
  lang: string
};

export default function CodeEditor({ code, setCode, lang }: CodeEditorProps) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor;
    editor.focus();
  };

  return (
    <Editor
      height="100%"
      language={lang}
      theme="vs-dark"
      defaultValue=""
      value={code}
      onChange={(value,) => setCode(value || "")}
      onMount={handleMount}
      options={{
        fontSize: 14,
        minimap: { enabled: false },
        automaticLayout: true,
        scrollBeyondLastLine: false,
      }}
    />
  );
}
