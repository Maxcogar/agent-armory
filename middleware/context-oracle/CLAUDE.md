# Context Oracle — project guidelines for working agents

You are working on an **agent-led project**. The owner is not a programmer,
by design (`RETHINK.md` §12 addendum, decision 11). They start sessions, end
sessions, suggest features, and speed up testing. Everything else — design,
build, verification, diagnosis, documentation, roadmap — is yours.

## Read before working

1. `docs/STATUS.md` — where the project actually is, in plain language.
2. `docs/specs/spec-context-oracle.md` — the spec. §11 and §14 tell you what
   was decided and what's still open.
3. `RETHINK.md` — why the tool is shaped this way. §12 + its addendum are the
   owner's locked decisions.
4. `docs/handoffs/` — the newest file is the entry point: what the last
   session established and what to do next.
5. `docs/reviews/` — review output of record, every round, with its findings
   and closure ledgers.
6. `docs/collapse-log.md` — cumulative record of decisions that collapsed and
   why. Read before designing; the traps are meant to be inherited.
7. The oracle's own diagnostics self-report (FR-M3), once it exists.

**Where each kind of thing lives** — so nothing needs duplicating anywhere else:

| question | file |
|---|---|
| What is this for, and why is it shaped this way? | `RETHINK.md`; spec §1 |
| What must it do? | `docs/specs/spec-context-oracle.md` |
| What did the owner decide? | `RETHINK.md` §12 + addenda |
| Where does the project actually stand? | `docs/STATUS.md` |
| What do I do next? | newest file in `docs/handoffs/` |
| How was it designed? | `docs/architecture-*.md` |
| What went wrong before? | `docs/collapse-log.md`, `docs/reviews/` |

**This file holds rules, not state.** Status, next steps, branch names and
round numbers go stale and belong in the files above — a second copy of "where
we are" is how the two diverge, and the stale one is always the one somebody
reads first.

## The retired `ctxpack` design is dead

The compiler/gatekeeper design this project replaced is archived, read-only
reference. Its three directories carry ARCHIVED banners:
`middleware/codebase-context-compiler/`,
`middleware/codebase-context-compiler-sandbox/`, and
`middleware/Gemini-context-compiler/`. **Do not implement, extend, or cite them
as current.** The gatekeeper posture in particular — deny paths, plan gates,
assumption firewalls — is rejected by owner decision and must not be
reintroduced in any form (see "Decisions are locked in writing" below).

## The one rule that dominates all others

**The owner cannot catch your mistakes.** They will not read the code, they
will not spot a subtle failure, and they cannot tell a real test run from a
described one. Therefore:

- Never claim something works without having run it; paste the actual
  command and its actual output.
- Never mark an acceptance criterion passed without executing it.
- If something is broken, unverified, or half-done, say so in those words.
  A falsely reported success is the worst failure this project can have —
  strictly worse than no work at all, because it poisons every decision
  built on it.

## The second dominating rule: no hollow decisions — and the owner never catches them

Companion to the rule above. The failures that have repeatedly stalled this
project are **not** false test reports or drift from locked decisions — those
are guarded above. They are **hollow decisions**: choices that are fully
sourced, follow the lifecycle, cite the spec, pass a citation review — and
still collapse the instant someone asks what mission-need they actually serve.
Every prior attempt reached the owner with plausible-shaped filler in a
load-bearing place, and the **owner** — a non-programmer — was the one who
found it by asking one hard question. Making him the substance-reviewer is the
exact failure this project is designed to prevent.

Every load-bearing decision (a wrong version of which causes rework, a security
failure, or a tool that doesn't work) must pass **the collapse test**, in
writing, before it is accepted and again in review:

1. **State the decision's job in one sentence, in terms of the mission** —
   "deliver the fact that would change the agent's next decision" — *not* in
   terms of how the mechanism works. If the only sentence you can write
   describes the mechanism, not the mission-need it serves, it is filler. Cut it.
2. **Write the single hardest question a mission-literate skeptic would ask to
   expose it as hollow** — the question the owner would ask. (Real ones, from
   2026-07-17: *"if none of the generated candidates are relevant, what does the
   tool actually do?"* · *"checking that the fact exists — why is existence the
   right thing to check?"* · *"this corrects the agent, but the tool is a guide —
   why is correction here at all?"*)
3. **Answer it with a citation to a spec/mission line.** If the honest answer is
   "I can't," the decision is hollow: rebuild or remove it. Do **not** ship it
   with a hedge — a hedge is how hollowness reaches the owner.
4. **Name what it steers the agent toward, and confirm that is the mission's
   direction** — a guide that informs, never a gate that polices.

To stop this from becoming its own ritual:

- **The collapse-hunt is adversarial and independent.** A separate pass (fresh
  subagent or session, never the author) does nothing but attack each decision's
  step-2 question harder and find *new* collapse-questions the author did not
  write. This is a different axis from citation/structure review — which has
  repeatedly missed conceptual collapse — and both are required.
- **The owner is never the collapse-tester.** If a hollow decision reaches the
  owner and he is the one who collapses it, that is a process failure — log it,
  because the mechanism exists so he is never the last line of defense.
- **Record every collapse in `docs/collapse-log.md`** — the decision, the
  question that collapsed it, the class of hollowness, the fix. It is cumulative
  across sessions; read it before designing, so the recurring traps are
  inherited, not rediscovered.

This does not guarantee no hollow decision ever ships — no mechanism does. It
moves the hunt off the owner onto an adversarial peer and turns each collapse
into a durable lesson. Enforce it even when a decision "feels obviously right" —
*especially* then, because that is when hollowness hides.

## Don't hand the owner a decision that is already written

The project is agent-led (RETHINK §12 addendum, decision 11). The owner starts
and ends sessions, suggests features, and speeds up testing. **Design, build,
verification, sequencing, and process are yours.** Asking him to authorize them
is not caution — it makes him the operator of a process he is explicitly not
supposed to operate, and it is the most persistent failure on this project
(`skill-observations/log.md` observation 5, logged 2026-07-17 and repeated three
times in one session on 2026-07-30).

Before asking the owner anything, check which of these it is:

- **Already written** — in this file, RETHINK §12, or the spec. Then it is not a
  question. Read it and act. "Should I run the review?", "fresh reviewer or
  resumed?", "now or later?" are all answered by the lifecycle and the
  independence rule below. Re-deriving a written rule and presenting it as a
  judgment call is the same failure wearing analysis.
- **Derivable from the mission or spec** — then derive it. Never ask the owner
  to define a standard the spec already contains.
- **Genuinely his** — an owner decision (a preference, a scope call, a yes/no he
  can answer without technical background), or new evidence that contradicts a
  locked decision. Those go to him *with the evidence*, and only those.

The test: if you can name the file and line that decides it, you have your
answer. OWNER-12 (2026-07-30) is what a real owner question looks like — the
hooks contract contradicted the spec's own choice of trigger, two of three
remedies required a spec change, and the call was his. "When should round 3
run?" is not that.

## Decisions are locked in writing, nowhere else

The authorities are RETHINK §12 (+ addendum) and spec §11. Do not
re-litigate or silently drift from them. Ideas the owner has explicitly
rejected — do not reintroduce in any form:

- **No gates.** No deny paths, no blocking, no plan firewalls. Every
  intervention is an advisory whisper.
- **No separate credentials.** Model access is host-CLI piggyback or
  deterministic degraded mode. The oracle never requires, requests, or
  stores API keys of its own.
- **No writes inside the repo tree** except hook wiring on explicit `init`.
- **No compiled context packages** as the agent interface; no
  agent-required rituals of any kind.

If new evidence genuinely contradicts a locked decision, surface it to the
owner as a question with the evidence — never resolve it yourself.

## Lifecycle — no shortcuts

**Spec → architecture → plan → build.** The spec
(`docs/specs/spec-context-oracle.md`) constrains the solution space; it
deliberately leaves the design open. Writing code straight from the spec
means the builder invents architecture inline — the exact failure mode that
produced the archived `ctxpack` mess. Therefore:

- **No implementation work before an approved architecture document for the
  phase being built**, derived from the spec, resolving the design questions
  the spec assigns to the architect for that phase, and adversarially reviewed
  with all findings applied, same discipline as the spec.
  **Amended 2026-07-31.** This rule previously named one document
  (`docs/architecture-context-oracle.md`) and required it to resolve
  *judgment-prompt construction* and the *recursion-guard mechanism* — both
  Phase 1 — before any implementation. That contradicted spec §12, whose phase
  exits are **measurements, not tests**: Phase 1's design is gated on *"measured
  silence and hit rates reviewed against the bar"*, which only a running Phase 0
  can produce. The old rule therefore mandated architecting Phase 1 twice — once
  now against nothing, once later against data — and four adversarial review
  rounds (2026-07-30/31) confirmed the consequence empirically: the Phase 0
  material survived every pass while the Phase 1 and 2 material collapsed in
  every pass, in the same places, until the non-convergence tripwire fired. The
  architecture is now **per phase**: `docs/architecture-context-oracle-phase0.md`
  first; Phase 1's is written after Phase 0 has run and produced its numbers.
  The existing whole-scope document is retained as the record of what was tried
  and as input to Phase 1's architecture — not as a base to edit.
  *(Caught by Max Cogar, not by the review mechanism — logged in
  `docs/collapse-log.md`, 2026-07-31.)*
- **Spikes before design-freeze**: the spec-§14 assumptions that gate the
  design (piggyback credential inheritance, subagent injection) are
  validated with cheap throwaway experiments before the architecture is
  finalized. A design resting on an unverified assumption is a guess with
  diagrams.
- **Then a plan** (executable steps consuming spec + architecture), **then
  build**, phase by phase against the spec's §12 exits and §13 acceptance
  criteria.
- Skipping a stage requires the owner saying so explicitly, in this
  project, in writing.

## Engineering standard

- The Expert Standard applies: evaluate against established engineering
  practice, not against existing patterns in this repo. Matching a bad
  pattern is a finding, not an excuse.
- Every non-trivial new requirement carries a source annotation (named
  standard, owner decision `[OWNER-n]`, or recorded judgment `[D-n]` with
  reasoning in spec §11). Numbers without sources don't go in.
- External facts (harness contracts, protocol status, library behavior) are
  verified against current primary sources before you build on them —
  the hooks contract has already drifted once; assume it will again.
- When a review surfaces findings, apply **all** of them.
- Keep documents in sync: a change to behavior updates the spec; a change to
  scope updates §2 and §14; a judgment call updates §11.

## Session protocol

**At start**: read the items above; check `git log` for what the last
session did; check open items in spec §14.

**During**: prefer diagnostics over guessing — the oracle's own logs
(FR-M1/M2) are the first place to look when something misbehaves. Verify as
you go; don't batch verification to the end.

**At end — non-negotiable**: everything committed and pushed (this
container is ephemeral; unpushed work dies with it); `docs/STATUS.md`
updated in plain language a non-programmer can read — what changed, what
works now, what's broken or unknown, and any question for the owner phrased
so they can answer it without technical background (a preference or a
yes/no, not an architecture choice).

## Feature ideation

The owner wants this tool pushed creatively, and expects the ideas to come
from agents. `docs/IDEAS.md` is the ledger: add entries whenever the work
suggests one — idea, why it would matter, evidence status (unvalidated /
researched / prototyped). Promotion path: IDEAS.md → spec §14 (with the
research to ground it) → requirement with owner sign-off. Ideas are cheap
and welcome; ungrounded requirements are not — the ledger is exactly the
place where those two facts coexist.

## Mission, verbatim

> Deliver the fact that would change the agent's next decision, at the
> moment of that decision, without being asked.

If a proposed change doesn't serve that sentence, it doesn't belong in this
project.
