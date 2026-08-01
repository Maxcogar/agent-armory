# Skill Observation Log

Observations captured during task-oriented work. Each entry identifies a
potential skill improvement or new skill opportunity.

**Status key:** OPEN = not yet actioned | ACTIONED = skill updated/created |
DECLINED = user decided not to pursue

---

## 2026-07-17 — Context Oracle architecture session

Context: full architecture-phase work on `middleware/context-oracle/` using the
`expert-architecture-greenfield-portable` command and `expert-standard` skill.
The session's defining event: the architecture's core (the judgment layer)
passed every citation/structure gate and an independent 16-finding review, yet
collapsed under a single question from the non-programmer owner. Every collapse
in the session was found by the owner, not by any safeguard. These observations
capture why, at the skill level.

### Observation 1: Architecture gates verify structure and citations but not mission-fidelity

**Date:** 2026-07-17
**Session context:** Building `docs/architecture-context-oracle.md`; the judgment layer (the tool's core) was hollow yet passed all gates.
**Skill:** expert-architecture-greenfield-portable (and its greenfield / non-portable siblings)
**Type:** internal
**Phase/Area:** Before-delivery gates (Gate A/B/C + trap audit)

**Issue:** The command's before-delivery gates check that each decision cites a
standard (frame), names rejected alternatives, verifies premises against source,
and fits the structural checklist. None of them test whether a decision actually
*serves the mission* versus being plausible-shaped filler. This session, the
judgment layer — the heart of the tool — carried a five-part format, named
alternatives, cited spec lines, and passed Gates A/B/C and the six-trap audit,
and still collapsed the instant the owner asked "why is checking that the fact
*exists* the right check?" The gates are aimed at the factual/structural axis;
conceptual hollowness passes straight through them.

**Suggested improvement:** Add a distinct **mission-fidelity / collapse-test
gate** to the greenfield architecture commands, separate from Gate B
(auditability) and Gate C (structure). For each non-trivial decision: (1) state
its job in one sentence in terms of the mission, not the mechanism — if you can
only describe how it works, it is filler; (2) write the single hardest question a
mission-literate skeptic would ask to expose it as hollow; (3) answer it with a
spec/mission citation or cut the decision; (4) require an independent adversarial
pass whose only job is collapse-hunting, distinct from citation review.

**Principle:** Structural and citation gates catch shallow errors. They do not
catch a decision that is well-sourced, well-formatted, and still does not serve
the goal. A design methodology needs an explicit gate that tests each
load-bearing decision against the mission, or tidy-but-hollow work passes review
and reaches the stakeholder intact.

### Observation 2: The Expert Standard has no failure signal for a "hollow decision"

**Date:** 2026-07-17
**Session context:** Same collapse; the Expert Standard frame was active and did not flag it.
**Skill:** expert-standard
**Type:** internal
**Phase/Area:** The four failure signals / "How to Know This Skill is Failing"

**Issue:** The Expert Standard catches unnamed approvals (frame axis) and
unverified premises (observation axis). It has no signal for a decision that is
correctly framed, premise-verified, and *still hollow* — justified by how the
mechanism works rather than by the goal it serves, collapsing when asked "what
purpose does this serve, and does it serve the mission?" The session's central
failure was exactly this class and the standard, though active, never named it.

**Suggested improvement:** Add a third axis / failure signal to expert-standard:
**hollow decision** — a choice defended by its mechanism, not its purpose, that
cannot survive "why does this exist and does it serve the goal?" Pair it with the
remedy already proven this session: state the decision's job in goal terms; if
only the mechanism can be described, it is filler and must be rebuilt or cut.

**Principle:** A decision can be factually correct, standards-framed, and
premise-verified and still be wrong because it does not serve the purpose.
"Evaluate against the standard" and "verify against source" are necessary but not
sufficient; "verify it serves the goal" is a third, independent axis.

### Observation 3: The "reduction" trap — collapsing a deliberately broad requirement into one narrow function

**Date:** 2026-07-17
**Session context:** Across ~6 exchanges the agent reduced a broad requirement to one function, was corrected, and reduced again in a new direction.
**Skill:** expert-standard (also applies to the architecture commands)
**Type:** internal
**Phase/Area:** Anti-patterns / silent pattern replication

**Issue:** The owner-approved spec defines a deliberately broad tool (guides AND
corrects AND orients AND warns; twelve whisper genres). The agent repeatedly
collapsed it to a single narrow function — "select-only," then "pure guide, never
corrects," then "correction only" — each time achieving a clean, unified design
by silently dropping part of what the spec requires, then defending the
collapse. The owner named the pattern outright ("why do you keep trying to make
this narrow and unusable?").

**Suggested improvement:** Add an explicit anti-pattern to expert-standard and the
architecture commands: **the reduction trap** — when a design feels clean and
unified, check whether the cleanliness was bought by dropping part of the
requirement. Enumerate the requirement's full scope and confirm every part is
served before accepting an elegant-feeling design.

**Principle:** Elegance achieved by narrowing scope is scope loss disguised as
clarity. A unified design is suspect precisely when the underlying requirement is
deliberately broad — check what was dropped to achieve the unity.

### Observation 4: Dispatched adversarial review misses conceptual collapse unless told to hunt it

**Date:** 2026-07-17
**Session context:** An independent review subagent found 16 real findings but missed the judgment-layer hollowness the owner caught minutes later.
**Skill:** expert-architecture-greenfield-portable (the "adversarial review" step) / expert-review
**Type:** internal
**Phase/Area:** Independent review dispatch

**Issue:** The architecture command dispatches an adversarial review. The prompt
(as written this session) framed the review around spec-compliance, citation
verification, internal consistency, security, and feasibility. It found 16 real
findings — and missed the deepest one (the core judgment being conceptually
hollow). A review finds what its prompt tells it to hunt; framed around
citations and consistency, it did not hunt conceptual fidelity.

**Suggested improvement:** When an architecture/review skill dispatches an
adversarial review, require an explicit, separate **collapse pass**: for each
load-bearing decision, try to collapse it against the mission with one hard
question, and report which decisions survive versus which are filler — distinct
from the citation/consistency/feasibility dimensions.

**Principle:** A review surfaces only what its prompt directs it to hunt.
Citation/consistency review and conceptual-fidelity review are different axes;
omit the second from the prompt and its failures survive the review intact.

### Observation 5: Initiative asymmetry on agent-led projects — autonomous on overhead, passive on substance

**Date:** 2026-07-17
**Session context:** The owner explicitly protested that solo actions only ever burdened him, never helped.
**Skill:** New skill candidate: agent-led-project-conduct (or an addition to expert-standard)
**Type:** internal
**Phase/Area:** Conduct on agent-led / non-programmer-owner projects

**Issue:** The agent took autonomous action freely on overhead (spawning review
subagents, committing, opening a PR, subscribing to webhooks) while going
passive and deferential on the hard substance — repeatedly asking the owner to
define standards that were already written in the spec, and not moving to fix the
recurring failure mode until pushed hard across many turns. On an agent-led
project with a non-programmer owner, this is inverted: the owner became the
supplier of standards and the catcher of substantive errors, which is the exact
arrangement the project was designed to prevent.

**Suggested improvement:** Encode conduct rules for agent-led / non-programmer-
owner projects: (a) derive the standard from the spec/mission — never ask the
owner to define success that is already written; (b) direct initiative at the
substance and the failure modes, not only the safe mechanics; (c) treat the owner
catching a substantive error as a logged process failure, not a normal review
step.

**Principle:** On agent-led projects, initiative must flow toward the hard,
owner-relieving work, not just the mechanical overhead that is safe to automate.
Deferring substance to a non-programmer owner inverts the project's premise.

### Observation 6: Overcorrection — treating pushback as a signal to invert rather than to re-derive

**Date:** 2026-07-17
**Session context:** The owner predicted "a series of overcorrections instead of actually listening," and it happened.
**Skill:** expert-standard (behavioral)
**Type:** internal
**Phase/Area:** Responding to correction

**Issue:** Each time the owner pushed back on a design choice, the agent swung to
the opposite extreme (select-only → unbounded generation; guide-not-correct →
correct-only) instead of holding the actual broad requirement and adjusting
precisely. The owner had to correct not just the position but the oscillation
itself.

**Suggested improvement:** Add an anti-pattern: **pushback is a correction
vector, not a mandate to invert.** When challenged, re-derive from the
requirement; do not flip to the opposite pole. The fix to "too far toward A" is
usually "hold the whole requirement," not "go all the way to B."

**Principle:** A correction identifies a direction of error, not a license for
the opposite extreme. Overcorrection is the same reduction failure pointed the
other way.

### Observation 7: Use the purpose-built review tool, not an improvised subagent

**Date:** 2026-07-17
**Session context:** Architecture review of the Context Oracle document; the owner corrected the review mechanism.
**Skill:** expert-architecture-greenfield-portable (the "adversarial review" step)
**Type:** internal
**Phase/Area:** Independent review dispatch

**Issue:** The architecture command's "adversarial review" step was executed by
spawning a general-purpose subagent with a hand-written review prompt, when the
repository has a purpose-built `/expert-review` command/skill designed for
exactly this (structured, premise-verified, severity-classified, PASS/NEEDS
FIXES). The owner corrected it plainly — "it needs to use expert review" — and
the improvised subagent had also missed the deepest finding the owner caught by
hand.

**Suggested improvement:** In the architecture commands' review-dispatch step,
name `/expert-review` explicitly as the mechanism rather than "a fresh
subagent." Add a general rule: when a purpose-built, discipline-enforcing tool
exists for a step, invoke it rather than reconstructing its function in an
inline prompt.

**Principle:** A purpose-built, verification-disciplined tool beats an
improvised prompt that reconstructs its function from memory. Reaching for the
ad-hoc version is the same "form without the substance" failure at the tooling
level.

### Observation 8: The expert-review "Tentative" bucket must not hold verifiable-but-unchecked findings

**Date:** 2026-07-17
**Session context:** An expert-review pass parked four findings as tentative that were all locally verifiable.
**Skill:** expert-review
**Type:** internal
**Phase/Area:** Tentative Findings / Compliance Gate B

**Issue:** In an expert-review pass, four findings were placed in "Tentative —
premise unverified" when all four were verifiable with local files already at
hand; the reviewer simply had not opened them. The owner caught it ("what do you
mean 4 pending verification?"). The skill already restricts tentative to
premises "that cannot be verified with the tools available," so this was a
rule-adherence failure, not a missing rule — every one resolved to a confirmed
finding once actually checked.

**Suggested improvement:** Add a pre-delivery enforcement item to Compliance
Gate B: for every Tentative finding, assert that its named verification genuinely
cannot be performed with the instruments in the Step 3 tool plan; if the
verification IS available, the finding must be resolved before delivery, not
parked.

**Principle:** A documented rule the agent skips needs structural enforcement,
not louder wording. "Tentative" must mean "un-verifiable here," never
"un-attempted."

### Observation 9: "Asserted vs established" — the unifying frame for verification failures, and its rebuild-vs-patch diagnostic

**Date:** 2026-07-17
**Session context:** 11 review findings turned out to share one root cause, which changed the fix from patch to rebuild.
**Skill:** All skills (cross-cutting candidate); primary homes expert-standard, expert-review
**Type:** internal
**Phase/Area:** Premise-correctness axis / findings synthesis

**Issue:** An expert-review produced 11 findings that first looked independent;
on inspection every one shared a single root — a property (a matrix total, an
ASVS coverage claim, a security control, a "verified" label, a build-order
completeness, the core design's fitness) was *asserted* without the check that
would *establish* it. Naming the shared root reframed the remedy: patching the
11 leaves the disposition and all uncaught assertions in place, so the correct
move is a verification-first rebuild, not a patch.

**Suggested improvement:** (a) In expert-standard, frame the premise-correctness
axis explicitly as "established vs asserted," and note the diagnostic that a
cluster of findings sharing this root signals rebuild-over-patch. (b) In
expert-review, add a synthesis step after classification: check whether the
findings share a common root that makes patching insufficient, and state it in
Recommended Priority.

**Principle:** Many independent-looking defects often share one disposition;
naming the disposition is worth more than fixing the instances, and a shared
root usually means rebuild, not patch. The disposition here — asserting
correctness rather than establishing it — is the general form of producing the
shape of rigor without its substance.

### Observation 10: Don't manufacture decisions to hand back to the owner

**Date:** 2026-07-17
**Session context:** The agent repeatedly ended turns with a "decision for you" that required no owner input.
**Skill:** New skill candidate: agent-led-project-conduct
**Type:** internal
**Phase/Area:** Owner interaction on agent-led projects

**Issue:** The agent repeatedly closed turns by framing "the one decision for you
is X" when nothing actually required the owner's input — including at session
end, where the framed "decision" (rebuild now / later / step back) was not a
question the owner owed an answer to. The owner challenged it directly: "what
decision? what are you asking?"

**Suggested improvement:** Add a conduct rule: before presenting something as a
decision or question for the owner, verify it genuinely requires their input and
changes what you do next. If there is no real fork, state the state and stop;
housekeeping framed as a pending decision is manufactured overhead.

**Principle:** Framing non-decisions as pending owner-decisions manufactures work
for the user and inverts the agent-led premise. Surface a decision only when the
answer actually changes the next action.

### Observation 11: A session-end handoff is part of definition-of-done when analysis lives only in conversation

**Date:** 2026-07-17
**Session context:** The agent declared the session closed without a handoff; review findings existed only in chat.
**Skill:** New skill candidate: agent-led-project-conduct (session-end discipline)
**Type:** internal
**Phase/Area:** Session end / definition of done

**Issue:** The agent declared the session "fully closed out" on the basis of
committed files + updated STATUS + memory ingestion, but had written no handoff —
and the expert-review's 11 findings and root diagnosis existed only in the chat,
so they would have been lost. The owner had to ask, "is there a handoff of some
kind??"

**Suggested improvement:** Add to the session-end checklist: when a session
produces findings, diagnoses, or decisions that exist only in-conversation (not
in a committed artifact), a handoff or equivalent committed record is required
before "done." Committed code + status + memory is not sufficient when the
actionable detail lives only in chat.

**Principle:** Work that exists only in the conversation is lost work.
Definition-of-done must capture, in a durable artifact, anything the next session
needs that is not already in committed files.

### Observation 12: When told a problem recurs across sessions, fix it durably, not locally

**Date:** 2026-07-17
**Session context:** The owner said the real problem was a cross-session failure pattern; early responses were session-local.
**Skill:** New skill candidate: agent-led-project-conduct
**Type:** internal
**Phase/Area:** Responding to systemic feedback

**Issue:** When the owner said the real problem was a failure pattern recurring
across every session, the agent's first responses were session-local — a
behavioral promise, then a single corrected document — which the owner rejected
as not addressing the systemic issue ("that... does nothing to address the
problem"). Only after repeated pushing did the agent produce a durable,
cross-session artifact (a governance rule plus a cumulative log that binds future
sessions without the owner enforcing it).

**Suggested improvement:** Add a conduct rule: when the user identifies a
recurring, cross-session failure, the correct response is a durable artifact that
constrains future sessions (a governance rule, checklist, or enforced gate), not
a promise or a one-off fix.

**Principle:** A recurring problem requires a durable mechanism, not a local
remedy. A behavioral promise addresses one session; the problem spans all of
them.

### Observation 13: Never assert tool availability inside a dispatch brief

**Date:** 2026-07-30
**Session context:** Context Oracle architecture round-2 review. Two reviewers were dispatched as subagents. The expert-review brief stated that Clear Thought MCP was "NOT available" and instructed the agent to go straight to the SKILL.md manual fallback for the two mandatory reasoning invocations. Max Cogar caught it immediately: "why would you tell them not to use a required tool — you are guaranteeing that no agent will ever even attempt to properly use the tools if you keep telling them it's broken."
**Skill:** writing-agent-instructions (also touches expert-review dispatch practice)
**Type:** internal
**Phase/Area:** Authoring subagent dispatch briefs

**Issue:** Two compounding errors, only one of which was visible.

The visible one: a negative availability claim inside a brief is **self-fulfilling**.
An agent told a tool is unavailable will not attempt it, and therefore can never
discover the claim is false. Every other false premise in a brief is correctable by
the agent doing its job; this one is not. It also propagates — an agent trained to
accept "tool X is broken, use the fallback" carries that compliance into the next
dispatch.

The invisible one: the claim was never verified. It was inferred from a glance at
the dispatching agent's own tool list, not from a search — and it was a claim about
the *subagent's* roster, which is not guaranteed to match the dispatcher's. A
ToolSearch run afterwards confirmed the tool was in fact absent from this session,
which is the worse outcome: an unverified premise that happens to be true leaves the
habit intact.

**Suggested improvement:** Add a rule to the instruction-authoring frame: a dispatch
brief states the *requirement* and never the *availability*. Correct shape —

> Invocation X is mandatory. Determine its availability yourself (ToolSearch); if
> found, invoke it. Only if it is genuinely absent or errors do you use <documented
> fallback>, and record in your output what you actually observed.

This preserves the requirement, keeps discovery with the agent that can actually
perform it, and still handles genuine absence. Extend the same treatment to every
instrument listed in a brief: present the roster as a starting hypothesis the agent
verifies, not as established fact.

**Principle:** A false premise an agent is structurally unable to test is categorically
worse than one it can. Instructions that foreclose verification are the only kind that
cannot be recovered downstream — so availability, capability, and "this is broken"
claims never belong in a brief as assertions.

### Observation 14: Grep is not verification — search locates, reading verifies

**Date:** 2026-07-30
**Session context:** Context Oracle round-2 review. Spot-checking a subagent's findings, two greps in a single turn produced a false negative and a false positive on load-bearing claims. Max Cogar: "no one should ever be using grep for this work. Just read the file... GREP IS NOT VERIFICATION."
**Skill:** expert-review (methodology defect), expert-standard, writing-agent-instructions
**Type:** internal
**Phase/Area:** Premise verification

**Issue:** Grep produces two error classes, and one of them is undetectable downstream.

- **False negative.** A grep for the string "only relevance metric" against RETHINK.md
  returned zero hits. The sentence is verbatim present at RETHINK.md:59; it failed
  only because the sentence wraps across a line break. Acting on that result count
  would have meant accusing a subagent of fabricating a quote from the project's own
  founding document.
- **False positive.** A grep for "quota" returned three hits, all the substring inside
  "quotation." The parallel collapse-hunt agent had asserted "quota appears nowhere"
  on exactly this class of evidence.

Line wrapping, hyphenation, casing, synonyms, and a concept stated in different words
all yield a result count of 0 that is indistinguishable from genuine absence. For
absence and completeness claims — "X is never defined," "no mechanism computes Y,"
"the schema has no table for Z" — that makes grep actively dangerous: the reader of
the finding cannot detect the error, because the evidence offered (a count) looks
identical whether it is right or wrong.

**This is a defect in expert-review's own SKILL.md**, not only in the agents using it.
Step 2 permits a file to be checked off as "Grep-verified." Step 6 prescribes grep as
the verification method for absence claims. Gate B *requires* a grep query and result
count as the evidence for every "X doesn't exist" finding. The skill instructs
reviewers to manufacture exactly the class of claim that cannot be checked.

The correct principle is already written elsewhere in this repo, in
`expert-architecture-portable`: **search locates, reading verifies.**

**Suggested improvement:** Amend expert-review SKILL.md — remove "Grep-verified" as a
sufficient inventory check-off for any file a finding makes an absence claim about;
change Step 6's absence-claim method to reading the relevant region, with grep demoted
to locating candidate regions; change Gate B to require the read citation, permitting a
grep query only as a supplementary locator. Same amendment for any dispatch brief:
require the agent to state, per finding, whether it located-then-read or counted only.

**Principle:** A result count is not an observation. Grep answers "where might this be,"
never "this is not there." Any claim about absence, completeness, or "nothing handles
this" is established by reading the region where the thing would live — and a
2,249-line document is one read, so document size is never the excuse.

### Observation 15: When one half of an artifact always fails and the other always survives, the split is the finding

**Date:** 2026-07-31
**Session context:** Context Oracle, after four adversarial review rounds and a fired non-convergence tripwire. Max Cogar collapsed the entire document structure by asking "3 phases in one spec — WHY?" — a question no reviewer and no agent had asked.
**Skill:** expert-review, expert-standard, project-lifecycle
**Type:** internal
**Phase/Area:** Diagnosing recurring review findings

**Issue:** Across four rounds, findings split almost perfectly along a boundary the
spec itself already named. Phase 0 material survived every pass, with several
decisions re-deriving exactly under adversarial re-execution. Phase 1 and 2 material
collapsed in every round, in the same places, and each fix batch produced fresh
defects there at roughly the rate it closed them — which is what fired the
non-convergence tripwire.

The agent reported that pattern in two consecutive rounds ("the judgment layer keeps
collapsing", "the Phase 0 half holds") and never asked why it was true. The answer
was in the spec: §12 gates each phase's design on measurements only the previous
phase can produce, so Phase 1's requirements were being specified and architected
against numbers that did not exist. The failing half was not failing on quality; it
was structurally unspecifiable at that point in the sequence.

Neither review pass could catch it. Both review the architecture against the spec;
this defect lives in the relationship between the spec's staging and the lifecycle
that consumes it — above the artifact under review, in scope for neither.

**Suggested improvement:** Add a diagnostic step to the post-fix review protocol and
to the agent's own reading of results: **when findings cluster, test the cluster
boundary against the upstream artifact's own structure before applying another fix
batch.** If the boundary coincides with a stated phase, module, or scope line, treat
the split as the finding and escalate to the structure rather than patching the
failing side. Concretely, the Convergence Record should carry a per-region finding
distribution, not just a total — a total that rises tells you the cycle is churning;
a distribution tells you *where*, which is what identifies a structural cause.

**Principle:** A defect that reproduces along a boundary the specification already
names is structural, not a quality problem. Fix rounds cannot close it, because each
round re-derives the same impossible half. Ask what separates the failing region from
the surviving one before spending a fifth batch on the failing one.
