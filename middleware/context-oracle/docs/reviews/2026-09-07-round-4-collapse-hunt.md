# Independent collapse-hunt, round 4 — Phase A implementation plan (2026-09-07)

**Artifact:** `docs/plans/plan-phase-a.md` as installed in the working tree at
commit `6a2159b` (8,160 lines; last changed by that commit — the two later
commits on the branch, `4b4d22f` and `cace4f3`, touch `docs/collapse-log.md`
and the probe layout lockfile only; `md5 62daa4f3…` at the time of every read
below). §7 has 40 steps, each opening with a `step-decl` block; §10 has
D-plan-1..26 and §10A one collapse-test per decision; §12 has 122 test
specifications — counts re-derived by `derive-plan-sections.mjs --check`
this session (`OK: 40 steps, 13 elements, 122 test specs, 17 probes cited,
regions current`). The probes under `docs/plans/plan-phase-a.probes/` (17
scripts, 17 expectations, `layout/prepare.sh`) were read in full and
executed twice through `run-plan-probes.mjs` against the prepared layout at
`/tmp/claude-0/probe-layout` (Node v22.22.2). The round chain: round 1 =
`docs/reviews/2026-09-06-plan-collapse-hunt.md` and
`2026-09-06-plan-expert-review.md`; round 2 = the two `2026-09-07-round-2-*`
reviews; round 3 = `2026-09-07-round-3-collapse-hunt.md` (23 findings) and
`2026-09-07-round-3-expert-review.md` (20 findings). The author applied every
round-3 finding and converted the plan to the expert-plan skill's
declaration grammar (`references/output-contract.md`, read in full); the
author's closure table and self-check, `2026-09-07-round-4-author-gates-review.md`,
was read and no claim in it was trusted — every closure in (c) is re-derived
from the working-tree text, and where the self-check and the source disagree
the source is used. The two planning-tool trace files were opened, their
decision labels enumerated (file 1: D1–D10 incl. D2b; file 2: D-plan-2, 4, 5,
6, 8, 10, 13, 15–26; 51 `sequential_thinking` + 5 `decision_framework`
calls), and the concluding thoughts of the re-run decisions read against §10;
their reasoning quality was not re-audited.

**Axis:** mission fidelity only — `middleware/context-oracle/CLAUDE.md`
dominating rule 2 (the collapse test: hardest skeptic question → answer
citing a spec/mission line → what it steers toward; guide informing, never
gate policing) and rule 3 (does each decision serve the Phase A goal: *an
honest deterministic foundation, running on the owner's real repos, that
measures its own floor — how little it catches — with clean seams the later
phases plug into; never fake completeness dressed to look like a working
product*). The plan is additionally graded against the output contract it
is now written under, because that contract is what the round-4 process
rests on. Style and hygiene are not attacked; a hygiene defect is reported
only where it makes a mission-load-bearing step or test unbuildable or a
measurement false.

**Reviewer independence:** a fresh subagent that did not write the plan, the
architecture, the skill, or any prior review, and was not shown any round-4
expert-review.

**Read in full before attacking, in the dispatcher's order:** `CLAUDE.md`
(238 lines); `OWNER-LEDGER.md` (80); the spec §1–§14 (1,138); the
architecture (2,058: V1–V19, AD-1..AD-26, threat model, traceability, L1–L11);
`docs/collapse-log.md` (the 2026-09-07 diagnosis, 2026-09-04, 2026-09-03
rounds 6–9, 2026-08-29, 2026-08-28 ×2, 2026-08-25 ×2, 2026-08-16, 2026-08-13,
2026-08-12, 2026-08-01 ×3); `references/output-contract.md` (132) and
`references/testing-standards.md` (141); `docs/IDEAS.md` #14; the four
prior reviews and the author's round-4 self-check in full; the plan end to
end in eighteen contiguous reads (§1–§16, every step, every §10/§10A entry,
every §12 entry, §13–§16); every probe script and expectation. The round-3
revision (`git show d667534:…/plan-phase-a.md`, 7,106 lines) was extracted
to the scratchpad and read at every passage needed to decide provenance
(test IDs renamed `T<n>-<m>` → `T-<n>-<m>` in the conversion; compared by
meaning).

**Method.** (1) For each of the 26 §10A entries: read the author's step-2
question, write a more hostile one the author would not have picked, test
the step-3 answer against it with only spec / architecture / ledger /
collapse-log / output contract as ground. (2) Hunt for load-bearing
decisions §10A cannot see: the declaration grammar the plan was converted
into and what its mechanical check actually establishes; cross-step
interactions; any elaboration of Steps 21–27 beyond AD-9 (read line by line
against `arch:736–922`); pinned versions and scope; any §12 test that cannot
fail, cannot be built as written, or contradicts the step it verifies; any
Step 39 measurement that measures the harness or the agent instead of the
system. (3) Re-derive closure of all 43 round-3 findings from the current
text and hunt for defects the round-3 corrections introduced — text that
differs from `d667534` and is wrong, or a sentence unchanged from `d667534`
whose referent the correction moved, is tagged **REGRESSION (introduced by
the round-3 corrections)** with the `d667534` line and the mechanism named.
(4) Every finding quotes the plan line(s) and the contradicting source
line(s). Search located; reads verified. Six claims were attacked by
execution in this environment — the probe runner twice (one failure, one
pass), probe 07 six further times directly, two declaration-patching
experiments against `derive-plan-sections.mjs --check`, and a fetch of the
current hooks reference (2,817,580 bytes, tag-stripped and read at the
workspace-trust and cadence passages) — each recorded at the finding that
rests on it.

**Verdict: DOES NOT SURVIVE.** 2 Serious, 8 Moderate, 12 Minor findings; 11
are REGRESSION-tagged. Of the 26 §10A decisions, 1 collapses (D-plan-26), 3
partially collapse (D-plan-5, D-plan-10, D-plan-24), 22 survive the harder
question (ten with a note). The answer-drift block (Steps 21–27) was read
against AD-9 line by line and still elaborates nothing on the intake or move
axes; the one deviation is in the clear axis — a deferral vocabulary and a
substring clause rule that widen *holding* beyond AD-9's "I'll get to
that"-class and whose wrongful holds Step 26 then excludes from the only
automated detector (M-6). The two Serious findings are both in what the
round-3 corrections built: the step declarations the whole round-4 process
rests on are hollow — `depends_on` names `S1` alone for eighteen steps that
consume six to eight earlier steps each, and the contract's build-order
check is blind to consumption by function name, so it passes while hiding a
genuine document-order inversion (Step 9 consumes Step 11) — and the leg-2
protocol that the exit run's validity rule hangs on cannot be executed in
the environment the plan assigns it to (each remote session is its own
container, which the plan's own Step 39 says, yet "counted sessions" are
"on the same initialised clone" as the bootstrap session) and rests on a
misread of the hooks reference (the sentence quoted for settings-file hooks
is the reference's *subagent-frontmatter* rule; the settings-file rule says
the opposite for `-p`/SDK sessions).

**On the owner's regression rule.** Round 2 found ten correction-induced
defects, round 3 twelve (plus one partial). This round finds eleven — S-1,
S-2, M-1, M-2, M-3, M-4, M-5, M-6, m-1, m-2, m-12 — a third consecutive
round in which the correction pass introduced defects. The replaced process
did change the shape: the mechanical class the collapse-log's 2026-09-07
entry names (a step consuming an artifact a later step creates *by path*;
an executable claim written from arithmetic; a count left stale) is largely
gone, and where it recurs it recurs one level below the new check — a verb
consumed by name (M-2), a schedule that reproduces on the author's run and
not on one of two of mine (M-1), a `modify:` list the grammar accepts as
empty (M-3), a fixture the generator cannot build at the step that declares
it (M-4). The larger pattern is the round-3 shape again: reviewer
prescriptions transcribed one decision short of correct (S-4's "state the
mechanism executably" became a protocol the sessions cannot satisfy; the
round-3 CH S-4 quotation of the trust rule was replaced by the wrong
sentence; ER m10's "name the direct dependencies" became declarations that
name fewer) and a check installed to close a class (the declaration grammar)
whose own reach was not tested against the plan's actual consumption
vocabulary — the 2026-08-01 lesson that a newly-added device asserting a
property of the whole document is the first thing the next round verifies.

---

## (a) The 26 harder questions

Format per entry: the author's step-2 question (summarised), the harder
question, the verdict, and the ground.

### D-plan-1 — build order. **SURVIVES (with note).**
*Author's Q:* reordering does not constrain who elaborates the recognizer.
*Harder Q:* §7's opening claim is "Steps are topologically sorted: a step's
`Dependencies` field names every earlier step it consumes" (682–683), and
every step's prose field now reads "Declared above (`depends_on`)". Step 25
declares `depends_on: [S1]` (2818) while its text consumes `TranscriptReader`
(Step 21), `openQuestion`/`voidQuestion`/`answerQuestions` (Step 22),
`recognizeQuestions`/`recognizeClearing`/`recognizeMove` (Step 23),
`DenyVerdict` (Step 24), the `whisper_audit` DAO (Step 9) and the fault
writer (Step 10). Under what reading is the order "topologically sorted"
from its declarations, and what does the mechanical check that replaced the
hand-kept fields actually establish?
*Ground:* the order in document sequence is valid as far as reading goes
(each step's consumed modules appear earlier — with one exception, Step 9 →
Step 11, found under S-1), so the decision's job holds by the author's
reading, not by the declarations. The declarations are hollow and the check
is blind to consumption by function name (executed — S-1). Survives on the
document order; the property it now claims to have made mechanical is not
established.

### D-plan-2 — dependency pins. **SURVIVES.**
*Harder Q:* the `tree-sitter-wasms` 0.1.13 package declares a dependency on
itself (`^0.1.11`, §11.4 5571–5573); npm resolves it to the package on
install, but a future `0.1.14` publishing the same self-range would satisfy
it from the registry, silently pulling an unverified grammar set under an
exact top-level pin.
*Ground:* `npm ci` honours the lockfile (T-1-1, 5893–5907), probe 11 pins
the installed layout (36 grammars, no `.node` files, no install scripts),
and T-38-33 loads every default grammar at build. The pin's job — build the
verified surface — holds; a self-range drift would surface as a lockfile
diff, which D-plan-2 says is architecture work.

### D-plan-3 — test execution. **SURVIVES (with note).**
*Harder Q:* `run-tests.mjs` runs `execFileSync(process.execPath, ['--test',
...files])` (787) — `node --test` executes test files concurrently by
default, and three specifications are timing-bound (T-3-3's 100 ms busy
windows, T-10-2's ±5 ms, T-22-1's two contending children). The author's
own probe for T-3-3's schedule failed under the probe runner in this
session ("identical across 3 runs: false"). What in the runner keeps a
schedule that holds on an idle machine from becoming the "flake-tolerated"
anti-pattern on a two-entry CI matrix?
*Ground:* nothing — no concurrency flag, no isolation statement; the note
is M-1. The decision's own claim (compile once, count-guarded runner, must-
fail fixtures excluded — executed by probes 01, 03, 04) survives.

### D-plan-4 — record-identical comparison. **SURVIVES.**
*Harder Q:* the FTS5 tables are "compared by the result set of a fixed
`MATCH` query list" (4376–4377). A fixed list compares what it queries; an
FTS index whose content table round-tripped but whose shadow index did not
(a `VACUUM INTO` of an FTS5 external-content table needs no rebuild, but the
dump asserts nothing about rows the list does not hit) passes.
*Ground:* AC-19's text is record identity of the *stores*; the content
tables (`symbols`, `files`) are dumped row by row and the FTS tables are
derived from them by the indexer, so a divergence the `MATCH` list misses is
a rebuildable index, not a lost record. The decision's job holds; `import`'s
`quick_check` (3499–3500) covers structural corruption.

### D-plan-5 — generated fixtures. **PARTIAL COLLAPSE** → finding M-4 (REGRESSION).
*Harder Q:* Step 1's generator "build[s] real `git` repositories with `git
init`/`git add`/`git commit`" (759–763) and T-1-3 asserts at Step 1 that
"every fixture name §5.1 lists generates without error" (5926–5928, 5935).
§5.1 lists `test/fixtures/repos/large-store/` under Step 1, and Step 1 now
defines it as "a store of the AD-23/V8 class (≈400 MB: ≈2 M `cochange_pairs`
rows, ≈1 M `symbols` rows)" (801). Which schema does a Step 1 generator
write two million `cochange_pairs` rows into, twelve steps before Step 7's
migration exists and six before Step 3's adapter?
*Answer from source:* none — the fixture is a store, not a repository, and
nothing before Step 7 can create its tables. The "generated deterministically
from scripts" decision survives for the thirty-two git fixtures; it collapses
for the one fixture the round-3 m-5 correction made concrete, and T-1-3 goes
red at Step 1 on it. The "cached by the generator's hash, once per run
directory" clause also does not reach CI, where every run is a fresh
checkout (m-10).

### D-plan-6 — settings marker. **SURVIVES.**
*Harder Q:* the pattern `[\\/]dist[\\/]src[\\/]cli[\\/]dispatch\.js"? hook
<event>$` (3404) is prefix-free by design; an owner who has installed the
tool twice (a global shim and an `npx` cache, both real paths ending in
`dist/src/cli/dispatch.js`) gets both entries matched and removed by
`deinit`, and `init` re-run "repairs" the one whose `<node>` differs by
leaving it (3414–3416 — "an existing matching entry is left in place").
Two live entries fire two handlers per event.
*Ground:* two matching entries are two oracle installs, both the oracle's;
`deinit` removing both is AC-7's property, and AD-26 already assumes
concurrent handlers. The marker's job — what `init` writes is what `deinit`
matches, executed under four modes by probe 06 — holds. The pin liability is
D-plan-25's (survives with the m-6 note there).

### D-plan-7 — plan-seeded thresholds. **SURVIVES (with note).**
*Author's Q:* a forty-character floor would deny a correct "No.".
*Harder Q:* the floor is 2, so the clear axis is now decided almost entirely
by the two lists Step 12 seeds. `lexicon.deferral_stoplist` carries the
single word `later` and the fragments `first let me` / `in a moment`
(1835–1837), and Step 23 discards "every clause that contains a
deferral-stoplist phrase" (2655–2656) — a substring test (probe 16:
`low.includes(d)`). "The cron fires later." is one clause, contains `later`,
is discarded whole, and the turn does not clear; the reason code is
`deferral_only`, which Step 26 excludes from `deny_despite_answer_text`
(2938–2942). Which exit-report number counts that hold?
*Answer from source:* none — the hold is invisible to the automated
detector by construction and reaches the report only if Max Cogar files a
correction. The seed-and-print decision survives (every value is a labelled
`plan_seed` row, printed); the vocabulary it seeds creates a measured-nowhere
class — M-6.

### D-plan-8 — model seam. **SURVIVES (with note).**
*Harder Q:* the §10A answer says the scrub "was executed as shipped — three
runs, unscrubbed / session-identity set / everything" (5906–5908) and cites
probe 15. Probe 15 runs two invocations (`unscrubbed`, `session-identity
scrub`) and prints two lines; the "everything removed" leg exists only as
prose in §11.4 (5619–5623). Which artifact reproduces the third run the
decision's reasoning (4472–4476) rests on?
*Ground:* none — that leg is a transcription (M-5). The decision itself
survives: the shipped scrub was re-executed here today by the probe
(`session-identity scrub: is_error=False session=fresh`), which is the
run the design's command needs (collapse-log 561); the third leg supports
only the *narrowing* argument, and the narrower set is the one the probe
verifies.

### D-plan-9 — lag-window hold. **SURVIVES.**
*Harder Q:* the hold is "read-to-EOF + deny-on-open" (4482–4485), and
`catchUpTranscript` advances the bookmark "only over completed lines"
(2837–2838). A clearing turn whose JSONL line is complete but not yet
flushed past the reader's `readFrom` slice boundary (AD-23's "bounded
slices", 2489–2490) is read on the *next* event — the same observable as V1
lag, but caused by the reader's slice size, which nothing states. Is the
lag-hold rate the harness's lag or the reader's?
*Ground:* both are the same self-recovering direction the spec chose (FR-B1
371–381); `readFrom` reads "to EOF in bounded slices" — every slice within
one call, so a complete line is consumed in the same event unless the
deadline fires, which records `catchup_incomplete` (2838–2840) and is a
separately counted class. The rate measures the system as the spec defines
it. Survives.

### D-plan-10 — exit-run legs and validity rule. **PARTIAL COLLAPSE** → findings S-2, M-8.
*Author's Q:* three sessions are noise; the labelled sample is the agent's
own account; a mounted transcript shows the block the future.
*Harder Q (i):* the validity rule requires "every counted session's exported
store holds a `SessionStart` liveness row" (4072–4073) and the counted
sessions are "created after the bootstrap session on the same initialised
clone so the hooks load at startup" (4039–4041). Step 39 itself states
sixteen lines later that "a remote session's `~/.ctxoracle` lives in its own
container" (4055–4056) — a session is a container, and a container has its
own clone. On which clone do the counted sessions find the `.claude/
settings.json` the bootstrap session wrote and the globally-installed binary
its entries point at?
*Answer from source:* none; the protocol is not executable as written — S-2.
*Harder Q (ii):* "every number below is given per leg, never as a total
across legs" (4101), but the recall/precision sample is drawn "from the
human turns of the leg 1 corpus and the leg 2 transcripts" (4078–4079) as
one `N`, and leg 2's human turns are authored by the same agent under a
protocol that prescribes their shape (4042–4045). Which of the two "honest
floor numbers Max Cogar reads" is a floor over real usage?
*Answer from source:* neither is separable — M-8. The per-event prefix
(closed round-3 S-3), the published label table, the blind-before-replay
order, and the per-leg deny split all survive and are real improvements;
the rule the decision hangs on cannot be met by the leg it names.

### D-plan-11 — L11 verifications executed by the build. **SURVIVES (with note).**
*Harder Q:* the L11(b) induction reads "the diagnostics and `log` … for a
`UserPromptSubmit` event, an intake row, and an `intake_invalidated` fault
for those turns" (4048–4050). A task-notification's text is platform-
authored and carries no `?`; if the event fires, no intake row opens and no
voiding follows — the induction's second and third observables are
structurally absent for that turn class, and the only distinguishing
observable is the `session_log` event row.
*Ground:* the event row is enough — `session_log` records every event
(1397–1400, 3152) — and the scheduled wake is agent-authored (a `?` can be
planted). The outcome vocabulary "fires / does not fire / fires with the row
voided / not performed" (4064–4065) covers the no-question case only as
"fires"; the report should say the intake observables do not apply to
notification turns, a wording note. Survives, conditional on S-2 (the
induction lives in the counted sessions).

### D-plan-12 — watchdog kept after the V6 drift. **SURVIVES.**
As in round 3: the grounds are `NF-1` and `FR-O3`'s diagnostic (4547–4555);
probe 13 re-verified the timeout sentence today.

### D-plan-13 — CI tiers. **SURVIVES (with note).**
*Harder Q:* the replay tier now runs in the every-PR job from Step 28
(4557–4560; 3114–3116), at two Node versions, generating thirty-two git
repositories and — per Step 1 — a ≈400 MB store "cached by the generator's
hash" in a run directory that does not survive between CI runs. §10A still
steers toward "Fast tier every commit; replay at the checkpoints" (5011).
What is the every-PR cost, and which sentence does an implementer follow?
*Ground:* the decision (replay on every PR) is the stronger one and is what
Step 1 and Step 28 implement; the §10A steer is a stale sentence (m-2) and
the cost is unquantified (m-10). Survives.

### D-plan-14 — single spawn wrapper. **SURVIVES (with note).**
As in round 3 — the `createRequire` hole is conceded by the author (gates
review row "CH D-plan-3 / D-plan-14 notes"); the wrapper's job holds.

### D-plan-15 — URL normalization. **SURVIVES.**
As in rounds 2–3 (1086–1100, 4584–4593).

### D-plan-16 — bypass predicate bound. **SURVIVES.**
As in rounds 2–3 (2943–2952, 4595–4602); T-26-1's `dd of=target.ts` (6762–
6763) pins the bound as a class.

### D-plan-17 — two test levels. **SURVIVES (with note).**
*Harder Q:* the two levels are only as good as their agreement. Step 14's
function-level test T-14-2 asserts that `refreshIfStale` "spawns one
reindex" and fails when it "spawns zero or two children" (6301, 6310–6312);
Step 14 now says `refreshIfStale` "spawns nothing" (2006). Which level is
the implementer's specification?
*Ground:* the decision survives (the level split is right); the disagreement
is M-2's second half — the round-3 S2 correction landed at the step and not
at the test.

### D-plan-18 — checkpoint placement. **SURVIVES (with note).**
*Harder Q:* Checkpoint 3 runs the Step 28 replays including T-28-5 (the
`SessionStart` liveness row, 4258–4263). The `SessionStart` branch also
spawns "detached reindex (Step 14)" (3127–3128) through a verb — `index` —
that Step 32 provides (3480). At Checkpoint 3 that spawn is fire-and-forget
into a non-existent verb; the checkpoint passes over a branch that cannot
run. Is the "pipeline is complete" claim (4258–4259) true at Checkpoint 3?
*Ground:* the placement decision survives; the claim is false on that
branch — M-2.

### D-plan-19 — negative-coverage tests. **SURVIVES (with note).**
*Harder Q:* the done-claim recognizer's generated negatives are "final
sentences built from a grammar of completion paraphrases outside the
lexicon" (6488–6493) — every generated negative lacks a lexicon phrase, so
the negation clause Step 18 added (2301–2304, the round-3 m-4 fix) has no
negative in T-18-8 at all: "Not done yet." contains `done` and would pass a
recognizer that ignores negation.
*Ground:* the complement-as-rule decision holds for the three recognizers
whose rule is a lexicon complement; the negation rule is a fourth clause
with no test (m-3).

### D-plan-20 — fourth wrongful-deny component. **SURVIVES.**
As in round 3 (4644–4651; 2584–2587).

### D-plan-21 — exit report location. **SURVIVES.**
As in round 3 (4653–4660).

### D-plan-22 — no test hooks in production modules. **SURVIVES.**
As in round 3; `--deadline-ms` is parsed from the internal verb only
(3099–3104), T-28-3 and T-28-6 use a truncated store (6835–6838, 6875).

### D-plan-23 — no-egress asserted structurally. **SURVIVES (with note).**
*Harder Q:* T-32-2 records an `unshare` refusal as "not executed with the
reason" (7015–7017); T-38-22 runs "the whole stream and both verbs … inside
`unshare -rn`" and fails "when … any event or verb fails inside the
namespace" (7432–7439) with no such branch — on the runner where `unshare`
refuses, the AC-11 replay is red for a non-behavioural reason.
*Ground:* the structural scan (T-32-3, executed by probe 08's negative
proxy result) is the property; the sibling omission is m-4.

### D-plan-24 — clause-level clear rule. **PARTIAL COLLAPSE** → finding M-6 (REGRESSION).
*Author's Q:* punctuation still decides "no" vs a dismissive "no".
*Harder Q:* the rule's evidence is probe 16 — a reference implementation of
the rule run over the thirteen T-23-2 cases the same author wrote. No case
has a substantive single clause carrying a stoplist member; the stoplist
carries `later` (1836). "The cron fires later." → one clause, discarded,
`deferral_only`, no clear; Step 26 excludes `deferral_only` rejections from
`deny_despite_answer_text` (2938–2942); the deny that follows is counted in
the exit report as a *correct* deny of a dodge. FR-B5's lean is "errs toward
clearing on a substantive answer (only an empty deferral fails to clear)"
(spec 438–439). Name the report field that counts the hold on a substantive
answer that happens to contain `later`.
*Answer from source:* none. The clause-level decision's job — "let a real
answer clear wherever it sits" — is delivered for the mixed-sentence case
the round-3 M-8 finding named and defeated for the single-clause case the
new vocabulary creates; and the detector exclusion (the S-2 fix) makes the
new class unmeasurable. Both halves are round-3 corrections. Partial
collapse.

### D-plan-25 — totally-dead detector and interpreter pin. **SURVIVES (with note).**
*Author's Q:* the detector cries wolf on other checkouts and pre-`init`
sessions.
*Harder Q:* the detector is scoped by "transcripts under
`~/.claude/projects/<cwd-slug>/`" (3589) — a directory layout V12 calls
undocumented and AD-11 confines to one file ("`transcript/locate.ts` is the
only file that knows where transcripts live", arch 949–951). The slug rule
is stated nowhere in the plan; `diag/status.ts` becomes a second file that
knows the layout; and a session that started *before* `init` and is still
live has a transcript newer than every liveness row and none of its own —
"IS a dead wiring, whatever the cause" (5211–5213) is false for it.
*Ground:* the decision's job (make a dead wiring visible at the next CLI
use) survives — the false positive costs a `status` line and the detail
names the pinned interpreter; the slug rule is a deferred choice and the
second layout-knowing site is an AD-11 tension (m-6).

### D-plan-26 — leg-2 protocol, exports, corpus origin, blind labelling. **COLLAPSES** → finding S-2 (REGRESSION).
*Author's Q:* every number is one agent's account; the liveness row proves
only that hooks fired at `SessionStart`.
*Harder Q:* the §10A answer says "the liveness row is a precondition, not
the evidence" (5235). Under the protocol as written no counted session can
have one: each session the implementing agent creates is its own container
with its own clone (Step 39's own words, 4055–4056; G3, 8074–8076), so the
bootstrap session's `settings.json` write and global install are not on the
counted session's disk; and the premise that installing inside the measured
session "is a model the plan cannot hold" cites the hooks reference for "a
`-p` session does not count as accepting it" (4033–4038, 4722–4726, §11.4
5552–5554, probe 13). The reference's settings-file rule, read today, says
the opposite: *"-p or SDK session: Claude Code never shows the dialog and
treats the folder as trusted, so hooks committed in a repository's
.claude/settings.json run in a folder you've never trusted"* — the quoted
sentence belongs to the paragraph on *frontmatter hooks in a project
subagent*, which "follow a stricter rule than settings-file hooks". Which
session kind does the agent's tooling create, and on which clone does the
wiring exist when it starts?
*Answer from source:* the plan does not say, and its two premises (same
clone; the trust sentence) are respectively contradicted by its own Step 39
and by the source it cites. The protocol's other members — export as the
one data path, declared corpus origin, labelling before replay, the
published label table — survive and are correct; the member the validity
rule hangs on does not.

---

## (b) New collapses and load-bearing decisions §10A missed

Each is a plan-level judgment or cross-step interaction not covered by a
§10A entry. Full detail in (d).

- **N-A — The step declarations are hollow and the build-order check is
  blind to how this plan consumes.** Eighteen steps declare `depends_on:
  [S1]` (or one or two more) while consuming six to eight earlier steps by
  function name; every `provides:` list except the CLI verbs is `[]`, so the
  contract's "backticked artifact … created or provided" rule never fires.
  Executed: declaring `provides: [openQuestion]` on S22 and
  `provides: [recognizeQuestions]` on S23 makes `--check` fail on Step 25
  (`S23 is not among S25's declared or transitive dependencies`). The hollow
  declarations hide a real inversion — Step 9's DAO entry points use "the
  helpers the DAO entry points use" that Step 11 creates (1737–1739,
  1590–1591). Finding S-1.
- **N-B — Leg 2 cannot start a counted session whose hooks are live.**
  Finding S-2 (D-plan-26).
- **N-C — The author's T-3-3 schedule does not reproduce under its own
  probe runner.** Executed: run 1 `FAIL 07_sqlite_busy_schedule … identical
  across 3 runs: false`, exit 1; run 2 all probes ok; six direct runs
  identical. Finding M-1.
- **N-D — The handler at Step 28 spawns the `index` verb Step 32 provides,
  and T-14-2 still asserts the spawn Step 14 no longer performs.** Finding
  M-2.
- **N-E — Seven steps modify earlier files with `modify: []`.** Steps 27
  (`answer_drift.ts`), 30 (`indexer.ts`, via "called … from `runIndex`
  refresh"), 31–35 (`dispatch.ts`, "register the … verb in Step 28's
  `dispatch.ts` switch"). The generated §5.1 table therefore says
  `dispatch.ts` is created by S28 and touched by no one else. Finding M-3.
- **N-F — `large-store` cannot be generated at Step 1.** Finding M-4
  (D-plan-5).
- **N-G — Four §11.4 entries describe runs their cited probes do not
  perform.** Finding M-5.
- **N-H — The deferral vocabulary and the substring clause rule create a
  wrongful-hold class that Step 26 excludes from measurement.** Finding M-6
  (D-plan-24).
- **N-I — The FTS5 fallback AD-2 mandates is unbuildable: migration 001
  unconditionally creates the FTS5 virtual tables.** Finding M-7.
- **N-J — The recall/precision sample pools leg-1 and leg-2 turns, against
  the report's own per-leg rule, and leg-2 turns are agent-authored under a
  protocol that prescribes their shape.** Finding M-8.
- **N-K — Two deny-health detectors read per-turn classification results
  the store never holds.** `checkDenyLoop(store, consumer)` needs "no
  intervening assistant text" and `checkDenyDespiteAnswerText(store,
  consumer)` needs a turn "rejected with reason `below_length_floor`"
  (2931–2937); no table records assistant text turns or their rejection
  reasons, and each event is a fresh process. Finding m-9 (pre-existing
  signatures; the reason-code requirement is new).
- **N-L — §16 lacks the file-list reconciliation the output contract
  requires** — the one implementation-time check that would catch N-E.
  Finding m-11.
- **N-M — Referents moved by the round-3 corrections under sentences that
  did not move:** T-38-25's "invoked by Step 1's `cold-container` CI job"
  (m-1), §10A D-plan-13's steer (m-2), T-16-1's `index_head`/`HEAD` data
  against the new `ctx.indexStale` signature (m-12).

**Answer-drift block, Steps 21–27, read against AD-9 for elaboration beyond
the safe skeleton (spec §11.5 lines 741–762; arch 736–922):** intake
(2640–2649 ↔ arch 747–760: rule (i)–(iii), the `prompt` field,
`'already_open'` tolerated — identical; the `requireTerminalMark` option is
AD-18's "minus the `?` requirement" for `--missed-question`, 1291–1293, and
T-23-1 asserts the default), catch-up (2827–2840 ↔ 762–788: markers,
backfill, voiding on an affirmative non-human marker, bookmark over
completed lines — identical), deny decision (2841–2848 ↔ 790–804: main
consumer, `open` row, `recognizeMove` over exactly `Write`/`Edit`/
`NotebookEdit` — identical), the hold (2850–2859 ↔ 812–826 — identical, no
lag estimator), detectors (2925–2952 ↔ 819–826, 841–850 — identical, and
`deny_despite_answer_text` now carries AD-9's deferral exclusion), question
lifetime and backstop (3004–3021 ↔ 828–839, 852–867 — identical), seam
(2569–2589 ↔ 869–879 — identical). One deviation, in the clear axis: AD-9's
"not a recognized content-free deferral ('I'll get to that'-class)" (arch
781–782) is realised as a clause-level substring discard over a vocabulary
that includes the bare word `later` and the fragments `in a moment` / `first
let me` (1835–1837, 2655–2657) plus an acknowledgement lexicon (1838–1840) —
a widening of what *holds*, never of what is denied, and therefore not the
2026-09-04 shape; but the holds it adds fall into the reason code Step 26
excludes (M-6). No question-type classifier, no `Bash` classifier, no
per-question clear matcher, no widening of the deny-eligible set. As in
rounds 2 and 3 the hollowness sits in the measurement of the block (S-2,
M-8) and in the document's own machinery (S-1).

**Pinned versions and scope:** runtime pins `web-tree-sitter` 0.26.13 and
`tree-sitter-wasms` 0.1.13 (736) equal V14 (arch 138); `engines >=22.16.0`
(735) equals AD-2 (arch 327–328); dev pins `typescript` 5.9.3 /
`@types/node` 22.20.1 are D-plan-2's with recorded reasoning and probe 17
verifies the registry facts. No spec scope element is added or dropped:
§2.1 (44–132) reproduces the architecture's in-scope list (arch 48–75) item
for item and §2.2 (134–158) its deferrals; the thirteen `PA-*` elements map
to steps with no unmapped element (186–202). Plan additions since `d667534`
— the `regret` table and `observed_actions.content_hash` (Step 7), the
`index_stale` schema key (Step 14), `tuning_seeds.ts`, `lexicon.
acknowledgement`, the `hook integrity-check` verb at Step 28, the
totally-dead detector, the `requireTerminalMark` option, the `--corpus`
origin argument — each traces to a round-3 finding and to an architecture
requirement (AD-18, FR-L4, AD-17, AD-20, AD-9/AD-18, AD-17/L7, AD-24), and
none reintroduces a rejected posture: no pre-emptive gate, no generated-file
block, no credential, no in-tree write beyond `init`, no budget.

---

## (c) Round-3 closure tables

### (c.1) The 23 round-3 collapse-hunt findings

Each re-derived from the current text (not from the author's table).
"Regressed" means the closure introduced a defect reported in (d).

| Round-3 finding | State now | Evidence (plan lines) |
|---|---|---|
| S-1 — T28-2 unsatisfiable (input-field list) | **Closed.** The scan list is the unambiguous wire identifiers; `error`/`prompt`/`source`/`cwd` excluded with the reason; `InternalEvent` members renamed; liveness keys `transcriptPath`/`transcriptBytes`. Residual: `agent_transcript_path` stays in the list while Step 21's `locate.ts` "records" it and `InternalEvent` has no member for it (m-8). | 3084–3095, 1219–1225, 3124–3126, 2485 |
| S-2 — `deny_despite_answer_text` counts deferral rejections | **Closed.** Only `below_length_floor` rejections count; deferral/acknowledgement excluded per AD-9 823; T-26-1 has the deferral-only no-fire case. The exclusion now also hides the M-6 class (a new consequence, not the same finding). | 2934–2942, 6757–6760, 6767 |
| S-3 — leg-1 off-policy denies unsplit | **Closed.** Every number per leg; leg 1 deny count only, labelled off-policy; rates from leg 2 only; per-genre counts split and Stop-time genres labelled. The recall sample is the one number still pooled (M-8). | 4097–4124 |
| S-4 — leg 2 not executable; unstated premises | **Closed in form, then REGRESSED.** The agent creates every session, `exit-run.sh` collects, export is the data path, a liveness row is the precondition — but the bootstrap/counted split needs a shared clone the plan's own container model denies, and the trust premise cites the wrong rule → S-2. | 4016–4076; regression 4028–4041, 4033–4038, 5552–5554 |
| M-1 — T3-3 schedule cannot produce `StoreBusy` | **Closed, then REGRESSED.** New schedule (A 0–400, C@100 → `StoreBusy`, B@250 → retry success) executed as probe 07; the probe failed one of two runner runs here → M-1. | 5986–5995; probe 07 |
| M-2 — labelling rule attributed to OL-C5; labeller not blind | **Closed.** The rule is the plan's (D-plan-26), OL-C5 named as the trigger only; labelled before replay with no store present; order and labeller recorded. | 4078–4089, 4729–4732 |
| M-3 — origin read from the markers | **Closed.** `--corpus <machine>/<mode>=<dir>` declared by the run; undeclared → "origin unknown"; L11(a) *verified* only from `owner-local/interactive`. | 3903–3909, 3998–4008, 4114–4117, 7575–7589 |
| M-4 — "re-edited or reverted" undefined | **Closed.** Re-edit = second `ok` edit on the path (partner after subject for a pair); revert = post-write `content_hash` equals an earlier hash; single-edit no-inflate case in T-30-1. | 3304–3313, 1403–1405, 6921–6923 |
| M-5 — cold-container image has no `git` | **Closed.** Job moved to Step 38 on `node:22.16.0-bookworm`, default runner network; probe 14 verifies the image lineage. T-38-25's File line still says "Step 1's `cold-container` CI job" (m-1). | 3910–3916, 795–799; residual 7467–7468 |
| M-6 — D-plan-13 vs Steps 1/28 | **Closed.** D-plan-13 rewritten: replay tier in the every-PR job from Step 28. §10A steer sentence unchanged and now stale (m-2). | 4557–4569; residual 5011 |
| M-7 — dead wiring invisible; interpreter pin | **Closed.** Totally-dead half (transcripts under the slug newer than the newest liveness row, or present with none); T-33-4 case (c); `init` prints the pin and `status` re-checks it; D-plan-25. Slug rule unstated (m-6). | 3583–3594, 3398–3402, 7087–7096, 4700–4712 |
| M-8 — sentence-level deferral discard holds on substantive sentences | **Closed, then REGRESSED.** Clause-level rule with reason codes and the acknowledgement lexicon; mixed-sentence case clears (probe 16). The single-word members and substring matching create the M-6 class. | 2650–2675, 1835–1840; regression 1836, 2655–2657 |
| M-9 — `Stop` per assistant entry | **Closed.** One `Stop` per turn after the last assistant entry before the next human turn or EOF; cadence sentence in §11.4 and probe 13. | 3987–3991, 5549–5551 |
| M-10 — lexicon members unspecified | **Closed.** Members enumerated as `plan_seed` for `lexicon.stoplist`, `lexicon.deferral_stoplist`, `lexicon.acknowledgement`; T-12-1 reads every key. (The members chosen open M-6.) | 1829–1840, 6257–6263 |
| m-1 — `verdict.emit` undefined | **Closed.** `adapter.toHookResponse({deny: verdict})`. | 3134–3135, 3080–3084 |
| m-2 — Step 25's Verification described the hold | **Closed.** T-25-3 clause removed at all three sites; the hold is T-38-4. | 2897–2901, 6730–6736, 4611–4615 |
| m-3 — `tuning_missing` fallback contradiction | **Closed** (single seed module; reader re-seeds). Step 6's "falls back to its stated seed" wording survives beside it (m-5). | 1799–1804, 1883–1885; residual 1214–1216 |
| m-4 — done-claim fires on a negated sentence | **Partially closed.** Negation clause added to Step 18; T-18-8's negatives carry no negated case and the generated corpus excludes lexicon phrases by construction → m-3. | 2301–2304; 6485–6494 |
| m-5 — `large-store` size unspecified | **Closed, then REGRESSED.** Size and shape stated (≈400 MB, ≈2 M / ≈1 M rows, cached per run directory); the store-shaped fixture is declared under Step 1, before any schema exists → M-4. | 801; regression 724, 5931–5935 |
| m-6 — D-plan-19 overclaims generated complements | **Closed.** T-18-8 negatives from a paraphrase grammar; T-23-3 from a generated tool-name set; §10A sentence matches. | 6488–6494, 6650–6654, 5100–5105 |
| m-7 — leg 2 asks only `?` questions | **Closed.** Each counted session asks one indirect ask; outcome recorded. | 4042–4045, 4122–4123 |
| m-8 — "three replay tests" | **Closed.** Checkpoint 3 lists the tests by name; no count phrase survives. | 4258–4266, 3202–3204 |
| m-9 — leg-1 corpus unsplit | **Closed.** Leg-1 numbers per repository class (the tool's own vs the owner's code). | 4009–4013 |

Closed: 17. Closed-in-form-then-regressed: 4 (S-4, M-1, M-8, m-5).
Partially closed: 1 (m-4). Closed with a residual reported below: 3 (S-1 →
m-8; M-5 → m-1; M-6 → m-2; M-7 → m-6; m-3 → m-5 — five residuals across
three rows plus two counted under "closed").

### (c.2) The 20 round-3 expert-review findings

| Round-3 finding | State now | Evidence (plan lines) |
|---|---|---|
| S1 — Step 28 consumes guard/watchdog (Step 29) and `integrity-check` (Step 32) | **Closed.** `watchdog.ts`/`guard.ts` created at Step 10 (T-10-4); `integrity_check.ts` created and `hook-integrity-check` provided at Step 28 (T-28-6); Step 29 is verification-only; Step 32 no longer registers the verb. The same class recurs one verb over: the `SessionStart` branch spawns the `index` verb Step 32 provides → M-2. | 1638, 1662–1671, 3063–3066, 3161–3166, 3227–3239; recurrence 3127–3128, 3480 |
| S2 — Step 14 spawns a verb that does not exist; T14-2 unbuildable | **Closed at the step, REGRESSED at the test.** Step 14's `refreshIfStale` spawns nothing and returns `{stale}`; the handler starts the reindex (Step 28). T-14-2 is unchanged from `d667534:5269–5280` — title "spawns one reindex", Level "real detached child", Fails when "spawns zero or two children" — and now fails on a correct Step 14 → M-2. | 2001–2007, 2046–2049; 6301–6312 |
| S3 — T3-3 timeline produces the opposite outcome | **Closed, then REGRESSED** (as CH M-1) → M-1. | 5986–5995 |
| SY-1 — T28-2 forbids identifiers the modules must use | **Closed** (as CH S-1). | 3084–3095 |
| M1 — cold-container job at Step 1 runs a Step 38 script; network policy stated two ways | **Closed.** Job added by Step 38 with the workflow declared `modify:`; "default runner network" once. T-38-25's File line stale (m-1). | 795–799, 3886, 3910–3916 |
| M2 — `passesBar` cannot see staleness; `HEAD` read outside AD-23 | **Closed at the signature, stale at the test.** `passesBar(candidate, tuning, ctx: {indexStale})` reads `EventContext.indexStale` from `schema_meta.index_stale`; T-16-1's data still says "`schema_meta.index_head` equal to and different from `HEAD`" → m-12. | 2131–2137, 1226–1227; 6346–6349 |
| M3 — Clear Thought attestation contradicted by the trace | **Closed.** Second trace file with the re-run and new decisions; §10 names both files and which governs; every D-plan label present across the two files (enumerated this session). | 4299–4306; trace-2 labels |
| M4 — regret has no table/DAO/column | **Closed.** `regret` DDL, `regret` DAO, `observed_actions.content_hash`; T-7-1/T-9-1/T-30-1 cover it. | 1401–1417, 1576, 3304–3320 |
| M5 — remote leg-2 stores unreachable | **Closed in form, then REGRESSED.** Every session exports and transfers; but the protocol's counted sessions cannot exist as specified → S-2. | 4053–4058; regression 4028–4041 |
| m1 — trivial steps name Step 6 | **Closed.** "8 and 40". | 707 |
| m2 — `Symbol[]` | **Closed.** `SymbolRow[]`. | 1980 |
| m3 — `verdict.emit` | **Closed.** | 3134–3135 |
| m4 — "three replay tests" | **Closed.** | 4258–4266 |
| m5 — sweep record has no terminating pass | **Closed.** Passes 4 and 5 recorded; pass 5 added zero. | 8024–8035 |
| m6 — brand claim untrue; T24-3 fixture ambiguous | **Closed.** Brand confines annotated construction only; T-24-2 is the guard; fixture is an annotated return; probe 05. | 2738–2747, 6683–6697 |
| m7 — `deinit` cannot reach `{}` | **Closed.** Prunes emptied arrays and the `hooks` object before comparing. | 3487–3494 |
| m8 — `npx` mode unnamed | **Closed.** `npx --yes --package=<tarball> ctxoracle init`, cache from the tarball; probe 06. | 6950–6954 |
| m9 — deferral discard unrecorded in §10 | **Closed.** D-plan-24 + §10A. (Its content opens M-6.) | 4684–4699, 5179–5199 |
| m10 — Dependencies fields omit consumed steps | **REGRESSED.** The hand-kept fields (which named, e.g., "Steps 12, 21, 22, 23, 24" for Step 25 at `d667534:2418`) were replaced by declarations that name fewer — `depends_on: [S1]` for Step 25 — and the prose now defers to them → S-1. | 2818, 2251, 2067, 1547, 1643, 2565, 2921, 3565, 3714; §7 rule 682–683 |
| m11 — `recognizeQuestions` has no mode | **Closed.** `{requireTerminalMark}` option, default `true`; only `--missed-question` passes `false`; T-23-1 asserts the default. | 2640–2644, 3661–3663, 6608–6610 |
| T2 — floor executed only on 22.22.2 | **Unchanged, honest.** CI's matrix entry. | 793–795, 7884–7888 |
| T3 — `unshare` on the runner | **Closed for T-32-2** (refusal recorded as not executed; probe 09 skips on refusal); **open for its sibling T-38-22** (m-4). | 7012–7017; 7432–7439 |

Closed: 15. Closed-in-form-then-regressed: 3 (S2, S3, M5). Regressed: 1
(m10). Partially closed: 1 (T3 — sibling). Unchanged and honest: 1 (T2).
Two closures recur one level below where they closed (S1 → M-2's verb; M2
→ m-12).

---

## (d) Findings, severity-ordered

Class legend follows `docs/collapse-log.md`: reduction / wrong-check /
posture / unverified / mechanism-not-mission, plus *fake-completeness
(measurement layer)* from the 2026-09-04 entry and *unbuildable-as-written*
for a step or test an implementer cannot execute without a decision the
plan forbids. Required changes are hypotheses with the evidence that would
confirm them; the author re-derives them.

### S-1 — The step declarations are hollow: `depends_on` names `S1` alone for eighteen steps that consume six to eight earlier steps, and the build-order check the round-4 process rests on is blind to consumption by function name — passing while hiding a real document-order inversion
- **Class:** wrong-check (an identifier-level check certifying a property the plan's consumption vocabulary never enters) / false attestation. **REGRESSION (introduced by the round-3 corrections)** — at `d667534` every step carried a hand-kept `**Dependencies.**` field naming its consumed steps (Step 25 `d667534:2418` "Steps 12, 21, 22, 23, 24"; Step 18 `:1986` "Steps 9, 12, 13, 14, 15, 16, 17"; Step 15 `:1809` "Step 14"; Step 9 `:1447` "Steps 3, 7, 8"; Step 10 `:1496` "Steps 6, 9"; Step 22 `:2147` "Steps 6, 9"; Step 26 `:2487` "Steps 9, 25"; Step 33 `:3001` "Steps 9, 10, 12, 26, 28, 30"; Step 35 `:3083` "Steps 9, 11, 31"); the conversion (the closure of ER m10, S1, S2) replaced them with `depends_on` lists that name fewer, and the prose field now reads "Declared above (`depends_on`)" at every step.
- **Plan:** 682–683 (*"Steps are topologically sorted: a step's `Dependencies` field names every earlier step it consumes, and no step names a later one"*); the declarations: S25 2818 `depends_on: [S1]` against 2823–2848 (consumes `recognizeQuestions`, `openQuestion`, `TranscriptReader`, `recognizeClearing`, `answerQuestions`, `voidQuestion`, `recognizeMove`, `DenyVerdict`, the `whisper_audit` append — Steps 21, 22, 23, 24, 9, 10); S18 2251 `[S1]` against 2255–2304 (`EventContext`, `Store`, `cochange_pairs`/`symbol_refs`/`test_map`/`landmines` DAOs, `bar.reuse_dominance_k`, `command_class` — Steps 6, 3, 9, 12, 17); S15 2067 `[S1]` against 2071–2072 ("implementing `LanguageFrontend`" — Step 14) and `SymbolRow`/`ImportEdge` (Step 6); S9 1547 `[S1, S7]` against 1554–1591 (`Store` — Step 3; `whisper_stats`/`lessons`/`global_meta` DAOs over Step 8's schema; "the learned-record entry points accept only `trust='untrusted_repo'`" over the `Trust` type and "the helpers the DAO entry points use" that **Step 11** creates, 1737–1739 — a step *later* in the document); S10 1643 `[S1, S6]` against 1647–1651 ("a thin wrapper over the `session_log` DAO" — Step 9); S22 2565 `[S1, S7]` against 1571 ("composed by Step 22's seam module" — the Step 9 `questions` DAO); S26 2921 `[S1, S23]` against 2927–2948 (`whisper_audit` rows, `deny.loop_threshold`, the fault writer — Steps 9, 12, 10); S13 1900, S19 2354, S20 2416, S21 2478, S30 3290, S33 3565, S34 3653, S35 3714 likewise; every `provides:` list is `[]` except the CLI verbs and Step 1's npm scripts. Q24 7867–7871 (*"every Dependencies field names earlier steps only"*); §14.4 pass 1 8009–8016 and pass 4 8024–8030 (the check is the verification).
- **Executed (this session, `derive-plan-sections.mjs --check` on a scratch copy with the probes directory beside it):** the delivered plan → `OK`. With `provides: [openQuestion]` added to S22 and `provides: [recognizeQuestions]` to S23 and nothing else changed → `ERROR: step S25 (line 2823) names \`recognizeQuestions\`, which step S23 provides … S23 is not among S25's declared or transitive dependencies`; `ERROR: step S25 (line 2824) names \`openQuestion\`, which step S22 provides … S22 is not among S25's declared or transitive dependencies`; exit 1. The check therefore has exactly the reach the `provides:` lists give it, and the plan gives it none for modules. A second blind spot: a backticked span that opens on one line and closes on the next (2827–2828) shifts the pairing on the closing line, so `TranscriptReader` at 2828 is not a mention the scanner sees (adding `provides: [TranscriptReader]` to S21 produced no error).
- **Contradicting source:** `references/output-contract.md:24` (a step-decl declares "the step IDs it depends on"; `provides` = "the names it **provides** (artifacts later steps consume by name rather than by path …)"); `:38` (*"the prose fields of the step must agree with it, and where they diverge the declaration is what the derivation script and the reviewer read"*); `:40` (*"Build order is checked from the declarations, not trusted from prose"*); Gate C `:125`. The plan's own §7 rule (682–683). Architecture AD-4/AD-19 (Step 9's DAO entry points need the `Trust` type Step 11 defines — the inversion is real: an implementer building in document order reaches Step 9 with no `Trust` type and no helpers). The author's gates review `:17` (*"Build order is checked from the declarations … this check reproduced every round-3 build-order finding"*) and `:47` (ER m10 closed by "`depends_on` declared per step") — both true of paths and verbs, neither of the modules this plan consumes by export name. Collapse-log 2026-08-01 (*"a device asserting a property of the whole document is written once and never re-checked against the document it describes"*) and 2026-09-07 (the author's check versus the reviewers' walk).
- **Effect:** the plan's only dependency statement is false for eighteen steps; a reviewer using the declarations (as the contract instructs) cannot tell what a step needs; the mechanical guarantee the round-4 process was rebuilt on certifies build order over a vocabulary the plan does not use; and one real inversion (Step 9 → Step 11) passed it. Checkpoint 1 (after Step 12) is reachable only because Step 11 happens to precede it.
- **Required change (hypothesis):** re-derive every `depends_on` from consumption — every step whose text names an export, type, table DAO, or lexicon of an earlier step declares that step — and either (a) list exported names in `provides:` (functions, types, DAOs) so the contract's check bites, confirmed by re-running `--check` and seeing every under-declared step fail until fixed, or (b) state in §7 that the check covers paths and verbs only and that module dependencies are hand-declared, confirmed by walking each step's "What changes" for every export it names and checking the exporting step is in its closure (the walk this review performed); move `security/trust.ts` (or the `Trust` type) before Step 9 or make Step 9 depend on Step 11 and reorder. The scanner's multi-line-span blindness is a skill defect to report to the skill, not a plan edit.

### S-2 — Leg 2's protocol cannot be executed in the environment the plan assigns it to, and the trust premise it cites is the wrong sentence of the hooks reference
- **Class:** unbuildable-as-written / unverified (a mission-load-bearing leg — the validity rule hangs on it; spec §11.5 "on a real repo"). **REGRESSION (introduced by the round-3 corrections)** — the bootstrap/counted protocol, the trust sentence, and D-plan-26 are new (`d667534:3292–3301` had the "starts each session through the implementing agent's session tooling … installs the tool inside each session" text round-3 S-4 attacked); the correction replaced it with a protocol whose members contradict each other and the source.
- **Plan:** 4028–4038 (*"Bootstrap session (not counted). A session on a fresh clone of the repository installs the packed tool … runs `ctxoracle init` … Hooks written to a settings file are loaded when a session starts and follow the workspace-trust rule — an interactive session holds them back until the trust dialog is accepted and a `-p` session does not count as accepting it (hooks reference, §11.4) — so the session that installs is never the session that measures"*); 4039–4041 (*"Counted sessions. At least three sessions per repository, each created after the bootstrap session on the same initialised clone so the hooks load at startup"*); 4022–4026 (*"The implementing agent creates every session with its own session tooling"*); 4055–4056 (*"a remote session's `~/.ctxoracle` lives in its own container, G3"*); 4069–4076 (validity rule: "every counted session's exported store holds a `SessionStart` liveness row … a session whose hooks never fired … can never count"); D-plan-26 4722–4728; §10A 5231–5237; §11.4 5552–5554 (*"states that hooks in settings files follow the workspace-trust rule (an interactive session holds them back until the trust dialog is accepted; a `-p` session does not count as accepting it)"*); Q43 7952–7958; probe 13's expectation line `present: A -p session doesn’t count as accepting it`; G3 8072–8079; R13 7721–7730.
- **Contradicting source (1 — the plan's own container model):** 4055–4056 and G3 (*"a remote session's container holds only its own transcript"*): a session created by the agent's tooling is its own container with its own clone; the bootstrap session's `settings.json` write and its `npm install -g` live on that container's disk. A counted session "on the same initialised clone" is a session in the *same* container — i.e. a continuation of the bootstrap session, whose hooks were not loaded at its start — or a new session on a *different* clone that holds neither the wiring nor the binary its entries name (`process.execPath` and the real `dispatch.js` path, 3391–3396). Either way no counted session satisfies "hooks load at startup", so the validity rule (4069–4076) fails on every agent-driven run and the report is invalid unless Max Cogar drives — the workload transfer D-plan-11 (4531–4534) and OL-11 forbid.
- **Contradicting source (2 — the hooks reference, fetched 2026-09-07, tag-stripped):** the settings-file rule reads *"What counts as trusted depends on the session type: Interactive session: Claude Code holds back hooks from every settings file … until you accept the workspace trust dialog for the folder … -p or SDK session: Claude Code never shows the dialog and treats the folder as trusted, so hooks committed in a repository's .claude/settings.json run in a folder you've never trusted"*. The sentence the plan quotes — *"A -p session doesn't count as accepting it"* — sits in the paragraph *"Frontmatter hooks in a project subagent run only after you accept the workspace trust dialog … A -p session doesn't count as accepting it"*, and the same page states *"Frontmatter hooks in a project subagent follow a stricter rule than settings-file hooks"*. Probe 13 proves the string is on the page, not that it governs settings-file hooks. The round-3 CH S-4 finding quoted the correct sentence (`round-3-collapse-hunt.md:533`); the correction transcribed the other one. `CLAUDE.md` engineering standard ("verify external facts … against current primary sources before building on them"); collapse-log 2026-08-01 round 3 (*"verifying a source establishes only the claims you aimed at it"*).
- **Effect:** the one leg that produces the block's wrongful-deny, lag-hold, deny-loop and L11(b) numbers (4107–4117) has no executable path to a valid report; the premise that decides *why* the bootstrap/counted split exists is false as cited (for an SDK-type session the settings-file hooks run untrusted, which would make a single-session install-then-measure protocol viable if mid-session loading were documented — it is not); and D-plan-26's answer ("the liveness row is a precondition") describes a precondition no counted session can meet.
- **Required change (hypothesis):** state the session kind the agent's tooling creates (interactive vs SDK — the two branches of the documented rule) and derive the protocol from that branch; state where the wiring and the binary exist at the counted session's start — a committed-to-the-clone wiring is an in-tree write to the owner's repository and needs its own justification against `D-9`, a persisted container needs the tooling to provide one — or move leg 2 to the environment that can provide a persistent, hook-loaded session (a local `claude` session driven by the agent, or the owner's, listed as such), and say which; replace the §11.4 trust claim with the settings-file rule verbatim and re-derive D-plan-26, Q43 and probe 13 from it; keep the validity rule and the export path. Confirm by a dry run of the bootstrap-then-counted sequence in the named environment before the plan is delivered — the liveness row's presence is the observable.

### M-1 — T-3-3's schedule does not reproduce under the plan's own probe runner; the plan and Q46 assert it does, and the test will run under `node --test`'s default concurrency
- **Class:** wrong-check / flake-tolerated (testing-standards anti-pattern 10; "fast, deterministic"). **REGRESSION (introduced by the round-3 corrections)** — the schedule (A 0–400 ms, C at 100 ms, B at 250 ms) is the ER S3 / CH M-1 fix; `d667534:4962–4981` had the impossible schedule this replaced.
- **Plan:** T-3-3 5986–5995 (*"child A holds `BEGIN IMMEDIATE` from t = 0 for 400 ms; child C issues its write at t = 100 ms … so it raises `StoreBusy` after exactly two attempts; child B issues its write at t = 250 ms … The schedule and its outcome were executed and reproduce identically across three runs (§11.4)"*); §11.4 5732–5739 (*"identically across three runs … `identical across 3 runs: true`"*); Q46 7968–7972; Step 1 787 (`execFileSync(process.execPath, ['--test', ...files])` — no `--test-concurrency`, no isolation statement); `probes/07_sqlite_busy_schedule.mjs` (three child processes spawned per run, offsets measured from a `T0` taken before the first spawn; `expected/07_…txt` line 1 `identical across 3 runs: true`).
- **Executed (this session, Node v22.22.2, the prepared layout):** `run-plan-probes.mjs … --layout /tmp/claude-0/probe-layout`, run 1: `FAIL 07_sqlite_busy_schedule: output drifted … --- expected identical across 3 runs: true … --- actual identical across 3 runs: false` (the final outcomes A/B/C and rows matched; one of the three inner runs deviated), `1 probe(s) failed`, exit 1. Run 2 (same command, ~40 minutes later): `ok 07_sqlite_busy_schedule … all probes match their recorded expectations`, exit 0. Six direct executions of the probe between the two runs: `identical: true` every time. The schedule's margins are 100 ms against three Node process start-ups (~50 ms each, V8) spawned sequentially; a delayed `A` lets `C` acquire first.
- **Contradicting source:** `references/output-contract.md:77` (*"run `node scripts/run-plan-probes.mjs <plan.md>`; a non-zero exit is non-compliance"*) and `:126`; `references/testing-standards.md` ("a real implementation is preferred if it is fast, **deterministic**"; anti-pattern 10: *"A test that fails non-deterministically for non-behavioral reasons is broken and is fixed or removed"*); Node's `node --test` runs files in parallel by default (the plan's own §11.4 Node reads do not state the concurrency it relies on). AD-26 (arch 1650–1673) makes retry-once-then-fail-open a *give-up* path under sustained contention; a schedule that must hit two 100 ms windows is measuring the machine.
- **Effect:** on a two-entry CI matrix running ~57 unit files concurrently, T-3-3 is a flake by construction; the delivered plan fails its own gate on a loaded machine; and the round-3 lesson ("execute before writing") was followed at authoring time and not made robust to load.
- **Required change (hypothesis):** make the contention structural rather than timed — the test spawns C only after A has confirmed (via stdin/stdout signal) that it holds the lock, and A releases only after C has reported `StoreBusy`; B likewise gated on C's first failure — so the assertion is on the state machine, not the wall clock; or run T-3-3 with `--test-concurrency=1`/`--test-isolation` and state it; re-record probe 07 under a load generator (e.g. the runner running concurrently) and state the observed failure rate before accepting the expectation. Confirm by ten consecutive runner runs while `npm test` runs in parallel.

### M-2 — The handler's `SessionStart` branch spawns the `index` verb Step 32 provides, and T-14-2 still specifies the spawn Step 14 no longer performs
- **Class:** topological inversion (the round-3 ER S1/S2 class, one verb over) + a test that fails on a correct build. **REGRESSION (introduced by the round-3 corrections)** — the "spawns nothing … the handler, Step 28, starts the detached reindex" text (2006–2007) and Step 28 item 4 (3127–3128) are the ER S2 fix; T-14-2 (6301–6312) is identical to `d667534:5269–5280` and was correct for the old Step 14.
- **Plan:** Step 14 2001–2007 (*"it spawns nothing — the caller that owns a binary (the handler, Step 28) starts the detached reindex"*) and its Verification 2046–2049 (records the fault, sets the flag, returns `{stale}`; clears on `runIndex`); Step 28 item 4, 3127–3128 (*"staleness check → `index_stale` + detached reindex (Step 14)"* — no command named); Step 28 `provides: [ctxoracle-hook, hook-integrity-check]` (3066); Step 32 `provides: [… ctxoracle-index …]` (3480) and *"`index [--full]` → `runIndex`"* (3495); T-14-2 6301–6312 (*"records `index_stale` and spawns one reindex"*; *"real detached child through the spawn wrapper"*; *"**Fails when** the stale call records no `index_stale` fault, OR spawns zero or two children"*); Checkpoint 3 4258–4266 (runs T-28-5's `SessionStart` through the built binary at Step 28); the author's closure (`round-4-author-gates-review.md:30`: "T-14-2 reworded").
- **Contradicting source:** `references/output-contract.md:40` (a step consuming what does not exist when it is built; the verb `ctxoracle index` is never backticked at Step 28, so the check cannot see it); `:38` (a test specification is what the reviewer reads for what the test asserts); expert-plan Step 8 ("Name the functions"); collapse-log 2026-09-03 round 6 lesson 1 (*"a fix that names a location must land at that exact location"* — the S2 fix landed at the step, not at the test); collapse-log 2026-09-07 (the class the replaced process was built to stop: "a step consuming an artifact a later step creates").
- **Effect:** T-14-2 fails on a correct Step 14 (it "spawns zero"); at Step 28 the `SessionStart` branch spawns a verb the dispatcher does not know until Step 32 — fire-and-forget, so silently — and Checkpoint 3 passes over the dead branch; an implementer must either name the spawn command at Step 28 (an unstated decision) or leave it until Step 32 (an unstated deferral).
- **Required change (hypothesis):** re-derive T-14-2 from the current Step 14 (fault recorded, flag set, `{stale}` returned, flag cleared by `runIndex`; no child); state at Step 28 that the reindex spawn command is `<node> <dispatch.js> index` and either register the `index` verb at Step 28 (moving `src/cli/index.ts` there — it depends only on Step 14) or make Step 28's `SessionStart` branch record `index_stale` without spawning until Step 32 adds the spawn, with Step 32's `modify:` declaring `handler.ts`; add a Step 28-or-later test that observes the spawned child by its `.reindex.lock` (the observable the round-3 S2 finding asked for). Confirm by `--check` after backticking `ctxoracle index` in Step 28's text.

### M-3 — Seven steps modify files earlier steps created and declare `modify: []`; the generated file→step table is therefore false and the implementation-time reconciliation would flag planned work as unplanned
- **Class:** false declaration (the contract's generated regions are only as true as the declarations). **REGRESSION (introduced by the round-3 corrections)** — the `step-decl` blocks are new text; at `d667534` the hand-kept §5.1 tree carried no per-step modify claims.
- **Plan:** S27 2991–3001 (`create:` two test files, `modify: []`) against 3004 (*"In `answer_drift.ts` add `handleSessionStart(…)`"* — `src/blocks/answer_drift.ts` is S25's, 2813); S31 3363–3372 (`modify: []`) against 3375 (*"Register the `init` verb in Step 28's `dispatch.ts` switch"*) and Step 28's 3100–3101 (*"Later steps register their verbs in the same switch (Steps 31–35)"*); S32 3474–3483, S33 3557–3566, S34 3645–3654, S35 3706–3715 (all `modify: []`, each registering verbs in `dispatch.ts`); S30 3282–3291 (`modify: []`) against 3320 (*"Called at `SessionEnd` and from `runIndex` refresh (Step 14)"* — `src/index/indexer.ts` is S14's and must call `recordRegret`); the generated §5.1 rows 356 (`dispatch.ts | create | S28`), 351 (`answer_drift.ts | create | S25`), 394 (`indexer.ts | create | S14`) — no `modify` row for any of the three.
- **Contradicting source:** `references/output-contract.md:24` (a step-decl declares "the files it creates/modifies/deletes"); `:20` (the file→step table "is a generated region … derived from the step declarations"); `:67` (post-completion: *"a touched file with no §5 row, or a §5 row whose file the diff never touched, is investigated, not waved through"*); Gate C `:118`. Under §16's own reconciliation (which the plan omits — m-11) `dispatch.ts`, `answer_drift.ts` and `indexer.ts` would appear as files touched by steps the table does not name.
- **Effect:** the reviewer cannot tell from §5.1 that `dispatch.ts` is edited at five steps or that `indexer.ts` gains a regret call; the contract's mechanical guarantee for §5 is satisfied by construction and false in content; an implementer following the declarations edits nothing at Steps 31–35 and the verbs never dispatch.
- **Required change (hypothesis):** declare `modify:` for every earlier-created file a step edits (S27: `answer_drift.ts`; S30: `indexer.ts` — or move the regret call into the handler's `SessionStart`/`index`-verb path and say so; S31–S35: `dispatch.ts`), regenerate, and add the §16 file-list reconciliation item (m-11). Confirm by reading every "What changes" for the verbs "add", "register", "called from" against the step's `modify:` list.

### M-4 — `large-store` is a 400 MB *store* declared as a Step 1 fixture repository; nothing before Step 7 can create its tables, so T-1-3 ("every fixture name generates") is red at Step 1 and the "cached per run directory" clause does not exist on CI
- **Class:** unbuildable-as-written / topological inversion. **REGRESSION (introduced by the round-3 corrections)** — the size, the row counts, the table names and the caching clause are the CH m-5 fix (`d667534:583` listed `large-store/ # T29-1` with no content); defining the fixture as a store of two named tables made Step 1's generator depend on Step 7's schema.
- **Plan:** Step 1 decl 724 (`create: [… test/fixtures/repos/large-store/ …]`); 759–763 (*"one deterministic generator per fixture repository … building real `git` repositories with `git init`/`git add`/`git commit` through `node:child_process` directly"*); 801 (*"`test/fixtures/repos/large-store/` — a store of the AD-23/V8 class (≈400 MB: ≈2 M `cochange_pairs` rows, ≈1 M `symbols` rows) that stresses the inventory's largest statements, generated once per run directory and cached by the generator's hash"*); T-1-3 5924–5935 (*"every fixture name §5.1 lists generates without error"*; Fails when *"any name errors"*); Step 7 1292–1431 (the schema, `depends_on: [S1, S3]`); T-29-1 6886–6893; Step 1 CI 791–799 (no cache restore); D-plan-13 4557–4569.
- **Contradicting source:** the plan's own order (Step 1 depends on nothing; the tables are Step 7's; the adapter Step 3's); `references/output-contract.md:40` (consuming what does not exist when built); testing-standards ("data comes from the real schema via migrations" — a store generated outside the migration path is anti-pattern 7 unless it runs the migrations, which do not exist at Step 1); AD-24 (`arch:1552`: the large-store case is a *replay* case "against AD-23's inventory") — a Step 29 artifact, not a Step 1 repository.
- **Effect:** T-1-3 cannot pass at Step 1 (either the generator skips `large-store`, contradicting "every name", or it cannot build it); if `large-store` is built by running the real indexer/miner over a generated repository large enough to yield ≈2 M pairs, that is a Step 14+ artifact and several minutes of CI per matrix entry per PR, uncached.
- **Required change (hypothesis):** move `large-store` out of Step 1's generator into a Step 29 (or Step 14) fixture built through the real migrations and DAOs, declared there; exempt it from T-1-3's "every name" or split T-1-3 into repositories (Step 1) and stores (later); state where the cache lives on CI (an actions cache keyed by the generator hash, or "not cached — ≈N minutes per run", measured at Step 37). Confirm by T-1-3's data field naming only git fixtures.

### M-5 — Four §11.4 entries describe executions their cited probes do not perform; the decision that leans on one of them (D-plan-8's "three runs") is evidenced by a transcription
- **Class:** unverified (transcription; the round-3 M-1/ER S3 class — "an executable claim written from arithmetic instead of execution" — in its documentary form). **REGRESSION (introduced by the round-3 corrections)** — the sentences pre-exist (`d667534:4602`, `:4607`, `:4715`, and the three-way scrub entry) as transcribed runs; the round-3 correction added `probe:` citations to them without re-deriving the entries from what the probes execute, so each entry now attests that a probe reproduces a run it does not.
- **Plan:** (a) 5528–5539 cites `probe:02_sqlite_features` for *"SQLite is 3.51.2"* and quotes outputs (`fts5 query: [{"x":"hello world"}]`, `journal_mode: {"journal_mode":"wal"} busy_timeout: {"timeout":100}`, `STRICT rejected: cannot store TEXT value in INT column s.x`, `VACUUM INTO round-trip rows: [{"x":1}]`) — probe 02 prints `fts5 MATCH rows: 1`, `journal_mode: wal busy_timeout: 100`, `STRICT text-into-INT: rejected`, `VACUUM INTO round-trip rows: 1` and no SQLite version (`expected/02_…txt`); (b) 5518–5527 cites `probe:10_readdir_import_meta_resolve` for *"`import.meta.resolve('web-tree-sitter')` returned the package's `web-tree-sitter.js` URL"* — probe 10 resolves `tree-sitter-wasms/out/tree-sitter-typescript.wasm` and prints a boolean; (c) 5640–5653 cites `probe:06_argv_realpath` for the `npx --no-install ctxoracle` mode with `argv1 = /root/.npm/_npx/…` and `execPath = /opt/node22/bin/node` — probe 06 runs `npx --yes --package=<tarball>` and prints `{argv1_basename, real_endswith, execPath_absolute}` booleans; (d) 5611–5627 cites `probe:15_claude_p_scrub.optional` for *"three ways: (1) inherited … (2) every `CLAUDE_*`/`ANTHROPIC_*` variable removed (43 variables …) (3) only [the six] removed"* — probe 15 runs two invocations (`unscrubbed`, `session-identity scrub`); D-plan-8 4469–4478 and §10A D-plan-8 5906–5908 reason from "three runs".
- **Contradicting source:** `references/output-contract.md:53` (*"the execution is kept as a probe, not transcribed … A sentence describing a run that no script reproduces is a transcription, and a transcription is not evidence a reviewer can re-run"*); Gate C `:126`; `CLAUDE.md` rule 1 (report only what was observed — the probe's output is what is observed now).
- **Effect:** `derive --check` and the probe runner both pass (a citation exists; the probe's own expectation matches), while the entry's claim outruns the probe — the exact gap the probe regime exists to close. The D-plan-8 narrowing argument (drop only six variables, keep `ANTHROPIC_BASE_URL`) rests on run (2), which no artifact reproduces; the SQLite version, the `web-tree-sitter` resolve and the `--no-install` mode are asserted by nothing runnable.
- **Required change (hypothesis):** re-derive each entry from its probe's expectation — state only what the probe prints — and either extend the probes to cover the additional legs (probe 15's "everything removed" run; probe 02's `sqlite_version()`; probe 06's `--no-install` mode, if the plan still needs it) or delete the extra claims; re-derive D-plan-8's reasoning from the runs the probe performs. Confirm by reading every §11.4 sentence that names a value against the `expected/` file of the probe it cites.

### M-6 — The deferral vocabulary's single-word members plus the clause-level substring discard make any clause containing `later` content-free, and the resulting holds fall into the reason code Step 26 excludes from `deny_despite_answer_text` — a wrongful-deny class the exit report cannot see
- **Class:** reduction (of FR-B5's "only an empty deferral fails to clear") in the hold direction, made unmeasurable by the diagnostic's exclusion. **REGRESSION (introduced by the round-3 corrections)** — the members (`later`, `in a moment`, `first let me`, `before i answer`) are the M-10 fix (`d667534:1595–1604` named no members), the clause-level substring rule is the M-8/ER m9 fix (D-plan-24), and the `deferral_only` exclusion is the S-2 fix; each is correct in isolation and the three together create the class.
- **Plan:** 1835–1837 (*"`lexicon.deferral_stoplist` (`i'll get to that`, … `later`, `in a moment`, `first let me`, `before i answer`)"*); 2655–2657 (*"discard every clause that contains a deferral-stoplist phrase anywhere in it"*); probe 16 (`DEFER.some(d => low.includes(d))`); T-23-2 6623–6637 (no case with a substantive clause carrying a stoplist word alone); Step 26 2938–2942 (*"Turns rejected as `deferral_only` or `acknowledgement_only` are excluded"*); Step 39 4107–4109 (the wrongful-deny components); D-plan-24 4684–4699; §10A 5183–5197 (*"What the rule must never do is hold on an answered question because of where the deferral sat, and the executed cases (§11.4) show it does not"* — the executed cases contain no such input).
- **Contradicting source:** spec FR-B5 438–439 (*"errs **toward clearing** on a substantive answer (only an empty deferral fails to clear)"*); FR-B1 367–369 (*"A **content-free** deferral … does not clear it"*); P3 (137–138, no format tax); arch AD-9 781–782 (*"not a recognized content-free deferral ('I'll get to that'-class)"* — a class of phrases, not a word); AD-9 823–826 (the deferral-false-match miss "is caught only by the human channel" — true of a *false* stoplist match, which is what this is, but the plan's report counts nothing for it while counting the deny after it as correct). Example inputs under the plan's rule: *"The cron fires later."* (one clause; discarded; no clear); *"Yes — later than the seed, at line 40."* (clause 2 discarded, clause 1 "yes" survives → clears — inconsistent with the first by punctuation alone, the §10A question's own point).
- **Effect:** a compliant agent whose one-clause answer contains `later` is denied on its next `Edit`; the deny is filed as a correct deny of a dodge; the exit report's wrongful-deny rate — a Phase A exit number Phase B is designed from (§11.5) — omits the class; the human channel is the only recourse and Max Cogar sees a deny reason that quotes his answered question.
- **Required change (hypothesis):** restrict the deferral list to multi-word phrases of the "I'll get to that" class (drop `later`, `in a moment`, `first let me` as bare members or anchor them as clause-initial phrases), state the match as phrase-at-clause-start rather than substring, add T-23-2 cases with a substantive clause containing `later`/`first` that must clear, and re-run probe 16 over the widened table; or, if the hold is kept, count `deferral_only`-then-deny under a labelled non-wrongful diagnostic the report prints so the class is visible. Confirm by the widened case table passing under the rule.

### M-7 — The FTS5 fallback AD-2 mandates is unbuildable: migration 001 unconditionally creates two FTS5 virtual tables, `init` applies it after the probe, and no test exercises the fallback path
- **Class:** unbuildable-as-written / cannot-fail (the fallback is asserted and never tested). Not a regression — `d667534:1286` carried the same comment.
- **Plan:** 1425–1430 (*"-- FTS5 (created only when Step 3's `probeFts5` returned true; otherwise `schema_meta.fts_state = 'fallback'` and search uses indexed LIKE): CREATE VIRTUAL TABLE fts_symbols USING fts5(…); CREATE VIRTUAL TABLE fts_paths USING fts5(…);"* — inside a static `.sql` file); 1441–1443 (*"`migration_runner.ts` — reads `schema_meta.schema_version`, applies numbered migrations in order"* — no conditional); Step 31 items 1 and 3, 3377–3389 (*"on a failed probe continue with the `LIKE` fallback … apply migrations 001 and 002"*); Step 3 953–957; T-7-1 6094–6107 (migration applies — on an FTS5 runtime only); T-3-4 6001–6009 (probe true only); T-38-25 7474–7476 (fails "when … the FTS5 probe is false"); Step 14 (the indexer writes "FTS5 tables" with no fallback branch, 1991–1997); Step 18's Orientation/Reuse "FTS5-query" (2264–2265, 2272–2273).
- **Contradicting source:** arch AD-2 337–341 (*"on that failure path, search falls back to indexed `LIKE`/token-prefix queries behind the same interface, and `status` says so plainly"*); expert-plan Step 8 / Gate C (no deferred choice: how the runner skips the `CREATE VIRTUAL TABLE` statements, what `LIKE` indexes exist instead, and which module implements "the same interface" are all unstated); testing-standards ("every test must be able to fail" — no test can fail on a broken fallback because none runs it).
- **Effect:** on a distro Node compiled without FTS5 — the case AD-2 built the probe for — `init` fails at migration 001 with a `no such module: fts5` error after announcing the fallback; the announced degraded mode is a sentence, not a path.
- **Required change (hypothesis):** split the FTS DDL into a conditional migration (or a runner branch keyed on `probeFts5`), define the `LIKE` fallback's indexes and the search interface both frontends implement, and add a fallback case to T-7-1/T-14-1 (run the migration with the FTS statements suppressed and assert the indexer and the two FTS-using genres still answer) — or state that Phase A does not ship the fallback and record the AD-2 divergence as an owner-visible `init` failure with a plain-language message. Confirm by running `init` on a store where `probeFts5` is forced false.

### M-8 — The recognizer floor's recall/precision sample pools leg-1 and leg-2 human turns into one `N`, contradicting the report's own "every number per leg" rule, and leg-2 turns are authored by the labeller under a protocol that prescribes their shape
- **Class:** fake-completeness (measurement layer) — the guard shares the recognizer's author (collapse-log 837–846) one layer up. Not a regression — `d667534:3327–3328` pooled the same two sources; the per-leg rule the correction added (4101) is what now contradicts it.
- **Plan:** 4078–4095 (*"From the human turns of the leg 1 corpus and the leg 2 transcripts, `exit-run.sh` draws a seeded random sample of `N = min(200, all human turns)` … the implementing agent labels each sampled turn"*); 4101 (*"every number below is given per leg, never as a total across legs"*); 4042–4045 (*"asks at least one `?`-terminated question and at least one indirect ask without a `?`"* — the driver is the implementing agent, 4022–4023); 4119–4124 (the "honest floor numbers Max Cogar reads" — recall and precision "with their sample size").
- **Contradicting source:** spec §11.5 752–757 (the floor is "how little the conservative recognizer catches" on the owner's real repos and transcripts — real usage); IDEAS.md #14 (a Goodhart trap: tuning against trajectories the measurer authored); collapse-log 2026-08-25 item 1 (a guard derived by the thing it guards guards nothing — here the *inputs* are authored by the agent that knows the rule the recognizer implements and the rule the labeller applies); the plan's own per-leg rule.
- **Effect:** the headline floor number mixes real transcripts (where the intake-miss class is whatever Max Cogar actually wrote) with agent-scripted turns whose `?`/no-`?` split is dictated by the protocol; recall over the pooled sample is neither the real floor nor the protocol compliance rate, and the report cannot separate them.
- **Required change (hypothesis):** draw and report the sample per leg (two `N`s, two recall/precision pairs), label leg-2's numbers as protocol-driven, and let the leg-2 indirect-ask outcomes (4122–4123) stand as the closed-loop measurement they are rather than folding them into recall. Confirm by the report template carrying two label appendices.

### m-1 — T-38-25's File line says the script is "invoked by Step 1's `cold-container` CI job"; Step 1 says the job "is added by Step 38"
- **Class:** counts/referents drifting. **REGRESSION (introduced by the round-3 corrections)** — the sentence is unchanged from `d667534:6417`; the ER M1 / CH M-5 correction moved the job to Step 38 (795–799, 3910–3916) and did not re-derive it.
- **Plan:** 7467–7468 vs 798–799, 3910–3911.
- **Required change:** "invoked by the `cold-container` CI job Step 38 adds".

### m-2 — §10A D-plan-13 still steers toward "Fast tier every commit; replay at the checkpoints"; §10 D-plan-13 now runs the replay tier in the every-PR job from Step 28
- **Class:** attestation left stale by an edit elsewhere. **REGRESSION (introduced by the round-3 corrections)** — the steer sentence is `d667534:4158` unchanged; the CH M-6 correction rewrote D-plan-13 (4557–4569) under it.
- **Plan:** 5011 vs 4557–4560; the §10A answer (5006–5010) also still argues from "Checkpoints 3 and 4 and the exit run each require the replay tier green" as the mitigation, which is no longer the decision's mechanism.
- **Required change:** re-derive the §10A entry from the rewritten decision.

### m-3 — T-18-8 carries no negated negative; the negation clause Step 18 added has no test, and the generated corpus cannot contain one by construction
- **Class:** wrong-check (round-3 m-4 partially closed — the rule landed, the data did not).
- **Plan:** 2301–2304 (the negation clause) vs 6485–6494 (negatives: "Is this done?", "Working on the next part.", "Fixed the parser. Now looking at the tests.", and a corpus "none containing a lexicon phrase").
- **Required change:** add "Not done yet." / "This isn't finished." / "I haven't fixed it." as asserted negatives, and a positive with a negation in an *earlier* clause ("Not the tests, but the parser is done.") so the clause scope is pinned.

### m-4 — T-38-22 runs inside `unshare -rn` with no absent/refused branch; T-32-2 has one
- **Class:** sibling instance of ER T3's closure left open.
- **Plan:** 7432–7439 (*"any event or verb fails inside the namespace"*) vs 7012–7017 (records an unavailable or refusing `unshare` as not executed).
- **Required change:** give T-38-22 the same branch and name T-32-3 as the assertion that then carries AC-11's no-egress clause.

### m-5 — Step 6 says a missing `tuning` row makes "Step 12's consumer fall back to its stated seed"; Step 12 says the reader re-seeds from `tuning_seeds.ts` and "no consuming module carries a number of its own"
- **Class:** unapplied sibling wording (round-3 m-3 closed at Step 12, not at Step 6).
- **Plan:** 1214–1216 vs 1799–1804, 1883–1885.
- **Required change:** "the `TuningReader` re-seeds the key from `tuning_seeds.ts` and records this code".

### m-6 — The totally-dead detector's `<cwd-slug>` rule is unstated, and `diag/status.ts` becomes a second module that knows the transcript layout AD-11 confines to `locate.ts`
- **Class:** unbuildable-as-written (a deferred choice on an undocumented layout) / AD-11 tension.
- **Plan:** 3588–3592 (*"transcripts under `~/.claude/projects/<cwd-slug>/` for this repository"*); §11.4 5688 (the one observed path, `/root/.claude/projects/-home-user-agent-armory/<session>.jsonl`); 4701–4703. **Source:** arch AD-11 949–951 (*"`transcript/locate.ts` is the only file that knows where transcripts live"*); V12 (the layout is undocumented).
- **Required change:** state the slug rule (the observed encoding: the realpath with `/` replaced by `-`), put the enumeration in `locate.ts` behind a function `status` calls, and record the rule as a V12-class premise verified at build (it is the same undocumented layout).

### m-7 — How the `.sql` migration files reach the built package is unspecified
- **Class:** unbuildable-as-written (deferred choice).
- **Plan:** 738 (`"build": "tsc -p tsconfig.json"` — `tsc` emits no `.sql`), 1441–1443 (the runner "applies numbered migrations" from an unstated location), 733–740 (no `files` field, no copy step). **Source:** expert-plan Step 8 (name the paths); AD-25 (`tsc` only).
- **Required change:** state the runtime path (e.g. resolved from `import.meta.url` to `../../../src/stores/migrations/` with `src/` shipped in the package, or an explicit copy into `dist/` by a script the plan declares) and the package `files` list.

### m-8 — `locate.ts` "records `agent_transcript_path`" while `InternalEvent` has no member for it and the name is on T-28-2's forbidden list
- **Class:** unbuildable-as-written. Not a regression (`d667534` had neither the member nor a different sentence).
- **Plan:** 2485 vs 1219–1223 (`InternalEvent` members) and 3087–3088 (`agent_transcript_path` scanned outside the adapter).
- **Required change:** either add `agentTranscriptPath?` to `InternalEvent` (the adapter maps it) or delete the "records" sentence — Phase A never opens it (AD-11).

### m-9 — Two deny-health detectors read per-turn classification results the store never holds
- **Class:** unbuildable-as-written (a schema decision the implementer must make). Not a regression in signature (`d667534:2441–2448` identical); the `below_length_floor` reason requirement (2934–2937) is the round-3 S-2 fix and adds a per-turn field with no home.
- **Plan:** 2931–2937 (*"`checkDenyLoop(store, consumer)` — ≥ `deny.loop_threshold` consecutive `kind='deny'` audit rows with no intervening assistant text"*; *"`checkDenyDespiteAnswerText(store, consumer)` — … ≥ 1 intervening assistant text turn that the clear recognizer (Step 23) rejected with reason `below_length_floor`"*); the schema 1321–1431 (no table of assistant turns or rejection reasons; `questions.closed_by_uuid` records clearing turns only); AD-1 (each event a fresh process — the classified turns of an earlier event's catch-up are gone). **Source:** arch AD-9 819–826, 841–842 (both detectors are defined over turns the transcript shows, across events); expert-plan Step 8.
- **Required change:** record each classified assistant turn (uuid, timestamp, `clears`, reason) in a store table written by catch-up (declare it in Step 7 and its DAO in Step 9, or in `classify_state`), or pass the classified turns to both detectors and bound them to the current catch-up with the limitation stated; add a T-26-1 case spanning two events.

### m-10 — The replay tier's every-PR cost is unquantified and the `large-store` cache does not exist on CI
- **Class:** unstated cost of a decision (D-plan-13 "takes longer").
- **Plan:** 4557–4569, 801 ("cached by the generator's hash" — per run directory), 791–799 (no cache restore; two matrix entries).
- **Required change:** measure at Step 37 and state the minutes; if the store is rebuilt per run, say so; if an actions cache is used, declare the workflow change.

### m-11 — §16 lacks the file-list reconciliation the output contract requires
- **Class:** contract non-compliance (a required post-completion element absent).
- **Plan:** 8092–8141 (items 1–7: exported-surface check present; no `git diff --stat` against the §5 table). **Source:** `references/output-contract.md:67` (*"Include a **file-list reconciliation**: `git diff --stat` against the pre-implementation baseline is compared with section 5's generated file→step table in both directions"*). It is the check that would surface M-3 at implementation time.
- **Required change:** add the item.

### m-12 — T-16-1's stale-index datum still varies `schema_meta.index_head` against `HEAD`; `passesBar` now takes `ctx: {indexStale}` and reads neither
- **Class:** test data left stale by the signature fix. **REGRESSION (introduced by the round-3 corrections)** — the datum is `d667534` T16-1 unchanged; the ER M2 correction changed the signature (2131–2137) under it.
- **Plan:** 6346–6349 vs 2131–2137.
- **Required change:** the datum is `ctx.indexStale` true/false for the same candidate.

---

## (e) Verdict

**DOES NOT SURVIVE.** 2 Serious, 8 Moderate, 12 Minor. One §10A decision
collapses (D-plan-26), three partially collapse (D-plan-5, D-plan-10,
D-plan-24). Eleven findings are REGRESSION-tagged — S-1, S-2, M-1, M-2,
M-3, M-4, M-5, M-6, m-1, m-2, m-12 — each with the `d667534` line and the
mechanism (new wrong text, or an unchanged sentence whose referent the
correction moved) named. That is the third consecutive round in which the
correction pass introduced defects; by the owner's rule the count above
zero means the replaced process did not hold, and the diagnosis reopens —
this time not on identifier reconciliation but on what the new mechanical
check can and cannot see (S-1), and on a leg whose executability was
re-derived without a dry run in its own environment (S-2). What survived,
and survived well: Steps 21–27 are AD-9 and nothing more on every axis the
2026-09-04 collapse ran on; the per-leg deny split, the declared corpus
origin, the blind-before-replay labelling and the published label table
are real measurement discipline; sixteen of seventeen probes reproduce
here, and the shipped scrub, the argv resolution, the brand, the fixture
exclusion and the clause rule were re-executed today by the plan's own
scripts.

**What I could not check, and why.** (1) Whether a session created by the
implementing agent's remote tooling is treated as interactive or SDK under
the hooks reference's settings-file trust rule, and whether a settings-file
hook written mid-session loads in that session — the page documents the two
branches and a `ConfigChange` event, not the tooling's session kind; S-2
therefore asks the plan to state the kind and dry-run the sequence rather
than asserting either branch. (2) Whether probe 07's one failure in two
runner runs reproduces on the GitHub Actions runner under `node --test`
concurrency — M-1 records the local rate (1 of 2 runner runs, 0 of 6 direct
runs) and asks for a load-tested expectation, not a specific rate. (3)
Behaviour at the Node 22.16.0 floor (only v22.22.2 is available here, as in
rounds 2–3). (4) The reasoning quality of the Clear Thought chains beyond
their coverage and their concluding thoughts (every D-plan label was found
across the two files; the conclusions read for D-plan-5, 13, 16–23 match
§10). (5) Whether the `large-store` fixture, built through the real
migrations at a later step, generates in a time CI tolerates — the plan
must measure it. (6) The `CodeGraph` absence claims in §11.6 (the servers
were not launched here; the claims are consistent with the directory
listing). Every other claim above rests on a read at the cited lines or on
an execution whose command and output are recorded in the finding. Nothing
rests on the author's round-4 self-check; where it and the source disagree
(the T-14-2 rewording; the ER m10 closure; the trust-rule attribution; the
probe run's exit status), the source was used.
