# Expert Review — Phase 0 spec (`docs/specs/spec-context-oracle-phase0.md`)

**Date**: 2026-08-12 · **Round**: 5 (Post-fix review of a from-scratch rebuild)
**Artifact**: `middleware/context-oracle/docs/specs/spec-context-oracle-phase0.md`, 1,020 lines, working tree.
**Prior reviews of record (closure baseline)**:
`docs/reviews/2026-08-01-round-4-expert-review-phase0-spec.md` — NEEDS FIXES, 9 findings
(2 Serious-Systemic, 4 Moderate, 3 Minor); and
`docs/reviews/2026-08-01-round-4-collapse-hunt-phase0-spec.md` — 16 findings + 10 minors.
**Reviewer**: independent; did not author the document or the rebuild. Every load-bearing
claim re-derived from primary source; no closure imported on the strength of a commit
message or the document's own assertion about itself.

---

## Scope and Inventory

Round 5. Rounds 1–3 were prior rebuilds; round 4 was the third Post-fix review of record.
This is the fourth Post-fix review, so the counter increments to 5.

The dispatch instructed me to trust nothing the document says about itself and to
re-derive every load-bearing claim from primary source. I did. The rebuild is a
from-scratch rewrite that claims to apply the round-4 findings from both the expert and
the collapse-hunt passes.

**Inventory — read in full or verified per axis:**

- [x] `docs/specs/spec-context-oracle-phase0.md` (1,020 lines) — **Read in full.**
- [x] `docs/specs/spec-context-oracle.md` (v1, 1,100 lines) — **Read in full**; §3, §6.1,
  §7, §11, §12, §14 and the "Phase 0's bar" block (`v1:895–901`) re-Read at drafting.
- [x] `RETHINK.md` (399 lines) — **Read in full**; §12 + addenda and every cited range
  re-Read at drafting.
- [x] `CLAUDE.md` — **Read in full** (the engineering standard, information policy,
  collapse test).
- [x] `docs/collapse-log.md` (652 lines) — **Read in full**; the 2026-08-01 round-4 and
  round-3 entries are the named standard for the systemic axis.
- [x] `docs/reviews/2026-08-01-round-4-expert-review-phase0-spec.md` (848 lines) — **Read
  in full**; its 9 findings are closure items, each re-derived from the current file.
- [x] `docs/reviews/2026-08-01-round-4-collapse-hunt-phase0-spec.md` (1,077 lines) —
  **Read in full**; its 16 findings + 10 minors are closure items, each re-derived.
- [x] **Claude Code hooks contract** — `code.claude.com/docs/en/hooks.md` **fetched raw
  2026-08-12, 267,242 bytes** (grown from the 242,078 the spec attests for 2026-08-01 —
  the contract has drifted, as C-5 anticipates). Every §4 quotation and every
  OUTPUT-placement fact **grepped and Read in the current source** (evidence below).
- [x] `docs/specs/check-phase0-spec.py` — **Read in full and executed** (the mechanical
  check §3 cites).
- [~] **ROSE (TSE 31(6), 2005)** — not re-fetched this round. The eight ROSE quotations
  were verified verbatim by two independent PDF extractions in each of rounds 3 and 4,
  the P0-5/§4/FR-K2 text carrying them is materially unchanged, and the dispatch's
  primary-source emphasis is the hooks contract and the v1 partition. I relied on the two
  prior independent verifications and spent the primary-source budget on the hooks
  contract (round 4's heaviest axis) and the requirement partition. Disclosed as a scoping
  choice, not a gap silently taken.

**Tooling note.** Clear Thought MCP is unavailable in this session, as in rounds 1–4.
Both the standards axis and the substance/collapse axis were performed manually with the
same framing. Recorded as an observation, not a rigor waiver.

---

## Upstream Contract Verification

The upstream contracts are `RETHINK.md` §12 + addenda (owner's locked decisions, declared
"above this document" at spec:16–17), `CLAUDE.md`, the standing lessons in
`docs/collapse-log.md`, and the v1 spec whose 65 requirements §3 dispositions.

### The Claude Code hooks contract — verified verbatim against current primary source

This is the axis round 4's heaviest finding (F1) lived on: the genre table is a set of
claims about *output placement*, and round 4 established that §4 had verified only the
*input* half of the contract. The rebuild reorganised §4 **by direction** — "what the
harness hands a hook" vs "what the harness does with what a hook returns" — exactly the
countermeasure the collapse hunt prescribed. I re-derived every fact in both halves
against the 267,242-byte current download:

| §4 claim | Current source | Result |
|---|---|---|
| `PreToolUse`/`PostToolUse` context is placed **"next to the tool result"** | hooks.md:948 (placement list) | **verbatim** |
| `UserPromptSubmit` context "alongside the submitted prompt"; `Stop`/`SubagentStop` "at the end of the turn" | hooks.md:947, 951 | **verbatim** |
| context "wrapped in a system reminder … read on the next model request" | hooks.md:931 | **verbatim** |
| `additionalContext` **"Ignored when `permissionDecision` is `\"defer\"`"** | hooks.md:1701 | **verbatim** |
| `"defer"` is a distinct value; "The tool doesn't execute" | hooks.md:1698, 1740 | **verbatim** |
| `last_assistant_message` = "text content of Claude's final response … without parsing the transcript file" | hooks.md:2367 | **verbatim** |
| common-input table directs hooks to `last_assistant_message` on Stop/SubagentStop | hooks.md:706 | **verbatim** |
| on `StopFailure` the same field carries the API error string, not an assistant message | hooks.md:2467 | **verbatim** |
| `UserPromptSubmit` carries the `prompt` field | hooks.md:1266 | **verbatim** |
| `SessionStart.source` ∈ {startup, resume, clear, compact, fork}; "`fork` if you added `--fork-session`" | hooks.md:1069, 963 | **verbatim** |
| `SessionEnd` budget "applies to session exit, `/clear`, and switching sessions via interactive `/resume`" | hooks.md:2924 | **verbatim** |
| subagent tool events "fire the same configured hooks as in the main conversation" with `agent_id`/`agent_type` | hooks.md:264 | **verbatim** |
| exit-0 "no decision to report … normal permission flow"; "staying silent doesn't approve it" | hooks.md:223 | **verbatim** |
| harness screening: "Text framed as out-of-band system commands can trigger Claude's prompt-injection defenses …" | hooks.md:961 | **verbatim** |
| `Stop`/`SubagentStop` accept `additionalContext` for "non-error feedback that continues the conversation" | hooks.md:971 | **verbatim** |
| timeouts 600 (command/http/mcp_tool) / 30 (prompt) / 60 (agent); `UserPromptSubmit` lowers the first group to 30 | hooks.md:415 | **verbatim** |
| `SessionEnd` 1.5-second budget, raised to per-hook `timeout` up to 60 s; plugin timeouts don't raise it | hooks.md:415, 2924 | **verbatim** |

**Every single hook-contract fact §4 depends on is confirmed against current source.**
The one heaviest concern the dispatch named — that §7/§1/P0-D-26 might overclaim the
delivery moment — is resolved cleanly and is the strongest single change in this rebuild:

- §1 (spec:32–37) no longer contains round 4's false universal "*Every whisper … arrives
  at a decision moment*." It now reads "*Every whisper carries a pointer and blocks
  nothing*," and the three pending-edit genres are given the honest qualifier: "*for the
  three genres that fire on a pending edit, immediately after that edit and before the
  agent's next action, which §4 shows is the earliest a non-blocking tool can deliver on
  an edit.*"
- §7 (spec:402–413) records the post-edit position and justifies each of the three genres
  on it (futile-not-destructive for the zone warnings; call-site count, not damage, for
  consequence; undo-before-next-action for all three).
- P0-D-26 (spec:856–866) states the placement rule and closes with the exact honest
  disclaimer: "*the genre table's `Fires on` column names the triggering event, not the
  delivery moment.*"

This is F1 (collapse-hunt) and the F1-adjacent §1 overclaim, genuinely closed, verified
against the source rather than against the document's say-so.

### `RETHINK.md` §12 + addenda — owner's locked decisions

| Decision | Status | Verification |
|---|---|---|
| 3 — No hard blocks, anywhere | honored | FR-O4 (spec:293–297), FR-O4a (298–302), AC-5 (896–899); RETHINK:314–323, :393–399 Read |
| 6 — Two stores, outside the tree | honored | FR-K8 (spec:358–360); RETHINK:330–334 Read |
| 7 — No separate credentials | honored (vacuously; no model call) | spec:443, 705 |
| 10 — Self-observability | honored, and gated by §14/AC-33 | FR-M2 (spec:629–636), P0-D-22; RETHINK:350–354 Read |
| 11 — Agent-led; owner a non-programmer | honored | spec:45–48; RETHINK:355–359 Read |
| 12 — Speak at a completion claim, bounded to one, **not a ranking** | honored, and the "not a ranking" clause is now load-bearing in P0-3 | P0-3 (spec:502–529) against RETHINK:363–399 Read; see Convergence F2 |

Every `RETHINK.md` line citation I spot-checked (mission `:15–24`; non-programmer
`:355–359`; token bound `:163`; marginal value `:53–60`/`:59–61`; bar-ships-high
`:198–199`; latency `:179–181`; whisper format `:187–188`, `:195`, `:196–197`; no-gates
`:314–323`, `:393–399`) resolves to text supporting its claim. §4's row-level attestation
"*every cited range re-verified against current source*" (spec:180) holds on the sample I
re-derived.

### `CLAUDE.md` and the collapse log

- "*The spec does not cite numbered architecture decisions as authority*" — honored;
  `grep architecture` over the spec → the only design-decision citations are `[P0-D-n]`
  (this document's own) and `v1 [D-15]`/`[D-10]` (v1 §11 spec judgments), which the
  standard sanctions.
- "*Numbers without sources don't go in*" — honored; P0-D-4 (spec:721–729) now sorts every
  stated value into v1's and this document's, including the stop-grade cap of 3 that round
  4's F14 found unsorted.
- "*No ranking claim … unless the owner stated it in those words*" — honored; the FR-A3
  warning-priority clause stays deleted (P0-D-15), structural_weight is stated to carry no
  genre term (F12 fix, spec:452–456, 798–810), and every `priority`/`precedence` mention
  is a denial or a record of the deletion.
- "*A device that has been false in every round it has existed should be deleted, not
  corrected*" (collapse-log round-4 entry) — **honored, and this is the pivotal move of
  the rebuild.** §3's "each unchanged row equals v1" attestation, false in four
  consecutive rounds, is **deleted**: spec:117–119 reads "*There is no separate attestation
  that the unchanged rows equal v1: the narrowed table carries every recorded difference,
  and each requirement's own definition is the single place its Phase 0 form is stated,*"
  citing the collapse-log lesson by name. The index the log said to keep (coverage) is
  kept and delegated to a script; the assertion the log said to delete (sameness) is gone.

### v1 spec — the requirement partition (§3)

| Obligation | Status | Verification |
|---|---|---|
| §3 dispositions every v1 `FR-*`/`NF-*`/`C-*` exactly once | **honored** | `check-phase0-spec.py` executed → all 65 disposed, 0 overlap (Phase-0 vs deferred), 0 minted; independently: 21 unchanged + 27 narrowed + 17 deferred = 65 |
| "does not mint new ones in those namespaces" | **honored** | 44 `FR-*`/`NF-*`/`C-*` definitions in this spec, 0 absent from v1 |
| Each unchanged row genuinely preserves v1's meaning | **honored** (one arguable row — m2 below) | Full clause-by-clause diff of all 21 unchanged rows against v1 body text; the eight round-4 offenders (FR-D3, FR-X5, FR-X3, FR-M4, FR-O3, FR-O4a, FR-A4, NF-2) are each resolved — five moved to the narrowed table, FR-M4/FR-O3/FR-O4a's dropped clauses restored verbatim |
| Each narrowed row's stated narrowing is real | **honored** | Spot-verified FR-D3, FR-X5, FR-X3, FR-A4, NF-2 against v1 — each narrowing description matches the actual change |
| Deferred whole; each is a §2 row; none dropped from v1 | **honored** | 17 deferred (FR-A8/A9, FR-J1–J5, FR-S1–S3, FR-K9, FR-L2–L5/L7, FR-M3) each mapped to a §2 out-of-scope row |
| Every internal reference resolves | **honored** | script: 0 dangling; independently, all 18 AC references outside §14 resolve — *and support* (see below) |

**S1/F3, the finding that has recurred at this location for four rounds, is genuinely
closed** — not by re-asserting the sameness check more carefully, but by deleting the
attestation and moving the mis-filed rows. I verified the eight named rows individually:
FR-D3, FR-X5, FR-X3, FR-A4, NF-2 now sit in the narrowed table with accurate narrowings;
FR-M4 (spec:637–639), FR-O3 (spec:287–292) and FR-O4a (spec:298–302) restore v1's dropped
clauses word for word. The FR-X5 regression round 4 flagged (correct in narrowed at
`93de2c2`, wrongly moved back to unchanged) is corrected: FR-X5 is in the narrowed table
(spec:151).

**S2/m7, the AC-renumbering regression, is closed and not reintroduced.** The AC set was
renumbered again (now AC-1..AC-33, contiguous). I extracted all 18 AC references occurring
outside §14 and checked each for *support*, not merely resolution — the axis round 4's S2
turned on. All four round-4 offender sites are fixed (spec:97 `AC-30`/`AC-22`; spec:168
`AC-21`; spec:547 `AC-7`/`AC-31`), and no new stale reference was introduced by this
round's renumber. Seventeen of the eighteen references support their citing sentence
exactly; the eighteenth is the subject of m2 below.

---

## Critical & Serious Findings

**None.** The full inventory was Read or verified per axis, and no violation at Critical or
Serious classification was observed. Every hook-contract fact, the requirement partition,
the AC traceability, and the deletion of the recurring attestation device all hold against
primary source.

## Moderate Findings

**None.**

## Minor Findings

### m1 — §3 attributes a *three-set* partition verification to `check-phase0-spec.py`, which verifies only a *two-set* (in-Phase-0 / deferred) partition · **Minor · new (same generator, one layer out)**

**What the document does.** §3 (spec:111–112): "*That the three sets partition v1's 65
exactly once is checked mechanically by `docs/specs/check-phase0-spec.py` (coverage, no
overlap, no minted identifier).*"

**How I verified.** Read and executed the script. Its coverage/overlap logic is
deliberately two-state: `in_phase0 = expand(disp) − deferred`, and it checks
`in_phase0 ∩ deferred = ∅`. It does **not** parse the "unchanged" list separately from the
"narrowed" table, so it cannot and does not check `unchanged ∩ narrowed = ∅`, nor that the
counts are 21 and 27. Its own source comment states the design: "*the check is two-state
(in Phase 0 / deferred) and survives a relabelling.*" So of the three pairwise-disjointness
relations a three-set partition requires, the script verifies two (both involving
`deferred`) and leaves the third (unchanged vs narrowed) unchecked.

**Why it's a finding, and why only Minor.** The substance holds — I confirmed by hand that
the 21 unchanged identifiers and the 27 narrowed identifiers are disjoint, so the three
sets *do* partition. But §3's sentence attributes to the script a check the script does not
perform. This is the exact generator the collapse log has named four rounds running: an
attestation about a mechanical check, **true on the cheaper axis it runs and overstated on
the axis it asserts**. It is one layer out from round 4 — round 4's instances were false
attestations *in the prose*, all now correctly deleted; this is a slightly inflated
*description of the external check* that replaced them. It is Minor because the underlying
partition is genuinely correct and the parenthetical "(coverage, no overlap, no minted
identifier)" partially discloses the actual checks. Standard: ISO/IEC/IEEE 29148
*consistent*, and the collapse log's standing instruction to record the check that
*falsifies* the substantive claim.

**What correct looks like.** Either (a) narrow the sentence to what the script checks —
"*that the in-Phase-0 and deferred sets cover v1's 65 with no overlap and mint no
identifier is checked mechanically*" — or (b) add the missing assertion to the script
(`unchanged ∩ narrowed = ∅`, and the 21/27 counts) so the three-set claim is the one that
runs. The script already models the harder half; closing this is a five-line addition or a
one-clause narrowing.

### m2 — P0-D-18 cites AC-11 as the detector for a systematic shut-out of the ⚠ channel at a `PreToolUse` edit; AC-11 fixtures the completeness-vs-verification *stop* competition, and no criterion fixtures the warning-vs-consequence *PreToolUse* competition · **Minor · new (residual of round-4 collapse-hunt m8)**

**What the document does.** P0-D-18 (spec:804–810) discusses the competition between a
zone-warning candidate and a consequence candidate at a `PreToolUse` edit, then closes:
"*AC-11 and P0-4's per-genre delivered counts remain the detector for a systematic
shut-out.*"

**How I verified.** Read AC-11 (spec:922–926): it fixtures the **stop-class** competition —
"*Across a multi-stop fixture in which both genres have candidates [completeness and
verification], `status` reports a non-zero delivered count for each.*" It does not fixture a
`PreToolUse` edit in a generated/vendored zone where a warning and a consequence candidate
compete. So the criterion cited to evidence detection of a ⚠-channel shut-out at a pending
edit tests a different competition on a different event.

**Why it matters.** P0-4's per-genre delivered count (the sentence's other citation) is the
real runtime detector and is correctly invoked — a shut-out of the warning genre would show
as a zero delivered count. That part is sound. What is missing is a criterion that
*fixtures* the warning-vs-consequence competition and asserts the ⚠ channel survives it —
and this channel is the one `[OWNER-3]` (RETHINK:314–323) makes load-bearing, ruling that
generated-file protection must ride a whisper rather than a block. Round-4 collapse-hunt m8
raised this; the rebuild added the §7 competition paragraph (spec:415–426, which correctly
cites only P0-4) and closed most of it, but P0-D-18's pairing of AC-11 leaves the
impression the competition is tested when the fixture covers a different one. Standard:
ISO/IEC/IEEE 29148 §5.2.8 — a traceability reference must resolve to the verification item
that verifies the referenced property.

**What correct looks like.** Either drop AC-11 from P0-D-18's sentence (leaving P0-4's
per-genre count, which is the true detector) and note that no criterion fixtures the
PreToolUse zone/consequence competition; or give AC-11 (or a new criterion) a
`PreToolUse`-edit arm in which a warning and a consequence candidate both arise and the
warning's delivered count is asserted non-zero.

---

## Tentative Findings

### t1 — FR-O4 is listed "unchanged" but its Phase 0 text adds an explicit `"defer"` exclusion and a deliverability rationale absent from v1's FR-O4 · **not counted; arguable both ways**

FR-O4 (spec:293–297) bars "*a blocking or deferring decision — `deny`, `block`, or
`"defer"`*" and adds "*Excluding `"defer"` also keeps `additionalContext` deliverable.*"
v1's FR-O4 (`v1:320–322`) bars only "*a blocking decision (§6.1 output discipline).*" By
the document's own membership rule (spec:116–117, "*any Phase 0 difference — a clause
dropped, added, or tightened — puts it in the narrowed table*"), the added `"defer"` clause
and rationale are arguably a narrowing.

I did **not** count this, for three reasons: (1) v1's FR-O4 incorporates §6.1's output
discipline, which bars every `permissionDecision` value, so `"defer"` is already within
v1's meaning — the Phase 0 text makes explicit what v1 covers by reference. (2) `"defer"`
causes "*The tool doesn't execute*" (hooks.md:1740), i.e. it *is* a blocking decision, so
excluding it is faithful to v1's "no blocking decision." (3) Both round-4 passes explicitly
prescribed adding `"defer"` to FR-O4's structurally-absent set (expert M4 fix; collapse m4)
and neither asked to reclassify FR-O4 — so two independent experts treated the addition as
consistent with unchanged status. I record it only because it is the one row where the
document's own added/dropped/tightened rule and its unchanged classification are in visible
tension, and the next reviewer should not have to rediscover that the tension is benign.

---

## Systemic Patterns

**No active systemic pattern.** Round 4's two systemic findings — the attestation generator
(Systemic 1, seven false whole-document attestations) and the id-renumbering-without-
re-derivation (Systemic 2) — are both closed:

- The false attestations are **deleted, not re-asserted**: §3's sameness claim (spec:117–
  119), §4's "*No source outside this table is cited*" completeness clause, FR-K1's "*in
  full*", and C-5's "*No requirement here depends on a harness timeout value*" are all
  gone. I grepped for the generator's signature phrases (`each has|does not mint|string-
  matched|in full|both were checked|lists every|checked mechanically|exactly once`) and
  Read every hit: the survivors are either mechanically true (the mint check, the coverage
  count) or acceptance-criterion "every" clauses (appropriate), with the single exception
  of m1 above.
- The renumber was done cleanly this round: all 18 external AC references support their
  citing sentences.

The one thing worth naming for the next round, and it is *why* this is not a systemic
finding: the generator did not disappear, it moved to its faintest possible form. The
rebuild replaced the deleted prose attestations with a citation to a mechanical script —
the correct move — and the residue is that §3's *description* of the script slightly
overstates it (m1). That is the generator surviving as a one-clause description mismatch
rather than as a document-wide false claim. The collapse log predicted this shape ("*the
dominant class is one layer out from the last one*"); m1 is that class, and it is a Minor,
not a Serious, because the check it describes actually runs and the fact it asserts is
actually true.

**Scans run that returned nothing:**

- Hook-contract facts (input and output halves): 17/17 verbatim against current source.
- Requirement partition: 65 disposed, 0 overlap (Phase-0/deferred), 0 minted; script exit 0.
- AC traceability outside §14: 18/18 resolve, 17/18 support (m2 the exception).
- P0-D references: all 26 recorded and referenced (script).
- Unchanged-row body-text diff against v1: 21/21 preserve meaning (t1 the one arguable).
- Narrowed-row narrowing descriptions: all spot-checked rows accurate.
- `grep architecture|next step|roadmap` over the spec → no authority-citation of
  architecture, no next-steps leakage.

---

## Convergence Record

**Round number**: 5 (fourth Post-fix round).

**Trajectory** (findings by severity per round; R1–R4 from the round-4 expert review's
mechanical breakdown, R5 this review):

| Round | Total | Critical | Serious | Moderate | Minor |
|---|---|---|---|---|---|
| R1 (`3edc61f`) | 20 | 2 | 7 | 8 | 3 |
| R2 (`332406c`) | 14 | 0 | 5 | 5 | 4 |
| R3 (`93de2c2`) | 7 | 0 | 2 | 4 | 1 |
| R4 (`014bc26`) | 9 | 0 | 2 | 4 | 3 |
| **R5 (working tree)** | **2** | **0** | **0** | **0** | **2** |

**Flow counts against the combined round-4 baseline** (round-4 expert 9 + collapse-hunt
16 findings + 10 minors), each re-derived from the current file:

- **Prior findings closed: 25 named findings + the collapse-hunt minors.**
  - Round-4 expert (9/9 closed): S1 (attestation deleted + 8 rows resolved), S2 (refs
    fixed, no regression), M1 (arm-table criterion now the disjunction), M2 (`[CACM-18]`
    restored to §4), M3 (C-5's false timeout sentence deleted), M4 (`"defer"` discard
    recorded in §4 + FR-O4), m1 (FR-K1 "build" restored, "in full" dropped), m2 (C-3 cites
    RETHINK §11 as inference), m3 (settings write attributed to P8's in-tree-write
    exception).
  - Round-4 collapse-hunt (16/16 closed): F1 (post-edit placement recorded; §1 overclaim
    deleted), F2 (stop-trigger narrowing recorded in §3/§2 with continuation-cost reason +
    discriminator + AC-12 false-negative case), F3 (=S1), F4 (v1 line-number pointers
    replaced with "Carried from v1's source table"), F5 (P0-4 full 7-way suppressor
    decomposition; FR-M2 gains budget; AC-33 gains the bar), F5b (§2 row split three ways),
    F6 (read set reconstructed; replay not charged against budget), F7 (all five `source`
    values handled), F8 (marginal-value clause + AC-9 negative case), F9 (causation-vs-
    correlation reason replaces the false "no floor"), F10 (landmine arm admitted to
    FR-A7 window; AC-22 window stated), F11 (non-circular F1-based reason), F12
    (structural_weight stated genre-free + non-inheritance pointer), F13 (`prompt` field
    in §4 and §12), F13b (answer-drift producer corrected), F14 (stop-cap added to
    P0-D-4).
  - Collapse-hunt minors (m1–m10 + carried): all closed; m8 closed with the residual
    carried as this round's m2; Q21 fallback obligation restored to C-1; FR-K7/FR-D2
    rationale restored.
- **Prior findings recurring: 0.** No round-4 finding recurs at the same location against
  the same standard. The four round-4 recurrences (S1, M1, M2, m1/m2) are each closed at
  their location.
- **New findings: 2** — m1 (script-attestation overstatement), m2 (AC-11 shut-out
  citation). Plus t1, uncounted.
- **Regressions: 0.** The FR-X5 regression of round 4 is corrected; the AC renumber
  introduced no new stale reference.

**Non-convergence tripwire — NOT FIRED, decisively.** Round 4 warned both conditions were
"armed on their first leg": if round 5 produced *new + regression ≥ closed* **or** a total
of 9+, the tripwire would route to foundational rework. This round: new + regression =
2 + 0 = **2**, closed = **25**; 2 ≥ 25 is **FALSE**. Total findings = **2**, which is < 9
and a strict decrease from 9. Both armed legs are disarmed. This is the most convergent
round in the artifact's history: closures exceed new findings by an order of magnitude,
the total fell from 9 to 2, and severity fell from 2 Serious to 0.

---

## What's Actually Good

Each entry names the property, its standard, and how it was verified.

1. **Every hook-contract fact §4 depends on is verbatim against current primary source —
   17/17, across both the input and output halves.** Round 4's central lesson was that a
   contract is verified only along the axis the question is asked on, and that §4 had
   checked inputs and inherited outputs. The rebuild reorganised §4 by direction and the
   output half now carries the placement rule that decides four of §7's rows. Verified by
   raw fetch (267,242 bytes) + grep + Read of each cited line.

2. **The round-4 heaviest finding (F1) is closed at the root, not bounded.** The
   post-edit delivery of the three `PreToolUse` genres is recorded (§4, §7, P0-D-26), each
   genre is re-justified on that position, and §1's false universal "arrives at a decision
   moment" is deleted rather than hedged. Standard: ISO/IEC/IEEE 29148 *verifiable*, and
   the project's hollow-decision test — the moment is named honestly and the genre table's
   `Fires on` column is explicitly disclaimed as the trigger, not the delivery moment.

3. **The four-round attestation generator is defeated by deletion.** §3's sameness
   attestation, false in every round it existed, is gone; the coverage index it was
   entangled with is preserved and delegated to a script; each requirement's Phase 0 form
   now lives at exactly one site. This is the collapse log's own prescribed remedy applied
   to the letter, and it is the single most important structural improvement in this
   artifact's history. The residue (m1) is a one-clause description mismatch, not a
   document-wide false claim.

4. **The requirement partition is exact and every mis-filed round-4 row is resolved.**
   21 + 27 + 17 = 65, 0 overlap, 0 minted, script exit 0; the eight round-4 disposition
   errors are each fixed by the correct mechanism (move to narrowed, or restore the dropped
   clause), and the FR-X5 regression is reversed. Verified by execution plus a hand diff of
   all 21 unchanged rows against v1 body text.

5. **AC traceability is clean in both directions after a full renumber.** 33 criteria,
   contiguous, every requirement covered, and every one of the 18 in-body AC references
   supports (not merely resolves to) its citing sentence — the exact axis round 4's S2
   regression exposed, now clean.

---

## Observations

Carry no standard violation and no severity.

1. **`check-phase0-spec.py`'s own docstring self-path is wrong.** Line 11 says "*Run from
   anywhere: `python3 .claude/hooks/check-phase0-spec.py`*", but the file lives at
   `docs/specs/check-phase0-spec.py` (where §3 correctly cites it, and where I ran it). A
   reader following the docstring is sent to a non-existent path. This is inside the helper
   script, not the spec, so it is not a spec finding — but it would waste a minute and is
   trivially fixed.

2. **§4's byte-count attestation is dated and now stale in figure, not in fact.** "*Downloaded
   raw 2026-08-01 (242,078 bytes)*" (spec:182); the current contract is 267,242 bytes. The
   claim is explicitly dated, and every fact it attests to still holds in the current
   source, so this is provenance drift the C-5 re-verification obligation already covers —
   noted so the next reviewer is not surprised by the size change.

3. **§4's `StopFailure` quotation stitches two non-adjacent source strings.** "*When the
   turn ends due to an API error. Output and exit code are ignored*" (spec:207–208)
   combines the event-trigger table (hooks.md:54) with a separate output-handling row
   (hooks.md:823), which in current source reads "*Output and exit code are ignored, except
   `terminalSequence`*." The elision is immaterial to Phase 0 — `StopFailure` is
   observation-only and Phase 0 uses no `terminalSequence` — but the two strings are
   presented as one contiguous quote.

---

## Verdict

**NEEDS FIXES — 2 Minor findings (0 Critical, 0 Serious, 0 Moderate).**

This is a near-pass, and the "NEEDS FIXES" label is a consequence of the project's
apply-all standard rather than of any doubt about the artifact's fitness. Every load-bearing
claim is verified against primary source: all 17 hook-contract facts verbatim, the 65-way
requirement partition exact, AC traceability clean in both directions, and — decisively —
the four-round attestation generator defeated by deletion exactly as the collapse log
prescribed. All 25 named round-4 findings (both the expert and the collapse-hunt passes)
plus the collapse-hunt minors re-derive as **genuinely closed**, with **0 recurring** and
**0 regressions**. The two Minor findings are attestation/citation refinements whose
substance holds: m1 is the house generator surviving in its faintest form (a script
description that overstates a check that nonetheless runs and passes), and m2 is a single
AC citation that resolves to a real criterion testing an adjacent competition. Neither
blocks the Phase 0 architecture.

The non-convergence tripwire does not fire — closures exceed new findings 25-to-2, the
total fell from 9 to 2, and severity fell from 2 Serious to 0. **The artifact is ready for
the architecture phase once m1 and m2 are applied.**
