# Independent collapse-hunt, round 4 — Phase A architecture (2026-08-29)

**Artifact:** `docs/architecture-phase-a.md` at commit `562f063`; the round-3
repairs read as `git diff 5c9ca7f..562f063` in full.
**Axis:** mission-fidelity only. Reviewer is not the author. Read in full, in
order, before the attack: `docs/collapse-log.md`, `OWNER-LEDGER.md`,
`docs/specs/spec-context-oracle.md`, all six prior 2026-08-29 reviews, then the
revised architecture end to end plus the round-3 repair diff.
**Method:** per the collapse-log's standing lessons, this round attacked **the
round-3 repairs as the new collapse surface** — each repair's hardest question,
answered from the document and spec alone — then re-traced everything round 3
touched end to end (the answer-drift walk across every question kind and every
opener, Verification across recognized/innocuous/unknown/failed command mixes,
the regret failure clause through its producer and its consumer filter,
Reuse/AC-1b), swept between-decisions consistency for every round-3 addition
(schema ↔ mechanism ↔ fixture ↔ matrix ↔ Limitations ↔ component map), and
re-read every owner citation the round-3 diff added against its ledger row.
The convergence bar was held honestly in both directions: findings were not
manufactured, and the repairs that survived their hardest questions are
recorded as such by name.

## Verdict: DOES NOT SURVIVE

- **Collapses: 1** (C1)
- **Partial collapses: 3** (P1–P3)
- **Survived with note: 4** (N1–N4)

The trajectory holds (5 → 6 → 1 → 1 collapses), and most of the round-3 batch
is genuinely sound — the detector-coverage scoping, the T2 conditioning, the
readable-counter concept, the communicative-verb split's primary aim (polite
info questions and the OL-C3 escalation re-ask re-armed), the Status count
correction, and the sync sweep all survived their hardest questions (list at
the end). The one collapse is severe in kind though small in text: **the
round-3 consumer filter, applied exactly as the round-3 hunt's own repair
prescription worded it, resurrects for the third time the checkably-false
"not run" whisper that two prior rounds each killed** — and the document's own
AD-6 justification column still states, verbatim, the mission-need the filter
now forecloses. All three partials are also inside round-3 repair text. The
dominant generator this round is new and worth logging: **a reviewer's
concrete repair prescription, faithfully applied under the apply-all-findings
rule, carried its own defect into the document with review authority** — C1
and P1 both trace to sentences the round-3 hunt itself drafted.

---

## Collapse

### C1 — The `outcome` consumer filter makes a run-and-failed covering test invisible to the Verification run-subtraction: the strong "not run" clause then asserts a checkably false fact — the same rumor round-1 P4 and round-2 S-R3 each died killing, resurrected a third time by the repair for round-3 P1

**Where:** AD-4's CONSUMER FILTER (the round-3 P1 repair) × AD-15's
Verification row × AD-6's `PostToolUseFailure` row × spec FR-A2g/FR-D1 ×
AC-8/AD-24's fixture set.

**Collapse question:** *The agent edits a module, runs `npm test`, the covering
test executes and **fails** (exit 1 — the hooks docs' own `PostToolUseFailure`
example payload), and the agent claims done anyway — the exact OL-12 case the
genre exists for. `PostToolUseFailure` fires; the wiring appends the
`observed_actions` row with `outcome='failed'`, `command_class` = recognized
runner. What does the Verification whisper assert about that test, and is it
true?*

**Why the document's answer fails.** AD-4's one rule is explicit: *"the
changed-regions and **run-subtraction queries (FR-A2g)** … consume 'ok' rows
only."* The failed run is a recognized-runner row, so it never reaches the
ternary classifier's class-3 unknown trigger (the command **was** classified),
and under the filter it never reaches the subtraction either. The run-state
for the covering test is therefore "no recognized run touched it," and the
**strong clause fires: "T has not been run against this change" — factually
false. The test was run. It ran and failed.** That is the FR-D1 rumor from
the one genre whose whole value is provenance at the done-claim — the exact
sentence round-2 S-R3 used, and the exact defect AD-6's own justification
column *still carries in the current text* as the reason the wiring exists:
*"without this wiring a run-and-failed test looks never run, and Verification
would emit the checkably-false 'not run' (FR-D1)."* The wiring now exists and
the filter reinstates the outcome.

The generator is precise: the round-3 P1 finding (consumers unspecified) was
real, and its prescribed repair listed the consumers to restrict — *"the
edit-set, read-set, Completeness, **Verification-subtraction**, and
Coupling/Reuse trigger queries consume `outcome='ok'` … rows only"* — and the
author applied that list faithfully. But "one rule" flattened two consumers
with **opposite correct semantics**: a failed `Edit` is genuinely not a change
(the filter is right for changed-regions, edit-set, read-set, triggers), while
a failed test run **is a run** — indeed the most decision-changing run-state
there is at a done-claim. The rationale parenthetical AD-4 carries ("a failed
Edit is not a change; counting it yields the checkably false whisper this
column exists to prevent") argues only the Edit half and was never checked
against the run half it swept in. The wrong-check trap completes it: AD-24's
fixtures pin the failed-**Edit** case ("appears in no Completeness/Verification
computation") and the "run-state honesty both ways" pair (innocuous-only →
strong clause; `make check` → weaker claim) — **no fixture covers
run-and-failed**, so the suite passes while the property fails. A secondary
leak through the same rule: if the class-3 unknown-scan ("any command the
lexicon could not classify") is also read as an FR-A2g query consuming 'ok'
rows only, a *failed* unknown runner (`make check` exiting 1 after running the
covering test) also stops triggering unknown, and the strong clause fires
falsely by a second path.

**Class:** wrong-check (a rule verified on the axis it was written for and
never on the adjacent one) + reduction-by-repair, between-decisions
(AD-4 repaired against AD-15/AD-6 without re-checking the run half). Third
recurrence of one defect, each time introduced or reintroduced by a repair:
round-1 P4 (no failure producer) → round-2 S-R3 (producer wired to an event
the design left unwired) → this (producer wired, consumer filtered back out).

**Concrete repair.** Split the rule by consumer semantics, in AD-4's comment:
'failed' rows are excluded from the **change/read** consumers (edit-set,
changed-regions, read-set, Coupling/Reuse triggers — a failed Edit is not a
change, a failed Read is not a read) and **included** in every **run-state**
input (the FR-A2g run-subtraction *and* the unknown-command scan) and in the
FR-L4 clause and diagnostics as now. For a recognized runner with
`outcome='failed'`, the honest run-state is not "run" (silence) but **"run
and failed"** — the whisper's run-state clause states it ("the covering test
`T` for this region ran and **failed** in this session"), which is stronger
at the done-claim than either false alternative and still headlines the
mapping (AC-8's content assertion). Sync AD-15's Verification row, and add
the missing fixture to AC-8/AC-24: covering test run-and-failed → done-claim
→ assert no "not run" is emitted and the failed-state line is. One collapse-log
entry is warranted for the generator (see the closing note): a reviewer's
concrete repair text is a first-class defect source, and apply-all-findings
does not exempt it from the next round's attack — which is the round-4 charter
working, but the *prescription* layer had no check until now.

---

## Partial collapses

### P1 — The communicative-verb rationale's new universal — "the requested act is *text*, which the deny-eligible set can never touch" — is false for verbs whose object determines the medium, and L1's residual ledger excludes exactly that subclass

**Where:** AD-9 intake clause (iv) (the round-3 C1 repair) × L1 × D-41/FR-B5 ×
AD-18 (`--missed-question` routes through the same classifier).

**Collapse question:** *Max asks "can you show me a demo of the new flow?" —
or "could you confirm the fix works by adding a regression test?" Both match
the request frame with a communicative-lexicon verb (`show`, `confirm`), so
both classify `kind='info'` — deny-capable. The agent's next move is the
`Edit` that writes the demo script / the regression test — the action that
provides what was asked. What does the block do, and what does the repaired
rationale say can never happen?*

**Why it fails.** The block denies the Edit ("answer Max's question first") —
denying the fulfillment move. The repaired rationale asserts this is
impossible for the communicative class: *"the requested act is **text**, which
the deny-eligible set can never touch."* That is true of
`answer/tell/explain/describe/list/clarify` in almost all uses, but
`show`/`confirm` (and `demonstrate`-class synonyms an implementer will add)
take **objects that change the medium**: "show me the error" is text; "show me
a demo" is a build. The classifier is verb-level and cannot see the object, so
the sentence is a universally-quantified claim the mechanism cannot establish
— the same shape as round-1 S2, round-2 C2, and round-3 C1, recreated one
level down inside the repair for round-3 C1 (whose prescription this sentence
quotes verbatim). The harm is bounded and points the opposite way from
round-3 C1: nothing is disarmed; instead a wrongful deny lands on a plausibly
answer-directed move — outside D-41's "clearly not directed at answering"
license and in FR-B5's forbidden direction — escapable by one narration turn
and visible only via corrections. That harm profile is identical to the
residual L1 already owns for action-requests *outside* the pattern; the
defect is that **L1's ledger affirmatively excludes this subclass** — it says
communicative-verb forms "are `info` and **fully enforced**" and describes the
wrongful-deny residual as "an action-request **phrased outside the request
pattern**" — so the coverage ledger under-states the wrongful-deny class the
Phase A exit will actually measure, and `--missed-question` inherits the same
blind spot (Max reporting a dropped "can you show me a demo?" arms a deny
against the very move that would fulfil it, and the CLI's output has no
category for that).

**Class:** unverified (a false universal inside repair text, prescription-
carried) + wrong-check (the residual ledger scoped to miss the subclass).

**Concrete repair.** Requantify the rationale to what the classifier computes:
"a communicative-verb request **whose fulfilment is text** — the dominant use
of these verbs — is an information question in request clothing; the
verb-level classifier approximates that class and errs toward deny-capable,
so a communicative verb with a repo-artifact object ('show me a **demo**') is
misclassified `info` and its fulfilling edit is wrongfully denied — escapable,
counted, owned below." Extend L1's residual to name both wrongful-deny
sub-classes (action-request outside the pattern; communicative verb with a
doing object), and drop "fully enforced." Optional narrowing (not required —
it adds a second fallible lexicon): `show/confirm/demonstrate` + a
repo-artifact object noun (demo/test/example/script/branch) → `request`. Add
"can you show me a demo?" to AD-24's labeled corpus with its expected cost
documented, whichever branch is chosen.

### P2 — The recognized-innocuous class is defined by a predicate ("cannot run tests") that head-matching cannot compute: one compound command (`cd pkg && npm test`) re-manufactures the false "not run" the ternary classifier was built to kill

**Where:** AD-15's Verification row (the round-3 P3 repair — the ternary
`command_class` classifier) × FR-D1 × AD-24's "run-state honesty" fixtures.

**Collapse question:** *The agent runs `cd packages/core && npm test` — the
single most ordinary compound form in a monorepo — and the covering test runs
(and passes). The classifier is an allowlist of "command **heads** that cannot
run tests: `ls`, `cd`, `cat`, `git status`-class, `grep`/`rg`, …". Which class
does the command land in, and what does the whisper then assert at the
done-claim?*

**Why it fails.** Head `cd` → class 2, recognized-innocuous → "no effect on
run-state." The `npm test` after `&&` is never seen: no subtraction, no
unknown trigger. Run-state remains "no recognized run touched T," and — with
no unknown command in the session — **the strong clause fires: "T has not
been run against this change." False**; the test ran. The class definition is
right ("commands that cannot run tests"); the enumerated mechanism (per-command
head matching) contradicts it, because a compound command whose head is
innocuous can run anything. "Conservative allowlist" is doing the work the
mechanism doesn't: under shell composition, head-matching is precisely
*not* conservative — it converts unknown-shaped input into the class that
licenses the strong claim. The round-3 fixtures cannot see it: the
"innocuous-only session" fixture uses simple commands, the `make check`
fixture is a bare unknown head. (The same compositional blindness exists in
`deny_bypass_suspect`'s file-writing class, but that one is disclosed
best-effort and diagnostic-only — no repair needed there beyond what L3/N5
already own.)

**Class:** wrong-check (a class predicate asserted, a mechanism that cannot
compute it) — the round-3 P3 repair fixing the predicate's *domain* while
leaving its *unit* unsound.

**Concrete repair.** One sentence in the AD-15 row: classification is
**per pipeline segment** — split on `&&`, `;`, `|`, `||` (and subshell/
`sh -c` wrappers → class 3 wholesale); a command is recognized-innocuous only
when **every** segment's head is on the allowlist; any segment matching the
runner lexicon classifies the command as a run of that runner; anything else →
class 3, unknown. Add `cd x && npm test` (subtracts / states run-and-failed
per C1's repair) and `cd x && make check` (weaker claim) to the AC-8 fixture
set.

### P3 — The `whisper_stats` watermark repair leaves the aggregation's placement an implementer disjunction ("any handler event or CLI verb"), names no home for the watermark itself, and was not synced into AD-23's blocking-call inventory or AD-6's event map

**Where:** AD-5 §1 (the round-3 R3-M2 repair) × AD-23's inventory ("every
blocking call on the event path, with its bound") × AD-6's per-event work
table × Gate A's "no inline architectural calls found remaining."

**Collapse question:** *Who runs the watermarked aggregation, at which event,
and where does "the last-aggregated timestamp" live? If the answer is "any
handler event," name the AD-23 inventory line that bounds a second database
open plus a cross-store fold on the deny-capable event — and the AD-6 row
that lists the work.*

**Why it fails.** The repair specifies a mechanism (fold corrections newer
than a watermark) and deliberately leaves its trigger a disjunction — "any
handler event or CLI verb (`correct` itself is the cheapest point)." That is
an inline architectural call of exactly the kind Gate A attests was
eliminated, on exactly the axis round-3 P3 flagged for the ternary lean
(an unresolved "or" whose branches differ in system behavior): one branch
puts a global-store open + aggregate fold on the event path — absent from
AD-23's inventory, whose *completeness* is the stated basis of the
fail-closed argument, and absent from AD-6's per-event work rows — while the
other branch (CLI-only) fully satisfies the R3-M2 need the repair cites
(post-session corrections reaching the efficacy table; AC-23's new fixture
pins a *post-session* correction, which the `correct`-verb branch alone
delivers). And the watermark itself — "the last-aggregated timestamp" — has
no named home: no column, no `schema_meta`/global-store key, in a document
whose recorded trap for exactly this is "a named noun with no producer"
(here: a named timestamp with no receptacle). The latency substance is small
(V8 puts a store open at ~2 ms; the fold is O(new corrections)), which is
why this is partial rather than collapse — the defect is the unresolved
decision and the inventory/desync, not a live NF-1 breach.

**Class:** decision-hiding (the disjunction; the homeless watermark) +
between-decisions (AD-5 repaired; AD-23/AD-6 not re-opened) — the m-R4/R3-m1
desync class recurring inside a round-3 repair.

**Concrete repair.** Pick the branch the need requires and no more: the
aggregation runs at **`correct`** (the cheapest point, and the only one the
mission-need demands) **and at `SessionEnd`** (off the deny-capable path,
inside its existing flush) — never on tool events; state the watermark's home
(a `schema_meta`-style key in the global store, e.g.
`whisper_stats_watermark`); strike "any handler event" from AD-5. If any
handler-event placement is ever chosen instead, it must be added to AD-23's
inventory and AD-6's row for that event — say so in AD-5 so the constraint
travels with the mechanism.

---

## Survived with note

- **N1 — The R3-m2 fix was applied at AD-4 and not swept to AD-6, its other
  named location.** AD-4 now says `outcome='failed'` is set by the event
  **UNCONDITIONALLY** (the exit-code parse is best-effort enrichment); AD-6's
  `PostToolUseFailure` row still reads "append with `outcome='failed'`
  **parsed from the `error` exit-code line**" — the exact wording R3-m2 said
  an implementer would read as a precondition, on the surface (the event map)
  an implementer wires from first. A non-Bash tool failure skipped on that
  reading recreates the run-and-failed-looks-never-run rows that feed C1.
  One-phrase sweep; the incomplete-sweep class is the collapse-log's
  2026-08-13 lesson verbatim.
- **N2 — The readable recourse counter writes to a receptacle the schema does
  not carry.** AD-9: each increment "writes the counted questions … into the
  session's `session_log` **detail**"; `session_log(session, consumer, seq,
  event_type, ts, latency_ms, candidates_json, outcome)` has no detail
  column (`detail_json` exists only on `faults`). Also, `log … renders them
  under the done-claim entry" presumes a `whisper_audit` entry exists at that
  Stop — a done-claim with no whisper (nothing cleared the bar) increments
  the counter with no audit entry to render under. Two one-line fixes: add
  `detail_json NULL` to `session_log` (or write a dedicated row kind), and
  state that plain `ctxoracle log` defaults to the most recent session and
  renders counted questions with or without an accompanying whisper entry —
  keeping "one command" true as promised.
- **N3 — "Counted on the wrongful-deny side" overstates the marker-absent
  synthetic residual's countability.** T2/L11 say the marker-less synthetic
  class's denies are "counted on the wrongful-deny side." The wrongful-deny
  rate is corrections + `deny_after_answer_lag` + `deny_despite_answer_text`;
  for a synthetic question the agent's ordinary narration blanket-clears the
  row before either automated detector can accumulate, so the count exists
  only if Max files a correction — i.e., the residual is *audited and
  correctable* (every deny is on the FR-X6 trail), not automatically
  counted. One word-level fix in T2 and L11 ("auditable and correctable;
  counted when corrected") keeps the bound sentences exact — the standard
  round-3 itself applied to T2 (R3-m6).
- **N4 — The `--missed-question` collision output names two limits; a
  collision with an open `request` row is a third.** AD-18's new clause
  covers intake-coverage and move-coverage collisions. Max reporting a miss
  whose row is open with `kind='request'` (tracked, never deny-capable) hits
  a kind-coverage limit the two named categories don't describe; the CLI
  should say that in the same plain language ("this ask is tracked but not
  enforced in Phase A — L1"), or the collision clause should name all three.

---

## End-to-end traces (everything round 3 touched)

- **Answer-drift, full walk on the revised intake.** *Info question* ("why
  does the login test fail?") → intake opens `info`; `Read`/`Grep`/`Bash`/
  `Task` run free; a deviating `Edit` is denied; a substantive text answer
  clears ✓. *Repo-action request* ("can you fix the login bug?") → doing
  verb → `request`; the fix-edit is never denied; the row feeds the AC-8a
  line and counter ✓. *Communicative-verb request* ("could you tell me why X
  fails?") → `info`, deny-capable ✓ — the round-3 repair's primary aim is
  real; and the escalation re-ask "can you please answer my question?" →
  verb `answer` → `info` → re-arms the block after a blanket clear ✓
  (fixture-pinned). *The verb+object subclass* ("can you show me a demo?") →
  `info` → the fulfilling Edit is wrongfully denied — P1, escapable, not in
  L1's ledger. *Re-ask both phrasings:* verbatim info re-ask → fresh row via
  the open-scoped index ✓; polite re-ask → `info` ✓ (round-3 C1 resolved).
  *`--missed-question` all kinds:* plain info text → deny-capable ✓; doing
  request → tracked, CLI says so ✓; communicative-verb info → deny-capable ✓;
  communicative-verb-with-doing-object → P1's blind spot via the CLI door;
  open-row collision → CLI names intake/move limits (kind limit missing —
  N4). *Marker-less mode:* intake unaffected; rebuild →
  `rebuild_recovered_nothing`, loud ✓. *Compact:* summarized-away question
  vanishes, disclosed (L1) ✓. *Parallel handlers:* idempotent under the
  open-scoped index ✓. The §8 property walk otherwise holds unchanged from
  round 3: reactive-only, self-clearing, text never denied, lag clause
  clear-axis-only, per-consumer scope, single confined producer.
- **Verification, all command mixes.** Innocuous-only session → strong "not
  run" clause fires ✓ (correct). `make check` present → weaker honest claim,
  mapping still headlined, AC-8 content assertion satisfied ✓. Recognized
  runner, run-and-**passed** → `'ok'` row subtracts ✓. Recognized runner,
  run-and-**failed** → `'failed'` row excluded by the consumer filter → the
  strong clause asserts a falsehood — **C1**. Compound `cd x && npm test` →
  head-matched innocuous → run invisible → false "not run" — **P2**.
- **Regret failure clause.** Store-held fact → covering test fails →
  `PostToolUseFailure` → `'failed'` row → the FR-L4 clause is a permitted
  consumer of `'failed'` rows → regret row recorded, `status` reports under
  its label ✓. The clause is live; AC-24's fixture has a real producer ✓.
  (Its health is independent of C1 — the filter's FR-L4 carve-out is
  correct.)
- **Reuse / AC-1b.** FTS candidate set → same-kind restriction →
  `symbol_refs` counts → dominance ≥ k× runner-up → comparative headline
  that no longer claims functional substitutability ("of the N symbols
  matching this search…") ✓; identifier-match false-positive class and
  mixed-language skew stated in the whisper's evidence and owned in L6 ✓;
  no-dominance → silence ✓. Survives; nothing new found.
- **Readable counter flow.** Done-claim + open-or-recently-blanket-cleared
  rows → increment → counted questions written (receptacle missing — N2) →
  `status` "3 — see ctxoracle log" → `log --session` renders ✓ in concept;
  the data (text, kind, `closed_by_kind`, closing turn) all exists in
  `questions` ✓.

## Between-decisions consistency sweep of every round-3 addition

`kind` NOT NULL — schema ✓ / invariant text ✓. Communicative lexicon — AD-9 ✓
/ AD-24 fixtures ✓ / AD-18 inheritance ✓ / L1 ✗ (residual mis-scoped — P1).
Consumer filter — AD-4 ✓ / AD-15 Verification row ✓ / AD-16 read-set ✓ /
AC-24 failed-Edit fixture ✓ / run-subtraction semantics ✗ (C1) / AD-15
Completeness row carries no annotation but inherits AD-4's one rule (fine —
one fact, one home). Ternary classifier — AD-15 ✓ / AD-24 both-ways fixtures
✓ / classification unit ✗ (P2). Weaker-claim branch shipped — stated, AC-8
content assertion satisfiable ✓. Readable counter — AD-9 ✓ / AD-17 pointer ✓
/ AD-20 verb ✓ / `session_log` schema ✗ (N2). Watermark aggregation — AD-5 ✓
/ AC-23 post-session pin ✓ / AD-23 inventory ✗ / AD-6 event rows ✗ /
watermark home ✗ (P3). Detector-coverage scoping — AD-9 ✓ / AD-17 ✓ /
AC-9 induction unchanged and consistent ✓. T2 conditioning — T2 ✓ / AD-9
carve-out ✓ / L11 ✓ ("counted" nuance — N3). Unconditional `'failed'` —
AD-4 ✓ / AD-6 ✗ (N1). Import parenthetical — T2's "runtime openers"
enumeration now true ✓. L6 restatement — matches AD-15's Reuse row ✓. AD-18
collision clause — AD-18 ✓ / matrix AC-2c qualifier ✓ (third limit — N4).
Component map — `PostToolUseFailure` ✓, `tune` ✓, intake step ✓, AD-8 order ✓.
V-ranges — line-271 baseline ✓, AD-6 §5 ✓, matrix C-4 row ✓, standards table ✓
(AD-6 §5 omits V18 where the matrix includes it — V18 is knowledge-state/L9
material AD-6 does not rest on; not charged). Status section — round-1 count
now "28 rows, 25 distinct," partial-resolution caveat present ✓; round-3
paragraph's verdict counts match both round-3 files ✓; its applied-fix
enumeration was located item by item in the document ✓ (the one unswept copy
is N1). `tools/check_docs.py` passes on the current tree (run this session).

## Owner-fidelity scan of the round-3 text

Every `OL-*` use the round-3 diff added or moved was re-read against its
ledger row at its point of use. **OL-C3 in clause (iv)** ("OL-C3's own named
moment" for the escalation re-ask): the CONFIRMED row is the
ignored-question demand ("block that motherfucker until it stops ignoring me
and actually answers") — the citing sentence uses it for exactly that moment;
supported. **OL-C5 in the requantified sentence** ("for a request to act on
the repo, the requested action *is* the answer path, so denying on it would
deny exactly the move OL-C5 protects"): the row's protected class ("actions
taken to provide an answer") supports the use, and the requantification
repaired round-3 C1's false universal *for this sentence* — the surviving
false universal is the adjacent unsourced design claim ("the requested act is
text"), which cites no owner row and is charged as P1, not as an attribution
defect. No other owner key was added or moved by the diff; the Status
section's review citations match the cited files' verdict lines. **No
rejected item reintroduced:** clause (iv) remains a positive classification
with `info` as the default branch (OL-R5's directive honored — lexicon
incompleteness fails toward deny-capable, the measured direction, not toward
a negative-space definition); the deny still requires an open `kind='info'`
question *and* a deviating action through the single confined producer (no
pre-emptive gate); no generated-file consumption on any deny input; no
budget or count cap anywhere in the new text. **Arbitrary-limit scan
(OL-C1):** round 3 introduced **no new operating numbers** — the two
lexicons and the innocuous allowlist are classification vocabularies with a
named config home, gating what is *asserted*, never how much is spoken; the
watermark is a timestamp; `k`/`K`/`N` are unchanged, tunable, with the
`tune` writer. Clean.

## Round-3 repairs that survived their hardest question without a finding

The detector-coverage statement (AD-9/AD-17 — attacked on whether the scoped
claim is now exactly true: it is; the false-stoplist-match episode
self-recovers on a re-answer and the human channel is the only catcher, as
stated). The T2 bound conditioning (the marker-carrying/one-catch-up and
marker-absent/L11 split matches the carve-out exactly; only N3's word-level
"counted" nuance remains). The communicative-verb split's primary aim (polite
info questions and the OL-C3 escalation re-ask are deny-capable, fixture-
pinned; the default-to-info direction makes lexicon incompleteness fail
safe). The `kind` NOT NULL constraint. The import parenthetical (T2's opener
enumeration now literally true). The AD-18 collision clause's two named
limits (honest as far as they go — N4 adds the third). The L6 restatement
and the AC-8/AC-23/AC-24 fixture pins (each located and consistent). The
Status count correction (verified against the round-1 files' finding rows
and the round-2 resolution table's cross-duplicates). The sync sweep
(verified item by item; one surviving copy — N1).

---

*End of round-4 hunt. One collapse, three partials, four notes — every one
inside or one decision away from round-3 repair text, none in older
substance; the round-1/round-2 material re-traced clean. The trajectory
(5 → 6 → 1 → 1) has not yet produced the terminal round. Two things belong
in the next round's inheritance: (1) C1 is the third resurrection of one
defect, each time via a repair — when the same corpse returns a third time,
the repair for it must enumerate every consumer/producer of the primitive it
touches (here: every reader of `observed_actions`, by name, with its outcome
semantics) rather than restrict by list; (2) both C1 and P1 entered the
document as verbatim sentences from the round-3 hunt's own prescribed
repairs, faithfully applied — a reviewer's concrete repair text carries no
verification of its own and must be attacked by the next round exactly as
author text is. Per the convergence discipline, the round-5 pair attacks
these fixes.*
