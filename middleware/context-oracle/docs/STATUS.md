# Context Oracle — status

*Plain-language project status, rewritten each session. It states the current
state and what to do next; the evidence lives in `docs/reviews/`, the durable
lessons in `docs/collapse-log.md`, and everything attributed to Max Cogar in
`OWNER-LEDGER.md`.*

## 2026-08-25 (review round) — Independent adversarial review run on the revised spec; all 14 findings applied.

A fresh independent subagent attacked the spec on four axes (owner-attribution, hollow decisions, expert-spec gates, downstream usability). It **confirmed the Gate-B verification below is genuine** (spot-checked node:sqlite, MCP SEP-2577, and the hooks contract against primary sources — all matched) and returned 14 findings, **all now applied and pushed**. The two that matter most were the exact failure this project exists to stop — invented owner attributions in the spec:

- **C1 — fabricated citation key.** Language coverage (C-6/D-15) was attributed to Max via `[OL:#3]` — a key that never existed in the ledger — with a direct quote put in his mouth. Removed the attribution and the key; C-6/D-15 now stand on architect judgment `[D-15]` + the confirmed anti-arbitrary-limit principle `[OL-C1]`. Max's actual words are preserved in `OWNER-LEDGER.md` as **PENDING OL-P1**, awaiting his sign-off — the spec no longer depends on them.
- **C2 — invented owner fact.** "Young / thin-history repos are Max's common case" was cited to OL-6/OL-11, neither of which says anything about repo age. Removed everywhere; the thin-history *capability* stays, grounded on the corpus-floor design `[D-7,D-8]`, not on a claim about his repos.
- **S1/S4** — the blocking model now has an explicit reconciliation (a block delivers no fact; it is a second owner-set objective standing *beside* the mission, not derived from it), and the answer-drift block is cited to `[OL-C3]` alone (OL-9 says "advisory only" and only survives as the superseded origin). **S2** — the context-oracle `CLAUDE.md` "no blocking, every intervention is an advisory whisper" absolute was stale against OL-C2/C3 and is now corrected (reactive blocking in two cases IS in scope; pre-emptive gate still rejected). **S3** — FR-A2g reframed so its headline fact is the covering-test *mapping* the agent lacks, not the run-state it already knows. **M1–M4, m1–m4** — non-primary-vs-blocking distinction, "bar is the only thing" scoped to volume/budget (dedup still applies), closing verification overclaim fixed to match the §9 table, AC-16 given a bounded fixture/window, OL-C2 quote fidelity, §10 model command demoted to illustrative, self-narration trimmed, NF-1 cold-spawn number marked as a spike-validated assumption.

**One owner action waiting:** confirm or reject **OL-P1** (language coverage) in `OWNER-LEDGER.md` — your call, not the spec's.

Next: the spec is now clean on both expert-spec axes and has survived one adversarial pass. Reasonable to run a second independent pass (the reviewer is never the author) or move to the Phase A architecture document.

---

## 2026-08-25 — Spec brought to the `/expert-spec` bar on both axes it was failing: fake deferrals removed AND every external premise actually verified against current source (not relabelled).

**Gate C (deferrals).** Max flagged that `/expert-spec` forbids the "resolve-later" deferrals agents keep planting, and §13 was full of them. Removed the three self-narration subsections ("Architecture-owned (mechanism deferred)", "Measured on the exit run", "Gate-B re-confirm before build") — they enumerated architect-owned mechanisms and tunable defaults the requirements already carry inline, which is the forbidden move of naming a decision only to disclaim it. §13 now holds only genuinely-open external unknowns.

**Gate B (premise verification) — the real refusal.** The first pass only *renamed* the "re-confirm at build" hedge to "prior pass"; the underlying failure — eleven load-bearing citations shipped unverified — remained, and that is what "still refusing to write the spec correctly" meant. This pass verified every §9 source against its current primary/authoritative source (2026-08-25):
- **Hooks contract** re-fetched: event set confirmed; `PostToolUseFailure` and `PermissionRequest` are **real events** (§13 had wrongly called them "assumed"); `PreToolUse` `additionalContext` is **optional and separate from `permissionDecision`**, injected before the tool runs and preserved if the call fails — the passive-whisper affordance, now confirmed against current source, not memory; `Stop`/`SubagentStop` continuation + `last_assistant_message` (the block affordance) confirmed; subagent `agent_id`/`agent_type` confirmed; timeouts confirmed (`SessionEnd` is a 1.5s budget raisable to 60s). Only genuinely-open hooks item left: subagent-`additionalContext` parent propagation (undocumented; spike-gated).
- **Threat-model sources** (OWASP LLM Top 10 2025 LLM01/LLM02, LLM Prompt Injection Prevention Cheat Sheet, Agentic Security Initiative ASI06 memory poisoning, Secrets Management Cheat Sheet) all confirmed current against `genai.owasp.org` / `cheatsheetseries.owasp.org`.
- **MCP SEP-2577** confirmed (Sampling deprecated; call the provider API directly — reinforces the host-CLI-piggyback model access).
- **Design-rationale literature** firmed to full citations: the vague `[CHI]` → Iqbal & Bailey (CHI 2007); `[JOHNSON]` → ICSE 2013 (Johnson/Song/Murphy-Hill/Bowdidge); `[HERZIG]` → MSR '13 pp.121–130; `[TRICORDER]` → ICSE 2015 pp.598–608; `[CACM]` → CACM 61(4) 2018; `[RSSE]` → Robillard et al., Springer 2014. Vague `[HH]` folded into the verified `[ROSE]`. `[NODE-SQLITE]`/`[ROSE]` stand at their 2026-08-16 verification (recent).

§9, the provenance-keys preamble, FR-O2, C-4, FR-K2, §13, and the footer were all updated to the verified facts. No citation is left on a "prior pass" or "assumed until" hedge.

Next: an independent review of this revised spec — the blocking model and this whole correctness pass have not been adversarially attacked yet.

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
