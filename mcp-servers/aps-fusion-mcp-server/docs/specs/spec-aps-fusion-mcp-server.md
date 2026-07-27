# Specification — APS Fusion MCP Server

**Status:** Draft for review
**Author:** spec phase, expert-spec
**Date:** 2026-07-24
**Supersedes:** the prior deleted spec and architecture (reverse-engineered from the broken
server; discarded). This document is written from the live APS schema, the current MCP
specification, and the SDK as installed — not from the existing server's code or comments.

---

## 1. Purpose

Give a single Autodesk-account owner an MCP server that lets an AI agent reach the owner's
Autodesk Platform Services (APS) data and act on it: find and read Fusion design data, write
shop metadata back onto designs, pull geometry out in exchange formats, run headless Fusion
jobs in the cloud, and learn when designs change. The server is hosted so it can receive
Autodesk's change callbacks, run on a schedule, and be reached from more than one device.

The problem it solves: today this data is reachable only by opening Fusion or hand-writing APS
calls. The owner wants an agent to answer "what does this part weigh / what's the BOM / which
assemblies use it / give me a STEP / is this the released rev," to stamp job state back onto
designs, and to submit CAM/nesting/modeling work to headless Fusion — without leaving the chat.

## 2. Scope

### 2.1 In scope

- **Discovery & navigation** across hubs, projects, folders, items, and versions.
- **Reading Fusion design data** via the Manufacturing Data Model (MFG) GraphQL API:
  metadata, full assembly structure, physical properties, where-used, custom properties,
  drawings, thumbnails.
- **Writing data back** via MFG mutations: custom property values and definitions, folder
  operations, file/design creation.
- **Geometry export**: STEP/STL/OBJ via MFG derivatives; other formats (IGES, DWG, FBX, IFC,
  SVF2) and foreign-CAD translation via Model Derivative; translation status and metadata.
- **Headless Fusion automation** via the Automation API (Design Automation v3, Fusion engine):
  submit a job against a named activity, poll it, retrieve results.
- **Change notification**: register and verify APS Webhooks for Data Management events, with a
  polling capability as an alternative.
- **Hosted deployment** with an authenticated MCP endpoint, plus the local development path.

### 2.2 Out of scope, with reasoning

- **Fusion Operations (MES) API** — the owner does not run Fusion Operations; the API requires
  the product. No production-order/inventory/shop-floor surface is specified. *(Confirmed with
  owner, 2026-07-24.)*
- **Multi-user access control / per-user identity** — a single Autodesk identity is the only
  principal on the Autodesk side. The MCP endpoint still authenticates its callers (§8), but the
  server does not model multiple end-user identities or per-user data partitioning. *(Confirmed
  with owner, 2026-07-24.)*
- **The content of individual Fusion Automation jobs** — the Automation API runs owner-authored
  TypeScript inside headless Fusion; Autodesk ships no job logic. Each distinct job (e.g. "rough
  and finish a plate part," "nest a batch") is a separate authored deliverable. This spec covers
  the *subsystem that submits, tracks, and retrieves* jobs; the job programs themselves are named
  and specified later as inputs to it (§12, D-9). This is a deliberate deferral, not a gap.
- **AEC Data Model, Vault, Tandem, Reality Capture, Parameters, Content Catalog, and other APS
  services** — not relevant to a manufacturing shop's Fusion workflows.
- **A browser Viewer UI** — the consumer is an MCP client (an agent), not a web page.

### 2.3 Relationship to the existing server

The existing server (`src/`) is treated as a broken predecessor, not a baseline. Its behavior
is evidence of what was built, never a source of requirements. Where this spec's requirements
diverge from its behavior, that divergence is intended. Notable divergences are recorded as
decisions in §11.

## 3. Governing standards

Every non-trivial requirement traces to one of these. This table is the traceability anchor.

| Tag | Standard / source | Governs | Verified |
|---|---|---|---|
| **[MCP-TOOLS]** | MCP spec 2025-11-25, Server/Tools | tool definitions, schemas, result & error semantics, annotations | fetched 2026-07-24 |
| **[MCP-TRANSPORT]** | MCP spec 2025-11-25, Transports | stdio & Streamable HTTP conformance, Origin validation, localhost binding | fetched 2026-07-24 |
| **[MCP-LIFECYCLE]** | MCP spec 2025-11-25, Lifecycle | initialize, capability & version negotiation | fetched 2026-07-24 |
| **[MCP-AUTHZ]** | MCP spec 2025-11-25, Authorization | HTTP server as OAuth 2.1 resource server; audience validation; no token passthrough | fetched 2026-07-24 |
| **[OAUTH-2.1]** | OAuth 2.1 (draft-ietf-oauth-v2-1-15) §7.5.1.1 | PKCE (`code_challenge`/`code_verifier`) required for the authorization-code grant | named standard; referenced by [MCP-AUTHZ]; verified 2026-07-27 |
| **[MCP-SEC]** | MCP spec 2025-11-25, Security Best Practices | confused deputy, token passthrough, session hijacking, SSRF, local-server exposure | fetched 2026-07-24 |
| **[SDK]** | `@modelcontextprotocol/sdk` v1.29.0 docs & schemas | `registerTool`, `outputSchema`/`structuredContent`, `isError` error reporting | Context7 at v1.29.0, 2026-07-24 |
| **[APS-SCHEMA]** | Live MFG Data Model GraphQL schema (209 types) | available queries, mutations, fields, enums | introspected; on disk `docs/aps-mfg-schema.json` |
| **[APS-MODELDERIVATIVE]** | APS Model Derivative API (REST) | translation to formats beyond STEP/STL/OBJ (IGES, DWG, FBX, IFC, SVF2); foreign-CAD translation; object tree; per-object properties; thumbnails | named API; capability confirmed; translation-job REST body is implementation-level |
| **[APS-DATAMGMT]** | APS Data Management API (REST/JSON:API) | folder/item/version browsing where used instead of the MFG GraphQL navigation fields | named API |
| **[APS-OAUTH]** | APS Authentication v2 (OAuth 2.0, authorization-code + refresh, PKCE) | user-context auth, refresh-token rotation, scope-subset rule, PKCE | scope-subset + rotation observed live; **PKCE S256 supported — confirmed 2026-07-24** |
| **[APS-WEBHOOK]** | APS Webhooks v1 | event set, `x-adsk-signature` callback signing, secret token | **confirmed 2026-07-24: HMAC-SHA1, `sha1hash=<hexdigest>` over the UTF-8 payload, `x-adsk-signature` header** |
| **[APS-DA]** | APS Automation API v3 (Design Automation), Fusion engine | AppBundle → Activity → WorkItem model, async job lifecycle | **confirmed 2026-07-24: `POST /da/us-east/v3/workitems` `{activityId, arguments{url,verb,headers}}`; status enum; `GET /workitems/:id`** |
| **[APS-COMMERCIAL]** | APS commercial model | MFG Data Model priced from 2026-08-17; Model Derivative & Automation metered | fetched 2026-07-24 |
| **[OWASP-SSRF]** | OWASP SSRF Prevention Cheat Sheet | validation of any host/URL/path derived from tool input | named standard |
| **[OWASP-INJECTION]** | OWASP Top 10 A03:2021 Injection + parameterized-query / output-encoding guidance | encoding/parameterization of input interpolated into GraphQL documents, request paths, or query strings | named standard |
| **[OWASP-SECRETS]** | OWASP guidance on secret storage | credential-at-rest protection, no secrets in logs/results | named standard |

The external Autodesk facts each requirement rests on were verified against Autodesk's documentation
during spec grounding (see §13 for the webhook signature algorithm, OAuth PKCE support, and the
Automation WorkItem shape). Where a detail remains implementation-level — an exact REST body or
activity-specific argument names — the spec states the *property* the requirement demands and marks
the wire format as such; no requirement below rests on an unconfirmed capability.

## 4. Threat model

Security is in scope: the server holds a long-lived credential to the owner's entire Autodesk
account and, when hosted, is reachable over a network. The threat model precedes the security
requirements (§8), and every security requirement ties to a threat here.

**Assets.** (A1) The Autodesk refresh/access tokens. (A2) The owner's CAD data reachable with
them — read and write. (A3) The webhook secret token. (A4) The ability to submit billable jobs
(Model Derivative, Automation) that cost money.

**Attackers.** (T1) A network party who reaches the hosted MCP endpoint and tries to use it
without authorization. (T2) A party who intercepts traffic between MCP client and server, or
between server and Autodesk. (T3) A party who compromises the host and reads files/environment.
(T4) A forged or replayed webhook callback impersonating Autodesk. (T5) A malicious or confused
model/agent driving the tools with crafted arguments (injection, SSRF-style path abuse,
triggering costly operations). (T6) A party who obtains a leaked token from logs, error
messages, or tool results. (T7) A malicious website loaded in the owner's browser attempting a
DNS-rebinding or cross-origin request against the network- or locally-reachable MCP endpoint, to
drive the server without ever authenticating. (T8) A party who plants injection-shaped content in
data the server returns — a design name, custom-property value, or an imported foreign-CAD file —
so that the text flows into the consuming agent's context as if it were an instruction (a
prompt-injection channel through tool *output*, distinct from the crafted-*input* abuse in T5).

**Costs of compromise.** Exposure of A1 ⇒ full read/write access to all the owner's Autodesk
data by an outside party (highest). Exposure of A2 write path ⇒ silent corruption or deletion of
design data and folders. Exposure of A4 ⇒ unbounded metered spend. Forged A3 ⇒ the server acts
on fabricated "design changed" events.

## 5. Constraints (fixed by circumstance)

- **C1.** Autodesk requires **user-context** authorization for hub/design data; client-credentials
  cannot see a user's hubs. Authenticate-once-then-refresh is the only viable model. [APS-OAUTH]
- **C2.** APS **rotates the refresh token on every refresh**; the prior refresh token is
  invalidated immediately. [APS-OAUTH] — observed live this session.
- **C3.** A refresh request's `scope` must equal or be a subset of the scopes the refresh token
  was granted under; widening it returns `invalid_scope`. [APS-OAUTH] — observed live this
  session (a scope widening bricked the stored credential).
- **C4.** **MFG Data Model becomes a priced API on 2026-08-17**, with a subscription-included
  allowance plus overage; **Model Derivative and Automation are metered**. Included MFG usage
  applies only when the APS app is in the same Autodesk team as the Fusion subscription.
  [APS-COMMERCIAL]
- **C5.** APS Webhooks deliver only to a **public HTTPS callback URL**; a purely local server
  cannot receive them. [APS-WEBHOOK]
- **C6.** The Automation API for Fusion accepts **TypeScript** job code only (desktop Fusion
  scripting is Python/C++); jobs run via the AppBundle→Activity→WorkItem model and are billed by
  processing time. [APS-DA]
- **C7.** Host OS for development and operation includes **Windows 11**; any documented run/build
  procedure must work there, not only on Linux. (Project environment.)
- **C8.** MCP protocol revision targeted: **2025-11-25**. [MCP-LIFECYCLE]
- **C9.** Runtime: Node.js ≥ 18; TypeScript; `@modelcontextprotocol/sdk` v1.29.x. (Existing
  toolchain; current and maintained.)

## 6. Functional requirements

Requirements state a property, not a mechanism; two valid designs may satisfy each. IDs are
citable downstream. Each carries its source.

### 6.1 Discovery & navigation

- **R-DISC-1.** The server SHALL let a caller enumerate accessible hubs, the projects in a hub,
  the folders in a project and within a folder, and the items and versions therein. [APS-SCHEMA]
- **R-DISC-2.** The server SHALL let a caller find designs by name across hubs/projects without
  the caller supplying internal IDs. [APS-SCHEMA] (confirmed need — "find the design called X")
- **R-DISC-3.** Folder-tree traversal SHALL use the schema's real navigation fields
  (`foldersByProject`, `foldersByFolderInHub`, `itemsByFolder`, `itemsByProject`); the spec makes
  no assumption that any absent field must be worked around. [APS-SCHEMA] (corrects a false
  premise in the prior effort that folder enumeration was unsupported)
- **R-DISC-4.** Any listing that can exceed a single API page SHALL be paginated, and a result
  that is truncated or has more pages SHALL say so explicitly in its output. [MCP-TOOLS §B4-class
  output discipline]

### 6.2 Reading design data

- **R-READ-1.** For a design or component, the server SHALL expose the identifying and revision
  metadata the schema provides: name, **part number, part description, material name**, version
  number, milestone flag, created/last-modified by and on. [APS-SCHEMA] (confirmed need — quoting,
  BOM, provenance)
- **R-READ-2.** The server SHALL return the **full assembly structure** with, for each node, its
  component-version **id, name, part number, material, and quantity/occurrence relationship** —
  not names alone. [APS-SCHEMA] (a BOM is the named need; names-only, as the old server returned,
  is insufficient) *Note: the schema exposes per-instance `Occurrence` records, not a quantity
  field; quantity is derived by aggregating occurrences per component-version. This is a derived
  value, and the architecture states how it is computed.*
- **R-READ-3.** The server SHALL return physical properties — mass, volume, density, area,
  bounding box — with units, for a component. [APS-SCHEMA]
- **R-READ-4.** The server SHALL support **where-used** (given a component, the assemblies that
  contain it). [APS-SCHEMA] (confirmed need — change-impact)
- **R-READ-5.** The server SHALL expose a design's **custom properties**, **drawings**,
  **thumbnail**, and **Fusion web URL** where the schema provides them. [APS-SCHEMA]
- **R-READ-6.** The server SHALL let a caller select revision **composition** (WORKING /
  RELEASED / AS_SAVED / LATEST) where the schema exposes it, so "the released rev" is answerable.
  [APS-SCHEMA] (confirmed need — released-rev gate)

### 6.3 Writing data back

- **R-WRITE-1.** The server SHALL let a caller set custom property values on a design/component,
  and create the property definitions those values require. [APS-SCHEMA] (confirmed need — stamp
  job number / status / stock / price)
- **R-WRITE-2.** The server SHALL support folder lifecycle operations the schema provides —
  create, rename, move, copy, delete. [APS-SCHEMA]
- **R-WRITE-3.** The server SHALL support creating a design from an uploaded file where the
  schema provides it (`createDesignFromFile`). [APS-SCHEMA]
- **R-WRITE-4.** Every write/mutating tool SHALL be annotated as non-read-only and, where it
  destroys or overwrites, as destructive, matching its actual effect. [MCP-TOOLS annotations;
  SDK] (see R-PROTO-4)

### 6.4 Geometry export

- **R-EXPORT-1.** The server SHALL request and retrieve **STEP, STL, and OBJ** for a component
  via the MFG derivatives path. [APS-SCHEMA]
- **R-EXPORT-2.** A tool that only **reads derivative/translation status** SHALL NOT trigger
  billable generation; generation SHALL happen only through a tool whose contract and annotations
  say it does so. [APS-SCHEMA; APS-COMMERCIAL C4; MCP-TOOLS annotations] (corrects the prior
  server, which read STEP status with `generate:true`)
- **R-EXPORT-3.** The server SHALL support translation to the additional formats Model Derivative
  provides (IGES, DWG, FBX, IFC, SVF2) and retrieval of the resulting derivatives.
  [APS-MODELDERIVATIVE; APS-COMMERCIAL — metered]
- **R-EXPORT-4.** The server SHALL support translating and reading **foreign CAD** (non-Fusion
  files) through Model Derivative, including its object tree and per-object properties.
  [APS-MODELDERIVATIVE]
- **R-EXPORT-5.** Long-running exports SHALL be modeled as asynchronous jobs: submit returns a
  handle; a separate read reports status; retrieval yields the artifact or a signed URL with its
  expiry surfaced. [MCP-TOOLS output discipline; async nature of the API]

### 6.5 Headless Fusion automation

- **R-AUTO-1.** The server SHALL submit a job to the Fusion Automation engine against a
  **named, pre-defined Activity**, accepting the inputs that Activity declares and returning a job
  handle. [APS-DA]
- **R-AUTO-2.** The server SHALL report a submitted job's status and SHALL retrieve its outputs
  (result files / signed URLs) when complete. [APS-DA]
- **R-AUTO-3.** Because automation is billed by processing time, the tools that submit jobs SHALL
  be annotated as non-read-only with side effects, and their contracts SHALL state that they incur
  cost. [APS-COMMERCIAL C4/C6; MCP-TOOLS annotations]
- **R-AUTO-4.** The definition, packaging, and registration of the Activities/AppBundles
  themselves are **out of this subsystem's runtime** and are supplied as separate deliverables;
  the server SHALL operate against whatever Activities are registered, discoverable by name.
  [§2.2; D-9]
- **R-AUTO-5.** The server SHALL let a caller enumerate the Activities registered and available to
  it, each with its name and declared inputs, so that the "named Activity" required by R-AUTO-1 is
  discoverable through the tool surface rather than known out of band. [APS-DA; completeness of
  R-AUTO-1]

### 6.6 Change notification

- **R-NOTIFY-1.** The server SHALL let a caller register, list, and delete APS Webhooks for Data
  Management events (e.g. version added/modified, folder modified) against the hosted callback
  endpoint. [APS-WEBHOOK]
- **R-NOTIFY-2.** The server SHALL expose a **polling** capability — "what changed since time/marker
  T" — usable when webhooks are not registered or not desired. [APS-SCHEMA; C5] (so change
  detection does not *depend* on the public-callback path)
- **R-NOTIFY-3.** Received webhook callbacks SHALL be authenticated before being acted on (see
  S-6). [APS-WEBHOOK; T4]

### 6.7 Authentication & session (functional surface)

- **R-AUTH-1.** The server SHALL provide a way to report Autodesk authentication state and to
  initiate the user-context authorization flow, and SHALL confirm authentication by a means that
  reflects the credential's actual validity, not merely the presence of a stored token.
  [APS-OAUTH; C1] (the old `isAuthenticated()` reported a cached object, not validity)

## 7. Non-functional requirements

### 7.1 Protocol & tool conformance

- **R-PROTO-1.** The server SHALL complete the MCP initialize/capability/version negotiation for
  revision 2025-11-25, declaring exactly the capabilities it implements. [MCP-LIFECYCLE]
- **R-PROTO-2.** In stdio deployment, the server SHALL write nothing but valid MCP messages to
  stdout; all diagnostics go to stderr or a file. [MCP-TRANSPORT; SDK]
- **R-PROTO-3.** Tool execution failures SHALL be reported as tool results with `isError: true`
  and an actionable message — **not** as thrown/protocol-level errors — so the model can see and
  self-correct. Protocol-level errors are reserved for unknown-tool/malformed-request conditions.
  [SDK `CallToolResult` semantics; MCP-TOOLS Error Handling]
- **R-PROTO-4.** Every tool's annotations (`readOnlyHint`, `destructiveHint`, `idempotentHint`,
  `openWorldHint`) SHALL truthfully reflect its behavior. [MCP-TOOLS; SDK] (the old server marked
  a billable generation tool `readOnlyHint: true`)
- **R-PROTO-5.** Each tool SHALL have a precise input schema — types, enums, required/optional,
  descriptions — encoding constraints in the schema, not only in prose. [MCP-TOOLS; SDK]
- **R-PROTO-6.** Data-returning tools SHALL provide structured output (`outputSchema` +
  `structuredContent`) in addition to a text rendering, so agents get typed data. [SDK]

### 7.2 Reliability

- **R-REL-1.** Every outbound call to Autodesk SHALL carry an explicit timeout; no unbounded
  await. [reliability standard; MCP-LIFECYCLE Timeouts]
- **R-REL-2.** A **transient** failure from Autodesk (network error, HTTP 429, HTTP 5xx) SHALL
  NOT destroy stored credentials. Only a definitive authorization rejection may invalidate them,
  and even then the server SHALL surface an actionable re-authentication path rather than a raw
  error. [reliability; T-none — corrects observed credential-wipe defect] (this session's live
  failure wiped the credential on a refresh error class that included the benign case)
- **R-REL-3.** Changing the requested OAuth scope set SHALL NOT silently invalidate the stored
  credential; the server SHALL detect the scope-subset condition (C3) and surface a re-auth
  requirement with a clear reason. [C3; reliability]
- **R-REL-4.** Retries against Autodesk, where present, SHALL be bounded, backed off, and applied
  only to idempotent operations. [reliability]
- **R-REL-5.** Oversized responses SHALL be bounded/paginated before they become memory or
  context-window incidents; the bound SHALL be applied consistently (one mechanism, not several).
  [reliability; output discipline] (the old server had two divergent truncation implementations)
- **R-REL-6.** Startup SHALL validate configuration and fail with a clear, actionable message;
  recoverable runtime errors SHALL NOT kill the process. [reliability; operability]
- **R-REL-7.** A token refresh that rotates the refresh token SHALL be atomic with respect to
  credential state: the server SHALL durably persist the newly issued refresh token before the
  prior token is relied upon as invalid, and SHALL serialize concurrent refresh attempts against
  the shared credential so that at most one rotation is in flight. Neither a crash between rotation
  and persistence, nor two callers refreshing near-simultaneously, may leave the server without a
  usable credential. [reliability; asset A1; constraint C2 (immediate rotation); D-1 (multi-device
  + scheduled operation makes this a normal-operation hazard, not an edge case)] (this is the
  general form of the credential-bricking that occurred this session and that M-3's one-time
  re-auth exists to recover from — the spec fixes the property so the architect need not discover it)

### 7.3 Operability

- **R-OPS-1.** The server SHALL log each tool invocation with tool name, a sanitized argument
  summary, outcome, and timing, at a controllable level, to a destination valid for the transport
  (never stdout in stdio). [operability; T6 for the sanitization] (the old server had no per-call
  logging)
- **R-OPS-2.** Every configuration value SHALL be documented, validated at startup, read once at
  startup rather than rediscovered per call, and given a sane default where one exists.
  [operability]
- **R-OPS-3.** The server SHALL declare a version, and its dependencies SHALL be pinned and
  locked. [operability]
- **R-OPS-4.** Documentation SHALL provide a run/configure/monitor procedure that works on the
  actual host OS (Windows 11 included) from a clean checkout, and SHALL state the trust model for
  both deployment modes. [operability; C7]
- **R-OPS-5.** The server SHALL expose a health/readiness signal appropriate to each transport (a
  checkable endpoint for HTTP; a documented smoke invocation for stdio). [operability]

## 8. Security requirements

Each ties to a threat in §4.

- **S-1 (T1).** In hosted/HTTP deployment the MCP endpoint SHALL authenticate its callers on
  **every request**, with no ambient authority (reachability SHALL NOT imply authorization);
  unauthenticated or unauthorized requests SHALL be rejected. The server SHALL NOT expose an
  unauthenticated MCP surface in any mode. This is the property any caller-authentication
  mechanism must hold, whatever mechanism the architecture selects (§14). [MCP-AUTHZ; MCP-SEC]
  (the old server started an unauthenticated HTTP `/mcp` listener in every mode, and its README
  deployed it `--allow-unauthenticated`)
- **S-2 (T1/T2).** The server SHALL serve only over TLS across any network boundary.
  **Conditional:** *if* the OAuth 2.1 resource-server model is the caller-authentication mechanism
  selected in architecture, the server SHALL validate that inbound access tokens were issued
  for it (audience) and SHALL reject tokens that were not. (Audience validation presupposes a
  bearer-token model; a non-OAuth gate satisfies caller authentication through S-1's per-request
  property instead, and this clause does not apply to it.) [MCP-AUTHZ] (resolves the prior
  contradiction where audience validation was mandated unconditionally while §14 left the
  mechanism to architecture)
- **S-3 (T1/T3, confused deputy).** The server's Autodesk credential SHALL NOT be passed through
  to, or be derivable by, MCP callers. Authorization of a caller *to the server* and authorization
  of the server *to Autodesk* are separate trust relationships; the server SHALL NOT forward the
  caller's token to Autodesk nor Autodesk's token to the caller. [MCP-AUTHZ token-passthrough;
  MCP-SEC confused-deputy]
- **S-4 (T7).** The Streamable HTTP transport SHALL validate the `Origin` header and reject
  invalid origins (HTTP 403), and SHALL bind to localhost when run locally rather than all
  interfaces, to prevent DNS-rebinding / cross-origin abuse of the endpoint. [MCP-TRANSPORT]
  (the MCP transport requirement makes localhost binding a SHOULD; this spec elects to make it a
  SHALL, being deliberately stricter than the floor)
- **S-5 (T3/T6).** The Autodesk tokens and the webhook secret SHALL be stored with
  least-privilege access at rest, SHALL never be written to logs, error messages, or tool
  results, and SHALL NOT be committed to version control. [OWASP-SECRETS; MCP-SEC; T6] (an `.env`
  with live credentials exists in the tree — confirmed git-ignored; the token file must carry
  real OS-level restriction, not a mode bit that is inert on the host FS)
- **S-6 (T4).** Inbound webhook callbacks SHALL be verified as authentically from Autodesk —
  signature over the payload keyed by the registered secret — before any action is taken on them;
  unverifiable callbacks SHALL be rejected. The server SHALL additionally defend against **replay**
  of a captured, still-valid signed callback — by a delivery/notification-id deduplication, a
  timestamp-freshness window, or idempotent handling of duplicate events — so that a replayed
  authentic payload does not cause repeated or stale action. [APS-WEBHOOK `x-adsk-signature`; T4
  names replay explicitly]
- **S-7 (T5, injection).** Every value derived from a tool argument that is interpolated into a
  GraphQL document, a request path, or a query string SHALL be encoded/parameterized so that a
  crafted argument cannot alter query or request structure. [OWASP-INJECTION] (the old server
  string-built GraphQL, and one handler interpolated an input with bare quotes unlike its siblings)
- **S-8 (T5).** Tool arguments SHALL be validated at the boundary — types, ranges, formats —
  before use, treating the model as an untrusted input source. [MCP-TOOLS Security Considerations;
  C1]
- **S-9 (T5, cost — labeling).** Operations that incur metered cost (Model Derivative generation,
  Automation jobs) SHALL be clearly identified as such in their contracts and annotations, so a
  caller — and a human in the loop — can tell a free read from a billable action. [APS-COMMERCIAL;
  MCP-TOOLS annotations] (labeling is a hint, not a control; the enforced bound is S-11)
- **S-10 (T5, SSRF).** Any URL or host the server fetches that is influenced by input (including
  redirect targets and any future callback/registration URLs) SHALL be constrained to expected
  schemes and hosts; internal/link-local ranges SHALL be unreachable unless explicitly intended.
  [OWASP-SSRF; MCP-SEC SSRF]
- **S-11 (T5, cost — control).** The server SHALL enforce a bound on billable operations
  (Model Derivative generation and Automation job submission): a server-side rate/quantity limit
  and/or an explicit budget or confirmation gate, configured, such that a compromised or
  runaway caller — including a scheduled, human-out-of-the-loop run (D-1) — cannot cause unbounded
  metered spend. Exceeding the bound SHALL be refused, not silently spent. [MCP-TOOLS Security
  Considerations — "servers MUST rate limit tool invocations"; asset A4; attacker T5] (S-9 labels
  cost; S-11 caps it — labeling alone left A4 uncontrolled)
- **S-12 (T1, session integrity).** The server SHALL NOT derive caller authorization from a
  session identifier (authorization is per-request, S-1). If the Streamable HTTP transport issues
  session IDs, they SHALL be cryptographically secure and non-deterministic. [MCP-SEC session
  hijacking — "MUST NOT use sessions for authentication"; "MUST use secure, non-deterministic
  session IDs"]
- **S-13 (T8, output sanitization).** Tool outputs derived from external or third-party content —
  design and file names, custom-property values, and imported foreign-CAD data — SHALL be treated
  as untrusted and neutralized before being returned, so that returned content cannot carry
  control instructions into the consuming agent's context. [MCP-TOOLS Security Considerations —
  "servers MUST sanitize tool outputs"] (S-7/S-8 guard the input boundary; S-13 guards the output
  boundary — the fourth of the four MCP-Tools server MUSTs, previously mapped only for secrets by
  S-5)
- **S-14 (T2, authorization-code protection).** The server's authorization-code flow to Autodesk
  SHALL use PKCE with the S256 challenge method, so that an authorization code intercepted at the
  redirect/callback cannot be exchanged for a token by a party lacking the `code_verifier`.
  [OAUTH-2.1; MCP-AUTHZ; confirmed 2026-07-24 that APS Authentication v2 supports the
  authorization-code grant with PKCE, method always S256] (the callback receives the code over
  localhost during login — a local-process interception surface [MCP-SEC] flags — and over the
  hosted HTTPS endpoint in production; PKCE closes the gap without relying on client-secret secrecy)

## 9. External interfaces

- **9.1 MCP protocol (produced).** JSON-RPC over stdio (local) and Streamable HTTP (hosted),
  revision 2025-11-25, per [MCP-TRANSPORT]/[MCP-LIFECYCLE]. Tools as specified; structured output
  per [SDK]. Resources/prompts are not required by this spec; if none are exposed, none are
  declared.
- **9.2 APS Manufacturing Data Model (consumed).** GraphQL endpoint; queries and mutations per
  the introspected schema on disk. Authoritative signatures come from that schema, not from
  documentation prose. [APS-SCHEMA]
- **9.3 APS Data Management & Model Derivative (consumed).** REST/JSON:API and the Model
  Derivative REST API for browsing, translation, and metadata extraction.
- **9.4 APS Automation API v3 — Fusion engine (consumed).** AppBundle/Activity/WorkItem REST
  model; async job lifecycle. [APS-DA]
- **9.5 APS Webhooks v1 (consumed) + callback (produced).** Hook registration REST; an inbound
  signed callback endpoint the server hosts. [APS-WEBHOOK]
- **9.6 APS Authentication v2 (consumed).** User-context authorization-code grant with refresh;
  rotating refresh tokens; scope-subset refresh rule. [APS-OAUTH]

## 10. Migration from the current state

- **M-1.** The existing server is replaced, not extended. Its 19 tools are superseded by the
  surface in §6; a tool that survives by name (e.g. hub listing) is re-derived against this spec,
  not carried over.
- **M-2.** The uncommitted working-tree modifications and the compiled `dist/` of the old server
  are not a baseline; the delivered server's provenance is this spec.
- **M-3.** Cutover: the owner re-authenticates once under the credential model of the new server
  (a one-time browser login), because the old stored credential was invalidated this session
  (C3). The new server SHALL make that first-run authentication path clear (R-AUTH-1, R-REL-3).
- **M-4.** The prior-session prose artifacts (`prior-session-artifacts/`) are historical record,
  not requirements, and do not govern the build.

## 11. Decisions made during this spec

- **D-1. Hosted is the primary deployment target; local stdio is the development path.** Reasoning:
  the owner requires webhooks, scheduled runs, and multi-device access, none of which a local-only
  server can provide (C5). The security cost of hosting (§8) is accepted and specified rather than
  avoided.
- **D-2. Two separate trust relationships, no credential passthrough.** Reasoning: [MCP-AUTHZ]
  forbids token passthrough and the server proxies a third-party API under one credential; the
  caller↔server and server↔Autodesk authorizations must be independent (S-1..S-3). This is a
  standard-mandated property, not an owner choice.
- **D-3. Read/status tools must never bill.** Reasoning: the old server read STEP status with
  `generate:true`, conflating a free read with a billable action; [APS-COMMERCIAL] and truthful
  annotations require the split (R-EXPORT-2, S-9).
- **D-4. Assembly structure returns full line data, not names.** Reasoning: the named need is a
  BOM; names-only (old behavior) cannot produce one (R-READ-2).
- **D-5. Credential destruction is restricted to definitive auth rejection.** Reasoning: this
  session's live failure destroyed the credential on a refresh error whose class included benign
  and transient cases; reliability requires transient failures to be non-destructive (R-REL-2/3).
- **D-6. Errors are `isError` tool results, not exceptions.** Reasoning: [SDK] schema semantics —
  thrown errors become protocol errors the model cannot self-correct from (R-PROTO-3).
- **D-7. Structured output is required on data tools.** Reasoning: agents consuming this need
  typed data; [SDK] supports `outputSchema`/`structuredContent` and the old server used neither
  (R-PROTO-6).
- **D-8. Folder enumeration uses real schema fields; no "missing field" workaround.** Reasoning:
  the introspected schema contains `foldersByFolderInHub`/`foldersByProject`; the prior effort's
  premise that folder traversal was unsupported was false (R-DISC-3).
- **D-9. The Fusion Automation *subsystem* is specified now; individual jobs are deferred inputs.**
  Reasoning: Autodesk ships no job logic — each job is authored TypeScript. The submit/track/
  retrieve machinery is fully specifiable; the jobs are named later so the spec neither invents
  them nor waits on them (§2.2, R-AUTO-4). This is the honest boundary between what is knowable
  now and what is an owner input.
- **D-10. Change detection does not depend on webhooks.** Reasoning: webhooks need the public
  callback path (C5); a polling capability (R-NOTIFY-2) guarantees change detection even if the
  callback path is unavailable, so the capability is not hostage to deployment details.
- **D-11. Metered spend is capped by an enforced control, not only labeled.** Reasoning: §4 names
  unbounded metered spend (A4) a top asset and [MCP-TOOLS] Security Considerations require servers
  to rate-limit tool invocations; a labeling requirement (S-9) is a hint a caller may ignore and
  does not protect an autonomous, scheduled run (D-1). S-11 adds an enforced bound. Labeling and
  capping are complementary, not substitutes.
- **D-12. The spec fixes the caller-authentication *property*; the *mechanism* is architecture's.**
  Reasoning: [MCP-AUTHZ] makes OAuth a SHOULD for HTTP servers, not a MUST, and audience validation
  is meaningful only under a bearer-token model. Mandating audience validation unconditionally
  (the prior S-2) foreclosed the "simpler gate" option that §14 leaves to architecture — a
  contradiction. The invariant every mechanism must satisfy — per-request authentication, no ambient
  authority (S-1) — is fixed here; audience validation (S-2) is stated conditionally on the OAuth
  mechanism being the one architecture selects. This keeps the spec at property altitude without
  handing the architect contradictory instructions.
- **D-13. PKCE (S256) is required on the server↔Autodesk authorization-code flow.** Reasoning:
  [OAUTH-2.1] §7.5.1.1 requires PKCE for authorization-code flows and the MCP authorization model
  builds on OAuth 2.1; the callback receives the code over localhost during login (a local-process
  interception surface [MCP-SEC] flags) and over HTTPS in production; APS was confirmed 2026-07-24
  to support PKCE with S256. This surfaced while grounding §13 Q-2 — it had been mis-deferred to
  architecture as a "mechanism" when it is a spec-level security property (S-14).

## 12. Acceptance criteria

Verified against a running server driven by a real MCP client, per the standards each requirement
cites. Behavioral-correctness criteria are checked by construction *and* sampled at runtime; a
passing sample is necessary, not sufficient.

- **AC-1 (R-DISC-1, R-DISC-3).** From a real account, listing hubs → projects → folders (by project
  and by parent) → items → versions returns correct, paginated results (R-DISC-1), and folder
  traversal uses the schema's navigation fields (R-DISC-3). (Find-by-name is R-DISC-2, verified by
  AC-2.)
- **AC-2 (R-DISC-2).** Finding a known design by name returns it with usable hub/project/item and
  root-component-version identifiers.
- **AC-3 (R-READ-1..3, R-READ-6).** For a known design, metadata (incl. part number, material,
  revision/version), full assembly structure with per-line ids/part-numbers/materials/quantities,
  and physical properties with units are returned; composition selection returns the released rev
  distinctly from the working one.
- **AC-4 (R-READ-4/5).** Where-used returns the containing assemblies for a known shared
  component; custom properties, drawings, thumbnail, and Fusion URL return where present.
- **AC-5 (R-WRITE-1..4).** Setting a custom property on a test design is visible on re-read
  (R-WRITE-1); a folder create/rename/move/**copy**/delete round-trips (R-WRITE-2); creating a
  design from an uploaded file yields a design that is then found on re-read (R-WRITE-3); every
  write/mutating tool is annotated non-read-only (and destructive where it overwrites/deletes),
  matching its actual effect (R-WRITE-4).
- **AC-6 (R-EXPORT-1/2/5).** STEP/STL/OBJ retrieval yields a downloadable artifact; a
  status-only read performs **no** billable generation (verified by observing that no derivative
  job is created by the read); async export exposes submit/status/retrieve distinctly.
- **AC-7 (R-EXPORT-3/4).** Translating a design to an additional Model Derivative format (e.g.
  IGES or SVF2) completes and the resulting derivative is retrievable (R-EXPORT-3); a non-Fusion
  file translates and its object tree / per-object properties are retrievable (R-EXPORT-4).
- **AC-8 (R-AUTO-1..5).** Enumerating available Activities returns their names and declared
  inputs (R-AUTO-5); a WorkItem submitted against a registered test Activity discovered that way
  runs, its status is reported, and its outputs are retrieved; the server operates against
  externally-registered Activities without embedding their definitions (R-AUTO-4); the submit tool
  is annotated as cost-incurring.
- **AC-9 (R-NOTIFY-1..3, S-6).** A webhook can be registered and deleted; a callback with a valid
  signature is accepted and one with an invalid/absent signature is rejected; a byte-identical
  replay of a previously accepted, still-valid signed callback is refused or produces no repeated
  or stale action (dedup by delivery/notification id, freshness window, or demonstrated
  idempotence); polling reports a change made out-of-band.
- **AC-10 (R-PROTO-1, R-PROTO-3..6).** `tools/list` matches the implemented tool set; initialize
  negotiates 2025-11-25 (R-PROTO-1); a forced tool failure returns `isError:true` with an
  actionable message, not a protocol error (R-PROTO-3); annotations match behavior for a sampled
  read tool and a sampled write tool (R-PROTO-4); a sampled tool's input schema declares its
  parameter types, enums, and required/optional with descriptions rather than stating them only in
  prose (R-PROTO-5); data tools return `structuredContent` conforming to their `outputSchema`
  (R-PROTO-6). (stdout purity is R-PROTO-2, verified by AC-12.)
- **AC-11 (R-REL-1/2/3).** An outbound call to an unresponsive endpoint is bounded by its explicit
  timeout and returns a timeout error rather than awaiting indefinitely (R-REL-1); with a simulated
  transient Autodesk failure (429/5xx/network), the stored credential survives and the tool returns
  a retryable error (R-REL-2); a simulated scope-subset condition surfaces a re-auth requirement
  without wiping the credential silently (R-REL-3).
- **AC-12 (R-OPS-1/2/4/5, R-PROTO-2).** In stdio mode stdout carries only protocol messages
  (a captured stdout contains no diagnostics) (R-PROTO-2); each tool call is logged with
  name/args-summary/outcome/timing with no secret present (R-OPS-1); configuration is read once at
  startup rather than re-read per tool call, each documented value having a sane default where
  applicable (R-OPS-2); the documented Windows run procedure works from a clean checkout (R-OPS-4);
  the health signal responds (R-OPS-5).
- **AC-13 (S-1/2/4/12).** In hosted mode an MCP request that is unauthenticated, or authenticated
  only by a session identifier, is rejected on every request (S-1/S-12); an invalid `Origin` is
  403'd (S-4); there is no reachable unauthenticated MCP surface in any mode; when the OAuth
  mechanism is in use, a token whose audience is not this server is rejected (S-2); if the HTTP
  transport issues session IDs, sampled IDs are non-deterministic and unpredictable (S-12).
- **AC-14 (S-3/5).** No tool result or log line contains the Autodesk tokens or webhook secret;
  the caller has no path to obtain the Autodesk credential; the credential store carries real
  host-level access restriction.
- **AC-15 (S-7/8).** A tool argument containing GraphQL/URL metacharacters (e.g. an embedded
  quote) is handled without altering the request structure and without error divergence between
  handlers; out-of-range/malformed arguments are rejected at the boundary with an actionable
  message.
- **AC-16 (S-9).** Every metered-cost tool is identifiable as cost-incurring from its contract
  and annotations alone.
- **AC-17 (R-DISC-4).** A listing whose result exceeds one API page reports that more pages or a
  truncation exists, explicitly, in its output.
- **AC-18 (R-AUTH-1).** The auth-state tool reports "authenticated" only when the credential is
  actually usable — confirmed by a minimal live Autodesk call or a known-valid token — and reports
  "not authenticated" with the re-authentication path when it is not; presence of a stored token
  object alone does not yield "authenticated".
- **AC-19 (R-REL-4).** Under induced repeated failure of an idempotent Autodesk call, retries are
  bounded and backed off (observed count and spacing), and non-idempotent operations are not
  retried.
- **AC-20 (R-REL-5).** Two different large-output tools truncate/paginate oversized responses by
  the same mechanism, each emitting an explicit truncation/more-data indicator.
- **AC-21 (R-REL-6).** Startup with invalid/missing configuration exits with a clear, actionable
  message; an induced recoverable runtime error (e.g. one failing tool call) does not terminate
  the process.
- **AC-22 (R-OPS-3).** The server reports its version over the protocol; the dependency set is
  pinned and a lockfile is present in the build.
- **AC-23 (S-10, SSRF).** A tool argument (or a redirect target, or a callback/registration URL)
  that resolves to a loopback, link-local, or private-range host is refused before any outbound
  request is made; only expected schemes and hosts are reachable.
- **AC-24 (S-11, spend cap).** With the billable-operation bound configured, a caller that exceeds
  the configured rate/quantity (or lacks the required budget/confirmation) is refused, and no
  billable APS job is submitted for the refused call; the limit holds for an automated,
  human-out-of-the-loop invocation path.
- **AC-25 (R-REL-7).** Two concurrent refreshes racing on the shared credential leave a usable
  credential (at most one rotation wins; the loser recovers rather than bricking); and a crash
  induced between token rotation and its durable persistence leaves a usable credential on restart.
- **AC-26 (S-13).** A design name, custom-property value, or imported-CAD field carrying
  injection-shaped content is returned neutralized, such that the content cannot act as an
  instruction to the consuming agent.
- **AC-27 (S-14).** The authorization request carries a PKCE `code_challenge` (S256) and the token
  exchange carries the matching `code_verifier`; an authorization code presented for exchange
  without the correct verifier is rejected and no token is issued.

## 13. External-fact grounding (verified 2026-07-24)

These were external Autodesk facts this spec depends on and is therefore responsible for pinning.
Each was verified against Autodesk's documentation and folded into the requirements and §3 — not
deferred. (Decisions that belong to the architecture phase and inputs that belong to the owner are
*not* listed here: the spec states its requirements as properties, and §14 names the categories it
leaves to architecture. The spec does not track, enumerate, or frame another role's decisions.)

- **Q-1 — APS Webhooks signature: RESOLVED.** HMAC-**SHA1**, formatted `sha1hash=<hexdigest>` over
  the UTF-8 payload keyed by the registered secret, delivered in `x-adsk-signature`; verified with
  a constant-time compare. Grounds S-6; recorded in §3 [APS-WEBHOOK].
- **Q-2 — APS OAuth PKCE: RESOLVED.** APS Authentication v2 supports the authorization-code grant
  with PKCE, method always **S256**. This surfaced a spec-level security property now stated as
  **S-14** (see D-13); §3 [APS-OAUTH] updated. Refresh-scope-subset behavior (C3) and rotation (C2)
  were already confirmed live this session.
- **Q-3 — Automation v3 shapes: RESOLVED.** `POST /da/us-east/v3/workitems` takes
  `{ activityId, arguments: { <name>: { url, verb, headers } } }` (inputs `verb: get`, outputs
  `verb: put` to signed URLs); status is an enum (`pending|inprogress|cancelled|failed*|success`);
  `GET /workitems/:id` polls it. Grounds R-AUTO-1..3; recorded in §3 [APS-DA]. The activity-specific
  argument names remain implementation-level.

## 14. Non-goals restated

This spec fixes *what* the server must do and *which properties* it must hold. It does not choose
components, libraries within the fixed stack, the caller-authentication mechanism, the credential
store, or the module layout — those are architecture decisions constrained by §5, §7, and §8.
