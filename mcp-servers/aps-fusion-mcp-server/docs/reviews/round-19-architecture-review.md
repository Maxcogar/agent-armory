# Expert Review — Architecture: APS Fusion MCP Server (Round 19)

## Scope and Inventory

**Round 19** (post-fix; the first review is round 1, the prior completed review is
`docs/reviews/round-18-architecture-review.md`). The inventory is constructed by the post-fix rule
from all four required sources: the prior review's full inventory, the fix-diff files, the fix-diff
files' dependents, and the prior review's findings as closure items.

**Fix-diff.** `git diff HEAD -- docs/architectures/architecture-aps-fusion-mcp-server.md`: one file,
+199/−104. No commit has been made since before round 13 (`HEAD` = `f1e58a9`, 1,482 lines), so that
diff spans the edits of rounds 13 through 19; the working tree is 1,577 lines. **Round 19's own edit
was isolated two independent ways, and the two agree:**

- *Section-offset comparison.* Round 18 recorded its working tree at 1,573 lines with these `## `
  heading positions: Design decisions 217, Threat model 1354, ASVS 1395, Traceability 1415,
  Limitations 1454, Standards 1525, Status 1559. Scripted extraction of the current tree gives:
  Design decisions **217** (+0), Threat model **1358** (+4), ASVS **1399** (+4), Traceability
  **1419** (+4), Limitations **1458** (+4), Standards **1529** (+4), Status **1563** (+4). The shift
  is uniform at +4 from the Threat model onward and zero at Design decisions, so this round added
  exactly **four** lines inside the Design decisions section and changed the net line count nowhere
  else; 1,573 + 4 = 1,577, which is the observed length. Zero net change before Design decisions is
  what two in-place edits in the Components block produce.
- *Byte-comparison against the committed baseline.* The three sites round 18's findings named were
  each compared between the extracted `HEAD` object and the working tree. `HEAD`:71 carries
  `health-route.ts … (D26).`, the working tree :76 carries `(D25)`. `HEAD`'s disposition paragraph
  ends its Cursor-paged enumeration `…; tool 34 (the returned marker is the cursor).`; the working
  tree's ends at tool 32. `HEAD` has **zero** occurrences of `TOKEN_RENEWAL_THRESHOLD_MS`; the
  working tree has two (:525, :1036). Independently, `HEAD`'s row-8 string and the working tree's are
  byte-identical, and `HEAD`'s disposition-paragraph opening sentence and the working tree's are
  byte-identical — establishing that Finding 1 of this round rests on pre-existing text.
  Round 18's recorded line contents are a prior-document claim used only to locate the edit; every
  finding and closure below is re-derived from current source.

Round 19's edit is therefore exactly the three edits round 18's Recommended Priority specified, and
nothing else: the `; tool 34 …` clause deleted from the Cursor-paged enumeration, tool 34's inventory
row relabelled, `(D26)` → `(D25)` on the health-route line, and the four added lines carrying
`TOKEN_RENEWAL_THRESHOLD_MS` into D8(b) and D21.

**Dependents of the fix-diff file: none exist.** The artifact is a markdown design document, nothing
imports it, and the `src/` tree it specifies has not been created. Recorded rather than assumed —
see the tool plan. `git status --short` lists five other modified paths (`package.json`,
`src/constants.ts`, `src/index.ts`, `src/services/aps-auth.ts`, `src/tools/mfg-data-model.ts`) and
the untracked review documents; the modified source files are the untouched predecessor's
pre-existing working-tree state, not this revision's product.

| # | File | Status |
|---|------|--------|
| 1 | `docs/architectures/architecture-aps-fusion-mcp-server.md` | [x] Read in full, 1,577 lines (four passes: 1–220, 217–616, 616–1015, 1015–1577), plus targeted re-Reads at 146–149, 171, and 179–202 at finding-drafting time |
| 2 | `docs/specs/spec-aps-fusion-mcp-server.md` | [x] Read in full, 638 lines |
| 3 | `.claude/skills/expert-architecture/SKILL.md` | [x] Read in full, 581 lines — the authoring contract that produced the artifact and one of its governing standards; item-by-item conformance is in Upstream Contract Verification |
| 4 | `HANDOFF.md` | [x] Read at lines 6, 12–15, 17 — the spec's "passed five independent blinded rounds with zero findings" record, cross-checked against the artifact header's characterisation |
| 5 | `docs/reviews/round-18-architecture-review.md` | [x] Read in full, 795 lines (prior finding list and closure items; provenance source only) |
| 6 | `docs/reviews/round-17-architecture-review.md` | [x] Grep-verified — verdict line (`NEEDS FIXES (1 finding: 1 Moderate)`); grepped for `TOKEN_RENEWAL_THRESHOLD_MS`, `max_pages`, `tool 8`, `assembly_structure` (0 hits each) |
| 7 | `docs/reviews/round-16-architecture-review.md` | [x] Grep-verified — verdict line (1 Serious-regression, 1 Moderate-new); same four provenance greps, 0 hits |
| 8 | `docs/reviews/round-15-architecture-review.md` | [x] Grep-verified — verdict line (1 Serious-regression); same four provenance greps, 0 hits |
| 9 | `docs/reviews/round-14-architecture-review.md` | [x] Grep-verified — verdict line (3 findings); same four provenance greps, 0 hits |
| 10 | `docs/reviews/round-13-architecture-review.md` | [x] Grep-verified — verdict line (2 Moderate, 1 Minor); same four provenance greps, 0 hits |
| 11 | `docs/reviews/round-12-architecture-review.md` | [x] Read at :145–155 — trajectory `R9: 6 → R10: 4 → R11: 6 → R12: 4` and the R11 closure list; verdict line grep-verified (4 findings); same four provenance greps, 0 hits |
| 12 | `docs/aps-mfg-schema.json` | [x] Programmatically introspected via Node — **56 assertions machine-checked, 56 pass**. Covered: 209 types; `Item`/`ItemVersion` field lists and `possibleTypes`; all four concrete Item types; `ComponentVersion`, `DesignItemVersion`, `ConfiguredDesignItemVersion`, `ConfigurationTable`, `ConfigurationRow`, `Occurrence`, `ItemFilterInput`, `Properties`, `ItemVersions`, `DerivativeInput`, `ItemCompositionEnum`, `OutputFormatEnum`; global carrier sweeps for `fusionWebUrl`, `tipRootComponentVersion`, `tipConfigurationTable` and `ComponentVersion`-typed fields; full argument lists for `item`, `itemsByFolder`, `itemsByProject`, `foldersByProject`, `foldersByFolderInHub`, `itemVersions`, `componentVersion`, `ComponentVersion.derivatives`; all eight named mutations |
| 13 | `package.json` | [x] Read via `require` — `@modelcontextprotocol/sdk ^1.29.0`, `express ^5.2.1`, `zod ^4.3.6`; `version: "1.0.0"` |
| 14 | `package-lock.json` | [x] Verified present, 46,359 bytes |
| 15 | `src/constants.ts` | [x] Read at :8–11 — v2 "will be deprecated soon" banner, `/mfg/v3/graphql/public`, ComponentVersion removal |
| 16 | `src/index.ts` | [x] Read at :22, :45, :71 — hardcoded `version: "1.0.0"`, `app.use(express.json())`, `app.post("/mcp", …)` |
| 17 | `src/services/aps-auth.ts` | [x] Read at :38, :119, :145–146 — `clearTokens()` defined and called in the refresh failure path; `isAuthenticated()` → `currentTokens() !== null` |
| 18 | `src/services/aps-client.ts` | [x] Read at :38 — `export function urnToBase64` |
| 19 | `src/tools/mfg-data-model.ts` | [x] Read at :30, :480, :497, :590 — `truncateIfNeeded`; `readOnlyHint: true` at :480 with `generate: true` at :497 in the same tool; bare-quote `componentVersionId: "${component_version_id}"` at :590 |
| 20 | `src/tools/model-derivative.ts` | [x] Read at :9 — second, divergent `function truncate` |
| 21 | `prior-session-artifacts/FINDINGS.md` | [x] Read at :529–533 — the `invalid_grant`-on-already-rotated-token observation the structuredargumentation trace cites at :1339 |
| 22 | `docs/apsq.mjs` | [x] Verified present, 2,927 bytes |
| 23 | `C:/Users/maxco/.aps-fusion-mcp/tokens.json` | [x] Read — literal `null`; the credential is cleared, independently confirming the blocker Limitations 8(b) and 8(c) both name |
| 24 | `HEAD:…/architecture-aps-fusion-mcp-server.md` (git object) | [x] Extracted (1,482 lines); heading-offset arithmetic and byte-comparison at the three fix sites plus row 8 and the disposition-paragraph opening run across it and the working tree |

**Tool plan (Step 3).** Instruments available and exercised: Read; Grep; Bash/Node (a GFM-escape-aware
markdown table parser, a programmatic GraphQL introspector, a per-decision slot extractor, a
mechanical evaluator of the threat model's own stated join, a disposition-partition evaluator
comparing prose enumeration against the quantified set, a member-property conformance scan, and
config-key / standards-tag / tunable / Context7-citation / cross-decision-claim sweeps); Context7;
Clear Thought (`metacognitivemonitoring` at start, `collaborativereasoning` before the gates); git.
Claim-type mapping — absence claims → grep and programmatic schema queries; literal-content claims →
Read at file:line; library- and vendor-API-behaviour claims → Context7 (`/expressjs/express`,
`/modelcontextprotocol/typescript-sdk/v1.29.0`, `/colinhacks/zod`, `/websites/tailscale`);
structural and blast-radius claims → the region-isolated fix-diff plus the recorded observation that
the artifact has no importers; prior-document claims (rounds 12–18's findings and trajectories,
`HANDOFF.md`'s assertions, and the artifact's own premise slots) → re-derived from current source.
**CodeGraph and codebase-RAG were not exercised, and this is not a verification gap:** every
structural question in this review's scope is either an absence claim or a literal-content claim,
which Step 3 assigns to grep/Read rather than CodeGraph, and the architecture specifies a greenfield
`src/` tree that does not yet exist. No instrument class was unavailable for a load-bearing claim
category, so no halt condition arose.

**One instrument self-correction is recorded for auditability.** The member-property conformance scan
(Systemic Patterns item 1) initially tested the Bounded-single-response class with a literal keyword
list (`bounded|bound|ceiling|limit|recorded at submission|one URN`) and reported two violations —
tool 8 and tool 31. Tool 31's row was then Read at :171: it states `registered hook ids — one hook
per event type` against an input of `event types`, which *is* the bounding mechanism the disposition
paragraph names for it ("bounded by the caller's own event-type array", :190–191), and D11 states the
same cardinality at :644–646. The word "bounded" is absent; the mechanism is fully stated and
derivable. Tool 31 is a false positive of the literal test, the substantive violation count is
**one**, and no finding was drafted from the faulty run. Both the raw result and the adjudication are
recorded because the systemic threshold turns on the count.

**Rigor waivers.** None. No compression was requested or applied.

## Summary

**This review returns NEEDS FIXES (2 findings: 1 Moderate, 1 Minor).** All three of round 18's
findings are closed against the standards they originally named, and each closure was re-derived
rather than relayed: the disposition paragraph's prose enumeration now equals its own quantified set
for all three classes under a scripted parse, tool 34's inventory row carries the class name the
paragraph defines, `TOKEN_RENEWAL_THRESHOLD_MS` exists in D21 with a default and is named in D8(b)
with a stated relation, and the Components block points `health-route.ts` at D25. Every accounting
surface came through intact under independent re-derivation: 37 inventory rows reconcile against
every prose enumeration of effect class, 60 spec requirements map to 60 distinct traceability entries
with zero duplicates and zero empty cells, all 28 decisions carry all five slots, 7 tables parse
clean, every `D#` reference resolves and every one of the 19 module-to-decision pointers is now
correct, no spec identifier is invented, the threat model's own asserted join recomputes to zero
violations across all eight rows, all 16 config keys are declared in D21, and all 56 programmatically
checked MFG schema assertions hold. The two findings come from one scan class this cycle had not run
before and from the fix text itself. The Moderate is pre-existing text no prior round reported: tool 8
is enumerated in the Cursor-paged class, whose defining property is "takes an optional cursor," but
its contract row accepts no cursor — so the cursor it returns on a truncated assembly scan has no
input that can consume it, and a capped BOM is unresumable. The Minor is in the sentence written this
round to close round 18's Finding 2: it asserts that 300 000 ms strictly exceeds the worst case of a
D18 exchange, but one term of that worst case — D18's backoff, which honors `Retry-After` — is
unbounded anywhere in the document, and unlike the three other cross-key relations the document
states, no startup assertion holds this one against configuration drift.

## Upstream Contract Verification

The upstream artifacts are the spec (`docs/specs/spec-aps-fusion-mcp-server.md`) and the authoring
contract (`.claude/skills/expert-architecture/SKILL.md`). The artifact is a design document, so the
spec's acceptance criteria are not executable at this phase; what is checkable is requirement
coverage, requirement *satisfaction*, and contract conformance. All three were checked, the first two
mechanically.

**Spec requirement coverage — PASS.** Requirements were counted independently from the spec's own
declaration forms by regex over `^- \*\*(R-[A-Z]+-\d+)\.` and `^- \*\*(S-\d+)`: **46 R-numbers + 14
S-numbers = 60 distinct, zero duplicates in either set**. The traceability matrix (artifact lines
1421–1454) was then parsed with a GFM-escape-aware cell splitter: 5 columns, 32 body rows, **60
requirement entries, 60 distinct, zero duplicates, zero empty decision cells**, set-differenced to
**zero missing and zero extra** against the expected 60. The artifact's "60 spec requirements" claim
(Goal line 23; Status line 1568) is correct.

**Spec requirement satisfaction — PASS with one qualification.** Coverage of the matrix is not
satisfaction of the requirements it maps; all 60 were walked against the decisions and tool rows each
is mapped to. **59 of 60 are satisfied without qualification.** The exception is **R-DISC-4** ("Any
listing that can exceed a single API page SHALL be paginated, and a result that is truncated or has
more pages SHALL say so explicitly in its output"), traced to D7 and D19 at :1426. Its second clause
holds everywhere, tool 8 included — the row says `truncated` explicitly. Its first clause fails at
tool 8, whose listing is paginated *inside* the gateway but not at the tool boundary, because no
input accepts the cursor the tool returns (Finding 1). Spot-checks with their verification:
**R-READ-6**'s composition selection is backed by `Query.item(hubId: ID!, itemId: ID!, …, composition:
ItemCompositionEnum)` with values `WORKING, RELEASED, AS_SAVED, LATEST` — confirmed by programmatic
introspection this round. **R-PROTO-1**'s "exactly the capabilities it implements" is pinned at D3
(`tools` only, `listChanged: false`, no resources/prompts/logging/completions). **R-WRITE-4**'s
annotation truthfulness re-derives exactly: D14's `idempotentHint:true` set `{13,16,17,19,33}` equals
the inventory's destructive W rows, its `idempotentHint:false` and explicit `destructiveHint:false`
sets both equal the inventory's additive W rows `{14,15,18,20,31,36}`, and 5 + 6 = 11 W-class rows as
D14 claims. **R-OPS-2**'s "documented … and given a sane default where one exists" clause is now
satisfied for the token-renewal threshold, which was round 18's failure point; its "validated at
startup" clause is where Finding 2 lands.

**Acceptance criteria.** By set-difference of `AC-[0-9]+` occurrences across both documents, the spec
declares AC-1..AC-27 and the architecture cites **22 of them**, never citing AC-1, AC-2, AC-3, AC-4
or AC-17 — unchanged from rounds 14 through 18. That is **not** a contract violation: the authoring
contract requires the traceability matrix to account for every R# and Q#, not every AC, and each of
those five ACs cites requirements that are themselves traced. Recorded so the reader can audit the
gap rather than discover it. **AC-17** ("A listing whose result exceeds one API page reports that more
pages or a truncation exists, explicitly, in its output") is separately relevant to Finding 1: tool 8
satisfies AC-17's reporting clause while leaving the reported condition unrecoverable. **AC-25**'s
third clause now has a stated boundary — round 18's gap — though the boundary rests on an unbounded
term (Finding 2).

**Cross-reference integrity — checked mechanically.** 28 decisions defined, 28 referenced, **zero
dangling `D#` references and zero decisions defined-but-never-cited**. Every `R-…`, `S-…`, `AC-…`,
`C#`, `T#`, `M-#`, `Q-#` and spec `D-#` identifier cited in the architecture exists in the spec (46,
14, 22, 8, 8, 3, 3, 7 respectively; **zero invented**). Limitation cross-references resolve: 11
limitations declared, references to 7, 8 and 11 in the body, zero dangling, and Limitation 8 carries
all three sub-items (a)/(b)/(c). This check establishes that every pointer *resolves*; it does not
establish that each points at the *right* decision, which is a separate walk — and that walk is now
clean at all nineteen Components-block pointers (Systemic Patterns item 2).

**Authoring-contract conformance — checked item by item, mechanically where possible.**

- *Required sections.* All eleven present, by scripted extraction of `^## ` headings: Goal (21),
  Scope (35), Components and structure (54), Quality characteristics (203), Design decisions (217),
  Threat model (1358), ASVS mapping (1399), Traceability (1419), Limitations (1458), Standards
  (1529), Status (1563). Scope carries all three required subsections (In scope :37, Deferred with
  reasoning :44, Out of scope :50). *Inheritance from existing precedents* is correctly omitted with
  its attestation in Status.
- *Five-part decision format.* Scripted per-decision slot check across D1–D28: all 28 found, every
  one carrying all five slots (`**Decision.**`, `**Standard.**`, `**Why here.**`, `**Not.**`,
  `**Premise.**`). **Zero gaps.** Every Premise slot either cites a source or carries the explicit
  "no factual premises — pure design choice" attestation the contract permits (D13, D18, D24, D25,
  D26 carry the attestation; the other 23 cite).
- *Quality characteristics.* All nine ISO/IEC 25010:2023 characteristics appear in the table
  (205–215), Safety included with its explicit not-addressed reasoning.
- *ASVS.* All fourteen chapters V1–V14 dispositioned across the 12-row mapping table (1404–1417),
  confirmed by scripted set-difference; V1/V10/V11 share one row.
- *Mandatory Clear Thought invocations.* All present or explicitly attested, by scripted sweep:
  `metacognitivemonitoring` (:219), `mentalmodel` / `mentalmodel(first_principles)` (:403, :478,
  :818, :841, :1135, :1164), `decisionframework` (:285, :316, :611, :1320), `structuredargumentation`
  (trace :1322, attestation :1348), `sequentialthinking` (attestation :1316 naming D5/D7/D8),
  `scientificmethod` (:1361, threat model), `collaborativereasoning` (:1308), and `debuggingapproach`
  attested *not* invoked with reasoning (:1352).
- *Gate B (auditable from the document alone).* Question 4 — "for each non-trivial decision, what
  factual premises was it verified against, and how?" — passes at all 28 decisions. Gate B's pass
  condition fails at one place: a reader asking "how does a caller retrieve the rest of a truncated
  assembly structure?" gets a returned cursor from one section and no input that accepts it from the
  section D15 designates as the contract (Finding 1).
- *Gate C structural checklist.* Passes on the premise-citation item, on "File paths and external
  references are confirmed, not assumed" (all 21 cited source paths and line references Read this
  round, inventory rows 15–22), and on Context7 citation completeness — 36 Context7-mentioning lines,
  every one carrying a library identifier and a date or version within its paragraph; the two lines a
  naive sweep flagged (:612, :1463) both resolve through D10's Premise slot at :617–618, which dates
  the negative `@napi-rs/keyring` resolution to 2026-07-28. Exactly one bare `(verified)`
  parenthetical remains, at :350, and it is backed by D3's Premise slot at :375–376 and the Standards
  row at :1558 — round 17's closure holds.
- *Deferred-decision trap.* One instance — the unenforced renewal-threshold relation, Finding 2. The
  audit for this trap otherwise comes up clean: the deferral-phrase hits in the document are Scope's
  designated *Deferred, with reasoning* subsection (:45, :47), D24's explicit *anti*-deferral rule
  (:1118), D26's vitest note which states plainly that "no architectural surface depends on it"
  (:1187), and Limitation 8(a)'s signed-URL host patterns, which sit in the contract's designated
  home for acknowledged gaps and are bounded by `EGRESS_ALLOW_HOSTS` being config rather than code.
- *Header claims.* The header's disclosure that the spec's own `Status:` line still reads "Draft for
  review" is confirmed (`docs/specs/spec-aps-fusion-mcp-server.md`:3), and `HANDOFF.md`'s "passed
  five independent blinded rounds with zero findings" matches the header's characterisation (Read at
  `HANDOFF.md`:12–15).

## Critical & Serious Findings

**No Critical or Serious findings** — the full inventory was Read or Grep-verified per Compliance
Gate B, and no violations of Critical or Serious classification were observed. In particular, the
three areas where a Serious finding would have landed were each examined and cleared: the threat
model's control-column join (recomputed from scratch to zero violations on all eight rows, both
directions); the MFG schema premise surface (56 of 56 assertions hold); and the four external library
premises whose reversal would be most damaging (each independently re-fetched from Context7 this
round — see What's Actually Good).

## Systemic Patterns

**No systemic patterns** — verified by the scans below, all run across the full inventory scope
*before* counting or classifying, per Step 8's proactive-scan rule. Each of the two findings was
scanned as a class rather than assumed isolated, and **no signature yields two or more substantive
instances**, so extrapolating a systemic claim from either of them is the failure that rule exists to
prevent.

1. **Disposition-class member-property conformance** (the Finding 1 class — a scan class no prior
   round ran). Every one of the 20 list-returning rows was tested against the defining property of
   the class the quantified set assigns it to, parsed from the row's own Inputs and Returns columns.
   *Cursor-paged* ("takes an optional cursor, returns `pageInfo{hasMore, cursor}`"): **12 of 13
   members take a cursor; tool 8 does not** — the sole violation. *Bounded-single-response* ("the
   tool states its bounding mechanism"): 6 of 6 state one, after the tool-31 false positive was
   adjudicated by Read at :171 (see the instrument self-correction above). *Merged-source resumable*
   ("takes **and** returns the named position fields"): tool 34 takes `marker`, `since_sequence`,
   `resume_position` and returns `marker`, `sequence`, `resume_position` — conforms. A stray scan for
   non-list rows claiming a cursor or `pageInfo` returns **0**. **Substantive instances: one.** Not
   systemic. Note for the record that round 18's Finding 1 was the *same class at the opposite pole*
   — a row labelled cursor-paged that the partition placed elsewhere — and it is closed; a set-equality
   check between prose and quantified set passes while a member-property violation survives, which is
   why this scan was needed and why the two are separate findings rather than one recurrence.
2. **Module-to-decision pointers** (the round-18 Finding 3 class, re-run to confirm closure rather
   than assume it). Every parenthetical decision pointer in the Components block (lines 54–123) was
   walked against the decision it names: `index.ts`→D3/D21, `config.ts`→D21, `logging.ts`→D20,
   `mcp-route.ts`→D2/D3, `auth-routes.ts`→D9, `webhook-route.ts`→D11, `health-route.ts`→**D25**,
   `middleware.ts`→D2/D3, `token-manager.ts`→D8/D10, `aps-http.ts`→D18/D13/D22, `spend-guard.ts`→D13,
   `output-guard.ts`→D19, `state-store.ts`→D24, `mfg-gateway.ts`→D5/D6/D7, `dm-gateway.ts`→D12/D23,
   `da-gateway.ts`→D23, `write-tools.ts`→D27, the handler-wrapper paragraph→D19, and the data-flow
   paragraph→D12. **Nineteen of nineteen are correct.** Zero open instances of this class.
3. **Cross-decision prose claims** (the Finding-3 class generalized from module pointers to prose — a
   scan class no prior round ran). Every assertion of the form "D*n* does / says / requires X" made
   outside decision *n* was enumerated by script: **66 assertions**. Each was checked against the
   named decision's text. The highest-consequence ones were verified verbatim: :1126's citation of
   D12's inclusive-boundary guarantee reproduces D12:733–736 word for word; :1131's `events.ndjson`
   entry shape matches D11:634 field for field; :1154's three auth-state classes match D8(a):520–521;
   :133's "the Data Management call D8 specifies" matches D8's `GET /project/v1/hubs` probe at
   :517–520; :1220's "exactly as D6 requires of every path segment" matches D6:452. **Zero
   mismatches.** One assertion — D18:916's "those MFG GraphQL operations D5's catalog marks `query`
   *and* `cost: none`" — states a catalog property D5 does not itself enumerate; it is not counted as
   a violation because D5:399 makes a confinement claim ("Every GraphQL document, variable shape, and
   response mapping lives in `mfg-gateway.ts` as a static operation catalog"), not an
   exhaustive-fields claim, so D18 adds a constraint at its point of use rather than contradicting
   D5. Zero instances.
4. **Named bounds and tunables** (the round-18 Finding 2 class, re-run). Every occurrence of a
   configured cap, default, TTL, timeout or threshold in the document was enumerated and checked for
   a value and a config key: `MFG_MAX_PAGES` (config, default 20), `MFG_SEARCH_MAX_PROJECTS` (50),
   `MFG_SEARCH_ROW_LIMIT` (config, 25), `DM_POLL_MAX_FOLDERS` (config, 200), `UPLOAD_MAX_BYTES`
   (config, 100 MB), `HTTP_MAX_BODY_BYTES` (derived default plus a startup assertion),
   `TOKEN_LOCK_STALE_MS` (config, 45 000 ms), **`TOKEN_RENEWAL_THRESHOLD_MS` (config, 300 000 ms —
   new this round)**, `AUTH_VERIFIER_TTL` (10 min), the webhook dedupe TTL (24 h), the outbound
   timeout (30 s, config), the webhook raw parser limit (1 MB, literal), the spend caps (20/20/10 per
   day), and Autodesk's own 2-minute signed-upload expiry. **Fifteen of fifteen now carry a value, a
   key, or both.** Zero open instances of this class; Finding 2 is a different claim about the same
   line (an unbounded term in the relation, not a missing value).
5. **Config-key closure** (re-run). Scripted extraction yields **18 SCREAMING_SNAKE identifiers**, of
   which 16 are config keys and **all 16 are declared in D21's block (:1006–1065)**; the two
   non-keys are `O_EXCL` (an fs flag) and `AS_SAVED` (an enum value). Zero orphans.
6. **Self-asserted partitions.** The document asserts several completeness invariants about itself;
   each was recomputed independently: effect classes (R = 23, W = 11, $ = 3, summing to 37, with the
   R set matching the prose's four-group enumeration member for member); the W destructive/additive
   partition (5 `{13,16,17,19,33}` + 6 `{14,15,18,20,31,36}` = 11, with `idempotentHint` inverted
   across exactly that partition and `destructiveHint:false` set on exactly the additive six); the
   disposition partition (prose enumeration **equals** the quantified set for all three classes;
   union 20, zero pairwise overlap; 37 − 20 = 17, both figures as stated); the traceability matrix
   (60/60, zero duplicates); D24's state-store completeness (nine table rows against the Components
   block's nine-artifact prose list — zero unlisted); the group file counts (1+6+6+9+7+4+4 = 37); and
   the threat-model join. **All hold.**
7. **Standards decoration** (bracketed-tag extraction, body against the Standards table): **15 tags
   in the body, all 15 present in the table; zero body tags missing.** The table's one extra,
   `[APS-COMMERCIAL]`, is not decoration — the standard demonstrably drives D13's metered categories,
   D14's cost-class carving, the inventory's costlessness prose (:126–137) and Limitation 11, all via
   C4, which is cited eight times in the body. The contract's requirement runs body→table; the
   reverse direction is satisfied in substance.
8. **Markdown table integrity** (Node parse of every table block with GFM-correct escaped-pipe and
   inline-code handling, checking each row's cell count against its header and each block's
   blank-line termination): **7 tables, 0 defective rows, 7/7 blank-terminated.** Tables at 139–177
   (6 × 37), 205–215 (4 × 9), 1121–1131 (3 × 9), 1379–1388 (4 × 8), 1404–1417 (2 × 12), 1421–1454
   (5 × 32), 1531–1561 (3 × 29). Round 12's malformed-table class stays closed.

## Moderate & Minor Findings

### Finding 1 — Moderate (new). Tool 8 is enumerated in the Cursor-paged class, whose defining property is "takes an optional cursor," but its contract row accepts no cursor — so the cursor it returns on a truncated assembly scan has no input that can consume it

**What the document does now.** The disposition paragraph defines the class and lists its members
(Read at :181–186 at drafting time):

> **Cursor-paged** (takes an optional cursor, returns `pageInfo{hasMore, cursor}` backed by the API's
> native paging): tools 2–6, **8**, 10, 11, 12, 35 (MFG connection cursors …)

Tool 8's inventory row (Read at :148 at drafting time) reads in full:

> `| 8 | aps_get_assembly_structure | R | componentVersion id, max_pages? | full line data: per-node
> id/name/partNumber/material + derived quantity; `truncated`+cursor when capped | R-READ-2 |`

The Inputs column is `componentVersion id, max_pages?`. There is no cursor parameter. The Returns
column promises a cursor. D7, the decision that governs the tool, agrees with the row and not with
the class definition (Read at :468–476): it specifies `max_pages` as the only caller lever —
"tool 8's optional `max_pages` input is clamped to `min(max_pages, MFG_MAX_PAGES)` (config, default
20): **a caller may narrow the scan but never widen it** past the operator's cap" — and states the
output as "returns the tree with `truncated`, `cursor`, and per-line
id/name/partNumber/material/quantity." Nothing anywhere in the document gives tool 8 an input that
accepts that cursor.

**How the claim was verified.**

- *The document's text.* Lines 181–186, 148 and 468–476 Read at finding-drafting time; the row and
  the class definition are quoted above verbatim.
- *The scan.* Every one of the 13 Cursor-paged members was parsed out of the inventory table with a
  GFM-aware cell splitter and its Inputs column tested for a cursor parameter: tools 2, 3, 4, 5, 6,
  10, 11, 12, 26, 27, 32, 35 — **twelve — carry `cursor?`; tool 8 alone does not.** The same scan run
  over the other two classes finds 6 of 6 Bounded-single-response members stating a bounding
  mechanism and tool 34 both taking and returning all three named position fields. A stray scan for
  non-list rows claiming a cursor returns **0**. Tool 8 is the single violation across all 20
  list-returning rows.
- *The contrast inside the same decision.* D7 governs two tools, and treats them differently. For
  tool 6 it specifies a resume path — "returning matches plus a completeness fact **and a resume
  cursor** (the position in the hub/project enumeration) when the cap truncates the scan" (:493–495)
  — and row 6 carries `cursor?` in its Inputs column and says "cursor resumes the scan" (Read at
  :146). For tool 8 the same decision promises a returned cursor and specifies no way to send it
  back. The asymmetry between two tools under one decision is what distinguishes an omission from a
  deliberate design.
- *Provenance.* The passage is present in the committed baseline — grep for the exact row-8 string
  `aps_get_assembly_structure. | R | componentVersion id, max_pages?` returns **1 hit in the `HEAD`
  object and 1 in the working tree**, and `HEAD`'s disposition-paragraph opening is byte-identical to
  the working tree's — so the text is pre-existing, not fix-induced. No prior round reported it: grep
  across all seven prior review documents for `max_pages`, `assembly_structure` and `tool 8` returns
  **zero hits**. Rounds 12 through 18 each verified the disposition partition, but every one of them
  checked it as a *set* — membership, exclusivity, and totals — and none tested whether a member
  actually has the property its class is defined by.

**Which standard it violates.** The authoring contract's **Gate B** pass condition: "every question
above is answerable from the document alone by pointing to a specific section. A question that
requires subjective interpretation of the document is a Gate B failure." The question here — *how
does a caller retrieve the remainder of a truncated assembly structure?* — is answerable only by
choosing between the class definition (which says tool 8 takes a cursor) and the inventory row plus
D7 (which say it does not), and **D15 designates the row as authoritative**: "The inventory table in
Components is the contract" (:837). It also engages the **deferred-decision trap** as the contract
describes it — "the planner and the implementer encounter ambiguity the architect should have
resolved, and they resolve it inline." Against the spec, it is the failing half of **R-DISC-4**: "Any
listing that can exceed a single API page SHALL be paginated, and a result that is truncated or has
more pages SHALL say so explicitly." The second clause holds; the first does not, at the tool
boundary.

**Why it matters.** D7 caps the scan at `MFG_MAX_PAGES` (default 20) pages of ≤50 occurrences, so an
assembly beyond roughly a thousand occurrences returns `truncated:true` plus a cursor — and, under
the contract as written, the caller has no way to continue. `max_pages` cannot help: D7 clamps it to
`min(max_pages, MFG_MAX_PAGES)` and states plainly that a caller "may narrow the scan but never widen
it." The only lever that reaches the rest of the tree belongs to the operator, in config, not to the
agent that asked the question. That collides with the goal D7 sets for itself — "a BOM that is either
complete or explicitly incomplete" — and with **R-READ-2**'s "full assembly structure," on the
document's own named primary use case ("the owner's stated use ('what's the BOM')", :485–486). The
concrete downstream cost is a wrong schema: a planner writing tool 8's zod input schema from the row
that D15 calls the contract will not declare a cursor parameter, and the cursor the handler returns
will be dead on arrival. It is **Moderate** rather than Serious because the blast radius is one tool
and one input field, the design intent is unambiguous (D7 returns a resume cursor, so resumption was
intended), and tool 6 in the same decision already shows the exact shape the fix takes.

**What correct implementation looks like.** Add the input; do not reclassify the tool. The document's
weight points one way — D7 promises a resume cursor and the class assignment expects one — so the
divergence is a missing parameter, not a wrong class. (a) In tool 8's inventory row at :148, change
the Inputs column from **`componentVersion id, max_pages?`** to **`componentVersion id, max_pages?,
cursor?`**. (b) In D7's Decision slot at :468–476, state the resume contract for tool 8 in the same
form the search extension already uses for tool 6 at :493–495 — that the returned `cursor` is the
position in the occurrence-page walk and that passing it back continues the scan from there, so a
capped BOM is completable in successive calls. **Do not change the disposition partition, the
quantified set, the class definitions, the 20/17 split, `MFG_MAX_PAGES`, the clamp rule, or any other
inventory row** — all were re-derived this round and are correct, and reclassifying tool 8 would
break the partition round 18 has just repaired.

**Provenance: new.** Text byte-identical to the committed baseline, and no prior round reported it.

### Finding 2 — Minor (regression). D8(b)'s new threshold sentence asserts that 300 000 ms strictly exceeds the worst case of a D18 exchange, but that worst case contains a term the document never bounds — and no startup assertion holds the relation against configuration drift

**What the document does now.** D8(b), as rewritten this round (Read at :523–529 at drafting time):

> (b) **Atomicity, and minimizing the window (R-REL-7):** refreshes are **demand-driven, never
> opportunistic** — a refresh is issued only when the access token is within the renewal threshold of
> expiry (config `TOKEN_RENEWAL_THRESHOLD_MS`, default 300 000 ms — **strictly exceeding the worst
> case of one D18 outbound exchange, 3 attempts × the 30 s timeout plus backoff**, so a token that
> passes the near-expiry check at dispatch cannot expire mid-flight; this is the boundary AC-25's
> near-expiry observation is judged against) …

The sentence states an inequality: 300 000 ms > (3 × 30 000 ms) + backoff, leaving 210 000 ms of
headroom for the backoff term. D18 (Read at :908–915) specifies that term as "max 3 attempts,
**exponential backoff + jitter, honoring `Retry-After`**" and gives the timeout as "`AbortSignal.timeout`
(default 30s, **config**)". Neither the backoff's base, multiplier, ceiling, nor any total-elapsed
retry budget appears anywhere, and nothing caps an honored `Retry-After`.

**How the claim was verified.**

- *The document's text.* Lines 523–529 and 908–915 Read at finding-drafting time, quoted above.
- *The absence.* Grep for `backoff|jitter|Retry-After|attempts` across the artifact returns **seven
  hit lines** — :526, :527 (this sentence), :906, :914, :933 (D18 and its Standard slot), :1189
  (D26's AC-19 reference), :1557 (the Google SRE Book row). None states a base delay, a multiplier, a
  maximum delay, a total-elapsed budget, or a ceiling on an honored `Retry-After`. The right-hand
  side of the asserted inequality is therefore not computable from the document.
- *Both operands are independently tunable.* `TOKEN_RENEWAL_THRESHOLD_MS` is declared in D21's
  optional-with-documented-defaults list (Read at :1036). D18's timeout is declared "default 30s,
  config" (:909). Raising the timeout to 120 s makes 3 × 120 000 = 360 000 ms exceed the 300 000 ms
  threshold and inverts the relation, with no error raised.
- *The document's own convention for exactly this.* Scripted sweep for startup assertions returns
  **four sites**: D1's `TAILNET_BASE_URL`/`WEBHOOK_PUBLIC_URL` host:port distinctness (:260), D3/D21's
  `HTTP_MAX_BODY_BYTES` derived minimum (:353 and :1033), D9's callback-authority agreement (:571),
  and the loopback-bind assertion (:269). D3's is the direct analogue and says so explicitly:
  "startup asserts it is not below that derived minimum, **so the two bounds cannot drift apart**."
  No assertion pairs `TOKEN_RENEWAL_THRESHOLD_MS` with D18's timeout.
- *Provenance.* This text did not exist before this round. The `HEAD` object has **zero** occurrences
  of `TOKEN_RENEWAL_THRESHOLD_MS` and its D8(b) reads "within the renewal threshold of expiry, so the
  number of rotation windows…" with no value, key, or relation (extracted and Read). The only prior
  occurrence of the key name anywhere is inside round 18's *proposed remedy* text
  (`round-18-architecture-review.md`, one hit; zero hits in rounds 12–17). The sentence is therefore
  new this round and the finding is a regression by the Step 9 definition — introduced by the fixes.

**Which standard it violates.** Spec **R-OPS-2**: "Every configuration value SHALL be documented,
**validated at startup**, read once at startup rather than rediscovered per call, and given a sane
default where one exists." Round 18's finding was against the last clause and is closed; this one is
against the second. Read with **R-REL-6** ("Startup SHALL validate configuration and fail with a
clear, actionable message") and with the authoring contract's **Gate B** requirement that the
document be auditable on its own terms — an inequality whose right-hand side the document does not
compute cannot be checked by the reader it is written for.

**Why it matters, and why Minor.** The consequence is narrow but real: the invariant the sentence
asserts — "a token that passes the near-expiry check at dispatch cannot expire mid-flight" — is the
precise property round 18 asked for, and it does not hold across the configuration space the document
itself opens. Under a raised `AbortSignal.timeout`, or under a 429 whose `Retry-After` D18 promises to
honor and no decision bounds, a token can pass the check and expire in flight; the resulting 401
becomes an `auth`-class error under D16 and the call fails, because D8 explicitly rejects
refresh-on-401 retry ("Not refresh-on-401-retry loops (unbounded, and non-idempotent against rotating
tokens)"). It is **Minor** rather than Moderate because no wrong build follows: a planner who
implements exactly what the document says ships a working server with a sane default that satisfies
the relation under any ordinary exponential backoff, and 300 000 ms leaves 210 000 ms of headroom. The
cost is an over-claimed invariant and a missing guard rail of a kind the document applies in three
other places — a reviewer checking AC-25 against the stated boundary would find the boundary
unverifiable, not wrong. This is a judgment call at the Minor/Moderate boundary and is recorded as
such; the verdict is unaffected either way, since a finding of any severity blocks PASS. Worth stating
plainly for the implementer: this text is not carelessness — it is round 18's own prescribed remedy,
executed faithfully, and the defect is in one term that remedy did not require anyone to pin.

**What correct implementation looks like.** Two clauses, both inside decisions that already exist.
(a) In **D18**, bound the retry term the way every other bound in this document is bounded — give the
backoff a stated ceiling and cap the honored `Retry-After` at it (e.g. "exponential backoff + jitter,
honoring `Retry-After` up to a maximum per-attempt wait of 10 s, so the worst-case elapsed time of a
retried exchange is bounded by attempts × (timeout + maximum wait)"). (b) In **D21**, add the startup
assertion in the form D3's entry already uses: assert `TOKEN_RENEWAL_THRESHOLD_MS` is not below the
worst-case elapsed time D18 now bounds, so the two cannot drift apart, and let D8(b)'s sentence cite
that assertion instead of asserting the inequality on its own authority. **Do not change D8's
classification table, the journal-before-refresh ordering, the write-bytes-before-parsing rule, the
single-flight mutex, `TOKEN_LOCK_STALE_MS`, the 300 000 ms default itself, or Limitation 7** — all
were re-derived this round and are correct.

**Provenance: regression.** Introduced by this round's fix text; absent from the committed baseline
and from every prior round's tree.

## Tentative Findings

**No tentative findings** — every candidate finding's premise was verified per Compliance Gate B.
Three candidates were examined and resolved rather than carried:

- *Whether tools 6 and 26 are also Cursor-paged members lacking the class's `pageInfo` return shape.*
  Resolved against a finding rather than left tentative. Both accept a cursor and both state their
  paging contract explicitly in their own rows — tool 6 "cursor resumes the scan" (:146), tool 26
  "**cursor-paged** via the `properties:query` endpoint's native `pagination{offset,limit}`" (:166) —
  so the question "how does a caller page this tool?" is answerable from the row alone for both. The
  absence of the literal token `pageInfo` is vocabulary, not a contract gap. Tool 8 differs in kind,
  not in degree: its Inputs column has no cursor at all.
- *Whether the Model Derivative `signedcookies` endpoint accepts the whole-value percent-encoded
  `derivative_urn`.* Genuinely unresolvable here — the credential is cleared, so no request can be
  issued (independently confirmed this round: `C:/Users/maxco/.aps-fusion-mcp/tokens.json` reads
  literal `null`). It is **not** a tentative finding because it is not a finding at all: D27 states
  both sides of the vendor record, names which one the gateway follows and why, and records the
  residual with its closing check as Limitation 8(c). That is the contract's designated handling for
  a claim that cannot be verified with available tools.
- *Whether MFG `ItemVersion.id` is the Data Management version-URN form.* Same blocker, same correct
  handling: D27 marks the assumption "**not live-verified**" in the decision text and Limitation 8(b)
  names the exact closing query. Re-derived rather than imported: programmatic introspection this
  round confirms `ItemVersion.id` is typed `ID!` with no format information, so the schema cannot
  settle it either, and `docs/apsq.mjs` is present (2,927 bytes) but unusable without a credential.

## Observations

- The introspection dump's top-level object carries only `data` and `extensions`, and the schema body
  exposes `queryType` and `types` with **no `mutationType` pointer**. `Mutation` is nonetheless
  present as a type with 45 fields, and all eight mutations the architecture names exist on it. This
  affects no claim the architecture makes; it is worth knowing before the build introspects this
  file, because a tool resolving mutations through `mutationType` will find none. (Recorded by rounds
  14 through 18 as well; independently re-derived here.)
- `HANDOFF.md` describes the architecture as having a "36-tool inventory" (:17) and says "Thirteen
  rounds of independent blinded review ran" (:6); the artifact has 37 tools (verified by table parse)
  and this is round 19. The architecture header cites `HANDOFF.md` only for the spec's review status,
  not for the tool count or the round count, so neither is a defect in the artifact under review —
  but a reader who starts from `HANDOFF.md` will begin with two stale figures.
- The spec file's `Status:` line still reads "Draft for review" (verified at
  `docs/specs/spec-aps-fusion-mcp-server.md`:3) while `HANDOFF.md` records a five-round zero-findings
  pass. The architecture header discloses exactly this discrepancy and declines to resolve it, which
  is the correct handling of governance metadata the architecture does not own.
- The artifact header states that the R-REL-7 / AC-25 spec amendment "has not itself been reviewed —
  it owes its own review round." That remains true; this review evaluated the architecture against
  the amended spec text as the architecture declares, and did not review the amendment.
- Spec `C6` (Automation accepts TypeScript job code only) and spec `M-4` (prior-session prose
  artifacts are historical record) are the only spec identifiers of their classes the architecture
  never cites. Neither is a gap: C6's job-language clause falls inside the architecture's declared
  deferral of "individual Fusion Automation job programs" (Scope :46), and the architecture's one use
  of `prior-session-artifacts/` — the `invalid_grant` observation cited at :1339 and confirmed this
  round at `prior-session-artifacts/FINDINGS.md`:531 — treats it as evidence rather than as a
  requirement, which is exactly what M-4 directs.

## What's Actually Good

- **All three of round 18's findings are closed, and the fix reached no further than the findings.**
  The disposition paragraph's prose enumeration now parses to `{2,3,4,5,6,8,10,11,12,26,27,32,35}`,
  `{7,13,24,25,30,31}` and `{34}` — **identical, set for set, to its own quantified set**, with a
  union of 20, zero pairwise overlap, and 37 − 20 = 17 matching both stated figures; tool 34's row
  reads "merged-source resumable via three named fields (D12)"; `TOKEN_RENEWAL_THRESHOLD_MS` appears
  in D21 with a default and in D8(b) with a relation; line 76 reads `(D25)`. The heading-offset
  analysis shows the edit added exactly four lines inside Design decisions and changed the net line
  count nowhere else, and every accounting surface downstream re-derived unchanged. The standard this
  is good by is the one round 18 named for each: Gate B's answerability, R-OPS-2's default clause, and
  Gate C's "file paths and external references are confirmed."
- **The threat model's own asserted invariant holds under mechanical test, for the third consecutive
  round.** The Analysis paragraph claims the control column is a join that "cannot drift." I
  recomputed that join from scratch rather than reading the table: the spec's §8 requirement→threat
  bindings parsed from the spec source, each decision's header requirement declaration extracted by
  script, the threat table parsed with a GFM-aware splitter, and the join evaluated per threat —
  **T1 {D1,D2,D3,D8,D28}; T2 {D1,D2,D9}; T3 {D2,D8,D10,D20,D28}; T4 {D11}; T5
  {D6,D13,D14,D17,D22,D27,D28}; T6 {D10,D20,D28}; T7 {D1,D3}; T8 {D19} — eight of eight match, zero
  missing and zero extra.** The Via column independently matches the spec's §8 bindings in both
  directions with zero violations. A claim that a table cannot drift is only worth making if
  something can check it, and this one checks out.
- **The MFG schema premise surface survives independent programmatic re-derivation at full density,
  for the sixth consecutive round.** 56 assertions were machine-checked against
  `docs/aps-mfg-schema.json` and **all 56 pass**. Among them: 209 types; the `Item` interface carries
  exactly the twelve fields named "and nothing else"; `Item.possibleTypes` is exactly the four
  concrete types and all four bear `tipVersion` and `versions`; `tipRootComponentVersion` has exactly
  one carrier (`DesignItem`) and `tipConfigurationTable` exactly one (`ConfiguredDesignItem`);
  `ComponentVersion` carries the named part-level fields and has **no** `versionNumber` and **no**
  `createdOn`, while both `DesignItemVersion` and `ConfiguredDesignItemVersion` carry both and both
  expose `item`; `fusionWebUrl` is present on exactly the six named types and absent from
  `ComponentVersion`; the schema has exactly nine `ComponentVersion`-typed fields with
  `ConfigurationRow.rootConfigurationMember` among them; `ConfigurationTable.rows` takes zero
  arguments, confirming "API-unpaginated, so the bound is tool-level"; `ItemFilterInput` carries only
  `name` and `itemType`, confirming D7's and D12's "no server-side changed-since filter" reasoning;
  `item(hubId: ID!, itemId: ID!, …, composition: ItemCompositionEnum)` really does require both ids
  and take composition with values WORKING/RELEASED/AS_SAVED/LATEST; `itemsByFolder(hubId!,
  folderId!, …)` really does take no project id while `itemsByProject(projectId!, …)` takes no hub
  id; and `OutputFormatEnum` is exactly STEP, STL, OBJ. By the authoring contract's premise-slot
  standard this is what a verified premise is supposed to look like.
- **The four external premises whose reversal would be most damaging re-derive verbatim, re-fetched
  this round rather than relayed from the five prior rounds that confirmed them. All four lookups
  were performed on 2026-07-30, the date of this review.** D14's annotation matrix: Context7
  `/modelcontextprotocol/typescript-sdk/v1.29.0` (library version v1.29.0; docs sections
  `packages/core/src/schemas.ts` `ToolAnnotationsSchema` and
  `packages/core-internal/src/types/spec.types.2026-07-28.ts` `ToolAnnotations`), looked up
  2026-07-30: they declare `readOnlyHint`
  **Default: false**, `destructiveHint` **Default: true** ("meaningful only when `readOnlyHint ==
  false`"), `idempotentHint` **Default: false**, `openWorldHint` **Default: true** — exactly what D14
  asserts, including the non-obvious half that `destructiveHint` defaults *true*, which is why
  W-class tools must set it explicitly. D3's body-limit premise: Context7 `/expressjs/express`
  (docs section `_autodocs/06-types-and-configuration.md`), looked up 2026-07-30 —
  `express.json([options])` parameter table, "**limit** (string | number) - Optional - Request body
  size limit. **Default: '100kb'**" — so 100 kB ÷ (4/3) ≈ 75 kB is the right consequence. D19's zod
  premise turns on a distinction that is easy to get wrong and is located correctly: Context7
  `/colinhacks/zod`, looked up 2026-07-30, returns "The resulting schema also inherits the
  'unknownKeys' policy
  and catchall schema from the second object" sourced to `packages/docs-v3/home.md` — the **v3**
  reference — while the `.catchall()` and `A.extend(B)` guidance sits in
  `packages/docs/content/api.mdx`, the v4 reference, exactly as D19 states. D1's topology rests on a
  Tailscale rule quoted almost verbatim: Context7 `/websites/tailscale` (docs sections
  `docs/features/tailscale-serve` Limitations and `docs/features/tailscale-funnel` Requirements and
  limitations), looked up 2026-07-30 — "The same port number
  cannot be simultaneously used for Tailscale Serve (private) and Tailscale Funnel (public and
  private). If `serve` was the most recent command, the port is private. If `funnel` was the most
  recent command, the port is public" — and Funnel "can only listen on ports 443, 8443, and 10000."
  Getting any of these backwards would ship a false cost hint or silently flip the entire MCP surface
  public.
- **Every predecessor-source claim in the premise slots is confirmed at file:line, and every one is
  used as defect evidence rather than as precedent.** Eleven checks, all correct: the v2 deprecation
  banner, `/mfg/v3/graphql/public`, and ComponentVersion removal at `src/constants.ts`:8–11 (D5);
  `app.post("/mcp", …)` at `src/index.ts`:71 with `app.use(express.json())` at :45 and the hardcoded
  version at :22 (D1/D2/D3/D21); `clearTokens()` defined at `src/services/aps-auth.ts`:38 and called
  at :119 in the refresh failure path, with `isAuthenticated()` returning `currentTokens() !== null`
  at :145–146 (D8); the two divergent truncation implementations at `src/tools/mfg-data-model.ts`:30
  and `src/tools/model-derivative.ts`:9 (D19); the bare-quote `componentVersionId:
  "${component_version_id}"` at `src/tools/mfg-data-model.ts`:590 (D6); `readOnlyHint: true` at :480
  in the same tool as `generate: true` at :497 (D14); `urnToBase64` at `src/services/aps-client.ts`:38
  (D27); the caret ranges in `package.json` with `package-lock.json` present (D21); and the
  `invalid_grant`-on-already-rotated-token observation at `prior-session-artifacts/FINDINGS.md`:531,
  which the structuredargumentation trace cites at :1339 and which reads there exactly as claimed.
  That usage is what M-1/M-2 require, and it is the codebase-mirroring trap's designed defence.

## Convergence Record

**Round:** 19 (post-fix), matching Scope and Inventory.

**Trajectory:** R9: 6 → R10: 4 → R11: 6 → R12: 4 → R13: 3 → R14: 3 → R15: 1 → R16: 2 → R17: 1 →
R18: 3 → **R19: 2**. R12–R18 are grep-verified from each round's own verdict line (`round-12` = 4
findings; `round-13` = 3; `round-14` = 3; `round-15` = 1; `round-16` = 2; `round-17` = 1; `round-18` =
3). R9–R11 are taken from round 12's own Convergence Record (Read at `round-12`:147); rounds 1–8 and
the round 9–11 documents are not present in this repository (`ls docs/reviews/` returns only rounds
12–18), so those three counts are recorded from a prior document rather than independently
re-derived. R19's count is this review's own mechanical breakdown.

**Flow counts for R19** (every closure re-derived from current source against the standard the
original finding named, never from the fix author's assertion):

- **Prior findings closed: 3 of 3.**
  - **R18 F1** (Moderate-new — the disposition paragraph placed tool 34 in two mutually exclusive
    classes, and row 34 carried the wrong class label) — **closed, on both limbs round 18 specified.**
    *Limb (a), delete `; tool 34 (the returned marker is the cursor)` from the Cursor-paged
    enumeration:* the clause is present in the `HEAD` object and absent from the working tree, whose
    enumeration ends at tool 32 (:185–186). *Limb (b), relabel row 34:* line 174 now reads
    "**merged-source resumable via three named fields (D12):**" (Read at drafting time). Verified not
    by reading but by recomputation — a scripted parse of the prose enumeration and of the quantified
    set produces **identical sets for all three classes**, a union of 20 with zero pairwise overlap,
    and 37 − 20 = 17, so the "exactly one class," "20 rows return lists," and "remaining 17 rows"
    statements are now facts rather than assertions. Closed against the standard originally named:
    the contract's Gate B pass condition. Round 18's edit prohibitions were honoured — the quantified
    set, the class definitions, the 20/17 split, and D12's wire contract are unchanged.
  - **R18 F2** (Moderate-new — the renewal threshold carried neither a value nor a config key, the
    only bound in the document that carried neither) — **closed against the standard originally
    named**, spec R-OPS-2's "given a sane default where one exists" clause read with the
    deferred-decision trap. `TOKEN_RENEWAL_THRESHOLD_MS` is declared in D21's
    optional-with-documented-defaults list at :1036 with default 300 000 ms, and D8(b) names the key,
    the default, and a relation at :525–528. The named-bounds sweep was re-run over the whole
    document: **fifteen of fifteen bounds now carry a value, a key, or both**, up from thirteen of
    fourteen. The residual defect in the *relation* is Finding 2 of this round and is a different
    claim about the same line — R-OPS-2's "validated at startup" clause rather than its default
    clause — so it does not reopen this closure.
  - **R18 F3** (Minor-new — `health-route.ts` pointed at D26, the test-seam decision, instead of D25)
    — **closed.** Line 76 now reads `health-route.ts        GET /healthz: liveness + auth-state
    summary, no secrets (D25).` (Read at drafting time). Verified by re-running the whole class
    rather than the single site: **all nineteen module-to-decision pointers in the Components block
    were walked against the decisions they name and all nineteen are correct.** Closed against the
    standard originally named: Gate C's "File paths and external references are confirmed, not
    assumed."
- **New findings: 1** (Finding 1 — byte-identical to the committed `HEAD` object, therefore
  pre-existing text, and grep-checked against all seven prior review documents with zero hits for
  `max_pages`, `assembly_structure` and `tool 8`).
- **Regressions: 1** (Finding 2 — the sentence is new this round; `TOKEN_RENEWAL_THRESHOLD_MS` has
  zero occurrences in the `HEAD` object and appears in no prior round's tree).
- **Recurring: 0.** No prior finding is open at its original location against its original standard.

**Tripwire evaluation — NOT FIRED**, with the arithmetic shown for both conditions. **Both streaks
reset to zero this round.**

- *Condition (a): new + regression ≥ closed, for two consecutive post-fix rounds.* **R19: 1 + 1 = 2
  vs 3 closed → 2 ≥ 3 is FALSE.** R18 was 3 + 0 = 3 vs 1 closed → TRUE, so the streak entering this
  round stood at 1 of 2. This round breaks it: the streak is now **0**. Does not fire.
- *Condition (b): total findings has not strictly decreased, for two consecutive post-fix rounds.*
  **R19: 2 vs R18's 3 → 2 < 3, so it DID strictly decrease → FALSE.** R18 was 3 vs R17's 1 → did not
  strictly decrease → TRUE, so that streak entering this round also stood at 1 of 2. This round
  breaks it: the streak is now **0**. Does not fire.

Round 18 correctly identified round 19 as the round in which either condition firing would route to
foundational rework. Neither fired, and both streaks were broken rather than merely held — the count
strictly decreased and closures outran new-plus-regression for the first time since round 17.

**Reading the count honestly.** The cycle is converging, and the two findings say different things
about it. Finding 1 is the residue of a scan class nobody had run: rounds 12 through 18 all verified
the disposition partition as a *set* — membership, exclusivity, totals — which is exactly the check
that passes while a member fails to have the property its class is defined by. That is the same
structural lesson round 18 recorded, one level deeper: the document's self-asserted invariants are
now all mechanically true, so the remaining defects are in the properties those invariants do not
range over. Finding 2 is of a different kind and deserves separate weight: it is in text written this
round, to a specification round 18 itself wrote, and it is the fourth regression in five rounds
(R15, R16, R19) — the fix site is still where new findings come from, even when the edit is
correctly scoped and reaches no further, as this one did. The qualitative signal at the fix site is
otherwise good: three findings closed, the edit confined to four added lines and two in-place
changes, and every accounting surface — the 37-row inventory, 60 traceability entries, 7 tables, 16
config keys, 28 decision slots, 15 standards tags, 9 state-store obligations, the 8-row threat join,
56 schema assertions — re-derived unchanged.

## Recommended Priority

The tripwire has not fired, so another fix round is the indicated path; recommending foundational
rework over a non-fired tripwire would be as wrong as recommending another round over a fired one.
Both findings are small, bounded, and located — the total edit is one input parameter, one clause in
D7, one bound in D18, and one startup assertion in D21.

1. **Finding 1 (Moderate) — one input parameter and one clause, in two known places.** Add `cursor?`
   to tool 8's Inputs column at :148, and state in D7 (:468–476) that the returned `cursor` is the
   position in the occurrence-page walk and that passing it back resumes the scan — in the same form
   D7's search extension already uses for tool 6 at :493–495. That sentence is the model; follow it
   rather than inventing a new one. This is the finding with real downstream consequence — it decides
   tool 8's input schema and whether a capped BOM is completable — so fix it first. **Do not
   reclassify tool 8 and do not touch the disposition partition, the quantified set, the class
   definitions, or the 20/17 split**; all four are correct, and moving tool 8 out of Cursor-paged
   would break the partition round 18 has just repaired.
2. **Finding 2 (Minor) — one bound and one assertion.** Give D18's backoff a stated ceiling that also
   caps an honored `Retry-After`, so the worst-case elapsed time of a retried exchange is computable,
   and add a startup assertion in D21 tying `TOKEN_RENEWAL_THRESHOLD_MS` to that bound — in the same
   form D3/D21 already use for `HTTP_MAX_BODY_BYTES` ("startup asserts it is not below that derived
   minimum, so the two bounds cannot drift apart"). Then let D8(b) cite the assertion rather than
   assert the inequality on its own authority. **Do not change the 300 000 ms default, D8's
   classification table, the journal-before-refresh ordering, the write-bytes-before-parsing rule,
   the single-flight mutex, `TOKEN_LOCK_STALE_MS`, or Limitation 7.**
3. **Touch nothing else.** D3, D12, D27, the threat table, the traceability matrix, the tool
   inventory's other 36 rows, the state-store table, the standards table, and the schema-derived
   premise slots were all re-derived this round and are correct. Rounds 15, 16 and 19 each produced a
   regression at the fix site; rounds 17 and 18 did not. The same discipline closes these two.
4. **Add the member-property check to the post-edit routine, alongside the set-equality check.** The
   partition check round 18 prescribed — parse the prose enumeration and the quantified set and
   assert they produce identical sets — now passes, and it passed while Finding 1 sat inside it. The
   check that catches this class is different in kind: for each class, assert that **every member's
   own row exhibits the class's defining property** — a cursor input for Cursor-paged, a stated
   bounding mechanism for Bounded-single-response, all three named fields taken and returned for
   Merged-source resumable. Run both after editing. Set equality proves the partition is well-formed;
   member-property conformance proves it is true.
5. **Watch the fix site specifically.** Three of the last five rounds produced a regression in text
   written that round, and this round's is in a sentence a prior review specified almost word for
   word. When a remedy prescribes a quantitative relation, check that every term of the relation is
   bounded somewhere in the document before writing the sentence that asserts it.
6. **Carry Limitations 8(b) and 8(c) into the build as gating checks, not as prose.** Both remain
   correctly handled as unverifiable while the credential is cleared — independently re-confirmed
   this round — and both name a specific query to run after the M-3 re-auth. They are the two places
   where the built server can diverge from this architecture without any document defect being
   visible, so the plan should schedule them as the first two post-authentication verifications
   rather than leaving them to be rediscovered.

Nothing in this round calls for re-opening D27's structure, Limitation 8's shape, the threat model,
D3's body-limit reasoning, D12's wire contract, or the schema-derived tool contracts.

## Verdict

Verdict: NEEDS FIXES (2 findings: 1 Moderate, 1 Minor)
