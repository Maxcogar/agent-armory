// Cooperative watchdog deadline (Step 10, AD-23). The handler (Step 28) calls
// `deadline.check()` at each pipeline boundary; once the budget is spent it
// throws `DeadlineExceeded` and the handler fails open. The clock is injected so
// the millisecond boundary is deterministically testable (T-10-4).

import { performance } from 'node:perf_hooks';

export class DeadlineExceeded extends Error {
  constructor(elapsedMs: number, budgetMs: number) {
    super(`deadline exceeded: ${elapsedMs.toFixed(1)}ms >= ${budgetMs}ms budget`);
    this.name = 'DeadlineExceeded';
  }
}

export interface Deadline {
  /** Throw DeadlineExceeded once the elapsed time has reached the budget. */
  check(): void;
  /** Milliseconds elapsed since the deadline was created. */
  elapsed(): number;
}

export function createDeadline(opts: { ms?: number; now?: () => number } = {}): Deadline {
  const ms = opts.ms ?? 2500;
  const now = opts.now ?? ((): number => performance.now());
  const start = now();
  return {
    check(): void {
      const elapsed = now() - start;
      if (elapsed >= ms) throw new DeadlineExceeded(elapsed, ms);
    },
    elapsed(): number {
      return now() - start;
    },
  };
}
