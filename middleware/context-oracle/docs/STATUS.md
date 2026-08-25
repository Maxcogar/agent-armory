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

- **Answer-drift stops the main case: an agent that ignores your question and edits code gets
  blocked until it answers.** That is the dominant path — a drifting agent writes code through the
  normal editing tools, and the block catches it. Three narrower slips it can't fully catch, each
  backstopped by a "you claimed done with a question still open" flag on your status screen: writes
  hidden inside a script/interpreter (`python gen.py`) — a permanent gap, because catching those at
  the moment of the write would need the model and the model can't run fast enough there; an agent
  that silently ends its turn (you just re-ask); and clearing on a *substantive* answer rather than
  a *verified-correct* one (judging correctness would be the "pass a test to proceed" gate you
  rejected). (If you'd rather widen coverage before anything ships, say so.)
- **The skill block stops an agent that skips a step of your expert skills — including the ones
  that matter most:** did it dispatch the mandatory independent review, did it read the sources
  before planning. It can't catch a pure-thinking step like "did you *actually* verify this against
  the source" — nothing observable separates done-right from skipped there, so no mechanism (and no
  person) can — so an all-judgment skill gets little from it.

## What to do next (agent-owned)

- **The spec has converged** — five rounds of independent expert-review + collapse-hunt, each with
  author self-review first and all findings applied; the final round's verdict was that the design
  is sound and its remaining limits are irreducible truths about the problem, not defects. It is a
  reasonable approval baseline.
- **Roadmap note — answer-drift is not "done" until Phase B.** Its Phase-A increment is a safe
  skeleton that rarely fires; the owner value (real OL-C3 precision) is entirely Phase B (the
  model-maintained question state). Don't let the project stall at Phase A and call the block
  finished — it would look broken to Max.
- **Doc re-sync (tracked task).** `RETHINK.md` §12.12 and `docs/specs/spec-context-oracle-phase0.md`
  still describe the superseded Stop-based no-deny blocking model. They need re-syncing to the
  reactive-`PreToolUse`-deny mechanism the v1 spec now defines (the spec's retired-ID note maps the
  old `FR-O4`/`FR-O4a` labels). (The context-oracle `CLAUDE.md` is already synced — it describes the
  reactive-deny mechanism and points to spec §8.) Out of scope for the spec itself; do it before
  those documents mislead a builder.
- **Then the Phase A architecture document** (`docs/architecture-context-oracle-phase0.md`),
  derived from the spec, adversarially reviewed, all findings applied — before any build. **At
  architecture time, re-confirm one load-bearing hooks fact against current source:** that
  `transcript_path` is written asynchronously / may lag (the whole D-41 lag design rests on it, and
  the hooks contract has drifted before) — the spec verified it 2026-08-25, but re-verify before
  building on it.

## Open external unknown (does not gate v1 design)

Whether a subagent hook's `additionalContext` propagates to the parent is undocumented;
the spec assumes **not** (C-4) and a cheap pre-design spike showing otherwise only adds
an option. (Spec §13.)
