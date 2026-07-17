# Cross-cutting concerns

These are not phases — they run across all six. Each is a capability with its own standards, and each is where multi-session, multi-tool work quietly succeeds or fails.

## Memory and continuity

**The problem.** Work started in one session must be resumable in another without re-explaining context, re-reading everything, or re-deriving decisions — otherwise every session starts from zero and re-makes (possibly differently) decisions already settled.

**Standard.** There is no established industry standard for AI-agent memory; the discipline is derived from first principles and is analogous to shift-handoff protocols where incomplete handoffs cause errors — healthcare's SBAR, the engineering logbook. The bar: a handoff artifact contains everything a competent practitioner needs to continue without access to the prior session's conversation.

**Do.** At each phase transition and session boundary, write a persistence artifact: what was decided (with reasoning), what was done, what's next, what's blocked, and what context the next session needs. Treat it as the mechanism that makes the work multi-session, not optional documentation.

## Project tracking

**The problem.** Multi-phase work needs a single source of truth for state — what's done, in progress, blocked, next — or agents redo finished work, skip needed work, or lose their place.

**Standard.** Basic project-management principles — work breakdown structure, dependency ordering, status tracking. No specific framework (Agile, Kanban, Waterfall) is mandated; the right one depends on the project. The tracking must distinguish which of the six phases each piece of work is in.

**Do.** Keep one persistent, updated source of truth for project state, phase-tagged. A roadmap or charter belongs here, as a living document, not a one-time artifact.

## Quality gates

**The problem.** Work that crosses a phase boundary without verification carries defects forward, where they cost more to fix.

**Standard.** A binary check at every transition — does the output *contain* the evidence its output contract requires? Not "does it look done." CMMI's verification-and-validation process areas are the model: quality is institutionalized through gates, not through hoping a practitioner remembered to check. The "process without proof" failure is exactly a gate passing despite missing evidence.

**Do.** At each handoff, check the prior phase's output contract item by item. Missing evidence on either axis fails the gate; the work returns rather than proceeding.

## Standards compliance

**The problem.** Naming the right standard requires either expertise (which agents approximate) or a reference system (which this methodology provides per phase).

**Standard.** Two forms, both structural rather than aspirational. *Frame-compliance:* a standard is "applied" only when it appears in the output's evidence — "consulted internally" but absent from the output is process without proof. *Premise-compliance:* a factual claim is "verified" only when the output cites how it was checked — a read of file:line with the reasoning, a documentation source with version and date, a test reproduction. A search result (a grep query and its hits) is a lead toward verification, not verification itself, and absence in particular can't be established by a search alone.

**Do.** Make both visible in the deliverable. A standard consulted but not cited, and a claim verified but not shown, both fail — on different axes.

## Tool composition

**The problem.** Tools are expected to interact; without explicit composition they duplicate work, contradict each other, or leave gaps.

**Standard.** Interface design — contracts, not implementations, define boundaries; the Unix philosophy of small tools that compose, adapted so each tool does one phase's work well and produces output the next phase's tools can consume. A tool whose output isn't valid input for the next phase is defective regardless of how good its internals are.

**Do.** When a tool is created or used, specify its relationship to the others — what it accepts and what it produces — against the methodology's handoff contracts.

---

## Git and documentation conventions

These recur in every phase and are worth standardizing once.

**Commits — Conventional Commits 1.0.0.** `type(scope): description`, where `feat` maps to a MINOR release, `fix` to a PATCH, and `!` or a `BREAKING CHANGE:` footer to a MAJOR, under SemVer 2.0.0. The value is a machine-readable history that drives versioning and changelog generation.

**Changelog — Keep a Changelog 1.1.0.** Human-facing, grouped as Added / Changed / Deprecated / Removed / Fixed / Security, with an Unreleased section. It is for humans deciding whether to upgrade — distinct from the raw commit log.

**Branching — chosen deliberately, not by habit.** Trunk-based development pairs with continuous delivery and is associated with stronger delivery performance in the DORA research; GitHub Flow is a lightweight middle ground; Git Flow suits scheduled-release, multi-version products and its own author now recommends simpler models for teams doing continuous delivery. Pick against the project's release cadence and state why — the frame axis applied to process.

**Documentation — Diátaxis.** Four distinct modes for four distinct needs: tutorials (learning), how-to guides (a task), reference (information), explanation (understanding). Most documentation confusion comes from mixing modes in one document; separate them.

**Architecture decisions — ADRs (Nygard).** One short record per significant decision: Title, Status, Context, Decision, Consequences. ADRs are immutable — a reversed decision gets a new ADR that supersedes the old one, preserving the history of why. This is the durable form of the decision-justification the phases require.
