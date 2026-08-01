# Collapse-hunt — `docs/specs/spec-context-oracle-phase0.md`, rebuilt (2026-08-01, tenth pass)

*Independent adversarial pass, fresh subagent, never the author. Mission-fidelity
axis only. **Written once, never edited.***

**Target:** `middleware/context-oracle/docs/specs/spec-context-oracle-phase0.md`
at commit `332406c`, governing Phase 0 over `spec-context-oracle.md` wherever both
address the same subject.

**Prior pass:** `docs/reviews/2026-08-01-collapse-hunt-phase0-spec.md` (16
findings). Its findings are closure items here and every one was re-derived from
the current file rather than assumed applied. **The target was rebuilt whole
twice since that hunt** — `91698c7` (from the expert review's 20 findings) and
`332406c` (from a 14-item self-audit) — so several prior findings closed by
disappearing, and several reopened in new places. Both are recorded below.

**Verdict: 21 findings — 10 collapse, 11 partial — plus 5 minors. Of the prior
16: 11 closed, 4 partially closed, 1 neither applied nor adjudicated.**

The dominant class this pass is **an attestation that the document's own contents
falsify**. Three of the four heaviest findings are false claims the document
makes about itself — §3's "unchanged" column, the header's identifier rule, §4's
closed source table — and each of the three is the *device installed last round
to close a prior finding*. The prior pass named this shape in F15 ("a false claim
about the document's own contents"); it did not go away, it moved into the
machinery built to prevent it.

The single heaviest finding is not of that class. It is **N1**: `Stop` fires
whenever Claude finishes responding, not only at a completion claim — a current
documented contract fact neither this document nor the v1 spec holds — so Phase 0
spends the owner's `[OWNER-12]` turn cost at every turn boundary while citing his
ruling about one moment as the licence.

---

## What survives, stated first so the findings read as exceptions

Each of these was re-derived from source in this pass, not inherited:

- **Every ROSE quotation and figure is verbatim.** I fetched the TSE 2005 PDF
  (`thomas-zimmermann.com/publications/files/zimmermann-tse-2005.pdf`), extracted
  its text, and checked all eight quoted strings and both figure pairs against it.
  All eight are exact, including the em-dash in the outdated-knowledge quotation,
  the distinction between the §7.5 prevention precision (>66%) and the §7.6
  closure false-alarm rate ("Only 2 percent of all transactions cause a false
  alarm" — verbatim, §7.6 Summary, and correctly attributed here to the separate
  complete-transaction evaluation), and "the percentage of missed alarms is on
  average 97 percent." §4's attestation for this source is true. That is rare on
  this project and it is worth saying.
- **§3's partition is arithmetically exact.** I enumerated the v1 identifier set
  independently: 7 FR-O (incl. O4a) + 9 FR-K + 9 FR-A + 5 FR-D + 5 FR-J + 3 FR-S
  + 7 FR-L + 4 FR-M + 8 FR-X + 3 NF + 5 C = 65. The three §3 sets are 44 + 4 + 17
  = 65 and their union covers each identifier exactly once, with no double-listing.
  The *coverage* claim holds; N2 attacks the *disposition* claim, which is a
  different thing.
- **The `PreToolUse` exit-0 quotation is verbatim in current source.** It is not
  on `code.claude.com/docs/en/hooks.md` (which now reads "staying silent doesn't
  approve it"), and it is on `hooks-guide.md`: *"For a `PreToolUse` hook this
  doesn't approve the tool call: the normal permission flow still applies."* I
  checked the page it is absent from before concluding — the collapse log's
  "stopping too early against a source that is right there" lesson. F12 is
  genuinely closed.
- **FR-O4, FR-O4a and the structural no-deny posture.** Unattackable as written;
  AC-5 covers the continuation axis as well as the field scan.
- **The threat model and FR-X1/X2/X3/X8**, with AC-12 and AC-14. The Phase 0
  narrowing of the surface (no model call ⇒ no model-prompt threats, returning in
  Phase 1) is honest and correctly bounded.
- **The Unknown genre's treatment (§2).** Restored to the parent §14 formulation
  exactly as the prior F11 prescribed: undecided upstream, neither settled here
  nor dropped. The false mechanism reason is gone.
- **AC-3.** The mission's load-bearing clause has a criterion for the first time
  in this project's history. That was the prior pass's closing recommendation and
  it landed verbatim.

---

## Part 1 — closure ledger for the prior pass's 16 findings

Re-derived from the current file. "Closed" means the defect is absent from the
current text, not that a commit says it was fixed.

| # | Prior finding | Status | Evidence in the current file |
|---|---|---|---|
| F1 | Bar has two terms, needs three; RETHINK §2.3 not a source | **Closed** | FR-A5 states `confidence × decision-impact × marginal value` and its Phase 0 derivation; §4's source row now includes `RETHINK.md` §2.3; P0-D-6 records the composition as this document's. *Residual: minor M4 below.* |
| F2 | Five genre arms narrowed with nothing recorded | **Partial** | §2's closing paragraph now records five narrowed arms — but the stated reason is false for at least two of them (**N5**) and a sixth arm vanished unrecorded (**N6**). |
| F3 | Phase 0 writes facts no genre can speak; FR-L6 has no intake | **Partial** | Intake is now specified — P0-D-2 and §12 give FR-L6 the CLI, AC-20 tests it. The *first* collapse question is now worse, not better (**N7**). |
| F4 | Orientation's landmine "writer"; verification's join | **Closed** | P0-1 states plainly that literal-match landmine detection *"is a read over indexed content, not a writer."* FR-K1 names per-region verification commands as index content, which is the join. |
| F5 | ACs test emission and harmlessness; mission clause (a) untested | **Partial** | (i) AC-3 added, exactly as prescribed. (ii) AC-4 gives the floors their negative test. (iii) no universal FR-D1 parse/pointer-resolution criterion exists (**N21**). (iv) FR-X6 is covered by AC-15; **FR-L1 still has no criterion at all** (**N18**). AC-1's coupling trigger is corrected to a completed read. |
| F6 | Corpus floor deleted; per-pair floors can't do its job | **Closed** | FR-A6 restored with P0-D-7's reasoning and AC-4's negative test. *Residual: granularity inconsistency, **N14**.* |
| F7 | FR-O5 deleted on a false premise about FR-O1 | **Closed** | FR-O5 restored verbatim in substance; P0-D-1 states why it is stated rather than inferred; AC-22 tests it. *Residual: minor M5.* |
| F8 | FR-A7 vanished; three incompatible treatments of inherited requirements | **Closed in form, reopened in substance** | §3 now gives all 65 v1 requirements a disposition — the strongest structural fix of the round. But the disposition itself is false in ten rows (**N2**), which is the same defect one level up. |
| F9 | Per-consumer keying: fork unresolved, wrong cross-reference, no reason | **Partial** | Fork resolved (FR-O6: record the key, deliver to the main agent only); cross-reference fixed to FR-O6; AC-21 added. **The Reason column still contains no reason** (minor M2), and the parent §14's unverified subagent hook contract is nowhere mentioned. |
| F10 | No push announcement when the oracle self-suppresses | **Neither applied nor adjudicated** | No requirement announces a self-detected suppressing condition on the human channel. AC-17 remains pull (`ctxoracle status`). Nothing in §13 records that this was considered and rejected. The prior pass priced rejection as reasonable — but silence is not adjudication, and `CLAUDE.md` says apply *all* findings. |
| F11 | Unknown genre: deferral with no destination on a false reason | **Closed** | §2's row now reads *"Held open in the v1 spec §14 … this document neither settles it nor treats it as dropped from v1."* *Residual: minor M1.* |
| F12 | PreToolUse justification weaker than the parent's; PostToolUse absent | **Closed** | §7 quotes the behavioural sentence (verified verbatim above); §4 confirms `PostToolUse` and `UserPromptSubmit`; the unused `"async": true` confirmation is gone. *`Stop` is now the omitted one — **N13**.* |
| F13 | Orientation tested against the harness's 30 s budget | **Closed** | AC-9: *"within NF-1's budget, not the harness's larger allowance."* C-5 adds that no requirement depends on a harness timeout value. |
| F14 | Stop-bar delta unquantified; suppression not reported | **Partial** | Suppression is now recorded (P0-3), computed (P0-4) and tested (AC-10, AC-18) — that half is fully closed. The delta acquired a "default" that cannot be evaluated (**N10**). |
| F15 | Shared identifiers do not mean what the header says | **Closed for FR-\*, reopened for two** | Checked line by line: FR-A2/A3/A4/A5/M3/M4 now carry the parent's meanings, and the `AC-n` ambiguity is explicitly disclaimed in the header. **FR-A5a and FR-A5b are newly minted `FR-*` identifiers the header forbids** (**N3**). |
| F16 | NF-2 requires a report with no recorder; FR-A3 states no budget | **Partial** | FR-A3 now carries 2,000 tokens `[P0-D-4]` and AC-18 tests overhead against it. **The recorder is still unnamed and P0-4 does not enumerate the quantity** (**N17**). |

---

## Part 2 — new findings

### N1 — `Stop` fires whenever Claude finishes responding. Phase 0 spends decision 12's accepted turn cost at every turn boundary and cannot tell that moment from the one the owner ruled on. COLLAPSES.

**Decisions attacked:** §7's Completeness and Verification rows (`Stop`), P0-3, and
FR-O4a's grounding in `RETHINK.md:363–379`.

**Mission sentence available:** P0-3's own — *"the only whisper that spends a turn
rather than riding a boundary."*

**The collapse question:** *`[OWNER-12]` accepts the turn cost of speaking when an
agent claims it's done. Name the Phase 0 mechanism that distinguishes a completion
claim from a turn that merely ended.*

There is none, and the contract makes the gap concrete. Verified against current
primary source this pass (`code.claude.com/docs/en/hooks-guide.md`):

> `Stop` hooks fire whenever Claude finishes responding, not only at task
> completion. They don't fire on user interrupts. API errors fire `StopFailure`
> instead.

Neither this document nor the v1 spec records that sentence. Both write as though
`Stop` *is* the completion-claim moment: `RETHINK.md:363–379` is titled *"Speaking
at a completion claim is a must-have, and its turn cost is accepted"*, and P0-3
cites that range to license the stop-grade whisper. Detecting an actual completion
claim requires reading what the agent said — narration reading, which §2 defers to
Phase 1 because it *"requires the transcript reader."* So Phase 0 holds the cost
and not the discrimination.

Three consequences, all inside Phase 0's own numbers:

1. **The bound the owner was given is per-stop, and the number of stops is
   unstated anywhere.** `RETHINK.md:393–399` describes the accepted cost as
   *"bounded to *one* extra turn"* — true per stop, and a session has as many
   stops as the agent has turns. Nothing in this document, the v1 spec, or
   `RETHINK.md` bounds stop-grade whispers per session. FR-A3's token budget
   bounds tokens, not turns.
2. **P0-4's continuation count measures a quantity whose denominator nobody set.**
   The owner is shown "how often a turn was extended" against no expectation.
3. **Verification can only ever speak at a cost.** §7 gives it `Stop` alone, so
   every verification whisper is a continuation. Completeness has a free
   `PostToolUse` arm; verification has none.

The honest reading is that `[OWNER-12]` ruled on *a moment* and Phase 0 implements
*an event*, and the two were never distinguished because the contract fact that
separates them was never recorded. This is `[OWNER-12]`'s own condition —
*"a decision to accept a named, bounded, audited cost"* — with the "bounded" part
resting on a premise that is false as stated.

**Class: unverified, producing a mechanism-not-mission grounding.**
**Fix:** record the contract fact in §4; state in P0-3 that Phase 0's stop trigger
is every turn end, not a completion claim, and that completion-claim detection
arrives with the narration reader; then either bound stop-grade whispers per
session with a stated value and a criterion, or state that the bound is per-stop
only and add the per-session count to P0-4 so the owner sees the total he
actually accepted. Do not re-litigate `[OWNER-12]` — the capability stays; what
needs stating is what Phase 0 can and cannot recognise.

### N2 — §3's "in force in Phase 0, unchanged" is false in at least ten of its 44 rows, and §3 is the device that closed F8. COLLAPSES.

**Decision attacked:** §3 — *"Each has exactly one Phase 0 disposition below, so a
reader can tell a deliberate exclusion from an omission **without inferring it
from §2's themes**."*

**The collapse question:** *§3 exists so a builder need not diff the two documents.
Diff ten of the forty-four rows it calls "unchanged."*

| v1 requirement | What v1 says | What this document says | Disposition |
|---|---|---|---|
| FR-O1 | *"…and session stop; **it reads agent narration from the transcript** as its primary intent signal"* | narration reading absent; `SubagentStop`, `StopFailure`, `SessionEnd` added | "unchanged" |
| FR-A4 | dedup **+** *"orientation-genre candidates decay out of consideration once the agent is deep in the task"* | dedup only | "unchanged" |
| FR-A5 | *"confidence × estimated decision-impact"*, **+ rises in degraded mode**, + the evidence floors | a **three-term** product; no degraded rise; floors split into new identifiers | "unchanged" |
| FR-K1 | + *"v1 language scope is TS/JS/TSX and Python behind a language-agnostic interface `[D-15]`"* | no language scope at all | "unchanged" |
| FR-K2 | five hygiene rules, first of which is *"exclude merge commits"* `[MSR-04]` | *"**Two** mining rules are requirements"* | "unchanged" |
| FR-X5 | *"no network access **beyond the §6.2 model call**"* `[LLM01]` | *"no network access at all"*, re-sourced to `RETHINK.md:321–323` | "unchanged" |
| FR-M2 | failure classes include *"persistent model-path failure"* | that class absent | "unchanged" |
| FR-O6 | *"a whisper **is delivered** to the consumer whose event fired"*; per-consumer budgets | keys state, **delivers nothing** against non-main consumers | "unchanged" |
| NF-3 | + *"first build on a mid-size repo must not require network access beyond what the harness already has"* | first clause only | "unchanged" |
| C-1 | + a named satisfying stack with `[NODE]` verification and the FTS5 caveat | no stack, three new properties `[P0-D-13]` | "unchanged" |

Most of these narrowings are *correct* for Phase 0 — that is not the finding. The
finding is that §3 has a dedicated table titled **"In force but narrowed here
(4)"** with a "Where stated" column, and ten more narrowings exist that are not in
it. A builder who trusts §3 — which is what §3 asks of him in its own opening
sentence — builds FR-O1 with narration reading and FR-K2 with five hygiene rules,
because §3 told him nothing changed. And a reviewer using §3 as the closure
inventory for the next round inherits the same false baseline.

The prior pass's F15 was classified *"unverified (a false claim about the
document's own contents)"*. This is that class, in the section written to close
F8, one round later.

**Class: unverified.**
**Fix:** move every narrowed requirement into the "narrowed here" table with its
narrowing and where it is stated, or add the narrowing to the requirement's own
text. Ten rows, mechanical.

### N3 — FR-A5a and FR-A5b are new `FR-*` identifiers, minted in a namespace the header says this document does not mint in, and absent from §3's disposition of all 65. COLLAPSES.

**Decision attacked:** the header — *"`FR-*`, `NF-*`, `C-*` and `P-*` are the v1
spec's; **this document does not mint new ones in those namespaces.**"*

**The collapse question:** *read §8.*

§8 contains **FR-A5a** (warn-grade evidence floor) and **FR-A5b** (zone-warning
exemption). Verified against the v1 spec by reading §7.3 in full: v1 has FR-A1
through FR-A9 and the only lettered suffix anywhere in it is FR-O4a. There is no
v1 FR-A5a and no v1 FR-A5b.

Two consequences that are substance:

1. **They are outside §3's partition.** §3 disposes of "the 65 `FR-*`/`NF-*`/`C-*`
   requirements" — 44 + 4 + 17. FR-A5a and FR-A5b are requirements of this
   document with no disposition row, so the section that claims to state every
   requirement's Phase 0 status does not state theirs. The requirement set this
   document governs is 67, not 65, and nothing says so.
2. **They are load-bearing and cross-referenced.** AC-1, AC-4, AC-7 and AC-11 all
   cite them, and FR-A7's Phase 0 narrowing (`[P0-D-8]`) is defined entirely by
   reference to *"the FR-A5a warn-grade floor."* A downstream artifact resolving
   `FR-A5a` against the v1 spec — which the header instructs it to do for every
   `FR-*` — finds nothing.

The parent puts both floors *inside* FR-A5. Splitting them out is a reasonable
editorial act; doing it inside a namespace the same document declared closed, and
then attesting to a 65-requirement partition that omits them, is F15's class again.

**Class: unverified.**
**Fix:** rename to `P0-5`/`P0-6` (this document's declared namespace) and give
them §3 rows, or fold them back into FR-A5 and record the whole of FR-A5 as
narrowed per N2.

### N4 — §4's closed two-source table decided the requirement set. Merge-commit exclusion lost its requirement and its source; the support ≥ 2 suggestion floor lost its source; AC-24 still tests the missing requirement. COLLAPSES.

**Decision attacked:** §4 — *"No other external source is cited, because no
requirement depends on one."*

**The collapse question:** *AC-24 requires that a merge commit contributes no edge.
Name the requirement it verifies.*

There is none. FR-K2 states **two** mining rules — the 30-entity cap and the
history horizon — where v1 FR-K2 states five, the first being *"exclude merge
commits (they duplicate and falsely relate changes) `[MSR-04]`."* AC-24 then reads:

> A fixture history containing **a merge commit**, a transaction touching more
> than 30 entities, and a transaction older than the horizon yields a graph in
> which **none of the three** contributed an edge.

So a criterion of this document's own tests a property no requirement of this
document states and no cited source grounds. That is the inverse of the gap §3 was
built to close: not a requirement without a criterion, but a criterion without a
requirement.

**And the size cap does not cover it.** I verified the ROSE sentence the document
quotes to ground the cap, against the primary source. Its subject *is* merge
exclusion:

> In a CVS archive, the merge of a branch is not reflected explicitly; instead,
> the merge becomes a large transaction which includes all the changes made in the
> branch. In order to detect coupling within transactions, one must avoid the
> large merge transactions. ROSE does so by ignoring all changes that affect more
> than 30 entities.

The 30-entity cap is ROSE's *proxy* for merge exclusion in an archive where merges
are not recorded. Git records them explicitly. A merge of fewer than 30 entities
passes the cap and contributes exactly the spurious edges the quoted paragraph
exists to prevent — and coupling is the genre AC-1 and FR-A7 make the tool's first
impression. So the document quotes a merge-exclusion paragraph to ground a size
cap, having deleted merge exclusion, on a platform where the proxy is unnecessary
and incomplete.

**The same inversion hits the suggestion-grade floor.** FR-A5a states *"never
below support ≥ 2"* and grounds the neighbourhood with ROSE's support-1 /
confidence-0.1 measurement (verified verbatim: *"a feedback of 0.64 and a
precision of 0.30"*). But support ≥ 2 is not ROSE's number; in v1 it comes from
`[HH-04]` (*"raw co-change association is ~6% precise"*). With `[HH-04]` dropped
from §4, the only floor governing the loosest evidence the tool can speak is an
unsourced integer in a document whose §4 says no requirement depends on a source
it does not list.

The prior pass diagnosed this exact mechanism in F6 — *"the document's source list
decided its requirement set, rather than the other way round"* — and F6 is
otherwise closed. The mechanism moved to two other requirements.

**Class: reduction.**
**Fix:** restore merge-commit exclusion to FR-K2 and add `[MSR-04]` to §4; source
the support ≥ 2 floor to `[HH-04]` and add it; or delete AC-24's merge clause and
say in §2 that merge hygiene is deferred, naming what fills it. What it may not be
is tested-but-not-required.

### N5 — §2 gives one reason for all five narrowed genre arms. P0-1 contradicts it, and it is false for at least two of the five. COLLAPSES.

**Decision attacked:** §2's closing paragraph — *"Five genre arms are narrower here
than in the v1 FR-A2 definitions **because the record type each reads has no Phase 0
writer (P0-1)**."*

**Collapse question 1:** *P0-1 is the citation. Read it.*

> **P0-1** — The FR-K3 exemplar, FR-K4 landmine and FR-K5 invariant schemas … exist
> in Phase 0 with their provenance constraints. **Phase 0's only writer for them is
> FR-L6 promotion.**

A writer exists. AC-20 and AC-26 both assert it works: *"a statement entered per
FR-L6 lands in the matching schema with human provenance."* So the stated reason —
*no* Phase 0 writer — is contradicted by the very item cited to support it. The
true reason is narrower: no *automated* writer, so the tables are empty unless the
owner types into them. That distinction has already cost this project a
correction; `STATUS.md` (2026-07-31) records it verbatim: *"What is Phase 2 is
automated mining, which is a different claim."*

**Collapse question 2:** *name the record type consequence's historical-breakage arm
reads.*

It reads none of P0-1's four. *"Edits here historically break
`tests/settings.test.ts`"* (`RETHINK.md:166`) is a join of the co-change graph
(FR-K2) against test topology (FR-K1) — **two stores Phase 0 builds and
populates**. The prior pass said this in F2 and it was not answered; the arm is
still deleted and now carries a stated reason that does not apply to it.

**And one listed item is not a record type at all.** Orientation's *"token cap"*
(v1: ≤ 400 tokens) is a bound, not a table. It cannot lack a writer. Dropping it
matters: FR-A3 caps the *session* at 2,000 tokens and FR-D1 caps a whisper at five
sentences, so nothing bounds the orientation whisper specifically — the one
whisper that arrives before the agent has done anything, and the one
`RETHINK.md:163` capped by name.

**Class: unverified.**
**Fix:** give each of the five arms its own reason. For the three that genuinely
read empty tables, say "no *automated* writer." For historical breakage, either
build it (both stores exist) or state the real blocker. For the token cap, restore
it or record its removal as a decision with a rationale.

### N6 — Orientation's landmine arm is gone from §7, gone from §2's list of narrowed arms, and still has a mechanism in P0-1. COLLAPSES.

**Decision attacked:** §7's Orientation row — Content: *"entry points for the task."*

**The collapse question:** *v1 FR-A2 gives orientation three things. §2 records two
as narrowed. Name the third and find where it is recorded.*

v1: *"2–4 entry points, the invariant that will matter, **landmines matching the
task shape**; ≤ 400 tokens."* §2 records the invariant arm and the token cap.
**The landmine arm is recorded nowhere** — not in the content cell, not in §2's
narrowing paragraph, not in the exclusion table, not in §13.

It is worse than an omission, because the document still contains the mechanism.
P0-1: *"literal-match landmine detection is **a read** over indexed content, not a
writer."* That sentence was added this round to close the prior F4 — it exists
solely to describe how orientation's landmine arm works — and the arm it describes
was removed from the genre in the same rebuild. The document now carries a
mechanism for an arm it does not have.

This is the prior pass's F2 reproduced one arm over, in the *only* Phase 0 genre
whose whisper reaches the agent before it has taken any action. The collapse log's
standing lesson from this same day: *"A table is not a summary — every cell is a
claim."*

**Class: reduction.**
**Fix:** restore landmines to the orientation content cell (the mechanism is
already specified in P0-1, and human-entered landmines are writable per FR-L6), or
add it to §2's narrowed list with the condition that fills it — and reconcile
P0-1's sentence either way.

### N7 — Phase 0 has exactly one human-authored writer and zero readers for what it writes. COLLAPSES.

**Decision attacked:** FR-L6 + P0-D-2 (*"Human facts enter Phase 0 through the
CLI"*) together with §2's narrowing paragraph.

The prior F3 asked two questions. The second — *what mechanism turns a human
sentence into a typed record?* — is now answered: the CLI (§12, P0-D-2, AC-20).
That half is genuinely closed and it was the harder half.

**The first question is now unanswerable, and this rebuild is what made it so:**
*name the Phase 0 genre that can speak a fact the owner stated.*

FR-L6 promotion writes landmine (FR-K4) and invariant (FR-K5) records. After §2's
narrowing:

- orientation's invariant arm — removed;
- orientation's landmine arm — removed (N6);
- warning's landmine arm — removed;
- completeness's invariant arm — removed.

Those are the four arms in the whole tool that read a landmine or an invariant.
All four are gone. So Phase 0 asks the owner — a non-programmer, per
`RETHINK.md:355–359` — to type facts into a CLI that no whisper can ever deliver.
AC-20's pass condition is that the record is *"retrievable"*; retrievable by
nothing.

FR-L6 is filed in §3 as **in force, unchanged**, and P0-D-2's justification for
keeping it is that the records it feeds *exist* in Phase 0. That is the collapse
log's named signature inverted: not a hard part with no producer, but **a producer
with no consumer**, defended by the existence of the table between them.

**Class: mechanism-not-mission.**
**Fix:** two honest forms, one of which shrinks Phase 0. Either restore one arm
that reads these records — orientation's landmine arm is the cheapest, its
mechanism is already written in P0-1 — or move FR-L6 to Phase 1 with the arms that
consume it, delete AC-20, and state in §2 that Phase 0's Tier 1 tables ship empty.
What may not stand is a CLI command whose output nothing reads.

### N8 — Three requirements compound to near-silence on exactly the run that constitutes Phase 0's exit and produces every number Phase 1 is tuned from. COLLAPSES.

**Decision attacked:** `[P0-D-8]` (FR-A7's Phase 0 set is coupling *at the
warn-grade floor*), read against FR-A5a, FR-A6 and §14's exit clause.

**Mission sentence available:** §1's — *"running it is the only way to obtain
evidence about how often the oracle should speak."*

**The collapse question:** *Phase 0 exists to produce that evidence. On a fresh
repository, in a project's first sessions, how many whispers does it produce?*

Compose the three requirements the document states, all verified against source
this pass:

- **FR-A7** restricts a project's first sessions to two candidate types: the
  generated-file warning and *coupling at the warn-grade floor*.
- **FR-A5a** quantifies that floor from ROSE: *"The feedback is 3 percent"* — the
  document's own quotation — and *"the percentage of missed alarms is on average
  97 percent."*
- **FR-A6** silences history-backed genres entirely below the corpus floor, which
  a fresh repository is by definition near.

The remaining channel is the generated-file warning, which fires only when the
agent edits a build-output file. FR-A5a notices half of this in isolation — *"it
bounds how much warn-grade evidence Phase 0 can produce"* — and `[P0-D-8]` then
makes warn-grade the **only** grade available during precisely the window §14 uses
as the exit: *"a run on a real project."*

The mission cost is not "the tool is quiet." Quiet is the posture (P1, FR-A1) and
it is correct. The cost is that **the phase whose justification is measurement is
configured to produce almost no measurements on the run that certifies it**, and
three of Phase 0's four emitted quantities (silence rate, latency distribution,
continuation count, suppression count) are uninterpretable at n ≈ 0 —
`RETHINK.md:273–275` says a silence rate is interpretable only against a hit rate,
and Phase 0 has no hit rate by design (`[P0-D-12]`). AC-19 compounds it: it
requires an oracle-unaware agent to *"receive whispers throughout"* a task, which
FR-A7 may make unsatisfiable in a first-session fixture, and AC-19 does not say
whether its fixture is inside the first-sessions window.

The remedy is **not** to loosen a floor — that is a bar argument the evidence has
not licensed, and the collapse log's 2026-08-01 lesson 2 forbids settling it in a
build plan. The remedy is to make a low-yield run legible instead of passing.

**Class: wrong-check.**
**Fix:** state in §14 what a passing exit run must have produced, not only what it
must not have produced — e.g. that `ctxoracle status` reports the whisper count
and that a run producing none is not an exit, it is a result requiring the
first-sessions count or the corpus floor to be re-set from the data. And state
FR-A7's configured session count (N9), without which "the first sessions" is not a
window anyone can size.

### N9 — P0-D-4 certifies that FR-A7 carries a stated value. It does not. By P0-D-4's own reasoning FR-A7 is untestable, and AC-11 tests it. COLLAPSES.

**Decision attacked:** P0-D-4 — *"FR-A3's budget and **FR-A7's session count carry
stated values**, without which NF-2 is unfalsifiable and **FR-A7 untestable**."*

**The collapse question:** *read FR-A7 and quote the number.*

> **FR-A7** — **First impressions.** In a project's **first configured number of
> sessions**, only the highest-confidence candidates speak…

There is no number. FR-A3's 2,000 is stated; FR-A7's count is not. A decision entry
asserts a property of a requirement that the requirement does not have — the R4-9
systemic class the 2026-07-31 register names, *"cross-references certifying what
their targets do not carry."*

The consequence is not cosmetic, because P0-D-4 supplies the argument against
itself: **without a stated value, FR-A7 is untestable** — and AC-11 tests it
anyway (*"In a project's first configured sessions…"*), with the fixture free to
pick any number. The same applies to FR-A6's *"configured minimum of mined
history"* and to FR-A5's *"the bar ships high"*, which is the single most
load-bearing quantity in the tool and has no value, no decision entry, and no
criterion.

**Class: unverified.**
**Fix:** state FR-A7's default session count with a `[P0-D-n]` of the same class as
`[P0-D-14]`; state FR-A6's corpus minimum; and either state the bar's shipping
value or say explicitly in §13 that the bar is the architect's to set from the
candidate scoring scheme, so a reader is not left thinking P0-D-4 covered it.

### N10 — P0-3's stop-bar delta "defaults to its top decile" — a distribution-relative default with no distribution, no source and no criterion, on the one capability the owner personally ruled must-have. COLLAPSES.

**Decision attacked:** P0-3 — *"the ordinary bar plus a configured delta,
**defaulting to its top decile**."*

**The collapse question:** *the top decile of what population, on the first run?*

There is none. A decile is a statistic of a candidate-score distribution, and
Phase 0's entire justification (§1) is that no such distribution exists until it
runs. On first execution the default is either uncomputable or silently degenerate
(a bootstrap sample of one). `[P0-D-9]` justifies *reporting* the delta's effect —
correctly, and that half closes the prior F14 — but says nothing about the value.
It has no source, and `CLAUDE.md`'s standard is explicit: *"Numbers without sources
don't go in."* P0-D-4 states the pattern this project uses for exactly this case
(a stated judgment value, expected to move once Phase 0 has run) and P0-3 does not
follow it.

No criterion pins it either: AC-10 asserts that *some* candidate below the raised
bar is recorded as suppressed, which any delta > 0 satisfies.

It matters because this is the mechanism that decides how much of `[OWNER-12]`'s
must-have capability actually reaches the agent. `RETHINK.md:379`: the ruling *"is
**not** a ranking of this moment against the others."* An unevaluable delta is a
ranking made by whatever the implementer picks.

**Class: mechanism-not-mission.**
**Fix:** a stated scalar default with a `[P0-D-n]` of P0-D-4's class ("tunable,
default: no delta" is an honest option and is the one that spends nothing the
owner did not approve), plus a criterion that the configured delta is what
suppresses.

### N11 — FR-A5a's cost sentence stops one clause short of the source, and calls the figure by the name the source gives the omitted clause. PARTIAL.

**Decision attacked:** FR-A5a — *"**Its cost is recall**: at that same operating
point *'The feedback is 3 percent'* and *'the percentage of missed alarms is on
average 97 percent.'*"*

Both quotations are verbatim — I verified them against the extracted PDF. The
defect is what sits between and after them. The paper's bullet reads, in full:

> The feedback is 3 percent and **the average recall is about 75 percent**. This
> means that for only one out of every 33 missing items … ROSE issues a warning;
> the percentage of missed alarms is on average 97 percent. **However, for those
> cases where ROSE issues a warning, it predicts 75 percent of the items that are
> actually missing.**

Two things follow. First, **"recall" is the paper's name for the 75% figure**, and
the document applies that word to the 97% figure, which is the complement of
*feedback* — the firing rate. Under the paper's own vocabulary FR-A5a's cost is
low feedback, not low recall; recall at that operating point is high. Second, the
omitted clauses are the favourable half of the same bullet, and they change the
reading: the channel fires rarely **and is thorough when it fires**.

The commit that added this text was fixing an expert-review finding that the
document *"quoted only ROSE's benefits."* The correction quoted the costs and
dropped the qualifier attached to them — the collapse log's own named failure,
*"quoting a paragraph to the em-dash where the continuation reversed the reading."*

It matters to N8: the honest cost statement is "this channel speaks on ~3% of the
opportunities," which is a **volume** claim about Phase 0's evidence yield, and
that is the axis N8 attacks. Calling it recall points the reader at quality
instead.

**Class: wrong-check.**
**Fix:** state the cost as feedback (firing rate), quote or paraphrase the
"However…" clause, and keep the 75% recall figure — it is the strongest thing the
source says about this operating point and the document currently omits it.

### N12 — §3 says v1's P1–P9 govern Phase 0 unchanged. P0-3 builds the whisper that falsifies P2, and the owner's ruling qualifying P2 does not land in this document. PARTIAL.

**Decision attacked:** §3 — *"v1's P1–P9 govern Phase 0 unchanged."*

v1 **P2**: *"The oracle never blocks a tool call, never denies an action, never
mutates the repository. **Its worst possible outcome is a wasted sentence.**"*

v1 §6.1, from the same contract fact `[OWNER-12]` rests on: *"So a whisper
delivered at `Stop` does not cost 'a wasted sentence' (P2); it costs the agent a
turn it was trying to end."*

This document contains both sides and reconciles neither: §3 asserts P2 unchanged;
P0-3 states that a stop-grade whisper is *"the only whisper that spends a turn
rather than riding a boundary."* Phase 0 is the phase that builds it.

The collapse log's standing lesson from round 1, written after this exact ruling
failed to propagate once already: *"when a finding produces an owner ruling, the
ruling lands in every artifact the lifecycle consumes — not only in the one where
the question was raised. A requirement that arrives between rounds inherits no
reviewer."* This is that lesson's second instance, in the first artifact written
after it.

**Class: unverified.**
**Fix:** one clause in §3 — P1–P9 govern unchanged **except P2, whose
worst-outcome clause is qualified for stop-delivered whispers by `[OWNER-12]`, and
which P0-3 implements.**

### N13 — §4 confirms `additionalContext` for three delivery events and omits `Stop`; and omits the `SessionEnd` budget, which constrains C-2, AC-23 and FR-O3. PARTIAL.

**Decision attacked:** §4's hooks row and its "Confirmation" column.

The column confirms `additionalContext` for `PreToolUse`, `PostToolUse` and
`UserPromptSubmit`. Phase 0 delivers on a fourth event: `Stop`, carrying
completeness and verification (§7) and the whole of P0-3. It is not confirmed.

The capability is real — I verified it this pass: *"Stop and SubagentStop also
accept `hookSpecificOutput.additionalContext` for non-error feedback that
continues the conversation."* So the finding is evidentiary, not factual: the
document's own evidence does not establish the delivery path for the genre set the
owner personally ruled must-have, which is F12's shape moved one event over.

**The same row omits a contract fact that actively constrains a Phase 0
requirement.** Verified this pass:

> `SessionEnd` hooks of any type share a **1.5-second budget**. If your settings
> set a longer per-hook `timeout`, Claude Code raises the budget to match, up to
> 60 seconds.

C-2 makes `SessionEnd` the teardown signal; AC-23 requires teardown to happen
there; FR-O3 sets a 3 s ceiling the harness will not honour on that event unless
`init` writes a `timeout` — and C-4 says `init` is *"explicit and minimal"* with no
mention of it. The v1 spec §6.1 records this fact and its consequence in full, and
the collapse log carries it as a round-2 expert-review finding (*"`SessionEnd`'s
1.5 s budget breaks the global shim deadline"*). It was verified, logged, and lost
in the rebuild.

**Class: unverified.**
**Fix:** add the `Stop` confirmation and the `SessionEnd` budget to §4, and either
state that `init` writes an explicit `SessionEnd` timeout (which AC-6's settings
accounting must then include) or state that teardown must complete in 1.5 s.

### N14 — FR-A6 is per-region in the requirement, per-corpus in its decision entry, and per-corpus in its criterion. PARTIAL.

- **FR-A6:** *"Below a configured minimum of mined history **for a region**…"*
- **P0-D-7:** *"a **thin corpus** produces pairs with high support and perfect
  confidence."*
- **AC-4:** *"in a fixture whose **total** mined history is below the corpus
  floor…"*

Three statements, two granularities, and the section heading calls it a **"Corpus
floor."** These are different silencing rules: a mature repository with one new
directory fails the per-region test and passes the per-corpus one, and a fresh
repository fails both. The prior F6 restored this requirement to close a real gap;
what it restored is now stated at a granularity its own justification and its own
test do not share.

**Class: wrong-check.**
**Fix:** pick one. P0-D-7's argument is corpus-level and AC-4 tests corpus-level;
v1 FR-A6 says per-region. If both are wanted, say so and give each a value.

### N15 — AC-10 requires two stop-class whispers at one stop, where FR-A3 permits one whisper per event and FR-O4a one continuation per stop. PARTIAL.

> **AC-10** — At stop, an untouched co-change partner draws a completeness whisper
> **and** a changed region with a verification command draws a verification
> whisper; **each** is recorded as a continuation event…

FR-A3: *"At most one whisper per event."* FR-O4a: *"extending a turn at most once
per stop."* Read literally, AC-10 requires a state FR-A3 and FR-O4a forbid. Read
charitably it means two separate stop events — but it does not say so, and it is
the criterion for the capability whose turn cost is the one thing the owner was
asked to accept.

Underneath the wording sits a real gap: **nothing arbitrates completeness against
verification at the same stop.** FR-A5 picks the top candidate by score, which is
an answer — but §7 presents both genres as firing at stop with no note that they
compete, and no requirement or criterion states which of a session's stops each
genre gets. Verification is stop-only, so if completeness reliably outscores it,
verification never speaks and no criterion notices.

**Class: wrong-check.**
**Fix:** rewrite AC-10 as two scenarios on two stops, and add a sentence to §7 or
FR-A3 stating that stop-class genres compete for the one whisper FR-A3 allows and
are ordered by FR-A5.

### N16 — FR-X5's no-network clause is cited to a RETHINK range that does not contain it, under the decision entry written to prevent exactly that. PARTIAL.

**FR-X5:** *"Least privilege: read-only repository access, no tool-invocation
authority in the agent's session, and — Phase 0 having no model call — **no network
access at all**. `RETHINK.md:321–323`."*

`RETHINK.md:321–323`, read: *"Corollary: the oracle must be safe to run on real
projects by construction — it never mutates the repo and never prevents an action;
its worst case is a wasted sentence."*

That supports read-only repository access. It says nothing about network access or
tool-invocation authority. v1's FR-X5 sources those to `[LLM01]` (OWASP least
privilege), which §4 does not carry.

The irony is load-bearing. `[P0-D-11]` exists to keep this from happening:

> FR-X7's no-outbound-traffic property is this document's, not `RETHINK.md`'s …
> **The property is derived from FR-X5's least-privilege posture and is stated here
> so the reader is not told a source says more than it does.**

The derivation chain is FR-X7 ← FR-X5 ← a RETHINK line that does not carry it. The
reader is told a source says more than it does, one link up from where the decision
entry is looking.

**Class: unverified.**
**Fix:** mark FR-X5's network and tool-authority clauses as this document's (or
restore `[LLM01]` to §4), and adjust P0-D-11 so its chain terminates on something
that holds.

### N17 — NF-2 and AC-18 require a fifth measurement that P0-4 does not enumerate and no requirement records. PARTIAL.

- **P0-4:** *"`ctxoracle status` computes and reports, from those logs: the silence
  rate; the added-latency distribution against FR-O3; the continuation count; and
  the count of candidates the raised stop bar suppressed."* Four.
- **`[P0-D-12]`:** *"Phase 0's measurement obligation is **the four quantities** it
  can compute from its own logs."*
- **NF-2:** *"Session token overhead … is reported by `ctxoracle status`."*
- **AC-18:** requires `status` to report all four **plus** *"session token overhead
  against FR-A3's budget."*

A fifth quantity is required by a non-functional requirement and by a criterion,
excluded by the decision entry that defines the obligation, and absent from the
requirement that enumerates what `status` computes. No requirement names its
recorder either: FR-M1's list (hook invocations, store failures, index refreshes,
delivery results) has no token count, and v1 §9.2's own metric table marks the
token-overhead row *"no requirement names a recorder — §14 … gap."* The prior F16
flagged this; the budget value was supplied and the recorder was not.

**Class: unverified.**
**Fix:** add injected-token count to FR-M1's or FR-X6's recorded fields, add the
quantity to P0-4, and make P0-D-12 say five.

### N18 — FR-L1 has no acceptance criterion. It is the one Phase 0 artifact a later phase is gated on, and nothing checks it exists. PARTIAL.

FR-L1 is in force in Phase 0 (§3) and records *"the candidates considered, the
whisper sent if any, and subsequent evidence that the agent acted on it."* No
criterion in §14 names it. AC-18 exercises the candidate half indirectly through
the suppression count; **the uptake-evidence half is checked by nothing.**

`STATUS.md` records that hit rate is the live blocker for Phase 1's exit and that
FR-L1's evidence is its input. So Phase 0 can pass all 27 criteria and hand Phase 1
an empty or unusable uptake log without any check firing. This was the prior pass's
closing recommendation (F5, item iv) and is the one part of it that did not land.

**Class: wrong-check.**
**Fix:** one criterion — after a fixture session containing a delivered whisper and
a subsequent agent action, the FR-L1 record for that event contains the candidates,
the whisper, and the uptake evidence, and is readable. It asserts presence and
readability, not a hit-rate judgment, which `[P0-D-12]` correctly declines.

### N19 — The warning genre's vendored arm has a trigger, no content shape, no floor disposition and no criterion. PARTIAL.

§7's Warning row fires on *"edit pending in a generated **or vendored** zone"* and
its Content column describes only build output: *"that the file is build output,
the evidence, **what overwrites it, where the editable source is**."* Vendored code
is not build output; nothing overwrites it and there is no editable source
elsewhere. FR-D3's format demands *"the concrete consequence"*, which for a
vendored file is a different consequence entirely (the change is lost on the next
dependency update, not the next build).

`FR-A5b` exempts *"the generated-file warning"* from the evidence floors by name;
whether the vendored warning is exempt is unstated, so the arm may be
unspeakable — a zone marker generates no co-change support, so under FR-A5a it
could never clear warn-grade. AC-7 tests only *"a detected generated file."*

**Class: reduction.**
**Fix:** either give the vendored case its own content shape and bring it under
FR-A5b explicitly, with a clause in AC-7 — or drop "vendored" from the trigger and
record it in §2 as deferred content with its filling condition.

### N20 — FR-A3's "warnings take priority" is an unsourced genre-ranking claim, removed for cause and restored eleven minutes later with no adjudication, and now hard-coded by a criterion of this document's own. PARTIAL.

**Decision attacked:** FR-A3 — *"Warnings take priority within that budget, never
exemption from it"* — and AC-27, which tests it.

The history is in the two commits. `91698c7` removed it: *"'warnings get priority
within the budget' was a genre-ranking claim with no source, against a standing
directive. Removed."* `332406c` restored it: *"FR-A3 had silently dropped v1's
'warnings get priority within the budget' while the header asserted identifiers
carry the same meaning. Restored, with AC-27."* Nothing in §13 records that the
first judgment was reconsidered, and the second commit's stated reason is
identifier fidelity, not substance.

**The collapse question:** *name the owner statement, or the mission line, that
ranks a warning above a coupling whisper when the budget is nearly spent.*

v1's FR-A3 carries the clause with no source — `[RETHINK §5]` grounds the hard caps
and `[D-10]` the 2,000 default; the priority clause is unsourced there too. RETHINK
§5's discipline rules do not mention it. Decision 3 calls generated-file protection
*"a loud warning whisper"* — "loud" is a format property (FR-D3's ⚠ marker), not a
budget precedence. And the collapse log's 2026-08-01 lesson 1 is a standing
directive in exactly these terms: *"no ranking claim about this tool's purposes,
genres, triggers or moments enters any document unless the owner stated it in those
words, quoted and attributed."*

Restoring an unsourced v1 clause for fidelity is defensible on its own. Adding
**AC-27**, a criterion of this document's own, is not the same act: it converts an
unsourced ranking into a build-time invariant with a test behind it, in a phase
whose §14 exit is the certificate four later sessions will cite. And FR-A5's bar is
the mechanism this project has repeatedly ruled belongs to this question — per
candidate, at runtime, tunable (collapse log 2026-08-01 lesson 2).

**Class: posture.**
**Fix:** keep the clause for v1 fidelity if that is the call, but record it in §13
as an inherited unsourced ranking with the two commits' disagreement resolved in
writing; and reduce AC-27 to what is sourced — that once the budget is spent, no
further whisper is delivered *including a warning* (which is FR-A3's "never
exemption" half, and is the half that follows from the budget being hard).

### N21 — C-1, C-3, C-5, FR-D4 and P0-2 have no criterion, and C-1's three properties were minted expressly to make cold-container readiness testable. PARTIAL.

`[P0-D-13]` is explicit about why C-1 was rewritten:

> No-native-toolchain, no-prebuilt-download and no-extra-network are **the
> properties that make "runs in a cold container" testable**.

Nothing tests them. Nor is there any evidence that a satisfying stack exists: v1's
C-1 named one (Node ≥ 22.13.0 with built-in `node:sqlite`, `[NODE]`-verified,
with the FTS5 caveat) and this document removed it, replacing it with *"Any
satisfying runtime and storage engine are acceptable."* The result is an existence
claim with no witness, for the constraint that decides whether Phase 0 is buildable
at all.

Also uncovered: **C-3** (harness knowledge confined to the shims — the property
that keeps other harnesses open), **C-5** (shims degrade to silence on contract
drift — the control for the hooks contract this document's own §4 says has already
drifted once), **FR-D4** (human notices never consume agent context), and **P0-2**
(no degraded-mode delta, no degraded-mode notice — the finding that produced the
whole Phase 0/degraded-mode separation, now untested).

The prior pass established that a criterion set which tests only firing and
harmlessness is the failure shape here. Five constraints and requirements with no
check is the same shape at the constraint layer.

**Class: wrong-check.**
**Fix:** criteria for C-1 (an install-and-index run in a container with no
toolchain, no downloads and no network), C-5 (a fixture presenting a drifted
contract yields silence, not an error), and C-3 (static inspection finds no
harness-specific identifier outside the shims — AC-22 already does static
inspection of the shims and can carry it). FR-D4 and P0-2 can ride existing
criteria with one clause each.

---

## Minors

- **M1 — §2's header is falsified by its own Unknown row.** The intro promises
  *"each with the phase that owns it"*; the Unknown row's Owned-by cell reads
  *"Held open in the v1 spec §14"*, which is not a phase. The row is right (F11);
  the sentence above it needs "except where the v1 spec holds the phase open."
- **M2 — §2's subagent-delivery Reason cell still contains no reason.** It reads
  *"Phase 0 records a per-consumer key where an event carries one (FR-O6) and
  delivers to the main agent only"* — a restatement of the behaviour. The real
  reason is in v1 §14 (the subagent hook contract is unverified) and is nowhere in
  this document. The prior F9 raised this; the cell changed and the defect did not.
- **M3 — §4 names the reference page and quotes the guide page.** The source row
  cites `code.claude.com/docs/en/hooks`; the load-bearing `PreToolUse` quotation
  lives in `hooks-guide.md` (verified — it is *not* on `hooks.md`). C-5 makes the
  contract version-bound and re-verified, which requires knowing which page. v1's
  `[HOOKS]` key names both.
- **M4 — the bar's third term has two names.** This document calls it *marginal
  value*; v1 §12's "Phase 0's bar" paragraph — the passage that carries the F1 fix
  and states each term is computable without a model — calls it `self_serve_cost`.
  Neither document points at the other. A builder reading both cannot tell whether
  they are one term or two.
- **M5 — P0-D-1 downgrades FR-O5's grounding to a judgment** (*"The grounding is a
  judgment"*) while §3 files FR-O5 as in force **unchanged**, which carries v1's
  `[CHI-25]` (task-boundary intervention effective; idle-time triggering backfires).
  The requirement is better sourced than its own decision entry says.

---

## Self-serving check (mandatory — the inclusive direction has nothing watching it)

Collapse log 2026-08-01, lesson 10: *"after a run of kills the authoring instinct
learns that inclusive proposals survive — every safeguard here points at exclusion,
so an inclusive error has nothing watching for it."* This pass is checked against
itself:

- **N2, N3, N5, N9, N11, N12, N13, N16, M1–M5 cost nothing but accuracy.** Each
  says the document states something about itself, its sources or its terms that
  is not so. None adds capability. These are free and should be applied without
  argument.
- **N4, N6, N19 restore or record text the governing parent already contains.**
  Free in the direction of the precedence rule; N6 and N19 each have a cheaper
  honest form (record as deferred content with its filling condition) that costs
  nothing to build.
- **N7 is the only finding whose cheaper remedy makes Phase 0 smaller** — move
  FR-L6 to Phase 1 and drop AC-20. I flag it because it runs against this pass's
  own direction and is the honest option if the arms stay cut.
- **N1, N8, N10, N15, N17, N18, N21 add measurement, criteria or stated values to
  things already required.** These cost implementation work and are the ones to
  argue about. Each names a specific requirement in force whose value, bound or
  verification is missing — none proposes a new capability. N1 is the heaviest and
  its remedy is still only *state the fact and count the turns*; it does not
  reopen `[OWNER-12]`, and it must not be allowed to.
- **N20 is the one finding that argues for less.** It asks to weaken a criterion,
  not strengthen one. Priced here so it is visible as the exception.
- **Nothing in this pass proposes a new requirement.** The prior pass's F10 — the
  human-channel announcement — remains the only genuinely additive item on the
  table, and it is carried forward unchanged rather than re-argued.

---

## The single most dangerous unexamined assumption

**That the checks installed to stop this document lying about itself are not
themselves claims.**

Three sections were added this round for that purpose. §3 exists so a builder need
not diff against v1; its "unchanged" column is wrong ten times (N2). The header's
identifier rule exists so downstream artifacts need no translation; the document
breaks it twice, in the section the rule was written to protect (N3). §4's closed
source table exists so no requirement rests on an uncited source; it achieved
closure by dropping the two requirements that needed the other sources, and one of
them is still tested (N4). Each is a genuine improvement in form, and each was
attested rather than checked — the same act, one layer up, as the defect it
replaced.

The prior pass's most dangerous assumption was that a Phase 0 passing all its
criteria is a Phase 0 that works. That assumption is *better* now, not resolved:
AC-3 gives the mission's load-bearing clause its first test, and AC-4 gives the
floors a negative one. What remains is the shape N8 and N18 describe together —
Phase 0 can pass all 27 criteria, exit on a clean `ctxoracle status`, and have
spoken almost nothing, logged no usable uptake evidence, and produced four cost
numbers with no denominator; and that certificate is what tunes Phase 1's bar.

**What would test it, and is writable today:** the exit clause in §14 names what a
passing run must *not* contain. Add one sentence naming what it must contain — a
whisper count and an FR-L1 record that a human can read — and the phase whose
purpose is measurement acquires its first measurement of itself.

---

## Method note

Premises re-derived from primary source in this pass, not inherited from the prior
review or from commit messages:

- **ROSE (TSE 31(6), 2005)** — PDF fetched from the author's copy, text extracted
  locally, all eight quoted strings and both figure pairs matched verbatim,
  including the two sentences the document does *not* quote (N11).
- **Claude Code hooks contract** — `code.claude.com/docs/en/hooks.md` and
  `hooks-guide.md` fetched 2026-08-01. Confirmed: the `PreToolUse` exit-0
  quotation is verbatim on the guide page and absent from the reference page; Stop
  and SubagentStop accept `additionalContext`; `SessionEnd` hooks share a
  1.5-second budget raisable to 60 s by an explicit per-hook `timeout`;
  `UserPromptSubmit` lowers the 10-minute default to 30 s; `Stop` hooks fire
  whenever Claude finishes responding, not only at task completion; the
  8-continuation override and `stop_hook_active` behave as FR-O4a assumes.
- **v1 identifier set** — enumerated by reading §7.1–§7.8, §9 and §10 of
  `spec-context-oracle.md` directly; 65 confirmed, and §3's three sets confirmed to
  partition it exactly.
- **`RETHINK.md` citations** — every line range cited by the Phase 0 spec was read
  against current source. All resolve to text supporting their claim **except**
  `:321–323` at FR-X5 (N16). The remainder — `:15–24`, `:59–61`, `:77–78`,
  `:130–134`, `:138`, `:169–171`, `:175–176`, `:177–178`, `:179–181`, `:187–188`,
  `:190`, `:195`, `:196–197`, `:198–199`, `:278–279`, `:291`, `:314–323`,
  `:324–327`, `:330–334`, `:342–344`, `:350–354`, `:355–359`, `:363–379`,
  `:393–399` — hold.
