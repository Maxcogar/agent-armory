# Collapse log

Cumulative, cross-session record of **hollow decisions** caught in this project
— a decision that was sourced and lifecycle-clean but collapsed the moment
someone asked what mission-need it served. Mandated by `CLAUDE.md` ("no hollow
decisions — and the owner never catches them").

**Read this before designing.** Add an entry whenever a collapse is found, by
anyone. The point is that recurring traps become visible across sessions
instead of rediscovered each time — and that the pattern of *how* this project
goes hollow is itself data.

**Class legend:**
- **reduction** — collapsed a deliberately broad requirement into one narrow function.
- **wrong-check** — checked an easy property instead of the one that matters.
- **posture** — adopted a stance the tool forbids (gate / safety-net / policing instead of guide).
- **unverified** — asserted a capability or behavior without checking it against source.
- **mechanism-not-mission** — justified by how it works, not by the mission-need it serves.

---

## 2026-09-07 — round 12: after the same mechanism's fourth consecutive round of "narrow the window, find a new one," the fix was to stop narrowing and remove the primitive that made narrowing necessary

Round 12 found that round 11's own remediation code (the content-token
fix's mismatch-restore branch, `fs.renameSync` back onto `lockPath`) was
itself an unguarded, non-exclusive write: during the brief window it left
the lock path vacant, a completely unrelated, ordinary third-process lock
acquisition could land there and be silently clobbered when the restore
fired — reproduced independently by both a collapse-hunt and an
expert-review, each via real multi-process OS execution (two and three
genuinely separate processes respectively), with zero variance across
repeated runs. This was the fourth consecutive round — 9, 10, 11, 12 — in
which the specific remediation code the immediately prior round had just
added to this one mechanism (the reindex directory lock in
`docs/plans/plan-phase-a.md`'s Step 37) contained a new instance of the
same defect class it was written to close.

**The pattern across all four rounds.** Round 9: a plain `unlink` with no
release step. Round 10: an unsynchronized `unlink`-then-recreate reclaim.
Round 11: an atomic-rename reclaim, still racing a delayed reclaimer.
Round 12: the delayed-reclaimer fix's own restore branch, racing an
unrelated third acquirer. Every one of the four fixes was independently
verified by direct execution at the time it was written, and every one
was independently found broken by the next round's own, harder execution.
This is not a failure of verification rigor — each round's execution was
real, adversarial, and correctly scoped to what it tested — it is a
structural property of the primitive being patched: a bare filesystem
path, manipulated via `rename`/`link`/`unlink`, has no atomic "read
current state, and only then write" operation. Every implementation built
from those primitives alone is a check-then-act race by construction; the
only question each round answered was *which* interleaving was wide
enough to exploit it, not *whether* one existed.

**The fix, and the sharpened lesson.** Round 12 did not add a fifth,
narrower patch. It replaced the primitive: the reindex lock became a row
in `global_meta`, mutated only inside `BEGIN IMMEDIATE` transactions
against `store.db` — the identical mechanism this same Step 37 already
trusted, one paragraph away, to serialize the `whisper_stats` fold.
Because SQLite does not allow two `BEGIN IMMEDIATE` transactions against
one database to interleave their reads and writes at all, the entire
defect class four rounds each found a new instance of is excluded by
construction, not narrowed a fifth time. The generalized lesson: when a
concurrency fix's own remediation code needs a fix, and that fix's
remediation code then needs a fix, the signal to read is not "we haven't
found the right interleaving guard yet" — it is "the underlying primitive
cannot express the invariant being asked of it." The tell is structural,
not statistical: check whether the shared resource already lives behind
a stronger primitive (here, a transactional store already open in the
same process) before writing a third, fourth, or fifth variation of a
check-then-act guard on a primitive that was never designed to support
one. This generalizes round 11's own lesson (construct the interleaving
that maximizes a race's vulnerable duration) one level further: past a
certain number of rounds each finding a new interleaving in the same
mechanism, the correct response stops being "construct a harder
interleaving" and becomes "stop trying to fix this primitive."

**Class: mechanism-not-mission** (the filesystem-lock design was
defended, four times, by how each patch worked — narrowing this specific
window — rather than by whether the mission-need, real mutual exclusion
with no known race, was actually met; it never was, until the primitive
itself was replaced).

---

## 2026-09-07 — round 11: a fix's own collapse-test and unit test are not independent verification of it when both are authored against the same narrow scenario its author had in mind — and a plausible identity check (a file's inode) can be wrong in a way only execution reveals

Round 11 found that round 10's own atomic-rename fix for Step 37's
stale-lock reclaim — itself a fix for round 9's plain unlink-based race —
closed only the narrow case it was built and tested against: two
reclaimers' rename calls colliding on the same, still-present file at the
same instant. It left open a wider, dominant case: a reclaimer that made
its staleness decision early and was then delayed (ordinary OS scheduling,
disk contention, a busy host — nothing the algorithm bounds) can later
rename away a completely different, live lock that a faster reclaimer
legitimately created and is actively running against in the interim. Both
the round-11 expert-review (a hand-interleaved reproduction) and the
round-11 collapse-hunt (a real two-OS-process reproduction — genuinely
separate `node` processes, not simulated interleaving in one process)
independently found and reproduced this.

**Why this survived round 10's own review.** Round 10's own new unit test
(`T37-3` case (d)) and its own new collapse-test (N7) were both authored to
interrogate the exact mechanism round 10 had just built, and both were
written against the same narrow scenario round 10's author had in mind —
two renames issued "back-to-back with no serialization between them."
Under that literal scenario the fix is genuinely safe, and both the test
and the collapse-test correctly certified it. Neither construction asked
what happens across the much larger window a full reclaim-and-recreate
cycle actually leaves open once the winner starts doing real work. A test
suite and a collapse-test that both pass against a self-selected scenario
are not independent verification of a fix if neither one was constructed
adversarially against the fix's own literal mechanism.

**The sharpened lesson.** When a fix targets a concurrency defect,
construct the interleaving that maximizes the vulnerable window's
*duration*, not only the interleaving that maximizes apparent
simultaneity. The widest window is usually not the one where two
operations appear to happen "at the same instant" — it is the one where
the first operation's entire remaining work happens to fall inside the
second operation's decision window. A collapse-test's "hardest question"
is only as hard as the interleaving its author thought to construct; this
project's own review process caught the gap only because round 11 was
independently instructed to re-execute round 10's fix mechanism from
scratch rather than trust the corrected prose, per round 9's own
already-logged lesson — and even that would not have been enough without
deliberately searching for the *widest*, not merely the
*hardest-looking*, timing shape.

**A second, independently useful lesson from the same round: a plausible
identity check can be wrong, and only execution reveals it.** The
round-11 collapse-hunt tried the most obvious-looking fix for the race —
comparing a stale-lock candidate's filesystem inode number before and
after the rename — and found it insufficient by direct execution:
`unlinkSync` immediately followed by `openSync(O_CREAT)` at the same path
routinely triggers fast inode-number reuse on several common filesystems,
so a losing reclaimer's post-rename inode comparison can report a false
match against a brand-new, unrelated file. A content token written into
the lock file's own bytes at every creation — never reused, unlike an
inode number — does not have this failure mode, verified across three
repeated real two-process runs, and is the mechanism Step 37 now
specifies. Filesystem metadata that looks like stable identity is not
always stable identity; "verify before you assert" applies as much to a
fix's own proposed remedy as to the original claim it corrects.

**Class: unverified** — a fix-pass closure claim (Step 37, N7, `T37-3`)
and a plausible-looking identity check (device+inode), both asserted or
tried without the specific execution that would have falsified them.

---

## 2026-09-07 — round 10: re-verifying the same axis a fourth time is not the same as checking a new one — the plan's own foundational dependency pin was functionally broken behind a metadata-only "verified" premise, for ten architecture rounds and nine plan rounds

Round 10's expert-review found the most consequential defect yet in this
plan's nine-round history: `web-tree-sitter@0.26.13` paired with
`tree-sitter-wasms@0.1.13` — the plan's pinned tree-sitter dependencies,
inherited from architecture premise V14 — cannot load a single grammar.
Direct execution shows `Language.load()` throws unconditionally for
every sampled language, because 0.26.x's loader requires a WASM
`"dylink.0"` custom section that `tree-sitter-wasms@0.1.13`'s grammar
files do not carry. This breaks Step 22 (the tree-sitter frontend)
entirely, as literally specified, threatening every whisper genre
depending on precise symbol/import extraction — Phase A's single most
consequential mechanism failure found across ten rounds of review.

**Why this survived so long.** Reading architecture's full V1–V19
premise table, V14 alone is verified by "npm registry metadata fetched"
— every other premise was verified by direct execution or a
documentation quote. That metadata check (currency, no install
scripts) was itself correct and answered a real question (C-3
compliance) — but a different question than the one the plan actually
builds on (that the parser can load these grammars at all). Three
separate review rounds (6, 7, 9) re-verified this same dependency pin
and each time correctly confirmed the *semver range's* behavior
(`^0.26.13` excludes `0.27.0`) — a real, valuable check, repeated
three times, that never touched the *functional* axis because nothing
prompted anyone to ask a different question about the same citation.

**The sharpened lesson.** Re-verifying a claim along the same axis a
prior finding already checked is not the same as checking a new axis,
no matter how many times it is repeated — three correct semver
re-checks produced zero coverage of whether the two packages actually
work together. A claim's own "how verified" citation is worth reading
for what it does *not* say it checked, not only for what it says it
did: V14's own text read "npm registry metadata," in plain sight,
across every round that cited it, and no round asked what that method
could not have established. This is also the first execute-don't-assume
finding in this document's history (rounds 6-9 each executed one
library's or tool's own documented behavior) that required executing
**two** pinned packages **together** — a cross-package integration
check, not a single-tool behavior check — which is exactly the kind of
assumption `CLAUDE.md`'s "spikes before design-freeze" rule exists to
force before an architecture ships a dependency pairing, not nine plan
rounds later. The fix (a verified-working `0.25.x` floor) is
straightforward; the standing prescription is procedural: when a round
re-checks an already-checked citation, ask explicitly which axis the
prior checks covered and deliberately pick a different one, rather than
re-running the same check a fourth time and letting the repetition read
as increasing confidence.

## 2026-09-07 — round 9: a fix that *reads* as closing a collapse is not closed until its own literal mechanism is executed against its own cited example — the execute-don't-assume method turned on itself

Round 8 fixed two defects it found by execution (a `flock`(2) syscall
that doesn't exist; a co-change miner that didn't handle git's
rename-collapsed `--numstat` output) and, for the second, wrote a fix
whose prose read as complete: "if the field matches [a regex], expand
the brace form if present into the real old and new paths." Round 9
did something no round had yet done to a fix rather than an original
claim: it took the fix's own stated mechanism — the one regex —
and ran it, literally, against the fix's own cited example
(`src/{utils => other}/c.txt`). The regex does not expand anything; it
captures `"src/{utils"` and `"other}/c.txt"`, reproducing byte-for-byte
the corruption the fix existed to prevent. Round 9 went further and
constructed a fourth rename scenario beyond round 8's three — a
same-directory, same-extension rename, the single most ordinary
refactor a developer performs — and found it *also* triggers the
brace form, meaning the gap round 8's fix left open was not an edge
case but the dominant shape.

A second, independent instance recurred in round 8's other fix: the
replacement for `flock`(2) (a real `O_CREAT|O_EXCL` lock file) works
correctly for acquisition, but round 8 never specified releasing it.
`flock`(2)'s kernel-mediated auto-release on process exit was a
property the *original, wrong* citation would have provided for free;
the correct replacement primitive does not have that property, and
nothing in the fix compensated. As literally specified, the detached
reindex's self-refresh would succeed exactly once per project and then
fail `EEXIST` forever after — a silent, permanent regression in the
freshness mechanism the lock exists to protect, introduced by the fix
that closed the syscall-existence finding.

A third, smaller instance: round 8's own two collapse-hunt findings
(the git-invocation distinction, the rename-detection addition) were
correctly fixed at their primary sites but never logged into section
11's claims registry — in the same commit that correctly logged round
8's two *expert-review* findings into that same registry. The
discipline was applied inconsistently within one fix pass, not absent
from it.

Class: **unverified**, but a new axis within it, sharper than every
prior 2026-09-07 entry: previous entries found a *false claim* nobody
had executed. This round found that *the fix for a false claim* is
itself an unverified claim until someone executes the fix's own
literal text against the exact scenario the original finding named.
"Corrected this fix pass" is not evidence of correction — it is a
claim, exactly as "authoritative standard: X's docs say Y" was a claim
in rounds 6–8, and it requires the identical execute-don't-assume
discipline applied to itself. The standing prescription, now doubled:
every fix to an execute-verified finding must itself be re-executed
against the original finding's exact reproduction case before being
trusted as closed — a round that only re-reads a "corrected" annotation
is doing exactly the surface-level check this project's whole review
lineage exists to replace with something stronger.

## 2026-09-07 — round 8: the execute-don't-assume method generalized from library citations to shell-command output shapes, and found a silent data-corruption defect — the most consequential class yet, because it would not fail loudly

Round 8 pushed round 6/7's "verify a familiar tool by execution" method
one level further: instead of checking whether a named library API or
class exists, it constructed the actual input states a plan step's own
shell command would see and ran the command, checking whether its
output matches what the surrounding parsing logic assumes. Two findings
resulted, both in load-bearing foundation mechanisms (repo-identity
resolution, co-change mining) that determine what data the rest of
Phase A's build reads.

**Step 5's repo-key algorithm** labeled two genuinely different
`git rev-parse --is-inside-work-tree` outcomes — the command succeeding
and printing the literal string `false` (a bare repository) vs. the
command failing outright with a fatal error (no git repository at all,
exit 128) — under one shared "→ false" label, routing both to the same
next step. Direct execution against a constructed non-git directory
(exactly the plan's own `T5-1` fixture (d)) showed the true no-git case
never reaches the plan's own stated fallback path, because the
algorithm's text describes testing for a returned boolean, not for an
invocation that never returns one. This is self-revealing in one sense
(an implementer's natural try/catch-wraps-to-false instinct happens to
paper over the gap) but not authorized by the plan's own text, which
`expert-plan`'s "execute without a single decision on the fly" standard
does not permit.

**Step 20's co-change miner** runs `git log --numstat -M` (rename
detection) but never accounted for `-M`'s effect on `--numstat`'s own
output grammar: a detected rename collapses to a single `old => new`
line (or a brace-abbreviated compaction for shared path prefixes/
suffixes), not the plain single-path line the miner's touched-file-set
extraction implicitly assumed every line would be. Verified by
constructing three real rename scenarios and executing the exact
command the plan specifies.

**Why this pair matters more than every "too basic to check" finding
before it.** Rounds 6 and 7's findings (the semver claim, the
`SqliteError` citation, the `flock`(2) citation) were all
**self-revealing**: an implementer who tried to act on the false claim
would hit an immediate, loud failure (a build error, an unresolved
identifier, a missing API) at the exact moment they used it. Step 20's
finding is **silent**: a mishandled rename does not throw — it
generates a malformed "file path" that gets silently absorbed or
dropped, corrupting the co-change signal for every renamed file with no
diagnostic, no crash, and (until this round) no test. This is the
2026-09-04 "fake completeness corrupts the data the rest of the build
reads" lesson recurring in its purest form: not as an elaborated
classifier dressed to look like it works, but as an unexamined
assumption about a command's own output syntax feeding directly into
Step 42's real-repo exit-run measurement — the exact mission-critical
deliverable `CLAUDE.md` rule 3 exists to keep honest. Worse, the
"Collapse-tests re-attacked" pass this round found that a
rename-corrupted miner would produce a *lower* Coupling/Consequence/
Completeness/Warning count on real repos — indistinguishable, inside
the exit report's own success criteria, from the honest low-coverage
floor Phase A is supposed to report. A false floor and a true floor
read identically in the current report format; only a fixture
exercising the exact defect can tell them apart before the exit run
runs on data nobody can re-collect after the fact.

Class: **unverified**, but a new severity axis within it: self-revealing
vs. silent. **The lesson to carry forward:** when generalizing an
execute-don't-assume sweep, prioritize commands whose output feeds a
*parsing/extraction* step over commands whose output feeds a *boolean
branch* or a *type check* — a parser that silently accepts malformed
input is strictly more dangerous than a branch or type reference that
fails loudly, because the first produces wrong data that looks like
right data, and the second produces an error that stops the build
before anyone trusts the result.

## 2026-09-07 — round 7: the plan's own foundation step could not build (npm ci with no lockfile), and a second unverified "too basic to check" library claim recurred

Round 7 generalized round 6's lesson — verify a claim about a "familiar"
mechanism by execution, don't accept it because it feels too basic to be
wrong — and immediately found two more instances, one of them the most
severe defect found in this plan since round 1.

**Expert-review, Critical.** Step 1 specifies `npm ci` as the first
command of both its own acceptance test and the CI workflow gating every
PR, but no step anywhere in the 43-step plan ever creates or commits a
`package-lock.json`. Direct execution of `npm ci` against exactly the
scenario the plan specifies (a fresh `package.json`, no lockfile)
produced an immediate, unconditional `EUSAGE` failure — not a version-
drift risk of the kind round 6 examined and left as a disclosed
residual, but a hard stop before any dependency resolution is even
attempted. This means the plan's own first buildable step, and every CI
run on every PR, would fail at the very first command, before a single
line of code is type-checked — a defect upstream of every other
checkpoint in the document, undetected across six prior review rounds
because `npm ci` is exactly the kind of routine, "everyone knows how
this works" command nobody thought to actually run.

**Collapse-hunt, a second instance of round 6's exact class.** Step 2
cited "Node's official `node:sqlite` documentation" for a `SqliteError`
class thrown on statement failure. Direct execution against a live
Node runtime, corroborated by fetching the official docs page, showed
`node:sqlite` exports no such class — a statement failure throws a
plain `Error` with `code: 'ERR_SQLITE_ERROR'`. The claim was plan-
original (not inherited from the architecture), never logged in the
plan's own §11 claims registry despite that registry's stated job being
"every factual claim this plan asserts," and survived seven
authorship/review passes because `SqliteError` is the conventional,
expected name for a database-driver error class (mirroring a
*different*, rejected npm package's real error type) — it read as
obviously correct.

Class: **unverified**, the same class as round 6, now confirmed
recurring rather than a one-off. **The lesson, sharpened again:** round
6 asked whether "verify, don't assume" applies to familiar mechanisms;
round 7 answers that the answer is yes, more than once, in the same
review round, at sites nobody had previously flagged as suspect. Both
of round 7's findings were found by deliberately generalizing round 6's
method — enumerating every "authoritative standard" / "documentation
says" citation in the document and running the checkable ones against a
real instrument, rather than re-checking only the specific claim round
6 had already found. Practically: round 6's finding was benign (real
behavior safer than believed) and round 7's `node:sqlite` finding was
self-revealing (a build would fail loudly if anyone tried to use the
false claim) — but round 7's `npm ci` finding was neither: it is a
silent, load-bearing failure mode that would not surface until an
implementer actually tried to build the plan's very first step, and no
amount of reading the plan's prose would catch it without running the
command. The standing prescription going forward: a plan's own
"authoritative standard" and "Cite:" fields are not exempt from
`CLAUDE.md`'s "verify external facts... before building on them" rule
merely because the fact is routine — routine is exactly the shape this
class of defect hides behind.

## 2026-09-07 — round 6: a load-bearing collapse-test's "hardest question" rested on an unverified library-behavior claim that was false, and survived unchecked for six review rounds

Round 6's expert-review found that D-plan-2 (the dependency-floor
decision for `web-tree-sitter`) and its cross-reference in the plan's
bin-2 owner register both asserted that the npm caret range `^0.26.13`
"accepts 0.27.0 anyway" — the premise for the entry's entire "hardest
question" (is the pin drift theater?). This claim traces to the plan's
original 2026-09-06 authoring and was repeated, unchecked, by that same
day's meta-check and collapse-hunt. Five subsequent independent review
rounds (2 through 5) also passed over it without running an actual
semver evaluator — each accepted the premise as given and reasoned about
its *consequences*, never its *truth*. Round 6 installed the `semver`
npm package and ran it directly: `^0.26.13` is anchored at the minor
version for a pre-1.0 package and **excludes** `0.27.0` entirely. The
plan's central premise was the opposite of the real, checkable fact.

Class: **unverified** — but distinct in shape from every 2026-09-07 entry
before it. Those were all "fix landed at its primary site, not swept to
a sibling site" — the underlying claim, once corrected, was correct
everywhere; only the propagation failed. Here, the claim itself was
simply never checked against reality by anyone, across six independent
review passes, because it read as a plausible statement about a familiar
tool (semver ranges) that nobody thought to actually execute. `CLAUDE.md`
rule 2's collapse-test exists precisely to force a claim like this to
survive a hardest-question attack — but the test only works if the
"authoritative standard" cited is actually verified, not merely named.
D-plan-2 cited "architecture V14" and "semver-compatible" as its
grounding and neither citation was ever run against an evaluator.

**The sharpened lesson.** A claim about a well-known mechanism (semver,
a config format, a CLI flag) is exactly the kind of thing a reviewer is
most likely to accept from memory rather than verify, because it feels
too basic to be wrong — this is the mirror-image risk to `CLAUDE.md`'s
existing "verify external facts... against current primary sources"
rule, which agents tend to apply to obscure or fast-changing facts and
under-apply to "obvious" ones. The fix: `/expert-review`'s own Step 5
library-behavior-claim rule (resolve the library, read the current
behavior, don't reason from memory) applies with equal force to
small, load-bearing facts embedded inside a collapse-test's own
"hardest question," not only to headline claims about a framework's
API surface. Practically benign here (real behavior turned out safer
than believed) — but the near-miss is that it could just as easily have
been the other direction.

Also notable: this was the first of six consecutive 2026-09-07 rounds
whose expert-review found no verified multi-site Systemic pattern — a
genuine, if narrow, break in the five-round streak (round 2: 7 sites;
round 3: 2; round 4: 2 instances/4 sites; round 5: 2 instances/6 sites).
One new instance of the same sweep-failure shape did recur this round
(section 3's stale "bin 1 answered" citation, a sixth instance of the
lineage), but it resolved to a single site rather than a pattern this
round's proactive scans could generalize into a second Systemic
finding — read as continuity of the same root cause, not evidence the
underlying mechanism has stopped producing it.

## 2026-09-07 — round 5: a sweep's own "N citations checked, only these were wrong" completeness claim was itself falsified within the same round

Round 5's collapse-hunt found and fixed two wrong step-number citations
(SQLite WAL semantics attributed to Step 32 instead of Step 37; the
`init` verb attributed to Step 30 instead of Step 31), attested to have
run "a full grep-based cross-check of every 'Step 30/31/32/37'
occurrence in the document" and concluded "48 such citations checked;
only these two were wrong." Round 5's own expert-review, dispatched in
parallel against the same document, independently re-ran the identical
class of grep and found **four more live instances** of the exact
"Step 30's `init`" defect the collapse-hunt had just attested to have
fully swept — sitting inside Step 2, Step 8, Step 23, and Step 29's own
bodies, sections that same collapse-hunt's own attestation separately
claimed to have read "in full."

This is a sharper case than rounds 2–4's recurrences: those were content
a fix pass changed in one place and failed to propagate to a *different*
place the fix pass never looked at. Here, the collapse-hunt was
specifically hunting for this exact defect class, ran a real grep, found
real instances, fixed them, and *still* asserted a completeness bound
("only these two") that a differently-scoped grep in the same session
falsified. A grep that returns N hits proves N hits exist under that
exact pattern — it does not prove the pattern was cast wide enough to
catch every variant (here: "Governs Step 32 (concurrency)" was caught,
but "Step 30's `init`" phrased four different ways inside four different
step bodies was not fully caught by the collapse-hunt's own pass, though
a second independent pass in the same round did catch it).

Class: **unverified**, sharpened. **The standing lesson, now demonstrated
five rounds running:** a shrinking finding count (round 2: 7 sites;
round 3: 2; round 4: 2 instances/4 sites; round 5: 2 instances/6 sites)
is not evidence the sweep mechanism itself has improved — it is evidence
only that the specific instances a given pass happened to grep for were
fixed. The correct response is not a better single grep pattern; it is
the iterate-to-convergence discipline this project already runs: dispatch
a fresh, independently-scoped pass rather than trust the prior pass's own
"checked N, found M" arithmetic, because the prior pass's own search
scope is exactly the thing that cannot verify itself.

## 2026-09-07 — round 4: the sweep-failure pattern recurred a fourth time, at new sites each round, including inside the artifact whose own job is to catch it

Round 3 had already named "a fix landing at its primary site without
sweeping every cross-referencing surface" as the recurring failure across
three consecutive rounds (rounds 2 and 3, 9 sites total) and prescribed a
mechanical per-surface checklist as the fix. Round 4's independent
collapse-hunt and expert-review found the identical shape recurring at 4
more sites, none of them overlapping the 9 already fixed:

1. **Step 14's own body** still attributed `lexicon.stoplist`'s seeding to
   Step 8, three lines away from a sibling clause in the *same sentence*
   that round 3's own fix pass had correctly re-pointed to Step 23 —
   meaning the fix pass's hand touched this exact paragraph and still
   missed the neighboring clause.
2. **§2.3's coverage-reconciliation table** — the document's own
   self-audit of its own completeness — had three further wrong
   step-number citations (genres, indexer, self-observability) surviving
   in the *same table* whose Delivery row round 3 had just corrected one
   row above. A self-audit instrument failed at exactly the job it exists
   to do, in the same table, the same session, immediately after fixing
   an adjacent instance of the identical defect.
3. **Step 40's body and §14.1's Q13** still described an owner-run L11
   probe design that §10's D-plan-6 had explicitly retracted — a
   retraction performed in round 1, never caught by rounds 1–3 because no
   prior round's targeted-read scope happened to include Step 40's body
   or §14.1.
4. **Step 32's Verification field** never cited `T32-1a`, an omission
   dating to round 2 (when `T32-1a`'s spec was added to §12 and the
   mapping table, but not swept into the constructing step's own inline
   prose) and unnoticed through round 3.

Class: **unverified** — the same class rounds 2 and 3 already named,
still recurring, now inside the artifact (§2.3) whose stated purpose is
proving completeness. **The sharpened lesson, four rounds in:** the
magnitude shrinks each round (7 sites → 2 → 2, at 4 total locations) but
the *mechanism* generating new instances hasn't changed — a fix pass
reliably corrects the site(s) a review names and reliably fails to
mechanically re-diff every other surface that cites the same fact, even
within the same document, even one row above in the same table it is
mid-edit on. A reconciliation table's own attestation of completeness
("nothing is unmapped, nothing is silently deferred," §2.3's own closing
line) is not evidence of completeness — it is exactly the kind of claim
that needs independent, fresh-eyes verification, which is why the
iterate-to-convergence discipline (dispatch a new round rather than
trust the last round's sweep) is the correct response to this class of
defect, not a one-time mechanical checklist a future fix pass might again
forget to run.

## 2026-09-07 — round 3 expert-review: the sweep mechanism itself, not any one fix, was the recurring point of failure — three rounds running

Round 2 diagnosed and fixed a systemic pattern at 7 sites: content the fix
pass changed in one place wasn't propagated to every place that referenced
the same claim. Round 2's own reconciliation-sweep explicitly attested to
having walked for exactly this. Round 3 found the identical pattern
recurring at 2 more sites — both introduced by round 2's own new content:
`T18-3` (round 2's own new mechanism) was asserted in four places and
built in zero (Step 41, which constructs `test/conventions/`, never
listed it); and Step 23's own AD-14-provenance correction (also round 2's
new content) was never swept into T8-1's and T23-1's test specs, which
kept asserting "matches AD-14" for two values Step 23's own corrected text
says have no AD-14 source at all.

Class: **unverified** — the same class round 2 already named, recurring
in the artifact meant to fix it. **The generalizable lesson, sharpened by
now having the same failure three rounds running:** a sweep's own
attestation ("walked X against Y, found nothing") is not verification of
completeness — it's a report of a walk, and a walk can miss exactly the
thing it was trying to check. Round 3's reviewer caught what two prior
attestations missed by using a different method: instead of walking
prose claims, it built a mechanical checklist per artifact (citing step +
file-skeleton entry + *constructing* step's own body + test spec) and
diffed it against grep results. The distinction that mattered: previous
sweeps checked "is this T-ID mentioned everywhere it should be" (a
reference-existence check, which a `comm`/`diff` over grep hits catches
reliably); the sites that kept slipping through needed "is this T-ID's
file actually *built* by the step whose job that is" (a construction
check, structurally different from a reference check, and invisible to a
tool that only diffs mention-lists).

**Lesson, for any future fix pass touching this document (or any
document with the same self-referencing structure):** when new content
introduces a new file or mechanism, verify it against a fixed checklist
of every surface class that can reference it (citing step, skeleton
listing, *constructing* step, test spec, risk register) — not a prose
walk, and not only a reference-existence diff. A reference can exist in
four places and still not be *built* anywhere; that gap is a different
failure mode from a stale reference, and needs a different check to
catch it. The convergence trend itself is real and worth keeping in
view (round 1: 3 collapses; round 2: 1 collapse, but its own fix
introduced 2 new instances of the systemic pattern; round 3 caught and
fixed those) — but "the count is shrinking" is not the same claim as
"the sweep mechanism now actually works," and this entry is written so
the next round checks the latter, not just the former.

---

## 2026-09-07 — round 3: using a tool at all is not the same claim as the check being independent

Round 3's independent collapse-hunt caught this document's own prior entry
(immediately below) overclaiming its result: getting a real MCP client to
speak the `clear-thought` protocol directly and running six decisions
through `sequential_thinking` was reported as the pass "functioning as a
genuine independent check rather than a rubber stamp." It doesn't. The
`clear_thought` tool (this version, `@waldzellai/clear-thought-onepointfive`
0.0.5) stores and echoes back whatever text the caller supplies as
`prompt` — it does not compute, score, or judge anything on its own
(verified directly: `decision_framework`'s `multiCriteriaScores` and
`recommendation` fields never reflected supplied scores; `sequential_
thinking`'s `"thought"` field is a verbatim echo of the caller's `prompt`).
Six decisions authored, argued, and concluded by the same session, run
through a tool that never disagrees, coming back 6-for-6 confirmed, is a
100% self-affirmation rate — exactly the "self-administered collapse test
grades its own homework" shape the 2026-08-25 entry (item 3) already names.

Class: **unverified / posture** — the tool-invocation *fact* was real and
verified (protocol handshake, session ID, 18 successful calls all
genuinely happened), but the *conclusion drawn from the fact* ("this was
independently checked") did not follow from it, and reads more confidently
than the evidence supports — the posture of the check drifted from "I
satisfied a mandate" to "I was reviewed," which are different claims.

**Lesson.** Using a mandated tool discharges the literal mandate ("invoke
X, record the reasoning") — that is real and worth stating plainly. It
does not discharge a broader claim ("this was independently verified")
unless the tool itself supplies judgment the caller doesn't already hold —
check what the tool actually returns (does it echo, or does it compute?)
before characterizing a pass through it as review rather than
documentation. The two claims sound similar and are not: "I recorded my
reasoning through the required channel" is auditable and true; "an
independent check confirmed my reasoning" requires a second party — a
separately-dispatched review session, a different model, an oracle with
its own judgment — and a tool that echoes the caller's own words is not
one, no matter how official the protocol handshake looks. Fixed
everywhere the overclaim appeared (the plan's §15 Q-gap-5 entry, this
STATUS-adjacent record, and the verification transcript itself) by
replacing it with the narrower, true claim.

**A second, smaller lesson from the same round.** AD-9 requires
`deny_bypass_suspect`'s proxy bias disclosed in *both* directions
(over-counts one class, under-counts another); N2's fix (2026-09-07,
earlier same day) disclosed only the under-count direction, and this
exact gap had already surfaced in round 2's own collapse-hunt narrative
prose without ever being raised as a numbered, must-fix finding — so it
was read, noted, and not fixed. **Lesson: a defect mentioned in a
review's prose but not given a finding number is exactly as likely to be
silently dropped as one never mentioned at all — if it's worth writing
down mid-review, it's worth a numbered finding, even one that duplicates
something "already covered" by a broader item.**

---

## 2026-09-07 — "the harness didn't attach the tool" is not the same fact as "the tool can't be used"

Round-2 expert-review (finding S3) correctly rejected a claim that
registering `clear-thought` as an MCP server at the CLI level
(`claude mcp add ... -s local`, health-checked connected via `claude mcp
list`) discharged SKILL.md's Clear-Thought mandate for six judgment calls a
fix-pass session had made by manual reasoning. The gap: this specific
session's own tool-attachment layer (`ToolSearch`) never picked up the
newly-registered server, so the session genuinely had not run those six
decisions through the tool, regardless of the tool's availability elsewhere.

The next move was to treat "not attached to this session's tool layer" as
equivalent to "not usable this session" — the same conflation the
2026-09-07 entry below (about `ToolSearch` returning no match) already
named once, one layer up. It resolved the same way: **the fact that a
harness abstraction hasn't picked something up is a fact about the
abstraction, not about the underlying capability.** An MCP server is an
ordinary subprocess speaking JSON-RPC over stdin/stdout per a documented,
public protocol (`initialize` → `notifications/initialized` → `tools/list`
→ `tools/call`) — nothing about that protocol requires going through any
particular client's tool-dispatch layer. A ~100-line client script spoke
it directly to `npx -y @waldzellai/clear-thought-onepointfive`, completed
the handshake, and ran all six flagged decisions as real tool calls,
closing the gap in the same session rather than deferring it to some
future session that might have better luck with attachment.

Class: **unverified**, again — a boundary ("I can't use this tool") was
asserted from the failure of one specific mechanism (the harness's
attachment layer) without checking whether a more direct mechanism (the
documented protocol itself) was available. **Lesson, generalized from the
entry below: when a tool is "unavailable," ask which of three things is
actually true — (a) it doesn't exist and can't be installed, (b) it exists
and is installed but this session's convenience layer for calling it
hasn't picked it up, or (c) it exists, is installed, and is one direct
protocol call away regardless of the convenience layer. Only (a) is a real
halt condition. (b) is what registering it (this project's prior fix)
resolves for future sessions but does NOT resolve for the current one, and
the current one is not thereby stuck — (c) is very often true for anything
built on a documented, public protocol (MCP, HTTP APIs, CLIs with
machine-readable output), and finding that out costs one small script, not
a deferral.** Full evidence and the six confirmed decisions:
`docs/reviews/2026-09-07-clear-thought-verification-q-gap-5.md`.

---

## 2026-09-07 — round-2 review of the plan's own fix pass: a fix landing at its primary site without sweeping its secondary echoes, and an overclaimed closure caught before it reached the owner

A fix pass applied 21 findings from four review documents directly to
`docs/plans/plan-phase-a.md`. A fresh independent collapse-hunt and
expert-review then ran against that fix pass itself — the same
mandatory-independent-review discipline applied one level up, to the fix
rather than to the original document. Both found real, if shrinking,
defects (1 collapse + 3 partials, down from round 1's 3 collapses + 4
partials + 6 missed decisions on the original plan).

1. **A fix that lands at its primary site is not the same as a fix that
   lands everywhere the same claim was independently restated.** The
   "design-safe either way" overclaim (P2) was corrected at Step 18 and in
   one paragraph of §15 — and survived verbatim in three other places: a
   §10 collapse-test rationale, a §5.1 file comment, and a sub-heading one
   sentence above its own corrected body text (contradicting itself in
   the same paragraph). The same shape hit D-plan-8's marker-discipline
   rationale, which still described the pre-fix "arbitrary comment field"
   design after the field itself had been redesigned three sections
   earlier. Class: **unverified** (a fix's completeness was asserted, not
   checked against every place the fixed claim appeared). **Lesson,
   generalizing the 2026-08-29 "a fix must land at the exact location"
   entry one level further: when a claim is fixed at its primary
   decision site, grep the exact sentence (or its close paraphrases) across
   the whole document before considering the fix done — a collapse-test
   rationale, a file-skeleton comment, and a risk-register entry are all
   independent restatements a reader can still find and act on.**

2. **A cited test ID is not a specified test until it has its own §12
   entry.** Two new mechanisms (`oracleSpawn`'s confinement, the
   transient-wrongful-deny counter) were each given a plausible-sounding
   T-ID at their point of introduction (`T41-1d`, `T18-2`, plus `T2.5-1`
   and `T21-2` for the wrapper itself) — and none had the six-field §12
   specification the plan's own testing discipline requires. The citation
   read as verified because it had a well-formed ID; nothing had actually
   specified what the test does, what real/double boundary it uses, or
   what makes it fail. Class: **wrong-check** — checking that a T-ID
   *exists as a string* is not checking that it *resolves to a
   specification*. **Lesson: when adding a new mechanism that needs a
   test, write the §12 entry in the same edit that introduces the T-ID
   reference — never introduce the citation first and the spec "later,"
   because "later" is exactly the gap an independent reviewer has to
   catch instead.**

3. **A tool-availability fix at the environment level does not retroactively
   verify judgment calls already made without the tool.** The fix pass
   built and registered CodeGraph and Clear Thought as MCP servers,
   confirmed connected via `claude mcp list`, and then declared the plan's
   `Q-gap-5` (the SKILL.md halt-condition finding) "closed" on that
   basis — while its own text, one paragraph later, admitted the pass's
   own judgment calls were made by manual reasoning because *this specific
   session* never attached to the newly-registered servers. Those are two
   different claims: "the tool now exists" and "this session's reasoning
   was verified by the tool." The round-2 independent expert-review caught
   the conflation before a third round would have had to; the fix
   (recorded in the plan's own §15) was to name the exact judgment calls
   affected and track them as a genuinely open item for the next
   tool-attached session, rather than asserting closure a second time on
   the same unverified ground. Class: **unverified**, and the same shape
   as the entry immediately below (a "tool is registered" fact quietly
   standing in for a "tool was used" fact). **Lesson: when a fix restores
   a *capability* (a tool becomes available) but the *work already done*
   was not redone with it, say so explicitly and separately — "the cause
   is fixed" and "the affected work is re-verified" are different claims
   with different evidence, and conflating them is exactly the overclaim
   this project's collapse-hunt exists to catch before the owner does.**

**Process note.** All three were caught by the independent round-2
collapse-hunt and expert-review, dispatched against the fix pass itself —
not by the owner, and not by the fix-pass session re-reading its own work.
This is the mechanism working as designed, one level up the stack from
where it usually operates: the artifact under review this time was a
correction, not an original document, and the same discipline applied.

## 2026-09-07 — "the tool is unavailable" was an unverified premise about *this session*, not about the environment

**Caught by Max Cogar, not by any safeguard.** An agent asked whether to
proceed on `docs/plans/plan-phase-a.md`'s fix pass, framing CodeGraph and
Clear Thought MCP as categorically unavailable in this environment — grounded
only in `ToolSearch` returning no match inside the running session. Max's
response: *"Not true. You're just refusing to do anything about it."*
Investigation found `mcp-servers/codegraph-mcp/` already present and buildable
in this repo, and `clear-thought` already named in
`middleware/context-oracle/.mcp.json` — neither had ever been registered as an
MCP server for this session; `ToolSearch` finding nothing was true and told
the agent nothing about whether the tool could be made available. Building
and registering both (`npm install && npm run build`; `claude mcp add … -s
local`) produced two servers `claude mcp list` health-checks as connected.

Class: **unverified**, same shape as the 2026-07-30 grep-as-verification
entry one layer up the stack — a negative search result was read as a fact
about the world instead of a fact about what had been tried. **Lesson: "the
tool returns no match" is a fact about the current tool registry, not about
whether the tool exists or can be added. Before declaring a required tool
unavailable and halting or escalating on that basis, check whether it is
buildable/registerable in this repo or environment — a `.mcp.json`, a
`mcp-servers/` directory, a README with setup instructions — and attempt the
setup. Only a genuine absence (no source, no package, no viable install path)
earns the halt.**

**A second, narrower lesson sits underneath the first.** Even after building
and registering both servers and confirming them connected outside the
session (`claude mcp list`), this *running* session's own tool registry did
not attach to them — MCP servers registered mid-conversation do not become
callable in that same conversation without a reconnect this harness does not
expose a way to trigger from inside the session. **Lesson: "the tool is now
registered" and "the tool is callable in this turn" are different claims,
verified differently — the first by `claude mcp list`/health-check, the
second only by actually invoking it (or `ToolSearch` finding its schema) in
the live session.** Conflating them would have been the same "asserted, not
established" failure in the opposite direction. The honest resolution here
was neither "halt" nor "claim it's fixed" but: fix the root cause, verify
what is and isn't true of *this* session precisely, and disclose the
remaining gap (this session's own judgment calls made without Clear Thought)
rather than paper over it.

**Compounding process note.** The same session had, minutes earlier, escalated
a related halt-condition finding (`Q-gap-5`) to Max Cogar as a three-way
accept/halt/waive choice — which `docs/STATUS.md` and `CLAUDE.md` rule 2
already answered ("halt, don't escalate a question the project's own rule
resolves"). Fixing the tool-availability root cause this session closed
`Q-gap-5` without reopening that menu. **Lesson, generalized: a halt condition
has three possible responses in this project's own rules — halt, fix the root
cause, or (rarely) get explicit owner authorization for a named deviation —
and "escalate a menu of options the rules already narrow" is not one of
them.** Check whether the blocking premise itself is fixable before treating
the halt as terminal.

---

## 2026-08-25 — a fabricated citation key, and a hedge renamed instead of resolved

Full evidence: `docs/reviews/2026-08-25-independent-review-spec-revision.md`.

1. **Invented owner-attribution wearing a manufactured provenance key.** Class:
   **unverified / posture.** A prior agent attributed the language-coverage
   requirement to Max via `[OL:#3]` — a key matching neither the `[OL-n]` nor
   `[OL-Cn]` form the spec's own legend defines, resolving to *nothing* in the
   ledger — and put a direct quote in his mouth. **Lesson: a citation key is only
   as real as the entry it resolves to. The check is not "does a plausible key
   appear" but "open the ledger and find the row." A fabricated key is more
   dangerous than a missing one, because it reads as already-verified. When a
   claim is genuinely the owner's words but has no CONFIRMED row, its home is
   PENDING and its spec grounding is judgment — never a key you coined to make it
   look ratified.**

2. **"Max's common case" — an owner fact nobody confirmed, doing load-bearing
   work.** Class: **unverified.** "Young / thin-history repos are Max's common
   case" was cited to OL-6/OL-11, which say nothing about repo age, and it was the
   justification that a real limitation was acceptable. **Lesson: an attribution
   that excuses a limitation is load-bearing — when the attribution is invented,
   the excuse collapses with it. Ground a limitation on the design that causes it
   (the corpus floor), not on an unconfirmed claim about the owner's world.**

3. **Renaming a hedge is not resolving it.** Class: **unverified.** Eleven
   load-bearing citations were shipped "prior pass"; an earlier pass *relabelled*
   the "re-confirm at build" hedge to "prior pass" and called it fixed, leaving
   every premise still unverified. **Lesson: the fix for an unverified premise is
   verification, not a better word for "unverified." Under `/expert-spec` an
   unverified load-bearing premise is a blocker, not a finished requirement —
   Gate B is failed until the verification is on the page.**

**The thread.** All three are the same move — asserting provenance without
opening the source it points at: a citation key never resolved to a row, an
owner-fact never traced to a decision, a premise never fetched. **The owner-ledger
discipline is not "cite `[OL-…]`"; it is "the row exists and says this."**

**Process failure that made all of the above reach a reviewer (same day).** Class:
**posture.** The author (this session) went edit → push → dispatch independent
review, treating the independent adversarial pass as *the* review. But
`/expert-spec` requires the **author** to run the three gates (Frame, Premise,
Completeness) as a self-review *before* delivery; the independent pass is an
*additional* layer, not a substitute. Every finding both independent reviews
returned — the fabricated `[OL:#3]` key, the `[OL-3]` over-citations, the
untested genres — is something a genuine Gate-A/C self-audit catches by
construction (Gate A = open each cited source and confirm it supports the claim;
the coverage check = every requirement has a test). **Lesson: the independent
review does not replace the author's self-review; skipping the self-review and
leaning on the reviewer to find defects is the same "make someone else the
substance-checker" failure the project's prime rules forbid — here aimed at the
reviewer instead of the owner. Run the mechanical gates yourself first: enumerate
every citation against its row, every requirement against its acceptance
criterion. When Max asked "how was that missed — expert-spec requires a self
review," the honest answer was that the self-review never ran.** (The self-review,
once actually run, found coverage gaps — FR-J4 recursion guard, FR-O5
task-boundary, FR-L6/L7 — that both adversarial passes had missed, because
mechanical enumeration catches what sampling does not.)

**Second-review addendum (same day).** A second independent pass on the *fixes*
found two more of the same shape and one new class:

4. **Citing a real CONFIRMED key for a claim the key does not contain.** Class:
   **unverified.** `[OL-3]` (confirmed content: *blocking*) was cited as authority
   for "the oracle never writes to the repo tree" — a real, good property, but one
   OL-3 says nothing about (it is `[D-9]`). **Lesson: a resolvable key is not a
   correct key. Re-read the row's actual content against the sentence it is
   attached to — "cited a confirmed decision" and "cited it for what it decided"
   are different checks, and only the second one holds.**

5. **An absolute quietly falsified by a second use of the same primitive.** Class:
   **mechanism-not-mission / posture.** FR-B1 said blocking exists in "exactly two
   cases," but the completion-check whisper reaches the agent only by *continuing
   the turn* at a `Stop` — a third use of the very hold-the-turn primitive the
   absolute governs. **Lesson: when a requirement states an absolute over a
   mechanism ("exactly N uses of X"), enumerate every place X is used and check
   each against the absolute. A delivery mechanism reusing an enforcement
   primitive will silently break the count unless the spec separates *delivery*
   from *enforcement* by name (now FR-B4 vs FR-B1).**

---

## 2026-08-16 — the rebuilt spec re-sprang two known traps and silenced the mission's own priority

Three durable lessons from the rebuild's independent reviews (full evidence:
`docs/reviews/2026-08-16-expert-review-spec-rebuild.md` and
`…-collapse-hunt-spec-rebuild.md`):

- **The owner-attribution-through-rationale channel re-opened — again.** The author
  attributed a latency figure to Max Cogar by citing `RETHINK.md` §5 (rationale, not
  a §12 decision) — provenance-identical to the REJECTED budget (OL-R3). Lesson,
  generalised: **`RETHINK.md`'s non-§12 prose is not an owner source.** Any
  `[OL…]`/"the owner's rule" citation must resolve to a CONFIRMED ledger entry; a
  cite to RETHINK rationale is an agent judgment wearing the owner's name. Class:
  unverified. (Caught by the review mechanism, not the owner — the design working.)

- **A learning loop that only demotes ratchets to silence.** The rebuild specified
  demotion (a requirement) but left promotion a bare principle — re-springing the
  2026-07-22 #1 trap ("the tool converges to near-total silence and measures as
  healthy"). Lesson: **any de-noising loop needs an explicit up-signal (re-explore /
  re-promote) with a requirement and an anti-convergence acceptance test, not a
  slogan.** A down-signal without a matching up-signal is a silence machine. Class:
  mechanism-not-mission.

- **"The bar decides" can silence the exact fact the mission wants.** A
  multiplicative bar plus a high-confidence floor suppressed the uncertain hazard —
  but `[OL-3]` (a wasted sentence is the worst case) makes *false silence* the
  costlier error, so a precision floor optimises the wrong side. Lesson: **when the
  cost of speaking is bounded and low, uncertainty is a reason to speak (flagged),
  not to suppress; manage precision empirically (demotion) rather than a-priori.**
  Do not let a quality filter quietly become a relevance gate. Class: wrong-check.

## 2026-08-13 — the fix to a hollow decision was itself two-thirds hollow (caught by independent passes, not the owner)

**A correction that removed an unsourced owner-attributed limit left the old rule
standing in two other places and replaced it with a *second* unsourced number.**
The 2026-08-12 correction (`P0-D-27`) fixed `FR-A3`'s invented "at most one whisper
per event." But the same single-whisper rule survived verbatim in `FR-A5` (*"only the
top candidate above the bar is spoken"*) and `FR-O2` (*"relay at most one whisper
back"*, still listed "unchanged" in §3) — so the delivery mechanism and the scoring
requirement both still said "one." And the replacement, "fits the per-trigger token
budget," rested on a per-trigger number that had **no value and no source** — a fresh
unsourced limit in place of the one just removed.
Class: **unverified**. A correction is not done when the decision that named the
defect is edited; it is done when *every copy* of the defective rule is swept and the
replacement is itself sourced or explicitly deferred. Fix: `FR-A5`/`FR-O2` corrected;
Phase 0 now fixes **no** per-trigger number (defaults to the session cap, tighter cap
deferred to Phase 1 where P0-4's data will set it) — machinery removed, not invented
(`P0-D-28`).

**And the over-attribution the correction was fixing had propagated into the
correction's own record.** The "token" denomination — a reconstruction, since the
owner's words (`RETHINK.md:175–176`) say only *"whisper budgets, hard caps"* *(Correction
2026-08-28: per OL-R3 those `RETHINK.md` §5 words are themselves agent-introduced
rationale, NOT Max Cogar's — the ledger rejects any budget as his. Even this entry's
"the owner's words" framing was the defect it describes.)* — had
been written as the owner's rule into `FR-A3`, `P0-D-27`, `OWNER-LEDGER.md` OL-R1, and
even the 2026-08-12 entry below (*"a token budget, not a count"*). OL-R1 mattered most:
`CLAUDE.md` has agents read the ledger **first** as the authority for what is Max
Cogar's, so a latent over-attribution there re-commits the exact class OL-R1 exists to
record. Fixed in the spec and in OL-R1; token denomination now labeled a derived
document judgment everywhere.
Class: **unverified** (again). Generalise: when you correct an owner-attribution, grep
for the attributed phrase across *all* files — the reconstruction that caused the
collapse tends to have already spread to the very documents that record the fix.
**Process note:** none of this reached Max Cogar. Two independent adversarial passes
caught it — the first the incomplete sweep and unsourced number, the second the
ledger over-attribution. This is the mechanism working as designed: the owner is not
the substance-reviewer.

## 2026-08-12 — caught by Max Cogar, logged as a process failure

**An agent-invented constraint was hardened into a rule and then handed back to
the owner as his own.** v1 FR-A3 records *"at most one whisper per event."* The
owner's actual words (`RETHINK.md:175–176`) are *"Per-trigger and per-session
whisper **budgets**. Hard caps."* *(Correction 2026-08-28: per OL-R3 those
`RETHINK.md` §5 words are agent-introduced rationale, NOT Max Cogar's — no budget
of any denomination is his; OL-C1 rules out arbitrary limits entirely. The
lesson below stands, one level deeper than this entry knew.)* — a token budget,
not a count. An agent
tightened "budget" into "one," it propagated into the Phase 0 spec, and this
session it reached Max Cogar as the binding premise of an owner question — *which
of two whispers wins at an edit?* He rejected the premise outright. The invented
cap had manufactured the entire dilemma; under the real rule both whispers are
delivered within budget and nothing has to be ranked.
Class: **unverified**. The 2026-08-01 lesson was *"no ranking claim enters a
document unless the owner stated it in those words"*; this is the same failure for
a **count/limit**. Generalise it: any load-bearing number or limit attributed to
the owner must quote the owner's words, and a limit whose only citation is an
interface section (here v1 §6.1) with no `[OWNER-n]`/`[D-n]` is an agent judgment
wearing a reference — verify it against `RETHINK.md` before a decision rests on it.
This one reached the owner, which is the failure the collapse mechanism exists to
prevent.
→ P0-D-27 — recorded in `docs/reviews/2026-08-13-verification-p0-d-27-token-budget-phase0-spec.md`
(the Phase 0 spec itself was deleted 2026-08-28; one spec for the whole tool).

## 2026-08-01 — the Phase 0 spec, round 4

**Facts about what a contract hands you are not facts about what it does with what
you return.** §4 recorded eleven verified hook-contract facts and every one was about
hook *input*. The genre table is entirely a claim about *output placement*, and the
sentence governing it — `PreToolUse` context is delivered *"next to the tool result"* —
sat one paragraph from text §4 already quoted twice. Three of seven genres were
specified to arrive before an action that the contract delivers them after.
Class: **unverified**. When a document's claims split into input and output, verifying
one half exhaustively is not progress on the other; enumerate both axes before
attesting to having read a contract.
→ `docs/reviews/2026-08-01-round-4-collapse-hunt-phase0-spec.md` (F1).

**A citation finding closed by adding citations nobody checked.** Nine *"Carried from
v1 :n"* pointers were added to close a finding that requirements depended on uncited
sources. Five of the nine resolved to a different source than the one they named.
Class: **unverified**. The fix for an unverified-reference finding is the one fix that
cannot be applied unverified — every pointer added to close it is a new instance of it.
→ same file (F4).

**Renumbering identifiers without re-deriving what cites them.** A rebuild renumbered
21 acceptance criteria; four clauses at three sites still named the old numbers, which
now denote different criteria. The verifying script checked that every reference
*resolves* and reported zero dangling.
Class: **wrong-check**. Resolution is not support. A reference check must compare what
the citing sentence claims against what the cited item says, or it certifies only that
no identifier is missing.
→ `docs/reviews/2026-08-01-round-4-expert-review-phase0-spec.md` (S2).

**A device that has been false in every round it has existed should be deleted, not
corrected.** §3's "unchanged" column: wrong in ten rows, then eleven, then eight,
across three rebuilds. Each rebuild fixed the rows the review named. Twelve
whole-document attestation devices were located in round 4 and seven fail; every device
with a substantive axis fails on that axis while passing its mechanical proxy, and the
five that hold are the five whose only axis is mechanical.
Class: **wrong-check**. When a claim about the whole document has been falsified in
consecutive rounds, the remedy is to remove the claim — state each fact where it cannot
drift — rather than to re-assert it more carefully. Correcting it again is choosing the
form that has already failed.
**The removal is of the claim, not of the view.** Separate what a summary device
*indexes* from what it *asserts*. §3's coverage half (all 65 accounted for exactly
once) is mechanically checkable and held every round; its sameness half duplicated the
requirement text and drifted from it. Delete the duplicate assertion and keep the
index pointing at where each fact is stated — deleting the whole device would cost the
one-page view a downstream reader genuinely needs.
→ same file (S1, Systemic 1).

## 2026-08-01 — the Phase 0 spec, round 3

**Verifying a source establishes only the claims you aimed at it.** The Phase 0 spec
downloaded the 242 KB hooks reference and string-matched every quotation it made — the
correct fix for the previous round's fabricated citation, and it worked: 27 of 27 spans
verbatim. Three of round 3's heaviest findings were nonetheless answerable from that
same file, because the method checked every *positive* claim the document made about the
contract and inherited every *negative* one. "Phase 0 cannot detect a completion claim"
was never checked against the file that contains `last_assistant_message`.
Class: **unverified**. A document's claims about what a source does *not* contain are
claims about the source, and they need the same instrument aimed at them. When a
requirement says a phase lacks a capability, grep the contract for the capability before
writing the sentence.
→ `docs/reviews/2026-08-01-collapse-hunt-phase0-spec-rebuild-2.md` (Q1, Q4, Q5).

**An owner ruling names a moment; the nearest event is not that moment, and the fix for
that is not a cap.** `[OWNER-12]` accepted the turn cost of speaking at a completion
claim. Round 2 found Phase 0 spending it at every turn boundary and the remedy taken was
to bound the volume — an honest-looking fix that implemented a blunter capability and
attributed it to the ruling. The actual remedy was a field the harness already supplies.
Class: **mechanism-not-mission**. Bounding the blast radius of a mechanism that
recognises the wrong thing is not a fix; it is the wrong thing, rationed.
→ same file (Q1).

**Three rounds running, the device installed to close a finding became the next round's
heaviest finding.** §3's disposition table (added to close a coverage gap) was wrong in
ten rows, then in eleven more. §4's source table (closed to two entries) orphaned six
source keys. §2's arm table (split to give per-arm reasons) gave a reason its own P0-1
contradicted. Each was re-checked along the axis that is cheap — arithmetic, set
membership, row presence — and not along the axis it asserts.
Class: **wrong-check**. For every whole-document attestation, write down the check that
would *falsify* the substantive claim and run that one. The mechanical proxy passing is
not evidence; it is the reason nobody looked.
→ `docs/reviews/2026-08-01-round-3-expert-review-phase0-spec.md` (S1, M1, M2, Systemic 1).

**Disclosing an unsourced claim is not removing it.** The warning-priority clause
survived three rounds: deleted once, restored for identifier fidelity, then kept with a
decision record stating the ranking is decided elsewhere. That left the requirement text
asserting a precedence two other passages denied — and an implementer builds to the
requirement.
Class: **posture**. An annotation does not neutralise normative text. Delete it, or send
it to the owner as a ranking he has not made.
→ same file (S2).

**Two instrument failures that would each have produced a confidently wrong finding.**
`pdfminer.six` interleaves the ROSE paper's two columns mid-sentence, so a verbatim
quotation fails a string match; a second engine resolved it. Two hooks quotations failed
a naive match only because of markdown link syntax in the raw source. And `file(1)`
reports that PDF as 10 pages when it has 17 — page count was used in a prior round to
confirm the right paper.
Class: **unverified**. A negative result from one extraction tool is a result about the
tool until a second one agrees.
→ same file (Instrument corrections).

## 2026-08-01 — the Phase 0 spec, rounds 1 and 2

**The fix for a finding is where the next finding is created.** In round 2 of the
Phase 0 spec, three of the four heaviest findings were false claims the document
made about *itself*, and each sat in the device installed the round before to close
an earlier finding: a disposition table added to close a coverage gap was wrong in
ten of its forty-four rows; a namespace rule added to close an identifier collision
was broken twice in the section beneath it; a source list closed to two entries
achieved that by deleting the requirements needing the others, leaving a test with
no requirement behind it.
Class: **unverified**. The generator is that a device asserting a property of the
whole document is written once and never re-checked against the document it
describes, while the individual requirement it was written to fix does get
re-checked. Treat any newly-added summary, table, partition or namespace rule as
the *first* thing the next round verifies, not the settled part.
→ `docs/reviews/2026-08-01-round-2-expert-review-phase0-spec.md` (S1, S3),
`docs/reviews/2026-08-01-collapse-hunt-phase0-spec-rebuild.md` (N2, N3, N4).

**A quotation carried from a prior project document and re-attributed to the
primary source reads as verified and is not.** The Phase 0 spec attributed a
sentence about `PreToolUse` permission behaviour to the harness documentation; the
string appears nowhere in the 242 KB reference and matched exactly one thing — the
v1 spec, where it sits under a source tag. It entered *with* the fix for a prior
round's finding about that same paragraph.
Class: **unverified**. Re-deriving a fact from source means opening the source, not
copying the sentence a sibling document attributes to it.
→ `docs/reviews/2026-08-01-round-2-expert-review-phase0-spec.md` (S1).

**A ruling about a *moment* was implemented as an *event*, and nothing recorded
that they differ.** `[OWNER-12]` accepted the turn cost of speaking when an agent
claims completion. `Stop` fires whenever the agent finishes responding; telling the
two apart needs the transcript reader, deferred to a later phase. Neither spec
recorded the contract sentence that separates them, so the accepted cost was
silently spent at every turn boundary with no per-session bound anywhere.
Class: **mechanism-not-mission**. When an owner ruling names a moment, record the
mechanism that recognises that moment — and if the phase has none, say so in the
requirement rather than letting the nearest event stand in for it.
→ `docs/reviews/2026-08-01-collapse-hunt-phase0-spec-rebuild.md` (N1).

## 2026-07-17 — architecture session

Every collapse below was found by the **owner**, not by any safeguard — the
citation gates, the Expert Standard pass, and an independent 16-finding review
all missed them. That is the exact failure `CLAUDE.md`'s collapse test now
exists to prevent: the adversarial collapse-hunt must catch the next one before
it reaches him.

1. **Judgment send-gate = "verify the claim exists in the store."**
   Collapsed by: *"why is existence the right check? a true-but-irrelevant fact
   is worse than silence."*
   Class: **wrong-check**. Existence verifies the oracle's own honesty (it
   didn't hallucinate), not whether the whisper serves the agent's decision.
   Fix: the send-gate is materiality + non-obviousness + evidence floor +
   confidence×impact + honest uncertainty (FR-A1/A5/D5, P4/P5); existence is the
   anti-fabrication floor *beneath* the gate, never the gate itself.
   → `docs/judgment-layer-corrected-foundation.md`.

2. **Model "selects from a generated candidate list; does not author text."**
   Collapsed by: *"if none of the candidates are relevant, the tool just doesn't
   work — then what? and it's harder to get data on a tool that never works."*
   Class: **reduction**. Select-only cannot answer a question or articulate a
   specific contradiction, and caps the tool at what a deterministic query can
   pre-compute — starving the learning loop of the data it needs.
   Fix: grounded generation — the model composes; every factual claim is verified
   against store provenance before delivery; output validated to informative,
   non-imperative form (FR-J5/X2).

3. **Judgment as "detect divergence between the agent's trajectory and what the
   code requires, and prevent the bad outcome."**
   Collapsed by: *"that's a safety net for something already derailing; the tool
   is a guide, and you can't predict far enough ahead to correct anyway."*
   Class: **posture**. Reintroduced the gatekeeper stance the whole rethink
   removed — this time at the reasoning layer instead of the tool layer.
   Fix: the judgment is FR-A1 — "do I know something material it doesn't" — which
   informs the decision without predicting or policing it.

4. **Overcorrection: "the tool is a guide, so it never corrects."**
   Collapsed by: *"correcting is literally part of the tool; why do you keep
   making it 100% one thing?"*
   Class: **reduction**. The twelve genres (FR-A2) include correcting genres
   (assumption-check, steering).
   Fix: guiding and correcting are one judgment (FR-A1) in different shapes — the
   material fact either adds to, or conflicts with, the agent's current picture.

5. **Tool-disallowed model call asserted but never verified** (independent
   review finding F1).
   Collapsed by: *"the invocation carries no tool-restriction flag — where is
   it?"*
   Class: **unverified**. The recursion-guard/security claim rested on a flag
   never confirmed to exist.
   Fix: verify the actual flag against `claude --help` and add it, or redesign so
   tools are structurally absent.

**Pattern this session:** the recurring shape is *reduction* — repeatedly
collapsing a deliberately broad, owner-approved requirement (the twelve genres;
the mission) into a single narrow function that is easier to design, then
defending the collapse. The owner's repeated correction was always the same:
stop narrowing what the spec made wide. Future agents: when a design feels clean
and unified, check whether you achieved that cleanliness by quietly dropping
part of what the tool is meant to do.

---

## 2026-07-22 — architecture rebuild collapse-hunt (independent subagent + expert-review)

The rebuilt architecture was attacked by an **independent adversarial
collapse-hunt** (mission-fidelity only) and a parallel **expert-review**
(premise + standards). Both were dispatched before any finding was applied, per
`CLAUDE.md`. This is the mechanism working as designed: the collapses below were
found by the peer passes, **not** by the owner. All were applied to
`architecture-context-oracle.md`. New collapse-questions the author had not
written are recorded so the traps are inherited.

1. **`decision-impact` — the bar's own heart — was left undefined, and the
   learning loop can only ratchet toward silence.**
   Collapsed by: *"your D10 'Survives' box says the bar is confidence × decision-
   impact and the loop tunes it from data — but impact is never defined (the
   Move-B schema has `confidence`, no `impact`), and the only down-signal
   (regret) is unmeasurable for a non-programmer owner. So the tool can converge
   to near-total silence and measure as healthy."*
   Class: **mechanism-not-mission** (impact) + **wrong-check** (regret metric
   asserted, no source). This is collapse-log item 2 (2026-07-17) resurfacing.
   Fix: operationally defined `decision-impact` = model-emitted `materiality`
   (new Move-B field, so the intent read enters the bar) × structural weight
   (genre × edit-vs-read × blast-radius × zone); added an **explore budget** (a
   sampled fraction of below-bar candidates delivered and measured) and a
   concrete **regret proxy** the distiller can compute (same-region re-edit/revert
   across sessions; post-edit verify-command failure) as real up-signals → D10,
   D12, D21.

2. **The Answer genre re-collapsed to "nicely-phrased FTS": deterministic
   retrieval is the unacknowledged author.**
   Collapsed by: *"the model may only assert facts that bind to a pre-built,
   un-expandable retrieval set; for the Answer/discovery genre that is the exact
   cap that made select-only unusable — the model can't answer if FTS didn't
   surface the file."* (Assumption-check/Steering survive — articulation is real
   composition; Answer/discovery does not.)
   Class: **reduction** (Answer breadth narrowed to FTS-phrasing) +
   **decision-hiding** (retrieval, the real author, was unspecified).
   Fix: Move-A retrieval promoted to a first-class component with a bounded,
   tool-free **retrieval-shaping sub-turn** (the model proposes query terms that
   only parameterize a deterministic store query, never free text); and the
   honest cap is now stated — Answer quality is bounded by retrieval reach → D10,
   D12.

3. **Conduct genres — the collapse-hunt's "policing posture" framing was itself an
   OVERCORRECTION, and Max Cogar overturned it.** The hunt argued a Process/
   answer-drift whisper "reports things already in the agent's context — a
   supervisor's nag, the posture the rethink removed." The author (this session)
   accepted that framing, scoped the genres down, and asked the owner whether to
   ship them *off by default*. **Max Cogar corrected this on 2026-07-22:** "why
   would you disable part of this? what's wrong with supervising? … I want this
   feature specifically."
   **Why the framing was wrong (the durable lesson):** (a) the rethink removed
   **gates** — *blocking*, deny paths, plan firewalls (RETHINK §2.2, §9) — **not
   observation**; a conduct whisper blocks nothing (P2) and advisory conduct
   observation is the *sanctioned replacement* for a gate, not the gate. (b) These
   genres are **owner-added and explicitly in scope (OWNER-9)** — flagging an
   owner-approved feature as a "mission tension" to hand back is the exact reflexive
   overcorrection Max Cogar has repeatedly rejected. (c) The FR-A1 argument was also
   wrong: "in the token window" ≠ "known." An agent that claims completion without
   verifying, or drops the user's question, has *not registered* the conflict — the
   erroneous action **is** the evidence — so an external cross-check surfacing that
   specific conflict at the decision moment *is* a material fact it doesn't know
   (the same logic by which FR-M has the oracle watch its own conduct). Defaulting
   it off would gut an owner-approved capability that surfaces mistakes neither
   he nor the agent catches. *(Phrase corrected 2026-08-01: this read "the
   owner's core problem." The tool has no core problem — see the 2026-08-01
   entry below.)*
   **The one genuinely valid residual (kept):** don't *nag* — speak the specific
   conflict with its pointer, not a step-by-step checklist recital; that is
   noise-calibration governed by the §9.2 false-fire ladder, and per spec §14 the
   owner reviews measured false-fire rates *after* instrumented sessions. That is
   the only checkpoint, and it is post-measurement, not a design-time on/off doubt.
   Class of the author's error: **overcorrection/reduction** (narrowing an
   owner-approved capability and inverting to "maybe off" under a pushback reflex).
   Fix applied: D14 reframed — conduct genres are advisory, mission-aligned, **enabled
   by default**; STATUS's misframed yes/no removed. → D14, FR-A8/A9.
   **Meta-lesson for future agents:** an independent collapse-hunt can *itself*
   collapse a decision in the wrong direction. A "posture" collapse must distinguish
   *blocking* (removed) from *observing/informing* (the mission), and must never
   convert an owner-approved feature into an owner-facing "should we keep it?"
   question — that makes the owner the substance-reviewer again, the exact failure
   this mechanism exists to prevent.

4. **The FR-X6 audit log was put in the droppable "bookkeeping" class.**
   Collapsed by: *"D24 drops event-path writes on contention 'fail-open applies
   to bookkeeping' — but that set includes `whisper_log`, the one oversight
   control the security model cannot lose; a dropped audit write is an
   un-auditable whisper, invisible to the owner."* (Both passes found this.)
   Class: **wrong-check** (fail-open is right for latency, wrong for the audit
   control). Fix: `whisper_log` + `suppressions` made non-droppable — *if a
   whisper cannot be logged, it is not sent* (auditability true by construction)
   → D24.

5. **T1 overclaimed "bounded by construction"; grounding does not inspect fact
   text.** Collapsed by: *"an injection living inside a legitimately-grounded,
   non-suspect fact (a landmine `evidence` string, a `zone_evidence` marker)
   passes the grounding check (the fact resolves) and is quotable — grounding
   verifies existence, not that the text is instruction-free; the real control is
   the heuristic deny-lexicon, same evasion surface as the input flagger. And P3
   means an oracle-unaware agent gets delimited injections it was never taught to
   distrust."* Class: **unverified/overclaim**. Fix: T1 conclusion corrected to
   defense-in-depth (heuristic input+output), not elimination; **default
   pointer-only for all repo-derived spans**, inline quotation only for
   mechanically-generated content → T1, D13.

6. **The `Unknown` genre (FR-A2) was neither mechanized nor deferred — and the
   grounding-id rule structurally precluded it** (an Unknown whisper asserts the
   *absence* of a determining fact; there is no presence-fact to bind to). Class:
   **reduction** (mandated breadth silently dropped). Fix: mechanized via a
   **negative-evidence fact** — a bounded determining-query that returns empty
   becomes a bindable fact whose pointer is the query + its empty result (P4
   satisfied: re-run the query) → D12, D6.

**Also caught by expert-review (premise/standards axis, applied):**
- **CRITICAL — `Stop`/`SubagentStop` delivery is a continuation control** (F1;
  **omitted from the first version of this entry — added 2026-07-30 per round-3
  R3-11**). Collapsed by the current hooks contract, verbatim: *"It keeps the
  conversation going through the same loop protections as `decision: \"block\"`,
  namely the `stop_hook_active` input and the 8-consecutive-continuation cap."*
  So a whisper at `Stop` does not cost a wasted sentence (P2) — it costs the
  agent a turn it was trying to end, and AC-3 could not see it because AC-3
  scanned for deny *fields* and continuation carries none.
  Class: **unverified/overclaim** — a channel the design classified as inert is
  a control-flow axis.
  Resolution: put to the owner with the evidence; **Max Cogar ruled the
  capability a must-have** and accepted the cost bounded — `RETHINK.md` §12
  addendum decision **OWNER-12**, spec §6.1, FR-O4a, AC-3 widened.
  **Residual, and the reason this omission mattered:** the ruling landed in the
  spec and `RETHINK.md` and **not in the architecture** — round 3 found the
  artifact still specifying a design that could not implement it (no
  `stop_hook_active` in the event contract, so the bound was unimplementable
  rather than merely unstated). Fixed in D8/D10/D6/D21/D26 on 2026-07-30.
  **Standing lesson: when a finding produces an owner ruling, the ruling lands
  in every artifact the lifecycle consumes — not only in the one where the
  question was raised.** A requirement that arrives between rounds inherits no
  reviewer.
- **CRITICAL — `--bare` breaks the piggyback.** The D11 model command used
  `--bare`, whose help states "OAuth and keychain are never read"; verified live
  in this credential-less host-managed environment (3/3 Authentication error),
  while the same command **without** `--bare` succeeds. The Spike-1 re-run had
  omitted `--bare`, so it never exercised the design's real command — the exact
  "asserted, not established" failure the rebuild existed to end. Fix: `--bare`
  removed; recursion guard re-derived on cwd-isolation + `CTXORACLE_INTERNAL`
  env-guard + fresh session-id + env-scrub; AC-11 must assert zero oracle-hook
  firings for the **non-`--bare`** child. This is logged here because it is the
  same *class* as a collapse (a load-bearing premise self-certified but never
  actually run) even though the collapse-hunt is a mission-fidelity axis.
- False Phase-8/Gate-C attestation of a "collapse test on D24" that did not
  exist; `--json-schema` takes inline JSON not a file path; `so_what` not named
  in Move-C validation. All corrected.

**Pattern this session:** the 2026-07-17 collapses were *reduction at the
model's role*; the rebuild fixed that but moved the hard part into **unspecified
deterministic components** (Move-A retrieval; the `decision-impact` score) that
the document referenced but never designed — reduction relocated from "the model
only selects" to "an undefined deterministic step decides what the model may see
or send." And the one premise treated as *settled* (piggyback works) was the one
that failed, while the flagged-uncertain ones were handled well — the lesson
being that a re-run spike must exercise the **actual** design command, flags and
all. Future agents: when cleanliness feels earned, check whether it was bought by
pushing the hard part into a step labeled "deterministic" and left unbuilt, and
never trust a premise whose validating command differs from the design's.

---

## 2026-07-30 — round-2 review of the rebuilt architecture (independent collapse-hunt + expert-review)

Both mandatory passes were dispatched blind to each other, neither told what the
author suspected. **The architecture did not survive.** The collapse-hunt found
five collapses and four partial; the expert-review returned NEEDS FIXES with ten
findings, two Critical. All were applied. Two were caught by **Max Cogar**, not
by any safeguard, and are logged as process failures below.

**Class legend addition:** **decision-hiding** — the real deciding step is named
but never designed, so no one can review it.

1. **The send bar had no term for "could the agent have got this itself?"**
   Collapsed by: *"`decision-impact` is materiality × structural_weight — every
   term measures how much a fact MATTERS. Point at the term that measures how
   cheaply the agent could have got it. RETHINK §2.3 says marginal value over the
   agent's own abilities is the only relevance metric that matters."*
   Class: **reduction**. `non-obvious` — criterion 2 of the corrected foundation's
   five — appeared twice in the document, both times in prose, computed nowhere;
   the traceability matrix answered P5 with a design intent plus a term meaning
   something else. Fix: `self_serve_cost` as a third factor, the consumer's
   read/search set supplied to Move A, `non_obviousness` in the Move-B schema,
   combined by minimum; AC-16a fixtures it. → D10.5a, D12.

2. **The two owner-added conduct genres were structurally undeliverable.**
   Collapsed by: *"AC-19 needs a whisper naming a skill step and the absent tool
   call. Name the store fact it binds to. Skill text lives in the transcript;
   Tier 3 is in-memory; D6 has no table. And 'no matching tool call observed' is
   an absence claim — the exact shape that precluded Unknown last round."*
   Class: **decision-hiding + reduction**. Fix: session-evidence fact class with
   a transcript-offset resolver, `skill_expectations` in D6, and the Process
   detector specified to its mechanically decidable subset. → D14, D6, D12, D13.

3. **Lane 2 spends the same subscription the agent is spending, unbounded.**
   Collapsed by: *"the piggyback reuses the host credential, therefore the host's
   rate limits. Where is the number bounding calls per session? If the oracle
   exhausts the quota, it has not wasted a sentence — it has stopped the work,
   through the one channel NF-1 structurally cannot see."*
   Class: **mechanism-not-mission**. Fix: intent queue designed (coalescing, not
   dropping), per-session call budget, announced degradation, and `StopFailure`
   (`error: rate_limit`) as the detector for the case the budget cannot prevent.
   → D10.8a/8b.

4. **Which agent gets helped was decided by arrival order.** In a six-way
   fan-out, consumers 5+ received zero budget. Class: **reduction**. Fix:
   reservation with reclamation, ceiling scaling with active consumers,
   cross-consumer warn preemption, FR-M2 finding on budget-denial. → D15.

5. **The injection defence didn't cover paraphrase, which is what composition
   IS.** Collapsed by: *"pointer-only is a rule about quotation; Move B exists to
   reword. An instruction inside a flagger-missed fact's `claim_text` binds to
   the very fact whose text carried it."* The document's own collapse answer was
   backwards. Class: **unverified/overclaim**. Fix: trust-conditioned composition
   — `untrusted_repo` facts supply no `claim_text`. → D12, D13, T1.

6. **Move C checked reference, not entailment** — and the document concluded from
   the reference check that the model "never invents what counts as true."
   **Reproduced live**: given one fact stating two files co-changed 16/20 times,
   the model returned claims that the coupling is *"stable"*, *"a standard
   pattern, not accidental"*, and that a change *"would improve modularity"* —
   all bound to that fact, all passing. Class: **wrong-check**, and the second
   recurrence of item 1 of 2026-07-17: existence was moved beneath the *send*
   gate and reappeared as the *claim* gate. → D12 Move C.

**Also caught by expert-review (premise/standards axis, applied):**
- **SERIOUS — the shipped model command was unreliable** *(graded CRITICAL in
  the first version of this entry; round 2 classified it SERIOUS — corrected
  2026-07-30 per R3-11, and its substance corrected too: see below).* **The lesson: a premise
  certified from a command that differs from the shipped one will be wrong, and
  will be wrong repeatedly.** This single premise was stated three ways across
  three rounds — "fails always", then "depends on the system prompt", then
  "depends on the tool flag" — and each version was measured, plausible, and
  superseded. Only the last survives. *Measurements live in the architecture's
  Spike 1, not here; this entry deliberately holds no numbers, because the two
  earlier versions of it went stale in place while the architecture was
  corrected.*
  Same class as round 1's `--bare` bug, from the same cause: the validating
  command was not the shipped command — the lesson round 1 wrote into *this file*
  and the spike section did not apply.
- **CRITICAL — `--disallowedTools` left eight tools available**, so T4's "empty
  by flag" was false and the rationale ("denies new tool names by default") was
  inverted. `--tools ""` returns `NONE` and costs one fewer turn.
- Repo identity: six root commits on this repository, two contradictory selection
  rules, and shallow clones silently key a different store.
- `SessionEnd`'s 1.5 s budget breaks the global shim deadline.
- Round 1's `so_what` fix created a whole-whisper drop path that fires 4/4 on
  real output — a regression introduced by a fix.

**Process failures — the owner was the one who caught these (log per `CLAUDE.md`):**
- **A dispatch brief asserted a required tool was unavailable**, sending the
  reviewer straight to a fallback. Self-fulfilling: an agent told a tool is absent
  never attempts it and cannot discover the claim is false. The claim was also
  unverified — inferred from the dispatcher's own tool list, about a subagent's
  roster. Durable rule: *a brief states the requirement, never the availability.*
  (`skill-observations/log.md` observation 13.)
- **Grep was used as verification.** Two greps in one turn produced a false
  negative (a verbatim RETHINK quote missed because the sentence wraps a line)
  and a false positive (`quota` matching inside `quotation` — the evidence the
  collapse-hunt used to claim "quota appears nowhere"). Durable rule: **search
  locates, reading verifies**; absence is established by reading the region.
  This is a defect in `expert-review`'s own SKILL.md, which mandates grep
  evidence for absence claims in Gate B. (Observation 14.)

**Pattern this round.** 2026-07-17 was *reduction at the model's role*; 2026-07-22
was *the hard part relocated into an unspecified deterministic step*; this round
the shape moved once more: **the hard part is a named noun with no producer, and
every place it is claimed to be handled points at a different place that also
does not handle it.** `non-obvious` is a criterion, a word in prose, and a matrix
row that resolves to a design intent — and a computation nowhere. `uptake` is a
schema column driving automatic genre retirement with no detection rules. The
`intent queue` is two mentions in a list, and it decides what the model may see.
The cross-consumer budget is a default with no allocator. The tell is cheap:
**a citation that lands on a design intent, a schema column, or a component name
rather than on a per-candidate computation with named inputs is an unfilled
requirement wearing a reference.** For every principle and every column ask *who
writes this, in which decision, from what inputs.*

**Two structural lessons for the next round.**
1. **Everything the previous round touched got a real mechanism; everything it
   did not touch stayed prose.** Every collapse above sits in a criterion that
   was never contested. A hunt that starts from the previous hunt's findings will
   find nothing. Start from the *anchor documents' own enumerated criteria* — the
   corrected foundation's five conditions, RETHINK §2.3, the twelve genres.
2. **Every collapse this round lived BETWEEN decisions**, and the collapse test
   is written per decision, so it structurally cannot see them: conduct genres
   designed in D14 and gated in D12/D13; budget set in D10 and divided in D15;
   injection claimed in T1 and implemented in D12/D13 with contradictory rules.
   **Countermeasure, now required:** in addition to the per-decision test, write
   **one collapse test per genre that traverses the whole pipeline** — trigger →
   retrieval → grounding → bar → budget → assembly → delivery → audit → learning
   — and require each of the twelve FR-A2 genres to survive end to end.

---

## 2026-07-31 — the owner collapsed the document structure; logged as a process failure

**Caught by Max Cogar, not by any safeguard**, across four rounds of adversarial
review that had all the evidence and never asked the question. Logged per
`CLAUDE.md` ("the owner is never the collapse-tester … log it").

**The collapse question, his:** *"3 phases in one spec. WHY?"*

**What it collapsed.** Spec §12 stages the build into three phases whose exits are
**measurements, not tests**: Phase 0 exits on *"the owner runs it on a real project
without incident"*; Phase 1 on *"measured silence and hit rates reviewed against the
bar"*; Phase 2 on *"a demonstrated case of the oracle measurably improving between
sessions."* Each phase's design is therefore gated on data only the previous phase
can produce.

But the spec specifies all three phases' requirements now, and `CLAUDE.md`'s
lifecycle then requires **one** architecture document resolving Phase 1 design
questions (it names judgment-prompt construction and the recursion-guard mechanism)
before *any* implementation. So the governance mandates specifying and architecting
Phase 1 and Phase 2 **twice**: once now against nothing, and once later against
measurements. Only the second can be real.

**Class: mechanism-not-mission**, at the governance layer rather than in a decision.

**The evidence that was present the whole time and never interrogated.** Across
rounds 1–4 the Phase 0 material (stores, event contract, shim, indexer, miner,
security scanner, repo identity, audit ordering) survived every pass and several
decisions re-derived *exactly* under re-execution. The Phase 1/2 material (judgment
core, conduct genres, the materiality half of the bar, uptake ladder, learning loop)
collapsed in **every** round — 2026-07-17 items 1–4, round 2's C1/C2, round 3's
C1/C2/C6–C9, round 4's R4-1 through R4-4 and C1–C16. The split is almost perfectly
clean along the phase boundary. Four review rounds reported the pattern; none asked
why the pattern existed.

**Why the reviews could not catch it.** Both passes review *the architecture against
the spec*. This defect is in the relationship between the spec's own §12 and the
lifecycle that consumes it — above the artifact under review, so in-scope for
neither pass. A reviewer told to check an architecture will not ask whether the
architecture should exist yet.

**Standing lesson.** When one half of an artifact fails every round and the other
half survives every round, the split is the finding. Ask what separates them before
applying a fifth batch of fixes to the failing half. A defect that reproduces along
a boundary already named in the spec is a structural defect, not a quality one.

## 2026-08-01 — ten collapses in one session

Ten propositions or artifacts were caught this day; nine by the independent
adversarial pass, one by Max Cogar. **Full findings for each are in
`docs/reviews/2026-08-01-*.md`** — this entry carries only the lessons, per the
information policy's one-line-plus-a-pointer rule. *(These entries originally
reproduced the review findings in full, which is the same policy violation ten
times over. Condensed the same day.)*

**Caught by Max Cogar, logged as a process failure:**

1. **"The core problem the tool exists to solve"** — an agent's superlative,
   wrapped around the owner's quoted words in `RETHINK.md`, had propagated to the
   spec, this log, a review pass that quoted it back as its standard, and a live
   scope decision. **Lesson: no ranking claim about this tool's purposes, genres,
   triggers or moments enters any document unless the owner stated it in those
   words, quoted and attributed.** A reduction inside a *rationale* is more
   durable than one inside a decision, because reviewers check decisions against
   sources and read rationale as prose.

**Caught by the adversarial pass, written after the artifact (cost: a commit, a
revert and a correction each):**

2. **The Phase 0 genre cut** (14 findings). **Lesson: when the argument for
   excluding something is that it isn't worth saying, that is a bar argument —
   per candidate, at runtime, tunable — never a scope argument. A bar suppresses;
   a build plan deletes. The tool getting quieter is not the tool getting
   smaller.**
3. **Crediting the owner with an answer the documents already contained.**
   **Lesson: before recording that something was missing, read the file you are
   about to say it was missing from. When the owner points at something,
   establish whether he is supplying it or citing it — the default is citing.**
4. **The Phase 0 purpose block** (17 findings). **Lesson: a purpose sentence is a
   claim about what a thing can do and needs the same verification as any other.
   "X is necessary for Y" is not "X exists for Y". A criterion that cannot
   exclude is not a test; one that excludes at build-plan level is the prior
   collapse in new clothes. The spec does not cite numbered architecture
   decisions as authority.**
5. **A separate Phase 0 spec** (19 findings). **Lesson: when a defect is named as
   "X was done twice", the remedy removes one of the two — it never adds a third.
   A new document needs a written precedence rule before its first sentence.**
6. **The phase-assignment table** (23 findings). **Lesson: a verified premise
   confers no verification on its consequences. A table is not a summary — every
   cell is a claim. "Every X is Y" under a table is an attestation, and the
   standing instruction is to treat one as a defect on sight. The falsifiable
   column is the one that gets dropped.**

**Caught by the adversarial pass, run before the artifact (cost: one subagent
each, nothing written or reverted):**

7. **Uptake detection under FR-A4.** **Lesson: a requirement and a metric can
   share a predicate's name, a subject key, and the same source sentence and
   still be opposite tests — one asks "has the agent already got this?"
   (suppress), the other "did the agent take this?" (score). The detector one
   rejects may be exactly the detector the other requires. A stated limitation is
   a bound only when independent of the decision it feeds; otherwise it is a
   hedge.**
8. **Phase 1's exit "has no pass condition".** **Lesson: "every other X" is a
   claim about a set and is only as good as the enumeration behind it. A real
   finding dressed past its evidence leaves the dressing for the next session to
   inherit.**
9. **An entry-gate/exit-gate conflict between the spec and `CLAUDE.md`.** There
   was none. **Lesson: when two documents appear to conflict, check whether one
   is quoting the other before deciding which wins — identical wording is
   evidence of copying, not corroboration. Ask what a question unblocks before
   ranking it.**
10. **The seven-genre Phase 0 list** (13 findings). **Lesson: a criterion that
    admits every member but one on both its conjuncts, and that one member on a
    single conjunct, was reverse-engineered from a list already chosen. And after
    a run of kills the authoring instinct learns that *inclusive* proposals
    survive — every safeguard here points at exclusion, so an inclusive error has
    nothing watching for it. Being wrong in the safe direction is still being
    wrong.**

**The thread through half of them.** Four separate failures were the same act:
declaring a mechanism missing without reading the line defining it; claiming
"every other X" without enumerating; quoting a paragraph to the em-dash where the
continuation reversed the reading; and asserting what sibling sentences contain
without opening them. **Stopping too early against a source that is right there.**

**The process lesson that changed the session.** The first six were written and
then hunted. The last four were hunted and then written. Cost of the first order:
a commit, a revert and a correction each. Cost of the second: one subagent, and
nothing to undo. **Dispatch the pass before writing into a document, not after.**

---

## 2026-08-25 — Blocking-model rebuild (6 rounds to convergence): the recurring shape and how it terminates

The blocking model was rebuilt onto the verified reactive `PreToolUse`-deny
mechanism and taken through six dual-review rounds (expert-review + collapse-hunt
each round) to a zero-findings / TERMINAL verdict. Durable lessons, for the next
designer who touches a fallible-recognizer feature:

1. **"The guard shares the recognizer's blind spot" is the signature failure of
   this whole class.** Every round, a fix to one fallible recognizer re-created
   the same shape one layer down: the under-fire *guard* for a block re-ran the
   very classifier whose miss it was meant to catch (round-2 skill detector,
   fixed by switching FR-C4 to an **observable post-condition** checked directly
   against state, independent of the action classifier); the done-claim *backstop*
   shared the answer-recognizer's blind spot (named, not hidden). **Lesson: an
   under-fire/backstop signal is only a guard if it is derived independently of
   the thing it guards. If it routes through the same judgment, it inherits the
   same blindness and guards nothing.**

2. **Honest-limits has *layers*, and naming one layer hides the next.** Round 3
   honestly named the *deny-target* limits (which writes get caught). Round 4
   found that left the *recognizer* limits unnamed (whether the block can even
   tell it should fire, model-free) — two overclaims ("full Bash coverage a
   committed follow-on"; the model-free block "works") were sitting *inside* the
   honest-limits sentences. **Lesson: "we disclosed the limit" is not done until
   you've asked what the disclosure itself assumes. Disclosing the coverage gap
   while overclaiming the recognizer is the same hollowness wearing an honest hat.**

3. **A self-administered collapse test grades its own homework.** §8 had the
   author write AND answer each block's "hardest question" — and (predictably) it
   picked the beatable question and answered the *honesty* variant ("is the limit
   disclosed?") instead of the *achievement* variant ("does it meet the objective
   in the case that matters?"). The independent hunt caught exactly this. **Lesson:
   an in-document self-test never discharges the mandatory independent hunt; when
   you find yourself writing both the question and a passing answer, you are the
   substance-reviewer again. State the self-test as *not* a gate.**

4. **The cardinal sin relapsed inside the fix for another finding.** In scoping
   the answer-drift block (fixing a round-1 finding) I put Max's real chat words
   into the spec *as authority* — the exact owner-attribution failure the ledger
   exists to stop, committed while fixing something else. **Lesson: the correction
   round is where owner-attribution discipline lapses, because attention is on the
   mechanism. Real owner words go to `OWNER-LEDGER.md` PENDING and the durable doc
   grounds on a design judgment `[D-n]` until he signs off — even when the words
   are genuinely his.** (This is why the self-review-before-independent-review step
   is mandatory: my own fixes were the likeliest source of new defects, and were.)

5. **Two error-directions of a fallible predicate are two regimes, and one lean
   applied twice is a bug.** The final finding: the answer-drift clear-axis leans
   *toward clearing* in steady state (don't strand a compliant answerer) but must
   lean *toward holding* in the lag window (don't pre-clear on text the classifier
   hasn't seen — that misses the narrate-then-write drifter). Carrying the
   steady-state lean into the lag window silently picked the wrong horn. **Lesson:
   when a recognizer runs against eventually-consistent state, specify the lean for
   the not-yet-consistent window *separately* — the error that self-recovers in-band
   is the one to prefer, and it is usually the opposite of the steady-state lean.**

6. **Not every reviewer-flagged "scope softening" is the owner's call.** The
   collapse-hunt framed three coverage limits as "route to Max." Two were
   *mechanism-forced* (a verified-correct clear bar would be the rejected
   pass-a-test gate; pure-judgment skill steps are undetectable by any mechanism)
   and one was *sequencing* (mine). Handing a non-programmer a mechanism-forced
   "choice" is the over-asking failure. **Lesson: apply CLAUDE.md's test — can you
   name what decides it? — before escalating. Mechanism-forced and sequencing are
   the agent's; surface them for *awareness*, not as questions. Only a genuine
   yes/no on the owner's own directive goes to him.**

**The terminal state.** Convergence is not "no limits left" — it is "every
remaining limit is an irreducible truth about the problem, named, measured, and
(where testable) acceptance-tested, with nothing claimed the mechanism can't
deliver." Six rounds got there because each round's independent hunt attacked the
*previous round's fix*, and the author self-reviewed the fix first. The trajectory
(6 → 1 → 5 → 4 → 1 → 0 findings) is what convergence looks like; a round that finds
nothing is the signal, not an assumption you may make early.

## 2026-08-28 — the narration strip silently un-applied a review finding

The 2026-08-28 hygiene strip (removing self-narration and smuggled mechanism from
the spec) deleted, along with the narration, the **lag-window lean** — the round-5
collapse-hunt's one real finding (entry above, item 5; commit `d83ae5f`): in the
answer-drift block's classifier lag window, hold/deny rather than pre-clear on
unclassified text, the opposite of the steady-state clear lean. The strip removed
it from FR-B1, FR-B5, and D-41 as if it were mechanism; it is an error-direction
**property**, the same class as the FR-B5 leans the strip kept. STATUS.md then
asserted "no loss of requirements or properties" — written by the same agent that
did the stripping, and wrong. Max Cogar's suspicion, not the process, triggered
the re-check; the diff audit found it (restored 2026-08-28, with the FR-O4/FR-O4a
citation-resolution note the strip also deleted while downstream documents still
cite those IDs). An independent full-document sweep the same day found a **third**
strip-lost item the author's own diff audit missed — the FR-A2l clause recording
that the answer-drift block is authorised by OL-C3/OL-C5, not OL-9 (the ledger's
OL-9 still said "advisory only" with no supersession marker) — plus two live
contradictions inside `OWNER-LEDGER.md` itself and owner-attribution defects in
this very log (corrected in place above). All restored/annotated 2026-08-28.

**Lesson 1: a deletion pass has the same blast radius as a writing pass and needs
the same independent check.** "I only removed narration" is a claim about intent,
not effect. Two checks are required, and neither substitutes for the other:
diff each prior review round's *applied findings* against the post-strip text,
AND run an independent full-document sweep — the author's own diff audit here
found two of the three losses and the independent sweep found the third. A strip
that follows the review is exactly positioned to undo it.

**Lesson 2: "property vs mechanism" is itself a fallible classification — when a
strip/refactor uses it as the knife, every cut it classifies as "mechanism" that
originated in a review finding gets a second look.** An error-direction (which way
a recognizer errs, in which regime) is a property, even when it reads like
machinery.

**Lesson 3: the agent that performed a cleanup may not be the one who certifies
its losslessness.** "No loss" claims about one's own deletion are the same
self-graded homework as the self-administered collapse test (entry above, item 3).

## 2026-08-28 — correcting a reference inside misplaced content ratifies the misplacement

Applying the same day's sweep findings, an agent "fixed" `CLAUDE.md`'s stale
section numbers and phase vocabulary *inside* a dated history narrative (the
"Amended 2026-07-31" paragraph) and a deleted-file tombstone — content that fails
`CLAUDE.md`'s own membership test ("true regardless of where the project stands")
and already had a home (the collapse-log's 2026-07-31 entry). The correction made
the misplaced content *more* current, which is the opposite of the fix; Max Cogar
caught it, not the process. **Lesson: before correcting any defect inside a
document, apply that document's membership test to the content the defect sits
in. If the content doesn't belong there, the fix is relocation to its home (or a
pointer), never a better-maintained copy. A reviewer's "fix the reference" finding
does not settle the placement question — that is the target file's policy to
settle.** Dated *supersession pointers* on decisions belong in authority files;
dated *narratives about how the file got this way* never do.

## 2026-08-29 — the Phase A architecture review series: the reviewer's own repair text is a first-class defect source

Four dual-review rounds (expert review + collapse-hunt, blind pairs) on
`docs/architecture-phase-a.md`; full evidence in the eight
`docs/reviews/2026-08-29-*architecture-phase-a.md` files. Collapse trajectory
5 → 6 → 1 → 1. Two durable lessons, both from round 4:

1. **A reviewer's concrete repair prescription carries no verification of its
   own — it must be attacked by the next round exactly as author text is.**
   Round 4's collapse and its top partial both entered the document as
   verbatim sentences from the round-3 reviews' own prescribed repairs,
   faithfully applied under the apply-all-findings rule: the consumer-filter
   prescription flattened two consumers with opposite correct semantics (a
   failed Edit is not a change; a failed test run IS a run), and the
   communicative-verb prescription shipped a false universal ("the requested
   act is text") its own lexicon could not establish. Class: **unverified**
   (prescription-carried). Fix-application fidelity and fix *correctness* are
   different checks; apply-all-findings covers the first and exempts nothing
   from the second.

2. **When the same defect returns a third time through repairs, stop
   patching by list — enumerate every consumer/producer of the touched
   primitive by name, with each one's semantics.** The
   run-and-failed-looks-never-run whisper died three times (no failure
   producer; producer wired to an event that cannot carry it; producer wired,
   rows filtered back out of the one consumer the wiring was justified by) —
   each resurrection introduced by the repair for the previous death, each
   passing a fixture pinned to the adjacent axis. The terminating repair was
   the one that enumerated the readers of `observed_actions` and stated, per
   reader, what a failed row *is* to it — and round 5's charter audit of that
   very enumeration found a tenth reader it had missed (the regret proxy's
   re-edit clause), so the corollary is: **an enumeration offered as a
   terminating repair is itself the first thing the next round verifies for
   completeness.** Class: **wrong-check**, thrice.

## 2026-09-03 — round 6: a fix must land where the finding named, and a default flip has two miss directions

Sixth dual-review round on `docs/architecture-phase-a.md`; evidence in the two
`docs/reviews/2026-09-03-*architecture-phase-a.md` files. Second consecutive
zero-collapse round (collapse trajectory 5 → 6 → 1 → 1 → 0 → 0); one real
Serious and four partials, all inside round-5 repair text. Two durable lessons:

1. **A fix that names a location must land at that exact location, not one
   decision away.** Round 5's tenth-reader fix stated the re-edit clause's
   outcome semantics at the reader's own site (AD-18) but not in AD-4's
   CONSUMER FILTER — the canonical enumeration whose completeness the
   2026-08-29 corollary makes the deliverable — so the enumeration was still
   one reader short on audit. Round 5's per-project-watermark fix updated the
   `global_meta` comment but left its operative sibling, the `whisper_stats`
   WRITER comment, describing the bare global watermark an implementer would
   build from — re-encoding the exact stranding bug the fix removed. Class:
   **wrong-check** + unapplied sub-clause. The check: when a finding names
   *where* the defect lives ("add to the filter", "sync the comment",
   "per-project"), re-read that exact sentence after the fix, not only the
   decision that owns the mechanism.

2. **A default flip closes one miss direction and can open the opposite one.**
   Round 5 flipped the unlisted-object classification default to `request` to
   stop wrongly denying build-fulfilled unlisted nouns ("show me a
   prototype?"). The same flip swept the escalation re-ask "can you please
   answer my question?" (object head "question", also unlisted) into `request`,
   disarming the `OL-C3` recourse — a regression on the *opposite*
   (under-enforcement) axis. Class: **unverified** (a default's safe direction
   asserted for the whole class without checking the members whose safe
   direction is the reverse). The check: a default that resolves an
   incompleteness must be tested against both the members it protects and the
   members whose correct answer is the other way.

## 2026-09-03 — round 7: widening the deny-capable set has its own two miss directions, and "classifies every row" is a claim over the whole input domain

Seventh dual-review round on `docs/architecture-phase-a.md`; evidence in the two
`docs/reviews/2026-09-03-round-7-*.md` files. Third consecutive zero-collapse
round (5 → 6 → 1 → 1 → 0 → 0 → 0); one real Serious and one partial, both inside
the round-6 classifier fixes. Two durable lessons:

1. **When a round widens the deny-capable set, audit the new members for
   fulfilling-move wrongful denies — not only the gap the change was made to
   close.** Round 6 seeded "question"/"answer" into the information-object
   lexicon to *close* an under-enforcement gap (restore the `OL-C3` recourse).
   The same seed *widened* over-enforcement: it made deny-capable a class whose
   answer IS a mutation ("can you answer the question in the ticket?"), so the
   categorical `Edit`-deny wrongfully denies the fulfilling edit. Every round
   since the deny-capable set began shrinking only shrank it (the safe
   direction); round 6 was the first to grow it, and the growth's wrongful edge
   went unaudited — resting on the false soundness universal "mutating the
   repository does not produce an answer to it." Class: **unverified** (the "two
   miss directions" lesson sharpened: a set-widening change is audited in both
   directions, and its soundness rationale is attacked as author text).

2. **A totality claim ("classifies, positively, every opened row") is a claim
   over the whole input domain, not the cases the last fix enumerated.** The
   object-head classifier enumerated by cases (wh-complement / info-object /
   artifact-object / unlisted-object) and silently omitted the *no-object* input
   ("can you explain?"), leaving the invariant false and an inline decision in
   the soundness-critical classifier. An enumeration-by-cases is not a proof of
   totality — when a decision claims to be total, list every reachable input
   shape and confirm each has a defined, correct output. Class: **wrong-check**
   (a totality invariant verified against the enumerated cases, not the domain).

## 2026-09-03 — round 8: a component found incomplete a new way each round is under-specified, not unlucky; and a residual is owned as a class, not a growing enumeration

Eighth dual-review round on `docs/architecture-phase-a.md`; evidence in the two
`docs/reviews/2026-09-03-round-8-*.md` files. Fourth consecutive zero-collapse
round (5 → 6 → 1 → 1 → 0 → 0 → 0 → 0); one real Serious and one partial. The
finding count plateaued (8 → 5 → 3 → 3) after three straight decreases — the
first non-decrease — and all three defects were in the answer-drift classifier
that rounds 6, 7, and 8 each found incomplete in a **new** way (a seeded object
class; a missing no-object case; an undefined compound/coordinated parse). Two
durable lessons:

1. **A component found incomplete in a new way each round is under-specified,
   not unlucky — complete it as a specification once, don't patch per-input.**
   The object/verb classifier had been fixed input-by-input (add question/answer;
   add the no-object case), and each fix left the next reachable input shape
   undefined. The convergence-forcing move was to write the extraction/selection
   rules down completely — object-head = the rightmost noun, matched alone;
   coordinated-verb selection — and then re-derive the labeled corpus FROM the
   rules, so a corpus row can never again contradict the rule (the "version
   number → info" row did, because it needed a bag-of-words match the head-noun
   rule forbids). When three rounds find one component incomplete three different
   ways, the defect is the specification's completeness, not the individual gaps.

2. **A residual owned as "exactly N member shapes" that grows every round is the
   wrong shape — own it as a class.** The wrongful-deny residual grew from one to
   two to three enumerated members over rounds 5–7, each round's collapse-hunt
   finding the (N+1)th; the P1 lineage recurred seven times. The fix was to state
   member (3) as a *class* — any in-frame `info`-classified ask whose fulfilment
   or a co-asked action is a repo mutation — so a newly-routed ask falls into the
   class rather than exposing a missing enumerated member. A completeness claim
   over an open set must be a class predicate, never a list.

## 2026-09-03 — round 9: when per-input findings plateau (the tripwire fires), demote the over-claim to what the spec mandates — don't patch again

Ninth dual-review round on `docs/architecture-phase-a.md`; evidence in the two
`docs/reviews/2026-09-03-round-9-*.md` files. Fifth consecutive zero-collapse
round; one Serious, one partial, three notes — and the finding count held at 3
(8 → 5 → 3 → 3 → 3), firing the non-convergence tripwire's count condition for
the first time. The durable lesson:

**A model-free / heuristic component that keeps failing a new way each round is
over-claiming — the convergence-forcing fix is to demote the claim to what the
spec actually mandates, not to patch the next input.** The answer-drift
classifier was found incomplete four rounds running (R6–R9), each fix closing
one construction and the next round finding another (compound, coordinated,
post-head PP, morphology). Round 8's "specify it completely, once" attempt still
over-claimed — it asserted the classifier was *total over its input domain* and
the residual had *exactly N member shapes*, guarantees a model-free recognizer
cannot meet — so round 9 found R9-S1 (a corpus row the completed rule
contradicted) and the (N+1)th residual member on a new axis (frame). The spec
(`D-41`, §11.5) asks Phase A only for a **conservative, low-coverage skeleton**
whose coverage is *measured at exit*, not asserted. The reframe: (a) demote the
classifier to a best-effort heuristic whose mis-parses are **safe by
construction** (they fall to the under-enforced side or into the owned
residual); (b) collapse the residual from a growing enumeration into **one open
class defined by its property**, so a new phrasing or mis-parse is the same
class, not a missing member; (c) make the test corpus **derived from the rules**
(illustrative), so a row can never contradict the rule again. When the tripwire
fires on a component, find the totality/completeness claim the component makes
that its own mechanism cannot back — and remove it, returning to the spec's
actual (weaker, honest) mandate. Class: **reduction, inverted** — not a broad
requirement collapsed into a narrow mechanism, but a narrow mechanism inflated
with guarantees broader than the requirement.

## 2026-09-04 — the review treadmill built AI slop: passing reviews replaced serving the phase goal

**Caught by Max Cogar, not by any of ten review rounds.** The Phase A
answer-drift classifier (`AD-9`) was elaborated across rounds 1–10 —
communicative-verb and information-object lexicons, base-noun-phrase head
extraction, wh-complement precedence, coordinated-ask handling — each round
closing the last round's findings and adding machinery, until it *looked like* a
working answer-drift block. Max read it and asked "why is the answer drift so
large? there shouldn't be anything special about it," then named the disease:
*"fake bullshit to make it look like its working instead of setting it up to be
able to cleanly add the rest of what it requires when the next phases are
built"* — *"the same kind of bullshit that made me have to abandon 3 other fully
built versions of this."*

**Class: goal-loss (mechanism-not-mission at the process layer).** The spec
(`D-41`, §11.5) asks Phase A for a recognizer that "errs hard toward
not-firing," "low-coverage," explicitly "a skeleton, not 'the block working.'"
The architecture over-reached its own spec into a coverage-maximizing
classifier. The defect was the architecture, not the spec.

**Why ten rounds could not catch it.** Both passes check the artifact for
correctness, consistency, standards-conformance, and citation integrity. Neither
asks "does this mechanism serve the Phase A goal, or is it machinery that only
passes review?" The finding count reached zero (round 10) precisely because the
machinery was internally consistent — a correct, self-consistent, well-cited
fake. Review optimized for passing; passing is not the goal. (This is the
process-layer twin of the same day's mechanism-layer lesson, 2026-09-03 round 9:
a narrow mechanism inflated with guarantees broader than its requirement.)

**Standing lesson (now `CLAUDE.md` dominating rule 3).** State the phase goal
before any spec/architecture/plan/build decision, and judge every decision *and
every review* against it. A document that passes review but does not serve the
phase goal is slop — cut the machinery, log it as a finding. Phase A's goal: an
honest deterministic foundation that measures its own floor with clean seams for
later phases, never fake completeness. `AD-9` returns to the architecture layer
to be rebuilt to that goal, then re-reviewed.
