import { ExecutionProvider, ExecutionRequest, ExecutionResult } from '../types/execution.js';
import { DockerExecutor, dockerExecutor } from './docker/DockerExecutor.js';
import { OnlineJudgeExecutor } from './OnlineJudgeExecutor.js';
import { logger } from '../utils/logger.js';
import { judgeConfig } from '../config/judge.config.js';

const log = logger.createScope('JudgeService');

export class JudgeService {
    private dockerProvider: DockerExecutor;
    private onlineJudgeProvider: ExecutionProvider;
    private explicitProvider?: ExecutionProvider;
    private isInitialized = false;

    constructor(
        provider?: ExecutionProvider,
        dockerExec: DockerExecutor = dockerExecutor
    ) {
        this.dockerProvider = dockerExec;
        this.onlineJudgeProvider = new OnlineJudgeExecutor();
        this.explicitProvider = provider;
    }

    async init(): Promise<void> {
        if (this.isInitialized) return;
        this.isInitialized = true;

        if (judgeConfig.executionProvider === 'docker' || judgeConfig.executionProvider === 'auto') {
            log.info('Initializing Docker execution environment...');
            await this.dockerProvider.init();
        }
    }

    setProvider(provider: ExecutionProvider): void {
        this.explicitProvider = provider;
    }

    getProviderName(): string {
        return this.explicitProvider?.name || judgeConfig.executionProvider || 'auto';
    }

    getHealthStats() {
        const workerStats = this.dockerProvider.getWorkerManager().getStats();
        const queueStats = this.dockerProvider.getQueue().getStats();

        return {
            status: 'ok',
            workers: {
                total: workerStats.total,
                available: workerStats.available,
                busy: workerStats.busy,
            },
            queue: {
                size: queueStats.size,
                maxSize: queueStats.maxSize,
            },
            dockerAvailable: workerStats.isDockerAvailable,
        };
    }

    async execute(request: ExecutionRequest): Promise<ExecutionResult> {
        if (!request.language || typeof request.language !== 'string' || request.language.trim() === '') {
            return {
                status: 'failed',
                stdout: '',
                stderr: null,
                exception: null,
                error: 'Language must be a non-empty string',
            };
        }

        if (typeof request.source !== 'string' || request.source.trim() === '') {
            return {
                status: 'failed',
                stdout: '',
                stderr: null,
                exception: null,
                error: 'Source code must be a non-empty string',
            };
        }

        const normalizedRequest: ExecutionRequest = {
            language: request.language.trim(),
            source: request.source,
            stdin: typeof request.stdin === 'string' ? request.stdin : '',
        };

        if (this.explicitProvider) {
            log.info(`Executing with explicit provider: ${this.explicitProvider.name}`);
            return this.explicitProvider.execute(normalizedRequest);
        }

        const mode: string = judgeConfig.executionProvider;

        if (mode === 'online' || mode === 'jdoodle') {
            log.info(`Execution mode "${mode}" selected: routing directly to Online Judge.`);
            return this.onlineJudgeProvider.execute(normalizedRequest);
        }

        if (mode === 'docker') {
            log.info('Execution mode "docker" selected: routing to Docker Worker Pool.');
            return this.dockerProvider.execute(normalizedRequest);
        }

        // 'auto' mode: Prioritize warm Docker Worker Pool; fallback to Online Judge if Docker is unavailable
        const isDockerReady = this.dockerProvider.getWorkerManager().getDockerAvailable();

        if (isDockerReady) {
            log.info('Execution mode "auto": dispatching to warm Docker Worker Pool.');
            const result = await this.dockerProvider.execute(normalizedRequest);

            // If the queue was full or job completed, return result directly
            if (result.error === 'Judge queue full') {
                return result;
            }

            // If Docker failed catastrophically with a system-level error, try online fallback
            const isSystemError = result.error?.includes('Worker execution error') || result.error?.includes('daemon not accessible');
            if (isSystemError) {
                log.warn(`Docker execution failed with system error (${result.error}), falling back to Online Judge.`);
                return this.onlineJudgeProvider.execute(normalizedRequest);
            }

            return result;
        }

        // If Docker is not available in auto mode, use online judge
        log.info('Docker pool is not available on this environment, routing to Online Judge (JDoodle).');
        return this.onlineJudgeProvider.execute(normalizedRequest);
    }
}

export const judgeService = new JudgeService();
