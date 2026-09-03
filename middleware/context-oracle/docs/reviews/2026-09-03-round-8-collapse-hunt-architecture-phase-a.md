# Independent collapse-hunt, round 8 — Phase A architecture (2026-09-03)

**Artifact:** `docs/architecture-phase-a.md` at current HEAD (`cc61b25`, "apply
all round-7 review findings"); the round-7 repairs are that commit, read as
`git show cc61b25 -- middleware/context-oracle/docs/architecture-phase-a.md`
in full.
**Axis:** mission-fidelity only. Reviewer is not the author of the document or
of any prior review. Read in full, in order, before the attack:
`docs/collapse-log.md` (its two 2026-09-03 entries first — round 6 and round 7
lessons — then 2026-08-29, then the rest, esp. 2026-08-25's convergence/terminal
definition), `OWNER-LEDGER.md` (CONFIRMED only),
`middleware/context-oracle/CLAUDE.md`, `docs/specs/spec-context-oracle.md`
(§8, §11.5, §12, §13, §14), both round-7 review files, then the architecture
end to end plus the round-7 apply diff.
**Charter additions honored:** (1) the round-7 fixes were largely prescribed by
the round-7 reviews themselves — reviewer repair text carries no verification of
its own and was attacked here exactly as author text (collapse-log 2026-08-29
lesson 1). (2) The widened deny-capable set was audited in **both** directions:
round 7 added object-less communicative → `info` (widening) and re-opened the
residual to a third member shape — I re-checked whether the object-less→info case
created **new** fulfilling-move wrongful denies ("can you show me?" → `info` →
an `Edit` denied) and whether the "three member shapes" enumeration is now
complete. (3) Totality over the input domain: I traced my own adversarial input
shapes (pronoun-only object; attributive compounds "test results"; coordinated
objects; PP objects; bare imperatives) against clause (iv). (4) For every fixture
assertion a round-7 repair added, the mechanism sentence that produces it was
named before the fixture was accepted. (5) Any terminating enumeration was
verified for completeness.
**Method:** each round-7 repair's hardest question, answered from the document,
spec, and ledger alone; the required end-to-end re-traces (OL-12 mainline; the
full object-classification corpus including round-7 additions and my adversarial
cases; the Reuse dominance / same-name path with the now-stated cap-vs-floor
relation; Verification across command mixes and the `deny_bypass_suspect`
correlation path; the §8 deny-confinement walk on the round-7 text; an
owner-fidelity scan); between-decisions consistency of every round-7 addition.
Findings were not manufactured to avoid an empty report; the repairs that
survived their hardest question are recorded by name. `check_docs.py` was run
this session (exit 0) as the mechanical floor; my axis is mission-fidelity, not
the checker.

## Verdict: DOES NOT SURVIVE

- **Collapses: 0**
- **Partial collapses: 1** (P1)
- **Survived with note: 5** (N1–N5)

For the fourth round running, no full collapse: the §8 confinement property walk
holds (the round-7 diff touches classification, a schema comment, a diagnostic
predicate, the CLI, disclosures, a concurrency clause, and fixtures; the single
deny producer at AD-10, reactive-only, text-never-denied, self-clearing/no-counter,
and per-consumer scope are all textually untouched and re-read consistent), the
OL-12 mainline is clean at every layer under the round-7 text, the `deny_bypass_suspect`
correlation now produces the "`npm test > out.log` does not fire" behavior it
asserts, the fold's `BEGIN IMMEDIATE` closes the concurrent same-project
double-count, and clause (iv) is now **outcome-total** over the input domain
(the object-less fall-through R7-S1 named is closed).

But one real defect lives inside the round-7 repair text, and it is the
collapse-log's own recurring lesson validated a **seventh** time. **P1** is the
P1 lineage (round-1-S2 → round-3-C1 → round-4-P1 → round-5-P1 → round-6-P1 →
round-7-P1 → **this**): the "wrongful-deny residual has **exactly three member
shapes**" claim is again a false universal, and it fails on the very axis round 7
acted on. Round 7 widened the deny-capable set by seeding **object-less
communicative verbs** → `info` (to close R7-S1's under-enforcement gap and restore
the `OL-C3` recourse for "can you answer?") — and the collapse-log's own 2026-09-03
round-7 **inheritance point (1)**, and STATUS.md's own round-8 charter question
(b) — *"whenever a round widens the deny-capable set, audit the new members for
fulfilling-move wrongful denies, not only the recourse they were added to
restore"* — bites: the seed **also** made `info`-and-deny-capable a class of
object-less communicative asks **whose fulfilment is an action** ("can you show
me?", where "show" is on the communicative lexicon and the thing to be shown must
first be built), which the categorical `Edit`-deny then **wrongfully denies** — a
**fourth** wrongful-deny member shape that the "three member shapes … whose object
classifies `info`" enumeration structurally excludes, resting on the load-bearing
soundness clause **"fulfilment is text, which the deny-eligible set can never
touch"** — the *same false "fulfilment is text" universal* the CH-P1 fix removed
for the object-bearing case, re-committed for the object-less case **in the same
commit**, one hundred lines above CH-P1's own contradicting admission that the
recognizer "denies **every** repo mutation while a deny-capable `info` question is
open."

A round with a live partial is not the terminal round; per the convergence
discipline the count bars the terminal call, and the collapse-class trajectory
(5 → 6 → 1 → 1 → 0 → 0 → 0 → **0**) continues to converge while the partial holds
at 1.

---

## Partial collapses

### P1 — Round 7's object-less-communicative-verb → `info` seed has an unaudited over-enforcement direction: "can you show me?" ("show" is on the communicative lexicon, no object, so → `info` → deny-capable) whose fulfilment is a build now **wrongfully denies** the fulfilling `Edit` — a FOURTH wrongful-deny member shape excluded by "three member shapes … whose object classifies `info`," resting on the false universal "fulfilment is text, which the deny-eligible set can never touch," which CH-P1's own fix (same commit) contradicts

**Where:** AD-9 clause (iv) object-less rule (lines ~777–800: *"a wh-complement,
**no object at all** (a bare communicative verb once the optional 'me/us' is
skipped — 'can you explain?', 'can you clarify?', 'can you confirm?', 'can you
answer?'), or an object whose head is on the **information-object lexicon** …
classifies `kind='info'` — **fulfilment is text, which the deny-eligible set can
never touch**"*) × the communicative lexicon that contains **`show`** (line ~776:
*"answer / tell / explain / describe / **show** / list / clarify / confirm"*) ×
the deny-eligible set (line ~877: *"exactly the repo-mutating file tools (`Write`,
`Edit`, `NotebookEdit`)"*) × the CH-P1 rationale that contradicts it (lines
~888–896: *"it denies **every** repo mutation while a deny-capable `info` question
is open. That over-enforcement against an answer-directed edit is the accepted
cost …"*) × the "three member shapes" enumeration whose shape (3) is object-scoped
(lines ~897–912: *"(3) an **in-frame `info` question whose fulfilment is an
action** — a communicative-verb ask **whose object classifies `info`** but whose
answer is a build"*) × L1 (lines ~2125–2138, the same three shapes) × AD-24's
corpus, which pins the benign object-less representative and omits the malign one
(lines ~1756–1762: *"'can you **explain?**' → `info` (object-less communicative
verb — deny-capable …)"* — no "can you show me?" row) × the round-7 apply commit
message and STATUS.md's own round-8 charter question (b) (*"whenever a round
widens the deny-capable set, audit the new members for fulfilling-move wrongful
denies"* — the audit this fix did not perform on itself).

**Collapse question:** *Max, pair-working with an agent on a UI, says "I think
the button should be blue," the agent says "I can change that," and Max says
**"can you show me?"** Intake opens a row: request frame ("can … you"), verb
`show` (on the communicative lexicon), and — after skipping "me" — **no object**.
The object-less rule fires → `kind='info'` → deny-capable. To "show" Max the blue
button, the agent edits the CSS and re-renders — an `Edit` that **is** the action
that provides the answer — and the `Edit` is **denied** ("answer Max's question
first: can you show me?"). Which of L1's "three member shapes" is that? Shape (3)
is "a communicative-verb ask **whose object classifies `info`**" — this ask has
**no object**; it is classified `info` by the **no-object** rule, not by an
info-object. Shape (1) is out-of-frame; shape (2) is rhetorical. By what mechanism
is an object-less, answer-directed `Edit` kept out of the deny? The clause-(iv)
rationale says the object-less class is safe because "fulfilment is text, which
the deny-eligible set can never touch" — but here the fulfilment is a build and
the deny-eligible set touches it. Cite the line that survives that.*

**Why the document's answer fails.** There is none — the object-less rationale
asserts the opposite of what happens, and it is falsified **by the same commit's
own CH-P1 fix**. The R7-S1 repair classifies every object-less communicative verb
`info` on the stated ground (lines ~783–784) that *"fulfilment is text, which the
deny-eligible set can never touch."* That is a **false universal** over the
object-less class: `show` is on the communicative lexicon (line ~776), and "can
you show me?" is fulfilled not by text but by a repo mutation (build the thing to
be shown, then render it). The `Edit`/`Write` that shows Max is the
answer-directed move — exactly `OL-C5`'s protected class *"an action taken to
provide that answer"* and `D-39`'s load-bearing never-deny — and the categorical
`Edit`-deny denies it, violating `D-41`'s "clearly *not* answer-directed" license
(the edit is clearly answer-*directed*).

The contradiction is internal and one hundred lines apart. CH-P1's fix, applied
in the same commit, **removed** the false universal "mutating the repository does
not produce an answer to it" for the object-bearing case and replaced it with the
honest admission (lines ~888–896) that the model-free recognizer *"denies **every**
repo mutation while a deny-capable `info` question is open"* and that this
over-enforces answer-directed edits. But R7-S1's object-less rationale
(lines ~783–784) re-states the abandoned universal — *"fulfilment is text, which
the deny-eligible set can never touch"* — for the object-less class, where it is
false for `show`. The document therefore says, of the same deny-eligible set, both
"can never touch [object-less info fulfilment]" (R7-S1) and "denies every repo
mutation [including answer-directed ones]" (CH-P1). For "can you show me?" the
second is true and the first is false, and the wrongful `Edit`-deny it produces is
**unowned**: it is not shape (1) (in-frame), not shape (2) (not rhetorical), and
not shape (3) (no object).

This is the collapse-log's round-7 **inheritance point (1) answered NO** — the
same "two miss directions of a set-widening change" lesson, one turn of the crank
later. Round 7 audited the direction it intended (the `OL-C3` recourse — restore
enforcement for object-less escalation re-asks) and closed it. It did not audit
the opposite direction the **same object-less→info seed** opens (over-enforcement
against a fulfilling move): the seed makes deny-capable not only the pure
text-answer object-less re-ask ("can you answer?", correct) but every object-less
communicative ask whose fulfilment is an action:

- **"can you show me?"** (referent is a not-yet-built artifact) → object-less
  `info` → the build `Edit` wrongfully denied. The `show` verb is the malign
  representative of the object-less class, and it is on the lexicon.
- **"can you confirm?"** ("confirm [it works]" requires editing a test and running
  it) → object-less `info` → the confirming `Edit` wrongfully denied. A secondary
  member: `confirm`'s *answer* is text ("yes"), but reaching it can require a
  mutation.

And the class is broader than the object-less seed. Two adjacent shapes the "three
member shapes" enumeration also does not cleanly own, both reachable model-free
under the round-7 text:

- **Coordinated object:** "can you show me the error **and** fix the bug?" → one
  sentence, one row; verb `show`, first object "error" (info-lexicon) → `info` →
  the co-asked "fix the bug" `Edit` denied. Shape (3) names an ask *whose answer is
  a build*; here the info-question's answer is text (the error) and it is a
  **co-asked** action that is denied — owned only by CH-P1's general "denies every
  repo mutation" sentence, not by the specific shape-(3) framing.
- **Attributive-compound / PP referents** that resolve to a build ("can you show
  me the **test results**?" when the results must be generated first) — same class,
  weaker.

So the wrongful-deny residual has never accounted for the **"an object-less (or
co-asked) deny-capable `info` ask whose fulfilment is an `Edit`"** class. L3
honestly owns that **`Bash` is never denied** (under-enforcement — a drift-Bash
escapes); CH-P1 now owns that **`Edit` is always denied even when its object is an
info-noun whose answer is a build** (shape 3). Neither owns that **`Edit` is
always denied even when the ask is object-less and its fulfilment is a build** —
the class R7-S1 created and left the "fulfilment is text" universal covering.

**Bounded below full collapse**, for the same reasons every P1-lineage member has
been partial: each wrongful deny is escapable by one substantive text turn (which
clears all-prior), lands on the wrongful-deny rate (`FR-M4`), and errs in a
direction the human channel can see (Max sees his own "show me" go unanswered).
And R7-S1 is not *entirely* hollow — it genuinely restores the recourse for the
benign object-less cases (explain / answer / clarify / tell). But "three member
shapes" is a completeness claim about the block's one halting mechanism, and it is
false on first audit — the seventh recurrence of the shape the collapse-log has
logged since round 1, and the second consecutive one caused by a set-*widening*
fix whose new members were audited in only one direction.

**Class:** unverified (a false universal inside repair text — the P1-lineage
recurrence, here the load-bearing object-less soundness clause "fulfilment is text,
which the deny-eligible set can never touch," which the same commit's CH-P1 fix
falsifies for the `show` member of the object-less class) + wrong-check (the
wrongful-deny residual scoped to "three member shapes … whose object classifies
`info`," a scope that structurally excludes the object-less-fulfilled-by-action
class R7-S1 created and the coordinated-object case already reached).

**Concrete repair.** Own the residual the mechanism actually has, and stop the
object-less rationale from re-asserting the universal CH-P1 just removed. All three
sites, per the round-6 lesson that a fix must land at every site the finding names:
1. **Correct the object-less rationale (AD-9 clause iv, lines ~783–784).** Do not
   claim the object-less class is safe because "fulfilment is text, which the
   deny-eligible set can never touch." State the true posture, consistent with
   CH-P1 one hundred lines below: *an object-less communicative verb classifies
   `info` and is deny-capable; where its fulfilment is text (explain / answer /
   clarify / tell) the deny never bites, and where its fulfilment is a build ("show
   me" a not-yet-built artifact) the categorical `Edit`-deny over-enforces it
   exactly as it over-enforces an in-frame info-object ask whose answer is a build
   — the accepted model-free cost, escapable by one text turn, measured on the
   wrongful-deny rate.* This makes the object-less classification honestly
   conservative rather than resting on the "fulfilment is text" universal CH-P1
   abandoned.
2. **Re-scope the residual enumeration (AD-9 lines ~897–912 and L1 lines
   ~2125–2138).** Drop "whose object classifies `info`" as shape (3)'s defining
   scope and state the class it should have named all along: **shape (3) = an
   in-frame or object-less deny-capable `info` ask whose fulfilment is an action**
   — the info-object ask whose answer is a build ("answer the question in the
   ticket"), the **object-less communicative ask whose referent is build-fulfilled
   ("can you show me?")**, the wh-complement whose answer is an edit ("answer
   whether the null check fixes it"), and the **coordinated ask** whose first
   object is `info` but co-asks an action ("show me the error and fix the bug").
   The unifying property is fulfilment-by-mutation, not object-shape; scoping the
   residual by object-shape is what has let each round's set-widening seed slip a
   new member past the enumeration.
3. **Pin the direction in AD-24's corpus (lines ~1756–1762).** Beside the benign
   object-less row ("can you **explain?**" → `info`, text-fulfilled, deny never
   bites), add the malign object-less row: **"can you show me?" (referent is a
   not-yet-built artifact) → `info` → the fulfilling `Edit` is wrongfully denied
   once, cleared by one text turn, counted on the wrongful-deny rate** — so the two
   opposite fulfilment-directions of the object-less class are both pinned, exactly
   as the object-bearing directions now are. The corpus currently pins only the
   benign representative of the object-less class, which is how the malign one went
   unaudited.
4. If the owner prefers to *narrow* the seed instead (accept that object-less
   communicative asks are **not** deny-capable in Phase A, reverting R7-S1), that
   re-opens the R7-S1 under-enforcement gap for "can you answer?" — so the
   enumerate-the-cost path (1–3) is the correct one, and it is the exact mirror of
   the round-7 CH-P1 repair the object-bearing case already received.

---

## Survived with note

- **N1 — Clause (iv) is now outcome-total, but the object/head-noun identification
  it rests on is an under-specified model-free NLP step; the parse ambiguities I
  traced resolve *safe* for the deny outcome, so this is a note, not the P1
  partial.** Round-8 charter question (a) — trace every reachable input shape —
  holds at the *outcome* level: every opened row now gets a class (the object-less
  fall-through R7-S1 named is closed). But clause (iv)'s object rule ("the head
  noun of the noun phrase immediately following the verb, skipping an optional
  'me/us'", lines ~770–771) is a *rule*, not a model-free *mechanism*, and several
  shapes need a parse the document does not pin: **attributive compounds** ("test
  results" — head "results" → `info`, or a naive first-noun "test" → `request`; the
  round-7 hunt already flagged this "unspecified for attributive compounds, safe
  either way" and round 7 did not pin it); **PP objects** ("tell me **about the
  parser**?" — an NP immediately follows only if "about the parser" counts; head
  "parser" → `request`, or no-NP → `info`); **coordinated objects** (first-conjunct
  head). In each case I traced, both readings are safe for the *deny* (info→text or
  Bash-fulfilled deny-capable, or request→under-enforce), so no wrongful deny
  follows — **except** where the compound/PP referent is itself build-fulfilled,
  which folds into P1. The residual is that "classifies, positively, every opened
  row" is an outcome claim discharged by a parse step whose model-free realization
  is left to the implementer in the soundness-critical classifier (the same class
  the Gate-A "no inline architectural calls" attestation is about). One sentence
  in AD-9 fixing the model-free head-selection rule for compounds/PPs (or stating
  it is Phase-B-precise and Phase-A-first-noun) closes it; safe as is because the
  outcomes are safe.

- **N2 — The N1-fix `--missed-question` tune-offer is undiscriminating: it offers
  `tune lexicon.communicative +<verb>` for any unlisted verb, and following it for
  a *correctly* non-communicative verb introduces the over-enforcement direction —
  a foot-gun the model-free CLI cannot distinguish from the safe suggestion.** The
  round-7 N1 fix (AD-18 lines ~1455–1461) has the CLI "name the unrecognized word
  and offer the exact `tune` command … `ctxoracle tune lexicon.communicative
  +<verb>`" when a reported miss's `request` classification "is caused by an
  unlisted communicative verb or information noun." But "unlisted **communicative**
  verb" is not a model-free-decidable category — the classifier sees only "verb not
  on the communicative lexicon," and cannot tell `summarize` (should be
  communicative, unlisted — the safe suggestion) from `rename` / `fix` (correctly
  non-communicative — where adding it makes future "can you rename X?" deny-capable
  and wrongfully denies the fulfilling rename). So the CLI offers the same
  `+<verb>` command for both, and an owner (`OL-11`) who follows it on a genuine
  action-verb has hand-tuned the classifier into the over-enforcement direction —
  the mirror image of the loss N1 was closing. Bounded: it is owner-driven, the
  human channel is designed to outrank (`FR-L6`), and it is reversible (`tune
  lexicon.communicative -<verb>`). This is the "two miss directions" lesson applied
  to lexicon-*tending* itself. One sentence — the offer is marked conditional
  ("only if this verb should be treated as a question," and it is *not* offered for
  the request-frame remainder's genuinely-imperative verbs) — closes it.

- **N3 — The N2-fix decision that Bash-authored file writes are "not a Phase A
  change-set member — the safe under-detection direction" glosses a real OL-12
  completion-check miss, and it is not carried into the L1/L3 coverage ledger where
  the sibling answer-drift/verification misses live.** Round 7 pinned AD-4's
  CHANGE/READ dual-producer ambiguity by reading "the Edit/Write/Read tool rows
  only (NOT the Bash path-write rows below): a Bash-written file … is not a Phase A
  change-set member — the safe under-detection direction" (lines ~500–505). For a
  **delivery** tool, under-detection is a *miss*, not merely "safe": an agent that
  edits `parser.js` via `sed -i` / `echo > parser.js` and claims done leaves that
  change **invisible** to Completeness and Verification, so the oracle stays silent
  on exactly the OL-12 fact ("you changed `parser.js` but didn't run its covering
  test"). "Safe" names only the absence of a *false positive*; the *false negative*
  is the mission fact going undelivered. It is bounded (agents rarely author code
  through shell redirection, and Phase A's completion-check is already scoped to
  "unverified, not unfinished" per D-27), and AD-4's comment *does* disclose it —
  but its home is L1/L3's coverage ledger (where the Bash-drift and
  Bash-bypass misses are owned), not a schema comment, and the "safe under-detection"
  framing understates it as a mission miss. One cross-reference line in L3 (a
  Bash-authored change escapes Completeness/Verification, the same class as the
  Bash-drift/Bash-bypass misses) closes it.

- **N4 — The N4-fix pins the same-name Reuse "fires" against the AD-14 floor, but
  the crown-a-false-rival cost it makes *producible* is still an accepted, not a
  resolved, delivery of disclosed misinformation — and the `OL-C4` "speak flagged"
  posture invoked for it is hazard-scoped, a slight over-extension to a positive
  recommendation.** The round-7 N4 fix (L6 lines ~2168–2171) states "the cap held
  at or above the Reuse confidence floor of AD-14, so a same-name-inflated
  candidate still *fires* with the caveat rather than being silently dropped below
  the floor" — which makes AC-1b's "fires with caveat" producible (`symbol_refs`
  counts comment/string matches — AD-12; the caveat is always attached; the cap ≥
  the 0.6 floor — AD-14). The residual round 7 recorded persists: a comment/string-
  inflated rival that dominates *by count* is crowned "X is canonical, M files use
  it," a **false dominance fact**, and pinning cap ≥ floor now *guarantees* that
  crown fires (with the caveat) whenever its inflated raw confidence clears the
  floor, rather than possibly being capped into silence. The Reuse mission job is
  to deliver *the* helper the agent should reuse; a disclosed-false crown actively
  steers toward the wrong one, and the flag is a hedge a non-programmer owner
  (`OL-11`) cannot evaluate. The round-6 hunt's P4 offered a real preventive
  (AST/lexer-scoped `symbol_refs` excluding comment/string spans — established
  reference-counting practice); the applier chose disclosure+cap. It is consistent
  with the project's "speak flagged, don't suppress" posture — but that posture is
  `OL-C4`, which is literally about *uncertain hazards* (warnings), and a Reuse
  crown is a positive recommendation, not a hazard, so the analogy is stretched.
  Note, not partial: it is advisory (a whisper, ignorable), flagged, and the Phase
  C demotion loop is the designed empirical corrective. The round-9 sharpening is
  whether a *false positive recommendation* earns the hazard posture, or whether
  the counter should be lexer-scoped as P4 proposed.

- **N5 — Two minor mechanism residuals in round-7-added text.** (a) The R7-m1
  `deny_bypass_suspect` correlation matches the Bash write "against the denied
  `Edit`/`Write`'s `file_path`" (line ~1002), but the deny-eligible set is
  `Write`/`Edit`/**`NotebookEdit`** (line ~877); a `NotebookEdit` deny (target
  field `notebook_path`, not `file_path`) followed by a shell write to that
  notebook path would not correlate, so a notebook bypass never raises the
  diagnostic. Under-detection, the safe direction for a gates-nothing owner-facing
  proxy, and Phase B refines it — but it is a real gap between the deny set and the
  bypass correlation the round-7 fix introduced. (b) The R7-M1 "shrunk by tending
  the stoplist (`lexicon.stoplist`, via `tune`)" mitigation for member shape (2) is
  now *deliverable* (the `tune` surface includes it — AD-20 lines ~1556–1559), but
  its *efficacy* rests on unspecified match semantics: exact-phrase stoplist
  members ("why is ci always so flaky") do not generalize to the next differently-
  worded rhetorical, and a pattern/substring match risks suppressing genuine
  questions (under-enforcement). The document owns "fallible by construction … not
  eliminated," so this is honest — but "shrunk by tending" over-suggests a
  generalizing shrink the exact-phrase mechanism does not provide. Both are
  one-clause fixes; both safe as is.

---

## End-to-end re-traces

- **The OL-12 mainline (edit → covering test fails → done-claim), every layer,
  under the round-7 text.** `PreToolUse` Edit → catch-up, block check (no open
  question) → Consequence/Warning fire pre-edit (coupled tests named — right
  moment). Edit ok → `PostToolUse` `'ok'` row (tool=Edit, `path` set; the
  path-write predicate touches only Bash rows). `npm test` fails →
  `PostToolUseFailure` → `'failed'` row (tool=Bash, `command_class`=runner,
  `path`=NULL — not a file-writing command, so `deny_bypass_suspect` and the
  CHANGE/READ consumers ignore it). Done-claim `Stop` → Verification: changed
  regions from `'ok'` **Edit/Write** rows (N2's pinned reading) → covering tests →
  minus runs of **either** outcome → the failed run subtracts → **neither "not run"
  nor "no recognized run"**: Phase A silent, routed to `FR-A2m`/Phase B per D-27.
  At `SessionEnd` the regret proxy's covering-test-failed clause reads the
  `'failed'` row and records the held-fact silence; `status` labels it with the
  designed-silence floor. **The mainline holds** — the round-7 changes (object-less
  rule, deny_bypass correlation, CHANGE/READ scoping, stoplist tune, fold
  atomicity) touch classification, diagnostic, and bookkeeping layers, never the
  mainline whisper decision. The one N3 caveat: had the agent authored the edit via
  `sed -i` (Bash), Verification would not see it — the disclosed under-detection.

- **The full object-classification corpus, including round-7 additions and my
  adversarial cases.** "can you rename the helper?" → non-communicative → `request`,
  rename-edit free ✓. "can you show me a demo?" → `request` (artifact-lexicon *or*
  default) ✓. "can you show me the error?" → `error` (info) → deny-capable ✓.
  "could you summarize the error?" → `summarize` non-communicative → `request`, the
  disclosed under-enforcement loss ✓. "could you tell me why the login test
  fails?" → wh-complement precedence → `info` ✓. "could you confirm the version
  number?" → `version` (info) → `info` ✓. **Round-7 additions:** "can you
  explain?" → object-less → `info`, deny-capable, fulfilment text → deny never
  bites ✓ (R7-S1's intended fix). "can you answer the question in the ticket?"
  (ticket = build) → object "question" → `info` → fulfilling `Edit` denied → owned
  as shape (3) ✓ (round-7 CH-P1's fix). **My adversarial cases:** **"can you show
  me?"** (referent build-fulfilled) → verb `show` communicative, no object → `info`
  → the build `Edit` **wrongfully denied**, and **not owned by shape (3)** ("whose
  object classifies info") → **P1** (fourth shape). **"can you confirm?"** ("confirm
  it works" needs an edit-and-test) → object-less `info` → the confirming `Edit`
  denied → **P1** (secondary object-less member). **"can you show me the error and
  fix the bug?"** → first object "error" (info) → `info` → the co-asked fix-`Edit`
  denied → **P1** (coordinated object; owned only by CH-P1's general sentence, not
  shape 3). "can you answer this?" → object "this" (pronoun) → unlisted → `request`
  → does not re-arm → **N6-of-round-7, disclosed** (under-enforcement direction).
  "can you respond?" → `respond` not on communicative lexicon → `request` →
  disclosed under-enforcement ✓. *attributive compound:* "can you show me the test
  results?" head "results" (info) vs first-noun "test" (artifact) — outcome-safe
  either way unless the results are build-fulfilled, then → **P1**; parse
  unspecified → **N1**.

- **The Reuse dominance / same-name path with the cap-vs-floor relation.**
  Mixed-language {S: generic-frontend true convention, `symbol_refs`=0 by
  construction; R: grammar-covered, count M} → the **language** discriminator
  (not stored count) detects S's language is not grammar-covered → set incomparable
  → **silence**; fixture asserts silence, mechanism produces it ✓. Unimported-grammar
  {S: grammar-covered count M; T: grammar-covered observed-0} → both comparable →
  dominance made → not over-silenced ✓. Same-name {rival with comment/string-
  inflated count, raw confidence ≥ 0.6 floor} → capped confidence = min(raw, cap),
  cap ≥ floor → clears floor → **fires** with the false-positive caveat ✓
  (producible) — the crown-a-false-rival cost accepted, **N4**. The cap-vs-floor
  sentence produces "fires" only when raw also clears the floor (min(raw,cap) ≥
  floor needs raw ≥ floor); the phrasing slightly over-reads as "always fires,"
  harmless.

- **Verification across command mixes and the `deny_bypass_suspect` correlation.**
  Innocuous-only → strong "not run" ✓. Runner pass/fail → subtracts either
  outcome ✓. Unknown runner (`make check`) → class-3 → weak claim ✓. Quoted
  operators → not split → one segment ✓. `npm test && make integration` → npm
  subtracts, make composes weak claim ✓. **`deny_bypass_suspect`:** a deny on
  `Edit parser.js`, then `sed -i … parser.js` same turn → path resolves to
  `parser.js` = denied target → **fires** ✓; then `npm test > out.log` same turn →
  redirection path `out.log` ≠ denied target → **does not fire** ✓ (the R7-m1 fix's
  asserted behavior, produced by the path-match clause); an unrelated `echo x >
  log.txt` → ≠ target → does not fire ✓; a failed write → not `'ok'` → does not
  fire ✓. Both error directions (over-count same-file-unrelated-rewrite, under-count
  different-path-bypass) are now stated at the surfacing site (lines ~1005–1008),
  matching the done-claim counter's discipline ✓. The one gap is a `NotebookEdit`
  deny (N5a).

- **§8 deny-confinement property walk on the round-7 text.** The round-7 diff
  touches AD-4 (CHANGE/READ reading + `deny_bypass` predicate — no deny channel),
  AD-9 clause (iv) (the object-less seed — classification), AD-9 rationale
  (residual — the CH-P1 disclosure), AD-9 `deny_bypass_suspect` (diagnostic),
  AD-15 Verification row ("every lexicon" removed), AD-18 (`--missed-question`),
  AD-20 (`tune` stoplist), AD-24/L1/L6/Status (fixtures/disclosures), AD-26 (fold
  atomicity). It never reaches AD-10's single deny producer
  (`blocks/verdict.ts` ← `blocks/answer_drift.ts`), the deny-eligibility predicate
  (open `kind='info'` question + mutating file tool), reactive-only,
  text-never-denied, self-clearing/no-counter, the lag clause's clear-axis-only
  scope, or per-consumer scope — all re-read consistent. **The one substantive
  difference from round 7:** round 6 widened the deny-capable set via the
  object-*bearing* seed (question/answer → info); round 7 widened it **again** via
  the object-*less* seed — so round 7 is the second consecutive round to grow the
  set, and its growth's wrongful edge went unaudited (P1), exactly as round 6's
  did. The confinement **structure** (one producer, reactive, self-clearing) holds
  unchanged; the deny-capable **set** grew, and the growth's wrongful edge is P1.

- **The fold's concurrent same-project double-count (round-7 N7 fix).** AD-26 now
  states the fold "reads its project watermark, aggregates the rows newer than it,
  and advances that watermark inside a **single `BEGIN IMMEDIATE` transaction**"
  (lines ~1835–1841). Walked: two same-project folds ending near-simultaneously —
  the second's `BEGIN IMMEDIATE` acquires the write lock only after the first
  commits, so it reads the *advanced* watermark and folds no rows the first already
  counted. Closed; the SQLite `BEGIN IMMEDIATE` semantics are engine-documented and
  correctly applied.

## Between-decisions consistency of every round-7 addition

Object-less seed (no-object communicative verb → `info`) — AD-9 clause (iv) ✓ /
AD-24 corpus ("can you explain?" → info) ✓ / L1 "Enforced … no object at all" ✓ /
L1 recourse-re-arm framing scoped ✓ (round-7 N6) / **AD-9 object-less rationale
"fulfilment is text, which the deny-eligible set can never touch" ✗** (P1 — false
for `show`) / **AD-9 CH-P1 rationale "denies every repo mutation" contradicts it
✗** (P1) / **"three member shapes … whose object classifies info" ✗ as a universal**
(P1 — object-less/coordinated fourth shape). CH-P1 disclosure (three member shapes,
`Bash`/`Edit` mirror) — AD-9 ✓ (internally three) but ✗ as a completeness universal
(P1) / L1 ✓ (matches AD-9). `deny_bypass_suspect` correlation — AD-9 ✓ / AD-4
predicate ✓ / AC-24 fixture ("writing the denied action's own target … a redirected
test run … do not") ✓ / both error directions stated ✓ / `NotebookEdit` omitted
from correlation ✗ (N5a). CHANGE/READ scoping — AD-4 ✓ / regret re-edit clause
(`'ok'` Edit/Write) ✓ / Bash-authored-change miss not in L1/L3 ✗ (N3).
`--missed-question` word/`tune`-command — AD-18 ✓ (mechanically) / undiscriminating
offer ✗ (N2). `tune lexicon.stoplist` — AD-20 writer ✓ / AD-9/L1 "shrunk by tending
the stoplist" now deliverable ✓ / AD-15 "every lexicon" universal removed ✓
(round-7 R7-M1) / tending efficacy (match semantics) unspecified ✗ (N5b). Same-name
cap-vs-floor — L6 ✓ / AC-1b fixture ✓ / crown-a-false-rival accepted (N4). Fold
`BEGIN IMMEDIATE` — AD-26 ✓ (round-7 N7). Status §"Review round 7" — verdict counts
(0 Critical / 1 Serious / 1 Moderate / 1 Minor; 0 collapses / 1 partial / 7 notes)
match both round-7 files ✓; convergence explicitly **not** claimed ✓; the round-8
charter it hands forward includes charter question (b) — audit widened members for
fulfilling-move wrongful denies — which P1 answers NO ✓. `tools/check_docs.py` —
run this session, **exit 0** (mechanical floor holds; my axis is mission-fidelity,
not the checker).

## Owner-fidelity scan of the round-7 text

Every owner/spec key the round-7 diff added or moved was re-read against its row at
its point of use. **No rejected item reintroduced.** Clause (iv) remains a positive
total classification (`OL-R5`'s "define positively" honored; the object-less rule
adds a positive `info` member). The deny still requires an open `kind='info'`
question plus a mutating file move through AD-10's single confined producer — **no
pre-emptive gate** (`OL-C2`/`OL-R4`): the round-7 changes are all reactive
classification. **No generated-file consumption** on any deny input.
**Arbitrary-limit scan (`OL-C1`/`OL-R1`/`OL-R3`):** the object-less rule, the
`lexicon.stoplist` `tune` key, the `deny_bypass_suspect` path-match, the
`--missed-question` word-naming, and the fold transaction are
classification/bookkeeping vocabulary, never a volume/count/budget cap — no
operating number introduced. **No separate credentials, no repo-tree write**
introduced. **No new `OL-*` key manufactured, no owner superlative introduced;**
the `OL-C3`/`OL-C5` uses in clause (iv), L1, and Status are supported by their
CONFIRMED rows. **The one owner-fidelity defect is P1's face on `OL-C5`:** the
object-less seed makes "can you show me?" deny-capable, and the block then denies
the build-`Edit` that shows Max — a move `OL-C5` explicitly protects ("an action
taken to provide that answer") and `D-39` makes never-denying load-bearing. Round 7
widened deny-capability into the object-less class without owning the fulfilling-
move wrongful denies it creates there, leaving the block enforcing against a move
the ledger protects — the enumerate-the-cost repair (P1's repair 1–3) restores
fidelity to `OL-C5`/`D-39`, exactly as round 7's own CH-P1 repair restored it for
the object-bearing case.

## Round-7 repairs that survived their hardest question without a finding

The `deny_bypass_suspect` target-correlation (R7-m1 — produces the asserted "`npm
test > out.log` does not fire" and states both error directions; residual is only
the `NotebookEdit` field gap, N5a). The fold's `BEGIN IMMEDIATE` atomicity (N7 —
the concurrent same-project double-count is genuinely closed; engine-documented
semantics correctly applied). The `AD-15` "every lexicon" universal correction
(R7-M1 — the false universal is removed; residual is only the stoplist-tending
*efficacy*, N5b, not the surface, which is now complete). The recourse-re-arm
framing scope (round-7 N6 — L1 now honestly lists the two-noun/object-less/bare-
re-ask re-arms and the framed-unlisted non-re-arms; no over-suggestion of
robustness remains). The R7-S1 core totality fix for the object-less class **at the
outcome level** (clause (iv) no longer falls through on "can you answer?"; the
under-enforcement gap round 7 named is closed — the two miss-direction residuals it
opens are P1 (over-enforcement) and N1 (parse under-specification)). The §8 deny
confinement (walked above — structure untouched; the deny-capable set widened, and
the widening's wrongful edge is P1).

---

*End of round-8 hunt. Zero full collapses — the fourth consecutive zero-collapse
round — but one partial collapse, inside the round-7 repair text, and it is the
collapse-log's own round-7 inheritance answered NO once more: the P1-lineage false
universal ("exactly N member shapes," now false a seventh time) meeting the
set-widening-has-two-miss-directions lesson (round 7 widened the deny-capable set
via object-less→info, audited the direction it intended — the `OL-C3` recourse for
"can you answer?" — and closed it, but not the opposite direction the same seed
opens: a fulfilling `Edit` for an object-less deny-capable ask whose referent is
build-fulfilled, "can you show me?", is now wrongfully denied, resting on the false
soundness clause "fulfilment is text, which the deny-eligible set can never touch"
— the very universal CH-P1 removed for the object-bearing case in the same commit).
The prescription-carried lesson is validated once more — R7-S1's fix entered as the
round-7 expert review's own prescribed "communicative verb with no object → info"
default, whose fixture pinned "can you explain?" and never considered "can you show
me?". This is **not** the terminal round: the count bars the terminal call, and the
convergence definition (a round that finds nothing real) is unmet. **Inheritance
for round 9:** (1) **P1 is the "widen-the-set has two miss directions" lesson
answered NO for the object-less class** — carry it: the wrongful-deny residual must
be scoped by **fulfilment-by-mutation, not by object-shape**, because every round's
set-widening seed (object-bearing in round 6, object-less in round 7) has slipped a
new fulfilling-move member past an object-shape-scoped enumeration; verify the
repair lands at AD-9's object-less rationale, AD-9's shape-(3) definition, L1's
shape-(3), **and** AD-24's corpus (all four, per the round-6 lesson that a fix must
land at every site the finding names — and specifically that AD-24 pins the
*malign* object-less representative "show me", not only the benign "explain"). (2)
**Attack the object-less soundness clause directly** — "fulfilment is text, which
the deny-eligible set can never touch" is false for `show`/`confirm` and
contradicts CH-P1's own "denies every repo mutation" one hundred lines below; a
fix that merely re-scopes shape (3) without correcting *this clause* leaves the
contradiction live. (3) **Re-audit the parse under-specification (N1)** — clause
(iv) is outcome-total but its head-noun identification for compounds/PP/coordination
is an unspecified model-free step; confirm a round-8/9 fix either pins the
model-free head rule or states it Phase-B-precise, and that its safe-either-way
claim still holds once P1's build-fulfilled compounds are excluded. (4) **The N4
crown-a-false-rival cost** — whether a *false positive recommendation* earns the
`OL-C4` hazard "speak flagged" posture, or whether `symbol_refs` should be
lexer-scoped (round-6 P4's option), is an unresolved mission-axis choice a round-8
fix may or may not settle.*
