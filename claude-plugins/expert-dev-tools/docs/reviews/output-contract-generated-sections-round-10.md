# Expert Review — expert-plan output contract: derived sections become generated

Round 10 absolute; **round 4 of the cycle restarted at the owner-authorized foundational rework**.
Reviewer: independent subagent, 2026-08-09. Persisted by the reviewing agent; persistence is the
only edit this reviewer made to the repository.

## Scope and Inventory

**Round number:** 10 absolute / 4 of the restarted cycle. Prior rounds:
`docs/reviews/output-contract-generated-sections-round-01.md` (F-1..F-10), `-round-02.md`
(G-1..G-5), `-round-03.md` (H-1..H-4), `-round-04.md` (I-1, I-2), `-round-05.md` (J-1..J-4),
`-round-06.md` (K-1..K-5, **both tripwire conditions fired; rework boundary**), `-round-07.md`
(L-1..L-4, restarted-cycle round 1), `-round-08.md` (M-1, M-2, restarted-cycle round 2),
`-round-09.md` (N-1, N-2, N-3, restarted-cycle round 3).

**Cycle status.** The counter restart at the rework boundary was established in the round-07 record
and applied unchanged in rounds 08 and 09. It is applied here too and is not re-litigated. The
restarted cycle now has four rounds, so both consecutive-round tests are fully formable.

**Scope exclusion honored.** The working tree also carries the separate behavioral-remediation
implementation (27 files under the plugin, per `docs/plans/plan-expert-dev-tools-behavioral-remediation.md`
§5), which is a different artifact under its own review. Those files were excluded from the diff
reviewed here. The one place they touch this review is `docs/HANDOFF.md`, whose *changed paragraphs*
are explicitly in this change's scope per the dispatch — finding O-3 is about those paragraphs and
the sentence they were spliced in front of, not about the other thread's files.

### Step 3 tool plan

| Claim type in scope | Instrument | Availability / disposition |
|---|---|---|
| Behavioral ("this input produces that exit code / that diagnostic") | Execution of the shipped script against fixtures constructed in the session scratchpad | Available. ~25 probe runs. **No repository file was ever passed to write mode**; the one write-mode run targeted a scratchpad copy of the fixture (`…/scratchpad/fx/idem.md`). |
| Adversarial probing of `--self-check` itself | Full copies of `skills/expert-plan/scripts/` **and** `references/` into `…/scratchpad/m1/`, `m2/`, `m3/`, then mutation of the copied script | Available. Required because `--self-check` resolves the contract by a hardcoded relative path (`../references/output-contract.md`, script line 410) and takes no operand. |
| **Harness-blindness claims** ("`--self-check` does not assert constraint X") | Deletion of the constraint's enforcement from a **copied** script, then running `--self-check` on the copy — a surviving mutation proves the constraint is unasserted | Available; three such mutations run (m1, m2, m3), all three now correctly fail |
| **Class claims** ("interpretation is indentation-independent; exactly one error per mis-indented line") | Adversarial mis-indentation shapes of my own construction, deliberately chosen *outside* the shapes the suite asserts | Available; 15 constructed shapes (P1–P12, Q1–Q4). This is the instrument behind O-1 and O-2. |
| Literal-content ("line N says Z") | `Read` at the cited file:line at drafting time | Available, used throughout |
| Absence ("the contract/script contains no X") | `grep` over the named file with query and result count recorded | Available; used for the SKILL.md and plan-retrofit checks |
| Structural / blast radius | CodeGraph | Not exercised — the script is a standalone entry point whose only imports are `node:fs`, `node:path`, `node:url` (Read lines 76–78). No finding makes a structural claim. |
| Library behavior | Context7 | **Not needed** — no third-party dependency exists. No library-behavior claim category is in scope, so no Step 3 halt condition arises. |
| Claims imported from prior documents (rounds 1–9, changelog entries 6–15, HANDOFF.md) | Re-derivation with the instrument the underlying claim type requires | Available; all three round-9 dispositions re-derived by execution — none accepted from changelog entry 15 |
| Comment claims inside the artifact (the new `// N-1/N-2 class fix` comment at script lines 184–190) | Re-derivation from executed behavior | Available; used to test that comment's class claim (O-2) |

No instrument class was unavailable for a load-bearing claim category. No rigor waivers — no
compression was requested. Node v22.16.0 present, so the contract's Node-unavailability halt
condition did not arise.

**One provenance limitation, stated rather than hidden.** The script is an *untracked* file, so no
prior revision exists in git to diff against. Where a parser defect's new-versus-pre-existing
provenance cannot be settled by diff, this record says so and relies on the prior rounds' records as
the only witness. The convergence arithmetic below was checked to be **robust to either
classification** before it was relied on.

### Inventory — all four Post-fix sources

| File | Source | Status | Verification |
|---|---|---|---|
| `claude-plugins/expert-dev-tools/skills/expert-plan/scripts/derive-plan-sections.mjs` | fix-diff | [x] | Read 1–581 in full; executed in ~25 probes including three enforcement-deletion mutations on isolated copies; negative-case count now **17** (`--self-check` prints 19 checks: 2 structural + 17 cases) |
| `claude-plugins/expert-dev-tools/skills/expert-plan/scripts/fixtures/valid-plan.md` | fix-diff | [x] | `--check` on a scratchpad copy → exit 0, "2 steps, 3 elements, 2 test specs, regions current"; CRLF copy → exit 0; write-mode idempotency confirmed by md5 before/after (`ef5372cb…` unchanged) |
| `claude-plugins/expert-dev-tools/skills/expert-plan/references/output-contract.md` | prior inventory + fix-diff | [x] | Full `git diff HEAD` against baseline `94a640a` Read; §7 grammar paragraph Read at line 24 |
| `claude-plugins/expert-dev-tools/docs/SKILL-CHANGELOG.md` (entries 6–15) | fix-diff | [x] | `grep -nE '^### [0-9]+ '` → **15** headings; entry 15 Read in full and each of its claims re-derived |
| `claude-plugins/expert-dev-tools/docs/HANDOFF.md` | fix-diff | [x] | Changed paragraphs Read via `git diff HEAD`; lines 75–115 Read in one pass to catch interaction with retained text; trajectory numbers cross-checked against every `plan-behavioral-remediation-round-*.md` verdict line |
| `claude-plugins/expert-dev-tools/skills/expert-plan/SKILL.md` | fix-diff dependent | [x] | `grep -cE "derive-plan-sections\|step-decl\|--self-check"` → **0 hits** (unchanged from rounds 3–9) |
| `claude-plugins/expert-dev-tools/docs/plans/plan-expert-dev-tools-behavioral-remediation.md` | prior inventory | [x] | `grep -cE "step-decl\|generated:"` → **0 hits** — no retrofit; Applicability rule honored |
| `claude-plugins/expert-dev-tools/docs/reviews/output-contract-generated-sections-round-09.md` | prior review record | [x] | Read 1–402 in full |
| `git show 94a640a:…/output-contract.md` (baseline) | prior inventory | [x] | Read via `git diff HEAD` against it |
| N-1, N-2, N-3 as closure items | prior findings | [x] | Each re-derived from current source by execution; dispositions below |

**Fix-diff dependents.** The script has no importers (standalone entry point; Node built-ins only).
The contract's only in-repo dependent is `SKILL.md` (grep above, 0 hits). The fixture's only
consumer is the script's `--self-check`. All covered.

**Procedural observation.** `collaborativereasoning` was again rejected on its first call with a
schema-validation error on the persona `communication.style` / `.tone` enums, and succeeded on the
second call with corrected values. **This is the ninth consecutive round to record this same
infrastructure failure.** The multi-perspective check ran as designed on the successful call, with
the standards-discipline, downstream-consumer, and implementer personas. The implementer persona's
two challenges — that O-1 grades a shape no author writes, and that O-2's branch is out of scope —
were both answered from the artifact's own text rather than by assertion, and both answers are
recorded inside the findings. The implementer's third challenge, that merging the two HANDOFF
defects into one finding conveniently holds the count at three, was answered by noting the merge
makes the tripwire fire *harder* on condition (b), not softer. `metacognitivemonitoring` was invoked
at the evaluation stage, after the verification phase and before any finding was drafted into this
record — stated plainly because the skill places it at review start.

## Summary

**This review returns NEEDS FIXES, and both non-convergence tripwire conditions fire.** All three
round-9 findings were remediated in substance and two close cleanly: the parser was restructured so
that a line's interpretation is decided by its key name alone, round 9's six-diagnostic reproduction
now yields exactly one accurate error, and all three indentation enforcements are now genuinely
guarded — deleting any one of them from a copied script turns `--self-check` red, which is the
property the last two rounds were spent trying to install. What blocks the verdict is that the same
signature the cycle has been chasing reappears one branch over: the contract sentence this change
introduced to *state* the new class guarantee is false for a shape it explicitly enumerates (a
`files:` sub-key at column 0 inside an indented fence produces two errors, not "exactly one"), and
the sub-key ordering branch — untouched by the restructure — still emits diagnostics that are false
about the document, telling an author that three sub-keys are missing when all three are present.
The third finding is the rewritten HANDOFF section, which fixed round 9's stale paragraph but left
the retained sentence beneath it asserting that owner approval and implementation are still to come,
directly contradicting the new paragraph three lines above. **The arithmetic is computed explicitly
below and fires on both conditions; it is robust to any reclassification of the three findings.**

## Upstream Contract Verification

No formal spec or architecture document governs this change. The binding upstream artifacts are the
owner ruling in `docs/HANDOFF.md`, the owner's 2026-08-09 rework authorization, the contract's
stated closure condition, this project's mandatory handoff-writing rule (root `CLAUDE.md`), and
rounds 1–9's findings.

| Upstream requirement | Status | Verification method |
|---|---|---|
| Owner ruling: the drift surfaces "have to be converted, not swept harder" | Honored | The move-together bullet invokes an executable rather than prescribing a manual procedure; verified by running `--self-check` (exit 0, 19 checks) and by three enforcement-deletion mutations on copies |
| Round-6 tripwire routing: foundational rework, not a seventh fix round | Honored (established round 7) | Re-confirmed by Read of script lines 87–399 (pure `processDocument`) and 403–536 (self-check) |
| "a machine-readable step declaration … from which §2, §5 and §12 are generated" | Honored, with disclosed narrowing | §12 is cross-checked rather than generated; narrowing and reason stated in the contract's derived-sections section. Closed at round 2; unchanged. |
| Applicability rule: the in-flight plan is not retrofitted mid-cycle | Honored | `grep -cE "step-decl\|generated:"` over the plan → **0 hits**; HANDOFF's dispatch pin at `94a640a` present and Read |
| Round 9 verdict NEEDS FIXES — all three findings remediated | **Partially met** | N-1 and N-2 close against their originally named standards (dispositions below). N-3's specific stale paragraph is gone, but the handoff-writing rule it was decided under is **still violated at the same location** — reported as O-3, recurring. |
| Contract↔script move-together rule, applied to this change set | Met in mechanism, **violated in content** | The contract's grammar text and the parser were edited together (entry 15 Read; both changes verified present) and `--self-check` exits 0 — but the contract sentence added by that same edit is not true of the script it describes (O-1). The rule's mechanism ran; its purpose did not hold. |
| Handoff-writing rule (root `CLAUDE.md`): a handoff never describes repo state that will be false, and carries no in-flight/pending framing | **Violated** | Two places in the rewritten "What to do" section — see O-3 |

### Round-9 finding dispositions

Each re-derived from current source by execution. Changelog entry 15's claims were treated as author
claims inside the artifact, not as verification.

| # | Disposition | Verification (executed, never accepted from the changelog) |
|---|---|---|
| **N-1** (Moderate, recurring) the new negative case guards the top-level branch, not the sub-key recovery it was raised to guard | **Closed** against its named standard (regression-test discipline) | The correction went further than round 9 asked: rather than re-pointing the one case, the parser was restructured and **three** exact-count cases added — `'un-indented sub-key at column-0 fence'`, `'de-indented sub-key in indented fence'`, `'indented top-level key'` (Read at script lines 512–519). All three verified load-bearing by mutation on isolated full copies of `scripts/` + `references/`: deleting the sub-key indentation enforcement (line 206) → **exit 1**, `negative case 'un-indented sub-key at column-0 fence' did NOT produce the expected error … got: no errors`; deleting the fence-indentation error (line 108) → **exit 1** naming two cases; deleting the top-level indentation enforcement (line 214) → **exit 1** naming its case. Round 9's surviving mutation no longer survives. Shipped `--self-check` → exit 0, **19 checks**. |
| **N-2** (Moderate, new) one under-indented `files:` sub-key produces six diagnostics, five false | **Closed** against its named standard (diagnostic accuracy) | Round 9's exact document shape rebuilt in the scratchpad (`…/fx/P1.md`: column-0 fence, `create: []` at column 0, `  modify: []` and `  delete: []` correct) and run against the shipped script: **one** error, `files sub-key 'create' must be indented under files:`, exit 1. Round 9 measured six. The K-4/L-3 normalization branch at old line 111 is gone (`grep` for the normalization return → 0 hits); interpretation is now keyed on the reserved names `create`/`modify`/`delete` at line 204. Cross-probed: all three sub-keys at column 0 → exactly three errors, one per bad line, none false (`…/fx/P3.md`); a mis-indented sub-key alongside a genuinely unknown key → exactly two errors, both accurate (`…/fx/P12.md`). |
| **N-3** (Moderate, new) the changed HANDOFF paragraph is already false against the repository it describes | **Not closed — recurring as O-3** | The round-4/"in flight" narrative is gone and replaced with dated facts, and the trajectory numbers it now states were verified accurate against every review record (see O-3). But the same standard is violated twice more in the same section: a retained sentence contradicting the new paragraph, and a "when persisted" hedge about a file that exists. Closure requires the named standard to be satisfied at the location; it is not. |

## Critical & Serious Findings

No Critical or Serious findings — the full inventory was Read or Grep-verified per Compliance Gate
B, ~25 executed probes were run against the shipped script and against three mutated copies, and no
violation of Critical or Serious classification was observed. The restructure introduced no
regression in the parser's document-processing behavior: the fixture checks clean on LF and CRLF,
write mode is idempotent (md5 `ef5372cb…` unchanged), `--check` is recognized at a trailing argument
position, and the derived regions are unchanged in content.

## Systemic Patterns

**No systemic patterns.** Verified by the proactive scan below, run before classifying.

The candidate pattern was *"a correction that closes the reported instance while leaving an adjacent
branch of the same site open"* — the shape round 9 flagged as running for four consecutive rounds.
To test it rather than extrapolate, I enumerated the parser's constraint-enforcement sites
(`grep -cE "errors\.push"` over the script → **31** push sites) and constructed adversarial inputs
against every site reachable through the key/sub-key state machine: 15 purpose-built documents
(P1–P12, Q1–Q4) covering column-0 sub-keys in both fence forms, over-indented and tab-indented
sub-keys, indented `files:`, deeply indented top-level keys, whole-block fence mismatch, sub-keys
before `files:`, duplicate sub-keys straddling `files:`, and mis-indentation combined with an
unknown key.

**The result does not support a systemic classification.** Of the 15 shapes, 12 produce exactly one
accurate error per bad line — including every shape round 9's findings were about. Two shapes
(`Q3`/`P4`, `P6`) produce two errors for one bad line, both accurate, and both are instances of the
*same* contract sentence being overstated: that is one finding (O-1), not a pattern. Three shapes
(`P9`, `Q1`, `Q2`) exercise the sub-key ordering branch, which is one code site (`seenSub.clear()`,
line 229): that is one finding (O-2), not a pattern. The class that ran rounds 5–8 — *a contract
sentence asserting a property of the control that is not true of the control* — has **one false
instance this round** (O-1) after two rounds at zero; a single instance is a finding at its site,
and calling it systemic on a return-after-two-clean-rounds would be extrapolation from sample, which
is the Step 8 failure mode.

## Moderate & Minor Findings

### O-1 (Moderate, regression) — the contract sentence introduced to state the new class guarantee is false for a shape it explicitly enumerates

**What the document says.** `references/output-contract.md` line 24, added by this change:
"`create`, `modify`, and `delete` are **reserved sub-key names**: a line's interpretation is decided
by its key name alone, and indentation is checked separately — a mis-indented line (a sub-key at
column 0, a top-level key indented, or any line not carrying the fence's own indentation) **produces
exactly one error naming that line** and never changes how the line or its neighbours parse."

**How that claim was verified.** By execution against the shipped script on two purpose-built
documents. `…/scratchpad/fx/Q3.md` — a fence indented four spaces with one line, `delete: []`,
written at column 0, every other line correct:

```
ERROR: step-decl block at line 13: content line does not carry the fence's indentation: delete: []
ERROR: step-decl at line 13: files sub-key 'delete' must be indented under files:
```

Two errors for one line. The shape is a *sub-key at column 0* — the first item in the sentence's own
enumeration — and simultaneously *a line not carrying the fence's indentation*, the third item; each
clause fires its own error. Reproduced at a second shape (`…/fx/P6.md`, tab-indented fence with
space-indented content): 8 bad lines produce 13 errors, because each of the five top-level keys
draws both a fence-indentation error and a `must not be indented` error. For contrast, `…/fx/Q4.md`
(a *top-level* key at column 0 in an indented fence) produces exactly one error, and the suite's own
three new cases each assert `exactCount` 1 — every shape the harness asserts is a shape where the
sentence holds.

**Standard violated.** **Documentation-as-contract** — a specification sentence must be true of the
implementation it specifies, because it is the only description a plan author reads and an author
who hits a two-error diagnostic on a single line will reasonably conclude they made two mistakes and
hunt for the second. This is the same standard the class of rounds 5–8 was decided under.

**Why this is a regression rather than new.** The sentence did not exist before this change: the
round-9 record quotes the §7 prose in its pre-change form ("followed by indented `create:`,
`modify:`, and `delete:` lines") with no reserved-name clause, and changelog entry 15 states as its
own deliverable that "Contract grammar text states the reserved-name rule." The correction wrote a
new claim about the control that the control does not satisfy — the definition of a regression
introduced by the fix. Note the arithmetic below is unchanged if this is classified new instead.

**What correct implementation looks like.** Two closures are available and the choice is a design
call, not a defect: either (a) narrow the sentence to what the parser does — a mis-indented line
produces one error per indentation rule it violates, all of them accurate, and never changes how the
line or its neighbours parse; or (b) make the parser emit a single merged diagnostic when a line
violates both the fence-indentation rule and the key-position rule, and add a negative case with
`exactCount` 1 for the `Q3` shape. Whichever is chosen, the `Q3` and `P6` shapes need a negative case
asserting the resulting count, or the next revision of this sentence is unguarded exactly as this
one was.

### O-2 (Moderate, new) — the sub-key ordering branch still emits diagnostics that are false about the document

**What the code does.** When a `create:`/`modify:`/`delete:` line appears *before* `files:`, the
parser records it in `seenSub` (line 211), then reaches `files:` and calls `seenSub.clear()` (line
229), discarding the record. The missing-sub-key sweep at lines 237–241 then reports the sub-key
missing — although it is present in the document.

**How that claim was verified.** By execution against the shipped script. `…/scratchpad/fx/Q2.md`
declares all three sub-keys before `files:` and nothing else wrong:

```
ERROR: step-decl at line 11: files sub-key 'create' appears before 'files:'
ERROR: step-decl at line 11: files sub-key 'modify' appears before 'files:'
ERROR: step-decl at line 11: files sub-key 'delete' appears before 'files:'
ERROR: step-decl at line 11: files: block missing sub-key 'create' (declare it explicitly, [] if empty)
ERROR: step-decl at line 11: files: block missing sub-key 'modify' (declare it explicitly, [] if empty)
ERROR: step-decl at line 11: files: block missing sub-key 'delete' (declare it explicitly, [] if empty)
```

The last three are false about the document, and their remedial advice ("declare it explicitly, []
if empty") instructs the author to do the thing they already did. Reproduced with a single misplaced
line (`…/fx/P9.md`): two errors, one false. A second manifestation of the same root cause
(`…/fx/Q1.md`): `create: [a]` before `files:` and `create: []` after produces **only** the ordering
error — the duplicate sub-key is not reported, and the `[a]` entry never reaches the derived files
table. The contract states at line 24 that "an omitted or repeated sub-key is an error, never an
implicit empty"; the repeat is silently accepted and the first declaration's contents are dropped.

**Standard violated.** **Diagnostic accuracy** — the standard K-4, L-3, and N-2 were each decided
under: exactly one accurate error per bad line, no false cascade. The artifact makes the stronger
claim itself, at script lines 184–190: interpretation "is decided by its key name alone … 
Mis-indentation therefore cannot cascade into false unknown-key, unparseable, or missing-key
diagnostics," and changelog entry 15 titles the change "indentation class closed by restructure" and
claims it ends "the four-round adjacent-branch sequence." The comment's narrow claim is true —
verified across all 15 probes, no mis-*indentation* shape produces a false diagnostic. The class
claim around it is not: the false missing-key cascade the comment disclaims is reachable one branch
over, through ordering rather than indentation.

**Provenance, stated honestly.** The script is untracked, so I cannot diff this branch against its
round-9 form to establish whether the restructure introduced the `seenSub.clear()` placement or
inherited it. No prior round reported this branch. It is therefore classified **new**, and the
convergence arithmetic below was checked to hold under either classification.

**What correct implementation looks like.** Do not clear `seenSub` at `files:`; instead record
sub-keys seen before `files:` as satisfying the requirement while still reporting the one ordering
error, so the missing-sub-key sweep sees them and the duplicate check still fires on a genuine
repeat. Guard it with two negative cases in the existing array and shape: the `Q2` document
asserting `exactCount` 3, and the `Q1` document asserting the duplicate-sub-key error.

### O-3 (Moderate, recurring — N-3's standard at N-3's location) — the rewritten HANDOFF section contradicts itself and hedges about a file that exists

**What the document says.** Two defects in `docs/HANDOFF.md`'s "What to do" section, both created by
this change:

1. The new paragraph at lines 84–92 states "**The owner approved the plan's substance 2026-08-09.**
   The plan was then executed in full — 26/26 steps …". The **retained** sentence at lines 106–109,
   unchanged by this diff and now sitting directly beneath the new text, reads "After that, in
   order: owner approval of the plan, then implementation, then re-run the behavioural tier …".
   The section asserts both that owner approval and implementation are done and that they are the
   next two things to do.
2. Line 91–92 refers to "`docs/reviews/implementation-round-01.md` **when persisted**".

**How that claim was verified.** `docs/HANDOFF.md` lines 75–115 Read in a single pass, so the
interaction between changed and retained text is observed rather than inferred; both sentences are
present in the same section, and `git diff HEAD` confirms the first is added by this change and the
second is not. For defect 2, `ls -la docs/reviews/implementation-round-01.md` → a 32997-byte file
dated Aug 9 11:28. The file exists; the hedge is about nothing.

**Standard violated.** This repository's **mandatory handoff-writing rule** (root `CLAUDE.md`): a
handoff is read by an agent whose repository already contains everything the writing session
produced, so it must "never describe repo state that will be false" and must carry no in-flight or
pending framing. Defect 1 guarantees the next reader encounters a direct contradiction and must
guess which half is current; defect 2 is precisely the pending framing the rule names, about an
artifact already on disk.

**Why this is recurring rather than new.** N-3 was raised under this exact standard against this
exact section, and the remediation rewrote the paragraph without reconciling it to the prose it was
spliced into. The standard is not satisfied at the location, so N-3 does not close. This is reported
as one finding rather than two because a single edit to one paragraph block closes both, under one
standard — and because splitting it would make the tripwire fire harder, not softer, so the merge is
not a count-management choice.

**Note on what is *not* wrong here.** Two things in this section were verified correct and should
survive the fix verbatim. The dispatch-pinning paragraph (lines 94–100) is accurate and is the
substantive content of this change. And the trajectory "13 → 13 → 10 → 7 → 9 → 2 → 2 → 3" was
re-derived against every record's verdict line — R1 13, R2 13, R3 10, R4 7, R5 9, R6 2, R7 2, R8 3 —
and is **exactly right**, which is notable given that a hand-maintained number sequence is the drift
class this whole cycle exists to remove.

**What correct implementation looks like.** Delete or rewrite the retained "After that, in order:"
sentence so the section states one timeline — the behavioural-tier re-runs are what remain, and the
approval and implementation steps preceding them are done. Replace "when persisted" with the plain
fact that the record is on disk and its review is under way as of 2026-08-09.

## Tentative Findings

No tentative findings — every finding's premise was verified by executing the shipped script or a
deliberately mutated copy of it against a purpose-built fixture in the session scratchpad with the
exit code and full stderr captured, by `grep` with the query and result count recorded, or by Read
at a cited line at drafting time. No candidate was dropped for want of an instrument. The one
acknowledged gap — git provenance for the untracked script — is recorded inside O-2 and in Scope and
Inventory, and does not make any finding's premise tentative: the defect itself is established by
execution, only its new-versus-pre-existing label rests on the prior records.

## Observations

- **The suite grew from 14 cases to 17** (`--self-check` reports 19 checks: 2 structural + 17
  negative cases). The three added cases are the indentation family; the families rounds 8 and 9
  listed as having zero cases — required-keys, unknown-key, region-marker presence and duplication,
  and the inline-list *form* rule — remain at zero. Recorded as data, not as a finding, on the
  reasoning rounds 8 and 9 applied: the contract's adjacent clause explicitly discloses that
  constraints outside the suite are enforced but not asserted.
- **No regression in the parser's document behavior.** Re-probed at the paths the correction touched:
  fixture `--check` exit 0 on LF and on a CRLF copy; write mode idempotent (md5 `ef5372cb…` before
  and after); `--check` recognized at a trailing argument position; derived region content unchanged.
- **The parser is now lenient about the *amount* of indentation**, accepting a tab-indented or
  four-space-indented sub-key where two spaces is the documented form (`…/fx/P5.md`, `…/fx/P7.md`
  both parse clean). This follows from `/^\s/` at line 203 and is the safe direction — it accepts
  more than the contract's example, never less. No standard violation; recorded so a future round
  does not re-derive it as a defect.
- Three of the parser's document diagnostics remain unstated in the contract and are recorded here
  rather than as findings, on the reasoning rounds 5–9 applied: `duplicate step ID`,
  `empty list entry (stray or trailing comma)`, and `marker '<name>' occurs N times`. Carried
  forward unchanged for a sixth round.
- `SKILL.md` still contains zero references to the script, `step-decl`, or `--self-check` (grep, 0
  hits), unchanged from rounds 3–9.
- Changelog entry 15's claims were independently re-derived. Its N-1/N-2 claims are **accurate**,
  including the self-report that round 9's six-diagnostic reproduction now yields one error. Its N-3
  claim ("rewritten to current fact") is **accurate as to the paragraph it rewrote** and silent on
  the retained sentence it now contradicts — the omission is the substance of O-3, not a false claim.

## What's Actually Good

- **The correction chose restructure over a fourth guard, and the restructure is real.** Round 9
  asked for a one-character index change; the author instead removed the branch whose repeated
  patching produced four rounds of findings, making the K-4/L-3 normalization dead code and deleting
  it. Interpretation is now keyed on reserved names at line 204, which is why 12 of my 15 adversarial
  shapes produce exactly one accurate error per bad line rather than a cascade. **Standard:** the
  correction doctrine's preference for removing a defect class over guarding its instances.
  **Verified by:** 15 constructed mis-indentation documents executed against the shipped script,
  including every shape rounds 7–9 raised findings about.
- **All three indentation enforcements are now mutation-proof, not just present.** Round 8's and
  round 9's findings both took the form "the harness stays green when the enforcement is deleted."
  Three independent enforcement-deletion mutations on isolated copies now each return exit 1 naming
  the specific case that caught them. **Standard:** regression-test discipline. **Verified by:**
  mutations m1 (line 206), m2 (line 108), m3 (line 214), each run through `--self-check` on its own
  full copy of `scripts/` + `references/`.
- **The hand-maintained trajectory in HANDOFF is accurate to the record.** Eight numbers, each
  re-derived from its own review file's verdict line, all eight correct. In a cycle whose founding
  premise is that hand-restated numbers drift, a hand-restated sequence that does not drift is worth
  recording. **Standard:** documentation-as-contract. **Verified by:** `grep` of `^Verdict:` across
  `plan-behavioral-remediation-round-01.md` … `-round-08.md`, compared element by element.
- **The parser's core remains a pure function over its input.** `processDocument` (lines 87–399)
  reads no filesystem and writes none; all I/O is in `main` and in `selfCheck`. That is what made
  every probe in this review a two-line construction and every mutation safely scoped to a copy — a
  testability property, verified by Read of the function boundary and by `--check` provably never
  writing (md5 unchanged across a failing check run).

## Convergence Record

**Round number:** 10 absolute; **round 4 of the restarted cycle** (matches Scope and Inventory).

**Counter basis.** The restart at the rework boundary was established and reasoned in the round-07
record and applied at rounds 08 and 09; it is applied here unchanged. Rounds 1–6 do not contribute
to any consecutive-round test.

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
| R9 | 3 | 3 Moderate — *restarted cycle round 3* |
| **R10** | **3** | **3 Moderate** — *restarted cycle round 4* |

**Flow counts for this round** (provenance classifications from Step 9 are the source):

- **Prior findings closed: 2** — N-1 (regression-test discipline, by three enforcement-deletion
  mutations that each now fail) and N-2 (diagnostic accuracy, by rebuilding round 9's own
  six-diagnostic document and measuring one error). Each closed against its originally named
  standard; each re-derived by execution rather than accepted from changelog entry 15.
- **Recurring: 1** — O-3, N-3's standard at N-3's location. The handoff-writing rule is still
  violated in the same section, so N-3 does not close.
- **New: 1** — O-2.
- **Regressions: 1** — O-1. The contract sentence stating the new class guarantee was added by this
  change and is false for a shape it enumerates; verified by two executed probes.

**Tripwire evaluation — FIRED on BOTH conditions.** Arithmetic shown:

- **Condition (a): new + regression ≥ closed, for two consecutive Post-fix rounds.**
  - **Round 10: 1 new (O-2) + 1 regression (O-1) = 2, against 2 closed (N-1, N-2). 2 ≥ 2 is TRUE.**
  - **Round 9: 2 new + 0 regression = 2, against 2 closed. 2 ≥ 2 is TRUE** — recorded as TRUE in the
    round-09 record's own arithmetic.
  - True at round 9 **and** true at round 10 → **two consecutive rounds. CONDITION (a) FIRES.**
  - *Robustness.* Any reassignment of this round's three findings across new / recurring / regression
    puts at least 2 in the numerator against 2 closed, because only O-3 is classified recurring and
    moving it in only raises the numerator. The condition is TRUE at round 10 under every
    classification, so the firing does not rest on a judgment call.
- **Condition (b): total findings not strictly decreasing, for two consecutive Post-fix rounds.**
  - **Round 10: 3 against round 9's 3. Not a strict decrease → TRUE.**
  - **Round 9: 3 against round 8's 2. Not a strict decrease → TRUE** — recorded as TRUE in the
    round-09 record.
  - True at round 9 **and** true at round 10 → **two consecutive rounds. CONDITION (b) FIRES.**

Round 9 recorded that "the margin is now one round on both conditions, so the next round's
arithmetic should be computed before any correction is planned," and both conditions have now closed
that margin. The substantive reading matters and is recorded alongside the arithmetic, because it is
not the simple churn picture: **this round's corrections were the strongest of the cycle.** The
author declined the cheap fix round 9 offered, removed a defect class instead of guarding it, and
produced the first round in which every indentation enforcement survives adversarial mutation. Two
of the three findings are consequences of that ambition rather than of neglect — O-1 exists because
the change wrote a strong general claim into the contract and the claim overreached by one shape,
and O-2 is the same claim's blind spot one branch over. That is the field signature the tripwire is
built to name: the defect is not in any single correction's quality, it is that the site keeps
producing findings because the *model* of how mis-shaped lines should be diagnosed has never been
designed as a whole — it has been extended, branch by branch, for five consecutive rounds (J-3, K-4,
L-3, N-1/N-2, now O-1/O-2).

## Recommended Priority

**Both tripwire conditions fired. The indicated path is foundational rework per Gate 8 — re-read the
sources, re-derive the approach, and do not carry the failed attempt forward. Another fix round is
not the indicated path and recommending one here would be a gate failure.**

The foundational question to re-derive, and it is the one no round has yet answered from first
principles: **what is the complete diagnostic model for a mis-shaped `step-decl` line?** Five rounds
have answered it incrementally — each round taking the branch a reviewer happened to probe and
making that branch emit one accurate error. The result is a parser that is correct on twelve of
fifteen adversarial shapes and a contract sentence that generalizes to all of them. Rework means
deciding, once and in writing, the full cross-product: a line may be mis-indented relative to the
fence, mis-positioned relative to its key class, mis-ordered relative to `files:`, or any
combination — and for each cell, how many errors the author should see and what they should say.
Derive the negative-case list from that table rather than from the last reviewer's probe, and write
the contract sentence from the table rather than from the branch most recently fixed. The three
findings above are then closures that fall out of the design, not three more patches.

Two things should be carried into the rework rather than redone: the reserved-name interpretation
rule (script line 204) is the right foundation and my probes confirm it, and the three
mutation-proof indentation cases are genuine regression guards that the rework should keep and
extend. The `Q1`–`Q4` and `P1`–`P12` documents in this review are already written as the inputs for
the cross-product table.

If the owner instead directs another fix round despite the fired tripwire, that is a workflow-level
accepted-risk decision and belongs in an Open Findings Ledger — it is not a reviewer's call to make,
and this review does not make it.

Verdict: NEEDS FIXES (3 findings: 3 Moderate)
