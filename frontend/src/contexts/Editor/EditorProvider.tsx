import { ReactNode, useContext, useEffect, useRef, useState } from "react"
import EditorContext, { EditorState } from "./EditorContext"
import { FileInfo } from "../../services/FileSystem/file.options";
import { fileSystem } from "../../services/FileSystem/FileSystem";


const defaultEditorState: EditorState = {
    openedFiles: {},
    openedTabs: [],
    activeFile: null,
};

const EditorProvider = ({ children }: { children: ReactNode }) => {
    console.log("EditorProvider");
    const [codeLang, setCodeLang] = useState<string | null>(null);
    const [editorState, setEditorState] = useState<EditorState>(defaultEditorState);

    const buffersRef = useRef<Record<string, string>>({});
    const editorStateRef = useRef(editorState);

    useEffect(() => {
        editorStateRef.current = editorState;
    }, [editorState]);

    const getDirtyStatus = (): boolean => {
        return editorState.activeFile
            ? editorState.openedFiles[editorState.activeFile]?.isDirty ?? false
            : false;
    };

    const getCurrentFileName = (): string | null => {
        return editorState.activeFile
            ? editorState.openedFiles[editorState.activeFile]?.fileInfo.name ?? "ERROR"
            : "ERROR";
    };

    const getCurrentFileInfo = (): FileInfo | null => {
        const path = editorState.activeFile;

        if (!path) return null;

        return editorState.openedFiles[path]?.fileInfo ?? null;
    };

    async function openFile(file: FileInfo) {
        if (!file) {
            throw new Error("OPENFILE: Provide a valid file");
        }

        //already opened
        if (editorState.openedFiles[file.path]) {
            setEditorState(prev => ({
                ...prev,
                activeFile: file.path,
            }));
            return;
        }

        // file not open yet
        const content = await fileSystem.readFile(file.path);

        buffersRef.current[file.path] = content;

        setEditorState((prev) => ({
            ...prev,

            openedFiles: {
                ...prev.openedFiles,

                [file.path]: {
                    isDirty: false,
                    fileInfo: file,
                },
            },

            openedTabs: prev.openedTabs.includes(file.path)
                ? prev.openedTabs
                : [...prev.openedTabs, file.path],

            activeFile: file.path,
        }));
    }

    //BUG:: There is some bug with dirty status of the file
    async function saveActiveFile() {
        const path = editorStateRef.current.activeFile;
        if (!path) return false;

        const content = buffersRef.current[path];
        const success = await fileSystem.saveFile(path, content);

        if (success) {
            setEditorState(prev => ({
                ...prev,
                openedFiles: {
                    ...prev.openedFiles,
                    [path]: {
                        ...prev.openedFiles[path],
                        isDirty: false,
                    },
                },
            }));
        }

        return success;
    }

    return (
        <EditorContext.Provider
            value={{
                codeLang,
                setCodeLang,
                editorState,
                setEditorState,
                editorStateRef,
                getDirtyStatus,
                getCurrentFileName,
                getCurrentFileInfo,
                buffersRef,
                openFile,
                saveActiveFile
            }}
        >
            {children}
        </EditorContext.Provider>
    );
};

export default EditorProvider

export const useEditorContext = () => {
    const context = useContext(EditorContext);
    if (context === undefined) {
        throw new Error('EditorContext is not undefined !!');
    }
    return context;
}
