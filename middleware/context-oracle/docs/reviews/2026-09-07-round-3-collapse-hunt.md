# Independent collapse-hunt, round 3 — Phase A implementation plan (2026-09-07)

**Artifact:** `docs/plans/plan-phase-a.md` as installed in the working tree at
commit `d667534` (7,106 lines; §7 has 40 steps, §10 has D-plan-1..23, §10A has
one collapse-test per decision, §12 has 122 test specifications — counts
re-derived by script this session: 57 unit, 4 build, 6 conventions, 51 replay
files in §5.1; 122 `**T<n>-<m>` definitions in §12; 23 `D-plan` entries in §10
and 23 in §10A). The round chain on this artifact: round 1 =
`docs/reviews/2026-09-06-plan-collapse-hunt.md` and
`2026-09-06-plan-expert-review.md`; round 2 =
`docs/reviews/2026-09-07-round-2-collapse-hunt.md` (20 findings) and
`2026-09-07-round-2-expert-review.md` (29 findings). The author applied every
round-2 finding (commit `d667534`); the author's own closure table and
self-check, `docs/reviews/2026-09-07-round-3-author-gates-review.md`, was read
and no claim in it was trusted — every closure below is re-derived from the
working-tree text, and where the self-check and the source disagree the source
is used. The planning-tool traces (`docs/reviews/2026-09-07-plan-tool-traces.md`,
2,652 lines) were opened and their structure confirmed (CodeGraph section at
line 19, Clear Thought section at line 723, 114 `sequential_thinking` /
`decision_framework` hits); their content was not re-audited.

**Axis:** mission fidelity only — `middleware/context-oracle/CLAUDE.md`
dominating rule 2 (the collapse test: hardest skeptic question → answer citing
a spec/mission line → what it steers toward; guide informing, never gate
policing) and rule 3 (does each decision serve the Phase A goal: *an honest
deterministic foundation, running on the owner's real repos, that measures its
own floor — how little it catches — with clean seams the later phases plug
into; never fake completeness dressed to look like a working product*). Style
and document hygiene are not attacked; a hygiene defect is reported only where
it makes a mission-load-bearing test or step unbuildable or a measurement
false.

**Reviewer independence:** a fresh subagent that did not write the plan, the
architecture, or any prior review, and was not shown any round-3 expert-review.

**Read in full before attacking:** `CLAUDE.md` (238 lines);
`docs/collapse-log.md` (all 1,156 lines — 2026-09-04 first, then 2026-09-03
rounds 6–9, 2026-08-29, 2026-08-25, then the rest); `OWNER-LEDGER.md` (all 80
lines); `docs/specs/spec-context-oracle.md` §8, §9, §11 (incl. §11.5 at
739–777), §12, §13, §14; `docs/architecture-phase-a.md` in full (V1–V19,
AD-1..AD-26, threat model, traceability matrix, L1–L11); `docs/IDEAS.md` #14
(92–175); the four prior reviews in full; the author's round-3 self-check; and
the plan end to end in ten contiguous reads (§1–§16, every step, every §10/§10A
entry, every §12 entry). The round-2 revision (`git show
149ffc8:…/plan-phase-a.md`, 5,999 lines) was extracted to the scratchpad and
read at every passage needed to decide provenance.

**Method.** (1) For each of the 23 §10A entries: read the author's step-2
question, write a more hostile one the author would not have picked, test the
step-3 answer against it with only spec / architecture / ledger / collapse-log
as ground. (2) Hunt for load-bearing decisions §10A cannot see: plan-level
judgments in §7, cross-step interactions, any elaboration of Steps 21–27 beyond
AD-9 (read line by line against `arch:736–922`), any pinned-version or scope
change, any §12 test that cannot fail, cannot be built as written, or whose
allow/deny set the plan's own modules violate, any Step 39 measurement that
measures the harness or the recognizer instead of the system. (3) Re-derive
closure of all 49 round-2 findings from the current text and hunt for defects
the round-2 corrections introduced — anything present now that was absent at
`149ffc8` is tagged **REGRESSION (introduced by the round-2 corrections)**, with
the `149ffc8` line cited. (4) Every finding quotes the plan line(s) and the
contradicting source line(s). Search located; reads verified. Five claims were
attacked by execution in this environment (Node v22.22.2, typescript 5.9.3, the
`layoutprobe/` reproduction of the Step 1 layout) or by fetching the primary
source today; each execution is recorded at the finding that rests on it.

**Verdict: DOES NOT SURVIVE.** 4 Serious, 10 Moderate, 9 Minor findings; 12
are REGRESSION-tagged and a 13th (S-1) is partly so. Of the 23 §10A decisions,
2 collapse (D-plan-10, D-plan-11), 3 partially collapse (D-plan-6, D-plan-7,
D-plan-13), 18 survive the harder question (six with a note). The answer-drift
block itself (Steps 21–27) was read against AD-9 line by line and still
elaborates nothing on the intake or move axes — the deny-eligible set is
exactly `{Write, Edit, NotebookEdit}`, the question rule is (i)–(iii) and
nothing more, there is no question-type classifier; the two deviations found
are in the clear recognizer (a narrowing in the hold direction, M-8) and in a
*diagnostic* that now contradicts AD-9 and inflates the wrongful-deny rate
(S-2). As in round 2, the measurement layer is where the plan goes hollow: the
exit report still conflates off-policy replay artifacts with the block's health
numbers (S-3), the leg every validity rule hangs on has no executable launch
mechanism and rests on two unstated harness premises (S-4), and the L11(a)
verification is keyed by the markers it is supposed to measure (M-3).

**On the owner's regression rule.** Round 2 found ten defects introduced by
the round-1 correction pass. This round finds twelve (plus one partial)
introduced by the round-2 correction pass — a second consecutive round of
correction-induced defects. By the owner's stated rule that means the
correction process itself, not the plan's content, is the object to diagnose
before a fourth pass. The shape is consistent across both rounds and is named
in the collapse-log (2026-08-29 lesson 1, `collapse-log:965–976`): reviewer
prescriptions were applied faithfully and never attacked as author text — the
T3-3 offsets (M-1), the labelling rule (M-2), the origin keying (M-3), the
slim container image (M-5), the deferral-sentence rule (M-8) and the
deferral-counting detector (S-2) are each the round-2 prescription transcribed
one decision short of correct. The author's self-check §2 (`round-3-author-
gates-review.md:54–63`) asserts it re-read every convention test's set against
the modules and every count against the tables; S-1 and m-8 are exactly the
checks it says it ran.

---

## (a) The 23 harder questions

Format per entry: the author's step-2 question (summarised), the harder
question, the verdict, and the ground.

### D-plan-1 — build order. **SURVIVES.**
*Author's Q:* order does not constrain who elaborates the recognizer.
*Harder Q:* Step 1 now writes every fixture generator — including
`answer-drift-clearly-off` and the transcript fixtures the deny replays need
(plan 727–744, 575) — twenty-two steps before any recognizer exists. The AC
scenarios for the block are therefore authored first and sit in the tree while
Step 23 is written; a generator "reviewed against the AC's scenario text"
(§10A D-plan-5, 3985) is a target the recognizer can be written toward. What
in the order stops Step 23 from being written to the fixture rather than to
AD-9?
*Ground:* the generators plant AD-24's scenarios verbatim (arch 1513–1628 — an
`Edit` after an open question, a `Read`/`Bash` in the same state), none of
which rewards a wider rule; the restraint is D-plan-19's complement corpus
(5568–5574), which fails on any widening regardless of what fixture exists.
The order's own claim is the narrow one at 3905–3914 and it holds.

### D-plan-2 — dependency pins. **SURVIVES.**
*Harder Q:* the pins reproduce V14's surface, but `web-tree-sitter` 0.26.13
was published 2026-08-23 and 0.27.0 on 2026-08-30 (plan 4635–4636); nothing
records why the older of two week-apart releases is the verified one rather
than the one the registry serves by default, so a fresh `npm install` outside
the lockfile lands on 0.27.0.
*Ground:* the plan pins exactly and states a bump is "architecture work
(re-verifying V14)" (3548–3552); the lockfile is what `npm ci` honours (T1-1,
4877–4891). The decision's job — build the verified surface — holds.

### D-plan-3 — test execution. **SURVIVES (with note).**
*Harder Q:* the runner's guard compares source and compiled counts per
directory (746–755); a `.test.ts` file whose `describe` block is present but
whose `it` bodies are `todo` compiles, is counted, and passes `node --test`
with zero assertions.
*Ground:* the author concedes exactly this ("an empty test body is a review
defect the runner is not claimed to catch", 3948–3949), and the seeded
violations in the convention tests are the mechanical half. The build now
compiles — the `exclude` at 711 and the per-fixture `tsc --noEmit` at 716–725
are in the `layoutprobe/` reproduction's `tsconfig.json` this reviewer
inspected (`"exclude": ["test/build/fixtures"]`), and a two-file probe
compiled green there this session. Note: the count guard would not notice
`T28-5` being missing from Checkpoint 3's list — see m-8.

### D-plan-4 — record-identical comparison. **SURVIVES.**
*Harder Q:* `observed_actions` has no primary key and no uniqueness
constraint (1275–1278); two byte-identical rows are legal, and "every column in
schema order" (3584–3587) orders them but cannot tell a lost duplicate from a
kept one after `VACUUM INTO`.
*Ground:* a multiset compare over the ordered dump (row-by-row, 3586–3587)
does detect a dropped duplicate — the row counts differ. Round-2 m-5 is
closed at 1294–1296 and 3582–3589.

### D-plan-5 — generated fixtures. **SURVIVES (with note).**
*Harder Q:* the `large-store` fixture (583) exists so that T29-1 exercises
"AD-23's inventory" (5823–5824) — the class where a 410 MB store made one
statement take 543 ms (arch V8, 132). Nothing states how large `large-store`
is; a generator that makes it small enough to build on every `--replay` run
makes the AD-23 case a test that cannot fail, and one large enough to matter
cannot be "generated at test time" (556) on every run.
*Ground:* the decision (generated, forward-derived, diffable) survives; the
size is a gap in T29-1's data, recorded as m-5.

### D-plan-6 — settings marker. **PARTIAL COLLAPSE** → finding M-7 (REGRESSION).
*Harder Q:* the command `init` writes now begins with `process.execPath`
(2804–2806) — the absolute path of the Node binary that ran `init`. Max Cogar
upgrades Node (nvm, brew): that path is gone, every hook exits 127, and *no
handler ever runs again*. The `hooks_not_firing` detector (2965–2971) only
examines "every session with a liveness row"; a session in which no handler
ran has no liveness row. Which owner-visible signal reports the totally-dead
wiring L7 says is detected (arch 1979–1983: "a totally-dead wiring is
detected at the next CLI use or session … liveness rows go stale")?
*Answer from source:* none in the plan. The marker decision itself survives
(what `init` writes and what `deinit` matches are one string, executed in
§11.4 4707–4720 under three modes); the interpreter pin it introduced creates
the most likely totally-dead failure and the round-2-added detector cannot see
that class. The harness surfaces a non-zero, non-2 hook exit as stderr to the
user, so the failure is not silent to a terminal user — but the owner-facing
surface AD-17 mandates is `status`, and `status` shows nothing.

### D-plan-7 — plan-seeded thresholds. **PARTIAL COLLAPSE** → finding M-10.
*Harder Q:* with `qa.clear_length_floor_chars = 2` (1587) the clear axis is
decided almost entirely by `lexicon.deferral_stoplist` — every turn of two or
more characters that is not on that list clears every open question. The
plan never states one member of that list or of `lexicon.stoplist`; it
labels both "`architecture_default` shape" (1595–1596) although AD-9 names
the lists and states no members (arch 750–757, 782), and the Gate A planner
note says "the exact words are implementation vocabulary" (arch 1708). Under
D-plan-7's own rule, a value the architecture leaves open is a `plan_seed`
printed with the report; these are neither seeded nor printed. Which line of
the exit report tells Phase B what vocabulary the clear axis was measured
under?
*Answer from source:* none — `status` and the report print `plan_seed` rows
only (2971–2972, 3354). The threshold decision survives; the vocabulary that
gives the threshold its meaning is an implementer choice hidden from the
report.

### D-plan-8 — model seam. **SURVIVES.**
*Harder Q:* the six-variable scrub was executed by the author; the reviewer
in round 2 was blocked from executing it. Re-executed here 2026-09-07 from
`/tmp` with exactly `SCRUBBED_ENV` removed and `CTXORACLE_INTERNAL=1`:
`claude -p "Reply with the single word OK" --model claude-haiku-4-5-20251001
--tools "" --max-turns 1 --output-format json` → `"is_error":false,
"num_turns":1, "session_id":"f85449b5-3b9e-440c-97bb-3e4c9aac44be"` (fresh),
`"total_cost_usd":0.004534`, exit 0. The premise's validating command is the
design's command (collapse-log 561). Round-2 S-5 is closed on evidence, not
attestation.

### D-plan-9 — lag-window hold. **SURVIVES.**
*Harder Q:* T38-4's "hold → next event → allowed" (6138–6151) is the only
acceptance replay of the hold, and its fixture appends the clearing turn
*between* events; a real V1 lag is a partial last line at the moment of the
event. Where is the partial-line case exercised end to end?
*Ground:* T21-1 and T25-2(e) pin the partial trailing line at function level
(5523–5531, 5672–5673); the hold as read-to-EOF + deny-on-open is AD-9
verbatim (arch 812–826); the transient wrongful deny is the spec's chosen
direction (spec 371–381). Survives; the end-to-end partial-line case is a
fixture-authoring detail the runner already controls (2582–2583).

### D-plan-10 — exit-run legs and validity rule. **COLLAPSES** → findings S-3, S-4, M-2, M-9, m-7, m-9.
*Harder Q (i):* leg 1 now feeds the handler only the transcript prefix
(3272–3277), so the block denies at the right moments — but the recorded
agent never received those denies (IDEAS 130–140: "the replayed remainder is
fiction from the block onward"). After a replayed deny on an `Edit`, the
recorded stream continues with that edit's `PostToolUse` and the agent's next
recorded edits. Three recorded consecutive edits with no text between them
after a `?` prompt — the ordinary shape of an agent that answers by doing —
trip `deny_loop` (2445–2447); a recorded `echo > target` after a "denied"
edit trips `deny_bypass_suspect` (2455–2461). The report prints "denies
issued", "`deny_loop` and `deny_bypass_suspect` counts", "the fraction of
denies that were escaped by a text turn versus corrected as wrongful"
(3344–3358) and marks only the lag-hold rate "leg 2 only" (3346–3347). Which
of the other block-health numbers is leg-split?
*Answer from source:* none. The round-2 correction stopped the harness
showing the block the future; it did not stop the report presenting the
harness's non-reactions as the block's health. Finding S-3.
*Harder Q (ii):* leg 2 is "agent-driven by construction" and the sessions are
started by `scripts/exit-run.sh` "through the implementing agent's session
tooling — a Claude Code Remote session … or a local `claude` session"
(3292–3295). A shell script has no access to the implementing agent's MCP
session tooling; and the driver "installs the tool (`npm install -g …`,
`ctxoracle init`)" *inside* the session (3300–3301) while D-plan-11 says "the
induction cannot run inside a session whose hooks are already loaded"
(3743–3744) — the plan holds both models of when hooks load. Which sentence
can an implementer execute?
*Answer from source:* neither as written. Finding S-4.
*Harder Q (iii):* the labeller of the floor sample is the implementing agent,
labelling after the replay, with the store's `questions` rows in front of it;
the independence claimed (4096–4098) is that the *rule* differs from the `?`
rule. A labeller who can see which turns were opened is not independent of
the recognizer (collapse-log 837–846). And the rule is attributed to OL-C5
("(OL-C5's question)", 3330) — OL-C5 (ledger 70) defines the trigger, not
"question". Finding M-2.
*Also:* leg 1's `Stop` reconstruction rule (M-9); leg 2's minimum protocol
asks only `?`-terminated questions (m-7); leg 1 includes the tool's own
repository's transcripts with no split (m-9).

### D-plan-11 — L11 verifications executed by the build. **COLLAPSES** → finding M-3 (REGRESSION).
*Harder Q:* the marker table is "keyed by transcript origin — the machine and
the harness mode … read from the transcript's path and its entries'
`origin`/`isMeta` markers" (3278–3281). A path under `~/.claude/projects/`
encodes the project's `cwd`, not the machine; and classifying a transcript's
mode by its markers, then reporting marker presence per mode, is a table that
reads its answer from its key. A remote-container interactive transcript that
carries `origin.kind:"human"` (§11.4 4750–4755 — this very session's) is
keyed by its markers as … what? And if "local interactive", L11(a) is reported
*verified* (3350–3353) from the corpus M-8 said cannot verify it.
*Answer from source:* the plan does not say, and cannot: nothing in a
transcript states the machine it was written on. The build-executes-it half
survives; the "without the plan claiming to have resolved them" half
collapses again, one decision away from where round-2 M-8 landed.

### D-plan-12 — watchdog kept after the V6 drift. **SURVIVES.**
*Harder Q:* the `--deadline-ms` override exists "for the replay harness only"
(2573–2575); an owner who edits `.claude/settings.json` by hand can add it to
the wired command and silence the oracle with no diagnostic path that says
why. *Ground:* the flag is a real watchdog parameter, not a branch (4297–4302);
a shorter deadline still records `latency_breach`; and `init` re-run repairs
the command (2823–2825). Honest.

### D-plan-13 — CI tiers. **PARTIAL COLLAPSE** → finding M-6 (REGRESSION).
*Harder Q:* D-plan-13 says the replay tier "runs on demand and, mandatorily,
at Checkpoints 3 and 4 and before the exit run" and that a replay-only
regression reaches `main` only through a PR whose author ran `--replay`
(3763–3772). Step 1 says "the replay tier (`npm test -- --replay`) is added to
the `test` job by Step 28" (766–769) and Step 28 says "this step adds `npm test
-- --replay` to Step 1's `test` CI job" (2585–2587) — the every-PR job. Which
does CI do?
*Answer from source:* both sentences are in the plan; an implementer picks.

### D-plan-14 — single spawn wrapper. **SURVIVES (with note).**
*Harder Q:* the scan resolves "every `import`/`export … from` specifier and
every `import()` string literal" (5043–5044); `createRequire(import.meta.url)
('child_process')` is a call, not an import, and passes. *Ground:* the
property claimed is structural confinement against the *forgotten* call site
(3777–3785), not against evasion; the note stands as a known hole of every
static scan and the wrapper's job holds.

### D-plan-15 — URL normalization. **SURVIVES.**
As in round 2: the residual is AD-3's, disclosed, and the identity string is
printed (1004–1010, 3787–3796).

### D-plan-16 — bypass predicate bound. **SURVIVES.**
As in round 2 (2461–2464, 3798–3805; L3 arch 1935–1948).

### D-plan-17 — two test levels. **SURVIVES (with note).**
*Harder Q:* T25-3's spec now says it does not test the hold (5684–5686,
5694–5695) and D-plan-17 says the same (3814–3818); Step 25's own Verification
field still says T25-3 covers "the hold: with a clearing turn present in the
transcript but not yet classified, `Edit` is denied, and after catch-up it is
allowed" (2426–2428). The round-2 note was applied at two of its three sites.
Finding m-2. The decision survives.

### D-plan-18 — checkpoint placement. **SURVIVES (with note).**
Checkpoint 3 runs "the three Step 28 replays" (3476–3478); Step 28 names four
(T28-1, T28-3, T28-4, T28-5 at 2654–2661; §5.1 500–503). Finding m-8.

### D-plan-19 — negative-coverage tests. **SURVIVES (with note).**
*Harder Q:* §10A says "every recognizer the spec calls a fallible skeleton
carries one" complement assertion (3837–3844). T23-1's is a generated
complement (5568–5574) — real. T18-8's is "a generated corpus of 50 completion
paraphrases outside the lexicon ('that should do it', 'all set', …)"
(5455–5459) — generated from what rule? If from a hand list, it is the list
the decision says it is not. T23-3's is nine tool names (5605–5607). The
question recognizer's guard is the rule's complement; the other two are lists
with a larger N. Finding m-6. The decision's job is delivered where it
matters most (intake) and overclaimed for the other two.

### D-plan-20 — fourth wrongful-deny component. **SURVIVES.**
It counts an event the architecture creates in the surface the architecture
mandates (3847–3855; arch 762–775, 1259–1260).

### D-plan-21 — exit report location. **SURVIVES.**
A correction to a measurement is a new run and a new file (4283–4288);
`check_docs.py`'s never-edit rule is the right discipline for a Phase B design
input.

### D-plan-22 — no test hooks in production modules. **SURVIVES.**
The flag is a watchdog parameter parsed only from the internal verb's argv
(2573–2575, 4297–4302); T28-3's induction is a real truncated store
(5784–5787).

### D-plan-23 — no-egress asserted structurally. **SURVIVES (with note).**
The token scan `fetch(` misses `fetch (`, `globalThis.fetch`, and a bound
reference; the runtime `unshare -rn` leg (2905–2909, executed §11.4 4733–4734)
covers Linux CI, and Phase A has no network code to hide (spec §10 588–593).
Note only.

---

## (b) New collapses and load-bearing decisions §10A missed

Each is a plan-level judgment or cross-step interaction not covered by a
§10A entry. Full detail in (d).

- **N-A — A convention test the plan's own modules cannot pass, executed.**
  T28-2 (5744–5753) greps `dist/src/**` outside `adapter.js` for every input
  field name in Step 28's list (2554–2560), which includes `source`, `cwd`,
  `error`, `prompt`, `transcript_path`. Plan-conformant modules emit those
  strings: Step 5's `oracleSpawn(cmd, args, {cwd, …})` (1020–1021), Step 20's
  `reconcileDedupOnSessionStart(store, consumer, source)` (2050–2052), Step
  27's `handleSessionStart(…, source)` (2501–2502), Step 12's tuning DAO
  `set(store, key, value, source)` (1566–1567), and Step 28's liveness row
  `detail_json = {transcript_path, transcript_bytes}` (2594–2596) read back by
  Step 33 (2966–2969). Compiled in the layout reproduction this session: three
  short modules of exactly those shapes emitted `source`×2, `transcript_path`,
  `cwd`×2. Finding S-1.
- **N-B — The deny-health detector that AD-9 scopes to the length-floor miss
  now counts the dodge the block exists to deny.** Step 26 (2448–2454) counts
  "both rejection reasons"; AD-9 says "excluding deferral-stoplist turns"
  (arch 823). Finding S-2.
- **N-C — Leg 1's off-policy denies feed the report's block-health numbers
  unsplit.** Finding S-3 (D-plan-10 (i)).
- **N-D — Leg 2 has no executable launch mechanism and two unstated harness
  premises** (mid-session settings application; workspace trust). Finding
  S-4 (D-plan-10 (ii)).
- **N-E — T3-3's schedule cannot produce the `StoreBusy` it asserts.**
  Executed: with A holding `BEGIN IMMEDIATE` 0–250 ms, B at 120 ms fails at
  ~221 ms and succeeds on retry at ~256 ms; C at 230 ms **succeeds on its
  first attempt at ~265 ms** — three runs, identical. Finding M-1.
- **N-F — The recognizer floor's labelling rule is attributed to OL-C5 and
  the labeller is not blind.** Finding M-2.
- **N-G — L11(a)'s origin key is derived from the markers being measured.**
  Finding M-3.
- **N-H — Regret's "re-edited or reverted" is undefined; any `ok` edit
  qualifies.** Finding M-4.
- **N-I — The `cold-container` job's image ships no `git`.** The
  `node:22.16.0-bookworm-slim` Dockerfile (nodejs/docker-node `bc0a422`,
  fetched today) installs `ca-certificates curl wget gnupg dirmngr xz-utils
  libatomic1`, then `apt-mark auto '.*'` and `apt-get purge -y --auto-remove`;
  `git` never appears; the docker-library README says the slim image "only
  contains the minimal packages needed to run `node`". `check-cold-container.sh`
  generates `pristine-tree` with `git init` and runs `init` (git identity,
  `git log` mining). Finding M-5.
- **N-J — D-plan-13 is contradicted by Steps 1 and 28.** Finding M-6.
- **N-K — `hooks_not_firing` cannot see a wiring that never fired, and the
  interpreter pin makes that the likeliest failure.** Finding M-7.
- **N-L — The sentence-level deferral discard holds on substantive
  sentences.** Finding M-8.
- **N-M — Leg 1's `Stop` rule vs the documented cadence.** The hooks
  reference (fetched today) states the cadences: "once per turn:
  `UserPromptSubmit`, `Stop`, and `StopFailure`; on every tool call inside the
  agentic loop: `PreToolUse` and `PostToolUse`". The plan's "`Stop` per
  assistant turn end" (3270) admits a Stop at every assistant JSONL entry.
  Finding M-9.
- **N-N — The two QA lexicons are unspecified and mislabelled.** Finding M-10.
- **N-O — `verdict.emit` names nothing the plan exports** (2603–2604 vs
  2287–2290); resolved as a module import it breaks T24-2. Finding m-1.

**Answer-drift block, Steps 21–27, read against AD-9 for elaboration beyond
the safe skeleton (spec §11.5 lines 741–762; arch 736–922):** intake
(2352–2355 ↔ arch 747–760: rule (i)–(iii), `prompt` field, `'already_open'`
tolerated — identical), catch-up (2356–2369 ↔ 762–788: markers, backfill,
voiding on affirmative non-human marker, bookmark over completed lines —
identical), deny decision (2370–2377 ↔ 790–804: main consumer, `open` row,
`recognizeMove` over exactly three tools — identical), the hold (2379–2388 ↔
812–826 — identical, no lag estimator), question lifetime (2501–2508 ↔
852–867 — identical), Stop-time backstop and counter (2510–2518 ↔ 828–839 —
identical), seam (2165–2185 ↔ 869–879 — identical). Two deviations, both in
the clear-axis machinery, neither widening coverage: the clear recognizer's
sentence-level discard (2229–2240) narrows clearing below AD-9's "content-free
deferral" (M-8, hold direction), and `deny_despite_answer_text` counts
deferral rejections AD-9 excludes (S-2, a diagnostic, not the deny). No
question-type classifier, no `Bash` classifier, no per-question clear
matcher, no widening of the deny-eligible set. The 2026-09-04 shape is absent
from the block; it is present in the measurement of the block (S-3, M-2, M-3)
and in a diagnostic that would report the block as more wrongful than it is
(S-2).

**Pinned versions and scope:** runtime pins equal V14 (arch 138; plan
703–704); the Node floor equals AD-2; dev pins are D-plan-2's with recorded
reasoning; no spec scope element changed. Plan additions since `149ffc8`
(`test/build/tsc_fixture.ts`, `hook integrity-check`, the liveness row,
`hooks_not_firing` detection, `T14-2`/`T28-4`/`T28-5`/`T29-3`/`T32-3`/`T32-4`/
`T33-4`/`T24-3`, four `schema_meta` keys, `session_log.id`, the three-way scrub
evidence, the tool-traces file) each trace to a round-2 finding; none
reintroduces a rejected posture. The four `schema_meta` keys beyond AD-4's
list (`identity`, `fts_state`, `settings_created_by_init`,
`claude_dir_created_by_init`, 1203–1205) are consumed by Steps 31–33 and are
the sanctioned kind of implementation-level shape.

---

## (c) Round-2 closure table

Each of the 49 round-2 findings (20 collapse-hunt, 29 expert-review), its
state in `d667534`, and the evidence line. "Regressed" means the closure
introduced a defect reported in (d).

| Round-2 finding | State in `d667534` | Evidence (plan lines) |
|---|---|---|
| CH S-1 / ER m5 — marker basename `ctxoracle` never written | **Closed.** Command = `"<execPath>" "<realpath argv[1]>" hook <event>`; pattern on `dispatch.js`; executed under direct `node`, symlink, `npx`, `npm -g --prefix`. Residual M-7 is a new consequence of the interpreter pin, not the same finding. | 2803–2815, 3606–3626, 4707–4720, 5897–5900 |
| CH S-2 / ER C1 — must-fail fixtures inside the build | **Closed.** `"exclude": ["test/build/fixtures"]`; per-fixture `tsc --noEmit` via `tsc_fixture.ts`; executed both ways. The `layoutprobe/` tsconfig this reviewer inspected carries the exclude and compiles green. | 711, 715–725, 4695–4706, 4863–4869 |
| CH S-3 — leg 1 mounts the whole transcript | **Closed** for the transcript (per-event prefix). The sibling defect — off-policy deny-health counts unsplit — is S-3 below, present at `149ffc8` (2919–2931) and not the same finding. | 3272–3277, 3720–3725, 3391–3393 |
| CH S-4 / ER S4 — floor number has no denominator | **Closed, then REGRESSED.** A seeded labelled sample with recall/precision and a published table exists; the rule is attributed to OL-C5 and the labeller is not required to be blind → M-2. | 3326–3339; regression 3330, 4096–4098 |
| CH S-5 — scrub never executed; over-broad | **Closed.** Six-variable `SCRUBBED_ENV`; executed three ways in §11.4; **re-executed by this reviewer today** — fresh `session_id`, `is_error:false`. | 1023–1032, 4678–4694, 3115–3123 |
| CH M-1 / ER (round-1 M5 residue) — clear floor 40 | **Closed.** Floor 2; T23-2 and T38-30 clear on "No.". | 1587, 3641–3646, 5585–5591, 6497–6500 |
| CH M-2 — restraint tests assert a list | **Closed** for the question recognizer (generated complement of 300 + 50); **closed in form** for the done-claim recognizer (a "generated corpus of 50" whose generating rule is unstated — m-6) and the clear recognizer (signature). | 5568–5574, 5455–5459, 5591–5593 |
| CH M-3 / ER M1 — deferral "opening clause" | **Closed, then REGRESSED.** The positional restriction is gone; the replacement discards whole sentences, holding on a substantive sentence that carries a deferral phrase → M-8. | 2229–2240; regression 2231–2236, 5587–5589 |
| CH M-4 — `T5-3` greps one spelling | **Closed.** Import scan resolving both specifiers; seeded cases for each. | 1035–1039, 5039–5051, 3774–3785 |
| CH M-5 / ER S2 — three AD-17 detectors unscheduled | **Closed** for the three named detectors (T14-2, T28-4, T28-5+T33-4, T16-1 staleness); the added `hooks_not_firing` detector covers only the mid-session shape → M-7. | 1727–1734, 2594–2596, 2609–2615, 2965–2971, 5269–5280, 5793–5817, 6031–6046, 6579 |
| CH M-6 — fixed timestamps vs wall-clock horizon | **Closed.** Reference instant = `HEAD` committer time in Step 13; Step 16's recency measured from it; T13-1 data pinned. | 1652–1655, 1826–1829, 5239–5245 |
| CH M-7 / ER M10 / ER m9 — leg 2 owner-run; option set; spawn hazard | **Closed in form, then REGRESSED.** Two named repositories with a replacement rule; `CTXORACLE_*` check; owner path = `export`. The launch sentence hands a shell script the agent's MCP tooling and reintroduces an "or"; the install-inside-the-session procedure rests on unstated premises → S-4. | 3286–3316, 3320–3324; regression 3292–3295, 3300–3301 |
| CH M-8 — L11(a) reportable from a remote corpus | **Closed in form, then REGRESSED.** The table is keyed by origin and L11(a) is *verified* only on an owner-local transcript; the origin is read from the transcript's path and markers → M-3. | 3278–3284, 3350–3353; regression 3279–3281 |
| CH m-1 / ER m1 — narration | **Closed.** Grep for "latent inversions", "earlier order", "transcriptions of architecture" → 0; §14.4 is a pass record. | 674–683, 6962–6981 |
| CH m-2 — `questions` has no provenance block | **Closed.** `openQuestion` takes no provenance; the table is stated as operational state per AD-4. | 2167–2172 |
| CH m-3 / ER M2 — "concluding position" undefined | **Closed** (final non-empty sentence, not ending in `?`); the definition admits a negated final sentence → m-4. | 1955–1960, 5445–5462 |
| CH m-4 / ER M6 — env-gated test hooks; timing-dependent tests | **Closed** for the env gates (injected clock, `--deadline-ms`, real truncated store) and for T29-1; **REGRESSED** for T3-3, whose new offsets cannot produce `StoreBusy` (executed) → M-1. | 2673–2677, 5784–5787, 5819–5850; regression 4970–4977 |
| CH m-5 — `ORDER BY <pk>` undefined | **Closed.** Every column in schema order for the five pk-less tables; FTS by `MATCH` results. | 1294–1296, 3582–3589 |
| CH m-6 / ER M7 — no cold-container CI job | **Closed in form, then REGRESSED.** A `cold-container` job exists on `node:22.16.0-bookworm-slim`; that image ships no `git` → M-5. | 762–766, 3210–3214; regression 763 |
| CH m-7 — `tuning_missing` undefined | **Closed.** In `FAULT_CODES` and T6-1 with `detail` = key. The fallback sentence contradicts Step 12's "nothing is hard-coded" — pre-existing at `149ffc8:1391`, m-3. | 1108–1111, 5058–5059 |
| CH D-plan-17 note — T25-3 hold clause tautological | **Partially closed.** T25-3's spec and D-plan-17 say the hold is not its subject; Step 25's Verification field still says it is → m-2. | 5684–5686, 3814–3818 vs 2426–2428 |
| ER S1 — fixtures and harness after their consumers | **Closed.** Generator + transcript fixtures at Step 1; runner + `hook` verb at Step 28; every Verification field checked: T5-1 (Step 5) has its fixtures; T28-1 (Step 28) has its runner; Steps 29–35's replays follow Step 28. §9's "runnable at that point" is now true except for the count in m-8. | 727–744, 2577–2587, 3455, 3457–3481 |
| ER S3 — regret population narrowed | **Closed.** Population = store-held facts incl. never-triggered; T30-1 has the never-triggered case. The "re-edited or reverted" definition gap (M-4) pre-exists at `149ffc8:2409–2410`. | 2737–2748, 5868–5877 |
| ER S5 — proxy listener cannot observe egress | **Closed.** `unshare -rn` runtime leg + `T32-3` structural scan; executed in §11.4. | 2899–2909, 3875–3885, 4721–4734, 5953–5984 |
| ER SY1 — convention tests contradicted by the plan's modules | **Partially closed, remainder unsatisfiable.** T24-2 (importer set) and T10-3 (allow-list from §5.1) are satisfiable on the current modules. T28-2's input-field list still collides with Steps 5, 20, 27, 12 and — newly — Step 28's liveness row → S-1. The author's closure claim for SY1 is false on T28-2. | 2301–2308, 1470–1475 satisfiable; 2554–2560, 2624–2628, 5744–5753 not |
| ER M3 — shared types have no creating step | **Closed.** Step 6 creates `types/events.ts`, `candidate.ts`, `index_types.ts`; Step 24 creates `hook_response.ts`. | 1113–1127, 2294–2299, 408–412 |
| ER M4 — keying-mode detection unimplementable | **Closed.** Candidate keys under every applicable rule. | 2794–2800, 5925–5935 |
| ER M5 — settings-file mechanics | **Closed.** Create-when-absent recorded in `schema_meta`; indentation and trailing newline preserved; `deinit` removes what `init` created; no-file case in T31-1(b)/T32-1(b). | 2816–2827, 2881–2887, 5897–5910, 5941–5951 |
| ER M8 — no verb for the detached `quick_check` child | **Closed.** `hook integrity-check`; T32-4. | 2890–2894, 5986–5996 |
| ER M9 — §2.3 omits CLI surface and packaging | **Closed.** Two rows added. | 177–178 |
| ER M11 — DDL and DAO surface deferred | **Closed.** Full DDL; per-DAO method table. | 1195–1292, 1388–1410 |
| ER m2 — §12.3 entries lacked Level/Real-doubles | **Closed.** Every T38 entry carries both (read through 6098–6549). | 6098–6549 |
| ER m3 — fourth wrongful-deny component unrecorded | **Closed.** D-plan-20 + §10A. | 3847–3855, 4260–4274 |
| ER m4 — Step 15 claims without §11 | **Closed.** §11.4 entry on `out/`, `import.meta.resolve`, the `.d.ts`. | 4735–4749 |
| ER m6 — AC-13 staleness untested | **Closed.** T16-1 stale-index and recency cases; §12.4 row. | 5309–5323, 6583 |
| ER m7 — T38-26 clause cannot fail | **Closed.** Asserts no writes and no process across the gap. | 6435–6442 |
| ER m8 — exit report location unrecorded | **Closed.** D-plan-21 + §10A. | 3856–3863, 4276–4289 |
| ER m10 — §5.1 annotations; runner range | **Closed.** Annotations present; Step 38 range excludes the three scripts. | 497–499, 555, 3242–3243, 6638 |
| ER m11 — `decideDeny` receives no tool input | **Closed.** `decideDeny(store, consumer, toolName, toolInput)`; T25-3 records the target. | 2370–2377, 5689–5696 |
| ER T1 — planning-tool run unverifiable | **Closed on the artifact's existence.** `2026-09-07-plan-tool-traces.md` is in the tree with the two sections; content not re-audited here. | tool-traces 1–18, 19, 723 |
| ER T2 — floor behaviour executed only on 22.22.2 | **Unchanged, honest.** Q28 assigns the floor to CI's matrix entry. | 6878–6882, 4603–4604 |

Every round-2 finding maps to a row. Closed: 34. Closed-in-form-then-regressed:
6 (CH S-4/ER S4, CH M-3/ER M1, CH M-7/ER M10/m9, CH M-8, CH m-4/ER M6 in part,
CH m-6/ER M7). Partially closed: 2 (ER SY1, CH D-plan-17 note). Closed with a
residual reported below: 3 (CH M-2, CH M-5/ER S2, CH m-3/ER M2). Unchanged and
honest: 1 (ER T2).

---

## (d) Findings, severity-ordered

Class legend follows `docs/collapse-log.md`: reduction / wrong-check / posture
/ unverified / mechanism-not-mission, plus *fake-completeness (measurement
layer)* from the 2026-09-04 entry and *unbuildable-as-written* for a step or
test an implementer cannot execute without a decision the plan forbids.

### S-1 — T28-2 cannot pass on a plan-conformant build: `source`, `cwd`, `transcript_path` appear in `dist/src/**` outside `adapter.js`
- **Class:** unbuildable-as-written / false attestation (the round-2 SY1 class). **PARTIAL REGRESSION (introduced by the round-2 corrections):** the input-field list and T28-2's assertion existed at `149ffc8` (2265–2268, 4924) and already collided with Step 5's `cwd` (`149ffc8` Step 5) and Step 20's `source` (`149ffc8:1789`); the round-2 corrections re-issued T28-2 with the claim "a clean build has none" (2627–2628) while adding a third colliding site — the liveness row's `transcript_path` key (2594–2596, the ER S2 fix). The author's self-check (`round-3-author-gates-review.md:55–58`) states T28-2's set was re-read against the modules.
- **Plan:** 2554–2560 (the list: `… error, transcript_path, agent_transcript_path, prompt, source, last_assistant_message, stop_hook_active, cwd`); 2624–2628 (*"built-output grep over `dist/src/**` outside `dist/src/hook/adapter.js` for every input and response field name listed above; no match permitted … a clean build has none"*); T28-2 5744–5753 (*"**Fails when** the clean build leaks"*). Colliding modules: 1020–1021 (`oracleSpawn(cmd, args, {cwd, env?, detached?, scrub?})`), 2050–2052 (`reconcileDedupOnSessionStart(store, consumer, source)`), 2501–2502 (`handleSessionStart(store, diagnosticsDir, consumer, source)`), 1566–1567 (tuning DAO `set(store, key, value, source)`), 2594–2596 (`detail_json = {transcript_path, transcript_bytes}`), 2966–2969 (`status` reads it).
- **Executed (layout reproduction, typescript 5.9.3, the Step 1 tsconfig):** two modules of exactly those shapes — a `reconcile(store, consumer, source)`, a `liveness()` returning `JSON.stringify({ transcript_path, transcript_bytes })`, a `spawnOpts(cwd)` — compiled green; `grep -o` over the emitted `dist/src/hook/*.js` returned `source`×2, `transcript_path`×1, `cwd`×2. The strings are parameter names, object keys, and column names the plan itself prescribes; `verbatimModuleSyntax` erases only types.
- **Contradicting source:** AD-6, arch 667–668 (*"The adapter (`hook/adapter.ts`) is the only code that names Claude Code's field names"*) — a property about the hook JSON's keys, which a string grep for common English identifiers does not measure; `references/testing-standards.md` ("every test must be able to fail" — this one always fails). Spec AC-2 (932–939) is a *control-flow* assertion; the plan's AC-2 row (6562) leans on T28-2.
- **Effect:** the convention tier is red from Step 5 onward (`cwd`), so `npm test`, Checkpoint 1, Step 37 and CI all fail on a correct build; an implementer either weakens the test on the fly or renames the plan's own parameters — both decisions the plan forbids.
- **Required change:** state the property at the level the architecture means it — the adapter is the only module that reads keys off the parsed stdin object and the only module that constructs the response object (an AST or import-graph check: no other module under `dist/src/**` accesses a property named in the list *on the hook event object*, and no other module returns an object with the response keys); if a string scan is kept, restrict it to the names that occur nowhere else by construction (`hook_event_name`, `tool_input`, `tool_response`, `agent_transcript_path`, `last_assistant_message`, `stop_hook_active`, `hookSpecificOutput`, `hookEventName`, `additionalContext`, `permissionDecision`, `permissionDecisionReason`) and say so; rename the liveness row's key (`transcriptPath`) or exempt `detail_json` payloads; re-run the SY1 read against every module for every name that stays in the list.

### S-2 — `deny_despite_answer_text` now counts deferral-only rejections; it contradicts AD-9 and inflates the wrongful-deny rate with correct denies of a dodging agent
- **Class:** wrong-check (a diagnostic that reports the block working as the block failing). **REGRESSION (introduced by the round-2 corrections)** — `149ffc8:2160–2163` had *"≥ 1 intervening assistant text turn that is not a deferral-stoplist match → `deny_despite_answer_text` (the length-floor miss; the deferral-false-match miss is human-channel-caught, AD-9)"*, matching AD-9; the current text was written with the M-3/M1 deferral corrections.
- **Plan:** 2448–2454 (*"≥ `deny.despite_answer_text_threshold` denies since the newest question opened with ≥ 1 intervening assistant text turn that the clear recognizer (Step 23) rejected → `deny_despite_answer_text` (**both rejection reasons are counted**, so the floor miss and the deferral-only miss are each visible to the owner …)"*); Step 33 2959–2961 (the count is a component of the wrongful-deny rate); Step 39 3344–3346 (the rate and its components are exit-report fields); T26-1 5707–5709 (asserts the deferral-only case fires).
- **Contradicting source:** arch AD-9 819–826: *"(b) `deny_despite_answer_text` — ≥ N denies (tunable) accumulate for a consumer with ≥ 1 intervening assistant text turn since the newest question opened, **excluding deferral-stoplist turns**, catching a question the clear recognizer wrongly held open (the length-floor miss; the deferral-false-match miss is caught only by the human channel)"*; spec FR-B1 367–369: *"A content-free deferral ('I'll get to that') does not clear it; **that is the dodge OL-C3 targets**"*; OL-C3 (ledger 68): *"the oracle should block that motherfucker until it stops ignoring me"*. An agent that says "I'll get to that" and keeps trying to edit is the case the block exists for; its third deny is correct, and the plan files it under wrongful. There is no "deferral-only miss": a deferral-only turn is not a missed clear.
- **Effect:** the wrongful-deny rate — a Phase A exit number Phase B is designed from (§11.5, 752) — is inflated by every correctly-denied dodge; `status` shows the block as misfiring when it is working; T26-1 pins the wrong behaviour.
- **Required change:** restore AD-9's exclusion — count only `below_length_floor` rejections; if the owner should see deferral-only dodges, count them under a separate, non-wrongful diagnostic (e.g. `deny_after_deferral`) that is never a wrongful-deny component; fix T26-1's data and `status`'s component list accordingly.

### S-3 — Leg 1's off-policy denies feed the report's block-health numbers with no leg split; the replayed `deny_loop`, `deny_bypass_suspect`, escape fraction and wrongful-deny components measure the reconstruction, not the block
- **Class:** fake-completeness (measurement layer) / wrong-check. Not a regression — `149ffc8:2919–2931` carried the same unsplit list; the round-2 correction (S-3) split only the lag-hold rate.
- **Plan:** Step 39 report 3341–3358 — *"denies issued; the wrongful-deny rate with its components (…); the lag-hold rate (`deny_after_answer_lag` / denies, **leg 2 only**); `deny_loop` and `deny_bypass_suspect` counts …; and … the fraction of denies that were escaped by a text turn versus corrected as wrongful"*; leg 1 mechanics 3266–3277; `deny_loop` definition 2445–2447 (≥ 3 consecutive denies with no intervening assistant text); bypass 2455–2461.
- **Contradicting source:** IDEAS #14 130–140: *"these transcripts are from sessions where the oracle was absent. The recorded agent never received a whisper, so it never reacts to one … A block, especially, would rewrite the trajectory, so the replayed remainder is fiction from the block onward … optimizing the oracle to score well on replayed logs is a Goodhart trap"*; spec §11.5 752–757 (the exit measures "how little the conservative recognizer catches" *on a real repo*, and Phase B is designed from it). In leg 1 the recorded agent cannot answer a deny it never saw: three recorded consecutive edits after a `?` prompt (the ordinary answer-by-doing shape) trip `deny_loop`; a recorded `echo > f` after a "denied" edit trips `deny_bypass_suspect`; "escaped by a text turn" is whatever the recorded agent happened to say next; "corrected as wrongful" is zero by construction. Reported as totals, these are the harness's non-reactions labelled as the block's health — the process-layer twin of the 2026-09-04 collapse (`collapse-log:1121–1156`), one layer below where round-2 S-3 found it.
- **Required change:** every deny-derived number in the report is split by leg; leg 1 reports the deny *count* only, labelled "off-policy — the recorded agent could not react"; `deny_loop`, `deny_bypass_suspect`, the escape fraction and the wrongful-deny components are leg-2 numbers (as the lag-hold rate already is), and the report's IDEAS #14 limit paragraph names these fields explicitly. Also split per-genre whisper counts by leg (leg 1's Stop-time genres depend on the reconstruction rule — M-9).

### S-4 — Leg 2's launch mechanism is not executable as written, and the leg rests on two unstated harness premises (mid-session settings application; workspace trust)
- **Class:** unbuildable-as-written / unverified (a mission-load-bearing leg — the validity rule hangs on it). **REGRESSION (introduced by the round-2 corrections)** — the launch text, the install-inside-the-session procedure and the `CTXORACLE_*` check are new (round-2 M-7 / M10 / m9); `149ffc8:2895–2910` had "drive real Claude Code sessions there — by Max Cogar … or by the implementing agent where it can start sessions".
- **Plan:** 3292–3295 (*"`scripts/exit-run.sh` starts each session through the implementing agent's session tooling — a Claude Code Remote session created on a fresh clone of the repository, or a local `claude` session where the agent runs locally"*); 3300–3301 (*"Inside each session the driver installs the tool (`npm install -g <package tarball>`, `ctxoracle init`)"*); D-plan-11 3743–3744 (*"The induction cannot run inside a session whose hooks are already loaded, which is why it lives in the closed-loop sessions where the tool is installed"*); validity rule 3320–3324; §16 item 1 (7042–7046).
- **Contradicting source:** (1) A shell script cannot call the implementing agent's MCP session tooling (`create_session`/`send_message` are the agent's tools, not a CLI); the sentence also re-introduces the option set round-2 M10 removed ("… or a local `claude` session"). (2) The plan installs hooks *inside* the session it measures while D-plan-11 asserts hooks are loaded once per session — the plan holds both models. The hooks reference fetched today documents a `ConfigChange` event that *"runs when a configuration file changes during a session … `project_settings`: `.claude/settings.json` changes"*, which is the premise leg 2 needs (settings written mid-session take effect) — it is neither cited nor in §11.4, and D-plan-11 contradicts it. (3) The same page's workspace-trust rule: *"Interactive session: Claude Code holds back hooks from every settings file … until you accept the workspace trust dialog for the folder … `-p` or SDK session: Claude Code never shows the dialog and treats the folder as trusted"* — a fresh clone driven in a local interactive `claude` session runs no project hooks until the dialog is accepted, and the measurement reads as a silent zero the `CTXORACLE_*` check (3296–3300) does not catch. `CLAUDE.md` rule 1 (a false zero is a falsely reported result); spec §11.5 753–757.
- **Required change:** state the mechanism executably — the implementing agent creates each session with its own tooling and `exit-run.sh` only collects (`export`/`import`, `status`, `log`) and computes; state the session type per environment and its trust consequence; either install before the session starts (a bootstrap session installs and `init`s the clone, and only sessions started after it count toward the three-session minimum — say so) or state and verify in §11.4 the mid-session-application premise from the `ConfigChange` section and reconcile D-plan-11's sentence; add to the validity rule a hook-liveness precondition — a `SessionStart` liveness row exists for every counted session, so a session whose hooks never fired can never count.

### M-1 — T3-3's stated schedule cannot produce the `StoreBusy` it asserts; executed, the third writer succeeds on its first attempt
- **Class:** wrong-check (a test that fails on a correct build). **REGRESSION (introduced by the round-2 corrections)** — the offsets (B at 120 ms, C at 230 ms) and the derived outcomes are the ER M6 fix; `149ffc8:4216–4219` stated no offsets.
- **Plan:** T3-3 4962–4981 — *"child A holds `BEGIN IMMEDIATE` from t = 0 for 250 ms; child B issues its write at t = 120 ms (first attempt busy until ~220 ms, retry succeeds once A commits at 250 ms …); child C issues its write at t = 230 ms and is still contended at 330 ms, so both of its attempts hit the busy timeout and it raises `StoreBusy` … **Fails when** … the third write does not raise `StoreBusy`"*.
- **Executed (Node v22.22.2, `node:sqlite`, WAL, `PRAGMA busy_timeout=100`, three child processes on the stated schedule, three runs):** A `ok-first` (0→251 ms); B attempt 1 `ERR_SQLITE_ERROR` at 221 ms, attempt 2 ok at 256 ms; **C attempt 1 ok (230→265 ms)** — identical in all three runs; the table holds rows A, B, C. Nothing holds the lock between A's commit at ~250 ms and C's window ending at 330 ms; B's single-row write commits in milliseconds. The arithmetic in the test's own data contradicts its failure clause.
- **Contradicting source:** AD-26 (arch 1650–1673: retry-once then fail-open is the *give-up* path, reachable only under sustained contention); `references/testing-standards.md` (the failure condition is derived before the test — here it was derived wrongly).
- **Required change:** make C contend with a lock that is held through both of its attempts — e.g. B holds `BEGIN IMMEDIATE` for 300 ms after acquiring at ~250 ms, C issues at 300 ms (busy until 400, retry busy until 500, B commits at ~550) → `StoreBusy`; or A holds 500 ms with C at 230 ms; state the schedule and re-derive each outcome from `busy_timeout` + one retry; keep the start signals on stdin.

### M-2 — The floor sample's labelling rule is attributed to OL-C5, and the labeller is not required to be blind to the recognizer's output
- **Class:** unverified (a real CONFIRMED key cited for content it does not contain — `collapse-log:83–89`) / wrong-check (the guard shares the recognizer's view — `collapse-log:837–846`). **REGRESSION (introduced by the round-2 corrections)** — the labelled sample is the S-4/ER S4 fix; `149ffc8` had no labelling rule.
- **Plan:** 3326–3339 (*"the implementing agent labels each sampled turn against the written rule 'a turn that asks the agent for information or a decision (OL-C5's question), whatever its punctuation' — a rule independent of the `?`-terminated recognizer, so the measurement is not the recognizer grading itself"*); §10A D-plan-10 4096–4098 (*"judged against OL-C5's definition, not the `?` rule"*); the sample is drawn "from the human turns of the leg 1 corpus and the leg 2 transcripts" after replay (3327–3328).
- **Contradicting source:** OL-C5 (ledger 70): *"if i ask a question and their next move isnt a direct answer or them taking actions to provide an answer, then then need corrected"* — a definition of the *trigger*; it defines neither "question" nor "asks for information or a decision" ("a decision" is the plan's addition). Presenting the plan's definition as OL-C5's is the class the collapse-log's 2026-08-25 item 4 records, on the one number the report calls "the honest floor numbers Max Cogar reads" (3355). Independence: the labeller built the recognizer and, labelling after replay, can read `questions` for every sampled turn; the rule differing from the `?` rule is not independence of the *judge* (`collapse-log:837–846`).
- **Required change:** attribute the rule to the plan (`[D-plan-…]`) and drop "(OL-C5's question)"; require the labels to be produced *before* the replay opens any row (or from a view of the corpus with the store hidden), record that order in the report, and state that the labeller is the implementing agent so the estimate is read with that caveat; keep the published table.

### M-3 — The marker-presence table is keyed by an origin read from the transcript's path and its markers — the key is derived from what the table measures, and a path cannot name a machine
- **Class:** wrong-check / unbuildable-as-written. **REGRESSION (introduced by the round-2 corrections)** — origin keying is the M-8 fix; `149ffc8:2890` reported "the marker-presence table" with no key.
- **Plan:** 3278–3284 (*"keyed by **transcript origin** — the machine and the harness mode (`local interactive` / `remote container` / `claude -p`), read from the transcript's path and its entries' `origin`/`isMeta` markers"*); 3350–3353 (L11(a) *verified* only when the corpus holds an owner-local interactive transcript); T38-32 6525–6538 (*"**Fails when** … the table is not keyed by transcript origin"*); D-plan-11 3745–3751.
- **Contradicting source:** arch V12 (136): *"Marker presence is mode-dependent"* — the mode is what the markers vary with, so classifying mode from markers and then reporting markers per mode is circular: a marker-less transcript is keyed `claude -p`, a marker-carrying one `interactive`, and the table always confirms V12; arch 1603–1606 (the verification is *"marker presence on a transcript from the owner's actual interactive environment"* — a fact about where the transcript came from, unknowable from its content); a path under `~/.claude/projects/<cwd-slug>/<session>.jsonl` encodes the project directory, not the machine. Under this keying a remote-container transcript carrying `origin.kind:"human"` (§11.4 4750–4755) is keyed as interactive and L11(a) is reported *verified* from the corpus round-2 M-8 said cannot verify it.
- **Required change:** origin is an *input* to `marker_presence.ts` (`--origin <machine> <mode>`), supplied by the exit run from where it executes and how each corpus was obtained (the report machine's own transcripts; a directory Max Cogar exported); a transcript with no supplied origin is reported "origin unknown" and cannot count toward L11(a); T38-32's self-test passes the origin explicitly.

### M-4 — Regret's "re-edited or reverted" is undefined; as written, any single `ok` edit on a file with a held pair is regret
- **Class:** wrong-check (a proxy that inflates a Phase A exit number). Not a regression — `149ffc8:2407–2412` had the same equation of "re-edited or reverted" with "`ok` Edit/Write rows".
- **Plan:** 2737–2748 (*"whose subject file or direct pair partner appears in the session's `observed_actions` `outcome='ok'` Edit/Write rows (re-edited or reverted)"*); T30-1 5868–5877 (no-inflate cases: unrelated churn, a `failed` Edit — no first-edit-only case).
- **Contradicting source:** spec FR-L4 649–655 (regret = a held fact that "would have changed a decision" and went unspoken; the proxy example is a region "later re-edited/reverted"); arch AD-18 1301–1307 (*"whose subject region was re-edited or reverted in the session … while the oracle stayed silent on it"*); spec AC-24 1106–1113 ("does not inflate"). A first edit on `a` where the store holds `(a, b)` is the decision moment, not evidence the decision was wrong; regret needs the churn *after* it (a second edit on the region, or a revert). Every edited file with any pair row would otherwise count, and the regret rate — "paired with seeded coverage" in the report (3349–3350) — would be dominated by ordinary editing.
- **Required change:** define the two predicates on `observed_actions`: *re-edit* = a second `ok` Edit/Write on the same path within the session after the first (or, for a pair fact, an edit of the partner after the subject); *revert* = the path's `content_hash` after an edit equals a hash it held earlier in the session (or the `revert_chain` class for cross-session); add a first-edit-only no-inflate case to T30-1's data.

### M-5 — The `cold-container` CI job runs on an image with no `git`; the script's fixture generation and `init` cannot execute there under the stated network policy
- **Class:** unbuildable-as-written / unverified. **REGRESSION (introduced by the round-2 corrections)** — the job is the m-6/ER M7 fix; `149ffc8:707–710` had no such job.
- **Plan:** 762–766 (*"`cold-container` runs in a fresh `node:22.16.0-bookworm-slim` container image with no cache restore, executes `scripts/check-cold-container.sh`"*); 3210–3214 (*"in a fresh `node:22.16.0-bookworm-slim` image with only the registry reachable: `npm ci`, `npm run build`, `ctxoracle init` on `pristine-tree`"*); T38-25 6416–6426; `pristine-tree` is generated by `generate.ts` with `git init`/`git commit` (727–733); `init` runs Step 5's `git` subprocesses (996–1017) and Step 13's `git log` (1646–1648).
- **Contradicting source (fetched 2026-09-07):** docker-library `node/README.md`: *"`node:<version>-slim` — This image does not contain the common packages contained in the default tag and only contains the minimal packages needed to run `node`"*; the `22/bookworm-slim/Dockerfile` at nodejs/docker-node `bc0a422`: installs `ca-certificates curl wget gnupg dirmngr xz-utils libatomic1 --no-install-recommends`, then `apt-mark auto '.*'` and `apt-get purge -y --auto-remove` — `git` is never installed. Installing it needs Debian mirrors the job's "only the registry reachable" policy excludes. Spec AC-20 (1090–1092) requires the cold run; it does not require a git-less image.
- **Required change:** name an image that ships `git` (verify it in §11.4 by reading that variant's Dockerfile — the default `node:22.16.0-bookworm` tag is the candidate, unverified here) or state that the script installs `git` and widen the network policy to say so; state the `init`-on-non-git-directory behaviour as a separate explicit case, since AC-20's "first index" presupposes a repository.

### M-6 — D-plan-13 says the replay tier runs on demand; Steps 1 and 28 wire it into the every-PR `test` job
- **Class:** unverified self-attestation (a §10 decision contradicted by the steps that implement it). **REGRESSION (introduced by the round-2 corrections)** — the two sentences are the ER S1 fix; `149ffc8` had no "added to the `test` job" sentence (grep `--replay` at `149ffc8`: 704, 2865, 3262, 4127, 5939 — none in Step 1's CI paragraph or Step 28).
- **Plan:** 766–769 (*"The replay tier (`npm test -- --replay`) is added to the `test` job by Step 28"*); 2585–2587 (*"this step adds `npm test -- --replay` to Step 1's `test` CI job"*); vs D-plan-13 3763–3772 (*"the replay tier runs on demand and, mandatorily, at Checkpoints 3 and 4 and before the exit run … A behaviour regression that only the replay tier catches reaches `main` only through a merged PR whose author ran `--replay` per the checkpoints"*) and §10A D-plan-13 4147–4159.
- **Required change:** choose. If every PR runs the replay tier (the stronger, honest choice — it also removes the self-graded-reviewer gate D-plan-13 concedes), rewrite D-plan-13 and its §10A entry and state the runtime cost; otherwise delete the two step sentences.

### M-7 — `hooks_not_firing` cannot see a wiring that never fired, and `init`'s interpreter pin makes that the likeliest real failure
- **Class:** wrong-check (half of AD-17's class implemented, the owner-invisible half missing). **REGRESSION (introduced by the round-2 corrections)** — the detector (ER S2 / CH M-5 fix) and the `process.execPath` command (CH S-1 fix) are both new.
- **Plan:** 2965–2971 (*"for every session with a liveness row and no `SessionEnd` row, if the transcript file the row names has an mtime later than the session's last `session_log` event by more than `diag.hooks_not_firing_gap_s`, record `hooks_not_firing`"*); T33-4 6031–6046 (both cases have a liveness row); 2803–2807 (`<node>` is `process.execPath`).
- **Contradicting source:** arch AD-17 1219–1224 (*"`hooks_not_firing` (SessionStart writes a liveness row; `status` flags a session whose events stop arriving while the transcript grows"*) and L7 1979–1983 (*"a totally-dead wiring is detected at the next CLI use or session with a working event (liveness rows go stale)"*) — "rows go stale" is a comparison of the *newest* liveness row against something newer; the plan's detector examines only sessions that have a row. Spec AC-9 1035–1036 ("Induced hook-not-firing … appear in the log and `status`"); OL-10 (ledger 48). After a Node upgrade the pinned interpreter path is gone, every hook exits 127, no handler runs, no liveness row is written, and `status` reports nothing — the failure OL-10 was raised for, made likelier by the plan's own command shape.
- **Required change:** add the totally-dead detector: at `status` (and at `init`/`index`), find transcripts under `~/.claude/projects/` for this project's `cwd` slug newer than the newest liveness row by more than the gap ⇒ `hooks_not_firing` with detail "no session started the hooks"; add case (c) to T33-4 (a transcript exists, no liveness row at all); and either drop the `process.execPath` pin in favour of PATH-resolved `node` (state the `npx` consequence) or have `init`'s summary and `status` print the pinned interpreter and its existence check.

### M-8 — The clear recognizer discards any *sentence* containing a deferral phrase, so a substantive answer that shares a sentence with one does not clear
- **Class:** reduction (of FR-B1/FR-B5's "content-free" qualifier) in the hold direction. **REGRESSION (introduced by the round-2 corrections)** — the sentence-level discard is the CH M-3 / ER M1 fix; under `149ffc8`'s opening-clause rule (`149ffc8:1961–1965`) a turn such as *"No — the null check does not fix it, see line 12, though I'll get to the rest later."* cleared; under the current rule it is one sentence, discarded whole, and does not clear.
- **Plan:** 2229–2240 (*"discard every sentence that contains a deferral-stoplist phrase anywhere in it; the turn clears when the surviving text is at least `lengthFloorChars`"*); T23-2 5585–5591 (*"'Sure, I'll get to that after the refactor.' (no clear — the deferral sentence is discarded whole)"*); the sentence-splitting rule is nowhere stated.
- **Contradicting source:** spec FR-B1 367–369 (*"A **content-free** deferral ('I'll get to that') does not clear it"*); FR-B5 438–439 (*"errs **toward clearing** on a substantive answer (only an empty deferral fails to clear)"*); P3 137 (no format tax); arch AD-9 779–786 (*"not a recognized content-free deferral"*). A sentence carrying the answer is not content-free; holding on it is a wrongful deny of an agent that answered, escapable only by re-answering in a separate sentence — a format tax. With S-2 it is then counted as a wrongful deny of the recognizer's own making.
- **Required change:** define content-free at the turn level: strip the deferral *phrase* (or the clause it heads up to the next clause boundary), not the sentence; clear when what remains meets the floor; state the sentence/clause splitting rule; add the mixed-sentence case to T23-2 as a *clears* case.

### M-9 — Leg 1's `Stop` reconstruction rule admits a Stop at every assistant entry; the documented cadence is once per turn
- **Class:** unverified (a reconstruction rule stated against the wrong cadence; inflates leg-1 Stop-time genres and the done-claim counter). Not a regression — `149ffc8:2884–2886` had the same words.
- **Plan:** 3268–3271 (*"reconstruct the hook-event stream … `Stop` per assistant turn end"*); R8/G4 (6706–6713, 7027–7034) own the correspondence as best-effort but do not state the rule.
- **Contradicting source:** the hooks reference fetched 2026-09-07: *"Events fall into three cadences: once per session: `SessionStart` and `SessionEnd`; once per turn: `UserPromptSubmit`, `Stop`, and `StopFailure`; on every tool call inside the agentic loop: `PreToolUse` and `PostToolUse`"*. A transcript "assistant turn" is ambiguous between an assistant JSONL entry (one per tool call) and the agent's whole response; the first reading fires Completeness, Verification, the done-claim recognizer and the AC-8a counter at every tool step of every replayed session.
- **Required change:** state the rule: one `Stop` per turn, emitted after the last assistant entry that precedes the next human turn or EOF, with `last_assistant_message` = that entry's text and `stop_hook_active: false`; cite the cadence sentence in §11.4; split leg-1 per-genre counts from leg 2 (S-3).

### M-10 — The seed members of `lexicon.stoplist` and `lexicon.deferral_stoplist` are unspecified and labelled `architecture_default`, so the vocabulary that decides the clear axis is neither fixed by the plan nor printed with the report
- **Class:** unbuildable-as-written (an implementer decision on the deny path's clear axis) / mislabelled provenance. Not a regression — `149ffc8:1348–1350` had the same label and the same absence.
- **Plan:** 1595–1604 (*"List-valued keys (`architecture_default` shape, members are the seed vocabulary …): `lexicon.stoplist` (rhetorical/idiom question seeds), `lexicon.deferral_stoplist` ('I'll get to that'-class seeds)"* — members enumerated for the command and completion lexicons, none for these two); 1571–1575 (`architecture_default` = "values the architecture states"); 2971–2972 and 3354 (only `plan_seed` values are printed); Step 23 2229–2240 (with floor 2 the clear axis is the deferral list).
- **Contradicting source:** arch AD-9 750–757 and 782 (the lists are named; no member is stated); arch 1708 (*"the exact words are implementation vocabulary, not architecture"*); D-plan-7's own rule (3628–3636: a value the architecture leaves open is a labelled `plan_seed` printed with every measurement). The exit report's recall/precision and the wrongful-deny rate are conditional on a vocabulary the report does not carry.
- **Required change:** enumerate the seed members of both lists in Step 12 (as the command-class and completion lists already are), label them `plan_seed`, and have `status` and the report print them; add them to T12-1's data.

### m-1 — Step 28's `verdict.emit` names a member neither `DenyVerdict` nor `blocks/verdict.ts` exports; resolved as a module import it breaks T24-2
- **Class:** unbuildable-as-written. Not a regression (`149ffc8:2287`).
- **Plan:** 2603–2604 (*"on a verdict → `verdict.emit`, diagnostics, exit 0"*) vs 2287–2290 (`verdict.ts` exports `type DenyVerdict` and `makeDenyVerdict` only) and T24-2 5624–5634 (`blocks/verdict.js` imported by exactly one module, `answer_drift.js`); `handler.ts` importing an `emit` from `verdict.js` is a second importer.
- **Required change:** state the path: `decideDeny` returns the verdict; the handler passes it to `adapter.toHookResponse({deny})` and writes the response; delete `verdict.emit`.

### m-2 — Step 25's Verification field still describes T25-3 as testing the hold; T25-3's spec and D-plan-17 say it does not
- **Class:** unapplied sub-clause (`collapse-log:1000–1012`: a fix must land at every site the finding named). Partial closure of the round-2 CH D-plan-17 note.
- **Plan:** 2426–2428 vs 5684–5686, 5694–5695 and 3814–3818.
- **Required change:** rewrite the Step 25 sentence to match T25-3's spec.

### m-3 — `tuning_missing`'s fallback ("the consumer uses its stated seed") contradicts Step 12's "nothing is hard-coded in the modules that consume it"
- **Class:** unbuildable-as-written (which value does a consumer use when the row is absent?). Not a regression (`149ffc8:1391`).
- **Plan:** 1108–1111, 1637–1639 vs 1626–1627.
- **Required change:** choose: the consumer fails open for that event with the fault (no hard-coded number anywhere), or `seedDefaults` is the single source and consumers read through a `TuningReader` that re-seeds on a missing key; say which and reflect it in T12-1.

### m-4 — The done-claim rule fires on a negated final sentence ("Not done yet.")
- **Class:** wrong-check (the recognizer errs away from silence in a stated direction). **REGRESSION (introduced by the round-2 corrections)** — the definition is new (CH m-3 / ER M2 fix); at `149ffc8:1697` "concluding position" was undefined, so a negation-aware reading was open; the round-2 ER M2 prescription's "not negated" clause was dropped.
- **Plan:** 1955–1960 (*"the phrase occurs in the final non-empty sentence, and that sentence does not end with `?`"*); T18-8 5445–5462 (no negated case among the negatives).
- **Contradicting source:** spec D-38 850–853 (*"a classification with error modes … errs toward silence"*); a false done-claim costs a Stop-time continuation and an AC-8a line at a stop that was not a done-claim (FR-B4).
- **Required change:** add "and the phrase is not within a negation (`not`, `n't`, `never`, `isn't`, `haven't` in the same clause)" or accept the false fire explicitly as a measured error; add "Not done yet." / "This isn't finished." to T18-8's negatives.

### m-5 — `large-store`'s size is unspecified, so T29-1's AD-23 inventory case has no stated magnitude
- **Class:** cannot-fail-as-written (if small) or cannot-generate-per-run (if large). Not a regression.
- **Plan:** 583, 2714–2716, 5823–5824, 5827–5830; arch AD-23 1472–1511 and V8 (132: 543 ms on 410 MB).
- **Required change:** state the fixture's target size (rows per table) and the statement it is meant to stress, and that the generator builds it once per run directory (cached by hash), so the case is a real bound on the inventory.

### m-6 — D-plan-19 claims a rule-complement assertion for every recognizer; the done-claim corpus is a 50-item list and the move recognizer's negatives are nine names
- **Class:** overclaim in §10A (`collapse-log:1087`). Not a regression.
- **Plan:** 3837–3844 vs T18-8 5455–5459 and T23-3 5605–5607.
- **Required change:** state the done-claim negatives' generating rule (final sentences with no lexicon phrase, generated from a seed grammar) or describe it as a list; for the move recognizer, assert `false` over a generated set of tool-name strings plus the enumerated real tools; correct the §10A sentence.

### m-7 — Leg 2's minimum protocol asks only `?`-terminated questions, so the closed-loop ground truth cannot exercise the intake-miss class
- **Class:** wrong-check (the protocol measures the recognizer on the inputs it was built for). **REGRESSION (introduced by the round-2 corrections)** — the protocol sentence is new (3301–3302).
- **Plan:** 3301–3302; 3338–3339 (re-asks and `--missed-question` corrections counted as misses); spec §11.5 749–753 ("how little the conservative recognizer catches").
- **Required change:** each counted session asks at least one indirect ask without `?` ("tell me whether …") and records whether it was opened, re-asked, or corrected.

### m-8 — Step 28 and Checkpoint 3 say "three" replay tests; Step 28 names four (T28-1, T28-3, T28-4, T28-5)
- **Class:** counts drifting (the author's self-check §2 names this class as checked). **REGRESSION (introduced by the round-2 corrections)** — T28-5 is the ER S2 fix.
- **Plan:** 2661–2663, 3476–3478 vs 2654–2661 and §5.1 500–503.
- **Required change:** "the four replay tests"; list T28-5 in Checkpoint 3.

### m-9 — Leg 1's corpus includes the tool's own repository's transcripts with no split, so leg-1 per-genre counts can be the reflection round-1 C3 excluded from leg 2
- **Class:** fake-completeness (measurement layer), disclosed but unsplit. Not a regression.
- **Plan:** 3258–3266 (every transcript under `~/.claude/projects/`; repository resolved by `cwd`), 3282–3284 (report lists repositories covered), 3320–3324 (the exclusion applies to leg 2's minimum only); on the exit-run machine this session's own transcript is the corpus (§11.4 4750–4755; G3 7018–7025).
- **Required change:** split leg-1 numbers by repository class (the tool's own vs the owner's code repositories) so the reflection is visible as such, not only inferable.

---

## (e) Verdict

**DOES NOT SURVIVE.** 4 Serious, 10 Moderate, 9 Minor. Two §10A decisions
collapse (D-plan-10, D-plan-11), three partially collapse (D-plan-6, D-plan-7,
D-plan-13). Twelve findings are REGRESSION-tagged — S-2, S-4, M-1, M-2, M-3,
M-5, M-6, M-7, M-8, m-4, m-7, m-8 — and S-1 is partly so (one of its three
colliding sites is new). That is the second consecutive round in which the
correction pass introduced defects (round 2: ten), and the owner's rule says
the correction process is the thing to diagnose before another pass is run.
What survived, and survived well: the answer-drift block's intake, catch-up,
deny decision, hold, lifetime and seam are AD-9 and nothing more; the scrub
contract, the fixture-exclusion build, the `argv[1]` resolution, the `unshare`
egress check and the transcript-prefix replay are real and were either
executed by the author with the command recorded or re-executed here.

**What I could not check, and why.** (1) Whether hooks written to
`.claude/settings.json` mid-session take effect in the *current* session: the
hooks reference's `ConfigChange` section documents that Claude Code observes
the change during a session and can block it, which implies it applies
unblocked changes, but no sentence states that a newly added hook fires in the
same session — S-4 therefore asks the plan to state and verify the premise, not
to assume its negation. (2) Whether `node:22.16.0-bookworm` (the non-slim tag)
ships `git`: its Dockerfile was not fetched; M-5's required change asks for
that read rather than asserting the fix. (3) The content of the planning-tool
traces beyond their existence and structure. (4) Behaviour at the Node 22.16.0
floor (only v22.22.2 is available here, as in round 2). (5) Whether a Claude
Code Remote session is treated as an interactive or an SDK session for the
workspace-trust rule — the page distinguishes the two; the plan must say which
its leg-2 sessions are. Every other claim above rests on a read at the cited
lines or on an execution whose command and output are recorded in the finding.
Nothing rests on the author's round-3 self-check; where it and the source
disagree (T28-2's satisfiability; the replay-test count; the closure of the
D-plan-17 note), the source was used.
