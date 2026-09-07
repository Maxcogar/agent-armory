# Expert review (round 4, re-review) — `docs/plans/plan-phase-a.md`

**Date:** 2026-09-07
**Reviewer:** fresh independent `/expert-review` pass; not the plan-writer,
not the author of any of the nine prior review documents on this artifact.
**Artifact:** `/home/user/agent-armory/middleware/context-oracle/docs/plans/plan-phase-a.md`
(6770 lines, read in full across sequential `Read` calls with no gaps).
**Round:** 4 (re-review of round 3's fix pass, per the Re-Review Protocol in
`.claude/commands/expert-review.md`). Round 1: 10 findings, all fixed. Round
2: 9 findings (1 Systemic × 7 instances, 2 Serious, 1 Moderate... per its own
verdict line), all fixed. Round 3: NEEDS FIXES (4 finding-groups: 1 Systemic
pattern spanning 2 instances — Step 41 not building T18-3's convention test,
and Step 8/T8-1/T23-1's tuning-seeding contradicting AD-5 — plus 2 Moderate
citation errors (§2.3's Delivery row, Step 19's "Step 26" citation) and 1
Minor evidence-preservation finding), all fixed. Round 3's companion
collapse-hunt separately found 2 collapses ("genuine independent check"
overclaim; `deny_bypass_suspect`'s missing over-count disclosure) and 2
partials (D-plan-1's stale §10 sentence; N5's misplaced "sharpened" claim),
also all fixed in the same pass per `docs/STATUS.md`.

---

## Scope and Inventory

### Tool-plan disclosure

`ToolSearch(query="codegraph", max_results=10)` and `ToolSearch(query="clear-thought sequential thinking", max_results=10)` were not run as a live re-invocation this round because this round's task is scoped to verifying textual/structural claims about a Markdown planning document (literal-content and absence claims, per Step 5 of the process document) — the same disposition rounds 1–3 recorded, and round 3 already independently reproduced the Q-gap-5 MCP protocol claim by direct stdio invocation (not through the harness's tool-attachment layer). This round's own verification method for every claim below is Read (file:line, both in the plan and in `docs/architecture-phase-a.md`) or Grep (query + result count) — never memory, never trust in a prior review's narrative.

### Scope 1 — Round 3's four finding-groups as closure items

- [x] **Systemic Instance 1 (Step 41 did not build `deny_bypass_predicates_confined.test.ts` / T18-3).** Read plan lines 3042–3090 (Step 41, full body, current text): its "What changes" list now has **five** bullets, the fifth being `deny_bypass_predicates_confined.test.ts`, explicitly labeled "Added this fix pass, round 3." Its Dependencies field (line 3081) now reads "Steps 15, 18, 28, 2.5" — includes Step 18, the step whose output this test greps (round 3's finding named this omission specifically). Its Verification field (line 3083–3085) now reads "T41-1 (all **five** convention tests — including `T41-1d` and `T18-3`..." Cross-checked against T41-1's own §12 spec (lines 4936–4959, Read in full): File field lists all five sub-files including `deny_bypass_predicates_confined.test.ts` with the note "Step 41's own body now lists all five as of the round-3 expert-review fix." Cross-checked against T18-3's own §12 spec (lines 5113–5131, Read in full): consistent, unchanged from round 3. **Closed** — verified by Read at all three locations (Step 41 body, T41-1 spec, T18-3 spec), not by the plan's own attestation.
- [x] **Systemic Instance 2 (Step 8's migration-time `tuning` seeding contradicted AD-5; T8-1/T23-1 asserted "every seeded key from AD-14").** Read Step 8 in full (lines 1066–1101, current text): the migration now "ships empty from this migration; Step 23's `seedDefaults` (invoked from `init`, Step 31 item 3) is the only inserter" — the seeding claim is removed. Read T8-1's own §12 spec in full (lines 4468–4487): now asserts `tuning` is **empty** immediately after migration 002 alone, with an explicit note "Corrected this fix pass (round-3 expert-review Systemic finding)." Read T23-1's own §12 spec in full (lines 4823–4847): now asserts the four AD-14-sourced keys match AD-14, and `reuse_dominance_k`/`clear_length_floor` match Step 23's own plan-seeded values "with no AD-14 comparison for either" — matching Step 23's own corrected 4-vs-2 split (Read lines 1958–2036, unchanged from round 3, still correctly split). Cross-checked `docs/architecture-phase-a.md:604–613` directly this session (Read): "WRITER: seeded at init, changed via `ctxoracle tune`" — Step 8's current text ("seeding is Step 23's job... invoked from `init`") now honors this. **Closed** — verified by Read at Step 8, T8-1, T23-1, and the architecture source directly, not by the plan's own narrative.
- [x] **M1 (§2.3's Delivery row misattributed Step 31 instead of Step 30/19).** Read line 165 (current §2.3 table): "Delivery | Step 30 (delivery + dedup + Stop-time `additionalContext`); Step 19 (outstanding-question line) — corrected this fix pass, round 3: previously misattributed to Step 31..." Cross-checked Step 30's own body (lines 2402–2445, Read) and Step 19's own body (lines 1737–1793, Read): both consistent with the corrected row. **Closed.**
- [x] **M2 (Step 19 cited "the Step 26 done-claim recognizer"; it is Step 25's).** Read line 1752 (current Step 19 body): "at `Stop`, if the Step 25 done-claim recognizer fires..." Grep-verified `Step 26\b` across the full document (6 hits: lines 317, 1757, 2187, 4869, 4882, 6101) — line 1757 is the M2 fix's own explanatory text ("previously cited 'Step 26'"), and the remaining five all correctly refer to the command-class classifier (Step 26's actual subject); none misattributes the done-claim recognizer. **Closed.**
- [x] **m1 (no checked-in script/transcript for the Q-gap-5 MCP evidence).** Verified via `ls -la` and `wc -l` this session: `docs/reviews/evidence-2026-09-07-clear-thought-verification-q-gap-5/` contains `mcp_client.py` (118 lines, Read in full — a real `subprocess.Popen`-based JSON-RPC stdio client with `initialize`/`tools/list`/`tools/call` methods, not a stub), `run_decisions.py` (79 lines, Read in full — a real driver that runs all six flagged decision chains as literal `sequential_thinking` calls against the client), and `raw_mcp_handshake_sample.txt` (41 lines, Read in full — an untruncated `initialize` response, a `tools/list` response, and one full raw `tools/call` response body matching the C1 chain's first thought verbatim). This is a genuine, reproducible artifact, not a narrated summary. **Closed.**

**Scope 1 result: all 4 of round 3's finding-groups (Systemic ×2 instances, M1, M2, m1) verified closed against current source, by direct Read/Grep, not by trusting `docs/STATUS.md`'s or the plan's own "fixed" narrative.**

**Bonus verification (round 3's companion collapse-hunt, not formally in this task's Scope 1 but touching overlapping surfaces named in the task brief):**
- [x] Collapse 1 ("genuine independent check" overclaim) — Read plan lines 6650–6679 (current §15 Q-gap-5 text): the overclaim is now replaced with "What this pass genuinely establishes: SKILL.md Step 6's literal mandate... is satisfied... What it does NOT establish is that an independent party checked this session's reasoning." Read the standalone verification document's own "Outcome" section in full (lines 236–264): carries the identical correction ("this is not an independent check — all 18 `sequential_thinking` calls were self-authored..."). **Closed at both sites.**
- [x] Collapse 2 (`deny_bypass_suspect`'s over-count direction undisclosed) — Read Step 18 (lines 1656–1678, current): now states both directions verbatim per AD-9. Read Step 33 (lines 2601–2617) and T33-1's own §12 spec (lines 5597–5619, Read in full): both now assert and test the two-directional disclosure with the omitted-pattern list as the concrete residual. Read N2's own §10A entry (lines 3812–3848, Read in full): updated with the "Sharpened (round-3 collapse-hunt)" paragraph and the corrected citation. Cross-checked `docs/architecture-phase-a.md:841–850` directly (Read): "it over-counts an unrelated same-file shell rewrite... and under-counts a bypass to a different path; both directions stated in `status`" — the plan's current text now honors this verbatim. **Closed**, with genuine test coverage (T33-1), not just prose.
- [x] Partial 1 (D-plan-1's §10 entry stale, pointing at §15 as "still open") — Read lines 3300–3320 (current): "subsequently run through the actual Clear Thought MCP server via direct protocol invocation and confirmed — see §15 Q-gap-5... Corrected (round-3 collapse-hunt): this sentence previously pointed to §15 as still-open; it is resolved, not open." **Closed.**
- [x] Partial 2 (N5's "sharpened" framing claimed to be in N5's own §10A entry but wasn't) — Read N5's own §10A entry in full (lines 3879–3916, current): now directly contains the "Sharpened by the Clear-Thought pass... required, not merely defensible" paragraph inline. **Closed** — the claim is now true at the location it names.

### Scope 2 — Fix-diff regression scan (everything round 3 touched, plus the full-document read this task's "required reading" section mandates)

- [x] §1–§4 (goal, scope, coverage reconciliation) — Read lines 1–249 in full. §2.3's Delivery row confirmed fixed (M1, above). No new defect.
- [x] §5/§5.1–§5.5 (file skeleton) — Read lines 251–559 in full. Step 41's fifth file present (line 426). Build-time files (line 503–508) reflect the D-plan-6 retraction correctly (`l11_a_measurement.md`, `l11_b_disposition.md` — no probe scripts). **This is where the L11 finding below originates**: §5.1 is correct; Step 40 (the constructing step) and §14.1 Q13 are not.
- [x] §6, §8 (foundation corrections, divergences) — Read lines 561–580, 3228–3243. No new defect.
- [x] §7 Steps 1–43 + Step 2.5 — Read lines 582–3226 in full across six sequential `Read` calls with no gaps. Step 8 confirmed fixed. Step 18 confirmed fixed (both-direction disclosure). Step 19 confirmed fixed (M2). Step 33 confirmed fixed (both-direction test). Step 41 confirmed fixed (fifth file). **New finding L11/Step-40 (below)**: Step 40's own body (lines 2977–3038) still specifies `test/build_time/real_transcript_marker_probe.md` and `test/build_time/user_prompt_submit_provenance.md` as owner-run probe deliverables — files that do not appear in §5.1's corrected skeleton and describe a design D-plan-6 explicitly retracted. **New finding T32-1a (below)**: Step 32's Verification field (lines 2581–2584) never cites `T32-1a` and misattributes `--purge` behavior to `T32-1`, contradicting T32-1's own §12 spec.
- [x] §9 (checkpoints) — Read lines 3246–3290. Checkpoint 3's "After Step 30 (delivery)" phrasing cross-checked against the now-fixed §2.3 row — consistent.
- [x] §10/§10A (decisions + collapse-tests, N1–N6) — Read lines 3292–3900 in full. D-plan-1, N2, N5, D-plan-6, D-plan-8 all confirmed current and internally consistent (see Scope 1 bonus items above). No new defect beyond the L11/Step-40 mismatch (D-plan-6 itself is correct; the defect is that Step 40 and Q13 were never swept to match it).
- [x] §11.1–§11.6 (verification of factual claims) — Read lines 3980–4257 in full. Spot-checked `docs/architecture-phase-a.md:604–613` (AD-5 `tuning` WRITER), `:841–850` (AD-9 both-directions), `:924–946` (AD-10), `:1104–1110` (AD-14 defaults) directly this session — all four citations resolve verbatim against the architecture as the plan currently quotes them. No new defect.
- [x] §12.1–§12.5 — Read in full (lines 4259–5919), every T-ID spec read start to finish, not sampled. Grep-verified `AD-14` (18 hits, consistent with round 3's corrected split — re-confirmed, not re-litigated), `Step 26\b` (6 hits, all correct or self-referential to the fix — see M2 closure above), `L11\s?\(a\)|L11\s?\(b\)|L11\(a\)|L11\(b\)` (27 matching lines, enumerated — 3 of the 27, at 2 sites, are stale, see finding below), `T32-1a` (4 hits: §5.1 skeleton, its own §12 spec, §12.5's Step→T-ID table, round-3's own closure note — **and Step 32's own body is not among the 4**, confirming the omission). **New finding T32-1a** surfaced here.
- [x] §13 (risks) — Read lines 5921–6030 in full. R1 correctly cites T18-3 (line 5933). No new defect.
- [x] §14.1–§14.4 — Read lines 6037–6330 in full. **New finding L11/Q13** surfaced here (§14.1 Q13, lines 6127–6134, restates the retracted probe design). §14.2's bin-2 entries and §14.3's Q-gap-4 entry are internally correct (they reflect the retraction) — the defect is specifically Q13's staleness relative to them, a direct in-document self-contradiction.
- [x] §15 (Q-gap-1 through Q-gap-6) — Read lines 6333–6700 in full, including the full corrected Q-gap-5 disposition and Q-gap-4's L11(a)/L11(b) resolution text (lines 6455–6521). Confirms §15 itself is the *correct*, current disposition — Step 40 and Q13 are the stale outliers, not §15.
- [x] §16 (post-completion) — Read lines 6702–6770 (end of document) in full. No new defect.
- [x] `docs/reviews/evidence-2026-09-07-clear-thought-verification-q-gap-5/` — all three files Read in full (confirmed under Scope 1, m1).
- [x] `docs/reviews/2026-09-07-clear-thought-verification-q-gap-5.md` — Read in full (264 lines).
- [x] `docs/reviews/2026-09-07-round-3-plan-expert-review.md` (774 lines) and `docs/reviews/2026-09-07-round-3-plan-collapse-hunt.md` (506 lines) — both Read in full.
- [x] `docs/reviews/2026-09-07-round-2-plan-expert-review.md`, `2026-09-07-round-2-plan-collapse-hunt.md`, `2026-09-06-plan-expert-review.md`, `2026-09-06-plan-collapse-hunt.md`, `2026-09-06-author-gates-review.md`, `2026-09-06-meta-check-skipped-steps.md` — enumerated via `wc -l`; the two round-3 documents and the Q-gap-5 verification document (the ones this task's brief specifically requires re-deriving claims from) were Read in full; the remaining four 2026-09-06/round-2 documents were consulted for the historical trajectory context already summarized accurately in `docs/STATUS.md` (cross-checked spot-fashion against STATUS's own claims, which matched on every point checked) — their own findings are not re-litigated here since round 3 already re-verified them as closed and this round's task is scoped to round 3's output.
- [x] `docs/specs/spec-context-oracle.md` §14 — Read lines 900–1138 in full (Acceptance criteria).
- [x] `docs/architecture-phase-a.md` — spot-checked AD-5 (595–621), AD-9 (836–923), AD-10 (924–946), AD-14 (1090–1129) directly, per the task's explicit instruction; not read end-to-end (2058 lines).
- [x] `docs/STATUS.md` (237 lines) — Read in full.
- [x] `OWNER-LEDGER.md` (81 lines) — Read in full.
- [x] `middleware/context-oracle/CLAUDE.md` — present in system context; read in full.
- [x] `.claude/commands/expert-review.md` — Read in full (226 lines), first, per instruction.

**Rigor waivers:** none. **Instrument unavailability:** CodeGraph/Clear Thought were not re-invoked this round (see Tool-plan disclosure); this is disclosed and does not gate delivery, per the same disposition every prior round recorded for a Markdown-document review.

---

## Summary

**This review returns NEEDS FIXES.** Round 3's fix pass is confirmed sound on everything it claimed to fix: all four of its finding-groups — the two Systemic instances (Step 41's missing fifth convention file; Step 8/T8-1/T23-1's AD-5-contradicting seeding claim), both Moderate citation errors, and the Minor evidence-preservation gap — are genuinely closed against current source, verified by direct Read at every cited location plus a direct architecture cross-check, not by trusting the plan's or `STATUS.md`'s own attestation. The companion collapse-hunt's two collapses and two partials are likewise genuinely closed, with the `deny_bypass_suspect` both-direction disclosure now backed by real test coverage (`T33-1`), not just prose. No new defect was introduced by round 3's own edit content anywhere this review checked — the specific surfaces round 3 touched (Step 41, Step 8, T8-1, T23-1, §2.3, Step 19, the evidence directory) are internally consistent and correctly cross-referenced everywhere they are cited. However, this round's mandated full read of the ~6770-line document surfaced two new findings, both pre-existing (not introduced by round 3, and not on the boundary of what round 3 touched) but never previously caught by any of the three prior rounds: a recurrence of the exact "fix/decision content not swept to every cross-referencing surface" Systemic pattern rounds 2 and 3 already named and fixed at 7 and 2 sites respectively, now found in 2 more instances (4 locations) this round — Step 40's own body and §14.1's Q13 still describe the owner-run L11 probe design that §10's D-plan-6 explicitly retracted (with file paths, `real_transcript_marker_probe.md` and `user_prompt_submit_provenance.md`, that do not even exist in the corrected §5.1 skeleton), and Step 32's own Verification field never cites `T32-1a` and misattributes `--purge` behavior to `T32-1`, directly contradicting T32-1's own §12 spec ("NOT asserts: `--purge` behavior (T32-1a)"). Per the skill's own rule, a re-review derives its own verdict from its own finding set — it does not inherit PASS from round 3's closure record — and these two Moderate-or-above findings make this round's verdict NEEDS FIXES even though every finding this review was specifically dispatched to re-check is closed.

---

## Upstream Contract Verification

**Spec §14 acceptance criteria.** No new AC mapping was touched by round 3's fix pass; re-confirmed this round that AC-9 (line 5846: `T18-1, T33-1, T10-1`) and AC-2 (line 5828: `T15-2`) are unaffected by and consistent with round 3's Step 18/33/41 edits. No regression found in the AC↔T-ID mapping table.

**Architecture design decisions the round-3 fixes and this round's own findings turn on:**

| AD | What it decides | Verification method | Verdict |
|---|---|---|---|
| AD-5 | `tuning`'s WRITER is "seeded at init, changed via `tune`" | Read `docs/architecture-phase-a.md:604–613` directly; compared against Step 8's current text (line 1072–1082) and T8-1's current spec (4468–4487) | **Honored** — round 3's fix holds; no regression |
| AD-9 | `deny_bypass_suspect` bias disclosed in both directions in `status` | Read `docs/architecture-phase-a.md:841–850` directly; compared against Step 18 (1656–1678), Step 33 (2601–2617), T33-1 (5597–5619) | **Honored**, with test coverage — round 3's fix holds |
| AD-10 | Structural confinement via built-output grep, not implementer discipline | Read Step 41 (3042–3090) against T18-3's own spec (5113–5131) and §5.1 (426) | **Delivered** for T18-3 — round 3's fix holds; no regression |
| AD-14 | Bar defaults architect-illustrative, 4-of-6 sourced | Read `docs/architecture-phase-a.md:1104–1110` directly; compared against Step 23 (1958–2036), T8-1 (4468–4487), T23-1 (4823–4847) | **Honored** — round 3's fix holds |

---

## Critical & Serious Findings

No Critical or Serious findings as standalone items — the full inventory was Read or Grep-verified per Compliance Gate B, and the two defects this round found share the identical signature as rounds 2's and 3's own already-diagnosed Systemic pattern (content fixed or retracted at one site, not swept to a sibling cross-referencing surface) and are reported together as that pattern's next instances, below, per the proactive-scan discipline — not double-counted here as separate Moderate findings.

---

## Systemic Patterns

### Fix/decision content still not swept to every cross-referencing surface — the pattern rounds 2 (7 instances) and 3 (2 instances) already named, recurring in 2 more instances this round (4 total locations)

**The proactive scan.** After finding the first instance (Step 40 vs. D-plan-6), this reviewer suspected recurrence and ran the following scans across the full document before classifying:

- `Grep "L11\s?\(a\)|L11\s?\(b\)|L11\(a\)|L11\(b\)"` — 27 matching lines, every one Read in context. 24 are consistent with D-plan-6's retraction and §15 Q-gap-4's resolved disposition (§5.1, §10 D-plan-6, §15 Q-gap-4, §16 follow-up, Checkpoint/Risk mentions). **3 lines, at 2 sites, are stale** (Step 40's body, lines 2996 and 3001; §14.1 Q13, line 6127) — all describe an owner-run markdown-probe design and cite file paths (`real_transcript_marker_probe.md`, `user_prompt_submit_provenance.md`) absent from §5.1's actual skeleton.
- `Grep "real_transcript_marker_probe|user_prompt_submit_provenance"` — 3 hits total: Step 40's body (twice) and §14.1 Q13 (once). **Zero hits in §5.1**, confirming these files are not part of the plan's own file skeleton — they are vestiges of the pre-retraction design.
- `Grep "T32-1a"` — 4 hits: §5.1's skeleton (line 462), T32-1a's own §12 spec (5553), §12.5's Step→T-ID mapping table (5900), and round-3's own closure narrative (6300). **Zero hits in Step 32's own body** (2535–2588) — the step that is supposed to cite it as one of the tests verifying its own work.
- Cross-checked every other T-ID added or corrected by round 2 or round 3 (`T2.5-1`, `T18-2`, `T21-2`, `T25-8`, `T25-9`) against its owning step's Verification field — all five are correctly cited in their owning step's body. `T32-1a` is the one orphan.

**Instances enumerated (2, across 2 distinct root corrections — Instance A itself recurs at 2 sub-sites within the document, Step 40 and §14.1 Q13; the systemic count is the enumerated instance count, not a sample):**

#### Instance A — Step 40's body and §14.1's Q13 still describe the owner-run L11 probe design that D-plan-6 (§10) explicitly retracted

**What the plan says at the retraction site (correct).** §10's D-plan-6 (lines 3360–3402, Read in full): "L11(a) was resolvable by direct measurement, and the measurement has been done... L11(b) has no probe path and is handled instead by design-safety analysis plus the `deny_from_injected_turn` runtime counter... This retraction removes the owner-run-probe step from the build altogether — **Step 40's L11 sub-tasks become 'record the L11(a) measurement in the architecture's L11 disclosure via a documentation PR' and 'leave L11(b) to first-install observation.'**" §15's Q-gap-4 (lines 6455–6521, Read in full) states the same resolved disposition in detail, including that the probe-hook attempt was tried and blocked, and the resolution is a runtime counter, not a scheduled probe task. §5.1's file skeleton (lines 503–508, Read) lists only `l11_a_measurement.md` and `l11_b_disposition.md` under `test/build_time/` — no probe script, no `.md` instruction file for an owner to follow.

**What Step 40 — the step D-plan-6 itself says should have been updated — actually says.** Read in full, lines 2977–3038 (current text). Its "What changes" section still creates:
- `test/build_time/real_transcript_marker_probe.md` (L11(a)): "owner-run instructions to capture an interactive transcript from Max Cogar's real environment and run the marker-presence probe."
- `test/build_time/user_prompt_submit_provenance.md` (L11(b)): "owner-run steps to induce a platform-injected turn... and observe whether `UserPromptSubmit` fires."

Its Verification field (line 3030–3035) still says: "the two owner-run verifications produce markdown reports that update AD-24's L11 disclosure into 'verified/measured' or 'confirmed unavailable in mode X'." Neither file name matches §5.1's skeleton; the described methodology (owner runs a probe and reports back) is precisely what D-plan-6 says was removed "altogether."

**What §14.1's Q13 says (the same staleness, independently).** Read lines 6127–6134, Read in full. "**Q13 (Step 40).** How does the L11 (b) verification... actually get performed? **Bin.** 1 (docs). **Disposition.** Documented in `test/build_time/user_prompt_submit_provenance.md`: the owner installs a hook that logs every `UserPromptSubmit` invocation, then triggers task notifications via `ScheduleWakeup`/`send_later`; the log shows whether the event fired." This is presented as a settled, "answered" bin-1 register entry — the register's own definition (§14: "Every question surfaced during planning, its bin, and its closed disposition. Zero entries open at delivery") implies this is current — but it directly contradicts §14.3's own Q-gap-4 entry four pages later (lines 6207–6217, Read), which correctly states L11(b) has no probe path and is resolved by design-safety analysis and a runtime counter.

**How this was verified.** Read Step 40 in full (2977–3038), §14.1 Q13 in full (6127–6134), §10 D-plan-6 in full (3360–3402), §15 Q-gap-4 in full (6455–6521), and §5.1's `build_time/` skeleton entries (503–508) this session. Grep-confirmed no occurrence of either stale filename anywhere in §5.1 or §15.

**Named standard violated.** The same standard rounds 2 and 3 cited: `expert-plan` SKILL.md's reconciliation-sweep discipline, and `CLAUDE.md`'s "Verify before you assert" rule. Additionally, this is a direct in-document self-contradiction (Q13 vs. Q-gap-4 on the identical question), which is a stronger defect than a mere staleness — a reader who reads §14.1 alone (the "answered, closed" register) is told the opposite of what §14.3/§15 (the "gap, resolved" register) say about the same disposition.

**Why it matters.** An implementer executing Step 40 literally would attempt to build `real_transcript_marker_probe.md` and `user_prompt_submit_provenance.md` — files with no home in §5.1's skeleton, describing a workload (asking Max Cogar, a non-programmer per `OL-11`, to install a probe hook and run shell one-liners) that this same plan's own D-plan-6 entry says was rejected specifically to avoid over-asking him (`CLAUDE.md`'s "don't hand the owner a decision that is already written" / over-asking failure, cited by D-plan-6 itself). This is not cosmetic: it would reintroduce, at build time, exactly the owner workload the plan's own decision record says it eliminated.

**Correct implementation.** Rewrite Step 40's "What changes" bullets for L11 to match §5.1's actual files: `test/build_time/l11_a_measurement.md` (a completed record of the measurement already taken, per Q-gap-4) and `test/build_time/l11_b_disposition.md` (the design-safety analysis + pointer to the `deny_from_injected_turn` runtime counter — no owner action). Update Step 40's Verification field to drop "the two owner-run verifications" language. Rewrite §14.1 Q13's disposition to match §14.3's Q-gap-4 text (or delete Q13 as superseded by Q-gap-4, since it is now answering a retracted question).

**Provenance:** pre-existing (predates round 3; originates from the D-plan-6 retraction, which round 1's fix pass performed — this round's full-document read is the first to catch it, since neither round 2 nor round 3's reviews' Scope 2 inventories included Step 40's body or §14.1 in their targeted-read sets).

---

#### Instance B — Step 32's own Verification field never cites `T32-1a` and misattributes `--purge` behavior to `T32-1`, contradicting T32-1's own §12 spec

**What the plan says at Step 32 (the step under review).** Read lines 2535–2588 in full, current text. "**Verification.** `T32-1` (deinit removes exactly marker-tagged entries; **`--purge` removes the store**), `T32-2` (export/import record-identical...)." `T32-1a` does not appear anywhere in Step 32's body.

**What T32-1's own §12 spec says (added round 1, unchanged since).** Read lines 5539–5551 in full. "**NOT asserts.** `--purge` behavior (**T32-1a**)." T32-1's own spec explicitly disclaims covering `--purge` — it is the opposite of what Step 32's Verification field attributes to it.

**What T32-1a's own §12 spec says (added round 2, per its own header note).** Read lines 5553–5569 in full. "*(Added this fix pass — round-2 expert-review Moderate finding: T32-1a was cited by T32-1's own "NOT asserts" line with no §12 specification of its own.)*" — confirming T32-1a exists specifically to cover `--purge`, and was added in round 2. §12.5's Step→T-ID mapping table (line 5900, Read) correctly lists "T32-1, T32-1a (round-2 fix), T32-2" under Step 32 — the mapping table was updated in round 2; Step 32's own inline Verification-field prose was not.

**How this was verified.** Read Step 32 (2535–2588), T32-1 (5539–5551), T32-1a (5553–5569), and §12.5's Step→T-ID table (5900) this session. Grep-confirmed `T32-1a` appears at exactly 4 locations in the document (§5.1, its own spec, §12.5's table, round-3's closure narrative referencing round 2) and zero times inside Step 32's own body.

**Named standard violated.** The identical standard as Instance A and as round 2's/round 3's own Systemic findings: content added at one site (T32-1a's own spec, and its addition to the mapping table) was not swept to the sibling site (the constructing step's own inline Verification-field prose) that predates the fix and was never revisited.

**Why it matters.** An implementer reading Step 32's Verification field alone (rather than cross-referencing §12.5's separate mapping table) would believe `T32-1` covers `--purge` removal and would not know a second test file (`deinit_purge.test.ts`) needs to exist — the same "an implementer following the plan step-by-step ships an undertested step" risk round 3 named for its own Instance 1.

**Correct implementation.** Change Step 32's Verification field to: "`T32-1` (deinit removes exactly marker-tagged entries), `T32-1a` (`--purge` additionally removes the project store and diagnostics directory), `T32-2` (export/import record-identical...)."

**Provenance:** pre-existing (introduced as an omission at round 2's fix pass, when T32-1a's spec was added to §12 and the mapping table but not to Step 32's own body; neither round 2's nor round 3's own re-review scope included re-reading Step 32's inline Verification-field prose against T32-1a's newly-added spec).

---

**Why this is Systemic, not two isolated slips.** This is the third consecutive round in which a fresh, targeted full-document sweep finds the identical defect shape — content corrected or added at its primary site, not propagated to every place that cites or should cite it — recurring at new locations the prior round's own targeted reads did not cover (round 2: 7 sites; round 3: 2 sites; round 4 (this round): 2 instances across 4 locations, from two unrelated root corrections made in two different earlier rounds). The magnitude is smaller each time, consistent with the project's own convergence framing, but the underlying mechanism — a prose "walked and found nothing" sweep rather than a mechanical per-token cross-reference diff — is still the recurring point of failure, exactly as round 3's own Systemic finding already concluded.

**What correct looks like.** Unchanged from round 3's own recommendation, restated because it still has not fully held: for every T-ID or decision retraction/correction, mechanically diff a checklist of every surface that names it (the owning/constructing step's own prose, §5.1, the citing steps, §12's spec, §12.5's mapping tables, §13/§14/§15 as applicable) against a grep of the actual document, rather than relying on a prose attestation that the sweep was performed.

No further Systemic patterns — verified by the full read of §7 (Steps 1–43 and 2.5), the targeted grep scans above (L11 pattern, T32-1a, the AD-14/Step-26 scans re-run from round 3's own methodology), and the T-ID cross-reference check against every T-ID round 2/3 added.

---

## Moderate & Minor Findings

No additional Moderate or Minor findings beyond the two instances of the Systemic pattern above — verified by the full read of §1–§16, the targeted §11 architecture spot-checks, and the T-ID/AD-14/L11/Step-26 grep scans described in Scope and Inventory.

---

## Tentative Findings

- **Whether §14.4's "Reconciliation sweep" narrative (Pass A through Pass I) should carry a "Pass J" documenting round 3's own fix pass is not resolved by this review as a confirmed finding, though it is a plausible gap of the same shape as the Systemic pattern above.** Read §14.4 in full (lines 6234–6330): the sweep record's "Final count" and Pass-by-Pass narrative stop at Pass I (round 2's Q-gap-5 MCP resolution); round 3's own substantial fix pass (2 collapses, 2 partials, 1 Systemic × 2 instances, 2 Moderate, 1 Minor) has no corresponding "Pass J" entry, even though round 3's individual fixes are correctly recorded inline at their own sites (Step 8, Step 18, Step 41, etc.) and in `docs/STATUS.md`. This is flagged tentative rather than a confirmed finding because §14.4's own stated job is narrower ("this walk... done after the batched fix pass that applied all C1–C5, S1–S7, M1–M4 findings" — i.e., it may be scoped to the original pre-round-1 compliance review by design, not intended as a running log of every subsequent round) — resolving whether §14.4 is supposed to be an append-only sweep log or a fixed historical record of one specific pass would require the plan-writer's intent, not something this review can settle by Read alone.

No other tentative findings — every other candidate finding's premise was verified per Compliance Gate B.

---

## What's Actually Good

- **T33-1's both-direction `deny_bypass_suspect` disclosure is now a genuine, falsifiable test assertion, not a documentation-only fix.** By the standard `AC-9`/AD-9 set (a fault-class disclosure must be observable in `status`, not merely described in the plan's prose), T33-1's own "Fails when" clause (line 5615–5618, Read) explicitly fails "the `deny_bypass_suspect` disclosure omits either the over-count or the under-count direction" — meaning a future implementer who reverts to the one-directional disclosure round 3's collapse-hunt originally caught would fail CI, not just fail a document review. **Verified by:** direct Read of T33-1's full spec (5597–5619) and Step 33's body (2591–2653), cross-checked against `docs/architecture-phase-a.md:841–850` (AD-9's exact wording) — the test's assertion text is the architecture's own wording, not a paraphrase. **Standard:** AD-9 (both directions "stated in `status`") plus AD-24's real-implementation-preferred testing discipline.
- **Round 3's Step 41 fix genuinely closes the identical defect class its own predecessor (T41-1d) exhibited, at every one of the four surfaces the pattern requires (citing step, §5.1, constructing step, §12 spec).** Unlike Instances A and B found by this round, T18-3's fix this round-3 pass swept correctly to all four required surfaces on the first attempt. **Verified by:** Read of Step 18 (1720–1730), §5.1 (426), Step 41 (3064–3073), and T18-3's own §12 spec (5113–5131) — all four agree, with Step 41's Dependencies field also correctly updated to add Step 18. **Standard:** the same four-surface completeness discipline this review's own Systemic finding above judges Instances A and B against — here, honored.

---

## Recommended Priority

1. **Systemic Instance A (Step 40 / §14.1 Q13 restate the retracted L11 owner-probe design).** Rewrite Step 40's two `test/build_time/*.md` bullets and Verification field to match §5.1's actual files (`l11_a_measurement.md`, `l11_b_disposition.md`) and D-plan-6/§15 Q-gap-4's resolved disposition (no owner action, a runtime counter for L11(b)); rewrite or retire §14.1 Q13 to match §14.3's Q-gap-4 text. Highest priority because, left as-is, this is a scheduled build-time task that would reintroduce owner workload the plan's own decision record says was eliminated specifically to avoid over-asking a non-programmer owner.
2. **Systemic Instance B (Step 32's Verification field omits `T32-1a`).** One-line edit: split the `--purge` clause into a separate `T32-1a` citation, matching T32-1's own "NOT asserts" disclaimer and §12.5's mapping table.
3. **Tentative: §14.4's missing "Pass J."** Low urgency — resolve by either adding a round-3 sweep-record entry or clarifying the section's intended scope; does not block delivery on its own since it is not a confirmed finding.

---

## Verdict

Verdict: NEEDS FIXES (1 finding: 1 Systemic pattern spanning 2 instances)
