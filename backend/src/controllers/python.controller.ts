import { Request, Response } from "express";
import { exec, spawn } from "node:child_process";
import fs from "fs"
import { fileURLToPath } from "url";
import path from "path"
import { write } from "node:fs";




const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const source = path.join(`${__dirname}/../../temp/python/code/`, "code.py");
console.log(__dirname)
const codeDir = path.join(__dirname, "../../temp/python/code");
const resDir = path.join(__dirname, "../../temp/python/res");
fs.mkdirSync(codeDir, { recursive: true });
fs.mkdirSync(resDir, { recursive: true });

type status = {
    success: boolean,
    output: string
    error: string
    runtimeError: string
    compilationError: string
}

export const runCode = async (req: Request, res: Response) => {
    // python doesn't really compile code technically it does we can implement it later NOTE:
    const codeStatus: status = {
        success: false,
        output: "",
        error: "",
        runtimeError: "",
        compilationError: ""
    }
    try {
        fs.writeFileSync(source, req.body.code);  // WARN: have to write the file first
    } catch (err) {
    }
    //running code - run time error possible 


    const child = spawn("python", [source], { stdio: "pipe" });
    child.stdout.on("data", (data) => {
        codeStatus.output += data.toString()
    })

    child.stderr.on("data", (data) => {
        codeStatus.runtimeError += data.toString()
    })
    const input = req.body.input
    if (input) {
        child.stdin.write(input + "\n");
    }
    child.stdin.end()
    const timer = setTimeout(() => {
        child.kill("SIGKILL")
        codeStatus.error = "Time Limit Exceeded (4s)"
        return res.status(500).send(codeStatus)
    }, 4000)
    child.on("close", (code) => {
        clearTimeout(timer)
        if (code !== 0 && !codeStatus.error) {
            codeStatus.error = codeStatus.runtimeError
            return res.status(500).send(codeStatus)
        }

        codeStatus.success = true
        res.send(codeStatus)
    })
};
