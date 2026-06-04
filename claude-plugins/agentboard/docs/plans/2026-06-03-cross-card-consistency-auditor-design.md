# Cross-Card Consistency Cross-Examination — Design Spec

**Date:** 2026-06-03
**Status:** APPROVED and implemented (see §6) — owner-directed on this branch
**Branch:** `session/2026-06-03-agentboard-consistency-audit-subagent`

---

## 1. Problem

The agentboard pipeline decomposes one architecture into N independent cards, then
processes each card in isolation. Cross-card consistency is verified **once**, at
architecture time, on the *design artifact* (slices on the document) by
`architecture-design-reviewer` (Step 5 pairs every Produces/Consumes across all
slices; Step 8.5 catches cross-reference integrity). From that point on, every
checkpoint is per-card:

| Point | Agent | Holds at once | Cross-card view |
|---|---|---|---|
| `/architecture` step 14 (before cards exist) | `architecture-design-reviewer` | all slices, on the **document** | Yes — but on the design, and it goes stale as plans/code are produced |
| `/orchestrate` Wave 2 (Review) | `review-agent` | **one** plan | Weak: one binary clause (`review-agent.md:92`), runs per-card in parallel across mutating siblings; no authoritative global holder |
| `/orchestrate` Wave 4 (Audit) | `audit-compose-agent` | **one** card's diff vs **one** plan | None — tool list has no `list_workspace_cards` (`audit-compose-agent.md:5`); structurally sibling-blind |

**The gap (named standard): integration drift / interface skew between
independently-developed units.** The architecture pins contracts up front, but the
N plans, and then the N implementations, can each drift from the architecture in
locally-valid ways that are only *globally* inconsistent. Per-unit review and
per-unit audit cannot catch this because neither ever authoritatively holds two
units at once.

### Why per-card conformance does not transitively guarantee consistency

The architecture's Produces/Consumes are contract **names** with annotations
(`TokenIssued — consumed by AuthCard`), not interface signatures — architecture
deliberately does not pin code-level types. So:

- Card A can produce `{token}` and card B consume `{accessToken}` while **both**
  conform to `TokenIssued`. This signature skew is invisible to per-card audit.
- Shared allowed-touch files are explicitly permitted (with per-slice
  justification). Two cards independently editing one file can make semantically
  incompatible edits that each match their own plan.
- Dependency ordering / cycles across the *realized* cards live below the
  architecture's resolution.

These classes are exactly what the new cross-examiners check, and exactly what the
per-card waves and the design-time review structurally cannot see.

---

## 2. Two agents — separate jobs

The two checkpoints cross-examine **different artifacts** with **different tests**,
so they are two dedicated agents, not one parameterized agent.

| | Agent A | Agent B |
|---|---|---|
| **Name** | `cross-card-plan-reviewer` | `cross-card-implementation-auditor` |
| **Runs at** | Wave 2 (Review) opening sub-phase | Wave 4 (Audit) opening sub-phase |
| **Cards are in** | `review` | `audit` |
| **Examines** | every card's `plan` artifact | every card's `implementation_note` + actual diff |
| **Core question** | do the N plans wire together? | does the N realized code wire together? |
| **Route-back column** | `planning` | `implementation` |

### 2.0 Shared contract (both agents)

- **Read-only** with respect to source files. They do not modify code.
- **They run before the per-card agents and fail inconsistent cards themselves.**
  Each holds the whole column at once and, for every card it finds
  cross-card-inconsistent, submits that wave's FAIL verdict artifact on the card —
  `review_note` / `audit_report` with `## Verdict: FAIL`. The server routes the card
  on the verdict exactly as it routes any failure (`review`→`planning`,
  `audit`→`implementation`). No new server-side verdict or artifact type is
  introduced — they reuse the existing ones.
- **They do not move cards directly.** Tool lists **omit**
  `agentboard_update_workspace_card` (and `Edit`/`Write`/`Bash`); routing is
  verdict-driven and server-enforced. They **include**
  `agentboard_submit_workspace_artifact` (to write the FAIL verdict) and
  `agentboard_add_log_entry` (one audit-trail line per run).
- Because inconsistent cards leave the column before the per-card agents are spawned,
  **the per-card agents never run on them this round** — they run only on the cleared
  cards. No `cross_card_findings` plumbing into the per-card agents is needed; the
  per-card agents are unchanged.
- After failing the inconsistent cards, each agent **returns a summary message** to
  the orchestrator (failed / escalated / cleared cards + findings detail) so the
  orchestrator can re-query the column, report at the checkpoint, and surface
  escalations.
- Both activate `agentboard:expert-standards` as their first step.

Return-summary shape (identical schema for both):

```
## Cross-Card Consistency: <PASS | INCONSISTENT>
checkpoint: plan-review | implementation-audit

### Cards failed (FAIL verdict submitted → server routed back)
- <card>: <finding ids>

### Cards escalated (architecture change required — NOT failed; needs user)
- <card>: <finding id> — <why a re-run cannot fix it>

### Cards cleared (no cross-card finding — available for the per-card wave)
- [<card/id>, ...]

### Findings detail
- finding_id: CC1
  relationship: contract | shared-file | dependency | coverage
  contract_or_path: <contract name or file path>
  implicated_cards: [<card title/id>, ...]
  primary_card_to_route_back: <the card whose plan/impl must change>
  inconsistency: <what is mutually inconsistent, stated against the standard>
  evidence: <plan quote / diff quote / signature mismatch / codegraph result>
  suggested_resolution: <which side changes and how — executable; or "architecture change required: ..." when neither card's realization is the fault>
- ...
```

The FAIL verdict artifact the agent submits on each failed card carries the
implicating finding(s) with `suggested_resolution` as the Required fix / Recommendation.
`PASS` (no findings) → no card failed; orchestrator runs the per-card wave on all cards.

### 2A. `cross-card-plan-reviewer` (Wave 2)

**Model:** `opus`. **Inputs from orchestrator:** `board_id`, `agent_id`, `arch_path`,
and the set of card IDs currently in `review`.

**Checks (tightly scoped to cross-card-only — no per-card re-review):**

1. **Contract pairing at plan level.** For every contract a plan claims to Produce,
   a sibling plan Consumes it (and vice versa). Orphans are findings. Cross-checked
   against each arch slice's declared Produces/Consumes.
2. **Producer/consumer agreement.** Where plans specify the shape of a produced
   contract, the consuming plan's stated expectation is compatible.
3. **Shared-file collision intent.** Two plans intending to modify the same
   allowed-touch file — flag only when the planned changes are *incompatible* (not
   merely that they share the file; the arch may have justified the overlap).
4. **Dependency cycles** introduced at plan level beyond the declared `depends_on`.
5. **Collective coverage.** The union of plans still covers every arch contract — no
   contract silently dropped by all parties.

**Tools:** `Read, Glob, Grep, Skill,` `agentboard_get_board,`
`agentboard_list_workspace_cards, agentboard_get_card,`
`agentboard_list_workspace_artifacts, agentboard_get_workspace_artifact,`
`agentboard_resolve_artifact_prefix, agentboard_submit_workspace_artifact,`
`agentboard_add_log_entry,` `codegraph_get_dependencies, codegraph_get_dependents,`
`rag_search, rag_query_impact`. (No `update_workspace_card` — routing is verdict-driven.)

### 2B. `cross-card-implementation-auditor` (Wave 4)

**Model:** `opus`. **Inputs from orchestrator:** `board_id`, `agent_id`, `repo_root`,
`arch_path`, and the set of card IDs currently in `audit`.

**Checks (tightly scoped to cross-card-only — no per-card re-audit):**

1. **Signature-level interface fit.** Card A's *implemented* producer signature
   matches card B's *implemented* consumer call site. This is the thing per-card
   audit structurally cannot see — the core of this agent's job.
2. **Shared-file edit coherence.** Where two cards touched the same file, the
   combined result is coherent — no clobbering, no contradictory edits.
3. **Realized dependency order / cycles** in actual imports (via codegraph).
4. **Collective spec coverage in realized code.**

**Tools:** `Read, Glob, Grep, Skill,` `agentboard_get_board,`
`agentboard_list_workspace_cards, agentboard_get_card,`
`agentboard_list_workspace_artifacts, agentboard_get_workspace_artifact,`
`agentboard_resolve_artifact_prefix, agentboard_submit_workspace_artifact,`
`agentboard_add_log_entry,` `codegraph_scan, codegraph_get_dependencies,`
`codegraph_get_dependents, codegraph_get_change_impact, codegraph_list_files,`
`rag_search, rag_query_impact`. (No `update_workspace_card` — routing is verdict-driven.)

**Shared non-goals (both):** neither re-runs per-card review/audit concerns
(security, concurrency, single-card data integrity, etc.) — those remain owned by
`review-agent` and `audit-compose-agent`. Neither duplicates
`architecture-design-reviewer` (which checks the design document, not plans/code).

---

## 3. Orchestrator wiring (`skills/orchestrate/SKILL.md`)

Each cross-examiner runs as the **opening action** of its wave — a board-level
barrier before the per-card agents of that wave — and fails inconsistent cards
itself, so they route out of the column before the per-card agents are spawned.

- **Wave 2 (Review):** the orchestrator spawns `cross-card-plan-reviewer` first and
  waits. The reviewer submits a `review_note` FAIL on each cross-card-inconsistent
  card (server routes `review`→`planning`) and returns a summary. The orchestrator
  then re-queries `review` and spawns the per-card `review-agent`s only on the cards
  that remain (the cleared ones).
- **Wave 4 (Audit):** the orchestrator spawns `cross-card-implementation-auditor`
  first and waits. It submits an `audit_report` FAIL on each inconsistent card
  (server routes `audit`→`implementation`) and returns a summary. The orchestrator
  then re-queries `audit` and runs the two-phase per-card audit only on the cards
  that remain.

This honors both owner directives: routing happens **the same way failures always
do** — the existing `review_note`/`audit_report` verdict mechanism, server-enforced —
and the cross-examiner **writes to the card to fail it** rather than relying on the
per-card agent to do it. No card is moved directly (no `update_workspace_card`); no
new server route or artifact type is introduced.

Retry/cap policy: a cross-card-triggered FAIL counts against the existing per-card
retry cap (2) — a card the barrier keeps failing on re-entry exhausts the cap like
any repeated failure. Dependency propagation: when the barrier fails card B, it also
fails any sibling whose consistency depended on B's now-changing side, so the full
implicated set re-plans / re-implements together. Architecture-change escalations are
**not** failed (a re-run cannot fix them) — the barrier lists them in its summary and
the orchestrator surfaces them to the user.

### 3.1 No change to the per-card agents

The per-card `review-agent` and `audit-compose-agent` are **unchanged** — they never
run on an implicated card (it has already left the column), so they need no
cross-card input. (`review-agent` keeps its pre-existing cross-card binary-test
clause as a lightweight backstop; `audit-compose-agent` is untouched.) An earlier
draft threaded a `cross_card_findings` input into them; that is removed in favor of
the barrier failing cards directly.

---

## 4. Resolved design decisions (owner-directed)

- **Two agents, separate jobs** — `cross-card-plan-reviewer` (Wave 2, over plans) and
  `cross-card-implementation-auditor` (Wave 4, over implementations).
- **The barrier runs before the per-card agents and writes to the card to fail it.**
  Each cross-examiner submits the wave's FAIL verdict (`review_note` / `audit_report`)
  on each inconsistent card itself; the server routes it the same way any failure
  routes. The per-card agents run only on the cleared cards.
- **Routing:** the same way failures always do — existing verdict-driven server
  routing; no new verdict or artifact type; no direct card movement
  (`update_workspace_card` is withheld).
- **Coverage:** tightly scoped to cross-card-only — no overlap with per-card waves or
  with the design-time reviewer.
- **Points:** both respective points — the Review checkpoint and the Audit
  checkpoint.
- **Prescriptive:** each finding carries a `suggested_resolution` (matching the
  pipeline convention: `review-agent`'s Required fix, `audit-compose-agent`'s
  Recommendation, `architecture-design-reviewer`'s suggested_resolution), written into
  the FAIL verdict the barrier submits. An "architecture change required" resolution
  is escalated to the user instead of failing the card.
- **Per-card agents unchanged** — no `cross_card_findings` plumbing; the barrier fails
  cards directly, so the per-card agents never see an implicated card.
- **Audit trail:** one non-routing `agentboard_add_log_entry` line per run, plus the
  return summary to the orchestrator.

## 5. Files touched

- **New:** `agents/cross-card-plan-reviewer.md`
- **New:** `agents/cross-card-implementation-auditor.md`
- **Edit:** `skills/orchestrate/SKILL.md` — Cross-Card Consistency Barrier section,
  Pipeline Overview note, Spawn-step pointer, Agents table, retry policy, Wave 4
  step 0. The barrier fails inconsistent cards via verdict submission; per-card agents
  run on the cleared remainder.
- **Unchanged:** `agents/review-agent.md` and `agents/audit-compose-agent.md`. The
  per-card agents are not touched at all. The barrier fails inconsistent cards before
  they are spawned, so a per-card agent only ever runs on a cleared card and needs no
  knowledge that the barrier exists — telling it would couple agents the codebase
  deliberately decoupled. (`review-agent`'s pre-existing cross-card binary-test clause
  stays exactly as it was; on a cleared card it simply finds nothing.)
- **Edit:** `skills/agentboard/SKILL.md` — pipeline-summary note on the barrier.
- **No server changes.** No new artifact type, no new verdict, no MCP tool changes.

## 6. Status

All design decisions resolved (see §4). Implemented on branch
`session/2026-06-03-agentboard-consistency-audit-subagent`:

- `agents/cross-card-plan-reviewer.md` (new) — submits `review_note` FAIL on
  inconsistent cards, returns summary.
- `agents/cross-card-implementation-auditor.md` (new) — submits `audit_report` FAIL on
  inconsistent cards, returns summary.
- `skills/orchestrate/SKILL.md` — barrier section + wiring updated to fail-then-run-cleared.
- `skills/agentboard/SKILL.md` — pipeline-summary note.
- `agents/review-agent.md`, `agents/audit-compose-agent.md` — **unchanged** (all
  earlier additions reverted; verified byte-for-byte identical to HEAD).
