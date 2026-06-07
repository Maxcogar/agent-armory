# Handoff — Correction-loop skill SHIPPED (2026-06-06)

**Owner:** Max Cogar. **Repo:** `Maxcogar/agent-armory`. **Plugin:** `claude-plugins/agentboard/`.
**Branch:** `session/2026-06-03-agentboard-consistency-audit-subagent`. **PR:** #38 → `main` (pushed, open).
**HEAD:** `903355b`.

Read this in full before touching the correction-loop thread. This thread failed twice before
(see the 2026-05-16 / 2026-05-17 / 2026-05-18 handoffs). **This session is the first that produced
a committed, owner-approved artifact.** Do not undo that by re-deriving from scratch.

## Status — what is DONE and approved

- A new skill exists at **`skills/correction-loop/SKILL.md`** — the single source of truth for the
  architecture pipeline's correction loop. It is grounded in the owner's confirmed model and the
  `docs/specs/spec-ledger.yaml` records **CL-001..CL-029** (every section maps to a CL record in a
  traceability table at the bottom of the skill). Nothing in it is invented.
- The owner **reviewed it and approved** ("looks good to me", 2026-06-06).
- It was authored/refined via the `skill-creator` methodology (rewrite to the writing guide;
  3-scenario with-skill-vs-baseline evals = 100% vs 53%; description tuned for triggering).
- Committed in three commits on the branch above:
  - `a71d802` add correction-loop skill + commit pending plugin docs
  - `72d4c74` bump 0.5.0 -> 0.6.0
  - `903355b` optimize the skill description + bump -> 0.6.1
- Eval/optimization record lives under `skills/correction-loop-workspace/` (eval set, both
  description versions, results, and the Windows-safe trigger harness `measure_trigger.py`).

## CRITICAL — correct the stale cautions before doing anything

The ideation doc `docs/ideation/2026-06-03-correction-loop-skill.md` (doc #4) says two things that
were **already false when it was written** and must not be trusted:

1. "Not yet designed or specced." — **False.** The loop was designed (CL-001..CL-029 ledger +
   derived prose), implemented, and independently audited "structurally sound" on 2026-05-23
   (`docs/handoffs/2026-05-23-codex-remediation-audit.md`).
2. "`docs/specs/2026-05-16-correction-loop-option-a-design.md` on disk is the REJECTED invented
   version — do NOT build from it." — **False.** That on-disk file is the **derived Phase-8 short
   prose** (`Status: Phase 8 derived prose draft`, CL-traceability). The rejected DD/AC version is
   the separate `…-option-a-design.BACKUP-pre-rework-2026-05-17.md`. Doc #4 carried the May-18
   caution forward without re-reading disk.

The next agent must verify on-disk reality before trusting any handoff/ideation claim.

## The PLAN — what is NEXT (owner-DEFERRED, do NOT start without his go-ahead)

The skill is a **new** single source, but it is not yet **physically** the only source. The
correction logic still lives, duplicated, in these runtime surfaces and they do **not** yet defer
to the skill:

- `skills/architecture/SKILL.md` — the embedded correction loop at **steps 17, 161, 196**.
- `agents/architecture-compose-l1.md`, `-l2.md`, `-l3.md` — the triplicated `## Correction-mode process` blocks.
- `agents/architecture-research-agent.md` — the `force_remeasure` correction input (CL-009).
- Two **dangling references** the runtime hands off to that have **no implementing surface**:
  the "external investigator" agent (skill step 196 / spec §5) and the "external spec-modification
  path" (step 193 / §4). `Glob **/*investigat*` returns nothing.

**The consolidation** = point those surfaces at `skills/correction-loop/SKILL.md` and remove their
divergent copies, plus decide what to do about the two dangling paths. **Max said "leave it for now"
on 2026-06-06.** It is the entangled multi-file change that burned this thread twice — when it is
taken up it must be **design-first, plan-first, one coherent change, with an un-directed independent
review** afterward. Do **not** dispatch it as one big autonomous multi-file edit, and do **not**
start it without an explicit owner go-ahead.

## Caveats (no spin)

- The `skill-creator` automated trigger harness (`run_eval`) is **broken on Windows** (`select()` on
  subprocess pipes → `WinError 10038`). A Windows-safe replacement was used
  (`skills/correction-loop-workspace/measure_trigger.py`). The improved-description re-measure was
  **corrupted by account credit/rate-limit pressure** (an impossible 3/3 → 0/3 swing), so the final
  description was chosen on the clean baseline signal + skill-creator best practice, not on a clean
  benchmark number. A trustworthy triggering benchmark needs a non-Windows box or fresh credits.
- Commit `a71d802` also swept in previously-stranded docs from **other** threads
  (`docs/specs/spec-remediation-project-type.md`, `docs/specs/spec-transcript-capture-hook.md`,
  `docs/ideation/*`, `dev-work-resources/{spec-rescue,spec-writing}`, `user-notes.txt`) at the
  owner's instruction to commit all uncommitted plugin work. They are not part of the correction-loop
  skill; do not conflate.
- Max's `middleware/codebase-context-compiler/` work is staged-but-uncommitted in the working tree
  and was deliberately **never touched** — it is a separate project, out of bounds.

## Standing rules for this thread (hard-won)

- Design before implementation; never invent design inside implementation.
- Surface contradictions; do not paper over them. (Doc #4 vs on-disk reality is the live example.)
- No large entangled autonomous multi-file edits.
- The owner owns the *what* (spec); agents own the *how*. Involve him only when a trace lands on the spec.
- Commit nothing without explicit instruction; nothing is "deferred/out of scope" unless he agrees.

## Authoritative sources

- The skill: `skills/correction-loop/SKILL.md`
- Requirement ledger: `docs/specs/spec-ledger.yaml` (CL-001..CL-029)
- Derived prose: `docs/specs/2026-05-16-correction-loop-option-a-design.md`
- Confirmed model + owner USER EDITs: `docs/ideation/2026-06-03-correction-loop-skill.md` and
  `docs/handoffs/2026-05-17-correction-loop-design-session-end.md`
- Prior-failure record: `docs/handoffs/2026-05-16-…-FAILED.md`, `…2026-05-18-correction-loop-session-end.md`
- Independent audit: `docs/handoffs/2026-05-23-codex-remediation-audit.md`
