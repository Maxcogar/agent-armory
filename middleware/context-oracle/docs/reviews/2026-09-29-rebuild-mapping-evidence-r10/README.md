# Evidence: the round-10 changes to the legacy-store rebuild and the miner's resume (2026-09-29)

This directory is the evidence for the changes that answer the round-10 review
(`../2026-09-29-architecture-review-round10.md`, findings R10-1 to R10-6).
`docs/architecture-phase-a.md` cites it as *the round-10 evidence*. Like every
file under `docs/reviews/`, it is written once and never edited.

The round-9 and earlier evidence directories are kept as they are.
`rebuild.mjs`, `recompute.mjs`, `test-rebuild.mjs`, `test-recompute.mjs`,
`mutants.sh` and `designed-build.sh` here are copies of the round-9 files; the
first five are revised, `designed-build.sh` is unchanged. Everything else is
used from the 2026-09-28 directory unchanged, as in round 9 (`build-builds.sh`,
`build-stores.sh`, `mkrepo.sh`, `synth.mjs`, `layouts/`, `new-layout/`), and
`rebuild.mjs` reads the layout SQL from there.

`cases/` holds the round-10 reviewer's files (`../2026-09-29-architecture-review-round10-cases/`)
that bear on the findings: `k10-recompute-mine.mjs`, `k10-termination.mjs`,
`k10-missing-value.mjs`, `k10-bound-supersede.mjs`, `vacuum-rowid.mjs` and
`qplan.mjs` unchanged, and `extra10-meta-index.mjs` with one line changed (its
`R`, which named the round-9 directory, is this directory). `qplan.mjs` lists
the round-9 query texts by hand, so it is not re-run; `cases/qplan-r10.mjs`
(new) records the statements the rebuild actually prepares on a legacy
connection instead. The reviewer's `mut-bound/` is `mutants.sh`'s R10-6, the
same one-line change. Every reviewer case that tests a finding is also ported
into `test-recompute.mjs` or `test-rebuild.mjs` with the expected outcome
(named below), because those tests are what the mutants run.

The rules for this round: every change to what the tool does is written into a
prototype and tested with the reviewer's cases, each behaviour fix with at
least one mutant; no mechanism is added that a finding does not require; and
AD-4, AD-13 and AD-24 state only what the prototypes do.

Outputs are in `results/`. `<work>` is the scratch work directory. Node v22.22.2
(its SQLite 3.51.2), git 2.43.0, Linux.

## The changes, by finding

- **R10-1 (Moderate) — the recompute's row set is fixed at its start.**
  `recompute.mjs`: the recompute's **last transaction** writes its epoch and
  `h` as `weight_epoch` and `mined_half_life_days` and deletes
  `recompute_pending` (round 9 did this only in the pass's final
  transaction). From then on every stored row is at those values, so a pass
  killed in its evict or mine is resumed as an ordinary pass, and the rows its
  mine added are never recomputed again. The recompute covers the rows present
  when it started, because its pass adds no commit or pair before that
  transaction. This is the same rule the document already has for a first mine
  (its values in its first transaction, R9-1) and for case 2 (its digest in the
  transaction that ends the eviction, R9-2): a mined-with value is written where
  every stored row is by then computed under it.
  *Why not the reviewer's variant* (`fix-r10-1/`: each table's last rowid
  stored at the start, and a resume bounded by it). It works on rowids, which
  R10-3 removes. With `done` keyed by primary key, a bound stored at the start
  would not exclude the mine's new rows: a new commit's hash, or a new pair
  `(a, b)`, can fall anywhere in primary-key order. This rule stores nothing,
  so it adds no state. Tested with K10-RM (every `K`; every pass killed after 1,
  2, 3) and T3.
- **R10-2 (Moderate) — every legacy read of a table's rows is a scan.**
  `rebuild.mjs`: the meta tables' copy (`copyMeta`) is `NOT INDEXED ORDER BY
  rowid` (round 9: `ORDER BY key`, through `sqlite_autoindex_*_meta_1`), and the
  digest's query for the meta rule is `NOT INDEXED` (round 9: `key = ? OR …`,
  a `SEARCH … USING INDEX`). The other row reads (`copyTable`, `mergeTuning`,
  the digest's other rules) gain `NOT INDEXED` too. On the three stores the
  planner already scans them (`results/qplan-r9.out`: only the meta reads and
  the `files` lookup use an index). So on these stores the clause changes no
  behaviour, and a mutant removing it would pass. It is there so that
  the rule AD-4 now states, "every legacy read of a table's rows is a table
  scan", holds by the query's text and not by the planner's choice. The one
  other legacy read of a table, the `files` lookup by id, is by `INTEGER
  PRIMARY KEY`, the table's own b-tree. `countOrNull` and `countRows`, which
  only report the rows of a table that could not be read, try a scan first,
  then a plain `count(*)` (kept for Y5's `session_log`, whose root page fails
  while an index still counts 13), then null, as the review asked. Tested with
  M10 (the reviewer's case on B and C, project and global) and a new case for
  the count (`human_facts`'s index damaged on B, with a content error injected
  at its copy).
- **R10-3 (Minor) — `done` names a row by its primary key.** `recompute.mjs`:
  `done` = `{t, k}`, where `k` is the row's primary key (`commits.hash`,
  `files.id`, `pairs`' `(a, b)`), and the recompute reads each table in
  primary-key order, resuming at `(key) > (done.k)`. A primary key is a column
  value, which no VACUUM changes. The rowid of `commits` and `cochange_pairs`,
  which have no explicit `INTEGER PRIMARY KEY`, is what SQLite documents VACUUM
  "may change". That is the document's reason for `seq`, which this makes
  consistent. The alternative the review named, `import` resetting a store with
  `recompute_pending` set, is not taken: it needs a rule in `import`, and it
  would still leave a VACUUM of the live store relying on the rowid. Tested
  with RW. VACUUM on 3.51.2 does not renumber these tables (`results/vacuum-rowid.out`),
  so RW renumbers the rowids itself, reversing them, which is within what
  VACUUM is documented to be allowed to do.
- **R10-4 (Minor) — a missing mined-with value is read as changed and
  recorded.** `recompute.mjs`: a store holding commits with a missing
  `weight_epoch` or `mined_half_life_days` is case 1, and one with a missing
  classifying value case 2. Round 9 already read a missing half-life and a
  missing digest as changed, and threw on a missing `weight_epoch`. The pass
  also records `mined_with_missing` (`{missing}`) in its first transaction. No
  path is known to reach the state, so the record makes the broken invariant
  visible, and the recompute or reconcile repairs it. Tested with MV (the
  reviewer's case).
- **R10-5 (Minor).** AD-23's "(AD-4, step 6)" is "(AD-4, step 5)". This is a
  text fix only.
- **R10-6 (Minor) — a test for the past-the-bound supersession.**
  `test-recompute.mjs` gains BS (the reviewer's case). The reviewer's
  `mut-bound` change is mutant R10-6.

The tests' other changes:
- **Z1** (the round-8 review's) killed after 24 of 25 transactions, the
  recompute's last, now finds the recompute ended: `recompute_pending` is
  absent and `mined_half_life_days` is 20. So the tune back to 365 starts a new
  recompute, which records no `recompute_superseded`. The check expects that
  for `K` = 24 and is unchanged for every other `K`. It also no longer throws
  when the key is absent.
- **Z1r's** supersession count is 80 (round 9: 81), for the same reason.
- `mutants.sh` copies this directory to `<work>/mutroot/r10`. R8-7b is
  re-anchored to the text that updates a commit by its key, and it still makes
  its defect.

## Reproduce

From the repository root, with `GIT_DIR` and `GIT_WORK_TREE` unset:

```sh
E=middleware/context-oracle/docs/reviews/2026-09-28-rebuild-mapping-evidence
R=middleware/context-oracle/docs/reviews/2026-09-29-rebuild-mapping-evidence-r10
W=<work>   # an empty scratch directory; TMPDIR=<work>/tmp for the steps that make temporary files
# 1-2. Builds and real legacy stores, by the 2026-09-28 README's steps 1 and 2.
sh $E/build-builds.sh $W "$PWD"
sh $E/build-stores.sh $W > $W/build-stores.out 2>&1
# 3. The designed-validator build. Output: results/designed-build.out
sh $R/designed-build.sh $W
# 4. The rebuild test with the designed validator (the acceptance run). Output: results/test-rebuild.out
node --no-warnings $R/test-rebuild.mjs $W $W/HEAD-designed
# 5. The same test with HEAD's validator (HEAD-only evidence), in a second copy <work2>. Output: results/test-rebuild-head-validator.out
node --no-warnings $R/test-rebuild.mjs <work2>
# 6. The miner model's test. Output: results/test-recompute.out
(cd $R && node --no-warnings test-recompute.mjs)
# 7. The round-10 reviewer's model cases, against this model. Outputs: results/k10-*.out
for c in k10-recompute-mine k10-termination k10-missing-value k10-bound-supersede; do (cd $R && node --no-warnings cases/$c.mjs recompute.mjs); done
# 8. The reviewer's M10 against this prototype. Output: results/extra10-meta-index.out
node --no-warnings $R/cases/extra10-meta-index.mjs $W $W/HEAD-designed
# 9. Which legacy reads use an index, this prototype and round 9's. Outputs: results/qplan-r10.out, results/qplan-r9.out
node --no-warnings $R/cases/qplan-r10.mjs $W $W/HEAD-designed $W/tmp
#    (round 9's: the same file run from <work>/qroot/r9/cases/, beside a copy of the round-9 rebuild.mjs
#    in <work>/qroot/r9/ and a link <work>/qroot/2026-09-28-rebuild-mapping-evidence to $E)
# 10. VACUUM and rowids on this SQLite. Output: results/vacuum-rowid.out
node --no-warnings $R/cases/vacuum-rowid.mjs
# 11. The mutants. Output: results/mutants.out
sh $R/mutants.sh $W $W/HEAD-designed
# 12. The mapping table: byte-identical to the round-8 evidence's results/mapping-rules.out
node --no-warnings $R/rebuild.mjs --print-rules | cmp - middleware/context-oracle/docs/reviews/2026-09-29-rebuild-mapping-evidence-r8/results/mapping-rules.out
```

### What was run for the recorded outputs

The builds and stores were not rebuilt. `<work>` was
`scratchpad/r10fix/w`, and `<work2>` `scratchpad/r10fix/w2`. Both were made by
copying (`cp -a`) `59cc05c`, `HEAD`, `b229c04`, `oracle{A,B,C}`,
`repo{A,B,C}` and `home{A,B,C}` from `scratchpad/verify-rb.pU4N/`, the source
the round-8 to round-10 reviews copied. That source was left unchanged: a
`sha256sum` of every file under it, taken before the copy and again after the
last run, is identical. The `HEAD` build's `ctxoracle/src` is identical to this
commit's: `diff -rq <work>/HEAD/middleware/context-oracle/ctxoracle/src
middleware/context-oracle/ctxoracle/src` printed nothing. Step 12's `cmp`
printed nothing, so the mapping table is not copied here. Every step that makes
temporary files ran with `TMPDIR=<work>/tmp`.

Each output file is the command's stdout and stderr, with the scratch path
replaced by `<work>` (and `<work2>`); each output ends with the exit status.

## Results

RESULTS-PLACEHOLDER

## Not prototyped

As in the round-9 README:
- the lock databases (AD-26) and the re-check under them;
- the first index and mine after the rename;
- the `status` text and the purge's message text. The rule's result that they
  read is prototyped, and so is the record's `root` that `status` names;
- the rebuild inside `import`, beyond this rebuild run with `--origin import`;
- the purge's refusal bullets other than the legacy-file rule, and its
  `whisper_stats` deletion;
- the schema check on open;
- the legacy-writer race in the purge (a stated residual);
- `init`'s creation of a new-name store;
- the handler beyond its order before the miss rule (as round 9 states it);
- **the miner**: `recompute.mjs` is a model over a synthetic store, with no
  git read and no horizon eviction, and one classifying key standing for
  `miner.max_transaction_entities` and `lexicon.fix_keywords`. Its fault
  records are rows of the model's own `faults` table. The bench is unchanged
  from round 8 and not re-run;
- the designed validator, which is still the one-condition stand-in.
