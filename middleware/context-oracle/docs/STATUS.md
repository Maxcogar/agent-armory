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
  deadlocks the path to a truthful answer or forces a fabricated "it works"). *Honest
  phasing:* the model-free first increment is a **safe skeleton** (deny plumbing +
  write-target typing, a conservative recognizer that rarely fires); the precision that
  makes it actually enforce OL-C3 — telling a real question from a rhetorical one, a real
  answer from a dodge — is **Phase B** (a model maintaining the question state off the
  synchronous path). It is not "working early"; it is safe early.
- **Skill non-conformance** steers first, then denies a step-skipping action; its
  under-fire (missed-block) detector checks each skill step's **observable
  post-condition** directly, independent of the action classifier. Its real enforceable
  core is concrete and high-value — the **mandatory review/collapse-hunt dispatch** and
  **read-before-plan** — not a toy.
- A block **delivers no fact** — it is a second owner-set objective standing *beside*
  the mission, justified in owner-objective terms, and it carries its own adversarial
  test **plus** the mandatory independent collapse-hunt (a self-test never suffices).

**Owner-attribution is clean.** Nothing is attributed to Max in the spec unless it is
CONFIRMED in `OWNER-LEDGER.md`. Max's real 2026-08-25 answer-drift scoping words are
recorded verbatim as **OL-P3 (PENDING)**; the spec grounds the trigger on OL-C3 +
design judgments `[D-39, D-40]` and does **not** build on OL-P3.

## What needs Max — one thing (nothing blocks the spec; it stands honestly either way)

- **Confirm or correct OL-P3** (`OWNER-LEDGER.md` PENDING) — your 2026-08-25 answer-drift
  scoping words are recorded there **verbatim** (see the ledger for the exact text — the gist
  is that an agent going off to *write code* instead of answering is the situation to catch,
  and an agent that silently ends its turn you'll just re-ask). Confirming gives the design
  direct owner backing; the spec doesn't depend on it either way. This is the only open owner item.

### How your two block directives got realized (boundaries — for your awareness, not decisions to make)

I decided these; they're here so you can see how OL-C2/OL-C3 were built and flag anything you'd
want different. None is a question you have to answer, and each is either mechanism-forced or a
build-order call that's mine to make:

- **Answer-drift catches editing-tool writes now, terminal writes partly, and some terminal
  writes never.** It stops code-writing through the normal editing tools first; writing through
  the terminal splits — the *obvious* terminal writes (a command whose target source file is right
  there) are a committed fast-follow, but writes hidden inside a script or interpreter
  (`python gen.py`, `python -c "…"`) **can't be caught at deny-time by any rule that isn't the
  model, and the model can't sit on that path** — so those are a permanent gap, backstopped only by
  the "you claimed done with a question open" flag below. (If you'd rather widen coverage before
  anything ships, say so; otherwise it proceeds editing-tools-first.)
- **The block clears on a *substantive* answer, not a *verified-correct* one — because it must.**
  The tool can't judge whether an answer is *right* without becoming the "pass a test to proceed"
  gate you rejected. So an agent could clear it with an on-topic answer that isn't quite right;
  your recourse is to re-ask, and the tool flags on your status screen when an agent claimed "done"
  with your question still open — **best-effort**, since that flag depends on the same imperfect
  "did it answer?" read, so it can miss the hardest cases (this is why the flag exists, not a claim
  it catches every dropped question).
- **The skill block enforces steps that leave a trace, not pure-thinking steps.** It catches a
  skipped step that should have produced a file / run / state — including high-value ones like
  *did you dispatch the mandatory independent review* and *did you read the sources before
  planning*. It can't catch "did you actually verify this against the source" in the agent's head —
  nothing observable separates done-right from skipped, so no mechanism (and no person) can. An
  all-judgment skill gets little from it.

## What to do next (agent-owned)

- **Continue the review discipline to convergence** — apply round-N findings, author
  self-review, re-run both independent passes, until a round returns only wording/
  propagation nits (not new conceptual collapses). Nearly there.
- **Doc re-sync (tracked task).** `RETHINK.md` §12.12 and `docs/specs/spec-context-oracle-phase0.md`
  still describe the superseded Stop-based no-deny blocking model. They need re-syncing to the
  reactive-`PreToolUse`-deny mechanism the v1 spec now defines (the spec's retired-ID note maps the
  old `FR-O4`/`FR-O4a` labels). (The context-oracle `CLAUDE.md` is already synced — it describes the
  reactive-deny mechanism and points to spec §8.) Out of scope for the spec itself; do it before
  those documents mislead a builder.
- **Then the Phase A architecture document** (`docs/architecture-context-oracle-phase0.md`),
  derived from the spec, adversarially reviewed, all findings applied — before any build.

## Open external unknown (does not gate v1 design)

Whether a subagent hook's `additionalContext` propagates to the parent is undocumented;
the spec assumes **not** (C-4) and a cheap pre-design spike showing otherwise only adds
an option. (Spec §13.)
