# Branch audit — batch B2, coordinator verification and final verdicts

Batch 2 covers commits 11–17 of `git rev-list --reverse de66831..HEAD`: f182589,
0e457c7, 58a3495, c45e0db, 59cc05c, ef016eb and e20d001. That is the walking
skeleton for Steps 13–39, the gap list G1–G36, and that list's review: 63 units.

The records:
- `2026-09-26-branch-audit-B2.md` — first audit, Fable 5.1, 15 entries.
- `…-B2-second-opinion.md` — Opus 5.5, 10 entries.
- `…-B2-adjudication.md` — a fresh Fable 5.1 on every difference.

Later batches judge their changes against these verdicts.

## What the coordinator checked, and what it showed

- **Mechanical checker on the first audit.** 15 entries, 63 of 63 units covered,
  exit 0.
  - The checker now fetches every web quote and fails any that is not verbatim.
    PDFs are extracted with pdfminer, and text is normalised for tags, entities
    and ligatures.
  - It first failed two quotes in the first audit. Both were invented by
    WebFetch's summariser:
    - the SZZ quote "we search log messages for keywords such as …". The paper's
      real text is "a keyword, if it matches the following regular expression:
      fix(e[ds])?|bugs?|defects?|patch".
    - a hooks-page sentence that is not on the page.
  - The auditor replaced both with the sources' exact words before the file was
    committed (`21c5a52`).
  - A checker bug that the auditor reported was confirmed and fixed. The
    tag-stripper `<[^>]+>` swallowed about 11,800 characters of the hooks page,
    starting at a shell `<<<`. After the fix:
    - the real sentence "Claude reads the reminder on the next model request"
      passes (exit 0);
    - both invented quotes still fail (exit 1);
    - batches 1 and 2 pass.
- **Executed results.** The coordinator re-ran every command the first audit
  cited, with the same outputs:
  - git 2.43.0 `Revert "…"` and `Reapply "…"` subjects, with the trailer
    "This reverts commit <hash>.";
  - `git show f182589 --stat`;
  - the three migrations at 256a446;
  - the `node:sqlite` ExperimentalWarning;
  - web-tree-sitter 0.25.10 `init` and `load` returning `Promise`;
  - STATUS@59cc05c holding no build-method record (grep exit 1);
  - collapse-log@59cc05c "walking skeleton" count 0;
  - no batch-2 commit touching the plan.
- **The second opinion's quotes.** 108 repo quotes and 6 web quotes, all found.
- **The adjudication's quotes.** 124 repo quotes and 13 web quotes. 121 repo
  quotes and all 13 web quotes are exact. The other three are real text but
  imprecisely cited:
  - `indexer.ts@0e457c7:L151-L154` drops the `*` comment markers; it matches
    exactly once the markers are stripped;
  - `skeleton-gap-list-review.md@ef016eb:L755-L756` and
    `spec-context-oracle.md@ef016eb:L925-L926` are one to three lines off; the
    text is found within ±3 lines.

  None is invented, and none changes a ruling.
- **The adjudication's executed claims.** Reproduced by the coordinator:
  - `new DatabaseSync('imp/project.db')` on a missing path creates the file, and
    `PRAGMA quick_check` returns `ok` (Node 22.22.2). The file was 0 bytes in the
    coordinator's run; the adjudicator reported 4096. The finding does not depend
    on the size: an empty store passes the check. `verbs_skeleton.ts@59cc05c`
    imports `openStore` and `copyFileSync`.
  - bash treats a newline and `&` as command separators: `bash -c` printed one,
    two and three for a newline- and `&`-separated list.
  - Hooks page, fetched 2026-09-28. The PreToolUse row contains "String added to
    Claude's context alongside the tool result" (exit 0). "preserved even if that
    tool call later fails" is not on the page (exit 1).

## Corrections to the first audit's own text

These are recorded here because a review file is never edited:
- **E-10** attributes "Context string injected once before the next model call"
  to the PreToolUse table. It is in the PostToolBatch table. The PreToolUse row
  reads "String added to Claude's context alongside the tool result". The
  conclusion (the model reads it after the tool runs) holds.
- **E-14** says "alongside the tool result" is not on the page. That is false: it
  is at page L1799 and L2021. The miss came from the checker's former
  tag-stripping bug.
- **E-13** says the review "could not be faulted at source" and "no better
  alternative". Both overreach: the second opinion and the adjudication verified
  ten defects in the same code that the review missed.

## Final verdicts

| Entry | Final | Basis |
|---|---|---|
| E-1 `cochange.ts` skeleton | **replace** | Adjudicated. The unmarked `rev-parse` catch, the tuning literals, the label-after-exclusion order, and the leading-field drop the plan requires as `miner_unparsed_numstat` all stand. Fixes: `git rev-parse --verify --quiet HEAD` (unborn HEAD exits 1, a non-repo exits 128), and the plan's re-seed-and-record for tuning. G4 falls here and goes to E-2. |
| E-2 log G1–G10 | **replace** | First audit, not second-opinioned. The quote is corrected: G1's keyword list differs from SZZ's real regex in both directions, with no reason given. G4's double-count is recorded here. |
| E-3 Steps 14–15 skeleton | **replace** | Adjudicated. Stand: the bare `statSync` catch (skipping a deleted tracked file is legitimate; catching every error is not); zone-skip plus the over-broad "generated by" marker; cumulative `entry_score`; the FTS/`LIKE` mismatch (widened: unescaped `LIKE`); mixed character/byte spans. The cross-language tries fall and go to E-4. |
| E-4 log G11–G16 | **replace** | First audit. G11 drops AD-3's non-git mode without saying so and has no source; G12's spot check is unrecorded. The cross-language tries land here. |
| E-5 Steps 16–20 skeleton | **replace** | Adjudicated. All six unmarked items stand. Orientation's constants are rooted in AD-14 defining no structural confidence. The noise floor is half-implemented and must land together with E-1's label fix. The newline/`&` separator gap is an AD-15 flaw that Step 17 inherited. |
| E-6 log G17–G25 | **replace** | Adjudicated. The G20 and G24 diagnoses are wrong; G17 understates the literal substitution; G23 and G25 carry no choice, reason or source; G20 suspends FR-X4. |
| E-7 Steps 21–28 skeleton and e2e test | **replace** | Adjudicated. The FR-A6 pinning, fabricated stdin, `process.cwd()` fallback, unaudited AC-8a line, stubs and cwd-relative target all stand. The whisper passes even with the bar deleted (verified from the code). The Stop assertion does not discriminate. The layout side effect is unmarked. `seq` is a marked provisional choice. |
| E-8 log G26–G31 | **replace** | First audit. G29 knowingly ships a wrongful deny; G26's evidence is a private transcript; the recognizer claim has no test. The e2e account correction from E-7 lands here. |
| E-9 Steps 29–36 skeleton | **replace** | Adjudicated and reproduced. Stand: `import --replace` from a directory with no store copies an empty database over the live store; import is not atomic; the fold header claims corrections it does not count; the `invoke.ts` sentence is false. `import` must refuse until it is rebuilt. |
| E-10 log G32–G36 | **replace** | Adjudicated. OL-R5 falls as G36's backing (the OL-C7 over-generalisation). The inclusion rule stands on spec §11.5's population. The PostToolBatch mis-attribution is corrected above. |
| E-11 STATUS@59cc05c | **replace** | First audit. It deletes the build-method record that batch 1 E-15 marked `replace`, and drops the rename-history question; its facts carry no evidence. |
| E-12 STATUS copy-edits@59cc05c | **replace** | Adjudicated; overturns the first audit's keep. h4 deleted the paragraph's only reason and kept its conclusion. This sits inside batch 1 E-16's replace. |
| E-13 the gap-list review file | **keep** | Unanimous. A genuine executed review, written once, unchanged. Its ten missed defects and its OL-R5 gloss go to the correction pass. |
| E-14 STATUS@ef016eb | **replace** | Adjudicated. The counts are 27/9/1. Cite OL-C2. The trigger move to read/search time contradicts FR-A2e and D-26, has no review backing, and is removed. Spec-line finding, widened (below). |
| E-15 STATUS@e20d001 | **replace** | First audit. The CI claim is uncited; the `unshare` item is stated as open when the plan already records it refused. |

Totals: keep 1, replace 14, remove 0, undetermined 0.

## Spec-line finding

§8 FR-O2/C-4 says `PreToolUse` `additionalContext` is "injected before the tool
runs and preserved even if that tool call later fails … (confirmed against the
current hooks reference)". Today's hooks reference says the model reads it on the
next model request, "alongside the tool result". It does not contain "preserved
even if that tool call later fails". FR-A2d and AC-1c ("about to run") rest on the
same premise.

This is an agent-written harness claim in a spec signed without being line-read
(OL-C6). The correction is factual wording with the reference date. It goes to
the correction pass for Max Cogar's sign-off, as every spec change does.

## Correction items this batch adds

These are for the single correction pass after the audit.

1. **Miner (E-1, E-2, E-5).**
   - Use unborn-HEAD-aware `rev-parse`.
   - Apply the tuning re-seed-and-record rule.
   - Count labels before the transaction-size exclusion, with the noise floor
     fully implemented.
   - Record a leading-field drop as `miner_unparsed_numstat`.
   - Source G1's keyword list or replace it with SZZ's regex.
   - Record G4's double-count in the log.
2. **Indexer and search (E-3, E-4).**
   - Catch only ENOENT in `statSync` and fault everything else.
   - Make the generated-file marker anchored to comments.
   - Recompute `entry_score`, not accumulate it.
   - Use one tokenizer, and escape `LIKE`.
   - Use one span unit.
   - Name the cross-language tries and the non-git mode as decisions, with
     backing.
3. **Architecture AD-15 and plan Step 17 (E-5).** Treat newline and `&` as
   command separators.
4. **AD-14 (E-5, E-6).** Define structural-fact confidence or state the gap; no
   silent constants; FR-X4 is not suspended.
5. **Hook handler (E-7).**
   - Fault unreadable stdin; never fabricate an event.
   - No `process.cwd()` fallback.
   - Write the audit row before emitting.
   - Resolve the target against the repo root.
   - The e2e test enforces FR-A6 and a discriminating Stop assertion.
6. **Import (E-9).**
   - Open the source read-only and require it to exist.
   - Validate both files before writing anything.
   - Use the backup API; make it all-or-nothing.
   - Until then, `import` refuses.
7. **Fold (E-9).** The header states what is counted.
8. **Gap-list record (E-2, E-4, E-6, E-8, E-10).** Every gap carries a decision,
   a reason and a source; the run records carry commands and outputs. G36 is
   re-backed on spec §11.5.
9. **STATUS records (E-11, E-12, E-14, E-15).**
   - Restore the build-method record (as batch 1 E-15 corrected it).
   - Restore the rename-history question as an open engineering item.
   - Correct the review counts.
   - Remove the unbacked trigger move.
   - Cite CI runs; fix the `unshare` item.
10. **Spec §8 FR-O2/C-4, FR-A2d, AC-1c.** The factual wording correction above.

## Questions for Max Cogar

None new from this batch. A conditional one exists: if a later pass proposes
moving the Warning trigger from the edit (FR-A2e, D-26) to first read or search,
that changes a spec requirement he signed, and it goes to him with the hooks
evidence before any line changes.
