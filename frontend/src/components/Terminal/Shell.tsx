import React, { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";
import { FitAddon } from "@xterm/addon-fit";
import { Panel } from "react-resizable-panels";
type Props = {
    setTerminal: React.Dispatch<React.SetStateAction<boolean>>;
    mainDir: string | null
};
type termOpts = {
    cwd?: string,
    cols: number,
    rows: number,
    name: string
}
declare global {
    interface Window {
        pty?: {
            create: (options: termOpts) => Promise<void>
            write: (data: string) => Promise<void>
            destroy: () => Promise<void>
            onData: (cb: (data: string) => void) => () => void
            resize: (cols: number, rows: number) => void
        };
    }
}
const Shell = ({ setTerminal, mainDir }: Props) => {
    const terminalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!terminalRef.current) return;

        const term = new Terminal({
            // --- Windows Specific Performance ---
            allowProposedApi: true, // Needed for many modern xterm features

            // --- Sizing ---
            rows: 30,
            cols: 100,

            // --- Font (Windows Optimized) ---
            // 'Consolas' is the standard Windows terminal font if Cascadia isn't installed
            fontFamily: "'Cascadia Code', Consolas, 'Courier New', monospace",
            fontSize: 14,
            lineHeight: 1.1,

            // --- Windows Behavior ---
            convertEol: true,     // CRUCIAL for Windows: Converts \n to \r\n automatically
            cursorStyle: 'block', // 'block' is more standard for Windows consoles
            cursorBlink: true,
            scrollback: 10000,

            // --- Theme (Vibrant Windows Dark) ---
            theme: {
                background: '#0c0c0c', // Pure Windows Terminal black
                foreground: '#cccccc',
                cursor: '#ffffff',
                selectionBackground: '#ffffff47',

                black: '#0c0c0c',
                red: '#c50f1f',
                green: '#13a10e',
                yellow: '#c19c00',
                blue: '#0037da',
                magenta: '#881798',
                cyan: '#3a96dd',
                white: '#cccccc',

                brightBlack: '#767676',
                brightRed: '#e74856',
                brightGreen: '#16c60c',
                brightYellow: '#f9f1a5',
                brightBlue: '#3b78ff',
                brightMagenta: '#b4009e',
                brightCyan: '#61d6d6',
                brightWhite: '#f2f2f2',
            },
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        term.open(terminalRef.current);
        fitAddon.fit()
        console.log('we have a term', term)
        async function createPtyBackend(termOpts: termOpts) {
            try {
                await window.pty?.create(termOpts)
                console.log('sucessfully created backend pty')
            } catch (err) {
                console.log('error creating pty in backend ', err)
            }
        }
        if (!mainDir) {
            console.error('select a main directory first to open terminal', mainDir)
            return;
        }
        const termOpts: termOpts = {
            cwd: mainDir,
            rows: term.rows,
            cols: term.cols,
            name: "xterm-256color",
        }
        createPtyBackend(termOpts)
        term.onData((data) => {
            if (!window.pty) {
                console.log('window.pty does not exists')
                return
            }
            console.log('data-in-frontend-pty', data)
            window.pty?.write(data)
        });
        window.pty?.onData((data: string) => {
            console.log('from backend pty:', data)
            term.write(data)
        })
        const resize = () => {
            fitAddon.fit()
            requestAnimationFrame(() => {
                fitAddon.fit()
                window.pty?.resize(term.cols, term.rows)
            })
        }

        window.addEventListener("resize", resize);

        resize();

        return () => {
            window.removeEventListener("resize", resize);
            term.dispose();
        };
    }, []);
    return (
        <Panel
            defaultSize="35%"
            onResize={(size) => {
                if (size.asPercentage < 10) setTerminal(false);
            }}
        >
            <div ref={terminalRef} className="main-container" />
        </Panel>
    );
};

export default Shell;
