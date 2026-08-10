# Expert Review — Architecture: APS Fusion MCP Server (Round 17)

## Scope and Inventory

**Round 17** (post-fix; the first review is round 1, the prior completed review is
`docs/reviews/round-16-architecture-review.md`). The inventory is constructed by the post-fix rule
from all four required sources: the prior review's full inventory, the fix-diff files, the
fix-diff files' dependents, and the prior review's findings as closure items.

**Fix-diff.** `git diff HEAD -- docs/architectures/architecture-aps-fusion-mcp-server.md`: one
file, +186/−96. No commit has been made since before round 13 (`HEAD` = `f1e58a9`, 1,482 lines),
so that diff spans the edits of rounds 13 through 17; the working tree is 1,572 lines.
**Round 17's own edit was isolated two independent ways, and the two agree:**

- *Section-offset comparison.* Round 16 recorded its working tree at 1,559 lines with these
  `## ` heading positions: Design decisions 217, Threat model 1346, ASVS 1387, Traceability 1407,
  Limitations 1446, Standards 1511, Status 1545. Scripted extraction of the current tree gives:
  Design decisions 217, Threat model **1353** (+7), ASVS **1394** (+7), Traceability **1414**
  (+7), Limitations **1453** (+7), Standards **1524** (+13), Status **1558** (+13). So this round
  added 7 lines inside Design decisions and 6 more inside Limitations, and changed nothing
  outside those two regions by line count; 1,559 + 13 = 1,572, which is the observed length.
- *Provenance greps* (counts run against both the extracted `HEAD` object and the working tree,
  compared with the counts round 16 recorded in its own tree): `segment-wise` — 0 in `HEAD`, 3 in
  round 16's tree, **0 now**; `deliberate exception to D6` — 0 / 1 / **0 now**; `URL-encoded` — 0
  in `HEAD`, **0 in round 16's tree** (round 16 recorded that the phrase "appears nowhere in the
  artifact"), **2 now**; `D6 governs, unmodified` 0 / **1 now**; `Limitation 8(c)` 0 / **2 now**;
  `two-sided` 0 / **2 now**; `boundary zod validation of every tool argument` 0 / **1 now**;
  `classified failure handling` 0 / **1 now**. The round-16 counts are a prior-document claim and
  are used only to locate the edit; every finding and closure below is re-derived from current
  source.

Round 17's edit is therefore: D27's Decision slot rewritten (the path-composition exception
removed, both sides of the vendor record stated, D6 restored as governing), D27's Premise slot
extended, D28's summary sentence updated to match, Limitation 8 extended with item (c), `S-3`
added to D8's header, `S-8` added to D17's header, and D8/D17 added to the T1/T3/T5 threat rows.

**Dependents of the fix-diff file: none exist.** The artifact is a markdown design document,
nothing imports it, and the `src/` tree it specifies has not been created. Recorded rather than
assumed — see the tool plan. `git status --short` lists five other modified paths
(`package.json`, `src/constants.ts`, `src/index.ts`, `src/services/aps-auth.ts`,
`src/tools/mfg-data-model.ts`) and four untracked review documents; the modified source files are
the untouched predecessor's pre-existing working-tree state, not this revision's product.

| # | File | Status |
|---|------|--------|
| 1 | `docs/architectures/architecture-aps-fusion-mcp-server.md` | [x] Read in full, 1,572 lines (three passes: 1–614, 614–1113, 1113–1573), plus targeted re-Reads at 344–377, 1193–1272 and 1550–1557 at finding-drafting time |
| 2 | `docs/specs/spec-aps-fusion-mcp-server.md` | [x] Read in full, 638 lines |
| 3 | `.claude/skills/expert-architecture/SKILL.md` | [x] Read in full, 581 lines — the authoring contract that produced the artifact and one of its governing standards; item-by-item conformance is in Upstream Contract Verification |
| 4 | `HANDOFF.md` | [x] Read at lines 10–18 — the spec's "passed five independent blinded rounds with zero findings" record, cross-checked against the artifact header's characterisation |
| 5 | `docs/reviews/round-16-architecture-review.md` | [x] Read in full, 693 lines (prior finding list and closure items; provenance source only) |
| 6 | `docs/reviews/round-15-architecture-review.md` | [x] Grep-verified — verdict line at :551 (`NEEDS FIXES (1 finding: 1 Serious-regression)`), trajectory at :446, finding header at :153; plus the Express-default passages at :404–407 and :494 |
| 7 | `docs/reviews/round-14-architecture-review.md` | [x] Grep-verified — verdict at :675 (3 findings), trajectory at :556, three finding headers enumerated; plus the Express-default passages at :384–413 |
| 8 | `docs/reviews/round-13-architecture-review.md` | [x] Grep-verified — verdict at :580 (`3 findings: 2 Moderate, 1 Minor`), trajectory at :470, three finding headers; plus the Express-default confirmation at :458–460 |
| 9 | `docs/reviews/round-12-architecture-review.md` | [x] Grep-verified — verdict at :177 (4 findings), trajectory `R9: 6 → R10: 4 → R11: 6 → R12: 4` at :148, and the R11#2 body-limit closure note at :154 |
| 10 | `docs/aps-mfg-schema.json` | [x] Programmatically introspected via Node — **66 assertions machine-checked, 65 pass** (the one non-pass is a property of the dump file, not a claim the artifact makes; see Observations). Covered: 209 types; `Item`/`ItemVersion` field lists and `possibleTypes`; all four concrete Item types; `ComponentVersion`, `DesignItemVersion`, `ConfiguredDesignItemVersion`, `ConfigurationTable`, `ConfigurationRow`, `Occurrence`, `ItemFilterInput`, `Properties`, `ItemVersions`, `DerivativeInput`, `ItemCompositionEnum`, `OutputFormatEnum`; global carrier sweeps for `fusionWebUrl`, `tipRootComponentVersion`, `tipConfigurationTable` and `ComponentVersion`-typed fields; full argument lists for `item`, `itemsByFolder`, `itemsByProject`, `foldersByProject`, `foldersByFolderInHub`, `itemVersions`, `componentVersion`, `ComponentVersion.derivatives`, `ComponentVersion.allOccurrences`; all eight named mutations |
| 11 | `package.json` | [x] Read via `require` — `@modelcontextprotocol/sdk ^1.29.0`, `express ^5.2.1`, `zod ^4.3.6`; `version: "1.0.0"` |
| 12 | `package-lock.json` | [x] Verified present, 46,359 bytes |
| 13 | `src/constants.ts` | [x] Grep-verified — v2 "will be deprecated soon" banner, `/mfg/v3/graphql/public`, ComponentVersion removal at :9–10 |
| 14 | `src/index.ts` | [x] Grep-verified — `app.post("/mcp", …)` at :71, `app.use(express.json())` at :45, hardcoded `version: "1.0.0"` at :22, no auth middleware on any route |
| 15 | `src/services/aps-auth.ts` | [x] Grep-verified — `clearTokens()` defined :38, called :119 in the refresh failure path; `isAuthenticated()` → `currentTokens() !== null` at :145–146; grep for `code_challenge\|codeChallenge` across `src/`: **0 hits** |
| 16 | `src/services/aps-client.ts` | [x] Grep-verified — `export function urnToBase64` at :38 |
| 17 | `src/tools/mfg-data-model.ts` | [x] Grep-verified — `truncateIfNeeded` at :30; `readOnlyHint: true` at :480 in the same tool as `generate: true` at :497 (annotation block Read at 476–500); bare-quote `componentVersionId: "${component_version_id}"` at :590 |
| 18 | `src/tools/model-derivative.ts` | [x] Grep-verified — second, divergent `function truncate` at :9 |
| 19 | `docs/apsq.mjs` | [x] Verified present, 2,927 bytes |
| 20 | `C:/Users/maxco/.aps-fusion-mcp/tokens.json` | [x] Read — literal `null`; the credential is cleared, independently confirming the blocker Limitations 8(b) and 8(c) both name |
| 21 | `HEAD:…/architecture-aps-fusion-mcp-server.md` (git object) | [x] Extracted (1,482 lines); eight provenance phrase-counts run across it and the working tree to isolate this round's edit |

**Tool plan (Step 3).** Instruments available and exercised: Read; Grep; Bash/Node (a GFM-escape-
aware markdown table parser, a programmatic GraphQL introspector, a decision-slot and
header-requirement extractor, a mechanical evaluator of the threat model's own stated join, and
config-key/standards-tag/residue sweeps); Context7; Clear Thought
(`metacognitivemonitoring` at start, `collaborativereasoning` before the gates); git.
Claim-type mapping — absence claims → grep and programmatic schema queries; literal-content
claims → Read at file:line; library- and vendor-API-behaviour claims → Context7
(`/websites/aps_autodesk_en`, `/modelcontextprotocol/typescript-sdk/v1.29.0`,
`/websites/tailscale`, `/expressjs/express`, `/colinhacks/zod`); structural and blast-radius
claims → the region-isolated fix-diff plus the recorded observation that the artifact has no
importers; prior-document claims (rounds 12–16's findings and trajectories, `HANDOFF.md`'s
assertions, and the artifact's own premise slots) → re-derived from current source.
**CodeGraph and codebase-RAG were not exercised, and this is not a verification gap:** every
structural question in this review's scope is either an absence claim or a literal-content claim,
which Step 3 assigns to grep/Read rather than CodeGraph, and the architecture specifies a
greenfield `src/` tree that does not yet exist. No instrument class was unavailable for a
load-bearing claim category, so no halt condition arose.

**Rigor waivers.** None. No compression was requested or applied.

## Summary

**This review returns NEEDS FIXES (1 finding: 1 Moderate).** Both of round 16's findings are
closed against the standards they originally named, and both closures were re-derived rather than
relayed: the threat model's own stated join now computes to **zero violations across all eight
threat rows under both readings of "declares"**, and D27's path-composition rule has been
withdrawn in favour of D6 governing unmodified, with both sides of the two-sided Model Derivative
vendor record recorded and the unresolved wire-format question moved to Limitation 8(c) with a
named closing check — which is the simpler and safer of the two resolutions round 16 identified.
This is the first round in three in which the fix produced no regression at its own site. The
document's internal accounting came through the edit intact under independent re-derivation: 37
inventory rows reconcile against every prose enumeration, 60 spec requirements map to 60 distinct
traceability entries with zero duplicates and zero empty cells, all 28 decisions carry all five
slots, 7 tables parse clean, every `D#` reference resolves, no spec identifier is invented, and 65
of 66 programmatically-checked MFG schema assertions hold with the one non-pass being a property
of the dump file rather than a claim the artifact makes. The single finding is older than this
round and sits away from it: D3 rests a load-bearing Express behaviour claim on a bare
"(verified)" with no library, version or date, the claim is absent from D3's own Premise slot, and
the Standards table's Express row attributes Express to D11 alone — so there is no path in the
document by which a reader can answer how the figure was established. The figure itself is
correct; only its provenance is missing.

## Upstream Contract Verification

The upstream artifacts are the spec (`docs/specs/spec-aps-fusion-mcp-server.md`) and the authoring
contract (`.claude/skills/expert-architecture/SKILL.md`). The artifact is a design document, so
the spec's acceptance criteria are not executable at this phase; what is checkable is requirement
coverage, requirement *satisfaction*, and contract conformance. All three were checked, the first
two mechanically.

**Spec requirement coverage — PASS.** Requirements were counted independently from the spec's own
declaration forms by regex over `^- \*\*(R-[A-Z]+-\d+)\.` and `^- \*\*(S-\d+)`: **46 R-numbers +
14 S-numbers = 60 distinct**. The traceability matrix (artifact lines 1416–1449) was then parsed
with a GFM-escape-aware cell splitter: 5 columns, 32 rows, **60 requirement entries, 60 distinct,
zero duplicates, zero empty decision cells**, set-differenced to **zero missing and zero extra**
against the expected 60. The artifact's "60 spec requirements" claim (Goal line 23; Status line
1563) is correct.

**Spec requirement satisfaction — PASS.** Coverage of the matrix is not satisfaction of the
requirements it maps; all 60 were walked against the decisions and tool rows each is mapped to.
All 60 are satisfied. Spot-checks with their verification: **R-EXPORT-3/5**'s retrieval clauses
are served by tool 37 (`aps_md_get_derivative`, row at :177) returning the signed download URL,
its cookies, size, content type and expiry — the backing endpoint re-confirmed this round via
Context7 `/websites/aps_autodesk_en`, 2026-07-30, which returns exactly
`{etag, size, url, content-type, expiration}` plus three `Set-Cookie` headers. **AC-7**'s path is
runnable end-to-end: tool 36 uploads foreign CAD through D23's DM pipeline, tool 23 translates,
tool 24 yields the derivative URN, tool 37 retrieves. **R-PROTO-1**'s "exactly the capabilities it
implements" is pinned at D3 (`tools` only, `listChanged: false`, no resources/prompts/logging/
completions). **R-DISC-4** is satisfied by the three-disposition partition, verified below.
**R-READ-6**'s composition selection is backed by `Query.item(composition: ItemCompositionEnum)`
with values `WORKING, RELEASED, AS_SAVED, LATEST` — confirmed by schema introspection.

**Acceptance criteria.** By set-difference of `AC-[0-9]+` occurrences across both documents, the
spec declares AC-1..AC-27 and the architecture cites **22 of them**, never citing AC-1, AC-2,
AC-3, AC-4 or AC-17 — unchanged from rounds 14, 15 and 16. That is **not** a contract violation:
the authoring contract requires the traceability matrix to account for every R# and Q#, not every
AC, and each of those five ACs cites requirements that are themselves traced. Recorded so the
reader can audit the gap rather than discover it.

**Cross-reference integrity — PASS, checked mechanically.** 28 decisions defined, 28 referenced,
**zero dangling `D#` references and zero decisions defined-but-never-cited**. Every `R-…`, `S-…`,
`AC-…`, `C#`, `T#`, `M-#`, `Q-#` and spec `D-#` identifier cited in the architecture exists in the
spec (46, 14, 22, 8, 8, 3, 3, 7 respectively; **zero invented**).

**Authoring-contract conformance — checked item by item, mechanically where possible.**

- *Required sections.* All eleven present, by scripted extraction of `^## ` headings: Goal (21),
  Scope (35), Components and structure (54), Quality characteristics (203), Design decisions (217),
  Threat model (1353), ASVS mapping (1394), Traceability (1414), Limitations (1453), Standards
  (1524), Status (1558). Scope carries all three required subsections (In scope :37, Deferred with
  reasoning :44, Out of scope :50). *Inheritance from existing precedents* is correctly omitted
  with its attestation in Status.
- *Five-part decision format.* Scripted per-decision slot check across D1–D28: all 28 found, every
  one carrying all five slots (`**Decision.**`, `**Standard.**`, `**Why here.**`, `**Not.**`,
  `**Premise.**`). **Zero gaps.** Every Premise slot either cites a source or carries the explicit
  "no factual premises — pure design choice" attestation the contract permits (D13, D18, D24, D25,
  D26 carry the attestation; the other 23 cite).
- *Quality characteristics.* All nine ISO/IEC 25010:2023 characteristics appear in the table
  (205–215), Safety included with its explicit not-addressed reasoning.
- *ASVS.* All fourteen chapters V1–V14 dispositioned across the 12-row mapping table (1399–1412),
  confirmed by scripted set-difference; V1/V10/V11 share one row.
- *Mandatory Clear Thought invocations.* All present or explicitly attested, by scripted sweep:
  `metacognitivemonitoring` (:219), `mentalmodel` / `mentalmodel(first_principles)` (:402, :477,
  :814, :837, :1130, :1159), `decisionframework` (:285, :316, :607, :1315), `structuredargumentation`
  (trace :1317, attestation :1343), `sequentialthinking` (attestation :1311 naming D5/D7/D8),
  `scientificmethod` (:1356, threat model), `collaborativereasoning` (:1303), and
  `debuggingapproach` attested *not* invoked with reasoning (:1347).
- *Gate C structural checklist.* Passes on every mechanical item except one, which is Finding 1:
  Gate C's "Every Context7-verified claim cites what was verified and when (library, version,
  date)" fails at D3's Express premise.
- *Header claims.* The header's disclosure that the spec's own `Status:` line still reads "Draft
  for review" is confirmed (`docs/specs/spec-aps-fusion-mcp-server.md`:3), and `HANDOFF.md`'s
  "passed five independent blinded rounds with zero findings" matches the header's
  characterisation (Read at HANDOFF.md:10–18).

## Critical & Serious Findings

**No Critical or Serious findings** — the full inventory was Read or Grep-verified per Compliance
Gate B, and no violations of Critical or Serious classification were observed. In particular, the
two candidate areas where a Serious finding would have landed were both examined and cleared:
D27's path-composition treatment (closed, see the Convergence Record) and the threat model's
control-column join (recomputed to zero violations, same).

## Systemic Patterns

**No systemic patterns** — verified by the scans below, all run across the full inventory scope
before counting or classifying.

The class that produced Finding 1 was scanned as a class rather than assumed isolated. **The
premise-citation sweep:** every occurrence of `verif` in the artifact was enumerated (grep
`-i "verif"` over the full document, **83 hit lines**), and each was opened against the decision
whose slot would have to carry its citation. **Exactly one instance** — line 350's "Express's
default is **100 kB** (verified)" — has no citation path anywhere in the document. Every other
bare or short "(verified)" marker resolves: line 489's "(verified by schema introspection)" names
its method and D7's Premise cites the on-disk schema; line 655's "(spec §13 Q-1, verified)" is
dated in D11's Premise; line 669's "(workable — verified — …)" is covered by D11's Premise
citation of Context7 `/expressjs/express` for `express.json` verify-callback semantics; line 998's
pino remark is covered by D20's Premise (library, ID, date); line 812's SDK annotation-defaults
remark states what was verified and D14's Premise carries library, version and date. Under the
Step 8 proactive-scan rule, extrapolating a systemic pattern from one verified instance is the
failure that rule exists to prevent, so **Finding 1 is Moderate, not Systemic**.

1. **Threat-model join integrity** (the round-16 class, recomputed rather than re-read). A Node
   script parsed the spec's §8 requirement→threat bindings from the spec source, the threat
   table's own "Via spec requirements" column, each decision's header requirement declaration, and
   the traceability matrix, then computed the join the document says produces its control column.
   *Check A* — the table's Via column against the spec's §8 bindings: **0 violations** in both
   directions. *Check B* — the computed join against the listed control column, per threat:
   **T1 {D1,D2,D3,D8,D28} = listed; T2 {D1,D2,D9} = listed; T3 {D2,D8,D10,D20,D28} = listed;
   T4 {D11}; T5 {D6,D13,D14,D17,D22,D27,D28} = listed; T6 {D10,D20,D28}; T7 {D1,D3}; T8 {D19}
   — 8 of 8 MATCH, zero missing, zero extra.** *Check B2* — the same join recomputed under the
   traceability-matrix reading of "declares" rather than the decision-header reading: **8 of 8
   MATCH.** The Analysis paragraph's claim that the column "cannot drift" is now true as written.
2. **Tool-inventory accounting** (Node parse of all 37 rows, each classified independently from
   its own Class and Returns cells before comparison to the document's prose). Numbering
   contiguous 1..37 ✓. Effect classes **R = 23, W = 11, $ = 3, summing to 37** — matching the
   document's enumeration exactly (MFG-backed 13 {2–12, 22, 35} + Model Derivative 4 {24, 25, 26,
   37} + Design Automation 3 {27, 29, 30} + Webhooks/DM 3 {1, 32, 34} = 23; the stated
   not-R-class set {13–20, 21, 23, 28, 31, 33, 36} = 14; 23 + 14 = 37). W partition **5 destructive
   {13, 16, 17, 19, 33} + 6 additive {14, 15, 18, 20, 31, 36} = 11**, exactly D14's two
   enumerations, with `idempotentHint` inverted across that partition ✓. The three disposition
   sets (cursor-paged {2,3,4,5,6,8,10,11,12,26,27,32,35} = 13, bounded-single-response
   {7,13,24,25,30,31} = 6, merged-source resumable {34} = 1) union to **20 with zero overlap**,
   leaving 17 — the document's stated figures; each of the 17 was opened and independently
   confirmed to return a single object or scalar. Group file counts **1+6+6+9+7+4+4 = 37**. Greps
   for stale totals (`36 tools`, `36 rows`, `of 36`, `all 36`, `38 tools`, `27 decisions`,
   `29 decisions`, `59 requirements`, `61 requirements`) return **zero**. **Zero defects.**
3. **Markdown table integrity** (Node parse of every table block with GFM-correct escaped-pipe and
   inline-code handling, checking each row's cell count against its header and each block's
   blank-line termination): **7 tables, 0 defective rows, 7/7 blank-terminated.** Tables at
   139–177 (6 × 37), 205–215 (4 × 9), 1116–1126 (3 × 9), 1374–1383 (4 × 8), 1399–1412 (2 × 12),
   1416–1449 (5 × 32), 1526–1556 (3 × 29). Round 12's malformed-table class stays closed.
4. **Config-key orphans** (`\b[A-Z][A-Z0-9]*(_[A-Z0-9]+)+\b`): 17 distinct SCREAMING_SNAKE
   identifiers, of which 15 are config keys (`O_EXCL` is an fs flag and `AS_SAVED` an enum value).
   All 15 are declared in D21's block (lines 1002–1061), checked by substring membership.
   **Zero orphans.**
5. **Standards decoration** (bracketed-tag extraction, body against the Standards table): **15
   tags in the body, all 15 present in the table; zero body tags missing.** The table's one extra,
   `[APS-COMMERCIAL]`, is not decoration — the standard demonstrably drives D13's metered
   categories, D14's cost-class carving, the inventory's costlessness prose and Limitation 11, all
   via C4, which is cited eight times in the body.
6. **Gate C authoring residue and deferred-decision phrasing** (case-insensitive sweeps):
   **1 residue hit and 6 deferral hits, 0 genuine.** Line 224 ("superseded by the spec's
   hosted-primary D-1") is the required metacognitive baseline naming an anchoring bias. Lines 45
   and 47 are Scope's *Deferred, with reasoning* subsection, where the contract puts them. Line
   1114 ("a defect in this decision, not an implementer's choice") is an explicit *anti*-deferral
   rule. Lines 1175/1182 are D26's vitest choice, recorded as "a dev-tooling default the plan may
   confirm; **no architectural surface depends on it**", with the architectural decision
   (constructor-injected fetch and clock) fully made. Line 1484 (signed-URL host patterns "pinned
   exactly at implementation") sits in Limitations, the contract's designated home for
   acknowledged gaps, and is bounded by `EGRESS_ALLOW_HOSTS` being config rather than code.
7. **State-store completeness** (D24 asserts its inventory is complete — "a decision requiring
   durable state that is absent from this list is a defect in this decision"). Every decision was
   walked for durable-state obligations: D8 → `refresh-journal.json` + `auth-state.json`; D9 →
   `pkce-verifiers.json`; D11 → `webhook-dedupe.json` + `webhook-secrets.json` + `events.ndjson`;
   D12 → `poll-markers.json`; D13 → `spend-counters.json`; D23 → `da-workitems.json`. **Nine
   obligations, nine table rows, zero unlisted.** The Components block's nine-artifact prose list
   (:86–90) enumerates the same nine.

## Moderate & Minor Findings

### Finding 1 — Moderate (new). D3 rests a load-bearing Express behaviour claim on a bare "(verified)" with no library, version or date; the claim is absent from D3's own Premise slot, and the Standards table's Express row names D11 alone — so no path in the document answers how the 100 kB figure was established

**What the document does now.** D3 line 350 (Read at drafting time) reads:

> Express's default is **100 kB** (verified), which would reject any upload above ~75 kB of
> content once base64 expansion is applied and silently make tools 20/36 unusable.
> `HTTP_MAX_BODY_BYTES` defaults to `ceil(UPLOAD_MAX_BYTES × 4/3) + 1 MB` envelope headroom, and
> startup asserts it is not below that derived minimum, so the two bounds cannot drift apart.

That figure is the sole stated justification for `HTTP_MAX_BODY_BYTES` existing at all, for its
derived-minimum formula, and for the startup assertion that enforces it — a config key and a
fail-clear boot check both trace to it. D3's Premise slot (element 5 of the five-part format,
lines 372–375, Read at drafting time) reads in full:

> **Premise.** Transport options and their deprecation verified via Context7
> `/modelcontextprotocol/typescript-sdk/v1.29.0` (`WebStandardStreamableHTTPServerTransportOptions`:
> `sessionIdGenerator`, `enableJsonResponse`, deprecated `allowedHosts`/`allowedOrigins`/
> `enableDnsRebindingProtection`), 2026-07-28.

Express is not mentioned. The Standards table's Express row (line 1553, Read at drafting time)
reads:

> | Express 5 | Context7 `/expressjs/express`, 2026-07-28 | D11 (raw-body capture for HMAC) |

— attributing Express to D11 only. So a reader who asks "where did 100 kB come from?" finds a bare
parenthetical at the claim site, nothing in the decision's premise slot, and an audit table that
does not connect Express to D3.

**How the claim was verified.**

- *The document's text.* Read at lines 350, 372–375 and 1553 at finding-drafting time, quoted
  above.
- *The absence.* Grep for `Express` across the artifact returns hits only at lines 345/350 (D3's
  parser mount and the default claim), 322 ("behind Express middleware", D2), 620/669/678 (D11),
  and 1553 (the Standards row). Scripted extraction of D3's Premise slot returns the four lines
  quoted; the string `express` does not occur in it. The Standards table was parsed with the
  GFM-aware splitter and its Express row's third cell is the single string
  `D11 (raw-body capture for HMAC)`.
- *The fact itself is correct.* Context7 `/expressjs/express`, 2026-07-30, `express.json([options])`
  parameter table: "**limit** (string | number) - Optional - Request body size limit. **Default:
  '100kb'**". The figure in the document is right, and 100 kB ÷ (4/3) ≈ 75 kB is the correct
  consequence.
- *Provenance.* The passage is present in the committed baseline (`HEAD`:334, grep for
  `Express's default is` returns 1 hit), so it is pre-existing, not fix-induced. No prior round
  reported it: rounds 13 (:458–460), 14 (:384–413) and 15 (:404–407, :494) each went to Context7
  and confirmed the `'100kb'` value, and round 15 recorded it under *What's Actually Good* — all
  three verified the fact and none raised the missing citation. Rounds 12 and 16 do not mention
  it. Verified by grepping all five prior review documents for `100 kB|100kb|HTTP_MAX_BODY_BYTES`.

**Which standard it violates.** The authoring contract's **Phase 6 verification discipline**:
"Capture what you verified, not just the fact that you verified… 'Verified via Context7' is
decoration on the premise axis." A bare "(verified)" is strictly weaker than the example the
contract itself names as decoration. Read with **Gate C**'s mechanical item — "Every
Context7-verified claim cites what was verified and when (library, version, date), not just
'verified via Context7'" — and **Gate B**'s question 4, whose stated answer location is "Design
decisions section, element 5 of each decision — Context7 citations with library and version/date".
The claim is a Context7-verifiable library-behaviour claim; it carries none of library, version or
date; and element 5 of its decision does not contain it. The Standards table is the contract's
"audit table" whose column is "what the standard governed in this architecture" — Express governed
D3's body-limit reasoning as well as D11's raw-body capture, and the row says otherwise.

**Why it matters.** Not because the number is wrong — it is right, and three prior reviews
independently confirmed it. It matters because the document is the only thing the build has. This
architecture's own convention is visible one row below the Express row: the zod entry (line 1556)
names two dated lookups and the three decisions they govern, and every other library premise in
the document — SDK, pino, Tailscale, zod, the four APS surfaces — carries library, version and
date in the decision's own Premise slot. D3's Express claim is the single departure, and it is
the claim under which a `ceil(UPLOAD_MAX_BYTES × 4/3) + 1 MB` default and a startup assertion are
derived. A reviewer verifying the built server against D3 has to leave the document to establish
the premise, which is exactly the condition Gate B exists to prevent; and an implementer who
doubts the figure has no cited source to check it against, so the cheapest path is to re-derive a
value three reviews have already settled. The blast radius is bounded — the design is correct
either way, since any 100 MB upload requires raising the limit whatever the default is — which is
why this is Moderate rather than Serious.

**What correct implementation looks like.** Two edits, both additive, in two known places.
(a) Add the Express premise to **D3's Premise slot** in the same form every other premise in the
document uses — library, version or date, and what was confirmed: e.g. "`express.json()`'s `limit`
option defaults to `'100kb'` — verified via Context7 `/expressjs/express`, 2026-07-30." (b) Extend
the **Standards table's Express 5 row** third cell to name both decisions: "D3 (`express.json`
body-limit default and the `/mcp` parser mount), D11 (raw-body capture for HMAC)". The
parenthetical "(verified)" at line 350 may then stay or go; once the Premise slot carries the
citation, the claim is answerable from the document. **Do not change the 100 kB figure, the
`ceil(UPLOAD_MAX_BYTES × 4/3) + 1 MB` formula, the startup assertion, or the middleware ordering**
— all four are verified correct, and the ordering in particular was round 14's finding and is
closed.

**Provenance: new.** Text unchanged from the committed baseline, and no prior round reported it.

**No Minor findings** — verified by the seven scans above (premise-citation sweep, threat-model
join recomputation, inventory accounting, table integrity, config-key orphans, standards
decoration, Gate C residue), the state-store completeness walk, the cross-reference integrity
check (zero dangling `D#` references, zero invented spec identifiers), the five-part decision-slot
check across all 28 decisions, the Clear Thought invocation sweep, and the requirement-satisfaction
walk across all 60 requirements. No residual style, convention, or optimization defect was
observed.

## Tentative Findings

**No tentative findings** — every candidate finding's premise was verified per Compliance Gate B.
Three candidates were examined and resolved rather than carried:

- *Whether the Model Derivative `signedcookies` endpoint accepts the whole-value percent-encoded
  `derivative_urn`.* Genuinely unresolvable here — the credential is cleared, so no request can be
  issued (independently confirmed: `C:/Users/maxco/.aps-fusion-mcp/tokens.json` reads literal
  `null`). It is **not** a tentative finding because it is not a finding at all: the artifact now
  states both sides of the vendor record, names which one the gateway follows and why, and records
  the residual with its closing check as Limitation 8(c). That is the contract's designated
  handling for a claim that cannot be verified with available tools.
- *Whether MFG `ItemVersion.id` is the Data Management version-URN form.* Same blocker, same
  correct handling: D27 marks the assumption "**not live-verified**" in the decision text and
  Limitation 8(b) names the exact closing query. Re-derived rather than imported: introspection
  confirms `ItemVersion.id` is typed `ID!` with no format information, so the schema cannot settle
  it either, and `docs/apsq.mjs` is present (2,927 bytes) but unusable without a credential.
- *Whether D19's zod premise correctly attributes `.extend()` to the v4 reference.* Context7
  `/colinhacks/zod`, 2026-07-30, confirms the substantive claims: the shape-spread form is
  documented in `packages/docs/content/api.mdx` (v4), `extend` is implemented in
  `packages/zod/src/v4/core/util.ts` (v4 source), and `.merge()`'s "inherits the `unknownKeys`
  policy and catchall schema from the second object" semantics appear in `packages/docs-v3/home.md`
  (v3) — exactly as D19's premise states. Context7's retrieval is relevance-ranked rather than
  exhaustive, so it cannot establish that any particular sentence is *absent* from api.mdx; no
  claim was drafted that would require such an absence check.

## Observations

- The introspection dump's top-level object carries only `data` and `extensions`, and the schema
  body exposes `queryType` and `types` with **no `mutationType` pointer**. `Mutation` is
  nonetheless present as a type with 45 fields, and all eight mutations the architecture names
  (`createFolder`, `renameFolder`, `moveFolder`, `copyFolder`, `deleteFolder`,
  `createDesignFromFile`, `setProperties`, `createPropertyDefinition`) exist on it. This affects no
  claim the architecture makes; it is worth knowing before the build introspects this file,
  because a tool resolving mutations through `mutationType` will find none. (Recorded by rounds
  14, 15 and 16 as well; independently re-derived here.)
- `HANDOFF.md` describes the architecture as having a "36-tool inventory"; the artifact has 37
  (verified by table parse). The architecture header cites `HANDOFF.md` only for the spec's review
  status, not for the tool count, so this is not a defect in the artifact under review — but a
  reader who starts from `HANDOFF.md` will begin with a stale figure.
- D18 describes the billable derivative generation as "a field on a Query type"
  (`ComponentVersion.derivatives(derivativeInput:{generate:true})`). Introspection confirms the
  substance — `derivatives(derivativeInput: DerivativeInput!)` is a field on `ComponentVersion`
  (an OBJECT type), reached through `Query.componentVersion(componentVersionId: ID!)`, so the
  billable operation genuinely sits on the query side rather than being a mutation, which is the
  decision's whole point. The phrase would read more exactly as "a field reachable from the Query
  root", and the parenthetical names the exact field either way.
- The spec file's `Status:` line still reads "Draft for review" (verified at
  `docs/specs/spec-aps-fusion-mcp-server.md`:3) while `HANDOFF.md` records a five-round
  zero-findings pass. The architecture header discloses exactly this discrepancy and declines to
  resolve it, which is the correct handling of governance metadata the architecture does not own.
- The artifact header states that the R-REL-7 / AC-25 spec amendment "has not itself been reviewed
  — it owes its own review round." That remains true; this review evaluated the architecture
  against the amended spec text as the architecture declares, and did not review the amendment.

## What's Actually Good

- **Round 16's threat-model join defect is closed completely, and the document's own asserted
  invariant is now true under mechanical test.** Round 16 found that the Analysis paragraph
  claimed the control column "cannot drift" while the join drifted at three points. The fix added
  `S-3` to D8's header, `S-8` to D17's, D8 to the T1 and T3 control columns, and D17 to T5's — and
  I recomputed the join from scratch rather than reading the table: the spec's §8 bindings parsed
  from the spec source, the decision headers extracted by script, the threat table parsed with a
  GFM-aware splitter, and the join evaluated per threat. **Eight of eight rows match exactly, zero
  missing and zero extra, under both the decision-header reading and the traceability-matrix
  reading of "declares"** — which is what makes the closure robust, since round 16's finding held
  under either reading. The standard this is good by is the one round 16 named: Gate B's
  answerable-from-the-document condition. A claim that a table cannot drift is only worth making
  if something can check it, and this one now checks out.
- **Round 16's D27 finding is closed by the safer of the two resolutions offered, and both sides of
  the vendor record are now on the page.** Round 16 found D27 carving an exception in D6's
  encoding rule on the strength of one worked example while the reference documentation said the
  opposite. The fix withdrew the exception entirely: line 1210 now reads "**Path composition — D6
  governs, unmodified**", the gateway percent-encodes the whole value, and both vendor statements
  are recorded in the Premise slot with their pages. I re-fetched the record rather than accepting
  the document's account — Context7 `/websites/aps_autodesk_en`, 2026-07-30, returns both halves
  in one lookup: the `urn-manifest-derivativeurn-GET` parameter table ("**derivativeUrn** (string)
  - Required - The **URL-encoded URN** of the derivative"), the `urn-manifest-derivativeurn-HEAD`
  page ("The `derivativeUrn` URI parameter is the **URL-encoded URN** of the derivative"), and the
  `signedcookies` cURL and Python invocations embedding the URN with literal `/` and `:`. D27's
  characterisation is accurate and precise about which pages say which — it attributes the
  URL-encoded statement to the derivative GET/HEAD and .NET SDK references, not to the
  `signedcookies` page (whose own parameter table says only "The URN of the derivative"). The
  unresolved wire-format question is moved to Limitation 8(c) with a concrete closing check, and
  Limitation 8's heading correctly reads "two are load-bearing" across its now-three sub-items.
  This is the contract's Phase 6 discipline applied to a premise that genuinely cannot be settled
  with the tools available.
- **The MFG schema premise surface survives independent programmatic re-derivation at full
  density, for the fourth consecutive round.** 66 assertions were machine-checked against
  `docs/aps-mfg-schema.json`, **65 pass** and the one non-pass is a property of the dump file
  rather than a claim the artifact makes. Among them: 209 types; the `Item` interface carries
  exactly the twelve fields named "and nothing else"; `Item.possibleTypes` is exactly the four
  concrete types and all four bear `tipVersion` and `versions`; `tipRootComponentVersion` has
  exactly one carrier (`DesignItem`) and `tipConfigurationTable` exactly one
  (`ConfiguredDesignItem`); the `ItemVersion` interface carries `versionNumber`/`createdOn`/
  `lastModifiedOn`, making tool 35's field list interface-safe; `ComponentVersion` carries the six
  named fields and has **no** `versionNumber` and **no** `createdOn`, while both
  `DesignItemVersion` and `ConfiguredDesignItemVersion` carry both and both expose `item`, which is
  what makes tool 12's two `fusionWebUrl` traversals resolve; `fusionWebUrl` is present on exactly
  the six named types and absent from `ComponentVersion`; the schema has exactly nine
  `ComponentVersion`-typed fields with `ConfigurationRow.rootConfigurationMember` among them;
  `ConfigurationTable.rows` takes zero arguments, confirming "API-unpaginated, so the bound is
  tool-level"; `ItemFilterInput` carries only `name` and `itemType`, confirming D7's and D12's
  "no server-side changed-since filter" reasoning; `item(hubId: ID!, itemId: ID!, …, composition:
  ItemCompositionEnum)` really does require both ids and take composition with values
  WORKING/RELEASED/AS_SAVED/LATEST; `itemsByFolder(hubId!, folderId!, …)` really does take no
  project id while `itemsByProject(projectId!, …)` takes no hub id; and `OutputFormatEnum` is
  exactly STEP, STL, OBJ. By the authoring contract's Phase 10 element-5 standard this is what a
  verified premise slot is supposed to look like.
- **The two most consequential non-schema external premises re-derive verbatim.** D14's annotation
  matrix rests on correctly-read SDK defaults: Context7
  `/modelcontextprotocol/typescript-sdk/v1.29.0`, 2026-07-30, `ToolAnnotationsSchema`
  (`packages/core/src/schemas.ts`) and the `ToolAnnotations` interface declare `readOnlyHint`
  **Default: false**, `destructiveHint` **Default: true** ("meaningful only when
  `readOnlyHint == false`"), `idempotentHint` **Default: false**, `openWorldHint` **Default: true**
  — exactly what D14 asserts, including the non-obvious half that `destructiveHint` defaults
  *true*, which is why W-class tools must set it explicitly. D1's topology rests on a Tailscale
  rule quoted almost verbatim: Context7 `/websites/tailscale`, 2026-07-30 — "The same port number
  cannot be simultaneously used for Tailscale Serve (private) and Tailscale Funnel (public)… If
  `funnel` was the most recent command, the port is public", and Funnel "can only listen on ports
  443, 8443, and 10000". Getting either backwards would ship a false cost hint or silently flip
  the entire MCP surface public.
- **D11's and D12's cross-source join key is confirmed at the field level, including the negative
  half.** Context7 `/websites/aps_autodesk_en`, 2026-07-30: the callback envelope is
  `{version, resourceUrn, hook, payload}` with `resourceUrn` a **top-level sibling of** `payload`,
  exactly as D11 states and as D12's join requires; `dm.version.added` carries
  `resourceUrn: "urn:adsk.wipprod:fs.file:vf.0zvdp3CoTzWDcZC_wL0kJA?version=1"` with
  `payload.lineageUrn` sharing the same opaque suffix and `payload.source` equal to the version
  URN — the corroboration D12 names; while `dm.operation.started` carries a **folder** URN and its
  payload carries **neither** `lineageUrn` nor `source`, which is precisely why D12 scopes the
  normalization to the version-event family and flags non-version entries `identity: unresolved`
  as a by-design state. The `x-adsk-delivery-id` header and the `sha1hash=` signature prefix are
  both present, and the reference examples do register plain-HTTP ngrok callback URLs, confirming
  D1's premise that `callbackUrl` carries no documented port or scheme restriction.
- **Every predecessor-source claim in the premise slots is confirmed at file:line.** Ten checks,
  all correct: the v2 deprecation banner, `/mfg/v3/graphql/public`, and ComponentVersion removal
  at `src/constants.ts`:9–10 (D5); `app.post("/mcp", …)` at `src/index.ts`:71 with
  `app.use(express.json())` at :45 and no auth middleware on any route, and the hardcoded version
  at :22 (D1/D2/D3/D21); `clearTokens()` defined at `src/services/aps-auth.ts`:38 and called at
  :119 in the refresh failure path, with `isAuthenticated()` returning `currentTokens() !== null`
  at :145–146 (D8); zero hits for `code_challenge|codeChallenge` across `src/` (D9); the two
  divergent truncation implementations at `src/tools/mfg-data-model.ts`:30 and
  `src/tools/model-derivative.ts`:9 (D19); the bare-quote
  `componentVersionId: "${component_version_id}"` at `src/tools/mfg-data-model.ts`:590 (D6);
  `readOnlyHint: true` at :480 in the same tool's annotation block as `generate: true` at :497,
  read together at 476–500 (D14); `urnToBase64` at `src/services/aps-client.ts`:38 (D27); and the
  caret ranges `^1.29.0`/`^5.2.1`/`^4.3.6` in `package.json` with `package-lock.json` present
  (D21). The document uses each as defect evidence rather than as precedent, which is what M-1/M-2
  require — and which is the codebase-mirroring trap's designed defence.

## Convergence Record

**Round:** 17 (post-fix), matching Scope and Inventory.

**Trajectory:** R9: 6 → R10: 4 → R11: 6 → R12: 4 → R13: 3 → R14: 3 → R15: 1 → R16: 2 → **R17: 1**.
R12–R16 are grep-verified from each round's own verdict line (`round-12`:177 = 4 findings;
`round-13`:580 = 3; `round-14`:675 = 3; `round-15`:551 = 1; `round-16`:692 = 2). R9–R11 are taken
from round 12's own Convergence Record (:148); rounds 1–8 and the round 9–11 documents are not
present in this repository, so those three counts are recorded from a prior document rather than
independently re-derived. R17's count is this review's own mechanical breakdown.

**Flow counts for R17** (every closure re-derived from current source against the standard the
original finding named, never from the fix author's assertion):

- **Prior findings closed: 2 of 2.**
  - **R16 F1** (Serious-regression — D27's path-composition rule rested on one side of a two-sided
    vendor record while carving an exception in D6's encoding rule) — **closed, on all three
    limbs round 16 specified.** *Limb (a), record both statements in the Premise slot:* lines
    1257–1261 now state "The parameter's two-sided record — `derivativeUrn` defined as 'the
    URL-encoded URN of the derivative' on the derivative GET and HEAD reference pages and in the
    .NET SDK reference, while the reference and tutorial invocations embed it with literal `/` and
    `:` — same source, 2026-07-30" (Read at drafting time). Both statements independently
    re-fetched via Context7 `/websites/aps_autodesk_en`, 2026-07-30, and both confirmed.
    *Limb (b), state which the gateway follows and why the other was not chosen:* lines 1210–1219
    state "**Path composition — D6 governs, unmodified**… The gateway follows the normative
    definition — the validated `derivative_urn` is percent-encoded as a whole value
    (`encodeURIComponent`)… The worked examples are treated as evidence that the server also
    tolerates the literal form, not as the contract." *Limb (c), record the unresolved half with
    its closing check:* Limitation 8(c) at lines 1502–1508 names the check (issue the request with
    the whole value percent-encoded; if it 400s, issue it literal, switch D27's composition, record
    the observation) and the blocker, which I confirmed independently rather than accepting
    (`tokens.json` reads literal `null`). Grep confirms the withdrawn text is gone: `segment-wise`
    and `deliberate exception to D6` both return **0** in the working tree against the 3 and 1
    round 16 recorded. Closed against the standards originally named — the contract's Phase 6
    verification discipline, Gate C's premise-citation item, and Gate B's answerable-from-the-
    document condition. Round 16's edit prohibition was honoured: D27's grammar (1200–1206), the
    recompute-and-match binding (1206–1210, `recompute-and-match` still returns 2 hits) and tool
    37's row (:177) are unchanged.
  - **R16 F2** (Moderate-new — the threat model claimed its control column was a join that "cannot
    drift", and the join drifted at three points) — **closed.** D8's header now declares `S-3`
    (line 509) and D17's declares `S-8` (line 881), both extracted by script; T1's and T3's control
    columns now carry D8 and T5's carries D17, all parsed from the table. The join was recomputed
    from the spec's §8 bindings, the decision headers and the traceability matrix: **8 of 8 threat
    rows match exactly under both readings of "declares", zero missing and zero extra**, against
    the 5 violations the same computation produced before the fix. Closed against the standard
    originally named (Gate B's answerable-from-the-document condition, read with the
    standards-decoration frame and OWASP Threat Modeling's completeness discipline). Round 16's
    stated constraint — that the edit be additive and leave T5's D27 citation untouched — was
    honoured: T5 still cites D27.
- **New findings: 1** (Finding 1 — D3's uncited Express premise; text byte-identical to `HEAD`, so
  pre-existing, and not reported by rounds 12–16, each of which was grep-checked for it).
- **Regressions: 0.** This is the first round since round 14 in which the fix site produced no new
  finding. The region-isolated diff confirms the edit touched only D27, D28's summary sentence,
  Limitation 8, D8's and D17's headers, and three threat rows; every accounting surface
  downstream of those (37 inventory rows, 60 traceability entries, 7 tables, 15 config keys, 28
  decision slots, 15 standards tags) was re-derived and came through unchanged.
- **Recurring: 0.**

**Tripwire evaluation — NOT FIRED**, with the arithmetic shown for both conditions. **Both streaks,
which round 16 recorded as armed at one of two, are broken this round.**

- *Condition (a): new + regression ≥ closed, for two consecutive post-fix rounds.* **R17: 1 + 0 = 1
  vs 2 closed → 1 ≥ 2 is FALSE.** R16 was 1 + 1 = 2 vs 1 closed → TRUE, so the streak stood at 1
  of 2 entering this round. It is now **reset to 0**. Does not fire.
- *Condition (b): total findings has not strictly decreased, for two consecutive post-fix rounds.*
  **R17: 1 vs R16's 2 → 1 is less than 2, so it DID strictly decrease → FALSE.** R16 was 2 vs
  R15's 1 → did not decrease → TRUE, so that streak also stood at 1 of 2. It is now **reset to 0**.
  Does not fire.

Neither condition holds for this round, so neither streak reaches two and the tripwire does not
fire. Round 16 stated plainly that round 17 was the round in which either condition firing would
route to foundational rework; the answer is that neither fired, and the arithmetic above is the
reason. Foundational rework is **not** indicated.

The qualitative signal is materially better than round 16's, and the improvement is in the place
that mattered. Round 16 named the pattern precisely: two consecutive rounds in which the fix
itself produced a finding at the site of the fix, both times because the fix author verified the
half of the record that supported the edit. Round 17's fix author did the opposite — presented
with a two-sided vendor record, the edit withdrew the contested rule rather than defending it,
recorded both sides with their pages, and pushed the unresolvable half into Limitations with a
concrete closing check. That is round 16's Recommended Priority item 1 applied, and it is why the
regression count is zero. The remaining finding is of the same family as the one this cycle has
been working through — a premise whose provenance is not on the page — but it is older than the
cycle, it sits away from the fix site, the underlying fact is correct, and the fix is two additive
edits.

## Recommended Priority

The tripwire has not fired, so another fix round is the indicated path; recommending foundational
rework over a non-fired tripwire would be as wrong as recommending another round over a fired one.
The remaining work is small and should stay small.

1. **Finding 1 (Moderate) — two additive edits, no more.** Add the Express premise to **D3's
   Premise slot** with library, version-or-date and what was confirmed, in the form the document
   already uses everywhere else: `express.json()`'s `limit` defaults to `'100kb'`, verified via
   Context7 `/expressjs/express`. Extend the **Standards table's Express 5 row** (line 1553) to
   name D3 alongside D11. **The 100 kB figure is correct** — confirmed independently this round and
   by rounds 13, 14 and 15 — so do not re-derive it, do not change the
   `ceil(UPLOAD_MAX_BYTES × 4/3) + 1 MB` formula, do not change the startup assertion, and do not
   touch the middleware ordering, which was round 14's finding and is closed.
2. **Touch nothing else.** D27, the threat table, D8's and D17's headers, the traceability matrix,
   the tool inventory and the state-store table were all re-derived this round and are correct.
   Rounds 15 and 16 each produced a regression because an edit reached past its finding; round 17
   did not, because it did not. The same discipline closes this one.
3. **Re-run the checks, not just the edit.** Two of this cycle's findings were found by computing
   the document's own asserted invariants rather than reading them. After editing, re-run the
   standards-tag sweep (every bracketed tag and named standard in the body present in the table
   with what it governed) and confirm the Express row's new decision list is the only change. The
   check is cheap and it is what turns "the audit table is complete" from an assertion into a fact.
4. **Carry Limitations 8(b) and 8(c) into the build as gating checks, not as prose.** Both are
   correctly handled as unverifiable-while-the-credential-is-cleared, and both name a specific
   query to run after the M-3 re-auth. They are the two places where the built server can diverge
   from this architecture without any document defect being visible, so the plan should schedule
   them as the first two post-authentication verifications rather than leaving them to be
   rediscovered.

Nothing in this round calls for re-opening D27's structure, Limitation 8's shape, or the threat
model. Tools 25, 26 and 37's rows remain correct and should not be touched.

## Verdict

Verdict: NEEDS FIXES (1 finding: 1 Moderate)
