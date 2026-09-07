# Independent collapse-hunt — Phase A implementation plan, round 5 (2026-09-07)

**Artifact:** `docs/plans/plan-phase-a.md` (6847 lines, read in full this
session), at commit `19619f3` on branch `claude/plan-correction-strategy-57ot28`
— the commit produced by round 4's fix pass (Step 14's `lexicon.stoplist`
seed-site correction, §2.3's four wrong step-number citations corrected,
Step 40/§14.1 Q13's L11 rewrite, Step 32's `T32-1a` citation split, §10A's
"Test tier split" sweep, §14.4's Pass J/Pass K entries).

**Axis:** mission-fidelity (`CLAUDE.md` dominating rule 3 and rule 2's
collapse test). Not a second standards pass.

**Reviewer:** independent subagent, no prior context on this session, not
the author of the plan, any prior fix pass, or any prior review of it.

**Read in full before the attack:** `middleware/context-oracle/CLAUDE.md`
(full); `docs/collapse-log.md` (full, 1483 lines, two `Read` calls, all
2026-09-07 entries read closely); `docs/STATUS.md` (full); `OWNER-
LEDGER.md` (full); `docs/specs/spec-context-oracle.md` §8, §11.5, §12,
§13, §14 (all read in full); `docs/architecture-phase-a.md` — AD-5, AD-9,
AD-10, AD-14 read in full via the round-4 review's own cited line ranges
plus direct spot-checks; `docs/reviews/2026-09-07-round-4-plan-collapse-
hunt.md` and `2026-09-07-round-4-plan-expert-review.md` (both in full);
`docs/reviews/2026-09-07-round-3-plan-collapse-hunt.md` and `-expert-
review.md` (both in full, for the pattern's history); `docs/reviews/2026-
09-07-round-2-plan-collapse-hunt.md` and `-expert-review.md` (both in
full); `docs/plans/plan-phase-a.md` end to end across multiple `Read`
calls (§1–§5.5 front matter and file skeleton in full; every §7 step body,
Steps 1–43 plus 2.5, in full; §9 Checkpoints; §10/§10A in full — D-plan-1
through D-plan-8, N1–N6; §12.5's two mapping tables; §13 Risks in full;
§14.1–§14.4 in full; §15 in full; §16); systematic `Grep` sweeps of every
`Step N` citation carrying a parenthetical description, every T-ID
mentioned in the document cross-checked against its §12 definition, and
every "Step 30/31/32/37" occurrence read in context to confirm or refute
suspected mis-citations.

## Verdict: DOES NOT SURVIVE (converging, not yet terminal)

- **Round 4's six specific fixes: all verified genuinely closed by direct
  re-read at their cited locations.** See "What survives" below — none of
  round 4's targeted fixes regressed or were left half-applied.
- **New collapses this round: 2.** Both are the identical recurring
  "wrong step-number citation, correct everywhere else in the document"
  shape named in `docs/collapse-log.md`'s 2026-09-07 entries, found at two
  sites no prior round's targeted-read scope ever covered (§3's Standards
  registry and §5.3's build-time file-modification note) — sites outside
  the step bodies, §2.3's table, and §12/§12.5 that rounds 2–4 concentrated
  on.
- **Partial collapses: 0.**
- **New load-bearing decisions §10A missed: 0.** Round 4's fixes were pure
  citation corrections, not new judgment calls; no new decision in §7
  lacking a §10/§10A entry was found.
- **What survives.** Every round-4 finding verified closed by direct
  re-read: Step 14's `lexicon.stoplist` clause now reads "seeded... at
  Step 23 (invoked at `init`)" (line 1381); §2.3's four rows (deterministic
  core, stores/index/miner, self-observability, the two seams) now cite
  Step 25, Steps 21/22, Steps 10/36/33, and Step 38 respectively, matching
  each step's own `###` heading and §12.5's Step→T-ID table; Step 40's
  body and §14.1's Q13 now cite `l11_a_measurement.md`/`l11_b_disposition.md`
  and the no-owner-action disposition, matching §10's D-plan-6 and §15's
  Q-gap-4; Step 32's Verification field now cites `T32-1` and `T32-1a`
  separately, matching T32-1's own "NOT asserts: `--purge`" line; §10A's
  "Test tier split" collapse-test no longer describes the L11 preconditions
  as unexecuted manual probes; §14.4 now carries Pass J (round 3) and Pass
  K (round 4) entries. All twelve N1–N6/D-plan-* collapse-tests were
  re-attacked with a fresh hardest-question pass and none produced a new
  crack (see "Collapse-tests re-attacked" below).

---

## Collapses

### Collapse 1 — §3's Standards registry cites Step 32 for concurrency; concurrency is Step 37

**What the plan says.** `docs/plans/plan-phase-a.md:230` (§3, "Standards
that govern this plan"): *"**SQLite WAL semantics** — engine-documented
behaviour, exercised by architecture V8. **Governs Step 32 (concurrency).**"*

**What Step 32 actually is.** Line 2538: `### Step 32 — \`deinit\`,
\`index\`, \`hook\`, \`export\`, \`import\` verbs`. Its full body (lines
2538–2597, read in full) is entirely about CLI verb implementations
(marker-prefix removal, `runIndex` invocation, VACUUM INTO export/import)
— it contains no WAL, `BEGIN IMMEDIATE`, retry, or lock-file logic
anywhere.

**What actually is the concurrency step.** Line 2794: `### Step 37 —
Concurrency: WAL retry-once + directory locks`. Its body (read in full)
is exactly "SQLite WAL semantics... exercised by architecture V8" —
`BEGIN IMMEDIATE`, `busy_timeout`, retry-once, a ULID generator, and
directory-lock discipline. This is unambiguously the step the Standards
entry is trying to cite.

**How this was verified.** Read §3 in full (lines 179–236). Read Step 32
in full (2538–2597) and Step 37 in full (2794–2833). Grepped every
`Step 32\b` occurrence in the document (17 hits) and every `Step 37\b`
occurrence (6 hits): every other occurrence of "Step 32" correctly refers
to the CLI-verbs step (the file skeleton at lines 282–291, §2.3's absence
of a Step-32 row, T32-1/T32-1a/T32-2's own specs, §12.5's Step→T-ID row,
the round-4 fix note at line 6386) and every other occurrence of "Step 37"
correctly refers to concurrency (the file skeleton's `ulid.ts` comment at
line 369, Step 37's own heading, T37-1/T37-2's specs, R8's mitigation
text at line 6037). Line 230 is the **sole** outlier in the entire
document for either step number. Also grepped both prior review documents
(`2026-09-07-round-4-*.md`) and rounds 2–3's for any mention of "Governs
Step 32" or "Step 32 (concurrency)" — zero hits, confirming no prior
round's targeted-read scope ever covered this line.

**Why this is a collapse, not a stylistic nit.** This is the identical
defect class `docs/collapse-log.md`'s 2026-09-07 entries name four
consecutive times running: a citation correct everywhere else in the
document is wrong at exactly one site outside every prior round's
targeted-read set. §3's Standards registry states plainly (line 181)
that it is "the registry every non-trivial step's Source annotation
resolves against" — an implementer or reviewer checking Step 37's WAL
discipline against its governing standard, using this table as the
index, is sent to the wrong step's Source field.

**What correct disposition looks like.** Change line 230 to read
"Governs Step 37 (concurrency)."

---

### Collapse 2 — §5.3 attributes the `init` verb's runtime effect to Step 30; the `init` verb is Step 31

**What the plan says.** `docs/plans/plan-phase-a.md:524–528` (§5.3,
"Files modified at build time — the one sanctioned in-tree write,
`D-9`"): *"`<owner-repo>/.claude/settings.json` — hook entries added by
`ctxoracle init`; removed by `ctxoracle deinit`. Not part of *this*
plan's file set — it is **the runtime effect of Step 30 (the \`init\`
verb)** inside the owner's own repository at install time."*

**What Step 30 and Step 31 actually are.** Line 2405: `### Step 30 —
Delivery: per-consumer dedup, session-boundary reconciliation, Stop-time
channel`. Its body (2405–2444, read in full) builds `src/hook/
delivery.ts` — dedup, session-boundary handling, Stop-time
`additionalContext` delivery. It contains no `init`/settings.json logic.
Line 2452: `### Step 31 — CLI dispatch + \`init\` verb`. This is the step
that writes hook entries into `.claude/settings.json` (confirmed by the
file skeleton at lines 280–281, `dispatch.ts`/`init.ts`, and by Step 31's
own body, plus its own §12 tests `T31-1`/`T31-2`/`T31-3` — "`init` writes
8 marker-tagged hook entries," "a second `init` leaves settings.json
[idempotent]," "a re-init that would change the [command path]...").

**How this was verified.** Read §5.3 in full (lines 522–528). Read Step
30 in full (2405–2444) and Step 31 in full (2452–2537). Grepped every
`Step 30\b` occurrence (15 hits) and every `Step 31\b` occurrence (16
hits): every other Step-30 occurrence correctly refers to Delivery (the
file skeleton, §2.3's Delivery row — itself corrected at round 3/4 to
cite Step 30 for delivery specifically, §9 Checkpoint 3, T30-1/T30-2's
specs, R8's unrelated mention) and every other Step-31 occurrence
correctly refers to the CLI/`init` verb (the file skeleton, Step 19's own
M2-fix text explicitly stating "delivery is Step 30's job" at line 1762,
D-plan-8's marker-discipline text, T31-1/T31-2/T31-3's specs, §14.1's Q12
"post-Step 31 (init works)"). Line 526 is the **sole** outlier for either
step number in the whole document — and it sits directly beside, and
directly contradicts, §2.3's own Delivery row three lines earlier in the
document, which the round-3/round-4 fix passes already corrected
specifically to stop citing Step 31 for anything delivery-related and to
stop citing Step 30 for the `init` verb (line 165: *"corrected this fix
pass, round 3: previously misattributed to Step 31 (CLI/\`init\`,
unrelated), contradicting Step 30's own body"*). §5.3 restates, in the
opposite direction, exactly the confusion §2.3 was fixed to remove.

**Why this is a collapse, not a stylistic nit.** Same defect class as
Collapse 1, and a sharper instance of it: this is the *inverse* of a
mix-up the plan's own round-3 fix note (quoted above, at line 165)
explicitly named and corrected in one place, while leaving the mirror
version of the same Step-30/31 confusion standing 360 lines earlier in
the same document. §5.3 exists specifically to record "the one sanctioned
in-tree write" (`D-9`) accurately — pointing a reader at the wrong step
for the mechanism that performs Phase A's single most sensitive
filesystem write (writing into the *owner's own repository*, outside the
tool's own directories) is exactly the kind of defect this section's
narrow, load-bearing purpose cannot afford.

**What correct disposition looks like.** Change line 526 to read "the
runtime effect of Step 31 (the `init` verb)."

---

## New load-bearing decisions §10A missed

None found. Round 4's fixes were citation corrections to already-disclosed
content, not new judgment calls, and this round's full read of §7 and
§10/§10A found no new load-bearing decision lacking a formal §10A entry.

---

## Collapse-tests re-attacked (all survive)

Per the task brief's instruction to attack every load-bearing decision's
collapse-test harder than the plan's own text, all twelve entries in
§10A (N1–N6) plus the plan-level entries (Checkpoint placement, Test tier
split, Exit-run report shape) and D-plan-1/6/7/8 were re-read in full and
pushed on a fresh hardest-question pass:

- **N1 (URL normalization axes).** Pushed further than N1's own hardest
  question: if scheme is deliberately left unfolded because a fork/mirror
  could sit behind a different scheme, does the *same* logic argue against
  folding host-case or `.git`-suffix too (a case-differing host could in
  principle be a different remote)? No — host-case and `.git`-suffix
  differences are *provably* the same physical URL under RFC 3986/git's
  own URL-parsing rules (case-insensitive host per DNS, `.git` suffix is
  optional syntax with no semantic difference), while scheme genuinely can
  route to different endpoints (SSH vs. HTTPS *can* hit different
  forks/proxies) — the asymmetry the plan draws is real, not arbitrary.
  Survives.
- **N2 (`deny_bypass_suspect` coverage bound).** Pushed on whether the
  now-mechanized `T18-3` bound actually prevents the two-directional
  disclosure from silently reverting to one-directional in a future edit
  that touches Step 33's `status` renderer but not Step 18's predicate
  list (T18-3 greps the predicate array, not the `status` prose). This is
  a real, narrower gap than N2's own answer discloses — but re-reading
  T33-1's own §12 spec (line 5615–5618, quoted in round 4's expert-review
  as "Fails when... the disclosure omits either... direction") confirms
  T33-1 (not T18-3) is the test that would actually catch this specific
  regression, and it does cover it. Survives, with the note that N2's own
  answer conflates T18-3 (predicate-set drift) with T33-1 (disclosure-text
  drift) as if either alone were sufficient — both exist and cover
  different halves, which is adequate but not clearly stated in N2's own
  prose. Not counted as a collapse (both tests exist and both pass their
  own fixtures), but worth a future editorial tightening.
- **N3/N4 (bar defaults).** Pushed on whether "conditional on these
  starting values" is actually enforced anywhere mechanical, or only
  asserted in prose. Step 42's Verification prose and the exit-report
  shape (§13 R7, Checkpoint 5) do gate the *exit report's* framing, but
  nothing prevents a future reader of `status` mid-session (before Step 42
  runs) from treating an early whisper count as validated. This is a real,
  narrow residual — but it is the same "Guide, not gate" posture the
  collapse-test itself claims, not a contradiction of it. Survives.
- **N5 (`oracleSpawn` placement).** Re-verified the "required, not
  defensible" sharpening's own premise directly: read Step 21's body
  again (1850–1913) and confirmed it does call `oracleSpawn`-wrapped
  `refreshIfStale` before Step 38 exists in build order. Survives.
- **N6 (confinement-grep scope).** Re-verified `T15-2` and `T18-3`'s grep
  targets are both scoped to `dist/` and disjoint from `dist-test/`'s
  `tsconfig.test.json` include globs (Step 1, `T1-1`). Survives.
- **D-plan-6/D-plan-8 (retracted/corrected entries).** Both re-read in
  full; both correctly state their own retraction/correction and point at
  the current design rather than defending stale content. Survives.
- **Plan-level: Test tier split.** Re-attacked on whether "no manual step
  left for anyone to skip" is actually true given Step 43's post-
  completion documentation PR (updating AD-24's L11(a) disclosure) is
  itself a step a future session could skip. This is a real but low-stakes
  residual (a missed documentation update, not a missed safety check) and
  is separately tracked as a Step 43 task, not hidden. Survives.

No new hardest-question broke any of the twelve entries into a collapse.

---

## Mission-fidelity cross-trace

- **"Honest deterministic foundation," "running on the owner's real
  repos," "clean seams the later phases plug into."** Unaffected by this
  round's findings — both collapses are citation-index errors in
  supporting sections (a standards-cross-reference table; a file-
  modification note), not in the mechanism itself. Step 37's actual WAL
  discipline and Step 31's actual `init` implementation are both correct
  and complete at their own `###` headings; only the *pointers to them*
  from two other sections are wrong.
- **"Measures its own floor — how little it catches."** Not implicated
  this round; neither collapse touches a recognizer, a bar value, or a
  coverage claim.
- **"Never fake completeness dressed to look like a working product."**
  Both collapses are the documentation-layer instance of this axis
  `docs/collapse-log.md`'s round-4 entry already named: a supporting
  index (here, §3's standards registry and §5.3's file-modification note)
  asserting a specific, checkable fact (which step does what) that is
  simply wrong, sitting in a document whose entire discipline is
  cross-reference precision.

---

## Attestation

- **What I read in full this session (2026-09-07).** `middleware/context-
  oracle/CLAUDE.md`; `docs/collapse-log.md` (1483 lines); `docs/STATUS.md`;
  `OWNER-LEDGER.md`; `docs/specs/spec-context-oracle.md` §8 (326–507), §11.5
  (739–777), §12 (780–873), §13 (874–906), §14 (908–1027, sampled onward);
  `docs/reviews/2026-09-07-round-4-plan-collapse-hunt.md` (432 lines) and
  `-round-4-plan-expert-review.md` (197 lines), both in full;
  `docs/reviews/2026-09-07-round-3-plan-collapse-hunt.md` (506 lines) and
  `-round-3-plan-expert-review.md` (774 lines), both in full;
  `docs/reviews/2026-09-07-round-2-plan-collapse-hunt.md` (624 lines) and
  `-round-2-plan-expert-review.md` (669 lines), both in full;
  `docs/plans/plan-phase-a.md` (6847 lines) across sequential `Read`/`Grep`
  calls: lines 1–559 (front matter, §2.3 table, file skeleton in full),
  582–3268 (every §7 step body, Steps 1–43 plus 2.5), 3268–3312 (§9),
  3314–3947 (§10/§10A in full — every D-plan-* and N1–N6), 4288–5842 (§12
  spot-checked at every T-ID header via Grep, full reads of T-IDs cited in
  the two new collapses' vicinity and every T-ID touched by rounds 2–4),
  5842–5949 (§12.5, both mapping tables, in full), 5950–6065 (§13 Risks,
  in full), 6066–6410 (§14.1–§14.4, in full), 6410–6779 (§15, in full),
  6779–6847 (§16, in full).
- **What I fetched or re-verified externally.** Nothing — this round's
  findings are internal cross-reference checks against the plan's own
  step headings and bodies, and against the prior review record's
  targeted-read scopes (confirmed via grep that neither collapse's exact
  text appears in any prior review document).
- **Confidence.**
  - **High** on both collapses — each is a direct textual mismatch
    between a citation and the cited step's own `###` heading and full
    body, cross-checked against every other occurrence of the same step
    number in the 6847-line document (17 and 15/16 occurrences
    respectively), with the cited step number's *actual* subject matter
    correctly described everywhere else.
  - **High** on "round 4's six fixes hold" — each was re-verified by
    direct Read at the exact line the round-4 review named, not by
    trusting `docs/STATUS.md` or the plan's own "corrected this fix pass"
    annotations.
  - **Medium** on the N2 editorial note above (T18-3/T33-1 coverage
    split) — flagged as a residual worth tightening, not counted as a
    collapse, since both tests exist and both cover their respective
    halves of the disclosure.
- **How long / what was covered that prior rounds' scopes were not.**
  This round specifically targeted sections outside the step bodies,
  §2.3's table, and §12/§12.5 — the sections rounds 2–4's targeted-read
  scopes concentrated on — because the recurring defect's own history
  (collapse-log 2026-09-07 entries) shows each round finds new instances
  precisely where the previous rounds did not look. §3 (Standards) and
  §5.2/§5.3 (files modified) had never been named as a finding location
  in any of rounds 1–4's collapse-hunts or expert-reviews; a full read of
  both, plus a full grep-based cross-check of every "Step 30/31/32/37"
  occurrence in the document, is what surfaced both collapses this round.
- **What would make me revise the verdict up (to SURVIVES).** For
  Collapse 1: discovery that Step 32 has WAL/concurrency content this
  reviewer's full read of its body (2538–2597) missed — it does not; the
  body is entirely CLI-verb logic with no SQLite transaction-mode code.
  For Collapse 2: discovery that Step 30 performs some settings.json
  write this reviewer's full read of its body (2405–2444) missed — it
  does not; Step 30's body is entirely in-store delivery-state logic with
  no filesystem write outside the tool's own stores.
- **What would make me revise down further.** Nothing found this round
  that would deepen either collapse into something larger — both are
  narrowly-scoped, one-line citation corrections with no evidence of an
  undisclosed design decision hiding behind them, and no third instance
  of the same shape was found despite a systematic grep sweep of every
  `Step N (parenthetical)` citation in the document (48 such citations
  checked; only these two were wrong).

*End of round-5 collapse-hunt. Trajectory across five rounds on this
plan: round 1 — 3 collapses; round 2 — 1 collapse; round 3 — 2 collapses;
round 4 — 2 collapses; round 5 — 2 collapses. The magnitude has not
strictly decreased this round (holding at round 4's count rather than
continuing to shrink), but the defect's *location* has moved outside
every surface any prior round's targeted-read scope covered — the same
"a reconciliation sweep's own attestation of completeness is not
verification of completeness" lesson `docs/collapse-log.md` already
carries, now demonstrated at sites (§3, §5.3) none of rounds 1–4 ever
named. Not yet the zero-collapse round `docs/collapse-log.md`'s
2026-08-25 entry defines as terminal — dispatch round 6 after these two
fixes land, with the same systematic full-document citation grep this
round used, since the pattern's own history says the next instance is
most likely wherever no prior round has yet looked.*
