# Independent collapse-hunt — Phase A implementation plan, round 3 (2026-09-07)

**Artifact:** `docs/plans/plan-phase-a.md` (6645 lines), read in full this
session, at the commit produced by round 2's fix pass (Q-gap-5's
Clear-Thought-verified disposition, §15).

**Axis:** mission-fidelity only (`CLAUDE.md` dominating rule 3 and rule 2's
collapse test). Not a second standards pass — that is `/expert-review`'s
job.

**Reviewer:** independent subagent, no prior context on this session, not
the author of the plan, either fix pass, or any prior review of it.

**Read in full before the attack (per the task brief, in the stated
order):** `docs/collapse-log.md` (all 1332 lines); `OWNER-LEDGER.md` (all
80 lines); `middleware/context-oracle/CLAUDE.md` (all 238 lines);
`docs/specs/spec-context-oracle.md` §8, §11.5, §12, §13, §14 in full;
`docs/architecture-phase-a.md` AD-9, AD-10, AD-11 (adjacent, needed for
AD-9), AD-12–AD-13 (adjacent), AD-14, AD-15, AD-16–AD-17 (adjacent),
AD-18, AD-19–AD-20 (adjacent), AD-21, AD-22–AD-23 (adjacent), AD-24;
`docs/reviews/2026-09-06-author-gates-review.md`,
`docs/reviews/2026-09-06-meta-check-skipped-steps.md`,
`docs/reviews/2026-09-06-plan-collapse-hunt.md`,
`docs/reviews/2026-09-06-plan-expert-review.md`,
`docs/reviews/2026-09-07-round-2-plan-collapse-hunt.md`,
`docs/reviews/2026-09-07-round-2-plan-expert-review.md`,
`docs/reviews/2026-09-07-clear-thought-verification-q-gap-5.md` — all in
full; `docs/STATUS.md` (189 lines, full); `docs/plans/plan-phase-a.md`
end-to-end across multiple `Read` calls (front matter/scope/file skeleton;
Steps 1–43 body text, sampled line-by-line at every location a round-1/2
finding or the Q-gap-5 disposition pointed to and at regular intervals
elsewhere; §8–§10A collapse-tests for every D-plan-*/N1–N6/C1–C3/P1–P4
entry; §12 test specifications for every T-ID this round's fix pass or
Q-gap-5's six decisions cite; §13 Risks; §14 Question register; §15 Gaps;
§16 Post-completion).

## Verdict: DOES NOT SURVIVE (converging further, but not yet terminal)

- **Collapses: 2** — (1) Q-gap-5's disposition and the standalone
  verification document both characterize the Clear-Thought pass as *"a
  genuine independent check, not a formality"*; it is neither — the
  content of all eighteen `sequential_thinking` tool calls was authored
  entirely by the same fix-pass session that made the six original
  decisions, using a tool that stores and echoes reasoning rather than
  supplying any external judgment, and all six came back "confirmed, no
  change." This is this project's own named disease (collapse-log
  2026-08-25, item 3: *"a self-administered collapse test grades its own
  homework"*) recurring in the very act of trying to close a finding about
  a different instance of it. (2) Step 18's own text promises `status`
  discloses *both* directions of `deny_bypass_suspect`'s bias — the
  detector's coverage gap (already honestly enumerated) *and* its
  false-positive direction (AD-9: *"it over-counts an unrelated same-file
  shell rewrite... both directions stated in `status`"*) — but neither the
  over-count direction nor the "residuals section" Step 18 says renders it
  is ever specified in Step 33 (the `status` step) or tested by `T33-1`.
  This is a promise cited as if fulfilled that resolves to nothing, the
  same shape as round 2's own T41-1d collapse, and it is a *recurrence*:
  round 2's own collapse-hunt already noticed the missing wiring in its
  cross-trace narrative but never raised it as a numbered finding, so it
  was never fixed and never re-checked.
- **Partial collapses: 2** — (1) §10's `D-plan-1` entry (the primary
  decision record for the exact decision Q-gap-5 calls "C1") still reads
  *"Reasoned without Clear Thought MCP (unavailable this session — see
  §15 Gaps)"* — flatly contradicted by §15's claim, four thousand lines
  later, that this same decision was subsequently run through Clear
  Thought and confirmed. A reader who stops at §10 (the first and most
  natural place to read this decision's reasoning) is told the opposite
  of what §15 says. (2) §15, `docs/STATUS.md`, and the standalone
  verification document all claim the Clear-Thought pass "sharpened N5's
  framing from 'defensible' to 'required'... now reflected in the plan's
  §10A N5 entry" — but N5's actual §10A entry (lines 3814–3839) contains
  no such framing; the "required, not merely defensible" argument exists
  only in Step 2.5's own body text (which predates this fix pass) and in
  §15's narrative. The specific sweep location the closure claims is
  wrong.
- **New load-bearing decisions §10A missed: 0.** No new undisclosed
  judgment call was found this round distinct from the two collapses
  above (both are about the *fidelity* of an existing disclosure/closure,
  not an unexamined decision).
- **What survives.** The `T18-3`/`T41-1d` mechanization is real,
  self-consistent, and correctly cross-referenced (§5.1 skeleton, §12
  spec, step bodies all agree on the exact 8-entry predicate list and the
  4-file convention-grep set). The N1–N6 four-part collapse-tests are
  substantive, not headers — each states a real "hardest question" and an
  answer that survives a harder follow-up (detailed under "Attacks that
  hit nothing" below). Round 2's other closures (the "design-safe either
  way" sweep, §13 R1/R7 sync, T25-8/T25-9, the AC-2c mapping correction,
  the file skeleton) hold up on direct re-read.

---

## Collapses

### Collapse 1 — "a genuine independent check, not a formality" overclaims what the Clear-Thought pass actually was

**What the plan says.** `docs/plans/plan-phase-a.md` §15 Q-gap-5 (line
6546–6548): *"All six conclusions match the design already shipped in
this plan — **the Clear-Thought pass is a genuine independent check, not
a formality**, and it confirmed rather than rubber-stamped."* The
standalone transcript document repeats the same framing verbatim:
*"The Clear-Thought pass functioned as a genuine independent check rather
than a rubber stamp"* (`docs/reviews/2026-09-07-clear-thought-verification-q-gap-5.md:220`).

**How this was verified.** Read the full transcript
(`docs/reviews/2026-09-07-clear-thought-verification-q-gap-5.md`, all 225
lines) and the MCP-server description in the plan's own text (§15 lines
6496–6511): a "small client" spoke `initialize` → `tools/list` →
`tools/call` to `npx -y @waldzellai/clear-thought-onepointfive`'s
`sequential_thinking` operation, which the plan itself describes as
*"pattern-based chain-of-thought"* tracked by a server-assigned
`sessionId` — i.e., a tool that accepts and stores a caller-supplied
thought string per call and returns acknowledgment/next-step scaffolding.
Nothing in the transcript, the tool's documented operation, or the MCP
`tools/list` response the plan quotes shows the server injecting any
judgment, alternative framing, external data, or model call of its own —
every FRAME/COMPARE/CONCLUDE sentence in all eighteen calls is text the
fix-pass session itself composed and sent as the `thought` parameter. The
six outcomes are unanimous ("confirmed", "no change" × 5, one sharpened
wording) — a 100% self-affirmation rate from the same session that made
every original call, with no adversarial framing anywhere in the six
chains (each FRAME poses "is X correct?" and each COMPARE argues for the
already-shipped X).

**Why this is a collapse, not a stylistic nit.** SKILL.md's actual mandate
(`.claude/skills/expert-plan/SKILL.md` Step 6, quoted in the plan's own
Q-gap-2 entry, line 6277–6282) is procedural: *"Every plan MUST invoke the
Clear Thought MCP server to work through its decision points explicitly."*
That mandate is satisfied — a real subprocess, a real protocol handshake,
real tool calls, verified in a session transcript exactly as round-2's S3
finding's option (b) demanded. But the plan does not stop at "the
mandated tool was invoked" — it goes on to claim the pass constitutes
**independent verification** of the six decisions' correctness, which is
a different and unsupported claim: Clear Thought's `sequential_thinking`
tool provides no adjudication independent of the calling agent, so a
session grading its own six decisions through it is exactly the pattern
`docs/collapse-log.md`'s 2026-08-25 entry (item 3) already named and
warned against: *"an in-document self-test never discharges the mandatory
independent hunt; when you find yourself writing both the question and a
passing answer, you are the substance-reviewer again."* Here the
document is different (a standalone transcript) but the structure is
identical, and the plan's own words ("genuine independent check") assert
the very property that structure cannot provide. A future reader who
takes "independent check" at face value will trust these six decisions —
C1's write-time cap, N5's placement, C3's repo-set disclosure, P3's
marker, P4's interface widening, T18-3's mechanization — more than the
evidence supports, which is precisely the "no hollow decisions" failure
`CLAUDE.md` dominating rule 2 exists to prevent, wearing rigor's costume.

**What correct disposition looks like.** Keep the factual claim (SKILL.md
Step 6's literal mandate — invoke the tool, capture the trace — is
satisfied; the transcript is real and the six chains are a genuine
disclosure of reasoning). Drop or correct "independent check" and
"rubber stamp" language in both the plan (§15, lines 6546–6548) and the
standalone document (line 220) to something accurate: e.g. "a
structured, disclosed re-examination of these six decisions, run through
the mandated tool — not an adversarial or externally-adjudicated check;
that role is filled separately by the independent collapse-hunt/
expert-review dispatch this document is itself the product of."

### Collapse 2 — `deny_bypass_suspect`'s architecture-mandated two-directional disclosure is only half-built, and the gap is a recurrence round 2 already spotted and dropped

**What the plan says.** Step 18 (line 1646–1658): *"Coverage bound,
stated explicitly (collapse-hunt N2): this predicate list is the full
detector... Known Bash file-writing patterns it does NOT catch: `dd`,
`rsync`, `ln -sf`, `xargs cp`/`xargs mv`... `status`'s residuals section
lists this omitted-pattern set verbatim so the exit-report's
`deny_bypass_suspect` count is read as 'coverage of the enumerated
pattern set,' never as 'how bypassable the block is via Bash' in
general."*

**What the architecture requires.** `docs/architecture-phase-a.md` AD-9
(line 843–850): *"A companion diagnostic, `deny_bypass_suspect`, records
post-hoc when a deny is followed in the same turn by a successful ('ok')
file-writing `Bash` row whose written path matches the denied action's
target... **A proxy, not a measurement — it over-counts an unrelated
same-file shell rewrite and under-counts a bypass to a different path;
both directions stated in `status`.**"*

**How this was verified.** Read Step 18 in full (lines 1629–1715), N2's
§10A collapse-test in full (lines 3759–3784), `T18-1`'s and `T18-3`'s §12
specs in full (lines 4976–4990, 5017–5035), Step 33's full "What changes"
bullet list and Gate-3 rationale (lines 2567–2618), and `T33-1`'s §12 spec
in full (lines 5501–5514). None of these six locations mentions the
over-count direction (a same-target Bash rewrite that is *not* actually a
bypass) anywhere, and none specifies or tests a "residuals section" in
`status` at all — `T33-1`'s own data description ("seeded store with each
fault code, one whisper, one deny, one correction") tests only that each
signal *appears*, not that the omitted-pattern list or the over-count
caveat is rendered alongside it. Grepped the full document for
"over-counts", "under-counts", and "false positive" in connection with
`deny_bypass_suspect` — no matches anywhere outside the architecture
itself.

**Why this is a collapse, not a minor gap.** This is a documented
*recurrence*: round 2's own collapse-hunt already noticed exactly this —
its mission-fidelity cross-trace (`docs/reviews/2026-09-07-round-2-plan-collapse-hunt.md:505-512`)
states *"it turns out... the promised `status` rendering of that
disclosure (the 'residuals section') is never actually built anywhere in
the plan's own `status` step (Step 33) or test spec (`T33-1`)"* — but
that observation was written into the report's narrative prose, never
raised as a numbered Collapse/Partial finding, and so it never appeared
in `docs/STATUS.md`'s "all findings applied" ledger and was never fixed.
It is precisely the shape this project's own collapse-log names
repeatedly (2026-08-01, "a device installed to close a finding... never
re-checked"; 2026-08-29, "a reviewer's concrete repair prescription
carries no verification of its own"): a true observation that never
became a tracked, closed finding is functionally the same as never having
been made. And it sits inside the exact mechanism (Step 18/N2/T18-3) this
round's Q-gap-5 fix pass singles out as fully Clear-Thought-verified with
"no change" — the self-review did not catch that its own subject was
half-implemented against the architecture's explicit words, which is
independent corroborating evidence for Collapse 1 above: a genuinely
independent pass would have had a real chance of catching a
spec-conformance gap this concrete; a self-graded one, structurally,
does not.

**What correct disposition looks like.** Either (a) add the over-count
caveat and the omitted-pattern list to Step 33's `status` bullet and to
`T33-1`'s (or a new `T33-1a`'s) assertions, so `deny_bypass_suspect`'s
count is read with both stated biases as AD-9 requires; or (b) if the
architecture's "both directions" language is judged not to require a
literal second sentence in `status` (e.g., if the omitted-pattern list
alone is judged sufficient disclosure), say so explicitly with a citation
— the current text neither implements AD-9's second clause nor argues
that it needn't be implemented; it simply does not mention it.

---

## Partial collapses

### Partial 1 — D-plan-1's own decision record (§10) still asserts it was reasoned without Clear Thought, contradicting §15's later claim about the same decision

**What the plan says, in two places, both currently live.**

- §10, D-plan-1 (lines 3254–3267): *"Tests come last per component but
  earliest per test-tier... **Reasoned without Clear Thought MCP
  (unavailable this session — see §15 Gaps); reasoning captured in this
  entry so the choice is auditable.**"*
- §15, Q-gap-5 (lines 6513–6517): *"**C1** (write-time predicate cap vs.
  build reordering): confirmed — reordering only changes *when* the
  recognizer's first correctness gate is hit, not *whether* silent
  widening can merge; the cap (`T14-3`/`T18-3`) checks content, not
  timing, and is the load-bearing mechanism. No change."*

C1 is D-plan-1's own write-time-cap decision (§10A's own D-plan-1
collapse-test, lines 3400–3439, is explicitly the location "collapse-hunt
C1" refers to — cross-checked by name at line 3411, 3433).

**How this was verified.** Read §10's D-plan-1 entry in full (lines
3254–3267) and §10A's D-plan-1 collapse-test in full (lines 3400–3459),
neither of which was edited to reflect the later Clear-Thought pass; then
read §15's Q-gap-5 disposition in full (lines 6419–6566), which
unambiguously states this same decision was later "genuinely
Clear-Thought verified... no change."

**Why this matters.** A reader encountering D-plan-1 at §10 — the
document's own designated location for "judgment calls made during this
planning session, with reasoning" — is told the decision was made without
the mandated tool and points them at "§15 Gaps" for the (implied, still
open) caveat. By the time §15 is reached, four thousand lines later, the
caveat has in fact been resolved — but §10 was never updated to say so.
This is the same shape as round 2's own Systemic finding (fix content not
swept to every cross-reference where the fixed claim was independently
restated) recurring inside this very round's fix.

**What correct disposition looks like.** Update §10's D-plan-1 sentence
to state the current fact: this decision was reasoned in the document
first and subsequently re-run through the actual Clear Thought MCP server
(pointer to §15 Q-gap-5), not "reasoned without Clear Thought MCP...
see §15 Gaps" as though the gap were still open.

### Partial 2 — the claimed location of N5's "sharpened" framing is wrong

**What the plan/STATUS/verification doc all claim.** §15, Q-gap-5 (lines
6547–6550): *"the Clear-Thought pass... surfaced the sharper *required*,
not merely *defensible*, framing for N5"* — echoed in
`docs/STATUS.md` ("though the pass did sharpen N5's framing from
'defensible' to 'required'") and in the standalone verification document's
"Outcome" section: *"it surfaced a sharper framing for N5..., which is
now reflected in the plan's §10A N5 entry."*

**How this was verified.** Read N5's full §10A collapse-test (lines
3814–3839) — its Hardest question/Answer is entirely about whether a
single wrapper function is "still bypassable by a future contributor,"
and its Answer is entirely about `T41-1d`'s CI enforcement; neither
mentions Step 21, the topological-sort argument, or "required" vs.
"defensible" anywhere. Grepped the full document for "merely defensible",
"not merely", "required by Step 21", and "Step 21's existing spawn site"
— the only hits are §15's own Q-gap-5 text (line 6549) and the standalone
document, plus Step 2.5's own body text (lines 716–723, 745–755), which
already carried this exact argument *before* this fix pass (it opens
"Placed here, not later, per S1's topological-sort lesson applied to this
plan's own fix pass"). The claim that this framing is "now reflected in
the plan's §10A N5 entry" is checkably false: it is not there.

**Why this matters.** This is a specific, falsifiable claim about where a
fix landed (round 2's own named failure mode), made three times across
three documents (the plan, STATUS.md, the standalone verification
document), and it does not hold at the one location all three name.

**What correct disposition looks like.** Either add the sharpened framing
to N5's §10A entry itself (so the claim becomes true), or correct all
three citing locations to point at Step 2.5's body text (where the
argument has in fact lived since before this fix pass) instead of "§10A
N5."

---

## New load-bearing decisions §10A missed

None found distinct from the two collapses above. Both are about the
fidelity of an existing disclosure (D-plan-1/N5's fix-sweep, the
`deny_bypass_suspect` two-directional promise) rather than an unexamined
judgment call the plan never surfaced at all — the N1–N6 formalization
this round's predecessor did appears to be structurally complete (every
plan-level judgment this session could find has a home in §10 or §10A).

---

## Attacks that hit nothing / survive with note

- **The `T18-3`/`T41-1d` mechanization.** Attacked by checking all three
  required locations independently (§5.1 file skeleton lines 425–426;
  §12 spec lines 4842–4863 and 5017–5035; step bodies at lines 1700–1710
  and 725–737/745–762) — all agree on the exact predicate/file sets with
  no drift. **Survives.**
- **N1 (URL scheme unnormalized).** Hardest question already on the page
  ("why leave the biggest real-world variance — SSH vs HTTPS — un-folded?")
  is a real one; pushed harder: is the promised "owner-visible" mitigation
  (`status` showing the full normalized key) actually usable by a
  non-programmer to *notice* a scheme split across two separate working
  directories he'd have to compare by hand? This is a real, weaker-than-
  ideal mitigation, but the plan does not overclaim it — it says
  "converts... from invisible to owner-visible," not "solved," and a
  fuller fix (unifying scheme) is honestly rejected as riskier (silent,
  unrecoverable merge of two actually-different repos vs. a visible,
  reconcilable split). **Survives with note**: the "owner-visible"
  mitigation is weak in practice for a non-programmer and could be
  strengthened (e.g., `init` warning when a *new* repo key's non-scheme
  components match an *existing* stored key), but the plan does not
  misstate what it delivers.
- **N2 (`deny_bypass_suspect` coverage bound).** Attacked on the
  under-count axis already on the page; the harder question (the
  over-count axis) is Collapse 2 above, not a "survives" — recorded there,
  not duplicated here.
- **N3/N4 (bar defaults).** Hardest question already posed (six largely
  unvalidated constants driving the exit-run's numbers) is real; pushed
  harder: is the "guide, not gate" honesty caveat itself enforced, or
  could a future PR cite Step 23's seed values as validated the same way
  C1's original unenforced cap was? Unlike C1, this is honestly disclosed
  as *unenforceable* ("nothing enforces the seed values past `init`") —
  correctly, since "did someone cite an unvalidated number as validated in
  a future document" is not a property CI can grep for the way a
  predicate-list or caller-count is. **Survives**: the asymmetry with C1
  (mechanized) vs. N3/N4 (honestly unenforced) is principled, not an
  inconsistency.
- **N6 (confinement-grep scope vs. `dist-test/`).** Hardest question
  (does C2's second compile target reopen N6) is answered by a structural
  partition (disjoint `tsconfig` `include` globs, checked at Step 1's
  `T1-1`) rather than a convention — verified by reading both `tsconfig`
  descriptions (Step 1) and confirming `T1-1`'s existence (§12).
  **Survives.**
- **§13 R1/R7 sync (round-2's own finding).** Re-read both entries in
  full (lines 5822–5836, 5881–5900) — both now correctly cite the current
  mechanisms (`T14-3`/`T18-3` for R1; the `.ctxoracle-exit-repos`
  labeling mechanism for R7). **Survives**, confirmed fixed.
- **The "design-safe either way" sweep (round-2's P2 finding).** Grepped
  the full document for the phrase and every close paraphrase — the only
  remaining occurrences are inside the corrected text explaining what was
  wrong with the old wording. **Survives**, confirmed fixed.
- **T25-8/T25-9 and the AC-2c mapping correction (S2/M5).** Cross-checked
  §5.1, §12, and the AC↔test mapping table (lines 5730–5742, 5789) —
  consistent everywhere sampled. **Survives.**

---

## Mission-fidelity cross-trace

Reading `docs/plans/plan-phase-a.md` against `CLAUDE.md` dominating rule 3
and spec §11.5's own words, as rounds 1 and 2 did:

- **"Honest deterministic foundation."** Holds at the mechanism layer
  (Step 14's recognizer is still minimal; the write-time cap is now
  mechanized). The residual failure this round is not at the mechanism
  layer but at the *disclosure* layer one level up: Step 18's own promised
  disclosure of `deny_bypass_suspect`'s bias is half-built (Collapse 2),
  which is the same disease as an unmeasured claim standing in for a
  measured one, just relocated from a recognizer to a status renderer.
- **"Running on the owner's real repos."** Unaffected this round; round
  2's C3/R7 fixes hold on direct re-read.
- **"Measures its own floor — how little it catches."** This is where
  both this round's collapses land. Collapse 2 is a literal instance:
  the mechanism that is supposed to tell Max Cogar precisely how partial
  `deny_bypass_suspect`'s coverage is (in *both* directions, per AD-9) is
  not wired to the surface he actually reads. Collapse 1 is the same
  failure at the meta-level — the plan's own self-assessment of how
  thoroughly its Q-gap-5 fix was checked overstates the rigor applied,
  which is exactly "measuring the floor" failing for the plan's *own*
  compliance claim rather than for a genre's coverage claim.
- **"Clean seams the later phases plug into."** Unaffected.
- **"Never fake completeness dressed to look like a working product."**
  This round's two collapses are both instances of this axis, at a
  smaller scale than round 1's original finding but the same shape: a
  claim of closure ("genuinely Clear-Thought-verified," "residuals
  section lists this... verbatim") stands in front of text that does not
  back it. Neither is a mechanism actively lying to the agent at runtime
  (the deterministic core itself is not implicated) — both are the
  document's account of its own rigor exceeding what a direct read
  supports, which is the same category of failure `CLAUDE.md` dominating
  rule 1 names for code ("never claim something works without having run
  it") applied to a planning document's claims about its own review
  process.

---

## Attestation

- **What I read in full this session (2026-09-07).**
  `docs/collapse-log.md` (1332 lines, two `Read` calls);
  `OWNER-LEDGER.md` (80 lines); `middleware/context-oracle/CLAUDE.md`
  (238 lines); `docs/specs/spec-context-oracle.md` §8 (326–543), §11
  (597–778), §12 (780–873), §13 (874–907), §14 (908–1138), all read in
  full; `docs/architecture-phase-a.md` AD-9 (736–923), AD-10 (924–946),
  AD-11 (947–996), AD-12–13 (997–1072), AD-14 (1073–1129), AD-15
  (1130–1178), AD-16–17 (1179–1281), AD-18 (1282–1328), AD-19–20
  (1329–1413), AD-21 (1414–1446), AD-22–23 (1447–1512), AD-24
  (1513–1600); `docs/STATUS.md` (189 lines); all seven named prior review
  documents in full
  (`2026-09-06-author-gates-review.md` 386 lines,
  `2026-09-06-meta-check-skipped-steps.md` 564 lines,
  `2026-09-06-plan-collapse-hunt.md` 822 lines,
  `2026-09-06-plan-expert-review.md` 842 lines,
  `2026-09-07-round-2-plan-collapse-hunt.md` 624 lines,
  `2026-09-07-round-2-plan-expert-review.md` 669 lines,
  `2026-09-07-clear-thought-verification-q-gap-5.md` 225 lines);
  `docs/plans/plan-phase-a.md` (6645 lines) — read across multiple `Read`
  calls covering: lines 1–465 (front matter, scope, full file skeleton),
  700–780 (Step 2.5), 908–1000 (N1's status-visibility claim),
  1073–1180 (bar/genre area, cross-check), 1600–1720 (Steps 17–18 in
  full), 2440–2460 and 2555–2620 (init/status/marker areas), 2790–2880
  (Step 38), 3040–3140 (Step 42 in full), 3230–3460 (§10 D-plan-1/2 and
  §10A D-plan-1 in full), 3555–3920 (§10A D-plan-6 through N6 and the
  coverage-attestation paragraph, in full), 4180–4270 (T14-3/T15-1),
  4590–4870 (T14-3, T18-2/T18-3, T38-1, T41-1), 4960–5070 (T18-1/T18-2/
  T18-3), 5215–5250 (T25-8/T25-9), 5495–5535 (T33-1/T33-2/T33-3),
  5730–5745 and 5778–5800 (AC↔test and step↔test mapping tables),
  5817–5920 (§13 Risks, in full), 6083–6234 (§14.3/§14.4 register and
  sweep, in full), 6234–6645 (§15 Gaps through end of document, in full).
- **What I fetched or re-verified externally.** Nothing — this round's
  findings are internal-consistency and architecture-conformance checks,
  established entirely by direct reads of the plan, the architecture, and
  the prior review record, per the task's own method ("search locates,
  reads verify").
- **Confidence.**
  - **High** on both collapses and both partials — each is a direct
    textual comparison between two (or three) already-fully-read
    passages, quoted verbatim above, with no inference required.
  - **Medium** on Collapse 1's framing as a "collapse" rather than a
    lesser severity — reasonable people could call "genuine independent
    check" harmless rhetorical flourish rather than a load-bearing
    overclaim; I judge it load-bearing because the plan explicitly
    contrasts it with "rubber-stamped" (asserting a specific, checkable
    property: adversarial value beyond self-review) and because it
    directly determines how much scrutiny a future reader believes these
    six decisions received.
  - **Low-to-none** on anything in the roughly 60% of individual §12
    test-spec entries not directly sampled this round (T2–T13, T19–T24,
    T27–T32, T34–T40 bodies); a defect purely local to one of those
    entries would not have been caught here.
- **How long.** Full end-to-end read of the plan (6645 lines), all seven
  prior review documents, the full spec sections named in the brief, the
  named architecture decisions, the full collapse-log, and the ledger;
  every claim in the Q-gap-5 disposition cross-checked against its cited
  location before writing any finding.
- **What would make me revise the verdict up (to SURVIVES).** For
  Collapse 2: discovery that `T33-1` or a sibling test this session's
  sampling missed does in fact assert the omitted-pattern list and the
  over-count caveat render in `status` output. For Collapse 1: this is a
  characterization judgment, not a fact that a missed `Read` could
  reverse — revising it would require the plan's own text to already
  qualify "independent check" the way this review recommends, which it
  does not, checked twice.
  For the two partials: discovery of an edit to D-plan-1's §10 sentence
  or N5's §10A entry that this session's `Read` calls on those exact line
  ranges (3254–3267, 3814–3839) somehow missed — unlikely, since both
  were read in full, twice.
- **What would make me revise down further.** Evidence that the
  `deny_bypass_suspect` over-count direction is disclosed somewhere in
  `status`'s actual (future) implementation output rather than in this
  planning document — but the plan is the artifact under review, and a
  plan that does not specify a requirement is the defect regardless of
  what an implementer might add unprompted.

*End of round-3 collapse-hunt. Trajectory across three rounds on this
plan: round 1 — 3 collapses, 4 partials, 6 missed decisions, DOES NOT
SURVIVE; round 2 — 1 collapse, 3 partials, 1 new defect, 1 procedural gap,
DOES NOT SURVIVE; round 3 — 2 collapses, 2 partials, 0 new missed
decisions, DOES NOT SURVIVE. The magnitude has not shrunk further this
round — both collapses are new, and both are recurrences or byproducts of
round 2's own fix pass (the Q-gap-5 closure's own self-grading; a
disclosure gap round 2's own report noticed in prose but never tracked to
closure) — which is itself the pattern `docs/collapse-log.md`'s round-2
entry (2026-09-07, "the plan's own fix pass") already names: the fix
pass's own additions are exactly where the next collapse hides. Not yet
the zero-collapse round `docs/collapse-log.md`'s 2026-08-25 entry defines
as terminal.*
