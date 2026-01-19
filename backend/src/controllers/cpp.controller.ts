import { Request, Response } from "express";
import { exec, spawn } from "node:child_process";
import fs from "fs"
import { fileURLToPath } from "url";
import path from "path"




const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const source = path.join(`${__dirname}/../../temp/cpp/code/`, "code.cpp");
const dest = path.join(`${__dirname}/../../temp/cpp/res/`, "code");
console.log(__dirname)
const codeDir = path.join(__dirname, "../../temp/cpp/code");
const resDir = path.join(__dirname, "../../temp/cpp/res");
fs.mkdirSync(codeDir, { recursive: true });
fs.mkdirSync(resDir, { recursive: true });

type status = {
  success: boolean,
  output: string
  error: string
  runtimeError: string
  compilationError: string
}

const compile = (code: string): Promise<status> => {
  fs.writeFileSync(source, code);
  const status: status = {
    success: false,
    output: "",
    error: "",
    runtimeError: "",
    compilationError: ""
  }
  return new Promise((resolve) => {
    exec(`g++ "${source}" -o "${dest}"`, (err, _, stderr) => {
      if (err) {
        console.error(stderr);
        status.error = stderr
        return resolve(status);
      }
      status.success = true;
      resolve(status);
    });
  });
};

export const runCode = async (req: Request, res: Response) => {
  // compiling - compile time errors possible here 
  const codeStatus = await compile(req.body.code)
  if (!codeStatus.success) {
    return res.status(400).send(codeStatus);
  }
  //running code - run time error possible 

  const child = spawn(dest, [], { stdio: "pipe" })
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
      codeStatus.error = "Runtime Error"
      return res.status(500).send(codeStatus)
    }

    codeStatus.success = true
    res.send(codeStatus)
  })
};

export const compileCode = async (req: Request, res: Response) => {
  if (!(await compile(req.body.code))) {
    return res.status(400).send("Compilation failed");
  }
  return res.status(200).send("compiled Successfully")
}
