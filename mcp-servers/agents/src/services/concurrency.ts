/**
 * Run an array of async tasks with a capped concurrency.
 * Results are returned in the same order as input tasks.
 */
export async function runWithLimit<T>(
  tasks: Array<() => Promise<T>>,
  maxConcurrency: number,
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < tasks.length) {
      const i = nextIndex++;
      results[i] = await tasks[i]!();
    }
  }

  const workerCount = Math.min(maxConcurrency, tasks.length);
  await Promise.all(Array.from({ length: workerCount }, worker));
  return results;
}
