# Plan review — implementation remediation, round 3 (Post-fix)

**Round:** 3 (Post-fix review of the round-2 corrections)
**Artifact:** `claude-plugins/expert-dev-tools/docs/plans/plan-impl-remediation-r1.md` (working tree, 595 lines; 548 at round 2; 495 at round 1)
**Governing output contract:** `claude-plugins/expert-dev-tools/skills/expert-plan/references/output-contract.md` **at commit `94a640a`** (pinned by the dispatch; the working-tree copy does not govern)
**Prior round records:** `docs/reviews/plan-impl-remediation-r1-round-01.md` (NEEDS FIXES; F-A … F-F), `docs/reviews/plan-impl-remediation-r1-round-02.md` (NEEDS FIXES; F-G, F-H)
**Upstream artifact:** `docs/reviews/implementation-round-01.md` (NEEDS FIXES; F-1 … F-5)
**Reviewer:** independent (expert-review R1.2)
**Date:** 2026-08-09

---

## Scope and Inventory

### Round number

Round 3. Post-fix review; inventory constructed per expert-review Step 2's post-fix source, and the full process runs unchanged over it.

### Tool plan (Step 3)

Instruments available this session: `Bash` (git, grep, sed, node, ls, find), `Read`, `Grep`, `Glob`, `Write`, Clear Thought (`metacognitivemonitoring`, `collaborativereasoning`).

| Claim type | Instrument | Used for |
|---|---|---|
| Literal-content ("line N says Z") | `Read` / `sed -n` at the specific line | claims 1, 8, 10, 24, 25, 26, 27; §14's attestation line; the plan's step bodies |
| Absence / candidate-set enumeration | `grep` over a named scope, query and count recorded | F-I (the §11 registration gap), claim 12's partition, claim 27's single-assignment half |
| Behavioral (parser accepts/rejects X; regex partitions Y) | **executed** — `probe.mjs` written with the `Write` tool, run on Node v22.16.0 | the 6×2 strict-mode matrix, the four property probes, S3's harness on both pre- and post-S7 source, S7's guard-divergence probe |
| Structural / ordering (declaration vs use site) | `grep -n` for the assignment, `sed` for the region | `wfSrc` scope, the linter-block boundary |
| Claims imported from prior documents (rounds 1–2, the plan's own §11) | re-derived from source or re-executed | every disposition below |

No instrument class was unavailable. Context7 was not required: the plan integrates no third-party library API — every external-behaviour claim concerns the Node.js runtime and the ECMAScript grammar, both verified by direct execution, which is a stronger instrument than a docs lookup for these claim types.

**Execution hygiene.** All executions ran in the session scratchpad (`…/scratchpad/probe.mjs`) against copies read from the repository. **No write mode was run against any repository file**; the only repository write is this review record. Round 2's recorded shell-escaping hazard was honoured: the probe was written with the `Write` tool rather than assembled through a heredoc, every apostrophe and backslash was introduced via `String.fromCharCode(39)` / `String.fromCharCode(92)` so no escape layer could consume one, and the octal-escape probe's actual bytes were printed and confirmed before the matrix ran (`"const s = '\101'`, the backslash surviving). The S2 fixture line was likewise assembled at runtime and its bytes printed: `"const claim = 'The authoring skill's process rules are not the standard'"`.

**Not re-executed this session, stated rather than glossed:** `codegraph_find_related_docs`'s 34-document result (claim 12's candidate set) and `codegraph_list_files`'s seven-JavaScript-file result (claim 21). Both are structural traces properly cited; neither is contradicted by anything observed here, and neither carries a finding. Also not separately re-read: `docs/plans/plan-expert-dev-tools-remediation-r{1,2,3}.md` beyond their membership in the sweep result, which `grep` established.

### File inventory

Constructed per Step 2's Post-fix source: the prior review's full inventory, plus the fix-diff (the plan document, which is the entire fix-diff for a plan artifact), plus its dependents, plus the prior review's two findings as closure items.

- [x] `docs/plans/plan-impl-remediation-r1.md` — Read in full (1–370, 371–595). The fix-diff file.
- [x] `docs/reviews/plan-impl-remediation-r1-round-02.md` — Read in full (1–258). Prior findings as closure items.
- [x] `docs/reviews/plan-impl-remediation-r1-round-01.md` — round-1 findings carried via round 2's verified closure table; the two still-open classes (F-A → F-H) re-derived from source here.
- [x] `docs/reviews/implementation-round-01.md` — the upstream contract; its five findings re-checked against the plan's §2 coverage table.
- [x] `skills/expert-plan/references/testing-standards.md` **@ `94a640a`** — `git show` + `sed -n '91p'`; line quoted verbatim below (claim 25 closure).
- [x] `workflows/expert-lifecycle.js` — Read at `:57–59`, `:81`; full copy parsed under the strict oracle and processed by the S3 harness in the scratchpad.
- [x] `tests/structural/check-structure.mjs` — Read at `:205–226` (covering the T-A2a block, the replaced range 210–212, and the linter block through `:224`); `grep -n "wfSrc *="` → **1 hit, `:95`**; `grep -n "wfSrc" | head -5` → `:95, 124, 128, 129, 143`; `sed -n '543p'` for the banner.
- [x] `docs/plans/plan-expert-dev-tools-behavioral-remediation.md` — newly added to the inventory this round (see F-I). `grep` for `1.5M`, `claim 27`, `S6b`, `D-1`/`D-8`, `^### S22`; step headings counted (`grep -cE "^### S[0-9]+[a-z]? "` → **26**); the cited regions Read in place.
- [x] `README.md`, `tests/ACCEPTANCE.md`, `docs/review-round-1.md`, `docs/HANDOFF.md`, `docs/behavioral-tier-findings.md` — the five live sweep documents, identified by re-executing the plan's own grep; their hit sets match the plan's table.
- [x] `docs/plans/` and `docs/reviews/` (17 files) — Grep-verified as a set by re-executing the sweep with the exclusion rule; enumerated in the F-G closure below.
- [x] `tests/fixture/` — the S2 fixture text was executed verbatim through the oracle; `find` confirms no pre-existing `tests/fixture/workflow/` (the plan creates it).

No `[ ]` remain.

### Rigor waivers

None. No compression of this review's process was requested or applied.

---

## Summary

**This review returns NEEDS FIXES.** The plan's engineering is now verified correct by independent execution for the second consecutive round, and round-2's F-G closed cleanly — I re-ran the plan's own doc-sweep grep and claim 12's partition (22 total, 17 dated records, 5 live) reproduces exactly, with the exclusion rule doing precisely the drift-proofing work the plan claims for it. Round-2's F-H closed at all three of its named instances. But the F-H **class** did not close, for the third consecutive round and by a newly identifiable mechanism: the corrective sweep (pass 6) was executed over §7 only, while §11's own population definition says "any sentence **anywhere in this document**." Outside §7 sit seven unregistered factual claims about the content of `docs/plans/plan-expert-dev-tools-behavioral-remediation.md` — a token cost, a step count, a quoted rule, and four named sections — none of which has a numbered §11 entry, exactly the shape round 2 found for `testing-standards.md`. Separately, §14's sweep attestation now reads "**Four passes**" while the same section narrates seven. Both findings are Moderate and both sit in the plan's bookkeeping rather than its engineering; nothing in S1–S9 requires change. The convergence signal has changed character this round and the Convergence Record says so plainly: the tripwire has not fired, but the total findings count failed to strictly decrease for the first time, which places both tripwire conditions one round from firing.

---

## Upstream Contract Verification

Two upstream contracts govern: the pinned output contract (structure and gates), and for this Post-fix round the two findings of round 2 (closure). The five findings of `implementation-round-01.md` remain the coverage reference and were re-checked.

### Round-2 findings — closure status, re-derived from source

Each closure is checked against the standard the original finding named, not an adjacent one.

| Prior finding | Originally named standard | Status | Verification method |
|---|---|---|---|
| **F-G** (Moderate, new) — §5 and §11 claim 12 state four counts that re-executing the plan's own grep contradicts, and disagree with each other | Pinned contract Gate C ("Every entry in §11 carries read-level evidence … **with specifics**") and the "Sections that restate the step set — known drift sites" rule | **closed** | Re-executed the plan's verbatim grep over `claude-plugins/expert-dev-tools/`: **22** files. `grep -rln <same pattern> --include=*.md ./docs/plans ./docs/reviews` → **17**. Excluding those two directories → **exactly 5**: `README.md`, `docs/HANDOFF.md`, `docs/behavioral-tier-findings.md`, `docs/review-round-1.md`, `tests/ACCEPTANCE.md` — matching claim 12's enumeration file for file. §5's Documentation paragraph now states no counts at all and cross-references claim 12, so the two sections can no longer disagree. The plan additionally identifies *which* of its numbers drift and why (one dated record added per round) and designates the exclusion **rule** rather than the totals as the reproducible form — a stronger fix than the re-derivation the finding asked for. Arithmetic re-checked: of the 22 hits, 18 fall inside the 34-document candidate set and 4 outside it (`docs/HANDOFF.md`, the plan itself, and its two review records); 34 − 18 = **16** candidates producing no hit, matching claim 12's enumerated 16. |
| **F-H** (Moderate, Systemic, recurring) — three Plan-section factual assertions carry no §11 entry | Pinned contract Gate C ("Every factual claim asserted in any plan step has a corresponding entry in Output section 11") | **named instances closed; class NOT closed — see F-I** | Instance 1: §11 **claim 25** now registers `testing-standards.md:91` @ `94a640a` with the line quoted; I re-derived it — `git show 94a640a:…/testing-standards.md \| sed -n '91p'` returns *"- **Regression tests** — every fixed bug gets a test that reproduces it first (fails on the broken code), then passes on the fix. A regression test that never failed has not demonstrated it can."* The plan's quotation is character-exact and its paraphrase faithful. Instance 2: S1's range is deleted, not corrected — the text now reads "the workflow-creator linter block below it … are untouched — stated without a line range deliberately", and **claim 26** independently registers the true boundary; `sed -n '205,226p'` confirms `:213–214` comments, `:215` `const linter`, `:216` `if (!existsSync(linter)) {`, **`:223` the closing brace**, `:224` the `meta`-first assertion. Instance 3: S3 now reads "`wfSrc` is **declared at** `tests/structural/check-structure.mjs:95`", registered as **claim 27**; `grep -n "wfSrc *="` returns exactly one hit at `:95`, and `head -5` confirms it is the first occurrence and only assignment. All three named instances are correct. The class recurs at seven new locations — F-I. |

### Upstream findings coverage (`implementation-round-01.md`) — re-checked

| Finding | Plan's disposition | Status | Verification method |
|---|---|---|---|
| F-1 (Critical) unescaped apostrophe | S6 | **covered** | `sed -n '57,59p' workflows/expert-lifecycle.js` — the defect is present verbatim at `:58`. Executed: applying S6's delimiter change to a scratch copy flips the strict oracle from `Unexpected identifier 's'` to accept. |
| F-2 (Critical) syntax gate incapable of failing | S1 + S2 | **covered** | The 6×2 matrix and four property probes, executed (below). `sed -n '205,226p'` confirms the live gate is still `execFileSync(… '--check' …)` at `:211`. |
| F-3 (Serious) `LOCATION.pattern` escapes consumed | S7 + S3 | **covered** | `sed -n '81p'` — `pattern: '^[^\s:#]+(?::\d+(?:-\d+)?|#\S+)$'` present. Executed S3's harness against current source: effective regex source `^[^s:#]+(?::d+(?:-d+)?|#S+)$`, 3/3 known-good FAIL. Against a copy carrying S7's replacement: source `^[^\s:#]+(?::\d+(?:-\d+)?|#\S+)$`, 3/3 good match, 3/3 bad reject. |
| F-4 (Serious, Systemic) tier validates only as text | S1 (a), S3 (b), S4 (c) | **covered** | Read of S1/S3/S4 against the review's three enumerated instances; S3 closes the class by discovery plus an exemplars-must-exist assertion rather than by naming `LOCATION`. Executed: the extraction regexes find the declaration S7 writes (`reDecls` → 1 line, `schemaNames` → `['LOCATION']`). |
| F-5 (Minor) `EVIDENCE` comment overstates | S8 | **covered** | Claim 14's premises re-derived at round 2 and unchanged by this round's corrections; S8's replacement text is accurate against the `required` array. |

### Pinned output contract — Gate C items

| Contract item | Status | Verification method |
|---|---|---|
| Sixteen sections present; "if applicable" sections with content present | pass | Read of §1–§16 against the contract's enumeration; §4 present and marked not applicable with its reason. |
| Every step has a **Source** annotation | pass | Read of S1–S9; all nine carry one. |
| Every non-trivial step has all four Gate 3 parts | pass | Read of S1, S2, S3, S4, S5, S7; S6, S8, S9 declared trivial with a stated reason, which the contract permits. |
| No step presents alternatives, defers a choice, or contains an unanswered question | pass | Read of all nine steps; zero option sets. |
| §14 register: every entry binned, sourced, dispositioned | pass | Read of §14 — 29 entries (Q-1 … Q-29), all dispositioned. |
| **§14 sweep count attested** | **fail** | F-J — "Four passes" attested against seven narrated. |
| Every bin-2 entry shows the user's answer | pass (vacuous) | Read: no entry is binned 2; Q-15, Q-16, Q-21 are bin 3 and close into §15 as G-1, G-2, G-3. |
| §15 Gaps entries carry resolution-attempt evidence | pass | Read of G-1, G-2, G-3; all three carry what was read and executed and why resolution is out of reach. |
| §2 coverage reconciliation maps every requested element | pass | Read of the §2 table against the five upstream findings; 1:1, plus the ordering constraint and the both-tiers-green element. |
| §12 test specifications carry all five fields | pass | Read of T-A2a, T-A2a-neg, T-A2d, T-A2e; each has behavior / level / real-double boundary / data / must-not-assert-and-fails-when. |
| §16 exported-surface check present | pass | Read of §16 item 2; `codegraph_diff_surface` specified, the three new `_RE` consts identified as module-local. |
| Citation identity — out-of-artifact citations carry immutable identifiers | pass | Read of §11's Citation identity paragraph: contract and `testing-standards.md` pinned to `94a640a`, `skills/workflow-creator/SKILL.md` to `4caccdb`, working-tree files cited by path and date with unpinnable status stated. |
| **Every factual claim asserted in any plan step has a corresponding §11 entry** | **fail** | F-I. |
| Every §11 entry carries read-level evidence, with specifics | pass | F-G's counts now reproduce; claims 25–27 verified above; claim 12's partition re-executed. |
| The restating sections (2, 3, 5, 11, 12, 14) were re-derived, not patched | **fail** | F-J — §14 carries a pass count its own narrative contradicts, which is a restating section left un-re-derived after content was appended to it. |

---

## Critical & Serious Findings

No Critical or Serious findings — the full inventory was Read or Grep-verified per Compliance Gate B, and no violations of Critical or Serious classification were observed. Every executable construct the plan specifies was executed this session and behaves exactly as the plan states, including the three constructs the plan has not yet written into the repository (the strict oracle, S3's extraction-and-evaluation harness, and S7's `LOCATION_RE` guard).

---

## Systemic Patterns

### F-I (Moderate, Systemic, recurring) — the §11 registration class recurs at seven locations outside §7, because the corrective sweep was scoped to §7 while §11's own population definition says "anywhere in this document"

**Provenance.** **Recurring** against round-1 **F-A** and round-2 **F-H**, whose named standard is the pinned contract's Gate C item: *"Every factual claim asserted in any plan step has a corresponding entry in Output section 11. The two are reconciled — claims without entries are non-compliance."* All five previously named instances are closed (verified in the table above). This is the third consecutive round in which the class itself survives.

**What the plan does now.** §11's preamble states the population mechanically, and states it correctly and broadly:

> **Any sentence anywhere in this document that states what a file contains, where something is located, what is in scope, or how many of something there are — is a claim and needs an entry.**

§14's pass-6 paragraph then describes how that definition was executed: *"executed as a marker scan over the step bodies rather than by reading for claims — `grep` for `already`, `untouched`, `in scope`, `unchanged`, **plus every line-number, range, and count citation inside §7**."* The definition says "anywhere in this document"; the scan covered §7. Everything outside §7 was swept only for the four reassurance markers, not for content citations — and the seven surviving claims are all content citations about another document, carrying no marker word.

**The seven unregistered claims, enumerated.** All concern the content of `docs/plans/plan-expert-dev-tools-behavioral-remediation.md`, and all fall outside §7's step bodies or inside step prose that carries no marker word:

| # | The claim | Where it is asserted (plan line) |
|---|---|---|
| 1 | The upstream plan's §16 prices the behavioural re-run at **~1.5M subagent tokens** — a count | §2 (`:23`), repeated in §16 item 5 (`:594`) |
| 2 | This plan "does not re-plan the **26-step** behavioral remediation" — a count | §2 (`:19`) |
| 3 | The upstream plan's §3 **claim 27** says *"scripts that generate a derived surface are the fix"* — a quotation | §3's standards table (`:51`), S7 Source (`:327`), S7 part 2 (`:331`) |
| 4 | The upstream plan's **D-1** "identifies as dominant" the named-instances-close-class-resurfaces shape | S3 part 4 (`:210`) |
| 5 | The upstream plan's **D-8** names hand-maintained duplicate surfaces as its own residual risk | S7 part 4 (`:333`) |
| 6 | The upstream plan's **S6b** exists to prevent the inert-detector class, and its **§7 S6b part 5** mandates the location grammar | S7 Impact (`:339`), §12 T-A2d data (`:517`), §13 (`:531`) |
| 7 | The upstream plan's **S22** forbids weakening the ruler | S7 part 4 (`:333`) |

**How this claim was verified. Proactive scan across the full inventory scope, query and result count recorded, instances enumerated.**

- **The registration gap.** `sed -n '423,495p' docs/plans/plan-impl-remediation-r1.md | grep -n "behavioral-remediation"` → **exactly 1 hit**, and it is inside the **Citation identity** paragraph, never a numbered entry. I read §11's entries 1–27 in full: none cites the upstream behavioural-remediation plan. This is the identical shape round 2 found for `testing-standards.md` — pinned in Citation identity, absent from the numbered list — and round 2's own finding text names why that does not suffice: *"pinning an identifier is not the entry."*
- **The assertion sites.** `grep -n "behavioral-remediation\|upstream plan" docs/plans/plan-impl-remediation-r1.md` → hits at `:23, 51, 80, 210, 327, 331, 333, 339, 492, 517, 531, 594` (`:80` is §5's file-group table, `:492` the Citation identity paragraph; the remaining ten are the assertion sites tabulated above).
- **The cited contents, re-derived from the upstream file** (so the severity rests on evidence, not assumption): `grep -n "1\.5M\|1\.5 M"` → hits at `:45`, `:2799`, `:3067`, e.g. *"it costs ~1.5 M subagent tokens"* — **accurate**. `grep -cE "^### S[0-9]+[a-z]? "` → **26**, and the enumeration is S1 … S23 plus S2b, S6b, S15b — **accurate**. `grep -n "claim 27"` → `:89`, *"(claim 27, `cd2f27b`: \"Scripts that *generate* a derived surface are the fix; scripts that *audit* prose are the problem\")"* — **accurate quotation**. `grep -n "^\*\*D-1\|^\*\*D-8"` → `:1677` and `:1761`, the latter *"This plan carries the defect class that fired the APS Fusion tripwire, and cannot eliminate…"* — **accurate**. `grep -n "S6b"` → `:53, 55, 67, 88, 90`, with `:67` mapping *"`findings[].location` required with a grammar (review r3 S-6)"* to **S6b part 5** — **accurate**. `grep -n "^### S22" -A 12` → *"Resolve B3 and B4 in the strengthening direction … Two edits, both of which strengthen verification"* — the plan's characterization is **accurate**.
- **Confirming the class is confined to this family.** I re-ran the plan's own marker scan across §§1–10 and §§12–16 (`grep` for `already|untouched|in scope|unchanged|still|remains|survive`): every marker hit resolves to an existing entry — `:202` → claim 13, S8's Verification → claim 14, §13's greeter.js → claim 21, S4's `declOf` → claim 26, T-A2e's `wfSrc` → claim 27, S1's boundary-free statement asserts nothing. And every count-bearing assertion *inside* §7 reproduces: the 210–212 range (claim 11), the 433–457 range (claims 11, 26), `:81` (claim 8), `:290–296` (claim 10), `:57–59` (claim 1), `:89` (claim 14), the banner (claim 24). **The class is confined to cross-document content citations outside §7 — which is exactly the region pass 6 did not scan for content citations.**

**Which standard it violates.** The pinned contract, Gate C, as quoted above; and §11's own population definition, which the plan wrote this round and which these seven claims fall inside ("what a file contains … how many of something there are"), and which §11's preamble reinforces by naming "the content of a document cited as a standard, as distinct from the standard's registration in §3" — instance 3 is precisely that case, cited in §3's standards table and relied on in S7.

**Why this is Systemic rather than seven isolated slips.** All seven share one mechanism, and it is a different mechanism from the one round 2 named. Round 2's diagnosis was that the sweep's *population* was defined by judgment; the corrector fixed that correctly by writing a mechanical definition. What the corrector then did was execute that definition at a *scope* narrower than the definition states — §7's step bodies, when the definition says "anywhere in this document." The four marker words were swept document-wide; content citations were swept only inside §7. Every surviving claim is a content citation outside §7. This is the third distinct mechanism by which this class has survived (round 1: wrong sweep direction; round 2: population by judgment; round 3: correct population, under-scoped execution), and that progression is itself the systemic signal — each round fixes the mechanism the last review named and introduces the next one, which is the "named instances close, the class resurfaces" shape the plan itself quotes at S3 part 4.

**Why it matters, and why Moderate rather than Serious.** I verified all seven cited contents against the upstream file and every one is accurate, so nothing downstream breaks today and no implementer is misled. What fails is the property §11 exists to provide — the contract designates it "the premise-correctness proof of the output contract," and a reader cannot distinguish a verified citation from a remembered one when the citation has no entry. The plan's own most-cited external standard was on the unverified side of that line one round ago; seven more claims about a second external document are there now. Round 1 classified this class Serious when its instance was an *unverified* premise about an external component; here, as at round 2, every instance is accurate, which is the honest reason for Moderate.

**What correct implementation looks like.** Not seven entries appended to §11 — that patches the instances and leaves the mechanism, which is what the last two rounds already demonstrated. Two changes, in this order:

1. **Re-execute the sweep at the scope §11's definition states.** Run the content-citation half of the scan over §§1–6 and §§8–16 as well as §7 — every `§`-reference, every quoted phrase attributed to another document, every count, every named section of another artifact — and register what it returns. §14's pass attestation then records the scope swept, not just the pass number, so a future reader can see whether the definition and the execution agree.
2. **Add cross-document content citations to the marker list explicitly.** The current marker set (`already`, `untouched`, `in scope`, `unchanged`, `still`, `remains`) catches reassurance phrasing but is blind to `the upstream plan's D-8 names …`, which asserts a fact about another file while reading as attribution. A marker rule of the form "any clause naming a section, decision, claim, or step of a document other than this one is an assertion about that document's content until it has an entry" would have caught all seven.

Then add the entries the corrected sweep returns — grouping the seven above into one entry per cited document region is acceptable and probably preferable to seven, provided each carries its own read evidence.

---

## Moderate & Minor Findings

### F-J (Moderate, regression) — §14's reconciliation sweep attests "Four passes" while the same section narrates seven

**What the plan does now.** §14's attestation paragraph (`:573`) opens:

> **Reconciliation sweep.** **Four passes.** Passes 1–3 were performed for round 1 … Pass 4 was therefore run as the reverse cross-walk … **A fifth confirming pass** over the amended document added zero entries.

The very next paragraph (`:575`) is headed **"Pass 6, and why the fifth pass's zero was not evidence"** and closes: *"**A seventh confirming pass**, run against the same mechanical definition over the amended document, added zero."*

So the bold attested count is **four**; the paragraph it introduces describes **five**; the section as a whole describes **seven**. The attestation contradicts its own sentence, and then contradicts the paragraph beneath it.

**How this claim was verified.** Read of `docs/plans/plan-impl-remediation-r1.md:573` and `:575` at drafting time, via `grep -n "Reconciliation sweep" -A2`, with both lines quoted above verbatim. The count of narrated passes was derived by enumerating the ordinals the section itself uses: "Passes 1–3", "Pass 4", "A fifth confirming pass", "Pass 6", "A seventh confirming pass" → seven.

**Provenance — stated with its ambiguity rather than asserted.** I classify this **regression**: the pass-6/7 paragraph is unambiguously new this round (it opens "Round 2 of review found three further unregistered assertions"), and appending it without updating the count is what makes the attestation wrong. The caveat is that I cannot diff the prior text — `git log` on the file returns nothing and `find` locates no pre-correction copy, because the artifact is untracked in the working tree. Round 2's Gate C table recorded "five passes attested with the fifth adding zero", which suggests the prior text read "Five" and the corrector edited it *down* to "Four" while adding two more passes; but that is round 2's reading of a document I cannot now inspect, and a prior-document claim is not verification. What is verified from current source is the contradiction itself. If a reader prefers "new" over "regression", the finding count and the verdict are unchanged; only the flow arithmetic in the Convergence Record shifts, and I note that there.

**Which standard it violates.** The pinned contract's §14 requirement that the reconciliation sweep's count be **attested** — an attestation is a claim the reader is invited to rely on, and one contradicted by the text it introduces is not an attestation but a leftover. And the contract's "Sections that restate the step set — known drift sites" rule, which names §14 among them: *"Editing a step re-derives every restating section from the current step set. It never patches them at the lines a review named."* Content was appended to §14 and the section's own summary line was not re-derived — the drift this rule exists to catch, in the section whose job is to attest that no drift remains.

**Why it matters, and why Moderate.** No implementer is misled about the work: S1–S9 are untouched by this, and the pass narrative itself is coherent and informative. What is damaged is the one thing §14's attestation is for. Two rounds of review have now turned on whether the plan's self-verification bookkeeping can be trusted at face value, and the sentence whose entire function is to certify that bookkeeping is wrong by three. It is Moderate for the same reason round 2 classified F-G Moderate: the contract names this class explicitly, and an attestation contradicted by its own section is the shape that is eventually wrong about something load-bearing. It is not Minor because it is not a typo in prose — it is a false count in a certification.

**What correct implementation looks like.** Re-derive the paragraph rather than editing the numeral. State the count once — **seven passes** — and let a single narrative carry passes 1–7 with what each added, instead of an attestation paragraph plus an appendix paragraph that the attestation does not know about. Structurally, the second paragraph exists because a correction was appended rather than integrated; folding it in is what prevents an eighth pass from producing a third paragraph and a count that is wrong by four. While re-deriving, record the **scope** each pass swept alongside its number, per F-I's fix 1 — the two findings share this sentence, and fixing them together is cheaper than fixing them in sequence.

---

## Tentative Findings

No tentative findings — every candidate finding's premise was verified per Compliance Gate B. Every Node, parser, and regex premise was re-executed in this session's scratchpad rather than imported from the plan or from either prior review; every literal-content premise was Read at the cited line at drafting time; every count was re-derived by running the search that produced it. The one genuinely unresolvable question — whether F-J's error was introduced this round or missed last round — is a provenance classification, not a finding premise, and is recorded with its ambiguity inside F-J rather than parked here.

---

## Observations

- **S3's insertion anchor is coarser than S2's, with no consequence.** S2 says "immediately after S1's T-A2a assertion" (≈`:213`); S3 says "after the T-A2a block", and the T-A2a block as commented in the file extends through the linter branch to `:224`. An implementer could reasonably insert S3's loop at either `:213` or `:225`. Both work identically — `wfSrc` is declared at `:95`, above both, verified by grep — and no assertion's meaning changes with the choice. No standard is violated; recorded because a reader comparing the two steps will notice the anchors differ and may wonder whether the ordering is load-bearing. It is not.
- **The plan's F-G fix exceeded what the finding asked for, in a way worth naming.** Round 2 asked for one re-derived partition stated once. The plan delivered that and additionally diagnosed *which* of its own numbers are unstable and why (one dated record added per round), then designated the exclusion **rule** as the reproducible form. My re-execution one round later returned 22/17/5 where round 2 got 21/16/5 — the totals drifted exactly as the plan predicted, and the live count held at 5 exactly as the plan predicted. This is not a finding in either direction; it is recorded because it is direct evidence that the plan's stated reproducibility mechanism works under the one test that matters, elapsed time.
- **This review record will itself shift the sweep totals to 23/18/5** when the next round re-runs the grep. Claim 12's rule handles this correctly and needs no amendment; noted so the next reviewer does not read the change as drift.

---

## What's Actually Good

**The engineering spine survived a third independent execution unchanged, including the parts not yet written to disk.** *Property:* every executable claim the plan makes was re-derived from scratch this session, in a fresh scratchpad, without consulting either prior review's recorded outputs — and all of it reproduces. The strict oracle rejects the current workflow (`Unexpected identifier 's'`), accepts the F-1-patched copy, rejects the S2 fixture text, and accepts a legitimate top-level-`await`-plus-`return` shape: 4/4. The 6×2 strict-mode matrix reproduces exactly — the sloppy wrapper ACCEPTS all six early-error classes (octal literal, `with`, duplicate parameter names, `delete` of an unqualified identifier, assignment to `eval`, octal escape) and the strict wrapper rejects all six. S3's extraction regexes, run verbatim, find `LOCATION` in the current source and produce the effective pattern `^[^s:#]+(?::d+(?:-d+)?|#S+)$` with 3/3 known-good FAIL and 3/3 known-bad ok — S3's predicted mixed signature, to the assertion. Run against a copy carrying S7's replacement, the same regexes find the new `LOCATION_RE` declaration and the derived pattern scores 6/6. S7's guard diverges from the current `parseLocation` on **0 of 12** probes. *Standard:* ECMA-262 §11.2.2 (module code is always strict; the six early errors are SyntaxErrors under it) and the regression-detection principle at `testing-standards.md:91` @ `94a640a`. *Verified:* `probe.mjs`, Node v22.16.0, output recorded in this session. A plan whose falsifiable predictions survive three independent attempts by three reviewers is carrying real information, not assertion.

**S5's expected failure set is now confirmed at the assertion level, not just the count.** *Property:* S5 predicts five failures, names which five, names which assertions must stay green, and states the literal banner text. I derived three of the five directly (the T-A2d known-good trio) from executing S3's harness against the unfixed source, and the other two (T-A2a, T-A2e) follow from the strict oracle rejecting that same source — both executed. `sed -n '543p'` confirms the banner is `` `\nSTRUCTURAL TESTS FAILED (${failures})` ``, making `STRUCTURAL TESTS FAILED (5)` the literal expected form. *Standard:* the regression-detection principle; ISO/IEC/IEEE 29119-4 partition discipline for the mixed pre-fix signature. *Verified:* as above. A pre-fix expectation this specific converts S5 from a checkpoint into a genuine falsification gate.

**The F-G correction chose the durable form over the form the review asked for.** *Property:* the finding asked the corrector to re-derive four numbers and state them once. The corrector did that and then went further — identified that two of the three numbers drift by construction, said so in the document, and made the *exclusion rule* the reproducible evidence rather than the totals, with Q-28 recording the reasoning. *Standard:* the pinned contract's Gate C ("read-level evidence, with specifics") read together with the derived-surface doctrine — evidence a later reader cannot reproduce is not evidence, and a number that changes weekly cannot be reproduced. *Verified:* re-executing the sweep one round later returned 22/17 against round 2's 21/16, while the live count held at 5 — the drift the plan predicted, in the direction it predicted, with the number it designated as stable holding. Recognising that the requested fix would itself go stale, and fixing the class instead, is the harder call and the right one.

---

## Convergence Record

- **Round number:** 3 (second Post-fix round), matching Scope and Inventory.
- **Trajectory (findings by severity, from each round's mechanical verdict breakdown):**
  - R1: **6** — 1 Serious-Systemic, 3 Moderate, 2 Minor.
  - R2: **2** — 2 Moderate (one Systemic).
  - R3: **2** — 2 Moderate (one Systemic).
- **Flow counts for this round** (source: the Step 9 provenance classification on each finding):
  - Prior findings **closed: 1** — F-G, verified above against the standard its original finding named (Gate C read-level-evidence-with-specifics, plus the restating-sections rule), by re-executing the plan's own grep.
  - **Recurring: 1** — F-I, against round-1 F-A's and round-2 F-H's standard (Gate C claim-to-§11 reconciliation), at seven new locations. F-H's three named instances closed; its class did not, for the third consecutive round.
  - **New: 0.**
  - **Regressions: 1** — F-J, introduced by appending the pass-6/7 paragraph without re-deriving §14's attested count. Provenance ambiguity recorded inside the finding; see the sensitivity note below.
- **Tripwire evaluation — NOT FIRED, with the arithmetic shown:**
  - **Condition (a):** new + regression ≥ closed, **for two consecutive Post-fix rounds**.
    - R2: new (1) + regression (0) = 1; closed = 5. **1 ≥ 5 is false.**
    - R3: new (0) + regression (1) = 1; closed = 1. **1 ≥ 1 is TRUE.**
    - The condition holds this round but not last round, so it has not held for two consecutive rounds. **(a) does not fire.**
  - **Condition (b):** the total findings count has not strictly decreased **for two consecutive Post-fix rounds**.
    - R1 = 6 → R2 = 2: strictly decreased.
    - R2 = 2 → R3 = 2: **did NOT strictly decrease.**
    - One round of non-decrease, not two. **(b) does not fire.**
  - **Neither condition fires, and both are now one round away from firing.** This is a materially different signal from round 2's, and it must not be read as "converging fine." Round 2 could report five closures against one new finding; this round closed one and produced one recurrence plus one regression, and the total held flat for the first time. If round 4 returns two or more findings, condition (b) fires automatically. If round 4's new-plus-regression count again meets or exceeds its closed count, condition (a) fires as well. The fix cycle is no longer converging on the bookkeeping sections even though it converged, and stayed converged, on the engineering.
  - **Sensitivity to F-J's provenance.** Were F-J classified new rather than regression, condition (a)'s R3 arithmetic is unchanged (new 1 + regression 0 = 1 ≥ closed 1 still holds) and condition (b) is untouched. The tripwire evaluation is therefore robust to the one classification I could not settle from source.

---

## Recommended Priority

The tripwire has not fired, so a further targeted fix round — not foundational rework — remains the indicated path. It is the last round for which that is true on the current trajectory, and the fix should be sized accordingly.

1. **F-I first, and as the scope fix rather than seven entries.** It is the only finding touching the mechanism by which the plan proves its own premises, and it is the third round in which that mechanism has let assertions through. The instruction that matters is not "register the seven claims" — that is what produces a fourth round of this class — it is: re-execute the content-citation half of the sweep across §§1–6 and §§8–16, not §7 alone, and extend the marker rule to clauses naming another document's sections, decisions, claims, or steps. Register whatever that returns, grouped by cited document region. Two prior rounds have shown that fixing the mechanism the review names, at the instances the review names, leaves the next mechanism intact; the check on whether this round broke that pattern is whether the corrected sweep finds anything the review did not name. **A sweep that returns exactly the seven claims listed in F-I has been run at the wrong scope again** — the review named those seven by scanning, not by exhausting, and it did not scan §§8–10 or §15 for cross-document citations at all.
2. **F-J, folded into the same edit.** Re-derive §14's attestation paragraph as one narrative covering passes 1–7 with a single stated count, and record the scope each pass swept alongside its number. Do not edit "Four" to "Seven" in place — the two-paragraph structure is what caused the miscount, and patching the numeral leaves the structure that will cause the next one.

Both fixes land in §11 and §14. No step changes, so §§2, 3, 5, 12 need no re-derivation beyond the entries the corrected sweep adds.

**Nothing in S1–S9 requires change.** The plan's engineering has now been independently verified correct by execution in two consecutive rounds, and this round re-derived it from scratch rather than confirming round 2's record. If the next round's corrections touch a step body, that is a signal to stop and ask why.

---

Verdict: NEEDS FIXES (2 findings: 1 Moderate-Systemic, 1 Moderate)
