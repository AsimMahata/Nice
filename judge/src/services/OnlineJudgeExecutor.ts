import { ExecutionProvider, ExecutionRequest, ExecutionResult } from '../types/execution.js';
import { JDoodleExecutor } from './JDoodleExecutor.js';

export class OnlineJudgeExecutor implements ExecutionProvider {
    readonly name = 'OnlineJudge';
    private provider: ExecutionProvider;

    constructor() {
        this.provider = new JDoodleExecutor();
    }

    async execute(request: ExecutionRequest): Promise<ExecutionResult> {
        return this.provider.execute(request);
    }
}
