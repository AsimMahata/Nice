import {
  FolderIcon,
  Search,
  Github,
  Terminal as TERMLOGO,
  Settings,
  User,
  X,
  Command,
  VenetianMask,
} from "lucide-react";
import CodeEditor from "../../components/CodeEditor/CodeEditor";
import FileEx from "../../components/FileEx/FileEx";
import { getPlaceholder } from "../../utils/getPlaceholder";
import { useMemo, useEffect, useState } from "react";
import { FileInfo } from "../../components/FileEx/FileActions";

import "./Home.css"; // Import the new CSS file
import PickDir from "../../components/FileEx/PickDir";
import UserDetails from "../../components/User/UserDetails";
import { Group, Panel, Separator } from "react-resizable-panels";
import { TerminalPanel } from "../../components/Terminal/TerminalPanel";

import { useFileActions } from "../../components/FileEx/FileActions";
import { useToast } from "../../utils/Toast";
import { useSocket } from "../../utils/useSocket";

function Home() {
  const [terminal, setTerminal] = useState<boolean>(false); // this tells if terminal is available or active
  const [sidePanel, setSidePanle] = useState<boolean>(false); // is side panel visible or not
  const [currentActivity, setCurrentActivity] = useState<string | null>(
    "file-ex",
  ); // what is the current active button on side panel
  const [lang, setLang] = useState<string | null>("cpp");
  const [codeFile, setCodeFile] = useState<FileInfo | null>(null);
  const [savingCode, setSavingCode] = useState<boolean>(false);
  const [mainDir, setMainDir] = useState<string | null>(null);
  const [asim, _setAsim] = useState(true);

  const placeholder = useMemo(() => getPlaceholder(lang || ""), [lang]);
  const [code, setCode] = useState<string>(placeholder);

  const handleActivityClickEvent = (name: string) => {
    if (!name) setSidePanle(false);
    if (currentActivity == name) {
      console.log(
        "frontend/home/handleActivityClickEvent/ to check its already active ",
      );
      setSidePanle((p) => !p);
      return;
    }
    setCurrentActivity(name);
    setSidePanle(true);
    console.log("current active section in frontend home ", name);
  };
  const ActivityIcon = ({ name, icon }: any) => (
    <div
      className={`activity-icon-btn ${currentActivity == name ? "active" : ""}`}
      onClick={() => handleActivityClickEvent(name)}>
      {icon}
    </div>
  );

  const Tab = ({ name, active = false }: any) => (
    <div className={`tab-item ${active ? "active" : ""}`}>
      <span>{name}</span>
      {active && <X size={14} className="close-icon" />}
    </div>
  );

  function getCorrectActivitybar() {
    switch (currentActivity) {
      case "FileEx":
        return (
          <FileEx
            codeFile={codeFile}
            setCodeFile={setCodeFile}
            code={code}
            setCode={setCode}
            savingCode={savingCode}
            setSavingCode={setSavingCode}
            mainDir={mainDir}
            setMainDir={setMainDir}
            FileActions={FileActions}
          />
        );
      case "Search":
        return <div> Search</div>;
      case "Github":
        return <div> Github</div>;
      case "CodeAction":
        return <div> CodeAction </div>;
      case "User":
        return <UserDetails />;
      case "Settings":
        return <div> Settings</div>;
      default:
        return null;
    }
  }
  useEffect(() => {
    if (code !== placeholder) setCode(placeholder);
  }, [lang]);

  useEffect(() => {
    if (asim) setMainDir(import.meta.env.VITE_TESTING_FOLDER);
  }, []);

  useEffect(() => {
    async function setFileType() {
      const extension = codeFile?.extension || "";
      const map: Record<string, string> = {
        ".cpp": "cpp",
        ".py": "python",
        ".java": "java",
        ".c": "c",
      };

      setLang(map[extension] ?? "plaintext");
    }
    setFileType();
  }, [codeFile]);

  // terminal cleanup from backend
  useEffect(() => {
    if (terminal) {
      console.log("entered but returned from use useEffect in shell");
      return;
    }
    (async () => {
      try {
        await window.pty?.destroy();
        console.log("destroyed terminal from backend succesfully");
      } catch (err) {
        console.error("something error occured to destroy pty from backend");
      }
    })();
  }, [terminal]);

  useEffect(() => {
    if (code !== placeholder) {
      setCode(placeholder);
    }
  }, [lang]);

  const Toast = useToast();
  const FileActions = useFileActions({
    showToast: Toast.showToast,
    setCode,
  });

  const socket = useSocket();

  const handleCPHProblem = async (data: any) => {
    const formattedName = data.name
      .replace(/[.\s]/g, "_") // Replaces '.' and ' ' with '_'
      .replace(/_+/g, "_") // Collapses consecutive '_' into one
      .replace(/^_|_$/g, ""); // Removes leading/trailing underscores

    const filename = `${formattedName}.cpp`;
    try {
      await FileActions.createNewFiles(filename);
      console.log(FileActions.currentPath);
      // FileActions.setCurrentPath()
      // need to open file and than set lang so that it loads placeholder by useEffect
    } catch (error) {
      console.log(error);
    }
    console.log("created file and now ......");
  };

  useEffect(() => {
    socket.on("cph_problem", (data: any) => {
      console.log("New Problem:", data.name);
      handleCPHProblem(data);
    });
    return () => {
      socket.off("cph_problem");
    };
  }, [FileActions]);

  console.log(FileActions.currentPath);

  return (
    <div className="ide-container">
      <header className="ide-header">
        <div className="header-left">
          <div className="logo-section">
            <VenetianMask size={18} strokeWidth={2.5} />
            <span className="logo-text">Nice</span>
          </div>
          <nav className="nav-menu">
            <PickDir text="Project" mainDir={mainDir} setMainDir={setMainDir} />
            {["Edit", "View"].map((m) => (
              <span key={m} className="nav-link">
                {m}
              </span>
            ))}
            <span
              className="nav-link OpenTerminal"
              onClick={() => setTerminal(true)}>
              Terminal
            </span>
            <span
              className="nav-link OpenTerminal"
              onClick={() => setTerminal(false)}>
              Close
            </span>
            <span className="currentProgrammingLang">{lang}</span>
          </nav>
        </div>

        <div className="search-wrapper">
          <Command size={14} className="search-icon" color="#585b70" />
          <input className="search-input" placeholder="Quick search..." />
        </div>
        <div style={{ width: "80px" }} />
      </header>

      <div className="main-body">
        <aside className="activity-bar">
          <div className="icon-stack">
            <ActivityIcon name={"FileEx"} icon={<FolderIcon size={22} />} />
            <ActivityIcon name={"Search"} icon={<Search size={22} />} />
            <ActivityIcon name={"Github"} icon={<Github size={22} />} />
            <ActivityIcon name={"CodeAction"} icon={<TERMLOGO size={22} />} />
          </div>
          <div className="icon-stack">
            <ActivityIcon name={"User"} icon={<User size={22} />} />
            <ActivityIcon name={"Settings"} icon={<Settings size={22} />} />
          </div>
        </aside>
        <div
          className="current-activity"
          style={{ display: (sidePanel ? "block" : "none"), minWidth: "40vh" }}>
          {getCorrectActivitybar()}
        </div>

                <main className="editor-container">
                    <div className="tab-bar">
                        <Tab name="Current" active />
                    </div>
                    <Group orientation='vertical'>
                        <Panel>
                            <CodeEditor key={lang} code={code} setCode={setCode} lang={lang} />
                        </Panel>
                        <Separator className="resize-handle" />
                        {
                            <Panel id="terminal" defaultSize={40} minSize={10}>
                                {terminal &&
                                    <TerminalPanel mainDir={mainDir} setTerminal={setTerminal} />
                                }
                            </Panel>
                        }
                    </Group>
                </main>
            </div>
        </div>
    );
}

export default Home;
