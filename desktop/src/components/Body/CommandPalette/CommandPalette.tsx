import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import CommandPaletteResults from "./CommandPaletteResults";
import { commandPaletteManager } from "./CommandPaletteManager";
import { paletteItem } from "./palette.types";

const CommandPalette = () => {
    console.log('Command Palette rendered');
    const [items, setItems] = useState<paletteItem[]>([]);
    const [canShow, setCanShow] = useState<boolean>(false);
    const timeoutRef = useRef<number | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

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

    useEffect(() => {
        commandPaletteManager.register(
            setCanShow,
            setItems,
            () => {
                setTimeout(() => {
                    if (inputRef.current) {
                        inputRef.current.focus();
                        inputRef.current.select();
                    }
                }, 10);
            },
            () => {
                if (inputRef.current) {
                    inputRef.current.blur();
                }
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
                placeholder="Search files or commands..."
                onChange={handleChange}
                onFocus={async () => {
                    setCanShow(true);
                    if (items.length === 0) {
                        const initItems = await commandPaletteManager.processQuery("");
                        setItems(initItems);
                    }
                }}
                onBlur={() => {
                    setTimeout(() => setCanShow(false), 250);
                }}
            />
            <span className="command-palette-shortcut">⌘P</span>
            {canShow && <CommandPaletteResults results={items} />}
        </div>
    );
};

export default CommandPalette;
