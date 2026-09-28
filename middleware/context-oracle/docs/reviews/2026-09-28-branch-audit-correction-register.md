> Compiled 2026-09-28 from the B1–B9 verifications and the 2026-09-28 coordinator files, at HEAD c00819e. Conflict C-1 is resolved by 2026-09-28-branch-audit-coordinator-ruling-correction-store-recovery.md.

# Correction register — branch audit of `middleware/context-oracle/` (Context Oracle, Phase A)

Compiled 2026-09-28 for the single correction pass. The audit judged every change since
base `de66831` (505 entries, 1,342 units; B9 verification, "The audit as a whole"). This
register changes no repository file. It lists, for each correction the audit settled,
what changes, where it is at `HEAD` (`c00819e`), which verification item and
adjudication (or first-audit entry, where the adjudication left it "not re-ruled")
it comes from, and what it depends on. No correction here is the register's own: every
item traces to a named verification item or adjudication entry. Where a later ruling
replaced an earlier one, the later ruling is used and the replacement is named (Part 1,
and Part 4 §4.1).

**Inputs read:** the auditor brief (`scratchpad/audit/BRIEF.md`); project `CLAUDE.md`;
`OWNER-LEDGER.md` (CONFIRMED); spec §11.5 and §12; the nine batch verifications
(`docs/reviews/2026-09-26-branch-audit-B1-verification.md` … `B9-verification.md`); the
three 2026-09-28 files (coordinator rulings on schema and edit timing; hook context on a
denied edit; hook context on a permission denial); every adjudication those cite, and
each first audit's verdict line for the entries its adjudication did not re-rule.

**How to read.** Part 1 groups the corrections by the root cause they share, with the
settled ruling. Part 2 lists every correction by target document in lifecycle order
(spec → architecture → plan → code and tests → records), each with an R-number. Part 3
maps the corrections onto plan Steps 1–39. Part 4 lists the conflicts between
corrections, the corrections that are only a goal, and the verification items that map
to no open correction.

**Summary.**
- 148 corrections: spec 6 (R-1–R-6), architecture 34 (R-7–R-40), plan 51 (R-41–R-91),
  code and tests 38 (R-92–R-129), records 19 (R-130–R-148). Per root cause: Part 1,
  "Counts".
- **Spec items needing Max Cogar's sign-off (OL-C6; M38):** R-1 (FR-O2 clause and
  gloss), R-2 (FR-O2 heading and C-4 dates), R-3 (FR-A2d), R-4 (§5.1), R-5 (AC-1c); R-6
  is the sign-off request itself. All five are agent-written engineering lines (harness
  facts), not owner decisions. None of the spec's §12 `D-n` judgments or constraints is
  changed by the audit.
- 15 conflicts (4 open: C-1–C-4; 11 resolved by a later ruling), 11 goal-only gaps
  (G-1–G-11), 5 unmapped verification items (U-1–U-5).

## Part 1 — Root causes

Every correction in Part 2 is listed once, under the root cause it shares. The ruling cited is the settled one; where a later batch replaced an earlier ruling, the later one is cited and the replacement is named.

### RC-1 — No watermark rule per batch 5 ruling 1: the miner's watermark is a per-chunk stream position, not the pass-start `HEAD` keyed to the mined ref and written only in the final transaction (3 items)

- **Settled ruling:** B5 verification, ruling 1 (`2026-09-26-branch-audit-B5b-adjudication.md`, "The watermark rule"). It replaces every earlier watermark statement, including batch 4's chunk watermark (B4 p2 E-1: "oldest-first chunked watermark"); batch 4's ref key is kept inside it. Executed evidence: the merge (`b..HEAD` → `d c2`) and clock-skew cases in the B5 verification.
- **Items:** R-22 (architecture), R-55 (plan), R-101 (code and tests)

### RC-2 — git exit statuses and ref identity misread: exit 128 of `merge-base` read as a history rewrite, any `rev-parse` failure read as an empty history, a branch switch indistinguishable from a rewrite (3 items)

- **Settled ruling:** B4 verification item 1 (B4 p2 E-1: ref-keyed watermark; `history_rewritten` only on the same ref; `branch_changed` on a different ref; any other status a git fault with no purge), restated as B5 ruling 1 point 4; B2 E-1 (a) for `rev-parse --verify --quiet` (exit 1 unborn, 128 not a repository). git-merge-base(1): "Errors are signaled by a non-zero status that is not 1".
- **Items:** R-23 (architecture), R-56 (plan), R-102 (code and tests)

### RC-3 — No inter-chunk yield: off-path passes take the write lock back to back, starving SQLite's sleeping busy handler, so the event path's audit write fails and the answer-drift deny goes silent (5 items)

- **Settled ruling:** B3 verification (busy-handler schedule; B3b E-7: a yield of at least 25 ms, executed 15/15 vs 1/15), carried by B4 item 1, B7 item 7 and B8 item 6. The per-transaction bound is B8a E-17's "below the waiter's roughly 100 ms first-try window", which tightens B3a E-17's "below AD-26's give-up (about 200 ms)". Reason corrected by B7b E-21.
- **Items:** R-36 (architecture), R-41 (plan), R-61 (plan), R-68 (plan), R-107 (code and tests)

### RC-4 — Recency weights not per batch 5 ruling 2: a full-mine epoch at `refTs − 500·h`, an exponent-1000 re-mine trigger and a 37-day floor instead of a re-based epoch with exact rescale (3 items)

- **Settled ruling:** B5 verification, ruling 2 (B5c E-4), with the floor stated as the relation of B7b E-6 (`h ≥ 365.25 × horizon_years / 1022`). It supersedes B4 p3 E-23's stored form ("rescaled at read"; evidence weighting itself is kept) and B5a E-19's 37-day floor. The automatic re-mine on a changed `h` stays (B5c E-3 keep; B6 verification item 3).
- **Items:** R-24 (architecture), R-57 (plan), R-103 (code and tests)

### RC-5 — Git output and the git environment trusted unvalidated: log encoding, author/committer dates, malformed headers, inherited `GIT_*`/`GIT_CONFIG_*`, shallow and grafted roots, reference-format reverts (8 items)

- **Settled ruling:** B7 verification items 2, 3, 5 and 6 (B7a E-16, E-17, E-21; B7b E-2, E-10, E-23; B7c E-1), with the label vocabulary from B3b E-14 and the fail-fast standard in the brief.
- **Items:** R-25 (architecture), R-58 (plan), R-59 (plan), R-60 (plan), R-104 (code and tests), R-105 (code and tests), R-106 (code and tests), R-109 (code and tests)

### RC-6 — Errors converted to absence, success or silence (fail-fast violated): I/O errors read as deleted files, thrown resolvers as unresolved, stdin failures as empty events, swallowed rollbacks, truncated spawns, missing error channels, silent skips (16 items)

- **Settled ruling:** The brief's fail-fast standard (Shore, IEEE Software 2004). Per-area rulings: B8 verification item 2 (only `ENOENT` means absent; every other error keeps the rows and records a fault); B8a E-13 (gitfile parsing as git's `setup.c`); B2 verification item 5 (no fabricated event, no `cwd` fallback); B6 verification item 4 (B6c E-13, E-20); B6c E-7 and B7c E-4 (spawn); B7b E-24 (index verb); B9 verification items 2 and 7; B6a E-24 (`store_corrupt` catch-all).
- **Items:** R-20 (architecture), R-46 (plan), R-48 (plan), R-50 (plan), R-63 (plan), R-71 (plan), R-77 (plan), R-84 (plan), R-93 (code and tests), R-95 (code and tests), R-100 (code and tests), R-110 (code and tests), R-111 (code and tests), R-112 (code and tests), R-120 (code and tests), R-124 (code and tests)

### RC-7 — Uninitialised grammar scanners: `tree-sitter-lua` 2.1.3 reads an uninitialised `malloc` block and `tree-sitter-swift` 0.4.3 writes into a zero-byte `calloc`; Lua was excluded as a patch and Swift kept silently broken (4 items)

- **Settled ruling:** B9 verification item 1 (B9 E-1): vendor Lua from `@tree-sitter-grammars/tree-sitter-lua` 0.4.1, rebuild Swift 0.4.3 with `calloc(1, …)` and a length-0 reset, per-grammar WASM path, AD-25 amended, a cause-level usability rule, a per-file ERROR-tree signal.
- **Items:** R-14 (architecture), R-15 (architecture), R-69 (plan), R-119 (code and tests)

### RC-8 — Resolver rules contradict batch 4 item 5: TypeScript tries the written `.js` before source and has no declaration files; workspace packages read as external; Python names read as external unless the repository holds the name (3 items)

- **Settled ruling:** B4 verification item 5 (B4 p2 E-3; B4 p3 E-22; B3b E-15), restated at HEAD by B9 verification items 3 and 4 (B9 E-29).
- **Items:** R-16 (architecture), R-70 (plan), R-121 (code and tests)

### RC-9 — Migrations edited in place while every store records `schema_version` `'1'`, so a store built by an older build opens as current (4 items)

- **Settled ruling:** CR§1 (per-migration checksums, refusal on every open path, plain recovery, no automatic purge). It supersedes B4 p1 E-5's "new `schema_version` value or fingerprint" and B6a E-11's version guard, and withdraws the "has Max Cogar run `init`" question.
- **Items:** R-35 (architecture), R-44 (plan), R-52 (plan), R-92 (code and tests)

### RC-10 — Side effects the design forbids or orders wrongly: tuning seeds written on the event path, `global/` created by the miss-path helper, the global store opened read-write by the handler, hooks wired before the first index (5 items)

- **Settled ruling:** B4 verification item 4 (the reader serves the seed without writing on the event path); B4 p1 E-9 and B6 item 7 (`ensureHome`); B3a E-6 (b) (read-only global open); B6 item 9 and B6a E-23 (init order, fail-fast).
- **Items:** R-12 (architecture), R-47 (plan), R-80 (plan), R-94 (code and tests), R-118 (code and tests)

### RC-11 — Tuning invariants enforced on write only, never on the stored set; list keys writable as scalars; seeds with no stated status (3 items)

- **Settled ruling:** B3b E-13 and B4 p1 E-17 (stored-set ordering check at reader construction); B6c E-25 (list-key scalar refusal); B7b E-6 (half-life relation); B5 verification item 13 and B3b E-13 (seed status). B4 p1 E-17 rules out adding a trust ≥ high clause.
- **Items:** R-28 (architecture), R-54 (plan), R-99 (code and tests)

### RC-12 — Search storage contradicts batch 5 ruling 3: split before normalise, `path_tokens` as path segments, fallback tables written in both FTS states (4 items)

- **Settled ruling:** B5 verification, ruling 3 (B5a E-18; B5c E-1, E-2), plus B4 item 6 on the symbol divergence.
- **Items:** R-10 (architecture), R-11 (architecture), R-62 (plan), R-114 (code and tests)

### RC-13 — Session and consumer identity ambiguous: `consumerKey` not injective, `correct` arms the newest session, per-session readers without the consumer, host-CLI non-attachment assumed from a variable list (7 items)

- **Settled ruling:** B6 verification item 1 (throw on `#`); B4 p2 E-19, restated as B5 verification item 7 (arm the single open session; refuse with a plain list when several); B5a E-25 (verify `session_id` per invocation).
- **Items:** R-9 (architecture), R-13 (architecture), R-32 (architecture), R-49 (plan), R-53 (plan), R-83 (plan), R-96 (code and tests)

### RC-14 — Transcript success signal read from a field successes never carry, and an empty read-set rebuild goes unreported (2 items)

- **Settled ruling:** B4 verification item 3 (B4 p2 E-9: successful unless `is_error: true`); B5 verification item 8 (`rebuild_recovered_nothing` for `set = 'read'`).
- **Items:** R-33 (architecture), R-76 (plan)

### RC-15 — Import, export and the fold are not validated before writing, not all-or-nothing, and claim trends they cannot attribute (5 items)

- **Settled ruling:** B2 verification item 6 (B2 E-9: refuse until rebuilt; read-only source; validate both; backup API); B3 verification item 7; B5 verification item 9; B4 p2 E-15 (attribute or drop the trend); B4 p3 E-4 (key-addressed read).
- **Items:** R-34 (architecture), R-79 (plan), R-81 (plan), R-82 (plan), R-125 (code and tests)

### RC-16 — The spec's hooks-timing premise was never sourced ("about to run"; "preserved even if the tool call later fails"), and architecture text rests on it (8 items)

- **Settled ruling:** CR§2, DE and PD (PD corrects the wording proposed to Max Cogar on 2026-09-28); B2 verification "Spec-line finding"; B3a/B3b E-3. For the timeout wording, B5a E-1. Spec lines go to Max Cogar for sign-off under M38.
- **Items:** R-1 (spec), R-2 (spec), R-3 (spec), R-4 (spec), R-5 (spec), R-6 (spec), R-7 (architecture), R-8 (architecture)

### RC-17 — Zone rules unsourced or over-broad: a tracked-and-ignored match sets `generated`, `build/` matches at any depth, the lockfile list and 200-character cut have no source (3 items)

- **Settled ruling:** B3b E-12; B8 verification item 7 (B8a E-9, E-21).
- **Items:** R-17 (architecture), R-64 (plan), R-113 (code and tests)

### RC-18 — Bar and genre axes filled with undefined or silent values: structural-fact confidence, the noise floor's second half, one-sided Coupling ratio, whole-candidate drops, literals (7 items)

- **Settled ruling:** B2 verification item 4 (B2 E-5); B3b E-11 (partner-level drop), E-17 (both ratios or recorded withholding); B4 p2 E-4 (noise floor against the settled label order).
- **Items:** R-18 (architecture), R-26 (architecture), R-27 (architecture), R-30 (architecture), R-72 (plan), R-74 (plan), R-75 (plan)

### RC-19 — The command-class splitter misses bash separators (newline, `&`, heredocs) and pytest node ids (3 items)

- **Settled ruling:** B2 verification item 3 (B2 E-5 (h), executed on GNU bash 5.2.21); B4 p3 E-24.
- **Items:** R-31 (architecture), R-73 (plan), R-123 (code and tests)

### RC-20 — Provenance and redaction controls not enforced for every path: `slot.human`, optional `subject_key`, the `createHuman` gate, identifier redaction scope and untuned entropy (4 items)

- **Settled ruling:** B6 verification item 6 (B6a E-7, E-12; B6c E-4); B9 verification items 5–6 (B9 E-16, E-39).
- **Items:** R-21 (architecture), R-97 (code and tests), R-98 (code and tests), R-122 (code and tests)

### RC-21 — Incremental indexing keyed on a whole-tree fingerprint and blind to resolver-input changes (3 items)

- **Settled ruling:** B8 verification item 4 (B8b E-3: dependency tracking; B8b E-25: per-language fingerprint; B8b E-4/B9 E-19: `version` as a content digest).
- **Items:** R-19 (architecture), R-65 (plan), R-115 (code and tests)

### RC-22 — Tests that pass while the behaviour is wrong (7 items)

- **Settled ruling:** The brief's test for tests ("would it fail if the behavior were wrong"); per-batch lists: B4 item 8, B5 item 12, B6 item 8, B7 item 9, B8 item 13, B9 item 8.
- **Items:** R-45 (plan), R-78 (plan), R-86 (plan), R-108 (code and tests), R-127 (code and tests), R-128 (code and tests), R-129 (code and tests)

### RC-23 — Unreviewed fix commits called reviewed, and success claims asserted before they were checked (9 items)

- **Settled ruling:** Project CLAUDE.md dominating rule 1; B6 verification "A coordinator error, recorded" (B6c E-33); B7c E-16, E-17; B8b E-27; B3b E-22, E-24; B5c E-6.
- **Items:** R-39 (architecture), R-89 (plan), R-130 (records), R-135 (records), R-137 (records), R-139 (records), R-140 (records), R-141 (records), R-142 (records)

### RC-24 — Records carry wrong, missing or borrowed reasons and sources (gap entries, standards rows, citations, measured figures) (12 items)

- **Settled ruling:** Project CLAUDE.md "Numbers without sources don't go in" and OL-C7; B1 E-15, E-16; B2 verification item 8; B4 p1 E-3; B3b E-14, E-25; B2 E-10 (G36 not on OL-R5).
- **Items:** R-29 (architecture), R-38 (architecture), R-40 (architecture), R-42 (plan), R-87 (plan), R-90 (plan), R-126 (code and tests), R-131 (records), R-132 (records), R-134 (records), R-136 (records), R-138 (records)

### RC-25 — The plan keeps text the architecture or the build has since replaced, or declarations that do not match what a step changes (6 items)

- **Settled ruling:** The plan's own §16 item 5 rule (architecture corrected first, plan follows in a separate pass); B4 verification items 9–10; B5c E-5, E-7; B8 verification item 12.
- **Items:** R-43 (plan), R-51 (plan), R-67 (plan), R-85 (plan), R-88 (plan), R-91 (plan)

### RC-26 — Process and instruction defects from batch 1: the skill's stop list, the findings rule, the duplicated flaw paragraph, OL-C8's context, the Stop gates' record, the planted-defect harness, unasked owner questions (7 items)

- **Settled ruling:** B1 verification, correction items 1–9 and "Questions for Max Cogar".
- **Items:** R-133 (records), R-143 (records), R-144 (records), R-145 (records), R-146 (records), R-147 (records), R-148 (records)

### RC-27 — A reftable or unresolved `HEAD` reads as fresh (1 item)

- **Settled ruling:** B5 verification item 10 (both staleness flags true); B8b E-14 (the dampening lives in Step 28's `EventContext`, not in `refreshIfStale`; drop the config scan).
- **Items:** R-117 (code and tests)

### RC-28 — The reindex claim's refusal carries no holder data read in its own transaction, and its stale recovery is unchosen (3 items)

- **Settled ruling:** B8 verification item 11 (B8a E-3, E-4); B5 verification ruling 4 (stale recovery by written comparison — not yet made).
- **Items:** R-37 (architecture), R-66 (plan), R-116 (code and tests)

### Counts

| Root cause | Items |
|---|---|
| RC-1 | 3 |
| RC-2 | 3 |
| RC-3 | 5 |
| RC-4 | 3 |
| RC-5 | 8 |
| RC-6 | 16 |
| RC-7 | 4 |
| RC-8 | 3 |
| RC-9 | 4 |
| RC-10 | 5 |
| RC-11 | 3 |
| RC-12 | 4 |
| RC-13 | 7 |
| RC-14 | 2 |
| RC-15 | 5 |
| RC-16 | 8 |
| RC-17 | 3 |
| RC-18 | 7 |
| RC-19 | 3 |
| RC-20 | 4 |
| RC-21 | 3 |
| RC-22 | 7 |
| RC-23 | 9 |
| RC-24 | 12 |
| RC-25 | 6 |
| RC-26 | 7 |
| RC-27 | 1 |
| RC-28 | 3 |
| **Total** | **148** |

| Target document | Items | R-range |
|---|---|---|
| spec | 6 | R-1 – R-6 |
| architecture | 34 | R-7 – R-40 |
| plan | 51 | R-41 – R-91 |
| code and tests | 38 | R-92 – R-129 |
| records | 19 | R-130 – R-148 |
## Part 2 — Corrections by target document

Locations are at `HEAD` = `c00819e` (2026-09-28 16:21 UTC). Every line number given
below was read at `HEAD` for this register. Where no line is given, the section was
confirmed to exist at `HEAD` but the exact line was not pinned. The ctxoracle source
at `HEAD` equals `64f46fd`'s (B9 verification, "Scope at HEAD"), so the adjudications'
`@HEAD` code citations still hold.

Abbreviations: `spec` = `docs/specs/spec-context-oracle.md`; `arch` =
`docs/architecture-phase-a.md`; `plan` = `docs/plans/plan-phase-a.md`; `src/`, `test/`
are under `ctxoracle/`. Source files: `Bn-verification` = that batch's
`2026-09-26-branch-audit-Bn-verification.md`; `Bnx E-k` = entry k in that part's
adjudication, or in its first audit where the adjudication lists it "not re-ruled"
(marked "FA"). `CR§1`/`CR§2` =
`2026-09-28-branch-audit-coordinator-rulings-schema-and-edit-timing.md` §1/§2; `DE` =
`2026-09-28-branch-audit-hook-context-on-denied-edit.md`; `PD` =
`2026-09-28-branch-audit-hook-context-permission-denial.md`.

### 2.1 Spec — `docs/specs/spec-context-oracle.md`

All six items need Max Cogar's sign-off before any line changes (OL-C6: the spec was
signed without being line-read; M38: "the change comes to you before it replaces the
old line", as cited in B2 E-14 and B3a E-3). None of the six lines is an
owner-CONFIRMED decision: each is an agent-written engineering claim about the Claude
Code hooks harness (B2 E-14: "Kind: agent-written engineering claim, factual
correction"; CR§2: "a wording correction under M38. It is not a design choice put to
him"). The design they describe (Consequence/Warning stay on the edit trigger) is not
changed (CR§2; B2 verification "Questions": moving the Warning trigger would be his
decision and is not proposed).

#### R-1 — FR-O2: drop the unsourced "preserved" clause and the "confirmed" gloss; state the observed cases
- **Root cause:** RC-16
- **Change:** Delete "(confirmed against the current hooks reference and the Claude Code
  `additionalContext`-on-`PreToolUse` behavior)" and "and that text is preserved even if
  the tool call later fails". Keep "a permission denial also fires `PreToolUse`" (PD:
  "stands"). Replace the deleted clause with the observed cases, citing DE, PD and the
  hooks reference fetched 2026-09-28: when another hook denies the edit, the text still
  reaches the agent next to the denial (DE case B); when a permission rule denies a Bash
  call, the hook runs and the text reaches the model next to the denial (PD); and the
  clause PD gives verbatim: "`Edit`/`Read` path deny rules are rejected before hooks
  run, so the oracle is not invoked (Claude Code 2.1.283, tested)". Cite the Claude
  Code version, because "the spec cites the version" (DE, last paragraph). Record,
  beside the correction, that the clause is inherited from `de66831` and was re-dated
  without being checked (B3b E-3).
- **Wording as it stands after PD's correction** (assembled from CR§2, DE and PD; the
  agents propose it and Max Cogar decides): *"A `PreToolUse` hook may return
  `additionalContext` without any `permissionDecision` — the passive-whisper
  affordance. The hook runs before the tool, but the text is "String added to Claude's
  context alongside the tool result" and "Claude reads the reminder on the next model
  request" (hooks reference, fetched 2026-09-28), so the model sees it after the call
  resolves, which does not mean the tool ran: "Permission denials fire `PreToolUse`",
  and the call may fail. When another hook or a permission rule denies the call, the
  text reaches the model next to the denial; `Edit`/`Read` path deny rules are rejected
  before hooks run, so the oracle is not invoked (Claude Code 2.1.283, tested —
  `docs/reviews/2026-09-28-branch-audit-hook-context-on-denied-edit.md`,
  `…-permission-denial.md`)."*
- **Location:** spec §8, FR-O2, L474–L491. The clauses are at L479–L481 ("affordance
  (confirmed against the current hooks reference and the Claude Code /
  `additionalContext`-on-`PreToolUse` behavior) — and that text is preserved even if the
  / tool call later fails."). L481–L485 already carry the corrected "alongside the tool
  result" / "next model request" / "a permission denial also fires `PreToolUse`" text
  (written by `ec3b057`, dated "hooks reference re-read 2026-09-26").
- **Sign-off:** needs Max Cogar's sign-off. Kind: agent-written engineering line
  (harness fact), not an owner decision.
- **Source:** B2 verification "Spec-line finding" and item 10; B2 E-14; B3 verification
  item 1; B3a E-3; B3b E-3; CR§2; DE; PD (which corrects the wording proposed to Max
  Cogar on 2026-09-28).
- **Depends on:** none. **Consumed by:** R-2, R-3, R-4, R-5, R-8.
- **Plan steps:** 18, 28 (Consequence/Warning wording and delivery follow it through R-8).

#### R-2 — FR-O2 heading and C-4: update the verification dates
- **Root cause:** RC-16
- **Change:** Replace "re-verified 2026-08-25" in the FR-O2 heading and "verified
  2026-08-25" in C-4 with the re-read date of the hooks reference (2026-09-28, the fetch
  date CR§2, DE and PD used).
- **Location:** spec L474–L475 ("**FR-O2 — Delivery-capable events and mechanism (C-4,
  `[HOOKS]`, re-verified / 2026-08-25).**"); spec L533 ("**C-4 — Hooks contract**
  `[HOOKS]` — the facts above (FR-O2), verified 2026-08-25.").
- **Sign-off:** needs Max Cogar's sign-off. Kind: agent-written engineering line.
- **Source:** B3a E-3 ("The heading's 're-verified 2026-08-25' and C-4's 'verified
  2026-08-25' are updated"); B3a E-21 (m2's date half unapplied at `HEAD`); B3b E-3;
  B3b E-22 (FR-O2/C-4 dates among the four unapplied items).
- **Depends on:** R-1 (lands in the same change).
- **Plan steps:** none.

#### R-3 — FR-A2d: the trigger text "about to run"
- **Root cause:** RC-16
- **Change:** Reword "An edit / write about to run" so it says the Consequence fact is
  delivered with the edit's result and concerns the file the edit targets, citing the
  three hooks-reference quotes (CR§2: "FR-A2d, AC-1c and L211 say the warning is
  delivered with the edit's result, citing the three quotes above"). The trigger (the
  edit) is unchanged.
- **Location:** spec §4 table, L168 ("| **FR-A2d Consequence** | An edit / write about
  to run | …").
- **Sign-off:** needs Max Cogar's sign-off. Kind: agent-written engineering line (the
  timing premise under an owner-signed genre list; the genre itself is not changed).
- **Source:** B2 verification "Spec-line finding"; B2 E-14; B3a E-3; B3b E-3; CR§2.
- **Depends on:** R-1.
- **Plan steps:** 18.

#### R-4 — §5.1: "the edit it is about to run"
- **Root cause:** RC-16
- **Change:** Same correction as R-3 for the §5.1 enumeration of intent signals.
- **Location:** spec §5.1, L211 ("deciding now — the file it opened, the symbol it
  searched, the edit it is about to run,").
- **Sign-off:** needs Max Cogar's sign-off. Kind: agent-written engineering line.
- **Source:** B3 verification item 1 and "Questions" 1; B3a E-3; B3b E-3; CR§2 (names
  L211).
- **Depends on:** R-1.
- **Plan steps:** 18.

#### R-5 — AC-1c: "On an edit about to run"
- **Root cause:** RC-16
- **Change:** Same correction as R-3 in the acceptance criterion, so the criterion
  tests a whisper that lands with the edit's result.
- **Location:** spec §14, AC-1c, L929 ("- **AC-1c (consequence → FR-A2d, P5, HERZIG).**
  On an edit about to run in a file with known").
- **Sign-off:** needs Max Cogar's sign-off. Kind: agent-written engineering line.
- **Source:** B2 verification "Spec-line finding"; B2 E-14; B3a E-3; B3b E-3; CR§2.
- **Depends on:** R-1. **Consumed by:** R-8 (architecture L12/AD-15
  wording). Consequence to check, with no separate correction on record: the plan's
  AC-1c acceptance replay (Step 38) must still match the reworded criterion.
- **Plan steps:** 38 (the AC-1c replay).

#### R-6 — Owner question record for the spec pass
- **Root cause:** RC-16
- **Change:** Put R-1 to R-5 to Max Cogar as one wording correction, phrased for a
  non-programmer, with the evidence (hooks page quotes, DE, PD). Only after his yes do
  R-1 to R-5 replace the lines. This is the only owner question left open by the audit
  (B7, B8 verifications: "Still open: his sign-off on the FR-O2 / FR-A2d / AC-1c
  wording"; B9: "None new").
- **Location:** `docs/STATUS.md` (the only file that states what to do next; project
  CLAUDE.md rule 2).
- **Sign-off:** this item *is* the sign-off request.
- **Source:** B3 verification "Questions" 1; B4–B6 verifications "Still open"; B7 and
  B8 verifications; CR§2; PD last bullet.
- **Depends on:** R-1 to R-5 drafted.
- **Plan steps:** none.

### 2.2 Architecture — `docs/architecture-phase-a.md`

Engineering items (OL-11): each is the agents' to correct, with the reason recorded at
the change (project CLAUDE.md, "Decisions are locked"). The independent collapse-hunt
of the decisions `ec3b057` introduced is a separate process item (R-142).

#### R-7 — V6 row and AD-23 items 1, 3, 4: harness-timeout wording
- **Root cause:** RC-16
- **Change:** Keep V6's facts and its dated note, and AD-23 item 1. Rewrite item 3 so the
  hazard the watchdog exists for is losing the `latency_breach` record and any deny the
  handler would have emitted, not an accidental block. Rewrite item 4 to "Not
  harness-timeout reliance (that path is fail-open on `PreToolUse` and discards the
  handler's output, V6, so relying on it loses the record)". In V6 and item 1, replace
  "fails open silently … with no trace" / "lost without a trace" with the reference's
  own scope: the output is discarded and nothing the oracle wrote survives; whether the
  harness shows a notice for `PreToolUse` is not stated.
- **Location:** arch "Verified premises", V6, L130 ("A timed-out handler **fails open
  silently**: … discarded with no trace"); AD-23 item 1, L2386–L2388 ("is lost without a
  trace"); item 3, L2394–L2395 ("could make the oracle *block by / accident*"); item 4,
  L2396–L2397 ("Not harness-timeout reliance (that path is fail-closed / on
  PreToolUse, V6)").
- **Source:** B5 verification item 5; B5a E-1.
- **Depends on:** none. **Plan steps:** 10, 29 (watchdog) consume it.

#### R-8 — V20, AD-6, AD-15, L12: follow the corrected FR-O2
- **Root cause:** RC-16
- **Change:** Bring every statement of `PreToolUse` timing to the corrected FR-O2
  (R-1): the text is read next to the tool result on the next model request,
  whether the call ran, failed or was denied; drop "the text is kept if the call fails"
  and every sentence that rests on it; add the path-deny case (the oracle is not
  invoked, PD). Remove AD-15's "leaves FR-A2d/FR-A2e unchanged (no spec change)", which
  is false once R-3 lands. L12 is narrowed to the Edit event, with the Read-time
  alternative rejected on the record (the rejection is CR§2's "Delivery at read time is
  FR-A2e / D-26's job").
- **Location:** V20, L144 ("and the text is kept if the call fails (FR-O2)"); AD-6 event
  map, L950 ("read by the model next to the tool result, after the tool has run, V20");
  AD-15, L1760–L1761 ("FR-O2 keeps a / `PreToolUse` text even if the tool call fails")
  and L1767 ("Keeping the trigger also leaves FR-A2d/FR-A2e unchanged (no spec
  change)."); L12, L3045–L3050.
- **Source:** B3a E-1 (FA: V20's implication column "whether the call ran, failed or
  was denied"); B3a E-2 (FA: keep the `PreToolUse` trigger, word headlines about the
  target file, Read-time alternative rejected on the record); B3b E-1 (FA: "drop or
  source the 'text is kept if the call fails' clause in V20 and AD-15, and bring the
  AD-6 `PreToolUse` row … to the corrected timing"); CR§2; PD.
- **Depends on:** R-1, R-3. **Plan steps:** 18, 28 consume it.

#### R-9 — AD-21: verify host-CLI non-attachment on every invocation
- **Root cause:** RC-13
- **Change:** Keep the six-variable list as the 2026-09-07 observation on one Claude Code
  version. Replace "Phase B re-derives it by execution against the version it ships on
  before relying on it" with: the Phase B seam verifies non-attachment on each
  invocation — the returned `session_id` must differ from the parent session's — and
  enters the visible degraded mode (FR-J2/FR-J3) on a match; the list is a first-line
  scrub, never the guarantee.
- **Location:** AD-21, L2258–L2264 ("and Phase B re-derives it by execution against the
  version it / ships on before relying on it").
- **Source:** B5 verification item 6; B5a E-25; B5a E-9 (FA, amended by E-25).
- **Depends on:** none. **Plan steps:** 36 consumes it.

#### R-10 — AD-2: search storage per batch 5 ruling 3
- **Root cause:** RC-12
- **Change:** (a) Normalise before splitting (NFKD and mark removal, then split on every
  non-letter/non-digit, then lowercase), and state the invariant that tokens are letters
  and digits only. (b) Name a pass-through FTS5 tokenizer (`ascii`). (c) `path_tokens`
  is a `path_tokens(token, file_id)` table of the path's in-house tokens, one row per
  token — not "a table of path segments". (d) Fallback tables are written only under
  `fts_state = 'fallback'`. (e) Record the reason `_` and `$` became separators, or keep
  them as token characters. (f) State that paths agree by construction and that
  symbols either use a folded key or disclose the ASCII-only divergence, shown in
  `status` (batch 4).
- **Location:** AD-2 item 1, L352–L371: L355–L356 ("a `path_tokens` / table of path
  segments"); L358–L360 (order "split on every non-letter/non-digit (Unicode),
  NFKD-normalize, drop combining marks, lowercase").
- **Source:** B5 verification ruling 3 and item 3; B5a E-18; B5c E-1; B5c E-2; B4
  verification item 6; B4 p1 E-13; B4 p3 E-6 (D-plan-36), E-49 (h); B8 verification
  item 5.
- **Depends on:** none. **Consumed by:** R-11, R-51,
  R-62, R-114. **Plan steps:** 7, 14, 15 consume it.

#### R-11 — AD-4 listing: `path_tokens` rows and the both-states rule
- **Root cause:** RC-12
- **Change:** "one row per path-segment token" → "one row per path token"; remove "both
  kept in both search states (AD-2)" (the tables may still be created empty by 001).
  If a later pass finds a real reason to write both states, record it in AD-2 with its
  source first.
- **Location:** AD-4 schema listing, L659–L661 ("path_tokens(token, file_id→files) --
  one row per path-segment / -- token; both kept in both / -- search states (AD-2)").
- **Source:** B5c E-2; B5 ruling 3.
- **Depends on:** R-10.
- **Plan steps:** 7, 14.

#### R-12 — AD-3/AD-17/AD-23: binding miss, worktree `HEAD`, global store open
- **Root cause:** RC-10
- **Change:** (a) State the retention rule for the per-session `repo_not_bound` marker
  files so the home-level channel does not grow without bound. (b) State that a
  worktree's `HEAD` is a symbolic ref resolved through the common directory's refs (a
  bounded set of file reads), so the staleness comparison is specified as it must be
  built. (c) The handler opens the global store read-only (or checks existence first),
  so a missing global store is a miss and creates no file.
- **Location:** AD-23 repository resolution, L2335–L2350 (the worktree `HEAD` is "its
  git directory's `HEAD` file, one more bounded read", L2348–L2349); binding miss,
  L2356–L2362 ("deduplicated by a home-level marker keyed by `session_id`" — no
  retention rule); AD-17 home channel, L1962–L1969. No read-only global open is stated
  at `HEAD` (grep for `readOnly`/`read-only` finds only L2166 and L2812, both
  unrelated).
- **Source:** B3 verification item 3; B3a E-6 (b); B3b E-5 (FA); B3b E-6 (FA); B4 p2
  E-14 (FA).
- **Depends on:** none. **Plan steps:** 4, 28 consume it.

#### R-13 — AD-18: which session `correct --missed-question` arms
- **Root cause:** RC-13
- **Change:** When `--session` is absent: read the open sessions; exactly one → arm it;
  several → refuse, list them in plain language (last activity time and working
  directory, never a bare id) and ask for `--session`; none → arm nothing and say so.
  Always print the armed session. Remove "the session with the most recent event".
- **Location:** AD-18, L2066–L2078 ("so it opens a question row in **the / session with
  the most recent event** (the newest `session_log` row by `seq`, / or the one named by
  `--session`)").
- **Source:** B5 verification item 7; B5a E-8 (FA), E-24; B4 verification item 7; B4
  p2 E-19; B4 p3 E-49 (e), E-39; B5b H1 E-18 (FA: raise AD-18 in §16).
- **Depends on:** none. **Consumed by:** R-83, R-53. **Plan steps:** 9, 34.

#### R-14 — AD-12 and L6: the grammar usability rule and the Lua/Swift cause
- **Root cause:** RC-7
- **Change:** Record the cause in place of the symptom: the packaged `tree-sitter-lua`
  2.1.3 scanner reads a `malloc` block it never initialised; the packaged
  `tree-sitter-swift` 0.4.3 scanner writes a 4-byte state into a zero-byte `calloc`; the
  0.25.10 runtime creates the scanner at every parse. Replace "a usable grammar is one
  that parses valid source correctly on repeated parses" with the cause-level rule: a
  grammar is usable when its scanner initialises its state in `create` and resets it in
  `deserialize` at length 0 (read from the packaged source), and its samples parse
  error-free. The loader takes a per-grammar WASM path from the table (the C-6 extension
  act). Any grammar still excluded keeps its table row, takes the generic frontend, and
  its exclusion and cause are recorded per language in `lang_capabilities` and `status`,
  never as `unknown`. Add the per-file runtime ERROR-tree signal.
- **Location:** AD-12 item 1, L1384–L1390 ("`lua` loads but, after its first parse in /
  a process, returns ERROR trees for valid source without throwing"); L6, L2958–L2966
  ("31 of 36 — `lua` parses once and then silently returns ERROR trees" … "a usable
  grammar is one that parses / valid source correctly on repeated parses, not once").
- **Source:** B9 verification item 1; B9 E-1, E-2, E-3, E-18, E-21.
- **Depends on:** none. **Consumed by:** R-15, R-69,
  R-119. **Plan steps:** 12, 15, 38.

#### R-15 — AD-25: allow vendored grammar WASMs
- **Root cause:** RC-7
- **Change:** Amend AD-25 to allow vendored grammar WASMs under provenance and checksum
  rules: Lua from `@tree-sitter-grammars/tree-sitter-lua` 0.4.1 (package, version,
  tarball integrity, sha256 checked at load, MIT notice); Swift 0.4.3 rebuilt once at
  vendoring time with `calloc(1, sizeof(struct ScannerState))` and a reset when
  `length < 4`, vendored with the patch, build command, sha256 and MIT notice, and the
  defect reported upstream. The runtime dependencies stay two; the package build stays
  `tsc` only; neither grammar is an npm dependency (C-3, AD-25 rule out install scripts
  and native builds).
- **Location:** AD-25, L2544–L2562 ("exactly `web-tree-sitter` + `tree-sitter-wasms`,
  **no postinstall scripts,", L2548).
- **Source:** B9 verification item 1; B9 E-1.
- **Depends on:** R-14. **Plan steps:** 1 (package), 15.

#### R-16 — AD-12 external rule and L6: resolver classes
- **Root cause:** RC-8
- **Change:** (a) A specifier whose package resolves inside the repository (an
  npm/pnpm/yarn workspace member, or a `workspace:`, `file:` or `link:` dependency) is
  never external. (b) Python: an absolute name is `external` only when its top-level
  name is in a vendored, version-stated `sys.stdlib_module_names` list or is a
  distribution the repository declares (`pyproject.toml`, `requirements*.txt`,
  `setup.cfg`); otherwise `unresolved`; the search roots are disclosed as a heuristic
  (or replaced by the declared Python roots), never called "Python's `sys.path[0]`
  rule". (c) TypeScript: for a written `.js`/`.jsx`/`.mjs`/`.cjs`, try the
  implementation (`.ts`/`.tsx`/`.mts`/`.cts`) and declaration (`.d.ts`/`.d.mts`/`.d.cts`)
  files first, in the handbook's order, then the written path. (d) Disclose in L6 that
  an over-broad external rule under-counts silently (the unsafe direction) and that the
  share does not detect it.
- **Location:** AD-12 item 1, L1405–L1415 ("*external* (a / platform builtin, or a
  package the repository declares as a dependency — for / TypeScript/JavaScript, a name
  in the nearest `package.json`'s dependency / fields"); L6, around L2983–L2985.
- **Source:** B4 verification item 5; B4 p2 E-3; B4 p3 E-22; B3b E-15; B9 verification
  items 3, 4; B9 E-29; B8a E-16.
- **Depends on:** none. **Consumed by:** R-70, R-121.
  **Plan steps:** 14, 15.

#### R-17 — AD-12: zone signals and their precedence
- **Root cause:** RC-17
- **Change:** (a) The tracked-and-ignored match is recorded as what it is — "tracked
  file matching ignore pattern `<pattern>` (`.gitignore:<line>`)", captured with
  `check-ignore -v` — and never sets `generated` on its own (it may corroborate a
  marker or path signal, or set `unknown` with the evidence shown); drop "commonly a
  generated one" unless sourced. (b) Order the zone signals marker → vendored →
  build_output → source. (c) State the anchoring rule with its source (for example
  `dist/`, `vendor(s)/`, `node_modules/` at any depth, per Linguist), and either anchor
  `build/` or record it as an unsourced heuristic with its false-positive class
  (`src/build/`). (d) A lockfile list that matches its stated rationale, and a sourced
  or removed evidence cut (200 characters). (e) Comment leaders derived per mapped
  language, and the `@generated` convention sourced (B8b E-8, FA).
- **Location:** AD-12 item 1, L1310–L1316 (zone classification list); the ignore-signal
  paragraph, L1335–L1345 ("a path it / prints is a `generated` zone signal" … "a
  committed file the project also ignores is commonly a generated one").
- **Source:** B3b E-12; B8 verification item 7; B8a E-9, E-21; B8b E-8 (FA); B4 p2
  E-2 (FA).
- **Depends on:** none. **Consumed by:** R-64, R-113. **Plan steps:** 14.

#### R-18 — AD-12: `test_map` capability, gitlinks, `readdir` symlinks
- **Root cause:** RC-18
- **Change:** A per-language `test_map` capability shown in `status` (Go same-directory
  mapping, Python absolute imports, any seeded language whose tests produce no edges),
  so the exit data does not read structural silence as a low floor; the walk's handling
  of gitlinks and other non-regular entries stated (skip, disclosed); a symbolic-link
  rule for the `readdir` branch (do not follow, or track visited real paths).
- **Location:** AD-12 `test_map` conventions, L1353 onward.
- **Source:** B3 verification item 5; B3a E-13; B3b E-16 (FA); B3b E-22 (M5 unapplied);
  B4 p2 E-18 (FA).
- **Depends on:** none. **Plan steps:** 14, 33.

#### R-19 — AD-12: incremental re-parse by dependency tracking, per-language fingerprint
- **Root cause:** RC-21
- **Change:** Restate S2 as dependency tracking: per importer, store every resolution
  query its resolver made (each candidate path probed and whether present; the path and
  content hash of the `package.json` the nearest-dependency lookup read; each top-level
  name queried and its answer) and re-resolve an importer when any stored answer would
  now differ. Store paths, not specifiers (AD-19). Drop "covers every input" and "name
  exactly" until that holds. The frontend fingerprint is per language (`{lang: entry of
  the frontend used}`), re-parsing only the changed languages' files. `version` is a
  content digest of the grammar WASM, the query and the frontend and resolver code.
- **Location:** AD-12 item 1, L1436–L1442 ("fingerprint) makes the pass full, and when a
  file appears or disappears the").
- **Source:** B8 verification item 4; B8b E-3, E-25; B8b E-4 (FA); B9 E-19.
- **Depends on:** none. **Consumed by:** R-65, R-115. **Plan steps:** 14, 15.

#### R-20 — AD-12 generic frontend: share, retry, binary cut, deny-list
- **Root cause:** RC-6
- **Change:** A fallback file of an `imports: true` language is counted in that
  language's share (a `parse_failed` count beside `resolved`/`unresolved`) and its
  content hash is marked so the next pass in which its grammar is available re-parses
  it. Source the binary-detection byte count (git uses 8000 bytes; "8 KB" has no source),
  enumerate the prose/data deny-list and state why it beats an allow-list, bound name
  length, and repair the broken C-6 sentence.
- **Location:** AD-12 item 1, L1393–L1397 ("a file with a NUL byte in its first 8 KB is
  binary"; "prose and data formats … listed in the").
- **Source:** B9 verification item 5; B9 E-16; B9 E-6, E-15, E-38 (FA).
- **Depends on:** R-14. **Plan steps:** 15.

#### R-21 — AD-19: identifier redaction scope is every frontend
- **Root cause:** RC-20
- **Change:** "a symbol name the parser captured as a declaration name" → "a symbol name
  any frontend (tree-sitter or generic) records as a declaration name". The indexer
  applies the rule for both, with the tuned `security.entropy_*` values.
- **Location:** AD-19, L2123–L2126 ("**An identifier is not free text:** a symbol name
  the parser captured as a / declaration name gets the pattern rules only").
- **Source:** B9 verification item 5 (last bullet); B9 E-39.
- **Depends on:** none. **Consumed by:** R-122. **Plan steps:** 14, 15.

#### R-22 — AD-13 and AD-14: the watermark per batch 5 ruling 1
- **Root cause:** RC-1
- **Change:** Replace every earlier watermark statement with ruling 1: the watermark is
  the `HEAD` resolved once at pass start, merge or not, keyed to the mined ref
  (`git symbolic-ref -q HEAD`, with a detached marker), written only in the pass's
  final transaction; chunk transactions write nothing to it; the pass records its range
  when it starts; the next range is `<tip>..<new HEAD>` (or `HEAD --not <tips>`); a
  crashed incremental pass re-runs its recorded range and skips hashes already in
  `commits`; a crashed full pass purges and re-mines; an incomplete pass leaves the
  previous tip. `historyStale` = "mined tip ≠ `HEAD`". Cite the executed merge and
  clock-skew cases (B5 verification) as the reason.
- **Location:** AD-13 refresh, L1531–L1548 ("each chunk advancing the watermark to its
  own last commit" L1532; "keeps the last chunk's watermark" L1538); AD-14 staleness,
  L1604–L1605 ("a history fact is / stale when `schema_meta.last_mined_commit` ≠
  `HEAD`").
- **Source:** B5 verification ruling 1 (which "replaces every earlier watermark
  statement", including B4 p2 E-1's chunk watermark) and item 1; B5b "The watermark
  rule", H1 E-9, H1 E-16; B7 verification item 1; B7a E-1; B7b E-13.
- **Depends on:** R-23 (the ref key). **Consumed by:**
  R-55, R-72, R-77, R-101. **Plan steps:** 13, 16, 28.

#### R-23 — AD-13: history-rewrite detection keyed to the mined ref; horizons
- **Root cause:** RC-2
- **Change:** Store `last_mined_ref` beside the watermark. On a pass: `git cat-file -e
  <watermark>`; exit 0 → `git merge-base --is-ancestor <watermark> HEAD`; exit 0 →
  incremental. Same ref and `--is-ancestor` exit 1, or same ref and `cat-file -e` exit
  1 → `history_rewritten` → purge and full re-mine. Different ref → a
  `branch_changed`-class diagnostic (`{oldRef, newRef, oldWatermark, newHead}`), with
  its cost stated (a full chunked pass; history genres silenced by
  `mining_in_progress`; the off-path lock hold) — or a recorded decision to mine a
  fixed ref. Any other status → a git fault, no purge. `git rev-parse --verify -q HEAD`:
  exit 1 is an unborn `HEAD` (nothing to mine, recorded); any other failure is a git
  fault and the pass fails visibly. Both horizons are enforced on every pass, not only
  a full mine; the mechanism is chosen by written comparison (see Part 4, gap G-1).
- **Location:** AD-13, L1552 ("History rewrite detected (watermark unreachable) → **one
  purge / transaction**").
- **Source:** B4 verification item 1; B4 p2 E-1; B4 p3 E-19; B5b ruling point 4; B7
  verification item 5; B7a E-10, E-16; B2 E-1 (a).
- **Depends on:** none. **Consumed by:** R-22, R-56,
  R-50. **Plan steps:** 6, 13.

#### R-24 — AD-13: recency weights per batch 5 ruling 2
- **Root cause:** RC-4
- **Change:** Replace the full-mine epoch `refTs − 500·h`, the "exponent > 1000 → purged
  re-mine" trigger and the 37-day floor with ruling 2: a store epoch kept near `refTs`
  and advanced in whole half-lives; when it advances, every `pair_weight` and
  `change_weight` is multiplied by the exact power of two in one transaction; rescaling
  runs in both directions (`refTs` can move back). No re-mine is needed to re-base. The
  only floor is underflow, stated as the relation `bar.recency_half_life_days ≥ 365.25
  × miner.horizon_years / 1022` (the normal-double limit; about 1.79 days at 5 years),
  refused by `tune` on a write to either key. State a read rule for a zero
  `change_weight` (no recency evidence reported as such, or terms that leave the normal
  range pruned with a recorded count) so the ratio is never `NaN`. `ts` is capped at
  `refTs` because the author date (`%at`) is settable by anyone, and capped commits are
  counted in a fault. `refTs` is untrusted: a `%ct` that is empty, non-decimal, or later
  than the wall clock by more than a stated tolerance is a fault; the pass then writes
  nothing (including `ref_ts` and the landmine rebuild) and leaves the watermark. Keep
  the automatic purged re-mine on a changed `h` (B5c E-3, keep; B6 verification item
  3: "changing h forces a re-mine") and the `weight_epoch`-absent purge trigger (B6a
  E-22). Cite ROSE only for weighting the mined changes; say the exponential half-life
  form and the ratio-against-floor comparison are the agents' derivation (B5a E-19).
- **Location:** AD-13, L1494–L1512 ("Each full mine sets the epoch to `refTs − 500·h` /
  days" L1501–L1502; "exceed 1000 makes the pass a purged full / re-mine" L1503–L1504;
  "`tune` still refuses `h` below 37 days" L1507).
- **Source:** B5 verification ruling 2 and item 2; B5c E-4; B5b H1 E-15; B7
  verification item 4; B7b E-6, E-10; B7c E-1; B5a E-19 (ROSE scope; its 37-day floor
  and "changed h triggers re-mine" are superseded/kept as above); B4 p3 E-23 (evidence
  weighting, adopted; its "stored form rescaled at read" is superseded by ruling 2).
- **Depends on:** none. **Consumed by:** R-54, R-57,
  R-103, R-99. **Plan steps:** 7, 12, 13, 16.

#### R-25 — AD-15: revert and fix labels
- **Root cause:** RC-5
- **Change:** (a) Add git's reference-format body line as a recognised revert line:
  `^This reverts commit [0-9a-f]{4,64} \(.+\)\.$`, multi-line, with the executed
  `git revert --reference` result as evidence. (b) Source the keyword vocabulary: adopt
  SZZ's regex with the citation, or keep the seven words as an architect's tunable seed
  with SZZ credited for the method only. (c) Word the HERZIG reason as tangled commits
  inject noise and large commits are mostly perfective. Keep the settled order (reverts
  before the size exclusion; fix keywords on included commits only — B3 verification).
- **Location:** AD-15 "The labels", L1783–L1806 (trailer rule L1784–L1786; seed and
  "Source: / the SZZ keyword heuristic … which / matches keywords as words" L1792–L1798).
- **Source:** B7 verification item 5; B7a E-17; B3 verification item 4; B3b E-14; B3b
  E-25 (FA); B2 E-2 (FA: G1's list differs from SZZ's regex).
- **Depends on:** none. **Consumed by:** R-38, R-60.
  **Plan steps:** 12, 13.

#### R-26 — AD-14: confidence for structural facts
- **Root cause:** RC-18
- **Change:** Define structural-fact confidence (Orientation, Reuse, Verification's
  mapping), or state the gap in AD-14; the bar must not read `ratio` for a class whose
  confidence AD-14 has not defined; no silent constants.
- **Location:** AD-14 item 1, L1600–L1606 (confidence defined for history facts and
  human facts only; index-derived facts get only a staleness rule).
- **Source:** B2 verification item 4; B2 E-5 (b), E-6.
- **Depends on:** none. **Consumed by:** R-72, R-74. **Plan steps:** 16, 18.

#### R-27 — AD-14: the noise floor against the settled label order
- **Root cause:** RC-18
- **Change:** Replace the premise that no hazard is sourced solely from an excluded
  class with the rule actually built (size-excluded reverts may source a `revert_chain`;
  merge and horizon exclusions never label), and resolve AD-14's noise-floor clause
  ("not sourced solely from an excluded-commit class") against it: implement that half
  of the floor or change the clause, with the reason. Batch 2 required the noise floor
  to be fully implemented together with the label-order change (B2 E-1 (c), E-5 (g)).
- **Location:** AD-14 hazard path, L1676–L1679 ("`support ≥ 2` and not sourced solely
  from an excluded-commit / class").
- **Source:** B4 p2 E-4; B2 E-1 (c), E-5 (g); B3 verification "Ruling on the recorded
  challenge to batch 2".
- **Depends on:** R-25. **Consumed by:** R-72. **Plan steps:** 16.

#### R-28 — AD-14: tuning-seed status and the stored-set check
- **Root cause:** RC-11
- **Change:** Add the stored-set ordering check at reader construction (on a violating
  stored set, record a fault and serve the seeds). State that the 0.9
  `bar.untrusted_trust_factor` seed is an architect's illustrative default with no
  literature grounding, calibrated on Phase A data. Add `bar.stale_factor` and
  `bar.hazard_full_support` to AD-14's tunable-row list as seeds with their status.
- **Location:** AD-14 item 1, L1607 (`bar.stale_factor` "(seed 0.9)"), L1616
  (`bar.untrusted_trust_factor` "(seed 0.9, in (0, 1])"), L1628–L1640 (tier invariant
  and `tune`'s refusal; no stored-set check), L1680 (`bar.hazard_full_support`).
- **Source:** B3 verification item 6; B3b E-13; B4 p1 E-17; B5 verification item 13
  (seeds); B5a E-20, E-22 (FA); B5b H1 E-15.
- **Depends on:** none. **Consumed by:** R-54, R-99.
  **Plan steps:** 12.

#### R-29 — AD-14: the single-file history hazard class
- **Root cause:** RC-24
- **Change:** Ground the single-file case on FR-A5a (the hazard path's only floor is the
  noise floor, so the marginal axis may not fail a hazard). Drop "the same aggregation
  clause that admits a Reuse dominance claim" for single-file counts (a file's revert
  count is one `git log` call), or limit it to cross-file history; if fix-chatter is
  claimed under it, say why a whole-token lexicon classification is not "a bare count
  one grep returns".
- **Location:** AD-14 marginal-value axis, L1662–L1672 ("they / aggregate over commits the agent has not enumerated (the same aggregation / clause that admits a Reuse dominance claim)", L1666–L1668).
- **Source:** B5a E-21; B5a E-6 (FA, amended by E-21); B5b H1 E-10.
- **Depends on:** none. **Plan steps:** 16.

#### R-30 — AD-15: Coupling's symmetric key and partner-level drop
- **Root cause:** RC-18
- **Change:** (a) Correct the reason for the canonical key: the two directions share
  the pair and the commit pointer but not the ratio. Make the delivered fact symmetric —
  the one whisper renders both ratios (`pair_count / change_count(a)` and `pair_count /
  change_count(b)`) — or record that the second direction's ratio is withheld after the
  first delivery and why that does not change the agent's decision. (b) A partner that
  is not in the tree or is masked (other than the agent's own target) is removed from
  the fact — name, ratio and pointer — and a candidate left with no partner is dropped
  and counted as `whisper_dropped_unverifiable` with its reason.
- **Location:** AD-15 subject keys, L1881–L1891 ("the same co-change claim (only the /
  confidence denominator differs)", L1889–L1890); rumor rule, L1730–L1743 (`in_tree =
  0` partners are excluded "from pointers" only).
- **Source:** B3 verification item 8; B3b E-17; B3b E-11; B4 p2 E-6 (FA).
- **Depends on:** none. **Consumed by:** R-74, R-75, R-86.
  **Plan steps:** 18, 19, 38.

#### R-31 — AD-15: command separators include newline and `&`
- **Root cause:** RC-19
- **Change:** The command-class split treats a newline and `&` as command separators
  (executed on GNU bash 5.2.21), and a heredoc is class 3 wholesale or parsed.
- **Location:** AD-15 genre table, Verification row, L1753 ("the command line is split
  on `&&`, `;`, `\|`, `\|\|`").
- **Source:** B2 verification item 3; B2 E-5 (h).
- **Depends on:** none. **Consumed by:** R-73, R-123. **Plan steps:** 17.

#### R-32 — AD-15: whose edit set Completeness reads
- **Root cause:** RC-13
- **Change:** State whether the Completeness edit set is read per consumer or per
  session, since a subagent's edits made for the main agent would otherwise be invisible
  to the main agent's Completeness whisper.
- **Location:** AD-15 genre table, Completeness row (the section exists; line not
  pinned).
- **Source:** B3a E-9 (correction-pass item).
- **Depends on:** none. **Plan steps:** 18.

#### R-33 — AD-16/AD-17: report an empty read-set rebuild
- **Root cause:** RC-14
- **Change:** Add `rebuild_recovered_nothing` for `set = 'read'` when a fork/resume
  rebuild finds file-tool results and admits none. Name the unestablishable cases: an
  unpaired `tool_use`, and a `tool_result` whose `tool_use_id` matches nothing.
- **Location:** AD-16, L1907–L1918 (the fault is written with `detail_json.set =
  "delivered"` only, L1909); AD-17 fault list, L1993, L2046.
- **Source:** B4 verification item 3; B5 verification item 8; B5a E-17; B5a E-27;
  B5b H2 E-5, E-6.
- **Depends on:** none. **Consumed by:** R-50, R-76. **Plan steps:** 6, 21, 28.

#### R-34 — AD-5: import, purge, the replica, and the exit-run read
- **Root cause:** RC-15
- **Change:** (a) State what `deinit --purge` does to the project's `whisper_stats`
  replica rows (delete them, or keep them labelled as last published totals in
  `status`) so AD-5 and AD-20 agree. (b) Import refuses a temporary copy whose schema
  checksums differ (R-35) or whose `repo_key` mismatches, including the
  keying-mode override case. (c) The live bindings are merged into the validated
  temporary store before the `backup()` step, so the backup preserves them; the
  phase-2 copy is stated; a crash is detected at the next run from surviving
  `.import-tmp` files; the write order carries its reason. (d) Global import reports
  both the imported bindings whose roots are missing and the live bindings the replace
  removed. (e) A key- or home-addressed read form (`status`/`log` naming the store by
  key or home path) reads an imported store with no live binding; `init` is not used
  for it.
- **Location:** AD-5, L846–L858 (`deinit --purge`, "removes that project's", L857); import order, L862–L874; global-import binding merge, L875 onward.
- **Source:** B3 verification item 7; B3b E-8, E-10; B4 p3 E-4, E-49 (f); B5 item 9;
  B5a E-5 (FA), E-23; B5b H2 E-18 (FA).
- **Depends on:** R-35. **Consumed by:** R-81, R-82.
  **Plan steps:** 32, 33, 39.

#### R-35 — AD-4/AD-5/AD-20: the store schema check (checksums)
- **Root cause:** RC-9
- **Change:** When a migration runs, store a checksum of each migration file's content
  in `schema_meta`/`global_meta`. On every open (CLI verbs, the hook path, `import`),
  compare them with the shipped files; on any difference, or a store with a version and
  no checksums, refuse the open: record a fault; the hook path emits nothing (the agent
  is not blocked); the CLI prints a plain message that the store was built by an older
  build, what `ctxoracle deinit --purge` deletes, and that `init` rebuilds it. No
  automatic purge, no silent re-migrate. This supersedes batch 4's "new `schema_version`
  value or fingerprint" (B4 p1 E-5) and B6a E-11's "version guard".
- **Location:** not stated in the architecture at `HEAD`; the code it governs is
  `src/stores/migration_runner.ts` L60, L74, L79, L82 (see R-92).
- **Source:** CR§1; B4 verification item 4; B4 p1 E-5; B6a E-11.
- **Depends on:** none. **Consumed by:** R-34, R-51,
  R-52, R-92. **Plan steps:** 3, 7, 8, 28, 31, 32.

#### R-36 — AD-26: the inter-chunk yield, the write bound, the waits
- **Root cause:** RC-3
- **Change:** (a) An off-path pass releases the write lock between write transactions
  for at least 25 ms — derived from SQLite's default busy handler, whose attempts under
  a 100 ms `busy_timeout` fall at 0, 1, 3, 8, 18, 33, 53, 78 and 100 ms — seeded as a
  `miner.chunk_gap_ms` tuning row with a margin, and pinned by a concurrency fixture in
  which a handler audit write during a synthetic pass must succeed (executed: 25 ms →
  15/15; 0 ms → 1/15). Also the index pass (B8a E-17). (b) Bound every write
  transaction of a pass, chunked or not, below the waiter's roughly 100 ms first-try
  window, checking elapsed time before each write; state the measured cost (about +50%
  pass time, 98.2 s → 148.4 s). (c) Correct the reason: a no-gap writer starves SQLite's
  sleeping, unordered busy handler; one short write group does not. (d) Derive the
  off-path `busy_timeout` from the handlers' bounded write activity (the effective wait
  is two periods under the retry-once, about 10 s at 5000), or drop it to the default.
  (e) Replace "The handler never waits on it" with the actual rule (every handler write
  waits on the write lock up to the busy bound). (f) `mining_in_progress` is listed
  among `status`'s active suppressing conditions, its suppressed events counted and
  excluded from FR-M3's "silence was the bar" line (also in AD-23's inventory
  sentence). (g) Drop the "half the `busy_timeout`" rationale for the chunk seed.
- **Location:** AD-26, L2564 onward; "The handler never waits on it", L2586; the claim
  row, L2579–L2586; `mining_in_progress`, L2626; AD-17 suppressing conditions, L2026.
- **Source:** B3 verification item 2; B3b E-7; B3a E-17 (its ~200 ms bound is
  tightened to ~100 ms by B8a E-17); B4 p1 E-2; B5 item 4; B5a E-10; B7 verification
  item 7; B7b E-21; B7c E-5; B8 verification item 6; B8a E-17.
- **Depends on:** none. **Consumed by:** R-46, R-61,
  R-68, R-107. **Plan steps:** 3, 12, 13, 14, 33.

#### R-37 — AD-26: stale recovery of the reindex claim
- **Root cause:** RC-28
- **Change:** Keep the atomic claim through SQLite's single writer. Resolve stale
  recovery in AD-26 by written comparison: an OS-released lock on a separate SQLite
  database (reproduced as released on `SIGKILL`), with `status` reading the start time
  from a committed row; or pid-liveness reclaim stated with its pid-reuse and `EPERM`
  cost and why it is preferred. The choice is not settled (Part 4, gap G-2).
- **Location:** AD-26 claim row, L2579–L2586.
- **Source:** B5 verification ruling 4 and item 4; B5a E-10.
- **Depends on:** none. **Plan steps:** 14, 31.

#### R-38 — Standards table: the SZZ and git rows
- **Root cause:** RC-24
- **Change:** The SZZ row credits SZZ with what it supplies (the method and, if
  adopted, its regex); the git row says the trailer is execution-backed (git-revert(1)
  documents only the `Reapply` subject) and no longer names the dropped `.gitignore`
  signal as dropped.
- **Location:** "Standards governing this architecture", L3085–L3107 (SZZ row L3099).
- **Source:** B3a E-18 (FA); B3b E-14; B3 verification item 9.
- **Depends on:** R-25.
- **Plan steps:** none.

#### R-39 — "Executed" claims that were code-read
- **Root cause:** RC-23
- **Change:** Mark the cross-session deny and the cross-session/cross-subagent silencing
  as executed, and the byte-offset misread and the `startup` clearing as code-read, as
  the review records them; make the fold section's "executed" claim match "N11 not
  executed" (N11 and G23(c) reasoned from code).
- **Location:** the `0fab6d7` hunks h15 (AD-9/AD-16 consumer key) and h16 (AD-5 fold);
  not pinned by line at `HEAD`.
- **Source:** B3 verification item 9; B3a E-9; B3a E-12.
- **Depends on:** none.
- **Plan steps:** none.

#### R-40 — AD-13: one meaning of "support"; ROSE's term
- **Root cause:** RC-24
- **Change:** Call `change_count` the frequency of A (ROSE's term) or drop the "support"
  label from it; state when an unreferenced `in_tree = 0` row is removed and by which
  pass.
- **Location:** AD-13, L1494 (`support = pair_count`) and the `change_count`
  definition; no "frequency" term exists in the architecture at `HEAD` (grep).
- **Source:** B3 verification items 5 and 8; B3a E-7; B4 p2 E-1 (FA).
- **Depends on:** none. **Plan steps:** 13.

### 2.3 Plan — `docs/plans/plan-phase-a.md`

Engineering items (OL-11). The plan has 40 steps at `HEAD` (Step 40 is "Post-completion
housekeeping", L7526); this register's step table (Part 3) covers Steps 1–39 as asked,
with Step 40 noted. Plan items that follow an architecture item are the "plan follows in
a separate pass" half of the plan's own §16 item 5 rule, so each lists the architecture
item it depends on.

#### R-41 — §2 and summary: the miner's chunking carries its yield
- **Root cause:** RC-3
- **Change:** State the miner's chunking as chunks separated by the ≥ 25 ms inter-chunk
  yield, so the summary does not restate the lock bound without the mechanism that makes
  it hold.
- **Location:** plan §2 (Scope), L142 ("`miner.chunk_ms` chunks off-path, single `BEGIN
  IMMEDIATE` on the project").
- **Source:** B4 p1 E-2 (FA, not re-ruled).
- **Depends on:** R-36. **Plan steps:** 13.

#### R-42 — §3: source the interface segregation principle
- **Root cause:** RC-24
- **Change:** Name the source (Martin, *Agile Software Development: Principles,
  Patterns, and Practices*, 2002, ch. 12, or the 1996 C++ Report article).
- **Location:** plan §3, L353 ("the interface segregation principle (a component
  receives the narrow").
- **Source:** B4 verification item 12; B4 p1 E-3 (FA).
- **Depends on:** none.
- **Plan steps:** none (§3).

#### R-43 — §7 build-order contract: red state, CI, rule (c), tuning line
- **Root cause:** RC-25
- **Change:** (a) State the red state for a test over an export the step adds: the
  recorded missing-export diagnostic (`TS2305` at build, or the ESM link `SyntaxError`
  at run) is the red run, or the test writer adds a declared throwing stub for each new
  `provides` export so the test fails at its assertion; the "Fails when" reason is
  verified only where the export exists. (b) State that the suite and CI are red from a
  step's test commit until its code lands, and that a red run for any other reason is a
  defect. (c) Reword rule (c): the step that *builds out* a fixture scenario declares
  `modify: …/test/fixtures/generate.ts` and names the fixture; a later step that only
  consumes it declares nothing. (d) The tuning-convention line "a missing key is
  re-seeded by the reader" follows R-54 (no write on the event path).
- **Location:** plan §7 contract, L1045–L1082 (red state, L1064–L1074; tuning line,
  L1082 "key is re-seeded by the reader and recorded as `tuning_missing`"); rule (c),
  L1239.
- **Source:** B4 verification item 9; B4 p1 E-6, E-7; B5b H1 E-5 (FA).
- **Depends on:** R-54. **Plan steps:** all (contract), 1 (rule c).

#### R-44 — §6 Foundation corrections and Step 7/8: the migration-edit record
- **Root cause:** RC-9
- **Change:** Remove the "no store has shipped" premise (CR§1: "an unverified premise,
  and the check no longer depends on it") and the sentence "The runner
  (`applyMigrations`) is unchanged"; state the checksum check of R-35 as the
  runner change, with Step 3/8's open paths refusing a store whose stored migration
  checksums differ, and its tests (a store stamped by the `de66831` migrations is
  refused on every open path; a one-byte edit to any migration file is refused; the
  message names the recovery). §6's justification of the in-place edit rests on that
  premise and on no cited criterion (B4 p1 E-5 asked for the Rails editing criterion plus
  the executed checks, and for the premise to be stated as unverifiable); Max Cogar's
  answer recorded in CR§1 ("yes i used that before") now contradicts the premise — see
  Part 4, conflict C-1, on whether the in-place edit may stand.
- **Location:** plan §6, L984–L988 ("No store has shipped to any user … so migrations
  001, 001b, and 002 are / **edited in place**"); Step 7 build delta, L2361–L2363
  ("Migrations 001 and 001b are edited in / place to the DDL above (§6: no store has
  shipped)"); L2415 ("The runner (`applyMigrations`) is unchanged.").
- **Source:** CR§1; B4 verification item 4; B4 p1 E-5, E-13; B6a E-11.
- **Depends on:** R-35. **Consumed by:** R-92. **Plan steps:** 3,
  7, 8, 28, 31, 32.

#### R-45 — Step 1: fixtures and the generator
- **Root cause:** RC-22
- **Change:** (a) `pristine-tree` is not `T-38`-only (T-31-1, T-32-1 and the Step 28
  default use it): state its scenario (Step 1's single-commit baseline is its whole
  scenario and the corpus-floor rule does not apply) or remove it from the "only a
  `T-38` replay uses" list. (b) Record in delta (b) that "single-commit baseline" does
  not apply to the non-git fixture `indexer-nongit` (a plain directory). (c) Correct
  "Seven fixture names are" / "grows by these seven" (builder flaw 5, unapplied).
  (d) The fixture `git` helper and both inline `env` objects remove `GIT_DIR`,
  `GIT_WORK_TREE`, `GIT_INDEX_FILE`, `GIT_OBJECT_DIRECTORY`, `GIT_COMMON_DIR`,
  `GIT_CONFIG_COUNT`, `GIT_CONFIG_PARAMETERS` and every `GIT_CONFIG_KEY_*`/`VALUE_*`,
  with a test that generation under a set `GIT_DIR` leaves the named repository's
  configuration unchanged. (e) The human transcript entry's `message.content` is a
  string (the observed shape). (f) A per-name expected `rev-list --all` literal (or a
  child-process second generation) so a per-process date seed fails.
- **Location:** Step 1, L1104; delta (b), L1232–L1238 ("(b) Seven fixture names are",
  L1232; "grows by these seven", L1238); the "only a `T-38` replay uses" list is in Step
  38, L7123–L7126 (names `pristine-tree`); `pristine-tree` is also used at L5819 (Step
  28 default) and L6495 (`T-31-1`).
- **Source:** B4 verification item 12; B4 p3 E-2; B6b E-3; B6c E-1 (builder flaw 5
  unapplied at L1232/L1238); B7 verification item 6; B7a E-21; B6b E-1, E-4 (FA).
- **Depends on:** none. **Plan steps:** 1; consumed by 13, 28, 31, 32.

#### R-46 — Step 3: transaction errors, `ENOTDIR`, busy timeouts
- **Root cause:** RC-6
- **Change:** (a) The automatic-rollback list is the page's four codes: `SQLITE_FULL`,
  `SQLITE_IOERR`, `SQLITE_INTERRUPT`, `SQLITE_NOMEM` (not `SQLITE_BUSY`). (b) A failing
  statement at depth > 0 rethrows its own error after marking the handle aborted, and
  every later statement throws `TransactionAborted`. (c) On a failed `ROLLBACK` at depth
  0: throw with the original error as `cause` and put the handle into a non-clearing
  broken state (every later `prepare`, `exec`, `transaction`, `integrityCheck`,
  `exportTo` throws) or close it. (d) `ENOTDIR` throws `StoreUnreadable` with its errno
  (an existing non-directory component is a layout problem), leaving `ENOENT` alone as
  missing. (e) Add the `node_sqlite.cc@v22.16.0` citation beside the executed evidence
  for the URI open. (f) `busyTimeoutMs`: correct the reason per R-36 (c); the
  off-path value is derived (R-36 (d)). (g) `T-3-5`: a direct-statement case
  (too-large insert at depth 1, caught, followed by another insert → `TransactionAborted`
  at depth 0, no rows); the broken-state case (injected fault); (e)'s arrangement
  executable (outer holds the lock, another process blocked, inner never retries);
  `g2` asserts `StoreUnreadable` with `errno: 'ENOTDIR'`; the directory and permission
  cases; `T-3-5i2` covers `integrityCheck` and `exportTo` or narrows its title;
  `busyTimeoutMs` read back from `PRAGMA busy_timeout`, and `1.5`/`-1` throw
  `RangeError` while `0` is accepted.
- **Location:** Step 3, L1382; rollback list, L1443–L1445; `ENOTDIR` → `StoreMissing`,
  L1479; `busyTimeoutMs`, L1464–L1471.
- **Source:** B6 verification item 4; B6c E-13, E-20, E-30; B6c E-11 (FA); B5b H1 E-6
  (FA); B4 p1 E-8; B4 p3 E-10 (FA); B7b E-21; B7c E-13.
- **Depends on:** R-36. **Consumed by:** R-93. **Plan steps:** 3;
  consumed by 13, 14, 28, 32.

#### R-47 — Step 4: `ensureHome` creates no `global/`
- **Root cause:** RC-10
- **Change:** The helper the handler calls on the miss path creates only `<home>/` and
  `<home>/diagnostics/`; `global/` is created by `ensureLayout`, `init` and `import`, so
  Step 4, §6 and `T-28-7(e)` agree. `T-4-1a2` asserts `ensureHome` alone creates no
  `global/` (and no `projects/`); `T-4-1c` drops its `global/` assertion; add a loose
  directory at 0o750. Give the ancestor rule a plan sentence and remove or re-title
  `T-4-1d` (it cannot fail on the m3 defect).
- **Location:** Step 4 delta, L1591–L1603 ("— creates `<home>/`, `<home>/global/`, and
  `<home>/diagnostics/` at `0o700`", L1592).
- **Source:** B6 verification item 7; B4 p1 E-9; B6a E-2 (FA); B6b E-8; B6c E-28 (FA);
  B5b H2 E-31 (FA).
- **Depends on:** R-12. **Consumed by:** R-94. **Plan steps:** 4; consumed by 28, 31, 32.

#### R-48 — Step 5: path exclusion reason, spawn wrapper cases
- **Root cause:** RC-6
- **Change:** (a) In Step 5's *Why*, give the non-UTF-8 exclusion its own backing and
  comparison: FR-D1's verifiable-pointer rule and the UTF-8-only hook channel (RFC 8259
  §8.1) make a non-UTF-8 name unaddressable; a `BLOB`-keyed row would keep a row no
  whisper may name; excluding and counting under `path_not_utf8` keeps the
  under-coverage visible (OL-10). POSIX/WHATWG back only "refuse, don't substitute".
  (b) `T-5-4` fails when `splitNul(a\0b\0)` is not exactly `[a, b]`, when the empty
  buffer is not `[]`, and when `café.txt` decodes to anything else; add the `0x5c`
  (`\x5c`) datum and, with the `ignoreBOM` decision, a BOM-prefixed name. (c) `T-5-5`:
  a missing command throws; a child writing past a small `maxBuffer` makes
  `oracleRunSync` throw with `code === 'ENOBUFS'`. (d) `oracleSpawn` throws when
  `detached: true` is combined with `stdout: 'pipe'` or `stderr: 'pipe'`; R-11 legs pin
  the piped stderr and the refusal.
- **Location:** Step 5, L1644; exclusion, L1741; `splitNul`, L1733; `T-5-4` at
  L11114–L11123.
- **Source:** B4 p1 E-10; B4 p3 E-12; B6 verification item 5; B6c E-7; B6b E-7, E-9
  (FA); B7 verification item 8; B7c E-4.
- **Depends on:** none. **Consumed by:** R-95. **Plan steps:** 5; consumed by
  13, 14.

#### R-49 — Step 6: consumer key, headline slots, reader contract
- **Root cause:** RC-13
- **Change:** (a) `consumerKey` throws on a session id containing `#`, so the first-`#`
  rule is injective; the module header states the premise; `T-6-4` gains
  `consumerKey('a#sub:b')` throws, `consumerRole('s1#main#x')` throws, an agent id
  containing `#` reads `subagent`, and positive `consumerRole('s1#main')` = `main`,
  `consumerRole('s1#sub:ag1')` = `subagent`. (b) `slot.human` accepts only a branded
  human-text value that a provenance-checked read produces (`prov_kind === 'human'`), or
  takes the row's provenance and throws on any other kind; `T-6-3` gains a must-fail
  fixture passing a plain `string`. (c) `TuningReader`'s contract: on a missing key it
  serves the seed and records `tuning_missing` without writing on the event path;
  re-seeding happens only on a writable verb run (`init`, `tune`, `status`). (d)
  `ObservedActionsReader.firstHash`: give it a consumer and a test, or remove it from
  Step 6's reader, Step 9's DAO table, both `provides:` lists and the omissions list, and
  record which.
- **Location:** Step 6, L1806; `consumerKey`, L1926–L1928; reader, L1973–L1978
  (`firstHash(path)`, L1976); `TuningReader` re-seed sentence, L1834.
- **Source:** B6 verification items 1, 6; B6a E-6, E-7, E-8; B6b E-6, E-18; B6c E-3;
  B4 p3 E-14; B4 p2 E-21; B5b H2 E-12; B6a E-9 (FA).
- **Depends on:** none. **Consumed by:** R-96, R-97,
  R-99. **Plan steps:** 6; consumed by 9, 12, 18, 19, 28.

#### R-50 — Step 6: fault codes and detail shapes
- **Root cause:** RC-6
- **Change:** Add a `branch_changed`-class code (R-23); a git-fault
  code for the miner if Step 13's handling introduces one; widen
  `rebuild_recovered_nothing`'s `set` to include `'read'` (R-33); a code for
  a failed `index`-verb git read (the error channel, R-63); a code for a
  non-`ENOENT` directory error in the walk (R-63); the `after: <last valid
  header>` attribution in the miner fault's detail shape (R-59). Drop
  the reason "a new code is not added". The `T-6-1` literal and its count change in the
  same change.
- **Location:** Step 6 fault list, L1899–L1921 (`rebuild_recovered_nothing`'s "carries
  `set: 'questions'|'delivered'`", L1921).
- **Source:** B6 verification item 8; B6a E-5 (FA); B6b E-5; B7b E-13, E-14, E-24; B8b
  E-7.
- **Depends on:** R-23, R-33. **Plan steps:** 6; consumed
  by 13, 14, 21, 28, 31.

#### R-51 — Step 7: DDL comments, the key registry, the skeleton sentence
- **Root cause:** RC-25
- **Change:** (a) Move the `schema_meta` key registry out of Step 7's `001` DDL block
  into one home no applied migration carries (a DAO key constant, or Step 14's text), so
  the block matches the shipped `001`; the same for every key line added after `001`
  shipped (`indexing_in_progress` is one). Word `frontend_fingerprint` per the
  per-language rule (R-19). (b) The fallback-table comments say "written
  only under `fts_state = 'fallback'`". (c) The `weight_epoch` comment follows ruling 2
  (R-24). (d) Correct "The one skeleton statement this schema breaks at
  run time" — the indexer's and `search.ts`'s FTS column breaks were also run-time
  breaks (the §9 stop applied: `PREMISE-FALSE` for `indexer.ts`,
  `BLAST-RADIUS-EXCEEDS-PLAN` for `search.ts`).
- **Location:** Step 7, L2085; key registry, L2134–L2140 (`weight_epoch` comment,
  L2136–L2138); fallback comments, L2313 and L2319 ("written by the indexer in both FTS
  states (Step 14)"); L2415–L2417 ("The one skeleton statement this / schema breaks at
  run time").
- **Source:** B8 verification item 12; B8b E-16; B5c E-2; B6a E-10, E-15 (FA); B6a E-23;
  B6c E-18 (FA); B5b H1 E-12, E-13 (FA).
- **Depends on:** R-10, R-24, R-19. **Plan steps:** 7; consumed by 13, 14.

#### R-52 — Step 8: global-store migration checksums
- **Root cause:** RC-9
- **Change:** The global store records per-migration checksums in `global_meta` and is
  refused on mismatch, as R-35.
- **Location:** Step 8, L2485.
- **Source:** CR§1.
- **Depends on:** R-35. **Plan steps:** 8.

#### R-53 — Step 9: DAO surface and its tests
- **Root cause:** RC-13
- **Change:** (a) Narrow "Every per-session reader takes the consumer" to "every reader
  backing `ObservedActionsReader` takes the consumer", or re-sign/remove `okEdits` and
  `okReads` (no caller) — recorded at the line; the table row changes with it.
  (b) Remove `latestSession()` from the DAO and `provides:` when Step 34 arms by
  `livenessRows(open = true)` (R-83); keep `hasEnded` only if still read.
  (c) `writtenSinceSeq(path, sinceSeq, uptoSeq)` with a `T-9-1` case where a row above
  `uptoSeq` is not counted — or state that `maxSeq()` and every path query run in one
  read transaction and pin it in `T-30-1`. (d) `ensureHistoryRow` takes the commit hash
  and writes it as `prov_ref`. (e) `whisper_audit.append` takes a discriminated input: a
  `kind: 'whisper'` row requires `subject_key`, a `kind: 'deny'` row forbids it, with a
  runtime throw as backstop. (f) `pathWrites` filters `outcome = 'ok'` (or records why
  not) and takes the consumer. (g) `T-9-1`: an `ok` Edit by another session and by
  another consumer of the same session are excluded from `okEditedPaths(s1, s1#main)`; a
  same-text `deny` row `subjectKeyForText` must not return; the tool partition (an `ok`
  Read after `s = maxSeq()` leaves `writtenSinceSeq('a.ts', s)` false); miner landmine
  rows inserted before the human row; the `whisper_audit` negative cases; drop the
  `firstHash` pin unless Step 9 gives it a consumer. (h) `T-9-2`: one `prov`-naming
  diagnostic asserted per call line (or one fixture per writer); the Data line "Fails
  when the fixture compiles" changes to that per-call form.
- **Location:** Step 9, L2549; table row, L2588; sentence, L2689–L2691 ("Every
  per-session reader / takes the consumer"); `writtenSinceSeq`, L2693; `latestSession`,
  L2698; `ensureHistoryRow`, L2628.
- **Source:** B6 verification items 6, 8; B6c E-16; B5b H2 E-14, E-17; B6a E-12, E-13,
  E-14, E-16 (FA); B4 p3 E-17; B6b E-14, E-19; B2 E-5 (f).
- **Depends on:** R-13. **Consumed by:** R-98. **Plan steps:** 9;
  consumed by 13, 18, 28, 30, 34.

#### R-54 — Step 12: the tuning reader, validator and seeds
- **Root cause:** RC-11
- **Change:** (a) The event-path reader serves the seed and calls `onMissing` without
  writing; re-seed only on a writable verb run. (b) The stored-set ordering check at
  reader construction: on a violating stored set, record a fault and serve the seeds
  (a stored `bar.suspect_confidence_cap` above `bar.high_confidence_min` is the test
  case). (c) Replace `bar.recency_half_life_days ≥ 37` with the relation `h ≥ 365.25 ×
  miner.horizon_years / 1022`, refused on a write to either key. Keep
  `tuningWriteNotice` (a changed `h` forces a re-mine). (d) `checkTuningWrite` refuses
  a scalar write that names a list key (`refused: <key> is a list; use +<v>/-<v>`).
  (e) Seeds: `bar.untrusted_trust_factor` 0.9 marked unsourced; `bar.stale_factor` and
  `bar.hazard_full_support` marked seeds; `lexicon.fix_keywords` follows
  R-25; `miner.chunk_ms` and a `miner.chunk_gap_ms` seed follow
  R-36. (f) Do **not** add a `bar.untrusted_trust_factor ≥
  bar.high_confidence_min` clause (B4 p1 E-17). (g) Step 12's grammar seed table follows
  R-69 (`.lua=lua` restored). (h) Tests: split `T-12-2b` (event path:
  seed served, `onMissing` once, no row; verb run: row re-seeded) and `T-12-2e` the same
  way; re-value the three half-life cases to the relation's boundary; the tier-invariant
  equality datum; the list-key miss; the stored-set case; the list-key scalar refusal
  case; the `≥ 37` clause goes.
- **Location:** Step 12, L2921; seeds, L2955–L2957, L3064, L3076; validator,
  L3032–L3054 ("and `bar.recency_half_life_days ≥ 37`", L3038; "365 ≥ 37", L3054);
  §11.4, L10716; §12 case at L13692.
- **Source:** B4 verification item 4; B4 p1 E-17; B4 p3 E-18 (FA); B6 verification
  item 3; B6a E-17, E-18 (FA); B6b E-16; B6c E-12, E-17 (FA), E-25; B7b E-6; B9 E-2.
- **Depends on:** R-28, R-24. **Consumed by:**
  R-99. **Plan steps:** 12; consumed by 13, 16, 28, 33.

#### R-55 — Step 13: watermark and pass completion per ruling 1
- **Root cause:** RC-1
- **Change:** Delete "sets `schema_meta.last_mined_commit` to the chunk's newest commit"
  and the premise that every commit at or before the watermark is written. The watermark
  is `HEAD` resolved at pass start, keyed to the mined ref, written only in the final
  transaction; the pass's range is recorded when it starts; a crashed pass re-runs that
  range skipping hashes already in `commits` (`commits.exists` gains its caller); an
  incomplete pass leaves the previous tip and its recorded range. Tests: `T-13-5` gains
  a merge-at-boundary case (e) and a skewed parent/child case (f) (fail when any
  `pair_count`, `pair_weight`, `change_count` or `change_weight` differs from one
  uninterrupted mine, or any commit is absent from `commits`); (d)'s re-read clause
  becomes "the completed store differs from a single uninterrupted mine, or any commit's
  counts are applied twice"; crash timing is taken from the `commits` row count; (b)
  is an incremental continuation stopped after a main-branch chunk on the branching
  shape; (d) asserts the completing pass's `commitsSeen` against the range. `T-13-6e`
  gains the middle-commit incremental case and a full-pass case with a middle commit
  unreadable/header corrupted (the watermark is not `HEAD`, and the next pass recovers
  every commit), and stops asserting the per-chunk watermark.
- **Location:** Step 13, L3140; chunk watermark, L3379–L3390; completeness fault,
  L3486; crash rule text near L3567.
- **Source:** B5 verification ruling 1, items 1, 12; B5b H1 E-16, H2 E-32; B4 p3 E-19;
  B7 verification items 1, 9; B7a E-1, E-3, E-4, E-5, E-23, E-24 (FA); B7b E-3, E-13,
  E-19; B7c E-1, E-11.
- **Depends on:** R-22, R-56. **Consumed by:**
  R-101. **Plan steps:** 13; consumed by 16, 28.

#### R-56 — Step 13: rewrite detection, `rev-parse`, horizons
- **Root cause:** RC-2
- **Change:** Replace "exits 1 (not an ancestor) or 128 (unknown commit — the watermark
  object is gone)" with the ref-keyed rule of R-23: `cat-file -e`
  first; `history_rewritten` only on the same ref; `branch_changed`-class on a different
  ref with its cost; any other status a git fault, no purge. `rev-parse --verify -q
  HEAD`: exit 1 = nothing to mine; exit 128 = git fault, pass fails visibly. Enforce both
  horizons on every pass (mechanism by written comparison — Part 4, gap G-1), with a test that
  incremental passes past the cap leave a store equal to a fresh mine; source `365.25`
  (or define the horizon in days) and state where the commit-count horizon is enforced.
  `T-13-3` gains the branch-switch case, the pruned-watermark case (R-7's title and
  reason corrected to "watermark object pruned", or R-7 moves here), and the git-fault
  case (a corrupt watermark object: `cat-file -e` 0, `--is-ancestor` 128 → fault, no
  purge); the rewritten history gets a multi-file commit under the size cap that the
  rewrite drops, so the pair clause can fail.
- **Location:** Step 13 `rev-parse`, L3169; horizon, L3288–L3313; detector,
  L3448–L3452.
- **Source:** B4 verification item 1; B4 p2 E-1; B4 p3 E-19; B7 verification items 5,
  9; B7a E-10, E-16, E-28, E-29; B7b E-5 (FA: R-7 retitle, git-fault case); B2 E-1 (a),
  (e).
- **Depends on:** R-23. **Consumed by:** R-102.
  **Plan steps:** 13.

#### R-57 — Step 13: weights, epoch, `refTs`
- **Root cause:** RC-4
- **Change:** Adopt R-24: the re-based epoch advanced in whole
  half-lives with the exact power-of-two rescale in one transaction (both directions);
  drop `E = refTs − 500 × h × 86400` and the exponent-1000 re-mine; the zero-weight read
  rule; `%ct` validated (`/^[0-9]+$/`, a fault and a pass that writes nothing on
  failure, including `ref_ts` and the landmine rebuild); the far-future tip guard;
  capped commits counted in a fault; keep the automatic re-mine on a changed `h` and the
  `weight_epoch`-absent trigger. Tests: `T-13-2`/`T-13-2a` drop the `refTs − 500·h` and
  2^500 constants and case (b)'s exponent-1001 re-mine in favour of ruling 2's rescale
  case; add a `refTs`-moves-back case, the horizon-relation case, the zero-weight case
  and the far-future `%ct` case; `R-6` expresses its expected weight on the stored epoch
  and drops the unrelated `refTs − 500·730·86400` equality.
- **Location:** Step 13, L3352–L3354 ("`E = refTs − 500 × h × 86400`"), L3406–L3427
  (re-mine triggers and the epoch write); Step 12 cross-reference, L3049; D-plan-7,
  L7873–L7902.
- **Source:** B5 verification ruling 2; B7 verification item 4; B7b E-6, E-7, E-10; B7c
  E-1, E-10, E-12; B7b E-5 (FA: R-6); B6a E-22.
- **Depends on:** R-24. **Consumed by:** R-103. **Plan steps:** 13; consumed by 16.

#### R-58 — Step 13: git invocation and untrusted git output
- **Root cause:** RC-5
- **Change:** (a) `--encoding=UTF-8` on every log call, including the `refTs` read.
  (b) The child environment clears every variable `git rev-parse --local-env-vars`
  lists and `GIT_CONFIG_PARAMETERS`/`GIT_CONFIG_*` (no inheritance), and the "every user
  setting" claim is made true. (c) Shallow and grafted roots: detect them (`git
  rev-parse --is-shallow-repository`, `.git/shallow`; `git replace -l` or the
  `--no-replace-objects` choice stated), exclude their diffs as `exclude_reason`
  `boundary`, record the exclusion in a fault or `status`, and force a full mine when the
  repository stops being shallow. (d) A test that fails when `--no-merges` is removed
  ("the merge commit has no `commits` row"; `commits.countIncluded()` equals the
  non-merge count; named in `T-13-1`'s Fails-when). (e) A Step 13 case for m1: a `PATH`
  git shim commits between two of the pass's git calls, and `ref_ts`, the range, the
  stream and the watermark all name the resolved `<head>`; an empty-range case under
  the encoding setting stores no `NaN` and erases no landmines. (f) `T-13-1o`'s spec
  claims only `--no-show-signature` and `--root`, and names `--no-textconv`/
  `--no-ext-diff` as defensive with no observable `--numstat` effect on git 2.43.0.
  (g) The `9823853` probe: fetch all four bodies before printing; `SKIPPED: network` only
  on curl's transport exits (6, 7, 28, 35); an HTTP error (exit 22) prints a line naming
  it; pin the two branch URLs to commits.
- **Location:** Step 13, L3140–L3576 (no `--encoding` in the plan: grep finds none;
  `shallow` appears only in Step 5's repo-key text, L1670–L1684); (g) is
  `docs/plans/plan-phase-a.probes/14_docker_node_git.optional.sh` (changed by `9823853`)
  and its runner.
- **Source:** B7 verification item 5; B7a E-6, E-16, E-22; B7b E-9 (FA), E-10; B7c E-1,
  E-11; B8 verification item 9 (the same env rule for the walk).
- **Depends on:** none. **Consumed by:** R-104. **Plan steps:** 13.

#### R-59 — Step 13: the numstat parser's skipped runs and terminal rules
- **Root cause:** RC-5
- **Change:** (a) Any malformed field, at a header or an entry position, opens a skipped
  run to the next valid header; nothing after it is credited to any commit; entries read
  before it stay with their commit (said explicitly). One fault item per skipped run;
  attribution `after: <last valid header>` for a run opened at an entry position,
  `commit` for a run at stream start (`null`) and for a malformed timestamp. (b) A
  terminal rule for a commit that stays unreadable (undatable, or no entry readable):
  recorded in `commits` with a counted exclusion reason and a fault, counted toward
  completeness, so the range completes visibly. (c) A timestamp above
  `Number.MAX_SAFE_INTEGER` is malformed. (d) The per-pass fault cap the review asked
  for (one capped `miner_unparsed_numstat` with a count and a bounded sample), or its
  recorded rejection. (e) Tests: `T-13-1m` expects one skipped run (`records` 2, opened
  at the first malformed entry, `good.txt` kept); `T-13-1n` asserts `two.txt` is
  credited to no commit and follows the 40-or-64 rule; the damaged-header-after-entries
  stream; `T-13-1q` gains `''` (first), `' 12'`, `'0x10'`; `T-13-1r` has a `0x1e`-led
  non-header inside its run; `T-13-1p` gains 41-, 63-, 65-hex and upper-case 64-hex
  trailer names that must not label. (f) Re-home the dropped Step 13 parser note "no
  redundant `cur` null-checks" in Step 13's text.
- **Location:** Step 13 parser, L3253–L3256 ("one `miner_unparsed_numstat` / fault per
  malformed commit record — detail `{commit, records, first}`").
- **Source:** B7 verification items 3, 9; B7b E-2, E-11 (FA), E-13, E-23; B7c E-1, E-2,
  E-6, E-11; B1 verification item 8; B1 E-5; B2 E-1 (d).
- **Depends on:** R-50. **Consumed by:** R-105. **Plan steps:** 13.

#### R-60 — Step 13: the revert and fix label rules
- **Root cause:** RC-5
- **Change:** State the reference-format revert line (R-25) in Step
  13's rule with the execution as evidence; `T-13-4` gains a `--reference` revert with an
  edited subject (labelled). Source `lexicon.fix_keywords` per R-25.
- **Location:** Step 13 trailer rule, L3325 ("`^This reverts commit
  ([0-9a-f]{40}|[0-9a-f]{64})\.$`").
- **Source:** B7a E-17, E-27; B4 p2 E-1 (FA); B3b E-14.
- **Depends on:** R-25. **Plan steps:** 13.

#### R-61 — Step 13: the inter-chunk yield and the off-path wait
- **Root cause:** RC-3
- **Change:** Add the ≥ 25 ms inter-chunk yield (R-36) and keep `T-13-5(b)` as
  its pin; make `T-13-5b`'s append role model the product's writers (one write group per
  process, or gaps of at least 25 ms) instead of relying on the worker's 5 s wait; derive
  the off-path `busyTimeoutMs` (stated as the effective bound: two periods under the
  retry-once, about 10 s at 5000) or drop it to the default; repair Step 13's split
  "What changes" sentence; state the 414 ms figure as a benchmark projection; give
  `change_count` ROSE's term "frequency".
- **Location:** Step 13 `busyTimeoutMs: 5000`, L3156–L3157; chunk writing, L3376;
  "414 ms", L3544.
- **Source:** B3 verification item 2; B4 verification item 1; B4 p2 E-1; B4 p3 E-19; B7
  verification item 7; B7b E-21; B7c E-5; B3b E-22.
- **Depends on:** R-36, R-46. **Consumed by:** R-107. **Plan steps:** 13.

#### R-62 — Step 14: search storage per ruling 3
- **Root cause:** RC-12
- **Change:** Fallback token tables are written only under `fts_state = 'fallback'` (not
  "into the fallback table always"); `T-14-1`'s `path_tokens` assertion under `fts: true`
  goes; `T-14-5` gains `Über` searched as `über`; RV-8 and RV-16 (fallback tables on an
  `fts5` store) are rewritten; add a mid-word decomposed-accent case so the
  normalise-first order is pinned; record the `_`/`$` reason (`T-14-5` pins it
  undecided).
- **Location:** Step 14, L3738–L3740 ("one row per distinct token into the fallback
  table always").
- **Source:** B5 verification ruling 3; B5c E-2; B8 verification item 5; B8a E-17, E-19
  (FA), E-28 (FA); B8b E-5 (FA); B4 p3 E-6, E-21 (FA); B5b H1 E-13 (FA).
- **Depends on:** R-10. **Consumed by:** R-114. **Plan steps:** 14.

#### R-63 — Step 14: errors are not absences; containment; the git layout
- **Root cause:** RC-6
- **Change:** (a) Only `ENOENT`, `ENOTDIR` or `ELOOP` (or a non-regular descriptor)
  means absent; any other `lstat`, open, `fstat`, read or `readdir` error keeps the
  stored rows and records a fault (new Step 6 code); the same split in git mode's
  `lstat`. (b) A throwing resolver records `frontend_parse_failed` with `phase:
  'resolve'`; an unreadable importer or malformed `package.json` records a fault; a
  present but unreadable loose ref is `unresolved`, never a fall-through to
  `packed-refs`. (c) Before `check-ignore`, `lstat` each distinct leading directory of
  the listed paths and drop every path beneath a symbolic link, as `git status` does,
  recording which rule dropped them; handle `check-ignore` exit 128 and non-regular
  listed entries. (d) Containment (CWE-59): after the `fstat`, `readlink
  /proc/self/fd/<fd>` must lie under `realpath(checkoutRoot)` (computed once per pass);
  elsewhere, `realpath(path)` under the root with `dev`/`ino` equal to the descriptor's,
  its two-lookup race recorded in §13; state that `O_NOFOLLOW` covers the trailing
  component only (open(2)); record `openat2` `RESOLVE_BENEATH` as the alternative not
  taken (no Node 22 binding; C-3 excludes native code). (e) Parse the `.git` file as
  git 2.43.0 does: refuse over 1 MiB, require a `gitdir: ` prefix, strip only trailing
  CR/LF, resolve relative paths against the file's directory, apply `is_git_directory`
  (HEAD, `objects/`, `refs/`); a distinct invalid result for each failure class,
  reported as `head_unresolved` and refused by the walk with a fault; `ENOENT`/`ENOTDIR`
  on the `.git` stat mean absent, any other error is reported; drop "`PATH_MAX` plus
  prefix". The walk mode is git's own answer (`rev-parse --show-toplevel` equals the
  root). (f) Clear every variable `git rev-parse --local-env-vars` lists, and
  `GIT_CONFIG_PARAMETERS`; test `GIT_CONFIG_PARAMETERS` and the repo-key resolver under
  an inherited `GIT_DIR`. (g) Tests: `T-14-7` gains the symlinked tracked directory and
  the parent-swap case (`src/b.ts` absent, no symbol from outside the repository);
  post-`fstat` growth, read-bound and byte-count cases.
- **Location:** Step 14, L3577–L4147 (walk and read rules; the section exists, lines
  not pinned).
- **Source:** B8 verification items 1, 2, 3, 8, 9; B8a E-1 (FA), E-13, E-17; B8b E-6
  (FA), E-7, E-9, E-22 (FA), E-25, E-26 (FA); B4 p2 E-2 (FA); B2 E-3 (a).
- **Depends on:** R-50. **Consumed by:** R-111,
  R-112. **Plan steps:** 14.

#### R-64 — Step 14: zone rules and their tests
- **Root cause:** RC-17
- **Change:** Follow R-17: the ignore match is its own signal, never
  `generated`; precedence marker → vendored → build_output → source; `build/` anchored
  or recorded as an unsourced heuristic; lockfile list and 200-character cut sourced or
  removed; comment leaders per mapped language (covering at least `;`, `(*`, `\*`,
  `<%#`) and Go's before-first-code rule. `T-14-3`, RV-9 and RV-13 assert the recorded
  signal instead of `generated`; `T-14-1` asserts `vendored`/`build_output` and lists
  `b.py` in the fixture; G11's §14.5 row takes the evidence-only form.
- **Location:** Step 14 zone text (section exists; lines not pinned); §14.5, L15015.
- **Source:** B8 verification item 7; B8a E-9, E-21, E-25 (FA); B8b E-5, E-8 (FA); B4
  p3 E-21, E-48 (FA).
- **Depends on:** R-17. **Consumed by:** R-113. **Plan steps:** 14.

#### R-65 — Step 14: incremental correctness
- **Root cause:** RC-21
- **Change:** Follow R-19 (dependency tracking; per-language fingerprint;
  `version` as a content digest). The skip condition is: the key, the language, the zone
  and its evidence (recomputed from the 2 KB head and the ignore set), and `in_tree = 1`
  are all unchanged; a same-size, same-mtime edit leaves only `content_hash` stale;
  either add `ctime_ms` and `ino` to the stat key or record the rejection of that half
  of m3. The self-import count is consistent with `resolved` = edge count. Tests:
  `T-14-6` cases `tsext`, `js`, `pkg`, `pkgdrop`, `pkgrm`, `pydel`, the read-time
  disappearance and the worklist; tests that kill A2, A3, N1 and K3; RV-12 gets a
  same-size rewrite that leaves the zone unchanged and asserts zone `source`.
- **Location:** Step 14 skip condition, L3821–L3822 ("when the key and `in_tree = 1` are
  unchanged the file is not / re-recorded").
- **Source:** B8 verification item 4; B8a E-10; B8b E-3, E-24, E-25; B8b E-4, E-10,
  E-11, E-20, E-21 (FA).
- **Depends on:** R-19. **Consumed by:** R-115. **Plan steps:** 14,
  15.

#### R-66 — Step 14/31: the reindex claim result
- **Root cause:** RC-28
- **Change:** Declare `acquireReindexClaim(store): {acquired: true} | {acquired: false;
  ownerPid: number; startedAt: number | null}`, reading `startedAt` in the same `BEGIN
  IMMEDIATE` as the liveness check; `runIndex` returns `{refused: 'reindex_locked';
  ownerPid; startedAt}` and records the fault from those values; `index` and `init`
  print from the result and never re-read `schema_meta`; `init` on a refused first index
  says the index was not built by this run, prints the holder's pid and start time, and
  exits 75 (drop "the running pass will produce the index"). Add the non-owner release
  clause to `T-14-1`.
- **Location:** Step 14 (claim), Step 31 (`init`, L6354).
- **Source:** B8 verification item 11; B8a E-3, E-4, E-12, E-14; B8a E-5, E-7 (FA).
- **Depends on:** R-37. **Consumed by:** R-116. **Plan steps:** 14, 31.

#### R-67 — Step 14: declarations, red states, reftable, tests
- **Root cause:** RC-25
- **Change:** (a) Step 14's `modify:` list gains the four stand-in files and the
  generated regions are regenerated; the false reason "the plan checker refuses a
  declaration that names a later step's file" goes. (b) Move the clauses that depend on
  frontends (the `import_edge`/`test_map` rows, the `symbols` precondition for
  `src/k.ts`, T-14-5's symbol hits) into Step 15's own test specifications, with a red
  state of Step 15's stub failing `not implemented` or their own Fails-when; drop "with
  Step 15's `defaultFrontends(tuning)`" from Step 14's Level fields. (c) Reftable: keep
  the transition-only fault and `{stale: false}`; drop the config scan and its 64 KiB
  bound (the `HEAD` check covers every layout git makes); record in §13/§15 that a
  reftable repository's index is refreshed only by `index`/`init`, that its confidence
  is dampened on every event, and git's announced default change — or build the bounded
  reftable read, recording which; add the test that `runIndex` clears
  `head_unresolved_since`; drop the config-only layout and the vacuous
  `reindex_owner_pid` assertion from the test. (d) `T-14-2` establishes "no subprocess"
  by observing spawns (a preload that throws on every `child_process` entry point) or a
  transitive-import scan, packs a second branch with a different hash, and asserts the
  `index_stale`/`head_unresolved` JSONL mirror lands in the passed `diagnosticsDir` —
  the specification line changes with the test. (e) A multi-segment `**` cell.
  (f) `T-14-1` stops excluding `faults` on the unchanged re-run.
- **Location:** Step 14 `modify:`, L3584; the false reason, L3596; the `todo` red state,
  L4355–L4356; reftable config scan in code at `src/index/indexer.ts` L298.
- **Source:** B8 verification items 10, 12, 13; B8a E-2, E-24; B8a E-7, E-23, E-27
  (FA); B8b E-14, E-17, E-23; B8b E-18 (FA).
- **Depends on:** none. **Plan steps:** 14, 15.

#### R-68 — Step 14: the index pass's yield and write bound
- **Root cause:** RC-3
- **Change:** Yield at least 25 ms between write transactions of the index pass; bound
  every write transaction below ~100 ms, checking elapsed time before each write; state
  the measured cost (+51%, 98.2 s → 148.4 s at `chunk_ms` = 50) and the c-versus-cost
  trade with its ceiling; the contention run must show 0 `StoreBusy` (the residual 3 of
  2,310 is unexplained — Part 4, gap G-5). State the cap's unit.
- **Location:** Step 14 chunking, L3941 ("`miner.chunk_ms` writing time").
- **Source:** B8 verification item 6; B8a E-17; B8b E-25.
- **Depends on:** R-36. **Consumed by:** R-107. **Plan steps:** 14.

#### R-69 — Step 15 and the plan's grammar claims
- **Root cause:** RC-7
- **Change:** In §4, Step 12, Step 15, D-plan-2, §11.4, T-38-33 and R6: state the cause
  of `lua`'s and swift's ERROR trees; load a working Lua grammar and a rebuilt swift
  grammar through the table (R-15); strike the claim that 31 grammars parse
  error-free on every repeated parse and name the usability rule (scanner initialises
  in `create`, resets at length 0, checked at plan time from source; samples parse
  error-free). Keep the repeated-parse ERROR/MISSING sample check as a build check
  (T-38-33), not proof of usability; give swift a raw-string sample; add the per-file
  runtime ERROR-tree signal; T-38-33 and R6 drop `lua` from the excluded list. Probe 20:
  add the cause-level section (trees change when indeterminate blocks are garbage-
  filled), record the packaged scanner source read beside it in §11.4, add the vendored
  Lua and rebuilt swift load, and regenerate the expected output from an executed run
  after the fixes (the aim is 32 usable; the run, not the aim, is cited). Add a
  scanner-initialisation check when the plan is written.
- **Location:** Step 15, L4181–L4182 ("31 grammars the pinned runtime loads and parses
  valid source error-free on / every repeated parse"); L7138–L7139 (excluded list with
  `lua`); R6, L14431–L14432.
- **Source:** B9 verification item 1; B9 E-1, E-2, E-3, E-18, E-21.
- **Depends on:** R-14, R-15. **Consumed by:**
  R-119. **Plan steps:** 12, 15, 38.

#### R-70 — Step 15: TypeScript and Python resolvers
- **Root cause:** RC-8
- **Change:** TypeScript: add `.d.ts`, `.d.mts`, `.d.cts` in the handbook's order;
  source before the written `.js` (tsc 5.9.3 `--traceResolution`); workspace packages
  in-repo; `.` and `..` are directories, not files; settle `.json`. Python: replace the
  ancestor walk with the repository's declared Python roots (each
  `pyproject.toml`/`setup.py` directory, a declared `src/` layout's `package-dir`), or
  keep the walk named as a heuristic (not "Python's `sys.path[0]` rule") with its
  false-edge direction stated; `external` only for a vendored, version-stated stdlib
  name (3.10–3.13 lists have 303, 305, 300 and 290 names) or a declared distribution,
  else `unresolved`; `hasTopLevelModule` goes. Tests: `T-15-5` gains the `json` with
  `lib/util/json.py` case, `requests` undeclared → `unresolved`, the nearest-first case,
  an in-repo module the root lookup misses (`src/` layout; a sibling import from a
  subdirectory), a missing absolute name (`unresolved`), a TypeScript workspace package,
  the order, `.tsx`-source and `.d.ts` cells; `json`'s reason is the standard library;
  RV15-3, RV15-13 and RV15-6's title follow the settled rules; the fakes move to the
  corrected interface. Cite the docs, not the owner-messages line.
- **Location:** Step 15 Python rule, L4277–L4288 ("`sys.path[0]` rule does for a
  script"; "`hasTopLevelModule(name): boolean`", L4287).
- **Source:** B4 verification item 5; B4 p3 E-22; B9 verification items 3, 4; B9 E-29;
  B9 E-7, E-17, E-23, E-30, E-32, E-33, E-34, E-36 (FA).
- **Depends on:** R-16. **Consumed by:** R-121. **Plan steps:** 15.

#### R-71 — Step 15: frontend failure handling and the generic frontend
- **Root cause:** RC-6
- **Change:** (a) Signal ERROR trees per file (a `hasError` count per language in
  `lang_capabilities`, and a fault naming the file) — required now, for swift. (b) Fail,
  or record a fault, on an unreadable package version; no `'unknown'` in `version`.
  (c) On a grammar's first throw, disable it for the life of the process (the leak is 864
  bytes of wasm stack per throw, per process; TypeScript fails after throw 76); its
  remaining files take the generic frontend, each with its fault, marked for retry.
  (d) Remove both empty `catch` blocks around `delete()`, or record a fault in them.
  (e) Do not cache a rejected `Parser.init()`. (f) A malformed `index.ext_to_grammar`
  member records a fault (or is refused at write time), never skipped silently. (g) The
  generic frontend counts fallback files in the share and retries them (R-20); stops extracting symbols from binary and prose/data files; bounds name
  length; `.sh` takes its own language with frontend `generic` and the recorded
  exclusion cause, not `unknown`; the bash name rule is bash's (no metacharacter, quote
  or `$`). (h) Tests: `T-15-1` asserts each declaration's exact start and end span and
  drops "NOT asserts a span's exact end byte"; `T-15-4` asserts exactly one fault,
  replaces the reuse clause that cannot fail, and adds the share and many-throws cases
  with a second `runIndex` in the same process; `T-15-6` asserts `!rootNode.hasError`
  for each sample on every one of repeated fresh-`Parser` parses, with a swift
  raw-string sample and a Lua sample; `T-15-3`'s `unknown` expectation changes.
- **Location:** Step 15, L4148–L4364 (section exists; lines not pinned beyond those
  above).
- **Source:** B9 verification items 2, 5, 7, 8; B9 E-16, E-19, E-21; B9 E-6, E-8, E-9,
  E-14, E-15, E-24, E-26, E-27, E-38 (FA); B8a E-8 (FA).
- **Depends on:** R-20, R-69. **Consumed by:**
  R-120. **Plan steps:** 15.

#### R-72 — Step 16: the bar consumes rulings 1 and 2
- **Root cause:** RC-18
- **Change:** `historyStale` against the mined tip; a test where `HEAD` is a merge after
  a complete mine (`historyStale` false) and one where one commit follows a complete
  mine (true). Aged strong-pair cases (a ratio-1 pair at 240 days and at 4 years — high,
  not silenced; 10 recent solo changes after 20 old co-changes — decayed) and the
  stale-index case as decided. D-plan-7's half-life reason restated with its condition
  (a pairing that has come apart is outweighed once later solo changes exceed the pair's
  decayed weight — more than half its co-change count after one year, a quarter after
  two) or the clause dropped. The bar does not read `ratio` for structural facts until
  R-26 defines their confidence. Replace "the labels are written only
  for horizon-included commits, so no hazard is sourced solely from an excluded class"
  with the rule R-27 settles, and implement the noise floor's second half
  (or its changed clause).
- **Location:** Step 16, L4365; hazard path, L4413–L4416 ("labels are written only for
  horizon-included commits, so no hazard is sourced / solely from an excluded class");
  D-plan-7, L7899–L7902 ("outweighed within about a year by the solo changes after it").
- **Source:** B5b H1 E-9; B4 p3 E-23; B5b H2 E-16; B2 E-5 (b), (g); B4 p2 E-4.
- **Depends on:** R-22, R-24, R-26,
  R-27. **Plan steps:** 16.

#### R-73 — Step 17: the command-class split
- **Root cause:** RC-19
- **Change:** Split also on newline and `&`; a heredoc is class 3 wholesale or parsed.
  Strip a pytest `::…` node id and a `[…]` parametrisation from a target (or treat such a
  target as unmappable ⇒ subtract all), and state the normalisation base (the event's
  `cwd`; a `cd` in the same command makes the segment unmappable). State who normalises
  `targets` and against what; add the directory-argument case. `T-17-1` gains
  `pytest tests/test_a.py::test_x` → `['tests/test_a.py']`, a cell run from a
  subdirectory, and the directory-argument cell.
- **Location:** Step 17, L4514–L4516 ("Per AD-15: split on `&&`, `;`, `|`, `||`
  **quote-aware**").
- **Source:** B2 verification item 3; B2 E-5 (h); B4 p3 E-24; B4 p2 E-5 (FA).
- **Depends on:** R-31. **Consumed by:** R-123. **Plan steps:** 17.

#### R-74 — Step 18: genre generators
- **Root cause:** RC-18
- **Change:** Coupling carries both ratios or records the withholding
  (R-30); `length ≥ 3` and the three-hash count become tuning rows or
  are sourced; state the most-frequent-kind reason; `blastRadius` is computed from stored
  partners (no literal); Orientation carries no `support`/`ratio` constants
  (R-26); Warning's fix-chatter window is read from tuning; the
  Completeness edit set follows R-32. Tests: `T-18-1` fails unless
  each named file's `evidenceJson` carries `inDegree` equal to the store's in-degree and
  `markerPoints` equal to the bonus applied; `T-18-2` gains the both-ratios assertion;
  `T-18-3` gains the workspace-package case.
- **Location:** Step 18, L4560 (Completeness/Verification readers at L4739–L4743).
- **Source:** B4 p2 E-6 (FA); B4 p3 E-25 (FA); B5b H2 E-26; B2 E-5 (a), (b), (e); B3a
  E-9.
- **Depends on:** R-30, R-26,
  R-32. **Plan steps:** 18; consumed by 38.

#### R-75 — Step 19: compose literals, drops, masked partners
- **Root cause:** RC-18
- **Change:** Give the 12-hex, 200-character and ± 2 literals a source or a tuning row
  with the reason recorded; `T-19-2` asserts the returned `{dropped: <reason>}` (compose
  no longer calls `recordDrop`); the masked-partner and `not_in_tree` cases are restated
  at the partner level (partner removed from the fact; a single-partner candidate
  dropped and counted), replacing the `path#<id>` rendering expectation.
- **Location:** Step 19, L4806 (the ± 2 seek at L4849).
- **Source:** B4 p2 E-7 (FA); B5b "Entries not re-ruled" (H2 E-11 note); B4 p3 E-27,
  E-28, E-43 (FA); B3b E-11.
- **Depends on:** R-30. **Plan steps:** 19.

#### R-76 — Step 21: transcript admission and the read-set report
- **Root cause:** RC-14
- **Change:** The admission rule "successful unless `is_error: true`" is in the plan at
  `HEAD` (L5072); what remains: `T-21-3`'s fixture in the real shape (a Read success
  with no `is_error` field admitted; an Edit with `is_error: true` excluded); the
  read-set report `rebuild_recovered_nothing` with `set = 'read'`; in D-plan-39 strike
  "AD-11's `transcript_layout_changed` detector guards a layout change" and state the
  true guard (the read-set report); the §11.4 transcript bullet gives the per-tool split.
- **Location:** Step 21, L5005; admission, L5072–L5083; `delivered`-only report, L5064;
  D-plan-39, L8585–L8594; §11.4, L10667–L10672.
- **Source:** B4 verification item 3; B4 p2 E-9; B4 p3 E-6, E-8 (FA), E-29 (FA); B5
  verification item 8; B5b H2 E-5, E-6.
- **Depends on:** R-33, R-50. **Plan steps:** 21, 28.

#### R-77 — Step 28: the handler's event context and failure paths
- **Root cause:** RC-6
- **Change:** (a) An unresolved (or reftable) `HEAD` sets both staleness flags true
  (dampen, never block) in `EventContext`, with the reason at the line (an unknown
  freshness is not health — AD-17; FR-K7 bounds the cost); pinned by a `T-28` case
  whose `HEAD` is unresolvable and one where a reftable `HEAD` spawns no reindex on
  `SessionStart`. (b) Unreadable stdin records a fault and returns `''` (never a
  fabricated event); an event without `cwd` is a fault (no `process.cwd()` fallback).
  (c) The AC-8a line goes through the audit loop (audit before emit). (d) `targetPath`
  is normalised against the repository root. (e) The `store_corrupt` catch-all is
  retired with `handler_exception`; the `ensureLayout`/create-on-open/silent fail-open
  lines go under AD-23 (compute layout paths without creating; create only in `init`).
  (f) At a continuation `Stop`, run the done-claim recognizer and record the FR-M4
  counter, or record the reason for excluding it, in the step and in `status`.
- **Location:** Step 28, L5740–L6091 (continuation `Stop`, L6079).
- **Source:** B5 verification items 10, 14; B5b H2 E-4, E-9; B8 verification item 10;
  B8b E-14, E-23; B2 verification item 5; B2 E-7; B6a E-24.
- **Depends on:** R-22, R-12, R-47. **Consumed by:**
  R-124. **Plan steps:** 28.

#### R-78 — Step 28: tests
- **Root cause:** RC-22
- **Change:** `T-28-9` fails unless each listing search's normalised `resultPaths` is
  exactly `['src/a.ts']` (a `tool_input.path`-only reading is not accepted);
  `T-28-7(e)` allows only `<home>/` and `<home>/diagnostics/` from a diagnostics-only
  helper and names the marker files, with the marker-retention assertion; `T-28-11`'s
  transcript uses the observed shape and gains a fork `f4` whose file-tool pairs are in
  a shape `successfulToolTargets` skips beside a genuine `[oracle] ` line, failing unless
  `rebuild_recovered_nothing` with `set = 'read'` is recorded and nothing for `f3`; the
  skeleton-test retirement sentence names where each property is pinned (intake,
  answer, allowed edit: `T-28-1`; a whisper: `T-28-10`; dedup: `T-28-11`; the denied
  edit: `T-38-1` at Step 38; `init`: Step 31's tests) or the `delete:` moves to Step 38.
  The e2e test, while it exists, does not pin the absence of FA-6 (≥ 30 commits, or
  assert silence below the floor), says its whisper assertion checks connectivity not
  the bar, and gives `Stop` an Edit `PostToolUse` to act on.
- **Location:** Step 28 test specifications in §12.2 (section at L13191).
- **Source:** B5 verification item 12; B5b H2 E-3, E-7, H1 E-25; B4 p3 E-33 (FA); B5b
  H2 E-31 (FA); B2 E-7.
- **Depends on:** R-76, R-47. **Plan steps:** 28, 38.

#### R-79 — Step 30: the fold's trend claim and the regret bound
- **Root cause:** RC-15
- **Change:** Either attribute each `whisper_id`-carrying correction to the
  `stats_folds` row whose `audit_from < whisper.seq ≤ audit_to` (updating that row's
  `corrected_*` count in the same transaction, which the append-only ledger must then
  permit for those two columns, or by a separate per-window ledger joined at read), or
  delete the per-genre trend sentence from Steps 30 and 33 and state that `stats_folds`
  supports totals only — recording which and why. The regret pass's query is bounded by
  `uptoSeq` or runs in one read transaction (R-53 (c)).
- **Location:** Step 30, L6171; trend, L6218; regret query, L6250.
- **Source:** B3 verification item 7; B3a E-12; B4 p2 E-15; B4 p3 E-37 (FA); B5
  verification item 11; B5b H2 E-14.
- **Depends on:** R-53. **Plan steps:** 30, 33.

#### R-80 — Step 31: `init` order, worktrees, refusals
- **Root cause:** RC-10
- **Change:** (a) Index before wiring hooks, or unwire on a failed index, so a failed
  index never leaves hooks wired (fail-fast order for the sanctioned in-tree write).
  (b) In a worktree, run the first index and mine against the main checkout
  (`found.root`, as Step 28's reindex child does with `cwd = repoRoot`), or skip them
  and say so in the summary, citing AD-23; `T-31-1`'s worktree clause is a failure
  condition ("OR `init` run inside a `git worktree add` checkout of the fixture records
  a root other than the main repository's"), with the worktree exception stated if the
  first index is skipped. (c) The refused first index exits 75 (R-66).
  (d) The checksum refusal message and recovery (R-35).
- **Location:** Step 31, L6354; hook write is item 4 before the index item 5 (per B6a
  E-23; code at `src/cli/init.ts` L35 before L44).
- **Source:** B6 verification item 9; B6a E-23; B8 verification item 11; B4 verification
  item 7; B4 p2 E-16; B4 p3 E-35; B8a E-5 (FA).
- **Depends on:** R-66, R-35. **Consumed by:** R-118.
  **Plan steps:** 31.

#### R-81 — Step 32: `import` and `deinit --purge`
- **Root cause:** RC-15
- **Change:** Until rebuilt, `import` refuses (non-zero exit with the reason). The
  rebuilt `import`: requires both source files to exist and opens them read-only
  (never creates or modifies the source); validates both before writing anything;
  refuses a checksum or `repo_key` mismatch on the temporary copy; merges the live
  bindings into the validated temporary store before `backup()`; replaces through the
  backup API so the operation is all-or-nothing across both files; states why
  global-first beats project-first or switches the order; a crash is detectable at the
  next run from a surviving `.import-tmp` (the residual paragraph no longer says a crash
  records anything). `deinit --purge` states its effect on the `whisper_stats` replica.
  A channel for a global-copy rejection. Tests: (f) a holder in a write transaction on
  the live project store after the global write fails unless `import_rejected` with
  `check: 'partial_write'` is recorded, the written store is named, and a re-run
  restores both; the crash-detection case; the foreign-export refusal; the replica
  disposition after `deinit --purge`; the two-file all-or-nothing case.
- **Location:** Step 32, L6511; `--replace` refusal, L6569.
- **Source:** B2 verification item 6; B2 E-9; B3 verification item 7; B3b E-8, E-10;
  B5 verification item 9; B5b H2 E-18 (FA), E-19; B4 p3 E-36 (FA); B4 p2 E-17 (FA);
  CR§1.
- **Depends on:** R-34, R-35. **Consumed by:** R-125.
  **Plan steps:** 32.

#### R-82 — Step 33: `status` reads and suppressing conditions
- **Root cause:** RC-15
- **Change:** A key- or home-addressed read form for an imported store with no live
  binding (e.g. `status --key <key>`), with its refusal cases and a `T-33` case, pinned
  in Step 39's procedure; `mining_in_progress` shown as a suppressing condition, its
  events counted and excluded from the FR-M3 silence line; the per-language test-mapping
  capability printed; `T-33` asserts `stats_folds` totals rather than a trend until
  R-79 decides.
- **Location:** Step 33, L6656; trend line, L6754.
- **Source:** B4 verification item 12; B4 p3 E-4, E-37 (FA); B5b H2 E-20 (FA); B4 p2
  E-18 (FA); B3b E-7.
- **Depends on:** R-34, R-36, R-79. **Plan steps:** 33, 39.

#### R-83 — Step 34: `correct` arms the single open session
- **Root cause:** RC-13
- **Change:** Arm from `livenessRows(open = true)`: one open → arm; several → refuse with
  a plain-language list (last activity time and working directory) and ask for
  `--session`; none → say so and arm nothing; always print the armed session. `T-34-2`
  covers the one-open, several-open (refusal, nothing armed, no deny anywhere),
  none-open and ended-session cases. D-plan-37 is rewritten to this rule with the
  settled alternative in its rejected list.
- **Location:** Step 34, L6802; arming text, L6836–L6840 ("else **the session of the most
  / recent event**"); `T-34-2`, L6883–L6887.
- **Source:** B4 verification item 7; B4 p2 E-19; B4 p3 E-39; B5 verification item 7;
  B5b H2 E-21, E-22 (FA).
- **Depends on:** R-13. **Consumed by:** R-53. **Plan steps:** 34.

#### R-84 — Step 35: `note --file` and the refusal channel
- **Root cause:** RC-6
- **Change:** Refuse only a normalised path that does not exist under the checkout root;
  for an existing file with no `in_tree = 1` row, create or keep its row (`in_tree = 0`
  until the next index), record the note, and say in plain language that it will be
  spoken once the file is indexed; emission's rumor rule decides when it is spoken;
  state the window's length. The `note --kind landmine` refusal goes to stderr.
- **Location:** Step 35, L6895.
- **Source:** B4 verification item 11; B4 p2 E-20; B6a E-21.
- **Depends on:** none. **Plan steps:** 35.

#### R-85 — Checkpoint 1R: the remaining adaptation items
- **Root cause:** RC-25
- **Change:** B4 p3 E-5's correction (a declared adaptation with a placeholder rule and
  a `todo` form; R15 rewritten to match) is in the plan at `HEAD`: R15 now reads "a test
  the reduction turns red is marked `node:test` `todo` … so `npm test` and CI stay green
  at Checkpoint 1R" (L14515–L14526). What remains is B5b H1 E-12's: drop the genre
  modules that already return `[]` from the Step 6 `modify:` list (or state they are
  listed only for the type import), and name the indexer's and `search.ts`'s FTS column
  breaks with their placeholder or their unreachability in place of "the one skeleton
  statement" (the L2415 half is R-51 (d)).
- **Location:** Step 6's 1R adaptation paragraph, L2018–L2032 ("the bar / combinator,
  the generator helper and the seven genre modules"); §9 Checkpoint 1R, L7596 onward.
- **Source:** B4 p3 E-5 (applied, verified by reading L14515–L14526); B5b H1 E-12 (FA).
- **Depends on:** R-51. **Plan steps:** 6, 37 (and §9).

#### R-86 — Step 38: acceptance replays
- **Root cause:** RC-22
- **Change:** `T-38-34` gains the both-ratios (or recorded-withholding) assertion;
  T-38-33 follows R-69; the AC-4/AC-5 rows of §12.4 stand only once
  `T-28-11`/`T-20-3` and `T-38-34` are corrected, and the table must not be read as
  coverage until then.
- **Location:** §12.3 (L13805); §12.4 coverage reconciliation (L14333).
- **Source:** B4 p3 E-1, E-44 (FA).
- **Depends on:** R-74, R-69, R-78. **Plan steps:** 38.

#### R-87 — Step 39: the exit run
- **Root cause:** RC-24
- **Change:** Leg 1's inclusion rule stands on spec §11.5's population and measurement
  validity; drop "the lesson of OL-R5". Pin R-82's key-addressed `status` form in
  the procedure. PG-8 names the inter-chunk yield (≥ 25 ms) as the measured variable and
  `T-13-5(b)` as its pin (a failure means the yield is too short, never that chunks are
  too long); PG-6 adds that a shape in which `[oracle] ` does not survive as a plain
  substring produces no oracle lines and is silent until leg 2 observes it.
- **Location:** Step 39, L7206; leg 1, L7223–L7227 ("(review G36; the lesson of
  OL-R5)"); PG-8, L14944–L14946 and L15184–L15186; PG-6 (§15).
- **Source:** B2 E-10; B4 p3 E-3 (FA), E-4, E-47.
- **Depends on:** R-82. **Plan steps:** 39.

#### R-88 — §10/§10A: D-plan-33 to D-plan-44 and their collapse tests
- **Root cause:** RC-25
- **Change:** Write the twelve §10A collapse-test entries for D-plan-33 to D-plan-44
  (written by an agent other than the one that will hunt them), then schedule the
  independent review and collapse-hunt. Correct: D-plan-36 (paths agree by construction;
  symbols for ASCII only, then fold or disclose); D-plan-37 (the single-open-session
  rule; PG-5's frequency premise goes with it); D-plan-39 (a corrected premise, not a
  narrowing of AD-16; the guard sentence per R-76); D-plan-40 (check the
  content-mode `filenames: []` case against a captured Grep payload before recording it
  as a defect); D-plan-42 (`ENOTDIR` as `StoreUnreadable` with its errno); D-plan-43
  (the dropped-live-bindings list); D-plan-44 (a measurement for the marker weight).
  §16's proposed architecture fixes must not carry the defective decisions.
- **Location:** §10, L7714; §10A, L8665 (entries end at D-plan-32 per B5a E-12).
- **Source:** B4 verification item 10; B4 p3 E-6, E-49; B5 verification item 13; B5a
  E-12; B5b H2 E-6, E-22, E-23, E-24 (FA), E-30.
- **Depends on:** R-76, R-83, R-46, R-10. **Plan steps:** 3, 14, 21, 32, 34.

#### R-89 — §16 item 5 and the §11 records
- **Root cause:** RC-23
- **Change:** Do not mark (a)–(c) "resolved" until the plan-follow pass has happened:
  Steps 12 and 13 re-quote AD-13 as it stands after the correction, §11.2 records that
  reading with its line numbers; split (b) — its `h` bound was adopted at `0676431` but
  ruled `replace` (ruling 2), and the `ts > refTs` rule is raised and open until AD-13
  carries both; say plainly that `0676431`'s "no plan change follows" was false of the
  plan's citations. The raises B5b H1 E-9/E-15/E-18 and B4 p3 E-49 (i) list (AD-14's
  staleness sentence, the `ts` rule, AD-18's sentence, the `is_error` V-row) are applied
  directly by the architecture items above rather than re-raised. Correct Q58, Q62 and
  Q65's dispositions to the evidence.
- **Location:** §16 item 5, L15213–L15250 ("**Resolved:** the items raised by the
  earlier passes", L15220; "(engineering items, now resolved)"); §14 Q58/Q62/Q65,
  L14868–L14891.
- **Source:** B5 verification item 13; B5c E-5, E-7; B5b H1 E-9, E-15, E-18 (FA); B4 p3
  E-46, E-49.
- **Depends on:** R-24, R-22, R-13. **Plan steps:** 12, 13.

#### R-90 — Steps 13–19: sweep for unsourced literals
- **Root cause:** RC-24
- **Change:** Sweep Steps 13–19 for numeric literals with no source or tuning row, and
  give each a source, a tuning row, or a recorded reason.
- **Location:** Steps 13–19 (L3140–L4897).
- **Source:** B4 verification item 12 (last bullet).
- **Depends on:** none. **Plan steps:** 13, 14, 15, 16, 17, 18, 19.

#### R-91 — Step 13: the announced rename-following divergence
- **Root cause:** RC-25
- **Change:** Renames were announced as an engineering action ("#6: build
  rename-following into Step 13") and not built; the plan and code keep the split.
  Record a stated decision (build it, or reject it with the reason) in Step 13. The
  decision itself is not settled (Part 4, gap G-4).
- **Location:** Step 13 (section exists).
- **Source:** B7a E-16 (owner-question paragraph: "They go to the correction pass as that
  divergence, with a stated decision"); B2 verification item 9 (restore the
  rename-history question as an open engineering item).
- **Depends on:** none. **Plan steps:** 13.

### 2.4 Code and tests — `middleware/context-oracle/ctxoracle/`

Each item names the plan item whose text the code must then follow; code changes land
after their plan item (spec → architecture → plan → build). Lines are at `HEAD` and were
read for this register unless marked otherwise.

#### R-92 — Migration runner: per-migration checksums; the 002 header
- **Root cause:** RC-9
- **Change:** Implement R-35/R-44: record a checksum per migration
  file; refuse on every open path on mismatch or on a versioned store with no checksums
  (fault; hook path emits nothing; CLI plain message naming `deinit --purge` and
  `init`); tests per CR§1 item 4. Reword `002_phase_a_global.sql`'s header so the
  in-place edit rests on the checksum refusal, not on "no store has shipped" as fact.
- **Location:** `src/stores/migration_runner.ts` L60 and L79 ("return; // forward-only"
  on version ≥ 1), L74 and L82 (write `schema_version` `'1'`); header comment L8;
  `src/stores/migrations/002_phase_a_global.sql` L3 ("(plan §6: no store has shipped)").
- **Source:** CR§1; B4 verification item 4; B6a E-11.
- **Depends on:** R-44, R-52.

#### R-93 — Store adapter: rollback list, failed `ROLLBACK`, tests
- **Root cause:** RC-6
- **Change:** Correct the comment's list to `SQLITE_FULL`, `SQLITE_IOERR`,
  `SQLITE_INTERRUPT`, `SQLITE_NOMEM`. On a failed depth-0 `ROLLBACK`, throw with the
  original error as `cause` and take the handle out of service (non-clearing broken
  state, or close). Tests per R-46 (g) (the direct-statement case kills mutant
  A1; the broken-state case; `T-3-5g2` `StoreUnreadable`/`ENOTDIR`); in
  `store_nesting.test.ts`, read back `PRAGMA busy_timeout` and add the `RangeError`
  cases (`cap600`, `noguard` survive at `HEAD`).
- **Location:** `src/stores/adapter.ts` L20–L21 (comment lists `SQLITE_BUSY`),
  L296–L301 (the `ROLLBACK` swallow: "catch { /* the original error is what the caller
  needs */ }"); `test/unit/stores_adapter.test.ts`; `test/unit/store_nesting.test.ts`.
- **Source:** B6 verification item 4; B6c E-13, E-20, E-30, E-11 (FA); B7 verification
  item 7; B7c E-13.
- **Depends on:** R-46.

#### R-94 — `ensureHome` creates no `global/`; CWE citation
- **Root cause:** RC-10
- **Change:** `ensureHome` creates `<home>/` and `<home>/diagnostics/` only; tests per
  R-47; the mode comment cites CWE-276 or CWE-732, not CWE-379.
- **Location:** `src/identity/layout.ts` L61–L76 (L74: `ensureDirs([home,
  path.join(home, 'global'), homeDiagnostics])`); CWE comment L49; `test/unit/layout.test.ts`
  (B6b E-8 cites L90, L122, L155; not re-read here).
- **Source:** B6 verification item 7; B6a E-2 (FA); B6b E-8; B6c E-21 (FA).
- **Depends on:** R-47.

#### R-95 — Spawn wrapper: detached pipes, overruns, missing command
- **Root cause:** RC-6
- **Change:** `oracleSpawn` throws on `detached: true` with a piped stdout or stderr
  (and both options' comments say so); tests: the `ENOBUFS` overrun, the missing-command
  throw, the `stderr: 'pipe'` leg and the refusal leg.
- **Location:** `src/util/spawn.ts` L86–L92 (`opts.detached === true ? 'ignore'`),
  `maxBuffer` L109; `test/unit/spawn_wrapper.test.ts`.
- **Source:** B6 verification item 5; B6c E-7; B6b E-9 (FA); B7 verification item 8;
  B7c E-4.
- **Depends on:** R-48.

#### R-96 — `consumerKey` rejects a `#` in a session id
- **Root cause:** RC-13
- **Change:** Throw on a session id containing `#`; header states the premise; tests per
  R-49 (a) (T-6-4 data `a#sub:b`, `s1#main#x`; K2 survives at `HEAD`).
- **Location:** `src/types/consumer.ts` L17 (`consumerKey`), L27–L28 (`consumerRole`
  splits at the first `#`); `test/unit/consumer_key.test.ts`.
- **Source:** B6 verification item 1; B6a E-6; B6b E-6; B6c E-3.
- **Depends on:** R-49.

#### R-97 — `slot.human` enforces human provenance
- **Root cause:** RC-20
- **Change:** Per R-49 (b); header claim restated to what the code
  enforces; the `T-6-3` must-fail fixture.
- **Location:** `src/types/headline.ts` L4–L5 (claim), L53–L54 (`human(v)` accepts any
  `{text}`); `test/unit/step6_headline_slots.test.ts`.
- **Source:** B6 verification item 6; B6a E-7; B6b E-18.
- **Depends on:** R-49.

#### R-98 — DAOs: `whisper_audit`, `observed_actions`, `session_log`, provenance tests
- **Root cause:** RC-20
- **Change:** `whisper_audit.append` discriminated input (whisper requires
  `subject_key`, deny forbids it; runtime throw); the handler passes `x.c.subjectKey`.
  `okEdits`/`okReads` take the consumer or go (no caller). `latestSession` goes with
  R-83. `firstHash` per R-49 (d). Tests per R-53 (g),
  (h): the `createHuman` gate refuses every non-`human` `prov_kind` (`repo_span`,
  `commit`, `mechanical`, `session`), not `commit` alone (r12; D1 survives); `T-9-2`
  per-call `prov` diagnostics; fixture line 19 gets `in_tree: 1`.
- **Location:** `src/stores/dao/whisper_audit.ts` L24 (`subject_key?: string | null`);
  `src/stores/dao/observed_actions.ts` L37–L38, L80, L89 (`okEdits`, `okReads`), L44,
  L121 (`firstHash`); `src/stores/dao/session_log.ts` L42, L97 (`latestSession`);
  `src/types/events.ts` L76 and `src/hook/handler.ts` L106 (`firstHash` stand-in);
  `test/unit/dao_crud.test.ts`.
- **Source:** B6 verification items 6, 8; B6a E-12, E-14 (FA), E-16 (FA); B6c E-4,
  E-16; B6b E-14, E-19; B5b H2 E-17.
- **Depends on:** R-53, R-83.

#### R-99 — Tuning reader and validator
- **Root cause:** RC-11
- **Change:** Per R-54: the event-path miss serves the seed, calls
  `onMissing`, writes nothing; the stored-set ordering check at construction; the
  half-life relation replaces `≥ 37` (derivation at the line); a scalar write naming a
  list key is refused (at `HEAD` a scalar write replaced 8 `lexicon.stoplist` members
  with 1, executed in B6c E-25); `tuning_seeds.ts` carries the settled provenance for
  `bar.untrusted_trust_factor`, `bar.stale_factor`, `bar.hazard_full_support` and the
  `miner.chunk_gap_ms` seed; tests per R-54 (h) and B6b E-15's re-pin.
  Keep `checkTuningWrite`'s non-numeric/unknown-key refusal (applied at `HEAD` by
  `c3a25f0`) and `tuningWriteNotice`.
- **Location:** `src/stores/dao/tuning.ts` L113–L114 (`tuning.set(global, key, …);
  onMissing(key);` on the event path), L180 and L235–L237 (the `≥ 37` guard), L33 (the
  `DELETE FROM tuning WHERE key = ? AND project_key IS NULL` a scalar set runs);
  `src/stores/dao/tuning_seeds.ts`; `test/unit/tuning_reader.test.ts`,
  `test/unit/tuning_dao.test.ts`.
- **Source:** B6 verification item 3; B6a E-17, E-18 (FA); B6b E-15 (FA), E-16; B6c
  E-12 (FA), E-25; B7b E-6.
- **Depends on:** R-54.

#### R-100 — Fault codes and their literal test
- **Root cause:** RC-6
- **Change:** Add the codes R-50 names; the `fault_codes.test.ts` literal
  and count change in the same change.
- **Location:** `src/diag/fault_codes.ts`; `test/unit/fault_codes.test.ts`.
- **Source:** B6 verification item 8; B6b E-5; B6a E-5 (FA).
- **Depends on:** R-50.

#### R-101 — Miner: watermark and completeness per ruling 1
- **Root cause:** RC-1
- **Change:** Per R-55: no chunk writes the watermark; the pass's range is
  recorded at start; the final transaction writes the mined `HEAD` and ref; a crash
  re-runs the recorded range with the already-mined skip; the completeness check counts
  entries, not headers. At `HEAD` the skew loss, the lost unreadable middle commit
  (watermark still `HEAD`), and the incomplete full pass that leaves the watermark at
  `HEAD` with `mining_in_progress` `'1'` all reproduce (B7 verification item 1).
- **Location:** `src/miner/cochange.ts` (per-chunk watermark writes; the pass body from
  L388; the stream at L513).
- **Source:** B7 verification item 1; B7a E-1; B7b E-13; B7c E-1.
- **Depends on:** R-55.

#### R-102 — Miner: `rev-parse` and `merge-base` statuses
- **Root cause:** RC-2
- **Change:** Per R-56: `rev-parse --verify -q HEAD` exit 1 returns the
  zero result and records "empty history"; any other non-zero is a git fault that fails
  the pass visibly. `merge-base --is-ancestor` exit 128 is not a rewrite: run `cat-file
  -e`, key by ref, `branch_changed` on a different ref, fault with no purge on any other
  status.
- **Location:** `src/miner/cochange.ts` L416–L417 (`if (headProbe.status !== 0) return
  result;` — every failure returns silently), L435–L442 (`if (anc.status === 1 ||
  anc.status === 128)` → `history_rewritten` and a purge).
- **Source:** B7 verification item 5; B7a E-16; B2 E-1 (a); B4 p2 E-1.
- **Depends on:** R-56.

#### R-103 — Miner: epoch, `refTs`, zero weights
- **Root cause:** RC-4
- **Change:** Per R-57: remove `EPOCH_HALF_LIVES = 500`, `MAX_EXPONENT =
  1000` and the exponent re-mine trigger; the re-based epoch with the exact rescale in
  both directions; validate `%ct` (`/^[0-9]+$/`) and the far-future guard, writing
  nothing on failure; count capped commits in a fault; a read rule for a zero
  `change_weight`.
- **Location:** `src/miner/cochange.ts` L35 (`EPOCH_HALF_LIVES = 500`), L37
  (`MAX_EXPONENT = 1000`), L421 (`const refTs = Number(gitOk(…'--format=%ct'…))` — no
  validation; an empty value reads 0), L433 (re-mine trigger), L447 (epoch write).
- **Source:** B7 verification item 4; B7b E-6, E-10; B7c E-1.
- **Depends on:** R-57, R-99.

#### R-104 — Miner: encoding, environment, shallow and grafted roots
- **Root cause:** RC-5
- **Change:** Per R-58: `--encoding=UTF-8` on every log call (including the
  `refTs` read; at `HEAD` `i18n.logOutputEncoding=UTF-16` stores `ref_ts` = `NaN` and
  erases landmines silently); `gitChildEnv` clears every `git rev-parse --local-env-vars`
  variable and `GIT_CONFIG_PARAMETERS`/`GIT_CONFIG_*` (at `HEAD` it clears 5 of 15);
  shallow and graft boundaries excluded as `boundary`.
- **Location:** `src/miner/cochange.ts` (no `encoding` anywhere: grep finds none);
  `src/identity/git_layout.ts` L79 (`REPO_SELECTING_ENV = ['GIT_DIR', 'GIT_WORK_TREE',
  'GIT_INDEX_FILE', 'GIT_OBJECT_DIRECTORY', 'GIT_COMMON_DIR']`).
- **Source:** B7 verification item 5; B7a E-16; B7b E-9 (FA), E-10; B8 verification
  item 9; B8b E-6 (FA).
- **Depends on:** R-58, R-63.

#### R-105 — Miner: the numstat parser
- **Root cause:** RC-5
- **Change:** Per R-59: resynchronise at the next valid header (a
  malformed header no longer credits the next commit's entries to the previous one —
  fabricated pairs at `HEAD`); entries before the fault stay; one fault item per skipped
  run with `after` attribution; the terminal rule for an undatable commit (at `HEAD` it
  makes every pass a purged full re-mine with faults growing 2, 4, 6); reject a `%at`
  above `MAX_SAFE_INTEGER` (a 20-digit `%at` crashes every pass with no fault at
  `HEAD`).
- **Location:** `src/miner/cochange.ts` (the slice parser; lines not pinned).
- **Source:** B7 verification items 2, 3; B7b E-2, E-23; B7c E-1, E-6.
- **Depends on:** R-59.

#### R-106 — Miner: `--reference` reverts
- **Root cause:** RC-5
- **Change:** `isRevertLabelled` recognises the reference-format body line; a `T-13-4`
  case with an edited subject.
- **Location:** `src/miner/labels.ts` L21–L24 (`REVERT_TRAILER.test(body)` or the
  subject prefixes only).
- **Source:** B7 verification item 5; B7a E-17, E-27.
- **Depends on:** R-60.

#### R-107 — Miner and indexer: the inter-chunk yield; the off-path wait
- **Root cause:** RC-3
- **Change:** Yield ≥ 25 ms between write transactions in both passes (the tuning
  row); bound each write transaction below ~100 ms by checking elapsed time before each
  write; the off-path `busy_timeout` value as derived (R-61); `T-13-5b`'s
  appender models the product's writers.
- **Location:** `src/miner/cochange.ts` (no `setTimeout`; its only `await` is
  `streamGitLog`, L513); `src/index/indexer.ts` (no yield; StoreBusy 410 of 552 at
  `HEAD`, B8 verification); `src/cli/context.ts` L38 (the 5,000 ms off-path open).
- **Source:** B3 verification item 2; B7 verification item 7 and "Coordinator errors"
  item 2; B7c E-5; B8 verification item 6; B8a E-17; B8b E-25.
- **Depends on:** R-61, R-68.

#### R-108 — Miner tests that pass while the behaviour is wrong
- **Root cause:** RC-22
- **Change:** `T-13-3`'s pair clause can fail (a multi-file commit under the cap that the
  rewrite drops); `T-13-6e` stops asserting the per-chunk watermark and gains the
  middle-commit and middle-header cases; the merge-commit-has-no-`commits`-row assertion
  (M3 survives 49/49 at `HEAD`); trailer-exactness rows (both mutants survive at
  `HEAD`); the m1 snapshot case; R-6's unrelated 500-constant assertion goes; R-7's title
  becomes "watermark object pruned"; the `''`/`0x…` date rows; the `0x1e`-led non-header
  in `T-13-1r`. The probe/runner of `9823853` per R-58 (g).
- **Location:** `test/unit/miner*.test.ts` (miner.test.ts, miner_review.test.ts,
  miner_rewrite.test.ts, miner_chunks.test.ts, miner_git_env.test.ts);
  `docs/plans/plan-phase-a.probes/14_docker_node_git.optional.sh`.
- **Source:** B7 verification item 9; B7a E-6, E-22, E-28; B7b E-5 (FA); B7c E-2, E-6,
  E-11, E-12 (FA).
- **Depends on:** R-55, R-56, R-59,
  R-58.

#### R-109 — Fixture generator isolation
- **Root cause:** RC-5
- **Change:** Per R-45 (d): the generator's `git` helper and both inline `env`
  objects strip the repository-selecting and `GIT_CONFIG_*` variables (at `HEAD` the
  generator wrote five keys into the outer repository's config); the isolation test.
- **Location:** `test/fixtures/generate.ts`.
- **Source:** B7 verification item 6; B7a E-21.
- **Depends on:** R-45.

#### R-110 — The `index` verb's error channel
- **Root cause:** RC-6
- **Change:** A `catch` at the verb's entry records any thrown error as a fault (with
  the escaped, 2 KB-bounded stderr tail for a git failure) and rethrows so the exit stays
  non-zero; remove the false "or the detached reindex reports" clause; a case running the
  detached reindex against a failing git asserts the fault.
- **Location:** `src/cli/index.ts` L19 (`try {`) and L43 (`} finally {`), no `catch`.
- **Source:** B7 verification item 8; B7b E-24.
- **Depends on:** R-50.

#### R-111 — Indexer and walk: errors are faults, containment
- **Root cause:** RC-6
- **Change:** Per R-63 (a)–(d), (g): absence only for `ENOENT`/`ENOTDIR`/
  `ELOOP` or a non-regular descriptor, otherwise keep rows and record a fault; a
  throwing resolver records `frontend_parse_failed` (`phase: 'resolve'`); no silent
  catches for an unreadable importer or a malformed `package.json`; an unreadable loose
  ref is `unresolved`; drop listed paths beneath a symlinked leading directory before
  `check-ignore` (at `HEAD` such a directory makes `check-ignore` exit 128 and fails every
  pass); the descriptor-derived containment check (at `HEAD` a directory swapped for a
  symlink mid-pass lets the indexer store `outsideSecret`).
- **Location:** `src/index/indexer.ts` L143 (`OPEN_FLAGS` relies on `O_NOFOLLOW`);
  `src/index/walk.ts` L95 (`catch (e)` in the walk).
- **Source:** B8 verification items 1, 2, 3; B8a E-17; B8b E-7, E-9, E-25.
- **Depends on:** R-63.

#### R-112 — Gitfile parsing and `.git` stat
- **Root cause:** RC-6
- **Change:** Per R-63 (e): parse as git's `setup.c` does; a distinct invalid
  result per failure class; report non-`ENOENT` stat errors; the repo-key wiring test.
- **Location:** `src/identity/git_layout.ts` L21 (`POINTER_MAX_BYTES = 4096`), L69
  (`/^gitdir:[ \t]*(.+?)[ \t]*$/m`).
- **Source:** B8 verification item 8; B8a E-13; B8a E-1 (FA).
- **Depends on:** R-63.

#### R-113 — Zone classifier
- **Root cause:** RC-17
- **Change:** Per R-64: the ignore match is its own signal, never
  `generated`; precedence; anchored or disclosed `build/`; lockfile list and the
  200-character cut; comment leaders per language; tests `T-14-3`, RV-9, RV-13.
- **Location:** `src/index/zone.ts` L74 (`if (ignoredTracked) return
  result('generated', IGNORED_TRACKED_EVIDENCE);`), L54 (`BUILD_SEGMENTS = new
  Set(['dist', 'build'])` at any depth); `test/unit/indexer_walk.test.ts` L112–L113 (B8a
  E-25, FA).
- **Source:** B8 verification item 7; B8a E-9, E-21; B8b E-8 (FA).
- **Depends on:** R-64.

#### R-114 — Search storage and header
- **Root cause:** RC-12
- **Change:** Fallback token tables written only under `fts_state = 'fallback'`; the
  `search.ts` header states the current rule; the storage assertion per FTS state in
  the tests.
- **Location:** `src/index/indexer.ts` (the both-tables write) and `src/index/search.ts`
  L1–L3.
- **Source:** B8 verification item 5; B8a E-17, E-19 (FA), E-23 (FA).
- **Depends on:** R-62.

#### R-115 — Indexer: dependency tracking, per-language fingerprint, `version`
- **Root cause:** RC-21
- **Change:** Per R-65. At `HEAD` stale rows persist until `--full` for a
  `.ts` next to a `.js`, an extensionless import, a Python name first classed external,
  and an added, removed or deleted `package.json` dependency; the whole-tree fingerprint
  re-parses 21 files for one new `.py`; mutants A2, A3, N1 and K3 survive all 55 unit
  test files.
- **Location:** `src/index/indexer.ts` (fingerprint and skip); `src/index/resolvers.ts`.
- **Source:** B8 verification item 4; B8b E-3, E-25; B8b E-4 (FA); B9 E-19.
- **Depends on:** R-65.

#### R-116 — Reindex claim result
- **Root cause:** RC-28
- **Change:** Per R-66.
- **Location:** `src/index/indexer.ts` L355 (`acquireReindexClaim(store): { acquired:
  true } | { acquired: false; ownerPid: number }`), L477 (`startedAt` re-read);
  `src/cli/index.ts` L36 and `src/cli/init.ts` L53 (both re-read `reindex_started_at`).
- **Source:** B8 verification item 11; B8a E-3, E-4, E-12, E-14.
- **Depends on:** R-66.

#### R-117 — Reftable detection
- **Root cause:** RC-27
- **Change:** Drop the config scan; keep the transition fault and `{stale: false}`; the
  `runIndex`-clears-`head_unresolved_since` test; the dampening is Step 28's (R-77).
- **Location:** `src/index/indexer.ts` L298 (`configSaysReftable(path.join(commonDir,
  'config'))`).
- **Source:** B8 verification item 10; B8b E-14, E-23.
- **Depends on:** R-67.

#### R-118 — `init` order
- **Root cause:** RC-10
- **Change:** Per R-80: index first, or unwire on failure; worktree rule;
  refusal exit 75; checksum refusal.
- **Location:** `src/cli/init.ts` L29–L35 (hook commands written, L35
  `writeFileSync(settingsPath, …)`) before L44 (`await runIndex(…)`).
- **Source:** B6 verification item 9; B6a E-23; B8 verification item 11.
- **Depends on:** R-80.

#### R-119 — Grammars: Lua restored, Swift rebuilt, per-grammar WASM path
- **Root cause:** RC-7
- **Change:** Per R-69: vendored Lua and rebuilt Swift WASMs loaded
  through a per-grammar path from the table, checked by sha256; `.lua=lua` restored in
  the seed table; the seed comment states each remaining exclusion's cause (`elm`, `ql`:
  ABI; `yaml`, `bash`: missing runtime exports) and drops the "error-free on every
  repeated parse" certification; a `lua` `QUERIES` entry.
- **Location:** `src/stores/dao/tuning_seeds.ts` L64–L68 (comment: "the 31 grammars the
  pinned runtime loads and parses / error-free on every repeated parse"); the loader in
  `src/index/tree_sitter_frontend.ts`.
- **Source:** B9 verification item 1; B9 E-1, E-18.
- **Depends on:** R-69.

#### R-120 — Frontends: throws, catches, version, table, generic
- **Root cause:** RC-6
- **Change:** Per R-71: per-file ERROR-tree signal (at `HEAD` swift
  returns `[]` in place of `["f","P","g"]` with `ok: true`); per-process disable on first
  throw; no empty `catch` around `delete()`; no cached rejected `Parser.init()`;
  `version` a content digest (no `'unknown'`); a malformed table member records a fault;
  the generic frontend's share/retry, binary/prose skip and name bound.
- **Location:** `src/index/tree_sitter_frontend.ts` L309 (`p.catch(() =>
  loaded.delete(lang))`), L322, L396, L413, L446, L454 (catch blocks); B9 E-19 cites
  L302, L323, L394–L398, L420–L445, L451–L456; `src/index/frontends.ts` L18 (`if (eq <=
  0) continue;` — a malformed member skipped silently); `src/index/generic_frontend.ts`.
- **Source:** B9 verification items 2, 5, 7; B9 E-19, E-16; B9 E-14, E-15, E-38 (FA).
- **Depends on:** R-71.

#### R-121 — Resolvers
- **Root cause:** RC-8
- **Change:** Per R-70: TypeScript order with declaration files,
  workspace packages in-repo, `.`/`..` as directories; Python external only for the
  vendored stdlib list or a declared distribution; `hasTopLevelModule` removed (at
  `HEAD` an undeclared `requests` is external, a stdlib `json` becomes unresolved when
  `lib/util/json.py` exists, and a false edge `a/b/x.py → a/config.py` is recorded).
- **Location:** `src/index/resolvers.ts` L139 (`return
  repo.hasTopLevelModule(rest.split('.')[0] as string) ? UNRESOLVED : EXTERNAL;`);
  `src/index/frontend.ts` L35; `src/index/indexer.ts` L732.
- **Source:** B9 verification items 3, 4; B9 E-29, E-32, E-33 (FA); B9 E-7, E-17 (FA).
- **Depends on:** R-70.

#### R-122 — Identifier redaction and the injection check
- **Root cause:** RC-20
- **Change:** Pass `security.entropy_*` from the tuning reader to `redact`; apply the
  identifier rule (pattern rules only) to every frontend's names; word-split names
  before `isSuspect`. These date from `0e457c7` (`redact(s.name)`) and `177e59f`
  (`redact(parsed.error)`, the raw-name `isSuspect`) and are recorded as findings of
  those commits.
- **Location:** `src/index/indexer.ts` L676 (`redact(parsed.error)`), L690
  (`name: redact(s.name).redacted`), L809 (`pf.symbols.some((s) => isSuspect(s.name))`).
- **Source:** B9 verification items 5, 6; B9 E-16, E-39.
- **Depends on:** R-21.

#### R-123 — Command-class splitter
- **Root cause:** RC-19
- **Change:** Split on newline and `&`; heredocs class 3 wholesale or parsed; pytest
  node-id stripping and the normalisation base per R-73.
- **Location:** `src/genres/command_class.ts` L12–L40 (`splitSegments` splits on `&&`,
  `||`, `;`, `|` only).
- **Source:** B2 verification item 3; B2 E-5 (h); B4 p3 E-24.
- **Depends on:** R-73.

#### R-124 — Hook handler, adapter and CLI entry
- **Root cause:** RC-6
- **Change:** Per R-77: unreadable stdin records a fault and returns `''`;
  an event without `cwd` is a fault; the AC-8a line is audited before emission;
  `targetPath` normalised against the repository root; the `store_corrupt` catch-all is
  retired (at `HEAD` a stored non-numeric `deny.loop_threshold` is recorded as
  `store_corrupt` and the deny stops — see Part 4, gap G-6); layout paths computed
  without creating on the event path.
- **Location:** `src/cli/hook.ts` L14–L15 (`} catch { stdin = '{}';`);
  `src/hook/adapter.ts` L18 (`const cwd = str(j.cwd) ?? process.cwd();`), L29 (`session:
  str(j.session_id) ?? 'unknown'`); `src/hook/handler.ts` L85–L87 (`ensureLayout(home,
  key)`; "not initialized: fail open"), L127–L128 (cwd-relative `targetPath`),
  L242–L255 (the `outstandingQuestionLine` text joins the body but only `texts` are
  audited), L276 (`'store_corrupt'`); `src/blocks/health.ts` L32.
- **Source:** B2 verification item 5; B2 E-7; B6 verification item 2; B6a E-24.
- **Depends on:** R-77.

#### R-125 — `import` refuses until rebuilt
- **Root cause:** RC-15
- **Change:** Until R-81's rebuild lands, `import` exits non-zero with the
  reason. At `HEAD` it opens the source with `openStore(src)`, which creates a missing
  file that passes `quick_check`, and then `copyFileSync`s it over the live store — a
  data-loss path.
- **Location:** `src/cli/verbs_skeleton.ts` L191 (`importVerb`), L202–L203 (`openStore(src)`;
  `integrityCheck()`), L213 (`copyFileSync(src, dest)`).
- **Source:** B2 verification item 6; B2 E-9.
- **Depends on:** R-81.

#### R-126 — Skeleton verbs, fold header, model seam, e2e test
- **Root cause:** RC-24
- **Change:** (a) The `note --kind landmine` refusal goes to stderr. (b) The fold's
  header says what the code counts (the body is a marked 1R stand-in; the header still
  describes the full fold). (c) `invoke.ts`'s "except its unit test" is false (no test
  imports it): correct it. (d) The skeleton e2e test's stop-point comment names the first
  `PostToolUse` (the coupling whisper), which prints nothing because no generator yields
  candidates; its FR-A6 pinning, connectivity claim and `Stop` input per
  R-78. (f) `correct --missed-question` derives the consumer instead of
  the hard-coded `'main'` (B2 E-9). (e) The writers-only convention test resolves each import specifier against its
  importing file (so a sibling `./faults.js` import counts), adds a sibling-DAO seed, and
  asserts the allow-list check rejects each seed (both sibling-DAO mutants survive at
  `HEAD`).
- **Location:** `src/cli/verbs_skeleton.ts` L159–L162, L109 (`openQuestion(r.project, {
  consumer: 'main', …})`); `src/diag/whisper_stats_fold.ts`
  L1–L4 (header) and L8 (`SKELETON: 1R` stand-in); `src/model/invoke.ts` L6–L7
  ("Nothing in / Phase A imports this module except its unit test.") — `grep -rln
  model/invoke test src` finds no importer; `test/unit/skeleton_e2e.test.ts`;
  `test/conventions/fault_session_writers_only.test.ts`.
- **Source:** B6a E-21; B2 verification item 7; B2 E-9; B6c E-29; B2 E-7; B6 verification
  item 8; B6b E-17.
- **Depends on:** R-78, R-84.

#### R-127 — Steps 1–12 tests that pass while wrong
- **Root cause:** RC-22
- **Change:** The tests the B6 verification lists (item 8) that no other code item
  carries: `writtenSinceSeq`'s tool partition; the `indexer-nongit` plan wording (the
  fixture shape is fixed at `HEAD`, B6b E-3); fixture shapes that match real transcripts
  (human `message.content` a string, B6b E-1); `T-6-4g` gains `consumerRole('s1#main#x')`
  throws; `T-5-4`/`T-5-5` data; the `rev-list` literal (B6b E-4); the `0x5c`/BOM datum
  (B6b E-7); the non-ASCII pass-through tokenizer datum (B6b E-13).
- **Location:** `test/unit/` (dao_crud, consumer_key, path_bytes, spawn_wrapper,
  generator_determinism, search_semantics tests).
- **Source:** B6 verification item 8; B6b E-1, E-4, E-7, E-13 (FA), E-14; B6c E-3.
- **Depends on:** R-45, R-48, R-49, R-53.

#### R-128 — Step 14 tests that pass while wrong
- **Root cause:** RC-22
- **Change:** The B8 verification item 13 list, as specified in R-67 (d),
  (e), R-65 and R-62: the transitive "spawns nothing" check;
  multi-segment `**`; normalise-before-split; RV-12's zone-change masking; the
  repeated-fault and unconditional-release gaps (9 of 35 mutants survive in 8b's run).
- **Location:** `test/unit/indexer*.test.ts`, `test/unit/path_glob.test.ts`,
  `test/unit/search_semantics.test.ts`; RV-12 at `test/unit/indexer_review.test.ts`
  L329 and L333.
- **Source:** B8 verification item 13; B8a E-7, E-23–E-28; B8b E-20–E-24.
- **Depends on:** R-67, R-65, R-62.

#### R-129 — Step 15 tests that pass while wrong
- **Root cause:** RC-22
- **Change:** The B9 verification item 8 list, as specified in R-71 (h)
  and R-70: `T-15-1` spans; `T-15-4` faults, reuse clause, share and
  many-throws with a second pass in the same process; `T-15-5` cells and nearest-first
  order; `T-15-3`'s `unknown` expectation; the review's test file (RV15-*).
- **Location:** `test/unit/tree_sitter_frontend*.test.ts`,
  `test/unit/import_resolvers.test.ts`, `test/unit/frontends_review.test.ts`,
  `test/unit/generic_frontend.test.ts`.
- **Source:** B9 verification item 8; B9 E-9, E-26, E-27, E-23, E-30, E-34, E-8, E-24,
  E-36 (FA).
- **Depends on:** R-71, R-70.

### 2.5 Records — STATUS, implementation-log, collapse-log, review records, and the instruction files

`docs/STATUS.md` at `HEAD` is 369 lines, last rewritten at `fbb9052` ("STATUS — Step 14
built and reviewed; next is Step 15"). It is rewritten whole at the end of the
correction pass (project CLAUDE.md, session end), so its items below say what the
rewrite must state. Review files are written once and never edited (project CLAUDE.md
routing table), so a correction to a review is a later review record in
`docs/reviews/`. The instruction files (project `CLAUDE.md`, `OWNER-LEDGER.md`, the
project copy of the expert-implement skill, `tools/planted_defect_test.py`) are
batch 1's items and are grouped here.

#### R-130 — STATUS: success claims that were not established
- **Root cause:** RC-23
- **Change:** The rewrite states, in plain words: `c3a25f0` (the Steps 1–12 fixes),
  `6bbda1d` (the Step 13 fixes) and `7fdbd7e` (the 1,547-line Step 14 fixes) were not
  independently reviewed — each STATUS "built and reviewed" was committed 2 to 16 seconds
  after its fix commit; "CI is green" is replaced by the observed run, its outcome and
  time; "both fixed" for the Step 14 review becomes "S2 covers presence only"; "Every
  finding held on checking, and all of them are fixed" names the four unapplied items
  (FR-O2/C-4 dates; M12's key check; M9's stored-set check; M5's `test_map` display)
  and says the lock fix is a chunking change not yet shown to let the event path
  acquire the lock; "Every finding held on checking except one detail" becomes a
  disposition statement (applied or rejected on the record; H5's session rule applied
  at `6cff0ce` and later found to contradict AD-16); "follows the architecture as it
  stands" gives the true state; the gap-list review counts are 27 hold, 9 partially, 1
  does not; "Every CLI verb runs" is limited to the verbs and cases actually run; 414 ms
  is a synthetic benchmark's figure; "waits 5 s" is about 10 s (two busy periods under
  the retry-once); "2.4 s" is the pre-fix build's time (`57bdd4a`) or is re-measured;
  "1,881 files in 3.8 s" was a run with no parsers; the real-repository miner run was a
  shallow checkout. Restore the plain-language disclosure that FR-O2/C-4 in the spec
  was edited (and is now the owner item R-6). Step 15's state is recorded (at
  `HEAD` STATUS predates Step 15).
- **Location:** `docs/STATUS.md` L186 ("Every CLI verb runs."), L207–L219 ("**24 gaps
  hold,**" … "**7 partially hold,** and **1 does not:**"), L233–L234 ("Every finding held
  on checking, and all of them are fixed"), L238–L239 (414 ms), L258–L259 ("follows the
  architecture as it stands"), L268 ("Every finding held on checking except one
  detail"), L295 ("and CI is green"), L300 ("is built and reviewed"), L307 ("now waits
  5 s"), L308 ("in 2.4 s"), L311 ("is built and reviewed"), L318 ("both fixed"), L321
  ("1,881 files in 3.8 s").
- **Source:** B6 verification "A coordinator error, recorded" and item 10; B6c E-33;
  B7 verification item 10; B7c E-16, E-17 (FA); B8 verification item 15; B8b E-27 (FA);
  B3 verification item 9; B3b E-22, E-23 (FA); B5 verification item 13; B5c E-6, E-7;
  B2 E-14; B2 E-10; B9 verification item 9.
- **Depends on:** the code and plan items it reports on.

#### R-131 — STATUS: the build-method record
- **Root cause:** RC-24
- **Change:** Keep the decision. The record (a) cites the walking skeleton with a
  checkable source (Cockburn, *Crystal Clear*, 2004, or Freeman & Pryce, *GOOS*, 2009,
  ch. 4) and states its scope honestly (an early end-to-end link that exposes
  integration gaps; "in one pass" marked as the record's derivation, with Claude's
  caveat "doesn't catch every fine detail"); (b) points to the expert-implement
  reconciliation (R-146); (c) either adds a mutation-testing tool and a plan step
  that runs it, with the DeMillo–Lipton–Sayward 1978 source, or deletes the commitment;
  (d) sources independent test authorship and states why the gap list is reviewed once;
  (e) rewords "a separate reviewer checks the built code once" so that a post-review
  rewrite is reviewed too; (f) restores the rename-history question as an open
  engineering item (R-91).
- **Location:** `docs/STATUS.md` L326–L334 ("Build each step fully", L327; "mutation testing
  checks that the tests catch broken code;", L331; "a separate reviewer checks the built
  code once;", L332).
- **Source:** B1 verification item 6; B1 E-15; B2 verification item 9; B2 E-11 (FA); B7c
  E-17 (FA).
- **Depends on:** R-146.

#### R-132 — STATUS: the planted-defect result
- **Root cause:** RC-24
- **Change:** Keep the null result. Add the six-line summary (case, revision, exit,
  named, flagged), both revision ids (`de66831` vs `de937e6`), the note that "new"
  predates the E-12 edits, and one sentence that each cell was confirmed by reading the
  transcript. Rewrite the "Those plants are blatant" paragraph so it either states the
  ceiling-effect explanation as an untested hypothesis ("no cell without a rule was
  run") or drops both the explanation and the "blatant" judgment. If the transcripts are
  kept, they go to `docs/reviews/` with STATUS holding the summary and pointer.
- **Location:** `docs/STATUS.md` L336–L349 (L347: "Those plants are blatant.").
- **Source:** B1 verification item 7; B1 E-16; B2 verification item 9; B2 E-12.
- **Depends on:** none.

#### R-133 — STATUS: the Stop gates and the correction loop
- **Root cause:** RC-26
- **Change:** Fix "the gates then fail closed" (the gates were short-circuited by an
  `exit 0` at line 2 in `9b29353`, and restored in `1b8b47a` with the session
  environment scrubbed from their judge, tested on a complete and a punted turn). Record
  that the correction loop (`serve.py`, `guard.py`, `judge.py`) stays off via
  `CORRECTION_LOOP_JUDGE_RUN=1`, as Max Cogar asked (OL-C8 and his 2026-09-26 words).
- **Location:** `docs/STATUS.md` L364–L369 (L368: "the gates then fail closed").
- **Source:** B1 verification item 2; B1 E-6, E-8.
- **Depends on:** R-143.

#### R-134 — STATUS: open items and citations
- **Root cause:** RC-24
- **Change:** The runtime-pin item cites the CI run it rests on. The `unshare` item is
  restated from the plan's recorded 2026-09-07 observation (the plan records it
  refused), not as open. The pre-emptive gate is cited to OL-C2 (OL-R4 only as the
  rejected-block example).
- **Location:** `docs/STATUS.md` L353–L354 (runtime pin), L355–L357 ("**Sandbox premise
  — still open:**"), L251 ("the / pre-emptive gate already rejected (OL-R4)").
- **Source:** B2 verification item 9; B2 E-14, E-15 (FA).
- **Depends on:** none.

#### R-135 — STATUS: what to do next
- **Root cause:** RC-23
- **Change:** The next-steps list names, in order: the correction pass's own owner
  question (R-6); the independent review of the unreviewed fix commits (put
  before the next step's build, B8b E-27); the independent collapse-hunt of `ec3b057`'s
  decisions and the §10A tests (R-142, R-88); then the step builds. Carry
  B1's two unanswered owner questions (R-148).
- **Location:** `docs/STATUS.md` "Next, in order", L326 onward.
- **Source:** B8b E-27 (FA); B5c E-7; B3b E-24; B1 verification "Questions".
- **Depends on:** R-6, R-142, R-148.

#### R-136 — implementation-log: the skeleton gap list and run records
- **Root cause:** RC-24
- **Change:** Every gap carries a decision, a reason and a source (or says "open"), and
  every run record carries its command and output. Specifically: G1's keyword list is
  sourced or replaced by SZZ's regex; G4's double-count is recorded; G11 names AD-3's
  non-git mode it dropped and gets a source, and G12's spot check is recorded; G12 names
  that its extension list crosses languages; G17 states that every consumer
  substituted a literal seed copy with no fault; G20 reads "the high-confidence tier is
  undefined; the skeleton applies no trust cap and so suspends FR-X4's lowering"; G24
  reads "AD-19 permits paths, numbers and names; the gap is that a free-text headline
  representation lets other text in"; G23 and G25 get a `*Skeleton:*` choice, reason
  and source; G26's evidence is committed (not a private transcript); G28 is wording,
  not a gap; G29's provisional deny fails open instead; the recognizer claim gets its
  evidence or goes; the classifier spot-check commands and outputs are added; G36 is
  re-backed on spec §11.5's population and measurement validity, not OL-R5; the
  smoke-run and latency commands are pasted and "every verb worked" is limited to the
  cases run; the e2e account says the whisper proves the pipe, not the bar.
- **Location:** `docs/implementation-log.md` "Skeleton gap list", L487 onward, and the
  skeleton step sections L680–L766.
- **Source:** B2 verification item 8; B2 E-2, E-4, E-8, E-11 (FA); B2 E-6, E-10; B2 E-7
  (e2e account); B2 E-3 (cross-language tries to E-4).
- **Depends on:** none.

#### R-137 — implementation-log: the build and fix entries
- **Root cause:** RC-23
- **Change:** Headings state each commit's true state: committed; not independently
  reviewed (the "uncommitted, pending independent review" headings are stale). The
  red-first accounts are marked unverifiable from history where they are (B6c E-32, B8b
  E-26, B9 E-28). Specifics: Reopened Steps 1–12 — "(34 names)" → 35; finding 1 states
  that §9's stop applied and was not taken, naming `PREMISE-FALSE` for `indexer.ts` and
  `BLAST-RADIUS-EXCEEDS-PLAN` for `search.ts`; record the two plan-silence decisions
  (`prov_ref = path`, `{ok: true}` outside the relations) with the defects they carry;
  the skeleton test's stop point is the first `PostToolUse`; `T-3-5i` was red by a load
  failure, not the defect; the review's M1 items not applied (Step 7's sentence; the
  process finding). Step 13 fixes — correct the `commitsSeen` sentence; state m5's two
  limits (an unreadable commit refused on every pass so a full mine never completes; an
  out-of-range digit string crashes every pass with no fault) and M2's full-pass limit
  (the watermark can reach `HEAD` while a middle commit is missing). Step 14 — the
  absent-on-error rule and the silent resolve catch are recorded as decisions with the
  defects they carry, not as settled; the omitted decisions (absent-on-error, the
  `package.json` and `symbol_refs` catches) are listed; the `generated` count is
  qualified. Step 15 — correct the false `sys.path[0]` premise, cite the batch 4 ruling
  and state the conflict, list the omitted decisions, drop "uncommitted".
- **Location:** `docs/implementation-log.md` L767 (Reopened Steps 1–12 heading), L784
  ("(34 names)"), L878 (Findings), L920, L975, L1096 (Step 13 fixes; `commitsSeen` at
  L1117), L1179, L1383 (Step 14), L1532, L1715, L1734, L1757 (Step 15, `sys.path[0]`).
- **Source:** B6 verification item 10; B6a E-25 (FA); B6b E-3; B6c E-29, E-32 (FA); B7
  verification item 10; B7c E-15; B8 verification item 15; B8a E-30 (FA); B8b E-26 (FA);
  B9 verification item 9; B9 E-28, E-35 (FA).
- **Depends on:** none.

#### R-138 — collapse-log corrections
- **Root cause:** RC-24
- **Change:** (a) The HERZIG attribution in the 2026-09-26 architecture-pass entry
  says what HERZIG shows (tangled changes inject noise; large commits are mostly
  perfective), and the fifth defect's double-count is marked reasoned from the text, not
  executed. (b) The D-plan-39 collapse is recorded as a recurrence of the same-day lesson
  (4), with why that lesson did not hold (the trace was over an aggregate population),
  lesson (1) folded in as its refinement; "Fixed in AD-16" becomes "the admission rule is
  fixed; the unreported empty read reseed remains open". (c) In the Step 13 entry,
  replace "The fix was right for its purpose" with a statement scoped to what it fixed,
  citing ruling 2 and the executed zero-weight case.
- **Location:** `docs/collapse-log.md` 2026-09-26 entries: L1544 (architecture pass;
  HERZIG at L1560), L1621 (plan pass; D-plan-39 at L1628–L1643, "Fixed in AD-16" at
  L1635), L1673 (Step 13).
- **Source:** B3 verification item 9; B3b E-25 (FA); B5 verification item 13; B5a E-27;
  B7 verification item 10; B7c E-18 (FA).
- **Depends on:** R-33.

#### R-139 — Later record for the skeleton gap-list review
- **Root cause:** RC-23
- **Change:** A later review record states: the ten defects the review missed (the
  parser's silent leading-field drop; the zone regex matching "generated by" in any
  text; the mixed-unit generic-frontend spans; Orientation's constants filling AD-14's
  undefined structural confidence; the missing newline and `&` separators; the
  half-implemented noise floor; `import` validating its source by creating it; the
  non-atomic two-file import; the fold header claiming corrections; the e2e whisper
  passing the bar only through three defects); that the method sentence "Every
  behavioral claim below was checked by running the built code" is contradicted by N11,
  which stays unexecuted until executed; that G36 stands on its stated source, not
  OL-R5; that the fork parent-id premise stays open until the hooks reference or an
  executed probe settles it.
- **Location:** new file in `docs/reviews/` (the review
  `docs/reviews/2026-09-25-skeleton-gap-list-review.md` is not edited).
- **Source:** B2 E-13; B2 verification "Corrections to the first audit's own text".
- **Depends on:** none.

#### R-140 — Later record for the architecture-pass reviews
- **Root cause:** RC-23
- **Change:** Records that the collapse-hunt's D1, D10, D18, D21 and D24 "survives"
  verdicts were wrong at source; that its owner-routing sentence contradicts the project
  CLAUDE.md locked-decision rule for §12 judgments (the Read-time Warning alternative
  would go to Max Cogar); that C3's channel reason rests on the unsourced FR-O2 clause;
  that the expert review's m2 missed the unsourced clause, its date half is unapplied
  (R-2), and S2's "every refresh" headline overstates its body; and the
  "new stored value with no reader or reset" pattern check is run across the whole
  architecture.
- **Location:** new file in `docs/reviews/` (the collapse-hunt and expert review of
  2026-09-26 are not edited).
- **Source:** B3a E-20, E-21.
- **Depends on:** R-1.

#### R-141 — Later records for the Steps 1–12, 13, 14 and 15 build reviews
- **Root cause:** RC-23
- **Change:** One later record per review. Steps 1–12 (`2026-09-26-steps-1-12-build-
  review.md`): its table has 56 rows, 21 killed before, 2 marked equivalent, so 33
  non-equivalent survivors, not "31 of 54"; builder flaw 5 ("Seven" fixture names) and
  Step 7's sentence are unapplied (R-45, R-51). Step 13
  (`2026-09-26-step-13-build-review.md`): its `rev-parse` and `merge-base` "Holds" rows
  are wrong; its mutant set omitted the `--no-merges` pin; M3's clamp count, m3's
  per-pass cap, M1's object-format read and `--no-relative` were dropped without a
  recorded decision (each applied or rejected with a reason). Step 14
  (`2026-09-26-step-14-build-review.md`): S2's "exactly" claim is false; it missed the
  catch-all read-error absence, the missing inter-chunk yield, the parent-directory link
  read and the fingerprint over-count; m1 was applied to 5 of 15 variables, m3's key
  change, m7's false reason and M4's §15 record were dropped or narrowed. Step 15
  (`ff99487`): corrects the two "Holds" rows (Python external test; Lua exclusion) and
  the M60 classification; states misses 3–6 (the `sys.path[0]` false edge; swift and the
  31-grammar claim; the `defaultFrontends` skip; the pass-scoped bound); gives S1, M1,
  M2, M5 and m1–m11 each an on-record disposition, S1's using the per-process bound.
- **Location:** new files in `docs/reviews/`.
- **Source:** B6c E-1; B7 verification item 10; B7b E-1 (FA); B8 verification item 15;
  B8b E-2 (FA); B9 verification item 9; B9 E-37.
- **Depends on:** R-71.

#### R-142 — The independent collapse-hunt the `ec3b057` decisions never had
- **Root cause:** RC-23
- **Change:** One independent collapse-hunt of the load-bearing decisions `ec3b057`
  introduced (the chunked lock bound, `mining_in_progress`, the trust dampener, the
  replica fold, the unresolved-import share, the masked-pointer drop rule), run as part
  of the correction pass's review, findings checked once and applied or rejected on the
  record (the project CLAUDE.md rule, not a new round).
- **Location:** a new review record in `docs/reviews/`.
- **Source:** B3 verification item 10; B3b E-24.
- **Depends on:** the architecture items that change those decisions (R-36,
  R-28, R-34, R-16, R-30).

#### R-143 — OWNER-LEDGER: OL-C8's context
- **Root cause:** RC-26
- **Change:** Keep OL-C8 CONFIRMED. Replace "in full" with the two-sentence quotation
  (the reason sentence "5. I'm constantly fucked by agents arbitrarily defining scope so
  they don't have to do more work." plus the judge sentence) and the prompt it answered.
  Add Max Cogar's 2026-09-26 words as a dated CONFIRMED source line under OL-C8, with the
  plain reading they fix: "the judge" is the correction loop (all three scripts off via
  `CORRECTION_LOOP_JUDGE_RUN=1`, as asked); "the other shit" is the two Stop gates,
  short-circuited by `9b29353` without his asking. Add his approval of the findings rule,
  conditional on its being done correctly.
- **Location:** `OWNER-LEDGER.md` L74 (OL-C8 row: "Max Cogar's words, in full:").
- **Source:** B1 verification item 3; B1 E-7; B1 E-13.
- **Depends on:** none. The ledger changes only with Max Cogar's words already on record
  (owner-messages M40); these are his words, not a new claim.

#### R-144 — Project CLAUDE.md: the findings rule
- **Root cause:** RC-26
- **Change:** Keep the wording. Add at the line its backing (a review finding is a claim
  to check — the "Locked means…" paragraph and `.claude/rules/raise-flaws.md`; Max
  Cogar's 2026-09-26 approval, conditional on correctness) and one clause: a rejection is
  written on the review record with its evidence and is checked by the next independent
  review, not final on the applier's say-so.
- **Location:** `middleware/context-oracle/CLAUDE.md` L228–L230 ("When a review surfaces
  findings, apply every finding that holds up.").
- **Source:** B1 verification item 4; B1 E-13.
- **Depends on:** none.

#### R-145 — Project CLAUDE.md: the flaw paragraph becomes a pointer
- **Root cause:** RC-26
- **Change:** Reduce the "Locked means…" paragraph to the one-sentence principle, a
  pointer to `.claude/rules/raise-flaws.md` as the rule's home, the project-specific
  input list, and the OL-11 routing sentence; remove the duplicated trigger list and the
  duplicated "raising it means / what this prevents / preference" sentences. Record the
  reason at the edit (one home; the rules file loads unconditionally, the project file
  conditionally).
- **Location:** `middleware/context-oracle/CLAUDE.md` L186 onward ("**Locked means you
  don't change it on your own.").
- **Source:** B1 verification item 5; B1 E-1/E-17.
- **Depends on:** none.

#### R-146 — expert-implement (project copy): the fourth trigger and the gap route
- **Root cause:** RC-26
- **Change:** Make PLAN-FLAW's trigger list identical to the four in CLAUDE.md (add "is
  too unclear to act on without guessing"); replace "There is no third option" with the
  build method's route for a plan gap (decide it within spec/architecture/tests, record
  decision + reason + source on the gap list, pin it with a test), so a gap has a
  recorded route and a flaw has a stop; record the reason at the edit.
- **Location:** `middleware/context-oracle/.claude/skills/expert-implement/SKILL.md` L98
  ("There is no third option."), L119 ("Five categories qualify, and only these five"),
  L123 (PLAN-FLAW's three triggers).
- **Source:** B1 verification item 1; B1 E-2; B1 E-15.
- **Depends on:** none. **Consumed by:** R-131.

#### R-147 — `tools/planted_defect_test.py`
- **Root cause:** RC-26
- **Change:** Grade on objection to the planted item using a unique planted token absent
  from the clean clone (assert its absence first); report timeouts, non-zero exits and
  non-JSON output as failed runs; use a neutral fixed snapshot author; give
  `--max-turns` and `--timeout` a stated reason or make them required; pass `--settings
  '{"plansDirectory": "plans"}'` to each nested `claude -p`, copy `<clone>/plans/` into
  `--out`, remove the `~/.claude/plans` snapshot/delete block — after one confirming run
  with its command and output recorded.
- **Location:** `tools/planted_defect_test.py` L43 (`OBJECTION`), L120–L121 (author
  `"Max Cogar"`), L140 (`"--max-turns", "40"`), L150 (`flagged = named and …`),
  L153–L155 (timeout recorded as not flagged), L169 (`--timeout` default 1200),
  L176–L186 (the `~/.claude/plans` delete).
- **Source:** B1 verification item 9; B1 E-10, E-11.
- **Depends on:** none.

#### R-148 — Batch 1's two owner questions
- **Root cause:** RC-26
- **Change:** Put to Max Cogar, in STATUS, the two questions batch 1 recorded: (1) the
  review exit criterion (stop when nothing Critical or Serious is open, with Minor
  findings logged and scheduled?); (2) whether the repository-root `CLAUDE.md` line
  "apply *all* of them" should get the project's wording.
- **Location:** `docs/STATUS.md` (owner question section).
- **Source:** B1 verification "Questions for Max Cogar" 1 and 2; B1 E-13 ("Owner
  question").
- **Depends on:** none. See Part 4, U-3 (later verifications stopped listing them).
## Part 3 — Plan step dependencies (Steps 1–39)

Built from each item's "Plan steps" and "Depends on" fields. Columns: **Plan items** change the step's own text; **Must follow** are spec/architecture items the step's text must be brought in line with; **Code/tests** are the build items for the step; **Its changes are consumed by** lists the later steps that read what the step's plan items change (from each plan item's "consumed by" field). A step with no entry has no correction on record. Step 40 (post-completion housekeeping, plan L7526) is outside the requested range and no item touches it.

| Step | Plan items | Must follow (spec/arch) | Code/tests | Its changes are consumed by steps |
|---|---|---|---|---|
| 1 | R-43, R-45 | R-15 | R-109, R-127 | 13, 28, 31, 32 |
| 2 | — | — | — | — |
| 3 | R-42, R-44, R-46, R-88 | R-35, R-36 | R-92, R-93 | 13, 14, 28, 32 |
| 4 | R-47 | R-12 | R-94 | 28, 31, 32 |
| 5 | R-48 | — | R-95, R-127 | 13, 14 |
| 6 | R-49, R-50, R-85 | R-23, R-33 | R-96, R-97, R-100, R-110, R-127 | 9, 12, 18, 19, 28 |
| 7 | R-44, R-51 | R-10, R-11, R-24, R-35 | R-92 | 13, 14 |
| 8 | R-44, R-52 | R-35 | R-92 | — |
| 9 | R-53, R-85 | R-13 | R-98, R-127 | 13, 18, 28, 30, 34 |
| 10 | — | R-7 | — | — |
| 11 | — | — | — | — |
| 12 | R-54, R-69, R-89 | R-14, R-24, R-25, R-28, R-36 | R-99, R-119 | 13, 16, 28, 33 |
| 13 | R-41, R-50, R-55, R-56, R-57, R-58, R-59, R-60, R-61, R-89, R-90, R-91 | R-22, R-23, R-24, R-25, R-36, R-40 | R-100, R-101, R-102, R-103, R-104, R-105, R-106, R-107, R-108, R-110 | 16, 28 |
| 14 | R-50, R-62, R-63, R-64, R-65, R-66, R-67, R-68, R-88, R-90 | R-10, R-11, R-16, R-17, R-18, R-19, R-21, R-36, R-37 | R-100, R-104, R-107, R-110, R-111, R-112, R-113, R-114, R-115, R-116, R-117, R-128 | — |
| 15 | R-65, R-67, R-69, R-70, R-71, R-90 | R-10, R-14, R-15, R-16, R-19, R-20, R-21 | R-115, R-117, R-119, R-120, R-121, R-128, R-129 | — |
| 16 | R-72, R-90 | R-22, R-24, R-26, R-27, R-29 | — | — |
| 17 | R-73, R-90 | R-31 | R-123 | — |
| 18 | R-74, R-90 | R-1, R-3, R-4, R-8, R-26, R-30, R-32 | — | 38 |
| 19 | R-75, R-90 | R-30 | — | — |
| 20 | — | — | — | — |
| 21 | R-50, R-76, R-88 | R-33 | R-100, R-110 | — |
| 22 | — | — | — | — |
| 23 | — | — | — | — |
| 24 | — | — | — | — |
| 25 | — | — | — | — |
| 26 | — | — | — | — |
| 27 | — | — | — | — |
| 28 | R-44, R-50, R-76, R-77, R-78 | R-1, R-8, R-12, R-22, R-33, R-35 | R-92, R-100, R-110, R-124, R-126 | — |
| 29 | — | R-7 | — | — |
| 30 | R-79 | — | — | — |
| 31 | R-44, R-50, R-66, R-80 | R-35, R-37 | R-92, R-100, R-110, R-116, R-118 | — |
| 32 | R-44, R-81, R-88 | R-34, R-35 | R-92, R-125 | — |
| 33 | R-79, R-82 | R-18, R-34, R-36 | — | — |
| 34 | R-83, R-88 | R-13 | R-98 | — |
| 35 | R-84 | — | R-126 | — |
| 36 | — | R-9 | — | — |
| 37 | R-85 | — | — | — |
| 38 | R-69, R-78, R-86 | R-5, R-14, R-30 | R-119, R-126 | — |
| 39 | R-82, R-87 | R-34 | — | — |

**Cross-step chains** (a plan item that depends on a plan item of another step):

- R-43 (Steps 1) depends on R-54 (Steps 12).
- R-59 (Steps 13) depends on R-50 (Steps 6, 13, 14, 21, 28, 31).
- R-61 (Steps 13) depends on R-46 (Steps 3).
- R-63 (Steps 14) depends on R-50 (Steps 6, 13, 14, 21, 28, 31).
- R-71 (Steps 15) depends on R-69 (Steps 12, 15, 38).
- R-76 (Steps 21, 28) depends on R-50 (Steps 6, 13, 14, 21, 28, 31).
- R-77 (Steps 28) depends on R-47 (Steps 4).
- R-78 (Steps 28, 38) depends on R-76 (Steps 21, 28).
- R-78 (Steps 28, 38) depends on R-47 (Steps 4).
- R-79 (Steps 30, 33) depends on R-53 (Steps 9).
- R-80 (Steps 31) depends on R-66 (Steps 14, 31).
- R-82 (Steps 33, 39) depends on R-79 (Steps 30, 33).
- R-83 (Steps 34) depends on R-53 (Steps 9).
- R-85 (Steps 6, 37, 9) depends on R-51 (Steps 7).
- R-86 (Steps 38) depends on R-74 (Steps 18).
- R-86 (Steps 38) depends on R-69 (Steps 12, 15, 38).
- R-86 (Steps 38) depends on R-78 (Steps 28, 38).
- R-87 (Steps 39) depends on R-82 (Steps 33, 39).
- R-88 (Steps 3, 14, 21, 32, 34) depends on R-76 (Steps 21, 28).
- R-88 (Steps 3, 14, 21, 32, 34) depends on R-83 (Steps 34).
- R-88 (Steps 3, 14, 21, 32, 34) depends on R-46 (Steps 3).

## Part 4 — Conflicts and gaps

### 4.1 Conflicts between corrections

Each conflict names both sides. "Resolved" means a later settled ruling explicitly
replaces the earlier one and the register follows the later one; "open" means nothing on
record decides it.

- **C-1 (open) — Old stores and Max Cogar's human-entered rows.** B4 p1 E-5: "If yes [he
  has run `init`], a store exists off the agents' machines, the in-place edit would
  destroy human-entered rows (`corrections`, `lessons`, `human_stated` landmines) on
  `deinit --purge`, and a forward migration is required instead." CR§1 records his
  answer ("yes i used that before") and says it "changes nothing below", prescribing
  refusal plus `deinit --purge` + `init` — the path B4 p1 E-5 said destroys those rows.
  CR§1's own standard also says "A changed schema is a new migration", yet its
  correction keeps the in-place edits. Affects R-35, R-44, R-92. Nothing on record says
  whether his store holds human rows or whether they must survive.
- **C-2 (open) — Branch switch: purge or not.** B4 p2 E-1 and B4 p3 E-19: a different
  ref → "`branch_changed`-class diagnostic …, purge and full re-mine, with the cost
  stated". B7a E-28's test list: "branch switch: a `branch_changed`-class diagnostic, no
  purge". B7a states no reason for the change and cites batch 4 as governing. Affects
  R-23, R-56, R-108. The register carries batch 4's rule (the settled design) and flags
  B7a's test line.
- **C-3 (open, minor) — A crashed full pass.** B5b's watermark rule point 3: "A crashed
  full pass keeps the settled rule: purge, then a full re-mine." B5 verification ruling 1
  and B7a E-1 state only "a crashed pass re-runs its recorded range and skips hashes
  already in `commits`", with no full/incremental split; B4 p3 E-19 allowed "either
  begins with the purge transaction or resumes incrementally". R-22/R-55 follow B5b's
  split; which one T-13-5(a) pins is not settled on record.
- **C-4 (open, minor) — A new git-fault code.** B4 p2 E-1 names "a git fault
  (`miner_git_failed`-class)"; B6b E-5 says "a git-fault code only if Step 13's settled
  git-fault handling introduces one (batch 4 names none)". R-50 carries both forms.
- **C-5 (resolved) — Write-transaction bound.** B3a E-17 "below AD-26's give-up (about
  200 ms)" vs B8a E-17 "below the waiter's roughly 100 ms first-try window". The later
  B8 ruling is used (R-36, R-68); PG-8's "under the 200 ms busy bound" (plan L15185) and
  PG-8 in §14 (L14945) change with R-87.
- **C-6 (resolved) — Re-mine on a changed half-life.** B6a E-17 item (2) "remove the
  re-mine notice" and B6a E-22 "when the half-life re-mine trigger is removed under batch
  5 ruling 2" vs B5c E-3 (keep the automatic re-mine), B6b E-16 and the B6 verification
  item 3 ("The `tuningWriteNotice` stays: changing h forces a re-mine"). The coordinator's
  later ruling is used (R-24, R-54, R-99); ruling 2's "needs no re-mine" concerns
  re-basing only.
- **C-7 (resolved) — The half-life floor.** B5a E-19 (37 days) → ruling 2 ("about 1.79
  days") → B6a E-17 (underflow floor ~1.79 days) → B7b E-6 (the relation `h ≥ 365.25 ×
  horizon_years / 1022`). The relation is used.
- **C-8 (resolved) — The watermark.** B4 p2 E-1 kept "the oldest-first chunked
  watermark"; B5 ruling 1 "replaces every earlier watermark statement". Ruling 1 is used.
- **C-9 (resolved) — Recency storage.** B4 p3 E-23 ("stored form Σ 2^(ts/H) rescaled at
  read"; re-mine on a half-life change) vs ruling 2 (re-based epoch, exact rescale).
  Ruling 2 is used; evidence weighting itself is kept.
- **C-10 (resolved) — Label order.** B2 item 1 "count revert and fix labels before the
  transaction-size exclusion" vs the B3 coordinator ruling (reverts before, fix keywords
  on included commits only). The B3 ruling is used, and its consequence for AD-14's noise
  floor is R-27.
- **C-11 (resolved) — Session arming.** B4 p3 first audit E-6/E-39 ("re-base on last
  activity") vs B4 p2 E-19 (single open session; refuse and list when several), adopted
  by B4 p3's adjudication and B5. The single-open-session rule is used (R-13, R-83).
- **C-12 (resolved) — Trust ≥ high clause.** B4 p1 E-17's first audit ("add
  `bar.untrusted_trust_factor ≥ bar.high_confidence_min` to `checkTuningWrite`") vs its
  adjudication ("Do **not** add"). The adjudication is used (R-54).
- **C-13 (resolved) — FR-O2's denial clause.** B3a E-3 ("whether the call ran, failed or
  was denied") vs PD (an `Edit`/`Read` path deny rule is rejected before hooks run, so
  the oracle is not invoked). PD's wording is used (R-1).
- **C-14 (resolved) — Import's schema check.** B3b E-10 (`repo_key`/`schema_version`
  refusal) vs CR§1 (per-migration checksums). CR§1 is used for the schema half; the
  `repo_key` half stays (R-34, R-81).
- **C-15 (dependency, not a contradiction) — The skeleton e2e test.** B2 E-7's corrections
  to `test/unit/skeleton_e2e.test.ts` apply only while it exists; B5b H1 E-25 retires it
  at Step 28 (or moves the `delete:` to Step 38). R-78 and R-126 carry both.

### 4.2 Gaps — corrections stated only as a goal, with no settled design

- **G-1 — Horizons on incremental passes.** B7a E-10: "The mechanism is an engineering
  choice, made by written comparison", with two candidates; none chosen (R-23, R-56).
- **G-2 — Stale recovery of the reindex claim.** B5 ruling 4: "must be chosen by written
  comparison" between an OS-released lock and pid reclaim; none chosen (R-37).
- **G-3 — Structural-fact confidence.** B2 E-5 (b) / B2 item 4: "Define structural-fact
  confidence or state the gap"; no definition exists (R-26, R-72, R-74).
- **G-4 — Rename-following.** B7a E-16: renames were announced ("#6: build
  rename-following into Step 13"), not built, and "go to the correction pass as that
  divergence, with a stated decision"; no decision is on record (R-91).
- **G-5 — The residual StoreBusy under the 25 ms yield.** B8 verification item 6: 3 of
  2,310 with the yield; "The cause of the residual 3 is not established", while the fix's
  test "must show 0 `StoreBusy`" (R-68, R-107).
- **G-6 — A stored non-numeric `deny.loop_threshold`.** B6 verification item 2 states the
  defect (recorded as `store_corrupt`, the deny stops) and that only new writes are
  refused; no correction for an already-stored bad value is on record beyond retiring the
  catch-all at Step 28 (B6a E-24) (R-124).
- **G-7 — The off-path busy timeout's value.** B7b E-21: "Derive the off-path value … or
  drop it to the default if the derivation shows 100 ms plus a retry suffices"; the
  derivation has not been done (R-36, R-61).
- **G-8 — The far-future `%ct` tolerance.** B7b E-6: "later than the wall clock by more
  than a stated tolerance"; no tolerance is stated (R-24, R-57).
- **G-9 — TypeScript `.json` imports.** B9 verification item 4: "Settle `.json`"; no rule
  given (R-70).
- **G-10 — Completeness edit-set scope.** B3a E-9: "state whether the Completeness
  edit-set is read per consumer or per session"; not decided (R-32).
- **G-11 — The fork parent-id premise.** B2 E-13 (d): "stays open until the hooks
  reference or an executed probe settles it"; no probe is on record (R-139).

### 4.3 Verification items that map to no concrete open correction

- **U-1 — B8 verification item 14 (capability records in Step 15's generic frontend).**
  B8a E-18 observed `symbols: true` while indexing 0 for `css`, `embedded_template`,
  `html`, `json`, `toml`, `vue`, and B8a E-16 observed `lang_capabilities` counting two
  generic-fallback files as clean tree-sitter parses; both say "batch 9 judges it". The
  B9 verification and the B9 adjudication do not rule on either (searched both B9 files
  for `css`, `symbols: true`, "clean tree-sitter parse"). No correction is on record.
- **U-2 — B6 verification item 6, "`ensureHistoryRow` writes `prov_ref = path` under
  `commit` provenance (6a E-13)".** Listed as present at `HEAD`, but at `HEAD`
  `src/stores/dao/files.ts` L113–L122 takes `commitHash` and writes `prov_ref:
  commitHash` (changed by `c3a25f0`/`57bdd4a`; B7a E-3 also says "superseded by
  277b0a2's DAO method"). No correction remains.
- **U-3 — B1 verification "Questions for Max Cogar" 1 and 2.** B2–B9's "still open" lists
  never carry them again; whether he answered is not on record. Mapped to R-148, but the
  audit files do not say whether they are still open.
- **U-4 — B5 verification item 13, "STATUS lists the owed plan-follow pass first" (B5c
  E-7).** Overtaken: plan Step 12 at `HEAD` quotes the later AD-13 (L3049 "AD-13 now
  re-bases `T0` to `refTs − 500·h` days"), so the specific pass for `0676431` happened;
  a plan-follow pass is owed again after R-24 (carried by R-57, R-89).
- **U-5 — B7 verification item 10, "the first audit's off-by-one cross-references".**
  Already corrected on the record in the B7b adjudication ("Off-by-one cross-references in
  the first audit"); review files are not edited, so nothing further is owed.

Items of the verifications that were checked and found **already applied at `HEAD`**
(no R-item; each read at `HEAD`): the review row removed from the standards table (B3a
E-19); `status` lists home-level faults and data-flow step 3 names the fault (B3a E-5;
arch L1968–L1969, L204); the delivered-set reseed mapping by exact text (B3a E-10; arch
L1901–L1909); per-genre subject keys (B3a E-11; arch L1881–L1887); the unresolved-import
share (B3a E-14; arch L1415–L1418); the trust dampener replacing the universal cap, with
display and cap placement (B3a E-15 / B3b E-13; arch L1611–L1655); the explicit `seq` key
(B2 E-7; `observed_actions.ts` L3–L4); the miner reads tuning with no literal fallbacks
(B2 E-1 (b); `cochange.ts` L388–L396); the skeleton indexer items of B2 E-3 superseded by
the Step 14/15 builds (`entry_score` assigned, `indexer.ts` L954; no `LIKE` in
`search.ts`; generic-frontend spans in bytes, `generic_frontend.ts` L72–L78); `MultiEdit`
removed (plan L1947–L1949; `observed_actions.ts` L10–L11); the transcript admission rule
(plan L5072); Checkpoint 1R's declared adaptation and R15 (B4 p3 E-5; plan
L14515–L14526); `checkTuningWrite`'s non-numeric and unknown-key refusal (`c3a25f0`);
the `init`/`index` FTS crash and the `search.ts` 1R header (B6 verification, "Already
fixed"); the miner's inherited `GIT_DIR` (`gitChildEnv`, B7 verification); markers as
comment lines (B8a E-21).
