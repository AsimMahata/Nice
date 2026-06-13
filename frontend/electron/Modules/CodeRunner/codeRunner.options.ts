
export type status = {
    success: boolean,
    output: string
    error: string
    runtimeError: string
    compilationError: string
}

export interface CodeRunnerParams {
    filePath: string,
    fileName: string,
    fileNameWithoutExt: string;
    fileExtension: string,
    directory: string,
    codeLang: string,
}

