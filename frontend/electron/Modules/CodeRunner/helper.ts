import path from "path"
import { FileInfo } from "../FileSystem/FileActions"
import { CodeRunnerParams } from "./codeRunner.options"

// FileInfo --> extract , Lang, FileName,FileExt, Directory

export function getCodeLanguage(extension: string) {
    switch (extension) {
        case ".cpp":
            return "cpp";

        case ".c":
            return "c";

        case ".py":
            return "python";

        case ".java":
            return "java";

        default:
            return null;
    }
}

export async function extractMetadata(codeFile: FileInfo) {
    const lang = getCodeLanguage(codeFile.extension)
    if (!lang) {
        throw new Error('this language has not been implemented yet')
    }

    const parsed = path.parse(codeFile.path);

    const result: CodeRunnerParams = {
        filePath: codeFile.path,
        fileName: parsed.base,
        fileNameWithoutExt: parsed.name,
        fileExtension: parsed.ext,
        directory: parsed.dir,
        codeLang: lang
    }
    return result;
}


