import { exec, spawn, execSync } from "child_process";
import path from "path";
import fs from "fs";

export interface CompileResult {
    success: boolean;
    error?: string;
    binaryPath?: string;
}

export interface RunResult {
    stdout: string;
    stderr: string;
    exitCode: number | null;
    time: number;
    timeout: boolean;
    error?: string;
}

const compilerPathCache = new Map<string, string>();

function resolveCompilerDir(compilerName: string): string | null {
    if (compilerPathCache.has(compilerName)) {
        return compilerPathCache.get(compilerName) || null;
    }

    try {
        const cmd = process.platform === 'win32' ? `where ${compilerName}` : `which ${compilerName}`;
        const resolvedPaths = execSync(cmd, { timeout: 2000 }).toString().split(/\r?\n/);
        const resolvedPath = resolvedPaths[0]?.trim();
        if (resolvedPath && fs.existsSync(resolvedPath)) {
            const dir = path.dirname(resolvedPath);
            compilerPathCache.set(compilerName, dir);
            return dir;
        }
    } catch {}

    compilerPathCache.set(compilerName, '');
    return null;
}

export async function compileCPH(filePath: string): Promise<CompileResult> {
    const dir = path.dirname(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const baseName = path.basename(filePath, ext);

    if (ext === '.py' || ext === '.js' || ext === '.ts') {
        return {
            success: true,
            binaryPath: filePath,
        };
    }
    
    const cphBinDir = path.join(dir, '.cph', 'bin');
    if (!fs.existsSync(cphBinDir)) {
        fs.mkdirSync(cphBinDir, { recursive: true });
    }
    
    const binaryName = process.platform === 'win32' ? `${baseName}.exe` : baseName;
    const binaryPath = path.join(cphBinDir, binaryName);
    
    let compileCmd = '';
    let compilerName = 'g++';

    if (ext === '.cpp' || ext === '.cc' || ext === '.cxx') {
        compileCmd = `g++ "${filePath}" -o "${binaryPath}"`;
        compilerName = 'g++';
    } else if (ext === '.c') {
        compileCmd = `gcc "${filePath}" -o "${binaryPath}"`;
        compilerName = 'gcc';
    } else if (ext === '.java') {
        compileCmd = `javac -d "${cphBinDir}" "${filePath}"`;
        compilerName = 'javac';
    } else {
        return { success: false, error: `Unsupported file extension: ${ext}` };
    }
    
    let env = { ...process.env };
    const compilerDir = resolveCompilerDir(compilerName);
    if (compilerDir) {
        env.PATH = `${compilerDir}${path.delimiter}${env.PATH || ''}`;
    }

    console.log(`[CPH Compile] Running command: ${compileCmd}`);
    
    return new Promise((resolve) => {
        exec(compileCmd, { env }, (error, stdout, stderr) => {
            if (error) {
                console.error(`[CPH Compile] Error: ${error.message}`);
                const cleanStderr = stderr.trim();
                const cleanStdout = stdout.trim();
                let completeError = cleanStderr || cleanStdout;
                if (!completeError && error) {
                    completeError = error.message.trim();
                }
                
                resolve({
                    success: false,
                    error: completeError || "Compilation failed with unknown error"
                });
            } else {
                console.log(`[CPH Compile] Compilation successful. Output: ${binaryPath}`);
                resolve({
                    success: true,
                    binaryPath: ext === '.java' ? path.join(cphBinDir, `${baseName}.class`) : binaryPath
                });
            }
        });
    });
}

export async function runTestcaseCPH(
    binaryPath: string, 
    input: string, 
    timeLimit: number = 2000
): Promise<RunResult> {
    console.log(`[CPH Run] Executing: ${binaryPath} with timeLimit: ${timeLimit}ms`);
    return new Promise((resolve) => {
        const start = Date.now();
        const ext = path.extname(binaryPath).toLowerCase();
        let cmd = binaryPath;
        let args: string[] = [];

        if (ext === '.py') {
            cmd = process.platform === 'win32' ? 'python' : 'python3';
            args = ['-u', binaryPath];
        } else if (ext === '.js') {
            cmd = 'node';
            args = [binaryPath];
        } else if (ext === '.ts') {
            cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
            args = ['tsx', binaryPath];
        } else if (ext === '.class') {
            const classDir = path.dirname(binaryPath);
            const className = path.basename(binaryPath, '.class');
            cmd = 'java';
            args = ['-cp', classDir, className];
        }

        const child = spawn(cmd, args, { windowsHide: true });
        
        let stdout = '';
        let stderr = '';
        let timeout = false;
        
        const timer = setTimeout(() => {
            timeout = true;
            console.warn(`[CPH Run] Process timed out after ${timeLimit}ms. Terminating process...`);
            child.kill();
        }, timeLimit);
        
        if (child.stdin) {
            child.stdin.write(input);
            child.stdin.end();
        }
        
        child.stdout?.on('data', (data) => {
            stdout += data.toString();
        });
        
        child.stderr?.on('data', (data) => {
            stderr += data.toString();
        });
        
        child.on('error', (err) => {
            clearTimeout(timer);
            console.error(`[CPH Run] Process error: ${err.message}`);
            resolve({
                stdout,
                stderr,
                exitCode: null,
                time: Date.now() - start,
                timeout,
                error: err.message
            });
        });
        
        child.on('exit', (code) => {
            clearTimeout(timer);
            const duration = Date.now() - start;
            console.log(`[CPH Run] Process exited with code ${code} in ${duration}ms`);
            resolve({
                stdout,
                stderr,
                exitCode: code,
                time: duration,
                timeout
            });
        });
    });
}