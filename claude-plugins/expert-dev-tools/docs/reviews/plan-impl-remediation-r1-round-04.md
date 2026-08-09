# Plan review — implementation remediation, round 4 (Post-fix)

**Round:** 4 (Post-fix review of the round-3 corrections)
**Artifact:** `claude-plugins/expert-dev-tools/docs/plans/plan-impl-remediation-r1.md` (working tree, 632 lines; 595 at round 3; 548 at round 2; 495 at round 1)
**Governing output contract:** `claude-plugins/expert-dev-tools/skills/expert-plan/references/output-contract.md` **at commit `94a640a`** (pinned by the dispatch; the working-tree copy does not govern)
**Prior round records:** `docs/reviews/plan-impl-remediation-r1-round-01.md` (NEEDS FIXES; F-A … F-F), `-round-02.md` (NEEDS FIXES; F-G, F-H), `-round-03.md` (NEEDS FIXES; F-I, F-J)
**Upstream artifact:** `docs/reviews/implementation-round-01.md` (NEEDS FIXES; F-1 … F-5)
**Reviewer:** independent (expert-review R1.2)
**Date:** 2026-08-09

---

## Scope and Inventory

### Round number

Round 4. Post-fix review; inventory constructed per expert-review Step 2's post-fix source, and the full process runs unchanged over it.

### Tool plan (Step 3)

Instruments available this session: `Bash` (git, grep, sed, awk, node, wc), `Read`, `Grep`, `Glob`, `Write`, Clear Thought (`metacognitivemonitoring`, `collaborativereasoning`).

| Claim type | Instrument | Used for |
|---|---|---|
| Literal-content ("line N says Z") | `Read` / `sed -n` at the specific line | plan claims 1, 8, 10, 14, 24, 27; `check-structure.mjs:254,255,376`; `implementation-round-01.md:54,270–276,330–332,438,488,517–519`; §14's attestation sentences |
| Absence / candidate-set enumeration | `grep` over a named scope, query and count recorded | F-K's registration gap; claim 12's partition; claim 23's single-`pattern:` half |
| Behavioral (parser accepts/rejects X; regex partitions Y; guard divergence) | **executed** — `probe4.mjs` written with the `Write` tool, run on Node v22.16.0 | the 6×2 strict-mode matrix; the four oracle property probes; S3's harness on pre- and post-S7 source; S7's 12-probe guard-divergence test |
| Structural / ordering (declaration vs use site) | `grep -n` for the assignment, `sed` for the region | `wfSrc` scope at `:95` |
| Claims imported from prior documents (rounds 1–3, the plan's own §11) | re-derived from source or re-executed | every disposition below |

No instrument class was unavailable. Context7 was not required: the plan integrates no third-party library API — every external-behaviour claim concerns the Node.js runtime and the ECMAScript grammar, both verified by direct execution, which is a stronger instrument than a docs lookup for these claim types.

**Execution hygiene.** All executions ran in the session scratchpad (`…/scratchpad/probe4.mjs`) against copies read from the repository. **No write mode was run against any repository file**; the only repository write is this review record. The recorded shell-escaping hazard on the octal-escape probe was honoured: the probe was written with the `Write` tool rather than through a heredoc, every apostrophe and backslash was introduced via `String.fromCharCode(39)` / `String.fromCharCode(92)`, and each probe's actual bytes were printed before the matrix ran. The octal-escape case printed `"const s = '\\101'"` (JSON doubling of one surviving backslash), and the S2 fixture line printed as `const claim = 'The authoring skill's process rules are not the standard'` — both intact.

**Not re-executed this session, stated rather than glossed:** `codegraph_find_related_docs`'s 34-document result (claim 12's candidate set) and `codegraph_list_files`'s seven-JavaScript-file result (claim 21). Both are structural traces properly cited; neither is contradicted by anything observed here, and neither carries a finding.

### File inventory

Constructed per Step 2's Post-fix source: the prior review's full inventory, plus the fix-diff (the plan document, which is the entire fix-diff for a plan artifact), plus its dependents, plus the prior review's two findings as closure items.

- [x] `docs/plans/plan-impl-remediation-r1.md` — Read in full (1–355, 356–632). The fix-diff file.
- [x] `docs/reviews/plan-impl-remediation-r1-round-03.md` — Read in full (1–252). Prior findings as closure items.
- [x] `docs/reviews/plan-impl-remediation-r1-round-02.md` — Grep-verified for the claims the plan now makes about it: `grep -n "\b21\b\|\b16\b"` → `:35, 47, 52, 53, 81, 82, 101, 106, 110, 128, 138, 162`, with `:53` (`16 of the 21 hits`) and `:134` (`"The linter block at lines 213–222"`) Read in place; verdict line Read.
- [x] `docs/reviews/plan-impl-remediation-r1-round-01.md` — `grep -n "^### F-\|^## "` → the six findings F-A … F-F enumerated; verdict line Read (`6 findings: 1 Serious-Systemic, 3 Moderate, 2 Minor`).
- [x] `docs/reviews/implementation-round-01.md` — the upstream contract. Contract table rows Read at `:132–152` (21 data rows); `:54`, `:270–276`, `:330–332`, `:438`, `:488`, `:517–519` Read in place.
- [x] `docs/plans/plan-expert-dev-tools-behavioral-remediation.md` — `grep -cE "^### S[0-9]+[a-z]? "` → **26**; `grep -n "1\.5 *M"` → `:45, 2799, 3067`; `grep -n "claim 27"` → `:89`; `grep -n "^\*\*D-1\|^\*\*D-8"` → `:1677, :1761`; `grep -n "S6b part 5"` → `:67, 635, 2121`; `grep -n "^### S22"` → `:1543`. All cited regions Read in place.
- [x] `skills/expert-plan/references/output-contract.md` **@ `94a640a`** — `git show` into the scratchpad, Read in full (100 lines; sixteen sections, three gates, the restating-sections rule).
- [x] `skills/expert-plan/references/testing-standards.md` **@ `94a640a`** — carried as claim 25's closure item; the line-91 text was verified verbatim at round 3 and is unchanged by this round's corrections, which touch no §3 registry row.
- [x] `workflows/expert-lifecycle.js` — Read at `:57–59`, `:81`, `:89`, `:289–297`; full copy parsed under the strict oracle and processed by the S3 harness in the scratchpad.
- [x] `tests/structural/check-structure.mjs` — `sed -n '254p;255p;376p'` Read in place (the D-B withdrawal's three premises); `grep -n "wfSrc *="` → **1 hit, `:95`**; `grep -n "T-22\|T-23" | grep -c "check("` → **16**; `sed -n '543p'` for the banner.
- [x] `README.md`, `tests/ACCEPTANCE.md`, `docs/review-round-1.md`, `docs/HANDOFF.md`, `docs/behavioral-tier-findings.md` — the five live sweep documents, identified by re-executing the plan's own grep with its exclusion rule.
- [x] `docs/plans/` and `docs/reviews/` (18 files this round) — Grep-verified as a set by re-executing the sweep; counts recorded in the Observations section.
- [x] `tests/fixture/` — the S2 fixture text was executed verbatim through the oracle in the scratchpad.

No `[ ]` remain.

### Rigor waivers

None. No compression of this review's process was requested or applied.

---

## Summary

**This review returns NEEDS FIXES, and both non-convergence tripwire conditions have fired.** The plan's engineering is now verified correct by independent execution for the third consecutive round — I re-derived every executable claim from scratch in a fresh scratchpad and all of it reproduces, including the 6×2 strict-mode matrix, S3's extraction harness on both pre- and post-S7 source, and S7's guard diverging from the current `parseLocation` on 0 of 12 probes. Round-3's two findings were addressed at every named instance: the thirteen cross-document citations F-I enumerated are now registered as §11 claims 28–29, and I re-derived all thirteen against their source documents and found them accurate; §14's two-paragraph attestation was replaced with a single table that records the scope each pass swept, which is structurally what F-J asked for. But both classes survived the correction. The corrected sweep returned **exactly the two documents round 3 named and no others** — which is the outcome round 3's Recommended Priority explicitly designated as the signal that the scope was wrong again — leaving unregistered every assertion the plan makes about the content of its own three review records, the three line-numbered reads §8's new D-B withdrawal rests on, and §15's `:74–135` range. And §14's re-derived attestation carries two fresh arithmetic contradictions against the sections it summarizes. Nothing in S1–S9 requires change; both findings are Moderate and both sit in the plan's self-verification bookkeeping. The convergence arithmetic is now unambiguous: the total finding count has been flat at 2 for three consecutive rounds and new-plus-regression has met or exceeded closed for two, so conditions (a) and (b) both fire and the indicated path is foundational rework, not a fifth fix round.

---

## Upstream Contract Verification

Two upstream contracts govern: the pinned output contract (structure and gates), and for this Post-fix round the two findings of round 3 (closure). The five findings of `implementation-round-01.md` remain the coverage reference and were re-checked.

### Round-3 findings — closure status, re-derived from source

Each closure is checked against the standard the original finding named, not an adjacent one.

| Prior finding | Originally named standard | Status | Verification method |
|---|---|---|---|
| **F-I** (Moderate, Systemic, recurring) — the §11 registration class recurs at seven locations outside §7, because the corrective sweep was scoped to §7 while §11's population definition says "anywhere in this document" | Pinned contract Gate C: *"Every factual claim asserted in any plan step has a corresponding entry in Output section 11. The two are reconciled — claims without entries are non-compliance."* | **named instances closed; class NOT closed — see F-K** | All seven named instances are now registered. §11 **claim 28** covers the six upstream-plan citations and **claim 29** the seven upstream-review citations, each with per-region reads. I re-derived all thirteen independently: `grep -cE "^### S[0-9]+[a-z]? "` → **26** (accurate); `grep -n "1\.5 *M"` → `:45, 2799, 3067`, `:45` reading *"it costs ~1.5 M subagent tokens"* (accurate); `grep -n "claim 27"` → `:89`, quotation character-exact (accurate); `D-1`/`D-8` at `:1677`/`:1761`, `:1761` reading *"This plan carries the defect class that fired the APS Fusion tripwire…"* (accurate); `S6b part 5` at `:67, 635, 2121` (accurate); `^### S22` at `:1543` (accurate). Upstream-review half: contract table rows Read at `:132–152` → **21 data rows, 20 `pass`, row 21 "Plan §1 goal" `fail`** — §2's corrected "twenty" is right and the former "twenty-two" is gone; F-2's prescription Read at `:270–276`; T-1 at `:438`; the 27-file statement at `:54`; the `pattern:` sweep at `:330–332`; the boundary cases at `:488`; the ordering instruction at `:517–519`. Twelve of thirteen accurate as the plan states them, one corrected at source. The **class** recurs at three new families — F-K. |
| **F-J** (Moderate, regression) — §14 attests "Four passes" while the same section narrates seven | Pinned contract §14 (*"Ends with the reconciliation sweep attestation: number of passes performed, confirmation the final pass added zero entries"*) and the "Sections that restate the step set — known drift sites" rule, which names §14 | **structural fix applied; the defect it names recurs — see F-L** | The two-paragraph structure is gone: §14 now carries one table (`:601–609`) with a **Scope actually swept** column per pass, which is both halves of what F-J and F-I's fix 2 asked for. The headline count is now internally consistent with the table's row set — Read at `:599` (*"Reconciliation sweep — nine passes"*) against rows `1–3, 4, 5, 6, 7, 8, 9`. But the summary sentence beneath it, and Q-32, both carry counts their own sections contradict — F-L. The condition F-J named (an attested number contradicted by the text it summarizes) therefore still holds in §14. |

### Upstream findings coverage (`implementation-round-01.md`) — re-checked

| Finding | Plan's disposition | Status | Verification method |
|---|---|---|---|
| F-1 (Critical) unescaped apostrophe | S6 | **covered** | `sed -n '57,59p' workflows/expert-lifecycle.js` — line 58 is `  'The authoring skill's process rules are not the standard — judge the artifact, not the ' +`, the defect verbatim. Executed: the strict oracle rejects the current file with `Unexpected identifier 's'`; applying S6's delimiter change to a scratch copy flips it to accept. |
| F-2 (Critical) syntax gate incapable of failing | S1 + S2 | **covered** | The 6×2 matrix and four property probes, executed (recorded under What's Actually Good). |
| F-3 (Serious) `LOCATION.pattern` escapes consumed | S7 + S3 | **covered** | `sed -n '81p'` — `pattern: '^[^\s:#]+(?::\d+(?:-\d+)?|#\S+)$'` present. Executed S3's harness against current source: effective regex source `^[^s:#]+(?::d+(?:-d+)?|#S+)$`, 3/3 known-good FAIL, 3/3 known-bad reject. Against a copy carrying S7's replacement: source `^[^\s:#]+(?::\d+(?:-\d+)?|#\S+)$`, 3/3 good match, 3/3 bad reject. |
| F-4 (Serious, Systemic) tier validates only as text | S1 (a), S3 (b), S4 (c) | **covered** | Read of S1/S3/S4 against the review's three enumerated instances. Executed: on current source S3's `reDecls` regex matches nothing and `schemaNames` is `['LOCATION']`; on post-S7 source `reDecls` returns the `LOCATION_RE` line and `schemaNames` is unchanged — the discovery loop finds the declaration S7 writes. |
| F-5 (Minor) `EVIDENCE` comment overstates | S8 | **covered** | `sed -n '89p'` — `// hiding in prose that conflates the two. Additive: nothing is removed.` present; S8's replacement text is accurate against the `required` array claim 14 registers. |

### Pinned output contract — Gate C items

| Contract item | Status | Verification method |
|---|---|---|
| Sixteen sections present; "if applicable" sections with content present | pass | Read of §1–§16 against the contract's enumeration; §4 present and marked not applicable with its reason. |
| Every step has a **Source** annotation | pass | Read of S1–S9; all nine carry one. |
| Every non-trivial step has all four Gate 3 parts | pass | Read of S1, S2, S3, S4, S5, S7; S6, S8, S9 declared trivial with a stated reason, which the contract permits. |
| No step presents alternatives, defers a choice, or contains an unanswered question | pass | Read of all nine steps; zero option sets. |
| §14 register: every entry binned, sourced, dispositioned | pass | Read of §14 — 33 entries (Q-1 … Q-33), all dispositioned; `:611` states zero remain open and none is bin 2. |
| §14 sweep count attested; final pass added zero | pass | Read of `:599` and the table's pass-9 row ("Same as pass 8, over the amended document … zero"). |
| **§14's attested arithmetic consistent with the sections it summarizes** | **fail** | F-L — two counts contradicted by §14's own table and by §11 claims 28–29. |
| Every bin-2 entry shows the user's answer | pass (vacuous) | Read: no entry is binned 2; Q-15, Q-16, Q-21 are bin 3 and close into §15 as G-1, G-2, G-3. |
| §15 Gaps entries carry resolution-attempt evidence | pass | Read of G-1, G-2, G-3; all three carry what was read and executed and why resolution is out of reach. |
| §2 coverage reconciliation maps every requested element | pass | Read of the §2 table against the five upstream findings; 1:1, plus the ordering constraint and the both-tiers-green element. |
| §12 test specifications carry all five fields | pass | Read of T-A2a, T-A2a-neg, T-A2d, T-A2e; each has behavior / level / real-double boundary / data / must-not-assert-and-fails-when. T-A2a-neg names the production component obliged to supply the real input (`workflows/expert-lifecycle.js`, obligation asserted by T-A2a), satisfying the contract's double-obligation clause. |
| §16 exported-surface check present | pass | Read of §16 item 2; `codegraph_diff_surface` specified, the three new `_RE` consts identified as module-local; `grep -n "^export" workflows/expert-lifecycle.js` → 1 hit at `:1`. |
| **Citation identity — out-of-artifact citations carry immutable identifiers** | **fail** | F-K instance 1 — `docs/reviews/plan-impl-remediation-r1-round-02.md` and `-round-03.md` are cited for their content and appear nowhere in §11's Citation identity paragraph, which names only `-round-01.md`. |
| **Every factual claim asserted in any plan step has a corresponding §11 entry** | **fail** | F-K. |
| Every §11 entry carries read-level evidence, with specifics | pass | Claims 28 and 29 carry per-region reads; I re-derived all thirteen regions against source. Claim 12's live-document count of 5 reproduces exactly. |
| The restating sections (2, 3, 5, 11, 12, 14) were re-derived, not patched | **fail** | F-L — §14 was re-derived this round and the re-derived text carries two counts its own table and §11 contradict. |

---

## Critical & Serious Findings

No Critical or Serious findings — the full inventory was Read or Grep-verified per Compliance Gate B, and no violations of Critical or Serious classification were observed. Every executable construct the plan specifies was executed this session and behaves exactly as the plan states, including the three constructs not yet written into the repository (the strict oracle, S3's extraction-and-evaluation harness, and S7's `LOCATION_RE` guard).

---

## Systemic Patterns

### F-K (Moderate, Systemic, recurring) — the §11 registration class survives a fourth consecutive round, because the corrected sweep enumerated cross-document citations for exactly the two documents round 3 named and for no other cited document, and did not sweep the claims the correction itself introduced

**Provenance.** **Recurring** against round-1 **F-A**, round-2 **F-H**, and round-3 **F-I**, whose named standard is the pinned contract's Gate C item: *"Every factual claim asserted in any plan step has a corresponding entry in Output section 11. The two are reconciled — claims without entries are non-compliance."* All previously named instances are closed and verified above. This is the fourth consecutive round in which the class itself survives.

**What the plan does now.** §11's preamble (`:427–430`) states the population mechanically and correctly, and this round adds the marker rule F-I asked for:

> **Attribution phrasing** — **any clause naming a section, decision, claim, step, finding, table, or count of a document other than this one** … is an assertion about that document's *content*, and reads as citation rather than claim. It needs an entry carrying a read of the cited region, exactly as a claim about source code does.

§14's pass-8 row records what was executed against that rule: *"Found thirteen cross-document citations: the six upstream-plan claims and seven upstream-review claims."* Thirteen citations, two source documents — and those are precisely the two documents F-I enumerated. Round 3's Recommended Priority named this outcome in advance: *"A sweep that returns exactly the seven claims listed in F-I has been run at the wrong scope again."* The rule as written reaches "a document other than this one"; the execution reached the two documents the last review had already named.

**The unregistered claims, enumerated in three families.**

*Family 1 — the plan's own review records (`docs/reviews/plan-impl-remediation-r1-round-0{1,2,3}.md`).* Twelve assertions about what those documents found, established, or measured, none carrying a numbered §11 entry:

| # | The claim | Plan line |
|---|---|---|
| 1 | "Round 2 of review on this plan found this paragraph and claim 12 narrating the same sweep with mutually inconsistent counts" | §5 `:84` |
| 2 | "round 2 of review on this plan found exactly such a range both unregistered and wrong" | **S1, `:115` — inside a plan step** |
| 3 | "Round 3 of review on this plan established that … the round-2 sweep ran the content-citation half over §7 alone" | §11 preamble `:432` |
| 4 | "round 2 of review on this plan found the two narrating it separately and disagreeing" | §11 claim 12 `:445` |
| 5 | "Round 2 of review on this plan ran the identical grep one round earlier and **got 21 and 16**" — a count from another document | §11 claim 12 `:457` |
| 6 | "Round 1 of this plan cited `:41–42` here and `:49–50` in S6" | §11 claim 13 `:476` |
| 7 | "Round 2 of review on this plan found the earlier draft citing this block as **'lines 213–222'**" — a quotation | §11 claim 26 `:490` |
| 8 | "Round 1 of review on this plan found two load-bearing assertions in the Plan section with no entry here, and classified it Systemic" | §11 `:512` |
| 9 | "Round 1 of review on this plan found the narrative also occupying §4" | §14 Q-2 `:566` |
| 10–12 | "Round 1 of review showed a walk over the list cannot find…", "Round 2 showed judgment does not recognise…", "Round 3 showed every survivor was a cross-document citation *outside* §7" | §14 `:603, :604, :606` |

**Verified accurate where I could check them, which is why this is Moderate and not Serious.** `grep -n "\b21\b\|\b16\b" docs/reviews/plan-impl-remediation-r1-round-02.md` → `:53` reads *"16 of the 21 hits fall in these two directories"* — claim 5 is accurate. `grep -n "213–222"` on the same file → `:134` reads *"**\"The linter block at lines 213–222\"**"* — claim 7's quotation is exact. `grep -n "^### F-" docs/reviews/plan-impl-remediation-r1-round-01.md` → F-A at `:102` is *"load-bearing factual assertions in the Plan section carry no §11 entry"*, classified Serious-Systemic — claim 8 is accurate.

*Family 2 — §8's new D-B withdrawal, introduced by this round's correction.* §8 (`:383`) asserts three line-numbered facts about `tests/structural/check-structure.mjs`: `M-3 A-4b fabricating-implementer fixture parses` at `:254`, `M-3 A-4c contradictory spec fixture present` at `:255`, and `T-19 the A-4c fixture frames the contradiction as three-way` at `:376`. **The three facts are accurate** — `sed -n '254p;255p;376p'` returns exactly those three `check(` calls. No §11 entry covers them: `sed -n '423,515p' plan-impl-remediation-r1.md | grep -n "254\|255\|376"` → **zero hits**. Worse, both §8 and Q-31 (`:595`) attribute the reads to *"§11 claim 28"* / *"claim 28's sibling read"* — and claim 28 is the entry for `docs/plans/plan-expert-dev-tools-behavioral-remediation.md`, a different document that says nothing about the tier's fixture assertions. The evidence pointer resolves to an entry that does not contain the evidence.

*Family 3 — §15 G-2's range.* G-2 (`:619`) cites *"the workflow's schema region (`workflows/expert-lifecycle.js:74–135`)"*. §11 claim 8 registers `:81` only; no entry registers `:74–135`. §15 is inside §11's declared sweep scope.

**How this claim was verified. Proactive scan across the full inventory scope, queries and result counts recorded, instances enumerated.**

- **The registration gap, family 1.** `grep -n "round-0" docs/plans/plan-impl-remediation-r1.md` → hits at `:5, 81, 141, 471, 501, 514`. `:5` is the upstream-artifact header, `:81`/`:471` are §5's candidate-set table, `:141` is the S2 fixture comment, `:501` is claim 29 (the *implementation* round-01 review, a different document), and `:514` is the Citation identity paragraph — which names `plan-impl-remediation-r1-round-01.md` and **neither `-round-02.md` nor `-round-03.md`**, both of which the plan cites for content. I Read §11's entries 1–29 in full: none cites any review-round record of this plan. This is the same shape F-I named for the behavioural-remediation plan — present in Citation identity, absent from the numbered list — one document family further out.
- **The assertion sites, family 1.** `grep -n "Round [0-9] of review\|Round [0-9] showed\|Round [0-9] of this plan\|round-2 sweep\|round [0-9] of review"` → hits at `:84, 115, 432, 445, 457, 476, 490, 512, 566, 603, 604, 606` — the twelve tabulated above.
- **The registration gap, family 2.** `sed -n '423,515p' | grep -n "254\|255\|376"` → **0 hits**, against three line citations asserted in §8.
- **Confirming the scope of the class.** I re-ran the line-citation half of the plan's own marker scan over §§1–6, §§8–10 and §§12–16 (`awk` extracting those line ranges, then `grep -E ':[0-9]+|line [0-9]|lines [0-9]'`). Every other hit resolves to an existing entry: `:48` → claim 25, `:63–64` → claims 1, 8, 10, 14, 11, `:396`/`:401` → claim 4, `:415`/`:577` → claim 12, `:539` → claim 28's S6b bullet, `:566–591` → claims 4, 11, 12, 17, 25, 26, 27, `:628` → claim 23, `:617` → claim 8. **The residue is exactly families 2 and 3.** So the class is now confined to (i) a cited-document family the sweep never considered and (ii) claims the correction itself wrote after the sweep ran.

**Which standard it violates.** The pinned contract, Gate C, as quoted above; the pinned contract's Citation-identity item (*"Every claim in Output section 11 that cites an artifact outside the work under change carries an immutable identifier"* — rounds 02 and 03 carry none); and §11's own attribution-marker rule, written this round, which family 1 falls squarely inside ("any clause naming a … finding, table, or count of a document other than this one").

**Why this is Systemic rather than sixteen isolated slips.** All sixteen share one mechanism, and it is the fourth distinct mechanism this class has used. Round 1: wrong sweep direction. Round 2: population defined by judgment. Round 3: correct population, execution narrower than the declared scope. Round 4: correct population, correct declared scope, **execution enumerated by the prior review's finding list rather than by the document's own citations** — plus no re-sweep of the text the correction itself added. §14's pass-8 row is the proof: it reports thirteen citations across two documents, and those two documents are F-I's two. A sweep driven by the rule as written would have had to ask "which documents does this plan cite?" and would have reached the review records at `:84`, `:115` and eight other sites. Each round has closed the mechanism the last review named and introduced the next, which is the "named instances close, the class resurfaces" shape the plan itself quotes at S3 part 4 — and this round's instance was predicted by name in round 3's Recommended Priority.

**Why it matters, and why Moderate.** Every claim in families 1 and 2 that I could check is accurate, so nothing downstream breaks today and no implementer is misled. What fails is the property §11 exists to provide — the contract designates it *"the premise-correctness proof of the output contract"* — and, for rounds 02 and 03, the checkability the Citation-identity rule exists to guarantee: those two records are untracked working-tree files, so a reader one edit from now cannot distinguish "this was never true" from "this was true and the source moved." Moderate rather than Serious for the same reason rounds 2 and 3 gave: every instance is accurate on inspection.

**What correct implementation looks like.** Not sixteen entries appended to §11 — that is the fourth consecutive instance patch, and three rounds of evidence say it produces a fifth round. The mechanism to change is *how the sweep enumerates its population*. Concretely: derive the sweep's document list from the plan itself rather than from any review's finding list — extract every distinct path, document name, and "Round N of review" reference the document contains, then walk that list, registering one grouped entry per cited document with per-region reads. Re-sweep after every correction, since families 2 and 3 are text the last correction wrote. And extend Citation identity to every cited document, not the subset that already has entries. Given the tripwire state recorded below, this is described so the finding is actionable, not as a recommendation to run a fifth fix round — see Recommended Priority.

---

## Moderate & Minor Findings

### F-L (Moderate, recurring) — §14's re-derived attestation carries two counts contradicted by its own table and by §11

**Provenance.** **Recurring** against round-3 **F-J**, at the same section and against the same standard. The two-paragraph structure F-J diagnosed as the cause was correctly removed; the defect it named — an attested number contradicted by the text it summarizes — reappeared in the re-derived text. One of the two instances (Q-32) is text this round introduced.

**What the plan does now.**

*Instance (a) — the pass breakdown.* §14's table (`:601–609`) enumerates passes as rows `1–3`, `4`, `5`, `6`, `7`, `8`, `9` — nine passes, pass 9 a single row described as *"Same as pass 8, over the amended document."* The headline at `:599` reads **"Reconciliation sweep — nine passes"**, consistent with that. The summary at `:611` then reads:

> Nine passes, **four of which (5, 7, and the two halves of 9)** were confirming passes and three of which (1–3) were run in a direction now known to be useless.

The table has three confirming passes (5, 7, 9) and three useless ones (1–3), leaving three productive (4, 6, 8): 3 + 3 + 3 = 9. Counting pass 9 as two halves makes the confirming set four and the total ten, contradicting the "nine" in the same sentence and the nine rows above it.

*Instance (b) — the citation-accuracy count.* §11 claim 28 closes (`:500`): *"All six re-derived from the upstream file this session and **all six accurate**; none required a correction."* §11 claim 29 closes (`:510`): *"**Six of the seven** were accurate as cited; the seventh (the table row count) was not."* Six plus six accurate out of thirteen = **twelve accurate, one wrong**. §14's Q-32 (`:596`) states: *"**Eleven of thirteen** were accurate as cited … the two that were not are Q-30 and **Q-31**."* And the pass-8 row (`:608`) states: *"thirteen cross-document citations … of which **two were wrong** — §2's row count and §8's D-B premise."* Q-31's subject is the tier's own fixture assertions in `tests/structural/check-structure.mjs`, which is not a citation of either upstream document and therefore cannot be one of the thirteen. §14 reports eleven-of-thirteen where §11 reports twelve-of-thirteen, and reaches that number by counting a claim about a third document among the thirteen.

**How this claim was verified.** Read of `docs/plans/plan-impl-remediation-r1.md` at `:599`, `:601–609`, `:611`, `:596`, `:500` and `:510` at drafting time, all six quoted above verbatim. The pass enumeration was derived by counting the table's own rows, and the accuracy arithmetic by reading claims 28 and 29's own closing sentences.

**Which standard it violates.** The pinned contract's §14 requirement that the reconciliation sweep be **attested** — an attestation is a claim the reader is invited to rely on, and one contradicted by the table beneath it is not an attestation. And the contract's "Sections that restate the step set — known drift sites" rule, which names §14 explicitly: *"Editing a step re-derives every restating section from the current step set. It never patches them at the lines a review named."* §14 was re-derived this round, and the re-derived summary sentence and Q-32 both restate counts that §14's own table and §11's own entries contradict. The contract's warning that *"a plan that reports zero drift findings across several rounds has more likely gone unchecked than gone clean"* is the general form of what happened here.

**Why it matters, and why Moderate.** No implementer is misled about the work — S1–S9 are untouched by this, and the pass narrative and the citation registry are each individually coherent. What is damaged is the one thing §14's attestation is for, for the second consecutive round: three rounds of review have turned on whether this plan's self-verification bookkeeping can be trusted at face value, and the sentences whose function is to certify that bookkeeping are wrong in both places a reader would check. Moderate for the same reason F-G and F-J were: the contract names this class explicitly, and a false count inside a certification is the shape that is eventually wrong about something load-bearing. Not Minor — these are not typos in prose but arithmetic in a certification, and instance (b) invites a reader to believe two citations were corrected when the registry records one.

**What correct implementation looks like.** State each count exactly once, in the section that owns the underlying facts, and have every other mention cross-reference rather than restate — the same mechanism §5's Documentation paragraph now uses for claim 12, which is the one restating surface in this plan that has survived two rounds without drifting. Concretely: delete the "four of which / three of which" breakdown, since the table already carries per-pass outcomes and the breakdown adds nothing a reader cannot read off it; and have Q-32 cross-reference claims 28 and 29 instead of restating their totals. Both instances exist because a count was written twice; the fix is to write it once.

---

## Tentative Findings

No tentative findings — every candidate finding's premise was verified per Compliance Gate B. Every Node, parser, and regex premise was re-executed in this session's scratchpad rather than imported from the plan or from any prior review; every literal-content premise was Read at the cited line at drafting time; every count was re-derived by running the search that produced it. F-L's provenance, which round 3 had to record with ambiguity, is settled here from source: §14's structure changed this round in a way I can read directly (one table with a scope column, where round 3 quoted two paragraphs), so the re-derivation is established without needing a diff of an untracked file.

---

## Observations

- **The doc-sweep totals drifted exactly as the plan predicted, and the stable number held.** Re-executing the plan's verbatim grep over the plugin returned **23** files, **18** under `docs/plans/` or `docs/reviews/`, and — with the plan's exclusion rule applied — **exactly 5** live documents (`README.md`, `docs/HANDOFF.md`, `docs/behavioral-tier-findings.md`, `docs/review-round-1.md`, `tests/ACCEPTANCE.md`). The plan states 22/17/5 as of 2026-08-09; round 3 measured 22/17/5 and predicted 23/18/5 for this round; both totals moved by one and the live count held. Claim 12 designates the rule rather than the totals as the reproducible evidence and dates its execution, so this is not drift in the finding sense — it is the mechanism working. Recorded because a reader comparing the plan's 22 against a fresh 23 would otherwise read it as a stale count. This review record makes it 24/19/5 for round 5.
- **§8's D-B withdrawal is the right disposition even though its evidence is unregistered.** The withdrawal's premise — that the tier already carries fixture-targeting assertions — is true, and retaining the section as the auditable record that the divergence question was asked and answered is better practice than deleting it. The registration gap is F-K's; the engineering judgment is sound and carries no standard violation.
- **S3's insertion anchor remains coarser than S2's, still with no consequence.** S2 says "immediately after S1's T-A2a assertion"; S3 says "after the T-A2a block", which as commented extends to `:224`. Both `:213` and `:225` work identically — `wfSrc` is declared at `:95`, above both, re-verified by grep this round. Carried forward from round 3 unchanged; no standard is violated.

---

## What's Actually Good

**The engineering spine survived a fourth independent execution unchanged, including the parts not yet written to disk.** *Property:* every executable claim the plan makes was re-derived from scratch this session in a fresh scratchpad, without consulting any prior review's recorded outputs, and all of it reproduces. The strict oracle rejects the current workflow (`Unexpected identifier 's'`), accepts the F-1-patched copy, rejects the S2 fixture text assembled byte-for-byte from the plan's listing, and accepts a legitimate top-level-`await`-plus-`return` shape: 4/4. The 6×2 strict-mode matrix reproduces exactly — the sloppy wrapper ACCEPTS all six early-error classes and the strict wrapper rejects all six, with V8 diagnostics matching claim 19 verbatim, including the octal-escape case whose bytes I printed before running (`"const s = '\\101'"`). S3's extraction regexes, run verbatim, find `LOCATION` in the current source and produce the effective pattern `^[^s:#]+(?::d+(?:-d+)?|#S+)$` with 3/3 known-good FAIL and 3/3 known-bad reject — S5's predicted mixed signature, to the assertion. Against a copy carrying S7's replacement the same regexes find the new `LOCATION_RE` declaration and the derived pattern scores 6/6. *Standard:* ECMA-262 §11.2.2 (module code is always strict; the six early errors are SyntaxErrors under it) and the regression-detection principle at `testing-standards.md:91` @ `94a640a`. *Verified:* `probe4.mjs`, Node v22.16.0, output recorded in this session. A plan whose falsifiable predictions survive four independent attempts by four reviewers is carrying real information, not assertion.

**S7's guard is a verified no-op on accepted inputs, which is the property §13 claims and the one that makes the step safe.** *Property:* §13 argues the `LOCATION_RE.test` guard cannot change `parseLocation`'s accepted set because `LOCATION_RE`'s language is the union of the two capture regexes' languages. I tested the argument rather than the prose: I Read the live `parseLocation` at `workflows/expert-lifecycle.js:289–297` (its regexes are `/^([^\s:#]+):(\d+)(?:-(\d+))?$/` and `/^([^\s:#]+)#(\S+)$/`, neither flagged `g`), implemented both the current and the guarded forms, and ran 12 probes spanning both grammars and six boundary shapes (`a.md:0`, `#x`, `a.md:`, `a.md#`, `a.md#x#y`, `a b.md:1`). **Divergences: 0 of 12.** *Standard:* Design by Contract — a guard that narrows a function's accepted set silently changes its contract; the plan asserts the guard does not, and the assertion is now executed rather than argued. *Verified:* `probe4.mjs` section D. This is the plan's only change to executable logic and its only silent-failure risk, and the risk is measured rather than reasoned about.

**F-I's named instances were closed against their own source, not against the review's characterization of it.** *Property:* the corrector did not accept round 3's re-derivations; §11 claims 28 and 29 each carry per-region reads with their own grep locators and quoted content, and the one citation that was wrong (§2's "twenty-two rows marked pass") was corrected at source rather than registered as stated. I re-derived all thirteen regions independently — six greps against the behavioural-remediation plan, seven reads against the upstream review, including counting the contract table's rows myself at `:132–152` — and twelve are accurate as the plan states them, with the thirteenth now correct at twenty. *Standard:* the pinned contract's Gate C read-level-evidence item and expert-review's rule that a prior document's claim is a candidate, not a finding. *Verified:* the greps and reads recorded in the inventory. Correcting the artifact rather than registering the error is the harder call and the right one.

---

## Convergence Record

- **Round number:** 4 (third Post-fix round), matching Scope and Inventory.
- **Trajectory (findings by severity, from each round's mechanical verdict breakdown):**
  - R1: **6** — 1 Serious-Systemic, 3 Moderate, 2 Minor.
  - R2: **2** — 2 Moderate (one Systemic).
  - R3: **2** — 2 Moderate (one Systemic).
  - R4: **2** — 2 Moderate (one Systemic).
- **Flow counts for this round** (source: the Step 9 provenance classification on each finding):
  - Prior findings **closed: 0**. Both round-3 findings had their named instances correctly addressed and verified — F-I's thirteen citations are registered and I re-derived all thirteen; F-J's two-paragraph structure is gone and replaced by a single table with a per-pass scope column. Neither finding's condition is closed: F-I's standard (every factual claim has a §11 entry) is violated at sixteen new sites, and F-J's standard (§14's attested count is contradicted by the text it summarizes) holds at two new sites in the re-derived text.
  - **Recurring: 2** — F-K against F-A/F-H/F-I's standard (Gate C claim-to-§11 reconciliation); F-L against F-J's standard (§14 attestation and the restating-sections rule), at the same section.
  - **New: 0.**
  - **Regressions: 0.** F-L's instance (b) is text this round introduced, but the finding as a whole is classified recurring because its standard and location are F-J's; the sensitivity note below shows the tripwire result is unchanged either way.
- **Tripwire evaluation — BOTH CONDITIONS FIRED, with the arithmetic shown:**
  - **Condition (a):** new + regression ≥ closed, **for two consecutive Post-fix rounds**.
    - R3: new (0) + regression (1) = 1; closed = 1. **1 ≥ 1 is TRUE.**
    - R4: new (0) + regression (0) = 0; closed = 0. **0 ≥ 0 is TRUE.**
    - The condition holds in both R3 and R4 — two consecutive Post-fix rounds. **(a) FIRES.**
  - **Condition (b):** the total findings count has not strictly decreased **for two consecutive Post-fix rounds**.
    - R2 = 2 → R3 = 2: did not strictly decrease (one).
    - R3 = 2 → R4 = 2: did not strictly decrease (two consecutive).
    - **(b) FIRES.**
  - **Sensitivity, stated rather than glossed.** Condition (a)'s R4 arithmetic depends on counting closed as 0, which rests on the judgment that a finding whose class recurs is not closed — the same judgment rounds 2 and 3 applied to F-H and F-I. If a reader instead credits F-I's named-instance closure as closed = 1, R4 becomes 0 ≥ 1, false, and **(a) would not fire**. **Condition (b) is unaffected by that judgment entirely**: the total has been 2, 2, 2 across R2, R3 and R4 by every counting, so the tripwire fires on (b) regardless. The recommendation below therefore does not rest on the one classification a reader could reasonably score differently.
  - **What the fired tripwire means here.** Three consecutive rounds have closed every instance a review named and produced the same count of findings in the same two sections, by a different mechanism each time. That is the field-documented signature of a foundational problem being patched: the plan's self-verification apparatus (§11's sweep and §14's attestation) is being repaired instance-by-instance from review output, and each repair is itself an unswept edit that supplies the next round's findings. The engineering, by contrast, has been stable and independently re-verified for three consecutive rounds and is not implicated.

---

## Recommended Priority

**The tripwire has fired on both conditions, so foundational rework is the indicated path — not a fifth fix round.** Per the compliance checklist's Gate 8: re-read the sources, re-derive the approach, and do not carry the failed attempt forward. Concretely, and scoped to what actually fired:

1. **Re-derive §11 and §14 from the plan document, discarding the accumulated correction history in both sections.** The failed approach is incremental repair of the sweep from each review's finding list; four rounds of evidence say it closes the named instances and supplies the next mechanism. The re-derivation is: take the current plan text as the input, enumerate the population by the rule §11's preamble already states correctly — every distinct document the plan names anywhere, every line citation, every count — and build the entry list from that enumeration, not from claims 1–29 plus deltas. §14's register and sweep table are re-derived the same way, with each count stated exactly once at the section that owns the underlying facts and cross-referenced everywhere else. Both sections currently carry substantial round-by-round narration of their own repair history (§11's re-derivation note, §14's nine-pass table and per-round mechanism paragraph); that narration is the accumulated failed attempt, and re-deriving means writing what the current document requires rather than appending to it.

2. **Then re-sweep the re-derived text.** Families 2 and 3 in F-K exist because the correction wrote new claims after the sweep ran. Any re-derivation that does not end with a sweep of its own output reproduces that immediately.

3. **Do not touch S1–S9.** The plan's engineering has been independently verified correct by execution in three consecutive rounds, and this round re-derived it from scratch rather than confirming any prior record: 4/4 oracle properties, 6/6 strict-mode matrix, S3's harness reproducing S5's predicted mixed signature exactly, and S7's guard diverging on 0 of 12 probes. The tripwire fired on the bookkeeping sections alone. A correction that edits a step body is out of scope for what fired and is a signal to stop and ask why.

An owner decision is also available and worth naming, because the fired tripwire is the moment the workflow provides for it: the plan's steps are executable as written and independently verified, while what has not converged is the document's proof-of-its-own-premises apparatus. Whether to spend a foundational re-derivation on §11 and §14, or to record the open findings and proceed to implementation with the bookkeeping gaps accepted, is a workflow-level call. If the latter is chosen, it is an operator-directed cycle stop and requires the Open Findings Ledger in the round that records it; the verdict remains NEEDS FIXES either way.

---

Verdict: NEEDS FIXES (2 findings: 1 Moderate-Systemic, 1 Moderate)
