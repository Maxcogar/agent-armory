# Implementation review — expert-dev-tools behavioral-tier remediation

**Round:** 1 (implementation review, first round)
**Artifact:** the working-tree changes to the 27 files listed in §5 of
`claude-plugins/expert-dev-tools/docs/plans/plan-expert-dev-tools-behavioral-remediation.md`
(3 created, 24 modified), all under `claude-plugins/expert-dev-tools/`.
**Reviewer:** independent (expert-review R1.2)
**Date:** 2026-08-09

---

## Scope and Inventory

### Excluded from the artifact, by the dispatching instruction

The working tree also carries parallel work that is **not** under review and was excluded from
the diff: `docs/HANDOFF.md`, `docs/SKILL-CHANGELOG.md`, `docs/plans/`, `docs/reviews/`,
`skills/expert-plan/references/output-contract.md`, `skills/expert-plan/scripts/`.

### Round number

First-round review. Convergence tracking begins at round 2.

### Tool plan (Step 3)

Instruments available this session: `Bash` (git, node, grep), `Read`, `Grep`, `Glob`, `Write`.
Claim-type mapping actually used:

| Claim type | Instrument | Used for |
|---|---|---|
| Literal-content ("line N says Z") | `Read` / `grep -n` at the specific line | F-1, F-3, F-5 |
| Absence ("nothing asserts X") | `grep` over a named scope, result count recorded | F-2, F-4 |
| Behavioral ("this parser rejects/accepts X") | **executed** — `node --check`, `node -e` with `RegExp.test` | F-1, F-2, F-3 |
| Test-suite state ("the tiers are green") | **executed** — both tiers run by the reviewer | below |
| Comment claims inside the artifact | re-derived from source, never accepted | F-5 |

No instrument class was unavailable. Context7 was not required: this artifact integrates no
third-party library API — the only external-behavior claims are about the Node.js runtime and the
ECMAScript grammar, both verified by direct execution, which is a stronger instrument than a docs
lookup for these claim types.

### Test tiers — executed by the reviewer, not taken on report

```
$ node tests/structural/check-structure.mjs   →  STRUCTURAL TESTS PASSED   (exit 0)
$ node tests/unit/run-unit-tests.mjs          →  UNIT TESTS PASSED         (exit 0)
```

Both tiers are green. **Finding F-2 establishes that the structural tier's green is not evidence
of a loadable workflow**, so the green was not treated as a premise anywhere in this review.

### File inventory

Constructed from the plan's §5 Files-affected table (Created + Modified). All 27 verified.

**Created (3)**

- [x] `README.md` — Read in full (1–85).
- [x] `agents/expert-corrector.md` — Read in full (1–72).
- [x] `skills/expert-correct/SKILL.md` — Grep-verified: present, parseable frontmatter + `name`
  (structural T-A1 executed, `skill expert-correct has parseable frontmatter + name` ok).

**Modified — configuration (1)**

- [x] `.mcp.json` — Grep-verified via executed T-3 assertions (`context7 still resolves
  @upstash/context7-mcp`, `context7 invocation is not the colliding bare-npx form`, both ok).

**Modified — agents (9)**

- [x] `expert-spec-writer.md`, `expert-implementer.md`, `expert-verifier.md`,
  `expert-diagnostician.md`, `expert-acceptance.md`, `expert-closeout.md`, `expert-reviewer.md`,
  `expert-architect.md`, `expert-planner.md` — Grep-verified: `git diff --stat` per file, plus a
  `sed -n '1,20p' | grep "jobs:\|returns:\|tools:"` sweep over all ten agent files recording each
  file's `tools:`, `jobs:` and `returns:` lines; plus the executed T-2b binding assertion, which
  checks each agent's `returns:` against the union of its dispatched schemas' properties and its
  `jobs:` against its distinct dispatch-label count (20 assertions, all ok).

**Modified — skills (7)**

- [x] `expert-spec/SKILL.md`, `expert-architecture/SKILL.md`,
  `expert-architecture-portable/SKILL.md`, `expert-plan/SKILL.md`, `expert-review/SKILL.md`,
  `expert-standard/SKILL.md`, `expert-mcp-overhaul/SKILL.md` — full `git diff HEAD` Read for each.

**Modified — workflow, command, tests, docs (7)**

- [x] `workflows/expert-lifecycle.js` — full `git diff HEAD` Read (532 diff lines), plus targeted
  Reads at `:57–59`, `:81`, `:200–212` and a codepoint dump of the `NOT_THE_RULER` region.
- [x] `commands/expert.md` — full `git diff HEAD` Read.
- [x] `tests/structural/check-structure.mjs` — targeted Reads at `:205–235` and `:250`, plus a
  `grep -n "T-22\|T-23\|runGate\|new Function\|eval\|extract"` sweep (40 hits reviewed).
- [x] `tests/fixture/spec/spec-contradictory.md` — full `git diff HEAD` Read.
- [x] `tests/ACCEPTANCE.md` — full `git diff HEAD` Read.
- [x] `docs/investigate.md` — Grep-verified: `git diff --stat` shows 22 insertions, 0 deletions
  (marking remediated items, per S23; no content removed).
- [x] `docs/behavioral-tier-findings.md` — Grep-verified: `git diff --stat` shows 55 changed lines
  (same S23 marking).

No `[ ]` remain. No file surfaced mid-pass that required amending the inventory.

### Rigor waivers

None. No compression of this review's process was requested or applied.

---

## Summary

**This review returns NEEDS FIXES.** The remediation is substantively faithful to the plan — all 26
steps are traceable in the diff, the changed-file set matches §5 exactly in both directions, the
prose corrections (S4, S5, S11, S16, S18, S19, S21, S22, S23) are careful and better than the plan
strictly required, and the fail-closed rewiring of the gate callers (S15b) is correct and is the
highest-stakes change in the plan. But **the workflow file is not valid JavaScript.** A single
unescaped apostrophe inside a single-quoted string literal at `workflows/expert-lifecycle.js:58`
means the module cannot parse, and therefore the entire lifecycle — every phase, every gate, every
correction the other 25 steps built — cannot run. Separately, and more importantly for the plan's
own doctrine, the structural tier reported this green: `node --check` on a `.js` file containing
`export` returns exit 0 for *any* syntax error, which I demonstrated by construction. The suite's
syntax gate is not merely weak here; it is incapable of failing. A second escape-consumption defect
in the `LOCATION` schema pattern shipped green through the same blindness. The plan warned about
exactly this shape — "both detectors are inert while their test passes green" (§7 S6b part 5) — and
the implementation reproduced it in the tier meant to catch it.

---

## Upstream Contract Verification

The upstream artifact is the plan. Its §12 test specifications and §5 file list are the validation
references; each check below records its verification method per Step 6 discipline.

| Plan element | Status | Verification method |
|---|---|---|
| §5 file set (T-21: `git diff --stat` equals §5, both directions) | **pass** | Executed `git diff --stat HEAD` + `git status --porcelain` scoped to the plugin; 24 modified + 3 untracked-created, set-equal to §5's five sublists after removing the six parallel-work paths the dispatch excluded. |
| S1 `.mcp.json` non-colliding invocation (T-1) | pass | Executed structural T-3 assertions. |
| S2 six agents hold both documentation paths (T-2) | pass | Executed: six `T-3 … holds both documentation paths` assertions ok. |
| S2b `returns:`/`jobs:` bound to schemas (T-2b) | pass | Executed: 20 T-2b assertions ok; agent frontmatter sweep confirms all ten files carry both keys. |
| S4/S5 corrector skill + agent, `Edit` without `Write` (T-4, T-5) | pass | Read `agents/expert-corrector.md` in full; executed `T-5 expert-corrector: granted Edit, denied Write` ok. |
| S6 three document gates dispatch the corrector (T-6) | pass | Read the diff at the three `remediateFn` sites; executed T-6 both halves ok. |
| S6b detectors + schema (T-22) | pass **as specified**, but see F-3 | Read `detectCorrectionFailure` and `parseLocation` at source; executed nine T-22 assertions incl. all four boundary cases and the false-positive guard. The detectors' own regexes are correct regex *literals*; the defect is confined to the schema `pattern` string. |
| S7 counts and set membership (T-7) | pass | Executed: `ten skills packaged`, `ten agents present` ok. |
| S8/S9 ruler + output contract per dispatch (T-8) | pass | Read `RULER`, `OUTPUT_CONTRACT`, `NOT_THE_RULER` and all four dispatch templates; executed nine T-8/T-9 assertions ok. |
| S10 `artifact_path` consumed, defaults deleted (T-9) | pass | Read `:281–283` replacement, `resolveArtifactPath`, `missingArtifactPath`, and the three call sites. |
| S11 one artifact convention across four skills + agents (T-10) | pass | Read all four skill diffs; executed 14 T-10 assertions ok. |
| S12/S13/S15 `diagnose()` three-channel, all sites (T-11, T-12) | pass | Read the declaration and every call site in the diff; executed `T-12 diagnose: all 11 call sites pass three arguments` ok. Note the count is 11, not the plan's 8 — S15b and S22 legitimately add sites, and S15's assertion counts sites rather than asserting a fixed number, which is why it absorbs them correctly. |
| S14 diagnostician contract narrowed (T-13) | pass | Executed `T-13 diagnostician no longer promises a run-journal excerpt` ok. |
| S15b both new states wired at both callers (T-23) | pass | Read `gateEscalation`, `maybeNonConvergence`, and the spec gate's `if (gate.verdict !== 'PASS')`; executed seven T-23 assertions ok, including the fail-closed check that no caller tests the exact `NON_CONVERGENCE` string. |
| S16 six flag-once clauses deleted (T-14) | pass | Read all six deletions in the diffs; executed T-14 over all ten skills ok. |
| S17 spec artifact registered before the gate (T-15) | pass | Read the moved `delta.artifacts.push`; executed both T-15 assertions ok. |
| S18/S19 stale_deployment + dedupe key (T-16, T-17) | pass | Read the `staleDeploy` branch and all three `commands/expert.md` edits; executed five T-16/T-17 assertions ok. |
| S20 document-phase scope check (T-18) | pass | Read `documentScopeCheck` and its three call sites; executed both T-18 assertions ok; verifier `jobs: 4` confirmed by the frontmatter sweep. |
| S21 fixture three-way framing (T-19) | pass | Read the full fixture diff; executed T-19 ok. |
| S22 nothing weakened (T-20) | pass, with F-5 | Executed four T-20 assertions ok. |
| **Plan §1 goal — "a plugin whose spec gate can converge"** | **fail** | The workflow module does not parse (F-1). No gate can run. |

---

## Critical & Serious Findings

### F-1 (Critical, new) — `NOT_THE_RULER` is not valid JavaScript; the workflow cannot parse

**What the code does now.** `workflows/expert-lifecycle.js:57–59`:

```js
const NOT_THE_RULER =
  'The authoring skill's process rules are not the standard — judge the artifact, not the ' +
  'process that produced it.'
```

The `'` in `skill's` is an unescaped ASCII apostrophe (U+0027) inside a `'`-delimited string
literal. The literal terminates after `skill`, and the parser then meets the identifier `s`.

**How this claim was verified.** Four independent executions, all at drafting time:

1. `Read` of `workflows/expert-lifecycle.js:55–60` — the literal text above.
2. Codepoint dump of the region (`node -e` marking every quote-like codepoint): every quote in the
   assignment is `U+27`. There is no typographic apostrophe (U+2019) masking the problem — that
   was my first hypothesis and it is false.
3. A byte-identical copy of the file renamed `.mjs`:
   `node --check …/copy.mjs` → `SyntaxError: Unexpected identifier 's'` at line 58, exit 1.
4. `node --input-type=module --check < workflows/expert-lifecycle.js` → the identical
   `SyntaxError` at line 58, exit 1.

I also confirmed the error is not masked by a preceding unterminated string: a hand-written
tokenizer (comments, all three quote types, escapes) run over the file reports lexical state
`code` at the end of line 57, so line 58 begins outside any string.

**Which standard it violates.** ECMA-262 §12.9.4 (String Literals): a `SingleStringCharacter` may
not be `'` unescaped. This is a lexical rule with no dialect, module-mode, or host variance — every
JavaScript parser rejects it.

**Why it matters.** `workflows/expert-lifecycle.js` is the plugin's entire control plane. If it
does not parse, nothing in this remediation runs: not the corrector routing (S6), not the
detectors (S6b), not the fail-closed escalation (S15b), not the rulers (S8/S9). The plan's stated
success condition — "a plugin whose spec gate can converge on the `farewell()` fixture" — is
unreachable, and the Post-completion behavioural re-run (§16), which the plan prices at ~1.5M
subagent tokens, would fail on load.

**Scope of this defect class — swept, not extrapolated.** After patching this one occurrence in a
scratch copy, `node --check` on the patched `.mjs` surfaced no further string-literal error; the
next diagnostic it reports is `Illegal return statement`, which is the workflow's pre-existing and
intentional top-level-`return` style (present at `HEAD`, outside this artifact) and not a defect
introduced here. So this defect class has **exactly one instance**.

**What correct implementation looks like.** Either escape the apostrophe or change the delimiter:

```js
const NOT_THE_RULER =
  "The authoring skill's process rules are not the standard — judge the artifact, not the " +
  'process that produced it.'
```

The double-quote form is preferable and is already the file's own convention for exactly this case
— `RULER.architecture` and `RULER.plan` (`:49–50`) both use `"…"` precisely because they contain
`spec's` and `plan's`. The defect is a local inconsistency with a correct pattern three lines above
it.

---

### F-2 (Critical, new) — the structural tier's syntax gate is incapable of failing

**What the code does now.** `tests/structural/check-structure.mjs:209–212`:

```js
const wf = join(ROOT, 'workflows/expert-lifecycle.js');
let syntaxOk = true;
try { execFileSync(process.execPath, ['--check', wf], { stdio: 'pipe' }); } catch { syntaxOk = false; }
check('T-A2a workflow: valid JS syntax', syntaxOk);
```

`node --check` is invoked on the `.js` path. For a `.js` file that contains ESM syntax (`export`),
Node's CommonJS/ESM ambiguity handling causes `--check` to exit **0 regardless of any syntax
error** in the file.

**How this claim was verified — executed, by construction.** Four minimal files, `node --check`
each:

| File | Contents | Exit |
|---|---|---|
| `c3.js` | `const b = 'it's bad'` | **1** — error correctly reported |
| `c4.js` | `export const a = 1` + the same bad line | **0** |
| `c1.js` | `export const a = 1` + `return 2` (no bad line) | 0 |
| `c2.js` | `export` + `return` + the same bad line | **0** |

`c3` versus `c4` isolates the variable: the *only* difference is the presence of `export`, and it
flips a correctly-detected syntax error into a silent pass. The plugin's workflow has exactly the
`c2` shape (`export const meta` at line 1, top-level `return` throughout), which is why T-A2a
reported green over F-1.

**The second oracle does not cover the gap either.** `check-structure.mjs:215–223` also runs
`skills/workflow-creator/scripts/validate-workflow.mjs`. I checked whether that linter parses
JavaScript: `grep -n "import(\|--check\|new Function\|parse\|acorn\|readFileSync"` over its 159
lines returns one relevant hit — `import { readFileSync } from 'node:fs'` at `:9`, consumed at
`:21`. It reads the file as **text** and applies textual checks. It has no JS parser, so its green
carries no syntax information. Both oracles are therefore blind, and there is no third.

**Which standard it violates.** The regression-detection principle the plan itself adopts and names
as governing (`skills/expert-plan/references/testing-standards.md:91`, plan §3 and claim 56): a
check must be demonstrated failing against the broken state before its green means anything —
"a regression test that never failed has not demonstrated it can." T-A2a is a stronger violation
than an undemonstrated check: it is a check that **cannot** fail for its subject. The plan applies
this principle explicitly to S15's arity guard and to S6b's detectors; it was not applied to the
syntax gate the whole tier rests on.

**Why it matters.** This is the finding that produced the other two. F-1 and F-3 are both defects a
working syntax/schema gate would have caught before delivery, and both shipped with the tier
reporting `STRUCTURAL TESTS PASSED`. Any future edit to the workflow inherits the same blindness.

**What correct implementation looks like.** Check the file under the module goal it is actually
written in, and demonstrate the check red before accepting it:

```js
let syntaxOk = true;
try {
  execFileSync(process.execPath, ['--input-type=module', '--check'],
               { input: readFileSync(wf, 'utf8'), stdio: ['pipe', 'pipe', 'pipe'] });
} catch { syntaxOk = false; }
check('T-A2a workflow: valid JS syntax (checked as a module)', syntaxOk);
```

Then run it against the current `HEAD`+artifact state and confirm it goes **red** on F-1 before
fixing F-1 — that ordering is what the named standard requires, and it is what converts this from
a check that passes into a check that works.

---

### F-3 (Serious, new) — `LOCATION.pattern`'s regex escapes are consumed by the string literal, so the pattern matches no valid location

**What the code does now.** `workflows/expert-lifecycle.js:81`:

```js
const LOCATION = { type: 'string', pattern: '^[^\s:#]+(?::\d+(?:-\d+)?|#\S+)$' }
```

The regex is written as a **single-quoted string**, so `\s`, `\d` and `\S` are string escape
sequences, not regex escapes. JavaScript resolves an unrecognised escape to the character itself:
`\s` → `s`, `\d` → `d`, `\S` → `S`.

**How this claim was verified — Read plus execution.**

1. `Read` of `:81`; `JSON.stringify` of that line confirms the file contains single backslashes
   (`"…'^[^\\s:#]+(?::\\d+(?:-\\d+)?|#\\S+)$'…"` — JSON's doubling of a single literal backslash).
2. Executed the string through `RegExp`:
   - effective pattern source: `^[^s:#]+(?::d+(?:-d+)?|#S+)$`
   - `.test('spec.md:271-273')` → **false**
   - `.test('plan.md#s7')` → **false**

Both are canonical instances of the grammar S6b part 5 mandates, and both are rejected.

**Which standard it violates.** Plan §7 S6b part 5, which requires `findings[].location` to be
`required` **and** constrained to `path:start-end` or `path#section`. The implementation delivered
the `required` half correctly — `VERDICT_SCHEMA.findings.items.required` is now
`['classification', 'standard', 'location']` (verified by Read of the diff at `:109–110`) — and the
grammar half is inert. Design by Contract (Meyer), named as governing in plan §3: the contract now
*mandates* a field whose stated format nothing can satisfy.

**Why it matters, and why it is Serious rather than Critical.** If the harness enforces
`VERDICT_SCHEMA` on reviewer returns, every reviewer return at every gate is rejected, because
`location` is required and no well-formed location matches the pattern — the gate cannot produce a
verdict at all. I have not executed the harness's schema enforcement path, so I am not asserting
that consequence as verified; what *is* verified is that the declared grammar admits no valid
location. Classified Serious on the verified half alone; if enforcement is confirmed, it is
Critical.

**Why the test suite is green over it.** The sibling `parseLocation()` (`:121–127`) uses genuine
regex **literals** (`/^([^\s:#]+):(\d+)(?:-(\d+))?$/`) and is correct. T-22 and T-23 exercise
`parseLocation` and `detectCorrectionFailure`, never `LOCATION.pattern`. A `grep -n
"LOCATION\|pattern"` over `tests/structural/check-structure.mjs` returns **1** hit — an unrelated
comment at `:437` about parsing a parameter list. **No assertion anywhere evaluates any schema
`pattern`.** This is F-4's second instance.

**Scope of this defect class — swept, not extrapolated.** `grep -n "pattern:"` over
`workflows/expert-lifecycle.js` returns **1** occurrence (`:81`); `grep -rn "pattern: *'"` over
`workflows/`, `tests/` and `scripts/` returns the same single line. Exactly one instance.

**What correct implementation looks like.** Double the backslashes, or — better, since it removes
the class rather than the instance — derive the string from a regex literal so the two cannot
disagree:

```js
const LOCATION_RE = /^[^\s:#]+(?::\d+(?:-\d+)?|#\S+)$/
const LOCATION = { type: 'string', pattern: LOCATION_RE.source }
```

`parseLocation` should then be built from the same literal, so the schema and the detector are
provably the same grammar rather than two hand-kept copies of it — which is the plan's own
generation rule (§3, claim 27: "scripts that *generate* a derived surface are the fix").

---

## Systemic Patterns

### F-4 (Serious, Systemic, new) — the structural tier validates the workflow as text, never as a loadable module or as evaluable schema

**The pattern.** Every assertion the tier makes about `workflows/expert-lifecycle.js` is a
string/regex match over its source text, or an execution of a *fragment* extracted from that text.
Nothing loads the module, and nothing evaluates a schema value. The file can therefore be
unparseable, or declare a schema that admits nothing, while the tier prints
`STRUCTURAL TESTS PASSED`.

**The proactive scan across the full inventory scope, with instances enumerated.** Scans run over
`tests/structural/check-structure.mjs` (the only file that asserts against the workflow):

| Scan | Query | Result | Instance |
|---|---|---|---|
| Syntax oracle | `grep -n "valid JS syntax" -B12` | 1 hit, `:209–212` — `node --check` on the `.js` path | **(a)** demonstrated incapable of failing (F-2, executed 4-case matrix) |
| Schema-value oracle | `grep -n "LOCATION\|pattern"` | 1 hit, `:437`, an unrelated comment | **(b)** no assertion evaluates any schema `pattern`; F-3 ships green |
| Module-load oracle | `grep -n "runGate\|new Function\|eval\|extract"` | `:450–456` — `new Function(…, declOf(wfSrc, 'async function runGate('), …)` | **(c)** T-22/T-23 execute `runGate` by extracting its **source text** into `new Function`, so they pass over a module that cannot load |
| Second oracle | `grep -n "parse\|acorn\|readFileSync"` over `validate-workflow.mjs` | text-only, no parser | no coverage from the linter either |

Three instances, one cause. This is a class, not three coincidences.

**Which standard it violates.** The regression-detection principle
(`skills/expert-plan/references/testing-standards.md:91`, plan §3, claim 56) at the tier level, and
the plan's own §12 warning, stated for S6b part 5 and applying verbatim here: *"both detectors are
inert while their test passes green — the double supplying the very input whose real-world absence
is the defect."* The extraction-into-`new Function` technique (c) is itself defensible — `runGate`
genuinely cannot be imported from a module that executes a lifecycle at top level, and the plan
specifies stubs for `reviewFn`/`remediateFn` correctly — but it removes the last path by which a
load failure could surface, and nothing was added to compensate.

**Why this is the highest-priority finding despite F-1 being the visible breakage.** F-1 is one
character. F-4 is why one character reached delivery under a tier that reported green, and why the
next one will too. Fixing F-1 without fixing F-4 closes the instance and leaves the class — which
is precisely the failure mode this plan's §7 maintenance rule 4 and D-1's third row name as the
dominant one ("the named instances close; the class resurfaces elsewhere next round").

**What correct implementation looks like.** Three assertions, each demonstrated red before green:

1. Parse the workflow under its real module goal (F-2's fix).
2. Add a load-shaped assertion that at minimum compiles the whole source as a module body, rather
   than only the extracted `runGate` declaration.
3. Assert schema `pattern` values are usable: for each `pattern` in the workflow's schemas,
   construct the `RegExp` and assert it matches a known-good exemplar of the grammar it encodes
   (`spec.md:271-273`, `plan.md#s7`) and rejects a known-bad one. This is one loop and it closes
   instance (b) permanently rather than fixing `LOCATION` alone.

---

## Moderate & Minor Findings

### F-5 (Minor, new) — the `EVIDENCE` comment claims the change is purely additive; `result` was removed from `required`

**What the code does now.** `workflows/expert-lifecycle.js`, the `EVIDENCE` schema. The comment
reads:

> `// … Additive: nothing is removed.`

and immediately below, `required` changed from
`['claim_type', 'tool', 'citation', 'result']` to
`['claim_type', 'tool', 'citation', 'observed', 'asserted']`.

**How this claim was verified.** Read of the diff hunk at `EVIDENCE` (`-required: [… 'result']` /
`+required: [… 'observed', 'asserted']`), both sides present in the same hunk. The comment's claim
was **not** accepted as verification — this is a comment-claim inside the artifact, and it was
re-derived from the `required` arrays themselves.

**Which standard it violates.** Accuracy of an in-source comment as a contract statement (plan §3,
Design by Contract; and the expert-review rule that a comment is the author's claim, never
verification). `result` is retained as a *property* — so the substantive doctrine in S22 ("may not
weaken its own ruler") is honoured, and T-20's property-presence assertions correctly pass — but
it is no longer *required*, so "nothing is removed" is inaccurate about the requirement set.

**Why it matters (and why it is Minor).** The change itself is right: `observed` + `asserted` are
strictly more informative than the free-form `result` they replace, and requiring both while
keeping `result` optional strengthens fabrication detection, which is S22's stated intent. Only the
comment overstates. Left alone, it is the kind of inaccurate in-source claim that a later reviewer
accepts at face value — the failure mode this plugin's own review skill calls out by name.

**What correct implementation looks like.** State what actually happened:
`// Additive in properties: result is retained but no longer required, replaced in the required set
by the two fields it was conflating.`

---

## Tentative Findings

One, and its gap is named precisely.

**T-1 (tentative) — whether F-3's consequence is total gate failure or a dormant contract defect.**
The verified premise is that `LOCATION.pattern` admits no valid location and that `location` is now
in `VERDICT_SCHEMA.findings.items.required`. What is **not** verified is whether the Claude Code
agent harness enforces the `schema` object's `pattern` keyword on a subagent's structured return,
or only its `required`/`type` keywords. *Verification that would close it:* execute one
`agent(...)` dispatch with `schema: VERDICT_SCHEMA` and a return carrying
`location: 'spec.md:1-2'`, and observe whether the harness rejects it — a behavioural check
requiring a live dispatch, which is outside this review's read-only, token-free scope. F-3 is
classified Serious on its verified half; if enforcement is confirmed, re-classify Critical.

---

## Observations

- The `diagnose()` call-site count is **11**, not the plan §7 S13 table's 8. This is correct, not
  drift: S15b's two escalation paths and S22's contradiction check legitimately add sites, and
  S15's assertion was specified to count every call site rather than assert a fixed number, so it
  absorbs them. Recorded because a reader comparing the table to the executed test output will meet
  the discrepancy and should know it was checked. No standard is violated.
- The corrector agent body carries both a hand-written "Your output contract" section and a
  "Return contract (generated from this file's `returns:`/`jobs:` frontmatter)" section covering
  overlapping ground. S2b part 2 asks for the body to state the contract; two statements of it is
  more than asked but not in conflict — I read both and they agree, including on D-9's
  "declaring a field here is not a promise to populate it". No standard is violated.

---

## What's Actually Good

Three items, each with the property named, the standard it is good by, and how the property was
verified.

**The fail-closed rewiring of the gate callers (S15b).** *Property:* no caller tests for a specific
non-PASS verdict string; the spec gate's guard is `if (gate.verdict !== 'PASS')` and
`maybeNonConvergence` opens `if (gate.verdict === 'PASS') return null`, so any unenumerated
`runGate` state routes to `gateEscalation` rather than falling through. *Standard:* OWASP fail-safe
defaults, named for D6 STOP routing at `docs/arch/architecture-expert-dev-tools.md:750` and cited
in plan §3 for this step. *Verified:* Read of `gateEscalation` and both caller sites in the diff,
plus executed assertions `T-23 no caller tests the exact NON_CONVERGENCE string (fail-closed)` and
`T-23 both caller sites route non-PASS through the shared escalation builder`. The plan flagged
this as the step "whose failure is worst in the whole plan" — an unhandled state at the spec gate
reaching `GATE.intent` and telling the owner the spec passed review. The implementation closes it
structurally rather than by enumeration, which is the stronger of the two available shapes.

**The false-positive guard in detector (b) (S6b).** *Property:* `detectCorrectionFailure` matches
on set membership in `class_sweep.found` minus the corrected locations, never on normalised
equality of the `standard` field, so a standard recurring at a location the sweep never examined
does not fire. *Standard:* the plan's own rejected-alternative analysis, which showed the
`standard`-matching rule escalates on a healthy round and stops a converging gate. *Verified:* Read
of the function body at source, plus the executed assertion `T-22 (c) a finding absent from
class_sweep.found fires NEITHER detector`, and the four executed boundary cases (fully inside,
partially overlapping, exactly adjacent, different file) which behave as the boundary-value
analysis specifies.

**The S16 deletions were swept, not patched.** *Property:* removing the flag-once clause from
`skills/expert-standard/SKILL.md` also corrected the enumeration that counted it — "There are
**four** specific moments" became "three" in the same edit. *Standard:* the class-sweep half of the
correction discipline this plan is built to install (plan D-1: "the load-bearing half of the
discipline is the class sweep, not the re-derivation"), and ISO/IEC/IEEE 29148:2018 §5.2.6
(Consistent). *Verified:* Read of the `expert-standard/SKILL.md` diff hunk showing both the count
change and the paragraph deletion; executed `T-14 no "flag once, then comply" clause survives in
any of the 10 skills`. A count left stale beside a deleted item is the exact drift shape the plan's
D-8 names as its own dominant defect class; here the implementer avoided it unprompted.

---

## Convergence Record

First-round review — convergence tracking begins at round 2.

---

## Recommended Priority

Ordered by engineering correctness and by which fix prevents the others, not by effort.

1. **F-4 first, before F-1.** Fix the tier's blindness — check the workflow under its real module
   goal, and assert schema `pattern` values are constructible and match known-good exemplars. Then
   run the repaired tier against the **current** artifact and confirm it goes red on F-1 and F-3.
   Doing this first is what converts F-1 and F-3 from findings someone reported into defects the
   suite catches; doing it after is how the class survives to the next edit. This ordering is the
   plan's own named standard (`testing-standards.md:91`) applied to its own test tier.
2. **F-1.** One character. Prefer the double-quoted form, matching `RULER.architecture` and
   `RULER.plan` three lines above.
3. **F-3.** Derive `LOCATION.pattern` from a regex literal and build `parseLocation` from the same
   literal, so the schema grammar and the detector grammar are provably one thing. Fixing this by
   doubling the backslashes closes the instance and leaves two hand-kept copies of one grammar —
   the maintained-surface shape the plan's D-8 identifies as its own residual risk.
4. **F-5.** Correct the comment to describe the change that was made.
5. **Then re-run both tiers** and confirm the structural tier is green *for reasons that can fail*.
   Only after that is the Post-completion behavioural re-run (plan §16) worth the owner's ~1.5M
   tokens; run against the current state it fails at module load and buys no information.

A post-fix review's inventory is constructed per expert-review Step 2's post-fix source: this
review's full 27-file inventory, plus every file in the fix diff, plus those files' dependents,
plus these five findings as closure items.

---

Verdict: NEEDS FIXES (5 findings: 2 Critical, 1 Serious, 1 Serious-Systemic, 1 Minor)
