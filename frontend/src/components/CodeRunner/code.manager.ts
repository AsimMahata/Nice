import { FileInfo } from "../../services/FileSystem/file.options";
import { CodeRunnerParams } from "./code.options";


declare global {
    interface Window {
        runner?: {
            runCode: (codeFile: FileInfo) => Promise<void>
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
        if (!cwd) {
            console.error('please open a Directory first to run code');
        }
        window.runner?.runCode(codeFile)

    }
}

export const codeManager = new CodeManager()
