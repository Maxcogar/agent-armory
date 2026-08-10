# Plan review — implementation remediation, round 1

**Round:** 1 (plan review, first round)
**Artifact:** `claude-plugins/expert-dev-tools/docs/plans/plan-impl-remediation-r1.md` (working tree)
**Governing output contract:** `claude-plugins/expert-dev-tools/skills/expert-plan/references/output-contract.md` **at commit `94a640a`** (pinned by the dispatch; the working-tree copy does not govern).
**Upstream artifact:** `claude-plugins/expert-dev-tools/docs/reviews/implementation-round-01.md` (NEEDS FIXES; F-1 … F-5).
**Reviewer:** independent (expert-review R1.2)
**Date:** 2026-08-09

---

## Scope and Inventory

### Round number

First-round review of this plan. Convergence tracking begins at round 2.

### Tool plan (Step 3)

Instruments available this session: `Bash` (git, node, grep), `Read`, `Grep`, `Glob`, `Write`, CodeGraph (`codegraph_scan`, `codegraph_list_files`, `codegraph_get_dependents`), Clear Thought.

| Claim type | Instrument | Used for |
|---|---|---|
| Literal-content ("line N says Z") | `Read` / `sed -n` at the specific line | F-A, F-D, F-E, and the plan's §11 claims 1, 8, 10, 11, 13, 14, 15 |
| Absence ("nothing asserts X", "no doc names Y") | `grep` over a named scope, query and count recorded | F-C, F-D |
| Behavioral (parser/oracle accepts or rejects X) | **executed** — `node --check`, `node --input-type=module --check`, `new Function` in the scratchpad | F-B, and the plan's §11 claims 2–6, 9 |
| Structural / blast radius | `codegraph_scan` + `codegraph_list_files` + `codegraph_get_dependents` | F-C, and the plan's §5 dependents claim |
| Claims imported from prior documents (the review, the plan's own §11) | re-derived from source or re-executed | throughout |

No instrument class was unavailable. Context7 was not required: the plan integrates no third-party library API — every external-behavior claim is about the Node.js runtime and the ECMAScript grammar, both verified by direct execution, which is a stronger instrument than a docs lookup for these claim types. All executions ran in the session scratchpad against copies; **no write mode was run against repository files**, and the only repository write is this review record.

### File inventory

Constructed per Step 2's plan-review source: the artifact, its upstream review, the pinned contract, plus every file the plan's §5 names and every file its §11 claims cite.

- [x] `claude-plugins/expert-dev-tools/docs/plans/plan-impl-remediation-r1.md` — Read in full (1–495).
- [x] `claude-plugins/expert-dev-tools/docs/reviews/implementation-round-01.md` — Read in full (1–537).
- [x] `skills/expert-plan/references/output-contract.md` **@ `94a640a`** — Read in full via `git show`.
- [x] `workflows/expert-lifecycle.js` — Read at `:40–60` and `:74–100` (`cat -A` codepoint-safe dump); `:287–296` Read; `grep -n "^export |^import |^const .*_RE = "` (1 hit, `:1`); `grep -n "^return|^const .* = await"` (2 hits, `:459`, `:688`); 761 lines total (`grep -c ""`). Full copy parsed in the scratchpad.
- [x] `tests/structural/check-structure.mjs` — Read at `:200–230` and `:425–460`; `grep -n "wfSrc"` (19 hits); `grep -n "readdirSync|glob|fixture"` (6 hits); `grep -n "STRUCTURAL TESTS|function check"` (1 hit, `:543`).
- [x] `tests/fixture/` — directory listing (`agents/ project/ spec/ transcripts/`; no `workflow/`).
- [x] `tests/ACCEPTANCE.md` — `grep -n "T-A2a|valid JS|syntax"` → 1 hit at `:8`, read in place.
- [x] `docs/review-round-1.md` — surfaced mid-pass by the doc sweep (`:115` names the `node --check` gate); Read at `:105–125`. Inventory amended and verified before delivery, per Step 2.
- [x] `README.md` — `grep` hit at `:24` and `:55`, both Read in place.
- [x] `tests/unit/run-unit-tests.mjs` — Grep-verified: `grep -n "readdirSync|fixture"` → 0 hits (no fixture globbing).

No `[ ]` remain.

### Rigor waivers

None. No compression of this review's process was requested or applied.

---

## Summary

**This review returns NEEDS FIXES.** The plan is strong work and is right about the thing that matters most: it refuses the upstream review's own recommended fix for F-2 on executed evidence, it orders the tier repair ahead of the source corrections, and it makes S5's red demonstration a hard halt gate rather than a note. I re-executed every load-bearing Node claim independently and all of them hold — `node --check` exits 0 on the defective file, the module goal rejects the F-1-patched copy with `Illegal return statement`, the wrapped-async-body oracle rejects the current workflow and accepts the patched one, S3's extraction regexes match the declarations S7 writes, the derived `LOCATION.pattern` partitions all six exemplars correctly, and S5's expected failure set is exactly five with the banner format the tier actually prints. The findings below are not about that spine. They are that the repaired syntax gate is still measurably weaker than the goal it claims to model (it compiles in sloppy mode, so six classes of strict-mode syntax error pass it), that the plan's own §16 completion check will fire on the fixture the plan itself creates, and — the class finding — that two load-bearing factual assertions in the Plan section carry no §11 entry at all, including the premise about harness execution shape on which the entire oracle choice rests.

---

## Upstream Contract Verification

Two upstream contracts govern: the pinned output contract (structure and gates) and the five findings of `implementation-round-01.md` (coverage). Each check records its verification method.

### Findings coverage

| Finding | Plan's disposition | Status | Verification method |
|---|---|---|---|
| F-1 (Critical) unescaped apostrophe | S6 — change the delimiter | **covered** | Read of the plan's S6 against `workflows/expert-lifecycle.js:57–59` (`cat -A` dump); executed the patched form → parses. |
| F-2 (Critical) syntax gate incapable of failing | S1 (new oracle) + S2 (negative fixture) | **covered, with F-B** | Executed all four oracle behaviours in the scratchpad; the gate becomes capable of failing. F-B records the residual strictness gap. |
| F-3 (Serious) `LOCATION.pattern` escapes consumed | S7 (derive from a regex literal) + S3 (evaluate every pattern) | **covered** | Executed: applied S7's line-81 replacement to a copy, ran S3's extraction verbatim → `source = ^[^\s:#]+(?::\d+(?:-\d+)?|#\S+)$`, 3/3 good match, 3/3 bad reject. |
| F-4 (Serious, Systemic) tier validates only as text | S1 (a), S3 (b), S4 (c) | **covered** | Read of S1/S3/S4 against the review's three enumerated instances; each instance maps to a step, and S3 closes the class by discovery rather than by naming `LOCATION`. |
| F-5 (Minor) `EVIDENCE` comment overstates | S8 | **covered** | Read of `workflows/expert-lifecycle.js:82–99` — comment at `:89`, `required` at `:90` lacking `result`, `result: S_STR` present in `properties`. The plan's replacement text is accurate. |

All five findings map to steps. No finding is silently narrowed.

### Pinned output contract — structure and Gate C items

All sixteen sections are present (Read of the plan's headings 1–16 against the contract's enumeration). Gate C items checked individually; the failures are the findings below.

| Contract item | Status | Verification method |
|---|---|---|
| Sixteen sections present; "if applicable" sections with content present | pass | Read of both documents. |
| Every step has a **Source** annotation | pass | Read of S1–S9; all nine carry one. |
| Every non-trivial step has all four Gate 3 parts | pass | Read of S1, S2, S3, S4, S5, S7 — each has decision / standard / why here / what this is NOT. S6, S8, S9 are declared trivial with a stated reason, which the contract permits. |
| No step presents alternatives, defers a choice, or contains an unanswered question | pass | Read of all nine steps; zero option sets. |
| §14 register: every entry binned, sourced to a step, dispositioned; sweep count attested; final pass added zero | pass | Read of §14 — 17 entries, all dispositioned, three passes attested with zero added on the last. |
| Every bin-2 entry shows the user's answer | pass (vacuous) | Read: no entry is binned 2. |
| §15 Gaps entries carry resolution-attempt evidence | pass | Read of G-1 and G-2; both carry what was read and executed. |
| §2 coverage reconciliation maps every requested element | pass | Read of the §2 table against the five findings; 1:1. |
| §12 test specifications carry all five fields | pass | Read of T-A2a, T-A2a-neg, T-A2d, T-A2e; each has behavior / level / real-double boundary / data / must-not-assert-and-fails-when. |
| §16 exported-surface check present | pass, **with F-C** | Read of §16 item 2; `codegraph_diff_surface` is specified. F-C records that its stated pass criterion is unsatisfiable after S2. |
| Citation identity — out-of-artifact citations carry immutable identifiers | pass | Read of §11's "Citation identity" paragraph and every claim; the contract and `testing-standards.md` are pinned to `94a640a`, the working-tree reviews and plans are cited by date with unpinnable status stated. |
| **Every factual claim asserted in any plan step has a corresponding §11 entry** | **fail** | F-A. |
| **Every §11 entry carries read-level evidence; content-absence claims state the candidate reads and scope covered** | **fail** | F-D (claim 12). |
| **§4 entries carry the user's resolution** | **fail** | F-E. |

---

## Critical & Serious Findings

### F-A (Serious, Systemic, new) — load-bearing factual assertions in the Plan section carry no §11 entry

**What the plan does now.** Two factual claims asserted inside §4 and §7 have no entry anywhere in §11:

1. **"the harness executes a workflow body wrapped."** Stated in §4 ("the harness executes a workflow body wrapped, which is why the style is correct in this file"), restated in S1's Gate-3 part 3 ("it is the goal the harness actually uses, so the oracle checks the file under the grammar it is really parsed by"), and again in D-1. This is a behavioral claim about the Claude Code agent harness — how it evaluates a workflow file — and it is the sole justification for choosing the wrapped-function-body goal over every alternative. Strip it and S1's part 3 collapses to "this goal happens to accept the file," which is not a standard-anchored reason.

2. **"17 sites inside the phase router"** (§4: "The workflow legitimately uses top-level `return` (17 sites inside the phase router, plus `workflows/expert-lifecycle.js:688` at column 0)"). A count is a factual claim about file contents.

**How this claim was verified.** `grep -n "^[0-9]*\. \*\*"`-equivalent read of the plan's §11 in full (all sixteen numbered entries, Read at plan `:395–410`), cross-walked against every factual assertion in §4 and §7. **Proactive scan across the full inventory scope, instances enumerated:** I walked each of §11's sixteen claims against the assertions they are cited from, and each Plan-section assertion against §11. Claims 1, 4, 8, 10, 11, 13, 14, 15 are file reads; 2, 3, 5, 6, 9 are executed reproductions; 7 is a structural trace explicitly marked corroboration-only; 12 and 16 are discussed below and in F-D. The two assertions above match no entry — claim 4 covers only `:688` (`grep -n "^return"`, one hit, which I reproduced: exactly one line matches) and `:459`, and no entry addresses the harness's evaluation shape or the 17-site count. I reproduced claim 4's grep myself: `grep -n "^return|^const .* = await" workflows/expert-lifecycle.js` returns exactly two lines, `:459` and `:688` — confirming the entry's scope and therefore that it does not reach either assertion.

**Which standard it violates.** The pinned output contract, §11: "One entry per factual claim the plan depends on. A factual claim is any statement the plan makes about ... library behavior, framework defaults ... what currently works," and Gate C: "Every factual claim asserted in any plan step has a corresponding entry in Output section 11. The two are reconciled — claims without entries are non-compliance." §11 also forecloses the escape hatch: "A claim that could not be verified does not appear in the Plan section — it is in the Gaps section ... There is no 'tentative' path; tentative claims are gaps."

**Why this is Systemic rather than two isolated slips.** Both instances are the same shape — an assertion that reads as established context rather than as a checkable claim, so the §11 sweep did not catch it. That is the failure mode §11 exists to prevent, and it recurs in the *most* load-bearing place in the document: the premise under D-1, the plan's single most consequential decision. It is a class because the mechanism (assertions phrased as background survive the sweep) will reproduce on the next plan unless the sweep is run against the Plan section's assertions rather than against §11's list.

**Why it matters.** The harness claim is not idle. If the harness does *not* wrap the body — if, say, it evaluates the file as a module with a transform, or in strict mode — then S1's oracle is calibrated against a goal the file is never parsed under, and F-B's strictness gap becomes a correctness gap rather than a strictness one. The plan is entitled to conclude the wrapped-body goal is right (the executed evidence in claims 5 and 6 does show it accepts correct code and rejects the defect), but it must reach that conclusion from evidence it cites, or record the harness question in §15 as G-3.

**What correct implementation looks like.** Either (a) add a §11 entry verifying the harness's evaluation shape by a documentation read or a reproduction, or (b) if it cannot be verified without a live dispatch — which is plausible, and is the same boundary G-1 already sits on — move it to §15 as a gap with its attempt evidence, and rewrite S1's part 3 and D-1 to rest only on what claims 5 and 6 establish: that the wrapped-body goal is the only one of the three candidates that both rejects the real defect and accepts the legitimate top-level-`return`-plus-`await` shape. That reasoning is sufficient on its own and needs no harness premise. Separately, add a §11 entry for the 17-site count (a `grep` of the router region with the count recorded), or delete the parenthetical — it carries no weight.

---

## Systemic Patterns

The Systemic finding this review produced is **F-A**, recorded above under Critical & Serious per its severity. Its proactive scan (the full §11-to-Plan-section cross-walk, with all sixteen claims classified and the two unmatched assertions enumerated) is recorded inside the finding.

One further systemic candidate was scanned and did **not** confirm: *"the plan's step code blocks contain untested code."* Scan: I executed every executable construct the plan specifies — S1's `parsesAsWorkflowBody` (against the current workflow, the patched workflow, the S2 fixture verbatim, and a legitimate top-level-`return`-plus-`await` shape), S2's fixture text verbatim, S3's two extraction regexes and its `new Function` evaluation (against both the pre-S7 and post-S7 sources), and S7's replacement declarations. Result: **every one behaves exactly as the plan states**, including the mixed pre-fix signature S3's Verification field predicts (3 known-good FAIL, 3 known-bad ok, `constructs as a RegExp` ok — reproduced exactly). No systemic pattern here.

---

## Moderate & Minor Findings

### F-B (Moderate, new) — S1's oracle compiles in sloppy mode, so six classes of strict-mode syntax error pass the repaired gate

**What the plan does now.** S1 specifies `new Function('return (async function(){' + src.replace(/^export /gm, '') + '\n})')`. A `new Function` body is **sloppy-mode** code unless the body itself opens with a Use Strict Directive. `workflows/expert-lifecycle.js` carries `export const meta` at `:1`, so its real evaluation is ECMAScript module code, which is *always* strict. The oracle therefore parses the file under a strictly more permissive grammar than the one it is claimed to model.

**How this claim was verified — executed, by construction.** Six minimal sources in the file's own shape (`export` + top-level `return`), each run through the plan's oracle verbatim, through the same oracle with `"use strict";` prepended, and through `node --input-type=module --check` for the reference goal. Node v22.16.0.

| Source | Plan's oracle | Oracle + `"use strict"` | Module goal |
|---|---|---|---|
| `const n = 0755` (octal literal) | **ACCEPTED** | rejected — "Octal literals are not allowed in strict mode." | rejected |
| `with (o) { }` | **ACCEPTED** | rejected — "Strict mode code may not include a with statement" | rejected |
| `function f(a, a) {}` (duplicate params) | **ACCEPTED** | rejected — "Duplicate parameter name not allowed in this context" | rejected |
| `var x = 1; delete x` | **ACCEPTED** | rejected — "Delete of an unqualified identifier in strict mode." | rejected |
| `eval = 1` | **ACCEPTED** | rejected — "Unexpected eval or arguments in strict mode" | rejected |
| `const s = '\101'` (octal escape) | **ACCEPTED** | rejected — "Octal escape sequences are not allowed in strict mode." | rejected |

Six for six. The one-token fix closes all six, and it does not disturb the properties the plan needs: I re-ran the strict variant against the legitimate top-level-`return`-plus-`await` shape and it still parses.

**Which standard it violates.** ECMA-262 §11.2.2 (Strict Mode Code) — module code is strict code, and the strict-mode early errors above are SyntaxErrors under it; and the plan's own governing regression-detection principle (`skills/expert-plan/references/testing-standards.md:91` @ `94a640a`, plan §3): a gate whose grammar is looser than the grammar its subject is really parsed under has a standing class of defects it cannot fail on. This is F-2 in reduced form — narrower than the original blind `node --check`, but the same kind.

**Why it matters.** S1's Gate-3 part 3 asserts the oracle "checks the file under the grammar it is really parsed by." Under the sloppy-mode wrapper, that is false for the six classes above. The plan's whole thesis is that a gate must be able to fail on the defects its subject can carry; delivering a gate that still cannot fail on a named class, in the step that exists to fix exactly that, is the finding.

**What correct implementation looks like.** Prepend the directive inside the wrapper, and state the reason in the comment S1 already specifies:

```js
function parsesAsWorkflowBody(src) {
  // Module code is always strict (ECMA-262 §11.2.2); a bare `new Function` body is
  // sloppy, which silently accepts octal literals, `with`, duplicate params, and the
  // other strict-mode early errors. The directive puts the oracle in the file's grammar.
  try { new Function('"use strict"; return (async function(){' + src.replace(/^export /gm, '') + '\n})'); return true }
  catch { return false }
}
```

The S2 fixture, the S5 expected failure set, and the T-A2d exemplars are all unaffected — I verified the strict oracle still rejects the current workflow and the fixture, and still accepts the patched workflow.

---

### F-C (Moderate, new) — §16's exported-surface check will fire on the negative fixture the same plan creates

**What the plan does now.** §16 item 2 closes with: "Note that `codegraph_scan` currently reports a parse error on the workflow (§11 claim 7); **after S6 the baseline comparison becomes meaningful, and a scan that still errors after S6 is itself a finding.**" S2 creates `tests/fixture/workflow/broken-syntax-workflow.js` — a `.js` file that is deliberately, permanently unparseable.

**How this claim was verified — executed CodeGraph plus executed parse.** Two premises, each verified independently:

1. *CodeGraph scans `tests/fixture/` and includes `.js` files there.* `codegraph_scan` with `force: true` over `claude-plugins/expert-dev-tools` → `totalFiles: 7`, `parseErrors: 1` (reproducing the plan's claim 7 exactly, including the `"Invalid argument"` detail). `codegraph_list_files` with `language: javascript` returns all seven, and the list includes **`tests/fixture/project/greeter.js`** — a fixture `.js` file already in the graph. The scan's default ignores do not exclude `tests/` or `fixture/`.
2. *The S2 fixture is unparseable.* I wrote the plan's fixture text verbatim to the scratchpad and ran it through the oracle: rejected, `Unexpected identifier 's'` — which is the point of the fixture and is asserted by T-A2a-neg.

Therefore after S2 and S6 the scan reports `parseErrors: 1` again, with the fixture as the entry. §16's stated criterion converts that into "itself a finding" at precisely the checkpoint where the plan says the check becomes meaningful.

**Which standard it violates.** First-principles articulation (no named published standard applies to this plan's own completion criteria): the goal §16 item 2 serves is a post-completion signal that distinguishes a healthy build from a broken one. The shortcut it takes is treating "the scan reports any parse error" as equivalent to "the workflow is broken" — a proxy that was sound when the workflow was the only unparseable file and that S2 invalidates within the same plan. The shortcut fails the goal because the criterion now fires on the healthy end state, and a completion criterion that fires on success is one the next implementer learns to ignore — which is how §16's other items lose their force too.

**Why it matters.** This is the same shape as F-2, one level up: a check whose signal no longer tracks the condition it names. It is Moderate rather than Serious because it is caught before implementation and the fix is two clauses.

**What correct implementation looks like.** Scope the criterion to the file it is about, and name the expected exception:

> After S6, `codegraph_scan` must report **no parse error for `workflows/expert-lifecycle.js`**. Exactly one parse error is expected and correct — `tests/fixture/workflow/broken-syntax-workflow.js`, whose unparseability is the subject of T-A2a-neg. A parse error on any other file, or a surviving error on the workflow, is a finding.

Optionally also record the collision in §13 as a known interaction between S2 and the repository's structural tooling.

---

### F-D (Moderate, new) — claim 12's content-absence conclusion covers 34 documents and cites reads of one

**What the plan does now.** §5's Documentation paragraph and D-4 both conclude that none of the 34 documents `codegraph_find_related_docs` returns requires an edit. §11 claim 12 is the evidence, and it consists of: the `codegraph_find_related_docs` result (34), `codegraph_get_dependents` (0), and a `grep -n "T-A2a\|valid JS\|syntax"` over **`tests/ACCEPTANCE.md`** with its single hit read in place. The other 33 documents are neither read nor grep'd; their disposition rests on the inference "the corrections change no exported symbol, no documented behaviour, and no enumerated test ID."

**How this claim was verified.** Read of the plan at `§5` and `§11` claim 12 and D-4, enumerating exactly what evidence each cites. Then I ran the sweep the plan did not: `grep -rn "T-A2a\|valid JS syntax\|syntax gate\|check-structure" --include=*.md` over the plugin, excluding `docs/reviews/` and `docs/plans/` — **5 hits in 3 files**: `tests/ACCEPTANCE.md:8` (the one the plan checked), `README.md:24` and `:55`, and **`docs/review-round-1.md:115`**, which describes the gate as "checks the workflow with `node --check` + a hand-rolled banned-token regex." I Read all four hit sites. The plan's *conclusion* survives: `docs/review-round-1.md` is a historical review recording the state at its own date, and `README.md`'s two mentions are a run command and an assertion about the server set, none of which S1–S8 falsify. **The conclusion is correct; the evidence for it was not gathered.**

**Which standard it violates.** The pinned contract, Gate C: "Every absence claim states its kind and carries the matching evidence: ... *content absence* ('no function validates X') states the search that defined the candidate set, the reads that confirmed absence at the candidates, and the scope covered. Search-only content-absence claims are non-compliance." And §11: "Search tools ... locate; they are never themselves the evidence." `codegraph_find_related_docs` defined a 34-file candidate set; one candidate was read.

**Why it matters, and why it is Moderate.** The conclusion happens to hold — I checked — so nothing downstream breaks. What fails is auditability, which is the whole function of §11: the next reader cannot distinguish "33 documents were checked and are clean" from "33 documents were reasoned about." §5 compounds it by not enumerating the 34, so a reviewer cannot even reconstruct the candidate set from the plan. It is Moderate because the contract names this class explicitly and because a doc-staleness claim asserted at 34-file scope on 1-file evidence is exactly the shape that eventually is wrong.

**What correct implementation looks like.** Run one scoping search over the candidate set, record its query and hit count, and read the hits: `grep -rln "check-structure\|T-A2a\|LOCATION\|parseLocation\|EVIDENCE schema\|node --check"` across the 34 returned paths. Rewrite claim 12 as a compound content-absence entry — the search that defined the candidate set (query and scope), the reads at each hit confirming no staleness, and the scope covered. Enumerate the 34 paths in §5 (or the subset returned within the plugin), so the candidate set is auditable from the document.

---

### F-E (Minor, new) — S1's edit instruction contradicts itself about line 209

**What the plan does now.** S1's "What changes" opens: "replace **lines 209–212** (the `execFileSync(process.execPath, ['--check', wf], …)` block and its `check(…)` call)". Four sentences later: "`wf` is already declared at `tests/structural/check-structure.mjs:209`; **keep that declaration.**"

**How this claim was verified.** Read of `tests/structural/check-structure.mjs:200–230`. Line 208 is the `// ---- T-A2a` banner; **:209 is `const wf = join(ROOT, 'workflows/expert-lifecycle.js');`**; :210 `let syntaxOk = true;`; :211 the `execFileSync` try/catch; :212 the `check('T-A2a workflow: valid JS syntax', syntaxOk);`. The block the parenthetical describes is 210–212. The plan's own §11 claim 11 states the same line numbers, so the range in S1's first sentence is the error, not the read.

**Which standard it violates.** The pinned contract, Gate A: "Can an implementer execute this step by step without making architectural decisions on the fly — and without encountering a single open question, unmade choice, or option set anywhere in the document?" An implementer following the range literally deletes the `wf` declaration that S1's later sentence, S2's fixture assertion neighbourhood, and the surviving linter block at :215–222 all depend on.

**Why it matters (and why it is Minor).** Two of the three statements disambiguate correctly and the resulting `ReferenceError` would surface on the first run, so the blast radius is one debugging cycle. It is a finding rather than a note because the plan's whole premise is that an implementer executes it without judgment calls.

**What correct implementation looks like.** "Replace lines **210–212** …". Nothing else changes.

---

### F-F (Minor, new) — §4's entry carries the planner's resolution where the contract requires the user's

**What the plan does now.** §4 (Spec issues) contains one entry — the conflict between F-2's recommended fix and the workflow's real parse goal — and opens: "One conflict ... **resolved by the planner within bin 1** (the answer is derivable by execution, so it is not an owner decision)." Its Resolution names S1's oracle. Q-2 in §14 is correspondingly binned 1.

**How this claim was verified.** Read of the plan's §4 (`:52–59`) and §14 Q-2; Read of the pinned contract's §4 definition and Gate C's bin-2 item via `git show 94a640a:…/output-contract.md`.

**Which standard it violates.** The pinned contract, §4: "conflicts found during planning ... each with what was found, the options presented, **the user's resolution**, and where the plan incorporates it. **An entry without a resolution is an open bin-2 register item, and the plan is undeliverable.**" The contract's §4 attaches an unconditional user-resolution requirement to anything placed in that section; a bin-1 item resolved by execution does not satisfy it, and the plan states in the entry's own first line that it does not.

**Why it matters (and why it is Minor).** The substance is right — this genuinely is a bin-1 question, answerable by execution, and the planner answered it correctly (I reproduced all three behaviours). The defect is purely one of venue, and it is self-inflicted: the entry's content is already fully present as divergence **D-A** in §8 and as decision **D-1** in §10, both of which are the contract-correct homes for a planner-resolved conflict with a named justifying standard. §4 as written adds nothing except a Gate-C conflict for the next reviewer to adjudicate.

**What correct implementation looks like.** Delete §4's entry and mark the section omitted as not applicable (no spec-vs-reality conflict requiring an owner decision arose), leaving D-A and D-1 to carry the content they already carry. If the planner prefers to keep the narrative in §4, the entry must be re-binned 2 and put to the owner — which would be the wrong call here, since the question is settled by execution.

---

## Tentative Findings

No tentative findings — every candidate finding's premise was verified per Compliance Gate B. Each Node and CodeGraph premise was re-executed in this session's scratchpad rather than imported from the plan or from the upstream review; each literal-content premise was Read at the cited line at drafting time.

---

## Observations

- The plan's §12 classifies `tests/fixture/workflow/broken-syntax-workflow.js` as a **fake** in the Meszaros taxonomy and supplies the production-obligation naming the contract requires of a double. Under a strict reading the fixture is negative test *input*, not a stand-in for a collaborator the system under test reads in production, so the double machinery arguably does not apply to it at all. The plan over-declares rather than under-declares, and its own framing ("the fake stands in only for the *broken* case, never for the passing one") makes the distinction visible to a reader. No standard is violated; recorded because a reviewer applying the contract's double rules mechanically will meet the question and should know it was considered.
- S7's `LOCATION_RE.test` guard is provably a no-op with respect to accepted inputs — the language `LOCATION_RE` accepts is exactly the union of the languages the two capture regexes accept (`[^\s:#]+` followed by either `:\d+(?:-\d+)?` or `#\S+`, identical on both sides). The plan flags this as its hardest step and its highest-risk change (§13), which is a defensible posture for a change to live gate logic, but the risk it names is smaller than the plan estimates. No standard is violated.

---

## What's Actually Good

**S5's expected failure set is exact, and I could confirm it without running the plan.** *Property:* the plan states not just "the tier should go red" but the precise five failing assertion labels, the precise assertions that must stay green (`T-A2a-neg`, `pattern constructs as a RegExp`, all three `rejects known-bad`), and the exact banner text `STRUCTURAL TESTS FAILED (5)` — then makes any deviation in **either** direction a halt. *Standard:* the regression-detection principle at `skills/expert-plan/references/testing-standards.md:91` (@ `94a640a`), and ISO/IEC/IEEE 29119-4 boundary/partition discipline for the mixed pre-fix signature. *Verified:* I executed S3's harness verbatim against the current unfixed source — 3 known-good `false`, 3 known-bad `false`, pattern constructs — which is exactly the mixed signature S3's Verification field predicts and yields exactly 3 of the 5 failures; the other two (T-A2a, T-A2e) I confirmed by running the oracle against the current workflow (rejected). I then Read `tests/structural/check-structure.mjs:543` and confirmed the banner is literally `` `\nSTRUCTURAL TESTS FAILED (${failures})` ``, so the count format matches. A predicted failure set this specific is falsifiable before implementation, and it survived falsification.

**The plan refuses its own upstream review on executed evidence, and is right to.** *Property:* F-2's prescribed fix is not adopted; §4, D-1 and divergence D-A each record the refusal with the reproduction behind it, and D-1 names the rejected alternatives with the criterion each fails. *Standard:* the expert-review premise-correctness rule that a claim imported from a prior document is a candidate, not a finding — applied here in the planning direction; and the regression-detection principle, correctly generalised to "a check that cannot pass fails the standard as surely as one that cannot fail." *Verified:* I re-executed the refusal's basis independently — `node --input-type=module --check < patched.js` → `SyntaxError: Illegal return statement` at line 495, exit 1, on the F-1-patched copy. The review's snippet would have produced a permanently red gate. Deferring to a review's recommended code is the easy move and the plan declined it with evidence, which is the behaviour the review process is supposed to select for.

---

## Convergence Record

First-round review — convergence tracking begins at round 2.

---

## Recommended Priority

1. **F-A first.** It is the only finding that touches the plan's reasoning rather than its details, and its resolution may change S1's Gate-3 part 3. Decide whether the harness's evaluation shape is verifiable; if it is not, move it to §15 as G-3 and re-ground S1 and D-1 on claims 5 and 6 alone — which suffices. Because F-A is Systemic, the fix is the cross-walk, not the two patches: re-derive §11 from the current Plan-section assertions rather than amending the two entries this review named.
2. **F-B.** One token, and it closes six executed classes of defect in the step whose entire purpose is closing that class. Cheapest correctness gain in the document.
3. **F-C.** Two clauses in §16, before implementation, so the completion criterion is right the first time it is used.
4. **F-D.** One scoping grep across the 34 candidates plus the reads at its hits, and the enumeration in §5. The conclusion will hold — I checked — but the evidence has to exist in the document.
5. **F-E** and **F-F.** Editorial, but F-E is in an executable instruction and should not survive to an implementer.

Note for the next round: F-A, F-D and F-F are all §11/§4 bookkeeping against the same contract, and the contract's own "Sections that restate the step set" rule applies — when these are fixed, sections 2, 3, 5, 11, 12 and 14 are re-derived from the current step set, not patched at the lines this review named.

---

Verdict: NEEDS FIXES (6 findings: 1 Serious-Systemic, 3 Moderate, 2 Minor)
