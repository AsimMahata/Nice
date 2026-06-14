import { Command } from "lucide-react"
import { useRef, useState } from "react"
import { searchEngine } from "../../../services/Search/SearchEngine";
import { FileInfo } from "../../FileEx/FileActions";
import SearchList from "./SearchList";


const SearchBox = () => {
    console.log('Search Bar rendered')
    const [results, setResults] = useState<FileInfo[]>([])
    const [canShow, setCanShow] = useState<boolean>(false);
    const timeoutRef = useRef<number | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(async () => {
            const results = searchEngine.search(query);
            setResults(results);
        }, 200);
    };

    return (
        <div className="search-wrapper">
            <Command size={14} className="search-icon" color="#585b70" />
            <input
                className="search-input"
                placeholder="Quick search..."
                onChange={handleChange}
                onFocus={() => setCanShow(true)}
                onBlur={() => {
                    setTimeout(() => setCanShow(false), 150);
                }}
            />
            {canShow && <SearchList results={results} />}
        </div>
    )
}

export default SearchBox
