# Round 6 — Independent whole-document collapse-hunt of `docs/plans/plan-phase-a.md`

**Date:** 2026-09-16
**Artifact under review:** `docs/plans/plan-phase-a.md` (~10,025 lines), the Phase A
implementation plan for Context Oracle.
**Nature:** An independent adversarial collapse-hunt. I did not author this plan.
Every load-bearing claim I report on was executed in this environment
(Node v22.22.2, npm 10.9.7, git 2.43.0, and Node v22.16.0 fetched via
`npx node@22.16.0` for the engines floor); a registry read, a documentation
sentence, or a prior round's "verified" was not accepted as evidence.

## What I executed (summary)

I installed the exact D-plan-2 pins into a scratch dir
(`web-tree-sitter@0.25.10`, `tree-sitter-wasms@0.1.13`, `typescript@5.9.3`,
`@types/node@22.20.1`, `@types/emscripten@1.41.6`) and, against my own install,
(a) reproduced the 32/36 grammar split, (b) parsed **realistic** and
**pathological** source through all 32 "usable" grammars plus the 8 that import
`__assert_fail`/`abort`, (c) confirmed `web-tree-sitter@0.26.13` loads 0 of 36 by
a fresh independent install, (d) compiled a TypeScript file that imports
`web-tree-sitter` with and without `@types/emscripten`, (e) re-ran the whole thing
at the Node 22.16.0 floor, and (f) read every grammar's `WebAssembly.Module.imports`
to verify the stated root cause. I ran the reindex race (probe 26) at baseline,
under 6 CPU hogs, and at the floor, and read Step 3 to confirm the probe models
the real code. I ran the plan's own tooling myself:
`run-plan-probes.mjs` (all 26 probes pass, fresh `npm ci` layout),
`derive-plan-sections.mjs --check` (OK: 40 steps, 124 test specs, 26 probes),
and `python3 tools/check_docs.py` (passed). I read every probe source against
its claim. I then whole-document-read §1–§16 and executed git edge cases against
Step 13's exact command. The two priority targets (D-plan-2, D-plan-32) **survive**
with executed evidence. I found one Serious defect the plan does not handle
(Step 13 / the co-change miner), documented below with pasted output.

---

### S1 — The co-change miner reads `git log --numstat` path fields verbatim, so `core.quotePath` (default ON) silently mis-keys every non-ASCII path

**Location.** Step 13, `docs/plans/plan-phase-a.md:2121-2129` (the miner command
and its path handling), `docs/plans/plan-phase-a.md:92` (§2 command form),
T-13-1 at `docs/plans/plan-phase-a.md:7793-7815` (the fixture and the
"Fails when" guard). The claim under attack: Step 13 runs
`git log --no-merges --numstat -M --format=%H%x00%at%x00 <watermark>..HEAD`,
treats a path field containing ` => ` as a rename and expands it, and skips a
path field containing a literal `{`, `}`, or ` => ` "that does not parse
unambiguously … with a `miner_unparsed_numstat` diagnostic (Step 6), never
guessed" (`:2127-2129`). The other path shapes are taken as the literal path.

**What breaks it.** Git's `core.quotePath` defaults to **ON**, so `--numstat`
C-quotes any path containing a byte ≥ 0x80 (accented Latin, CJK, Cyrillic,
emoji) or a control character — wrapping it in double quotes and octal-escaping
the bytes. The path field then contains **no** `{`, `}`, or ` => `, so it slips
past the `miner_unparsed_numstat` guard entirely and is stored **verbatim** in
`cochange_pairs` as the quoted/escaped string, which never equals the real
filesystem path the structural indexer (Steps 14–15, a `readdir` tree walk) and
every genre lookup use. I executed Step 13's exact command against a repo with a
non-ASCII filename, a space filename, and an ASCII filename all co-changing in
one commit:

```
$ git log --no-merges --numstat -M --format=%H%x00%at%x00 -1 | cat -A
ee6d558531e5bc0e011a99d61c71341e72b525a1^@1789602760^@$
$
1^I0^Ibin.dat$
1^I0^I"caf\303\251.txt"$          <- café.txt, C-quoted with surrounding quotes + octal
1^I0^Inormal.txt$
1^I0^Itwo words.txt$              <- spaces are NOT quoted
$ git config --get core.quotePath || echo "(unset = default ON)"
(unset = default ON)
```

So for a working-tree file `café.txt`, the indexer stores `files.path = "café.txt"`
while the miner stores the co-change pair under `"caf\303\251.txt"`. When the
Coupling / Consequence / Completeness / Warning genres look up the co-change
partners of `café.txt` (the real path from the event/index), the join finds
nothing. The signal is **silently lost, with no fault raised** — the exact
outcome the plan forbids: it is "guessing" (a quoted path parsed as a literal),
which is precisely what `miner_unparsed_numstat` exists to prevent for the rename
shapes, applied inconsistently. A rename of a non-ASCII file is worse: git prints
`"old" => "new"` quoted, so the ` => ` branch expands **quoted** identities into
`cochange_pairs`, doubling the mismatch.

**Why it fails the Phase A goal.** Phase A is "the honest measurement on the
owner's *real* repositories" (Step 39), and the exit report is the Phase B design
input (`docs/plans/plan-phase-a.md:4833-4835`, "a padded or reflection-only exit
report poisons the data Phase B and the AC-24 regression fixtures are designed
from"). A repository with any non-ASCII path has its history-genre co-change
silently under-counted, and the report has no way to distinguish "the recognizer
is conservative" (the honest floor) from "the miner mis-keyed these files" (a
bug) — because no `frontend_parse_failed`-style fault is emitted. That is the
"biased substrate" / "fake completeness" failure the goal names, arriving through
the back door. T-13-1's guard "Fails when any ` => ` string lands in `files` or
`cochange_pairs`" (`:7814`) does not catch it, and the `miner-hygiene` fixture
(`:7799-7809`) plants no non-ASCII path, so nothing in the plan's test set
exercises this. `core.quotePath` appears nowhere in the plan (I grepped the whole
file: 0 hits for `quotepath|core\.quote|-z|octal|non-ascii|c-quote`).

**Concrete fix.** Run the miner's `git log` with `-c core.quotePath=false` so
paths come through as raw UTF-8 (git still emits the bytes; the filesystem walk
already stores UTF-8), and — because `core.quotePath=false` still C-quotes a path
containing a literal double-quote, backslash, tab, or newline — either add `-z`
(NUL-delimited numstat, which suppresses quoting entirely and needs a separate
parse) or route any residually-quoted path to the existing
`miner_unparsed_numstat` diagnostic rather than storing it. Add a non-ASCII (and
ideally a control-char) filename to the `miner-hygiene` fixture and a T-13-1
clause "Fails when a quoted or escaped path lands in `cochange_pairs`." Severity
note: Step 13's stated "Impact if wrong" is "contained to history genres … they
stay silent," which caps the blast radius to non-ASCII/control-char paths in the
target repos; I rate it Serious rather than Moderate because it is **silent, un-
diagnosed, on the real-repo measurement that is the deliverable, and a direct
violation of the plan's own "never guessed" discipline** — a loud failure would be
Moderate, a silent mis-attribution of the floor is not.

---

## Targeted decisions I attacked and could not break (executed evidence)

The plan's most-scrutinized decisions, per the dispatch, are D-plan-2 (the
dependency pins) and D-plan-32 (the reindex claim row). I attacked both to
falsify them and both survived. I record the executed evidence so the record is
auditable.

### D-plan-2 (dependency pins) — SURVIVES

Decision at `docs/plans/plan-phase-a.md:5017`; §4 disposition `:336-383`;
§11.4 evidence `:7055-7111`; probes 20, 21, 22.

- **Exact pins install cleanly** into a fresh scratch dir (I first tried
  `@types/node@22.22.0`, which does not exist — ETARGET — then used the plan's
  actual pin `@types/node@22.20.1`, `:850`, which installed): all five resolve to
  the pinned versions, 36 grammar `.wasm` files ship.
- **The 32/36 split reproduces**, and holds under **realistic** code, not just the
  probe's one `"\n"`: I parsed heredocs / interpolation / raw strings / indentation
  through all 32 usable grammars — `parsed without throwing: 32 of 32, no throws`.
- **The 8 assertion-path grammars** (`cpp, html, php, python, ruby, tlaplus, vue,
  kotlin`, which import unresolved `__assert_fail`/`abort` per §11.4 `:7079-7081`)
  did **not** throw on deeply-nested, 100k-char, broken, or unicode-adversarial
  inputs (`no assertion-path throws on any pathological input across the 8
  grammars`). So the "reached by no parse executed" claim holds under stress, and
  Step 15's catch-all (`:2392-2398`, "caught whatever its class … records
  `frontend_parse_failed`") is a safety net, not a hot path.
- **The forced-pin half is real.** A fresh independent `npm install
  web-tree-sitter@0.26.13` loaded **0 of 36** (`Error` with empty message), and a
  direct `Language.load` of `tree-sitter-javascript.wasm` under 0.26.13 failed —
  so a version range that admitted 0.26.x would break, and pinning the last 0.25.x
  is forced, not chosen.
- **The tsconfig claim reproduces both directions.** `tsc` with
  `"types":["node","emscripten"]` → exit 0, `dist/src/imp.js` emitted; the same
  compile with `--types node` only → `error TS2304: Cannot find name
  'EmscriptenModule'` at `web-tree-sitter.d.ts`, exit 2.
- **The floor is identical.** Under real Node v22.16.0 (`npx node@22.16.0`) the
  grammar inventory printed byte-for-byte the same, and `node:sqlite`'s
  `DatabaseSync` works there.
- **The root cause is exactly as stated.** Reading each grammar's WASM imports
  against `tree-sitter.wasm`'s exports: `yaml` imports `_Znwm, _ZdlPv,
  __throw_length_error, abort, __assert_fail`; `bash` imports `isalpha,
  __assert_fail`; `typescript`/`json` import only the standard dylink/scanner
  symbols; `python` carries only `__assert_fail`. This matches §11.4 `:7076-7081`.

One thing I chased hard and confirmed the plan **already discloses** (so it is
*not* a finding, recorded for auditability): when grammars are loaded in a natural
order rather than probe 20's "elm/ql first," `Language.load` for `elm`/`ql`
**traps** with `RuntimeError: memory access out of bounds` before their ABI is
ever readable (I reproduced this across alphabetical, reverse, and after-the-32
orderings), whereas probe 20's committed expectation shows `elm: loads; language
ABI 12`. This looked at first like a §10 ("0.25.10 loads 34," `:5022`) vs §11.4
("elm: loads," `:7061`) contradiction — but §4 `:339-345` states "34 grammars
load" **and** explicitly notes the `Language.load` "traps or not depending on how
much heap earlier grammars consumed, so nothing asserts the trap," and §11.4
`:7064-7066` notes elm/ql are "loaded first … the load-time trap is
memory-layout-dependent and never asserted." The plan is internally honest, the
32 usable grammars are load-order-robust (I verified across three orderings, 0
failures), and elm/ql are never loaded by the running indexer (excluded from the
default table). No defect.

### D-plan-32 (reindex claim row) — SURVIVES

Decision at `docs/plans/plan-phase-a.md:5698`; author collapse-test `:6416`;
Step 14 `:2274-2286`; probe 26; R14 `:9495-9503`.

- **The race holds.** `probe:26_reindex_claim_row_race` (two real Node processes
  behind a file barrier racing a planted dead-pid claim, 200 iterations): baseline
  `exactly one won 200; both won 0; neither won 0`, and `after the owner's release
  (DELETE in finally) the claim row is absent: true`. It held identically under 6
  CPU-bound sibling hogs and at the Node 22.16.0 floor.
- **The probe faithfully models the code.** I read Step 3 (`:1071-1074`):
  `Store.transaction` is `BEGIN IMMEDIATE`, "on `SQLITE_BUSY` retries **once**,"
  then fails open with `StoreBusy` — which is exactly the retry-once loop the
  probe's child runs, so the probe is not testing a different mechanism than the
  real `acquireReindexClaim`. The correctness rests on SQLite's single-writer
  serialization of the read-check-then-write inside one `BEGIN IMMEDIATE`, which
  is a well-established property and which the executed race demonstrates.
- **The two residuals I attacked are already dispositioned.** SIGKILL (the
  `finally` never runs) is handled by pid-liveness reclaim, which the probe
  exercises via the planted dead pid; and pid reuse is named in the author's
  step-2 answer (`:6430-6433`) and R14 (`:9502-9503`) as a residual that "delays a
  reindex and never corrupts one," visible in `status` with `reindex_started_at`
  (`OL-10`). I could not produce a double winner or a corruption; the pid-reuse
  case (a dead owner's pid reassigned to a live unrelated process) is real but
  low-probability, degrades gracefully to a stale-but-visible index, and is
  acknowledged. Nothing to add.

## The plan's own tooling, re-run by me (not trusted from the record)

- `node .claude/skills/expert-plan/scripts/run-plan-probes.mjs docs/plans/plan-phase-a.md`
  → all 26 probes `ok` against a fresh `npm ci` layout (including the optional
  network/`unshare` probes, which ran rather than skipped here);
  `all probes match their recorded expectations`.
- `node .claude/skills/expert-plan/scripts/derive-plan-sections.mjs docs/plans/plan-phase-a.md --check`
  → `OK: 40 steps, 13 elements, 124 test specs, 26 probes cited, regions current`.
- `python3 tools/check_docs.py` → `context-oracle doc-consistency check passed.`

**Probe-source audit.** I read every probe against its claim. All 26 test the
load-bearing property, and the three previously-drifted probes are cleanly fixed:
probe 02 marks `sqlite_version` "informational, not compared" and asserts the
feature booleans; probe 17's residual dynamic values ("newest 0.25.x: 0.25.10,"
"latest major: 7") are defensible tripwires for the pin decision, not the load-
bearing assertion; probe 25 uses `GIT_CEILING_DIRECTORIES` hygiene. Probe 20's
`excluded` set is hardcoded, but my own full-36 enumeration confirms exactly
elm/ql (load/ABI) and yaml/bash (parse) fail and the other 32 pass, so the set is
empirically correct. Probe 16 (the answer-drift "clear" recognizer) is a
comprehensive reference implementation that honestly encodes the "err toward
clearing" floor (e.g. "Later.", "Not now.", "I'll get to that after the refactor."
all clear — the under-fire the exit run measures). No probe-drift finding.

## Mission-service read (hunting hollow decisions §10A never listed)

I read the mission-critical deliverables against the Phase A goal ("honest
deterministic foundation … measures how little it catches … never fake
completeness"): Step 39 (the exit run) splits legs, refuses to pool leg-1 and
leg-2 numbers, labels leg-1 denies "off-policy," uses an **independent** labeller
for the recall/precision denominator (not the recognizer grading itself), and
names IDEAS.md #14's structural limits in the report — it genuinely measures the
floor rather than dressing it. Step 18's seven genres each carry a P5
marginal-value guarantee and the done-claim recognizer errs toward silence
(OL-12). Step 25's answer-drift block reads the `prompt` field so the row exists
before the agent moves, scopes the deny to the main consumer, and treats the
lag-window hold as a measured consequence, not a heuristic. §13 (risks) and §15
(gaps) are honestly stated with resolution paths. I did not find a non-trivial
mechanism that survives review without serving the goal. The single genuine
defect is S1 above, which is a correctness bug, not a hollow decision.

---

## Appendix — What I executed (auditable)

1. `npm install` the exact D-plan-2 pins in a scratch dir. First attempt failed:
   `npm error code ETARGET No matching version found for @types/node@22.22.0`
   (my guess) → re-ran with the plan's `@types/node@22.20.1` → `added 6 packages`;
   versions confirmed 0.25.10 / 0.1.13 / 5.9.3 / 1.41.6 / 22.20.1; 36 wasm files.
2. `node 20_grammar_inventory.mjs` (my install) → matches plan claim exactly
   (32 usable; elm ABI 12 / ql ABI 10; yaml/bash throw `TypeError: resolved is
   not a function`; typescript Query captures `["f"]`).
3. Realistic-code parse of all 32 usable grammars → `32 of 32, no throws`.
4. Pathological-input parse of the 8 assertion-path grammars → `no assertion-path
   throws on any pathological input`.
5. `Language.load` order experiments (alphabetical, reverse, elm/ql-first,
   elm/ql-last): the 32 usable never fail; elm/ql load only when first, else
   `RuntimeError: memory access out of bounds`. Confirmed §4 already discloses
   this.
6. Fresh `npm install web-tree-sitter@0.26.13` + direct load → `0.26.13 loaded 0
   of 36`, javascript direct load failed. Forced pin confirmed.
7. `tsc -p` with `types:[node,emscripten]` → exit 0, emitted; `--types node` →
   `TS2304 EmscriptenModule` at `web-tree-sitter.d.ts`, exit 2.
8. `npx node@22.16.0` re-run of the grammar inventory → identical; `node:sqlite`
   `DatabaseSync` works at the floor.
9. `WebAssembly.Module.imports` over yaml/bash/typescript/json/python vs
   `tree-sitter.wasm` exports → matches the stated root cause.
10. `node 26_reindex_claim_row_race.mjs` baseline → `exactly one won 200`; under
    6 CPU hogs (run 1) → `exactly one won 200`; at 22.16.0 floor → one winner.
    Read Step 3 to confirm retry-once modeling.
11. `run-plan-probes.mjs` (fresh layout) → all 26 `ok`.
    `derive-plan-sections.mjs --check` → OK. `tools/check_docs.py` → passed.
12. Read all 26 probe sources against their claims.
13. Whole-document read of §1–§16.
14. `git log --no-merges --numstat -M --format=%H%x00%at%x00` against a repo with
    a non-ASCII path (`café.txt`), a space path, and an ASCII path → git prints
    the non-ASCII path as `"caf\303\251.txt"` (C-quoted, octal), the space path
    unquoted; `core.quotePath` is unset (default ON). Grepped the plan: `quotePath`
    / `-z` / `core.quote` appear 0 times. → S1.
