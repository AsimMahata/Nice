import Editor from "@monaco-editor/react";
import React, { useRef } from "react";

import {
    WebSocketMessageReader,
    WebSocketMessageWriter,
    toSocket,
} from "vscode-ws-jsonrpc";

import { createMessageConnection } from "vscode-jsonrpc/browser";
import { useEditorContext } from "../../contexts/Editor/EditorProvider";

// DEBUG TOGGLE
const DEBUG = true;
const log = (...args: any[]) => {
    if (DEBUG) console.log(...args);
};
type props = {
    code: string,
    setCode: React.Dispatch<React.SetStateAction<string>>,
}
export default function CodeEditor({ code, setCode }: props) {
    //constext 
    const { codeLang, setIsDirty } = useEditorContext()
    // LSP document version (must monotonically increase)
    const version = useRef(1);

    // True after didOpen
    const opened = useRef(false);

    // True after initialize + didOpen (used for completion)
    const initialized = useRef(false);
    const handleOnChange = (value: string | undefined) => {
        if (value === undefined) {
            console.log('nothing to save')
            return;
        }
        setIsDirty(true)
        setCode(value)
    }
    const handleMount = (editor: any, monaco: any) => {
        log("codeeditor/handleMount/init", { codeLang });

        // Connect to backend LSP bridge
        const ws = new WebSocket(`ws://localhost:3001?lang=${codeLang}`);
        ws.binaryType = "arraybuffer";

        ws.onopen = () => {
            log("codeeditor/ws/onopen", "connected");

            // Wrap WebSocket → JSON-RPC
            const socket = toSocket(ws);
            const reader = new WebSocketMessageReader(socket);
            const writer = new WebSocketMessageWriter(socket);

            log("codeeditor/lsp/socket", "reader/writer ready");

            // Create LSP connection
            const conn = createMessageConnection(reader, writer);
            conn.listen();

            log("codeeditor/lsp/connection", "listening");

            // Decide extension (clangd relies on this)
            const ext =
                codeLang === "python" ? "py" : codeLang === "c" ? "c" : "cpp";

            // SINGLE SOURCE OF TRUTH FOR URI (clangd requires file://)
            const fileUri = `file:///workspace/main.${ext}`;

            log("codeeditor/lsp/document", fileUri);

            // INITIALIZE
            conn.sendRequest("initialize", {
                processId: null,
                rootUri: "file:///workspace",
                capabilities: {},
            }).then(() => {
                log("codeeditor/lsp/initialize", "ok");

                // INITIALIZED
                conn.sendNotification("initialized");
                log("codeeditor/lsp/initialized", "sent");

                // DID OPEN
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

                log("codeeditor/lsp/ready", {
                    uri: fileUri,
                    version: version.current,
                });
            });

            // DOCUMENT CHANGES
            editor.onDidChangeModelContent(() => {
                if (!opened.current) return;

                version.current++;
                const text = editor.getValue();

                log("codeeditor/editor/didChange", {
                    version: version.current,
                });

                conn.sendNotification("textDocument/didChange", {
                    textDocument: {
                        uri: fileUri,
                        version: version.current,
                    },
                    contentChanges: [
                        {
                            range: null, // full document replace
                            text,
                        },
                    ],
                });
            });

            // COMPLETION PROVIDER
            log(
                "codeeditor/completion/provider/register",
                "registering"
            );

            monaco.languages.registerCompletionItemProvider(codeLang, {
                triggerCharacters: [".", ">", ":", "("],

                provideCompletionItems: async (
                    model: any,
                    position: any
                ) => {
                    log(
                        "codeeditor/completion/provide/start",
                        position
                    );

                    if (!initialized.current) {
                        log(
                            "codeeditor/completion/blocked",
                            "lsp not ready"
                        );
                        return { suggestions: [] };
                    }

                    const lspPosition = {
                        line: position.lineNumber - 1,
                        character: position.column - 1,
                    };

                    log(
                        "codeeditor/completion/request/send",
                        {
                            uri: fileUri,
                            lspPosition,
                        }
                    );

                    const result: any = await conn.sendRequest(
                        "textDocument/completion",
                        {
                            textDocument: { uri: fileUri },
                            position: lspPosition,
                            context: { triggerKind: 1 },
                        }
                    );

                    log(
                        "codeeditor/completion/response/raw",
                        result
                    );

                    const items = Array.isArray(result)
                        ? result
                        : result?.items ?? [];

                    log(
                        "codeeditor/completion/items/count",
                        items.length
                    );

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

                    log(
                        "codeeditor/completion/monaco/suggestions",
                        suggestions
                    );

                    return { suggestions };
                },
            });

            // DIAGNOSTICS
            conn.onNotification(
                "textDocument/publishDiagnostics",
                (p: any) => {
                    log(
                        "codeeditor/lsp/publishDiagnostics/raw",
                        p
                    );

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

                    log(
                        "codeeditor/monaco/setMarkers",
                        markers
                    );

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
            value={code || ""}
            onChange={(value) => handleOnChange(value)}
            onMount={handleMount}
        />
    );
}
