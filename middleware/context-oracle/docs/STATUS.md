# Context Oracle — status

*Plain-language project status, updated at the end of every working
session. Newest entry first.*

## 2026-07-15

**Where the project is:** design phase, no code yet. The foundational
rethink (`RETHINK.md`) and the v1 specification
(`docs/specs/spec-context-oracle.md`) are written, externally
fact-checked, adversarially reviewed, and pushed on PR #42.

**What happened this session:**
- The spec was rewritten so every requirement traces to a verified source,
  an owner decision, or a recorded judgment call — and an adversarial
  review pass caught and fixed 14 problems in it, including claims that
  were stated more confidently than the evidence allowed.
- The owner rejected the API-key fallback. The oracle now has exactly two
  modes: borrow the already-logged-in Claude Code, or run in the no-model
  degraded mode. It never has credentials of its own.
- The owner expanded the scope with five new decisions (recorded in
  RETHINK §12 addendum): whispers reach subagents in v1; the oracle watches
  whether agents actually follow the skills/workflows they load; it watches
  for the "user asked X, agent keeps answering Y" pattern; it must diagnose
  its own failures instead of relying on the owner to notice; and the
  project is formally agent-led, with the working rules in `CLAUDE.md`.

**What works right now:** nothing is built yet — that's expected. PR #42
(rethink + spec + governance) was merged by the owner on 2026-07-15.

**Next step — and it is not building.** The lifecycle is spec →
architecture → plan → build (now written into `CLAUDE.md`). The next
session's job is the architecture document plus the two cheap validation
experiments the design depends on (does the borrowed-login trick work in
the sandboxes; can whispers reach subagent contexts). Building Phase 0
starts only after that document survives its own adversarial review.
The complete handoff for that session is
`docs/handoffs/2026-07-16-architecture-phase.md`.

**Broken / unknown:**
- Two things the design assumes are still unverified and are Phase 1's
  first checks: whether the borrowed-login trick works in every sandbox,
  and whether whispers can actually be injected into subagent contexts.
- Whether the two new "conduct" whisper types will fire falsely too often
  is unknown; they ship with an automatic self-disable ladder as the
  safety net.

**Questions for the owner:** none open — all questions raised this session
were answered and recorded.
