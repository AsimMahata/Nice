import { exec, spawn } from "child_process";
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
    time: number; // in ms
    timeout: boolean;
    error?: string;
}

/**
 * Compiles a C++ (or C) file using g++ (or gcc) into a temporary binary file
 * located in the .cph/bin/ directory under the source file's directory.
 */
export async function compileCPH(filePath: string): Promise<CompileResult> {
    const dir = path.dirname(filePath);
    const ext = path.extname(filePath);
    const baseName = path.basename(filePath, ext);
    
    // Create .cph/bin directory inside the source file's parent folder
    const cphBinDir = path.join(dir, '.cph', 'bin');
    if (!fs.existsSync(cphBinDir)) {
        fs.mkdirSync(cphBinDir, { recursive: true });
    }
    
    const binaryName = process.platform === 'win32' ? `${baseName}.exe` : baseName;
    const binaryPath = path.join(cphBinDir, binaryName);
    
    let compileCmd = '';
    if (ext === '.cpp' || ext === '.cc' || ext === '.cxx') {
        compileCmd = `g++ "${filePath}" -o "${binaryPath}"`;
    } else if (ext === '.c') {
        compileCmd = `gcc "${filePath}" -o "${binaryPath}"`;
    } else {
        return { success: false, error: `Unsupported file extension: ${ext}` };
    }
    
    return new Promise((resolve) => {
        exec(compileCmd, (error, stdout, stderr) => {
            if (error) {
                resolve({
                    success: false,
                    error: stderr || error.message
                });
            } else {
                resolve({
                    success: true,
                    binaryPath: binaryPath
                });
            }
        });
    });
}

/**
 * Spawns the compiled binary, passes input string to stdin,
 * captures stdout/stderr, and terminates the process if it times out.
 */
export async function runTestcaseCPH(
    binaryPath: string, 
    input: string, 
    timeLimit: number = 2000
): Promise<RunResult> {
    return new Promise((resolve) => {
        const start = Date.now();
        const child = spawn(binaryPath);
        
        let stdout = '';
        let stderr = '';
        let timeout = false;
        
        // Timeout handler
        const timer = setTimeout(() => {
            timeout = true;
            child.kill();
        }, timeLimit);
        
        // Feed stdin
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
            resolve({
                stdout,
                stderr,
                exitCode: code,
                time: Date.now() - start,
                timeout
            });
        });
    });
}