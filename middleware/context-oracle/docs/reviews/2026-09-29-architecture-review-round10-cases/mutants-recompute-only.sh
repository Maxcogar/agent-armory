#!/bin/sh
# mutants.sh <work-dir> <build> — would the tests fail if the mapping or a round-6,
# round-7, round-8 or round-9 fix were wrong? Each mutant edits one rule of a copy of rebuild.mjs
# or recompute.mjs (one or more exact replacements, each of text that occurs once) and
# runs this directory's test for that file: test-rebuild.mjs with <build> (the
# designed-validator build, designed-build.sh) supplying the validator, or
# test-recompute.mjs. The copy sits in <work-dir>/mutroot/ next to a link to the
# 2026-09-28 evidence directory, whose layout SQL rebuild.mjs reads.
# Mutants 1-7 are the 2026-09-28 set, 8-11 round 6's, 12-18 round 7's (three re-anchored
# to the round-8 text: R6-8, R7-3, R7-4a; each still makes its round's defect), and
# 19-33 round 8's (35 in round 8, less the two below), at least one per round-8
# behaviour fix, and 34-47 round 9's, at least one per round-9 behaviour fix. Round 9 re-anchors the round-8 mutants whose text the
# round-9 fixes changed (R8-1a, and the recompute model's R8-2b, R8-7a, R8-7b; each still
# makes its round's defect), replaces R8-2a (round 7's resume at the current h) by R9-1c,
# which makes the same defect in the resuming model, and drops R8-1b (the completion by
# the record's root, removed with the binding moved before the rename: R9-3a replaces it).
set -u
W="$(cd "$1" && pwd)"; B="$(cd "$2" && pwd)"; HERE="/home/user/agent-armory/middleware/context-oracle/docs/reviews/2026-09-29-rebuild-mapping-evidence-r9"
OLD="$(cd "$HERE/../2026-09-28-rebuild-mapping-evidence" && pwd)"
mut() { # mut <label> <file> <old> <new> [<old> <new> ...]
  label="$1"; file="$2"; shift 2
  rm -rf "$W/mutroot"; mkdir -p "$W/mutroot"; cp -r "$HERE" "$W/mutroot/r9"; ln -s "$OLD" "$W/mutroot/2026-09-28-rebuild-mapping-evidence"
  python3 -c "
import sys
p=sys.argv[1]; s=open(p).read(); a=sys.argv[2:]
for i in range(0, len(a), 2):
    assert s.count(a[i])==1, a[i]
    s=s.replace(a[i], a[i+1], 1)
open(p,'w').write(s)" "$W/mutroot/r9/$file" "$@" || { echo "mutant [$label]: NOT APPLIED"; return; }
  if [ "$file" = recompute.mjs ]; then node --no-warnings "$W/mutroot/r9/test-recompute.mjs" > "$W/mut.out" 2>&1; st=$?
  else node --no-warnings "$W/mutroot/r9/test-rebuild.mjs" "$W" "$B" > "$W/mut.out" 2>&1; st=$?; fi
  echo "mutant [$label]: test exit $st; $(tail -1 "$W/mut.out"); first failure: $(grep -m1 FAIL "$W/mut.out" | cut -c1-110)"
}
R=rebuild.mjs; C=recompute.mjs
mut "R8-2b: the marker is not read, so an interrupted recompute is not finished (F5-6's defect)" $C "  const pending = pendingRaw === undefined ? null : JSON.parse(pendingRaw);" "  const pending = null;"
mut "R8-7a: the pass's mine weights new commits at the stored epoch, not the recompute's" $C "      const w = term(c.ts, refTs, E, h);" "      const w = term(c.ts, refTs, storedE === undefined ? E : Number(storedE), h);"
mut "R8-7b: the recompute caps ts at the stored epoch, not at its own" $C "upC.run(term(x.ts, rc.epoch, rc.epoch, rc.h), x.r);" "upC.run(term(x.ts, storedE === undefined ? rc.epoch : Number(storedE), rc.epoch, rc.h), x.r);"
mut "R9-1a: a first mine writes its mined-with values only in its final transaction (round 8)" $C "  if (firstMine) head.push(" "  if (false) head.push("
mut "R9-1b: an interrupted recompute starts again from its first row (round 8's restart)" $C "    if (pending.h === h && !pastBound(refTs, pending.epoch, h)) rc = pending;" "    if (false) rc = pending;"
mut "R9-1c: a resumed recompute takes the current h, not its own (round 7's resume, R8-2's defect)" $C "    if (pending.h === h && !pastBound(refTs, pending.epoch, h)) rc = pending;" "    if (!pastBound(refTs, pending.epoch, h)) rc = { ...pending, h };"
mut "R9-1d: a resumed recompute takes the resuming pass's refTs as its epoch and cap, not its own" $C "    if (pending.h === h && !pastBound(refTs, pending.epoch, h)) rc = pending;" "    if (pending.h === h && !pastBound(refTs, pending.epoch, h)) rc = { ...pending, epoch: refTs };"
mut "R9-1e: a superseded recompute is not recorded" $C "    if (superseded !== null) record(d, 'recompute_superseded'" "    if (false) record(d, 'recompute_superseded'"
mut "R9-2a: case 2 writes its digest only in the final transaction (the round-9 review's K2 defect)" $C "      if (i + chunk >= D.length) setMeta(d, 'mined_fix_lexicon_digest', lex);" ""
mut "R9-2b: case 2 writes its digest in its first transaction, before the eviction ends" $C "  const firstMine = stored === 0 && rc === null;" "  const firstMine = stored === 0 && rc === null; if (evictAll) head.push(() => setMeta(d, 'mined_fix_lexicon_digest', lex));"
mut "R9-6a: a pass that finds mining_in_progress set records nothing" $C "record(d, 'mining_resumed', { interrupted: Number(mip) });" ""
mut "R9-6b: the pass's bookkeeping is a transaction of its own, with no work" $C "    d.exec('BEGIN'); if (txns === 0) for (const w of head) w(); fn(); d.exec('COMMIT'); txns++;" "    if (txns === 0) { d.exec('BEGIN'); for (const w of head) w(); d.exec('COMMIT'); txns++; if (txns >= stopAfter) throw new Error('killed'); }
