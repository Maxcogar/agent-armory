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
session. It covers five capabilities, treated as one coherent feature rather than
a slice with the rest deferred:

1. **Change-scoped search** — restrict search to what changed relative to a baseline.
2. **Change-aware impact** — narrow blast-radius to the symbols that actually changed.
3. **Historical search** — query the codebase as it existed at a past revision.
4. **Provenance on results** — attach authorship/commit identity to search hits.
5. **Churn signal** — expose and optionally weight by how volatile a file is.

It is worth building as a whole because partial git-awareness is the failure
mode: an agent that can scope to a diff but can't see what changed historically,
or can rank by relevance but not volatility, still has to fall back to manual
git invocations for the rest — which is the gap this layer exists to close.

## Scope

**In scope** — all five capabilities above, plus the cross-cutting concerns they
share: the changed-set/revision coordinate system, the definition of "changed,"
graceful degradation on non-git roots, the trust boundary for executing git with
caller-supplied references, and bounded resource use for any auxiliary indexing
that historical search requires.

**Out of scope** — only genuinely distinct integrations, each a decision not a
gap:

- **Non-git version control** (Mercurial, SVN, Perforce). This is a *git*
  integration; another VCS is a separate integration with its own backend. Git
  absence degrades per NFR-1, it does not error.
- **Writing git state** — creating commits, branches, stashes, notes, or
  modifying the working tree/index/config. The layer is strictly read-only
  (CLAUDE.md: nothing written into the project tree). This is a hard boundary,
  not a deferral.
- **A general git CLI passthrough tool.** The layer exposes the five
  capabilities above through the RAG's semantic surface; it is not a generic
  "run arbitrary git" tool, because that would be an unbounded trust and
  annotation surface (see threat model).

## Governing standards

| Standard / source | What it governs here |
|---|---|
| Git documented behavior — `git-diff(1)`, `git-log(1)`, `git-blame(1)`, `git-ls-files(1)`, `git-ls-tree(1)`, `git-cat-file(1)`, `git-archive(1)`, `git-rev-parse(1)`, `git-merge-base(1)`, `gitrevisions(7)`, `gitcli(7)` (git 2.43, present) | Definition of "changed," merge-base (`A...B`) semantics, path output coordinate system (`--relative`), untracked-file inclusion, reading a revision's tree/blobs, per-line authorship, ref resolution to immutable SHAs, and pathspec/option-terminator (`--`) handling. |
| CWE-78 (OS Command Injection) and CWE-88 (Argument/Option Injection) | Construction/invocation of every git subprocess that includes a caller-supplied reference (baseline or historical revision). |
| CWE-400 (Uncontrolled Resource Consumption) | Auxiliary historical indexing — building an index of a past revision must be bounded in space and time. |
| Model Context Protocol tool annotations (`readOnlyHint`, `idempotentHint`, `openWorldHint`) — MCP spec, as already used in `server.py` | How new parameters/behavior are declared, and whether existing annotations still hold once a subprocess and external git state are involved. |
| ChromaDB metadata filtering (`where` with `$in` over a string list) and persistent multi-collection storage; verified against current Chroma docs (filter applies to both `query()` and `get()`) | Feasibility of restricting the candidate set by membership, and of holding revision-keyed auxiliary collections alongside the working-tree collection. |
| Project locked decisions — `CLAUDE.md`, invariants in `indexer.py`/`config.py`/`watcher.py` | `filePath` coordinate system, non-git roots as first-class, nothing written into the project tree, the working-tree-mirror invariant, Expert Standard for evaluation. |

## Locked decisions this spec must honor

- **Index coordinate system.** `filePath` is stored relative to `project_root`,
  forward-slashed (`indexer.py:145` via `safe_relative_path`). Every changed-set
  or revision file list must use this same coordinate system or it matches
  nothing.
- **Non-git roots are valid.** Root detection accepts `package.json`,
  `pyproject.toml`, `Cargo.toml`, `go.mod`, not only `.git`. The whole layer must
  be optional and degrade.
- **The working-tree index mirrors on-disk state**, kept current by the watcher
  (`README.md` 11–13; `watcher.py`). Git awareness adds baselines/history/metadata
  *around* this index; it must not corrupt or replace the working-tree index as
  the source of truth for present-tense content.
- **Nothing is written into the project tree** (`CLAUDE.md`). All caches live in
  the existing per-project cache dir (`config.py` `cache_dir_for`); git is invoked
  read-only.
- **Evaluation is against the Expert Standard** (`CLAUDE.md`).

## Threat model (precedes security requirements)

The layer executes the `git` binary with arguments that include
**caller-supplied references** — a baseline ref (scoping/impact) and a historical
revision (historical search). The caller is the LLM agent; those values can be
influenced by repository content the agent has read (filenames, comments, issue
text), so they sit across a prompt-injection-reachable trust boundary, not under
direct human control. Historical search additionally consumes resources
proportional to a revision's tree size.

- **Attacker:** a confused or adversarially-steered agent, or repository content
  that manipulates the agent into supplying a crafted reference.
- **Sought:**
  - (a) an injected git *option* — a reference value beginning with `-` parsed as
    a flag such as `--output=PATH`, enabling file write or disclosure (CWE-88);
  - (b) an injected *command* if a value ever reaches a shell (CWE-78);
  - (c) resource exhaustion — driving repeated historical indexing of large or
    many revisions to exhaust disk/CPU (CWE-400).
- **Cost of compromise:** arbitrary file write/overwrite or disclosure within the
  process's privileges, or denial of service, executed silently under the guise
  of a read-only search — high, because the tools are annotated read-only and the
  user has no reason to inspect a search call.

Caller-supplied references and revision size are the externally-controlled inputs
that reach the subprocess and the cache; the security requirements are scoped to
them.

## Functional requirements

Requirements state properties. Named mechanisms are illustrative unless flagged
as a genuine constraint.

### A. Change-scoped search

**FR-A1.** `rag_search` must support an opt-in mode that restricts results to the
set of files changed relative to a baseline, ranking *within* that set rather
than filtering the full-tree result afterward. *Source:* confirmed user need
(query target is the change, not the tree). *Note:* rank-within-set is required
so the mode cannot under-return; ChromaDB `$in` over `filePath` makes in-query
restriction feasible.

**FR-A2 — Changed-set coordinate system.** The changed set must be paths relative
to `project_root`, forward-slashed, identical to `filePath`. *Source:* locked
decision. *Constraint, not design:* a set in any other coordinate system (e.g.
git-repo-root-relative, which differs whenever the project is a subdirectory of
the repo) silently matches nothing. `git diff --relative` is one mechanism; path
rebasing is another.

**FR-A3 — Default baseline.** With no baseline supplied, the changed set is the
**uncommitted** working state: modified tracked files plus newly-created
untracked, non-ignored files. It must not require or infer any branch name.
*Source:* git documented behavior + need + Decision D-1. Untracked-non-ignored
files are included because the watcher already indexes them (scope is
`.gitignore`, not git tracking).

**FR-A4 — Explicit baseline.** When a baseline ref is supplied, the changed set is
the branch's changes since it diverged from that baseline (merge-base,
`base...HEAD`) **unioned with** the uncommitted working state of FR-A3. *Source:*
`gitrevisions(7)` + need (an agent on a feature branch wants both its commits and
its in-progress edits).

**FR-A5 — Empty changed-set is a distinct outcome.** A legitimately empty changed
set (clean tree, no divergence) must be reported as a state separable by the
caller from "no semantic matches found." *Source:* downstream verifiability.

### B. Change-aware impact

**FR-B1.** `rag_query_impact` must support narrowing its reported exports / API
endpoints / websocket events, and the dependents derived from them, to those that
**changed** relative to a baseline, rather than to everything the file currently
defines. *Source:* need — blast radius of *a change* is the reviewer's question;
blast radius of *a file* over-reports. Narrowing re-uses the existing extractors
(`utils/metadata.extract_*`) over the changed region.

**FR-B2.** With no baseline, "changed" for impact follows FR-A3 (working-tree
diff of the target file); with an explicit baseline, FR-A4. *Source:* consistency
with capability A so one mental model of "changed" governs the whole layer.

### C. Historical search

**FR-C1.** `rag_search` and `rag_query_impact` must support an opt-in mode that
answers against the codebase **as it existed at a specified past revision**,
rather than the current working tree. *Source:* need (comprehension/review
questions of the form "what did this subsystem look like before the refactor").

**FR-C2 — Historical content comes from git, not the working tree.** A historical
query's results must reflect file contents recorded at that revision, obtained
from git's object store, never from current on-disk state. *Source:* git
documented behavior; correctness (a historical answer drawn from current files is
simply wrong).

**FR-C3 — Working-tree index is never mutated by historical search.** Serving a
historical query must not write into, evict from, or otherwise alter the
present-tense working-tree index. Historical content lives in a *separate*,
auxiliary store. *Source:* locked decision (working-tree-mirror invariant). This
is the requirement that lets historical search exist without violating the
invariant: history is an added dimension alongside the index, not a mutation of
it.

**FR-C4 — Revision identity is immutable.** A historical store must be keyed by
the **resolved commit SHA**, not by the symbolic reference the caller passed, so
that (a) a moving ref (branch/tag) cannot return stale content, and (b) two refs
resolving to the same commit share one store. The caller may pass a symbolic ref;
the layer resolves it to a SHA at query time. *Source:* git ref-resolution
semantics; correctness. *Constraint, not design.*

**FR-C5.** A historical query must report the revision it actually resolved to
(the SHA, and the symbolic ref if one was given), so the caller can confirm what
was searched. *Source:* downstream verifiability.

### D. Provenance on results

**FR-D1.** `rag_search` must support an opt-in mode that attaches, to each
result, the identity of the commit that last modified the relevant region:
commit SHA (abbreviated and full), author, author date, and subject line.
*Source:* need (an agent evaluating a hit wants to know how recent and whose it
is); git documented behavior (`git-log`/`git-blame`).

**FR-D2 — Granularity.** Provenance must be reported at the **chunk's line range**
where the index records line ranges for a chunk, falling back to **file-level**
last-commit when line-level attribution is unavailable. *Source:* precision need
balanced against cost; line-level blame is more expensive than file-level
last-commit, so the requirement permits the cheaper fallback rather than mandating
the expensive path universally (see D-3). *Note:* whether chunk line ranges are
currently stored is an integration question for U-1.

### E. Churn signal

**FR-E1.** The layer must be able to compute, per file, a **churn signal** —
how frequently the file changed over a bounded, configurable recent window of
history — and (a) return it as metadata on search results and (b) optionally
fold it into result ranking as a recency-weighted volatility factor. *Source:*
need (volatile files are disproportionately where an agent should look first or
tread carefully); git documented behavior (`git-log --name-only` over a window).

**FR-E2 — Bounded window.** The churn window must be bounded (a configurable
number of commits or a time horizon), never an unbounded full-history walk on
every query. *Source:* CWE-400; responsiveness. *Constraint.*

**FR-E3 — Ranking blend is opt-in and bounded.** When churn is folded into
ranking, it must adjust, not dominate, semantic relevance, and the behavior must
be off by default so existing ranking is unchanged unless requested. *Source:*
backward-compatibility constraint (FR-F1) + need.

### F. Cross-cutting

**FR-F1 — All additions opt-in; default behavior unchanged.** Absent any new
parameter, `rag_search` and `rag_query_impact` behave exactly as today (same
results, same latency profile). Every capability A–E is requested explicitly.
*Source:* backward-compatibility constraint — the existing tool contract and
callers must not change silently.

**FR-F2 — Capabilities compose.** Where meaningful, capabilities combine in one
call (e.g. change-scoped search *with* provenance; historical search *with*
churn-as-of-that-window). The design must not make them mutually exclusive
without a stated reason. *Source:* need (an agent reviewing a branch wants scoped
results *and* who wrote them in one call). *Note:* historical search (C) and
working-tree change-scoping (A) are the one pair with an inherent tension — "what
changed" is defined against the working tree, "history" is a past snapshot;
their interaction is resolved in D-5.

## Non-functional requirements

**NFR-1 — Graceful, observable degradation.** When the root is not a git repo,
git is unavailable, or a git invocation fails, any requested git-dependent
behavior degrades to an explicit, caller-visible no-op: the response states which
capability was not applied and why. It must not raise, hang, or silently return
un-augmented results as though the capability had succeeded. *Source:* locked
decision (non-git roots first-class) + downstream verifiability.

**NFR-2 — Bounded latency, non-blocking.** Every git invocation is timeout-bounded
and must not block the server's async loop (consistent with the existing
`_await_ready_or_status` design in `server.py`); on timeout it degrades per NFR-1.
*Source:* the tools are interactive and annotated idempotent/read-only.

**NFR-3 — Bounded historical-index footprint.** Auxiliary historical stores must
have a bounded total footprint with a defined eviction policy; building one must
be size/time-bounded and degrade per NFR-1 if a revision is too large to index
within limits. They live under the existing per-project cache dir, never in the
project tree. *Source:* CWE-400 + locked decision (cache location).

**NFR-4 — Annotation honesty.** MCP annotations must remain accurate. Read-only
and idempotent hints still hold (git is read-only; repeated calls on an unchanged
tree/revision return the same result). `openWorldHint` (currently `False`) must be
re-decided explicitly: executing an external binary and reading git state beyond
the indexed files is a material change to the tool's world. The decision must be
made, not defaulted. *Source:* MCP annotation semantics.

## Security requirements

Each ties to the threat model.

**SEC-1 — No shell interpretation.** Git is invoked so that no argument —
baseline ref, historical ref, pathspec — is interpreted by a shell. *Threat:*
CWE-78. *Property, not mechanism.*

**SEC-2 — References cannot inject options.** No caller-supplied reference
(baseline or historical) can be parsed by git as an option/flag rather than a
revision — e.g. a value beginning with `-`, or one git would treat as
`--output=`. *Threat:* CWE-88. *Property:* references confined to the revision
position via a legal-ref allowlist and/or the `--` terminator (`gitcli(7)`); the
combination is the architect's, the property is that no reference value can change
which git operation runs or where it writes.

**SEC-3 — Read-only git surface only.** Only read-only subcommands
(diff/log/blame/ls-files/ls-tree/cat-file/archive/rev-parse/merge-base) may be
reachable. No subcommand that mutates repository, working tree, index, or config.
*Threat:* falsifiable read-only annotation; CLAUDE.md hard boundary.

**SEC-4 — Historical indexing is resource-bounded.** Historical-index builds are
bounded per NFR-3 and rate/footprint-limited so repeated historical queries
cannot exhaust disk or CPU. *Threat:* CWE-400.

## What changes from current state

- `rag_search` (`server.py:299`, `query.check_constraints`): gains opt-in
  parameters for change-scoping (A), historical revision (C), provenance (D), and
  churn (E). Default path unchanged (FR-F1).
- `rag_query_impact` (`server.py:372`, `query.query_impact`): gains opt-in
  baseline (B) and historical revision (C). Default path unchanged.
- New internal capabilities: deriving the changed set (A/B), reading a revision's
  tree and serving it from an auxiliary revision-keyed store (C), computing
  provenance (D) and churn (E). Module boundaries are architecture (U-1).
- New cache content: auxiliary revision-keyed collections under the existing
  per-project cache dir, with eviction (NFR-3). Working-tree collection format and
  the working-tree-mirror invariant are unchanged; **no re-index of the working
  tree is required** to adopt any capability — A/B/D/E read existing metadata or
  live git, and C builds separate stores on demand.
- Preserved for non-git projects: identical behavior to today, with every
  git-dependent request degrading per NFR-1.

## Decisions made during this spec

**D-1 — Default baseline is the uncommitted working tree, never an inferred
branch.** *Reasoning:* inferring `main`/`master` would *guess*; on a repo whose
mainline is named otherwise the guess returns a wrong set with no error the caller
can detect. Principle: **a default may be narrow, but it must never be a guess
that can be confidently wrong.** The uncommitted-tree baseline needs no
convention, always has a valid reference (`HEAD`), and its empty case is truthful
(FR-A5). Branch breadth is opt-in (FR-A4). Resolved on correctness grounds at the
user's explicit instruction.

**D-2 — Provenance/churn are reported, not used to gate results.** They annotate
and (for churn, opt-in) re-weight; they never *remove* a semantic match. *Reason:*
removing relevant hits on a metadata signal would degrade the core search
contract. Churn-as-ranking is bounded and opt-in (FR-E3).

**D-3 — Provenance granularity is line-level where the index supports it, else
file-level.** *Reasoning:* line-level blame is the precise answer but costs a
blame per hit; file-level last-commit is cheap. Mandating line-level universally
would breach NFR-2 on large result sets; permitting fallback keeps the capability
honest about its cost. Output must indicate which granularity a given provenance
record used so the caller is not misled.

**D-4 — Historical content is served from on-demand, SHA-keyed auxiliary stores,
not by re-pointing the working-tree index.** *Reasoning:* this is the only design
family that satisfies FR-C2/C3/C4 together — historical contents from git, working
index untouched, immutable revision identity. Stores are built lazily on first
query for a revision, keyed by resolved SHA, cached under the project cache dir,
and evicted under NFR-3. The lazy/SHA-keyed/evictable shape is mandated by those
requirements; the storage mechanism within it is the architect's.

**D-5 — Historical search and working-tree change-scoping are mutually exclusive
in a single call; their composition is rejected with a clear error, not silently
reinterpreted.** *Reasoning:* "changed relative to a baseline" is defined against
the *working tree* (FR-A3/A4), while historical mode answers against a *past
snapshot with no working tree*; "files changed in my working tree, as of a commit
three weeks ago" has no coherent meaning. Rather than silently pick one, the layer
rejects the combination with a message naming the conflict. All other A–E
combinations compose (FR-F2). *Note:* "what changed *between* two historical
revisions" is a coherent and desirable question, but it is a distinct
diff-between-revisions capability; it is recorded as U-4 rather than smuggled into
either A or C.

**D-6 — Diff-aware impact (B) is line-region based, advisory, and over-reports on
renames.** "Changed exports" is derived from the changed region via the existing
regex extractors, not an AST diff. A renamed export appears as both removed and
added, so renames over-report — acceptable, since a rename *is* breaking for
dependents. Output wording stays advisory; B never claims exhaustiveness.

**D-7 — Index entries absent for a file are a silent non-match, not an error.** A
file in the git changed set may be absent from the index (exceeds
`RAG_MAX_FILE_BYTES`, binary, etc.); the membership filter simply won't match it.
The index defines what is searchable; scoping cannot surface what was never
indexed.

## Acceptance criteria

Mapped to requirements; each a verification, not "it works."

- **AC-1 (FR-A1, FR-F1):** Scoping off → results identical to the pre-change tool
  for the same query/index. Scoping on → every result's `filePath` is in the
  known changed set, and results are ranked, not merely filtered, within it.
- **AC-2 (FR-A2):** In a project that is a *subdirectory* of its git repo, scoped
  search still matches index entries (paths project-root-relative), verified by a
  non-empty scoped result for a file known to be both changed and indexed.
- **AC-3 (FR-A3, FR-A4):** With no baseline, a newly-created non-ignored file and
  a modified tracked file both appear; a git-ignored file does not. With an
  explicit baseline, the set equals (branch changes since merge-base) ∪
  (uncommitted state), verified against a branch+dirty fixture.
- **AC-4 (FR-A5):** On a clean tree with no baseline, a scoped search returns a
  state distinguishable by a consumer from a no-matches response.
- **AC-5 (FR-B1, D-6):** For a file with N exports of which K changed, impact
  reports exactly the K changed symbols (modulo documented rename over-reporting)
  and the dependents derived from those K; framing is advisory.
- **AC-6 (FR-C1, FR-C2):** A historical query for a revision in which a file had
  content X, since changed to Y on disk, returns X — verified against a fixture
  whose file content provably differs between the revision and the working tree.
- **AC-7 (FR-C3):** After serving a historical query, the working-tree index is
  byte-for-byte unchanged (collection contents/identity), verified before/after.
- **AC-8 (FR-C4, FR-C5):** Two symbolic refs resolving to the same commit reuse
  one store; a branch ref that is moved to a new commit between two queries returns
  the new content on the second query; every historical response names the
  resolved SHA.
- **AC-9 (FR-D1, FR-D2, D-3):** Each hit in provenance mode carries SHA/author/
  date/subject; records indicate line-level vs file-level granularity; a chunk
  with a recorded line range yields line-level attribution where the backend
  supports it.
- **AC-10 (FR-E1, FR-E2, FR-E3):** Churn metadata reflects change frequency over
  the configured window and no further back; with churn-ranking off, ordering is
  unchanged vs baseline; with it on, a high-churn file's rank increases without a
  low-relevance file leapfrogging a high-relevance one to the top.
- **AC-11 (FR-F2, D-5):** Change-scoped + provenance compose in one call;
  historical + working-tree-scoping is rejected with a message naming the
  conflict, not silently reinterpreted.
- **AC-12 (NFR-1):** In a non-git directory accepted as a root (e.g. via
  `package.json`), every git-dependent request returns results with an explicit
  "not applied, because not a git repository" indication; never raises, never
  returns un-augmented results framed as augmented.
- **AC-13 (NFR-2):** A git invocation exceeding its timeout degrades per NFR-1
  rather than blocking; verified with a fault-injected slow/hung git.
- **AC-14 (NFR-3, SEC-4):** Historical stores stay within the configured footprint
  under repeated distinct-revision queries (eviction observed); a revision too
  large to index within limits degrades per NFR-1 rather than consuming unbounded
  space.
- **AC-15 (SEC-1, SEC-2):** A reference crafted as an option (leading `-`, or an
  `--output=`-style payload) does not alter which git operation runs, writes no
  file, and is rejected or neutralized — verified by adversarial-input tests for
  both the baseline and historical reference parameters.
- **AC-16 (SEC-3):** Static inspection confirms only read-only git subcommands are
  reachable from the query path.

## Unresolved (must be decided before/at implementation)

- **U-1 (architecture):** Module boundaries and the exact parameter
  names/shapes added to `RagSearchInput`/`RagQueryImpactInput` for capabilities
  A–E; and whether chunk **line ranges** are currently stored in chunk metadata
  (`utils/chunker.py`/`indexer.py`) — FR-D2's line-level granularity depends on it,
  and if absent, whether to add it. Owner: architect/implementer.
- **U-2 (NFR-4):** Final `openWorldHint` value for both tools once a git
  subprocess and external git state are involved. Owner: architect.
- **U-3 (SEC-2):** Whether reference parameters accept arbitrary revisions (tags,
  SHAs, `HEAD~n`, `@{upstream}`) or a narrower set, defining the SEC-2 allowlist
  envelope. Owner: user/architect.
- **U-4 (scope, candidate next capability):** Diff *between two historical
  revisions* ("what changed between v1.2 and v1.3"), distinct from capabilities A
  (working-tree change) and C (single-revision snapshot) per D-5. Coherent and
  likely wanted; recorded here explicitly rather than silently excluded, so it is
  a tracked decision for the user to greenlight as a sixth capability or defer
  with eyes open. Owner: user.
- **U-5 (NFR-3 policy):** The concrete footprint ceiling and eviction policy for
  historical stores, and the default churn-window size (FR-E2) — tuning values
  that need a real-world default. Owner: user/architect.
