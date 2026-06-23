import { useEffect } from "react";
import { useCommandContext } from "../../contexts/Commands/CommandProvider";
import { getCommandFromKeyBinding, getKeysFromEvent } from "./keybindingRegistry";
import { getKeyBindingFromKeys } from "./keybindings";

export function useKeyboardEventListener() {
    const { commandManager } = useCommandContext();

    useEffect(() => {
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "Control" || e.key === "Shift" || e.key === "Alt") {
                return;
            }
            console.log({
                key: e.key,
                ctrl: e.ctrlKey,
                shift: e.shiftKey,
                alt: e.altKey,
            });
            const keys: string[] = getKeysFromEvent(e);
            const keybinding: string = getKeyBindingFromKeys(keys);
            console.log('Gotten Key binding is ', keybinding);
            const command: string | null = getCommandFromKeyBinding(keybinding);
            console.log('Gotten command is ', command);
            if (!command) {
                return;
            }
            e.preventDefault()
            commandManager.execute(command);
        }

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, []);
}
