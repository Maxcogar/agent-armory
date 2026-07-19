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
