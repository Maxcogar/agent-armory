# Context Oracle — status

*Plain-language project status, rewritten each session. It states the current
state and what to do next; the evidence lives in `docs/reviews/`, the durable
lessons in `docs/collapse-log.md`, and everything attributed to Max Cogar in
`OWNER-LEDGER.md`.*

## 2026-08-16 (later) — Restart + rebuilt spec + review done; then TWO owner-attribution falsifications were caught by Max. Both corrected in the ledger; the spec's blocking model is being rebuilt on his actual words. One thing is needed: his blocking position, in his words.

**The restart is done and the spec was rebuilt and independently reviewed** (see
the earlier 2026-08-16 entry's substance in `docs/reviews/2026-08-16-*` and the
committed spec). Then, answering the owner questions, **Max caught two things
attributed to him that were false** — the exact failure this project exists to
stop:

1. **The spec claimed he'd decided "false silence is worse than false speech"** to
   justify voicing uncertain hazards. He never said that. **Removed** from the spec
   (§1). (The *behavior* — voice uncertain hazards flagged — he did choose, as
   option "B"; that stands, recorded transparently as his selection, not as his
   wording.)

2. **The whole tool was built on "No hard blocks. None, anywhere." (old OL-3) as an
   absolute — which contradicts his OWN `RETHINK.md` §6**, *"a block is allowed only
   where wrongness is objective and machine-checkable."* His doc contradicts itself;
   prior agents (this session included) took the absolute and ran "advisory only, no
   blocks ever" through the entire spec. **Corrected:** OL-3 now records the
   contradiction in his words; **OL-P1 (PENDING)** holds his verbatim statements and
   awaits his full blocking position; the false absolute is no longer asserted.

**The ledger is the corrected source of truth** (`OWNER-LEDGER.md`): OL-3 reopened;
OL-P1 pending (his blocking words); OL-C1/OL-C2 confirmed; OL-1…OL-12 confirmed
except OL-3's blocking question. Recorded lesson: `RETHINK.md` itself is internally
contradictory on blocking — do not treat either §12.3's absolute or §6's exception
as the whole truth without his resolution.

**What to do next:**

1. **Max states, in his own words, when the oracle may block** (vs. only whisper) —
   OL-P1. On record so far, verbatim: answer-drift (*"block that motherfucker until
   it… actually answers"*) and his doc's generated-file example (which §6 says is
   his call to block or loudly warn). Is that the whole list, or more?
2. **Then rebuild the spec's blocking model on his actual words** — the current spec
   still carries the false "no blocks / no deny path exists structurally" posture
   (P2, §2.2, FR-O4) and must be corrected once his position is known. Do NOT guess
   it.
3. **Apply #2 (option B) and #3 (broad/extensible language coverage, not a hardcoded
   short list — Max can't confirm a fixed set and it shouldn't be one).**
4. **Then a confirmation review, then the Phase A architecture document.**

**Do not, under any circumstances, write a blocking scope or a language set as
Max's without his words.** Two falsifications were caught in one session; the
mechanism is the ledger + his verbatim sign-off.

## What is still open, and where it lives

- **OL-P1 (`OWNER-LEDGER.md`, PENDING)** — Max's blocking position, in his words.
  The one thing gating the spec's blocking rebuild.
- **The spec's blocking posture** (`docs/specs/spec-context-oracle.md` §2.2, P2,
  FR-O4, and the FR-A2l answer-drift genre) — still carries the false no-blocks
  absolute; rebuilt after OL-P1.
- **#2 (option B) and #3 (broad language coverage)** — to fold into the spec with
  the blocking rebuild.
- **The Phase A architecture document does not exist yet.**
