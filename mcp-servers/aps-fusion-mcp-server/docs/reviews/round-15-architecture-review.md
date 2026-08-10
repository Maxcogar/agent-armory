# Expert Review — Architecture: APS Fusion MCP Server (Round 15)

## Scope and Inventory

**Round 15** (post-fix; the first review is round 1, the prior completed review is
`docs/reviews/round-14-architecture-review.md`). The inventory is constructed by the post-fix rule
from all four required sources: the prior review's full inventory, the fix-diff files, the
fix-diff files' dependents, and the prior review's findings as closure items.

**Fix-diff.** `git diff HEAD -- docs/architectures/architecture-aps-fusion-mcp-server.md`: one
file, +130/−80. No commit has been made since before round 13, so this diff spans the edits of
rounds 13, 14 *and* 15 against a committed baseline of 1,482 lines; the working tree is 1,532
lines. Round 15's own edits were isolated two ways: by extracting the baseline
(`git show HEAD:./docs/…` → 1,482 lines) and comparing region by region, and by testing each of
round 14's three findings against the baseline text it quoted. `git status --short` lists five
other modified paths (`package.json`, `src/constants.ts`, `src/index.ts`,
`src/services/aps-auth.ts`, `src/tools/mfg-data-model.ts`); these are the untouched predecessor's
pre-existing working-tree state, not this revision's product. **Dependents of the fix-diff file:**
none exist. The artifact is a markdown design document, nothing imports it, and the `src/` tree it
specifies has not been created. This is recorded rather than assumed — see the tool plan.

| # | File | Status |
|---|------|--------|
| 1 | `docs/architectures/architecture-aps-fusion-mcp-server.md` | [x] Read in full, 1,532 lines (three passes: 1–613, 613–1063, 1062–1532), plus targeted re-Reads at 1193–1232 and 340–356 at finding-drafting time |
| 2 | `docs/specs/spec-aps-fusion-mcp-server.md` | [x] Read in full, 638 lines |
| 3 | `.claude/skills/expert-architecture/SKILL.md` | [x] Read in full, 581 lines — the authoring contract that produced the artifact and one of its governing standards; item-by-item conformance is in Upstream Contract Verification |
| 4 | `HANDOFF.md` | [x] Grep-verified — 110 lines; line 14's five-round-PASS record and lines 87–90's stated cause of the failed rounds cross-checked against the artifact header |
| 5 | `docs/reviews/round-14-architecture-review.md` | [x] Read in full, 676 lines (prior-round finding list; provenance source only) |
| 6 | `docs/reviews/round-13-architecture-review.md` | [x] Grep-verified — `^\*\*Trajectory\|^\*\*Round:\|^Verdict:`, 3 matching lines: round 13, trajectory `R9: 6 → R10: 4 → R11: 6 → R12: 4 → R13: 3`, verdict `NEEDS FIXES (3 findings: 2 Moderate, 1 Minor)`. Trajectory source only |
| 7 | `docs/reviews/round-12-architecture-review.md` | [x] Grep-verified — same pattern, 3 matching lines: round 12, trajectory `R9: 6 → R10: 4 → R11: 6 → R12: 4`, verdict `NEEDS FIXES (4 findings…)`. Trajectory source only |
| 8 | `docs/aps-mfg-schema.json` | [x] Programmatically introspected via Node against the dump: 209 types; `Query` 21 fields with full argument lists; `Mutation` 45 fields; complete field lists for `Item`, `ItemVersion`, `ComponentVersion`, all four concrete Item types, `DesignItemVersion`, `ConfiguredDesignItemVersion`, `ConfigurationTable`, `ConfigurationRow`, `ItemFilterInput`, `Properties`, `ItemVersions`, `DerivativeInput`, `Derivative`; global carrier sweeps for `fusionWebUrl` (6), `tipRootComponentVersion` (1), `tipVersion` (6), `allOccurrences` (1), `tipConfigurationTable` (1), `designItemVersion` (3), `configuredDesignItemVersion` (2); global `ComponentVersion`-typed field sweep (9); `Item`/`ItemVersion` `possibleTypes` (4 each); enum values for `ItemCompositionEnum`, `OutputFormatEnum` |
| 9 | `package.json` | [x] Read via `require`: `@modelcontextprotocol/sdk ^1.29.0`, `express ^5.2.1`, `zod ^4.3.6`; `version: "1.0.0"` |
| 10 | `package-lock.json` | [x] Verified present, 46,359 bytes |
| 11 | `src/constants.ts` | [x] Grep + Read — v2 "will be deprecated soon" banner, `/mfg/v3/graphql/public`, ComponentVersion removal at lines 9–10 |
| 12 | `src/index.ts` | [x] Grep-verified — routes at :47, :56, :58, :69 with `app.post("/mcp", …)` at :71 and no auth middleware on any route; `version: "1.0.0"` hardcoded at :22 |
| 13 | `src/services/aps-auth.ts` | [x] Grep-verified — `clearTokens()` defined :38 and called :119 in the refresh failure path; `isAuthenticated()` → `currentTokens() !== null` at :145–146; grep for `code_challenge\|codeChallenge` across `src/`: **0 hits** |
| 14 | `src/services/aps-client.ts` | [x] Grep-verified — `export function urnToBase64` at :38 |
| 15 | `src/tools/mfg-data-model.ts` | [x] Grep-verified — `truncateIfNeeded` at :30; `readOnlyHint: true` at :480 with `generate: true` at :497 in the same tool; bare-quote `componentVersionId: "${component_version_id}"` at :590 |
| 16 | `src/tools/model-derivative.ts` | [x] Grep-verified — second, divergent `function truncate` at :9 |
| 17 | `docs/apsq.mjs` | [x] Verified present, 2,927 bytes |
| 18 | `C:/Users/maxco/.aps-fusion-mcp/tokens.json` | [x] Read — literal `null`; the credential is cleared, so no live APS call is possible from this repo |
| 19 | `HEAD:…/architecture-aps-fusion-mcp-server.md` (git object) | [x] Extracted (1,482 lines) and compared region by region and row by row against the working tree — **added mid-pass**, required to determine each finding's provenance and to test for collateral damage in the tool inventory |

**Tool plan (Step 3).** Instruments available and exercised: Read; Grep; Bash/Node (programmatic
GraphQL introspection, a GFM-escape-aware markdown table parser, a paragraph-reflowing
cross-reference scanner, a cross-reference integrity checker); Context7; Clear Thought; git.
Claim-type mapping — absence claims → grep and programmatic schema queries; literal-content
claims → Read at file:line; library- and vendor-API-behavior claims → Context7
(`/websites/aps_autodesk_en`, `/colinhacks/zod`, `/expressjs/express`); structural and
blast-radius claims → the fix-diff plus the recorded observation that the artifact has no
importers; prior-document claims (round 14's findings, `HANDOFF.md`'s assertions, the document's
own premise slots) → re-derived from current source. **CodeGraph and codebase-RAG were not
exercised, and this is not a verification gap:** every structural question in this review's scope
is either an absence claim or a literal-content claim, which Step 3 assigns to grep/Read rather
than CodeGraph, and the architecture specifies a greenfield `src/` tree that does not yet exist.
No instrument class was unavailable for a load-bearing claim category, so no halt condition arose.

**Rigor waivers.** None. No compression was requested or applied.

## Summary

**This review returns NEEDS FIXES (1 finding).** All three of round 14's findings are closed
against the standards they originally named, and the largest of them — adding a Model Derivative
retrieval tool — was applied with zero collateral damage: all 36 pre-existing inventory rows are
byte-identical to the committed baseline, and every accounting surface that moves with a tool
addition (the group file counts, the R-class costlessness enumeration, the list/single partition,
the traceability rows, the Standards table) reconciles under independent recomputation. The
document's external premise surface came back clean for the second consecutive round: roughly
forty MFG schema assertions re-derived programmatically, three fresh Context7 lookups against the
vendor and library references the document names, and ten predecessor-source claims confirmed at
file:line, with zero defects among them. The single finding sits exactly at the seam this round's
fix created. Tool 37 was integrated into every *accounting* surface but not into D27, the decision
that governs Model Derivative input validation: D27 still enumerates "Tools 23–26", and tool 37's
second path-bound input has no stated grammar anywhere in the document — while D27's own rule
rejects precisely that input shape. It is a fix-induced regression, not a pre-existing defect, and
it is confined to one decision's body.

## Upstream Contract Verification

The upstream artifacts are the spec (`docs/specs/spec-aps-fusion-mcp-server.md`) and the authoring
contract (`.claude/skills/expert-architecture/SKILL.md`). The artifact is a design document, so
the spec's acceptance criteria are not executable at this phase; what is checkable is requirement
coverage, requirement *satisfaction*, and contract conformance. All three were checked, the first
two mechanically.

**Spec requirement coverage — PASS.** I counted the spec's requirements independently from its own
declaration forms: 46 R-numbers by grep of `^- \*\*R-…\*\*` (R-DISC 4, R-READ 6, R-WRITE 4,
R-EXPORT 5, R-AUTO 5, R-NOTIFY 3, R-AUTH 1, R-PROTO 6, R-REL 7, R-OPS 5) plus 14 S-numbers by grep
of `^- \*\*S-[0-9]+ ` = **60**. I then parsed the traceability matrix (document lines 1382–1415)
programmatically with a GFM-escape-aware cell splitter: 5 columns, 32 rows, **60 requirement
entries, 60 distinct, zero duplicates, zero empty decision cells**, set-differencing to zero
missing and zero extra against the expected 60. The document's "60 spec requirements" claim (Goal
line 23; Status line 1523) is correct.

**Spec requirement satisfaction — PASS.** Coverage of the matrix is not satisfaction of the
requirements it maps, and round 14 demonstrated the difference. I walked all 60 against the
decisions and tool rows each is mapped to. All 60 are satisfied, including the pair round 14
failed. **R-EXPORT-3** ("translation to the additional formats Model Derivative provides … *and
retrieval of the resulting derivatives*") and **R-EXPORT-5** ("retrieval yields the artifact or a
signed URL with its expiry surfaced") now have a retrieval limb: tool 37 `aps_md_get_derivative`
(line 177) returns the signed download URL, its cookies, size, content type and expiry. AC-7's
acceptance path is now runnable end-to-end — tool 36 uploads a foreign CAD file through D23's DM
pipeline, tool 23 translates, tool 24 yields the derivative URN, tool 37 retrieves. *Verification
of the backing capability:* Context7 `/websites/aps_autodesk_en`, 2026-07-30 —
`GET /modelderivative/v2/designdata/{urn}/manifest/{derivativeUrn}/signedcookies` returns exactly
`{etag, size, url, content-type, expiration}` with the CloudFront signed cookies as `Set-Cookie`
headers, cookies valid six hours; and the plain
`GET …/manifest/{derivativeUrn}` variant is documented as deprecated in favour of it. The
document's premise slot (line 854) and Standards row (line 1497) cite this correctly.

**Acceptance criteria.** By set-difference of `AC-[0-9]+` occurrences across both documents, the
spec declares AC-1..AC-27 and the architecture cites 22 of them, never citing AC-1, AC-2, AC-3,
AC-4 or AC-17 — unchanged from round 14. That is **not** a contract violation: the authoring
contract requires the traceability matrix to account for every R# and Q#, not every AC, and each
of those five ACs cites requirements that are themselves traced. Recorded so the reader can audit
the gap rather than discover it.

**Cross-reference integrity — PASS, checked mechanically.** Every `D#` reference in the document
resolves to one of the 28 decisions actually defined (28 defined, 28 referenced, zero dangling),
including inside all seven tables. Every `R-…`, `S-…`, `AC-…`, `C#`, `T#`, and spec `D-#`
identifier cited in the architecture exists in the spec (46, 14, 22, 8, 8, 7 respectively; zero
invented).

**Authoring-contract conformance — checked item by item, mechanically where possible.**

- *Required sections.* All eleven present, by scripted extraction of `^## ` headings: Goal (21),
  Scope (35), Components and structure (54), Quality characteristics (203), Design decisions (217),
  Threat model (1319), ASVS mapping (1360), Traceability (1380), Limitations (1419), Standards
  (1484), Status (1518). Scope carries all three required subsections (In scope :37, Deferred with
  reasoning :44, Out of scope :50). *Inheritance from existing precedents* is correctly omitted
  with its attestation in Status.
- *Five-part decision format.* Scripted per-decision slot check across D1–D28: all 28 found, every
  one carrying all five slots (`**Decision.**`, `**Standard.**`, `**Why here.**`, `**Not.**`,
  `**Premise.**`). Zero gaps.
- *Quality characteristics.* All nine ISO/IEC 25010:2023 characteristics appear in the table
  (205–215), Safety included with its explicit not-addressed reasoning.
- *ASVS.* All fourteen chapters V1–V14 dispositioned across the 12-row mapping table (1365–1378);
  V1/V10/V11 share one row.
- *Mandatory Clear Thought invocations.* All present or explicitly attested, by case-insensitive
  sweep: `metacognitivemonitoring` (:219), `mentalmodel`/`mentalmodel(first_principles)` (:402,
  :477, :814, :837, :1130, :1159), `decisionframework` (:285, :316, :607, :1281),
  `structuredargumentation` (trace :1283, attestation :1309), `sequentialthinking` (attestation
  :1277 naming D5/D7/D8), `scientificmethod` (:1322, threat model), `collaborativereasoning`
  (:1269), and `debuggingapproach` attested *not* invoked with reasoning (:1313).
- *Gate C structural checklist.* Passes on every mechanical item (see Systemic Patterns for the
  scans). The deferred-decision trap is the standard Finding 1 engages.
- *Header claims.* The header's disclosure that the spec's own `Status:` line still reads "Draft
  for review" is confirmed (`docs/specs/spec-aps-fusion-mcp-server.md`:3), and its
  characterisation of commit `063af2e` matches round 14's independent verification of that commit.

## Critical & Serious Findings

### Finding 1 — Serious (regression). Tool 37 was added to every accounting surface but not to D27, the decision that governs Model Derivative input validation: D27 still enumerates "Tools 23–26", and tool 37's `derivative_urn` has no stated grammar anywhere in the document

**What the document does now.** This round closed round 14's Serious finding by adding tool 37
`aps_md_get_derivative` (line 177), whose Inputs cell reads: "`version_id` (D27), `derivative_urn`
(a derivative's URN from tool 24's manifest listing)". Four separate passages place tool 37 inside
D27's contract:

- the tool row itself cites **`version_id` (D27)**;
- the traceability matrix maps **R-EXPORT-3 → "D15 (tools 23–24, 37), D27 (URN contract)"** (line
  1400);
- the Standards table binds **[APS-MODELDERIVATIVE] → "D15 (tools 23–26 and 37 capability set…),
  D27 (URN contract)"** (line 1497);
- the threat-model table maps **T5 crafted arguments → "URN grammar validation (D27)"** (line
  1346).

D27 itself says something narrower. Its Decision slot opens (line 1196): "**Decision.** Tools
23–26 take `version_id` — a Data Management version id in URN form
(`urn:adsk.wip…:fs.file:vf.…?version=N`), validated at the `md-gateway` boundary by a zod pattern
on that URN grammar". It closes the same slot (line 1212): "whose `version_id` feeds tools 23–26 —
making the MD tool group reachable end-to-end". Tool 37 appears in neither enumeration, and
nowhere else in D27.

The second limb is the substantive one. `derivative_urn` — tool 37's *other* input, and the one
that enters the REST path as `…/manifest/:derivativeUrn/signedcookies` — has **no grammar, no
validation point, and no governing decision anywhere in the document.** D27, which exists
precisely to supply that for the sibling parameter, states as its own rule (lines 1208–1209):
"Raw pre-encoded base64 URNs from callers are rejected (they would be an unvalidatable opaque
string flowing into a REST path)", and rejects as an alternative (line 1219) "Not caller-supplied
opaque base64 URNs (unvalidatable at the boundary; S-10 hole; usability cliff — no other tool
emits one)." Its Why-here slot (lines 1216–1218) states the goal the whole decision serves: "the
`urn` would be the one caller string entering a URL path without a grammar." Tool 37 makes that
sentence false — there are now two such strings, and only one has a grammar.

**How the claim was verified.** Four ways, this round.

- *D27's enumerations.* Read of `docs/architectures/architecture-aps-fusion-mcp-server.md`:1193–1232
  at finding-drafting time. Lines 1196 and 1212 quoted above verbatim.
- *`derivative_urn` is ungoverned.* Grep across the full artifact for `derivative_urn|derivativeUrn`:
  **3 hits, at lines 177, 854 and 1497** — the tool row, D15's premise slot describing the
  endpoint, and the Standards table row. **None of the three states a validation grammar or a
  validation point**, and no hit falls inside any decision's Decision slot. The nearest general
  rules do not close it: D6 (line 451) supplies encoding, not a grammar — "go through
  `encodeURIComponent`; query strings through `URLSearchParams`" — and the inventory header (line
  137) promises only that "All tools declare full zod input schemas", which gives the parameter a
  *type*. D27's whole premise is that a type is not sufficient for a URN-shaped string entering a
  REST path.
- *The input really is the shape D27 rejects.* Context7 `/websites/aps_autodesk_en`, 2026-07-30
  (Model Derivative v2): the derivative URN carried in the manifest's `derivatives[].children[].urn`
  and passed to the `signedcookies` endpoint has the form
  `urn:adsk.viewing:fs.file:<URL-safe base64 blob>/output/<guid>/<filename>` — verified in both the
  worked manifest example and the reference cURL invocation. It is literally a caller-supplied,
  pre-encoded base64 URN flowing into a REST path: the exact construct D27's Decision and Not slots
  reject.
- *Provenance.* `grep -c "Tools 23–26 take"` returns **1 in `HEAD` and 1 in the working tree**, and
  `grep -c "feeds tools 23–26"` likewise **1 and 1** — D27's text is byte-identical to the
  committed baseline, where it was correct. `grep -c "aps_md_get_derivative"` returns **0 in `HEAD`
  and 1 in the working tree**. The enumeration did not change; the world it described did.

**Which standard it violates.** The authoring contract's **deferred-decision trap** — "Is any
non-trivial choice in the architecture left ambiguous for 'the implementer' or 'the build phase' to
resolve when the choice has cross-component consequences? If yes, resolve it now." The grammar for
`derivative_urn` determines the `md-gateway` boundary schema and is security-relevant, so it is not
the implementer's call. Measured also against the spec's **S-8** ("Tool arguments SHALL be
validated at the boundary — types, ranges, formats — before use, treating the model as an untrusted
input source") and **S-10 / AC-23** (input-influenced path segments constrained before use), and
against the authoring contract's **Gate B** pass condition, which requires every non-trivial
decision's scope to be "answerable from the document alone by pointing to a specific section" — a
reader asking "does D27's URN contract cover tool 37?" gets *yes* from four passages and *no* from
D27 itself.

**Why it matters.** A planner reads D27 as the contract for MD inputs, because four passages route
them there. D27 tells the planner to build a zod URN-grammar validator for tools 23–26. Tool 37 is
outside that instruction, so its `version_id` may ship without the grammar its own row promises,
and its `derivative_urn` has no grammar to ship at all — the implementer either invents one inline
(the trap) or types it `z.string()` and moves on (the S-8 violation). The blast radius is bounded
but real: the request goes to the allowlisted `developer.api.autodesk.com` host so D22 contains the
SSRF surface, and D6's `encodeURIComponent` prevents structural injection — but note that the
vendor's own reference invocation carries the derivative URN with **literal unencoded slashes and
colons**, so D6's blanket encoding rule and this endpoint's path grammar interact in a way the
document nowhere addresses. That interaction is exactly the kind of thing D27 exists to settle.

**What correct implementation looks like.** Confine the edit to **D27's body**. Extend both
enumerations to include tool 37 — line 1196's "Tools 23–26 take `version_id`" and line 1212's
"whose `version_id` feeds tools 23–26" — and add to D27 a stated contract for `derivative_urn`:
its grammar (the `urn:adsk.viewing:fs.file:<base64>/output/<guid>/<filename>` form confirmed
above), its validation point (the same `md-gateway` boundary), and how it is composed into the
path given that the vendor's form is not fully percent-encoded. If the resolution is instead that
`derivative_urn` is accepted only as an opaque value echoed back from tool 24's manifest, D27 must
say that and reconcile it with its own "raw pre-encoded base64 URNs from callers are rejected"
rule, which currently forbids it. **Do not edit tool 37's row, the traceability matrix, the
Standards table, or the threat-model row** — all four are correct, and they are the passages that
establish what D27 should say.

**Provenance: regression.** Introduced by this round's fix. D27's text is unchanged from the
committed baseline (greps above), tool 37 did not exist there, and no prior round reported either
limb.

## Systemic Patterns

**No systemic patterns** — verified by the scans below, all run across the full inventory scope
before counting or classifying. Finding 1 belongs to the class round 14 named Systemic (a passage's
enumeration disagreeing with the passages that cite it), and I ran that class check as a class
rather than assuming the named-and-fixed class was clean. It surfaced **exactly one** instance.
Under the Step 8 proactive-scan rule, systemic classification requires two or more observed
instances; extrapolating a pattern from a single instance is the failure that rule exists to
prevent. Finding 1 is therefore Serious, not Systemic.

1. **Self-referential agreement and cross-reference claims** (the round-14 class). Two passes over
   the full document. *Pass 1 — regex over paragraph-reflowed text* (the document hard-wraps, so a
   line-based grep misses cross-line phrases): signature
   `the same N|identical (in|to|across)|stated (identically|the same)|mirrors?|states the same|as (stated|specified) (in|above|below)|carries the identical|both (locations|places)|in every mode|always binds|exactly the (same|one|two|three)`.
   **7 of 81 paragraphs hit**, at lines 56, 232, 298, 465, 681, 788, 1328. Each was opened against
   the passage it certifies: line 56 and line 232 (listener sets — now mode-scoped, and consistent
   with each other and with D21); line 298 (D2's "every mode that serves HTTP" — consistent with
   D21's precise definition of HTTP-serving); line 681 (D12's "tool 34's row states the same
   three-field contract" — tool 34's row at line 174 does state three); lines 465 and 788 are false
   positives on the word "repeat"; line 1328 is the threat model's control-composition claim, which
   holds. **Zero defects.** *Pass 2 — manual enumeration and re-derivation of every numeric
   self-claim the document makes about its own content*, since a regex finds only what its author
   suspected: **14 paragraphs carrying roughly thirty claims**, each recomputed (results in the next
   two scans and in What's Actually Good). **Zero defects.** The one instance of the class this
   round is Finding 1, which pass 2 surfaced by walking D27 against the four passages that cite it.
2. **Tool-inventory accounting** (Node parse of all 37 rows, each classified independently from its
   own Class and Returns cells before comparing to the document's prose). Numbering contiguous
   1..37 ✓. Effect classes **R = 23, W = 11, $ = 3, summing to 37** — matching the document's
   enumeration exactly (MFG-backed 13 {2–12, 22, 35} + Model Derivative 4 {24, 25, 26, 37} + Design
   Automation 3 {27, 29, 30} + Webhooks/DM 3 {1, 32, 34} = 23; the stated not-R-class set
   {13–20, 21, 23, 28, 31, 33, 36} = 14; 23 + 14 = 37). W partition **5 destructive {13, 16, 17,
   19, 33} + 6 additive {14, 15, 18, 20, 31, 36} = 11**, with `idempotentHint` inverted across
   exactly that partition ✓. List/single partition independently classified from each Returns cell:
   **20 list-returning, 17 single** — and the document's three-way disposition sets (cursor-paged
   {2,3,4,5,6,8,10,11,12,26,27,32,35} = 13, bounded-single-response {7,13,24,25,30,31} = 6,
   merged-source resumable {34} = 1) union to precisely my 20 with no member misassigned. Group
   file counts **1+6+6+9+7+4+4 = 37** with every tool assigned exactly once and no duplicates.
   `grep` for stale `36` returns **zero** residual counts. **Zero defects.**
3. **Collateral-damage check on the fix** (row-by-row comparison of every inventory row against the
   committed baseline): **36 baseline rows, 37 working-tree rows, 0 of the 36 differing, 1 added.**
   Round 14's explicit instruction not to edit tools 25 and 26 was honored, and so was every other
   row.
4. **Markdown table integrity** (Node parse of every table block with GFM-correct escaped-pipe and
   inline-code handling, checking each row's cell count against its header and each block's
   blank-line termination): **7 tables, 0 defective rows, 7/7 blank-terminated.** Tables at 139–177
   (6 × 37), 205–215 (4 × 9), 1116–1126 (3 × 9), 1340–1349 (4 × 8), 1365–1378 (2 × 12), 1382–1415
   (5 × 32), 1486–1516 (3 × 29). Round 12's malformed-table class stays closed.
5. **Config-key orphans** (`\b[A-Z][A-Z0-9]*(_[A-Z0-9]+)+\b`): 17 distinct SCREAMING_SNAKE
   identifiers, of which 15 are config keys (`O_EXCL` and `AS_SAVED` are not). All 15 are declared
   in D21's block (lines 1002–1061), checked by substring membership. **Zero orphans.**
6. **Standards decoration** (bracketed-tag extraction, body against the Standards table): **15 tags
   in the body, all 15 present in the table; zero body tags missing.** The table's one extra,
   `[APS-COMMERCIAL]`, is not decoration — it demonstrably drives D13's metered categories, D14's
   cost-class carving, the inventory's costlessness prose, and Limitation 11. Every named non-tag
   standard in the body (ASVS 4.0.3, ISO/IEC 25010:2023, SOLID, RFC 9110, Crash-Only, Twelve-Factor
   §III, Google SRE ch. 22, OWASP Threat Modeling, Express 5, Tailscale, pino, zod v4) appears in
   the table with what it governed.
7. **Gate C authoring residue and deferred-decision phrasing** (case-insensitive sweep for
   `corrected|correction|previously|earlier draft|prior draft|was wrong|initially|superseded|TODO|TBD|FIXME|scratchpad|no longer|as before|still stands|re-stated|now correctly|now states|remains as|in a prior round|last round|this revision`,
   plus a second sweep for
   `left to the (implementer|build|plan)|the implementer will|at implementation time|to be determined|decided later|during implementation|implementer.s choice|refined (later|during)|pinned at implementation`):
   **3 hits, 0 genuine.** Line 224 ("superseded by the spec's hosted-primary D-1") is the required
   metacognitive baseline naming an anchoring bias; line 1114 ("a defect in this decision, not an
   implementer's choice") is an explicit *anti*-deferral rule; line 1450 (signed-URL host patterns
   "pinned exactly at implementation") sits in the Limitations section, which the authoring
   contract designates as the home for exactly such acknowledged gaps, and is bounded by
   `EGRESS_ALLOW_HOSTS` being config rather than code.

## Moderate & Minor Findings

**No Moderate or Minor findings** — verified by the seven scans above (self-referential claims,
inventory accounting, collateral damage, table integrity, config-key orphans, standards decoration,
Gate C residue), the cross-reference integrity check (zero dangling `D#` references, zero invented
spec identifiers), the five-part decision-slot check across all 28 decisions, the Clear Thought
invocation sweep, and the requirement-satisfaction walk across all 60 requirements. Every defect
those checks surfaced is the single Serious finding above; no residual style, convention, or
optimization defect was observed.

## Tentative Findings

**No tentative findings** — every candidate finding's premise was verified per Compliance Gate B.
Round 12's tentative T1 (whether MFG `ItemVersion.id` is the Data Management version-URN form) is
**not** carried forward, and I re-derived that disposition rather than importing it. D27 (lines
1205–1208) marks the assumption "**not live-verified**" in the decision text and points to
Limitation 8(b), which names the exact closing query (`itemVersions(hubId:, itemId:)` requesting
`results { id versionNumber }` through `docs/apsq.mjs`), the derivation step D27 would need if it
fails, and the fact that AC-7's foreign-CAD path is unaffected. I verified the *stated blocker*
independently rather than accepting it: `docs/apsq.mjs` is present (2,927 bytes) and
`C:/Users/maxco/.aps-fusion-mcp/tokens.json` contains the literal string `null`, so the credential
is cleared and no live APS call is possible from this repo. The introspected schema types
`ItemVersion.id` as `ID!` and carries no format information, confirming the schema cannot settle
it either. Under the authoring contract, "claims that couldn't be verified with available tools" is
the declared purpose of the Limitations section, and D27 states a complete, implementable contract
around the assumption. This is correct handling of an unverifiable premise and should not be
re-opened.

## Observations

- The introspection dump's top-level object carries only `data` and `extensions`, and the schema
  body exposes `queryType` and `types` with no `mutationType` pointer. `Mutation` is nonetheless
  present as a type with 45 fields, and all eight mutations the architecture names (`createFolder`,
  `renameFolder`, `moveFolder`, `copyFolder`, `deleteFolder`, `createDesignFromFile`,
  `setProperties`, `createPropertyDefinition`) exist on it. This affects no claim the architecture
  makes; it is worth knowing before the build introspects this file, because a tool resolving
  mutations through `mutationType` will find none. (Recorded by round 14 as well; independently
  re-derived here.)
- The spec file's `Status:` line still reads "Draft for review" (verified at
  `docs/specs/spec-aps-fusion-mcp-server.md`:3) while `HANDOFF.md`:14 records a five-round PASS. The
  architecture header discloses exactly this discrepancy and declines to resolve it, which is the
  correct handling of governance metadata the architecture does not own.
- The artifact header states that the R-REL-7 / AC-25 spec amendment "has not itself been reviewed
  — it owes its own review round." That remains true; this review evaluated the architecture
  against the amended spec text as the architecture declares, and did not review the amendment.

## What's Actually Good

- **The D5 type-located field enumeration survives independent programmatic re-derivation at full
  density.** I re-checked every claim by script against `docs/aps-mfg-schema.json` rather than by
  eye: 209 types; the `Item` interface carries exactly the twelve fields named "and nothing else"
  (id/hub/project/parentFolder/name/createdOn/createdBy/lastModifiedOn/lastModifiedBy/extensionType/
  mimeType/size); `tipVersion` and `versions` exist on all four concrete Item types, and those four
  are exactly `Item.possibleTypes`; `tipRootComponentVersion` is borne by `DesignItem` and by
  nothing else in the schema (global sweep: 1 carrier); the `ItemVersion` interface carries
  `versionNumber`/`createdOn`/`lastModifiedOn` at interface level, making tool 35's field list
  interface-safe; `ComponentVersion` carries partNumber/partDescription/materialName/isMilestone/
  lastModifiedOn+By/createdBy and has **no** `versionNumber` and **no** `createdOn`;
  `DesignItemVersion` and `ConfiguredDesignItemVersion` both carry versionNumber+createdOn and both
  expose `item:` typed to their concrete Item, which is what makes tool 12's two `fusionWebUrl`
  traversals resolve; `fusionWebUrl` is present on exactly the six types named and absent from
  `ComponentVersion`; the schema has exactly nine `ComponentVersion`-typed fields with
  `ConfigurationRow.rootConfigurationMember` among them; `ConfigurationTable.rows` takes zero
  arguments, confirming the "API-unpaginated, so the bound is tool-level" claim; `ItemFilterInput`
  carries only `name` and `itemType`, confirming D7's and D12's "no server-side changed-since
  filter" reasoning; `Query.item` really does take `composition: ItemCompositionEnum` with values
  WORKING/RELEASED/AS_SAVED/LATEST (R-READ-6); `itemsByFolder(hubId, folderId, filter, pagination)`
  really does take no project id, which is what tool 5's row asserts; and `OutputFormatEnum` is
  exactly STEP, STL, OBJ. Roughly forty checks, zero discrepancies. By the authoring contract's
  Phase 10 element-5 standard this is what a verified premise slot is supposed to look like, and a
  slot that survives re-derivation at this density across two independent review rounds is rare.
- **D19's zod premise is precise to the file path, and the distinction it draws is the correct
  one.** Context7 `/colinhacks/zod`, 2026-07-30. The v4 API reference
  (`packages/docs/content/api.mdx`) carries the sentence "When merging object schemas, prefer
  `A.extend(B)` over intersections" — and it appears under **Intersections**, concerning
  `z.intersection`, exactly as D19 (lines 977–980) states. The `unknownKeys`/catchall inheritance
  semantics of `.merge()` — "The resulting schema also inherits the 'unknownKeys' policy and
  catchall schema from the second object" — appear in `packages/docs-v3/home.md`, the **v3**
  reference, again exactly as D19 states. The conclusion follows: an inheritance rule that can
  silently change a composed schema's strictness is the wrong foundation for D19's
  schema-legal-by-construction guarantee. The standard this is good by is the authoring contract's
  Gate C item "Every Context7-verified claim cites what was verified and when" read with Phase 10
  element 5 — and this slot exceeds it, because it cites the correct *file* for each half of a
  two-version argument rather than the library alone. Getting a doc-version boundary right is the
  difference between a verified premise and a plausible one, and a premise that survives
  independent re-derivation of both halves is rare.
- **The `HTTP_MAX_BODY_BYTES` derivation rests on a correctly-read Express default, and the
  ordering fix put the parser on the right side of the gate.** Context7 `/expressjs/express`,
  2026-07-30: `express.json([options])` — "**limit** (string | number) - Optional - Request body
  size limit. **Default: '100kb'**", and the documented per-route form
  `app.post('/api/users', express.json(), handler)` confirms the parser's position in a route chain
  is a design choice the architecture must make. D3 (lines 345–356) now makes it: the parser mounts
  "**after the bearer gate and Origin check, ahead of the transport**", with the consequence stated
  — an unauthenticated request is 401'd before a body byte is buffered, so the ~134 MB ceiling is
  reachable only by an authenticated caller, and the 413 correctly ranks after the 401. D11 (lines
  620–625) gives the webhook route the opposite treatment explicitly, with the reason (the HMAC over
  the body *is* that route's authentication, so the body must be read first) and its own 1 MB bound.
  The standard this is good by is the authoring contract's deferred-decision trap read with the
  spec's S-1 ("no ambient authority — reachability SHALL NOT imply authorization"): a
  cross-component, security-relevant ordering choice is resolved in the document with its
  consequence stated, rather than left to the implementer. Naming why two routes in one server
  order their parsers differently is what keeps the pair from being read as one rule.
- **Every predecessor-source claim in the premise slots is confirmed at file:line.** Ten checks,
  all correct: the v2 deprecation banner, `/mfg/v3/graphql/public`, and ComponentVersion removal at
  `src/constants.ts`:9–10 (D5); `app.post("/mcp", …)` at `src/index.ts`:71 with no auth middleware
  on any route, and the hardcoded version at :22 (D1/D2/D4/D21); `clearTokens()` called at
  `src/services/aps-auth.ts`:119 in the refresh failure path and `isAuthenticated()` returning
  `currentTokens() !== null` at :145–146 (D8, R-AUTH-1's origin); zero hits for
  `code_challenge|codeChallenge` across `src/`, confirming the predecessor's PKCE absence (D9); the
  two divergent truncation implementations at `src/tools/mfg-data-model.ts`:30 and
  `src/tools/model-derivative.ts`:9 (D19, R-REL-5's origin); `readOnlyHint: true` at :480 sitting
  over `generate: true` at :497 in the same tool definition (D14/D18, R-EXPORT-2's origin); the
  bare-quote `componentVersionId: "${component_version_id}"` at :590 (D6, S-7's origin); and
  `urnToBase64` at `src/services/aps-client.ts`:38 (D27). The document uses each as defect evidence
  rather than as precedent, which is what M-1/M-2 require.
- **The fix was applied without collateral damage, which this document's history makes worth
  saying.** A tool addition touches the group file counts, four accounting sentences, the
  traceability matrix, the Standards table, a Limitation, and a component description. All of them
  moved; all 36 pre-existing inventory rows stayed byte-identical to the baseline; no stale `36`
  survives anywhere. Against the authoring contract's Gate C mechanical checklist, and given that
  round 14 recorded collateral damage as the pattern that had cost this document prior rounds, this
  round's edit discipline is a genuine improvement — the one defect is an omission at the new
  seam, not breakage at an old one.

## Convergence Record

**Round:** 15 (post-fix), matching Scope and Inventory.

**Trajectory:** R9: 6 → R10: 4 → R11: 6 → R12: 4 → R13: 3 → R14: 3 → **R15: 1**. The R9–R12 counts
are grep-verified from round 12's own Convergence Record
(`docs/reviews/round-12-architecture-review.md`:148); R13's from round 13's verdict line (:580);
R14's from round 14's verdict line (:675). Rounds 1–8 are not present in this repository, so the
trajectory is recorded from R9 forward. R15's count is this review's own mechanical breakdown.

**Flow counts for R15** (every closure re-derived from current source against the standard the
original finding named, never from the fix author's assertion):

- **Prior findings closed: 3 of 3.**
  - **R14 F1** (Serious — no tool retrieved a Model Derivative translation output, leaving
    R-EXPORT-3's and R-EXPORT-5's retrieval limbs unsatisfied) — **closed.** Tool 37
    `aps_md_get_derivative` exists at line 177, R-class, taking the `version_id` D27 pins plus the
    derivative URN tool 24 returns, and returning the signed download URL, its cookies, size,
    content type and expiry. *Verification:* Context7 `/websites/aps_autodesk_en`, 2026-07-30 —
    `GET …/designdata/{urn}/manifest/{derivativeUrn}/signedcookies` returns exactly
    `{etag, size, url, content-type, expiration}` plus CloudFront signed cookies as `Set-Cookie`
    headers, and the non-`signedcookies` variant is documented as deprecated in favour of it, so
    the tool wraps the right endpoint. The accounting propagated completely: export-tools 6 → 7,
    total 36 → 37, MD reads {24, 25, 26} → {24, 25, 26, 37}, single-object rows 16 → 17,
    `md-gateway.ts`'s description, D15's premise, the Standards row, and traceability rows
    R-EXPORT-3 and R-EXPORT-5 — all recomputed independently and reconciling. Limitation 8(a) now
    resolves the egress question the finding raised, by construction rather than by allowlist
    entry: the server returns the download URL and never fetches it, so its only outbound call is
    the signed-cookies request to the already-allowlisted API host. Closed against the standard
    originally named (the authoring contract's Phase 11 traceability requirement — no silent
    omissions — plus the deferred-decision trap).
  - **R14 F2** (Serious-Systemic — three decisions asserting agreement with passages that said
    something different) — **closed, all three instances, on the side round 14 named correct.**
    *Instance 1:* D12's wire contract (lines 738–744) now reads "three named fields" and enumerates
    `marker`, `sequence`, and `resume_position`, agreeing with D12(a) at lines 686–689, tool 34's
    row at line 174, and the disposition paragraph at lines 192–196 — verified by reading all four.
    *Instance 2:* D25 (lines 1147–1149) now enumerates "`ok` / `reauth-required` /
    `unknown (transient)` — the three D8 classes", agreeing with D8's claim at lines 519–521.
    *Instance 3:* D1 (line 235) and the Components block (lines 56–60) now both read "the listener
    set is mode-dependent" instead of asserting two listeners in every mode, and the loopback
    assertion (lines 268–270) now reads "every listener the process starts (main, webhook, and
    stdio aux)". Closed against the standard originally named (Gate B's answerable-from-the-document
    condition with Phase 10 element 5's premise discipline). Round 14 also demanded the *class*
    check; I ran it independently in two passes over all 81 paragraphs and it surfaced exactly one
    instance — Finding 1, at a location this round created.
  - **R14 F3** (Moderate — the JSON body parser's position relative to the bearer gate was
    unspecified) — **closed, in all three places the order appears, plus the webhook counterpart.**
    Components line 66–67: "bearer gate → origin check → JSON body parser → transport (D3)". Data
    flow line 118: "bearer gate → origin check → JSON body parser → per-request transport". D3
    lines 345–348: parser mounts "after the bearer gate and Origin check, ahead of the transport",
    with the 401-before-413 precedence stated. D11 lines 620–625 add the deliberate contrast for
    `express.raw` on the webhook listener, with its 1 MB bound. *Verification:* Read of all four
    passages plus Context7 `/expressjs/express`, 2026-07-30, confirming the `'100kb'` default the
    derivation corrects and the per-route mounting form. Closed against the standard originally
    named (the deferred-decision trap read with S-1 and R-REL-5's bounding discipline).
- **New findings: 0.**
- **Regressions: 1** (Finding 1) — introduced by this round's fix, confirmed by greps showing
  D27's text byte-identical to `HEAD` while tool 37 is absent from `HEAD` and present in the
  working tree.
- **Recurring: 0.**

**Tripwire evaluation — NOT FIRED**, with the arithmetic shown for both conditions. Both conditions
were armed at one round entering this review; both streaks break here and reset to zero.

- *Condition (a): new + regression ≥ closed, for two consecutive post-fix rounds.* **R15: 0 + 1 = 1
  vs 3 closed → 1 ≥ 3 is FALSE.** R14: 3 + 0 = 3 vs 3 closed → TRUE (streak was 1 of 2). The streak
  is broken and resets to **0**. Does not fire.
- *Condition (b): total findings has not strictly decreased, for two consecutive post-fix rounds.*
  **R15: 1 vs R14's 3 → 1 < 3 is TRUE, so it did strictly decrease → the condition is FALSE.** R14:
  3 vs 3 → had not decreased → TRUE (streak was 1 of 2). The streak is broken and resets to **0**.
  Does not fire.

Neither condition holds, so the tripwire does not fire and foundational rework is not indicated.
The qualitative signal supports the arithmetic. Rounds 9 through 13 were dominated by
external-premise and document-integrity defects — a schema field, a library citation, a malformed
table, a stale arithmetic figure. Round 14 found none of those and reported two internal defects
instead. This round found none of either: the external-premise sweep is clean for the second
consecutive round, the intra-document self-consistency class is clean at its three named instances,
and requirement satisfaction is complete across all 60. The one remaining defect is narrower than
anything in the tracked trajectory — not that the document contradicts itself or misreads a source,
but that it did not extend one of its own contracts to the tool the fix added. That is a
late-stage, localized failure, and the finding count fell by two thirds.

## Recommended Priority

Another fix round is the indicated path, and it is a small one — a single decision's body.

1. **Finding 1 is the only finding.** Extend D27 to cover tool 37, on both limbs: the two
   enumerations at lines 1196 and 1212, and — the substantive half — a stated grammar and
   validation point for `derivative_urn`, including how the vendor's partially-unencoded URN form
   composes into the request path under D6's `encodeURIComponent` rule. **Edit D27's body only.**
   Tool 37's row (line 177), the traceability matrix (line 1400), the Standards table (line 1497),
   and the threat-model row (line 1346) are all correct; they are what establishes the contract
   D27 should be stating, and editing them would invert the fix.
2. **Then run the class check over this round's own edits, not only over the document.** This
   regression is the exact failure round 14 warned about, displaced by one step: the fix author ran
   the cross-reference class check over the document and closed all three named instances, but did
   not run it over the passage the fix itself created. The rule that closes the gap is mechanical —
   after adding or renaming anything the document enumerates, grep for every enumeration and every
   citation of the decision that governs it, open each, and confirm it still holds. `HANDOFF.md`
   lines 87–90 already name the underlying discipline ("Read the section — and after editing, read
   it again"); what this round shows is that it has to extend to the passages the edit makes stale,
   not just the passage edited.

Nothing in this round calls for re-opening D27's unverified-premise disclosure or Limitation 8(b)'s
structure. Both remain correct handling of a premise that genuinely cannot be checked while the
credential is cleared, and I verified that blocker independently rather than accepting the
document's word for it. Tools 25 and 26 remain correct and should not be touched.

Verdict: NEEDS FIXES (1 finding: 1 Serious-regression)
