import {
    FolderIcon, Search, Github, Terminal,
    Settings, User, X, Command, VenetianMask
} from 'lucide-react';
import CodeEditor from '../../components/CodeEditor/CodeEditor';
import FileEx from '../../components/FileEx/FileEx';
import { getPlaceholder } from '../../utils/getPlaceholder';
import { useMemo, useEffect, useState } from "react";
import { FileEntry } from "../../components/FileEx/FileAcations";
import { extname } from '@tauri-apps/api/path';

import './HomeTest.css'; // Import the new CSS file
import PickDir from '../../components/FileEx/PickDir';
import UserDetails from '../../components/User/UserDetails';
function HomeTest() {
    const [sidePanel, setSidePanle] = useState<boolean>(false);  // is side panel visible or not 
    const [currentActivity, setCurrentActivity] = useState<string | null>('file-ex') // what is the current active button on side panel
    const [lang, setLang] = useState<string | null>('cpp');
    const [codeFile, setCodeFile] = useState<FileEntry | null>(null);
    const [savingCode, setSavingCode] = useState<boolean>(false);
    const [mainDir, setMainDir] = useState<string | null>(null);
    const [asim, _setAsim] = useState(true);

    const placeholder = useMemo(() => getPlaceholder(lang || ""), [lang]);
    const [code, setCode] = useState<string>(placeholder);

    const handleActivityClickEvent = (name: string) => {
        if (!name) setSidePanle(false)
        if (currentActivity == name) {
            console.log('frontend/home/handleActivityClickEvent/ to check its already active ')
            setSidePanle(p => !p)
            return;
        }
        setCurrentActivity(name)
        setSidePanle(true)
        console.log('current active section in frontend home ', name)
    }
    const ActivityIcon = ({ name, icon }: any) => (
        < div className={`activity-icon-btn ${(currentActivity == name) ? 'active' : ''}`
        }
            onClick={() => handleActivityClickEvent(name)}
        >
            {icon}
        </div >
    );

    const Tab = ({ name, active = false }: any) => (
        <div className={`tab-item ${active ? 'active' : ''}`}>
            <span>{name}</span>
            {active && <X size={14} className="close-icon" />}
        </div>
    );

    function getCorrectActivitybar() {
        switch (currentActivity) {
            case ('FileEx'):
                return <FileEx
                    codeFile={codeFile}
                    setCodeFile={setCodeFile}
                    code={code}
                    setCode={setCode}
                    savingCode={savingCode}
                    setSavingCode={setSavingCode}
                    mainDir={mainDir}
                    setMainDir={setMainDir}
                />
            case ('Search'): return <div> Search</div>
            case ('Github'): return <div> Github</div>
            case ('CodeAction'): return <div> CodeAction </div>
            case ('User'): return <UserDetails />
            case ('Settings'): return <div> Settings</div>
            default: return null;
        }
    }
    useEffect(() => {
        if (code !== placeholder) setCode(placeholder);
    }, [lang]);

    useEffect(() => {
        if (asim) setMainDir("/home/asim/dev/testing");
    }, []);

    useEffect(() => {
        async function run() {
            async function getFileExtenstion(filePath: string) {
                if (!filePath) return "";
                try {
                    return await extname(filePath);
                } catch (err) {
                    console.log('frontend error', err);
                    return "";
                }
            }

            const filePath = codeFile?.filePath;
            const extension = await getFileExtenstion(filePath || "");
            const map: Record<string, string> = {
                'cpp': 'cpp', 'py': 'python', 'java': 'java', 'c': 'c',
            };

            setLang(map[extension] ?? 'plaintext');
        }
        run();
    }, [codeFile]);

    return (
        <div className="ide-container">
            <header className="ide-header">
                <div className="header-left">
                    <div className="logo-section">
                        <VenetianMask size={18} strokeWidth={2.5} />
                        <span className="logo-text">Nice</span>
                    </div>
                    <nav className="nav-menu">
                        <PickDir
                            text='Project'
                            mainDir={mainDir}
                            setMainDir={setMainDir}
                        />
                        {["Edit", "View", "Tools"].map(m => (
                            <span key={m} className="nav-link">{m}</span>
                        ))}
                        <span className="currentProgrammingLang">{lang}</span>
                    </nav>
                </div>

                <div className="search-wrapper">
                    <Command size={14} className="search-icon" color="#585b70" />
                    <input className="search-input" placeholder="Quick search..." />
                </div>
                <div style={{ width: '80px' }} />
            </header>

            <div className="main-body">
                <aside className="activity-bar">
                    <div className="icon-stack">
                        <ActivityIcon name={"FileEx"} icon={<FolderIcon size={22} />} />
                        <ActivityIcon name={"Search"} icon={<Search size={22} />} />
                        <ActivityIcon name={"Github"} icon={<Github size={22} />} />
                        <ActivityIcon name={"CodeAction"} icon={<Terminal size={22} />} />
                    </div>
                    <div className="icon-stack">
                        <ActivityIcon name={"User"} icon={<User size={22} />} />
                        <ActivityIcon name={"Settings"} icon={<Settings size={22} />} />
                    </div>
                </aside>
                <div className='current-activity' style={{ display: (sidePanel ? 'block' : 'none'), minWidth: '40vh' }}>
                    {getCorrectActivitybar()}
                </div>

                <main className="editor-container">
                    <div className="tab-bar">
                        <Tab name="Current" active />
                    </div>
                    <CodeEditor key={lang} code={code} setCode={setCode} lang={lang} />
                </main>
            </div>
        </div>
    );
}

export default HomeTest;
