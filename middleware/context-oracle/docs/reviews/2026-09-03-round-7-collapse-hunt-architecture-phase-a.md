# Independent collapse-hunt, round 7 — Phase A architecture (2026-09-03)

**Artifact:** `docs/architecture-phase-a.md` at current HEAD (`92ab11f`, "apply
all round-6 review findings"); the round-6 repairs are that commit, read as
`git show 92ab11f -- middleware/context-oracle/docs/architecture-phase-a.md`
in full.
**Axis:** mission-fidelity only. Reviewer is not the author of the document or
of any prior review. Read in full, in order, before the attack:
`docs/collapse-log.md` (its 2026-09-03 entry first, per the charter — round 6's
two lessons — then the 2026-08-29 entry, then the rest, esp. 2026-08-25's
convergence/terminal definition), `OWNER-LEDGER.md`,
`middleware/context-oracle/CLAUDE.md`, `docs/specs/spec-context-oracle.md`
(§8, §11.5, §12, §13, §14), both round-6 review files, then the architecture
end to end plus the round-6 apply diff.
**Charter additions honored:** (1) the round-6 fixes were largely prescribed by
the round-6 reviews themselves — reviewer repair text carries no verification of
its own and was attacked here exactly as author text (collapse-log 2026-08-29
lesson 1). (2) AD-4's `observed_actions` consumer enumeration was re-audited for
completeness (round 6 added the FR-L4 re-edit reader and re-bucketed
`deny_bypass_suspect`) — the enumeration-as-terminating-repair corollary. (3)
Both round-6 lessons honored: a fix must land at the exact location the finding
named (checked each round-6 fix swept its sibling sites); and a default flip / a
targeted seed has **two miss directions** — the round-6 object-classification
seed (`question`/`answer` → `info`) was re-checked in **both** directions. (4)
For every fixture assertion a round-6 repair added, the mechanism sentence that
produces the asserted behavior was named before the fixture was accepted.
**Method:** each round-6 repair's hardest question, answered from the document,
spec, and ledger alone; the required end-to-end re-traces (OL-12 mainline; the
full object-classification corpus including round-6 additions and my own
adversarial cases — meta-answer asks, "answer" as verb vs noun, coordinated/multi
objects, wh-complements hiding artifact nouns, rhetorical lead-ins; the Reuse
dominance path in a mixed-language repo; Verification across all command mixes;
the §8 deny-confinement walk on the round-6 text; an owner-fidelity scan);
between-decisions consistency of every round-6 addition. Findings were not
manufactured to avoid an empty report; the repairs that survived their hardest
question are recorded by name.

## Verdict: DOES NOT SURVIVE

- **Collapses: 0**
- **Partial collapses: 1** (P1)
- **Survived with note: 7** (N1–N7)

For the third round running, no full collapse: no round-6 mechanism is hollow end
to end, the §8 confinement property walk holds (the round-6 diff touches
classification, schema comments, a diagnostic, and fixtures; the single deny
producer, reactive-only, text-never-denied, self-clearing, and per-consumer scope
are all untouched), the OL-12 mainline is clean at every layer under the round-6
text, and the per-project watermark, the comparability discriminator, the compound
Verification fixture, and the `tune` list-lexicon extension all produce the
behavior they now assert.

But one real defect lives inside the round-6 repair text, and it is the
collapse-log's own recurring lesson validated once more. **P1** is the P1 lineage
(round-1-S2 → round-3-C1 → round-4-P1 → round-5-P1 → round-6-P1 → **this**): the
"wrongful-deny residual has **exactly two member shapes**" claim is again a false
universal, and it fails on the very axis round 6 acted on. Round 6 seeded
`question`/`answer` into the information-object lexicon to restore the `OL-C3`
recourse (over-enforcement direction) — and the collapse-log's own 2026-09-03
lesson 2 ("a default flip / a targeted seed has two miss directions") bites: the
seed **also** made a class of in-frame, communicative-verb, `info`-object questions
deny-capable whose **fulfilment is an action** ("can you answer the question in the
ticket?" where the ticket demands a build), which the categorical `Edit`-deny then
**wrongfully denies** — a *third* wrongful-deny member shape the "two … for want of
a request frame" enumeration structurally excludes, resting on the load-bearing
soundness universal "mutating the repository does not produce an answer to it,"
which round 6's own seed made newly false.

A round with a live partial is not the terminal round; per the convergence
discipline the count bars the terminal call, and the collapse-class trajectory
(5 → 6 → 1 → 1 → 0 → 0 → **0**) continues to converge while the partial holds at 1.

---

## Partial collapses

### P1 — Round 6's `question`/`answer` seed has two unclosed miss directions; the over-enforcement one is real: an in-frame, communicative-verb, `info`-object question whose answer IS a build ("can you answer the question in the ticket?") is now deny-capable and wrongfully denies the fulfilling `Edit` — a THIRD wrongful-deny member shape excluded by "exactly two member shapes, both … for want of a request frame," resting on the false universal "mutating the repository does not produce an answer to it"

**Where:** AD-9 deny-decision rationale (lines ~872–880: *"mutating the
repository does not produce an answer to it"* × *"The residual wrongful-deny
class has **two member shapes**, both opened by intake's clause (i)–(iii) and
classified `info` by clause (iv) **for want of a request frame**"*) × the
information-object lexicon seed (lines ~771–777: *"error / output / log / diff /
result / value / version / status-class — **plus question / answer**"* → `info`)
× the move recognizer's deny-eligible set (line ~867: *"the repo-mutating file
tools (`Write`, `Edit`, `NotebookEdit`)"*) × D-41's license (line ~866: denies
only moves *"clearly not directed at answering"*) × L1 (lines ~2070–2073, the
same "two member shapes … for want of a request frame") × the round-6 commit
message (*"request as the safe default for every unlisted object … restoring
L1's single-member residual as true"* — the change that caused it, now inverted
by the seed).

**Collapse question:** *Max asks "can you answer the question in the ticket?" and
the ticket's question is a request ("can we add rate limiting?"). Intake opens a
row: request frame ("can … you … answer"), verb `answer` (communicative), object
head "question" — now on the information-object lexicon (round-6 seed) →
`kind='info'` → deny-capable. The agent, doing exactly what Max asked, edits code
to add rate limiting — an action that IS the answer to "can we add it?" — and the
`Edit` is **denied** ("answer Max's question first: can you answer the question in
the ticket?"). Which of L1's "exactly two member shapes" is that? The
document says the residual is two shapes "both … for want of a request frame" —
this one is squarely IN the request frame. By what mechanism is an answer-directed
`Edit` kept out of the deny? The rationale says "mutating the repository does not
produce an answer to it" — but here the mutation IS the answer. Cite the line that
survives that.*

**Why the document's answer fails.** There is none — the rationale asserts the
opposite of what happens. The deny is sound, AD-9 says, because "mutating the
repository does not produce an answer to it, while every allowed class contains
plausible answer-directed members." That is a **false universal**. For an
information question whose *answer-production is itself a repo mutation*, the
`Edit` is the answer-directed move, and the categorical `Edit`-deny denies it —
violating D-41's own "clearly *not* answer-directed" license (the edit is clearly
answer-*directed*). Round 6's seed did not create the false universal, but it
**widened its bite into a new, realistic class**: before round 6, "answer the
question…" (object "question") defaulted to `request` (round-5 flip) → not
deny-capable → the false universal never fired for it; after round 6, "question"
is an info-object → deny-capable → the fulfilling `Edit` is now wrongfully denied.

This is the collapse-log's 2026-09-03 **lesson 2 made concrete** — *a targeted
seed/flip has two miss directions.* Round 6 audited the direction it intended (the
`OL-C3` recourse — over-enforcement, "answer my question" must re-arm) and closed
it. It did not audit the opposite direction the *same seed* opens
(over-*enforcement* against a fulfilling move): the seed makes deny-capable not
only the pure text-answer re-ask ("answer my question," correct) but every
communicative-verb ask whose object is "question"/"answer" — including ones whose
fulfilment is an action:
- **"can you answer the question in the ticket?"** (ticket = a build request) →
  `info` → the fulfilling `Edit` denied. Wrongful.
- **"can you show me the answer in code?"** → verb `show`, object "answer" →
  `info` → the build `Edit` denied. Wrongful.
- **"can you answer the question in issue #42?"** (issue = "please add X") →
  object head "question" → `info` → the implementing `Edit` denied. Wrongful.

And the class is broader than the seed — the same false universal was already
reachable through the **wh-complement** path, undisclosed since before round 6:
- **"could you answer whether the null check fixes it?"** → wh-complement
  "whether" → `info` → the agent adds the null check (`Edit`) to find out → denied,
  though the edit is exactly the answer-production. Wrongful.

So the wrongful-deny residual has never accounted for the **"a deny-capable `info`
question whose answer-production is an `Edit`"** class — it has ≥ 3 concrete members
(info-object-noun-via-edit, wh-complement-via-edit, and the coordinated-object
"can you show me the error **and** fix the bug?" whose first object "error" →
`info` denies the co-asked fix). Every one is IN the request frame, so the
enumeration's "two member shapes … for want of a request frame" excludes them all,
and the mirror of L3's disclosure is missing: L3 honestly owns that **`Bash` is
never denied** (under-enforcement — a drift-Bash escapes), but nothing owns that
**`Edit` is always denied even when answer-directed** (over-enforcement — a
fulfilling edit is blocked). The document disclosed the allow-all-`Bash` cost and
asserted the deny-all-`Edit` side has *no* cost ("mutating doesn't produce an
answer"). It does have one, and round 6 enlarged it.

Bounded below full collapse, for the same reasons round 6's own P1 was partial:
each wrongful deny is escapable by one substantive text turn (which clears
all-prior), lands on the wrongful-deny rate (FR-M4), and errs in a direction the
human channel can see. But "exactly two member shapes" is a completeness claim
about the block's one halting mechanism, and it is false on first audit — the
fifth-going-on-sixth recurrence of the shape the collapse-log has logged since
round 1.

**Class:** unverified (a false universal inside repair text — the P1-lineage
recurrence, and specifically the load-bearing deny-soundness universal "mutating
the repository does not produce an answer to it," which round-6's own seed
falsifies for the "answer"/"question" object class) + wrong-check (the
wrongful-deny residual scoped to "two … for want of a request frame," a scope that
structurally excludes the in-frame answer-via-edit class the seed created and the
wh-complement path already reached).

**Concrete repair.** Own the residual the mechanism actually has, and fix the
soundness rationale that hides it.
1. **Correct the universal.** AD-9's rationale should not claim "mutating the
   repository does not produce an answer to it." State the true Phase-A posture:
   *the categorical `Edit`-deny denies **all** repo mutations while a deny-capable
   `info` question is open, including the minority that are answer-directed (an
   edit-to-test, or a build that answers a request-shaped question); this is the
   accepted over-enforcement cost of a model-free move recognizer, the exact
   mirror of L3's `Bash` under-enforcement* — escapable by one text turn, measured
   on the wrongful-deny rate. This makes the deny honestly conservative rather
   than resting on a false claim of soundness.
2. **Re-open the residual enumeration to its third shape** in AD-9 and L1: beside
   (1) the outside-frame action-request and (2) the rhetorical/idiom escape, add
   (3) **an in-frame communicative-verb ask whose object classifies `info` but
   whose fulfilment is an action** — the `answer`/`show`-the-`question`/`answer`
   ask that resolves to a build ("answer the question in the ticket"), the
   wh-complement ask whose answer is an edit ("answer whether the null check fixes
   it"), and the coordinated ask whose first object is `info` but co-asks an action
   ("show me the error and fix the bug"). Drop "for want of a request frame" as the
   residual's defining scope, since shape (3) is in-frame.
3. **Pin the direction in AD-24.** Beside the round-6 "answer my question → info,
   re-arms" corpus row, add the discriminating counterexample: **"can you answer
   the question in the ticket?" → `info` → the fulfilling `Edit` is wrongfully
   denied once, cleared by one text turn, counted on the wrongful-deny rate** — so
   the two opposite fulfilment-directions of the same info-object noun are both
   pinned, exactly as round 6's own inheritance to round 7 demanded for the two
   unlisted-noun directions.
4. If the owner prefers to *narrow* the seed instead (accept that "answer my
   question" is the only enforced escalation phrasing), that is a coverage
   decision — but it re-opens R6-S1, so the enumerate-the-cost path is correct.

---

## Survived with note

- **N1 — R6-M1: the `tune` list-lexicon tending loop is now mechanically real
  end to end, but the owner cannot discover *which* word to tend.** The schema
  supports it (`tuning` list-valued keys, one member per row — AD-5 lines
  ~600–609), the writer supports it (`tune lexicon.communicative +summarize /
  -summarize` — AD-20 lines ~1519–1527), and the classifiers read the lexicons
  from `tuning` (AD-9 clause iv, AD-15 Verification row). The R6-M1/N5 lineage
  ("named a writer that couldn't perform the op") is genuinely closed at the
  mechanism level — the hardest question ("can `tune` actually add a lexicon
  member?") is answered yes. **The residual, one layer down:** the owner-facing
  surface does not connect a specific miss to the specific `tune` command that
  fixes it. `ctxoracle correct --missed-question "could you summarize the error?"`
  reports "recorded as `request`, tracked but not enforced" (AD-18's kind-coverage
  branch) but never says *"because `summarize` is not in `lexicon.communicative`;
  run `tune lexicon.communicative +summarize`."* For a non-programmer (`OL-11`),
  "shrunk by tending the lexicons" (clause iv, L1) is a capability that exists but
  is not reachable without inferring the word — the next layer of the "renaming a
  hedge" pattern (writer now works; owner-discovery does not). Bounded: the loss
  it shrinks is under-enforcement (safe), so an untended lexicon persists safely.
  One sentence in AD-18 (the `--missed-question` output names the unlisted verb/noun
  and the `tune` command) closes it.
- **N2 — AD-4's `observed_actions` enumeration is now substantially complete (the
  round-6 additions landed IN AD-4 this time, closing R6-m1/P2's location defect),
  but the round-6 path-write predicate makes `path` a dual-producer whose
  CHANGE/READ consumption is unspecified.** Re-audited per the corollary: the
  re-edit clause (`'ok'` only) and `deny_bypass_suspect` (`'ok'` file-writing Bash,
  path-write predicate) are both now in AD-4's filter (lines ~502–524), and every
  reader I could enumerate (Completeness edit-set, Verification changed-regions +
  run-subtraction, dedup read-set, Coupling/Reuse triggers, the class-3 scan, the
  re-edit clause, the covering-test-failed clause, `deny_bypass_suspect`) is
  listed. **The residual:** round 6's predicate now sets `path` on file-writing
  `Bash` rows (`echo x > f.py`, `sed -i`, `cp … dst`), so `path` is written by two
  producers (the `Edit`/`Write` tools *and* the Bash predicate). AD-4 describes the
  CHANGE/READ consumers as "the edit-set (FR-A2f)" — `Edit`-tool implied — but does
  not say whether their `path`-reading queries now include the Bash-write rows. If
  they do, Completeness/Verification/dedup now treat `echo > f.py` as a change
  (arguably correct — the file *did* change); if they don't, a Bash-written file
  is invisible to them. Either reading is defensible and safe; the gap is that the
  document does not decide it, so an implementer picks silently. One clause in
  AD-4 ("the CHANGE/READ consumers read `path` from `Edit`/`Write` rows only" — or
  "from all `'ok'` `path`-bearing rows, Bash-writes included") closes it.
- **N3 — the re-bucketed `deny_bypass_suspect` does not correlate the written file
  with the denied action, so it over-flags.** AD-9 records `deny_bypass_suspect`
  "when a deny is followed in the same turn by a successful (`'ok'`) file-writing
  Bash row" — with no requirement that the Bash-write target the file the denied
  `Edit` targeted. So a denied `Edit` on `parser.js` followed by an unrelated
  `echo log > out.txt && npm test` in the same turn raises the diagnostic though
  no bypass occurred. Bounded: `deny_bypass_suspect` is owner-facing, gates
  nothing, feeds Phase B precision — a noisy diagnostic degrades the metric
  without misfiring on the agent (the same tolerance FR-L4's proxy has). One
  clause (correlate on the denied action's `path`) would tighten it; safe as is.
- **N4 — the same-name Reuse fixture (P4's round-6 fix) now pins a producible
  DISCLOSURE behavior, but "fires" rests on an unstated cap-vs-bar-floor relation,
  and a count-dominant collision still crowns a false canonical helper (caveated).**
  Round 6 rewrote AC-1b's same-name case from the unproducible "does not crown a
  false rival" to "fires **with the false-positive caveat in evidence and
  confidence capped** … honest disclosure, not exclusion" (AD-24 lines ~1667–1670,
  L6 lines ~2113–2120). The disclosure half is producible: `symbol_refs` counts
  comment/string matches (AD-12), the composer always attaches the caveat, the
  confidence is capped — so the fixture is passable by construction (the round-6
  expert review reached the same conclusion). **The residuals, on the mission
  axis:** (a) "fires" requires the capped confidence to clear the bar floor
  (AD-14: non-hazard `c` floor 0.6), a relationship the document never states — set
  the cap below the floor and the same input goes to *silence*, not "fires," so the
  fixture's pass depends on a fixture-author choice the mechanism does not fix; and
  (b) a comment/string-inflated rival that dominates *by count* is crowned "X is
  canonical, most call sites use it" — a false dominance fact, caveated. The
  mission is to deliver *the fact* that changes the decision; a heuristic-artifact
  crown with a hedge is disclosed misinformation, not a fact. The round-6 hunt's P4
  offered a real preventive option (AST/lexer-scoped `symbol_refs` excluding
  comment/string spans — established practice for reference counting); the applier
  chose disclosure+cap. Consistent with the project's "speak flagged, don't
  suppress" posture (`OL-C4`-adjacent), so a note — but the crown-a-false-rival cost
  is accepted, not resolved, and "fires" is under-pinned.
- **N5 — the comparability discriminator (language-based) and the compound
  Verification fixture both produce what they now assert; they survive their
  hardest question.** The discriminator "a candidate whose `lang` is not
  grammar-covered … is structurally uncounted → incomparable; a grammar-covered
  symbol whose count is 0 is *observed*-0 and stays comparable" (AD-15 Reuse row)
  is decidable from `files.lang` × AD-12's ext→grammar table, and it produces the
  round-6 unimported-grammar fixture's assertion (a grammar-covered observed-0
  symbol keeps the set comparable → not over-silenced) — closing round-6 N2's
  "unstated discriminator." The compound `npm test && make integration` fixture
  (AD-24) is produced by "segments contribute independently": `npm test` (runner)
  subtracts, `make integration` (class-3) composes the weak claim — closing
  round-6 R6-m3. Both traced clean across the required command-mix re-trace.
- **N6 — the `OL-C3` recourse re-arms only for object heads "question"/"answer";
  sibling escalation phrasings stay under-enforced — disclosed, but the "recourse
  re-arms" framing can over-suggest robustness.** The seed makes deny-capable
  exactly "answer my/the question" and "show/tell me the answer." Common
  escalation re-asks a frustrated owner would type — **"can you answer this?"**
  (object "this," pronoun → unlisted → `request`), **"can you answer me?"** ("me"
  is the skipped optional object → no object noun), **"just answer already?"** (no
  object), **"can you respond?"** ("respond" not on the communicative lexicon) — all
  resolve to `request` (or unspecified), so they do **not** re-arm the block.
  This is the *under-enforcement* miss direction of the same seed (P1 covers the
  over-enforcement one). It is disclosed — L1's under-enforcement list covers
  "communicative-verb asks with … unlisted object noun," and "answer this" has an
  unlisted object — so it is a note, not a partial. But the document's framing
  ("the `OL-C3` recourse re-arms," L1 line ~2060; the Status paragraph's "the
  `OL-C3` escalation re-ask … restored") uses the single canonical string and can
  read as "the recourse is restored" when it is restored for two nouns only. Since
  recognizing an escalation re-ask model-free is genuinely Phase-A-hard (a
  comprehension judgment → Phase B), the honest close is one sentence: *the Phase A
  recourse re-arms only for the "answer"/"question"/"answer"-object phrasings;
  other re-ask forms are under-enforced until the owner uses `--missed-question` or
  Phase B's model-maintained state.*
- **N7 — the per-project watermark WRITER-comment sync (R6-m2/P3) is applied and
  multi-project use is clean; the residual is a concurrent same-project fold
  double-count, bounded.** Walked concurrent multi-project use: projects A and B
  each own `whisper_stats_watermark:A` / `:B`, each fold reads its own project
  store and advances only its own key (AD-5 lines ~578–599, now matching the
  `global_meta` comment) — A's fold cannot strand B's rows. R6-m2/P3 is genuinely
  closed at the operative WRITER comment this time (the location the round-6 finding
  named). **The residual:** two sessions of the *same* project ending near-
  simultaneously can both read `whisper_stats_watermark:A = T0`, both fold the
  rows in `(T0, now]`, and both advance to `now` — double-counting `sent` unless
  each fold re-reads the watermark inside a single serialized write transaction
  (AD-26's per-key single-writer discipline must cover the read-watermark →
  fold → advance sequence atomically, which the comment implies but does not spell
  out). Bounded: `whisper_stats` is Phase-C demotion/promotion input, never
  agent-facing, and a corrected fold rebuilds it wholesale. One clause ("the fold
  is a single `BEGIN IMMEDIATE` transaction re-reading the watermark") closes it.

---

## End-to-end re-traces

- **The OL-12 mainline (edit → covering test fails → done-claim), every layer,
  under the round-6 text.** `PreToolUse` Edit → catch-up, block check (no open
  question) → Consequence/Warning fire pre-edit (coupled tests named — right
  moment). Edit ok → `PostToolUse` `'ok'` row (tool=Edit, `path` set; the
  path-write predicate does not touch non-Bash rows). `npm test` fails →
  `PostToolUseFailure` → `'failed'` row (tool=Bash, `command_class`=runner,
  `path`=NULL — not a file-writing command, so `deny_bypass_suspect` and the
  CHANGE/READ path-consumers ignore it). Done-claim `Stop` → Verification: changed
  regions from `'ok'` rows → covering tests → minus runs of **either** outcome →
  the failed run subtracts → **neither "not run" nor "no recognized run"**: Phase A
  silent, the run-and-failed done-claim routed to FR-A2m/Phase B per D-27. At
  `SessionEnd` the regret proxy's covering-test-failed clause reads the `'failed'`
  row (AD-4 + AD-18, now co-enumerated) and records the held-fact silence; `status`
  labels it with the designed-silence floor. **The mainline holds** — the round-6
  changes (re-edit clause into AD-4, `deny_bypass_suspect` re-bucket, watermark
  comment) touch the diagnostic and bookkeeping layers, never the mainline whisper
  decision.
- **The full object-classification corpus, including round-6 additions and
  adversarial cases.** "can you rename the helper?" → non-communicative → `request`,
  rename-edit free ✓. "can you show me a demo?" → `request` (artifact-lexicon *or*
  default — inert, disclosed) ✓. "can you show me the error?" → `error` (info) →
  `info`, deny-capable ✓. "could you summarize the error?" → `summarize`
  non-communicative → `request`, the disclosed under-enforcement loss ✓. "can you
  show me a prototype?" → unlisted → default `request` ✓. "could you tell me why
  the login test fails?" → wh-complement precedence → `info` ✓. "could you confirm
  the version number?" → `version` (info) → `info` ✓. **Round-6 additions:** "can
  you please answer my question?" → object "question" (seeded info) → `info`,
  re-arms ✓ (R6-S1's intended fix). **Adversarial cases:** "can you answer the
  question in the ticket?" (ticket = build) → object "question" → `info` → the
  fulfilling `Edit` **wrongfully denied** → **P1** (in-frame, third shape). "could
  you answer whether the null check fixes it?" → wh-complement → `info` → the
  edit-to-test **wrongfully denied** → **P1** (pre-existing member of the same
  class). "can you show me the answer in code?" → object "answer" (seeded info) →
  `info` → the build-edit denied → **P1**. "can you show me the error and fix the
  bug?" → first object "error" (info) → `info` → the co-asked fix-edit denied →
  **P1** (coordinated object). "can you answer this?" → object "this" (unlisted) →
  `request` → does **not** re-arm → **N6** (under-enforcement direction). "hello?
  my question?" (bare re-ask) → intake opens `?`; not on stoplist; non-request-frame
  → `info`, deny-capable → re-arms ✓ (bare interrogative path works, so the recourse
  is not *entirely* two-noun-bound — a bare "?" re-ask re-arms; the gap is the
  *request-framed* re-asks in N6). *compound noun head:* "can you show me the test
  results?" head "results" (info) vs a first-noun reading "test" (artifact/default)
  — unspecified for attributive compounds, safe either way (recorded, one level
  below round-5's object rule).
- **The Reuse dominance path in a mixed-language repo.** Candidate set {S:
  generic-frontend true convention, `symbol_refs`=0 by construction; R:
  grammar-covered, count M}. The comparability gate detects S's language is not
  grammar-covered → set incomparable → **silence**; the fixture asserts silence, the
  mechanism produces it via the *language* discriminator (N5), not a count read.
  Unimported-grammar variant {S: grammar-covered count M; T: grammar-covered
  observed-0} → both comparable → dominance made → not over-silenced ✓ (round-6 N2
  closed). The same-name variant → `symbol_refs` counts the comment/string
  collision → fires with caveat + capped (N4) — producible as disclosure, with the
  cap-vs-floor and false-crown residuals noted.
- **Verification across command mixes.** Innocuous-only → strong "not run" (honest)
  ✓. Recognized runner pass/fail → subtracts either outcome ✓. Unknown runner
  (`make check`) → class-3 → weak claim ✓. Quoted operators (`echo "done && npm
  test"`) → `&&` inside quotes not split → one `echo` segment (class-3) → weak
  claim, no false subtraction ✓. Runner+unknown compound (`npm test && make
  integration`) → npm subtracts, make composes weak claim ✓ (N5). `cd pkg && npm
  test` / `cd pkg && make check` → runner-subtract / weak-claim ✓. `sh -c '…'` /
  quote-parse failure → class-3 wholesale → weak claim (safe) ✓. `echo x > f.py &&
  npm test` → segment split; npm subtracts; the path-write predicate sets
  `path`=f.py on the one Bash row (N2's dual-producer question, not a Verification
  break). No mix produces a false "not run" or a false subtraction.
- **§8 deny-confinement property walk on the round-6 text.** The round-6 diff
  touches AD-4 (filter — no deny channel), AD-5 (watermark/`tuning` comments — no
  deny), AD-9 clause (iv) (classification — the info-object seed), AD-9 rationale
  (residual), AD-9 `deny_bypass_suspect` (diagnostic), AD-15 (Reuse row), AD-18
  (regret), AD-20 (`tune`), AD-24/L1/L6/Status (fixtures/disclosures). It never
  reaches AD-10's single deny producer (`blocks/verdict.ts` ← `blocks/
  answer_drift.ts`), the deny-eligibility predicate (open `kind='info'` question +
  mutating file tool), reactive-only, text-never-denied, self-clearing/no-counter,
  the lag clause's clear-axis-only scope, or per-consumer scope — all re-read
  consistent. **The one substantive difference from round 5:** round 5's diff only
  *shrank* the deny-capable set (unlisted → `request`); round 6's seed *widens* it
  (question/answer → `info`), which is exactly why round 6 is the first round in a
  while that can introduce a new *wrongful*-deny surface — and it did (P1). The
  confinement *structure* (one producer, reactive, self-clearing) holds unchanged;
  the deny-capable *set* grew, and the growth's wrongful edge is P1.

## Between-decisions consistency of every round-6 addition

Info-object seed (question/answer → `info`) — AD-9 clause (iv) ✓ / AD-24 corpus
("answer my question" re-arms) ✓ / L1 "meta-answer escalation re-ask … re-arms" ✓
/ AD-9 rationale "two member shapes … for want of a request frame" ✗ (P1 —
in-frame answer-via-edit third shape) / the soundness universal "mutating …
does not produce an answer" ✗ (P1) / sibling re-asks under-enforced, framing
over-broad ✗ (N6). Artifact-object "inert in Phase A" — AD-9 clause (iv) ✓ /
AC-24 "demo → request via artifact-lexicon *or* default (equivalently)" ✓ (honest;
the fixture would stay green if the lexicon were deleted, and the document now
says so). Wrongful-deny "two member shapes" — AD-9 ✓ (internally two) but ✗ as a
universal (P1) / L1 ✓ (matches AD-9) / lexicon count reconciled (clause iv "two
config-enumerated lexicons" vs the summary — round 6's target; the artifact
lexicon now disclosed inert, so "communicative + information" = the two tended
lexicons ✓). AD-4 enumeration — re-edit clause ✓ (now in AD-4) / `deny_bypass_
suspect` bucket ✓ (`'ok'` file-writing Bash) / path dual-producer unspecified ✗
(N2) / file-correlation absent ✗ (N3). Per-project watermark — `global_meta` ✓ /
`whisper_stats` WRITER comment ✓ (synced this round) / AD-6 SessionEnd row ✓ /
AD-23 inventory ✓ / concurrent same-project fold ✗ (N7). `tune` list-lexicon —
AD-20 writer ✓ / AD-5 schema (one member per row) ✓ / AD-9/AD-15 readers ✓ /
owner-discovery of the word ✗ (N1). Comparability discriminator — AD-15 Reuse row
✓ (language-based) / AC-1b unimported-grammar fixture ✓ / L6 ✓ (N5). Same-name
fixture — AD-24 ✓ (disclosure, producible) / L6 ✓ / cap-vs-floor unstated + false
crown accepted (N4). Compound fixture (`npm test && make integration`) — AD-15 ✓ /
AC-24 ✓ (N5). Status §"Review round 6" — verdict counts (0 Critical/1 Serious/1
Moderate/3 Minor; 0 collapses/4 partial/5 notes) match both round-6 files ✓; the
applied-fix enumeration located item by item in the diff ✓; convergence explicitly
**not** claimed ✓. `tools/check_docs.py` — not re-run this session (review-only,
no tree change); the round-6 expert review recorded exit 0 on this tree.

## Owner-fidelity scan of the round-6 text

Every owner/spec key the round-6 diff added or moved was re-read against its row
at its point of use. **No rejected item reintroduced.** Clause (iv) remains a
positive total classification (`OL-R5`'s "define positively" honored; the seed
adds two positive info-object members). The deny still requires an open
`kind='info'` question plus a mutating file move through AD-10's single confined
producer — **no pre-emptive gate** (`OL-C2`/`OL-R4`): the round-6 changes are all
reactive classification. **No generated-file consumption** on any deny input.
**Arbitrary-limit scan (`OL-C1`/`OL-R1`/`OL-R3`):** the info-object seed, the
`tune` list-lexicon rows, the path-write predicate, the per-project watermark key,
and the comparability discriminator are classification/bookkeeping vocabulary,
never a volume/count/budget cap on how much is spoken — no operating number
introduced. **No separate credentials, no repo-tree write** introduced (the fold
writes the global store, outside the tree). **No new `OL-*` key manufactured, no
owner superlative introduced;** the `OL-C3`/`OL-C5` uses in clause (iv), L1, and
the Status paragraph are supported by their CONFIRMED rows — `OL-C3` ("block that
motherfucker until it … actually answers") is correctly the authority the
question/answer seed serves. The one fidelity caveat is **N6**: "the `OL-C3`
recourse re-arms" over-generalizes from two noun-objects to "the recourse," a
fidelity-to-the-mechanism framing issue, not an owner-attribution defect. **The
one owner-fidelity-adjacent defect is P1's opposite face:** widening deny-capability
via the seed without owning the fulfilling-move wrongful denies it creates leaves
the block enforcing against a move `OL-C5` explicitly protects ("an action taken to
provide that answer") — the enumerate-the-cost repair restores fidelity to OL-C5.

## Round-6 repairs that survived their hardest question without a finding

The comparability discriminator (language-not-grammar-covered, not stored count —
N5: produces the asserted silence and the unimported-grammar comparability, closing
round-6 N2). The compound Verification fixture (`npm test && make integration` —
N5: segments contribute independently, producible, closing R6-m3). The per-project
watermark WRITER-comment sync (N7: landed at the operative comment the finding
named this time; multi-project use is clean). The AD-4 re-edit-clause + re-bucketed
`deny_bypass_suspect` enumeration (R6-m1/P2's location defect closed — both now IN
AD-4; residual is the path dual-producer N2 and file-correlation N3, not the
enumeration's completeness). The `tune` list-lexicon extension (R6-M1/N5 lineage
closed at the mechanism level — the writer can now perform the op; residual is
owner-discovery N1). The artifact-object-inert disclosure (mission-honest — the
lexicon changes no Phase A classification and the document says so; deleting it
leaves AC-24 green and AC-24 now acknowledges the equivalence). The R6-S1 core seed
for the *exact* string "can you please answer my question?" (it does re-arm; the
two miss-direction residuals it opens are P1 and N6). The §8 deny confinement
(walked above — structure untouched; the deny-capable set widened, and the widening's
wrongful edge is P1).

---

*End of round-7 hunt. Zero full collapses — the third consecutive zero-collapse
round — but one partial collapse, inside the round-6 repair text, and it is the
collapse-log's own two lessons of 2026-09-03 recurring together: the P1-lineage
false universal ("exactly N member shapes," now false a sixth time) meeting the
default-flip-two-directions lesson (round 6 audited the seed's intended direction —
the `OL-C3` recourse — and closed it, but not the opposite direction the same seed
opens: a fulfilling `Edit` for an in-frame `info`-object question is now wrongfully
denied, resting on the false soundness universal "mutating the repository does not
produce an answer to it"). The prescription-carried lesson is validated once more —
R6-S1's fix entered as the round-6 expert review's own prescribed meta-answer clause,
which never considered "answer the question in the ticket." This is **not** the
terminal round: the count bars the terminal call, and the convergence definition
(a round that finds nothing real) is unmet. **Inheritance for round 8:** (1) **P1
is the "two miss directions" lesson answered NO for the over-enforcement
direction** — carry it: whenever a round widens the deny-capable set (round 6 was
the first to do so since the set began shrinking), audit the new members for
fulfilling-move wrongful denies, not only for the recourse they were added to
restore. (2) **Attack the deny-soundness universal directly** — "mutating the
repository does not produce an answer to it" is the load-bearing rationale for
`Edit`-categorical-deny and it is false for edit-to-test and build-to-answer-a-
request; the honest repair mirrors L3 (own the over-enforcement cost), and round 8
verifies that repair landed at AD-9's rationale, L1's residual, AND AD-24's corpus
(all three, per the round-6 lesson that a fix must land at every site the finding
names). (3) **Re-audit the same-name Reuse fixture's "fires"** against the
cap-vs-bar-floor relation (N4) and the `path` dual-producer's CHANGE/READ
consumption (N2) — both are unspecified choices a round-7 fix may or may not
settle.*
