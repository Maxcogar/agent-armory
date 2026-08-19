# Skill changelog — expert-dev-tools

## What this file is for

**Purpose: to make a skill change made here applyable to the same skill elsewhere.** These skills
exist in several copies across this repository and on the machine, and a change made in one copy is
invisible to the others. They have already drifted — `expert-review/SKILL.md` alone currently exists
at four different byte sizes across five locations. An entry here carries what someone needs in
order to reproduce a change in another copy and to judge whether it belongs there: the anchor text
that locates it, the exact text that was inserted or replaced, and the evidence that motivated it.
Without the anchor the change cannot be found; without the evidence it cannot be evaluated, only
copied.

### What goes in it

Every change to a file under `claude-plugins/expert-dev-tools/skills/` — SKILL.md files and their
`references/`. One entry per change, written in the same edit that makes the change, including
one-line edits.

Scope is `skills/` and nothing else because `skills/` is the part of this plugin that exists in
duplicate. The workflow, agents, command, tests and docs exist only here; their history is git and
the review records under `docs/reviews/`, and duplicating it into this file would create a second
account of the same thing.

### What does not go in it

- **Non-changes.** A decision not to apply something, an observation left open, an item deferred —
  these are not changes and have their own home in
  `~/.claude/skill-observations/log.md`, where status is tracked. Recording a non-change here
  creates a second place holding the same state, and the two drift the moment either moves.
- **Propagation state.** Which copies are authoritative, and which have received a given change, is
  not tracked here. A propagation matrix maintained by hand would drift against reality — the exact
  defect two of these entries exist to fix.
- **Observations, findings, or reasoning that produced no edit.** Those live in the observation log
  and the review records.

### One deliberate exception on verbatim text

Entries reproduce the changed text verbatim, because that is what makes them applyable. The
exception is an addition long enough that reproducing it creates a second copy to keep in sync —
change 4 below is ~15 lines and is summarised with a pointer to the file instead. The rule: verbatim
by default; summarise only when the copy would itself become a drift site, and say so in the entry.

**Entry format.** Date · file · section · anchor · the change verbatim · why, with its evidence ·
observation reference.

---

## 2026-08-08

Four changes, from observations 76–79 in `~/.claude/skill-observations/log.md`. All four originate
in a single session that ran three independent review rounds against one plan; each is a defect the
reviews surfaced in the skills themselves rather than in the work under review.

---

### 1 · `skills/expert-review/SKILL.md` · Step 6, claim-type list · **added a bullet**

**Anchor.** Insert immediately after the existing bullet beginning
`- **Comment claims inside the artifact**`, as the last item in Step 6's claim-type list.

**Added:**

> - **Claims about files outside the artifact under review** (a sibling project's document, a
>   shared standard, another repository's source, a run transcript): verify by reading, as any
>   claim of its type requires — then **cite it by an immutable identifier, never by path alone.**
>   A file under version control is cited by path *and commit*. A file outside version control (run
>   transcripts, plugin caches, generated logs) is cited by path and date, with its unpinnable
>   status stated. A path-and-date citation to a mutable file stops being checkable the moment that
>   file changes, and in a repository with parallel sessions that can be hours. Empirically: a
>   reviewed artifact's designated load-bearing claim quoted three sentences from a sibling
>   project's document, accurately, and an unrelated session rewrote that document four hours later
>   — the quote was correct when taken and unreachable when checked, and the replacement text
>   contradicted the generalization built on it. The failure is the citation format, not the
>   author's honesty, which is exactly why it is fixed here rather than treated as a lapse.

**Why.** Step 6 specified verification methods per claim type but said nothing about how a verified
claim is *cited*, so a correctly-verified claim could become unverifiable to the next reader
through no fault of the author. Observed directly: a plan's `§11` claim 27, labelled in that plan
as "the claim the entire correction discipline rests on," quoted
`mcp-servers/aps-fusion-mcp-server/HANDOFF.md` by path and read-date. Commit `cd2f27b` rewrote that
file roughly four hours after the read and removed the quoted section. Round 1's reviewer flagged
the claim as unverifiable against current source and confirmed via `git show` that the text had
existed verbatim at `755bf9b`. Worse than staleness: the replacement content documented the same
project's *next* phase failing under the discipline the plan had generalized from it.

**Observation 76.**

---

### 2 · `skills/expert-review/SKILL.md` · Post-fix review · **added a paragraph**

**Anchor.** Insert immediately after the existing paragraph beginning
`A Post-fix review is not a special protocol — it is an ordinary full review whose inventory…`.

**Added:**

> **Each round is performed by a reviewer that has not seen the prior round.** The prior round's
> findings reach this review as a written record — the fourth inventory source above — and never as
> the reviewer's own retained context. A reviewer still holding its own prior findings, and the
> author's replies to them, is anchored to the defect space it already mapped: it checks whether
> its notes were addressed instead of reviewing the artifact, and the resulting report is
> indistinguishable from a real review. Independence is a property of the reviewer's starting
> state, not only of how neutrally it is briefed. Where rounds are dispatched to subagents, each
> round gets a fresh dispatch; where a human reviews, the prior round's reviewer is not the one to
> run the next.

**Why.** The skill defined the post-fix *inventory* precisely but never said who performs the
review. The cheap and natural reading is to hand it back to the reviewer that produced the prior
round, which silently converts an independent review into a check that the author addressed one
reviewer's notes — and the output looks identical either way, so the substitution is invisible.
Corroborated on a second project: `mcp-servers/aps-fusion-mcp-server/HANDOFF.md` at commit
`cd2f27b` records that of six plan-review rounds, "Round 6 is the only one dispatched without
author-supplied direction; the first five were steered, so their coverage reflects where they were
pointed rather than where defects were."

**Observation 77.**

---

### 3 · `skills/expert-plan/references/output-contract.md` · three edits · **§11, §12, Gate C**

**3a — §11 evidence, added a paragraph.** Anchor: insert immediately before the existing paragraph
beginning `A claim that could not be verified does not appear in the Plan section`.

> **Citation identity — the evidence must be reachable by the next reader.** Where a cited artifact
> can change independently of this plan, the citation carries an immutable identifier, never a path
> alone: a file inside the artifact under change is cited by path and line range; a file elsewhere
> in the same repository by path **and commit**; a file outside version control (run transcripts,
> plugin caches, generated logs) by path and date, with its unpinnable status stated; documentation
> by library ID or URL with date. A path-and-date citation to a mutable file stops being checkable
> the moment that file is edited — in a repository with parallel sessions, that can be within hours
> — and the next reader cannot distinguish "this was never true" from "this was true and the source
> moved." Empirically: a plan's designated load-bearing claim quoted a sibling project's document
> accurately, an unrelated session rewrote that document four hours later, and the claim became
> unverifiable while the plan still rested on it.

**3b — §12 test specifications, modified in place.** In the parenthetical describing the real/double
boundary field, after `real is the default`, the text now reads:

> — **and where a double supplies an input the system under test reads, the specification names the
> production component contractually obliged to supply that input and where the obligation is
> written**; if no such obligation exists, the test is green over a path that cannot execute

**3c — Gate C, added three checklist items.** Anchor: insert after the existing item beginning
`- Every test specification (Output section 12) has all five fields`, which was itself extended
with the double-obligation clause.

> - …and any double that supplies an input the system under test reads names the production
>   component obliged to supply it — a double standing in for an obligation that does not exist is
>   non-compliance.
> - Every claim in Output section 11 that cites an artifact outside the work under change carries an
>   immutable identifier — commit for an in-repository file, date plus a stated unpinnable status
>   for anything outside version control, library ID or URL plus date for documentation. Path-only
>   citation of a mutable artifact is non-compliance.
> - The restating sections (2, 3, 5, 11, 12, 14, plus section 1's Goal and section 13's counts) were
>   re-derived from the current step set after the last step edit, not patched. A plan whose step
>   set changed after these sections were last written has not satisfied this item.

**Why (3a).** Same evidence as change 1 — the contract's four evidence forms all permit path-only
citation, so §11, the contract's own "premise-correctness proof," could contain a claim no reader
can reach.

**Why (3b).** A plan specified a runtime control reading a field off an agent's structured return,
and a test whose hand-written stub supplied that field. No step obliged any agent to emit it and the
field was optional in the schema, so the control was inert in production while its test passed
green. The five specified fields could not catch it: the double's justification was sound and the
assertions targeted real behaviour. The missing check is upstream of all five — whether anything is
obliged to produce what the system reads. The identical shape recurred one round later on a second
field, after the first instance had been fixed at its named site.

**Why (3c).** Gate C is the binary checklist; a requirement stated in a section definition but
absent from the gate is not enforced at delivery.

**Observations 76, 78, 79.**

---

### 4 · `skills/expert-plan/references/output-contract.md` · **new section**

**Anchor.** Insert immediately before the heading `## Compliance gates — before delivering`.

**Added:** a section titled `## Sections that restate the step set — known drift sites`, naming the
six restating sections plus §1's Goal and §13's counts, stating that none is generated, and
carrying three rules — re-derive rather than patch on any step edit; treat a finding in any
restating section as a class signal rather than an instance; and keep the enumeration itself
current, since it is hand-maintained too. It closes by naming the real fix (a machine-readable
per-step declaration from which §2, §5 and §12 are generated) as unavailable today, and states
plainly that the rules are a mitigation that reduces the drift rate rather than eliminating it.

*(Full text is in the file; it is ~15 lines and reproducing it here verbatim would create a second
copy to keep in sync — which is the defect the section describes.)*

**Why.** The contract mandates nine surfaces that restate the step set, on a prose artifact with no
build step. Measured on one plan across two review rounds: **eleven of twenty-three findings were
drift in those sections.** Every one was correct when written and stale after the next step edit.
The same class is recorded independently at
`mcp-servers/aps-fusion-mcp-server/HANDOFF.md` @ `cd2f27b`: "one defect *shape* kept reappearing
somewhere new: a hand-maintained cross-reference or enumeration with no generator, drifting on the
next edit. Ten distinct locations across six rounds," with three of round 5's findings manufactured
by round 4's fixes and three of round 6's by round 5's.

The in-document mitigation attempted before this change failed in an instructive way: it added a
maintenance rule stating that test specifications must not name their steps — which the contract
itself *requires* — so the rule was violated by 21 of that plan's 22 specifications and became a
22nd drift site. That is why this change lives in the contract rather than in any plan written to
it, and why it states its own limits.

**Observation 78.**

---

### 5 · `skills/expert-plan/references/testing-standards.md` · Fake-Test Anti-Pattern Catalog · **added entry 11**

**Anchor.** Append after existing entry `10. **Flake-tolerated.**`

**Added:**

> 11. **Unobliged input.** The test's double supplies a field or value that **no production
>     component is contractually required to emit**. Structurally the test looks correct — the
>     double is a legitimate stand-in for a slow or nondeterministic dependency, its justification
>     is sound, and the assertions target real behaviour — so none of the other entries catch it.
>     What is missing is upstream: the system under test reads something nothing is obliged to
>     produce, so the path runs in the test and is dead in production. Check: name the production
>     component that supplies this input and the contract that obliges it; if you cannot, the test
>     is green over a path that cannot execute. Distinct from entry 1 (Testing the mock), where the
>     assertions target the double — here the assertions are fine and the *precondition* is
>     manufactured.

**Why.** Same evidence as 3b. The catalog's ten entries all describe a test that verifies its own
wiring or its own data; this shape verifies real behaviour on a precondition that only the test
supplies, and passes every existing check.

**Observation 79.**


---

### 6 · `skills/expert-plan/references/output-contract.md` + new `skills/expert-plan/scripts/derive-plan-sections.mjs` · derived sections become generated · **five edits + one new file**

**Owner-authorized 2026-08-08** ("i agree that the change needs to be made"). This is the change
the previous contract predicted for itself: its drift-sites section closed with "Closing it
requires a machine-readable per-step declaration … from which sections 2, 5 and 12 are generated
rather than authored." That declaration and its generator now exist.

**The change, summarized with pointers** (verbatim reproduction would itself become a drift site —
the changed text spans five sites; read the file at the anchors):

1. **Section 7's step format** (anchor: item `7. **Plan**`) now requires every step to open with a
   fenced ` ```step-decl ` YAML block — `step` ID, `covers` (requested-work element IDs), `files`
   (create/modify/delete), `tests` (spec IDs), `depends_on` — the single source of truth for the
   derived surfaces.
2. **Section 2** (anchor: item `2. **Scope**`): the element→step coverage table is a generated
   region between `<!-- generated:coverage begin/end -->` markers; element vocabulary and
   exclusions stay authored.
3. **Section 5** (anchor: item `5. **Files affected**`): the file→step table is a generated region
   between `<!-- generated:files begin/end -->` markers; CodeGraph dependents/related-docs lists
   stay authored.
4. **Section 12** (anchor: "Plan-step Verification fields reference"): spec ID lines must begin
   `- **T-<id>**` or `### T-<id>` so the script can cross-check them.
5. **The drift-sites section** (anchor: heading now reading `## Derived sections are generated`)
   is rewritten from a hand-maintenance mitigation into a two-regime rule: generated surfaces
   (2, 5, step↔test refs — script-written, never hand-edited) vs authored surfaces (3, 11, 14,
   §1 Goal, §13 counts — re-derive-never-patch discipline unchanged). Gate C's re-derivation
   checklist item is split accordingly, adding: `derive-plan-sections.mjs --check` must exit 0 on
   the delivered document.

**New file** `scripts/derive-plan-sections.mjs` (~200 lines, no dependencies, Node ≥16):
regenerates the two marker regions from the step-decl blocks; `--check` mode exits non-zero on
stale regions, a step referencing a nonexistent test spec, an orphaned test spec, an unresolved
`depends_on`, a duplicate step ID, or a malformed/incomplete declaration. Verified against a
fixture 2026-08-08: stale-detect, regenerate, clean pass, and broken-reference detection all
observed.

**Why.** Hand-maintained restatements of the step set generated 6 of round 2's 13 and 5 of round
3's 10 findings on `docs/plans/plan-expert-dev-tools-behavioral-remediation.md`, and the same
class appears at ten locations across six rounds in the sibling project record
(`mcp-servers/aps-fusion-mcp-server/HANDOFF.md` @ `cd2f27b`). Three review rounds under explicit
maintenance rules did not converge the class; the owner ruled the surfaces "have to be converted,
not swept harder" (docs/HANDOFF.md, owner rulings). Generation makes the mechanical half of the
drift class structurally impossible instead of forbidden.

**Propagation note.** The three mirror copies
(`skills/Expert-Skills/expert-plan/`, `middleware/context-oracle/.claude/skills/expert-plan/`,
`mcp-servers/aps-fusion-mcp-server/.claude/skills/expert-plan/`) are an older contract revision
that also predates changes 3a/3b above; applying this change there requires applying those first
or accepting the plugin copy wholesale. Applying it means copying the `scripts/` directory too —
the contract now references the script by path.

---

### 7 · `skills/expert-plan/references/output-contract.md` + `skills/expert-plan/scripts/derive-plan-sections.mjs` · round-1 review corrections to change 6 · **script rewrite + four contract edits**

**Trigger.** Independent review of change 6 returned NEEDS_FIXES with ten findings
(`docs/reviews/output-contract-generated-sections-round-01.md` — 1 Critical, 1 Systemic,
2 Serious, 4 Moderate, 2 Minor, every premise verified by execution). All ten are applied here.

**Script** (rewritten; behaviors re-verified by fixture probes 2026-08-08, including on a
CRLF-line-ending fixture):

- **F-1 (Critical):** the generator now emits regions with the document's line ending (any CRLF
  present means CRLF, else LF) — regenerate-then-check reaches a fixed point on CRLF documents
  (verified: regenerated CRLF fixture measures 0 bare LF and `--check` exits 0).
- **F-3 (Serious):** `--check` is recognized at any argument position; unknown flags and extra
  operands are errors. Check mode structurally cannot write.
- **F-2 (Systemic), all three instances:** `files:` with an inline value is an error, not a silent
  discard; a repeated key is an error, not a silent overwrite; list entries containing brackets,
  braces, or quotes are rejected (comma-in-entry is excluded by grammar — a comma always separates
  entries, stated in the contract).
- **F-5 (Moderate):** the test-ID scan is bounded to the "Test specifications" section (heading to
  next same-or-higher-level heading), so a bold test ID cited in Risks or elsewhere no longer trips
  the orphan check. A missing "Test specifications" heading is now itself an error.
- **F-6 (Moderate):** a required ` ```plan-elements ` block declares the element vocabulary; the
  script errors on any declared element no step covers and any `covers:` entry not in the
  vocabulary — coverage completeness is now checked mechanically, both directions.
- **F-8 (Moderate):** region replacement uses a replacer function, so `$` sequences in derived
  content are literal (verified: a `src/$&weird.js` path renders intact).
- **F-10 (Minor):** both sorts pin `localeCompare(…, 'en', {numeric: true})`; duplicate marker
  pairs for one region are an error.

**Contract** (four edits; anchors):

- **F-4 (Serious)** — anchor: new **Applicability** paragraph at the end of the "Derived sections
  are generated" workflow list: the regime governs plans authored after this revision; a plan
  authored earlier is graded against its own revision, cited by commit in the review dispatch;
  retrofitting mid-review-cycle is named as the re-authoring failure mode. (The in-flight
  `docs/plans/plan-expert-dev-tools-behavioral-remediation.md` is governed by revision `94a640a`;
  its round-4 review was dispatched with that pin — corroborated by the record at
  `docs/reviews/plan-behavioral-remediation-round-04.md`, whose header states the pinned revision
  was read via `git show` and the working-tree copy was not consulted.)
- **F-7 (Moderate)** — anchor: section 7's step-declaration paragraph no longer calls the block
  YAML; it is a "restricted key/inline-list grammar (not general YAML)" with the constraints
  reproduced in the contract: five keys exactly once, inline lists only, no block sequences, flow
  mappings, quoting, or comments, and no commas/brackets/braces/quotes inside entries.
- **F-6 disclosure** — anchor: section 2's spec now describes the plan-elements block, states what
  is mechanically checked, and states the residual judgment (vocabulary completeness against the
  actual request) that remains human.
- **F-9 (Minor)** — anchor: the workflow list's first bullet resolves the script path relative to
  the `references/` directory this contract is read from; a new bullet states the
  Node-unavailability disposition: a halt per the skill's doctrine, never a waiver.
- **Upstream-narrowing disclosure** (from the review's Upstream table) — anchor: the "Generated —
  written only by the script" paragraph now states that §12 is deliberately cross-checked rather
  than generated, and why.

**Not done here.** The reviewer's non-finding suggestion to trial the repaired script against a
retrofit of two or three real steps from the in-flight plan was not performed — the applicability
ruling keeps that plan on revision `94a640a`, and a retrofit trial belongs to the first plan
authored under the new regime.

---

### 8 · `skills/expert-plan/scripts/derive-plan-sections.mjs` + `docs/HANDOFF.md` · round-2 review corrections to changes 6–7 · **four script fixes + two doc corrections**

**Trigger.** Round-2 independent review returned NEEDS_FIXES with five findings
(`docs/reviews/output-contract-generated-sections-round-02.md` — 1 Systemic, 1 Serious,
1 Moderate, 2 Minor; nine of round 1's ten findings confirmed closed by execution). All five
applied here; every fix re-verified by fixture probes 2026-08-08 (exit codes confirmed non-zero).

**Script:**

- **G-1 (Serious):** markers present but unmatchable — trailing space after the begin marker,
  content on the marker line, reversed order, both markers on one line — are now a named error
  instead of a silent `OK`. All four round-2 reproductions re-probed: each errors, exit 1.
- **G-2(a) (Systemic instance):** `elements: []` is an error — the completeness check has no off
  switch; a plan must declare at least one requested-work element.
- **G-2(b), closing round 1's F-2 instance 3:** list entries are single whitespace-free tokens,
  enforced. A path containing a comma or space cannot be declared in this grammar at all; the
  header and contract state explicitly that the parser forbids the characters rather than claiming
  to detect a comma-split path. (This entry originally named a "delivery-time diff-vs-§5 check" as
  the backstop; round 3's H-1 established no such delivery-time check can exist — the backstop is
  §16's implementation-time file-list reconciliation, added by entry 9.)
- **G-2(c):** duplicate entries within one list are an error (was: aggregated into `S1, S1`).
- **G-2(d):** the `depends_on` graph is checked for acyclicity (iterative three-color DFS);
  self-dependencies and multi-node cycles both error.
- **G-5 (Minor):** header corrected — the example `step-decl` no longer carries inline comments
  the parser rejects (key meanings moved to prose below it); the rejected-character list includes
  quotes; the line-ending rule is stated as it is implemented (any CRLF present ⇒ CRLF, else LF).

**Docs:**

- **G-3 (Moderate)** — `docs/HANDOFF.md` "What to do": the round-4 paragraph now records the round
  as done with its verdict and record path, and a new paragraph requires every further plan-review
  dispatch to cite the output contract by commit (`94a640a` for the in-flight plan), stating why an
  unpinned dispatch mis-grades. (HANDOFF.md is outside this changelog's skills/ scope; recorded
  here because the finding belongs to this change's review thread.)
- **G-4 (Minor)** — entry 7's past-tense pin claim now cites its corroborating record,
  `docs/reviews/plan-behavioral-remediation-round-04.md`, whose header states the pinned revision
  was read via `git show`.

---

### 9 · `skills/expert-plan/references/output-contract.md` + `scripts/derive-plan-sections.mjs` · round-3 review corrections to changes 6–8 · **one real backstop + spec sweep + two minor fixes**

**Trigger.** Round-3 independent review returned NEEDS_FIXES with four findings
(`docs/reviews/output-contract-generated-sections-round-03.md` — 1 Systemic, 1 Serious, 2 Minor;
all five round-2 findings and round 1's last open instance confirmed closed by execution). All four
applied; each re-verified by probe or sweep 2026-08-08.

- **H-1 (Serious):** the "delivery-time diff-vs-§5 backstop" cited at three sites did not exist.
  Resolution: §16 (Post-completion) now REQUIRES a file-list reconciliation — `git diff --stat`
  against the pre-implementation baseline compared with §5's generated table in both directions —
  as the implementation-time check that surfaces a phantom path. All three citation sites (script
  header, inline comment, entry 8's G-2(b) bullet) rewritten to cite that check and to state why no
  delivery-time equivalent can exist (no diff before implementation). Sweep: `grep "delivery-time
  diff"` → only the historical note in entry 8 remains.
- **H-2 (Systemic):** five parser-enforced constraints were absent from the contract's grammar
  text. All five now stated where an author reads them: single whitespace-free tokens and
  no-duplicate-entries (§7 grammar paragraph), `depends_on` acyclicity (§7 grammar paragraph),
  non-empty element vocabulary (§2's plan-elements spec), marker-line form (workflow list). Plus
  the binding rule as a new workflow bullet: **this contract and the script move together** — any
  change to what the script accepts/rejects/checks carries a same-edit update to the contract's
  grammar and workflow text and its changelog entry.
- **H-3 (Minor, recurring):** "dominant line ending" swept as a class this time — the inline
  comment at the `eol` assignment and entry 6's F-1 bullet both corrected to the implemented rule
  (any CRLF present ⇒ CRLF, else LF); `grep dominant` → 0 across script, contract, changelog.
- **H-4 (Minor):** a malformed `plan-elements` vocabulary no longer also claims the author wrote
  `elements: []` — the empty-vocabulary error is emitted only when the list genuinely parsed
  empty (probed: malformed forms emit exactly their own error; genuine `[]` still errors).

---

### 10 · `skills/expert-plan/references/output-contract.md` + `scripts/derive-plan-sections.mjs` · round-4 review corrections to changes 6–9 · **indented-fence support + three divergence closures**

**Trigger.** Round-4 independent review returned NEEDS_FIXES with two findings
(`docs/reviews/output-contract-generated-sections-round-04.md` — 1 Systemic, 1 Serious; all four
round-3 findings confirmed closed, zero regressions). Both applied; verified 2026-08-08 against a
realistic prose plan (CRLF, declarations indented inside numbered §7 items) and against the
contract's own example extracted verbatim and executed.

- **I-1 (Serious):** fenced `step-decl` and `plan-elements` blocks may now be indented — the
  parser captures the fence's leading whitespace and strips it from every content line, so
  relative indentation (files sub-keys) survives at any depth. The contract states this beside the
  example. Probe: the contract's own four-space-indented example, extracted verbatim, regenerates
  and passes `--check` (was: 13 errors).
- **I-2 (Systemic), all three divergences, moving side named per instance:** *(parser)* an
  omitted `files:` sub-key is an error, never an implicit `[]` — absence is always an authoring
  error since all three are declared explicitly (probed: dropping `delete:` errors at both decls);
  *(contract)* the step-ID suffix is stated as it is implemented — a single lowercase letter
  `a`–`z`, not "`a`/`b`" (probed: `S2z` accepted); *(class closure)* the move-together rule is now
  bidirectional — contract-text changes, including fenced examples, are validated by running them
  through the script in the same edit, which is the check that would have caught I-1 when the
  example was written.

---

### 11 · `skills/expert-plan/references/output-contract.md` + `scripts/derive-plan-sections.mjs` · round-5 review corrections to changes 6–10 · **spec sweep completed both directions + two diagnostic fixes**

**Trigger.** Round-5 independent review returned NEEDS_FIXES with four findings
(`docs/reviews/output-contract-generated-sections-round-05.md` — 1 Systemic, 3 Minor; Serious count
reached zero for the first time; both tripwire conditions armed). All four applied and the
move-together rule's own mechanical check executed as part of this edit.

- **J-1 (Systemic, recurring):** the rule installed by entry 10 was violated by entry 10's own
  edit. Closed both halves: the contract now states the `files:` sub-key requirements (no inline
  value; all three sub-keys present exactly once, `[]` when empty) and the fence-indentation rule;
  and §2 now carries a fenced `plan-elements` example — which the rule's paste-both check
  requires and which did not exist. The two examples are made mutually consistent (the step-decl
  example covers `R-3` from the plan-elements vocabulary) and the paste-both check was RUN for
  this edit: both examples extracted verbatim, regenerate + `--check` exit 0.
- **J-2 (Minor, regression):** an inline `files:` value now emits exactly its own error — the
  three missing-sub-key errors are suppressed when `files:` itself was rejected (probed: 2 errors
  on the two-decl fixture, was 8).
- **J-3 (Minor):** a content line not carrying the fence's indentation is an error naming the line
  (probed), completing round 4's I-1 resolution as specified.
- **J-4 (Minor):** `docs/HANDOFF.md`'s changelog pointer corrected from "entries 6–7" to
  "entries 6–11".

---

### 12 · `skills/expert-plan/` · tripwire-mandated foundational rework of the contract↔script relationship · **`--self-check` mode + committed fixture + three parser fixes**

**Trigger.** Round-6 independent review fired BOTH tripwire conditions
(`docs/reviews/output-contract-generated-sections-round-06.md` — trajectory 10 → 5 → 4 → 2 → 4 → 5,
two consecutive rounds of fixes manufacturing as much as they closed). Per the tripwire's rule the
fix loop stopped; the owner authorized foundational rework 2026-08-09. The diagnosis across three
rounds of K-1/J-1/I-2: the move-together rule was prose discipline, and its own author violated it
in the edit that installed it. This rework replaces the discipline with an exit code.

**Structural change** — the script's pipeline is refactored into a pure `processDocument(text)`
and a new **`--self-check` mode** runs it against three populations (15 checks, all passing):

1. the contract's own fenced examples, extracted verbatim and composed into a scaffold — must
   parse, cross-check, and reach a regeneration fixed point;
2. a **committed fixture**, `scripts/fixtures/valid-plan.md`, exercising the full grammar
   (indented and column-0 fences, suffixed IDs, all three sub-key forms, dependency chain, both
   spec-ID line forms) — must check clean as committed;
3. thirteen embedded negative cases — every stated grammar constraint must demonstrably reject
   its violating input.

The contract's move-together rule now *invokes* `--self-check` instead of prescribing a manual
paste, states that a non-zero exit blocks delivery of the edit, and names its own residue (prose
stating no checkable constraint remains hand-read). Empirical footnote: the fixture's hand-written
files table was wrong on first `--self-check` (row order), caught immediately by the check — the
class's existence proof, in miniature, inside the artifact built to kill it.

**Parser fixes from round 6, verified by probe:**

- **K-2:** the Test-specifications section scan no longer terminates at `### T-<id>` spec
  headings — the section ends at the next same-or-higher-level heading that is not itself a spec
  heading (probed at section levels 2 and 3).
- **K-3:** the section anchor requires a heading whose text is exactly "Test specifications"
  (optionally numbered), not any heading containing the phrase (probed with a decoy
  "Notes on Test specifications" heading).
- **K-4:** a mis-indented content line yields exactly one error naming the line — the line is
  de-indented as far as possible so parsing continues without a false missing-key cascade
  (probed: 1 error, was 4).
- **K-5:** `docs/HANDOFF.md`'s changelog pointer is unbounded ("entries 6 onward") instead of a
  hand-enumerated range.

---

### 13 · `skills/expert-plan/references/output-contract.md` + `scripts/derive-plan-sections.mjs` · round-7 review corrections to change 12 · **three true sentences + two diagnostic fixes**

**Trigger.** Round-7 (post-rework round 1) returned NEEDS_FIXES with four findings
(`docs/reviews/output-contract-generated-sections-round-07.md` — 1 Systemic, 1 Serious, 2 Moderate;
counters restarted at the rework, K-2/K-3/K-5 confirmed closed). All four applied 2026-08-09.

- **L-1 (Systemic):** three contract sentences about the executable made true: the §2 paste
  parenthetical now says `--self-check` composes the examples and that a bare paste is not a
  complete document; the self-check description claims exactly what it asserts ("a suite of
  negative cases spanning the grammar's constraint families — thirteen at this writing"), states
  that unasserted constraints are enforced-but-not-asserted, that the case list is itself
  hand-maintained with a same-edit rule, and names BOTH residues including the parser→contract
  direction ("`--self-check` proves what it asserts, not that the assertion list is complete").
- **L-2 (Serious):** §12's spec now states its heading text is an exact anchor ("Test
  specifications", optionally numbered) and that a differently-worded heading fails the check.
- **L-3 (Moderate):** the indentation-cascade recovery covers sub-keys as well as top-level keys —
  the offending line is normalized to the shape its key implies (sub-keys regain one indent level,
  others go to column 0). Probed: one error for a mis-indented `delete: []`, one for a
  mis-indented `covers:` (was 3–5 including false unparseable-line errors).
- **L-4 (Moderate):** the self-check scaffold derives its stub steps, coverage, and spec list from
  the contract's examples instead of hardcoding IDs. Probed: a contract copy with every example ID
  renamed passes 15/15; a genuinely broken example fails with a diagnostic naming only IDs that
  exist in it. (The first version of this fix regressed on indented examples — caught by the
  self-check itself before delivery, which is the mechanism doing its job.)

---

### 14 · `skills/expert-plan/references/output-contract.md` + `scripts/derive-plan-sections.mjs` · round-8 review corrections to changes 12–13 · **guard for the thrice-recurring site + count removed**

**Trigger.** Round-8 review returned NEEDS_FIXES with two findings
(`docs/reviews/output-contract-generated-sections-round-08.md` — 1 Moderate, 1 Minor; all four
round-7 findings closed by execution, zero recurrences, zero regressions, all 18 stated
constraints probed enforced). Both applied 2026-08-09.

- **M-1 (Moderate):** the fence-indentation constraint — the site that produced J-3, K-4, and L-3
  in three consecutive rounds — now has a negative case in the `--self-check` suite: an indented
  fence with one un-indented content line must error, with **exactly one** error (the case also
  asserts the no-cascade property via a new exact-count field in the harness). Verified by the
  review's own adversarial probe: deleting the indent check from a scratch copy now fails
  self-check (was: 15/15 green).
- **M-2 (Minor):** the contract no longer states a case count — the suite enumerates itself in
  `--self-check`'s output, and the sentence now says why no count is written ("a hand-written
  count is exactly the drift this regime exists to prevent"). Sweep: zero number-words or numeric
  case counts remain in the contract.

---

### 15 · `skills/expert-plan/` + `docs/HANDOFF.md` · round-9 review corrections to changes 12–14 · **indentation class closed by restructure, not by a fourth guard**

**Trigger.** Round-9 review returned NEEDS_FIXES with three Moderate findings
(`docs/reviews/output-contract-generated-sections-round-09.md`; both round-8 findings closed by
execution; the fence-indentation site's fourth consecutive finding). Applied 2026-08-09.

- **N-1 + N-2, closed as one class:** the parser no longer decides a line's interpretation by its
  indentation. `create`/`modify`/`delete` are reserved sub-key names — interpretation is keyed on
  the name alone, and indentation is an orthogonal check contributing exactly one error per
  deviation (sub-key at column 0, top-level key indented, or line not carrying the fence indent),
  never changing how the line or its neighbours parse. The K-4/L-3 normalization branch became
  dead code under this scheme and was REMOVED rather than guarded. Contract grammar text states
  the reserved-name rule. Suite grows to 19 checks: three new exact-count cases (un-indented
  sub-key, de-indented sub-key in indented fence, indented top-level key). Probed: round 9's N-2
  reproduction (under-indented sub-key that previously produced six diagnostics, five false) now
  yields exactly one accurate error.
- **N-3:** `docs/HANDOFF.md`'s "What to do" paragraph rewritten to current fact — the plan-review
  loop ran rounds 4–8 and ended by tripwire, the owner approved the plan's substance 2026-08-09,
  the plan was executed 26/26 with both tiers green, and the implementation is under its own
  review. The dispatch-pinning paragraph survives verbatim, as the review directed.

---

## 2026-08-17

Two changes, from the behavioral-acceptance feedback sweeps (runs wf_61b4beae through
wf_70b31630): every sweep escalated the questions-treated-as-work-orders class (5-9 occurrences),
root-caused to the absence of any authorization rule in the always-on frame and the phase skills.
Owner approved 2026-08-17 (deferred corrections #1/#5; the same 0.3.0 batch also changed
commands/, agents/, and workflows/ — their record is git, per this file's scope rule).

---

### 16 · `skills/expert-standard/SKILL.md` · four edits · **the authorization axis**

**16a — "The Shift" intro.** Replace `Two shifts, working together. Neither alone is sufficient.`
with `Three shifts, working together. None alone is sufficient.`

**16b — third shift paragraph.** Insert immediately before the paragraph beginning
`These shifts are related.`:

> **Act only on authorization, not on inference of intent.** Before any Edit, Write, commit, or
> agent dispatch, name the specific owner instruction that authorizes it. If the most recent owner
> turn is a question or discussion, there is no authorization: an owner question is a request for
> information, never authorization to edit, fix, plan, or proceed — answer in the response and
> stop. During diagnosis or investigation, hold candidate causes as candidates: no verdicts,
> severities, or remediation sequences unless requested. When an owner message raises multiple
> points, engage every point rather than answering one and acting on the rest.

**16c — failure-signal count.** Replace `Four signals that the Expert Standard isn't being
applied:` with `Five signals…`; insert immediately before `**Assessment gaps.**`:

> **Unauthorized changes.** An artifact changed and no owner instruction can be quoted that
> ordered the change. The tell is a question in the transcript followed by an edit: the owner
> asked "why" or "what if" and something got modified. If you cannot point at the directive that
> authorized a mutation, the mutation was the helpfulness default acting, not you following an
> instruction.

**16d — frontmatter description (activation surface).** Insert before `If Claude is producing or
evaluating engineering work, this skill applies`:

> Also activates before any Edit, Write, commit, or agent dispatch made in response to an owner
> message — the authorization axis: name the instruction that authorizes the change, and if the
> owner's turn was a question or discussion, answer it and change nothing.

**Why.** The sweeps' diagnosis, verbatim root cause: the frame "governs only two axes (judge
against named standards; verify claims against source) and contains no authorization axis," so
"the default helpfulness bias ('a question about a problem implies a desire for the fix') decides,
and questions convert into unauthorized changes." Evidence: eight sweep dispositions across five
runs; the owner's standing memory feedback_questions_are_not_work_orders.md predating them.

---

### 17 · `skills/expert-plan/SKILL.md` + `skills/expert-implement/SKILL.md` · appended section · **inbound owner messages**

**Anchor.** Appended as a new final section, identical in both files:

> ## Inbound owner messages: questions are not work orders
>
> Before acting on any owner message, classify it: **INTERROGATIVE** (asks why/what/how/whether,
> explores an option, requests status or explanation) or **DIRECTIVE** (explicitly instructs a
> change). An interrogative is answered with evidence only — candidate fixes may be described as
> candidates, but NO artifact, code, ledger, or plan edit is made in response to it. Only an
> explicit directive authorizes changes, and only the changes it names. If classification is
> ambiguous, ask the owner one clarifying question before touching anything.

expert-implement additionally appends:

> In this skill specifically: an owner question mid-execution never expands the current
> step's authorized scope — the Step-3 scope rule binds until an explicit directive changes it.

**Why.** Same evidence as 16. Both skills governed only questions the agent ASKS (expert-plan's
question register; expert-implement's scope rule is defined against the plan alone) — no rule
existed for messages the owner sends.
