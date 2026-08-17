import { spawn } from "child_process";
import { channel } from "diagnostics_channel";
import { WebSocketServer } from "ws"
import type { WebSocket, RawData } from "ws"
import * as os from "os"
import { join } from "path";
import { existsSync } from "fs";
import { execSync } from "child_process";
import path from "path";

export function setupLSPWebSocket() {
    const PORT = 3001
    const userHome = os.homedir()
    console.log('homedir of user ...------------', userHome)

    function buildQueryDriverFlag(): string | null {
        try {
            const output = execSync("where g++", { encoding: "utf8" });
            const firstPath = output.split(/\r?\n/)[0].trim();

            if (!firstPath) return null;

            const dir = path.dirname(firstPath).replace(/\\/g, "/");
            return `--query-driver=${dir}/*`;
        } catch {
            return null;
        }
    }

    const wss = new WebSocketServer({ port: PORT })
    console.log(`LSP BRIDGE running on ws://localhost:${PORT}`);

    wss.on("connection", (ws: WebSocket, req: Request) => {

        console.log("Client connected")

        const url = new URL(req.url, "ws://localhost")
        const lang = url.searchParams.get("lang")

        console.log(" NEW CONNECTION | lang =", lang);

        let server;
        let name;

        if (lang === "c" || lang === "cpp") {

            name = "CLANGD"

            const clangdLocation = join(userHome, ".nice", "lsp", "clangd", "bin", "clangd.exe")
            const globalFlagsDir = join(userHome, '.nice', 'compilerflags', 'cpp')

            console.log('clangd path', clangdLocation)

            if (!existsSync(clangdLocation)) {
                console.error('clangd doesnt exits or folder doesnt exits')
                ws.close()
                return;
            }

            const queryDriver = buildQueryDriverFlag();

            server = spawn(
                clangdLocation,
                queryDriver
                    ? [queryDriver, `--compile-commands-dir=${globalFlagsDir}`]
                    : [`--compile-commands-dir=${globalFlagsDir}`],
                { stdio: ["pipe", "pipe", "pipe"] }
            );

        } else if (lang === "python" || lang === "py") {

            name = "PYRIGHT"

            const pyrightLocation = join(
                userHome,
                ".nice",
                "lsp",
                "pyright",
                "node_modules",
                ".bin",
                "pyright-langserver.cmd"
            );

            console.log("pyright path", pyrightLocation);

            if (!existsSync(pyrightLocation)) {
                console.error("pyright not found");
                ws.close();
                return;
            }

            server = spawn(
                pyrightLocation,
                ["--stdio"],
                {
                    stdio: ["pipe", "pipe", "pipe"],
                    shell: true
                }
            );

        } else if (lang === "java") {

            name = "JDTLS";

            const jdtlsCmd = join(
                userHome,
                ".nice",
                "lsp",
                "jdtls",
                "jdtls.cmd"
            );

            console.log("jdtls path", jdtlsCmd);

            if (!existsSync(jdtlsCmd)) {
                console.error("jdtls.cmd not found");
                ws.close();
                return;
            }

            server = spawn(
                jdtlsCmd,
                [],
                {
                    stdio: ["pipe", "pipe", "pipe"],
                    shell: true   // required for .cmd
                }
            );
        } else {

            console.error("Unknown Lang or Unimplemented")
            ws.close()
            return;
        }

        server.on("error", (err) => {
            console.error("some error occured in Spawn ", name, err)
        })

        let buffer = Buffer.alloc(0)

        ws.on("message", (data) => {
            try {
                const json = JSON.parse(data.toString())

                if (json.method === "textDocument/didChange") {
                    json.params.contentChanges = json.params.contentChanges.map((c: any) =>
                        c.range ? c : { text: c.text }
                    );
                }

                const body = JSON.stringify(json)

                const framed =
                    `Content-Length: ${Buffer.byteLength(body, "utf8")}\r\n\r\n${body}`;

                server.stdin.write(framed)

            } catch (err) {
                console.error("failed to parse msg", err)
            }
        });

        server.stdout.on("data", (chunk) => {
            buffer = Buffer.concat([buffer, chunk]);

            while (true) {
                const sep = buffer.indexOf("\r\n\r\n");
                if (sep === -1) break;

                const header = buffer.slice(0, sep).toString();
                const match = header.match(/Content-Length: (\d+)/i);
                if (!match) {
                    buffer = buffer.slice(sep + 4);
                    continue;
                }

                const len = parseInt(match[1], 10);
                const total = sep + 4 + len;
                if (buffer.length < total) break;

                const body = buffer.slice(sep + 4, total);
                buffer = buffer.slice(total);

                ws.send(body.toString());
            }
        });

        server.stderr.on("data", (d) => {
            const msg = d.toString().trim();
            if (msg) console.log(` ${name}:`, msg);
        });

        ws.on("close", () => {
            console.log("--------------- CLIENT DISCONNECTED------------------------");
            server.kill();
        });
    })
}
