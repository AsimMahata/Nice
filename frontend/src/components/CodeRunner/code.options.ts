import { FileInfo } from "../FileEx/FileActions";

export interface CodeRunnerParams {
    codeFile: FileInfo,
    codeLang: string | null,
    cwd: string | null
}
