export interface ThemeDefinition {
    id: string;
    name: string;
    type: "dark" | "light";
    monacoTheme: string;
}

export const THEME_LIST: ThemeDefinition[] = [
    { id: "nice-dark", name: "Nice Dark (Default)", type: "dark", monacoTheme: "nice-dark" },
    { id: "one-dark-pro", name: "One Dark Pro", type: "dark", monacoTheme: "one-dark-pro" },
    { id: "dracula", name: "Dracula", type: "dark", monacoTheme: "dracula" },
    { id: "tokyo-night", name: "Tokyo Night", type: "dark", monacoTheme: "tokyo-night" },
    { id: "catppuccin", name: "Catppuccin Macchiato", type: "dark", monacoTheme: "catppuccin" },
    { id: "github-light", name: "GitHub Light", type: "light", monacoTheme: "github-light" },
    { id: "one-light", name: "One Light", type: "light", monacoTheme: "one-light" },
];

export function applyAppTheme(themeId: string) {
    const validTheme = THEME_LIST.find((t) => t.id === themeId) ? themeId : "nice-dark";
    document.documentElement.setAttribute("data-theme", validTheme);
}

let registeredMonaco = false;

export function registerMonacoThemes(monaco: any) {
    if (!monaco || registeredMonaco) return;

    // 1. Nice Dark (Default Nice Theme)
    monaco.editor.defineTheme("nice-dark", {
        base: "vs-dark",
        inherit: true,
        rules: [
            { token: "comment", foreground: "64748b", fontStyle: "italic" },
            { token: "keyword", foreground: "818cf8", fontStyle: "bold" },
            { token: "string", foreground: "34d399" },
            { token: "number", foreground: "f59e0b" },
            { token: "type", foreground: "38bdf8" },
            { token: "function", foreground: "c084fc" },
            { token: "variable", foreground: "e2e8f0" },
        ],
        colors: {
            "editor.background": "#0d0e12",
            "editor.foreground": "#e2e8f0",
            "editorCursor.foreground": "#818cf8",
            "editor.lineHighlightBackground": "#14161d",
            "editorLineNumber.foreground": "#475569",
            "editorLineNumber.activeForeground": "#818cf8",
            "editorIndentGuide.background": "#1e293b",
            "editorIndentGuide.activeBackground": "#475569",
            "editor.selectionBackground": "#3b3e7d",
            "editor.selectionHighlightBackground": "#2a2c59",
            "editor.inactiveSelectionBackground": "#212245",
        },
    });

    // 2. One Dark Pro
    monaco.editor.defineTheme("one-dark-pro", {
        base: "vs-dark",
        inherit: true,
        rules: [
            { token: "comment", foreground: "5c6370", fontStyle: "italic" },
            { token: "keyword", foreground: "c678dd", fontStyle: "bold" },
            { token: "string", foreground: "98c379" },
            { token: "number", foreground: "d19a66" },
            { token: "type", foreground: "e5c07b" },
            { token: "function", foreground: "61afef" },
            { token: "variable", foreground: "abb2bf" },
        ],
        colors: {
            "editor.background": "#282c34",
            "editor.foreground": "#abb2bf",
            "editorCursor.foreground": "#528bff",
            "editor.lineHighlightBackground": "#2c313c",
            "editorLineNumber.foreground": "#4b5263",
            "editorLineNumber.activeForeground": "#abb2bf",
            "editor.selectionBackground": "#3e4451",
        },
    });

    // 3. Dracula
    monaco.editor.defineTheme("dracula", {
        base: "vs-dark",
        inherit: true,
        rules: [
            { token: "comment", foreground: "6272a4", fontStyle: "italic" },
            { token: "keyword", foreground: "ff79c6", fontStyle: "bold" },
            { token: "string", foreground: "f1fa8c" },
            { token: "number", foreground: "bd93f9" },
            { token: "type", foreground: "8be9fd" },
            { token: "function", foreground: "50fa7b" },
            { token: "variable", foreground: "f8f8f2" },
        ],
        colors: {
            "editor.background": "#282a36",
            "editor.foreground": "#f8f8f2",
            "editorCursor.foreground": "#f8f8f0",
            "editor.lineHighlightBackground": "#44475a",
            "editorLineNumber.foreground": "#6272a4",
            "editorLineNumber.activeForeground": "#f8f8f2",
            "editor.selectionBackground": "#44475a",
        },
    });

    // 4. Tokyo Night
    monaco.editor.defineTheme("tokyo-night", {
        base: "vs-dark",
        inherit: true,
        rules: [
            { token: "comment", foreground: "565f89", fontStyle: "italic" },
            { token: "keyword", foreground: "bb9af7", fontStyle: "bold" },
            { token: "string", foreground: "9ece6a" },
            { token: "number", foreground: "ff9e64" },
            { token: "type", foreground: "2ac3de" },
            { token: "function", foreground: "7aa2f7" },
            { token: "variable", foreground: "c0caf5" },
        ],
        colors: {
            "editor.background": "#1a1b26",
            "editor.foreground": "#c0caf5",
            "editorCursor.foreground": "#c0caf5",
            "editor.lineHighlightBackground": "#24283b",
            "editorLineNumber.foreground": "#3b4261",
            "editorLineNumber.activeForeground": "#7aa2f7",
            "editor.selectionBackground": "#363b54",
        },
    });

    // 5. Catppuccin Macchiato
    monaco.editor.defineTheme("catppuccin", {
        base: "vs-dark",
        inherit: true,
        rules: [
            { token: "comment", foreground: "8087a2", fontStyle: "italic" },
            { token: "keyword", foreground: "c6a0f6", fontStyle: "bold" },
            { token: "string", foreground: "a6da95" },
            { token: "number", foreground: "f5a97f" },
            { token: "type", foreground: "8aadf4" },
            { token: "function", foreground: "8bd5ca" },
            { token: "variable", foreground: "cad3f5" },
        ],
        colors: {
            "editor.background": "#24273a",
            "editor.foreground": "#cad3f5",
            "editorCursor.foreground": "#f5bde6",
            "editor.lineHighlightBackground": "#363a4f",
            "editorLineNumber.foreground": "#5b6078",
            "editorLineNumber.activeForeground": "#c6a0f6",
            "editor.selectionBackground": "#494d64",
        },
    });

    // 6. GitHub Light
    monaco.editor.defineTheme("github-light", {
        base: "vs",
        inherit: true,
        rules: [
            { token: "comment", foreground: "6e7781", fontStyle: "italic" },
            { token: "keyword", foreground: "cf222e", fontStyle: "bold" },
            { token: "string", foreground: "0a3069" },
            { token: "number", foreground: "0550ae" },
            { token: "type", foreground: "953800" },
            { token: "function", foreground: "8250df" },
            { token: "variable", foreground: "1f2328" },
        ],
        colors: {
            "editor.background": "#ffffff",
            "editor.foreground": "#1f2328",
            "editorCursor.foreground": "#0969da",
            "editor.lineHighlightBackground": "#f6f8fa",
            "editorLineNumber.foreground": "#8c959f",
            "editorLineNumber.activeForeground": "#1f2328",
            "editor.selectionBackground": "#b3d7ff",
        },
    });

    // 7. One Light
    monaco.editor.defineTheme("one-light", {
        base: "vs",
        inherit: true,
        rules: [
            { token: "comment", foreground: "a0a1a7", fontStyle: "italic" },
            { token: "keyword", foreground: "a626a4", fontStyle: "bold" },
            { token: "string", foreground: "50a14f" },
            { token: "number", foreground: "986801" },
            { token: "type", foreground: "c18401" },
            { token: "function", foreground: "4078f2" },
            { token: "variable", foreground: "383a42" },
        ],
        colors: {
            "editor.background": "#ffffff",
            "editor.foreground": "#383a42",
            "editorCursor.foreground": "#528bff",
            "editor.lineHighlightBackground": "#f2f2f3",
            "editorLineNumber.foreground": "#9d9d9f",
            "editorLineNumber.activeForeground": "#383a42",
            "editor.selectionBackground": "#e5e5e6",
        },
    });

    registeredMonaco = true;
}
