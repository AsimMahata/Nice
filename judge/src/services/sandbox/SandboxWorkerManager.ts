import { SandboxWorker, WorkerState } from './SandboxWorker.js';
import { judgeConfig } from '../../config/judge.config.js';
import { logger } from '../../utils/logger.js';

export interface SandboxWorkerStats {
    total: number;
    available: number;
    busy: number;
    error: number;
}

export class SandboxWorkerManager {
    private workers: SandboxWorker[] = [];
    private log = logger.createScope('SandboxManager');

    constructor() {
        const count = judgeConfig.workers;
        this.log.info(`Initializing pool of ${count} sandbox execution workers (Memory limit: ${judgeConfig.workerMemoryMb}MB each)...`);
        for (let i = 1; i <= count; i++) {
            this.workers.push(new SandboxWorker(i));
        }
    }

    getAvailableWorker(): SandboxWorker | null {
        for (const worker of this.workers) {
            if (worker.isAvailable()) {
                return worker;
            }
        }
        return null;
    }

    getStats(): SandboxWorkerStats {
        let available = 0;
        let busy = 0;
        let error = 0;

        for (const w of this.workers) {
            const state: WorkerState = w.getState();
            if (state === 'IDLE') available++;
            else if (state === 'BUSY') busy++;
            else if (state === 'ERROR') error++;
        }

        return {
            total: this.workers.length,
            available,
            busy,
            error,
        };
    }
}

export const sandboxWorkerManager = new SandboxWorkerManager();
