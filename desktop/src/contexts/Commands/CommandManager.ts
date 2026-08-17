export interface Command {
    id: string;
    execute: () => unknown | Promise<unknown>;
}

export class CommandManager {
    private commands = new Map<string, Command>();

    register(command: Command) {
        this.commands.set(command.id, command);
    }

    unregister(id: string) {
        this.commands.delete(id);
    }

    async execute(id: string) {
        const command = this.commands.get(id);

        if (!command) {
            console.warn(`Command '${id}' not found`);
            return false;
        }

        try {
            await command.execute();
            return true;
        }
        catch (error) {
            console.error(error);
            return false;
        }
    }

    getCommands() {
        return [...this.commands.values()];
    }
}
