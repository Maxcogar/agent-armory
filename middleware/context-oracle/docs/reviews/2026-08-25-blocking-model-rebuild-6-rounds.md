# Review record — Context Oracle blocking-model rebuild (6 rounds to convergence)

*Point-in-time review record. Written once, never edited. Covers the rebuild of
the spec's blocking model onto the verified `PreToolUse`-deny mechanism, run as
six rounds of the required dual discipline: an independent structured
expert-review AND an independent adversarial collapse-hunt each round, by fresh
subagents, with author self-review applied before each independent round, and
ALL findings applied between rounds. Ends at a zero-findings / TERMINAL verdict.*

## What triggered the rebuild

The two owner-confirmed blocks (answer-drift `[OL-C3]`, skill non-conformance
`[OL-C2]`) had been specified on a **wrong mechanism** — a Stop-continuation with
K-counters / `stop_hook_active` bookkeeping — which modeled the wrong scenario
(an agent that "stops" without answering). The real, owner-confirmed scenario is:
Max asks a question and the agent **goes off writing code** instead of answering.
Verified against the current Claude Code hooks contract (Context7 `/websites/code_claude`
+ the live hooks docs, 2026-08-25): a `PreToolUse` hook fires after the agent
forms a tool call but before it runs and may return `permissionDecision:"deny"`
with a reason handed to the agent as the tool result. The block is therefore a
**reactive deny of the deviating action**, not Stop machinery.

## Convergence trajectory (monotonic decline in count and severity)

| Round | Expert-review | Collapse-hunt |
|---|---|---|
| 1 | 6 findings (owner-attribution clean; premises verified; mechanism-scope defects) | 3 SERIOUS collapses (silent-stop; wrong-axis trigger seeds; block scope) |
| 2 | **1 Serious — owner-attribution** (verbatim Max quotes put in the spec as authority, not in the ledger) | 3 collapses + partials — the "guard shares the recognizer's blind spot" shape |
| 3 | 5 (coherence/propagation; Gate A now PASS) | 3 collapses (on-topic-carve swallow; FR-C4 not independent; §8 disables its own collapse test) |
| 4 | 4 (1 Moderate transcript-lag; 3 minor) | 5 (recognizer limits, not just deny-target limits, were unnamed; two overclaims) |
| 5 | **1 Minor** (D-39 Bash-scope wording) | **TERMINAL on design**, one real finding (lag-window lean) |
| 6 | **ZERO FINDINGS — PASS** | **TERMINAL — ship it** |

## The load-bearing corrections, in order

1. **Mechanism** — rebuilt on the verified reactive `PreToolUse` deny; the old
   Stop-continuation/counter model removed; retired-ID note maps the dropped
   `FR-O4`/`FR-O4a` labels for downstream docs.
2. **Owner-attribution (round-2 Serious)** — in scoping the answer-drift block I
   had embedded Max's real chat words as spec authority. The project's cardinal
   sin. Fixed both ends: routed his exact words to `OWNER-LEDGER.md` **OL-P3
   (PENDING)**, awaiting his sign-off; re-grounded the trigger on OL-C3 (confirmed)
   + spec design judgments `[D-39, D-40, D-41]`; the spec keeps **no** verbatim
   unconfirmed owner words in its body.
3. **Trigger axis (round-2/round-4)** — "work vs information-gathering" diverges
   from "evading vs answering" on **execution commands** (running a test to answer
   "did it pass?" both executes and produces the answer). Denying those forced a
   deadlock or a fabricated completion claim. Narrowed the trigger to **writing
   code = a repository mutation**; reads and executions-to-answer run free.
4. **Recognizer limits, honestly phased (round-4, D-41)** — firing (is there an
   unanswered blocking question?) and clearing (substantively answered?) are
   **comprehension** judgments. Phase A ships a **safe skeleton** (deny plumbing +
   deterministic write-target typing + a conservative recognizer that rarely
   fires); OL-C3 precision is **Phase B**, where the model maintains the
   outstanding-question state **asynchronously** (never on the synchronous deny
   path — the deny reads cached state, NF-1).
5. **Bash coverage split (round-4/round-5)** — syntactically-explicit writes
   (`sed -i`, `cat > src`) are a committed deterministic-heuristic follow-on;
   **interpreter-mediated writes (`python gen.py`, `python -c`) are a PERMANENT
   deny-time limit** (the command string is identical to a test run; the model
   that could infer intent is barred by NF-1). Backstopped best-effort by the
   FR-B4 done-claim outstanding-question line.
6. **FR-C4 independence (round-3)** — the missed-skill-block detector was rebuilt
   on each step's **observable post-condition** (checked directly against
   store/repo state), not the action→step classifier it was meant to backstop.
   Its positive enforceable core is named (FR-C1a): the mandatory
   review/collapse-hunt dispatch, and read-before-plan.
7. **§8 owner-objective collapse test (round-3/round-4)** — "beside the mission"
   had removed blocking from the mission collapse test, leaving only "is the cite
   real?" (the axis the collapse-log says misses conceptual collapse). Rewritten
   to state the self-test does NOT discharge the mandatory independent collapse-hunt
   and to answer the *achievement* variant honestly, owning the limits.
8. **Lag-window lean (round-5)** — the final finding: the lag-window clear-axis
   lean was unspecified and defaulted to the horn that misses the narrate-then-write
   drifter. Fixed: in the lag window the block **holds/denies rather than pre-clears
   on unclassified text** (opposite the steady-state lean) — a wrongful deny
   self-recovers in one round-trip; a missed drifter does not.

## Verified external premises (against current primary source, 2026-08-25)

`PreToolUse` deny returns `permissionDecisionReason` to the model as the tool
result, provided "so it avoids retrying" — a **design intent, not a behavior
guarantee** (separated in FR-B2, measured via the FR-M4 deny-loop signal);
`transcript_path` is on every event **but written asynchronously / may lag**
(the load-bearing premise of the D-41 lag design); `last_assistant_message` is
Stop/SubagentStop-only; `Stop`/`SubagentStop` gained `hookSpecificOutput.additionalContext`
(Week 23, 2026-06); `stop_hook_active` + an 8-consecutive-continuation cap;
subagent `agent_id`/`agent_type`; the timeouts. Zero mismatches at round 6.

## Final verdict

Round 6: expert-review **ZERO FINDINGS / PASS**; collapse-hunt **TERMINAL**. The
blocking model is sound; its remaining limits (interpreter-mediated Bash writes,
silent stops, the substantive-vs-verified-correct clear bar, the eventually-
consistent classifier lag) are **irreducible truths** about enforcing an
answer-drift block at the write moment with the model kept off the synchronous
path — each named, measured, and (where applicable) acceptance-tested, not hedged.
It is **not** the "convoluted fucked up way" OL-C3 forbade: the runtime is one
sentence (write code with an open question → "answer Max first" → answer → proceed),
and the complexity lives in the spec's honesty about coverage.

## Open owner item

**OL-P3 (PENDING)** — Max's answer-drift scoping words, awaiting his confirmation.
The spec does not build on it; confirming gives `[D-39, D-40]` direct owner backing.
