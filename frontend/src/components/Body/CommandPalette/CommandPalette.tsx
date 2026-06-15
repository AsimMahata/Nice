import { Command } from "lucide-react"
import { useRef, useState } from "react"
import CommandPaletteResults from "./CommandPaletteResults";
import { commandPaletteManager, paletteItem } from "./CommandPaletteManager";

const CommandPalette = () => {
    console.log('Command Palette rendered')
    const [results, setResults] = useState<paletteItem[]>([])
    const [canShow, setCanShow] = useState<boolean>(false);
    const timeoutRef = useRef<number | null>(null);


    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(async () => {
            const queryResults = await commandPaletteManager.processQuery(query);
            setResults(queryResults);
        }, 200);
    };

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
            {canShow && <CommandPaletteResults results={results} />}
        </div>
    )
}

export default CommandPalette
