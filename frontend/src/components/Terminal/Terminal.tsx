import { useEffect, useRef, useState } from "react";
import { Command } from "@tauri-apps/plugin-shell";

export default function Terminal() {
    const [history, setHistory] = useState<string[]>([]);
    const [input, setInput] = useState("");
    const boxRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // always keep cursor active
    useEffect(() => {
        inputRef.current?.focus();
    }, [history]);

    const run = async () => {
        const cmdText = input.trim();
        if (!cmdText) return;

        setHistory(h => [...h, `mainDir > ${cmdText}`]);
        setInput("");

        try {
            const res = await Command.create(
                "curdir",
                ["-c", cmdText],
                { cwd: "/home/asim/dev/testing" }
            ).execute();

            if (res.stdout) setHistory(h => [...h, res.stdout]);
            if (res.stderr) setHistory(h => [...h, res.stderr]);
        } catch (e: any) {
            setHistory(h => [...h, "error: " + String(e)]);
        }
    };

    return (
        <div
            ref={boxRef}
            onClick={() => inputRef.current?.focus()}
            style={{
                background: "#111",
                color: "#0f0",
                height: "30vh",
                padding: "10px",
                fontFamily: "monospace",
                overflowY: "auto",
                cursor: "text"
            }}
        >
            {history.map((l, i) => (
                <div key={i}>{l}</div>
            ))}

            <div>
                <span>mainDir &gt; </span>
                <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            run();
                        }
                    }}
                    rows={1}
                    style={{
                        background: "transparent",
                        color: "#0f0",
                        border: "none",
                        outline: "none",
                        resize: "none",
                        width: "90%",
                        fontFamily: "monospace"
                    }}
                />
            </div>
        </div>
    );
}
