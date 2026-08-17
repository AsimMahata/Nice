import { exec, spawn } from 'node:child_process';
import { ISandboxExecutor, SandboxRequest, SandboxResult } from './ISandboxExecutor.js';

export class DockerSandbox implements ISandboxExecutor {
    readonly name = 'Docker';

    private readonly IMAGE = 'node:20-bullseye';
    private readonly OUTER_TIMEOUT_MS: number;

    constructor() {
        this.OUTER_TIMEOUT_MS = 4_000;
    }

    async isAvailable(): Promise<boolean> {
        return new Promise((resolve) => {
            exec('docker info', { timeout: 5000 }, (err) => {
                resolve(!err);
            });
        });
    }

    async execute(req: SandboxRequest): Promise<SandboxResult> {
        const start = Date.now();

        const codeB64 = Buffer.from(req.code).toString('base64');
        const inputB64 = Buffer.from(req.input).toString('base64');
        const timeLimitSec = Math.ceil(req.timeLimitMs / 1000);
        const memoryMb = req.memoryLimitMb;

        const script = this.buildScript(req.language, timeLimitSec);

        const dockerArgs = [
            'run', '--rm',
            '--network', 'none',
            `--memory=${memoryMb}m`, `--memory-swap=${memoryMb}m`,
            '--cpus', '1',
            '--pids-limit', '64',
            '--read-only',
            '--tmpfs', '/sandbox:rw,exec,nosuid,size=64m',
            '--tmpfs', '/tmp:rw,noexec,nosuid,size=32m',
            '--security-opt', 'no-new-privileges',
            '--cap-drop', 'ALL',
            '-e', `CODE_B64=${codeB64}`,
            '-e', `INPUT_B64=${inputB64}`,
            '-e', `LANG_ID=${req.language}`,
            this.IMAGE,
            '/bin/bash', '-c', script,
        ];

        return new Promise((resolve) => {
            let stdout = '';
            let stderr = '';
            let killed = false;

            const child = spawn('docker', dockerArgs, { stdio: 'pipe' });

            const outerTimer = setTimeout(() => {
                killed = true;
                child.kill('SIGKILL');
            }, this.OUTER_TIMEOUT_MS);

            child.stdout?.on('data', (d) => (stdout += d.toString()));
            child.stderr?.on('data', (d) => (stderr += d.toString()));

            child.on('error', (err) => {
                clearTimeout(outerTimer);
                resolve({
                    compilationSuccess: false,
                    compilationOutput: '',
                    stdout: '',
                    stderr: '',
                    exitCode: null,
                    executionTimeMs: Date.now() - start,
                    memoryUsageKb: null,
                    timedOut: false,
                    memoryExceeded: false,
                    sandboxError: true,
                    sandboxErrorMessage: `Docker spawn error: ${err.message}`,
                });
            });

            child.on('close', (code) => {
                clearTimeout(outerTimer);
                const elapsed = Date.now() - start;

                if (killed) {
                    resolve({
                        compilationSuccess: true,
                        compilationOutput: '',
                        stdout,
                        stderr,
                        exitCode: code,
                        executionTimeMs: elapsed,
                        memoryUsageKb: null,
                        timedOut: true,
                        memoryExceeded: false,
                        sandboxError: false,
                    });
                    return;
                }

                try {
                    const result = JSON.parse(stdout.trim());
                    resolve({
                        compilationSuccess: result.compilationSuccess ?? true,
                        compilationOutput: result.compilationOutput ?? '',
                        stdout: result.stdout ?? '',
                        stderr: result.stderr ?? '',
                        exitCode: result.exitCode ?? code,
                        executionTimeMs: result.executionTimeMs ?? elapsed,
                        memoryUsageKb: result.memoryUsageKb ?? null,
                        timedOut: result.timedOut ?? false,
                        memoryExceeded: code === 137 || (result.memoryExceeded ?? false),
                        sandboxError: false,
                    });
                } catch {
                    resolve({
                        compilationSuccess: false,
                        compilationOutput: stderr,
                        stdout: '',
                        stderr,
                        exitCode: code,
                        executionTimeMs: elapsed,
                        memoryUsageKb: null,
                        timedOut: false,
                        memoryExceeded: code === 137,
                        sandboxError: true,
                        sandboxErrorMessage: `Sandbox script error. stderr: ${stderr.slice(0, 500)}`,
                    });
                }
            });
        });
    }

    private buildScript(language: string, timeLimitSec: number): string {
        return `
set -euo pipefail
cd /sandbox

echo "$CODE_B64" | base64 -d > code_raw
echo "$INPUT_B64" | base64 -d > input.txt

COMPILE_SUCCESS=true
COMPILE_OUTPUT=""
STDOUT=""
STDERR=""
EXIT_CODE=0
TIMED_OUT=false
MEM_KB=null
TIME_MS=0

_emit() {
  local cs="$(echo "$COMPILE_SUCCESS")"
  local co="$(echo "$COMPILE_OUTPUT" | python3 -c "import sys,json; print(json.dumps(sys.stdin.read()))")"
  local so="$(echo "$STDOUT" | python3 -c "import sys,json; print(json.dumps(sys.stdin.read()))")"
  local se="$(echo "$STDERR" | python3 -c "import sys,json; print(json.dumps(sys.stdin.read()))")"
  printf '{"compilationSuccess":%s,"compilationOutput":%s,"stdout":%s,"stderr":%s,"exitCode":%d,"executionTimeMs":%d,"memoryUsageKb":null,"timedOut":%s,"memoryExceeded":false}\\n' \\
    "$cs" "$co" "$so" "$se" "$EXIT_CODE" "$TIME_MS" "$TIMED_OUT"
}

case "$LANG_ID" in
  cpp|c)
    cp code_raw source\${LANG_ID:+.$LANG_ID}
    COMPILER="g++"
    [ "$LANG_ID" = "c" ] && { cp code_raw source.c; COMPILER="gcc"; } || cp code_raw source.cpp
    COMPILE_OUTPUT=$(\${COMPILER} source.* -o prog 2>&1) && COMPILE_OK=0 || COMPILE_OK=$?
    if [ $COMPILE_OK -ne 0 ]; then
      COMPILE_SUCCESS=false
      EXIT_CODE=$COMPILE_OK
      STDOUT=""
      STDERR="$COMPILE_OUTPUT"
      _emit; exit 0
    fi
    START=$(date +%s%3N)
    EXEC_OUT=$(timeout ${timeLimitSec}s ./prog < input.txt 2>/tmp/run_err) && EXIT_CODE=$? || EXIT_CODE=$?
    END=$(date +%s%3N)
    TIME_MS=$((END - START))
    STDERR=$(cat /tmp/run_err 2>/dev/null || echo "")
    [ $EXIT_CODE -eq 124 ] && TIMED_OUT=true
    STDOUT="$EXEC_OUT"
    ;;
  python)
    cp code_raw source.py
    START=$(date +%s%3N)
    EXEC_OUT=$(timeout ${timeLimitSec}s python3 source.py < input.txt 2>/tmp/run_err) && EXIT_CODE=$? || EXIT_CODE=$?
    END=$(date +%s%3N)
    TIME_MS=$((END - START))
    STDERR=$(cat /tmp/run_err 2>/dev/null || echo "")
    [ $EXIT_CODE -eq 124 ] && TIMED_OUT=true
    STDOUT="$EXEC_OUT"
    ;;
  java)
    cp code_raw Main.java
    COMPILE_OUTPUT=$(javac Main.java 2>&1) && COMPILE_OK=0 || COMPILE_OK=$?
    if [ $COMPILE_OK -ne 0 ]; then
      COMPILE_SUCCESS=false
      EXIT_CODE=$COMPILE_OK
      STDOUT=""
      STDERR="$COMPILE_OUTPUT"
      _emit; exit 0
    fi
    START=$(date +%s%3N)
    EXEC_OUT=$(timeout ${timeLimitSec}s java -Xmx200m Main < input.txt 2>/tmp/run_err) && EXIT_CODE=$? || EXIT_CODE=$?
    END=$(date +%s%3N)
    TIME_MS=$((END - START))
    STDERR=$(cat /tmp/run_err 2>/dev/null || echo "")
    [ $EXIT_CODE -eq 124 ] && TIMED_OUT=true
    STDOUT="$EXEC_OUT"
    ;;
  *)
    echo '{"compilationSuccess":false,"compilationOutput":"","stdout":"","stderr":"Unsupported language","exitCode":1,"executionTimeMs":0,"memoryUsageKb":null,"timedOut":false,"memoryExceeded":false}'
    exit 0
    ;;
esac

_emit
`;
    }
}
