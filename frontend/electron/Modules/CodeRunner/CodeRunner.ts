import { join } from "path"
import { getParentDirectory } from "../FileSystem/FileActions"
import { exec, spawn } from "child_process"

type status = {
    success: boolean,
    output: string
    error: string
    runtimeError: string
    compilationError: string
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



async function runCppCode(filePath: string) {
    // compiling - compile time errors possible here 
    const codeStatus = await compileCppCode(filePath)
    if (!codeStatus.success) {
        return codeStatus
    }

    const codeFolder = getParentDirectory(filePath);
    const objectCode = codeFolder + '/output';
    //running code - run time error possible 
    const child = spawn(objectCode, [], { stdio: "pipe" })
    child.stdout.on("data", (data) => {
        codeStatus.output += data.toString()
    })

    child.stderr.on("data", (data) => {
        codeStatus.runtimeError += data.toString()
    })
    const input = ""
    if (input) {
        child.stdin.write(input + "\n");
    }
    child.stdin.end()
    const timer = setTimeout(() => {
        child.kill("SIGKILL")
        codeStatus.error = "Time Limit Exceeded (4s)"
        return codeStatus
    }, 4000)
    child.on("close", (code) => {
        clearTimeout(timer)
        if (code !== 0 && !codeStatus.error) {
            codeStatus.error = "Runtime Error"
            return codeStatus
        }
        codeStatus.success = true
        return codeStatus
    })
}
export async function runCode(lang: string, filePath: string) {
    if (!lang || !filePath) {
        throw new Error('something is wrong while running code in backend missing lang or filePath')
    }
    if (lang === "cpp") return await runCppCode(filePath)
    console.log(lang, filePath)
}
