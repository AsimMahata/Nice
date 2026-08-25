export interface JudgeConfig {
    port: number;
    workers: number;
    workerMemoryMb: number;
    workerCpus: number;
    workerPidsLimit: number;
    maxQueueSize: number;
    executionTimeoutMs: number;
    dockerImage: string;
    containerPrefix: string;
    executionProvider: 'docker' | 'auto' | 'online' | 'jdoodle';
    onlineJudgeProvider: string;
}

function parseNumber(envVal: string | undefined, defaultValue: number): number {
    if (!envVal) return defaultValue;
    const parsed = parseInt(envVal, 10);
    return isNaN(parsed) || parsed <= 0 ? defaultValue : parsed;
}

function parseFloatNumber(envVal: string | undefined, defaultValue: number): number {
    if (!envVal) return defaultValue;
    const parsed = parseFloat(envVal);
    return isNaN(parsed) || parsed <= 0 ? defaultValue : parsed;
}

export const judgeConfig: JudgeConfig = {
    port: parseNumber(process.env.PORT, 5001),
    workers: parseNumber(process.env.JUDGE_WORKERS, 2),
    workerMemoryMb: parseNumber(process.env.JUDGE_WORKER_MEMORY_MB, 100),
    workerCpus: parseFloatNumber(process.env.JUDGE_WORKER_CPUS, 1.0),
    workerPidsLimit: parseNumber(process.env.JUDGE_WORKER_PIDS_LIMIT, 128),
    maxQueueSize: parseNumber(process.env.JUDGE_MAX_QUEUE_SIZE, 20),
    executionTimeoutMs: parseNumber(process.env.JUDGE_EXECUTION_TIMEOUT_MS, 5000),
    dockerImage: process.env.JUDGE_DOCKER_IMAGE || 'nice-judge-runner:latest',
    containerPrefix: process.env.JUDGE_CONTAINER_PREFIX || 'nice-worker',
    executionProvider: (process.env.EXECUTION_PROVIDER || 'auto').toLowerCase() as any,
    onlineJudgeProvider: process.env.ONLINE_JUDGE_PROVIDER || 'jdoodle',
};
