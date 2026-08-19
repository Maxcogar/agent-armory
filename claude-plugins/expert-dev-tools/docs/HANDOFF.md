# HANDOFF — expert-dev-tools

**Date:** 2026-08-19

## Current state (2026-08-19) — read this section; everything below it is historical

The remediation arc this document describes is **finished**: the plan was implemented, the
behavioral acceptance tier ran end to end with every criterion PASSING
(`.claude/expert/ACCEPTANCE-RESULTS-2026-08-17.md` in the repo root), and the five
owner-approved corrections shipped as **v0.3.0** (PR #60, merge commit `bb7107b`), reviewed to
PASS at zero findings across twelve rounds
(`docs/reviews/corrections-0.3.0-round-01.md` … `-round-12.md`). The plugin is deployed at
0.3.0 and the five corrected signatures are closed in
`~/.claude/plugins/data/expert-dev-tools/defect-history.json`.

### ⚠ STILL NEEDS CORRECTING — seven open defect signatures

The 2026-08-17 feedback sweep recorded **twelve** systemic-defect signatures. Five were
corrected in v0.3.0. The remaining **seven are still open** in the defect-history store — they
were diagnosed but never had corrections designed, approved, or implemented. As of 2026-08-19
no correction work for them exists anywhere:

| Open signature | Occurrences | Responsible component |
|---|---|---|
| instruction-reinterpretation — owner's stated request silently narrowed or replaced with assumed intent | 8 | orchestrator intake / expert-standard frame |
| premature-completion-claims — incomplete work declared complete; deliverables hedged; unresolved items relocated | 11 | expert-implement / expert-plan completeness gates |
| agent-quits-midtask — session stalls awaiting owner input instead of continuing the assigned work | 6 | expert-lifecycle continuation/halt policy |
| role-boundary-violations in review loop — reviewer prescribing fixes; orchestrator transcribing findings | 5 | expert-review skill + lifecycle dispatch contract |
| opining-without-reading-source — pattern-matching instead of verifying | 5 | expert-standard verification discipline |
| patching-instead-of-rederivation — corrections applied as downstream patches | 2 | expert-correct correction doctrine |
| skill-activation-missed — /expert-implement invoked but skill not activated | 2 | expert-implement command/skill wiring |

The next body of work on this plugin is correcting these seven: diagnose root cause per
signature (the evidence pointers are in each signature's `occurrences` entry in the defect
store), draft corrections for owner approval, implement, review to PASS, ship as v0.4.x, and
mark the signatures corrected. Note that some may already be partially mitigated by the v0.3.0
changes (e.g. the intake authorization axis bears on instruction-reinterpretation) — each needs
re-measurement, not assumption.

---

## Historical record below (2026-08-08, superseded)

## Where this stands

**The investigation is finished.** The previous handoff left the cause of the spec-review
non-convergence unestablished and told you not to plan a fix until it was. It is established now,
and `docs/investigate.md` §4–§7 carries it with evidence.

**A remediation plan exists and has been through three independent review rounds.** It is
`docs/plans/plan-expert-dev-tools-behavioral-remediation.md` — 26 steps, 23 test specifications,
31 verified factual claims. Every finding from all three rounds is applied.

**Nothing has been implemented.** The plan is a plan. No plugin source has changed.

## Read these, in order

1. **`docs/investigate.md`** — §4 through §7 are new and are the substance. §1–§3 stand as before
   except where §5d and §6 record owner rulings that closed them.
2. **`docs/plans/plan-expert-dev-tools-behavioral-remediation.md`** — the plan. Its §7 preamble
   states five maintenance rules; read them before editing any step, because violating rule 3
   produced six of round 3's ten findings.
3. **`docs/reviews/plan-behavioral-remediation-round-01.md`** and **`-02.md`** — the review record.
   Round 3's findings are applied but its record was not written to disk; its content is
   reconstructable from the plan's §14 "Review rounds" and the convergence arithmetic below.
4. **`docs/behavioral-tier-findings.md`** — still the record of the ten B-findings, now carrying
   five corrections. Two of its claims were retracted; do not cite the retracted text.

## Why the spec review loop did not converge — three mechanisms, all evidenced

1. **Six of nine agents had no documentation access.** Claude Code deduplicates MCP servers on
   command/URL. The standalone `context7` plugin declares a byte-identical
   `npx -y @upstash/context7-mcp`, so the plugin's own copy is **skipped at load** and
   `mcp__plugin_expert-dev-tools_context7__*` registers zero tools. Four agents name that dead
   namespace as their only documentation grant; two more hold none at all. None has
   `WebFetch`/`WebSearch`, so `expert-spec` step 3's "or the authoritative source" is unreachable
   too.
2. **The writer never patched — it re-authored.** Measured across all six spec-writer dispatches in
   the A-3 run: **eleven `Write` calls, zero `Edit` calls.** Every round replaced the document
   wholesale, so each reviewer met a fresh defect surface.
3. **The ruler changed between rounds.** Three of five reviewers read `expert-spec/SKILL.md` and
   graded against its process clauses; the two that did not graded against ISO/IEC/IEEE 29148. The
   correlation is exact. `expert-review/SKILL.md:111` already says the authoring artifact is *not*
   the quality standard — but no dispatch names what is, and the spec gate is the one gate with no
   upstream artifact to bind it.

Each round, a freshly re-authored document met a reviewer holding a different ruler, written by an
agent that could not verify anything external. Nothing was stable enough to converge on.

## Corrections to the record — do not cite the retracted text

- **The "rounds 4–5 stall" never happened.** Those rounds share no finding. R4: dispatch path
  resolves to nothing (Serious); `.claude/expert/` empty (Moderate); `scratch-note.txt` unaccounted
  for (Moderate). R5: quotation fidelity (Systemic); a contradiction inside the paragraph added to
  close R4's Moderate (Minor). The real phenomenon is a **fix-site regression**.
- **B9c's stated evidence is withdrawn.** It rested on that stall. The defect may be real; this run
  does not show it.
- **B7 was not masked.** Round 4's reviewer raised the path mismatch as Serious. It failed
  downstream: the finding went to the spec-writer, which does not own `specPath`.
- **B9a is retracted** by owner ruling. The observation (reviewers improvising fixes into the
  `standard` field) stands, re-diagnosed as reviewer overreach rather than a schema gap.
- **A-4a/A-4b diagnosis-quality PASSes are unverified** — the starved `diagnose()` dispatch is
  common to three of the four A-4 runs.

## Owner rulings — binding, do not re-open

- **Correction is re-derivation. Never patching, never re-authoring.** Both neighbours fail:
  re-authoring discards untouched sections; patching leaves the class unswept. The load-bearing half
  is the **class sweep**, and on an artifact carrying hand-maintained enumerations no sweep
  discipline converges — the surfaces have to be converted, not swept harder.
- **The six "flag once, then comply" clauses are deleted, not replaced.** There is no gap to fill.
- **The skill's artifact convention is the standard** (`spec-[kebab-case-name].md` under
  `docs/specs/`); the workflow consumes the agent's returned `artifact_path`.
- **B3 and B4 are resolved, not surfaced.** The correction doctrine bars *weakening* a verification
  mechanism, not touching one. A-8 is corrected to match spec F-14; `EVIDENCE` gains an
  observed/asserted split and a cross-entry consistency check, sampling constant unchanged.
- **`ROUND_CAP` and the binary verdict enum stay out of bounds.** The strictness of the Expert
  skills is not the suspect.
- The remaining plugin load errors are not relevant.

## What to do

**The plan-review loop ran rounds 4 through 8 and ended by tripwire** (records at
`docs/reviews/plan-behavioral-remediation-round-04.md` through `-round-08.md`; the recovered
round-03 record is also on disk). Trajectory 13 → 13 → 10 → 7 → 9 → 2 → 2 → 3; round 8 fired both
tripwire conditions. Eight rounds produced no finding of missing work, no wrong design decision,
and no build-order defect — the residual churn was the plan's hand-maintained bookkeeping surfaces,
and round 8's three open findings are errata (four numbers, one step label) recorded in its record.
**The owner approved the plan's substance 2026-08-09.** The plan was then executed in full — 26/26
steps, structural tier 191/191, unit tier 17/17, diff-vs-§5 exact at 27 files — and that
implementation is under its own independent review (`docs/reviews/implementation-round-01.md` when
persisted).

**Any further plan-review dispatch cites the output contract by commit.** The plan was authored
under the contract at `94a640a`; the working-tree contract has since been revised (generated-regions
regime, `docs/SKILL-CHANGELOG.md` entries 6 onward — the changelog is the authoritative
enumeration; this pointer deliberately names no upper bound) and by its own Applicability paragraph does not
govern plans authored before it. An unpinned dispatch would grade the plan against a contract it
structurally cannot satisfy.

Dispatch reviews to a **fresh** reviewer each round — **pointers only.** No summary of what changed,
no map of where to look, no defence of any decision. Author-supplied direction is what compromised
five of six rounds on the sister project.

After that, in order: owner approval of the plan, then implementation, then re-run the behavioural
tier from A-3 segment 1 (~1.5 M subagent tokens, ~2 h — an owner spend decision), then re-run A-4a
and A-4b whose diagnosis-quality results are unverified. Only then re-ask whether the round cap and
zero-findings bar need recalibration, measured against the repaired loop.

## Convergence arithmetic — read before deciding to keep looping

| Round | Findings | Closed | New | Regressions | Recurring |
|---|---|---|---|---|---|
| 1 | 13 (1C, 1 Sys, 6 S, 2 M, 3 Mi) | — | — | — | — |
| 2 | 13 (1C, 1 Sys, 4 S, 4 M, 3 Mi) | 11 | 5 | 6 | 2 |
| 3 | 10 (0C, 1 Sys, 7 S, 1 M, 1 Mi) | 8 | 3 | 3 | 4 |

Both tripwire conditions armed after round 2 and **disarmed after round 3** — 13 → 10 is a strict
decrease, and 6 new-plus-regression against 8 closed fails the other. The Critical class is gone.
Count findings from a review's **body**, never its header: round 1's header said 12 above a body of
13, and that record is the tripwire's baseline.

## One thing that is the owner's, not the next agent's

`docs/investigate.md` records it and the plan's **D-8** and **G-3** state it: the `expert-plan`
output contract mandates **nine** cross-reference surfaces restating the step set on a prose
artifact with no build step. Six of round 2's thirteen findings and five of round 3's ten were drift
in those surfaces. The documented fix — generate the derived surface rather than maintain it — is
unavailable inside a plan document, and the mitigation attempted (one-directional references plus a
maintenance rule) produced a rule the contract forbids and the document violated twenty-one times.

The class can be re-derived every round; it re-arms on the next edit. Closing it means adding a
machine-readable step declaration to `expert-plan/references/output-contract.md` from which §2, §5
and §12 are generated. That is a change to the planning skill, affecting every future plan, and it
is not the plan's to make.
