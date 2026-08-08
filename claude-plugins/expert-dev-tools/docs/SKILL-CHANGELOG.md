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

