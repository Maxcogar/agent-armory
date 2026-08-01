# Expert Review — Phase 0 spec (`docs/specs/spec-context-oracle-phase0.md`)

**Date**: 2026-08-01 · **Round**: 4 (Post-fix review)
**Artifact pinned at commit**: `014bc26` (`context-oracle: rebuild the Phase 0 spec against
round-3 review findings`), 835 lines. Confirmed unchanged at session HEAD `2dfbc45`
(`git diff --stat 014bc26 -- <spec path>` → empty).
**Prior review of record**: `docs/reviews/2026-08-01-round-3-expert-review-phase0-spec.md`,
pinned at `93de2c2`, verdict NEEDS FIXES (7 findings).
**Fix-diff**: `93de2c2..014bc26` (1 commit touching the spec; 1,182 changed lines in it).
**Reviewer**: independent; did not author the document or the fixes.

---

## Scope and Inventory

### Round number

Round 4. Round 1 was the first expert review of this artifact; rounds 2 and 3 were the
first and second Post-fix reviews; this is the third, so the counter increments to 4.

### Inventory (Step 2 — Post-fix rule: the prior review's full inventory, plus every file in the fix-diff, plus the fix-diff files' dependents, plus the prior review's findings as closure items)

**Source 1 — the prior review's full inventory.**

- [x] `middleware/context-oracle/docs/specs/spec-context-oracle-phase0.md` — **Read in
  full** at `014bc26` (835 lines), plus targeted re-Reads at the drafting of each finding
  (`74–91`, `97–109`, `141–146`, `166–171`, `252–256`, `426–431`, `479–487`, `541–557`).
- [x] `middleware/context-oracle/RETHINK.md` — **Read** at `126–141`, `175–182`,
  `186–200`, `282–299`, `391–399`; and **Grep-verified** by a deterministic re-derivation
  of all **25** `RETHINK.md:` line citations in the spec, each range printed from
  `RETHINK.md` and compared against the claim it supports (table below).
- [x] `middleware/context-oracle/docs/specs/spec-context-oracle.md` (v1, 1,099 lines) —
  **Read** at `98–116`, `153–160`, `313–390`, `416–424`, `460–491`, `504–530`, `538–590`,
  `634–668`, `740–752`, `806–812`, `852–875`, `895–901`, `1045–1060`; and
  **Grep-verified** by two deterministic scans: 65 requirement definitions extracted and
  partitioned against §3's three buckets, and the **full body text of all 27
  declared-unchanged requirements** printed side by side against the Phase 0 text.
- [x] `middleware/context-oracle/CLAUDE.md` — **Read in full** (current contents in
  session context); **Grep-verified** for the read-list and information-policy rows
  naming this spec.
- [x] `middleware/context-oracle/docs/collapse-log.md` (604 lines) — **Read** at `1–40`;
  the 54 lines added after the fix-diff (`014bc26..2dfbc45`) **Read in full** via
  `git diff`. Its 2026-08-01 round-3 entries are the named standard for Systemic 1.
- [x] **Claude Code hooks documentation** (`code.claude.com/docs/en/hooks.md`) — primary
  source **downloaded raw** 2026-08-01, **242,078 bytes / 3,173 lines** (byte-identical
  to the size §4 claims); **Read** at `16–26`, `154`, `343`, `632`, `855–885`,
  `1540–1590`, `1613–1615`, `2048`, `2186–2196`, `2262–2277`, `2288–2308`, `2693`, `963`;
  **Grep-verified** for `SubagentStart` (20), `StopFailure` (16), `last_assistant_message`
  (10), `1.5-second` (1), `agent_id` (6), `stop_hook_active` (6), `additionalContext` (35).
- [x] **Zimmermann, Weißgerber, Diehl & Zeller, "Mining Version Histories to Guide
  Software Changes," IEEE TSE 31(6), 2005** — PDF re-fetched from
  `thomas-zimmermann.com/publications/files/zimmermann-tse-2005.pdf` (1,948,399 bytes);
  **17 pages** confirmed by `pypdf`; masthead confirmed (`IEEE TRANSACTIONS ON SOFTWARE
  ENGINEERING` / `VOL. 31` / `JUNE 2005`, 9 occurrences each); text extracted **twice, by
  two independent engines** (`pypdf` → 68,681 chars; `pdfminer.six` → 69,435 chars), per
  the instrument correction round 3 recorded.

**Source 2 — every file in the fix-diff (`93de2c2..014bc26`).**

- [x] `docs/specs/spec-context-oracle-phase0.md` — as above.
- [x] `docs/reviews/2026-08-01-round-3-expert-review-phase0-spec.md` — **Read in full**
  (734 lines). The prior review of record and the closure baseline. Every claim in it is
  treated as a prior-document claim and re-derived from source per Step 6; **no finding
  below is imported from it.**
- [x] `docs/reviews/2026-08-01-collapse-hunt-phase0-spec-rebuild-2.md` (1,142 lines) —
  **Read** at `1–70`. Added by the diff, so the post-fix rule puts it in the inventory.
  Its Q1 (that `last_assistant_message` exists and falsifies P0-3's old premise) was
  useful as a *pointer* only and was re-derived independently against the raw download —
  see *What's Actually Good* 4.

**Source 3 — the fix-diff files' dependents.** No code exists for this project, so
`codegraph_get_dependents` has no referent. Document-level dependents were enumerated by
grep and verified:

- [x] `CLAUDE.md` — grep for the spec path → present at read-list item 3 and as an
  information-policy row. Untouched by the fix-diff; no re-routing needed.
- [x] `docs/specs/spec-context-oracle.md` — `git diff --stat 93de2c2..014bc26` over that
  path → **empty**; grep of v1 for `phase0` → **0 hits**. The owner's declination
  recorded in round 3 still holds.
- [x] `docs/collapse-log.md`, `docs/STATUS.md` — both untouched by the fix-diff and both
  updated in the immediately following commit `2dfbc45`, which is why `CLAUDE.md`'s
  session-end obligations are met rather than skipped. Verified by
  `git diff --stat 014bc26..2dfbc45`.

**Source 4 — the prior review's 7 findings as closure items.** Each re-derived from
current source; per-finding closure evidence is in the Convergence Record.

- [x] S1 · [x] S2 · [x] M1 · [x] M2 · [x] M3 · [x] M4 · [x] m1

### Step 3 — tool plan

| Claim type in this review | Instrument | Available |
|---|---|---|
| Literal-content (spec / RETHINK / v1 line ranges) | Read at file:line, at drafting time | yes |
| Absence ("no source states X", "no requirement mandates Y") | Grep for the signature **plus** Read of the region — the collapse log's standing rule is *search locates, reading verifies* | yes |
| Library/harness-behaviour (Claude Code hooks contract) | Raw primary-source download (242,078 bytes) + Read + Grep. Context7 deliberately **not** used: round 2 established that a summarising query produced that round's worst finding | yes |
| External-source (ROSE quotations and figures) | PDF fetch + **two** independent text extractions + normalised string match | yes |
| Cross-document consistency (v1 disposition, source inheritance, coverage, reference resolution) | Deterministic scripts over both specs, counts reported | yes |
| Quotation integrity | Deterministic scan of every quoted span ≥ 25 chars, with inline-code spans masked so `"resume"`-style tokens do not break quote pairing, against five normalised sources | yes |
| Cross-reference *support* (does AC-n test what the citing sentence needs?) | Deterministic extraction of §14's criteria at **both** commits + per-site Read | yes |
| Structural / blast-radius | CodeGraph | **unavailable** — no load-bearing claim here is structural (the artifact is a document; no code exists), so not a halt condition per Step 3 |
| Structured reasoning (`metacognitivemonitoring`, `collaborativereasoning`) | Clear Thought MCP | **unavailable in this session** — tool search returned no matching tools. Both mandatory passes performed manually with the same framing; recorded as Observation 1 |

**Instrument note added this round.** The naive quote-pair scan round 3 used produces
false failures on this document because §4 now contains many inline-code string literals
(`"resume"`, `"compact"`, `"defer"`), whose quote characters mis-pair the surrounding
prose quotations. Masking inline-code spans before pairing took the scan from 36 spurious
failures to 2 genuine ones, both of which resolved as legitimate CMOS ellipsis elisions.
Recorded because an unmasked scan would have generated 36 wrong findings.

**Rigor waivers**: none. No step was compressed and the dispatch requested none.

---

## Summary

**This review returns NEEDS FIXES.** The round-3 fixes did the hardest thing right: the
collapse hunt's heaviest finding is genuinely closed — P0-3 no longer claims Phase 0
cannot recognise a completion claim, because `last_assistant_message` is on the `Stop`
hook's own input and the document now says so and tests it (AC-12). All twelve
hook-contract quotations, all eight ROSE quotations and all thirty-six quoted spans in
the document verify verbatim against primary source. §3's partition over v1's 65
requirements is arithmetically exact, requirement-to-criterion coverage is 50 of 50, no
identifier is minted, and every stated number carries a source. What has not changed is
the generator the collapse log named three rounds running and this document's own commit
recorded a fourth time: **a device that asserts a property of the whole document is
written once, checked along the axis that is cheap, and never re-checked along the axis
it actually asserts.** Twelve such devices exist in this spec; seven of them are false.
§3 now explicitly attests that every "unchanged" row was diffed against v1's text *and
against §13's decision records* — and FR-D3 is listed unchanged while P0-D-24 states the
change, which is precisely the check §3 claims to have run. Separately and more
mechanically, this round renumbered twenty-one acceptance criteria and did not re-derive
the body clauses that cite them: four cross-references at three sites now point at
criteria that test something else, all four correct before the renumbering and wrong
after. Beneath those, §2's replacement narrowing criterion is falsified by the first row
of its own table, §4's source-inheritance attestation is still false by one source, C-5
attests that no requirement depends on a harness timeout value while C-2 and C-4 exist
only because one does, and one hook-contract fact is stated more absolutely than the
source it attests to matching.

---

## Upstream Contract Verification

The upstream contracts for a spec on this project are `RETHINK.md` §12 and its addenda
(the owner's locked decisions, declared "above this document" at spec:16–17), `CLAUDE.md`,
the standing lessons in `docs/collapse-log.md`, and the v1 spec whose requirements §3
dispositions. Verification method recorded per item.

### `RETHINK.md` §12 + addenda — the owner's locked decisions (highest authority)

| Decision | Status | Verification |
|---|---|---|
| 1. Name `ctxoracle` | honored | Read spec:3, 564–569 |
| 2. Model in the loop | honored (deferred with a stated reason) | Read spec:62; §3 defers FR-J1–FR-J5 whole (spec:137–138) |
| 3. No hard blocks, anywhere | honored | Read spec:233–235 (FR-O4), 426–431 (FR-D3), 724–727 (AC-5); RETHINK:314–323 Read |
| 4. Sandbox compatibility | honored | Read spec:533–540 (C-1) + P0-D-13 (spec:628–632); AC-32 Read |
| 6. Two stores, outside the tree | honored | Read spec:282–283 (FR-K8); RETHINK:330–334 Read |
| 7. No separate credentials | honored (vacuously — no model call) | Read spec:443, 571 |
| 8. Subagent delivery in v1 | honored, correctly pointed | Read spec:70 (§2 row names FR-O6) vs spec:244–248 (FR-O6) and 617–620 (P0-D-10) |
| 10. Self-observability required | honored, and honored by §14's gate | Read spec:500–516 vs spec:699–705; RETHINK:350–354 Read |
| 11. Agent-led; owner is a non-programmer | honored | Read spec:42–45; RETHINK:355–359 Read |
| 12. Speak at a completion claim, bounded to one | **honored, and now with the discrimination the ruling was about** | Read spec:395–412 (P0-3) against hooks.md:632, 2194–2196 (Read) and RETHINK:363–399 (Read). See *What's Actually Good* 4 |

Decisions 5 and 9 are superseded / deferred and correctly so (5 by 8; 9 to Phase 1 via §3,
spec:137–138).

### `CLAUDE.md` — lifecycle, information policy, engineering standard

| Clause | Status | Verification |
|---|---|---|
| Lifecycle: spec → architecture → plan → build; architecture is per phase | honored — correct stage, and it cites no architecture decisions | grep `architecture` over the spec → **0 hits**; the one `[D-n]` citation is `v1 [D-15]`, a v1 §11 spec judgment (v1:348, Read), which `CLAUDE.md` sanctions |
| "Only `STATUS.md` states what to do next" | honored | grep `next step\|roadmap\|we will\|to do next\|todo` over the spec → **0 hits** |
| "Every non-trivial new requirement carries a source annotation… Numbers without sources don't go in" | honored for every stated number | Numeric scan over §§5–14 extracted every value with a unit (11 distinct) and each traced to a source; the 15% tangled-fix figure traces to v1's `[HERZIG-13]` row (v1:107, Read) → **0 unsourced** |
| "External facts… verified against current primary sources before you build on them" | **violated once** | 36/36 quotations verbatim, but §4's `additionalContext` independence claim is unquoted synthesis contradicted by hooks.md:1553 — see M4 |
| "Keep documents in sync" | honored, with one owner-declined element | `CLAUDE.md` routes to this spec (Read); the v1-side pointer was declined by the owner and remains declined (`git diff --stat` over the v1 path → empty) |
| "When a review surfaces findings, apply **all** of them" | **3 of 7 closed; 4 recurring** | See Convergence Record |

### `docs/collapse-log.md` — standing lessons

| Standing lesson | Status | Verification |
|---|---|---|
| "No ranking claim about this tool's purposes, genres, triggers or moments enters any document unless the owner stated it in those words" (2026-08-01 #1) | **honored** | The FR-A3 warning-priority clause is deleted; Read spec:336–341 and P0-D-15 (spec:635–643); grep of the spec for `priority`/`precedence` → 3 hits, all denials |
| "When the argument for excluding something is that it isn't worth saying, that is a bar argument, never a scope argument" (#2) | honored | Read spec:60–72 — every arm's reason is capability-based |
| "Before recording that something was missing, read the file you are about to say it was missing from" (#3) | honored | P0-D-4 now credits v1 `[D-10]` with its derivation (spec:587–593 vs v1:808–811, both Read) — prior M4 closed |
| "The spec does not cite numbered architecture decisions as authority" (#4) | honored | grep `architecture` over the spec → 0 hits |
| "A new document needs a written precedence rule before its first sentence" (#5) | honored | Read spec:5–17 |
| "'Every X is Y' under a table is an attestation… treat one as a defect on sight" (`collapse-log.md:562–566`, Read) | **violated, seven times** | 12 devices located and each independently checked; 7 fail — see Systemic 1 |
| "Treat any newly-added summary, table, partition or namespace rule as the *first* thing the next round verifies" (round-3 entry, collapse-log:22–35) | **violated by the same document that inherited it** | §3's new attestation sentence (spec:100–103), §2's new criterion sentence (spec:74–76) and FR-K1's new "in full" claim (spec:252–253) all fail — see S1, M1, m1 |
| "For every whole-document attestation, write down the check that would *falsify* the substantive claim and run that one" (round-3 entry, added after the fix-diff) | **violated** | Same seven devices. This is the fourth consecutive round in which the device installed to close a finding is a finding — see Systemic 1 |

### v1 spec — the requirement identifiers and their meanings (spec:153)

| Obligation | Status | Verification |
|---|---|---|
| §3 dispositions every v1 `FR-*`/`NF-*`/`C-*` requirement exactly once | **honored** | Deterministic scan: 65 identifiers in v1 (0 duplicate definitions); §3's buckets 27 + 21 + 17 = 65; **0 overlaps, 0 in a bucket but absent from v1, 0 in v1 but absent from every bucket** |
| §1: "this document does not mint new ones in those namespaces" | **honored** | Same scan: 44 `FR-*`/`NF-*`/`C-*` definitions in this spec, **0 absent from v1** |
| The disposition each requirement is given is **correct** | **violated (8 of 27 rows)** | Full body-text comparison across all 27 declared-unchanged rows — see S1 |
| §3: "Each retains v1's grounding, including the sources §4 carries forward for that purpose" | **violated (1 source)** | Per-requirement source-tag extraction across the 27 unchanged rows vs §4's table — see M2 |
| "Deferred whole… Each is the subject of a §2 row; none is dropped from v1" | **honored** | All 17 deferred identifiers Read in v1 and mapped to a §2 out-of-scope row |
| Every internal identifier reference resolves | **honored** | Scan of 75 defined identifiers against every boundary-anchored reference: **0 dangling**; the 19 unresolved names are v1 identifiers referenced by §2/§3/P0-1 in the act of dispositioning them. *Resolution is not support* — see S2 |

---

## Critical & Serious Findings

**No Critical findings** — the full inventory was Read or Grep-verified per Compliance
Gate B, and no violation of Critical classification was observed.

---

### S1 — §3's "in force unchanged" disposition is false for eight of its twenty-seven rows, and §3 now attests that the check which would have caught them was run · **Serious · Systemic · recurring**

**What the spec does now.** §3 (spec:99–103) states: *"The v1 spec carries 65
`FR-*`/`NF-*`/`C-*` requirements. Each has exactly one Phase 0 disposition below. **Two
separate claims are made here and both were checked**: that the three sets partition v1's
65 exactly once, and that each row's disposition is the right one — **the second by
diffing every "unchanged" row against v1's text and against §13's decision records**."* It
then lists 27 requirements as *"In force in Phase 0, unchanged"* (spec:105–109).

**How that claim was verified — proactive scan across the full inventory scope.** A
deterministic script extracted the full body text of every `FR-*`/`NF-*`/`C-*` definition
from both spec files at `014bc26` and printed v1's text against the Phase 0 text for all
27 declared-unchanged rows. Every divergence below was then confirmed by Read of both
files at the cited lines at drafting time. §3's *coverage* claim is correct and is
credited separately (*What's Actually Good* 2) — this finding is about the *disposition*
column, a different assertion by the same table.

**Tier 1 — unarguable: the document contradicts itself, or applies its own criterion inconsistently.**

| Requirement | v1 text (Read) | Phase 0 text (Read) | Why "unchanged" is false |
|---|---|---|---|
| **FR-D3** | *"…and an explicit false-fire clause **inviting correction in narration**"*, with the worked example *"proceed, and say so in your narration so the oracle learns"* (v1:474–486) | *"a **declarative** false-fire clause — a statement that the warning may be wrong… **not an instruction to the agent**"*; *"Its receiver in Phase 0 is the CLI (§12)"* (spec:426–431) | **P0-D-24** (spec:687–691): *"FR-D3's false-fire clause is declarative and its Phase 0 receiver is the CLI. **An imperative invitation would violate FR-D2**…"* §13 states the change §3 denies — the exact comparison §3 attests to having run |
| **FR-X5** | *"no network access **beyond the §6.2 model call**. **It never mutates the repo** (P2, P8)"* (v1:642–645) | *"— Phase 0 having no model call — no network access **at all**. **The single write exception is `init`'s harness settings file**"* (spec:483–487) | Two changes: a network tightening and a write exception added to a clause v1 states absolutely. §3 buckets **FR-X7 as narrowed** for the identical network tightening (spec:132) and **FR-X1 as narrowed** for the identical no-model-call clause removal (spec:129) |
| **FR-X3** | *"is **never quoted into a whisper or a judgment prompt**; it is referenced by pointer only"* (v1:634–636) | *"is referenced by pointer only, never quoted"* (spec:479–480) — the judgment-prompt clause removed | Same no-model-call removal that §3 records as a **narrowing** for FR-X1: *"v1 also scans model-call prompts; Phase 0 makes none, so that clause is removed"* (spec:129) |

**Tier 2 — normative clauses dropped or added with no record anywhere.**

| Requirement | What changed | Consequence |
|---|---|---|
| **FR-M4** | v1 (`v1:588–590`, Read) has two clauses: *"Diagnostics never touch agent context and never leave the machine; **a broken oracle degrades to silence in the agent's session (FR-O3) while saying exactly what broke on its own channel**."* Phase 0 (spec:517) keeps only the first. | The obligation to say *what* broke on the oracle's own channel is now in force nowhere as a requirement; FR-M2 obliges detection, not the statement. |
| **FR-O3** | v1 (`v1:313–319`, Read): *"hard ceiling 3 s, after which the event resolves to silence **(the candidate may carry to the next event)**."* Phase 0 (spec:228–232) drops the carry clause; grep of the spec for `carry to the next` → **0 hits**. | Whether a timed-out candidate survives to the next event is a behaviour an architect must design; it is now unspecified. |
| **FR-O4a** | v1 (`v1:323–327`, Read): *"**It never prevents a turn from ending.**"* Phase 0 (spec:236–240) drops it. | The one clause that distinguishes a continuation from a block is gone from the requirement that governs continuations. FR-O4 covers deny paths, not turn-ending. |
| **FR-A4** | v1 (`v1:420–424`, Read) has no resume/compaction clause. Phase 0 (spec:342–347) adds *"The delivered-set this rests on is reseeded on resume and the read set cleared on compaction."* | §3 buckets **FR-O1 as narrowed** (spec:115) for exactly this addition — *"`SessionStart`'s `source` field is given a job"*. The same addition to FR-A4 is bucketed unchanged. |
| **NF-2** | v1 (`v1:666–667`, Read) is one sentence. Phase 0 (spec:527–529) adds *"On a resumed session the figure includes the harness's replay of prior injections."* | Same class as FR-A4: an added measurement obligation under an "unchanged" label. |

**Which standard it violates.** §3's own stated purpose and its own stated method, quoted
above — a reader who trusts the "unchanged" column is misled in exactly the way §3
promises to prevent, and §3 now additionally asserts that the check which would have
caught FR-D3 was performed. Secondarily ISO/IEC/IEEE 29148 *consistent*: a specification
must not assert two incompatible things about the same requirement, which FR-D3 does
across §3 and §13, and must not apply one classification criterion inconsistently, which
FR-X3 and FR-X5 do against FR-X1 and FR-X7. Tertiarily, the collapse log's round-3 entry,
written by the same session that produced this fix: *"For every whole-document
attestation, write down the check that would falsify the substantive claim and run that
one"* (`collapse-log.md`, added at `2dfbc45`, Read).

**Why it matters, specifically.** §3 is the only place that tells the architect what is in
force. One who reads "FR-D3 — unchanged" designs a narration-based correction channel and
discovers at build time that the receiver is the CLI and the clause must not be
imperative. One who reads "FR-X5 — unchanged" designs against *"it never mutates the
repo"* and has no place for `init`'s settings write, which C-4 requires. One who reads
"FR-O4a — unchanged" has no requirement stating that a continuation never prevents a turn
from ending — the property `[OWNER-12]` was conditioned on. The round-3 finding of the
same shape named eight rows; those eight were moved and the remaining column was not
re-derived, which is the identical failure at one remove.

**What correct looks like.** Do not move eight more rows. Run the check as a mechanical
step whose output is recorded, and let the buckets fall out of it: for each of v1's 65
requirements, print v1's body text against Phase 0's, diff them, and for each non-empty
diff either restore v1's text or place the row in the narrowed table with the narrowing
and its location named — the format the existing 21 rows already use, e.g.
`| FR-D3 — warning subtype | v1's narration-invited correction becomes a declarative clause received through the CLI | §9, §12, P0-D-24 |`.
For FR-X3 and FR-X5, apply the criterion §3 already states for FR-X1: a clause removed
because Phase 0 makes no model call is a narrowing. For FR-M4, FR-O3 and FR-O4a, either
restore v1's dropped clause into the Phase 0 requirement text or record its removal as a
narrowing with a reason. Then replace §3's attestation sentence with the method and its
result — *"Every unchanged row was diffed against v1's body text on <date>; the diff is
empty for all 27"* — so the claim is one a later round can re-run rather than re-assess.

---

### S2 — this round renumbered twenty-one acceptance criteria and did not re-derive the body clauses citing them; four cross-references at three sites now point at criteria that test something else · **Serious · Systemic · regression**

**What the spec does now.** §14's criteria were renumbered between `93de2c2` and
`014bc26` — AC-12 through AC-32 all shifted as AC-12 (completion-claim recognition) was
inserted and AC-30/AC-31 were added. Four references in §§2–9 were left pointing at their
old numbers.

**How that claim was verified.** A deterministic script extracted every
`- **AC-n (topic → traces)**` heading from §14 at **both** commits (`93de2c2` retrieved
via `git show`), printed the id-to-topic mapping for each, and diffed them; then extracted
every `AC-n` reference occurring **outside** §14 and printed the citing line beside what
AC-n tests today. Thirteen body references were checked; nine are correct. Each of the
four failures was then confirmed by Read at drafting time (spec:88–91, spec:141–146,
spec:426–431) and by Read of the current and prior §14 headings.

| Site (Read) | Reference | What the citing sentence needs the criterion to test | AC-n at `93de2c2` | AC-n at `014bc26` | Correct id now |
|---|---|---|---|---|---|
| spec:91 | `AC-27` | that the landmine schema holds no records after a session with no CLI entry | *empty-by-design schemas → P0-1, FR-K3, FR-X6* ✓ | *mining hygiene → FR-K2, NF-3* ✗ | **AC-30** |
| spec:91 | `AC-21` | that an owner-entered landmine is read back by orientation | *human facts, written and read → FR-L6, FR-K6, FR-K4* ✓ | *zero ceremony → v1 P3, NF-2* ✗ | **AC-22** |
| spec:145 | `AC-20` | that v1's P3 (zero ceremony) is carried as a criterion | *zero ceremony → v1 P3, NF-2* ✓ | *measurements → P0-4, NF-2* ✗ | **AC-21** |
| spec:429 | `AC-26` | that the declarative false-fire clause contains no imperative construction | *informative, never imperative → FR-D2* ✓ | *resume and compaction → FR-O1, FR-A4, NF-2, P0-D-20* ✗ | **AC-31** (and AC-7) |

Every one of the four was **correct before the fix-diff and wrong after it**. The
round-3 review's reference-resolution scan — which this round's inventory inherits —
would not have caught them: all four identifiers resolve to a defined criterion. What
changed is which criterion, and resolution is not support.

**Which standard it violates.** ISO/IEC/IEEE 29148 §5.2.8 requirements-to-verification
traceability: a traceability reference must resolve to the verification item that
verifies the referenced property, not merely to *a* verification item. Secondarily
29148 *consistent* — spec:429 states, inside FR-D3's normative text, that a property
holds by reference to a criterion that does not test it, so a reviewer checking FR-D3
against AC-26 finds an unrelated criterion and cannot tell whether the claim is wrong or
the pointer is.

**Why it matters, specifically.** §14's whole value to the downstream architecture and
plan is that every requirement traces to a criterion and every criterion back to a
requirement — the property round 3 credited at 50 of 50, and the property v1 §14 lists as
a Phase-0-exit blocker for the v1 spec (`v1:1057–1060`, Read). Traceability that is
correct in one direction and silently broken in the other is worse than absent, because
each downstream document will re-cite these numbers. The generator is mechanical and so
is the guard: an id renumbering invalidates every reference to those ids, and the
document has thirteen.

**What correct looks like.** Apply the four corrections in the table. Then add the check
to the document's own maintenance: any edit that inserts, removes or reorders a `§14`
criterion is followed by re-running the body-reference audit — extract every `AC-n`
occurring outside §14 and confirm the criterion it names still tests the property the
citing sentence asserts. The scan is fifteen lines of script and its output is a table
like the one above; the reproducible form is the point, because the round-3 review's
resolution-only scan reported 0 dangling references over a document that already had
four unsupported ones waiting for a renumber.

---

## Systemic Patterns

Two patterns, each cross-listed from the findings above with its scan.

### Systemic 1 — attestation devices are falsified by the contents they describe (7 of 12)

**Proactive scan across the full inventory scope.** Attestation constructions were
located by
`grep -nE "Each (has|retains|is)|No source outside|does not mint|each string-matched|in full|both were checked|The criterion this table applies|No requirement here depends|Nothing else|and nothing else|never a|every (one|row|arm)"`
over the spec → **17 matching lines**, plus a full Read of §§1–4 and §§11–12, yielding
**12 distinct whole-document or whole-section attestation devices**. Each was then checked by
a deterministic scan or a per-item Read against the thing it asserts:

| # | Attestation | Location | Result |
|---|---|---|---|
| 1 | "this document does not mint new ones in those namespaces" | spec:9–10 | **holds** (set difference over 44 vs 65 → 0 minted) |
| 2 | "The criterion this table applies is whether §7's content column still carries the arm" | spec:74–76 | **fails** — row 1 (M1) |
| 3 | "Each has exactly one Phase 0 disposition" — *coverage* | spec:99–100 | **holds** (27+21+17 = 65; 0 overlap, 0 orphan either direction) |
| 4 | "each row's disposition is the right one — …by diffing every 'unchanged' row against v1's text and against §13's decision records" | spec:100–103 | **fails** — 8 of 27 rows (S1) |
| 5 | "Each retains v1's grounding, including the sources §4 carries forward for that purpose" | spec:108–109 | **fails** — `[CACM-18]` (M2) |
| 6 | "Each is the subject of a §2 row; none is dropped from v1" | spec:139 | **holds** (all 17 deferred ids Read in v1 and mapped to a §2 row) |
| 7 | "No source outside this table is cited by this document… and the sources that grounding needs are listed above for that reason" | spec:166–168 | **fails** — second sentence (M2) |
| 8 | "Hook contract facts this document depends on, **each string-matched** against the downloaded reference" | spec:170–171 | **fails** — the `additionalContext` independence claim is unquoted synthesis contradicted by the source (M4) |
| 9 | FR-K1's content is "`RETHINK.md` §4's Tier 2 list (`:130–134`) **in full**" | spec:252–253 | **fails** — "build" dropped (m1) |
| 10 | C-5's "No requirement here depends on a harness timeout value or on the numeric continuation cap" | spec:554–556 | **fails** — C-2, C-4, AC-6, AC-25 (M3) |
| 11 | §12's "**Nothing else.** Phase 0 opens no network connection (FR-X5)" | spec:571 | **holds** (§12's provided list checked against every CLI surface §§6, 9, 11, 14 require) |
| 12 | "Orientation's landmine arm is **retained** in §7 and is therefore not in the table above" | spec:88–91 | **holds** on the content claim (§7's orientation row Read at spec:305); its two AC citations are stale (S2) |

**Standard.** The collapse log's standing instruction (`collapse-log.md:562–566`, Read) —
*"A table is not a summary — every cell is a claim. "Every X is Y" under a table is an
attestation, and the standing instruction is to treat one as a defect on sight. The
falsifiable column is the one that gets dropped."* — raised by the round-3 entry
(`collapse-log.md:44–54`, Read via `git diff 014bc26..2dfbc45`) to a
named generator with a named remedy: *"Three rounds running, the device installed to close
a finding became the next round's heaviest finding… Each was re-checked along the axis
that is cheap — arithmetic, set membership, row presence — and not along the axis it
asserts. Class: **wrong-check**. For every whole-document attestation, write down the
check that would falsify the substantive claim and run that one."*

**Why systemic rather than seven slips.** Seven of twelve fail, and they fail the same
way. The five that hold are precisely the five whose only axis is mechanical — set
difference, arithmetic partition, id-to-row mapping, a list of CLI surfaces, the presence
of a clause in a table cell. Every device with a substantive axis fails on that axis while
passing its mechanical proxy: §3's partition is exact and its dispositions are wrong;
§4's source table is bibliographically complete for the rows it lists and its inheritance
sentence is false; FR-K1's list is right in nine of ten items and attests to ten; C-5's
sentence is checkable in one command and was never run against C-2. This is the fourth
consecutive round in which the device written to close the previous round's finding is
this round's finding, and the remedy the project itself wrote down after round 3 was not
applied to the round-3 fixes.

**What correct looks like.** For every device in the table above, write the falsifying
check as a command, run it, and record its output next to the attestation — or delete the
attestation. §3 and §4 already show the two acceptable shapes: "27 + 21 + 17 = 65, 0
overlap" is a recorded result and it holds; "both were checked" is a claim about a check
and it does not.

### Systemic 2 — an id renumbering whose dependent references were not re-derived

Four references, three sites, one edit — enumerated with per-site evidence in **S2**. The
scan: every `AC-n` reference outside §14 extracted (**13**), each printed against §14's
current heading and against §14's heading at `93de2c2`; **4 mismatches**, all four
correct before the fix-diff. Standard: ISO/IEC/IEEE 29148 §5.2.8. This is systemic rather
than three slips because the generator is a single structural edit whose blast radius was
never enumerated, and because the guard that would catch it — resolution scanning — was
run and reported clean, which is what let it through.

**Scans run that returned nothing systemic**, with queries and result counts:

- Quotation integrity: every quoted span ≥ 25 chars extracted by quote-pair matching over
  the document with inline-code spans masked (**36 spans**) and string-matched against
  five normalised sources → **36/36 verbatim**; the two apparent failures are the same
  elided v1 FR-J3 quotation at spec:313 and spec:649, whose two fragments
  (*"structural entry points"*, *"no model intent inference"*) were each confirmed present
  in v1 (`v1:504–506`, Read) — a CMOS 17th §13.50 ellipsis, not a defect.
- `RETHINK.md` citation re-derivation: **all 25** `RETHINK.md:` ranges Read in
  `RETHINK.md` at drafting time → **24 correct**; the one residual (`C-3`) is isolated and
  appears below as m2, not a pattern.
- Requirement-to-criterion coverage, boundary-anchored, over all 50 defined requirements →
  **0 uncovered**.
- Internal cross-reference *resolution*: 75 defined identifiers vs every boundary-anchored
  reference → **0 dangling** (support is a separate question — S2).
- Identifier minting: 44 `FR-*`/`NF-*`/`C-*` definitions in this spec vs v1's 65 → **0
  minted**; 0 duplicate definitions in either file.
- `grep -nE "architecture|next step|roadmap|to do next|todo"` over the spec → **0 hits**.
- Numeric-source audit: every value with a unit in §§5–14 extracted (11 distinct: 1.5 s,
  3 s, 2,000 tokens, 400 tokens, 30 entities, 3 sessions, 10%, 15%, 3%, 6%, ~1–2 s) plus
  the unitless thresholds (support 3 / 2, confidence 0.9, 200 / 20 transactions, 3
  stop-grade whispers, 600/60/30 s handler timeouts) → **0 unsourced**.

---

## Moderate & Minor Findings

### M1 — §2's replacement narrowing criterion is falsified by the first row of its own table · **Moderate · recurring**

§2 (spec:74–76) states: *"**Genre arms narrower here than in v1 FR-A2.** The criterion
this table applies is whether §7's content column still carries the arm — not whether a
record type has a writer, which does not distinguish the cases."* The table's first row
(spec:80) is *"Orientation's entry-point arm | Narrowed to v1's own model-free
formulation — *structural* entry points, not entry points inferred for the task."*
Verified by Read of spec:74–91 and of §7's orientation row (spec:305), which reads
*"2–4 **structural** entry points whose indexed names lexically match the prompt, plus
any promoted landmine matching the task shape; ≤ 400 tokens"* — §7's content column **does
still carry** the entry-point arm, so the stated criterion excludes a row the table
contains. Standard: ISO/IEC/IEEE 29148 *consistent* — a table that states its
classification criterion and then contains a case the criterion excludes cannot be
audited, which is the function §2's arm table exists to serve. This is the round-3 M2
defect at the same location against the same standard: the criterion was replaced and the
replacement was not applied to the table it heads. Note the classification is right — the
entry-point arm *is* narrower — it is the criterion that cannot produce it. Fix: state the
criterion as the disjunction actually in use — an arm is listed when §7's content column
drops it **or** narrows its formulation — and, since row 5 (consequence's
historical-breakage arm) is listed on a third ground (no defined floor), say so: the table
lists every arm that is narrower for any reason, and each row's reason column gives that
row's reason.

### M2 — §4's source-inheritance attestation is still false: `[CACM-18]` grounds a requirement §3 carries "in force unchanged" and is absent from the table · **Moderate · recurring**

§4 (spec:166–168) closes the source table: *"**No source outside this table is cited by
this document.** Requirements carried in force unchanged from v1 retain v1's grounding,
and **the sources that grounding needs are listed above for that reason**."* §3 repeats
the second half at spec:108–109. Verified by a deterministic scan that extracted every
`[TAG]` citation from the v1 body text of all 27 declared-unchanged requirements and
differenced it against the tags present anywhere in the Phase 0 spec: one genuine gap
remains — **`[CACM-18]`** (Sadowski et al., *"Lessons from Building Static Analysis Tools
at Google,"* CACM 61(4), 2018; v1's source table at `v1:98`, Read), which grounds v1
FR-D3's false-fire clause at `v1:486` (Read) and appears **0 times** in this spec (grep
for `CACM-18|TRICORDER-15|CB-16|INFER-19` over the spec → **0 hits**). `[HOOKS]`, the only
other tag in the difference, is the same source as §4's "Claude Code hooks documentation"
row under a different label and is not a gap. Standard: ISO/IEC/IEEE 29148 *consistent*,
and `CLAUDE.md` — *"Every non-trivial new requirement carries a source annotation."* The
attestation and the disposition cannot both be true: either FR-D3 carries v1's grounding
forward and §4's second sentence is false, or it does not and FR-D3's false-fire clause is
stated with no source. The round-3 remedy offered two paths — narrow the sentence, **or**
restore the missing rows — and the fix took both and then re-added a completeness clause,
restoring the falsifiable attestation the narrowing was meant to remove. Fix: restore the
`[CACM-18]` row (its Phase 0 relevance survives — the routed-correction design is what
`ctxoracle`'s CLI false-fire command implements), **or** drop the second half of the
sentence, leaving *"No source outside this table is cited by this document. Requirements
carried in force unchanged from v1 retain v1's grounding, including sources not listed
here."*

### M3 — C-5 attests that no requirement depends on a harness timeout value; C-2 and C-4 exist only because one does · **Moderate · new**

`C-5` (spec:554–556): *"The hooks contract is version-bound. Implementation re-verifies
it, and shims degrade to silence on any drift they detect. **No requirement here depends
on a harness timeout value** or on the numeric continuation cap."* Verified by Read of
`C-2` (spec:541–546): *"**Because `SessionEnd` hooks share a 1.5-second budget by default
(§4), below FR-O3's ceiling**, `ctxoracle init` writes an explicit `SessionEnd` `timeout`
into the harness settings file — as a settings-file hook, not a plugin hook, because
plugin timeouts do not raise the budget."*; of `C-4` (spec:550–553), which makes writing
that timeout part of `init`'s minimal contract; of `AC-6` (spec:729–730), which requires
the settings file's written content to be *"the hook wiring and the `SessionEnd` timeout
and nothing else"*; and of `AC-25` (spec:795–797), which requires teardown *"within the
budget the settings file establishes"*. The 1.5-second figure is itself a harness timeout
value, confirmed against primary source at hooks.md:343 and hooks.md:2693 (Read). Four
requirements and criteria therefore exist as a direct consequence of one harness timeout
value: if the harness raised `SessionEnd`'s default to 60 s, C-2's mandate, C-4's clause,
AC-6's content assertion and AC-25's phrasing would all be obsolete. Standard:
ISO/IEC/IEEE 29148 *consistent*. Why it matters: C-5's sentence exists to bound what
contract drift can break, and it names as unaffected the one area drift most directly
affects — an architect reading C-5 has been told not to design for a value C-2 requires
them to write into a settings file. Fix: replace the sentence with the true bound —
*"No requirement here depends on the numeric continuation cap. C-2's `SessionEnd` timeout
is the one place a harness timeout value is load-bearing, and C-5's drift detection covers
it: a change to the shared budget is contract drift and re-verification catches it."*

### M4 — §4 states `additionalContext` is "independent of `permissionDecision`"; the source it attests to string-matching records one dependency · **Moderate · new**

§4 (spec:186–192) states: *"**`PreToolUse` may inject context without a permission
decision.** Exit code 0 with no output "means the hook has no decision to report, so the
tool call continues through the normal permission flow"… `additionalContext` is a field of
the `PreToolUse` `hookSpecificOutput` object **independent of `permissionDecision`**."*
The section's lead-in (spec:170–171) attests that these facts are *"each string-matched
against the downloaded reference."* Verified by Read of hooks.md:1553 in the raw 242,078-byte
download: *"`additionalContext` | String added to Claude's context alongside the tool
result. **Ignored when `permissionDecision` is `"defer"`.**"* The independence claim is
not a quotation, was not string-matched, and is contradicted by the source's own field
table. Read of hooks.md:1587–1615 confirms `"defer"` is a distinct fourth
`permissionDecision` value whose effect is that *"The tool doesn't execute"* — and FR-O4
(spec:233–235) forbids a *blocking* decision, which `"defer"`, documented as exiting
*"gracefully so the tool can be resumed later"*, does not unambiguously fall under.
Standard: `CLAUDE.md` — *"External facts (harness contracts, protocol status, library
behavior) are verified against current primary sources before you build on them — the
hooks contract has already drifted once; assume it will again."* Why it matters: three of
Phase 0's six genres (consequence and both warning arms) fire on `PreToolUse` and depend
on this field (spec:319–322); an architect told the field is independent of
`permissionDecision` has no reason not to return `"defer"`, and would lose every
`PreToolUse` whisper silently. Fix: state the source's actual contract — *"`additionalContext`
is a field of the `PreToolUse` `hookSpecificOutput` object, delivered alongside any
`permissionDecision` except `"defer"`, which Phase 0 never returns (FR-O4)"* — and add
`"defer"` to FR-O4's structurally-absent set so the exclusion is a requirement rather than
an assumption.

### m1 — FR-K1 attests to carrying RETHINK's Tier 2 list "in full" and drops one of its ten items · **Minor · new**

`FR-K1` (spec:252–256): *"A structural index whose content is `RETHINK.md` §4's Tier 2
list (`:130–134`) **in full**: files, symbols, import and reference edges, directory
topology, ownership boundaries, generated/vendored/build-output zones, **entry points**,
test topology, and **per-region verification commands**."* Verified by Read of
`RETHINK.md:130–134`: *"Import/reference graph, symbol map, directory topology and
ownership boundaries, generated/vendored/build-output zones, entry points, test topology
(which tests exercise which regions), **build/verification commands per region**."*
Phase 0's final item drops *build* commands. Standard: citation accuracy, raised to a
functional requirement by this document's reliance on a normative incorporation-by-line —
"in full" is an attestation, and it is false. This is the residual of round 3's M3, whose
fix restored *entry points* and the normative incorporation but did not diff the resulting
enumeration against the list it now claims to reproduce. It is not purely cosmetic: §7's
generated-file warning must name *"what overwrites it"* (spec:308), which is a build
command. Fix: write *"…and build and verification commands per region"*, or drop "in full"
and cite the range as the source of the list rather than as its identity.

### m2 — `C-3`'s citation still does not carry the harness-neutral-event-contract clause · **Minor · recurring**

`C-3` (spec:547–549) reads in full: *"Harness-specific knowledge lives in the shims, **and
the service speaks a harness-neutral event contract** — the property that keeps subagent
and other-harness support open. `RETHINK.md:291–292`."* Verified by Read of
`RETHINK.md:291–292`: *"- **Thin hook shims**: forward harness events to the daemon; relay
whispers back as injected context. Shims contain no logic."* The widened range now
completes the sentence the prior round found truncated, but it states neither the
confinement claim nor — and this is the load-bearing half — the harness-neutral event
contract. Read of the whole of `RETHINK.md` §11 (`:282–299`) confirms the section
describes a store / daemon / shims / judgment-layer split and nowhere states that the
service's event contract is harness-neutral; v1 grounds the same sentence in
`[RETHINK §11]`, the whole section, which is the honest scope for the inference. Standard:
citation accuracy. This is round 3's m1 at the same location against the same standard:
the fix applied the reviewer's literal prescription — widen to `291–292` — without
checking that the widened range carries the claim, which is the same wrong-check the
collapse log names. Fix: cite `RETHINK.md §11` for the clause that is an inference from
the architecture sketch and `RETHINK.md:291–292` for the clause that is stated, or mark
the harness-neutral event contract as this document's judgment with a `[P0-D-n]` entry
giving the reasoning.

### m3 — the settings-file write is attributed to P8's out-of-tree-store clause; the clause that permits it is P8's in-tree-write exception · **Minor · new**

Two sites make the same attribution. §3 (spec:145–146): *"P8's **out-of-tree-store
carve-out** is what permits C-4's settings write against FR-X5's read-only posture."*
`FR-X5` (spec:485–487): *"The single write exception is `init`'s harness settings file,
which v1 **P8's out-of-tree-store carve-out** permits and C-4 bounds."* Verified by Read
of v1 P8 (`v1:153–157`): *"**P8 — The repo tree stays pristine.** All oracle state lives
outside the repository. **The only in-tree write, ever, is hook wiring in
`.claude/settings.json` during an explicit `ctxoracle init`.**"* P8 carries two distinct
clauses; the one that permits an in-tree write is the second, and the out-of-tree-store
clause is the one that would forbid it if it stood alone. Standard: citation accuracy —
the same class as m2 and as round 3's m1, here at an internal cross-document reference.
Why it matters: an architect tracing the authority for the single write exception is sent
to the clause that establishes the opposite property. Fix: at both sites write *"which v1
P8's explicit in-tree-write exception for `.claude/settings.json` permits and C-4 bounds."*

---

## Tentative Findings

No tentative findings — every candidate finding's premise was verified against current
source before it was written, per Compliance Gate B. Four premises were at material risk
and each was closed by direct instrument, two of them **changing the finding set**: the
quotation scan (an unmasked quote-pair scan reported 36 failures against this document
because §4's inline-code string literals mis-pair the prose quotations; masking code spans
reduced it to 2, both legitimate ellipsis elisions, so **no quotation finding was
written**); the `[HERZIG-13]` 15% figure (a candidate unsourced-number finding, dropped
after Read of v1's source table at `v1:107` showed v1 states *"Up to 15% of fixes are
tangled"* and §4 carries the row forward); the `"defer"` semantics behind M4 (Read of
hooks.md:1587–1615 established that omitting `permissionDecision` is not `"defer"`, which
is why M4 is scoped to the claim's absoluteness rather than asserting Phase 0 is broken);
and the `[D-21]` question — whether P0-D-17's use of FR-J3's wording re-couples Phase 0's
genre list to a deferred requirement — dropped after Read of `v1:852–875` confirmed
`[D-21]` severed the *genre list*, not the *phrasing*, so the premise did not hold.

---

## Observations

These carry no standard violation and no severity.

1. **The Clear Thought MCP was unavailable in this session**, as in rounds 1–3.
   `metacognitivemonitoring` and `collaborativereasoning` are both mandatory in the review
   skill; tool search returned no matching tools. Both passes were performed manually. The
   metacognitive baseline was drawn before any finding was drafted: the prior review's
   findings, the collapse hunt's findings, the ROSE text, the hooks contract and the v1
   requirement set all sat on the *inferred* side and were routed through Step 6 before
   they could support a finding — which is what caught the quote-pairing artifact recorded
   under Tentative Findings. The three-perspective check (standards discipline; the
   architect who consumes this next; the implementer receiving the findings) changed the
   delivered output in three ways: S1's eight rows are split into an unarguable tier and a
   dropped-clause tier so the implementer can start where no judgment is needed; S2 carries
   the full before/after id mapping so the fix is mechanical rather than investigative; and
   Recommended Priority is ordered by what blocks the architecture rather than by severity
   alone, which moves M3 and M4 above M1 and M2.

2. **The reviewed artifact was stable throughout this pass.** `2dfbc45` landed after the
   fix-diff but touches only `docs/STATUS.md` and `docs/collapse-log.md`
   (`git diff --stat 014bc26..2dfbc45`). All findings are against `014bc26`, and the spec
   is byte-identical at HEAD.

3. **The round-3 lessons were routed to the collapse log rather than left in the review.**
   `CLAUDE.md`'s information policy calls this the one sanctioned overlap, and the entries
   (54 lines at `2dfbc45`) name the class, not just the instance. One of them is the
   standard Systemic 1 is evaluated against, which is the mechanism working as designed —
   the lesson was inherited by this review even though it was not yet applied to the fixes
   that preceded it.

4. **The prior round's instrument corrections held.** `pdfminer.six` still interleaves the
   ROSE paper's two-column layout, `file(1)` still reports the 17-page PDF as 10 pages, and
   markdown link syntax in the raw hooks reference still breaks naive matching on two
   spans. All three were pre-empted by the recorded corrections rather than rediscovered.

---

## What's Actually Good

Each entry names the property, the standard it is good by, and how the property was
verified.

1. **Every quotation in the document is verbatim against primary source — all 36, across
   five sources.** Property: each quoted span reproduces what the named source says, with
   only the alterations CMOS 17th §13.7 and §13.50 permit (initial capital, terminal
   punctuation, marked ellipsis). Standard: quotation and citation accuracy, raised to a
   functional requirement by `CLAUDE.md`'s external-facts rule. Verification: every quoted
   span ≥ 25 characters was extracted by quote-pair matching over the document with
   inline-code spans masked (36 spans), Unicode- and whitespace-normalised, and
   string-matched against five normalised sources — `RETHINK.md`, the v1 spec, the hooks
   reference downloaded raw at 242,078 bytes, and the ROSE paper under two independent
   extractions. Result: **36/36**, including twelve hook-contract quotations (up from ten
   last round) and eight ROSE quotations. The document added nine quoted spans this round
   and did not lose a single one to inaccuracy.

2. **§3's partition over v1's requirement set is arithmetically exact and
   non-overlapping, and survived a wholesale rebucketing.** Property: all 65 v1
   `FR-*`/`NF-*`/`C-*` requirements are placed in exactly one of three buckets, with no
   duplicate, no bucket member absent from v1, and no v1 member absent from every bucket —
   preserved across a round that moved eleven requirements from "unchanged" to "narrowed"
   (38/10/17 → 27/21/17). Standard: ISO/IEC/IEEE 29148 *complete*, and the traceability
   principle that a derived specification accounts for its parent's obligations rather than
   sampling them. Verification: a deterministic script extracted every bolded definition
   from the v1 spec (65, 0 duplicates) and every identifier from §3's three lists
   (27 + 21 + 17 = 65 after expanding the `FR-J1–FR-J5` style ranges), then computed both
   set differences — **both empty** — and all three pairwise intersections — **all empty**.
   S1 attacks the disposition claim, which is a different assertion by the same table.

3. **Requirement-to-criterion coverage is complete: 50 of 50, preserved through a
   twenty-one-criterion renumbering.** Property: every requirement defined in §§5–13 is
   referenced by at least one §14 acceptance criterion or named in §14's inspection
   paragraph. Standard: ISO/IEC/IEEE 29148 §5.2.8 requirements-to-verification coverage.
   Verification: a boundary-anchored deterministic scan (so `AC-10` is not miscounted as a
   reference to `C-10`) over the 50 defined requirements against every identifier
   referenced anywhere in §14 → **0 uncovered**. Round 3's `C-3` gap moved from the
   inspection paragraph into an executable criterion (AC-24, Read), which is a strict
   improvement: the inspection paragraph now names only `FR-D4` and `P0-2`, both of which
   are genuinely not executable. S2 concerns the reverse direction — body clauses citing
   §14 — which this scan does not cover and which is why it is a separate finding.

4. **P0-3 now implements the capability `[OWNER-12]` ruled on, rather than bounding a
   blunter one — and it is the round-3 collapse hunt's heaviest finding, closed at the
   root.** Property: the requirement recognises a completion claim from
   `last_assistant_message`, the field the harness supplies on `Stop` precisely so a hook
   need not read the transcript; the per-session cap survives with a restated job
   (bounding a lexical test's false positives, not standing in for recognition); and the
   non-matching-stop count is reported so the test's behaviour is measurable rather than
   assumed. Standard: ISO/IEC/IEEE 29148 *verifiable*, and the project's own hollow-decision
   test — the mission-need is named, the mechanism that serves it is named, and the residual
   is bounded and counted. Verification: Read of spec:395–412 (P0-3), spec:178–185 (§4's
   contract facts) and spec:751–756 (AC-12), against hooks.md:2194–2196 — *"The
   `last_assistant_message` field contains the text content of Claude's final response, so
   hooks can access it without parsing the transcript file"* (string-matched exact) — and
   hooks.md:632, whose common-input table directs hooks to it explicitly (string-matched
   exact). The `StopFailure` caveat is also correct: hooks.md:2294 (Read) confirms the same
   field name carries the API error string there, and spec:184–185 says so. This is the
   finding the collapse hunt rated first of twenty-three, and the fix did not ration the
   wrong mechanism — it replaced it.

5. **§4's source table now carries every source the document's in-force requirements
   inherit, bar one.** Property: thirteen source rows, up from eight, restoring
   `[HERZIG-13]`, `[COVERITY-10]`, `[ASI-26]`, `[OWASP-SM]`, `[LLM02]`, `[OWASP-PI]`,
   `[JOHNSON-13]`, `[CHI-25]` and `[NODE]` — the seven the prior round found missing plus
   two more. Standard: `CLAUDE.md` — *"Every non-trivial new requirement carries a source
   annotation."* Verification: a per-requirement tag extraction over the v1 body text of all
   27 declared-unchanged requirements, differenced against the tags present in the Phase 0
   spec → **one** genuine residual (`[CACM-18]`, M2) and one label alias (`[HOOKS]`). Nine
   restored rows against one residual is the largest single closure in this artifact's
   history, and it is only a finding at all because the sentence beneath the table
   re-asserted completeness.

---

## Convergence Record

**Round number**: 4 (third Post-fix round), matching Scope and Inventory.

**Trajectory** (findings by severity, per round, from each round's mechanical verdict
breakdown):

| Round | Total | Critical | Serious | Moderate | Minor |
|---|---|---|---|---|---|
| R1 (`3edc61f`) | 20 | 2 (1 Systemic) | 7 (1 Systemic) | 8 | 3 (1 Systemic) |
| R2 (`332406c`) | 14 | 0 | 5 (1 Systemic) | 5 | 4 |
| R3 (`93de2c2`) | 7 | 0 | 2 (1 Systemic) | 4 | 1 |
| R4 (`014bc26`) | **9** | **0** | **2 (both Systemic)** | **4** | **3** |

**Flow counts for this round**, from the Step 9 provenance classifications:

- **Prior findings closed: 3** — R3's S2, M3, M4.
- **Prior findings recurring: 4** — R3's S1 (→ this round's S1), M1 (→ M2), M2 (→ M1),
  m1 (→ m2). In each case the named instances were fixed and the finding's own standard is
  still violated at the same location.
- **New findings: 4** — M3, M4, m1, m3.
- **Regressions: 1** — S2, introduced by this round's §14 renumbering. Verified as a
  regression by extracting §14's id-to-topic mapping at `93de2c2` and confirming all four
  references were correct there.

Closure evidence per closed finding, each re-derived from current source:

| R3 finding | Status at `014bc26` | Evidence |
|---|---|---|
| **S1** — §3's disposition column false for ≥8 of 38 rows | **recurring** | All eight named instances are fixed: FR-L6, FR-A6, FR-A7, FR-X2 and FR-A3 moved into the narrowed table (spec:118–130, Read); C-3's second clause restored (spec:547–549); FR-K1's normative Tier 2 incorporation restored (spec:252–256); FR-D1's `[JOHNSON-13]` clause restored (spec:420). The originally named standard — §3's stated purpose and 29148 *consistent* — is **not** satisfied: the column is false at eight different rows, verified by the full 27-row body-text diff. Not closed. |
| **S2** — FR-A3's warning-priority clause, third round running | **CLOSED** against the collapse log's ranking directive, its originally named standard. `FR-A3` (spec:336–341, Read) no longer contains the clause; `P0-D-15` (spec:635–643, Read) records the deletion, its reason, and that the ranking function is FR-A5's per-candidate score; `AC-28` (spec:807–809, Read) tests only the budget-is-hard half; §7 (spec:324–329) and `P0-D-18` (spec:656–659) both state no genre precedence. `grep -nEi "priorit\|precedence"` over the spec → **9 matching lines** (118, 119, 327, 341, 357, 635, 636, 639, 657, 808), each Read: **none asserts a precedence** — five deny one, four record the deleted clause as deleted. |
| **M1** — §4's attestation false, 7 v1 sources absent | **recurring** | Nine source rows restored (verified by tag extraction; §4 now carries 13 rows), and the first sentence narrowed as prescribed — but a completeness clause was appended and `[CACM-18]` remains absent, so the attestation is false again at the same location against the same standard. Not closed. |
| **M2** — §2's arm-table criterion could not produce the table | **recurring** | The criterion was replaced (spec:74–76, Read) and the landmine-arm case it failed on is now handled explicitly (spec:88–91). The replacement criterion is falsified by row 1 of the same table. Same location, same standard. Not closed. |
| **M3** — `FR-K1` omitted entry points that §7 and AC-9 require | **CLOSED** against 29148 *complete*, its originally named standard. `FR-K1` (spec:252–256, Read) now names **entry points** explicitly and restores the normative incorporation of RETHINK §4's Tier 2 list. Verified by whitespace-collapsed regex `entry\s+points?` over the spec → **9 occurrences**, one of them inside FR-K1's body (a plain `grep "entry point"` returns only 5 lines and misses it, because FR-K1 wraps the phrase across spec:255–256 — recorded so the next round does not read that grep as evidence the fix was not applied). AC-9 (spec:738–742) traces to a requirement that mandates what it tests. (The list's one remaining omission is a different item and a different claim — m1.) |
| **M4** — `P0-D-4` claimed v1's 2,000-token budget as this document's | **CLOSED** against the collapse log's lesson #3 and 29148 traceability, its originally named standards. `P0-D-4` (spec:587–593, Read) now reads *"FR-A3's 2,000-token budget is **v1 `[D-10]`**, carried unchanged with its derivation: 2,000 ≈ five orientation-size whispers at the ~400-token orientation bound, so the two numbers move together"*, matching v1 `[D-10]` (`v1:808–811`, Read) including the coupling the prior round said an architect needs. FR-A3 itself (spec:336–341) restates the derivation. |
| **m1** — `C-3`'s citation points at a line that does not contain the claim | **recurring** | The range was widened to `291–292` and v1's second clause restored, exactly as prescribed. Read of `RETHINK.md:291–292` and of the whole of §11 (`:282–299`) confirms neither carries the harness-neutral-event-contract claim. Same location, same standard. Not closed. |

**Tripwire evaluation — NOT FIRED.** Arithmetic shown:

- *Condition (a)* — new + regression ≥ closed, for two consecutive Post-fix rounds. This
  round: 4 + 1 = **5**; closed = **3**; 5 ≥ 3 is **TRUE**. Prior round (R3): 6 + 0 = 6;
  closed = 13; 6 ≥ 13 is **FALSE**. The condition requires two consecutive rounds and this
  is the first, so it does not fire.
- *Condition (b)* — total findings not strictly decreased, for two consecutive Post-fix
  rounds. R2 → R3: 14 → 7, a **strict decrease**. R3 → R4: 7 → 9, **not** a strict
  decrease. Again the first of the two consecutive rounds the condition requires, so it
  does not fire.

Neither condition holds, so the verdict-independent recommendation remains another fix
round rather than foundational rework. **But both conditions are now armed on their first
leg, and this must be stated plainly rather than buried in the arithmetic**: R4 is the
first round of this artifact's four in which new + regression exceeded closures, and the
first in which the total rose. If round 5 produces new + regression ≥ closed **or** a
total of 9 or more, the tripwire fires on both conditions simultaneously. The reason to
say so now is that the shape of this round's findings is the shape a tripwire exists to
detect: four of seven prior findings recurred at the same location against the same
standard after their named instances were fixed, and one new Serious finding was created
by the fixes themselves. That is a rework loop patching instances of a generator the
project has now named four times in its own collapse log.

---

## Recommended Priority

Ordered by engineering consequence, not by effort.

**Blocks the architecture — fix before any design work begins.**

1. **S1 — re-derive §3's disposition column mechanically and record the output, not the
   claim.** §3 is the only place that tells the architect what is in force, and it is
   currently wrong about the false-fire channel (FR-D3), the oracle's write posture
   (FR-X5), the injection-suspect quoting rule (FR-X3), what a broken oracle must say
   (FR-M4), whether a timed-out candidate survives (FR-O3), and whether a continuation can
   prevent a turn ending (FR-O4a). Start with Tier 1: FR-D3 is stated as changed by the
   document's own P0-D-24, and FR-X3 and FR-X5 are settled by applying the criterion §3
   already states for FR-X1. Then run the body-text diff over all 27 rows and let the
   buckets fall out of it — do not hand-move a second set of rows, which is what produced
   this finding from the last one.
2. **S2 — apply the four cross-reference corrections and add the renumbering guard.**
   spec:91 `AC-27 → AC-30` and `AC-21 → AC-22`; spec:145 `AC-20 → AC-21`; spec:429
   `AC-26 → AC-31`. Four token edits, and then the guard: any §14 insertion, removal or
   reorder is followed by re-extracting every `AC-n` reference outside §14 and confirming
   the named criterion still tests the cited property. This is second only because the
   edits are mechanical; it is above everything below it because each downstream document
   will copy these numbers forward.
3. **M3 and M4 — fix the two contract claims an architect will design against.** C-5
   currently tells them no requirement depends on a harness timeout value while C-2
   requires them to write one into a settings file; §4 tells them `additionalContext` is
   independent of `permissionDecision` when the source records that `"defer"` discards it.
   Both are one sentence, and both are exactly the kind of statement a designer takes at
   face value because it sits in a table headed "how each was confirmed".

**Blocks approval and trust.**

4. **M2 — restore `[CACM-18]` or drop §4's completeness clause.** Whichever is chosen, do
   not do both; re-adding a completeness attestation on top of a narrowed sentence is what
   turned a closed finding back into an open one.
5. **M1 — state §2's criterion as the disjunction the table actually applies.** The
   classification is right; the one-line criterion cannot produce it, and this is the
   second consecutive round at that sentence.

**Blocks the exit.**

6. **m1, m2, m3 — three citation and attestation repairs.** Add build commands to FR-K1's
   list or drop "in full"; split C-3's citation between what `RETHINK.md` states and what
   this document infers; and at spec:145 and spec:487 attribute the settings write to P8's
   in-tree-write exception rather than its out-of-tree-store clause.

**One process note for whoever executes this, and it is the whole lesson of this round.**
Four of round 3's seven findings recurred because each fix was applied to the finding's
*named instances* and not to its *class* — the eight §3 rows moved and the column was not
re-derived; seven source rows returned and the eighth was not looked for; §2's criterion
was replaced and not applied to its own table; C-3's citation range was widened to the
line the reviewer named and not checked against the claim it carries. The collapse log
already contains this instruction, written by the session that produced these fixes. The
operational form of it: for every finding below, before writing the fix, write the command
that would prove the fix generalises, run it, and paste its output into the commit. Then
re-enter review as a Post-fix round whose inventory is this review's inventory plus the fix
diff plus these nine findings as closure items — and note that the non-convergence tripwire
is one round from firing on both of its conditions, so a round 5 that closes fewer than it
opens routes this artifact to foundational rework rather than to a round 6.

---

Verdict: NEEDS FIXES (9 findings: 2 Serious-Systemic, 4 Moderate, 3 Minor)
