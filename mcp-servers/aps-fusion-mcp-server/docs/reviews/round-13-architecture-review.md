# Expert Review — Architecture: APS Fusion MCP Server (Round 13)

## Scope and Inventory

**Round 13** (post-fix; the first review is round 1, the prior completed review is
`docs/reviews/round-12-architecture-review.md`). The inventory is constructed by the post-fix
rule from all four required sources: the prior review's full inventory, the fix-diff files, the
fix-diff files' dependents, and the prior review's findings as closure items.

**Fix-diff.** `git diff HEAD -- docs/architectures/architecture-aps-fusion-mcp-server.md`:
one file, 9 hunks, +40/−31. No other file in the repository differs from HEAD as part of this
revision (`git status --short`: the other modified paths — `package.json`, `src/constants.ts`,
`src/index.ts`, `src/services/aps-auth.ts`, `src/tools/mfg-data-model.ts` — are the untouched
predecessor's pre-existing working-tree state, not this revision's product). **Dependents of the
fix-diff file:** none exist. The artifact is a markdown design document; nothing imports it, and
the `src/` tree it specifies has not been created. This is recorded rather than assumed —
see the tool plan below for why CodeGraph is not the instrument for that question.

| # | File | Status |
|---|---|---|
| 1 | `docs/architectures/architecture-aps-fusion-mcp-server.md` | [x] Read in full, 1491 lines (four passes: 1–400, 400–800, 800–1199, 1199–1491), plus targeted re-Reads at 676–695 and 1161–1192 at finding-drafting time |
| 2 | `docs/specs/spec-aps-fusion-mcp-server.md` | [x] Read in full, 638 lines |
| 3 | `.claude/skills/expert-architecture/SKILL.md` | [x] Read in full, 581 lines — the authoring contract that produced the artifact, and one of its governing standards; the item-by-item conformance check against it is in Upstream Contract Verification below |
| 4 | `HANDOFF.md` | [x] Read in full, 110 lines |
| 5 | `docs/reviews/round-12-architecture-review.md` | [x] Read in full, 177 lines (prior-round finding list; provenance source only) |
| 6 | `docs/aps-mfg-schema.json` | [x] Programmatically queried via Node against the introspection dump: 209 types; `Query` 21 fields with full arg lists; `Mutation` 45 fields; complete field lists for `Item`, `ItemVersion`, `ComponentVersion`, all four concrete Item types and all four concrete ItemVersion types, `ConfigurationTable`, `ConfigurationRow`, `ItemFilterInput`, `DerivativeInput`, `Properties`, `ItemVersions`, `Occurrence(s)`, `PhysicalProperties`, `Property`, `PropertyDefinition`, `Pagination(Input)`, `Thumbnail`, `Derivative`; global carrier sweeps for `fusionWebUrl` (6) and `tipRootComponentVersion` (1); global `ComponentVersion`-typed field sweep (9); `ItemVersion.possibleTypes` (4); enum values for `ItemCompositionEnum`, `OutputFormatEnum`, `OutputFormatResponseEnum`, `ItemTypeEnum` |
| 7 | `package.json` | [x] Grep-verified — `"@modelcontextprotocol/sdk": "^1.29.0"`, `"express": "^5.2.1"`, `"zod": "^4.3.6"` (lines 16–18) |
| 8 | `package-lock.json` | [x] Verified present (46,359 bytes) |
| 9 | `src/constants.ts` | [x] Grep-verified — v2 deprecation banner, `/mfg/v3/graphql/public`, ComponentVersion removal at lines 9–10 |
| 10 | `src/index.ts` | [x] Grep-verified — `app.post("/mcp", …)` at :71 with no auth middleware on any route (routes at :47, :56, :58, :69, :71); `version: "1.0.0"` hardcoded at :22 |
| 11 | `src/services/aps-auth.ts` | [x] Read 100–130 + grep-verified — `clearTokens()` at :119 inside `if (!res.ok)` (:110) after the sibling-rotation early return (:114–118); `isAuthenticated()` → `currentTokens() !== null` (:145–146); `getAuthUrl()` params at :52–57 carry no `code_challenge` and no `state` |
| 12 | `src/services/aps-client.ts` | [x] Grep-verified — `urnToBase64` at :38 |
| 13 | `src/tools/mfg-data-model.ts` | [x] Read 468–500 + grep-verified — `truncateIfNeeded` at :30; bare-quote `componentVersionId: "${component_version_id}"` at :590; `readOnlyHint: true` at :480 and `generate: true` at :497 inside the same tool definition |
| 14 | `src/tools/model-derivative.ts` | [x] Grep-verified — second, divergent `truncate` at :9 |
| 15 | `docs/apsq.mjs` | [x] Verified present (2,927 bytes) — **added mid-pass** (needed to test Limitation 8(b)'s stated blocker) |
| 16 | `C:/Users/maxco/.aps-fusion-mcp/tokens.json` | [x] Read — contains the literal 4-byte string `null`; the credential is cleared, matching `clearTokens()`'s `JSON.stringify(null)` write at `src/services/aps-auth.ts`:40. **Added mid-pass** (same reason) |

**Tool plan (Step 3).** Instruments available and exercised: Read; Grep; Bash/Node (programmatic
schema introspection, GFM table parsing, date arithmetic); Context7; Clear Thought; git.
Claim-type mapping — absence claims → grep and programmatic schema queries; literal-content
claims → Read at file:line; library- and vendor-API-behavior claims → Context7
(`/websites/aps_autodesk_en`, `/colinhacks/zod`, `/modelcontextprotocol/typescript-sdk`,
`/expressjs/express`, `/websites/tailscale`); structural/blast-radius claims → the fix-diff
plus the observation that the artifact has no importers; prior-document claims (round-12's
findings, HANDOFF's assertions, the document's own premise slots) → re-derived from current
source. **CodeGraph and codebase-RAG were not exercised, and this is not a verification gap:**
every structural question in this review's scope is either an absence claim or a
literal-content claim, which Step 3 assigns to grep/Read rather than CodeGraph, and the
architecture specifies a greenfield `src/` tree that does not yet exist. No instrument class was
unavailable for a load-bearing claim category, so no halt condition arose.

**Rigor waivers.** None. No compression was requested or applied.

**Procedural note.** `collaborativereasoning` rejected the first invocation on enum validation
(`communication.style` / `communication.tone` accept only fixed enums) and succeeded on retry
with valid values. The mandatory multi-perspective check was completed via the tool.

## Summary

**This review returns NEEDS FIXES (3 findings).** All four of round 12's findings are closed
against the standards they originally named — including the Serious finding on D12's cross-source
join key, which had recurred for three consecutive rounds and is now correct on both the write
half (D11's journal entry persists `resourceUrn` as its own member) and the read half (D12
derives identity from that field). The document's premise surface is large and, under independent
re-derivation, overwhelmingly accurate: roughly sixty distinct verified assertions were
re-checked this round — the full MFG schema claim set against the introspection dump, every
Context7-cited library and vendor-API behavior against current documentation, and every claim
about the predecessor's source against the files themselves — and two were defective. Both
defects are of the same shape and neither touches a design decision: a *summary* sentence
overstates what its own cited source supports, while the detailed text it summarizes is correct.
The third finding is an arithmetic figure that went stale when the header date advanced. Nothing
found this round changes a line of the eventual build.

## Upstream Contract Verification

The upstream artifacts are the spec (`docs/specs/spec-aps-fusion-mcp-server.md`) and the
authoring contract (`.claude/skills/expert-architecture/SKILL.md`). The artifact is a design
document, so the spec's acceptance criteria are not executable at this phase; what is checkable
is requirement coverage and contract conformance, and both were checked mechanically.

**Spec requirement coverage — PASS.** I counted the spec's requirements independently from its
own text: R-DISC 4, R-READ 6, R-WRITE 4, R-EXPORT 5, R-AUTO 5, R-NOTIFY 3, R-AUTH 1 (28
functional); R-PROTO 6, R-REL 7, R-OPS 5 (18 non-functional); S-1..S-14 (14 security) = **60**.
I then parsed the traceability matrix (document lines 1344–1377) programmatically with a
GFM-escape-aware cell splitter and extracted its two requirement columns: 28 entries left, 32
right, **60 total, 60 distinct**. Set-differenced against the expected 60: zero missing, zero
extra, zero duplicates. The document's "60 spec requirements" claim (Goal line 23; Status line
1482) is correct.

**Acceptance criteria.** By set-difference of `AC-[0-9]+` occurrences across both documents, the
architecture cites AC-5 through AC-27 and never cites AC-1, AC-2, AC-3, AC-4, or AC-17. This is
**not** a contract violation: the authoring contract requires the traceability matrix to account
for every R# and Q#, not every AC, and each of those five ACs cites requirements that are
themselves traced (R-DISC-1/2/3/4, R-READ-1..6). Recorded so the reader can audit the gap rather
than discover it.

**Authoring-contract conformance — checked item by item, mechanically where possible.**

- *Required sections.* All eleven present, by grep of `^## `: Goal (21), Scope (35), Components
  (54), Quality characteristics (199), Design decisions (213), Threat model (1281), ASVS
  mapping (1322), Traceability (1342), Limitations (1381), Standards (1443), Status (1477).
  Scope carries all three required subsections (In scope :37, Deferred with reasoning :44, Out of
  scope :50). *Inheritance from existing precedents* is correctly omitted, with its attestation
  in Status (lines 1486–1487): no prior architecture exists in this family to inherit from.
- *Five-part decision format.* Scripted per-decision slot check across D1–D28: every one of the
  28 decisions carries all five slots (`**Decision.**`, `**Standard.**`, `**Why here.**`,
  `**Not.**`, `**Premise.**`). Zero gaps.
- *ASVS.* All fourteen chapters V1–V14 dispositioned in the mapping table (lines 1327–1340).
- *Mandatory Clear Thought invocations.* All present or explicitly attested:
  `metacognitivemonitoring` (:215), `mentalmodel`/`mentalmodel(first_principles)` (:389 D5,
  :464 D7, :786 D14, :809 D15, :1099 D24, :1127 D25), `decisionframework` (:276 D1, :307 D2,
  :594 D10), `structuredargumentation` (trace at :1245–1269, attestation at :1271),
  `sequentialthinking` (attestation at :1239 naming D5/D7/D8), `scientificmethod` (:1284,
  threat model), `collaborativereasoning` (:1231), and `debuggingapproach` attested
  *not* invoked with reasoning (:1275–1279).
- *Gate C structural checklist.* Two contract violations were found and both are closed (see
  Convergence Record); the three findings below are premise-accuracy defects, one of which
  (Finding 3) also engages Gate C's "external references are confirmed, not assumed."

## Critical & Serious Findings

**No Critical or Serious findings** — the full inventory was Read or Grep-verified per Compliance
Gate B, and no violation of Critical or Serious classification was observed. In particular, the
prior round's sole Serious finding is closed; the verification is recorded in the Convergence
Record.

## Systemic Patterns

**No systemic patterns** — verified by five proactive scans across the full inventory scope.
Findings 1 and 2 below share a shape ("a summary claim overstates what its cited source
supports"), which is the two-instance trigger to test for systemic; the scans were run before
classifying, and they do not support the claim.

1. **Verified-premise accuracy sweep (the Finding 1 / Finding 2 class).** Grep for
   `schema-verified|schema introspection|verified by schema|verified against .docs/aps-mfg-schema`
   across the document: **8 hits** (lines 142, 143, 144, 172, 476, 492, 885, 1166). Each
   re-derived independently against `docs/aps-mfg-schema.json`. Seven are correct — tool 5's
   `tipVersion` on all four concrete Item types; tool 6's match typing including
   `tipRootComponentVersion` being borne by `DesignItem` alone; tool 7's complete field-provenance
   chain; tool 35's `ItemVersion`-interface field list; D7's claim that `itemsByProject` /
   `itemsByFolder` with `ItemFilterInput{name,itemType}` are the only name-filterable item
   queries; D7's `allOccurrences` / `pagination.cursor` shapes; D18's
   `ComponentVersion.derivatives(derivativeInput:{generate:true})`. One is wrong: line 1166
   (Finding 2). Separately, every Context7-cited claim in the document was re-derived against
   current docs this round — Tailscale Serve/Funnel port rules, the Autodesk `dm.version.added`
   envelope and `x-adsk-delivery-id` header, zod v4 `packages/docs/content/api.mdx` vs v3
   `packages/docs-v3/home.md`, SDK `ToolAnnotationsSchema` defaults,
   SDK `WebStandardStreamableHTTPServerTransportOptions` and `validateRequestHeaders`, Express
   `json` limit default and `raw`/`verify` semantics, Model Derivative `properties:query`
   pagination and object-tree narrowing — all correct; and all ten predecessor-source claims were
   confirmed at file:line, all correct. Total re-derived population ≈ 60 assertions, 2 defective,
   located in different sections and resting on different sources (one on the GraphQL
   introspection dump, one on vendor documentation) with no shared mechanism. Two defects across
   that population is isolated, not systemic.
2. **Markdown table integrity** (Node parse of all table blocks with GFM-correct
   escaped-pipe handling, checking every row's cell count against its header and the
   blank-line termination of each block): **7 tables, 0 defective rows, 7/7 blank-terminated.**
   Tables at 136–173 (6 cells × 38 rows), 201–211 (4 × 11), 1085–1095 (3 × 11), 1302–1311
   (4 × 10), 1327–1340 (2 × 14), 1344–1377 (5 × 34), 1445–1475 (3 × 31).
3. **Config-key orphans** (`grep -o '\b[A-Z][A-Z0-9]*\(_[A-Z0-9]\+\)\+\b'`): 17 distinct
   identifiers, of which 15 are config keys (`O_EXCL` and `AS_SAVED` are not). All 15 —
   `TAILNET_BASE_URL`, `WEBHOOK_PUBLIC_URL`, `MCP_AUTH_TOKEN`, `APS_CALLBACK_URL`,
   `EGRESS_ALLOW_HOSTS`, `DA_OUTPUT_FOLDER_ID`, `SPEND_REQUIRE_CONFIRM`, `MFG_MAX_PAGES`,
   `MFG_SEARCH_MAX_PROJECTS`, `MFG_SEARCH_ROW_LIMIT`, `UPLOAD_MAX_BYTES`, `HTTP_MAX_BODY_BYTES`,
   `DM_POLL_MAX_FOLDERS`, `TOKEN_LOCK_STALE_MS`, `AUTH_VERIFIER_TTL` — are declared in D21
   (lines 979–1001). **Zero orphans.**
4. **Standards decoration** (bracketed-tag extraction, body lines 1–1442 against the Standards
   table 1443–end): 15 tags in the body, all 15 present in the table. The table's one extra,
   `[APS-COMMERCIAL]`, is not decoration — the commercial model (C4) is what makes the `$` effect
   class exist at all, and it demonstrably drives D13's metered categories, D14's cost-class
   carving, the tool inventory's costlessness-basis prose (lines 123–134), and Limitation 11.
   Every named non-tag standard in the body (ASVS 4.0.3, ISO/IEC 25010:2023, SOLID, RFC 9110,
   Crash-Only, Twelve-Factor §III, Google SRE ch. 22, OWASP Threat Modeling, Express 5,
   Tailscale, pino, zod v4) appears in the table with what it governed. **Zero decoration.**
5. **Gate C authoring residue and deferred-decision phrasing** (case-insensitive sweep for
   `corrected|correction|previously|earlier draft|prior draft|revision|revised|was wrong|initially|superseded|TODO|TBD|FIXME|scratch|unchanged|no longer|as before|still stands|re-stated|now correctly|now states|remains as|in a prior round|last round`,
   plus a second sweep for
   `left to the (implementer|build|plan)|the implementer will|at implementation time|to be determined|decided later|during implementation|implementer.s choice|refined (later|during)`):
   **3 hits, 0 genuine.** Line 220 ("superseded by the spec's hosted-primary D-1") is the
   required metacognitive baseline naming an anchoring bias, not a note about a prior draft of
   this document; line 1116 ("protocol revision") is a false positive on the word *revision*;
   line 1083 ("a defect in this decision, not an implementer's choice") is an explicit
   *anti*-deferral rule. The prior round's Gate C artifact class is fully cleared.

## Moderate & Minor Findings

### Finding 1 — Moderate (new). D12 and D11 generalize the version-event callback shape to all Data Management events, and the document's own cited corroborating reference is the counterexample

**What the document says.** D12's cross-source identity paragraph (lines 680–691) states that
identity is derived from the journal entry's `resourceUrn` field, "verified against Autodesk's
`dm.version.added` callback reference via Context7 `/websites/aps_autodesk_en`, 2026-07-30 — the
envelope is `{version, resourceUrn, hook, payload}`, and the `dm.operation.started` reference
shows the same shape, so this is the envelope, not an event quirk), **carrying
`urn:adsk.wipprod:fs.file:vf.<id>?version=N`**". The next sentence adds that
"`payload.lineageUrn` and `payload.source` corroborate it **in the `dm.*` shapes** … and serve as
fallbacks if the envelope field is ever absent." D11 repeats the fallback limb at lines 646–648:
"D12 derives cross-source identity from that field, with `payload.lineageUrn`/`payload.source` as
fallbacks."

**How the claim was verified.** Context7 `/websites/aps_autodesk_en`, 2026-07-30, two lookups
against the two references the document itself names.

- `dm.version.added` returns `resourceUrn:
  "urn:adsk.wipprod:fs.file:vf.0zvdp3CoTzWDcZC_wL0kJA?version=1"` with `payload.lineageUrn:
  "urn:adsk.wipprod:dm.lineage:0zvdp3CoTzWDcZC_wL0kJA"` and `payload.source` identical to
  `resourceUrn`. The envelope claim, the shared-opaque-suffix claim, and the fallback claim all
  hold **for this event**.
- `dm.operation.started` returns the identical envelope — `{version, resourceUrn, hook, payload}`
  with the same `x-adsk-delivery-id` / `x-adsk-signature` headers — but its `resourceUrn` is
  `"urn:adsk.wipprod:fs.folder:co.HGJKYimOQomuJU1E1tSmfg"`, a **folder** URN, and its `payload`
  object contains `userInfo, progress, startTime, operationName, state, message, errors,
  sourceResource, eventContext, tenant` — **no `lineageUrn` and no `source`**.

So the reference the document cites to establish that the envelope generalizes simultaneously
disproves the two content claims stacked on top of it. The envelope generalizes; the
`fs.file:vf.…?version=N` payload of `resourceUrn` and the `lineageUrn`/`source` fallbacks do not
— both are specific to the version-event family.

**Which standard it violates.** The authoring contract's Phase 10 element 5, which requires the
premise slot to state "what was checked, against what source, with what result," and Gate B's
auditability condition that a reader can answer "what factual premises was this verified against"
from the document alone. A premise whose named source contradicts the claim it is cited for
fails the audit it exists to enable. This is the same standard Finding 2 engages, at a different
location and against a different source.

**Why it matters.** Spec **R-NOTIFY-1** puts folder events explicitly in scope ("version
added/modified, **folder modified**"), tool 31 accepts caller-supplied event types, and D11
creates one hook per event type. For every hook on a non-version DM event, `resourceUrn` is a
folder URN that cannot parse under D27's `fs.file:vf.…?version=N` grammar, so every such journal
entry lands permanently in the `identity: unresolved` bucket — and the stated fallbacks are
absent from those payloads too. The *behavior* is correct and fully specified: D12 says an entry
whose `resourceUrn` does not parse "is still reported (never silently dropped) and flagged
`identity: unresolved`," and there is genuinely nothing on the poll side for a folder event to
join against. What is wrong is the characterization: D12 attributes the unresolved branch to "a
payload-shape change" — an exceptional future event — when for a spec-sanctioned class of hooks
it is the normal and permanent state. A planner sizes the unresolved bucket as rare; a reviewer
checking AC-9's polling clause against a folder-event hook sees 100% unresolved and has no
statement in the architecture telling them that is correct rather than broken.

**What correct implementation looks like.** Scope both limbs to the event family they hold for,
and say what tool 34 does outside it. Concretely: in D12, replace "carrying
`urn:adsk.wipprod:fs.file:vf.<id>?version=N`" with a statement that `resourceUrn` carries the URN
of whatever resource the event concerns — the `fs.file:vf.…?version=N` version URN for the
`dm.version.*` family, a `fs.folder:co.…` folder URN for folder- and operation-scoped events
(verified: `dm.operation.started` reference) — and that the `(itemId, versionId)` normalization
and the cross-source join therefore apply to the version-event family only; qualify the
`payload.lineageUrn`/`payload.source` fallback the same way, in **both** D12 (lines 689–691) and
D11 (lines 646–648), since a fix to only one leaves the other wrong; and state explicitly that
entries from non-version events are reported flagged `identity: unresolved` **by design**, not by
degradation, because no poll-side counterpart exists to join them to. The envelope-shape claim
itself needs no change — it is correct and correctly evidenced.

**Provenance: new.** Round 12's Serious finding concerned `resourceUrn`'s *location* (a
top-level sibling of `payload` rather than a member of it) and the journal schema's failure to
persist it. Both are fixed. This finding concerns what `resourceUrn` *contains* across event
types, a different property at a location that round 12 did not report.

### Finding 2 — Moderate (new). D27's four-tool enumeration is wrong for two of the four tools, and Limitation 8(b) repeats it

**What the document says.** D27 (lines 1165–1166): "**Tools 5/6/7/35 each return an
`ItemVersion`-typed id (schema-verified)**, and this decision assumes that id **is** that URN
form". Limitation 8(b) (lines 1413–1415) repeats it: "D27 assumes `ItemVersion.id` — **what tools
5/6/7/35 return** — is the Data Management version-URN form".

**How the claim was verified.** Programmatic introspection of `docs/aps-mfg-schema.json` plus
Read of the document's own tool-inventory rows (lines 142, 143, 144, 172).

- **Tool 5** — correct. Its row returns `tipVersion{id, versionNumber, lastModifiedOn}` via inline
  fragments on all four concrete Item types; all four `tipVersion` fields are typed
  `BasicItemVersion` / `DesignItemVersion` / `ConfiguredDesignItemVersion` /
  `DrawingItemVersion`, which are exactly `ItemVersion.possibleTypes`, and all four carry
  `id`, `versionNumber`, and `lastModifiedOn`.
- **Tool 35** — correct. `Query.itemVersions(hubId:ID!, itemId:ID!, pagination:PaginationInput):
  ItemVersions`, and `ItemVersions.results: [ItemVersion]!`.
- **Tool 6** — wrong on two of its three documented match branches. Its row states that
  `DesignItem` matches carry **`tipRootComponentVersion.id`**, and the schema types
  `DesignItem.tipRootComponentVersion` as **`ComponentVersion`** — an `OBJECT` that is not among
  `ItemVersion.possibleTypes` (`["BasicItemVersion","ConfiguredDesignItemVersion",
  "DesignItemVersion","DrawingItemVersion"]`). The row further states that "Basic/Drawing matches
  return typed hub/project/item ids only" — `Item` ids, not `ItemVersion` ids. Only the
  `ConfiguredDesignItem` branch returns `tipVersion.id`. The plain-`DesignItem` case — the
  dominant one for a Fusion server — returns a component-version id, a different entity type.
- **Tool 7** — not supported by its own contract. Its Returns cell is a *field-provenance*
  enumeration: `tipVersion` is named as the **source of** `versionNumber`/`createdOn`, never as a
  returned id. The only ids the row states tool 7 returns are the configuration-row list's
  `{rowId, rowName, rootComponentVersionId}` — again `ComponentVersion` ids. Tool 7 returns no
  `ItemVersion`-typed id at all.

**Which standard it violates.** The authoring contract's Phase 10 element 5 (premise
verification), specifically the "(schema-verified)" marker, which asserts that the enumeration
was checked against `docs/aps-mfg-schema.json` and found to hold. It does not hold for two of the
four tools named.

**Why it matters.** This sentence is the whole of D27's reachability argument — the claim that an
agent holding this server's own outputs can obtain a `version_id` for tools 23–26 — and it is
precisely what a reviewer would check to satisfy themselves the MD tool group is not orphaned.
The conclusion survives (tools 5 and 35 do supply `ItemVersion` ids, so the group is reachable),
so this is a defect in the evidence rather than in the design. But it invites a specific
downstream error: a reader told that tool 6 returns an `ItemVersion`-typed id may wire tool 6's
`DesignItem` output into an MD tool's `version_id`, where it is a `ComponentVersion` id and a
category error. D27's own zod URN-grammar validation at the `md-gateway` boundary would reject it
at runtime, which bounds the damage to a confusing failure rather than a security or data
consequence — hence Moderate rather than Serious.

**What correct implementation looks like.** Replace the sentence with the enumeration the schema
supports, and mirror the correction in Limitation 8(b): "Tools 5 and 35 return `ItemVersion`-typed
ids — tool 5 via `tipVersion{id}` on all four concrete Item types, tool 35 via `itemVersions →
ItemVersions.results: [ItemVersion]!`. Tool 6 returns one only on its `ConfiguredDesignItem`
branch (`tipVersion.id`); its `DesignItem` branch returns `tipRootComponentVersion.id`, a
`ComponentVersion` id, and its Basic/Drawing branch returns item ids only. Tool 7 returns no
version id; a caller holding a tool 6 or tool 7 result reaches an `ItemVersion` id through tool
35." **The tool-inventory rows for tools 6 and 7 are themselves correct and must not be edited** —
I re-derived every field-location claim in both rows against the schema and found no
discrepancy. The defect is confined to D27's summary of them and to Limitation 8(b)'s repetition
of that summary.

**Provenance: new.** Round 12 raised a *Tentative* (T1) on the different, downstream question of
whether `ItemVersion.id` is the DM version-URN form, and in doing so accepted this antecedent
enumeration as confirmed. No prior round reported the enumeration itself as a finding.

### Finding 3 — Minor (new). Limitation 11's "twenty days" is eighteen days from the document's own header date

**What the document says.** Limitation 11 (lines 1435–1436): "**MFG Data Model becomes a priced
API on 2026-08-17** (C4), **twenty days after this document's date**."

**How the claim was verified.** Read of the header (line 5: `**Date:** 2026-07-30`) and of
Limitation 11 (lines 1435–1436), plus arithmetic computed in Node over UTC dates:
2026-07-30 → 2026-08-17 is **18 days**. The figure "twenty" is correct only for a document date
of 2026-07-28; it is 19 for 2026-07-29. The spec's C4 date (2026-08-17) was confirmed at
`docs/specs/spec-aps-fusion-mcp-server.md` §5 C4 and is not in question.

**Which standard it violates.** Gate C's structural checklist — "File paths and external
references are confirmed, not assumed" — read together with Phase 10's premise discipline: a
derived quantity stated in the document is a claim, and this one is checkable in one step and
wrong. First-principles articulation for why this is a defect rather than a typo: the goal of
stating the interval at all is to let a reader judge urgency — how much runway exists before the
cost model under which every R-class tool is labeled "no metered charge" changes; the shortcut is
carrying a hand-computed figure forward across a header-date edit; that fails the goal because
the figure silently stops tracking the thing it measures, and a reader has no signal that it is
stale.

**Why it matters.** Two days of a twenty-day runway is not itself consequential. The class is:
this figure is derived from the header date and was not recomputed when the header date advanced
to 2026-07-30 in this revision (the header is one of the nine hunks in the fix-diff). That is
exactly the drift mechanism `HANDOFF.md` identifies as the cause of twelve failed rounds — "a
grep or parser finds only what its author already suspected" — surfacing in a place no
string-search for a flagged term would reach.

**What correct implementation looks like.** State it as "eighteen days after this document's
date," or — better, since the figure will go stale again on any date edit — drop the derived
interval and let the absolute date 2026-08-17 carry the point unaided.

## Tentative Findings

**No tentative findings** — every candidate finding's premise was verified per Compliance Gate B.
Round 12's tentative T1 (whether MFG `ItemVersion.id` is the Data Management version-URN form) is
**not carried forward as a tentative finding**, because the document now discloses it rather than
asserting it: D27 (lines 1166–1168) marks the assumption "**not live-verified**" in the decision
text itself and points to Limitation 8(b), which names the exact closing query
(`itemVersions(hubId:, itemId:)` requesting `results { id versionNumber }` through
`docs/apsq.mjs`), the derivation step D27 would need if it fails, and the fact that AC-7's
foreign-CAD path is unaffected either way. I verified the disclosure's *stated blocker*
independently rather than accepting it: `docs/apsq.mjs` is present (2,927 bytes), and
`C:/Users/maxco/.aps-fusion-mcp/tokens.json` contains the literal 4-byte string `null` — the
credential is cleared, exactly as `clearTokens()` writes it at `src/services/aps-auth.ts`:40 —
so no live APS call is possible from this repo and the check genuinely cannot be discharged now.
Under the authoring contract, "claims that couldn't be verified with available tools" is the
declared purpose of the Limitations section, and the decision itself is not ambiguous — D27
states a complete, implementable contract. This is correct handling of an unverifiable premise,
not a deferred decision, and it should not be re-opened in the next revision.

## Observations

- The document's header disclosure that the spec file's own `Status:` line still reads "Draft for
  review" while `HANDOFF.md` records a five-round PASS is accurate on both limbs: spec line 3
  reads `**Status:** Draft for review`, and `HANDOFF.md` line 14 records "It passed five
  independent blinded rounds with zero findings." Flagging governance metadata the architecture
  does not own, rather than silently resolving it, is the correct handling.
- The document is candid that AC-25 is expected to fail acceptance until the owner rules on the
  C2 / R-REL-7 amendment, which `HANDOFF.md` records as itself unreviewed. Recording an
  unresolved upstream governance state rather than designing around it is the right disposition.
- `Mutation` is present in `docs/aps-mfg-schema.json` as a type with 45 fields, and all eight
  mutations the architecture names (`createFolder`, `renameFolder`, `moveFolder`, `copyFolder`,
  `deleteFolder`, `createDesignFromFile`, `setProperties`, `createPropertyDefinition` plus the
  collection mutations) exist on it — but the introspection dump's top-level object carries only
  `queryType` and `types`, with no `mutationType` pointer. This affects no claim the architecture
  makes; it is worth knowing before the build introspects this file, because a tool resolving
  mutations through `mutationType` will find none.
- `HANDOFF.md` states (line 6) that "Thirteen rounds of independent blinded review ran"; the most
  recent completed review is round 12 and this is round 13, so twelve had run when that sentence
  was written. It also states (line 75) that "MFG became a priced API on 2026-08-17" in the past
  tense, for a date eighteen days in the future. `HANDOFF.md` is not the artifact under review;
  recorded because it is on this review's inventory and a reader may consult it.

## What's Actually Good

- **The D5 type-located field enumeration survives independent programmatic re-derivation at
  full density.** I re-checked every claim against `docs/aps-mfg-schema.json` by script rather
  than by eye: the `Item` interface carries exactly the twelve fields named "and nothing else";
  `tipVersion` and `versions` exist on all four concrete Item types; `tipRootComponentVersion` is
  borne by `DesignItem` and by nothing else in the schema; the `ItemVersion` interface carries
  `versionNumber`/`createdOn`/`lastModifiedOn` at interface level; `ComponentVersion` carries
  partNumber/partDescription/materialName/isMilestone/lastModifiedOn+By/createdBy and has **no**
  `versionNumber` and **no** `createdOn`; `DesignItemVersion` and `ConfiguredDesignItemVersion`
  both carry versionNumber+createdOn and both expose `item:` typed to their concrete Item, which
  is what makes tool 12's two `fusionWebUrl` traversals resolve; `fusionWebUrl` is present on
  exactly the six types named and absent from `ComponentVersion`; the schema has exactly nine
  `ComponentVersion`-typed fields and `ConfigurationRow.rootConfigurationMember` is among them;
  `ConfigurationTable.rows` is `[ConfigurationRow]!` with zero arguments, confirming the
  "API-unpaginated, so the bound is tool-level" claim. Roughly forty checks, zero discrepancies.
  By the authoring contract's element-5 standard this is what a verified premise slot is supposed
  to look like, and a slot that survives re-derivation at this density is rare.
- **The tool inventory's completeness accounting reconciles under independent recomputation, by
  script rather than by trust.** I parsed all 36 rows and classified each from its Returns column
  myself: 20 list-returning, 16 single-object — matching the document. The three-way disposition
  partition is exact and every member correctly assigned: cursor-paged {2,3,4,5,6,8,10,11,12,26,
  27,32,35} = 13, bounded-single-response {7,13,24,25,30,31} = 6, merged-source resumable {34} =
  1, summing to 20. The R-class costlessness-basis enumeration reconciles (13 MFG-backed + 3 MD +
  3 DA + 3 Webhooks/DM = 22), as does the W-class annotation partition (5 destructive
  {13,16,17,19,33} + 6 additive {14,15,18,20,31,36} = 11, with `idempotentHint` inverted across
  exactly that partition), and 22 + 11 + 3 = 36. The seven group file counts (1+6+6+9+6+4+4) also
  sum to 36 with every tool assigned exactly once. Against [MCP-TOOLS]' schema-and-annotation
  discipline and spec R-DISC-4's explicit-completeness requirement, this is a contract a reviewer
  can mechanically diff against `tools/list` — which is exactly what AC-16 asks for.
- **D14's annotation matrix rests on correctly-read SDK defaults, and the semantic scoping is
  right too.** Context7 `/modelcontextprotocol/typescript-sdk`, 2026-07-30, `ToolAnnotationsSchema`
  in `packages/core/src/schemas.ts`: `readOnlyHint` defaults **false**, `destructiveHint` defaults
  **true**, `idempotentHint` defaults **false**, `openWorldHint` defaults **true**; and both
  `destructiveHint` and `idempotentHint` are documented as "meaningful only when `readOnlyHint ==
  false`". D14's inference follows exactly: W-class tools must set `destructiveHint` explicitly
  because the permissive value is the default, idempotent tools must set `idempotentHint:true`
  explicitly, and the R-class annotation set correctly declares only `readOnlyHint:true,
  openWorldHint:true` rather than padding it with hints the spec calls meaningless. Getting a
  default backwards here is the classic silent failure of truthful-annotation requirements
  (spec R-PROTO-4); this one is right in both directions.
- **D3's Origin middleware is verified down to the SDK source, and it discloses an interaction
  that would otherwise mislead its own reviewer.** Context7 confirms
  `WebStandardStreamableHTTPServerTransportOptions` marks `allowedHosts`, `allowedOrigins`, and
  `enableDnsRebindingProtection` `@deprecated` in favour of external middleware, and that
  `validateRequestHeaders` guards origin with `if (originHeader &&
  !this._allowedOrigins.includes(originHeader))` — a missing or empty Origin is never rejected —
  so D3's permissive-absent rule genuinely concedes nothing relative to what it replaces.
  Separately, D3 states that because the bearer gate precedes the Origin check, a reviewer probing
  AC-13's 403 case without a valid bearer secret will observe 401 and wrongly conclude S-4 is
  unimplemented. Naming the way your own acceptance criterion can be mis-executed is the
  reviewer-persona property Gate A exists to produce, and it is rarely present.
- **D18's safe/cost type-pairing is grounded in a verified counterexample rather than an
  abstraction.** The schema confirms `ComponentVersion.derivatives(derivativeInput:
  DerivativeInput{outputFormat, generate}): [Derivative]` — a billable job submission reachable
  entirely through the *query* half of the schema, with no mutation involved. That makes "GraphQL's
  query/mutation split is a schema-authoring convention, not a safety guarantee" a verified fact
  about this specific API rather than a general caution, and it correctly justifies drawing the
  retry boundary on the (safe, cost) pair instead of on RFC 9110 §9.2.2's method contract alone.
  The predecessor's `readOnlyHint: true` sitting over `generate: true` — confirmed in the same
  tool definition at `src/tools/mfg-data-model.ts`:480 and :497 — is exactly the defect this
  closes.
- **D3's transport body bound is derived, not guessed, and its arithmetic checks out.** Context7
  `/expressjs/express` confirms `express.json`'s `limit` default is `'100kb'`. D3's consequence —
  that the default "would reject any upload above ~75 kB of content once base64 expansion is
  applied" — is 100 kB ÷ (4/3) = 75 kB, correct; and `HTTP_MAX_BODY_BYTES`'s derived minimum
  `ceil(UPLOAD_MAX_BYTES × 4/3) + 1 MB` is the right expansion factor for base64, is startup-
  asserted so the two bounds cannot drift, and is declared in D21. Identifying that the stateless
  per-request pattern makes the transport limit — not `UPLOAD_MAX_BYTES` — the real resident-bytes
  ceiling is the kind of interaction that is normally discovered in production.

## Convergence Record

**Round:** 13 (post-fix), matching Scope and Inventory.

**Trajectory:** R9: 6 → R10: 4 → R11: 6 → R12: 4 → **R13: 3**. The R9–R12 counts are taken from
round 12's own Convergence Record, which is the only prior review present in `docs/reviews/`;
rounds 1–8 are not available in this repository, so the trajectory is recorded from R9 forward.
R13's count is this review's own mechanical verdict breakdown.

**Flow counts for R13** (provenance per finding; every closure re-derived from current source
against the standard the original finding named, never from the prior review's assertion):

- **Prior findings closed: 4 of 4.**
  - **R12 F1** (Serious, recurring — D12's join key read `payload.resourceUrn`, which does not
    exist at that path, and D11's journal persisted only `payload`) — **closed, both legs.**
    *Write leg:* D11 line 613 now appends `{sequence, receivedAt, deliveryId, eventType,
    resourceUrn, payload}`, with `resourceUrn` a first-class journal member captured "from the
    **top level of the callback envelope**"; D24's inventory row at line 1095 carries the
    identical entry shape, so the two cannot drift. *Read leg:* D12 lines 680–682 derive identity
    from "the entry's **`resourceUrn` field**", not from `payload`. *Verification:* Context7
    `/websites/aps_autodesk_en`, 2026-07-30 — the `dm.version.added` callback reference returns
    `{version, resourceUrn, hook, payload}` with `resourceUrn` a top-level sibling, and the
    `dm.operation.started` reference returns the same envelope; the `x-adsk-delivery-id` header
    D11 now records as `deliveryId` is documented on both. The normalization D12 depends on is
    also grounded: the reference's `payload.lineageUrn`
    (`urn:adsk.wipprod:dm.lineage:0zvdp3CoTzWDcZC_wL0kJA`) shares its opaque suffix with
    `resourceUrn` (`urn:adsk.wipprod:fs.file:vf.0zvdp3CoTzWDcZC_wL0kJA?version=1`), which is what
    makes the `(itemId, versionId)` derivation work. Closed against the standard originally named
    (Phase 10 element 5 plus the deferred-decision prohibition). Finding 1 above is a different
    property at this location, not a non-closure.
  - **R12 F2** (Moderate — D19's zod citation misattributed both halves of its premise) —
    **closed.** Context7 `/colinhacks/zod`, 2026-07-30, three lookups. The sentence "When merging
    object schemas, prefer `A.extend(B)` over intersections. Using `.extend()` will give you a new
    object schema, whereas `z.intersection(A, B)` returns a `ZodIntersection` instance…" appears in
    `packages/docs/content/api.mdx` under the **Intersections** heading — its subject is
    `z.intersection`, exactly as D19 line 947 now says. Both composition forms D19 relies on are
    documented in that same v4 file: `.extend()` (`Dog.extend({breed: z.string()})`) and the
    shape-spread form (`z.object({ ...Dog.shape, breed: z.string() })` and
    `z.object({ ...Animal.shape, ...Pet.shape, … })`). And `.merge()`'s unknownKeys/catchall
    inheritance — "The resulting schema also inherits the 'unknownKeys' policy and catchall schema
    from the second object" — appears in `packages/docs-v3/home.md`, the **v3** reference, exactly
    as D19 lines 948–950 now say. All three attributions are now correct. Closed against the
    standard originally named — Gate C's "Every Context7-verified claim cites what was verified
    and when (library, version, date)" — which the premise slot now satisfies at
    `/colinhacks/zod`, per-file, 2026-07-30.
  - **R12 F3** (Moderate — D24's state-store table carried a fourth cell and ran a normative rule
    into the table body) — **closed.** Verified by the programmatic table scan: the D24 table
    (lines 1085–1095) is 3 cells wide across all 11 rows with zero mismatches, is terminated by a
    blank line, and "All writes are temp+fsync+rename; all files live inside the ACL-protected
    directory (D10)." now stands as its own paragraph at line 1097 with its subject intact. The
    same scan cleared all seven tables in the document, so the class is closed, not just the
    instance. Closed against the standards originally named — GitHub-Flavored Markdown table
    semantics (cells beyond the header count are discarded; a non-row line immediately following a
    row terminates the table) and the first-principles articulation that a normative durability
    rule must not render without its subject.
  - **R12 F4** (Moderate — D1's "(unchanged rejection)" was Gate C residue leaving an
    element-4 alternative with no reason) — **closed.** D1 lines 270–274 now read "Not TLS in the
    Node process: tailscaled already provisions and terminates TLS for both the serve and funnel
    paths, so in-process TLS would duplicate machinery the overlay owns, add ACME/certificate-
    lifecycle surface to the app's config and startup path, and require a non-loopback bind —
    abandoning the always-127.0.0.1 property this decision is built on." That is a substantive
    multi-limbed rejection reason. The class is closed too: the full-document residue sweep
    (Systemic scan 5) returned three hits, none genuine. Closed against both standards originally
    named — Gate C's "No internal reasoning artifacts, self-corrections, or scratchpad content
    remain in the document," and Phase 10 element 4's requirement that alternatives be "named
    explicitly with the reason each is wrong."
  - **R12 T1** (Tentative, not a finding) — disposed by disclosure rather than by verification;
    see Tentative Findings. Not counted in the flow arithmetic, since a tentative is not a finding.
- **New findings: 3** (Findings 1, 2, 3).
- **Recurring: 0.**
- **Regressions: 0.** The fix-diff's nine hunks were checked against the full-document scans
  rather than inspected in isolation: all seven tables clean, zero config-key orphans, zero
  standards decoration, zero Gate C residue, all 28 decisions five-part complete, all 60
  traceability entries intact, all 14 ASVS chapters dispositioned, all mandatory Clear Thought
  invocations present. Nothing the fixes touched broke anything the prior round had passing.

**Tripwire evaluation — NOT FIRED**, with the arithmetic shown for both conditions.

- *Condition (a): new + regression ≥ closed, for two consecutive post-fix rounds.* **R13: 3 + 0 =
  3 vs 4 closed → 3 ≥ 4 is false.** The condition fails this round, so it cannot hold across two
  consecutive rounds ending here. (For completeness, from round 12's record: R12 was 3 + 0 = 3 vs
  5 closed, also false; R11 satisfied it at 4 + 0 = 4 vs 4 closed. The streak is currently 0.)
- *Condition (b): total findings has not strictly decreased, for two consecutive post-fix rounds.*
  R11: 6. R12: 4 < 6 → decreased. **R13: 3 < 4 → decreased.** The streak is 0. **False.**

Neither condition holds, so the tripwire does not fire and foundational rework is not indicated.
The independent evidence agrees: this is the first round in the tracked trajectory with **zero
Critical, zero Serious, and zero Systemic findings**; the three-round recurrence on D12 is broken;
no regression has appeared in any tracked round; and all three remaining findings are
documentation-accuracy defects that change no design decision and no implementation step.

## Recommended Priority

The tripwire did not fire, so another fix round is the indicated path — not foundational rework.

1. **Finding 1 first, and fix both limbs in both locations.** It is the only finding that touches
   how a reader understands runtime behavior. Scope the `resourceUrn` content claim and the
   `payload.lineageUrn`/`payload.source` fallback claim to the version-event family in **D12
   (lines 686–691) and D11 (lines 646–648)** — a fix applied to only one leaves the other wrong —
   and add the one sentence stating that non-version-event journal entries are reported
   `identity: unresolved` by design rather than by degradation. Leave the envelope-shape claim
   alone; it is correct and correctly evidenced.
2. **Finding 2 next.** Replace D27's four-tool sentence with the enumeration the schema supports
   and mirror it in Limitation 8(b). **Do not touch the tool 6 and tool 7 inventory rows** — both
   were re-derived field by field against the schema this round and are correct; editing them is
   the collateral-damage pattern that has cost this document prior rounds.
3. **Finding 3 last.** One clause. Prefer deleting the derived interval over recomputing it, so
   it cannot go stale on the next date edit.

Nothing in this round calls for re-opening D27's unverified-premise disclosure or Limitation
8(b)'s structure. Both are correct handling of a premise that genuinely cannot be checked while
the credential is cleared, and I verified that blocker independently rather than accepting the
document's word for it.

Verdict: NEEDS FIXES (3 findings: 2 Moderate, 1 Minor)
