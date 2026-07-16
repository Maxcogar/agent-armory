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
4. The oracle's own diagnostics self-report (FR-M3), once it exists.

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

- **No implementation work before an approved architecture document**
  (`docs/architecture-context-oracle.md`), derived from the spec, resolving
  the design questions the spec assigns to the architect — component
  boundaries, store schemas, IPC/daemon shape, judgment-prompt
  construction, recursion-guard mechanism, diagnostic log format — and
  adversarially reviewed with all findings applied, same discipline as the
  spec.
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
