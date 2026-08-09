# Expert Review — expert-plan output contract: derived sections become generated

Round 1 (first review of this change). Reviewer: independent subagent, 2026-08-08.
Persisted verbatim by the session that received it; persistence is the only edit.

## Scope and Inventory

**Instruments available:** Read, Grep, Bash (git, Node v22.16.0), Clear Thought. Context7 not needed — the script has zero third-party dependencies (verified: only import is `node:fs`, `derive-plan-sections.mjs:34`), so there is no library-behavior claim category in scope and no halt condition under Step 3.

**Claim-type mapping:** behavioral claims about the script → executed fixture runs (probes A–I, in the session scratchpad); literal-content claims → Read at file:line; absence claims → grep with query and count; platform claims → `git config` plus byte-level line-ending counts.

| File | Status | Verification |
|---|---|---|
| `claude-plugins/expert-dev-tools/skills/expert-plan/references/output-contract.md` | [x] | Read via full `git diff HEAD`; line endings counted (116 CRLF, 0 bare LF) |
| `claude-plugins/expert-dev-tools/skills/expert-plan/scripts/derive-plan-sections.mjs` | [x] | Read 1–211 in full; executed in 9 fixture probes |
| `claude-plugins/expert-dev-tools/docs/SKILL-CHANGELOG.md` (entry 6) | [x] | Read via `git diff HEAD`, lines 236–288 |
| `git show 94a640a:…/output-contract.md` (baseline) | [x] | Read via diff |
| `claude-plugins/expert-dev-tools/docs/HANDOFF.md` | [x] | Read 1–123 |
| `claude-plugins/expert-dev-tools/skills/expert-plan/SKILL.md` | [x] | Grep `derive-plan-sections\|step-decl\|output-contract\|generated:` — 5 hits, all pre-existing `output-contract.md` references, 0 hits for the script or the declaration format |
| `claude-plugins/expert-dev-tools/docs/plans/plan-expert-dev-tools-behavioral-remediation.md` | [x] | Grep `step-decl` → 0; byte count 2319 CRLF / 0 bare LF |
| 3 mirror copies of `expert-plan/references/output-contract.md` | [x] | Existence probe: all three paths named in the changelog exist |

`docs/investigate.md` was consulted as context only; no finding rests on it. No rigor waivers — no compression was requested.

## Summary

**This review returns NEEDS_FIXES.** The design direction is right and is the change the previous contract explicitly predicted for itself: converting hand-maintained restatements into generated regions is the correct response to a drift class that three review rounds of maintenance discipline failed to converge. The contract prose is careful, it draws the generated/authored line explicitly, and it makes the new gate binary. The problem is the implementation and the change's boundary conditions. The script is a validation gate whose value is failing closed, and it fails open in several distinct ways — most seriously, it cannot ever return exit 0 on a CRLF file, which is what every file in this repository is. The mandatory Gate C item this change adds is therefore currently unsatisfiable on the platform where the plugin is developed.

## Upstream Contract Verification

No formal spec or architecture document governs this change. The binding upstream artifacts are the owner ruling in `docs/HANDOFF.md` and the prior contract's own stated closure condition.

| Upstream requirement | Status | Verification method |
|---|---|---|
| Owner ruling: the drift surfaces "have to be converted, not swept harder" (`HANDOFF.md:71`) | Honored | Read `HANDOFF.md:66–71`; the change converts §2 and §5 to generated regions |
| `HANDOFF.md:120–123`: "adding a machine-readable step declaration … from which §2, §5 and §12 are generated" | Partially honored | Read the diff: §2 and §5 become generated regions; §12 is **not** generated — it becomes a *cross-checked* authored section. A defensible narrowing (test specs are judgment-bearing prose), but the contract nowhere states that §12 was deliberately handled differently from the closure condition it answers. See F-9. |
| Owner authorization dated 2026-08-08 | Present | Read `SKILL-CHANGELOG.md` entry 6, quoted authorization |
| Prior contract's self-prediction (`git show 94a640a`, final paragraph of the drift-sites section) | Honored | Read baseline via diff |

## Critical & Serious Findings

### F-1 (Critical) — `--check` can never exit 0 on a CRLF file, and every file in this repo is CRLF

**What the code does.** `derive-plan-sections.mjs:186` writes generated regions with hard-coded LF (`` `$1\n${body}\n$2` ``, and `body` is built with `.join('\n')` at lines 153 and 173). The staleness test at line 187 is a strict string comparison, `next !== updated`.

**How verified.** Probe D, executed. A CRLF fixture (43 CRLF, 0 bare LF): `--check` → `STALE`, exit 1. Regenerate → file becomes 33 CRLF / 10 bare LF (mixed). Re-normalize to CRLF, as `git checkout` under `core.autocrlf=true`, most Windows editors, and Prettier all do → `--check` returns `STALE`, exit 1 again. The cycle does not converge. Platform premise verified independently: `git config --get core.autocrlf` → `true`; `plan-expert-dev-tools-behavioral-remediation.md` measures 2319 CRLF and 0 bare LF; the contract file itself measures 116 CRLF and 0 bare LF. Git emitted "LF will be replaced by CRLF" warnings on these exact files at the start of this session.

**Standard violated.** Idempotence of a generator — a code generator must reach a fixed point such that regenerate-then-check is a no-op (the defining property of every `--check`/`--dry-run` mode in the ecosystem: `gofmt -l`, `prettier --check`, `terraform fmt -check`). A generator that never reaches a fixed point converts a mandatory gate into a permanent failure.

**Why it matters.** The new Gate C item states "`scripts/derive-plan-sections.mjs --check` exits 0 against the delivered document… A plan delivered without a passing check is non-compliant regardless of how its tables read." On this repository, no plan can satisfy that. The predictable outcome is that the gate gets waived in practice, which returns the drift class to exactly where it was — with the added cost that authors now believe a machine is checking.

**Correct implementation.** Detect the document's dominant line ending once after the read and emit the region body with it: `const eol = /\r\n/.test(text) ? '\r\n' : '\n';` then use `eol` in both `join()` calls (lines 153, 173) and in the replacement at line 186.

---

### F-2 (Systemic) — the parser fails open: three distinct malformed declarations are accepted silently and silently drop entries from the completeness tables

**Enumeration of fail-open sites.** I read the parse loop (`derive-plan-sections.mjs:83–105`) and `parseList` (65–74) in full and classified every branch as fail-closed (pushes to `errors`) or fail-open. Fail-closed: line 70 (non-inline list form), 96 (unknown top-level key), 100 (unparseable line), 104 (missing required key), 107 (bad step ID). Fail-open — three sites, all confirmed by execution:

1. **`files:` with an inline value discards it silently.** Line 95 sets `inFiles = true` and never inspects `val`. Probe F, executed: a declaration containing `files: {create: [zzz.js]}` produced **no error**, and regeneration emitted an empty files table — `zzz.js` vanished. The `files` key is present, so line 104's required-key check passes.
2. **A duplicate key silently overwrites.** `seen` (line 82) is a `Set` used only for presence, never for duplicate detection; lines 91–95 assign unconditionally. Probe F, executed: a declaration with both `covers: [R-1]` and `covers: [R-2]` produced no error and a coverage table containing only `R-2`. `R-1` was silently dropped from the section whose stated purpose is that "every element of the requested work" is mapped.
3. **Commas inside a path or ID split it into two entries.** `parseList` line 73 splits unconditionally on `,`. Probe I, executed: `modify: [src/my, file.js]` produced two table rows, `src/my` and `file.js` — neither of which is a real file.

**Standard violated.** Fail-closed validation (the design contract of every schema validator: unrecognized or ambiguous input is rejected, not coerced). Reinforced by the contract's own framing — it declares the declaration "the single source of truth for the derived surfaces," which is only true if the parser refuses input it cannot faithfully represent.

**Why this is systemic rather than isolated.** All three sites share one failure shape: the parser silently under-reports into a table whose sole purpose is completeness. That is the worst possible direction for this tool to fail. The changelog asserts `--check` exits non-zero on "a malformed/incomplete declaration" — instance 1 is a counterexample to that claim, verified by execution.

**Correct implementation.** Reject rather than coerce at all three sites: error if `files:` carries a non-empty value; error on any repeated key (`if (seen.has(key)) errors.push(...)` before `seen.add`); and either require quoting for entries containing commas or forbid commas in identifiers and error when one appears.

---

### F-3 (Serious) — `script plan.md --check` silently rewrites the artifact and exits 0

**What the code does.** `derive-plan-sections.mjs:42–43` reads the mode from `args[0]` only: `const checkMode = args[0] === '--check'; const planPath = checkMode ? args[1] : args[0];`. With arguments in the other order, `checkMode` is false, `planPath` becomes `plan.md`, and `--check` is silently ignored.

**How verified.** Probe A, executed. A fixture with deliberately stale regions, invoked as `node derive-plan-sections.mjs a.md --check`: md5 before `9ca66a52…`, after `b28b1bda…`, stdout `regenerated: coverage (2 steps)`, **exit 0**.

**Standard violated.** Fail-closed validation, and the GNU/POSIX convention that option flags are position-independent relative to operands. A read-only verification mode that becomes a write mode on a flag-position slip violates the least-astonishment property `--check` modes exist to provide.

**Why it matters.** This is the gate defeating itself in the most damaging way available. A reviewer running the mandatory Gate C check in the natural argument order gets a green exit *because the script silently repaired the very staleness it was asked to detect* — and mutated the artifact under review while doing so. The review then reports a passing check on a document that failed. Compounding it: the contract instructs "run it with `--check`" without pinning argument order, and never says the tool writes in place except under "Never hand-edit inside the markers."

**Correct implementation.** Scan all of `process.argv.slice(2)` for `--check` regardless of position; treat the single remaining non-flag argument as the path; error on any unrecognized flag or on more than one operand.

---

### F-4 (Serious) — the change makes the in-flight plan non-compliant and says nothing about it

**What the artifacts say.** `HANDOFF.md:11–13` records `docs/plans/plan-expert-dev-tools-behavioral-remediation.md` as an existing plan through three review rounds, with round 4 owed (`HANDOFF.md:84`) and owner approval and implementation pending (`HANDOFF.md:93–96`).

**How verified.** Read `HANDOFF.md:11–13, 84, 93–96`. Grep `step-decl` in that plan → **0 matches**. The plan therefore has no `step-decl` blocks and no `<!-- generated:… -->` markers, so the new Gate C item ("Every step in Output section 7 opens with a complete `step-decl` block, and `--check` exits 0") fails against it — and the script would `fail('no ```step-decl blocks found')` at line 63 before reaching any check.

**Standard violated.** First-principles articulation (no published standard applies): the goal a contract amendment serves is that every artifact governed by it has a determinate compliance status. The shortcut is amending the contract without stating its temporal scope. It fails that goal because there is exactly one known governed artifact in flight, and this change silently flips it to non-compliant mid-review-cycle — so the round-4 reviewer, dispatched with "the governing output contract" per `HANDOFF.md:88–91`, will grade a 26-step plan against a contract it structurally cannot meet and return findings that are artifacts of the amendment rather than defects in the plan.

**Correct implementation.** State the applicability explicitly, in the contract or the changelog entry: either "applies to plans authored after this revision; `plan-expert-dev-tools-behavioral-remediation.md` is graded against revision `94a640a`," or "the in-flight plan is retrofitted before round 4 is dispatched." Either is fine; silence is not.

## Systemic Patterns

One systemic pattern, F-2 above, with its three instances enumerated and each independently reproduced by execution. The proactive scan was a full read-and-classify of every branch in the parse path (`derive-plan-sections.mjs:65–110`) rather than a grep, because the pattern's signature — "assigns without validating" — has no greppable form; the decomposition into branches is recorded in F-2.

## Moderate & Minor Findings

### F-5 (Moderate) — the contract states the test-ID scan is section-scoped; it is document-wide

The contract's new §12 sentence says the `- **T-<id>**` form is "what the derivation script recognizes when it cross-checks step declarations **against this section**." `derive-plan-sections.mjs:127–129` runs `testIdRe` against the entire document with no section bound. Probe B, executed: adding `- **T-99** risk of flakiness…` under a `## 13. Risks` heading to an otherwise-clean fixture produced `ERROR: test T-99 is specified but no step references it` and exit 1. So a compliant plan that mentions a test ID in bold anywhere outside §12 — in Risks, Post-completion, or the Question register, all natural places to cite one — fails the mandatory gate. **Standard:** documentation accuracy as a premise-correctness requirement (the same rule this project applies to plans in §11). **Fix:** slice `text` to §12's bounds before running `testIdRe`, or amend the contract sentence to say the scan is document-wide.

### F-6 (Moderate) — generation makes the coverage *completeness* failure less detectable, undisclosed

Probe G, executed: a fixture whose authored element vocabulary names `R-1, R-2, R-3` with no step covering `R-3` returns `OK: 2 steps, 2 test specs, regions current`, exit 0. The script derives the coverage table *from steps only*, so an element no step covers simply never appears — the omission is invisible rather than conspicuous. Under the old hand-authored regime the author had to walk the element vocabulary to write the table and would encounter the hole. Gate C's separate bullet requiring every element be mapped survives unchanged and is now the *only* thing checking this, entirely by hand. **Standard:** first-principles — automating a surface must not degrade the property the surface exists to guarantee without disclosure. The contract's claim that "The generated regime removes the mechanical half of the drift class outright" is true for consistency and false for completeness, and the difference is not stated. **Fix:** have the script parse a marked authored element vocabulary and error on any element with no covering step; or state the limitation in the contract beside the generated-region description.

### F-7 (Moderate) — the declaration is described as YAML but the parser rejects and mis-parses real YAML

The contract calls it "a fenced ` ```step-decl ` YAML block" with no qualification. The script's own header is honest — "strict subset of YAML, parsed here without dependencies" (`derive-plan-sections.mjs:18`) — but that honesty is in the file authors won't read. Verified by F-2 instance 1: `files: {create: [zzz.js]}`, a valid YAML flow mapping, is silently discarded. Block sequences (`- path/a.js`) hit line 100's unparseable-line error. **Standard:** a format label in a contract is a promise about accepted input; labeling a proper subset by the superset's name invites conforming input that fails. **Fix:** call it "a fenced `step-decl` block in the restricted key/inline-list grammar below" and reproduce the grammar constraints in the contract, not only in the script header.

### F-8 (Moderate) — a `$` in a declared path corrupts the generated region

`derive-plan-sections.mjs:186` passes a template string as `String.replace`'s second argument, so `$&`, `$1`, `` $` `` and `$'` in the derived body are interpreted as replacement patterns. Probe C, executed: `create: [src/$&weird.js]` produced a files region containing a duplicated copy of its own begin marker, header row, and end marker spliced into the middle of a table cell — the region is destroyed and the marker structure broken, and the script exited 0 reporting success. **Standard:** never interpolate untrusted content into a replacement pattern; use a replacer function. **Fix:** `updated.replace(re, (_, a, b) => a + eol + body + eol + b)`.

### F-9 (Minor) — the invocation path is an unresolved placeholder, and no unavailability disposition is stated

The contract writes `node <skill>/scripts/derive-plan-sections.mjs <plan.md>`. Grep of `SKILL.md` found 0 references to the script; the file's existing references to the reference directory are bare relative paths (`references/output-contract.md`, at `SKILL.md:20, 53, 63, 285, 388`), so there is no established convention for an agent to resolve `<skill>` against, and the plugin idiom `${CLAUDE_PLUGIN_ROOT}` is not used. Separately, the change introduces a hard Node dependency into a mandatory delivery gate with no stated disposition for an environment without Node — the skill's own doctrine ("a required tool that cannot run is a halt") supplies the answer, but the gate item does not say so, and one of the three mirror targets is a Python MCP-server project.

### F-10 (Minor) — two determinism/coverage gaps in the region machinery

`deriveFiles` sorts with a bare `a.localeCompare(b)` (line 171) while `deriveCoverage` pins the locale and numeric collation (line 150). Bare `localeCompare` resolves against the host's default locale and ICU data, so two environments can derive different row orders from the same declarations — which, given F-1's strict-equality staleness test, means `--check` can report STALE on one machine and OK on another. Separately, the region regex (line 181) is constructed without the `g` flag and `String.replace` with a non-global regex replaces only the first match, so a second occurrence of a marker pair — for instance in a plan that documents this contract change and quotes the markers — is silently never regenerated. **Fix:** pin `localeCompare(b, 'en')` in `deriveFiles`; error if a marker name occurs more than once.

## Tentative Findings

No tentative findings — every finding's premise was verified by executing the script against a purpose-built fixture, by Read at a cited line, or by grep with its query and result count recorded.

## Observations

The changelog entry's "summarized with pointers" approach — deliberately declining verbatim reproduction because "verbatim reproduction would itself become a drift site" — applies the contract's own doctrine to the changelog. No standard violation; recorded because it is a design choice a future editor might undo without realizing it was intentional.

## What's Actually Good

- **The four behaviors the changelog claims were fixture-verified all reproduce.** Probes 1–3 and H, executed: stale detection (exit 1, named regions), regeneration (writes only when stale, reports which), clean re-check (`OK: 2 steps, 2 test specs, regions current`, exit 0), and broken-reference detection (a step referencing an unspecified test, and an orphaned spec, each producing a distinct ERROR and exit 1). **Standard:** a change record's verification claims must be independently reproducible — this one is, which is not the default.
- **Zero third-party dependencies.** Read `derive-plan-sections.mjs:34` — the only import is `node:fs`. **Standard:** minimizing the dependency surface of tooling that gates delivery; a supply-chain compromise or a missing `node_modules` cannot break the gate.
- **The generated/authored split is drawn on the right axis.** The contract keeps §3, §11, §14, §1 and §13 authored on the stated grounds that they are "judgment-bearing and cannot be mechanically derived," and requires that any newly added restating surface be classified into one regime or the other in the same edit. **Standard:** first-principles — the correct boundary for automation is derivability, not convenience, and the closure rule prevents the new list from developing the same hand-maintenance hole the old one had. Verified by reading the replacement section in the diff against the baseline it replaces.

## Convergence Record

First-round review — convergence tracking begins at round 2.

## Recommended Priority

1. **F-1 (CRLF non-convergence)** first, because until it is fixed the gate this entire change installs cannot pass on the machine the plugin is developed on, and every finding below it is moot in practice.
2. **F-3 (argument-order fail-open)** next — a two-line fix, and the failure most likely to produce a *falsely green* review, which is worse than a red one.
3. **F-2 (systemic fail-open parsing)**, all three instances together as a class, per this project's own re-derive-the-class rule.
4. **F-4 (in-flight plan applicability)** before round 4 of the plan review is dispatched — after that point the ambiguity has already cost a review round.
5. **F-8, F-5, F-6, F-7**, then **F-9, F-10**.

Not a finding, but worth passing to whoever applies these: after F-1 and F-2 are fixed, run the repaired script against a retrofit of two or three real steps from the in-flight plan before committing. Every probe in this review used synthetic fixtures, and first contact with a real 26-step plan is where remaining grammar assumptions will surface.

Verdict: NEEDS_FIXES (10 findings: 1 Critical, 1 Systemic, 2 Serious, 4 Moderate, 2 Minor)
