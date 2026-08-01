# Expert Review — Phase 0 spec (`docs/specs/spec-context-oracle-phase0.md`)

**Date**: 2026-08-01 · **Round**: 3 (Post-fix review)
**Artifact pinned at commit**: `93de2c2` (`context-oracle: rebuild the Phase 0 spec against
round-2 review findings`), 715 lines.
**Prior review of record**: `docs/reviews/2026-08-01-round-2-expert-review-phase0-spec.md`,
pinned at `332406c`, verdict NEEDS FIXES (14 findings).
**Fix-diff**: `332406c..93de2c2` (3 commits; 668 changed lines in the spec).
**Reviewer**: independent; did not author the document or the fixes.

---

## Scope and Inventory

### Round number

Round 3. Round 1 was the first expert-review of this artifact; round 2 was the first
Post-fix review; this is the second, so the counter increments to 3.

### Inventory (Step 2 — Post-fix rule: the prior review's full inventory, plus every file in the fix-diff, plus the fix-diff files' dependents, plus the prior review's findings as closure items)

**Source 1 — the prior review's full inventory.**

- [x] `middleware/context-oracle/docs/specs/spec-context-oracle-phase0.md` — **Read in
  full** at `93de2c2` (715 lines), plus targeted re-Reads at the drafting of each finding
  (`72–116`, `174–176`, `212–213`, `244–273`, `287–291`, `296–305`, `327–336`, `409–423`,
  `462–480`, `510–522`, `565–573`, `623–627`, `666–670`, `710–716`).
- [x] `middleware/context-oracle/RETHINK.md` — **Read in full** (399 lines), plus
  per-citation re-Reads at every range the spec cites (`15–24`, `59–61`, `77–78`,
  `130–134`, `138`, `163`, `169–171`, `175–181`, `187–199`, `278–279`, `291`, `314–334`,
  `342–344`, `350–359`, `363–399`) — the full citation audit is tabulated below.
- [x] `middleware/context-oracle/docs/specs/spec-context-oracle.md` (v1, 1,099 lines) —
  **Read** at `103–113`, `344–372`, `395–415`, `416–434`, `740–744`, `827`, `895–901`,
  `905–912`; and **Grep-verified** by deterministic scan (65 requirement definitions
  extracted and diffed against §3's three buckets; per-requirement text extracted and
  compared against the Phase 0 restatement for all 38 declared-unchanged rows).
- [x] `middleware/context-oracle/CLAUDE.md` — **Read in full** (330 lines, current
  contents in session context); **Grep-verified** for the read-list and information-policy
  changes via `git diff 332406c..93de2c2`.
- [x] `middleware/context-oracle/docs/collapse-log.md` (550 lines) — **Read** at `340–550`;
  **Grep-verified** for the standing directives cited below; the 39 lines added by the
  fix-diff Read in full.
- [x] **Claude Code hooks documentation** (`code.claude.com/docs/en/hooks.md`) — primary
  source **downloaded raw** 2026-08-01, **242,078 bytes / 3,173 lines** (byte-identical to
  the size §4 claims); **Read** at `108`, `154`, `343`, `695`, `712`, `838–842`, `865`,
  `1544–1553`, `1615`, `1756`, `2069`, `2262`, `2693`; **Grep-verified** for
  `no decision to report` (1), `normal permission flow` (3), `non-error feedback` (2),
  `continues the conversation` (2), `10 minutes` (**0**).
- [x] **Zimmermann, Weißgerber, Diehl & Zeller, "Mining Version Histories to Guide
  Software Changes," IEEE TSE 31(6), 2005** — PDF fetched from
  `thomas-zimmermann.com/publications/files/zimmermann-tse-2005.pdf` (1,948,399 bytes);
  **17 pages** confirmed by `pypdf` (the `file(1)` utility reports 10 — an unreliable
  read of the page-count object, recorded here so the next round does not treat it as
  evidence of the wrong paper); masthead confirmed (`IEEE TRANSACTIONS ON SOFTWARE
  ENGINEERING`, `VOL. 31`, `NO. 6`, `JUNE 2005`, 9 occurrences); text extracted **twice,
  by two independent engines** (`pdfminer.six` → 69,435 chars; `pypdf`), because the
  two-column layout scrambles sentence order in one of them.

**Source 2 — every file in the fix-diff (`332406c..93de2c2`).**

- [x] `docs/specs/spec-context-oracle-phase0.md` — as above.
- [x] `middleware/context-oracle/CLAUDE.md` — **Read in full**; diff Read in full.
- [x] `middleware/context-oracle/docs/STATUS.md` (478 lines) — **Read** at `1–30` and
  `60–100`; **Grep-verified** for `phase0|round 2|round 3|verdict|NEEDS FIXES`.
- [x] `middleware/context-oracle/docs/collapse-log.md` — as above.
- [x] `docs/reviews/2026-08-01-round-2-expert-review-phase0-spec.md` — **Read in full**
  (965 lines). The prior review of record and the closure baseline.
- [x] `docs/reviews/2026-08-01-collapse-hunt-phase0-spec-rebuild.md` (933 lines) — **Read**
  at `1–120`. Added by the diff, so the post-fix rule puts it in the inventory. Every claim
  in it is treated as a prior-document claim and re-derived from source per Step 6; **no
  finding below is imported from it.** One of its claims was materially useful as a
  *pointer* and was re-derived independently: that the `PreToolUse` exit-0 sentence the
  round-2 review could not find lives on a different page of the harness documentation.

**Source 3 — the fix-diff files' dependents.** No code exists for this project, so
`codegraph_get_dependents` has no referent. Document-level dependents — every file citing
this spec's identifiers or cited by it — were enumerated by grep and verified:

- [x] `CLAUDE.md` — grep for the spec path → now present at read-list item 3 and as an
  information-policy row (both verified in the diff and in the current file).
- [x] `docs/specs/spec-context-oracle.md` — grep for `phase0|spec-context-oracle-phase`
  → **0 hits**; untouched by the fix-diff (`git diff --stat` over that path → empty).
  v1 §12's Phase 0 exit line Read at `905–912`.
- [x] `docs/collapse-log.md` — grep for `FR-A2` and for the three new entries' pointers;
  all resolve.

**Source 4 — the prior review's 14 findings as closure items.** Each re-derived from
current source; per-finding closure evidence is in the Convergence Record.

- [x] S1 · [x] S2 · [x] S3 · [x] S4 · [x] S5
- [x] M1 · [x] M2 · [x] M3 · [x] M4 · [x] M5
- [x] m1 · [x] m2 · [x] m3 · [x] m4

### Step 3 — tool plan

| Claim type in this review | Instrument | Available |
|---|---|---|
| Literal-content (spec text, RETHINK / v1 line ranges) | Read at file:line, at drafting time | yes |
| Absence ("no source states X", "no criterion covers Y") | Grep for the signature **plus** Read of the region — the collapse log's standing rule is *search locates, reading verifies* | yes |
| Library-behaviour (Claude Code hooks contract) | Raw primary-source download (242,078 bytes) + Read + Grep. Context7 deliberately **not** used: the round-2 review established that a summarising query is what produced the prior round's worst finding | yes |
| External-source (ROSE quotations and figures) | PDF fetch + **two** independent text extractions + normalised string match | yes |
| Cross-document identifier consistency, coverage, disposition | Deterministic scripts over both specs, counts reported | yes |
| Quotation integrity | Deterministic scan of every quoted span ≥ 25 chars against four normalised sources | yes |
| Structural / blast-radius | CodeGraph | **unavailable** — no load-bearing claim here is structural (the artifact is a document; no code exists), so not a halt condition per Step 3 |
| Structured reasoning (`metacognitivemonitoring`, `collaborativereasoning`) | Clear Thought MCP | **unavailable in this session** — tool search returned no matching tools. Both mandatory passes performed manually with the same framing; recorded as Observation 1 |

**Instrument note carried forward and extended.** The round-2 review overruled a
summarising fetch by downloading the hooks reference raw. This round did the same, and
additionally ran **two independent PDF text extractions** after discovering that
`pdfminer.six` interleaves the ROSE paper's two-column layout mid-sentence — which
produces a false negative on a quotation that is in fact verbatim. Both instrument
corrections are recorded because each one, alone, would have generated a wrong finding.

**Rigor waivers**: none. No step was compressed and the dispatch requested none.

---

## Summary

**This review returns NEEDS FIXES.** The fix round is the strongest this artifact has had:
thirteen of the prior round's fourteen findings are closed against their originally named
standards, the total finding count falls 20 → 14 → 6, and the two apparatus-level failures
that dominated round 2 are gone. Every quoted span in the document — all 27 of them, across
four sources — now verifies verbatim against primary source, including both hooks
quotations that failed last round and all eight ROSE quotations with the cost figures
correctly labelled. Requirement-to-criterion coverage is complete for the first time: 50 of
50, with a named inspection for the three that are not executable. The identifier namespace
§1 declares is now true, §3's partition over v1's 65 requirements is arithmetically exact
and non-overlapping, and the document has no dangling internal reference. What remains is
one habit, and it is the habit the fix-diff itself wrote into the collapse log: *a device
that asserts a property of the whole document gets written once and is never re-checked
against the document it describes.* §3's disposition column is arithmetically perfect and
substantively wrong in at least seven of its thirty-eight "unchanged" rows — in three of
them contradicted by this document's own decision records, which state the very change §3
denies. §4's closing source attestation is falsified by §3's inheritance mechanism, and
§2's stated narrowing criterion does not distinguish the arm it narrows from the arm it
declines to narrow. Beneath those, one requirement's index enumeration omits the artifact
two of its own criteria test for, and the single unsourced genre-ranking clause from rounds
1 and 2 survives a third time — now annotated by a decision record that contradicts it.

---

## Upstream Contract Verification

The upstream contracts for a spec on this project are `RETHINK.md` §12 and its addenda (the
owner's locked decisions, declared "above this document" at spec:16–17), `CLAUDE.md`, the
standing lessons in `docs/collapse-log.md`, and the v1 spec whose requirements §3
dispositions. Verification method recorded per item.

### `RETHINK.md` §12 + addenda — the owner's locked decisions (highest authority)

| Decision | Status | Verification |
|---|---|---|
| 1. Name `ctxoracle` | honored | Read spec:3, 489–491 |
| 2. Model in the loop | honored (deferred with a stated reason) | Read spec:62; §3 defers FR-J1–FR-J5 whole (spec:117) |
| 3. No hard blocks, anywhere | honored | Read spec:194–196 (FR-O4), 368–370 (FR-D3), 608–611 (AC-5); RETHINK:314–323 Read |
| 4. Sandbox compatibility | honored | Read spec:462–469 (C-1) + P0-D-13 (spec:558–562); AC-31 Read |
| 6. Two stores, outside the tree | honored | Read spec:238–239 (FR-K8); RETHINK:330–334 Read |
| 7. No separate credentials | honored (vacuously — no model call) | Read spec:380–381, 493 |
| 8. Subagent delivery in v1 | honored, correctly pointed | Read spec:68 (§2 row names FR-O6) vs spec:204–206 (FR-O6) and 543–547 (P0-D-10) |
| 10. Self-observability required | honored, and honored by §14's gate | Read spec:436–437 vs spec:584–587; RETHINK:350–354 Read |
| 11. Agent-led; owner is a non-programmer | honored | Read spec:42–44; RETHINK:355–359 Read |
| 12. Speak at a completion claim, bounded to one | honored, and the moment/event gap is now stated plainly | Read spec:197–201 (FR-O4a), 342–356 (P0-3); RETHINK:363–399 Read. P0-3 explicitly records that `Stop` is not the moment the ruling was about and that Phase 0 cannot discriminate — the collapse-hunt's N1 concern, addressed in the requirement rather than papered over |

Decisions 5 and 9 are superseded / deferred and correctly so (5 by 8; 9 to Phase 1 via §3,
spec:116–117).

### `CLAUDE.md` — lifecycle, information policy, engineering standard

| Clause | Status | Verification |
|---|---|---|
| Lifecycle: spec → architecture → plan → build; architecture is per phase | honored — correct stage, and it cites no architecture decisions (grep `architecture` over the spec → **0 hits**) | grep result recorded; the one `[D-n]` citation is `v1 [D-15]`, a v1 §11 spec judgment (v1:827, Read), which `CLAUDE.md` sanctions — not an architecture decision |
| "Only `STATUS.md` states what to do next" | honored | grep `next step\|roadmap\|we will\|to do next\|todo` over the spec → **0 hits** |
| "Every non-trivial new requirement carries a source annotation… Numbers without sources don't go in" | honored for every stated number | Numeric audit below; the prior round's one unsourced number (support ≥ 2) now carries `[HH-04]` at spec:321–322 |
| "External facts… verified against current primary sources before you build on them" | **honored** | Full quotation scan — 27/27 verbatim; see *What's Actually Good* 1 |
| "Keep documents in sync" | honored, with one owner-declined element | `CLAUDE.md` now routes to this spec (read-list item 3 + information-policy row, Read). The v1-side pointer was declined by the owner (STATUS.md:75–79, Read) — recorded in Observations, not as a finding |
| "When a review surfaces findings, apply **all** of them" | **13 of 14 closed** | See Convergence Record; S5 carried |

### `docs/collapse-log.md` — standing lessons

| Standing lesson | Status | Verification |
|---|---|---|
| "No ranking claim about this tool's purposes, genres, triggers or moments enters any document unless the owner stated it in those words" (2026-08-01 #1) | **violated** | Read spec:288–289; grep `priorit` over `RETHINK.md` → **0 hits**, region `:173–182` Read to confirm — see S2 |
| "When the argument for excluding something is that it isn't worth saying, that is a bar argument, never a scope argument" (#2) | honored | Read spec:75–82 — every arm's reason is capability-based |
| "Before recording that something was missing, read the file you are about to say it was missing from" (#3) | honored | P0-D-6 now cites v1:895–901 correctly (Read both) — prior S2 closed |
| "The spec does not cite numbered architecture decisions as authority" (#4) | honored | grep `architecture` over the spec → 0 hits |
| "A new document needs a written precedence rule before its first sentence" (#5) | honored | Read spec:5–17 |
| "'Every X is Y' under a table is an attestation… treat one as a defect on sight" (#6) | **violated, three times** | §3:91–93, §4:175, §2:84 — see S1, M1, M2 |
| "Stopping too early against a source that is right there" (2026-08-01) | honored | Full ROSE passage now quoted with recall and feedback distinguished (spec:313–318) — prior M1 closed |
| **New this diff**: "Treat any newly-added summary, table, partition or namespace rule as the *first* thing the next round verifies, not the settled part" (collapse-log:22–35) | **violated by the same document that wrote it** | §3's partition was re-checked arithmetically and not substantively — see S1 |

### v1 spec — the requirement identifiers and their meanings (spec:134)

| Obligation | Status | Verification |
|---|---|---|
| §3 dispositions every v1 `FR-*`/`NF-*`/`C-*` requirement exactly once | **honored** | Deterministic scan: 65 identifiers in v1; §3's buckets 38 + 10 + 17 = 65; **0 overlaps, 0 in a bucket but absent from v1, 0 in v1 but absent from every bucket** |
| §1: "this document does not mint new ones in those namespaces" | **honored** | Same scan: 44 `FR-*`/`NF-*`/`C-*` definitions in this spec, **0 absent from v1**. `FR-A5a`/`FR-A5b` are gone, renamed into the `P0-*` namespace as `P0-5`/`P0-6` |
| §1: the v1 principle namespace is `P1`–`P9` | **honored** | grep of v1 for `^- \*\*P[0-9]` → 9 hits, Read; spec:9 now writes `P1`–`P9` |
| The disposition each requirement is given is **correct** | **violated (≥ 7 rows)** | Per-requirement text comparison across all 38 declared-unchanged rows — see S1 |
| Every internal identifier reference resolves | **honored** | Scan of 99 defined identifiers against every boundary-anchored reference: **0 dangling**; the 17 unresolved names are all v1 identifiers referenced by §2/§3/P0-1 in the act of dispositioning them |

---

## Critical & Serious Findings

**No Critical findings** — the full inventory was Read or Grep-verified per Compliance Gate
B, and no violation of Critical classification was observed.

---

### S1 — §3's "in force unchanged" disposition is false for at least seven of its thirty-eight rows, and in three of them the document's own decision records state the change §3 denies · **Serious · Systemic · new**

**What the spec does now.** §3 (spec:91–93) states its own purpose: *"The v1 spec carries 65
`FR-*`/`NF-*`/`C-*` requirements. Each has exactly one Phase 0 disposition below, **so a
reader can tell a deliberate exclusion from an omission without diffing the two
documents**."* It then lists 38 requirements as *"In force in Phase 0, unchanged"*
(spec:95–99), 10 as narrowed (spec:101–114), and 17 as deferred.

**How that claim was verified — proactive scan across the full inventory scope.** A
deterministic script extracted the full body text of every `FR-*`/`NF-*`/`C-*` definition
from both spec files at `93de2c2` and printed the v1 text against the Phase 0 text for each
of the 38 declared-unchanged rows. Each divergence below was then confirmed by Read of both
files at the cited lines at drafting time. The arithmetic of §3's partition is **correct**
and is credited separately (*What's Actually Good* 2) — this finding is about the
disposition column, which is a different claim from the coverage claim.

**Group A — §3 says "unchanged"; §13 says changed.** These three are unarguable: the
document contradicts itself between two of its own sections.

| Requirement | v1 text (Read) | Phase 0 text (Read) | The document's own decision record |
|---|---|---|---|
| **FR-L6** | *"Human statements **in chat** are recorded as facts with human provenance"* (v1:—, Read in the extracted block) | *"Their Phase 0 entry channel is **the CLI** (§12)"* (spec:244–247) | **P0-D-2** (spec:503–506): *"FR-L6's v1 input is a statement made in the session, and the session reader is Phase 1."* An input-channel substitution, stated as such. |
| **FR-A6** | *"below a configurable minimum of mined history **per region**"* — **one** floor | *"**Two**, because a thin corpus and a thin region silence for different reasons… corpus-level… below 200 mined transactions; region-level… below 20"* (spec:327–332) | **P0-D-7** (spec:523–528): *"The corpus floors are separate from the evidence floor, and **there are two of them**."* A second floor granularity that v1 does not have. |
| **FR-A7** | *"only highest-confidence **genres** speak"* — set left open | *"only the highest-confidence candidates speak: the generated and vendored warnings… and coupling **at the P0-5 warn-grade floor** rather than the looser suggestion grade"* (spec:333–336) | **P0-D-8** (spec:529–535): *"FR-A7's Phase 0 set is coupling at the warn-grade floor, **not coupling generally**."* A restriction of the admitted set. |

**Group B — clauses dropped or added with no record anywhere.**

| Requirement | What changed | Consequence |
|---|---|---|
| **C-3** | v1 (`v1:740–743`, Read) has two clauses: *"all harness-specific knowledge lives in the shims, **and the service speaks a harness-neutral event contract** (this is also what keeps subagent and other-harness support open)."* Phase 0 (spec:475) keeps only the first. | The harness-neutral event contract is the property that keeps FR-O6's subagent path and C-5's drift-degradation coherent. It is now in force nowhere. |
| **FR-K1** | v1 (`v1:344–348`, Read) reads *"Incremental; **index content per `[RETHINK §4 T2]`**"* — a normative incorporation of RETHINK's Tier 2 list, which includes **entry points** (`RETHINK.md:133`, Read). Phase 0 (spec:212–213) replaces it with a bare trailing citation. | See M3 — two criteria test for entry points that no requirement now mandates indexing. |
| **FR-X2** | v1 permits *"clearly delimited quotations **or** pointers."* Phase 0 (spec:409–415) makes *"Pointer-only… the default for every repository-derived span,"* permitting inline quotation only for mechanically-generated content. | A deliberate tightening — and the correct one (it closed the prior round's M4). It is a narrowing, and belongs in the narrowed table. |
| **FR-D1** | v1 carries a normative clause Phase 0 drops: *"Guidance must carry enough for the reader to assess what the problem is and why `[JOHNSON-13]`."* | Either it is in force (and §4's source attestation is false — see M1) or it is not (and §3 is false). |

**Which standard it violates.** §3's own stated purpose, quoted above — a reader who trusts
the "unchanged" column and does not diff the two documents is misled in exactly the way §3
promises to prevent. Secondarily ISO/IEC/IEEE 29148 *consistent*: a specification must not
assert two incompatible things about the same requirement, which Group A does across §3 and
§13. Tertiarily, the collapse log's standing instruction added **by this very fix-diff**
(`collapse-log.md:22–35`, Read): *"Treat any newly-added summary, table, partition or
namespace rule as the first thing the next round verifies, not the settled part."*

**Why it matters, specifically.** This is the document an architect is about to design
Phase 0 from, and §3 is the only place that says what is in force. An architect who reads
"FR-L6 — unchanged" designs a chat-based intake and discovers at build time that the reader
is Phase 1. One who reads "FR-A6 — unchanged" implements one floor and fails AC-4's
corpus-floor clause. One who reads "C-3 — unchanged" has no harness-neutral event contract
to design against. The prior round's S2 was this same defect at FR-A5; the fix moved FR-A5
and five others into the narrowed table and stopped there, rather than re-deriving the whole
column.

**What correct looks like.** Move all seven into the "In force but narrowed here" table with
the narrowing and its location stated, exactly as the ten existing rows do — e.g.
`| FR-L6 — human statements | v1's in-session chat input is deferred with the transcript reader; the Phase 0 entry channel is the CLI | §6, §12, P0-D-2 |`. For C-3, either restore v1's
harness-neutral-event-contract clause to the requirement text or record its removal as a
narrowing with a reason. Then re-derive the remaining 31 rows the same way — the three in
Group A were found by comparing §3 against §13, and the other four by comparing against v1,
and neither comparison was run when the column was last edited.

---

### S2 — `FR-A3`'s warning-priority clause is still an unsourced genre ranking inside a requirement, and the decision record added to justify it contradicts it · **Serious · recurring**

**What the spec does now.** `FR-A3` (spec:287–291): *"At most one whisper per event, within a
per-session injected-token budget of 2,000 tokens by default, configurable. **Warnings take
priority within that budget, never exemption from it.** `RETHINK.md:175–176` grounds the
hard caps; the priority clause is inherited from v1 and unsourced — see `[P0-D-15]`.
`[P0-D-4]`"*

`P0-D-15` (spec:565–573), added by this fix round, closes with: *"Whether a warning outranks
a coupling whisper under budget pressure is **FR-A5's, per candidate, at runtime**."*

§7 (spec:276–277) states: *"They are ordered by FR-A5's score like any other candidates;
**there is no genre precedence**."*

**How that claim was verified.** Read of spec:287–291, 565–573 and 276–277 at `93de2c2`.
Read of `RETHINK.md:175–176`: *"**Per-trigger and per-session whisper budgets.** Hard caps;
the orientation whisper decays out of consideration once the agent is deep in the work."* —
the priority rule is not in the cited range. Grep of the whole of `RETHINK.md` for `priorit`
(case-insensitive) → **0 hits**; region `:173–182` then Read in full to confirm, per the
project's search-locates/reading-verifies rule. Read of v1 `FR-A3` (`v1:416–419`): the
clause is inherited verbatim from v1, which carries it under `[RETHINK §5]` — the same
non-supporting attribution.

**Which standard it violates.** The collapse log's standing directive, recorded 2026-08-01
(`collapse-log.md:478–485`, Read) as the one failure the owner himself caught: *"no ranking
claim about this tool's purposes, genres, triggers or moments enters any document unless the
owner stated it in those words, quoted and attributed."* Secondarily ISO/IEC/IEEE 29148
*consistent*: `FR-A3` asserts a genre precedence, `P0-D-15` and §7 both assert there is none.

**Why it matters, and why disclosure did not close it.** The prior round offered two
remedies: delete the clause, or keep it as an explicit decision record that states the
ranking is the spec's own, gives the reasoning, and flags for the owner that it is a ranking
he has not made. The fix took a third path — it kept the clause *and* wrote a decision record
saying the ranking is decided elsewhere. That leaves the normative text of a requirement
saying warnings take priority while two other passages say nothing takes priority. An
implementer cannot satisfy both, and the one they will build to is the requirement, because
requirements are what implementations are checked against. Disclosure of an unsourced clause
is not removal of it, and the directive is about the claim's presence, not its annotation.
This is the third round the clause has survived.

**What correct looks like.** Delete the sentence from `FR-A3`, leaving *"At most one whisper
per event, within a per-session injected-token budget of 2,000 tokens by default,
configurable. `RETHINK.md:175–176` grounds the hard caps. `[P0-D-4]`"*, and rewrite
`P0-D-15` to record the deletion and its reason: v1's clause is an unsourced genre ranking,
the ranking function is `FR-A5`'s three-term score evaluated per candidate, and §7 already
states there is no genre precedence. `AC-28` needs no change — it already tests only the
budget-is-hard half. If the clause is instead to be kept, it must go to the owner as a
ranking he has not made, per the standing directive.

---

## Systemic Patterns

**One systemic pattern**, cross-listed from the findings above with its scan.

1. **Attestation devices are falsified by the contents they describe.** Every
   whole-document attestation in the spec was located and independently checked against the
   thing it asserts. Scan: grep of the spec for attestation constructions
   (`Each has exactly one|No source outside|not narrowed|every .* requirement|is not`)
   plus a full Read of §§1–4, yielding **four** whole-document attestation devices;
   each then checked by a deterministic scan or a per-item Read:

   | Attestation | Location | Result |
   |---|---|---|
   | "Each has exactly one Phase 0 disposition" — *coverage* | spec:91–93 | **holds** (38 + 10 + 17 = 65; 0 overlap, 0 orphan either direction) |
   | The same table's *disposition* column | spec:95–99 | **fails** — ≥ 7 of 38 rows (S1) |
   | "No source outside this table is cited, and no requirement depends on one" | spec:175 | **fails** — 7 v1 sources (M1) |
   | "Orientation's landmine arm is **not** narrowed" | spec:84 | **fails** its own criterion (M2) |
   | "this document does not mint new ones in those namespaces" | spec:9–10 | **holds** (0 minted, verified by set difference) |

   **Standard**: the collapse log's standing instruction (`collapse-log.md:508–512`, Read) —
   *"'Every X is Y' under a table is an attestation, and the standing instruction is to treat
   one as a defect on sight"* — raised this round to a named generator by the entry the
   fix-diff itself added (`collapse-log.md:22–35`, Read): *"a device asserting a property of
   the whole document is written once and never re-checked against the document it
   describes, while the individual requirement it was written to fix does get re-checked."*

   **Why systemic rather than three slips.** Three of the five devices fail, and they fail
   the same way: each was re-checked along the axis that is cheap to check (arithmetic, set
   membership, presence of a row) and not along the axis it actually asserts (whether the
   disposition is right, whether a requirement depends on an absent source, whether the
   criterion distinguishes the cases). The two that hold are precisely the two whose only
   axis is mechanical. The generator is not carelessness; it is that a mechanically
   verifiable proxy was substituted for the substantive claim, and the proxy passed.

   **What correct looks like.** For each device, write down the check that would falsify the
   substantive claim and run *that* — for §3, diff every row against v1 and against §13; for
   §4, enumerate the sources every in-force requirement inherits; for §2, apply the stated
   criterion to every arm including the ones not in the table.

**Scans run that returned nothing systemic**, with queries and result counts:

- Quotation integrity: every quoted span ≥ 25 chars (**27 spans**) extracted by quote-pair
  matching over the whitespace-collapsed document and string-matched against four normalised
  sources → **27/27 verbatim**. See *What's Actually Good* 1.
- `RETHINK.md` citation re-derivation: **all 26** `RETHINK.md:` ranges in the spec Read in
  `RETHINK.md` at drafting time → **25 correct**; the one residual (`C-3`) is isolated and
  appears below as m1, not a pattern.
- Requirement-to-criterion coverage, boundary-anchored, over all 50 defined requirements →
  **0 uncovered**.
- Internal cross-reference resolution: 99 defined identifiers vs every boundary-anchored
  reference → **0 dangling**.
- Identifier minting: 44 `FR-*`/`NF-*`/`C-*` definitions in this spec vs v1's 65 → **0
  minted**.
- `grep -nE "architecture|next step|roadmap|to do next|todo"` over the spec → **0 hits**
  (the collapse log's architecture-citation lesson and `CLAUDE.md`'s next-steps rule both
  honored).
- Numeric-source audit: every number stated normatively in §§5–11 traced to a source
  (30 entities → ROSE verbatim; 1.5 s / 3 s → v1 `[D-11]` via §3's unchanged disposition;
  2,000 tokens → `[P0-D-4]`; support 3 / confidence 0.9 → ROSE verbatim; support ≥ 2 →
  `[HH-04]`; 200 / 20 transactions → `[P0-D-7]`; 3 sessions → `[P0-D-4]`/`[P0-D-8]`;
  3 stop-grade whispers → `[P0-D-9]`; 10% → `[P0-D-14]`; 400 tokens → `RETHINK.md:163`
  verbatim) → **0 unsourced**. The prior round's one unsourced number is closed.

---

## Moderate & Minor Findings

### M1 — §4's closing attestation is falsified by §3's own inheritance mechanism: seven v1 sources are absent from the table and in-force requirements depend on them · **Moderate · new**

§4 (spec:175) closes the source table: *"**No source outside this table is cited, and no
requirement depends on one.**"* The table lists eight sources. Verified by grep of both
specs for every `[TAG]` citation and by Read of v1's source table (`v1:103–113`): v1 grounds
requirements this spec places in force in **seven sources absent from §4** — `[HERZIG-13]`
(v1=2 occurrences, phase0=0) grounding `FR-D5`; `[COVERITY-10]` (5/0) grounding `FR-A7`;
`[ASI-26]` (5/0) grounding `FR-K6` and `FR-X4`; `[OWASP-SM]` (2/0) and `[LLM02]` (3/0)
grounding `FR-X1`; `[OWASP-PI]` (5/0) grounding `FR-X2` and `FR-X8`; `[JOHNSON-13]` (4/0)
grounding `FR-D1`. Each of those seven requirements is listed by §3 at spec:95–99 as *"in
force in Phase 0, unchanged"* (Read). The attestation and the disposition cannot both be
true: either these requirements carry their v1 grounding forward — the exact mechanism the
prior round credited for `FR-O3` inheriting v1's `[D-11]` — and §4's sentence is false; or
they do not, and seven requirements are now stated with no source at all, which
`CLAUDE.md`'s engineering standard forbids. Standard: ISO/IEC/IEEE 29148 *consistent*, and
`CLAUDE.md` — *"Every non-trivial new requirement carries a source annotation."* Fix: narrow
the sentence to what is checkable and true — *"No source outside this table is cited by this
document. Requirements carried in force unchanged from v1 retain v1's grounding, including
sources not listed here."* — or restore the seven rows.

### M2 — §2's stated narrowing criterion does not distinguish the landmine arm it narrows from the landmine arm it declares un-narrowed · **Moderate · new**

§2's arm table (spec:75–82) narrows *"Orientation's invariant arm"* because *"Invariant
records (FR-K5) have no **automated** writer in Phase 0; FR-L6 promotion can fill them, but
a session cannot rely on the owner having typed one"*, and narrows *"Warning's landmine
arm"* because *"Landmine records (FR-K4) have no automated writer"*. Two lines later
(spec:84) it states: *"Orientation's landmine arm is **not** narrowed — see §7 and P0-1."*
Verified by Read of spec:75–87, 248–254 and 262: `P0-1` (spec:250–251) states that for
FR-K4 records *"Phase 0's only writer for them is FR-L6 promotion; there is no automated
miner until Phase 2"*, and §7's orientation row lists its evidence as *"index entry points;
**promoted landmine records**"* — the same owner-typed records, with the same sole writer,
that the table's own criterion says a session cannot rely on. `AC-27` (spec:686–688)
confirms the consequence: *"after a full session with no CLI-entered statement they hold no
records."* Standard: ISO/IEC/IEEE 29148 *consistent* — a table that states a criterion and
then exempts a case the criterion covers cannot be audited, which is the function §2's arm
table exists to serve. Note the classification may well be right: the substantive difference
is that §7 *retains* the landmine clause in orientation's content while *dropping* the
invariant clause, which is a coherent distinction — it is simply not the distinction the
reason column gives. Fix: replace the reason columns with the criterion actually in use —
whether §7's content column retains the arm — and state separately, for each arm that
survives on owner-entered records, that it ships silent until the owner enters one.

### M3 — `FR-K1`'s index enumeration omits entry points, which §7 and `AC-9` both require the index to hold · **Moderate · new**

`FR-K1` (spec:212–213) enumerates the structural index as *"files, symbols, import and
reference edges, directory topology, generated/vendored/build-output zones, test topology,
and per-region verification commands"* — **no entry points**. §7's orientation row
(spec:262) states its content is *"2–4 entry points for the task"* on evidence *"**index
entry points**"*, and `AC-9` (spec:623–626) — which names `FR-K1` in its own trace tag —
reads *"A submitted prompt whose **entry points are in the index** yields an orientation
whisper naming them."* Verified by Read of all three, and by grep of the spec for
`entry point` → **2 hits only**, at spec:262 and spec:624, neither of them a requirement.
`RETHINK.md:133` (Read) lists *"entry points"* in the Tier 2 substrate, and v1's `FR-K1`
(`v1:344–348`, Read) incorporates that list normatively — *"index content per `[RETHINK §4
T2]`"* — a clause this document dropped (see S1, Group B). Standard: ISO/IEC/IEEE 29148
*complete* — every acceptance criterion traces to a requirement that obliges the behaviour
it tests; `AC-9` currently tests for an index artifact no requirement mandates building.
This is the shape the collapse log names in the entry added by this fix-diff — *"leaving a
test with no requirement behind it."* Fix: add `entry points` to `FR-K1`'s enumeration, or
restore the normative incorporation — *"Index content is RETHINK §4's Tier 2 list
(`RETHINK.md:130–134`) in full."*

### m1 — `C-3`'s citation points at a line that does not contain the claim, and the claim itself is half of v1's · **Minor · new**

`C-3` (spec:475) reads in full: *"Harness-specific knowledge lives in the shims.
`RETHINK.md:291`."* Verified by Read of `RETHINK.md:291`: *"- **Thin hook shims**: forward
harness events to the daemon; relay whispers"* — a line that ends mid-sentence and states
neither that harness-specific knowledge is confined to shims nor the "no logic" property,
which is on line 292 (*"back as injected context. Shims contain no logic."*). Neither line
carries the confinement claim; v1 grounds the same sentence in `[RETHINK §11]` — the whole
section — which is the honest scope. Standard: citation accuracy, raised to a functional
requirement by this document's reliance on line citation; this is the residual of the class
the prior round's S4 addressed at seven other sites, where the fix widened each range to be
bounded by the supporting text rather than by a line break. Fix: cite `RETHINK.md:291–292`
and restore v1's second clause, giving *"Harness-specific knowledge lives in the shims, and
the service speaks a harness-neutral event contract. `RETHINK.md:291–292`."* — which also
resolves C-3's entry in S1's Group B.

---

## Tentative Findings

No tentative findings — every candidate finding's premise was verified against current
source before it was written, per Compliance Gate B. The four premises most at risk were
each closed by direct instrument, and two of them **changed the finding set**: the hooks
quotations (raw 242,078-byte primary source downloaded and grepped; the two spans that
failed a naive match were confirmed present once markdown link syntax was stripped, so no
finding was written); the ROSE quotations (PDF fetched, 17 pages and masthead confirmed,
text extracted by **two** engines because `pdfminer.six` interleaves the two-column layout —
a single-engine scan would have produced a false finding against a verbatim quotation); the
v1 identifier set behind §3's partition and §1's minting claim (deterministic scan, counts
reported, cross-checked by grep); and the `[D-15]` citation, which a pattern-match would
flag as an architecture-decision citation and which Read of `v1:827` confirms is a v1 §11
spec judgment that `CLAUDE.md` expressly sanctions.

---

## Observations

These carry no standard violation and no severity.

1. **The Clear Thought MCP was unavailable in this session**, as in rounds 1 and 2.
   `metacognitivemonitoring` and `collaborativereasoning` are both mandatory in the review
   skill; tool search returned no matching tools. Both passes were performed manually. The
   metacognitive baseline was drawn before any finding was drafted: the prior review's
   findings, the collapse-hunt's findings, the ROSE text, the hooks contract and the v1
   identifier set all sat on the *inferred* side and were routed through Step 6 before they
   could support a finding — which is what caught the two extraction artifacts recorded
   under Tentative Findings. The three-perspective check (standards discipline, the
   architect who consumes this next, the implementer receiving the findings) changed the
   delivered output in three ways: S1's seven instances were split into Group A and Group B
   so the unarguable ones are distinguishable from the judgment calls; M2 records that the
   document's *classification* may be right while its *stated reason* is not, rather than
   asserting the arm is misclassified; and Recommended Priority separates what blocks the
   architecture from what blocks the exit.

2. **One prior finding's remedy was declined by the owner, and the declination is
   recorded.** The prior round's M5 asked for two edits: routing this spec into
   `CLAUDE.md`'s read protocol, and a line in v1 §12 marking its Phase 0 exit superseded.
   The first is done. `STATUS.md:75–79` (Read) records the second: *"You instructed that the
   v1 spec not be touched, so it was not."* Verified independently — `git diff --stat
   332406c..93de2c2` over the v1 spec path is empty, and grep of v1 for `phase0` → 0 hits.
   M5 is closed against its named standard by the routing half plus §1's precedence rule;
   this note exists so the next round does not re-open a decision the owner has made.

3. **The reviewed artifact was stable throughout this pass.** No commit landed during the
   review. All findings are against `93de2c2`.

4. **`file(1)` reports the ROSE PDF as 10 pages; it has 17.** Recorded because the round-2
   review used page count to confirm the TSE version over the 10-page ICSE 2004 paper, and a
   future round running `file` rather than a PDF library would read that as evidence the
   wrong paper had been fetched. `pypdf` and the nine-fold masthead both confirm 17 pages
   and `IEEE TRANSACTIONS ON SOFTWARE ENGINEERING / VOL. 31 / NO. 6 / JUNE 2005`.

---

## What's Actually Good

Each entry names the property, the standard it is good by, and how the property was
verified.

1. **Every quotation in the document is verbatim against primary source — all 27, across
   four sources.** Property: each quoted span reproduces what the named source says, with
   only the alterations CMOS 17th §13.7 permits (initial capital, terminal punctuation).
   Standard: quotation and citation accuracy, raised to a functional requirement by
   `CLAUDE.md`'s external-facts rule. Verification: every quoted span ≥ 25 characters was
   extracted by quote-pair matching over the whitespace-collapsed document (27 spans),
   Unicode- and whitespace-normalised, and string-matched against four normalised sources —
   `RETHINK.md`, the v1 spec, the ROSE paper (both extractions), and the hooks reference
   downloaded raw at 242,078 bytes. Result: **27/27**. This is the finding the prior round
   rated highest-consequence, fully closed: the load-bearing `PreToolUse` sentence is now
   the source's own words (*"means the hook has no decision to report, so the tool call
   continues through the normal permission flow"*, hooks.md:154 exact), the `PostToolUse`
   interpolation is gone, and §4's confirmation cell now records the method that produced
   the result — *"Downloaded raw 2026-08-01 (242,078 bytes) and string-matched, rather than
   queried for snippets."* That byte count is exact: an independent download today returned
   242,078 bytes.

2. **§3's partition over v1's requirement set is arithmetically exact and non-overlapping.**
   Property: all 65 v1 `FR-*`/`NF-*`/`C-*` requirements are placed in exactly one of three
   buckets, with no duplicate, no bucket member absent from v1, and no v1 member absent from
   every bucket. Standard: ISO/IEC/IEEE 29148 *complete*, and the traceability principle
   that a derived specification accounts for its parent's obligations rather than sampling
   them. Verification: a deterministic script extracted every bolded definition from the v1
   spec (65) and every identifier from §3's three lists (38 + 10 + 17 = 65, after expanding
   the `FR-J1–FR-J5` style ranges), then computed both set differences — **both empty** —
   and checked all three pairwise intersections — **all empty**. The coverage claim is
   sound; S1 attacks the disposition claim, which is a different assertion made by the same
   table.

3. **Requirement-to-criterion coverage is complete: 50 of 50.** Property: every requirement
   defined in §§5–13 is referenced by at least one §14 acceptance criterion or named in
   §14's inspection paragraph. Standard: ISO/IEC/IEEE 29148 §5.2.8 —
   requirements-to-verification coverage. Verification: a boundary-anchored deterministic
   scan (so `AC-10` is not miscounted as a reference to `C-10`) over the 50 requirements and
   every identifier referenced in §14 → **0 uncovered**. The prior round's seven gaps all
   closed by the mechanism its remedy specified: `FR-L1` by the new `AC-29`, `C-1` by
   `AC-31`, `C-5` by `AC-32`, `NF-3` by `AC-25`, and `C-3`, `FR-D4`, `P0-2` by an explicit
   inspection paragraph (spec:711–715) that states the inspection for each. `FR-L1` is worth
   naming specifically: it records the uptake evidence §1 gives as the reason this phase is
   built before Phase 1, and it now has a criterion that checks presence and readability
   without over-claiming a hit-rate judgment.

4. **The document has no dangling internal reference and mints no identifier its own
   namespace rule forbids.** Property: every `FR-*`/`NF-*`/`C-*`/`P0-*`/`AC-*` identifier
   referenced is either defined here or is a v1 identifier deliberately referenced in the
   act of dispositioning it; and no `FR-*`/`NF-*`/`C-*` identifier is minted. Standard:
   ISO/IEC/IEEE 29148 *unambiguous*, and the traceability requirement that a reference
   resolve to exactly one requirement. Verification: deterministic scan over 99 defined
   identifiers against every boundary-anchored reference → 17 unresolved, each confirmed by
   Read to be a v1 identifier cited by §2, §3 or `P0-1`; plus a set difference of this
   spec's 44 `FR-*`/`NF-*`/`C-*` definitions against v1's 65 → **0 minted**. The prior
   round's `FR-A5a`/`FR-A5b` are renamed into the `P0-*` namespace as `P0-5`/`P0-6`.

5. **`P0-3` states the gap between the owner's ruling and the mechanism, instead of writing
   around it.** Property: the requirement records that `Stop` fires whenever Claude finishes
   responding rather than only at a completion claim, that recognising the latter needs the
   Phase 1 transcript reader, and that Phase 0 therefore holds `[OWNER-12]`'s accepted turn
   cost *without* the discrimination the ruling was about — then bounds what it cannot
   discriminate (delta defaulting to zero, ≤ 3 stop-grade whispers per session, both
   suppressions and deliveries recorded). Standard: ISO/IEC/IEEE 29148 *verifiable* and the
   project's own hollow-decision test — the mission-need is named, the mechanism that cannot
   yet serve it is named, and the residual is bounded and counted rather than assumed away.
   Verification: Read of spec:342–356 against `RETHINK.md:363–399` (Read, decision 12 and
   its "what this does not license" clause), against hooks.md:154 and the `Stop` row
   (*"When Claude finishes responding"*, string-matched), and against `AC-30` (spec:696–699)
   and `P0-4` (spec:449–453), which report both quantities. This is the one place in the
   document where an unresolvable gap is stated as a gap and priced, which is the behaviour
   the collapse log has been asking for across three sessions.

---

## Convergence Record

**Round number**: 3 (second Post-fix round), matching Scope and Inventory.

**Trajectory** (findings by severity, per round, from each round's mechanical verdict
breakdown):

| Round | Total | Critical | Serious | Moderate | Minor |
|---|---|---|---|---|---|
| R1 (`3edc61f`) | 20 | 2 (1 Systemic) | 7 (1 Systemic) | 8 | 3 (1 Systemic) |
| R2 (`332406c`) | 14 | 0 | 5 (1 Systemic) | 5 | 4 |
| R3 (`93de2c2`) | **6** | **0** | **2 (1 Systemic)** | **3** | **1** |

**Flow counts for this round**, from the Step 9 provenance classifications:

- **Prior findings closed: 13** — S1, S2, S3, S4, M1, M2, M3, M4, M5, m1, m2, m3, m4.
- **New findings: 5** — S1, M1, M2, M3, m1.
- **Recurring findings: 1** — S2 (prior S5, same clause, same standard).
- **Regressions: 0.** No finding this round was introduced by a round-2 fix. This is the
  first round of the three with a regression count of zero, and it is the metric that had
  been the project's weak point: R1's fixes produced two of R2's findings.

Closure evidence per closed finding, each re-derived from current source:

| R2 finding | Closure evidence at `93de2c2` |
|---|---|
| **S1** — both hooks quotations inaccurate; the load-bearing one absent from the source | Full 27-span quotation scan → 27/27 verbatim. spec:157–158 now carries hooks.md:154's own words (*"means the hook has no decision to report, so the tool call continues through the normal permission flow"* — exact) and hooks.md:154's second sentence (*"the hook can deny the call, but staying silent doesn't approve it"* — exact); spec:160–161's interpolation is gone (*"String added to Claude's context alongside the tool result."*, hooks.md:1756, exact). §4's method line now states the raw download; the byte count it claims (242,078) matches an independent download today. Closed against citation-accuracy, its originally named standard. |
| **S2** — `P0-D-6` claimed the three-term bar as this document's | `P0-D-6` (spec:518–522) now reads *"FR-A5's three-term product is v1's, not this document's"* and cites `v1:895–901` (Read, verbatim). `FR-A5` (spec:296–303) carries all three model-free computations — `materiality` → genre base weight, `structural_weight` → deterministic, marginal value → v1's `self_serve_cost`, quoted verbatim. §3 moved `FR-A5` into the narrowed table (spec:108). All three remedies applied. |
| **S3** — §1's namespace declaration false; two minted `FR-*`; unsourced support ≥ 2 | Set-difference scan → **0 minted**; `FR-A5a`/`FR-A5b` renamed `P0-5`/`P0-6`. §1:9 now writes `P1`–`P9` (v1's actual principle namespace, 9 hits, Read). `[HH-04]` restored to §4 (spec:138) and cited at the floor (spec:321–322). |
| **S4** — seven requirements with no criterion and no inspection list | Boundary-anchored coverage scan → **0 uncovered** of 50; inspection paragraph added (spec:711–715) naming `C-3`, `FR-D4`, `P0-2` with the inspection stated for each; `FR-L1` → `AC-29`, `C-1` → `AC-31`, `C-5` → `AC-32`, `NF-3` → `AC-25`. |
| **M1** — ROSE cost mislabelled "recall" | `P0-5` (spec:313–318) now reads *"**Its cost is coverage, not quality**"* and quotes the full passage including *"the average recall is about 75 percent"* and *"for those cases where ROSE issues a warning, it predicts 75 percent of the items that are actually missing"* — both string-matched verbatim against the pypdf extraction. |
| **M2** — `SessionEnd` budget omitted; timeout default unqualified | §4 (spec:163–169) now states the per-handler-type defaults (600 s command/http/mcp_tool, 30 s prompt, 60 s agent; `UserPromptSubmit` lowers the first group to 30 s) and the 1.5-second `SessionEnd` shared budget with the raise-to-match clause — all matched against hooks.md:343. `C-2` (spec:470–474) requires `init` to write an explicit `SessionEnd` timeout; `AC-6` (spec:614–615) accounts for it as written content. Grep for `10 minutes` in the source → 0 hits, and the claim is gone from the spec. |
| **M3** — `P0-D-4` asserted values `FR-A7` did not carry; `FR-A6` had none | `FR-A7` (spec:333) → *"first 3 sessions (configurable)"*; `FR-A6` (spec:329–331) → 200 corpus / 20 region, both configurable; `P0-D-4` (spec:510–513) extended to cover all three. Read. |
| **M4** — harness injection defence defeats `FR-X2`'s chosen mitigation | §4 (spec:170–173) records the behaviour, string-matched against hooks.md; `FR-X2` (spec:409–415) makes pointer-only the default with the reason stated; `FR-D2` (spec:365–367) takes the mechanical grounding. This is the collapse log's own resolution, applied. |
| **M5** — spec unreachable from the reading protocol; v1 exit uncorrected | `CLAUDE.md` read-list item 3 and a new information-policy row both name this spec and state the precedence (Read, and confirmed in the diff). The v1-side half was declined by the owner — see Observation 2. Closed against *"keep documents in sync"* by the routing half plus §1's precedence rule. |
| **m1** — §2's lead-in attestation falsified by one row | spec:57–58 now reads *"each with the phase that owns it, **or the reason its phase is unresolved upstream**"*. Read. |
| **m2** — `C-1` permitted network `FR-X5`/`AC-14` forbid | `C-1` (spec:462–465) scopes the allowance to installation and adds *"The running oracle — indexing included — opens no connection at all (FR-X5)"*. Read. |
| **m3** — `FR-X5`'s citation over-attributed a network claim | `FR-X5` (spec:419–423) scopes `RETHINK.md:321–323` to the read-only clause and attributes the network and tool-authority clauses to `[LLM01]` via `[P0-D-11]`. Read against `RETHINK.md:321–323`. |
| **m4** — one record-type reason offered for six items, one of them a token cap | §2 replaced with a six-row table giving each arm its own reason (spec:75–82), plus a separate paragraph stating the token cap is **retained** and why removing it would loosen rather than narrow (spec:84–87). Read. |

**Tripwire evaluation — NOT FIRED.** Arithmetic shown:

- *Condition (a)* — new + regression ≥ closed, for two consecutive Post-fix rounds. This
  round: 5 + 0 = **5**; closed = **13**; 5 ≥ 13 is **false**. Prior round: 0 + 1 = 1;
  closed = 11; 1 ≥ 11 is **false**. Neither round satisfies the condition, so the
  two-consecutive requirement fails on both counts.
- *Condition (b)* — total findings not strictly decreased, for two consecutive Post-fix
  rounds. R1 → R2: 20 → 14, a **strict decrease**. R2 → R3: 14 → 6, a **strict decrease**.
  Neither round satisfies the condition.

Neither condition holds. The fix cycle is converging strongly: thirteen closures against
zero regressions, the total down 70% across two rounds, and every remaining finding
concentrated in one named generator. Another fix round is the indicated path, not
foundational rework.

---

## Recommended Priority

Ordered by engineering consequence, not by effort.

**Blocks the architecture — fix before any design work begins.**

1. **S1 — re-derive §3's disposition column, row by row, against both v1 and §13.** This is
   first because §3 is the only place that tells the architect what is in force, and it is
   currently wrong about the intake channel for human facts, the number of evidence-corpus
   floors, the genre set admitted in a project's first sessions, and the existence of a
   harness-neutral event contract. Start with Group A: three rows where §13 already states
   the change, so the correction is mechanical. Then run the comparison for the other 31
   rows — the check is a text diff against v1 plus a read of every `P0-D-n`, and it has
   never been run.
2. **M3 — put entry points back into `FR-K1`.** One clause, and it is what `AC-9` tests for.
   Restoring the normative incorporation of RETHINK §4's Tier 2 list fixes this and one of
   S1's Group B rows at the same time.

**Blocks approval and trust.**

3. **S2 — delete the warning-priority clause from `FR-A3`** and rewrite `P0-D-15` to record
   the deletion. It is the third round for this clause, it now has a decision record that
   contradicts it, and it is the one item on this list that gets harder to remove with every
   document that consumes `FR-A3` — the architecture is next.
4. **M2 — replace §2's arm-table reason columns with the criterion actually in use.** The
   classification is probably right; the reason given cannot produce it.

**Blocks the exit.**

5. **M1 — narrow §4's source attestation to what is true**, or restore the seven inherited
   sources. One sentence either way.
6. **m1 — widen `C-3`'s citation to `291–292` and restore v1's second clause.** One line,
   and it closes the last residual of round 1's citation-range defect.

One process note for whoever executes this: per `CLAUDE.md`, apply **all** findings, and
re-enter review as a Post-fix round whose inventory is this review's inventory plus the fix
diff plus these six findings as closure items. This round produced **zero regressions**,
which is new for this artifact — the practice that achieved it (re-deriving each fix against
primary source rather than against the review's description of the defect) is worth keeping
explicitly, because every prior round lost findings to fixes. The one thing this round's
fixes did not do is re-check the devices they had installed the round before, which is
precisely the lesson the same commit wrote into `collapse-log.md`; run that check first next
time, not last.

---

Verdict: NEEDS FIXES (6 findings: 1 Serious-Systemic, 1 Serious, 3 Moderate, 1 Minor)
