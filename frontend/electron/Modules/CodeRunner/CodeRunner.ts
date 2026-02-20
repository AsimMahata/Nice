import { join } from "path"
import { FileInfo, getParentDirectory } from "../FileSystem/FileActions"
import { exec, spawn } from "child_process"
import { ptyManager } from "../Terminal/terminal"
import { existsSync, mkdirSync } from "fs"
type status = {
    success: boolean,
    output: string
    error: string
    runtimeError: string
    compilationError: string
}

export interface CodeRunnerParams {
    codeFile: FileInfo,
    codeLang: string | null,
    cwd: string | null
}

export interface RunCommand {
    cdTopath: string | null,
    compileCommand: string | null,
    runCommand: string | null
}
// i think we should make a class of this 

export async function runCode({ codeFile, codeLang, cwd }: CodeRunnerParams) {

    console.log('----------called run code for ', codeFile, codeLang, cwd);
    // its already filtered for now but i think i should filter inside this file
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
    const runCommand: RunCommand = await getRunCommand({ codeFile, codeLang, cwd })
    console.log('got run command -----------------', runCommand)
    await sendCommandToTerminal(runCommand)

}
async function createObjectCodeFolder(objectFileFolder: string | null) {
    if (!objectFileFolder) {
        throw new Error('incomplete have to create ObjectCodeFolder')
    }
    if (!existsSync(objectFileFolder)) {
        mkdirSync(objectFileFolder, { recursive: true });
    }

}
async function getRunCommand({ codeFile, codeLang, cwd }: CodeRunnerParams) {
    console.log('getting run command ------------')
    if (codeLang !== 'cpp') {
        throw new Error('for now only support cpp lang try later')
    }
    if (!cwd) {
        throw new Error('cwd not defined')
    }
    // main commands
    const cdToPath = `cd ${cwd}`
    const random_path = ".nice"
    const objectFileFolder = join(cwd, random_path, codeLang)
    await createObjectCodeFolder(objectFileFolder)
    const obejctFileName = "out"
    const objectFile = join(objectFileFolder, obejctFileName)
    const compileCommand = `g++ ${codeFile.path} -o ${objectFile}`
    const runCommand = `${objectFile}`
    const concatinated: RunCommand = {
        cdTopath: cdToPath,
        compileCommand: compileCommand,
        runCommand: runCommand,
    }
    return concatinated;
}
async function sendCommandToTerminal(command: RunCommand) {
    await ptyManager.run(command)
    console.log('command sent to terminal---------', command)
}

const compileCppCode = (filePath: string): Promise<status> => {
    const status: status = {
        success: false,
        output: "",
        error: "",
        runtimeError: "",
        compilationError: ""
    }
    return new Promise((resolve) => {
        const codeFolder = getParentDirectory(filePath);
        const objectCode = codeFolder + '/output';
        console.log('ok this is objectCode that is getting gen', objectCode)
        exec(`g++ "${filePath}" -o "${objectCode}"`, (err, _, stderr) => {
            if (err) {
                console.error(stderr);
                status.error = stderr
                status.compilationError = stderr
                return resolve(status);
            }
            status.success = true;
            resolve(status);
        });
    });
};



