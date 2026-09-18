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
known review finding addressed and every mechanical gate green. The one seam
that drove rounds 6–10 — how the co-change miner reads paths and renames from
`git log --numstat` — is now resolved at the root by switching to `-z`; the plan
awaits the round-11 confirming pass.**

Trajectory of that seam. Every round attacked a symptom of one underlying
choice: the plan parsed `--numstat` **line-by-line**, which forced it to handle
git's C-quoting of special-byte paths (rounds 6–9: `core.quotePath=false`, then
decode/C-unquote, then a quote-aware tokenizer) and the `old => new` rename
syntax a filename can itself contain. Round 10's two independent passes
(`docs/reviews/2026-09-18-round-10-{expert-review,collapse-hunt}.md`) both
returned NEEDS FIXES on the same Moderate and both pointed past the symptom: a
real file literally named `a => b.txt` (no quote-forcing byte, so unquoted) is
byte-identical in line mode to a rename `a`→`b.txt` — an **irreducible**
ambiguity no decoding removes — and the plan silently guessed it as a rename
while asserting it never guessed.

Rounds 6–9 built ever-more-elaborate machinery *inside* the line-based choice —
`core.quotePath=false`, a C-unquote decoder, then a quote-aware tokenizer, with
probes `24_git_numstat_rename`, `27_git_numstat_quotepath`,
`28_git_numstat_cunquote`, `29_git_numstat_tokenize` — and each round the next
review found a new pathological shape the previous rule mis-keyed. Round 10
showed the last one was irreducible in line mode.

**The root fix (this session): parse with `-z`.** `git log -z --numstat` emits
every path field as **raw bytes** (no C-quoting of any byte, regardless of
`core.quotePath`) and emits a rename as **two separate NUL-delimited fields** —
so there is no path to decode and no rename to guess. A file named `a => b.txt`
is one field, a rename is two, both unambiguous. The `%x00`-header/`-z`-NUL
collision that made the plan avoid `-z` is resolved with a Record-Separator
(`%x1e`) commit delimiter. This **dissolves the whole seam**: the four probes
above and all the decode/tokenizer prose are deleted and replaced by one probe,
`24_git_numstat_z`, and a straight-line parse. Grounded by execution (git 2.43.0,
`core.quotePath` left on): raw fields equal the `readdir` keys, a rename yields
two identities, `a => b.txt` yields one, a binary yields its path. Step 13,
T-13-1, Q56, §11.4, and the Step 6 catalog are refit; `miner_unparsed_numstat` is
now a defensive guard against git output-format drift, exercised by a synthetic
malformed record.

Mechanical gates on the current revision: `derive-plan-sections.mjs --check` (40
steps, 124 test specs, **26 probes cited**, regions current), `--self-check` (34
checks), `run-plan-probes.mjs` (all 26 probes, incl. `24_git_numstat_z`),
`tools/check_docs.py`. PR
[#89](https://github.com/Maxcogar/agent-armory/pull/89).

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

**Next: the round-11 confirming pass.** The `-z` root fix is applied and all
mechanical gates are green, so per the Re-Review Protocol the two independent
passes (expert-review + collapse-hunt) are re-dispatched neutrally over the fix
diff via `.claude/skills/expert-implement/references/review-handoff.md`. If both
return no Moderate-or-above finding, the seam is converged and the plan becomes
the build contract; if a new finding surfaces, it is fixed at the root
(re-derived from grounded git behavior, never patched) and re-reviewed.

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
