import { ReactNode, useContext, useEffect, useRef } from "react";
import CommandContext from "./CommandContext";
import { CommandManager } from "./CommandManager";
import { useEditorContext } from "../Editor/EditorProvider";

function todo(command: string) {
    return async () => {
        console.error(`TODO: ${command}`);
        return false;
    };
}

const CommandProvider = ({ children }: { children: ReactNode }) => {
    const commandManagerRef = useRef(new CommandManager());
    const editor = useEditorContext();

    useEffect(() => {
        const commandManager = commandManagerRef.current;

        commandManager.register({
            id: "file.new",
            execute: todo("file.new"),
        });

        commandManager.register({
            id: "file.open",
            execute: todo("file.open"),
        });

        commandManager.register({
            id: "file.save",
            execute: editor.saveActiveFile,
        });

        commandManager.register({
            id: "file.saveAs",
            execute: todo("file.saveAs"),
        });

        commandManager.register({
            id: "file.close",
            execute: todo("file.close"),
        });

        commandManager.register({
            id: "file.closeAll",
            execute: todo("file.closeAll"),
        });

        commandManager.register({
            id: "editor.undo",
            execute: todo("editor.undo"),
        });

        commandManager.register({
            id: "editor.redo",
            execute: todo("editor.redo"),
        });

        commandManager.register({
            id: "editor.cut",
            execute: todo("editor.cut"),
        });

        commandManager.register({
            id: "editor.copy",
            execute: todo("editor.copy"),
        });

        commandManager.register({
            id: "editor.paste",
            execute: todo("editor.paste"),
        });

        commandManager.register({
            id: "editor.selectAll",
            execute: todo("editor.selectAll"),
        });

        commandManager.register({
            id: "editor.find",
            execute: todo("editor.find"),
        });

        commandManager.register({
            id: "editor.replace",
            execute: todo("editor.replace"),
        });

        commandManager.register({
            id: "tab.next",
            execute: todo("tab.next"),
        });

        commandManager.register({
            id: "tab.previous",
            execute: todo("tab.previous"),
        });

        commandManager.register({
            id: "commandPalette.open",
            execute: todo("commandPalette.open"),
        });

        commandManager.register({
            id: "explorer.toggle",
            execute: todo("explorer.toggle"),
        });

        commandManager.register({
            id: "terminal.toggle",
            execute: todo("terminal.toggle"),
        });

        commandManager.register({
            id: "search.global",
            execute: todo("search.global"),
        });

        commandManager.register({
            id: "view.fullscreen",
            execute: todo("view.fullscreen"),
        });

        commandManager.register({
            id: "ui.close",
            execute: todo("ui.close"),
        });
    }, []);

    return (
        <CommandContext.Provider
            value={{
                commandManager: commandManagerRef.current,
            }}
        >
            {children}
        </CommandContext.Provider>
    );
};

export default CommandProvider;

export const useCommandContext = () => {
    const context = useContext(CommandContext);

    if (context === undefined) {
        throw new Error("CommandContext is undefined");
    }

    return context;
};
