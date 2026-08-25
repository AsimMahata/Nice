import 'dotenv/config';
import express, { Express } from 'express';
import cors from 'cors';
import executeRoutes from './routes/execute.routes.js';
import healthRoutes from './routes/health.routes.js';
import { logger } from './utils/logger.js';
import { judgeService } from './services/JudgeService.js';
import { judgeConfig } from './config/judge.config.js';
import { dockerExecutor } from './services/docker/DockerExecutor.js';

const log = logger.createScope('Server');
const app: Express = express();
const PORT = judgeConfig.port;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// HTTP Request Logging Middleware
app.use((req, res, next) => {
    const startTime = Date.now();
    const { method, originalUrl } = req;

    res.on('finish', () => {
        const duration = Date.now() - startTime;
        const status = res.statusCode;
        if (status >= 500) {
            logger.error('HTTP', `${method} ${originalUrl} -> ${status} (${duration}ms)`);
        } else if (status >= 400) {
            logger.warn('HTTP', `${method} ${originalUrl} -> ${status} (${duration}ms)`);
        } else {
            logger.info('HTTP', `${method} ${originalUrl} -> ${status} (${duration}ms)`);
        }
    });

    next();
});

// Routes
app.use('/execute', executeRoutes);
app.use('/health', healthRoutes);

// Root route for service status
app.get('/', (_req, res) => {
    res.json({
        service: 'judge',
        status: 'running',
        provider: judgeConfig.executionProvider,
        onlineJudge: judgeConfig.onlineJudgeProvider,
        workers: judgeConfig.workers,
        workerMemoryMb: judgeConfig.workerMemoryMb,
        maxQueueSize: judgeConfig.maxQueueSize,
    });
});

const isMainModule = process.argv[1] && (process.argv[1].endsWith('server.ts') || process.argv[1].endsWith('server.js'));

if (isMainModule && process.env.NODE_ENV !== 'test') {
    const server = app.listen(PORT, () => {
        log.info(`Judge Service started on port ${PORT}`);
        log.info(`Execution Strategy: ${judgeConfig.executionProvider}`);
        log.info(`Worker Pool: ${judgeConfig.workers} workers (Memory: ${judgeConfig.workerMemoryMb}MB each, Max Queue: ${judgeConfig.maxQueueSize})`);
        log.info(`Online Judge Fallback: ${judgeConfig.onlineJudgeProvider}`);

        judgeService.init().catch((err) => {
            log.warn(`Service init warning: ${err.message}`);
        });
    });

    server.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
            log.error(`Port ${PORT} is already in use by another process.`);
            log.info(`To free port ${PORT}, run: Stop-Process -Id (Get-NetTCPConnection -LocalPort ${PORT}).OwningProcess -Force`);
        } else {
            log.error('Server error occurred:', err);
        }
        process.exit(1);
    });

    const shutdown = async () => {
        log.info('Graceful shutdown initiated. Cleaning up worker pool...');
        try {
            await dockerExecutor.getWorkerManager().destroyAll();
        } catch {
            // Ignore shutdown error
        }
        process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}

export { app };
