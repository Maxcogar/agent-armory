# Plan review — implementation remediation, round 2 (Post-fix)

**Round:** 2 (Post-fix review of the round-1 corrections)
**Artifact:** `claude-plugins/expert-dev-tools/docs/plans/plan-impl-remediation-r1.md` (working tree, 548 lines; 495 lines at round 1)
**Governing output contract:** `claude-plugins/expert-dev-tools/skills/expert-plan/references/output-contract.md` **at commit `94a640a`** (pinned by the dispatch; the working-tree copy does not govern)
**Prior round record:** `claude-plugins/expert-dev-tools/docs/reviews/plan-impl-remediation-r1-round-01.md` (NEEDS FIXES; F-A … F-F)
**Upstream artifact:** `claude-plugins/expert-dev-tools/docs/reviews/implementation-round-01.md` (NEEDS FIXES; F-1 … F-5)
**Reviewer:** independent (expert-review R1.2)
**Date:** 2026-08-09

---

## Scope and Inventory

### Round number

Round 2. This is a Post-fix review; its inventory is constructed per expert-review Step 2's post-fix source and the full process runs unchanged over it.

### Tool plan (Step 3)

Instruments available this session: `Bash` (git, node, grep, sed, file), `Read`, `Grep`, `Glob`, `Write`, Clear Thought (`metacognitivemonitoring`, `collaborativereasoning`).

| Claim type | Instrument | Used for |
|---|---|---|
| Literal-content ("line N says Z") | `Read` / `sed -n` at the specific line | F-G, F-H, and the plan's §11 claims 1, 8, 10, 11, 13, 14, 22, 24 |
| Absence / candidate-set enumeration | `grep` over a named scope, query and count recorded | F-G |
| Behavioral (parser accepts or rejects X; regex partitions Y) | **executed** — `new Function` oracle matrix, `RegExp.test`, S3 harness simulation | the strict-mode matrix, S3, S7, S5's expected set |
| Structural / ordering (declaration site vs use site) | `grep -n` for the declaration, `sed` for the region | the `wfSrc` scope check, the linter-block range |
| Claims imported from prior documents (round-1 review, the plan's own §11) | re-derived from source or re-executed | every disposition below |

No instrument class was unavailable. Context7 was not required: the plan integrates no third-party library API — every external-behaviour claim is about the Node.js runtime and the ECMAScript grammar, both verified by direct execution, which is a stronger instrument than a docs lookup for these claim types.

**Execution hygiene.** All executions ran in the session scratchpad against copies read from the repository. **No write mode was run against repository files**; the only repository write is this review record. The round-1 corrector's warning was honoured and independently confirmed: my first attempt at the strict-mode matrix used a quoted heredoc, and the shell still consumed one backslash, turning the octal-escape probe `'\101'` into a source-level `SyntaxError` in the probe file rather than a probe of the oracle. The matrix was re-run from a file written with the `Write` tool, with the octal-escape probe assembled at runtime via `String.fromCharCode(92)` so no backslash passes through any shell or source escape layer. The probe's actual bytes were printed and confirmed as `"const s = '\\101'"` before the matrix ran.

**Not re-executed this session, and stated rather than glossed:** `codegraph_find_related_docs`'s 34-document result and `codegraph_list_files`'s seven-JavaScript-file result (the plan's claims 12 and 21) were not re-run. Both are structural traces properly cited; neither is contradicted by anything observed here, and neither carries a finding. Recorded so the reader can see the boundary of what was re-derived.

### File inventory

Constructed per Step 2's Post-fix source: the prior review's full inventory, plus every file touched by the corrections (the plan document itself, which is the entire fix-diff for a plan artifact), plus that file's dependents, plus the prior review's six findings as closure items.

- [x] `docs/plans/plan-impl-remediation-r1.md` — Read in full (1–376, then 377–548). The fix-diff file.
- [x] `docs/reviews/plan-impl-remediation-r1-round-01.md` — Read in full (1–273). The prior round's findings, as closure items.
- [x] `docs/reviews/implementation-round-01.md` — Read in full (1–537). The upstream contract.
- [x] `skills/expert-plan/references/output-contract.md` **@ `94a640a`** — Read in full (1–100) via `git show` into the scratchpad.
- [x] `skills/expert-plan/references/testing-standards.md` **@ `94a640a`** — `grep -n "Regression tests"` → 1 hit at `:91`; line Read verbatim via `cat -A`. Newly added to the inventory this round (see F-H).
- [x] `workflows/expert-lifecycle.js` — Read at `:40–60`, `:74–100`, `:286–300`; `grep -n "wfSrc"`-equivalent line-ending probe (`CR count: 0, LF count: 761`). Full copy parsed in the scratchpad under both oracles.
- [x] `tests/structural/check-structure.mjs` — Read at `:205–232`, `:428–460`, `:540–546`; `grep -n "wfSrc *="` → 1 hit at `:95`; `grep -n "T-22|T-23" | grep "check("` → 16 (9 + 7); `wc -l` → 544.
- [x] `README.md` — `grep` hits at `:24`, `:55`, both Read in place.
- [x] `tests/ACCEPTANCE.md` — `grep` hits at `:6`, `:8`, both Read in place.
- [x] `docs/review-round-1.md` — `grep` hit at `:115`, Read in place.
- [x] `docs/HANDOFF.md` — `grep` hit at `:76`, Read in place.
- [x] `docs/behavioral-tier-findings.md` — `grep` hits at `:21`, `:264`, `:267`, all Read in place.
- [x] `docs/plans/` and `docs/reviews/` (16 files) — Grep-verified as a set: `grep -rln` over the plugin's `*.md` with the plan's own eight-alternate pattern; 16 of the 21 hits fall in these two directories, each a dated record of its own round. Enumerated in F-G.
- [x] `tests/fixture/` — the S2 fixture text was executed verbatim through both oracles; the directory's current contents were confirmed by the prior round and are unchanged by this artifact (the plan creates the fixture, it does not yet exist).

No `[ ]` remain.

### Rigor waivers

None. No compression of this review's process was requested or applied.

---

## Summary

**This review returns NEEDS FIXES.** The corrections landed, and the technical spine of the plan is now verified correct by execution end to end: the strict-mode oracle rejects all six strict-mode early-error classes the sloppy wrapper accepted while still rejecting the current workflow, accepting the F-1-patched workflow, rejecting the S2 fixture, and accepting a legitimate top-level-`await`-plus-`return` shape (6/6 and 4/4, executed); S3's extraction regexes find the declaration S7 writes and the derived pattern partitions all six exemplars correctly; S7's `LOCATION_RE` guard diverges from the current `parseLocation` on zero of twelve probes; and S5's expected five-failure signature reproduces exactly. Five of the six round-1 findings are closed against their originally named standards. Two findings remain, both Moderate and both in the plan's bookkeeping rather than its engineering. The doc-sweep evidence in §5 and §11 claim 12 states four counts that re-executing the plan's own grep contradicts, and the two sections disagree with each other about the same sweep — the conclusion they support is correct, which I confirmed by reading every live hit, but the accounting offered as evidence is not. And the F-A class did not fully close: after a cross-walk the plan describes as exhaustive, three Plan-section factual assertions still carry no §11 entry, including the content of `testing-standards.md:91` — the plan's most-cited standard, invoked ten times inside steps.

---

## Upstream Contract Verification

Two upstream contracts govern: the pinned output contract (structure and gates) and, for this Post-fix round, the six findings of round 1 (closure). The five findings of `implementation-round-01.md` remain the coverage reference and were re-checked.

### Round-1 findings — closure status, re-derived from source

Each closure is checked against the standard the original finding named, not an adjacent one.

| Prior finding | Originally named standard | Status | Verification method |
|---|---|---|---|
| **F-A** (Serious, Systemic) — load-bearing assertions with no §11 entry | Pinned contract Gate C: "Every factual claim asserted in any plan step has a corresponding entry in Output section 11" | **not closed** — see F-H | Both named instances closed: the harness premise is now §11 claim 17 (documentation read of `skills/workflow-creator/SKILL.md:142–145,159` @ `4caccdb`) with D-8 recording the independent second grounding; the "17 sites" parenthetical is deleted, with Q-24 recording why (`grep -n "17 sites"` over the plan → 2 hits, both in the disposition notes at `:450` and `:526`, none in §4). But I re-ran the cross-walk in the assertion-to-list direction and found three further unregistered assertions. |
| **F-B** (Moderate) — sloppy-mode oracle | ECMA-262 §11.2.2 (Strict Mode Code) | **closed** | Executed the 6×2 matrix on Node v22.16.0. Sloppy wrapper: ACCEPTED 6/6. Strict wrapper: rejected 6/6, with the V8 diagnostics the plan's claim 19 records, verbatim. Properties preserved, executed: current workflow rejected (`Unexpected identifier 's'`), patched workflow ACCEPTED, S2 fixture rejected, legitimate top-level-`await`+`return` ACCEPTED. The directive appears in S1's code block (`'"use strict"; return (async function(){'`), in S1's comment, in §3, in D-1's four-row table, and in §12 T-A2a. |
| **F-C** (Moderate) — §16's parse-error criterion fires on the plan's own fixture | First-principles (a completion criterion that fires on the healthy end state) | **closed** | Read of §16 item 3: the criterion is now scoped to `workflows/expert-lifecycle.js`, the fixture is named as the one expected and correct parse error, and "an error on any third file" is retained as a finding. D-7 records the two rejected alternatives (renaming the fixture, custom `ignore_patterns`) with reasons; §13 records the interaction as a standing note. |
| **F-D** (Moderate) — content-absence conclusion at 34-file scope on 1-file evidence | Pinned contract Gate C: content absence "states the search that defined the candidate set, the reads that confirmed absence at the candidates, and the scope covered" | **closed** | Claim 12 now states the candidate set (34, enumerated in §5 as a seven-group table summing to 34), the search that defined the hit set, the reads at every live hit, and the scope covered. I re-ran the grep and confirmed the read set is *complete*: all five live hits are read in place. The Gate C elements are all present. (The *counts* narrating this evidence are wrong — that is F-G, a different standard.) |
| **F-E** (Minor) — S1's edit range contradicted itself about line 209 | Pinned contract Gate A (executable without judgment calls) | **closed** | Read of S1: the range now reads "replace **lines 210–212**", and a dedicated paragraph states line 209 "is NOT part of the replaced range and must survive", naming the two consumers of `wf`. Read of `check-structure.mjs:209–212` confirms 210–212 is the correct range. |
| **F-F** (Minor) — §4 carried a planner resolution where the contract requires the user's | Pinned contract §4 ("the user's resolution"; an entry without one is an open bin-2 item) | **closed** | Read of §4: it now states "Not applicable — no spec-vs-reality conflict requiring an owner decision arose during planning", explains the bin-1/bin-2 boundary, and points to D-A (§8) and D-1 (§10) as the content's contract-correct homes. Read of Q-2 in §14 confirms the register entry was updated to match. |

### Upstream findings coverage (`implementation-round-01.md`) — re-checked

| Finding | Plan's disposition | Status | Verification method |
|---|---|---|---|
| F-1 (Critical) unescaped apostrophe | S6 | **covered** | Read of `workflows/expert-lifecycle.js:57–59` this session — the defect is present verbatim. Executed: applying S6's delimiter change to a scratch copy makes the strict oracle ACCEPT the file. |
| F-2 (Critical) syntax gate incapable of failing | S1 + S2 | **covered** | The 6×2 matrix and the four property probes, executed. |
| F-3 (Serious) `LOCATION.pattern` escapes consumed | S7 + S3 | **covered** | Read of `:81` — `pattern: '^[^\s:#]+…'` present. Executed the S3 harness against the current source: effective source `^[^s:#]+(?::d+(?:-d+)?|#S+)$`, 3/3 known-good FAIL. Against a copy with S7's line-81 replacement: source `^[^\s:#]+(?::\d+(?:-\d+)?|#\S+)$`, 3/3 good match, 3/3 bad reject. |
| F-4 (Serious, Systemic) tier validates only as text | S1 (a), S3 (b), S4 (c) | **covered** | Read of S1/S3/S4 against the review's three enumerated instances; S3 closes the class by discovery plus an exemplars-must-exist assertion rather than by naming `LOCATION`. |
| F-5 (Minor) `EVIDENCE` comment overstates | S8 | **covered** | Read of `workflows/expert-lifecycle.js:82–99` this session — comment "Additive: nothing is removed." at `:89`, `required: ['claim_type', 'tool', 'citation', 'observed', 'asserted']` below it, `result: S_STR` still in `properties`. The plan's replacement text is accurate. |

### Pinned output contract — Gate C items

| Contract item | Status | Verification method |
|---|---|---|
| Sixteen sections present; "if applicable" sections with content present | pass | Read of the plan's headings §1–§16 against the contract's enumeration. §4 is present and marked not applicable with its reason. |
| Every step has a **Source** annotation | pass | Read of S1–S9; all nine carry one. |
| Every non-trivial step has all four Gate 3 parts | pass | Read of S1, S2, S3, S4, S5, S7 — each has decision / standard / why here / what this is NOT. S6, S8, S9 are declared trivial with a stated reason, which the contract permits. |
| No step presents alternatives, defers a choice, or contains an unanswered question | pass | Read of all nine steps; zero option sets. |
| §14 register: every entry binned, sourced, dispositioned; sweep count attested; final pass added zero | pass | Read of §14 — 24 entries, all dispositioned, five passes attested with the fifth adding zero. |
| Every bin-2 entry shows the user's answer | pass (vacuous) | Read: no entry is binned 2; Q-15, Q-16, Q-21 are bin 3 and close into §15. |
| §15 Gaps entries carry resolution-attempt evidence | pass | Read of G-1, G-2, G-3; all three carry what was read and executed and why resolution is out of reach. |
| §2 coverage reconciliation maps every requested element | pass | Read of the §2 table against the five upstream findings; 1:1, plus the reviewer's ordering constraint and the both-tiers-green element. |
| §12 test specifications carry all five fields | pass | Read of T-A2a, T-A2a-neg, T-A2d, T-A2e; each has behavior / level / real-double boundary / data / must-not-assert-and-fails-when. T-A2a-neg names the production component obliged to supply the real input. |
| §16 exported-surface check present | pass | Read of §16 item 2; `codegraph_diff_surface` specified, with the three new `_RE` consts identified as module-local. |
| Citation identity — out-of-artifact citations carry immutable identifiers | pass | Read of §11's Citation identity paragraph: the contract and `testing-standards.md` pinned to `94a640a`, `skills/workflow-creator/SKILL.md` to `4caccdb` with working-tree-clean status, working-tree reviews and plans cited by date with unpinnable status stated. |
| **Every factual claim asserted in any plan step has a corresponding §11 entry** | **fail** | F-H. |
| **Every §11 entry carries read-level evidence, with specifics** | **fail** | F-G (claim 12's stated partition of its own search result is contradicted by re-execution). |
| The restating sections (2, 3, 5, 11, 12, 14) were re-derived, not patched | **fail** | F-G. §5 and §11 restate the same doc sweep and disagree with each other. |

---

## Critical & Serious Findings

No Critical or Serious findings — the full inventory was Read or Grep-verified per Compliance Gate B, and no violations of Critical or Serious classification were observed. In particular, every executable construct the plan specifies was executed this session and behaves as the plan states.

---

## Systemic Patterns

### F-H (Moderate, Systemic, recurring) — three Plan-section factual assertions still carry no §11 entry, after a cross-walk the plan describes as exhaustive

**Provenance.** Recurring against round-1 **F-A**, whose named standard is the pinned contract's Gate C item "Every factual claim asserted in any plan step has a corresponding entry in Output section 11. The two are reconciled — claims without entries are non-compliance." F-A's two named instances are closed (verified above). The class is not. The plan's §11 closing note states the fix explicitly — "every factual assertion in §§1–10, 12, 13, 15 and 16 was walked against this list, not the reverse" — and §14's sweep attestation records a fifth confirming pass that "added zero entries." I re-ran that walk and it is not exhaustive.

**What the plan does now — the three unregistered assertions, enumerated.**

1. **The content of `skills/expert-plan/references/testing-standards.md:91`.** The plan asserts what that line says — the regression-detection principle — and rests on it as its ordering constraint. `grep -c "testing-standards.md:91"` over the plan returns **10**. It is the named standard in §3's fourth row, in S1's Gate-3 part 2, in S2's Source and part 2, in S4's part 2, in S5's Source and part 2, and in D-A. §11 has **no numbered entry** for it. The Citation identity paragraph pins the file by commit — showing the planner treated it as a §11-governed citation — but pinning an identifier is not the entry, and the contract's §11 definition names "what a doc currently says" as a factual claim in its own enumerated list.

2. **"The linter block at lines 213–222"** (S1's "What changes", final paragraph: "The linter block at lines 213–222, the `meta`-first assertion, and everything below are untouched."). No §11 entry covers that range — claim 11 registers a read of `:207–213` and of `:425–457`, neither of which reaches it. The range is also wrong.

3. **"`wfSrc` is already in scope in that file (it is read for the T-23 static assertions near line 450)"** (S3, immediately after the code block). The conclusion is true, but the evidence offered does not establish it, and the fact that does — the declaration site — is registered nowhere.

**How these claims were verified. Proactive scan across the full inventory scope, instances enumerated.** I walked every factual assertion in §§1–10 and §§12–16 against §11's twenty-four entries in the assertion-to-list direction, the same direction the plan says it used, and separately re-derived each unregistered assertion from source:

- `git show 94a640a:…/testing-standards.md` into the scratchpad; `grep -n "Regression tests"` → 1 hit, `:91`; the line Read verbatim via `cat -A`: `- **Regression tests** — every fixed bug gets a test that reproduces it first (fails on the broken code), then passes on the fix. A regression test that never failed has not demonstrated it can.` **The plan's citation is accurate** — this instance is a registration gap, not an error. `grep -c "testing-standards.md:91"` over the plan → 10. `sed -n '423,455p'` over §11 → the string `testing-standards` appears once in the whole section, in the Citation identity paragraph, never in a numbered entry.
- `sed -n '205,232p' tests/structural/check-structure.mjs`, Read at drafting time. `:213–214` are the two comment lines, `:215` `const linter = join(…)`, `:216` `if (!existsSync(linter)) {`, `:219` `} else {`, `:222` `check('T-A2a workflow: passes the workflow-creator linter', linterOk);`, **`:223` the closing `}`**, `:224` the `meta`-first assertion. The block ends at 223; S1 says 222.
- `grep -n "wfSrc *=" tests/structural/check-structure.mjs` → **exactly 1 hit, `:95`**: `const wfSrc = readFileSync(join(ROOT, 'workflows/expert-lifecycle.js'), 'utf8');`. `grep -n "wfSrc" | head -5` confirms `:95` is the first occurrence and the only assignment. So `wfSrc` is in scope at S3's insertion point (~`:213`) because it is declared at `:95` — not because it is consumed at `:450`. Had `:450` been the declaration, S3's use at `:213` would have thrown a `ReferenceError` in the temporal dead zone.

Two further checks were run against this class and did **not** confirm additional instances: every other count-bearing assertion in the plan reproduces (T-22 nine and T-23 seven — `grep -n "T-22\|T-23" | grep -c "check("` → 9 and 7; the failure banner at `:543` — Read, `` `\nSTRUCTURAL TESTS FAILED (${failures})` ``; §5's seven-group table summing to 34 — arithmetic checked). The class is confined to the three instances above.

**Which standard it violates.** The pinned contract, Gate C, as quoted above; and §11's own definition of a factual claim, which enumerates "what a doc currently says" and "what a test currently asserts" among the covered kinds. §11 is designated in the contract as "the premise-correctness proof of the output contract," and instance 2 is a demonstration of what the gap costs: an unregistered assertion is an unchecked one, and this one is wrong.

**Why this is Systemic rather than three isolated slips.** All three share the mechanism round 1 named: an assertion phrased as orienting context rather than as a checkable claim. Instance 1 hides behind §3 — a standard registered in the standards registry reads as already accounted for, so the assertion about what its cited line *says* never presents itself as a claim. Instances 2 and 3 hide behind "untouched" and "already in scope" — phrasings whose grammatical job is to reassure rather than to assert. The plan's round-1 correction reversed the direction of the sweep, which was the right fix and caught the two instances round 1 named; what it did not add is a rule for recognising an assertion when it is phrased as reassurance. That is why the class survived a pass that was run correctly.

**Why it matters, and why Moderate rather than Serious.** Instances 2 and 3 carry no execution risk: instance 2 describes code the plan explicitly leaves untouched, and instance 3's conclusion is true, so an implementer following either reaches the right place. Instance 1 is load-bearing but the citation is accurate — I checked. So nothing downstream breaks today. What fails is the property §11 exists to provide: the next reader cannot distinguish a verified citation from a remembered one, and the ten-citation standard that orders the entire plan is on the unverified side of that line. Round 1 classified this class Serious when its instance was an unverified premise about an external component; here every instance is either accurate or inert, which is the honest reason for Moderate.

**What correct implementation looks like.** Add a §11 entry for `testing-standards.md:91` @ `94a640a` — a file read with the line quoted, the way claim 17 handles `skills/workflow-creator/SKILL.md`. Correct S1's range to 213–223 and register it, or delete the range and write "the linter block below it, the `meta`-first assertion, and everything below are untouched" — a boundary-free statement asserts nothing and needs no entry, which is the cheaper fix. Re-ground S3's parenthetical on the declaration: "`wfSrc` is declared at `tests/structural/check-structure.mjs:95` and is therefore in scope at this insertion point", with a §11 entry. And, because this is the class fix rather than three patches: add to the sweep a rule that catches assertions phrased as reassurance — every clause containing a line number, a count, a file range, or the words "already", "untouched", "in scope", or "unchanged" is an assertion until it has an entry.

---

## Moderate & Minor Findings

### F-G (Moderate, new) — the doc-sweep evidence in §5 and §11 claim 12 states four counts that re-executing the plan's own grep contradicts, and the two sections disagree with each other

**What the plan does now.** §5's Documentation paragraph and §11 claim 12 both narrate the same doc-staleness sweep, and both partition its result with explicit counts:

- §11 claim 12: "It returns 21 files; **13** are `docs/plans/` and `docs/reviews/` records …, leaving **8** live documents to read." And later: "The remaining **13** of the 34 — the ten agent files, `commands/expert.md`, `docs/specs/spec-expert-dev-tools.md`, and `docs/arch/architecture-expert-dev-tools.md` — produce **zero** hits."
- §5: "**Nine** of the 34 hold no hit at all (the ten agent files, `commands/expert.md`, the spec, the architecture, `docs/investigate.md` …), and the **eight** documents in the Plans and Reviews groups are dated records of their own rounds."

**How this claim was verified — executed, by re-running the plan's own search.** I ran claim 12's grep verbatim over the plugin:

```
grep -rln "check-structure\|T-A2a\|LOCATION\|parseLocation\|EVIDENCE\|node --check\|NOT_THE_RULER\|valid JS" --include=*.md .
```

→ **21 files**, matching the plan. Partitioning that result:

```
grep -rln <same pattern> --include=*.md docs/plans docs/reviews  →  16
```

So of the 21 hits, **16** are `docs/plans/` or `docs/reviews/` records (6 plans: `plan-expert-dev-tools.md`, `…-behavioral-remediation.md`, `…-remediation-r1.md`, `…-r2.md`, `…-r3.md`, `plan-impl-remediation-r1.md` itself; 10 reviews: `implementation-round-01.md`, `plan-behavioral-remediation-round-01…08.md`, `plan-impl-remediation-r1-round-01.md`), leaving **5** live documents, not 8: `README.md`, `tests/ACCEPTANCE.md`, `docs/review-round-1.md`, `docs/HANDOFF.md`, `docs/behavioral-tier-findings.md`.

And the no-hit set: the 34 candidates contain 18 of the 21 hits (the three outside the candidate set being `docs/HANDOFF.md`, `plan-impl-remediation-r1.md` itself, and — checked — `docs/reviews/output-contract-generated-sections-round-05.md` is *in* the 34 but produces no hit). So **16** of the 34 hold no hit, not nine: the ten agent files, `commands/expert.md`, the spec, the architecture, `docs/investigate.md`, `docs/reviews/output-contract-generated-sections-round-05.md`, and `skills/expert-plan/references/output-contract.md`. §5's own parenthetical enumerates fourteen items while calling them nine; claim 12's parallel sentence enumerates thirteen and calls them thirteen, but omits three that also produce no hit. And §5's "the eight documents in the Plans and Reviews groups" describes groups its own table sizes at 5 + 10 = **15**.

**The conclusion the evidence supports is correct — I checked it independently.** I read every hit in all five live documents:

| Document | Hit | Content | Falsified by S1–S8? |
|---|---|---|---|
| `README.md` | `:24` | `node tests/structural/check-structure.mjs` — a run command | no |
| `README.md` | `:55` | asserts the tier checks the declared MCP server set | no |
| `tests/ACCEPTANCE.md` | `:6` | the same run command | no |
| `tests/ACCEPTANCE.md` | `:8` | "T-A2a workflow valid+deterministic" — a summary true before and after | no |
| `docs/review-round-1.md` | `:115` | an M-1 finding describing the gate as `node --check` + a banned-token regex | no — a dated record of that review's own state |
| `docs/HANDOFF.md` | `:76` | records `EVIDENCE` gaining `observed`/`asserted` | no — that schema change stands; S8 changes only the comment |
| `docs/behavioral-tier-findings.md` | `:21`, `:264`, `:267` | the B4 finding and its remediation record | no — same reason |

So no document goes stale, the read set is complete, and Gate C's content-absence elements are all present — which is why round-1 **F-D closes**. This finding is about a different property.

**Which standard it violates.** The pinned contract, Gate C: "Every entry in Output section 11 carries read-level evidence … **with specifics**", and §11's designation as "the premise-correctness proof of the output contract." An entry whose specifics are contradicted by re-executing the entry's own search does not carry evidence a reader can follow; it carries a narrative that happens to end in the right place. And the contract's "Sections that restate the step set — known drift sites" rule, which names sections 5 and 11 explicitly: these two sections restate one sweep and state mutually inconsistent partitions of it, which is precisely the drift the rule exists to catch.

**Why it matters, and why Moderate.** Nothing downstream breaks — the conclusion holds and I verified it. What breaks is reproducibility, which is the entire function of §11: a reader who does what claim 12 says gets 21 files and then cannot reconcile "13" or "8" or "nine" with anything, and at that point the honest reading is that the sweep was narrated rather than counted. It is Moderate for the same reason round 1 classified F-D Moderate: the contract names this class explicitly, and evidence that cannot be reproduced from its own stated procedure is the shape that is eventually wrong about something that matters.

**What correct implementation looks like.** Not a patch of the four numbers — the contract's restating-sections rule forecloses that: "Editing a step re-derives every restating section from the current step set. It never patches them at the lines a review named." Re-derive §5's Documentation paragraph and §11 claim 12 together from one executed run of the sweep, so a single partition is stated once and both sections quote it: 21 hits; 16 in `docs/plans/` and `docs/reviews/`; 5 live documents, enumerated, each with its hit lines and the reason it does not go stale; 16 of the 34 candidates producing no hit, enumerated; scope covered. State the partition in one place and cross-reference it from the other, rather than paraphrasing it twice.

---

## Tentative Findings

No tentative findings — every candidate finding's premise was verified per Compliance Gate B. Every Node and regex premise was re-executed in this session's scratchpad rather than imported from the plan or from either prior review; every literal-content premise was Read at the cited line at drafting time; every count was re-derived by running the search that produced it.

---

## Observations

- The plan's S1 code block re-reads the workflow with `readFileSync(wf, 'utf8')` for the T-A2a assertion, although `wfSrc` at `:95` already holds exactly that content and S4's T-A2e uses `wfSrc`. This is a redundant read of one file in a static test tier, not a divergence from any standard — recorded because a reader comparing S1 and S4 will notice the two assertions obtain the same bytes by different routes and may wonder whether the difference is meaningful. It is not.
- I confirmed two premises that would have been findings had they gone the other way, and neither did. `workflows/expert-lifecycle.js` is LF-only (`CR count: 0, LF count: 761`), so S3's `$`-anchored multiline extraction regexes are safe — under CRLF the trailing `\r` would have defeated both of them. And S7's `LOCATION_RE.test` guard diverges from the current `parseLocation` on **zero of twelve** probes (the six T-A2d exemplars plus `a#b#c`, `x:1-2-3`, the empty string, `f.md:0`, `f.md#`, `f.md# s`), confirming §13's "bounded on inspection" claim by execution rather than by inspection. No standard is violated by either; recorded because both were live risks worth closing on the record.
- `docs/HANDOFF.md` is one of the five live documents the sweep hits and the plan reads, but it is not a member of the 34-document candidate set §5 enumerates. This is correct and not a gap — the plan's search scope is deliberately a superset of the candidate set ("every `.md` file in the plugin"), and the dispatch forbids editing `docs/HANDOFF.md` in any case. Recorded so a reader reconciling §5's table against the read list does not mistake it for an inconsistency.

---

## What's Actually Good

**The strict-mode correction was applied as a class fix, not as a one-token patch, and it survives independent execution unchanged.** *Property:* the directive is not merely inserted into S1's code; the reason it is load-bearing is written into the oracle's own comment (which names all six early-error classes), into §3's ECMA-262 §11.2.2 row, into D-1's decision table as a fourth row that makes the sloppy variant an explicitly rejected alternative, into §12's T-A2a behaviour field, and into §14 as Q-20 — and D-1 adds a calibration note stating plainly that the harness is *not* documented as strict, so the oracle is deliberately conservative rather than an exact model, with G-3 recording the gap. *Standard:* ECMA-262 §11.2.2 (module code is always strict; the six early errors are SyntaxErrors under it), and the regression-detection principle at `testing-standards.md:91` @ `94a640a` (a gate whose grammar is looser than its subject's has a standing class it cannot fail on). *Verified:* the 6×2 matrix executed on Node v22.16.0 — sloppy ACCEPTED 6/6, strict rejected 6/6 with the diagnostics the plan records verbatim — plus the four property probes (current workflow rejected, patched ACCEPTED, fixture rejected, legitimate `await`+`return` ACCEPTED). A correction that closes the finding, records why the fix works, and names the residual asymmetry it does not close is the shape a fix round is supposed to produce.

**S5's expected failure set survived a second independent falsification attempt, with the pre-fix mixed signature reproducing exactly.** *Property:* the plan predicts not just five failures but which five, which assertions must stay green, and the literal banner text — and I reproduced the S3 half without running the tier. *Standard:* the regression-detection principle, and ISO/IEC/IEEE 29119-4 boundary/partition discipline for the mixed signature. *Verified:* I executed S3's extraction and evaluation verbatim against the current unfixed source — `constructs as a RegExp` true, 3/3 known-good `false`, 3/3 known-bad correctly rejected — which is exactly the mixed signature S3's Verification field predicts and yields exactly three of the five predicted failures; the other two (T-A2a, T-A2e) follow from the strict oracle rejecting the current workflow, executed. Read of `check-structure.mjs:543` confirms the banner is `` `\nSTRUCTURAL TESTS FAILED (${failures})` ``, so `STRUCTURAL TESTS FAILED (5)` is the literal expected form. A prediction this specific, falsifiable before implementation and surviving two independent attempts, is worth more than the tier run it anticipates.

**The §11 re-derivation deleted an assertion rather than registering it.** *Property:* the "17 sites inside the phase router" parenthetical was not patched into a §11 entry; it was removed, with Q-24 and the §11 closing note recording that `grep -c "^  return "` returns 17 but counts every two-space-indented `return` including those inside function declarations — so the number does not measure what the phrase claimed. *Standard:* the pinned contract's §11 ("A claim that could not be verified does not appear in the Plan section") and Gate C's claim-to-entry reconciliation. *Verified:* `grep -n "17 sites"` over the plan returns 2 hits, both in the disposition notes at `:450` and `:526`, and none in §4, which now carries no such parenthetical. The easy move under a finding that says "register this claim" is to register it; recognising that the claim's own measurement is invalid and deleting it instead is the harder and correct call, and the plan states the reasoning rather than performing the deletion silently.

---

## Convergence Record

- **Round number:** 2 (first Post-fix round), matching Scope and Inventory.
- **Trajectory (findings by severity, from each round's mechanical verdict breakdown):**
  - R1: **6** — 1 Serious-Systemic, 3 Moderate, 2 Minor.
  - R2: **2** — 2 Moderate (one of them Systemic).
- **Flow counts for this round** (source: the Step 9 provenance classification on each finding):
  - Prior findings **closed: 5** — F-B, F-C, F-D, F-E, F-F, each verified above against the standard its original finding named.
  - **Recurring: 1** — F-H, against round-1 F-A's standard (Gate C claim-to-§11 reconciliation), at three new locations. F-A's two named instances closed; its class did not.
  - **New: 1** — F-G.
  - **Regressions: 0** — no finding this round was introduced or exposed by the corrections. Every correction was independently re-executed and none altered a property the plan needs.
- **Tripwire evaluation — NOT FIRED, with the arithmetic shown:**
  - Condition (a): new + regression ≥ closed, for two consecutive Post-fix rounds. This round: new (1) + regression (0) = **1**; closed = **5**. 1 ≥ 5 is **false**, so (a) does not hold this round, and one round cannot satisfy a two-consecutive-round condition in any case.
  - Condition (b): total findings have not strictly decreased for two consecutive Post-fix rounds. Totals: R1 = 6, R2 = 2. 2 < 6, so the total **strictly decreased**; (b) does not hold, and again this is the first Post-fix round.
  - Neither condition holds. The tripwire has not fired, and the fix cycle is converging rather than churning: five of six findings closed, no regressions, and the two open items are both in bookkeeping sections while the plan's engineering is verified correct by execution.

---

## Recommended Priority

The tripwire has not fired, so a further targeted fix round — not foundational rework — is the indicated path.

1. **F-H first, and as the class fix rather than three patches.** It is the only finding that touches the mechanism by which the plan proves its own premises, and it is the second round in which that mechanism has let assertions through. Add the `testing-standards.md:91` entry (the load-bearing one), then apply the sweep rule that catches assertions phrased as reassurance — line numbers, counts, ranges, and the words "already", "untouched", "in scope", "unchanged". Fixing only the three named instances will produce a third round of the same class; the round-1 correction already demonstrated that reversing the sweep's direction is necessary and not sufficient.
2. **F-G.** Re-derive §5's Documentation paragraph and §11 claim 12 together from one executed run of the sweep, per the contract's restating-sections rule. Do not patch the four numbers where this review named them — that is the failure mode the rule exists to prevent, and §5 and §11 disagreeing with each other is what patching one at a time produces.

Both fixes are confined to §5 and §11. No step changes, so §§2, 3, 12 and 14 need no re-derivation beyond the register entries the F-H sweep rule adds — but the rule's own output should be checked against §14 before delivery, since a new sweep rule that finds nothing is the signal to re-run it, not to attest it.

Nothing in S1–S9 requires change. The plan's engineering is verified.

---

Verdict: NEEDS FIXES (2 findings: 1 Moderate-Systemic, 1 Moderate)
