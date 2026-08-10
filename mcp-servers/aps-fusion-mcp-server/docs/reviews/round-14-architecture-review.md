# Expert Review — Architecture: APS Fusion MCP Server (Round 14)

## Scope and Inventory

**Round 14** (post-fix; the first review is round 1, the prior completed review is
`docs/reviews/round-13-architecture-review.md`). The inventory is constructed by the post-fix
rule from all four required sources: the prior review's full inventory, the fix-diff files, the
fix-diff files' dependents, and the prior review's findings as closure items.

**Fix-diff.** `git diff HEAD -- docs/architectures/architecture-aps-fusion-mcp-server.md`: one
file, 11 hunks, +73/−48. Because no commit was made between rounds 13 and 14, this diff spans
*both* revisions' edits; the round-14 subset was isolated by extracting the committed baseline
(`git show HEAD:…` → 1483 lines) and comparing it region by region against the working tree
(1508 lines). `git status --short` shows five other modified paths (`package.json`,
`src/constants.ts`, `src/index.ts`, `src/services/aps-auth.ts`, `src/tools/mfg-data-model.ts`);
these are the untouched predecessor's pre-existing working-tree state, not this revision's
product. **Dependents of the fix-diff file:** none exist. The artifact is a markdown design
document, nothing imports it, and the `src/` tree it specifies has not been created. This is
recorded rather than assumed — see the tool plan for why CodeGraph is not the instrument for
that question.

| # | File | Status |
|---|------|--------|
| 1 | `docs/architectures/architecture-aps-fusion-mcp-server.md` | [x] Read in full, 1508 lines (three passes: 1–615, 615–1064, 1063–1508), plus targeted re-Reads at 498–511, 664–679, 714–727 and 1123–1136 at finding-drafting time |
| 2 | `docs/specs/spec-aps-fusion-mcp-server.md` | [x] Read in full, 638 lines |
| 3 | `.claude/skills/expert-architecture/SKILL.md` | [x] Read in full, 581 lines — the authoring contract that produced the artifact and one of its governing standards; the item-by-item conformance check is in Upstream Contract Verification below |
| 4 | `HANDOFF.md` | [x] Read in full, 110 lines |
| 5 | `docs/reviews/round-13-architecture-review.md` | [x] Read in full, 580 lines (prior-round finding list; provenance source only) |
| 6 | `docs/reviews/round-12-architecture-review.md` | [x] Grep-verified — `^\*\*Trajectory\|^\*\*Round:\|Verdict:\|Prior findings closed\|New findings\|Regressions\|Recurring`, 8 matching lines: round 12, trajectory `R9: 6 → R10: 4 → R11: 6 → R12: 4`, closed 5 / new 3 / recurring 1 / regressions 0, verdict `NEEDS FIXES (4 findings: 1 Serious-recurring, 3 Moderate-new)`. Trajectory source only |
| 7 | `docs/aps-mfg-schema.json` | [x] Programmatically introspected via Node against the dump: 209 types; `Query` 21 fields with full argument lists; `Mutation` 45 fields; complete field lists for `Item`, `ItemVersion`, `ComponentVersion`, all four concrete Item types, all four concrete ItemVersion types, `ConfigurationTable`, `ConfigurationRow`, `ItemFilterInput`, `Properties`, `ItemVersions`, `Occurrence(s)`, `PhysicalProperties`, `Thumbnail`, `ComponentVersions`, `DrawingVersions`, `Derivative`, `DerivativeInput`, `Pagination(Input)`; global carrier sweeps for `fusionWebUrl` (6), `tipRootComponentVersion` (1), `tipVersion` (6), `allOccurrences` (1); global `ComponentVersion`-typed field sweep (9); `Item`/`ItemVersion` `possibleTypes` (4 each); enum values for `ItemCompositionEnum`, `OutputFormatEnum`, `ItemTypeEnum` |
| 8 | `package.json` | [x] Read via `require`: `@modelcontextprotocol/sdk ^1.29.0`, `express ^5.2.1`, `zod ^4.3.6`; `version: "1.0.0"` |
| 9 | `package-lock.json` | [x] Verified present, 46,359 bytes |
| 10 | `src/constants.ts` | [x] Read 1–25 — v2 deprecation banner, `/mfg/v3/graphql/public`, ComponentVersion removal at lines 9–11 |
| 11 | `src/index.ts` | [x] Grep + Read 18–26 — routes at :47, :56, :69, :71 with `app.post("/mcp", …)` at :71 and no auth middleware on any route; `version: "1.0.0"` hardcoded at :22 |
| 12 | `src/services/aps-auth.ts` | [x] Read 46–60 and 105–125 — `clearTokens()` at :119 inside `if (!res.ok)` (:110) after the sibling-rotation early return (:114–118); `isAuthenticated()` → `currentTokens() !== null` at :146; `getAuthUrl()` params at :53–59 carry `response_type`/`client_id`/`redirect_uri`/`scope` and no `code_challenge`, no `state` (grep for `code_challenge\|codeChallenge\|state=` across `src/`: **0 hits**) |
| 13 | `src/services/aps-client.ts` | [x] Grep-verified — `export function urnToBase64` at :38 |
| 14 | `src/tools/mfg-data-model.ts` | [x] Grep-verified — `truncateIfNeeded` at :30; `readOnlyHint: true` at :480 and `generate: true` at :497; bare-quote `componentVersionId: "${component_version_id}"` at :590 |
| 15 | `src/tools/model-derivative.ts` | [x] Grep-verified — second, divergent `function truncate` at :9 |
| 16 | `docs/apsq.mjs` | [x] Verified present, 2,927 bytes |
| 17 | `C:/Users/maxco/.aps-fusion-mcp/tokens.json` | [x] Read — 4 bytes, literal string `null`; the credential is cleared |
| 18 | `HEAD:…/architecture-aps-fusion-mcp-server.md` (git object) | [x] Extracted (1483 lines) and diffed region by region against the working tree — **added mid-pass**, required to separate round-14's edits from round-13's and to determine each finding's provenance |
| 19 | commit `063af2e` | [x] `git show --stat` + spec hunks — **added mid-pass**, required to verify the artifact header's claim about the R-REL-7/AC-25 amendment |

**Tool plan (Step 3).** Instruments available and exercised: Read; Grep; Bash/Node (programmatic
GraphQL introspection, a GFM-escape-aware table parser, paragraph-reflowed cross-reference
scans); Context7; Clear Thought; git. Claim-type mapping — absence claims → grep and
programmatic schema queries; literal-content claims → Read at file:line; library- and
vendor-API-behavior claims → Context7 (`/websites/aps_autodesk_en`, `/expressjs/express`,
`/modelcontextprotocol/typescript-sdk`, `/websites/tailscale`); structural/blast-radius claims →
the fix-diff plus the recorded observation that the artifact has no importers;
prior-document claims (round-13's findings, `HANDOFF.md`'s assertions, the document's own premise
slots) → re-derived from current source. **CodeGraph and codebase-RAG were not exercised, and
this is not a verification gap:** every structural question in this review's scope is either an
absence claim or a literal-content claim, which Step 3 assigns to grep/Read rather than
CodeGraph, and the architecture specifies a greenfield `src/` tree that does not yet exist. No
instrument class was unavailable for a load-bearing claim category, so no halt condition arose.

**Rigor waivers.** None. No compression was requested or applied.

**Procedural note.** `collaborativereasoning` rejected its first invocation on enum validation
(`communication.style` accepts only formal/casual/technical/creative;
`communication.tone` only analytical/supportive/challenging/neutral) and succeeded on retry with
valid values. The mandatory multi-perspective check was completed via the tool.

## Summary

**This review returns NEEDS FIXES (3 findings).** All three of round 13's findings are closed
against the standards they originally named, with no regression: the tool-inventory table is
byte-identical to the committed baseline across all 36 rows, so round 13's explicit warning not
to edit the tool 6 and tool 7 rows was honored. The document's external premise surface remains
excellent under independent re-derivation — roughly forty MFG schema assertions re-checked
programmatically against the introspection dump, four Context7 lookups against the vendor and
library references the document names, and ten predecessor-source claims confirmed at file:line,
with zero defects among them. This round's findings come from two checks that prior rounds do
not appear to have run. The first is requirement *satisfaction* as distinct from traceability
*coverage*: counting matrix entries proves the matrix is complete, not that the decisions it
cites do what the requirements demand, and checking all sixty for substance surfaced one
requirement pair whose retrieval limb no tool implements. The second is intra-document
self-consistency: three separate decisions assert agreement with another passage of the same
document that says something different, one of them in a wire contract a planner would implement
directly. Both are design defects, not documentation defects — they change what gets built.

## Upstream Contract Verification

The upstream artifacts are the spec (`docs/specs/spec-aps-fusion-mcp-server.md`) and the
authoring contract (`.claude/skills/expert-architecture/SKILL.md`). The artifact is a design
document, so the spec's acceptance criteria are not executable at this phase; what is checkable
is requirement coverage, requirement *satisfaction*, and contract conformance. All three were
checked, the first two mechanically.

**Spec requirement coverage — PASS.** I counted the spec's requirements independently from its
own text by grep of the `**R-…**` / `S-…` declaration forms: 46 R-numbers (R-DISC 4, R-READ 6,
R-WRITE 4, R-EXPORT 5, R-AUTO 5, R-NOTIFY 3, R-AUTH 1, R-PROTO 6, R-REL 7, R-OPS 5) plus S-1..S-14
= **60**. I then parsed the traceability matrix (document lines 1359–1392) programmatically with
a GFM-escape-aware cell splitter: 5 columns, 32 rows, **60 requirement entries, 60 distinct,
zero duplicates**, set-differencing to zero missing and zero extra against the expected 60. The
document's "60 spec requirements" claim (Goal line 23; Status line 1498) is correct.

**Spec requirement satisfaction — FAIL on one pair.** Coverage of the matrix is not satisfaction
of the requirements it maps, and these are different checks. I walked all 60 requirements against
the decisions and tool rows each is mapped to. Fifty-eight are genuinely satisfied. **R-EXPORT-3
and R-EXPORT-5 are not**, on their retrieval limbs: see Finding 1. R-EXPORT-4 *is* satisfied —
its named artifacts are the object tree and per-object properties, which tools 25 and 26 supply —
and is deliberately excluded from that finding.

**Acceptance criteria.** By set-difference of `AC-[0-9]+` occurrences across both documents, the
spec declares AC-1..AC-27 and the architecture cites 22 of them, never citing AC-1, AC-2, AC-3,
AC-4 or AC-17. That is **not** a contract violation on its own: the authoring contract requires
the traceability matrix to account for every R# and Q#, not every AC, and each of those five ACs
cites requirements that are themselves traced. It is recorded so the reader can audit the gap
rather than discover it. Separately, AC-7 *is* cited (D27's header) and cannot pass against the
design as written — that is Finding 1, not an AC-coverage issue.

**Authoring-contract conformance — checked item by item, mechanically where possible.**

- *Required sections.* All eleven present, by scripted extraction of `^## ` headings: Goal (21),
  Scope (35), Components and structure (54), Quality characteristics (199), Design decisions
  (213), Threat model (1296), ASVS mapping (1337), Traceability (1357), Limitations (1396),
  Standards (1459), Status (1493). Scope carries all three required subsections (In scope :37,
  Deferred with reasoning :44, Out of scope :50). *Inheritance from existing precedents* is
  correctly omitted with its attestation in Status (lines 1502–1503).
- *Five-part decision format.* Scripted per-decision slot check across D1–D28: all 28 decisions
  found, every one carrying all five slots (`**Decision.**`, `**Standard.**`, `**Why here.**`,
  `**Not.**`, `**Premise.**`). Zero gaps.
- *Quality characteristics.* All nine ISO/IEC 25010:2023 characteristics appear in the table
  (lines 201–211), Safety included with its explicit not-addressed reasoning.
- *ASVS.* All fourteen chapters V1–V14 dispositioned across the 12-row mapping table (1342–1355);
  V1/V10/V11 share one row.
- *Mandatory Clear Thought invocations.* All present or explicitly attested, by case-insensitive
  sweep: `metacognitivemonitoring` (:215), `mentalmodel`/`mentalmodel(first_principles)` (:389
  D5, :464 D7, :795 D14, :818 D15, :1108 D24, :1136 D25), `decisionframework` (:276 D1, :307 D2,
  :594 D10), `structuredargumentation` (trace :1260–1284, attestation :1286),
  `Sequentialthinking` (attestation :1254 naming D5/D7/D8), `scientificmethod` (:1299, threat
  model), `collaborativereasoning` (:1246), and `debuggingapproach` attested *not* invoked with
  reasoning (:1290–1294).
- *Gate C structural checklist.* Passes on every mechanical item (see Systemic Patterns for the
  scans). Gate A's reviewer-persona pass condition and Gate B's "answerable from the document
  alone by pointing to a specific section" are the standards Finding 2 engages; the
  deferred-decision trap is the standard Findings 1 and 3 engage.
- *Header claims.* The header's assertion that commit `063af2e` rewrote R-REL-7's crash clause
  and AC-25 was verified by `git show 063af2e -- "*/spec-aps-fusion-mcp-server.md"`: the commit
  touches three files and its spec hunks replace R-REL-7's absolute survival clause with the
  window-minimization-plus-detected-recovery form and rewrite AC-25 to match. The header's
  "PASS after five independent blinded rounds, zero findings" matches `HANDOFF.md`:14.

## Critical & Serious Findings

### Finding 1 — Serious (new). No tool retrieves a Model Derivative translation output, so R-EXPORT-3's and R-EXPORT-5's retrieval limbs are unsatisfied while the traceability matrix and Status section claim complete coverage with zero deferrals

**What the document does now.** The Model Derivative tool group is tools 23–26: `aps_md_translate`
(submit), `aps_md_get_manifest`, `aps_md_get_object_tree`, `aps_md_get_object_properties`. Tool
24's Returns cell (line 161) reads, in full: "translation status + derivative list (bounded: one
version's manifest)". No row anywhere in the 36-tool inventory returns the translated artifact,
a download URL for it, or an expiry. The traceability matrix maps **R-EXPORT-3 → D15 (tools
23–24), D27 (URN contract)** and **R-EXPORT-5 → D14, D15 (submit/status split)** (lines
1377–1379), and the Status section (line 1498) states "the traceability matrix accounts for all
60 spec requirements with zero deferrals."

**How the claim was verified.** Three ways, this round.

- *The document says no such tool exists.* Grep across the artifact for
  `signed URL|signedUrl|download|derivative list|retriev`: **13 hits, none of them an MD
  retrieval path.** The `signed URL` hits are tool 22 (`status + signed URL + expiry when ready`,
  line 159 — the MFG export path), tool 12 (thumbnail, line 149), tool 30 (`output items/signed
  URLs`, line 167 — the Design Automation path), and D22/D23's prose about signed upload/download
  URLs in the Data Management pipeline. The single MD hit is tool 24's "derivative list". This is
  the contrast that makes the omission legible rather than a wording accident: the document says
  "signed URL + expiry" in every place it means one, and does not say it for MD.
- *The vendor API requires a separate call.* Context7 `/websites/aps_autodesk_en`, 2026-07-30
  (Model Derivative v2). `GET /modelderivative/v2/designdata/:urn/manifest` returns
  `derivatives[].children[]` carrying `urn`, `role`, `mime`, `guid`, `type`, `status` — URNs and
  metadata, **no download URL**. Fetching the artifact is a distinct endpoint,
  `GET /modelderivative/v2/designdata/:urn/manifest/:derivativeUrn` (and its `/signedcookies`
  variant), documented as "Retrieves a URL to download a specific derivative file of a translated
  model." So the manifest tool 24 wraps genuinely cannot yield the artifact.
- *The spec demands it.* Read of `docs/specs/spec-aps-fusion-mcp-server.md`: R-EXPORT-3 (line
  212) — "The server SHALL support translation to the additional formats Model Derivative
  provides (IGES, DWG, FBX, IFC, SVF2) **and retrieval of the resulting derivatives**."
  R-EXPORT-5 (line 218) — "Long-running exports SHALL be modeled as asynchronous jobs: submit
  returns a handle; a separate read reports status; **retrieval yields the artifact or a signed
  URL with its expiry surfaced**." AC-7 (line 531) — "Translating a design to an additional Model
  Derivative format (e.g. IGES or SVF2) completes and **the resulting derivative is retrievable**
  (R-EXPORT-3)."

**Which standard it violates.** The authoring contract's Phase 11 Traceability requirement — "a
table mapping every R# and Q# from the input spec to one or more design decisions, OR explicitly
to 'deferred to plan / deferred to maintenance / out of architecture scope' with reasoning. Every
spec requirement is accounted for. No silent omissions." Neither disposition holds here: the
matrix asserts satisfaction, and the Scope section's four listed deferrals (exact GraphQL/REST
bodies; individual Automation job programs; activity-specific argument names; the plan's step
ordering) do not include this. It also engages the deferred-decision trap — the choice of how a
translated derivative reaches the caller has cross-component consequences (a new tool row, an
`md-gateway` method, an `aps-http` cost tag, a D22 egress-allowlist entry for the derivative host)
and is left for the build phase by omission rather than resolved.

**Why it matters.** This is not a citation defect; it is a hole in the delivered capability. The
document's own carving rule in D15 states that "async lifecycles split submit/status/retrieve
(R-EXPORT-5, R-AUTO-2)", and the rule is applied correctly twice and not a third time: Design
Automation gets 28/29/30 (submit/status/retrieve), the MFG export path gets 21/22 where tool 22
carries both status and the signed URL, and Model Derivative gets 23/24 with no retrieve. A
planner working from this document builds tools 23–26 as specified and ships an MD group that can
start a translation and watch it finish but never hand the file back — and AC-7's acceptance run
fails at the last step, after the build. The blast radius also reaches D22: an MD derivative
download URL points at an Autodesk-issued host that the egress allowlist must admit, and
Limitation 8(a) currently scopes the signed-URL host pinning to the Data Management pipeline
only.

**What correct implementation looks like.** Add a retrieval tool to the export group — e.g.
`aps_md_get_derivative`, R-class (the download endpoint is unmetered; Model Derivative meters
translation jobs, which is the basis the inventory already states at lines 126–128), taking the
`version_id` D27 pins plus the derivative URN that tool 24 returns, and returning the signed
download URL with its expiry, exactly as tool 22 does for the MFG path. Update the inventory's
group count (export-tools 6 → 7, total 36 → 37) and the four accounting sentences that depend on
it (the R-class enumeration, the list-returning partition, the 22 + 11 + 3 = 36 reconciliation,
and the 1+6+6+9+6+4+4 file-count sum), map R-EXPORT-3 and R-EXPORT-5 to it in the traceability
matrix, and extend Limitation 8(a)'s signed-URL host pinning to cover the Model Derivative
download host. If instead the owner rules that MD retrieval is out of v1 scope, the disposition
belongs in the Scope section's Deferred list with reasoning and in the traceability rows — but
the Status section's "zero deferrals" claim must then change too. **Do not touch tools 25 and
26**: R-EXPORT-4's named artifacts are the object tree and per-object properties, both rows are
correct, and editing them is the collateral-damage pattern that has cost this document prior
rounds.

**Provenance: new.** Rounds 12 and 13 reported no finding on R-EXPORT coverage; round 13's
upstream-contract check verified the matrix's *entry count* (60 distinct, zero missing) and did
not test whether the cited decisions satisfy the requirements. The text at issue is present
unchanged in the committed baseline (`grep -c "derivative list (bounded"`: 1 in HEAD, 1 in the
working tree; all 36 tool rows byte-identical between the two), so this is neither a regression
nor a product of round 14's edits.

## Systemic Patterns

### Finding 2 — Serious-Systemic (new). Three decisions assert that another passage of this document agrees with them, and in each case it does not

**The pattern.** A decision states a count or a contract and certifies it against another passage
("the same three classes", "identical in tool 34's row", "in every mode"). The referenced passage
says something different. Because the claim of agreement is stated, a reader who checks one side
has no signal to check the other — which is precisely what makes this class survive review.

**The proactive scan (Step 8), run before counting and classifying.** Two passes over the full
inventory scope.

*Pass 1 — regex over paragraph-reflowed text* (the document hard-wraps, so a line-based grep
misses cross-line phrases). Signature:
`the same (one|two|…|ten|\d+)|identical (in|to|across)|(one|two|…|ten)\s+(named|typed|classes|fields|listeners|sources|limbs)|stated (identically|the same)|mirrors?|same (three|two|four)`.
**7 of 81 paragraphs hit**, at lines 56, 136, 228, 494, 664, 836, 1328.

*Pass 2 — manual enumeration and re-derivation of every numeric self-claim the document makes
about its own content*, since a regex finds only what its author suspected. **Approximately
thirty claims checked**, each recomputed from the document or the schema: 60 requirements
(matrix parse: 60/60 distinct ✓); 36 tools (36 rows ✓); group counts 1+6+6+9+6+4+4 = 36 with
every tool assigned exactly once ✓; 20 list-returning rows and 16 single-object rows,
independently classified from each Returns cell ✓; the three-way disposition partition
{2,3,4,5,6,8,10,11,12,26,27,32,35} = 13, {7,13,24,25,30,31} = 6, {34} = 1, summing to 20 ✓; the
R-class costlessness enumeration 13 MFG + 3 MD + 3 DA + 3 Webhooks/DM = 22 ✓; the W-class
partition 5 destructive {13,16,17,19,33} + 6 additive {14,15,18,20,31,36} = 11 with
`idempotentHint` inverted across exactly that partition ✓; 22 + 11 + 3 = 36 ✓; "13 of the 22
R-class tools" ✓; 209 schema types ✓; exactly nine `ComponentVersion`-typed fields ✓;
`fusionWebUrl` on exactly six types ✓; all four concrete Item types ✓; five error classes ✓;
all eight threats ✓; all fourteen ASVS chapters ✓; three residuals ✓; four recorded
metacognitive limitations ✓; 28 decisions ✓; three decisions meeting the sequentialthinking
trigger ✓; two config URLs ✓; three keychain options scored ✓.

**Result: three defective, all sharing one mechanism.** The defect rate on numeric self-claims is
low, but every defect in the population is this same shape, and it spans three separate
decisions — which is what makes it a class rather than three accidents.

**Instance 1 — D12's wire contract says two named fields; three other passages say three.**
*Read at lines 721–724:* "**Wire contract (identical in tool 34's row):** two named fields, not
an opaque composite — the response carries `marker` and, only when truncated, `resume_position`;
the input accepts both, and a caller holding a `resume_position` must pass it back alongside the
marker. Two typed fields rather than a composite token…". *Read at lines 669–670* (D12's own
paragraph (a), 50 lines earlier): "the tool takes an optional `since_sequence` and returns the
highest sequence it emitted as a **third named field** alongside `marker` and `resume_position`."
*Read at line 171* (tool 34's row): "**cursor-paged via three named fields (D12):** the response
returns `marker` …, `sequence` …, and — when `truncated:true` — `resume_position`". *Read at
lines 188–191* (the disposition paragraph): "it takes and returns *named* position fields
(`marker`, `sequence`, `resume_position`)". **The three-field side is correct** and the
"two named fields" sentence is the defect — the `sequence` field is load-bearing, since D12(a)
makes journal selection depend on it and forbids selecting the journal by `marker`.

**Instance 2 — D8 says `/healthz` publishes three auth-state classes; D25 enumerates two.**
*Read at lines 506–508:* "HTTP 200 ⇒ `ok`; 401/403 ⇒ `reauth-required` with the D9 login path;
network/5xx/timeout ⇒ `unknown (transient)` with the credential untouched per (a). D25's
`/healthz` publishes **the same three classes**." *Read at line 1127* (D25's Decision slot):
"auth-state class (`ok` / `reauth-required` — never token material)." **The three-class side is
correct** on the merits — D25's own Why-here slot (lines 1144–1147) says the auth-state class is
"the owner's only passive signal that the M-3-style re-auth condition has recurred", and
collapsing `unknown (transient)` into either of the other two makes an Autodesk outage read as a
revoked credential or vice versa.

**Instance 3 — D1 says two listeners in every mode; D1 then specifies a third.**
*Read at line 231:* "The server binds 127.0.0.1 **in every mode, on two listeners**." *Read at
lines 254–261:* "**Third listener — stdio-mode dev-login aux (fully specified):** **in stdio mode
no HTTP listener above exists**; the process runs ONE auxiliary loopback listener… The
loopback-bind startup assertion covers **all three listeners**." The Components block repeats the
error at lines 57–58: "The process **always** binds **127.0.0.1**, on **two listeners**". **The
third-listener paragraph is correct**; the mode-independent "two listeners" summary is the defect,
and it is wrong in three of the document's own configurations (stdio has one; hosted with
webhooks off has one; `both` mode has two with the aux suppressed per D21 lines 992–994).

**Which standard it violates.** The authoring contract's Gate B pass condition — every question
must be "answerable from the document alone by pointing to a specific section", and "a question
that requires subjective interpretation of the document is a Gate B failure" — together with Gate
A's reviewer persona ("if I had to verify this build against this architecture, would I know what
to look for?"). A contract stated two ways in one document is not answerable; the reader must
adjudicate. It also engages Phase 10 element 5's premise discipline: a claim that passage X agrees
with passage Y is a factual premise about the document itself, and the contract requires premises
to be verified, not asserted.

**Why this is systemic rather than isolated.** The three instances have no common subject — a
polling wire contract, a health endpoint's payload, a listener count — and no common external
source. What they share is the mechanism and therefore the fix: a summary or cross-reference was
written or edited without re-reading the passage it certifies. `HANDOFF.md` (lines 87–90) names
this exact cause as the reason thirteen rounds failed — "Searching for a flagged string, changing
it, and moving on is how a table ends up with a fourth cell, a join key points at a field that
does not exist… Read the section — and after editing, read it again". Fixing three sentences
without running the class check leaves the next instance in place.

**What correct looks like.** Fix each instance on the side named above as defective, leaving the
correct side untouched: replace D12's "two named fields" sentence with the three-field contract
(`marker`, `sequence`, `resume_position`) and drop or correct the "(identical in tool 34's row)"
parenthetical; add `unknown (transient)` to D25's enumerated auth-state classes; and scope D1's
and the Components block's listener counts by mode rather than asserting "in every mode" /
"always". Then run the class check as a class: for every sentence in the document that asserts
agreement with, or a count of, another passage, open that passage and compare. The scan signature
above is a starting point, not the check — pass 2 found what pass 1 missed.

**Provenance: new.** No prior round reported any of the three. All three are present unchanged in
the committed baseline (`grep -c` against `HEAD:…`: "publishes the same three classes" 1/1,
"in every mode, on two listeners" 1/1, "covers all three listeners" 1/1, and the "Wire contract …
two named fields" paragraph at HEAD line 702 verbatim), so none is a regression from round 14's
edits.

**No other systemic patterns** — verified by the scans below, all run across the full inventory
scope.

1. **Markdown table integrity** (Node parse of every table block with GFM-correct escaped-pipe
   and inline-code handling, checking each row's cell count against its header and each block's
   blank-line termination): **7 tables, 0 defective rows, 7/7 blank-terminated.** Tables at
   136–173 (6 cells × 36 rows), 201–211 (4 × 9), 1094–1104 (3 × 9), 1317–1326 (4 × 8), 1342–1355
   (2 × 12), 1359–1392 (5 × 32), 1461–1491 (3 × 29). Round 12's malformed-table class stays
   closed.
2. **Config-key orphans** (`\b[A-Z][A-Z0-9]*(_[A-Z0-9]+)+\b`): 17 distinct SCREAMING_SNAKE
   identifiers, of which 15 are config keys (`O_EXCL` and `AS_SAVED` are not). All 15 —
   `TAILNET_BASE_URL`, `WEBHOOK_PUBLIC_URL`, `MCP_AUTH_TOKEN`, `APS_CALLBACK_URL`,
   `EGRESS_ALLOW_HOSTS`, `DA_OUTPUT_FOLDER_ID`, `SPEND_REQUIRE_CONFIRM`, `MFG_MAX_PAGES`,
   `MFG_SEARCH_MAX_PROJECTS`, `MFG_SEARCH_ROW_LIMIT`, `UPLOAD_MAX_BYTES`, `HTTP_MAX_BODY_BYTES`,
   `DM_POLL_MAX_FOLDERS`, `TOKEN_LOCK_STALE_MS`, `AUTH_VERIFIER_TTL` — are declared in D21
   (lines 980–1010), checked by substring membership in the D21 block. **Zero orphans.**
3. **Standards decoration** (bracketed-tag extraction, body lines 1–1458 against the Standards
   table 1459–end): **15 tags in the body, all 15 present in the table; zero body tags missing
   from the table.** The table's one extra, `[APS-COMMERCIAL]`, is not decoration — the commercial
   model (C4) is what makes the `$` effect class exist, and it demonstrably drives D13's metered
   categories, D14's cost-class carving, the inventory's costlessness-basis prose (lines 123–134),
   and Limitation 11. Every named non-tag standard in the body (ASVS 4.0.3, ISO/IEC 25010:2023,
   SOLID, RFC 9110, Crash-Only, Twelve-Factor §III, Google SRE ch. 22, OWASP Threat Modeling,
   Express 5, Tailscale, pino, zod v4) appears in the table with what it governed.
4. **Gate C authoring residue and deferred-decision phrasing** (case-insensitive sweep for
   `corrected|correction|previously|earlier draft|prior draft|was wrong|initially|superseded|TODO|TBD|FIXME|scratchpad|no longer|as before|still stands|re-stated|now correctly|now states|remains as|in a prior round|last round|this revision`,
   plus a second sweep for
   `left to the (implementer|build|plan)|the implementer will|at implementation time|to be determined|decided later|during implementation|implementer.s choice|refined (later|during)`):
   **2 hits, 0 genuine.** Line 220 ("superseded by the spec's hosted-primary D-1") is the required
   metacognitive baseline naming an anchoring bias against a stale CORE recall, not a note about a
   prior draft; line 1092 ("a defect in this decision, not an implementer's choice") is an
   explicit *anti*-deferral rule.
5. **Verified-premise accuracy sweep against external sources.** Every MFG schema claim
   re-derived programmatically against `docs/aps-mfg-schema.json` (roughly forty assertions, zero
   discrepancies — enumerated in What's Actually Good); four Context7 lookups this round against
   the exact references the document names (Autodesk `dm.version.added` and `dm.operation.started`
   callback references, Express `json` options, SDK `ToolAnnotations`, Tailscale Serve/Funnel
   limitations), all confirming; ten predecessor-source claims confirmed at file:line, all
   correct. **Zero defects in this class this round** — which is why Findings 1 and 2 are the
   findings and no external-premise finding is.

## Moderate & Minor Findings

### Finding 3 — Moderate (new). The JSON body parser's position relative to the bearer gate on `/mcp` is unspecified, leaving pre-authentication buffering of up to ~134 MB undetermined

**What the document says.** The middleware order is enumerated twice and identically, and the
parser is in neither enumeration. *Read at line 65* (Components, `index.ts`): "Mounts middleware
in fixed order (bearer gate → origin check → transport)." *Read at lines 114–116* (the hosted data
flow): "main loopback listener → bearer gate → origin check → per-request transport → tool
handler". *Read at lines 336–344* (D3): "the `/mcp` route mounts `express.json({ limit:
HTTP_MAX_BODY_BYTES })` **ahead of the transport** … This is the real memory ceiling: the
stateless per-request pattern buffers the whole body before the handler runs, so
`UPLOAD_MAX_BYTES` is a post-parse check and the transport limit is what actually bounds resident
bytes. Over-limit requests are rejected by the parser with 413 before any handler or SpendGuard
work." "Ahead of the transport" is satisfied by both `[parser, bearer, origin, transport]` and
`[bearer, origin, parser, transport]`, and nothing in the document distinguishes them.

**How the claim was verified.** Grep across the artifact for
`express\.json|express\.raw|middleware|bearer gate|Middleware`: **20 hits**, listed at lines 24,
65, 73, 75, 115, 292, 313, 317, 322, 324, 326, 336, 344, 561, 607, 634, 652, 660, 661, 1006, 1213,
1319, 1325, 1331, 1339, 1352, 1406. Reading every one: the two order enumerations (65, 115) omit
the parser; D3's mention (336) places it only relative to the transport; D21's mention (1006) and
D28's (1213) describe the limit's derivation, not its position. **No hit states where the parser
sits relative to the bearer gate.** The default value the derivation corrects is confirmed —
Context7 `/expressjs/express`, 2026-07-30: `express.json([options])`, "**limit** (string |
number) - Optional - Request body size limit. **Default: '100kb'**", with the documented per-route
mounting form `app.post('/api/users', express.json(), handler)` showing that the parser's position
in a route's chain is a free choice the design must make.

**Which standard it violates.** The authoring contract's deferred-decision trap — "Is any
non-trivial choice in the architecture left ambiguous for 'the implementer' or 'the build phase'
to resolve when the choice has cross-component consequences? If yes, resolve it now." The
consequence is security-relevant, so this is also measured against the spec's S-1 ("no ambient
authority — reachability SHALL NOT imply authorization") read together with R-REL-5's bounding
discipline, which D28 (lines 1236–1237) explicitly extends to input: "Not unbounded bytes (a
memory-exhaustion path; R-REL-5's bounding discipline applies to input as well as output)."

**Why it matters.** With `UPLOAD_MAX_BYTES` at its documented 100 MB default, D21's derived
`HTTP_MAX_BODY_BYTES` is `ceil(100 MB × 4/3) + 1 MB ≈ 134 MB`. If the parser precedes the gate,
any caller who can open a socket to the served port makes the process buffer up to that much
before the 401 — with no credential. That population is not empty by the document's own reckoning:
D2 (lines 301–305) states "tailnet reachability is exactly that: any process on any tailnet device
can open a socket to the served port", and Limitation 2 (lines 1405–1407) states "a tailnet-wide
compromise reaches the served port, which is why the bearer gate (D2) remains a separate,
mandatory layer." The document is otherwise scrupulous about pinning exactly this kind of
ordering — it pins bearer-before-origin and explains the AC-13 consequence, pins Tailscale's
Serve/Funnel port allocation, pins three startup assertions — which is what makes the omission a
gap rather than a level-of-detail choice. The Goal (line 30) sets the bar the document is being
held to here: "no requirement is satisfied only by 'the handlers all remember to.'"

**What correct implementation looks like.** Put the parser in the enumerated order, in both places
the order appears — Components line 65 and D3's middleware-order paragraph — and state which side
of the gate it sits on with the reason. The defensible resolution is `bearer gate → origin check →
express.json(limit) → transport`, so that unauthenticated requests are rejected before any body is
buffered and the ~134 MB ceiling is reachable only by an authenticated caller; note in D3 that
this places the 413 after the 401, which is the correct precedence and worth stating for the same
reason D3 already states the 401-before-403 interaction with AC-13. The webhook listener needs the
same treatment for `express.raw` in D11, where the HMAC — not a bearer secret — is the gate and
the raw body must necessarily be read first; saying so explicitly keeps the two routes' orderings
from being read as one rule.

**Provenance: new.** No prior round reported it. D3 is not in round 14's fix-diff and the relevant
strings are unchanged from the committed baseline (`grep -c`: "ahead of the transport" 2/2,
"bearer gate → origin check → transport" 1/1), so this is neither a regression nor a product of
this revision.

**No Minor findings** — verified by the five structural scans above (tables, config-key orphans,
standards decoration, Gate C residue, five-part decision slots), the Clear Thought invocation
sweep, and the numeric self-claim enumeration; every defect those scans surfaced is classified at
Moderate or above in Findings 1–3, and no residual style, convention, or optimization defect was
observed.

## Tentative Findings

**No tentative findings** — every candidate finding's premise was verified per Compliance Gate B.
Round 12's tentative T1 (whether MFG `ItemVersion.id` is the Data Management version-URN form) is
**not** carried forward, for the same reason round 13 gave and which I re-derived rather than
imported: D27 (lines 1182–1185) marks the assumption "**not live-verified**" in the decision text
and points to Limitation 8(b), which names the exact closing query (`itemVersions(hubId:, itemId:)`
requesting `results { id versionNumber }` through `docs/apsq.mjs`), the derivation step D27 would
need if it fails, and the fact that AC-7's foreign-CAD path is unaffected. I verified the *stated
blocker* independently rather than accepting it: `docs/apsq.mjs` is present (2,927 bytes) and
`C:/Users/maxco/.aps-fusion-mcp/tokens.json` contains the literal 4-byte string `null`, so the
credential is cleared and no live APS call is possible from this repo. Under the authoring
contract, "claims that couldn't be verified with available tools" is the declared purpose of the
Limitations section, and D27 states a complete, implementable contract. This is correct handling
of an unverifiable premise and should not be re-opened.

## Observations

- The introspection dump's top-level object carries only `queryType` and `types` — there is no
  `mutationType` pointer (verified: `Object.keys(root)` returns exactly `queryType,types`).
  `Mutation` is nonetheless present as a type with 45 fields, and all eight mutations the
  architecture names (`createFolder`, `renameFolder`, `moveFolder`, `copyFolder`, `deleteFolder`,
  `createDesignFromFile`, `setProperties`, `createPropertyDefinition` plus the collection
  mutations) exist on it. This affects no claim the architecture makes; it is worth knowing before
  the build introspects this file, because a tool resolving mutations through `mutationType` will
  find none.
- `HANDOFF.md` line 75 states that "MFG became a priced API on 2026-08-17" in the past tense, for
  a date eighteen days in the future. `HANDOFF.md` is not the artifact under review; recorded
  because it is on this review's inventory and a reader may consult it. The architecture's own
  Limitation 11 now states the date without a derived interval, which is round 13's Finding 3
  correctly closed.
- The spec file's `Status:` line still reads "Draft for review" (verified at
  `docs/specs/spec-aps-fusion-mcp-server.md`:3) while `HANDOFF.md`:14 records a five-round PASS.
  The architecture header discloses exactly this discrepancy and declines to resolve it, which is
  the correct handling of governance metadata the architecture does not own.

## What's Actually Good

- **The D5 type-located field enumeration survives independent programmatic re-derivation at full
  density.** I re-checked every claim by script against `docs/aps-mfg-schema.json` rather than by
  eye: the `Item` interface carries exactly the twelve fields named "and nothing else"
  (id/hub/project/parentFolder/name/createdOn/createdBy/lastModifiedOn/lastModifiedBy/
  extensionType/mimeType/size); `tipVersion` and `versions` exist on all four concrete Item types,
  each typed to the matching concrete ItemVersion, and those four are exactly
  `ItemVersion.possibleTypes`; `tipRootComponentVersion` is borne by `DesignItem` and by nothing
  else in the schema (global sweep: 1 carrier); the `ItemVersion` interface carries
  `versionNumber`/`createdOn`/`lastModifiedOn` at interface level, making tool 35's field list
  interface-safe; `ComponentVersion` carries partNumber/partDescription/materialName/isMilestone/
  lastModifiedOn+By/createdBy and has **no** `versionNumber` and **no** `createdOn`;
  `DesignItemVersion` and `ConfiguredDesignItemVersion` both carry versionNumber+createdOn and both
  expose `item:` typed to their concrete Item, which is what makes tool 12's two `fusionWebUrl`
  traversals resolve; `fusionWebUrl` is present on exactly the six types named and absent from
  `ComponentVersion`; the schema has exactly nine `ComponentVersion`-typed fields with
  `ConfigurationRow.rootConfigurationMember` among them; `ConfigurationTable.rows` is
  `[ConfigurationRow]!` with zero arguments, confirming the "API-unpaginated, so the bound is
  tool-level" claim; and `ItemFilterInput` carries only `name` and `itemType`, confirming D7's and
  D12's "no server-side changed-since filter" reasoning. Roughly forty checks, zero discrepancies.
  By the authoring contract's Phase 10 element-5 standard this is what a verified premise slot is
  supposed to look like, and a slot that survives re-derivation at this density is rare.
- **D14's annotation matrix rests on correctly-read SDK defaults, and the semantic scoping is
  right too.** Context7 `/modelcontextprotocol/typescript-sdk`, 2026-07-30, `ToolAnnotationsSchema`
  in `packages/core/src/schemas.ts` and the `ToolAnnotations` interface: `readOnlyHint` defaults
  **false**, `destructiveHint` defaults **true**, `idempotentHint` defaults **false**,
  `openWorldHint` defaults **true**; both `destructiveHint` and `idempotentHint` are documented as
  "meaningful only when `readOnlyHint == false`". D14's inference follows exactly — W-class tools
  must set `destructiveHint` explicitly because the permissive value is the default, idempotent
  tools must set `idempotentHint:true` explicitly, and the R-class annotation set correctly
  declares only `readOnlyHint:true, openWorldHint:true` rather than padding it with hints the
  spec calls meaningless. Getting a default backwards here is the classic silent failure of
  truthful-annotation requirements (spec R-PROTO-4); this one is right in both directions.
- **D1's Tailscale premise matches the vendor documentation verbatim, including the failure mode
  it exists to prevent.** Context7 `/websites/tailscale`, 2026-07-30: Serve's Limitations page
  states "The same port number cannot be simultaneously used for Tailscale Serve (private) and
  Tailscale Funnel (public and private). If `serve` was the most recent command, the port is
  private. If `funnel` was the most recent command, the port is public," and Funnel's requirements
  page confirms it "can only listen on ports 443, 8443, and 10000" over TLS. D1 quotes the rule,
  derives the consequence that matters (a `funnel` command against Serve's port would silently
  flip the entire MCP surface public), pins the allocation to prevent it (Serve 443, Funnel 8443),
  and adds a startup assertion that the two config URLs do not resolve to the same host:port.
  Naming a vendor's last-command-wins semantic as a security-relevant hazard and designing the
  configuration so it cannot fire is [OWASP-SSRF]-adjacent surface minimization done properly.
- **D18's safe/cost type-pairing is grounded in a verified counterexample rather than an
  abstraction.** The schema confirms `ComponentVersion.derivatives(derivativeInput:
  DerivativeInput!): [Derivative]` with `DerivativeInput{outputFormat: [OutputFormatEnum],
  generate: Boolean}` and `OutputFormatEnum` = STEP, STL, OBJ — a billable job submission reachable
  entirely through the *query* half of the schema, with no mutation involved. That makes "GraphQL's
  query/mutation split is a schema-authoring convention, not a safety guarantee" a verified fact
  about this specific API rather than a general caution, and it correctly justifies drawing the
  retry boundary on the (safe, cost) pair instead of on RFC 9110 §9.2.2's method contract alone.
  The predecessor's `readOnlyHint: true` sitting over `generate: true` — confirmed in the same tool
  definition at `src/tools/mfg-data-model.ts`:480 and :497 — is exactly the defect this closes.
- **The tool inventory's completeness accounting reconciles under independent recomputation.** I
  parsed all 36 rows and classified each from its Returns column myself rather than from the
  document's summary: 20 list-returning, 16 single-object. The three-way disposition partition is
  exact and every member correctly assigned: cursor-paged {2,3,4,5,6,8,10,11,12,26,27,32,35} = 13,
  bounded-single-response {7,13,24,25,30,31} = 6, merged-source resumable {34} = 1, summing to 20.
  The R-class costlessness enumeration reconciles (13 MFG-backed + 3 MD + 3 DA + 3 Webhooks/DM =
  22), as does the W-class annotation partition (5 destructive + 6 additive = 11, with
  `idempotentHint` inverted across exactly that partition), and 22 + 11 + 3 = 36; the seven group
  file counts (1+6+6+9+6+4+4) also sum to 36 with every tool assigned exactly once. Against
  [MCP-TOOLS]' schema-and-annotation discipline and spec R-DISC-4's explicit-completeness
  requirement, this is a contract a reviewer can mechanically diff against `tools/list` — which is
  what AC-16 asks for. (Finding 1 adds a tool to this inventory; the accounting is currently
  internally consistent and will need recomputing when it does.)

## Convergence Record

**Round:** 14 (post-fix), matching Scope and Inventory.

**Trajectory:** R9: 6 → R10: 4 → R11: 6 → R12: 4 → R13: 3 → **R14: 3**. The R9–R12 counts come
from round 12's own Convergence Record (grep-verified at `docs/reviews/round-12-architecture-review.md`:148);
R13's from round 13's verdict line (:580); rounds 1–8 are not present in this repository, so the
trajectory is recorded from R9 forward. R14's count is this review's own mechanical breakdown.

**Flow counts for R14** (every closure re-derived from current source against the standard the
original finding named, never from round 13's assertion):

- **Prior findings closed: 3 of 3.**
  - **R13 F1** (Moderate — D12 and D11 generalized the version-event callback shape to all Data
    Management events) — **closed, both limbs, in both locations.** D12 lines 686–703 now state
    that `resourceUrn`'s content "is event-family-specific", name the `dm.version.*` version URN
    and `dm.operation.started`'s folder URN, scope the `(itemId, versionId)` normalization and the
    cross-source join to "the **version-event family only**", scope the
    `payload.lineageUrn`/`payload.source` fallbacks the same way, and add the sentence round 13
    asked for: for non-version events the `identity: unresolved` flag is "the **normal, by-design
    state**, not degradation". D11 lines 644–649 carry the identical scoping, so the two cannot
    drift. *Verification:* Context7 `/websites/aps_autodesk_en`, 2026-07-30, two lookups against
    the two references the document names. `dm.version.added` returns
    `resourceUrn: "urn:adsk.wipprod:fs.file:vf.0zvdp3CoTzWDcZC_wL0kJA?version=1"` with
    `payload.lineageUrn: "urn:adsk.wipprod:dm.lineage:0zvdp3CoTzWDcZC_wL0kJA"` (shared opaque
    suffix, which is what makes the normalization work) and `payload.source` identical to
    `resourceUrn`. `dm.operation.started` returns the identical envelope
    `{version, resourceUrn, hook, payload}` with the same `x-adsk-delivery-id` / `x-adsk-signature`
    headers, but `resourceUrn: "urn:adsk.wipprod:fs.folder:co.HGJKYimOQomuJU1E1tSmfg"` — a folder
    URN — and a payload of `userInfo, progress, startTime, operationName, state, message, errors,
    sourceResource, eventContext, tenant`, carrying **neither `lineageUrn` nor `source`**. Every
    limb of the correction matches its cited source. Closed against the standard originally named
    (Phase 10 element 5 plus Gate B auditability).
  - **R13 F2** (Moderate — D27's four-tool enumeration was wrong for two of the four tools, and
    Limitation 8(b) repeated it) — **closed, and mirrored.** D27 lines 1176–1182 now enumerate per
    tool: tools 5 and 35 return `ItemVersion` ids, tool 6 only on its `ConfiguredDesignItem`
    branch with its `DesignItem` branch returning "`tipRootComponentVersion.id`, a
    `ComponentVersion` id" and Basic/Drawing branches returning item ids only, and tool 7 "returns
    no version id, so a caller holding a tool 6 or tool 7 result reaches an `ItemVersion` id
    through tool 35." Limitation 8(b) lines 1428–1431 mirror it. *Verification:* programmatic
    introspection — all four `tipVersion` fields are typed to the four concrete ItemVersion types,
    which are exactly `ItemVersion.possibleTypes`; `Query.itemVersions(hubId:ID!, itemId:ID!,
    pagination:PaginationInput): ItemVersions` with `ItemVersions.results: [ItemVersion]!`;
    `DesignItem.tipRootComponentVersion: ComponentVersion`, an OBJECT absent from
    `ItemVersion.possibleTypes`; tool 7's row returns only the `ComponentVersion`-typed
    `rootComponentVersionId`. **And the correction was applied without collateral damage** — round
    13 warned specifically not to edit the tool 6 and 7 inventory rows; diffing all 36 tool rows
    against the committed baseline returns **0 differences**. Closed against the standard
    originally named (Phase 10 element 5's "(schema-verified)" marker).
  - **R13 F3** (Minor — Limitation 11's "twenty days" was eighteen days from the header date) —
    **closed by deletion**, which is the fix round 13 preferred over recomputation. Line 1451 now
    reads "**MFG Data Model becomes a priced API on 2026-08-17** (C4)." with the derived interval
    removed; `grep -c "twenty days"` and `grep -c "days after this document"` both return **0** in
    the working tree (1 in HEAD). Closed against the standard originally named (Gate C's "File
    paths and external references are confirmed, not assumed" read with Phase 10's premise
    discipline).
- **New findings: 3** (Findings 1, 2, 3). All three are present unchanged in the committed
  baseline, confirmed by `grep -c` on their load-bearing strings against `HEAD:…` — so all three
  are newly *surfaced*, not newly *introduced*.
- **Recurring: 0.**
- **Regressions: 0.** The revision's hunks were checked against full-document scans rather than
  inspected in isolation: all 7 tables clean and blank-terminated, zero config-key orphans, zero
  standards decoration, zero Gate C residue, all 28 decisions five-part complete, all 60
  traceability entries intact and distinct, all 14 ASVS chapters dispositioned, all 9 ISO 25010
  characteristics present, all mandatory Clear Thought invocations present or attested, and all 36
  tool rows byte-identical to the baseline. Nothing the fixes touched broke anything a prior round
  had passing.

**Tripwire evaluation — NOT FIRED**, with the arithmetic shown for both conditions. Both
conditions hold *this* round for the first time in the tracked trajectory, so both streaks now
stand at one; neither reaches the two-consecutive-round threshold.

- *Condition (a): new + regression ≥ closed, for two consecutive post-fix rounds.* **R14: 3 + 0 =
  3 vs 3 closed → 3 ≥ 3 is TRUE.** R13: 3 + 0 = 3 vs 4 closed → 3 ≥ 4 is false. The streak is
  **1 of 2**. Does not fire.
- *Condition (b): total findings has not strictly decreased, for two consecutive post-fix rounds.*
  **R14: 3 vs R13's 3 → 3 < 3 is false, so it did not strictly decrease → TRUE.** R13: 3 < 4 →
  decreased, so false. The streak is **1 of 2**. Does not fire.

Neither condition reaches two consecutive rounds, so the tripwire does not fire and foundational
rework is not mechanically indicated. Two things temper that, and both belong in the record. The
first is arithmetic: the tripwire is now armed on both conditions simultaneously, and round 15
fires it unless it both closes more findings than it opens *and* returns a total strictly below
three. The second is qualitative and is the more useful signal. Every finding in rounds 9 through
13 was an external-premise or document-integrity defect — a schema field, a library citation, a
malformed table, a stale arithmetic figure. This round's external-premise sweep came back
**clean**, and both Serious findings are internal: a spec requirement whose retrieval limb no
component implements, and a document that contradicts itself in three places. That is not the
fix cycle churning on the same axis; it is the first round to test two axes the cycle was not
testing — requirement satisfaction as distinct from traceability coverage, and intra-document
self-consistency. Counting matrix entries proves the matrix is complete; it does not prove the
decisions satisfy the requirements, and only the first check had been run.

## Recommended Priority

The tripwire did not fire, so another fix round is the indicated path — not foundational rework.
The finding count held flat rather than falling, but the composition changed decisively: zero
external-premise defects for the first time in the tracked trajectory, with the residue now
concentrated in design substance.

1. **Finding 1 first — it is the only finding that changes what gets built.** Resolve the Model
   Derivative retrieval gap by adding the retrieval tool (or, if the owner rules it out of v1
   scope, by moving it to the Scope section's Deferred list and correcting the Status section's
   "zero deferrals" claim). Whichever path is taken, the four inventory accounting sentences and
   the R-EXPORT-3/R-EXPORT-5 traceability rows move with it, and Limitation 8(a)'s signed-URL host
   pinning extends to the Model Derivative download host. **Do not edit the tool 25 and 26 rows** —
   R-EXPORT-4 is satisfied and they are correct.
2. **Finding 2 second, and fix it as a class, not as three strings.** Each instance names which
   side is correct; edit only the defective side. Then run the class check over every sentence in
   the document that asserts a count of, or agreement with, another passage — the regex in the
   scan is a starting point, and the manual enumeration is what found what the regex missed. A
   fix applied to the three named sentences without the class pass leaves the mechanism in place,
   which is the specific failure `HANDOFF.md` identifies as the cause of thirteen rounds.
3. **Finding 3 last.** Add the body parser to the enumerated middleware order in both places the
   order appears, state which side of the bearer gate it sits on and why, and give the webhook
   listener's `express.raw` the same explicit treatment in D11 so the two orderings are not read
   as one rule.

Nothing in this round calls for re-opening D27's unverified-premise disclosure or Limitation
8(b)'s structure. Both remain correct handling of a premise that genuinely cannot be checked while
the credential is cleared, and I verified that blocker independently rather than accepting the
document's word for it.

Verdict: NEEDS FIXES (3 findings: 1 Serious, 1 Serious-Systemic spanning 3 enumerated instances, 1 Moderate)
