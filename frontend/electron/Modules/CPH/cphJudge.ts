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
    
    const { execSync } = require("child_process");
    let env = { ...process.env };
    try {
        const compilerName = (ext === '.c') ? 'gcc' : 'g++';
        const resolvedPaths = execSync(`where ${compilerName}`).toString().split(/\r?\n/);
        const resolvedPath = resolvedPaths[0]?.trim();
        if (resolvedPath && fs.existsSync(resolvedPath)) {
            const compilerDir = path.dirname(resolvedPath);
            // Prepend compiler directory to PATH to avoid toolchain linker conflicts
            env.PATH = `${compilerDir}${path.delimiter}${env.PATH || ''}`;
            console.log(`[CPH Compile Debug] Prepended compiler dir to PATH: ${compilerDir}`);
        }
    } catch (err: any) {
        console.error(`[CPH Compile Debug] Error resolving compiler path: ${err.message}`);
    }

    console.log(`[CPH Compile] Running command: ${compileCmd}`);
    
    return new Promise((resolve) => {
        exec(compileCmd, { env }, (error, stdout, stderr) => {
            console.log(`[CPH Compile] stdout:\n${stdout}`);
            console.log(`[CPH Compile] stderr:\n${stderr}`);
            if (error) {
                console.error(`[CPH Compile] Error: ${error.message}`);
                const completeError = [
                    stderr.trim(),
                    stdout.trim(),
                    error.message.trim()
                ].filter(Boolean).join('\n\n');
                
                resolve({
                    success: false,
                    error: completeError || "Compilation failed with unknown error"
                });
            } else {
                console.log(`[CPH Compile] Compilation successful. Binary: ${binaryPath}`);
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
    console.log(`[CPH Run] Executing binary: ${binaryPath} with timeLimit: ${timeLimit}ms`);
    console.log(`[CPH Run] Input:\n${input}`);
    return new Promise((resolve) => {
        const start = Date.now();
        const child = spawn(binaryPath);
        
        let stdout = '';
        let stderr = '';
        let timeout = false;
        
        // Timeout handler
        const timer = setTimeout(() => {
            timeout = true;
            console.warn(`[CPH Run] Process timed out after ${timeLimit}ms. Terminating process...`);
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
            console.log(`[CPH Run] Stdout: ${stdout}`);
            console.log(`[CPH Run] Stderr: ${stderr}`);
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