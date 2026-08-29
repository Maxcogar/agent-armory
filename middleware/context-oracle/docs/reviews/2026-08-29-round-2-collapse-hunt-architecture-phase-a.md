# Independent collapse-hunt, round 2 — Phase A architecture (2026-08-29)

**Artifact:** `docs/architecture-phase-a.md` as revised 2026-08-29 (commit `b54ba29`;
repairs verified against `git diff e2bfdd5..b54ba29`).
**Axis:** mission-fidelity only. Reviewer is not the author. Read in full, in order,
before the attack: `docs/collapse-log.md`, `OWNER-LEDGER.md`,
`docs/specs/spec-context-oracle.md`, both round-1 reviews
(`2026-08-29-collapse-hunt-…`, `2026-08-29-expert-review-…`), then the revised
architecture, every line, plus the full repair diff.
**Method:** per the collapse-log's standing lesson, this round attacked **the
round-1 repairs as the new collapse surface** ("the fix for a finding is where the
next finding is created"), then re-traced the genres/blocks round 1 found broken,
starting each trace from the spec's own enumerated criteria (P1–P9, FR-A2a–g/l,
§8's block properties, §14's Phase A set) — not from round 1's findings. Every
finding below is grounded in document/spec/ledger text; where a finding turns on
an external contract fact this session did not verify, the finding says so and is
framed as an unverified load-bearing premise, not as an asserted contract fact.

## Verdict: DOES NOT SURVIVE

- **Collapses: 6** (C1–C6)
- **Partial collapses: 4** (P1–P4)
- **Survived with note: 6** (N1–N6)

The repairs are real work: every round-1 finding was applied (the closing
attestation was enumerated against both round-1 files and holds), the phase
boundary stays honest, and the plumbing-level §8 property walk still passes. But
five of the six collapses live **inside or between the repairs themselves** —
the exact recurrence the collapse-log predicts. The dominant shape this round:
**a repair that fixed the named axis of a finding while quietly foreclosing the
mission-need on an adjacent axis, with the disclosure covering only the named
axis** (C1, C4, P2 — the 2026-08-25 "honest-limits has layers" lesson, three more
times), plus two load-bearing premises asserted rather than verified inside
repairs (C3, C6) and one schema guard that rejects the spec's own recourse (C5).

---

## Collapses

### C1 — The request-form intake exclusion silently kills tracking, the FR-M4 recourse counter, and the AC-8a backstop for the dominant ask form — and the disclosure justifies only the deny half

**Where:** AD-9 intake clause (iv) (the S2/P3 repair) × the AC-8a backstop and
FR-M4 counter (the C2 repair) × L1 × spec FR-B4/FR-M4 × OL-C3/OL-C5.

**Collapse question:** *Max asks "can you fix the login bug?" and the agent's
next move is unrelated other work — OL-C5's confirmed definition verbatim ("if i
ask a question and their next move isnt a direct answer or them taking actions to
provide an answer, then then need corrected"). The agent later claims done
without fixing or answering, and Max reads `status`. Name the row, counter, or
line — anywhere in Phase A — that records this.*

**Why the document's answer fails:** there is none. Clause (iv) excludes
request-form interrogatives from **intake entirely**, so no `questions` row ever
exists: no deny (spec-licensed — see below), but also **no AC-8a
outstanding-question line, no FR-M4 done-claims-with-outstanding-question count,
no Phase A exit measurement of the miss class, and nothing for Phase B's state
writer to inherit**. The spec's stated mission-need for that counter is precise:
*"the 'Max re-asks' recourse for an uncaught answer-drift case is actually
reachable"* because *"he cannot re-ask what he does not know was dropped"*
(FR-B4/FR-M4). Request-form asks are — as round 1's own S2/P3 established — the
**dominant** phrasing of Max's asks to agents, so the recourse machinery is
structurally blind precisely where the recourse is most needed.

Now the layered-disclosure failure. The deny-coverage loss is genuinely
spec-licensed (§11.5/D-41: Phase A's recognizer "errs hard toward not-firing";
FR-B5's under-fire lean). But the repair chose the broader of the two options the
round-1 reviews offered — S2 offered "exclude at intake" **or** "condition the
deny so a lone open request-question cannot deny the requested mutation" — and
the second option preserves tracking at zero wrongful-deny cost. L1's
justification, *"enforced not at all in Phase A, since denying the requested
action would deny the answer path,"* justifies **not denying**; it is a
non-sequitur for **not tracking**, which denies nothing. And AD-9's counter
paragraph — the C2 repair — sells the redefined counter as *"the honest Phase A
approximation of 'plausibly died unanswered'"* with a `status` label enumerating
its structural limits ("blanket-cleared earlier in the session is not counted")
— while staying silent on this larger blind spot that a sibling repair created.
That is C2's own failure shape recurring one level down: the label installed so
absence of measurement is never displayed as health itself hides the bigger
absence. Two repairs interacting badly, exactly as the collapse-log's
"between decisions" lesson predicts.

**Class:** reduction (an owner-confirmed requirement's reach narrowed by a
repair) + mechanism-not-mission (the justification describes the deny machinery,
not the recourse need it forecloses).

**Repair:** track, don't deny. Intake opens request-form interrogatives as
**deny-ineligible** rows (e.g. `kind CHECK(kind IN ('info','request'))` on
`questions`; the deny decision consumes only `kind='info'` rows — one predicate,
structurally testable under AD-10's confinement). Request rows feed the AC-8a
line, the FR-M4 counter (labelled), Phase A exit measurement, and Phase B's
inherited state. Update L1 to own the residual honestly (the *clear* recognizer
still blanket-clears request rows; that limit transfers) and extend the counter's
`status` label to name both blind spots.

### C2 — "An open deny-capable question is an information-seeking one **by the intake rule** (not by assumption)" is falsified by the same document: AD-18's `--missed-question` opens deny-capable state with no recognizer at all

**Where:** AD-9 deny rationale (the repaired sentence that replaced round-1 S2's
false "by construction" claim) × AD-18 (`ctxoracle correct --missed-question`) ×
T2's intake enumeration.

**Collapse question:** *AD-18: a `missed` verdict "opens the question state
directly, so the identical deviation is thereafter denied." Max's likeliest
noticed miss is a request-form ask — the class the design itself excludes as the
dominant phrasing. Max runs `ctxoracle correct --missed-question "can you fix
the login bug?"`. What does the block now do to the agent's `Edit` that fixes
the login bug?*

**Why the document's answer fails:** it denies it — "answer Max's question
first" against the exact move the design's own clause (iv) rationale says must
never be denied ("the requested action *is* the answer path... opening
deny-capable state for them would deny exactly the move `OL-C5` protects"). The
repaired rationale sentence — *"an open deny-capable question is an
information-seeking one by the intake rule (not by assumption)"* — is therefore
false as written: the intake rule is not the only opener. AD-18 bypasses clauses
(i)–(iv) entirely, and the human most likely to use `--missed-question` is
reporting exactly the class intake excludes (that exclusion is *why* the miss
happened). This is round-1 S2's failure shape — a "true by construction" claim
whose construction has an unexamined second producer — recreated by the repair
one decision away, in the between-decisions gap the collapse test per-decision
cannot see. Secondary: T2's hardened sentence *"a question can be opened **only**
by text that arrived as the user's own `UserPromptSubmit` prompt or as a
transcript entry carrying the human markers"* is also false as written (the CLI
opener is a third path — harmless to T2's actor model since it is Max at his own
terminal, but "only" is an enumeration and the enumeration is wrong).

**Class:** unverified (a false by-construction claim inside the repair for a
false by-construction claim), between-decisions.

**Repair:** route `--missed-question` text through the same intake recognizer
(minus the `?` requirement — Max may paraphrase): a request-form correction
opens a `kind='request'` row (C1's repair), a plain question opens
`kind='info'`. Tell Max in the CLI output which kind was recorded and what it
will do. Rewrite the rationale sentence to name every opener and the invariant
that actually holds ("deny-capable rows are opened only by the info-question
recognizer, at intake, at catch-up, or via correction"). Fix T2's "only"
enumeration.

### C3 — Prompt-field intake equates the `UserPromptSubmit` `prompt` field with "the user's own text" — an unverified security premise, on a platform the document's own V12 proves synthesizes user turns

**Where:** AD-9 question intake (the P2/M3 repair) × T2's rewritten conclusion ×
V5 × AD-24's fixture set.

**Collapse question:** *V12's histogram proves this platform synthesizes
`type:"user"` turns whose text is partly authored outside the machine (5 of 8
string-content user entries were task notifications; 2 were hook output), and
the S1 repair therefore gates the transcript door on markers. The new intake
door — the `UserPromptSubmit` `prompt` field — carries no markers. Which
verification establishes that platform-delivered turns (task notifications,
scheduled-wake messages, programmatic prompt submissions) never fire
`UserPromptSubmit`?*

**Why the document's answer fails:** none exists. V5 verifies that the event
*carries* a `prompt` field — nothing about **who can trigger the event**. Yet
T2's rewritten conclusion does load-bearing security work on exactly that
premise: *"a question can be opened only by text that arrived as **the user's
own** `UserPromptSubmit` prompt…"* — "the user's own" is asserted, not
established. If any synthesized turn class fires the hook (this platform
delivers scheduled wakes and notifications *as ordinary user turns*; whether
they pass through `UserPromptSubmit` is precisely the unknown), question-shaped
externally-influenced text opens deny-capable state and drives wrongful denies —
the T1×T2 injection-into-the-deny-path surface S1 closed at the transcript
boundary, reopened by the repair at a boundary where the marker discipline
**cannot run** (the hook input has no `origin.kind`/`isMeta`). The AD-24 fixture
set inherits the blindness: it plants question-shaped text in hook-feedback and
task-notification **transcript entries** and asserts no question opens — testing
the door S1 already closed — while the replay harness streams only the hook
events the designer *believes* the harness emits, so it structurally cannot
falsify the intake-door premise. That is the wrong-check trap: the fixture
passes while the property is unestablished.

**Class:** unverified (a load-bearing security premise inside a repair), with
the round-1 S1 shape inverted (the converse assumption moved to a new boundary).

**Repair:** (1) verify against the current contract and by live induction (fire
a scheduled wake / task notification in a hooked session; observe whether
`UserPromptSubmit` fires — one experiment). (2) Whatever the answer, make the
design robust rather than premise-dependent: an intake-opened row is
provisional until reconciliation; if catch-up matches its `content_hash` to a
transcript entry that is **not** a marker-carrying human turn, the row is
voided (status `expired`, diagnostic recorded) — the wrongful-deny window is
then bounded by one catch-up even if the premise fails. (3) Restate T2 to claim
what the mechanism then guarantees (synthetic-sourced rows self-void within one
event) instead of "the user's own" as an assumption.

### C4 — The restated Reuse headline is a fact one grep returns: the repair traded a false claim for a P5-violating one, and pinning AC-1b to the restatement is the criterion redefined to fit the mechanism

**Where:** AD-15 Reuse row + AD-12 `symbol_refs` (the C1 repair) × spec P5 /
FR-A2c / AC-1b × AD-14's marginal-value axis.

**Collapse question:** *Spec P5, verbatim: "a fact one `grep` returns is not a
whisper." The restated headline is "the canonical helper is X; N files reference
it," where N = count of importing files whose text matches X's identifier.
`grep -rl '\bX\b' | wc -l` is one command. What does the whisper deliver that
the agent's own grep does not — and where is the computation of "canonical"?*

**Why the document's answer fails:** the count's only refinement over the
agent's one grep is the restriction to importing files — a small correction to
N, not a different kind of fact. The spec's FR-A2c headline was comparative —
"the canonical helper is X; **most call sites use it**": canonical-ness is X's
dominance **over alternatives**, which is genuinely non-self-servable (the agent
would have to enumerate the alternatives first). The repair, unable to compute
per-call-site counts (round-1 C1, correctly found), restated the headline to
what `symbol_refs` holds — and landed on the grep-equivalent absolute count,
while the whisper text still leads with "the canonical helper is X" and **no
stated rule computes "canonical"** (comparison set? dominance threshold? — the
2026-07-30 tell: a named hard part with no producer). Three corroborating
document facts: (a) FR-A2d explicitly bans the sibling fact ("a raw call-site
count is grep-able and never stands alone"); (b) AD-14's marginal-value axis
defines only two classes — single-file current-state (fails) and cross-file
history-derived (passes) — and Reuse facts are **cross-file current-state**,
so the bar's third conjunct is *undefined for this genre's own fact class*:
the generator's "marginal-value guarantee" column asserts what the bar cannot
compute; (c) AC-1b's fixture is now "pinned to the restated headline" — round
1 warned that the criterion could only pass "by a fixture that quietly
redefines the headline," and the repair did exactly that, with round-1's own
repair text as license. The mission question — does this change the agent's
next decision in a way it could not cheaply self-serve? — now fails for the
genre as specified.

**Class:** reduction (mission requirement narrowed to schema reach) +
wrong-check (acceptance fixture pinned to the reduced claim).

**Repair:** make the headline the **comparative** fact `symbol_refs` *can*
compute, and state the rule: among the symbols matched by the agent's search
(the FTS candidate set), X is canonical when its referencing-file count
dominates the alternatives (e.g. ≥ k× the runner-up, tunable, stored) — headline
"of the N candidates for this functionality, X is the one M files use; the
others have ≤ m" with the candidate set named. That fact requires enumerating
and comparing alternatives — not one grep — and restores FR-A2c's convention
substance. Define the marginal-value axis for cross-file current-state facts in
AD-14 (pass only when comparative/aggregative over a set the agent has not
enumerated). Pin AC-1b to the comparative form, and surface the
identifier-match false-positive class (same-name symbols, comments, strings) in
the whisper's stated evidence and in Limitations.

### C5 — `UNIQUE(consumer, content_hash)` rejects the identical re-ask: the double-open guard structurally refuses "Max re-asks," the spec's named recourse for every uncaught case

**Where:** AD-4 `questions` schema (the N4 repair) × AD-9 intake/reconciliation
× spec FR-B4/FR-B5/AC-2a-ii ("Max re-asks" as the recourse).

**Collapse question:** *Max asked "did you run the tests?" at turn 5; the
agent's narration blanket-cleared it (status `answered`). At turn 40 Max —
exercising the recourse the spec names three times — re-asks, verbatim: "did you
run the tests?". Intake INSERTs a row with the same `(consumer, content_hash)`.
What happens?*

**Why the document's answer fails:** the UNIQUE constraint rejects the insert.
The constraint is table-global, not scoped to `open` rows, so a question asked
and closed once can **never be opened again in that session with the same
words** — no row, no deny, no AC-8a line, no counter entry. The re-ask —
naturally verbatim for short questions ("why?", "answer my question", "did you
run the tests?") — is silently ignored, and the failure behavior is unspecified
(a constraint violation on the intake path presumably fails open, i.e. does
nothing). Worse, the recourse-of-the-recourse hits the same wall: `ctxoracle
correct --missed-question "<same text>"` (AD-18) also inserts into `questions`
and also violates the constraint. The guard was checked on the axis it was
built for (parallel-handler idempotency, round-1 N4) and never on the
legitimate-duplicate axis — and the legitimate duplicate is the spec's own
recourse path. The clear-all-prior lean makes an *open* duplicate mostly moot,
which is exactly why the broken case is the *closed*-then-re-asked one.

**Class:** wrong-check (the guard verifies the parallel-write axis and forbids
the recourse axis).

**Repair:** scope the guard to open rows — SQLite partial unique index:
`CREATE UNIQUE INDEX q_open_dedup ON questions(consumer, content_hash) WHERE
status='open'` (keep `UNIQUE(consumer, asked_uuid)` as-is; NULLs are distinct).
Intake on a hash matching a *closed* row opens a fresh row (new `opened_at`);
reconciliation's adjacency match already handles repeated hashes. Add the
re-ask case to AD-24's fixtures (asked → answered → re-asked verbatim → deny
fires again).

### C6 — The `observed_actions.outcome` column has no verified producer: whether a failing command reaches the wired `PostToolUse` at all is exactly the contract fact nobody checked, and the revived FR-L4 failure clause plus AC-24's failure induction hang on it

**Where:** AD-4 (`outcome` column — the P4 repair) × AD-6 (event map:
`PostToolUseFailure` deliberately unwired, "no Phase A genre consumes them") ×
AD-18 (regret proxy's covering-test-failed clause) × AC-24 × the V-table's
headline ("every load-bearing external premise below was re-established").

**Collapse question:** *The repair feeds test failure "from the `PostToolUse`
tool response, for `command_class` rows." The contract defines a separate
`PostToolUseFailure` event, which AD-6 leaves unwired on the stated ground that
no Phase A genre consumes it. When a test command fails, which event fires —
and which V row establishes that?*

**Why the document's answer fails:** no V row exists, and the two branches of
the unverified fact are both fatal to some sentence in the document. If a
failing tool call routes to `PostToolUseFailure` (the reading the event's
existence suggests), then `outcome='failed'` is **unproducible on the wired
events**: the regret proxy's failure clause is dead again — the exact round-1
P4 defect the column was added to fix, resurrected one decision away (AD-4
repaired, AD-6 untouched) — and AC-24's failure-clause fixture can only pass
against a producer that does not exist in the wiring. It also makes AD-6's
justification false: a Phase A mechanism (AD-18) *does* consume that event's
information. If instead the Bash tool reports a non-zero exit as a successful
tool call whose response encodes the failure, the mechanism works — but the
document nowhere establishes this, in a section whose headline claims every
load-bearing external premise was re-established this session. Round-1 C5
(the `backup()` API absent on the declared floor, premise absent from the
V-table) is the same class; this is its recurrence inside a repair.

**Class:** unverified (load-bearing contract premise asserted inside a repair)
+ between-decisions (AD-4/AD-18 repaired against an unrepaired AD-6).

**Repair:** verify the routing (contract + one live induction: a failing
command in a hooked session; observe which event fires) and add the V row.
Then either branch is one small change: if failures route to
`PostToolUseFailure`, wire it as an `observed_actions`-writer only — no
whisper channel, no `permissionDecision` (consistent with FR-O2/FR-B3 and
AC-2's control-flow assertion) — and correct AD-6's "no Phase A genre consumes
them"; if `PostToolUse` carries the failure, record *how* the outcome is
parsed from the response and pin it in AC-24's fixture.

---

## Partial collapses

### P1 — `deny_despite_answer_text` counts the block working correctly against the OL-C3 dodge as a wrongful-deny signal

**Where:** AD-9 detectors (the S4 repair) × AD-17's wrongful-deny rate.
**Collapse question:** *The agent answers "I'll get to that" (the content-free
deferral — "the dodge OL-C3 targets," spec FR-B1) and keeps taking deviating
moves; the block correctly keeps denying. After N denies with that deferral
turn intervening, what does the detector record?*
**Why it fails:** `deny_despite_answer_text` fires — its predicate is "≥ N
denies with ≥ 1 intervening assistant **text** turn," and a deferral is a text
turn. In fact *every* accumulation path for this detector runs through text the
clear recognizer declined to clear, which is either a missed short real answer
(the S4 case — wrongful) or a correctly-non-clearing deferral (rightful); the
detector cannot tell them apart, and AD-17 folds its count into the
**wrongful-deny rate** — so the block behaving exactly as Max asked (deny the
deferring dodger until it answers) inflates the owner's misfire signal.
Diagnostic-only, so bounded — but it is the FR-B5 visibility instrument
measuring wrong.
**Class:** wrong-check.
**Repair:** exclude turns matched by the deferral stoplist from the detector's
"answer text" predicate (the stoplist is deterministic; sharing only its
deferral half keeps the detector independent of the *substance* judgment it
guards), or split the surfaced count ("denies despite text — includes
correct-deny-after-deferral") so the wrongful-deny rate is not polluted.

### P2 — The Verification subtraction lean covers the unmapped-target case but not the unrecognized-runner case, which still emits the checkably-false "not run"

**Where:** AD-15 Verification row (the P4 repair) × C-6 × FR-D1.
**Collapse question:** *The agent runs `make check` (or `cargo nextest`, or any
runner outside the lexicon) which runs the covering test, then claims done.
The lexicon does not classify the command as a test run. What does the whisper
assert?*
**Why it fails:** "T has not been run against this change" — checkably false,
the FR-D1 rumor, from the genre whose value is provenance at the done-claim.
The repair's lean ("a run whose target cannot be mapped subtracts all — never
assert 'not run' on unmapped evidence") operates one layer too late: a command
the **runner lexicon** never recognizes as a test run never reaches the
mapping question at all, so nothing subtracts. Under C-6's language breadth
the lexicon is guaranteed incomplete, so this is not a corner. The 2026-08-25
lesson verbatim: the disclosure of one limit (mapping) hiding the next
(recognition).
**Class:** wrong-check / honest-limits-has-layers.
**Repair:** extend the lean one layer up: when the session's `command_class`
rows include *any* executed command the lexicon could not classify, treat the
run-state as unknown — subtract all (silence), or compose the weaker honest
claim ("no **recognized** test run touched T; runners recognized: …"). Add an
unrecognized-runner case to AC-8's fixture asserting no "not run" is emitted.

### P3 — The watchdog's blocking-call inventory is incomplete on its first audit: compose-time pointer re-resolution is an unenumerated blocking class on the deny-capable event

**Where:** AD-23 (the C4 repair — "every blocking call on the event path, with
its bound") × AD-15 ("a candidate whose pointer fails re-resolution at compose
time is dropped").
**Why it fails:** the inventory lists store statements, transcript reads, and
stdin. Compose-time re-resolution — reading cited spans from arbitrary repo
files, and resolving commit-hash pointers (plausibly a `git` subprocess) — runs
on `PreToolUse`/`PostToolUse` whenever Consequence/Warning/Coupling candidates
survive the bar, and appears nowhere in the inventory whose completeness *is*
the repair's guarantee ("only as strong as the bound on the longest single
synchronous call"). The repair's posture is honest (avoidance claimed "for the
enumerated paths"; AC-10's large-store fixture as the catch) — but the
enumeration is the deliverable, and it has a hole the same document creates.
**Class:** unverified (completeness asserted, falsified by in-document
enumeration).
**Repair:** add the class with bounds: span reads capped (seek + read span ±
slack, never whole-file; skip re-resolution for files over the AD-12 cap) and
commit-pointer re-resolution done against the store's `commits` table (already
mined), never a `git` subprocess on the event path. Note the SessionStart
staleness check's `HEAD` read (subprocess or `.git` file read) in the same
inventory for completeness — SessionStart is not deny-capable, but the
inventory claims the event path, not the deny path.

### P4 — The uniform table-creation criterion was enforced against the four named tables and never re-audited store-wide: `lessons` and `whisper_stats` have no named Phase A writer, and every "tunable" number has no tuner

**Where:** AD-4's criterion (the M4/N1 repair) × AD-5's global schema × AD-20's
verb list.
**Why it fails:** the criterion — "a table exists in a phase's store only if
that phase has a writer for it... one criterion, no exceptions" — was applied
to `exemplars`/`recipes`/`deferred_queue`/`env_capabilities` and then not
turned on the remaining schema. `lessons` (global): the only named human-fact
writer is `note`, whose facts route to the **project** store per FR-L7; no
Phase A path writes a cross-project lesson. `whisper_stats` (global): no
decision names its writer (which component aggregates corrections/whispers
into it, when?). And `tuning` has a seeder but no tuner: AD-14/AD-9 mark a
dozen operating numbers "tunable, stored in `tuning`," yet AD-20's verb list
has no verb that writes a tuning row and AD-5 rejects config files — so for a
non-programmer owner (OL-11) and for the Phase A calibration story
("calibrated by the human channel"), "tunable" denotes an operation no
specified surface can perform.
**Class:** wrong-check (the criterion checked only where round 1 pointed) +
decision-hiding (writers unnamed).
**Repair:** run the criterion over both schemas and either name each writer
(e.g. `whisper_stats` aggregated at `SessionEnd` flush; `lessons` written by a
named `note --global` form, or moved to the phase that writes it) or move the
table to its writing phase. Give `tuning` its writer: a `ctxoracle tune <key>
<value>` verb (plain-language, listed in AD-20) or an explicit statement that
Phase A operating numbers are fixed defaults changed only by a new build.

---

## End-to-end re-traces (spec-criteria-first, per genre/block)

- **Orientation (FR-A2a):** SURVIVES WITH NOTE. `entry_score` now has a real
  producer with named inputs (AD-12), the invariant emptiness is disclosed
  (L10, `status` count), delivery channel verified (V15). Note (N2): import
  in-degree measures *hubness*; the classic entry files the mission sentence
  evokes (`main`/`cli`) have in-degree ≈ 0 and are carried only by the
  path-marker term — AC-1a's fixture should include both shapes so the ranking
  factor is validated, not assumed.
- **Coupling (FR-A2b):** SURVIVES. Unchanged from round 1's clean trace;
  channel now verified (V16).
- **Reuse (FR-A2c):** COLLAPSED — C4. The repair made the headline honest about
  granularity and thereby grep-equivalent; the convention substance
  ("canonical") still has no producer; AC-1b pinned to the reduced claim.
- **Consequence (FR-A2d):** SURVIVES. All inputs produced; right moment;
  compose-time re-resolution feeds P3's inventory gap but does not break the
  genre.
- **Warning ⚠ (FR-A2e):** SURVIVES. Hazard path skips the confidence floor per
  FR-A5a/OL-C4; writers named.
- **Completeness (FR-A2f):** SURVIVES. Unchanged; single Stop-time injection
  honoring `stop_hook_active`.
- **Verification (FR-A2g):** PARTIAL — P2 (the unrecognized-runner layer), C6
  (the failure-outcome producer, shared with regret). The mapping headline and
  the unmapped-target lean are sound.
- **Answer-drift block (FR-A2l) — full §8 property walk on the revised
  mechanism:** *Reactive-only* — holds (question precedes deny; deny lands on
  the formed action; AD-10 confinement mechanized). *Self-clearing / no
  counter / no held turn* — holds; the C5 defect is the inverse failure (a
  re-ask that cannot open), not a stuck deny. *Text answer never denied* —
  holds structurally. *Lag clause* — the open-axis lag is genuinely eliminated
  by prompt-field intake (the P2 repair achieved its aim); the spec's lag
  clause now lives on the clear axis only and remains true of the design,
  including the honest multi-event loosening for catch-up backlogs and the
  frozen-open breakage posture. *Multi-question set, cleared independently* —
  broken for identical duplicates (C5). *Resume rebuild* — consistent; the
  disclosed wrongful-deny burst window during backlog re-classification is
  bounded, self-recovering, and counted (`deny_after_answer_lag`). *Compact* —
  summarized-away questions vanish; disclosed (L1). *Parallel handlers* —
  idempotent via the UNIQUE guards (the same guards C5 must re-scope; the
  partial-index repair preserves idempotency). *Marker-absent entries* — skip
  + diagnostic; note the composition works in the safe direction: when markers
  vanish wholesale, prompt-field intake still opens questions while catch-up
  under-fires. *Per-consumer scope* — holds (AC-2a-i split honored).
  *Recognizer-intake surface* — COLLAPSED: C1 (tracking foreclosed), C2
  (second opener falsifies the rationale), C3 (front-door premise unverified).
- **Blocks vs. the two-blocks absolute (FR-B1/FR-B3/AC-2):** holds — deny
  producible from exactly one module, no `updatedInput` anywhere, no
  `permissionDecision` on any other event.

**Phase-boundary honesty after the repairs:** clean. AD-22 now fixes only
spec-stated FR-J5 semantics as Phase B constraints; the dormant tables are
gone under a uniform criterion (P4 is about the criterion's *audit*, not its
direction); AC-2a-i is split honestly; AC-12/L1/AD-9 continue to label the
skeleton a skeleton. No repair designs Phase B/C machinery against no data.
The two overclaims found are C3's "the user's own" (T2) and C1's "honest
Phase A approximation" counter label — both inside repairs.

## Owner-fidelity scan of the new text

Every `OL-*` key added or moved by the revision was re-read against its ledger
row at its point of use. OL-C5 in intake clause (iv) and D-39's protected class:
consistent. OL-C3 in L1 ("escapable by answering first — the owner's stated
intent"): consistent. OL-C1/OL-C4/OL-2/OL-4/OL-6/OL-7/OL-10/OL-11: unchanged
uses, resolve and support. No rejected item is reintroduced: no pre-emptive
gate, no generated-file block, no budget/count cap (the new K and ≥ N numbers
are diagnostic thresholds, tunable-marked, gating no speech — OL-C1 clean).

**One fidelity defect (N3, below):** the new deny-rationale parenthetical
characterizes the OL-R5-rejected proxy as having "no question predicate and no
intake constraint." The ledger row does not say that: OL-R5 records "the
**answer-drift trigger** scoped to 'writing code'" — i.e. the rejected proxy
lived *inside* answer-drift, which presupposes Max's question; what Max
rejected is the negative-space scoping of the trigger, not a
question-predicate-free rule. The architecture's distinction from OL-R5 is
real, but it stands on the definition-vs-mechanism axis alone (OL-C5 remains
the definition; the tool set is a Phase-A coverage lean under D-41) — the
embellished contrast should be cut, per the collapse-log's 2026-08-25 rule
that a resolvable key must also be re-read for what the row actually says.
Related note: intake clause (iv) is itself a definition-by-exclusion of "a
question," the shape OL-R5's directive warns against ("if you have to
describe what it isnt…"); C1's `kind='request'` repair happens to convert it
into a positive classification, resolving both.

## Survived with note

- **N1 — The redefined done-claim counter's false-positive direction is
  unlabelled.** A genuine substantive answer in the final K turns is normally
  recorded `generic_text_all_prior` (the exact-match `direct_recognized` path
  is rare by construction), so a late-asked, honestly-answered question counts
  as "done-claim with outstanding question." The recency proxy is
  directionally defensible and the early-cleared blind spot is labelled; add
  the over-count direction to the same label so Max reads the number
  correctly. (The counter's larger repair-created blind spot is C1.)
- **N2 — `entry_score`'s in-degree term vs. entry-point semantics** — see the
  Orientation trace.
- **N3 — OL-R5 characterization embellished** — see the fidelity scan.
- **N4 — AC-19 comparator mismatch.** The spec requires "record-identical";
  AD-24 pins "byte-compare via `VACUUM INTO`" — a vacuumed copy is not
  byte-identical to the source store (page layout changes), so the pinned
  check either fails a correct implementation (vs. the original) or trivially
  passes (vs. the export file). Pin a record-level compare (per-table dump
  diff).
- **N5 — `deny_bypass_suspect`'s "file-writing `command_class`" classifier has
  no named producer.** The `command_class` value set is nowhere enumerated,
  and a shell bypass via unrecognized syntax evades the diagnostic exactly as
  it evades the deny (L3's blindness, one level down) — fine for a best-effort
  owner-facing signal, but say it, and name the classifier with the runner
  lexicon in AD-12/AD-15's mechanism inventory.
- **N6 — Shallow-clone key migration re-splits the store.** After the owner
  unshallows outside the tool (the C3/S3 repair's sanctioned path), re-running
  `init` switches the key from URL-mode to commit-mode and the accumulated
  URL-keyed knowledge is orphaned; `status` shows the mode and L4 names
  export/import as recovery, but the specific "you just lost your store by
  following our instructions" moment deserves one sentence in `init`'s output
  (offer the export/import migration when the mode changes).

---

*End of round-2 hunt. The six collapses are all repair-adjacent: three inside
repair text (C2, C4, C5), two on premises repairs introduced without
verification (C3, C6), one an interaction between two repairs' disclosures
(C1). Per the project's convergence discipline, the next round attacks these
fixes.*
