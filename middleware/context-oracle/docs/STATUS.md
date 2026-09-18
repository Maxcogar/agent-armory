# Context Oracle — status

*Plain-language project status, rewritten each session (not appended). It states
the current state and what to do next; evidence lives in `docs/reviews/`, durable
lessons in `docs/collapse-log.md`, ideas in `docs/IDEAS.md`, and everything
attributed to Max Cogar in `OWNER-LEDGER.md`.*

## The Phase A goal (the north star — read this first)

Phase A is the **honest deterministic foundation, and the measurement of its own
floor.** It stands up the genuinely-deterministic core on Max's real repos — the
stores, the index, the miner, the model-free whisper genres, the deny plumbing,
the self-observability — runs cleanly with no incident, and tells Max the truth
about what that core does and does not do. The spec (§11.5) defines the Phase A
exit as a *measurement*, not a finished feature: it "exits by producing measured
whisper/block, false-fire, and regret data on a real repo — **including how
little the conservative recognizer catches** before Phase B." The deliverable is
honest capability plus honest measurement, with clean seams the later phases plug
into — **never fake completeness dressed to look like a working product.** Judge
every Phase A decision against this goal (`CLAUDE.md` dominating rule 3).

## Where the project stands

The spec (`docs/specs/spec-context-oracle.md`) is signed off (`OL-C6`). The Phase
A architecture (`docs/architecture-phase-a.md`) is reviewed to convergence.

**The Phase A implementation plan (`docs/plans/plan-phase-a.md`) has had every
known review finding addressed and every mechanical gate green. Round 9's two
independent passes split — expert-review PASS, collapse-hunt NEEDS FIXES (1
Moderate, 2 Minor) — and those findings have now been fixed at the root; the
plan is awaiting the round-10 confirming pass.** Trajectory of the one seam that
has driven the recent rounds — the co-change miner's handling of paths git
C-quotes in `--numstat` (backslash / double-quote / tab / newline / control-byte
filenames) and the rename ` => ` that can collide with a filename that contains
one:

- **Round 6 — S1 (Serious, fixed).** Step 13 read `--numstat` path fields
  verbatim, but `core.quotePath` defaults on, so non-ASCII paths (`café.txt`)
  were C-quoted and silently mis-keyed against the indexer's raw-UTF-8 `readdir`
  key. Fixed by running the miner under `core.quotePath=false`.
- **Round 7 — M1 + T1 (fixed).** The residual-quote branch shipped untested; a
  Step 13 prose-order nit.
- **Round 8 — M1, m1, T1, T2 (all now addressed).** Two independent reviews
  (`docs/reviews/2026-09-17-round-8-expert-review.md` and `…-collapse-hunt.md`)
  fired the non-convergence tripwire and demanded the seam be re-derived as **one
  uniform rule** covering every C-quoted shape (a plain path field *and* each
  split rename identity). Findings and how each was closed:
  - **M1 / T1** — T-13-1's "a rename's old or new identity is missing" clause
    contradicted the residual-quote skip. **Closed** by the root fix (commit
    `5bac567`): the miner now **C-unquotes (decodes)** any token beginning with
    `"` back to its raw `readdir` key, so there is no skip clause to contradict.
    Grounded by new executed `probe:28_git_numstat_cunquote` (the C-unquote
    round-trip equals the on-disk `readdir` keys, `invertible: true`).
  - **m1** — T-13-1 planted only the *rename-identity* C-quoted shape. **Closed**
    (commit `cf2d63e`): now also plants a **plain-added** backslash file
    (`u\v.txt`, field `"u\\v.txt"`), so both shapes exercise the uniform rule.
  - **T2** — the fixture's rename-door discrimination silently depended on the
    renames being `git mv` from plain-named sources. **Closed** (`cf2d63e`): the
    Data states it.
- **Round 9 — M1 (Moderate), m2, m3 (Minor), all fixed.** The expert-review
  (`docs/reviews/2026-09-18-round-9-expert-review.md`) returned PASS; the
  collapse-hunt (`…-round-9-collapse-hunt.md`) found the decode rule was
  specified as flat string tests that ignore git's quote structure. Findings and
  the root fix:
  - **M1** — git C-quotes each rename identity independently, so "begins with
    `"`" and "contains ` => `" are not separable discriminators: a single quoted
    path whose *name* holds ` => ` (`"a => b\tc.txt"`) was mis-split into a
    silent bogus co-change pair. **Fixed** by re-deriving Step 13 as
    **quote-aware tokenization** — a ` => ` (or a `{ … => … }` brace group) is a
    rename separator only *outside* a quoted token, so `"a => b\tc.txt"` is one
    path and `"back\\slash.txt" => plainname.txt` is a rename. Grounded by
    executed git 2.43.0 (whenever any identity needs quoting git emits the full
    `"old" => "new"` form, never the brace form) and new
    `probe:29_git_numstat_tokenize`. T-13-1 now plants CASE C and CASE D; the
    self-contradicting "any ` => ` substring" fixture clause is removed.
  - **m2** — the newline C-quoted class was asserted but exercised by nothing.
    **Fixed**: `probe:28_git_numstat_cunquote` now plants `ne\nwl.txt`; T-13-1
    plants a newline plain-add.
  - **m3** — Step 13 equated the C-unquoted *bytes* with the indexer's *string*
    `readdir` key. **Fixed**: Step 13/Q56 state the C-unquoted bytes are
    **UTF-8-decoded to the string key**, and probe 28 compares decoded strings
    (planting a non-ASCII+tab mixed name, `caf\xe9\x09x.txt`).

Mechanical gates on the current revision: `derive-plan-sections.mjs --check` (40
steps, 124 test specs, **29 probes cited**, regions current), `--self-check` (34
checks), `run-plan-probes.mjs` (all 29 probes, incl. `28_git_numstat_cunquote`
and `29_git_numstat_tokenize`), `tools/check_docs.py`. PR
[#89](https://github.com/Maxcogar/agent-armory/pull/89).

**The decode-vs-skip question is resolved, not open.** Earlier rounds framed it
as decode (recover every C-quoted path) vs. skip (record all as
`miner_unparsed_numstat`). The round-9 collapse-hunt showed the real distinction
is finer and settles it: the arrow's meaning is fixed by git's own quote
structure, so **decode** the resolvable paths (a special-byte quoted path, and a
rename whose sides are quoted) and **skip** only the genuinely ambiguous
*fully-unquoted* multi-` => ` field. Uniform skip is wrong — it would drop
resolvable single paths and every rename, gutting the miner's signal; and a flat
decode without quote-aware tokenization silently mis-keys the collision case.
The quote-aware rule is the one correct answer, grounded by execution.

## Session note — enforcement hooks disabled by owner (2026-09-17)

The two repo-root Stop-hook gates (`hooks/stop-completeness-gate/`,
`hooks/stop-instruction-adherence-gate/`) and the context-oracle correction-loop
hooks were **disabled at Max Cogar's explicit request** (commit `9b29353`:
gate scripts short-circuit to `exit 0`; `.claude/settings.local.json` sets
`CORRECTION_LOOP_JUDGE_RUN=1` so the loop's judge/guard/serve stand down). Reason:
all three judges' nested `claude -p` subprocess hung/timed out for hours
(confirmed environmental — disk, proxy, API all healthy; a trivial `claude -p`
timed out with MCP off and stdin closed), failing **closed** by design and
blocking every turn-end. The correction loop's own guard had also locked the
round-8 findings and the settings files while its issue was "active," and the
loop could not advance because its judge could not run. This is the same
session-isolation class of bug already tracked in Open Items below (PR #82). The
disable is a deliberate, owner-authorized operational unblock, not a weakening of
review rigor — the independent-review discipline still applies; it is just no
longer auto-enforced by a broken judge.

## What to do next

**The round-10 confirming pass is running.** The round-9 M1/m2/m3 fixes are
applied and all mechanical gates are green, so per the Re-Review Protocol the
two independent passes (expert-review + collapse-hunt) are re-dispatched
neutrally over the fix diff (`cf2d63e..HEAD`) via
`.claude/skills/expert-implement/references/review-handoff.md`. If both return no
Moderate-or-above finding, the seam is converged and the plan becomes the build
contract; if the collapse-hunt surfaces a new finding, it is fixed at the root
(re-derived from the grounded git behavior, never patched) and re-reviewed.

**Then build** — treat the converged plan as the contract and run
`/expert-implement` against it, Step 1 first (its first act — `npm ci` on the
committed lockfile, then a file importing `web-tree-sitter` compiling and
loading a grammar — re-executes the probes that would catch a non-functional
pin).

The author-gates Gate A/B/C walk on the round-8 fixes was not separately written
this session (the loop that used to require it is disabled); the fixes' coherence
is instead carried by the green mechanical gates and this STATUS. The NFC/NFD
question the earlier author-gates walks flagged remains dispositioned out of scope
for Phase A's Linux target (confirmed by round 7's independent execution).

## Open items

- **The round-3 tentative items, carried forward and still not fully verified on
  the target surface.** Behaviour at the Node 22.16.0 engines floor is executed
  only by CI's matrix entry and the pin runs (`npx node@22.16.0`). Whether
  `unshare -rn` works on the GitHub Actions runner image is still open — the
  optional `09_unshare_no_network.optional` probe is evidence for this container,
  not for the GHA runner. Both settle the first time the build's CI runs.
- **L11(a)** — human-marker presence is measured on interactive transcripts; the
  plan reports it *verified* only when an owner-local interactive transcript is in
  the exit corpus, otherwise *not observed*.
- **L11(b)** — whether `UserPromptSubmit` fires for platform-injected turns is
  undocumented; the plan resolves it by live induction inside the exit run's
  closed-loop leg. Design-safe either way per `AD-9`'s voiding guard.
- **Two real bugs in this repo's own Stop hooks (`hooks/stop-completeness-gate/`,
  `hooks/stop-instruction-adherence-gate/`), outside Context Oracle's scope,
  recorded here once per Max Cogar's explicit instruction.** Both gates spawn
  their judge subprocess (`claude -p`) with `os.environ.copy()` without stripping
  Claude Code's session-identity variables, so the judge attaches to the live
  session and hangs/dies empty; the gates then fail closed. The fix is
  `Maxcogar/agent-armory` PR #82 ("Fix session isolation and transcript pollution
  in both Stop-hook gates"). This session hit exactly that failure for hours (see
  the session note above), which is why the owner disabled the gates. This is not
  a standing practice — future unrelated findings do not belong in this file.
