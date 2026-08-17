import { ISandboxExecutor } from './ISandboxExecutor.js';
import { IsolyxSandbox } from './IsolyxSandbox.js';
import { DockerSandbox } from './DockerSandbox.js';

let cachedExecutor: ISandboxExecutor | null | undefined = undefined;

export async function createSandboxExecutor(): Promise<ISandboxExecutor | null> {
    if (cachedExecutor !== undefined) {
        return cachedExecutor;
    }

    const candidates: ISandboxExecutor[] = [
        new IsolyxSandbox(),
        new DockerSandbox(),
    ];

    for (const candidate of candidates) {
        try {
            const available = await candidate.isAvailable();
            if (available) {
                console.log(`[SandboxFactory] Using sandbox: ${candidate.name}`);
                cachedExecutor = candidate;
                return cachedExecutor;
            } else {
                console.log(`[SandboxFactory] Sandbox not available: ${candidate.name}`);
            }
        } catch (err) {
            console.error(`[SandboxFactory] Error probing ${candidate.name}:`, err);
        }
    }

    console.warn('[SandboxFactory] No sandbox available. Backend execution will return Sandbox Error.');
    cachedExecutor = null;
    return null;
}

export function getSandboxExecutor(): ISandboxExecutor | null {
    if (cachedExecutor === undefined) {
        console.error('[SandboxFactory] getSandboxExecutor() called before initialization');
        return null;
    }
    return cachedExecutor;
}

export function resetSandboxCache(): void {
    cachedExecutor = undefined;
}
