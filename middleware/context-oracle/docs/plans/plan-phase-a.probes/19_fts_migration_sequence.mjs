// Claims (Step 7, Step 31, D-plan-28): applyMigrations(store, {fts:
// boolean}) applies migration 001 (which creates schema_meta), THEN
// records schema_meta.fts_state from the boolean argument (only when the
// key is absent), THEN applies 001b iff fts_state === 'fts5' -- so no
// write to schema_meta ever happens before 001 creates the table, and a
// later call cannot flip the recorded state. Also demonstrates that
// writing to schema_meta before it exists (the sequence a prior finding,
// M1, alleged the plan specified) really does throw in real SQLite.
import { DatabaseSync } from "node:sqlite";

function getVersion(db) {
  const exists = db.prepare("SELECT name FROM sqlite_master WHERE name = 'schema_meta'").get();
  if (!exists) return 0;
  const row = db.prepare("SELECT value FROM schema_meta WHERE key = 'schema_version'").get();
  return row ? Number(row.value) : 0;
}
function getMeta(db, key) {
  const row = db.prepare("SELECT value FROM schema_meta WHERE key = ?").get(key);
  return row ? row.value : undefined;
}
function setMeta(db, key, value) {
  db.prepare("INSERT INTO schema_meta(key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(key, value);
}
function setMetaIfAbsent(db, key, value) {
  if (getMeta(db, key) === undefined) setMeta(db, key, value);
}
function applyMigrations(db, { fts }) {
  let version = getVersion(db);
  if (version < 1) {
    db.exec("CREATE TABLE schema_meta(key TEXT PRIMARY KEY, value TEXT);");
    setMeta(db, "schema_version", "1");
    setMetaIfAbsent(db, "fts_state", fts ? "fts5" : "fallback");
    version = 1;
  }
  if (version < 2) {
    if (getMeta(db, "fts_state") === "fts5") {
      db.exec("CREATE VIRTUAL TABLE fts_symbols USING fts5(name);");
      db.exec("CREATE VIRTUAL TABLE fts_paths USING fts5(path);");
    }
    setMeta(db, "schema_version", "2");
  }
}

let threwBeforeTableExists = false;
{
  const db = new DatabaseSync(":memory:");
  try {
    db.prepare("INSERT INTO schema_meta(key, value) VALUES ('fts_state','fallback')").run();
  } catch {
    threwBeforeTableExists = true;
  }
  db.close();
}
console.log("writing schema_meta before migration 001 creates the table throws:", threwBeforeTableExists);

for (const fts of [true, false]) {
  const label = `fts:${fts}`;
  const db = new DatabaseSync(":memory:");
  applyMigrations(db, { fts });
  const stateAfterFirst = getMeta(db, "fts_state");
  const ftsTableExists = !!db.prepare("SELECT name FROM sqlite_master WHERE name = 'fts_symbols'").get();
  const schemaMetaPresent = !!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = 'schema_meta'").get();
  applyMigrations(db, { fts: !fts }); // second call, opposite flag: must not flip
  const stateAfterSecond = getMeta(db, "fts_state");
  console.log(`${label}: fts_state after first applyMigrations call =`, stateAfterFirst);
  console.log(`${label}: fts_symbols virtual table created =`, ftsTableExists);
  console.log(`${label}: schema_meta table present (LIKE-path indexable base) =`, schemaMetaPresent);
  console.log(`${label}: fts_state after second call with opposite flag =`, stateAfterSecond, `(unchanged: ${stateAfterSecond === stateAfterFirst})`);
  db.close();
}
