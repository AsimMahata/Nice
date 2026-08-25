import { ExecutionProvider, ExecutionRequest, ExecutionResult } from '../../types/execution.js';
import { WorkerManager, workerManager } from './WorkerManager.js';
import { ExecutionQueue } from '../queue/ExecutionQueue.js';

export class DockerExecutor implements ExecutionProvider {
    readonly name = 'DockerWorkerPool';
    private workerManager: WorkerManager;
    private queue: ExecutionQueue;

    constructor(manager: WorkerManager = workerManager) {
        this.workerManager = manager;
        this.queue = new ExecutionQueue(this.workerManager);
    }

    getQueue(): ExecutionQueue {
        return this.queue;
    }

    getWorkerManager(): WorkerManager {
        return this.workerManager;
    }

    async init(): Promise<boolean> {
        return this.workerManager.init();
    }

    async execute(request: ExecutionRequest): Promise<ExecutionResult> {
        // Enqueue to warm worker pool
        return this.queue.enqueue(request);
    }
}

export const dockerExecutor = new DockerExecutor();
