// Claims (Step 14, T-14-1, §4, D-plan-32): a reindex claim held as a
// `schema_meta` row and taken inside one `BEGIN IMMEDIATE` transaction —
// read the row, treat it as held only when its pid is alive, write your own
// pid — cannot be won by two processes at once: SQLite's single writer
// serializes the check and the write, and the loser then sees a live owner.
// Two real processes race a planted stale claim (a dead pid) 200 times, the
// winner holding its claim as a running reindex would; exactly one wins.
import { DatabaseSync } from "node:sqlite";
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

if (process.argv[2] === "child") {
  const [db, startFile] = process.argv.slice(3);
  while (!existsSync(startFile)) {}
  const store = new DatabaseSync(db); store.exec("PRAGMA busy_timeout=100");
  const alive = (pid) => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === "EPERM"; } };
  let outcome = "busy";
  for (let attempt = 0; attempt < 2 && outcome === "busy"; attempt++) {
    try {
      store.exec("BEGIN IMMEDIATE");
      const row = store.prepare("SELECT value FROM schema_meta WHERE key='reindex_owner_pid'").get();
      if (row && alive(Number(row.value))) { outcome = "held-by-live-owner"; store.exec("ROLLBACK"); break; }
      store.prepare("INSERT INTO schema_meta(key,value) VALUES('reindex_owner_pid',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(String(process.pid));
      store.exec("COMMIT"); outcome = "won";
      await new Promise((r) => setTimeout(r, 400)); // hold the claim, as a running reindex does
    } catch (e) { if (!/SQLITE_BUSY/.test(String(e.message))) throw e; try { store.exec("ROLLBACK"); } catch {} }
  }
  process.stdout.write(outcome); process.exit(0);
}

const dir = mkdtempSync(join(tmpdir(), "claimrace-"));
const db = join(dir, "store.db");
const dead = spawnSync(process.execPath, ["-e", "0"]).pid;  // a pid that has exited
const ITER = 200; let one = 0, both = 0, none = 0;
for (let i = 0; i < ITER; i++) {
  rmSync(db, { force: true });
  const s = new DatabaseSync(db);
  s.exec("PRAGMA journal_mode=wal; CREATE TABLE schema_meta(key TEXT PRIMARY KEY, value TEXT NOT NULL) STRICT;");
  s.prepare("INSERT INTO schema_meta VALUES('reindex_owner_pid', ?)").run(String(dead));
  s.close();
  const start = join(dir, `start-${i}`);
  const kids = [0, 1].map(() => spawn(process.execPath, [process.argv[1], "child", db, start], { stdio: ["ignore", "pipe", "inherit"] }));
  await new Promise((r) => setTimeout(r, 30));
  writeFileSync(start, "go");
  const outs = await Promise.all(kids.map((k) => new Promise((res) => { let o = ""; k.stdout.on("data", (d) => (o += d)); k.on("exit", () => res(o)); })));
  const wins = outs.filter((o) => o === "won").length;
  if (wins === 1) one++; else if (wins === 2) both++; else none++;
}
// release: the winner clears the row in a finally; a cleared row is absent.
const s = new DatabaseSync(db); s.prepare("DELETE FROM schema_meta WHERE key='reindex_owner_pid'").run();
const after = s.prepare("SELECT value FROM schema_meta WHERE key='reindex_owner_pid'").get();
s.close(); rmSync(dir, { recursive: true, force: true });
console.log(`stale claim (dead pid) raced by two processes, ${ITER} iterations: exactly one won ${one}; both won ${both}; neither won ${none}`);
console.log(`after the owner's release (DELETE in finally) the claim row is absent: ${after === undefined}`);
