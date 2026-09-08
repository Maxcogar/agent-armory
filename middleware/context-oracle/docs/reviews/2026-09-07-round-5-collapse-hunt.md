# Independent collapse-hunt, round 5 — Phase A implementation plan (2026-09-07)

**Artifact:** `docs/plans/plan-phase-a.md` as installed in the working tree at
commit `c75faf8` (`git status` clean; `wc -l` 8,507; §7 has 40 steps each
opening with a `step-decl` block; §10 has D-plan-1…28 and §10A one
collapse-test per decision; §12 has 122 test specifications; Q1…Q52; 17
probes under `docs/plans/plan-phase-a.probes/` with `expected/` and
`layout/`). The round-4-reviewed text is commit `6a2159b` (8,160 lines);
the round-4 corrections landed in two commits, `f180bdf` (the bulk) and
`c75faf8` (S7, S14, S25, S26, S29, S38, plus the third trace file and the
author's self-check). Both revisions were extracted and compared wherever a
provenance tag below depends on it.

**Axis:** `middleware/context-oracle/CLAUDE.md` dominating rule 2 (the
collapse test: hardest skeptic question → answer citing a spec/mission line →
guide informing, never gate policing) and rule 3 (does each decision serve
the Phase A goal: *an honest deterministic foundation, running on the owner's
real repos, that measures its own floor — how little it catches — with clean
seams the later phases plug into; never fake completeness dressed to look like
a working product*). Steps 21–27 are held to exactly the spec §11.5 / AD-9
skeleton: a deviation in either direction is a finding. Package versions and
scope are checked against the architecture. Style is not attacked.

**Reviewer independence:** a fresh subagent that wrote none of the plan, the
architecture, the skill copy, the probes, or any prior review, and was shown
no round-5 expert-review.

**Read in full before attacking, in the dispatcher's order:** `CLAUDE.md`
(238 lines); `OWNER-LEDGER.md` (80); spec §8, §11.5, §12, §14 (lines
326–545, 739–777, 780–873, 908–1138); the architecture end to end (2,058:
V1–V19, AD-1..AD-26, the reasoning chain, threat model, traceability, L1–L11);
`docs/collapse-log.md` 2026-09-04 and 2026-09-07 entries (1121–1242); the two
round-4 reviews in full (809 and 405 lines); the author's round-5 self-check
in full (111 lines) — every one of its 42 closure rows treated as a claim and
re-derived below; the third trace file in full (640 lines: 16 Clear Thought
calls — 14 `sequential_thinking`, 2 `decision_framework` — every thought and
both scored option tables read) and the first two trace files by their
decision labels (file 1: D1–D10 incl. D2b; file 2: D-plan-2, 4, 5, 6, 8, 10,
13, 15–26 — the coverage §10 lines 4413–4421 claims, confirmed by grep); the
plan end to end in twenty-two contiguous reads (§1–§16, every step, every
§10/§10A entry, every §12 entry, §13–§16); every probe script and expectation
cited by a claim attacked below (02, 06, 07, 10, 13, 14, 15, 16).

**Executed this session (commands and observed output):**

1. `node .claude/skills/expert-plan/scripts/derive-plan-sections.mjs docs/plans/plan-phase-a.md --check` → `OK: 40 steps, 13 elements, 122 test specs, 17 probes cited, regions current`, exit 0.
2. `… --self-check` → `self-check passed: 34 checks`, exit 0.
3. `… --impact f180bdf` → `steps whose text changed since f180bdf: S7, S14, S25, S26, S29, S38` and 128 lines of restating surfaces; every listed surface was read against its step (the author's `--impact 6a2159b` walk covered the earlier commit; the six later-changed steps are the ones this pass re-walked line by line).
4. `bash docs/plans/plan-phase-a.probes/layout/prepare.sh <scratch>/probe-layout` → `npm ci` exit 0 (Node v22.22.2).
5. `run-plan-probes.mjs … --only 16_clear_rule_cases` → `ok`, exit 0; `--only 07_sqlite_busy_schedule` → `ok`, exit 0; `--only 07_sqlite_busy_schedule --repeat 3 --load 2` → `load: 2 CPU-bound sibling process(es)`, `ok 07_sqlite_busy_schedule (3 runs)`, exit 0; `--only 13_hooks_reference.optional` → `ok` (all six lines present under their named sections), exit 0. No full probe run was made (one was not needed: every probe a finding rests on was run singly).
6. The plan's own clear-rule reference implementation (`16_clear_rule_cases.mjs` lines 8–17, copied verbatim) executed over nineteen additional inputs — output quoted under S-2.
7. `curl https://code.claude.com/docs/en/hooks` (2,817,580 bytes, tag-stripped with heading markers) — passages quoted under S-1, M-1, M-4 with their section; `curl https://code.claude.com/docs/en/cli-reference` (455,834 bytes) — passages quoted under S-1.
8. `git show 6a2159b:middleware/context-oracle/docs/plans/plan-phase-a.md` (8,160 lines) and `git show 6a2159b:…/plan-phase-a.probes/16_clear_rule_cases.mjs`, read at every passage a REGRESSION tag or a closure row below cites.
9. `git diff --stat 6a2159b f180bdf -- docs/plans/` (13 files, +957/−559) and `f180bdf c75faf8` (3 files, +935/−48) to bound the correction commits.

**Verdict: DOES NOT SURVIVE.** 2 Serious, 5 Moderate, 8 Minor findings; 8 are
REGRESSION-tagged (introduced by the round-4 corrections). Of the 28 §10A
decisions none collapses outright, 4 partially collapse (D-plan-24,
D-plan-26, D-plan-27, D-plan-28), 24 survive the harder question (nine with a
note). The answer-drift block's intake and move axes are still AD-9 and
nothing more; the one deviation is again on the clear axis, now in the
*opposite* direction from round 4: the phrase-strip-then-floor rule holds only
on a turn that is exactly a stoplist phrase, so the spec's own named dodge
plus any one word ("I'll get to that later.") clears — executed with the
plan's own reference implementation (S-2). The leg that measures the block on
the owner's code was re-derived onto a session kind whose executability the
plan attributes to V9, a tool-less single-turn call, and whose two working
mechanics — the session-identity scrub and the `-p` permission pre-approval —
are stated nowhere (S-1). What survived, and survived well: the declarations
now name real consumption and the check bites on it (executed, S-1 of round 4
is closed); T-3-3's schedule is causally forced and reproduces under load;
probe 13 asserts the trust rule inside its section and the page agrees; the
§11.4 entries now say only what their probes print; `large-store` is built
where its tables exist; the FTS fallback has a shape; every one of the 42
round-4 findings was acted on.

**On the owner's regression rule.** Round 2 found ten correction-induced
defects, round 3 twelve, round 4 eleven/fifteen. This round finds eight —
S-1, S-2, M-1, M-4, M-5, m-3, m-4, m-6 — a fourth consecutive round in which
the correction pass introduced defects, at a lower rate and of a different
shape: none is the mechanical class the skill copy now checks (path
consumption, forward action items, timed probes, stale counts). All eight sit
in the four places the author's self-check §3 names as "reasoned rather than
reconciled" (D-plan-24, D-plan-26, D-plan-27, D-plan-28) plus two sentences
left beside moved facts. The shape is the round-3 lesson one more level up:
a re-derivation validated by a probe over the author's own case table (S-2:
probe 16 has no case of the class that fails), and a re-derivation whose
cited premise verified a different command than the design's (S-1: V9 is
`--tools "" --max-turns 1`; the counted session is neither) — the exact
`--bare` class the plan's own D-plan-8 quotes the collapse-log for.

---

## (a) The 28 harder questions

Format per entry: the author's step-2 question (summarised), the harder
question, the verdict, and the ground.

### D-plan-1 — build order. **SURVIVES.**
*Author's Q:* the order alone does not constrain the recognizer's size.
*Harder Q:* the declarations were the round-4 collapse; the check now
resolves bare call-shaped identifiers — but Step 25 consumes `recordFault`
(Step 10) by prose ("+ fault", 2893; "`unrecognized_user_entry` fault",
2899) with S10 absent from its `depends_on` (2878), and Step 33 consumes
`projectTranscriptDir` (Step 21) with S21 absent from its list (3657). Is
the declared graph a superset of consumption or not?
*Ground:* both are transitive — S25 → S24 → S10 (2794) and S33 → S26 → S25 →
S21 (2984, 2878) — which the contract's rule admits ("declared or transitive
dependency"). Walked every step's "What changes" for every exported name it
uses (the check this review performed: Steps 9, 10, 14, 16, 18, 25, 26, 28,
30, 31, 32, 33, 34, 35, 39) and found no consumption outside a declared or
transitive closure; the one real inversion round 4 found (Step 9 → Step 11)
is gone (`Trust`/`assertProvenance` moved to Step 6, 1227–1233). Survives on
the declarations this time, not only on document order.

### D-plan-2 — dependency pins. **SURVIVES.**
As in round 4: pins equal V14 (743–745 ↔ arch 138); `engines >=22.16.0`
(743) equals AD-2 (arch 327–328); no scope element added or dropped (§2.1
44–132 ↔ arch 48–75, item for item; §2.3 maps thirteen elements to steps).
*Harder Q:* the `tree-sitter-wasms` self-range is still there (5798–5801).
*Ground:* `npm ci` honours the lockfile; probe 11 pins the installed layout.
Holds.

### D-plan-3 — test execution. **SURVIVES.**
*Author's Q:* a count guard proves files, not assertions.
*Harder Q:* round 4's note — T-3-3 under `node --test`'s default file
concurrency — is now answered by "the outcomes are forced by the ordering,
not by margins, so the test … runs under `node --test`'s default file
concurrency without isolation flags" (6249–6252). Is that a claim or an
execution?
*Ground:* executed — probe 07 (marker-file signalling, no wall-clock offset,
`07_sqlite_busy_schedule.mjs:7–11`) reproduced `identical across 3 runs:
true` singly and under `--repeat 3 --load 2` here; the T-3-3 Data field
(6241–6249) and the probe's sequence (`await A.seen(/^holding$/)` → C exits
→ `waitFile(Bfirst)` → release A → `await A.exited` → release B) match step
for step, and the four outcome lines match the expectation line for line.
The round-4 M-1/S6 class is closed by execution, not by wording.

### D-plan-4 — record-identical comparison. **SURVIVES.**
As in round 4 (4488–4501; T-32-2 7299–7317).

### D-plan-5 — generated fixtures (amended). **SURVIVES (with note).**
*Harder Q:* the amendment moves `large-store` to a Step 29 generator "through
the real migrations (Step 7) and DAOs (Step 9)" (3300–3302). Two million
`cochange_pairs` rows through `cochange_pairs.bump(a, b, ts)` (1608) is two
million prepared-statement calls per CI job per matrix entry; and the trace
chain the plan says governs this amendment concludes "Step 37 measures and
reports its build time" (traces-3:613–617) while the plan assigns it to
T-29-1 and Step 38 (3305–3308, 4047–4050).
*Ground:* the decision's job (auditable, forward-derived fixtures; a store
built where its tables exist) holds; the build cost is deliberately deferred
to measurement ("the number is stated in the exit report, not assumed here",
3308), which is the honest form. The trace/plan mismatch is m-6.

### D-plan-6 — settings marker. **SURVIVES.**
As in round 4 (4517–4537; probe 06's four modes match the §11.4 entry
5867–5879 line for line).

### D-plan-7 — plan-seeded thresholds. **SURVIVES (with note).**
*Author's Q:* a forty-character floor would deny "No.".
*Harder Q:* the floor is 2 and the §10A answer says "the floor excludes
emptiness and nothing else" (5051–5052); Step 23 says the seeded value
"rejects an empty or one-mark turn and nothing else" (2716–2717). A
one-character direct answer — "y", "n", "7" — has content length 1 and is
held; and with the deferral stoplist reduced to bare-phrase-only (S-2), the
floor is now the *only* hold that ever fires in practice, and it fires on
exactly that class.
*Ground:* the seed-and-print decision survives (every value labelled and
printed); the "nothing else" claim is false for the one-character class —
m-2.

### D-plan-8 — model seam. **SURVIVES.**
*Harder Q (round 4's M-5):* the third scrub run existed only as prose.
*Ground:* probe 15 now runs all three legs and prints four lines
(`expected/15_…txt`); §11.4 5839–5854 says exactly what the probe prints;
D-plan-8's narrowing argument (4592–4600) now rests on a run the probe
performs. Closed by execution. Note only: V9/probe 15 verify a `--tools ""
--max-turns 1` invocation — the seam's contract — and are cited by D-plan-26
for a session that has neither property (S-1).

### D-plan-9 — lag-window hold. **SURVIVES.**
As in round 4 (4604–4613; 2913–2922; T-38-4 7482–7495).

### D-plan-10 — exit-run legs and validity rule. **SURVIVES (with note).**
*Author's Q:* three sessions are noise; the sample is the agent's account.
*Harder Q:* the validity rule (4175–4182) now hangs on a `claude -p`
protocol whose per-session identity depends on a scrub the protocol never
prescribes, and whose `Edit` events depend on a permission mode the
protocol never names (S-1); and the leg-2 corpus is, by the plan's own V12,
a marker-less transcript mode (M-4). Which leg-2 number is a floor over the
owner's usage?
*Ground:* the three-leg shape, the per-event transcript prefix, the per-leg
sample, the published label table and the per-leg deny split all hold
(4184–4236); the decision survives; the leg it depends on carries S-1 and
M-4.

### D-plan-11 — L11 verifications executed by the build. **SURVIVES (with note).**
*Harder Q:* "L11(a) is keyed the same way: *verified* only on an owner-local
interactive transcript, since a remote-container corpus is the mode already
measured" (5145–5147). Leg 2's transcripts are a third mode — `claude -p`,
which V12 (arch 136) measured as marker-less — and Step 39 names no origin
for them; the `--corpus <machine>/<mode>` vocabulary (4100–4104) lists two.
*Ground:* the decision (scripts executed by the build, "not observed" a
recorded outcome) survives; the leg-2 mode is undeclared — M-4.

### D-plan-12 — watchdog kept after the V6 drift. **SURVIVES.**
Verified today: the hooks reference states "A timed-out `command`, `http`, or
`mcp_tool` hook doesn't block the tool call. The call continues through the
normal permission flow" (Timeouts section) and "On `PreToolUse`, by
contrast, a timed-out command hook lets the tool call continue"
(PreModelSwitch section) — the §4 reading (300–315) is what the page says;
the grounds `NF-1`/`FR-O3`/`OL-10` are unchanged.

### D-plan-13 — CI tiers. **SURVIVES.**
The §10A steer is re-derived ("Both tiers on every pull request from the
step the first replay test exists", 5181–5182) — round-4 m-2 closed.
*Harder Q:* the every-PR job now rebuilds a ≈400 MB store per matrix entry
(3305–3308). *Ground:* cost deferred to measurement and reported (4047–4050);
the decision holds.

### D-plan-14 — single spawn wrapper. **SURVIVES (with note).**
As in rounds 3–4; the `createRequire` hole stays conceded.

### D-plan-15 — URL normalization. **SURVIVES.**
As in rounds 2–4 (1097–1109; 4706–4715).

### D-plan-16 — bypass predicate bound. **SURVIVES.**
As in rounds 2–4 (3009–3018; T-26-1's `dd of=target.ts` 7045–7046).

### D-plan-17 — two test levels. **SURVIVES.**
Round 4's disagreement (T-14-2 vs Step 14) is closed: T-14-2 (6566–6583) now
asserts no spawn and matches Step 14 (2055–2061) observable for observable;
the spawn moved to T-28-5 (7140–7157) with the `.reindex.lock` observable.

### D-plan-18 — checkpoint placement. **SURVIVES.**
*Harder Q (round 4's):* Checkpoint 3 spawned a verb Step 32 provided.
*Ground:* the `index` verb is now Step 28's (`src/cli/index.ts`, 3196–3198,
`provides: [… ctxoracle-index …]` 3132); every test Checkpoint 3 names
(4370–4378) exists at Step 28 — T-21-1 … T-28-6 — and nothing it runs
consumes a later step. Checkpoint 4 (4380–4394) names T-38-32/T-38-33 as
"pass", which no runner invokes (M-3), but that is the test's defect, not
the placement's.

### D-plan-19 — negative-coverage tests. **SURVIVES.**
Round 4's m-3 closed: T-18-8 carries negated negatives and the earlier-clause
positive (6757–6764). *Harder Q:* T-23-2's case table is the author's again
(23 cases, 6899–6913) and probe 16 runs exactly those; the class that fails
(a stoplist phrase plus one word) is in neither. *Ground:* the
complement-as-rule decision holds for the three recognizers whose rule is a
lexicon complement; the clear recognizer's table is not a complement and is
where S-2 lives.

### D-plan-20 — fourth wrongful-deny component. **SURVIVES.**
As in rounds 3–4 (4766–4773; 2643–2646).

### D-plan-21 — exit report location. **SURVIVES.**
As in rounds 3–4 (4775–4782).

### D-plan-22 — no test hooks in production modules. **SURVIVES.**
As in rounds 3–4 (4784–4792; 3169–3171).

### D-plan-23 — no-egress asserted structurally. **SURVIVES.**
Round 4's m-4 closed: T-38-22 carries the refused-`unshare` branch
(7726–7729); the runner refusal is recorded as executed in CI (5896–5904).

### D-plan-24 — phrase-strip-then-floor clear rule. **PARTIAL COLLAPSE** → finding S-2 (REGRESSION).
*Author's Q:* "Sure, I'll get to that after the refactor" clears on "Sure,
after the refactor" — the dodge dressed in five words walks through.
*Harder Q:* forget the dressed dodge — take the spec's own example and add
one word. "I'll get to that later." strips to "later." — five characters,
above the floor — and clears. "I'll come back to it." strips to "it." and
clears; so does "I'll get back to you on that.", "Will look into that
first.", "Later.", "Not now.", "One moment.", "Hmm." (executed with the
plan's reference implementation, S-2). Four of the seven stoplist members
(`i'll come back to`, `first let me`, `before i answer`, and `i'll get to
that` with any object) are prefixes that always carry a trailing word, so
they can never hold at all. The decision's stated job is "Let every answer
clear the block, including a one-word one, *while an empty deferral never
does*" (5352–5353). Name the empty deferral, other than the six-word bare
phrase itself, that does not clear.
*Answer from source:* none. FR-B1 (spec 367–368): "A content-free deferral
('I'll get to that') does not clear it; that is the dodge OL-C3 targets."
FR-B5 (spec 439): "only an empty deferral fails to clear." AD-9 (arch
781–782): "not a recognized content-free deferral ('I'll get to that'-class)"
— a class. The plan's rule makes the class a single string. The trace's
decision_framework scored this option 1.0 on "holds on an empty deferral
(FR-B1)" (traces-3:103) without a case of the kind. The first half of the
job holds (every direct answer clears — executed); the second half is
delivered for exactly one input. Partial collapse; the reduction is in the
clear direction, and the round-4 text held on every one of these inputs
(6a2159b:2650–2678 — the clause carrying the phrase was discarded whole).

### D-plan-25 — totally-dead detector and interpreter pin. **SURVIVES (with note).**
*Author's Q:* another checkout, or a pre-`init` session, trips it.
*Harder Q:* the answer covers "a pre-`init` transcript older than the gap"
(5380–5381). The detector runs at `init` (3687). On an agent-led project
`init` is run by an agent *from inside a live Claude Code session in the
repository* (OL-11 — the agent runs the tool; Step 39 step 1 has the agent
run `init`); that session's transcript sits under the repository's slug, is
newer than the gap, and has no liveness row, because its hooks were not
wired when it started. What does `status` record at the moment of install?
*Ground:* a `hooks_not_firing` fault with detail "no session started the
hooks" — true and misleading — written into `faults` at install time on the
commonest path there is. The decision (make a dead wiring visible) survives;
the false positive at `init` is m-7 (the round-4 note's case, re-raised).

### D-plan-26 — leg-2 protocol: `claude -p` sessions the agent drives. **PARTIAL COLLAPSE** → findings S-1, M-4 (both REGRESSION).
*Author's Q:* the tool measuring an agent its author scripts; the `-p`
harness may not produce the L11(b) turns.
*Harder Q:* the §10A answer and the trace chain rest on "the invocation the
model seam already verified (V9; probe 15 authenticates under the scrub)"
(4856–4858; traces-3:237–241). V9 is `claude -p --model <small> --tools ""
--max-turns 1` — every tool disabled, one turn (arch 133, 135; §11.4
5831–5834). A counted session must run `Edit` and "at least five tool
events" across turns continued with `--resume` (4142–4149). Under the
plan's own §11.4 (5828–5838, probe 15), an unscrubbed `claude -p` child
"reports the parent session's `session_id`"; Step 39 prescribes no scrub
for the driver, only that `CTXORACLE_INTERNAL` be absent (4126–4129). And
the CLI reference, fetched today, says a `-p` session starts in the
`default` permission mode "when nothing is configured" and that
`--allowedTools` is what makes tools "execute without prompting for
permission" — a mode `-p` cannot prompt in. Which counted session, as
written, is "a fresh session" with a liveness row of its own, and which
`Edit` runs?
*Answer from source:* neither is established. The protocol's other members
— `init` before any session, local collection, the liveness precondition,
one indirect ask per session, per-leg labelling, declared origins — hold
and are real improvements over round 4; the member the validity rule hangs
on (a fresh, hook-live, tool-capable session) is asserted from a premise
that verified a different command, and its two working mechanics are
unstated (S-1). Separately, the session kind chosen is the transcript mode
V12 measured as marker-less, a consequence the leg does not disclose (M-4).

### D-plan-27 — `classified_turns` record. **PARTIAL COLLAPSE** → finding M-1 (REGRESSION).
*Author's Q:* the recognizer keeping a diary about itself.
*Harder Q:* `PRIMARY KEY(consumer, uuid)` (1445); the catch-up records
"every classified turn" (2894–2896); Step 27 resets the bookmark to offset 0
on `resume`/`fork`/`compact` "so the next catch-up rebuilds qa-state from
the transcript" (3073–3074). The rebuild re-classifies every assistant turn
the previous catch-ups already recorded for the same consumer (a resumed
session keeps its `session_id`; the hooks reference: "SessionStart hooks run
again on resume with source set to 'resume'"). The DAO "wrap[s]
statements" (1625) and its `record` is specified as neither an upsert nor an
ignore. What happens to the first `SessionStart {resume}` on a real
transcript?
*Answer from source:* on a plain `INSERT` the second row throws
`SQLITE_CONSTRAINT`; under AD-7 (3224–3225: "any error ⇒ empty output + JSONL
fault, no deny, no whisper") the event goes silent, the bookmark stays at
0, and every later event's catch-up throws again — the handler is silent
(no deny, no whisper) for the rest of every resumed session. T-27-1 and
T-38-8 seed fresh stores, so the wrong branch passes both. The decision's
job (cross-event detector state) survives; its unstated write semantics
carry a failure mode that switches the block off exactly where leg 2 lives
(every `--resume` turn). Partial collapse.

### D-plan-28 — conditional FTS migration, one search interface. **PARTIAL COLLAPSE** → findings M-2, M-5 (M-5 REGRESSION).
*Author's Q:* a fallback no exit-run machine exercises is a path with a test
and no user.
*Harder Q:* the shape is "one interface with the choice made in one place"
keyed on `schema_meta.fts_state` (2032–2035). Who writes `fts_state =
'fts5'`? `grep fts_state` over the plan: read at 1457, 1462, 2032, 3477,
4887–4891, 8307; written once — `'fallback'`, at 3465, "before the
migrations run", on a fresh store that has no `schema_meta` table until
migration 001 runs. And who writes a row into `fts_symbols`/`fts_paths`?
Step 14's `runIndex` output list (2042–2054) names `files`, `symbols`,
`import_edges`, `symbol_refs`, `entry_score`, `test_map`, `index_head` — no
FTS table; Step 15's frontend "tokenization into FTS" (2134) is a sentence
about an interface that returns `{symbols, imports}` only (2024–2028).
T-14-1 asserts "the same hit set" under both flags (6562–6564).
*Answer from source:* on an FTS5 runtime `fts_state` is never set, the FTS
tables are never populated, and T-14-1's equality holds only if both paths
return nothing or the implementer invents the writer and the setter. The
decision's shape (one migration, one flag, one interface) survives; the
mechanism it wraps is unbuildable as written (M-5) and the FTS path has no
writer in either revision (M-2).

---

## (b) New collapses, unlisted load-bearing decisions, hollow mechanisms

Plan-level judgments and cross-step interactions no §10A entry covers. Full
detail in (d).

- **N-A — The counted-session shape was never executed and its two
  mechanics are unstated.** The plan decides, without listing it, that a
  driver script spawns `claude -p` children with tools enabled, multi-turn
  via `--resume`, and a permission posture it never names; its evidence is a
  tool-less single-turn call. Finding S-1 (D-plan-26).
- **N-B — The deferral stoplist is a mechanism that holds on one input.**
  Reduced to bare-phrase-only by the floor-2 arithmetic, the stoplist cannot
  hold on four of its own seven members and holds on the other three only
  when the turn is exactly the phrase. Its job description survives review
  ("an empty deferral never clears"); its behaviour does not. Finding S-2
  (D-plan-24).
- **N-C — `classified_turns` write semantics under rebuild.** An unlisted
  decision (INSERT vs upsert) whose default branch silences the handler
  after every `resume`/`compact`. Finding M-1 (D-plan-27).
- **N-D — Nobody populates the FTS tables.** A load-bearing omission in
  both revisions that D-plan-28's "same hit set under both flags" test now
  makes visible. Finding M-2.
- **N-E — Two build-time verifications have no invoker.**
  `grammar_inventory_check` (L6) and `marker_presence`'s self-test exist as
  files under `test/build_time/`, a directory neither the runner nor any CI
  job nor any script entry runs; Checkpoint 4 asserts them as passing.
  Finding M-3.
- **N-F — Leg 2 runs in the marker-less transcript mode.** An unlisted
  consequence of D-plan-26 with three effects the leg does not disclose
  (every human turn `unrecognized_user_entry`; the reconciliation, voiding
  and rebuild paths unexercised; `rebuild_recovered_nothing` on every
  resumed turn). Finding M-4.
- **N-G — `fts_state` is set only on failure, before its table exists.**
  Finding M-5 (D-plan-28).
- **N-H — `recordRegret` at `runIndex` is a hollow call site.** Wired this
  round (Step 30 `modify: indexer.ts`) "so a between-session revert is
  caught" while the plan's revert definition is in-session only and the
  cross-session case is delegated to the miner; the call has a signature
  needing a session and no session. Finding m-1.
- **N-I — The totally-dead detector at `init` fires on the installing
  session.** Finding m-7 (D-plan-25).
- **N-J — Referents moved under unchanged sentences:** Step 28's "single
  undocumented internal verb" beside the `index` verb it now registers
  (m-4); Step 7's `schema_meta` key list without `pinned_interpreter` and
  `index_stale` (m-3); the trace-3 D-plan-5 conclusion naming Step 37 as
  the measurer (m-6).

**Answer-drift block, Steps 21–27, read against AD-9 for elaboration beyond
the safe skeleton (spec §11.5 741–762; arch 736–922):** intake (2883–2886 ↔
arch 747–760 — rule (i)–(iii), the `prompt` field, `'already_open'`
tolerated: identical; the `requireTerminalMark` option is AD-18's "minus the
`?` requirement" for `--missed-question`, 3758–3760, and T-23-1 asserts the
default, 6884–6886); catch-up (2887–2903 ↔ arch 762–788 — markers,
backfill, voiding on an affirmative non-human marker, bookmark over
completed lines: identical, plus the `classified_turns` write, which records
the recognizer's output and changes no verdict); deny decision (2904–2911 ↔
arch 790–804 — main consumer, `open` row, `recognizeMove` over exactly
`Write`/`Edit`/`NotebookEdit`: identical); the hold (2913–2922 ↔ arch
812–826 — identical, no lag estimator); detectors (2988–3018 ↔ arch 819–826,
841–850 — identical, `deny_despite_answer_text` with AD-9's deferral
exclusion); lifetime and backstop (3070–3087 ↔ arch 828–839, 852–867 —
identical); seam (2628–2648 ↔ arch 869–879 — identical). One deviation, on
the clear axis, in the clear direction: AD-9's second condition ("not a
recognized content-free deferral ('I'll get to that'-class)") is realised as
a phrase-strip whose remainder is measured against a two-character floor, so
the class collapses to the bare phrase (S-2). No question-type classifier, no
`Bash` classifier, no per-question clear matcher, no widening of the
deny-eligible set, no acknowledgement lexicon, no clause grammar. The
round-4 hold-direction elaboration is gone; what replaced it under-holds
below the spec's floor.

**Pinned versions and scope:** runtime pins `web-tree-sitter` 0.26.13 and
`tree-sitter-wasms` 0.1.13 (743–744) equal V14 (arch 138); `engines
>=22.16.0` (743) equals AD-2 (arch 327–328); dev pins `typescript` 5.9.3 /
`@types/node` 22.20.1 are D-plan-2's with recorded reasoning and probe 17.
No spec scope element is added or dropped: §2.1 (44–132) reproduces the
architecture's in-scope list (arch 48–75) item for item and §2.2 (134–158)
its deferrals; the thirteen `PA-*` elements map to steps with none unmapped
(186–202). Plan additions since `6a2159b` — `classified_turns` (Step 7),
`001b_phase_a_fts.sql` and `search.ts` (Steps 7, 14), `generate_large_store.ts`
(Step 29), `src/cli/index.ts` at Step 28, `schema_meta.pinned_interpreter`,
`projectTranscriptDir`, the `claude -p` leg — each traces to a round-4
finding and to an architecture requirement (AD-9/AD-17, AD-2, AD-23/AD-24,
AD-12, AD-17/L7, AD-11, AD-24/§11.5), and none reintroduces a rejected
posture: no pre-emptive gate, no generated-file block, no credential, no
in-tree write beyond `init`, no budget.

---

## (c) Round-4 closure tables

Each row re-derived from the current text against the standard the original
finding named, never from the author's table. "Closed in form, then
REGRESSED" means the closure introduced a defect reported in (d).

### (c.1) The 22 round-4 collapse-hunt findings

| Round-4 finding | State now | Evidence (plan lines) |
|---|---|---|
| S-1 — hollow `depends_on`; check blind to consumption by name | **Closed.** Every step's list re-derived (Step 25: `[S1, S12, S21, S22, S23, S24]`; Step 18: eight steps; Step 9: `[S1, S3, S7, S8]`); `provides:` carries exported names at 26 steps; the check resolves bare call-shaped identifiers (`--check` exit 0; consumption walk in (a) D-plan-1 found no edge outside a declared or transitive closure); the Step 9 → Step 11 inversion removed by moving `Trust`/`assertProvenance` to Step 6. | 2878, 2305, 1589, 1204, 1227–1233 |
| S-2 — leg 2 unexecutable; wrong trust sentence | **Closed in form, then REGRESSED.** §11.4 and probe 13 quote the settings-file rule inside its section and attribute the subagent sentence to its own section (verified against the page today); the protocol no longer needs a shared clone. The replacement protocol cites V9 for a shape V9 did not run and omits the scrub and the permission mode → S-1; its transcript mode is undisclosed → M-4. | 5762–5787; 4116–4182; 4841–4869 |
| M-1 — T-3-3 schedule timing-dependent | **Closed.** Observable-forced schedule; probe 07 rebuilt on marker files; reproduces singly and under `--repeat 3 --load 2` here. | 6241–6254; probe 07 |
| M-2 — handler spawns Step 32's verb; T-14-2 stale | **Closed.** `src/cli/index.ts` created and `ctxoracle-index` provided at Step 28; T-14-2 re-derived (no spawn); T-28-5 observes the child by `.reindex.lock`. Residual wording: "the single undocumented internal verb" beside the verbs the step now registers (m-4). | 3129–3132, 3194–3201; 6566–6583; 7140–7157; residual 3163–3166 |
| M-3 — `modify: []` at seven steps | **Closed.** S27 `modify: answer_drift.ts`; S30 `handler.ts`, `indexer.ts`; S31–S35 `dispatch.ts`; §5.1 regenerated. | 3062, 3368, 3453, 3568, 3653, 3746, 3807; 352, 358, 390, 398 |
| M-4 — `large-store` at Step 1 | **Closed.** Store built at Step 29 through migrations and DAOs; T-1-3 covers repositories only; §5.1 has no `large-store` row. | 3299–3308; 6177–6190; 4510–4515 |
| M-5 — four §11.4 entries outrun their probes | **Closed.** Each entry says what its probe prints: 02 (7 lines, 5755–5761 ↔ `expected/02`), 06 (four modes, 5871–5879 ↔ `expected/06`), 10 (5739–5742 ↔ `expected/10`), 15 (three runs + count, 5842–5854 ↔ `expected/15`) — compared line by line. | as cited |
| M-6 — `later` + substring discard + detector exclusion | **Closed in form, then REGRESSED.** Bare words removed; acknowledgement lexicon removed; Step 26 excludes `deferral_only` only. The replacement rule holds only on a bare phrase → S-2. | 1878–1882; 2709–2736; 3001–3005 |
| M-7 — FTS5 fallback unbuildable | **Closed in form, then REGRESSED.** Conditional `001b`, always-created indexes, one `search.ts`, T-7-1 under both flags, T-14-1 same hit set. `fts_state` is set only on failure and before its table exists; nothing sets `'fts5'` → M-5; nothing populates the FTS tables in either revision → M-2 (new). | 1454–1467, 1477–1480, 2030–2036, 3463–3468; 6358–6360, 6562–6564 |
| M-8 — floor sample pools legs | **Closed.** Drawn and reported per leg, leg 2 labelled protocol-driven; the closed-loop lines reported separately. | 4184–4206 |
| m-1 — T-38-25 "Step 1's job" | **Closed.** "the `cold-container` CI job Step 38 adds". | 7762–7763 |
| m-2 — §10A D-plan-13 stale steer | **Closed.** Re-derived. | 5181–5182 |
| m-3 — negation clause untested | **Closed.** Negated negatives and the earlier-clause positive in T-18-8. | 6757–6764 |
| m-4 — T-38-22 no refused-`unshare` branch | **Closed.** T-32-2's condition and branch carried; Q49. | 7726–7729; 8291–8297 |
| m-5 — Step 6 fallback wording | **Closed.** "re-seeds the key from its seed module and records this code". | 1223–1225 |
| m-6 — slug rule; second layout-knowing module | **Closed.** `projectTranscriptDir` in `locate.ts` (realpath, `/`→`-`), `status` calls it; §11.4 observation; Q50. | 2540–2544; 3680–3682; 5905–5913 |
| m-7 — `.sql` delivery | **Closed.** `src/` in the `files` list; resolved from `import.meta.url`. | 747–748; 1481–1485 |
| m-8 — `locate.ts` names wire fields | **Closed.** `locateTranscript(ev)` reads `ev.transcriptPath`; `agent_transcript_path` appears only in the adapter's list and the scan list (grep: 3141, 3154). | 2537–2545 |
| m-9 — detectors read unpersisted per-turn state | **Closed in form, then REGRESSED.** `classified_turns` table, DAO, writer, readers, T-26-1 cross-event case; the write semantics under rebuild are unstated and the default branch silences the handler → M-1. | 1442–1448; 1619; 2894–2897; 2994–3008; 7038–7041 |
| m-10 — replay-tier cost; no CI cache | **Closed.** Rebuilt per job, build time printed by T-29-1, wall time read into the report; no number assumed. | 3305–3308; 4047–4050 |
| m-11 — §16 file-list reconciliation | **Closed.** Item 7. | 8479–8486 |
| m-12 — T-16-1 varies `HEAD` | **Closed.** Varies `ctx.indexStale`. | 6618–6620 |

Closed: 18. Closed in form, then regressed: 4 (S-2 → S-1/M-4; M-6 → S-2;
M-7 → M-5, with M-2 surfacing as new; m-9 → M-1). Residual reported under a
closed row: 1 (M-2 → m-4).

### (c.2) The 20 round-4 expert-review findings (+ T1–T3)

| Round-4 finding | State now | Evidence (plan lines) |
|---|---|---|
| S1 / SY-1 — declarations drop dependencies; check measures a proxy | **Closed.** As (c.1) S-1; the check now resolves consumption by exported name (34 self-checks incl. negative cases), probes assert section-scoped sentences (13) and run under load (07), and `--impact` lists restating surfaces. Of the five proxies SY-1 named, four now measure their property (build order, probe 13's scope, probe 07's determinism, probe 14's tag); the fifth — probe 16 over the author's own case table — is the one that carried S-2 through. | 2878 etc.; probes 07, 13, 14, 16 |
| S2 — Step 28 consumes Step 30's fold/regret; `recordRegret` unwired | **Closed.** Step 28 item 10 defers the fold/regret to "the step that creates them, which declares the edit"; Step 30 declares `modify: handler.ts, indexer.ts` and wires both. The `runIndex` call site is now wired and hollow (m-1). | 3221–3223; 3368, 3383–3386, 3404–3407 |
| S3 — T-14-2 specifies the spawn Step 14 dropped | **Closed.** As (c.1) M-2. | 6566–6583 |
| S4 — acknowledgement lexicon and bare `later` hold on direct answers | **Closed in form, then REGRESSED.** Every one of the twelve direct answers clears (probe 16, executed); the replacement under-holds below FR-B1's floor → S-2. | 2709–2736; probe 16 |
| S5 — inverted trust rule; same-clone premise; transcripts unmoved | **Closed in form, then REGRESSED.** As (c.1) S-2 → S-1, M-4. | 4116–4182 |
| S6 — T-3-3 timing-dependent; probe failed | **Closed.** As (c.1) M-1. | 6241–6254 |
| M1 — detectors read unpersisted turns | **Closed in form, then REGRESSED.** As (c.1) m-9 → M-1. | 1442–1448 |
| M2 — `locate.ts` wire names | **Closed.** As (c.1) m-8. | 2537–2545 |
| M3 — `modify: []` | **Closed.** As (c.1) M-3. | as cited |
| m1 — T-38-25 File line | **Closed.** | 7762–7763 |
| m2 — §7 overview places watchdog/guard at Steps 28–30 | **Closed.** "diagnostics writers with the watchdog and guard" (Steps 1–12) and "watchdog and guard verification" (Steps 28–30). | 689–699 |
| m3 — Step 10 `covers: [PA-5]` only | **Closed.** `[PA-5, PA-9]`; §2.3 row regenerated. | 1680; 197 |
| m4 — T-23-2 "three seeded lists" | **Closed.** "the seeded list, the seeded floor, and a string only". | 6913–6915 |
| m5 — convention text vs narrowed list | **Closed.** "every identifier in the convention list above". | 3227–3231 |
| m6 — negation clause untested | **Closed.** As (c.1) m-3. | 6757–6764 |
| m7 — network policy stated two ways | **Closed.** Step 38 states it once; T-38-25 cites Step 38's. | 4011; 7767–7768 |
| m8 — pinned interpreter unreadable by `status` | **Closed with residual.** `schema_meta.pinned_interpreter` written by `init`, read by `status`, seeded by T-33-1; Step 7's key comment does not list it (m-3). | 3489–3492; 3689–3691; 7342–7343; residual 1346–1348 |
| m9 — plan-chosen lexicon members labelled `architecture_default` | **Closed.** The three command/completion lexicons are `plan_seed`; the one list-valued `architecture_default` key is `index.ext_to_grammar`. | 1882–1895 |
| m10 — slug rule unstated | **Closed.** As (c.1) m-6. | 2540–2544 |
| m11 — Q22 not re-derived | **Closed.** Re-derived from D-plan-26. | 8155–8160 |
| T1 — probe 14 verified `main`, not the tag | **Closed.** Probe 14 fetches the `22/bookworm` Dockerfile at `d073523…` with `NODE_VERSION 22.16.0`; §11.4 and Q45 say what it prints (`expected/14` five lines, matched). | 5987–5999; 8266–8272 |
| T2 — floor executed only on 22.22.2 | **Unchanged, honest.** CI's matrix entry; Q28. | 8183–8187 |
| T3 — `unshare` on the runner | **Closed.** The runner's refusal executed and recorded (run 34151517903); T-32-2/T-38-22 record instead of failing. | 5896–5904; 7304–7308 |

Closed: 17 of 20 (+ T1, T3). Closed in form, then regressed: 3 (S4, S5, M1
— coinciding with (c.1)'s S-2, M-6, m-9). Unchanged and honest: 1 (T2).

**Round-5 closure arithmetic:** all 42 findings were acted on; 35 are closed
against their named standard, 7 closed in form and regressed into S-1, S-2,
M-1, M-4, M-5 (the same seven collapse onto five new findings, since the two
reviews named the same defects).

---

## (d) Findings, severity-ordered

Class legend follows `docs/collapse-log.md`: reduction / wrong-check /
posture / unverified / mechanism-not-mission, plus *fake-completeness
(measurement layer)* and *unbuildable-as-written*. Required changes are
hypotheses the author re-derives, with the evidence that would confirm them.

### S-1 — Leg 2's counted sessions are attributed to V9, a tool-less single-turn invocation, while the protocol needs multi-turn tool-using `Edit`-performing `claude -p --resume` sessions; the two mechanics that make such a session "fresh" and able to edit — the session-identity scrub and the `-p` permission pre-approval — are stated nowhere, and the plan's own §11.4 shows the unscrubbed child reports the parent's session id
- **Class:** unverified premise / unbuildable-as-written (a mission-load-bearing leg: spec §11.5 "on a real repo"; the validity rule hangs on it). **REGRESSION (introduced by the round-4 corrections)** — at `6a2159b:4028–4041` leg 2 was a bootstrap/counted pair of remote sessions; the `claude -p` protocol, D-plan-26's re-derivation, and the V9 attribution are new text.
- **Plan:** 4123–4134 (*"Every counted session is a `claude -p` conversation the implementing agent drives from its own environment — the same invocation shape the model seam verified (V9, Step 36), as a child process of the agent's session, with `CTXORACLE_INTERNAL` absent from the child's environment (the driver prints the child's environment filtered for `CTXORACLE_*` …)"*); 4142–4156 (counted sessions: "`--resume` continues one; a new session id starts the next", "performs at least five tool events including one `Edit`", the L11(b) background task); 4157–4162 (collection by session); 4175–4182 (validity rule: "every counted session's store holds a `SessionStart` liveness row for that session"); D-plan-26 4841–4869 (*"A `claude -p` child of the agent's own session is the invocation the model seam already verified (V9) and needs neither premise"*); §10A 5391–5416; Q43 8252–8261; traces-3:237–241 (the chain's premise: "the invocation the model seam already verified (V9; probe 15 authenticates under the scrub)"); Step 5 1121–1131 (the scrub is an *option* of the oracle's own wrapper, `scrub: true`; the six-variable set); Step 36 3882–3890 (the seam's command is `--tools "" --max-turns <n>`).
- **Contradicting source (1 — the plan's own execution record):** §11.4 5828–5838: the V9 re-run is `claude -p --model claude-haiku-4-5 --tools "" --max-turns 1 --output-format json` and, unscrubbed, returned `"session_id":"f37d10bc-…"` — *"(this session's id)"*; 5839–5854 / `expected/15`: `unscrubbed: … session=parent`, `session-identity scrub: … session=fresh`. Arch V9 (133), V11 (135: `--tools ""` "disables all tools"). Step 39 prescribes no scrub for `exit-run.sh`'s children; the only scrub in the plan is the oracle's wrapper option, which the driver script does not use. A child that reports the parent's `session_id` is not "a fresh session", and whether it appends to the parent's transcript, fires its own `SessionStart`, or writes a liveness row keyed to its own session is unobserved.
- **Contradicting source (2 — the CLI reference, fetched 2026-09-07):** `--allowedTools`: *"Tools that execute without prompting for permission"*; `--permission-mode`: *"Without this flag or `--dangerously-skip-permissions`, a new session starts in the permission mode described in which permission mode a session starts in. For `-p`, that's `default` when nothing is configured"*; `--max-turns`: *"Limit the number of agentic turns (print mode only)"*. A `-p` session cannot show a permission prompt; an `Edit` in `default` mode with no pre-approval does not run. The protocol's "at least one `Edit`" and "five tool events" (4147–4148) therefore depend on a flag the plan never names — and that flag's choice matters to the measurement: `--dangerously-skip-permissions` bypasses the permission system entirely, while a `PreToolUse` deny still applies (the hooks reference: a denied call is denied before permission), so the report must say which posture the counted agent ran under.
- **Contradicting source (3 — standards):** `CLAUDE.md` engineering standard (*"Verify external facts … against current primary sources before building on them"*) and rule 1; collapse-log 2026-07-22 (the validating command must be the design's command — the `--bare` class), which the plan itself cites for D-plan-8 (4601, 5075); `references/output-contract.md` §11 (an executed claim is a probe beside the plan — no probe runs a multi-turn tool-using `-p` session); expert-plan Gate C (no deferred choice: the driver's environment handling and permission posture are choices the implementer must make); Q43's disposition (8252–8261) resolves the trust rule and leaves these two open.
- **Effect:** the leg that produces every block-derived exit number (4218–4223) has no executed evidence that a counted session can exist as specified; run as written, either every child attaches to the agent's own session (no per-session liveness row → the validity rule fails on every run, loudly but by construction — the round-4 S-2 outcome one level down) or, with the scrub applied by an implementer's unstated choice, the `Edit` events the protocol requires are refused by the harness's permission system and the block is never exercised on a mutation.
- **Required change (hypothesis):** state the driver's invocation as a probe beside the plan — the exact `claude -p` command line for a counted turn (the six-variable scrub applied by the driver, the permission flag, `--resume` for turns 2..n, no `--tools ""`, no `--max-turns 1`) — and execute one two-turn session on a prepared clone from the agent's environment, recording the child's `session_id` differing from the parent's, a `SessionStart` liveness row with `source: resume` on turn 2, an `Edit` that ran, and one `PreToolUse` deny; re-derive D-plan-26, §10A and Q43 from that run, citing it instead of V9. Confirm by the probe's recorded expectation carrying those four observables.

### S-2 — The phrase-strip-then-floor clear rule reduces AD-9's "content-free deferral" class to the bare stoplist phrase: "I'll get to that later.", "I'll come back to it.", "I'll get back to you on that.", "Later.", "Not now.", "One moment." all clear; four of the seven stoplist members can never hold; the decision's stated job ("an empty deferral never does") and the trace's scored criterion are false beyond one input
- **Class:** reduction of a spec condition in the clear direction (the task's "any elaboration beyond the skeleton, in either direction"); wrong-check (the probe's case table has no member of the failing class). **REGRESSION (introduced by the round-4 corrections)** — at `6a2159b:2650–2678` the clause carrying a deferral phrase was discarded whole, so every input above was held (the old probe 16 records `"Sure, I'll get to that after the refactor." -> false`); the phrase-strip rule, the reduced stoplist and the D-plan-24 re-derivation are new text.
- **Plan:** Step 12 1878–1882 (*"`lexicon.deferral_stoplist` (`i'll get to that`, `i will get to that`, `i'll come back to`, `i'll get back to you`, `will look into that`, `first let me`, `before i answer` — multi-word phrases of AD-9's 'I'll get to that' class only"*); Step 23 2709–2736 (*"remove every occurrence of a deferral-stoplist phrase … the turn clears when the text that remains, punctuation and whitespace aside, is at least `lengthFloorChars` characters (… the seeded value 2 …)"*); D-plan-24 4806–4827 (*"clear when what remains meets the small floor … the deferral-only turns do not"*); §10A D-plan-24 5350–5369 (job: *"while an empty deferral never does"*); Step 26 3001–3005 (a deny after a `deferral_only` turn "is correct, never a wrongful-deny component"); T-23-2 6893–6921 and T-38-30 7836–7853 (no case of a stoplist phrase plus a trailing word); `16_clear_rule_cases.mjs:8–27` (the reference implementation and its 23 cases); traces-3:103 (`decision_framework`: phrase-strip scored 1 on *"holds on an empty deferral (FR-B1)"*).
- **Executed (the plan's own function, lines 8–17 of probe 16, unmodified, over nineteen further inputs):**

  ```
  "I'll get to that later."          -> true
  "I'll get to that soon."           -> true
  "I'll get to that next."           -> true
  "I'll come back to it."            -> true
  "I'll come back to that."          -> true
  "I'll get back to you on that."    -> true
  "I'll get back to you."            -> false deferral_only
  "Will look into that."             -> false deferral_only
  "I will look into that."           -> false deferral_only
  "Let me look into that first."     -> true
  "First let me finish this."        -> true
  "Before I answer, one sec."        -> true
  "Later."                           -> true
  "Not now."                         -> true
  "One moment."                      -> true
  "Hmm."                             -> true
  "Hm"                               -> true
  "I'll get to that after the refactor." -> true
  "I'll get to that, I'll get to that."  -> false deferral_only
  ```

  The members `i'll come back to`, `first let me`, `before i answer` are prefixes whose every use carries an object or a clause ("…to it", "…finish this", "…, one sec"), so they strip to a remainder above 2 and never hold; `i'll get to that` holds only when it is the whole turn. The hold the rule delivers is: a turn consisting of `I'll get to that`, `I will get to that`, `I'll get back to you`, or `Will look into that` and nothing else.
- **Contradicting source:** spec FR-B1 367–368 (*"A content-free deferral ('I'll get to that') does not clear it; that is the dodge OL-C3 targets"*); FR-B5 439 (*"only an empty deferral fails to clear"* — "I'll get to that later." is empty of content); AC-2a-ii 964 (the same words); arch AD-9 781–782 (*"not a recognized content-free deferral ('I'll get to that'-class)"* — a class); `OWNER-LEDGER.md` OL-C3 (*"the oracle should block that motherfucker until it stops ignoring me and actually answers"*). The plan discloses one escape ("Sure, I'll get to that after the refactor." — a plan-stating turn, which L1 arch 1926–1927 does let clear) and generalises it silently to every deferral that is not verbatim the phrase. D-plan-24's premise that FR-B5's lean makes this the *designed* under-hold conflates two things the spec separates: erring toward clearing on a *substantive* answer, and the empty deferral, which the spec names as the one case that does not clear.
- **Effect:** the block's release condition is a six-word string; on real transcripts the agent that writes "I'll get to that later." — the spec's own dodge with one word — is released, the deny before it is filed as escaped-by-text (4222–4223), and the stoplist mechanism, printed as a `plan_seed` the owner may tune, cannot be tuned into holding because its arithmetic (strip, then measure the remainder) is what defeats it. Not the 2026-09-04 shape (nothing is denied that AD-9 clears); its mirror — a skeleton whose one hold is decorative.
- **Required change (hypothesis):** re-derive "content-free" so that the deferral condition is a predicate on the *turn*, not on the remainder's length — e.g. a turn clears iff, after stripping noise, it carries any token outside the stoplist phrases *and* outside a short closed set of filler the phrase class licenses (temporal adverbs and pronoun objects such as `later`, `soon`, `it`, `that`, `on that`), with the set printed as a `plan_seed` and its miss directions measured as now — or, if the author keeps phrase-strip-then-floor, rewrite D-plan-24's job, §10A answer, and Step 12's stoplist description to say what the rule does (holds on the bare phrase only) and drop the members that cannot hold; in both cases add the nineteen inputs above to T-23-2 and probe 16 with the class each belongs to. Confirm by the probe's expectation carrying `"I'll get to that later." -> false (deferral_only)` under the first hypothesis, or by D-plan-24 no longer claiming "an empty deferral never does" under the second.

### M-1 — `classified_turns` has `PRIMARY KEY(consumer, uuid)` and the catch-up "records every classified turn"; the `resume`/`fork`/`compact` rebuild re-classifies turns already recorded for the same consumer; the DAO's write semantics are unstated, and a plain `INSERT` throws on the first rebuild, silencing the handler for the rest of the session under AD-7
- **Class:** unbuildable-as-written (a deferred choice whose default branch disables the block); the AD-1 fresh-process premise applied one table short. **REGRESSION (introduced by the round-4 corrections)** — the table, DAO, writer and readers are D-plan-27, new text.
- **Plan:** 1442–1448 (DDL, `PRIMARY KEY(consumer, uuid)`); 1619 (DAO: `record(consumer, uuid, ts, clears, reason)`, no upsert/ignore semantics; 1625 "No DAO does business logic; they wrap statements"); 2894–2897 (*"every classified turn is recorded"*); 3070–3074 (Step 27: `resume`/`fork`/`compact` → *"bookmark reset to offset 0 so the next catch-up rebuilds qa-state from the transcript"*); 3189–3190 (consumer = `(session_id, agent_id | 'main')` — a resumed session keeps its id); 3224–3225 (*"any error or watchdog fire ⇒ empty output + JSONL fault, no deny, no whisper"*); D-plan-27 4870–4885; T-27-1 7052–7063 and T-38-8 7538–7549 (fresh stores; no case rebuilds over previously-recorded rows).
- **Contradicting source:** hooks reference (fetched 2026-09-07, "Add context for Claude"): *"SessionStart hooks run again on resume with source set to 'resume'"*; arch AD-9 852–867 (the rebuild is the designed path for `resume`/`fork`/`compact`); AD-7 (692–700: every failure path is silent); `OL-10` (a capability going dark must be announced — here the block goes dark with a `store` fault per event and no deny ever again); expert-plan Step 8 ("Name the functions" — the write's conflict behaviour is the function's whole meaning here); testing-standards ("every test must be able to fail" — no test rebuilds over a populated `classified_turns`).
- **Effect:** on the first `SessionStart {source: resume}` of any real session (and on every `--resume` turn of leg 2, S-1), the rebuild's first previously-seen assistant turn raises `SQLITE_CONSTRAINT`; the event goes silent, the bookmark never advances past 0, and every subsequent event's catch-up re-throws before the block check — no deny, no whisper, for the remainder of the session, with the fault channel reporting a store error the owner reads as corruption. Both fixture tests pass because they start empty.
- **Required change (hypothesis):** state `record` as idempotent for a repeated `(consumer, uuid)` — `INSERT … ON CONFLICT DO UPDATE` (a re-classification may legitimately change `clears`/`reason` if the lists were tuned between events) or `ON CONFLICT DO NOTHING` (the first classification stands) — and say which and why; add a T-27-1 case that rebuilds over a store already holding the transcript's rows, asserting no fault and the same final state. Confirm by that case passing on a plain-`INSERT` implementation only after the conflict clause is added.

### M-2 — No step writes a row into `fts_symbols` or `fts_paths`; on an FTS5 runtime the `MATCH` path answers nothing, Orientation and Reuse are silent, and T-14-1's "same hit set under both flags" cannot pass without an unplanned writer
- **Class:** unbuildable-as-written (the load-bearing writer is absent); the D-plan-28 shape makes it visible. Not a regression — `6a2159b:1984–2000` lists the same `runIndex` outputs without an FTS write — **new** (present at `6a2159b`, unreported; the round-4 M-7 finding attributed an FTS write to Step 14 that the text does not contain).
- **Plan:** Step 14 2042–2054 (`runIndex` writes `files`, `symbols`, `import_edges`, `symbol_refs`, `entry_score`, `test_map`, `index_head` — no FTS table); 2030–2036 (`search.ts` reads `MATCH` over `fts_symbols`/`fts_paths` when `'fts5'`); Step 15 2132–2134 (*"path-and-word tokenization into FTS"* — a sentence about a frontend whose interface, 2024–2028, returns `{symbols, imports}` only); Step 18 2318–2320, 2327–2328 (Orientation and Reuse query the interface); T-14-1 6562–6564 (*"the whole run repeated on a store migrated with `fts: false` — `symbolSearch` and `pathSearch` return a different hit set than under `fts: true`"* fails); D-plan-28 4886–4903 (no writer named); Step 7 1463–1466 (the tables are standalone FTS5 tables — not external-content over `symbols`/`files` — so nothing populates them implicitly).
- **Contradicting source:** arch AD-12 1001–1012 (`ctxoracle index` "builds: `files` …, `symbols`, `import_edges`, `symbol_refs`, `entry_score`, `test_map`, **FTS5 tables**"); AD-15 1142 (Orientation: "prompt tokens → FTS5 over symbols/paths"); expert-plan Step 8 (name the writer); Gate C (a deferred choice — where FTS rows are inserted, on which frontends' output, and how deletions cascade into a virtual table that `ON DELETE CASCADE` cannot reach).
- **Effect:** the FTS5 path — the one every exit-run machine takes (V7) — has no data; either both search paths return the LIKE-path's hits (if the implementer silently ignores `fts_state`) or the FTS path returns nothing and Orientation/Reuse never fire on the owner's repos, which the exit report would print as an honest-looking floor.
- **Required change (hypothesis):** name the FTS writer in Step 14 (`runIndex` inserts one `fts_symbols` row per symbol and one `fts_paths` row per file after the relational writes, under `fts_state = 'fts5'`; deletions and content-hash refreshes delete the matching FTS rows explicitly, since cascade does not reach a virtual table), make the frontend sentence at 2134 say what the generic frontend contributes (words for the path/word tokens the indexer inserts), and let T-14-1's flag-equality case seed a store on which the FTS path demonstrably has rows (assert `fts_symbols` row count equals `symbols` row count under `fts: true`). Confirm by that count assertion.

### M-3 — `grammar_inventory_check` (T-38-33) and `marker_presence`'s self-test (T-38-32) live under `test/build_time/`, which no runner, CI job, or script entry executes; Checkpoint 4 asserts both as passing
- **Class:** cannot-run-where-placed (a Verification with no invoker); the L6 build-time check reduced to a file. **New** (present at `6a2159b:3899, 3948, 4275, 7592`, unreported).
- **Plan:** 787–798 (`run-tests.mjs` enumerates `dist/test/unit`, `dist/test/build`, `dist/test/conventions`, and with `--replay` `dist/test/replay` — nothing under `build_time`, and the two files are not `*.test.ts`); 3996–4006 (the two scripts); 3983, 4007–4013 (Step 38's only workflow edit is the `cold-container` job); 4042–4047 (Checkpoint 4: *"`grammar_inventory_check` passes for the default table (`T-38-33`); `marker_presence` passes its self-test (`T-38-32`)"*); 4387–4388; T-38-32 7873–7887 (*"executed by Step 39 over the replay corpus; its self-test runs against `test/replay/transcript_fixtures/`"* — the self-test's invoker is unnamed); T-38-33 7889–7898 (no invoker at all); §12 6132–6135 (tests run through `run-tests.mjs` or `--replay` — neither reaches these).
- **Contradicting source:** arch L6 1955–1961 (the grammar inventory *"is checked at build (`npm pack --dry-run` + a loaded-grammar smoke test)"*); AD-24 1603–1609 (build-time verifications "resolved … before the block's fixtures are trusted"); expert-plan Step 8 (a Verification names something the implementer can run); D-plan-3's own job ("make every 'Fails when' clause a real red run").
- **Effect:** the L6 verification — the one that tells the owner which of his languages fall to the generic frontend before the exit run — is a file that compiles and is never executed by anything the plan schedules; Checkpoint 4's "passes" has no command behind it.
- **Required change (hypothesis):** give both a runner — a `"verify:build-time"` script entry the `test` CI job runs after `--replay`, or fold the self-test into `test/replay/` as a `.test.ts` and make `grammar_inventory_check` a replay test that loads every default grammar — and name it in Checkpoint 4 and in the two §12 entries' File fields. Confirm by `--check` accepting the new script as a provided name and by Checkpoint 4 naming the command.

### M-4 — Leg 2's `claude -p` sessions are the transcript mode V12 measured as marker-less; the leg does not disclose that every human turn is `unrecognized_user_entry`, that the reconciliation, voiding and rebuild paths are structurally unexercised there, that `rebuild_recovered_nothing` fires on every `--resume` turn, and that its corpus has no declared origin mode
- **Class:** fake-completeness (measurement layer) by omission — a leg presented as "the measurement of the block on the owner's code" runs in a mode whose transcript-side machinery cannot operate; a premise of the re-derived D-plan-26 not carried into its consequences. **REGRESSION (introduced by the round-4 corrections)** — the `claude -p` leg is new text.
- **Plan:** 4123–4162 (the leg); 4224–4228 (the marker table "by declared corpus origin, with L11(a) stated as *verified* only when a corpus declared `owner-local/interactive` holds at least one transcript and otherwise *not observed*"); 4100–4104 (the two named origins); D-plan-11 5145–5147 (*"a remote-container corpus is the mode already measured"* — leg 2's `-p` corpus is a third mode); Step 21 2556–2561 (marker-absent user entry → `unknown_shape` → `unrecognized_user_entry`); Step 27 3073–3077 (rebuild; `rebuild_recovered_nothing` when a non-empty transcript yields zero human turns and `unrecognized_user_entry` diagnostics); T-38-2 7458–7468 (backfill — the property leg 2 cannot exercise).
- **Contradicting source:** arch V12 136 (*"a `claude -p` probe transcript whose genuine user prompts carry no `origin` and no `isMeta` at all (2 of 2)"*); L11 2008–2017 (the rebuild path "may recover nothing in marker-less modes; that failure is loud"); hooks reference (fetched 2026-09-07): *"SessionStart hooks run again on resume with source set to 'resume'"* — each counted turn is a resume, so each fires the rebuild; `CLAUDE.md` rule 1 (say what is unverified); spec §11.5 (the exit is a measurement on the owner's transcripts — leg 2's are the agent's, in a mode the owner's interactive sessions do not use).
- **Effect:** the report's leg-2 fault channel carries one `rebuild_recovered_nothing` and one `unrecognized_user_entry` per turn by construction, indistinguishable from L11(a)'s "loud failure"; the voiding guard (the L11(b) induction's observable) cannot fire in a mode where no turn carries a marker; the marker table for leg 2 is all-zero and, with no declared mode, either "origin unknown" or mislabelled `remote-container`; a reader of the report who does not know V12 reads a broken reader, not a known mode.
- **Required change (hypothesis):** state in Step 39 that leg 2 runs in the marker-less mode, declare its corpus as `report-machine/claude-p` (a third `<mode>`), list which block paths leg 2 exercises (intake, clear, deny, hold, the three deny-health detectors, the escape fraction) and which it cannot (reconciliation/backfill, voiding, rebuild recovery — leg 1's and the owner's sessions carry those), and have the report suppress or label the per-turn `rebuild_recovered_nothing` as expected in that mode. Confirm by the report template carrying the mode and the two lists.

### M-5 — `fts_state` is written only on probe failure and "before the migrations run" on a fresh store that has no `schema_meta` yet; nothing writes `'fts5'` on success, though `search.ts` and the runner both key on it; the runner's skip condition is stated two ways
- **Class:** unbuildable-as-written (ordering and an unset key on the main path). **REGRESSION (introduced by the round-4 corrections)** — D-plan-28 and its Step 7/31 text are new.
- **Plan:** 3463–3468 (*"on a failed probe record `schema_meta.fts_state = 'fallback'` before the migrations run, so `applyMigrations(store, {fts: false})` skips the FTS migration"*); 1454–1459 (the runner applies 001b *"only when `schema_meta.fts_state = 'fts5'`"*); 1477–1480 (the runner skips a `_fts` migration *"when `fts` is false"* — a flag, not the key); 2032–2035 (`search.ts` chooses *"by `schema_meta.fts_state` at call time"*); 3476–3477 (`init` applies "001b when `fts_state` is `'fts5'`"); grep over the plan: `fts_state` read at 1347, 1457, 1462, 2032, 3477, 4887, 4891, 8307 and written at 3465 only; T-7-1 6358–6360 (drives the runner by flag on an empty DB — cannot reproduce `init`'s stated sequence).
- **Contradicting source:** the plan's own Step 7 DDL (1345: `schema_meta` is created by 001); arch AD-2 337–341 (the probe decides the path and `status` says so — a state that must be recorded on both outcomes); expert-plan Gate C (the setter and the ordering are deferred choices).
- **Effect:** on the FTS5 path `fts_state` is null; `search.ts`'s call-time choice has no defined branch for null; on the fallback path `init`'s first write targets a table that does not exist; `status`'s "FTS5 state" line (3664) reads a key nobody sets on the common path.
- **Required change (hypothesis):** let the runner own the key — `applyMigrations(store, {fts})` writes `fts_state` (`'fts5'` after applying 001b, `'fallback'` when skipping it) after 001 has created `schema_meta`, and `init` passes only the probe's boolean; state that `search.ts` treats a null as `'fallback'` or as a `store_corrupt`-class fault, and say which; extend T-7-1 to assert the key's value under both flags. Confirm by T-7-1's assertion and by the grep showing exactly one writer.

### m-1 — `recordRegret(store, session)` is wired at the end of `runIndex` "so a between-session revert is caught", but `runIndex` has no session, the plan's revert definition is in-session only, and the cross-session case is delegated to the miner's `revert_chain`
- **Class:** hollow mechanism (a call site with no defined population) / deferred choice. Not a regression (`6a2159b:3320–3321` carried the sentence; this round wired it).
- **Plan:** 3388–3407 (population: churn "in the session"; reverted = "a hash the path held earlier in the session (… the cross-session case is the miner's `revert_chain` class, Step 13)"; then "the end of `runIndex` … so a between-session revert is caught"); 3368 (`modify: indexer.ts`); arch AD-18 1301–1302 (the run point exists; the proxy's definition is the architect's).
- **Required change (hypothesis):** either define what the index-time call evaluates (e.g. every session with a `SessionEnd` row since the last `runIndex`, against the working tree's current hashes) or drop the call site and the sentence, leaving the `revert_chain` delegation as the cross-session answer. Confirm by T-30-1 carrying an index-time case or by the sentence's removal.

### m-2 — The seeded floor of 2 holds a one-character direct answer ("y", "n", "7"); the plan's "rejects an empty or one-mark turn and nothing else" is false, and `deny_despite_answer_text` can therefore fire only on a ≤1-character turn
- **Class:** counts/claims drifting from arithmetic. Not a regression (`6a2159b` made the same claim).
- **Plan:** 1864; 2716–2717; §10A D-plan-7 5050–5052 (*"the floor excludes emptiness and nothing else"*); T-38-6 7519–7520 (*"a floor−1-character real answer"* — one character); spec FR-B5 439.
- **Required change:** state the floor's true reach (content length ≥ 2 — a one-character answer is held and the detector's induction is a one-character turn), or seed 1 and re-derive the "empty or one-mark" sentence; add "y" / "n" to T-23-2 with their class.

### m-3 — Step 7's `schema_meta` key comment omits `pinned_interpreter` and `index_stale`, both written elsewhere
- **Class:** referent moved under an unchanged sentence. **REGRESSION (introduced by the round-4 corrections)** for `pinned_interpreter` (the ER m8 closure added the key at 3489–3492 without re-deriving the comment); `index_stale` (2058–2059) pre-existing.
- **Plan:** 1346–1348 vs 3489–3492, 2058–2059, 3689–3691.
- **Required change:** list both keys in the comment.

### m-4 — Step 28 still says `dispatch.ts` carries "at this step, the single undocumented internal verb `hook …`" while the same step registers the documented `index` verb and the internal `hook integrity-check`
- **Class:** sentence left beside a moved fact. **REGRESSION (introduced by the round-4 corrections)** — the `index` verb moved to Step 28 this round (3196–3198; 3132); the sentence is `6a2159b` text.
- **Plan:** 3163–3166 vs 3194–3201, 3233–3238, 3240.
- **Required change:** "with, at this step, the internal verbs `hook <event> [--deadline-ms <n>]` and `hook integrity-check`, and the `index [--full]` verb".

### m-5 — `test/replay/hook_stream_fixtures/` is declared created by S38 while its first files are authored with Step 28's replay tests and every Step 29–35 replay
- **Class:** false declaration (the round-4 M-3 class, one directory over). Not a regression (`6a2159b:510` same).
- **Plan:** §5.1 517 and 3982 (S38 `create:`) vs 3173–3175 (*"one file per replaying test, authored with that test"*), T-28-1/3/4/5, T-29-1, T-30-1, T-34-2.
- **Required change:** declare the directory at Step 28 (its first author) and let Step 38 `modify:` it, or declare it at Step 1 with the transcript fixtures.

### m-6 — The trace-3 D-plan-5 chain concludes "Step 37 measures and reports its build time"; the plan assigns the measurement to T-29-1 and Step 38, contradicting §10's rule that the latest file's chain is the one whose conclusion appears
- **Class:** attestation vs artifact. **REGRESSION (introduced by the round-4 corrections)** — the chain and the amendment are new.
- **Plan:** 4418–4421 vs `2026-09-07-plan-tool-traces-3.md:613–617`; 3305–3308; 4047–4050.
- **Required change:** re-derive one from the other and say which step measures.

### m-7 — The totally-dead `hooks_not_firing` detector runs at `init` and fires on the session running `init` (a transcript under the repository's slug, newer than the gap, with no liveness row), writing a false fault at install on the commonest agent-led path
- **Class:** wrong-check (a detector whose first run is its own false positive). Recurring — the round-4 collapse-hunt's D-plan-25 note named the pre-`init` live session; the §10A answer covers only the older-than-gap case.
- **Plan:** 3680–3688 (*"or present when no liveness row exists at all … run at `status`, `init`, and `index`"*); §10A D-plan-25 5379–5386; Step 39 4136–4141 (the agent runs `init`); `OWNER-LEDGER.md` OL-11.
- **Required change (hypothesis):** exclude from the totally-dead half any transcript whose first entry predates the newest liveness row *or* the store's creation time (`init` records it), so a session live at install is not a dead wiring; keep the detector for transcripts that *start* after `init`. Confirm by a T-33-4 case (d): a transcript created before `init` and still growing is not flagged.

### m-8 — Step 28's pipeline says "the path-write predicate sets `path`" on Bash rows, but the predicate exists only inside Step 26's `checkDenyBypassSuspect(store, consumer, postToolUseBashRow)`, which takes a row that already carries `path`; no exported predicate is provided
- **Class:** deferred choice (which module computes `path` at append time). Not a regression.
- **Plan:** 3207–3210 vs 3009–3014, 2982 (`provides: []`).
- **Required change:** export `pathWriteTarget(command): string | null` from Step 26 (or Step 17, beside the classifier) and name it in Step 28's item 8.

---

## (e) Verdict

**DOES NOT SURVIVE.** 2 Serious, 5 Moderate, 8 Minor (15 findings). Eight
are REGRESSION-tagged — S-1, S-2, M-1, M-4, M-5, m-3, m-4, m-6 — each with the
`6a2159b` passage (or its absence) and the mechanism named; two are new
(present at `6a2159b`, unreported: M-2, M-3); one recurs (m-7); four are new
pre-existing minors (m-1, m-2, m-5, m-8). Of the 28 §10A decisions: 0
collapse, 4 partially collapse (D-plan-24, D-plan-26, D-plan-27, D-plan-28),
24 survive (D-plan-5, 7, 10, 11, 14, 25 with notes; the rest clean).

**Round-5 arithmetic.** Closed: 42 of 42 acted on — 35 closed against their
named standard, 7 closed in form and regressed (collapsing onto five new
findings). New + regression this round: 15 (8 regression, 7 new/recurring).
Against the expert-review series' tripwire as the author states it (fires if
new + regression ≥ closed, or total ≥ 20): 15 < 42 and 15 < 20 — does not
fire. Against the owner's rule (a correction-induced count above zero means
the second replacement did not hold): 8 > 0 — the count is stated; the rule's
consequence is the owner's. The shape has changed: no regression this round
is in the class the skill copy's checks cover; all eight sit in reasoning the
author marked as reasoned rather than reconciled (self-check §3), and the two
Serious ones share one mechanism — a re-derivation validated against
evidence the author chose (a case table; a premise that ran a different
command) rather than against the input class that fails it.

**What I could not check, and why.** (1) Whether a `claude -p` child with
the six-variable scrub, tools enabled and a permission flag, on a prepared
clone, fires `SessionStart` with its own session id and honours a
`PreToolUse` deny on `Edit` — no counted session was created (creating one
requires the tool the plan builds; the finding asks the author for the
probe). (2) The `-p` transcript's marker shape beyond V12's two-prompt
observation (M-4 rests on the architecture's own measurement, not a new
one). (3) Behaviour at the Node 22.16.0 floor (only v22.22.2 here, as in
rounds 2–4). (4) The reasoning quality of the first two trace files beyond
their label coverage (confirmed by grep against §10's claim). (5) Whether
the ≈400 MB `large-store` builds in a time CI tolerates (the plan defers it
to measurement; accepted). Every other claim above rests on a read at the
cited lines or on an execution whose command and output are recorded.
Nothing rests on the author's round-5 self-check; where it and the source
disagree — "phrase-strip-then-floor … `probe:16` (23 cases)" as the closure
of ER S4/CH M-6 (the 23 cases contain no member of the class that fails),
"leg 2 names the session kind, the driver, the setup step" as the closure of
ER S5/CH S-2 (it names no scrub and no permission posture), and
"`classified_turns` … written by Step 25's catch-up" as the closure of ER
M1/CH m-9 (written with what conflict semantics is unstated) — the source
was used.
