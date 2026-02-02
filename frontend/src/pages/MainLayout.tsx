import {
    FolderIcon, Search, Github, Terminal,
    Settings, User, X, Command,
    VenetianMask
} from 'lucide-react';
import CodeEditor from '../components/CodeEditor';
import FileEx from '../components/FileEx/FileEx';
import { getPlaceholder } from '../utils/getPlaceholder';
import { useMemo, useEffect, useState } from "react";
import { FileEntry } from "../components/FileEx/FileAcations";
import LangDropDown from '../components/LangDropDown';
import { extname } from '@tauri-apps/api/path';
function MainLayout() {
    const [lang, setLang] = useState<string | null>('cpp')                   // selected Compiler
    const [codeFile, setCodeFile] = useState<FileEntry | null>(null)   // the file that is opned
    const [savingCode, setSavingCode] = useState<boolean>(false);      // its a toogle that triggers save code function
    const placeholder = useMemo(() => {
        return getPlaceholder(lang || "");
    }, [lang]);
    const [code, setCode] = useState<string>(placeholder);           // the main code inside editor-area
    const [mainDir, setMainDir] = useState<string | null>(null)        // main project folder by user
    useEffect(() => {
        if (code !== placeholder) {
            setCode(placeholder);
        }
    }, [lang]);

    const [asim, _setAsim] = useState(true)
    useEffect(() => {
        if (asim) {
            setMainDir("/home/asim/dev/testing")
        }
    }, [])
    useEffect(() => {
        async function run() {
            async function getFileExtenstion(filePath: string) {
                if (!filePath) return ""
                try {
                    return await extname(filePath)
                } catch (err) {
                    console.log('frontend mainlayout getFileExtenstion error', err)
                    return ""
                }
            }

            const filePath = codeFile?.filePath
            const extension = await getFileExtenstion(filePath || "")
            const map: Record<string, string> = {
                'cpp': 'cpp',
                'py': 'python',
                'java': 'java',
                'c': 'c',
            }

            setLang(map[extension] ?? 'plaintext')
            console.log('frontend mainlayout on file change', codeFile)
            console.log('frontend mainlayout file path', filePath)
            console.log('frontend mainlayout ext', extension)
        }

        run()
    }, [codeFile])
    return (
        <div className="h-screen w-full flex flex-col bg-[#11111b] text-[#cdd6f4] text-[13px] font-sans overflow-hidden select-none p-3 gap-3">

            {/* Header */}
            <header className="h-12 flex items-center justify-between px-6 bg-[#181825] rounded-xl border border-[#313244]/50 shrink-0">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-2 text-[#fab387]">
                        <VenetianMask size={18} strokeWidth={2.5} />
                        <span className="font-bold tracking-tight text-white uppercase text-[11px]">Nice</span>
                    </div>
                    <nav className="flex items-center gap-6 text-[#a6adc8]">
                        {["Project", "Edit", "View", "Tools"].map(m => (
                            <span key={m} className="hover:text-[#89b4fa] cursor-pointer transition-colors text-[12px] font-medium">{m}</span>
                        ))}
                        <span key={69} className="hover:text-[#89b4fa] cursor-pointer transition-colors text-[12px] font-medium">{lang}</span>
                        <LangDropDown lang={lang} setLang={setLang} />
                    </nav>
                </div>

                <div className="flex items-center bg-[#11111b] border border-[#313244] rounded-lg px-3 w-[400px] h-8 focus-within:border-[#89b4fa] transition-all">
                    <Command size={14} className="text-[#585b70]" />
                    <input className="flex-1 bg-transparent px-2 text-xs outline-none text-[#cdd6f4] placeholder-[#585b70]" placeholder="Quick search..." />
                </div>
                <div className="w-20" />
            </header>

            {/* Main Body */}
            <div className="flex flex-1 gap-3 overflow-hidden">

                {/* Activity Bar */}
                <aside className="w-[64px] bg-[#181825] flex flex-col justify-between items-center py-6 rounded-xl border border-[#313244]/50 shrink-0">
                    <div className="flex flex-col items-center gap-6">
                        <ActivityIcon icon={<FolderIcon size={22} />} active />
                        <ActivityIcon icon={<Search size={22} />} />
                        <ActivityIcon icon={<Github size={22} />} />
                        <ActivityIcon icon={<Terminal size={22} />} />
                    </div>
                    <div className="flex flex-col items-center gap-5">
                        <ActivityIcon icon={<User size={22} />} />
                        <ActivityIcon icon={<Settings size={22} />} />
                    </div>
                </aside>

                {/* Sidebar - Added padding to nested container */}
                <FileEx
                    codeFile={codeFile}
                    setCodeFile={setCodeFile}
                    code={code}
                    setCode={setCode}
                    savingCode={savingCode}
                    setSavingCode={setSavingCode}
                    mainDir={mainDir}
                    setMainDir={setMainDir}
                />


                {/* Editor */}
                <main className="flex-1 flex flex-col min-w-0 bg-[#1e1e2e] rounded-xl border border-[#313244] overflow-hidden">
                    {/* Tabs - Added p-2 and gap-2 to prevent clipping at the rounded corner */}
                    <div className="h-10 bg-[#181825] flex items-center p-10 gap-5 border-b border-[#313244]">
                        <Tab name="Current" active />
                    </div>
                    <CodeEditor key={lang} code={code} setCode={setCode} lang={lang} />
                </main>
            </div>
        </div>
    );
};

/* Components */

const ActivityIcon = ({ icon, active = false }: any) => (
    <div className={`w-11 h-11 flex items-center justify-center cursor-pointer rounded-xl transition-all
        ${active ? 'bg-[#313244] text-[#89b4fa]' : 'text-[#6c7086] hover:bg-[#313244] hover:text-[#cdd6f4]'}`}>
        {icon}
    </div>
);


const Tab = ({ name, active = false }: any) => (
    /* rounded-lg makes the tab sit neatly inside the padded container */
    <div className={`h-full px-4 left-1.5 flex items-center gap-3 rounded-lg cursor-pointer transition-all text-[12px] p-10
        ${active ? 'bg-[#1e1e2e] text-[#89b4fa] border border-[#313244]' : 'text-[#6c7086] hover:bg-[#313244]/50'}`}>
        <span>{name}</span>
        {active && <X size={14} className="hover:text-[#f38ba8]" />}
    </div>
);

export default MainLayout;
