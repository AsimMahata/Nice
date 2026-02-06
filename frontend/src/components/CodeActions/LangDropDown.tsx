type Props = {
    lang: string,
    setLang: React.Dispatch<React.SetStateAction<string>>
}

function LangDropDown({ lang, setLang }: Props) {
    const languages = ["cpp", "python", "java", "c"];

    return (
        <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
        >
            <option value="">Select Languages</option>
            {languages.map((lang) => (
                <option key={lang} value={lang}>
                    {lang}
                </option>
            ))}
        </select>
    );
}

export default LangDropDown;
