import Editor from "@monaco-editor/react";
import { useEffect, useRef, useState } from "react";

import {
    WebSocketMessageReader,
    WebSocketMessageWriter,
    toSocket,
} from "vscode-ws-jsonrpc";

import { createMessageConnection } from "vscode-jsonrpc/browser";
import { useEditorContext } from "../../contexts/Editor/EditorProvider";
import { useWorkspaceContext } from "../../contexts/Workspace/WorkspaceProvider";

const DEBUG = true;
const log = (...args: any[]) => {
    if (DEBUG) console.log(...args);
};


export default function CodeEditor() {
    console.log("CodeEditor");
    const { codeLang, setEditorState, editorState, buffersRef } = useEditorContext()
    const { cwd } = useWorkspaceContext()
    const [editorContent, setEditorContent] = useState<string>("");
    const version = useRef(1);
    const opened = useRef(false);
    const initialized = useRef(false);

    useEffect(() => {
        const code = editorState.activeFile ? buffersRef.current[editorState.activeFile] ?? "" : "";
        setEditorContent(code);
    }, [editorState.activeFile]);

    function toFileUri(p: string | null) {
        if (!p) return;
        return "file:///" + p.replace(/\\/g, "/");
    }


    const handleOnChange = (value: string | undefined) => {
        if (value === undefined) return;

        const path = editorState.activeFile;
        setEditorContent(value ?? "");

        if (!path) return;

        buffersRef.current[path] = value ?? "";

        if (!editorState.openFiles[path].isDirty) {
            setEditorState(prev => ({
                ...prev,
                openFiles: {
                    ...prev.openFiles,
                    [path]: {
                        ...prev.openFiles[path],
                        isDirty: true,
                    },
                },
            }));
        }
    };

    const handleMount = (editor: any, monaco: any) => {

        const ws = new WebSocket(`ws://localhost:3001?lang=${codeLang}`);
        ws.binaryType = "arraybuffer";

        ws.onopen = () => {

            const socket = toSocket(ws);
            const reader = new WebSocketMessageReader(socket);
            const writer = new WebSocketMessageWriter(socket);

            const conn = createMessageConnection(reader, writer);
            conn.listen();

            const realPath = editorState.activeFile;
            const fileUri = toFileUri(realPath);

            const rootUri = cwd ? toFileUri(cwd) : null;

            log("LSP fileUri:", fileUri);
            log("LSP rootUri:", rootUri);

            conn.sendRequest("initialize", {
                processId: null,
                rootUri,
                capabilities: {},
            }).then(() => {

                conn.sendNotification("initialized");

                conn.sendNotification("textDocument/didOpen", {
                    textDocument: {
                        uri: fileUri,
                        languageId: codeLang,
                        version: version.current,
                        text: editor.getValue(),
                    },
                });

                opened.current = true;
                initialized.current = true;
            });

            editor.onDidChangeModelContent(() => {
                if (!opened.current) return;

                version.current++;

                conn.sendNotification("textDocument/didChange", {
                    textDocument: {
                        uri: fileUri,
                        version: version.current,
                    },
                    contentChanges: [
                        {
                            text: editor.getValue(),
                        },
                    ],
                });
            });

            monaco.languages.registerCompletionItemProvider(codeLang, {
                triggerCharacters: [".", ">", ":", "("],

                provideCompletionItems: async (model: any, position: any) => {

                    if (!initialized.current) {
                        return { suggestions: [] };
                    }

                    const lspPosition = {
                        line: position.lineNumber - 1,
                        character: position.column - 1,
                    };

                    const result: any = await conn.sendRequest(
                        "textDocument/completion",
                        {
                            textDocument: { uri: fileUri },
                            position: lspPosition,
                            context: { triggerKind: 1 },
                        }
                    );

                    const items = Array.isArray(result)
                        ? result
                        : result?.items ?? [];

                    const word = model.getWordUntilPosition(position);

                    const range = {
                        startLineNumber: position.lineNumber,
                        endLineNumber: position.lineNumber,
                        startColumn: word.startColumn,
                        endColumn: word.endColumn,
                    };

                    const suggestions = items.map((item: any) => ({
                        label: item.label,
                        kind: monaco.languages.CompletionItemKind.Function,
                        insertText: item.insertText || item.label,
                        detail: item.detail,
                        documentation: item.documentation,
                        range,
                    }));

                    return { suggestions };
                },
            });

            conn.onNotification(
                "textDocument/publishDiagnostics",
                (p: any) => {

                    const markers = p.diagnostics.map((d: any) => ({
                        startLineNumber: d.range.start.line + 1,
                        startColumn: d.range.start.character + 1,
                        endLineNumber: d.range.end.line + 1,
                        endColumn: d.range.end.character + 1,
                        message: d.message,
                        severity:
                            d.severity === 1
                                ? monaco.MarkerSeverity.Error
                                : d.severity === 2
                                    ? monaco.MarkerSeverity.Warning
                                    : monaco.MarkerSeverity.Info,
                    }));

                    monaco.editor.setModelMarkers(
                        editor.getModel(),
                        codeLang,
                        markers
                    );
                }
            );
        };
    };

    return (
        <Editor
            height="100%"
            language={codeLang || "PlainText"}
            theme="vs-dark"
            value={editorContent}
            onChange={(value) => handleOnChange(value)}
            onMount={handleMount}
        />
    );
}
