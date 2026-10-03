# Branch audit — batch B2, second opinion

Second-opinion auditor, Opus 5.5. Entries judged: E-1, E-3, E-5, E-6, E-7, E-9, E-10,
E-12, E-13, E-14 of `2026-09-26-branch-audit-B2.md`. Each was re-derived from the
commit's own diff and from the plan, architecture and spec at that commit
(`git show <commit>:<path>`); nothing is taken from the first auditor's quotes. The
yardstick for the skeleton units is the method recorded before the skeleton began,
[[middleware/context-oracle/docs/STATUS.md@256a446:L209-L213]] "Build a thin, connected version of Steps 13–39, each doing its minimum real work, plus one end-to-end test that pushes a hook event through the whole chain. Record every gap it exposes, together with G1–G6 above, on one list. Each entry carries the decision, its reason and its source."
Batch 1 settled that this is the method's decision and that only its record needs
replacing (B1 verification, E-15). So a thin provisional choice that is marked in
the source and listed in the gap list is inside the contract. It is not a finding
by itself. A choice that is unmarked, or that contradicts what the plan step
explicitly specifies, is a finding.

### E-1
**Agree/Disagree:** Verdict: agree (replace). Reasoning: partly disagree. Items (2), (3)
and (4) hold at source, although the fix proposed for (2) and (3) is wrong in two
places. Item (5) goes beyond the method's contract. The first auditor also missed
one silent narrowing of the plan.
- (2) The `rev-parse` catch. The finding holds: the catch hides every failure, and
  the gap list does not mention it. But the proposed fix, "let `rev-parse` throw",
  would make a legitimate state fail. A freshly initialised repository with no
  commits has an unborn `HEAD`, and `git rev-parse HEAD` exits 128 on it (executed
  below). The correct fix separates the two cases. An unborn `HEAD` is an empty
  history: return zero and record it. Every other failure propagates.
- (3) The literal fallbacks. The finding holds. But the plan does not specify "no
  fallback". It specifies a visible re-seed: the `TuningReader` re-seeds a missing
  key from the seed module and records `tuning_missing`. The skeleton copies the
  seed values as literals and records nothing. So it breaks two things: the rule
  that the seed module is the single source of numbers, and the requirement that
  the re-seed be visible. The proposed fix, "let a missing row surface as
  `tuning_missing`", misstates the specified behaviour.
- (4) Revert and fix labels counted only on included commits. The finding holds.
  AD-15 bounds `revert_chain` by the horizon alone. The transaction-size exclusion
  is FR-K2 co-change hygiene, not a landmine rule.
- (5) Goes beyond the contract. The G4 double-count is marked in the source
  (L174–L175) and listed as G4 with its consequence, which is exactly what the
  method allowed a skeleton to do. The skeleton is a probe that feeds the one
  review. It is not a shipped behaviour. Calling a marked, listed provisional
  choice "the wrong minimum" applies the full-build standard to the skeleton. G4
  belongs in the gap-list entry (E-2) and in the full build, not in this file's
  verdict.
- Missed by the first auditor. Plan Step 13 says a leading field that is not a
  valid header "is recorded with a `miner_unparsed_numstat` diagnostic". The
  skeleton drops that field with no diagnostic, and no `SKELETON:` mark says so.
  It narrows an explicitly specified behaviour of the step, which the method did
  not permit. It is not one of the details the plan left open.
- Minor, also unmarked: the horizon uses `horizonYears * 365 * DAY_S`, with no
  stated source for the 365-day year. No verdict rests on it.

**Evidence:**
- The unmarked catch: [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@f182589:L157-L162]] "try { head = git(repoPath, ['rev-parse', 'HEAD']).trim(); } catch { return { commitsSeen: 0, commitsIncluded: 0, pairsWritten: 0, unparsed: 0, corpusFloorMet: false, headCommit: null }; }"
- An unborn `HEAD` makes `rev-parse` fail: [[ran]] `git init -q && git rev-parse HEAD; echo "exit=$?"` (git 2.43.0, in a scratch directory) → `fatal: ambiguous argument 'HEAD': unknown revision or path not in the working tree.` … `exit=128`
- The leading field is dropped silently: [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@f182589:L73-L78]] "if (cur === null) { // A field before any header is a malformed stream; there is no commit to // attach it to. i += 1; continue; }"
- The plan requires a diagnostic for that field: [[middleware/context-oracle/docs/plans/plan-phase-a.md@256a446:L2236-L2241]] "A leading field that is not a valid `\x1e`+40-hex header, a numstat entry lacking the `<added>\t<deleted>\t` shape, or a rename marker missing its two following identity fields (a truncated stream) — a malformed stream, e.g. a future git output-format drift — is recorded with a `miner_unparsed_numstat` diagnostic (Step 6) and contributes no pair, never guessed."
- The plan's tuning behaviour is a re-seed that records a fault: [[middleware/context-oracle/docs/plans/plan-phase-a.md@256a446:L1404-L1406]] "`tuning_missing` for a `tuning` key read that finds no row (Step 12's `TuningReader` re-seeds the key from its seed module and records this code with the key in `detail`)"
- The literal fallback: [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@f182589:L139-L143]] "function num(store: Store, key: string, fallback: number): number { const v = tuning.get(store, key); const n = v === null ? NaN : Number(v); return Number.isFinite(n) ? n : fallback; }"
- The single-source rule: [[middleware/context-oracle/ctxoracle/src/stores/dao/tuning_seeds.ts@256a446:L1-L3]] "// The single source of tuning seed values + provenance (Step 12). Both // `seedDefaults` and the tuning reader read this module, so no consuming module // carries a number of its own."
- Labels are counted after the exclusion return: [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@f182589:L233-L245]] "if (excludeReason !== null) return;" … "if (isRevertLabelled(c.subject)) for (const p of touched) push(revertHits, p, c.hash);"
- AD-15 bounds by the horizon only: [[middleware/context-oracle/docs/architecture-phase-a.md@256a446:L1165-L1167]] "deterministic history mining in `ctxoracle index`: `revert_chain` (a file appearing in ≥ 2 revert-labeled commits within the horizon)"
- G4 is marked: [[middleware/context-oracle/ctxoracle/src/miner/cochange.ts@f182589:L174-L175]] "// SKELETON: history-rewrite handling (G4). An unreachable watermark falls back // to a full mine without clearing existing counts and without a fault code."
- G4 is listed: [[middleware/context-oracle/docs/implementation-log.md@f182589:L515-L516]] "*Skeleton:* an unreachable watermark falls back to a full mine with no clearing and no fault."
- The revert prefixes, re-run: [[ran]] `git revert --no-edit HEAD` twice, then `git log --format='%s|%b'` (git 2.43.0) → `Reapply "both"|This reverts commit 291af22…` / `Revert "both"|This reverts commit 8488efe…` / `both|`

**Correct verdict:** replace. Correct the four unmarked choices in this file and do
not act on (5):
- the `rev-parse` catch: an unborn `HEAD` returns an empty result and records it;
  every other failure propagates;
- the literal fallbacks: read through the seed module, re-seeding a missing key
  and recording `tuning_missing`;
- the label order: count labels before the size exclusion, or mark and list the
  narrowing;
- the silent leading-field skip: record `miner_unparsed_numstat`, as the plan
  specifies.

### E-3
**Agree/Disagree:** Verdict: agree (replace). Reasoning: partly disagree. Three of the
five "unmarked" items hold, one holds only in part, and one is inside a marked
provisional choice. The first auditor also missed three defects in files the entry
covers.
- Item 1, the `statSync` catch, holds in part. `git ls-files --cached` also lists
  tracked files that have been deleted from the working tree. Step 14 walks the
  working tree, so skipping those on `ENOENT` is legitimate. The defect is the bare
  catch: it swallows every error code, including the `ENOENT` a mis-decoded
  non-UTF-8 name produces (the review's executed G7 case). The fix is not "surface
  every `statSync` error". It is to skip only a genuine working-tree deletion,
  record every other failure, and fix the decoding (G7).
- Item 2, the zone-skip, holds. It is worse than stated. The zone marker regex
  matches the phrase "generated by" anywhere in the first 2 KB of text, not only in
  a marker comment as AD-12 says. Any source file whose header prose contains the
  phrase is classed `generated` and then loses all its symbols through the
  zone-skip. Neither behaviour is marked.
- Item 3, the cumulative `entry_score`, holds. The G11 mark covers the missing
  inputs, not the accumulation. T-14-1's "a second run over an unchanged tree
  writes nothing" fails against it.
- Item 4, the cross-language tries, is not an unmarked choice. It sits inside the
  G12 mark, which says the rule adds extensions and `/index.*` to relative
  specifiers. That is a marked, listed provisional resolution rule, the kind the
  method allowed. Its Python failure belongs to G12's entry (E-4), not to this
  entry's list of unmarked choices.
- Item 5, the FTS/`LIKE` mismatch, holds for symbols, which G16 does not cover. For
  paths, even after G16's tokenizer fix, the `LIKE` branch is a substring match
  (`%t%`) and the FTS branch is a token match, so the two still disagree. The
  `LIKE` terms are also not escaped, so the `_` common in identifiers acts as a
  wildcard.
- Missed by the first auditor: the generic frontend computes a symbol's span by
  adding a character index within the line (`line.indexOf`) to a byte offset
  (`Buffer.byteLength`). On any line with a non-ASCII character before the name,
  the stored span is wrong. The code is unmarked.
- Agreed as plan-backed, at source: the parse-throw fallback to the generic
  frontend with a fault, and the `EPERM` rule. The G14 `init()` change is backed by
  the library's type declarations (re-run below).

**Evidence:**
- The bare catch: [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@0e457c7:L142-L148]] "return [...new Set(out.split('\0').filter((p) => p !== ''))].filter((p) => { try { return statSync(path.join(repoPath, p)).isFile(); } catch { return false; } });"
- Plan Step 14 walks the working tree: [[middleware/context-oracle/docs/plans/plan-phase-a.md@256a446:L2332]] "walks the working tree respecting `.gitignore`; per file resolves the"
- The zone-skip: [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@0e457c7:L230]] "if (tooBig || fe === undefined || zone.zone !== 'source') {"
- The marker regex matches any text in the first 2 KB: [[middleware/context-oracle/ctxoracle/src/index/zone.ts@0e457c7:L15]] "const MARKER = /(@generated|DO NOT EDIT|auto-generated|autogenerated|generated by)/i;" and [[middleware/context-oracle/ctxoracle/src/index/zone.ts@0e457c7:L26]] "const m = MARKER.exec(head.slice(0, 2048));"
- AD-12 says marker comments, and no invisible files: [[middleware/context-oracle/docs/architecture-phase-a.md@256a446:L1008-L1009]] "(with zone classification: marker comments in the head 2 KB" and [[middleware/context-oracle/docs/architecture-phase-a.md@256a446:L1025]] "no language is invisible"
- The accumulation: [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@0e457c7:L253-L258]] "// SKELETON: G11 — entry_score is only the path marker plus in-degree here; // symbol_refs and test_map are not produced yet. for (const [, id] of known) { const deg = edges.inDegree(id); if (deg > 0) store.prepare('UPDATE files SET entry_score = entry_score + ? WHERE id = ?').run(deg, id);"
- T-14-1's idempotence requirement: [[middleware/context-oracle/docs/plans/plan-phase-a.md@256a446:L2455-L2456]] "a second run over an unchanged tree writes nothing"
- The G12 mark covers the added extensions: [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@0e457c7:L151]] "SKELETON: G12 — the plan says an import edge \"resolves to the imported file\"" and [[middleware/context-oracle/ctxoracle/src/index/indexer.ts@0e457c7:L154]] "extensions and `/index.*`. Bare (package) specifiers produce no edge."
- Search semantics differ: [[middleware/context-oracle/ctxoracle/src/index/search.ts@0e457c7:L22]] "return terms.map((t) => `\"${t.replace(/\"/g, '\"\"')}\"`).join(' OR ');" / [[middleware/context-oracle/ctxoracle/src/index/search.ts@0e457c7:L39]] "all(...ts.map((t) => `${t}%`))" / [[middleware/context-oracle/ctxoracle/src/index/search.ts@0e457c7:L60]] "all(...ts.map((t) => `%${t}%`))"
- The plan requires agreement: [[middleware/context-oracle/docs/plans/plan-phase-a.md@256a446:L2562-L2563]] "the FTS and `LIKE` hit sets agree for symbol-token queries"
- G16 covers only paths: [[middleware/context-oracle/docs/implementation-log.md@0e457c7:L568-L571]] "**G16 — the FTS path index never matches a path segment (a schema bug).**"
- The span mixes units: [[middleware/context-oracle/ctxoracle/src/index/generic_frontend.ts@0e457c7:L26-L31]] "const start = offset + line.indexOf(name);" … "offset += Buffer.byteLength(line, 'utf8') + 1;"
- Parse-failure fallback, plan-backed: [[middleware/context-oracle/ctxoracle/src/index/tree_sitter_frontend.ts@0e457c7:L82-L87]] "parser = null; onParseFailed(lang, path, e); return genericFrontend.parse(path, content);"
- [[ran]] `grep -n "static init\|static load" node_modules/web-tree-sitter/web-tree-sitter.d.ts` in `ctxoracle/` (package version 0.25.10) → `136: static init(moduleOptions?: EmscriptenModule): Promise<void>;` / `329: static load(input: string | Uint8Array): Promise<Language>;`

**Correct verdict:** replace. Keep the marked skeleton and the plan-backed parts, and
correct the unmarked defects:
- the bare `statSync` catch;
- the zone-skip, together with the over-broad marker regex;
- the cumulative `entry_score`;
- the FTS/`LIKE` disagreement, for symbols and paths, with escaped `LIKE` terms;
- the generic frontend's mixed-unit spans.

The cross-language tries stay under G12.

### E-5
**Agree/Disagree:** Verdict: agree (replace). Reasoning: mostly agree. All six unmarked
items hold at source. Item 3 is misdiagnosed, and the first auditor missed two
things.
- Item 3, Orientation's constants: the literal `support: 3, ratio: 1` exists as
  stated, but the root is in AD-14, not the genre. AD-14 defines confidence for
  history facts and for human facts only. It defines none for structural
  (current-state) facts, yet it still requires every candidate to clear the
  confidence floor. With no ratio, the bar gives a structural candidate a
  confidence of 0, so it always fails. The skeleton filled that undefined axis with
  constants that pass by construction, and did not mark or list the gap. The
  correct response is a gap entry, "AD-14 defines no confidence for the structural
  fact class". Replacing the constants with "a real evidence term" is not enough,
  because nothing defines what that term would be.
- Missed 1, the hazard noise floor: the bar checks only half of AD-14's floor. AD-14
  requires `support ≥ 2` and that the evidence is "not sourced solely from an
  excluded-commit class". The bar checks `support` alone, and nothing marks the
  missing half. At the miner, excluded commits never contribute labels (E-1 item
  4), so the omission is invisible today. It still silently narrows AD-14.
- Missed 2, the classifier: it is plan-backed, but the plan's operator list is
  wrong. Plan Step 17 splits on `&&`, `;`, `|`, `||`. Bash also separates commands
  on a newline and on `&` (executed below). So `echo ok` followed by a newline and
  any second command is read as one segment, and the second command is never
  classified. The code follows the plan, so the defect is a plan flaw inherited by
  the skeleton. It should be recorded for the plan's Step 17 correction, not
  charged to the skeleton.
- The `0.8` threshold in the composer is worse than a duplicated seed. No tuning
  seed carries a high-confidence tier, and G20 itself says no cap or tier value is
  written anywhere. So `0.8` invents the undefined tier. It is not merely a copy of
  an existing value.
- Agreed at source: `blastRadius: 2` equals the read-context floor and is not
  covered by G18, which lists only the added type fields. The literal fallbacks, the
  "90 days" text, and the `pathWrites` filter that ignores the outcome also hold.

**Evidence:**
- AD-14's confidence covers history and human facts only: [[middleware/context-oracle/docs/architecture-phase-a.md@256a446:L1085-L1088]] "**Confidence** `c`: evidence-derived. History facts: `support` and `confidence` from `cochange_pairs`, dampened by staleness (`FR-K7`) and recency; capped by trust (`untrusted_repo` provenance can never yield high-confidence — `FR-X4`). Human facts: high by construction (`FR-L6`)."
- The bar applies the floor to every non-human, non-hazard candidate: [[middleware/context-oracle/ctxoracle/src/bar/combinator.ts@58a3495:L44-L46]] "} else if (c.factClass !== 'human') { if (support < n(t, 'bar.support_min', 3) || confidenceOf(c, t, ctx) < n(t, 'bar.confidence_floor', 0.6)) return { passes: false, failedAxis: 'confidence' };"
- A missing ratio gives zero: [[middleware/context-oracle/ctxoracle/src/bar/combinator.ts@58a3495:L22]] "let conf = c.ratio ?? 0;"
- Orientation's constants: [[middleware/context-oracle/ctxoracle/src/genres/orientation.ts@58a3495:L27]] "factClass: 'structural' as const," and [[middleware/context-oracle/ctxoracle/src/genres/orientation.ts@58a3495:L36-L37]] "support: 3, ratio: 1,"
- AD-14's noise floor has two parts: [[middleware/context-oracle/docs/architecture-phase-a.md@256a446:L1106-L1108]] "they require only the **noise floor** (real vs coincidental evidence: `support ≥ 2` and not sourced solely from an excluded-commit class)"
- The bar checks one part: [[middleware/context-oracle/ctxoracle/src/bar/combinator.ts@58a3495:L42-L43]] "if (c.hazard) { if (support < n(t, 'bar.noise_floor_support_min', 2)) return { passes: false, failedAxis: 'confidence' };"
- Coupling's constant: [[middleware/context-oracle/ctxoracle/src/genres/coupling.ts@58a3495:L28]] "blastRadius: 2," and G18 lists only the new fields: [[middleware/context-oracle/docs/implementation-log.md@58a3495:L585-L586]] "*Skeleton:* optional `context`, `blastRadius`, `zone`, `crossFile`, `comparative` and `trust` fields."
- The composer's tier: [[middleware/context-oracle/ctxoracle/src/hook/compose.ts@58a3495:L44]] "const flag = c.hazard || (confidence !== undefined && confidence < 0.8) ? ' [confidence: uncertain]' : '';" G20 says no value exists: [[middleware/context-oracle/docs/implementation-log.md@58a3495:L591-L592]] "**G20 — the trust cap has no value.** \"Capped by trust (`untrusted_repo` can never yield high-confidence)\" names no cap."
- The plan's split list: [[middleware/context-oracle/docs/plans/plan-phase-a.md@256a446:L2656]] "Per AD-15: split on `&&`, `;`, `|`, `||` **quote-aware** (operators inside"
- Newline and `&` separate commands: [[ran]] `bash -c $'echo one\necho two'; bash -c 'echo three & wait; echo four'` (GNU bash 5.2.21) → `one` / `two` / `three` / `four`
- The edit set ignores the outcome: [[middleware/context-oracle/ctxoracle/src/stores/dao/observed_actions.ts@256a446:L86-L87]] "WHERE session = ? AND seq > ? AND path IS NOT NULL AND ${inList('tool', EDIT_TOOLS)}" against [[middleware/context-oracle/docs/plans/plan-phase-a.md@256a446:L2743-L2745]] "the session's edited files from `observed_actions` (`outcome='ok'`, Edit/Write rows only — AD-4's consumer filter)"

**Correct verdict:** replace. Remove the unmarked constants and fallbacks as the first
auditor says. Also:
- record "AD-14 defines no structural-fact confidence" as a gap, in place of
  Orientation's constants;
- mark and list the half-implemented noise floor, or implement it;
- record the missing newline and `&` separators as a flaw in plan Step 17.

### E-6
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree on the diagnoses, but one
framing is wrong and three shortfalls were missed.
- Agreed at source. G20 argues from a premise AD-14 does not state: AD-14 says "can
  never yield high-confidence", which names a tier, not the floor. G24 quotes only
  half of AD-19, whose same sentence allows "pointers …, numbers, and names only",
  so a headline built from paths and counts complies. G17, G18, G19, G21, G22 and
  G25 are real.
- Wrong framing. The first auditor faults G20's and G24's provisional choices for
  "removing required properties". A marked, listed provisional removal is what the
  skeleton method allowed; the full build restores the property. What must be
  replaced is each entry's diagnosis, its stated reason. The list was the only
  input to the review, and a wrong reason there can mislead the full build. That
  is the real defect, and it is enough for the verdict.
- Missed 1, G17 hides its own consequence. G17 says the minimal reader "reads, and
  does not yet re-seed or record". It does not say what happens instead: every
  consumer silently substitutes a literal copy of the seed value (combinator
  `n(…, fallback)`, E-5; the miner's `num`, E-1). So the gap entry understates the
  behaviour it covers. A missing key yields a number with no fault, and the list
  never says so.
- Missed 2, G23 and G25 carry no choice. Both entries state a gap but no
  `*Skeleton:*` choice, no reason and no source. The method required each entry to
  carry a decision, a reason and a source, so these two meet the contract less
  than any other entry here.
- Missed 3, FR-X4 is spec-level. G20's "no cap" is the one entry that sets aside
  a spec requirement. FR-X4 says "low trust lowers confidence", and a skeleton
  with no cap applies no lowering at all. The entry should say it is suspending a
  spec requirement, not only an AD-14 phrase.

**Evidence:**
- G20's premise: [[middleware/context-oracle/docs/implementation-log.md@58a3495:L591-L595]] "**G20 — the trust cap has no value.** \"Capped by trust (`untrusted_repo` can never yield high-confidence)\" names no cap. Every Phase A mined fact is `untrusted_repo`, so any cap below the 0.6 floor would silence every history genre. *Skeleton:* no cap."
- AD-14 names a tier: [[middleware/context-oracle/docs/architecture-phase-a.md@256a446:L1087-L1088]] "recency; capped by trust (`untrusted_repo` provenance can never yield high-confidence — `FR-X4`)."
- FR-X4: [[middleware/context-oracle/docs/specs/spec-context-oracle.md@58a3495:L314-L315]] "a trust label rides every fact; low trust lowers confidence and cannot be laundered `[ASI06]`."
- G24's half-quote: [[middleware/context-oracle/docs/implementation-log.md@58a3495:L606-L609]] "AD-19 says composition is pointer-only with no verbatim repo-derived text, yet the genres build a headline string from repo paths." AD-19 in full: [[middleware/context-oracle/docs/architecture-phase-a.md@256a446:L1344-L1346]] "Phase A whispers carry **no verbatim repo-derived text at all** — pointers (`path:line-span`, commit hashes), numbers, and names only."
- G17's wording: [[middleware/context-oracle/docs/implementation-log.md@58a3495:L576-L580]] "*Skeleton:* `tuningReader(global)` in `tuning.ts` reads, but does not re-seed or record." The substitution it omits: [[middleware/context-oracle/ctxoracle/src/bar/combinator.ts@58a3495:L13-L16]] "function n(t: TuningReader, key: string, fallback: number): number { const v = Number(t.get(key)); return Number.isFinite(v) ? v : fallback; }"
- G23 and G25 have no choice: [[middleware/context-oracle/docs/implementation-log.md@58a3495:L603-L605]] "**G23 — dedup identity is too coarse.** `consumer_state` is keyed by consumer (`main`/`subagent`) with no session. Every subagent shares one dedup set, and concurrent sessions on one repo share `main`'s." and [[middleware/context-oracle/docs/implementation-log.md@58a3495:L610-L613]] "With no shared subject vocabulary, \"don't tell the agent what it already read\" never matches anything."
- The review reached the same corrections for G20 and G24: [[middleware/context-oracle/docs/reviews/2026-09-25-skeleton-gap-list-review.md@ef016eb:L462-L466]] "\"Any cap below 0.6 silences every history genre\" is true arithmetic, but it assumes the cap must sit below the floor." and [[middleware/context-oracle/docs/reviews/2026-09-25-skeleton-gap-list-review.md@ef016eb:L557-L560]] "A headline built from paths and counts is therefore compliant."

**Correct verdict:** replace. Correct the diagnoses of G20 (the tier is undefined; FR-X4
is suspended) and G24 (AD-19 permits names). State in G17 the literal-default
substitution it causes. Give G23 and G25 a choice with its reason. Add evidence to
the record.

### E-7
**Agree/Disagree:** Verdict: agree (replace). Reasoning: mostly agree, with three items
overstated and two missed.
- The central finding holds at source and is the strongest in this batch. The e2e
  test asserts a Coupling whisper on a 4-commit repository. The seeded floor is 30
  commits, FR-A6 says history genres stay silent below it, and nothing outside the
  miner reads `corpusFloorMet`. If FR-A6 were implemented, this test would fail.
- The audit-bypass of the outstanding-question line holds.
- The fabricated stdin event holds.
- The stubbed reader methods hold.
- The `cwd`-relative target path holds.
- Overstated 1, the layout creation. The plan's words are "never migrates or
  creates on open", and they refer to the store. `ensureLayout` creates
  directories under the oracle's home, not the store and not anything near the
  repository tree, so "which the plan forbids" and "repo-tree-adjacent" overstate
  it. The real defect is smaller. The handler creates a per-repository directory
  set, and sends its diagnostics there, for every repository any hook fires in,
  before it checks whether that repository was ever initialised. That is an
  unmarked side effect, and it runs after G30's `git` subprocess.
- Overstated 2, the millisecond `seq`. Neither the plan nor the architecture gives
  `seq` any semantics beyond its column. At this commit every reader passes a
  `sinceSeq` of 0, so no ordering depends on it yet. It is an unmarked choice to
  mark, not a present defect.
- Overstated 3, the other assertions. The first auditor calls them "real". The deny,
  answer-then-allow, read-never-denied and dedup assertions do discriminate. The
  closing `Stop` → `''` assertion does not: no Edit ever reaches `PostToolUse`, so
  Completeness has no input. The assertion passes whether the Stop path works or
  not.
- Missed 1, one whisper that passes for three reasons. The Coupling whisper passes
  the bar only because of three separate defects together:
  - the missing corpus floor;
  - G3's stand-in ratio of 1.00;
  - Coupling's constant `blastRadius: 2`, which equals the read-context floor
    (E-5).

  So the whisper assertion would still pass if the bar were deleted. It proves the
  pipe connects. It proves nothing about the bar. That is acceptable for the
  method's connectivity test only if the test says so, and it does not. Its header
  says it "proves the steps connect". The implementation log's e2e account treats
  the whisper as a pipeline result.
- Missed 2, an unmarked fallback. The adapter falls back to `process.cwd()` when an
  event carries no `cwd`. This resolves the repository from wherever the hook
  process happens to run. It is an unmarked fallback of the kind the brief names,
  and it compounds the fabricated-stdin item.

**Evidence:**
- The fixture has 4 commits: [[middleware/context-oracle/ctxoracle/test/unit/skeleton_e2e.test.ts@c45e0db:L39-L44]] "for (let i = 0; i < 4; i++) {" and the whisper assertion: [[middleware/context-oracle/ctxoracle/test/unit/skeleton_e2e.test.ts@c45e0db:L78-L79]] "assert.match(whisper.hookSpecificOutput.additionalContext, /^\[oracle\] coupling: src\/db\/schema\.ts/);"
- The floor is 30: [[middleware/context-oracle/ctxoracle/src/stores/dao/tuning_seeds.ts@c45e0db:L32]] "{ key: 'miner.corpus_floor_commits', value: '30', source: 'architecture_default' },"
- FR-A6: [[middleware/context-oracle/docs/specs/spec-context-oracle.md@c45e0db:L247-L248]] "**FR-A6 — Corpus (evidentiary) floor only.** Below a minimum history corpus, history-derived genres stay silent"
- Nothing reads the flag: [[ran]] `git grep -n "corpusFloorMet\|corpus_floor" c45e0db -- middleware/context-oracle/ctxoracle/src middleware/context-oracle/ctxoracle/test` → four hits in `src/miner/cochange.ts` (L129 type, L161 catch return, L169 read, L286 computed), one in `tuning_seeds.ts` L32, one in `test/unit/tuning_dao.test.ts` L60. No genre, bar or handler reads it.
- The test's own claim: [[middleware/context-oracle/ctxoracle/test/unit/skeleton_e2e.test.ts@c45e0db:L4-L5]] "It proves the steps connect; // the per-step §12 tests replace its detail as each step is fully built."
- The Stop assertion has no edit input: only `PreToolUse` Edit events are sent ([[middleware/context-oracle/ctxoracle/test/unit/skeleton_e2e.test.ts@c45e0db:L76]] "assert.equal(hook('PreToolUse', edit), '', 'the edit is allowed once the answer is in the transcript');"), and Completeness reads Edit rows appended on `PostToolUse` ([[middleware/context-oracle/ctxoracle/src/hook/handler.ts@c45e0db:L166]] "if (ev.kind === 'PostToolUse' || ev.kind === 'PostToolUseFailure') {").
- The plan's store rule: [[middleware/context-oracle/docs/plans/plan-phase-a.md@256a446:L3669-L3672]] "open the project store at the layout's path for the event's repository, `<home>/projects/<key>/store.db` (`openStore`, Step 3) — the handler never migrates or creates on open"
- The layout is created before the check: [[middleware/context-oracle/ctxoracle/src/hook/handler.ts@c45e0db:L83-L85]] "const layout = ensureLayout(home, key); diagnosticsDir = layout.diagnostics; if (!existsSync(layout.project) || !existsSync(layout.global)) return { stdout: '' }; // not initialized: fail open"
- The directories are under the home: [[middleware/context-oracle/ctxoracle/src/identity/layout.ts@c45e0db:L38-L44]] "const globalDir = path.join(home, 'global'); const projectsDir = path.join(home, 'projects'); const projectDir = path.join(projectsDir, repoKey);"
- `sinceSeq` is always 0: [[middleware/context-oracle/ctxoracle/src/hook/handler.ts@c45e0db:L99]] "pathWrites: (p) => oa.pathWrites(ev!.session, 0).filter((x) => x === p).length,"
- The audit loop covers `texts` only: [[middleware/context-oracle/ctxoracle/src/hook/handler.ts@c45e0db:L207-L208]] "const line = outstandingQuestionLine(store, consumer, done); if (line !== null) body = body.length > 0 ? `${body}\n${line}` : line;" and [[middleware/context-oracle/ctxoracle/src/hook/handler.ts@c45e0db:L217-L218]] "for (const x of texts) audit.append({"
- AD-8: [[middleware/context-oracle/docs/architecture-phase-a.md@256a446:L727-L728]] "audit write precedes emission for both whispers and denies — an unlogged whisper/deny is not emitted (`FR-X6` made true by construction"
- The `cwd` fallback: [[middleware/context-oracle/ctxoracle/src/hook/adapter.ts@c45e0db:L19]] "const cwd = str(j.cwd) ?? process.cwd();" and the stdin fallback: [[middleware/context-oracle/ctxoracle/src/cli/hook.ts@c45e0db:L12-L16]] "try { stdin = readFileSync(0, 'utf8'); } catch { stdin = '{}'; }"

**Correct verdict:** replace. Keep the connected pipeline and the plan-backed modules.
Fix the fabricated stdin event, the `process.cwd()` fallback, the unaudited
question line, the stubs and the `cwd`-relative target, and mark `seq` and the
layout creation. Change the e2e test so it:
- does not pin the absence of FR-A6;
- states that its whisper assertion checks connectivity, not the bar;
- gives the Stop assertion an edit to act on.

### E-9
**Agree/Disagree:** Verdict: agree (replace). Reasoning: agree with every item the first
auditor raised; each checks out at source, including that `--replace` is the plan's
own design (plan L4168: "refusing to overwrite a non-empty store without
`--replace`"). The first auditor missed three defects, two of them more serious
than the ones raised.
- Missed 1, `import` can replace a live store with an empty one. `importVerb`
  validates its source with `openStore(src)`. `openStore` is `new
  DatabaseSync(dbPath)` followed by `PRAGMA journal_mode = WAL`, and it creates the
  file when it does not exist. An empty new database passes `quick_check`. So
  `import <dir> --replace` pointed at a directory with no `project.db` copies an
  empty database over the owner's store. On a fresh layout it does so without
  `--replace`. The "validation" also writes to the export being imported: it sets
  WAL mode and may leave sidecars. Executed below. This is a data-loss path
  independent of G34, and G34 does not name it.
- Missed 2, `import` is not atomic across its two files. It copies `project.db`
  before it checks `global.db`, so a failed check on the second file leaves the
  first already replaced. The result is a partial import that reports failure.
- Missed 3, the fold's source contradicts itself, and the gap list does not
  mention it. Plan Step 30 requires the fold to aggregate `corrections` rows into
  `corrected_false` and `corrected_missed`. The code folds only `sent`. The gap
  list does disclose that, in G33 ("*Skeleton:* one all-time window (`window_start`
  0), and `sent` only"). But the source file's header says the opposite ("project
  whisper_audit + corrections") and carries no `SKELETON:` mark for the omission.
  Meanwhile `correct` records a correction and calls the fold, so from the code the
  owner's correction looks counted when it is not. The listing meets the method.
  The unmarked, contradicting header does not.
- Also missed, minor: `model/invoke.ts` says "Nothing in Phase A imports this module
  except its unit test". This commit adds no such test, and nothing at this commit
  imports the module (`git grep` below), so half of the sentence is false at the
  commit.

**Evidence:**
- The import validation opens its source with `openStore`: [[middleware/context-oracle/ctxoracle/src/cli/verbs_skeleton.ts@59cc05c:L205-L208]] "const src = path.join(dir, name); const s = openStore(src); const ok = s.integrityCheck() === 'ok'; s.close();"
- `openStore` creates and writes: [[middleware/context-oracle/ctxoracle/src/stores/adapter.ts@59cc05c:L54-L56]] "export function openStore(dbPath: string): Store { const db = new DatabaseSync(dbPath); db.exec('PRAGMA journal_mode = WAL');"
- A missing path becomes an empty database that passes the check: [[ran]] `node -e "const {DatabaseSync}=require('node:sqlite'); const d=new DatabaseSync('imp/project.db'); d.exec('PRAGMA journal_mode = WAL'); console.log(d.prepare('PRAGMA quick_check').get()); d.close();"` in an empty scratch `imp/` (Node v22.22.2) → `{ quick_check: 'ok' }`, and `ls -la imp` then shows `project.db` (4096 bytes)
- The copy loop runs per file: [[middleware/context-oracle/ctxoracle/src/cli/verbs_skeleton.ts@59cc05c:L213-L217]] "if (existsSync(dest) && !args.includes('--replace')) { process.stderr.write(`ctxoracle: ${dest} exists; pass --replace to overwrite\n`); return 1; } copyFileSync(src, dest);"
- The plan's fold includes corrections: [[middleware/context-oracle/docs/plans/plan-phase-a.md@256a446:L3873-L3876]] "aggregates the project store's `whisper_audit` rows (`sent` per genre) and `corrections` rows (`corrected_false`, `corrected_missed`) newer than the watermark, upserts `whisper_stats`"
- The fold's header claims corrections: [[middleware/context-oracle/ctxoracle/src/diag/whisper_stats_fold.ts@59cc05c:L1-L2]] "// SessionEnd fold (Step 30, AD-5, AD-26): project whisper_audit + corrections // newer than this project's watermark → global whisper_stats"
- The fold reads only `whisper_audit`: [[middleware/context-oracle/ctxoracle/src/diag/whisper_stats_fold.ts@59cc05c:L13-L15]] "const sent = project .prepare(\"SELECT genre, count(*) AS n FROM whisper_audit WHERE kind = 'whisper' AND ts > ? AND ts <= ? GROUP BY genre\") .all(wm, now)"
- G33 lists the `sent`-only fold: [[middleware/context-oracle/docs/implementation-log.md@59cc05c:L658-L659]] "*Skeleton:* one all-time window (`window_start` 0), and `sent` only."
- `correct` writes a correction, then folds: [[middleware/context-oracle/ctxoracle/src/cli/verbs_skeleton.ts@59cc05c:L129-L136]] "correctionsDao(r.project).create({" … "foldWhisperStats(r.global, r.project, r.key.key);"
- The `invoke.ts` claim: [[middleware/context-oracle/ctxoracle/src/model/invoke.ts@59cc05c:L6-L7]] "Nothing in // Phase A imports this module except its unit test." Against it: [[ran]] `git grep -n "model/invoke" 59cc05c -- middleware/context-oracle/ctxoracle` → no output; `git show 59cc05c --stat` lists no test file.

**Correct verdict:** replace. Apply the first auditor's changes: `import` refuses until it
is safe; mark or fix the fold watermark, the placeholder row and the hard-coded
consumer. In addition:
- `import` never creates or modifies its source; it validates by opening the
  source read-only and checking the file exists;
- `import` is all-or-nothing across both files;
- the fold's header is corrected to match what it does, with a `SKELETON: G33` mark
  on the `sent`-only fold;
- the false sentence in `invoke.ts` is corrected.

### E-10
**Agree/Disagree:** Verdict: agree (replace). Reasoning: disagree on G36's backing. The
first auditor misquotes nothing, but relies on a web quote that cannot be
reproduced today, and gives the record less scrutiny than it needs.
- G36 backing. The first auditor says G36's exclusion rule is "the pattern Max
  Cogar rejected", citing OL-R5. OL-R5 is scoped to one thing: how the answer-drift
  block is defined ("Superseded by **OL-C5**; define the block positively, never
  by exclusion"). Applying it to how transcript files are selected for the exit run
  is exactly the over-generalisation OL-C7 names: "a statement Max makes about one
  specific thing … gets written down as a broader project rule than what he
  actually said". So the owner's words do not back the conclusion.
- G36's conclusion still stands on engineering grounds. The spec defines the
  exit-run population positively: "the owner's real repos and Claude Code
  transcripts". A rule that excludes known build-created patterns (`-tmp-*`)
  admits every build-created transcript whose name nobody anticipated, and a
  selection derived from the declared repositories does not. That is the same
  reason OWASP gives for preferring allowlists over denylists: "it is trivial …
  to bypass such filters". OWASP's context is attacker input, so here it is an
  analogy for the failure shape (unanticipated cases pass), not a governing
  standard. The governing source is the spec's own population. So "an inclusion
  rule" is the correct remedy, for the spec's reason, not OL-R5's.
- The PreToolUse item. The first auditor quotes the hooks reference as saying the
  context is included "in the next model request as a system note, so Claude can
  see why you allowed or modified the tool call". I fetched the page today
  (2026-09-28) and that sentence is not on it. The page may have changed since
  2026-09-26. Today's page supports the same conclusion in other words: PreToolUse
  `additionalContext` is "added to Claude's context alongside the tool result"
  and appears "next to the tool result". The conclusion (the model reads it after
  the tool call) holds. The quoted backing is not reproducible and must be
  replaced with today's wording and its fetch date.
- The record needs more than "no evidence". The smoke run says "every verb worked"
  and that `import` "refused an existing store until `--replace` was given". Both
  are true as far as they go. But the run never exercised the empty-source import
  (E-9 missed 1), so "every verb worked" overstates what was checked. The G34 entry
  names the stale-WAL hazard and not the empty-source one.
- Agreed at source: G32, G33, G34 and G35 are real, and G35 names the standard it
  violates (OL-10).

**Evidence:**
- OL-R5's scope: [[middleware/context-oracle/OWNER-LEDGER.md@HEAD:L60]] "Superseded by **OL-C5**; define the block positively, never by exclusion."
- OL-C7's over-generalisation rule: [[middleware/context-oracle/CLAUDE.md@HEAD:L28-L33]] "1. **Overgeneralization.** A statement Max makes about one specific thing, in specific context, gets written down as a broader project rule than what he actually said."
- G36's proposal: [[middleware/context-oracle/docs/implementation-log.md@59cc05c:L671-L674]] "**G36 — the exit run's leg 1 would count test transcripts.** It enumerates every `*.jsonl` under `~/.claude/projects/`, which includes probe and test-run transcripts (`-tmp-plan-probe-layout-*` and `-tmp-tmp-*` exist on this machine). It needs an exclusion rule for sessions the build itself created."
- The spec's population: [[middleware/context-oracle/docs/specs/spec-context-oracle.md@59cc05c:L753-L754]] "**Phase A is also the build's test bed.** It is run on the owner's real repos and Claude Code transcripts"
- The allowlist principle: [[https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html]] "It is a common mistake to use denylist validation in order to try to detect possibly dangerous characters and patterns like the apostrophe ' character, the string 1=1, or the <script> tag, but this is a massively flawed approach as it is trivial for an attacker to bypass such filters."
- The first auditor's hooks quote is absent today: [[ran]] `curl -sS https://code.claude.com/docs/en/hooks.md -o hooks.md; grep -n "system note\|can see why" hooks.md` (2026-09-28) → no output
- Today's wording: [[https://code.claude.com/docs/en/hooks.md]] "String added to Claude's context alongside the tool result. Ignored when `permissionDecision` is `\"defer\"`." and "[PreToolUse](#pretooluse), [PostToolUse](#posttooluse), [PostToolUseFailure](#posttoolusefailure), and [PostToolBatch](#posttoolbatch): next to the tool result"
- The item as written: [[middleware/context-oracle/docs/implementation-log.md@59cc05c:L675-L678]] "**Unverified — whispers on `PreToolUse`.** The skeleton delivers Warning and Consequence text through `additionalContext` on `PreToolUse`."
- The smoke-run claim: [[middleware/context-oracle/docs/implementation-log.md@59cc05c:L757-L759]] "Smoke run on a fresh repo: every verb worked, and `import` refused an existing store until `--replace` was given."

**Correct verdict:** replace. G32–G35 stand. G36's remedy becomes an inclusion rule
derived from the spec's population, with OL-R5 removed as its backing. The
PreToolUse answer is recorded with today's hooks-reference wording and its fetch
date. The record gets its commands and outputs, and "every verb worked" is limited
to the cases actually run.

### E-12
**Agree/Disagree:** Verdict: disagree (keep → replace). Reasoning: disagree with "neutral
wording edits that alter no assertion". Hunks h2 and h3 are neutral: a sentence join
and capitalisation, with every count and cell unchanged. Hunk h4 is not neutral.
- h4 removes an assertion. It deletes "security violations that fresh sessions
  catch without any rule". That clause was the paragraph's only reason why the
  plants could not tell the old and new instructions apart: a ceiling effect, where
  the plants are caught with or without the rule under test. After the edit the
  paragraph keeps the conclusion ("so the test needs cases of that kind") and the
  bare judgment "Those plants are blatant", with the reason gone. That is the
  context-stripping OL-C7 names: a verdict with its situational specifics removed.
- The removed clause was itself unbacked. The harness runs only two cells, `--old`
  and `--new`. There is no cell without any rule, so "catch without any rule" was
  never measured. So neither version is right. The before text asserted an
  unmeasured claim. The after text keeps the conclusion that depended on it and
  drops the claim without saying why.
- The first auditor's check covered only counts and cells ("all three cells and
  both counts are present"). That test cannot detect a removed reason.

**Evidence:**
- Before: [[middleware/context-oracle/docs/STATUS.md@256a446:L235-L238]] "Those plants are blatant security violations that fresh sessions catch without any rule. The failures that actually recur here are subtler: design flaws such as the AD-4 per-file-count flaw, a process that does not converge, and an owner rule that is wrong. The test needs cases of that kind, and several runs per cell."
- After: [[middleware/context-oracle/docs/STATUS.md@59cc05c:L234-L236]] "Those plants are blatant. The recurring failures are subtler (design flaws such as G3, a process that does not converge, a wrong owner rule), so the test needs cases of that kind and several runs per cell."
- The harness has only old and new cells: [[middleware/context-oracle/tools/planted_defect_test.py@256a446:L175]] "jobs = [(lbl, rev, c) for lbl, rev in ((\"old\", a.old), (\"new\", new)) for c in a.cases]"
- OL-C7's context-stripping rule: [[middleware/context-oracle/CLAUDE.md@HEAD:L34-L38]] "2. **Context-stripping.** A lesson, rule, or decision recorded with only a bare verdict (\"rejected,\" \"has no value,\" \"not a fix\") and no situational specifics"
- h2 and h3 are neutral: [[middleware/context-oracle/docs/STATUS.md@59cc05c:L226-L227]] "rewrite made no measurable difference: the old instructions caught 3 of 3 plants and the new ones 2 of 3."

**Correct verdict:** replace. Keep h2 and h3. Rewrite h4 to state the ceiling-effect
explanation as an untested hypothesis ("no cell without any rule was run"), or
drop both the explanation and the "blatant" judgment. This sits inside B1 E-16's
replacement of the same record.

### E-13
**Agree/Disagree:** Verdict: agree (keep). Reasoning: partly disagree. The review is
genuine and executed, and every source I re-checked says what it says it does. The
first auditor's closing claims go further than the evidence:
- "whose verdicts and decisions I could not fault at source";
- "No better alternative is on the table".

**What holds at source:**
- The summary table gives 27 hold, 9 partially hold (8 gaps plus the `PreToolUse`
  item), and 1 does not (G10). That totals 37: 36 gaps plus the one item. G23 and
  G29 share a row.
- The G10 stderr quote is on today's hooks page.
- The fork parent-id premise is still open: today's SessionStart section adds four
  fields for `resume`/`fork`, and none is a parent session id.

**The review missed defects this second opinion found at source.** A review does
not have to be exhaustive. But the review applies the phase-goal test itself
("output that looks more complete than it is"), and five of these fail that test.
None appears in G1–G36 or N1–N16:
- the parser's silent drop of a leading non-header field, against plan Step 13's
  explicit diagnostic (E-1);
- the zone marker regex matching "generated by" anywhere in the head (E-3);
- Orientation's `support: 3, ratio: 1`, which fills AD-14's undefined
  structural-fact confidence (E-5);
- the classifier's missing newline and `&` separators (E-5);
- `import` validating its source by creating it, so an empty database can replace
  a live store (E-9);
- the non-atomic two-file import (E-9);
- the fold header that claims to count corrections (E-9);
- the e2e whisper that passes the bar through three defects at once (E-7).

The first auditor wrote that "E-3, E-5, E-7, E-9 independently reached N1–N4, N6,
N9–N12, N15, N16". That is true, but it measures agreement with the review, not
completeness.

**The review contradicts itself once.** Its method line says "Every behavioral
claim below was checked by running the built code". N11 is labelled "reasoned from
code, not executed". The label is honest, and the first auditor credits it. But
the blanket method sentence is then false as written.

**Keep is still the correct verdict for this unit.** A review file is written once
and never edited (CLAUDE.md routing table). The unit on trial is whether this
review is a genuine, evidenced review whose findings were not silently dropped
within the batch. It is. The findings above are new items for the correction pass.
They are not defects in the file that the file could be changed to fix.

**Evidence:**
- Method sentence: [[middleware/context-oracle/docs/reviews/2026-09-25-skeleton-gap-list-review.md@ef016eb:L22-L23]] "**Method.** Every behavioral claim below was checked by running the built code"
- N11's label: [[middleware/context-oracle/docs/reviews/2026-09-25-skeleton-gap-list-review.md@ef016eb:L879-L880]] "**N11 — the `whisper_stats` fold can permanently skip rows.** *Evidence (reasoned from code, not executed — a timing race).*"
- The table rows, for example: [[middleware/context-oracle/docs/reviews/2026-09-25-skeleton-gap-list-review.md@ef016eb:L953]] "| G23 + G29 | hold |" and [[middleware/context-oracle/docs/reviews/2026-09-25-skeleton-gap-list-review.md@ef016eb:L966]] "| `PreToolUse` whisper | partially holds (timing) |"
- The review's G18 covers Coupling's constant but not Orientation's: [[middleware/context-oracle/docs/reviews/2026-09-25-skeleton-gap-list-review.md@ef016eb:L429-L432]] "In the skeleton, Coupling sets `blastRadius: 2` as a literal (`coupling.ts` line 120), so the read-context impact floor (≥ 2) always passes." [[ran]] `grep -n -i "support: 3\|ratio: 1\|generated by\|newline\|openStore(src)" review.md` (the file at `ef016eb`) → no output
- The G10 quote is live: [[https://code.claude.com/docs/en/hooks.md]] "Stderr from a hook that exits 0 goes to the debug log only, never the transcript, and Claude never sees it."
- No parent id on fork: [[https://code.claude.com/docs/en/hooks.md]] "When `source` is `\"resume\"` or `\"fork\"` and the transcript contains at least one response from Claude, SessionStart hooks also receive the four fields below." The four are `seconds_since_last_response`, `context_tokens`, `prompt_cache_likely_expired` and `estimated_cache_write_usd`.
- Unchanged since written: [[ran]] `git diff --stat ef016eb HEAD -- middleware/context-oracle/docs/reviews/2026-09-25-skeleton-gap-list-review.md` → empty, exit 0
- Written once: [[middleware/context-oracle/CLAUDE.md@HEAD:L76]] "| `docs/reviews/` | Review output, point-in-time | Output of a review? **Written once, never edited.** |"

**Correct verdict:** keep. The file stands as a point-in-time review. The defects it
missed, listed above, go to the correction pass as new items.

### E-14
**Agree/Disagree:** Verdict: agree (replace). Reasoning: mostly agree, with one
overstatement and one understatement. The spec-line finding is correct in
substance, but its cited backing cannot be reproduced and its scope is too
narrow.
- The counts are wrong, as the first auditor says. STATUS gives 24 / 7 / 1. The
  review's table gives 27 / 9 / 1 (re-counted in E-13).
- The next-steps rewrite (h2) is correct in shape.
- The open-items hunk (h3) contradicts itself: it calls the runtime pin settled,
  then leaves "Behaviour at the Node 22.16.0 engines floor is executed only by
  CI's matrix entry" under "still open". The CI runs exist, re-fetched below. The
  runs on `ef016eb` and `e20d001` themselves also passed.
- Overstated: the OL-R4 citation. The first auditor calls "OL-R4" a mis-citation
  because OL-R4 is "the generated-file block". It is imprecise, but not wrong. OL-R4
  is a rejected pre-emptive block. CLAUDE.md lists "no generated-file block
  `[OL-R4]`" under "No pre-emptive gate", and the review cites "OL-R4, OL-C2"
  together. The precise owner source for the rejected pre-emptive gate is OL-C2's
  "What he rejected is the **pre-emptive** gate". So the fix is to add OL-C2, not
  to replace a wrong citation.
- Understated: the trigger move. The first auditor calls "hazard warnings move to
  the moment the agent first reads or searches the file" an unsourced "new AD-15
  trigger decision". It is more than that: it contradicts the spec.
  - Spec FR-A2e defines Warning's trigger as "An edit in a landmine zone".
  - FR-A2a, citing D-26, says task-shape landmines "belong at the edit (FR-A2e)".
  - The review's own decision (c) keeps the edit trigger and changes only the
    framing.

  So STATUS, the file for state, announces a change to a spec requirement's
  trigger with no spec change and no review backing, while its next steps say
  only "verify the review's findings". That is the silent divergence CLAUDE.md's
  locked-decisions section forbids, carried out in a file that is not the spec's
  home.
- Spec-line finding, re-checked against the hooks reference fetched today
  (2026-09-28). Spec FR-O2/C-4 says a `PreToolUse` `additionalContext` is "injected
  before the tool runs". Today's reference says:
  - PreToolUse `additionalContext` is a "String added to Claude's context alongside
    the tool result";
  - the reminder appears "next to the tool result";
  - "Claude reads the reminder on the next model request".

  So the hook executes before the tool, but the text reaches the model with the
  tool's result, and the spec line is wrong in the respect that matters. The
  finding is correct.

  Two corrections to how the first auditor recorded it:
  - Its backing is E-10's quote ("in the next model request as a system note, so
    Claude can see why you allowed or modified the tool call"). That sentence is
    not on the page today. It must be replaced with today's wording. STATUS's own
    two quotes ("alongside the tool result", "Claude reads the reminder on the next
    model request") are both still on the page.
  - The finding's scope is too narrow. The same timing premise sits in FR-A2d's
    trigger ("An edit / write about to run") and in AC-1c ("On an edit about to
    run"). The Consequence whisper those lines describe reaches the model after
    the edit. The same spec line also claims the context is "preserved even if
    that tool call later fails" and "confirmed against the current hooks
    reference". Today's page says neither, so both claims are unverified.

  The kind is unchanged: an agent-written engineering claim about the harness,
  corrected as a factual correction in the spec pass, not an owner decision.

**Evidence:**
- The counts: [[middleware/context-oracle/docs/STATUS.md@ef016eb:L207]] "- **24 gaps hold,** several worse than logged:" and [[middleware/context-oracle/docs/STATUS.md@ef016eb:L215-L216]] "- **7 partially hold,** and **1 does not:** G10"
- The trigger move: [[middleware/context-oracle/docs/STATUS.md@ef016eb:L229-L232]] "Warning before an edit would take a deny, which is the pre-emptive gate already rejected (OL-R4). So hazard warnings move to the moment the agent first reads or searches the file, which comes before editing it."
- FR-A2e's trigger: [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ef016eb:L169]] "| **FR-A2e Warning ⚠** | An edit in a landmine zone |" and D-26: [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ef016eb:L165]] "Task-shape landmines are NOT delivered here — they belong at the edit (FR-A2e) `[D-26]`."
- The review keeps the edit trigger: [[middleware/context-oracle/docs/reviews/2026-09-25-skeleton-gap-list-review.md@ef016eb:L783-L786]] "(c) Write Warning and Consequence as facts about the edit just made (\"⚠ `x.ts`, just edited, was reverted in 2 commits: …\"), so the agent's next move — revise or proceed — is the decision it informs."
- OL-R4 is a rejected pre-emptive block: [[middleware/context-oracle/CLAUDE.md@HEAD:L174]] "- **No pre-emptive gate** — no deny before the agent has actually deviated, no" and OL-C2's wording: [[middleware/context-oracle/OWNER-LEDGER.md@HEAD:L68]] "What he rejected is the **pre-emptive** gate"
- The spec line: [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ef016eb:L477-L480]] "may return `additionalContext` **without** any `permissionDecision`, injected before the tool runs and preserved even if that tool call later fails — the passive-whisper affordance (confirmed against the current hooks reference and the Claude Code"
- The same premise in FR-A2d: [[middleware/context-oracle/docs/specs/spec-context-oracle.md@ef016eb:L168]] "| **FR-A2d Consequence** | An edit / write about to run |"
- Today's hooks reference: [[https://code.claude.com/docs/en/hooks.md]] "String added to Claude's context alongside the tool result." and [[https://code.claude.com/docs/en/hooks.md]] "Claude reads the reminder on the next model request, but it doesn't appear as a chat message in the interface."
- E-10's quote is absent today: [[ran]] `grep -n "system note\|can see why" hooks.md` on the 2026-09-28 fetch of `https://code.claude.com/docs/en/hooks.md` → no output
- The contradiction in h3: [[middleware/context-oracle/docs/STATUS.md@ef016eb:L266-L267]] "- **Runtime pin — settled 2026-09-26:** the ctxoracle suite passed in CI on Node 22.16.0 (the engines floor) and on 22.x. **Sandbox premise, still open:** Behaviour at the Node 22.16.0 engines floor is executed only by CI's"
- The CI runs: [[ran]] GitHub `actions_list` `list_workflow_runs` for `context-oracle-ctxoracle.yml` on branch `claude/context-oracle-vkho4p` → `59cc05c success 2026-09-25T23:56:46Z …/runs/36202952675`, `ef016eb success 2026-09-26T00:16:29Z …/runs/36204227408`, `e20d001 success 2026-09-26T00:16:39Z …/runs/36204239065` (and `f182589`, `0e457c7`, `58a3495`, `c45e0db` all `success`). Matrix: [[.github/workflows/context-oracle-ctxoracle.yml@ef016eb:L20]] "node-version: ['22.16.0', '22.x']"

**Correct verdict:** replace. In STATUS:
- use the review's counts (27/9/1);
- cite OL-C2 beside OL-R4;
- remove the trigger move, which contradicts FR-A2e and D-26 and has no review
  backing, or route it to the spec as an owner-visible requirement change with its
  evidence;
- cite the CI run and remove the contradiction in the open items.

Record the spec-line finding with today's hooks wording, widened to FR-A2d/AC-1c
and to the unverified "preserved even if that tool call later fails" and
"confirmed" claims.

