import React from 'react';
import {
    FolderIcon, Search, Github, Terminal,
    Settings, User, X, ChevronRight, ChevronDown,
    Code2, Coffee, Command
} from 'lucide-react';

const MainLayout = () => {
    return (
        // Base Background - Added p-2 and gap-3 to prevent "chopped" edges
        <div className="h-screen w-full flex flex-col bg-[#11111b] text-[#cdd6f4] text-[13px] font-sans overflow-hidden select-none p-2 gap-3">

            {/* Header */}
            <header className="h-12 flex items-center justify-between px-6 bg-[#181825] rounded-xl border border-[#313244]/50 shrink-0">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-2 text-[#fab387]">
                        <Coffee size={18} strokeWidth={2.5} />
                        <span className="font-bold tracking-tight text-white uppercase text-xs">
                            Mocha
                        </span>
                    </div>

                    <nav className="flex items-center gap-5 text-[#a6adc8]">
                        {["Project", "Edit", "View", "Tools"].map(m => (
                            <span
                                key={m}
                                className="hover:text-[#89b4fa] cursor-pointer transition-colors text-[12px] font-medium"
                            >
                                {m}
                            </span>
                        ))}
                    </nav>
                </div>

                <div className="flex items-center bg-[#11111b] border border-[#313244] rounded-lg px-3 w-[380px] h-8 focus-within:border-[#89b4fa] transition-all">
                    <Command size={14} className="text-[#585b70]" />
                    <input
                        className="flex-1 bg-transparent px-2 text-xs outline-none text-[#cdd6f4] placeholder-[#585b70]"
                        placeholder="Quick search..."
                    />
                </div>

                <div className="w-20" />
            </header>

            {/* Main Body Container */}
            <div className="flex flex-1 gap-3 overflow-hidden">

                {/* Activity Bar */}
                <aside className="w-[60px] bg-[#181825] flex flex-col justify-between items-center py-6 rounded-xl border border-[#313244]/50 shrink-0">
                    <div className="flex flex-col items-center gap-5">
                        <ActivityIcon icon={<FolderIcon size={22} />} active />
                        <ActivityIcon icon={<Search size={22} />} />
                        <ActivityIcon icon={<Github size={22} />} />
                        <ActivityIcon icon={<Terminal size={22} />} />
                    </div>

                    <div className="flex flex-col items-center gap-4">
                        <ActivityIcon icon={<User size={22} />} />
                        <ActivityIcon icon={<Settings size={22} />} />
                    </div>
                </aside>

                {/* Sidebar - Added padding to prevent the 'chopped' look of items */}
                <nav className="w-[280px] bg-[#181825] flex flex-col rounded-xl border border-[#313244] overflow-hidden">
                    <div className="h-12 px-5 flex items-center text-[10px] font-black tracking-[0.2em] text-[#6c7086] uppercase border-b border-[#313244]/30">
                        Explorer
                    </div>

                    <div className="p-2 space-y-4 overflow-y-auto">
                        <SidebarSection title="Source" isOpen>
                            <FileItem name="MainLayout.tsx" active />
                            <FileItem name="Dashboard.ts" />
                            <FileItem name="styles.css" />
                        </SidebarSection>

                        <SidebarSection title="Assets" isOpen={false}>
                            <FileItem name="logo.svg" />
                        </SidebarSection>
                    </div>
                </nav>

                {/* Editor Area */}
                <main className="flex-1 flex flex-col min-w-0 bg-[#1e1e2e] rounded-xl border border-[#313244] overflow-hidden">

                    {/* Tabs */}
                    <div className="h-12 bg-[#181825] flex items-center px-3 gap-2 border-b border-[#313244]">
                        <Tab name="MainLayout.tsx" active />
                        <Tab name="Dashboard.ts" />
                    </div>

                    {/* Editor Content */}
                    <div className="flex-1 flex overflow-hidden font-mono">
                        {/* Line Numbers */}
                        <div className="w-14 bg-[#1e1e2e] text-[#45475a] text-right pr-4 pt-6 text-[12px] select-none border-r border-[#313244]/30">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                                <div key={n} className="leading-7">{n}</div>
                            ))}
                        </div>

                        {/* Text Area - Added px-6 for better breathability */}
                        <textarea
                            className="flex-1 bg-transparent pt-6 px-6 outline-none resize-none text-[14px] leading-7 text-[#cdd6f4] placeholder-[#45475a]"
                            defaultValue={`// Clean Mocha Layout Fixed
export const Layout = () => {
  const user = "Guest";
  return (
    <div className="p-4">
      <h1>Welcome, {user}</h1>
    </div>
  );
};`}
                            spellCheck={false}
                        />
                    </div>
                </main>
            </div>
        </div>
    );
};

/* --- Sub-Components --- */

const ActivityIcon = ({ icon, active = false }: any) => (
    <div className={`w-10 h-10 flex items-center justify-center cursor-pointer rounded-xl transition-all
        ${active
            ? 'bg-[#313244] text-[#89b4fa] shadow-inner'
            : 'text-[#6c7086] hover:bg-[#313244] hover:text-[#cdd6f4]'
        }`}>
        {icon}
    </div>
);

const SidebarSection = ({ title, isOpen, children }: any) => (
    <div className="flex flex-col">
        <div className="h-8 flex items-center px-3 font-bold text-[10px] cursor-pointer text-[#585b70] hover:text-[#a6adc8] uppercase tracking-wider">
            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span className="ml-2">{title}</span>
        </div>
        {isOpen && <div className="flex flex-col gap-1 mt-1">{children}</div>}
    </div>
);

const FileItem = ({ name, active = false }: any) => (
    <div className={`mx-1 px-3 py-2 rounded-lg flex items-center gap-3 cursor-pointer transition-all
        ${active
            ? 'bg-[#89b4fa] text-[#11111b] font-semibold'
            : 'text-[#a6adc8] hover:bg-[#313244]/50'
        }`}>
        <Code2 size={16} opacity={active ? 1 : 0.6} />
        <span className="truncate">{name}</span>
    </div>
);

const Tab = ({ name, active = false }: any) => (
    <div className={`h-9 px-4 flex items-center gap-3 rounded-lg cursor-pointer transition-all text-[12px]
        ${active
            ? 'bg-[#1e1e2e] text-[#89b4fa] border border-[#313244] shadow-sm'
            : 'text-[#6c7086] hover:bg-[#313244]/50'
        }`}>
        <span>{name}</span>
        {active && <X size={14} className="hover:text-[#f38ba8] transition-colors" />}
    </div>
);

export default MainLayout;
