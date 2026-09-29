#!/bin/sh
# mutants.sh <work-dir> <build> — would the tests fail if the mapping or a round-6,
# round-7 or round-8 fix were wrong? Each mutant edits one rule of a copy of rebuild.mjs
# or recompute.mjs (one or more exact replacements, each of text that occurs once) and
# runs this directory's test for that file: test-rebuild.mjs with <build> (the
# designed-validator build, designed-build.sh) supplying the validator, or
# test-recompute.mjs. The copy sits in <work-dir>/mutroot/ next to a link to the
# 2026-09-28 evidence directory, whose layout SQL rebuild.mjs reads.
# Mutants 1-7 are the 2026-09-28 set, 8-11 round 6's, 12-18 round 7's (three re-anchored
# to the round-8 text: R6-8, R7-3, R7-4a; each still makes its round's defect), and
# 19-35 round 8's, at least one per round-8 behaviour fix.
set -u
W="$(cd "$1" && pwd)"; B="$(cd "$2" && pwd)"; HERE="$(cd "$(dirname "$0")" && pwd)"
OLD="$(cd "$HERE/../2026-09-28-rebuild-mapping-evidence" && pwd)"
mut() { # mut <label> <file> <old> <new> [<old> <new> ...]
  label="$1"; file="$2"; shift 2
  rm -rf "$W/mutroot"; mkdir -p "$W/mutroot"; cp -r "$HERE" "$W/mutroot/r8"; ln -s "$OLD" "$W/mutroot/2026-09-28-rebuild-mapping-evidence"
  python3 -c "
import sys
p=sys.argv[1]; s=open(p).read(); a=sys.argv[2:]
for i in range(0, len(a), 2):
    assert s.count(a[i])==1, a[i]
    s=s.replace(a[i], a[i+1], 1)
open(p,'w').write(s)" "$W/mutroot/r8/$file" "$@" || { echo "mutant [$label]: NOT APPLIED"; return; }
  if [ "$file" = recompute.mjs ]; then node --no-warnings "$W/mutroot/r8/test-recompute.mjs" > "$W/mut.out" 2>&1; st=$?
  else node --no-warnings "$W/mutroot/r8/test-rebuild.mjs" "$W" "$B" > "$W/mut.out" 2>&1; st=$?; fi
  echo "mutant [$label]: test exit $st; $(tail -1 "$W/mut.out"); first failure: $(grep -m1 FAIL "$W/mut.out" | cut -c1-110)"
}
R=rebuild.mjs; C=recompute.mjs
# 2026-09-28
mut "owner tuning row inserted beside the seed (F5-2)" $R "tmp.prepare('DELETE FROM tuning WHERE key = ? AND project_key IS ?').run(key, project_key);" ""
mut "file ids copied as numbers (R4-2)" $R "else if ((r.ids ?? []).includes(c)) out[c] = fileIdFor(row[c]);" ""
mut "tuning not validated (F5-3)" $R "const refused = rows.map((o) => head.checkTuningWrite(reader, key, o.value)).find((c) => 'refused' in c);" "const refused = undefined;"
mut "legacy file opened read-write and written" $R "legacy = new DatabaseSync(legacyPath, { readOnly: true });" "legacy = new DatabaseSync(legacyPath); legacy.exec('PRAGMA user_version = 1');"
mut "subject_key carried with legacy ids (F5-1)" $R "if (set[c] === 'NULL') {" "if (false) {"
mut "questions not carried (F5-8)" $R "questions: { rule: 'as-is'," "questions: { rule: 'derived',"
mut "store_rebuilt record missing from the new store" $R "    tmp.transaction(() => {
      if (scope === 'project') {" "    if (process.env.REBUILD_KILL_AT) tmp.transaction(() => {
      if (scope === 'project') {"
# round 6
mut "R6-1: a legacy file of unknown layout counted as carried (the round-6 defect)" $R "if (rec.layout === null) return { reason:" "if (rec.layout === null) return null; if (0) return { reason:"
mut "R6-2: the carried-rows digest reduced to a row count" $R 'h.update(`${JSON.stringify(row)}\n`);' "h.update('row');"
mut "R6-8: a row the new layout refuses fails the rebuild" $R "if (!(e.unplaceable || e.legacyContent || (e.code === 'ERR_SQLITE_ERROR' && (e.errcode & 0xff) === 19 /* SQLITE_CONSTRAINT */))) throw e;" "throw e;"
mut "R6-9: layout compared without reading CRLF as LF" $R "r.sql.replaceAll('\\r\\n', '\\n')" "r.sql"
# round 7
mut "R7-1: the rebuild validates the half-life with a fixed 37-day floor, not the build's validator" $R "head.checkTuningWrite(reader, key, o.value)" "(key === 'bar.recency_half_life_days' && !(Number(o.value) >= 37) ? { refused: 'refused: at least 37' } : head.checkTuningWrite(reader, key, o.value))"
mut "R7-2: migration checksum over the raw bytes (CRLF not read as LF)" $R "export const migrationChecksum = (text) => sha(text.replaceAll('\\r\\n', '\\n'));" "export const migrationChecksum = (text) => sha(text);"
mut "R7-3: a corrupt page in the digest fails the rebuild" $R "      if (!e.legacyContent) throw e;
      digests[t] = null;" "      throw e;
      digests[t] = null;"
mut "R7-4a: the rule reads the latest record, whatever file it describes" $R "AND json_extract(detail_json, '\$.origin') = 'local' AND json_extract(detail_json, '\$.legacyRel') = ? ORDER BY" "AND ? IS NOT NULL ORDER BY"
mut "R7-4b: an unreadable rebuilt legacy file throws" $R "} catch (e) { return { reason: \`the file could not be read (\${e.message})\`, rows: null }; }" "} catch (e) { throw e; }"
mut "R7-5: no row counts beside the digests" $R "counts[t] = rows.length;" ""
mut "R7-8: the purge deletes the project store first" $R "for (const n of [...first, ...rest, ...last]) {" "for (const n of [...last, ...first, ...rest]) {"
# round 8
mut "R8-1a: the child binds any root whose derived key's store is current (round 7)" $R "if (rec !== undefined && JSON.parse(rec.r).root === root) return bind();" "return bind();"
mut "R8-1b: a run after a kill before step 6 does not complete its own rebuild's binding" $R "if (rec !== undefined && JSON.parse(rec.r).root === root) return bind();" "if (false) return bind();"
mut "R8-1c: a derived key with no store is not recorded" $R "if (state === 'no-legacy') return notBound('no store for the derived key');" "if (state === 'no-legacy') return 'none';"
mut "R8-1d: the handler records repo_not_bound although a legacy store is present (R7-6's defect)" $R "  if (legacy) return 'spawn';" "  if (legacy) { jsonl(path.join(home, 'diagnostics/faults.jsonl'), { code: 'repo_not_bound', root, session }); return 'spawn'; }"
mut "R8-3: the rename does not delete the new name's -journal/-wal/-shm" $R "  for (const s of ['-journal', '-wal', '-shm']) rmSync(newPath + s, { force: true });
  renameSync(tmpPath, newPath);" "  renameSync(tmpPath, newPath);"
mut "R8-4a: a file with any unreadable table carries nothing (round 7's whole-file exit)" $R "      let half = false;
      tmp.transaction(() => {
        for (const t of legacyTables) {" "      let half = false;
      if (Object.keys(dg.unreadable).length > 0) { Object.assign(report, { layout: null, unreadable: Object.values(dg.unreadable)[0], carried: {}, unplaced: [] }); delete report.legacyDigests; delete report.legacyCounts; } else
      tmp.transaction(() => {
        for (const t of legacyTables) {"
mut "R8-4b: a content error from the new store is recorded as the legacy file's" $R "          if (!e.legacyContent) throw e;
          report.unplaced.length = mark;" "          if (!(e.legacyContent || fileUnreadable(e))) throw e;
          report.unplaced.length = mark;"
mut "R8-4d: a table that fails to read in the copy fails the rebuild" $R "          if (!e.legacyContent) throw e;
          report.unplaced.length = mark;" "          throw e;
          report.unplaced.length = mark;"
mut "R8-4c: a row whose legacy files row cannot be read fails its whole table" $R "if (!(e.unplaceable || e.legacyContent || (e.code" "if (!(e.unplaceable || (e.code"
mut "R8-5a: the record is matched by the legacy path's spelling (round 7)" $R "AND json_extract(detail_json, '\$.origin') = 'local' AND json_extract(detail_json, '\$.legacyRel') = ? ORDER BY" "AND json_extract(detail_json, '\$.origin') = 'local' AND json_extract(detail_json, '\$.legacyPath') = ? ORDER BY" "AND json_extract(value, '\$.origin') = 'local' AND json_extract(value, '\$.legacyRel') = ?\")" "AND json_extract(value, '\$.origin') = 'local' AND json_extract(value, '\$.legacyPath') = ?\")" ".get(rel);" ".get(legacyPath);"
mut "R8-5b: an import's rebuild record is read as the local file's" $R "AND json_extract(detail_json, '\$.origin') = 'local' AND json_extract(detail_json, '\$.legacyRel') = ? ORDER BY" "AND json_extract(detail_json, '\$.legacyRel') = ? ORDER BY"
mut "R8-5c: the counts of a file with no record include derived tables" $R "rows: layout === null ? countRows(d) : carriedDigests(d, layout, scope).counts" "rows: countRows(d)"
mut "R8-5d: no counts when the file has no rebuild record" $R "if (got === undefined) return { reason: 'no rebuild record', ...carriedCounts(scope, legacyPath), command: null };" "if (got === undefined) return { reason: 'no rebuild record' };"
mut "R8-2a: the round-7 resume after recompute_done, at the stored epoch and the current h" $C "  const E = recompute || storedE === undefined ? refTs : Number(storedE);" "  const E = pending ? Number(meta(d, 'recompute_epoch')) : recompute || storedE === undefined ? refTs : Number(storedE);" "    step(() => { setMeta(d, 'recompute_pending', 1); setMeta(d, 'mining_in_progress', 1); });" "    if (!pending) step(() => { setMeta(d, 'recompute_pending', 1); setMeta(d, 'recompute_epoch', E); setMeta(d, 'mining_in_progress', 1); });" "    for (let i = 0; i < rows.length; i += chunk) step(() => {" "    const done = pending && meta(d, 'recompute_done') !== undefined ? Number(meta(d, 'recompute_done')) : 0;
    for (let i = done; i < rows.length; i += chunk) step(() => { setMeta(d, 'recompute_done', Math.min(i + chunk, rows.length));" "DELETE FROM meta WHERE key IN ('recompute_pending', 'mining_in_progress')" "DELETE FROM meta WHERE key IN ('recompute_pending', 'mining_in_progress', 'recompute_epoch', 'recompute_done')"
mut "R8-2b: the marker is not read, so an interrupted recompute is not finished (F5-6's defect)" $C "(pending || minedH === undefined" "(minedH === undefined"
mut "R8-7a: the pass's mine weights new commits at the stored epoch, not the recompute's" $C "      const w = term(c.ts, refTs, E, h);" "      const w = term(c.ts, refTs, storedE === undefined ? E : Number(storedE), h);"
mut "R8-7b: the recompute caps ts at the stored epoch, not at its own" $C "upC.run(term(x.ts, refTs, E, h), x.r);" "upC.run(term(x.ts, storedE === undefined ? refTs : Number(storedE), E, h), x.r);"
