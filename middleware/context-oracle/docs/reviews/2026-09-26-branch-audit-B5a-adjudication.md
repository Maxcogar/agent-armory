# Branch audit — batch 5, part a — adjudication

Adjudication of the first audit `2026-09-26-branch-audit-B5a.md` (E-1 … E-27; commits `db9ecf9`, `64f710a`, `6779cd5`, `893b9cd`, `6cff0ce`) against the second opinion `2026-09-26-branch-audit-B5a-second-opinion.md` (17 entries). The brief at `/tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/audit/BRIEF.md` governs; its test for an acceptable decision decides every ruling. Batches 1–4 (`…-B1-verification.md` through `…-B4-verification.md`) are settled and not re-litigated. The adjudicator made none of the changes and wrote neither review.

Scope. The second opinion's hand-back said seven keeps were overturned; its sections overturn five (E-1, E-12, E-21, E-25, E-27). Those five are ruled here, as are the reasoning disputes in E-10, E-18, E-19, E-23 and E-24. Entries where the second opinion agreed on both verdict and reasoning (E-2, E-4, E-13, E-15, E-16, E-17, E-26) are not re-ruled; the section says so and records any citation correction the second opinion supplied. Entries the second opinion did not cover (E-3, E-5, E-6, E-7, E-8, E-9, E-11, E-14, E-20, E-22) are not re-ruled; where a fact verified here changes the *content* of an entry's correction (E-6, E-9), the section says exactly what changes and leaves the verdict as the first audit gave it.

Method. Every repo quote was read with `git show <commit>:<path>` at the cited lines. Every web quote was fetched with `curl` and checked with `python3 /tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/audit/webquote.py <url> "<quote>"` (exit 0 for every quote below). `[[ran]]` commands ran in `scratchpad/audit/b5adj/` on Node v22.22.2 (`node:sqlite`, SQLite 3.51.2) and git 2.43.0, never in the owner's repositories. The owner-messages file was searched for any owner word on sessions, timeouts, locks, imports and collapse tests; none bears on a ruling here, so every owner question below is "none".

### E-1
**Ruling:** The second opinion's overturn (`keep` → `replace`) is upheld. `db9ecf9` corrected the V6 row and AD-23's item 1, and left AD-23's items 3 and 4 reasoning from the premise the same commit retracted. Item 4 still says the harness-timeout path "is fail-closed on PreToolUse, V6" at `db9ecf9`, at `6cff0ce` and at `0676431` — I re-read all three. One decision now asserts both that a timed-out `PreToolUse` hook lets the tool continue (item 1) and that the same path is fail-closed (item 4): brief test 6, a conflict with another decision — here with itself. The first audit's step (3), "the consequence is re-derived, not dropped", checked only the two changed hunks. The second opinion's lesser point also holds on the source: the hooks reference says a timed-out hook's output is discarded and that the tool call continues; it does not say the timeout is silent, and for `UserPromptSubmit` it documents a transcript notice for the same event. "Fails open silently … with no trace" therefore reaches past its source on the harness side; what the source supports is that nothing the oracle emitted survives.
**Evidence:**
- Item 1 after the fix: [[middleware/context-oracle/docs/architecture-phase-a.md@db9ecf9:L2241-L2243]] "harness's timeout silently discards its output (V6: a timed-out `PreToolUse` hook lets the tool continue, and a deny it would have emitted is lost without a trace)"
- Item 3 after the fix: [[middleware/context-oracle/docs/architecture-phase-a.md@db9ecf9:L2249-L2250]] "The one contract behaviour that could make the oracle *block by accident* is the hook timeout; the watchdog converts it to silence."
- Item 4 after the fix, unchanged through the next two architecture commits: [[middleware/context-oracle/docs/architecture-phase-a.md@db9ecf9:L2251-L2252]] "Not harness-timeout reliance (that path is fail-closed on PreToolUse, V6)" and [[middleware/context-oracle/docs/architecture-phase-a.md@6cff0ce:L2321-L2322]] "Not harness-timeout reliance (that path is fail-closed on PreToolUse, V6)" and [[middleware/context-oracle/docs/architecture-phase-a.md@0676431:L2334-L2335]] "Not harness-timeout reliance (that path is fail-closed on PreToolUse, V6)"
- The row's wording: [[middleware/context-oracle/docs/architecture-phase-a.md@db9ecf9:L130]] "A timed-out handler **fails open silently**: whatever it would have emitted, including a deny, is discarded with no trace."
- The hooks reference, fetched with `curl` 2026-09-28: [[https://code.claude.com/docs/en/hooks]] "A timed-out command, http, or mcp_tool hook doesn't block the tool call." and [[https://code.claude.com/docs/en/hooks]] "On PreToolUse, by contrast, a timed-out command hook lets the tool call continue." and [[https://code.claude.com/docs/en/hooks]] "discarding the hook's output, so on most events a timed-out hook renders no decision." and [[https://code.claude.com/docs/en/hooks]] "so don't count on a stalled hook to act as a gate."
- The reference documents a notice for `UserPromptSubmit` and says nothing either way for `PreToolUse`: [[https://code.claude.com/docs/en/hooks]] "The transcript shows a notice naming the hook, the timeout that fired, and that the output was discarded."
- [[ran]] `git show db9ecf9:middleware/context-oracle/docs/architecture-phase-a.md | grep -n -i -e 'fail-closed'` → `2251:4. **What this is NOT.** Not harness-timeout reliance (that path is fail-closed` (the same grep at `6cff0ce` → line 2321; at `0676431` → line 2334)
**Final verdict:** replace
**Correction:** Keep the V6 row's facts and its dated correction note, and keep AD-23 item 1. Rewrite item 3 so the hazard the watchdog exists for is losing the `latency_breach` record and any deny the handler would have emitted, not an accidental block. Rewrite item 4 to "Not harness-timeout reliance (that path is fail-open on `PreToolUse` and discards the handler's output, V6, so relying on it loses the record)". In the row and item 1, replace "fails open silently … with no trace" / "lost without a trace" with the reference's own scope: the output is discarded and nothing the oracle wrote survives; whether the harness shows a notice for `PreToolUse` is not stated by the reference.
**Owner question:** none — an engineering premise and its dependent reasoning (`OL-11`).

### E-2
**Ruling:** Not re-ruled. Both reviews agree on `keep` and on the reasoning; the second opinion re-derived the loader behaviour, the `dylink` sections and the 32-of-36 count at source, and added that a trivial smoke test counts 33 because `bash` only dies on `case`/`esac`. Nothing verified here changes it.
**Evidence:** none needed — no dispute.
**Final verdict:** keep (as the first audit)
**Correction:** none.
**Owner question:** none.

### E-3
**Ruling:** Not second-opinioned; not re-ruled. Nothing verified here changes its correction (the `NOCASE` index and `path_tokens` stand; the "same token-prefix semantics" sentence was false and was superseded at `6cff0ce`). E-18 below builds on this entry.
**Evidence:** none needed.
**Final verdict:** replace (as the first audit)
**Correction:** as the first audit.
**Owner question:** none.

### E-4
**Ruling:** Not re-ruled. Both reviews agree on `keep`. The second opinion's citation correction is recorded: the first audit's fact "AD-5's fold at the prior commit" cites lines 1886–1891 of the architecture at `2331baf`, which are AD-18's text; AD-5's own routing of a whisper-less `missed` is at lines 765–769 of the same file. The claim holds either way; only the label was wrong.
**Evidence:** none needed beyond the second opinion's, which I did not find contradicted.
**Final verdict:** keep (as the first audit)
**Correction:** none to the unit; the audit file's fact 5 should cite AD-5 at L765-L769 or call the cited lines AD-18's.
**Owner question:** none.

### E-5
**Ruling:** Not second-opinioned; not re-ruled. One consequence from E-23 below: the open read form for an imported project store with no live binding on the report machine (batch 4 part 3 E-4; batch 4 correction item 12) is charged to this entry's separate-home paragraph, which `db9ecf9` wrote and `6cff0ce` did not touch — the first audit's reasoning (4) already names it. Verdict unchanged.
**Evidence:** [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B4-verification.md@HEAD:L161-L162]] "`status` gets a key- or home-addressed read form for the exit run (part 3 E-4)."
**Final verdict:** replace (as the first audit)
**Correction:** as the first audit; the key- or home-addressed read form belongs here, not to E-23.
**Owner question:** none.

### E-6
**Ruling:** Not second-opinioned; the verdict (`replace`) is not re-ruled. Its correction is amended by a fact verified under E-21: the correction says to replace the "visibility" reason "with the aggregation clause and FR-A5a, as `6cff0ce` did", but AD-14's aggregation clause, by its own words, fails "a bare count one grep returns", and a single file's revert count is returned by one `git log` call (executed under E-21). So the aggregation clause does not carry the single-file case; FR-A5a does.
**Evidence:** see E-21.
**Final verdict:** replace (as the first audit)
**Correction:** keep the widened class; ground the single-file history case on FR-A5a (the hazard path's only floor is the noise floor); use the aggregation clause only where it holds (cross-file history).
**Owner question:** none.

### E-7
**Ruling:** Not second-opinioned; not re-ruled. Nothing verified here changes it.
**Evidence:** none needed.
**Final verdict:** replace (as the first audit)
**Correction:** as the first audit.
**Owner question:** none.

### E-8
**Ruling:** Not second-opinioned; not re-ruled. Consistent with the E-24 ruling below (the settled rule lists open sessions in plain language and then asks for `--session`).
**Evidence:** none needed.
**Final verdict:** replace (as the first audit)
**Correction:** as the first audit.
**Owner question:** none.

### E-9
**Ruling:** Not second-opinioned; the verdict (`replace`) is not re-ruled. Its correction is amended by the E-25 ruling below: the correction says "add that … Phase B re-derives it by execution, as `6cff0ce` did", and E-25 finds that form insufficient (the host CLI is the owner's installed version, so a one-time re-derivation trusts the list on every later host version).
**Evidence:** see E-25.
**Final verdict:** replace (as the first audit)
**Correction:** keep the six-variable set as the 2026-09-07 observation; require per-invocation verification of non-attachment (E-25) rather than a one-time re-derivation.
**Owner question:** none.

### E-10
**Ruling:** Both reviews say `replace`; the verdict stands. The two reasoning disputes are ruled for the second opinion on both points. (1) Root cause: the claim row inside `BEGIN IMMEDIATE` is the root-cause fix for the check-then-act race — the executed 200/200 shows it and SQLite's single-writer rule backs it — but it is only half of AD-26's lock problem. The claim is still a persistent marker that outlives its owner and is reclaimed by pid liveness (`process.kill(pid, 0)`, with `EPERM` counted as alive), which the plan states and the architecture omits. A lock whose lifetime is the holder process's has no stale state to reclaim: I reproduced it — a `BEGIN EXCLUSIVE` on a separate lock database refuses a second process while held and is acquired by that process after the holder is killed with `SIGKILL`. The plan compared the claim row only with the `wx` file lock, so brief test 5 (why this choice beats the alternatives) is unmet for the stale-recovery half; the architecture must either adopt the OS-released lock or state the pid-liveness reclaim with its pid-reuse and `EPERM` cost and why it is preferred. (2) Backing: the first audit's SQLite quote, "An attempt to invoke the BEGIN command within a transaction will fail with an error", is about a nested `BEGIN` on one connection; it does not establish one writer across processes. The page's `BEGIN IMMEDIATE` and single-write-transaction sentences do. The first audit's other correction — reconcile "the handler never waits on it" as batch 3 settled — stands.
**Evidence:**
- The architecture's claim rule states no stale recovery: [[middleware/context-oracle/docs/architecture-phase-a.md@db9ecf9:L2425-L2428]] "The detached reindex takes a **claim row** in `schema_meta`, inside one `BEGIN IMMEDIATE` transaction, released in a `finally`, and a second reindex is refused with `reindex_locked`" and [[middleware/context-oracle/docs/architecture-phase-a.md@db9ecf9:L2433]] "The handler never waits on it"
- The plan's reclaim rule: [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L3243-L3245]] "treats the claim as held only when that pid is alive (`process.kill(pid, 0)`; `EPERM` counts as alive)"
- The plan's comparison set: [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L7363-L7365]] "written as Step 14 first had it (a `wx` file, a pid, liveness reclaim), lets two reclaimers of a stale lock both win (29 of 200 executed races, §4)"
- SQLite, the backing that supports the single-writer point: [[https://www.sqlite.org/lang_transaction.html]] "The BEGIN IMMEDIATE might fail with SQLITE_BUSY if another write transaction is already active on another database connection." and [[https://www.sqlite.org/lang_transaction.html]] "SQLite supports multiple simultaneous read transactions coming from separate database connections, possibly in separate threads or processes, but only one simultaneous write transaction."
- The first audit's quote, which is about nesting on one connection: [[https://www.sqlite.org/lang_transaction.html]] "An attempt to invoke the BEGIN command within a transaction will fail with an error"
- [[ran]] `node holder.mjs lk.db &` (opens `lk.db` with `node:sqlite`, `PRAGMA busy_timeout=0`, `BEGIN EXCLUSIVE`, then idles); `sleep 1.5; node try.mjs lk.db` (same open, tries `BEGIN EXCLUSIVE`); `kill -9 $HP; wait $HP; node try.mjs lk.db` → `holder acquired pid 25523` / `try: refused 5 database is locked` / `holder killed with SIGKILL (exit 137)` / `try: acquired` (Node v22.22.2)
- Settled: [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B3a-adjudication.md@HEAD:L134]] "Correct AD-26's \"the handler never waits on it\" to the actual rule (every handler write waits on the store's write lock up to the busy bound)."
**Final verdict:** replace
**Correction:** Keep an atomic claim taken through SQLite's single writer, backed by the two `lang_transaction.html` sentences above. Resolve stale recovery in AD-26 itself, by written comparison: either a process-lifetime lock the OS releases on death (executed above; no pid reclaim, no pid-reuse case), with `status` reading the start time from a committed row, or the pid-liveness reclaim stated with its pid-reuse and `EPERM` cost and the reason it is preferred. Reconcile "the handler never waits on it" as batch 3 settled.
**Owner question:** none — engineering (`OL-11`).

### E-11
**Ruling:** Not second-opinioned; not re-ruled. Nothing verified here changes it.
**Evidence:** none needed.
**Final verdict:** replace (as the first audit)
**Correction:** as the first audit.
**Owner question:** none.

### E-12
**Ruling:** The second opinion's overturn (`keep` → `replace`) is upheld. The rule in force at `64f710a` requires every load-bearing decision to pass the collapse test "in writing, before acceptance and again in review"; the independent hunt is the second half. At `64f710a` the plan's §10A ends at D-plan-32, so D-plan-33 to D-plan-44 had no author's written test — the first audit's own step (1) says so. STATUS's new item 1 schedules only the independent review and hunt, and `CLAUDE.md` makes STATUS the only file that states what to do next, so the omission belongs to this hunk. Both plan-pass reviews then found exactly this gap (hunt H14, expert M1), and the later collapse-log entry names the consequence: a hunt with no author's answers to attack "is doing the author's job, and the attack it exists for does not happen". An order of work that leaves out a mandatory step is not "what the rules require", and the brief's `keep` means the unit stands exactly as it is.
**Evidence:**
- The rule: [[middleware/context-oracle/CLAUDE.md@64f710a:L112-L113]] "Every load-bearing decision passes the collapse test, in writing, before acceptance and again in review:"
- The hunk: [[middleware/context-oracle/docs/STATUS.md@64f710a:L271-L273]] "1. **One independent review of the plan pass,** plus the mandatory collapse-hunt of its new decisions (D-plan-33 to D-plan-44). Apply every finding that holds, in the layer it belongs to, one layer per pass."
- The last author entry at this commit: [[middleware/context-oracle/docs/plans/plan-phase-a.md@64f710a:L8181]] "#### D-plan-32 (reindex claim row)"
- [[ran]] `git show 64f710a:middleware/context-oracle/docs/plans/plan-phase-a.md | grep -n '^#### D-plan' | tail -1` → `8181:#### D-plan-32 (reindex claim row)`
- Found by both reviews the item scheduled: [[middleware/context-oracle/docs/reviews/2026-09-26-plan-pass-collapse-hunt.md@6779cd5:L32-L34]] "Plan §10A (\"Author's collapse-test on each load-bearing decision\") has entries for D-plan-1 to D-plan-32 and **none** for D-plan-33 to D-plan-44." and [[middleware/context-oracle/docs/reviews/2026-09-26-plan-pass-expert-review.md@893b9cd:L245]] "### M1 — D-plan-33 to D-plan-44 have no author's collapse test (§10A)"
- The consequence, logged later on the branch: [[middleware/context-oracle/docs/collapse-log.md@c41265c:L1668-L1671]] "**Standing lesson.** A pass that adds a decision adds its written collapse test in the same pass. An independent hunt attacks the author's answers; when there are none, it is doing the author's job, and the attack it exists for does not happen."
**Final verdict:** replace
**Correction:** Item 1 first schedules the author's §10A collapse-test entries for D-plan-33 to D-plan-44 (written by an agent other than the one that will hunt them), then the independent review and collapse-hunt. Items 2 and 3 and the findings clause stand.
**Owner question:** none — process sequencing is the agents' (`OL-11`).

### E-13
**Ruling:** Not re-ruled. Both reviews agree on `keep` and on the reasoning (seven hunks that re-cite two columns to AD-4 lines that exist at `db9ecf9`).
**Evidence:** none needed — no dispute.
**Final verdict:** keep (as the first audit)
**Correction:** none.
**Owner question:** none.

### E-14
**Ruling:** Not second-opinioned; not re-ruled. Nothing verified here changes it.
**Evidence:** none needed.
**Final verdict:** replace (as the first audit)
**Correction:** as the first audit.
**Owner question:** none.

### E-15
**Ruling:** Not re-ruled. Both reviews agree on `keep`: a genuine, executed, once-written review whose findings were applied or logged, with H5's wrong recommendation charged to its application (E-24).
**Evidence:** none needed — no dispute.
**Final verdict:** keep (as the first audit)
**Correction:** none.
**Owner question:** none.

### E-16
**Ruling:** Not re-ruled. Both reviews agree on `keep`. The second opinion's precision is recorded: m5's second half ("state the `is_error: false` field") was rejected in `8162f00` with V23 as the reason, so "every finding was applied" is not literally true — one was rejected on the record, which the brief treats as a sound disposition.
**Evidence:** none needed beyond the second opinion's, which I did not find contradicted.
**Final verdict:** keep (as the first audit)
**Correction:** none to the unit; the audit file's disposition of m5 should read "first half applied; second half rejected on the record (V23)".
**Owner question:** none.

### E-17
**Ruling:** Not re-ruled. Both reviews agree on `replace` and on the two open items (the unreported empty read reseed; the referent of "cannot establish at all"). The second opinion's naming of the cases — an unpaired `tool_use` and an orphan `tool_result` — is the plan's own fixture and is adopted into the correction.
**Evidence:** none needed — no dispute.
**Final verdict:** replace (as the first audit)
**Correction:** as the first audit, with the unestablishable cases named as an unpaired `tool_use` and a `tool_result` whose `tool_use_id` matches nothing.
**Owner question:** none.

### E-18
**Ruling:** Both reviews say `replace`; the verdict stands. The reasoning dispute — whether `unicode61` re-splits any in-house token — is ruled with a finding neither review reached. On the second opinion's point as put: reproduced. Eight letters and digits added to Unicode after 6.1 (U+A7C1, U+1E030, U+11F04, U+10D50, U+1E5D0, U+16D40, U+1FBF1, U+16AC1) each stayed one token under `unicode61` and under `ascii` at SQLite 3.51.2, so a re-split on a post-6.1 letter is not shown. But the in-house rule as written is not closed under its own normalization: it splits first and NFKD-normalizes second, and a `\p{N}` codepoint the split keeps can NFKD-expand into separators. Executed: `x⑴y` becomes the in-house token `x(1)y`, which `unicode61` re-splits to `1`, `x`, `y` — and so does `ascii`, because the parentheses are ASCII; `x¼y` becomes `x1⁄4y`, which `unicode61` re-splits to `4y`, `x1` while `ascii` passes it whole. So (i) `ascii` is not a pure pass-through — it splits on ASCII non-alphanumerics and case-folds ASCII letters; it is pass-through only for tokens that are already lower-case letters and digits; and (ii) with the rule in its stated order, the fallback table stores a token the FTS path does not, whichever FTS5 tokenizer is chosen, which is the disagreement the one-tokenizer rule exists to make impossible. The root fix is in the in-house rule's order (normalize before splitting, or split again after), after which requiring a tokenizer that passes letter/digit-only lower-case tokens through unchanged is well-defined and `ascii` satisfies it.
**Evidence:**
- The rule and its order: [[middleware/context-oracle/docs/architecture-phase-a.md@6cff0ce:L357-L359]] "**Both paths use one tokenizer, in the oracle's own code:** split on every non-letter/non-digit (Unicode), NFKD-normalize, drop combining marks, lowercase."
- The storage the next commit corrected: [[middleware/context-oracle/docs/architecture-phase-a.md@0676431:L355-L358]] "a `symbol_tokens(token, symbol_id)` table and a `path_tokens` table of path segments, each with a plain index on the token (a name such as `Foo::Bar` is two tokens, so a prefix query for `bar` needs a row per token, not one column)"
- SQLite on the two tokenizers: [[https://www.sqlite.org/fts5.html]] "By default all space and punctuation characters, as defined by Unicode 6.1, are considered separators, and all other characters as token characters." and [[https://www.sqlite.org/fts5.html]] "The ascii tokenizer, which assumes all characters outside of the ASCII codepoint range (0-127) are to be treated as token characters."
- [[ran]] `node u61.mjs` (`node:sqlite`; for each of U+A7C1, U+1E030, U+11F04, U+10D50, U+1E5D0, U+16D40, U+1FBF1, U+16AC1 insert `x<char>y` into `fts5(n, tokenize='unicode61')` and `fts5(n, tokenize='ascii')`, read terms via `fts5vocab(...,'row')`) → every line of the form `U+A7C1 JS \p{L}|\p{N}: true unicode61: ["xꟁy"] ascii: ["xꟁy"]` (one token under both, all eight); `sqlite 3.51.2`
- [[ran]] `node u61b.mjs` (in-house tokenizer implemented as written — `split(/[^\p{L}\p{N}]+/u)`, then `normalize('NFKD')`, drop `\p{M}`, `toLowerCase()` — then the same two FTS5 tables) → `"x⑴y" in-house token "x(1)y" unicode61: ["1","x","y"] ascii: ["1","x","y"]` / `"x¼y" in-house token "x1⁄4y" unicode61: ["4y","x1"] ascii: ["x1⁄4y"]` / `"Foo::Bar" in-house token "foo" unicode61: ["foo"] ascii: ["foo"]` / `"user_name" in-house token "user" unicode61: ["user"] ascii: ["user"]`
**Final verdict:** replace
**Correction:** Keep the one-tokenizer rule and store one row per token, as `0676431` did. Fix the rule's order so its output contains only letters and digits (NFKD and mark removal before the split, or a second split after), and state that property as the invariant both paths rely on. Require an FTS5 tokenizer that passes such tokens through unchanged and name it (`ascii` does, for lower-case letter/digit tokens; `unicode61` was not shown to re-split them but its case folding and diacritic removal are a second folding by design). Record the reason `_` and `$` became separators, or keep them as token characters.
**Owner question:** none — engineering (`OL-11`).

### E-19
**Ruling:** Both reviews say `replace`; the verdict stands. Both reasoning disputes are ruled for the second opinion. (1) The seconds-unit exponent: recomputed from the architecture's own `T0` = 2000-01-01, the seconds to 2026-09-28 are 843,868,800, and divided by `h` = 365 the exponent is about 2.31 million; the first audit's `1.7e9/365` used the 1970 epoch (1.7e9 s is 2023-11-14 since 1970). The conclusion — every weight `Infinity` — is unchanged; the derivation was from the wrong epoch. The overflow boundary in days: the last day of 2100 is day 36,889 from `T0`; 36,889/36 = 1024.69 exceeds the double's 1024 (`2.0**(36889/36)` raises out-of-range), 36,889/37 = 997.0 does not — consistent with `0676431`'s "refuses `h` below 37 days". (2) ROSE: I read the PDF text. ROSE's recency work changes the *ranking criterion* — a support count over the last 180 days, or a sum of linear 0-to-1 weights over supporting transactions — reports a recall gain on ECLIPSE, says weighting by age "does not always improve results", and found GCC unchanged. It computes no weighted confidence ratio and uses no exponential half-life. So ROSE backs "weight the changes, not the derived rule" (its own motivating sentence) and nothing more specific; the weighted ratio against the floor and the half-life form are the agent's derivation, whose algebra (the common factor cancels) is shown in AD-13 and is correct. The first audit's "weighting each commit's contribution and taking the ratio is what ROSE does" overstates the paper.
**Evidence:**
- The rule: [[middleware/context-oracle/docs/architecture-phase-a.md@6cff0ce:L1464-L1468]] "**Recency weights the evidence, never the result.** Each included commit at time `ts` adds `2^((ts − T0)/h)` to `cochange_pairs.pair_weight` of every pair it touches and to `files.change_weight` of every file it touches, where `T0` is a fixed epoch (2000-01-01 UTC) and `h` is `bar.recency_half_life_days`." and [[middleware/context-oracle/docs/architecture-phase-a.md@6cff0ce:L1473-L1474]] "Changing `h` requires a re-mine, which `tune` states."
- The next commit's unit and bound: [[middleware/context-oracle/docs/architecture-phase-a.md@0676431:L1476-L1477]] "and `ts − T0` is taken in days, the unit of `h`. **Bound:** a weight must stay a finite double, so `(ts − T0)/h < 1000`; `tune` refuses `h` below 37 days"
- [[ran]] `python3 -c` (datetime arithmetic from 2000-01-01T00:00Z; `math.log2(sys.float_info.max)`; `2.0**(e/36)`, `2.0**(e/37)`) → `seconds since T0 at 2026-09-28: 843868800.0 exp with h=365: 2311969.315068493` / `1.7e9 is seconds since 1970 (2023-11): 2023-11-14 22:13:20+00:00` / `days T0->2100-01-01 36525 T0->2100-12-31 36889` / `max exp 1024.0` / `h 36 1024.6944444444443 overflow 1014.5833333333334` / `h 37 997.0 finite 987.1621621621622` / `h=36 end-2100 (34, 'Numerical result out of range')` / `h=37 end-2100 1.3393857589828342e+300`
- ROSE, read from the PDF's extracted text: [[https://thomas-zimmermann.com/publications/files/zimmermann-tse-2005.pdf]] "So far, all changes to an item contribute equally to the support count and confidence, independently of when they occurred." and [[https://thomas-zimmermann.com/publications/files/zimmermann-tse-2005.pdf]] "We computed the support count of an entity based on the last 180 days only and took this as ranking criterion." and [[https://thomas-zimmermann.com/publications/files/zimmermann-tse-2005.pdf]] "we used a linear increasing weighting function that assigns 0 to the oldest and 1 to the most recent transaction for a situation" and [[https://thomas-zimmermann.com/publications/files/zimmermann-tse-2005.pdf]] "Weighting changes by age does not always improve results, though." and [[https://thomas-zimmermann.com/publications/files/zimmermann-tse-2005.pdf]] "We repeated the experiment with GCC and found precision and recall almost unchanged." and [[https://thomas-zimmermann.com/publications/files/zimmermann-tse-2005.pdf]] "assigning a higher weight to recent changes can increase precision and recall"
- The spec's use of ROSE: [[middleware/context-oracle/docs/specs/spec-context-oracle.md@6cff0ce:L558]] "co-change / logical coupling, incl. recency-weighted horizon"
**Final verdict:** replace
**Correction:** Keep evidence weighting on its stated derivation (the common-factor algebra, written in AD-13). Cite ROSE only for weighting the mined changes rather than the derived rule, and say that ROSE's own methods were a 180-day window and linear weights used as a ranking criterion, with mixed results; state that the exponential half-life form and the ratio-against-floor comparison are the agent's derivation. Give `ts − T0` in days, bound the exponent (`tune` refusing `h` below 37 days), and make a changed `h` trigger the purged re-mine automatically, as `0676431` did.
**Owner question:** none — engineering (`OL-11`).

### E-20
**Ruling:** Not second-opinioned; not re-ruled. Nothing verified here changes it.
**Evidence:** none needed.
**Final verdict:** replace (as the first audit)
**Correction:** as the first audit.
**Owner question:** none.

### E-21
**Ruling:** The second opinion's overturn (`keep` → `replace`) is upheld. The new rationale has two grounds. FR-A5a carries: the spec makes a hazard's only floor the noise floor and requires it spoken with its confidence flagged, so a marginal axis that failed a real hazard would add a floor the spec forbids. The other ground — "the same aggregation clause that admits a Reuse dominance claim" — contradicts the clause it invokes. Three lines later that clause fails "a bare count one grep returns"; a single-file Warning is worded as a bare count ("was reverted in 2 commits"), its `revert_chain` label is "a file appearing in ≥ 2 revert-labeled commits", and one `git log --grep` over the file returns that count — executed here, `2`. Under AD-14's own uniform criterion the single-file revert case therefore fails, and the analogy gives it no support; the first audit's step (2), "one criterion applied uniformly", did not test the criterion against the case the change exists for. Fix-chatter is arguable (a whole-token lexicon match is more than a plain grep), but the text claims the analogy for both. The class change itself stands; its reason must rest on FR-A5a, with the aggregation clause confined to where it holds. E-6's correction inherits this (see E-6).
**Evidence:**
- The rationale: [[middleware/context-oracle/docs/architecture-phase-a.md@6cff0ce:L1602-L1605]] "*history-derived* facts, single-file (a Warning's revert or fix history) or cross-file, pass by construction: they aggregate over commits the agent has not enumerated (the same aggregation clause that admits a Reuse dominance claim), and FR-A5a requires a hazard"
- The clause it invokes: [[middleware/context-oracle/docs/architecture-phase-a.md@6cff0ce:L1609-L1611]] "pass **only when comparative or aggregative over a set the agent has not enumerated** — a dominance claim over candidates passes, a bare count one grep returns fails"
- What a single-file Warning is: [[middleware/context-oracle/docs/architecture-phase-a.md@6cff0ce:L1715-L1716]] "`revert_chain` (a file appearing in ≥ 2 revert-labeled commits within the horizon)" and [[middleware/context-oracle/docs/architecture-phase-a.md@6cff0ce:L1688]] "the file this edit targets, was reverted in 2 commits"
- The spec ground that holds: [[middleware/context-oracle/docs/specs/spec-context-oracle.md@6cff0ce:L244-L245]] "The only floor is a **noise floor** (real vs coincidental evidence)."
- The hunt's own answer, which the hunk adopted: [[middleware/context-oracle/docs/reviews/2026-09-26-plan-pass-collapse-hunt.md@6779cd5:L311-L313]] "A revert-chain or fix-chatter label comes from classifying commits the agent has not enumerated, which is not \"one call returns it\"."
- [[ran]] throwaway repo in `b5adj/gl`: `git init`; commits `init`, `add f`, `fix: null`, `git revert --no-edit HEAD`, `fix: again`, `git revert --no-edit HEAD`; then `git log --oneline --grep='This reverts commit' -- f | wc -l` → `count: 2` (and the two lines `1324610 Revert "fix: again"`, `33b8c05 Revert "fix: null"`) — one call returns the file's revert count
**Final verdict:** replace
**Correction:** Keep the widened class (single-file and cross-file history). Ground the single-file case on FR-A5a: the hazard path's only floor is the noise floor, so the marginal axis may not fail a hazard. Drop "the same aggregation clause that admits a Reuse dominance claim" for single-file counts, or limit it to cross-file history where the aggregate is not one call away; if fix-chatter is claimed under it, say why a whole-token lexicon classification is not "a bare count one grep returns".
**Owner question:** none — FR-A5a is owner-confirmed (`OL-C4`); applying it is engineering (`OL-11`).

### E-22
**Ruling:** Not second-opinioned; not re-ruled. Nothing verified here changes it.
**Evidence:** none needed.
**Final verdict:** replace (as the first audit)
**Correction:** as the first audit.
**Owner question:** none.

### E-23
**Ruling:** Both reviews say `replace`; the verdict stands, and it is carried by one ground: the merge sentence contradicts the import procedure a few lines above it. Step (4) `backup()`s the validated temporary file into the live store, which replaces the live bindings wholesale; the merge sentence says no local binding is dropped. They agree only if the live bindings are copied into the temporary store before step (4), which the architecture never says and the plan had to supply. That is brief test 6 inside AD-5. The first audit's second ground — the missing key- or home-addressed read form for an imported store with no live binding — is a real open item (batch 4 part 3 E-4; batch 4 correction item 12), but it belongs to the separate-home paragraph `db9ecf9` wrote (E-5), not to this hunk, which changes only the replace sentence into a merge sentence; brief test 1 limits a unit's verdict to what the unit decides. It is charged to E-5.
**Evidence:**
- The procedure: [[middleware/context-oracle/docs/architecture-phase-a.md@6cff0ce:L860-L862]] "(4) on success, `backup()` the temporary file into the live store, then run the fold's publish step (above) so the global replica matches the imported store."
- The sentence: [[middleware/context-oracle/docs/architecture-phase-a.md@6cff0ce:L868-L869]] "**Importing a global store merges repository bindings; it never drops this machine's.**"
- How the plan made them consistent: [[middleware/context-oracle/docs/plans/plan-phase-a.md@8162f00:L5950-L5951]] "in phase 2, every `repo_path:` binding of the live global store is copied into the validated temporary global store"
- The read form's home: [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B4-verification.md@HEAD:L161-L162]] "`status` gets a key- or home-addressed read form for the exit run (part 3 E-4)."
**Final verdict:** replace
**Correction:** Keep merge, local-wins and the plain-language missing-root list. State in AD-5 that the live bindings are merged into the validated temporary store before step (4), so the `backup()` preserves them. The key- or home-addressed read form stays open under E-5 and batch 4 item 12, not here.
**Owner question:** none — engineering (`OL-11`).

### E-24
**Ruling:** Both reviews say `replace`; the verdict stands. The reasoning dispute is ruled for the second opinion: the settled batch 4 part 2 E-19 correction itself ends its several-open branch with "and ask for `--session`" after the plain-language list, so naming `--session` is part of the settled rule, not the defect. The first audit's reason (3) — that naming `--session` is an id the owner does not have — misreads the settled rule. The defect in the ended-session branch is that it names `--session` without listing the open sessions in plain language (last activity time and working directory), which is what makes the flag usable by a non-programmer (OL-11). The main ground stands unchanged: "the session with the most recent event" picks silently among concurrent open sessions the architecture itself expects.
**Evidence:**
- The hunk: [[middleware/context-oracle/docs/architecture-phase-a.md@6cff0ce:L2006-L2008]] "the session with the most recent event** (the newest `session_log` row by `seq`, or the one named by `--session`)" and [[middleware/context-oracle/docs/architecture-phase-a.md@6cff0ce:L2010-L2011]] "has ended (its `SessionEnd` is recorded), the CLI arms nothing and says so, naming `--session`."
- The settled rule names `--session` after the list: [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B4-part2-adjudication.md@HEAD:L141]] "with several, refuse and list them in plain language (last activity time and working directory, never a bare id) and ask for `--session`"
- Carried into the batch verification: [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B4-verification.md@HEAD:L140-L141]] "`correct` arms the single open session, and refuses with a plain list when there are several."
- Concurrent sessions expected: [[middleware/context-oracle/docs/architecture-phase-a.md@6cff0ce:L1148-L1150]] "`SessionStart` reconciliation acts only on the rows of the event's own consumer — never on another session's rows, which may belong to a live concurrent session on the same repository."
**Final verdict:** replace
**Correction:** When `--session` is absent: arm the single open session; with several open, refuse, list them in plain language (last activity time and working directory, never a bare id), then ask for `--session`; with none open, arm nothing and say so. Always print the armed session. Withdraw the first audit's reason (3) as stated.
**Owner question:** none — the selection rule is engineering (`OL-11`).

### E-25
**Ruling:** The second opinion's overturn (`keep` → `replace`) is upheld. H15 asked that the Phase B seam "verify non-attachment by execution rather than trust the list". The hunk narrows that to a one-time re-derivation "against the version it ships on", after which the seam relies on the list. The oracle ships no Claude Code: the seam is a host-CLI piggyback (`CLAUDE.md`, "No separate credentials"), so the version in play is whatever the owner has installed, which changes under him. The list is one version's snapshot, as the hunk itself says; on every later host version a one-time re-derivation is exactly the "trust the list" H15 rejected, and brief test 1 is unmet (the rule reaches beyond the version it was executed on). A per-invocation check is available in the seam's own output: the executed probe told `session=parent` from `session=fresh` by the returned `session_id`, and the seam already runs `--output-format json`, which returns it. The fail-fast rule then puts the check on every call, with a match treated as a visible seam failure (the spec's one degraded mode, FR-J2/FR-J3), not as something a stale list is trusted to prevent. Phase A is unaffected (no model call); the obligation binds Phase B's seam text.
**Evidence:**
- The hunk: [[middleware/context-oracle/docs/architecture-phase-a.md@6cff0ce:L2186-L2188]] "the list is one Claude Code version's snapshot, and Phase B re-derives it by execution against the version it ships on before relying on it"
- H15's ask: [[middleware/context-oracle/docs/reviews/2026-09-26-plan-pass-collapse-hunt.md@6779cd5:L547-L548]] "make the Phase B seam verify non-attachment by execution rather than trust the list."
- The seam is a piggyback on the host CLI: [[middleware/context-oracle/CLAUDE.md@6cff0ce:L180]] "- **No separate credentials** — host-CLI piggyback or deterministic degraded"
- The seam's output names the session it attached to: [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L8705]] "\"session_id\":\"f37d10bc-406a-52ca-ac50-2f259a7a9b29\"` (this session's id)" and the probe distinguished the two cases by it: [[middleware/context-oracle/docs/plans/plan-phase-a.md@2331baf:L8715-L8716]] "`unscrubbed: is_error=False session=parent`; `session-identity scrub: is_error=False session=fresh`"
**Final verdict:** replace
**Correction:** Keep the six-variable list as the 2026-09-07 observation on one Claude Code version. Replace "re-derives it by execution against the version it ships on before relying on it" with: the Phase B seam verifies non-attachment on each invocation — the returned `session_id` must differ from the parent session's — and enters the visible degraded mode (FR-J2/FR-J3) on a match; the list is a first-line scrub, never the guarantee. E-9's correction follows this form.
**Owner question:** none — engineering (`OL-11`).

### E-26
**Ruling:** Not re-ruled. Both reviews agree on `keep`; the second opinion additionally checked the tools reference (`MultiEdit` absent; edit tools named as `Edit`, `Write`, `NotebookEdit`).
**Evidence:** none needed — no dispute.
**Final verdict:** keep (as the first audit)
**Correction:** none.
**Owner question:** none.

### E-27
**Ruling:** The second opinion's overturn (`keep` → `replace`) is upheld on both of its grounds, each re-verified. (1) The D-plan-39 collapse is a recurrence of the log's own lesson (4), recorded earlier the same day: "every input a rule reads must be traced to the interface that supplies it". The independent hunt said so in as many words. The entry presents its lesson (1) as new and does not record that an inherited lesson failed to prevent a same-day repeat, or why — the trace was done, but over an aggregate population. That is the fact that would change a later decision (the collapse-log's membership test) and is the situational specificity OL-C7 demands; a parallel lesson beside the one that failed is also a second home for one fact. (2) "Fixed in AD-16" overstates: the entry names the defect as "always empty, silently"; the same-commit fix corrects the admission rule so the reseed is no longer always empty, but an empty read reseed is still unreported — `rebuild_recovered_nothing` covers only the `delivered` set, which both reviews agree is open (E-17). Rule 1 requires a half-done fix to be called half-done.
**Evidence:**
- The earlier same-day lesson: [[middleware/context-oracle/docs/collapse-log.md@6cff0ce:L1603-L1605]] "every input a rule reads must be traced to the interface that supplies it — a rule that references a field, flag, or argument no surface provides is hollow as written."
- The hunt named the recurrence: [[middleware/context-oracle/docs/reviews/2026-09-26-plan-pass-collapse-hunt.md@6779cd5:L258-L259]] "It is also collapse-log 2026-09-26 lesson (4): the rule reads a field no supplying interface provides."
- The entry's defect and fix claim: [[middleware/context-oracle/docs/collapse-log.md@6cff0ce:L1631-L1632]] "The reseeded read set was therefore always empty, silently" and [[middleware/context-oracle/docs/collapse-log.md@6cff0ce:L1635]] "Fixed in AD-16: successful unless `is_error: true` (V23)."
- The entry's lesson (1), a refinement presented as new: [[middleware/context-oracle/docs/collapse-log.md@6cff0ce:L1648-L1649]] "(1) When a rule keys on an observed field, count the field split by exactly the population the rule reads"
- The failure report still covers only the delivered set: [[middleware/context-oracle/docs/architecture-phase-a.md@6cff0ce:L1845]] "keys writes `rebuild_recovered_nothing` with `detail_json.set = \"delivered\"`"
**Final verdict:** replace
**Correction:** Record the D-plan-39 collapse as a recurrence of the same-day lesson (4), state why that lesson did not hold (the trace was done over an aggregate population, missing the per-tool split), and fold lesson (1) in as its refinement rather than a parallel lesson. Change "Fixed in AD-16" to: the admission rule is fixed; the unreported empty read reseed remains open (E-17).
**Owner question:** none.

## Summary

| Entry | First audit | Second opinion | Ruling | Final verdict |
|---|---|---|---|---|
| E-1 | keep | overturn → replace | overturn upheld: AD-23 item 4 still "fail-closed on PreToolUse, V6" at `db9ecf9`, `6cff0ce`, `0676431`; "silently / no trace" exceeds the reference | replace |
| E-2 | keep | agree | not re-ruled | keep |
| E-3 | replace | — | not re-ruled | replace |
| E-4 | keep | agree (citation mislabel) | not re-ruled; fix the audit's AD-5/AD-18 label | keep |
| E-5 | replace | — | not re-ruled; the read-form gap is charged here (from E-23) | replace |
| E-6 | replace | — | not re-ruled; correction amended by E-21's fact (FR-A5a carries the single-file case) | replace |
| E-7 | replace | — | not re-ruled | replace |
| E-8 | replace | — | not re-ruled | replace |
| E-9 | replace | — | not re-ruled; correction amended by E-25 (per-invocation verification) | replace |
| E-10 | replace | agree; reasoning disputes | verdict stands; both disputes for the second opinion (stale-recovery half unaddressed, SIGKILL release reproduced; first audit's SQLite quote is about nested BEGIN) | replace |
| E-11 | replace | — | not re-ruled | replace |
| E-12 | keep | overturn → replace | overturn upheld: rule 2's author test "before acceptance" omitted from the order; §10A ends at D-plan-32 | replace |
| E-13 | keep | agree | not re-ruled | keep |
| E-14 | replace | — | not re-ruled | replace |
| E-15 | keep | agree | not re-ruled | keep |
| E-16 | keep | agree (m5 precision) | not re-ruled; m5's second half was rejected on the record | keep |
| E-17 | replace | agree | not re-ruled; unestablishable cases named | replace |
| E-18 | replace | agree; precision | verdict stands; no re-split on post-6.1 letters (reproduced), but the in-house rule's split-then-NFKD order emits separators that both `unicode61` and `ascii` re-split (new, executed) | replace |
| E-19 | replace | agree; reasoning disputes | verdict stands; seconds exponent is 2.31 million from `T0` = 2000 (not 4.66 million); `h` = 36 overflows, 37 does not; ROSE backs weighting changes only, not the ratio or half-life form | replace |
| E-20 | replace | — | not re-ruled | replace |
| E-21 | keep | overturn → replace | overturn upheld: the aggregation clause fails "a bare count one grep returns" and one `git log` returns a file's revert count (executed: 2); FR-A5a carries | replace |
| E-22 | replace | — | not re-ruled | replace |
| E-23 | replace | agree; which ground | verdict stands on the `backup()` / merge inconsistency; the read form is charged to E-5 | replace |
| E-24 | replace | agree; reason (3) | verdict stands; naming `--session` after the plain list is the settled rule; the defect is the missing list | replace |
| E-25 | keep | overturn → replace | overturn upheld: one-time re-derivation "against the version it ships on" trusts the list on every later host version; verify per invocation by `session_id` | replace |
| E-26 | keep | agree | not re-ruled | keep |
| E-27 | keep | overturn → replace | overturn upheld: recurrence of same-day lesson (4) unrecorded; "Fixed in AD-16" leaves the silent empty reseed open | replace |

Counts after adjudication: keep 6 (E-2, E-4, E-13, E-15, E-16, E-26); replace 21; remove 0; undetermined 0. Owner questions: none.
