type Props={
  lang:string,
  _setLang:React.Dispatch<React.SetStateAction<string>>
}

function LangDropDown({lang,_setLang}:Props) {
    const languages = ["cpp", "python", "java", "c"];

    return (
        <select
            value={lang}
            onChange={(e) => _setLang(e.target.value)}
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
