# Independent collapse-hunt — Phase A architecture (2026-08-29)

**Artifact:** `docs/architecture-phase-a.md` (as of 2026-08-29).
**Axis:** mission-fidelity only. Anchor documents read in full before the attack:
`docs/collapse-log.md`, `OWNER-LEDGER.md`, `docs/specs/spec-context-oracle.md`,
then the architecture, every line. Per the collapse-log's standing lesson, this
hunt did **not** start from prior hunts' findings; it started from the spec's own
enumerated criteria (the seven Phase A genres, the §8 block properties, §14's
Phase A acceptance set) and traced each end to end, hunting deliberately in the
gaps **between** decisions. Two premises attacked below were re-verified by
execution in this session; the commands and outputs are quoted at the finding.

## Verdict: DOES NOT SURVIVE

- **Collapses: 5** (C1–C5)
- **Partial collapses: 4** (P1–P4)
- **Survived with note: 6** (N1–N6)

The document is unusually honest at the phase boundary (the skeleton is labeled
a skeleton throughout; deferrals cite §11.5; owner citations all resolve — see
the fidelity scans at the end). The collapses are almost all of the shape the
collapse-log predicts for this round: **the hard part is a named noun whose
producer does not exist, and the failure lives between decisions** — a schema in
AD-4 that cannot compute the headline AD-15 promises, a clear-lean in AD-9 that
structurally zeroes the FR-M4 counter AD-17 reports as live, a network fetch in
AD-3 that AD-19 swears does not exist, a watchdog claim in AD-23 that the
design's own synchronous store check (AD-17 × AD-1) defeats.

---

## Collapses

### C1 — The Reuse genre's headline cannot be computed from the schema that feeds it

**Where:** the gap between AD-4 (`ref_edges`) and AD-15 (Reuse generator).
**Collapse question:** *AD-15 promises the FR-A2c headline — "the canonical
helper is X; N call sites use it — the convention, not existence" — computed as
"call-site counts from ref_edges". `ref_edges` is
`(src_symbol→symbols, dst_file→files, kind) -- import/reference`. Point at the
query that counts call sites of symbol X from a table whose destination is a
file.*
**Why the document's answer fails:** it can't be written. Counting uses of
helper `X` requires edges whose **destination is the symbol X**; the schema's
destination is a **file**. The nearest computable number is "rows whose
`dst_file` is the file containing X" — references to X's *file*, conflating
every symbol in it. If `X` lives in `utils.ts` beside forty other helpers, the
whisper "N call sites use X" reports the file's import count as X's usage — a
**checkably false evidence claim**, exactly the rumor FR-D1 bans and the worst
output for a provenance tool. The "most call sites use it" convention claim
(comparing X against alternatives) is even further out of reach. AC-1b — which
fails any whisper that states bare existence — cannot be passed by the stated
mechanism, only by a fixture that quietly redefines the headline. This is the
collapse-log 2026-07-30 tell verbatim: a citation landing on a schema column
that cannot hold the computation.
**Class:** reduction + decision-hiding (the hard part — reference resolution —
hidden behind a column of the wrong granularity).
**Repair:** design the reference capture honestly: split `ref_edges` into
file-level import edges (`src_file, dst_file` — what tree-sitter actually
yields, and what `test_map` consumes) and a symbol-reference table
(`dst_symbol, src_file, count`), populated deterministically by identifier
match within importing files (cheap, model-free, confidence-capped as the
heuristic it is); restate the Reuse headline to what that data supports ("N
files import/reference X" is a defensible convention fact if stated as such),
and pin AC-1b's fixture to the restated headline.

### C2 — The clear-all-prior lean structurally blinds the FR-M4 owner-recourse counter and the AC-8a backstop — which the document reports as live Phase A measurements

**Where:** inside AD-9 (clear recognizer × Stop-time backstop), surfacing in
AD-17's `status` and the traceability matrix (FR-M4 → AD-17, AC-8a → AD-9,
both Phase A).
**Collapse question:** *The clear recognizer marks ALL open questions
`answered` on any substantive assistant text turn. The done-claim at `Stop` is
itself a substantive assistant text turn, and AD-8's fixed order runs catch-up
before the backstop check. Name a case — other than transcript lag (V1) or a
sub-length-floor "Done." — in which `open` questions can still exist at a
recognized done-claim.*
**Why the document's answer fails:** there is none. Any agent that narrates on
its way to "done" — the overwhelmingly common case — clears every open question
before the Stop event can count it. So the FR-M4 signal *"done-claims reached
with an outstanding Max question"* — whose spec-stated mission-need is that
**"the 'Max re-asks' recourse is actually reachable"**, because Max cannot
re-ask a question he doesn't know was dropped — measures only lag-noise and
terse finishers. It reads ~0 no matter how many questions actually died, and
`status` displays that ~0 as a live measurement — violating AD-17's own rule,
stated eleven lines up, that absence of measurement is never displayed as
health (it applies that rule to `model_path_down` and `missed_skill_block`, and
not to this). The spec's AC-8a does disclose that the backstop "catches only
recognizably-open questions, not a false-clear" — but the architecture's
specific clear rule makes the false-clear the **total** case rather than an
edge, and says nothing. That is the collapse-log 2026-08-25 lesson 2 shape: the
disclosure of one limit hiding a second, larger one. AC-8a's fixture can still
be tuned green (terse done-claim, or lag), which is the wrong-check trap: the
criterion passes while the property fails.
**Class:** wrong-check (a counter that counts the wrong thing, presented as the
mission's recourse signal).
**Repair:** record the **clear basis** on `questions` (e.g. `closed_by_kind ∈
{direct_recognized, generic_text_all_prior, expired}` — Phase A can distinguish
"cleared by the blanket lean" from an actual per-question match even though it
cannot judge substance). Then either (a) the Stop counter counts done-claims
where open questions were closed *only* by `generic_text_all_prior` within the
final turns — an honest Phase A approximation of "plausibly died unanswered" —
or, at minimum, (b) `status` labels the counter exactly as it labels
`model_path_down`: "structurally limited in Phase A — only lag-window and terse
cases are countable; Phase B measures this." AC-8a's fixture must include the
verbose-done case as a documented non-fire.

### C3 — AD-3 performs a network fetch that AD-19, the threat model, and the AC-11 fixture all swear does not exist

**Where:** the gap between AD-3 (repo identity) and AD-19/T4/AC-11 — and
against spec FR-X5.
**Collapse question:** *AD-19: "the only network use in the whole tool is the
Phase B piggyback (absent in Phase A code)." T4's control: "no network (Phase
A)"; the AC-11 fixture "asserts no network egress during any operation." AD-3:
`init` "may attempt `git fetch --unshallow`". Which sentence is true?*
**Why the document's answer fails:** they cannot both be. A `git fetch` spawned
by the oracle is network egress by the oracle, riding whatever ambient git
credentials exist — on a path that is neither the piggyback nor sanctioned by
FR-X5 ("the only network use is the host CLI piggyback"). The security
conclusion "controlled by construction" is false as written, and the AC-11
fixture as designed would fail its own `init` — or, worse, be written to
exempt `init`, which is the check quietly narrowing to pass. Nobody reconciles
the two decisions; the spec is signed, so the architecture cannot grant itself
the exception.
**Class:** unverified (an internal contradiction shipped as a
controlled-by-construction claim).
**Repair:** delete the auto-unshallow attempt. The shallow branch already has
the honest fallback designed (normalized origin URL, else realpath, mode
recorded in `schema_meta` and shown by `status`). If unshallowing is genuinely
wanted, that is a spec question (FR-X5) — not a decision this document may
make.

### C4 — "The V6 fail-closed hazard is unreachable" is an overclaim: the watchdog is cooperative in a fully synchronous design, and AD-17 puts an unmeasured O(store) synchronous check on every event

**Where:** AD-23 (watchdog) × AD-17 (`store_corrupt`: "PRAGMA integrity_check
at open") × AD-1 (a fresh process opens the store on **every** event) × V8 (the
latency measurement).
**Collapse question:** *AD-23 claims "the oracle always answers before anyone
times it out" and calls V6's fail-closed hazard (a timed-out `PreToolUse`
prevents the tool from running) "unreachable". The design is fully synchronous
— `DatabaseSync`, synchronous file reads. By what mechanism does an in-process
watchdog "hard self-exit at 2500 ms" while the event loop is blocked inside a
single synchronous call?*
**Why the document's answer fails:** no such mechanism exists in Node: a timer
cannot preempt a blocked event loop. The watchdog can only be **cooperative**
(deadline checks between bounded slices — which AD-9's resumable catch-up
implies but the document never states), and any *single* synchronous call
exceeding the wired 5 s timeout lands exactly on V6's fail-closed path. And the
design mandates such a call: AD-17 requires `PRAGMA integrity_check` **at
open**, i.e. on every event (AD-1). Measured in this session on this Node
(v22.22.2): a 410 MB store — `integrity_check` = **543 ms**, `quick_check` =
189 ms, as one uninterruptible synchronous statement. V8's "1.8 ms in-process"
was measured on a fresh store **without** the integrity check; the ~50 ms /
"3 % of budget" headroom claim silently excludes an O(store-size) cost that
another decision mandates per event. A large monorepo's store (years of
history, `cochange_pairs` growth) pushes one synchronous statement past the
watchdog and toward the harness kill — converting the fail-open design into
fail-closed **on the deny-capable event**, the one place the spec's FR-O3 most
needs to hold.
**Class:** unverified/overclaim (the "unreachable" claim) + wrong-check (the
measurement excludes the mandated cost).
**Repair:** (1) move integrity checking off the event path — at
`init`/`index`/`SessionStart`, or scheduled, and prefer `quick_check`
there; on the event path, detect corruption by the failure of the actual
prepared statements (fail-open per AD-7). (2) Restate AD-23 honestly: a
cooperative deadline, with an enumerated inventory of every blocking call on
the event path and its bound (store statements bounded by indexed lookups +
`busy_timeout`; catch-up bounded by slice; stdin bounded by the contract),
and downgrade "unreachable" to that inventory's actual guarantee. (3) AC-10's
fixture gains a large-store case.

### C5 — The export mechanism does not exist on the runtime floor the architecture declares

**Where:** AD-2 (floor: Node 22.13.0) × AD-5 (export/import "via SQLite's
backup API", FR-K9/AC-19).
**Collapse question:** *`node:sqlite`'s `backup()` — the mechanism AD-5 names —
exists since which Node version, and what is AD-2's floor?*
**Why the document's answer fails:** verified this session against the
official v22.x API docs (nodejs.org `sqlite.json`): `sqlite.backup` — **"Added
in: v22.16.0"**. AD-2's floor, checked at `init`, is **22.13.0** (chosen for
the FTS5 milestone). On floor-compliant runtimes 22.13–22.15 the export
mechanism is absent: FR-K9/AC-19 cannot be delivered on a runtime the
architecture itself blesses. The premise appears nowhere in the V-table despite
the section's headline claim that "every load-bearing external premise below
was re-established" — the exact attestation-device failure the collapse-log
says to check first.
**Class:** unverified.
**Repair:** one line — raise the floor to 22.16.0 (same check, same plain-
language error) and add the V row; or sidestep the API entirely with
`VACUUM INTO` (SQLite ≥ 3.27, version-immune, and arguably simpler for a
single-file round-trip). Either way AC-19's fixture pins it.

---

## Partial collapses

### P1 — Orientation's ranking has a factor with no producer, and its invariant headline has no writer but the owner's own typing — undisclosed

**Where:** AD-15 (Orientation row) × AD-4/AD-12/AD-18.
**Collapse question:** *Orientation ranks by "match strength × co-change hub
degree × entry-point structure". Who writes "entry-point structure", in which
decision, from what inputs? And who writes `invariants`/`invariant_members` in
Phase A?*
**Why it fails:** "entry-point structure" is defined nowhere — no column, no
producer, no decision; the other two factors are computable
(FTS rank; `cochange_pairs` degree). And the only Phase A writer of
`invariants` is `ctxoracle note` (AD-18) — so on every repo the owner has not
hand-annotated, the FR-A2a headline's second half ("the one invariant that will
bind") is structurally empty. AC-1a passes only via a human-seeded fixture.
Neither fact appears in Limitations (L1–L9 are silent on it). Adjacent:
`exemplars` has **no writer at all** — not even the `note` verb's list
(landmine/invariant/target) — and unlike `recipes` carries no "Phase B/C
writer" annotation: a dead table in a document that rejected `genre_state` as
"dormant machinery" (AD-5 §4).
**Class:** decision-hiding ("entry-point structure") + reduction-by-silence
(the invariant half of a mandated headline empty in the default case,
undisclosed).
**Repair:** define entry-point structure as a computable per-file property with
a named producer in AD-12 (e.g. import in-degree from the file-level edges +
path-convention markers), or strike the factor. Add a Limitations entry:
Orientation delivers entry points only until invariants are recorded via
`note`; surface invariant-count in `status`. Annotate or drop `exemplars`.

### P2 — The question-intake channel is contradictorily specified, and the open-axis lag sits exactly on the block's defining moment

**Where:** V5's result column vs AD-9's state writer; AD-6.
**Collapse question:** *OL-C5 governs the agent's **next move** after Max's
question. V5 says "AD-9's question intake … read[s] exactly these fields" (the
`UserPromptSubmit` `prompt` field). AD-9's state writer classifies **only the
transcript**. Which is built? If transcript-only: what guarantees the question
is `open` before the agent's first tool call, given V1 says the transcript
"may lag" with no bound? If field-driven: `questions` requires `asked_uuid`/
`asked_offset`, which the event field does not carry — what reconciles the
field-opened row against the same turn arriving later in catch-up, and what
prevents a double-open?*
**Why it fails:** the document holds both positions and designs neither
reconciliation. The lag-window clause covers the **clear**-axis only; the
**open**-axis lag — the newest *user* turn unclassified at the first
`PreToolUse` — is the one that lets the first deviating move through, and it is
the exact moment OL-C5 names. Missing it is the sanctioned under-fire lean
(FR-B5), but then V5's claim is false and the miss belongs in L1, which names
recognizer coverage, not intake timing.
**Class:** decision-hiding + unverified (a V-table result asserting a mechanism
the decision does not contain).
**Repair:** intake from the `prompt` field at `UserPromptSubmit` (the question
then exists before the agent's first move — directly serving OL-C5), with the
row reconciled at first catch-up by content-hash + adjacency match to backfill
`asked_uuid`, and a UNIQUE guard (see N4). Fix AD-9's text and V5 to agree.

### P3 — The deny-eligible rationale rests on a false sentence: Phase A questions are not "information questions by construction"

**Where:** AD-9 (move recognizer rationale) × L1.
**Collapse question:** *"A Phase-A-recognized question is an information
question by construction of the question recognizer, and mutating the
repository is not an action that produces an answer to it." The recognizer's
construction is: ends with `?`, not fenced, not on a rhetorical stoplist. "Can
you fix the login bug?" satisfies it. What does the block do to the agent whose
next move is — correctly — the fix?*
**Why it fails:** it denies the compliant action with "answer Max's question
first" — the block firing against its own mission-need (OL-C3 is about
questions being *ignored*, and here nothing is ignored). Polite
imperative-as-question ("can/could/would you …?") is the *dominant* phrasing of
task requests to agents, not a corner; L1 discloses only the narrower "mixed
prompt" case ("which is better? fix it"). The rationale sentence is doing
load-bearing work for the deny-eligible set and is false as stated — the
recognizer's construction excludes nothing about action-requests. (The harm is
bounded: the deny is escapable by one narration turn, and in practice the
narration agents emit anyway pre-clears it — but that mitigation is precisely
the clear-lean that produces C2, and neither composition is stated anywhere.)
**Class:** unverified (a false construction claim), with the 2026-08-25
disclosure-hiding-a-limit shape.
**Repair:** either extend the stoplist concept with a deterministic
request-pattern class (leading "can/could/will/would you" + imperative verb →
task, not question — a further err-toward-not-denying narrowing squarely
inside FR-B5), or keep the behaviour and rewrite the rationale honestly: the
deny is expected on action-requests, escapable, and counted — and name that
expectation in L1 so the Phase A wrongful-deny measurement is read against it.

### P4 — `observed_actions` cannot feed two of the computations specified over it

**Where:** AD-4 (`observed_actions` schema) × AD-15 (Verification subtraction)
× AD-18 (regret proxy).
**Collapse question:** *AD-18's regret proxy counts a held fact "whose covering
test failed in an observed test run". `observed_actions(session, consumer,
seq, tool, path, command_class, ts)` has no outcome column — where does test
**failure** come from? And AD-15's Verification computes covering tests "minus
test runs observed" — when the observed run is a bare `npm test` with no
target, which covering tests does it subtract, and what happens when the
mapping is wrong?*
**Why it fails:** the failure signal has no data source in the schema as
given — the clause is dead as designed (AC-24 can still pass through its
re-edit clause, hiding this). And the run-target mapping is unspecified with
no stated error posture: an unmapped-but-real test run yields a whisper
asserting "not run against this change" that is **checkably false** — the
FR-D1 rumor — from the one genre whose whole value is provenance at the
done-claim.
**Class:** decision-hiding (named computations whose inputs nothing produces).
**Repair:** add an outcome column (`PostToolUse` carries the tool response;
record success/failure for command-class rows), reviving the regret clause;
specify the Verification subtraction rule and its lean — when the run-target
cannot be mapped, treat covering tests as run (err toward silence, consistent
with FR-A2g's not-firing bias); never emit "not run" on unmapped evidence.

---

## Survived with note

- **N1 — AD-22 vs AD-5: the dormant-machinery standard is applied
  inconsistently.** AD-5 §4 rejects shipping the Phase C `genre_state` table as
  "dormant machinery asserting a capability Phase A does not have"; AD-22 ships
  a `deferred_queue` no Phase A code feeds, "tested" via contract functions
  nothing exercises — testing the mock. The stated distinction ("the queue's
  schema is Phase A store surface") is weak: AD-25's forward-only migrations
  make adding a table in Phase B trivial. Not a collapse (the semantics frozen
  are spec-stated FR-J5 properties, not new design against no data), but the
  document should either apply its own standard (defer the table) or state the
  real reason the two cases differ.
- **N2 — The V-table omits the delivery-channel affordances three genres ride
  on.** `UserPromptSubmit` stdout injection (Orientation) and `PostToolUse`
  `additionalContext` (Coupling, Reuse) are inherited from the spec's
  2026-08-25 verification and appear in no V row, under a headline claiming
  every load-bearing external premise was re-established this session. C5 shows
  where that attestation gap bites. Repair: two V rows (both likely confirm
  trivially from the same fetched reference) — and treat the attestation
  sentence itself as the first thing the next round checks.
- **N3 — AC-2a-i is listed whole as Phase A while AD-9 defers its deny half.**
  The matrix and AD-24 pin AC-2a-i to Phase A; AD-9 correctly defers the
  "spawn-to-do-other-work is denied" half to Phase B (Task is never
  deny-eligible in Phase A). Split the criterion in the matrix as AC-2c was
  split, or the Phase A run reports a criterion as passed that was half-skipped.
- **N4 — Concurrent catch-up is not idempotent.** Parallel tool calls fire
  parallel `PreToolUse` handlers (AD-26 anticipates this); two processes can
  classify the same transcript delta and double-open the same question —
  `questions` has no `UNIQUE(consumer, asked_uuid)`. Harm is bounded (clear
  marks all), but the deny reason would name the question twice. One constraint
  fixes it.
- **N5 — The deny teaches the Bash bypass, and the deny-loop signal cannot see
  it.** A denied `Edit` retried as `bash -c 'cat > file'` sails through (L3:
  Bash is never denied). L3 discloses the drift-through-shell class but not
  this specific consequence: the deny itself steers the agent to the bypass,
  and the `deny_loop` signal (≥ 3 consecutive denies, no intervening text) is
  structurally blind to one-deny-then-bypass. Worth a sentence in L3 and a
  diagnostic (deny followed by a file-writing Bash command in the same turn —
  detectable from `observed_actions` after the fact).
- **N6 — Two prose ambiguities in AD-9's ugly-case handling.** (a)
  "catchup_incomplete → silence meanwhile" reads as the opposite lean to the
  lag-window hold; the consistent reading (undiscovered questions cannot deny —
  under-fire; already-open questions still hold) should be stated, and the
  hold's "self-recovers in one round-trip" claim loosened for the multi-event
  catch-up case. (b) On `compact`, state is rebuilt from the compacted
  transcript; a question summarized away by compaction silently vanishes
  (under-fire, safe direction) — undisclosed.

---

## End-to-end traces (trigger → state → candidate → bar → dedup → compose → deliver → audit → learn)

- **Orientation (FR-A2a):** PARTIAL — P1. Trigger (prompt field) → FTS query
  computable; ranking factor "entry-point structure" has no producer; invariant
  half of the headline empty unless human-seeded; delivery channel un-verified
  in the V-table (N2). Everything downstream (bar, dedup, audit) holds.
- **Coupling (FR-A2b):** SURVIVED. `PostToolUse` read → `cochange_pairs`
  partner + ratio + commit pointer; bar terms all computable; dedup subject
  sane; audit-before-emit holds. (Channel verification gap is N2.)
- **Reuse (FR-A2c):** COLLAPSED — C1. The headline's computation does not exist
  in the schema; AC-1b unpassable as specified.
- **Consequence (FR-A2d):** SURVIVED. Edit target → pairs ∩ `test_map` + zone
  flag; all inputs produced (AD-12/AD-13); delivered pre-edit via
  `PreToolUse` `additionalContext` — the right moment.
- **Warning ⚠ (FR-A2e):** SURVIVED. `landmines` writers named with inputs
  (revert_chain, fix_chatter, human_stated); hazard path skips the confidence
  floor per FR-A5a/OL-C4; confidence flagged at compose.
- **Completeness (FR-A2f):** SURVIVED. `observed_actions` edits ∩
  `cochange_pairs` un-edited partners; single Stop-time injection honoring
  `stop_hook_active`.
- **Verification (FR-A2g):** SURVIVED WITH NOTE — P4's subtraction rule.
  Mapping headline computable from `test_map`; done-claim recognizer reads
  `last_assistant_message` (right field, V1); the "not run" clause needs the
  P4 repair to avoid checkably-false output.
- **Answer-drift block (FR-A2l):** PARTIAL — C2, P2, P3. The plumbing survives
  its trace: deny confined to one producer (AD-10), audit-before-deny,
  fail-open on audit failure, per-consumer scope, text never denied,
  self-clearing, lag-hold on the clear-axis, `deny_after_answer_lag` detection.
  The state-intake edge (P2), the action-request rationale (P3), and the
  owner-recourse counter (C2) are where it goes hollow.

**Blocking-model §8 property walk:** reactive-only — holds (deny only on a
post-question action; AC-2's structural confinement is mechanized in AD-10).
Self-clearing — holds (clear on classified answer; no counter, no held turn).
Text answer never denied — holds structurally. Lag-window hold, clear-axis only
— holds as designed, including the frozen-open extension to transcript
breakage (AD-11), with N6's prose caveats. Per-consumer scope — holds
(main-only; subagent never denied for a question it never received). Wrongful
denies visible — holds via corrections + `deny_after_answer_lag`, with P3
noting the expected wrongful-deny class is undercounted in prose. No deadlock
with the block live — holds (deny-eligible set excludes every answer-path
tool; Bash protected per D-39). The silently-wrong-horn hunt found its case on
the **open axis** (P2), not the clear axis the spec already covers.

**Phase-boundary honesty:** no instance of the skeleton being sold as "the
block working" — AD-9, AD-21, AC-12's scoping and L1 are consistently modest;
the one overclaim is C2 (a structurally-blind Phase A measurement presented as
live). Premature Phase B/C design: AD-22 (N1); AD-21's seam-pinning is
spike-backed (V9/V10) and acceptable; the FR-C4 deferral correctly resists
STATUS.md's scope listing in favor of the lifecycle rule.

**Owner-fidelity scan:** every `OL-*` citation checked against the ledger at
its use — OL-2, OL-4, OL-6, OL-7, OL-10, OL-11, OL-C1, OL-C3, OL-C4, OL-C5 all
resolve to CONFIRMED rows saying what the citing sentence uses them for; no
paraphrase upgraded to owner authority; no rejected item (OL-R1–R5)
reintroduced — the pre-emptive gate, generated-file block, budgets, and
negative-space trigger definitions are all absent. Arbitrary-limit scan
(OL-C1): the corpus floor is spec-sanctioned (FR-A6); bar floors are D-6bar
architect defaults, marked tunable, stored, calibrated by the human channel;
the deny-loop ≥ 3 is a diagnostic threshold, not a gate. One note: the
1 MB / 20k-line index cap is an arbitrary *ingestion* cap — it gates what can
ever be known, not what is spoken, and it emits a diagnostic; acceptable as
resource hygiene, but AC-18-style seeded coverage should include one
over-threshold file so the blind spot is measured rather than assumed benign.

**Decisions that survived their hardest question without note:** AD-1 (the
no-daemon chain is real reasoning with a measured premise and honest
consequence check — modulo C4's cost omission), AD-7, AD-8, AD-10, AD-13,
AD-14 (impact and marginal value finally have named inputs and producers — the
2026-07-30 trap answered), AD-16, AD-20, AD-25, AD-26 (modulo N4).

## Session-executed evidence for this hunt

- `PRAGMA integrity_check` on a 410 MB WAL/STRICT store via `node:sqlite`
  (Node v22.22.2, this machine): **542.9 ms**; `quick_check`: 189.5 ms —
  single synchronous statements. (C4.)
- `require('node:sqlite')` exposes module-level `backup` on v22.22.2;
  official v22.x API docs (`nodejs.org/docs/latest-v22.x/api/sqlite.json`,
  fetched this session): `backup` — "Added in: **v22.16.0**". (C5.)
