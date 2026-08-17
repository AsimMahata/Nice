import { extractMetadata } from "./helper"
import { FileInfo } from "../FileSystem/FileActions"
import { ptyManager } from "../Terminal/terminal"
import { CodeRunnerParams } from "./codeRunner.options"
import { getStepsToRun } from "./LanguageRegistry"
import { ShellType } from "../../types/terminal.types"

export function attachCommands(
    commands: string[],
    shellType: ShellType,
): string {

    switch (shellType) {

        case "pwsh":
        case "cmd":
        case "bash":
            return commands.join(" && ");

        case "powershell":
            return commands
                .map((command, index) => {
                    if (index === 0) {
                        return command;
                    }

                    return `if ($?) { ${command} }`;
                })
                .join("; ");

        default:
            throw new Error(
                `Unsupported shell: ${shellType}`
            );
    }
}

//TODO: i think we should make a class of this 

// runcode 

async function sendCommandToTerminal(command: string) {
    await ptyManager.run(command)
    console.log('command sent to terminal---------', command)
}

export async function runCommand(command: string) {
    await sendCommandToTerminal(command);
}

export function commandBuilder(steps: string[], metadata: CodeRunnerParams): string[] {
    return steps.map((step) => {
        return step
            .replace(
                "$dir",
                metadata.directory,
            )
            .replace(
                "$fileNameWithoutExt",
                metadata.fileNameWithoutExt,
            )
            .replace(
                "$fileName",
                metadata.fileName,
            );
    });
}
export async function runCode(codeFile: FileInfo) {
    if (!codeFile) {
        console.error('please select an active file first')
        throw new Error('please select an active file first')
    }

    try {
        const metadata: CodeRunnerParams = await extractMetadata(codeFile);
        console.log('----------called run code for ', metadata, codeFile);
        const steps = getStepsToRun(metadata)
        const commands = commandBuilder(steps, metadata)
        const command = attachCommands(commands, "powershell")
        await runCommand(command);
        console.log('steps', steps)
        console.log('final command ----------', command)
    } catch (err) {
        throw err;
    }
}

