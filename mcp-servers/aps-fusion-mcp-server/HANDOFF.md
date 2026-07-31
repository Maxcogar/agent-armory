# HANDOFF — APS Fusion MCP server rebuild

## Where this stands

Spec and architecture were accepted by owner direction on 2026-07-30 and are unchanged.
**The plan phase is complete as an artifact and incomplete as a gate:** the implementation plan
exists, six independent review rounds have run against it, and every finding from all six is
applied — but **the plan has never returned a PASS, and the non-convergence tripwire fired on
round 6.**

Nothing has been built. `src/` still holds the seven predecessor files; the rebuild has not begun.

## Read these, in order

1. **`docs/plans/plan-aps-fusion-mcp-server.md`** — the plan. 27 steps across 9 phases, 5
   checkpoint gates, 37 tool contracts inline, 47 verification entries, 4 declared gaps, zero open
   register entries. Its §7 preamble and §11 preamble each state a rule about how the document is
   maintained; read both before editing anything, because ignoring them is what produced most of
   the 55 findings.
2. **`docs/reviews/plan-round-01-review.md` … `-06-review.md`** — the full review record with
   per-round findings, dispositions and convergence arithmetic. Round 6 is the only one dispatched
   without author-supplied direction; the first five were steered, so their coverage reflects
   where they were pointed rather than where defects were.
3. **`docs/specs/spec-aps-fusion-mcp-server.md`** and
   **`docs/architectures/architecture-aps-fusion-mcp-server.md`** — unchanged, both accepted.
4. **`docs/aps-mfg-schema.json`** — the introspected MFG schema, 209 types. Authoritative for
   every MFG field, query and mutation. Read it; never recall it.

## The tripwire, and what it is naming

Findings by round: 9 → 10 → 9 → 8 → 8 → 11. Condition (b) fired at round 6 — two consecutive
post-fix rounds without a strict decrease.

Severity moved the other way and stayed there: zero Critical and zero Serious for the last two
rounds, against one Critical in round 3 and five Serious in round 4. **No round has ever found
missing work, a wrong design decision, or a defect in the build order.** All 60 spec requirements
map to steps; the coverage table has re-derived clean in both directions for five consecutive
rounds.

The count rose because one defect *shape* kept reappearing somewhere new: **a hand-maintained
cross-reference or enumeration with no generator, drifting on the next edit.** Ten distinct
locations across six rounds. Each fix round corrected the named instances; the next round found
the class elsewhere. Three of round 5's findings were manufactured by round 4's fixes; three of
round 6's by round 5's.

After round 6 the four surfaces the reviewer named were converted from maintained to derived, and
a fifth (§11's positional references) followed. That work is **unreviewed** — it is the author's
own, and the tripwire fired on exactly the pattern of that author's work being wrong in ways
self-review does not catch.

## What to do next

**Round 7 is the next action.** Dispatch an independent reviewer with the artifact, its upstream
documents, the governing skill files, and the prior-round records — **pointers only.** Do not tell
it where defects cluster, what to check, which instruments to use, or how to judge a prior
decision. That is a contaminated review, and it is why five of six rounds were compromised.

If round 7 also fails to converge, that is the owner's decision point, not the agent's.

## Two things that are the owner's to do

- **The M-3 re-authentication is outstanding.** `~/.aps-fusion-mcp/tokens.json` contains the
  literal string `null` — written there by the predecessor's `clearTokens()`, which nulls the file
  on any non-OK refresh response. Until the browser login is done, S15's two probes and the S26
  acceptance pass cannot run. Everything from S0 through S14 proceeds without it.
- **The spec file's `Status:` line still reads "Draft for review"** while the handoff records it
  as accepted. Governance metadata; no plan step reads it, and it creates no work.

## Method, learned expensively

- **Read the file. Do not script an audit of it.** Every defect in this project was found by
  reading. Scripted checks found none and introduced or concealed several — including one whose
  "verification" hardcoded its own conclusion and confirmed what it was told. Scripts that
  *generate* a derived surface are the fix; scripts that *audit* prose are the problem.
- **A fix note is not evidence of a fix.** Round 5 found a round-4 finding recorded as corrected
  where a third of it had been done. Re-check prior dispositions against source, not against the
  note claiming they are closed.
- **Correct the class, not the instance.** A finding is a symptom. Fixing the named site and
  leaving the class is what produced the fix-generated defects in every post-fix round.
- **Reviewers get pointers, never a checklist.**
