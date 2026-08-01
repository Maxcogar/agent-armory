# Adjudication — entry gate or exit gate for Phase 1's measurement clause (2026-08-01)

*Independent pass, fresh subagent, never the author. **Written once, never
edited.*** Run before anything was written. Two candidate readings were put to it;
it was told neither might be right.

**Verdict: neither reading. The two documents do not disagree.**

## F1 — §12's "How to read" paragraph does not distinguish entry from exit; it states both.
Three claims in four lines: exit clauses are measurements; a phase is gated on the
previous phase's run; and a phase's requirements are *"not a design-ready basis
until the measurements **their exits** name exist"* — "their" binding to the
phase's **own** exit. The third is load-bearing and is what Reading A's supporting
quote omits. **So CLAUDE.md was not reinterpreting the spec — it was quoting a
function §12 assigns itself.** There is no two-document conflict; there is one
document doing two things in two paragraphs and a second document quoting the
second.

## F2 — Phase 0's exit clause produces no rates, and no document reviews them.
*"The owner runs it on a real project without incident"* names a run, no
measurement, no review. The rates are Phase 0-emitted from elsewhere (FR-M1 →
`session_log` → `status`). A real gap — in Phase 0's exit clause, not evidence that
Phase 1's sentence is misplaced. Also: CLAUDE.md's claim that Phase 0 produces
*both* metrics is contradicted by the spec today, which records hit rate as
unestablished.

## F3 — Under Reading B, Phase 1 cannot produce hit rate either.
Phase 1 adds Lane 2; uptake detection is the distiller's, and the distiller is the
Phase 2 exit. Hit rate is behind Phase 2 under both readings. Reading B duplicates
the hole rather than resolving it. What "reviewed against the bar" accomplishes at
Phase 1's exit is the manual operating practice in RETHINK — automated tuning is
Phase 2 — and the spec gives that practice no CLI surface.

## F4 — The other two phases settle the pattern, against Reading A.
Phase 0's and Phase 2's clauses are both own-phase conditions, and Phase 2's
**cannot** be an entry gate because there is no Phase 3. The trailing-clause slot
is structurally an own-phase condition; Reading A requires Phase 1 to be the
exception and gives no reason.

**But the same enumeration breaks §12's universal rule.** Applied to Phase 2, "not
design-ready until the measurements their exits name exist" is unsatisfiable — only
Phase 2's own distiller can produce them. §12's "each phase" is a set claim that
holds for one member.

## F5 — Which document wins: the project has a rule, and it decides this.
The rule in the amendment is squarely CLAUDE.md's job and is correct. The
*justification clause* re-states a spec sentence verbatim and appends a
producibility claim — and producibility has changed since it was written, so the
clause fails CLAUDE.md's own membership test ("is it true regardless of where the
project currently stands?"). **The violation is duplication, not usurpation**, and
rule 1's predicted failure mode occurred exactly as written: the copy diverged, and
two sessions spent propositions on the divergence.

## F6 — Is it load-bearing? No.
Phase 1's exit clause stays in place under every surviving reading; nobody may
write Phase 1's exit procedure now regardless; and Phase 0's real blockers are
untouched by the answer. **STATUS overstates it as step 1.** Worth settling only
because it is cheap and because leaving it open guarantees a ninth session
re-argues it.

## F7 — Self-serving check: which reading buys the most writing.
Reading A: moderate new text plus a new structural asymmetry. Reading B: **most**
new text — only one occurrence exists in the spec, so "disambiguating both" means
promoting a CLAUDE.md sentence into the spec as a requirement, which is lifecycle
inversion, and requires naming a producing run for hit rate that no document can
name. Neither: **delete a duplicated clause — shorter than what is there now.**

## F8 — Two side findings.
The spec cites *"Ship with the bar set high…"* to RETHINK §5; it is in §6. And
`docs/reviews/README.md` requires every review pass to write its full output there:
six hunts are recorded for 2026-08-01 and only three files existed.

## Verdict and minimal change
**One file: CLAUDE.md.** Replace the duplicated spec sentence and its producibility
claim with a pointer — *"That contradicted spec §12, which forbids treating a Phase
1 requirement as architecturally resolvable before Phase 0 has run."* Net: shorter,
no new claim, and the only sentence that made the documents look like they
disagreed is gone. **Do not touch the spec's Phase 1 bullet. The sentence does not
move.**

**Whose call: the agent's.** It is document consistency and build sequencing, it is
already written (derivable from §12 read in full), nothing is descoped, and no
locked decision is touched. The owner's call would be *adding* an exit procedure or
changing what Phase 1 delivers — this does neither.
