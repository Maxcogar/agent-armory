# Verification taxonomy

Read this before preflight (Step 2) and use it for every verification in the run — at preflight and at each step's per-claim verification in Step 3.

The governing principle: **verification is not one thing.** The plan makes several kinds of claims, and each kind has an authoritative tool. **A premise verified with the wrong tool is unverified.** Confirming a symbol *exists* with Grep does not confirm what it *does*. Confirming "something like this exists" with semantic search does not confirm the exact symbol the plan named is at the path it named. Match the tool to the claim.

A second principle, specific to tool choice: **structural questions are not existence questions.** A dependency tool answers "what imports what" and "what is the blast radius of changing X." It does not answer "does this symbol exist here" or "does this line say this." Absence claims and literal-content claims need Grep or Read — never a dependency graph, and never semantic search alone.

## Contents

- The claim → tool table
- Per-step premise checklist
- Tool availability and fallbacks (portability)
- Reporting a fallback honestly

## The claim → tool table

| Claim the plan makes | Authoritative tool(s) | Why this tool, not another |
|---|---|---|
| "Symbol X is at `path:line`" / "file P exists" | **Grep** (exact pattern) + **Read** (at the cited line) | Literal bytes at a literal location. Deterministic. Semantic search returns similar names; a dependency graph returns import edges — neither answers "is this exact string here." |
| "X does not exist anywhere in scope Y" | **Grep** across the full scope | Absence claims need an exhaustive literal search. Semantic search can miss exact strings whose embedding does not surface them. |
| "Function returns Z under condition W" / "this handler enforces auth" | **Read** the implementation and trace the logic, or **run a test** | Behavioral claim. The symbol existing does not prove the behavior. Eyes on source, or a test that exercises the path. |
| "Library/framework does Y at version V" | **Current docs for that version** (Context7 or equivalent) | Memory of an API's shape is unreliable, and library behavior changes between versions. The current docs are the source of truth — not the codebase's prior usage of the library. |
| "File A depends on file B" / "this change's blast radius is {…}" | **A structural dependency tool** if the project has one (a code-graph tool, an LSP/editor call hierarchy, etc.); **otherwise Grep-for-imports/references + Read** | Import-graph fact, not text-match fact. Grep finds string occurrences, not import relationships. See the fallback section — the Grep approximation is weaker and must be reported as such. |
| "There is / is not an existing pattern for X" / "this concept already lives somewhere" | **Semantic code search** if available, **paired with Grep**; **otherwise Grep alone** | Semantic search finds conceptually similar code you would not know to grep for; Grep then confirms exact references. Semantic search alone risks false positives; Grep alone risks false negatives for a concept named differently. |
| "Behavior B triggers under condition C" | **Test reproduction**, or run the actual flow and observe | A pure read cannot confirm dynamic behavior. With no test, the claim is tentative until reproduced. |
| "Migration applies cleanly" / "this command runs in this environment" | **Actually run it** (the verification command itself) | Runtime claims need runtime verification. A `--collect-only` or `--dry-run` confirms the command is callable, not that it succeeds. |
| "This matches standard S" (OWASP, RFC, NIST, a framework convention) | **Read the standard's text and compare**; for framework specifics, current docs | Standards live outside the codebase. The codebase is not the source of truth for whether code matches OWASP. |

## Per-step premise checklist

For every step in scope, check the premises it rests on, using the table above:

1. **File and symbol existence.** Existence/path claims → Grep + Read. For new files, confirm the parent directory exists and there is no collision.
2. **Behavioral and contractual claims.** "This function does X" / "this endpoint requires auth" / "this query uses index Y" → Read the implementation, or trace via existing tests. Existence of the symbol is not enough.
3. **Dependency and blast-radius alignment.** For each modified file the plan lists → establish dependents (structural tool, or the fallback below). If a modified file has dependents the plan did not anticipate, that is a preflight finding.
4. **Library and framework claims.** Any "X does Y" about an external library → current docs at the version in use. Cite the library and the doc section.
5. **Existing-pattern claims.** "We will use the pattern from elsewhere" / "this is consistent with module M" → surface the candidate (semantic search if available) and confirm exact references with Grep. If the plan claims a pattern exists and you cannot confirm it, that is a preflight finding.
6. **Verification commands runnable.** For each step's verification entry → confirm the command exists and the environment can run it. A step whose verification cannot be run is not a step you can complete.
7. **Rule alignment.** If the project states non-negotiable rules (in a rules/conventions doc), walk each step against them. A step that violates one is a defect regardless of what the plan says. If the project has no such doc, there is no rule source — the plan's own constraints still bind.

## Tool availability and fallbacks (portability)

This skill runs in any codebase. The tools above are not all present everywhere. Use the best available tool for each claim and degrade explicitly:

- **No structural dependency tool.** Establish dependents by Grep for the symbol's import/reference patterns across the repo, then Read each hit to confirm it is a real dependency (not a comment or a same-named-but-unrelated string). This approximation is **weaker** than a real dependency graph: it can miss dynamic dispatch, re-exports, reflection, and string-based wiring. Treat a clean Grep as "no dependents found by literal search," not "no dependents exist."
- **No semantic code search.** Use Grep alone, with the same honesty: a clean Grep is "no literal references found," not proof the concept is absent. Widen the search terms before concluding absence.
- **Library docs.** Context7 is the default current-docs source. If it is unavailable, use the library's official documentation for the pinned version. Never verify a library claim from memory or from how the codebase currently calls the library.
- **Runtime claims.** There is no portable substitute for execution. If the verification command cannot run for an environmental reason, that is an `ENVIRONMENT-BLOCKED` stop (Step 4), not a claim you may mark verified.

## Reporting a fallback honestly

When you fall back to a weaker tool, say so in the verification entry and in the final report. The point of the taxonomy is not to claim the strongest-sounding verification — it is to make the actual strength of each verification visible. "Blast radius confirmed by literal grep for imports; no structural graph available, so dynamic/reflective dependents could be missed" is a true and useful entry. "Blast radius confirmed" with a Grep behind it and no caveat is the unverified-premise failure wearing a verification's clothes.
