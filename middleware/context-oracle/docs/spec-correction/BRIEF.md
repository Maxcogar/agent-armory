# Spec correction — brief for each correction agent (2026-10-14)

You are correcting the Context Oracle spec against the 2026-09-29 spec-audit finding set.
You did not write the spec or the audit.

## The procedure — read it in full before anything else

`/home/user/agent-armory/claude-plugins/expert-dev-tools/skills/expert-correct/SKILL.md`
is the procedure, and it is the whole of the correction discipline. Follow it exactly:
per finding, identify the section and its sources, re-derive the section from those
sources, sweep the finding's class across the whole artifact, re-read what went stale,
verify the whole record. Patching and re-authoring are both forbidden. Use `Edit`, never
`Write`, on the artifact. Do not edit that skill file or any other tool.

## The artifact

`/home/user/agent-armory/middleware/context-oracle/docs/spec-correction/spec-context-oracle.corrected.md`
— a working copy of `docs/specs/spec-context-oracle.md`. It started byte-identical to the
spec the audit judged (`ec3b057`; all 752 line-numbered spec quotes in the audit files
were checked against it and match). Earlier correction agents may already have edited it:
read their records (below) first, and do not undo their work without a stated reason.
Line numbers in the audit files refer to the ORIGINAL spec
(`docs/specs/spec-context-oracle.md`, unchanged); locate text in the working copy by
content.

Edit only the working copy and your own record file. Never edit `docs/specs/`,
`OWNER-LEDGER.md`, `CLAUDE.md`, `docs/STATUS.md`, `docs/reviews/`, or anything outside
`docs/spec-correction/`. Do not commit; the coordinator commits.

## The finding set

The audit's three parts, each with a first audit, a second opinion and an adjudication, in
`/home/user/agent-armory/middleware/context-oracle/docs/reviews/`:
`2026-09-29-spec-audit-{a,b,c}.md`, `…-second-opinion.md`, `…-adjudication.md`, and the
coordinator verification `2026-09-29-spec-audit-verification.md`.

- An entry's final verdict is the adjudication's where the adjudication rules on it,
  otherwise the first audit's. The correct line is written in the adjudication, or in the
  first audit where no reviewer disputed it.
- The verification's **"Cross-part reconciliation (binding on the correction)"** and its
  **"Errors, recorded"** override any part's text where they differ (e.g. FR-O2's
  "preserved even if the tool call later fails" clause STAYS, cited to changelog 2.1.110;
  part a's E-3 removal of it is overridden).
- The audit's original briefs (`…/779c0f74…/scratchpad/audit/BRIEF.md`, `SPEC-BRIEF.md`)
  no longer exist. What they required, per the verification: a fix is always the correct
  line, never a narrowed claim, a stated limitation, a fallback or an exclusion.
- A finding is a claim to verify, not an order. Check each against its sources. If you
  find a finding wrong, do not apply it: record it in your record file with the evidence.
  Never drop one silently.

Your part's entries are listed in your dispatch message.

## Max Cogar's answers and settled decisions — these change some entries

`OWNER-LEDGER.md` CONFIRMED is the only authority for anything attributed to Max Cogar.
His answers of 2026-10-02 are OL-C9 … OL-C15 there; read them verbatim. They decide:

- **OL-C9** (a E-58, a E-43): the skill-step checker stays as specified; the line calling
  the skill feature "the recurring failure this project exists to prevent" is replaced
  with his own recorded words (OL-C2 / OL-C9) — the skill feature must never be made the
  tool's single or primary purpose.
- **OL-C10** (b E-24, E-27): OL-C2's "OR STEERING ISNT WORKING" block trigger is restored.
- **OL-C11** (b E-38; also b E-36, c E-21, c E-35): sandbox compatibility includes Claude
  Code cloud sessions; there is no no-internet requirement.
- **OL-C12** (b E-77, E-78): both stores, project and global, must survive the end of a
  cloud session. Do not answer this with a limitation; derive a design-neutral
  requirement the architecture can meet, from verified facts about cloud sessions.
- **OL-C13** (c E-10): test runs happen on his real projects, using his real sessions.
- **OL-C14**: the repo-root `CLAUDE.md` is not this project's and is not changed.
- **OL-C15**: edit-warning timing corrected everywhere it applies — a whisper on an
  edit/write reaches the agent with the edit's result, at its next decision (FR-A2d, §5.1,
  AC-1c), and is preserved when the tool call fails (FR-O2). Sources: hooks reference
  PreToolUse `additionalContext` "String added to Claude's context alongside the tool
  result"; changelog 2.1.110.

Settled without him (recorded in `docs/STATUS.md`, "Settled without him" and "Design
decisions settled 2026-10-02"):

- **Who checks the oracle's warnings (verification question 1, a E-80):** the agents
  (OL-11); a human correction from Max Cogar outranks theirs when given. Calibration
  inputs are part c adjudication E-22's wording and "ships high" is removed throughout
  (verification, cross-part reconciliation item 4).
- **"A more deterministic trigger" for skills (c E-6):** built from the skill's declared
  structure — when the skill is active, its steps, what the agent should be doing — as
  OL-C2's own words describe; no hand-written rule piles.
- **Skill steps that seem to happen only in the agent's head (c E-5):** the oracle checks
  every step by the evidence that step itself requires (example: `expert-implement`
  Step 5 — a verification command that actually ran, its output cited, claims checked
  against source). A step that requires no evidence at all is a flaw in that skill,
  raised to Max Cogar for that one step when the skill's structure is encoded.

Do not stretch any of his words beyond the subject they were said about (OL-C7;
`docs/collapse-log.md` 2026-10-02/03 item 9). Do not write any new claim attributed to
Max Cogar that is not in the ledger CONFIRMED section.

## Undetermined entries

b E-36, E-38, E-77, E-78 and c E-35 were waiting on questions now answered (OL-C11,
OL-C12): derive their correct lines now. b E-41 and c E-33 (latency numbers) need a
measurement or a cited source: find and verify one, or use the skill's halt path for that
finding — never write an unsourced number. b E-90 needs an engineering comparison: do it,
from sources, and record it.

## Standards for every line you write

- Read before you assert. Open any file, tool or web page before stating what it says.
  A grep is not verification. For web sources, fetch with `curl` and quote what you read.
- Every non-trivial requirement carries its source annotation (named standard, `[OL-n]`,
  or `[D-n]` whose reasoning is in §12). No number without a source.
- The spec says what the tool must do — positively. Never answer a requirement with a
  narrowed claim, a stated limitation, a fallback or an exclusion (OL-R5: define it by
  what it is, not by what it isn't).
- Keep the spec in sync with itself: behavior → requirement text; scope → §2 and §14;
  judgment → §12. A changed requirement makes its acceptance criterion, §12 judgment and
  every cross-reference stale until re-read.
- No reviewer commentary, revision notes or "corrected per E-n" text in the spec itself.
  Provenance lives in your record file.

## Your record file — the structured return

Write `docs/spec-correction/record-<part>.md` containing, for every entry in your list:
the entry id, what you did (re-derived / rejected with evidence / halted with reason), and
the expert-correct return contract fields (`location`, `source`, `finding_addressed`,
`class_sweep` with `searched`, `pattern` (a Grep regex), `scope`, `found` (every location
the pattern returns, run AFTER your edits), `sites_changed`, `open_sites` with
designation). Also list every line you changed that no entry in your list named (class
sweeps, owner answers), with the reason. End your final message with `status`
(`complete` or `halted`), `artifact_path`, and the record path. The coordinator will
re-execute every `pattern` through a different agent and compare with `found`.
