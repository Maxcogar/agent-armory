# Context Oracle — status

*Plain-language project status, rewritten each session. It states the current
state and what to do next; the evidence lives in `docs/reviews/`, the durable
lessons in `docs/collapse-log.md`, and everything attributed to Max Cogar in
`OWNER-LEDGER.md`.*

## 2026-08-16 (later) — Blocking recorded in Max's words: the oracle whispers by default and BLOCKS in specific cases — answer-drift, AND skill non-conformance (the corrective feature escalates from steering to a block when the agent won't follow his skills and can't justify skipping). The generated-file block is rejected as agent fixation and was struck from RETHINK. Spec blocking rebuild queued.

**The restart + rebuilt spec + review are done** (`docs/reviews/2026-08-16-*`). Then,
answering the owner questions, Max caught **three** things agents (this session
included) had attributed to him that were false — the exact failure this project
exists to stop. All three are now corrected in `OWNER-LEDGER.md`, in his words:

1. **"False silence is worse than false speech"** — never his; removed from the spec.
2. **"No hard blocks. None, anywhere." as a literal universal ban** — that was Max
   *rejecting the generated-file-blocking idea agents fixated on*, not banning all
   blocking. OL-3 now records that in his words.
3. **The generated-file block itself** (the *"single permitted hard intervention"* in
   `RETHINK.md` §6) — **not his; agent fixation.** *"thats not my example… i honestly
   dont even know what it means."* REJECTED as OL-R4.

**Max's active-intervention wishes, in his words (all confirmed) — beyond the
general advisory whispers, the oracle does TWO active things he explicitly asked
for, and BOTH must be represented (an earlier draft buried the second):**

- **(1) BLOCK on answer-drift (OL-C3):** when Max asks a question and the agent
  ignores it, hold the agent until it answers. *"the oracle should block that
  motherfucker until it stops ignoring me and actually answers. just dont make a
  convoluted fucked up way that its done."*
- **(2) The corrective / steering feature (OL-C2) — which escalates to a BLOCK:**
  driven by the oracle knowing Max's **expert dev-tool skills' structure** — when a
  skill is active, its steps, and what the agent should be doing. It **steers first,
  then blocks** when the agent won't follow the skill and *"CANT PROVIDE A REASON FOR
  SKIPPING A STEP… OR STEERING ISNT WORKING."* What Max rejected is the *pre-emptive*
  gate (*"take a goddamn test… to proceed"*), NOT this reactive escalation. Still
  **small / personal / explicitly non-primary.** His FULL verbatim words are OL-C2 —
  do not summarize them.

Also confirmed: OL-C4 (uncertain hazards → option B, voiced flagged, learning-loop
demotes false-firers) and #3 (language coverage should be **broad/extensible, NOT a
hardcoded short list** — Max can't confirm a fixed set and it shouldn't be one). The
generated-file block is REJECTED (OL-R4); everything else is an advisory whisper.

**Root cause — now removed at the source:** `RETHINK.md` — Max's *own founding doc* —
had the generated-file-block fixation written into it by an agent (§6 subsection +
a §12.3 phrase), so every rebuild resurrected it as if it were his. **It was struck
from `RETHINK.md` on 2026-08-16** (§6 subsection removed with a do-not-reintroduce
note; §12.3 phrase removed) and flagged REJECTED in the ledger (OL-R4). Treat
`RETHINK.md` as agent-contaminated: if a future session finds any blocking/gate
content there attributed to Max that is not in the ledger CONFIRMED, it is suspect.

**What to do next:**

1. **DONE 2026-08-16 — the spec (`docs/specs/spec-context-oracle.md`) was rebuilt on
   Max's actual words:** advisory by default; **blocks** for answer-drift (OL-C3) and
   skill non-conformance via steer→block (OL-C2); NO pre-emptive gate, NO generated-file
   block; uncertain hazards voiced-flagged (OL-C4); broad/extensible language coverage
   (C-6). See spec §2, §4, §8, §11.4.
2. **DONE 2026-08-16:** the generated-file block was struck from `RETHINK.md` (§6 + §12.3).
3. **Next: an independent review of this spec revision** (both axes), all findings
   applied — the blocking model is a large change and has not been attacked yet.
4. **Then the Phase A architecture document.**

**Offered to Max, unanswered — agent's to do when he says:** (a) sweep the rest of
`RETHINK.md` for other fabrications attributed to him; (b) change the rule so only the
ledger is authoritative for owner claims; delete the superseded
`spec-context-oracle-phase0.md`.

**Standing rule reinforced this session:** three owner-attribution falsifications
were caught by Max in one session, two of them baked into his own RETHINK doc by
prior agents. Treat `RETHINK.md` as agent-contaminated, not clean owner truth; only
`OWNER-LEDGER.md` CONFIRMED entries are authoritative, and every one must be his
verbatim words, never a summary.

## What is still open, and where it lives

- **Max's one-word confirm** of the corrected blocking position, and whether to
  strike `RETHINK.md` §6 — then the spec blocking rebuild proceeds.
- **The spec's blocking posture** (`docs/specs/spec-context-oracle.md` §2.2, P2,
  FR-O4, FR-A5a grounding, the answer-drift genre) — still carries the false
  no-blocks absolute; rebuilt on OL-C3 next.
- **The Phase A architecture document does not exist yet.**
