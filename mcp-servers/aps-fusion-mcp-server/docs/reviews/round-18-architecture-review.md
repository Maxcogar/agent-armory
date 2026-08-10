# Expert Review — Architecture: APS Fusion MCP Server (Round 18)

## Scope and Inventory

**Round 18** (post-fix; the first review is round 1, the prior completed review is
`docs/reviews/round-17-architecture-review.md`). The inventory is constructed by the post-fix rule
from all four required sources: the prior review's full inventory, the fix-diff files, the fix-diff
files' dependents, and the prior review's findings as closure items.

**Fix-diff.** `git diff HEAD -- docs/architectures/architecture-aps-fusion-mcp-server.md`: one file,
+189/−98. No commit has been made since before round 13 (`HEAD` = `f1e58a9`, 1,482 lines), so that
diff spans the edits of rounds 13 through 18; the working tree is 1,573 lines. **Round 18's own edit
was isolated two independent ways, and the two agree:**

- *Section-offset comparison.* Round 17 recorded its working tree at 1,572 lines with these `## `
  heading positions: Design decisions 217, Threat model 1353, ASVS 1394, Traceability 1414,
  Limitations 1453, Standards 1524, Status 1558. Scripted extraction of the current tree gives:
  Design decisions **217** (+0), Threat model **1354** (+1), ASVS **1395** (+1), Traceability
  **1415** (+1), Limitations **1454** (+1), Standards **1525** (+1), Status **1559** (+1). The
  shift is uniform at +1 from the Threat model onward and zero at Design decisions, so this round
  added exactly **one** line inside the Design decisions section and added or removed nothing
  anywhere else; 1,572 + 1 = 1,573, which is the observed length.
- *Provenance greps.* `Express` occurrences were enumerated in both the extracted `HEAD` object and
  the working tree. `HEAD` carries the claim at :334 with no premise citation and the Standards row
  at :1463 reading `| Express 5 | Context7 /expressjs/express, 2026-07-28 | D11 (raw-body capture
  for HMAC) |`. The working tree carries a **new** premise line at :375–376 and a **rewritten**
  Standards row at :1554. Separately, the eight phrase counts round 17 recorded for its own tree
  were re-run and every one is unchanged: `segment-wise` 0, `deliberate exception to D6` 0,
  `D6 governs, unmodified` 1, `Limitation 8(c)` 2, `two-sided` 2, `recompute-and-match` 2,
  `URL-encoded` 2, `boundary zod validation of every tool argument` 1, `classified failure
  handling` 1 — confirming the D27, D28, Limitation 8 and threat-table regions were not touched.
  The round-17 counts are a prior-document claim used only to locate the edit; every finding and
  closure below is re-derived from current source.

Round 18's edit is therefore exactly the two additive edits round 17's Recommended Priority
specified, and nothing else: one line appended to **D3's Premise slot** carrying the Express
citation, and the **Standards table's Express 5 row** rewritten in place to name D3 alongside D11.

**Dependents of the fix-diff file: none exist.** The artifact is a markdown design document, nothing
imports it, and the `src/` tree it specifies has not been created. Recorded rather than assumed —
see the tool plan. `git status --short` lists five other modified paths (`package.json`,
`src/constants.ts`, `src/index.ts`, `src/services/aps-auth.ts`, `src/tools/mfg-data-model.ts`) and
the untracked review documents; the modified source files are the untouched predecessor's
pre-existing working-tree state, not this revision's product.

| # | File | Status |
|---|------|--------|
| 1 | `docs/architectures/architecture-aps-fusion-mcp-server.md` | [x] Read in full, 1,573 lines (four passes: 1–400, 400–800, 800–1200, 1200–1574), plus targeted re-Reads at 70–78, 178–203, and 340–379 at finding-drafting time |
| 2 | `docs/specs/spec-aps-fusion-mcp-server.md` | [x] Read in full, 639 lines |
| 3 | `.claude/skills/expert-architecture/SKILL.md` | [x] Read in full, 582 lines — the authoring contract that produced the artifact and one of its governing standards; item-by-item conformance is in Upstream Contract Verification |
| 4 | `HANDOFF.md` | [x] Read at lines 1–30 — the spec's "passed five independent blinded rounds with zero findings" record, cross-checked against the artifact header's characterisation |
| 5 | `docs/reviews/round-17-architecture-review.md` | [x] Read in full, 638 lines (prior finding list and closure items; provenance source only) |
| 6 | `docs/reviews/round-16-architecture-review.md` | [x] Grep-verified — verdict line (`NEEDS FIXES (2 findings: 1 Serious-regression, 1 Moderate-new)`); disposition-partition passage at :317 |
| 7 | `docs/reviews/round-15-architecture-review.md` | [x] Grep-verified — verdict line (1 Serious-regression); disposition passage at :285 |
| 8 | `docs/reviews/round-14-architecture-review.md` | [x] Grep-verified — verdict line (3 findings); disposition passage at :542 |
| 9 | `docs/reviews/round-13-architecture-review.md` | [x] Grep-verified — verdict line (2 Moderate, 1 Minor); disposition passage at :417 |
| 10 | `docs/reviews/round-12-architecture-review.md` | [x] Read at :145–155 — trajectory `R9: 6 → R10: 4 → R11: 6 → R12: 4` and the R11 closure list; verdict line grep-verified (4 findings) |
| 11 | `docs/aps-mfg-schema.json` | [x] Programmatically introspected via Node — **56 assertions machine-checked, 56 pass**. Covered: 209 types; `Item`/`ItemVersion` field lists and `possibleTypes`; all four concrete Item types; `ComponentVersion`, `DesignItemVersion`, `ConfiguredDesignItemVersion`, `ConfigurationTable`, `ConfigurationRow`, `Occurrence`, `ItemFilterInput`, `Properties`, `ItemVersions`, `DerivativeInput`, `ItemCompositionEnum`, `OutputFormatEnum`; global carrier sweeps for `fusionWebUrl`, `tipRootComponentVersion`, `tipConfigurationTable` and `ComponentVersion`-typed fields; full argument lists for `item`, `itemsByFolder`, `itemsByProject`, `foldersByProject`, `foldersByFolderInHub`, `itemVersions`, `componentVersion`, `ComponentVersion.derivatives`, `ComponentVersion.allOccurrences`; all eight named mutations |
| 12 | `package.json` | [x] Read via `require` — `@modelcontextprotocol/sdk ^1.29.0`, `express ^5.2.1`, `zod ^4.3.6`; `version: "1.0.0"` |
| 13 | `package-lock.json` | [x] Verified present, 46,359 bytes |
| 14 | `src/constants.ts` | [x] Grep-verified — v2 "will be deprecated soon" banner, `/mfg/v3/graphql/public`, ComponentVersion removal at :9–10 |
| 15 | `src/index.ts` | [x] Grep-verified — `app.post("/mcp", …)` at :71, `app.use(express.json())` at :45, hardcoded `version: "1.0.0"` at :22, no auth middleware on any route |
| 16 | `src/services/aps-auth.ts` | [x] Grep-verified — `clearTokens()` defined :38, called :119 in the refresh failure path; `isAuthenticated()` → `currentTokens() !== null` at :145–146; grep for `code_challenge\|codeChallenge` across `src/`: **0 hits** |
| 17 | `src/services/aps-client.ts` | [x] Grep-verified — `export function urnToBase64` at :38 |
| 18 | `src/tools/mfg-data-model.ts` | [x] Grep-verified — `truncateIfNeeded` at :30; `readOnlyHint: true` at :480 with `generate: true` at :497 in the same tool; bare-quote `componentVersionId: "${component_version_id}"` at :590 |
| 19 | `src/tools/model-derivative.ts` | [x] Grep-verified — second, divergent `function truncate` at :9 |
| 20 | `docs/apsq.mjs` | [x] Verified present, 2,927 bytes |
| 21 | `C:/Users/maxco/.aps-fusion-mcp/tokens.json` | [x] Read — literal `null`; the credential is cleared, independently confirming the blocker Limitations 8(b) and 8(c) both name |
| 22 | `HEAD:…/architecture-aps-fusion-mcp-server.md` (git object) | [x] Extracted (1,482 lines); Express-occurrence enumeration and nine phrase counts run across it and the working tree to isolate this round's edit |

**Tool plan (Step 3).** Instruments available and exercised: Read; Grep; Bash/Node (a GFM-escape-
aware markdown table parser, a programmatic GraphQL introspector, a per-decision slot and
header-requirement extractor, a mechanical evaluator of the threat model's own stated join, and
config-key / standards-tag / tunable / verification-marker sweeps); Context7; Clear Thought
(`metacognitivemonitoring` at start, `collaborativereasoning` before the gates); git.
Claim-type mapping — absence claims → grep and programmatic schema queries; literal-content claims
→ Read at file:line; library- and vendor-API-behaviour claims → Context7
(`/expressjs/express`, `/modelcontextprotocol/typescript-sdk/v1.29.0`, `/websites/tailscale`,
`/colinhacks/zod`, `/websites/aps_autodesk_en`); structural and blast-radius claims → the
region-isolated fix-diff plus the recorded observation that the artifact has no importers;
prior-document claims (rounds 12–17's findings and trajectories, `HANDOFF.md`'s assertions, and the
artifact's own premise slots) → re-derived from current source.
**CodeGraph and codebase-RAG were not exercised, and this is not a verification gap:** every
structural question in this review's scope is either an absence claim or a literal-content claim,
which Step 3 assigns to grep/Read rather than CodeGraph, and the architecture specifies a greenfield
`src/` tree that does not yet exist. No instrument class was unavailable for a load-bearing claim
category, so no halt condition arose.

**One self-correction is recorded for auditability.** The first run of the threat-model join
evaluator used the token pattern `S-\d+`, which matches inside `R-OPS-2`, `R-OPS-3` and
`R-DISC-2`, and it reported five drifting threat rows. The pattern was corrected to
`(?<![A-Za-z-])S-\d+` and the join recomputed; the corrected run reports **zero** drift on all
eight rows under both readings. The defect was in the instrument, not the artifact, and no finding
was drafted from the faulty run.

**Rigor waivers.** None. No compression was requested or applied.

## Summary

**This review returns NEEDS FIXES (3 findings: 2 Moderate, 1 Minor).** Round 17's single finding is
closed against the standard it originally named, and the closure was re-derived rather than
relayed: D3's Premise slot now carries the Express citation in the same library-plus-date form every
other premise in the document uses, the Standards table's Express row names both decisions it
governs, and the underlying fact was independently re-fetched from Context7 rather than accepted
from the document or from three prior rounds that had confirmed it. The edit was confined to exactly
the two additive changes round 17 specified, with no regression at the fix site and none anywhere
else — the second consecutive round in which that holds. Every accounting surface came through
intact under independent re-derivation: 37 inventory rows reconcile against every prose enumeration
of effect class, 60 spec requirements map to 60 distinct traceability entries with zero duplicates
and zero empty cells, all 28 decisions carry all five slots, 7 tables parse clean, every `D#`
reference resolves, no spec identifier is invented, the threat model's own asserted join recomputes
to zero violations across all eight rows under both readings of "declares," and all 56
programmatically-checked MFG schema assertions hold. The three findings are all pre-existing text
that no prior round reported, surfaced by three scan classes this cycle had not run before: a
comparison of the disposition paragraph's prose enumeration against its own quantified set, which
places tool 34 in two mutually exclusive classes the same paragraph says are exclusive; a sweep of
every named bound in the document for a value or config key, which finds the token-refresh
"renewal threshold" to be the only one carrying neither; and a walk of every module-to-decision
pointer in the Components block, which finds `health-route.ts` pointed at the test-seam decision
instead of the health decision. None of the three changes the design; all three are defects in the
sections the document itself designates as the contract and the map.

## Upstream Contract Verification

The upstream artifacts are the spec (`docs/specs/spec-aps-fusion-mcp-server.md`) and the authoring
contract (`.claude/skills/expert-architecture/SKILL.md`). The artifact is a design document, so the
spec's acceptance criteria are not executable at this phase; what is checkable is requirement
coverage, requirement *satisfaction*, and contract conformance. All three were checked, the first
two mechanically.

**Spec requirement coverage — PASS.** Requirements were counted independently from the spec's own
declaration forms by regex over `^- \*\*(R-[A-Z]+-\d+)\.` and `^- \*\*(S-\d+)`: **46 R-numbers + 14
S-numbers = 60 distinct**. The traceability matrix (artifact lines 1417–1450) was then parsed with a
GFM-escape-aware cell splitter: 5 columns, 32 rows, **60 requirement entries, 60 distinct, zero
duplicates, zero empty decision cells**, set-differenced to **zero missing and zero extra** against
the expected 60. The artifact's "60 spec requirements" claim (Goal line 23; Status line 1564) is
correct.

**Spec requirement satisfaction — PASS with one qualification.** Coverage of the matrix is not
satisfaction of the requirements it maps; all 60 were walked against the decisions and tool rows
each is mapped to. **59 of 60 are satisfied without qualification.** The exception is **R-OPS-2**,
whose "every configuration value SHALL be documented … and given a sane default where one exists"
clause is satisfied for the fifteen keys D21 declares and for the outbound timeout, dedupe TTL and
verifier TTL, but not for the token-refresh renewal threshold — Finding 2. Spot-checks with their
verification: **R-EXPORT-3/5**'s retrieval clauses are served by tool 37 (`aps_md_get_derivative`,
row at :177), and the backing endpoint was re-confirmed this round via Context7
`/websites/aps_autodesk_en`, 2026-07-30, which returns exactly `{etag, size, url, content-type,
expiration}` plus three `Set-Cookie` headers. **AC-7**'s path is runnable end-to-end: tool 36
uploads foreign CAD through D23's DM pipeline, tool 23 translates, tool 24 yields the derivative
URN, tool 37 retrieves. **R-PROTO-1**'s "exactly the capabilities it implements" is pinned at D3
(`tools` only, `listChanged: false`, no resources/prompts/logging/completions). **R-READ-6**'s
composition selection is backed by `Query.item(composition: ItemCompositionEnum)` with values
`WORKING, RELEASED, AS_SAVED, LATEST` — confirmed by schema introspection this round.
**R-DISC-4** is satisfied in substance — every list-returning tool does carry a stated disposition
— but its classification is internally contradictory for tool 34 (Finding 1).

**Acceptance criteria.** By set-difference of `AC-[0-9]+` occurrences across both documents, the
spec declares AC-1..AC-27 and the architecture cites **22 of them**, never citing AC-1, AC-2, AC-3,
AC-4 or AC-17 — unchanged from rounds 14 through 17. That is **not** a contract violation: the
authoring contract requires the traceability matrix to account for every R# and Q#, not every AC,
and each of those five ACs cites requirements that are themselves traced. Recorded so the reader can
audit the gap rather than discover it. **AC-25** is separately affected by Finding 2: its third
clause ("the refresh path is observed … to refresh only when the access token is near expiry rather
than opportunistically") has no stated boundary against which "near expiry" can be judged.

**Cross-reference integrity — checked mechanically.** 28 decisions defined, 28 referenced, **zero
dangling `D#` references and zero decisions defined-but-never-cited**. Every `R-…`, `S-…`, `AC-…`,
`C#`, `T#`, `M-#`, `Q-#` and spec `D-#` identifier cited in the architecture exists in the spec (46,
14, 22, 8, 8, 3, 3, 7 respectively; **zero invented**). This check establishes that every pointer
*resolves*; it does not establish that each points at the *right* decision, which is a separate walk
— and that walk produced Finding 3.

**Authoring-contract conformance — checked item by item, mechanically where possible.**

- *Required sections.* All eleven present, by scripted extraction of `^## ` headings: Goal (21),
  Scope (35), Components and structure (54), Quality characteristics (203), Design decisions (217),
  Threat model (1354), ASVS mapping (1395), Traceability (1415), Limitations (1454), Standards
  (1525), Status (1559). Scope carries all three required subsections (In scope :37, Deferred with
  reasoning :44, Out of scope :50). *Inheritance from existing precedents* is correctly omitted with
  its attestation in Status.
- *Five-part decision format.* Scripted per-decision slot check across D1–D28: all 28 found, every
  one carrying all five slots (`**Decision.**`, `**Standard.**`, `**Why here.**`, `**Not.**`,
  `**Premise.**`). **Zero gaps.** Every Premise slot either cites a source or carries the explicit
  "no factual premises — pure design choice" attestation the contract permits (D13, D18, D24, D25,
  D26 carry the attestation; the other 23 cite).
- *Quality characteristics.* All nine ISO/IEC 25010:2023 characteristics appear in the table
  (205–215), Safety included with its explicit not-addressed reasoning.
- *ASVS.* All fourteen chapters V1–V14 dispositioned across the 12-row mapping table (1400–1413),
  confirmed by scripted set-difference; V1/V10/V11 share one row.
- *Mandatory Clear Thought invocations.* All present or explicitly attested, by scripted sweep:
  `metacognitivemonitoring` (:219), `mentalmodel` / `mentalmodel(first_principles)` (:403, :478,
  :815, :838, :1131, :1160), `decisionframework` (:285, :316, :608, :1316),
  `structuredargumentation` (trace :1318, attestation :1344), `sequentialthinking` (attestation
  :1312 naming D5/D7/D8), `scientificmethod` (:1357, threat model), `collaborativereasoning`
  (:1304), and `debuggingapproach` attested *not* invoked with reasoning (:1348).
- *Gate B (auditable from the document alone).* Question 4 — "for each non-trivial decision, what
  factual premises was it verified against, and how?" — now passes at D3, which was round 17's
  failure point. It fails at one place: a reader asking "which paging contract does tool 34
  implement?" gets two incompatible answers from the same paragraph (Finding 1).
- *Gate C structural checklist.* Passes on the premise-citation item, which was round 17's failure.
  It fails on "File paths and external references are confirmed, not assumed" at one reference
  (Finding 3).
- *Deferred-decision trap.* One instance — the renewal threshold, Finding 2. The audit for this trap
  otherwise comes up clean: the six deferral-phrase hits in the document are Scope's designated
  *Deferred, with reasoning* subsection (:45, :47), D24's explicit *anti*-deferral rule (:1114),
  D26's vitest note which states plainly that "no architectural surface depends on it" (:1183), and
  Limitation 8(a)'s signed-URL host patterns, which sit in the contract's designated home for
  acknowledged gaps and are bounded by `EGRESS_ALLOW_HOSTS` being config rather than code.
- *Header claims.* The header's disclosure that the spec's own `Status:` line still reads "Draft for
  review" is confirmed (`docs/specs/spec-aps-fusion-mcp-server.md`:3), and `HANDOFF.md`'s "passed
  five independent blinded rounds with zero findings" matches the header's characterisation (Read at
  HANDOFF.md:12–15).

## Critical & Serious Findings

**No Critical or Serious findings** — the full inventory was Read or Grep-verified per Compliance
Gate B, and no violations of Critical or Serious classification were observed. In particular, the
three areas where a Serious finding would have landed were each examined and cleared: D27's
path-composition treatment (the vendor record was independently re-fetched and the document's
two-sided characterisation is accurate and precise about which reference page says which); the
threat model's control-column join (recomputed from scratch to zero violations under both readings);
and the MFG schema premise surface (56 of 56 assertions hold).

## Systemic Patterns

**No systemic patterns** — verified by the scans below, all run across the full inventory scope
*before* counting or classifying, per Step 8's proactive-scan rule. Each of the three findings was
scanned as a class rather than assumed isolated, and **no signature yields two or more instances**,
so extrapolating a systemic claim from any of them is the failure that rule exists to prevent.

1. **Self-asserted partitions** (the Finding 1 class). The document asserts nine partitions or
   completeness invariants about itself. Each was recomputed independently: effect classes
   (R = 23, W = 11, $ = 3, summing to 37 — and the R set `{1,2,3,4,5,6,7,8,9,10,11,12,22,24,25,26,
   27,29,30,32,34,35,37}` parsed from the Class column matches the document's four-group
   enumeration exactly, member for member); the W destructive/additive partition (5 `{13,16,17,19,
   33}` + 6 `{14,15,18,20,31,36}` = 11, with `idempotentHint` inverted across exactly that
   partition); the threat-model join (below); the traceability matrix (60/60, zero duplicates);
   D24's state-store completeness (nine durable obligations walked from D8, D9, D11, D12, D13 and
   D23 against nine table rows and the Components block's nine-artifact prose list — zero unlisted);
   D21's config-key closure (17 SCREAMING_SNAKE identifiers, of which 15 are config keys and all 15
   are declared in D21's block; `O_EXCL` is an fs flag and `AS_SAVED` an enum value); the standards
   tag set (below); the group file counts (1+6+6+9+7+4+4 = 37, with each group's membership walked
   against the inventory's Spec column); and the disposition classes. **One of the nine is
   violated** — the disposition classes, Finding 1. **Eight of nine hold.**
2. **Threat-model join integrity** (the round-16 class, recomputed rather than re-read). A Node
   script parsed the spec's §8 requirement→threat bindings from the spec source, the threat table's
   own "Via spec requirements" column, each decision's header requirement declaration, and the
   traceability matrix, then computed the join the document says produces its control column.
   *Check A* — the table's Via column against the spec's §8 bindings: **0 violations** in both
   directions. *Check B* — the computed join against the listed control column, per threat:
   **T1 {D1,D2,D3,D8,D28}; T2 {D1,D2,D9}; T3 {D2,D8,D10,D20,D28}; T4 {D11}; T5 {D6,D13,D14,D17,
   D22,D27,D28}; T6 {D10,D20,D28}; T7 {D1,D3}; T8 {D19} — 8 of 8 MATCH, zero missing, zero
   extra.** *Check B2* — the same join recomputed under the traceability-matrix reading of
   "declares" rather than the decision-header reading: **8 of 8 MATCH.** The Analysis paragraph's
   claim that the column "cannot drift" is true as written.
3. **Named bounds and tunables** (the Finding 2 class). Every occurrence of a configured cap,
   default, TTL, timeout or threshold in the document was enumerated and checked for a value and a
   config key: `MFG_MAX_PAGES` (config, default 20), `MFG_SEARCH_MAX_PROJECTS` (50),
   `MFG_SEARCH_ROW_LIMIT` (config, 25), `DM_POLL_MAX_FOLDERS` (config, 200), `UPLOAD_MAX_BYTES`
   (config, 100 MB), `HTTP_MAX_BODY_BYTES` (derived default plus a startup assertion),
   `TOKEN_LOCK_STALE_MS` (config, 45 000 ms, justified against D18's timeout), `AUTH_VERIFIER_TTL`
   (10 min), the webhook dedupe TTL (24 h), the outbound timeout (30 s, config), the webhook raw
   parser limit (1 MB, literal), the spend caps (20/20/10 per day), and Autodesk's own 2-minute
   signed-upload expiry. **Exactly one** — the token "renewal threshold" at :524–525 — carries
   neither a value nor a key. **Thirteen of fourteen hold.**
4. **Module-to-decision pointers** (the Finding 3 class). Every parenthetical decision pointer in
   the Components block (lines 54–123) was walked against the decision it names: `index.ts`→D3/D21,
   `config.ts`→D21, `logging.ts`→D20, `mcp-route.ts`→D2/D3, `auth-routes.ts`→D9,
   `webhook-route.ts`→D11, `health-route.ts`→**D26**, `middleware.ts`→D2/D3,
   `token-manager.ts`→D8/D10, `aps-http.ts`→D18/D13/D22, `spend-guard.ts`→D13,
   `output-guard.ts`→D19, `state-store.ts`→D24, `mfg-gateway.ts`→D5/D6/D7, `dm-gateway.ts`→D12/D23,
   `da-gateway.ts`→D23, `write-tools.ts`→D27, the handler-wrapper paragraph→D19, and the data-flow
   paragraph→D12. **Exactly one is wrong** — `health-route.ts`, Finding 3. The inventory table's own
   decision references (D7, D8, D11, D12, D14, D22, D23, D27, D28) were walked the same way and are
   all correct. **Eighteen of nineteen hold.**
5. **Verification-marker sweep** (the round-17 finding class, re-run to confirm closure rather than
   assume it). Every occurrence of `verif` in the artifact was enumerated (grep `-i "verif"`, **103
   hit lines**, up from round 17's 83 because of this round's added citation and prior rounds'
   additions), and every bare `(verified)` parenthetical was located: **exactly one, at line 350** —
   round 17's finding site. It is now backed by D3's Premise slot at :375–376 and the Standards
   row at :1554, so the claim is answerable from the document; round 17's remedy explicitly
   permitted the parenthetical to remain once the premise slot carried the citation. Every
   Context7-bearing paragraph was then checked for a library identifier and a date: **zero missing a
   date or version**, and the five paragraphs whose Context7 reference names the library by product
   rather than by `/org/project` path (the inventory disposition prose at :179, D14, D16, D17, D22)
   each resolve through the Standards table's corresponding row or a sibling decision's premise, so
   none reproduces round 17's defect. **Zero open instances of this class.**
6. **Standards decoration** (bracketed-tag extraction, body against the Standards table): **15 tags
   in the body, all 15 present in the table; zero body tags missing.** The table's one extra,
   `[APS-COMMERCIAL]`, is not decoration — the standard demonstrably drives D13's metered
   categories, D14's cost-class carving, the inventory's costlessness prose (:126–137, entirely
   APS-COMMERCIAL-derived: the 2026-08-17 pricing transition, Model Derivative metering translation
   jobs rather than retrieval, Automation metering WorkItem processing time) and Limitation 11, all
   via C4, which is cited eight times in the body. The contract's requirement runs body→table; the
   reverse direction is satisfied in substance.
7. **Markdown table integrity** (Node parse of every table block with GFM-correct escaped-pipe and
   inline-code handling, checking each row's cell count against its header and each block's
   blank-line termination): **7 tables, 0 defective rows, 7/7 blank-terminated.** Tables at 139–177
   (6 × 37), 205–215 (4 × 9), 1117–1127 (3 × 9), 1375–1384 (4 × 8), 1400–1413 (2 × 12), 1417–1450
   (5 × 32), 1527–1557 (3 × 29). This round's in-place rewrite of the Standards table's Express row
   preserved its cell count. Round 12's malformed-table class stays closed.

## Moderate & Minor Findings

### Finding 1 — Moderate (new). The disposition paragraph places tool 34 in two mutually exclusive classes, contradicting the invariant the same paragraph asserts and the wire contract D12 fixes

**What the document does now.** The paragraph at lines 179–201 opens (Read at drafting time):

> Every list-returning tool carries one of three stated dispositions (R-DISC-4), and the quantified
> set is enumerated here — **every inventory row returning a list appears in exactly one class.**
> **Cursor-paged** (takes an optional cursor, returns `pageInfo{hasMore, cursor}` backed by the
> API's native paging): tools 2–6, 8, 10, 11, 12, 35 …; tool 26 …; tool 27 …; tool 32 …;
> **tool 34 (the returned marker is the cursor).**

Thirteen lines later, in the same paragraph:

> **Merged-source resumable** — one member, tool 34, **which fits neither class above** because it
> merges a local append-only journal with a bounded remote descent rather than paging one API: it
> takes and returns *named* position fields (`marker`, `sequence`, `resume_position`) **instead of
> an opaque cursor + `pageInfo`**, per D12's deliberate two-clock separation …

And four lines after that:

> **The quantified set, derived from the Returns column of all 37 rows:** 20 rows return lists —
> cursor-paged {2, 3, 4, 5, 6, 8, 10, 11, 12, 26, 27, 32, 35}, bounded-single-response
> {7, 13, 24, 25, 30, 31}, merged-source resumable {34} …

Tool 34 is therefore enumerated as a member of Cursor-paged at :186 and, at :192–196, declared the
sole member of a class defined by *not* being either of the other two — with the Cursor-paged class's
defining property (`pageInfo{hasMore, cursor}`) explicitly denied of it. The quantified set at
:197–199 agrees with the second statement and contradicts the first. A third statement compounds it:
tool 34's own inventory row (:174) describes the tool as "**cursor-paged via three named fields
(D12)**", applying the Cursor-paged label to a tool the partition assigns elsewhere.

**How the claim was verified.**

- *The document's text.* Lines 178–203 Read at finding-drafting time; row 34 Read at :174. The three
  passages are quoted above verbatim.
- *The arithmetic.* The three disposition sets were parsed and unioned by script: cursor-paged 13 +
  bounded-single-response 6 + merged-source resumable 1 = **20 distinct with zero overlap**, leaving
  17 of 37 rows returning single objects or scalars — which is what the document states. Counting
  tool 34 in Cursor-paged as :186 says would make that set 14, the union 21 with one overlapping
  member, and both the "exactly one class" invariant and the "20 rows return lists" figure false.
  The quantified set is the arithmetically consistent statement; the prose enumeration is not.
- *The substance is settled elsewhere.* D12 (Read at :739–745) fixes the wire contract without
  ambiguity: "**Wire contract (tool 34's row states the same three-field contract):** three named
  fields, not an opaque composite — the response carries `marker` …, `sequence` …, and, only when
  `truncated:true`, `resume_position` … **Named typed fields rather than a composite token because
  D17's structured-output discipline exists precisely so agents branch on named fields.**"
- *Provenance.* The passage is present in the committed baseline — `git show HEAD:…` line 179 carries
  the identical string `tool 34 (the returned marker is the cursor).` — so it is pre-existing, not
  fix-induced. No prior round reported it: grep across all six prior review documents for
  `returned marker is the cursor`, `exactly one class`, and `appears in exactly one` returns **zero
  hits**. Rounds 13 through 17 each verified the disposition partition, but each computed it from the
  quantified set (round 13 :417, round 14 :542, round 15 :285, round 16 :317, round 17 :230) and
  none compared the prose enumeration against it. Round 12 (:139) verified it the same way against
  the then-36-row inventory.

**Which standard it violates.** The authoring contract's **Gate B** pass condition: "every question
above is answerable from the document alone by pointing to a specific section. A question that
requires subjective interpretation of the document is a Gate B failure." The question here — *which
paging contract does tool 34 implement?* — is answerable only by adjudicating between two statements
in one paragraph, which is interpretation, not lookup. It also engages the **deferred-decision
trap**'s failure mode as the contract describes it: "the planner and the implementer encounter
ambiguity the architect should have resolved, and they resolve it inline." The ambiguity here is
produced by contradiction rather than by explicit deferral, but the downstream cost is identical.
This matters more than an ordinary prose slip because **D15 designates this exact section as
authoritative**: "The inventory table in Components is the contract" (:834–835).

**Why it matters.** The two classes are different wire contracts, and under **D17** every
data-returning tool's `outputSchema` is a declared artifact the SDK validates `structuredContent`
against. A planner reading :186 and row 34's "cursor-paged" label gives tool 34 an
`outputSchema` composing the shared `pageInfo{hasMore, cursor}` envelope; a planner reading
:192–199 and D12 gives it `marker`, `sequence` and `resume_position`. Those are not cosmetically
different — they are incompatible contracts for the one tool whose whole design rationale (D12's
two-clock separation) is that an opaque cursor **cannot** express its position, because the journal
sequence and the Autodesk-clock marker advance independently. Shipping the `pageInfo` form would
collapse exactly the distinction D12 exists to preserve. The blast radius is bounded — D12 is a
full five-part decision, it is unambiguous, and the quantified set in the same paragraph agrees with
it, so the weight of the document points one way — which is why this is Moderate rather than
Serious.

**What correct implementation looks like.** One deletion, one word. (a) In the Cursor-paged
enumeration at :185–186, **delete the clause `; tool 34 (the returned marker is the cursor)`** so
the enumeration ends at tool 32 and lists exactly the thirteen members the quantified set names.
(b) In tool 34's inventory row at :174, replace **`cursor-paged via three named fields (D12)`** with
**`merged-source resumable via three named fields (D12)`**, matching the class name the paragraph
defines. **Do not change the quantified set, the class definitions, the "20 rows return lists"
figure, D12's wire contract, or any other inventory row** — all were re-derived this round and are
correct.

**Provenance: new.** Text byte-identical to the committed baseline, and no prior round reported it.

### Finding 2 — Moderate (new). D8(b) makes the refresh trigger a "renewal threshold" of expiry but never gives that threshold a value or a config key, leaving the one bound in the document that is neither pinned nor tunable — and leaving AC-25's third clause with no pass/fail boundary

**What the document does now.** D8(b) (Read at :523–526 at drafting time) reads:

> (b) **Atomicity, and minimizing the window (R-REL-7):** refreshes are **demand-driven, never
> opportunistic** — a refresh is issued only when the access token is within **the renewal
> threshold** of expiry, so the number of rotation windows the server opens over its life is the
> minimum the workload requires.

That is the only occurrence of the term in the document, and no value, default, or configuration key
accompanies it anywhere.

**How the claim was verified.**

- *The document's text.* Lines 523–526 Read at finding-drafting time, quoted above.
- *The absence.* Grep for `threshold\|near expiry\|renewal\|renew\b` (case-insensitive) across the
  artifact returns **exactly two hit lines, :524 and :525** — the two lines of the single sentence
  quoted. Scripted extraction of every SCREAMING_SNAKE identifier in the document yields 17, of
  which 15 are config keys, and all 15 were checked by substring membership against D21's block
  (:1003–1062): `APS_CALLBACK_URL`, `AUTH_VERIFIER_TTL`, `DA_OUTPUT_FOLDER_ID`,
  `DM_POLL_MAX_FOLDERS`, `EGRESS_ALLOW_HOSTS`, `HTTP_MAX_BODY_BYTES`, `MCP_AUTH_TOKEN`,
  `MFG_MAX_PAGES`, `MFG_SEARCH_MAX_PROJECTS`, `MFG_SEARCH_ROW_LIMIT`, `SPEND_REQUIRE_CONFIRM`,
  `TAILNET_BASE_URL`, `TOKEN_LOCK_STALE_MS`, `UPLOAD_MAX_BYTES`, `WEBHOOK_PUBLIC_URL`. **No
  refresh-threshold key exists.** D21's optional-with-documented-defaults list was Read in full and
  contains no such entry.
- *The spec's demand.* `docs/specs/spec-aps-fusion-mcp-server.md`:306 (R-REL-7) — "a refresh SHALL be
  attempted only when the access token is **actually near expiry**, never opportunistically"; :605
  (AC-25) — "the refresh path is observed … to **refresh only when the access token is near expiry**
  rather than opportunistically." Both Read at drafting time.
- *The document's own convention.* The tunable sweep recorded under Systemic Patterns item 3 walked
  all fourteen named bounds; thirteen carry a value, a key, or both. `TOKEN_LOCK_STALE_MS` is the
  instructive case: D8(c) (:537–539) does not merely give it a default but *justifies* the number
  against a sibling decision — "default 45 000 ms — **strictly exceeding D18's 30 s outbound
  timeout** so a live refresh's lock is never stolen mid-flight."
- *Provenance.* No prior round reported it: grep across all six prior review documents for
  `renewal threshold` and `near expiry` returns **zero hits**.

**Which standard it violates.** Spec **R-OPS-2**: "Every configuration value SHALL be documented,
validated at startup, read once at startup rather than rediscovered per call, and **given a sane
default where one exists**." Read with the authoring contract's **deferred-decision trap** — "If a
decision is non-trivial and could affect another component or another quality characteristic, the
architecture resolves it" — and the contract's own test for non-triviality: "Any decision where a
wrong choice could cause a security failure, data loss, operational failure, breaking change,
integration mismatch, or significant rework." This threshold meets that test, as the next paragraph
shows.

**Why it matters.** Two concrete consequences, neither hypothetical. First, there is an unaddressed
interaction with **D18**, which gives every outbound request an `AbortSignal.timeout` (default 30 s)
and retries safe operations up to three attempts with exponential backoff and jitter. A renewal
threshold shorter than the worst-case request duration lets a token pass the near-expiry check at
dispatch and expire mid-flight; the resulting 401 becomes an `auth`-class error under D16 and the
tool call fails, because D8 explicitly rejects refresh-on-401 retry loops ("Not refresh-on-401-retry
loops (unbounded, and non-idempotent against rotating tokens)"). The document reasons about exactly
this class of interaction for `TOKEN_LOCK_STALE_MS` and does not for this one. Second, **AC-25** —
the acceptance criterion the whole of D8(b) exists to satisfy — asks a reviewer to observe that
refresh happens only when the token is near expiry; without a stated threshold there is no boundary
separating a passing observation from a failing one, so the criterion is unfalsifiable as written
against this architecture. The design property itself is sound and fully stated, and any sane value
satisfies its spirit, which is why this is Moderate rather than Serious.

**What correct implementation looks like.** One config-key addition and one clause. Add a key to
**D21's optional-with-documented-defaults list** in the form the other fourteen bounds use — e.g.
`TOKEN_RENEWAL_THRESHOLD_MS` (default 300 000 ms) — and extend **D8(b)**'s sentence to name the key
and state the relation the number must hold, in the form D8(c) already uses for
`TOKEN_LOCK_STALE_MS`: the threshold must strictly exceed the worst-case duration of a single
outbound request under D18 (timeout × maximum attempts plus backoff), so a token that passes the
check at dispatch cannot expire before the response arrives. **Do not change D8's classification
table, the journal-before-refresh ordering, the write-bytes-before-parsing rule, the single-flight
mutex, `TOKEN_LOCK_STALE_MS`, or Limitation 7** — all were re-derived this round and are correct,
and the write-before-parse rule in particular is the exact property the amended R-REL-7 demands.

**Provenance: new.** Text byte-identical to the committed baseline, and no prior round reported it.

### Finding 3 — Minor (new). The Components block points `health-route.ts` at D26, the test-seam decision, instead of D25, the decision that actually specifies `/healthz`

**What the document does now.** The Components block's `http/` listing (Read at :70–77 at drafting
time) reads:

> ```
>     health-route.ts        GET /healthz: liveness + auth-state summary, no secrets (D26).
> ```

D26 (header Read at :1176) is "**Test seam:** constructor-injected `fetch` and clock; vitest as the
runner (plan-level confirmable)" and contains nothing about `/healthz`. D25 (header Read at :1146)
is "**Health & smoke:** unauthenticated-but-minimal `/healthz`; documented stdio smoke invocation"
and is the decision that specifies the endpoint, its payload, its position outside the bearer gate,
and its trust-model documentation obligation.

**How the claim was verified.**

- *The document's text.* Line 76 Read at drafting time; D25's and D26's headers Read at :1146 and
  :1176.
- *Every reference to both decisions was enumerated.* Grep for `\bD25\b` returns :212 (the
  Interaction-capability quality row), :521 (D8's probe cross-reference to `/healthz`), :1146 (the
  header), and traceability rows :1434, :1435, :1436 (R-OPS-3, R-OPS-4, R-OPS-5) — every one of them
  a health-or-operability context, correctly. Grep for `\bD26\b` returns :76 (this defect), :210
  (Maintainability, correct — injectable I/O seams), :385 (D4's "enabling the D26 test seam",
  correct), :1176 (the header), and traceability rows :1426, :1428, :1431 (R-REL-2, R-REL-4,
  R-REL-7, each annotated "test seam", correct), plus the SOLID standards row :1549 (correct). **The
  Components line is the single reference to D26 that is not about the test seam.**
- *The recovery paths are intact.* The traceability matrix maps **R-OPS-5 → D25** (:1436), so a
  reviewer working from requirements reaches the right decision; and the module line itself states
  the design ("liveness + auth-state summary, no secrets"), which matches D25's specification.
- *Provenance.* Present in the committed baseline at `HEAD` line 71 with the identical text, so it is
  pre-existing, not fix-induced. Grep across all six prior review documents for `health-route`
  returns **zero hits** — no prior round reported it.

**Which standard it violates.** The authoring contract's **Gate C** mechanical item: "File paths and
external references are confirmed, not assumed." The Components block is the document's module→
decision map, and this entry names a decision that does not govern the module.

**Why it matters, and why Minor.** The Components block is what the contract says the planner reads
to know "where the work happens," and the plan's "per-step Source annotations point at this
document's D-numbers" — so a planner writing the `health-route.ts` step can carry `D26` forward into
a plan step whose Source annotation is then simply wrong, and a plan reviewer diffing plan against
architecture would have to catch it. That is a real cost. It is nonetheless **Minor** rather than
Moderate because no wrong build follows: the module line states the design correctly, D25 is one
search away and is the only decision in the document about `/healthz`, and the traceability matrix
routes R-OPS-5 to D25 correctly, so no reader is left without the governing decision. The cost is a
misdirected lookup and a possibly-wrong downstream annotation, not an undetermined design. This is a
judgment call at the Minor/Moderate boundary and is recorded as such; the verdict is unaffected
either way, since a finding of any severity blocks PASS.

**What correct implementation looks like.** Change `(D26)` to `(D25)` on line 76. **Touch nothing
else** — the other eighteen module-to-decision pointers in the block were walked this round and are
correct.

**Provenance: new.** Text byte-identical to the committed baseline, and no prior round reported it.

## Tentative Findings

**No tentative findings** — every candidate finding's premise was verified per Compliance Gate B.
Three candidates were examined and resolved rather than carried:

- *Whether the Model Derivative `signedcookies` endpoint accepts the whole-value percent-encoded
  `derivative_urn`.* Genuinely unresolvable here — the credential is cleared, so no request can be
  issued (independently confirmed this round: `C:/Users/maxco/.aps-fusion-mcp/tokens.json` reads
  literal `null`). It is **not** a tentative finding because it is not a finding at all: the
  artifact states both sides of the vendor record, names which one the gateway follows and why, and
  records the residual with its closing check as Limitation 8(c). That is the contract's designated
  handling for a claim that cannot be verified with available tools. I re-fetched the record rather
  than accepting the document's account — Context7 `/websites/aps_autodesk_en`, 2026-07-30 returns
  both halves: the `signedcookies` reference page's own parameter table says only "**derivativeUrn**
  (string) - Required - The URN of the derivative", the .NET SDK reference says "The `derivativeUrn`
  parameter is the **URL-encoded URN** of the derivative", and the worked cURL invocation embeds the
  URN with literal `/` and `:`. D27's attribution is accurate and precise about which page says
  which.
- *Whether MFG `ItemVersion.id` is the Data Management version-URN form.* Same blocker, same correct
  handling: D27 marks the assumption "**not live-verified**" in the decision text and Limitation
  8(b) names the exact closing query. Re-derived rather than imported: programmatic introspection
  confirms `ItemVersion.id` is typed `ID!` with no format information, so the schema cannot settle it
  either, and `docs/apsq.mjs` is present (2,927 bytes) but unusable without a credential.
- *Whether the renewal-threshold gap (Finding 2) is instead an implementation detail below
  architecture altitude.* Resolved against that reading rather than left tentative. The document's
  own Scope section deliberately defers "exact GraphQL document text and REST bodies" and "the
  plan's step ordering and test list" as below altitude, and pins every other quantitative bound at
  architecture level with a config key and a default — including bounds of strictly smaller
  consequence, such as `MFG_SEARCH_ROW_LIMIT`. The threshold's interaction with D18's timeout budget
  and with AC-25's observability places it on the architecture side by the document's own line.

## Observations

- The introspection dump's top-level object carries only `data` and `extensions`, and the schema body
  exposes `queryType` and `types` with **no `mutationType` pointer**. `Mutation` is nonetheless
  present as a type with 45 fields, and all eight mutations the architecture names (`createFolder`,
  `renameFolder`, `moveFolder`, `copyFolder`, `deleteFolder`, `createDesignFromFile`,
  `setProperties`, `createPropertyDefinition`) exist on it. This affects no claim the architecture
  makes; it is worth knowing before the build introspects this file, because a tool resolving
  mutations through `mutationType` will find none. (Recorded by rounds 14 through 17 as well;
  independently re-derived here.)
- `HANDOFF.md` describes the architecture as having a "36-tool inventory" (:17) and says "Thirteen
  rounds of independent blinded review ran" (:6); the artifact has 37 tools (verified by table parse)
  and this is round 18. The architecture header cites `HANDOFF.md` only for the spec's review status,
  not for the tool count or the round count, so neither is a defect in the artifact under review —
  but a reader who starts from `HANDOFF.md` will begin with two stale figures.
- D18 describes the billable derivative generation as "a field on a Query type"
  (`ComponentVersion.derivatives(derivativeInput:{generate:true})`). Introspection confirms the
  substance — `derivatives(derivativeInput: DerivativeInput!)` is a field on `ComponentVersion` (an
  OBJECT type), reached through `Query.componentVersion(componentVersionId: ID!)`, so the billable
  operation genuinely sits on the query side rather than being a mutation, which is the decision's
  whole point. The phrase would read more exactly as "a field reachable from the Query root", and the
  parenthetical names the exact field either way.
- The spec file's `Status:` line still reads "Draft for review" (verified at
  `docs/specs/spec-aps-fusion-mcp-server.md`:3) while `HANDOFF.md` records a five-round zero-findings
  pass. The architecture header discloses exactly this discrepancy and declines to resolve it, which
  is the correct handling of governance metadata the architecture does not own.
- The artifact header states that the R-REL-7 / AC-25 spec amendment "has not itself been reviewed —
  it owes its own review round." That remains true; this review evaluated the architecture against
  the amended spec text as the architecture declares, and did not review the amendment.

## What's Actually Good

- **Round 17's finding is closed on both limbs, and the fix reached no further than the finding.**
  D3's Premise slot now ends (Read at :375–376): "`express.json()`'s `limit` option defaults to
  `'100kb'` — verified via Context7 `/expressjs/express`, 2026-07-30." The Standards table's Express
  row now reads (Read at :1554): "| Express 5 | Context7 `/expressjs/express`, 2026-07-28 (D11) and
  2026-07-30 (D3) | D3 (`express.json` body-limit default behind the `/mcp` parser mount), D11
  (raw-body capture for HMAC) |". Both carry library, date, and what was confirmed, in the form
  every other library premise in the document uses. I re-fetched the fact independently rather than
  relaying three prior rounds' confirmations — Context7 `/expressjs/express`,
  `express.json([options])` parameter table: "**limit** (string | number) - Optional - Request body
  size limit. **Default: '100kb'**" — so the citation is not merely present but correct, and
  100 kB ÷ (4/3) ≈ 75 kB remains the right consequence. The standard this is good by is the one
  round 17 named: the contract's Phase 6 verification discipline read with Gate C's premise-citation
  item and Gate B's question 4. Equally to the point, the section-offset analysis shows the edit
  added exactly one line and changed nothing outside D3 and the Standards row — the second
  consecutive round with no regression at the fix site, after rounds 15 and 16 each produced one
  because an edit reached past its finding.
- **The threat model's own asserted invariant holds under mechanical test, for the second
  consecutive round and under a stricter instrument.** The Analysis paragraph claims the control
  column is a join that "cannot drift." I recomputed that join from scratch rather than reading the
  table: the spec's §8 requirement→threat bindings parsed from the spec source, each decision's
  header requirement declaration extracted by script, the threat table parsed with a GFM-aware
  splitter, and the join evaluated per threat — **eight of eight rows match exactly, zero missing
  and zero extra, under both the decision-header reading and the traceability-matrix reading of
  "declares."** The Via column independently matches the spec's §8 bindings in both directions with
  zero violations. A claim that a table cannot drift is only worth making if something can check it,
  and this one checks out.
- **The MFG schema premise surface survives independent programmatic re-derivation at full density,
  for the fifth consecutive round.** 56 assertions were machine-checked against
  `docs/aps-mfg-schema.json` and **all 56 pass**. Among them: 209 types; the `Item` interface carries
  exactly the twelve fields named "and nothing else"; `Item.possibleTypes` is exactly the four
  concrete types and all four bear `tipVersion` and `versions`; `tipRootComponentVersion` has exactly
  one carrier (`DesignItem`) and `tipConfigurationTable` exactly one (`ConfiguredDesignItem`); the
  `ItemVersion` interface carries `versionNumber`/`createdOn`/`lastModifiedOn`, making tool 35's field
  list interface-safe; `ComponentVersion` carries the named part-level fields and has **no**
  `versionNumber` and **no** `createdOn`, while both `DesignItemVersion` and
  `ConfiguredDesignItemVersion` carry both and both expose `item`, which is what makes tool 12's two
  `fusionWebUrl` traversals resolve; `fusionWebUrl` is present on exactly the six named types and
  absent from `ComponentVersion`; the schema has exactly nine `ComponentVersion`-typed fields with
  `ConfigurationRow.rootConfigurationMember` among them; `ConfigurationTable.rows` takes zero
  arguments, confirming "API-unpaginated, so the bound is tool-level"; `ItemFilterInput` carries only
  `name` and `itemType`, confirming D7's and D12's "no server-side changed-since filter" reasoning;
  `item(hubId: ID!, itemId: ID!, …, composition: ItemCompositionEnum)` really does require both ids
  and take composition with values WORKING/RELEASED/AS_SAVED/LATEST; `itemsByFolder(hubId!,
  folderId!, …)` really does take no project id while `itemsByProject(projectId!, …)` takes no hub
  id; and `OutputFormatEnum` is exactly STEP, STL, OBJ. By the authoring contract's Phase 10
  element-5 standard this is what a verified premise slot is supposed to look like.
- **The three external premises whose reversal would be most damaging re-derive verbatim.** D14's
  annotation matrix rests on correctly-read SDK defaults: Context7
  `/modelcontextprotocol/typescript-sdk/v1.29.0`, `ToolAnnotationsSchema` in
  `packages/core/src/schemas.ts` and the `ToolAnnotations` interface declare `readOnlyHint`
  **Default: false**, `destructiveHint` **Default: true** ("meaningful only when
  `readOnlyHint == false`"), `idempotentHint` **Default: false**, `openWorldHint` **Default: true** —
  exactly what D14 asserts, including the non-obvious half that `destructiveHint` defaults *true*,
  which is why W-class tools must set it explicitly. D3's transport premise re-derives to the line:
  `WebStandardStreamableHTTPServerTransportOptions` carries `sessionIdGenerator`,
  `enableJsonResponse`, and `allowedHosts`/`allowedOrigins`/`enableDnsRebindingProtection` each
  marked `@deprecated Use external middleware …`, and `sessionIdGenerator: undefined` is the
  documented stateless mode. D1's topology rests on a Tailscale rule quoted almost verbatim: Context7
  `/websites/tailscale` — "The same port number cannot be simultaneously used for Tailscale Serve
  (private) and Tailscale Funnel (public and private). If `serve` was the most recent command, the
  port is private. If `funnel` was the most recent command, the port is public", and Funnel "can only
  listen on ports 443, 8443, and 10000" with TLS terminated by the Tailscale daemon. Getting any of
  these backwards would ship a false cost hint or silently flip the entire MCP surface public.
- **D19's zod premise is precise about a distinction that is easy to get wrong.** D19 declines
  `.merge()` because its documented semantics — the result inherits the second schema's
  `unknownKeys` policy and catchall — "appear in the **v3** reference … not the v4 reference, and an
  inheritance rule that can silently change a composed schema's strictness is the wrong foundation
  for a schema-legal-by-construction guarantee." Context7 `/colinhacks/zod`, 2026-07-30 returns that
  exact sentence — "The resulting schema also inherits the 'unknownKeys' policy and catchall schema
  from the second object" — sourced to `packages/docs-v3/home.md`, while the object-composition and
  `.catchall()` documentation for v4 sits in `packages/docs/content/api.mdx`. The decision's
  reasoning is not decoration over a stylistic preference; it turns on a real, correctly-located
  semantic.
- **Every predecessor-source claim in the premise slots is confirmed at file:line.** Ten checks, all
  correct: the v2 deprecation banner, `/mfg/v3/graphql/public`, and ComponentVersion removal at
  `src/constants.ts`:9–10 (D5); `app.post("/mcp", …)` at `src/index.ts`:71 with
  `app.use(express.json())` at :45 and no auth middleware on any route, and the hardcoded version at
  :22 (D1/D2/D3/D21); `clearTokens()` defined at `src/services/aps-auth.ts`:38 and called at :119 in
  the refresh failure path, with `isAuthenticated()` returning `currentTokens() !== null` at
  :145–146 (D8); zero hits for `code_challenge|codeChallenge` across `src/` (D9); the two divergent
  truncation implementations at `src/tools/mfg-data-model.ts`:30 and
  `src/tools/model-derivative.ts`:9 (D19); the bare-quote
  `componentVersionId: "${component_version_id}"` at `src/tools/mfg-data-model.ts`:590 (D6);
  `readOnlyHint: true` at :480 in the same tool as `generate: true` at :497 (D14); `urnToBase64` at
  `src/services/aps-client.ts`:38 (D27); and the caret ranges `^1.29.0`/`^5.2.1`/`^4.3.6` in
  `package.json` with `package-lock.json` present (D21). The document uses each as defect evidence
  rather than as precedent, which is what M-1/M-2 require — and which is the codebase-mirroring
  trap's designed defence.

## Convergence Record

**Round:** 18 (post-fix), matching Scope and Inventory.

**Trajectory:** R9: 6 → R10: 4 → R11: 6 → R12: 4 → R13: 3 → R14: 3 → R15: 1 → R16: 2 → R17: 1 →
**R18: 3**. R12–R17 are grep-verified from each round's own verdict line (`round-12` = 4 findings;
`round-13` = 3; `round-14` = 3; `round-15` = 1; `round-16` = 2; `round-17` = 1). R9–R11 are taken
from round 12's own Convergence Record (Read at `round-12`:147); rounds 1–8 and the round 9–11
documents are not present in this repository (`ls docs/reviews/` returns only rounds 12–17), so those
three counts are recorded from a prior document rather than independently re-derived. R18's count is
this review's own mechanical breakdown.

**Flow counts for R18** (the closure re-derived from current source against the standard the original
finding named, never from the fix author's assertion):

- **Prior findings closed: 1 of 1.**
  - **R17 F1** (Moderate-new — D3 rested a load-bearing Express behaviour claim on a bare
    "(verified)" with no library, version or date; the claim was absent from D3's own Premise slot,
    and the Standards table's Express row named D11 alone) — **closed, on both limbs round 17
    specified.** *Limb (a), add the Express premise to D3's Premise slot with library,
    version-or-date and what was confirmed:* lines 375–376 now read "`express.json()`'s `limit`
    option defaults to `'100kb'` — verified via Context7 `/expressjs/express`, 2026-07-30" (Read at
    drafting time). *Limb (b), extend the Standards table's Express 5 row to name D3 alongside D11:*
    line 1554 now reads "| Express 5 | Context7 `/expressjs/express`, 2026-07-28 (D11) and
    2026-07-30 (D3) | D3 (`express.json` body-limit default behind the `/mcp` parser mount), D11
    (raw-body capture for HMAC) |" (parsed with the GFM-aware splitter; the row's cell count is
    unchanged at 3). The underlying fact was independently re-fetched rather than relayed — Context7
    `/expressjs/express`, `express.json([options])` parameter table, "**limit** … **Default:
    '100kb'**". Closed against the standards originally named: the contract's Phase 6 verification
    discipline, Gate C's premise-citation item, and Gate B's question 4. Round 17's edit prohibitions
    were all honoured — the 100 kB figure, the `ceil(UPLOAD_MAX_BYTES × 4/3) + 1 MB` formula, the
    startup assertion, and the middleware ordering (round 14's finding) are byte-identical to the
    prior tree, confirmed by re-Read at :344–357.
- **New findings: 3** (Findings 1, 2 and 3 — all three byte-identical to the committed `HEAD`
  object, so all three are pre-existing text, and each was grep-checked against all six prior review
  documents with zero hits).
- **Regressions: 0.** This is the second consecutive round in which the fix site produced no new
  finding. The region-isolated offset analysis confirms the edit added one line inside Design
  decisions and nothing elsewhere; every accounting surface downstream (37 inventory rows, 60
  traceability entries, 7 tables, 15 config keys, 28 decision slots, 15 standards tags, 9 state-store
  obligations, the 8-row threat join) was re-derived and came through unchanged.
- **Recurring: 0.**

**Tripwire evaluation — NOT FIRED**, with the arithmetic shown for both conditions. **Both streaks
are at one of two: armed, not fired.**

- *Condition (a): new + regression ≥ closed, for two consecutive post-fix rounds.* **R18: 3 + 0 = 3
  vs 1 closed → 3 ≥ 1 is TRUE.** R17 was 1 + 0 = 1 vs 2 closed → 1 ≥ 2 is FALSE, so the streak
  entering this round was 0. It is now **1 of 2**. Does not fire.
- *Condition (b): total findings has not strictly decreased, for two consecutive post-fix rounds.*
  **R18: 3 vs R17's 1 → 3 is not less than 1, so it did NOT strictly decrease → TRUE.** R17 was 1 vs
  R16's 2 → did strictly decrease → FALSE, so that streak entering this round was also 0. It is now
  **1 of 2**. Does not fire.

Neither condition holds for two consecutive rounds, so neither streak reaches two and the tripwire
does not fire. Round 19 is therefore the round in which either condition firing routes to
foundational rework.

**Reading the count honestly.** A rise from one finding to three would ordinarily be the signature
the tripwire exists to name, and it is not that here — the distinction matters enough to state
plainly, because a next round that misreads it will over-correct. All three findings are text that
is byte-identical to the committed baseline, none was introduced or exposed by the fix, and none was
reported by rounds 12 through 17. The count rose because this round ran three scan classes the cycle
had not run before: comparing the disposition paragraph's *prose enumeration* against its own
quantified set (earlier rounds computed the partition from the quantified set alone, which is
self-consistent and hid the contradiction); sweeping every named bound for a value or key; and
walking every module-to-decision pointer for correctness rather than for resolvability (the
cross-reference check earlier rounds ran proves no `D#` is dangling, which a wrong-but-existing
pointer passes). The qualitative signal at the fix site is unchanged from round 17's and remains
good: the edit was exactly the two additive changes specified, it reached no further, and the
document's substantive design — the threat join, the schema surface, the annotation matrix, the
topology, the token lifecycle — re-derived clean under a stricter instrument than any prior round
applied.

## Recommended Priority

The tripwire has not fired, so another fix round is the indicated path; recommending foundational
rework over a non-fired tripwire would be as wrong as recommending another round over a fired one.
All three findings are small, bounded, and located — the total edit is one clause deleted, one word
replaced, one config key added with a sentence, and one digit changed.

1. **Finding 1 (Moderate) — one deletion and one word, in two known places.** Delete
   `; tool 34 (the returned marker is the cursor)` from the Cursor-paged enumeration at :185–186, and
   change tool 34's inventory row at :174 from `cursor-paged via three named fields (D12)` to
   `merged-source resumable via three named fields (D12)`. This is the finding with real downstream
   consequence — it decides tool 34's `outputSchema` shape — so fix it first. **Do not change the
   quantified set, the class definitions, the 20/17 split, or D12's wire contract**; all four are
   correct and the quantified set is the statement the other two passages must be brought into line
   with.
2. **Finding 2 (Moderate) — one config key and one clause.** Add a token-renewal-threshold key to
   D21's optional-with-documented-defaults list with a stated default, and extend D8(b) to name the
   key and state the relation the value must hold against D18's request-duration budget — in the same
   form D8(c) already uses to justify `TOKEN_LOCK_STALE_MS` against D18's 30 s timeout. That
   sentence is the model; follow it rather than inventing a new one.
3. **Finding 3 (Minor) — one digit.** Change `(D26)` to `(D25)` on line 76.
4. **Touch nothing else.** D3, D27, the threat table, the traceability matrix, the tool inventory's
   other 36 rows, the state-store table, the standards table, and the schema-derived premise slots
   were all re-derived this round and are correct. Rounds 15 and 16 each produced a regression because
   an edit reached past its finding; rounds 17 and 18 did not, because they did not. The same
   discipline closes these three.
5. **Re-run the checks, not just the edits.** Three of this cycle's findings were found by computing
   the document's own asserted invariants rather than reading them, and this round's three came from
   three scans nobody had run before. After editing, re-run the disposition-partition check in the
   form that catches this class: parse the prose enumeration of each class *and* the quantified set,
   and assert the two produce identical sets. Confirm the union is 20 with zero overlap and that 37 −
   20 = 17. The check is cheap and it is what turns "every row appears in exactly one class" from an
   assertion into a fact.
6. **Carry Limitations 8(b) and 8(c) into the build as gating checks, not as prose.** Both remain
   correctly handled as unverifiable while the credential is cleared — independently re-confirmed
   this round — and both name a specific query to run after the M-3 re-auth. They are the two places
   where the built server can diverge from this architecture without any document defect being
   visible, so the plan should schedule them as the first two post-authentication verifications
   rather than leaving them to be rediscovered.

Nothing in this round calls for re-opening D27's structure, Limitation 8's shape, the threat model,
D3's body-limit reasoning, or the schema-derived tool contracts.

## Verdict

Verdict: NEEDS FIXES (3 findings: 2 Moderate, 1 Minor)
