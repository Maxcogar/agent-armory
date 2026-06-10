# Spec: Git integration for Codebase RAG

Status: draft · Target branch: `claude/codebase-rag-git-integration-gYAw9`
Applies to: `mcp-servers/codebase-rag/mcp-server-python/`

## Problem, audience, and motivation

The Codebase RAG MCP gives an agent two capabilities over a project: semantic
search (`rag_search`) and import/export blast-radius analysis
(`rag_query_impact`). Both reason over a single, present-tense snapshot — the
indexed working tree — and neither has any notion of a *baseline*, a *history*,
or *who changed what when*. An agent working inside a session is rarely
reasoning about the whole tree as it exists this instant. It reasons about **the
change it is making**, **what its change will break**, **how the code got to its
current state**, and **which parts are volatile**. None of that is answerable
from a snapshot.

Git holds exactly the missing dimension: a baseline to diff against, a history to
read, and authorship per line. This spec defines a **complete git-awareness
layer** for the RAG, for an agent doing edit/review/comprehension work in a live
session. It covers five capabilities, treated as one coherent feature:

1. **Change-set scoping** — restrict search to what changed between two endpoints
   (working tree, or any pair of revisions).
2. **Change-aware impact** — narrow blast-radius to the symbols that actually
   changed between two endpoints.
3. **Historical search** — query the codebase as it existed at a past revision.
4. **Provenance on results** — attach authorship/commit identity to search hits.
5. **Churn signal** — expose and optionally weight by how volatile a file is.

It is worth building as a whole because partial git-awareness is the failure
mode: an agent that can scope to its working diff but can't compare two releases,
or can rank by relevance but not volatility, still falls back to manual git for
the rest — which is the gap this layer exists to close.

## Scope

**In scope** — all five capabilities, plus the cross-cutting concerns they share:
the endpoint/coordinate model, the definition of "changed," graceful degradation
on non-git roots, the trust boundary for executing git with caller-supplied
references, and bounded resource use for any auxiliary indexing historical search
requires.

**Out of scope** — only genuinely distinct integrations, each a decision not a
gap:

- **Non-git version control** (Mercurial, SVN, Perforce). This is a *git*
  integration; another VCS is a separate backend. Git absence degrades per
  NFR-1, it does not error.
- **Writing git state** — creating commits, branches, stashes, notes, or
  modifying the working tree/index/config. Strictly read-only (CLAUDE.md). Hard
  boundary, not a deferral.
- **A general git CLI passthrough tool.** The layer exposes these five
  capabilities through the RAG's semantic surface; it is not a "run arbitrary
  git" tool, which would be an unbounded trust and annotation surface (threat
  model).

## Governing standards

| Standard / source | What it governs here |
|---|---|
| Git documented behavior — `git-diff(1)`, `git-log(1)`, `git-blame(1)`, `git-ls-files(1)`, `git-ls-tree(1)`, `git-cat-file(1)`, `git-archive(1)`, `git-rev-parse(1)`, `git-merge-base(1)`, `gitrevisions(7)`, `gitcli(7)` (git 2.43, present) | Definition of "changed," two-dot vs three-dot (merge-base) range semantics, path output coordinate system (`--relative`), untracked-file inclusion, reading a revision's tree/blobs, per-line authorship, ref resolution to immutable SHAs, pathspec/option-terminator (`--`) handling. |
| CWE-78 (OS Command Injection) and CWE-88 (Argument/Option Injection) | Construction/invocation of every git subprocess that includes a caller-supplied endpoint reference. |
| CWE-400 (Uncontrolled Resource Consumption) | Auxiliary historical indexing — building an index of a past revision must be bounded in space and time. |
| Model Context Protocol tool annotations (`readOnlyHint`, `idempotentHint`, `openWorldHint`) — MCP spec, as already used in `server.py` | How new parameters/behavior are declared, and whether existing annotations still hold once a subprocess and external git state are involved. |
| ChromaDB metadata filtering (`where` with `$in` over a string list) and persistent multi-collection storage; verified against current Chroma docs (filter applies to both `query()` and `get()`) | Feasibility of restricting the candidate set by membership, and of holding revision-keyed auxiliary collections alongside the working-tree collection. |
| Project locked decisions — `CLAUDE.md`, invariants in `indexer.py`/`config.py`/`watcher.py` | `filePath` coordinate system, non-git roots as first-class, nothing written into the project tree, the working-tree-mirror invariant, Expert Standard. |

## Locked decisions this spec must honor

- **Index coordinate system.** `filePath` is stored relative to `project_root`,
  forward-slashed (`indexer.py:145` via `safe_relative_path`). Every changed-set
  or revision file list must use this coordinate system or it matches nothing.
- **Non-git roots are valid.** Root detection accepts `package.json`,
  `pyproject.toml`, `Cargo.toml`, `go.mod`, not only `.git`. The whole layer must
  be optional and degrade.
- **The working-tree index mirrors on-disk state**, kept current by the watcher.
  Git awareness adds baselines/history/metadata *around* this index; it must not
  corrupt or replace it as the source of truth for present-tense content.
- **Nothing is written into the project tree.** Caches live in the existing
  per-project cache dir (`config.py` `cache_dir_for`); git is invoked read-only.
- **Evaluation is against the Expert Standard.**

## The endpoint model (definitional, governs capabilities A–C)

To avoid special-casing "working tree vs branch," "as of a revision," and
"between two releases" as three separate features, the layer is built on one
primitive:

- An **endpoint** is the state of the codebase at a point: either **WORKING**
  (the live working tree, including uncommitted and untracked-non-ignored files)
  or a **REVISION** (a caller-supplied git reference resolved to an immutable
  commit SHA).
- A **change set** is computed between a **base** endpoint and a **target**
  endpoint.
- **Content** for any result is served from the **target** endpoint: WORKING →
  the working-tree index; REVISION → that revision's auxiliary store (capability
  C). This single rule is what makes capabilities A and C compose instead of
  conflicting.

The five named capabilities are views over this primitive: working-diff scoping
(base=ref or HEAD, target=WORKING), release-to-release diff (base=REVISION,
target=REVISION), point-in-time search (target=REVISION, no scoping), etc.

*Source:* derived to satisfy the union of the change-scoping and historical needs
with one coherent model rather than overlapping special cases; the merge-base and
revision-resolution semantics it rests on are git documented behavior.

## Functional requirements

Requirements state properties. Named mechanisms are illustrative unless flagged
as a genuine constraint.

### A. Change-set scoping (search)

**FR-A1 — Scope to a change set.** `rag_search` must support an opt-in mode that
restricts results to the set of files in the change set between a base and a
target endpoint, ranking *within* that set rather than filtering the full result
afterward. *Source:* confirmed user need (query target is a change, not the
tree). Rank-within-set is required so the mode cannot under-return; ChromaDB
`$in` over `filePath` makes in-query restriction feasible.

**FR-A2 — Content follows target.** Results in a scoped search return content
from the target endpoint per the endpoint model: working-tree index when
target=WORKING, the revision's auxiliary store when target=REVISION. *Source:*
endpoint model; correctness (scoping a release-to-release diff must return the
*target release's* code, not current disk).

**FR-A3 — Coordinate system.** The change set must be paths relative to
`project_root`, forward-slashed, identical to `filePath`. *Source:* locked
decision. *Constraint, not design:* a set in any other coordinate system (e.g.
git-repo-root-relative, which differs whenever the project is a subdirectory of
the repo) silently matches nothing. `--relative` is one mechanism; path rebasing
another.

**FR-A4 — Default endpoints.** With nothing supplied, target=WORKING and the
change set is the **uncommitted** working state: modified tracked files plus
newly-created untracked, non-ignored files. No branch name is required or
inferred. *Source:* git documented behavior + need + Decision D-1.

**FR-A5 — Explicit base, working target.** When a base ref is supplied with
target=WORKING, the change set is the branch's changes since it diverged from
that base (merge-base, `base...HEAD`) **unioned with** the uncommitted working
state of FR-A4. *Source:* `gitrevisions(7)` + need (an agent on a feature branch
wants its commits *and* its in-progress edits).

**FR-A6 — Two revision endpoints.** When both base and target are revisions, the
change set is the difference between them, and content is served from the target
revision (FR-A2). Both **merge-base (three-dot)** and **direct tree diff
(two-dot)** must be available, selectable by the caller; the default is three-dot
for consistency with FR-A5. *Source:* git documented behavior + need ("what
changed between v1.2 and v1.3"); two modes because tag-to-tag comparison commonly
wants the direct tree difference while branch comparison wants merge-base.

**FR-A7 — Empty change set is a distinct outcome.** A legitimately empty change
set (clean tree, identical endpoints) must be reported as a state separable by
the caller from "no semantic matches found." *Source:* downstream verifiability.

### B. Change-aware impact

**FR-B1.** `rag_query_impact` must support narrowing its reported exports / API
endpoints / websocket events, and the dependents derived from them, to those that
**changed** between a base and target endpoint, rather than to everything the
file currently defines. *Source:* need — blast radius of *a change* is the
reviewer's question; blast radius of *a file* over-reports. Narrowing re-uses the
existing extractors (`utils/metadata.extract_*`) over the changed region.

**FR-B2.** Impact's endpoints follow the same model and defaults as capability A
(FR-A4–A6), so one definition of "changed" governs both tools. *Source:*
consistency.

### C. Historical (point-in-time) search

**FR-C1.** `rag_search` and `rag_query_impact` must support answering against the
codebase **as it existed at a specified revision** (target=REVISION, no scoping),
not the working tree. *Source:* need ("what did this subsystem look like before
the refactor").

**FR-C2 — Historical content comes from git.** Results must reflect contents
recorded at that revision, from git's object store, never current on-disk state.
*Source:* git documented behavior; correctness.

**FR-C3 — Working-tree index is never mutated by historical access.** Serving any
REVISION-target query must not write into, evict from, or alter the working-tree
index. Revision content lives in a *separate* auxiliary store. *Source:* locked
decision (working-tree-mirror invariant). This requirement is what lets history
exist as an added dimension rather than a mutation.

**FR-C4 — Revision identity is immutable.** Auxiliary stores must be keyed by the
**resolved commit SHA**, not the symbolic ref, so a moving ref cannot return
stale content and two refs at the same commit share one store. The caller may
pass a symbolic ref; the layer resolves it at query time. *Source:* git
ref-resolution; correctness. *Constraint, not design.*

**FR-C5.** Any REVISION-target response must report the resolved SHA (and the
symbolic ref if given), so the caller can confirm what was searched. *Source:*
downstream verifiability.

### D. Provenance on results

**FR-D1.** `rag_search` must support an opt-in mode that attaches to each result
the identity of the commit that last modified the relevant region: commit SHA
(abbreviated and full), author, author date, and subject. *Source:* need (an
agent evaluating a hit wants recency and authorship); git documented behavior.

**FR-D2 — Granularity.** Provenance must be reported at the **chunk's line range**
where the index records line ranges, falling back to **file-level** last-commit
when line-level attribution is unavailable, and indicating which granularity each
record used. *Source:* precision balanced against cost (line-level blame is per-
hit expensive); see D-3. Whether chunk line ranges are stored is U-1.

### E. Churn signal

**FR-E1.** The layer must compute, per file, a **churn signal** — change
frequency over a bounded, configurable recent window — and (a) return it as
result metadata and (b) optionally fold it into ranking as a recency-weighted
volatility factor. *Source:* need (volatile files are where an agent should look
first / tread carefully); git documented behavior (`git-log --name-only`).

**FR-E2 — Bounded window.** The churn window must be bounded (configurable commit
count or time horizon), never an unbounded full-history walk per query. *Source:*
CWE-400; responsiveness. *Constraint.*

**FR-E3 — Ranking blend opt-in and bounded.** When folded into ranking, churn
adjusts but does not dominate semantic relevance, and is off by default. *Source:*
backward-compatibility (FR-F1) + need.

### F. Cross-cutting

**FR-F1 — All additions opt-in; default behavior unchanged.** Absent any new
parameter, both tools behave exactly as today (same results, same latency).
*Source:* backward-compatibility constraint.

**FR-F2 — Capabilities compose.** Capabilities combine in one call where
meaningful — change-scoped search with provenance; release-to-release scoping
with churn; historical search with provenance-as-of-that-revision. The endpoint
model (content follows target) makes scoping and history compose rather than
conflict. *Source:* need (review a branch *and* see authorship in one call).

## Non-functional requirements

**NFR-1 — Graceful, observable degradation.** When the root is not a git repo,
git is unavailable, or an invocation fails, any requested git-dependent behavior
degrades to an explicit, caller-visible no-op stating which capability was not
applied and why. It must not raise, hang, or silently return un-augmented results
as though it succeeded. *Source:* locked decision (non-git roots first-class) +
downstream verifiability.

**NFR-2 — Bounded latency, non-blocking.** Every git invocation is
timeout-bounded and must not block the server's async loop (consistent with the
`_await_ready_or_status` design in `server.py`); on timeout it degrades per
NFR-1. *Source:* the tools are interactive and annotated idempotent/read-only.

**NFR-3 — Bounded historical-index footprint.** Auxiliary stores have a bounded
total footprint with a defined eviction policy; building one is size/time-bounded
and degrades per NFR-1 if a revision is too large to index within limits. They
live under the existing per-project cache dir, never in the project tree.
*Source:* CWE-400 + locked decision.

**NFR-4 — Annotation honesty.** MCP annotations must remain accurate. Read-only
and idempotent hold (git is read-only; repeated calls on an unchanged
tree/revision return the same result). `openWorldHint` (currently `False`) must
be re-decided explicitly: executing an external binary and reading git state
beyond the indexed files is a material change to the tool's world. The decision
must be made, not defaulted. *Source:* MCP annotation semantics.

## Security requirements

**SEC-1 — No shell interpretation.** Git is invoked so that no argument — any
endpoint reference or pathspec — is interpreted by a shell. *Threat:* CWE-78.
*Property, not mechanism.*

**SEC-2 — Endpoint references cannot inject options.** No caller-supplied
reference (base or target) can be parsed by git as an option rather than a
revision — e.g. a value beginning with `-`, or one git treats as `--output=`.
*Threat:* CWE-88. *Property:* references confined to the revision position via a
legal-ref allowlist and/or the `--` terminator (`gitcli(7)`); the combination is
the architect's, the property is that no reference can change which git operation
runs or where it writes.

**SEC-3 — Read-only git surface only.** Only read-only subcommands
(diff/log/blame/ls-files/ls-tree/cat-file/archive/rev-parse/merge-base) reachable.
No subcommand that mutates repository, working tree, index, or config. *Threat:*
falsifiable read-only annotation; CLAUDE.md hard boundary.

**SEC-4 — Historical indexing is resource-bounded.** Builds are bounded per NFR-3
and footprint-limited so repeated REVISION-target queries cannot exhaust disk or
CPU. *Threat:* CWE-400.

## What changes from current state

- `rag_search` (`server.py:299`, `query.check_constraints`): gains opt-in
  parameters for endpoints/scoping (A), historical revision (C), provenance (D),
  churn (E). Default path unchanged (FR-F1).
- `rag_query_impact` (`server.py:372`, `query.query_impact`): gains opt-in
  endpoints (B) and historical revision (C). Default path unchanged.
- New internal capabilities: change-set derivation between endpoints (A/B),
  serving a revision's content from an auxiliary SHA-keyed store (C), provenance
  (D), churn (E). Module boundaries are architecture (U-1).
- New cache content: auxiliary revision-keyed collections under the existing
  per-project cache dir, with eviction (NFR-3). Working-tree collection format
  and the working-tree-mirror invariant are unchanged; **no re-index of the
  working tree is required** to adopt any capability.
- Preserved for non-git projects: identical behavior to today, every
  git-dependent request degrading per NFR-1.

## Decisions made during this spec

**D-1 — Default base/target is the uncommitted working tree, never an inferred
branch.** *Reasoning:* inferring `main`/`master` would *guess*; on a repo whose
mainline is named otherwise the guess returns a wrong set with no detectable
error. Principle: **a default may be narrow, but it must never be a guess that
can be confidently wrong.** The working-tree default needs no convention, always
has a valid reference (`HEAD`), and its empty case is truthful (FR-A7). Branch and
revision breadth are opt-in (FR-A5/A6). Resolved on correctness grounds at the
user's explicit instruction.

**D-2 — Provenance/churn are reported, not used to gate results.** They annotate
and (churn, opt-in) re-weight; they never *remove* a semantic match. *Reason:*
removing relevant hits on a metadata signal would degrade the core search
contract.

**D-3 — Provenance granularity is line-level where the index supports it, else
file-level, always labeled.** *Reasoning:* line-level blame is precise but costs a
blame per hit; file-level last-commit is cheap. Mandating line-level universally
breaches NFR-2 on large result sets; permitting a labeled fallback keeps the
capability honest about its cost.

**D-4 — Revision content is served from on-demand, SHA-keyed auxiliary stores,
not by re-pointing the working-tree index.** *Reasoning:* the only design family
satisfying FR-C2/C3/C4 together — historical contents from git, working index
untouched, immutable revision identity. Lazy build on first query for a revision,
keyed by resolved SHA, cached under the project cache dir, evicted under NFR-3.
The lazy/SHA-keyed/evictable shape is mandated; the storage mechanism within it is
the architect's.

**D-5 — Scoping and history compose via the endpoint model; there is no
mutually-exclusive combination.** *Reasoning:* an earlier draft forbade
"working-tree scoping + historical snapshot" as incoherent. The endpoint model
dissolves that: "what changed in my working tree as of a past commit" was
incoherent only because it conflated *change direction* with *content source*.
With content always served from the target endpoint (FR-A2), every base/target
pair is well-defined — working-diff, point-in-time, and release-to-release are all
the same primitive. The release-to-release case ("between v1.2 and v1.3") is
therefore a first-class part of capability A (FR-A6), not a separate feature.

**D-6 — Change-aware impact (B) is line-region based, advisory, over-reports on
renames.** "Changed exports" is derived from the changed region via the existing
regex extractors, not an AST diff. A renamed export appears as both removed and
added, so renames over-report — acceptable, since a rename *is* breaking for
dependents. Output stays advisory; B never claims exhaustiveness.

**D-7 — Index entries absent for a file are a silent non-match, not an error.** A
file in a change set may be absent from the index (exceeds `RAG_MAX_FILE_BYTES`,
binary, etc.); the membership filter won't match it. The index defines what is
searchable; scoping cannot surface what was never indexed.

## Acceptance criteria

- **AC-1 (FR-A1, FR-F1):** Scoping off → results identical to the pre-change tool
  for the same query/index. Scoping on → every result's `filePath` is in the
  known change set, ranked (not merely filtered) within it.
- **AC-2 (FR-A3):** In a project that is a *subdirectory* of its git repo, scoped
  search still matches index entries (paths project-root-relative), verified by a
  non-empty scoped result for a file known to be both changed and indexed.
- **AC-3 (FR-A4, FR-A5):** No base → a newly-created non-ignored file and a
  modified tracked file both appear; a git-ignored file does not. Explicit base,
  working target → set equals (branch changes since merge-base) ∪ (uncommitted
  state), verified against a branch+dirty fixture.
- **AC-4 (FR-A6, FR-A2):** With two revision endpoints, the change set equals the
  diff between them in both three-dot (default) and two-dot modes, verified
  against a tagged fixture; and returned content matches the *target* revision's
  blobs, not current disk.
- **AC-5 (FR-A7):** Identical endpoints / clean tree → a scoped search returns a
  state distinguishable by a consumer from a no-matches response.
- **AC-6 (FR-B1, D-6):** For a file with N exports of which K changed between the
  endpoints, impact reports exactly the K changed symbols (modulo documented
  rename over-reporting) and the dependents derived from those K; framing
  advisory.
- **AC-7 (FR-C1, FR-C2):** A point-in-time query for a revision where a file had
  content X, since changed to Y on disk, returns X — fixture proving the file
  differs between revision and working tree.
- **AC-8 (FR-C3):** After serving any REVISION-target query, the working-tree
  index is byte-for-byte unchanged, verified before/after.
- **AC-9 (FR-C4, FR-C5):** Two symbolic refs at the same commit reuse one store; a
  branch ref moved between two queries returns new content on the second; every
  REVISION-target response names the resolved SHA.
- **AC-10 (FR-D1, FR-D2, D-3):** Each hit in provenance mode carries
  SHA/author/date/subject and a granularity label; a chunk with a recorded line
  range yields line-level attribution where supported.
- **AC-11 (FR-E1–E3):** Churn metadata reflects change frequency over the
  configured window and no further back; churn-ranking off → ordering unchanged
  vs baseline; on → a high-churn file's rank rises without a low-relevance file
  leapfrogging a high-relevance one to the top.
- **AC-12 (FR-F2, D-5):** Change-scoped + provenance compose in one call;
  release-to-release scoping returns target-revision content *with* provenance —
  no combination is rejected as incoherent.
- **AC-13 (NFR-1):** In a non-git directory accepted as a root (e.g. via
  `package.json`), every git-dependent request returns results with an explicit
  "not applied, because not a git repository" indication; never raises, never
  returns un-augmented results framed as augmented.
- **AC-14 (NFR-2):** A git invocation exceeding its timeout degrades per NFR-1
  rather than blocking; fault-injected slow/hung git.
- **AC-15 (NFR-3, SEC-4):** Auxiliary stores stay within the configured footprint
  under repeated distinct-revision queries (eviction observed); a revision too
  large to index within limits degrades per NFR-1 rather than consuming unbounded
  space.
- **AC-16 (SEC-1, SEC-2):** A reference crafted as an option (leading `-`, or an
  `--output=`-style payload) does not alter which git operation runs, writes no
  file, and is rejected or neutralized — tested for both base and target
  reference parameters.
- **AC-17 (SEC-3):** Static inspection confirms only read-only git subcommands are
  reachable from the query path.

## Unresolved (must be decided before/at implementation)

- **U-1 (architecture):** Module boundaries and exact parameter names/shapes added
  to `RagSearchInput`/`RagQueryImpactInput` for A–E; and whether chunk **line
  ranges** are stored in chunk metadata (`utils/chunker.py`/`indexer.py`) —
  FR-D2's line-level granularity depends on it, and if absent, whether to add it.
  Owner: architect/implementer.
- **U-2 (NFR-4):** Final `openWorldHint` value for both tools once a git
  subprocess and external git state are involved. Owner: architect.
- **U-3 (SEC-2):** Whether endpoint references accept arbitrary revisions (tags,
  SHAs, `HEAD~n`, `@{upstream}`) or a narrower set, defining the SEC-2 allowlist
  envelope. Owner: user/architect.
- **U-4 (NFR-3 / FR-E2 policy):** Concrete footprint ceiling and eviction policy
  for auxiliary stores, and the default churn-window size — tuning values needing
  a real-world default. Owner: user/architect.
