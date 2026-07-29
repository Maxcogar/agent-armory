# Expert Review — Architecture: APS Fusion MCP Server (Round 12)

## Scope and Inventory

**Round 12** (post-fix). Inventory constructed per the post-fix rule: the prior rounds' inventory, the files the revision's decisions cite as premises, and R11's six findings as closure items.

| # | File | Status |
|---|---|---|
| 1 | `docs/architectures/architecture-aps-fusion-mcp-server.md` | [x] Read in full, 1441 lines (three passes: 1–615, 615–1034, 1034–1441) |
| 2 | `docs/specs/spec-aps-fusion-mcp-server.md` | [x] Read in full, 623 lines |
| 3 | `.claude/skills/expert-architecture/SKILL.md` | [x] Read in full, 582 lines |
| 4 | `HANDOFF.md` | [x] Read in full |
| 5 | `docs/aps-mfg-schema.json` | [x] Programmatically queried: 209 types; Query root 21 fields with args; `Mutation` 45 fields; field lists for `Item`, `ItemVersion`, `ComponentVersion`, `BasicItem`/`DesignItem`/`ConfiguredDesignItem`/`DrawingItem` + their four version types, `ConfigurationRow`, `ConfigurationTable`, `ItemFilterInput`, `DerivativeInput`, `ItemCompositionEnum`, `Properties`, `ItemVersions`, `Pagination`, `Occurrence`; `fusionWebUrl` carriers = 6; `ComponentVersion`-typed fields = 9 |
| 6 | `package.json` | [x] Read — deps `^1.29.0`, `^5.2.1`, `^4.3.6` |
| 7 | `package-lock.json` | [x] Verified present (46,359 bytes) |
| 8 | `src/constants.ts` | [x] Read in full |
| 9 | `src/index.ts` | [x] Read in full |
| 10 | `src/services/aps-auth.ts` | [x] Read in full |
| 11 | `src/services/aps-client.ts` | [x] Read in full |
| 12 | `src/tools/mfg-data-model.ts` | [x] Grep-verified (`truncateIfNeeded`:30; bare-quote:590; `readOnlyHint`:480; `generate: true`:497; point-budget comments:121–123, 270–273) + Read 470–509 |
| 13 | `src/tools/model-derivative.ts` | [x] Grep-verified (`truncate`:9–11) |
| 14 | `src/tools/data-management.ts` | [x] Grep-verified (0 hits for `urnToBase64`/`version_id`) |
| 15 | `prior-session-artifacts/aps-api-verified-facts.md` | [x] Read §3 — **added mid-pass** (surfaced while probing D27's URN reachability claim) |
| 16 | `prior-session-artifacts/FINDINGS.md` | [x] Read 20–45 — **added mid-pass** |

**Tool plan (Step 3).** Instruments available: Read, Grep, Bash/Node (schema queries), Context7, Clear Thought. Mapping — absence claims → grep and programmatic schema queries; literal-content claims → Read at file:line; library-behavior claims → Context7 (`/expressjs/express`, `/modelcontextprotocol/typescript-sdk`, `/colinhacks/zod`, `/websites/tailscale`, `/websites/aps_autodesk_en`); prior-document claims (predecessor defects, HANDOFF assertions, the document's own premise slots) → re-derived from current source. CodeGraph and codebase-RAG were **not** exercised, and this is not a gap: the architecture specifies a greenfield `src/` tree that does not yet exist, and every claim it makes about the predecessor is a literal-content or absence claim, which Step 3 assigns to grep/Read rather than CodeGraph. No instrument class was unavailable for a load-bearing claim category, so no halt condition arose. One isolated behavioral claim could not be reproduced and appears in Tentative Findings.

**Rigor waivers.** None. No compression was requested or applied.

**Procedural observation.** `collaborativereasoning` failed once on enum validation (`communication.style`/`tone` rejected non-enum values) and succeeded on retry with valid enums. The mandatory multi-perspective check was completed via the tool.

## Summary

**This review returns NEEDS FIXES (4 findings).** The revision is materially stronger than the ledger's description of R11 would suggest: five of R11's six findings are closed against their originally named standards, and the document's largest premise surface — roughly forty distinct claims about the introspected MFG GraphQL schema — re-derived exactly, field for field, with no discrepancies. The tool inventory's arithmetic, disposition-class partition, annotation matrix, config-key set, state-store inventory, traceability matrix, and standards table all reconcile under independent recomputation. One R11 finding did not close: D12's cross-source join key was fixed on its rule-scope half and left wrong on its field-location half, and the field it now names does not exist at that path in Autodesk's documented callback shape — nor is it persisted by D11's journal schema at all. The other three findings are documentation-integrity defects that change no line of the eventual build.

## Upstream Contract Verification

The upstream artifacts are the spec (`docs/specs/spec-aps-fusion-mcp-server.md`) and the authoring contract (`.claude/skills/expert-architecture/SKILL.md`). The architecture is a design document, so the spec's acceptance criteria are not executable here; what is checkable is requirement coverage and contract conformance.

**Spec requirement coverage — PASS.** I counted the spec's requirements independently: R-DISC 4, R-READ 6, R-WRITE 4, R-EXPORT 5, R-AUTO 5, R-NOTIFY 3, R-AUTH 1 (28 functional), R-PROTO 6, R-REL 7, R-OPS 5 (18 non-functional), S-1..S-14 (14 security) = **60**. The traceability matrix's two columns carry 28 and 32 entries respectively = 60, with no duplicates and no omissions. The document's "60 spec requirements" claim is correct. (`HANDOFF.md`'s "27 functional and non-functional requirements" is inaccurate, but that is HANDOFF's defect, not the architecture's.)

**Acceptance criteria.** AC-1, AC-2, AC-3, AC-4 and AC-17 are the only ACs never cited in the architecture (verified by set-difference of `AC-[0-9]+` occurrences across both documents). This is **not** a contract violation: the authoring contract requires the traceability matrix to account for every R# and Q#, not every AC, and each of those five ACs cites requirements that are themselves traced. Recorded here so the reader can audit the gap rather than discover it.

**Authoring-contract conformance — checked item by item.** All twelve required sections present (Goal, Scope with all three subsections, Components, Quality characteristics, Design decisions, Threat model, ASVS mapping, Traceability, Limitations, Standards, Status; Inheritance correctly omitted with its attestation in Status). ASVS chapters V1–V14 all dispositioned. All mandatory Clear Thought invocations present or explicitly attested — `metacognitivemonitoring` (line 212), `mentalmodel(first_principles)` (D5, D7, D14, D15, D24, D25), `structuredargumentation` (line 1212), `scientificmethod` (line 1251), `decisionframework` (D1, D2, D10), `collaborativereasoning` (line 1193), `sequentialthinking` (line 1201 attestation naming D5/D7/D8), and `debuggingapproach` attested not-invoked with reasoning (lines 1242–1246). Two contract violations found, both in Finding 4.

## Critical & Serious Findings

### F1 — Serious (recurring). D12's cross-source join key reads a field that does not exist at the path given, and D11's journal never persists it

**What the document says.** D12 (lines 657–661): "Identity is therefore derived on the journal side from **`payload.resourceUrn`** — the one payload field this architecture has verified against Autodesk's published callback shape". D11 (line 601) fixes the journal entry as `{sequence, receivedAt, eventType, payload}`. D27's premise (lines 1148–1150) attributes `resourceUrn` to "the Context7-verified Webhooks payload".

**How the claim was verified.** Context7 `/websites/aps_autodesk_en`, 2026-07-29, two independent lookups. The `dm.version.added` callback reference — the exact Data Management event this design registers — returns a body shaped:

```
{ "version": "1.0",
  "resourceUrn": "urn:adsk.wipprod:fs.file:vf.0zvdp3CoTzWDcZC_wL0kJA?version=1",
  "hook":    { ... },
  "payload": { ext, modifiedTime, creator, lineageUrn, sizeInBytes, hidden,
               indexable, project, source, version, user_info, name, createdTime,
               modifiedBy, state, parentFolderUrn, ancestors, tenant } }
```

`resourceUrn` is a **top-level sibling of `payload`**, not a member of it; the `payload` object's field list contains no `resourceUrn`. The same top-level placement holds in the `extraction.finished`, `contract.created-1.0`, and `issue.created-1.0` reference bodies, so this is the envelope shape, not an event quirk. The URN *value* the document quotes is correct and matches exactly — only its location is wrong.

**Which standard it violates.** The authoring contract's premise-verification requirement (Phase 10, element 5: "what was checked, against what source, with what result") and its deferred-decision prohibition — a join key that cannot be read is a decision not actually resolved. Downstream, spec **R-NOTIFY-2** and **AC-9**'s polling clause depend on this key.

**Why it matters, on two independent legs.** *Leg A* — `payload.resourceUrn` evaluates to undefined for every real callback, so D12's own degradation rule fires on every entry: each journal entry is flagged `identity: unresolved` and reported unjoined. The dedupe D12 promises ("Duplicates across the two sources are collapsed on that normalized pair") never occurs, and every webhook-observed change is reported alongside its poll-observed twin. What the document frames as graceful degradation would be the permanent operating mode. *Leg B, which is worse* — D11's journal entry schema persists only `payload`. Even with the read path corrected, the top-level `resourceUrn` was discarded at write time and is unrecoverable at read time. The architecture as written specifies an event journal that structurally cannot carry its own join key. A fix that only repairs the path leaves Leg B in place.

**What correct looks like.** Change D11's journal entry to persist the identity field as its own member — `{sequence, receivedAt, eventType, resourceUrn, payload}`, capturing the callback body's top-level `resourceUrn` (and, worth considering, the `x-adsk-delivery-id` header, which the same reference documents as the per-delivery identifier). Then have D12 derive identity from that journal field rather than from `payload`. Note for the fix that `payload.lineageUrn` (`urn:adsk.wipprod:dm.lineage:0zvdp3CoTzWDcZC_wL0kJA`) and `payload.source` (identical to `resourceUrn`) exist in the `dm.*` shape as corroborating fallbacks — the lineage suffix is shared with the version URN, which is what makes the D27 grammar normalization work.

**Provenance: recurring.** R11 reported "D12's cross-source dedupe key was not derivable from the event journal under D11's payload-independence rule" as Serious/recurring. The revision fixed the rule-scope half correctly — the scoping paragraphs at lines 625–630 and 654–658 are sound, and once a signature verifies the payload genuinely is authenticated Autodesk data that may be parsed. The field-location half was not fixed. This is the third consecutive round on the same decision and the same property.

## Systemic Patterns

**No systemic patterns** — verified by four proactive scans across the full inventory scope:

1. **Markdown table integrity** (all 7 tables, programmatic cell-count and termination check): 1 defective table (F3), 6 clean. Below the two-instance threshold for a systemic claim.
2. **Config-key orphans** (`grep -o '\b[A-Z][A-Z0-9]*\(_[A-Z0-9]\+\)\+\b'`, 17 distinct identifiers, 15 of them config keys): every config key used anywhere in the document is declared in D21. Zero orphans.
3. **Standards decoration** (bracketed-tag extraction, body lines 1–1391 vs Standards table lines 1392+): 15 tags in the body, all 15 in the table; the table's one extra (`[APS-COMMERCIAL]`) genuinely drove D13's metered categories and D14's cost classes via C4, which the body cites throughout. Every named non-tag standard (ASVS 4.0.3, ISO/IEC 25010:2023, SOLID, RFC 9110, Crash-Only, Twelve-Factor, Google SRE ch. 22, OWASP Threat Modeling, Express 5, Tailscale, pino, zod v4) appears in the table with what it governed. Zero decoration.
4. **Gate C authoring residue** (case-insensitive sweep for `corrected|correction|previously|earlier draft|revision|revised|was wrong|initially|superseded|TODO|TBD|FIXME|scratch` and cross-revision phrasing `unchanged|no longer|as before|still stands`): 3 hits, of which 2 are legitimate (the required metacognitive baseline at line 217; "protocol revision" at 1082) and 1 is a genuine artifact (F4).

## Moderate & Minor Findings

### F2 — Moderate (new). D19's zod citation misattributes both halves of its premise

**What the document says.** D19's premise (lines 917–920): "the zod v4 API documentation states 'When merging object schemas, prefer `A.extend(B)`', and `.merge()`'s documented semantics inherit the second schema's `unknownKeys` policy and catchall … verified via Context7 `/colinhacks/zod` (v4 docs + changelog), 2026-07-29."

**How the claim was verified.** Context7 `/colinhacks/zod`, 2026-07-29, two lookups. The quoted sentence exists in the v4 docs (`packages/docs/content/api.mdx`) but its full text is: "When merging object schemas, prefer `A.extend(B)` **over intersections**. Using `.extend()` will give you a new object schema, whereas `z.intersection(A, B)` returns a `ZodIntersection` instance which lacks common object methods like `pick` and `omit`." Its subject is `z.intersection`, not `.merge()`; the v4 docs state no preference for `.extend()` over `.merge()`. Separately, the `.merge()` unknownKeys/catchall inheritance semantics appear only in `packages/docs-v3/home.md` — the **v3** documentation — as does every `.merge()` reference Context7 surfaces. The v4 docs document `.extend()` and the shape-spread form (`z.object({ ...Dog.shape, breed: z.string() })`).

**Which standard it violates.** The authoring contract's Gate C: "Every Context7-verified claim cites what was verified and when (library, version, date)." Truncating a sentence so that its object changes, and attributing a v3-documented semantic to "v4 docs + changelog", is a premise slot that does not survive the audit it exists to enable.

**Why it matters.** The *decision* is correct and should be kept — composing the completeness envelope via `.extend()` or shape spread is the idiomatic v4 path and is what the v4 docs show. What fails is the evidence: a reader following the citation to check the premise finds a sentence about intersections and a v3 page. Under the two-axis frame this is exactly a correct frame resting on a misreported premise, and it degrades the auditability the premise slot exists to provide.

**What correct looks like.** Cite the two facts to their actual sources: the v4 docs for `.extend()` and the shape-spread composition form (`packages/docs/content/api.mdx`), and the v3 docs for `.merge()`'s unknownKeys/catchall inheritance if that semantic is to be invoked at all — or drop the `.merge()` limb and justify the rule solely on the v4-documented composition forms. (R11 raised a Tentative on this citation's attribution; the revision made the claim more specific rather than resolving it, which is what makes it confirmable now.)

### F3 — Moderate (new). D24's state-store table is malformed, and the render silently deletes a normative rule

**What the document does.** D24's table is declared with three columns (`| Artifact | Owner | Contents & lifecycle |`). The final row, line 1063, carries **four** cells — its trailing cell is the text `All writes` — and line 1064 continues `temp+fsync+rename; all files inside the ACL-protected directory (D10).` with no blank line separating it from the table.

**How the claim was verified.** Read of lines 1061–1068, plus a programmatic scan of all 7 tables in the document (cell-count per row against header, and blank-line termination), which flagged exactly these two lines and nothing else.

**Which standard it violates.** GitHub-Flavored Markdown table semantics: cells beyond the header count are discarded, and a non-row line immediately following a table row terminates the table. First-principles articulation for why this is a defect rather than a typo — the goal of the state-store section is that a planner reads one enumeration and knows every durability obligation and the discipline governing it; the shortcut that fails the goal is treating a normative rule as trailing prose it can be run into; the rendered result is that the rule's subject is deleted.

**Why it matters.** The lost text is not decoration. "All writes temp+fsync+rename; all files inside the ACL-protected directory (D10)" is the single sentence binding the entire state store to the atomicity and ACL disciplines that D8's rotation journal, D10's credential store, and spec R-REL-7 all depend on. In the rendered document the words "All writes" vanish and the reader is left with the fragment "temp+fsync+rename; all files inside the ACL-protected directory (D10)." — a sentence with no subject, immediately below a table, where a normative rule should be.

**What correct looks like.** Close the `events.ndjson` row at three cells, then start a new paragraph after a blank line: "All writes are temp+fsync+rename; all files live inside the ACL-protected directory (D10)."

### F4 — Moderate (new). D1's "(unchanged rejection)" is Gate C residue and leaves an element-4 alternative with no stated reason

**What the document says.** D1's rejected-alternatives slot (lines 265–270) names four alternatives. Three carry reasons: Cloudflare Tunnel (score 0.63 vs 0.90, new vendor and daemon, exposes the whole app), Caddy + port-forward (0.50, new software, public IP/ACME/router upkeep), and tailnet-only-without-webhooks (rejected because R-NOTIFY-1 requires functional registration). The fourth reads in full: "Not TLS in the Node process **(unchanged rejection)**."

**How the claim was verified.** Read of lines 265–270; grep across the document for cross-revision phrasing (`unchanged|no longer|as before|still stands|re-stated|now correctly|now states|remains as`) returning this as the sole substantive hit.

**Which standards it violates — two, at one location.** (a) The authoring contract's Gate C structural checklist: "No internal reasoning artifacts, self-corrections, or scratchpad content remain in the document." "Unchanged" is a revision-tracking annotation whose antecedent is a prior draft the delivered document does not contain and the reader cannot see. (b) Phase 10, element 4: alternatives must be "named explicitly with the reason each is wrong," and the contract is emphatic that "copying a correct recommendation is easy … explaining why the wrong alternatives are wrong demonstrates actual understanding rather than lookup." This alternative substitutes a pointer to revision history for its rejection rationale.

**Why it matters.** Terminating TLS in the Node process instead of at tailscaled is a real architectural fork with real consequences — certificate lifecycle, ACME, the mTLS interaction D2 discusses, and the trust-path residual recorded in Limitation 2. A reader evaluating whether D1's topology is sound gets no reason at all for rejecting it. R11 swept for exactly this artifact class and removed three instances; this one survived the sweep.

**What correct looks like.** Replace the parenthetical with the actual reason — e.g. "Not TLS in the Node process: tailscaled already provisions and terminates TLS for both the serve and funnel paths, so in-process TLS would duplicate that machinery and add certificate lifecycle management the overlay already owns."

## Tentative Findings

### T1 — D27's "exactly what tools 5/6/7/35 return" rests on an unverifiable ID-format premise

D27 (line 1131) states that tools 23–26 take a `version_id` in the form `urn:adsk.wip…:fs.file:vf.…?version=N`, "exactly what tools 5/6/7/35 return". I confirmed from the introspected schema that all four of those tools do return an `ItemVersion`-typed id (tool 5 and tool 7 via `tipVersion`, tool 6 via `tipVersion.id` on matches, tool 35 via `itemVersions`), so the claim reduces cleanly to a single question: **is `ItemVersion.id` the Data Management version-URN form?**

That question is not answerable with the instruments available. The introspection types the field `ID!` and carries no format information. Two pieces of evidence pull in opposite directions: the `dm.version.added` callback confirms the version URN `urn:adsk.wipprod:fs.file:vf.<suffix>?version=N` shares its opaque suffix with the lineage URN `urn:adsk.wipprod:dm.lineage:<suffix>`, which makes the mapping plausible; but the repo's own recorded live samples (`prior-session-artifacts/aps-api-verified-facts.md` §3, and a verbatim tool result in `FINDINGS.md`:31) show MFG **item** ids in `dm.lineage` form and componentVersion ids as opaque base64 — neither of which is the version-URN form. No live `ItemVersion.id` sample is recorded anywhere in the repo, and prior-artifact claims are candidates rather than findings under this review's own rules.

**Verification that would close this:** a live `itemVersions(hubId:, itemId:)` query returning `results { id versionNumber }`, run through `docs/apsq.mjs` (the repo's working authenticated MFG client, per `HANDOFF.md`), with the returned `id` inspected for the `fs.file:vf.…?version=` grammar. If it does not match, D27's Fusion-side reachability claim needs a derivation step the document does not currently specify, and Limitation 8's "Unverified-by-tool items: none load-bearing" becomes inaccurate. Note that AC-7's non-Fusion path is unaffected either way — it runs through tool 36 and D23's DM pipeline, which returns DM ids natively.

## Observations

- The header's disclosure that the spec file's own `Status:` line still reads "Draft for review" while `HANDOFF.md` records a five-round PASS is accurate on both limbs (verified by Read of spec line 3 and HANDOFF). Flagging the discrepancy to the owner rather than silently resolving it is the correct handling for governance metadata the architecture does not own.
- The document is candid that AC-25 is expected to fail acceptance until the owner rules on the C2/R-REL-7 contradiction, and instructs downstream phases not to record it as satisfiable. Recording an unresolvable upstream contradiction rather than reinterpreting it around itself is the right disposition; no standard is violated, so this is not a finding.
- `Mutation` is present in `docs/aps-mfg-schema.json` as a type with 45 fields, but the introspection dump's `mutationType` pointer is absent (the top-level schema object carries only `queryType` and `types`). This does not affect any claim the architecture makes — all eight mutations it names are real `Mutation` fields — but a tool that resolves mutations through `mutationType` will find none, which is worth knowing before the build introspects this file.

## What's Actually Good

- **D5's type-located field enumeration is the strongest premise slot in the document, and it holds exactly.** I re-derived every claim programmatically against `docs/aps-mfg-schema.json`: the `Item` interface carries precisely the twelve fields named "and nothing else"; `fusionWebUrl` is present on exactly the six types named and absent from `ComponentVersion`; `tipRootComponentVersion` exists on `DesignItem` only; the schema has exactly nine `ComponentVersion`-typed fields and `ConfigurationRow.rootConfigurationMember` is among them; `ComponentVersion` carries partNumber/partDescription/materialName/isMilestone/lastModifiedOn+By/createdBy and has **no** `versionNumber` and **no** `createdOn`; `DesignItemVersion` and `ConfiguredDesignItemVersion` both carry versionNumber+createdOn; `ConfigurationTable.rows` is `[ConfigurationRow]!` with zero arguments, confirming the "API-unpaginated, so the bound is tool-level" claim. Not one discrepancy across roughly forty checks. By the authoring contract's element-5 standard this is what a verified premise slot is supposed to look like, and it is unusual to find one that survives independent re-derivation at this density.
- **The tool inventory's completeness accounting reconciles under independent recomputation.** Classifying all 36 rows myself from the Returns column: 20 list-returning, 16 single-object — matching the document. The disposition partition (13 cursor-paged, 6 bounded-single-response, 1 merged-source resumable = 20) is exact and every member is correctly assigned. The R-class basis enumeration reconciles (13 MFG-backed + 3 MD + 3 DA + 3 Webhooks/DM = 22), as does the W-class annotation matrix (5 destructive + 6 additive = 11, with `idempotentHint` inverted across exactly that partition), and 22 + 11 + 3 = 36. The group file counts (1+6+6+9+6+4+4) also sum to 36. Against [MCP-TOOLS]' schema-and-annotation discipline and spec R-DISC-4's explicit-completeness requirement, this is a contract a reviewer can mechanically diff against `tools/list`, which is precisely what AC-16 asks for. R11's tool-34 disposition finding is closed by construction rather than by relabeling.
- **D14's annotation matrix rests on correctly-read SDK defaults.** Context7 `/modelcontextprotocol/typescript-sdk`, 2026-07-29, `ToolAnnotationsSchema`: `destructiveHint` defaults **true**, `idempotentHint` defaults **false**, `openWorldHint` defaults **true**. The document's inference — that W-class tools must set `destructiveHint` explicitly because the permissive value is the default, and that idempotent tools must set `idempotentHint:true` explicitly — follows correctly from those defaults. Getting a default backwards here is the classic way truthful-annotation requirements (spec R-PROTO-4) fail silently; this one is right.
- **D3's Origin-middleware reasoning is verified down to the SDK source, and it discloses an interaction that would otherwise mislead its own reviewer.** Context7 confirms `validateRequestHeaders` guards origin with `if (originHeader && !this._allowedOrigins.includes(originHeader))` — a missing or empty Origin is never rejected — so the permissive-absent rule genuinely concedes nothing relative to what it replaces. Separately, D3 states that because the bearer gate precedes the Origin check, a reviewer probing AC-13's 403 case without a valid bearer secret will observe 401 and wrongly conclude S-4 is unimplemented. Naming the way your own acceptance criterion can be mis-executed is the reviewer-persona property Gate A exists to produce, and it is rarely present.
- **D18's safe/cost type-pairing is grounded in a real, verified counterexample rather than an abstraction.** The schema confirms `ComponentVersion.derivatives(derivativeInput: DerivativeInput{outputFormat, generate})` — a billable job submission reachable entirely through the query half of the schema, with no mutation involved. That makes the argument "GraphQL's query/mutation split is a schema-authoring convention, not a safety guarantee" a verified fact about this API rather than a general caution, and it correctly justifies drawing the retry boundary on the (safe, cost) pair instead of on RFC 9110 §9.2.2's method contract alone. The predecessor's `readOnlyHint: true` over `generate: true` (confirmed at `src/tools/mfg-data-model.ts`:480 and :497) is exactly the defect this closes.

## Convergence Record

**Round:** 12 (post-fix).

**Trajectory:** R9: 6 → R10: 4 → R11: 6 → **R12: 4**.

**Flow counts for R12** (provenance per finding; each closure re-derived from current source against the standard originally named):

- **Prior findings closed: 5.**
  - R11#1 (state-store omitted the DA WorkItem output record) — closed. `da-workitems.json` present at line 1062 with owner, key shape, write/read/prune lifecycle, and a non-re-derivability justification. A sweep of every persistence claim in the document found all nine durable obligations enumerated, with no unlisted obligation.
  - R11#2 (no HTTP request-body limit) — closed. D3 mounts `express.json({ limit: HTTP_MAX_BODY_BYTES })` ahead of the transport; Context7 `/expressjs/express` confirms the `'100kb'` default the finding rested on; the derived minimum `ceil(UPLOAD_MAX_BYTES × 4/3) + 1 MB` is arithmetically correct for base64 expansion, is startup-asserted, and is declared in D21.
  - R11#3 (D12 dedupe key not derivable) — **not closed**; see F1.
  - R11#4 (three Gate C artifacts) — those three closed; the full-document artifact sweep returned only legitimate hits plus one new instance at a different location, reported as F4 rather than as this finding's non-closure.
  - R11#5 (tool 34 in a class whose definition it failed) — closed. A third disposition class is defined with its distinguishing property, tool 34 is its sole enumerated member, and the 13/6/1 = 20 and 20 + 16 = 36 arithmetic reconciles under independent recomputation.
  - R11#6 (false threat-ordering claim) — closed. The revised claim that the authoring contract's Phase 11 structure mandates Threat model after Design decisions is **true**: SKILL.md's Phase 11 output structure lists `## Design decisions` before `## Threat model`.
- **New findings: 3** (F2, F3, F4).
- **Recurring: 1** (F1).
- **Regressions: 0.**

**Tripwire evaluation — NOT FIRED**, with arithmetic shown for both conditions.

- *Condition (a): new + regression ≥ closed, for two consecutive post-fix rounds.* R12: 3 + 0 = 3 vs 5 closed → 3 ≥ 5 is **false**. The condition fails this round, so it cannot hold across two consecutive rounds ending here. (For completeness: R11 satisfied it at 4 + 0 = 4 vs 4 closed; R10 did not, at 4 + 0 = 4 vs 6 closed. The streak was one round and R12 breaks it.)
- *Condition (b): total findings has not strictly decreased, for two consecutive post-fix rounds.* R10: 4 < 6 → decreased. R11: 6 ≮ 4 → did not decrease (streak = 1). R12: 4 < 6 → decreased, streak broken at 1. **False.**

Neither condition holds, so the tripwire does not fire and foundational rework is not indicated. The trajectory supports that reading independently: the closure rate this round is the highest of the four tracked rounds, no regressions have appeared in any round, and three of this round's four findings are documentation-integrity defects rather than design defects.

## Recommended Priority

1. **F1 first, and fix both legs.** It is the only finding that changes the build, and repairing only the read path leaves the journal schema unable to carry the key. Change D11's journal entry to persist the callback's top-level `resourceUrn` as its own member, then have D12 read identity from that field. Until this lands, spec R-NOTIFY-2's merged change feed is specified in a way that cannot deduplicate.
2. **F3 next** — it is a one-line edit and it restores a normative rule that D8, D10, and R-REL-7 all lean on but that the rendered document currently deletes.
3. **F4 and F2** — both are evidence-integrity repairs with no design consequence. F4 needs a real rejection reason written in place of the revision annotation; F2 needs its two citations pointed at the pages that actually say what is claimed.
4. **T1 alongside the above.** One `itemVersions` query through `docs/apsq.mjs` either discharges it or converts it into a real finding about D27's reachability claim and Limitation 8's accuracy. It is cheap and the client is already in the repo.

Verdict: NEEDS FIXES (4 findings: 1 Serious-recurring, 3 Moderate-new)
