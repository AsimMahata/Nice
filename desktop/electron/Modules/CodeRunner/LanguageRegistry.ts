import { CodeRunnerParams } from "./codeRunner.options";

const isWin = process.platform === 'win32';

export const LanguageRegistry: Record<string, string[]> = {
    cpp: [
        'cd "$dir"',
        'g++ "$fileName" -o "$fileNameWithoutExt"',
        isWin ? '.\\$fileNameWithoutExt' : './$fileNameWithoutExt',
    ],

    c: [
        'cd "$dir"',
        'gcc "$fileName" -o "$fileNameWithoutExt"',
        isWin ? '.\\$fileNameWithoutExt' : './$fileNameWithoutExt',
    ],

    python: [
        'cd "$dir"',
        isWin ? 'python -u "$fileName"' : 'python3 -u "$fileName"',
    ],

    java: [
        'cd "$dir"',
        'javac "$fileName"',
        'java "$fileNameWithoutExt"',
    ],
};

export function getStepsToRun(metadata: CodeRunnerParams): string[] {
    const steps: string[] | undefined = LanguageRegistry[metadata.codeLang];
    if (!steps) {
        throw new Error(
            `Language '${metadata.codeLang}' is not supported`,
        );
    }
    return steps;
}
