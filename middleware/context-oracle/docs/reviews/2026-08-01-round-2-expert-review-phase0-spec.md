# Expert Review — Phase 0 spec (`docs/specs/spec-context-oracle-phase0.md`)

**Date**: 2026-08-01 · **Round**: 2 (Post-fix review)
**Artifact pinned at commit**: `332406c` (`context-oracle: fix 14 verified defects in the
Phase 0 spec before review`), 535 lines.
**Prior review of record**: `docs/reviews/2026-08-01-expert-review-phase0-spec.md`,
pinned at `3edc61f`, verdict NEEDS FIXES (20 findings).
**Reviewer**: independent; did not author the document or the fixes.

> **On the fix-diff range.** The dispatch names `5f939d4..332406c`. The prior review of
> record is pinned at `3edc61f`, which *precedes* `5f939d4` by two commits (`6634587`,
> `5f939d4` — collapse-hunt fixes). The fix-diff relative to the review of record is
> therefore `3edc61f..332406c` (771 changed lines in the spec), and that is the range used
> to construct this inventory. The discrepancy changed no finding: every closure below is
> re-derived from current source per Step 6, not read off any diff.
>
> **The artifact was rebuilt, not patched.** Commit `91698c7` ("rebuild the Phase 0 spec
> rather than patch it a seventeenth time") replaced 389 of the document's lines. This is
> still run as a Post-fix review per the dispatch: the rebuilt document occupies the same
> path, governs the same subject, and every prior finding is re-derived against it as a
> closure item. See Observation 2 for the tension with the reviews README's
> round-numbering convention.

---

## Scope and Inventory

### Round number

Round 2. The first expert-review of this artifact was round 1; this is the first Post-fix
review, so the round counter increments to 2.

### Inventory (Step 2 — Post-fix rule: the prior review's full inventory, plus every file
in the fix-diff, plus the fix-diff files' dependents, plus the prior review's findings as
closure items)

**Source 1 — the prior review's full inventory.**

- [x] `middleware/context-oracle/docs/specs/spec-context-oracle-phase0.md` — **Read in
  full** at `332406c` (535 lines, all lines), plus targeted re-Reads at the drafting of
  each finding (`9–14`, `55`, `64`, `69–74`, `109–116`, `120–137`, `156–165`, `191–205`,
  `212–260`, `264–276`, `309–329`, `354–369`, `396–438`, `444–535`).
- [x] `middleware/context-oracle/RETHINK.md` — **Read in full** (399 lines), plus
  per-citation re-Reads at `15–24`, `59–61`, `77–78`, `130–134`, `138`, `163`, `169–171`,
  `175–181`, `187–199`, `291`, `303–399`.
- [x] `middleware/context-oracle/docs/specs/spec-context-oracle.md` (v1, 1,099 lines) —
  **Read** at `104`, `127–158`, `179–191`, `229–248`, `313–319`, `400–434`, `497–516`,
  `572–576`, `624–653`, `663`, `808–815`, `886–930`, `931–1012`, `1047–1075`; and
  **Grep-verified** by deterministic scan (see the identifier scans below).
- [x] `middleware/context-oracle/CLAUDE.md` — full contents in session context (325
  lines); **Grep-verified** for `phase0|Phase 0` → 4 hits, all at `231–238` and all naming
  `docs/architecture-context-oracle-phase0.md`, none naming this spec; and for `FR-M3` via
  the prior review's pointer (`CLAUDE.md:19`).
- [x] `middleware/context-oracle/docs/collapse-log.md` (511 lines) — **Read** at
  `435–480` and `494–511`; **Grep-verified** for the standing directives cited below.
- [x] **Claude Code hooks documentation** (`code.claude.com/docs/en/hooks`) — primary
  source downloaded raw as Markdown, **242,078 bytes / 3,173 lines**, 2026-08-01; **Read**
  at `18–60`, `108`, `154`, `335–350`, `695`, `825–862`, `1150–1160`, `1544–1573`,
  `1750–1760`, `2265–2275`, `2690–2695`; **Grep-verified** for `stop_hook_active` (6
  hits), `SubagentStart` (22), `StopFailure` (17), `SessionEnd` (19),
  `doesn't approve the tool call` (**0**), `normal permission flow still applies` (**0**),
  `10 minutes` (**0**), `1.5 second` (1), `continuation` (1).
- [x] **Zimmermann, Weißgerber, Diehl & Zeller, "Mining Version Histories to Guide
  Software Changes," IEEE TSE 31(6), 2005** — PDF fetched from
  `thomas-zimmermann.com/publications/files/zimmermann-tse-2005.pdf` (1,948,399 bytes),
  **17 pages** (confirms the TSE version, not the 10-page ICSE 2004 paper), text-extracted
  via `pdfminer.six` (69,435 chars); masthead confirmed (`IEEE TRANSACTIONS ON SOFTWARE
  ENGINEERING`, `VOL. 31`, `NO. 6`, `JUNE 2005`); all eight quoted fragments
  string-matched after Unicode/whitespace normalisation.

**Source 2 — every file in the fix-diff (`3edc61f..332406c`).**

- [x] `docs/specs/spec-context-oracle-phase0.md` — as above.
- [x] `docs/reviews/2026-08-01-expert-review-phase0-spec.md` — **Read in full** (956
  lines). Added by the diff; it is the prior review of record and the closure baseline.

**Source 3 — the fix-diff files' dependents.** No code exists for this project, so
`codegraph_get_dependents` has no referent. The document-level dependents are every file
that cites this spec's identifiers or is cited by it; each was enumerated by grep and
verified:

- [x] `CLAUDE.md` — grep for the spec path and for `FR-M3` (the prior review's
  mis-resolving pointer). `CLAUDE.md:19`'s `FR-M3` now resolves correctly, because the
  Phase 0 spec no longer defines `FR-M3` (§3 defers it whole to Phase 2, spec:100).
- [x] `docs/collapse-log.md` — grep for `FR-A2` (the prior review's second mis-resolving
  pointer, `collapse-log.md:379`). It now resolves: the spec references `FR-A2` at
  spec:69, 91, 189, 471, 473, 476.
- [x] `docs/specs/spec-context-oracle.md` — grep for `phase0` → **0 hits**; v1 §12's Phase
  0 exit line Read at `908–909`.

**Deliberately out of scope**: `docs/STATUS.md`, `docs/architecture-context-oracle.md`,
`docs/handoffs/*`, `docs/IDEAS.md`, and the other files in `docs/reviews/`. None is named
by the spec or by the dispatch as an upstream contract. The intervening collapse-hunt
reports (`2026-08-01-collapse-hunt-phase0-spec.md` and siblings) were **not** read, so
that no claim of theirs could be imported by reference; this pass derives every finding
from source.

**Source 4 — the prior review's 20 findings as closure items.** Each is re-derived from
current source below; the per-finding closure evidence is in the Convergence Record and in
the findings themselves.

- [x] C1 · [x] C2 · [x] S1 · [x] S2 · [x] S3 · [x] S4 · [x] S5 · [x] S6 · [x] S7
- [x] M1 · [x] M2 · [x] M3 · [x] M4 · [x] M5 · [x] M6 · [x] M7 · [x] M8
- [x] m1 · [x] m2 · [x] m3

### Step 3 — tool plan

| Claim type in this review | Instrument | Available |
|---|---|---|
| Literal-content (spec text, RETHINK/v1 line ranges) | Read at file:line, at drafting time | yes |
| Absence ("no source states X", "no criterion covers Y") | Grep for the signature **plus** Read of the region — the collapse log's standing rule is *search locates, reading verifies* | yes |
| Library-behaviour (Claude Code hooks contract) | Raw primary-source download (242,078 bytes) + Read + Grep; Context7 available as cross-check | yes |
| External-source (ROSE quotations and figures) | PDF fetch + `pdfminer.six` extraction + normalised string match | yes |
| Cross-document identifier consistency and coverage | Deterministic scripts over both specs, counts reported | yes |
| Quotation integrity | Deterministic scan of every quoted span >25 chars against all four sources | yes |
| Structural / blast-radius | CodeGraph | **unavailable** — no load-bearing claim here is structural (the artifact is a document; no code exists), so this is not a halt condition per Step 3 |
| Structured reasoning (`metacognitivemonitoring`, `collaborativereasoning`) | Clear Thought MCP | **unavailable in this session** — tool search returned no matching tools. Both mandatory passes were performed manually with the same framing; recorded as Observation 1 |

**One instrument correction carried forward.** The prior review recorded that a
summarising fetch of the hooks reference returned a false negative on `stop_hook_active`.
This pass did not use a summarising fetch for any hooks claim: the reference was
downloaded raw and grepped/Read directly. That method is what produced this round's
Finding S1 — a quotation the summarising path would have reported as "substantively
correct."

**Rigor waivers**: none. No step was compressed and the dispatch requested none.

---

## Summary

**This review returns NEEDS FIXES.** The fixes are real and the trajectory is good: eleven
of the prior round's twenty findings are closed against their originally named standards,
including both Criticals, and the two axes the prior round rated highest-consequence —
the §11 self-contradiction and the identifier collision's live mis-resolving pointers —
are gone. Requirement-to-criterion coverage rose from 30 of 50 to 43 of 50 with the
security and provenance controls now covered; §14's completion gate is read off
`ctxoracle status` instead of the owner's perception; §3's disposition of all 65 v1
requirements is mechanically complete, exhaustive and non-overlapping; and all eight ROSE
quotations, including the cost figures the prior round found suppressed, verify verbatim
against the correct 17-page TSE paper. What remains is concentrated in one place and one
habit. The document's authority rests on quotation and line citation, and the *hooks*
half of that apparatus was not re-derived: both of the document's hooks-sourced
quotations are inaccurate, and the load-bearing one — the sentence §7 uses to establish
that consequence and warning whispers are expressible at all — does not appear anywhere in
the 242 KB primary source and is instead inherited verbatim from the v1 spec while being
attributed to the documentation. Beneath that, three decision records in §13 assert
novelty or completeness that the v1 spec falsifies: P0-D-6 claims the three-term bar is
this document's composition when v1 §12 already commits Phase 0 to it with named
computable terms, P0-D-4 claims FR-A7 carries a stated value when it does not, and §1's
identifier-namespace declaration is contradicted two sections later by the two `FR-*`
identifiers the document mints. The single unsourced number and the single unsourced
genre-ranking claim from the prior round both survived.

---

## Upstream Contract Verification

A spec's upstream contracts on this project are `RETHINK.md` §12 and its addenda (the
owner's locked decisions, declared "above this document" at spec:16–17), `CLAUDE.md`, the
standing lessons in `docs/collapse-log.md`, and the v1 spec whose requirements §3
dispositions. Each is checked below; verification method recorded per item.

### `RETHINK.md` §12 + addenda — the owner's locked decisions (highest authority)

| Decision | Status | Verification |
|---|---|---|
| 1. Name `ctxoracle` | honored | Read spec:3, 376 |
| 2. Model in the loop | honored (deferred with a stated reason) | Read spec:59; §3 defers FR-J1–FR-J5 whole (spec:96–98) |
| 3. No hard blocks, anywhere | honored | Read spec:135–137 (FR-O4), 270–272 (FR-D3), 463–465 (AC-5); RETHINK:314–323 Read |
| 4. Sandbox compatibility | honored | Read spec:354–360 (C-1) + P0-D-13 (spec:433–438); RETHINK:324–327 Read |
| 6. Two stores, outside the tree | honored | Read spec:174–175 (FR-K8); RETHINK:330–334 Read |
| 7. No separate credentials | honored (vacuously — no model call) | Read spec:280–283, 371–380 |
| 8. Subagent delivery in v1 | honored, correctly pointed | Read spec:65 (§2 row now names FR-O6) vs spec:145–149 (FR-O6) and 419–423 (P0-D-10) — prior M2 closed |
| 10. Self-observability required | honored, and now honored by §14 too | Read spec:333–334 vs spec:444–447 — prior S2 closed |
| 11. Agent-led; owner is a non-programmer | honored | Read spec:42–44, 342–343; RETHINK:355–359 Read |
| 12. Speak at a completion claim, bounded to one | honored and correctly cited | Read spec:138–142 (FR-O4a), 255–260 (P0-3), 476–480 (AC-10); RETHINK:363–379 and 393–399 Read — prior S4 instance 2 closed |

Decisions 5 and 9 are superseded / deferred and correctly so (5 by 8; 9 to Phase 1 via §3,
spec:96).

### `CLAUDE.md` — lifecycle, information policy, engineering standard

| Clause | Status | Verification |
|---|---|---|
| Lifecycle: spec → architecture → plan → build; architecture is per phase | honored — this artifact is at the correct stage, and it cites no architecture decisions (grep `architecture\|\[D-[0-9]` over the spec → **0 hits**) | Read CLAUDE.md §Lifecycle; grep result recorded |
| "Only `STATUS.md` states what to do next" | honored | grep `next step\|roadmap\|we will\|to do next\|todo` over the spec → **0 hits** |
| "Every non-trivial new requirement carries a source annotation… Numbers without sources don't go in" | **violated (one number)** | Read spec:238–240 — see S3 |
| "External facts… verified against current primary sources before you build on them" | **violated (twice, both hooks-derived)** | Raw primary source grepped — see S1 and M2 |
| "Keep documents in sync" | **violated** | grep `phase0` over v1 spec → 0 hits; over `CLAUDE.md` → 4 hits, none naming this spec — see M5 |
| "When a review surfaces findings, apply **all** of them" | **partially honored** | 11 of 20 prior findings closed; 9 carried — see Convergence Record |

### `docs/collapse-log.md` — standing lessons

| Standing lesson | Status | Verification |
|---|---|---|
| "No ranking claim about this tool's purposes, genres, triggers or moments enters any document unless the owner stated it in those words" (2026-08-01 #1, `collapse-log.md:442–444`, Read) | **violated** | Read spec:212–214; grep `priorit` over `RETHINK.md` → **0 hits** — see S5 |
| "When the argument for excluding something is that it isn't worth saying, that is a bar argument, never a scope argument" (#2) | **honored** | Read spec:69–74 — the deferral reason is now capability-based ("no Phase 0 writer"), not test-set-based; prior S7 closed |
| "Before recording that something was missing, read the file you are about to say it was missing from" (#3, `collapse-log.md:456–459`, Read) | **violated** | Read spec:402–406 against v1:895–901 — see S2 |
| "The spec does not cite numbered architecture decisions as authority" (#4) | **honored** | grep over the spec → 0 hits |
| "A new document needs a written precedence rule before its first sentence" (#5) | **honored** | Read spec:5–14 |
| "'Every X is Y' under a table is an attestation… treat one as a defect on sight" (#6, `collapse-log.md:471–473`, Read) | **honored in §3, violated in §2** | §3's attestation Read at spec:78–80 and **verified true** by deterministic scan (credited below); §2's lead-in Read at spec:55 — see m1 |
| "Stopping too early against a source that is right there" (2026-08-01) | **violated** | Read the ROSE paragraph against spec:234–236 — see M1 |

### v1 spec — the requirement identifiers and their meanings (spec:112)

| Obligation | Status | Verification |
|---|---|---|
| §3 dispositions every v1 `FR-*`/`NF-*`/`C-*` requirement exactly once | **honored** | Deterministic scan: 65 identifiers in v1, 44 + 4 + 17 in §3's buckets, **0 duplicates, 0 in a bucket but absent from v1, 0 in v1 but absent from every bucket** |
| §1: "this document does not mint new ones in those namespaces" | **violated** | Same scan: `FR-A5a`, `FR-A5b` present in this spec, absent from v1 — see S3 |
| Every internal identifier reference resolves | **honored** | Scan of 91 defined identifiers against every boundary-anchored reference: all unresolved references are deliberate v1 identifiers (`FR-A2`, `FR-K3/4/5`, the deferred set) referenced by §2/§3/P0-1 |

---

## Critical & Serious Findings

**No Critical findings** — the prior round's two Criticals are both closed (see the
Convergence Record), and the full inventory was Read or Grep-verified per Compliance Gate
B with no violation of Critical classification observed.

---

### S1 — Both of the document's hooks-sourced quotations are inaccurate, and the load-bearing one does not exist in the hooks documentation at all · **Serious · Systemic · recurring**

**What the spec does now.** §7 (spec:200–205) establishes the structural availability of
the consequence and warning genres:

> "Consequence and warning fire on a pending edit, which requires injecting context
> without issuing a permission decision. **The hooks documentation states that** a
> `PreToolUse` hook exiting 0 *"doesn't approve the tool call: the normal permission flow
> still applies"*, and that `additionalContext` may be returned on that event."

§4's confirmation cell (spec:113) separately quotes the hooks documentation for
`PostToolUse`: *"a string added to Claude's context alongside the tool result"*.

**How that claim was verified — proactive scan across the full inventory scope.** The
hooks reference was downloaded raw from `code.claude.com/docs/en/hooks.md` on 2026-08-01
(242,078 bytes, 3,173 lines) rather than through a summarising fetch. Every quoted span
longer than 25 characters in the spec (**17 spans**) was extracted, Unicode- and
whitespace-normalised, and string-matched against four normalised sources: `RETHINK.md`,
the v1 spec, the extracted ROSE text, and the hooks reference. Results:

| Source class | Spans | Verbatim | Failing |
|---|---|---|---|
| ROSE paper | 8 | 8 | 0 |
| `RETHINK.md` | 6 | 6 (two with terminal-punctuation changes permitted by CMOS 17th §13.7 and §13.50) | 0 |
| v1 spec (`"The Unknown genre has no phase"`) | 1 | 1 | 0 |
| **Claude Code hooks documentation** | **2** | **0** | **2** |

The two failures:

1. **spec:202–204.** Grep of the primary source: `approve the tool call` → **0 hits**;
   `normal permission flow still applies` → **0 hits**; `doesn't approve` → 1 hit, at
   hooks.md:154, reading: *"Exit code 0 with no output means the hook has no decision to
   report, so the tool call continues through the normal permission flow. The hook can
   deny the call, but staying silent doesn't approve it."* The spec's quoted sentence
   matched exactly one source in the scan — **the v1 spec, at `spec-context-oracle.md:187–188`**,
   where the identical string appears attributed to `[HOOKS]`. `git show 3edc61f` and
   `git show 5f939d4` confirm the sentence is **not** in the pre-rebuild Phase 0 spec: it
   entered with the fixes for the prior round's M3.
2. **spec:113.** The source (hooks.md:1756, PostToolUse decision-control table) reads
   *"String added to Claude's context alongside the tool result."* The spec renders it
   *"a string added to…"* — an unmarked interpolation inside quotation marks.

**Which standard it violates.** Citation and quotation accuracy: quotation marks assert
that the enclosed text is what the named source says, and "the hooks documentation states
that *«X»*" asserts that the documentation contains X. CMOS 17th §13.7 permits changing a
quotation's terminal punctuation and initial capital; it permits neither inserting a word
nor recomposing two clauses into a sentence the source does not contain. The project
raises this to a functional requirement twice over: `CLAUDE.md`'s engineering standard —
*"External facts (harness contracts, protocol status, library behavior) are verified
against current primary sources before you build on them — the hooks contract has already
drifted once; assume it will again"* — and the Expert Standard's prior-artifact rule,
which this instance violates in its purest form (the string was carried from the v1 spec
and re-attributed to the primary source).

**Why it is Systemic rather than two slips.** The scan shows the failure is not
distributed — it is total within one source class and absent from the other three. Every
ROSE quotation and every RETHINK quotation was re-derived; **neither** hooks quotation
was. That is a generator, not a coincidence: §4's confirmation cell records the hooks row
as *"Queried 2026-08-01 via Context7 `/websites/code_claude`"*, and a Context7 query
returns extracted snippets, not the document — which is exactly the summarising-instrument
failure the prior round's tool plan recorded and overruled by downloading the source. The
document applied the corrected method to the paper and to `RETHINK.md` and the superseded
method to the harness contract. Consequence: `C-5` (spec:367–369) requires implementation
to re-verify the hooks contract against current documentation and to *"degrade to silence
on any drift they detect."* An implementer searching the documentation for §7's quoted
sentence will not find it, and the honest reading of `C-5` is then to degrade — switching
off the two genres `AC-7` and `AC-8` require. This is the same downstream harm the prior
round's M3 named, at the same location, produced by M3's fix.

**The underlying behavioural claim is true.** Verified independently: hooks.md:1544–1553
lists `permissionDecision`, `permissionDecisionReason`, `updatedInput` and
`additionalContext` as independent fields of the `PreToolUse` `hookSpecificOutput` object;
hooks.md:838–842 lists `PreToolUse` among the events whose `additionalContext` is
delivered ("next to the tool result"); hooks.md:695 shows `exit 0  # No decision: the
normal permission flow applies`. Only the citation is wrong — which is why this is Serious
and not Critical.

**What correct looks like.** Replace the quotation with the source's own words and its
location, e.g.: *"The hooks reference states that exit code 0 with no output 'means the
hook has no decision to report, so the tool call continues through the normal permission
flow' (`hooks.md`, 'Claude Code acts on the result'), and lists `additionalContext` as a
field of the `PreToolUse` `hookSpecificOutput` object independent of `permissionDecision`
('PreToolUse decision control')."* Restore the initial capital or mark the interpolation at
spec:113. Then re-derive the whole §4 hooks row against the downloaded document rather
than a query result — the row's other seven facts were spot-checked and hold (see What's
Actually Good, entry 5), but the method that produced two failures in two attempts should
not be trusted for the rest by inference.

---

### S2 — `P0-D-6` claims the three-term bar is this document's composition; v1 §12 already commits Phase 0 to it, with the named computable terms this spec's `FR-A5` is missing · **Serious · recurring**

**What the spec does now.** `FR-A5` (spec:217–226): *"Each candidate carries **confidence
× decision-impact × marginal value**… All three terms are computable without a model:
marginal value derives from the fact's provenance class and from what this consumer has
already read or searched this session… Composing the two into one three-term product is
this document's. `[P0-D-6]`"* `P0-D-6` (spec:402–406): *"Marginal value is stated at
`:59–61` as the only relevance metric that matters, but not as a factor in the gate;
making it one is this document's composition."*

**How that claim was verified.** Read of spec:217–226 and 402–406 at `332406c`. Read of
`RETHINK.md:198–199` (confirms the two-term statement, verbatim) and `:59–61` (confirms
the marginal-value sentence, verbatim). Then Read of the v1 spec, which §4 declares
governs *"the requirement identifiers and their meanings"*: `spec-context-oracle.md:424–434`
carries v1's two-term `FR-A5`, but `spec-context-oracle.md:895–901` — the paragraph headed
**"Phase 0's bar"** — reads: *"Phase 0 ships FR-A5's ordinary bar and issues no
degraded-mode announcement. **Every term is computable without a model**: `materiality`
falls back to the genre's base weight for mechanical genres, `structural_weight` is
deterministic, and **`self_serve_cost` derives from provenance class and what the consumer
has already done**."* Located by grep for `self_serve_cost|materiality|structural_weight`
→ 4 hits, all Read.

**Which standard it violates.** The collapse log's standing lesson #3, recorded 2026-08-01
at `collapse-log.md:456–459` (Read): *"before recording that something was missing, read the
file you are about to say it was missing from."* Secondarily, ISO/IEC/IEEE 29148 traceability:
a decision record's function is to tell a downstream reader where a requirement's authority
comes from, and this one sends the reader to the wrong place.

**Why it matters.** Three consequences, in increasing order of cost.

1. **The provenance is wrong.** v1's "Phase 0's bar" paragraph is about Phase 0
   specifically, states the three-term product, states that every term is computable
   without a model, and describes the third term in *the same words this spec uses*
   ("derives from provenance class and what the consumer has already done"). The
   composition is inherited, not composed. `P0-D-6` also asserts marginal value is "not a
   factor in the gate" upstream; it is one, in the upstream paragraph that governs this
   exact phase.
2. **§3's disposition is contradicted.** §3 (spec:83) lists `FR-A5` under *"In force in
   Phase 0, **unchanged**"* while `P0-D-6` states in the same document that Phase 0 adds a
   third factor to it. One of the two is wrong, and a reader cannot tell which without
   opening v1.
3. **The material dropped is exactly what the prior round's M5 asked for.** M5 found
   `decision-impact` named as a bar term with no defining computation. It still has none:
   `FR-A5` asserts all three terms are model-free but gives named inputs for one. v1's
   paragraph gives the other two — `materiality` falls back to genre base weight,
   `structural_weight` is deterministic. The document discarded the vocabulary that
   answers its own open question. The collapse log names this tell precisely
   (`collapse-log.md:361–364`, Read): *"a citation that lands on a design intent, a schema
   column, or a component name rather than on a per-candidate computation with named inputs
   is an unfilled requirement wearing a reference."*

**What correct looks like.** Rewrite `P0-D-6` to record the real provenance and carry the
terms forward: *"P0-D-6 — FR-A5's three-term product is v1's, not this document's. v1
`FR-A5` (`spec-context-oracle.md:424–434`) states two terms, but v1 §12's 'Phase 0's bar'
(`:895–901`) already binds Phase 0 to three and names each one's model-free computation:
`materiality` (genre base weight for mechanical genres), `structural_weight`
(deterministic), `self_serve_cost` (provenance class plus what the consumer has already
done). This document adopts that decomposition and renames `self_serve_cost` to marginal
value to match `RETHINK.md:59–61`."* Then state the three inputs in `FR-A5` itself, and
change §3's `FR-A5` disposition from "unchanged" to a narrowing row (or restate it as "in
force per v1 §12's Phase 0 reading").

---

### S3 — §1's identifier-namespace declaration is false: the document mints two `FR-*` identifiers, which carry no §3 disposition and hold the one number in the spec with no source · **Serious · recurring**

**What the spec does now.** §1 (spec:9–14): *"**Identifier namespaces.** `FR-*`, `NF-*`,
`C-*` and `P-*` are the v1 spec's; **this document does not mint new ones in those
namespaces.** §3 states every v1 requirement's Phase 0 disposition… `AC-*` and `P0-*` are
this document's own."*

**How that claim was verified — proactive scan across the full inventory scope.** A
deterministic script extracted every bolded `FR-*`/`NF-*`/`C-*` definition from both spec
files at `332406c` and compared the sets. v1 defines **65**; this spec defines **42**, of
which **two are absent from v1: `FR-A5a` and `FR-A5b`**. Cross-checked by grep of the v1
spec for `FR-A5a|FR-A5b` → **0 hits**. The same script checked §3's three buckets against
v1's set: 44 + 4 + 17 = 65, **0 duplicates, 0 orphans in either direction** — so §3's
disposition is exhaustive over v1 and, by construction, says nothing about `FR-A5a` or
`FR-A5b`. Separately: v1's principles are identified `P1`–`P9`, not `P-1`–`P-9` (grep of
v1 for `^- \*\*P[0-9]` → 9 hits, Read), so the `P-*` namespace §1 names does not exist;
§3 itself writes them `P1–P9` (spec:103).

**Which standard it violates.** ISO/IEC/IEEE 29148 *unambiguous* and the traceability
requirement that a reference resolve to exactly one requirement — the reason §1 declares
namespaces at all. A document that states a namespace rule in its preamble and breaks it in
§8 is worse than one that states no rule: a downstream reader who trusts §1 will search v1
for `FR-A5a`, find nothing, and have no way to tell whether the identifier is new, a typo,
or a v1 identifier they have failed to locate.

**Why it matters, and the concrete cost.** The prior round's C2 established that this
document family's identifiers are the anchor of the review-closure mechanism. §1's
declaration is the current fix for that, and it is load-bearing precisely because the
`AC-*` collision with v1 is real and permanent (v1 defines `AC-1`..`AC-22`; this spec
defines `AC-1`..`AC-27`, naming different criteria). Two specific costs follow from the
minting:

- **`FR-A5a` and `FR-A5b` have no Phase 0 disposition.** Every other requirement in the
  document is placed by §3 in exactly one of three buckets, which is the mechanism §3
  exists for (*"so a reader can tell a deliberate exclusion from an omission"*, spec:79–80).
  These two are placed by nothing.
- **The one unsourced number in the spec lives in `FR-A5a`.** Its closing clause
  (spec:238–240) reads *"Suggestion-grade coupling may run looser, never below support ≥ 2;
  the same study measured 'a feedback of 0.64 and a precision of 0.30' at support 1 and
  confidence 0.1."* The quoted ROSE figure verifies verbatim (string-matched), but it
  establishes only that support 1 is too low — it does not establish 2. In v1 that floor
  carried `[HH-04]` (Hassan & Holt's 0.06 raw co-change precision, `spec-context-oracle.md:104`,
  Read) plus `[D-5]` (`:434`, Read). This spec drops `[HH-04]` from §4 and asserts at
  spec:116 *"No other external source is cited, because no requirement depends on one."*
  That attestation is falsified by the floor it moved into an undispositioned requirement.
  Grep of §13 for a covering decision: `P0-D-1`..`P0-D-14` Read in full — none covers
  support ≥ 2. Standard: `CLAUDE.md` — *"Every non-trivial new requirement carries a source
  annotation… Numbers without sources don't go in."*

  (The 3-second latency ceiling, the prior round's other half of M4, is **not** a finding
  this round: §3 places `FR-O3` in "in force unchanged", which inherits v1's `[D-11]`
  grounding at `spec-context-oracle.md:812–815`, Read. That mechanism is the right one —
  it is unavailable to `FR-A5a` only because `FR-A5a` is undispositioned.)

**What correct looks like.** Pick one and make §1 true. Either (a) rename the two to
`P0-A5a`/`P0-A5b` — the `P0-*` namespace §1 already reserves for this document's own
identifiers — and add them to §3 as narrowings of v1 `FR-A5`; or (b) keep the names, amend
§1 to *"this document mints `FR-A5a` and `FR-A5b` as sub-identifiers of v1 `FR-A5` and no
others"*, and add a §3 row for each. Either way, change §1's `P-*` to `P1–P9` to match v1,
and either restore `[HH-04]` to §4 as the grounding for support ≥ 2 or add a `[P0-D-n]`
recording it as this document's judgment with its reasoning.

---

### S4 — Seven of fifty requirements still have no acceptance criterion, and §14 carries no inspection list; the uncovered one that matters is the record Phase 0 exists to produce · **Serious · recurring**

**What the spec does now.** §14 defines 27 criteria (`AC-1`..`AC-27`), up from 16 in the
reviewed version.

**How that claim was verified — proactive scan across the full inventory scope.** A
deterministic, boundary-anchored script (so that `AC-10` is not miscounted as a reference
to `C-10`) extracted every requirement defined in §§5–13 and every identifier referenced
anywhere in §14, at `332406c`. Result: **50 requirements defined, 43 referenced by at least
one criterion, 7 referenced by none**:

`C-1`, `C-3`, `C-5`, `FR-D4`, `FR-L1`, `NF-3`, `P0-2`.

Grep of §14 for an inspection-verification list (`inspection|by review|not tested`) → 0
hits; §14 Read in full to confirm.

**Which standard it violates.** ISO/IEC/IEEE 29148 §5.2.8 — every requirement in a
specification carries a means of verification. The prior round's remedy explicitly allowed
either criteria or an explicit inspection list; neither is present for these seven, so the
gap is silent.

**Why it matters, specifically here.** `FR-L1` (spec:176–177) is the requirement that the
session service *"logs, per event, the candidates considered, the whisper sent if any, and
subsequent evidence that the agent acted on it."* It is not `FR-X6`'s whisper audit log
(covered by `AC-15`) and not `FR-M1`'s diagnostic log (covered by `AC-17`, `AC-18`); its
distinct content is the **uptake evidence**. §1 states the reason this phase is built
first — *"running it is the only way to obtain evidence about how often the oracle should
speak"* (spec:46–47) — and `P0-D-12` (spec:429–432) states that a hit rate *"additionally
requires resolving uptake evidence into an uptake judgment; FR-L1 fixes only that the
evidence is recorded."* Nothing in §14 checks that it is recorded. Phase 0 can therefore
pass its own exit having produced none of the evidence that is its stated reason to exist.

The other six are lower-consequence but not zero: `NF-3` (incremental indexing) is
substantively exercised by `AC-24`'s closing clause without being named, so it needs a tag
rather than a test; `C-1`, `C-3`, `C-5`, `FR-D4` and `P0-2` are all inspection-verifiable
and belong on the list the prior round's remedy allowed.

**What correct looks like.** Add one criterion for `FR-L1` — after a fixture session in
which a whisper is delivered and the agent opens the pointed file, the session log contains
that event's candidate set, the whisper sent, and the subsequent read of the pointer — and
add to §14 a short closing paragraph naming `C-1`, `C-3`, `C-5`, `FR-D4`, `NF-3` and `P0-2`
as verified by inspection, with the inspection stated for each. Tag `NF-3` onto `AC-24`.

---

### S5 — "Warnings take priority within that budget" is still a genre-ranking claim with no owner statement and no source, under a citation that does not contain it · **Serious · recurring**

**What the spec does now.** `FR-A3` (spec:212–214): *"At most one whisper per event, within
a per-session injected-token budget of 2,000 tokens by default, configurable. **Warnings
take priority within that budget, never exemption from it.** `RETHINK.md:175–176`.
`[P0-D-4]`"*

**How that claim was verified.** Read of spec:212–214 at `332406c`. Read of
`RETHINK.md:175–176`: *"**Per-trigger and per-session whisper budgets.** Hard caps; the
orientation whisper decays out of consideration once the agent is deep in the work."* The
priority rule is not in the cited range. Grep of the whole of `RETHINK.md` for `priorit`
(case-insensitive) → **0 hits**; the surrounding region (`:173–182`) was then Read to
confirm, per the project's search-locates/reading-verifies rule. Read of `P0-D-4`
(spec:396–398): it covers *"FR-A3's budget and FR-A7's session count carry stated values"*
— the numbers, not the ranking. Read of v1 `FR-A3` (`spec-context-oracle.md:416–419`):
*"warnings get priority within the budget, not exemption from it"* — the clause is
inherited verbatim from v1, which carries it under `[RETHINK §5]`, the same non-supporting
attribution.

**Which standard it violates.** The collapse log's standing directive, recorded 2026-08-01
at `collapse-log.md:442–444` (Read) as the one failure the owner himself caught: *"no ranking
claim about this tool's purposes, genres, triggers or moments enters any document unless
the owner stated it in those words, quoted and attributed."* Secondarily `CLAUDE.md`'s
engineering standard, and the Expert Standard's prior-artifact rule — the clause is
replicated from v1 rather than derived.

**Why it matters.** The directive exists because an agent-authored superlative wrapped
around the owner's words propagated to four documents before he caught it, and the log
records the reason it survived: *"A reduction inside a rationale is more durable than one
inside a decision, because reviewers check decisions against sources and read rationale as
prose."* This clause is stronger than that — it is inside a *requirement*, it ranks one of
six genres above the other five inside the one resource all six compete for, and the
addition of `AC-27` this round has now made it *testable*, which converts an unsourced
ranking into a build obligation. Under budget pressure this clause decides which genre is
heard, in a project whose owner has twice corrected agents for collapsing a deliberately
broad tool onto one purpose (`RETHINK.md:381–391`, Read).

**What correct looks like.** Unchanged from the prior round, and now cheaper than it will
ever be again: either (a) delete the clause and let `FR-A5`'s
confidence × decision-impact × marginal-value bar decide ordering — which is where
per-candidate ranking belongs and what the collapse log's "bar argument, never a scope
argument" lesson requires — retiring `AC-27` with it; or (b) keep it as an explicit
`[P0-D-n]` that states it is the spec's own ranking, gives the reasoning, and flags for the
owner that it is a ranking he has not made. (a) remains preferable; the bar already carries
the mechanism.

---

## Systemic Patterns

**One systemic pattern**, cross-listed from the findings above with its scan.

1. **S1 — the hooks half of the citation apparatus was not re-derived.** Scan: every quoted
   span longer than 25 characters in the spec (**17 spans**) extracted, normalised, and
   string-matched against four normalised sources (`RETHINK.md`; the v1 spec; the ROSE
   paper's 69,435-char extraction; the hooks reference downloaded raw, 242,078 bytes,
   2026-08-01). Result: **2 of 2 hooks-sourced quotations fail; 0 of 8 ROSE, 0 of 6
   RETHINK, 0 of 1 v1 fail.** Instances enumerated: spec:202–204 (string absent from the
   primary source — `approve the tool call` → 0 hits, `normal permission flow still
   applies` → 0 hits — and present verbatim in the v1 spec at `:187–188`); spec:113
   (unmarked interpolation of "a" into hooks.md:1756's "String added to…"). Standard:
   quotation and citation accuracy (CMOS 17th §13.7), raised to a functional requirement by
   `CLAUDE.md`'s external-facts rule. Systemic because the failure is total within one
   source class and absent from the other three, and the generator is visible in the
   document: §4 records the hooks row as verified by Context7 query while the paper and
   `RETHINK.md` were verified by fetching and reading the source — the same instrument
   split the prior round's tool plan recorded and overruled.

**Scans run that returned nothing systemic**, with queries and result counts:

- Requirement-to-criterion coverage, boundary-anchored, over all 50 defined requirements →
  7 uncovered, reported as the single finding S4, not a cross-document pattern.
- `RETHINK.md` citation re-derivation: every `RETHINK.md:` range in the spec Read in
  `RETHINK.md` at drafting time → **7 of the prior round's 8 defective ranges are correct
  at `332406c`**; the one residual (`FR-X5`) is isolated and appears below as m3, not a
  pattern.
- Internal cross-reference resolution: 91 defined identifiers vs every boundary-anchored
  reference in the spec → **0 dangling references**; all unresolved names are deliberate v1
  identifiers.
- `grep -nE "architecture|\[D-[0-9]"` over the spec → **0 hits** (the collapse log's
  "spec does not cite architecture decisions" lesson is cleanly honored).
- `grep -niE "next step|roadmap|we will|to do next|todo"` over the spec → **0 hits**
  (`CLAUDE.md`'s "only `STATUS.md` states what to do next" is honored).
- Numeric-source audit: every number stated normatively in §§5–11 traced to a source
  (30 entities → ROSE, verbatim; 1.5 s / 3 s → v1 `[D-11]` via §3's unchanged disposition;
  2,000 tokens → `[P0-D-4]` and v1 `[D-10]`; support 3 / confidence 0.9 → ROSE, verbatim;
  10% → `[P0-D-14]`; top decile → `[P0-D-9]`) → **one unsourced (support ≥ 2)**, reported
  inside S3; not a pattern.

---

## Moderate & Minor Findings

### M1 — `FR-A5a` names the ROSE cost "recall"; the paper reports recall of about 75 percent at that same operating point · **Moderate · regression**

`FR-A5a` (spec:234–236): *"**Its cost is recall**: at that same operating point 'The
feedback is 3 percent' and 'the percentage of missed alarms is on average 97 percent.'"*
Verified: both quoted fragments string-match the extracted paper text, but the full bullet
they are drawn from reads *"The feedback is 3 percent **and the average recall is about 75
percent**. This means that for only one out of every 33 missing items… ROSE issues a
warning; the percentage of missed alarms is on average 97 percent. However, for those cases
where ROSE issues a warning, it predicts 75 percent of the items that are actually
missing."* (Read from the extraction at the matched offset.) The quantity the spec quotes
is the paper's **feedback**; the paper's **recall** at that operating point is 75 percent —
a benefit, not a cost. Standard: correct use of a cited source's defined terms; a reader who
follows the citation to check the cost finds the same sentence naming the opposite value for
the word the spec used. This is the collapse log's *"stopping too early against a source
that is right there"* in mirror image — the sentence was read far enough to quote and not
far enough to name. Regression: the sentence entered with the fix for the prior round's S1.
Fix: *"Its cost is coverage, not precision or recall-given-a-warning: at that operating
point the same evaluation reports 'The feedback is 3 percent' — one warning per 33 missing
items — so 'the percentage of missed alarms is on average 97 percent', while recall
conditional on a warning stays about 75 percent."*

### M2 — §4 omits the `SessionEnd` budget, on the one event Phase 0 newly depends on, and states the default timeout without the qualification the source attaches to it · **Moderate · recurring**

`FR-O1` (spec:120–127) now observes `SessionEnd` and `C-2` (spec:361–363) requires session
state to be *"torn down on `SessionEnd`"* — the prior round's S6, substantively closed.
§4's confirmed-facts cell (spec:113) records *"default timeout 10 minutes, 30 s for
`UserPromptSubmit`; per-hook `timeout` configurable"*. Verified against the raw primary
source: hooks.md:343 states *"Defaults: 600 for `command`, `http`, and `mcp_tool`; 30 for
`prompt`; 60 for `agent`. `UserPromptSubmit` lowers the `command`, `http`, and `mcp_tool`
default to 30, and `MessageDisplay` lowers it to 10. **`SessionEnd` hooks share a 1.5-second
budget**; if your settings set a longer per-hook `timeout`, Claude Code raises the budget to
match, up to 60 seconds"*; hooks.md:2693 repeats the 1.5-second default and adds that it
applies to *"session exit, `/clear`, and switching sessions via interactive `/resume`."*
Grep for `10 minutes` in the source → **0 hits**. Standard: interface-contract completeness
— a mechanism's documented failure conditions belong in the requirement that depends on it —
and `CLAUDE.md`'s external-facts rule. Why it matters: the spec mandates teardown on the one
event with the tightest harness budget, and 1.5 s is *below* `FR-O3`'s 3 s ceiling
(spec:131–134), so the harness kills the hook before the oracle's own ceiling fires. v1
recorded exactly this at `spec-context-oracle.md:244–248` (Read); this document dropped it.
The remedy is available and unstated: `init` writes the harness settings file, which `AC-6`
already permits as the only touched file, and an explicit per-hook `timeout` there raises the
shared budget. Fix: add the 1.5-second `SessionEnd` budget and the handler-type
qualification on the 600 s default to §4; note in `C-2` that `init` sets an explicit
`SessionEnd` `timeout`; and add that setting to `AC-6`'s accounting.

### M3 — `P0-D-4` asserts that `FR-A7` carries a stated value; it does not, and `FR-A6`'s floor has neither a value nor a decision · **Moderate · recurring**

`P0-D-4` (spec:396–398): *"**FR-A3's budget and FR-A7's session count carry stated
values**, without which NF-2 is unfalsifiable and FR-A7 untestable."* Verified by Read:
`FR-A3` (spec:212–213) does carry one — *"2,000 tokens by default, configurable"*, which
closes the prior round's M6. `FR-A7` (spec:247–251) reads *"In a project's first
**configured number of sessions**"* — no value, no default. `AC-11` (spec:481–485) likewise
says *"first configured sessions"*. Grep of §13 (`P0-D-1`..`P0-D-14`, Read in full) for a
covering value → none. Separately, `FR-A6` (spec:243–246) states *"Below a **configured
minimum** of mined history for a region"* with no default and no `[P0-D-n]`, and `P0-D-7`
(spec:407–409) argues only that the floor is *separate*, not what it is. Standard:
ISO/IEC/IEEE 29148 *verifiable* — and, more sharply, the document's own argument: `P0-D-4`
states the criterion for why a value is needed and then does not supply it. Fix: state a
default session count in `FR-A7` and a default corpus minimum in `FR-A6`, both with the
"expected to move once Phase 0 has run" framing `P0-D-4` already uses, and extend `P0-D-4`
(or add a sibling) to cover `FR-A6`.

### M4 — The harness's own prompt-injection defence can silently defeat delivery, and `FR-X2` selects the mitigation that triggers it · **Moderate · recurring**

`FR-X2` (spec:312–314) mitigates T1 by requiring that *"repository strings appear only as
clearly delimited quotations or pointers."* The hooks reference states at hooks.md:857
(Read): *"Write the text as factual statements rather than imperative system instructions…
**Text framed as out-of-band system commands can trigger Claude's prompt-injection
defenses, which causes Claude to surface the text to you instead of treating it as
context.**"* Grep of the spec for `injection.defen|prompt-injection|surface the text|
out-of-band` → **0 hits**; §10 Read in full to confirm. Standard: interface-contract
completeness. Why it matters: a delimited quotation of hostile imperative repository text is
exactly the shape the harness screens for, so `FR-X2`'s first-named mitigation can convert a
whisper into a user-facing notice — a silent non-delivery. `AC-14` still passes (nothing was
relayed or obeyed) and `FR-M2` would classify it after the fact, but no requirement
anticipates it. The same paragraph also supplies a second, mechanical grounding for `FR-D2`
that the spec does not use. Fix: record the behaviour in §4's confirmed facts, note in
`FR-X2` that quotation is the higher-risk of its two options for this reason, and make
pointer-only the default for repository-derived spans — the resolution the collapse log
already reached on this threat (`collapse-log.md:186–188`, Read — *"default pointer-only for
all repo-derived spans, inline quotation only for mechanically-generated content"*).

### M5 — The document governing Phase 0 is still unreachable from the mandated reading protocol, and v1's superseded Phase 0 exit carries no pointer to it · **Moderate · recurring**

Verified by grep: `phase0|Phase 0` over `CLAUDE.md` → 4 hits, all at `231–238`, all naming
`docs/architecture-context-oracle-phase0.md`, none naming this spec; `CLAUDE.md`'s
read-before-working list (item 2) and its information-policy row for "What the tool must
do" both name only `docs/specs/spec-context-oracle.md` (Read). `phase0` over the v1 spec →
**0 hits**. Standard: `CLAUDE.md`'s engineering standard — *"Keep documents in sync"* — and
its own information policy, whose stated failure mode is *"State here goes stale while the
real state moves on, and the stale copy is what a new session reads first."* Why it matters,
concretely and newly: v1 §12's Phase 0 exit (`spec-context-oracle.md:908–909`, Read) still
reads *"Exit: AC-1..AC-5, AC-12, AC-14, AC-17, AC-18 pass; **the owner runs it on a real
project without incident**"* — the exact clause the prior round's S2 identified as making
the owner the incident detector, and which §14 of this spec has correctly replaced. §1's
precedence rule resolves the conflict for anyone reading both documents; nothing routes a
fresh session to the second one. Fix: add this spec to `CLAUDE.md`'s read-list and
information-policy table with §1's precedence rule, and add one line to v1 §12 pointing at
it and marking the Phase 0 exit superseded.

### m1 — §2's lead-in is an attestation falsified by one row of its own table · **Minor · recurring**

§2 (spec:55) introduces the exclusions table as *"**Out of scope**, each with the phase that
owns it:"*. Verified by Read of the table at spec:57–67: the Unknown-genre row's "Owned by"
cell reads *"Held open in the v1 spec §14"*, which is not a phase — correctly and
transparently so (its reason cell quotes v1's *"The Unknown genre has no phase"*, verified
verbatim against `spec-context-oracle.md:1075`). Standard: the collapse log's standing
instruction at `collapse-log.md:471–473` (Read) — *"'Every X is Y' under a table is an
attestation, and the standing instruction is to treat one as a defect on sight."* Fix: one clause —
*"each with the phase that owns it, or the reason its phase is unresolved upstream."*

### m2 — `C-1` permits network access during install and index that `FR-X5` and `AC-13` forbid outright · **Minor · recurring**

`C-1` (spec:354–356) allows *"installs and indexes with no native toolchain, no
prebuilt-binary download, and **no network beyond the harness's**"*; `FR-X5` (spec:318–320)
requires *"**no network access at all**"*; `AC-13` (spec:488–489) asserts *"no outbound
traffic at all"* on an instrumented run. Verified by Read of all three. The reconciliation
is presumably install-time versus run-time, but none of the three says so, and `C-1` covers
*"installs **and indexes**"* while indexing is unambiguously part of the run `AC-13`
instruments. Standard: internal consistency (ISO/IEC/IEEE 29148 *consistent*). Fix: scope
`C-1`'s network clause to installation explicitly, and state that the running oracle —
including indexing — opens no connection, which is what `FR-X5` already means.

### m3 — `FR-X5`'s trailing citation covers a network claim `RETHINK.md` does not carry, and only `FR-X7` is tagged with the decision that owns it · **Minor · recurring**

`FR-X5` (spec:318–320): *"Least privilege: read-only repository access, no tool-invocation
authority in the agent's session, and — Phase 0 having no model call — no network access at
all. `RETHINK.md:321–323`."* Verified by Read of `RETHINK.md:321–323`: *"Corollary: the
oracle must be safe to run on real projects by construction — it never mutates the repo and
never prevents an action; its worst case is a wasted sentence."* It supports read-only
repository access; it says nothing about network. `P0-D-11` (spec:424–428) correctly owns
the no-outbound-traffic property as this document's — but tags `FR-X7`, and states the
property is *"derived from FR-X5's least-privilege posture"*, so the derivation ends at a
requirement whose own citation over-attributes it. This is the residual of the prior round's
S4 instance 4, which is otherwise fixed at `FR-X7` (spec:323–326, Read — now precise about
what `RETHINK.md:330–334` establishes). Standard: citation accuracy. Fix: tag `FR-X5`'s
network clause `[P0-D-11]` and scope the `RETHINK.md:321–323` citation to the read-only
clause it supports.

### m4 — §2's closing paragraph gives a record-type reason for an item that is not a record type, and calls a loosening a narrowing · **Minor · recurring**

§2 (spec:69–74): *"Five genre arms are narrower here than in the v1 FR-A2 definitions
**because the record type each reads has no Phase 0 writer** (P0-1): orientation's invariant
arm **and its token cap**; coupling's canonical-helper arm; consequence's
historical-breakage and reuse arms; warning's landmine arm…; completeness's invariant arm."*
Verified by Read: the stated cause is a record-type argument, and a token cap is not a
record type — its removal cannot be explained by a missing writer. Verified further, v1's
orientation content is *"2–4 entry points, the invariant that will matter, landmines
matching the task shape; **≤ 400 tokens**"* (`spec-context-oracle.md:402`, Read), sourced to
`RETHINK.md:163` (*"~150–400 tokens. Not a binder."*, Read) — so removing the cap **loosens**
the genre rather than narrowing it, which is the opposite of what the paragraph claims for
it. Consequence is low, because `FR-D1`'s one-to-five-sentence limit (spec:264–267) binds
every whisper independently; the defect is that a scope paragraph offers one reason for six
items and it does not reach one of them. Standard: ISO/IEC/IEEE 29148 *consistent*, and the
collapse log's *"a table is not a summary — every cell is a claim."* Fix: move the token cap
out of that clause and give it its own sentence — either that `FR-D1`'s sentence limit
supersedes it in Phase 0, or that it is retained.

---

## Tentative Findings

No tentative findings — every candidate finding's premise was verified against current
source before it was written, per Compliance Gate B. The three premises most at risk were
each closed by direct instrument: the hooks quotation (raw 242,078-byte primary source
downloaded and grepped, rather than queried through a summarising instrument); the eight
ROSE quotations (PDF fetched, 17-page TSE version confirmed by page count and masthead,
text extracted, every fragment string-matched after normalisation); and the v1 identifier
set behind §3's disposition and S3's minting claim (deterministic scan, counts reported,
cross-checked by grep).

---

## Observations

These carry no standard violation and no severity.

1. **The Clear Thought MCP was unavailable in this session**, as in round 1.
   `metacognitivemonitoring` and `collaborativereasoning` are both mandatory in the review
   skill; tool search returned no matching tools. Both passes were performed manually. The
   metacognitive baseline was drawn before any finding was drafted: everything about the
   current spec, the prior review's findings, the ROSE text, the hooks contract and the v1
   identifier set sat on the *inferred* side and was routed through Step 6 before it could
   support a finding; the one item that looked like knowledge — the dispatch's fix-diff
   range — was re-derived and found to understate the range, which is recorded in the header
   note. The three-perspective check (standards discipline, downstream architect,
   implementer) changed the delivered output in four ways: §3's "each has exactly one
   disposition" attestation was moved from candidate finding to *What's Actually Good* after
   the scan verified it holds, rather than being flagged on the collapse log's
   treat-attestations-as-defects heuristic alone; the 3-second-ceiling half of the prior
   round's M4 was dropped after establishing that §3's "unchanged" disposition inherits v1's
   `[D-11]`; Recommended Priority separates what blocks the architecture from what blocks
   the exit; and every fix statement was written as concrete replacement text rather than as
   a direction.

2. **Round numbering carries an unresolved tension with the reviews README.** That file
   states rounds count passes over *the current artifact*, and that a from-scratch rebuild
   starts a new chain — the precedent being the architecture document's 2026-07-22 rebuild.
   Commit `91698c7` rebuilt this spec, replacing 389 of its lines. Under the README's
   convention this pass would be round 1 of a new chain; under the dispatch's instruction to
   apply the Post-fix rule it is round 2. This review follows the dispatch, because the
   rebuilt document occupies the same path, governs the same subject, and — as the closure
   ledger below shows — the prior round's findings do re-derive against it, which is the
   condition the post-fix rule exists to test. Whoever maintains the README may want to say
   which of the two tests decides: "same artifact" or "prior findings still re-derivable."

3. **The reviewed artifact was stable throughout this pass.** Unlike round 1, no commit
   landed during the review. All findings are against `332406c`.

---

## What's Actually Good

Each entry names the property, the standard it is good by, and how the property was
verified.

1. **§3's disposition of the v1 requirement set is mechanically complete.** Property: all
   65 v1 `FR-*`/`NF-*`/`C-*` requirements are placed in exactly one of three buckets, with
   no duplicate, no member absent from v1, and no v1 member absent from every bucket.
   Standard: ISO/IEC/IEEE 29148 *complete* and the traceability principle that a derived
   specification accounts for its parent's obligations rather than sampling them.
   Verification: a deterministic script extracted every bolded definition from the v1 spec
   (65) and every identifier from §3's three lists (44 + 4 + 17 = 65), then computed both
   set differences — **both empty** — and checked for duplicates — **none**. This is the
   one place in either document where an "every X is Y" attestation is made and holds, and
   it is what makes §2's exclusions auditable rather than thematic.

2. **Every ROSE quotation is verbatim, the paper is the one the spec claims, and the cost
   figures the prior round found suppressed are now quoted.** Property: eight quoted
   fragments reproduce the source exactly, including *"The feedback is 3 percent"* and
   *"the percentage of missed alarms is on average 97 percent."* Standard: evidentiary
   completeness when adopting a published operating point — both error axes travel with the
   threshold. Verification: PDF fetched from `thomas-zimmermann.com` (1,948,399 bytes),
   confirmed 17 pages and masthead `IEEE TRANSACTIONS ON SOFTWARE ENGINEERING / VOL. 31 /
   NO. 6 / JUNE 2005`, text extracted (69,435 chars), all eight fragments string-matched
   after Unicode and whitespace normalisation. (M1 is about the *label* on the cost, not
   its presence.)

3. **Seven of the prior round's eight defective `RETHINK.md` citation ranges are correct,
   and the method visibly changed.** Property: each range now contains the text the claim
   rests on. Standard: citation accuracy, raised to a functional requirement by the
   document's reliance on line citation. Verification, each range Read in `RETHINK.md` at
   drafting time: `FR-D2` → `:190` (was `193–194`, wrong sentence); §4's source row →
   `303–399` (was `303–392`, excluding the no-gates corollary `FR-O4` rests on); `FR-K1` →
   `130–134` (was `130–132`, excluding three of the seven artifacts it enumerates); `FR-A4`
   → `138` **plus** `177–178` (was `177–178` alone); `FR-D1` → `195` + `187–188` +
   `196–197` (was `195` alone); `FR-A5` → `59–61` (was `107`, a tier-ordering sentence);
   `FR-X7` → `330–334` with the no-traffic property explicitly disclaimed to `P0-D-11`
   (was an overreach). The widening pattern — each range now bounded by the supporting text
   rather than by a line break — is the practice change the prior round asked for, not eight
   patches.

4. **The completion gate is now read off the oracle's own diagnostics.** Property: §14's
   preamble (spec:444–447) reads *"Phase 0 is complete when every criterion below passes,
   and when a run on a real project produces a clean `ctxoracle status` — no unresolved
   failure class, no latency breach, no undelivered whisper. The owner runs it; the
   diagnostics, not the owner, are what report whether it behaved."* Standard: testability
   of an acceptance condition (ISO/IEC/IEEE 29148 *verifiable*), and `RETHINK.md` decision
   10, which requires that failure detection not depend on the owner noticing. Verification:
   Read of spec:444–447 against spec:333–334 (§11's opening, which quotes decision 10
   verbatim — confirmed against `RETHINK.md:350–354`) and against `FR-M2` (spec:340–343),
   which defines the failure classes the gate now names. The three named conditions each map
   to a class `FR-M2` detects and `P0-4` reports, so the gate is closed by instrument rather
   than by impression.

5. **Requirement-to-criterion coverage rose from 30/50 to 43/50, and the priority items are
   the ones that closed.** Property: `FR-X6` (whisper audit log — the sole mechanism behind
   the one owner-facing obligation §1 states) is now covered by `AC-15`; `FR-K6` and
   `FR-X4` (the two controls for threat T2) by `AC-15`, `AC-20` and `AC-26`; `FR-A6` by
   `AC-4`; `FR-O5` by `AC-22`; `NF-2` by `AC-18`. Standard: ISO/IEC/IEEE 29148 §5.2.8
   requirements-to-verification coverage. Verification: the same boundary-anchored scan that
   produced S4, run over both the reviewed and current texts.

6. **The document has no dangling internal reference.** Property: every `FR-*`/`NF-*`/`C-*`/
   `P0-*`/`AC-*` identifier referenced in the spec either is defined in the spec or is a v1
   identifier the spec deliberately references without redefining. Standard: internal
   cross-reference correctness — the class the prior round's M2 belonged to. Verification:
   deterministic scan over 91 defined identifiers and every boundary-anchored reference;
   the 18 unresolved names are all v1 identifiers cited by §2, §3, `P0-1` or `AC-26` in the
   act of dispositioning them, which is exactly what §1's namespace rule licenses.

---

## Convergence Record

**Round number**: 2 (first Post-fix round), matching Scope and Inventory.

**Trajectory** (findings by severity, per round, from each round's mechanical verdict
breakdown):

| Round | Total | Critical | Serious | Moderate | Minor |
|---|---|---|---|---|---|
| R1 (`3edc61f`) | 20 | 2 (1 Systemic) | 7 (1 Systemic) | 8 | 3 (1 Systemic) |
| R2 (`332406c`) | **14** | **0** | **5 (1 Systemic)** | **5** | **4** |

**Flow counts for this round**, from the Step 9 provenance classifications:

- **Prior findings closed: 11** — C1, C2, S1, S2, S4, S7, M2, M3, M6, m1, m3.
- **New findings: 0.**
- **Recurring findings: 13** — S1, S2, S3, S4, S5, M2, M3, M4, M5, m1, m2, m3, m4.
- **Regressions: 1** — M1 (introduced by the fix for R1's S1).

Closure evidence per closed finding, each re-derived from current source:

| R1 finding | Closure evidence at `332406c` |
|---|---|
| **C1** — `P0-D-6`/`P0-D-8` contradiction on the corpus floor | Grep of the spec for `cold.start\|cold start` → 2 hits, both about cold *containers*/*starting per event*, neither a floor decision; §13 Read in full — only `P0-D-7` addresses the corpus floor, and `FR-A6` (spec:243–246) stands unopposed. The superseded decision is gone, not merely outvoted. |
| **C2** — identifier collision, three live mis-resolving pointers | The licensing sentence ("identifiers are shared so downstream artifacts need no translation") is deleted; §1:9–14 replaces it with an explicit namespace declaration. Each named pointer re-derived: `CLAUDE.md:19`'s `FR-M3` now resolves (§3 defers v1 `FR-M3` whole, spec:100 — the spec no longer redefines it); `collapse-log.md:379`'s `FR-A2` now resolves (spec:69, 91, 189); v1 §12's exit line names v1's own `AC-n`, which exist in v1 (`AC-1`..`AC-22`, Read). Closed against its named standard; the declaration's own inaccuracy is a separate recurring finding (S3). |
| **S1** — ROSE cost omitted | `FR-A5a`:234–236 now quotes both cost figures, string-matched verbatim. Closed; the label on them is M1. |
| **S2** — owner as incident detector | §14:444–447 replaces "without incident" with a clean `ctxoracle status`. Read; see *What's Actually Good* 4. |
| **S4** — eight defective citation ranges | Seven re-derived correct by Read at each range; see *What's Actually Good* 3. The eighth (`FR-X5`) is m3. |
| **S7** — arms deferred for want of a criterion | §2:69–74 now gives a capability reason — *"the record type each reads has no Phase 0 writer (P0-1)"*. Read; the test-set justification is gone. |
| **M2** — §2 subagent row pointed at `P0-3` | spec:65 now reads *"Phase 0 records a per-consumer key where an event carries one (FR-O6)"*. Read. |
| **M3** — `PreToolUseHookSpecificOutput` does not exist | Grep of the spec → 0 hits; §7:200–205 describes the behaviour instead. Closed; its replacement text is S1. |
| **M6** — token budget had no value | `FR-A3`:212–213 states 2,000 tokens by default, configurable; `AC-18`:502–505 reports session token overhead against it. Read. |
| **m1** — four altered quotations | Three removed or repaired: `FR-D3` (spec:270–272) and `C-3` (spec:364) no longer quote; `FR-K2` (spec:162) restores *"knowledge—which suggests"* with the em-dash, string-matched. The fourth (`FR-O3`, spec:133–134) truncates at a sentence end with terminal punctuation changed, which CMOS 17th §13.7 and §13.50 permit — not a defect. |
| **m3** — presentation defects | `FR-A6` now follows `FR-A5b` (spec:241–246), forward-references gone; §11's blank lines separate three well-formed lists rather than breaking one. Read. The timeout qualification, m3's third item, is carried in M2. |

**Tripwire evaluation — NOT FIRED.** Arithmetic shown:

- *Condition (a)* — new + regression ≥ closed, for two consecutive Post-fix rounds. This
  round: 0 + 1 = **1**; closed = **11**; 1 ≥ 11 is **false**. Only one Post-fix round exists,
  so the two-consecutive-round precondition cannot be met either way.
- *Condition (b)* — total findings not strictly decreased, for two consecutive Post-fix
  rounds. 20 → 14 is a **strict decrease**; and again, only one Post-fix round exists.

Neither condition holds. The fix cycle is converging: eleven closures against one
regression, and the closures include both Criticals and the highest-consequence Serious
items. Another fix round is the indicated path, not foundational rework.

---

## Recommended Priority

Ordered by engineering consequence, not by effort. The first three block the Phase 0
architecture; the rest block Phase 0's exit or its approval.

**Blocks the architecture — fix before any design work begins.**

1. **S2 — rewrite `P0-D-6` against v1 §12's "Phase 0's bar" paragraph and carry its three
   named terms into `FR-A5`.** This is first because it is the only finding that both
   corrects a false provenance claim *and* fills an open design question: `materiality`,
   `structural_weight` and `self_serve_cost` are the model-free decomposition the architect
   needs and the document currently asserts exists without naming. Fixing it also resolves
   §3's "unchanged" disposition for `FR-A5`.
2. **S3 — make §1's namespace declaration true.** Rename `FR-A5a`/`FR-A5b` into the `P0-*`
   namespace or amend the declaration, add their §3 rows, restore or replace the support ≥ 2
   grounding, and correct `P-*` to `P1–P9`. Do it before the architecture is written, because
   the architecture will cite these identifiers and the closure ledgers will cite the
   architecture.
3. **S1 — re-derive the §4 hooks row and §7's quotation against the downloaded
   documentation, not against a query result.** One pass over the whole row, the way the
   ROSE and `RETHINK.md` citations were done. Until it is fixed, `C-5` instructs an
   implementer who cannot find the quoted sentence to degrade to silence — which switches off
   the two genres `AC-7` and `AC-8` require.

**Blocks the exit.**

4. **S4 — add a criterion for `FR-L1` and an explicit inspection list for the other six.**
   `FR-L1` first: it records the uptake evidence that §1 gives as the reason this phase is
   built before Phase 1, and nothing currently checks it exists.
5. **M2, M3 — close the two testability gaps**: the `SessionEnd` budget and the `init`
   timeout that answers it; the missing default values in `FR-A7` and `FR-A6`.

**Blocks approval and trust.**

6. **S5 — remove the warning-priority clause** (or convert it to a flagged `[P0-D-n]`), and
   retire `AC-27` with it if it goes. It is the one item on this list that got *harder* to
   remove this round, because a criterion now depends on it; it will get harder again once
   the architecture consumes it.
7. **M1 — relabel the ROSE cost.** One sentence. It is the difference between the owner
   approving a warning channel he understands and one he does not, and the corrected reading
   is more favourable than the current text, not less.
8. **M4, M5 — record the harness injection defence in §10/§4, and make this document
   reachable** from `CLAUDE.md`'s read-list and from v1 §12.
9. **m1, m2, m3, m4** — the remainder, in any order; each is a one-clause edit.

One process note for whoever executes this: per `CLAUDE.md`, apply **all** findings, and
re-enter review as a Post-fix round whose inventory is this review's inventory plus the fix
diff plus these fourteen findings as closure items. Two of this round's findings (S1's
quotation, M1's label) were *introduced by* round 1's fixes, so the next pass should check
the edits themselves, not only the sites they were meant to repair.

---

Verdict: NEEDS FIXES (14 findings: 1 Serious-Systemic, 4 Serious, 5 Moderate, 4 Minor)
