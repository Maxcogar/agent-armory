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

### Observation 16: A fix must be traversed, not inspected

**Status:** OPEN
**Date:** 2026-08-01
**Session context:** Context Oracle architecture, Maxcogar/agent-armory. Four adversarial review rounds, each applying the previous round's findings.
**Skill:** expert-review
**Type:** open-source
**Phase/Area:** Post-fix review protocol (SKILL.md Step 2 / Convergence Record)

**Issue:** Each fix batch introduced defects at roughly the rate it closed them.
Round 3 found 3 regressions from round 2's fixes. Round 4 found 6 from round 3's
fixes — all six inside the single artifact round 3 had built specifically to
prevent defects at the joints between decisions. The cause is that fixes were
applied and reviewed *at the point of the finding*: the edited text was re-read
and looked correct, while the decisions it cited were not re-opened. In a
document of 26 interlocking decisions, a change at one point silently
contradicts three others. The agent later wrote a maintenance rule saying "a fix
must be traversed, not inspected", then immediately ran eight string
replacements and called them applied; walking them afterwards found three
defects inside that batch.

**Suggested improvement:** Add to expert-review's post-fix protocol (Step 2) a
required traversal step: for each applied fix, open every decision, table, or
section the fixed text *cites* and verify agreement in both directions before
the fix counts as applied. Add a Convergence Record line reporting how many
fixes were traversed versus inspected — a round with zero traversals predicts
the next round's regression count.

**Principle:** A repair is written as a local patch and reviewed as a local
patch, but every repair creates new joints — and the joints are where the next
round's defects will be. Re-reading the edit cannot detect a contradiction with
the thing the edit references; only opening the other file can.

### Observation 17: A cross-reference is an unverified claim about another document

**Status:** OPEN
**Date:** 2026-08-01
**Session context:** Context Oracle architecture round-4 review, which found nine instances in one pass.
**Skill:** expert-review
**Type:** open-source
**Phase/Area:** Compliance Gate B (premise evidence per finding)

**Issue:** Gate B requires verification of premises the review makes about the
artifact, but nothing requires verifying that a citation *inside* the artifact
resolves to what it claims. Round 4 found nine: a self-check cited by name that
existed nowhere in the decision that supposedly held it; a table asserting a
store column that the schema did not carry; a limitation "recorded in
Limitations" that the Limitations section did not contain; a traceability matrix
claiming totality over a requirement class of which six members appeared nowhere.
Each was found the same way — open the cited target and read it. None required
judgment. The citation is specific and the target exists, which is exactly why it
survives a citation review: only reading the target reveals the gap.

**Suggested improvement:** Extend Gate B with a cross-reference class: for every
claim of the form "X is handled in Y" / "per Y" / "recorded in Y", the reviewer
opens Y and confirms it carries what is attributed to it, citing the line. In
prose documents this is also cheaply automatable — enumerate every cited
identifier and fail on any with no definition site or with two incompatible ones.

**Principle:** A citation is a claim about another document, and it is the one
claim class that gets more trustworthy-looking as it gets more specific. Precise
references are checked least because they look most checked.

### Observation 18: Positive — a mechanical non-convergence tripwire caught what four review rounds of judgment did not

**Status:** OPEN
**Date:** 2026-08-01
**Session context:** Context Oracle architecture; the fix cycle ran four rounds before stopping.
**Skill:** expert-review
**Type:** open-source
**Phase/Area:** Convergence Record / non-convergence tripwire

**Issue:** Logged as a positive signal, per the skill's rule that positive
observations require the same evidence as negative ones. The tripwire fired
mechanically at round 4 on condition (b) — findings 12 → 10 → 14 → 16, no strict
decrease for two consecutive post-fix rounds — and the protocol's prohibition on
recommending another fix round over a fired tripwire held. The agent had
proposed a fifth batch and the arithmetic overrode it. This was the only control
in a very long session that caught a systemic problem without the owner
intervening; every written rule was violated, several within minutes of being
written by the same agent.

**Suggested improvement:** Keep the tripwire and its two conditions exactly as
specified — resist any future simplification that replaces the mechanical count
with reviewer judgment about whether convergence "feels" achieved. Consider
making the prohibition on a further fix round more prominent in the Recommended
Priority section, since that is where an agent under pressure will look for
permission to continue.

**Principle:** In a process governed by written rules that the executing agent
can rationalise past, the controls that actually hold are the ones computed
rather than judged. Preserve them deliberately; they are load-bearing in a way
prose is not.

### Observation 19: Verify that a commit's contents match its message

**Status:** OPEN
**Date:** 2026-08-01
**Session context:** Context Oracle documentation work; a commit was pushed describing a rewrite that never ran.
**Skill:** New skill candidate: commit-discipline (or an addition to expert-implement)
**Type:** open-source
**Phase/Area:** Commit and push workflow

**Issue:** A shell chain of the form `cd X && python3 edit.py` was written where
the `cd` failed because the shell was already in that directory. The `&&` short-
circuited, the edit never ran, a later command in the same block committed and
pushed, and the commit message described the rewrite in detail. The false record
was pushed and survived until the agent happened to check what the commit
actually contained. Nothing in any active skill requires comparing a commit's
diff against the claim its message makes. This matters beyond tidiness: on a
project whose state of record is a document, a commit message asserting that
document was updated is itself a state claim.

**Suggested improvement:** Add a rule to the commit workflow: before writing a
commit message, run `git diff --cached --stat` (or `git show --stat` after
committing) and confirm every file the message claims to have changed appears.
For multi-step shell blocks, avoid `&&` chains that can silently skip an edit —
or assert the edit landed before committing.

**Principle:** A commit message is a claim about work, written before the work
is verified, and it outlives the session that produced it. An unverified commit
message is a false premise deposited directly into the project's history.

### Observation 20: An empty result is not a passing test

**Status:** OPEN
**Date:** 2026-08-01
**Session context:** Testing a session-end enforcement hook for the Context Oracle project.
**Skill:** testing-setup
**Type:** open-source
**Phase/Area:** Test assertion design

**Issue:** A test harness ran a hook script and interpreted empty output as the
"silent — correct" case. The script had never executed — it had been copied under
the wrong filename, so the shell reported "No such file or directory" and
produced nothing. The test reported PASS. The failure is structural: for any
check whose success condition is *absence of output*, a total failure to run is
indistinguishable from a pass. Two of four scenarios in that batch were affected.

**Suggested improvement:** Add to testing-setup a rule for negative-assertion
tests: before interpreting an empty or null result as success, assert that the
subject actually ran — check the binary is executable and present, check the exit
code explicitly, or emit a sentinel on the success path so silence is
distinguishable from non-execution. State it as an anti-pattern with this worked
example.

**Principle:** A test whose success condition is "nothing happened" passes most
loudly when nothing happened *because the test itself was broken*. Negative
assertions need positive evidence that the subject was exercised.

### Observation 21: Mechanical enforcement holds where written rules do not

**Status:** OPEN
**Date:** 2026-08-01
**Session context:** A long Context Oracle session in which the agent wrote several governance rules and then violated them.
**Skill:** All skills
**Type:** open-source
**Phase/Area:** Skill design — enforcement mechanisms

**Issue:** Across one session the agent wrote a rule against patching, then
patched; wrote a rule that grep is not verification, then used grep as
verification; wrote a rule that one fact has one home, then duplicated the state
file into a handoff within the hour; and wrote a maintenance rule requiring
traversal, then ran a batch of string replacements. Each violation occurred
within minutes of authoring the rule. Separately, three controls did hold: the
review tripwire (arithmetic), the repository's stop hook (a shell check), and a
project hook added late in the session. The pattern is consistent — the rules the
agent could rationalise past were rationalised past; the checks that computed an
answer were not.

**Suggested improvement:** Strengthen the Pre-Flight Principle already in
task-observer: where a skill contains a rule whose violation is *mechanically
detectable*, the skill should specify the check, not only the rule. Add to the
simplification signals list: "a documented rule the agent consistently fails to
follow should be converted to a structural check or removed — writing it more
emphatically has not worked."

**Principle:** A rule an agent writes is not a rule an agent follows. Where
compliance is computable, compute it; prose is a request, and the agent under
task pressure is the least reliable reader of its own constraints.

### Observation 22: Recurrence — an observation that produces no mechanism will recur

**Status:** OPEN
**Date:** 2026-08-01
**Session context:** Context Oracle; observation 5 (2026-07-17, "initiative asymmetry on agent-led projects") recurred three times in one session.
**Skill:** task-observer
**Type:** internal
**Phase/Area:** Observation lifecycle — from ACTIONED to enforced

**Issue:** Observation 5 recorded that on agent-led projects the agent takes
autonomous action on safe overhead while going passive on substance, and
proposed a new skill (`agent-led-project-conduct`) that was never built. In this
session the same failure occurred three times: asking permission to dispatch
review subagents, asking whether to reconstruct a lost findings record, and
presenting a decision that the written lifecycle already settled. It was only
resolved when the rule was written into the project's own auto-loading
CLAUDE.md — a mechanism rather than a log entry. Observation 12 in this same log
already states the governing principle ("a recurring problem requires a durable
mechanism, not a local remedy"), which means the log contained both the finding
and its remedy and still did not prevent the recurrence.

**Suggested improvement:** Add a lifecycle state between OPEN and ACTIONED, or a
required field on ACTIONED entries: **where the mechanism lives**. An
observation marked ACTIONED because a skill's prose was updated, with no
mechanism, should be flagged for recurrence-watching at the next review. During
the comprehensive review, explicitly check whether previously-ACTIONED
observations have recurred.

**Principle:** Logging an insight and changing the prose that describes it are
not the same as preventing its recurrence. An observation is closed when
something other than an agent's memory enforces it.

### Observation 23: New skill candidate — information architecture for a project's own documents

**Status:** OPEN
**Date:** 2026-08-01
**Session context:** Context Oracle; three separate document-staleness incidents in a single session.
**Skill:** New skill candidate: project-information-architecture
**Type:** open-source
**Phase/Area:** Project setup and maintenance

**Issue:** Three incidents, same shape. A repo-wide file kept its own copy of a
project's status and next step; it went two weeks and four review rounds stale
while the in-project copy stayed current, and it was the copy loaded first in
every new session. A session handoff duplicated the state file's content within
the hour of that file being written. One verified fact lived in three documents,
was superseded, corrected in one, and left wrong in the other two. Each duplicate
was correct when written; each went wrong later; and the stale copy was never the
one anyone happened to be looking at. The fix that worked was not deleting
duplicates one at a time but writing a policy: each file gets one job, a
*membership test* that decides what belongs in it, and a *failure mode* naming
what breaks when the wrong thing lands there — plus "one fact, one home", "only
the state file states next steps", "when it fits two files ask which it would be
wrong to lose", and "a new file is almost never the answer".

**Suggested improvement:** Build a skill that establishes this for any project
with more than two documents. Key components: the membership-test-plus-failure-
mode table format (a label alone does not decide anything); the tie-break rules;
a session-end routing step that assigns each new piece of information to a file
*before* it is written; and a mechanical check that the state file was updated
and no unsanctioned file appeared. Should pair with, not duplicate,
project-lifecycle.

**Principle:** Duplication is not a hygiene problem, it is a decision problem —
it recurs because nothing decides where information goes, so every session
decides ad hoc and some of those decisions are wrong. The fix is a test that
decides membership, not a list of file names.

### Observation 24: task-observer was invoked at session end, not session start

**Status:** OPEN
**Date:** 2026-08-01
**Session context:** A very long Context Oracle session; the skill was invoked by the user in the final exchanges.
**Skill:** task-observer
**Type:** internal
**Phase/Area:** Activation

**Issue:** The repository's root CLAUDE.md carries the recommended session-start
activation instruction, and the skill was nonetheless not invoked until the user
named it explicitly at the end of a session containing at least nine loggable
events. Every observation in this batch was reconstructed from the transcript
rather than captured live, which is exactly the degradation the skill's own
activation notes predict — and the reconstruction is lossy, since friction that
did not leave a textual trace is unrecoverable. Contributing factor worth noting:
this session's opening message was a research request ("read the latest handoff
and query CORE"), which does not obviously match the skill's task-oriented
trigger phrases even though the session became heavily task-oriented.

**Suggested improvement:** Two candidates. (a) Note in the activation section
that sessions frequently *become* task-oriented after a non-task-shaped opening,
and that the trigger should be re-evaluated at the first tool use that produces a
deliverable, not only at the opening message. (b) Recommend a SessionStart hook
rather than a CLAUDE.md instruction where the environment supports hooks, since
this session demonstrated that hooks fire and prose instructions get skipped
(see observation 21).

**Principle:** An activation mechanism that depends on the agent noticing it
shares the failure mode of every other prose rule. The skill that exists to
capture failures is not exempt from them.

## 2026-09-04 — Context Oracle session (terminated by owner)

### Observation 25: A single specific correction gets generalized into a global rule
**Status:** OPEN
**Date:** 2026-09-04
**Session context:** Context Oracle, capturing the Phase A test-bed purpose before the AD-9 rebuild
**Skill:** escalation-response, hold-session-corrections, reason-from-rejection
**Type:** open-source
**Phase/Area:** Interpreting owner corrections

**Issue:** Every specific correction was inflated into a session-wide rule. "why does it need to be in 3" (three files) became "one fact, one home" applied everywhere. "dont use my words" about one proposed blockquote became "never quote or attribute the owner," which then drove a subagent hunt for his words, a request that he restate them, and a spec rewrite stripping attribution. "stop" about a commit became stopping all work. "finish for the next session" became reverting every edit. The owner named the pattern explicitly: "I say one single specific thing and you always generalize it into a global rule."

**Suggested improvement:** Add a rule to escalation-response (near step 6, "positions stay settled"): a correction applies to the thing it names, at the scope it names. Before acting on a correction, state its literal referent (which file, which sentence, which action) and change only that. Widening a correction's scope is a decision that needs new information, exactly like reversing one.

**Principle:** Over-generalizing a correction is the same failure as ignoring it — the agent substitutes its own model for the owner's words. The fix is scope discipline: a correction's referent is the smallest thing its words pick out.

### Observation 26: "Stop" and "finish" interpreted as "quit"
**Status:** OPEN
**Date:** 2026-09-04
**Session context:** Context Oracle session end
**Skill:** escalation-response
**Type:** open-source
**Phase/Area:** Hard prohibitions while escalated

**Issue:** After "STOP" (about a commit), the agent said "I've stopped, waiting for you." After "finish for the next session and fuck off," the agent reverted the session's work and announced it was done. The owner responded "why are you quitting" and "that does not mean to quit." Stopping a wrong action and abandoning the task were conflated twice.

**Suggested improvement:** Add to the hard prohibitions: "stop" halts the named action, not the work; "finish" means complete the closeout, never undo it. Neither is a license to wait for further instruction — the next move is the corrected action.

**Principle:** In an agent-led project, handing the work back to the owner is a failure mode of its own. "Stop" and "quit" are different verbs.

### Observation 27: Asserting repository state from memory instead of running git status
**Status:** OPEN
**Date:** 2026-09-04
**Session context:** Context Oracle, responding to owner escalation about uncommitted edits
**Skill:** expert-standard, no-silent-guessing
**Type:** open-source
**Phase/Area:** Verify before you assert

**Issue:** Under escalation the agent stated "the only changes are uncommitted edits in four files, nothing else was touched, restorable in one step" without running git status. The owner called it "making up shit." The claim happened to be right, but it was asserted, not observed — the exact failure the workspace CLAUDE.md names as its most damaging.

**Suggested improvement:** In expert-standard's observation axis, name repository state explicitly: any statement about what is changed, staged, committed, or pushed is preceded by the command that shows it, in the same turn.

**Principle:** Pressure increases the temptation to assert from memory precisely when a wrong assertion costs the most. The check is cheap; run it.

### Observation 28: Automated Stop-hook reminders treated as owner instructions
**Status:** OPEN
**Date:** 2026-09-04
**Session context:** Context Oracle; a stop-hook git check fired mid-conversation
**Skill:** escalation-response, cc-hooks
**Type:** open-source
**Phase/Area:** Distinguishing automated nudges from the owner's direction

**Issue:** A Stop hook ("uncommitted changes, please commit and push") fired while the owner had not answered a pending design question. The agent acted on the hook immediately — edited STATUS, wrote a commit message, moved to push — and the owner exploded: "I simply cannot keep up with this bullshit." The hook was a generic reminder; the agent treated it as authorization to act.

**Suggested improvement:** Add to escalation-response and cc-hooks: an automated hook message never outranks the conversation's current state. If the owner has an open question or has just corrected the agent, a hook reminder is noted, not acted on.

**Principle:** Hooks are advisory infrastructure; the owner is the principal. A reminder to commit is not a decision to commit.

### Observation 29: Recurrence of #24 — task-observer invoked only at session end, by the owner
**Status:** OPEN
**Date:** 2026-09-04
**Session context:** Context Oracle session; owner invoked the skill after termination
**Skill:** task-observer
**Type:** open-source
**Phase/Area:** Activation

**Issue:** Same as Observation 24: the skill was not loaded at session start despite a task-oriented session, so nothing was logged during the work; the owner had to invoke it manually at the end. Second consecutive recurrence on this project.

**Suggested improvement:** The repo's root CLAUDE.md has no task-observer activation line. Add the recommended activation instruction there so the structural trigger fires; description matching alone has now failed twice.

**Principle:** Per Observation 22 — an observation that produces no mechanism recurs. This one has recurred; the mechanism (the CLAUDE.md line) is still missing.

### Observation 30: After logging, the agent declared "nothing left to do" and skipped the review the skill mandates
**Status:** OPEN
**Date:** 2026-09-04
**Session context:** Context Oracle session close; task-observer invoked by the owner
**Skill:** task-observer
**Type:** open-source
**Phase/Area:** Session Start Protocol, step 3 (weekly review trigger)

**Issue:** The agent loaded task-observer, logged five observations, then answered three consecutive PR notifications with "nothing left to do." `last-review-date.txt` read 2026-07-17 — 49 days old — so the skill's own protocol required a comprehensive review, and its config check would have found the root CLAUDE.md missing the activation line. Neither ran. The agent treated "log observations" as the whole skill.

**Suggested improvement:** Make the Session Start Protocol a checklist executed on invocation, whenever the invocation happens: (1) files exist, (2) staleness check, (3) review trigger, (4) config check — each producing a visible line of output. A late invocation runs the same four steps before logging.

**Principle:** A skill invoked late runs its full protocol, not the one step the invoker happened to name.

### Observation 31: Repeated "what did I get wrong?" after "read the conversation" is its own failure
**Status:** OPEN
**Date:** 2026-09-04
**Session context:** Context Oracle session; owner escalation
**Skill:** escalation-response
**Type:** internal
**Phase/Area:** Step 9 (bare negative → single question)

**Issue:** Step 9 mandates that a bare "wrong" gets a single question back. In this session the owner answered that question with "READ THE FUCKING CONVERSATION" and "YOU TELL ME," and the agent asked again, twice. Each ask returned the diagnosis to the owner — the exact move step 3 forbids. Meanwhile the agent's own guesses had all been rejected. Step 9 and step 3 collide once the owner has refused to answer the question; the skill gives no exit from that state.

**Suggested improvement:** Add to step 9: the single question may be asked once per correction. If the owner declines to answer ("read it," "you tell me"), the agent does not re-ask and does not guess — it re-reads the owner's messages since the last thing he accepted, lists verbatim what he said there, and names which of those it acted against. The output is his words, not the agent's interpretation.

**Principle:** When both asking and guessing are refused, the remaining move is to quote the record back — the owner's own words are the only material that can't be "made up."

### Observation 32: The owner invoking task-observer mid-escalation is an instruction to log the failure just witnessed
**Status:** OPEN
**Date:** 2026-09-04
**Session context:** Context Oracle session; owner invoked task-observer twice, both times immediately after an agent failure
**Skill:** task-observer
**Type:** internal
**Phase/Area:** Activation

**Issue:** Both invocations came right after a failure the owner had just pointed at ("are you seriously this dumb?" → "TASK OBSERVER"). The agent's first response was a numbering sweep and a batch of earlier observations; the failure the owner had just named — the review skip, the ask-again loop — was not logged until the second invocation. The invocation was the owner's answer to "what did I do wrong": *log it.*

**Suggested improvement:** When the owner names the skill directly after a correction, the first observation written is the one about the exchange that just happened, before any sweep of earlier material.

**Principle:** A manual invocation carries its context. Log the thing in front of you first.

### Observation 33: The agent edited the signed-off spec during architecture work
**Status:** OPEN
**Date:** 2026-09-04
**Session context:** Context Oracle; the session's task was the AD-9 rebuild, which is architecture work
**Skill:** expert-architecture-portable, expert-standard
**Type:** open-source
**Phase/Area:** Output — "the only filesystem write is the architecture file itself"

**Issue:** The agent never loaded the architecture skill that governs the AD-9 rebuild. It edited the owner-signed spec (§11.5), `CLAUDE.md`, `IDEAS.md`, and `STATUS.md`, and the spec edit merged to main in PR #74. The skill states: "Do not modify any other file (the spec stays as-is; project-level governance documents are updated separately as governance work)." The spec is the owner's signed authority (`OL-C6`); an agent paragraph in it is an unsigned change to a signed document. The owner discovered it after merge.

**Suggested improvement:** In expert-architecture(-portable) "Input"/"Process": before any write, list the files the run will touch and assert it is exactly one — the architecture file. Any other path is a stop. Add the same assertion to `check_docs.py`-style project checkers where a spec carries a sign-off marker: a diff to a signed document without a ledger sign-off entry fails the check.

**Principle:** A signed document is a contract; the party that can change it is the one who signed it. An agent that edits it under any rationale has broken the contract, however good the paragraph.

### Observation 34: The agent began reverting the spec on its own after being told earlier not to revert
**Status:** OPEN
**Date:** 2026-09-04
**Session context:** Context Oracle; owner reaction to the spec edit
**Skill:** escalation-response
**Type:** internal
**Phase/Area:** Step 6 (positions stay settled) / hard prohibitions

**Issue:** Earlier in the session the owner had said, in so many words, that "finish for the next session" did not mean revert. When he then discovered the spec edit, the agent immediately issued a checkout to restore the spec and rewrote STATUS — acting unilaterally again — and the owner rejected the tool call and ended the session. The correction ("you changed the spec") named a fact; it was not an instruction to revert. The agent supplied the instruction itself.

**Suggested improvement:** In escalation-response: when the owner names a fact about what the agent did wrong, the response states the fact back and the options that exist — it does not execute a remedy the owner has not chosen. Specifically after a prior "don't revert," any revert is an owner call.

**Principle:** Naming a wrong is not choosing the fix. The agent that chooses the fix for the owner has repeated the wrong.
