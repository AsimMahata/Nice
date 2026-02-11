import { useEffect, useRef, useState } from 'react';
import './TerminalPanel.css';
import { terminalManager } from './terminal.manager';
import { Tab } from './terminal.options';

type Props = {
    onResize?: (cols: number, rows: number) => void,
    setTerminal: React.Dispatch<React.SetStateAction<boolean>>,
};
export function TerminalPanel({ }: Props) {
    //constexts
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
        terminalManager.mount(constainerRef.current)
        return () => {
            terminalManager.unmount()
        }
    }, [])

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
                <div ref={constainerRef} className="terminal-container" />
            </div >
        </div >
    );
}
