# Implementation review — expert-dev-tools behavioral-tier remediation

**Round:** 2 (Post-fix implementation review)
**Artifact:** two layers with distinct plans —
1. the original implementation: working-tree changes to the 27 files in §5 of
   `claude-plugins/expert-dev-tools/docs/plans/plan-expert-dev-tools-behavioral-remediation.md`;
2. the remediation of round 1's findings, per
   `claude-plugins/expert-dev-tools/docs/plans/plan-impl-remediation-r1.md` (11 steps as amended:
   S1–S9 plus S4b and S7b).

**Prior round:** `docs/reviews/implementation-round-01.md` — NEEDS FIXES (5 findings: 2 Critical,
1 Serious, 1 Serious-Systemic, 1 Minor).
**Reviewer:** independent (expert-review R1.2)
**Date:** 2026-08-09
**Environment:** Node v22.16.0, Windows 11, repo `Maxcogar/agent-armory`, branch
`claude/expert-dev-tools-remediation`.

---

## Scope and Inventory

### Round number

Round 2. This is a Post-fix review; its inventory is constructed by expert-review Step 2's
post-fix rule, not by the fix diff.

### Excluded from the artifact, by the dispatching instruction

`docs/HANDOFF.md`, `docs/SKILL-CHANGELOG.md`, `docs/plans/`, `docs/reviews/`,
`skills/expert-plan/references/output-contract.md`, `skills/expert-plan/scripts/`.

### Diff-scope caveat, verified rather than accepted

The dispatch states that a bare `git diff HEAD` conflates both layers plus separate in-flight
work, and attributes ~10 lines of `workflows/expert-lifecycle.js` to the remediation layer.
**Re-derived independently, not taken on report:** `git status --porcelain` scoped to the plugin
returns 28 modified + 29 untracked paths. Of these, the remediation layer's authorized touch set
(`plan-impl-remediation-r1.md` §5) is exactly three files — `workflows/expert-lifecycle.js`,
`tests/structural/check-structure.mjs`, and the created
`tests/fixture/workflow/broken-syntax-workflow.js` — and all three are present and modified/created
as specified. **No file outside the authorized touch set carries a remediation-layer change**, and
none of the six excluded paths was touched by it. The touch-set check is therefore clean in both
directions.

### Tool plan (Step 3)

Instruments available: `Bash` (node, git, grep, sed, perl, diff), `Read`, `Grep`, `Glob`, `Write`,
Clear Thought (`collaborativereasoning`). Claim-type mapping actually used:

| Claim type | Instrument | Used for |
|---|---|---|
| Literal-content ("line N says Z") | `Read` / `sed -n` at the specific line | F-1, F-3, F-5 closures; S7b harness |
| Absence ("no literal X survives in scope Y") | `grep` over a named scope, result count recorded | S4b hygiene; touch set |
| Behavioral ("this detector can fail") | **executed mutation testing** — defect injected into a byte-restored copy, tier re-run, output recorded | F-2, F-3, F-4 (a)(b)(c) closures |
| Test-suite state ("the tiers are green") | **executed** — both tiers run by the reviewer, assertion lines counted | throughout |
| Comment claims inside the artifact | re-derived from the adjacent `required`/`properties` | F-5 closure |
| Claims imported from prior documents (round-1 review, both plans, the ledger) | re-derived from current source with the instrument the underlying claim type requires | all five closures |

No instrument class was unavailable. Context7 was not required: this artifact integrates no
third-party library API. The only external-behaviour claims concern the Node.js runtime and the
ECMAScript grammar, both verified by direct execution on the pinned runtime — a stronger instrument
than a docs lookup for these claim types.

**Note on instrument choice for the systemic claims.** Round 1's F-2/F-4 are claims about whether a
detector *can fail*. `grep` can only establish that a detector's text exists; it cannot establish
capability. This review therefore verified every detector-capability claim by **mutation testing** —
injecting the exact defect the detector names into a copy of the source, running the real tier, and
recording which assertions went red. Nine mutations were run. Every mutation was followed by a
byte-level restore verified with `diff`; the working tree is confirmed identical to its pre-review
state (see Working-tree integrity below).

### File inventory

Constructed from all four post-fix sources.

**Source 1 — the prior review's full 27-file inventory (re-verified this round, not inherited)**

- [x] `workflows/expert-lifecycle.js` — Read at `:55–60`, `:74–112`, `:285–305`, `:83–101`; plus
  `grep -n` sweeps for `gateEscalation`/`verdict !== 'PASS'`/`NON_CONVERGENCE` (7 hits reviewed) and
  `^const \w+_RE` (3 hits). Executed as the subject of six mutations.
- [x] `tests/structural/check-structure.mjs` — Read at `:205–265`, `:440–505`, `:540–562`; executed
  in full 12 times (baseline, 9 mutations, 2 guard-neutralization probes).
- [x] `.mcp.json` — Grep-verified via executed T-3 assertions (`context7 still resolves
  @upstash/context7-mcp`, non-colliding invocation), both `ok` in this round's run.
- [x] The ten agent files (`expert-{acceptance,architect,closeout,corrector,diagnostician,`
  `implementer,planner,reviewer,spec-writer,verifier}.md`) — Grep-verified via the executed T-2b
  binding assertions and the ten executed `T-10 … names no artifact directory outside the
  convention` assertions, all `ok` this round.
- [x] The seven modified skills (`expert-spec`, `expert-architecture`,
  `expert-architecture-portable`, `expert-plan`, `expert-review`, `expert-standard`,
  `expert-mcp-overhaul`) — Grep-verified via the executed `T-14 no "flag once, then comply" clause
  survives in any of the 10 skills` and the four executed T-10 conditional-location assertions.
- [x] `skills/expert-correct/SKILL.md` — Grep-verified via the executed structural skill-count and
  frontmatter assertions.
- [x] `README.md`, `commands/expert.md`, `tests/ACCEPTANCE.md`,
  `tests/fixture/spec/spec-contradictory.md`, `docs/investigate.md`,
  `docs/behavioral-tier-findings.md` — Grep-verified via `git status --porcelain` (present, modified
  as expected) plus the executed T-17 (four assertions) and T-19 assertions covering
  `commands/expert.md` and the spec fixture.

**Source 2 — every file in the fix diff (the remediation layer's three files)**

- [x] `workflows/expert-lifecycle.js` — above.
- [x] `tests/structural/check-structure.mjs` — above.
- [x] `tests/fixture/workflow/broken-syntax-workflow.js` — **created**; Read in full (1–11).

**Source 3 — the fix-diff files' dependents**

- [x] Dependents = none. Verified by `grep`: `workflows/` contains exactly one file
  (`expert-lifecycle.js`); the plugin manifest `.claude-plugin/plugin.json` was Read in full and
  contains no glob, path, or scan directive referencing `workflows/` or `tests/`; a grep for
  `workflows|tests` over `.claude-plugin/` returns 0 hits. Nothing imports either changed file —
  `check-structure.mjs` consumes the workflow as text and by source extraction, never by `import`.

**Source 4 — the prior review's five findings, as closure items**

- [x] F-1, F-2, F-3, F-4, F-5 — each re-derived from current source and closed by execution; see
  Upstream Contract Verification and Prior-Findings Disposition below.

No `[ ]` remain. One file surfaced mid-pass and was added to the inventory before delivery:
`.claude-plugin/plugin.json`, needed to test whether the deliberately-unparseable fixture is
reachable by the plugin loader.

### Rigor waivers

None. No compression of this review's process was requested or applied.

### Working-tree integrity

This review executed nine source mutations and two test-file mutations. Every one was preceded by a
copy and followed by a restore verified with `diff`. Final state confirmed:
`diff` against the pre-probe copies of both `workflows/expert-lifecycle.js` and
`tests/structural/check-structure.mjs` reports **no differences**, and the structural tier prints
`STRUCTURAL TESTS PASSED` at exit 0. The artifact is byte-identical to the state delivered for
review.

---

## Summary

**This review returns PASS.** All five round-1 findings are closed against the standards they
originally named, and — the point that matters given round 1's central finding — each closure was
verified by *executing* the repaired detector against the defect it names, not by reading the fix.
The workflow now parses; both tiers are green (206 structural assertions, 17 unit assertions, exit
0); and the structural tier has been demonstrated capable of failing across all four classes it
previously could not detect. Reintroducing F-1's apostrophe turns `T-A2a` and `T-A2e` red;
reintroducing F-3's string-form pattern turns exactly the three `matches known-good` assertions red;
adding a new schema pattern without exemplars turns the tier red, which is what makes F-4's closure
a *class* closure rather than an instance closure; and semantic mutations to `parseLocation` and to
the fail-closed gate guard are caught by T-22 (4 FAILs) and T-23 (1 FAIL) respectively, proving the
behavioural assertions genuinely bind to the real source rather than passing over a dead module.
That last property is precisely what round 1 established was absent. The remediation layer stayed
strictly inside its authorized three-file touch set. No new defects were found.

---

## Upstream Contract Verification

Two upstream artifacts govern, and both are checked.

### A. `plan-impl-remediation-r1.md` — step-by-step

| Step | Status | Verification method |
|---|---|---|
| **S1** — replace T-A2a's oracle with a strict wrapped-body compile | **honored** | Read `check-structure.mjs:210–226`: `parsesAsWorkflowBody` present with the `"use strict"` directive and the `^export ` strip, exactly as specified; `check('T-A2a workflow: parses as a workflow body (strict)', …)` at `:225`. Line 209's `const wf` survives as the plan requires (Read). Executed: all six strict-mode early-error classes (octal literal, `with`, duplicate parameter names, `delete` of an unqualified identifier, assignment to `eval`, octal escape) are **rejected** 6/6 by the delivered oracle — the property that distinguishes it from the sloppy variant. |
| **S2** — negative fixture pinning capacity to fail | **honored** | Read `tests/fixture/workflow/broken-syntax-workflow.js` in full (11 lines): carries the `export` + top-level-`return` + unescaped-apostrophe shape and the do-not-fix header. Executed: `parsesAsWorkflowBody(fixture)` → **false**; `T-A2a-neg` prints `ok`. |
| **S3** — assert every schema `pattern` is a usable regex | **honored** | Read `check-structure.mjs:246–265`. Executed the tier's own extraction: `schemaNames` → `['LOCATION']`, `reDecls` → 3 declarations, pattern source `^[^\s:#]+(?::\d+(?:-\d+)?|#\S+)$`; 3/3 known-good match, 3/3 known-bad reject. |
| **S4** — whole-source compile before extraction | **honored** | Read the `T-A2e` assertion; confirmed by execution it prints immediately **before** the first T-22 line in tier output (positions 190 and 191), so it precedes and would explain any extraction failure. |
| **S4b** — allowlist + structural `goneFrom` predicate + T-A2f | **honored** | Read `check-structure.mjs:452–505`: `REPLACED_BY_STRENGTHENING` with one `was`/`now`/`why` entry, `supersededBy` map, `goneFrom` with **structural** presence (`here` from `check(` call position) and **no** `currentSrc.includes` disjunct, `norm` **not** widened, and the four T-A2f cases with `asCheck` runtime assembly. The dead `const present` binding is gone (`grep -c "const present"` → **0**), which the plan authorized. `grep -n "T-A2a workflow: valid JS syntax"` → **1 hit, `:459`**, the allowlist's `was:` field — data only, never in `check(` position, as the step requires. |
| **S4b Verification — Direction B** (neutralize `supersededBy`, array intact) | **honored — reproduced** | Executed: replaced the map construction with `new Map()`; tier printed `FAIL T-20 no check present at baseline was removed` **and** `FAIL T-A2f an allowlisted replacement whose new label IS present is not reported`. Restored; 206 `ok`. |
| **S4b Verification — Direction C** (evaporation: delete the replacement assertion) | **honored — reproduced** | Executed: commented out S1's `check('T-A2a workflow: parses as a workflow body (strict)'…)`; tier printed `FAIL T-20 no check present at baseline was removed` with `(removed: T-A2a workflow: valid JS syntax)`. This is the property the plan's first revision claimed and did not have; it now holds. Restored; 206 `ok`. |
| **S5** — demonstrate the repaired tier red pre-fix | **honored, re-demonstrated post-hoc** | The plan's S5 red run is a transient historical state this reviewer cannot re-observe directly (the corrections have landed). Its substance was **re-derived by mutation instead of accepted from the implementation report**: reintroducing F-1 produces `FAIL T-A2a` + `FAIL T-A2e`; reintroducing F-3 produces exactly the three `FAIL T-A2d … matches known-good` lines the plan predicted. The predicted failure set is therefore confirmed against the real defects, in both directions. |
| **S6** — F-1 delimiter fix | **honored** | Read `workflows/expert-lifecycle.js:57–59`: `"The authoring skill's process rules are not the standard — judge the artifact, not the " +` (double-quoted first fragment; second fragment unchanged single-quoted). Executed: whole file parses. |
| **S7** — derive `LOCATION.pattern` from a regex literal; gate `parseLocation` | **honored** | Read `:81–82`: `const LOCATION_RE = /^[^\s:#]+(?::\d+(?:-\d+)?|#\S+)$/` then `const LOCATION = { type: 'string', pattern: LOCATION_RE.source }`, both single-line as S3's extraction requires. Read `:293–302`: `LOCATION_RANGE_RE`, `LOCATION_SECTION_RE`, and `parseLocation` opening with `if (!LOCATION_RE.test(loc)) return null`. No `g` flag on any of the three (Read). |
| **S7b** — inject `reDecls` into the T-22/T-23 harness | **honored** | Read `:548–559`: `reDecls` is the **first** element of the `gateFns` preamble, with the comment recording why, and `declOf`/the extraction technique unchanged. Executed the negative case: constructing the harness **without** `reDecls` and calling `parseLocation` throws `ReferenceError: LOCATION_RE is not defined` — confirming the injection is load-bearing and not decorative. With it, `parseLocation` resolves correctly across all six specified inputs. |
| **S8** — correct the `EVIDENCE` comment | **honored** | Read `:91–101`. Old text absent (`grep` for `Additive: nothing is removed.` → **0 hits**). New comment present. Its two claims re-derived independently: `required` is `['claim_type','tool','citation','observed','asserted']` (`:93`, Read) and `result: S_STR` **is** still in `properties` (`:101`, Read). The corrected comment is accurate. |
| **S9** — both tiers green | **honored** | Executed by the reviewer: `node tests/structural/check-structure.mjs` → `STRUCTURAL TESTS PASSED`, exit 0, **206** `ok`, **0** `FAIL`; `node tests/unit/run-unit-tests.mjs` → `UNIT TESTS PASSED`, exit 0, **17** `ok`. |

**Plan §16 post-completion criteria.** Item 2 (no exported-surface change): `grep -n "^export"` over
the workflow → **1 hit**, `:1`, `export const meta = {`; the three new `_RE` constants are
module-local `const`s (Read), so the exported surface is unchanged. Item 3 (parse-error criterion,
scoped): the workflow now parses under the oracle and under the whole-source compile; the one
expected permanent parse error is the S2 fixture, by design and per D-7.

### B. `plan-expert-dev-tools-behavioral-remediation.md` — spot-check of the original layer

The dispatch asks for a spot-check of this layer; round 1 verified it in full and marked 20 of its
21 contract rows pass, the twenty-first ("Plan §1 goal — a plugin whose spec gate can converge")
being the F-1 failure. **That row now passes**: the module parses, and every gate assertion executes.

Spot-checks re-derived from source this round, chosen at the highest-stakes steps:

| Element | Status | Verification method |
|---|---|---|
| S15b — fail-closed gate rewiring (round 1 called this "the step whose failure is worst in the whole plan") | pass | Read `:515–517`, `:721`, `:734`, `:766`: the spec gate guards on `if (gate.verdict !== 'PASS')`, both caller sites route through `gateEscalation`, and `:734`'s comment states the fail-closed intent. **Executed a semantic mutation**: narrowing the guard to `if (gate.verdict === 'NEEDS_FIXES')` produces `FAIL T-23 both caller sites route non-PASS through the shared escalation builder`. The guard is genuinely enforced, not merely present. |
| S6b — detectors and their boundary behaviour | pass | **Executed a semantic mutation**: breaking `parseLocation`'s range-end handling (`end: r[3] === undefined ? +r[2] : +r[3]` → `end: +r[2]`) produces 4 FAILs across T-22's fix-site and boundary cases. The nine T-22 assertions bind to real behaviour. |
| S22 — nothing weakened | pass | Executed: all four T-20 assertions `ok`, including `every EVIDENCE field present at baseline survives (claim_type, tool, citation, result)` — which independently corroborates the F-5 closure's claim that `result` is retained. |
| T-22 / T-23 genuinely execute (the dispatch's explicit ask) | pass | Counted from executed output: `grep -c "^ok    T-22"` → **9**; `grep -c "^ok    T-23"` → **7**. Both match the plan's declared counts. A tier that aborted would print neither; these are present and, per the mutations above, sensitive. |

### C. Ledger status (scope context, not a finding here)

`docs/reviews/plan-impl-remediation-r1-open-findings-ledger.md` was Read in full. It records an
operator-directed stop of the *plan's* review loop with two open bookkeeping findings — F-K
(§11 registration class) and F-L (§14 attestation self-contradiction) — both against the plan
document's claim registry, and both explicitly recorded as having **no effect on what is built**.
Those findings are against `docs/plans/`, which this dispatch excludes from the artifact, and they
are already an accepted-risk decision at the workflow level. They are reported here as scope
context and are correctly **not** folded into this implementation verdict. This review independently
confirms the ledger's operative claim: steps S1–S9 (plus S4b, S7b) as executed carry zero findings.

---

## Critical & Serious Findings

**No Critical or Serious findings** — the full inventory was Read or Grep-verified per Compliance
Gate B, both tiers were executed to completion, nine adversarial mutations were run across the
syntax, schema-value, module-load, and semantic classes, and no violation of Critical or Serious
classification was observed.

---

## Systemic Patterns

**No systemic patterns.** Round 1's systemic finding F-4 ("the structural tier validates the
workflow as text, never as a loadable module or as evaluable schema") is closed at the class level,
not merely at its three named instances. Verified by the scans and mutations below.

| Scan / probe | Query or mutation | Result |
|---|---|---|
| Syntax oracle exists and can fail | Read `check-structure.mjs:220–226`; mutate F-1 back into the workflow | `FAIL T-A2a workflow: parses as a workflow body (strict)` — instance (a) closed |
| Oracle is not merely permissive | six strict-mode early-error sources through the delivered oracle | rejected **6/6** |
| Schema-value oracle exists and can fail | Read `:246–265`; mutate `LOCATION` back to the single-quoted string form | exactly `FAIL … matches known-good "spec.md:271-273"`, `… "spec.md:271"`, `… "plan.md#s7"` — instance (b) closed |
| **Class closure, not instance closure** | add a second schema `const NEWTHING = { type: 'string', pattern: '[a-z]+' }` with no exemplars declared | `FAIL T-A2d NEWTHING: exemplars are declared for this pattern` — a future pattern added without exemplars turns the tier red rather than passing unchecked |
| Module-load oracle exists and can fail | Read `T-A2e`; mutate F-1 back in | `FAIL T-A2e the whole workflow compiles before runGate is extracted from it` — instance (c) closed |
| Behavioural assertions bind to real source | mutate `parseLocation` range-end; mutate the fail-closed gate guard | 4 T-22 FAILs; 1 T-23 FAIL — the extraction harness is not passing over a dead or altered module |
| Pattern-declaration population | `grep -rn "pattern:"` over `workflows/`, `tests/`, `scripts/` | **1** hit, `workflows/expert-lifecycle.js:82`, Read in place — the discovered population matches what T-A2d checks |
| Regex-declaration population | `grep -n "^const [A-Za-z_]*_RE = /"` over the workflow | **3** hits (`LOCATION_RE`, `LOCATION_RANGE_RE`, `LOCATION_SECTION_RE`), matching `reDecls`' executed capture of 3 |

Eight probes, no surviving instance, and the class-level guard demonstrated firing. This is the
difference between closing named instances and closing the class — which the prior round's
Recommended Priority named as the discriminating requirement.

---

## Moderate & Minor Findings

**No Moderate or Minor findings** — verified by the same executed inventory and mutation set above,
plus the specific re-derivation of the F-5 comment against its adjacent `required` array (`:93`) and
`properties` block (`:101`), which is the one round-1 finding whose closure is a prose accuracy claim
rather than a behavioural one.

---

## Tentative Findings

**One, carried forward from round 1 rather than newly raised, with its gap unchanged.**

**T-1 (tentative, carried) — whether F-3's consequence was total gate failure or a dormant contract
defect.** This does not affect the current artifact: `LOCATION.pattern` is now correct either way,
and the fix is required under Design by Contract regardless of enforcement. What remains unverified
is whether the Claude Code agent harness enforces a `schema` object's `pattern` keyword on a
subagent's structured return, which is what would retro-classify round 1's F-3 as Critical rather
than Serious. *Verification that would close it:* one live `agent(...)` dispatch with
`schema: VERDICT_SCHEMA` returning `location: 'spec.md:1-2'`, observing whether the harness rejects
it — a paid behavioural experiment outside this review's read-only scope, and recorded as G-1 in the
remediation plan's §15. **This is a historical-classification question, not an open defect**, and it
does not affect this round's verdict.

---

## Observations

Three items were assessed against named standards and found **not** to violate one. They are
recorded here — with the assessment shown rather than asserted — so the reader can audit the
judgment instead of taking it, and so they are not mistaken for unexamined gaps.

- **`T-A2e` duplicates `T-A2a`'s oracle call on the same source.** Both invoke
  `parsesAsWorkflowBody` over the workflow's text, and both failed together under the F-1 mutation,
  so T-A2e adds no independent detection power. *Assessed against:* DRY. *Not a violation:* F-4's
  own remedy 2 specifies a whole-source compile sited immediately before the extraction harness, and
  the value is positional — it makes a load failure precede and explain any downstream extraction
  error rather than surfacing as unrelated breakage. Confirmed by execution that it prints
  immediately before the first T-22 line. The remediation plan reasoned this explicitly (S4, Impact)
  and accepted the redundancy for that reason.
- **A permanently unparseable `.js` file now ships inside the plugin**
  (`tests/fixture/workflow/broken-syntax-workflow.js`). *Assessed against:* package hygiene and the
  principle that distributed source should be loadable. *Not a violation:* deliberately-invalid
  fixtures are canonical practice in compiler and linter test corpora, and the file is unreachable by
  any loader — `.claude-plugin/plugin.json` was Read in full and contains no glob or scan directive,
  `grep` over `.claude-plugin/` for `workflows|tests` returns 0 hits, and `workflows/` contains
  exactly one file. The one real consequence is that `codegraph_scan` will report `parseErrors: 1`
  permanently; the plan anticipated this, scoped its completion criterion to the workflow
  specifically (§16 item 3), and rejected hiding the fixture with stated reasons (D-7).
- **T-A2d's pattern discovery matches single-line declarations only.** A schema declaring `pattern:`
  across multiple lines would go silently undiscovered. *Assessed against:* the regression-detection
  principle. *Not a violation:* the principle requires that a check be demonstrated able to fail, and
  T-A2d was demonstrated failing in two independent ways (the F-3 mutation and the unexemplified-
  pattern mutation). This is a disclosed coverage boundary with two mitigations in place — the
  `at least one schema pattern was found` assertion catches total extraction failure, and the
  exemplars-must-be-declared assertion catches a discovered-but-unexemplified pattern — and the
  proportionate alternative (a JavaScript parser dependency for one declaration) was weighed and
  rejected. It is registered as gap G-2 in the plan's §15 and in §13. Disclosed limits are auditable;
  they are not defects.

---

## What's Actually Good

Three items, each with the property named, the standard it is good by, and how the property was
verified. No item here rests on "it works."

**The oracle replacement is strictly stronger than what the prior review prescribed, and the
divergence is justified by execution rather than by preference.** *Property:* the delivered
`parsesAsWorkflowBody` rejects the F-1 defect, rejects all six ECMA-262 §11.2.2 strict-mode early
errors, **and** accepts the file's legitimate top-level-`return`-plus-`await` shape — a combination
none of the three obvious candidates achieves. Round 1's own recommended fix
(`--input-type=module --check`) fails the third property. *Standard:* the regression-detection
principle (`skills/expert-plan/references/testing-standards.md:91`) in both directions — a check
that cannot pass on correct code fails as surely as one that cannot fail on broken code.
*Verified:* Read of the oracle at `check-structure.mjs:220–224`; executed the six strict-mode
classes through it (**6/6 rejected**); executed it against the real workflow (accepts) and the
fixture (rejects). A remediation that improves on its own review's prescription, and grounds the
departure in executed results, is doing the harder and more correct thing.

**The `goneFrom` guard's presence test is structural rather than textual, and both re-arm
directions were reproducible.** *Property:* a baseline label counts as present only in `check(` call
position, so the allowlist cannot be silently switched off by its own `was:` field appearing in the
file as data — and the exemption evaporates if the replacement assertion is itself deleted.
*Standard:* the regression-detection principle applied to detector surgery — an edit to a detector
must preserve the detector's failure mode. *Verified:* Read at `:479–487` confirming the
`currentSrc.includes` disjunct is absent and `norm` is unwidened; `grep` confirming the baseline
label appears exactly once and only as data (`:459`); and **two executed neutralization probes**,
Direction B (empty `supersededBy` → T-20 red) and Direction C (replacement deleted → T-20 red, with
the offending label logged). This is the riskiest edit in the remediation — weakening the assertion
whose job is to notice silent weakening — and it is the one carrying the most evidence.

**The single-source derivation of the location grammar is real, and the test harness derives from
the same source rather than copying it.** *Property:* `LOCATION.pattern` is `LOCATION_RE.source`,
`parseLocation` is gated on the same literal, and the T-22/T-23 harness obtains the three regex
declarations by **extracting them from the workflow's own text** (`reDecls`) rather than restating
them — so the schema grammar, the detector grammar, and the test harness's grammar cannot drift into
three hand-kept copies. *Standard:* single-source-of-truth / generation over duplication, named as
governing in the upstream plan §3 claim 27 ("scripts that *generate* a derived surface are the
fix"). *Verified:* Read at `:81–82`, `:293–302`, and `:548–556`; executed the harness **without**
the injection and observed `ReferenceError: LOCATION_RE is not defined`, confirming the derivation
is load-bearing rather than decorative; executed the tier's own extraction and confirmed it captures
exactly the three declarations. Round 1's F-3 recommendation asked for the instance to be fixed by
removing the class; that is what was delivered.

---

## Convergence Record

- **Round number:** 2 (matches Scope and Inventory).
- **Trajectory:** R1: 5 findings (2 Critical, 1 Serious, 1 Serious-Systemic, 1 Minor) → **R2: 0
  findings**.
- **Flow counts for this round:** prior findings **closed: 5** (F-1, F-2, F-3, F-4, F-5); **new: 0**;
  **regressions: 0**. Provenance per Step 9: every prior finding was re-derived from current source
  and closed against its originally named standard; no finding carries `new` or `regression`
  provenance because the finding set is empty.
- **Tripwire evaluation — NOT FIRED, arithmetic shown.**
  - Condition (a) — new + regression ≥ closed, for two consecutive Post-fix rounds:
    this round, `new (0) + regression (0) = 0`, `closed = 5`; `0 ≥ 5` is **false**. The condition
    fails on this round, so it cannot hold for two consecutive rounds. **Not fired.**
  - Condition (b) — total findings has not strictly decreased, for two consecutive Post-fix rounds:
    `R1 = 5`, `R2 = 0`; `0 < 5`, so the total **did** strictly decrease. **Not fired.**
  - Neither condition holds. This is the first Post-fix round, and it converged to zero.

---

## Open Findings Ledger

Not applicable to this review. No operator has directed a stop of *this* implementation review loop
with open findings, and this round has no open findings to record. (The separate ledger at
`docs/reviews/plan-impl-remediation-r1-open-findings-ledger.md` governs the *plan document's* review
loop, is outside this artifact's scope, and is reported as context in Upstream Contract Verification
§C.)

---

## Recommended Priority

Nothing to fix. The tripwire did not fire, so no foundational rework is indicated. What follows is
sequencing for the work this PASS unblocks, ordered by engineering value.

1. **The Post-completion behavioural re-run** (upstream plan §16, priced at ~1.5M subagent tokens)
   is now worth running and was not before. Round 1's blocking objection was that it would fail at
   module load and buy no information; that objection is discharged — the workflow parses, both
   tiers are green, and the gate logic is demonstrably executable. This is the owner's call on
   budget, not a correctness gate.
2. **Close tentative finding T-1 (plan gap G-1) if the historical classification matters.** One live
   `agent(...)` dispatch with `schema: VERDICT_SCHEMA` would establish whether the harness enforces
   `pattern` on subagent returns. It changes nothing about the current code — `LOCATION.pattern` is
   correct under either answer — so this is worth doing only if the owner wants round 1's F-3
   severity settled for the record. Cheapest folded into the §16 run rather than dispatched alone.
3. **On the next commit, the S4b allowlist entry becomes inert by design.** T-20's baseline is
   `git show HEAD`, so once these changes are committed the superseded label leaves the baseline and
   `REPLACED_BY_STRENGTHENING` stops being consulted. It is correctly retained rather than deleted —
   it is inert when unused and carries the reason for the substitution where a future reader meets
   it. No action needed; recorded so a future maintainer does not read the entry as live coverage.

---

Verdict: PASS
