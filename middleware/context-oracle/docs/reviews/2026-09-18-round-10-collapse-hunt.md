# Round 10 — Independent collapse-hunt of the quote-aware numstat tokenizer in `docs/plans/plan-phase-a.md`

**Date:** 2026-09-18
**Artifact under review:** the round-10 change to `docs/plans/plan-phase-a.md`
plus the file it modifies and the file it adds —
`docs/plans/plan-phase-a.probes/28_git_numstat_cunquote.mjs` (+ its
`expected/…txt`) and the new `docs/plans/plan-phase-a.probes/29_git_numstat_tokenize.mjs`
(+ its `expected/…txt`) — diffed against `cf2d63e`.
**Baseline:** `cf2d63e` (the round-8 checkpoint whose miner classified a
`--numstat` field by flat `begins-with-"` / `contains ' => '` string tests).
The intervening `e9a3877` is the change under review.
**Nature:** An independent adversarial collapse-hunt under
`middleware/context-oracle/CLAUDE.md` dominating rule 2 — a fresh reviewer who
did not author this change, attacking each load-bearing decision's hardest
question and hunting for new ones. Every load-bearing git behavior below was
executed by me in this environment (git 2.43.0 — the version §11.4 names — and
Node v22.22.2) and is pasted verbatim. The plan's prose, the recorded probe
expectations, and STATUS's "resolved, not open" / "confirming pass" framing were
**not** accepted as evidence until I reproduced them.
**Standards this review evaluates against:** the changed step's own named
sources — `AD-13` (miner: each unresolved field "recorded … never guess"),
`T-13-1`'s own named technique (**equivalence partitioning over "path
encodings"** and over "the quote/rename collision", `:7890–7891`), dominating
rule 1 (never claim a branch works without the input that exercises it),
dominating rule 3 (the Phase A goal governs — *does this serve the goal?*), and
the Phase A goal itself (spec §11.5 / `STATUS.md`: an **honest** deterministic
floor that measures "how little it catches", "never fake completeness dressed to
look like a working product").

---

## What the change is

Round 9's collapse-hunt (`docs/reviews/2026-09-18-round-9-collapse-hunt.md`,
M1) showed the round-8/round-9 decode rule specified flat string tests
(`begins-with-"`, `contains ' => '`) that cannot separate a **quoted rename**
(`"back\\slash.txt" => plainname.txt`, CASE D) from a **quoted single path whose
name holds ` => `** (`"a => b\tc.txt"`, CASE C), and made a completeness claim
those tests do not support. Round 10 (`e9a3877`) implements round 9's "keep
decode" fix:

1. **Step 13 prose (`:2134–2169`)** is re-derived as **quote-aware
   tokenization**: a token opens at an unescaped `"` and runs to its closing
   unescaped `"`; ` => ` (or a `{ … => … }` brace group) is a rename separator
   **only outside** a quoted token; each quoted identity is C-unquoted to raw
   bytes and **UTF-8-decoded to the string key** the indexer's `readdir` walk
   uses. It rests this on an executed claim: "**whenever any identity needs
   quoting git emits the full `"old" => "new"` form … and never the brace
   form**" (`:2145–2148`).
2. **`probe:28`** gains a **newline** class (`ne\nwl.txt`) and a **mixed**
   non-ASCII+tab class (`café\tx.txt` → `caf\xe9\x09x.txt`), and now compares
   **UTF-8-decoded strings** on both sides — closing round-9 m2 (newline
   unexercised) and m3 (bytes-vs-string).
3. **`probe:29` (new)** plants CASE C and CASE D plus a plain and a brace
   rename, and asserts `CASE_C=single CASE_D=rename plain=rename brace=rename`.
4. **T-13-1 Data / Fails-when (`:7886–7946`)** plant CASE C, CASE D, the newline
   plain-add, and keep the multi-arrow `x => y.txt` as the
   `miner_unparsed_numstat` input.
5. **The catalog entry (`:1354–1358`)** and **Q56 (`:9938–9956`)** are rewritten
   to match.

---

## What I executed (load-bearing)

### The two probes under review both reproduce exactly

```
$ node 28_git_numstat_cunquote.mjs
readdir keys:  a\x5cb.txt  caf\xe9\x09x.txt  caf\xe9.txt  ctrl\x01x.txt  ne\x0awl.txt  plain.txt  q"z.txt  ta\x09b.txt
c-unquoted:    a\x5cb.txt  caf\xe9\x09x.txt  caf\xe9.txt  ctrl\x01x.txt  ne\x0awl.txt  plain.txt  q"z.txt  ta\x09b.txt
invertible (decoded == readdir keys): true
```
— byte-identical to `expected/28_git_numstat_cunquote.txt`.

```
$ node 29_git_numstat_tokenize.mjs
CASE_C: field="a => b\tc.txt"
  ids=1: a => b\x09c.txt
CASE_D: field="back\\slash.txt" => plainname.txt
  ids=2: back\x5cslash.txt | plainname.txt
plain: field=p.txt => q.txt
  ids=2: p.txt | q.txt
brace: field=src/{utils => other}/c.txt
  ids=2: src/utils/c.txt | src/other/c.txt
rename iff exactly one unquoted " => ": CASE_C=single CASE_D=rename plain=rename brace=rename
```
— byte-identical to `expected/29_git_numstat_tokenize.txt`.

### The pivotal claim is TRUE — I attacked it with the case the probe omits

The whole tokenizer rests on: *whenever any identity needs quoting, git emits the
full `"old" => "new"` form (each identity quoted independently) and never the
brace form.* `probe:29`'s CASE D (`back\slash.txt` → `plainname.txt`) does **not**
actually exercise this: those two paths share no common prefix/suffix, so git
would emit the full form regardless of quoting — the probe never forces git to
choose between a brace form and a full form. I supplied the missing case: a
rename whose sides **do** share a prefix (so the brace form is the natural
output) **and** need quoting.

```
=== shared prefix, BOTH sides need quoting (tab) ===
0	0	"src/a\tb.txt" => "src/c\td.txt"          # full form, each side quoted; NOT src/{...}
=== shared prefix + suffix, only NEW side needs quoting (tab) ===
0	0	d2/plain.txt => "d2/na\tme.txt"           # full form, sides quoted independently
=== shared prefix, new side quoting ===
0	0	p/old/f.txt => "p/new/f\tx.txt"           # full form, NOT a brace group
```

The claim holds under the exact adversarial input the probe does not carry: git
falls back from the brace form to the independently-quoted full form the moment
any identity needs quoting. **This decision survives.** (I note only that the
probe's *evidence* for "never the brace form" is indirect — see the closing
note; it is not a finding, because the behavior is true.)

### The tokenizer's rename/single classification — where it breaks

`probe:29`'s summary line asserts the rule "rename iff exactly one unquoted
` => `", and Step 13 states it as fact: "a field with no such separator is a
single path, **a field with exactly one is a rename** expanded to its two
identities" (`:2154`). I asked the hardest question a mission-literate skeptic
asks: *how does the miner know an unquoted field with exactly one ` => ` is a
rename, and not a single real file whose name contains ` => `?* git's
`--numstat` does not quote a filename unless it holds a quote-forcing byte, and
` `, `=`, `>` are none of them — so a real file named with ` => ` is emitted
**unquoted**, identical to a rename:

```
=== a single, NON-renamed file 'a => b.txt' modified with anchor (miner runs -M) ===
$ git -c core.quotePath=false log --grep modboth -1 --numstat -M --format=
1	1	a => b.txt
1	1	anchor.txt
```

The field `a => b.txt` for a real single file is byte-identical to the field a
rename `a` → `b.txt` would produce. I then ran the tokenizer from `probe:29`
verbatim on it:

```
"a => b.txt"          => kind=rename  ids=["a","b.txt"]
"x{a => b}y.txt"      => kind=brace   ids=["xay.txt","xby.txt"]
"x{a}.txt => y{b}.txt"=> kind=brace   ids=["xa}.txt.txt","xy{b.txt"]
```

and confirmed git actually emits each of those three real objects in the shape
that triggers it:

```
=== real single file literally named 'x{a => b}y.txt' (no quote-forcing byte) ===
1	0	x{a => b}y.txt
=== rename 'x{a}.txt' -> 'y{b}.txt' (literal braces, no common affix) ===
0	0	x{a}.txt => y{b}.txt
=== real single file 'a => b.txt' ===
1	0	a => b.txt
```

So a **real, single, non-renamed file** `a => b.txt` is silently split into two
non-existent co-change identities `a` and `b.txt`; the real file never appears in
`cochange_pairs`; **no diagnostic is recorded.** The brace variants are worse:
`x{a => b}y.txt` (a real file) becomes the phantom pair `xay.txt`/`xby.txt`, and
even a genuinely-recoverable rename `x{a}.txt => y{b}.txt` is mangled into
garbage `xa}.txt.txt`/`xy{b.txt`, because `resolve()` tries `braceExpand` before
the arrow split.

---

## The core decision — collapse test (does NOT cleanly survive)

- **Its job (one sentence, mission terms).** Turn each `git log --numstat` field
  into the exact on-disk file identity/identities that the co-change substrate —
  the discovery data Phase B and the regression fixtures are built from — is
  keyed on, so a fact about which files change together is never silently
  attached to a filename that does not exist.
- **Hardest question a skeptic asks.** *An unquoted field with one ` => ` is
  ambiguous — a rename `a`→`b.txt` and a real file `a => b.txt` are byte-identical
  in `--numstat`. On what authority does the miner call it a rename?*
- **The plan's answer.** None with a citation. `:2154` asserts "exactly one is a
  rename"; `:2165–2169`, `:1354–1358`, and Q56 `:9950–9952` assert the **one**
  unresolvable field is "a **multi-** ` => ` field that no single split turns
  into one rename." Execution falsifies that: a **single**-arrow unquoted real
  file is equally unresolvable, and is guessed (toward rename), not recorded.
- **What it steers the agent toward.** A silent, unmeasured phantom pair —
  the S1 silent-mis-key class this seam has spent ten rounds hardening, and the
  "fake completeness" dominating rule 3 forbids. This is the collapse.

---

## Findings

### M1 (Moderate) — The tokenizer guesses that any single unquoted ` => ` (or brace group) is a rename; a reachable real file is silently mis-keyed, and the plan asserts a completeness that execution falsifies

**Location.** Step 13 prose `:2154` ("a field with exactly one is a rename") and
the completeness claim `:2165–2169`; the `miner_unparsed_numstat` catalog entry
`:1354–1358`; Q56 `:9950–9956`; T-13-1 Data/Fails-when `:7915–7918`, `:7944–7946`
(under the technique claim "equivalence partitioning over … path encodings",
`:7890–7891`, `:7920–7921`).

**The claim under attack.** Read together, four passages assert the tokenizer
resolves every field except one narrow class: "a field with exactly one [unquoted
` => `] is a rename" (`:2154`); "The one field the miner cannot resolve is a
**fully unquoted** field whose `{`, `}`, or ` => ` cannot be told apart from git's
rename syntax — a multi-` => ` field that no single split turns into one rename;
that alone is skipped" (`:2166–2169`); the catalog entry restates it
(`:1354–1358`); Q56 says "only a **fully unquoted** field whose `{`, `}`, or
` => ` cannot be told apart from rename syntax (a multi-arrow field) is recorded
as `miner_unparsed_numstat`, **never guessed**" (`:9950–9952`).

**What breaks it (executed, above).** git emits a real, single, non-renamed file
named `a => b.txt` as the unquoted field `a => b.txt` — byte-identical to the
field a rename `a`→`b.txt` produces (executed with `-M`, which the miner runs,
`:2124`). This is irreducibly ambiguous in `--numstat`. The plan's own broad
clause names it exactly — "a fully unquoted field whose … ` => ` cannot be told
apart from git's rename syntax" (`:2166–2167`) — but the narrowing "a
multi-` => ` field" (`:2167–2168`) and the algorithm (`:2154`) exclude it and
resolve it **as a rename**, producing the phantom identities `a` and `b.txt` with
**no diagnostic**. The brace variants (`x{a => b}y.txt` → phantom pair;
`x{a}.txt => y{b}.txt` → garbage identities via `braceExpand`-before-arrow
ordering) are the same root: a fully-unquoted field carrying a literal `{`, `}`,
or ` => ` is indistinguishable from rename syntax, and the plan guesses instead
of recording.

**Why it matters (and why it is Moderate).** This is the exact S1-class silent
mis-key the seam has hardened for ten rounds, reappearing on the **unquoted**
partition that round 10's fix left uncovered while it closed the quoted partition
(CASE C/D). The miner's output is the Phase B / regression-fixture discovery data
(dominating rule 3): a silent phantom pair is "faked machinery [that] poisons the
data the rest of the build reads," and Phase A's goal is an **honest** floor that
*measures* what it misses, not one that guesses and calls the guess complete. The
honesty regression is precise: the plan makes an **executable completeness
assertion** ("the one field …"; "never guessed") in four places, and my
execution falsifies it; T-13-1's named technique claims the path-encoding /
quote-collision partition is "honestly populated" (`:7890–7891`) while the
discriminating partition — a fully-unquoted single file whose name holds ` => ` —
is neither planted nor asserted, and its `Fails when` clause covers only the
**multi-arrow** `x => y.txt` (`:7944–7946`).

It is **Moderate, not Serious.** On Max Cogar's real corpus a filename literally
containing ` => ` (space-arrow-space) is uncommon, so the practical blast radius
on the Phase A test-bed data is small; the fix is a localized
documentation-plus-flag change, not a pipeline redesign; and "resolve toward
rename" is a defensible heuristic (renames vastly outnumber such filenames). It is
**more than Minor** — the same reasoning round 9 used to reject Minor for the
adjacent quoted case — because the change (a) makes an explicit, executable
completeness claim that execution falsifies, (b) re-instates the S1 silent
mis-key with **no** diagnostic (a regression in honesty relative to the round-8
skip, which at least routed leading-`"` fields to a visible floor count), and (c)
leaves the discriminating partition unplanted while asserting the partition is
honestly populated. It is strictly **more reachable** than round 9's Moderate M1,
which additionally required a quote-forcing byte; this case requires none.

**What correct looks like (either closes it).**
- *Flag it (honest floor):* stop restricting the unresolvable set to
  "multi-arrow." A fully-unquoted field carrying a literal `{`, `}`, or ` => `
  that the miner cannot verify against a real index key is equally unresolvable
  and must be recorded as `miner_unparsed_numstat`, never split. Plant in T-13-1
  a **single, non-renamed** file literally named `a => b.txt` with a `Fails when`
  clause asserting it is recorded (or counted under its literal name), **not**
  split into a phantom `a`/`b.txt` pair; do the same for the literal-brace
  single-file case, and fix (or fold into the unresolvable set) the
  `braceExpand`-before-arrow ordering that mangles `x{a}.txt => y{b}.txt`.
- *Documented heuristic:* keep "resolve single-arrow to rename," but demote the
  completeness language from certainty to an explicit, sourced `[D-plan-n]`
  decision stating the heuristic, its rationale, and how the residual is measured
  (e.g. a diagnostic when a resulting identity matches no index key), so the
  "never guessed" / "the one field" claims are corrected and the honesty gap
  closes even though the guess remains.

**Classification.** Moderate. **Provenance.** Recurring — the S1 silent-mis-key
class, re-opened on the successor tokenizer for the **fully-unquoted**
` => `-in-filename partition; the direct continuation of round-9 M1 (which closed
the *quoted* partition) onto the partition its fix did not reach.

---

## Decisions I attacked and could not break (executed evidence)

- **"git emits the full `"old" => "new"` form, never the brace form, whenever any
  identity needs quoting" (`:2145–2148`, `probe:29`).** TRUE. I forced the case
  the probe omits — a rename with a shared prefix/suffix *and* a quote-forcing
  byte — and git emitted `"src/a\tb.txt" => "src/c\td.txt"`,
  `d2/plain.txt => "d2/na\tme.txt"`, `p/old/f.txt => "p/new/f\tx.txt"` — full
  form, each side quoted independently, no brace group. The tokenizer's premise
  that a rename ` => ` always lies outside any quoted token holds.
- **"C-quoting is a total, invertible encoding; C-unquote then UTF-8-decode
  equals the `readdir` key string" (`:2155–2164`, `probe:28`).** TRUE and now
  honestly exercised, including the **mixed** non-ASCII+tab class
  (`café\tx.txt`), which git octal-escapes per byte — proving the compare must be
  on the decoded string, not raw bytes (closes round-9 m3). `invertible … : true`.
- **"a newline in a name is emitted as the two ASCII bytes `\n`, so the numstat
  line never carries a raw newline and line-splitting is safe" (probe 28
  comment).** TRUE — probe 28's `ne\nwl.txt` decodes on a single output line;
  line framing intact (closes round-9 m2).
- **Quote-aware handling of CASE C / CASE D (`:7901–7910`, `probe:29`).** TRUE:
  `"a => b\tc.txt"` → one path; `"back\\slash.txt" => plainname.txt` → two
  identities. The escape-skip inside quoted tokens also correctly treats an
  embedded escaped `\"` (a filename containing a literal quote) as content, not a
  token boundary. Round-9 M1 is genuinely closed for the quoted partition.

---

## The plan's own tooling

I did not re-run the full `derive-plan-sections.mjs`/`run-plan-probes.mjs` gate
suite (mechanical-gate greenness is not the collapse-hunt's charge and STATUS
reports it green on this revision); I verified the two load-bearing probes
directly, above, byte-for-byte against their recorded expectations.

---

## Verdict

**NEEDS FIXES — one Moderate (M1).** Round 10 is a genuine, well-executed
advance: it closes round-9 M1 for the **quoted** quote/rename collision with a
real quote-aware tokenizer, and closes round-9 m2 and m3, all of which I
reproduced. The pivotal claim it rests on — git never emits a brace form when any
identity needs quoting — is true, and I confirmed it with the adversarial case
the probe itself omits. But the tokenizer's rule "a single unquoted ` => ` is a
rename" is a **guess** on an irreducibly ambiguous field: a real, single,
non-renamed file literally named `a => b.txt` is emitted by git identically to a
rename and is silently split into two phantom co-change identities with no
diagnostic, while the plan asserts in four places that the **only** unresolvable
field is a multi-arrow one and that everything else is "never guessed." That is
the S1 silent-mis-key class re-instated on the unquoted partition and a
completeness claim execution falsifies — Moderate, by parity with round-9 M1.
Close it by either recording the fully-unquoted structural-marker field as
`miner_unparsed_numstat` (and planting the single-file `a => b.txt` case in
T-13-1) or demoting the "never guessed"/"the one field" language to an explicit,
sourced, measured heuristic.

---

### Closing note (not a finding)

`probe:29`'s CASE D shares no common affix, so it does not force git to choose
between the brace and full forms — the probe's evidence for "never the brace
form" is therefore indirect. The behavior is nonetheless true (I executed the
forcing case above). If a future round wants the probe to *carry* its own
load-bearing evidence, add a shared-prefix quoted rename
(`"src/a\tb.txt" => "src/c\td.txt"`) to `probe:29`.
