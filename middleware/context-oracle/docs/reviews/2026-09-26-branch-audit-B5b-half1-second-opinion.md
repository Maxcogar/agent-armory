# Branch audit — batch 5, part b, half 1 — second opinion

Second opinion on `2026-09-26-branch-audit-B5b-half1.md` (E-1 … E-27; commit `8162f00`, plan hunks h1–h135). This file covers all 17 of the first audit's keeps and four of its replaces: E-9, E-13, E-15 and E-16. The brief at `/tmp/claude-0/-home-user-agent-armory/779c0f74-86b0-5e8f-b02d-811e78ed3f66/scratchpad/audit/BRIEF.md` governs. Settled and not re-litigated: `…-B1-verification.md` through `…-B4-verification.md`, and `…-B5a-adjudication.md`. The first audit treated part a's first audit as provisional; part a's adjudication now settles it and overturns one keep this half relies on (B5a E-21 → replace), which changes E-10 below.

Method. Each unit was re-read in the annotated hunk diff of `8162f00` and in the plan at `8162f00` and at `64f710a` (the parent); both were checked byte-identical to `git show`. The architecture was read at `6cff0ce`. Web quotes were fetched with `curl` through `webquote.py` (exit 0 for every quote below; the hooks page was re-fetched, not taken from cache). `[[ran]]` commands ran in `scratchpad/audit/b5b1so/` on git 2.43.0, Node v22.22.2 (SQLite 3.51.2) and Claude Code 2.1.283, never in the owner's repositories. Each section gives the verdict and reasoning separately, the evidence, and the verdict I reach.

### E-1
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree, with one precision. The header's claim that the listed findings "are applied" is literally false for one of them: m5's second half was rejected, not applied. The rejection is on the record. T-28-11 states the observed no-`is_error` shape and cites V23. Part a's adjudication treats a rejection on the record as a sound disposition (B5a E-16), so the header stays a true statement of what the pass did, and the verdict holds. The standards row's description of the `ascii` tokenizer is accurate. Its non-ASCII half is the FTS5 documentation's own sentence. Its ASCII half ("every ASCII non-alphanumeric a separator") goes past that sentence: the page says `ascii` is like `unicode61`, which separates only "space and punctuation". Execution settles it. Every ASCII symbol I tried splits a token under `ascii`, including `$`, `+`, `^`, `|`, `~`, `=`, `<`, `` ` `` and `_`. So the row's statement is true, and nothing depends on it anyway, because in-house tokens contain no ASCII byte outside `[a-z0-9]`.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@8162f00:L10-L13]] "which is the authority for this revision: the findings of `docs/reviews/2026-09-26-plan-pass-expert-review.md` (S1–S3, M1–M7, m1–m8) and `docs/reviews/2026-09-26-plan-pass-collapse-hunt.md` (the D-plan-39 collapse, H1–H15, R1–R3) are applied in the steps that own them."
- [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B5a-adjudication.md@HEAD:L135]] "m5's second half (\"state the `is_error: false` field\") was rejected in `8162f00` with V23 as the reason"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@8162f00:L346-L348]] "(the `ascii` tokenizer: every non-ASCII codepoint is a token character and every ASCII non-alphanumeric a separator; prefix queries `\"term\"*`), Unicode Standard Annex #15 (NFKD normalization)"
- [[https://www.sqlite.org/fts5.html]] "All non-ASCII characters (those with codepoints greater than 127) are always considered token characters."
- [[https://www.sqlite.org/fts5.html]] "By default all space and punctuation characters, as defined by Unicode 6.1, are considered separators, and all other characters as token characters."
- [[ran]] `node asc.mjs` (inserts `a$b`, `a+b`, `a^b`, `a|b`, `a~b`, `a=b`, `a<b`, ``a`b``, `a_b` into `fts5(n, tokenize='ascii')` and reads the terms through `fts5vocab(t,'row')`) → `["a","b"]` / `sqlite 3.51.2`
- [[ran]] `git show --stat 8162f00 | tail -2` → `1 file changed, 1773 insertions(+), 673 deletions(-)` (the plan only)
**Correct verdict:** keep — the header names its authority truthfully (m5's second half is rejected on the record), and the standards row matches the executed behaviour of the `ascii` tokenizer.

### E-2
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree. I re-read each of the three §6 summary hunks against the step it points to, and each summarised change is in its step at `8162f00`. Where an owning entry is `replace` (E-6's `ENOTDIR` side, E-12's over-listed genre modules, E-14's DDL comment unit, E-15's future-date rule), the correction changes detail inside the step, and the summary sentence stays true. The h32 bullet says only "stop compiling", so E-12's run-time breaks in the indexer and `search.ts` do not make it false. Its "(executed)" tag on UAX #15 is backed: §11.4 records the tokenizer run over seventeen names and nineteen queries.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@8162f00:L953-L956]] "- **The skeleton modules of Steps 13–39 that stop compiling** against the Step 6, 7, and 9 deltas are declared in those deltas' `modify:` lists and reduced by one written placeholder rule"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@8162f00:L938-L943]] "`stats_folds`, FTS tables over the in-house tokens, and the `symbol_tokens` and `path_tokens` fallback tables (G2, G3, G5, G16, N6, N11, N16; AD-2, AD-4, AD-13). Standard: 3NF; SQLite VACUUM rowid rule; UAX #15 (executed)."
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@8162f00:L9985-L9987]] "- **The one in-house tokenizer, both search paths** (executed 2026-09-26 for this revision, scratchpad throwaway, Node v22.22.2). `tokenize(s) = s.normalize('NFKD').toLowerCase().replace(/\p{M}+/gu, '')"
**Correct verdict:** keep — true summaries with pointers, unaffected by the corrections their owning entries carry.

### E-3
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree. I re-ran the generator on an archive of `8162f00`, and it reports the regions current. Batch 4 part 1 settled that generated rows are judged through their declarations. One addition to Consequences: E-12 is `replace`, and its correction drops `reuse.ts`, `consequence.ts` and `verification.ts` from Step 6's `modify:` list. When that lands, the three `S6` cells of those rows regenerate. The rows themselves need no edit.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@8162f00:L499]] "<!-- generated:files begin -->"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@8162f00:L856]] "<!-- generated:files end -->"
- [[ran]] `git archive 8162f00 middleware/context-oracle/docs/plans middleware/context-oracle/.claude/skills/expert-plan | tar -x -C b5b1so/arch`; in `b5b1so/arch/middleware/context-oracle`: `node .claude/skills/expert-plan/scripts/derive-plan-sections.mjs --check docs/plans/plan-phase-a.md` → `OK: 40 steps, 13 elements, 157 test specs, 27 probes cited, regions current`, `exit=0`
- [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B4-part1-adjudication.md@HEAD:L31]] "the brief judges generated regions through their declarations"
**Correct verdict:** keep — generated rows, current at the commit; three `S6` cells follow E-12's correction when it lands.

### E-4
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree. I read `T-16-3`, the fixture's consumer, at `8162f00`. Its data (ten co-changes 4.9 years before `HEAD` and never since, against twenty old co-changes followed by five recent solo changes) and its thresholds discriminate between the retired multiplier and evidence weighting. Case (a) fails if a perfect old pairing is dampened. Case (b) fails if raw counts are used, because 20 of 25 would pass. So the fixture serves a discriminating test. The generator dates every commit as an offset from a fixed anchor, so the fixture is deterministic.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@8162f00:L1196]] "`test/fixtures/repos/recency-weighting/` — an old perfect pairing and a pairing that came apart, backdated commits (AD-13 recency weights, Step 16; added 2026-09-26)"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@8162f00:L11273-L11276]] "fails the floor or its tier is not `high`, OR (b) passes the confidence floor (its raw counts read 20 of 25 = 0.8, which with the trust factor, 0.72, would pass; its weighted ratio, with `apart_a.ts` as the touched file, is about 0.12 — 0.11 after the trust factor)"
- [[middleware/context-oracle/ctxoracle/test/fixtures/generate.ts@8162f00:L71]] "/** Offset in days from ANCHOR for this commit's fixed author/committer date. */"
**Correct verdict:** keep — a declared, deterministic fixture that serves a discriminating test.

### E-7
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree. I re-fetched the hooks reference: it names `NotebookEdit` and has no `MultiEdit`. Every remaining `MultiEdit` in the plan at `8162f00` is a statement that no set names it. Part a's adjudication settled the architecture side (B5a E-26, keep).
**Evidence:**
- [[ran]] `python3 webquote.py https://code.claude.com/docs/en/hooks "MultiEdit"` → `exit=1` (fresh fetch); `python3 webquote.py https://code.claude.com/docs/en/hooks "NotebookEdit"` → `exit=0`
- [[ran]] `grep -n MultiEdit plan-8162f00.md` → lines 1890, 1892, 2542, 9326, 10009 only, each stating the absence (e.g. line 2542 "current hooks reference documents no `MultiEdit` tool")
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@8162f00:L1890-L1893]] "No tool set anywhere in this plan names `MultiEdit`: the current hooks reference documents the file tools `Write`, `Edit`, and `NotebookEdit` and has no `MultiEdit` match (expert review m6, fetched 2026-09-26; AD-23 as corrected at `6cff0ce`)."
**Correct verdict:** keep — an undocumented tool name is removed everywhere, with the source and the fetch date.

### E-8
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree, and strengthened. The first audit showed `filenames:[]` for `content` mode only in the zero-match literal. I also found the populated `content`-mode return in the binary: it carries `numFiles:0,filenames:[]` next to a joined `content` string. So a Grep in `content` mode that matched returns an empty `filenames`, and the old rule would have read that as "found nothing". Glob's output schema has no `mode` field, so Glob falls to case (2) as the plan says. That the hook's `tool_response` is this object remains unverified, and the plan says so (PG-7).
**Evidence:**
- [[ran]] `strings /opt/claude-code/bin/claude | grep -o 'mode:"content",[^}]\{0,120\}' | sort -u` → `mode:"content",numFiles:0,filenames:[],content:"",numLines:0,totalLines:0,appliedLimit:c7,appliedOffset:c7` / ``mode:"content",numFiles:0,filenames:[],content:Zn.join(` ``; the `count` and `files_with_matches` forms as the first audit gives them; `claude --version` → `2.1.283 (Claude Code)`
- [[ran]] `strings /opt/claude-code/bin/claude | grep -o '.\{60\}durationMs:[^,]*,numFiles:[^,]*,filenames:[^,]*,truncated[^}]\{0,40\}'` → the Glob output schema `durationMs:…,numFiles:…,filenames:A(o()).describe("Array of file paths that match the pattern"),truncated:…`, with no `mode` key
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@8162f00:L5162-L5167]] "(1) `tool_response.mode` is present and is not `files_with_matches` (Grep's `content` and `count` modes, which return `filenames: []` whatever matched) → `resultPathsRaw = []`, `searchResultState = 'mode_unsupported'`;"
- [[https://code.claude.com/docs/en/hooks]] "The exact schema for both depends on the tool."
**Correct verdict:** keep — a counted, disclosed reading, verified in the installed binary for both matched and empty results.

### E-9
**Agree/Disagree:** Verdict: agree (replace). Reasoning: the diagnosis is right, but the proposed fix treats a symptom. The first audit is right that `historyStale = last_mined_commit ≠ HEAD` is always true when `HEAD` is a merge. The miner streams `--no-merges`, so its watermark is the last commit it streamed, never the merge. I reproduced the coordinator's case: history a → (side: c2) → (main: b) → merge M; the watermark is b while `HEAD` is M.

The first audit's fix adds a second row, `last_mined_head`, for the staleness check and leaves `last_mined_commit` as the range bound. That keeps the root defect: a watermark taken from stream position is not a valid exclusion bound for the next range. After one more commit d, the next incremental range `b..HEAD` streams c2 again (reproduced: `d c2`). This is the re-stream E-16 records, and the two findings have one cause. The fix is one rule for both, stated under E-16: the watermark is the tip the completed pass mined (the resolved `HEAD`, merge or not), written in the pass's final transaction. The staleness check compares that tip with `HEAD`, and the next range excludes that tip. With that rule the merge-`HEAD` check is false after a complete mine and c2 is never streamed again. A separate `last_mined_head` becomes unnecessary; keeping it next to a stream-position watermark would record the tip and still re-count c2.

The rest of the first audit's reasoning stands: the weighted ratio, the hazard row, the removed multiplier, the tier invariant, and the finding that `T-16-1`/`T-16-2` take `historyStale` as an input and so cannot catch this. One precision on the Standard: part a's adjudication settled that ROSE backs weighting the mined changes and nothing more specific (B5a E-19). The ROSE quote is used here only for that, which is fine.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@8162f00:L1905-L1906]] "`historyStale: boolean` (`schema_meta.last_mined_commit` ≠ that `HEAD`)"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@8162f00:L3159-L3160]] "sets `schema_meta.last_mined_commit` to the chunk's newest commit — so a crash never leaves the watermark ahead of its data."
- [[middleware/context-oracle/docs/architecture-phase-a.md@6cff0ce:L1541-L1542]] "a history fact is stale when `schema_meta.last_mined_commit` ≠ `HEAD`"
- [[ran]] in `b5b1so/wm` (git 2.43.0): commits `a` (01-01), `c2` on branch `side` (01-02), `b` on `main` (01-03), `git merge --no-ff -m M side` (01-04); then `git log --no-merges --format=%s HEAD` → `b c2 a`; watermark = last line of `git log --no-merges --reverse --format=%H HEAD` → `watermark=b HEAD=M equal=no`; after commit `d`: `git log --no-merges --format=%s $W..HEAD` → `d c2`; `git log --no-merges --format=%s $TIP..HEAD` with `TIP` = M → `d`
- [[https://git-scm.com/docs/git-log]] "Do not print commits with more than one parent."
**Correct verdict:** replace — keep the weighted ratio, the hazard row, the removed multiplier, the tier invariant and per-class staleness; take the watermark to be the tip the completed pass mined (E-16's rule), so `historyStale = (mined tip ≠ HEAD)`, with no second row; add a test where `HEAD` is a merge after a complete mine and `historyStale` is false; raise AD-14's sentence in §16.

### E-10
**Agree/Disagree:** Verdict: disagree (keep → replace). Reasoning: disagree. The first audit kept this entry "on B5a E-21 (keep)", and part a's adjudication overturned that verdict. The plan hunk copies the rationale the adjudication found false. It says a single-file revert or fix-chatter label comes "not from one call the agent could make" and rests it on "the same aggregation clause that admits a Reuse dominance claim". AD-14's clause itself fails "a bare count one grep returns", and one `git log` returns a file's revert count (reproduced: `2`). So the first of the step's "two reasons" contradicts the criterion it invokes (brief test 6). The second reason, FR-A5a, carries the decision alone. The class change stands; its recorded reason must change. This builds on B5a E-21, which is settled as `replace`.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@8162f00:L3826-L3831]] "landmine) passes as `mined`, for AD-14's two reasons: it aggregates over commits the agent has not enumerated — a revert-chain or fix-chatter label comes from classifying commits, the same aggregation clause that admits a Reuse dominance claim, not from one call the agent could make — and FR-A5a requires a hazard to be spoken with its confidence, which a marginal axis that failed it would forbid (collapse-hunt H9; D-plan-41)."
- [[middleware/context-oracle/docs/architecture-phase-a.md@6cff0ce:L1609-L1611]] "pass **only when comparative or aggregative over a set the agent has not enumerated** — a dominance claim over candidates passes, a bare count one grep returns fails"
- [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B5a-adjudication.md@HEAD:L189]] "Ground the single-file case on FR-A5a: the hazard path's only floor is the noise floor, so the marginal axis may not fail a hazard."
- [[ran]] in `b5b1so/rv`: `add f`, `fix: null`, `git revert --no-edit HEAD`, `fix: again`, `git revert --no-edit HEAD`; `git log --oneline --grep='This reverts commit' -- f | wc -l` → `count: 2`
**Correct verdict:** replace — keep the class and the FR-A5a reason, the rejected-alternatives entries and the fixture sentence; drop the aggregation-clause analogy and "not from one call the agent could make" for single-file history, as B5a E-21's settled correction requires.

### E-11
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree. Step 16 gives `recency-weighting` its scenario, so it is the step that declares `generate.ts`, under both the settled reworded rule (c) and the rule's unreworded text at this commit. The rewording itself is an open batch 4 item outside these hunks.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@8162f00:L3760-L3763]] "modify: [middleware/context-oracle/ctxoracle/test/fixtures/generate.ts] delete: [] provides: [passesBar] tests: [T-16-1, T-16-2, T-16-3]"
- [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B4-part1-adjudication.md@HEAD:L104]] "Reword (c): the step that *builds out* a fixture scenario declares `modify: middleware/context-oracle/ctxoracle/test/fixtures/generate.ts` and names the fixture in its \"What changes\""
**Correct verdict:** keep — the declaration follows the settled build-out rule.

### E-13
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree, with its routing made precise. The plan fixes the defect part a's adjudication found in AD-2's operation order (split-then-NFKD emits separators). It normalizes first and splits last, and the reason is recorded at the line. I reproduced the first audit's run: no differences between the two paths, and the range query uses the index. The unbacked `_`/`$` choice is AD-2's own rule ("split on every non-letter/non-digit"), and part a's adjudication settled its correction at the architecture ("Record the reason `_` and `$` became separators, or keep them as token characters"). The plan's share of that defect is two things. First, it pins the asymmetry as specified behaviour: `T-14-5` fails unless `user_name` → `['user','name']` and `getUserName` → `['getusername']`. Second, it neither raises the point in §16 nor records a reason, although its own §11.4 run shows the consequence (`user` finds `userXname` but not `getUserName`). So the plan's correction follows AD-2's: carry the recorded reason (or the reversal), and let `T-14-5` pin whichever is decided. The h63 finding ("the one skeleton statement") is right. The indexer's `if (fts)` inserts and `search.ts`'s `SELECT name … FROM fts_symbols` name columns that the edited 001b no longer has. No 1R test other than the `todo` skeleton e2e reaches them.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@8162f00:L3361-L3364]] "`tokenize(text): string[]` — AD-2's tokenizer, in the oracle's own code: `text.normalize('NFKD')`, then `toLowerCase()`, then every combining mark (`\p{M}`) removed, then a split on `/[^\p{L}\p{N}]+/u` with empty pieces dropped."
- [[middleware/context-oracle/docs/architecture-phase-a.md@6cff0ce:L357-L359]] "split on every non-letter/non-digit (Unicode), NFKD-normalize, drop combining marks, lowercase."
- [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B5a-adjudication.md@HEAD:L157]] "Record the reason `_` and `$` became separators, or keep them as token characters."
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@8162f00:L11075]] "`user_name` (→ `['user', 'name']`), `getUserName` (→ `['getusername']`),"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@8162f00:L10001-L10002]] "`user` → `user_name`, `userXname` (not `getUserName`) on both"
- [[ran]] `node tok.mjs` (the first audit's script, re-run) → `name -> ["name"] FTS ["user_name"] FB ["user_name"] same` / `get -> ["get"] FTS ["getUserName"] FB ["getUserName"] same` / `differences: 0`
- [[middleware/context-oracle/ctxoracle/src/index/search.ts@8162f00:L30]] "store.prepare('SELECT name, kind, file_id FROM fts_symbols WHERE fts_symbols MATCH ?').all(ftsQuery(ts)) as {"
**Correct verdict:** replace — keep the tokenizer, its order and recorded reason, the `ascii` FTS tables, the token-row fallback, the dropped `NOCASE` index and §16 (a); record the `_`/`$` decision with its reason (following AD-2's settled correction) and raise it in §16, so `T-14-5` pins a decided behaviour; name the indexer's and `search.ts`'s FTS column breaks instead of "the one skeleton statement".

### E-15
**Agree/Disagree:** Verdict: agree (replace). Reasoning: partly disagree, with two corrections.

(1) The future-date finding stands, but its worked example is wrong. The first audit says a year-3000 date overflows. At the seeded `h` = 365 it does not: its weight is 1.7 × 10^301, which is finite. It overflows only for `h` below about 357 days. At the floor the guard allows (`h` = 37), a commit dated 2150 already gives `Infinity`, and then the ratio is `NaN` and the floor comparison is false, silently. git 2.43 records such dates (executed: year 3000 and 2200). The larger defect needs no overflow at all. Any commit dated after `refTs` gets a weight above `HEAD`'s. A single far-future commit then dominates every ratio its files take part in: a finite 2^1000 weight next to 2026-era weights of about 2^27. That breaks AD-13's premise that the ratio is "decayed to `HEAD`", on any `h`. The clamp-or-exclude rule the first audit proposes fixes both the overflow and the domination. The reason it records should be the premise violation, with overflow as one consequence.

(2) The first audit's step (5) is wrong. The plan says its new seeds are "values AD-14 … state, each marked illustrative there", and that is false for two of them. AD-14's list of illustrative defaults at `6cff0ce` names the floor, the high tier, the trust factor and the caps. It does not name `bar.stale_factor` or `bar.hazard_full_support`, and neither key is called illustrative anywhere in the architecture. Part a's settled corrections (E-20, E-22) add both to that list. Until they land, the plan's parenthetical claims a status its source does not give. The tier-invariant routing, the `h ≥ 37` derivation, the §16 (b) raise and `tuningWriteNotice` are correct, as the first audit says.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@8162f00:L2971-L2972]] "- **New `architecture_default` scalars** (values AD-14, AD-12, AD-26 state, each marked illustrative there):"
- [[middleware/context-oracle/docs/architecture-phase-a.md@6cff0ce:L1631-L1633]] "**Ship-high defaults, all tunable rows in `tuning` (AD-5), all marked illustrative:** non-hazard `c` floor 0.6 with `support ≥ 3`; high tier 0.8; untrusted trust factor 0.9; suspect and heuristic caps 0.7;"
- [[middleware/context-oracle/docs/architecture-phase-a.md@6cff0ce:L1544]] "Either multiplies by `bar.stale_factor` (seed 0.9)."
- [[ran]] `git show 6cff0ce:middleware/context-oracle/docs/architecture-phase-a.md | grep -n 'stale_factor\|hazard_full_support'` → lines 1544, 1565, 1617 only; none of them contains "illustrative"
- [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B5a.md@HEAD:L344]] "add `bar.stale_factor` to AD-14's tunable-row list with its status (illustrative, chosen to satisfy the invariant)."
- [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B5b-half1.md@HEAD:L273]] "a year-3000 date is not"
- [[ran]] in `b5b1so/fut`: `GIT_AUTHOR_DATE="@7258118400 +0000" git commit --allow-empty` → `aI=2200-01-01T00:00:00+00:00`; `@32503680000 +0000` → `aI=3000-01-01T00:00:00+00:00`; `node -e` with `T0=946684800`, `w=2**((ts-T0)/(h*86400))` → `2150 37 Infinity ratio NaN pass floor 0.6? false` / `2150 365 1.531139353867648e+45 ratio 1` / `3000 365 1.6998375335361105e+301 ratio 1` (other commits' share `1.76e-301`) / `3100 365 Infinity ratio NaN pass floor 0.6? false`
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@8162f00:L3108-L3110]] "commits older than the newest `miner.horizon_commits`, or with `ts < refTs − miner.horizon_years × 365.25 × 86400`, are **horizon-excluded**"
**Correct verdict:** replace — as the first audit states (clamp `ts` to `refTs` or exclude with a counted reason, a test cell, added to the §16 (b) raise), with the reason recorded as the violated "decayed to `HEAD`" premise; also correct "each marked illustrative there" for `bar.stale_factor` and `bar.hazard_full_support` (unmarked at `6cff0ce`; B5a E-20/E-22).

### E-16
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree on all three findings (merge re-stream, the unsettled rewrite detector, the missing inter-chunk yield). The correction for the re-stream should be the root-cause rule, not "skip a hash already in `commits`". A skip-hash guard makes re-counting harmless. It leaves in place the premise that caused it, and that premise has a second, worse effect: it can skip a commit entirely.

**The premise.** Step 13 treats the newest commit streamed so far as the range bound: "every commit at or before the watermark is written", then `<watermark>..HEAD`. That confuses stream position with ancestry. By git's documented range semantics, `r1..r2` is everything reachable from r2 minus everything reachable from r1 (r1 and its ancestors). `--no-merges` changes only what is printed, not what is traversed, and the default order is date order with no parent-before-child guarantee. Two results follow, both executed:
- *Re-stream.* A commit streamed earlier that is not an ancestor of the bound is streamed again. This is the coordinator's case: `b..HEAD` after d reads `d c2`.
- *Loss.* An ancestor of the bound that sorts after it by date is excluded without ever being streamed. With clock skew, a child `b` dated before its parent `a` streams first (`r b a cc`). A chunk that ends at `b` and a crashed incremental pass resumed from `b..HEAD` then yield only `cc`, and `a` is never mined. A skip-hash guard cannot recover a commit that was never streamed.

**The root-cause rule.** The watermark records the tip or tips whose whole reachable set the completed pass mined. For a pass, that is the `HEAD` hash resolved once when the pass starts, merge or not. It is written in the pass's final transaction. The next range excludes it: `<tip>..<new HEAD>`, or `<new HEAD> --not <tip₁> <tip₂> …` for a set of mined tips. Per `gitrevisions`, that excludes each tip and all its ancestors, which is exactly the mined set. Nothing is streamed twice, and nothing unstreamed is excluded. The executed results: `M..HEAD` after d reads `d`; a branch cut from b reads `f1` against `--not T1`; a new main commit reads `e` against `--not T1 F`.

**Crash continuation.** A chunk boundary is never an exclusion bound, because a chunk's commits are not closed under ancestry. So a crashed incremental pass re-runs the same `<old tip>..<pass tip>` range, with both tips recorded when the pass starts, and skips hashes that already have a `commits` row. Step 13 writes a `commits` row for every streamed commit, so this is idempotent through the primary key. The skip-hash guard therefore belongs here, as the continuation mechanism, not as the fix for complete passes. The same rule gives E-9's staleness check (`mined tip ≠ HEAD`). It composes with the settled ref-keying (batch 4 item 1): the recorded tip is per mined ref, and the rewrite and `branch_changed` tests read it.

The first audit's "Would be wrong if" (that `git log --no-merges <wm>..HEAD` never re-lists a commit) is falsified in its favour, as reproduced below. Its remark that the fix could "use `--topo-order` bounds per chunk" does not work. Topological order puts every parent before its children, which removes the loss case, but a whole line of history can still be streamed before the bound without being its ancestor. Executed: under `--topo-order` the stream up to M is `a b c2`, so the bound is c2, and `c2..HEAD` after d re-streams b.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@8162f00:L3104-L3106]] "`--reverse` makes the stream oldest-first, so a chunk's watermark is always its newest commit and every commit at or before the watermark is written"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@8162f00:L3078-L3079]] "`<range>` is `<watermark>..HEAD` for an incremental pass and `HEAD` for a full one."
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@8162f00:L3181-L3184]] "*An incremental pass* is every other pass, including the continuation of an incremental pass that crashed: its committed chunks advanced the watermark with their data (below), so it resumes from `<watermark>..HEAD` and never sets the flag."
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@8162f00:L3118-L3119]] "Every commit gets a `commits` row."
- [[https://git-scm.com/docs/gitrevisions]] "you can ask for commits that are reachable from r2 excluding those that are reachable from r1 by ^r1 r2 and it can be written as r1..r2."
- [[https://git-scm.com/docs/gitrevisions]] "^r1 r2 means commits reachable from r2 but exclude the ones reachable from r1 (i.e. r1 and its ancestors)"
- [[https://git-scm.com/docs/git-log]] "Do not print commits with more than one parent."
- [[https://git-scm.com/docs/git-log]] "By default, the commits are shown in reverse chronological order."
- [[https://git-scm.com/docs/git-log]] "Show no parents before all of its children are shown, and avoid showing commits on multiple lines of history intermixed."
- [[https://git-scm.com/docs/git-log]] "Reverses the meaning of the ^ prefix (or lack thereof) for all following revision specifiers, up to the next --not."
- [[ran]] in `b5b1so/wm` (a; c2 on `side`; b on `main`; merge M; then d): `git log --no-merges --format=%s $W..HEAD` (W = b, the stream's last commit) → `d c2`; `… $TIP..HEAD` (TIP = M) → `d`; `git log --no-merges --format=%s HEAD --not $TIP` → `d`
- [[ran]] in `b5b1so/wm` continued: `git switch -c feat HEAD~2`, commit `f1`: `git log --no-merges --format=%s HEAD --not $T1` → `f1`; back on `main`, commit `e`: `… HEAD --not $T1 $F` → `e`
- [[ran]] in `b5b1so/sk` (r 01-01; a 01-10; `cc` on `side` from a 01-02; `b` on `main` from a dated 01-01T12; merge M): `git log --no-merges --reverse --format=%s HEAD` → `r b a cc`; `git log --no-merges --format=%s $B..HEAD` → `cc` (a, the parent of b, is excluded but was streamed after b); `git log --format='%s %p %h'` shows `b 65ef136 …` and `a 32b90e0 65ef136`, so b's parent is a
- [[ran]] in `b5b1so/wm`: `git log --no-merges --reverse --topo-order --format=%s <M>` → `a b c2`; `git log --no-merges --format=%s <c2>..<d>` → `d b`
- [[middleware/context-oracle/docs/reviews/2026-09-26-branch-audit-B4-verification.md@HEAD:L104-L105]] "Key the watermark to the mined ref (`git symbolic-ref -q HEAD`, with a detached marker)."
**Correct verdict:** replace — keep the two-case rule, the purge set, the `full` propagation and the incremental detached reindex; make the watermark the tip (per mined ref) whose reachable set the completed pass mined, with the range `<tip>..<resolved HEAD>`; resume a crashed incremental pass over the same recorded range with a skip-hash guard; add `T-13` cases for a merge at the range boundary and a skewed parent/child date; and apply batch 4 item 1 (ref-keyed rewrite rule, git fault with no purge, `branch_changed`, ≥ 25 ms yield).

### E-17
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree. The first audit's condition (the engine assigns `seq`) holds. The other way a max-plus-one `INTEGER PRIMARY KEY` can go non-monotone is reuse after the highest row is deleted, and I checked that too: the plan provides no delete or prune for `observed_actions` short of a whole-store `deinit --purge`, which also removes the watermark. So a `seq` watermark is monotone in commit order for this table.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@8162f00:L2199]] "CREATE TABLE observed_actions(seq INTEGER PRIMARY KEY,   -- N16: engine-assigned"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@8162f00:L7807-L7809]] "no code path removes an `observed_actions` row short of a whole-store `deinit --purge` (Step 9's DAO provides no delete/prune method;"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@8162f00:L2612-L2615]] "the index-time regret watermark is a `seq`, never a wall-clock `ts`, for the reason the fold's is"
**Correct verdict:** keep — a commit-ordered watermark matching the fold's, with the race and its test recorded.

### E-19
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree. Recording at onset keeps the diagnostic and removes a write from every event. Per-event staleness still reaches the candidates through `indexStale`, and `index_head` is the commit `resolveHead` returned. Unlike `last_mined_commit`, it is a true tip, so E-9's merge defect does not reach this check. One residual I checked does not change the verdict. A worktree event whose `HEAD` differs sets the flag, and a main-checkout onset after that is not recorded again until a `runIndex` completes. That loses a duplicate onset line, not a fact: the reindex spawn follows `{stale: true}`, not the flag.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@8162f00:L3491-L3496]] "differing commit returns `{stale: true}` and, **only on the transition** — when `schema_meta.index_stale` is not already `'1'` — records the `index_stale` fault (AD-17's detector, through Step 10's writer) and writes `schema_meta.index_stale = '1'`"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@8162f00:L3487-L3488]] "compares `schema_meta.index_head` to the commit `resolveHead(checkoutRoot)` returns"
**Correct verdict:** keep — the fault marks the onset of staleness; per-event staleness stays on the event inputs and audit rows.

### E-20
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree. I read all eight hunks. Each removes executed skeleton evidence (what the skeleton printed or skipped) and keeps the rule, its standard where it has one, and its gap-list id. Each id resolves through §14.5 to its step and test. For example, N1 maps to `corpus_floor_met` and its tests, and N9 to the zone rule and `T-14-3`. So a reader reaches the specifics OL-C7 requires, and the evidence has one home (the gap-list review). The h118 note that is removed whole points to a superseded wording. The replacement rule and its reason (V20/L12) stay in the Consequence bullet.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@8162f00:L4152]] "(N1)."
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@8162f00:L13795]] "| N1 | S13 (`corpus_floor_met`), S18 gate, fixtures ≥ 30 commits | T-13-1, T-18-9, T-38-18 | |"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@8162f00:L13803]] "| N9 | S14 (zone rule), S37 (`T-37-1`) | T-14-3, T-37-1 | S37 |"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@8162f00:L4110-L4112]] "`PreToolUse` whisper next to the tool result, which may be a denial or a failure, so \"just edited\" would be checkably false — L12)"
**Correct verdict:** keep — evidence reduced to a resolvable pointer; every rule keeps its reason.

### E-21
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree. I read AD-15's classifier row and its run-state cases at `6cff0ce`. The strong claim is withheld only when a class-3 segment ran, and class-1 segments subtract what they mapped. The plan's clause is that rule. The "or none ran" case follows from it: with no segment, no unrecognized command could have run the test.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@8162f00:L4136-L4139]] "AD-15's rule exactly: `; not run this session` when every observed Bash segment is class 1 or class 2 (or none ran) — each class-1 segment has already subtracted the tests it mapped"
- [[middleware/context-oracle/docs/architecture-phase-a.md@6cff0ce:L2429-L2430]] "a session containing `make check` composes only the weaker recognized-runners claim"
- [[middleware/context-oracle/docs/architecture-phase-a.md@6cff0ce:L1690]] "(3) everything else → run-state unknown, and **the shipped branch is the weaker honest claim**"
**Correct verdict:** keep — the plan's clause equals AD-15's rule, with the reason for the change recorded.

### E-22
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree. Both sides of the seam say the same thing at `8162f00`. Step 19's `compose` returns `{dropped}`, and Step 28's pipeline reports each returned drop through `ctx.recordDrop`.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@8162f00:L4243-L4246]] "`compose` itself records nothing — it returns `{dropped: <reason>}`, and the handler (Step 28, item 11) reports every returned drop through `ctx.recordDrop`"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@8162f00:L5354-L5356]] "compose (`compose(candidate, {store, checkoutRoot, tier})`, each returned `{dropped}` reported through `ctx.recordDrop`)"
**Correct verdict:** keep — signature and prose agree, and one caller records every drop.

### E-23
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree. I re-fetched the hooks reference. Stop-time `additionalContext` makes the conversation continue, so every spoken Stop is followed by a second Stop with `stop_hook_active` true. The S2 defect was real. The Step 20 note states the Step 28 rule accurately, and `T-28-10` fails if that Stop writes an audit or `delivered` row, or emits anything.
**Evidence:**
- [[https://code.claude.com/docs/en/hooks]] "The conversation continues so Claude can act on the feedback."
- [[https://code.claude.com/docs/en/hooks]] "The stop_hook_active field is true when Claude Code is already continuing as a result of a stop hook."
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@8162f00:L4319-L4322]] "branch is a defence only: the handler generates, audits, and marks delivered nothing at a `Stop`/`SubagentStop` whose `stop_hook_active` is true (Step 28, item 11)"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@8162f00:L5339-L5340]] "11. **At a `Stop`/`SubagentStop` whose `stopHookActive` is true this item is skipped entirely**"
**Correct verdict:** keep — the Step 20 note matches the handler rule, and a discriminating test pins it.

### E-25
**Agree/Disagree:** Verdict: disagree (keep → replace). Reasoning: disagree. The deletion is sound, but the reason recorded for it is false. The first audit's own "Would be wrong if" names this case ("Step 28's replays did not cover the skeleton test's properties"), and the plan meets it. The step says "this step's replays … cover every property it checked — intake, a denied edit, the answer, the allowed edit, a whisper, dedup". None of Step 28's eleven tests asserts an emitted deny. `T-28-1` fails *if* a deny is emitted, and it defers deny content to `T-38-1`. That test lives in Step 38 and verifies Steps 23–25. The skeleton test's `init` assertion ("ctxoracle initialized") is Step 31's, not Step 28's. So the stated coverage of the deleted test is wrong for two of its properties.

This is a correctness point about the record, not about the gate. The skeleton test has been a non-failing `todo` since 1R (reproduced: exit 0), so deleting it at Step 28 loses no enforced check. The `delete:` declaration and `T-28-11`'s own file stand.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@8162f00:L5390-L5395]] "**The skeleton end-to-end test is retired here.** Checkpoint 1R marked `test/unit/skeleton_e2e.test.ts` `todo` (its generators return no candidates at 1R, §9); this step's replays through the built binary cover every property it checked — intake, a denied edit, the answer, the allowed edit, a whisper, dedup — so this step deletes it"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@8162f00:L11968-L11969]] "**NOT asserts.** Downstream behaviour; deny content (T-38-1). **Fails when** a deny is emitted"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@8162f00:L12578-L12580]] "- **T-38-1 (AC-2a) — Intake then deny; answer-directed moves free.** - **File.** `test/replay/answer_drift_off_to_unrelated.test.ts`. - **Verifies.** Steps 23–25 through the pipeline."
- [[middleware/context-oracle/ctxoracle/test/unit/skeleton_e2e.test.ts@8162f00:L68]] "assert.equal(denied.hookSpecificOutput.permissionDecision, 'deny');"
- [[middleware/context-oracle/ctxoracle/test/unit/skeleton_e2e.test.ts@8162f00:L47]] "assert.match(init, /ctxoracle initialized/);"
- [[ran]] `sed -n 11917,12190p plan-8162f00.md | grep -n -i deny` (the T-28-* block) → three lines only: `52:  - **NOT asserts.** Downstream behaviour; deny content (T-38-1). **Fails` / `53:    when** a deny is emitted, OR a …` / `268:    when** any run exceeds the wired 5 s, OR the over-run case emits a deny`, each a no-deny assertion
- [[ran]] `node --test todo.test.mjs` (one failing `{todo}` test) → `not ok 1 - red but todo # TODO SKELETON: 1R` / `# pass 0` / `# fail 0` / `# todo 1`, `exit=0`
**Correct verdict:** replace — keep the `delete:` of the skeleton test at Step 28 and `T-28-11`'s file; rewrite the retirement reason to name where each property is pinned (intake, answer and allowed edit: `T-28-1`; whisper: `T-28-10`; dedup: `T-28-11`; the deny: `T-38-1` at Step 38; `init`: Step 31's tests), or move the deletion to Step 38.

### E-26
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree. The phrase is duplicated at the parent and single at the commit, and nothing else in the sentence changes.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@64f710a:L1477-L1478]] "the replay harness's the replay harness's store preparation (Step 28)"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@8162f00:L1545-L1546]] "the replay harness's store preparation (Step 28), and the store-creating"
**Correct verdict:** keep — a typo removed.

### E-27
**Agree/Disagree:** Verdict: agree (keep). Reasoning: agree. The first audit's condition holds: Step 39 reads both fields. It tabulates each landmine by `support` and by the file's `change_count`, and counts Orientation's entry points by marker against in-degree, from the audit row's evidence. `T-18` checks that Warning's `evidenceJson` carries `support` and `changeCount`. Neither field changes what the agent is told.
**Evidence:**
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@8162f00:L4121-L4125]] "`evidenceJson` records `{kind, support, changeCount}` with `changeCount` = the target's `files.change_count`, so the audit row carries the file's change count beside the landmine's support"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@8162f00:L6818-L6821]] "count, tabulated by `support` and by the file's `change_count` from each"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@8162f00:L6821-L6826]] "**Orientation's entry points by source** — per Orientation whisper, how many named files scored by the entry-marker bonus"
- [[middleware/context-oracle/docs/plans/plan-phase-a.md@8162f00:L11400]] "candidate's `evidenceJson` lacks `support` and `changeCount` equal to the"
**Correct verdict:** keep — two audit-row measurements that Step 39's exit report reads.

## Summary

| Entry | First audit | This opinion | Point |
|---|---|---|---|
| E-1 | keep | keep | header true (m5's second half rejected on the record); `ascii` separators executed |
| E-2 | keep | keep | summaries true of their steps |
| E-3 | keep | keep | generator current; three `S6` cells follow E-12 |
| E-4 | keep | keep | fixture serves a discriminating `T-16-3` |
| E-7 | keep | keep | `MultiEdit` absent from the re-fetched reference |
| E-8 | keep | keep | populated `content` mode also returns `filenames:[]` |
| E-9 | replace | replace | correction changed: one mined-tip watermark (E-16), not a second `last_mined_head` row |
| E-10 | keep | **replace** | builds on B5a E-21 (settled `replace`); the aggregation-clause reason is false |
| E-11 | keep | keep | build-out declaration correct |
| E-13 | replace | replace | `_`/`$` is AD-2's choice (B5a E-18); `T-14-5` pins it undecided |
| E-15 | replace | replace | year-3000 example wrong at `h` = 365; the defect is domination past `refTs`; "each marked illustrative there" false for two seeds |
| E-16 | replace | replace | root-cause rule: the watermark is the mined tip; stream position also loses commits under date skew |
| E-17 | keep | keep | no deletion path, so `seq` stays monotone |
| E-19 | keep | keep | onset recording; `index_head` is a true tip |
| E-20 | keep | keep | pointers resolve through §14.5 |
| E-21 | keep | keep | equals AD-15 |
| E-22 | keep | keep | seam consistent |
| E-23 | keep | keep | Stop continues the conversation; `T-28-10` pins it |
| E-25 | keep | **replace** | Step 28's replays assert no emitted deny (`T-38-1`, Step 38) and no `init` |
| E-26 | keep | keep | typo |
| E-27 | keep | keep | Step 39 reads both fields |

Counts over the 21 sections above: keep 15, replace 6, remove 0, undetermined 0. Two of the first audit's 17 keeps are overturned (E-10, E-25). Not judged here: E-5, E-6, E-12, E-14, E-18 and E-24 (the first audit's other replaces).
