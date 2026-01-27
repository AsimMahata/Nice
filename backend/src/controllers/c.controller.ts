import { Request, Response } from "express";
import { exec, spawn } from "node:child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const codeDir = path.join(__dirname, "../../temp/c/code");
const resDir = path.join(__dirname, "../../temp/c/res");
const source = path.join(codeDir, "code.c");
const dest = path.join(resDir, "code");

fs.mkdirSync(codeDir, { recursive: true });
fs.mkdirSync(resDir, { recursive: true });

type Status = {
  success: boolean;
  output: string;
  error: string;
  runtimeError: string;
  compilationError: string;
};

const compile = (code: string): Promise<Status> => {
  fs.writeFileSync(source, code);
  const status: Status = { success: false, output: "", error: "", runtimeError: "", compilationError: "" };

  return new Promise((resolve) => {
    exec(`gcc "${source}" -o "${dest}"`, (err, _, stderr) => {
      if (err) {
        status.error = stderr;
        status.compilationError = stderr;
        return resolve(status);
      }
      status.success = true;
      resolve(status);
    });
  });
};

export const compileCode = async (req: Request, res: Response) => {
  const codeStatus = await compile(req.body.code);
  if (!codeStatus.success) return res.status(400).send(codeStatus.compilationError);
  return res.status(200).send("Compiled Successfully");
};

export const runCode = async (req: Request, res: Response) => {
  const codeStatus = await compile(req.body.code);
  if (!codeStatus.success) return res.status(400).send(codeStatus);

  const child = spawn(dest, [], { stdio: "pipe" });
  
  child.stdout.on("data", (data) => codeStatus.output += data.toString());
  child.stderr.on("data", (data) => codeStatus.runtimeError += data.toString());

  if (req.body.input) child.stdin.write(req.body.input + "\n");
  child.stdin.end();

  const timer = setTimeout(() => {
    child.kill("SIGKILL");
    codeStatus.error = "Time Limit Exceeded (4s)";
    return res.status(500).send(codeStatus);
  }, 4000);

  child.on("close", (code) => {
    clearTimeout(timer);
    if (code !== 0 && !codeStatus.error) {
      codeStatus.error = "Runtime Error";
      return res.status(500).send(codeStatus);
    }
    codeStatus.success = true;
    res.send(codeStatus);
  });
};