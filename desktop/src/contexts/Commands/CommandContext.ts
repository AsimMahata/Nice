import { createContext } from "react";
import { CommandManager } from "./CommandManager";



interface CommandContextType {
    commandManager: CommandManager;
}

const CommandContext = createContext<CommandContextType | undefined>(undefined);

export default CommandContext;
