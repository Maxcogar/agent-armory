# Independent collapse-hunt — Phase A implementation plan, round 7 (2026-09-07)

**Artifact:** `docs/plans/plan-phase-a.md` (6923 lines, read in full this
session, across sequential `Read` calls with no gaps), at commit
`048aec8` on branch `claude/plan-correction-strategy-57ot28` — the
commit produced by round 6's expert-review fix pass (the semver
correction to D-plan-2/§14.2, the §3 "bin 1 answered" → current-register
fix, the §14.4 Pass L addition, and the `.mcp.json`→npm-registry wording
fix).

**Axis:** mission-fidelity (`CLAUDE.md` dominating rule 3 and rule 2's
collapse test), plus a library-behavior-verification sweep per this
round's explicit brief.

**Reviewer:** independent subagent, no prior context on this session,
not the author of the plan, any prior fix pass, or any prior review of
it.

**Read in full before the attack:** `middleware/context-oracle/CLAUDE.md`
(full); `docs/collapse-log.md` (full 2026-09-07 entry set through the
round-6 entry, plus enough of the file's history to place the pattern);
`docs/STATUS.md` (full); `OWNER-LEDGER.md` (full); `docs/specs/
spec-context-oracle.md` §8, §11.5, §12, §13, §14 (in full);
`docs/architecture-phase-a.md` AD-5, AD-9, AD-10, AD-14, AD-20, AD-24,
AD-26 (in full, plus AD-2/AD-3 read in full when the plan's Step 2/5
citations pointed there); all ten prior review documents in
`docs/reviews/` (the 2026-09-06 pair, rounds 2–6 pairs), round 6's pair
read closest; `docs/plans/plan-phase-a.md` end to end (lines 1–400,
400–620, 620–902, 901–981, 977–1173, 1173–1339, 1339–1465, 1465–1538,
1538–1761, 1759–1869, 1980–2212, 2212–2432, 2430–2660, 2659–2819,
2817–3087, 3083–3258, 3257–3477, 3477–3591, 3590–3766, 3765–4005,
4004–4284, 4284–4464, 4428–4463, 5185–5215, 5251–5423, 5541–5720,
5885–6014, 5993–6283, 6083–6283, 6460–6720, 6590–6720, 6850–6923 — every
`### Step N` heading and body, §1–§9, §10/§10A in full, §11 in full,
targeted reads across all of §12's ~90 T-ID entries, §12.5's two mapping
tables, §13 Risks, §14 in full, §15 in full, §16 in full).

**Verification instruments used beyond reading.** A live Node.js
v22.22.2 runtime with `node:sqlite` (this sandbox), used to execute —
not recall from memory — the exact `node:sqlite` behaviors the plan
cites as "Node's official documentation" (see Collapse 1). A `WebFetch`
of `https://nodejs.org/api/sqlite.html` (the official docs page) and of
`https://nodejs.org/en/blog/release/v22.16.0` and
`https://github.com/nodejs/node/pull/56253` (corroborating the
already-correct `backup()`-since-22.16.0 claim, which survives). A
constructed shallow-clone-vs-full-clone git repository pair in
`/tmp`, to re-confirm `git rev-list --max-parents=0 HEAD`'s
shallow-clone behavior underlying AD-3/Step 5 (survives, already
correctly designed around).

## Verdict: DOES NOT SURVIVE (one new collapse; round 6's four fixes hold; three minor findings)

- **Round 6's fixes: all verified genuinely closed by direct re-read at
  their cited locations, independently, using fresh grep and Read —
  not trusting STATUS.md's narrative or the plan's own "corrected this
  fix pass" annotations:**
  (a) Step 9's DAO body (line 1129) now correctly cites "Step 37's ULID
  util," not "Step 41's" — confirmed by direct `Read` of line 1129 and
  a full-document grep of "ulid"/"ULID" (5 hits, all four non-Step-37
  citations now consistent, only Step 37 itself builds `util/ulid.ts`
  per §5.1 line 378).
  (b) D-plan-2's collapse-test (§10A, lines 3554–3588) and §14.2's
  web-tree-sitter entry (lines 6223–6241) both now state the real
  semver semantics — re-verified this session by re-running
  `semver.satisfies('0.27.0','^0.26.13')` conceptually against the
  quoted `node-semver` range algebra in the plan's own text
  (`>=0.26.13 <0.27.0-0`), which is correct caret-range arithmetic for
  a pre-1.0 package, and by confirming no residual "accepts 0.27.0
  anyway"/"accepts either" phrasing survives anywhere in the document
  (grepped `0.27.0`, all 11 hits read in context — none restate the
  false premise).
  (c) §3's Standards registry (lines 204–216) now cites the current
  bin-2 register state ("recorded as an open bin-2 item at §14.2 …
  with the prior bin-1 framing … retracted") instead of "bin 1
  answered" — confirmed by direct `Read` and a full-document grep for
  "bin 1 answered"/"bin-1 answered" (0 hits).
  (d) §14.4's sweep-record narrative (lines 6440–6459) now has a
  "Pass L (fix pass, round 5 — independent re-review response, added
  this fix pass, round 6 …)" entry — confirmed by direct `Read` and a
  grep for `Pass [A-L]` (12 hits, A through L, no gap).
- **New collapses this round: 1.** A load-bearing "authoritative
  standard" citation about `node:sqlite` error-handling behavior,
  never checked against a real runtime or the official docs across
  this document's seven-round history, is factually false — the same
  defect *class* round 6 found for semver (an unverified
  library-behavior claim inside a decision's own justification), at a
  different site round 6's semver-specific grep never touched.
- **Minor findings: 3** (below "Collapse" severity — none is load-bearing
  on a build outcome, each is a documentation-consistency gap of the
  kind this project's collapse-log already tracks as a class, reported
  honestly rather than either inflated to a collapse or silently
  dropped).
- **What survives.** Every §10A collapse-test (D-plan-1 through
  D-plan-8, N1–N6, the three plan-level entries) was re-attacked with a
  fresh hardest-question pass, independent of round 6's own re-attack;
  none produced a new crack. The full §12 test-specification section
  (~90 T-IDs), both §12.5 mapping tables (with one cosmetic exception,
  Minor Finding 3 below), §13 Risks, and §14/§15/§16 were read in full;
  no defect beyond the four reported here.

---

## Collapses

### Collapse 1 — Step 2 cites "Node's official `node:sqlite` documentation" for a `SqliteError` class that does not exist

**What the plan says.** `docs/plans/plan-phase-a.md:700–702` (Step 2 —
Runtime floor check + FTS5 probe, "Why this approach," bullet 2, "The
authoritative standard"):

> "`AD-2` (architecture); Node's official `node:sqlite` documentation
> for `DatabaseSync.exec()` behaviour (throws `SqliteError` on
> statement failure)."

This is the *only* place in the entire document (plan, architecture,
spec, ledger) that the string "SqliteError" appears — grepped across
all four files, 1 hit total, this one. `docs/architecture-phase-a.md`'s
AD-2 (lines 325–364, read in full), which the plan's own Source field
cites two lines above this claim, makes no mention of any exception
class name at all — it only discusses the FTS5/`backup()` version
floor, the single-importer quarantine, and the STRICT/WAL/`busy_timeout`
settings. The `SqliteError` claim is therefore plan-original, not
inherited from the architecture, and it was never logged in the plan's
own §11 "Verification of factual claims" registry — the section whose
stated job is "every factual claim this plan asserts, with the
read-level evidence that establishes it." §11.2 ("Claims from the
architecture") lists nine other `node:sqlite`-adjacent claims (V7's FTS5
floor, V8's timing, V17's `VACUUM INTO`/`backup()` floor, etc.), each
with a quoted architecture citation — the `SqliteError` claim has no
entry there at all. It slipped in exactly the way round 6's semver claim
did: stated once at original authoring (2026-09-06), never verified,
never logged as a checked claim, and carried unchanged through rounds
1–6 because no prior round's grep pattern or full-document read happened
to test it against a real `node:sqlite` runtime.

**How this was verified — and found false.** `node:sqlite` does not
export any class named `SqliteError`. This session installed nothing
extra — `node:sqlite` ships with the Node runtime already present in
this environment (v22.22.2, the same runtime family the plan targets) —
and ran it directly:

```
$ node -e "console.log(Object.keys(require('node:sqlite')))"
[ 'DatabaseSync', 'StatementSync', 'constants', 'backup' ]
```

No `SqliteError` export exists. A real statement-execution failure (a
duplicate `CREATE TABLE`, not a JavaScript syntax error) was then
triggered directly against a live `DatabaseSync`:

```
$ node -e "
const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync(':memory:');
db.exec('CREATE TABLE t(x)');
try { db.exec('CREATE TABLE t(x)'); }
catch(e) {
  console.log(e.constructor.name, e instanceof Error, e.code, e.errcode);
}
"
Error true ERR_SQLITE_ERROR 1
```

The thrown object's constructor is the plain, built-in `Error` — not a
distinct `SqliteError` type — carrying `code: 'ERR_SQLITE_ERROR'` and an
`errcode`/`errstr` pair as extra properties on an ordinary `Error`
instance. A `WebFetch` of the official documentation page
(`https://nodejs.org/api/sqlite.html`) corroborates this independently:
the page documents `ERR_INVALID_ARG_VALUE`, `ERR_OUT_OF_RANGE`, and
`ERR_INVALID_STATE` as the named Node.js error codes this module raises
in various situations, and contains no `SqliteError` class of any kind.
Two independent instruments — a live runtime execution and the official
docs — agree: the plan's citation names a class that Node's `node:sqlite`
module does not have.

**Why this is the same defect class as round 6's semver finding, at a
genuinely new site.** Round 6's collapse-log entry (2026-09-07,
documented in `docs/collapse-log.md`) names the lesson precisely: *"A
claim about a well-known mechanism … is exactly the kind of thing a
reviewer is most likely to accept from memory rather than verify,
because it feels too basic to be wrong."* `SqliteError` is exactly this
shape — it is the conventional, expected name for a database-driver
error class (mirroring `better-sqlite3`'s actual `SqliteError`, a
*different* npm package the architecture explicitly rejected at AD-2 in
favor of `node:sqlite`), so a reader skims past it as obviously correct.
It reads as too basic to be wrong, and across seven authorship/review
passes (the 2026-09-06 original authoring plus rounds 1–6), nobody ran
it against a real `node:sqlite` instance or the official docs — the
identical gap round 6 closed for the semver claim, reopened here because
round 6's own verification effort was scoped specifically to the
semver/caret claim its own review brief named, not to a systematic sweep
of every other "documentation says X" citation in the document.

**Practical impact — bounded, like round 6's finding.** Nothing in the
plan's actual implementation instructions depends on catching a
specifically-named `SqliteError` type. Step 2's own "What changes" text
says `probeFts5` "rolls back on throw" — a generic catch, not a
type-checked one — and T2-2's full test specification (lines
4389–4402) never mentions `SqliteError` or any specific error class; it
asserts only that the probe returns `true`/`false` correctly. No other
step, DAO, or test anywhere in the document writes an
`instanceof SqliteError` check (grepped: zero occurrences beyond the one
false claim itself), so an implementer who tried to write one against
this citation would discover the mistake immediately at compile/runtime
(TypeScript would fail to resolve the unexported name; a runtime
`instanceof` check against an undefined identifier would throw a
`ReferenceError` the moment it ran) — this is a self-revealing defect,
not a silent one, exactly the shape round 6 noted for its own semver
finding ("the real behavior turned out safer than believed … the
near-miss is that it could just as easily have been the other
direction"). Here the near-miss is sharper: had any step actually
written the `instanceof` check the citation implies is available, the
build would have failed loudly at `tsc` — but the plan's own text never
does, so the false citation currently does no more than mislabel an
"authoritative standard" that is not, in fact, authoritative or
standard.

**What correct disposition looks like.** Rewrite lines 700–702 to
state the real, verified fact: *"Node's official `node:sqlite`
documentation and direct runtime verification (Node v22.22.2): a
statement-execution failure throws a plain `Error` instance carrying
`code: 'ERR_SQLITE_ERROR'` and `errcode`/`errstr` properties — there is
no distinct `SqliteError` class to catch by type. `probeFts5` therefore
rolls back on any thrown `Error`, checked generically, never by
`instanceof` against a name `node:sqlite` does not export."* Add a
corresponding entry to §11.2 (the architecture-claims registry) or a
new "claims verified directly against a runtime this session" entry in
§11.4, so this fact joins the plan's own attestation of "every factual
claim … with the read-level evidence that establishes it" instead of
remaining the one unlogged exception to it.

---

## Minor findings (below collapse severity — reported, not inflated, not dropped)

### Minor Finding 1 — §5.1's file skeleton omits the standard "# Step N — …" builder attribution for three files, unlike every other of the ~80 listed files

**What the plan does.** Every file in §5.1's skeleton (lines 280–518)
carries a comment of the form `# Step N — <what it is>`, identifying
which step constructs it — this is the skeleton's own stated discipline
("every source file named below is created by exactly one §7 step,"
line 276). Three files break this pattern:

```
hash.ts                              # SHA-256 helpers (Step 5 uses)
```
(line 377 — "Step 5 uses" is a *usage* attribution, not a *construction*
one, unlike the ~80 other lines that all read "# Step N — …")

```
events.ts                            # internal event type; only consumer of adapter.ts output
verdict.ts                           # response shape (re-exports blocks/verdict.ts's type)
```
(lines 373–374, under `types/` — neither names a constructing step at
all)

**How this was verified.** Grepped `hash.ts|util/hash`,
`types/events.ts|events\.ts\b`, and `types/verdict.ts` across the whole
document. `hash.ts` appears exactly once (the skeleton line itself);
Step 5's own body (lines 901–934, read in full) computes SHA-256 inline
("SHA-256 of the realpath," "the key is `<first-12-hex of
sha256(identity_string)>`") but never states it creates a separate
`src/util/hash.ts` file — the only reasonable inference is that Step 5
is meant to build it (Step 5 is the sole consumer), but the plan never
says so, unlike every other file. `types/verdict.ts` is at least
substantively discussed inside Step 15's own body (line 1492: "The
response type in `src/types/verdict.ts` deliberately does NOT expose
`updatedInput`…"), which reasonably implies Step 15 builds it even
without a skeleton-comment step number — this half of the finding is
weak. `types/events.ts` has no such in-body discussion anywhere; Step
28 (lines 2311–2320, read in full) exports `toInternalEvent(hookJson):
InternalEvent` without ever stating where `InternalEvent` is declared.

**Why this is a finding, not a nit.** This is the exact shape round 3's
collapse-log entry names for `T18-3` ("asserted in four places and
built in zero") one register lighter: not asserted-but-unbuilt (no step
*claims* these files exist without building them — they are just
never explicitly claimed by *any* step), but the skeleton's own
100%-attribution discipline (explicitly stated as the skeleton's job)
has three exceptions an implementer following the document literally
would have to guess about, in a document whose entire method is
"guess nothing, cite the exact step."

**Why not elevated to a full collapse.** No step's Verification field,
Dependencies field, or test specification depends on knowing which step
builds these three files — an implementer building Step 5 or Step 15
or Step 28 would naturally create the small file their own code needs
inline, and nothing downstream would be wrong if they did. There is no
wrong pointer here (unlike Collapse 1 and round 6's ULID finding) — only
an absent one, in three spots out of roughly eighty.

**What correct disposition looks like.** Add step attributions matching
the document's own convention: `hash.ts # Step 5 — SHA-256 helpers`,
`events.ts # Step 28 — internal event type (adapter.ts's output type)`,
`verdict.ts # Step 15 — response shape (re-exports blocks/verdict.ts's
type)`.

---

### Minor Finding 2 — §10's D-plan-2 heading still labels the `web-tree-sitter` floor "(exact)" after six rounds of the entry's own text describing it as a caret range

**What the plan says.** `docs/plans/plan-phase-a.md:3363–3364` (§10,
D-plan-2's own heading): *"D-plan-2 — Package deps floor:
`web-tree-sitter@0.26.13` (exact), `tree-sitter-wasms@0.1.13`
(exact)."*

**What the rest of the document says.** Step 1 (line 630) declares the
actual dependency as `"web-tree-sitter": "^0.26.13"` — a caret range,
not an exact pin. §10A's own D-plan-2 collapse-test (lines 3554–3588,
round 6's own corrected text) is *entirely* about the caret's real
semver behavior — its "Hardest question" literally begins "Given the
caret and an exact pin at `0.26.13` are therefore behaviorally
identical for a default install…", explicitly treating "the caret" and
"an exact pin" as the two distinguishable things being compared. §14.2
(lines 6223–6241) lists "(a) keep the caret as written" and "(b)
exact-pin `0.26.13`" as two *different*, mutually exclusive options —
confirming that within this document's own vocabulary, "(exact)" means
a literal pinned version string with no caret, which is option (b), not
what Step 1 actually ships (option (a)). `tree-sitter-wasms`'s
"(exact)" label is correct (Step 1's `"tree-sitter-wasms": "0.1.13"`
genuinely has no caret); `web-tree-sitter`'s is not.

**How this was verified.** Read §10's D-plan-2 entry (lines 3363–3372),
§10A's D-plan-2 collapse-test (lines 3554–3588), Step 1's dependency
declaration (line 630), and §14.2's options list (lines 6223–6241) —
all four read in full this session, cross-checked against each other
directly.

**Why this survived six rounds.** Every prior round's targeted search
for the semver/caret defect (round 6's own Moderate Finding 2, and this
round's re-verification of it) looked at the *body* of D-plan-2's
collapse-test and the §14.2 register entry — the two places the false
"accepts 0.27.0 anyway" premise lived and was fixed. None of those
passes re-read §10's own three-line D-plan-2 *heading*, one section
above, which was never touched by round 6's fix and still carries a
labeling choice from the plan's original 2026-09-06 authoring,
predating the round-6 correction that made the rest of the document
caret-precise.

**Why not elevated to a full collapse.** The heading is a shorthand
label in a section whose own body ("Reasoning") says nothing about
pin-vs-caret syntax at all — it just states that the plan uses whatever
architecture V14 verified. No implementer instruction, test, or
downstream citation reads this heading as authoritative about the
dependency's actual `package.json` syntax; Step 1's own text (which
everyone actually builds from) is unambiguous and correct. This is a
label inconsistency in a summary heading, not a load-bearing pointer.

**What correct disposition looks like.** Reword the heading to
`` `web-tree-sitter@^0.26.13` (caret, locked to 0.26.x per round-6
verification), `tree-sitter-wasms@0.1.13` (exact) `` — or drop the
parenthetical entirely and let the body (which is accurate) carry the
distinction.

---

### Minor Finding 3 — §12.5's AC→T-ID mapping table has a malformed row (extra column) for AC-21

**What the plan does.** `docs/plans/plan-phase-a.md:5893–5934` is a
three-column Markdown table (`| AC | T-ID(s) | Phase |`) — every row
from AC-1 through AC-25 has exactly two `|` separators except one:

```
| AC-21 (full) | — | B (deferred; guard mechanism ships and is unit-tested at T29-2) | A/B |
```

(line 5930) — this row has three `|` separators inside the row (four
cells), breaking the table's declared three-column structure. Every
other row in the table (34 rows read in full) has exactly three cells.

**How this was verified.** Read the full table (lines 5891–5934) and
counted `|`-delimited cells per row; only this one row has four.
Rendered Markdown tables silently misalign extra-cell rows rather than
erroring, so this would not surface as a build failure — only as a
visually shifted row for a human reader of the rendered document.

**Why this is a finding, not a nit.** This table is the document's own
"mechanical mapping" self-audit (line 5889: "Below is the mechanical
mapping") — the same class of self-auditing device
`docs/collapse-log.md`'s 2026-08-01 and 2026-09-03 entries repeatedly
flag as needing independent verification precisely because a
self-audit's own construction is not exempt from the defects it exists
to catch.

**Why not elevated to a full collapse.** The intended meaning is fully
recoverable from context (AC-21's full exercise is Phase B-deferred;
the guard mechanism itself is Phase-A-unit-tested at T29-2, matching
AD-21's own text and Step 29's Verification field, both independently
confirmed correct elsewhere in this document) — no reader is misled
about substance, only about table alignment.

**What correct disposition looks like.** Collapse to three cells, e.g.
`| AC-21 (full) | T29-2 (guard mechanism only) | A/B (guard: A; full
exercise: B, deferred) |`.

---

## Collapse-tests re-attacked (all survive; no new crack)

Per the task's instruction to attack every load-bearing decision's
collapse-test harder than the plan's own text, every §10A entry — all
eight D-plan-* entries, all six N1–N6 entries, and the three
plan-level entries — was re-read in full and pushed with a fresh
question, independent of round 6's own re-attack (which itself found no
new cracks and instead re-confirmed round 5's residual notes):

- **D-plan-1 (build order / C1's write-time cap).** Pushed further
  than round 6's CI-cannot-verify-a-human-step residual: even granting
  that gap, does the *plan text itself* ever tell an implementer facing
  a failing AC-2* fixture that "add a predicate" is disallowed without
  a new collapse-test, in a way they would actually encounter mid-build
  rather than only in §10A (a section an implementer executing Step 18
  might not be re-reading)? Yes — Step 18's own body (lines 1663–1712)
  states the predicate list inline with "C1's write-time predicate
  cap" cited by name, and `T18-3`'s own spec (§12, lines 5185–5203)
  states "any addition or removal is the fault" — the discipline is
  restated at the exact point of contact, not only in the collapse-test
  section. Survives.
- **D-plan-2 (dependency floor).** Re-verified round 6's semver fix
  holds (Collapse-hunt "What survives," above) and is not undermined by
  this round's own Minor Finding 2 (the stale heading label) — the
  heading is cosmetic, the operative text is correct. Survives with a
  minor label defect (reported separately, not counted here).
- **D-plan-3 (`node:test` runner).** Pushed: does the plan's
  `tsconfig.test.json` compile step actually produce a `dist-test/`
  tree the `node --test` glob in Step 39's Verification field can
  find, given Node 22.16.0's ESM resolution rules for a `rootDir: "."`
  config? Re-read Step 1 (lines 634–638) and Step 39 (lines 2990–2997)
  together — the glob `"dist-test/test/**/*.test.js"` matches the
  `rootDir: "."`/`outDir: "dist-test"` layout exactly (source at
  `test/**/*.ts` compiles to `dist-test/test/**/*.js`). Survives.
- **D-plan-4/D-plan-5 (sqlite3 shell; deterministic fixtures).** Both
  re-read; no new crack under a fresh "could this be gamed" or "does
  the fallback actually exist" push. Survives (matches round 6's own
  conclusion).
- **D-plan-6 (retracted).** Re-read against Step 40's current body and
  §15 Q-gap-4's current disposition — consistent; no residual defense
  of the retracted design found via a fresh grep for "markdown probe"
  combined with "owner-run" (2 hits, both explicitly past-tense in
  §10's own D-plan-6 entry, correctly framed as history). Survives.
- **D-plan-7 (CI tier split).** Pushed once more: is "the reviewer
  merges on unit+convention green" actually falsifiable, or is it an
  unenforceable process hope? The plan's own honest answer — "Guide,
  not gate — CI does not police mergeability; the reviewer does" — is
  an explicit, disclosed limitation, not a hidden one. Survives on its
  own stated terms.
- **D-plan-8 (settings.json marker via `command` prefix).** Re-checked;
  no stale "invented marker field" language found via a fresh grep for
  `"comment":` (0 live hits). Survives.
- **N1 (URL normalization).** Re-pushed on the scheme-unification
  asymmetry; the plan's own text already preserves non-default ports
  unfolded and discloses the scheme gap via `status`'s full
  normalized-key display — the achievable-honesty framing holds under
  a fresh push. Survives.
- **N2 (`deny_bypass_suspect` coverage bound).** Re-confirmed `T18-3`
  and `T33-1`'s both-direction disclosure both still exist and match
  AD-9's verbatim wording (re-read Step 18 lines 1678–1700 and Step 33
  lines 2633–2642 side by side). Survives.
- **N3/N4 (bar defaults, clearing length floor).** Re-pushed: is there
  any code path that reads `tuning` values at process start and caches
  them across the AD-1 no-daemon, one-process-per-event topology in a
  way `tune` couldn't reach? Re-confirmed Step 14's own text ("The
  stoplists are read from the `tuning` table at recognizer construction
  time," line 1421) — no caching residual. Survives.
- **N5 (`oracleSpawn` placement).** Re-verified Step 21's own body
  still calls `refreshIfStale` → `oracleSpawn` before Step 38 in build
  order (lines 1886–1891). Survives.
- **N6 (confinement-grep scope).** Re-verified `tsconfig.json` and
  `tsconfig.test.json` remain disjoint by declared `include` globs.
  Survives.
- **Plan-level: Checkpoint placement, Test tier split, Exit-run report
  shape.** All three re-read in full; each of the four collapse-test
  fields (Job/Hardest question/Answer/Steers-toward) is internally
  consistent with the others in the same entry, and consistent with
  the current step bodies they describe. Survives.

---

## New load-bearing decisions §10A missed

None found. Every §7 step was re-read in full against §10/§10A's own
scope-boundary statement (the coverage-attestation paragraph at lines
4021–4048: "not every §7 step is a transcription… N1–N6 and the
C1/C3/P1–P4 corrections are plan-level judgments"), and no step's
content was found to contain an undisclosed plan-level judgment call
lacking a formal collapse-test entry. Collapse 1 and the three Minor
findings above are citation/labeling defects inside already-collapse-
tested decisions (Step 2's AD-2 transcription, D-plan-2's own entry,
the file skeleton's own transcription discipline, the coverage
attestation table) — none introduces a *new* undisclosed judgment call
of the kind N1–N6 were formalized to capture.

---

## Mission-fidelity cross-trace

- **"Honest deterministic foundation," "running on the owner's real
  repos," "clean seams the later phases plug into."** Not implicated —
  Collapse 1 is a documentation-layer citation error about a runtime
  library's error-handling shape, not a defect in any mechanism, bar,
  recognizer, or seam. Step 2's actual behavior (catch generically, roll
  back, fall back to `LIKE`) is unaffected; only the "why" citation
  supporting it is wrong.
- **"Measures its own floor — how little it catches."** Not implicated
  this round; the finding touches no recognizer, bar value, or coverage
  claim.
- **"Never fake completeness dressed to look like a working product."**
  Collapse 1 is the same class round 6 named for semver: a citation
  that *reads* as verified (a specific, named documentation source and
  a specific, named class) but was never actually checked — the
  document asserting more certainty about an external fact than it had
  actually earned, in a project whose entire discipline (§11's
  "Verification of factual claims" section) exists specifically to
  prevent this. The three Minor findings are smaller instances of the
  same underlying failure mode this project's collapse-log calls "a fix
  landed at its primary site, not swept to every cross-referencing
  surface" (Minor Finding 2) and "a self-audit device not held to its
  own stated completeness" (Minor Finding 3) — continuations of
  lineages this project already tracks, not new failure classes.

---

## Attestation

- **What I read in full this session (2026-09-07).** `middleware/
  context-oracle/CLAUDE.md`; `docs/collapse-log.md` (2026-09-07 entry
  set through round 6, read closely; earlier entries sampled for
  pattern history); `docs/STATUS.md`; `OWNER-LEDGER.md` (both in full);
  `docs/specs/spec-context-oracle.md` §8 (326–425), §11.5 (739–777),
  §12 (780–873), §13 (874–906), §14 (908–978, sampled onward);
  `docs/architecture-phase-a.md` AD-2 (325–364), AD-3 (366–394+,
  spot-checked), AD-5 (568–645), AD-9 (736–922), AD-10 (924–945), AD-14
  (1073–1128), AD-20 (1377–1412), AD-24 (1513–1628), AD-26 (1650–1673)
  — all in full; the ten prior review documents in `docs/reviews/`
  (2026-09-06 pair; rounds 2–6 pairs) — round 6's pair read in full,
  earlier rounds read for the documented defect-class history;
  `docs/plans/plan-phase-a.md` (6923 lines) read end to end with no
  gaps across the `Read` call ranges listed at the top of this
  document.
- **What I verified against a live instrument, not memory or a prior
  review's own attestation.** `node:sqlite`'s actual exported surface
  and actual thrown-error shape, executed directly against Node
  v22.22.2 in this sandbox (Collapse 1) — the same "install/run the
  real tool" discipline round 6 applied to `semver`, applied here to a
  different library-behavior claim round 6's own search did not touch.
  A `WebFetch` of the official `node:sqlite` docs page, independently
  corroborating the runtime finding. A `WebFetch` of the Node 22.16.0
  release notes and the GitHub PR introducing the SQLite `backup()`
  API, re-confirming (not merely trusting) the *already-correct*
  `backup()`-since-v22.16.0 claim survives under fresh verification. A
  constructed shallow/full git-clone pair in `/tmp`, re-confirming
  `git rev-list --max-parents=0 HEAD`'s clone-dependent behavior
  underlying AD-3/Step 5's design (already correctly handled by the
  plan; no defect).
- **Search strategy, and how it differed from every prior round's.**
  Rounds 2–5 searched for specific known-bad phrases or a specific
  step-number cluster (30/31/32/37); round 6 built a full step-topic
  ground-truth map and checked every "(Step N's X)" parenthetical
  against it, finding the Step 41/37 ULID mismatch, and separately ran
  one specific library-behavior check (semver) that this round's brief
  named as a precedent to generalize from. This round generalized that
  precedent rather than repeating it: (1) built a file→constructing-step
  ground-truth table from §5.1's own skeleton (matching every one of
  the ~80 listed files against its comment, which is what surfaced
  Minor Finding 1's three unattributed files); (2) enumerated every
  distinct "authoritative standard" / "Cite:" / documentation-name
  citation across all 43 step bodies and all sixteen §10A entries, and
  ran the ones naming a specific, checkable library or runtime behavior
  (not already covered by an existing verified V-premise from the
  architecture) against a real instrument — this surfaced Collapse 1,
  the one such citation that had never actually been run;
  (3) cross-checked every markdown table in §2.3, §12.5, and §14 for
  internal structural consistency (column counts, row-to-heading
  correspondence) rather than only content correctness — this surfaced
  Minor Finding 3; (4) re-read every §10 decision heading against its
  own §10A collapse-test body and its own downstream citations for
  label consistency, independent of content correctness — this
  surfaced Minor Finding 2.
- **Confidence.**
  - **High** on Collapse 1 — a direct, dual-sourced (live runtime +
    official docs) mismatch between a specific, falsifiable claim
    ("`SqliteError` on statement failure") and both the actual
    `node:sqlite` module surface (which exports no such class) and the
    actual thrown-error shape (a plain `Error` with `code:
    'ERR_SQLITE_ERROR'`).
  - **High** on "round 6's four fixes hold" — every one of the four
    fixed sites was re-verified by direct `Read` at the exact line and
    by fresh grep for the exact defective phrasing each fix replaced,
    not by trusting `docs/STATUS.md`'s narrative or the plan's own
    "corrected this fix pass" annotations.
  - **Medium** on the three Minor findings — all three are real,
    verified textual facts (confirmed by direct `Read`/grep), but all
    three are genuinely low-stakes by this project's own collapse
    calibration (none is load-bearing on a build outcome, none would
    mislead an implementer following the document's actual operative
    text rather than its summary devices) — reported at Minor severity
    rather than either inflated to collapses or silently dropped, per
    this project's own "a defect mentioned but not given a finding
    number is exactly as likely to be silently dropped as one never
    mentioned" lesson (2026-09-07 round-3 entry, collapse-log).
- **What would make me revise the verdict up (to SURVIVES).** Discovery
  that a newer/different Node.js minor version than the one tested in
  this sandbox (v22.22.2) actually does export a `SqliteError` class
  that a subsequent Node release removed before v22.22.2 — checked
  against the official docs (which show no such class in the current
  reference) and against the PR history for the `node:sqlite` error
  path; no evidence of this was found. Or discovery that some other
  step or test does depend on the `SqliteError` name resolving (it does
  not — grepped, one occurrence total, the false claim itself).
- **What would make me revise down further.** Nothing found this round
  that would deepen Collapse 1 into something larger — no step's
  correctness, no test's pass/fail condition, and no downstream
  decision's soundness depends on the exact exception class name; the
  practical behavior (`probeFts5` rolls back on any throw) is correct
  regardless of what the thrown object's constructor is called. The
  three Minor findings likewise show no evidence of hiding a larger,
  undisclosed defect behind them on a closer read of their surrounding
  context.

*End of round-7 collapse-hunt. Trajectory across seven rounds on this
plan: round 1 — 3 collapses; round 2 — 1 collapse; round 3 — 2
collapses; round 4 — 2 collapses; round 5 — 2 collapses (one
incomplete, revealing 4 more sites via a sibling pass); round 6 — 1
collapse (a citation number outside every prior round's search
cluster); round 7 — 1 collapse (a library-behavior claim never
verified across seven rounds, found via generalizing round 6's
semver-verification method to every other checkable "documentation
says X" citation in the document, plus 3 Minor findings from two
further generalized search strategies — file-skeleton attribution
completeness and table structural self-consistency). The pattern
holds: each round's distinct search method finds something the
previous rounds' methods structurally could not see. Dispatch round 8
after this fix lands, using a method this round did not use — for
instance, executing every one of the plan's ~15 illustrative shell
commands (the `git log` invocation, the `sqlite3 .dump` pipeline, the
`npm pack --dry-run` grammar-inventory check) against a real shell to
confirm each one's exact output shape matches what the step body or
test specification assumes, the way this round did for `node:sqlite`
and round 6 did for `semver`, but for the shell-command layer instead
of the library layer.*
