// Claims (Steps 2, 3, 32; V7, V8, V17): FTS5, WAL, busy_timeout, STRICT, VACUUM INTO, backup API shape on this runtime.
const { DatabaseSync, backup } = require("node:sqlite"); const fs = require("node:fs"); const path = require("node:path");
const db = new DatabaseSync(":memory:");
db.exec("CREATE VIRTUAL TABLE t USING fts5(x)"); db.exec("INSERT INTO t VALUES ('hello world')");
console.log("fts5 MATCH rows:", db.prepare("SELECT x FROM t WHERE t MATCH 'hello'").all().length);
console.log("sqlite_version:", db.prepare("select sqlite_version() v").get().v);
console.log("ENABLE_FTS5 compiled:", db.prepare("pragma compile_options").all().some(r => Object.values(r)[0] === "ENABLE_FTS5"));
const p = path.join(process.env.PROBE_LAYOUT, "probe02.db"); for (const s of ["", "-wal", "-shm", "-copy"]) { try { fs.unlinkSync(p + s) } catch {} }
const d2 = new DatabaseSync(p); d2.exec("PRAGMA journal_mode=WAL"); d2.exec("PRAGMA busy_timeout=100"); d2.exec("CREATE TABLE s(x INT NOT NULL) STRICT");
console.log("journal_mode:", d2.prepare("pragma journal_mode").get().journal_mode, "busy_timeout:", d2.prepare("pragma busy_timeout").get().timeout);
let strict = "not rejected"; try { d2.exec("INSERT INTO s VALUES ('x')"); } catch (e) { strict = "rejected"; } console.log("STRICT text-into-INT:", strict);
d2.exec("INSERT INTO s VALUES (1)"); d2.exec(`VACUUM INTO '${p}-copy'`);
console.log("VACUUM INTO round-trip rows:", new DatabaseSync(p + "-copy").prepare("select count(*) c from s").get().c);
console.log("DatabaseSync.prototype.backup:", typeof d2.backup, "| module-level backup:", typeof backup);
