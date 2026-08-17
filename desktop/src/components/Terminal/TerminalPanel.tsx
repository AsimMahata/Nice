import { useEffect, useRef, useState } from 'react';
import { Terminal as TerminalIcon, Plus, X } from 'lucide-react';
import './TerminalPanel.css';
import { terminalManager } from './terminal.manager';
import { Tab } from './terminal.options';
import { useWorkspaceContext } from '../../contexts/Workspace/WorkspaceProvider';
import "@xterm/xterm/css/xterm.css";

type Props = {
    terminal: boolean;
    setTerminal: React.Dispatch<React.SetStateAction<boolean>>;
};

export function TerminalPanel({ terminal, setTerminal }: Props) {
    const { cwd } = useWorkspaceContext();
    const constainerRef = useRef<HTMLDivElement>(null);
    const [tabs, _setTabs] = useState<Tab[]>([
        { id: '1', name: 'bash', active: true },
    ]);

    const [activeTab, _setActiveTab] = useState();

    const handleNewTerminal = () => {
        console.log('new terminal handled');
    };

    const handleCloseTab = (id: string) => {
        console.log('handle close tab', id);
    };

    const handleSelectTab = (id: string) => {
        console.log('handleSelectTab', id);
    };

    useEffect(() => {
        if (!constainerRef.current) return;
        if (!cwd) {
            console.log('first select a working directory first');
            return;
        }
        terminalManager.mount(constainerRef.current, cwd);
        console.log('created a terminal -----------------');
    }, [terminal]);

    useEffect(() => {
        if (terminal) {
            return;
        }
        console.log('unmounting the terminal----------------');
        terminalManager.unmount();
    }, [terminal]);

    if (!terminal) return null;

    return (
        <div className="terminal-panel">
            {/* Terminal Header */}
            <div className="terminal-header">
                <div className="terminal-tabs">
                    {tabs.map((tab) => (
                        <div
                            key={tab.id}
                            className={`terminal-tab ${activeTab === tab.id || true ? 'active' : ''}`}
                            onClick={() => handleSelectTab(tab.id)}
                        >
                            <TerminalIcon size={13} style={{ color: "var(--accent-light)" }} />
                            <span className="terminal-tab-name">{tab.name}</span>
                            <button
                                className="terminal-tab-close"
                                title="Close Terminal Tab"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleCloseTab(tab.id);
                                }}
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                    <button className="terminal-new-tab" onClick={handleNewTerminal} title="New Terminal">
                        <Plus size={14} />
                    </button>
                </div>
                <div className="terminal-actions">
                    <button onClick={() => setTerminal(false)} className="terminal-action" title="Close Panel">
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* Terminal Content */}
            <div className="terminal-content">
                <div ref={constainerRef} className="terminal-container" />
            </div>
        </div>
    );
}
