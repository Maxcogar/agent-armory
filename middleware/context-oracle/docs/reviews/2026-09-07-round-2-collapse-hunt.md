# Independent collapse-hunt, round 2 — Phase A implementation plan (2026-09-07)

**Artifact:** `docs/plans/plan-phase-a.md` as installed in the working tree at
commit `149ffc8` (5,999 lines; §7 has 40 steps, §10 has D-plan-1..19, §10A has
one collapse-test per decision, §12 has 113 test specifications). This is the
re-authored plan. The prior review chain on this artifact is round 1:
`docs/reviews/2026-09-06-plan-collapse-hunt.md` (C1–C3, P1–P4, N1–N6),
`docs/reviews/2026-09-06-plan-expert-review.md` (S1–S3, M1–M5, m1–m2), plus
`2026-09-06-author-gates-review.md` and `2026-09-06-meta-check-skipped-steps.md`.
The author's own self-check for this round, `2026-09-07-author-gates-review.md`,
was read and no claim in it was trusted; everything below is re-derived from
source.

**Axis:** mission fidelity only — `middleware/context-oracle/CLAUDE.md`
dominating rule 2 (the collapse test: hardest skeptic question → answer citing a
spec/mission line → what it steers toward; guide informing, never gate policing)
and rule 3 (does each decision serve the Phase A goal: *an honest deterministic
foundation, running on the owner's real repos, that measures its own floor — how
little it catches — with clean seams the later phases plug into; never fake
completeness dressed to look like a working product*). Standards-conformance and
document hygiene are the expert-review's axis and are not attacked here except
where a defect makes a mission-load-bearing test or step unbuildable.

**Reviewer independence:** a fresh subagent that did not write the plan, the
architecture, or any prior review, and was not shown the round-2 expert-review.

**Read in full before attacking:** `CLAUDE.md` (238 lines); `docs/collapse-log.md`
(all 1,156 lines — the 2026-09-04 entry first, then 2026-09-03 rounds 6–9,
2026-08-29, 2026-08-25 convergence definition, then the rest); `OWNER-LEDGER.md`
(all 80 lines); `docs/specs/spec-context-oracle.md` §1–§14 (all 1,138 lines);
`docs/architecture-phase-a.md` (all 2,058 lines: V1–V19, AD-1..AD-26, threat
model, traceability matrix, L1–L11); `docs/IDEAS.md` #14 (lines 92–175); the two
2026-09-06 independent reviews in full; the 2026-09-06 author-gates review and
meta-check outline; the 2026-09-07 author-gates review; and the plan end to end
(§1–§16, every step, every §12 entry, every §10/§10A entry). The round-1 plan
(`git show 99be60a:…/plan-phase-a.md`, 5,493 lines) was extracted and read at
the passages needed to decide whether each defect below is correction-induced.

**Method.** (1) For each of the 19 §10A entries: read the author's step-2
question, write a more hostile one the author would not have picked, test the
step-3 answer against it using only spec / architecture / ledger / collapse-log
as ground. (2) Hunt for load-bearing decisions §10A missed: plan-level judgments
in §7, cross-step interactions the per-decision test cannot see, elaboration of
the answer-drift block beyond spec §11.5's safe skeleton (Steps 21–27 read
against AD-9 line by line), pinned-version or scope changes, and §12 tests that
cannot fail, cannot be built as written, or assert a double's interactions.
(3) Re-derive closure of every round-1 finding from the current text, and look
for defects the correction itself introduced — those are tagged **REGRESSION
(introduced by the 2026-09-07 rewrite)**; the rewrite *is* the correction, so any
defect present now that was absent in `99be60a` carries the tag. (4) Every
finding quotes the plan line(s) and the contradicting source line(s). Search
located; reads verified. Two premises were also attacked by execution in this
environment (see the final paragraph for the one that was blocked).

**Verdict: DOES NOT SURVIVE.** 5 Serious, 8 Moderate, 7 Minor findings; 10 of
the 20 are REGRESSION-tagged. Of the 19 §10A decisions, 4 collapse (D-plan-3,
D-plan-6, D-plan-8, D-plan-10), 4 partially collapse (D-plan-7, D-plan-11,
D-plan-14, D-plan-19), 11 survive the harder question (several with a note).
The answer-drift block itself (Steps 21–27) was read against AD-9 and does
**not** elaborate beyond the safe skeleton — the one narrowing found (the
deferral "opening clause", M-3) is in the *under-fire* direction, not a coverage
elaboration. The measurement layer is where the rewrite went hollow: the exit
run's headline floor number has no denominator, and its transcript-replay leg,
as written, feeds the handler the session's future.

---

## (a) The 19 harder questions

Format per entry: the author's step-2 question (summarised), the harder
question, the verdict, and the ground.

### D-plan-1 — build order. **SURVIVES (with note).**
*Author's Q:* order does not constrain who elaborates the recognizer.
*Harder Q:* Checkpoint 3 runs the deny *replays* alongside whisper replays, but
the deny path's function-level tests (`T23-*`, `T25-*`) still run at Steps
23/25 with only the recognizer in view; an implementer fixing a red `T25-3`
has exactly the 2026-09-04 shape in front of them. Name what stops that fix
from being a new rule.
*Ground:* the author's own step-3 concedes "the order alone does not; the order
plus D-plan-19 does" (plan 3339–3347). The protection is D-plan-19, which is
itself only as wide as an enumerated list (see D-plan-19 below). The order
decision survives because it claims only the narrow contribution it states.
*Note:* §7's intro claims "the recognizers are built last among behavioural
components" (plan 660); Steps 25–27 (deny decision, health detectors, question
lifetime) are behavioural and follow Step 23. Finding m-1.

### D-plan-2 — dependency pins. **SURVIVES.**
*Harder Q:* V14 verified that the two packages are current, WASM, and
install-script-free — not that `web-tree-sitter` 0.26.13 *loads* the grammar
WASMs `tree-sitter-wasms` 0.1.13 ships (tree-sitter language ABI compatibility
is a runtime check at `Language.load`). If they are incompatible, the pin
freezes a pair that never worked.
*Ground:* `T15-1` (plan 4497–4506) loads a real grammar through the real
runtime at Step 15, before any acceptance replay; an ABI mismatch is a red run
at Step 15, and `T38-33` re-checks every default grammar. The pin's job
(reproduce the verified surface, plan 3353–3358) holds; the compatibility
premise is exercised by the plan's own tests before it is relied on.

### D-plan-3 — test execution. **COLLAPSES** → finding S-2 (REGRESSION).
*Harder Q:* Step 1's `tsconfig.json` has `"include": ["src", "test"]` (plan
691) and no `exclude`; §5.1 places four fixtures under `test/build/fixtures/`
each annotated "must fail tsc" (plan 474–477). `npm run build` is
`tsc -p tsconfig.json`. From the moment the first fixture exists (Step 9), what
does `npm run build` exit with?
*Answer from source:* non-zero, every time — the build compiles the fixtures
designed to fail. The author's step-3 answer (plan 3374–3382) argues about
empty test bodies and count guards and never touches the build itself.
"Compiling tests with the sources is the one path that works at the floor"
(plan 734–735) is a claim about a compilation that cannot complete.

### D-plan-4 — record-identical comparison. **SURVIVES (with note).**
*Harder Q:* the dump is `SELECT * FROM <t> ORDER BY <pk>` (plan 3130–3131);
AD-4's schema gives `import_edges`, `symbol_refs`, `invariant_members`,
`observed_actions` no explicit primary key (architecture 442–443, 452, 483), and
the plan's own §11.4 quotes SQLite: `VACUUM` "may change the ROWIDs of entries
in any tables that do not have an explicit INTEGER PRIMARY KEY" (plan
3990–3999). What is `<pk>` for those tables?
*Ground:* the decision's job (assert record identity, not bytes) is correct and
cited to AC-19; the unstated ordering key for pk-less tables is an implementer
decision the skill forbids. Finding m-5.

### D-plan-5 — generated fixtures. **SURVIVES (with note).**
*Harder Q:* "fixed seed for commit timestamps" (plan 2816) makes every fixture
commit date absolute. Step 13 excludes commits "beyond the horizon
(`miner.horizon_years`…)" (plan 1402–1404) and `fix_chatter` counts commits
"within `landmine.fix_chatter_window_days`" (1410–1412) — relative to what
instant? If to wall-clock now, `T13-1`'s "1 commit older than the horizon"
and "3 fix-labelled commits within 90 days" (plan 4465–4470) are true on the
day the seed is chosen and false later.
*Ground:* the fixture decision survives (forward-derived data, diffable
generator); the reference instant is a cross-step gap between Steps 13, 38 and
D-plan-7. Finding M-6. Not a regression — the round-1 plan had the same fixed
seed (round-1 plan 2590, 2880).

### D-plan-6 — settings marker. **COLLAPSES** → finding S-1 (REGRESSION).
*Harder Q:* the marker is the pattern `(^|[\\/])ctxoracle hook <event>$` over a
command written as `"<absolute path of the running ctxoracle binary> hook
<event>"` (plan 2469–2475). `package.json` maps `bin: {"ctxoracle":
"dist/src/cli/dispatch.js"}` (plan 681–682) and AD-25 sanctions `npx` from the
repo as an install path (architecture 1636). Under `npx`, and under the plan's
own replay runner ("spawns `dist/src/cli/dispatch.js hook <event>`", plan
2821–2823), what is the basename of the running binary's absolute path?
*Answer from source:* `dispatch.js`. The pattern requires the basename
`ctxoracle`; nothing `init` writes under that path matches the marker it will
later use to remove it. The step-3 answer (plan 3427–3433) defends against
harness drift and never checks what its own `init` writes.

### D-plan-7 — plan-seeded thresholds. **PARTIAL COLLAPSE** → finding M-1 (REGRESSION).
*Harder Q:* `qa.clear_length_floor_chars = 40` (plan 1342). OL-C5's "direct
answer" to "is the cache used?" is *"No."* — three characters. Under the seeded
floor that turn does not clear; the agent's next `Edit` is denied *after a
correct direct answer*, and the only escape is to pad the answer to 40
characters — a format tax. Cite the spec line that permits a wrongful deny of
an agent that has already given a direct answer.
*Answer from source:* none. FR-B5: "errs **toward clearing** on a substantive
answer (**only an empty deferral fails to clear**)" (spec 438–439). P3: "no
required ritual, no format tax" (spec 137–138). AD-9 asks for "a small floor"
(architecture 781) to exclude noise, not a 40-character one. The author's
step-3 (plan 3445–3451) defends the *label*, which survives; the *value*
contradicts the spec's own lean, and `T38-30`'s fixture is built "above the
floor" (plan 5454) so the acceptance test for AC-2c over-fire cannot fail on it.

### D-plan-8 — model seam. **COLLAPSES** → finding S-5 (REGRESSION).
*Harder Q:* the contract says the model call is spawned "only through
`oracleSpawn` with `scrub: true`" (plan 2738–2740), which "drops every
`CLAUDE_*` and `ANTHROPIC_*` variable" (plan 957–959). §11.4's V9 re-run was
executed with `CTXORACLE_INTERNAL=1` and no scrub — the plan says so: "without
the scrub the child reports the parent session's `session_id`" (plan 2740–2742;
§11.4 3999–4010 records only that run). This environment carries 43
`CLAUDE_*`/`ANTHROPIC_*` variables including `ANTHROPIC_BASE_URL` (the API
routing for a proxied environment) and `CLAUDE_CODE_PROVIDER_MANAGED_BY_HOST`
(observed 2026-09-07). Where is the run that shows the *shipped* command — scrub
on — still authenticates?
*Answer from source:* nowhere. This is the exact class collapse-log 2026-07-22
records (`--bare` severed the piggyback; "never trust a premise whose
validating command differs from the design's", collapse-log 551–561) and
2026-07-30 repeats ("a premise certified from a command that differs from the
shipped one will be wrong, and will be wrong repeatedly", 629–642). The scrub
rule is also over-broad on its face: OL-7 bars *credentials*; `ANTHROPIC_BASE_URL`
is routing, not a credential, and dropping it is not what "no separate
credentials" asks for.

### D-plan-9 — lag-window hold. **SURVIVES.**
*Harder Q:* `deny_after_answer_lag` is recorded only when a *later* catch-up
classifies the clearing turn. If the wrongfully-denied agent's next act is a
text re-answer and then it ends its turn, no tool event fires; is the deny ever
counted?
*Ground:* `Stop` runs the same pipeline (plan 2280–2287: catch-up is step 6 of
every event), so the classification happens at the turn's end and the fault is
recorded. The hold as "read-to-EOF + deny-on-open" (plan 2091–2100) is AD-9
verbatim (architecture 812–826); the transient wrongful deny is the spec's
chosen direction (spec 371–381). Round-1 P1's heuristic is gone.

### D-plan-10 — exit-run legs and validity rule. **COLLAPSES** → findings S-3, S-4 (both REGRESSION).
*Harder Q (i):* the headline "honest floor number Max Cogar reads" is "the
fraction of human questions in the replayed corpus that the question recognizer
opened" (plan 2928–2931). The numerator is what the recognizer opened. Who
labels the denominator — which human turns *are* questions under OL-C5 — and by
what procedure?
*Answer from source:* nobody and none. IDEAS #14 states replay has "*no planted
ground truth*" (IDEAS 105–107). Without a labelled denominator the only
computable fraction is opened / turns-ending-in-`?` — which is ~1.0 by
construction — or opened / all human turns, which measures nothing about
questions. Either is a padded number wearing the phase goal's label.
*Harder Q (ii):* leg 1 replays each transcript through the real handler (plan
2881–2893). The handler's catch-up reads `transcript_path` "from the bookmark to
EOF" (plan 2069–2072). If leg 1 points `transcript_path` at the stored
transcript, the first event's catch-up reads the *entire session* — every
question and every clearing turn — so at every replayed `PreToolUse` the
qa-state is the end-of-session state and the block denies almost nothing. Where
does leg 1 say the transcript is materialised as a per-event prefix?
*Answer from source:* nowhere. IDEAS #14's own definition includes
"reconstructing the hook-event stream … **and the `transcript_path` state** from
the stored transcript" (IDEAS 94–97); Step 39 reconstructs the event stream and
drops the second half. The plan's replay runner *has* per-event transcript
control (T38-4: "the runner controls the append", plan 5208) but leg 1 does not
invoke it. R8/G4 (plan 5653–5658, 5923–5930) own the *ordering* uncertainty,
not this.
*Also noted:* if leg 2 is driven by the implementing agent in remote sessions,
"Max asks a question" is an agent-authored prompt; the report records drivers
(plan 2902–2904), so this is disclosed, not hidden.

### D-plan-11 — L11 verifications executed by the build. **PARTIAL COLLAPSE** → finding M-8.
*Harder Q:* AD-24 names the L11(a) verification as "marker presence
(`origin.kind:"human"`) on a transcript **from the owner's actual interactive
environment**" (architecture 1602–1606). Leg 1 enumerates `~/.claude/projects/`
"on the machine where the exit run executes" (plan 2881–2882). G3 records that
a remote container holds only its own transcript (plan 5914–5921). If the exit
run executes remotely, the marker table is computed over the agent's own remote
transcripts — the mode §11.4 already measured (plan 4010–4016) — and L11(a) is
reported "verified" on a corpus that contains no owner-local interactive
transcript. Which report field distinguishes the two?
*Answer from source:* none — the report lists "the transcript count, the
repositories they cover" (plan 2890–2891), not the transcript *mode* or origin
machine, and the validity rule governs repositories, not transcripts (plan
2914–2917). The decision's "executed by the build" half survives; its "without
the plan claiming to have resolved them" half does not, because the report
cannot say what it did *not* measure.

### D-plan-12 — watchdog kept after V6 drift. **SURVIVES.**
*Harder Q:* with the harness now letting the tool proceed on a timed-out
`PreToolUse` hook (§4), a deny that takes > 5 s is discarded and the drifting
move proceeds silently — and the 2.5 s watchdog produces the same silence 2.5 s
earlier. Net effect on the block: none; so what does the watchdog buy the block?
*Ground:* nothing for the block, and the decision does not claim it does: its
grounds are NF-1 and FR-O3's "fail open *with a diagnostic*" (plan 3244–3252; FR-O3
spec 504–506, NF-1 spec 531–535). The diagnostic is the OL-10 deliverable. Honest.

### D-plan-13 — CI tiers. **SURVIVES.**
The author's own harder question (self-graded reviewer) is the project's
standing condition; the decision's mechanical mitigation (replay tier mandatory
at Checkpoints 3, 4 and before the exit run, plan 3255–3264) is what it owns.

### D-plan-14 — single spawn wrapper. **PARTIAL COLLAPSE** → finding M-4 (REGRESSION).
*Harder Q:* `T5-3` is "a built-output grep over `dist/src/**`" for
`node:child_process` (plan 952–963, 4278–4287). `import { spawn } from
'child_process'` — the bare specifier Node has accepted for a decade — contains
no such string. Does the convention test fail on it?
*Answer from source:* no. The author's step-3 (plan 3569–3574) says the test
"fails the build on any second importer"; it fails on any second importer *that
spells the specifier with the prefix*. The structural guarantee AD-21/FR-J4
asks for is a convention with a hole.

### D-plan-15 — URL normalization. **SURVIVES.**
*Harder Q:* identity comes from `remote.origin.url` (plan 931–933). A fork
workflow (`origin` = fork, `upstream` = canonical) and a second clone straight
from canonical key two stores for one codebase; `insteadOf` rewrites do too.
*Ground:* those are genuinely distinct remotes; AD-3 chose the URL key "only
where history cannot be trusted" and "visibly" (architecture 402–404), and the
plan prints the identity string (plan 943–944). The residual is the
architecture's, disclosed.

### D-plan-16 — bypass predicate bound. **SURVIVES.**
The author's harder question ("disclosure is not measurement") is answered
honestly against L3 (architecture 1935–1948) and `D-39`; the exit report prints
the bound beside the count (plan 2170–2174). Owned as a class, per collapse-log
1081–1087.

### D-plan-17 — two test levels. **SURVIVES (with note).**
*Harder Q:* `T25-3`'s "hold" clause — "the transcript file contains a clearing
turn appended after the last catch-up, `Edit` is denied before catch-up and
allowed after" (plan 4869–4875) — tests `decideDeny`, which never reads the
transcript (plan 2083–2089). "Denied before catch-up" is therefore true of any
store with an `open` row; the clause cannot fail if the handler ran catch-up
*after* the block check.
*Ground:* the ordering property is pinned elsewhere (`T28-1`, plan 4948–4956;
`T38-4`), so the decision holds; `T25-3`'s hold clause is a tautology and should
not be described as testing the hold.

### D-plan-18 — checkpoint placement. **SURVIVES.**
The author's answer for Checkpoint 2 (the set of generator tests is confirmed
complete against AD-15's seven genres — a step-level test cannot see a missing
sibling) is a real property and the round-1 S2/m2 gap is exactly what it now
catches (`T18-1`–`T18-7`).

### D-plan-19 — negative-coverage tests. **PARTIAL COLLAPSE** → finding M-2.
*Harder Q:* `T23-1`'s non-coverage set is four phrasings (plan 4771–4774) and
"Fails when … any member of the non-coverage set" is recognized (4775–4777).
An implementer adds a rule recognizing "would you check whether X" — none of
the four. Does any test go red?
*Answer from source:* no. The recognizer's *definition* is a rule — (i) ends
with `?`, (ii) outside fences/quotes, (iii) not on the stoplist (plan
1954–1958) — but the restraint test asserts a list. Collapse-log 2026-09-03
round 8 lesson 2: "A completeness claim over an open set must be a class
predicate, never a list" (collapse-log 1081–1087). And two of the four
recognizers have no non-coverage assertion at all: the clear recognizer
(`T23-2` asserts the floor and the deferral, plan 4778–4790 — nothing forbids a
per-question matcher, the AC-2a-ii Phase-B elaboration) and the done-claim
recognizer (`T18-8`, plan 4652–4663 — nothing forbids semantic patterns beyond
the lexicon; `D-38` names it a fallible recognizer of the same class). The
decision's job, "make the phase's restraint mechanical" (plan 3642), is
delivered for two recognizers as a list and for the other two not at all.

---

## (b) New collapses and load-bearing decisions §10A missed

Each is a plan-level judgment or cross-step interaction not covered by a
§10A entry. Full detail in (d).

- **N-A — Leg 1 feeds the handler the session's future** (Step 39, plan
  2881–2893). Detail in D-plan-10 (ii) above; finding S-3.
- **N-B — The exit report's headline floor number has no denominator** (plan
  2928–2931). Detail in D-plan-10 (i); finding S-4.
- **N-C — Leg 2's data never reaches the report author.** If Max Cogar drives
  the closed-loop sessions "in his normal work" (plan 2902–2904), the stores
  live on his machine; the report requires "`ctxoracle status` in each leg-2
  repository" (plan 2963–2964). No step moves that data (export, paste, or a
  remote session) and the install itself (`npm install -g`, `ctxoracle init` in
  his repos, plan 2896–2898) is an owner-run procedure — the workload transfer
  D-plan-11 (plan 3235–3236) rejects for the L11 probe. Finding M-7.
- **N-D — The deferral stoplist matches "as its opening clause" only** (Step
  23, plan 1963–1965). AD-9 says a turn clears when it "is not a recognized
  content-free deferral" (architecture 781–782) — no positional restriction.
  Under the plan's narrowing, *"Sure, I'll get to that after the refactor."*
  (45 characters, deferral not in opening position) clears every open question:
  a false-clear in the direction FR-B5 names as the costlier error ("a *missed*
  one is Max's question dying silently", spec 436–437), and one no automated
  detector sees — once closed there are no denies for `deny_despite_answer_text`
  to count. Finding M-3.
- **N-E — AC-9's six inductions map to tests for three of them.** §12.4 maps
  AC-9 to `T10-1, T26-1, T38-6, T38-8, T33-1` (plan 5527). Spec AC-9 requires
  *induced* "hook-not-firing, latency breach, produced-but-undelivered whisper,
  a deny that outlives its condition, a corrupted store, and a stale index"
  (spec 1035–1038). No test induces `hooks_not_firing` (the SessionStart
  liveness row and the transcript-grows-while-events-stop detector, architecture
  1221–1224), `index_stale` (1234), or `produced_but_undelivered` (1234–1235);
  `T33-1` seeds "one row per fault code" and tests rendering, not detection
  (plan 5092–5103). Likewise AC-13's "a stale fact lowers confidence" is mapped
  to `T16-1` (plan 5531) whose data has no staleness case (plan 4520–4531).
  Finding M-5. Not a regression — the round-1 mapping had the same shape — but
  it is the exact class of round-1 S2 (an AC's clauses attested covered by tests
  that do not exercise them), re-derived for AC-9 and AC-13.
- **N-F — Fixed fixture timestamps against a wall-clock horizon.** Finding M-6
  (see D-plan-5).
- **N-G — `questions` has no provenance columns but two steps write one.**
  Step 22's `openQuestion(…, provenance)` (plan 1904–1906) and Step 25's
  "provenance `human` / `chat:<date>` / `trust='human'`" (2066–2067) write a
  provenance block that Step 7's schema — "verbatim to the abridged schema in
  AD-4" (1085–1087) — does not have: AD-4's `questions(...)` row (architecture
  460–468) carries no `…prov`. Finding m-2.
- **N-H — "Concluding position" is undefined and `T18-8`'s data contradicts
  it.** Step 18 fires on a completion phrase "in a concluding position" (plan
  1696–1699); `T18-8` asserts *"I've implemented the parser and the tests
  pass."* fires (plan 4660–4661) — `implemented` is mid-sentence. Either
  "concluding position" means "in the final sentence" (then say so) or the test
  datum is wrong; an implementer decides. Finding m-3.
- **N-I — Test hooks in production paths gated by environment variables.**
  `T28-3` uses "a thrown error injected by an env-gated test hook in a genre —
  the hook exists only when `CTXORACLE_TEST_THROW` is set and is absent from
  production paths" (plan 4962–4965); `T29-1` selects a slow fake "by
  `CTXORACLE_TEST_SLOW_MS`" (4974–4976). Code that exists in the shipped genre
  module and switches on an env var is *in* the production path; the spawn
  wrapper scrubs only `CLAUDE_*`/`ANTHROPIC_*`, so a stray `CTXORACLE_TEST_*` in
  the owner's environment silently disables the oracle. Finding m-4.
- **N-J — `tuning_missing` is neither a fault code nor a defined detail.** Step
  12's impact statement: "a missing row surfaces as a `tuning_missing` detail on
  the diagnostics channel" (plan 1390–1392); `FAULT_CODES` is the closed list of
  Step 6 (1019–1032) and `T6-1` fails on any code outside it (4289–4300). Under
  which code, with what detail shape? Finding m-7.
- **N-K — `check-cold-container.sh` runs from "CI's clean container job"** (plan
  5396–5397) — a job Step 1's workflow (707–710: `npm ci`, `npm run build`,
  `npm test` on a two-entry Node matrix) does not define. Finding m-6.

**Answer-drift block, Steps 21–27, read against AD-9 for elaboration beyond the
safe skeleton (spec §11.5 lines 741–762):** intake (plan 2065–2069 ↔
architecture 747–760), catch-up (2069–2082 ↔ 762–788), the deny decision and
deny-eligible set (2083–2089 ↔ 790–804), the hold (2091–2100 ↔ 812–826), the
four detectors (2150–2174 ↔ 841–850), the Stop-time backstop and counter
(2219–2228 ↔ 828–839), question lifetime (2210–2218 ↔ 852–867), the seam
(1900–1948 ↔ 869–879). No coverage-widening addition was found: the deny set is
exactly `{Write, Edit, NotebookEdit}`, the question recognizer is rule
(i)–(iii) and nothing more, no question-type classification exists. The plan
additions are the `denyFired` flag on voiding (diagnostic, serves the
measurement) and the "opening clause" narrowing (N-D, under-fire direction).
The 2026-09-04 shape is not present in the block's steps. It is present in the
*measurement* of the block (S-3, S-4).

**Pinned versions and scope:** runtime pins equal V14 (architecture 138); the
Node floor equals AD-2 (325–336); dev-dependency pins are plan choices with
recorded reasoning (D-plan-2). No pinned version or spec scope element was
changed. `whisper_dropped_stale` (a new fault code, plan 1030–1032), `looseMode`
reporting (886–890), the `denyFired` flag, the `plan_seed` provenance class and
the three-leg exit run are plan additions; each traces to a requirement it
serves and none reintroduces a rejected posture.

---

## (c) Round-1 closure table

| Round-1 finding | State in `149ffc8` | Evidence (plan lines) |
|---|---|---|
| CH C1 — build order invites elaboration | **Closed.** Order is substrate → whisper path → block → handler; deny replays first run at Checkpoint 3 alongside whisper replays; the §10A exemption paragraph is gone (grep for "transcriptions of architecture" returns nothing in the current file). | 646–664, 3036–3048, 3083–3099. Note m-1 on the "built last" wording. |
| CH C2 — tests never execute | **Closed, then REGRESSED.** Tests compile into `dist/` with a count-guarded runner — but the same `include` compiles the must-fail fixtures and breaks the build. | 689–705, 3115–3128; regression 691 + 474–477 (S-2). |
| CH C3 — exit run on the tool's own repo | **Closed, then REGRESSED.** Validity rule + named candidate repos close the reflection case; the new legs introduce an undefined floor metric (S-4) and a replay that feeds the handler the future (S-3). | 2914–2917, 2895–2901; regressions 2928–2931, 2881–2893. |
| CH P1 — TOCTOU lag heuristic | **Closed.** Heuristic removed; hold = read-to-EOF + deny-on-open. | 2091–2100, 3203–3212. |
| CH P2 — L11(b) "design-safe either way" | **Closed.** Voiding records whether a deny fired; `status` counts it in the wrongful-deny components; D-plan-11 states "transient case counted". | 1914–1917, 2589–2590, 3527–3529. |
| CH P3 — marker mitigation locus wrong | **Closed, then REGRESSED.** Marker moved into the documented `command` field; the pattern assumes a basename the plan's own install paths do not produce. | 2469–2480, 3147–3157; regression S-1. |
| CH P4 — seam too narrow | **Closed, then REGRESSED.** Envelope typed from V9; the contract adds a scrub the plan never executed. | 2714–2760, 3188–3202; regression S-5. |
| CH N1 — URL normalization axes | **Closed.** Every axis stated; identity string printed. | 931–945, 3274–3283. |
| CH N2 — bypass list incomplete | **Closed.** Predicate is AD-4's list verbatim; bound printed beside the count. | 2165–2174, 3285–3292. |
| CH N3 — unsourced seeds | **Closed.** Two provenance classes; `plan_seed` values printed by `status` and the report; reasoning per value. | 1319–1346, 3159–3186. |
| CH N4 — `lengthFloor` unspecified | **Closed, then REGRESSED.** Value 40 seeded; the value contradicts FR-B5/P3 and `T38-30` cannot fail on it. | 1342, 5454; regression M-1. |
| CH N5 — env-var enforcement | **Closed, then REGRESSED.** Single spawn wrapper + convention test; the test greps the prefixed specifier only. | 952–963, 4278–4287; regression M-4. |
| CH N6 — grep scope for the confinement test | **Closed.** Scope is `dist/src/**`; compiled tests are outside by construction; seeded-violation cases pinned. | 2021–2027, 4817–4828. |
| ER S1 — Step 31 → Step 32 ordering | **Closed.** `init` calls `runIndex` (Step 14) directly; Step 31's dependencies are all earlier. | 2480–2481, 2511. |
| ER S2 — AC-8 uncovered | **Closed.** `T18-7` and `T38-28` pin the covering-test headline; `T38-29` pins Warning. | 4637–4650, 5426–5437, 5439–5448. |
| ER S3 — open register entry (Q-gap-5) | **Closed as stated.** The plan now records both MCP servers as runnable and used (`tools/list` over stdio); the codegraph server exists at `mcp-servers/codegraph-mcp/` and `.mcp.json` configures clear-thought (verified by listing 2026-09-07). Whether the Clear Thought trace ran as described is not verifiable from the repository. | 4029–4048, 5803–5805. |
| ER M1 — fixtures not in §5.1 | **Closed.** Every fixture repo listed with its T-IDs. | 538–568. |
| ER M2 — duplicate test file | **Closed.** One location (`test/conventions/`). | 482, 4922–4930. |
| ER M3 — `updatedToolOutput` untested | **Closed.** Two fixtures. | 4804–4815. |
| ER M4 — Step 39 dependencies | **Closed.** Step 37 lists every step with a unit/build/convention file. | 2799–2802. |
| ER M5 — AC-2c over-fire mapping | **Closed in form; see M-1.** `T38-30` added — built above the seeded floor, so it cannot catch the floor's own over-fire. | 5450–5459, 5516. |
| ER m1 — glob misses build/conventions | **Closed.** Runner enumerates all three directories. | 696–705. |
| ER m2 — "one per genre" inaccurate | **Closed.** Seven per-genre unit tests named. | 1727–1729, 4555–4651. |

---

## (d) Findings, severity-ordered

Class legend follows `docs/collapse-log.md`: reduction / wrong-check / posture /
unverified / mechanism-not-mission, plus *fake-completeness (measurement layer)*
from the 2026-09-04 entry and *unbuildable-as-written* for a step or test an
implementer cannot execute without a decision the plan forbids.

### S-1 — `init`'s marker pattern cannot match what `init` writes under the plan's own install paths
- **Class:** unverified / unbuildable-as-written. **REGRESSION (introduced by the 2026-09-07 rewrite)** — the round-1 plan wrote the literal `"command": "ctxoracle hook <event>"` (round-1 plan 2177), so the basename was `ctxoracle` by construction; the rewrite changed the command to an absolute path *and* made the basename the marker.
- **Plan:** Step 31 item 4, lines 2469–2480: *"`"command": "<absolute path of the running ctxoracle binary> hook <event>"` … an entry belongs to the oracle iff its `command` matches `/(^|[\\/])ctxoracle hook <event>$/` (the binary's basename plus the verb…)"*; D-plan-6, 3147–3157; §10A D-plan-6, 3419–3435; `T31-1` "Fails when the count of entries matching the Step 31 pattern ≠ 8" (5033–5036); `T32-1` (5061–5073).
- **Contradicting source:** plan 681–682 (`"bin": {"ctxoracle": "dist/src/cli/dispatch.js"}`); architecture AD-25 1636 (*"`npm install -g <path/tarball>` or `npx` from the repo — both work"*); plan 2821–2823 (the replay runner spawns `dist/src/cli/dispatch.js hook <event>`). Under `npx`, `node dist/…`, or the replay runner, the running script's absolute path ends in `dispatch.js`; nothing tells `init` to write the npm shim's path instead, and a path to `dispatch.js` is not executable as a bare command (no `node` prefix and no shebang is specified). Spec P8 / `D-9` (spec 147, 792): the one in-tree write must be reversible; AC-7 (spec 1015–1016).
- **Effect:** `deinit` cannot find the entries `init` wrote (AC-7 fails, the repo tree is left dirty — the one property `D-9` guarantees), `init` re-appends on every run, and `T31-1` goes red at Step 31, forcing an on-the-fly decision.
- **Required change:** state what string `init` writes as `command` (a literal `ctxoracle hook <event>` resolved by PATH, as the round-1 plan had, or `node <abs>/dist/src/cli/dispatch.js hook <event>`) and make the marker pattern match *that* string in every sanctioned install mode (`npm install -g`, `npx`, direct `node`); add the `npx`/direct-`node` case to `T31-1`/`T32-1`'s data.

### S-2 — `tsc -p tsconfig.json` compiles the four must-fail fixtures; the build is red from Step 9 onward
- **Class:** unbuildable-as-written. **REGRESSION** — the round-1 plan typechecked with `--noEmit` and compiled no tests (round-1 plan 586, 602); the rewrite's C2 fix added `"include": ["src", "test"]` without excluding the fixtures.
- **Plan:** Step 1, 689–695 (`"include": ["src", "test"]`, no `exclude`; `"build": "tsc -p tsconfig.json"` at 686); §5.1 474–477 (`test/build/fixtures/*.ts` — "must fail tsc"); §12 intro 4126–4128 (*"Compile-time tests invoke `tsc` on a fixture and assert failure"*, with no config named); `T1-1` 4136–4150 ("Fails when `npm ci` or `tsc` exits non-zero").
- **Contradicting source:** the plan's own `T9-2`/`T11-5`/`T24-1` (4354–4364, 4441–4450, 4804–4815): each fixture *must not compile*. A `tsc -p` over an `include` that contains them exits non-zero, so `T1-1`, Step 37's "`npm run build && npm test` exits 0" (2803–2806) and CI (707–710) all fail by construction.
- **Required change:** add `"exclude": ["test/build/fixtures"]` (or move the fixtures outside `include`) and specify how each compile-time test invokes `tsc` on its fixture (a per-fixture `tsc --noEmit --strict … <fixture>` with the project's options, so the failure asserted is the intended type error and not a missing-config error).

### S-3 — Leg 1 replays each transcript with the handler reading the whole session as its `transcript_path`, so the replayed block measures nothing
- **Class:** fake-completeness (measurement layer) / unverified. **REGRESSION** — leg 1 did not exist in the round-1 plan (no `~/.claude/projects/` replay there; round-1 Step 42 was AC-18 + discovery-mode framing only).
- **Plan:** Step 39 leg 1, 2881–2893: *"reconstruct the hook-event stream the session would have produced (…) and replay it through the real handler against a fresh store"*; catch-up semantics at 2069–2072 (*"reads from the bookmark to EOF"*); R8/G4 (5653–5658, 5923–5930) own ordering, not transcript state.
- **Contradicting source:** `docs/IDEAS.md` 94–97 — the discovery-mode replay is *"reconstructing the hook-event stream (…) **and the `transcript_path` state** from the stored transcript"*; spec §11.5 754–757 (run on transcripts *to discover how the mechanism actually behaves*). With the stored transcript as `transcript_path`, the first event's catch-up classifies every human question and every clearing turn of the whole session; every subsequent `PreToolUse` reads end-of-session state. The block's replayed deny count is then an artifact of the harness, reported as "how little the conservative recognizer catches" — the padded-quiet measurement the phase goal forbids, one layer below the 2026-09-04 collapse.
- **Required change:** specify that leg 1 materialises `transcript_path` as a growing prefix — for each replayed event, a file containing exactly the transcript entries that preceded that event — using the per-event append control the replay runner already has (`T38-4`, 5205–5211); state that the V1 lag itself is not reproduced by replay and that the lag-hold rate comes from leg 2 only.

### S-4 — The exit report's headline floor number has no denominator
- **Class:** fake-completeness (measurement layer) / wrong-check. **REGRESSION** — the metric is new in the rewrite (round-1 Step 42 carried no "fraction of human questions").
- **Plan:** Step 39 report, 2928–2931: *"the honest floor number Max Cogar reads — the fraction of human questions in the replayed corpus that the question recognizer opened"*; Checkpoint 5, 3056–3063 (*"measured coverage (not padded)"*).
- **Contradicting source:** `docs/IDEAS.md` 105–107 (*"Real-transcript replay has no planted ground truth"*); spec §11.5 746–752 (the exit must measure *"how little the conservative recognizer catches"* — a claim about the set of real questions, which requires the set to be known). No step labels which human turns are OL-C5 questions. The only computable fractions are circular (opened / `?`-terminated turns ≈ 1) or meaningless (opened / all turns).
- **Required change:** define the denominator and its procedure — e.g. a labelled sample of N human turns from the corpus, each classified by the implementing agent (recorded, reviewable) as question / not-question under OL-C5, with the recognizer's recall on that sample reported with N and the labeller named — or replace the metric with what replay can honestly produce (the count of recognizer-opened rows and the labelled false-open rate) and move "fraction of questions caught" to leg 2, where Max's re-asks and `--missed-question` corrections are the ground truth.

### S-5 — The model seam's `scrub: true` contract was never executed; the scrub is also over-broad
- **Class:** unverified (the `--bare` class, collapse-log 551–561, 629–642). **REGRESSION** — the scrub rule (`CLAUDE_*` and `ANTHROPIC_*`) and the "only through `oracleSpawn` with `scrub: true`" contract are new in Step 5 / Step 36 (the round-1 plan had no spawn wrapper).
- **Plan:** Step 5, 954–960; Step 36, 2737–2742 (*"the 2026-09-07 re-run showed that **without** the scrub the child reports the parent session's `session_id`"*); §11.4, 3999–4010 (the only V9 run recorded: `CTXORACLE_INTERNAL=1` set, no scrub); D-plan-8, 3188–3202; `T5-2` (4262–4276) asserts the variables are *absent*, not that the call *works* without them.
- **Contradicting source:** collapse-log 2026-07-22 (*"a re-run spike must exercise the actual design command, flags and all … never trust a premise whose validating command differs from the design's"*, 558–561) and 2026-07-30 (629–642). Environment observation 2026-09-07: 43 `CLAUDE_*`/`ANTHROPIC_*` variables are set in this session, including `ANTHROPIC_BASE_URL`, `CLAUDE_CODE_PROVIDER_MANAGED_BY_HOST`, `CLAUDE_CODE_EXECPATH`. OL-7 / spec §10 (ledger 45; spec 588–593) bar *credentials*; `ANTHROPIC_BASE_URL` is routing configuration, and in a proxied environment dropping it can re-route the child around the host's managed path. AD-21 asks for "a scrubbed environment" (architecture 1424) — which variables is the plan's judgment, and the judgment was not tested.
- **Required change:** execute the shipped command — `oracleSpawn` semantics, `scrub: true` — and record the result in §11.4; narrow the scrub to what OL-7 actually needs (credential-bearing variables, enumerated) and keep routing variables, with the enumeration stated; if the scrubbed call fails to authenticate, the seam contract is wrong and must change before Phase B builds on it.

### M-1 — `qa.clear_length_floor_chars = 40` contradicts FR-B5's clear lean and P3, and `T38-30` is built so it cannot fail on it
- **Class:** wrong-check / posture (a format tax on a compliant answerer). **REGRESSION** — round-1 N4 asked for the value; the value chosen contradicts the spec, and the over-fire test was shaped to avoid it.
- **Plan:** Step 12, 1342; D-plan-7, 3172–3176 (*"a one-word deferral cannot clear; 'no — the null check does not fix it, see line 12' clears"*); `T38-30`, 5450–5459 (*"answers substantively in different words (above the floor, not a deferral)"*); `T23-2`, 4778–4790 (boundary at the seeded floor).
- **Contradicting source:** spec FR-B5 438–439: *"errs toward clearing on a substantive answer (only an empty deferral fails to clear)"*; spec P3 137–138: *"no required ritual, no format tax"*; spec AC-2c 979–981: *"in a fixture where the agent did answer (reworded) … no deny fires"*; architecture AD-9 781: *"a small floor"*. A one-word direct answer ("Yes." / "No.") to a yes/no question — OL-C5's canonical direct answer — is 39 characters short of clearing; the next `Edit` is denied after full compliance, and escaping requires padding the answer. The deferral stoplist already handles content-free deferrals, which is what the floor was for.
- **Required change:** set the floor to the "small" value AD-9 means — enough to reject empty/whitespace/tool-noise-only turns (single digits of characters), not sentences — and add to `T38-30`'s data a terse direct answer ("No.") that must clear; keep the deferral stoplist as the content-free filter.

### M-2 — The restraint tests assert a list, not the rule; two of the four recognizers have no restraint test
- **Class:** wrong-check (collapse-log 1081–1087: a completeness claim over an open set must be a class predicate, never a list).
- **Plan:** D-plan-19, 3312–3319 and 3640–3654; `T23-1`, 4762–4777 (four non-coverage phrasings); `T23-2`, 4778–4790 (no non-coverage clause); `T18-8`, 4652–4663 (no non-coverage clause); R1, 5608–5614 (names `T23-1`/`T23-3` as the guard).
- **Contradicting source:** the recognizer's definition is a rule (plan 1954–1958; architecture 750–757); spec §11.5 746–749 (*"errs hard toward not-firing … a skeleton"*) applies to the clear recognizer and, via `D-38` (spec 850–853), to the done-claim recognizer equally.
- **Required change:** make `T23-1`'s negative assertion the rule's complement (no sentence lacking a terminal `?` outside fences is ever recognized — a generated corpus, not four examples); add a non-coverage assertion to `T23-2` (no per-question matching: a clearing turn closes *all* open rows regardless of content) and to `T18-8` (fires only on lexicon phrases, never on paraphrase).

### M-3 — The deferral stoplist matches "as its opening clause" only — a prefixed deferral clears every open question
- **Class:** reduction (of AD-9's rule) in the under-fire direction. **REGRESSION** — the round-1 plan's rule was "not a recognized content-free deferral" with no positional restriction (round-1 plan 1231–1236).
- **Plan:** Step 23, 1961–1965; `T23-2`, 4784–4787 (*"a deferral phrase followed by a substantive body above the floor (clears — the phrase is matched as the opening clause only)"*); Step 26, 2160–2164 (`deny_despite_answer_text` "excluding deferral-stoplist turns" — same positional match).
- **Contradicting source:** architecture AD-9 781–782 (*"is not a recognized content-free deferral ('I'll get to that'-class)"*); spec FR-B5 436–437 (*"a missed one is Max's question dying silently"*); spec FR-B1 367–369 (*"A content-free deferral ('I'll get to that') does not clear it; that is the dodge OL-C3 targets"*). *"Sure, I'll get to that after the refactor."* is content-free, 45 characters, and clears under the plan; nothing automated sees it afterwards.
- **Required change:** match the deferral stoplist anywhere in the turn's text after tool-noise stripping, and define "content-free" as the turn containing nothing *but* deferral/acknowledgement material (so a deferral followed by a substantive body still clears — the case `T23-2` wants — while a deferral preceded by "Sure," does not).

### M-4 — `T5-3` greps for `node:child_process`; the bare `child_process` specifier bypasses it
- **Class:** wrong-check. **REGRESSION** — the wrapper and its convention test are the rewrite's N5 fix.
- **Plan:** Step 5, 961–963; `T5-3`, 4278–4287; D-plan-14, 3265–3272; §10A D-plan-14, 3569–3574 (*"fails the build on any second importer"*).
- **Contradicting source:** the property claimed is AD-21's structural guard (architecture 1424–1429; FR-J4 spec 621) — a grep that sees one spelling of the import is a convention with a hole, the same class as the `node:sqlite` test `T3-2` (which is safe only because that module exists solely under the `node:` prefix).
- **Required change:** match both specifiers (`'child_process'` and `'node:child_process'`) and, since the plan already parses the import graph for `T24-2`, use the same import scan rather than a string grep; add the bare-specifier case to the seeded-violation data.

### M-5 — AC-9's mapping leaves three of its six inductions untested; AC-13's staleness clause is untested
- **Class:** wrong-check (an AC attested covered by tests that do not exercise its clauses — round-1 S2's class).
- **Plan:** §12.4, 5527 (AC-9 → `T10-1, T26-1, T38-6, T38-8, T33-1`) and 5531 (AC-13 → `T13-1, T14-1, T16-1 (staleness dampening)`); `T33-1`, 5092–5103 (seeds rows; tests rendering); `T16-1`, 4520–4531 (no staleness datum); `T14-1`, 4481–4496 (no `refreshIfStale` case).
- **Contradicting source:** spec AC-9 1035–1049 (*"Induced hook-not-firing, latency breach, produced-but-undelivered whisper, a deny that outlives its condition, a corrupted store, and a stale index each appear …"*); architecture AD-17 1221–1235 (the `hooks_not_firing`, `index_stale`, `produced_but_undelivered` detectors and their triggers); spec AC-13 1063–1065 (*"a stale fact lowers confidence without blocking"*); OL-10 (ledger 48).
- **Required change:** add inductions for `hooks_not_firing` (a SessionStart liveness row followed by transcript growth with no events, then `status`), `index_stale` (`index_head` ≠ `HEAD` at SessionStart → fault + detached reindex spawn), `produced_but_undelivered` (audit row written, emission forced to fail), and a staleness-dampening datum in `T16-1`; list `T29-1` in the AC-9 row for `latency_breach`.

### M-6 — Fixed-seed commit timestamps against a wall-clock horizon and trailing window make `T13-1`/`T38-18` calendar-dependent
- **Class:** unverified (cross-step: D-plan-5 × Step 13 × D-plan-7).
- **Plan:** Step 38, 2816 (*"fixed seed for commit timestamps"*); Step 13, 1402–1405 and 1410–1412; D-plan-7, 1343 (`fix_chatter_window_days` = 90); `T13-1`, 4465–4479; `T38-18`, 5332–5338.
- **Contradicting source:** architecture AD-13 1049–1051 (*"history horizon default 5 years or 10,000 commits"*) and AD-15 1158–1161 (*"fix_chatter (≥ k fix-labeled commits touching the file in a trailing window)"*) — neither names the reference instant, and the plan does not either. With absolute fixture dates, "in horizon" and "within 90 days" are true relative to *now* only until the calendar moves.
- **Required change:** state the reference instant for the horizon and the trailing window (HEAD's commit time is the choice that keeps fixtures and real repos consistent; if wall-clock, generate fixture timestamps relative to generation time and say so), and pin it in `T13-1`'s data.

### M-7 — Leg 2's install and its store data are owner-run when Max Cogar drives, and no step collects them
- **Class:** mechanism-not-mission (the exit deliverable depends on an unstated owner procedure). **REGRESSION** — leg 2 is new.
- **Plan:** Step 39 leg 2, 2895–2910 (*"Install the tool (`npm install -g` from the package, `ctxoracle init`) in at least two of Max Cogar's code repositories … drive real Claude Code sessions there — by Max Cogar in his normal work"*); Verification, 2962–2964 (*"`ctxoracle status` in each leg-2 repository shows the same numbers"*); D-plan-11, 3235–3236 (*"an owner-run markdown probe is a workload transfer the project forbids"*).
- **Contradicting source:** OL-11 (ledger 49 — he *speeds up testing*; design, build, verification are the agents'); `CLAUDE.md` 8–11, 79–84. If Max drives locally, the stores are under his `~/.ctxoracle` and the report author cannot read them; the install is a CLI procedure on his machine. The plan's own D-plan-11 reasoning rejects exactly this shape for the L11 probe and then adopts it for the whole leg.
- **Required change:** either make leg 2 agent-driven by construction (remote sessions the implementing agent starts in clones of the named repositories, with the report stating that the questions were agent-authored), or specify the owner's minimal action (`ctxoracle export <dir>` and share the directory) and the import step that folds his stores into the report — and say which.

### M-8 — L11(a) can be reported from a corpus containing no owner-local interactive transcript, and the report cannot say so
- **Class:** unverified / wrong-check.
- **Plan:** Step 39 leg 1, 2881–2891; Step 38, 2831–2834; `T38-32`, 5475–5486; §11.4, 4010–4016 (marker measured on *this remote session's* transcript); G3, 5914–5921; §16 item 5, 5958–5961 (*"L11(a) was measured on a 2026-09-07 session transcript and by T38-32 over the exit corpus"*).
- **Contradicting source:** architecture AD-24 1602–1606 (*"marker presence (`origin.kind:"human"`) on a transcript from the owner's actual interactive environment"*); V12 (136: *"Marker presence is mode-dependent"*); L11 (2008–2017). A remote-container corpus is the mode already measured; it cannot settle the owner's local interactive mode, and the report format records transcript count and repositories but not mode or origin machine.
- **Required change:** the marker-presence table must be keyed by transcript origin (machine / harness mode), and L11(a) reported "verified" only when the corpus includes at least one transcript from Max Cogar's local interactive environment — otherwise "not observed", the same honest field D-plan-11 already uses for L11(b).

### m-1 — §7's intro says the recognizers are "built last among behavioural components"; Steps 25–27 follow Step 23
- **Class:** unverified self-attestation ("Every X is Y" — collapse-log 786).
- **Plan:** 660–663. **Source:** plan 2061, 2149, 2209 (Steps 25, 26, 27 are behavioural: deny decision, detectors, question lifetime).
- **Required change:** state what is true — the recognizers are built after the whisper path and before the block that consumes them.

### m-2 — `questions` has no provenance columns; Steps 22 and 25 write one
- **Class:** unbuildable-as-written (a schema decision left to the implementer).
- **Plan:** 1904–1906, 2066–2067 vs 1085–1087 (Step 7: "verbatim to the abridged schema in AD-4"). **Source:** architecture 460–468 (`questions(...)` carries no `…prov`); 419–421 (the provenance block is on "every knowledge-bearing table").
- **Required change:** decide whether `questions` is a knowledge table (then add the provenance block to Step 7's migration and `T7-1`'s negatives) or not (then drop the `provenance` parameter from `openQuestion` and record the opener kind in `closed_by_kind`'s sibling column).

### m-3 — "Concluding position" is undefined and `T18-8`'s second positive contradicts the obvious reading
- **Class:** unbuildable-as-written.
- **Plan:** 1696–1699; `T18-8` 4656 and 4660–4661. **Source:** architecture AD-15 1150–1153 (same phrase, undefined).
- **Required change:** define it (e.g. "within the final sentence of `last_assistant_message`") so the datum and the rule agree.

### m-4 — Test hooks that live in production modules behind `CTXORACLE_TEST_*` environment variables
- **Class:** posture (test scaffolding in the shipped path). **REGRESSION** — new in the rewrite's `T28-3`/`T29-1`.
- **Plan:** 4960–4967, 4972–4980. **Source:** spec FR-O3 (504–506) — silence on failure must never depend on a variable the owner's environment could carry; Step 5's scrub (957–959) does not cover `CTXORACLE_TEST_*`.
- **Required change:** inject the failure and the slow recognizer through the seam the plan already has (a module replacement in the test build, the way Phase B replaces `classify.ts`), not an env-gated branch in production code; if an env gate is kept, it must be refused when `CTXORACLE_INTERNAL` is unset outside the test runner and documented as such.

### m-5 — `ORDER BY <pk>` is undefined for the pk-less tables in AC-19's dump
- **Class:** unbuildable-as-written. **Plan:** 3130–3131; `T32-2` 5075–5090. **Source:** architecture 442–443, 452, 483 (`import_edges`, `symbol_refs`, `invariant_members`, `observed_actions` without an explicit primary key); plan 3990–3999 (ROWIDs may change).
- **Required change:** name the ordering key per pk-less table (all columns, in schema order) and exclude FTS5 shadow tables from the dump explicitly.

### m-6 — `check-cold-container.sh` is "invoked from CI's clean container job"; Step 1 defines no such job
- **Class:** unbuildable-as-written. **Plan:** 5396–5397 vs 707–710. **Source:** spec AC-20 (1090–1092) requires the cold-container run.
- **Required change:** add the job to Step 1's workflow (or state that Checkpoint 4 runs the script by hand in a fresh container, and who).

### m-7 — `tuning_missing` is neither a fault code nor a defined detail shape
- **Class:** unbuildable-as-written. **Plan:** 1390–1392 vs 1019–1032 and `T6-1` 4289–4300.
- **Required change:** either add `tuning_missing` to `FAULT_CODES` (and to `T6-1`'s list) or name the code it rides under and the `detail_json` field that carries it.

---

## What I could not check, and why

Two premises were attacked by execution. The `node --test` empty-glob and
type-stripping facts behind D-plan-3 were not re-executed (the finding S-2 does
not depend on them — it depends only on what `tsc -p` does to an `include` that
contains must-fail files). The Step 36 scrub contract (S-5) was attempted
directly: a `claude -p --model claude-haiku-4-5 --tools "" --max-turns 1
--output-format json` invocation with every `CLAUDE_*`/`ANTHROPIC_*` variable
removed was **blocked by this environment's permission classifier** before it
ran, so S-5 stands as *unverified by the plan and unverifiable here*, not as a
demonstrated authentication failure; the environment listing (43 such
variables, including `ANTHROPIC_BASE_URL`) is the only execution evidence this
review holds for it. Two claims in the plan are unverifiable from the
repository: that the Clear Thought trace (43 `sequential_thinking` thoughts,
5 `decision_framework` scorings, plan 4047–4048) was actually run — the server
is configured in `.mcp.json` and the codegraph server exists on disk, which is
all a listing can establish — and the exact behaviour of `process.argv[1]`
under the npm global shim on the owner's platform, which is why S-1 is grounded
on the `npx` and replay-runner paths the plan itself sanctions rather than on
the shim. Nothing in this review rests on the author's 2026-09-07 self-check;
where the self-check and the source disagreed (the recognizers' position in
the order, m-1), the source was used.
