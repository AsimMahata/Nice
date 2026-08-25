import { DockerWorker, WorkerState } from './DockerWorker.js';
import { judgeConfig } from '../../config/judge.config.js';
import { logger } from '../../utils/logger.js';
import { spawn } from 'child_process';

export interface WorkerPoolStats {
    total: number;
    available: number;
    busy: number;
    starting: number;
    error: number;
    isDockerAvailable: boolean;
}

export class WorkerManager {
    private workers: DockerWorker[] = [];
    private isInitialized = false;
    private isDockerAvailable = false;
    private log = logger.createScope('WorkerManager');

    constructor() {
        const count = judgeConfig.workers;
        for (let i = 1; i <= count; i++) {
            this.workers.push(new DockerWorker(i));
        }
    }

    private checkDockerDaemon(): Promise<boolean> {
        return new Promise((resolve) => {
            const child = spawn('docker', ['info'], {
                stdio: ['ignore', 'ignore', 'ignore'],
                windowsHide: true,
            });

            const timer = setTimeout(() => {
                child.kill('SIGKILL');
                resolve(false);
            }, 5000);

            child.on('error', () => {
                clearTimeout(timer);
                resolve(false);
            });

            child.on('close', (code) => {
                clearTimeout(timer);
                resolve(code === 0);
            });
        });
    }

    async init(): Promise<boolean> {
        if (this.isInitialized) return this.isDockerAvailable;
        this.isInitialized = true;

        // Quick check if Docker daemon is running and accessible
        const daemonRunning = await this.checkDockerDaemon();
        if (!daemonRunning) {
            this.isDockerAvailable = false;
            this.log.info('Docker daemon is not accessible in this environment (e.g. Render / Cloud PaaS). Fallback to Online Judge (JDoodle) is active.');
            return false;
        }

        this.log.info(`Docker daemon accessible. Initializing pool of ${judgeConfig.workers} warm Docker workers (Memory: ${judgeConfig.workerMemoryMb}MB each)...`);

        try {
            const results = await Promise.all(this.workers.map((w) => w.init()));
            const readyCount = results.filter(Boolean).length;

            if (readyCount > 0) {
                this.isDockerAvailable = true;
                this.log.info(`Worker pool initialized: ${readyCount}/${this.workers.length} workers ready.`);
                return true;
            } else {
                this.isDockerAvailable = false;
                this.log.warn('Docker worker containers could not be initialized. Fallback to Online Judge is active.');
                return false;
            }
        } catch (err: any) {
            this.isDockerAvailable = false;
            this.log.warn(`Worker initialization failed (${err.message}). Docker pool is disabled.`);
            return false;
        }
    }

    getDockerAvailable(): boolean {
        return this.isDockerAvailable;
    }

    getAvailableWorker(): DockerWorker | null {
        for (const worker of this.workers) {
            if (worker.isAvailable()) {
                return worker;
            }
        }
        return null;
    }

    async recoverWorker(worker: DockerWorker): Promise<boolean> {
        this.log.warn(`Recovering crashed worker ${worker.containerName}...`);
        try {
            await worker.destroy();
            const success = await worker.init();
            if (success) {
                this.log.info(`Worker ${worker.containerName} successfully recovered and ready.`);
            } else {
                this.log.error(`Worker ${worker.containerName} failed to recover.`);
            }
            return success;
        } catch (err: any) {
            this.log.error(`Error during recovery of ${worker.containerName}: ${err.message}`);
            return false;
        }
    }

    getStats(): WorkerPoolStats {
        let available = 0;
        let busy = 0;
        let starting = 0;
        let error = 0;

        for (const w of this.workers) {
            const state: WorkerState = w.getState();
            if (state === 'IDLE') available++;
            else if (state === 'BUSY') busy++;
            else if (state === 'STARTING') starting++;
            else if (state === 'ERROR' || state === 'STOPPED') error++;
        }

        return {
            total: this.workers.length,
            available,
            busy,
            starting,
            error,
            isDockerAvailable: this.isDockerAvailable,
        };
    }

    async destroyAll(): Promise<void> {
        if (!this.isDockerAvailable) return;
        this.log.info('Shutting down all Docker worker containers...');
        await Promise.all(this.workers.map((w) => w.destroy().catch(() => {})));
        this.isInitialized = false;
    }
}

export const workerManager = new WorkerManager();
