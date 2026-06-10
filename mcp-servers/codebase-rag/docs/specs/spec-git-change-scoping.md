# Spec: Git change-scoping for Codebase RAG

Status: draft · Target branch: `claude/codebase-rag-git-integration-gYAw9`
Applies to: `mcp-servers/codebase-rag/mcp-server-python/`

## Problem, audience, and motivation

The Codebase RAG MCP gives an agent two capabilities over a project: semantic
search (`rag_search`) and import/export blast-radius analysis
(`rag_query_impact`). Both reason over the *entire* indexed tree. An agent
working inside a session is almost never reasoning about the entire tree — it
is reasoning about **the change it is making**. It needs to ask "among the
files I have touched, what relates to X" and "of the things I actually changed
in this file, what depends on them," not "what exists anywhere in the repo that
resembles X."

That capability — reasoning relative to a *change* rather than a *snapshot* —
is the one thing semantic search and static metadata extraction structurally
cannot provide, because neither has any notion of a baseline to diff against.
Git does. This spec defines a git-sourced **change-scoping** capability that
narrows both existing tools to the working change, for an agent doing
edit/review-style work in a live session. It is worth building because it
targets the gap the current tools cannot close on their own, at low cost: it
rides on data already indexed and re-uses extraction logic already present.

## Scope

**In scope**

- A capability to restrict `rag_search` results to files changed relative to a
  caller-chosen baseline ("scope-to-diff search").
- A capability to narrow `rag_query_impact` from "everything this file exports"
  to "the exports/endpoints/events that actually changed relative to a
  baseline" ("diff-aware impact").
- The shared notion of "the set of changed files/symbols," expressed in the
  coordinate system the index already uses.
- Graceful, observable degradation when the project is not a git repository.
- The trust boundary and controls for executing git with a caller-supplied
  baseline reference.

**Out of scope** (each an explicit decision, not a gap)

- **Searching historical revisions** (indexing or querying a past commit's tree
  state). Excluded: it changes the index from a single mirror of the working
  tree into a revision-keyed store — a second indexing dimension — which is a
  separate project with its own spec. The current index-is-the-working-tree
  invariant (CLAUDE.md; `indexer.py`, `watcher.py`) is preserved.
- **Churn / recency ranking signals** from `git log`. Excluded as a distinct
  feature; may be specified later.
- **Per-hit blame/provenance annotations.** Excluded as a distinct feature.
- **Distinguishing staged vs. unstaged vs. committed in the output.** The
  consumer is "what's in my change," not "what's my git staging state";
  collapsing them is intentional (see Decisions).
- **Non-git version control** (Mercurial, SVN, etc.) and **git submodules'**
  internal change state. Out for this iteration; degradation rules apply.

## Governing standards

| Standard / source | What it governs here |
|---|---|
| Git documented behavior — `git-diff(1)`, `git-ls-files(1)`, `gitrevisions(7)`, `gitcli(7)` (git 2.43, present in environment) | What "changed" means, the merge-base (`A...B`) semantics, path output coordinate system (`--relative`), inclusion of untracked files, and pathspec/option-terminator (`--`) handling. |
| CWE-78 (OS Command Injection) and CWE-88 (Argument/Option Injection) | Construction and invocation of git subprocesses with a caller-supplied baseline reference. |
| Model Context Protocol tool annotations (`readOnlyHint`, `idempotentHint`, `openWorldHint`) — MCP specification, as already used in `server.py` | How the new parameters/behavior must be declared to clients, and whether existing annotations still hold once a subprocess is involved. |
| ChromaDB metadata filtering (`where` with `$in` over a string list; verified against current Chroma docs, both `query()` and `get()`) | Feasibility constraint on how the candidate set is restricted: a single membership filter, evaluated by the store, over the existing `filePath` metadata. |
| Project locked decisions — `CLAUDE.md`, and observed invariants in `indexer.py`/`config.py` | `filePath` coordinate system, non-git project roots are first-class, nothing written into the project tree, Expert Standard for evaluation. |

## Locked decisions this spec must honor

- **Index coordinate system.** `filePath` in the index is stored *relative to
  `project_root`*, forward-slashed (`indexer.py:145` via `safe_relative_path`;
  `config.py` `ProjectContext.project_root`). Any "changed files" set must be
  expressed in this same coordinate system or it matches nothing.
- **Non-git roots are valid.** Project-root detection accepts `package.json`,
  `pyproject.toml`, `Cargo.toml`, `go.mod`, not only `.git` (`README.md`;
  `utils/paths.find_project_root`). The capability must therefore be optional
  and degrade, never assume `.git` exists.
- **The index mirrors the working tree.** The watcher already keeps the index
  current with on-disk state including uncommitted edits (`README.md` lines
  11–13; `watcher.py`). Git scoping adds a *baseline to compare against*; it does
  not and must not become a second source of truth for file contents.
- **Nothing is written into the project tree** (`CLAUDE.md`). Read-only git
  queries only.
- **Evaluation is against the Expert Standard** (`CLAUDE.md`): requirements
  trace to a named source, not to existing patterns.

## Threat model (precedes security requirements)

The new behavior executes the `git` binary as a subprocess with arguments that
include a **caller-supplied baseline reference** (`base_ref`). The caller is the
LLM agent; the value it passes can be influenced by repository content the agent
has read (file names, comments, issue text) — i.e. it sits across a
prompt-injection-reachable trust boundary, not under direct human control.

- **Attacker:** a confused or adversarially-steered agent, or repository content
  that manipulates the agent into supplying a crafted `base_ref`.
- **Sought:** turning a benign-looking string into (a) an injected git *option*
  (e.g. a value beginning with `-` parsed as a flag such as `--output=PATH`,
  enabling file write or information disclosure — argument injection, CWE-88), or
  (b) an injected *command* if the value ever reaches a shell (CWE-78).
- **Cost of compromise:** arbitrary file write/overwrite or disclosure within the
  process's privileges, executed silently inside the user's environment under the
  guise of a read-only search — high, because the tool is annotated read-only and
  the user has no reason to inspect a search call.

The baseline reference is the only externally-controlled input that reaches the
subprocess; the security requirements below are scoped to it.

## Functional requirements

Each requirement states a property. Mechanisms named are illustrative of intent,
not mandated designs, unless flagged as a genuine constraint.

**FR-1 — Scope-to-diff search.** `rag_search` must support an opt-in mode that
restricts results to the set of files changed relative to a baseline, ranking
within that set rather than filtering the full-tree result after the fact.
*Source:* confirmed user need (the agent's query target is its change, not the
tree). *Note:* ranking-within-set rather than filter-after is required so the
mode cannot under-return (asking for N and silently yielding fewer because the
post-filter discarded ranked hits); ChromaDB `$in` over `filePath` makes
in-query restriction feasible.

**FR-2 — Diff-aware impact.** `rag_query_impact` must support narrowing its
reported exports / API endpoints / websocket events, and the dependents derived
from them, to those that **changed** relative to a baseline, rather than to
everything the file currently defines. *Source:* confirmed user need (blast
radius of *a change* is the reviewer's question; blast radius of *a file* is a
superset that over-reports). The narrowing re-uses the existing extraction logic
(`utils/metadata.extract_*`) applied to the changed region.

**FR-3 — Changed-set coordinate system.** The set of changed files must be
expressed as paths relative to `project_root`, forward-slashed, identical to the
index's `filePath` metadata. *Source:* locked decision (index coordinate
system). *Constraint, not design:* this is an integration contract with the
existing index; a changed set in any other coordinate system (e.g. git-repo-root
relative, which differs from `project_root` whenever the project is a subdirectory
of the repository) matches nothing and silently returns empty. Git's
`--relative` is one mechanism that satisfies this; path rebasing is another; the
choice is the architect's.

**FR-4 — Definition of "changed" against the default baseline.** With no
baseline supplied, the changed set must comprise the **uncommitted** working
state: modified tracked files plus newly-created untracked files that are not
git-ignored. It must not require or infer the existence of any branch name.
*Source:* git documented behavior + confirmed user need + the principle in
Decision D-1. *Note:* untracked-but-not-ignored files are included because the
watcher already indexes them (scope is `.gitignore`, not git tracking), so they
are legitimately searchable and are often exactly the agent's in-progress work.

**FR-5 — Definition of "changed" against an explicit baseline.** When the caller
supplies a baseline reference, the changed set must comprise the changes on the
current branch since it diverged from that baseline (merge-base semantics,
`base...HEAD`) **unioned with** the uncommitted working state from FR-4.
*Source:* git documented behavior (`gitrevisions(7)` three-dot range = symmetric
to merge-base for diff) + confirmed user need (an agent on a feature branch wants
both its commits and its uncommitted edits). *Note:* the union with FR-4 ensures
in-progress edits are never invisible just because a baseline was named.

**FR-6 — Opt-in, non-default behavior.** Both capabilities must be off by
default; absent the relevant parameter, `rag_search` and `rag_query_impact`
behave exactly as today. *Source:* backward-compatibility constraint (existing
callers and the existing tool contract must not change behavior silently).

**FR-7 — Empty changed-set is a distinct, truthful outcome.** When the changed
set is legitimately empty (clean working tree, no divergence), the response must
report this as a distinct state, separable by the caller from "no semantic
matches found." *Source:* downstream-verifiability need; conflating the two would
let an agent misread a clean tree as a broken search.

## Non-functional requirements

**NFR-1 — Graceful, observable degradation.** When the project root is not a git
repository, or the git binary is unavailable, or a git invocation fails, a
requested scoping must degrade to an explicit, caller-visible no-op: the
response must state that scoping was not applied and why. It must not raise, must
not hang, and must not silently return unscoped results as though scoping had
succeeded. *Source:* locked decision (non-git roots are first-class) +
downstream-verifiability (a silent fall-through to full-tree results when the
agent asked for changed-only is a correctness lie).

**NFR-2 — Bounded latency.** Each git invocation must be bounded by a timeout
and must not block the server's async loop; on timeout it degrades per NFR-1.
*Source:* the tools are annotated `idempotentHint`/read-only and are called
interactively; an unbounded subprocess would violate the responsiveness the
existing `_await_ready_or_status` design (`server.py`) establishes.

**NFR-3 — Annotation honesty.** The MCP tool annotations must remain accurate
after the change. Read-only and idempotent hints still hold (git queries read
only, and repeated calls on an unchanged tree return the same set). Whether the
change requires reconsidering `openWorldHint` (currently `False`, asserting the
tool does not reach outside its closed world) must be decided explicitly:
executing an external binary and reading git state beyond the indexed files is a
material change to the tool's world. *Source:* MCP annotation semantics. *Note:*
this is flagged for the architect; the spec does not pre-decide the hint value,
but requires the decision be made rather than defaulted.

## Security requirements

Each ties to the threat model above.

**SEC-1 — No shell interpretation.** Git must be invoked such that no argument,
including `base_ref`, is interpreted by a shell. *Threat:* command injection
(CWE-78). *Property, not mechanism:* the spec requires the property; list-form
process invocation is one way to satisfy it.

**SEC-2 — Baseline reference cannot inject options.** A caller-supplied
`base_ref` must not be capable of being parsed by git as an option/flag rather
than a revision. *Threat:* argument injection (CWE-88), e.g. a value beginning
with `-` or containing one that git treats as `--output=` or similar. *Property:*
the value must be confined to the revision position — e.g. validated against an
allowlist of characters legal in a ref and/or separated from options by the `--`
terminator per `gitcli(7)`. The architect chooses the combination; the property
is that no `base_ref` value can alter which git operation runs or where it
writes.

**SEC-3 — Read-only git surface.** Only read-only git subcommands
(diff/ls-files/rev-parse/merge-base-class operations) may be used. No subcommand
that mutates the repository, working tree, index, or config may be invoked.
*Threat:* the read-only annotation must not be falsifiable by the implementation
(CLAUDE.md: nothing written into the project tree).

## What changes from current state

- `rag_search` (`server.py:299`, `query.check_constraints`): gains opt-in
  baseline-scoping parameters; default path unchanged (FR-6). When scoping is
  active, the candidate set handed to the vector store is restricted to the
  changed set (FR-1).
- `rag_query_impact` (`server.py:372`, `query.query_impact`): gains an opt-in
  baseline parameter; default path unchanged (FR-6). When active, reported
  symbols and dependents are narrowed to changed ones (FR-2).
- New internal capability: deriving the changed set (FR-3/4/5) and the changed
  symbols (FR-2), invoked from the query path. Architecture decides its module
  boundary.
- No change to: the indexer write path, the watcher, the cache format/schema, or
  the index-mirrors-working-tree invariant. No re-index is required to adopt this
  feature; it reads metadata already stored.
- Preserved for non-git projects: identical behavior to today, with scoping
  requests degrading per NFR-1.

## Decisions made during this spec

**D-1 — Default baseline is the uncommitted working tree, never an inferred
branch.** When no baseline is supplied, "changed" means the uncommitted working
state (FR-4), not "since `main`." *Reasoning:* a baseline of `main`/`master`/etc.
would have to be *guessed*; on a repo whose mainline is named otherwise (e.g.
`develop`, `trunk`), the guess returns a wrong file set with no error the caller
can detect. The governing principle: **a default may be narrow, but it must never
be a guess that can be confidently wrong.** The uncommitted-tree baseline needs no
repository convention, always has a valid reference (`HEAD` exists in any
non-empty repo), and its empty case is truthful (FR-7) rather than wrong. Branch
breadth is available but must be opt-in via an explicit baseline (FR-5). This was
the one decision the user explicitly declined to make by preference and asked to
be resolved on correctness grounds; it is resolved here on correctness grounds.

**D-2 — Staged/unstaged/committed are collapsed in the changed set, not
surfaced.** *Reasoning:* the consumer's question is "what is in my change," not
"what is my git staging state." Exposing the distinction would add surface that
no identified need consumes; it is listed out of scope. Revisable if a concrete
need appears.

**D-3 — Diff-aware impact is line-region based, advisory, and may over-report on
renames.** Narrowing exports to "changed" is derived from the changed region of
the file, not from a semantic/AST diff. *Reasoning:* it re-uses the existing
regex extractors (`utils/metadata`) with no new parsing machinery, consistent
with how the current impact analysis already works. The cost is that a renamed
export appears as both removed and added, so renames over-report — acceptable,
because a rename *is* a breaking change for dependents. The consequence: output
wording must stay advisory ("changed exports likely affected"), never claim
exhaustiveness. This bounds FR-2's guarantee and the architect must preserve the
advisory framing.

**D-4 — Index entries absent for a changed file are a silent non-match, not an
error.** A file can be in the git changed set yet absent from the index (e.g.
exceeds `RAG_MAX_FILE_BYTES`, binary, or git-ignored-but-tracked edge cases). The
membership filter simply will not match it. *Reasoning:* this is correct
behavior, not a failure — the index defines what is searchable; scoping cannot
surface what was never indexed. No error is warranted.

## Acceptance criteria

Mapped to requirements; each is a verification, not "it works."

- **AC-1 (FR-1, FR-6):** With scoping off, `rag_search` returns identical results
  to the pre-change tool for the same query and index. With scoping on in a repo
  with a known set of changed files, every returned result's `filePath` is a
  member of that changed set, and results are ranked (not merely filtered) within
  it.
- **AC-2 (FR-2, D-3):** In a repo where a file has N exports of which K were
  changed relative to the baseline, diff-aware impact reports exactly the K
  changed symbols (modulo documented rename over-reporting) and the dependents
  derived from those K, not from all N. Output framing is advisory.
- **AC-3 (FR-3):** In a project that is a subdirectory of its git repository, the
  changed set still matches index entries — i.e. paths are project-root-relative,
  verified by a non-empty scoped result for a file known to be both changed and
  indexed.
- **AC-4 (FR-4):** With no baseline, a newly-created non-ignored file that the
  agent just wrote, and a modified tracked file, both appear in the changed set;
  a git-ignored file does not.
- **AC-5 (FR-5):** With an explicit baseline, the changed set equals
  (branch changes since merge-base) ∪ (uncommitted working state), verified
  against a constructed branch+dirty-tree fixture.
- **AC-6 (FR-7):** On a clean working tree with no baseline, a scoped search
  returns a response whose state is distinguishable by a consumer from a
  no-semantic-matches response.
- **AC-7 (NFR-1):** In a non-git directory accepted as a project root (e.g. via
  `package.json`), a scoped request returns results with an explicit indication
  that scoping was not applied and why; it neither raises nor silently returns
  unscoped results framed as scoped.
- **AC-8 (NFR-2):** A git invocation that exceeds the timeout degrades per NFR-1
  rather than blocking; verified by a fault-injected slow/hung git.
- **AC-9 (SEC-1, SEC-2):** A `base_ref` value crafted as an option (e.g. leading
  `-`, or an `--output=`-style payload) does not alter which git operation runs,
  does not write any file, and is rejected or neutralized; verified by an
  adversarial-input test asserting no out-of-position file is created and the
  operation set is unchanged.
- **AC-10 (SEC-3):** Static inspection confirms only read-only git subcommands
  are reachable from the query path.

## Unresolved (must be decided before/at implementation)

- **U-1 (architecture):** Module boundary and signature for the changed-set /
  changed-symbol derivation, and the exact parameter names/shapes added to the
  two tools' input models (`RagSearchInput`, `RagQueryImpactInput`). Owner:
  architect/implementer. Blocks: implementation. Constrained by FR-3/4/5, SEC-*,
  NFR-3.
- **U-2 (NFR-3):** Final value of `openWorldHint` for the two tools once a git
  subprocess is involved. Owner: architect. Blocks: tool annotation correctness.
- **U-3:** Whether the explicit-baseline parameter accepts arbitrary revisions
  (tags, SHAs, `HEAD~n`) or only branch names, within the SEC-2 validation
  envelope. Owner: user/architect. Blocks: SEC-2 allowlist definition.
