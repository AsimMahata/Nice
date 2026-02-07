import React, { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { invoke } from "@tauri-apps/api/core";
import { Panel } from "react-resizable-panels";

type Props = {
    showTerm: boolean;
    setShowTerm: React.Dispatch<React.SetStateAction<boolean>>;
};

const Shell = ({ showTerm, setShowTerm }: Props) => {
    const terminalRef = useRef<HTMLDivElement>(null);
    const startedRef = useRef(false);

    useEffect(() => {
        if (!terminalRef.current) return;

        const term = new Terminal({
            convertEol: true,
            fontFamily: "JetBrains Mono, monospace",
            theme: { background: "rgb(47,47,47)" },
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        term.open(terminalRef.current);
        fitAddon.fit();

        if (!startedRef.current) {
            startedRef.current = true;
            invoke("create_shell").catch(() => { });
        }

        term.onData((data) => {
            invoke("write_to_pty", { data }).catch(() => { });
        });

        const resize = () => {
            fitAddon.fit();
            invoke("resize_pty", {
                rows: term.rows,
                cols: term.cols,
            }).catch(() => { });
        };

        window.addEventListener("resize", resize);

        let alive = true;
        const readLoop = async () => {
            if (!alive) return;
            try {
                const data = await invoke<string | null>("read_from_pty");
                if (data) term.write(data);
            } catch { }
            requestAnimationFrame(readLoop);
        };
        requestAnimationFrame(readLoop);

        resize();

        return () => {
            alive = false;
            window.removeEventListener("resize", resize);
            term.dispose();
        };
    }, []);

    return (
        <Panel
            defaultSize="35%"
            onResize={(size) => {
                if (size.asPercentage < 10) setShowTerm(false);
            }}
        >
            <div ref={terminalRef} className="main-container" />
        </Panel>
    );
};

export default Shell;
