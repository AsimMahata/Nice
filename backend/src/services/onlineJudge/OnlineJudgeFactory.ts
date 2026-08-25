import { IOnlineCompilerProvider } from './IOnlineCompilerProvider.js';
import { JDoodleProvider } from './JDoodleProvider.js';

const providers: Record<string, () => IOnlineCompilerProvider> = {
    'jdoodle': () => new JDoodleProvider(),
};

export function getOnlineJudgeProvider(providerName?: string): IOnlineCompilerProvider {
    const selected = (providerName || process.env.ONLINE_JUDGE_PROVIDER || 'jdoodle').toLowerCase();
    const providerFactory = providers[selected];

    if (providerFactory) {
        return providerFactory();
    }

    console.warn(`[OnlineJudgeFactory] Unknown provider '${selected}', falling back to default 'jdoodle'`);
    return new JDoodleProvider();
}

export function registerOnlineJudgeProvider(name: string, factory: () => IOnlineCompilerProvider): void {
    providers[name.toLowerCase()] = factory;
}
