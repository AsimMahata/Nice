import { useRef } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import * as monaco from "monaco-editor";

type CodeEditorProps = {
  code: string,
  setCode: (value: string) => void
};

export default function CodeEditor({ code, setCode }: CodeEditorProps) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  return (
    <Editor
      height="70vh"
      language="cpp"
      theme="vs-dark"
      defaultValue="//writesomething"
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
