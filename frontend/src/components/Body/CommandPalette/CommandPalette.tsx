import { Command } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import CommandPaletteResults from "./CommandPaletteResults";
import { commandPaletteManager } from "./CommandPaletteManager";
import { paletteItem } from "./palette.types";

const CommandPalette = () => {
    console.log('Command Palette rendered')
    const [items, setItems] = useState<paletteItem[]>([])
    const [canShow, setCanShow] = useState<boolean>(false);
    const timeoutRef = useRef<number | null>(null);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(async () => {
            const queryItems = await commandPaletteManager.processQuery(query);
            setItems(queryItems);
        }, 200);
    };
    useEffect(() => {
        console.log('[tesing command-palette ] one time');
        commandPaletteManager.register(setCanShow, setItems);
    }, []);

    return (
        <div className="command-palette-wrapper">
            <Command size={14} className="command-palette-icon" color="#585b70" />
            <input
                className="command-palette-input"
                placeholder="Quick search..."
                onChange={handleChange}
                onFocus={() => setCanShow(true)}
                onBlur={() => {
                    setTimeout(() => setCanShow(false), 300);
                }}
            />
            {canShow && <CommandPaletteResults results={items} />}
        </div>
    )
}

export default CommandPalette
