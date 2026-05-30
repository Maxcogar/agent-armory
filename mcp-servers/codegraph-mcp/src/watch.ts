import * as fs from "fs";

// ============================================================
// Filesystem watch (debounced)
// ============================================================
//
// A single recursive fs.watch per process feeds a debounced callback, so a
// burst of saves coalesces into one incremental rescan. Resource hygiene is
// strict: exactly one watcher is ever live — starting a new one closes the
// prior, stop closes it, and the caller wires process exit to stop. There is
// never one watcher per file.
//
// This module owns only the watcher + debounce timer; it knows nothing about
// the graph. The caller supplies the rescan via `onChange`, keeping graph state
// in one place and avoiding an import cycle.

interface WatchState {
  watcher: fs.FSWatcher;
  rootDir: string;
  timer: NodeJS.Timeout | null;
}

let state: WatchState | null = null;

export function isWatching(): boolean {
  return state !== null;
}

export function watchedRoot(): string | null {
  return state ? state.rootDir : null;
}

/**
 * Begin watching `rootDir`. Any existing watcher is closed first (single-watcher
 * invariant). On a filesystem change, `onChange` runs after `debounceMs` of
 * quiet; further changes during that window reset the timer. Throws if the
 * directory cannot be watched.
 */
export function startWatch(
  rootDir: string,
  onChange: () => void | Promise<void>,
  debounceMs = 250
): void {
  stopWatch();

  let watcher: fs.FSWatcher;
  try {
    watcher = fs.watch(rootDir, { recursive: true });
  } catch (err) {
    throw new Error(
      `Failed to watch ${rootDir}: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  const st: WatchState = { watcher, rootDir, timer: null };

  // FSWatcher emits 'change' for both 'rename' and 'change' event types.
  watcher.on("change", () => {
    if (st.timer) clearTimeout(st.timer);
    st.timer = setTimeout(() => {
      st.timer = null;
      Promise.resolve(onChange()).catch((err) => {
        process.stderr.write(
          `[codegraph] watch rescan failed: ${err instanceof Error ? err.message : String(err)}\n`
        );
      });
    }, debounceMs);
  });

  // Keep the process alive but don't crash on a transient watcher error.
  watcher.on("error", (err) => {
    process.stderr.write(`[codegraph] watcher error: ${err.message}\n`);
  });

  state = st;
}

/** Stop and release the active watcher. Returns false if none was active. */
export function stopWatch(): boolean {
  if (!state) return false;
  if (state.timer) clearTimeout(state.timer);
  try {
    state.watcher.close();
  } catch {
    // already closed
  }
  state = null;
  return true;
}
