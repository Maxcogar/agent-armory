# Independent Review Manifest — Correction-Loop Work (for Codex)

**Date:** 2026-05-18. **Repo:** `Maxcogar/agent-armory`. **Repo root:** `C:\Users\maxco\Documents\agent-armory`.
**Plugin:** `claude-plugins/agentboard/`. **Branch:** `main`. **Nothing pushed.**
All paths below are relative to `claude-plugins/agentboard/` unless absolute.

This is an **un-directed independent review** request. Do not trust the prior agent's
summaries, "looks good", "internally consistent", or "conformance only" claims —
re-derive every judgement. The prior agent self-attested all of it; none was independently
reviewed. The owner approved *summaries*, not the work. Find defects; do not confirm.

---

## 1. AUTHORITIES — review everything *against* these (precedence order)

1. `docs/handoffs/2026-05-17-correction-loop-design-session-end.md` — **untracked.** The owner's `[USER EDIT: …]` annotations in it are the ground truth for what the correction loop must be. Highest authority on intent.
2. `docs/handoffs/2026-05-16-architecture-rework-orchestration-FAILED.md` — committed `bea97bc`. Authoritative state record; KNOWN-WRONG items 1–6, UNVERIFIED items 7–10; the METHODOLOGY section (design-before-implementation; un-directed review only; surface contradictions; no large entangled autonomous edits).
3. Owner behavioral constraints at `C:\Users\maxco\.claude\projects\C--Users-maxco-Documents-agent-armory\memory\` — `feedback_no_reactive_overshoot.md`, `feedback_surface_contradictions_not_paper_over.md`, `feedback_design_before_implementation.md`, `feedback_no_grading_findings.md`, `project_arch_rework_failed_2026_05_16.md`.

---

## 2. ARTIFACTS UNDER REVIEW

### 2a. Committed this session (local only, not pushed)

| Commit | File | What changed | Verification status |
|---|---|---|---|
| `0c02426` | `docs/specs/2026-05-16-correction-loop-option-a-design.md` | Full rewrite of the design spec: DD-1..DD-7, DD-Routing, DD-Bundle, DD-ReviewerParam; §5 schema intent; §6 surface map; §8 AC-1..AC-12; §9 scope; §10 sign-off (owner-approved on paper) | Owner approved *the prior agent's summaries*, never an independent read. Internal consistency = the prior agent's own grep only. Pre-rewrite version preserved at `docs/specs/2026-05-16-correction-loop-option-a-design.BACKUP-pre-rework-2026-05-17.md` (untracked) — diff the two. |
| `56b2a14` | `docs/plans/2026-05-12-architecture-pipeline-rework-plan.md` | Stage-1 amendment: §1.1–1.6; new §4.1 `ARCH_CORRECTIONS_V1` schema; §6.1–6.6; §7 hook; §9 steps 4/9/11/14/17; §10 codex superseded; §11 AC-21; §12 Session 10 | Self-checked only. **CONFIRMED DEFECT (§3.1).** |
| `f9d817d` | `docs/specs/2026-05-12-architecture-pipeline-rework-contract.md` | Stage-2 conformance, 12 touch points (the "definition of done") | Self-checked only. |

### 2b. Uncommitted, working tree (reversible via git — both files are tracked)

| File | Change | Status |
|---|---|---|
| `agents/architecture-design-reviewer.md` | `verified_bundle_artifact_id` → `audit_artifact_id` (7 occurrences) + the apology sentence in Step 2(c) deleted | Grep-verified: 0 × `verified_bundle_artifact_id`, 2 × `audited_bundle_artifact_id` (the auditor's correctly-named input — correctly left untouched). No independent review. |
| `agents/architecture-research-agent.md` | **One** preamble line adds the optional `force_remeasure` flag | **CONFIRMED DEFECT: inconsistent half-edit** — the preamble now mentions `force_remeasure` but Step 2 has **no** suppression logic. The §6.1 conformance is partially applied. |

### 2c. Out-of-scope user work — DO NOT TOUCH OR REVIEW AS DEFECTS

The untracked `codex-plugins/agentboard/...`, `codex-plugins/agentboard/skills/architecture/`, and `skills/expert-standards/` changes are the **owner's own pre-existing uncommitted work**. Not part of this change set. Not touched this session. Not for review.

---

## 3. CONFIRMED DEFECTS / CONTRADICTIONS (factual, verified this session)

### 3.1 Plan §6 is a skeleton that does not describe the real profile files (COMMITTED in `56b2a14`)
Plan §6.1 describes research-agent "Step 2" as *"Read spec at `spec_path` in full."* The **actual** `agents/architecture-research-agent.md` Step 2 is *"Read inputs and check for a prior bundle"* — a far richer step (scaffold-card fetch + a four-condition prior-bundle reuse mechanism). The plan §6 sections are a structural skeleton; the real profiles were elaborated past them across Sessions 2–7. "Conform profile to plan §6" therefore rests on a false premise. This drift was committed.

### 3.2 The `audit_artifact_id` rename is half-done across the repo (live inconsistency)
`verified_bundle_artifact_id` is **two distinct parameters** sharing one string — verify this disambiguation independently:
- **Correct, keep:** compose's verified-bundle by-id input under the new DD-Bundle design. Intentionally named `verified_bundle_artifact_id`.
- **Wrong, must become `audit_artifact_id`:** the *design-reviewer's* input, which actually carries the **`ARCH_BUNDLE_AUDIT_V2` artifact's id**, not a bundle id (confirmed in `commands/architecture.md` step 9/14/operating-rule line ~228).
- **Correct, never touch:** `audited_bundle_artifact_id` — the auditor's input (the research bundle id). The design spec explicitly says do not conflate.

Rename applied this session **only** in: the design-reviewer profile, the plan, the contract. Still carrying the **wrong** name for the design-reviewer's input, unfixed:
- `commands/architecture.md` (step 14 argument, step 9 seam discussion, operating-rule ~line 228)
- `docs/specs/2026-05-12-agentboard-app-arch-pipeline-support.md` (~line 106)
- `docs/handoffs/2026-05-13-session-6-to-7.md`
- `hooks/tests/build-fixtures.py`
- ~12 × `hooks/tests/fixtures/review_*.json` (these encode the **wrong ARCH_DESIGN_REVIEW_V1 field name** vs plan §4 — the hook tests now test the wrong schema)

Historical record — must **not** be rewritten: the FAILED handoff, the 2026-05-17 handoff, the `.BACKUP` file (they *describe* the misnaming as the record).

### 3.3 `commands/architecture.md` contradicts the committed plan/contract on three counts (stage 4 unstarted — file NOT touched this session)
Verified by reading `commands/architecture.md` lines 80–232:
- **Step 11**: compose gets the bundle **inline** as `verified_bundle_json` (*"Pass the verified bundle inline; do not pass its artifact ID"*). The committed plan/contract now mandate **by-id** (DD-Bundle). Direct contradiction. = FAILED **item 4** (and the item-2 blocker shape).
- **Step 14**: design reviewer's argument is still the misnamed `verified_bundle_artifact_id`. = FAILED **item 5**, unfixed here.
- **Step 17**: still the **old spec-amendment workaround** (amend `spec_path`, re-run from research) plus the "Residual limitation" paragraph — the exact mechanism the approved design *supersedes*. = FAILED **items 1 & 3**, unfixed here.

### 3.4 `ARCH_CORRECTIONS_V1` is fully specified in docs but not implemented in code
Defined in plan §4.1, plan §7 hook rule-set, contract, design spec §5/DD-2/DD-4. The actual hook (`hooks/scripts/validate-architecture-artifact.sh` or `.py`, `hooks/hooks.json`) does **not** implement the detection branch or rule-set. Docs describe behavior the code lacks.

### 3.5 Compose profiles contradict the committed plan/contract
`agents/architecture-compose-l1.md` / `-l2.md` / `-l3.md` (NOT touched this session) still consume the bundle inline and have no prescribed revision-mode process. Plan/contract now mandate by-id + a prescribed revision-mode process. Code contradicts the committed spec of record. These profiles are also unaudited per FAILED items 7–10.

---

## 4. OPEN FAILED-HANDOFF ITEMS (status after this session)

- **Item 1** (correction-loop self-contradiction): design resolves it; plan/contract amended; **NOT applied to command** (step 17 still old workaround). Open in code.
- **Item 2** (live blocker — inline `verified_bundle_json` vs compose's declared input): still live in command. Open.
- **Item 3** (auditability regression — spec mutation in step 17): design forbids it (DD-7); command still does it. Open in code.
- **Item 4** (bundle inline not by-id): plan now by-id; command still inline. Open in code.
- **Item 5** (misnamed parameter): renamed in 3 places only; ~15 files still wrong (§3.2). Partially done, inconsistent.
- **Item 6** (two names for one thing): related to §3.2; not resolved in command.
- **Items 7–10** (compose-l1/l2/l3 + research + auditor unaudited; verification report unreliable; rebuilt hook unreviewed; `1112a22` not re-reviewed): **all still open; none addressed.** Profiles are being conformed on this unverified base.

---

## 5. LINKAGE MAP (what must cohere)

- Authority: USER EDITs (2026-05-17 handoff) + FAILED handoff → design spec `0c02426` → plan `56b2a14` → contract `f9d817d` → profiles + `commands/architecture.md` + hook.
- `ARCH_CORRECTIONS_V1`: plan §4.1 ↔ plan §7 hook rules ↔ contract §validation-hook + AC-20 ↔ design spec §5/DD-2/DD-4 ↔ **absent from the actual hook code**.
- The three confusable ids: `verified_bundle_artifact_id` (compose, DD-Bundle, keep) vs `audit_artifact_id` (design reviewer, renamed) vs `audited_bundle_artifact_id` (auditor, never touch). Verify nothing was conflated.
- Plan §6 ↔ real profile files: known mismatch (§3.1), profiles unaudited (items 7–10).

---

## 6. PRIOR AGENT'S PROCESS FAILURES THIS SESSION (disclosed, not excused)

- All committed document edits self-attested; substituted owner-approved summaries for the un-directed independent review the methodology requires.
- Committed the plan §6 skeleton-vs-profile mismatch without flagging it (owner caught it).
- When describing the system to the owner, conflated the *future* DD-Bundle design with the *current* command behaviour (claimed the orchestrator passes compose a bundle id; the current command actually passes it inline).
- Hedged ("possibly correct") on the rename consistency instead of determining it.
- Broke the agreed per-profile review cadence (chained profile 1 into profile 2 without bringing the first back).
- Began conforming profiles on the unaudited items 7–10 base.

---

## 7. BRIEF FOR THE REVIEWER

Read §1 authorities first. Then audit §2 artifacts against them. Treat §3 as the prior agent's *self-reported* defects — independently confirm or refute each, and find what it missed; §3 is not exhaustive. Pay particular attention to: (a) whether the committed design spec / plan / contract are internally and mutually consistent (never independently checked); (b) whether the `ARCH_CORRECTIONS_V1` schema (plan §4.1) coheres end-to-end with the §7 hook rules and the routing in DD-Routing; (c) whether the plan §6 skeleton problem invalidates any of the committed conformance; (d) the full true blast radius of the `audit_artifact_id` rename. Report findings by severity to the owner. Do not accept any self-attestation.
