#!/bin/sh
# mutants.sh <work-dir> — would the test fail if the mapping or a round-6 fix were
# wrong? Each mutant edits one rule of a copy of rebuild.mjs and runs this
# directory's test-rebuild.mjs against it. The copy sits in <work-dir>/mutroot/ next
# to a link to the 2026-09-28 evidence directory, whose layout SQL rebuild.mjs reads.
# Mutants 1-7 are the 2026-09-28 set (the seventh re-anchored: the record's
# transaction no longer writes legacy_unplaced); 8-11 are round 6's.
set -u
W="$(cd "$1" && pwd)"; HERE="$(cd "$(dirname "$0")" && pwd)"
OLD="$(cd "$HERE/../2026-09-28-rebuild-mapping-evidence" && pwd)"
mut() { # mut <label> <python-literal old> <python-literal new>
  rm -rf "$W/mutroot"; mkdir -p "$W/mutroot"; cp -r "$HERE" "$W/mutroot/r6"; ln -s "$OLD" "$W/mutroot/2026-09-28-rebuild-mapping-evidence"
  python3 -c "import sys;p=sys.argv[1];s=open(p).read();a,b=sys.argv[2],sys.argv[3];assert s.count(a)==1,a;open(p,'w').write(s.replace(a,b,1))" "$W/mutroot/r6/rebuild.mjs" "$2" "$3" || { echo "mutant [$1]: NOT APPLIED"; return; }
  node --no-warnings "$W/mutroot/r6/test-rebuild.mjs" "$W" > "$W/mut.out" 2>&1; st=$?
  echo "mutant [$1]: test exit $st; $(tail -1 "$W/mut.out"); first failure: $(grep -m1 FAIL "$W/mut.out" | cut -c1-110)"
}
mut "owner tuning row inserted beside the seed (F5-2)" "tmp.prepare('DELETE FROM tuning WHERE key = ? AND project_key IS ?').run(key, project_key);" ""
mut "file ids copied as numbers (R4-2)" "else if ((r.ids ?? []).includes(c)) out[c] = fileIdFor(row[c]);" ""
mut "tuning not validated (F5-3)" "const refused = rows.map((o) => head.checkTuningWrite(reader, key, o.value)).find((c) => 'refused' in c);" "const refused = undefined;"
mut "legacy file opened read-write and written" "legacy = new DatabaseSync(legacyPath, { readOnly: true });" "legacy = new DatabaseSync(legacyPath); legacy.exec('PRAGMA user_version = 1');"
mut "subject_key carried with legacy ids (F5-1)" "if (set[c] === 'NULL') {" "if (false) {"
mut "questions not carried (F5-8)" "questions: { rule: 'as-is'," "questions: { rule: 'derived',"
mut "store_rebuilt record missing from the new store" "    tmp.transaction(() => {
      if (scope === 'project') {" "    if (process.env.REBUILD_KILL_AT) tmp.transaction(() => {
      if (scope === 'project') {"
mut "R6-1: a legacy file of unknown layout counted as carried (the round-6 defect)" "if (rec.layout === null) return { reason:" "if (rec.layout === null) return null; if (0) return { reason:"
mut "R6-2: the carried-rows digest reduced to a row count" 'h.update(`${JSON.stringify(row)}\n`);' "h.update('row');"
mut "R6-8: a row the new layout refuses fails the rebuild" "if (!(e.unplaceable || (e.code === 'ERR_SQLITE_ERROR' && (e.errcode & 0xff) === 19 /* SQLITE_CONSTRAINT */))) throw e;" "throw e;"
mut "R6-9: layout compared without reading CRLF as LF" "r.sql.replaceAll('\\r\\n', '\\n')" "r.sql"
