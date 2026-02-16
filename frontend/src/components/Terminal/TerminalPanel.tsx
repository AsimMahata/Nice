import { useEffect, useRef, useState } from 'react';
import './TerminalPanel.css';
import { terminalManager } from './terminal.manager';
import { Tab } from './terminal.options';
import { useWorkspaceContext } from '../../contexts/Workspace/WorkspaceProvider';
import "@xterm/xterm/css/xterm.css";
type Props = {
    terminal: boolean
    setTerminal: React.Dispatch<React.SetStateAction<boolean>>,
};
export function TerminalPanel({ terminal, setTerminal }: Props) {
    //constexts
    const { cwd } = useWorkspaceContext()
    const constainerRef = useRef<HTMLDivElement>(null);   //Main terminal
    const [tabs, _setTabs] = useState<Tab[]>([
        { id: '1', name: 'bash', active: true },
    ]);

    const [activeTab, _setActiveTab] = useState();

    const handleNewTerminal = () => {
        console.log('new terminal handled')
    };

    const handleCloseTab = (id: string) => {
        console.log('handle close tab', id)
    };

    const handleSelectTab = (id: string) => {
        console.log('handleSelectTab', id)
    };
    useEffect(() => {
        if (!constainerRef.current) return
        if (!cwd) {
            console.log('first select a working directory first')
            return;
        }
        terminalManager.mount(constainerRef.current, cwd)
        console.log('created a terminal -----------------')
    }, [terminal])

    useEffect(() => {
        if (terminal) {
            console.warn('already terminal is opened')
            return;
        }
        console.log('unmounting the terminal----------------')
        terminalManager.unmount()
    }, [terminal])
    if (!terminal) return null
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
                        Split
                    </button>
                    <button onClick={() => setTerminal(false)} className="terminal-action" title="Kill Terminal">
                        X
                    </button>
                    <button className="terminal-action" title="Maximize">
                        ⤢
                    </button>
                </div>
            </div>

            {/* Terminal Content */}
            <div className="terminal-content">
                <div ref={constainerRef} className="terminal-container" />
            </div >
        </div >
    );
}
