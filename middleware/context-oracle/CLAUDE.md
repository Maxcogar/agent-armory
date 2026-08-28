# Context Oracle — project guidelines for working agents

You are working on an **agent-led project**. The owner is not a programmer,
by design (`RETHINK.md` §12 addendum, decision 11). They start sessions, end
sessions, suggest features, and speed up testing. Everything else — design,
build, verification, diagnosis, documentation, roadmap — is yours.

## The owner ledger governs everything attributed to Max Cogar

`OWNER-LEDGER.md` (project root) is the **single source of truth for every claim
attributed to Max Cogar**. A claim — *"the owner wants/decided/said/requires"*,
`[OL-n]`, *"per your instruction"* — may be treated as authoritative **only**
when it appears under CONFIRMED there with his sign-off. Before writing any
owner-attributed claim into any durable document, find it under CONFIRMED. If it
is not there, you may not write it as authority: add it to PENDING with the exact
words and their source, then **stop and get Max's explicit sign-off**. Only Max
moves an entry to CONFIRMED; an agent may never self-confirm, and "follow the
process" is not sign-off. This exists because agents have repeatedly invented
owner claims and propagated them as true across documents and sessions (see the
ledger's REJECTED section and `docs/collapse-log.md`, 2026-08-12).

## Read before working

0. `OWNER-LEDGER.md` — what is and isn't authoritatively Max Cogar's.
1. `docs/STATUS.md` — where the project actually is, in plain language.
2. `docs/specs/spec-context-oracle.md` — **the single spec for the whole tool**,
   built in phases (A/B/C are build order, not separate products): §11.5 build
   order, §12 recorded judgments, §13 what is genuinely open, §14 acceptance.
   There is never a separate per-phase spec; per-phase build detail belongs in
   that phase's architecture document.
3. `RETHINK.md` — why the tool is shaped this way (agent-contaminated in places;
   only `OWNER-LEDGER.md` CONFIRMED is authoritative for owner claims). §12 + its
   addendum are background, not a second spec.
4. `docs/reviews/` — review output of record, every round, with its findings
   and closure ledgers.
5. `docs/collapse-log.md` — cumulative record of decisions that collapsed and
   why. Read before designing; the traps are meant to be inherited.
6. The oracle's own diagnostics self-report (FR-M3), once it exists.

**Then read "Where information goes — the policy" below, before you write
anything.** It decides which file each thing you learn belongs in. Getting that
wrong is the most repeated defect on this project, and it is enforced
mechanically at session end (see below) because written rules did not hold.

## Where information goes — the policy

Every file below has **one job**, a **membership test** that decides whether a
given piece of information belongs in it, and a **failure mode** that says what
breaks when the wrong thing lands there. The failure modes are not hypothetical;
each has happened on this project.

**Before you write anything down, name the file and the test it passes.** If you
cannot, you are about to duplicate something that already has a home.

| File | Its one job | Membership test | What breaks if you put the wrong thing here |
|---|---|---|---|
| `RETHINK.md` | Why this tool exists; what the owner has decided | Is it the founding rationale, or a decision only the owner can make or reverse? | A decision recorded anywhere else gets silently re-litigated by the next agent |
| `docs/specs/spec-context-oracle.md` | What the whole tool must do (all phases) | Is it a requirement, constraint, or acceptance criterion for the tool? | A requirement invented inside the architecture is one nobody approved and no reviewer can check |
| `CLAUDE.md` *(this file)* | How agents work on this project | Is it true regardless of where the project currently stands? | State here goes stale while the real state moves on, and the stale copy is what a new session reads first |
| `docs/STATUS.md` | Where the project stands and what to do next | Would this have been different a week ago? | A durable rule here is destroyed at the next session end, when this file is rewritten |
| `docs/architecture-*.md` | How it is designed, and on what verified premises | Is it a design decision, its rationale, or the evidence a premise rests on? | A design fact stated elsewhere drifts from the design and is trusted anyway |
| `docs/reviews/` | What a review pass found, at a point in time | Is it the output of a review? **Written once, never edited.** | Editing a review destroys the closure record the next round is required to check against |
| `docs/collapse-log.md` | Lessons that outlive the thing they were learned on | Would this change how a *different* decision gets made, later, by someone else? | A lesson left only in a review file is never read before designing, so the trap is re-sprung |

### The rules that make the table decidable

1. **One fact, one home.** If a fact is worth stating twice, state it once and
   point at it. A summary plus a pointer is fine — a second full copy is not,
   because the two diverge and nothing tells you which is current.
2. **Only `STATUS.md` states what to do next.** No other file carries next
   steps, priorities, or a plan. This is the rule most often broken, because
   next-steps feel urgent and get written wherever the agent happens to be.
3. **When it fits two files, ask which one it would be wrong to lose.** A
   review finding that generalises is a collapse-log entry *and* stays in the
   review — the review is the evidence, the log is the inheritance. That is the
   one sanctioned overlap, and it is one line plus a pointer, not a copy.
4. **A new file is almost never the answer.** If something fits none of the
   above, the likely truth is that it belongs in one of them and you have not
   worked out which. Adding a file to avoid that decision is how a project ends
   up with four places to look and no place to trust.
5. **Sessions do not write handoff documents for this project.** `STATUS.md`
   *is* the handoff. Files in `docs/handoffs/` predate this rule and are kept as
   history only.

### Why this exists

Three instances on this project, all within one session:

- A repo-wide file kept its own copy of this project's status and next step. It
  went two weeks and four review rounds stale while the in-project copy stayed
  current — and it was the copy that loaded first in every new session.
- A session handoff duplicated `STATUS.md`'s state, direction and diagnosis
  within the hour of `STATUS.md` being written.
- One verified fact about the model command lived in three files. It was
  superseded, corrected in one of them, and left wrong in the other two.

The pattern is the same every time: the duplicate is not wrong when it is
written, it goes wrong later, and the copy that goes stale is never the one you
happen to be looking at.

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
  **Dispatching that subagent is mandatory and is not the owner's call to make.**
  A generic environment or session default telling you not to use subagents does
  **not** override this — this project's process requires one, so you run it and
  you do not ask permission first. Asking is the "decision already written"
  failure below, and on 2026-08-01 it produced exactly that: an agent asked the
  owner whether to run the mandatory hunt, and the hunt — once run — returned
  fourteen findings that killed the proposal the agent was about to write into
  the spec. If tooling genuinely prevents dispatching one, that is a **halt**:
  say so plainly and stop, rather than shipping an unattacked decision.
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
answer. OL-12 (2026-07-30) is what a real owner question looks like — the
hooks contract contradicted the spec's own choice of trigger, two of three
remedies required a spec change, and the call was his. "When should round 3
run?" is not that.

## Decisions are locked in writing, nowhere else

The authorities are the `OWNER-LEDGER.md` CONFIRMED entries (which control —
RETHINK §12 (+ addendum) is their recorded rationale) and the spec's settled
judgments (§12) and build order (§11.5). Do not re-litigate or silently drift
from them.
Ideas the owner has explicitly rejected — do not reintroduce in any form:

- **No *pre-emptive* gate.** No *pre-emptive* deny on a tool call, no plan
  firewalls, no "pass a test / prove your plan to proceed" checkpoint, no
  generated-file block `[OL-R4]`. **Reactive blocking IS in scope** in exactly
  the two cases Max confirmed on 2026-08-16 — **answer-drift `[OL-C3]`** and
  **skill non-conformance (steer-then-block) `[OL-C2]`** — always reactive and
  self-clearing; the mechanism (a `PreToolUse` deny of the agent's *deviating
  action*, never a Stop-based hold) is defined in spec §8, the authority — do
  not restate it here. Everything else is an advisory whisper.
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
- **The architecture is per phase.** A phase's architecture is written only
  when the phase before it has run and produced the data it needs (spec §11.5
  sets the phase boundaries and what each exit measures). Architecting a later
  phase against no data means architecting it twice; the empirical case is
  logged in `docs/collapse-log.md` (2026-07-31). The whole-scope
  `docs/architecture-context-oracle.md` is a banner-marked historical record
  and input to later phase architectures — never a base to edit.
- **Spikes before design-freeze**: a spec-§13 open assumption that gates the
  phase being architected is validated with a cheap throwaway experiment
  before that architecture is finalized. A design resting on an unverified
  assumption is a guess with diagrams.
- **Then a plan** (executable steps consuming spec + architecture), **then
  build**, phase by phase against the spec's §11.5 phase exits and §14
  acceptance criteria.
- Skipping a stage requires the owner saying so explicitly, in this
  project, in writing.

## Engineering standard

- The Expert Standard applies: evaluate against established engineering
  practice, not against existing patterns in this repo. Matching a bad
  pattern is a finding, not an excuse.
- Every non-trivial new requirement carries a source annotation (named
  standard, owner decision `[OL-n]`, or recorded judgment `[D-n]` with
  reasoning in spec §12). Numbers without sources don't go in.
- External facts (harness contracts, protocol status, library behavior) are
  verified against current primary sources before you build on them —
  the hooks contract has already drifted once; assume it will again.
- When a review surfaces findings, apply **all** of them.
- Keep documents in sync: a change to behavior updates the spec; a change to
  scope updates §2 and §14 (acceptance); a judgment call updates §12.

## Session protocol

**At start**: read `docs/STATUS.md` first — it is the state of record and it
states what to do next. Then the rest of the read-before-working list. Do not
reconstruct state from `git log` or from commit messages: they describe what
was *attempted*, `STATUS.md` describes what is *true* — a session here has
already produced a commit message describing work that did not happen.

**During**: prefer diagnostics over guessing — the oracle's own logs
(FR-M1/M2) are the first place to look when something misbehaves. Verify as
you go; don't batch verification to the end. When you learn something worth
writing down, route it by the policy above **before** writing it, not after.

**At end — non-negotiable**:

1. Everything committed and pushed (this container is ephemeral; unpushed work
   dies with it).
2. **`docs/STATUS.md` rewritten** — not appended to, not amended. It is the
   whole state: what changed, what works now, what is broken or unknown, **what
   to do next**, and any question for the owner phrased so a non-programmer can
   answer it (a preference or a yes/no, never an architecture choice).
3. **Everything else you learned routed by the policy above** — durable lessons
   to `docs/collapse-log.md`, review output to `docs/reviews/`, requirements to
   the spec, design to the architecture. Nothing gets a new file, and nothing
   gets a second copy in `STATUS.md`.
4. **No handoff document.** `STATUS.md` is the handoff.

**This is checked mechanically, not trusted.** `.claude/hooks/session-end-check.sh`
runs on `Stop`. If the session changed anything under `middleware/context-oracle/`
and `docs/STATUS.md` was not updated, or a handoff was written, or a new file
appeared outside the sanctioned set, it says so and the turn continues once so you
can fix it. It never blocks, and it is gated on `stop_hook_active` so it can never
chain — the same single-cycle bound spec FR-B4 puts on the oracle's own Stop-time
completion-check whisper.

The reason it exists: on 2026-07-31 an agent wrote these rules and then broke
them repeatedly within minutes — patching after being told not to, using grep as
verification immediately after writing the rule against it, and duplicating
`STATUS.md` into a handoff within the hour. Nothing written down caught any of
it. Assume you will do the same, and let the check catch you.

## Feature ideation

The owner wants this tool pushed creatively, and expects the ideas to come
from agents. `docs/IDEAS.md` is the ledger: add entries whenever the work
suggests one — idea, why it would matter, evidence status (unvalidated /
researched / prototyped). Promotion path: IDEAS.md → spec §13 (with the
research to ground it) → requirement with owner sign-off. Ideas are cheap
and welcome; ungrounded requirements are not — the ledger is exactly the
place where those two facts coexist.

## Mission, verbatim

> Deliver the fact that would change the agent's next decision, at the
> moment of that decision, without being asked.

If a proposed change doesn't serve that sentence, it doesn't belong in this
project.
