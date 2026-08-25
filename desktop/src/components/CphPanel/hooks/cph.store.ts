import { TestCase } from "../CphTestCaseCard";

export interface CphFileExecutionState {
    compiling: boolean;
    running: boolean;
    tests: TestCase[];
    problemName: string;
    timeLimit: number;
    compilationError: string | null;
}

class CphStore {
    private states = new Map<string, CphFileExecutionState>();
    private listeners = new Set<(filePath: string) => void>();

    getState(filePath: string): CphFileExecutionState | undefined {
        return this.states.get(filePath);
    }

    setState(filePath: string, update: Partial<CphFileExecutionState>) {
        const current = this.states.get(filePath) || {
            compiling: false,
            running: false,
            tests: [],
            problemName: "",
            timeLimit: 2000,
            compilationError: null,
        };
        const updated: CphFileExecutionState = { ...current, ...update };
        this.states.set(filePath, updated);
        this.notify(filePath);
    }

    isAnyRunning(): boolean {
        for (const s of this.states.values()) {
            if (s.compiling || s.running) return true;
        }
        return false;
    }

    isFileRunning(filePath: string): boolean {
        const s = this.states.get(filePath);
        return Boolean(s && (s.compiling || s.running));
    }

    subscribe(listener: (filePath: string) => void) {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    private notify(filePath: string) {
        this.listeners.forEach((listener) => {
            try {
                listener(filePath);
            } catch (err) {
                console.error("[CphStore] Listener error:", err);
            }
        });
    }
}

export const cphStore = new CphStore();
