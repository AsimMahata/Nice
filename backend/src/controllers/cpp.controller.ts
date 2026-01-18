import { Request, Response } from "express";
import { exec } from "node:child_process";
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

type compilationStatus = {
  success: boolean,
  error: string
}

type runStatus = {
  success: boolean,
  output: string
  runtimeError: string
  error: string
}

const compile = (code: string): Promise<compilationStatus> => {
  fs.writeFileSync(source, code);
  const status: compilationStatus = {
    success: false,
    error: ""
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
  const compileStatus = await compile(req.body.code)
  if (!compileStatus.success) {
    return res.status(400).send(compileStatus.error);
  }
  //running code - run time error possible 
  const runningStatus: runStatus = {
    success: false,
    output: "",
    runtimeError: "",
    error: ""
  }
  exec(dest, (err, stdout, stderr) => {
    runningStatus.runtimeError = stderr
    runningStatus.error = String(err || "")
    runningStatus.output = stdout
    if (err) {
      return res.status(500).send(runningStatus);
    }
    runningStatus.success = true;
    res.send(runningStatus);
  });
};

export const compileCode = async (req: Request, res: Response) => {
  if (!(await compile(req.body.code))) {
    return res.status(400).send("Compilation failed");
  }
  return res.status(200).send("compiled Successfully")
}
