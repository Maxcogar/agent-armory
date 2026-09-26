// Worker process for T-13-5 (Step 13, AD-26). NOT a test file — the name has no
// `.test` suffix, so scripts/run-tests.mjs never counts or runs it.
//
// Roles (argv[2]):
//   mine   <repo> <projectDb> <globalDb> <diagnosticsDir> <full|auto>
//          Opens the (already migrated) project store and the (already seeded)
//          global store, and runs one `mineCochange` pass with a tuningReader;
//          `full` passes `{full: true}`, `auto` leaves the flag unset. Exits 0
//          when the pass completes; prints the error and exits 1 otherwise. The
//          parent SIGKILLs it mid-pass for the crash cases.
//   mine-stop <repo> <projectDb> <globalDb> <diagnosticsDir> <stopHash>
//          (T-13-6(b)) As `mine auto`, but the store handed to the miner is a
//          pass-through wrapper that, when an outermost `transaction` returns
//          (a committed chunk) and `last_mined_commit` is then <stopHash>,
//          throws `injected stop after <stopHash>` — the pass stops right
//          after that chunk. Exits 1 with that error on stderr.
//   append <projectDb> <count> <resultFile>
//          Performs `count` single-row `observed_actions` appends, each in its
//          own `store.transaction` (busy_timeout 100 ms + one retry, Step 3),
//          and writes {ok, storeBusy, otherErrors} as JSON to <resultFile>.

import { writeFileSync } from 'node:fs';
import { openStore, StoreBusy, type Store } from '../../src/stores/adapter.js';
import { tuningReader } from '../../src/stores/dao/tuning.js';
import { observedActionsDao } from '../../src/stores/dao/observed_actions.js';
import { mineCochange } from '../../src/miner/cochange.js';

/** A pass-through Store that throws once a committed outermost transaction leaves the watermark at `stopHash`. */
function stopAfterWatermark(inner: Store, stopHash: string): Store {
  let depth = 0;
  return {
    prepare: (sql) => inner.prepare(sql),
    exec: (sql) => inner.exec(sql),
    integrityCheck: () => inner.integrityCheck(),
    exportTo: (dest) => inner.exportTo(dest),
    close: () => inner.close(),
    transaction<T>(fn: () => T, opts?: { onBusyRetry?: () => void }): T {
      depth += 1;
      let out: T;
      try {
        out = inner.transaction(fn, opts);
      } finally {
        depth -= 1;
      }
      if (depth === 0) {
        const row = inner.prepare("SELECT value FROM schema_meta WHERE key = 'last_mined_commit'").get() as { value: string | null } | undefined;
        if (row?.value === stopHash) throw new Error(`injected stop after ${stopHash}`);
      }
      return out;
    },
  };
}

async function main(): Promise<void> {
  const [role, ...args] = process.argv.slice(2);
  if (role === 'mine') {
    const [repo, projectDb, globalDb, diag, mode] = args;
    if (repo === undefined || projectDb === undefined || globalDb === undefined || diag === undefined || mode === undefined) {
      throw new Error('miner_chunks_worker mine: expected <repo> <projectDb> <globalDb> <diagnosticsDir> <full|auto>');
    }
    const store = openStore(projectDb);
    const global = openStore(globalDb);
    const tuning = tuningReader(global, 'miner-large', () => {});
    await mineCochange(store, repo, mode === 'full' ? { tuning, diagnosticsDir: diag, full: true } : { tuning, diagnosticsDir: diag });
    store.close();
    global.close();
    return;
  }
  if (role === 'mine-stop') {
    const [repo, projectDb, globalDb, diag, stopHash] = args;
    if (repo === undefined || projectDb === undefined || globalDb === undefined || diag === undefined || stopHash === undefined) {
      throw new Error('miner_chunks_worker mine-stop: expected <repo> <projectDb> <globalDb> <diagnosticsDir> <stopHash>');
    }
    const store = openStore(projectDb);
    const global = openStore(globalDb);
    const tuning = tuningReader(global, 'miner-branches', () => {});
    await mineCochange(stopAfterWatermark(store, stopHash), repo, { tuning, diagnosticsDir: diag });
    store.close();
    global.close();
    return;
  }
  if (role === 'append') {
    const [projectDb, countArg, resultFile] = args;
    if (projectDb === undefined || countArg === undefined || resultFile === undefined) {
      throw new Error('miner_chunks_worker append: expected <projectDb> <count> <resultFile>');
    }
    const store = openStore(projectDb);
    const oa = observedActionsDao(store);
    let ok = 0;
    let storeBusy = 0;
    const otherErrors: string[] = [];
    for (let i = 0; i < Number(countArg); i++) {
      try {
        store.transaction(() => oa.append({ session: 'T-13-5', consumer: 'main', tool: 'Read', path: `p${i}.txt`, outcome: 'ok', ts: i }));
        ok += 1;
      } catch (e) {
        if (e instanceof StoreBusy) storeBusy += 1;
        else otherErrors.push(String((e as Error)?.message ?? e));
      }
    }
    writeFileSync(resultFile, JSON.stringify({ ok, storeBusy, otherErrors }));
    store.close();
    return;
  }
  throw new Error(`miner_chunks_worker: unknown role ${JSON.stringify(role)}`);
}

main().catch((e: unknown) => {
  process.stderr.write(`miner_chunks_worker: ${(e as Error)?.stack ?? String(e)}\n`);
  process.exit(1);
});
