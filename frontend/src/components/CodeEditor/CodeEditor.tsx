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
import { useSettingsContext } from "../../contexts/Settings/SettingsProvider";

const DEBUG = true;
const log = (...args: any[]) => {
    if (DEBUG) console.log(...args);
};


export default function CodeEditor() {
    console.log("CodeEditor");
    const { codeLang, setEditorState, editorState, buffersRef } = useEditorContext()
    const { cwd } = useWorkspaceContext()
    const [editorContent, setEditorContent] = useState<string>("");
    const { settings } = useSettingsContext()
    const editorRef = useRef<any>(null);

    // Fetch snippets on codeLang change
    useEffect(() => {
        const fetchSnippets = async () => {
            if (codeLang && window.snippets) {
                const data = await window.snippets.getSnippetsParsed(codeLang);
                snippetsRef.current = data || {};
            }
        };
        fetchSnippets();
    }, [codeLang]);

    // Sync model-specific options when settings change
    useEffect(() => {
        if (editorRef.current) {
            const model = editorRef.current.getModel();
            if (model) {
                model.updateOptions({
                    tabSize: settings.editor.tabSize,
                    insertSpaces: settings.editor.insertSpaces
                });
            }
            // Update editor visual options
            editorRef.current.updateOptions({
                fontFamily: settings.editor.fontFamily,
                fontWeight: settings.editor.fontWeight,
                fontSize: settings.editor.fontSize,
                lineHeight: settings.editor.lineHeight,
                letterSpacing: settings.editor.letterSpacing,
                cursorBlinking: settings.editor.cursorBlinking,
                cursorSmoothCaretAnimation: settings.editor.cursorSmoothCaretAnimation,
                fontLigatures: settings.editor.fontLigatures,
                wordWrap: settings.editor.wordWrap,
                minimap: { enabled: settings.editor.minimap },
                lineNumbers: settings.editor.lineNumbers,
                smoothScrolling: settings.editor.smoothScrolling,
                autoClosingBrackets: settings.editor.autoClosingBrackets,
                autoClosingQuotes: settings.editor.autoClosingQuotes,
            });
        }
    }, [settings.editor]);

    const code =
        editorState.activeFile
            ? editorState.openFiles[editorState.activeFile]?.content ?? ""
            : "";

    const version = useRef(1);
    const opened = useRef(false);
    const initialized = useRef(false);
    const wsRef = useRef<WebSocket | null>(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            disposables.current.forEach(d => d.dispose());
            if (wsRef.current) wsRef.current.close();
        };
    }, []);

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
        editorRef.current = editor;
        
        // Initial sync of model options
        const model = editor.getModel();
        if (model) {
            model.updateOptions({
                tabSize: settings.editor.tabSize,
                insertSpaces: settings.editor.insertSpaces
            });
        }

        // Clean up previous connections and providers
        if (wsRef.current) {
            wsRef.current.close();
        }
        disposables.current.forEach(d => d.dispose());
        disposables.current = [];

        const ws = new WebSocket(`ws://localhost:3001?lang=${codeLang}`);
        wsRef.current = ws;
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

            const lspProvider = monaco.languages.registerCompletionItemProvider(codeLang, {
                triggerCharacters: [".", ">", ":", "("],

                provideCompletionItems: async (model: any, position: any) => {

                    if (!initialized.current) {
                        return { suggestions: [] };
                    }

                    const lspPosition = {
                        line: position.lineNumber - 1,
                        character: position.column - 1,
                    };

                    let items: any[] = [];
                    try {
                        const result: any = await conn.sendRequest(
                            "textDocument/completion",
                            {
                                textDocument: { uri: fileUri },
                                position: lspPosition,
                                context: { triggerKind: 1 },
                            }
                        );
                        items = Array.isArray(result) ? result : result?.items ?? [];
                    } catch (err) {
                        console.warn("LSP completion failed:", err);
                    }

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
            disposables.current.push(lspProvider);

            // Register a separate, dedicated provider for snippets so they aren't blocked by LSP latency/failures
            const snippetProvider = monaco.languages.registerCompletionItemProvider(codeLang, {
                provideCompletionItems: (model: any, position: any) => {
                    const word = model.getWordUntilPosition(position);
                    const range = {
                        startLineNumber: position.lineNumber,
                        endLineNumber: position.lineNumber,
                        startColumn: word.startColumn,
                        endColumn: word.endColumn,
                    };

                    const suggestions: any[] = [];
                    Object.keys(snippetsRef.current).forEach((key) => {
                        const snippet = snippetsRef.current[key];
                        suggestions.push({
                            label: snippet.prefix,
                            kind: monaco.languages.CompletionItemKind.Snippet,
                            insertText: Array.isArray(snippet.body) ? snippet.body.join("\n") : snippet.body,
                            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                            detail: key,
                            documentation: snippet.description,
                            range,
                        });
                    });
                    return { suggestions };
                }
            });
            disposables.current.push(snippetProvider);

            const diagDisposable = conn.onNotification(
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
            theme={settings.appearance.theme}
            value={code}
            options={{
                fontFamily: settings.editor.fontFamily,
                fontWeight: settings.editor.fontWeight,
                fontSize: settings.editor.fontSize,
                lineHeight: settings.editor.lineHeight,
                letterSpacing: settings.editor.letterSpacing,
                cursorBlinking: settings.editor.cursorBlinking,
                cursorSmoothCaretAnimation: settings.editor.cursorSmoothCaretAnimation,
                fontLigatures: settings.editor.fontLigatures,
                wordWrap: settings.editor.wordWrap,
                minimap: { enabled: settings.editor.minimap },
                lineNumbers: settings.editor.lineNumbers,
                tabSize: settings.editor.tabSize,
                insertSpaces: settings.editor.insertSpaces,
                autoClosingBrackets: settings.editor.autoClosingBrackets,
                autoClosingQuotes: settings.editor.autoClosingQuotes,
                formatOnPaste: true,
                smoothScrolling: settings.editor.smoothScrolling,
            }}
            onChange={(value) => handleOnChange(value)}
            onMount={handleMount}
        />
    );
}
