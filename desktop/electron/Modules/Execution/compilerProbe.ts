import { exec } from 'child_process';

const cache = new Map<string, boolean>();

function which(binary: string): Promise<boolean> {
    return new Promise((resolve) => {
        const cmd = process.platform === 'win32' ? `where ${binary}` : `which ${binary}`;
        exec(cmd, { timeout: 3000 }, (err) => {
            resolve(!err);
        });
    });
}

export async function isCompilerAvailable(language: string): Promise<boolean> {
    const lang = (language || '').toLowerCase().trim();
    if (cache.has(lang)) {
        return cache.get(lang)!;
    }

    let available = false;

    switch (lang) {
        case 'cpp':
        case 'c++':
        case 'cc':
        case 'cxx':
            available = await which('g++');
            if (!available) available = await which('clang++');
            break;

        case 'c':
            available = await which('gcc');
            if (!available) available = await which('clang');
            break;

        case 'python':
        case 'python3':
        case 'py': {
            available = await which('python3');
            if (!available) available = await which('python');
            if (!available) available = await which('py');
            break;
        }

        case 'java':
            available = await which('javac');
            break;

        case 'javascript':
        case 'js':
        case 'nodejs':
            available = await which('node');
            break;

        case 'typescript':
        case 'ts':
            available = await which('npx') || await which('tsc');
            break;

        default:
            available = false;
    }

    cache.set(lang, available);
    console.log(`[compilerProbe] ${lang}: ${available ? 'available' : 'not found'}`);
    return available;
}

export function clearProbeCache(): void {
    cache.clear();
}
