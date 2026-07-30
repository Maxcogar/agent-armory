# Expert Review — Architecture: APS Fusion MCP Server (Round 16)

## Scope and Inventory

**Round 16** (post-fix; the first review is round 1, the prior completed review is
`docs/reviews/round-15-architecture-review.md`). The inventory is constructed by the post-fix rule
from all four required sources: the prior review's full inventory, the fix-diff files, the
fix-diff files' dependents, and the prior review's findings as closure items.

**Fix-diff.** `git diff HEAD -- docs/architectures/architecture-aps-fusion-mcp-server.md`: one
file, +165/−88. No commit has been made since before round 13, so that diff spans the edits of
rounds 13 through 16 against a committed baseline (`HEAD` = `f1e58a9`) of 1,482 lines; the working
tree is 1,559 lines. **Round 16's own edit was isolated by direct region comparison:** I extracted
the baseline (`git show HEAD:./docs/…`) and diffed its D27+D28 block (baseline lines 1153–1219)
against the working tree's (lines 1193–1292). The result is exact — this round rewrote D27's
Decision slot (adding tool 37 to both enumerations, a `derivative_urn` grammar, a
recompute-and-match binding, and a path-composition rule), extended D27's Why-here and Premise
slots, and rewrote one sentence of D28. Provenance greps confirm the new text is this round's:
`segment-wise` 0 in `HEAD` / 3 in the working tree; `recompute-and-match` 0 / 2;
`urn:adsk.viewing` 0 / 4; `deliberate exception to D6` 0 / 1; `Tools 23–26 and 37 take` 0 / 1.
`git status --short` lists five other modified paths (`package.json`, `src/constants.ts`,
`src/index.ts`, `src/services/aps-auth.ts`, `src/tools/mfg-data-model.ts`); these are the
untouched predecessor's pre-existing working-tree state, not this revision's product.
**Dependents of the fix-diff file:** none exist. The artifact is a markdown design document,
nothing imports it, and the `src/` tree it specifies has not been created. This is recorded rather
than assumed — see the tool plan.

| # | File | Status |
|---|------|--------|
| 1 | `docs/architectures/architecture-aps-fusion-mcp-server.md` | [x] Read in full, 1,559 lines (three passes: 1–620, 620–1069, 1069–1559), plus targeted re-Reads at 1193–1216, 447–452, 1367–1381 and 1409–1442 at finding-drafting time |
| 2 | `docs/specs/spec-aps-fusion-mcp-server.md` | [x] Read in full, 638 lines |
| 3 | `.claude/skills/expert-architecture/SKILL.md` | [x] Read in full, 581 lines — the authoring contract that produced the artifact and one of its governing standards; item-by-item conformance is in Upstream Contract Verification |
| 4 | `HANDOFF.md` | [x] Grep-verified — line 14's five-round-zero-findings record read and cross-checked against the artifact header's characterisation |
| 5 | `docs/reviews/round-15-architecture-review.md` | [x] Read in full, 551 lines (prior-round finding list and closure items; provenance source only) |
| 6 | `docs/reviews/round-14-architecture-review.md` | [x] Grep-verified — `^\*\*Trajectory\|^\*\*Round:\|^Verdict:\|^### Finding`, round 14, trajectory `R9: 6 → R10: 4 → R11: 6 → R12: 4 → R13: 3 → R14: 3`, verdict `NEEDS FIXES (3 findings…)`, three finding headers enumerated. Trajectory and provenance source only |
| 7 | `docs/reviews/round-13-architecture-review.md` | [x] Grep-verified — same patterns: round 13, trajectory through `R13: 3`, verdict `NEEDS FIXES (3 findings: 2 Moderate, 1 Minor)`, three finding headers enumerated |
| 8 | `docs/reviews/round-12-architecture-review.md` | [x] Grep-verified — round 12, trajectory `R9: 6 → R10: 4 → R11: 6 → R12: 4` (:148), verdict `NEEDS FIXES (4 findings…)` (:177). Trajectory source only |
| 9 | `docs/aps-mfg-schema.json` | [x] Programmatically introspected via Node: 209 types; `Query` 21 fields with full argument lists; `Mutation` 45 fields; complete field lists for `Item`, `ItemVersion`, `ComponentVersion`, all four concrete Item types, `DesignItemVersion`, `ConfiguredDesignItemVersion`, `ItemFilterInput`, `Properties`, `ItemVersions`, `DerivativeInput`; global carrier sweeps for `fusionWebUrl` (6) and `tipRootComponentVersion` (1); global `ComponentVersion`-typed field sweep (9); `Item`/`ItemVersion` `possibleTypes` (4 each); `ConfigurationTable.rows` argument list (0); enum values for `ItemCompositionEnum` and `OutputFormatEnum`; full signatures for `item`, `itemsByFolder`, `itemsByProject`, `foldersByProject`, `foldersByFolderInHub`, `itemVersions`, `componentVersion` |
| 10 | `package.json` | [x] Read via `require`: `@modelcontextprotocol/sdk ^1.29.0`, `express ^5.2.1`, `zod ^4.3.6`; `version: "1.0.0"` |
| 11 | `package-lock.json` | [x] Verified present, 46,359 bytes |
| 12 | `src/constants.ts` | [x] Grep-verified — v2 "will be deprecated soon" banner, `/mfg/v3/graphql/public`, ComponentVersion removal at lines 9–10 |
| 13 | `src/index.ts` | [x] Grep-verified — `app.post("/mcp", …)` at :71 with `app.use(express.json())` at :45 and no auth middleware on any route; `version: "1.0.0"` hardcoded at :22 |
| 14 | `src/services/aps-auth.ts` | [x] Grep-verified — `clearTokens()` defined :38 and called :119 in the refresh failure path; `isAuthenticated()` → `currentTokens() !== null` at :145–146; grep for `code_challenge\|codeChallenge` across `src/`: **0 hits** |
| 15 | `src/services/aps-client.ts` | [x] Grep-verified — `export function urnToBase64` at :38 |
| 16 | `src/tools/mfg-data-model.ts` | [x] Grep-verified — `truncateIfNeeded` at :30; `readOnlyHint: true` at :480 with `generate: true` at :497 in the same tool; bare-quote `componentVersionId: "${component_version_id}"` at :590 |
| 17 | `src/tools/model-derivative.ts` | [x] Grep-verified — second, divergent `function truncate` at :9 |
| 18 | `docs/apsq.mjs` | [x] Verified present, 2,927 bytes |
| 19 | `C:/Users/maxco/.aps-fusion-mcp/tokens.json` | [x] Read — literal `null`; the credential is cleared, so no live APS call is possible from this repo (independent confirmation of Limitation 8(b)'s stated blocker) |
| 20 | `HEAD:…/architecture-aps-fusion-mcp-server.md` (git object) | [x] Extracted (1,482 lines); its D27+D28 block diffed line-by-line against the working tree's, and six provenance phrase-counts run across both — **added mid-pass**, required to isolate this round's edit and classify each finding's provenance |

**Tool plan (Step 3).** Instruments available and exercised: Read; Grep; Bash/Node (programmatic
GraphQL introspection, a GFM-escape-aware markdown table parser, a decision-slot extractor, a
paragraph-reflowing cross-reference scanner, and a mechanical test of the threat model's own
stated composition rule); Context7; Clear Thought; git. Claim-type mapping — absence claims →
grep and programmatic schema queries; literal-content claims → Read at file:line; library- and
vendor-API-behaviour claims → Context7 (`/websites/aps_autodesk_en`,
`/modelcontextprotocol/typescript-sdk/v1.29.0`); structural and blast-radius claims → the
region-isolated fix-diff plus the recorded observation that the artifact has no importers;
prior-document claims (rounds 12–15's findings and trajectories, `HANDOFF.md`'s assertions, and
the document's own premise slots) → re-derived from current source. **CodeGraph and codebase-RAG
were not exercised, and this is not a verification gap:** every structural question in this
review's scope is either an absence claim or a literal-content claim, which Step 3 assigns to
grep/Read rather than CodeGraph, and the architecture specifies a greenfield `src/` tree that does
not yet exist. No instrument class was unavailable for a load-bearing claim category, so no halt
condition arose.

**Rigor waivers.** None. No compression was requested or applied.

## Summary

**This review returns NEEDS FIXES (2 findings).** Round 15's single Serious finding is closed on
both of its limbs against the standard it originally named — D27 now enumerates tool 37 in both
places and states a full contract for `derivative_urn`: an anchored grammar, a validation point,
a binding that makes the parameter non-opaque, and a path-composition rule. The document's
internal accounting came through the edit intact: 37 inventory rows reconcile against every prose
enumeration, 60 requirements map to 60 distinct traceability entries, all 28 decisions carry all
five slots, 7 tables parse clean, and roughly forty MFG schema assertions re-derived
programmatically with zero discrepancies. The two findings are of different kinds and neither was
reported before. The first sits exactly where this round's fix landed: D27's new path-composition
rule — the stated ground for excepting D6's encoding rule — rests on a tutorial cURL example,
while the Model Derivative reference documentation states on four separate surfaces that the
`derivativeUrn` parameter is *URL-encoded*. The document cites one side and does not disclose that
the other exists. The second is older and structural: the threat model asserts that its control
column is a mechanical join that "cannot drift," and the join, computed, drifts at three points —
D8 and D17 are attributed security requirements by the traceability matrix but appear in neither
their own decision headers nor the threat rows those requirements serve.

## Upstream Contract Verification

The upstream artifacts are the spec (`docs/specs/spec-aps-fusion-mcp-server.md`) and the authoring
contract (`.claude/skills/expert-architecture/SKILL.md`). The artifact is a design document, so
the spec's acceptance criteria are not executable at this phase; what is checkable is requirement
coverage, requirement *satisfaction*, and contract conformance. All three were checked, the first
two mechanically.

**Spec requirement coverage — PASS.** I counted the spec's requirements independently from its own
declaration forms: 46 R-numbers by regex over `^- \*\*R-…\*\*` (R-DISC 4, R-READ 6, R-WRITE 4,
R-EXPORT 5, R-AUTO 5, R-NOTIFY 3, R-AUTH 1, R-PROTO 6, R-REL 7, R-OPS 5) plus 14 S-numbers = **60
distinct**. I then parsed the traceability matrix (document lines 1409–1442) with a
GFM-escape-aware cell splitter: 5 columns, 32 rows, **60 requirement entries, 60 distinct, zero
duplicates, zero empty decision cells**, set-differenced to zero missing and zero extra against
the expected 60. The document's "60 spec requirements" claim (Goal line 23; Status line 1550) is
correct.

**Spec requirement satisfaction — PASS.** Coverage of the matrix is not satisfaction of the
requirements it maps. I walked all 60 against the decisions and tool rows each is mapped to; all
60 are satisfied. The pair this fix cycle has been circling holds: **R-EXPORT-3** ("translation to
the additional formats Model Derivative provides … *and retrieval of the resulting derivatives*")
and **R-EXPORT-5** ("retrieval yields the artifact or a signed URL with its expiry surfaced") are
served by tool 37 `aps_md_get_derivative` (line 177), which returns the signed download URL, its
cookies, size, content type and expiry, and which D27 now governs on both of its inputs. AC-7's
acceptance path is runnable end-to-end: tool 36 uploads a foreign CAD file through D23's DM
pipeline, tool 23 translates, tool 24 yields the derivative URN, tool 37 retrieves. *Verification
of the backing capability:* Context7 `/websites/aps_autodesk_en`, 2026-07-30 —
`GET /modelderivative/v2/designdata/{urn}/manifest/{derivativeUrn}/signedcookies` returns exactly
`{etag, size, url, content-type, expiration}` with CloudFront signed cookies as `Set-Cookie`
headers, cookies valid six hours. (The same lookups also produced Finding 1 — the endpoint is
correct; the composition rule around it is what is unresolved.)

**Acceptance criteria.** By set-difference of `AC-[0-9]+` occurrences across both documents, the
spec declares AC-1..AC-27 and the architecture cites 22 of them, never citing AC-1, AC-2, AC-3,
AC-4 or AC-17 — unchanged from rounds 14 and 15. That is **not** a contract violation: the
authoring contract requires the traceability matrix to account for every R# and Q#, not every AC,
and each of those five ACs cites requirements that are themselves traced. Recorded so the reader
can audit the gap rather than discover it.

**Cross-reference integrity — PASS, checked mechanically.** Every `D#` reference in the document
resolves to one of the 28 decisions actually defined (28 defined, 28 referenced, zero dangling,
and no decision defined-but-never-cited). Every `R-…`, `S-…`, `AC-…`, `C#`, `T#`, `M-#`, `Q-#` and
spec `D-#` identifier cited in the architecture exists in the spec (46, 14, 22, 8, 8, 3, 3, 7
respectively; **zero invented**).

**Authoring-contract conformance — checked item by item, mechanically where possible.**

- *Required sections.* All eleven present, by scripted extraction of `^## ` headings: Goal (21),
  Scope (35), Components and structure (54), Quality characteristics (203), Design decisions (217),
  Threat model (1346), ASVS mapping (1387), Traceability (1407), Limitations (1446), Standards
  (1511), Status (1545). Scope carries all three required subsections (In scope :37, Deferred with
  reasoning :44, Out of scope :50). *Inheritance from existing precedents* is correctly omitted
  with its attestation in Status.
- *Five-part decision format.* Scripted per-decision slot check across D1–D28: all 28 found, every
  one carrying all five slots (`**Decision.**`, `**Standard.**`, `**Why here.**`, `**Not.**`,
  `**Premise.**`). **Zero gaps.**
- *Quality characteristics.* All nine ISO/IEC 25010:2023 characteristics appear in the table
  (205–215), Safety included with its explicit not-addressed reasoning.
- *ASVS.* All fourteen chapters V1–V14 dispositioned across the 12-row mapping table (1392–1405);
  V1/V10/V11 share one row.
- *Mandatory Clear Thought invocations.* All present or explicitly attested, by case-insensitive
  sweep: `metacognitivemonitoring` (:219), `mentalmodel`/`mentalmodel(first_principles)` (:402,
  :477, :814, :837, :1130, :1159), `decisionframework` (:285, :316, :607, :1308),
  `structuredargumentation` (trace :1310, attestation :1336), `sequentialthinking` (attestation
  :1304 naming D5/D7/D8), `scientificmethod` (:1349, threat model), `collaborativereasoning`
  (:1296), and `debuggingapproach` attested *not* invoked with reasoning (:1340).
- *Gate C structural checklist.* Passes on every mechanical item (scans enumerated under Systemic
  Patterns). Gate C's premise-citation item — "Every Context7-verified claim cites what was
  verified and when" — is where Finding 1 lands: the citation is present and dated, but reports
  one side of what the cited source says.
- *Header claims.* The header's disclosure that the spec's own `Status:` line still reads "Draft
  for review" is confirmed (`docs/specs/spec-aps-fusion-mcp-server.md`:3), and `HANDOFF.md`:14's
  "passed five independent blinded rounds with zero findings" matches the header's
  characterisation.

## Critical & Serious Findings

### Finding 1 — Serious (regression). D27's new path-composition rule rests on one side of a two-sided vendor record: the Model Derivative reference documentation states on four separate surfaces that `derivativeUrn` is **URL-encoded**, and D27 cites only the tutorial cURL that passes it literally — while using that single example as the stated ground for excepting D6's encoding rule

**What the document does now.** This round closed round 15's finding by giving tool 37's
`derivative_urn` a full contract inside D27. Most of that contract is sound: an anchored grammar,
a zod validation point at the `md-gateway` boundary, and a recompute-and-match binding to
`version_id`. The defect is in the last clause. D27 lines 1210–1216 read:

> **Path composition (the stated, deliberate exception to D6's whole-value `encodeURIComponent`
> rule):** the vendor's documented invocation embeds the derivative URN in the request path with
> literal `/` and `:`, so the gateway composes it segment-wise — `/` and `:` preserved as the
> grammar's structural characters, every other character outside RFC 3986 unreserved
> percent-encoded per segment — rather than encoding the whole value, which would rewrite the
> documented path shape; D6's whole-value rule governs opaque values, and this value is
> grammar-constrained, which is what makes segment-wise composition safe.

and D27's Premise slot (lines 1250–1254) grounds it on:

> its literal-slash embedding in the request path: Context7 `/websites/aps_autodesk_en` (MD v2
> manifest response shape and the `signedcookies` reference invocation), 2026-07-30.

That premise is true as far as it goes, and I confirmed it independently. It is also only half of
what the cited source says.

**How the claim was verified.** Two Context7 lookups against `/websites/aps_autodesk_en` (Model
Derivative v2), 2026-07-30, plus Reads at file:line.

- *The literal form is real.* The `signedcookies` reference invocation passes the derivative URN
  with unencoded `/` and `:`:
  `…/designdata/dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6anAtMjIwNTIwL2JveC5pcHQ/manifest/urn:adsk.viewing:fs.file:dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6anAtMjIwNTIwL2JveC5pcHQ/output/225ba6fd-8516-460d-bb34-8bc85c09a79d/box.obj/signedcookies`
  (source: `…/reference/http/urn-manifest-derivativeUrn-signedcookies-GET`). The translate-to-OBJ
  tutorial shows the same shape. So D27's stated premise is accurate.
- *The contrary statement is also real, and it is the normative one.* The same documentation set
  defines the parameter itself, on **four separate surfaces**, as URL-encoded:
  `urn-manifest-derivativeurn-GET` — "**derivativeUrn** (string) - Required - The **URL-encoded
  URN** of the derivative. Check the manifest of the source design…"; the `/derivatives/v2/…`
  page variant of the same reference — identical wording; `urn-manifest-derivativeurn-HEAD` — "The
  `derivativeUrn` URI parameter is the **URL-encoded URN** of the derivative, which can be found
  in the source design's manifest"; and the .NET SDK reference for
  `ModelDerivativeClient.GetDerivativeUrlAsync` — "The derivativeUrn parameter is the
  **URL-encoded URN** of the derivative." Each of these contrasts it explicitly with the sibling
  `urn` parameter, described as "the URL-safe Base64 encoded URN of the source design."
- *The document does not mention this.* Grep across the full artifact for
  `URL-encoded|url-encoded|percent-encod|encodeURIComponent`: **3 hits, at lines 451, 1211 and
  1214** — D6's rule, D27's exception header, and D27's per-segment encoding clause. **None of the
  three acknowledges that the vendor documents the parameter as URL-encoded**; the phrase
  "URL-encoded" appears nowhere in the artifact. No Limitation records the conflict either
  (Limitation 8's two items are the signed-URL host patterns and the `ItemVersion.id` assumption;
  Read at 1476–1495).
- *Provenance.* `segment-wise` returns **0 in `HEAD` and 3 in the working tree**;
  `deliberate exception to D6` **0 and 1**; `urn:adsk.viewing` **0 and 4**. The entire passage is
  this round's product. No prior round (12, 13, 14 or 15) reported anything about path
  composition — verified by reading round 15 in full and grep-enumerating rounds 13 and 14's
  finding headers.

**Which standard it violates.** The authoring contract's **Phase 6 verification discipline** —
"Capture what you verified, not just the fact that you verified" — read with **Gate C**'s "Every
Context7-verified claim cites what was verified and when" and **Gate B**'s pass condition that
"for each non-trivial decision, what factual premises was it verified against, and how" be
answerable from the document alone. A premise slot that cites a source for the half that supports
the decision, while that same source states the opposite about the same parameter on four pages,
is a *selected* premise, not a verified one — and it makes the decision unevaluable by exactly the
reader Gate B exists to serve. Measured also against the contract's **standards-decoration**
frame in its security form: D6 is the [OWASP-INJECTION] control for S-7/AC-15, and an exception
carved in it must be grounded in something firmer than one worked example.

**Why it matters.** Two ways, and the second holds even if the architecture's choice turns out
right.

First, if the reference statement governs, tool 37's request is malformed and the retrieval limb
this fix cycle spent rounds 14 through 16 building does not work — R-EXPORT-3's and R-EXPORT-5's
retrieval clauses and AC-7 fail at build, which is the same defect round 14 found, displaced one
level down. Second — and this is the part that does not depend on which form is correct — the
architecture has carved an exception in an injection-prevention rule and justified it with a
premise it presents as settled. A reviewer checking the build against D27 will read the vendor's
parameter reference, find it contradicting the architecture, and have nothing in the document to
reconcile it with. If the URL-encoded reading is in fact correct, the exception is not merely
wrong but *unnecessary*: `encodeURIComponent` over the whole value would satisfy both D6 and the
vendor, and a security rule was relaxed for nothing. The blast radius is otherwise bounded — the
request goes to the allowlisted `developer.api.autodesk.com` host so D22 contains the SSRF
surface, and the recompute-and-match binding still constrains the value — so this is Serious, not
Critical.

**What correct implementation looks like.** This review cannot settle the wire format: the stored
credential is cleared (`C:/Users/maxco/.aps-fusion-mcp/tokens.json` reads literal `null`, Read
this session), so neither form can be exercised. What *is* resolvable is the document's treatment
of the conflict, and that is what D27 owes. Confine the edit to **D27's Decision and Premise
slots**: (a) record both vendor statements in the Premise slot — the reference pages' "URL-encoded
URN of the derivative" alongside the cURL invocations' literal form, each cited to its page; (b)
state in the Decision slot which one the gateway follows and why the other was not chosen (the
worked invocations being executable evidence is a legitimate reason — it just has to be *stated*);
and (c) state what happens if the choice is wrong, in the form the document already uses for
unresolved external premises — a Limitation 8 item naming the check that closes it (issue the
`signedcookies` request in both forms against a real derivative after the M-3 re-auth) and the
fallback if the literal form 400s. If the resolution is instead to follow the reference and encode
the whole value, D27's path-composition clause and its "deliberate exception to D6" framing both
come out, and D6 governs unmodified. **Do not edit the grammar, the recompute-and-match binding,
or tool 37's row** — the grammar correctly matches what tool 24's manifest returns (confirmed in
both vendor examples), and the binding is independently sound (in both examples the derivative
URN's `<source>` segment is byte-identical to the source design's URL-safe base64 URN).

**Provenance: regression.** Introduced by this round's fix, per the greps above.

## Systemic Patterns

**No systemic patterns** — verified by the scans below, all run across the full inventory scope
before counting or classifying. The class round 14 named Systemic (a passage asserting a property
of another passage that the other passage does not have) was scanned as a class rather than
assumed clean because it was named-and-fixed; it surfaced **exactly one** instance, Finding 2.
Under the Step 8 proactive-scan rule, extrapolating a systemic pattern from one verified instance
is the failure that rule exists to prevent, so Finding 2 is Moderate, not Systemic. One further
candidate in the same class was examined and **dropped as unfounded**: D27 twice calls D6's rule a
"whole-value `encodeURIComponent` rule" (lines 1210, 1214), where D6 says "REST path segments go
through `encodeURIComponent`" (line 451, Read at drafting time). Since a REST path *parameter*
occupies a segment, "whole-value" is a fair description of D6 as applied to this parameter, and
the divergence D27 actually needs the exception for — preserving `:` inside the first segment — is
real. Only the gloss "D6's whole-value rule governs opaque values" states a scope limitation D6
does not carry, and that alone is too thin to carry a finding. I also confirmed the document's
exception-pointing convention is consistently one-directional, so D6's lack of a pointer back to
D27 is not a defect: D3 (Read 325–376) contains no reference to the webhook route or D11, while
D11 (line 621) explicitly names its own departure — "Ordering note — deliberately unlike the
`/mcp` chain (D3)". D27 follows the same convention.

1. **Self-referential agreement and cross-reference claims** (the round-14 class). Two passes.
   *Pass 1 — regex over paragraph-reflowed text* (the document hard-wraps, so a line-based grep
   misses cross-line phrases): signature
   `the same \w+|identical (in|to|across)|stated (identically|the same)|mirrors?|states the same|as (stated|specified) (in|above|below)|carries the identical|both (locations|places)|in every mode|always binds|exactly the (same|one|two|three|four|five)|agree(s|ing)? with|consistent with|the three D8 classes|same .{0,20}rule`.
   **18 of 81 paragraphs hit.** *Pass 2 — manual enumeration and re-derivation of every
   cross-passage assertion the document makes*, since a regex finds only what its author
   suspected. Each was opened against the passage it certifies: D12's "tool 34's row states the
   same three-field contract" (:738) against tool 34's row (:174 — the row's Returns cell does
   enumerate `marker`, `sequence`, `resume_position`); D25's "the three D8 classes" (:1149)
   against D8's classification (:519–521 — `ok` / `reauth-required` / `unknown (transient)`, all
   three present); D25's "the same value declared in `serverInfo` per D3 — one source,
   `package.json`" (:1147–1148) against D3 (:339); D13's chokepoint analogy (:774–776) against
   D22 (:1064); D18's "the same type-mandated enforcement D13 uses" (:908–909) against D13
   (:762–764); D19's chokepoint analogy (:946–947) against D13 and D16 (:865–866); D21's "the same
   startup-assertion treatment as D1's host:port distinctness and D9's callback consistency"
   (:1039–1040) against D1 (:260–261) and D9 (:567–568); D28's credential-path claim (:1288–1290)
   against D10 (:595–596) and D24 (:1111); the Components block's nine-artifact state-store list
   (:88–90) against D24's nine-row table (:1116–1126); and D28's summary of D27's new contract
   (:1266–1268) against D27. **All hold.** The one failure the pass surfaced is Finding 2, and the
   one candidate it surfaced and I dropped is the D6 gloss described above.
2. **Tool-inventory accounting** (Node parse of all 37 rows, each classified independently from its
   own Class and Returns cells before comparing to the document's prose). Numbering contiguous
   1..37 ✓. Effect classes **R = 23, W = 11, $ = 3, summing to 37** — matching the document's
   enumeration exactly (MFG-backed 13 {2–12, 22, 35} + Model Derivative 4 {24, 25, 26, 37} +
   Design Automation 3 {27, 29, 30} + Webhooks/DM 3 {1, 32, 34} = 23; the stated not-R-class set
   {13–20, 21, 23, 28, 31, 33, 36} = 14; 23 + 14 = 37). W partition **5 destructive
   {13, 16, 17, 19, 33} + 6 additive {14, 15, 18, 20, 31, 36} = 11**, exactly D14's two
   enumerations, with `idempotentHint` inverted across that partition ✓. List/single partition
   independently classified from each Returns cell: the document's three disposition sets
   (cursor-paged {2,3,4,5,6,8,10,11,12,26,27,32,35} = 13, bounded-single-response
   {7,13,24,25,30,31} = 6, merged-source resumable {34} = 1) union to **20 with zero overlap**,
   leaving 17 — the document's stated figures. Group file counts **1+6+6+9+7+4+4 = 37**. Grep for
   a stale tool total (`36 tools|36 rows|of 36|all 36`) returns **zero**. **Zero defects.**
3. **Markdown table integrity** (Node parse of every table block with GFM-correct escaped-pipe and
   inline-code handling, checking each row's cell count against its header and each block's
   blank-line termination): **7 tables, 0 defective rows, 7/7 blank-terminated.** Tables at
   139–177 (6 × 37), 205–215 (4 × 9), 1116–1126 (3 × 9), 1367–1376 (4 × 8), 1392–1405 (2 × 12),
   1409–1442 (5 × 32), 1513–1543 (3 × 29). Round 12's malformed-table class stays closed.
4. **Config-key orphans** (`\b[A-Z][A-Z0-9]*(_[A-Z0-9]+)+\b`): 17 distinct SCREAMING_SNAKE
   identifiers, of which 15 are config keys (`O_EXCL` and `AS_SAVED` are not). All 15 are declared
   in D21's block (lines 1002–1061), checked by substring membership. **Zero orphans.**
5. **Standards decoration** (bracketed-tag extraction, body against the Standards table): **15 tags
   in the body, all 15 present in the table; zero body tags missing.** The table's one extra,
   `[APS-COMMERCIAL]`, is not decoration — it demonstrably drives D13's metered categories, D14's
   cost-class carving, the inventory's costlessness prose, and Limitation 11. Every named non-tag
   standard in the body (ASVS 4.0.3, ISO/IEC 25010:2023, SOLID, RFC 9110, Crash-Only,
   Twelve-Factor §III, Google SRE ch. 22, OWASP Threat Modeling, Express 5, Tailscale, pino,
   zod v4) appears in the table with what it governed.
6. **Gate C authoring residue and deferred-decision phrasing** (case-insensitive sweep for
   `corrected|correction|previously|earlier draft|prior draft|was wrong|initially|superseded|TODO|TBD|FIXME|scratchpad|no longer|as before|still stands|re-stated|now correctly|now states|remains as|in a prior round|last round|this revision|this round`,
   plus a second sweep for
   `left to the (implementer|build|plan)|the implementer will|at implementation time|to be determined|decided later|during implementation|implementer.s choice|refined (later|during)|pinned .{0,12}at implementation|plan may confirm|plan-level`):
   **1 residue hit and 4 deferral hits, 0 genuine.** Line 224 ("superseded by the spec's
   hosted-primary D-1") is the required metacognitive baseline naming an anchoring bias. Line 1114
   ("a defect in this decision, not an implementer's choice") is an explicit *anti*-deferral rule.
   Lines 1175/1182 are D26's vitest choice, recorded as "a dev-tooling default the plan may
   confirm; **no architectural surface depends on it**" — the authoring contract's designated
   handling for trivial decisions, and the architectural decision (constructor-injected fetch and
   clock) is fully made. Line 1477 (signed-URL host patterns "pinned exactly at implementation")
   sits in Limitations, the contract's designated home for acknowledged gaps, and is bounded by
   `EGRESS_ALLOW_HOSTS` being config rather than code.

## Moderate & Minor Findings

### Finding 2 — Moderate (new). The threat model claims its control column is a mechanical join that "cannot drift," and the join drifts at three points: the traceability matrix attributes S-3 to D8 and S-8 to D17, but neither decision declares that requirement and neither appears in the threat rows those requirements serve

**What the document does now.** The threat model states how its control column was built
(lines 1362–1365, Read at drafting time):

> The control column is **composed, not curated**: the spec binds each security requirement to its
> threats (§8, e.g. "S-10 (T5, SSRF)"), and this document's decisions declare the requirements
> they satisfy; threat → controls is the join of the two. It therefore cannot drift from the
> decisions without the decisions themselves changing.

and asserts the completeness that follows (lines 1378–1381):

> **Analysis.** All eight threats carry ≥1 control. The converse — no control without a threat —
> is checked the same way: every decision that declares a security requirement appears in the row
> of each threat that requirement serves, so a control absent from this table would be a decision
> declaring no requirement.

I computed that join mechanically. It does not hold.

**How the claim was verified.** A Node script that parses the threat table (lines 1367–1376) and
the traceability matrix (lines 1409–1442) with the same GFM-aware cell splitter, extracts the
spec's requirement→threat bindings from the threat table's own "Via spec requirements" column, and
tests every (requirement, decision) pair against the corresponding threat row. **Three violations,
enumerated:**

| Requirement | Traceability says (line) | Serves threats (spec §8) | Threat row's controls | Missing |
|---|---|---|---|---|
| S-3 | `D2, D8, D28` (:1431) | T1, T3 (`S-3 (T1/T3, confused deputy)`) | T1 (:1369) `D1, D2, D3, D28`; T3 (:1371) `D10, D20, D28, D2` | **D8**, from both |
| S-8 | `D17, D28` (:1436) | T5 (`S-8 (T5)`) | T5 (:1373) `D6, D13, D14, D22, D27, D28` | **D17** |

The spec's bindings were Read directly (`S-3 (T1/T3, confused deputy)` at
`docs/specs/spec-aps-fusion-mcp-server.md`:356; `S-8 (T5)` at :382). The decision headers were
extracted by script: **D8's header declares no S-number at all** (`*(R-REL-2/3/7, R-AUTH-1,
C1/C2/C3; AC-11, AC-18, AC-25)*`, line 509) and **D17's declares none either** (`*(R-PROTO-5/6;
AC-10)*`, line 881). So the inconsistency holds under either reading of "declares," and that is
what makes it robust: if "declares" means the decision header, then the *traceability matrix*
asserts a mapping no decision carries, and the matrix is not the join the document says it is; if
"declares" means the matrix mapping, then the *threat table* omits controls the join produces and
the Analysis's universal claim is false as written. Two accounting surfaces give different answers
to "which decisions satisfy S-3 and S-8?"

*Provenance verification.* The T5 row and the Analysis paragraph are **byte-identical** between
`HEAD` and the working tree (`diff` of `HEAD`:1299 vs worktree:1373, and `HEAD`:1304–1307 vs
worktree:1378–1381, both empty), and the S-3 and S-8 traceability rows are present unchanged in
`HEAD` at :1357 and :1362. This is a pre-existing defect, not fix-induced. It was not reported by
rounds 12, 13, 14 or 15 — verified by reading round 15 in full and grep-enumerating rounds 13 and
14's finding headers, none of which concerns the threat table's composition.

**Which standard it violates.** The authoring contract's **Gate B** pass condition — every
compliance question must be "answerable from the document alone by pointing to a specific section,"
and "a question that requires subjective interpretation of the document is a Gate B failure." A
reader asking which decisions satisfy S-3 or S-8 gets two different answers from two tables that
the document says are the same join. Also the **standards-decoration** frame in its security form:
the Analysis paragraph asserts a completeness property that makes the threat model auditable, and
an asserted-but-absent property is the "full in name, empty in substance" pattern that trap names.
Measured additionally against **OWASP Threat Modeling**'s threats-before-controls discipline,
which the document names in its Standards table (line 1533) — a threat→control mapping is only a
control inventory if it is complete for each threat.

**Why it matters.** This is an audit surface, and the omissions are not cosmetic. **D17 is the
decision that implements S-8** — "Tool arguments SHALL be validated at the boundary — types,
ranges, formats — before use, treating the model as an untrusted input source" — via zod schemas
at the boundary. T5 is "a malicious or confused model/agent driving the tools with crafted
arguments." The single most direct defence against T5 is absent from T5's control column, which
lists six other controls. A reviewer using this table to check T5's coverage — which is the table's
stated purpose — will not find boundary input validation. Likewise D8's classified-failure design,
which is what keeps a transient error from destroying the credential, is mapped to S-3 (confused
deputy, T1/T3) and appears in neither T1's nor T3's row. And because the document asserts the
column "cannot drift," a reader has an explicit invitation *not* to check.

**What correct implementation looks like.** Reconcile the three surfaces so they agree, then make
the Analysis claim true rather than aspirational. Concretely: add `S-3` to D8's header requirement
list and `S-8` to D17's, since both decisions do satisfy those requirements and the matrix already
says so; add D8 to T1's and T3's control columns and D17 to T5's, with the one-clause description
the other entries carry (for T5, something of the form "boundary zod validation of every tool
argument (D17)"). Alternatively, if the intent is that D8 and D17 are *not* S-3/S-8 controls,
remove them from the traceability matrix instead — but that would leave S-8 traced only to D28,
which covers input *shape* constraints and not the general boundary-validation property S-8
states, so the first path is the correct one. **This edit is distinct from the one round 15
prohibited.** Round 15 said not to edit the threat-model T5 row because it correctly cites D27;
adding the missing D17 control is additive and leaves that citation untouched.

**Provenance: new.** The text is unchanged from the committed baseline and no prior round reported
it.

**No Minor findings** — verified by the six scans above (self-referential claims, inventory
accounting, table integrity, config-key orphans, standards decoration, Gate C residue), the
cross-reference integrity check (zero dangling `D#` references, zero invented spec identifiers),
the five-part decision-slot check across all 28 decisions, the Clear Thought invocation sweep, and
the requirement-satisfaction walk across all 60 requirements. No residual style, convention, or
optimization defect was observed.

## Tentative Findings

**No tentative findings** — every candidate finding's premise was verified per Compliance Gate B.
Two candidates were examined and resolved rather than carried:

- *Whether the Model Derivative API accepts the literal form, the percent-encoded form, or both.*
  This is genuinely unresolvable here — the credential is cleared, so no request can be issued —
  but it is **not** a tentative finding, because Finding 1 does not depend on it. Finding 1's
  premise is that the document cites one side of a two-sided vendor record without disclosing the
  other, and that premise is fully verified by the six Context7 excerpts recorded above. Which
  form is correct determines the *fix*, not the finding.
- *Round 12's tentative T1* (whether MFG `ItemVersion.id` is the Data Management version-URN form)
  is **not** carried forward, and I re-derived that disposition rather than importing it. D27
  (lines 1223–1226) marks the assumption "**not live-verified**" in the decision text and points
  to Limitation 8(b), which names the exact closing query (`itemVersions(hubId:, itemId:)`
  requesting `results { id versionNumber }` through `docs/apsq.mjs`), the derivation step D27
  would need if it fails, and the fact that AC-7's foreign-CAD path is unaffected. I verified the
  *stated blocker* independently rather than accepting it: `docs/apsq.mjs` is present (2,927
  bytes) and `C:/Users/maxco/.aps-fusion-mcp/tokens.json` contains the literal string `null`. The
  introspected schema types `ItemVersion.id` as `ID!` with no format information, confirming the
  schema cannot settle it either. Under the authoring contract, the Limitations section is the
  declared home for claims that could not be verified with available tools, and D27 states a
  complete, implementable contract around the assumption. This is correct handling and should not
  be re-opened.

## Observations

- The introspection dump's top-level object carries only `data` and `extensions`, and the schema
  body exposes `queryType` and `types` with no `mutationType` pointer. `Mutation` is nonetheless
  present as a type with 45 fields, and all eight mutations the architecture names (`createFolder`,
  `renameFolder`, `moveFolder`, `copyFolder`, `deleteFolder`, `createDesignFromFile`,
  `setProperties`, `createPropertyDefinition`) exist on it. This affects no claim the architecture
  makes; it is worth knowing before the build introspects this file, because a tool resolving
  mutations through `mutationType` will find none. (Recorded by rounds 14 and 15 as well;
  independently re-derived here.)
- D27's parenthetical describes the verified derivative-URN form as
  `urn:adsk.viewing:fs.file:<base64 source>/output/<guid>/<filename>` (line 1205). The vendor
  manifest example I retrieved carries two children in the shape
  `urn:adsk.viewing:fs.file:<base64 source>/output/Resource/model.sdb` — same structure, but the
  third segment is a role name rather than a GUID. This is not a defect: D27's *normative* grammar
  is stated generally as `<source>/<segment>[/<segment>…]` (lines 1200–1203) and accommodates both,
  and the parenthetical is accurate for the OBJ case it cites. Recorded because an implementer
  writing the zod pattern should key it to the general grammar, not to the parenthetical's
  example.
- The spec file's `Status:` line still reads "Draft for review" (verified at
  `docs/specs/spec-aps-fusion-mcp-server.md`:3) while `HANDOFF.md`:14 records a five-round
  zero-findings pass. The architecture header discloses exactly this discrepancy and declines to
  resolve it, which is the correct handling of governance metadata the architecture does not own.
- The artifact header states that the R-REL-7 / AC-25 spec amendment "has not itself been reviewed
  — it owes its own review round." That remains true; this review evaluated the architecture
  against the amended spec text as the architecture declares, and did not review the amendment.

## What's Actually Good

- **The D5 type-located field enumeration survives independent programmatic re-derivation at full
  density, for the third consecutive round.** I re-checked every claim by script against
  `docs/aps-mfg-schema.json` rather than by eye: 209 types; the `Item` interface carries exactly
  the twelve fields named "and nothing else"
  (id/hub/project/parentFolder/name/createdOn/createdBy/lastModifiedOn/lastModifiedBy/extensionType/
  mimeType/size); `tipVersion` and `versions` exist on all four concrete Item types, and those four
  are exactly `Item.possibleTypes`; `tipRootComponentVersion` is borne by `DesignItem` and by
  nothing else in the schema (global sweep: 1 carrier); `tipConfigurationTable` is borne by
  `ConfiguredDesignItem` only; the `ItemVersion` interface carries
  `versionNumber`/`createdOn`/`lastModifiedOn` at interface level, making tool 35's field list
  interface-safe; `ComponentVersion` carries
  partNumber/partDescription/materialName/isMilestone/lastModifiedOn+By/createdBy and has **no**
  `versionNumber` and **no** `createdOn`; `DesignItemVersion` and `ConfiguredDesignItemVersion`
  both carry versionNumber+createdOn and both expose `item`, which is what makes tool 12's two
  `fusionWebUrl` traversals resolve; `fusionWebUrl` is present on exactly the six types named and
  absent from `ComponentVersion`; the schema has exactly nine `ComponentVersion`-typed fields with
  `ConfigurationRow.rootConfigurationMember` among them; `ConfigurationTable.rows` takes zero
  arguments, confirming the "API-unpaginated, so the bound is tool-level" claim; `ItemFilterInput`
  carries only `name` and `itemType`, confirming D7's and D12's "no server-side changed-since
  filter" reasoning; `item(hubId!, itemId!, …, composition: ItemCompositionEnum)` really does take
  composition with values WORKING/RELEASED/AS_SAVED/LATEST (R-READ-6) and really does require both
  ids (tool 7/12's item branch); `itemsByFolder(hubId!, folderId!, filter, pagination)` really does
  take no project id, which is what tool 5's row asserts, while `itemsByProject(projectId!, …)`
  takes no hub id, which is what D7's search extension assumes; `itemVersions(hubId!, itemId!,
  pagination) → ItemVersions{pagination, results}` backs tool 35; and `OutputFormatEnum` is exactly
  STEP, STL, OBJ. Roughly forty checks, **zero discrepancies**. By the authoring contract's Phase
  10 element-5 standard this is what a verified premise slot is supposed to look like, and a slot
  that survives re-derivation at this density across three independent review rounds is rare.
- **D14's annotation truth matrix rests on correctly-read SDK defaults, and the matrix is
  internally exhaustive.** Context7 `/modelcontextprotocol/typescript-sdk/v1.29.0`, 2026-07-30:
  `ToolAnnotationsSchema` (`packages/core/src/schemas.ts`) and the `ToolAnnotations` interface
  declare `readOnlyHint` **Default: false**, `destructiveHint` **Default: true** ("meaningful only
  when `readOnlyHint == false`"), `idempotentHint` **Default: false**, `openWorldHint` **Default:
  true** — exactly what D14 asserts (lines 812–813, 802–803), including the non-obvious half that
  `destructiveHint` defaults *true*, which is why W-class tools must set it explicitly. The matrix
  is also complete rather than illustrative: I classified all 37 rows independently from their own
  Class cells and D14's two enumerations — destructive {13, 16, 17, 19, 33} and additive
  {14, 15, 18, 20, 31, 36} — partition the 11 W-class rows exactly, with `idempotentHint` inverted
  across the same partition. The standard this is good by is [MCP-TOOLS] annotations read with
  R-PROTO-4's truthfulness requirement: getting a default backwards here would make AC-16's
  contract-vs-`tools/list` diff pass while shipping a false hint, which is precisely the
  predecessor defect (`readOnlyHint: true` at `src/tools/mfg-data-model.ts`:480 over `generate:
  true` at :497, verified at source this session) that R-EXPORT-2 exists to kill.
- **Every predecessor-source claim in the premise slots is confirmed at file:line.** Nine checks,
  all correct: the v2 deprecation banner, `/mfg/v3/graphql/public`, and ComponentVersion removal at
  `src/constants.ts`:9–10 (D5); `app.post("/mcp", …)` at `src/index.ts`:71 with
  `app.use(express.json())` at :45 and no auth middleware on any route, and the hardcoded version
  at :22 (D1/D2/D3/D21); `clearTokens()` defined at `src/services/aps-auth.ts`:38 and called at
  :119 in the refresh failure path, with `isAuthenticated()` returning `currentTokens() !== null`
  at :145–146 (D8); zero hits for `code_challenge|codeChallenge` across `src/`, confirming the
  predecessor's PKCE absence (D9); the two divergent truncation implementations at
  `src/tools/mfg-data-model.ts`:30 and `src/tools/model-derivative.ts`:9 (D19); the bare-quote
  `componentVersionId: "${component_version_id}"` at `src/tools/mfg-data-model.ts`:590 (D6);
  `urnToBase64` at `src/services/aps-client.ts`:38 (D27); and the caret ranges
  `^1.29.0`/`^5.2.1`/`^4.3.6` in `package.json` with `package-lock.json` present (D21). The
  document uses each as defect evidence rather than as precedent, which is what M-1/M-2 require —
  and which is the codebase-mirroring trap's designed defence.
- **The round-15 fix landed with zero collateral damage across every accounting surface, and the
  substance of the closure is better than the minimum the finding asked for.** Round 15 demanded
  two enumerations be extended and a grammar be stated. D27 delivers both — line 1196 now reads
  "Tools 23–26 and 37 take `version_id`" and line 1232 "feeds tools 23–26 and 37" — and then goes
  further in the direction the finding pointed: rather than declaring `derivative_urn` opaque
  (which would have contradicted D27's own "raw pre-encoded base64 URNs from callers are rejected"
  rule), it makes the parameter *non-opaque* by having the gateway recompute the base64url MD URN
  from the validated `version_id` and reject any `derivative_urn` whose `<source>` segment differs.
  I verified that binding is sound rather than merely clever: in both vendor examples the
  derivative URN's source segment is byte-identical to the source design's URL-safe base64 URN
  (manifest example — children `urn:adsk.viewing:fs.file:dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6c3ZmX3NhbXBsZV8wMS9MaW5rJTIwQXJjXzIwMTgucnZ0/output/…`
  against manifest `urn` `dXJuOmFkc2sub2JqZWN0czpvcy5vYmplY3Q6c3ZmX3NhbXBsZV8wMS9MaW5rJTIwQXJjXzIwMTgucnZ0`;
  signedcookies example — same equality), so the check accepts every legitimate value and reduces
  the parameter's caller-controlled surface to the trailing segments. Against the spec's S-8 and
  S-10, that is a stronger control than the grammar alone, and it also resolves the tension round
  15 flagged between D27's rejection rule and tool 37's existence — which the document states
  explicitly at lines 1226–1229. All seven tables, 37 inventory rows, 60 traceability entries, and
  the group file counts came through unchanged.

## Convergence Record

**Round:** 16 (post-fix), matching Scope and Inventory.

**Trajectory:** R9: 6 → R10: 4 → R11: 6 → R12: 4 → R13: 3 → R14: 3 → R15: 1 → **R16: 2**. The
R9–R12 counts are grep-verified from round 12's own Convergence Record
(`docs/reviews/round-12-architecture-review.md`:148); R13's from round 13's verdict line (:580);
R14's from round 14's verdict line (:675); R15's from round 15's verdict line (:551). Rounds 1–8
are not present in this repository, so the trajectory is recorded from R9 forward. R16's count is
this review's own mechanical breakdown.

**Flow counts for R16** (every closure re-derived from current source against the standard the
original finding named, never from the fix author's assertion):

- **Prior findings closed: 1 of 1.**
  - **R15 F1** (Serious-regression — tool 37 was added to every accounting surface but not to D27,
    which still enumerated "Tools 23–26", and tool 37's `derivative_urn` had no stated grammar
    anywhere in the document) — **closed, on both limbs.** *Limb 1, the enumerations:* Read of
    lines 1196 and 1232 at drafting time — "Tools 23–26 **and 37** take `version_id`" and "whose
    `version_id` feeds tools 23–26 **and 37**". Grep confirms the baseline strings are gone:
    `Tools 23–26 take` returns 1 in `HEAD`, **0** in the working tree; `Tools 23–26 and 37 take`
    returns 0 in `HEAD`, **1** in the working tree. *Limb 2, the ungoverned parameter:* D27 lines
    1199–1216 now state a grammar (the anchored form
    `urn:adsk.viewing:fs.file:<source>/<segment>[/<segment>…]`, with `..`, `?`, `#`, `\` and
    control characters rejected), a validation point ("zod-validated at the same `md-gateway`
    boundary"), a binding that makes the parameter validatable rather than opaque, and a path
    composition rule. Grep for `derivative_urn|derivativeUrn` across the artifact now returns
    **7 hits** (lines 177, 854, 1199, 1208, 1228, 1267, 1524) against the 3 round 15 recorded in
    its working tree, and the four new hits sit inside D27's Decision slot and D28 — the exact
    location round 15 named. (The same grep against `HEAD` returns 0, because tool 37 did not
    exist in the committed baseline.) The finding's
    third demand — reconciling the new contract with D27's own "raw pre-encoded base64 URNs from
    callers are rejected" rule — is met at lines 1226–1229, which scope that rejection to "**in
    the `version_id` position**" and explain why `derivative_urn` is not opaque. Closed against
    the standards originally named (the authoring contract's deferred-decision trap, spec S-8 and
    S-10/AC-23, and Gate B's answerable-from-the-document condition). Round 15's edit prohibition
    was honoured: tool 37's row (:177), the traceability matrix, the Standards table and the
    threat-model T5 row are unchanged.
- **New findings: 1** (Finding 2 — the threat model's composition claim; text byte-identical to
  `HEAD`, so pre-existing, and not reported by rounds 12–15).
- **Regressions: 1** (Finding 1 — D27's path-composition rule; confirmed by greps showing
  `segment-wise`, `recompute-and-match`, `urn:adsk.viewing` and `deliberate exception to D6` all
  absent from `HEAD` and present in the working tree).
- **Recurring: 0.**

**Tripwire evaluation — NOT FIRED**, with the arithmetic shown for both conditions. **Both
conditions hold for this round, so both streaks are now armed at one of two.**

- *Condition (a): new + regression ≥ closed, for two consecutive post-fix rounds.* **R16: 1 + 1 = 2
  vs 1 closed → 2 ≥ 1 is TRUE.** R15: 0 + 1 = 1 vs 3 closed → 1 ≥ 3 was FALSE. The streak is
  therefore **1 of 2**. Does not fire.
- *Condition (b): total findings has not strictly decreased, for two consecutive post-fix rounds.*
  **R16: 2 vs R15's 1 → 2 is not less than 1, so it did NOT strictly decrease → TRUE.** R15: 1 vs
  R14's 3 → it did strictly decrease → FALSE. The streak is therefore **1 of 2**. Does not fire.

Neither condition has held for two consecutive rounds, so the tripwire does not fire and
foundational rework is not indicated *this* round. The operational consequence is worth stating
plainly rather than leaving to be inferred: **round 17 is a round in which either condition firing
routes to foundational rework.** If round 17 produces new + regression findings at least equal to
the number it closes, or fails to finish with fewer than two findings, the tripwire fires.

The qualitative signal is mixed, and honestly so. On the positive side, the external-premise
surface is clean for the third consecutive round on everything except the one point Finding 1
names — roughly forty schema assertions and the SDK annotation defaults all re-derived without a
discrepancy — and every document-integrity class that dominated rounds 9 through 13 (malformed
tables, stale arithmetic, orphan config keys, dangling references, standards decoration) is closed
and stayed closed under independent re-scanning. On the negative side, this is the **second
consecutive round in which the fix itself produced a finding at the site of the fix**. Round 15's
regression was an omission — the fix author extended the accounting surfaces and forgot the
governing decision. Round 16's is the opposite shape — the fix author extended the governing
decision and grounded a new rule on the first vendor example found, without checking the reference
page for the same parameter. Both are verification-discipline failures at the seam the edit
creates, and that is now a pattern across two rounds even though neither round's finding recurs.

## Recommended Priority

Another fix round is the indicated path — the tripwire has not fired, and recommending
foundational rework over a non-fired tripwire would be as wrong as recommending another round over
a fired one. But the round should be run differently from the last two, and that is the first
item, not an afterthought.

1. **Fix the verification discipline before fixing the findings.** The last two rounds each closed
   their finding and produced a new one at the same site, both times because the fix author
   verified the half of the record that supported the edit. Round 15: the accounting surfaces were
   updated, the governing decision was not re-read. Round 16: one vendor example was found and
   used, the reference page defining the same parameter was not opened. The mechanical rule that
   closes this: **when an edit rests on an external source, open that source's normative reference
   for the exact parameter or behaviour being relied on, not only a worked example — and when the
   two disagree, that disagreement is the thing the decision has to resolve in writing.** The
   worked example is evidence that a form works; the reference is the contract. A decision that
   cites one without the other has not verified its premise, it has selected it.
2. **Finding 1 (Serious) — D27's Decision and Premise slots only.** Record both vendor statements
   with their pages; state which the gateway follows and why; and add the unresolved half to
   Limitation 8 as a third item with the check that closes it (after the M-3 re-auth, issue the
   `signedcookies` request with the literal form and with the whole value percent-encoded, against
   a real derivative) and the fallback if the chosen form 400s. If the resolution is to follow the
   reference and encode the whole value, delete the path-composition clause and its "deliberate
   exception to D6" framing entirely — D6 then governs unmodified, which is the simpler and safer
   outcome. **Do not touch** D27's grammar, its recompute-and-match binding, or tool 37's row: all
   three are verified correct and the binding is a genuine strengthening over what round 15 asked
   for.
3. **Finding 2 (Moderate) — reconcile the three security-accounting surfaces.** Add `S-3` to D8's
   header requirement list and `S-8` to D17's; add D8 to the T1 and T3 control columns and D17 to
   T5's. **This is explicitly not the edit round 15 prohibited.** Round 15 forbade editing the T5
   row because its D27 citation was correct and editing it would have inverted that fix; adding
   D17 alongside is additive and leaves the D27 citation untouched.
4. **Then re-run the join, not just the edit.** Finding 2 was found by computing the document's own
   stated join mechanically rather than reading the table. That check is cheap and should be part
   of closing this finding: after editing, recompute requirement → threat → control from the three
   surfaces and confirm zero violations, exactly as the Analysis paragraph claims. A claim that a
   table "cannot drift" is only worth making if something checks it.

Nothing in this round calls for re-opening D27's unverified-premise disclosure or Limitation 8(b)'s
structure. Both remain correct handling of a premise that genuinely cannot be checked while the
credential is cleared, and I verified that blocker independently rather than accepting the
document's word for it. Tools 25, 26 and 37's rows remain correct and should not be touched.

## Verdict

Verdict: NEEDS FIXES (2 findings: 1 Serious-regression, 1 Moderate-new)
