import { CodeRunnerParams } from "./codeRunner.options";

export const LanguageRegistry: Record<string, string[]> = {
    cpp: [
        'cd "$dir"',
        'g++ "$fileName" -o "$fileNameWithoutExt"',
        '.\\$fileNameWithoutExt',
    ],

    c: [
        'cd "$dir"',
        'gcc "$fileName" -o "$fileNameWithoutExt"',
        '.\\$fileNameWithoutExt',
    ],

    python: [
        'cd "$dir"',
        'py -u "$fileName"',
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
    return steps
}
