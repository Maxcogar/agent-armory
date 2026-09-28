# Settlements for the correction register's open conflicts and gaps (C-2, C-3, C-4, G-1 … G-11)

Written 2026-09-28 against `HEAD` `28983c6` of `Maxcogar/agent-armory`, for the single
correction pass of `middleware/context-oracle/` (Context Oracle, Phase A). No repository
file was changed. Every execution ran in
`/tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/gaps/`
(called `$G` below): a `git archive` extraction of `HEAD` at `$G/head` built with
`npx tsc -p tsconfig.json` and this checkout's `ctxoracle/node_modules` symlinked in;
variant builds `$G/b-*` are copies of that `dist` with one stated change; throwaway
repositories were made with every `GIT_*` variable unset. Tool versions: Node v22.22.2,
its bundled SQLite 3.51.2, git 2.43.0, Claude Code 2.1.283 (the CLI installed here).

Each section is judged by the brief's acceptable-decision test. Where a decision here
replaces text the register carries (a settled line of a batch ruling), the section's
**Decision** names that text and says it goes, with the reason, so the correction pass
does not apply both.

Sections are in the order they were finished.

---

## G-11 — The fork parent-id premise

**Item:** [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-correction-register.md@HEAD:L2811-L2812]] "**G-11 — The fork parent-id premise.** B2 E-13 (d): \"stays open until the hooks reference or an executed probe settles it\"; no probe is on record (R-139)."

**Owner?** Engineering. What a hook input carries is a harness fact, and how the fork
reseed is built on it is design (OL-11: design and verification are the agents'). Nothing
here touches purpose, scope or priorities.

**Options:**
1. Treat the premise as settled by the current reference documentation (hooks reference
   and Agent SDK TypeScript reference), keep AD-16's "reseed from the forked transcript",
   and add an executed fork probe as a plan premise check for the one part the documents
   do not show (the forked transcript file's content).
2. Keep the premise open until an executed fork is observed, and hold AD-16's fork reseed
   design until then.
3. Design the reseed to read a parent session id if one appears (a speculative field),
   falling back to the forked transcript.

**Evidence:**
- The architecture's premise row, and what it rests on: [[middleware/context-oracle/docs/architecture-phase-a.md@HEAD:L146-L146]] "**`SessionStart` input does not name a parent session**" and [[middleware/context-oracle/docs/architecture-phase-a.md@HEAD:L146-L146]] "This is the documented field list, not an observed fork payload"
- The hooks reference, fetched today: the `fork` source is [[https://code.claude.com/docs/en/hooks.md]] "A new session forked from an existing one" and the SessionStart-specific input is [[https://code.claude.com/docs/en/hooks.md]] "SessionStart hooks receive source and optionally model, agent_type, and session_title"; the page also records [[https://code.claude.com/docs/en/hooks.md]] "Before v2.1.214, forked sessions reported source \"resume\"."
- [[ran]] `curl -sS https://code.claude.com/docs/en/hooks.md | sed -n '/^#### SessionStart input/,/^#### SessionStart decision control/p' | wc -l` → `38`; the same range piped to `grep -c -i 'parent'` → `0` (the SessionStart input section never mentions a parent).
- The Agent SDK's type for the same input: [[https://code.claude.com/docs/en/agent-sdk/typescript.md]] "type SessionStartHookInput = BaseHookInput & {" with [[https://code.claude.com/docs/en/agent-sdk/typescript.md]] "source: \"startup\" | \"resume\" | \"clear\" | \"compact\" | \"fork\";" and [[ran]] `curl -sS https://code.claude.com/docs/en/agent-sdk/typescript.md | sed -n '/^type BaseHookInput/,/^};/p'` → `session_id: string;` `transcript_path: string;` `cwd: string;` `prompt_id?: string;` `permission_mode?: string;` `effort?: { level: string };` `agent_id?: string;` `agent_type?: string;` (no parent-session field in either type).
- What a fork is: [[https://code.claude.com/docs/en/agent-sdk/sessions.md]] "it creates a new session that starts with a copy of the original's history" and [[https://code.claude.com/docs/en/agent-sdk/sessions.md]] "The fork gets its own session ID; the original's ID and history stay unchanged."
- The transcript carries injected text: [[https://code.claude.com/docs/en/hooks.md]] "Claude Code saves the injected text in the session transcript."
- Real transcripts, read-only. `$G/trkeys.py` counts every top-level key of every JSONL entry and flags files whose entries carry more than one `sessionId` (the shape a copied conversation would have if the copy kept the parent's id): [[ran]] `find /root/.claude/projects -name '*.jsonl' -print0 | xargs -0 python3 $G/trkeys.py` → `files 226`; `fork/parent/branch keys {'parentUuid': 44308, 'gitBranch': 44308, 'logicalParentUuid': 3}`; `files with >1 sessionId 0`. The versions present: [[ran]] `find /root/.claude/projects -name '*.jsonl' -print0 | xargs -0 python3 $G/trver.py` → `[('2.1.282', 753), ('2.1.283', 43551)] 2`. (The entry counts grow while this session writes its own transcript; the file count and the zero do not change between runs.) `parentUuid` is the per-entry message chain, not a session pointer, and no file holds a fork: no forked session exists on this machine to observe.

**Decision:** Option 1.
- **Settled (documented):** a `fork` `SessionStart` arrives under a new `session_id`, and
  its input carries no parent session id — neither the hooks reference's SessionStart
  input list nor the SDK's `SessionStartHookInput`/`BaseHookInput` types have one. V22
  and AD-16's rule "the fork reseed source is the forked transcript" stand.
- **Not observed, and stated so:** that the file at the fork's `transcript_path` contains
  the copied pre-fork entries (the SDK says the fork "starts with a copy of the original's
  history"; no forked transcript exists locally to confirm the copy is in that file), and
  which `sessionId` the copied entries carry.
- **Design consequences, to write into AD-16 and Step 21/28:**
  1. The reseed reads every entry of the forked transcript regardless of the entry's
     `sessionId` field; it never filters by `sessionId`, so the unknown in the previous
     bullet cannot silently drop the copy.
  2. A fork whose transcript holds oracle text but recovers nothing keeps writing
     `rebuild_recovered_nothing` (AD-16, extended to `set = 'read'` by R-33), so a wrong
     premise shows up as a fault, not as silence.
  3. Add a premise probe to the plan's probe set (the `docs/plans/plan-phase-a.probes/`
     directory, as an `.optional.sh` because it needs an authenticated `claude`):
     in a throwaway directory whose `.claude/settings.json` wires a `SessionStart`
     command hook that appends its stdin to a file, run `claude -p "say ok"`, read the
     `session_id` from its JSON result, then `claude -p --resume <id> --fork-session
     "say ok again"`. **Passes when** the second `SessionStart` input has `source`
     `"fork"`, a `session_id` different from the first, and no key naming the first
     `session_id`; and the fork's `transcript_path` file contains the first prompt's
     text. It fails loudly otherwise, and V22's row is then corrected from its output.
  4. V22's evidence column keeps "not an observed fork payload" until the probe has run;
     then it cites the probe's output.

**Why it beats the alternatives:** Option 2 holds a design that two primary references
already settle, for a field neither lists; the only real unknown (the file's content)
does not change the design once point 1 is in place. Option 3 builds a branch for a
field no source names, which is speculative machinery the Phase A goal (CLAUDE.md rule 3)
forbids, and its fallback would be the only path ever exercised.

**What it costs:** one optional probe script and one plan premise row; the reseed's
correctness still rests on a documented, not yet observed, copy until the probe runs.

**Would be wrong if:** a Claude Code version in use sends a parent-session field on a
`fork` SessionStart (the reseed could then copy the parent's rows exactly instead of
matching text), or the fork's transcript file does not contain the copied history (the
reseed would then recover nothing, visibly, and the fork reseed would need another
source).

---
## G-8 — The far-future `%ct` tolerance

**Item:** [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-correction-register.md@HEAD:L2805-L2806]] "later than the wall clock by more than a stated tolerance\"; no tolerance is stated (R-24, R-57)."

**Owner?** Engineering: a plausibility bound on untrusted repository content.

**Options:**
1. Zero tolerance: any tip `%ct` later than the wall clock is a fault.
2. A clock-skew tolerance from authentication practice (minutes).
3. git's own written plausibility bound for commit and author timestamps: ten days.
4. No wall-clock guard; only syntactic validation of `%ct` (empty, non-decimal, above
   `Number.MAX_SAFE_INTEGER`).

**Evidence:**
- The settled requirement: [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B7b-adjudication.md@HEAD:L212-L214]] "A tip whose `%ct` is later than the wall clock by more than a stated tolerance is recorded as a fault naming the commit and its `%ct`." and [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B7b-adjudication.md@HEAD:L215-L216]] "The wall clock serves only as this plausibility guard, so G19's determinism of the value is kept."
- Why it matters (a settled executed fact): [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B7b-adjudication.md@HEAD:L154-L156]] "tip commit with committer time 40000000000 horizon-excludes all four commits. The store ends with no files and no pairs, and writes no fault."
- The code the guard sits in front of: [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@HEAD:L421-L422]] "const refTs = Number(gitOk(repoPath, ['log', '-1', '--no-show-signature', '--format=%ct', head])); const horizonTs = refTs - horizonYears * YEAR_DAYS * DAY_S;"
- git's source states a plausibility bound for exactly this field class, in its date parser: [[https://raw.githubusercontent.com/git/git/v2.43.0/date.c]] "Be it commit time or author time, it does not make" / [[https://raw.githubusercontent.com/git/git/v2.43.0/date.c]] "sense to specify timestamp way into the future. Make" / [[https://raw.githubusercontent.com/git/git/v2.43.0/date.c]] "sure it is not later than ten days from now..." with the check [[https://raw.githubusercontent.com/git/git/v2.43.0/date.c]] "if ((specified != -1) && (now + 10*24*3600 < specified))". git applies it while choosing how to read an ambiguous numeric date, not to stored objects:
- [[ran]] in the throwaway repository `$G/fut` (git 2.43.0, `date -u` → `Mon Sep 28 17:22:55 UTC 2026`): `GIT_COMMITTER_DATE='@40000000000 +0000' git commit -q --allow-empty -m far; echo exit=$?; git log -1 --format='%ct %s'` → `exit=0` / `40000000000 far`; and `GIT_COMMITTER_DATE="2031-01-01 12:00:00 +0000" git commit …` → `exit=0 ct=1925035200`. So git records a far-future committer time without complaint, and the miner is the only place that can refuse it.
- Harm bound, derived. `refTs` sets the time horizon's lower edge `refTs − Y·365.25 d` and the `ts` cap. A tip dated `f` days ahead of the truth moves both by `f` days. At the seeded `Y = 5` years the horizon spans 1,826.25 days, so the fraction of the horizon window mis-placed is `f / 1826.25`: 10 days gives 0.55 %; 40000000000 s (year 3237) gives all of it, the executed failure above.

**Decision:** Option 3 together with option 4's syntactic checks, as one validation of
`refTs` before any write of the pass:
1. `%ct` of the pass's `HEAD` is read with `--encoding=UTF-8` (R-58) and must match
   `/^[0-9]+$/` and be ≤ `Number.MAX_SAFE_INTEGER`.
2. With `nowS = Math.floor(opts.nowMs / 1000)` (the miner takes `nowMs`, default
   `Date.now()`, so tests fix the clock), a `%ct` greater than
   `nowS + REF_TS_FUTURE_TOLERANCE_S` is refused, where
   `REF_TS_FUTURE_TOLERANCE_S = 864000` (10 × 24 × 3600), a named constant in
   `src/miner/cochange.ts` whose comment cites git v2.43.0 `date.c` L535–L539 and the
   0.55 % derivation. It is not a tuning row: it guards an input, it is not a
   calibration point of the bar.
3. On any failure of 1 or 2 the miner records one fault `miner_ref_ts_invalid`
   (Step 6 code; detail `{commit, ct, reason: 'empty'|'non_decimal'|'unsafe_integer'|'future', nowS, toleranceS}`),
   writes nothing — no `commits` row, no `ref_ts`, no weights, no landmine rebuild,
   the watermark unchanged — and the pass returns `{refused: 'ref_ts_invalid'}`, which
   the `index` verb reports with a non-zero exit through its error channel (R-110).
4. `refTs` itself stays `%ct` (deterministic, G19); the wall clock is read only for the
   guard.
5. Tests (Step 13, `T-13-2`): the `far` repository (tip `%ct` 40000000000) → the fault
   with `reason: 'future'`, every store table's row count unchanged, the watermark
   unchanged; boundary rows with `nowMs` fixed: `%ct = nowS + 864000` is mined,
   `nowS + 864001` is refused; `''`, `12a`, `99999999999999999999` → `empty`,
   `non_decimal`, `unsafe_integer`.

**Why it beats the alternatives:** Option 1 refuses ordinary commits from a machine
whose clock runs a little fast, and every refusal stops all mining for that repository
until a later commit replaces the tip; that turns a harmless skew into an outage.
Option 2 borrows a number made for replay protection in authentication, where the
threat is a seconds-old token; nothing ties it to commit dates. Option 4 alone leaves the
executed failure in place (a syntactically valid year-3237 date). Option 3 is the one
bound that a primary source states for commit and author times, and the derivation shows
its worst case costs 0.55 % of the horizon window.

**What it costs:** a tip dated up to ten days ahead is mined as if true (at most 0.55 %
of the window mis-placed); a tip further ahead blocks mining until the tip changes, with
a named fault in `status`. One more fault code in `T-6-1`'s literal list.

**Would be wrong if:** repositories the oracle serves routinely carry tip committer
times more than ten days ahead of the machine's clock for legitimate reasons (for
example a machine whose clock is years behind), in which case the guard would need the
tip compared against something other than the local clock.

---

## C-4 — A new git-fault code

**Item:** [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-correction-register.md@HEAD:L2743-L2745]] "B4 p2 E-1 names \"a git fault (`miner_git_failed`-class)\"; B6b E-5 says \"a git-fault code only if Step 13's settled git-fault handling introduces one (batch 4 names none)\". R-50 carries both forms."

**Owner?** Engineering (fault-code design, AD-17).

**Options:**
1. No new code: a git failure throws and is recorded by the verb's catch under a generic
   code.
2. One code per writer: `miner_git_failed` for the miner and a second code for the
   indexer's git reads (R-50's "a code for a failed `index`-verb git read").
3. One code `git_failed` for every git subprocess failure on an off-path pass, with the
   writer as a detail field.

**Evidence:**
- Step 13's settled handling does introduce git-fault outcomes, so B6b E-5's condition
  is met: [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B4-part2-adjudication.md@HEAD:L10-L10]] "any `merge-base` or `cat-file` status outside {0, 1} → a git fault (`miner_git_failed`-class), no purge" and the register's R-56 [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-correction-register.md@HEAD:L1214-L1215]] "`rev-parse --verify -q HEAD`: exit 1 = nothing to mine; exit 128 = git fault, pass fails visibly."
- The indexer needs the same class: R-50 [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-correction-register.md@HEAD:L1085-L1086]] "a code for a failed `index`-verb git read (the error channel, R-63)"; and the verb's catch that will record it, R-110 [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-correction-register.md@HEAD:L2075-L2076]] "A `catch` at the verb's entry records any thrown error as a fault (with the escaped, 2 KB-bounded stderr tail for a git failure)"
- At `HEAD` a git failure is an untyped `Error`: [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@HEAD:L347-L347]] "if (r.status !== 0) throw new Error(`git ${args.join(' ')} exited ${String(r.status)}: ${r.err}`);"
- The fault tuple already carries a writer-keyed code whose condition spans both passes: [[middleware/context-oracle/ctxoracle/src/diag/fault_codes.ts@HEAD:L45-L45]] "'path_not_utf8', // G7: {writer: 'miner'|'indexer', count, first} (first: <= 5 escapeBytes forms)"
- Fail-fast asks for the failure to surface in context: [[https://martinfowler.com/ieeeSoftware/failFast.pdf]] "Instead, put the error in context."

**Decision:** Option 3.
- Add `git_failed` to `FAULT_CODES` (Step 6), comment `{writer: 'miner'|'indexer', argv0: <git subcommand>, status: number|null, signal: string|null, stderrTail: <escaped, ≤ 2 KB>}`.
- The git helpers (`git`/`gitOk` in `src/miner/cochange.ts` L339–L349 at `HEAD`, and
  the indexer walk's git calls) throw a typed `GitFailed` error carrying those
  fields; the miner (`rev-parse` status other than 0/1, `merge-base`/`cat-file` status
  outside {0, 1}, a non-zero `git log`/`rev-list` exit or a spawn error) and the
  indexer's walk (`ls-files`, `check-ignore` status other than 0/1, `rev-parse`) throw
  it and never purge, never advance a watermark or `index_head`.
- The `index` verb's catch (R-110) records `git_failed` from a `GitFailed`, and exits
  non-zero; any other error keeps R-110's rule.
- `history_rewritten` and `branch_changed` stay separate codes: they are outcomes of a
  git call that worked.
- `T-6-1`'s literal list gains `git_failed`; Step 13's `T-13-3` git-fault case (a corrupt
  watermark object: `cat-file -e` 0, `--is-ancestor` 128) asserts one `git_failed` with
  `writer: 'miner'`, `status: 128`, and no purge; Step 14 gains the `check-ignore`
  exit-128 case asserting `writer: 'indexer'`.

**Why it beats the alternatives:** A fault code's job is to let `status` and the exit
data count one failure class and name what to fix. "A git subprocess the oracle depends
on failed" is one class with one owner-facing fix (the repository or the git install),
whichever pass ran the command; option 2 splits that class's count across two rows for
no reader. Option 1 hides the class inside a generic error, which is the mislabelling
batch 6 found for `store_corrupt` (B6a E-24).

**What it costs:** one code, one typed error, and two test cases.

**Would be wrong if:** the owner-facing fix differs by writer (for example if indexer
git failures were routinely caused by the working tree and miner failures by the object
store), which would justify separate counts.

---
## G-2 — Stale recovery of the reindex claim

**Item:** [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-correction-register.md@HEAD:L2788-L2789]] "**G-2 — Stale recovery of the reindex claim.** B5 ruling 4: \"must be chosen by written comparison\" between an OS-released lock and pid reclaim; none chosen (R-37)."

**Owner?** Engineering (concurrency mechanism, AD-26).

**Options:**
1. **OS-released lock:** the reindex holds a write transaction on a separate SQLite
   lock database for the life of the pass; the operating system drops the lock when the
   holder process ends, however it ends.
2. **pid-liveness reclaim** (what `HEAD` builds): a committed claim row names the
   holder's pid; a new claimant takes over when `kill(pid, 0)` says the pid is not alive.
3. A lease: the claim row carries an expiry that the holder renews; a claimant takes
   over an expired lease.

**Evidence:**
- The ruling that asks for the comparison: [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B5-verification.md@HEAD:L125-L127]] "Stale recovery must be chosen by written comparison. One option is an OS-released lock on a separate SQLite database, reproduced as released on `SIGKILL`. The other is pid reclaim, stating its pid-reuse and `EPERM`"
- `HEAD`'s reclaim rule: [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@HEAD:L361-L361]] "if (Number.isInteger(owner) && owner > 0 && alive(owner)) return { acquired: false as const, ownerPid: owner };", where `alive` is `process.kill(pid, 0)` with `EPERM` counted as alive (`indexer.ts` L345–L353).
- What `kill(pid, 0)` answers: [[https://man7.org/linux/man-pages/man2/kill.2.html]] "If sig is 0, then no signal is sent, but existence and permission checks are still performed" — existence of *a* process with that id, not of the holder; and `EPERM` is [[https://man7.org/linux/man-pages/man2/kill.2.html]] "The calling process does not have permission to send the signal to any of the target processes." Pids are reused: [[https://man7.org/linux/man-pages/man5/proc_sys_kernel.5.html]] "This file specifies the value at which PIDs wrap around"
- [[ran]] `node $G/claim/reuse.mjs` (the `HEAD` build; a fresh store whose `reindex_owner_pid` is `1`, standing for a dead holder whose pid now belongs to an unrelated live process; pid 1 here is `process_api`) → `{"acquired":false,"ownerPid":1} {"acquired":false,"ownerPid":1}`: the claim is refused for as long as that unrelated process lives.
- The OS-released lock, executed here: [[ran]] `$G/lock/seq.sh` (Node 22.22.2 `node:sqlite`; `holder.mjs` opens `lk.db`, `PRAGMA busy_timeout = 0`, `BEGIN EXCLUSIVE`, then idles; `try.mjs` makes the same attempt) → `holder acquired pid 18520 journal delete` / `try: refused 5 database is locked after 0 ms` / `holder killed with SIGKILL (exit 137)` / `try: acquired`. With `busy_timeout = 1000` the refusal comes `after 1003 ms` ([[ran]] `node try.mjs lk.db 1000` while held).
- Why the OS drops it: [[https://www.sqlite.org/howtocorrupt.html]] "the default locking mechanism used by SQLite on unix platforms is POSIX advisory locking." POSIX: [[https://pubs.opengroup.org/onlinepubs/9799919799/functions/fcntl.html]] "All process-owned locks associated with a file for a given process shall be removed when any file descriptor for that file is closed by that process"; process exit closes every descriptor, [[https://pubs.opengroup.org/onlinepubs/9799919799/functions/_Exit.html]] "All of the file descriptors, directory streams, conversion descriptors, and message catalog descriptors open in the calling process shall be closed."; and a fatal signal is that exit, [[https://pubs.opengroup.org/onlinepubs/9799919799/functions/V2_chap02.html]] "the default action is to terminate the process abnormally, the process is terminated as if by a call to _exit ()"
- The lock database must not be in WAL mode for `EXCLUSIVE` to exclude readers too: [[https://www.sqlite.org/lang_transaction.html]] "EXCLUSIVE and IMMEDIATE are the same in WAL mode, but in other journaling modes, EXCLUSIVE prevents other database connections from reading the database while the transaction is underway."
- The row `status` needs: [[middleware/context-oracle/docs/architecture-phase-a.md@HEAD:L2581-L2581]] "`status` shows a held claim"

**Decision:** Option 1.
- **The lock.** `reindex.lock`, a SQLite database file in the project directory
  (`projects/<repo-key>/`, AD-3), left in the default rollback-journal mode. The pass
  (`runIndex`, and the miner when run by the `index` verb) opens it with
  `busy_timeout = 1000`, runs `BEGIN EXCLUSIVE`, and keeps that transaction open, writing
  nothing, until the pass ends; a `finally` runs `ROLLBACK` and closes it. `SQLITE_BUSY`
  from `BEGIN EXCLUSIVE` is the refusal.
- **The record.** Immediately after acquiring, the holder commits
  `schema_meta.reindex_owner_pid` and `schema_meta.reindex_started_at` in the project
  store (one transaction), and deletes both in its `finally` before releasing the lock.
  These rows are information for `status` and the refusal message only; nothing reads
  them to decide who holds the claim.
- **Refusal.** `{refused: 'reindex_locked', ownerPid, startedAt}`, with both values read
  from the project store in one read transaction right after the refused
  `BEGIN EXCLUSIVE`; if the rows are absent (the holder is between its lock and its row
  commit) both are `null` and the message says the holder has not recorded itself yet.
  The `reindex_locked` fault carries the same values (R-66/R-116's "read in its own
  transaction" is met by this single read).
- **`status`.** Probes the lock with `busy_timeout = 0`: `SQLITE_BUSY` → "reindex running
  since `<startedAt>` (pid `<ownerPid>`)"; acquired → immediate `ROLLBACK`, and if the
  rows are present the holder died without its `finally`: "last reindex (pid, started)
  did not finish". The probe holds the lock for one `BEGIN`/`ROLLBACK`, far inside a
  claimant's 1000 ms wait, so a probe never causes a refusal.
- **Removed:** `alive()`, the pid-liveness takeover, and the "`EPERM` counts as alive"
  rule.
- **Tests (Step 14):** keep the 200-race test (exactly one winner); a `SIGKILL`ed holder
  → the next `runIndex` acquires at once and `status` reports the unfinished run; a
  `reindex_owner_pid` naming a live unrelated process (pid 1) does not block a claimant
  (the `reuse.mjs` case, which fails at `HEAD`); `status` shows a running pass as held.

**Why it beats the alternatives:** Option 2 answers "is some process using this pid",
not "is the holder alive". A reused pid holds the claim for the life of an unrelated
process (executed above), and `EPERM` reads another user's process as the holder; both
fail in the direction that stops reindexing indefinitely, with only a `reindex_locked`
fault naming a pid that has nothing to do with the oracle. Option 3 needs the holder to
renew while it is inside long synchronous work, and an expiry value with no source; a
holder that is merely slow loses its claim to a second pass, which is the double-writer
the claim exists to prevent. Option 1's lifetime is the holder process's own, by the
POSIX rule above, so there is no stale state to judge.

**What it costs:** one extra file per project and one open connection during a pass.
POSIX advisory locks are dropped when *any* descriptor of the file closes in the
holding process, so nothing else in the oracle may open `reindex.lock` in the holder's
process (the SQLite page above names this hazard). Advisory locks on network file
systems are only as reliable as the file system's lock support.

**Would be wrong if:** the store lives on a file system whose advisory locks are not
released on process death or not honoured across processes (some network file systems),
or Node's `node:sqlite` were built with a non-POSIX locking VFS on the owner's platform.

---
## G-10 — Completeness edit-set scope

**Item:** [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-correction-register.md@HEAD:L2809-L2810]] "**G-10 — Completeness edit-set scope.** B3a E-9: \"state whether the Completeness edit-set is read per consumer or per session\"; not decided (R-32)."

**Owner?** Engineering. Which agent's edits count as "changed" follows from what the
whisper claims (FR-A2f, AC-1d) and from the consumer key already settled (B3a E-9);
it does not change what the tool is for.

**Options:**
1. Per consumer for both sets: the edited files that trigger the whisper and the files
   counted as already changed are the event consumer's own `ok` edits (what `HEAD`'s
   reader contract gives).
2. Per session for both sets, at `Stop` and at `SubagentStop`.
3. Split by role of the set: the files counted as **already changed** (the "but not Y"
   side) are always the whole session's `ok` edits; the files that **trigger** the
   whisper are the whole session's `ok` edits at the main agent's `Stop`, and the
   subagent's own `ok` edits at its `SubagentStop`.

**Evidence:**
- The open question and its reason: [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B3a-adjudication.md@HEAD:L77-L77]] "state whether the Completeness edit-set is read per consumer or per session, since a subagent's edits made for the main agent would otherwise be invisible to the main agent's Completeness whisper."
- What the whisper claims: [[middleware/context-oracle/docs/specs/spec-context-oracle.md@HEAD:L170-L170]] "| **FR-A2f Completeness** | Edit completed / stop | \"You changed the reducer but not the selector it pairs with in 9 of its last 10 changes.\" |" and [[middleware/context-oracle/docs/specs/spec-context-oracle.md@HEAD:L932-L933]] "On an edit that completes one half of a historically-paired change, the Completeness whisper names the **unchanged partner** with"
- The architecture row and the plan's reader: [[middleware/context-oracle/docs/architecture-phase-a.md@HEAD:L1752-L1752]] "| Completeness `FR-A2f` | `Stop` | session's edited files (`observed_actions`) → un-edited partners above ratio floor |" against [[middleware/context-oracle/docs/plans/plan-phase-a.md@HEAD:L1973-L1973]] "*`ObservedActionsReader`* (this session and consumer): `okEditedPaths():" — the architecture says "session's", the plan's reader is per consumer, and the code follows the plan (`observed_actions.ts` L144–L152: `WHERE session = ? AND consumer = ? AND outcome = 'ok'`).
- A whisper that is false against the repository state is the worst output: [[middleware/context-oracle/docs/specs/spec-context-oracle.md@HEAD:L638-L639]] "now resolves to different content is a checkably-false whisper, the worst output for a provenance tool"
- Delivery stays per consumer: [[middleware/context-oracle/docs/specs/spec-context-oracle.md@HEAD:L220-L221]] "**FR-O6 — Per-consumer delivery**, keyed by `agent_id`/`agent_type` `[HOOKS, OL-8, D-16]`." and the hooks reference's consumer field [[https://code.claude.com/docs/en/hooks.md]] "Unique identifier for the subagent. Present only when the hook fires inside a subagent call."
- The main agent's stop is the done-claim the owner wants checked: [[middleware/context-oracle/OWNER-LEDGER.md@HEAD:L50-L50]] "to catch a completion claim the work doesn't back"

**Decision:** Option 3.
- **Changed set** (a partner in it is never named as unchanged): every `ok` Edit/Write/
  NotebookEdit path in `observed_actions` for the event's `session`, any consumer.
- **Trigger set** (files whose partners are checked): at `Stop` (consumer
  `(session, 'main')`), every `ok` edit path of the session, any consumer; at
  `SubagentStop` (consumer `(session, agent_id)`), that consumer's own `ok` edit paths.
- **Other sessions never count** (a different `session_id` is another conversation,
  B3a E-9's settled key).
- **Headline attribution:** a trigger file edited only by a subagent is worded as
  changed "in this session by a subagent", not "you changed", so the text stays true.
- **Reader contract (Step 6):** `ObservedActionsReader` gains
  `sessionOkEdits(): { path: string; consumer: string }[]` (DAO
  `observed_actions.sessionOkEdits(session)`: `WHERE session = ? AND outcome = 'ok' AND
  path IS NOT NULL AND tool IN (EDIT_TOOLS)`, grouped by `(path, consumer)`);
  `okEditedPaths()` stays for the other readers. AD-15's Completeness row says "the
  session's edited files, all consumers; trigger set per the event (above)".
- **Tests (`T-18-x`, Completeness):** (a) main edits X, a subagent edits Y (X–Y above the
  floor) → no Completeness at main `Stop`; (b) only a subagent edits X → main `Stop`
  names Y, worded "by a subagent", and the subagent's `SubagentStop` names Y to the
  subagent; (c) another session edits Y → session 1's `Stop` still names Y; (d) a failed
  Edit of Y (`outcome` not `ok`) does not count as changed.

**Why it beats the alternatives:** Option 1 makes the main agent's whisper say "not Y"
when a subagent of the same session did change Y: a checkably false statement about the
tree, the worst output by the spec's own line. It also hides a half-finished pair that a
subagent left from the main agent's done-claim, the case OL-12 wants caught. Option 2
tells a subagent "you changed X" about files only the main agent touched, which is false
for that consumer and pulls its attention to work that is not its own. Option 3 keeps
each consumer's trigger to work it owns (the main agent owns what it delegated) and
counts every change the session made before calling a partner unchanged.

**What it costs:** one DAO read and one reader method; the main agent may be told about a
pair that a subagent was already told about (delivery is per consumer, so both hear it
once).

**Would be wrong if:** a subagent's edits are routinely not part of the main agent's task
(for example a subagent working a separate task the main agent never reports on), in
which case main-`Stop` triggers from subagent edits would be noise.

---
## G-9 — TypeScript `.json` imports

**Item:** [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-correction-register.md@HEAD:L2807-L2808]] "**G-9 — TypeScript `.json` imports.** B9 verification item 4: \"Settle `.json`\"; no rule given (R-70)."

**Owner?** Engineering (resolver rule, AD-12).

**Options:**
1. Status quo: a `.json` specifier is never resolved.
2. Mirror `tsc`: read the project's `tsconfig.json` (with its `extends` chain) and
   resolve a written `.json` path only when `resolveJsonModule` is on.
3. Resolve a relative specifier whose written extension is `.json` to that path when the
   file exists in the repository, `unresolved` when it does not; never append `.json`
   to an extensionless specifier.
4. Exclude `.json` specifiers from the resolver's classes altogether (no edge, not
   counted in the unresolved share).

**Evidence:**
- What the resolver's classes are for: [[middleware/context-oracle/docs/architecture-phase-a.md@HEAD:L1409-L1409]] "specifier as *resolved* (it yields an `import_edges` row), *external* (a" and the share they feed: [[middleware/context-oracle/docs/architecture-phase-a.md@HEAD:L1416-L1417]] "per language (unresolved ÷ (resolved + unresolved)). AD-15's Reuse treats a language whose share exceeds `reuse.max_unresolved_import_share` (AD-5; seed"
- `HEAD`'s rule: a non-TS/JS written extension gets only appended extensions, so a present `./data.json` is `unresolved`: [[middleware/context-oracle/ctxoracle/src/index/resolvers.ts@HEAD:L87-L89]] "// Extensionless, or a non-TS/JS extension (`./user.service`, `./py.py`): // appended extensions, then `/index.*` — never the written path itself. return firstPresent([...APPENDED.map((e) => base + e), ...index], repo);" with [[middleware/context-oracle/ctxoracle/src/index/resolvers.ts@HEAD:L59-L59]] "const APPENDED = ['.ts', '.tsx', '.js', '.jsx'];"
- The batch 9 finding: [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B9.md@HEAD:L179-L179]] "and `./data.json` resolves under `resolveJsonModule`; the plan's rule gives `unresolved` for both."
- TypeScript 5.9.3 (`$T` = this checkout's `ctxoracle/node_modules/typescript/bin/tsc`, `node $T --version` → `Version 5.9.3`), executed in `$G/tsjson` (`src/data.json`, `package.json` `{"type":"module"}`, and `src/main.ts` importing `./data.json` with `with { type: "json" }` and extensionless `./data`): [[ran]] `node $T -p tsconfig.json --traceResolution | grep -E "Module name '\./data(\.json)?' was|error TS"` →
  - `module`/`moduleResolution` `nodenext`, `resolveJsonModule: true` → `Module name './data.json' was successfully resolved to '$G/tsjson/src/data.json'.` / `Module name './data' was not resolved.`
  - the same with `resolveJsonModule: false` → `Module name './data.json' was not resolved.` / `error TS2732: Cannot find module './data.json'. Consider using '--resolveJsonModule' to import module with '.json' extension.`
  - `moduleResolution: bundler`, `resolveJsonModule: true` → `'./data.json' was successfully resolved` / `Module name './data' was not resolved.`
  So `tsc` never appends `.json`, and resolves a written `.json` path only under the flag.
- The flag is a type-checker permission for a runtime-normal dependency: [[https://www.typescriptlang.org/tsconfig/resolveJsonModule.html]] "Allows importing modules with a .json extension, which is a common practice in node projects." Node 22 loads JSON modules natively: [[https://nodejs.org/docs/latest-v22.x/api/esm.html]] "JSON modules are no longer experimental." and [[https://nodejs.org/docs/latest-v22.x/api/esm.html]] "The with { type: 'json' } syntax is mandatory"
- JSON files are indexed (path tokens only), so an edge has a target row: [[middleware/context-oracle/docs/architecture-phase-a.md@HEAD:L1395-L1396]] "and prose and data formats (Markdown, reStructuredText, plain text, JSON, YAML, CSV and similar, listed in the"

**Decision:** Option 3.
- In `resolveTsImport`, before the "non-TS/JS extension" branch: when a relative
  specifier's written extension is `.json`, return `firstPresent([base], repo)` — the
  written path if the repository holds it (`resolved`, one `import_edges` row to the JSON
  file), else `unresolved`. Nothing else changes: an extensionless specifier never tries
  `.json`, and a bare `.json` package subpath (`pkg/data.json`) follows the bare-specifier
  rule.
- The rule applies to every importer the TS/JS resolver serves (`.ts`, `.tsx`, `.js`,
  `.jsx`, `.mjs`, `.cjs`, `.mts`, `.cts`), and `tsconfig.json` is not read.
- AD-12's resolver paragraph states: "a written `.json` relative path is resolved when
  present (a JSON-module dependency — Node 22 JSON modules; `tsc` under
  `resolveJsonModule`); `.json` is never appended". Step 15's rule text says the same.
- Tests (`T-15-5` cells): `./data.json` present → resolved to `src/data.json`;
  `./missing.json` → `unresolved`; `./data` with only `data.json` present → `unresolved`;
  the same three from a `.js` importer.

**Why it beats the alternatives:** The resolver's output is a dependency graph and an
unresolved share, not a type-check verdict. An importer that names an existing JSON file
depends on it at run time whatever `tsconfig` says, so option 2 would record a real
dependency as `unresolved` in every JavaScript project without a `tsconfig.json` and in
every TypeScript project that loads JSON another way, inflating the share that switches
Reuse off; it also needs an `extends`-chain reader for no gain. Option 1 does that
inflation today. Option 4 drops a real edge and hides a genuinely broken `.json` import.
Option 3 records the dependency when it exists and the failure when it does not, and it
matches `tsc` exactly on the one axis `tsc` itself decides by file lookup (a written
path, never an appended `.json`).

**What it costs:** JSON files gain import in-degree, so a heavily imported JSON file can
rank as an Orientation hub; that is a true fact about the file.

**Would be wrong if:** `import_edges` is meant to hold only type-checked module edges
(then option 2 is the rule), or the repositories served commonly import JSON through a
mechanism that resolves a different file than the written path.

**Flaw raised in passing (not settled here):** the same `HEAD` branch makes every present
non-code asset import that bundlers resolve (`./styles.css`, `./logo.svg`) `unresolved`,
which inflates the unresolved share the same way. The correction pass should rule on
that class with its own sources; this section does not extend option 3 to it.

---
## G-6 — A stored non-numeric `deny.loop_threshold`

**Item:** [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-correction-register.md@HEAD:L2798-L2801]] "**G-6 — A stored non-numeric `deny.loop_threshold`.** B6 verification item 2 states the defect (recorded as `store_corrupt`, the deny stops) and that only new writes are refused; no correction for an already-stored bad value is on record beyond retiring the catch-all at Step 28 (B6a E-24) (R-124)."

**Owner?** Engineering (error handling of stored configuration). The consequence for the
deny is governed by FR-O3, a spec line; see **Would be wrong if**.

**Options:**
1. Serve the seed for an invalid stored value and record a fault (the rule R-54 (b)
   applies to an ordering violation).
2. Fail fast at the reader: validate the whole stored set when the reader is built,
   throw a named error on the first invalid row, record it under its own code once per
   occurrence, surface it in `status` until it is fixed, and let FR-O3 decide the
   event's outcome; and close every write route to invalid values.
3. Contain per key: only the component that reads the bad key fails; the rest of the
   event (including the deny) continues.
4. Repair: rewrite the bad row to its seed.

**Evidence:**
- The defect: [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B6-verification.md@HEAD:L109-L112]] "A stored non-numeric `deny.loop_threshold` is recorded as `store_corrupt` and the deny stops (6a E-24). - `tune` now refuses non-numeric values, but a stored bad value is still read that way." and the executed deny loss [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B6a-adjudication.md@HEAD:L181-L181]] "with `deny.loop_threshold = 'abc'`, the identical `PreToolUse` → `node exit=0`, `stdout bytes: 0 stderr bytes: 0`"
- The reader already throws, and says why: [[middleware/context-oracle/ctxoracle/src/stores/dao/tuning.ts@HEAD:L84-L84]] "/** A finite number, or throw naming the key (an unparsable tunable is a bug, not a default). */"; the write check knew the consequence: [[middleware/context-oracle/ctxoracle/src/stores/dao/tuning.ts@HEAD:L189-L189]] "key whose seed is numeric (`num()` throws on one, so every event reading the" / [[middleware/context-oracle/ctxoracle/src/stores/dao/tuning.ts@HEAD:L190-L190]] "key would fail open)."
- The mislabel: [[middleware/context-oracle/ctxoracle/src/hook/handler.ts@HEAD:L276-L276]] "const code = e instanceof DeadlineExceeded ? 'latency_breach' : 'store_corrupt';"
- The event outcome on any error is the spec's: [[middleware/context-oracle/docs/specs/spec-context-oracle.md@HEAD:L508-L510]] "**FR-O3 — Fail open, fast** `[OL-3]`. Any shim/service error, timeout, or missing store yields silence — and, on a block path, **emits no deny, so the agent's action proceeds** — never an error in the agent's flow."
- Fail-fast on exactly this case, configuration read with a default: [[https://martinfowler.com/ieeeSoftware/failFast.pdf]] "A common approach is to return null or a default value:" / [[https://martinfowler.com/ieeeSoftware/failFast.pdf]] "In contrast, a program that fails fast will throw an exception:" / [[https://martinfowler.com/ieeeSoftware/failFast.pdf]] "a default value, everything will seem fine. But when customers start using the software, they'll encounter mysterious slowdowns." and the shape of the handler: [[https://martinfowler.com/ieeeSoftware/failFast.pdf]] "You can create a global exception handler to gracefully handle unexpected exceptions, such as assertions, and bring them to the developers' attention." / [[https://martinfowler.com/ieeeSoftware/failFast.pdf]] "If you use a global exception handler, avoid catch-all exception handlers in the rest of your application."
- Visibility is the owner's requirement: [[middleware/context-oracle/OWNER-LEDGER.md@HEAD:L48-L48]] "**\"it could fail a hundred ways in front of me and I wouldn't know.\"**"
- The settled rule this decision conflicts with: [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-correction-register.md@HEAD:L1158-L1159]] "(b) The stored-set ordering check at reader construction: on a violating stored set, record a fault and serve the seeds"

**Decision:** Option 2.
1. **Validate at construction.** `tuningReader(...)` validates every stored row it would
   serve (global rows and the repository's overrides) with the same per-key rules
   `checkTuningWrite` applies to a write — a finite number for a numeric seed, a list
   key held as list rows, a known key — and with the stored-set relations of R-54 (b)
   (the ordering and tier relations and the half-life relation). The first failure
   throws `TuningInvalid` carrying `{key, value, rule, scope: 'global'|'project'}`. The
   validation is bounded by the key registry, not by store size.
2. **One handler, one code.** Step 28's top-level handler (which replaces the
   `store_corrupt` catch-all, R-77 (e)) records `tuning_invalid` (new Step 6 code;
   detail as above, `value` truncated to 200 characters) for a `TuningInvalid`, and
   `handler_exception` for other errors. It records `tuning_invalid` once per distinct
   `(key, value)`, keyed by a `schema_meta` marker cleared when the reader next builds
   cleanly, as `index_stale` is recorded on the transition only. The event's outcome is
   FR-O3's: silence, and no deny.
3. **Visible until fixed.** `status` lists an active `tuning_invalid` first, in plain
   language: the key, the stored value, the rule it breaks, that every hook event is
   silent (the answer-drift deny included) until it is fixed, and the command that fixes
   it (`ctxoracle tune <key> <valid value>`, which `checkTuningWrite` accepts). The
   off-path verbs build the same reader, so `index` and `init` refuse with the same
   message and a non-zero exit.
4. **Close the write routes.** `tune` already refuses (`c3a25f0`); `import` validates the
   incoming tuning rows with the same validator before writing and refuses the import
   naming the row (R-81's validate-before-write); a Step 12 test asserts every seed in
   `tuning_seeds.ts` passes the validator.
5. **R-54 (b) and R-28 change with it:** a stored-set ordering violation is also a
   `TuningInvalid` (rule named), not "record a fault and serve the seeds".
6. **Tests:** `T-12-x`: a stored `deny.loop_threshold = 'abc'` → constructing the reader
   throws `TuningInvalid {key: 'deny.loop_threshold', value: 'abc', rule: 'finite number'}`;
   a stored `bar.suspect_confidence_cap` above `bar.high_confidence_min` → the same with
   the relation named. `T-28-x`: the handler on a `PreToolUse` with the bad row records
   one `tuning_invalid` over two events, no `store_corrupt`, emits nothing; after `tune`
   fixes the row the next event's deny fires and the marker is cleared. `T-33-x`:
   `status` shows the condition with the fixing command.

**Why it beats the alternatives:** Option 1 is the failing-slowly pattern Shore names:
the owner's stored value is silently replaced by another, the oracle behaves as if
configured one way while the store says another, and the fault is one row among many.
Option 4 does the same and also writes on the event path, which R-54 (a) forbids.
Option 3 keeps the deny alive against an unrelated bad key, but FR-O3 requires silence
on any error on the block path, so it would contradict a spec line. Option 2 fails at
the point of the error, with the error in context, under one global handler, and keeps
it in front of the owner until fixed; closing the write routes removes the cause for
every value the oracle itself can write.

**What it costs:** a bad stored row silences every event, the deny included, until
`tune` fixes it; with the write routes closed, such a row can only come from outside
the oracle (a hand edit of the store or a store written by an older build).

**Would be wrong if:** FR-O3 is changed so that the deny continues through errors in
components it does not depend on (an agent-written spec line; a change needs Max
Cogar's sign-off under the M38 procedure); option 3 would then be the rule.

---
## G-3 — Structural-fact confidence

**Item:** [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-correction-register.md@HEAD:L2790-L2791]] "**G-3 — Structural-fact confidence.** B2 E-5 (b) / B2 item 4: \"Define structural-fact confidence or state the gap\"; no definition exists (R-26, R-72, R-74)."

**Owner?** Engineering (the bar's confidence axis, AD-14; `D-6bar` makes the combinator
the architect's).

**Options:**
1. Treat an index-derived fact as certain (`c = 1`, dampened by staleness and trust):
   the index reads the current code.
2. Leave the confidence axis undefined for structural facts and let them skip it.
3. Give each structural genre a stated, tunable confidence seeded inside the band that
   passes the floor but stays below the high tier under every dampener, so the fact is
   spoken, always flagged uncertain until calibrated, and never counted by `support`.
4. Derive a per-fact confidence from the extraction path (parsed versus generic
   frontend, resolved versus heuristic edge).

**Evidence:**
- The defect: [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B2-adjudication.md@HEAD:L61-L61]] "AD-14 defines confidence for history facts and human facts only; the bar applies the floor to every non-human, non-hazard candidate and reads `c.ratio ?? 0`, so a structural candidate with no ratio fails by construction." At `HEAD` AD-14 still gives index-derived facts only a staleness rule: [[middleware/context-oracle/docs/architecture-phase-a.md@HEAD:L1606-L1607]] "(Orientation, Reuse, Verification's mapping) when `index_head` ≠ `HEAD`. Either multiplies by `bar.stale_factor` (seed 0.9)."
- What the axis must mean: [[middleware/context-oracle/docs/specs/spec-context-oracle.md@HEAD:L232-L232]] "it is **jointly** (a) backed by real evidence (**confidence**), (b) materially" and AC-14's form rule [[middleware/context-oracle/docs/specs/spec-context-oracle.md@HEAD:L1071-L1071]] "its pointer, states its evidence ratio when history-derived, flags confidence when not"
- What each structural claim is made of. Orientation's ranking and Verification's mapping are conventions, not measurements: [[middleware/context-oracle/docs/architecture-phase-a.md@HEAD:L1366-L1367]] "A test file's `import_edges` targets are the files it covers." (an import is taken to mean coverage); Reuse's counts are an identifier match, already capped as a heuristic: [[middleware/context-oracle/docs/architecture-phase-a.md@HEAD:L1623-L1624]] "heuristic cap on `symbol_refs`-derived Reuse facts (AD-12, L6; `bar.heuristic_confidence_cap`, seed 0.7) is a cap with the same placement."; and AD-12 already promises a lower confidence it never defines: [[middleware/context-oracle/docs/architecture-phase-a.md@HEAD:L1459-L1460]] "pointers — P4; the generic frontend is a fallback whose facts carry lower confidence by construction, and FTS path/word coverage keeps its languages"
- The dampeners every structural fact receives: index facts are repository content, [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@HEAD:L399-L399]] "return { prov_kind: 'repo_span', prov_ref: p, trust: 'untrusted_repo', injection_suspect: injectionSuspect };", so [[middleware/context-oracle/docs/architecture-phase-a.md@HEAD:L1616-L1616]] "evidence ratio × `bar.untrusted_trust_factor` (seed 0.9, in (0, 1]), so a" applies, and staleness multiplies by `bar.stale_factor` 0.9 (above); the floor and high tier: [[middleware/context-oracle/docs/architecture-phase-a.md@HEAD:L1695-L1696]] "non-hazard `c` floor 0.6 with `support ≥ 3`; high tier 0.8; untrusted trust factor 0.9; suspect and heuristic caps 0.7; impact floor:"; composition [[middleware/context-oracle/docs/architecture-phase-a.md@HEAD:L1625-L1625]] "**Composition:** dampen first (staleness, trust), then take the min() over"
- AD-14's own seed-placement rule for values of this kind: [[middleware/context-oracle/docs/architecture-phase-a.md@HEAD:L1638-L1639]] "architect defaults like the floors below, chosen strictly inside [0.6, 0.8) so neither sits on a boundary of the interval the ordering"
- The seed band, derived: a structural fact is always `untrusted_repo` and may be
  index-stale, so its dampened confidence is `s × 0.9 × 0.9 = 0.81 s` at worst and `0.9 s`
  fresh. Clearing the 0.6 floor at worst needs `s ≥ 0.6 / 0.81`; staying below the 0.8
  high tier fresh needs `0.9 s < 0.8`, i.e. `s < 0.889`, and staying below it with no
  dampener (a trust factor tuned to 1) needs `s < 0.8`. [[ran]] `python3 -c "print(0.6/(0.9*0.9), 0.75*0.9*0.9, 0.7*0.9*0.9, 0.75*0.9)"` → `0.7407407407407407 0.6075 0.5670000000000001 0.675`. So the band is [0.741, 0.8); the existing 0.7 cap value would drop a stale structural fact to 0.567, under the floor.

**Decision:** Option 3.
- **Definition (AD-14 item 1, a third fact class):** a *structural* fact (Orientation's
  entry points, Reuse's dominance claim, Verification's covering-test mapping) has
  evidence confidence `s_g`, a tuning row per genre: `bar.orientation_confidence`,
  `bar.reuse_confidence`, `bar.verification_mapping_confidence`, each seeded `0.75`
  (illustrative, marked so in `tuning_seeds.ts`, chosen strictly inside the derived band
  [0.741, 0.8)), refused by `tune` outside (0, 1]. It is then dampened (index staleness,
  trust) and capped (heuristic cap for Reuse, suspect cap) by AD-14's existing
  composition. The rows are calibrated on Phase A data like every AD-14 seed
  (`D-6bar`); a genre whose corrections show high precision may be tuned into the
  high tier.
- **No `support` and no `ratio` for structural facts.** The bar's `support ≥
  bar.support_min` clause applies to history facts only (support is a count of co-change
  transactions); each structural genre keeps its own evidence rule (Reuse's k×
  dominance, Orientation's match, Verification's existing mapping). Orientation's
  `support: 3, ratio: 1` constants are removed (B2 E-5 (b)).
- **Candidate shape (Step 6):** `FactClass` already has `'structural'`; a structural
  candidate gains a required `statedConfidence: number` (a discriminated union on
  `factClass`), which its generator sets from its own genre's row. The bar uses it in
  place of the history ratio and never reads `ratio` or `support` for the class, so the
  combinator itself still carries no genre term (the `candidate.ts` header's rule; D-18
  concerns the impact axis, and the genre's row is read by the generator, not the bar).
- **Composer:** a structural fact below the high tier carries `[confidence: uncertain]`
  like any other; at the seeds every structural whisper is flagged, fresh or stale.
- **Tests (`T-16-x`):** an Orientation candidate, fresh index → passes the confidence
  axis at 0.675 and composes flagged; stale index → passes at 0.6075; with
  `bar.orientation_confidence` tuned to 0.7 and a stale index → fails the confidence axis
  (0.567); a structural candidate carrying `support`/`ratio` is a type error; a history
  candidate still needs `support ≥ 3`.

**Why it beats the alternatives:** Option 1 presents conventions (an import taken as
coverage, a ranking taken as "entry point", an identifier match taken as a reference) as
certain, which is the look-more-complete-than-it-is output CLAUDE.md rule 3 forbids; it
is what the skeleton's `ratio: 1` did. Option 2 leaves AD-14's axis undefined for one
class, the defect itself. Option 4 would need measured precision per extraction path,
which no source gives and Phase A has not yet measured; inventing those numbers is the
silent-constant failure again. Option 3 states one number per genre, derives its band
from the bar's own floors and dampeners so no dampener silences a genre by accident,
flags every structural whisper as unmeasured, and gives the calibration a row to move.

**What it costs:** every structural whisper is flagged uncertain until Phase A data
justify tuning a genre up; three new tuning rows.

**Would be wrong if:** a primary measurement of these heuristics' precision exists for
the repositories served (then option 4 with those figures), or the tier invariant's
dampener seeds change so that 0.75 leaves the derived band (then the seed is re-derived,
not kept).

---
## G-1 — Horizons on incremental passes

**Item:** [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-correction-register.md@HEAD:L2786-L2787]] "**G-1 — Horizons on incremental passes.** B7a E-10: \"The mechanism is an engineering choice, made by written comparison\", with two candidates; none chosen (R-23, R-56)."

**Owner?** Engineering (the miner's storage and refresh mechanism, AD-13).

**Options:**
1. B7a's first candidate: on each pass, subtract the contributions of commits that left
   either horizon, re-deriving each one's touched files from git by hash.
2. B7a's second candidate: start a full mine whenever a pass would push the included set
   past either horizon.
3. **Reconcile to a target set, with stored touches.** Define the pass's target set
   `T(HEAD)` (the in-horizon commits of `HEAD`'s history); keep, for every commit that
   contributed, the file ids it contributed to; each pass evicts `S \ T` (stored commits
   no longer in the target) using those stored ids and mines `T \ S`. A full mine is the
   same pass from an empty store.
4. Allow slack: let incremental passes run past the horizon by a margin, then mine in
   full.

**Evidence:**
- The settled requirement and the executed defect: [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B4-verification.md@HEAD:L109-L109]] "Both horizons are enforced on incremental passes too." and [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B7a-adjudication.md@HEAD:L222-L222]] "The incremental store exceeds the cap by two commits and differs from a" (fresh mine, repository `hz`, `horizon_commits` = 3). `HEAD` judges the horizon inside the pass's range: [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@HEAD:L466-L466]] "const firstInHorizon = rangeCount - horizonCommits; // stream positions below this are horizon-excluded"
- The two candidates as written: [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B7a-adjudication.md@HEAD:L232-L232]] "subtract aged-out commits' contributions, re-deriving their touched sets" and [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B7a-adjudication.md@HEAD:L234-L234]] "start a full mine when a pass would push the included set past either"
- The spec: [[middleware/context-oracle/docs/specs/spec-context-oracle.md@HEAD:L1068-L1068]] "beyond-horizon history contribute no edges; append refreshes incrementally; a stale fact"
- Why aggregates alone cannot drop a commit, and the storage AD-13 rejected: [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B4-part2-adjudication.md@HEAD:L10-L10]] "which under the aggregate storage model (no per-commit touched-file lists outside `labelled_touches`) still needs a purge and re-mine" and [[middleware/context-oracle/docs/architecture-phase-a.md@HEAD:L1579-L1580]] "Not per-commit transaction lists as the query model (unbounded growth, aggregation at lookup time)."
- A full mine silences the history genres while it runs: [[middleware/context-oracle/docs/architecture-phase-a.md@HEAD:L1557-L1557]] "`mining_in_progress = 1` (every full mine or re-mine), the history genres —"
- git v2.43.0, the calls option 3 needs: [[https://raw.githubusercontent.com/git/git/v2.43.0/Documentation/rev-list-options.txt]] "Limit the number of commits to output." (`--max-count`); [[https://raw.githubusercontent.com/git/git/v2.43.0/Documentation/rev-list-options.txt]] "Output the commits chosen to be shown (see Commit Limiting section above) in reverse order." (`--reverse` reverses the chosen set, so `HEAD`'s "last `horizon_commits` positions of the reversed stream" is the same set as `--max-count=<N>`); [[https://raw.githubusercontent.com/git/git/v2.43.0/Documentation/rev-list-options.txt]] "Only show the given commits, but do not traverse their ancestors." (`--no-walk`) with [[https://raw.githubusercontent.com/git/git/v2.43.0/Documentation/rev-list-options.txt]] "In addition to getting arguments from the command line, read them from standard input as well." (`--stdin`).
- [[ran]] in a clone of this repository (`$G/aa`, 491 non-merge commits): `diff -q <(git rev-list --no-merges --max-count=$N HEAD | sort) <(git log --no-merges --reverse --format=%H HEAD | tail -$N | sort)` for `N` = 10, 250, 491, 1000 → `N=10 equal` / `N=250 equal` / `N=491 equal` / `N=1000 equal`; and on `$G/h20k` (20,000 synthetic linear commits made with `git fast-import`) with `N=10000` → `N=10000 equal on 20000-commit history`.
- [[ran]] `echo "$H" | git log --no-walk=unsorted --stdin --format='%h'` with `H` three hashes from `HEAD~40`, oldest first → `eab0bfc 039c4be 7a2a8e1` (input order kept; `--numstat` prints each commit's own entries).
- [[ran]] on `$G/h20k`: `time (git log --no-merges --max-count=10000 --format=%H%x00%at HEAD | wc -l)` → `10000`, `real 0m0.203s`; `time (git log --no-merges --numstat --format=%H HEAD~9990..HEAD | wc -l)` → `44907`, `real 0m0.715s`.
- Option 2 derived. Let `N` = `miner.horizon_commits`. Once `HEAD`'s history holds at
  least `N` non-merge commits, each new commit moves the oldest in-horizon commit out,
  so every pass that mines at least one commit crosses the count horizon. The time
  horizon moves with `refTs`, so on any repository with commits spread across more than
  `miner.horizon_years`, most passes cross it too. Option 2 therefore makes almost every
  pass on a mature repository a full mine, each silencing the history genres
  (`mining_in_progress`) for the pass, which is the opposite of AC-13's "append
  refreshes incrementally".
- Storage bound for option 3, derived: rows are kept only for commits in `T`, at most
  `N` = 10,000 (seed); a commit contributes only when it touches at most
  `miner.max_transaction_entities` = 30 files (larger ones are size-excluded and
  contribute nothing), so the touch table holds at most 10,000 × 30 = 300,000 rows.

**Decision:** Option 3. This is written into AD-13 (refresh) and Step 13 as follows.
1. **Target set.** `T(h)` = the commits printed by
   `git log --no-merges --max-count=<miner.horizon_commits> --format=%H%x00%at <h>`
   (with the pinned flags and `--encoding=UTF-8`, R-58) whose `min(%at, refTs)` is at
   least `refTs − miner.horizon_years × 365.25 × 86400`. `h` is the pass's `HEAD`
   resolved once; `refTs` is validated per G-8. This is the set a fresh mine includes
   today, stated as a function of `h` alone.
2. **Storage (a new migration, per CR§1's checksum rule — never an edit of 001):**
   `commit_touches(commit TEXT NOT NULL REFERENCES commits(hash), file_id INTEGER NOT NULL
   REFERENCES files(id), PRIMARY KEY (commit, file_id)) STRICT, WITHOUT ROWID` with an
   index on `(file_id, commit)`, holding the file ids each contributing commit added to
   `change_count` and the pair counts; and `commits.weight REAL` (NULL for a commit that
   contributes nothing), the term that commit added, multiplied with every other weight
   when ruling 2 re-bases the epoch. `commits` holds rows only for commits in `T`
   (size-excluded ones included, so their labels and reasons stay); a commit beyond the
   horizons has no row, and `status` states the horizon (`N` commits / `Y` years). This
   replaces AD-13's "each exclusion recorded in `commits` with its reason" for the
   horizon reason only; tests that assert horizon-excluded `commits` rows change with it.
3. **Each pass:** `S` = the hashes in `commits`; evict `E = S \ T`, then mine
   `A = T \ S`.
   - *Evict* (chunked, bounded and yielded per R-36): per commit, read its
     `commit_touches` ids; delete its `commit_touches`, `labelled_touches` and `commits`
     rows; then recompute from `commit_touches` joined to `commits.weight`, for every
     affected file, `change_count` (a count) and `change_weight` (a sum), and for every
     affected pair `pair_count`, `pair_weight` and `last_ts`, deleting a pair whose count
     is 0. Recomputing, not subtracting, means no cancellation residue can survive.
   - *Mine* `A`: stream `git log --no-walk=unsorted --stdin` with `A`'s hashes fed oldest
     first, the pinned flags, `-M -z --numstat` and the settled format; each commit is
     classified, labelled and counted as today, and a contributing commit also writes its
     `commit_touches` rows and `commits.weight`.
   - If `E` and `A` together take more than one write transaction, the first one sets
     `mining_in_progress = 1`; the final transaction writes the watermark and
     `last_mined_ref` (ruling 1), rebuilds the miner landmines, and clears the flag.
   - A full mine is this pass with `S = ∅`.
4. **Crash:** every evict or mine transaction updates rows and aggregates together, so a
   crash leaves `S` consistent with the sums; the next pass recomputes `E` and `A` from
   `S` and finishes the work. No recorded range is needed for correctness.
5. **Equality:** after any completed pass, every count equals a fresh mine of `h`
   exactly (both are functions of `T` and each commit's touched set), and every weight
   equals it to within summation rounding (the same positive terms in another order:
   relative error at most `(n − 1) · 2^−53` per sum, `n` ≤ 10,000, so ≤ 1.2 × 10^−12;
   tests compare weights with relative tolerance 2.3 × 10^−12, twice that bound). R-55's
   `T-13-5` clauses "fail when any … `pair_weight` … differs from one uninterrupted mine"
   compare weights with this tolerance and counts exactly.
6. **Tests (`T-13-x`):** B7a E-10's `hz` case (cap 3, then two more commits) → the store
   equals a fresh mine (counts exact, weights within tolerance) and holds three
   commits; a time-horizon case (`horizon_years` tuned so one old commit ages out as
   `HEAD` advances) → the aged commit's pairs are gone; a crash after the first evict
   transaction → the next pass completes to the same store; `SIGKILL` timing is taken
   from the `commits` row count (ruling 1).

**Why it beats the alternatives:** Option 2 turns nearly every pass on a mature
repository into a full mine (derived above), silencing the history genres each time and
breaking AC-13's incremental refresh. Option 4 lets beyond-horizon commits contribute
edges, which AC-13 forbids. Option 1 needs git to reproduce, byte for byte, the touched
set a pass computed months earlier (the same flags, rename detection and path decoding)
and needs the commit objects to exist; that holds for commits that aged out of a
horizon but not for commits that left `HEAD`'s history (C-2). Option 3 needs neither:
its eviction reads what the pass itself recorded, its storage is bounded by the horizon
it enforces (300,000 rows at the seeds), and AD-13's reasons for rejecting per-commit
lists — unbounded growth and aggregation at lookup — do not apply, because rows are
evicted with their commits and no event-path read touches them.

**What it costs:** one bounded table and a column; one extra `git log` of at most `N`
lines per pass (0.2 s at 10,000 commits, executed); an evicting pass recomputes the
sums of every file and pair its evicted commits touched. Weights of an incremental store
match a fresh mine to 10^−12, not bit for bit.

**Would be wrong if:** `T(h)` computed by `--max-count` differs from the set a full
`--reverse` stream's last `N` positions give on some history shape (a non-linear history
where git's default order is not what the count horizon should mean), or a repository's
horizon set routinely exceeds the storage bound (a raised `miner.horizon_commits`), in
which case the bound is re-derived from the tuned values.

---

## C-2 — Branch switch: purge or not

**Item:** [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-correction-register.md@HEAD:L2731-L2736]] "**C-2 (open) — Branch switch: purge or not.** B4 p2 E-1 and B4 p3 E-19: a different ref → \"`branch_changed`-class diagnostic …, purge and full re-mine, with the cost stated\". B7a E-28's test list: \"branch switch: a `branch_changed`-class diagnostic, no purge\". B7a states no reason for the change and cites batch 4 as governing. Affects R-23, R-56, R-108. The register carries batch 4's rule (the settled design) and flags B7a's test line."

**Owner?** Engineering. Which history the co-change facts describe after a checkout is a
correctness and cost question about the miner (B4 p2 E-1: "engineering decision
(`OL-11`)").

**Options:**
1. Batch 4's rule: a different ref purges every history table and re-mines `HEAD` in full.
2. Keep the union: never purge; mine `HEAD --not <every mined tip>`, so the store holds
   every line of history ever checked out (ruling 1's multi-tip range).
3. Mine one fixed ref (for example the ref checked out at `init`), whatever is checked
   out.
4. Reconcile the store to `T(HEAD)` with G-1's mechanism: evict the commits that are not
   in the new `HEAD`'s target set, mine the ones missing; record `branch_changed`; no
   purge.

**Evidence:**
- Batch 4's reason for the purge is the storage model, not the semantics: [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B4-part2-adjudication.md@HEAD:L10-L10]] "which under the aggregate storage model (no per-commit touched-file lists outside `labelled_touches`) still needs a purge and re-mine"
- B7a's line, with no reason: [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B7a-adjudication.md@HEAD:L740-L740]] "branch switch: a `branch_changed`-class diagnostic, no purge;"
- The multi-tip union already written into ruling 1: [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B5b-adjudication.md@HEAD:L14-L14]] "for several mined tips, `--not <tip₁> <tip₂> …`"
- The purge's cost to the owner-facing output: [[middleware/context-oracle/docs/architecture-phase-a.md@HEAD:L1557-L1557]] "`mining_in_progress = 1` (every full mine or re-mine), the history genres —"
- The union double-counts a rebased change. [[ran]] `$G/rebase_union.sh` (throwaway repository: `base` touches `a b c`; `f1` on `feature` touches `a b`; `m1` on `main` touches `c`; `f1` cherry-picked onto `main`, as a server-side rebase-and-merge does) → `union of mined tips (feature, main):` `358de54 f1` / `02e9a96 f1` / `21fb7f3 m1` / `cf54afc base`; `stable patch-ids of that set (count, patch-id):` … `2 ee50f1a7c9f91d8a44e90d53e5b4c950b02e3cf0`; `commits touching both a and b in the union:` `358de54 f1` / `02e9a96 f1` / `cf54afc base`; `the same on main alone:` `358de54 f1` / `cf54afc base`. One change counted twice gives the pair `a`–`b` support 3 in the union against 2 in `main`'s history.
- Reconciling needs only the store and `T(HEAD)` (G-1's evidence: `--max-count` target set, `--no-walk --stdin` for the missing commits, 0.2 s for a 10,000-commit target).

**Decision:** Option 4.
- On a pass whose `git symbolic-ref -q HEAD` (or the detached marker) differs from
  `schema_meta.last_mined_ref`, the pass runs G-1's reconcile against `T(HEAD)`:
  it evicts `S \ T` (the old line's commits the new `HEAD` does not have) and mines
  `T \ S` (the new line's commits). There is no purge.
- It records `branch_changed` (Step 6 code) with `{oldRef, newRef, oldWatermark, newHead,
  evicted, added}` in the final transaction, and writes the new watermark and ref.
- The same-ref rewrite rule stays as batch 4 settled (purge and full re-mine); a
  different ref never reaches it. (The same reconcile would serve a rewrite without a
  purge, since it needs no old objects; that change is outside this item and is not made
  here.)
- `T-13-3` pins it: mine on `feature`, switch to `main` (lacking `feature`'s tip) → one
  `branch_changed` with those fields, no purge fault, and the store equals a fresh mine
  of `main` (counts exact, weights within G-1's tolerance); switch back → equals a fresh
  mine of `feature`; the `rebase_union.sh` shape → `a`–`b` support 2 on `main`.
- R-23, R-56 and R-108 take this rule in place of "purge and full re-mine" for a
  different ref; B7a E-28's "no purge" line stands, now with this reason.

**Why it beats the alternatives:** Option 2 is cheap but wrong: it keeps abandoned
branches' evidence for ever and counts every rebased change twice (executed above),
inflating exactly the support and ratios the bar trusts. Option 3 answers questions
about a line of history the agent is not working on, and the fixed ref's local copy can
lag the work. Option 1 is correct but re-mines the whole shared history on every
checkout: for a feature branch `k` commits from `main`, it streams and writes all of
`T` and silences the history genres for that time, where option 4 processes the `2k`
commits that differ, and a switch back and forth costs the same small amount each way.
Option 4 leaves the store equal to a fresh mine of the checked-out `HEAD`, which is
option 1's correctness at the size of the difference.

**What it costs:** it depends on G-1's stored touches; a switch between two long
divergent lines still evicts and mines a lot (bounded by `2N`), with the history genres
silenced while it runs.

**Would be wrong if:** the co-change facts should describe the repository's shared
history independent of the checkout (then option 3 with a stated ref), or G-1's
mechanism is rejected (then option 1 is the correct fallback, not option 2).

---

## C-3 — A crashed full pass

**Item:** [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-correction-register.md@HEAD:L2737-L2742]] "**C-3 (open, minor) — A crashed full pass.** B5b's watermark rule point 3: \"A crashed full pass keeps the settled rule: purge, then a full re-mine.\" B5 verification ruling 1 and B7a E-1 state only \"a crashed pass re-runs its recorded range and skips hashes already in `commits`\", with no full/incremental split; B4 p3 E-19 allowed \"either begins with the purge transaction or resumes incrementally\". R-22/R-55 follow B5b's split; which one T-13-5(a) pins is not settled on record."

**Owner?** Engineering.

**Options:**
1. B5b's split: a crashed full pass purges and starts again.
2. Resume: the next pass continues from what the crashed pass committed.

**Evidence:**
- B5b's rule: [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B5b-adjudication.md@HEAD:L15-L15]] "A crashed full pass keeps the settled rule: purge, then a full re-mine."
- Batch 4 allowed either: [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B4-part3-adjudication.md@HEAD:L105-L105]] "either begins with the purge transaction or resumes incrementally from the watermark"
- Each chunk commits its rows atomically: [[middleware/context-oracle/docs/architecture-phase-a.md@HEAD:L2616-L2618]] "streamed and aggregated outside any transaction; each chunk is one transaction that writes its rows — for the miner, its commits, `change_count` increments, pairs, and `labelled_touches` —"
- Progress under repeated interruption, derived. Let a full pass need `C` chunk
  transactions, and let a pass be interrupted after it has committed `j ≥ 1` of them
  (anything that ends the process can do it: a reboot, a manual kill, the system's
  out-of-memory killer).
  Under option 1 each restart begins again from zero, so if interruptions keep arriving
  before chunk `C` the store never completes and the history genres stay silenced under
  `mining_in_progress`. Under option 2 each pass keeps its `j` committed chunks, so the
  work left falls by at least one chunk per pass and the mine completes after at most
  `C` passes.

**Decision:** Option 2, and it is the same rule as an incremental pass. Under G-1's
reconcile a crashed full pass needs no special case: the next pass computes
`E = S \ T` and `A = T \ S` from the rows the crashed pass committed, keeps
`mining_in_progress = 1` until its final transaction, and finishes. The purge of a
rewrite (batch 4) happens in the pass's first transaction, so a crash after it is
resumed the same way and never purges twice. `T-13-5(a)` pins it: `SIGKILL` a full pass
after `k` chunks (timed from the `commits` row count); the next pass mines only
`T \ S` (its `commitsSeen` equals `|T|` minus the killed pass's `commits` row count) and the completed store
equals an uninterrupted mine; a second case kills every pass after one chunk and asserts
the store completes within `C` passes. B5b's point 3 sentence and R-22/R-55's
"a crashed full pass purges and re-mines" go.

**Why it beats the alternatives:** both leave a correct store once a pass completes;
only option 2 is guaranteed to complete under repeated interruption (derived above), and
it costs nothing extra because each chunk already commits its rows atomically. Option 1
also repeats all committed work on every crash.

**What it costs:** nothing beyond G-1; the flag stays set across the crash, so the
history genres stay silent until the resumed pass finishes, as they would under option 1.

**Would be wrong if:** a crashed pass could leave rows committed without their aggregates
(or the reverse), which AD-26's one-transaction chunk rule and G-1's evict/mine
transactions exclude.

---
## G-4 — Rename-following

**Item:** [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-correction-register.md@HEAD:L2792-L2794]] "**G-4 — Rename-following.** B7a E-16: renames were announced (\"#6: build rename-following into Step 13\"), not built, and \"go to the correction pass as that divergence, with a stated decision\"; no decision is on record (R-91)."

**Owner?** Engineering (settled by B7a E-16: [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B7a-adjudication.md@HEAD:L466-L466]] "So renames are an engineering decision, announced and then not built (the"). The announcement was made to Max Cogar, so the decision below is reported to him in STATUS, with its reason, as a reversal of what he was told; it is not put to him as a question.

**Options:**
1. Build rename-following in the miner: treat a rename entry as one file identity, so
   the new path inherits the old path's counts and pairs.
2. Do not follow renames in Phase A; measure what the split costs on the owner's
   repositories (a per-pass count), record it as a limitation, and let the Phase A exit
   data decide.
3. Follow only exact renames (`-M100%`), which cannot merge two different files.

**Evidence:**
- What was announced, and why: [[/tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/audit/owner-messages.md@FILE:L338-L338]] "My recommendation is to carry the history across renames, because the coupling evidence is about the file, not its name." and [[/tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/audit/owner-messages.md@FILE:L343-L343]] "- **#6:** build rename-following into Step 13."
- Max Cogar's reply in the same exchange, about a different item (OL-C8), which bears on how a scope reversal must be handled: [[/tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/audit/owner-messages.md@FILE:L351-L351]] "I'm constantly fucked by agents arbitrarily defining scope so they don't have to do more work."
- What the miner does at `HEAD`: [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@HEAD:L62-L62]] "/** Raw path bytes as git recorded them; a rename contributes both identities. */"
- git's rename detection is a similarity heuristic: [[https://raw.githubusercontent.com/git/git/v2.43.0/Documentation/diff-options.txt]] "If generating diffs, detect and report renames for each commit." / [[https://raw.githubusercontent.com/git/git/v2.43.0/Documentation/diff-options.txt]] "it is a threshold on the similarity index (i.e. amount of addition/deletions compared to the file's size)." / [[https://raw.githubusercontent.com/git/git/v2.43.0/Documentation/diff-options.txt]] "The default similarity index is 50%."; and git's own history-following is limited: [[https://raw.githubusercontent.com/git/git/v2.43.0/Documentation/git-log.txt]] "Continue listing the history of a file beyond renames (works only for a single file)."
- The one real repository available, measured. [[ran]] `$G/renames.sh $G/aa` (a clone of this repository) → `non-merge commits: 491`; `commit 6d9b8ba: 1 rename entries, 2 files`; `commit a51aa20: 1 rename entries, 1 files`; `commit f640edc: 1 rename entries, 1 files`; `commit b453f64: 36 rename entries, 56 files (size-excluded)`; `commit 1f2bcb3: 1 rename entries, 1 files`; and for the four renames in commits under the cap, `old path carries 1 earlier commit(s)` each. Following would carry four commits of history on this repository.
- Following conflicts with G-1's invariant, derived. G-1's reconcile needs each
  commit's contribution to be a function of that commit alone (so any commit can be
  evicted or mined in any order). With following, a commit made before a rename counts
  under an identity that a *later* commit (the rename) decides; evicting the rename
  commit (horizon aging, a branch switch that lacks it) would have to split the identity
  again and re-key every earlier commit's stored touches. Two branches renaming one file
  to different names give two answers for the same earlier commit.

**Decision:** Option 2.
- AD-13 and Step 13 state: renames are not followed in Phase A; a rename entry
  contributes both paths (as at `HEAD`); the reason is the three points under **Why**.
- The miner records per pass, in the pass result and `status`: the number of rename
  entries in contributing commits, and the number of those renamed old paths with
  earlier contributing commits in `T` (the history a follower would carry). Both are
  counted from the stream the pass already reads (`-M -z --numstat` marks renames), and
  from the stored `commit_touches` of G-1.
- Limitations gains an entry: renamed files start with no history under the new name,
  and their earlier coupling is silent (the safe direction, under-firing); the counts
  above measure how much; the Phase A exit data decide whether Phase B builds following
  (then designed against G-1's invariant, for example as a rename map applied at read
  time rather than at mining).
- STATUS records the reversal of the 2026-09-25 announcement "#6: build
  rename-following into Step 13", with this reason and the measured figure.
- Test (`T-13-x`): a rename commit under the cap increments the rename count; the old
  path's earlier commit is counted in "history a follower would carry".

**Why it beats the alternatives:** Option 1 was recommended on a sound principle (the
evidence is about the file), but it makes a commit's contribution depend on later
commits, which breaks the order-independence G-1 and C-2 rest on; its default detector
merges two different files at 50 % similarity, which fabricates coupling (the unsafe
direction for a tool whose worst output is a false fact); and the one repository
available shows four commits of history at stake. Option 3 removes the false merges but
keeps the order dependence. Option 2 costs silence on renamed files, which is the safe
direction, and makes that cost a measured number on the owner's repositories instead of
a guess, which is Phase A's stated purpose.

**What it costs:** renamed files lose their pre-rename coupling until Phase B, if the
data say it matters; one announced action is reversed, and the reversal is reported.

**Would be wrong if:** the Phase A counts show that renamed files carry a material share
of the history on the owner's repositories (then following is built in Phase B), or a
following design exists that keeps each commit's contribution independent of later
commits (then option 1's objection falls).

---
## G-5 — The residual StoreBusy under the 25 ms yield

**Item:** [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-correction-register.md@HEAD:L2795-L2797]] "**G-5 — The residual StoreBusy under the 25 ms yield.** B8 verification item 6: 3 of 2,310 with the yield; \"The cause of the residual 3 is not established\", while the fix's test \"must show 0 `StoreBusy`\" (R-68, R-107)."

**Owner?** Engineering (AD-26 concurrency).

**Options** (for the fix, once the cause is known):
1. Keep the 25 ms yield and the ~100 ms write bound as ruled, and state the residual as
   unexplained.
2. Keep them, and remove the part of each hold that the bound does not control: run the
   off-path passes' connections with `PRAGMA synchronous = NORMAL`, so a commit holds
   the write lock without an fsync; record every hold that exceeds the event path's
   window as a fault so any future residual has its cause on record.
3. Raise the yield (larger `miner.chunk_gap_ms`).
4. Raise the event path's `busy_timeout`.

**Evidence:**
- The record: [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B8-verification.md@HEAD:L124-L126]] "A 25 ms yield (batch 3's settled rule) takes it to 3 of 2,310 and 0 of 2,430. It costs +51% pass time (98.2 s → 148.4 s). - The cause of the residual 3 is not established." and [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B8a-adjudication.md@HEAD:L262-L262]] "`chunk_ms` is a target the do-while loop checks after each write, so it is not a ceiling." (the loop at `HEAD`: [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@HEAD:L411-L411]] "} while (next < items.length && performance.now() - started < chunkMs);"); the test to meet: [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B8a-adjudication.md@HEAD:L291-L291]] "- The fix's test is the contention run above, which must show 0 `StoreBusy`."
- SQLite's busy handler (3.51.2, the version Node 22.22.2 bundles): [[ran]] `curl -sSL https://raw.githubusercontent.com/sqlite/sqlite/version-3.51.2/src/main.c | sed -n '1717,1720p'` → `static const u8 delays[] =` / `{ 1, 2, 5, 10, 15, 20, 25, 25,  25,  50,  50, 100 };` / `static const u8 totals[] =` / `{ 0, 1, 3,  8, 18, 33, 53, 78, 103, 128, 178, 228 };`, clipped at the timeout by [[https://raw.githubusercontent.com/sqlite/sqlite/version-3.51.2/src/main.c]] "if( prior + delay > tmout ){" and [[https://raw.githubusercontent.com/sqlite/sqlite/version-3.51.2/src/main.c]] "delay = tmout - prior;"; the contract: [[https://www.sqlite.org/c3ref/busy_timeout.html]] "The handler will sleep multiple times until at least \"ms\" milliseconds of sleeping have accumulated." Within 100 ms the attempts fall at 0, 1, 3, 8, 18, 33, 53, 78 and 100 ms (settled in batch 3), so a gap of 25 ms always contains one; a waiter using `Store.transaction` gets two such tries.
- **Reproduction.** `$G/idx.mjs` runs `runIndex` (the `HEAD` build, `busyTimeoutMs` 5000, as `src/cli/context.ts` opens it) over `$G/big` (20,000 one-line `.ts` files in one commit) and times every depth-0 transaction (call, lock acquired, COMMIT returned); `$G/app.mjs` is the event-path stand-in (`openStore` defaults, one `observed_actions` append in `Store.transaction` every 20 ms). `$G/b-chunk25` is the `HEAD` `dist` with `Atomics.wait(…, 25)` after each `writeChunked` chunk; `$G/b-177gap` is B8a's own `177e59f` gap build; `$G/b-none` is `HEAD` unchanged. `runload.sh` adds three CPU spinners, `runio.sh` adds N processes writing and `fsync`ing 8 MB in a loop; `IDX_SYNC=NORMAL` sets the pass's connection to `synchronous = NORMAL`. [[ran]] `$G/run.sh <build> <label>` (and the two wrappers) →
  - `none-r1 appends ok 171 StoreBusy 355` (no yield: the defect reproduces)
  - `chunk25-r1 appends ok 2155 StoreBusy 0`; `chunk25-r2 appends ok 2125 StoreBusy 0`
  - `g177-r1 appends ok 2094 StoreBusy 0`; `g177-r2 appends ok 2159 StoreBusy 0`
  - `load3-r1 appends ok 2323 StoreBusy 0`; `load3-r2 appends ok 2423 StoreBusy 0`
  - `io2full-r1 appends ok 1922 StoreBusy 0`; `io2norm-r1 appends ok 2115 StoreBusy 0`
  - `io4full-r1 appends ok 1839 StoreBusy 0`; `io4norm-r1 appends ok 1856 StoreBusy 0`
  So 0 of 21,011 appends failed in ten runs with the yield, including B8a's own build; B8a's 3 of 2,310 did not recur.
- **The holds in those runs.** [[ran]] `python3 $G/holds.py <runs>` → `chunk25-r1: tx 1648 hold p50 54.1 p99 62.7 max 148.9 ms; >150 ms 0; >200 ms 0`; `g177-r2: … max 78.4 ms`; `load3-r2: … p99 68.3 max 116.6 ms`; `io2full-r1: tx 1743 hold p50 61.1 p99 85.0 max 179.8 ms; >150 ms 1; >200 ms 0`; `io2norm-r1: tx 1823 hold p50 53.1 p99 74.9 max 129.8 ms; >150 ms 0; >200 ms 0`; `io4full-r1: tx 1696 hold p50 84.0 p99 136.7 max 187.9 ms; >150 ms 2; >200 ms 0`; `io4norm-r1: tx 1647 hold p50 53.1 p99 131.2 max 149.8 ms; >150 ms 0; >200 ms 0`.
- **What makes a waiter fail, isolated.** `$G/hold/writer.mjs` holds the write lock `H` ms per transaction with a 25 ms yield; `waiter.mjs` is the event-path stand-in above. [[ran]] `$G/hold/run.sh <H> 25 20000` → `H=150 … {"ok":127,"busy":0}`, `H=190 … {"ok":109,"busy":0}`, `H=200 … {"ok":98,"busy":1}`, `H=205 … {"ok":96,"busy":16}`, `H=210 … {"ok":100,"busy":28}`, `H=220 … {"ok":96,"busy":66}`, `H=250 … {"ok":99,"busy":73}`, `H=300 … {"ok":64,"busy":62}`. With the yield in place a waiter fails only when one hold outlasts its two tries, about 200 ms.
- **Replaying the measured timelines.** `$G/sim.py` replays a run's measured holds against SQLite's schedule and the retry, for every waiter start on a 0.25 ms grid, adding `delta` ms to every sleep: [[ran]] `python3 $G/sim.py db-chunk25-r1/tx.json 100` → `sleeps=[1, 2, 5, 10, 15, 20, 25, 22]`, and for `delta` 0, 0.5, 1, 2, 3, 5 and 8 ms `failing start times 0 of 540175`. Sleep overshoot does not produce failures against these timelines; only a hold longer than the window does.
- What sets a hold's length beyond `chunk_ms`: the do-while overrun (above) and the commit. [[https://www.sqlite.org/pragma.html]] "With synchronous=FULL in WAL mode, an additional sync operation of the WAL file happens after each transaction commit." and [[https://www.sqlite.org/pragma.html]] "In WAL mode when synchronous is NORMAL (1), the WAL file is synchronized before each checkpoint and the database file is synchronized after each completed checkpoint and the WAL file header is synchronized when a WAL file begins to be reused after a checkpoint, but no sync operations occur during most transactions." with [[https://www.sqlite.org/pragma.html]] "Transactions are consistent with or without the extra syncs provided by synchronous=FULL." It is a per-connection setting: [[ran]] (`$G/sync.db`, WAL) connection `a` runs `PRAGMA synchronous=NORMAL`, connection `b` opens the same file → `a 1 b 2`. Node 22.22.2's SQLite defaults WAL connections to FULL: [[ran]] `node -e "const {DatabaseSync}=require('node:sqlite');const d=new DatabaseSync(':memory:');console.log(JSON.stringify(d.prepare(\"select group_concat(compile_options,' ') o from pragma_compile_options\").get()))"` → `… DEFAULT_SYNCHRONOUS=2 DEFAULT_WAL_AUTOCHECKPOINT=1000 DEFAULT_WAL_SYNCHRONOUS=2 …`. (The holds above are measured from lock acquisition to COMMIT's return, which also includes an automatic checkpoint that SQLite runs after releasing the lock, so they are upper bounds.) Under four fsync writers the FULL pass's holds reached 187.9 ms and the NORMAL pass's 149.8 ms (above).

**Decision:**
- **Cause, as far as it can be established.** The three failures of B8a's first run
  cannot be re-attributed: that run logged no hold timeline, and ten runs here (0 of
  21,011) did not reproduce them. The mechanism that can produce them is established:
  with the 25 ms yield, a waiter with one retry fails only when a single write-lock hold
  of the pass outlasts its two tries, ~200 ms (the `H` sweep); and the pass's holds are
  not bounded by `chunk_ms`, because the chunk loop checks time after each write and the
  commit's WAL fsync (`synchronous = FULL`) is added on top, reaching 180–188 ms under
  disk contention here. A hold crossing 200 ms during B8a's run is the only mechanism
  consistent with these measurements, but it is not shown for that run, and whether that
  machine was under other load at the time is not on record.
- **Fix (option 2), written into AD-26, Steps 3, 13, 14:**
  1. R-68/R-36 (b)'s bound stands: elapsed time is checked **before** each write, so a
     chunk's writing time stays within `miner.chunk_ms` plus one write.
  2. The miner's and the indexer's pass connections run `PRAGMA synchronous = NORMAL`
     right after `openStore` (an `openStore` option `synchronous: 'normal'`, off-path
     only). Every other connection keeps SQLite's WAL default, FULL. Why this is safe:
     WAL stays consistent under NORMAL (above); what a power loss can take is the pass's
     last commits, and the pass's rows are derived from git and the working tree, so the
     next pass re-mines or re-indexes them (G-1's reconcile; `index_head` for the index);
     the handler's and the CLI's human-entered rows never go through a NORMAL
     connection.
  3. Each pass records its longest write-lock hold in its result and in `status`, and
     records one `write_hold_exceeded` fault (new Step 6 code, detail
     `{writer, holdMs, phase}`) for any hold over 150 ms, so a hold that could cost the
     event path its write is on record with its size (150 ms leaves 50 ms of the
     ~200 ms window as margin).
  4. The contention test (R-68) keeps its criterion, 0 `StoreBusy`, and prints the pass's
     longest hold and any `write_hold_exceeded` faults, so a failure says whether a hold
     crossed the window. (The hold is measured as the adapter can see it, lock acquired
     to COMMIT returned — an upper bound, as noted above.)
- **Flaw raised in passing (Step 28):** the reproduction's appender uses
  `Store.transaction`, as AD-26 designs the handler's write groups ("the
  `observed_actions` append in one"). The skeleton handler at `HEAD` does not: its
  writes are autocommit statements outside `Store.transaction`
  (`handler.ts` L204 `oa.append({`, L254 `audit.append({` with its delivered-set insert
  separate), so each has one 100 ms try and no retry, a busy error reaches the catch-all
  as `store_corrupt`, and the audit row and its delivered-set row are not atomic.
  [[ran]] `WAITER=waiterauto.mjs $G/hold/runw.sh <H> 25 20000` (the same writer against
  one autocommit INSERT) → `H=95 … {"ok":248,"busy":0}`, `H=105 … {"ok":178,"busy":36}`,
  `H=120 … {"ok":163,"busy":124}`: the skeleton's window is 100 ms, which the measured
  holds exceed under load. Step 28 must put each write group in `Store.transaction`,
  as AD-26 already says; the ~200 ms window above assumes it.

**Why it beats the alternatives:** Option 1 leaves the test's "0 `StoreBusy`" resting on
luck under disk load. Option 3 does nothing for a single long hold, the only mechanism
that fails a waiter once the yield exists (the sweep and the replay), and each extra
millisecond of yield costs pass time at g/c (B8a). Option 4 spends the event path's
latency budget (NF-1) to cover the pass's durability I/O. Option 2 removes the fsync
from the pass's holds at no correctness cost to anything a human wrote, and turns any
future residual into a recorded hold size instead of an unexplained count.

**What it costs:** a power loss during a pass can lose that pass's last commits, which
the next pass redoes; one more fault code; one `openStore` option.

**Would be wrong if:** a hold over 200 ms can occur with `synchronous = NORMAL` and the
before-write bound (for example from a WAL checkpoint run inside the pass's commit, or a
filesystem stall on reads), in which case the pass's holds need a different bound, or
the pass's rows turn out to include data that cannot be re-derived after a power loss.

---
## G-7 — The off-path busy timeout's value

**Item:** [[middleware/context-oracle/docs/reviews/2026-09-28-branch-audit-correction-register.md@HEAD:L2802-L2804]] "**G-7 — The off-path busy timeout's value.** B7b E-21: \"Derive the off-path value … or drop it to the default if the derivation shows 100 ms plus a retry suffices\"; the derivation has not been done (R-36, R-61)."

**Owner?** Engineering (AD-26).

**Options:**
1. Keep 5,000 ms (about 10 s effective with the adapter's retry-once).
2. Drop to the adapter's default, 100 ms with one retry (about 200 ms), if measurement
   shows it suffices against the handlers' concurrent writes.
3. A value in between, derived from a stated maximum legitimate hold.

**Evidence:**
- What the value must be derived from, and why a long wait was chosen:
  [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B7b-adjudication.md@HEAD:L392-L393]] "Its value must be derived from the longest bounded write activity of the handlers AD-26 allows to run at once; 5,000 has no" with the cost it was meant to avoid [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B7b-adjudication.md@HEAD:L391-L391]] "an aborted full pass leaves `mining_in_progress` at `'1'`, and the next pass" (purges and restarts); a waiter costs the others nothing: [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B7b-adjudication.md@HEAD:L397-L397]] "waiting connection holds no lock."
- What 5,000 really is: [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B7c-adjudication.md@HEAD:L294-L294]] "with `busyTimeoutMs: 5000` gives up after about 10 s (E-3, executed)." and the opener at `HEAD` [[middleware/context-oracle/ctxoracle/src/cli/context.ts@HEAD:L42-L42]] "const project = openStore(layout.project, { busyTimeoutMs: 5000 });"; AD-26's reason: [[middleware/context-oracle/docs/architecture-phase-a.md@HEAD:L2570-L2572]] "**Off the event path the wait is long:** the miner, the indexer, and the CLI verbs open the store with `busy_timeout` 5,000 ms, because nothing there has a latency budget to"
- The concurrency the value must survive: [[middleware/context-oracle/docs/architecture-phase-a.md@HEAD:L2566-L2566]] "Hooks can run in parallel (multiple matching hooks; overlapping"
- **Measured.** A throwaway repository `$G/g7/hrepo` was `init`ed by the `HEAD` build (with `CTXORACLE_HOME=$G/g7/home`); `$G/b-g7` is that build with an adapter patch that appends every depth-0 write's start and end to `$TXLOG`. `hloop.sh` is one agent: `UserPromptSubmit` (a question), `PostToolUse` Read, `PreToolUse` Edit (denied: the question is open), `Stop`, each a fresh `ctxoracle hook` process, back to back. `offpath.mjs` is the corrected off-path pass shape on the same project store: 50 ms write-lock holds, a 25 ms yield, opened with `busyTimeoutMs` = the value under test, counting `StoreBusy` and continuing. [[ran]] `$G/g7/load.sh <K agents> <seconds> <busy_timeout> <label>` →
  - `1 20 none` → `k1idle-s1 events 108`; `handler project-store writes 287; hold p50 1.0 p99 8.7 max 21.1 ms; utilisation 0.022` (one agent: 5.4 events/s, each write about 1 ms).
  - `8 60 100` → `{"busyTimeoutMs":100,"ok":749,"busy":0,"maxWaitMs":67}`.
  - `16 60 100` → `{"busyTimeoutMs":100,"ok":688,"busy":0,"maxWaitMs":130}`.
  The off-path writer at the default never failed, against 8 and then 16 agents firing hook events back to back on four cores (the handler "hold" figures under load, p99 104.7 and 113.8 ms, include each write's own busy wait, so they overstate the lock time).
- The handlers' side in the same runs (the skeleton's autocommit writes, see G-5's raised flaw): `faults [{"code":"deny_loop","n":1024},{"code":"store_corrupt","n":216}]` at 8 agents with the off-path writer, `store_corrupt` 297 at 16, and 1 at 8 agents with no off-path writer (`8 60 none`).
- The abort cost is gone under this file's decisions: an off-path pass that stops after
  some chunks is resumed, not purged (C-3, G-1's reconcile).

**Decision:** Option 2.
- The miner, the indexer and every CLI verb open both stores with the adapter default
  (`busy_timeout` 100 ms, one retry). `src/cli/context.ts` drops `{ busyTimeoutMs: 5000 }`;
  the `busyTimeoutMs` option stays (tests use it, and `RangeError` cases stay, R-46).
- The derivation, for AD-26 and Step 3: with every other writer's transaction short
  (handler write groups of about 1 ms measured; passes bounded per R-36 (b) and G-5),
  an off-path waiter fails only if every one of its ~18 attempts in ~200 ms lands in a
  hold; measured, it did not fail once in 1,437 chunk transactions against 8 and 16
  agents writing back to back, a load several times any one session's (one agent
  measured 5.4 events/s).
- A chunk transaction that still raises `StoreBusy` fails the pass visibly: the verb's
  error channel (R-110) records `store_busy` with `{writer: 'miner'|'indexer', phase}`
  and exits non-zero; the next pass resumes (C-3).
- AD-26's "Off the event path the wait is long" paragraph and its "one short write group"
  reason are replaced by the derivation above; `T-13-5b`'s appender models the
  product's writers (one write group per process, B7b E-21) and must pass at the default.
- Tests: `T-3-x` reads back `PRAGMA busy_timeout` = 100 for an off-path open; the load
  harness above becomes a Step 13 optional stress script (`8 60 100` must show
  `busy 0`).

**Why it beats the alternatives:** Option 1's value was never derived; it outlasts
bursts instead of answering starvation (B7b), and its only remaining reason was the
purge-on-abort cost, which C-3 removes. A stuck holder then goes unreported for about
10 s per chunk. Option 3 would need a maximum legitimate hold longer than the default's
window, and none was measured: the measured handler writes are milliseconds, and the
passes' own holds are the ones G-5 bounds. Option 2 is the shortest wait that the
measurement shows sufficient, and it fails a genuinely blocked pass within about
200 ms, visibly.

**What it costs:** under a load heavier than measured, an off-path pass can stop early
and wait for the next trigger to resume; that is recorded, not silent.

**Would be wrong if:** a legitimate writer holds the write lock beyond ~200 ms in one
transaction (a large `SessionEnd` fold, an `import`, a migration run by `init` while a
pass runs), in which case that writer is bounded as R-36 (b) bounds the passes, or this
value is re-derived from its measured hold.

---
