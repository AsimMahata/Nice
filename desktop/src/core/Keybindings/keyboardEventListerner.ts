import { useEffect } from "react";
import { useCommandContext } from "../../contexts/Commands/CommandProvider";
import { getCommandFromKeyBinding, getKeysFromEvent } from "./keybindingRegistry";
import { getKeyBindingFromKeys } from "./keybindings";
import { commandPaletteManager } from "../../components/Body/CommandPalette/CommandPaletteManager";

export function useKeyboardEventListener() {
    const { commandManager } = useCommandContext();

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            const keyLower = e.key ? e.key.toLowerCase() : "";

            // Intercept Ctrl+Shift+P or Cmd+Shift+P for Command Mode (>)
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && keyLower === "p") {
                e.preventDefault();
                e.stopPropagation();
                commandPaletteManager.toggleCommandMode();
                return;
            }

            // Quick intercept for Ctrl+P / Cmd+P or Ctrl+K / Cmd+K
            if ((e.ctrlKey || e.metaKey) && (keyLower === "k" || keyLower === "p")) {
                e.preventDefault();
                e.stopPropagation();
                commandPaletteManager.toggleCommandPalette();
                return;
            }

            if (e.key === "Control" || e.key === "Shift" || e.key === "Alt" || e.key === "Meta") {
                return;
            }

            // Do not intercept native text editing shortcuts when an input or textarea field is focused
            const activeEl = document.activeElement;
            const isInputFocused = activeEl && (
                activeEl.tagName === "INPUT" ||
                activeEl.tagName === "TEXTAREA" ||
                (activeEl as HTMLElement).isContentEditable
            );

            if (isInputFocused && (e.ctrlKey || e.metaKey)) {
                if (["a", "c", "v", "x", "z", "y"].includes(keyLower)) {
                    return;
                }
            }

            const keys: string[] = getKeysFromEvent(e);
            const keybinding: string = getKeyBindingFromKeys(keys);
            const command: string | null = getCommandFromKeyBinding(keybinding);
            if (!command) {
                return;
            }
            e.preventDefault();
            commandManager.execute(command);
        }

        window.addEventListener("keydown", handleKeyDown, true);

        return () => {
            window.removeEventListener("keydown", handleKeyDown, true);
        };
    }, [commandManager]);
}
