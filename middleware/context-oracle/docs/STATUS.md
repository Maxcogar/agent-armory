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
A architecture (`docs/architecture-phase-a.md`) is reviewed to convergence, with
`AD-9` rebuilt to the honest Phase A skeleton the spec mandates.

**The Phase A implementation plan (`docs/plans/plan-phase-a.md`) has been
through five review-and-correction rounds plus a hook-enforced correction-loop
pass, and currently passes every mechanical gate this project has for it.**
The round-3/round-4/round-5 cycle (2026-09-07) found and closed the 43
round-3 findings plus round-4's regressions, then stopped at round 5 (the
owner's five-round cap) with a diagnosis and a general fix rather than a
sixth manual round: `docs/collapse-log.md`'s 2026-09-07 entries record that
identifier-reconciliation checking missed build-order and re-derivation
classes reviewers caught by walking the build and executing claims, and that
the fix has to be a mechanical gate general enough to survive the next
document, not another rule for this one.

**That fix extended a mechanism that already existed and was already
mandatory** — the **`expert-plan` skill**'s `scripts/derive-plan-sections.mjs`
(`.claude/skills/expert-plan/`, mirrored into this project's own skill copy
per this file's scope rule), owner-authorized and built 2026-08-09
(ten independent review rounds; `--self-check` was already validating its own
contract before this plan's round 3 even ran). `--check` was extended
2026-09-07 (commit `b453f64`) to add the **build-order check** from
step-declarations (every `provides:`/`depends_on:` edge, every consumed name
actually provided, no step consuming what a later step creates), and
`scripts/run-plan-probes.mjs` (new in that commit) re-executes every probe an
"Evidence" line cites and fails on drift. In the same commit,
`tools/check_plan.py` — a plan-specific, one-off script written during the
round-5 diagnosis session earlier that same day, duplicating ground the
already-mandatory `derive-plan-sections.mjs` should have covered — was
deleted as redundant scope-creep, not "replaced": the general mechanism was
extended to cover its defect classes instead of a second, document-specific
tool being kept beside it. Both scripts run as the `check-plan` CI job in
`.github/workflows/context-oracle-docs.yml`, beside `check-docs`
(`tools/check_docs.py`), on every PR touching this project. Commit `b453f64`
also converted the whole plan to the skill's step-decl grammar.

**Since then, a further collapse-hunt round queued 24 findings (ids `m-1`
through `m-8`, plus earlier `SY-1`/`S-*`/`M-*` series in the same queue) and
processed them one at a time through a hook-enforced correction loop**
(`.claude/hooks/correction-loop/`: `guard.py`/`serve.py`/`judge.py`, wired at
the repo root's `.claude/settings.json`) — the loop serves one finding's full
context, blocks any plan edit until `state/proposal.md` states a disposition
for every unit the finding touches with its deciding spec/architecture
citation, requires the edits to match the proposal exactly, requires a
`state/selfcheck.md` with real gate output and a read-after-edit attestation,
and only then runs its own mechanical judge — which reports pass/fail with no
further detail, by design. **As of commit `b58a05c` (issue m-8, the 24th and
last), the loop reports the queue empty: `state/current.json` no longer
exists and no further issue is served.** The two m-series corrections most
worth recording:

- **m-7** (`hooks_not_firing`'s totally-dead detector flagging the very
  session that installs the tool): took 17 submission rounds under the loop
  before passing. Every earlier round was mechanically correct — five
  rejected/refined technical mechanisms, four independent subagent reviews,
  every diff verified against its true parent commit, every attestation line
  byte-matched — and still failed identically. The actual defect, found on
  round 17 by a fresh background review with zero prior context: the loop's
  own packet requires every disposition in `proposal.md`, changed **or
  unchanged**, to cite "the spec/architecture line (from section 3 or the
  documents) that decides it" — and every submission had instead cited "the
  finding" or "the independent review" (process artifacts, not documents).
  Rewriting every disposition to cite real authority (`AD-17`, `OL-10`,
  `OL-11`, Node's own `fs.Stats` reference) passed on the next round. This is
  now a standing lesson for any future work under this loop or one like it:
  a correction whose grounding cites the review that found it, rather than
  the document that authorizes it, can be mechanically flawless and still
  fail a literal citation requirement — read the packet's own requirements
  section as literally as the plan text itself, on every stuck round, before
  assuming the content is what's wrong.
- **m-8** (Step 28's handler pipeline naming an unexported "path-write
  predicate"): a smaller, one-round fix — `pathWriteTarget(command): string |
  null` factored out of Step 26's `checkDenyBypassSuspect` into an exported
  name, applying the m-7 lesson from the start (every disposition, including
  the 38 "no change" ones, cited real `AD-9`/`AD-6`/document authority).

All three plan gates are green on the current HEAD (`b58a05c`):
`derive-plan-sections.mjs --check`, `run-plan-probes.mjs` (all 17 probes),
and `check_docs.py`.

## What to do next

**No owner question is open.** The correction-loop queue is empty and every
mechanical gate is green; that is a fact this session established, not a
decision. What remains genuinely undecided, and is not this session's to
decide alone, is whether a hook-enforced correction loop clearing 24 queued
findings satisfies this project's own Lifecycle rule — "adversarially
reviewed with all findings applied" — the same way the round-2/round-4/
round-5 collapse-hunt-plus-expert-review pairs did, or whether the pattern
that closed round 2 through round 5 (an independent collapse-hunt **and** a
separate expert-review pass over the *whole* corrected document, not just
the queued findings) should run once more before the plan becomes the build
contract for `/expert-implement`. This session did not run a fresh
whole-document round of either kind after the m-series closed, so it cannot
honestly claim that check has happened. A next session (or Max Cogar) should
decide: accept the correction-loop's mechanical pass as sufficient given its
per-finding rigor, or dispatch one more independent collapse-hunt and
expert-review over the whole current plan before treating it as the build
contract.

## Open items

- No known open defect in `docs/plans/plan-phase-a.md`: all three mechanical
  gates are green and the correction-loop queue is empty. The open item is
  the acceptance decision above, not a known problem in the text.
- The round-3 tentative items carried forward, never re-verified this
  session: behaviour at the Node 22.16.0 floor is executed only by CI's
  matrix entry; whether `unshare -rn` works on the GitHub Actions runner
  image the plan uses (probe `09_unshare_no_network.optional` is marked
  optional for exactly this reason).
- L11(a) — human-marker presence is measured on interactive transcripts; the
  plan reports it *verified* only when an owner-local interactive transcript is
  in the exit corpus, otherwise *not observed*.
- L11(b) — whether `UserPromptSubmit` fires for platform-injected turns is
  undocumented; the plan resolves it by live induction inside the exit run's
  closed-loop leg. Design-safe either way per `AD-9`'s voiding guard.
- **Two real bugs found in this repo's own Stop hooks (`hooks/stop-completeness-gate/`,
  `hooks/stop-instruction-adherence-gate/`), outside Context Oracle's own scope but
  recorded here once so they get seen and fixed:**
  1. **Wrong JSON key from the judge.** `stop-instruction-adherence-gate`'s judge
     is instructed to reply `{"violating": bool, "reason": "..."}`; twice in one
     session it instead replied `{"complete": true, ...}` (the sibling hook's
     schema), so `parse_verdict()` returned `None` and the hook failed closed on
     what was actually a clean "not violating" verdict — self-perpetuating, since
     no self-verification fixes a schema-key mismatch. Evidence and detail:
     `parse_verdict()` at `hooks/stop-instruction-adherence-gate/stop_instruction_adherence_gate.py:351-363`.
  2. **Session isolation / transcript pollution (found independently, likely the
     root cause of #1).** Open PR #82 ("Fix session isolation and transcript
     pollution in both Stop-hook gates") found both hooks' judge subprocesses
     were spawned via `env = os.environ.copy()` without stripping Claude Code's
     own session-identity variables, so a judge call could attach to the live
     calling session and read cross-contaminated content — including, per that
     PR's own verification, one hook's JSON schema leaking into the other's
     judgment, which matches #1 exactly. PR #82 fixes it by stripping
     `CLAUDE_CODE_SESSION_ID` and related vars before every judge call.
  Neither of these is Context Oracle's problem to fix; recorded here once,
  per Max Cogar's explicit instruction, so whoever next works on these hooks
  sees it. This is not a standing practice — future unrelated findings do not
  belong in this file.
