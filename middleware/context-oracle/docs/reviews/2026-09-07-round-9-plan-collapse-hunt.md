# Independent collapse-hunt — Phase A implementation plan, round 9 (2026-09-07)

**Artifact:** `docs/plans/plan-phase-a.md` (7073 lines, read in full this
session, across sequential `Read` calls with no gaps: 1–400, 401–630,
631–1030, 1030–1430, 1430–1840, 1840–2040, 2040–2440, 2440–2878,
2878–3040, 3040–3440 (Steps 39–43, §8, §9, start of §10), 3440–3620
(§10 D-plan-1..3), 3620–3730 (§10A D-plan-1..5), 3730–4060 (§10A
D-plan-6..8, plan-level entries, N1–N6), 4060–4137 (coverage
attestation), 4137–4341 (§11.1–11.3), 4341–4429 (§11.4–11.6), 4429–4611
(§12 opening, T1-1..T10-2), 4611–4946 (T5-1 spot-check + surrounding),
4946–5145 (T20-1, T21-*, T37-*, T38-1), 5145–5412 (T41-1),
6032–6140 (§12.5 mapping tables), 6140–6260 (§13 Risks, §14 opening),
6256–6469 (§14.1–14.3), 6469–6716 (§14.4 sweep record), 6716–6916
(§15 Q-gap-3/4/5), 6916–7073 (§15 Q-gap-5 continued, §16, end) — at its
current state on branch `claude/plan-correction-strategy-57ot28`,
commit `7696367` ("context-oracle: fix round-8 collapse-hunt and
expert-review findings") and later, confirmed via `git log --oneline
-5` this session before any line citation below.

**Axis:** mission-fidelity (`CLAUDE.md` dominating rule 3 and rule 2's
collapse test); re-verification by independent re-execution of round
8's four closure items; continued generalization of the
execute-don't-assume method, prioritized toward silent defects over
self-revealing ones per round 8's own lesson; attack on every §10A
collapse-test; a check for new load-bearing decisions in §7 lacking a
formal §10A entry.

**Reviewer:** independent subagent, no prior context on this session,
not the author of the plan, any prior fix pass, or any prior review of
it.

**Read in full before the attack:** `middleware/context-oracle/CLAUDE.md`
(full); `docs/collapse-log.md` (full 2026-09-07 entry set, rounds 3
through 8 read closely; 2026-07/2026-08 entries read for pattern
history); `docs/STATUS.md` (full); `OWNER-LEDGER.md` (full);
`docs/specs/spec-context-oracle.md` §8, §11.5, §12, §13, §14 (in full);
`docs/architecture-phase-a.md` AD-2, AD-3, AD-5, AD-9, AD-10, AD-13,
AD-14, AD-20, AD-24, AD-25, AD-26 (in full); both round-8 review
documents in `docs/reviews/` in full
(`2026-09-07-round-8-plan-collapse-hunt.md`,
`2026-09-07-round-8-plan-expert-review.md`); `docs/plans/plan-phase-a.md`
end to end per the `Read` ranges listed above.

**Verification instruments used beyond reading.** A live shell, git
2.43 (this sandbox's system git), Node.js v22.22.2 with `node:sqlite`
— used to **execute**, not recall from memory, the plan's own cited
shell-command and runtime behaviors: `node:sqlite` `PRAGMA
journal_mode`/`PRAGMA busy_timeout`/`PRAGMA quick_check` against both
an in-memory database and a real temp-file database (T3-1's actual
fixture shape); `node:sqlite` behavior against a store deliberately
corrupted at byte 0 (T10-1's induction); `git config --get
remote.origin.url` against four constructed remote configurations
(HTTPS, SSH, scp-like, credentialed) and against a repo with no
remote at all, to check N1's URL-normalization premises; `git log
--no-merges --numstat -M` re-executed against **four** newly
constructed rename scenarios beyond round 8's three — critically, a
same-directory, same-extension rename (`src/foo.ts` → `src/bar.ts`),
the single most ordinary refactor-rename shape — to determine how
commonly the brace-compaction form actually occurs, not merely that
it occurs; `fs.open` with `O_CREAT|O_EXCL` to confirm the round-8
lock-file replacement mechanism itself is correct; a literal,
naive JavaScript implementation of Step 20's own stated regex-and-
capture-group instruction, run against both plain and
brace-compacted `--numstat` lines, to determine whether an
implementer following the plan's text as written would produce
correct or corrupted file paths for each case.

## Verdict: DOES NOT SURVIVE (one new collapse, one new systemic-pattern-continuation finding, one new minor gap; round 8's four closure items hold)

- **Round 8's four closure items verified genuinely closed, by direct
  re-read AND independent re-execution — not by trusting the plan's
  own "corrected this fix pass" annotations or `docs/STATUS.md`'s
  narrative:**
  (a) Step 37 (`docs/plans/plan-phase-a.md:2893–2907`) now describes an
  atomic exclusive-create lock file (`fs.open(lockPath,
  fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_WRONLY)`),
  not `flock`(2) — grepped `flock` across the current document, 0
  hits. Independently re-executed the `O_CREAT|O_EXCL` mechanism this
  session against a real file: first open succeeds, a second open of
  the same path throws `EEXIST` exactly as the plan's text requires.
  **Genuinely closed at the textual level — see Finding 3 below for a
  residual the fix itself introduces.**
  (b) Step 5 (`docs/plans/plan-phase-a.md:936–984`) now explicitly
  distinguishes a failed git invocation (`ok: false` — a non-zero exit,
  the genuinely-no-`.git` case) from a successful invocation returning
  the literal string `'false'` (the bare-repository case), routing the
  first directly to step 4 (`mode='path'`) and only the second to step
  3. `T5-1`'s own spec (`docs/plans/plan-phase-a.md:4622–4630`) states
  the identical distinction as its own "Fails when" clause. Both read
  directly at their current line numbers; independently re-executed
  `git rev-parse --is-inside-work-tree` against a fresh non-git
  directory this session — confirmed it still fails outright (exit
  128, no stdout), corroborating the corrected algorithm is the right
  one, not merely re-reading the correction. **Genuinely closed.**
  (c) Step 20 (`docs/plans/plan-phase-a.md:1867–1926`) now states that
  a `--numstat` line matching `^(.*) => (.*)$` is a rename and that
  "the brace form" is "expand[ed]… into the real old and new paths,"
  adding both to the touched-file set; `T20-1`'s fixture
  (`docs/plans/plan-phase-a.md:4946–4970`) now includes "1 commit
  containing a git-detected file rename" with a "Fails when" clause
  naming both the plain and brace-abbreviated shapes explicitly.
  **Textually present, but — see Collapse 1 below — the fix does not
  actually specify an algorithm capable of producing the claimed
  result for the brace case, and independent execution shows the
  brace case is not a rare corner of this fix but its dominant,
  ordinary case.**
  (d) Step 1 (`docs/plans/plan-phase-a.md:652–663`) and D-plan-3's
  collapse-test (`docs/plans/plan-phase-a.md:3677–3708`) now state the
  version-bounded fact (type stripping default-on only from v22.18.0)
  and the real reason the compile step is needed regardless (`const
  enum FaultCode` requires transformation stripping refuses at any
  version) — matching §11.4's evidence entry
  (`docs/plans/plan-phase-a.md:4384–4401`) verbatim. **Genuinely
  closed.**
- **New collapse this round: 1** (Collapse 1, Step 20 — silent,
  and materially more consequential than round 8's own framing of the
  fix suggested, because independent execution shows the un-handled
  case is the *common* rename shape, not an edge case).
- **New systemic-pattern-continuation finding: 1** (Finding 2 — round
  8's own two collapse-hunt findings, fixed at their primary sites,
  were never swept into §11's claims registry, in the same fix pass
  that correctly swept round 8's two *expert-review* findings into
  that same registry).
- **New minor finding: 1** (Finding 3 — round 8's Step 37 fix
  introduces an untested, unspecified staleness-check sub-claim that
  did not exist in the pre-fix `flock`(2) text).
- **What survives.** Every §10A collapse-test entry (all eight
  D-plan-* entries, all six N1–N6 entries, the three plan-level
  entries) was re-read in full and re-attacked with a question
  independent of round 8's own re-attack; none produced a new crack.
  N1's URL-normalization premises were independently re-verified by
  executing `git config --get remote.origin.url` against constructed
  remotes (see "Collapse-tests re-attacked," below) — survives. The
  PRAGMA claims at Step 3/T3-1 (round 8's own named untested
  candidate) were independently executed against both an in-memory
  and a real temp-file `node:sqlite` database — the real-file result
  matches the plan's claim exactly (`journal_mode` returns `'wal'`),
  and T3-1's own spec already commits to the real-file fixture shape
  that makes the claim true, so this candidate closes clean. No new
  load-bearing decision in §7 lacks a formal §10A entry (Step 20's
  and Step 5's git-command corrections are not decisions in dispute —
  same disposition round 8 gave them — but Step 37's new
  staleness-check sub-claim arguably is one; see Finding 3).

---

## Collapses

### Collapse 1 — Step 20's round-8 "expand the brace form" fix never specifies an expansion algorithm, and a literal reading of its own stated regex reproduces the exact corruption the fix exists to close, for what independent execution shows is the *ordinary* rename shape, not an edge case

**What the plan says.** `docs/plans/plan-phase-a.md:1869–1879` (Step 20
— Co-change miner, "What changes"):

> "for each `--numstat` line, if the third (path) field matches
> `^(.*) => (.*)$` (a `-M`-detected rename, with or without
> brace-abbreviated shared-prefix/suffix compaction, e.g.
> `src/{utils => other}/c.txt`), expand the brace form if present into
> the real old and new paths and add **both** to that commit's touched-
> file set; otherwise the field is a plain path, added as-is."

This is the entirety of the algorithm's specification. Nowhere in Step
20's body, nowhere in `T20-1`'s spec (`docs/plans/plan-phase-a.md:4946–4970`),
and nowhere else in the document is there a stated rule for: how to
detect that a `{`/`}` pair is present; where the prefix ends and the
brace segment begins; how to split the *inside* of the brace pair on
` => ` as distinct from a possible outer-level ` => ` occurring outside
any braces; or how to reconstruct the two full paths from a prefix, an
inner old/new pair, and a suffix.

**How this was verified — and found to reproduce the exact defect the
fix claims to close.** The plan's own stated detection rule is: "if the
third field matches `^(.*) => (.*)$`." Applying that regex literally —
the only rule the plan actually gives — to the plan's own example
string:

```
$ node -e '
function naiveParse(field) {
  const m = field.match(/^(.*) => (.*)$/);
  if (m) return { old: m[1], new: m[2] };
  return { old: field, new: field };
}
console.log(naiveParse("src/{utils => other}/c.txt"));
console.log(naiveParse("plain.txt => plain2.txt"));
'
{ old: "src/{utils", new: "other}/c.txt" }
{ old: "plain.txt", new: "plain2.txt" }
```

The plain-rename case (`plain.txt => plain2.txt`) parses correctly
under the plan's stated rule. The brace-abbreviated case — the plan's
own cited example — does **not**: the greedy `.*` in the plan's own
regex matches up to the *only* occurrence of `" => "` in the string,
which is nested inside the braces, producing `old: "src/{utils"` and
`new: "other}/c.txt"` — two strings containing literal `{`/`}`
characters that correspond to no real file on disk and no real row in
the `files` table. This is not a hypothetical implementer error; it is
the literal, mechanical result of applying the one rule the plan's text
actually states ("matches `^(.*) => (.*)$`") to the one example the
plan's own text cites. The clause "expand the brace form if present"
names a *requirement* without supplying the *mechanism* — detecting the
brace pair, splitting inside it specifically, and reconstructing
`prefix + old_inner + suffix` / `prefix + new_inner + suffix` — the
exact shape of gap round 8's own Step 5 finding named ("the plan names
the case but not the mechanism, leaving the implementer to invent it,"
which `expert-plan`'s "no single decision made on the fly" standard
does not permit).

**Why the un-handled case is the *common* one, not an edge case —
verified by execution, going beyond round 8's own three scenarios.**
Round 8 constructed three rename shapes (a non-similar rename, a pure
move, a subdirectory move with a shared prefix/suffix) and found all
three collapse to non-plain-path forms except the "non-similar"
case. This round constructed a fourth, more basic scenario — the most
ordinary refactor-rename a developer performs, renaming one file to
another name **in the same directory with the same extension**:

```
$ cd /tmp/renametest4 && git init -q
$ echo "one two three four five six seven eight nine ten eleven twelve" > src/foo.ts
$ git add -A && git commit -q -m add
$ git mv src/foo.ts src/bar.ts && git commit -q -am rename
$ git log --no-merges --numstat -M --format="COMMIT %H"
COMMIT 55398f40eaf6f14de42f1459ffa70e3d01aa10a8

0	0	src/{foo.ts => bar.ts}
```

Even this simplest possible rename — no directory change, same
extension, same length — collapses to the brace-abbreviated form, not
the plain `old => new` form Step 20's naive rule handles correctly. (A
control case, `aaa_file.txt => bbb_file.txt`, similarly short and
same-directory, produced the *plain* form under the same git version —
confirming git's compaction heuristic is not simply "any shared
prefix/suffix" but is nonetheless triggered by the single most common
real-world edit: renaming a file within its own directory.) This means
the brace-abbreviated form is not `-M`'s exotic corner case that a
fixture might reasonably fail to plant by accident — it is the
**dominant shape** for the kind of rename that actually occurs during
the "spec/architecture/plan/review churn" and code reorganization
Step 42's own text names as characteristic of real repository history,
including `Maxcogar/agent-armory` itself.

**Why `T20-1`'s own fixture may not catch this before the exit run.**
`T20-1`'s Data field (`docs/plans/plan-phase-a.md:4958–4961`) says only:
"1 commit containing a git-detected file rename (partway through the
planted coupling history)… added this fix pass, round 8." It does not
specify the old and new paths chosen for that rename, so it is not
possible to confirm from the plan's own text whether the fixture's
single rename exercises the brace-compacted shape at all — and per the
execution above, an author writing this fixture the way most fixtures
are written (a natural-feeling in-place or same-directory rename) is
more likely than not to land on the brace form by construction, but a
fixture author who instead reuses round 8's own example scenario or
picks two dissimilar filenames could just as easily land on the plain
form and never exercise the actual gap. The "Fails when" clause
(`docs/plans/plan-phase-a.md:4966–4970`, "the `old => new`/brace-
abbreviated `--numstat` line was ingested as a literal path or silently
dropped") names both shapes as failure conditions the test is supposed
to catch, but a single planted commit cannot exercise both shapes at
once — so at most one of the two named failure modes is actually
tested by the Data field as currently specified, and the plan does not
say which.

**Why this is silent, not self-revealing — the exact axis round 8's
own lesson prioritizes.** Per round 8's own finding on this same
mechanism: an unparsed rename line does not throw. Following the
naive-but-literal reading of Step 20's stated rule, `"src/{utils"` and
`"other}/c.txt"` are inserted as `files` rows (SQLite's STRICT schema
constrains column *types*, not path well-formedness, so a garbage
string is a perfectly valid TEXT value) and as members of
`cochange_pairs` canonical pairs for that commit. No exception fires;
no diagnostic is raised; the commit is recorded as successfully mined.
The result is a phantom file identity that never resolves to any real
path, silently fragmenting the coupling evidence for the pre-rename
file (which now has commits recorded against a synthetic
`"src/{utils"` identity instead of its real `src/foo.ts` identity) —
precisely the "wrong data that looks like right data" failure mode
round 8's own lesson names as the more dangerous class, recurring here
*inside the very fix meant to close the first instance of it*, one
layer deeper.

**What correct disposition looks like.** Replace "expand the brace form
if present into the real old and new paths" with an actual algorithm,
e.g.: "First check whether the third field contains a `{`...`}` pair
containing ` => ` (the brace-compacted form). If so: let `prefix` be
the text before `{`, `suffix` the text after the matching `}`, and
`inner_old`/`inner_new` the two halves of the brace content split on
` => `; the old path is `prefix + inner_old + suffix` and the new path
is `prefix + inner_new + suffix`. Only if no `{`...`}` pair is present,
fall back to splitting the whole field on the top-level ` => ` (the
plain full-path rename case)." Then make `T20-1`'s fixture construct
its planted rename explicitly as a same-directory rename (the
verified-common brace-triggering shape, e.g. `src/foo.ts` →
`src/bar.ts`) so the fixture actually exercises the harder of the two
cases the "Fails when" clause already claims to cover, rather than
leaving which shape gets planted unspecified.

---

## Finding 2 — Round 8's own two collapse-hunt findings (Step 5, Step 20) were fixed at their primary sites but never swept into §11's claims registry, in the same fix pass that correctly swept round 8's two expert-review findings into that registry

**What the plan says §11 exists to do.**
`docs/plans/plan-phase-a.md:4139–4141` (§11's own opening line): "Every
factual claim this plan asserts, with the read-level evidence that
establishes it." Round 6 and round 7's collapse-log entries both
independently sharpen this into a standing rule: "this claim was
plan-original, never logged in the plan's own claims registry despite
that registry's stated job being 'every factual claim this plan
asserts'" (round 7, on the `SqliteError` finding); this project's own
round-8 expert-review re-applied the identical rule to its own two
findings and explicitly required logging them
(`docs/reviews/2026-09-07-round-8-plan-expert-review.md`, "Recommended
Priority" item 3: "Log both in §11 as part of either fix… so a ninth
round's enumeration… does not have to rediscover them from scratch").

**What the fix pass actually did.** Grepped `flock` and
`node:test`/`type strip` claims against §11.4
(`docs/plans/plan-phase-a.md:4341–4402`) — both round-8
**expert-review** findings (the `flock`(2)-is-unimplementable claim,
the version-bounded type-stripping claim) are present as full §11.4
entries, each with direct-execution evidence and a corroborating
`WebFetch` citation, exactly as the expert-review's Recommended
Priority item 3 asked. Grepped the same §11 section (all of §11.1
through §11.6, lines 4137–4461) for any mention of `rev-parse`,
`is-inside`, `git log`, `numstat`, or `rename` — **zero hits**. Round
8's own two **collapse-hunt** findings — the `git rev-parse
--is-inside-work-tree` invocation-failure distinction now encoded in
Step 5's algorithm, and the `git log --numstat -M` rename-output-shape
fact now (partially — see Collapse 1) encoded in Step 20's algorithm —
are each externally-verified factual claims about tool behavior,
discovered by direct execution this session per round 8's own
attestation, and each is exactly the kind of claim §11's stated
scope names. Neither has a §11 entry.

**Why this is the same recurring pattern this document has now shown
in eight of nine rounds, at a new site.** `docs/collapse-log.md`'s
round 2 through round 8 entries all name the identical shape: a fix
that lands correctly at its primary site (here: Step 5's and Step 20's
own bodies, and their respective `T5-1`/`T20-1` specs — all four
correctly updated) but is not swept to every secondary surface that
should independently restate it (here: the §11 claims registry,
whose entire purpose is to be that secondary restatement, with its own
read-level evidence, separable from the step body that uses the
claim). The fact that the *same fix pass*, touching the *same round's*
findings, correctly performed this sweep for the sibling
expert-review findings and not for the collapse-hunt findings shows
this is not a structural inability to comply — the discipline was
applied inconsistently within one commit, exactly the kind of
"a fix pass reliably corrects the site(s) a review names and reliably
fails to mechanically re-diff every other surface that cites the same
fact" pattern the collapse-log's round-4 entry already generalizes.

**Why this matters beyond bookkeeping.** §11's own stated value (per
its legend, `docs/plans/plan-phase-a.md:4143–4147`) is that a future
session can trust the registry as a complete index of what has been
externally verified and when, without re-reading every step body for
embedded citations. A registry that is silently incomplete for exactly
the newest, most novel class of finding (execute-don't-assume
shell-command verification, the method that has produced a finding in
every one of rounds 6, 7, and 8) undermines the registry's value
precisely where it would matter most to a round 10 or an implementer
looking for "what has already been checked by execution here."

**What correct disposition looks like.** Add two entries to §11.4
mirroring the two already present for the expert-review findings:
one for the `git rev-parse --is-inside-work-tree` exit-128-vs-printed-
`'false'` distinction (citing Step 5, `T5-1`), and one for the `git log
--numstat -M` rename-output-shape fact (citing Step 20, `T20-1`) —
each with the same direct-execution evidence round 8's own collapse-
hunt document already recorded, so a future round's enumeration of
"every checkable claim" (the method round 8's expert-review itself
used against §11 to find its own two omissions) finds these already
logged rather than rediscovering them a second time.

---

## Finding 3 (Minor) — Round 8's Step 37 fix replaces `flock`(2) with a correct locking primitive, but introduces a new "mtime/PID staleness check" sub-claim that is both unspecified and untested — a small residual the fix itself created

**What the plan says.** `docs/plans/plan-phase-a.md:2893–2899` (Step 37,
"What changes," second bullet, as corrected this round-8 fix pass):
"The detached reindex takes a directory lock via an atomic exclusive-
create lock file… on `<home>/projects/<key>/.reindex.lock`, throwing
`EEXIST` if another process already holds it, **with an mtime/PID
staleness check so a crashed process's stale lock does not permanently
block future reindex attempts**."

**What is missing.** The pre-fix `flock`(2) text (per round 8's own
citation of it) never mentioned a staleness check at all — kernel-held
`flock`(2) locks are automatically released when the holding process
dies, so no staleness logic was needed under the old (unimplementable)
design. The new, correct `O_CREAT|O_EXCL` mechanism genuinely does need
one (an advisory lock file left behind by a crashed process would
otherwise block reindexing forever), so naming the requirement is the
right call — but the requirement is stated as a bare noun phrase with
no algorithm: no staleness age threshold, no specification of what "a
PID check" means operationally (the two live options — reading a PID
recorded in the lock file's contents and probing liveness via
`process.kill(pid, 0)`, versus relying on the lock file's `mtime`
alone — have different failure characteristics and the plan picks
neither).

**Verified absent, not merely unread.** Grepped `staleness`,
`.reindex.lock`, `EEXIST`, and `refreshIfStale` across the entire
document — the only staleness mention is the one clause quoted above;
no companion algorithm appears anywhere else. Checked every T-ID that
could plausibly cover it: `T37-1`/`T37-2`
(`docs/plans/plan-phase-a.md:5117–5144`) test SQLite-level
`SQLITE_BUSY` retry-once and `whisper_stats` fold serialization — a
different concurrency mechanism entirely, not the reindex directory
lock; `T21-1`/`T21-2` (`docs/plans/plan-phase-a.md:4972–5013`) test
indexer symbol population and the `oracleSpawn`-not-raw-`spawn`
confinement, not the lock file's acquire/stale-detect behavior.
§12.5's own AC-13 → T-ID row (`docs/plans/plan-phase-a.md:6069`, `T20-1,
T37-1`) confirms this is the exhaustive test mapping for this area —
neither T-ID exercises the lock file at all.

**Why this is Minor, not a collapse.** The core replacement mechanism
(atomic exclusive-create) is itself correct and independently
re-verified this session (see "Round 8's four closure items," item
(a)). The gap is narrower than Collapse 1: it is a plausible,
bounded, single-file mechanism (a lock file with a liveness check) that
any competent implementer would build correctly by consulting any of
the several well-known Node lock-file libraries' documented approach,
and its failure mode (a stale lock blocking reindex until manually
removed) degrades index freshness — lowering confidence per `FR-K7`,
never blocking the agent path — rather than corrupting data silently.
It is flagged because it is a **new** plan-level judgment this specific
fix pass introduced with no §10A collapse-test entry (the pre-fix text
had no staleness claim to collapse-test in the first place) and no
test coverage, the same "new load-bearing decision without a formal
entry" class this round was instructed to check for.

**What correct disposition looks like.** State the staleness rule
concretely (e.g.: "the lock file's own mtime older than a tunable
threshold, default 10 minutes — well beyond any real index run —
is treated as stale and removed before retrying acquisition; no PID
check is needed because mtime alone suffices for a single-host,
single-user tool") and add a unit test (`T37-3`, or fold into
`T37-1`) that plants a stale lock file and asserts the reindex
proceeds rather than blocking forever.

---

## Collapse-tests re-attacked (all survive; no new crack)

Every §10A entry (all eight D-plan-* entries, N1–N6, and the three
plan-level entries, `docs/plans/plan-phase-a.md:3412–4133`) was
re-read in full and pushed with a question independent of round 8's
own re-attack:

- **D-plan-1 (build order / C1's write-time cap).** Pushed: does the
  cap survive a *new* recognizer file whose predicate array is
  constructed at runtime from a `tuning`-table read rather than a
  source-level literal (so the built-output grep sees no literal array
  to count)? Re-read `T18-3`'s spec — it greps the **built** predicate
  array literal in `dist/blocks/health.js`; a runtime-constructed
  array from `tuning` would indeed evade this specific grep. This is a
  real, narrow gap in the cap's own mechanization, but it is not a
  *new* collapse this round — `checkDenyBypassSuspect`'s predicate
  list is explicitly specified as a source-level literal
  (`docs/plans/plan-phase-a.md:1722–1724`, "predicate: `>`, `>>`,
  `tee`,…"), and moving it to a `tuning`-backed runtime list would
  itself be the kind of "recognizer growth" C1 exists to force a
  collapse-test for — the cap's own text already treats that move as
  requiring a new decision, not a silent evasion. Survives.
- **D-plan-2 (dependency floor).** Re-verified round 6/7's semver fix
  holds: `semver.satisfies('0.27.0', '^0.26.13')` independently
  re-run this session → `false`. Survives.
- **D-plan-3 (`node:test` runner).** Re-pushed against this round's
  own Collapse 1: does the `dist-test/` compile step's own build
  process ever touch git-derived file paths in a way that could be
  affected by a rename-corrupted `files` table? No — `dist-test/` is
  produced by `tsc` compiling `src/`+`test/`, entirely independent of
  the miner's runtime output; no interaction. Survives.
- **D-plan-4/D-plan-5 (sqlite3 shell; deterministic fixtures).**
  Re-pushed D-plan-5 specifically against Collapse 1: could a fixture
  generator's own deterministic-seed content accidentally produce a
  filename pair that never triggers git's rename-similarity detector
  at all (so `T20-1`'s planted "rename" silently degrades to two
  ordinary add/delete lines, testing nothing)? This is a real,
  disclosed risk given the corrected `T20-1` fixture must now be
  written to deliberately trigger the brace form (Collapse 1's
  disposition) — noted as a construction risk for whoever writes the
  fixture, not a new collapse in the *decision* to use generators
  (D-plan-5's own job — auditable construction — is unaffected).
  Survives as a collapse-test; flagged as an implementation
  consideration for Collapse 1's fix.
- **D-plan-6 (retracted).** Re-confirmed no residual defense of the
  retracted owner-run-probe design (fresh grep for "markdown probe" —
  2 hits, both explicitly past-tense, matching round 8's finding).
  Survives.
- **D-plan-7 (CI tier split).** No new crack under a fresh push on
  whether Step 20's residual (Collapse 1) would be caught by the unit
  tier before merge — it would, if and only if `T20-1`'s fixture is
  corrected per this round's disposition; D-plan-7's own "guide, not
  gate" answer about reviewer discretion is unaffected by whether one
  specific fixture is complete. Survives.
- **D-plan-8 (settings.json marker via `command` prefix).** Re-checked
  for a stale invented-field reference — none found. Survives.
- **N1 (URL normalization).** Re-pushed harder than round 8's own
  re-attack: round 8 confirmed Collapse 1 (Step 5's git-invocation
  distinction) is upstream of and independent from N1's URL-scope
  question. This round instead tested N1's own underlying premise by
  execution — does `git config --get remote.origin.url` ever produce
  an ambiguous "looks successful but isn't" output the way `git
  rev-parse --is-inside-work-tree` does? Executed against four
  constructed remote configurations (HTTPS, SSH `git@host:path`,
  `ssh://host:port/path`, a credentialed HTTPS URL) and against a repo
  with no remote configured at all: every one of the first four prints
  exactly what was configured (git performs no normalization of its
  own — confirming the plan's own axes (a)–(g) are the entire
  normalization burden, not assisted by any git-side canonicalization);
  the no-remote case fails cleanly (exit 1, no stdout, no stderr) with
  no ambiguous "prints a falsy-looking string" case analogous to
  Step 5's `is-inside-work-tree` trap. N1's "if no origin, fall to (3)"
  clause is therefore unambiguous as written, unlike Step 5's original
  "→ false" label was. Survives, independently strengthened.
- **N2 (`deny_bypass_suspect` coverage bound).** Re-confirmed both-
  direction disclosure intact at Step 18/33. Survives.
- **N3/N4 (bar defaults, clearing length floor).** Re-pushed: no
  caching residual found (`tuning` read at recognizer-construction
  time, confirmed at Step 14 line 1445 — matching round 8's finding).
  Survives.
- **N5 (`oracleSpawn` placement).** Re-verified Step 21 still calls
  `oracleSpawn` (not raw `child_process.spawn`) before Step 38 in
  build order, and — pushed against this round's Finding 3 — that the
  Step 37 lock-file mechanism does not itself need `oracleSpawn`
  (it's a same-process `fs.open` call inside the already-spawned
  detached child, not a further spawn site). Survives.
- **N6 (confinement-grep scope).** Re-verified the `dist/`/
  `dist-test/` partition remains structural. Survives.
- **Plan-level: Checkpoint placement, Test tier split, Exit-run report
  shape.** All three re-read. **Pushed specifically on Exit-run report
  shape against this round's Collapse 1:** identical reasoning to
  round 8's own finding on Collapse 2 — a rename-corrupted (or
  rename-fragmented) coupling signal on `Maxcogar/agent-armory`'s own
  real rename history would again read as a lower, honest-looking
  coverage number, indistinguishable inside the exit report's own
  format from the genuine low-coverage floor Phase A is designed to
  report. This is the identical residual round 8 already named for
  its own Collapse 2; this round's finding is that round 8's own fix
  for it did not fully close the underlying gap (Collapse 1), so the
  report-shape risk it flagged is not yet retired. Survives as a
  collapse-test; the interaction is additional evidence for Collapse
  1's severity, not a new defect in the report-shape decision itself.

## New load-bearing decisions §10A missed

**One candidate found, disposed as Minor rather than requiring a full
entry:** Step 37's new "mtime/PID staleness check" clause (Finding 3)
is a plan-level judgment this specific fix pass introduced (the
pre-fix `flock`(2) text had no staleness claim at all, since kernel
locks release automatically on process death) with no formal §10A
entry and no test. Unlike N1–N6 (each a genuine multi-option design
choice with real alternatives worth attacking), the staleness
mechanism has one obvious correct shape (an mtime-age threshold) and
low stakes (a stale lock degrades freshness, never agent-visible
behavior) — disposed here as a Minor completeness gap (Finding 3)
rather than elevated to a numbered N7, consistent with round 8's own
disposition of its two collapse findings as "factual gaps in
already-collapse-tested mechanisms," not new decisions.

Every other §7 step was re-read against §10A's own coverage-attestation
paragraph (`docs/plans/plan-phase-a.md:4106–4133`); no other step's
content was found to contain an undisclosed plan-level judgment lacking
a formal collapse-test entry.

---

## Mission-fidelity cross-trace

- **"Honest deterministic foundation," "running on the owner's real
  repos," "clean seams the later phases plug into."** Collapse 1
  strikes here directly and more sharply than round 8's own framing of
  the same underlying mechanism suggested: round 8 treated the
  brace-compaction case as one of several rename shapes needing
  handling; this round's execution shows it is the *dominant* shape
  for the most ordinary refactor-rename, meaning the residual gap
  round 8's fix left open is not a rare corner but the common case —
  directly threatening the co-change miner's evidence quality on
  exactly the kind of repository history (reorganizations, file
  renames) that real projects, including `Maxcogar/agent-armory`
  itself, generate constantly.
- **"Measures its own floor — how little it catches."** As the
  "Collapse-tests re-attacked" section notes for Exit-run report
  shape, a rename-fragmented coupling signal on real repos would again
  read as a lower, plausible-looking coverage number — indistinguishable
  from the honest low floor Phase A is supposed to report, inside the
  exit report's own current format. Round 8 already named this
  interaction for its own finding; this round's finding is that the
  underlying gap survives round 8's fix, so the risk to the exit
  report's trustworthiness is not yet retired.
- **"Verify external facts... before building on them" / the
  execute-don't-assume method, generalized further.** Finding 2 shows
  the method's *product* (a verified fact) can itself go unrecorded
  even when the method is correctly applied — round 8 genuinely
  executed the git commands and found the real behavior, but the
  fix pass's own bookkeeping discipline (sweep every claim into §11)
  was applied unevenly within the same commit. This is a new angle on
  the recurring "fix lands at its primary site, not swept everywhere"
  pattern: here, the *execution evidence itself*, not a claim's plain
  text, is the thing left unswept.
- **"Never fake completeness dressed to look like a working product."**
  Collapse 1 is precisely this shape at a second remove: round 8's fix
  *reads* as fully closing the rename-handling gap (its own prose
  cites the exact brace example and says it is "expanded"), but the
  actual mechanism for doing so was never executed against that
  example — the same "asserts more completeness than it had actually
  earned" pattern round 8 itself named, recurring inside round 8's own
  remediation of the first instance.

---

## Attestation

- **What I read in full this session (2026-09-07).** `middleware/
  context-oracle/CLAUDE.md`; `docs/collapse-log.md` (2026-09-07 entry
  set through round 8, read closely; earlier entries sampled for
  pattern history); `docs/STATUS.md`; `OWNER-LEDGER.md` (both in
  full); `docs/specs/spec-context-oracle.md` §8 (326–544), §11.5
  (739–777), §12 (780–873), §13 (874–906), §14 (908–1138) — read in
  full; `docs/architecture-phase-a.md` AD-2 (325–365), AD-3 (366–416),
  AD-5 (568–646), AD-9 (736–923), AD-10 (924–946), AD-13 (1043–1072),
  AD-14 (1073–1129), AD-20 (1377–1413), AD-24 (1513–1629), AD-25
  (1630–1649), AD-26 (1650–1674) — all in full; both round-8 review
  documents in full; `docs/plans/plan-phase-a.md` (7073 lines) read
  end to end across the `Read` call ranges listed at the top of this
  document.
- **What I verified against a live instrument, not memory or a prior
  review's own attestation.** `node:sqlite` `PRAGMA journal_mode` /
  `busy_timeout` / `quick_check` against both an in-memory database
  (returns `'memory'` for journal_mode — a genuine trap for a careless
  fixture, but not one T3-1 falls into, since T3-1's own spec commits
  to a real temp-file database) and a real file (`'wal'`, matching the
  plan's claim exactly). `node:sqlite` against a store corrupted at
  byte 0 (T10-1's induction): reopen succeeds, a subsequent query
  throws `ERR_SQLITE_ERROR` with message "file is not a database" —
  self-revealing exactly as T10-1 requires. `git config --get
  remote.origin.url` against four constructed remote configurations
  and a no-remote repo (N1's re-attack). `git log --no-merges --numstat
  -M` re-executed against a **fourth** rename scenario beyond round
  8's three (a same-directory, same-extension rename) — the scenario
  that produced this round's central finding. A literal JavaScript
  implementation of Step 20's own stated regex-and-capture-group rule,
  run against both a plain and a brace-abbreviated `--numstat` line —
  produced the correct result for the first and a corrupted result for
  the second, reproducing the defect the fix claims to close.
  `fs.open` with `O_CREAT|O_EXCL` against a real file, confirming the
  round-8 lock-file replacement mechanism itself (Finding 3's "what
  survives" component) is sound.
- **Search strategy, and how it differed from every prior round's.**
  Rounds 2–7 searched for citation drift and stale cross-references;
  round 8 generalized to executing shell commands whose output the
  plan's logic parses or branches on, finding two new collapses. This
  round applied round 8's own method **recursively to round 8's own
  fixes**: rather than treating "the fix now says X" as sufficient
  (a re-read), it asked "does the fix's *own* stated mechanism, taken
  literally, actually produce X when executed against the fix's own
  cited example?" — a distinct check from round 8's own verification,
  which confirmed the *problem* was real but did not re-execute the
  *proposed solution's* own literal text against the same instrument.
  This is the generalization the task explicitly requested ("verify
  round 8's fixes are genuinely closed... by direct re-read AND
  independent re-execution") applied one level deeper than a
  surface-level "does the corrected sentence now say the right thing"
  check. Separately, this round enumerated the two round-8
  collapse-hunt findings against §11's own registry (a completeness
  check on the registry itself, a method round 8's own expert-review
  used against §11 to find its own two logging omissions, applied
  here to the two entries that same review's Recommended Priority did
  not name).
- **Confidence.**
  - **High** on Collapse 1 — a direct, literal execution of the plan's
    own stated regex against the plan's own cited example, reproducing
    corrupted output; cross-checked against a fourth, independently
    constructed rename scenario (same-directory, same-extension) that
    confirms the un-handled shape is the ordinary one, not a
    contrived edge case.
  - **High** on Finding 2 — a direct grep of the full §11 section (all
    six subsections) for any trace of the two claims, returning zero
    hits, contrasted directly against the two sibling entries that
    *are* present in the identical fix pass.
  - **Medium-high** on Finding 3's severity classification (Minor) —
    the missing staleness algorithm is real and verifiably untested,
    but its blast radius (index staleness, never agent-visible
    behavior, self-healing once any process successfully reindexes)
    is genuinely bounded compared to Collapse 1's silent data
    corruption; a future round could reasonably argue for elevating it
    if the staleness gap is shown to interact badly with the
    detached-child spawn cadence, which this round did not test.
  - **Medium-high**, not absolute, on "no other new collapse this
    round" — the full document read plus the specific re-attacks
    listed above came back clean, but (per every prior round's own
    demonstrated lesson, most sharply round 5's) a differently-scoped
    search could still find something this round's method did not
    test for. Disclosed honestly per `CLAUDE.md`'s "verify before you
    assert" rule rather than asserted as completeness.
- **What would make me revise the verdict up (to SURVIVES on Collapse
  1 specifically).** Discovery that Step 20's actual planned
  implementation (not yet written — Phase A is greenfield) was always
  going to consult a general-purpose git-diff-rename-parsing routine
  (several exist in common libraries) that correctly implements the
  prefix/inner/suffix reconstruction regardless of what the plan's own
  prose says — but the plan's own text is what an implementer executes
  "without making a single decision on the fly" (`expert-plan`'s own
  standard, the same standard round 7 and round 8 both invoked), and
  no such routine or reference is named anywhere in the document.
  Discovery that `T20-1`'s fixture, once actually written, happens to
  plant a rename shape that inevitably triggers brace compaction *and*
  that the miner's implementation is written by someone who already
  knows the correct algorithm despite the plan not stating it — this
  would make the practical outcome safe but would not change the
  plan's own text being underspecified, which is what a collapse-hunt
  evaluates.
- **What would make me revise down further.** Nothing found this round
  deepens any of the three findings beyond what is stated. Collapse
  1's blast radius is contained to the four genres Step 20's own text
  already names as miner-dependent (Coupling, Consequence,
  Completeness, Warning) — it does not affect the answer-drift block,
  security, delivery, or CLI correctness. Finding 2 is a bookkeeping
  gap with no runtime effect. Finding 3 degrades index freshness only,
  never agent-visible behavior, and self-heals on the next successful
  reindex.

*End of round-9 collapse-hunt. Trajectory across nine rounds on this
plan: round 1 — 3 collapses; round 2 — 1 collapse; round 3 — 2
collapses; round 4 — 2 collapses; round 5 — 2 collapses (one
incomplete); round 6 — 1 collapse; round 7 — 1 collapse + 3 Minor;
round 8 — 2 collapses, 0 Minor; round 9 — 1 collapse + 1
systemic-pattern-continuation finding + 1 Minor, found by applying
round 8's own execute-don't-assume method recursively to round 8's own
fixes rather than only to the document's older, unexamined claims. The
pattern holds, nine rounds running: each round's distinct method finds
something every previous round's method structurally could not see —
this round's specific addition is that a fix which *reads* as closing
a collapse is not verified closed until the fix's own literal
mechanism is executed against its own cited example, not merely
re-read. Dispatch round 10 after this fix lands, instructed to
re-execute Step 20's corrected brace-expansion algorithm (once written)
against both a same-directory rename and a cross-directory rename with
no shared prefix/suffix, to confirm the actual fix (not merely the
intent to fix) closes the gap, and to independently verify the two new
§11.4 entries this round's Finding 2 recommends actually get added.*
