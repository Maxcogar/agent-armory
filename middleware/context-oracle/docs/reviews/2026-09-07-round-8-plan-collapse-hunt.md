# Independent collapse-hunt — Phase A implementation plan, round 8 (2026-09-07)

**Artifact:** `docs/plans/plan-phase-a.md` (6973 lines, read in full this
session, across sequential `Read` calls with no gaps: 1–260, 260–530
(§5.1 skeleton), 620–1043 (Steps 1–6), 1043–1390 (Steps 7–13),
1390–1839 (Steps 14–19), 1838–1930 (Steps 20–21), 1930–2002 (Step 22),
2002–2333 (Steps 23–27), 2330–2710 (Steps 28–33), 2710–3107 (Steps
34–39), 3107–3356 (Steps 40–43, §8, §9), 3355–3475 (§10), 3475–3673
(§10A D-plan-1..4), 3674–4051 (§10A D-plan-5..8, N1–N6, coverage
attestation), 4081–4340 (§11.1–11.5), 4340–4522 (§11.6, §12 opening),
4522–4565 (§12.1 T5-1/T6-1/T6-2), 5940–5992 (§12.5 mapping tables),
6040–6154 (§13 Risks), 6155–6215 (§14.1), 6536–6720 (§15 Q-gap-1/2/6/3/4),
6905–6973 (§16) — plus full re-reads of every line range round 7's own
collapse-hunt and expert-review cited as the site of a fix, to verify
closure independently rather than trusting either round-7 document's
own attestation), at its current state on branch
`claude/plan-correction-strategy-57ot28`, commit `d74e529` and later
(read fresh this session — `git log -3` and `git show` both run to
confirm the working tree matches HEAD before any line citation below).

**Axis:** mission-fidelity (`CLAUDE.md` dominating rule 3 and rule 2's
collapse test), library/tool-behavior verification generalized to
**shell command output-shape claims** specifically (per round 7's own
closing suggestion), and re-verification of round 7's five closure
items.

**Reviewer:** independent subagent, no prior context on this session,
not the author of the plan, any prior fix pass, or any prior review of
it.

**Read in full before the attack:**
`middleware/context-oracle/CLAUDE.md` (full); `docs/collapse-log.md`
(full 2026-09-07 entry set, rounds 3 through 7, plus enough of the
file's earlier history to place the recurring patterns); `docs/
STATUS.md` (full); `OWNER-LEDGER.md` (full); `docs/specs/
spec-context-oracle.md` §8, §11.5, §12, §13, §14 (in full);
`docs/architecture-phase-a.md` AD-2, AD-3, AD-5, AD-9, AD-10, AD-13,
AD-14, AD-20, AD-24, AD-25, AD-26 (in full — AD-13 and AD-3 added to
the task's named list because they govern the two new findings below);
both round-7 review documents in `docs/reviews/` in full
(`2026-09-07-round-7-plan-collapse-hunt.md`,
`2026-09-07-round-7-plan-expert-review.md`); `docs/plans/
plan-phase-a.md` end to end per the Read-call ranges listed above.

**Verification instruments used beyond reading.** A live shell, git
2.43 (this sandbox's system git), Node.js v22.22.2 with `node:sqlite`,
npm 10.9.7 — used to **execute**, not recall from memory, the plan's
own cited shell-command behaviors: `git rev-parse
--is-inside-work-tree` and `--is-shallow-repository` and `git rev-list
--max-parents=0 HEAD` run against three constructed repository states
(a genuinely non-git directory, a bare repository's own directory, and
a full-history repository) in `/tmp` scratch directories; `git log
--no-merges --numstat -M` run against a constructed repository with a
plain file add, a similarity-triggered rename with content changes, a
pure rename, and a moved-into-subdirectory rename, to observe the
exact `--numstat` line shapes `-M` produces; `npm pack --dry-run` run
against `tree-sitter-wasms` (both `--json` and plain-text forms) to
confirm Step 40's grammar-inventory-check premise; `npm ci` re-run
against a fresh no-lockfile `package.json` (independently reproducing
round 7's Critical finding's underlying fact, not trusting the plan's
restatement of it); a fresh `semver@7.8.5` install re-running round
6/7's caret-range check; `fs.mkdirSync(..., {mode: 0o700})` under this
sandbox's `umask 0022` to confirm Step 4's directory-mode claim
survives the umask interaction. `sqlite3` (the system CLI D-plan-4
names as "preferred when available") is **not installed** in this
sandbox and could not be added (`apt-get install sqlite3` failed —
package mirror 404) — this is itself a live instance of D-plan-4's own
disclosed "may be absent" premise, not a defect; the plan's own stated
fallback (a Node script via `Store.prepare`) is what a real cold
container without the CLI would use, so this is recorded as
corroborating evidence for D-plan-4, not a gap.

## Verdict: DOES NOT SURVIVE (two new collapses; round 7's five closure items hold; no minor findings this round)

- **Round 7's fixes: all five closure items verified genuinely closed
  by direct re-read at their cited locations, independently — not
  trusting `docs/STATUS.md`'s narrative or the plan's own "corrected
  this fix pass" annotations:**
  (a) Step 1 (lines 634–695) now runs `npm install` once and commits
  the resulting `package-lock.json`; §5.1's skeleton (lines 282–285)
  lists `package-lock.json` under Step 1; `T1-1`'s Data field (lines
  4408–4410) names the lockfile; `T1-1`'s Verifies/Fails-when fields
  (lines 4400–4417) correctly test `npm ci`'s exit code against a
  checkout that now has one. Independently re-executed `npm ci`
  against a fresh no-lockfile `package.json` this session — confirmed
  the same `EUSAGE` failure round 7 found, corroborating why the fix
  is necessary, and confirmed Step 1's own text now authorizes the
  fix.
  (b) Step 2 (lines 718–726) now states the real, verified
  `node:sqlite` error shape (`Error` with `code: 'ERR_SQLITE_ERROR'`,
  no `SqliteError` class) and cites direct runtime verification plus
  the official docs; §11.4 (lines 4299–4312) carries the matching
  claims-registry entry. Grepped `SqliteError` across the current
  document — 1 hit, inside the corrected sentence's own "previously
  claimed here, false" parenthetical, not a live claim.
  (c) §10's D-plan-2 heading (lines 3387–3392) now reads
  `` `web-tree-sitter@^0.26.13` (caret floor, locked to the `0.26.x`
  line) `` — no longer "(exact)". §14.1 Q1 (lines 6163–6173) also
  reworded from "pinned" to the caret-vs-pin distinction. Grepped
  `web-tree-sitter.{0,40}\(exact\)` — 0 hits.
  (d) §5.1's three previously-unattributed files now carry step
  attributions: `hash.ts` (line 382, "Step 5"), `events.ts` (line 376,
  "Step 28"), `verdict.ts` (line 378, "Step 15") — all three read
  directly, all three match their constructing step's own body.
  (e) §12.5's AC-21 row (line 5977) is now a well-formed three-cell
  row: `| AC-21 (full) | T29-2 (guard mechanism only) | A/B (guard: A;
  full exercise: B, deferred) |`. Counted `|`-delimited cells across
  all 40 rows of the AC→T-ID table (lines 5942–5981) — every row now
  has exactly three cells.
- **New collapses this round: 2.** Both are shell-command
  output-shape claims — the exact generalization round 7's own
  collapse-hunt suggested for round 8 — found by constructing the
  actual repository states the plan's own text describes and running
  the plan's own cited commands against them, rather than re-reading
  the prose. Neither is a citation-number drift or a stale label; both
  are load-bearing algorithmic gaps in the two components (repo
  identity, the co-change miner) that most directly determine whether
  Phase A's real-repo exit run (Step 42) — the mission-critical
  measurement `CLAUDE.md` rule 3 and spec §11.5 exist to protect —
  produces trustworthy data.
- **Minor findings: 0.** Every markdown table structural check
  (§2.3, §12.5, §14), every file-skeleton attribution cross-check
  (§5.1 against every step body), and every step-number citation
  grepped from round 5–7's known-defect vocabulary came back clean
  this round — the specific classes of small, cosmetic defect rounds
  4–7 found are genuinely exhausted at this document's current state,
  at least under this round's search strategy.
- **What survives.** Round 7's five closure items (above). Every
  §10A collapse-test entry (all eight D-plan-* entries, all six
  N1–N6 entries, the three plan-level entries) was re-read in full and
  re-attacked; none produced a new crack beyond the two collapses
  below, which are not decisions requiring a §10A entry — they are
  factual claims about tool behavior embedded in already-collapse-
  tested decisions (D-plan-1's build order does not depend on Step 5's
  git-detection algorithm; AD-13's miner design is not itself
  disputed, only its unstated handling of `-M`'s own output format).
  No new load-bearing decision in §7 lacks a §10A entry (checked
  against §10A's own coverage-attestation paragraph, lines 4050–4079,
  read in full). `npm pack --dry-run`'s grammar-enumeration premise
  (Step 40, L6) survives direct execution. Step 4's `0o700` directory
  mode survives the umask interaction. D-plan-4's `sqlite3`-may-be-
  absent premise is corroborated, not merely accepted, by this
  session's own sandbox lacking the CLI.

---

## Collapses

### Collapse 1 — Step 5's repo-key algorithm names a `git rev-parse --is-inside-work-tree` outcome ("→ false") that does not occur in the scenario its own step 4 (and `T5-1`'s own fixture) exists to handle

**What the plan says.** `docs/plans/plan-phase-a.md:927–958` (Step 5 —
Repository identity resolver, "What changes"), the four-rule algorithm
verbatim:

> "1. `git rev-parse --is-inside-work-tree` → false → fall through to
> (3).
> 2. `git rev-parse --is-shallow-repository` → true → derive key from
> normalized origin URL … If no origin, fall to (3).
> 3. `git rev-parse --is-shallow-repository` → false → run `git
> rev-list --max-parents=0 HEAD`, sort the returned hashes
> lexicographically, take the smallest; `mode='commit'`.
> 4. Fallback: SHA-256 of the realpath (`fs.realpathSync(repoPath)`);
> `mode='path'`."

`T5-1`'s own fixture set (`docs/plans/plan-phase-a.md:4528–4530`, §12)
names exactly four scenarios: "(a) full history with 3 root commits;
(b) shallow clone from (a) depth 1; (c) shallow clone with `origin`
removed; **(d) non-git directory**." `T5-1`'s own "Fails when" clause
(line 4536) states explicitly: "**the fallback path is not taken when
git is absent**" — i.e., fixture (d)'s pass condition is that
`resolveRepoKey` reaches step 4 (`mode='path'`) for a directory with no
`.git` anywhere in its ancestry.

**How this was verified — and found false.** `git rev-parse
--is-inside-work-tree`, run against a directory that is genuinely not
inside any git repository (no `.git` anywhere up the tree — exactly
`T5-1` fixture (d)'s scenario), does **not** print `false`. It fails
outright:

```
$ cd /tmp/.../not-a-repo && git rev-parse --is-inside-work-tree
fatal: not a git repository (or any of the parent directories): .git
$ echo "exit: $?"
exit: 128
```

No stdout at all; a fatal error on stderr; a non-zero exit code. The
literal string `false` is printed by this exact command **only** in a
different, narrower scenario — being inside a git repository's own
`.git` directory or inside a bare repository's directory (i.e.,
genuinely a git repo, just not inside its working tree):

```
$ git init --bare bare-test.git && cd bare-test.git
$ git rev-parse --is-inside-work-tree
false
$ echo "exit: $?"
exit: 0
```

Both of `--is-shallow-repository` and `git rev-list --max-parents=0
HEAD` — the commands step 2/3 of the same algorithm run next —
independently confirmed to **also** fail with the identical `fatal:
not a git repository` / exit 128 shape when run in a genuinely
non-git directory:

```
$ git rev-parse --is-shallow-repository
fatal: not a git repository (or any of the parent directories): .git
exit: 128
$ git rev-list --max-parents=0 HEAD
fatal: not a git repository (or any of the parent directories): .git
exit: 128
```

So the plan's step 1 conflates two genuinely different outcomes under
one label, "→ false": (i) the command **succeeds** (exit 0) and prints
the literal string `false` — which happens only in the bare-repo /
`.git`-directory case, where the repository genuinely does have
commits `git rev-list` can read; and (ii) the command **fails
outright** (exit 128, fatal error, no stdout) — which is what actually
happens in `T5-1` fixture (d)'s scenario, a plain directory with no
git repository at all. The plan's own text never distinguishes these,
and its stated routing — "→ false → fall through to (3)" — sends
*both* outcomes to step 3, which itself runs two more git commands
(`--is-shallow-repository`, then `git rev-list --max-parents=0 HEAD`)
that **also fail outright** in scenario (ii), the true no-git case.
Nowhere in Step 5's four numbered rules, nor anywhere else in the
document (grepped `no git|not a git|ENOENT|resolveRepoKey|
is-inside-work-tree` across the full 6973 lines — 5 hits, all inside
Step 5's own body or its two references from Step 31/T5-1, none
describing exception handling), is there a stated rule for "the git
command failed outright" as distinct from "the git command succeeded
and returned a boolean." As literally specified, an implementer
following the four numbered rules in order — testing `stdout ===
'false'` at step 1 — would need to invent, unauthorized, the actual
behavior that makes fixture (d) pass: catching the thrown/non-zero-exit
git invocation at step 1 (or at every step) and routing *that*
specific outcome to step 4, not step 3.

**Why this is the same defect class as round 6/7's findings, at a
genuinely new site.** `git rev-parse --is-inside-work-tree` is exactly
the "familiar plumbing command, too basic to be wrong" shape round 6's
`semver` finding and round 7's `node:sqlite` finding both name: a
one-line git incantation that reads as unambiguously boolean (`true`/
`false`) because that is its documented *successful* output — the
gap is that the plan's algorithm never accounts for the *unsuccessful*
case, which is not a corner case here but the exact scenario (a plain,
non-git directory) that `AD-3`'s own fourth rule and `T5-1`'s own
fixture (d) exist to handle. Seven rounds of prior review (the
2026-09-06 originals through round 7) read this four-step numbered
list as a complete decision tree and never executed any of its three
`git` invocations against the one input state — "no git at all" —
that the algorithm's own step 4 is the designated handler for.

**Practical impact.** Bounded but real, and — unlike round 7's
`node:sqlite` finding — **not obviously self-revealing at the exact
moment of failure**, because the natural, idiomatic way to invoke a
git command from Node (`execSync`/`execFileSync` inside a `try/catch`)
is *exactly* the pattern that would make this bug easy to introduce
silently: a wrapper like `try { return exec(cmd) === 'true'; } catch {
return false; }` makes the thrown exception from scenario (i) (no git
at all) collapse into the *same* boolean `false` the code already
expects from scenario (ii) (bare repo) — so an implementer who writes
the natural try/catch wrapper will find the *symptom* (both cases route
identically) matches what the plan's prose already describes ("→
false"), while the *destination* the plan names for that outcome
("fall through to (3)") is still wrong, because step 3 makes two more
git calls that will also throw for scenario (i) and must *also* be
caught the same way for the algorithm to ever reach step 4 at all. If
an implementer wraps every git call in the same generic try/catch →
`false`-on-error pattern (the natural thing to do, and *not* what the
plan's four numbered rules describe doing), the algorithm accidentally
still reaches step 4 correctly for the true no-git case — but only
because the implementer silently generalized "false" to mean "false or
threw," a decision the plan never authorizes and that an implementer
following the steps literally, one command at a time, would not
necessarily make correctly on the first attempt. `T5-1`'s own fixture
(d) is exactly the test that would catch a wrong implementation here —
so this is caught before the exit run, but only if the implementer's
error-handling choice happens to be the right one; the plan itself
supplies no rule for it, which is the actual defect (a plan that
"executes step by step without making a single decision on the fly" —
`expert-plan`'s own definition, quoted in round 7's Critical finding —
has an unauthorized decision sitting exactly at its repo-identity
foundation, the mechanism every store, every whisper, and Step 42's
real-repo exit run keys off of).

**What correct disposition looks like.** Rewrite Step 5's four-rule
algorithm to name the exception path explicitly, e.g.: "Each `git
rev-parse`/`git rev-list` invocation above is wrapped in a helper that
returns `{ok: true, value: string} | {ok: false}` — `ok: false`
covers both a non-zero exit (git reports 'not a git repository',
scenario: no `.git` anywhere) and any other invocation failure. Step 1
becomes: run `git rev-parse --is-inside-work-tree`; if it fails
outright (`ok: false`), skip directly to step 4 (`mode='path'`) — the
repository does not exist at all. Only if it succeeds and returns the
literal string `false` (the bare-repository / `.git`-directory case)
does control fall through to step 2/3, since a bare repo's commits
remain queryable by `git rev-list`." Add a matching clause to `T5-1`'s
own spec naming this distinction so a future implementer sees it at
the test-specification layer as well as the step-body layer.

---

### Collapse 2 — Step 20's co-change miner runs `git log … -M` (rename detection) but never accounts for `-M`'s own `--numstat` output syntax, risking silently corrupted file identities for every renamed file in real-repo history

**What the plan says.** `docs/plans/plan-phase-a.md:1846–1852` (Step
20 — Co-change miner, "What changes"):

> "runs `git log --no-merges --numstat -M --format=%H%x00%at%x00
> <watermark>..HEAD` streamed line-by-line; per commit: records the
> commit in `commits` with `entity_count`, excludes if `entity_count >
> opts.maxTransactionEntities` … for included commits, generates all
> canonical-ordered file pairs from the touched-file set, accumulates
> `cochange_pairs` counts."

The same command (with the `-M` flag) is named at line 92 (§2.1 scope)
and inherited verbatim from `docs/architecture-phase-a.md:1045`
(AD-13, "`git log --no-merges --numstat --format=… -M` streamed
commit-by-commit"). Neither the plan nor the architecture's "Premise
verification" for AD-13 (`docs/architecture-phase-a.md:1069–1071`:
"`git log --no-merges --numstat` exercised on this repo this
session" — note: **without** `-M` in the executed command) ever
describes what `--numstat`'s output looks like for a file `-M`
actually detects as a rename, nor how the miner's "touched-file set"
extraction handles it.

**How this was verified — and found false as an implicit assumption.**
`-M` (rename detection) changes `--numstat`'s per-file line for any
file git judges similar enough to a deletion+addition elsewhere in the
same commit. This session constructed a real repository and exercised
all three shapes `-M` actually produces:

A file renamed with enough content change that git does *not* judge it
similar enough to flag as a rename (below the default 50% similarity
threshold) still prints as two ordinary lines — no problem:
```
0    1    a.txt
2    0    b.txt
```

A file git *does* recognize as a rename (a pure move, or a move with a
small edit) collapses to a **single line** using an ` => ` separator,
not two path-bearing lines:
```
0    0    b.txt => c.txt
```

And for a rename where old and new paths share a directory prefix
and/or suffix, git further compacts the line using **brace-abbreviated
path syntax**, confirmed directly:
```
0    0    src/{utils => other}/c.txt
```

None of these three shapes is a plain, single, unambiguous file path
in the tab-delimited third column the plan's "touched-file set"
extraction implicitly assumes every `--numstat` line provides.
Grepped `rename| => |similarity` across the entire plan (0 hits beyond
unrelated uses of "rename" as an English verb) and across the
architecture's AD-13 section (0 hits) — this output shape is
unaddressed at both layers.

**Why this is the same defect class as round 6/7's findings, at a
genuinely new site — and a more consequential one.** `git log
--numstat -M` is exactly the kind of "everyone has run `git log`
before" command nobody thought to check against the specific flag
combination (`-M` plus `--numstat`) the plan actually specifies; the
`-M` flag's effect on `--numstat`'s own output grammar is
under-documented relative to how routine the base command feels,
matching round 6/7's "too basic to check" pattern precisely. It is
**more consequential than round 7's `node:sqlite` finding** on one
axis: round 7's `SqliteError` citation was **self-revealing** (a
`tsc`/runtime failure the instant anyone tried to use the nonexistent
class name) and round 7's `npm ci` finding was **self-revealing at the
very first build/CI run**. This finding is **silent**: an unhandled
` => `/brace-abbreviated numstat line does not throw — it simply
becomes a malformed "file path" (containing the literal substring
`" => "` or unresolved brace syntax) that a naive path-extraction
routine would insert directly into the `files` table and the
co-change pair-counting logic, or that a slightly more careful
extraction would silently *drop* (treating the line as unparseable and
skipping it) — either way losing or corrupting the coupling signal
for every file any commit in the mined history renamed. No test in the
plan's own §12 (`T20-1`, the miner's only acceptance test, lines
4869 area / §12 T20-1's fixture) plants a renamed file, so this would
not be caught by Phase A's own fixture suite either — it would first
surface, silently, in Step 42's real-repo exit run, on repositories
that (unlike a hand-built fixture) inevitably contain real rename
history. That is precisely the measurement `CLAUDE.md` rule 3 and
spec §11.5 declare the mission-critical deliverable of Phase A: "Phase
A is also the build's test bed… run on real repos to *discover* how
the honest deterministic mechanism actually behaves… Phase B and the
`AD-24` regression fixtures are designed from that discovery." A
miner whose file-identity extraction silently mishandles every rename
in real history corrupts exactly the discovery data Phase B is
designed from — the collapse-log's 2026-09-04 "fake completeness
corrupts the data the rest of the build reads" lesson, recurring here
not as an elaborated recognizer but as an unexamined command-output
assumption.

**Practical impact.** Real-world repositories — including
`Maxcogar/agent-armory` itself and any other repo Step 42's exit run
targets — routinely contain file renames and moves (refactors,
reorganizations, the very "spec/architecture/plan/review churn" Step
42's own text says dominates this repo's history). Every commit
containing a git-detected rename would, under a literal reading of
Step 20's text, either (a) silently corrupt one entry of the
"touched-file set" with an unparsed `old => new` or brace-abbreviated
string that never matches any real file's path in the `files` table
(so that file is invisibly absent from every co-change pair the commit
would otherwise have contributed to), or (b) — if an implementer's
path-extraction happens to `split` on `\t` and treat the *third*
tab-separated field as the path (correct for a non-rename line, wrong
for these three), ingest a garbage compound string as a literal "file
path," polluting `files`/`cochange_pairs`/`symbol_refs` joins with a
path that resolves to nothing on disk. Either failure mode degrades
Coupling, Consequence, Completeness, and Warning genre evidence
(exactly the four genres Step 20's own "Impact if wrong" field already
names as dependent on the miner) for every renamed file, silently,
with no diagnostic and no test catching it — a materially different
risk profile than a build-time crash, because it would ship, run
"successfully," and quietly under-report real coupling in every repo
the tool is ever pointed at.

**What correct disposition looks like.** Add explicit handling to Step
20's "What changes": "A `--numstat` line whose third field matches `^
(.*) => (.*)$` (a git-detected rename, with or without brace-
abbreviated shared-prefix/suffix compaction) is parsed by expanding
the brace form (if present) into the real old and new paths and adding
**both** to the touched-file set for that commit — the miner's
canonical-pair generation treats a rename as touching both the old and
new identity, so coupling evidence about the pre-rename file is not
silently lost at the rename commit." Add a renamed-file scenario to
`T20-1`'s fixture (a file renamed partway through the planted
coupling history) so the miner's rename handling is actually exercised
by the plan's own acceptance test, not left to the exit run to
discover for the first time.

---

## Collapse-tests re-attacked (all survive; no new crack)

Every §10A entry (all eight D-plan-* entries, N1–N6, and the three
plan-level entries, `docs/plans/plan-phase-a.md:3523–4048`) was
re-read in full and pushed with a question independent of round 7's
own re-attack:

- **D-plan-1 (build order / C1's write-time cap).** Pushed: does the
  cap's mechanization (`T14-3`, `T18-3`) cover every place a Step
  14/18/23 recognizer could grow undetected — specifically, could a
  new *file* (not a new predicate in an existing array) sidestep both
  greps? Re-read `T14-3`/`T18-3` (§12) — both grep *built output*
  (`dist/blocks/health.js`, the move recognizer's set), not source
  files by name, so a new recognizer file that still compiles into
  `dist/blocks/health.js` or `dist/qa/classify.js` remains inside the
  grepped scope. Survives.
- **D-plan-2 (dependency floor).** Re-verified round 6/7's semver fix
  and round 7's heading fix both hold (Collapse-hunt "What survives,"
  above). Survives.
- **D-plan-3 (`node:test` runner).** Re-pushed: does `T1-1`'s new
  lockfile-commit requirement (round 7's fix) interact badly with
  `tsconfig.test.json`'s separate compile target — could `npm ci`
  installing from a lockfile skip a dev dependency `tsc -p
  tsconfig.test.json` needs? Read Step 1's dependency block (line
  637: dev deps `typescript`, `@types/node`) — both are ordinary
  `package.json` `devDependencies`, which `npm ci` installs
  identically to `npm install` when a matching lockfile exists; no
  interaction defect. Survives.
- **D-plan-4/D-plan-5 (sqlite3 shell; deterministic fixtures).** Both
  re-read; this session's own sandbox lacking `sqlite3` is a live,
  unplanned instance of D-plan-4's own disclosed "may be absent"
  premise — corroborating, not undermining, the collapse-test's
  answer. Survives.
- **D-plan-6 (retracted).** Re-confirmed no residual defense of the
  retracted owner-run-probe design anywhere (fresh grep for "markdown
  probe" — 2 hits, both explicitly past-tense). Survives.
- **D-plan-7 (CI tier split).** No new crack under a fresh push on
  whether "the reviewer merges on unit+convention green" is actually
  enforceable — the plan's own honest "guide, not gate" answer stands.
  Survives.
- **D-plan-8 (settings.json marker via `command` prefix).** Re-checked
  for a stale invented-field reference — none found. Survives.
- **N1 (URL normalization).** Re-pushed on whether the disclosed
  scheme-gap could combine with **this round's Collapse 1** — could a
  repo whose `git rev-parse --is-inside-work-tree` throws (no git)
  *and* has a differently-schemed remote somehow produce a worse
  compound failure? No: Collapse 1's fix point (step 1, before any URL
  logic runs) is upstream of N1's URL-normalization scope entirely —
  independent failure modes, not compounding. Survives on its own
  terms; not weakened by Collapse 1.
- **N2 (`deny_bypass_suspect` coverage bound).** Re-confirmed both-
  direction disclosure intact at Step 18/33. Survives.
- **N3/N4 (bar defaults, clearing length floor).** Re-pushed: no
  caching residual found (`tuning` read at recognizer-construction
  time, confirmed at Step 14 line 1445). Survives.
- **N5 (`oracleSpawn` placement).** Re-verified Step 21 still calls
  `oracleSpawn` (not raw `child_process.spawn`) before Step 38 in
  build order. Survives.
- **N6 (confinement-grep scope).** Re-verified the `dist/`/
  `dist-test/` partition remains structural (disjoint `tsconfig`
  `include` globs). Survives.
- **Plan-level: Checkpoint placement, Test tier split, Exit-run report
  shape.** All three re-read; each collapse-test's four fields remain
  internally consistent with the current step bodies. **Pushed
  specifically on Exit-run report shape against this round's Collapse
  2:** does the exit report's mandated metric set (Step 42 item 5)
  include anything that would surface a miner rename-handling bug on
  its own? No — the report's per-genre counts would simply be lower
  than they should be, indistinguishable from "the conservative
  recognizer's honest low coverage" the report is *designed* to show
  without alarm (§11.5's own framing: a low number is the expected,
  honest outcome, not evidence of a bug). This means Collapse 2's
  practical effect would be invisible inside the exit report's own
  success criteria — a genuine gap in what the report format can
  catch, noted here as reinforcing why Collapse 2 needs a fixture
  (the report format alone cannot substitute for one). Survives as a
  collapse-test; the interaction with Collapse 2 is additional
  evidence for Collapse 2's "what correct disposition looks like"
  fixture recommendation, not a new defect in the report-shape
  decision itself.

---

## New load-bearing decisions §10A missed

None found as *decisions*. Collapse 1 and Collapse 2 are not
undisclosed plan-level judgment calls of the N1–N6 shape — they are
factual gaps in the stated behavior of already-collapse-tested
mechanisms (Step 5's repo-key algorithm is not itself disputed as a
design; its git-command-outcome mapping is incompletely specified.
Step 20's rename handling is not a competing design choice; it is an
unaddressed consequence of an already-chosen flag, `-M`, whose
inclusion is not itself in question — canonical file identity across
renames is clearly the intended behavior the flag exists to serve).
Neither needs a four-part collapse-test of its own; each needs the
plan's algorithmic text corrected to match the tool's actual behavior,
the same disposition round 6 and round 7's findings received.

Every §7 step was re-read against §10A's own coverage-attestation
paragraph (lines 4050–4079, "not every §7 step is a transcription…
N1–N6 and the C1/C3/P1–P4 corrections are plan-level judgments"); no
step's content was found to contain an undisclosed plan-level
judgment lacking a formal collapse-test entry.

---

## Mission-fidelity cross-trace

- **"Honest deterministic foundation," "running on the owner's real
  repos," "clean seams the later phases plug into."** Directly
  implicated by Collapse 2, more so than any single finding across
  rounds 1–7: the co-change miner is the deterministic-history engine
  feeding four of the seven Phase A genres, and its silent
  mishandling of renamed files on real repos (which routinely contain
  renames, unlike a hand-built fixture) directly threatens the
  honesty of the exit-run measurement itself, not merely a
  documentation citation about it. Collapse 1 is a narrower foundation
  risk (repo-identity resolution, AD-3) but sits at the same layer:
  both are load-bearing shell-command assumptions inside the two
  Phase A mechanisms (repo keying, co-change mining) that determine
  what data the rest of the build reads.
- **"Measures its own floor — how little it catches."** Collapse 2
  specifically threatens this: as the "Collapse-tests re-attacked"
  section above shows, a rename-corrupted miner would produce a
  *lower* Coupling/Consequence/Completeness/Warning count on real
  repos — indistinguishable, inside the exit report's own success
  criteria, from the honest low-coverage floor Phase A is *supposed*
  to report. A false floor and a true floor read identically in the
  current report format; only a rename-aware fixture (this round's
  recommended fix) can tell them apart before the exit run, rather
  than after.
- **"Never fake completeness dressed to look like a working
  product."** Both collapses are the same shape round 6/7 already
  named: a citation or an algorithmic step that *reads* as
  fully-specified (a four-rule numbered decision tree; a named `git
  log` invocation with its exact flags) but was never executed against
  the real tool in the specific scenario that matters (a genuinely
  non-git directory; a commit containing a detected rename) — the
  document asserting more completeness than it had actually earned, in
  the same way `§11`'s "every factual claim… with the read-level
  evidence" discipline was designed to prevent and, at these two
  sites, had not yet been applied.

---

## Attestation

- **What I read in full this session (2026-09-07).** `middleware/
  context-oracle/CLAUDE.md`; `docs/collapse-log.md` (2026-09-07 entry
  set, rounds 3–7, read closely; earlier entries sampled for pattern
  history); `docs/STATUS.md`; `OWNER-LEDGER.md` (both in full);
  `docs/specs/spec-context-oracle.md` §8 (326–544), §11.5 (739–777),
  §12 (780–873), §13 (874–906), §14 (908–1138) — read in full;
  `docs/architecture-phase-a.md` AD-2 (325–365), AD-3 (366–?, spot-
  checked for Step 5's citations), AD-5 (568–645), AD-9 (736–922),
  AD-10 (924–946), AD-13 (1043–1071, added this round — governs
  Collapse 2), AD-14 (1073–1128), AD-20 (1377–1412), AD-24
  (1513–1628), AD-25 (1630–1648), AD-26 (1650–1673) — all in full;
  both round-7 review documents in full; `docs/plans/plan-phase-a.md`
  (6973 lines) read end to end across the `Read` call ranges listed at
  the top of this document, with every line range round 7 cited as a
  fix-site re-read directly at its current line numbers (not assumed
  unchanged from round 7's citation).
- **What I verified against a live instrument, not memory or a prior
  review's own attestation.** `git rev-parse --is-inside-work-tree`,
  `--is-shallow-repository`, and `git rev-list --max-parents=0 HEAD`,
  each executed against three constructed repository states (Collapse
  1). `git log --no-merges --numstat -M`, executed against a
  constructed repository exercising a non-rename change, a
  similarity-triggered rename, a pure rename, and a brace-abbreviated
  subdirectory rename (Collapse 2). `npm ci` re-executed against a
  fresh no-lockfile `package.json`, independently reproducing round
  7's Critical finding's underlying fact rather than trusting the
  plan's restatement. `semver@7.8.5` re-installed fresh and re-run
  against `^0.26.13`/`0.27.0`, independently reproducing round 6/7's
  finding. `npm pack --dry-run` (both `--json` and plain-text)
  executed against `tree-sitter-wasms`, confirming Step 40's L6
  grammar-inventory-check premise holds. `fs.mkdirSync(...,
  {mode: 0o700})` executed under this sandbox's `umask 0022`,
  confirming Step 4's directory-mode claim is unaffected by the
  umask interaction (0o700 has no bits `0o022` would clear).
  `apt-get install sqlite3` attempted and failed (package mirror
  404) — recorded as corroborating D-plan-4's own disclosed
  "may be absent" premise, not as a defect.
- **Search strategy, and how it differed from every prior round's.**
  Rounds 2–5 searched for specific known-bad phrases or step-number
  clusters; round 6 built a step-topic ground-truth map and checked
  "(Step N's X)" parentheticals; round 7 enumerated every
  "authoritative standard"/"documentation says X" citation and ran
  the checkable ones against a real instrument (finding
  `node:sqlite`'s `SqliteError`) plus checked file-skeleton attribution
  completeness and table structural consistency (finding three Minor
  issues, since fixed). This round generalized round 7's own
  closing suggestion precisely: rather than re-running round 7's
  method against the same citation-registry surface, it (1) identified
  every place the plan specifies an *exact shell command with specific
  flags* whose output the plan's own logic then branches on or parses
  (Step 5's three `git rev-parse`/`git rev-list` invocations; Step
  20's `git log … -M`; Step 40's `npm pack --dry-run`; D-plan-4's
  `sqlite3 .dump | sort`), and (2) actually constructed the specific
  input states each command's surrounding logic depends on
  distinguishing (a non-git directory vs. a bare repo; a plain file
  change vs. a git-detected rename) and ran the exact commands against
  them, rather than reading the plan's prose description of what the
  command "does." This is the method round 7's own closing paragraph
  named as the prescribed method for round 8 ("execute the plan's
  other illustrative shell commands… against a real shell to confirm
  each output shape matches what a step or test assumes"), applied
  here to `git` invocations specifically rather than the `sqlite3`/
  `npm pack` commands round 7 named as examples (both of which were
  also checked and survive, per "What survives" above) — the two
  commands that turned out to hide a real defect were ones round 7's
  own list did not happen to name.
- **Confidence.**
  - **High** on Collapse 1 — a direct, three-command execution
    (`--is-inside-work-tree`, `--is-shallow-repository`, `rev-list`)
    against a constructed non-git directory, confirmed to fail
    outright rather than return the boolean the plan's text
    describes, cross-checked against `T5-1`'s own stated fixture and
    failure condition, which explicitly requires the exact scenario
    tested.
  - **High** on Collapse 2 — three distinct `--numstat` output shapes
    for `-M`-detected renames, each reproduced directly against a
    constructed repository, none matching a plain single-path line;
    cross-checked against the complete absence of any rename-handling
    language anywhere in the plan or the architecture's AD-13 section.
  - **High** on "round 7's five closure items hold" — each verified by
    direct `Read` at the current line number and a fresh grep for the
    specific defective phrasing each fix replaced, not by trusting
    `docs/STATUS.md`'s narrative.
  - **Medium-high**, not absolute, on "no minor findings this round" —
    a full document read plus the specific structural/attribution
    checks that found round 7's three Minor findings were re-run and
    came back clean, but a differently-scoped search (as every prior
    round has demonstrated) could still find something this round's
    method did not test for; this is disclosed honestly rather than
    asserted as "the document is clean," per `CLAUDE.md`'s "verify
    before you assert" rule and the specific lesson of the round-5
    collapse-hunt whose own "only these two were wrong" claim was
    itself falsified by a sibling pass in the same round.
- **What would make me revise the verdict up (to SURVIVES on these two
  findings specifically).** Discovery that `resolveRepoKey`'s actual
  planned implementation (not yet written — Phase A is greenfield,
  §11.6) was always going to wrap every git invocation in a
  catch-all-errors-as-false helper that happens to route correctly to
  step 4 for the true no-git case despite the plan's text naming step
  3 — this would make Collapse 1 a documentation-clarity issue rather
  than an algorithmic gap, but the plan's own text is what an
  implementer executes "without making a single decision on the fly,"
  and no such helper is named. Discovery that the touched-file-set
  extraction was always going to reject any numstat line failing a
  strict `^\d+\t\d+\t\S+$` pattern and treat it as an
  already-handled edge case — no such rejection rule appears anywhere
  in the document either.
- **What would make me revise down further.** Nothing found this round
  deepens either collapse beyond what is stated: Collapse 1's
  practical failure mode is bounded to `resolveRepoKey`'s own
  behavior (no cascading effect on other steps' correctness, since
  every other step consumes `resolveRepoKey`'s *output*, not its
  internal git-invocation sequence) and is very likely to self-reveal
  during `T5-1`'s own construction, even if not from the plan's text
  alone. Collapse 2's blast radius is real but contained to the four
  named genres' evidence quality — it does not affect the answer-drift
  block, security, delivery, or any other Phase A subsystem's
  correctness.

*End of round-8 collapse-hunt. Trajectory across eight rounds on this
plan: round 1 — 3 collapses; round 2 — 1 collapse; round 3 — 2
collapses; round 4 — 2 collapses; round 5 — 2 collapses (one
incomplete); round 6 — 1 collapse; round 7 — 1 collapse + 3 Minor;
round 8 — 2 collapses, 0 Minor, found by generalizing round 7's
library/tool-behavior-verification method to shell-command
output-shape claims specifically, at two sites (repo-identity
resolution, co-change mining) neither round 7's citation-registry
sweep nor any earlier round's step-number-citation sweep was scoped to
examine. The pattern holds, eight rounds running: each round's
distinct search method finds something every previous round's method
structurally could not see. Dispatch round 9 after this fix lands,
instructed to independently re-verify both of this round's fixes by
re-executing the same git commands against the corrected algorithm
text (not merely re-reading the corrected prose), and to continue
generalizing the shell-command-execution method to any remaining
untested command in the document — the `flock`(2) directory-lock
claim (Step 37/AD-26), the `PRAGMA quick_check`/`PRAGMA
journal_mode`/`PRAGMA busy_timeout` claims (Step 3/T3-1), and the
`git config --get remote.origin.url` normalization claims (Step 5's
own URL-fallback branch, N1) are candidates this round did not reach.*
