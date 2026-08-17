import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import CommandPaletteResults from "./CommandPaletteResults";
import { commandPaletteManager } from "./CommandPaletteManager";
import { paletteItem } from "./palette.types";

const CommandPalette = () => {
    console.log('Command Palette rendered');
    const [items, setItems] = useState<paletteItem[]>([]);
    const [canShow, setCanShow] = useState<boolean>(false);
    const [placeholder, setPlaceholder] = useState<string>("Search files or commands...");
    const [selectedIndex, setSelectedIndex] = useState<number>(0);
    const timeoutRef = useRef<number | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setSelectedIndex(0);
    }, [items]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(async () => {
            const queryItems = await commandPaletteManager.processQuery(query);
            setItems(queryItems);
        }, 75);
    };

    const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex((prev) => (items.length > 0 ? (prev + 1) % items.length : 0));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex((prev) => (items.length > 0 ? (prev - 1 + items.length) % items.length : 0));
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (items.length > 0) {
                const item = items[selectedIndex] || items[0];
                if (item) {
                    commandPaletteManager.hideCommadPalette();
                    try {
                        if (item.onSelect) {
                            await item.onSelect();
                        }
                    } catch (err) {
                        console.error("Error executing item onSelect:", err);
                    }
                }
            }
        } else if (e.key === "Escape") {
            e.preventDefault();
            commandPaletteManager.hideCommadPalette();
        }
    };

    useEffect(() => {
        commandPaletteManager.register(
            setCanShow,
            setItems,
            () => {
                setTimeout(() => {
                    if (inputRef.current) {
                        inputRef.current.focus();
                        if (inputRef.current.value === ">") {
                            inputRef.current.setSelectionRange(1, 1);
                        } else {
                            inputRef.current.select();
                        }
                    }
                }, 10);
            },
            () => {
                if (inputRef.current) {
                    inputRef.current.blur();
                }
            },
            (val: string) => {
                if (inputRef.current) {
                    inputRef.current.value = val;
                }
                if (val === "") {
                    setItems([]);
                } else {
                    void commandPaletteManager.processQuery(val).then((newItems) => setItems(newItems));
                }
            },
            (ph: string) => {
                setPlaceholder(ph);
            }
        );
    }, []);

    return (
        <div
            className="command-palette-wrapper"
            onClick={() => commandPaletteManager.openCommandPalette()}
        >
            <Search size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
            <input
                ref={inputRef}
                className="command-palette-input"
                placeholder={placeholder}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onFocus={async () => {
                    setCanShow(true);
                    const val = inputRef.current?.value || "";
                    if (items.length === 0 || val.startsWith(">")) {
                        const initItems = await commandPaletteManager.processQuery(val);
                        setItems(initItems);
                    }
                }}
                onBlur={() => {
                    commandPaletteManager.hideCommadPalette();
                }}
            />
            <span className="command-palette-shortcut">⌘P</span>
            {canShow && <CommandPaletteResults results={items} selectedIndex={selectedIndex} />}
        </div>
    );
};

export default CommandPalette;
