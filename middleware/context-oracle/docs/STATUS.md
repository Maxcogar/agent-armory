# Context Oracle — status

*Plain-language project status, rewritten each session (not appended). It states
the current state and what to do next; evidence lives in `docs/reviews/`, durable
lessons in `docs/collapse-log.md`, and everything attributed to Max Cogar in
`OWNER-LEDGER.md`.*

## Where the project stands (2026-08-25)

The **v1 spec** (`docs/specs/spec-context-oracle.md`) is rebuilt on the **verified**
Claude Code hooks contract and has been through **three rounds** of the required
review discipline — an independent structured expert-review **and** an independent
adversarial collapse-hunt each round, by fresh subagents, author self-review first,
all findings applied. Reviews are converging: the mechanism is sound where it fires,
owner-attribution is clean, and every external premise is verified against current
primary source (via Context7 / the live hooks docs).

**The blocking model — corrected this session.** The two owner-confirmed blocks
(answer-drift `[OL-C3]`, skill non-conformance `[OL-C2]`) are realised as a reactive
**`PreToolUse` `permissionDecision: "deny"`** of the *deviating action* — verified
mechanism, not the earlier (wrong) Stop-continuation/counter model. Key properties:
- **Answer-drift** denies *writing code* (a repository mutation) while a question is
  unanswered; reads and **executions run to get the answer run freely** (so it never
  deadlocks the path to a truthful answer or forces a fabricated "it works"). Clears
  on a substantive answer.
- **Skill non-conformance** steers first, then denies a step-skipping action; its
  under-fire (missed-block) detector checks each skill step's **observable
  post-condition** directly, independent of the action classifier.
- A block **delivers no fact** — it is a second owner-set objective standing *beside*
  the mission, justified in owner-objective terms, and it carries its own adversarial
  test **plus** the mandatory independent collapse-hunt (a self-test never suffices).

**Owner-attribution is clean.** Nothing is attributed to Max in the spec unless it is
CONFIRMED in `OWNER-LEDGER.md`. Max's real 2026-08-25 answer-drift scoping words are
recorded verbatim as **OL-P3 (PENDING)**; the spec grounds the trigger on OL-C3 +
design judgments `[D-39, D-40]` and does **not** build on OL-P3.

## What needs Max — one thing (nothing blocks the spec; it stands honestly either way)

- **Confirm or correct OL-P3** (`OWNER-LEDGER.md` PENDING) — your 2026-08-25 answer-drift
  scoping words, recorded verbatim ("the agent writing code is the situation; an agent that
  just ends its turn without answering, you'll re-ask"). Confirming gives the design direct
  owner backing; the spec doesn't depend on it either way. This is the only open owner item.

### How your two block directives got realized (boundaries — for your awareness, not decisions to make)

I decided these; they're here so you can see how OL-C2/OL-C3 were built and flag anything you'd
want different. None is a question you have to answer, and each is either mechanism-forced or a
build-order call that's mine to make:

- **Answer-drift catches file-editing first; terminal (Bash) code-writing is a committed
  follow-on.** The first increment stops the agent writing code through the normal editing
  tools; writing code through the terminal needs a small extra deterministic detector, which I
  sequenced as a fast-follow. (If you'd rather it wait for terminal coverage before anything
  ships, say so — otherwise it proceeds file-editing-first.)
- **The block clears on a *substantive* answer, not a *verified-correct* one — because it must.**
  The tool can't judge whether an answer is *right* without becoming the "pass a test to proceed"
  gate you rejected. So an agent could clear it with an on-topic answer that isn't quite right;
  your recourse is to re-ask, and the tool now flags on your status screen when an agent claimed
  "done" with your question still open, so you'll know to.
- **The skill block enforces steps that leave a trace, not pure-thinking steps.** It can catch a
  skipped step that should have produced a file / run / state; it can't catch "did you actually
  verify this against the source" — nothing observable separates done-right from skipped, so no
  mechanism (and no person) can. An all-judgment skill gets little from it.

## What to do next (agent-owned)

- **Continue the review discipline to convergence** — apply round-N findings, author
  self-review, re-run both independent passes, until a round returns only wording/
  propagation nits (not new conceptual collapses). Nearly there.
- **Doc re-sync (tracked task).** `RETHINK.md` §12.12, `docs/specs/spec-context-oracle-phase0.md`,
  and the context-oracle `CLAUDE.md` still describe the superseded Stop-based no-deny
  blocking model. They need re-syncing to the reactive-`PreToolUse`-deny mechanism the
  v1 spec now defines (the spec's retired-ID note maps the old `FR-O4`/`FR-O4a` labels).
  Out of scope for the spec itself; do it before those documents mislead a builder.
- **Then the Phase A architecture document** (`docs/architecture-context-oracle-phase0.md`),
  derived from the spec, adversarially reviewed, all findings applied — before any build.

## Open external unknown (does not gate v1 design)

Whether a subagent hook's `additionalContext` propagates to the parent is undocumented;
the spec assumes **not** (C-4) and a cheap pre-design spike showing otherwise only adds
an option. (Spec §13.)
