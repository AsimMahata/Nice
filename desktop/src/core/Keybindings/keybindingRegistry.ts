

export function getKeysFromEvent(e: KeyboardEvent) {
    const keys: string[] = [];
    if (e.ctrlKey || e.metaKey) {
        keys.push("Control");
    }
    if (e.shiftKey) {
        keys.push("Shift");
    }
    if (e.altKey) {
        keys.push("Alt");
    }
    const key = e.key.toLowerCase();
    if (!["control", "shift", "alt", "meta"].includes(key)) {
        keys.push(key);
    }
    return keys;
}

export const keybindingRegistry: Record<string, string> = {
    // File
    "Control+n": "file.new",
    "Control+o": "file.open",
    "Control+s": "file.save",
    "Control+Shift+s": "file.saveAs",
    "Control+w": "file.close",
    "Control+Shift+w": "file.closeAll",

    // Editor
    "Control+z": "editor.undo",
    "Control+y": "editor.redo",
    "Control+x": "editor.cut",
    "Control+c": "editor.copy",
    "Control+v": "editor.paste",
    "Control+a": "editor.selectAll",
    "Control+f": "editor.find",
    "Control+h": "editor.replace",

    // Tabs
    "Control+Tab": "tab.next",
    "Control+Shift+Tab": "tab.previous",

    // Command Palette
    "Control+k": "commandPalette.open",
    "Control+p": "commandPalette.open",
    "Control+Shift+p": "commandPalette.openCommandMode",

    // Explorer
    "Control+b": "explorer.toggle",

    // Terminal
    "Control+`": "terminal.toggle",

    // Search
    "Control+Shift+f": "search.global",

    // View
    "F11": "view.fullscreen",

    // Misc
    "Escape": "ui.close",
};

export function getCommandFromKeyBinding(keybinding: string): string | null {
    return keybindingRegistry[keybinding] ?? null;
}
