import { terminalManager } from "../Terminal/terminal.manager";
import { CodeRunnerParams } from "./code.options";


declare global {
    interface Window {
        runner?: {
            runCode: ({ codeFile, codeLang, cwd }: CodeRunnerParams) => Promise<void>
        };
    }
}
class CodeManager {
    time = Date.now()
    constructor() {
        console.log("CodeManager constructor called");
    }
    /*
     * code file info --> runCode --> ask for run command --> runCommand
     * after getting run command we need to open terminal -> cd to Directory 
     * make a folder with randomUUID -> put the object file run it inside temrinal
     *
     * */
    async runCode({ codeFile, codeLang, cwd }: CodeRunnerParams) {
        console.log('----------called run code for ', codeFile, codeLang, cwd);
        // its already filtered for now but i think i should filter inside this file
        if (!window.runner) {
            console.error('window runner is not defined ')
        }
        window.runner?.runCode({ codeFile, codeLang, cwd })
        return;
        // now its working in backend so fronend logic is commented for now i mean returned early
        if (!cwd) {
            console.error('first open a working Directory')
            return
        }
        if (codeLang === null || codeLang === "PlainText") {
            console.error('this type of files is not supported ')
            return
        }
        if (!codeFile) {
            console.error('please select an active file first')
            return
        }
        const runCommand = await this.getRunCommand({ codeFile, codeLang, cwd })
        console.log('got run command -----------------', runCommand)
        await this.sendCommandToTerminal(runCommand)

    }
    private async getRunCommand({ codeFile, codeLang, cwd }: CodeRunnerParams) {
        console.log('getting run command ------------')
        if (codeLang !== 'cpp') {
            throw new Error('for now only support cpp lang try later')
        }
        const cdToPath = `cd ${cwd}`
        const objectFileFolder = `${cwd}random_path/${codeLang}`
        const mkdirRandom = `mkdir -p ${cwd}random_path/${codeLang}`
        const objectFile = `${objectFileFolder}/out`
        const compilecommand = `g++ ${codeFile.path} -o ${objectFile}`
        const runCommand = `${objectFile}`
        const concatinated = `${cdToPath} && ${mkdirRandom} && ${compilecommand} && ${runCommand}`
        return concatinated;
    }
    private async sendCommandToTerminal(command: string) {
        await terminalManager.run(command)
        console.log('command sent to terminal---------', command)
    }
}

export const codeManager = new CodeManager()
