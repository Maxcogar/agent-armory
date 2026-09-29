#!/bin/sh
# mutants.sh <work-dir> — would the test fail if the mapping were wrong? Each mutant
# edits one rule of a copy of rebuild.mjs and runs test-rebuild.mjs against it.
set -u
W="$(cd "$1" && pwd)"; HERE="$(cd "$(dirname "$0")" && pwd)"
mut() { # mut <label> <python-literal old> <python-literal new>
  rm -rf "$W/mut"; cp -r "$HERE" "$W/mut"
  python3 -c "import sys;p=sys.argv[1];s=open(p).read();a,b=sys.argv[2],sys.argv[3];assert a in s,a;open(p,'w').write(s.replace(a,b,1))" "$W/mut/rebuild.mjs" "$2" "$3"
  node --no-warnings "$W/mut/test-rebuild.mjs" "$W" > "$W/mut.out" 2>&1; st=$?
  echo "mutant [$1]: test exit $st; $(tail -1 "$W/mut.out"); first failure: $(grep -m1 FAIL "$W/mut.out" | cut -c1-110)"
}
mut "owner tuning row inserted beside the seed (F5-2)" "tmp.prepare('DELETE FROM tuning WHERE key = ? AND project_key IS ?').run(key, project_key);" ""
mut "file ids copied as numbers (R4-2)" "else if ((r.ids ?? []).includes(c)) out[c] = fileIdFor(row[c]);" ""
mut "tuning not validated (F5-3)" "const refused = rows.map((o) => head.checkTuningWrite(reader, key, o.value)).find((c) => 'refused' in c);" "const refused = undefined;"
mut "legacy file opened read-write and written" "legacy = new DatabaseSync(legacyPath, { readOnly: true });" "legacy = new DatabaseSync(legacyPath); legacy.exec('PRAGMA user_version = 1');"
mut "subject_key carried with legacy ids (F5-1)" "if (set[c] === 'NULL') {" "if (false) {"
mut "questions not carried (F5-8)" "questions: { rule: 'as-is'," "questions: { rule: 'derived',"
mut "store_rebuilt record missing from the new store" "    tmp.transaction(() => {
      tmp.prepare(\`INSERT OR REPLACE INTO \${meta}(key, value) VALUES('legacy_unplaced', ?)\`)" "    if (process.env.REBUILD_KILL_AT) tmp.transaction(() => {
      tmp.prepare(\`INSERT OR REPLACE INTO \${meta}(key, value) VALUES('legacy_unplaced', ?)\`)"
