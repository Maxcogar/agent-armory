# Architecture — Git integration for Codebase RAG

Derives from: `docs/specs/spec-git-change-scoping.md` (five capabilities: change-set
scoping, change-aware impact, historical search, provenance, churn).
Applies to: `mcp-servers/codebase-rag/mcp-server-python/`.

## Goal — what this architecture serves

Give the RAG a single, read-only git-awareness layer that lets an agent reason
about a *change*, a *past revision*, *authorship*, and *volatility* — not just the
present-tense indexed snapshot — without compromising the working-tree-mirror
invariant, the no-writes-into-the-project-tree rule, or the existing tool
contract. What makes this architecture *correct* rather than merely *complete* is
that every git-derived fact is expressed in the index's own coordinate system and
served from the right content snapshot, and that the one new capability with teeth
— executing the `git` binary on caller-influenced input — is confined to a single
audited boundary. The local-optimum trap it must resist: scattering `git`
subprocess calls and ad-hoc path handling across the query path because each call
site "just needs one diff," which multiplies the injection surface and the
coordinate-system bugs until the feature is unsafe and unmaintainable.

## Scope

**In scope.** Component structure for all five spec capabilities (A–E), the
endpoint model that unifies change/history, the single git execution boundary and
its security controls, the SHA-keyed auxiliary-store design for historical
content, the chunk metadata change that line-level provenance requires, the query
integration points, the MCP annotation change, and the degradation contract.

**Deferred (to `/expert-plan` / build).** Exact parameter *names* on the two tool
input models (the shapes and types are fixed here; the bikeshed-level naming is
the planner's). Concrete default values for the historical-store footprint
ceiling, eviction count, churn-window size, and git timeout (this architecture
fixes that they exist, are configurable, and via which env-var convention; the
numeric defaults are a tuning task — spec U-4). Test-fixture construction.

**Out of scope.** Non-git VCS; any write to git state; a general git passthrough
tool. All three are spec-level exclusions, carried forward unchanged.

## Inheritance from existing precedents

Not applicable — attested. This is the first git-integration architecture for this
project; there is no sibling architecture in the same family (same problem class +
same architectural pattern) to inherit decisions from. The existing RAG modules
(`indexer.py`, `query.py`, `config.py`, `utils/`) are *reference material and
integration constraints*, not precedent decisions to clone; where this
architecture reuses them (the chunk/embed pipeline, the Chroma client cache, the
coordinate system) that reuse is justified per-decision below, not by structural
inheritance.

## Components and structure

Seven elements. The first five are new; the last two are bounded changes to
existing modules.

1. **`utils/git.py` — the git access boundary (new).** The *only* place in the
   codebase that executes `git`. Exposes typed, read-only operations: repo
   detection, ref→SHA resolution, change-set between two endpoints, revision
   tree/blob enumeration, last-commit and per-line authorship, and per-file churn
   over a bounded window. Every operation is list-form subprocess (no shell),
   `-C <project_root>`, timeout-bounded, with caller references confined to the
   revision position (allowlist + `--` terminator). Returns typed sentinels
   (`None` / a "not-a-repo" marker) on absence or failure — never raises across
   the boundary. This component carries SEC-1..SEC-4.

2. **`changeset.py` — endpoint model + change-set service (new).** Defines
   `Endpoint = WORKING | Revision(sha, symbolic_ref)` and computes the
   project-root-relative changed-path set between a base and target endpoint
   (FR-A1–A6, FR-B1–B2). Calls `git.py`; owns the default/explicit/rev-rev and
   two-dot/three-dot logic and the working-tree union (uncommitted + untracked
   non-ignored).

3. **`revisions.py` — revision store manager (new).** For a target
   `Revision`, lazily builds and serves a *separate* ChromaDB persistent store
   holding that revision's content, keyed by resolved commit SHA under
   `cache_dir_for(root)/revisions/<sha>/collections/`. Builds by streaming the
   revision's blobs from `git.py` through the **shared** chunk/embed pipeline
   (element 6), never touching the working tree or the working-tree index.
   Enforces a bounded total footprint with LRU eviction and a per-build size/time
   cap (NFR-3, SEC-4). Carries FR-C1–C5.

4. **`provenance.py` — provenance + churn annotators (new).** Post-query
   services that decorate an already-ranked result set: provenance maps each
   result's `filePath` (+ line range when available) to last-commit identity
   (SHA/author/date/subject) via `git.py`; churn maps each `filePath` to a
   bounded-window change count. Both are opt-in, bounded by `num_results` and a
   timeout, and never remove results (spec D-2). Carry FR-D1–D2, FR-E1–E3.

5. **Tool surface changes in `server.py`.** New opt-in fields on `RagSearchInput`
   and `RagQueryImpactInput` (endpoints, historical revision, provenance, churn);
   `openWorldHint` flipped to `True` on both tools (element D7). Default calls are
   byte-identical to today (FR-F1).

6. **Content-source seam in `indexer.py` (bounded change).** Today
   `_embed_one_file` reads bytes from disk via `_read_text` (indexer.py:159–198).
   Extract the chunk-from-`(rel_path, content)`-and-embed core so it accepts
   content from *either* disk (working tree) or a git blob (a revision), letting
   `revisions.py` reuse the identical chunking, metadata extraction, and embedding
   — so historical and working results live in the same embedding space and are
   comparable. Also: add `startLine`/`endLine` to `Chunk` and the metadata builder
   (element D5).

7. **Query integration in `query.py` (bounded change).** `check_constraints` and
   `query_impact` gain the new parameters. When scoping is active they pass
   `where={"filePath": {"$in": [...]}}` into the existing `col.query(...)` call
   (query.py:76, currently no `where`); when the target is a `Revision` they
   resolve the Chroma client from `revisions.py` instead of the working-tree
   client; then optionally hand the result set to the `provenance.py` annotators.

**Data flow (scoped + provenance search, the representative path):**
`rag_search(query, base, target, with_provenance)` → `query.check_constraints`
→ `changeset.compute(base, target)` → `git.py` diff (→ project-root-rel set)
→ choose Chroma client (working-tree, or `revisions.py` store if target is a
Revision) → `col.query(query_texts, n_results, where=$in changed-set)` → rank
within set → `provenance.annotate(results)` → `git.py` blame/log → response with
explicit status (incl. "scoping not applied: not a git repo" when degraded).

## Quality characteristics addressed (ISO/IEC 25010:2023)

| Characteristic | How advanced | Decisions |
|---|---|---|
| Functional correctness | Changed sets in the index coordinate system; content served from the target endpoint; immutable SHA keying | D2, D4, D5 |
| Security | Single audited git boundary; injection-proof reference handling; read-only surface; resource bounds | D1, D7-sec (threat model), D6 |
| Performance efficiency | Timeout-bounded git; bounded churn window; lazy + LRU-evicted revision stores; in-query `$in` filter (store-side) | D3, D6, D8 |
| Reliability (maturity/fault tolerance) | Typed sentinels, never-raise boundary, explicit observable degradation on non-git roots | D1, D8 |
| Compatibility (co-existence) | All additions opt-in; default path byte-identical; working-tree index untouched by history | D3, D9, and FR-F1 throughout |
| Maintainability (modularity/reusability) | One git module; one shared chunk/embed pipeline for working + revision content | D1, D9 |
| Portability | No new path assumptions; reuses `cache_dir_for` platform logic; `git` discovered via PATH | D3 |

Quality characteristics the spec does not require (usability, no UI surface here)
are not advanced and are intentionally absent from this table.

## Design decisions

*Knowledge-state baseline (Phase 1–2).* The Clear Thought `metacognitivemonitoring`
tool is not connected in this session (verified — see Limitations). Baseline
recorded inline instead: claims about the existing code below are **facts**
verified by Read/Grep against current source with file:line citations; claims
about git CLI behavior are **facts** from stable documented git semantics (git
2.43, `git --version` confirmed present); the ChromaDB `$in` claim is a **fact**
verified via Context7. No claim below rests on unverified memory. Operative bias
to guard: the codebase-mirroring trap (the existing impact analysis is regex/
line-based, which could tempt under-rigor on provenance) — guarded by deriving
D5 from the spec's precision requirement, not from the existing pattern.

*Structured-decomposition attestation (Phase 8).* The `sequentialthinking` tool is
unavailable; the two decisions that meet its trigger criteria (D3 — historical
storage, multiple valid approaches with downstream rework risk; D5 — provenance
granularity, a quality/cost trade-off) carry their decomposition inline in
elements 3–4 below.

---

**D1 — All `git` execution is confined to a single module (`utils/git.py`); no
other module shells out.**
1. *Decision.* One access boundary owns every `git` subprocess; `changeset.py`,
   `revisions.py`, and `provenance.py` consume typed methods, never construct
   command lines.
2. *Standard.* CWE-78 / CWE-88 (a single validated choke point minimizes the
   command/argument-injection surface); least-privilege / single-responsibility.
3. *Why here.* The grep below proves git is executed *nowhere* today, so this
   feature introduces the first subprocess surface in the codebase; concentrating
   it makes SEC-1..SEC-4 verifiable by reading one file rather than auditing every
   call site.
4. *NOT, and why.* NOT per-service subprocess calls (each new call site is a new
   place to forget shell-safety or ref-validation — the exact multiplication the
   Goal names as the trap). NOT a generic "run git" helper taking arbitrary args
   (re-opens the injection surface the module exists to close; also the spec's
   out-of-scope "no passthrough" rule).
5. *Premise verification.* Grep for `subprocess|Popen|os\.system|check_output|run\(`
   over `mcp-server-python/*.py` returned only `server.py:441: mcp.run()`; the
   `\bgit\b` matches resolve to `.git` *paths* (sentinel `paths.py:10–16`,
   exclude-dir `config.py:88`, gitignore loading in `scope.py`). Result:
   no existing git execution — confirmed.
   Addresses: SEC-1, SEC-2, SEC-3.

**D2 — A result's *content* is served from the target endpoint; scoping only
restricts *which* files, never *which snapshot's bytes*.**
1. *Decision.* WORKING target → working-tree Chroma client; `Revision` target →
   that revision's auxiliary client (D3). The `$in` changed-set filter selects
   files; the client selects the snapshot.
2. *Standard.* Spec FR-A2 and locked decision D-5 (content follows target);
   first-principles: an answer about revision R must return R's bytes or it is
   simply wrong.
3. *Why here.* It is the single rule that makes scoping (A) and history (C)
   compose instead of conflict — "files changed between v1.2 and v1.3, searched
   over v1.3's code" is well-defined only if content tracks the target.
4. *NOT, and why.* NOT "filter the working-tree index by the changed paths" for a
   rev-rev diff (returns *current* bytes for files as they were at a past
   revision — the wrong-content bug). NOT a flag the caller sets independently of
   the endpoint (lets caller request incoherent content/scope pairs).
5. *Premise verification.* `query.py:81–99` shows results' `content` comes from
   the queried collection's `documents`; routing the client therefore routes the
   content. Confirmed.
   Addresses: FR-A2, FR-C2, FR-F2.

**D3 — Historical content lives in lazily-built, SHA-keyed, LRU-evicted auxiliary
ChromaDB stores under the project cache dir; never by re-pointing the working
index.**
1. *Decision.* On first query for a target `Revision`, resolve ref→SHA, and if no
   store exists at `cache_dir_for(root)/revisions/<sha>/collections/`, build one by
   streaming the revision's blobs through the shared pipeline (D9); cache via the
   existing per-path client cache; evict LRU past a configured footprint.
2. *Standard.* Spec FR-C3/C4/D-4 (locked: working index untouched, immutable
   identity); CWE-400 (bounded footprint).
3. *Why here (decomposition).* The constraints are: (i) historical bytes from git,
   not disk (D2); (ii) working index unmutated (FR-C3); (iii) a moving ref must
   not return stale content (FR-C4). (i)+(ii) force a *separate* store; (iii)
   forces keying on the resolved commit SHA, not the symbolic ref. Lazy build is
   forced by (ii)+cost — eager indexing of all history is unbounded. LRU+cap is
   forced by CWE-400 once stores accumulate.
4. *NOT, and why.* NOT re-pointing/rebuilding the working-tree collection per
   query (violates FR-C3 and thrashes the watcher's live index). NOT
   `git checkout`/`git worktree` into a temp dir then index from disk (mutates
   disk or needs a second working tree — heavy — and re-introduces a disk read
   path; blob streaming avoids it). NOT keying the store by branch/tag name
   (FR-C4 staleness — two queries a commit apart would collide). NOT unbounded
   accumulation of stores (CWE-400).
5. *Premise verification.* `chroma.py:27–47` `get_client(persist_path)` caches one
   `PersistentClient` per arbitrary absolute path → multiple stores coexist by
   path. `paths.py:80–89` `cache_dir_for` gives the per-project cache base; a
   `revisions/<sha>/` sibling stays inside it (honoring no-writes-into-project).
   Confirmed.
   Addresses: FR-C1, FR-C3, FR-C4, FR-C5, NFR-3, SEC-4.

**D4 — Change sets are computed with `git diff --relative` (or equivalent
rebasing) so paths match the index coordinate system; defaults and range modes per
the endpoint model.**
1. *Decision.* `changeset.py` emits forward-slashed, project-root-relative paths;
   default target=WORKING (uncommitted ∪ untracked-non-ignored); explicit base →
   `base...HEAD` ∪ working; two revisions → diff between them, three-dot default,
   two-dot selectable.
2. *Standard.* Git documented behavior (`git-diff(1)` `--relative`,
   `gitrevisions(7)` two/three-dot, `git-ls-files --others --exclude-standard`);
   spec FR-A3–A6, FR-B2; locked D-1 (no inferred branch).
3. *Why here.* The index stores paths relative to `project_root`, which is *not*
   necessarily the git repo root; `--relative` (run with `-C project_root`) makes
   git emit paths in exactly that frame, so the `$in` filter matches.
4. *NOT, and why.* NOT repo-root-relative paths (the subdirectory case below makes
   them mismatch the index, silently returning empty — spec FR-A3 constraint). NOT
   inferring `main`/`master` as the default base (locked D-1: a guess that can be
   confidently wrong). NOT excluding untracked files (the agent's just-created
   files are indexed and are prime query targets — spec FR-A4).
5. *Premise verification.* `paths.py:24–26` `safe_relative_path =
   normalize_path(os.path.relpath(target, root))` → project-root-relative,
   forward-slashed. `paths.py:48–63` `find_project_root` returns the first ancestor
   containing any of `.git`/`package.json`/`pyproject.toml`/`Cargo.toml`/`go.mod`
   — so a `package.json` subdir under a `.git` root yields project_root ≠ git root.
   The subdirectory mismatch is therefore real, confirming `--relative` is
   load-bearing, not cosmetic.
   Addresses: FR-A1, FR-A3, FR-A4, FR-A5, FR-A6, FR-B1, FR-B2, FR-A7.

**D5 — Add `startLine`/`endLine` to chunk metadata so provenance can be line-level;
degrade to file-level when absent (legacy indexes / non-supporting cases),
always labeled.**
1. *Decision.* Extend `Chunk` and `_build_chunk_metadata` with line ranges; the
   chunker already works over a `lines` list so the ranges are available at
   chunk-construction. Provenance uses `git blame -L start,end` when ranges
   exist, else `git log -1` for the file; each provenance record is labeled with
   the granularity used.
2. *Standard.* Spec FR-D2 (line-level where supported, file-level fallback,
   labeled) and D-3 (precision balanced against cost).
3. *Why here (decomposition / trade-off).* The spec asks for line-level precision;
   the cost is a `git blame` per hit (bounded by `num_results`, D6) plus a chunk
   schema change requiring reindex to populate. File-level-only would satisfy the
   letter weakly but lose the precision the spec calls for; line-level *without*
   storing ranges is impossible (the data isn't there). So the correct resolution
   is to *add the ranges* and degrade gracefully on indexes built before the
   change — which also keeps old caches working without a forced rebuild.
4. *NOT, and why.* NOT file-level only (drops the spec's precision requirement to
   avoid the schema change — the deferred-decision trap dressed as simplicity).
   NOT mandating line-level universally (breaches NFR-2 on large result sets, and
   breaks every pre-existing index that lacks ranges). NOT recomputing line
   numbers from chunk content at query time (the `# File:` header and overlap make
   this lossy — chunker.py:107–135).
5. *Premise verification.* `chunker.py:15–20` `Chunk` has only
   `id/content/index/total_chunks` — no line fields, so line-level provenance has
   no data today (this is spec U-1, now resolved). `indexer.py:132–156`
   `_build_chunk_metadata` is the single metadata construction site to extend.
   Confirmed.
   Addresses: FR-D1, FR-D2.

**D6 — Provenance and churn are post-query annotations, bounded by `num_results`
and a timeout, with a bounded churn window; they never gate results.**
1. *Decision.* Annotate the already-ranked, already-truncated result set; cap git
   calls at the returned-result count; churn reads only a configured recent window.
2. *Standard.* Spec D-2 (report, don't gate), FR-E2 (bounded window); CWE-400;
   NFR-2.
3. *Why here.* Annotating after ranking+truncation bounds the number of `git
   blame`/`git log` calls to at most `num_results` (≤20 per the input cap), making
   the cost predictable; a full-repo blame or unbounded log walk would not.
4. *NOT, and why.* NOT computing provenance/churn before ranking (would run git
   over the whole candidate set, not the ≤20 returned). NOT an unbounded
   `git log` history walk for churn (CWE-400; FR-E2). NOT removing low-provenance
   or low-churn hits (spec D-2 — would corrupt the core search contract).
5. *Premise verification.* `query.py:69–71` bounds `n = min(num_results, count)`,
   and `RagSearchInput.num_results` is `le=20` (server.py:253–258) → annotation
   loop is ≤20 iterations. Confirmed.
   Addresses: FR-D1, FR-E1, FR-E2, FR-E3, NFR-2.

**D7 — `openWorldHint` is set to `True` on both tools; `readOnlyHint` and
`idempotentHint` stay `True`.**
1. *Decision.* Flip `openWorldHint` `False`→`True` on `rag_search` and
   `rag_query_impact`; keep the other two hints.
2. *Standard.* MCP tool annotation semantics (as already used in `server.py`):
   `openWorldHint=False` asserts the tool interacts only with a closed world.
3. *Why here.* Executing the external `git` binary and reading repository state
   beyond the indexed files is, by definition, reaching outside the closed world;
   leaving the hint `False` would be a false assertion to clients. Read-only and
   idempotent still hold — git is queried read-only (D1/SEC-3), and repeated calls
   on an unchanged tree/revision return the same result.
4. *NOT, and why.* NOT leaving `openWorldHint=False` (now inaccurate — annotation
   dishonesty, spec NFR-4). NOT dropping `readOnlyHint` (git access is strictly
   read-only; dropping it would wrongly signal mutation and suppress legitimate
   client optimizations).
5. *Premise verification.* `server.py:290–297` and `363–370` show current
   annotations `readOnlyHint/idempotentHint=True, openWorldHint=False` on both
   tools. Confirmed — this is the exact, located change.
   Addresses: NFR-4. Resolves spec U-2.

**D8 — Degradation is a typed sentinel from `git.py` surfaced as explicit response
status; the boundary never raises and never silently falls through to unscoped
results.**
1. *Decision.* `git.py` returns `None`/"not-a-repo" on absence, timeout, or
   failure; the query layer maps that to an explicit status string ("scoping not
   applied: not a git repository", etc.) and runs the unaugmented query *labelled
   as such*.
2. *Standard.* Spec NFR-1; reliability (fault tolerance) per ISO 25010;
   first-principles: a silent full-tree fallback when the caller asked for
   changed-only is a correctness lie (Goal).
3. *Why here.* Non-git roots are first-class (project detection accepts
   `package.json` etc.), so git-absent is a normal, expected state, not an error
   path — it must produce a truthful, non-throwing response.
4. *NOT, and why.* NOT raising (breaks the tool for a supported project type).
   NOT returning unscoped results as if scoped (the lie). NOT hanging on a slow
   git (NFR-2 — timeout feeds the same sentinel).
5. *Premise verification.* `paths.py:10–16` lists five sentinels incl. non-`.git`
   ones; `find_project_root` (`paths.py:48–63`) returns such roots → git-absent is
   reachable with a valid index. Confirmed.
   Addresses: NFR-1, NFR-2.

**D9 — Revision indexing reuses the existing chunk/embed pipeline via a
content-source seam, rather than a parallel pipeline.**
1. *Decision.* Refactor the disk-reading embed core (`_embed_one_file`) so the
   chunk-from-`(rel_path, content)`-and-embed logic accepts content from disk or a
   git blob; `revisions.py` feeds blob content through the identical path.
2. *Standard.* DRY / single-responsibility; first-principles (comparability): two
   result sets are only comparable if produced by the same chunker, metadata
   extractor, and embedding function.
3. *Why here.* Historical results must rank and read consistently with working
   results (e.g. provenance and similarity over the same embedding space); a
   second pipeline would drift and produce incomparable embeddings.
4. *NOT, and why.* NOT a separate revision chunker/embedder (drift, double
   maintenance, incomparable vectors). NOT writing blobs to a temp dir to reuse
   the disk path verbatim (re-introduces disk I/O and a worktree the design avoids
   per D3).
5. *Premise verification.* `indexer.py:159–198`: `_read_text` reads bytes from
   disk and `_embed_one_file` then chunks/extracts/embeds; the disk read is the
   only origin-specific step — the rest is content-agnostic and extractable.
   Confirmed.
   Addresses: FR-C1 (build path), NFR-3, maintainability.

*Pre-delivery multi-perspective review (Gate A).* The `collaborativereasoning`
tool is unavailable; the three perspectives were applied inline. **Planner:** can
produce file-level steps — each component names its module and the bounded changes
cite exact line ranges (D5/D6/D7/D9); no inline architectural call remains except
the explicitly-deferred numeric defaults. **Reviewer:** every decision is
traceable to a spec requirement and a verified premise; the security surface is one
file (D1). **Stakeholder:** the trade-offs are named — line-level provenance costs
a reindex (D5), history costs disk under a cap (D3), churn/provenance add latency
under a bound (D6). No perspective surfaced an unresolved gap that isn't in
Limitations.

## Threat model

Security is in scope: the layer executes `git` with caller-influenced references
and consumes resources proportional to revision size. Structured as
hypothesis-driven inquiry (the `scientificmethod` tool is unavailable; structure
applied inline).

**T1 — Argument/option injection via an endpoint reference (CWE-88).**
- *Observation.* `base`/`target`/revision refs are caller-supplied and reach a
  `git` argument; the caller is the agent, influenced by repo content it has read.
- *Hypothesis.* A ref value beginning with `-`, or shaped like `--output=PATH`,
  could be parsed by git as an option, enabling file write or disclosure under the
  read-only annotation.
- *Experiment / control.* AC-16: feed crafted option-shaped refs; assert no
  out-of-position file is created and the executed operation set is unchanged.
  Control = `--` terminator + a legal-ref allowlist (SEC-2) confining refs to the
  revision position.
- *Conclusion.* Mitigated by D1+SEC-2; verified by AC-16.

**T2 — Command injection via a shell (CWE-78).**
- *Observation.* Subprocess construction could interpolate refs into a shell.
- *Hypothesis.* Shell metacharacters in a ref could execute arbitrary commands.
- *Experiment / control.* Static check (AC-17) that all execution is list-form,
  no `shell=True`, no string interpolation (SEC-1).
- *Conclusion.* Mitigated by D1+SEC-1.

**T3 — Resource exhaustion via historical indexing (CWE-400).**
- *Observation.* Each distinct target revision can trigger a store build sized to
  that revision's tree; refs are caller-supplied.
- *Hypothesis.* Repeated distinct-revision queries, or one huge revision, exhaust
  disk/CPU.
- *Experiment / control.* AC-15: repeated distinct revisions stay within the
  footprint cap (eviction observed); an over-cap revision degrades per NFR-1.
  Control = lazy build + per-build size/time cap + LRU eviction (D3, SEC-4).
- *Conclusion.* Mitigated by D3+SEC-4.

**T4 — Falsified read-only annotation (trust-boundary integrity).**
- *Observation.* Tools are annotated `readOnlyHint=True`; clients may skip
  confirmation.
- *Hypothesis.* A mutating git subcommand reachable from the query path would
  violate that contract silently.
- *Experiment / control.* AC-17 static inspection: only read-only subcommands
  (diff/log/blame/ls-files/ls-tree/cat-file/archive/rev-parse/merge-base)
  reachable (SEC-3, D1).
- *Conclusion.* Mitigated by D1+SEC-3.

Attackers: a confused/steered agent, or repo content steering it. Targets:
arbitrary file write/disclosure (T1/T2), service availability (T3), the read-only
trust contract (T4). Blast radius: process-privilege file write/disclosure, or DoS
of the RAG — high under the read-only guise, which is why the controls are
boundary-enforced, not advisory.

## ASVS verification mapping (OWASP ASVS v4.0.3)

| ASVS requirement (applicable to this surface) | Addressed by | How |
|---|---|---|
| V5.2.x — sanitize/validate untrusted input used in OS-level operations | D1, SEC-2 (T1) | ref allowlist + `--` terminator confine refs to revision position |
| V5.3.8 / OS command injection avoidance | D1, SEC-1 (T2) | list-form subprocess, no shell, no interpolation |
| V12.3.x — file execution / path; no caller-controlled paths to writes | D1, SEC-3, D3 (T4, T3) | read-only subcommands only; stores under cache dir, not caller path |
| V5.1.x — input bounds (resource) | D3, SEC-4 (T3) | size/time-capped builds, LRU eviction |
| V7.4.x — fail securely; don't leak/over-serve on error | D8 (NFR-1) | typed sentinel → explicit degraded status, never silent fallthrough |

ASVS areas not applicable (no authN/authZ, sessions, or stored credentials in this
read-only local-process surface) are not mapped — attested, not omitted silently.

## Traceability matrix

| Spec req | Addressed by | | Spec req | Addressed by |
|---|---|---|---|---|
| FR-A1 | D4, D2 | | FR-C5 | D3 |
| FR-A2 | D2 | | FR-D1 | D5, D6 |
| FR-A3 | D4 | | FR-D2 | D5, D6 |
| FR-A4 | D4 | | FR-E1 | D6 |
| FR-A5 | D4 | | FR-E2 | D6 |
| FR-A6 | D4, D2 | | FR-E3 | D6 |
| FR-A7 | D4, D8 | | FR-F1 | D7 + opt-in fields (element 5) |
| FR-B1 | D4 | | FR-F2 | D2 |
| FR-B2 | D4 | | NFR-1 | D8 |
| FR-C1 | D3, D9 | | NFR-2 | D6, D8 |
| FR-C2 | D2, D3 | | NFR-3 | D3, D9 |
| FR-C3 | D3 | | NFR-4 | D7 |
| FR-C4 | D3 | | SEC-1..4 | D1, D3 (+ threat model T1–T4) |
| | | | U-1 | resolved in D5; U-2 resolved in D7 |
| | | | U-3, U-4 | deferred to plan (Scope: Deferred) |

Every R/NFR/SEC from the spec is accounted for. U-3 (ref allowlist envelope) and
U-4 (numeric tuning defaults) are explicitly deferred to the plan with reasoning
in Scope.

## Limitations and trade-offs

- **Mandated reasoning/survey tooling unavailable (rigor gap, disclosed).** The
  `/expert-architecture` command mandates Clear Thought MCP tools
  (`metacognitivemonitoring`, `sequentialthinking`, `scientificmethod`,
  `decisionframework`, `structuredargumentation`, `collaborativereasoning`,
  `mentalmodel`) and CodeGraph (`codegraph_*`). Both servers are **not connected**
  in this session (verified via tool search). Per the command's "flag once, then
  comply" provision, the structured reasoning each tool would frame was performed
  and recorded *inline* (knowledge-state baseline, Phase-8 decomposition, Phase-9
  scientific-method threat structure, Gate-A three-persona review), and the
  structural survey CodeGraph would provide was done with Read/Grep against source
  (this is a small Python tree; every cited premise has a file:line). Context7 was
  available and used (ChromaDB `$in`). The residual gap: no automated graph-based
  blast-radius for the bounded changes to `indexer.py`/`query.py`; mitigated by the
  dependents being known and small (those two modules plus the new files).
- **Line-level provenance requires a reindex (trade-off, D5).** Indexes built
  before the `startLine`/`endLine` addition yield only file-level provenance until
  rebuilt. Accepted: graceful, labeled degradation beats a forced global rebuild.
- **Historical search costs disk (trade-off, D3).** Each distinct revision queried
  builds a store; bounded by the footprint cap + LRU, so worst case is repeated
  rebuild/evict churn for thrashing access patterns — acceptable vs. unbounded
  growth or mutating the live index.
- **Provenance/churn add latency (trade-off, D6).** Up to `num_results` git calls
  per annotated search; bounded (≤20) and opt-in, so the default path is unchanged.
- **Change-aware impact over-reports on renames (carried from spec D-6).** Line-
  region extraction sees a rename as add+remove; advisory framing required, not
  fixed here.
- **Numeric defaults unset (deferred, not gap).** Footprint cap, eviction count,
  churn window, git timeout, and the ref allowlist envelope (U-3/U-4) are fixed to
  *exist and be configurable*; their values are the plan's to set.

## Standards governing this architecture

| Standard | Source | What it governed |
|---|---|---|
| Git documented behavior (git 2.43) | `git-diff(1)`, `git-log(1)`, `git-blame(1)`, `git-ls-files(1)`, `git-ls-tree(1)`, `git-cat-file(1)`, `git-rev-parse(1)`, `git-merge-base(1)`, `gitrevisions(7)`, `gitcli(7)` | D4 (change-set/coordinate/range semantics), D3 (revision blobs), D5 (blame), D6 (log/churn), D8 (ref resolution) |
| CWE-78 / CWE-88 | MITRE CWE | D1, SEC-1, SEC-2 (threats T1, T2) |
| CWE-400 | MITRE CWE | D3, SEC-4 (threat T3) |
| OWASP ASVS v4.0.3 | OWASP | ASVS mapping table (V5/V7/V12) → D1, D3, D8 |
| MCP tool annotation semantics | Model Context Protocol spec; `server.py:290–297, 363–370` | D7 (`openWorldHint`) |
| ChromaDB metadata filtering (`$in`) | Context7 `/websites/cookbook_chromadb_dev`, verified this session; schema confirms `$in` over string array, `query()`+`get()` | D2, D4 (the `$in` changed-set filter) |
| ISO/IEC 25010:2023 | ISO | Quality characteristics table → D1–D9 |
| SOLID (SRP/DRY) | engineering consensus | D1 (single boundary), D9 (one pipeline) |
| Project locked decisions | `CLAUDE.md`; `indexer.py:145,192`, `paths.py:24–26,48–63,80–89`, `chroma.py:27–47` | coordinate system (D4), working-tree-mirror (D3), no-writes/cache location (D3), opt-in (D7) |

## Status of this architecture

Passes the Design → Build gate with the disclosed exception that the mandated
Clear Thought and CodeGraph MCP servers were unavailable and their reasoning/survey
performed inline against source (recorded in Limitations). Every non-trivial
decision names a standard or first-principles anchor, states rejected
alternatives, and cites a verified premise; the threat model precedes controls;
the traceability matrix accounts for every spec requirement; U-1 and U-2 are
resolved here, U-3/U-4 explicitly deferred to the plan.

Next: `/expert-plan` — consume this architecture plus the spec to produce
file-level implementation steps (the parameter naming, the numeric defaults, and
the test fixtures are the plan's first work items).
