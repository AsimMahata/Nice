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


export const test = () => {
  exec(`${dest}`, (err, stdout, stderr) => {
    if (err) {
      console.error("runCode error:", stderr);
      return;
    }
    console.log(stdout);
  });
};


test()


const compile = (code: string): Promise<boolean> => {
  fs.writeFileSync(source, code);

  return new Promise((resolve) => {
    exec(`g++ "${source}" -o "${dest}"`, (err, _, stderr) => {
      if (err) {
        console.error(stderr);
        return resolve(false);
      }
      resolve(true);
    });
  });
};


export const runCode = async (req: Request, res: Response) => {
  if (!(await compile(req.body.code))) {
    return res.status(400).send("Compilation failed");
  }

  exec(dest, (err, stdout, stderr) => {
    if (err) return res.status(500).send(stderr);
    res.send(stdout);
  });
};

export const compileCode = async (req: Request, res: Response) => {
  const { code } = req.body;
  fs.writeFileSync(source, code);
  exec(`g++ ${source} -o ${dest}`, (err, stdout, stderr) => {
    if (err) {
      console.error("Compile error:", stderr);
      return;
    }
    console.log("Compiled successfully");
  });

  res.status(200).send('Compiling Code');
}
