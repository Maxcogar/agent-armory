# Independent collapse-hunt, round 9 — Phase A architecture (2026-09-03)

**Artifact:** `docs/architecture-phase-a.md` at current HEAD (`780d5ec`, "apply
all round-8 review findings"); the round-8 repairs are that commit, read as
`git show 780d5ec -- middleware/context-oracle/docs/architecture-phase-a.md`
in full.
**Axis:** mission-fidelity only. Reviewer is not the author of the document or
of any prior review. Read in full, in order, before the attack:
`docs/collapse-log.md` (its three 2026-09-03 entries first — rounds 6, 7, 8
lessons — then 2026-08-29 and the rest, esp. 2026-08-25's convergence/terminal
definition), `OWNER-LEDGER.md` (CONFIRMED only),
`middleware/context-oracle/CLAUDE.md`, `docs/specs/spec-context-oracle.md`
(§8, §11.5, §12, §13, §14), both round-8 review files, then the architecture
end to end plus the round-8 apply diff.
**Charter additions honored:** (1) The round-8 fixes were largely prescribed by
the round-8 reviews themselves (the R8-M1 fix from the round-8 expert review's
"however the label arose (by object or by the no-object branch)"; the residual
re-scope from the round-8 collapse-hunt's P1 item 2 "in-frame or object-less …
fulfilment-by-mutation, not object-shape"). Reviewer repair text carries no
verification of its own (collapse-log 2026-08-29 Lesson 1); it was attacked here
as author text — and the P1 partial below is precisely a prescription-carried
defect, the round-8 applier having faithfully carried forward the round-8
collapse-hunt's own too-narrow "in-frame" scope word. (2) The round-8 central
move — generalizing the wrongful-deny residual member (3) to a **class** — was
tested for honesty vs reduction on both of the charter's axes: is the class too
large (does it stop serving OL-C3)? and is "escapable by one answering turn"
true for every member? (3) The P1 lineage's seventh recurrence (round-8 P1) was
checked for actual closure: I hunted an `info`-classified, mutation-fulfilled ask
NOT covered by the class wording (found: the out-of-frame branch, incl. the
class's own two out-of-frame imperative examples — P1) and an ask the new
object-head / coordinated rules route to `info` that should be `request` (found:
the post-head-modifier over-match, N1 — owned by member (3)). (4) For every
fixture assertion a round-8 repair added (the version / version-number rows, the
coordinated row, the receptacle assertion), the mechanism sentence that produces
it was named before the fixture was accepted. (5) Any terminating claim
("complete as a *class*", "ending the P1-lineage recurrence at its root") was
verified for completeness.
**Method:** each round-8 repair's hardest question, answered from the document,
spec, and ledger alone; the required end-to-end re-traces (OL-12 mainline; the
full object-classification corpus including round-8 additions and my adversarial
shapes — possessive, PP, gerund, nested coordination, wh-object; the §8
deny-confinement walk on the round-8 text; an owner-fidelity scan); between-
decisions consistency of every round-8 addition. Findings were not manufactured
to avoid an empty report; the repairs that survived their hardest question are
recorded by name. `check_docs.py` was run this session (exit 0) as the mechanical
floor; my axis is mission-fidelity, not the checker.

## Verdict: DOES NOT SURVIVE

- **Collapses: 0**
- **Partial collapses: 1** (P1)
- **Survived with note: 3** (N1–N3)

For the **fifth** round running, no full collapse: the §8 confinement property
walk holds (the round-8 diff touches classification, a schema comment, a
diagnostic receptacle, the corpus, and two disclosures; the single deny producer
at AD-10, the `kind='info'`+mutating-file deny-eligibility predicate,
reactive-only, text-never-denied, self-clearing/no-counter, per-consumer scope,
and the lag-clause's clear-axis-only scope are all textually untouched and
re-read consistent), the OL-12 mainline is clean at every layer under the round-8
text, the `deny_bypass_suspect` correlation now has a **named receptacle**
(the denied target path on the `kind='deny'` `whisper_audit.evidence_json`,
covering `Edit`/`Write`/`NotebookEdit` — R8-m1 and N5a both closed), the "version
number → info" corpus/rule contradiction R8-S1 named is gone, and the false
soundness universal remains absent from the document.

But one real defect lives inside the round-8 repair text, and it is the
collapse-log's own recurring lesson validated an **eighth** time. **P1** is the
P1 lineage (round-1-S2 → 3-C1 → 4-P1 → 5-P1 → 6-P1 → 7-P1 → round-8-P1 →
**this**): the wrongful-deny residual member (3), generalized to a *class* in
round 8 expressly "to end the P1-lineage enumeration recurrence at its root," is
scoped by the qualifier **"any in-frame ask"** — where "in-frame" means "in the
request frame" (the document's own contrast term: member (1) is the ask "phrased
**outside** the request frame entirely"). That scope **excludes** the
out-of-frame branch — every ask the non-request-frame rule (clause iv's first
bullet) classifies `info`, whose fulfilment or co-ask is a mutation — including
**two of member (3)'s own four illustrative examples**, "answer whether the null
check fixes it" and "show me the error **and** fix the bug," both bare
imperatives with no "can/could/will/would/please … you." The completeness claim
"complete as a *class*, not an enumeration of phrasings" is therefore false on
first audit: the class predicate, offered to close the enumeration gap, re-opens
it with a frame qualifier narrower than the class it must name, and the document
lists its own uncovered members as members. The generalization did not close the
lineage; it re-scoped it.

A round with a live partial is not the terminal round; per the convergence
discipline the count bars the terminal call, and the collapse-class trajectory
(5 → 6 → 1 → 1 → 0 → 0 → 0 → 0 → **0**) continues to converge while the partial
holds at 1 for the fifth consecutive round.

---

## Partial collapses

### P1 — The round-8 generalization of member (3) to a class is scoped "any **in-frame** ask," a frame qualifier narrower than the class it must name: it excludes the out-of-frame branch (clause (iv)'s non-request-frame → `info` rule) whose fulfilment-is-a-mutation asks — including member (3)'s **own two out-of-frame imperative examples** — so the completeness claim "complete as a *class*, not an enumeration of phrasings … ending the P1-lineage enumeration recurrence at its root" is false on first audit, the eighth recurrence of the shape, prescription-carried

**Where:** AD-9's residual class (lines ~925–936: *"(3) **any in-frame ask that
classifies `info` (deny-capable) but whose fulfilment — or a co-asked action — is
a repo mutation.** This is one class, however the `info` label arose: … a
wh-complement ask whose answer is an edit ('answer whether the null check fixes
it'), … or a **coordinated** ask pairing an `info` question with an action
co-ask ('show me the error **and** fix the bug'). … complete as a *class*, not an
enumeration of phrasings"*) × the request-frame definition (line ~771:
*"A **request-frame** interrogative ('can/could/will/would/please … you …' +
verb)"*) × member (1)'s contrast term (lines ~917–919: *"(1) an action-request
**phrased outside the request frame entirely** ('mind fixing X?'), … classified
`info` for want of a request frame"*) × the non-request-frame → `info` rule that
produces the excluded branch (lines ~769–770: *"A **non-request-frame**
interrogative ('why does X fail?', 'did you run the tests?') classifies
`kind='info'` — deny-capable"*) × L1's mirror (lines ~2173–2182, same "any
in-frame ask" scope and the same "show me the error and fix the bug" out-of-frame
example) × the Status round-8 text (lines ~2494–2498: *"generalized to a class —
any in-frame ask that classifies `info` but whose fulfilment or a co-asked action
is a repo mutation — so lexicon or parse gaps that route more asks to `info` fall
into it rather than adding an (N+1)th member shape, **ending the P1-lineage
enumeration recurrence at its root**"*) × the round-8 collapse-hunt's P1 repair
item 2, which the applier carried ("shape (3) = an **in-frame** or object-less
deny-capable `info` ask") — the prescription's own too-narrow scope word.

**Collapse question.** *The document lists exactly two illustrative members of
class (3): "answer whether the null check fixes it" and "show me the error **and**
fix the bug." Neither carries "can/could/will/would/please … you" — both are bare
imperatives, which the document's own definition puts **outside the request
frame** (member (1): "phrased outside the request frame entirely"). Yet class (3)
is scoped "any **in-frame** ask." Max types the document's own example, "show me
the error and fix the bug?" (bare imperative). Clause (i)–(iii) opens the row;
clause (iv)'s first bullet — non-request-frame interrogative → `kind='info'` —
classifies it `info` → deny-capable; the co-asked "fix the bug" `Edit` is denied
("answer Max's question first"). Which of L1's three members owns that wrongful
deny? Not (1): it is not a **pure** action-request — it pairs an `info` ask with
the action, which is why the document files it under (3), not (1). Not (2): not
rhetorical. Not (3) **as scoped**: "in-frame" is the request frame, and this ask
is out of it. Cite the line that puts the document's own example inside the class
the document says is "complete as a class, not an enumeration of phrasings."*

**Why the document's answer fails.** There is none, and the failure is internal
and self-illustrating. "in-frame" is not loose wording rescued by the following
"however the `info` label arose": grammatically, "any **in-frame** ask … however
the `info` label arose" makes "in-frame" the head qualifier and "however the
label arose" its subordinate — the subordinate ranges over *how an in-frame ask
acquired the `info` label* (via an info-object, a wh-complement, the no-object
branch, or a communicative conjunct), **not** over frame membership. The
document's own contrast fixes the meaning: member (1) is the ask "phrased
**outside** the request frame entirely," so member (3)'s "in-frame" is "inside
the request frame." Under that meaning:

- The **non-request-frame → `info`** rule (clause iv, first bullet) is a live,
  reachable producer of `info`-classified asks that are **not** in the request
  frame. Any such ask whose fulfilment or co-ask is a mutation is an
  `info`-classified, mutation-fulfilled ask that "any in-frame ask" excludes.
  Concretely: **"show me the error and fix the bug?"** (out-of-frame coordinated
  imperative) → non-request-frame → `info` → the co-asked `Edit` denied; and
  **"answer whether the null check fixes it?"** (out-of-frame wh imperative) →
  non-request-frame → `info` → the fulfilling `Edit` denied. Both are the
  document's **own** class-(3) examples, and the scope word excludes both.
- These are not owned by member (1) either. Member (1) is the **pure**
  action-request out of frame ("mind fixing X?"); a coordinated `info`-plus-action
  out-of-frame ask, or an out-of-frame wh-`info` ask whose answer is an edit, is
  not a pure action-request — the document created the "coordinated" and
  "wh-complement" examples specifically to live in member (3). So they fall in a
  gap between (1) and (3): the exact gap the generalization-to-a-class was
  supposed to eliminate ("lexicon or **parse** gaps that route more asks to
  `info` fall into it rather than adding a fourth shape" — but the non-request-
  frame branch is a *classification* path, not a parse gap, and the "in-frame"
  scope shuts it out).

So the round-8 claim, restated in three places (AD-9 "complete as a class"; L1
"a *class*, not a phrasing list, so lexicon or parse gaps … fall into it"; Status
"ending the P1-lineage enumeration recurrence at its root"), is false on the
first ask a mission-literate skeptic makes: *is your own example inside your own
class?* It is not. This is the collapse-log's round-8 Lesson 2 — "A completeness
claim over an open set must be a class predicate, never a list" — met and **not
satisfied**: round 8 wrote a predicate, but bounded it with a list-era frame
qualifier, so the predicate is a list of frames in disguise. The recurrence the
generalization was built to end is live an eighth time, and it entered as
prescription-carried text: the round-8 collapse-hunt's own P1 repair prescribed
"shape (3) = an **in-frame** or object-less deny-capable `info` ask," and the
applier faithfully carried the reviewer's too-narrow scope word (collapse-log
2026-08-29 Lesson 1 — a reviewer's repair prescription carries no verification of
its own).

**Bounded below full collapse**, for the reasons every P1-lineage member has been
partial, and this one sits at the milder end of partial — a reviewer could
defensibly file it as a strong note, and the three factors that keep it a partial
rather than a note are stated so the call is auditable:

1. The **actual over-enforcement is still fully and honestly disclosed** by the
   universal at line ~909 — *"it denies **every** repo mutation while a
   deny-capable `info` question is open. That over-enforcement … is the accepted
   cost of a model-free recognizer."* That universal is the true complete cost
   statement; member (3) is its shape-characterization. Nothing about the block's
   real cost is hidden, and every wrongful deny — in-frame or out — lands on the
   wrongful-deny rate regardless of which member "owns" it. This is why it is not
   a Serious/full collapse.
2. **Escapable by one answering turn holds for every member** (verified below,
   re-trace 2): the clear recognizer clears all-prior on any substantive text
   turn, which is never a tool action and so is never denied — the out-of-frame
   members escape exactly as the in-frame ones do.
3. It is **owner-visible** (Max sees his own "show me the error and fix the bug"
   go part-denied) and human-channel-guarded (`FR-L6`).

It is a partial and not a note because: (a) the charter's own hunt — *find an
`info`-classified, mutation-fulfilled ask NOT covered by the class wording* —
returns a positive, and the positives are the document's own examples; (b) the
residual member-characterization is the P1-lineage locus this series has scored
as a partial for four straight rounds, and the round-8 fix's stated purpose was
to end it "at its root," which is falsified; (c) "in-frame" contradicts the
class's own examples within the same passage — an internal inconsistency in the
soundness-critical residual, which "I can't cite a resolving line" (the collapse
test's rebuild-or-remove trigger) rather than a hedge.

**Class:** unverified (a false completeness universal inside repair text — the
P1-lineage recurrence, here the "complete as a *class*, … ending the recurrence
at its root" claim, which the document's own out-of-frame examples falsify) +
wrong-check (the residual generalized to a class but re-bounded by the frame
qualifier "in-frame," a scope narrower than the class of `info`-classified
mutation-fulfilled asks the block actually produces — the non-request-frame
branch is shut out, so the same enumeration gap survives one branch over).

**Concrete repair.** Delete the frame qualifier from the class predicate and
scope member (3) solely by its true unifying property — fulfilment-by-mutation,
independent of frame — at all three sites (per the round-6 lesson that a fix must
land at every site the finding names):

1. **AD-9 (lines ~925–936).** Replace "any **in-frame** ask that classifies
   `info` …" with **"any ask that classifies `info` (deny-capable), *however the
   `info` label arose* — request-frame, non-request-frame, or coordinated —
   whose fulfilment or a co-asked action is a repo mutation."** Keep the four
   examples; they are now all inside the predicate. Note that under this
   predicate member (1) — an out-of-frame **pure** action-request "mind fixing
   X?", classified `info`, fulfilment a mutation — is itself an instance of the
   corrected (3); either **collapse (1) into (3)** (leaving (2) rhetorical + (3)
   the mutation-fulfilled class, the honest two-shape residual) or keep (1) as
   the named "pure out-of-frame action-request" sub-shape and state explicitly
   that (3) subsumes it. Do not leave (1) reading as a *disjoint* shape while (3)
   is scoped "in-frame" — that is the split that reads as two shapes but leaves
   the coordinated/wh out-of-frame case owned by neither.
2. **L1 (lines ~2173–2182).** Same edit; drop "in-frame," state the frame-
   independent predicate, and keep "so lexicon **or parse or frame** gaps that
   route more asks to `info` fall into it" so the class genuinely absorbs the
   non-request-frame branch it currently excludes.
3. **Status (lines ~2494–2498).** Correct the closure claim: the class is scoped
   by fulfilment-by-mutation, not by frame; do not restate "ending the P1-lineage
   recurrence at its root" until the predicate covers the non-request-frame
   branch, because that is the branch the round-9 audit found uncovered.
4. **AD-24 corpus (lines ~1783–1799).** The corpus pins the **in-frame**
   coordinated row ("can you answer my question **and** fix the bug?" → `info`) —
   which the current predicate covers. Add the **out-of-frame** coordinated /
   wh-imperative row the prose already uses as an example ("show me the error and
   fix the bug?" → non-request-frame → `info` → co-asked `Edit` wrongfully denied
   once, residual member (3)), so the corpus pins the malign out-of-frame
   representative the "in-frame" scope currently strands — exactly as round 8
   learned to pin the malign object-less representative, not only the benign one.

If the owner instead prefers member (3) to remain request-frame-only, then the
out-of-frame coordinated/wh cases must be owned somewhere — either as a stated
member or by widening member (1) beyond "pure action-request" — so the
enumerate-the-cost path (1–4) is the correct one, and it is the exact mirror of
the round-8 repair the object-less case already received.

---

## Survived with note

- **N1 — The round-8 head-extraction rule "the head is the **rightmost** noun"
  is correct only for **pre-head** modifiers (its two examples, "version number",
  "test results"); for **post-head** modifiers (a PP or relative clause, common
  in natural asks) the rightmost noun is the modifier's noun, not the syntactic
  head, so the rule's stated property "an incidental listed modifier does not
  classify the object" is false there — with both error directions, the
  over-direction owned by member (3) and the under-direction touching the
  OL-C3-recourse-preservation the "question"/"answer" lexicon entry nominally
  guarantees (canonical verbatim re-ask recourse unaffected).** The rule (AD-9
  lines ~774–778): *"its head is the rightmost noun of that phrase — attributive
  modifiers are ignored ('the version number' → 'number') — and only the head is
  matched against the lexicons (never a bag-of-words scan, so an incidental
  listed modifier does not classify the object)."* Both worked examples are
  **pre-head** compounds (modifier + head, head rightmost). For a **post-head**
  modifier the rightmost noun sits *inside* the modifier:
  - *Over-direction (owned member (3)):* "can you show me the **file** with the
    **error**?" → NP "the file with the error", syntactic head "file"
    (artifact-lexicon), but rightmost noun **"error"** (info-lexicon, inside the
    PP "with the error") → `info` → deny-capable → the build-`Edit` wrongfully
    denied. Here an *incidental listed modifier's noun* **did** classify the
    object — the exact thing the rule's stated property says cannot happen. It is
    owned (in-frame, member (3), escapable), so it is a note, not a fresh
    collapse; but the rule's soundness property is falsified for this common
    shape.
  - *Under-direction (recourse-preservation):* "can you please **answer** my
    **question** about the **parser**?" → NP "my question about the parser",
    syntactic head "question" (the entry line ~809–811 exists "to preserve the
    `OL-C3` recourse"), but rightmost noun **"parser"** → unlisted → `request` →
    **not** deny-capable → the recourse-preservation the "question"/"answer"
    lexicon nominally guarantees is defeated for a natural escalation phrasing.
    Bounded because the **canonical** recourse — a verbatim re-ask of the
    *original* question (line ~838, "the verbatim re-ask, the spec's thrice-named
    recourse, always works"; the original "why does the login test fail?" is
    non-request-frame → `info`) — is unaffected; only the "answer my question
    about X" meta-escalation with a topic PP is under-enforced.
  This is the round-8 collapse-hunt's **N1 (parse under-specification), only
  partially closed**: round 8 defined the head rule for **compounds** (rightmost
  = head) but the definition is wrong for **post-head modifiers**, and PP/gerund/
  clause objects remain unpinned — so the Gate-A "no inline architectural calls"
  attestation (line ~1929) is still untrue for those shapes. One sentence fixes
  it: "the head is the syntactic head — the rightmost noun **before** any
  post-head PP or relative clause; a listed noun inside a post-head modifier does
  not classify the object" (or "Phase-A-first-noun / Phase-B-precise"). Safe as
  is because the over-direction is owned by member (3) and the under-direction is
  `FR-B5`-safe with the canonical recourse intact — but the rule's stated
  property is false as written.

- **N2 — The "version number → `request`" re-pin (R8-S1's corpus reconciliation)
  routes a whole class of genuine information questions — a compound whose
  information word is a *modifier* and whose head is unlisted ("the version
  number", "the error count", "the error message", "the output format") — to
  `request`, non-deny-capable, disarming the `OL-C3` recourse for the
  request-frame phrasing of those questions; it is the `FR-B5`-safe direction and
  human-guarded, but it is a real reduction of `OL-C3` coverage that the corpus
  now pins as intended, and R8-S1's own prescribed `OL-C3`-safe carve-out was
  dropped.** R8-S1 offered two reconciliations of the "version number" row: (a) a
  carve-out — "if the head is unlisted but an earlier noun is on the
  information-object lexicon, the object is `info` (**the safe direction for
  OL-C3**)"; or (b) re-pin the row to the pure rightmost-head rule. The applier
  chose (b): "could you confirm the version **number**? → `request` (head
  'number', unlisted)" (AD-24 lines ~1787–1789). The choice is **defensible on
  `FR-B5` grounds** — the carve-out (a) has its own over-enforcement edge ("can
  you show me the error **handler**?" where the handler must first be built →
  carve-out → `info` → wrongful deny of the build), so re-pinning to `request`
  errs toward under-enforcement, the answer-drift-safe direction. But the
  mission-fidelity cost is real and now *pinned as intended behavior*: "could you
  confirm the version number?" is as plain an `OL-C3` question ("if i ask a
  question, then it needs to be answered") as exists, and the block will not
  enforce it in the request-frame phrasing. Bounded: the non-request-frame
  phrasing of the same question ("what is the version number?") stays
  deny-capable, and the human channel guards the miss. Note, not partial: it is
  the `FR-B5`-elected safe horn of a genuine trade, disclosed by the corpus and
  by L1's low-coverage ledger. The round-10 sharpening is whether the dropped
  `OL-C3`-safe carve-out should return (guarded against its own over-enforcement
  edge by keeping it `request` when an earlier noun is on the *artifact* lexicon),
  or whether the under-enforcement is the right call — a mission-axis choice the
  round-8 fix settled toward under-enforcement without flagging that it *reduced*
  `OL-C3` coverage relative to round 7 (which pinned "version number → info").

- **N3 — The coordinated-verb rule imposes an answer/narrate-before-act ordering
  on a co-asked action even where the requested `info` logically *follows* the
  action ("fix X **and** tell me what you did"), which is member (3)
  over-enforcement — owned and escapable, but a mild sequencing imposition worth
  naming because the escape requires the agent to narrate a *plan* before it has
  done the thing it is asked to report on.** The rule (AD-9 lines ~812–818)
  classifies "can you **fix** the bug **and tell** me what you did?" `info`
  ("tell" is communicative, its wh-complement "what you did" → `info`) →
  deny-capable → the "fix the bug" `Edit` denied until an answering turn clears
  it. The `info` half ("tell me what you did") is *unanswerable in substance*
  until the action ("fix") happens, so the block forces the agent to emit a
  substantive **plan** turn ("I'll change X in parser.js, then report") to clear,
  then act. The escape hatch **holds** — a plan turn is substantive text, never a
  tool action, so never denied, and Phase A's clear-all-prior clears the block —
  so this is not a deadlock and not a P1 member; it is member (3) over-enforcement
  in the coordinated shape, owned and measured. It is a note because the imposed
  ordering (narrate-plan-before-act) is a friction on the agent's natural
  sequence that the "escapable by answering first" framing slightly undersells
  for the *action-then-report* coordination direction; the honest gloss is
  "escapable by answering **or stating a plan** first." Safe as is; one clause at
  the coordinated rule ("where the `info` half reports on the co-asked action, a
  plan turn clears it") makes the escape explicit.

---

## End-to-end re-traces

- **The OL-12 mainline (edit → covering test fails → done-claim), every layer,
  under the round-8 text.** `PreToolUse` Edit → catch-up, deny check (no open
  `info` question) → Consequence/Warning fire pre-edit (coupled tests named —
  right moment). Edit ok → `PostToolUse` `'ok'` row (tool=Edit, `path` set; the
  Bash path-write predicate touches only Bash rows). `npm test` fails →
  `PostToolUseFailure` → `'failed'` row (tool=Bash, `command_class`=runner,
  `path`=NULL — not a file-writing command, so `deny_bypass_suspect` and the
  CHANGE/READ consumers ignore it). Done-claim `Stop` → Verification: changed
  regions from `'ok'` **Edit/Write** rows → covering tests → minus runs of
  **either** outcome → the failed run subtracts → **neither "not run" nor "no
  recognized run"**: Phase A silent, routed to `FR-A2m`/Phase B per D-27. At
  `SessionEnd` the regret proxy's covering-test-failed clause reads the `'failed'`
  row and records the held-fact silence; `status` labels it with the designed-
  silence floor. **The mainline holds** — the round-8 diff (head-noun rule,
  coordinated rule, residual class, `deny_bypass` receptacle, corpus, L1/L3
  disclosures) touches classification, diagnostic, and disclosure layers, never
  the mainline whisper decision. The one round-8 addition on the mainline
  periphery — L3's new sentence that a Bash-authored change (`echo > f.py`,
  `sed -i`) is not a Completeness/Verification change-set member — is a
  **disclosure** that correctly names the N3-of-round-8 under-detection ("goes
  unflagged — safe under-detection"); it does not perturb the Edit-authored
  mainline (an `Edit` is in the change-set) and honestly owns the Bash-authored
  miss now, in L3's coverage ledger where its siblings live. Clean.

- **The full object-classification corpus, including round-8 additions and my
  adversarial cases.** Round-8 additions: "could you confirm the **version**?" →
  head "version" (info) → `info` ✓; "could you confirm the version **number**?"
  → head "number" (unlisted) → `request` ✓ (the re-pin; N2 under-enforcement);
  "can you **answer** my question **and fix** the bug?" (in-frame coordinated) →
  "answer" communicative, object "question" (info) → `info` → co-asked fix-`Edit`
  denied → member (3), **in-frame ✓** (owned). My adversarial cases: **"show me
  the error and fix the bug?"** (out-of-frame coordinated imperative) →
  non-request-frame → `info` → fix-`Edit` denied → member (3)-**intent** but
  out-of-frame → **P1** (excluded by "in-frame"; the document's own example).
  **"answer whether the null check fixes it?"** (out-of-frame wh imperative) →
  non-request-frame → `info` → edit denied → **P1** (the document's own example).
  *Possessive:* "can you answer my **question**?" → head "question" → `info` ✓
  (recourse preserved). *Possessive + post-head PP:* "can you answer my question
  **about the parser**?" → rightmost "parser" → `request` → **N1** (recourse-
  preservation defeated for the postmodified escalation; canonical verbatim
  recourse intact). *Post-head info-noun:* "can you show me the **file** with the
  **error**?" → rightmost "error" (info) → `info` → over-match → member (3),
  in-frame ✓ (owned) → **N1** (over-direction). *PP object:* "can you tell me
  **about the parser**?" → object is a PP, no bare NP after "me" — rightmost noun
  "parser" → `request`, **or** object-less → `info` if the PP is not recognized
  as the object NP; outcome-safe either way unless build-fulfilled → **N1** (parse
  under-spec, unpinned). *Gerund:* "can you explain **refactoring this**?" →
  rightmost noun "this" (pronoun) → unlisted → `request` → under-enforcement,
  disclosed. *Nested coordination:* "can you show me the error **and** the log
  **and** fix it?" → "show" communicative, first object "the error" (info) →
  coordinated → `info` → "fix it" denied → member (3), in-frame ✓ (owned).
  *wh-object:* "can you tell me **what broke**?" → wh-complement precedence →
  `info` ✓.

- **§8 deny-confinement property walk on the round-8 text.** The round-8 diff
  touches AD-4 (the `deny_bypass` receptacle schema comment — no deny channel),
  AD-9 clause (iv) (head-noun rule, coordinated rule — classification only), AD-9
  residual (the member-(3) class — disclosure), AD-9 `deny_bypass_suspect`
  (diagnostic receptacle), AD-24 (corpus/fixtures), L1/L3 (disclosures). It never
  reaches AD-10's single deny producer (`blocks/verdict.ts` ← `blocks/
  answer_drift.ts`), the deny-eligibility predicate (open `kind='info'` question +
  mutating file tool `Write`/`Edit`/`NotebookEdit`), reactive-only,
  text-never-denied, self-clearing/no-counter, the lag-clause's clear-axis-only
  scope, or per-consumer scope — all re-read consistent. **The one substantive
  difference from round 8:** round 6 widened the deny-capable set (object-bearing
  seed), round 7 widened it again (object-less seed), round 8 **restructured** the
  classifier (head-noun rule + coordinated rule) rather than widening a lexicon —
  so the deny-capable **set** changed shape (the head rule under-matches pre-head
  info-modifier compounds → N2, over-matches post-head info-noun PPs → N1; the
  coordinated rule adds the co-asked-action denial → member (3)). The confinement
  **structure** (one producer, reactive, self-clearing, text-never-denied) holds
  unchanged; the deny-capable **set** was reshaped, and the reshaping's edges are
  P1 (the out-of-frame branch left un-owned by the class), N1 (post-head modifier
  mis-head), and N2 (compound-info-modifier under-enforcement). **No new deny
  path or producer.**

- **The `deny_bypass_suspect` receptacle (R8-m1 / N5a fix).** AD-9 (lines
  ~1026–1032) now: the correlation matches the Bash write's path "against the
  denied action's target path **recorded on the deny** — because a denied
  `Edit`/`Write`/`NotebookEdit` never executes (no `observed_actions` row, V19)
  … the deny handler writes the denied action's target path (`file_path`, or
  `notebook_path` for `NotebookEdit`; redacted per AD-19) into the `kind='deny'`
  `whisper_audit` row's `evidence_json`." Walked: the receptacle **exists** —
  `whisper_audit.evidence_json` is a real column (AD-4 line ~536), the `kind='deny'`
  row is written there (AD-8 audit-log-first), and the redaction routes through
  AD-19. `NotebookEdit` (N5a's gap — its target is `notebook_path`, not
  `file_path`) is now covered. The correlation reads a persisted key, not an
  unpersisted one. **Closed** — the diagnostic is buildable; it gates nothing and
  serves the L3 OL-C3-miss visibility (a denied `Edit` retried as `Bash` sails
  through, now owner-visible). No mission finding.

- **The class-honesty test (charter): is member (3) too large, does it stop
  serving OL-C3?** No. The block denies a mutation **only while a deny-capable
  `info` question is open**, and every deny is escapable by one substantive text
  turn — so the over-enforcement (member (3), however large) does not defeat
  OL-C3; it *over-serves* it (forces narration/answer-first) and never suppresses
  a whisper (no leak into the primary mission — the block is a "second owner-set
  objective," separate). "Escapable by one answering turn" holds for every member
  including the out-of-frame P1 members and the action-then-report coordinated
  case (N3): a plan/narration turn is substantive text, never a tool action,
  never denied, and Phase A clears all-prior on it. The class is honest as a
  **cost disclosure** (line ~909's universal carries the true complete cost); its
  defect is the **shape-characterization's** frame scope (P1), not size or
  escapability.

## Between-decisions consistency of every round-8 addition

Head-noun rule (rightmost noun, modifiers ignored, no bag-of-words) — AD-9
clause (iv) ✓ / AD-24 "version"/"version number" rows ✓ (mechanism produces
both) / **stated property "an incidental listed modifier does not classify the
object" ✗ for post-head modifiers** (N1) / OL-C3 escalation re-ask "answer my
question?" head "question" → `info` ✓ **but "answer my question about X?" head
"parser" → `request` ✗** (N1 under-direction). Coordinated-verb rule — AD-9
clause (iv) ✓ / AD-24 in-frame coordinated row "can you answer my question and
fix the bug? → info" ✓ (mechanism: a top-level communicative-`info` verb) /
AD-9 & L1 residual list the **out-of-frame** "show me the error and fix the bug"
as a member ✗ vs the "in-frame" scope (P1) / action-then-report ordering
imposition owned as member (3) but escape is "answer **or plan**" ✗ understated
(N3). Member-(3) class generalization — AD-9 ✓ (as a predicate) **but scoped
"in-frame," excluding the non-request-frame branch and 2 of its own 4 examples
✗** (P1) / L1 mirror same scope ✗ (P1) / Status "ending the recurrence at its
root" ✗ as a completeness universal (P1). `deny_bypass_suspect` receptacle —
AD-9 ✓ / AD-4 comment ✓ / `whisper_audit.evidence_json` column exists ✓ /
`NotebookEdit` covered ✓ (N5a closed) / AD-24 fixture "matched via the target
`file_path` the deny recorded in its `whisper_audit.evidence_json`" ✓ (mechanism
produces it). L3 Bash-authored-change disclosure (N3/N5 of round 8) — L3 ✓
(names the miss "goes unflagged", coverage-ledger home) / consistent with AD-4
CONSUMER FILTER "Edit/Write/Read rows only" ✓. Status §"Review round 8" —
verdict counts (0 Critical / 1 Serious / 1 Moderate / 1 Minor; 0 collapses / 1
partial / 5 notes) match both round-8 files ✓; convergence explicitly **not**
claimed ✓; the round-9 charter it hands forward includes "verify the generalized
class actually closes the P1 lineage" — which P1 answers **NO** ✓.
`tools/check_docs.py` — run this session, **exit 0** (mechanical floor holds; my
axis is mission-fidelity, not the checker).

## Owner-fidelity scan of the round-8 text

Every owner/spec key the round-8 diff added or moved was re-read against its row
at its point of use. **No rejected item reintroduced:** the head-noun rule, the
coordinated rule, the member-(3) class, and the receptacle are
classification / disclosure / bookkeeping — no pre-emptive gate (`OL-C2`/`OL-R4`),
no generated-file consumption on any deny input, no separate credentials
(`OL-7`), no repo-tree write, no volume/count/budget cap (`OL-C1`/`OL-R1`/`OL-R3`
— the round-8 additions introduce no operating number). Clause (iv) remains a
**positive** total classification (`OL-R5`'s "define positively" honored; the
head rule and coordinated rule add positive `info`/`request` members, not a
negative-space exclusion). **The one owner-fidelity defect is P1's face on
`OL-C5`/`OL-C3`:** the residual class, which exists to *honestly own* the
Phase-A over-enforcement against `OL-C5`'s protected class ("an action taken to
provide that answer"), owns it only for **in-frame** asks — so the out-of-frame
coordinated/wh info-mutation asks the non-request-frame branch produces have
their fulfilling `Edit` denied (an `OL-C5`-protected move, `D-39`-load-bearing)
**and that denial is not honestly owned in the residual** (excluded by "in-frame,"
un-owned by member (1)). The block still enforces `OL-C3` reactively and
self-clearingly — not a gate — but its cost-disclosure understates the class of
protected moves it denies. **Secondary (`OL-C3` coverage):** N2's "version number
→ `request`" re-pin reduces `OL-C3` enforcement for compound-info-modifier
request-frame questions (the `FR-B5`-safe direction, human-guarded), and N1's
post-head-modifier mis-head defeats the recourse-preservation the "question"/
"answer" lexicon entry nominally guarantees for "answer my question about X?"
(canonical verbatim recourse intact). The coordinated-ask deny is `OL-C3`-faithful
(answer-first), reactive, self-clearing — **not a gate**. The enumerate-the-cost
repair (P1's repair 1–4) restores fidelity to `OL-C5`/`D-39` by owning the
out-of-frame protected-move denials, exactly as round 8's own generalization
restored it for the object-less case.

## Round-8 repairs that survived their hardest question without a finding

The `deny_bypass_suspect` **named receptacle** (R8-m1 — the denied target path on
the `kind='deny'` `whisper_audit.evidence_json`; the receptacle column exists,
the deny writes it, `NotebookEdit`'s `notebook_path` is covered, closing both
R8-m1 and the round-8 collapse-hunt's N5a; the correlation now reads a persisted
key, and the AD-24 fixture's "matched via the target `file_path` the deny
recorded" has its producing mechanism). The **false-soundness-universal removal
stayed removed** (the abandoned "mutating the repository does not produce an
answer to it" / "fulfilment is text, which the deny-eligible set can never touch"
is absent from the document; line ~909's honest "denies **every** repo mutation
while a deny-capable `info` question is open" universal carries the true cost —
the round-8 object-less R7-S1 rationale that round-8-P1 attacked is gone). The
**"version number" rule/corpus contradiction is resolved** (R8-S1's specific
inconsistency — the corpus pinned `info` while the head-noun rule gives
`request` — is gone; the corpus now pins "version → `info`" beside "version
number → `request`", both produced by the head rule; the residual mission cost of
that resolution is N2, a disclosed trade, not the contradiction R8-S1 named). The
**Bash-authored-change under-detection is owned in L3** (round-8 N3/N5 — the miss
"goes unflagged" is now named in the L1/L3 coverage ledger, not left in a schema
comment). The **§8 deny confinement** (walked above — structure untouched; the
deny-capable set was reshaped, and the reshaping's edges are P1/N1/N2).

---

*End of round-9 hunt. Zero full collapses — the **fifth** consecutive
zero-collapse round — but one partial collapse, inside the round-8 repair text,
and it is the P1 lineage's eighth recurrence: the member-(3) generalization-to-a-
class, applied specifically "to end the P1-lineage enumeration recurrence at its
root," is scoped by the frame qualifier "any **in-frame** ask" — narrower than
the class of `info`-classified mutation-fulfilled asks the block actually
produces — so the non-request-frame branch (clause iv's first bullet) is shut out,
and the two out-of-frame imperatives the document lists as member (3)'s **own
examples** ("answer whether the null check fixes it", "show me the error and fix
the bug") fall outside the class they illustrate, falsifying "complete as a
class, not an enumeration of phrasings" on first audit. The prescription-carried
lesson is validated once more — the applier faithfully carried the round-8
collapse-hunt's own too-narrow "in-frame or object-less" scope word into the
predicate, and a reviewer's prescription carries no verification of its own
(collapse-log 2026-08-29 Lesson 1). This is **not** the terminal round: the count
bars the terminal call, and the convergence definition (a round that finds
nothing real) is unmet. The blast radius stayed narrow — one classifier's residual
scope word, one head-extraction rule's parse fidelity, one corpus re-pin's
coverage trade — none reaching the deny confinement, the owner's locked
constraints, or the phase boundary, all re-walked clean, so the cycle continues to
converge in blast radius while the partial holds at 1 for the fifth straight
round. **Inheritance for round 9's successor (round 10):** (1) **P1 is the
"generalize to a class" move done with a residual scope word narrower than the
class** — carry it: member (3) must be scoped by **fulfilment-by-mutation,
frame-independent**, because the block produces `info`-classified mutation-
fulfilled asks on the non-request-frame branch too, and every round's residual
characterization has been re-scoped just narrowly enough to strand the next
branch (object-shape in round 7, frame in round 8); verify the round-9 repair
lands at AD-9 (925), L1 (2173), Status (2494), **and** adds the out-of-frame
coordinated corpus row to AD-24 (all four, per the round-6 every-site lesson —
and specifically that the corpus pins the *out-of-frame* representative, not only
the in-frame "can you answer my question and fix the bug?"). (2) **Attack the
head-extraction rule's parse fidelity (N1)** — "rightmost noun = head" is false
for post-head PP/relative-clause modifiers, over-matching "show me the file with
the error?" (owned member 3) and under-matching "answer my question about X?"
(recourse-preservation defeated, canonical recourse intact); confirm a round-9
fix either pins the syntactic head (rightmost noun before any post-head modifier)
or states it Phase-B-precise, and re-audit whether the "question"/"answer"
recourse-preservation claim still holds once post-head PPs are excluded. (3) **The
N2 compound-info-modifier under-enforcement** — whether "confirm the version
number? → request" (OL-C3 disarmed for the request-frame phrasing) should stand
as the FR-B5-safe call, or whether R8-S1's dropped OL-C3-safe carve-out (guarded
against its own over-enforcement edge by staying `request` when an earlier noun
is on the *artifact* lexicon) should return, is an unresolved mission-axis choice.
(4) **The N3 coordinated action-then-report ordering** — the "escapable by
answering first" framing should read "answer **or state a plan** first" for the
co-asked-action direction where the `info` half reports on the action.*
