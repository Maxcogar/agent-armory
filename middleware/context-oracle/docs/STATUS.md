# Context Oracle — status

*Plain-language project status, updated at the end of every working
session. Newest entry first.*

## 2026-07-22

**Where the project is:** still design phase, no code — still correct. The
architecture document was **rebuilt** this session and then hardened by two
independent checks. It is now in much better shape than the version the last
session flagged as not-trustworthy, but it has **not yet been through a final
review of the rebuilt version**, so treat it as "strong draft," not "signed off."

**What got done this session:**
- The broken heart of the tool — how it decides what to say — was **rebuilt** on
  the spec's own rule (FR-A1). The old version could only pick from a pre-made
  list; the new one lets the tool actually reason and compose a whisper, while
  strict machine checks make sure every claim it makes points at real evidence and
  no repo text can sneak in as an instruction.
- Every fact the design leans on was **re-checked by actually running it** this
  session (not taken on trust). That caught a real, serious problem the old draft
  had hidden: the exact command the tool would use to reach the model included a
  flag (`--bare`) that **silently breaks login** on machines like yours (and this
  one). Proven live — it failed 3 times out of 3 — and fixed by removing the flag.
- The design was then attacked on purpose by **two independent reviewers** (one
  hunting for "sounds-right-but-hollow" decisions, one checking every fact and
  standard). They found the login bug above plus several more real issues — the
  "when to speak" dial was under-defined, the tool could quietly go silent and look
  healthy, the "answer a question" feature was weaker than claimed, and the record
  of what the tool said could be dropped under load. **All of them were fixed** and
  written down so future sessions inherit the lessons.

**What's broken / not trustworthy yet:**
- Nothing known-broken in the design right now — but the *rebuilt* document has not
  had its own final clean review pass yet. The honest state is "all found problems
  fixed; a fresh reviewer should still confirm the fixes hold together."
- A few things remain true unknowns by nature and are handled by checks-at-runtime,
  not promises: whether the login trick works on *your* laptop (only testable
  there), and one harness detail about whether a user-facing notice can leak into
  the AI's view.

**The one decision for you (a yes/no, no technical background needed):** the tool
can watch whether the AI is *following the steps of a skill it loaded* and whether
it *ignored a question you asked*, and gently point that out. That's genuinely
useful, but it edges close to "supervising" the AI rather than "handing it a fact"
— which is the thing this whole tool was built to avoid. I scoped it as tightly as
I could (it only speaks up when there's a real, present mismatch, never to nag). **Do
you want these two "conduct" nudges switched on by default, or off until you've seen
the tool run for a while?** Either is fine; there's an automatic off-switch if they
get annoying.

**State of the work:** everything this session is committed and pushed (draft
PR #49). Nothing is merged. The architecture is marked "strong draft, fixes
applied."

## 2026-07-17

**Where the project is:** still design phase, no code — and that's still
correct. The architecture document was written this session, but a rigorous
review found it isn't trustworthy yet and needs a proper rebuild before
anything is built from it. The spec underneath it is sound; the problem is
in *how the architecture document was written*, not in what the tool is
meant to be.

**What got done this session (and is worth keeping):**
- The two cheap experiments the design depended on were run for real, with
  the actual results saved:
  - Borrowing the already-logged-in Claude *worked* — a background call
    completed with no separate credentials. (Caveat: proven in this cloud
    environment; the same check still has to be repeated on your own
    machine.)
  - Whispers *can* reach a subagent's context — confirmed, with the harness
    even telling us which subagent is asking. This was the biggest open
    unknown, and the answer is yes.
  - Bonus: the transcript the oracle reads lags one step behind the live
    turn — measured, so the design now accounts for it instead of guessing.
- The core of the tool — how it decides what to say — was corrected. The
  first draft made it too weak (it could only pick from a pre-made list and
  only checked that a fact was *real*, not whether it was worth saying). The
  corrected version, written in `docs/judgment-layer-corrected-foundation.md`,
  is anchored on the spec's own rule (FR-A1) and lets the tool actually
  reason — while still never inventing or obeying anything.
- A durable safeguard was added to the project's rules (`CLAUDE.md`): every
  important decision now has to survive one hard question about whether it
  serves the mission, checked by a fresh independent pass — *not by you*.
  Past failures of this exact kind are recorded in `docs/collapse-log.md`.

**What's broken / not trustworthy yet:**
- The architecture document (`docs/architecture-context-oracle.md`) is **not**
  ready to build from. A review found 11 real problems, including one at the
  heart of the tool. More important than the count: they share one cause —
  the document repeatedly *claims* something is correct or complete without
  doing the check that would make it true (a total never added up, a
  coverage never enumerated, a control asserted with no mechanism, the core
  design never checked against the mission). So the fix is not to patch the
  11; it is to rebuild the document so every claim is actually *established*,
  not asserted. The spec is the trustworthy starting point.

**The one decision for you:** whether to do that rebuild now, pick it up in a
later session, or step back from the project for a while. All three are
legitimate — nothing is lost by waiting. The spikes, the corrected
foundation, the new safeguard, and this honest record are all saved and
pushed.

**State of the work:** everything this session is committed and pushed on the
working branch (draft PR #48). Nothing is merged, and the architecture is
explicitly marked not-ready.

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
