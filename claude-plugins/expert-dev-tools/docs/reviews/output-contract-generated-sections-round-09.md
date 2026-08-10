# Expert Review — expert-plan output contract: derived sections become generated

Round 9 absolute; **round 3 of the cycle restarted at the owner-authorized foundational rework**.
Reviewer: independent subagent, 2026-08-09. Persisted by the reviewing agent; persistence is the
only edit this reviewer made to the repository.

## Scope and Inventory

**Round number:** 9 absolute / 3 of the restarted cycle. Prior rounds:
`docs/reviews/output-contract-generated-sections-round-01.md` (F-1..F-10), `-round-02.md`
(G-1..G-5), `-round-03.md` (H-1..H-4), `-round-04.md` (I-1, I-2), `-round-05.md` (J-1..J-4),
`-round-06.md` (K-1..K-5, **both tripwire conditions fired; rework boundary**), `-round-07.md`
(L-1..L-4, restarted-cycle round 1), `-round-08.md` (M-1, M-2, restarted-cycle round 2).

**Cycle status.** The counter restart at the rework boundary was established in the round-07 record
and applied unchanged in round 08. It is applied here too and is not re-litigated. The restarted
cycle now has three rounds, so both consecutive-round tests are fully formable.

**Scope exclusion honored.** The working tree also carries the separate behavioral-remediation
implementation (27 files under the plugin, per `docs/plans/plan-expert-dev-tools-behavioral-remediation.md`
§5), which is a different artifact under its own review. Those files were excluded from the diff
reviewed here. The one place they touch this review is `docs/HANDOFF.md`, whose *changed paragraphs*
are explicitly in this change's scope per the dispatch — finding N-3 is about those paragraphs, not
about the other thread's files.

### Step 3 tool plan

| Claim type in scope | Instrument | Availability / disposition |
|---|---|---|
| Behavioral ("this input produces that exit code / that diagnostic") | Execution of the shipped script against fixtures constructed in the session scratchpad | Available. ~20 probe runs. **No repository file was ever passed to write mode**; the one write-mode run targeted a scratchpad copy of the fixture (`…/scratchpad/fx/lf.md`). |
| Adversarial probing of `--self-check` itself | Full copies of `skills/expert-plan/scripts/` **and** `references/` into `…/scratchpad/sk/` and `…/scratchpad/sk2/`, then mutation of the copied script | Available. Required because `--self-check` resolves the contract by a hardcoded relative path (`../references/output-contract.md`, script line 402) and takes no operand. |
| **Harness-blindness claims** ("`--self-check` does not assert constraint X") | Deletion of the constraint's enforcement from a **copied** script, then running `--self-check` on the copy — a surviving mutation proves the constraint is unasserted | Available; the instrument behind the M-1 disposition and behind N-1 |
| Literal-content ("line N says Z") | `Read` at the cited file:line at drafting time | Available, used throughout |
| Absence ("the contract/script contains no X") | `grep` over the named file with query and result count recorded | Available; used for the M-2 disposition, N-3, and the SKILL.md / plan-retrofit checks |
| Structural / blast radius | CodeGraph | Not exercised — the script is a standalone entry point whose only imports are `node:fs`, `node:path`, `node:url` (Read lines 76–78). No finding makes a structural claim. |
| Library behavior | Context7 | **Not needed** — no third-party dependency exists. No library-behavior claim category is in scope, so no Step 3 halt condition arises. |
| Claims imported from prior documents (rounds 1–8, changelog entries 6–14, HANDOFF.md) | Re-derivation with the instrument the underlying claim type requires | Available; both round-8 dispositions below were re-derived by execution or grep — none accepted from changelog entry 14 |
| Comment claims inside the artifact (script header; `// J-3`, `// K-4/L-3`, `// K-3`, `// K-2`, `// L-4`, `// M-1` inline comments) | Re-derivation from executed behavior | Available; used to test the `// M-1` comment's claim (N-1) and the K-4/L-3 comment's "exactly one accurate error per bad line" claim (N-2) |

No instrument class was unavailable for a load-bearing claim category. No rigor waivers — no
compression was requested. Node v22.16.0 present, so the contract's Node-unavailability halt
condition did not arise.

### Inventory — all four Post-fix sources

| File | Source | Status | Verification |
|---|---|---|---|
| `claude-plugins/expert-dev-tools/skills/expert-plan/scripts/derive-plan-sections.mjs` | fix-diff | [x] | Read 1–563 in full; negative-case entries counted `grep -cE "^    \['"` → **14** (was 13); indentation cases `grep -nE "^    \['.*indent"` → **1** at line 498 (was 0); executed in ~20 probes including two enforcement-deletion mutations on copies |
| `claude-plugins/expert-dev-tools/skills/expert-plan/scripts/fixtures/valid-plan.md` | fix-diff | [x] | Read in full (69 lines); `--check` on a scratchpad copy → exit 0, "2 steps, 3 elements, 2 test specs, regions current"; CRLF copy → exit 0; write-mode idempotency confirmed by md5 before/after (`ef5372cb…` unchanged) |
| `claude-plugins/expert-dev-tools/skills/expert-plan/references/output-contract.md` | prior inventory + fix-diff | [x] | Full `git diff HEAD` against baseline `94a640a` Read; `grep -nE "thirteen\|fourteen\|fifteen\|sixteen\| cases"` → 2 hits, neither a case count (line 5 "The sixteen output sections"; line 75 the rewritten move-together bullet) |
| `claude-plugins/expert-dev-tools/docs/SKILL-CHANGELOG.md` (entries 6–14) | fix-diff | [x] | `grep -cE '^### [0-9]+ '` → **14** headings; entry 14 Read in full and each of its two claims re-derived |
| `claude-plugins/expert-dev-tools/docs/HANDOFF.md` | fix-diff | [x] | Changed paragraphs Read via `git diff HEAD`; `grep -n "Round 4\|round 5\|in flight"` → lines 84, 87–88; cross-checked against `ls docs/reviews/` |
| `claude-plugins/expert-dev-tools/skills/expert-plan/SKILL.md` | fix-diff dependent | [x] | `grep -cE "derive-plan-sections\|step-decl\|plan-elements\|generated:\|self-check"` → **0 hits** (unchanged from rounds 3–8) |
| `claude-plugins/expert-dev-tools/docs/plans/plan-expert-dev-tools-behavioral-remediation.md` | prior inventory | [x] | `grep -cE "step-decl\|generated:"` → **0 hits** — no retrofit; Applicability rule honored |
| `claude-plugins/expert-dev-tools/docs/reviews/output-contract-generated-sections-round-08.md` | prior review record | [x] | Read 1–429 in full |
| `git show 94a640a:…/output-contract.md` (baseline) | prior inventory | [x] | Read via `git diff HEAD` against it |
| M-1, M-2 as closure items | prior findings | [x] | Each re-derived from current source by execution or grep; dispositions below |

**Fix-diff dependents.** The script has no importers (standalone entry point; Node built-ins only).
The contract's only in-repo dependent is `SKILL.md` (grep above, 0 hits). The fixture's only
consumer is the script's `--self-check`. All covered.

**Procedural observation.** `collaborativereasoning` was again rejected on its first call with a
schema-validation error on the persona `communication.style` / `.tone` enums, and succeeded on the
second call with corrected values. **This is the eighth consecutive round to record this same
infrastructure failure.** The multi-perspective check ran as designed on the successful call, with
the standards-discipline, downstream-consumer, and implementer personas; the implementer persona's
challenge to N-1 ("goalpost-moving") and to N-2 ("this is round 8's Observation") were both answered
by re-deriving the distinguishing premise rather than by assertion, and those distinctions are
recorded inside the findings. `metacognitivemonitoring` was invoked at the evaluation stage, after
the verification phase and before any finding was drafted into this record — stated plainly because
the skill places it at review start.

## Summary

**This review returns NEEDS FIXES.** Both round-8 findings close against their own named standards,
each verified by execution rather than accepted from changelog entry 14: the fence-indentation
constraint now has a negative case, and deleting the indentation check from a copied script now
turns `--self-check` red (it stayed green at 15/15 last round), while the hand-written case count is
gone from the contract with no numeric or spelled replacement anywhere in the file. What blocks the
verdict is that the M-1 correction guards the wrong half of the site it was raised about — round 8
specified a `files:` sub-key case precisely so the guard would cover the sub-key recovery L-3
introduced, and the delivered case de-indents a top-level key instead, so deleting the sub-key
normalization branch still leaves `--self-check` green at exit 0 — plus a false-diagnostic cascade
at the sibling code path (one under-indented sub-key line produces six errors, five of them false
about lines that are well-formed and present), and a changed HANDOFF paragraph that is already false
against the repository it describes. **Neither tripwire condition fires, and the arithmetic is
shown.**

## Upstream Contract Verification

No formal spec or architecture document governs this change. The binding upstream artifacts are the
owner ruling in `docs/HANDOFF.md`, the owner's 2026-08-09 rework authorization, the contract's
stated closure condition, this project's mandatory handoff-writing rule (root `CLAUDE.md`), and
rounds 1–8's findings.

| Upstream requirement | Status | Verification method |
|---|---|---|
| Owner ruling: the drift surfaces "have to be converted, not swept harder" | Honored | The move-together bullet invokes an executable rather than prescribing a manual procedure; verified by running `--self-check` (exit 0, 16 checks) and by two enforcement-deletion mutations on copies |
| Round-6 tripwire routing: foundational rework, not a seventh fix round | Honored (established round 7) | Re-confirmed by Read of script lines 87–391 (pure `processDocument`) and 395–518 (self-check) |
| "a machine-readable step declaration … from which §2, §5 and §12 are generated" | Honored, with disclosed narrowing | §12 is cross-checked rather than generated; narrowing and reason stated at contract line 70. Closed at round 2; unchanged. |
| Applicability rule: the in-flight plan is not retrofitted mid-cycle | Honored | `grep -cE "step-decl\|generated:"` over the plan → **0 hits**; HANDOFF's dispatch pin at `94a640a` present and Read |
| Round 8 verdict NEEDS FIXES — both findings remediated | **Met, with a residue** | M-1 and M-2 both close against their originally named standards (dispositions below). M-1's closure is against *its* standard as stated; the sub-key branch round 8 named as the intended target of the case remains unguarded — reported separately as N-1, not as a failed closure. |
| Contract↔script move-together rule, applied to this change set | Met | The contract's move-together bullet and the parser's case array were edited together (entry 14 Read; both changes verified present); `--self-check` exit 0 |
| Handoff-writing rule (root `CLAUDE.md`): a handoff never describes repo state that will be false, and carries no in-flight/pending framing | **Violated** | The changed paragraph at HANDOFF lines 84–88 — see N-3 |

### Round-8 finding dispositions

Each re-derived from current source by execution or grep. Changelog entry 14's claims were treated
as author claims inside the artifact, not as verification.

| # | Disposition | Verification (executed, never accepted from the changelog) |
|---|---|---|
| **M-1** (Moderate) the fence-indentation constraint has no negative case | **Closed** against its named standard (regression-test discipline) | The `cases` array now carries `['un-indented line in indented fence', …, "does not carry the fence's indentation", 1]` at script line 498 (`grep -nE "^    \['.*indent"` → 1 hit; total cases `grep -cE "^    \['"` → **14**, was 13). Shipped `--self-check` → exit 0, **16 checks**, the new case named in the output. **The adversarial probe round 8 used to raise the finding now inverts:** on a full copy of `scripts/` + `references/` in the scratchpad I deleted the indentation `errors.push` outright (`grep -c "does not carry the fence"` on the mutant → 1, the comment only), and `--self-check` returned **exit 1** with `SELF-CHECK FAIL: negative case 'un-indented line in indented fence' did NOT produce the expected error … got: no errors`. Last round the same mutation returned exit 0 at 15/15. The case also asserts the no-cascade property via the new exact-count field. |
| **M-2** (Minor) the contract states a hand-written count of the script's internals | **Closed** against its named standard (documentation-as-contract) | Contract line 75 now reads "asserts a suite of negative cases spanning the grammar's constraint families — **the suite enumerates itself in `--self-check`'s output, and no count is stated here because a hand-written count is exactly the drift this regime exists to prevent**". Round 8 named deletion of the number as an acceptable closure. Verified absent: `grep -nE "thirteen\|fourteen\|fifteen\|sixteen\| cases"` over the contract → 2 hits, neither a case count (line 5 is the section-count heading "The sixteen output sections", which predates this change and is not an assertion about the script; line 75 is the rewritten sentence itself). The self-enumeration claim is true as written: `--self-check` prints one `ok: negative: <name>` line per case (16 observed). Changelog entry 14's sweep claim ("zero number-words or numeric case counts remain in the contract") re-derived and accurate. |

## Critical & Serious Findings

No Critical or Serious findings — the full inventory was Read or Grep-verified per Compliance Gate
B, ~20 executed probes were run against the shipped script and against two mutated copies, and no
violation of Critical or Serious classification was observed. Round 8 introduced no regression in
the parser's document-processing behavior: the fixture checks clean on LF and CRLF, write mode is
idempotent (md5 unchanged), `--check` is recognized at a trailing argument position, and the
eighteen constraints round 8 walked were spot-re-probed at the paths the corrections touched.

## Systemic Patterns

**No systemic patterns.** Verified by re-running round 8's own proactive scan: I enumerated every
sentence in the contract asserting a property of the derivation control — the §2 parenthetical
(line 16), the coverage-completeness sentence (line 17), the §12 anchor sentence (line 60), the
cross-check sentence (line 70), the `--check` workflow bullet (line 73), the marker-form bullet
(line 74), and the assertions inside the move-together bullet (line 75) — and executed a probe
against each. **All are true as written**, including the two the M-2 correction rewrote. The class
that ran for four consecutive rounds — *a contract sentence asserting a property of the control that
is not true of the control* — has **no false instance for the second consecutive round**.

The three findings below were also scanned as a possible systemic pattern ("a correction that closes
the reported instance without closing the branch it was aimed at"). The scan is recorded rather than
the classification: `grep -cE "^    \['"` → 14 cases against the script's roughly eleven constraint
families, and I mutated the enforcement of two families (fence indentation, sub-key normalization) —
one now guarded, one not. Two data points, one of which is N-1 itself, do not establish a pattern
across the inventory, and extrapolating from them is exactly the Step 8 failure mode. N-1 is
reported as a single Moderate finding at its own site.

## Moderate & Minor Findings

### N-1 (Moderate, recurring — M-1's standard at M-1's location) — the new negative case guards the top-level branch, not the sub-key recovery it was raised to guard

**What the code does.** The case added at script lines 498–501 builds its document as
`VALID.map((l, i) => (i === 1 ? l : '    ' + l))` — index 1 of `VALID` is `covers: [R-1]`, a
**top-level key**. The case therefore exercises the un-indented-top-level-key path only. The
sub-key recovery that round 7's L-3 fix actually introduced — script line 111,
``return /^(create|modify|delete):/.test(t) ? `  ${t}` : t;`` — has no case.

**How that claim was verified.** By mutation, not by reading the case list. On a second full copy of
`scripts/` + `references/` (`…/scratchpad/sk2/`) I replaced line 111 with ``return t;``, removing
the sub-key normalization entirely, and ran `--self-check` on the copy: **exit 0**. All 16 checks
pass with the L-3 fix deleted. (Contrast the M-1 disposition above, where deleting the *indentation
error itself* now correctly turns the suite red — that is the top-level path the delivered case
covers.) The `// K-4/L-3` comment at script lines 98–103 claims the normalization gives "exactly one
accurate error per bad line, top-level and sub-key alike"; the harness asserts the top-level half of
that comment's claim and nothing of the sub-key half.

**Standard violated.** **Regression-test discipline** — the same standard M-1 was decided under: a
defect fixed at a site gets a test that fails before the fix and passes after, so the fix cannot
silently revert. L-3's defect *was* the sub-key half (round 7 measured 3 and 5 diagnostics on
mis-indented `delete:` and `modify:` lines; round 8 measured 1 each after the fix). Round 8's
"What correct implementation looks like" named the shape explicitly: "the case should use a `files:`
sub-key rather than a top-level key, so that it guards the behavior that actually changed."

**Why this is recurring rather than new, and not goalpost-moving.** M-1 as *stated* asked for a case
on the fence-indentation constraint, and one exists — which is why it is recorded closed above. This
finding is the same standard at the same location with a re-derived premise: the branch whose three
consecutive defects motivated the finding is still unguarded, demonstrated by a mutation that
survives. The implementer perspective's challenge on this point was tested against the round-8 text
rather than waved off; the text names the sub-key form as the closure shape.

**What correct implementation looks like.** Change the case's exempted index from `1` to `5`
(`  delete: []`, a `files:` sub-key) or add a second case that does so, asserting the same substring
and `exactCount` 1. Keeping both is better than swapping: the two branches take different code paths
at line 111 and each deserves its own guard.

### N-2 (Moderate, new) — one under-indented `files:` sub-key produces six diagnostics, five of them false

**What the code does.** When a `create:`/`modify:`/`delete:` line is written at the same indentation
as `files:` rather than indented under it, the parser reads it as a top-level key, emits
`unknown key 'create'`, and — critically — sets `inFiles = false` (script line 195), so the
*correctly written* sibling lines that follow become `unparseable line`, and all three sub-keys are
then reported missing.

**How that claim was verified.** By execution against the shipped script on a purpose-built fixture
(`…/scratchpad/fx/a.md`) with a column-0 fence and exactly **one** authoring error — `create: []`
at column 0 instead of two spaces, with `  modify: []` and `  delete: []` correctly written:

```
ERROR: step-decl at line 11: unknown key 'create'
ERROR: step-decl at line 11: unparseable line: modify: []
ERROR: step-decl at line 11: unparseable line: delete: []
ERROR: step-decl at line 11: files: block missing sub-key 'create' …
ERROR: step-decl at line 11: files: block missing sub-key 'modify' …
ERROR: step-decl at line 11: files: block missing sub-key 'delete' …
exit=1
```

Five of the six are false about the document: `modify: []` and `delete: []` are well-formed and are
present, yet are reported both unparseable and missing. Reproduced identically inside an indented
fence (`…/scratchpad/fx/sub.md`, same six errors), confirming the behavior is in the key/sub-key
state machine and not in the fence-indentation recovery.

**Distinguished from round 8's Observation 2.** That observation described a line that was *both*
de-indented and out of position, in a document carrying a second independent defect, and round 8
correctly ruled all its diagnostics accurate. This document has one defect and five provably false
diagnostics.

**Standard violated.** **Diagnostic accuracy** — the standard K-4 and L-3 were both decided under,
and the operative prohibition the `// K-4/L-3` comment states for itself: exactly one accurate error
per bad line, no false cascade. Under-indenting a sub-key by two spaces is at least as likely an
authoring error as de-indenting one out of a fence, and it is the error the contract's own §7 prose
("followed by indented `create:`, `modify:`, and `delete:` lines") invites an author to make.

**What correct implementation looks like.** In the top-level branch, before reporting
`unknown key`, test the key against `create|modify|delete`: if it matches and `files:` has already
been seen, report one error naming the real defect (`'create:' must be indented under 'files:'`) and
leave `inFiles` set, so the siblings parse and the missing-sub-key errors do not fire. Guard it with
a negative case asserting `exactCount` 1, in the same array and the same shape as the existing
entries.

### N-3 (Moderate, new) — the changed HANDOFF paragraph is already false against the repository it describes

**What the document says.** `docs/HANDOFF.md` lines 84–88, part of this change:
"**Round 4 of independent review is done** (2026-08-08) … Verdict NEEDS FIXES, 7 findings; record at
`docs/reviews/plan-behavioral-remediation-round-04.md`. A correction pass applying all seven is in
flight; round 5 follows it."

**How that claim was verified.** `grep -n "Round 4\|round 5\|in flight"` over HANDOFF.md → lines 84,
87, 88, Read at those lines. `ls docs/reviews/` → `plan-behavioral-remediation-round-01.md` through
`-round-08.md` all present. Verdict lines re-derived from the records themselves: round 05 NEEDS
FIXES (9 findings), round 06 (2), round 07 (2), round 08 (3 findings: 1 Systemic, 2 Minor). So the
correction pass described as "in flight" completed four rounds ago, and the "round 5 follows it"
sequence has run through round 8.

**Standard violated.** This repository's **mandatory handoff-writing rule** (root `CLAUDE.md`): a
handoff is read by an agent whose repository already contains everything the writing session
produced, so it must "never describe repo state that will be false" and must carry no in-flight or
pending framing. The paragraph does both — it pins a finding count (7) that four subsequent rounds
have superseded and names a next action (round 5) that is four rounds stale. A next agent reading it
dispatches a redundant round or believes seven findings are open.

**Note on what is *not* wrong here.** The second changed paragraph — the dispatch-pinning rule
("Any further plan-review dispatch cites the output contract by commit … pinned at `94a640a`") — is
correct, is the substantive content of this change, and deliberately names no upper bound on the
changelog entries. It should survive the fix verbatim.

**What correct implementation looks like.** Replace the round-4 narrative with the dated fact and
the current pointer: the review thread has run through round 8, the current record is
`docs/reviews/plan-behavioral-remediation-round-08.md`, and its verdict stands as of 2026-08-09.
State it as a fact about the artifact, not as an instruction about what follows.

## Tentative Findings

No tentative findings — every finding's premise was verified by executing the shipped script or a
deliberately mutated copy of it against a purpose-built fixture in the session scratchpad with the
exit code and full stderr captured, by `grep` with the query and result count recorded, or by Read
at a cited line at drafting time. No candidate was dropped for want of an instrument.

## Observations

- **The suite's family coverage moved by one.** Round 8 measured 13 cases; there are now 14, and the
  newly covered family is fence indentation (top-level branch). The families round 8 listed as
  having zero cases — required-keys, unknown-key, region-marker presence and duplication, and the
  inline-list *form* rule — remain at zero (`grep -cE "^    \['"` → 14; the case names printed by
  `--self-check` enumerate them). Recorded as data, not as a finding, on round 8's reasoning: the
  contract's adjacent clause explicitly discloses that constraints outside the suite are enforced but
  not asserted, so a reader is correctly informed that coverage is partial.
- **No regression in the parser's document behavior.** Re-probed at the paths the round-8 correction
  touched: fixture `--check` exit 0 on LF and on a CRLF copy; write mode idempotent (md5
  `ef5372cb…` before and after); `--check` recognized at a trailing argument position (exit 0); an
  over-indented top-level key (`tests:` written under `files:`) yields three diagnostics, all
  accurate for that document (unparseable line, missing required key, orphan spec).
- Three of the parser's document diagnostics remain unstated in the contract and are recorded here
  rather than as findings, on the reasoning rounds 5–8 applied: `duplicate step ID`,
  `empty list entry (stray or trailing comma)`, and `marker '<name>' occurs N times`. Carried
  forward unchanged for a fifth round.
- **The contract's §12 heading rule is still stricter than the parser, in the safe direction**
  (contract says exactly "Test specifications"; the parser's anchor is case-insensitive). Carried
  forward from round 8 unchanged; no standard violation.
- `SKILL.md` still contains zero references to the script, `step-decl`, `plan-elements`, the
  markers, or `--self-check` (grep, 0 hits), unchanged from rounds 3–8.
- Changelog entry 14's claims were independently re-derived and **both are accurate**, including its
  self-report that the review's own adversarial probe now fails on a scratch copy. This is the second
  consecutive round in which no changelog claim failed re-derivation.

## What's Actually Good

- **M-1's closure was verified the way the finding was raised — by inverting the reviewer's own
  mutation.** The correction did not merely add a case; the case is strong enough that deleting the
  enforcement it guards turns the suite red, which is the property a regression guard exists to have
  and the property round 8 demonstrated was absent. **Standard:** regression-test discipline.
  **Verified by:** enforcement-deletion mutation on a full scratchpad copy — `--self-check` exit 1
  naming the case, against exit 0 at 15/15 for the same mutation last round.
- **M-2 was closed by deleting the unmechanized assertion rather than by hedging it harder.** The
  sentence now states *why* no count appears, which converts a stale-number hazard into a stated
  design rule and leaves the enumeration to the output that is generated anyway. Of round 8's two
  acceptable closures this is the one that adds no new mechanism to maintain. **Standard:**
  documentation-as-contract, in this project's own recorded form (a derived value restated by hand
  drifts). **Verified by:** `grep -nE "thirteen|fourteen|fifteen|sixteen| cases"` over the contract
  (2 hits, neither a case count), Read of contract line 75, and observation of the 16 self-enumerated
  `ok:` lines the sentence now relies on.
- **The parser's core remains a pure function over its input.** `processDocument` (lines 87–391)
  reads no filesystem and writes none; all I/O is in `main` and in `selfCheck`. That is what made
  every probe in this review a two-line construction and every mutation safely scoped to a copy — a
  testability property, verified by Read of the function boundary and by the fact that `--check`
  provably never writes (md5 unchanged across a failing check run).

## Convergence Record

**Round number:** 9 absolute; **round 3 of the restarted cycle** (matches Scope and Inventory).

**Counter basis.** The restart at the rework boundary was established and reasoned in the round-07
record and applied at round 08; it is applied here unchanged. Rounds 1–6 do not contribute to any
consecutive-round test.

**Trajectory (findings by severity, each from that round's mechanical verdict breakdown):**

| Round | Total | Breakdown |
|---|---|---|
| R1 | 10 | 1 Critical, 1 Systemic, 2 Serious, 4 Moderate, 2 Minor |
| R2 | 5 | 1 Systemic, 1 Serious, 1 Moderate, 2 Minor |
| R3 | 4 | 1 Systemic, 1 Serious, 2 Minor |
| R4 | 2 | 1 Systemic, 1 Serious |
| R5 | 4 | 1 Systemic, 3 Minor |
| R6 | 5 | 1 Systemic, 1 Serious, 1 Moderate, 2 Minor — **tripwire fired; rework boundary** |
| R7 | 4 | 1 Systemic, 1 Serious, 2 Moderate — *restarted cycle round 1* |
| R8 | 2 | 1 Moderate, 1 Minor — *restarted cycle round 2* |
| **R9** | **3** | **3 Moderate** — *restarted cycle round 3* |

**Flow counts for this round** (provenance classifications from Step 9 are the source):

- **Prior findings closed: 2** — M-1 (regression-test discipline, by enforcement-deletion mutation
  inverting round 8's own probe) and M-2 (documentation-as-contract, by grep plus Read of the
  rewritten sentence). Each closed against its originally named standard; each re-derived by
  execution or grep rather than accepted from changelog entry 14.
- **Recurring: 1** — N-1, M-1's standard at M-1's location, with a re-derived premise (the sub-key
  branch is unguarded; mutation survives).
- **New: 2** — N-2, N-3.
- **Regressions: 0.** The corrections introduced no defect. Each changed path was re-probed
  specifically (the new case, the rewritten contract sentence, the fixture on LF and CRLF, write-mode
  idempotency, trailing-flag position); all behave correctly. N-2 is pre-existing parser behavior at
  a sibling path, not something round 8 introduced — verified by reading the unchanged
  `inFiles`/top-level branch at lines 194–214, which the round-8 diff does not touch.

**Tripwire evaluation — NOT FIRED on either condition.** Arithmetic shown:

- **Condition (a): new + regression ≥ closed, for two consecutive Post-fix rounds.**
  - **Round 9: 2 new + 0 regression = 2, against 2 closed. 2 ≥ 2 is TRUE.** (Note: N-1 is classified
    recurring, not new, so it does not enter the numerator. Even counted as new, 3 ≥ 2 is also true —
    the condition holds at this round either way, so the classification does not change the result.)
  - **Round 8: 2 new + 0 regression = 2, against 4 closed. 2 ≥ 4 is FALSE.**
  - The condition is true at round 9 and false at round 8, so **no two consecutive rounds satisfy
    it. NOT FIRED** — but this is the first round of the restarted cycle at which it holds, and a
    fourth round satisfying it would fire the tripwire.
- **Condition (b): total findings not strictly decreasing, for two consecutive Post-fix rounds.**
  - Restarted-cycle totals: **R7 = 4 → R8 = 2 → R9 = 3.** Round 9 is 3 against 2, so this round is
    **not** a strict decrease and the condition is TRUE at round 9.
  - Round 8 was 2 against 4, a strict decrease, so the condition is FALSE at round 8.
  - True at round 9, false at round 8 — **no consecutive pair. NOT FIRED**, by one round.

The substantive reading is more cautious than round 8's and should be recorded as such. The
arithmetic does not fire, but both conditions flipped to true simultaneously this round, which is the
first half of the churn signature in both of its forms. What keeps this from reading as churn is the
content: the two closures are real and adversarially verified, there are no regressions, and two of
the three findings (N-2, N-3) are in surfaces the corrections never touched — a parser branch that
predates the whole cycle and a handoff paragraph. Only N-1 is rework producing rework, and it is a
one-character change to an index. The honest caution is that N-1 is the *fourth* consecutive round in
which the fence-indentation site has produced a finding (J-3, K-4, L-3, now N-1), and each time the
correction has closed the reported instance while leaving an adjacent branch of the same site open.

## Recommended Priority

**The tripwire did not fire; the indicated path is one more fix round, not foundational rework.**
Two findings closed against two opened, zero regressions, and every item is a bounded single-site
edit. But the margin is now one round on both conditions, so the next round's arithmetic should be
computed before any correction is planned.

Fix in this order:

1. **N-1** — point the existing negative case at a `files:` sub-key (index 5 rather than index 1), or
   add a second case that does, and re-run the sub-key mutation to confirm it now fails. This is
   first because it is the guard the previous round was supposed to install, and because it is the
   cheapest way to stop this site producing a finding for a fifth consecutive round.
2. **N-2** — close the false cascade at the sub-key/top-level boundary, and add its negative case
   with `exactCount` 1 in the same edit. Doing this second is deliberate: N-1's corrected case is the
   harness that will catch a regression in the N-2 fix.
3. **N-3** — rewrite the stale HANDOFF paragraph as a dated fact, leaving the dispatch-pinning
   paragraph verbatim. Independent of the other two and can be done in any order.

Carried forward from rounds 7 and 8 because it remains true and remains unaddressed, and is not
itself a finding: the four constraint families with no negative case (required keys, unknown keys,
marker presence and duplication, inline-list form) are each a two-line entry in the same array, and
round 8's eighteen executed probes are already written as the inputs.

Verdict: NEEDS FIXES (3 findings: 3 Moderate)
