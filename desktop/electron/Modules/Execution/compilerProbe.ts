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
    if (cache.has(language)) {
        return cache.get(language)!;
    }

    let available = false;

    switch (language) {
        case 'cpp':
            available = await which('g++');
            break;

        case 'c':
            available = await which('gcc');
            break;

        case 'python': {
            available = await which('python3');
            if (!available) available = await which('python');
            break;
        }

        case 'java':
            available = await which('javac');
            break;

        default:
            available = false;
    }

    cache.set(language, available);
    console.log(`[compilerProbe] ${language}: ${available ? 'available' : 'not found'}`);
    return available;
}

export function clearProbeCache(): void {
    cache.clear();
}
