# Correction-Loop Skill — Ideation Working Doc

- **Status:** WORKING. Confirmed *design intent* (the WHAT), grounded in Max Cogar's USER EDITs (`docs/handoffs/2026-05-17-correction-loop-design-session-end.md`) + his 2026-06-06 confirmation in conversation. **Not yet designed or specced.**
- **CRITICAL history — read before any work:** this thread failed twice. The 2026-05-16 architecture rework was terminated by the owner (`docs/handoffs/2026-05-16-architecture-rework-orchestration-FAILED.md`); the 2026-05-18 correction-loop session ended with the cycle unbroken (`docs/handoffs/2026-05-18-correction-loop-session-end.md`). **`docs/specs/2026-05-16-correction-loop-option-a-design.md` on disk is the REJECTED, invented-bespoke version — do NOT build from it.** The authority is Max's USER EDITs + this doc.
- **The way out (owner's own diagnosis):** agents structurally fail at *integrated multi-surface design + implementation across many natural-language docs that must stay consistent.* The drift-proof answer is **framing B — a single source of truth** that the other surfaces derive from / defer to. Max's "consolidate the scattered logic into a skill" instinct **is** framing B.

---

## Confirmed model (the WHAT)

- **Division of authority.** The owner owns the **what** (the spec). Agents own the **how**. Agents are expected to make the engineering decisions themselves — they have the info, the knowledge, and the larger-picture understanding to do it better and faster than the owner could.
- **Multi-origin.** A correction can originate from (a) another agent catching a problem, (b) the owner raising a concern, or (c) an upstream failure that gets **source-traced back** to here. Not just "the owner said something is wrong."
- **Route to the real origin, in real time.** The problem goes to wherever it actually originated, determined in the moment by the finding — **no static routing table, no hard gates, no hardcoded defaults** (not "fails twice → rewrite spec"; not "spec never changes").
- **Autonomous source investigation.** On repeated failure, the agents investigate and trace to the source **themselves**. The system does not stop and dump the problem on the owner.
- **Cap = ~3 loops on the direct target, as a SIGNAL not a stop.** More than ~3 loops trying to fix the direct thing means the problem **is not in the direct thing** → widen the search and source-trace outward (could be the plan, the architecture, the spec, or something else — determined in real time). The cap is the trigger to look wider, **not** a stop-and-ask-the-owner gate.
- **Owner is involved ONLY when the trace lands on the spec.** A vague / underdefined / silently-changed spec is the owner's domain (the *what*), and it's where the owner's real intent has been silently lost before. Every other origin (plan / architecture / code / process) the agents fix at source themselves.
- **Pause is optional and owner-controlled** — never mandatory. The system exists so the owner does not babysit every step; the owner wants the *option* to pause, only when they want it.
- **Thorough, not thin.** This is a deliberate, thoughtful check-and-correct process — explicitly **not** a copy of how review/audit do reworks ("there is no thought put into it"). Architecture gets the rigorous version; review/audit may adopt it later if it proves out.
- **Scope discipline.** Nothing is "deferred" or "out of scope" unless the owner agrees.
- **(Adjacent, not now.)** The owner wants the AgentBoard *app-level* blocking toggle extended to architecture eventually, but **no app changes now** — and "not now" must never get propagated into removing existing checkpoints.

## Approach (grounded in the failure diagnosis)

- **Framing B — single source of truth.** The skill *is* the source; the scattered correction logic is **replaced**, not duplicated. Adding a parallel surface is the exact failure mode that burned this down twice.
- **Framing C — smallest vertical slice first.** Ship the loop end-to-end for one route at one level, validate, then expand. Do not attempt the whole multi-surface change at once.

## Discovery — PENDING (the plugin changed since May)

The command→skill migration and other changes mean the May locations are stale. Before consolidating, re-map where correction / retry / routing / halt / escalation / source-trace logic currently lives across the *current* plugin. [next step]

## Open / next

Discovery of the current scattered state → design the single-source skill around the confirmed model → expert-spec → careful build (one slice first). Design before implementation; no building on the rejected on-disk spec.
