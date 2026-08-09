# Plan — implementation remediation, round 1

**Governing output contract:** `claude-plugins/expert-dev-tools/skills/expert-plan/references/output-contract.md` **as of commit `94a640a`**. The working-tree revision of that file is parallel work and does **not** govern this plan; every section below is written against the `94a640a` revision, read in full this session via `git show 94a640a:claude-plugins/expert-dev-tools/skills/expert-plan/references/output-contract.md`.

**Upstream artifact:** `claude-plugins/expert-dev-tools/docs/reviews/implementation-round-01.md` (verdict NEEDS FIXES; findings F-1 … F-5).

All paths below are relative to `claude-plugins/expert-dev-tools/` unless written from the repository root.

---

## 1. Goal

Close the five findings of implementation review round 1 by fixing their causes rather than their symptoms, and in the order the review requires: repair the structural tier's blind syntax gate and add the schema- and load-shaped assertions it lacks **first**, demonstrate the repaired tier going red on the two defects it was blind to, and only then correct the defects themselves. Success is: the structural tier fails on the current working-tree state at the two new assertions, and after the three source corrections both tiers pass — green for reasons that have been observed failing.

## 2. Scope

**In scope.** F-1 (unescaped apostrophe in `NOT_THE_RULER`), F-2 (syntax gate incapable of failing), F-3 (`LOCATION.pattern`'s escapes consumed by the string literal), F-4 (systemic: the tier validates the workflow only as text), F-5 (the `EVIDENCE` comment overstates the change).

**Out of scope, and why.** Everything the review passed. This plan does not re-plan the 26-step behavioral remediation, does not revisit any of the **twenty** rows the review's Upstream Contract Verification table marks pass (§11 claim 29 — the table has twenty-one data rows, and the twenty-first, "Plan §1 goal", is marked **fail**; that failure is what S6 closes), and does not act on tentative finding T-1 (whether the agent harness enforces schema `pattern` on subagent returns) — closing T-1 requires a live paid dispatch, which is outside a remediation plan's reach and is recorded as a gap in §15, not as an exclusion of requested work.

**Authorized touch set.** The dispatching instruction authorizes only the files the findings implicate: `workflows/expert-lifecycle.js`, `tests/structural/check-structure.mjs`, and any test fixture the detector repair requires. It explicitly forbids `skills/expert-plan/references/`, `skills/expert-plan/scripts/`, `docs/HANDOFF.md`, `docs/SKILL-CHANGELOG.md`, and `docs/reviews/`. This plan stays inside that set; §5 is the complete list.

**Where this plan ends.** At a green structural tier and a green unit tier, both re-run after the corrections. The post-completion behavioral re-run the upstream plan prices at ~1.5M subagent tokens (`docs/plans/plan-expert-dev-tools-behavioral-remediation.md` §16) is the owner's call and is not part of this plan; §16 states what it becomes worth running.

**Coverage reconciliation.** Every element of the requested work maps to a step:

| Requested element | Implementing step(s) |
|---|---|
| F-2 — syntax gate must become a real parse check that fails on a genuine syntax error in an export-containing `.js` file | S1 (oracle), S2 (negative fixture pinning its capacity to fail) |
| F-3/F-4b — the tier must evaluate schema regex patterns against known-good and known-bad location strings | S3 |
| F-4c — T-22/T-23's execution path must surface a module-load failure | S4 |
| Keeping T-20's anti-weakening guard able to fail across S1's oracle replacement (surfaced by the implementer's STOP at S5, not by the upstream review) | S4b |
| Keeping T-22/T-23 executable across S7's refactor (surfaced by the implementer's STOP at S7) | S7b |
| Reviewer's ordering — prove the repaired tier goes red before fixing | S5 |
| F-1 — the apostrophe | S6 |
| F-3 — the regex-in-string | S7 |
| F-5 — the comment overstatement | S8 |
| Regression guards demonstrated failing pre-fix | S5 (the demonstration), and each of S6–S8's Verification fields |
| Both tiers re-run green | S9 |

No requested element maps to nothing. No element is excluded.

## 3. Standards that govern this plan

| Standard | What it governs here |
|---|---|
| **ECMA-262 §12.9.4 (String Literals)** — a `SingleStringCharacter` may not be an unescaped `'` | S6. The defect is a lexical-grammar violation with no dialect or host variance, which is why one delimiter change is the complete fix. |
| **ECMA-262 §11.2.2 (Strict Mode Code)** — module code is always strict, and the strict-mode early errors (octal literals and escapes, `with`, duplicate parameter names, `delete` of an unqualified identifier, assignment to `eval`) are SyntaxErrors under it | S1. The oracle carries a `"use strict"` directive so its grammar is not looser than the grammar the file's own defects would be judged by; a sloppy wrapper accepts all six classes (§11 claim 19). |
| **ECMA-262 §22.2.1 (Patterns)** and §12.9.4.2 (String escape sequences) | S7. `\s`, `\d`, `\S` are regex atom escapes but *unrecognised* string escapes, which JavaScript resolves to the bare character — the mechanism of F-3. |
| **The regression-detection principle** — `skills/expert-plan/references/testing-standards.md:91` at commit `94a640a`: a check that has not been demonstrated failing against the broken state has not demonstrated it can fail | S1–S5 and the Verification field of every correction step. This is the plan's ordering constraint and the reason S5 exists as a step rather than as a note. |
| **ISO/IEC/IEEE 29119-4 test design techniques** — equivalence partitioning and boundary value analysis | T-A2d's exemplar set (§12): each schema pattern is exercised with one in-partition and one out-of-partition location string, not with a single happy-path string. |
| **Design by Contract (Meyer)** — a declared contract must be satisfiable | S7. A `required` field whose declared grammar admits no valid value is a contract nothing can satisfy; and S8, where an in-source comment is a contract statement subject to the same accuracy requirement. |
| **Single-source-of-truth / generation over duplication** — `docs/plans/plan-expert-dev-tools-behavioral-remediation.md` §3 claim 27 ("scripts that *generate* a derived surface are the fix"), and the derived-table doctrine in the pinned output contract's "Sections that restate the step set" | S7. `LOCATION.pattern` is derived from a regex literal that `parseLocation` also consumes, so the schema grammar and the detector grammar cannot drift apart. |

## 4. Spec issues

**Not applicable — no spec-vs-reality conflict requiring an owner decision arose during planning.**

The governing contract reserves this section for conflicts whose disposition is *the user's resolution*, and states that an entry without one is an open bin-2 register item that makes the plan undeliverable. Every conflict this plan met was answerable by execution and is therefore bin 1, resolved by the planner. The one substantive conflict — the upstream review's own recommended fix for F-2 versus the workflow's real parse goal — is recorded in its contract-correct homes: divergence **D-A** in §8 (the standard justifying the departure) and decision **D-1** in §10 (the executed three-way comparison and the rejected alternatives), resting on §11 claims 4–6 and 17. Its register entry is Q-2 in §14, binned 1 and closed.

## 5. Files affected

**Modified (2)**

- `workflows/expert-lifecycle.js` — S6 (line 58 delimiter), S7 (line 81 `LOCATION` + line 290 `parseLocation`), S8 (line 89 comment).
- `tests/structural/check-structure.mjs` — S1 (T-A2a oracle, replacing lines 210–212; line 209's `wf` declaration survives), S2 (T-A2a-neg), S3 (T-A2d), S4 (T-A2e), **S4b** (the `REPLACED_BY_STRENGTHENING` allowlist and the `goneFrom` predicate inside the T-20 block at `:444–456`, plus T-A2f), **S7b** (one `reDecls` line added to the `gateFns` preamble at `:548`).

**Created (1)**

- `tests/fixture/workflow/broken-syntax-workflow.js` — the negative fixture for S2.

**Dependents.** `codegraph_get_dependents` on `workflows/expert-lifecycle.js` returns `dependentCount: 0`. Nothing imports either changed file; `tests/structural/check-structure.mjs` consumes the workflow as text and by source extraction, not by import. The blast radius is exactly the three files above.

**Documentation — the candidate set, the sweep, and the reads.** `codegraph_find_related_docs` over the two changed files returns **34** documents. Because the doc-sync rule requires a disposition for every one of them, the candidate set is enumerated here so a reviewer can reconstruct it from this document:

| Group | Paths |
|---|---|
| Root and tests (3) | `README.md`, `tests/ACCEPTANCE.md`, `commands/expert.md` |
| Agents (10) | `agents/expert-{acceptance,architect,closeout,corrector,diagnostician,implementer,planner,reviewer,spec-writer,verifier}.md` |
| Specs / architecture (2) | `docs/specs/spec-expert-dev-tools.md`, `docs/arch/architecture-expert-dev-tools.md` |
| Working notes (3) | `docs/investigate.md`, `docs/behavioral-tier-findings.md`, `docs/review-round-1.md` |
| Plans (5) | `docs/plans/plan-expert-dev-tools.md`, `…-behavioral-remediation.md`, `…-remediation-r1.md`, `…-r2.md`, `…-r3.md` |
| Reviews (10) | `docs/reviews/implementation-round-01.md`, `docs/reviews/plan-behavioral-remediation-round-0{1..8}.md`, `docs/reviews/output-contract-generated-sections-round-05.md` |
| Skill reference (1) | `skills/expert-plan/references/output-contract.md` |

**Content-absence claim.** The claim is: *no document in that candidate set makes a statement that S1–S8 falsify.* Its evidence — the search, its executed partition, the reads at all five live hits, the sixteen candidates the search never reaches, and the scope covered — is stated **once**, in §11 claim 12, and is not paraphrased here. Round 2 of review on this plan found this paragraph and claim 12 narrating the same sweep with mutually inconsistent counts, which is the drift the governing contract's restating-sections rule exists to catch; the fix is one statement with one cross-reference, not two statements kept in agreement by hand. The conclusion: **no documentation file requires an edit**, and none is in the authorized touch set. Recorded as D-4 in §10.

## 6. Foundation corrections

The whole plan is a foundation correction: S1–S4 repair the test tier before any source defect is touched, because a repaired tier is what makes the source corrections verifiable. They are ordered first for exactly the reason §3's regression-detection principle states, and cannot be deferred — deferring them means the source fixes are accepted on the author's assertion, which is the failure mode F-4 names.

## 7. Plan

### S1 — Replace T-A2a's parse oracle with one that matches the workflow's real execution shape

**What changes.** In `tests/structural/check-structure.mjs`, replace **lines 210–212** — the `let syntaxOk = true;` binding, the `execFileSync(process.execPath, ['--check', wf], …)` try/catch, and the `check('T-A2a workflow: valid JS syntax', syntaxOk)` call — with a `parsesAsWorkflowBody(src)` helper and its use:

```js
// The workflow is ESM-flagged (`export const meta` at :1) but also uses top-level
// `return` (:688) and top-level `await` (:459). That is legal because the harness
// runs the body inside an async function (skills/workflow-creator/SKILL.md:142-145).
// No standard goal accepts the shape: `node --check` on the .js path exits 0 for ANY
// syntax error once `export` is present, and `--input-type=module --check` rejects
// the legitimate top-level return. Compiling the body as an async function is the
// only oracle that both rejects real defects and accepts this file's correct form.
// The "use strict" directive is load-bearing: a bare `new Function` body is sloppy
// mode, which silently accepts octal literals, `with`, duplicate parameter names,
// `delete` of an unqualified identifier, assignment to `eval`, and octal escapes —
// all SyntaxErrors under ECMA-262 §11.2.2 strict code, and all six executed.
function parsesAsWorkflowBody(src) {
  try { new Function('"use strict"; return (async function(){' + src.replace(/^export /gm, '') + '\n})'); return true }
  catch { return false }
}
check('T-A2a workflow: parses as a workflow body (strict)', parsesAsWorkflowBody(readFileSync(wf, 'utf8')));
```

**Line 209 — `const wf = join(ROOT, 'workflows/expert-lifecycle.js');` — is NOT part of the replaced range and must survive**: the linter block below it and S2's new assertion both consume `wf`. The `--check` invocation and the now-unused `syntaxOk` binding are deleted. The workflow-creator linter block below it, the `meta`-first assertion, and everything after them are untouched — stated without a line range deliberately, because a range here would be an assertion about code this step does not modify, and round 2 of review on this plan found exactly such a range both unregistered and wrong.

**Source.** F-2 (Critical) and F-4 instance (a); the regression-detection principle at `skills/expert-plan/references/testing-standards.md:91` (commit `94a640a`).

**Why this approach.**
1. *Decision.* Detect syntax errors in `workflows/expert-lifecycle.js` by compiling its source as a **strict-mode** async function body, with the leading `export ` keyword stripped, rather than by invoking `node --check` in any mode.
2. *Authoritative standard.* ECMA-262 §12.9.4 defines the lexical rule F-1 violates; ECMA-262 §11.2.2 (Strict Mode Code) defines the six early errors the sloppy-mode wrapper would miss; the regression-detection principle (`testing-standards.md:91` @ `94a640a`) defines what makes a check count. The oracle must reject every ECMA-262 violation the file can carry and accept everything it legitimately contains.
3. *Why it applies here.* Two properties fix the choice, and both are cited rather than assumed. First, the harness runs a workflow body inside an async function and takes the body's `return` value as the tool result (`skills/workflow-creator/SKILL.md:142–145,159` @ `4caccdb` — §11 claim 17), which is why top-level `return` and top-level `await` are correct in this file and why the wrapped goal is the file's real grammar. Second, and sufficient on its own without any premise about the harness: of the three candidate goals, the wrapped body is the only one that both rejects the real defect and accepts the legitimate top-level-`return`-plus-`await` shape (§11 claims 5, 6, 18). The strict directive is required because module code is always strict under §11.2.2, and a bare `new Function` body is not — six classes of strict-mode early error pass the sloppy wrapper and are rejected by the strict one (§11 claim 19).
4. *What this is NOT — and why.* Not `node --check` on the `.js` path: executed, exit 0 on a file carrying `export` plus an unescaped apostrophe, which is the defect itself. Not `--input-type=module --check` as F-2 recommends: executed against the F-1-patched copy, `SyntaxError: Illegal return statement` at line 495 — a check that cannot pass, which invites its own deletion. Not the same wrapper **without** `"use strict"`: executed, it accepts all six strict-mode early-error classes, which is F-2 in reduced form inside the step that exists to close F-2. Not a hand-rolled tokenizer or a regex over quote characters: a partial reimplementation of the ECMAScript lexer is a second thing to get wrong, and the upstream review already demonstrated that hand-reasoning about this file's quoting produced a false first hypothesis. Not adding a parser dependency (acorn, esprima): the plugin has no `package.json` dependency surface and `new Function` is the same V8 parser with no supply-chain surface.

**Dependencies.** None. Unblocks S2, S5.

**Verification.** T-A2a (§12). Run `node tests/structural/check-structure.mjs`; T-A2a must print `FAIL` against the current unfixed workflow. A green T-A2a at this step means the oracle is wrong, not that the workflow is fine.

**Impact if wrong.** Contained but severe in kind: an oracle that accepts everything reinstates F-2 verbatim; an oracle that rejects correct code produces a permanently red tier that the next maintainer weakens. Recoverable — the change is one function in one test file, and S2's negative fixture makes the first failure mode detectable.

### S2 — Pin T-A2a's capacity to fail with a checked-in negative fixture

**What changes.** Create `tests/fixture/workflow/broken-syntax-workflow.js` containing an ESM-flagged, top-level-`return` workflow shape carrying exactly the F-1 defect:

```js
// NEGATIVE FIXTURE — deliberately unparseable. Do not "fix" it.
// tests/structural/check-structure.mjs asserts T-A2a's oracle REJECTS this file.
// If this file ever parses, the syntax gate has stopped being able to fail and
// the class F-2 names has returned. The defect is the unescaped apostrophe below,
// the exact shape that shipped green through `node --check` at implementation
// round 1 (docs/reviews/implementation-round-01.md, F-1/F-2).
export const meta = { name: 'broken-syntax-workflow' }
function phase() { return 1 }
const claim = 'The authoring skill's process rules are not the standard'
return phase()
```

In `tests/structural/check-structure.mjs`, immediately after S1's T-A2a assertion, add:

```js
check('T-A2a-neg the parse oracle REJECTS a known-broken workflow (the gate can fail)',
  !parsesAsWorkflowBody(readFileSync(join(ROOT, 'tests/fixture/workflow/broken-syntax-workflow.js'), 'utf8')));
```

**Source.** F-2's "What correct implementation looks like" and the regression-detection principle (`testing-standards.md:91`, commit `94a640a`); F-4's stated remedy that each new assertion be demonstrated red before green.

**Why this approach.**
1. *Decision.* Encode the demonstration of failure as a permanent tier assertion over a checked-in broken fixture, rather than as a one-time manual red run recorded in a document.
2. *Authoritative standard.* The regression-detection principle at `testing-standards.md:91` — a check that never failed has not demonstrated it can.
3. *Why it applies here.* F-2 is not "a check that was never demonstrated red"; it is a check that was structurally *incapable* of going red. A one-time manual demonstration proves the oracle works on the day it is run and proves nothing about the day someone simplifies it. A negative fixture converts the demonstration into a standing invariant that a future weakening of the oracle trips immediately.
4. *What this is NOT — and why.* Not a manual red run alone: it decays the moment the oracle is edited, which is precisely how F-2 arose from a gate someone believed worked. Not a `try/catch` unit test asserting `new Function` throws on an inline string: an inline string does not carry the `export` + top-level-`return` shape that made the original gate blind, so it would not exercise the property that failed. Not reusing the pre-fix `workflows/expert-lifecycle.js` as the fixture: after S6 that file is correct, and the demonstration must survive the fix.

**Dependencies.** S1. Unblocks S5.

**Verification.** T-A2a-neg (§12). It must print `ok` immediately, both before and after S6 — its subject is the fixture, not the workflow. Temporarily escaping the fixture's apostrophe must flip it to `FAIL`; the implementer performs that flip, records the output, and reverts it.

**Impact if wrong.** Contained. A fixture that parses makes T-A2a-neg fail loudly rather than silently, so the error is self-announcing.

### S3 — Assert every schema `pattern` in the workflow is a usable regex

**What changes.** In `tests/structural/check-structure.mjs`, after the T-A2a block, add a loop that extracts every schema constant carrying a `pattern:` from the workflow source, evaluates it in the source's own lexical form, and exercises the resulting `RegExp` against exemplars:

```js
// T-A2d: schema `pattern` values must be regexes that actually match the grammar
// they encode. F-3 shipped green because nothing evaluated any pattern: written as
// a single-quoted string, `\s`/`\d`/`\S` were consumed as string escapes and the
// pattern matched no valid location. Evaluating the source expression — not a
// re-typed copy of it — is what reproduces that class.
const PATTERN_EXEMPLARS = {
  // schema const name -> { good: [...], bad: [...] }  (ISO/IEC/IEEE 29119-4 equivalence partitioning)
  LOCATION: { good: ['spec.md:271-273', 'spec.md:271', 'plan.md#s7'], bad: ['spec.md', 'a b.md:1', 'spec.md:x'] },
};
const reDecls = (wfSrc.match(/^const \w+_RE = \/.*\/[gimsuy]*$/gm) || []).join('\n');
const schemaDecls = (wfSrc.match(/^const (\w+) = \{[^\n]*pattern:[^\n]*\}$/gm) || []);
const schemaNames = schemaDecls.map((d) => /^const (\w+)/.exec(d)[1]);
check('T-A2d at least one schema pattern was found to check', schemaNames.length > 0);
const schemas = new Function([reDecls, ...schemaDecls,
  `return { ${schemaNames.join(', ')} }`].join('\n'))();
for (const name of schemaNames) {
  const ex = PATTERN_EXEMPLARS[name];
  check(`T-A2d ${name}: exemplars are declared for this pattern`, !!ex);
  if (!ex) continue;
  let re = null;
  try { re = new RegExp(schemas[name].pattern) } catch { re = null }
  check(`T-A2d ${name}: pattern constructs as a RegExp`, !!re);
  if (!re) continue;
  for (const g of ex.good) check(`T-A2d ${name}: matches known-good ${JSON.stringify(g)}`, re.test(g));
  for (const b of ex.bad) check(`T-A2d ${name}: rejects known-bad ${JSON.stringify(b)}`, !re.test(b));
}
```

`wfSrc` is **declared at `tests/structural/check-structure.mjs:95`** and is therefore in scope at this insertion point (§11 claim 27). The declaration site is what establishes scope — its later use by the T-23 static assertions does not, and citing a use site below the insertion point would have described a temporal-dead-zone `ReferenceError` rather than a working reference.

**Source.** F-3 (Serious) and F-4 instance (b); F-4's remedy 3, which specifies exactly this loop; ISO/IEC/IEEE 29119-4 equivalence partitioning for the exemplar sets.

**Why this approach.**
1. *Decision.* Discover schema patterns from the workflow source and assert each one both constructs and partitions its grammar correctly, with an assertion that a discovered pattern lacking declared exemplars is itself a failure.
2. *Authoritative standard.* Design by Contract — a declared contract must be satisfiable; ISO/IEC/IEEE 29119-4 — a pattern is exercised with in-partition and out-of-partition values, not a single happy-path string; and the regression-detection principle for the red demonstration in S5.
3. *Why it applies here.* `location` is `required` in `VERDICT_SCHEMA.findings.items`, so its `pattern` is a contract term. A contract term nothing evaluates is a term nothing enforces — F-3 is the proof. The exemplar-declaration assertion is what makes this close the class rather than the instance: adding a new `pattern:` to the workflow without exemplars turns the tier red instead of silently going unchecked.
4. *What this is NOT — and why.* Not re-typing the pattern into the test and testing that copy: it would pass while the workflow's own string stayed broken, since the defect lives in the source literal's escape resolution. Not asserting the pattern's text equals an expected string: that is a change-detector test — it fails on every legitimate grammar edit and still says nothing about whether the grammar matches anything. Not testing `LOCATION` alone by name: F-4 is a class finding, and a named-instance assertion leaves the next `pattern:` unchecked, which is the "named instances close, the class resurfaces" shape the upstream plan's D-1 identifies as dominant.

**Dependencies.** None (independent of S1/S2). Unblocks S5, S7.

**Verification.** T-A2d (§12). Against the current unfixed workflow, `T-A2d LOCATION: matches known-good "spec.md:271-273"` and the other two known-good assertions must print `FAIL`; `pattern constructs as a RegExp` prints `ok` (the mangled pattern is still a valid regex — it just matches nothing), and the known-bad assertions also print `ok`. That precise mixed signature is the expected pre-fix output.

**Impact if wrong.** Contained. A too-loose exemplar set gives false confidence in the grammar; a mis-scoped extraction regex makes `schemaNames` empty, which the explicit `at least one schema pattern was found` assertion catches rather than passing vacuously.

### S4 — Make T-22/T-23's execution path surface a module-load failure

**What changes.** In `tests/structural/check-structure.mjs`, immediately before the `declOf`/`gateFns` construction at lines 433–457, add:

```js
// T-A2e: T-22/T-23 execute runGate by extracting its SOURCE TEXT into new Function,
// so they pass over a workflow that cannot load at all (F-4c). Gate the extraction on
// the whole source compiling first — otherwise these cases are green on a dead module.
check('T-A2e the whole workflow compiles before runGate is extracted from it',
  parsesAsWorkflowBody(wfSrc));
```

Leave `declOf` and the `gateFns` construction unchanged **in this step**: the extraction technique is defensible (a module that executes a lifecycle at top level cannot be imported), and the plan's stubbing of `reviewFn`/`remediateFn` is correct. The gap F-4c names is the absence of a whole-source compile, not the presence of the extraction.

**Scope of "unchanged", stated precisely because a later step needs it:** this instruction forbids S4 from altering the harness, not the plan from ever doing so. **S7b adds one line to the `gateFns` preamble** — the `reDecls` injection S7's refactor makes necessary — and that change is authorized there, not here. The extraction *technique* and the `declOf` function remain unchanged throughout; only the preamble's injected-constant list grows, which is the same shape as the `ROUND_CAP` line already in it.

**Source.** F-4 instance (c) and its remedy 2.

**Why this approach.**
1. *Decision.* Add a whole-source compile assertion alongside the extraction harness rather than replacing the extraction with a real module import.
2. *Authoritative standard.* The regression-detection principle at `testing-standards.md:91` — the tier must have at least one assertion that can go red when the module as a whole is unloadable.
3. *Why it applies here.* T-22 and T-23 are the tier's only behavioural assertions and they are, by construction, insensitive to everything outside the three extracted declarations. Making them insensitive is the price of testing `runGate` at all; leaving nothing else sensitive to whole-module health is the defect. One assertion restores the sensitivity without touching the working technique.
4. *What this is NOT — and why.* Not `await import(wf)`: the workflow executes a lifecycle at top level and would dispatch agents or throw on import — the review established this and it is why the extraction exists. Not deleting the extraction and asserting only over source text: that would delete the only executed coverage of `runGate`, trading a Serious finding for a worse one. Not duplicating S1's oracle as a separate implementation: reusing `parsesAsWorkflowBody` keeps one definition of "this file is loadable," so a future change to the parse goal updates both sites at once.

**Dependencies.** S1 (defines `parsesAsWorkflowBody`). Unblocks S5.

**Verification.** T-A2e (§12). Must print `FAIL` against the current unfixed workflow, alongside T-A2a.

**Impact if wrong.** Contained. Worst case it duplicates T-A2a's signal, which is redundancy, not breakage.

### S4b — Teach T-20 the difference between a deleted check and a deliberately replaced oracle

**What changes.** S1 replaces a check's label (`'T-A2a workflow: valid JS syntax'` → `'T-A2a workflow: parses as a workflow body (strict)'`). T-20's anti-weakening guard at `tests/structural/check-structure.mjs:444–456` reads every `check(` label out of the `HEAD` baseline and reports any that is absent from the current source; its rename normalizer at `:452` maps only cardinality words and digits (`/\b(nine|ten|eleven|\d+)\b/g` → `'#'`), so an oracle replacement is indistinguishable from a deletion and T-20 goes red. No later step can clear it, which makes S9 unreachable as the plan previously stood.

In `tests/structural/check-structure.mjs`, inside the T-20 block, add a declared allowlist above the `gone` computation and rewrite that computation to consult it through a **named predicate** that the new test also calls:

```js
// A check REPLACED by a strictly stronger one is not a deleted check. That
// difference is NOT inferable from the labels, so it is declared here, never
// guessed by widening the normalizer. Each entry names the exact baseline label
// and the exact label that supersedes it, with the finding that forced the swap.
const REPLACED_BY_STRENGTHENING = [
  {
    was: 'T-A2a workflow: valid JS syntax',
    now: 'T-A2a workflow: parses as a workflow body (strict)',
    why: 'implementation-round-01 F-2: `node --check` on the .js path exits 0 for ANY ' +
         'syntax error once `export` is present. The replacement parses the file under ' +
         'the goal the harness executes it in, and T-A2a-neg holds it demonstrably able to fail.',
  },
];
const supersededBy = new Map(REPLACED_BY_STRENGTHENING.map((r) => [r.was, r.now]));
// The guard's predicate, named so the T-A2f cases below exercise THIS function
// rather than a copy of it. A copy could drift into passing while the live
// guard rots — the defect class this whole plan exists to close.
//
// PRESENCE IS STRUCTURAL, NOT TEXTUAL. A label counts as present only when it
// appears in `check(` call position — the `here` set. The obvious-looking
// `currentSrc.includes(l)` disjunct is deliberately ABSENT: it short-circuits
// before the allowlist is consulted, so any baseline label that appears
// anywhere in the file AS DATA (an allowlist `was:` field, a test argument, a
// comment) silently counts as a live check. That is not hypothetical — the
// allowlist below writes this very label into the file, which is exactly how
// this guard was found reporting green over a deleted check.
const goneFrom = (baselineLabels, currentSrc) => {
  const here = new Set([...currentSrc.matchAll(/check\(\s*[`'"]([^`'"]{8,60})/g)].map((m) => norm(m[1])));
  return baselineLabels.filter((l) => {
    if (here.has(norm(l))) return false;              // structural: in check( position
    const now = supersededBy.get(l);
    return !(now && here.has(norm(now)));             // replacement must ALSO be in check( position
  });
};
const gone = goneFrom(labels, src);
```

The existing `check('T-20 no check present at baseline was removed', gone.length === 0)` and its `console.log` of `gone` are unchanged. `norm` at `:452` is **not** widened.

**Removing the `currentSrc.includes` disjuncts loses nothing.** Every label genuinely present in `check(` position is caught by `here.has(norm(l))`, because `norm` is applied to both sides — an unchanged label normalizes identically on both, and a cardinality-word rename is what `norm` exists to absorb. The only thing the raw substring test caught that the structural test does not is a baseline label occurring outside call position, which is precisely the false-negative being removed.

**Deviation authorized:** the implementer may delete the now-unreferenced `const present = …` binding at the old `:453`, which `goneFrom` supersedes. Leaving a dead binding beside a guard this delicate invites a future reader to wire it back in.

Then add T-A2f immediately below. **Its synthetic sources must be built at runtime**, never written as literals, for the same reason the presence test is structural — a literal `check('<label>` inside a test argument is indistinguishable, to the file-wide scan, from a real assertion, and would put the label back into `here`:

```js
// T-A2f: the allowlist must not have switched the guard off. Same predicate,
// four cases. The synthetic sources are ASSEMBLED, not written literally: a
// literal check('… in a test argument lands in the very set `here` is built
// from, which would reintroduce the false negative this step exists to remove.
const asCheck = (label) => 'check(' + JSON.stringify(label) + ', z)';
const OLD_LABEL = REPLACED_BY_STRENGTHENING[0].was;
const NEW_LABEL = REPLACED_BY_STRENGTHENING[0].now;
check('T-A2f a genuinely deleted check is still reported',
  goneFrom(['T-A2a workflow: meta is the first statement'], asCheck('unrelated label here')).length === 1);
check('T-A2f an allowlisted replacement whose new label IS present is not reported',
  goneFrom([OLD_LABEL], asCheck(NEW_LABEL)).length === 0);
check('T-A2f an allowlisted replacement whose new label is ABSENT is reported',
  goneFrom([OLD_LABEL], asCheck('unrelated label here')).length === 1);
// The case that pins THIS step's defect: presence as data is not presence.
check('T-A2f a baseline label appearing only as data is still reported gone',
  goneFrom(['a label that exists only as data'], "const x = 'a label that exists only as data'").length === 1);
```

**Source.** The implementer's STOP REPORT at S5 (divergence category: blast radius beyond plan — a guard the plan did not anticipate blocks a step the plan requires), verified independently at source; `skills/expert-plan/references/testing-standards.md:91` @ `94a640a` for T-A2f's must-fail requirement.

**Why this approach.**
1. *Decision.* Record the one oracle replacement as an explicit `was`/`now`/`why` allowlist entry consulted by a named predicate, and hold that predicate to a standing must-fail case — rather than widening `norm` at `:452` to absorb label edits generically.
2. *Authoritative standard.* The regression-detection principle (`testing-standards.md:91` @ `94a640a`): a guard must remain able to fail on the condition it names. T-20's condition is "a check present at baseline was removed", and any change to it must preserve that failure mode.
3. *Why it applies here.* T-20 is itself an anti-weakening detector, so relaxing it is the highest-risk edit in this plan — the failure mode is silent and permanent, and it lands in the one assertion whose job is to notice silent permanent weakening. An allowlist keyed to an exact label pair narrows the exemption to precisely the one substitution the plan makes and leaves every other label fully guarded.

   **The safety properties are stated as probe results, not as reasoning.** An earlier revision of this step asserted that "the exemption evaporates if the replacement is ever itself deleted" on the strength of a `currentSrc.includes(now)` condition. That claim was **false**, and the implementer refuted it by direct probe rather than accepting it: with a textual presence test, the allowlist was never reached at all. Each property below is now an executed result against the amended predicate (eight directions, run this session; §11 claims 33–35):

   | Property | Probe | Result |
   |---|---|---|
   | The exemption is honoured when the replacement is live | allowlist present, `NEW` in `check(` position | not reported gone |
   | Neutralizing the allowlist re-arms the guard (direction B) | `supersededBy` replaced with an empty `Map`, array left in place | **reported gone → T-20 red** |
   | Deleting the replacement re-arms the guard (evaporation) | `NEW`'s assertion removed from a probe copy | **reported gone → T-20 red** |
   | A genuine deletion of any other check is still caught | unrelated baseline label, absent | reported gone |
   | A label present only as data is not treated as present | label in a `const`, not in call position | reported gone |
   | An untouched label is not falsely reported | real baseline label, still asserted | not reported gone |

   The middle two are the properties the previous revision claimed and did not have. They hold only because presence is structural; under the textual test, direction B could not go red and deleting the replacement outright left T-20 green.
4. *What this is NOT — and why.* **Not widening the `norm` normalizer** — the obvious fix and the wrong one: any generalisation that makes `'valid JS syntax'` match `'parses as a workflow body (strict)'` must ignore most of the label, and a normalizer that ignores most of the label stops distinguishing a rename from a deletion for *every* check in the file, converting a targeted exemption into a blanket one. That is weakening a detector to make a plan pass, which S22 of the upstream plan forbids and which this plan's own §6 exists to prevent. **Not deleting or skipping the T-20 label assertion** — same objection, more bluntly. **Not keeping S1's original label** to dodge the guard: the label states what the oracle now does, and a check whose label misdescribes it is the F-5 defect class this plan is already fixing. **Not asserting `gone.length <= 1`** — that would exempt one deletion of *any* check, including a real one. **Not testing a copy of the predicate**: T-A2f calls `goneFrom` itself, because a duplicated predicate can pass while the live guard rots, which is F-4's instance (b) in miniature.

**Dependencies.** S1 (which creates the label substitution), S2 (whose replacement label T-A2f's second case references). Unblocks S5 — and therefore S6–S9, none of which is reachable while T-20 is red.

**Verification.** T-A2f (§12), plus T-20's own `no check present at baseline was removed` returning to `ok`. **Three demonstrations, all required, all recorded verbatim** — the first revision of this step passed a one-direction check and was still wrong, so a single restored-green run is not acceptable evidence:

- **Direction B — the allowlist neutralized.** Temporarily replace the `supersededBy` construction with `const supersededBy = new Map()`, **leaving the `REPLACED_BY_STRENGTHENING` array in place**. T-20 must go **red** and T-A2f's second case must fail. If T-20 stays green, the presence test is still textual somewhere; stop and find it rather than proceeding.

  *Do not empty the array itself.* T-A2f derives `OLD_LABEL` and `NEW_LABEL` from `REPLACED_BY_STRENGTHENING[0]`, so emptying it throws a `TypeError` on property access before any assertion runs — the demonstration crashes instead of showing the guard red, and observes nothing. This plan specified the array form first and it is not executable; the map form isolates the same variable (whether the exemption is consulted) while leaving the test's label derivation intact. Verified by reproduction: emptying the array throws on `[0].was`; emptying the map leaves `OLD_LABEL` deriving correctly with `supersededBy.get(OLD_LABEL)` returning `undefined`.
- **Direction C — replacement deleted (evaporation).** On a scratch copy, remove or rename S1's `T-A2a workflow: parses as a workflow body (strict)` assertion with the allowlist intact. T-20 must go **red**. This is the property the previous revision claimed and did not have.
- **Restore, then green.** All five assertions — T-20's and T-A2f's four — green with the file intact.

Additionally confirm, by grep, that the amended file contains **no** literal `check('T-A2a workflow: valid JS syntax` anywhere: the baseline label must appear only as data in the allowlist's `was:` field. A literal reintroduces the defect this step exists to remove.

**Impact if wrong.** Cascading and silent, and this step has already demonstrated how. An over-broad exemption disables the tier's only defence against a future edit quietly deleting checks, and nothing else in the suite would notice — the first revision of S4b produced exactly that state while reporting green, and it took a probe of the guard's own predicate to see it. Contained by construction now: presence is structural, the allowlist has one entry matched on full exact labels, the exemption is conditional on the replacement being live in call position, and T-A2f's four cases fail if any of those weakens.

### S5 — Demonstrate the repaired tier red on the unfixed source

**What changes.** No files change. Run `node tests/structural/check-structure.mjs` against the working tree with **S1–S4 and S4b** applied and **no source correction yet**, and record the verbatim output of the failing lines in the implementation report.

**Read this before comparing.** A first execution of this step, with S1–S4 applied but before S4b existed, produced these five *plus* a sixth: `FAIL  T-20 no check present at baseline was removed`, because S1's label substitution reads as a deletion to T-20's guard. That was a real gap in this plan, not a false alarm — it is diagnosed and closed by S4b, and §11 claims 30–32 carry the evidence. With S4b applied the expected set is the five below and the banner is `(5)`. If T-20 is still failing, S4b was not applied or its allowlist entry does not match the label S1 actually wrote — compare the two strings exactly before changing anything else.

Expected failing set:

- `FAIL  T-A2a workflow: parses as a workflow body (strict)` (F-1)
- `FAIL  T-A2e the whole workflow compiles before runGate is extracted from it` (F-1)
- `FAIL  T-A2d LOCATION: matches known-good "spec.md:271-273"` (F-3)
- `FAIL  T-A2d LOCATION: matches known-good "spec.md:271"` (F-3)
- `FAIL  T-A2d LOCATION: matches known-good "plan.md#s7"` (F-3)
- non-zero exit, `STRUCTURAL TESTS FAILED (5)`

`T-A2a-neg`, `T-A2d LOCATION: pattern constructs as a RegExp`, and all three `rejects known-bad` assertions print `ok` at this point.

If the observed set differs from the expected set in either direction, **halt**: an assertion that does not go red on a defect the review verified by execution is not detecting that defect, and proceeding would deliver a second generation of the same blindness.

**Source.** The review's Recommended Priority item 1, and the regression-detection principle (`testing-standards.md:91`, commit `94a640a`).

**Why this approach.** This step is non-trivial despite changing no file — it is the gate that converts S1–S4 from plausible code into demonstrated detectors.
1. *Decision.* Run the repaired tier against the broken state and require the exact expected failure set before any source correction is made.
2. *Authoritative standard.* `testing-standards.md:91` — a check must be demonstrated failing against the broken state before its green means anything.
3. *Why it applies here.* F-1 and F-3 are the only two live instances of the defects S1–S4 are built to catch, and after S6–S8 they cease to exist. This is the single opportunity to observe the new assertions failing against real defects rather than against synthetic ones.
4. *What this is NOT — and why.* Not "fix everything, then confirm green": a green tier is consistent with both a working detector and a detector that cannot fail, which is exactly how round 1 delivered. Not "assert the expected output in a test": the pre-fix state is transient by design, so encoding it would create a test that must be deleted one step later.

**Dependencies.** S1, S2, S3, S4. Unblocks S6, S7, S8.

**Verification.** The recorded verbatim output matches the expected set, exactly, in both directions.

**Impact if wrong.** Cascading if skipped — every downstream green becomes unearned and the review's central finding is unaddressed. Nothing is destroyed; the cost of getting it wrong is that the whole remediation is worthless.

### S6 — Fix F-1: change the `NOT_THE_RULER` delimiter

**What changes.** `workflows/expert-lifecycle.js:57–59`, replace the single-quoted first fragment with a double-quoted one:

```js
const NOT_THE_RULER =
  "The authoring skill's process rules are not the standard — judge the artifact, not the " +
  'process that produced it.'
```

Only the delimiter of the first fragment changes. The string's characters, the em dash, the concatenation, and the second fragment are byte-identical to what is there now.

**Source.** F-1 (Critical); ECMA-262 §12.9.4.

**Why this approach.** Trivial by the plan's own definition — a one-delimiter correction with a named lexical rule behind it, matching the file's existing convention at `workflows/expert-lifecycle.js:42–43`, where `RULER.architecture` and `RULER.plan` already use `"…"` for exactly this reason (they contain `spec's` and `plan's`). The defect is a local inconsistency with a correct pattern fifteen lines above it.

**Dependencies.** S5. Unblocks S9.

**Verification.** T-A2a and T-A2e (§12) flip from `FAIL` to `ok` — both were observed red at S5, so the flip is attributable to this change. Additionally, `grep -n "NOT_THE_RULER" -A 2 workflows/expert-lifecycle.js` confirms the string content is unchanged apart from the delimiter.

**Impact if wrong.** Cascading if it stays wrong — the module does not parse and no phase, gate, or detector in the plugin runs. Fully recoverable; it is one character.

### S7 — Fix F-3: derive `LOCATION.pattern` and `parseLocation` from one regex literal

**What changes.** In `workflows/expert-lifecycle.js`, replace line 81 with two lines:

```js
const LOCATION_RE = /^[^\s:#]+(?::\d+(?:-\d+)?|#\S+)$/
const LOCATION = { type: 'string', pattern: LOCATION_RE.source }
```

Both must stay single-line: `tests/structural/check-structure.mjs`'s S3 extraction matches `^const \w+_RE = \/.*\/[gimsuy]*$` and `^const (\w+) = \{[^\n]*pattern:[^\n]*\}$` line-wise. Keep the existing explanatory comment at lines 76–80 in place above them.

Then rebuild `parseLocation` (`workflows/expert-lifecycle.js:290–296`) from capture groups of the same literal, so the schema grammar and the detector grammar are one object rather than two hand-kept copies:

```js
const LOCATION_RANGE_RE = /^([^\s:#]+):(\d+)(?:-(\d+))?$/
const LOCATION_SECTION_RE = /^([^\s:#]+)#(\S+)$/
function parseLocation(loc) {
  if (typeof loc !== 'string') return null
  if (!LOCATION_RE.test(loc)) return null
  const r = LOCATION_RANGE_RE.exec(loc)
  if (r) return { file: r[1], start: +r[2], end: r[3] === undefined ? +r[2] : +r[3] }
  const s = LOCATION_SECTION_RE.exec(loc)
  return s ? { file: s[1], section: s[2] } : null
}
```

The `LOCATION_RE.test` guard is what binds the two: a location the schema grammar rejects can no longer be parsed by the detector, so the two surfaces cannot silently diverge. `LOCATION_RE` carries no `g` flag, so `test` has no `lastIndex` statefulness — verified by read of the literal.

**Source.** F-3 (Serious) and the review's Recommended Priority item 3; ECMA-262 §12.9.4.2 (unrecognised string escapes resolve to the character); Design by Contract; the generation-over-duplication rule (upstream plan §3 claim 27).

**Why this approach.**
1. *Decision.* Express the location grammar once as a regex literal and derive the schema's `pattern` string from it via `.source`, with `parseLocation` gated on the same literal.
2. *Authoritative standard.* Single-source-of-truth / generation over duplication, named as governing in the upstream plan §3 claim 27 and reinforced by the pinned output contract's derived-surface doctrine; Design by Contract for the requirement that the declared grammar be satisfiable.
3. *Why it applies here.* The schema's `pattern` and `parseLocation`'s regexes are two statements of one grammar. Round 1 proved they can disagree without anything noticing — the schema half matched nothing while the detector half worked. Deriving one from the other makes disagreement unrepresentable rather than merely undetected.
4. *What this is NOT — and why.* Not doubling the backslashes to `'^[^\\s:#]+…'`: it fixes the instance and leaves two hand-maintained copies of one grammar — the exact maintained-surface shape the upstream plan's D-8 names as its own residual risk, and the review names this explicitly as the wrong fix. Not deleting `LOCATION.pattern` and relying on `parseLocation` alone: `pattern` is the contract the reviewer subagent is shown, and removing it would weaken the ruler, which the upstream plan's S22 forbids. Not rewriting `parseLocation` to a single regex with four capture groups: the two forms have different arities and the merge would be an unrequested behavioural change to a function the review verified correct, including its four executed boundary cases.

**Dependencies.** S5. Unblocks S9.

**Verification.** T-A2d (§12): the three `matches known-good` assertions flip from `FAIL` to `ok`, and the three `rejects known-bad` assertions stay `ok`. T-22's nine assertions and T-23's seven — which exercise `parseLocation` and `detectCorrectionFailure`, including the four boundary cases — must remain `ok`, confirming the guard changed no accepted input. **That half of the verification is not performable until S7b lands**: this step's three new module-scope constants are free identifiers inside the harness's extracted `parseLocation`, so T-22/T-23 abort with a `ReferenceError` before asserting anything (§11 claims 36–37). Run S7's source edit and S7b's harness injection together, then verify both halves; a `ReferenceError` after S7 alone is expected and is not a defect in S7.

**Impact if wrong.** Cascading and silent if the guard is too strict: a `LOCATION_RE` that rejects a form `parseLocation` used to accept turns both `runGate` detectors inert for that form, which is the defect class the upstream plan's S6b exists to prevent. T-22's boundary cases are the guard against that, which is why they are named in the Verification field rather than left to the final run.

### S7b — Inject the workflow's regex declarations into the T-22/T-23 harness

**What changes.** S7 moves the location grammar into three module-scope constants — `LOCATION_RE`, `LOCATION_RANGE_RE`, `LOCATION_SECTION_RE` — and `parseLocation` now closes over all three. The T-22/T-23 harness at `tests/structural/check-structure.mjs` builds its subject by extracting *function declarations* as source text into `new Function`, injecting only `ROUND_CAP` and `LENSES`. The three constants are therefore free identifiers inside the extracted `parseLocation`, and the first call throws `ReferenceError: LOCATION_RE is not defined`, aborting the tier before T-22 or T-23 runs. S7's own Verification field — "T-22's nine assertions and T-23's seven must remain `ok`" — is unperformable until this is fixed.

In `tests/structural/check-structure.mjs`, add `reDecls` as the first element of the `gateFns` preamble array:

```js
const gateFns = new Function('parallel', [
  reDecls,                       // the workflow's own `const *_RE = /…/` lines (S3, :250)
  'const ROUND_CAP = ' + /const ROUND_CAP = (\d+)/.exec(wfSrc)[1],
  'const LENSES = []',
  declOf(wfSrc, 'function parseLocation('),
  declOf(wfSrc, 'function detectCorrectionFailure('),
  declOf(wfSrc, 'async function runGate('),
  'return { runGate, detectCorrectionFailure, parseLocation }',
].join('\n'))(() => { throw new Error('multiLens not exercised'); });
```

`reDecls` is **the binding S3 already creates** at `tests/structural/check-structure.mjs:250` — `const reDecls = (wfSrc.match(/^const \w+_RE = \/.*\/[gimsuy]*$/gm) || []).join('\n');` — declared at module scope well above the harness, so it is reused, not recomputed. Add a brief comment above the preamble recording why the line is there.

**Source.** The implementer's STOP REPORT at S7 (divergence category: blast radius beyond plan), verified independently at source and by reproduction; the single-source-of-truth rule from §3, which is S7's own governing standard.

**Why this approach.**
1. *Decision.* Inject the workflow's regex declarations into the harness preamble by **extracting them from `wfSrc`**, reusing S3's existing `reDecls` binding, rather than writing the three regex literals into the test file.
2. *Authoritative standard.* Single-source-of-truth / generation over duplication (§3; upstream plan §3 claim 27, "scripts that *generate* a derived surface are the fix"), and the existing `ROUND_CAP` idiom in the same preamble, which already derives a workflow constant from source rather than restating it.
3. *Why it applies here.* S7's entire purpose is to make the schema grammar and the detector grammar provably one object. Copying those regex literals into the harness would create a third hand-maintained copy of the grammar — inside the test that exists to prove there are not two. The extraction keeps the harness deriving from source, so a future grammar edit propagates to the harness automatically and cannot silently disagree with it. Reusing `reDecls` rather than writing a second matcher means there is also only one extraction expression, so S3's T-A2d loop and the harness cannot diverge in what they consider a regex declaration.
4. *What this is NOT — and why.* **Not injecting the three literals verbatim** — that is the duplication S7 exists to remove, one layer down, and it would pass while the workflow's own grammar changed underneath it. **Not a second extraction expression** for the harness: two matchers over the same pattern is the derived-surface drift the plan's D-3 already reasoned about. **Not widening `declOf`** to hoist arbitrary referenced identifiers: a general free-variable resolver is a small compiler, and getting it subtly wrong would silently change what T-22 and T-23 execute. **Not importing the module** — foreclosed for the reasons S4 already records. **Not deleting the `LOCATION_RE.test` guard from `parseLocation`** to remove the dependency: that guard is the binding property S7 delivers, and dropping it to satisfy a test harness is weakening the subject to fit the instrument.

**Dependencies.** S7 (which creates the three constants). Unblocks S9, and restores S7's own Verification field to performable.

**Verification.** T-22's nine assertions and T-23's seven return to `ok` — they cannot run at all before this step, so their green here is the step's result, not a precondition. Additionally confirm by reproduction that `parseLocation` resolves inside the harness: `'spec.md:271-273'` → `{file:'spec.md',start:271,end:273}`, `'spec.md:271'` → `{start:271,end:271}`, `'plan.md#s7'` → `{file:'plan.md',section:'s7'}`, and `'spec.md'` and `'a b.md:1'` → `null`. Confirm `reDecls` resolves to exactly three declarations; if it returns fewer, S7 wrote a declaration in a form the single-line matcher does not see, and that is a halt (see §15 G-2).

**Impact if wrong.** Contained but blocking. An empty or partial `reDecls` leaves the same `ReferenceError` and the tier still aborts — loud, not silent. The failure mode to watch is the opposite one: injecting literals instead of the extraction would make the harness green while the workflow's grammar drifted away from it, which is silent and is exactly the defect class F-3 belongs to.

### S8 — Fix F-5: correct the `EVIDENCE` comment

**What changes.** `workflows/expert-lifecycle.js:89`, replace `Additive: nothing is removed.` with a statement of what actually happened:

```js
// Additive in properties: `result` is retained but is no longer required —
// in the required set it is replaced by the two fields it was conflating.
```

**Source.** F-5 (Minor); Design by Contract (an in-source comment is a contract statement and is subject to the same accuracy requirement as the code).

**Why this approach.** Trivial: the comment's claim was re-derived from the `required` arrays in the same hunk and found inaccurate. The substantive change is correct and stays; only the description is corrected.

**Dependencies.** S5. Unblocks S9.

**Verification.** Read `workflows/expert-lifecycle.js` at the `EVIDENCE` schema and confirm the comment's claim matches the adjacent `required` array (`['claim_type', 'tool', 'citation', 'observed', 'asserted']`) and the `properties` object (which still declares `result`). No test asserts on comment text — see D-5 in §10.

### S9 — Re-run both tiers and confirm green for reasons that can fail

**What changes.** No files change. Run, from the plugin root:

```
node tests/structural/check-structure.mjs
node tests/unit/run-unit-tests.mjs
```

Both must print their PASSED banner and exit 0. Record the T-A2a, T-A2a-neg, T-A2d, and T-A2e lines verbatim in the implementation report, next to the S5 record, so the red→green transition of each new assertion is visible in one place.

**Source.** The review's Recommended Priority item 5.

**Why this approach.** Trivial: it is the confirmation run. Its value comes entirely from S5 having been performed first — without the recorded red state, this run is the same unearned green the review rejected.

**Dependencies.** S6, S7, S8.

**Verification.** Both tiers exit 0; the four new assertions print `ok`; the S5 record shows every one of them (except `T-A2a-neg`, whose subject is the fixture) previously printing `FAIL`.

**Impact if wrong.** Contained — a red tier here means a correction is incomplete and the implementer stops rather than delivering.

## 8. Divergences from existing patterns

**D-A. The syntax oracle diverges from the review's own recommended code (S1).** F-2 prescribes `node --input-type=module --check`; this plan uses a strict-mode wrapped-function-body compile instead. The standard justifying the divergence is the regression-detection principle itself: a check that cannot pass on correct code fails it as surely as one that cannot fail on broken code. Executed evidence in §11 claims 4–6 and 18–20. The upstream review is an input to this plan, not an authority above executed behaviour.

**D-B is withdrawn — it was not a divergence.** Earlier revisions of this plan listed T-A2a-neg's fixture-subject assertion here, on the premise that "every other assertion in `tests/structural/check-structure.mjs` targets a shipped file." The whole-document citation sweep (§11 claim 28) tested that premise instead of restating it, and it is **false**: the tier already carries three fixture-targeting assertions — `M-3 A-4b fabricating-implementer fixture parses` at `:254`, `M-3 A-4c contradictory spec fixture present` at `:255`, and `T-19 the A-4c fixture frames the contradiction as three-way` at `:376`. T-A2a-neg therefore *follows* an established convention rather than departing from one, and a divergence entry for it would have asked a reviewer to justify a departure that does not exist. The step is unchanged; only this section's claim about it is.

**No divergences remain.** S1's oracle, S2's fixture, S3, S4 and the three corrections all follow the file's existing conventions — `check(label, cond)` assertions, fixture-subject assertions as above, source extraction via `new Function`, and double-quoted literals for strings containing apostrophes. This section is retained rather than deleted because the withdrawal is itself the auditable record that the divergence question was asked and answered from source.

## 9. Checkpoints

Three, each at a trigger the process defines:

- **After S4b** — a step that is hard to reverse if it goes wrong, in the specific sense that matters: it edits a detector whose failure mode is silence. The checkpoint is the **three** demonstrations in S4b's Verification field: allowlist emptied → T-20 red; replacement assertion deleted on a scratch copy → T-20 red; restored → all five green, plus the grep confirming no literal `check('<baseline label>` survives. Do not proceed to S5 on the restored-green run alone — the first revision of S4b passed exactly that run while the allowlist was inert and a deleted check would have gone unreported.
- **After S5** — the boundary between the foundation correction (a repaired test tier) and the work that depends on it (the source fixes). This is a hard checkpoint: the expected failure set must match exactly in both directions, and a mismatch is a halt, not a note.
- **After S9** — the integration point where the repaired tier and the corrected source meet. Both tiers green with the S5 red record beside them is the plan's completion condition.

## 10. Decisions made during planning

**D-1. The review's recommended fix for F-2 is not adopted; the oracle is a strict-mode wrapped function body.** *Reasoning:* executed against a scratch copy of the workflow with F-1 patched, `node --input-type=module --check` reports `SyntaxError: Illegal return statement` at line 495. The workflow uses top-level `return` (`:688` at column 0) and top-level `await` (`:459`) — legal because the harness runs the body inside an async function (`skills/workflow-creator/SKILL.md:142–145` @ `4caccdb`, §11 claim 17), illegal under both the module and script goals. Adopting the snippet would replace a check that cannot fail with one that cannot pass; the predictable response to a permanently red gate is to weaken it, which reproduces F-2. Candidates were evaluated with Clear Thought `decisionframework` (decision id `parse-oracle`) against four criteria, every cell an executed result rather than a judgment:

| Candidate | Rejects F-1 | Accepts the top-level-`return`+`await` shape | Rejects the six strict-mode early errors | Pinnable by a negative fixture |
|---|---|---|---|---|
| `node --check` on the `.js` path (status quo) | **no** — exit 0 | yes (vacuously; green on everything) | **no** | no — a fixture would prove it cannot fail |
| `--input-type=module --check` (F-2's prescription) | yes | **no** — `Illegal return statement` at :495 | yes | yes, but unusable |
| Wrapped async body, sloppy (this plan, round 1) | yes | yes | **no** — 6/6 accepted | yes |
| **Wrapped async body + `"use strict"` (adopted)** | **yes** | **yes** | **yes — 6/6 rejected** | **yes** |

The six strict-mode cases, each executed in the file's own shape (`export` + top-level `return`) through both wrappers: octal literal `0755`, `with (o) {}`, duplicate parameter names `function f(a, a) {}`, `delete` of an unqualified identifier, assignment to `eval`, and the octal escape `'\101'`. All six are ACCEPTED by the sloppy wrapper and rejected by the strict one with the matching V8 diagnostic (§11 claim 19). The strict variant preserves every property the plan needs — it still rejects the current workflow and the S2 fixture, and still accepts both the F-1-patched workflow and a synthetic top-level-`return`-plus-`await` shape (§11 claim 20).

*A calibration note, stated rather than glossed:* the harness's own wrapper is documented as an async function but is **not** documented as strict, so the strict oracle is plausibly stricter than the runtime. That is the safe direction for a gate — it rejects a superset of genuine errors, and all six classes are constructs that should never appear in this file — but it is a deliberate asymmetry rather than an exact model of the runtime, and it is recorded here so a future maintainer meeting a strict-mode rejection knows it may be the oracle being conservative, not the harness refusing the file.

**D-8. S1's Gate-3 part 3 is grounded twice, so it does not depend on the harness premise alone.** *Reasoning:* the harness's evaluation shape is now verifiable by documentation read (§11 claim 17), but it is a claim about a component this plan does not control and cannot execute. Part 3 therefore also states the independent argument: of the three candidate goals, only the wrapped body both rejects the real defect and accepts the file's legitimate shape (§11 claims 5, 6, 18). If the harness documentation is ever superseded, the oracle choice still stands on the executed comparison. Recording this explicitly because the alternative — a single load-bearing premise about an external component, phrased as background — is precisely how the premise escaped verification in round 1 of this plan.

**D-2. The demonstration of failure is encoded as a fixture assertion, not left as a one-time manual run.** *Reasoning:* F-2's failure mode is structural incapacity to fail, not a missed demonstration. A manual red run proves the oracle works on the day it is run; it says nothing about the day someone simplifies it back to `node --check`. The negative fixture makes any such regression fail the tier immediately. The cost is one file that must never be "fixed," which the fixture's own header comment states in place. This is a judgment call about durability, made because the same class already reached delivery once.

**D-3. S3 discovers schema patterns from source rather than naming `LOCATION`.** *Reasoning:* F-4 is classified Systemic, and the review's own priority note warns that closing named instances leaves the class. A discovery loop plus an "exemplars must be declared for every discovered pattern" assertion means a future `pattern:` added without exemplars turns the tier red rather than passing unchecked. The cost is a line-shaped extraction regex, which constrains S7 to write both declarations on single lines — a constraint recorded explicitly in S7 rather than left implicit.

**D-4. No documentation file is edited.** *Reasoning:* `codegraph_find_related_docs` over the two changed files returns 34 docs, and the doc-sync rule says every returned doc gets a review step. The review was performed here rather than as steps: the corrections change no exported symbol, no documented behaviour, and no enumerated test ID. `tests/ACCEPTANCE.md:8`, the only doc naming the affected assertion, describes it as "T-A2a workflow valid+deterministic" — true before and after. Editing any of the other 33 (specs, architecture, prior plans, prior reviews) would also breach the dispatch's authorized touch set, and several are explicitly forbidden. Recorded as a decision rather than silently omitted so a reviewer can check the judgment against the tool output.

**D-5. No test asserts on the corrected comment text (S8).** *Reasoning:* a test that greps for comment wording is a change-detector — it fails on every legitimate rewording and verifies nothing about behaviour. F-5 is a Minor accuracy defect in a human-read statement; its verification is a read, and its recurrence is a review concern, not a tier concern. Asserting on it would add exactly the kind of brittle green the rest of this plan is built to remove.

**D-7. §16's parse-error criterion is scoped to the workflow rather than the fixture being hidden from CodeGraph.** *Reasoning:* S2 creates a permanently unparseable `.js` file, and CodeGraph scans it — `codegraph_list_files` returns `tests/fixture/project/greeter.js` among the seven JavaScript files, so the default ignores do not exclude `tests/fixture/` (§11 claim 21). An unscoped "any parse error is a finding" criterion would therefore fire on the correct end state. Two fixes were available. Hiding the fixture — renaming it to a non-scanned extension, or adding a custom `ignore_patterns` entry — was rejected: a `.txt` fixture would no longer be the thing under test (T-A2a-neg's whole point is that a *`.js` workflow file* in this shape is rejected), and a custom ignore list replaces CodeGraph's defaults entirely, which would silently drop coverage of everything else. Scoping the criterion to the file it is actually about, and naming the expected exception, keeps both signals intact and costs two clauses. This is the same defect shape as F-2 one level up — a check whose signal stops tracking the condition it names — so it is fixed the same way: by making the criterion say what it means.

**D-6. `parseLocation` is gated on `LOCATION_RE` rather than rewritten to use it directly.** *Reasoning:* the two forms have different capture arities (range: file/start/end; section: file/section), so a single derived regex would require restructuring a function the review verified correct — including its four executed boundary cases. A `LOCATION_RE.test` guard achieves the binding property that matters (the schema grammar and the detector grammar cannot accept different sets) at zero behavioural risk to code that is currently right. The residual duplication is the two capture-group regexes, which are now provably subordinate to the one grammar.

## 11. Verification of factual claims

**Population definition — what counts as a claim requiring an entry here.** Two rounds of review have found assertions that escaped this section, both times because they read as orienting context rather than as claims. The population is therefore defined mechanically rather than by judgment, and the definition is stated here so the next walk cannot under-scope:

> **Any sentence anywhere in this document that states what a file contains, where something is located, what is in scope, or how many of something there are — is a claim and needs an entry.** This explicitly includes: line numbers and line ranges cited in passing; counts of any kind; facts about the *test* files and this plan's own tooling, not only about the production code under change; the content of a document cited as a standard, as distinct from the standard's registration in §3; and two phrasings that do not present themselves as assertions and have each cost a review round:
>
> - **Reassurance phrasing** — any clause built on **"already", "untouched", "in scope", "unchanged", "still", "remains"**, whose grammatical job is to reassure. A boundary-free statement ("the linter block below it is untouched") asserts nothing and needs no entry; the moment it carries a range, it does.
> - **Attribution phrasing** — **any clause naming a section, decision, claim, step, finding, table, or count of a document other than this one** ("the upstream plan's D-8 names…", "the review marked twenty-two rows pass") is an assertion about that document's *content*, and reads as citation rather than claim. It needs an entry carrying a read of the cited region, exactly as a claim about source code does.

**Sweep scope — stated by section list so the definition and its execution can be compared.** The population is the whole document. The walk covers **§§1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13, 15 and 16** — every section that asserts. §11 and §14 are the registry and the register themselves and are swept only for internal consistency against the sections above. The walk runs in the assertion-to-list direction, never the reverse. Round 3 of review on this plan established that stating the population correctly is not sufficient if the execution is narrower than the statement: the round-2 sweep ran the content-citation half over §7 alone while the definition said "anywhere", and every claim that survived was a cross-document citation outside §7. The section list above exists so that a future attestation names what was covered and a reader can check the two against each other.

1. **`workflows/expert-lifecycle.js:57–59` contains an unescaped `'` inside a single-quoted literal** (S6). *File read:* `workflows/expert-lifecycle.js:55–60` read this session — line 58 is `  'The authoring skill's process rules are not the standard — judge the artifact, not the ' +`.
2. **`node --check` on the `.js` path exits 0 on a file carrying `export` plus that defect** (S1). *Test reproduction:* wrote `bad.js` containing `export const a = 1` and `const b = 'it's bad'`; ran `node --check bad.js` → `exit=0`. Node v22.16.0.
3. **The same source rejected under the module goal** (S1, D-1). *Test reproduction:* `node --input-type=module --check < bad.js` → `SyntaxError: Unexpected identifier 's'`, `exit=1`.
4. **`workflows/expert-lifecycle.js` uses top-level `return` and top-level `await`** (S1, D-1). *File read + reproduction:* `grep -n "^return" workflows/expert-lifecycle.js` → line 688 at column 0, read in place; `grep -n "^const .* = await"` → line 459, read in place. Reproduction: `node --input-type=module --check < patched.js` (a scratch copy with line 58's delimiter changed) → `SyntaxError: Illegal return statement` at line 495, `exit=1`.
5. **The wrapped-function-body oracle rejects the current file and accepts the patched one** (S1). *Test reproduction:* `new Function('return (async function(){' + src.replace(/^export /gm,'') + '\n})')` over both files → `current -> REJECTED: Unexpected identifier 's'`; `patched -> PARSE OK`. This is the sloppy-mode form, recorded because it is the comparison that established the *goal*; the form S1 adopts additionally carries `"use strict"` and was re-executed against the same two files with identical outcomes — claim 20.
6. **That oracle accepts a legitimate top-level-`return`-plus-`await` shape and rejects the fixture shape** (S1, S2). *Test reproduction:* same wrapper over `export const meta = …` + `const v = await Promise.resolve(1)` + `return v` → parses `true`; over `export const meta = …` + `function f(){…}` + `const s = 'it's bad'` + `return f()` → parses `false`.
7. **An independent parser also fails on the current workflow** (S6, corroborating F-1). *Structural trace:* `codegraph_scan` with `force: true` over `claude-plugins/expert-dev-tools` reports `parseErrors: 1`, the single entry being `workflows/expert-lifecycle.js: "Invalid argument"`. Admissible as corroboration of a parse failure, not as identification of the cause — claims 2–5 carry that.
8. **`workflows/expert-lifecycle.js:81` writes the location pattern as a single-quoted string whose escapes are consumed** (S7). *File read + reproduction:* line 81 read via `JSON.stringify` → `"const LOCATION = { type: 'string', pattern: '^[^\\s:#]+(?::\\d+(?:-\\d+)?|#\\S+)$' }"` (JSON doubling of single literal backslashes). Executed: the resulting `RegExp` has source `^[^s:#]+(?::d+(?:-d+)?|#S+)$`; `.test('spec.md:271-273')` → `false`; `.test('plan.md#s7')` → `false`.
9. **The regex-literal derivation produces a pattern that partitions correctly** (S7, T-A2d exemplars). *Test reproduction:* `new RegExp(/^[^\s:#]+(?::\d+(?:-\d+)?|#\S+)$/.source)` → `.test('spec.md:271-273')` `true`, `.test('plan.md#s7')` `true`, `.test('spec.md')` `false`, `.test('a b.md:1')` `false`.
10. **`parseLocation` at `workflows/expert-lifecycle.js:290–296` uses genuine regex literals and is correct; `LOCATION_RE` carries no `g` flag in the form S7 introduces** (S7, D-6). *File read:* lines 290–296 read this session — `/^([^\s:#]+):(\d+)(?:-(\d+))?$/` at :292 and `/^([^\s:#]+)#(\S+)$/` at :294, neither flagged.
11. **The T-A2a block occupies `tests/structural/check-structure.mjs:208–212`, and `wfSrc` is in scope at the T-22/T-23 harness** (S1, S3, S4). *File read:* lines 207–213 read this session (`const wf = join(ROOT, 'workflows/expert-lifecycle.js')` at :209, the `execFileSync … '--check'` line at :211, the `check(…)` at :212); lines 425–457 read this session, showing `declOf` and `const gateFns = new Function('parallel', [… /const ROUND_CAP = (\d+)/.exec(wfSrc) …])` consuming `wfSrc`.
12. **No documentation file goes stale** (§5, D-4) — a **content-absence** claim. This entry is the single statement of the sweep; §5's Documentation paragraph cross-references it rather than paraphrasing it, because round 2 of review on this plan found the two narrating it separately and disagreeing.

    *Candidate set:* `codegraph_find_related_docs` over the two changed files returns **34** documents, enumerated in §5 (blast radius = the two changed files; `codegraph_get_dependents` on `workflows/expert-lifecycle.js` returns `dependentCount: 0`, so nothing else is reachable).

    *Search that defined the hit set, executed 2026-08-09:*

    ```
    grep -rln "check-structure\|T-A2a\|LOCATION\|parseLocation\|EVIDENCE\|node --check\|NOT_THE_RULER\|valid JS" --include=*.md .
    ```

    over `claude-plugins/expert-dev-tools/` — deliberately a **superset** of the 34, so no candidate is outside its reach.

    *The partition, and why only one of its numbers is stable.* The run returned **22** files, of which **17** are under `docs/plans/` or `docs/reviews/` and **5** are live documents. **The first two counts drift and the third does not**: this repository adds one dated record to `docs/reviews/` per review round and one to `docs/plans/` per plan, so a reader re-running this grep on a later date will get a larger total and a larger dated-record count while the live set stays the same. Round 2 of review on this plan ran the identical grep one round earlier and got 21 and 16 — the one-file difference is that round's own review record, which did not yet exist. The reproducible form of this evidence is therefore the **rule**, not the totals: dated records under `docs/plans/` and `docs/reviews/` are excluded because each states what was true at its own date and none makes a current-state claim; everything else is read. Executed with that exclusion applied — `grep -rln <same pattern> --include=*.md . | grep -v "^./docs/plans/\|^./docs/reviews/"` — the result is exactly **5 files**, and that is the number a later reader reproduces.

    *Reads confirming no falsified statement, all five live documents, every hit read in place this session:*

    | Document | Hit lines | What is there | Falsified by S1–S8? |
    |---|---|---|---|
    | `README.md` | `:24` | `node tests/structural/check-structure.mjs` — a run command | no |
    | `README.md` | `:55` | asserts the tier checks the declared MCP server set contains `context7` | no |
    | `tests/ACCEPTANCE.md` | `:6` | the same run command | no |
    | `tests/ACCEPTANCE.md` | `:8` | "T-A2a workflow valid+deterministic" — a summary true before and after the oracle is replaced | no |
    | `docs/review-round-1.md` | `:115` | an M-1 finding describing the gate as `node --check` plus a banned-token regex | no — a dated record of that review's own state |
    | `docs/HANDOFF.md` | `:76` | records `EVIDENCE` gaining `observed`/`asserted` | no — that schema change stands; S8 changes only the comment above it |
    | `docs/behavioral-tier-findings.md` | `:21`, `:264`, `:267` | the B4 finding and its remediation record | no — same reason |

    *Candidates producing no hit.* Of the 34, the ones the search never reaches are the ten agent files, `commands/expert.md`, `docs/specs/spec-expert-dev-tools.md`, `docs/arch/architecture-expert-dev-tools.md`, `docs/investigate.md`, `docs/reviews/output-contract-generated-sections-round-05.md`, and `skills/expert-plan/references/output-contract.md` — **16** in total. Each references `workflows/expert-lifecycle.js` by path, which no step renames or moves.

    *Note on set membership.* `docs/HANDOFF.md` is a live document the sweep hits and this entry reads, but it is **not** among the 34 candidates — the search scope is a superset by design. Reading it is extra coverage, not an inconsistency, and the dispatch forbids editing it in any case.

    *Scope covered:* every `.md` file in `claude-plugins/expert-dev-tools/`.
13. **`RULER.architecture` and `RULER.plan` already use double-quoted literals for apostrophe-bearing strings** (S6). *File read:* `workflows/expert-lifecycle.js:42–43` read this session — `:42` `architecture: "the spec's requirements and the standards the architecture itself names",` and `:43` `plan: "the spec, the architecture, and the plan's own output contract",`. (Round 1 of this plan cited `:41–42` here and `:49–50` in S6; both were re-read and corrected — `:41` is the continuation of `RULER.spec`, and `:49–50` is the `OUTPUT_CONTRACT` comment block.)
14. **The `EVIDENCE` comment's "Additive: nothing is removed." sits at `workflows/expert-lifecycle.js:89`, above a `required` array that no longer lists `result` while `properties` still declares it** (S8). *File read:* `workflows/expert-lifecycle.js:82–99` read this session — comment at :89, `required: ['claim_type', 'tool', 'citation', 'observed', 'asserted']`, and `result: S_STR` present in `properties`.
15. **`tests/fixture/` contains `agents/`, `project/`, `spec/`, `transcripts/` and no `workflow/`** (S2). *File read:* directory listing of `tests/fixture/` this session.
16. **The governing output contract revision is the one at commit `94a640a`** (§ everything). *File read:* `git show 94a640a:claude-plugins/expert-dev-tools/skills/expert-plan/references/output-contract.md` read in full this session — sixteen sections, three gates, the derived-surface doctrine.
17. **The harness runs a workflow body inside an async function and takes its `return` value as the tool result** (S1 part 3, D-1, D-8). *Documentation read:* `skills/expert-plan/../../../skills/workflow-creator/SKILL.md` — repository-root path `skills/workflow-creator/SKILL.md`, **commit `4caccdb`** (last commit touching the file; working tree clean for it, `git status --porcelain` returns nothing). Lines 142–145 read this session: *"### Part 2 — the body (async JavaScript) / Everything after `meta` is the body. It runs inside an `async` function, so you `await` at the top level."* Line 159: *"The body's `return` value becomes the tool result handed back to Claude."* This is the authoritative in-repo contract for workflow files — the same skill whose `validate-workflow.mjs` the structural tier already invokes as "the canonical linter" at `tests/structural/check-structure.mjs:215`. It establishes that top-level `return` and top-level `await` are correct in this file, not defects. It does **not** state whether the wrapper is strict; that gap is addressed in D-1's calibration note, and S1's part 3 does not depend on it.
18. **Of the three candidate parse goals, only the wrapped body both rejects F-1 and accepts the legitimate shape** (S1 part 3, D-1, D-8). *Test reproduction:* the four-row table in D-1, every cell executed this session on Node v22.16.0 — `node --check` exit 0 on the defective shape; `--input-type=module --check` `Illegal return statement` at :495 on the patched copy; the wrapped body rejecting the current file (`Unexpected identifier 's'`) and accepting the patched one.
19. **The sloppy-mode wrapper accepts six classes of strict-mode early error that the strict wrapper rejects** (S1, D-1). *Test reproduction:* six minimal sources, each in the file's own `export`-plus-top-level-`return` shape, run through both wrappers this session. Sloppy: ACCEPTED 6/6. Strict, with the V8 diagnostic recorded for each: `0755` → "Octal literals are not allowed in strict mode."; `with (o) { }` → "Strict mode code may not include a with statement"; `function f(a, a) {}` → "Duplicate parameter name not allowed in this context"; `var x = 1; delete x` → "Delete of an unqualified identifier in strict mode."; `eval = 1` → "Unexpected eval or arguments in strict mode"; `const s = '\101'` → "Octal escape sequences are not allowed in strict mode."
20. **The strict wrapper preserves every property the plan requires of the oracle** (S1, S2, S5). *Test reproduction, this session:* strict wrapper against the current workflow → rejected (`Unexpected identifier 's'`); against the F-1-patched copy → ACCEPTED; against the S2 fixture text verbatim → rejected (`Unexpected identifier 's'`); against a synthetic `export` + top-level `await` + top-level `return` shape → ACCEPTED.
21. **CodeGraph scans `tests/fixture/` and holds a `.js` file from it in the graph** (§16 item 3, D-7, §13). *Structural trace:* `codegraph_list_files` with `language: javascript` after a `force: true` scan of the plugin returns `total: 7`, and the list includes `tests/fixture/project/greeter.js`. Admissible for exactly the structural fact it measures — which files the scan includes — which is what the §16 criterion turns on.
22. **T-22 declares nine assertions and T-23 seven** (S7 Verification, §12). *File read:* `grep -n "T-22\|T-23" tests/structural/check-structure.mjs | grep "check("` read in place this session — sixteen `check(` sites, at `:481, 483, 492, 503, 510, 511, 512, 513, 514` (nine T-22) and `:523, 524, 526, 529, 534, 536, 540` (seven T-23). Counted from the source rather than taken from the upstream review, which asserts the same two numbers.
23. **`workflows/expert-lifecycle.js` declares exactly one export, and exactly one schema `pattern`** (§16 item 2, §15 G-2). *File read:* `grep -n "^export" workflows/expert-lifecycle.js` → one hit, `:1`, `export const meta = {`, read in place. `grep -rn "pattern:" workflows/ tests/ scripts/` → one hit, `workflows/expert-lifecycle.js:81`, read in place. Both are content-absence claims of the compound kind: the searches defined the candidate sets (scope: the workflow, plus the tests and scripts trees for the pattern sweep), and the single hit in each was read.
24. **The structural tier's failure banner is `STRUCTURAL TESTS FAILED (n)`** (S5's expected output). *File read:* `tests/structural/check-structure.mjs:543` read this session — `` console.log(failures ? `\nSTRUCTURAL TESTS FAILED (${failures})` : '\nSTRUCTURAL TESTS PASSED'); ``, so the count is interpolated and S5's `STRUCTURAL TESTS FAILED (5)` is the literal expected form.

25. **`skills/expert-plan/references/testing-standards.md:91` states the regression-detection principle this plan cites as its ordering constraint** (§3 row 3; S1 part 2; S2 Source and part 2; S4 part 2; S5 Source and part 2; D-A — ten citations in all). *File read:* `git show 94a640a:claude-plugins/expert-dev-tools/skills/expert-plan/references/testing-standards.md` into the scratchpad, line 91 read verbatim this session: *"- **Regression tests** — every fixed bug gets a test that reproduces it first (fails on the broken code), then passes on the fix. A regression test that never failed has not demonstrated it can."* Cited by path **and commit `94a640a`**, the pinned revision. The plan's paraphrase — "a check must be demonstrated failing against the broken state before its green means anything" — is a faithful restatement of the second sentence, and the first sentence is what S5's placement (demonstration before correction, not after) implements. *Registered here because §3 registers the standard, not the content of the line*: a standard's presence in the registry is not evidence of what its cited line says, and this is the plan's most-cited claim.
26. **The workflow-creator linter block and the `declOf`/`gateFns` harness both exist in the test file and are outside the edited ranges** (S1's untouched-region statement; S4's "leave `declOf` and the `gateFns` construction unchanged"). *File read:* `tests/structural/check-structure.mjs:213–224` read this session — two comment lines at `:213–214`, `const linter = join(ROOT, '../../skills/workflow-creator/scripts/validate-workflow.mjs')` at `:215`, the `existsSync` branch at `:216–223` (closing brace at `:223`), and the `meta`-first assertion at `:224`. Round 2 of review on this plan found the earlier draft citing this block as "lines 213–222", which stopped one line short of the closing brace; S1 now states the boundary in prose without a range, so no range needs registering. The `declOf` function and the `const gateFns = new Function('parallel', […])` construction were read at `:433–457` (also covered by claim 11).
27. **`wfSrc` is declared at `tests/structural/check-structure.mjs:95`, above every insertion point this plan specifies** (S3, S4). *File read:* `grep -n "wfSrc *=" tests/structural/check-structure.mjs` → **exactly one hit**, `:95`: `const wfSrc = readFileSync(join(ROOT, 'workflows/expert-lifecycle.js'), 'utf8');`, read in place. `grep -n "wfSrc" | head -3` confirms `:95` is the first occurrence and the only assignment (next uses at `:124` and `:128`). This is a **structural-absence** claim of the compound kind for the "only assignment" half: the search defined the candidate set (every `wfSrc` assignment in the file), and the single hit was read. S3 inserts at approximately `:213` and S4 at approximately `:433`, both below `:95`, so the reference resolves. Registered because the earlier draft grounded this on a *use* site at `:450` — below S3's insertion point — which would have described a temporal-dead-zone `ReferenceError` had it been the declaration.

28. **The content this plan cites from `docs/plans/plan-expert-dev-tools-behavioral-remediation.md`** (§2 twice; §3's standards table; S3 part 4; S7 Source, part 2, part 4 and Impact; §12 T-A2d data; §13; §16 item 5). Working-tree file, cited by path and **date 2026-08-09**, unpinnable status stated. Grouped as one entry per the cited-document region, each half carrying its own read:
    - **Step count — 26.** `grep -cE "^### S[0-9]+[a-z]? "` → **26**; the enumeration is S1 … S23 plus S2b, S6b, S15b. Supports §2's "does not re-plan the 26-step behavioral remediation".
    - **Behavioural re-run cost — ~1.5 M subagent tokens.** `grep -n "1\.5 *M"` → `:45`, `:2799`, `:3067`; `:45` read in place: *"it costs ~1.5 M subagent tokens and is the…"*. Supports §2 and §16 item 5.
    - **§3 claim 27, the generation rule.** `grep -n "claim 27"` → `:89`, read in place: *"(claim 27, `cd2f27b`: \"Scripts that *generate* a derived surface are the fix; scripts that *audit* prose are the problem\")"*. Supports §3's registry row and S7's Source and part 2.
    - **D-1 and D-8.** `grep -n "^\*\*D-1\|^\*\*D-8"` → `:1677` and `:1761`, both read in place — D-1 is the correction-is-re-derivation decision whose third row names the "named instances close; the class resurfaces" shape S3 part 4 cites, and D-8 is *"This plan carries the defect class that fired the APS Fusion tripwire, and cannot eliminate…"*, the residual-risk record S7 part 4 cites.
    - **S6b part 5 and S22.** `grep -n "S6b part 5"` → `:67`, `:635`, `:2121`; `:635` read in place — *"S6b part 5 fixes: `path:start-end` or `path#section`"*, the grammar §12 T-A2d's exemplars are derived from and which S7's Impact and §13 cite. `grep -n "^### S22"` → `:1543`, read in place: *"S22 — Resolve B3 and B4 in the strengthening direction"*, supporting S7 part 4's statement that removing `LOCATION.pattern` would weaken a ruler S22 forbids weakening.

    All six re-derived from the upstream file this session and all six accurate; none required a correction.
29. **The content this plan cites from `docs/reviews/implementation-round-01.md`, the upstream review** (§2 three times; S1, S2, S5, S7 Sources; §8 D-A; §10 D-3 and D-6; §15 G-1 and G-2; §16 item 4). Working-tree file, cited by path and **date 2026-08-09**, unpinnable status stated. Grouped, each half with its read:
    - **The Upstream Contract Verification table — twenty-one data rows, twenty marked pass, one marked fail.** Rows extracted and their status cells listed this session: rows 1–20 all carry `pass` (row 7 `pass **as specified**, but see F-3`; row 20 `pass, with F-5`), row 21 `**fail**` for "Plan §1 goal". **This corrected §2, which said "twenty-two … marked pass"** — a count that matched neither the row total nor the pass total.
    - **F-2's prescribed fix.** Read at `:270–276` — the `execFileSync(process.execPath, ['--input-type=module', '--check'], { input: readFileSync(wf, 'utf8'), … })` block and its `check('T-A2a workflow: valid JS syntax (checked as a module)', syntaxOk)`. Supports D-A, D-1 and S1 part 4.
    - **The Recommended Priority note on class survival.** Read at `:383–384` — *"is precisely the failure mode this plan's §7 maintenance rule 4 and D-1's third row name as the dominant one (\"the named instances close; the class resurfaces elsewhere next round\")"* — and at `:517–519`, the ordering instruction S5's Source cites. Supports D-3 and S5.
    - **The four executed boundary cases.** Read at `:138` and `:488` — *"executed nine T-22 assertions incl. all four boundary cases and the false-positive guard"*, and the enumeration *"fully inside, partially overlapping, exactly adjacent, different file"*. Supports D-6 and S7's Verification.
    - **Tentative finding T-1.** Read at `:438` — *"T-1 (tentative) — whether F-3's consequence is total gate failure or a dormant contract defect."* Supports §2's exclusion and G-1.
    - **The review's own `pattern:` sweep.** Read at `:330–332` — the sweep reporting **1** occurrence at `:81` over the workflow and the same single line over `workflows/`, `tests/` and `scripts/`. Supports G-2's "matching the review's own sweep".
    - **The 27-file inventory.** Read at `:54` — *"Constructed from the plan's §5 Files-affected table (Created + Modified). All 27 verified."* — and at `:532`, *"review's full 27-file inventory"*. Supports §16 item 4. (The review's inventory is written as 13 bullets, several covering groups — the ten agents in one, the seven skills in another — so 27 is the review's own stated file total, not a bullet count.)

    Six of the seven were accurate as cited; the seventh (the table row count) was not, and §2 is corrected above.

30. **T-20's anti-weakening guard sits at `tests/structural/check-structure.mjs:444–456` and reports a replaced label as a deleted check** (S4b, S5, §13). *File read:* lines 435–457 read this session. `:444` `const oldChecks = baseline('tests/structural/check-structure.mjs');`; `:446` harvests baseline labels with `[...oldChecks.matchAll(/check\(\s*[`'"]([^`'"]{8,60})/g)].map((m) => m[1])`; `:448–451` the comment explaining the rename normalizer, in its own words *"A RENAMED label is not a removed check … Normalize the cardinality word before comparing, so the oracle measures 'was a check deleted', not 'was a label edited'"*; `:452` `const norm = (s) => s.replace(/\b(nine|ten|eleven|\d+)\b/g, '#');` — **cardinality words and digits only**; `:453` builds the `present` set of normalized current labels; `:454` `const gone = labels.filter((l) => !src.includes(l) && !present.has(norm(l)));`; `:455` the assertion; `:456` logs the offending labels.
31. **The guard reports S1's substitution as a deletion — reproduced, not taken from the STOP report** (S4b, S5). *Test reproduction, this session:* ran `:452`'s `norm` and `:453–454`'s predicate over the baseline label `'T-A2a workflow: valid JS syntax'` (31 characters, inside the 8–60 capture window) against a current source containing S1's and S2's labels. Results: `src.includes(old)` → `false`; `norm(old)` → `"T-A2a workflow: valid JS syntax"` unchanged, since the label contains no cardinality word or digit; `present` → `['T-A2a workflow: parses as a workflow body (strict)', 'T-A2a-neg the parse oracle REJECTS a known-broken workflow (']`; `present.has(norm(old))` → `false`; therefore **reported as gone → `true`**, and T-20 fails. The implementer's STOP REPORT is accurate; this entry rests on the re-execution, not on the report.
32. **T-20's baseline is `git show HEAD:…`, not the working tree** (S4b, S5, §13). *File read:* `tests/structural/check-structure.mjs:426–429` — `const baseline = (p) => { try { return execFileSync('git', ['show', \`HEAD:claude-plugins/expert-dev-tools/${p}\`], { cwd: ROOT, encoding: 'utf8' }); } catch { return null; } };`. Two consequences the plan depends on: the comparison is against the last commit, so uncommitted S1–S4b edits are the "current" side and the pre-S1 state is the baseline throughout this plan's execution; and once these changes are committed, the allowlist entry stops being load-bearing for *that* baseline but remains correct and is retained, because `REPLACED_BY_STRENGTHENING` is honoured only when the replacement label is present and is inert otherwise.

33. **The `currentSrc.includes(l)` short-circuit is pre-existing, and was benign only while no baseline label appeared in the file as data** (S4b, §13). *File read:* the guard's original form at `tests/structural/check-structure.mjs:454` — `const gone = labels.filter((l) => !src.includes(l) && !present.has(norm(l)));` — read this session. The raw substring test predates this plan; it is part of the guard as shipped. Its false-negative was unreachable while every occurrence of a baseline label in the file was itself a `check(` call, because then the textual and structural tests agree. S4b's allowlist is the first construct to write a baseline label into the file as **data**, which is what makes the latent disjunct reachable. The defect is therefore neither purely pre-existing nor purely introduced: a dormant weakness activated by this step's data.
34. **The first revision of S4b wrote the baseline label into the file at three sites, and the guard reported present because of them** (S4b). *File read + test reproduction, this session:* `grep -n "T-A2a workflow: valid JS syntax" tests/structural/check-structure.mjs` → three hits, `:459` (the allowlist's `was:` field), `:490` and `:493` (T-A2f's first-argument arrays). Executed against the live file: `src.includes('T-A2a workflow: valid JS syntax')` → **`true`**, so `goneFrom`'s first disjunct returns `false` before `supersededBy` is ever consulted; and the structural test `here.has(norm(l))` → **`false`**, with no capture in `check(` position containing `valid JS syntax`. The allowlist was inert, and T-20's green did not depend on it. The implementer's STOP REPORT is accurate; this entry rests on the re-execution.
35. **The structural-presence predicate holds in all eight probed directions** (S4b part 3, §12 T-A2f). *Test reproduction, this session:* a probe written with the `Write` tool (not a heredoc — round-2 recorded a shell-escaping hazard that silently corrupted a probe) and run on Node v22.16.0 against the live file, with T-A2f's literal-bearing cases stripped to model the amendment. Results, all as required: allowlist honoured → not gone; allowlist emptied → **gone (red)**; replacement assertion deleted → **gone (red)**; genuine deletion of another check → gone; label present only as data → gone; untouched label → not gone; T-A2f case 2 via the assembled source → not gone; T-A2f case 3 via the assembled source → gone. Two text checks confirmed the construction: the amended text contains no literal `check('T-A2a workflow: valid JS syntax`, and no capture in `check(` position anywhere contains `valid JS syntax`.

36. **`parseLocation` had no free module-scope variables before S7 and has three after — the premise claim 11 did not carry** (S7, S7b, §13). *File read, this session:* at the pre-S7 form (`workflows/expert-lifecycle.js:290–296` as recorded in claim 10) the function's body used only regex **literals** written inline, so the extracted declaration was self-contained and `declOf` could lift it into `new Function` with no preamble beyond `ROUND_CAP` and `LENSES`. At the post-S7 form, read this session: `:81` `const LOCATION_RE = /^[^\s:#]+(?::\d+(?:-\d+)?|#\S+)$/`, `:291` `const LOCATION_RANGE_RE = /^([^\s:#]+):(\d+)(?:-(\d+))?$/`, `:292` `const LOCATION_SECTION_RE = /^([^\s:#]+)#(\S+)$/`, and `:293–301` `parseLocation` referencing all three (`:295` `if (!LOCATION_RE.test(loc)) return null`, `:296` `LOCATION_RANGE_RE.exec(loc)`, and the section form below). `grep -n "^const [A-Za-z_]*_RE = /"` returns exactly those three lines and no others. **This is the premise S7 needed and did not state:** the plan verified what `parseLocation` *contains* (claims 10, 9) and never asked what it *depends on* after the refactor — the same shape as Q-34, one step later.
37. **The harness's `new Function` construction succeeds and the failure is deferred to call time** (S7b). *Test reproduction, this session:* built `gateFns` exactly as `tests/structural/check-structure.mjs:548–555` does, against the post-S7 workflow, with no `reDecls` injection. Construction returned normally — free identifiers in a function body are not early errors — and the first `parseLocation('spec.md:1-2')` threw `ReferenceError: LOCATION_RE is not defined`. That is why the tier aborts mid-run rather than reporting a failed assertion: the throw is uncaught at module top level, so T-22 and T-23 never execute and nothing marks them failed.
38. **`reDecls` at `tests/structural/check-structure.mjs:250` already captures exactly the three declarations the harness needs** (S7b). *File read + test reproduction:* `:250` read this session — `const reDecls = (wfSrc.match(/^const \w+_RE = \/.*\/[gimsuy]*$/gm) || []).join('\n');`, declared at module scope above both the T-A2d loop at `:254` and the `gateFns` construction at `:548`, so it is in scope at the injection point and needs no recomputation. Executed against the post-S7 workflow: three declarations captured, being `LOCATION_RE`, `LOCATION_RANGE_RE`, `LOCATION_SECTION_RE`. Executed with `reDecls` injected as the preamble's first element: `parseLocation('spec.md:271-273')` → `{file:'spec.md',start:271,end:273}`; `'spec.md:271'` → `{start:271,end:271}`; `'plan.md#s7'` → `{file:'plan.md',section:'s7'}`; `'spec.md'` and `'a b.md:1'` → `null`; and `detectCorrectionFailure`'s boundary behaviour intact (fully-inside fires, exactly-adjacent does not, different-file does not).
39. **S4b's Direction B is unobservable as this plan first specified it** (S4b Verification). *Test reproduction, this session:* T-A2f derives `OLD_LABEL`/`NEW_LABEL` from `REPLACED_BY_STRENGTHENING[0]`, so emptying that array throws `TypeError` on `[0].was` before any assertion executes — the demonstration crashes rather than showing T-20 red, and observes nothing about the guard. Replacing `supersededBy` with an empty `Map` while leaving the array in place isolates the same variable and keeps label derivation working: `arr[0].was` still yields the label and `supersededBy.get(OLD_LABEL)` returns `undefined`. S4b's Verification field is corrected to the map form.

**§11 re-derivation, and the class this closes.** Round 1 of review on this plan found two load-bearing assertions in the Plan section with no entry here, and classified it Systemic: assertions phrased as established background survive a sweep run over §11's own list. The fix applied was the cross-walk in the other direction — every factual assertion in §§1–10, 12, 13, 15 and 16 was walked against this list, not the reverse. That pass added entries 17–24 and removed one assertion outright: §4's former parenthetical "17 sites inside the phase router" is deleted rather than registered, because `grep -c "^  return "` returns 17 but counts every two-space-indented `return` in the file, including those inside function declarations — the number does not measure what the phrase claimed, and the claim carried no weight in any step. Deleting an unverifiable ornament is the contract-correct disposition; registering a number that does not measure its own description would have been worse than omitting it.

**Citation identity.** `workflows/expert-lifecycle.js`, `tests/structural/check-structure.mjs`, and `tests/fixture/` are inside the artifact under change and are cited by path and line range. `skills/expert-plan/references/output-contract.md` and `references/testing-standards.md` are outside it and are cited by path **and commit `94a640a`**; `skills/workflow-creator/SKILL.md` is outside the plugin entirely and is cited by path **and commit `4caccdb`**, with its working-tree-clean status stated. `docs/reviews/implementation-round-01.md`, `docs/reviews/plan-impl-remediation-r1-round-01.md`, and `docs/plans/plan-expert-dev-tools-behavioral-remediation.md` are working-tree files outside version control at their current content; they are cited by path and date (2026-08-09), with unpinnable status stated. Node behaviour is cited by executed reproduction on Node v22.16.0.


## 12. Test specifications

Four specifications. All are assertions inside the existing structural tier (`tests/structural/check-structure.mjs`), which is a static/structural test level: it runs no agents and spends no tokens.

**T-A2a — the workflow parses under the goal the harness executes it in.**
1. *Behavior verified:* `workflows/expert-lifecycle.js` contains no ECMAScript syntax error, evaluated as a **strict-mode** wrapped async function body — the grammar that accepts the file's legitimate top-level `return`/`await` while still rejecting the strict-mode early errors that module code cannot contain. Traces to S1 and to F-2.
2. *Level:* structural/static, executed in-process. The subject is a grammar property of one file, so no runtime, no I/O, and no other component participates.
3. *Real/double boundary:* fully real — the subject is the shipped file read from disk, and the parser is V8's own via `new Function`. No doubles.
4. *Data:* the workflow file's own bytes, via `readFileSync(wf, 'utf8')`.
5. *Must NOT assert:* that `node --check` exits 0 (demonstrated meaningless for this file), nor anything about the file's content or behaviour. *Fails when:* the source contains any syntax error illegal in a strict function body — demonstrated by S5 against F-1, and permanently by T-A2a-neg.

**T-A2a-neg — the parse oracle rejects a known-broken workflow.**
1. *Behavior verified:* T-A2a's oracle is capable of failing. Traces to S2 and to F-2's core claim.
2. *Level:* structural/static.
3. *Real/double boundary:* the oracle under test is real. `tests/fixture/workflow/broken-syntax-workflow.js` is a **fake** in the Meszaros taxonomy — a working stand-in for a workflow file, simplified but of the same kind. Justification: the real production input for "a broken workflow" is a defect, and defects cannot be kept in the shipped file. The production component contractually obliged to supply the real input is `workflows/expert-lifecycle.js` itself, whose obligation to be parseable is asserted by T-A2a against the real file — so the fake stands in only for the *broken* case, never for the passing one, and the obligation it mirrors is written and asserted one line above.
4. *Data:* the fixture's own bytes. Its defect is the exact F-1 shape (`export` + top-level `return` + an unescaped apostrophe), chosen because that combination is what made the original gate blind — not shaped backward from the assertion.
5. *Must NOT assert:* the specific `SyntaxError` message (a V8-version-coupled change detector), nor anything about the shipped workflow. *Fails when:* the fixture becomes parseable, or the oracle stops rejecting unparseable input.

**T-A2d — every schema `pattern` in the workflow is a constructible regex that partitions its grammar.**
1. *Behavior verified:* each `pattern:` string declared in the workflow's schemas constructs as a `RegExp`, matches known-good instances of the grammar it encodes, and rejects known-bad ones. Traces to S3, F-3, and F-4 instance (b).
2. *Level:* structural/static with in-process evaluation. The pattern is a declarative value, so the behaviour is fully determined by the value; no integration level is needed.
3. *Real/double boundary:* fully real — the pattern expression is evaluated **from the workflow's own source text** (via `new Function` over the extracted declarations), so the string-escape resolution that caused F-3 is reproduced exactly rather than bypassed. No doubles. A re-typed copy of the pattern in the test would be a double for the production value and is explicitly rejected in S3.
4. *Data:* exemplars in `PATTERN_EXEMPLARS`, per ISO/IEC/IEEE 29119-4 equivalence partitioning. For `LOCATION`, in-partition: `spec.md:271-273` (range), `spec.md:271` (single line, the range's degenerate case), `plan.md#s7` (section). Out-of-partition: `spec.md` (no locator), `a b.md:1` (whitespace in path — the `[^\s:#]` boundary), `spec.md:x` (non-numeric line). Derived from the grammar the upstream plan's §7 S6b part 5 mandates, not from what the current pattern happens to accept.
5. *Must NOT assert:* that the pattern's text equals an expected string (a change detector that fails on every legitimate grammar edit while proving nothing about matching). *Fails when:* a pattern is unconstructible, rejects an in-partition location, accepts an out-of-partition one, or is declared in the workflow without exemplars.

**T-A2e — the whole workflow compiles before `runGate` is extracted from it.**
1. *Behavior verified:* the T-22/T-23 execution path cannot report green over a workflow that cannot load as a whole. Traces to S4 and F-4 instance (c).
2. *Level:* structural/static, sited immediately before the extraction harness so its failure precedes and explains any downstream extraction error.
3. *Real/double boundary:* fully real — `wfSrc` is the shipped file's text, already read by the tier. No doubles. (The `reviewFn`/`remediateFn` stubs of T-22/T-23 are out of this specification's scope and are unchanged.)
4. *Data:* the workflow file's own bytes.
5. *Must NOT assert:* anything about `runGate`'s behaviour — that is T-22/T-23's subject, and duplicating it here would couple this assertion to gate logic it is meant to be independent of. *Fails when:* the workflow as a whole does not compile, even though the three extracted declarations would.

**T-A2f — T-20's deletion guard still reports a genuine deletion after the allowlist is added.**
1. *Behavior verified:* the `goneFrom` predicate reports a baseline label that is absent and unreplaced, does **not** report one whose declared replacement is present, and **does** report one whose declared replacement is itself absent. Traces to S4b, and to the requirement that a detector edit preserve the detector's failure mode.
2. *Level:* structural/static, executed in-process. The subject is a pure predicate over two strings, fully determined by its inputs.
3. *Real/double boundary:* the predicate under test is **real and shared** — T-A2f calls the same `goneFrom` the live T-20 assertion calls, never a copy, so the test cannot pass over a rotted guard. The two string arguments are **dummies** in the Meszaros sense: minimal synthetic sources standing in for baseline and current file text. Justified because the property under test is the predicate's decision rule, and using the real multi-hundred-line files would make the three cases depend on unrelated file content. No production component is obliged to supply these inputs — they are test data, not a stand-in for a collaborator's output, so no production obligation is named or needed.
4. *Data:* four pairs chosen by equivalence partitioning over the predicate's decision space (ISO/IEC/IEEE 29119-4): absent-and-not-allowlisted; absent-but-allowlisted-with-replacement-present; absent-and-allowlisted-but-replacement-also-absent; and present-as-data-only, which is the fourth partition the first revision of this spec missed and which corresponds to the defect that halted implementation. The deleted-label case uses a real baseline label (`'T-A2a workflow: meta is the first statement'`) so it exercises a string the guard genuinely sees. **Every synthetic source is assembled at runtime via `asCheck`, and the two real labels are read from `REPLACED_BY_STRENGTHENING` rather than retyped** — a literal `check('<label>` written as test data lands in the same file-wide capture the predicate scans, which is precisely how the first revision made its own allowlist unreachable. None of the data is shaped backward from the assertions; the partition comes from the predicate's branches.
5. *Must NOT assert:* the contents of `REPLACED_BY_STRENGTHENING` (a change-detector on a list expected to grow), nor that `gone` is empty for the real files (that is T-20's own assertion, and duplicating it here would couple this test to the repository's commit state). *Fails when:* the allowlist is broadened enough to swallow a real deletion; when the replacement-presence condition stops being structural, so a replacement's own deletion goes unreported; when a textual `includes` disjunct is reintroduced ahead of the structural test; or when `goneFrom` stops being the function the live guard uses.

**Existing tests that must not regress:** T-22 (nine assertions, including the four boundary cases and the false-positive guard) and T-23 (seven assertions, including the fail-closed string check) are named in S7's Verification field because `parseLocation` is the shared surface between S7's change and their subject.

## 13. Risks

- **Hardest step: S7.** It is the only step that changes executable logic (the `LOCATION_RE.test` guard in `parseLocation`). A guard stricter than the previous behaviour would silently disable both `runGate` detectors for the excluded form — the exact class the upstream plan's S6b exists to prevent. Mitigated by naming T-22's boundary cases in S7's Verification field rather than deferring them to S9. *Bounded on inspection:* the language `LOCATION_RE` accepts is the union of the languages the two capture regexes accept — `[^\s:#]+` followed by either `:\d+(?:-\d+)?` or `#\S+`, character-identical on both sides — so the guard is a no-op with respect to accepted inputs and the risk is smaller than "changes live gate logic" suggests. It stays the hardest step because it is the only one where a transcription slip would be silent rather than loud.
- **S4b edits a detector, which is the riskiest kind of change this plan makes — demonstrated, not hypothesised.** T-20's job is to notice silent weakening, so weakening T-20 is uniquely self-concealing. The first revision of S4b did exactly that: it reported green while its own allowlist was unreachable and a genuinely deleted check would have gone unreported, and it took a probe of the guard's own predicate to see it. Four properties bound the amended form, each an executed probe result (§11 claim 35): presence is structural, so data occurrences do not count; the allowlist has one entry matched on full exact labels; the exemption is conditional on the replacement being live *in call position*, so deleting a replacement re-arms the guard; and T-A2f exercises the live predicate rather than a copy. The residual risk is a future maintainer adding a loose entry or reintroducing a textual `includes`; the `why` field on each entry and T-A2f's four cases are what make either visible.
- **A refactor that adds module-scope state changes what the harness must inject.** The T-22/T-23 harness lifts function *declarations* into `new Function`; anything a lifted function closes over must be injected alongside it. S7 added three constants and S7b injects them. Any future step that gives `parseLocation`, `detectCorrectionFailure`, or `runGate` a new free identifier inherits the same obligation, and the failure is a call-time `ReferenceError` that aborts the tier rather than a failed assertion — loud, but easy to misread as unrelated breakage.
- **Test data that looks like source is a hazard in this file specifically.** T-20 scans the whole file for `check(` call sites, so any string literal containing `check('…` — in a test argument, an allowlist field, or an example in a comment — enters the scanned population. This is why S4b assembles its synthetic sources at runtime. Anyone adding cases to T-20 or T-A2f later must do the same.
- **T-20 compares against `git show HEAD`, not the working tree** (§11 claim 32). While S1–S8 are uncommitted, the baseline is the pre-S1 state — which is what makes S5's demonstration meaningful. After these changes are committed the baseline moves forward and the allowlist entry becomes inert, correctly and by design, rather than needing removal.
- **Known interaction between S2 and the repository's structural tooling.** The negative fixture is a permanently unparseable `.js` file inside a tree CodeGraph scans (`tests/fixture/project/greeter.js` is already in the graph — §11 claim 21), so every future `codegraph_scan` of this plugin will report `parseErrors: 1` by design. §16 item 3 scopes the completion criterion accordingly, and D-7 records why the fixture is not hidden instead. Anyone reading a raw scan result for this plugin should expect that one error and check its path before treating it as a defect.
- **S3's extraction is line-shaped.** It matches single-line declarations only. If a future schema declares `pattern:` across multiple lines, that pattern is silently not discovered. Partially mitigated by the `at least one schema pattern was found` assertion (which catches total extraction failure but not a partial miss); fully closing it needs a parser, which is disproportionate here. Recorded as a gap in §15.
- **Assumption to validate early:** that the four new assertions actually go red on the two live defects. S5 is that validation, and it is placed before any correction precisely so the assumption cannot survive unchecked.
- **Coupling hotspots.** `workflows/expert-lifecycle.js` is the plugin's entire control plane, but `codegraph_get_dependents` reports zero importers and the graph holds seven JavaScript files total — the structural coupling is low; the *semantic* coupling (every phase and gate lives in this one file) is what makes S6 and S7 high-stakes despite touching few lines.
- **Points of no return:** none. Every change is a small edit to two files plus one new fixture; `git checkout` recovers any step.
- **Where adjustment is most likely:** S5's expected failure set. If the observed set differs, the correct response is a halt and a diagnosis, not an adjustment of the expectation to match — an expectation edited to fit observed output is how a detector gets quietly weakened.

## 14. Question register

| # | Question | Step | Bin | Disposition |
|---|---|---|---|---|
| Q-1 | Does `node --check` really pass over a syntax error when `export` is present? | S1 | 1 (engineering) | Answered by reproduction — §11 claim 2, `exit=0`. |
| Q-2 | Is the review's recommended `--input-type=module --check` fix correct for this file? | S1 | 1 | No. Answered by reproduction — §11 claim 4, `Illegal return statement` at :495 on the patched copy. Incorporated as D-1 and divergence D-A. (Round 1 of review on this plan found the narrative also occupying §4, whose contract requires an owner's resolution; §4 is now correctly marked not applicable.) |
| Q-3 | What parse goal does the workflow actually satisfy? | S1 | 1 | A wrapped async function body. Derived from `export` at :1, top-level `return` at :688 and top-level `await` at :459 (§11 claim 4), confirmed by reproduction (§11 claims 5–6) and by the documented harness contract (§11 claim 17). |
| Q-4 | Should the failure demonstration be a one-time run or a standing assertion? | S2 | 1 | Standing assertion over a negative fixture. Answered by reasoning from `testing-standards.md:91` against F-2's *incapacity-to-fail* character; recorded as D-2. |
| Q-5 | Should T-A2d name `LOCATION` or discover patterns from source? | S3 | 1 | Discover, plus an exemplars-must-exist assertion. Answered from F-4's Systemic classification and the class-vs-instance rule; recorded as D-3. |
| Q-6 | How does the test obtain the pattern value without loading the module? | S3 | 1 | Extract the single-line declarations from `wfSrc` and evaluate them via `new Function`, mirroring the tier's existing `declOf`/`gateFns` technique at `tests/structural/check-structure.mjs:433–457` (§11 claim 11). |
| Q-7 | Does S3's extraction constrain how S7 writes the declarations? | S3, S7 | 1 | Yes — both must be single-line. Recorded explicitly in S7's "What changes" rather than left implicit. |
| Q-8 | Should the extraction harness be replaced with a real module import? | S4 | 1 | No. `await import()` would execute the lifecycle at top level. Answered from the review's own analysis of instance (c) and the workflow's top-level structure; recorded in S4 part 4. |
| Q-9 | Should `parseLocation` be rewritten from `LOCATION_RE`'s capture groups or gated on it? | S7 | 1 | Gated. Different capture arities; the review verified the current function correct including four boundary cases. Recorded as D-6. |
| Q-10 | Does `LOCATION_RE.test` introduce `lastIndex` statefulness? | S7 | 1 | No — no `g` flag. §11 claim 10. |
| Q-11 | Should F-5's comment be guarded by a test? | S8 | 1 | No. A comment-text assertion is a change detector. Recorded as D-5. |
| Q-12 | Do any of the 34 related docs need editing, and would editing them breach the touch set? | §5 | 1 | None needs editing (§11 claim 12); several are explicitly forbidden by the dispatch. Recorded as D-4. |
| Q-13 | Does `tests/ACCEPTANCE.md` enumerate T-A2a in a way the oracle change staleness? | §5 | 1 | No — line 8 reads "T-A2a workflow valid+deterministic", true before and after. §11 claim 12. |
| Q-14 | Which revision of the output contract governs, given the working tree carries a modified copy? | §1 | 1 | Commit `94a640a`, per the dispatching instruction. Read in full this session (§11 claim 16) and pinned in §1. |
| Q-15 | Can tentative finding T-1 (harness enforcement of schema `pattern`) be closed here? | §2 | 3 (gap) | No — it requires a live paid agent dispatch. Closed into §15 with attempt evidence. |
| Q-16 | Does S3's line-shaped extraction risk silently missing a multi-line pattern? | S3 | 3 (gap) | Yes, partially. Attempt and residual risk recorded in §15 and §13. |
| Q-17 | Is any part of the requested five-finding scope being narrowed? | §2 | 1 | No. All five findings map to steps in §2's coverage table; the only non-scope item is T-1, which was never in scope. No bin-2 escalation arises. |
| Q-18 | Is the harness's evaluation shape verifiable, or is it a gap? | S1, D-1 | 1 | Verifiable. `skills/workflow-creator/SKILL.md:142–145,159` @ `4caccdb` states the body runs inside an `async` function and its `return` value is the tool result — §11 claim 17. Registered rather than left as background. |
| Q-19 | Does S1's part 3 survive if the harness premise is ever falsified? | S1, D-8 | 1 | Yes. The executed three-goal comparison (§11 claims 5, 6, 18) is sufficient on its own; part 3 now states both grounds. Recorded as D-8. |
| Q-20 | Is a bare `new Function` body strict or sloppy, and does it matter? | S1 | 1 | Sloppy, and it matters — six classes of strict-mode early error pass it (§11 claim 19). Closed by adding `"use strict"` to the oracle; the strict variant preserves all four required properties (§11 claim 20). |
| Q-21 | Is the harness's own wrapper strict? | S1, D-1 | 3 (gap) | Undocumented. `skills/workflow-creator/SKILL.md` states the wrapper is an `async` function but says nothing about strictness; no other in-repo source does. Closed into §15 as G-3 with its attempt evidence and the reason the asymmetry is safe. |
| Q-22 | Does S2's fixture collide with any repository tooling? | S2, §16 | 1 | Yes, with `codegraph_scan` — it scans `tests/fixture/` (§11 claim 21), so the fixture will register as a permanent parse error. Closed by scoping §16 item 3 to the workflow and naming the expected exception; alternatives weighed in D-7 and the interaction recorded in §13. |
| Q-23 | Are T-22's and T-23's assertion counts, cited in S7's Verification field, this plan's own measurement or the upstream review's? | S7, §12 | 1 | Now this plan's own — counted from `check(` sites at nine and seven, §11 claim 22. They agree with the upstream review, but agreement was confirmed rather than assumed. |
| Q-24 | Does the "17 sites inside the phase router" count measure what it claims? | §4 | 1 | No. `grep -c "^  return "` returns 17 but counts every two-space-indented `return`, including those inside function declarations. The parenthetical is deleted rather than registered; see the re-derivation note in §11. |
| Q-25 | Does §3's registration of `testing-standards.md:91` also verify what that line says? | §3, S1–S5 | 1 | No — registering a standard and reading its cited line are different acts, and the plan cites this line ten times. Read verbatim @ `94a640a` and registered as §11 claim 25; the paraphrase is faithful. |
| Q-26 | Where does the workflow-creator linter block actually end? | S1 | 1 | At `:223`, the closing brace of the `existsSync` branch (`:224` is the `meta`-first assertion). The earlier draft said `:222`. Rather than correct the range, S1 now states the boundary in prose without one — a boundary-free statement asserts nothing and cannot drift. §11 claim 26. |
| Q-27 | What establishes that `wfSrc` is in scope at S3's and S4's insertion points? | S3, S4 | 1 | The declaration at `tests/structural/check-structure.mjs:95` — the only assignment in the file, and above both insertion points. The earlier draft cited a *use* site at `:450`, below S3's insertion point, which would have described a temporal-dead-zone `ReferenceError` had it been the declaration. §11 claim 27. |
| Q-28 | Are the doc-sweep's counts reproducible by a later reader? | §5, §11 | 1 | The total and the dated-record count are **not** — `docs/plans/` and `docs/reviews/` each gain a file per round, so the totals drift by construction (re-executing this round returned 22/17 where the prior round's reviewer got 21/16, the difference being that round's own review record). The live-document count of 5 is stable. Claim 12 therefore states the exclusion **rule** as the reproducible form and dates the execution, rather than presenting drifting totals as the evidence. |
| Q-29 | Why did two sweep passes fail to catch assertions phrased as reassurance? | §11 | 1 | Because both passes defined the population by judgment. Closed by writing a mechanical population definition into §11's preamble — line numbers, ranges, counts, facts about the test files, cited-document content, and any clause built on "already", "untouched", "in scope", "unchanged", "still", "remains". Pass 6 was run against that definition; its results are in the sweep table below. |
| Q-30 | Does this plan's §2 correctly state how many rows the upstream review's contract table marks pass? | §2 | 1 | **No — it said twenty-two; the correct figure is twenty.** The table has twenty-one data rows; twenty are marked pass and the twenty-first ("Plan §1 goal") is marked fail. Rows extracted and their status cells listed this session. §2 corrected; registered as §11 claim 29. |
| Q-31 | Is T-A2a-neg's fixture-subject assertion actually a divergence from the tier's conventions? | §8, S2 | 1 | **No.** The premise that "every other assertion targets a shipped file" is false: `tests/structural/check-structure.mjs` already carries three fixture-targeting assertions, at `:254`, `:255` and `:376`. D-B is withdrawn in §8 with the reads recorded; the step itself is unchanged. §11 claim 28's sibling read. |
| Q-32 | Are the plan's citations of the upstream behavioral-remediation plan and the upstream review accurate? | §§2, 3, 7, 8, 10, 12, 13, 15, 16 | 1 | Eleven of thirteen were accurate as cited and are registered as §11 claims 28–29 with per-region reads; the two that were not are Q-30 and Q-31, both corrected at source. Accuracy was re-derived from the cited files this session, never carried over from the review that named them. |
| Q-34 | Why did the plan not anticipate T-20's reaction to S1's label change? | S4b | 1 | Because the plan's own claim 11 read `check-structure.mjs` at `:207–213` and `:425–457` for the regions it *edits*, and never asked what else in the file *reads* those regions' output. T-20 harvests every `check(` label in the file, so every label this plan writes is an input to it. Closed by S4b; the general lesson is recorded in §13 — a step that changes a label changes data some other assertion consumes. |
| Q-35 | Widen T-20's normalizer, or declare the replacement? | S4b | 1 | Declare. Any normalizer general enough to equate "valid JS syntax" with "parses as a workflow body (strict)" must ignore most of the label, which would stop distinguishing renames from deletions for every check in the file — a blanket exemption in the one assertion guarding against blanket exemptions. Reasoned in S4b part 4. |
| Q-36 | Does the allowlist need its own must-fail case? | S4b, §12 | 1 | Yes — it is detector surgery, and `testing-standards.md:91` @ `94a640a` requires the detector still be able to fail. T-A2f supplies three cases against the live `goneFrom` predicate, including a genuine deletion that must still be reported and a replacement-absent case that must re-arm the guard. |
| Q-37 | Does the allowlist become a permanent hole once these changes are committed? | S4b, §13 | 1 | No. T-20's baseline is `git show HEAD` (§11 claim 32), so after the commit the old label is no longer in the baseline and the entry is never consulted. It is retained rather than deleted because it is inert when unused and carries the reason for the substitution where a future reader meets it. |
| Q-38 | Why was S4b's evaporation property false as first written? | S4b | 1 | Because `goneFrom`'s first disjunct tested `currentSrc.includes(l)` textually and short-circuited before the allowlist, while the allowlist itself wrote the baseline label into the file as data. The allowlist was never consulted; direction B could not go red; and deleting the replacement outright left T-20 green. Re-executed and confirmed — §11 claims 33–34. Closed by making presence structural. |
| Q-39 | Is the short-circuit S4b's defect or a pre-existing one? | S4b, §13 | 1 | Both, precisely: the raw `includes` disjunct predates this plan (it is in the guard as shipped), but its false-negative was unreachable until S4b's allowlist became the first construct to write a baseline label into the file as data. A dormant weakness activated by this step's data — recorded that way in §11 claim 33 rather than assigned to one side. |
| Q-40 | Does dropping the textual disjuncts lose any real coverage? | S4b | 1 | No. Every label genuinely in `check(` position is caught by `here.has(norm(l))`, since `norm` applies to both sides — unchanged labels match exactly, cardinality renames are what `norm` absorbs. The only thing the substring test additionally caught was a label occurring outside call position, which is the false negative being removed. Probed in both directions (§11 claim 35, cases A and F). |
| Q-41 | Can T-A2f's own data reintroduce the defect? | S4b, §12 | 1 | Yes, and the first revision did: a literal `check('<label>` in a test argument enters the same file-wide capture the predicate scans. Closed by assembling every synthetic source at runtime via `asCheck` and reading both real labels from `REPLACED_BY_STRENGTHENING` instead of retyping them, with a grep in the Verification field confirming no literal survives. Recorded as a standing hazard in §13. |
| Q-42 | Is the implementer's removal of the dead `const present` binding authorized? | S4b | 1 | Yes — S4b now authorizes it explicitly. `goneFrom` computes `here` internally, so the old binding is unreferenced, and leaving dead state beside a guard this delicate invites a future reader to wire it back in. |
| Q-43 | Why did S7 not anticipate the harness break? | S7, S7b | 1 | Because the plan verified what `parseLocation` *contains* (claims 9, 10) and never asked what it *depends on* after the refactor. The harness lifts declarations, so a function's free identifiers are part of its interface to the harness. Same shape as Q-34 — read the region edited, not the regions that consume it — one step later. Registered as §11 claim 36. |
| Q-44 | Inject the regex literals verbatim, or extract them from source? | S7b | 1 | Extract. Writing the literals into the test creates a third hand-maintained copy of the grammar inside the test that exists to prove there are not two — S7's own single-source argument, applied to S7's own verification. Reasoned in S7b part 4. |
| Q-45 | New extraction expression for the harness, or reuse S3's `reDecls`? | S7b | 1 | Reuse. `reDecls` at `:250` is module-scope, sits above the harness at `:548`, and already captures exactly the three declarations (§11 claim 38). Two matchers over one pattern is the derived-surface drift D-3 already reasoned about. |
| Q-46 | Does S4's "leave `gateFns` unchanged" forbid S7b? | S4, S7b | 1 | No — it scopes that instruction to S4 itself. S4's text now says so explicitly, and S7b carries its own authorization. The extraction technique and `declOf` are unchanged throughout; only the preamble's injected-constant list grows, in the same shape as the existing `ROUND_CAP` line. |
| Q-47 | Is S4b's Direction B executable as written? | S4b | 1 | No. Emptying `REPLACED_BY_STRENGTHENING` throws `TypeError` on `[0].was` before any assertion runs, because T-A2f derives its labels from that array — the demonstration crashes and observes nothing. Corrected to neutralizing `supersededBy` instead, which isolates the same variable; reproduced both ways (§11 claim 39). |
| Q-33 | Can this plan guarantee the registration class is now closed? | §11, §14 | 1 | No, and claiming otherwise would repeat the error three rounds running. What it can do is make an under-scoped execution *visible*: §11's preamble now fixes the sweep scope as an explicit section list, so a future attestation names what it covered and a reader compares the two directly. Each prior round's fix closed the mechanism named and left the next; pass 8 targets the progression by making scope checkable rather than by trusting the sweeper. The residual risk — a claim form neither marker rule anticipates — is real and is stated here rather than attested away. |

**Reconciliation sweep — twelve passes.** One count, one narrative. Each pass records the **scope it actually swept**, because three review rounds have now turned on the gap between the population this plan declares and the population a pass executed over; a pass number without its scope cannot be checked against the definition in §11's preamble.

| Pass | Scope actually swept | Added | Outcome |
|---|---|---|---|
| 1–3 | §11's own entry list, walked outward | Q-1 … Q-17 | Wrong direction. Round 1 of review showed a walk over the list cannot find an assertion missing from the list. |
| 4 | §§1–10, 12, 13, 15, 16 — assertion-to-list, population defined by judgment | Q-18 … Q-24; §11 entries 17–24; deleted one unverifiable assertion (Q-24) | Right direction. Round 2 showed judgment does not recognise reassurance phrasing as assertion. |
| 5 | Same as pass 4 | zero | Confirming pass; its zero was not evidence — same blind population as pass 4. |
| 6 | **§7 only** — marker scan (`already`, `untouched`, `in scope`, `unchanged`) plus every line-number, range and count citation | Q-25 … Q-29; §11 entries 25–27 | Mechanical population, but executed narrower than the definition states. Round 3 showed every survivor was a cross-document citation *outside* §7. |
| 7 | Same as pass 6 | zero | Confirming pass; its zero inherited pass 6's under-scoping. |
| 8 | **§§1–6 and §§8–16 as well as §7** — the full section list in §11's preamble, with the marker rule extended to attribution phrasing (any clause naming another document's section, decision, claim, step, finding, table or count) | Q-30 … Q-33; §11 entries 28–29; **two corrections** | The scope fix. Found thirteen cross-document citations: the six upstream-plan claims and seven upstream-review claims, of which **two were wrong** — §2's row count and §8's D-B premise. Both corrected at source rather than registered as stated. |
| 9 | Same as pass 8, over the amended document | zero | Confirming pass. Its zero is checkable: the scope it swept is written in §11's preamble as a section list, so a reader can compare the declared population to the executed one rather than taking the count on trust. |
| 10 | Same section list, re-run after S4b was inserted following the implementer's STOP at S5 | Q-34 … Q-37; §11 entries 30–32; T-A2f in §12 | Triggered by a step insertion, not by a review. Every assertion in the new step and in S5's restated expectation was walked against §11 before delivery, and the three T-20 premises were re-derived from `check-structure.mjs` and re-executed rather than taken from the STOP report. |

| 11 | Same section list, re-run after S4b was amended following the implementer's second STOP | Q-38 … Q-42; §11 entries 33–35; T-A2f's fourth case in §12 | Triggered by a refuted safety claim inside a step this plan had already written. Every property S4b asserts is now an executed probe result rather than reasoning, because the claim that failed was reasoning that read as obviously true. |

| 12 | Same section list, re-run after S7b was inserted following the implementer's third STOP | Q-43 … Q-47; §11 entries 36–39 | Triggered by a blast-radius halt. Surfaced a dependency premise the plan had never stated (what `parseLocation` closes over) and one prior instruction that was not executable (S4b Direction B), both corrected here. |

Twelve passes: three (1–3) run in a direction now known to be useless, two (5, 7) confirming passes whose zeros inherited the blind population of the pass before them, one (9) confirming pass whose zero is checkable against a declared scope, and six (4, 6, 8, 10, 11, 12) that added entries. Pass 10 differs from the rest in what triggered it — a step insertion during implementation rather than a review finding — which is the case the discipline has to cover if it is to survive contact with execution. **Zero register entries remain open; no entry is bin 2, so no owner escalation is required by this plan.**

**What each round's mechanism was, since the progression is the useful record.** Round 1: wrong sweep direction. Round 2: right direction, population defined by judgment. Round 3: mechanical population, execution narrower than the declared scope. Each fix was necessary and none was sufficient, because each closed the mechanism named and left the next one. Pass 8's design targets that progression rather than its latest instance: the scope is fixed as a section list *in the document*, so an under-scoped execution is visible by comparison instead of requiring a reviewer to notice it, and the marker set now covers attribution phrasing, which is the form every round-3 survivor took. The honest limit is stated in Q-33.

## 15. Gaps acknowledged

**G-1. Whether the agent harness enforces a `schema` object's `pattern` keyword on a subagent's structured return.** This determines whether F-3's consequence was total gate failure (Critical) or a dormant contract defect (Serious), and it is the review's own tentative finding T-1. *Attempted:* read `workflows/expert-lifecycle.js`'s schema definitions and all `agent(...)` dispatch sites; read the review's T-1 analysis; confirmed by execution that the pattern admits no valid location (§11 claim 8) — the verified half. *Why it is outside reach:* closing it requires executing one live `agent(...)` dispatch with `schema: VERDICT_SCHEMA` and observing whether the harness rejects a return carrying `location: 'spec.md:1-2'`. That is a paid behavioural experiment, not a planning activity, and it is outside this plan's authorized touch set. *Consequence for this plan:* none — S7 fixes the pattern regardless of enforcement, because a contract that admits no valid value is a defect under Design by Contract whether or not something currently enforces it. The classification question stays open for the owner.

**G-2. S3's pattern discovery covers single-line declarations only.** *Attempted:* surveyed the workflow's schema region (`workflows/expert-lifecycle.js:74–135`) and confirmed `LOCATION` is the sole `pattern:` site and is single-line (§11 claim 8); `grep -n "pattern:"` over `workflows/` returns exactly that one line, matching the review's own sweep. *Why it is not fully closable here:* a multi-line-tolerant extraction needs a real JavaScript parser, and adding a parser dependency for one declaration is disproportionate to a five-finding remediation. *Mitigation in place:* the `at least one schema pattern was found to check` assertion fails the tier if extraction breaks entirely, and the exemplars-must-be-declared assertion fails it if a discovered pattern is unexemplified. The residual hole is narrow — a `pattern:` declared across lines would go undiscovered — and is recorded in §13 as a known limit rather than presented as covered.

**G-3. Whether the harness's own workflow wrapper runs the body in strict mode.** S1's oracle prepends `"use strict"`, so it is at least as strict as ECMAScript module code. Whether it is *exactly* as strict as the harness is unknown. *Attempted:* read `skills/workflow-creator/SKILL.md` at `:142–159` @ `4caccdb`, which documents the wrapper as an `async` function and the body's `return` as the tool result but says nothing about strictness; searched the same file for `strict` (no hits); read `skills/workflow-creator/scripts/validate-workflow.mjs`, which is a text-only linter with no parser and no mode declaration. *Why it is outside reach:* the wrapper is constructed inside the Claude Code harness, which this repository does not contain and this plan cannot execute. *Consequence, and why it is safe:* the asymmetry runs in the conservative direction — the oracle may reject a construct the harness would tolerate, never the reverse. All six affected classes (octal literals and escapes, `with`, duplicate parameter names, `delete` of an unqualified identifier, assignment to `eval`) are constructs that must not appear in this file under any mode, so a false rejection is not a realistic failure. Recorded because a future maintainer who meets a strict-mode rejection needs to know the oracle is deliberately conservative rather than assume the harness refuses the file. See D-1's calibration note.

Every other decision in this plan is grounded in a named standard from §3, and every factual claim is verified per the entries in §11.

## 16. Post-completion

1. **Both tiers green with the S5 red record beside them.** S9 produces this. The deliverable of this remediation is not "the tests pass" but "these four assertions were observed failing on real defects and then observed passing after those defects were fixed," recorded verbatim in one place.
2. **Exported-surface check.** `codegraph_diff_surface` against the pre-implementation baseline must report **zero** added, removed, or kind-changed exported symbols. This plan specifies no surface change: the workflow's only export is `meta` (`workflows/expert-lifecycle.js:1`) and no step touches it. `LOCATION_RE`, `LOCATION_RANGE_RE`, and `LOCATION_SECTION_RE` are module-local `const`s, not exports. Any reported surface change is an unplanned breaking-change candidate to investigate, not to wave through.

3. **Parse-error criterion, scoped to the file it is about.** `codegraph_scan` currently reports `parseErrors: 1`, the entry being `workflows/expert-lifecycle.js` (§11 claim 7). After S6 the criterion is: **the scan reports no parse error for `workflows/expert-lifecycle.js`.** Exactly one parse error is expected and correct — `tests/fixture/workflow/broken-syntax-workflow.js`, whose unparseability is the subject of T-A2a-neg and is created deliberately by S2. A surviving error on the workflow, or an error on any third file, is a finding. The unscoped form of this criterion ("any parse error is a finding") would fire on the healthy end state, because CodeGraph scans `tests/fixture/` and already holds `tests/fixture/project/greeter.js` in the graph — see D-7 and §13.
4. **Re-review.** A post-fix review's inventory is this plan's three files, plus the review's original 27-file inventory, plus the five findings as closure items — per the review's own closing note.
5. **Follow-up this plan creates, for the owner, not for this plan:** G-1 (the harness enforcement question, which would re-classify F-3), and the upstream plan's §16 behavioural re-run — worth its ~1.5M subagent tokens only once S9 is green, since against the current state it fails at module load and buys no information.
