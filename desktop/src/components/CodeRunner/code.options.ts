import { FileInfo } from "../../services/FileSystem/file.options";

export interface CodeRunnerParams {
    codeFile: FileInfo,
    codeLang: string | null,
    cwd: string | null
}
