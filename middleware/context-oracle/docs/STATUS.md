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

**Owner-attribution is clean.** Nothing is attributed to Max unless CONFIRMED in
`OWNER-LEDGER.md`. The answer-drift block's definition is now **OL-C5** (Max's confirmed words,
2026-08-25): *after Max asks a question, the agent's next move must be a direct answer or an action
taken to provide that answer; if it is neither, the agent is corrected.* This **supersedes** the
earlier "writing code" framing (former `[D-39]`, and the pending OL-P3) — Max rejected that
(**OL-R5**) because a definition that must describe what it *isn't* is not defined well enough. The
spec's answer-drift section was rebuilt to OL-C5 (2026-08-25) and, because the core definition
changed after the six review rounds, **the answer-drift section needs a focused re-review** against
OL-C5 (the change simplified it — it removed the "writing code" proxy and the Bash-coverage padding).

## ⚠ Read the RIGHT spec — and kill the obsolete one

**The current v1 spec is `docs/specs/spec-context-oracle.md`.** It matches Max's decisions (it
blocks; no arbitrary limits / no "one whisper"). **`docs/specs/spec-context-oracle-phase0.md` is
OBSOLETE and contradicts confirmed decisions** — it predates OL-C1 (so it is built on a token
"budget"/whisper cap = the rejected OL-R3) and predates OL-C2/OL-C3 (so it says whispers "block
nothing"), and it rests on the agent-contaminated `RETHINK.md`. Max read it and — correctly — found
it doesn't line up with what he wants. **Recommended: delete `spec-context-oracle-phase0.md`.** The
"first buildable, model-free slice" concept it was for survives as **Phase A** in the current v1
spec (§11.5); Phase 0/A build detail belongs in an *architecture* doc derived from the current spec,
not a rival spec. (Awaiting Max's go-ahead to delete.)

### How the two blocks got realized (boundaries — for awareness, not decisions to make)

For the reader's awareness, so how OL-C2/OL-C5 were built is visible; each is either
mechanism-forced or a build-order call that's the agent's:

- **Answer-drift (OL-C5):** after you ask a question, if the agent's next move isn't a direct
  answer or an action to get the answer, it's blocked until it answers. Actions to *get* the answer
  (reading, running a test) run freely — they're the agent working toward answering, so the block
  never traps it or forces a fake "it works." Judging "is this move answer-directed?" needs the
  model, so the first (model-free) build is a conservative skeleton that catches only clear cases;
  the working version is the model-assisted phase. It clears on a *substantive* answer, not a
  *verified-correct* one — judging correctness would be the "pass a test to proceed" gate you
  rejected, so an on-topic non-answer can clear it and your recourse is to re-ask (the status screen
  flags "done claimed with a question still open" so you'll know to).
- **The skill block stops an agent that skips a step of your expert skills — including the ones
  that matter most:** did it dispatch the mandatory independent review, did it read the sources
  before planning. It can't catch a pure-thinking step like "did you *actually* verify this against
  the source" — nothing observable separates done-right from skipped there, so no mechanism (and no
  person) can — so an all-judgment skill gets little from it.

## What to do next (agent-owned)

1. **Delete `docs/specs/spec-context-oracle-phase0.md`** (awaiting Max's go-ahead — it's a spec
   delete). It's obsolete and contradicts confirmed decisions (token budget = OL-R3; "blocks
   nothing" = pre-OL-C2/C3); it built on `RETHINK.md`. Keeping it is why Max read the wrong spec.
2. **Focused re-review of the answer-drift section against OL-C5.** The spec had converged over six
   rounds against the older "writing code" framing; Max then gave the real definition (OL-C5,
   2026-08-25) and the section was rebuilt on it. The change *simplified* (removed the proxy + the
   Bash padding), but the core definition changed, so re-run the author self-review + one
   independent expert-review + collapse-hunt on the answer-drift block. The skill block (OL-C2) is
   unchanged and stays converged.
3. **Roadmap note — answer-drift is not "done" until the model-assisted phase.** The model-free
   first build is a conservative skeleton that fires rarely; the owner value (OL-C5 precision) is
   the model-assisted phase (the async question/answer-state classification). Don't stall at the
   skeleton and call the block finished — it would look broken.
4. **Sync `RETHINK.md` §12.12** to the reactive-`PreToolUse`-deny mechanism (it still describes the
   superseded Stop-based no-deny model). Treat RETHINK as agent-contaminated; only `OWNER-LEDGER.md`
   CONFIRMED is authoritative. (The context-oracle `CLAUDE.md` is already synced.)
5. **Then the Phase A architecture document**, derived from the current spec, adversarially reviewed,
   all findings applied — before any build. At architecture time, re-confirm one load-bearing hooks
   fact against current source: that `transcript_path` is written asynchronously / may lag (the D-41
   lag design rests on it; the hooks contract has drifted before).

## Open external unknown (does not gate v1 design)

Whether a subagent hook's `additionalContext` propagates to the parent is undocumented;
the spec assumes **not** (C-4) and a cheap pre-design spike showing otherwise only adds
an option. (Spec §13.)
