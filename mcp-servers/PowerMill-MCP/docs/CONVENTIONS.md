# PowerMill MCP — Conventions

How this program is worked on. Standardized once here so every session and every
agent works the same way. These follow the project-lifecycle skill's cross-cutting
conventions.

## Versioning — SemVer 2.0.0
The capability core, the skill set, and the knowledge schema are versioned
independently with Semantic Versioning. Breaking change → MAJOR, additive →
MINOR, fix → PATCH.

## Commits — Conventional Commits 1.0.0
Format: `type(scope): description`. Types: `feat` (→ MINOR), `fix` (→ PATCH),
`docs`, `refactor`, `test`, `chore`, `build`. A `!` or `BREAKING CHANGE:` footer →
MAJOR. Scope is the subsystem where useful, e.g. `feat(capability-core): …`,
`docs(program): …`. The value is a machine-readable history that drives versioning
and the changelog.

## Changelog — Keep a Changelog 1.1.0
`docs/CHANGELOG.md`, human-facing, grouped Added / Changed / Deprecated / Removed /
Fixed / Security, with an Unreleased section. Distinct from the raw commit log — it
is for a human deciding whether to upgrade.

## Branching — GitHub Flow
Short-lived branches off `main`, opened as PRs, reviewed, merged. Chosen
deliberately: it matches this repo's existing pattern and a continuous-delivery
cadence, without Git Flow's release-branch overhead (which suits scheduled,
multi-version products this is not). Documentation-only changes may be committed
directly to `main` when expedient; anything touching subsystem code goes through a
branch + PR.

## Documentation — Diátaxis
Four modes, kept in separate documents:
- **Tutorials** (learning) and **how-to guides** (a task) — for operators/agents using the system.
- **Reference** (information) — tool/skill/schema contracts.
- **Explanation** (understanding) — this file, ADRs, the requirements spec.
Most doc confusion comes from mixing modes; don't.

## Decisions — ADRs (Nygard)
Every significant decision gets one short record in `docs/decisions/`, numbered
`NNNN-title.md`, with: Title, Status, Context, Decision, Consequences. **ADRs are
immutable** — a reversed decision gets a *new* ADR that supersedes the old one, so
the history of *why* is preserved. Use the template in
[`decisions/0001-record-architecture-decisions.md`](decisions/0001-record-architecture-decisions.md).

## Continuity — session handoffs
At each session/phase boundary, write a handoff in `docs/handoffs/`
(`YYYY-MM-DD-<topic>.md`): what was decided (and why), what was done, what's next,
what's blocked, and what context the next session needs. The bar: a competent agent
can continue from the handoff + roadmap **without** the prior conversation.

## Quality gates
At each phase transition, check the prior phase's output contract item by item
(see the requirements spec §12 for the Define gate). Missing evidence fails the
gate; work returns rather than proceeding. "Looks done" is not a gate.

## Tool composition
When a tool (MCP tool, skill, or workflow) is created, state what it accepts and
what it produces, so the next step can consume it. A tool whose output isn't valid
input to the next step is defective regardless of its internals. The capability
core (A) provides "can do safely"; the judgment layer (C) provides "should do, this
way" — they compose through a defined contract, and skills cite tool contracts
rather than duplicating them.
