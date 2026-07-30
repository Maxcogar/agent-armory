# Context Oracle — status

*Plain-language project status, updated at the end of every working
session. Newest entry first.*

## 2026-07-30

**Where the project is:** still design phase, no code — still correct. The
architecture went through its round-2 review this session and **failed it**, hard.
Nineteen problems were found across two independent reviewers. All nineteen are
now fixed. The document is in genuinely better shape than it has ever been, and
it has **not** been re-reviewed since the fixes, so it is not signed off.

**The headline: the tool would not have worked at all.**

The command the design uses to ask the AI model a question was tested this
session by actually running it — flags and all, exactly as written. **It fails.**
It returns an error and no answer, every time. The reason is small and completely
invisible on paper: the design allowed the model "one turn" to reply, but the
structured answer it asks for is delivered *as a second step*, so the call runs
out of turns before the answer arrives. Had this been built, the thinking half of
the oracle would have been dead on arrival on your machine — the exact same shape
as the login bug caught last round, and from the exact same cause: **the command
that was tested was not the command the design ships.** Last round wrote that
lesson down in our own notes. This round's spike section hadn't applied it.

**The other serious one: the "no tools" promise was not true.** The design claimed
the model it consults has no tools available, "enforced by construction". Run
live, eight tools were still available to it — including ones that can schedule
work and write files out. The fix (`--tools ""`, which is documented and which I
verified returns "none") turned out to be *better on every axis*: it's genuinely
empty, it's one step shorter, and it's about 40% faster. The two worst findings
of the round fixed each other.

**What you decided, and what I did with it.** You said the oracle speaking when an
agent claims it's done is a must-have. It's locked in as your decision #12, and
the spec now says out loud what the review discovered: speaking at that moment
*does* cost the agent an extra turn — it isn't free the way the rest of the tool
is. Rather than pretend otherwise, the oracle is now hard-limited to **one** extra
turn ever, it can never chain them, and every time it spends one it gets logged so
you can see how often it happened.

**The rest, briefly.** The tool had no way to tell "you couldn't have known this"
from "you could have found that in one second" — which your own founding document
calls the only measure that matters, and which had never been built. The two
"conduct" nudges you asked for (did the AI actually run the tests it says it ran?)
were designed in one place and made impossible in another, so they'd have been
quietly dropped at build time. The oracle spends *your* Claude subscription while
helping — with no limit on how much. In a fan-out, the 5th and 6th helpers got
nothing because the first three spent the budget. And the check meant to stop the
tool inventing things only checked that the fact it cited *exists*, not that its
sentence actually followed from it — I reproduced that live, watching the model
claim a coupling was "stable" and "a standard pattern, not accidental" from a
fact that said nothing of the kind.

**Something I want to flag about my own conduct.** Two of this round's problems
were caught by *you*, not by the machinery that exists so you don't have to: I
told a reviewer a required tool was unavailable (guaranteeing it would never try
it), and I used text-search results as proof — which produced one false alarm and
one near-miss where I almost accused a reviewer of fabricating a quote from your
own document. Both are written up as durable rules so future sessions inherit
them rather than repeat them. That's the mechanism working, but it worked one
step later than it should have.

**What's broken / not trustworthy yet:** nothing known-broken in the design right
now — but this is the same sentence I'd have written last round, and last round it
was wrong. What's *different* is that the document no longer certifies itself: the
four self-assessment blocks that kept producing false "all verified" claims are
deleted, replaced by evidence attached to each individual claim, with a standing
instruction that any future summary attestation is to be treated as a defect on
sight. Three rounds running, those blocks were the least reliable text in the file.

**Nothing needed from you right now.** Next step is a round-3 review of the fixed
document before any code gets written.

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
- I chased down the loose ends this session instead of leaving them vague. Two that
  I'd earlier called "unknown" are now settled by looking them up: the login trick is
  **documented** to work with your Claude subscription (a headless call uses your
  plan; there's just a quick confirm on your own machine at install), and the
  user-facing notice **stays on your channel, not the AI's**, by how the harness
  splits those two channels. The last one — an undisclosed internal file layout the
  subagent-watching feature reads — genuinely can't be *guaranteed* (it's not a
  documented thing), so instead of letting it fail quietly I made the tool **tell you
  out loud** if it ever breaks, which is the whole point of the self-watching design.
  Nothing here is a silent unknown anymore.

**A correction I owe you (no decision needed from you):** during this session I
briefly asked whether the "conduct" nudges — the tool watching whether the AI
followed the steps of a skill it loaded, or ignored a question you asked — should be
*off* by default, because one of the automated reviewers called them "supervising."
You pushed back, and you were right: that was me reflexively over-narrowing a feature
**you specifically asked for**. Supervising by a gentle, non-blocking note is exactly
what this tool is for — it never blocks anything, and pointing out "you said the
tests pass but I never saw you run them" is precisely a *fact the AI didn't realize*,
which is the whole mission. These two nudges are **on by default**, as you intended.
The only real thing to watch is that they don't get *chatty* — and the tool already
has an automatic dial-down for that, plus a planned check-in where you look at how
often they fire wrongly *after* it's run for real. Nothing for you to decide now.

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
