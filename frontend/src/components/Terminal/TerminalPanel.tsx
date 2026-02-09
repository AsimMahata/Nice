import { useState } from 'react';
import Terminal from './Terminal';
import './TerminalPanel.css';
import { termOpts } from './Terminal';
import { useWorkspaceContext } from '../../contexts/Workspace/WorkspaceProvider';
interface Tab {
    id: string;
    name: string;
    active: boolean;
}
type Props = {
    onResize?: (cols: number, rows: number) => void,
    setTerminal: React.Dispatch<React.SetStateAction<boolean>>,
};
export function TerminalPanel({ setTerminal }: Props) {
    //constexts
    const { cwd } = useWorkspaceContext()
    const [tabs, setTabs] = useState<Tab[]>([
        { id: '1', name: 'bash', active: true },
    ]);
    const [activeTab, setActiveTab] = useState('1');

    const handleNewTerminal = () => {
        const newId = String(Date.now());
        setTabs([...tabs, { id: newId, name: 'bash', active: false }]);
        setActiveTab(newId);
        if (!cwd) {
            console.error('first select a project directory first')
            return;
        }
        if (!window.pty) {
            console.error('window pty api not defined')
        }
        const termOpts: termOpts = {
            cwd: cwd,
            rows: 80,
            cols: 40,
            name: "xterm-256color",
        }
        window.pty?.create(termOpts);
    };

    const handleCloseTab = (id: string) => {
        if (tabs.length === 1) return;
        const newTabs = tabs.filter(t => t.id !== id);
        setTabs(newTabs);
        if (activeTab === id) {
            setActiveTab(newTabs[0].id);
        }
    };

    const handleSelectTab = (id: string) => {
        setActiveTab(id);
    };

    return (
        <div className="terminal-panel">
            {/* Terminal Header - VS Code style */}
            <div className="terminal-header">
                <div className="terminal-tabs">
                    {tabs.map((tab) => (
                        <div
                            key={tab.id}
                            className={`terminal-tab ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => handleSelectTab(tab.id)}
                        >
                            <span className="terminal-tab-icon">⌘</span>
                            <span className="terminal-tab-name">{tab.name}</span>
                            <button
                                className="terminal-tab-close"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleCloseTab(tab.id);
                                }}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                    <button className="terminal-new-tab" onClick={handleNewTerminal}>
                        +
                    </button>
                </div>
                <div className="terminal-actions">
                    <button className="terminal-action" title="Split Terminal">
                        ⊞
                    </button>
                    <button className="terminal-action" title="Kill Terminal">
                        🗑
                    </button>
                    <button className="terminal-action" title="Maximize">
                        ⤢
                    </button>
                </div>
            </div>

            {/* Terminal Content */}
            <div className="terminal-content">
                <Terminal setTerminal={setTerminal} />
            </div>
        </div>
    );
}
