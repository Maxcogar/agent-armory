# Architecture — APS Fusion MCP Server

**Status:** Delivered for review
**Author:** architecture phase, expert-architecture
**Date:** 2026-07-30
**Input spec:** `docs/specs/spec-aps-fusion-mcp-server.md` — review status per `HANDOFF.md`
(2026-07-29): PASS after five independent blinded rounds, zero findings, with one subsequent
amendment: R-REL-7's crash clause and AC-25 were rewritten (commit `063af2e`) to state achievable
properties under C2, and that amendment has not itself been reviewed — it owes its own review
round. This document designs against the amended text (D8; Limitation 7). Note: the spec file's
own `Status:` line still reads "Draft for review" — stale governance metadata flagged to the
owner; this document does not resolve the discrepancy itself.
**Owner inputs received 2026-07-28:** (1) the APS app and the Fusion subscription are in the **same
Autodesk team** (C4's included MFG allowance applies); (2) the hosted deployment target is a
**computer the owner controls**; (3) no Fusion Automation job is selected yet (per D-9/§2.2 of the
spec, non-blocking); (4) the owner accesses all hosted services through his **existing Tailscale
tailnet** and is their sole user — no Cloudflare or Caddy in the stack.

---

## Goal — what this architecture serves

Turn the spec's 60 requirements into a buildable single-process TypeScript server in which every
security property is enforced by **structure** (middleware, module boundaries, single enforcement
points) rather than by per-handler convention — because the predecessor's failures were exactly
convention failures: an unauthenticated endpoint that every mode mounted, a billable call inside a
"read", one handler that forgot the quoting rule its siblings followed, and a credential wiped by
an error class nobody had partitioned. Correct here means: a planner can derive file-level steps
without architecting, a reviewer can check each control at a named point, and no requirement is
satisfied only by "the handlers all remember to." The local-optimum trap that threatens this
architecture most directly is mirroring the predecessor's layout (it is the most available
reference and it compiles) — this document re-derives every structural choice from the spec and
named standards, and uses the old code only as defect evidence.

## Scope

**In scope.** Component structure and module layout; transport and deployment topology (hosted +
stdio dev); caller-authentication mechanism; Autodesk OAuth/token lifecycle design; credential
store; all four APS gateway designs (MFG GraphQL, Data Management, Model Derivative, Design
Automation); webhook receive/verify/replay design; polling design; spend control; the MCP tool
inventory and its contract rules; error, logging, config, truncation/sanitization, SSRF-egress,
and state-persistence designs; threat-model-to-control mapping; test seam.

**Deferred, with reasoning.** (a) Exact GraphQL document text and REST bodies — implementation
detail below architecture altitude; the shapes are pinned by the introspected schema and §13 Q-3.
(b) Individual Fusion Automation job programs — owner inputs per spec D-9; the subsystem contract
is fixed here. (c) Activity-specific argument names — implementation-level per spec §13 Q-3.
(d) The plan's step ordering and test list — /expert-plan's output, consuming this document.

**Out of scope.** Everything spec §2.2 excludes (Fusion Operations, multi-user identity, AEC/Vault/
Tandem services, viewer UI); re-platforming (stack is fixed by C9); any change to the spec's
requirements.

## Components and structure

One Node.js ≥18 process (TypeScript, `@modelcontextprotocol/sdk` v1.29.x, Express 5, zod v4,
pino). The process always binds **127.0.0.1**; the listener set is mode-dependent (D1). Hosted
mode runs the main listener (MCP/auth/health), published to the owner's tailnet via `tailscale
serve` — never to the public internet — plus a webhook-only listener published via `tailscale
funnel` **only when webhooks are enabled**; stdio mode runs a single dev-login aux listener
(D1). Layers, dependency direction strictly downward:

```
src/
  index.ts                 Composition root: config → logger → services → routes → transports.
                           Mounts middleware in fixed order (bearer gate → origin check → JSON
                           body parser → transport) (D3).
                           Selects stdio (--stdio) and/or HTTP serving per config.
  config.ts                All configuration: zod-validated at startup, read once, typed export (D21).
  logging.ts               pino instance: stderr (stdio mode) or file+stderr (HTTP mode); redact paths (D20).
  http/
    mcp-route.ts           POST /mcp: per-request McpServer+transport (stateless), after auth gates (D2, D3).
    auth-routes.ts         GET /auth/login (PKCE authorize redirect), GET /auth/callback (code exchange) (D9).
    webhook-route.ts       POST /webhooks/aps on the DEDICATED webhook listener (public via Funnel):
                           express.raw body → HMAC verify → replay dedupe → event journal (D11).
    health-route.ts        GET /healthz: liveness + auth-state summary, no secrets (D25).
    middleware.ts          Bearer gate (timingSafeEqual), Origin validation (403), loopback-bind assertion (D2, D3).
  services/
    token-manager.ts       Sole owner of the credential file. Single-flight refresh, cross-process
                           advisory lock, journal-before-refresh, atomic persist, failure classification (D8, D10).
    aps-http.ts            The only outbound HTTP path: egress allowlist (SSRF), AbortSignal timeouts,
                           bounded retries by declared operation safety (D18), 429/5xx classification, and the
                           mandatory per-request cost tag gating SpendGuard (D13, D18, D22).
    spend-guard.ts         Persisted counters + configured caps gating every billable call (D13).
    output-guard.ts        The single truncation mechanism + external-content neutralization (D19).
    state-store.ts         Atomic JSON state dir; D24 enumerates its full contents: spend counters,
                           webhook dedupe hashes, per-hook webhook secrets, poll markers +
                           resume position + cross-poll dedupe set, refresh journal, auth-state
                           classification, PKCE verifiers, DA WorkItem output records, and the
                           event journal (D24).
  gateways/
    mfg-gateway.ts         ALL MFG GraphQL v2: static operation catalog, variables-only, cursor
                           aggregation, domain-typed results. The v2→v3 blast-radius wall (D5, D6, D7).
    dm-gateway.ts          Data Management REST: browse, storage+signed-S3 upload pipeline,
                           rollup-based change polling (D12, D23).
    md-gateway.ts          Model Derivative REST: translate (billable); manifest/object tree/
                           properties/derivative-download URL (free).
    da-gateway.ts          Automation v3: activity enumeration, WorkItem submit/status, DM-storage outputs (D23).
  tools/
    auth-tools.ts          1 tool     (spec §6.7)
    discovery-tools.ts     6 tools    (§6.1)
    read-tools.ts          6 tools    (§6.2)
    write-tools.ts         9 tools    (§6.3; incl. tool 36 upload — D27)
    export-tools.ts        7 tools    (§6.4)
    automation-tools.ts    4 tools    (§6.5)
    notify-tools.ts        4 tools    (§6.6)
```

Tool handlers are thin and uniform: zod-validate → gateway call → `structuredContent` + text
render, `isError` on failure. Handlers never construct GraphQL, URLs, or HTTP requests — and they
never invoke OutputGuard themselves: **every tool is registered through a single
`registerGuardedTool(server, def, handler)` wrapper in the composition root**, which applies
OutputGuard to every `CallToolResult` before it is returned; direct `server.registerTool` calls
are prohibited (D19), so unguarded output is a composition-level defect visible in review, not a
per-handler omission.

**Data flow (hosted).** MCP client (owner device on the tailnet) → `tailscale serve` (WireGuard +
ts.net TLS) → main loopback listener → bearer gate → origin check → JSON body parser →
per-request transport → tool handler → gateway → `aps-http` → Autodesk. Webhooks (when enabled): Autodesk → Tailscale Funnel
(public HTTPS, tailscaled-terminated TLS) → webhook-only loopback listener → `POST /webhooks/aps`
(raw body) → HMAC → dedupe → event journal → readable via `aps_notify_changes_since`. With Funnel
off, nothing on the machine is publicly reachable and change detection runs on polling (D12).

### Tool inventory (contract-grade)

Effect classes: **R** = read-only and free, with the costlessness basis stated per backing API
(`readOnlyHint:true`): **MFG-backed reads** (tools 2–12, 22, 35) carry no metered charge
under the subscription-included allowance (C4 — MFG becomes priced 2026-08-17; the
owner-confirmed same-team placement makes the allowance apply; Limitation 11); **Model
Derivative reads** (24, 25, 26, 37) are free because Model Derivative meters *translation jobs*, not
derivative/manifest retrieval; **Design Automation reads** (27, 29, 30) are free because
Automation meters *WorkItem processing time*, not status or output listing; **Webhooks and Data
Management reads** (1, 32, 34 — tool 1's auth probe is the Data Management call D8 specifies,
deliberately not MFG) are unmetered APIs. (Tools 13–20, 21, 23, 28, 31, 33, 36 are not R-class;
their classes are in the table below.) **W** = write, non-destructive
unless noted (`readOnlyHint:false`). **$** = metered cost: contract text states cost, SpendGuard
gates it, `readOnlyHint:false`. All tools declare full zod input schemas and `outputSchema`.

| # | Tool | Class | Inputs (essentials) | Returns (structured) | Spec |
|---|------|-------|--------------------|-----------------------|------|
| 1 | `aps_auth_status` | R | – | validity-checked auth state (live probe), login URL when unauthenticated | R-AUTH-1 |
| 2 | `aps_list_hubs` | R | pagination cursor? | hubs[] + pageInfo | R-DISC-1 |
| 3 | `aps_list_projects` | R | hub_id, cursor? | projects[] + pageInfo | R-DISC-1 |
| 4 | `aps_list_folders` | R | project_id, hub_id (required when `parent_folder_id` is given), parent_folder_id?, cursor? | folders[] via `foldersByProject(projectId!)` (no-parent branch) or `foldersByFolderInHub(hubId!, folderId!)` (by-parent branch — the schema requires the hub id, so the input carries it) + pageInfo | R-DISC-1/3 |
| 5 | `aps_list_folder_items` | R | hub_id, folder_id, cursor? — backing `itemsByFolder(hubId!, folderId!)` takes exactly these; no project id is accepted because the query does not consume one | items[] + pageInfo. Backing type is the `Item` **interface**: id, name, extensionType, createdOn/By, lastModifiedOn/By come from interface fields; each row carries its concrete type (`__typename`); tip-version data (`tipVersion{id, versionNumber, lastModifiedOn}`) comes via inline fragments on **all four** concrete types (BasicItem, DesignItem, ConfiguredDesignItem, DrawingItem — each carries `tipVersion`, schema-verified) | R-DISC-1/3 |
| 6 | `aps_find_design` | R | name filters (hub/project/design), cursor? | typed matches + completeness; server-side fan-out capped per D7's search extension (`MFG_SEARCH_MAX_PROJECTS`), cursor resumes the scan. Match typing (schema-verified): `DesignItem` matches carry `tipRootComponentVersion.id` (the only type bearing it, via `... on DesignItem`); `ConfiguredDesignItem` matches carry `tipVersion.id`, a `configured:true` flag, and per-row root component versions via `tipConfigurationTable.rows[].rootConfigurationMember`, returned as `configurationRows[]{rowId, rowName, rootComponentVersionId}` bounded at the first `MFG_SEARCH_ROW_LIMIT` rows (config, default 25; `rows` is API-unpaginated so the bound is tool-level) with `truncated:true` + guidance to tool 7 when larger; Basic/Drawing matches return typed hub/project/item ids only | R-DISC-2 |
| 7 | `aps_get_design_metadata` | R | discriminated union: `{item_id, hub_id, composition?}` (composition = WORKING/RELEASED/AS_SAVED/LATEST via `Query.item(composition:)`) **or** `{component_version_id}` (already a specific version; composition not accepted) | Field provenance (schema-verified): **item branch** — interface fields (name, created/modified by+on) directly; `... on DesignItem` → `tipRootComponentVersion` supplies partNumber/partDescription/materialName/isMilestone and `tipVersion` (DesignItemVersion) supplies versionNumber/createdOn; `... on ConfiguredDesignItem` → `tipVersion` supplies versionNumber, and part-level fields come **per configuration row** via `tipConfigurationTable.rows[].rootConfigurationMember`: with the optional `configuration_row_id` input, that row's root `ComponentVersion` supplies partNumber/partDescription/materialName/isMilestone; without it, the tool returns the row list `{rowId, rowName, rootComponentVersionId}` (bounded at `MFG_SEARCH_ROW_LIMIT`, truncation explicit) for the caller to select from; Basic/Drawing items → interface + tipVersion metadata only, typed. **componentVersion branch** — partNumber/partDescription/materialName/isMilestone/lastModifiedOn+By/createdBy directly on `ComponentVersion`; versionNumber/createdOn via `designItemVersion → DesignItemVersion`, falling back to `configuredDesignItemVersion → ConfiguredDesignItemVersion` (both carry versionNumber+createdOn, schema-verified); absent-with-reason when neither resolves | R-READ-1/6 |
| 8 | `aps_get_assembly_structure` | R | componentVersion id, max_pages?, cursor? | full line data: per-node id/name/partNumber/material + derived quantity; `truncated`+cursor when capped, and the cursor passed back resumes the scan (D7) | R-READ-2 |
| 9 | `aps_get_physical_properties` | R | componentVersion id | mass/volume/density/area/bbox with units | R-READ-3 |
| 10 | `aps_where_used` | R | componentVersion id, cursor? | containing assemblies + pageInfo | R-READ-4 |
| 11 | `aps_get_custom_properties` | R | componentVersion id, cursor? | custom properties + their definitions; pageInfo via the schema's `Properties{results, pagination}` connection | R-READ-5 |
| 12 | `aps_get_design_assets` | R | discriminated union (same partition as tool 7): `{item_id, hub_id}` — backing `item(hubId!, itemId!)` requires both — **or** `{component_version_id}` (backing `componentVersion(componentVersionId!)`, no hub id); plus cursor? | drawings list (cursor-paged) + pageInfo, thumbnail signed URL + expiry, Fusion web URL (resolved via `designItemVersion`, falling back to `configuredDesignItemVersion` for configured designs; absent only when neither resolves) | R-READ-5 |
| 13 | `aps_set_custom_properties` | W (destructive) | componentVersion id, {definitionId,value}[] | applied properties (re-readable); **bounded-single-response** — the returned list is bounded by the caller's own input array; overwrites prior values — `destructiveHint:true` | R-WRITE-1 |
| 14 | `aps_create_property_definition` | W | collection id?, name, type, behavior | created definition (+collection create/link when needed) | R-WRITE-1 |
| 15 | `aps_create_folder` | W | project_id, parent_folder_id, name | created folder | R-WRITE-2 |
| 16 | `aps_rename_folder` | W (destructive) | folder id, new name | updated folder; replaces the prior name — `destructiveHint:true` | R-WRITE-2 |
| 17 | `aps_move_folder` | W (destructive) | folder id, target parent | moved folder; replaces the prior location — `destructiveHint:true` | R-WRITE-2 |
| 18 | `aps_copy_folder` | W | folder id, target parent | copied folder | R-WRITE-2 |
| 19 | `aps_delete_folder` | W (destructive) | folder id | deletion confirmation; `destructiveHint:true` | R-WRITE-2/4 |
| 20 | `aps_create_design_from_file` | W | project_id, target folder, **file bytes (base64 content, size-bounded) — no filesystem path accepted** (D28), name | created design item (via DM storage + signed-S3 upload → `createDesignFromFile`) | R-WRITE-3 |
| 21 | `aps_export_generate` | **$** | componentVersion id, format ∈ {STEP,STL,OBJ} | derivative job handle + status; cost stated in contract | R-EXPORT-1/5 |
| 22 | `aps_export_status` | R | componentVersion id, format | status + signed URL + expiry when ready; **generate:false path — cannot bill by construction** | R-EXPORT-2/5 |
| 23 | `aps_md_translate` | **$** | version_id (URN-grammar-validated; D27), format ∈ {IGES,DWG,FBX,IFC,SVF2,…} | translation job accepted; cost stated | R-EXPORT-3/4 |
| 24 | `aps_md_get_manifest` | R | version_id (D27) | translation status + derivative list (bounded: one version's manifest) | R-EXPORT-3/5 |
| 25 | `aps_md_get_object_tree` | R | version_id (D27), viewable guid, object id?, level? | object tree (foreign CAD included), **bounded-single-response**: sub-tree narrowing via the endpoint's `objectid`/`level` parameters is the bounding mechanism (the API enforces a 20 MB ceiling requiring `forceget`, refusing above ~800 MB); truncation carries narrowing guidance | R-EXPORT-4 |
| 26 | `aps_md_get_object_properties` | R | version_id (D27), guid, object ids?, cursor? | per-object properties, **cursor-paged** via the `properties:query` endpoint's native `pagination{offset,limit}` (limit 1–1000), with `totalResults` feeding the completeness fact; `object_ids` is an optional narrowing filter, not the paging contract | R-EXPORT-4 |
| 27 | `aps_da_list_activities` | R | cursor? | activities available to the app: name + declared inputs; pageInfo via DA `paginationToken` | R-AUTO-5 |
| 28 | `aps_da_submit_workitem` | **$** | activity name, declared-input argument **values** (never `url`/`verb`/`headers` — the gateway mints every WorkItem URL from DM ids, D28), output target folder? | WorkItem id + initial status; cost stated | R-AUTO-1/3 |
| 29 | `aps_da_get_status` | R | workitem id | status enum + report URL | R-AUTO-2 |
| 30 | `aps_da_get_outputs` | R | workitem id | output items/signed URLs (bounded: the output set recorded at submission) | R-AUTO-2 |
| 31 | `aps_notify_register_webhook` | W | event types, scope (folder/project) | registered hook ids — one hook per event type, each with its own generated secret persisted to `webhook-secrets.json` (D11); callback = WEBHOOK_PUBLIC_URL/webhooks/aps; actionable error naming the config key when no Funnel/WEBHOOK_PUBLIC_URL is configured | R-NOTIFY-1 |
| 32 | `aps_notify_list_webhooks` | R | cursor? | registered hooks; pageInfo via Webhooks `pageState`/`next` | R-NOTIFY-1 |
| 33 | `aps_notify_delete_webhook` | W (destructive) | hook id | deletion confirmation; removes the hook's entry from `webhook-secrets.json` (D11) | R-NOTIFY-1 |
| 34 | `aps_notify_changes_since` | R | marker (data-derived high-water time), since_sequence? (event-journal position), resume_position? (folder-queue cursor from a truncated poll), scope? | changes from the event journal (webhook-fed, selected by sequence) merged with the DM rollup poll and de-duplicated on (itemId, versionId); **merged-source resumable via three named fields (D12):** the response returns `marker` (Autodesk-clock, advances only over fully scanned ground), `sequence` (highest journal entry emitted), and — when `truncated:true` — `resume_position`; a caller passes back whichever it holds | R-NOTIFY-2 |
| 35 | `aps_list_item_versions` | R | hub_id, item_id, cursor? | versions[] (id, versionNumber, createdOn, lastModifiedOn — all `ItemVersion`-interface fields, schema-verified) + pageInfo — via the schema's `itemVersions` query (discovery group) | R-DISC-1 |
| 36 | `aps_upload_file` | W | project_id, target folder, **file bytes (base64 content, size-bounded) — no filesystem path accepted** (D28), name | uploaded file as a new DM item + version ids (any file type, via D23's storage pipeline — the foreign-CAD ingestion path, D27); `destructiveHint:false`, `idempotentHint:false` (write group) | R-EXPORT-4 |
| 37 | `aps_md_get_derivative` | R | version_id (D27), derivative_urn (a derivative's URN from tool 24's manifest listing) | the retrieval limb of the MD submit/status/retrieve split: signed download URL, the signed cookies required to use it, size, content type, and expiry for **one** translated derivative, via MD's `…/manifest/:derivativeUrn/signedcookies`. The URL is **fetched by the caller, not the server** — the server's only outbound call is the signed-cookies request to the allowlisted API host (D22), so the download host never enters the egress path (export group, export-tools.ts) | R-EXPORT-3/5 |

Every list-returning tool carries one of three stated dispositions (R-DISC-4), and the quantified
set is enumerated here — every inventory row returning a list appears in exactly one
class. **Cursor-paged** (takes an optional cursor, returns `pageInfo{hasMore, cursor}` backed by
the API's native paging): tools 2–6, 8, 10, 11, 12, 35 (MFG connection cursors — every listing
type in the schema, including `Properties{results, pagination}`, is a paginated connection); tool
26 (MD `properties:query` `pagination{offset,limit,totalResults}`, verified via Context7
2026-07-28); tool 27 (DA `paginationToken`/`pagestring`, verified 2026-07-28); tool 32 (Webhooks
`pageState`/`next`, verified 2026-07-28).
**Bounded-single-response** (the backing API returns one bounded document; the tool states its
bounding mechanism): tool 24 (one URN's manifest); tool 25 (`objectid`/`level` sub-tree
narrowing; API-enforced 20 MB/`forceget` ceiling); tool 30 (the output set recorded at
submission); tool 13 (bounded by the caller's own input array); tool 31 (registered hook ids —
bounded by the caller's own event-type array); tool 7 (the configuration-row list, bounded at
`MFG_SEARCH_ROW_LIMIT`, tool-level — `rows` is API-unpaginated). **Merged-source resumable** —
one member, tool 34, which fits neither class above because it merges a local append-only journal
with a bounded remote descent rather than paging one API: it takes and returns *named* position
fields (`marker`, `sequence`, `resume_position`) instead of an opaque cursor + `pageInfo`, per
D12's deliberate two-clock separation, and signals completeness with `truncated`. **The
quantified set, derived from the Returns column of all 37 rows:** 20 rows return lists —
cursor-paged {2, 3, 4, 5, 6, 8, 10, 11, 12, 26, 27, 32, 35}, bounded-single-response
{7, 13, 24, 25, 30, 31}, merged-source resumable {34} — and the remaining 17 rows return single
objects or scalars. Either way a truncated result says so explicitly. No tool forks between free and billable behavior on a parameter — cost class is
a tool boundary (D14).

## Quality characteristics addressed (ISO/IEC 25010:2023)

| Characteristic | Spec source | How advanced | Decisions |
|---|---|---|---|
| Security | §8 S-1..S-14, §4 | Structural controls per threat; single enforcement points; ACL'd store; PKCE; egress allowlist; validated external identifiers; no caller-directed local I/O | D1, D2, D3, D6, D8–D13, D17, D19, D20, D22, D27, D28 |
| Reliability | R-REL-1..7 | Timeout-bounded outbound; classified refresh failures; atomic rotation and durable state; bounded safe-only retries; single truncation; non-fatal runtime errors | D8, D16, D18, D19, D21, D24 |
| Functional suitability | §6 R-* | Tool inventory maps 1:1 onto §6 capabilities against verified schema shapes | D5, D7, D14, D15, D23 |
| Maintainability | §2.3, C4 (v2→v3 risk) | GraphQL confined to one gateway; layered modules, single responsibility; typed domain seams; injectable I/O seams | D4, D5, D6, D26 |
| Compatibility (interoperability) | R-PROTO-1..6 | MCP 2025-11-25 conformance via SDK v1.29; structured output everywhere; truthful annotations | D3, D14, D17 |
| Interaction capability | R-OPS-1/4/5, S-9 | Cost visible per contract; actionable errors; explicit completeness; per-call logging; documented Windows run procedure | D1, D14, D16, D20, D25 |
| Flexibility (installability/adaptability) | C7, D-1 | Loopback-listener contract published via Tailscale Serve/Funnel (two config URLs); webhooks optional without capability loss; Windows 11 first-class; stdio dev path | D1, D3, D12, D21 |
| Performance efficiency | R-REL-5, query-point budget | **Bounded, not optimized** — page caps, point-budget-aware pagination, truncation; the spec sets no latency targets | D7, D19 |
| Safety | — | Not addressed: no physical-harm surface; out of scope by spec silence | — |

## Design decisions

**Knowledge-state baseline (metacognitivemonitoring, session start).** Domain knowledge assessed
proficient (0.6 confidence) with four recorded limitations: SDK v1.29.0 surface, MFG schema
shapes, Windows credential mechanics, and old-server behavior all required in-session
verification, not memory. Biases named and guarded: availability bias toward the predecessor's
layout, recency bias toward common Express patterns, anchoring on a stale CORE recall
("local stdio") superseded by the spec's hosted-primary D-1. Every claim below marked *verified*
was checked this session against the named source.

Each decision: **Decision / Standard / Why here / Not / Premise** (five-part format). R#/S# = spec
requirements addressed.

---

**D1. Topology: always-loopback process; MCP surface published tailnet-only via Tailscale
Serve; webhook callback on a dedicated listener published via optional Tailscale Funnel.**
*(S-2, S-4, C5, C7, spec D-1; R-OPS-4)*
**Decision.** The server binds 127.0.0.1 in every mode; the listener set is mode-dependent.
Hosted mode runs the main listener plus — only when the owner enables webhooks — the webhook
listener; stdio mode runs only the dev-login aux listener specified below; `both` mode runs the
hosted set with the aux suppressed as redundant (D21). **Main listener**
(`/mcp`, `/auth/*`, `/healthz`): published to the owner's tailnet with `tailscale serve` —
WireGuard-encrypted transport plus tailscaled-terminated HTTPS on the machine's `ts.net`
hostname; **never publicly reachable**. Multi-device access (spec D-1) = the owner's devices are
on the tailnet. **Webhook listener** (only `POST /webhooks/aps`): a separate loopback port,
published to the public internet with `tailscale funnel` **only when the owner enables webhooks**.
In the full hosted-with-webhooks configuration, the two HTTP listeners keep the public surface
to exactly one route that serves nothing else —
but the public/private **boundary itself is a Tailscale per-port configuration property, not a
process property**, and the architecture therefore pins it: Serve publishes the main listener on
**ts.net port 443** (`tailscale serve --https=443 <main loopback port>`, tailnet-only); Funnel
publishes the webhook listener on **ts.net port 8443** (`tailscale funnel --https=8443 <webhook
loopback port>`). Serve and Funnel **MUST NOT be configured on the same ts.net port**: Tailscale's
documented rule is last-command-wins per port — a `funnel` command against the port Serve uses
would silently flip the entire main surface public. Funnel is restricted to ports 443/8443/10000;
if APS webhook registration ever rejects the non-443 callback URL (its documentation states no
port restriction — see Premise), the documented fallback inverts the allocation (Funnel webhook
on 443, Serve main on 8443) rather than ever sharing a port. With Funnel off, zero public surface
exists and change detection runs on polling (D12; spec D-10 guarantees this independence).
Config: `TAILNET_BASE_URL` (serve hostname, port 443; drives the OAuth callback and the Origin
allowlist) and optional `WEBHOOK_PUBLIC_URL` (funnel hostname **including its port**, e.g.
`https://<node>.<tailnet>.ts.net:8443`; unset ⇒ webhook-listener not started and registration
tools return an actionable not-configured error). Startup asserts `TAILNET_BASE_URL` and
`WEBHOOK_PUBLIC_URL` do not resolve to the same host:port (fail-clear, D21).
**Third listener — stdio-mode dev-login aux (fully specified):** in stdio mode no HTTP listener
above exists; the process runs ONE auxiliary loopback listener whose route set is exactly
`GET /auth/login` and `GET /auth/callback` (D9's dev flow) and **nothing else — mounting `/mcp`
on it is prohibited** (the predecessor's headline defect was exactly an `/mcp` route mounted on
an aux listener); it binds 127.0.0.1 on the port of `APS_CALLBACK_URL`, is never published via
Serve or Funnel, runs for the process lifetime, and serves no MCP surface, so S-1's
no-unauthenticated-MCP-surface property holds in stdio mode by route-set construction. The
loopback-bind startup assertion covers every listener the process starts (main, webhook, and
stdio aux).
**Standard.** [MCP-TRANSPORT] localhost-binding + Origin validation (spec S-4 elevates binding to
SHALL); OWASP Threat Modeling (minimize — here, eliminate — public inbound surface).
**Why here.** Owner input (4): every hosted service he runs is already accessed through his
tailnet, and he is the sole user. C5's public-HTTPS requirement applies **only** to the webhook
callback (Autodesk's servers calling in); nothing else on this server needs to exist outside the
tailnet. Funnel scopes the public exposure to precisely that one requirement.
**Not.** Not Cloudflare Tunnel (scored 0.63 vs 0.90: a new vendor and daemon in a stack that already has a better-fitting overlay, and it
would expose the whole app publicly where Tailscale exposes one route or nothing). Not Caddy +
port-forward (0.50; new software, public IP/ACME/router upkeep). Not TLS in the Node process: tailscaled already
provisions and terminates TLS for both the serve and funnel paths, so in-process TLS would
duplicate machinery the overlay owns, add ACME/certificate-lifecycle surface to the app's config
and startup path, and require a non-loopback bind — abandoning the always-127.0.0.1 property this
decision is built on. Not tailnet-only with no webhook path *as a hard design* — the Funnel
option is preserved because R-NOTIFY-1 requires functional webhook registration when a callback
URL exists. Full matrix: decisionframework `ingress-topology`, recorded this session.
**Premise.** `tailscale serve --https=<port> <target>` publishes a local target tailnet-only over
HTTPS; `tailscale funnel --https=<port>` publishes to the public internet with auto-provisioned
TLS terminated by tailscaled, restricted to ports 443/8443/10000; and **"the same port number
cannot be simultaneously used for Tailscale Serve (private) and Tailscale Funnel (public)… the
most recent command determines if the port is private or public"** — all verified via Context7
`/websites/tailscale` (serve/funnel CLI reference + Serve Limitations), 2026-07-28. APS Webhooks
`callbackUrl` carries **no documented port or scheme restriction** (official reference examples
even register plain-HTTP ngrok URLs) — verified via Context7 `/websites/aps_autodesk_en`
(Webhooks v1 `systems/:system/hooks` POST reference), 2026-07-28. C5 and S-2/S-4 from spec §5/§8
(read in full). Owner infrastructure statement, this session. Residuals recorded in Limitations:
Tailscale control plane/Funnel ingress in the trust path.

**D2. Caller authentication: static high-entropy bearer secret, per-request, constant-time.**
*(S-1, S-2, S-3, S-12; AC-13)*
**Decision.** `MCP_AUTH_TOKEN` (≥256-bit, generation command documented) required on every `/mcp`
request. Middleware (mounted before the transport handler, in every mode that serves HTTP)
compares via `crypto.timingSafeEqual` over fixed-length digests; failure → 401 +
`WWW-Authenticate`; no session-derived authority anywhere. Rotation = config change. S-2's
audience-validation clause is **not applicable by its own condition** (non-OAuth gate). The
Autodesk credential never crosses this boundary in either direction (S-3): callers authenticate
with the MCP secret only; Autodesk sees only the server's own tokens.
**Standard.** [MCP-AUTHZ] (OAuth is SHOULD for HTTP servers — spec D-12 explicitly preserved the
simpler-gate option); [MCP-SEC] session-hijacking rules (S-12).
**Why here.** Exactly one principal exists (spec §2.2 excludes multi-user). Per-request secret
validation delivers S-1's full property with no issuance infrastructure to defend. The gate
remains **with** the tailnet (D1): S-1 forbids ambient authority — "reachability SHALL NOT
imply authorization" — and tailnet reachability is exactly that: any process on any tailnet
device can open a socket to the served port. Tailscale narrows *who can reach*; the bearer secret
decides *who is authorized*. The layers are complementary, not redundant.
**Not.** Not an OAuth 2.1 resource server: an authorization server guarding one user is new
attackable surface without a threat it addresses (scored 0.60 vs 0.90 — decisionframework
`caller-auth-mechanism`, matrix recorded this session); named as the growth path if multi-user
ever enters scope. Not mTLS: per-connection not per-request, and client certs do not traverse a
TLS termination point — tailscaled terminates TLS for both serve and funnel paths, so client
certificates never reach the app (0.54).
**Premise.** SDK supports pre-transport auth cleanly: `transport.handleRequest(req, res, body,
{ authInfo })` behind Express middleware — verified via Context7 `/modelcontextprotocol/typescript-sdk/v1.29.0`
(streamableHttp examples), 2026-07-28.

**D3. Transport wiring: SDK stdio for dev; Streamable HTTP stateless with JSON responses; explicit
Origin middleware; per-request server+transport instances.** *(R-PROTO-1/2, S-4, S-12, C8, C9)*
**Decision.** Dev mode: `StdioServerTransport`, stdout carries protocol only, all diagnostics to
stderr/file (R-PROTO-2). Hosted mode: Streamable HTTP with `sessionIdGenerator: undefined`
(stateless — no session IDs exist, so S-12's session clauses hold vacuously and by construction)
and `enableJsonResponse: true`; a fresh `McpServer` + transport per request (the SDK's stateless
pattern). Origin validation is an **explicit middleware** (allowlist: the `TAILNET_BASE_URL`
origin and none others; invalid → 403), because the SDK's built-in `allowedOrigins`/
`enableDnsRebindingProtection` options are deprecated in v1.29.0 in favor of external middleware.
**Absent or empty `Origin` is permitted; only a present Origin outside the allowlist is 403'd.**
Non-browser MCP clients routinely omit the header, and the SDK validation this middleware
replaces never rejected a missing Origin (verified via the same Context7 lookup:
`validateRequestHeaders`); T7's attacker is a browser, which cannot omit Origin on the
cross-origin requests the control exists to stop, so the permissive-absent rule concedes
nothing. Each per-request `McpServer` is constructed with the server name and the **version read
from `package.json`**, so the version is declared in `serverInfo` at initialize in **both**
transports (R-OPS-3; the stdio path has no `/healthz` and needs this). The declared capability
set is pinned (R-PROTO-1 "exactly the capabilities it implements"; spec §9.1): **`tools` only,
with `listChanged: false`** (D15 fixes a static inventory); no `resources`, `prompts`,
`logging`, or `completions` capability is declared. **Request-body bound (the enforcement point
for D28's input limit):** the `/mcp` route mounts `express.json({ limit: HTTP_MAX_BODY_BYTES })`
**after the bearer gate and Origin check, ahead of the transport** — the gate decides on headers
alone, so an unauthenticated request is 401'd before a single body byte is buffered, and the
`HTTP_MAX_BODY_BYTES` resident-bytes ceiling is reachable only by an authenticated caller (the
parser's 413 therefore ranks after the gate's 401 — the same stated-precedence discipline as
the AC-13 middleware-order note below). Express's default is **100 kB** (verified), which would reject any
upload above ~75 kB of content once base64 expansion is applied and silently make tools 20/36
unusable. `HTTP_MAX_BODY_BYTES` defaults to `ceil(UPLOAD_MAX_BYTES × 4/3) + 1 MB` envelope
headroom, and startup asserts it is not below that derived minimum, so the two bounds cannot
drift apart. This is the real memory ceiling: the stateless per-request pattern buffers the whole
body before the handler runs, so `UPLOAD_MAX_BYTES` is a post-parse check and the transport limit
is what actually bounds resident bytes. Over-limit requests are rejected by the parser with 413
before any handler or SpendGuard work. **Middleware-order interaction with AC-13
(stated):** the bearer gate precedes the Origin check, so an unauthenticated request with an
invalid Origin receives 401 (the earlier rejection), and AC-13's 403-on-invalid-Origin case is
exercised with a valid bearer secret plus an invalid Origin — stricter and fail-closed either
way, but a reviewer probing the Origin control must authenticate first or will observe 401 and
wrongly conclude S-4 is unimplemented.
**Standard.** [MCP-TRANSPORT] (Origin validation MUST; stdio purity); [MCP-LIFECYCLE] 2025-11-25
negotiation (C8).
**Why here.** Stateless mode suits a single-owner server where every request is independently
authenticated (D2) and long-running work is modeled as async jobs (R-EXPORT-5) rather than
streamed sessions; it eliminates the session store and the session-hijacking surface entirely.
**Not.** Not stateful SSE sessions: adds an eventStore + resumability machinery this spec never
requires, and creates the session surface S-12 exists to police. Not one long-lived server
instance across requests sharing transport state (SDK stateless examples create per-request
instances; tool registration is cheap).
**Premise.** Transport options and their deprecation verified via Context7
`/modelcontextprotocol/typescript-sdk/v1.29.0` (`WebStandardStreamableHTTPServerTransportOptions`:
`sessionIdGenerator`, `enableJsonResponse`, deprecated `allowedHosts`/`allowedOrigins`/
`enableDnsRebindingProtection`), 2026-07-28. `express.json()`'s `limit` option defaults to
`'100kb'` — verified via Context7 `/expressjs/express`, 2026-07-30.

**D4. Module layout: composition root + http routes + services + gateways + tools, dependencies
pointing downward only.** *(R-REL-6, R-OPS-2; maintainability)*
**Decision.** The layering in Components. Tools depend on gateways and cross-cutting services;
gateways depend on `aps-http` + `token-manager`; nothing depends upward; `index.ts` is the only
place wiring happens. Cross-cutting controls (auth gate, spend guard, output guard, egress
allowlist) are constructor-injected services, not utilities handlers may forget to import.
**Standard.** SOLID — single responsibility per module; dependency inversion at the gateway seams
(tools consume gateway interfaces, enabling the D26 test seam).
**Why here.** The predecessor's defects were convention failures; SRP + composition-root wiring
converts "every handler must remember X" into "X is in the path by construction."
**Not.** Not the predecessor's two-layer `services/tools` shape with per-file URL constants and
per-tool truncation helpers (that layout is where the divergent truncation and bare-quote handler
lived). Not a plugin/auto-discovery tool registry — 37 static tools need no dynamism.
**Premise.** Predecessor layout and its defects verified by codebase-RAG this session (queries and
hits recorded in the survey: `src/index.ts` unauthenticated `/mcp`; two truncation
implementations; thumbnail handler bare-quote interpolation).

**D5. MFG Data Model: build on GraphQL v2 (the introspected schema), with all GraphQL confined to
`mfg-gateway`.** *(R-DISC-*, R-READ-*, R-WRITE-1/2/3, R-EXPORT-1/2; C4)*
**Decision.** The server targets the v2 endpoint whose 209-type schema is on disk
(`docs/aps-mfg-schema.json`) — the spec's authoritative [APS-SCHEMA]. Every GraphQL document,
variable shape, and response mapping lives in `mfg-gateway.ts` as a **static operation catalog**;
tools receive domain-typed results (Design, AssemblyNode, PhysicalProperties…) and never see
GraphQL. A future v2→v3 migration (v3 removes `ComponentVersion` — rewrite-class) re-implements
one module against a re-introspected schema; tool contracts and domain types stay.
**Standard.** First-principles (mentalmodel, recorded): goal — keep the vendor's announced-but-
unscheduled breaking change from being a whole-server rewrite; shortcut — GraphQL scattered
through handlers (the predecessor's shape, cheapest to write); chosen path concentrates the blast
radius in one file and gives S-7 and R-REL-5 single enforcement points as a side effect.
**Why here.** This articulation applies because the v2 deprecation banner is live on the exact
endpoint this server calls and v3's removal of `ComponentVersion` invalidates the id type
threaded through six read tools — this codebase, uniquely, has an announced breaking change
hanging over its most-used interface, which is what makes isolation a requirement rather than a
style preference.
**Not.** Not v3 now: the spec's schema anchor, its live verifications, and the working query
client are all v2; v3 has no published v2 EOL and would invalidate the spec's grounding. Not a
GraphQL client library (apollo/urql): one consumer, static documents, no cache semantics — plain
fetch through `aps-http` suffices and keeps the egress-allowlist chokepoint intact.
**Premise.** v2 deprecation banner, v3 path (`/mfg/v3/graphql/public`), and ComponentVersion
removal — recorded in `src/constants.ts` (live-verified notes, read this session via RAG);
schema fields used by the catalog verified by grep against `docs/aps-mfg-schema.json` this
session: `foldersByProject`, `foldersByFolderInHub`, `itemsByFolder`, `itemsByProject`,
`createFolder/renameFolder/moveFolder/copyFolder/deleteFolder`, `createDesignFromFile`,
`setProperties`, `createPropertyDefinition` (+collections), `partNumber`, `materialName`,
`isMilestone`, `allOccurrences`, `Occurrence.parentComponentVersion`, `DerivativeInput`,
`WORKING/RELEASED/AS_SAVED/LATEST`, Drawing types, `itemVersions(hubId!, itemId!,
pagination)` → `ItemVersions{pagination, results}` (grep 2026-07-28, backing tool 35),
`Properties{results, pagination}` (the paginated connection backing tool 11), and `fusionWebUrl`
— present on six types (`ConfiguredDesignItem`/`DesignItem`/`DrawingItem`/`Folder`/`Hub`/
`Project`) but **not** on `ComponentVersion`; tool 12 reaches it via **both** item-bearing
traversals: `ComponentVersion.designItemVersion → item → DesignItem.fusionWebUrl` and, for
configured (parametric) designs, `ComponentVersion.configuredDesignItemVersion → item →
ConfiguredDesignItem.fusionWebUrl` (each hop verified against the schema, 2026-07-28) — all
present. **Type-located field enumeration (full introspection, 2026-07-29), the provenance
authority for the tool contracts:** the `Item` interface carries id/hub/project/parentFolder/
name/createdOn/createdBy/lastModifiedOn/lastModifiedBy/extensionType/mimeType/size and nothing
else; `tipVersion` and `versions` exist on all four concrete Item types;
`tipRootComponentVersion` exists on `DesignItem` only; the `ItemVersion` interface carries
versionNumber/createdOn/lastModifiedOn at interface level (tool 35's fields are interface-safe);
`ComponentVersion` carries partNumber/partDescription/materialName/isMilestone/
lastModifiedOn+By/createdBy but **no versionNumber and no createdOn** (reached via
`designItemVersion`/`configuredDesignItemVersion`, both of whose version types carry
versionNumber+createdOn); `DesignItemVersion.rootComponentVersion` exists. **Configured
(parametric) designs have no *single* root component version but DO reach root
`ComponentVersion`s — one per configuration row** — via `ConfiguredDesignItem.
tipConfigurationTable → ConfigurationTable.rows → ConfigurationRow.rootConfigurationMember:
ComponentVersion` (exhaustive introspection 2026-07-29: the schema has exactly nine
`ComponentVersion`-typed fields, and `ConfigurationRow.rootConfigurationMember` is one of them;
`rows` is an unpaginated list field, so its bounding is tool-level).

**D6. GraphQL parameterization: variables only; zero string interpolation into documents.**
*(S-7; AC-15)*
**Decision.** Every operation in the catalog is a constant document with typed `variables`. No
caller-derived value is ever concatenated or interpolated into document text. REST path segments
go through `encodeURIComponent`; query strings through `URLSearchParams`.
**Standard.** [OWASP-INJECTION] — parameterized queries; GraphQL variables are the parameterized
form.
**Why here.** The predecessor string-built every query; most call sites escaped via
`JSON.stringify`, but `aps_get_component_thumbnail` interpolated with bare quotes — proof that
convention-based escaping diverges. Variables make the safe path the only path, auditable by
grepping one module for `${` inside document strings.
**Not.** Not `JSON.stringify`-escaping into document text (works until one handler forgets — the
observed failure). Not a sanitization/denylist layer (encoding beats filtering per OWASP).
**Premise.** Bare-quote interpolation confirmed at source in `src/tools/mfg-data-model.ts`
(thumbnail tool: `componentVersionId: "${component_version_id}"`), via codebase-RAG this session.
GraphQL variables support is core GraphQL; the schema's operations take typed inputs (introspected
schema on disk).

**D7. Assembly structure & quantities: server-side cursor-following aggregation with a configured
page cap and first-class completeness.** *(R-READ-2, R-DISC-4, R-REL-5)*
**Decision.** `mfg-gateway.getAssemblyStructure` pages `allOccurrences` at ≤50 per request
(measured under the 1000-point budget), follows cursors until exhausted or the effective page
cap is hit — **tool 8's optional `max_pages` input is clamped to `min(max_pages,
MFG_MAX_PAGES)` (config, default 20): a caller may narrow the scan but never widen it past the
operator's cap** (the untrusted caller must not control consumption of a metered resource,
T5/C4), and when the operator cap rather than the caller's request terminates the scan, the
completeness fact says which bound bit — aggregates occurrences into parent→child edges and per-
componentVersion quantities, and returns the tree with `truncated`, `cursor`, and per-line
id/name/partNumber/material/quantity. **The returned `cursor` is the resume contract** (the
same shape the search extension below gives tool 6): it encodes the position in the
occurrence-page walk, and tool 8's optional `cursor?` input accepts it back — passing it
continues the scan from that position under a fresh page budget, so a capped BOM is completable
across successive calls. The walk's windows partition the occurrence set, so per-line
quantities from successive calls **sum exactly**; `truncated:false` on the final call marks the
total as complete. The spec's derived-quantity note is satisfied here:
**quantity = count of occurrence instances per componentVersion under the queried root**.
**Standard.** First-principles articulation via mentalmodel(first_principles) (recorded this
session): goal — a BOM that is either
complete or explicitly incomplete; shortcut — single-page fetch with a "more exists" note (the
predecessor's behavior: silent 50-occurrence cap); chosen path makes completeness a returned fact
and the cap a config, not a constant.
**Why here.** The articulation applies because this API meters by *requested* page size against
a hard 1000-point budget — a constraint most APIs don't have — so pagination here is not a
convenience but the only way to assemble a correct BOM at all, and the owner's stated use ("what's
the BOM") is precisely the query the budget squeezes hardest.
**Search extension (governs tool 6, `aps_find_design`).** The schema has no cross-hub search
query — the only name-filterable item queries are `itemsByProject(projectId, filter, pagination)`
and `itemsByFolder(hubId, folderId, filter, pagination)` with `ItemFilterInput{name, itemType}`
(verified by schema introspection) — so find-by-name (R-DISC-2) is the same bounded-traversal
problem as the BOM and gets the same mechanism: the mfg-gateway enumerates hubs → projects →
`itemsByProject(name filter)` server-side, in stable order, under a configured scan cap
(`MFG_SEARCH_MAX_PROJECTS`, default 50 projects per call), returning matches plus a completeness
fact and a resume cursor (the position in the hub/project enumeration) when the cap truncates
the scan. Per-level pagination limits stay small (the predecessor's live measurements: an
unbounded hubs>projects>items scan costs ~101k points against the 1000 budget, and
`tipRootComponentVersion` enrichment is deferred to matched items only). This closes the
unbounded-fan-out gap; the query-point exposure of repeated scans is part of Limitation 11.
**Not.** Not client-side (agent-driven) per-page pagination for the BOM: each window's derived
quantities require that window's full occurrence set server-side, and pushing the
≤50-occurrence page loop onto the agent guarantees wrong quantities. (The cap-boundary resume
cursor differs in kind — every call aggregates its whole window server-side, and the windows
partition the occurrence set, so successive calls' counts sum exactly.) Not
unbounded looping: a pathological assembly must not hold the request forever (R-REL-1 discipline
applied at the loop level).
**Premise.** Query-point budget (cap 1000, computed from requested limits; 50 occurrences = 534
points, 100 = 1034; unbounded scan ~101k rejected) — live-measured values recorded in
`src/tools/mfg-data-model.ts` comments, read via RAG this session. `Occurrence` /
`allOccurrences` / `pagination.cursor` shapes verified against `docs/aps-mfg-schema.json`.

**D8. Token lifecycle: classified failures, journal-before-refresh, atomic persist, single-flight
+ cross-process advisory lock; the credential file is never deleted by error handling.**
*(R-REL-2/3/7, R-AUTH-1, S-3, C1/C2/C3; AC-11, AC-18, AC-25)*
**Decision.** `token-manager.ts` is the only module reading/writing the credential file.
(a) **Classification:** transient (network, 429, 5xx) → credential untouched, retryable `isError`
result; `invalid_scope` → credential untouched, state = `reauth-required(scope-change)` with the
C3 explanation; `invalid_grant` (definitive rejection) → state = `reauth-required(revoked)`;
**no code path deletes the file** — states are recorded in the state store, and `aps_auth_status`
surfaces the actionable re-auth path (R-AUTH-1 reports live validity via a minimal probe, never
mere token presence). **The probe is specified, not deferred:** `dm-gateway.probeAuth()` issues
`GET /project/v1/hubs` (Data Management — deliberately **not** MFG, so the probe consumes no
query points against the C4 allowance, Limitation 11), tagged `cost: none, safe: true` in
`aps-http`; HTTP 200 ⇒ `ok`; 401/403 ⇒ `reauth-required` with the D9 login path;
network/5xx/timeout ⇒ `unknown (transient)` with the credential untouched per (a). D25's
`/healthz` publishes the same three classes.
(b) **Atomicity, and minimizing the window (R-REL-7):** refreshes are **demand-driven,
never opportunistic** — a refresh is issued only when the access token is within the renewal
threshold of expiry (config `TOKEN_RENEWAL_THRESHOLD_MS`, default 300 000 ms; a D21 startup
assertion holds it at or above D18's bounded worst-case retried exchange — attempts ×
(timeout + the 10 s wait ceiling), 120 s at defaults — so a token that passes the near-expiry
check at dispatch cannot expire mid-flight and the relation cannot drift under configuration;
this is the boundary AC-25's near-expiry observation is judged against), so the number of
rotation windows the server opens over its life is the minimum the workload requires. Before POSTing a refresh, write a `rotation-in-flight` journal
entry (state store). On response, **the raw response bytes are written durably first — temp file
+ `fsync` — and only then parsed**; the parsed credential is promoted to the live token file by
atomic rename (NTFS and POSIX), and the journal is cleared. Writing bytes before parsing shrinks
the unrecoverable interval from "receive → parse → serialize → write" to "receive → write",
leaving no application work inside the window at all. On startup, a
live journal entry + failing stored token → `reauth-required(rotation-lost)` with clear guidance —
the crash window between APS's server-side rotation and local persistence cannot be closed by a
client, so it is minimized and made recoverable, never silent.
(c) **Concurrency:** in-process single-flight mutex (concurrent callers await one refresh);
cross-process advisory lock file created `O_EXCL` (atomic on both OSes, no native dep) with a
stale-lock timeout (config `TOKEN_LOCK_STALE_MS`, default 45 000 ms — strictly exceeding D18's
30 s outbound timeout so a live refresh's lock is never stolen mid-flight, while a crashed
holder blocks refresh for at most 45 s); after acquiring the lock, re-read the file and **adopt**
a sibling's newer rotation instead of refreshing (C2 makes the on-disk file the source of truth).
(d) Refresh requests always send the **same scope set** the token was granted under (C3);
changing the configured scope set triggers the explicit re-auth path, never a silent widened
refresh.
**Standard.** Crash-only software design — Candea & Fox, "Crash-Only Software" (HotOS IX, 2003):
journal-then-act, atomic rename, recover-on-restart (tabled below); [APS-OAUTH] C1–C3.
**Why here.** The refresh token is the one asset a crash can destroy unrecoverably — C2's
server-side rotation means every crash inside the refresh window is a potential brick (it
happened live) — so the crash-only frame, which treats AC-25's crash test as normal operation
rather than an edge case, is the only design stance that fits the asset.
**Not.** Not the predecessor's clear-on-error (`clearTokens()` ran for every non-sibling-race
refresh failure — a transient 429 destroyed the credential). Not process-global mutable token
state without file authority (stale under multi-instance rotation). Not refresh-on-401-retry
loops (unbounded, and non-idempotent against rotating tokens).
**Premise.** Predecessor behavior verified at source this session (`src/services/aps-auth.ts`
`refreshToken()`: `clearTokens(); throw …` on `!res.ok` when no sibling rotation; `isAuthenticated()`
returns `currentTokens() !== null`); C2/C3 observed live per spec §5 (spec read in full);
`O_EXCL`/rename atomicity are POSIX/NTFS-documented Node built-in semantics (`fs` flags) — stable
platform facts.

**D9. Autodesk login: authorization-code + PKCE S256, config-driven callback, one-time browser
flow.** *(S-14, R-AUTH-1, M-3; AC-27)*
**Decision.** `GET /auth/login` generates `code_verifier` + S256 `code_challenge`, stores the
verifier transiently (state store, TTL default 10 minutes), redirects to APS authorize with
`state` (CSRF); `GET /auth/callback` validates `state`, exchanges code + verifier, hands tokens
to the TokenManager. **Callback-URL authority — one rule:** in hosted mode the callback is
derived as `TAILNET_BASE_URL` + the fixed path `/auth/callback`, and that derived URL must be
registered in the APS app; `APS_CALLBACK_URL` exists for the dev/localhost flow only; when both
are configured, startup asserts they agree (the derived hosted value is authoritative), and a
mismatch is a fail-clear startup error (R-REL-6) rather than a first-login `redirect_uri`
rejection at Autodesk.
The OAuth redirect travels through the **owner's browser**, not server-to-server, so the callback
needs only browser reachability — never public exposure. Hosted: callback URL =
`TAILNET_BASE_URL/auth/callback` (the login browser runs on a tailnet device). Dev: a registered
localhost callback. The M-3 one-time re-auth is this flow; `aps_auth_status` links it when unauthenticated.
**Gate placement (explicit):** `/auth/login` and `/auth/callback` sit **outside** the bearer gate
— the login is a top-level browser navigation and the callback is a redirect arriving from
Autodesk through that browser; neither can carry an `Authorization` header, and gating them would
make the M-3 first-run login impossible. Compensating controls: the routes live on the main
listener, reachable only from the tailnet (D1 — never funnelled); the `state` parameter binds
each callback to an initiated login; the verifier is TTL-bounded (10 min); and the callback
performs no action beyond the code exchange. The residual — any process on a tailnet device can
initiate a login flow — is recorded in Limitations.
**Standard.** [OAUTH-2.1] §7.5.1.1 (PKCE required); [MCP-SEC] local-interception surface; spec
D-13/S-14.
**Why here.** The code transits a browser redirect — on localhost during dev login (interceptable
by local processes) and across the tailnet in hosted operation; PKCE makes an intercepted code
useless without the verifier.
**Not.** Not client-secret-only code exchange (the predecessor's flow — no PKCE, no `state`).
Not device-code flow (APS support unverified; unnecessary — a browser exists at deploy time).
**Premise.** APS supports authorization-code + PKCE, method always S256 — spec §13 Q-2, verified
2026-07-24 against Autodesk docs (spec read in full this session). Predecessor's PKCE absence
verified at source (`getAuthUrl()` has no challenge params — RAG this session).

**D10. Credential store: JSON file under the user profile with enforced, startup-verified OS
ACL.** *(S-5; AC-14)*
**Decision.** Credential dir (Windows: `%USERPROFILE%/.aps-fusion-mcp/`; POSIX:
`$HOME/.aps-fusion-mcp/`; overridable via the D21 dir config) created by TokenManager with
owner-only access: on Windows, apply `icacls` reset + owner-only grant at creation and **verify
at startup** (refuse to serve, with actionable message, if the restriction is absent — R-REL-6
fail-clear); on POSIX, 0700 dir / 0600 files. All writes atomic (D8). The webhook secret lives in
the same store. Tokens never appear in logs (D20 redaction), tool results (S-3), or version
control (dir is outside the repo).
**Standard.** [OWASP-SECRETS] least-privilege at rest; spec S-5's explicit "real OS-level
restriction, not an inert mode bit."
**Why here.** All three evaluated options (ACL file / OS keychain / DPAPI) share the same residual
against same-user malware — T3's worst case — so the differentiators are dependency verifiability,
headless operation, and testability, which the ACL file wins (matrix 0.85 / 0.49 / 0.58,
decisionframework `credential-store`, recorded).
**Not.** Not keytar/keychain: keytar is archived; Context7 resolution for a maintained Node
binding (`@napi-rs/keyring`) returned **no Node library** this session — an unverifiable
dependency is disqualified by this project's standards. Not DPAPI: same unverifiable-binding
problem, same same-user residual; named in Limitations as deferred hardening if a verifiable
binding emerges.
**Premise.** Context7 `resolve-library-id("@napi-rs/keyring")` → only Rust keyring crates and the
NAPI-RS framework (2026-07-28, negative result recorded). Spec S-5 note re: inert mode bits (spec
read in full). `icacls` is a Windows-shipped tool (platform fact).

**D11. Webhook receive path: raw-body HMAC-SHA1 verification (constant-time) → content-hash
replay dedupe → append-only event journal; never act on an unverified callback.**
*(S-6, R-NOTIFY-3; AC-9)*
**Decision.** `POST /webhooks/aps` is mounted with `express.raw({type: 'application/json',
limit: '1mb'})` so the exact payload bytes are available. **Ordering note — deliberately unlike
the `/mcp` chain (D3):** this route's authentication *is* the HMAC over the body, so the body is
necessarily read before authentication; pre-verification buffering is bounded by the parser's
explicit 1 MB limit — far above the documented callback reference bodies (single-digit kB) —
and an oversized body is rejected 413 before any HMAC work. Compute `HMAC-SHA1(secret, rawBody)`, compare against
`x-adsk-signature` (`sha1hash=<hexdigest>`) via `timingSafeEqual`; failure → 403, nothing else
happens. On success: dedupe key = SHA-256 of the raw payload — content-hash rather than payload
fields, because replay defense must hold before any field is trustworthy; if seen within the dedupe window
(state store, TTL default 24h) → 200 with no action (byte-identical replay defeated — AC-9's
test); else append **`{sequence, receivedAt, deliveryId, eventType, resourceUrn, payload}`** to the
event journal (bounded, D24) and 200. The entry shape is load-bearing in two ways: the monotonic
`sequence` is the position D12 selects on, and **`resourceUrn` is captured explicitly because it
is a *top-level sibling* of `payload` in Autodesk's callback envelope, not a member of it** — a
journal that stored only `payload` would discard its own cross-source identity at write time and
could never recover it (D12's join). `deliveryId` is the `x-adsk-delivery-id` header, retained
for operator traceability.
Webhook secrets are **per hook** — the cardinality is explicit because APS carries the signing
token in each hook-creation request body ("a `token` string serves as a secret token for
generating a hash signature", per the Webhooks v1 hook-creation reference, Context7 2026-07-28)
and creates one hook per event type: tool 31 generates a fresh secret (`crypto.randomBytes`,
32 bytes = 256 bits) **for each hook it creates** (one registration call naming three event
types creates three hooks with three secrets), persists them in `webhook-secrets.json`
(hookId → secret, inside the ACL-protected state dir, D10/D24), and tool 33 deletes the entry
when it deletes the hook. Verification of an inbound callback selects the secret by
**constant-time trial across the active secret set** — the set is bounded by the owner's hook
count (single-digit in practice), and each trial is a full `HMAC-SHA1(secret, rawBody)` +
`timingSafeEqual`; a callback matching no active secret is 403'd. Secrets are never
owner-supplied config and never leave the store except inside the hook-creation request to
Autodesk. The callback URL is `WEBHOOK_PUBLIC_URL/webhooks/aps` (the Funnel hostname, D1). The route lives on the
**dedicated webhook listener** — the only publicly reachable listener, serving nothing else — and
is deliberately outside the bearer gate (Autodesk cannot present our secret): its authentication
*is* the HMAC. When `WEBHOOK_PUBLIC_URL` is unset, the listener never starts and registration
tools return an actionable not-configured error naming the config key (polling remains fully
functional per D12/spec D-10).
**Standard.** [APS-WEBHOOK] signature scheme (spec §13 Q-1, verified); spec S-6's explicit replay
clause; RFC 9110 status semantics (403 unverified / 200 idempotent accept).
**Why here.** HMAC over parsed-then-restringified JSON breaks on key ordering/whitespace — raw
bytes are the only correct input; content-hash dedupe defeats byte-identical replay without
depending on unverified payload field names. **The scope of that payload-independence rule is
signature verification and replay dedupe — the operations that run before the callback is
authenticated — and it does not extend past them:** once a callback's signature verifies, its
body is authenticated Autodesk data; D11 then captures the envelope's top-level `resourceUrn`
into the journal entry, and D12 derives cross-source identity from that field — for the
version-event family, with `payload.lineageUrn`/`payload.source` as version-event-specific
fallbacks (D12 states the event-family scoping). Stating the scope matters because an
unbounded reading of this rule would make D12's journal/poll join underivable.
**Standard note.** SHA-1 here is keyed-MAC use fixed by Autodesk (Q-1), not collision-exposed
signature use; recorded in Limitations.
**Not.** Not `express.json({verify})` for this route (workable — verified — but raw() is simpler
and parse errors shouldn't 400 before signature check). Not acting on events directly (webhook →
side-effects would make replays dangerous; the journal decouples receipt from action). Not
skipping replay defense on "signatures are enough" — S-6 names replay explicitly.
**Premise.** Signature algorithm/format/header: spec §13 Q-1 (verified 2026-07-24). The callback
envelope shape — `{version, resourceUrn, hook, payload}`, with `resourceUrn` a top-level sibling
of `payload` — and the `x-adsk-delivery-id` delivery-identifier header: verified via Context7
`/websites/aps_autodesk_en` (Webhooks v1 `dm.version.added` callback reference; the
`dm.operation.started` reference shows the same envelope), 2026-07-30. `express.raw`
Buffer body and `express.json` verify-callback semantics verified via Context7
`/expressjs/express` this session.

**D12. Polling: Data Management rollup descent with a persisted high-water marker, merged with
the event journal.** *(R-NOTIFY-2; AC-9 polling clause)*
**Decision.** `aps_notify_changes_since` answers from two sources with an explicit join.
**(a) The webhook event journal** (when hooks are registered) is selected by its own
**monotonic append sequence number**, never by time: each `events.ndjson` entry carries a
sequence, the tool takes an optional `since_sequence` and returns the highest sequence it
emitted as a third named field alongside `marker` and `resume_position`. This is deliberate —
the journal's only server-side timestamp is `receivedAt` (D11), so filtering it by the
Autodesk-clock `marker` would be exactly the cross-clock comparison this decision's clock-domain
rule forbids, and filtering it by a payload timestamp would make journal *selection* depend on
payload shape — a dependence this design confines to the identity join's fallback path (below).
A sequence has no clock in it at all. Journal entries therefore never advance `marker`, and a webhook-observed change the poll
cannot see (pruned folder, narrower scope) is still reported exactly once.
**Cross-source identity (the join key, and where the payload rule does and does not apply).**
D11's payload-independence rule is scoped to **signature verification and replay dedupe** — the
two operations that must work before any payload field is trustworthy, and which therefore use
raw bytes and their hash only. Once a callback is signature-verified, its payload is authenticated
Autodesk data and may be parsed. Identity is therefore derived on the journal side from the
entry's **`resourceUrn` field** — captured by D11 at write time from the **top level of the
callback envelope** (`resourceUrn` is a sibling of `payload`, not a member of it: verified
against Autodesk's `dm.version.added` callback reference via Context7
`/websites/aps_autodesk_en`, 2026-07-30 — the envelope is
`{version, resourceUrn, hook, payload}`, and the `dm.operation.started` reference shows the
same shape, so this is the envelope, not an event quirk). **The field's content is
event-family-specific** — it carries the URN of whatever resource the event concerns: the
`dm.version.*` family carries the version URN `urn:adsk.wipprod:fs.file:vf.<id>?version=N`,
while `dm.operation.started` carries a folder URN (`urn:adsk.wipprod:fs.folder:co.<id>`) — both
verified in the same lookup. The `(itemId, versionId)` normalization — the same grammar D27 pins
for MD inputs, yielding the form the DM poll side already returns — and the cross-source join
therefore apply to the **version-event family only**. Within that family, `payload.lineageUrn`
and `payload.source` corroborate the envelope field (the lineage URN shares the version URN's
opaque suffix, which is what makes the normalization work) and serve as fallbacks if it is ever
absent; both fields are version-event-specific — the `dm.operation.started` payload carries
neither (same lookup). Duplicates across the two sources are collapsed on the normalized pair
before return. A journal entry whose `resourceUrn` does not parse under the version-URN grammar
is still reported (never silently dropped) and flagged `identity: unresolved`. For entries from
non-version events — e.g. the folder-modified hooks spec R-NOTIFY-1 puts in scope — that flag is
the **normal, by-design state**, not degradation: the DM poll reports item versions, so a
non-version event has no poll-side counterpart to join against. For version-family entries it is
the degradation path: a payload-shape change costs duplicate reporting, never loss.
**(b) An on-demand DM poll** — descend the folder tree of
configured scope, pruning any folder whose `lastModifiedTimeRollup` < marker; for un-pruned
folders, list contents filtered by modification time ≥ marker; return changed items + a new
marker. **Clock-domain rule (explicit): markers are data-derived, never clock-derived** — the
new marker is the maximum Autodesk-stamped modification time (`lastModifiedTimeRollup` / item
modified time) actually observed during the poll, so both sides of every future comparison
originate from Autodesk's clock, and no skew between the server's clock and Autodesk's can
silently swallow a change window (a clock-derived marker that leads Autodesk's clock would prune
every change stamped inside the skew, permanently and invisibly). The inclusive ≥ boundary means
items stamped exactly at the marker can re-appear on the next poll; the gateway dedupes these
against the prior poll's reported (itemId, versionId) set, so the boundary costs internal
redundancy, never duplicate reports and never loss. The marker persists in the state store per
scope. **The descent is bounded like every other server-side traversal in this design (D7's
mechanism):** folder visits per poll are capped by `DM_POLL_MAX_FOLDERS` (config, default 200);
a poll that hits the cap returns `truncated:true` plus a **resume position** (the pending
folder-queue cursor, distinct from the time marker — the time marker only advances over fully
scanned ground) and the caller continues from it; completeness is a returned fact, never
implied. **Wire contract (tool 34's row states the same three-field contract):** three named
fields, not an opaque composite — the response carries `marker` (advances only over fully
scanned ground), `sequence` (the highest journal entry emitted, per (a)), and, only when
`truncated:true`, `resume_position`; the input accepts `marker`, `since_sequence`, and
`resume_position`, and a caller passes back whichever it holds. Named typed fields rather than a
composite token because D17's structured-output discipline exists precisely so agents branch on
named fields. Works with zero
webhooks registered (spec D-10: change detection must not depend on the public callback path).
**Standard.** [APS-DATAMGMT]; spec D-10.
**Why here.** The MFG schema cannot answer "changed since" server-side — verified: `ItemFilterInput`
carries only `name` and `itemType` — so MFG-side polling would enumerate everything on every poll
and burn query points. DM's rollup field exists precisely for cheap change descent.
**Not.** Not MFG-GraphQL polling (no date filter — verified absent). Not webhook-only change
detection (hostage to the callback path — spec D-10 forbids). Not `If-Modified-Since` alone
(folder-level 304s help but don't enumerate changed items; rollup descent subsumes it).
**Premise.** `ItemFilterInput` fields verified by grep against `docs/aps-mfg-schema.json` this
session (name, itemType only). Folder `lastModifiedTimeRollup` ("folder or any child item last
updated"), contents filtering by last-modified, and If-Modified-Since support verified via
Context7 `/websites/aps_autodesk_en_data_v2`, 2026-07-28.

**D13. Spend control: SpendGuard — persisted counters with configured caps gating every billable
call before submission.** *(S-11, S-9; AC-24)*
**Decision.** Spend authorization is enforced at the outbound chokepoint, not by per-method
convention: **every request through `aps-http` (the only outbound HTTP path, D18/D22) carries a
mandatory cost tag** — `none` | `md-translate` | `mfg-generate` | `da-workitem` — typed as a
required parameter of the request API so an untagged request is a compile-time error, and
`aps-http` calls `spendGuard.authorize(tag)` before dispatching any request whose tag is not
`none`. A gateway method that omits or mistags cost is a visible defect at the single audited
call site, not a silent free pass. Categories: `md-translate`, `mfg-generate`, `da-workitem`.
Caps are config:
per-day counts per category (documented defaults: 20/day `md-translate`, 20/day `mfg-generate`,
10/day `da-workitem`; owner-tunable) plus an optional global
`SPEND_REQUIRE_CONFIRM` list naming categories that additionally require a `confirm: true`
argument in the tool call. Counters persist in the state store (survive restart), keyed by UTC
day. Over-cap → refusal `isError` result naming the cap, the current count, and the config key —
no APS request is made. Because the check lives inside the single outbound path with a
type-mandated tag, neither a future tool nor a future gateway method can bypass it — the same
chokepoint discipline as the SSRF egress allowlist (D22), which shares the same enforcement
point.
**Standard.** [MCP-TOOLS] Security Considerations ("servers MUST rate limit tool invocations");
spec D-11 (label + cap are complementary).
**Why here.** A4 (unbounded metered spend) is a top asset and the server explicitly serves
human-out-of-the-loop scheduled runs (spec D-1) — a labeling hint cannot protect those.
**Not.** Not label-only (S-9 alone — the spec explicitly rejects this as sufficient). Not
in-memory counters (a crashing/restarting runaway resets its own budget). Not dollar-denominated
budgets (Autodesk's token pricing varies per service/size; counts are enforceable without a
pricing oracle — recorded in Limitations).
**Premise.** No factual premises about existing source — pure design choice within spec S-11's
options (rate/quantity limit and/or confirmation gate; both provided).

**D14. Cost and effect classes are tool boundaries; annotations follow a fixed truth matrix.**
*(R-EXPORT-2, R-PROTO-4, R-WRITE-4, S-9, R-AUTO-3; AC-6, AC-16)*
**Decision.** No tool's behavior forks between free and billable, or read and write, on a
parameter. Status/read tools call gateway methods that structurally cannot bill
(`aps_export_status` uses a `generate:false` derivative query — a distinct catalog operation from
`aps_export_generate`'s `generate:true`). Annotation matrix: R-class →
`readOnlyHint:true, openWorldHint:true`; W-class → `readOnlyHint:false`, with `destructiveHint:
true` for **every non-additive write** — deletes (`aps_delete_folder`,
`aps_notify_delete_webhook`) and overwrites/replacements (`aps_set_custom_properties` overwrites
prior values; `aps_rename_folder` replaces the name; `aps_move_folder` replaces the location) —
because the SDK semantic is that `destructiveHint:false` claims additive-only updates;
`destructiveHint:false` is set explicitly on the purely additive writes — tools 14, 15, 18, 20,
31, 36 (create property definition / create folder / copy folder / create design from file /
register webhook / upload file), which with the five destructive tools covers all 11 W-class
rows; `idempotentHint` is
pinned per tool — the SDK default is `false`, so idempotent tools must set it explicitly:
**`idempotentHint:true`** on tools 13, 16, 17, 19, 33 (setting the same values, name, or target
again — or deleting the already-deleted — has no additional effect) and
**`idempotentHint:false`** on tools 14, 15, 18, 20, 31, 36 (each repeat creates another
definition, folder, copy, design, hook, or uploaded item version); `openWorldHint:true` on
**all** classes — every tool calls Autodesk, an open world — stated here once as the expected
value for the AC-16 diff and set explicitly per tool;
$-class → `readOnlyHint:false, destructiveHint:false, idempotentHint:false`, contract text states
metered cost. The reviewer diffs this matrix against `tools/list` output (AC-16).
**Standard.** [MCP-TOOLS] annotations + SDK annotation semantics (defaults verified:
`destructiveHint` defaults **true** when unset — so W-class tools must set it explicitly);
first-principles carving (mentalmodel, recorded), three parts: goal — a caller and a human can
read cost and effect from the contract alone; local-optimum shortcut — mode parameters on shared
tools (fewer tools, but one annotation set must then cover a free read and a billable write);
why the chosen path serves the goal — MCP annotations are per-tool, so only tool-boundary
carving lets every annotation be simultaneously truthful.
**Why here.** This server is where annotation truth failed in production — the predecessor
shipped `readOnlyHint:true` over `generate:true` — and it serves scheduled human-out-of-the-loop
runs where the annotations are the only cost signal anyone reads before money is spent.
**Not.** Not mode-parameters on shared tools (one annotation set would have to cover a free read
and a billable action — the predecessor's `aps_generate_step` shipped `readOnlyHint:true` over
`generate:true`, the exact defect class R-EXPORT-2 exists to kill). Not mirroring the vendor's
endpoint granularity (61 routes ≠ user-meaningful operations).
**Premise.** Predecessor's `generate:true` under `readOnlyHint:true` verified at source
(`src/tools/mfg-data-model.ts`, RAG this session). Annotation schema + defaults verified via
Context7 SDK v1.29.0 (`ToolAnnotationsSchema`), 2026-07-28. `DerivativeInput{outputFormat,generate}`
verified in the on-disk schema.

**D15. Tool inventory: 37 tools in 7 groups derived from spec §6's capability decomposition, named
`aps_<domain>_<operation>`.** *(all §6 R-*; R-PROTO-5)*
**Decision.** The inventory table in Components is the contract. Carving rules (first-principles,
recorded): one tool = one user-meaningful operation; cost/effect class boundaries are tool
boundaries (D14); async lifecycles split submit/status/retrieve (R-EXPORT-5, R-AUTO-2); every
input constraint expressible in schema lives in the zod schema, not prose (R-PROTO-5).
**Standard.** First-principles articulation (no formal standard governs carving; mentalmodel
trace recorded — goal: agent-usable without out-of-band knowledge; shortcut rejected: carrying
the predecessor's 19-tool list or mirroring APS endpoints 1:1; why the chosen path serves the
goal: deriving tools from the spec's §6 capability groups means every tool answers a confirmed
owner need in one call, where endpoint-mirroring yields ID-plumbing chains agents mis-sequence
and the predecessor's list encodes its accidents).
**Why here.** The consuming agent is the only user — there is no UI to compensate for a
confusing tool surface, so carving quality *is* usability here, and the spec's capability groups
are the only carving source that traces to confirmed needs rather than to vendor or predecessor
accident.
**Not.** Not the predecessor's 19 tools by name (M-1: any surviving name is re-derived). Not
mega-tools with operation enums (schema precision and annotations degrade).
**Premise.** Spec §6 read in full; every tool's underlying schema/REST capability verified this
session — MFG GraphQL via D5's schema greps, Data Management via D12/D23's Context7 lookups,
Design Automation via D23/Q-3 and the DA activities-pagination lookup, and **Model Derivative via
Context7 `/websites/aps_autodesk_en` (MD v2 `properties:query` pagination and object-tree
narrowing, 2026-07-28; the derivative-download operation
`GET …/designdata/:urn/manifest/:derivativeUrn/signedcookies`, returning
`{etag, size, url, content-type, expiration}` plus the CloudFront signed cookies as `Set-Cookie`
headers — backing tool 37, verified 2026-07-30)**.

**D16. Error discipline: five-class taxonomy, always `isError` tool results, protocol errors
reserved for protocol faults.** *(R-PROTO-3, R-REL-2/6; AC-10, AC-11)*
**Decision.** Gateway and service errors map to five classes surfaced in a uniform error shape
(class, actionable message, retryable flag, and for auth: the re-auth path): `validation`
(boundary zod failure), `auth` (Autodesk credential state — carries guidance from D8),
`transient` (timeout/429/5xx — retryable), `permanent` (4xx semantic — not retryable), `budget`
(SpendGuard refusal — names the cap). All reach the model as `isError:true` results with text +
structured error content. Thrown exceptions never escape handlers (a top-level wrapper converts
unexpected throws to `isError` results and logs them); protocol-level errors remain the SDK's
domain for unknown-tool/malformed-request. Recoverable runtime errors never kill the process
(R-REL-6).
**Standard.** [SDK] `CallToolResult` semantics ([MCP-TOOLS] Error Handling): errors the model can
see and self-correct from.
**Why here.** This server's consumer is an autonomous agent whose only recovery mechanism is
reading the error and adjusting the next call — and its dominant failure sources (Autodesk 429s,
auth-state transitions, spend refusals) are exactly the recoverable classes the taxonomy makes
actionable; a protocol error at any of them would dead-end an unattended scheduled run.
**Not.** Not thrown exceptions as the error path (become protocol errors invisible to the model —
spec D-6 records this). Not free-text-only errors (agents branch on structure).
**Premise.** `isError` result pattern verified via Context7 SDK v1.29.0 docs (error-handling
example), 2026-07-28.

**D17. Structured output everywhere; zod v4 pinned as the single schema library.**
*(R-PROTO-5/6, S-8; AC-10)*
**Decision.** Every data-returning tool declares `outputSchema` and returns `structuredContent`
plus a human-readable text rendering. zod v4 (single version, locked) defines input schemas,
output schemas, config validation (D21), and gateway-response validation at the trust boundary
(Autodesk responses are parsed, not cast — the predecessor's `as`-casts silently accepted shape
drift). Every data tool's `outputSchema` composes the shared completeness-envelope fragment
(`truncated`, `cursor?`, untrusted-content marking) so OutputGuard's mutations are schema-legal
by construction (the D19 coupling; the SDK validates `structuredContent` against `outputSchema`
— Context7 v1.29.0, 2026-07-28).
**Standard.** [SDK] outputSchema/structuredContent; [MCP-TOOLS] schema discipline.
**Why here.** The consuming agents branch on typed fields — BOM lines, quantities, statuses —
so untyped text renderings alone reproduce the predecessor's guess-and-parse failure mode; and
the v2-deprecation risk (D5) makes the trust-boundary parse the seam where Autodesk shape drift
is caught instead of silently propagated.
**Not.** Not text-only results (the predecessor's shape — R-PROTO-6 exists because of it). Not
mixed zod major versions in the tree (SDK FAQ names TS2589 as the failure mode; lockfile +
override pins).
**Premise.** SDK peer-supports zod ≥3.25, internally `zod/v4`, both APIs supported; multiple-zod
hazard documented — verified via Context7 SDK v1.29.0 (README + FAQ), 2026-07-28. Predecessor
`as`-casting visible throughout RAG excerpts this session.

**D18. Outbound HTTP: one client, explicit timeouts, bounded backoff retries on declared-safe
operations only.** *(R-REL-1/4; AC-11, AC-19)*
**Decision.** `aps-http.ts` wraps global `fetch` (Node ≥18 built-in): every request carries an
`AbortSignal.timeout` (default 30s, config). **Retry eligibility is a declared property of the
operation, not of the HTTP method** — every `aps-http` request carries a `safe: true|false` tag
alongside its cost tag (D13), and the two are **jointly constrained by type: `safe: true`
requires `cost: 'none'`** — the request type makes a billable-and-retryable request
unconstructible, the same type-mandated enforcement D13 uses for the cost tag itself. Only `safe`
requests retry, on 429/5xx/network, max 3 attempts, exponential backoff + jitter, honoring
`Retry-After` — with a **10 s per-attempt wait ceiling** that applies to the computed backoff
and to an honored `Retry-After` alike, so the worst-case elapsed time of one retried exchange
is computable: attempts × (timeout + wait ceiling), 3 × (30 s + 10 s) = 120 s at defaults. **Safe:** REST GETs, the explicitly-idempotent PUTs of the signed-upload flow, and
those **MFG GraphQL operations D5's catalog marks `query` *and* `cost: none`**. **Unsafe, never
retried:** every GraphQL mutation; every REST POST/PATCH/DELETE; the token-refresh POST (retrying
double-rotates — the C2 hazard); and — the case GraphQL's own semantics get wrong — **the
billable derivative generation**, which Autodesk exposes as a *field on a Query type*
(`ComponentVersion.derivatives(derivativeInput:{generate:true})`, schema-verified) while it
submits a metered job. GraphQL's query/mutation split is a schema-authoring convention, not a
safety guarantee; cost is the authority here, which is why the constraint is on the pair rather
than on the operation kind. Retries occur inside `aps-http` **after** SpendGuard authorizes, so
without this constraint one authorized call could have spent 3× its cap — the S-11/AC-24
guarantee, and the "billable call inside a read" defect this rebuild exists to eliminate.
**SpendGuard authorizes once per tool invocation, not per attempt**; since no billable request is
ever retried, the two counts cannot diverge. A method-based test, by contrast, would have
excluded the entire MFG read surface (13 of the 23 R-class tools) from the protection this
decision exists to provide, on the very API whose 429s it calls routine. 429 responses
propagate as `transient` class with the retry-after surfaced.
**Standard.** RFC 9110 §9.2.2 (idempotent methods — retries only where the method contract makes
them safe); Google SRE Book ch. 22, "Addressing Cascading Failures" (Beyer et al., 2016 — bounded
exponential backoff with jitter); [MCP-LIFECYCLE] timeout guidance.
**Why here.** Every tool call transits Autodesk's rate-limited APIs over a WAN, so 429s and
transient 5xxs are routine operation, not exceptions; and this server's non-idempotent requests
are uniquely dangerous to retry — a re-sent submission double-bills (A4) and a re-sent refresh
double-rotates the credential (C2) — which is why the idempotence line is drawn by method
contract, not by optimism.
**Not.** Not axios/got (fetch is built-in; one fewer dependency inside the security chokepoint).
Not blanket retry-on-failure (retrying a non-idempotent mutation duplicates writes; retrying a
refresh POST double-rotates — the exact C2 hazard).
**Premise.** No factual premises beyond Node ≥18 built-in fetch (C9 platform fact) — pure design
choice.

**D19. OutputGuard: the single truncation mechanism and the S-13 neutralization point.**
*(R-REL-5, S-13, R-DISC-4; AC-20, AC-26)*
**Decision.** All tool output passes one guard, **enforced structurally, not by handler
convention**: tools are registered exclusively through a `registerGuardedTool` wrapper in the
composition root that applies the guard to every `CallToolResult` on the way out; direct
`server.registerTool` calls are prohibited (the same chokepoint discipline D13 applies to
SpendGuard via `aps-http`'s mandatory cost tag and D16 applies to unexpected throws via the
top-level wrapper). **Contract with D17's `outputSchema` (the coupling stated):** the SDK
validates `structuredContent` against the declared `outputSchema`, and the guard's mutations must
therefore be schema-legal by construction — every data-returning tool's `outputSchema` composes a
shared completeness-envelope zod fragment declaring `truncated: boolean`, optional `cursor:
string`, and the untrusted-content marking fields, so the guard only ever writes fields every
schema declares; and neutralization is constraint-safe because externally-sourced string fields
are declared without `maxLength`/`format`/pattern constraints the length-capping or
control-character stripping could violate. The guard: (a) **bounding** — structured lists are truncated
by item count with `truncated:true` + cursor (preferred), text renderings by a single configured
character limit with an explicit marker; one implementation, used by every tool. (b)
**neutralization** — external-content string fields (design/file/folder names, custom-property
values, foreign-CAD metadata) are wrapped in the structured output as data values (never
concatenated into instruction-like prose), control characters stripped, length-capped, and the
text rendering marks them as untrusted content spans, so returned text cannot smuggle
instructions into the consuming agent's context.
**Standard.** [MCP-TOOLS] Security Considerations ("servers MUST sanitize tool outputs"); spec
S-13 (output boundary distinct from input boundary).
**Why here.** This server's outputs are CAD-account content an outside party can influence
(design names, custom properties, imported foreign files — T8's exact channel) flowing directly
into an autonomous agent's context, and its BOM-scale payloads are the context-window incidents
R-REL-5 names; both hazards converge on tool output, so the output boundary needs its own single
control rather than riding on input validation.
**Not.** Not per-tool truncation helpers (the predecessor had two divergent implementations —
R-REL-5's origin). Not HTML-escaping-only (the consumer is an agent context, not a browser;
the threat is instruction-shaped text, handled by structural separation + marking).
**Premise.** Two divergent truncation implementations verified at source this session
(`truncateIfNeeded` in `src/tools/mfg-data-model.ts`; `truncate` in `src/tools/model-derivative.ts`
— RAG excerpts). Envelope-fragment composition uses `.extend()` or shape spread
(`z.object({ ...A.shape, ...B.shape })`) — the two composition forms the zod **v4** API reference
documents (`packages/docs/content/api.mdx`; its guidance sentence "When merging object schemas,
prefer `A.extend(B)` over intersections" concerns `z.intersection`). `.merge()` is not used: its
documented semantics — the result inherits the second schema's `unknownKeys` policy and catchall
— appear in the **v3** reference (`packages/docs-v3/home.md`), not the v4 reference, and an
inheritance rule that can silently change a composed schema's strictness is the wrong foundation
for a schema-legal-by-construction guarantee. Verified via Context7 `/colinhacks/zod`,
2026-07-30.

**D20. Logging: pino; destination per transport; redaction + allowlisted argument summaries.**
*(R-OPS-1, R-PROTO-2, S-5; AC-12)*
**Decision.** pino as the logger: stdio mode → `pino.destination(2)` (stderr only — stdout is
protocol); HTTP mode → file destination + stderr. Level from config. Per-invocation log line:
tool name, **allowlisted** argument summary (ids and enums; never free-text values, never
tokens), outcome class, duration. `redact` paths cover every field that could carry a secret
(authorization headers, token fields, webhook secret) as defense-in-depth behind the allowlist.
**Standard.** [OWASP-SECRETS] (no secrets in logs); R-OPS-1's sanitized-summary requirement.
**Why here.** The log stream is T6's named leak channel on a server whose every request carries
bearer material and whose predecessor logged nothing (no per-call logging existed to audit at
all); adding R-OPS-1's per-invocation logging without a redaction discipline would create the
leak channel while fixing the observability gap — the two must land together.
**Not.** Not a hand-rolled logger (redaction is safety-critical; pino's is battle-tested and was
verified). Not log-everything-then-redact (allowlist first; redact is the backstop).
**Premise.** pino `redact` (paths/censor/remove), stderr fd destination, and file destination
verified via Context7 `/pinojs/pino`, 2026-07-28.

**D21. Configuration: one module, zod-validated at startup, read once, documented defaults,
fail-clear.** *(R-OPS-2, R-REL-6, R-OPS-3; AC-21, AC-22)*
**Decision.** `config.ts` defines the full config schema (env + optional `.env` via Node's
`--env-file`), **partitioned by deployment mode** (the schema is a zod discriminated union on a
**three-valued serving-mode discriminant — `stdio` | `hosted` | `both`** — so requiredness is
enforced by the validator, not by convention; the composition root's "and/or" selection maps
exactly onto these three branches):
**required in both modes** — APS client id/secret, scope set, log level; **required in hosted
(HTTP-serving) mode** — `TAILNET_BASE_URL` (drives the D9 callback derivation and D3 Origin
allowlist), `MCP_AUTH_TOKEN`, main listener port; **required in stdio/dev mode** —
`APS_CALLBACK_URL` (the registered localhost callback; in hosted mode it is optional and, when
present, must agree with the derived callback per D9); **required in `both` mode** — the hosted
set (a `both` run mounts `/mcp`, so it is HTTP-serving and requires `MCP_AUTH_TOKEN`), with
`APS_CALLBACK_URL` optional-must-agree as in hosted mode, and the stdio aux listener
**suppressed as redundant** (the main listener already serves `/auth/*`); **optional feature keys** —
`WEBHOOK_PUBLIC_URL` + webhook listener port (webhooks off when unset, D1),
`DA_OUTPUT_FOLDER_ID` + project (DA submission tools refuse with an actionable message when
unset), `SPEND_REQUIRE_CONFIRM` (default empty; accepted values are D13's category names —
listed categories additionally require `confirm:true` in the tool call); **optional with
documented defaults** — `EGRESS_ALLOW_HOSTS` (default: the built-in set —
`developer.api.autodesk.com` plus the Autodesk signed-URL hosts; entries **extend, never
replace,** the built-in set, so configuration can widen the D22 allowlist deliberately but can
never empty it), log file, `MFG_MAX_PAGES` (20; the operator
ceiling that clamps tool 8's `max_pages`, D7), `MFG_SEARCH_MAX_PROJECTS` (50; D7's search
extension), `MFG_SEARCH_ROW_LIMIT` (25; configuration-row bound, tools 6/7), `UPLOAD_MAX_BYTES`
(100 MB; D28's decoded-content bound), `HTTP_MAX_BODY_BYTES` (default
`ceil(UPLOAD_MAX_BYTES × 4/3) + 1 MB`; the `express.json` limit on `/mcp` per D3 — startup
asserts it is not below that derived minimum),
`DM_POLL_MAX_FOLDERS` (200; D12's descent
cap), spend caps (D13), dedupe TTL (24 h), `TOKEN_LOCK_STALE_MS` (45 000),
`TOKEN_RENEWAL_THRESHOLD_MS` (300 000; D8(b)'s near-expiry boundary — startup asserts it is
not below D18's worst-case retried exchange, attempts × (timeout + the 10 s wait ceiling), so
the two bounds cannot drift apart), `AUTH_VERIFIER_TTL`
(10 min), state/credential dir override.
**"HTTP-serving" is defined precisely: a mode that mounts `/mcp` on any HTTP listener** — i.e.
hosted mode. The stdio aux listener (D1) serves only `/auth/login` + `/auth/callback`, is not
HTTP-serving under this definition, and requires no `MCP_AUTH_TOKEN`; the config validator
enforces the pairing structurally — the hosted branch of the discriminated union is the only
branch that constructs the `/mcp` route, and that branch requires `MCP_AUTH_TOKEN`. **When HTTP
serving is selected, absence of `MCP_AUTH_TOKEN` is a fail-clear startup error — the process
refuses to serve, never starts with the gate skipped** — the same startup-assertion treatment
as D1's host:port distinctness and D9's callback consistency; the predecessor's headline defect
was precisely an ungated `/mcp` listener, and this closes the configuration path to
reintroducing it in either mode. Startup validates once;
violations exit with the offending key and expected form, and cross-key consistency is checked
too — the D9 callback-authority assertion (derived hosted callback vs `APS_CALLBACK_URL` when
both are present) runs here, at startup, fail-clear. The typed config object is injected;
nothing reads `process.env` elsewhere. Dependencies are pinned exact in `package.json` with the
lockfile committed (R-OPS-3 — the predecessor used caret ranges).
**Standard.** The Twelve-Factor App, §III "Config" (config in the environment, strict separation
from code — tabled below); R-OPS-2's read-once rule.
**Why here.** The same build runs in two modes (stdio dev, hosted service) on Windows 11 — the
environment is the only config channel both share without files in the repo; and the
startup-validate-once discipline is what converts misconfiguration from a mid-tool-call surprise
(the predecessor's `env()` threw at call time) into R-REL-6's fail-clear boot error.
**Not.** Not scattered `process.env` reads with per-site fallbacks (the predecessor's `env()`
helper threw at call time, mid-tool). Not a config file format (env is the platform convention
for both deployment modes and secrets stay out of the repo).
**Premise.** Predecessor caret ranges verified: `package.json` read this session (deps
`^1.29.0`/`^5.2.1`/`^4.3.6`); lockfile present (`package-lock.json` glob-verified).
`z.discriminatedUnion(<literal key>, [branches])` is the current zod v4 API for exactly this
mode-branch validation — verified via Context7 `/colinhacks/zod` (v4 docs), 2026-07-29.

**D22. SSRF egress control: allowlist enforced in `aps-http` for every outbound request,
including redirects and signed URLs.** *(S-10; AC-23)*
**Decision.** The only fetch path validates every URL (initial and each redirect hop;
`redirect:'manual'` + re-validation): scheme must be `https:`; host must match the allowlist, whose **matching semantics are exact-host by default**:
`developer.api.autodesk.com` and the signed-URL hosts Autodesk issues are matched as full
hostnames; a config entry in `EGRESS_ALLOW_HOSTS` may alternatively be written as an explicit
suffix rule (leading dot, e.g. `.s3.amazonaws.com`) which matches only on whole DNS-label
boundaries — never substring matching, so `evil-s3.amazonaws.com.attacker.net` and
`notreallys3.amazonaws.com` can never match. Literal-IP hosts
are refused outright; loopback/link-local/private ranges are refused. Webhook registration URLs
constructed by the server always derive from `WEBHOOK_PUBLIC_URL` (never caller input).
**Standard.** [OWASP-SSRF] (allowlist over denylist; validate redirects); [MCP-SEC] SSRF.
**Why here.** OWASP's allowlist guidance assumes an enumerable trust set, and this server has
exactly that: every legitimate outbound host is either `developer.api.autodesk.com` or an
Autodesk-issued signed-URL host — nothing caller-chosen — so the allowlist's precondition holds
here in a way a denylist could never exploit, and redirect re-validation matters because signed
URLs are the one place Autodesk itself sends the client to a third-party host.
**Not.** Not denylist-only (bypassable per OWASP). Not validating only tool-argument URLs
(redirect targets and signed URLs are also input-influenced — S-10 names them).
**Premise.** Signed download/upload URLs point off-`developer.api.autodesk.com` (e.g.
`…s3-accelerate.amazonaws.com`) — verified in the Context7 DM signed-S3 documentation excerpt,
2026-07-28; hence the explicit signed-host allowance rather than a single-host allowlist.

**D23. File transfer pipeline: DM storage + signed-S3 upload/complete for both
`createDesignFromFile` and Design Automation outputs; DA outputs land in a configured project
folder.** *(R-WRITE-3, R-AUTO-1/2; AC-5, AC-8)*
**Decision.** `dm-gateway` implements: create storage (`POST projects/:id/storage`) → obtain
signed S3 upload → upload → complete → first-version item creation. `aps_create_design_from_file`
feeds this pipeline then invokes the MFG `createDesignFromFile` mutation with the uploaded file
reference. `da-gateway` uses the same pipeline to mint output storage: WorkItem output arguments
get signed **put** URLs targeting storage in the configured `DA_OUTPUT_FOLDER_ID`; inputs get
signed **get** URLs (Q-3 shapes). `aps_da_get_outputs` resolves the WorkItem's recorded output
objects to signed download URLs / item versions. Signed-upload expiry (2 min default, extendable
to 60) means the gateway requests the URL immediately before each transfer.
**Standard.** [APS-DATAMGMT]; [APS-DA] Q-3 WorkItem argument model.
**Why here.** Q-3's WorkItem shape forces the caller to supply signed URLs for inputs and
outputs — storage is not optional, someone must mint those URLs — and Data Management is the only
storage surface the spec lists in §9, with the added property that DA results land as ordinary
project files the owner sees in Fusion rather than in an invisible side bucket.
**Not.** Not app-managed OSS buckets (adds an interface the spec doesn't list in §9 and hides
outputs from the owner's normal Fusion project view; DM storage makes DA results appear as
project files). Not embedding activity definitions in the server (R-AUTO-4 forbids).
**Premise.** Storage creation, signed-S3 upload URL + completion, first-version item creation,
and the 2-minute default expiry verified via Context7 `/websites/aps_autodesk_en_data_v2`,
2026-07-28. WorkItem `{activityId, arguments{url,verb,headers}}`/status enum/polling — spec §13
Q-3 (verified 2026-07-24).

**D24. State persistence: a flat, atomic JSON state directory; no database.** *(supports D8, D11,
D12, D13; R-REL-7)*
**Decision.** `state-store.ts` manages `<credential-dir>/state/`. The inventory is **complete** — every durable
obligation any decision places on the store appears here with its lifecycle, and a decision
requiring durable state that is absent from this list is a defect in this decision, not an
implementer's choice:

| Artifact | Owner | Contents & lifecycle |
|---|---|---|
| `spend-counters.json` | D13 | category → per-UTC-day count; day-keyed, old days pruned |
| `webhook-dedupe.json` | D11 | payload SHA-256 → receipt time; TTL-pruned (default 24 h) |
| `webhook-secrets.json` | D11 | hookId → 256-bit secret; written by tool 31, entry deleted by tool 33 |
| `poll-markers.json` | D12 | per scope: the data-derived high-water marker, the pending folder-queue resume position, **and the prior poll's reported (itemId, versionId) set** — the last is what makes D12's inclusive-boundary guarantee ("never duplicate reports and never loss") hold across restarts, which a scheduled unattended server (spec D-1) treats as normal operation |
| `refresh-journal.json` | D8 | the `rotation-in-flight` entry written before a refresh POST and cleared after the atomic rename |
| `auth-state.json` | D8 | the current credential classification — `ok` / `reauth-required(scope-change\|revoked\|rotation-lost)` — with the reason string; survives restart so `aps_auth_status` and `/healthz` report the specific, actionable state rather than re-deriving a vaguer one (R-REL-3, AC-11) |
| `pkce-verifiers.json` | D9 | `state` → `{code_verifier, issuedAt}`; **single-use** (deleted on the callback that consumes it) and TTL-pruned at `AUTH_VERIFIER_TTL` (default 10 min). This is security material: it is the mechanism behind S-14 and behind the `state` binding that D9 names as its compensating control for sitting outside the bearer gate |
| `da-workitems.json` | D23 | `workItemId → {activityId, submittedAt, outputObjects[] (DM storage/object ids), targetFolderId}`; written by tool 28 at submission, read by tool 30 to resolve outputs, pruned 30 days after terminal status. Durable because Automation is asynchronous by construction (R-AUTO-2) and the record is **not re-derivable**: tool 29 returns only status + report URL (Q-3), the DA output folder is shared across concurrent WorkItems so listing it cannot attribute objects to jobs, and the signed PUT URLs expire in 2 minutes |
| `events.ndjson` | D11 | append-only webhook event journal; each entry `{sequence, receivedAt, deliveryId, eventType, resourceUrn, payload}` — the monotonic `sequence` is D12's selection position and `resourceUrn` its join key (D11 captures it from the callback envelope's top level); size-capped rotation |

All writes are temp+fsync+rename; all files live inside the ACL-protected directory (D10).

**Standard.** First-principles articulation via mentalmodel(first_principles), recorded this
session: goal — durable small-state without operational surface; shortcut
rejected — SQLite/embedded DB (a dependency, a file format, and migration surface for four tiny
maps and a journal, serving exactly one process); chosen path reuses the already-secured
directory and the already-required atomic-write discipline.
**Why here.** The articulation applies because every durable datum this server owns beyond the
credential (counters, hashes, markers, a journal) exists to make a *security or reliability
control* survive restart — so the state store's correctness bar is the atomic-write discipline
D8 already mandates, and its threat model is D10's directory ACL; a database would add surface
to both without serving either.
**Not.** Not SQLite (justified only if state outgrows single-file atomic rewrites — noted in
Limitations as the growth path). Not in-memory (spend counters and dedupe must survive restart —
AC-24's human-out-of-the-loop clause and AC-9 replay).
**Premise.** No factual premises — pure design choice.

**D25. Health & smoke: unauthenticated-but-minimal `/healthz`; documented stdio smoke
invocation.** *(R-OPS-5, R-OPS-4; AC-12)*
**Decision.** `GET /healthz` returns liveness, protocol revision, version (the same value
declared in `serverInfo` per D3 — one source, `package.json`; R-OPS-3 surfaced), and
auth-state class (`ok` / `reauth-required` / `unknown (transient)` — the three D8 classes,
never token material). It sits outside the bearer
gate (monitoring needs it; it exposes no MCP surface, no data, no secrets — trust model
documented). stdio smoke: a documented one-line `initialize`+`tools/list` invocation for Windows
(R-OPS-4's clean-checkout procedure includes it). The R-OPS-4 documentation deliverable SHALL
state **both trust models** explicitly: hosted — reachability restricted to the owner's tailnet
(D1), authorization by the per-request bearer secret (D2), the only public surface being the
optional funnelled webhook route whose authentication is the HMAC (D11); stdio — a local child
process of the MCP host, trusting its parent process, with no network surface beyond the
loopback-bound aux listener used for the dev OAuth callback.
**Standard.** First-principles articulation via mentalmodel(first_principles), recorded this
session: goal — an operator or probe can tell the server is alive, which version runs, and
whether auth needs attention, without the health check becoming an information leak or an
auth-bootstrapping dependency; local-optimum shortcuts rejected — bearer-gating health (breaks
probes; creates a bootstrap problem when the gate itself is misconfigured) and rich diagnostics
(turns liveness into reconnaissance); the chosen minimal ungated endpoint serves the goal because
S-1's no-ambient-authority rule scopes to the **MCP** surface and `/healthz` carries no authority
and no data.
**Why here.** The articulation applies because this deployment is monitored by dumb probes (an
uptime check against the tailnet hostname) rather than an ops platform, and the auth-state class
in the health payload is the owner's only passive signal that the M-3-style re-auth condition
has recurred — the two consumers that shaped the endpoint's exact minimal surface.
**Not.** Not bearer-gating health (breaks uptime probes; nothing sensitive returned). Not
exposing auth details or config in health output.
**Premise.** No factual premises — pure design choice.

**D26. Test seam: constructor-injected `fetch` and clock; vitest as the runner (plan-level
confirmable).** *(R-REL-2, R-REL-4, R-REL-7 — the seams that make them testable; enables AC-11,
AC-19, AC-24, AC-25)*
**Decision.** `aps-http` takes its fetch implementation via constructor (default: global fetch);
TokenManager and SpendGuard take a clock. Acceptance-critical simulations (transient 429/5xx,
timeout, crash-between-rotation-and-persist via injected fs hooks in TokenManager, spend-cap
exhaustion) run against these seams without network. The unit/e2e runner choice (vitest) is
recorded as a dev-tooling default the plan may confirm; no architectural surface depends on it.
**Standard.** SOLID dependency inversion applied at the I/O boundary.
**Why here.** The spec's failure-mode acceptance criteria (AC-11 timeouts, AC-19 backoff, AC-25
crash windows, AC-24 cap exhaustion) all demand *induced* failures reproduced deterministically
on Windows — conditions only an injectable seam at the network/clock/fs boundary can stage
without flaky network dependence; inversion here is what makes those criteria testable at all.
**Not.** Not module-level monkey-patching (undici mock agents, jest module mocks) as the primary
seam — injection is explicit and framework-independent. Not network-dependent acceptance tests
for failure classes (AC-11/25 require *induced* failures).
**Premise.** No factual premises — pure design choice.

**D27. Model Derivative URN contract: MD tools take a validated `version_id`; the gateway derives
the URN; foreign CAD enters through a generic DM upload tool.** *(R-EXPORT-3/4, S-10; AC-7,
AC-23)*
**Decision.** Tools 23–26 and 37 take `version_id` — a Data Management version id in URN form
(`urn:adsk.wip…:fs.file:vf.…?version=N`), validated at the `md-gateway` boundary by a zod
pattern on that URN grammar; the gateway base64url-encodes it internally to form the Model
Derivative URN. **Tool 37's second input, `derivative_urn`, carries its own stated contract.**
Grammar, zod-validated at the same `md-gateway` boundary: the anchored form
`urn:adsk.viewing:fs.file:<source>/<segment>[/<segment>…]` — the literal
`urn:adsk.viewing:fs.file:` prefix, a `<source>` segment, then one or more non-empty
`/`-separated segments, with `..` segments, `?`, `#`, `\`, and control characters rejected
(verified form: the manifest's `derivatives[].children[].urn` and the `signedcookies` reference
invocation both carry `urn:adsk.viewing:fs.file:<base64 source>/output/<guid>/<filename>` —
Context7 `/websites/aps_autodesk_en`, MD v2, 2026-07-30). The parameter is additionally
**bound to `version_id`, not opaque**: the gateway independently derives the base64url MD URN
from the validated `version_id` and rejects any `derivative_urn` whose `<source>` segment
differs from it, so the only base64 the parameter can carry is a value the gateway itself
recomputes. **Path composition — D6 governs, unmodified.** The vendor's record here is
two-sided: the Model Derivative reference defines the parameter normatively as "the URL-encoded
URN of the derivative" (the derivative GET and HEAD reference pages and the .NET SDK reference
alike), while its own worked invocations embed the URN with literal `/` and `:`. The gateway
follows the normative definition — the validated `derivative_urn` is percent-encoded as a
whole value (`encodeURIComponent`) when composed into the request path, exactly as D6 requires
of every path segment. The worked examples are treated as evidence that the server also
tolerates the literal form, not as the contract; whether the encoded form is accepted on the
wire cannot be exercised while the credential is cleared, so the residual and its closing
check are recorded as Limitation 8(c).
The `ItemVersion` ids that feed it are reachable from the rest of the surface
(schema-verified): tool 5 returns them via `tipVersion{id}` on all four concrete Item types,
and tool 35 via `itemVersions → ItemVersions.results: [ItemVersion]!`; tool 6 returns one only
on its `ConfiguredDesignItem` branch (`tipVersion.id`) — its `DesignItem` branch returns
`tipRootComponentVersion.id`, a `ComponentVersion` id, and its Basic/Drawing branches return
item ids only — and tool 7 returns no version id, so a caller holding a tool 6 or tool 7 result
reaches an `ItemVersion` id through tool 35. This decision assumes `ItemVersion.id` **is** the
DM version-URN form; the schema types it only as `ID!`, and the assumption is **not
live-verified** — see Limitation 8(b) for the exact check and for the derivation step required
if it proves false. Raw pre-encoded base64 URNs from callers are rejected **in the
`version_id` position** (an opaque string the boundary cannot validate, flowing into a REST
path); `derivative_urn` carries a base64 segment only under the recompute-and-match binding
above, which is what makes it validatable rather than opaque. Foreign-CAD
ingestion (R-EXPORT-4): tool 36 `aps_upload_file` uploads any file type through D23's DM
pipeline (storage → signed-S3 → complete → first-version item), returning item + version ids
whose `version_id` feeds tools 23–26 and 37 — making the MD tool group reachable end-to-end
from the rest of the surface (AC-7's non-Fusion translate path is self-sufficient).
**Standard.** [APS-MODELDERIVATIVE] (the MD URN is the base64 form of the design/version URN);
[OWASP-SSRF]/spec S-10 (input-influenced path segments validated before use); spec R-EXPORT-3/4.
**Why here.** Model Derivative is keyed by URN while every other tool deals in ids — without a
stated derivation the whole MD group is unreachable by an agent holding this server's own
outputs, and the URN parameters would be the caller strings entering a URL path without a
grammar.
**Not.** Not caller-supplied opaque base64 URNs (unvalidatable at the boundary; S-10 hole;
usability cliff — no other tool emits one). Not folding upload into tool 20 (that is the MFG
`createDesignFromFile` mutation producing a Fusion design — R-WRITE-3's distinct concern; a
foreign CAD file must become a plain DM item).
**Premise.** DM ids are URN-form with `?version=` qualifiers — observed in the Webhooks callback
envelope's top-level `resourceUrn` (`"urn:adsk.wipprod:fs.file:vf.…?version=1"` — Context7
`/websites/aps_autodesk_en`, `dm.version.added` callback reference, 2026-07-30) and the
DM storage/item-creation flow (D23's verified lookups). The base64url derivation is the
documented MD convention, and the predecessor implements exactly it (`urnToBase64` in
`src/services/aps-client.ts`, read via the survey this session) — cited as evidence of the
encoding, not as precedent. The derivative URN's
`urn:adsk.viewing:fs.file:<base64 source>/output/<guid>/<filename>` form and its reuse of the
source design's base64url MD URN as its `<source>` segment: Context7
`/websites/aps_autodesk_en` (MD v2 manifest response shape and the `signedcookies` reference
invocation), 2026-07-30. The parameter's two-sided record — `derivativeUrn` defined as "the
URL-encoded URN of the derivative" on the derivative GET and HEAD reference pages and in the
.NET SDK reference, while the reference and tutorial invocations embed it with literal `/` and
`:` — same source, 2026-07-30; D27 follows the normative definition, with the residual in
Limitation 8(c).

**D28. The server performs no caller-directed local I/O: upload tools take bytes, never
filesystem paths; and no caller value ever becomes a URL the server or Autodesk fetches.**
*(S-5, S-8, S-10, S-3; T5; AC-14, AC-23)*
**Decision.** Tools 20 and 36 accept **file content as size-bounded base64 bytes only**
(`UPLOAD_MAX_BYTES`, config, default 100 MB, checked after decode; the transport-layer bound that
actually caps resident bytes is D3's `HTTP_MAX_BODY_BYTES` on the `express.json` parser, derived
from this value so the two cannot drift) — there is no path parameter, so there is no path
to canonicalize, no traversal to block, and no symlink policy to get wrong. The server's only
filesystem reads are its own config and its own credential/state directory (D10/D24), neither of
which any tool argument can name or influence. Symmetrically, **no caller-supplied value ever
becomes a URL that the server or Autodesk fetches**: D27 makes MD inputs grammar-validated —
`version_id`, from which the gateway derives the MD URN, and tool 37's `derivative_urn`, bound
to `version_id` by D27's recompute-and-match rule and percent-encoded whole per D6; D23 makes
Design Automation WorkItem
argument URLs **gateway-minted** from Data Management ids (callers name activities and their
declared *values*, never `url`/`headers` fields, so a caller cannot point a WorkItem at an
arbitrary host); D22 governs every remaining outbound URL.
**Standard.** OWASP ASVS 4.0.3 V12 (Files and Resources) — user-submitted path metadata must
never reach a filesystem API, and the strongest form of that control is not accepting the
metadata; spec S-8 (validate at the boundary, model as untrusted) against T5; [OWASP-SSRF] for
the URL half.
**Why here.** This server runs with the owner's OS identity and its credential file sits at a
path this very document publishes — so a caller-supplied read path is not an abstract traversal
risk but a direct route to asset A1: name the token file, have the server upload it to a folder
the caller can read back via tools 5 and 12, and S-3/S-5/AC-14 all fall at once. Bytes-only
removes the capability rather than guarding it.
**Not.** Not a constrained upload root with canonicalization + symlink resolution: it is the
standard mitigation and it is defensible, but it keeps a caller-influenced filesystem read in a
process holding a full-account credential, and buys only operator convenience the MCP client can
supply by reading the file itself. Not path-plus-denylist over the credential directory
(denylists fail by omission — the exact anti-pattern D22 rejects for hosts). Not unbounded bytes
(a memory-exhaustion path; R-REL-5's bounding discipline applies to input as well as output).
**Premise.** The credential/state paths this decision protects are the ones D10 and D24 specify
(`%USERPROFILE%/.aps-fusion-mcp/`, `$HOME/.aps-fusion-mcp/`, `<credential-dir>/state/` holding
`webhook-secrets.json` and the refresh journal) — read from those decisions in this document.
The WorkItem argument shape whose `url`/`headers` fields this decision keeps gateway-owned is
spec §13 Q-3, verified 2026-07-24. No library behavior is claimed.

---

**Pre-delivery multi-perspective review (collaborativereasoning, recorded).** Planner, reviewer,
and stakeholder personas were run against the drafted architecture. Planner gaps — contract-grade
tool inventory, a named DA output folder config, and a stated location for polling markers — were
folded in (inventory table; `DA_OUTPUT_FOLDER_ID` in D21/D23; markers in D24). Reviewer
confirmed each security decision carries an observable check (AC references in D2, D6, D10, D11,
D13, D22). Stakeholder confirmed the plain-language cost/risk story and required the residuals to
be findable — they are in Limitations. No unresolved perspective gaps remain.

**Sequentialthinking attestation.** Three decisions met the structured-decomposition trigger
(multiple valid approaches with downstream rework risk): D5 (v2 isolation), D7 (aggregation under
the point budget), D8 (rotation atomicity) — traces summarized in those decisions' Standard/
Premise slots, recorded via the tool this session. Remaining decisions had either a clear
standard-mandated answer or a recorded multi-criteria matrix (D1, D2, D10 via decisionframework).

**Structuredargumentation trace — why the rotation crash window is bounded rather than closed
(governs D8(b), R-REL-7).** The question is whether a client can guarantee that a crash between
Autodesk's issuance of a rotated refresh token and its durable persistence leaves a usable
credential.

- *Thesis.* It cannot: under C2 the prior token dies the instant the replacement is issued, and a
  client cannot persist a token it has not yet received.
- *Antithesis.* The window might be closable — the same response carries an access token valid for
  ~1h, and some providers grant a refresh grace period; either would leave a usable credential
  across the crash.
- *Synthesis (adopted).* The antithesis narrows the window but does not close it. Crashes *before*
  the response arrives leave the stored credential untouched and recover automatically; crashes
  *after* the atomic rename are durable; only the interval strictly between receipt and durable
  write is unrecoverable. The access-token limb fails as a general answer — it holds for at most an
  hour, on a server designed for unattended scheduled runs (D-1) where no human is present when it
  expires. The grace-period limb is contradicted by observation: a process refreshing with a token
  a sibling had already rotated receives `invalid_grant`
  (`prior-session-artifacts/FINDINGS.md`:531); Autodesk's published Authentication v2
  documentation states a 15-day refresh-token lifetime but does not document prior-token
  invalidation either way, so the observation governs.

The design therefore bounds what it cannot eliminate: D8(b) writes the response bytes durably
before parsing, leaving no application work inside the window, and refreshes on demand rather than
opportunistically so the window opens as rarely as the workload allows; D8(a) makes the outcome
detected, non-destructive, and actionable.

**Conditional-tool attestation.** structuredargumentation was invoked for the C2 / rotation-window
question, and its thesis/antithesis/synthesis appears above. One further tension was examined and
found *not* to be a contradiction: the apparent localhost-binding-vs-hosted-reachability conflict resolves within
the spec's own terms via D1 (always-loopback bind published through a TLS-terminating ingress) —
a soft ambiguity, resolved and recorded rather than routed to the owner. debuggingapproach (mandatory when foundation problems are flagged) was not
invoked: the build starts on a fresh tree (spec M-1/M-2 — the predecessor is replaced, not built
upon), so no codebase foundation exists for this architecture to inherit or characterize; the
predecessor's defects are recorded as migration evidence in the decisions' premise slots, not as
foundations to repair.

## Threat model

Inherited whole from spec §4 (assets A1–A4, attackers T1–T8, compromise costs) — not re-derived;
restated here only as the control mapping, structured per scientificmethod (inquiry
`aps-fusion-threat-model`, recorded this session).

**Observation.** The server holds a full-account Autodesk credential, is internet-reachable
through the owner's tailnet (plus, when webhooks are enabled, one funnel-published public
route), and is driven by an untrusted-input agent. The predecessor demonstrably
shipped T1 (unauthenticated `/mcp`, all interfaces) and partial T5 (bare-quote interpolation),
and destroyed A1 on benign errors.
**Question.** Does the control set leave any of T1–T8 unmapped or untestable?
**Hypothesis.** Every threat maps to ≥1 structural control observable through a named AC;
residuals are recorded, not hidden.
**Experiment (the per-threat mapping; verification = the named ACs at build time):**

The control column is **composed, not curated**: the spec binds each security requirement to its
threats (§8, e.g. "S-10 (T5, SSRF)"), and this document's decisions declare the requirements they
satisfy; threat → controls is the join of the two. It therefore cannot drift from the decisions
without the decisions themselves changing.

| Threat | Via spec requirements | Structural control (decision) | Observable check |
|---|---|---|---|
| T1 endpoint abuse | S-1, S-2, S-3, S-12 | MCP surface tailnet-only, never public (D1); per-request bearer gate ahead of the transport (D2); stateless transport, no session authority (D3); credential lifecycle confined to the TokenManager, never crossing the caller boundary (D8); no caller-directed local reads (D28) | AC-13 |
| T2 interception | S-2, S-14 | WireGuard transport + tailscaled-terminated TLS on serve and funnel paths (D1); credential never crosses to callers (D2); PKCE S256 (D9) | AC-27 |
| T3 host compromise | S-3, S-5 | ACL-enforced store, startup-verified (D10); no secrets in logs (D20); no path input can name the store (D28); no credential passthrough (D2); credential file owned solely by the TokenManager, with classified failure handling that never exposes it (D8) | AC-14 |
| T4 forged/replayed webhook | S-6 | Raw-body HMAC over per-hook secrets, constant-time (D11); content-hash replay dedupe (D11) | AC-9 |
| T5 crafted arguments | S-7, S-8, S-9, S-10, S-11 | Variables-only GraphQL (D6); enforced spend cap at the outbound chokepoint (D13); truthful cost/effect annotations (D14); boundary zod validation of every tool argument (D17); egress allowlist with redirect re-validation (D22); URN grammar validation (D27); bytes-only uploads and gateway-minted job URLs (D28) | AC-15, AC-23, AC-24 |
| T6 token leakage | S-5 | Allowlist logging + pino redact (D20); ACL'd store, secrets never in results (D10); no tool path can exfiltrate the store (D28) | AC-14, AC-12 |
| T7 DNS-rebinding / cross-origin | S-4 | Loopback bind, tailnet-only publication (D1); explicit Origin middleware → 403 (D3) | AC-13 |
| T8 output-borne injection | S-13 | OutputGuard neutralization of external-content fields, applied by the registration wrapper (D19) | AC-26 |

**Analysis.** All eight threats carry ≥1 control. The converse — no control without a threat — is
checked the same way: every decision that declares a security requirement appears in the row of
each threat that requirement serves, so a control absent from this table would be a decision
declaring no requirement. Controls are middleware/module-level, so absence is a composition
failure visible in review, not a per-handler audit.
**Conclusion.** Complete against the spec's threat model with three named residuals (see
Limitations): same-user malware vs the credential store; Tailscale in the trust path; Autodesk-fixed
HMAC-SHA1.

## ASVS verification mapping

OWASP ASVS 4.0.3 areas applicable to this security surface (single principal, bearer gate, no
sessions, no user-facing web UI):

| ASVS area | Disposition |
|---|---|
| V2 Authentication | D2 (per-request secret, constant-time compare); D9 (PKCE server-to-Autodesk) |
| V3 Session Management | Satisfied by absence, by design: D3 issues no session identifiers; authority never session-derived (S-12) |
| V4 Access Control | Single-principal model (spec §2.2); D2 is the entire access decision; no object-level ACL surface exists |
| V5 Validation, Sanitization & Encoding | D17 (boundary schemas), D6 (parameterized GraphQL / encoded REST), D19 (output sanitization) |
| V6 Stored Cryptography | D10 (at-rest protection via OS ACL; encryption-at-rest deferred — Limitations); D11 (webhook-secret generation: `crypto.randomBytes`, 256-bit, rotated on re-registration) |
| V7 Error Handling & Logging | D16 (no internal detail leakage in errors), D20 (redaction, no secrets) |
| V8 Data Protection | D10, D24 (all sensitive state inside the protected dir); S-3 no-passthrough (D2) |
| V9 Communications | D1 (TLS at every network boundary), D22 (https-only egress) |
| V12 Files & Resources | D28 (the server performs **no** caller-directed filesystem reads — upload tools accept bytes only, size-bounded; no path input exists to traverse), D23 (uploads travel only through Autodesk-issued signed URLs) |
| V13 API & Web Service | D3 (Origin validation, protocol conformance), D14 (truthful contracts), D13 (rate limiting) |
| V14 Configuration | D21 (validated, documented, secrets outside repo) |
| V1 Architecture / V10 Malicious Code / V11 Business Logic | V1 satisfied by this document; V10 n/a (no code-loading surface — DA jobs run at Autodesk, not in-process); V11 covered by D13 (the only business-logic abuse surface is spend) |

## Traceability matrix

| Requirement | Decisions | | Requirement | Decisions |
|---|---|---|---|---|
| R-DISC-1 | D5, D15 (tools 2–5, 35) | | R-PROTO-1 | D3 (incl. pinned capability set) |
| R-DISC-2 | D5, D15 (tool 6) | | R-PROTO-2 | D3, D20 |
| R-DISC-3 | D5 (verified fields) | | R-PROTO-3 | D16 |
| R-DISC-4 | D7, D19 (cursors/truncated) | | R-PROTO-4 | D14 |
| R-READ-1 | D5, D15 (tool 7) | | R-PROTO-5 | D15, D17 |
| R-READ-2 | D7 (tool 8) | | R-PROTO-6 | D17 |
| R-READ-3 | D5 (tool 9) | | R-REL-1 | D18 |
| R-READ-4 | D5 (tool 10) | | R-REL-2 | D8, D16; D26 (test seam) |
| R-READ-5 | D5 (tools 11–12) | | R-REL-3 | D8 |
| R-READ-6 | D5 (tool 7 composition param) | | R-REL-4 | D18; D26 (test seam) |
| R-WRITE-1 | D5 (tools 13–14) | | R-REL-5 | D7, D19, D28 |
| R-WRITE-2 | D5 (tools 15–19) | | R-REL-6 | D4, D16, D21 |
| R-WRITE-3 | D23 (tool 20), D28 (bytes-only input) | | R-REL-7 | D8, D24; D26 (test seam) |
| R-WRITE-4 | D14 | | R-OPS-1 | D20 |
| R-EXPORT-1 | D5, D14 (tool 21) | | R-OPS-2 | D4, D21 |
| R-EXPORT-2 | D14 (tool 22) | | R-OPS-3 | D3 (serverInfo), D21, D25 |
| R-EXPORT-3 | D15 (tools 23–24, 37), D27 (URN contract) | | R-OPS-4 | D1, D25 (docs deliverable incl. both trust models) |
| R-EXPORT-4 | D15 (tools 25–26), D27 (URN derivation + tool 36 ingestion) | | R-OPS-5 | D25 |
| R-EXPORT-5 | D14, D15 (submit/status/retrieve split — tools 21/22, 23/24/37, 28/29/30) | | S-1 | D2 |
| R-AUTO-1 | D23 (tool 28) | | S-2 | D1; audience clause n/a per D2 |
| R-AUTO-2 | D23 (tools 29–30) | | S-3 | D2, D8, D28 |
| R-AUTO-3 | D14 (tool 28 contract) | | S-4 | D1, D3 |
| R-AUTO-4 | D23 (no embedded activities) | | S-5 | D10, D20, D28 (no caller-directed local reads) |
| R-AUTO-5 | D15 (tool 27) | | S-6 | D11 |
| R-NOTIFY-1 | D11, D15 (tools 31–33) | | S-7 | D6 |
| R-NOTIFY-2 | D12 (tool 34) | | S-8 | D17, D28 (input-shape constraints) |
| R-NOTIFY-3 | D11 | | S-9 | D13, D14 |
| R-AUTH-1 | D8 (probe specified), D9 (tool 1) | | S-10 | D22, D27, D28 |
| | | | S-11 | D13 |
| | | | S-12 | D2, D3 |
| | | | S-13 | D19 |
| | | | S-14 | D9 |

Every spec R-# and S-# is accounted for; none deferred out of architecture scope.

## Limitations and trade-offs

1. **Same-user host compromise reads the credential (T3 residual).** All three evaluated store
   options share this residual; the ACL file was chosen on verifiability and operability grounds
   (D10). Deferred hardening: DPAPI/keychain encryption-at-rest **if** a maintained, verifiable
   Node binding emerges — none was resolvable via Context7 this session.
2. **Tailscale in the trust path (D1 trade-off).** MCP availability depends on the tailnet
   (control plane + client daemons), and — when webhooks are enabled — the funnel path transits
   Tailscale's ingress with TLS terminated by the local tailscaled. The owner already carries
   this trust for all his hosted services, so it adds no new party; the residual is that a
   tailnet-wide compromise reaches the served port, which is why the bearer gate (D2) remains a
   separate, mandatory layer. Webhooks are strictly optional: with Funnel off the machine has
   zero public surface and polling (D12) carries change detection.
3. **MFG v2 deprecation risk.** v2 carries a "deprecated soon" banner with no published EOL; v3
   removes `ComponentVersion` (rewrite-class). Mitigated, not eliminated, by D5's one-module
   confinement. Re-introspection of v3 is the first step of any migration.
4. **Webhook HMAC is SHA-1** — Autodesk's fixed mechanism (Q-1). Keyed-MAC use, not
   collision-exposed signature use; constant-time compare applied. Not upgradeable from our side.
5. **Spend caps are count-based, not dollar-based** (D13) — enforceable without a pricing oracle;
   the owner tunes counts against Autodesk's token pricing tables.
6. **Replay dedupe window is finite** (default 24h TTL): a byte-identical replay after the window
   relies on event-consumption idempotence (the journal is read-side, so late replays re-append a
   stale event but trigger no action).
7. **Crash window in token rotation cannot be zero** (D8): under C2, Autodesk kills the prior
   refresh token the instant it issues the replacement, so a crash between receipt and durable
   write costs a one-time browser re-auth. The design bounds the window to a single `fsync` —
   the raw response bytes are written durably before any parsing — makes refreshes demand-driven
   so the window opens as rarely as the workload allows, and makes the outcome detected,
   non-destructive, and actionable. Why this is a bound rather than an elimination is argued in the Design decisions
   section; R-REL-7 and AC-25 state the property in those terms.
8. **Unverified-by-tool items — two are load-bearing.** (a) The signed-URL host patterns for the
   egress allowlist (D22) will be pinned exactly at implementation from observed responses;
   `EGRESS_ALLOW_HOSTS` exists so this is config, not code. Tool 37's Model Derivative download
   URL is outside this concern by construction: the server returns it to the caller and never
   fetches it, so the download host adds no egress-allowlist entry. (b) **Load-bearing:** D27 assumes
   `ItemVersion.id` — returned by tool 5 (`tipVersion.id`), tool 35 (`itemVersions` results),
   and tool 6's `ConfiguredDesignItem` branch — is the Data Management version-URN form
   (`urn:adsk.wip…:fs.file:vf.…?version=N`) that the Model Derivative gateway base64url-encodes.
   The introspected schema types the field only as `ID!` and carries no format information, and
   **this could not be verified live: the stored Autodesk credential is cleared** (the
   predecessor's wipe defect; M-3's one-time browser re-auth is outstanding), so the repo's
   working client `docs/apsq.mjs` cannot run. Evidence is mixed — the `dm.version.added` callback
   shows the version URN sharing its opaque suffix with the lineage URN, which makes the mapping
   plausible, while prior-session live samples record MFG *item* ids in `dm.lineage` form. **The
   check that closes this:** after re-auth, run `itemVersions(hubId:, itemId:)` requesting
   `results { id versionNumber }` through `docs/apsq.mjs` and inspect the returned `id` for the
   `fs.file:vf.…?version=` grammar. If it does not match, D27 needs an explicit id-derivation
   step (DM version id ← MFG `ItemVersion.id`) that this document does not currently specify.
   AC-7's foreign-CAD path is unaffected either way — it runs through tool 36 and D23's DM
   pipeline, which returns DM ids natively. (c) **Load-bearing for tool 37:** whether the
   `signedcookies` endpoint accepts `derivative_urn` percent-encoded as a whole value — the
   reference's stated parameter form, which D27 follows — or only the literal-slash form its
   worked invocations use, or both, cannot be exercised for the same reason as (b). **The check
   that closes this:** after the M-3 re-auth, issue the signedcookies request for a real
   derivative with the whole value percent-encoded; if it 400s, issue it in the literal form,
   switch D27's composition to the observed form, and record the observation in D27's premise.
9. **No rigor was waived** by the owner this session; no skipped-step gaps exist.
10. **`/auth/login` and `/auth/callback` are reachable without the bearer secret** (D9 gate
    placement): browser navigations cannot carry the header, so any process on a tailnet device
    can initiate a login flow or hit the callback. Bounded by tailnet-only reachability, the
    `state` binding, the 10-minute verifier TTL, and the callback's exchange-only behavior; a
    hostile *completion* of a login still requires the owner's Autodesk credentials in the
    browser.
11. **MFG Data Model becomes a priced API on 2026-08-17** (C4).
    The owner-confirmed same-team placement means the subscription-included allowance
    applies, so R-class tools are labeled "no metered charge under the included allowance" rather
    than unconditionally free. SpendGuard does not meter MFG read consumption (query points) —
    counting them client-side would duplicate Autodesk's own metering without an authoritative
    pricing oracle; if post-transition usage approaches the allowance, extending SpendGuard with
    a query-point counter is the named growth path.

## Standards governing this architecture

| Standard | Source | What it governed |
|---|---|---|
| [MCP-TOOLS] MCP spec 2025-11-25 Server/Tools | spec §3 (fetched 2026-07-24) | D13 (MUST rate-limit), D14 (annotations), D15 (schemas), D16 (error results), D17 (schema discipline), D19 (MUST sanitize outputs) |
| [MCP-TRANSPORT] MCP 2025-11-25 Transports | spec §3 | D1 (localhost bind), D3 (Origin validation, stdio purity) |
| [MCP-LIFECYCLE] MCP 2025-11-25 Lifecycle | spec §3 | D3 (2025-11-25 negotiation), D18 (timeouts) |
| [MCP-AUTHZ] MCP 2025-11-25 Authorization | spec §3 | D2 (OAuth-is-SHOULD → simpler gate; no token passthrough) |
| [MCP-SEC] MCP 2025-11-25 Security Best Practices | spec §3 | D2/D3 (sessions never authority), D9 (local interception), D22 (SSRF) |
| [OAUTH-2.1] draft-ietf-oauth-v2-1-15 §7.5.1.1 | spec §3 | D9 (PKCE S256) |
| [SDK] @modelcontextprotocol/sdk v1.29.0 | Context7 v1.29.0, 2026-07-28 | D3 (transport wiring), D14 (annotation defaults), D16 (isError), D17 (outputSchema, zod compat) |
| [APS-SCHEMA] introspected MFG schema | `docs/aps-mfg-schema.json`, grepped this session | D5, D6, D7, D12 (field/mutation existence) |
| [APS-DATAMGMT] Data Management v2 | Context7 `/websites/aps_autodesk_en_data_v2`, 2026-07-28 | D12 (rollup polling), D23 (storage + signed-S3 pipeline) |
| [APS-MODELDERIVATIVE] Model Derivative | spec §3 + Context7 `/websites/aps_autodesk_en` (MD v2), 2026-07-28: `properties:query` `pagination{offset,limit(1–1000),totalResults}`; object-tree `objectid`/`level` narrowing with 20 MB/`forceget` ceiling; 2026-07-30: derivative download via `…/manifest/:derivativeUrn/signedcookies` returning `{etag, size, url, content-type, expiration}` + signed cookies | D15 (tools 23–26 and 37 capability set; tool 25/26 dispositions), D27 (URN contract) |
| [APS-OAUTH] APS Authentication v2 | spec §3/§5 (C1–C3 observed live) | D8 (rotation/scope-subset handling), D9 |
| [APS-WEBHOOK] APS Webhooks v1 | spec §13 Q-1 (verified 2026-07-24) | D11 (HMAC-SHA1 scheme) |
| [APS-DA] Automation v3 | spec §13 Q-3 (verified 2026-07-24) | D23 (WorkItem model) |
| [APS-COMMERCIAL] APS commercial model | spec §3/C4 | D13, D14 (metered categories; same-team allowance confirmed by owner) |
| [OWASP-SSRF] SSRF Prevention Cheat Sheet | spec §3 | D22 (allowlist, redirect validation), D27 (URN grammar validation before path use), D28 (no caller value becomes a fetched URL) |
| [OWASP-INJECTION] OWASP A03:2021 + parameterized-query guidance | spec §3 | D6 |
| [OWASP-SECRETS] secret-storage guidance | spec §3 | D10, D20 |
| OWASP ASVS 4.0.3 | published standard | ASVS mapping section; drove D2/D10/D16/D20/D21/D22 verification framing; **V12 drove D28** (no caller-directed filesystem reads) |
| OWASP Threat Modeling | published guidance | Threats-before-controls ordering (the threat model is inherited whole from spec §4 and was fixed before any control decision here was made; the Threat model *section* follows Design decisions because the authoring contract's Phase 11 structure mandates that order); D1 surface minimization |
| ISO/IEC 25010:2023 | published standard | Quality characteristics table; performance-efficiency bounding stance |
| SOLID | industry consensus (named source: Martin, Agile Software Development) | D4 (layering, SRP), D26 (dependency inversion at I/O seams) |
| RFC 9110 HTTP Semantics | published standard | D2/D11 status-code semantics (401 bearer rejection; 403 unverified origin/signature; 200 idempotent accept); D18 idempotent-method discipline (§9.2.2) |
| Crash-Only Software (Candea & Fox, HotOS IX, 2003) | published paper | D8 (journal-then-act, atomic rename, recover-on-restart) |
| The Twelve-Factor App, §III "Config" | 12factor.net | D21 (config in the environment, validated at startup, strict separation from code) |
| Google SRE Book, ch. 22 "Addressing Cascading Failures" (Beyer et al., O'Reilly, 2016) | published book | D18 (bounded exponential backoff with jitter; no retry of non-idempotent operations) |
| Express 5 | Context7 `/expressjs/express`, 2026-07-28 (D11) and 2026-07-30 (D3) | D3 (`express.json` body-limit default behind the `/mcp` parser mount), D11 (raw-body capture for HMAC) |
| Tailscale Serve / Funnel | Context7 `/websites/tailscale`, 2026-07-28 | D1 (serve = tailnet-only HTTPS; funnel = public HTTPS, ports 443/8443/10000, tailscaled TLS termination) |
| pino | Context7 `/pinojs/pino`, 2026-07-28 | D20 (redact, destinations) |
| zod v4 | Context7 `/colinhacks/zod` (v4 API reference `packages/docs/content/api.mdx`), 2026-07-29 (D21) and 2026-07-30 (composition forms, D17/D19) | D17 (schemas; envelope-fragment composition via the v4-documented `.extend()` / shape-spread forms), D19 (fragment composition premise), D21 (`z.discriminatedUnion` mode partition) |

## Status of this architecture

Design → Build gate: every non-trivial decision (D1–D28) carries a named standard or a recorded
first-principles articulation, names its rejected alternatives, and states its premise
verification (or an explicit "no factual premises" marking); the traceability matrix accounts for
all 60 spec requirements with zero deferrals; the threat model maps all eight attackers to
testable controls; Gate A (three-persona), Gate B (auditability), Gate C (structural checklist),
and the five-trap audit were run before delivery — the codebase-mirroring and pattern-cloning
audits pass because every structural divergence from the predecessor is recorded as a decision
with the predecessor cited only as defect evidence (M-1/M-2), and no prior architecture exists in
this family to clone (predecessor architecture discarded per spec header).

**Next:** the Build phase — produce the implementation plan via /expert-plan, consuming this
document and the spec. The plan's per-step Source annotations point at this document's D-numbers
and the Standards table.
