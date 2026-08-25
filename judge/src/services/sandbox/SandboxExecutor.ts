import { ExecutionProvider, ExecutionRequest, ExecutionResult } from '../../types/execution.js';
import { SandboxWorkerManager, sandboxWorkerManager } from './SandboxWorkerManager.js';
import { judgeConfig } from '../../config/judge.config.js';
import { logger } from '../../utils/logger.js';
import crypto from 'crypto';

interface QueuedSandboxJob {
    id: string;
    request: ExecutionRequest;
    resolve: (result: ExecutionResult) => void;
    reject: (err: any) => void;
    enqueuedAt: number;
}

export class SandboxExecutor implements ExecutionProvider {
    readonly name = 'SandboxWorkerPool';
    private workerManager: SandboxWorkerManager;
    private queue: QueuedSandboxJob[] = [];
    private log = logger.createScope('SandboxExecutor');

    constructor(manager: SandboxWorkerManager = sandboxWorkerManager) {
        this.workerManager = manager;
    }

    getWorkerManager(): SandboxWorkerManager {
        return this.workerManager;
    }

    getQueueStats() {
        return {
            size: this.queue.length,
            maxSize: judgeConfig.maxQueueSize,
        };
    }

    async execute(request: ExecutionRequest): Promise<ExecutionResult> {
        if (this.queue.length >= judgeConfig.maxQueueSize) {
            this.log.warn(`Queue limit reached (${this.queue.length}/${judgeConfig.maxQueueSize}). Rejecting request.`);
            return {
                status: 'failed',
                stdout: '',
                stderr: null,
                exception: null,
                error: 'Judge queue full',
            };
        }

        return new Promise<ExecutionResult>((resolve, reject) => {
            const job: QueuedSandboxJob = {
                id: `job_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
                request,
                resolve,
                reject,
                enqueuedAt: Date.now(),
            };

            this.queue.push(job);
            this.log.info(`Job enqueued (${job.id}, lang=${request.language}). Queue depth: ${this.queue.length}/${judgeConfig.maxQueueSize}`);
            this.processNext();
        });
    }

    private async processNext(): Promise<void> {
        if (this.queue.length === 0) {
            return;
        }

        const worker = this.workerManager.getAvailableWorker();
        if (!worker) {
            return;
        }

        const job = this.queue.shift();
        if (!job) return;

        const waitTime = Date.now() - job.enqueuedAt;
        this.log.info(`Assigning job ${job.id} to Sandbox Worker-${worker.id} (Queued for ${waitTime}ms). Remaining queue: ${this.queue.length}`);

        try {
            const result = await worker.execute(job.request);
            job.resolve(result);
        } catch (err: any) {
            this.log.error(`Error processing job ${job.id}: ${err.message}`);
            job.resolve({
                status: 'failed',
                stdout: '',
                stderr: null,
                exception: null,
                error: `Execution error: ${err.message}`,
            });
        } finally {
            setImmediate(() => this.processNext());
        }
    }
}

export const sandboxExecutor = new SandboxExecutor();
