import { ExecutionRequest, ExecutionResult } from '../../types/execution.js';
import { WorkerManager } from '../docker/WorkerManager.js';
import { judgeConfig } from '../../config/judge.config.js';
import { logger } from '../../utils/logger.js';
import crypto from 'crypto';

interface QueuedJob {
    id: string;
    request: ExecutionRequest;
    resolve: (result: ExecutionResult) => void;
    reject: (err: any) => void;
    enqueuedAt: number;
}

export class ExecutionQueue {
    private queue: QueuedJob[] = [];
    private workerManager: WorkerManager;
    private isProcessing = false;
    private log = logger.createScope('ExecutionQueue');

    constructor(workerManager: WorkerManager) {
        this.workerManager = workerManager;
    }

    get size(): number {
        return this.queue.length;
    }

    get maxSize(): number {
        return judgeConfig.maxQueueSize;
    }

    getStats() {
        return {
            size: this.queue.length,
            maxSize: judgeConfig.maxQueueSize,
        };
    }

    async enqueue(request: ExecutionRequest): Promise<ExecutionResult> {
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
            const job: QueuedJob = {
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
            // All workers are currently busy; job will wait until next worker completes
            return;
        }

        const job = this.queue.shift();
        if (!job) return;

        const waitTime = Date.now() - job.enqueuedAt;
        this.log.info(`Assigning job ${job.id} to worker "${worker.containerName}" (Queued for ${waitTime}ms). Remaining queue: ${this.queue.length}`);

        try {
            const result = await worker.execute(job.request);

            if (worker.getState() === 'ERROR') {
                this.workerManager.recoverWorker(worker).catch((err) => {
                    this.log.error(`Background worker recovery error: ${err.message}`);
                });
            }

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
            // Trigger next queued job immediately
            setImmediate(() => this.processNext());
        }
    }
}
