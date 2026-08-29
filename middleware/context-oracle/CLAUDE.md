# Context Oracle — how agents work on this project

This file holds **standing rules only** — things true regardless of where the
project stands. State lives in `docs/STATUS.md`; rationale and history live in
`docs/collapse-log.md` and `docs/reviews/`. Anything you are tempted to add
here that fails that test goes to its home per the routing table below.

This is an **agent-led project** (OL-11). The owner, Max Cogar, is a
non-programmer by design: he starts and ends sessions, suggests features, and
speeds up testing. Design, build, verification, diagnosis, documentation, and
roadmap are yours.

## The owner ledger governs everything attributed to Max Cogar

`OWNER-LEDGER.md` is the single source of truth for every owner-attributed
claim ("the owner wants/decided/said", `[OL-n]`, "per your instruction").
Treat a claim as authoritative **only** if it is under CONFIRMED there. Not
there? Add it to PENDING with the exact words and source, then stop and get
Max's explicit sign-off. Only Max confirms; an agent never self-confirms, and
"follow the process" is not sign-off. (Why: agents have repeatedly invented
owner claims and propagated them — ledger REJECTED section; collapse-log
2026-08-12.)

## Read before working

1. `OWNER-LEDGER.md` — what is and isn't authoritatively Max Cogar's.
2. `docs/STATUS.md` — where the project stands and what to do next.
3. `docs/specs/spec-context-oracle.md` — the single spec for the whole tool
   (A/B/C are build order, not separate products): §11.5 build order, §12
   judgments, §13 open items, §14 acceptance. There is never a separate
   per-phase spec; per-phase build detail belongs in that phase's architecture
   document.
4. `RETHINK.md` — founding rationale; agent-contaminated in places, so only
   ledger CONFIRMED is authoritative for owner claims. §12 + addendum are
   background, not a second spec.
5. `docs/collapse-log.md` — the traps, meant to be inherited. Read before
   designing.
6. `docs/reviews/` as needed; the oracle's own FR-M3 self-report once it exists.

## Where information goes — the policy

Name the target file and the test it passes **before** writing anything down.

| File | Its one job | Membership test |
|---|---|---|
| `RETHINK.md` | Founding rationale; owner decisions | Founding rationale, or a decision only the owner can make/reverse? |
| `docs/specs/spec-context-oracle.md` | What the tool must do (all phases) | A requirement, constraint, or acceptance criterion? |
| `CLAUDE.md` (this file) | How agents work here | True regardless of where the project stands? |
| `docs/STATUS.md` | State and next steps | Would this have been different a week ago? |
| `docs/architecture-*.md` | Design and its verified premises | A design decision, rationale, or premise evidence? |
| `docs/reviews/` | Review output, point-in-time | Output of a review? **Written once, never edited.** |
| `docs/collapse-log.md` | Lessons that outlive their origin | Would this change a different, later decision? |

Rules that make the table decidable:

1. **One fact, one home** — a summary plus a pointer is fine; a second full
   copy is not.
2. **Only `STATUS.md` states what to do next.** No other file carries next
   steps, priorities, or plans.
3. The one sanctioned overlap: a review finding that generalises gets one line
   plus a pointer in the collapse-log; the review stays the evidence.
4. **A new file is almost never the answer.**
5. **No handoff documents — `STATUS.md` is the handoff.** `docs/handoffs/`
   predates this rule and is history only.

(Why this policy exists: three duplication incidents in one session —
collapse-log 2026-07-31.)

## The retired `ctxpack` design is dead

`middleware/codebase-context-compiler/`, `…-sandbox/`, and
`middleware/Gemini-context-compiler/` are ARCHIVED, read-only reference. Do
not implement, extend, or cite them as current. The gatekeeper posture — deny
paths, plan gates, assumption firewalls — is rejected by owner decision (see
"Decisions are locked" below).

## The two dominating rules

**1. The owner cannot catch your mistakes.** Never claim something works
without having run it — paste the actual command and its output. Never mark an
acceptance criterion passed without executing it. If something is broken,
unverified, or half-done, say so in those words. A falsely reported success is
the worst failure this project can have — worse than no work, because it
poisons every decision built on it.

**2. No hollow decisions — and the owner is never the one who catches them.**
Every load-bearing decision passes the collapse test, in writing, before
acceptance and again in review:

1. State its job in one sentence, in mission terms — if the only sentence you
   can write describes the mechanism, it is filler: cut it.
2. Write the single hardest question a mission-literate skeptic would ask to
   expose it as hollow.
3. Answer with a citation to a spec/mission line. "I can't" means rebuild or
   remove — never ship with a hedge.
4. Name what it steers the agent toward and confirm that is a guide informing,
   never a gate policing.

The **independent collapse-hunt is mandatory**: a fresh subagent or session —
never the author — attacks each step-2 question harder and hunts for new ones.
Dispatching it is not the owner's call, and a generic environment default
against subagents does not override it; if tooling genuinely prevents it, halt
and say so rather than shipping an unattacked decision. The owner is never the
collapse-tester — if a hollow decision reaches him, that is a process failure:
log it. Record every collapse in `docs/collapse-log.md`. (Evidence for why
each clause exists: collapse-log 2026-08-01, 2026-07-31.)

## Don't hand the owner a decision that is already written

Design, build, verification, sequencing, and process are yours (OL-11).
Before asking the owner anything, classify it:

- **Already written** — in this file, the ledger, or the spec → read it and act.
- **Derivable** from the mission or spec → derive it.
- **Genuinely his** — a preference, a scope call, a yes/no needing no technical
  background, or new evidence contradicting a locked decision → to him, with
  the evidence. Only these.

The test: if you can name the file and line that decides it, you have your
answer. OL-12 (2026-07-30) is what a real owner question looks like.

## Decisions are locked in writing, nowhere else

Authorities: `OWNER-LEDGER.md` CONFIRMED (controls; RETHINK §12 is its
recorded rationale) and the spec's judgments (§12) and build order (§11.5).
Do not re-litigate or drift. Never reintroduce what the owner rejected:

- **No pre-emptive gate** — no deny before the agent has actually deviated, no
  plan firewalls, no "pass a test to proceed", no generated-file block
  `[OL-R4]`. Reactive blocking exists in exactly the two confirmed cases —
  answer-drift `[OL-C3]` and skill non-conformance `[OL-C2]` — defined in spec
  §8, the authority; do not restate the mechanism here. Everything else is an
  advisory whisper.
- **No separate credentials** — host-CLI piggyback or deterministic degraded
  mode; the oracle never requires, requests, or stores its own keys.
- **No writes inside the repo tree** except hook wiring on explicit `init`.
- **No compiled context packages** as the agent interface; no agent-required
  rituals.

New evidence that genuinely contradicts a locked decision goes to the owner as
a question with the evidence — never resolved by an agent.

## Lifecycle — no shortcuts

**Spec → architecture → plan → build.**

- No implementation before an approved architecture document for the phase
  being built, derived from the spec and adversarially reviewed with all
  findings applied.
- **The architecture is per phase**: a phase's architecture is written only
  when the prior phase has run and produced the data it needs (spec §11.5).
  The whole-scope `docs/architecture-context-oracle.md` is a banner-marked
  historical record — never a base to edit. (Why: collapse-log 2026-07-31.)
- **Spikes before design-freeze**: a spec-§13 assumption that gates the phase
  being architected is validated with a cheap throwaway experiment first.
- Then a plan (executable steps consuming spec + architecture), then build,
  against §11.5 phase exits and §14 acceptance criteria.
- Skipping a stage requires the owner saying so explicitly, in writing.

## Engineering standard

- The Expert Standard applies: judge against established practice, not against
  this repo's existing patterns — matching a bad pattern is a finding.
- Every non-trivial requirement carries a source annotation (named standard,
  `[OL-n]`, or `[D-n]` with reasoning in spec §12). Numbers without sources
  don't go in.
- Verify external facts (harness contracts, protocol status, library behavior)
  against current primary sources before building on them — the hooks contract
  has drifted before and will again.
- When a review surfaces findings, apply **all** of them.
- Keep documents in sync: behavior → spec; scope → §2 and §14; judgment → §12.

## Session protocol

**Start**: read `docs/STATUS.md` first, then the read-before-working list. Do
not reconstruct state from `git log` — commits record what was *attempted*,
`STATUS.md` what is *true*.

**During**: prefer the oracle's own diagnostics (FR-M1/M2) over guessing.
Verify as you go, not batched at the end. Route what you learn by the policy
above **before** writing it.

**End — non-negotiable**: (1) everything committed and pushed (containers are
ephemeral); (2) `docs/STATUS.md` rewritten, not appended — the whole state plus
what to do next, with any owner question phrased for a non-programmer; (3)
everything else routed by the policy; (4) no handoff document.

This is checked mechanically, at two layers, because written rules alone did
not hold (collapse-log 2026-07-31):

- **In-session (advisory):** `.claude/hooks/session-end-check.sh` runs on
  `Stop` and flags a missing STATUS rewrite, a handoff file, or an
  unsanctioned new file (single-cycle, never blocks).
- **At the merge gate (blocking):** CI runs
  `middleware/context-oracle/tools/check_docs.py` on every pull request that
  touches this project (`.github/workflows/context-oracle-docs.yml`) and
  **fails the PR** on cross-document rot: a cited requirement or ledger key
  that doesn't exist, a spec-section reference that doesn't exist, a retired
  ID cited as live, a handoff file, an edited review, or a project change
  without a STATUS rewrite. Keep it green; never weaken the checker to get a
  PR through — extending it when a key is legitimately retired is a
  deliberate, explained change in the same PR.

Assume you will break the rules too, and let the checks catch you.

## Feature ideation

The owner wants this tool pushed creatively, with ideas coming from agents.
`docs/IDEAS.md` is the ledger: idea, why it matters, evidence status.
Promotion: IDEAS.md → spec §13 (grounded by research) → requirement with owner
sign-off. Ideas are cheap and welcome; ungrounded requirements are not.

## Mission, verbatim

> Deliver the fact that would change the agent's next decision, at the
> moment of that decision, without being asked.

If a proposed change doesn't serve that sentence, it doesn't belong in this
project.
