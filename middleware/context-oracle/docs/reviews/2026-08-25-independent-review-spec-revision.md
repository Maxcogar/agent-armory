# Independent adversarial review — spec revision (2026-08-25)

**Target:** `docs/specs/spec-context-oracle.md` after the 2026-08-25 correctness pass
(fake-deferral removal + external-premise verification).
**Reviewer:** independent subagent (not the author), attacking on four axes —
owner-attribution, hollow decisions, expert-spec gates, downstream usability.
**Outcome:** 14 findings; **all applied** (this file is the closure record).
Written once; do not edit.

## Gate B — confirmed genuine
The reviewer spot-checked the author's verification claims against primary sources and
found no discrepancy: `node:sqlite` unflag versions (v22.13.0 / v23.4.0), MCP Sampling
deprecation via SEP-2577, and the Claude Code hooks contract (31 events; `PreToolUse`
`additionalContext` independent of `permissionDecision`; `Stop`/`SubagentStop`
continuation + `last_assistant_message`; `PostToolUseFailure`/`PermissionRequest` real;
`SessionEnd` 1.5s→60s budget). The §9 verification is real, not asserted.

## Findings and closure

| # | Sev | Finding | Fix applied |
|---|---|---|---|
| C1 | Critical | Language coverage attributed to Max via `[OL:#3]` — a citation key that never existed in the ledger — with a direct quote put in his mouth. Invented-owner-claim-with-manufactured-provenance, the exact pattern the project exists to stop. | Removed the attribution and the key. C-6/D-15 re-grounded on architect judgment `[D-15]` + `[OL-C1]`. Max's real words recorded PENDING as **OL-P1** in `OWNER-LEDGER.md`; spec no longer depends on them. |
| C2 | Critical | "Young / thin-history repos are Max's common case" cited to OL-6/OL-11, neither of which mentions repo age. Load-bearing (it excused the thin-history limitation). | Removed everywhere (§1, FR-A6, §13). Thin-history *capability* kept, grounded on the corpus-floor design `[D-7,D-8]`, not an owner claim. |
| S1 | Serious | Blocking model had no mission-stated job; a block delivers no fact, yet the spec folded it under the mission and implied it passed the mission-phrased collapse test. | Added an explicit reconciliation (§1 + §8): blocking is a **second owner-set objective** standing *beside* the mission, justified in owner-objective terms; D-32 job reworded. |
| S2 | Serious | Context-oracle `CLAUDE.md` "No blocking. Every intervention is an advisory whisper" was stale against OL-C2/C3 (2026-08-16) and read first by every new agent. | Updated the "Decisions are locked" section: reactive blocking IS in scope in two cases; pre-emptive gate still rejected; ledger is authoritative. |
| S3 | Serious | FR-A2g headlined "test not run" — a fact the agent already has — failing the spec's own marginal-value bar (P5/FR-A1). | Reframed so the headline fact is the **covering-test mapping** the agent lacks; run-state is the secondary observation. |
| S4 | Serious | FR-A2l/§13 cited `[OL-9]` (which says "advisory only") as co-authority for a **block**. | Block cited to `[OL-C3]` alone; OL-9 retained only as the *superseded* advisory origin. |
| M1 | Moderate | "Small/personal/non-primary" stapled to the most coercive capability without reconciliation. | Distinguished *priority of purpose* (non-primary) from *severity of mechanism* (blocking is high-stakes) in FR-A2k and §11.4. |
| M2 | Moderate | "The bar is the only thing that decides whether the oracle speaks" contradicted by dedup (FR-A4/FR-D5). | Scoped to "no volume/count/budget cap"; dedup explicitly still applies. Fixed FR-A5 and AC-3. |
| M3 | Moderate | Closing "every premise re-verified 2026-08-25" contradicted the §9 table (NODE-SQLITE/ROSE 2026-08-16; MSR via HERZIG). | Closing rewritten to match the table. |
| M4 | Moderate | AC-16 "does not converge to zero while value remains" — no operational pass/fail. | Given a bounded fixture (injected false-fires → re-admission within N events/M sessions; restored-value fixture → rate recovers above zero). |
| m1 | Minor | OL-C2 quoted as "goddamn test" (ledger: "tests"); elision unmarked, though OL-C2 is verbatim-required. | Quoted exactly with the elision marked. |
| m2 | Minor | §10 pinned the exact `claude -p …` command — one implementation only (abstraction-test fail). | Demoted to illustrative; the requirement is the piggyback-with-no-credentials property. |
| m3 | Minor | Self-narration in front-matter and closing (document describing its own revision history). | Trimmed to what a builder needs. |
| m4 | Minor | NF-1's "cold spawn ~5.3s" carried no source. | Marked an assumption validated by the Phase-0 spike CLAUDE.md mandates. |

## Axes with no findings
- Gate B external-factual-accuracy (beyond M3's date-consistency nit) — clean.
- Gate A framing / threat-order — clean beyond C1/C2; §7.1 precedes §7.2; §2.3 gives explicit N/A.
