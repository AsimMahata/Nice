import React, { useCallback, useEffect, useRef } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";
import { FitAddon } from "@xterm/addon-fit";
import './Terminal.css';
import { TerminalOptions, xtermOptions } from "./terminal.options";
import { useWorkspaceContext } from "../../contexts/Workspace/WorkspaceProvider";

type Props = {
    onResize?: (cols: number, rows: number) => void,
    setTerminal: React.Dispatch<React.SetStateAction<boolean>>,
};

const Terminal = ({ onResize }: Props) => {
    //contexts
    const { cwd } = useWorkspaceContext()

    // these 3 refs are required for terminal to function properly
    const terminalRef = useRef<HTMLDivElement>(null);   //Main terminal
    const xtermRef = useRef<XTerm | null>(null)         // the XTerm provided by xterm
    const fitAddonRef = useRef<FitAddon | null>(null)   // fitAddon ref

    // Handle Resizing otherwise Terminal would break
    const handleResize = useCallback(() => {
        if (fitAddonRef.current && xtermRef.current) {
            fitAddonRef.current.fit();
            const dims = fitAddonRef.current.proposeDimensions();
            if (dims) {
                window.pty?.resize(dims.cols, dims.rows);
                onResize?.(dims.cols, dims.rows)
            }
        }
        return;
    }, [onResize]);






    useEffect(() => {
        if (!terminalRef.current || xtermRef.current) return;

        // declare term + fitAddon
        const term = new XTerm(xtermOptions);
        const fitAddon = new FitAddon();

        // load
        term.loadAddon(fitAddon);
        xtermRef.current = term;
        fitAddonRef.current = fitAddon;

        term.open(terminalRef.current);

        // Handle font loading race conditions with a slight delay
        const initTerminalRendering = async () => {
            await document.fonts.ready;
            setTimeout(() => {
                handleResize();
            }, 50);
        };

        initTerminalRendering();

        // user data -> frontend terminal -> backend pty
        term.onData((data) => {
            if (!window.pty) {
                console.log('window.pty does not exists')
                return
            }
            console.log('data-in-frontend-pty', data)
            window.pty?.write(data)
        });
        // backend pty -> frontend terminal -> user
        window.pty?.onData((data) => {
            term.write(data);
        })
        // Terminal exit 
        window.pty?.onExit(() => {
            term.writeln('\r\n\x1b[90m[Process completed]\x1b[0m');
        })
        // create a new pty session
        async function createPtyBackend() {
            if (!cwd) {
                console.error('select a main directory first to open terminal', cwd)
                return;
            }
            const termOpts: TerminalOptions = {
                cwd,
                rows: term.rows,
                cols: term.cols,
                name: "xterm-256color",
            }
            try {
                await window.pty?.create(termOpts)
                console.log('sucessfully created backend pty')
            } catch (err) {
                console.log('error creating pty in backend ', err)
            }
        }
        createPtyBackend();




        // resize observer
        const resizeObserver = new ResizeObserver(() => {
            handleResize();
        })
        resizeObserver.observe(terminalRef.current)


        return () => {
            resizeObserver.disconnect();
            term.dispose();
            xtermRef.current = null
            fitAddonRef.current = null
        };
    }, [handleResize]);

    return (
        <div ref={terminalRef} className="terminal-container" />
    );
};

export default Terminal;
