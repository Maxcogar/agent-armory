# Plan Review — Round 1

**Artifact:** `docs/plans/plan-expert-dev-tools-behavioral-remediation.md`
**Date:** 2026-07-31
**Reviewer:** independent, fresh; dispatched with artifact + input pointers only, no author-supplied
checklist or direction
**Verdict:** NEEDS FIXES — 13 findings (1 Critical, 1 Systemic, 6 Serious, 2 Moderate, 3 Minor)
**Disposition:** all 13 applied

> **Count corrected 2026-07-31, after round 2.** This record originally stated 12 findings and 5
> Serious above a body enumerating 13 — C-1, SYS-1, S-1…S-6, M-1, M-2, Mi-1, Mi-2, Mi-3, with SYS-1
> carrying Serious severity alongside the six S-numbered findings. The body was always right; the
> header was not. This matters beyond bookkeeping: **this record is the baseline the convergence
> tripwire is computed from**, and R1 = 13 → R2 = 13 is one of the two conditions now armed.

---

## Findings

### C-1 (Critical) — the designated load-bearing claim does not verify, and current source contradicts the generalization built on it

- **Standard:** `expert-plan` output contract §11 ("Memory of a file read earlier in the session is
  not a current verification") and Gate C ("File paths and function names are confirmed against the
  current codebase, not assumed").
- **Location:** §11 claim 27; consumed by D-1, S4, S5, S6b, §13.
- **Premise evidence:** `mcp-servers/aps-fusion-mcp-server/HANDOFF.md` read in full — no section
  named "Process record — why twenty rounds, and what to keep" exists. Repo-wide
  `grep -rn "patch-style" --include=*.md` → 3 hits, all inside the plan itself. `git log` +
  `git show` per commit: the quoted text existed verbatim at `633fe9b` lines 67–79 and at
  `755bf9b`, removed by `cd2f27b`; `git merge-base --is-ancestor cd2f27b HEAD` → true.
- **Explicitly not fabrication:** the quotes were accurate when written; the file was rewritten the
  same day.
- **Substantive half:** the replacement content records the same project's *next* phase running six
  rounds under the re-derivation discipline (9 → 10 → 9 → 8 → 8 → 11), the tripwire firing at round
  6, no PASS ever returned, and "three of round 5's findings manufactured by round 4's fixes, three
  of round 6's by round 5's" — a failure mode D-1's table asserted did not exist.

### SYS-1 (Systemic, Serious) — the workflow is changed to expect agent behaviour no step writes into the agent's governing document

- **Standard:** Design by Contract (Meyer) — named in the plan's own §3 registry for S14, then
  violated in the mirror direction three times.
- **Instances:** (1) S5 specifies `agents/expert-corrector.md` as frontmatter only, no body, while
  all nine existing agents carry a role body and a skill-invocation-first instruction;
  (2) S6b requires `sections_rederived` and nothing obliges the corrector to emit it; (3) S20
  dispatches a fourth job to `expert-verifier`, whose body states "one of three mechanical jobs".
- **Root:** the plan treats the workflow script as the sole locus of behaviour change and agent
  markdown as configuration — encoded in §5's own heading, "Modified — agents (6 tool grants + 1
  contract text)".

### S-1 (Serious) — S6b's control cannot fire, and its test passes on a stub that hides this

- **Standard:** Design by Contract; `testing-standards.md` fake-test catalog (the double supplies
  the input whose real-world absence is the defect).
- **Premise evidence:** `PHASE_SCHEMA.required` is `['status']` only; no step edits
  `expert-corrector.md` after S5 creates it; S4's skill content and S6's dispatch prompt name no
  reporting duty. `lastRederived` is therefore `[]` on every production round while T-22 passes.

### S-2 (Serious) — the new verdict is unhandled by every caller, and the fall-through reads as PASS

- **Standard:** output contract Gate C zero-tolerance; fail-safe defaults (architecture names this
  for D6 STOP routing at `arch:750`).
- **Premise evidence:** `expert-lifecycle.js:335` — `if (gate.verdict === 'NON_CONVERGENCE')`;
  `:488` — `if (gate.verdict !== 'NON_CONVERGENCE') return null`. Both exact-string. §5's workflow
  annotation omits S6b and no step touches either line.
- **Consequence:** at the spec gate, control falls through to `:343–345` and returns `GATE.intent` —
  the owner is told the spec passed independent review.

### S-3 (Serious) — S6b executes seven steps before the dependencies it declares

- **Standard:** output contract §7 (ordered steps); the plan's own §9 checkpoint model.
- **Premise evidence:** document order places S6b at position 7, S12/S13 at 13/14, while §6 claims
  F-3 is "ordered early". Consequences: a three-argument `diagnose()` call while `diagnose` is
  two-parameter; a ninth call site absent from S13's eight-row table and S15's assertion.

### S-4 (Serious) — S8 is unexecutable at the implementation gate, and claim 9 misreads the plan's own source

- **Standard:** output contract Gate C; §11 premise-correctness.
- **Premise evidence:** `grep -c "named standards"` → 3, at `:330`, `:359`, `:377`. Line `:410` read
  verbatim — phrase absent. `docs/investigate.md` §5c records that gate's cell as "not mentioned",
  distinct from the other three rows' "no"; the plan flattened the distinction.

### S-5 (Serious) — B9c is claimed covered by S6b, which implements a different control

- **Standard:** output contract §2 (coverage reconciliation; exclusions require an approved register
  entry).
- **Premise evidence:** B9c is "a finding the writer cannot act on has no escape hatch"; S6b's
  trigger requires the corrector to *have* edited. Post-S6b `runGate` reads only
  `out.sections_rederived`, so a corrector returning `status: 'halted'` is discarded and the loop
  runs to `ROUND_CAP`.

### S-6 (Serious) — §5 omits files the steps modify, and T-21 fails by construction

- **Standard:** output contract §5; ISO/IEC/IEEE 29148:2018 §5.2.6 (Consistent), named in the plan's
  own §3.
- **Premise evidence:** S1 and S23 write into `README.md`; `find -iname "readme*"` over the plugin
  → 0 results. `tests/ACCEPTANCE.md` is simultaneously "Surfaced, not modified" (§5) and modified
  (S23). T-21 asserts the diff equals §5's list in both directions and fails on correct execution;
  §5 has four sublists and T-21 names none of them.

### M-1 (Moderate) — the reviewer's WebFetch/WebSearch denial is attributed to spec F-3, which does not contain it

- **Standard:** output contract §11 / Gate C — a test file's own label is the test author's
  attribution, not the spec's text.
- **Premise evidence:** spec F-3 (`:155–158`) is "Context provisioning… Reviewer packages are
  blinded and mechanical-only"; no tool denial. `grep -i "webfetch\|websearch"` over the spec → 2
  hits, neither naming either tool. The denial is at `arch:863`, a D5/D11 refinement per owner
  directive.
- **Note:** the design decision is correct and survives; only the traceability and its amendment
  path were wrong.

### M-2 (Moderate) — §5 omits S6b from the workflow's step annotation

- **Standard:** ISO/IEC/IEEE 29148:2018 §5.2.6 (Consistent).
- **Premise evidence:** §5 lists `workflows/expert-lifecycle.js (S6, S8, S9, S10, S12, S13, S17,
  S18, S20)`; S6b makes three edits to that file. Shares a root with S-6.

### Mi-1 (Minor) — two §11 entries carry counting errors, one self-contradictory

- **Standard:** output contract §11 (the premise-correctness proof).
- **Premise evidence:** `wc -l` → 493, not 494. `grep -c artifact_path` → 1, not 2; the entry's own
  enumeration describes one while asserting two. `:336` is the call, `:337` is `delta.phase`, `:338`
  is `lastFindings` — two lines after, not one.
- **Note:** both substantive conclusions are correct; the audit trail degrades, not the actions.

### Mi-2 (Minor) — "one of four mandated channels" undercounts what the code supplies

- **Standard:** output contract §11 premise-correctness.
- **Premise evidence:** the prompt carries both the failure description and the ledger; `:310`,
  `:396`, `:448` interpolate the failing output. `investigate.md` states evidence "is omitted at
  five of eight", consistent with three sites supplying it. The plan's own S13 contradicts the claim
  two sections later.

### Mi-3 (Minor) — S5's agent file content omits the YAML frontmatter delimiters

- **Standard:** output contract Gate A (executable without on-the-fly decisions).
- **Premise evidence:** `check-structure.mjs:14–16` matches `/^---\r?\n…\r?\n---\r?\n/` and returns
  `null` otherwise; `:57` then yields `fm = {}`, failing `:61`, `:63` and `:65`. All nine existing
  agents are `---`-delimited with `skills:` before `tools:`.

## Tentative findings

None. Every candidate finding's premise was verified. §11 claim 25
(`codegraph_get_dependents` → 0) could not be checked with the plan's own instrument but was
confirmed by an equivalent complete content scan and is **correct** — not a finding.

---

## Disposition — all 12 applied, by class

| Class | Findings | Mechanism added, not only the instances |
|---|---|---|
| Claim imported from a secondary source without re-derivation | C-1, S-4, M-1, Mi-2 | §11 citation preamble: in-plugin files by path+lines, in-repo files by **commit**, out-of-VCS files by date with that stated, docs by library ID or URL + date |
| Cross-reference drift | S-6, M-2 | D-8 + §7 maintenance rules 1–4: §7 originates, references run one way, editing a step re-derives the restating sections, a finding in any of them is a class signal |
| Agent contract not paired with a workflow change | SYS-1, S-1 | §7 maintenance rule 5 + S7's dispatch↔job pairing assertion |
| A new state not swept through its consumers | S-2, S-3 | S15b wires both new `runGate` states at both caller sites; the dependency splits at that boundary |
| Counting errors | Mi-1 | every numeric claim independently re-executed |

Individual landings are tabulated in the plan's §14 "Review rounds".

## Convergence record

- **Round 1:** 12 findings. No prior round.
- **Tripwire:** not applicable at round 1 (requires two consecutive rounds).
- **Author's post-fix work is unreviewed.** Round 2 is owed, and must go to a **fresh** reviewer —
  round 1's reviewer holds these findings and the author's responses, and would check whether its
  notes were addressed rather than review the artifact.
