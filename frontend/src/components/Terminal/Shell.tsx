import React, { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";
import { FitAddon } from "@xterm/addon-fit";
import { Panel } from "react-resizable-panels";
type Props = {
    setTerminal: React.Dispatch<React.SetStateAction<boolean>>;
};
type termOpts = {
    cwd: string,
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
const Shell = ({ setTerminal }: Props) => {
    const terminalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!terminalRef.current) return;

        const term = new Terminal({
            // --- Rendering ---
            rendererType: 'canvas',        // fastest & stable
            allowProposedApi: false,

            // --- Font ---
            fontFamily: 'Cascadia Code, JetBrains Mono, monospace',
            fontSize: 14,
            lineHeight: 1.25,
            letterSpacing: 0,
            fontWeight: 'normal',
            fontWeightBold: 'bold',

            // --- Cursor ---
            cursorStyle: 'bar',          // 'block' | 'underline' | 'bar'
            cursorBlink: true,

            // --- Behavior ---
            convertEol: true,
            scrollback: 5000,
            disableStdin: false,
            screenReaderMode: false,

            // --- Selection ---
            selectionClipboard: true,
            copyOnSelect: false,

            // --- Bell ---
            bellStyle: 'none',              // 'none' | 'sound' | 'visual'

            // --- Mouse ---
            macOptionIsMeta: true,
            rightClickSelectsWord: false,

            // --- Performance ---
            fastScrollModifier: 'alt',
            fastScrollSensitivity: 5,

            // --- Unicode ---
            allowTransparency: false,
            minimumContrastRatio: 1,

            // --- Theme (Catppuccin Mocha example) ---
            theme: {
                background: '#1e1e2e',
                foreground: '#cdd6f4',
                cursor: '#f5e0dc',
                selection: '#585b70',

                black: '#45475a',
                red: '#f38ba8',
                green: '#a6e3a1',
                yellow: '#f9e2af',
                blue: '#89b4fa',
                magenta: '#f5c2e7',
                cyan: '#94e2d5',
                white: '#bac2de',

                brightBlack: '#585b70',
                brightRed: '#f38ba8',
                brightGreen: '#a6e3a1',
                brightYellow: '#f9e2af',
                brightBlue: '#89b4fa',
                brightMagenta: '#f5c2e7',
                brightCyan: '#94e2d5',
                brightWhite: '#a6adc8',
            },
        })

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        term.open(terminalRef.current);
        fitAddon.fit()
        async function createPtyBackend(termOpts: termOpts) {
            try {
                await window.pty?.create(termOpts)
                console.log('sucessfully created backend pty')
            } catch (err) {
                console.log('error creating pty in backend ', err)
            }
        }
        const termOpts: termOpts = {
            cwd: '/home/asim/dev/testing/',
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
