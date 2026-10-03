# Branch audit — coordinator rulings: store schema check, and edit-warning timing

Two items the batch 3–6 verifications left as "questions for Max Cogar". Neither
was his to answer. Both are engineering decisions, settled here from sources, and
both go to the single correction pass.

## 1. The store schema check is required, whoever has run `init`

**The defect.** The migration runner records the same version for every schema
it has ever built:
- `middleware/context-oracle/ctxoracle/src/stores/migration_runner.ts` L74 and
  L82 write `schema_version` `'1'` for the project and global stores.
- L60 and L79 return early when the recorded version is `>= 1` ("forward-only").
- The three migration files were first committed in `4dd0f00` and then edited in
  place: `git diff --stat de66831 HEAD -- .../migrations/` shows 125 insertions
  and 40 deletions.

So a store built by any earlier build opens as current. The code then runs
against tables and columns that are not there, or that mean something else.
Nothing reports it.

**Why the owner question was the wrong question.** It asked whether Max Cogar
had run `init`, as if the answer decided whether the check is needed. It doesn't:
- Any store from any earlier build hits the same defect: his, a test run, or a
  CI run.
- `init` wires hooks as absolute paths to the build that ran it
  (`src/cli/init.ts` L29–30). A rebuilt checkout at that path runs new code
  against the old store on the next hook event.
- The question is withdrawn. His answer ("yes i used that before") is recorded
  and changes nothing below.

**The standard.**
- Applied migrations are fixed. A changed schema is a new migration, and the
  tool must detect a store whose applied migrations differ from the code's.
- Flyway, `documentation/command/validate.md` in `flyway/flywaydb.org`:
  - "Validate helps you verify that the migrations applied to the database match
    the ones available locally."
  - "Validate works by storing a checksum (CRC32 for SQL migrations) when a
    migration is executed."
- Fail fast (Shore, IEEE Software 2004): "when a problem occurs, it fails
  immediately and visibly".

**The correction.**
1. When a migration runs, store a checksum of each migration file's content in
   `schema_meta` / `global_meta`.
2. On every open (CLI verbs, the hook path, `import`), compare the stored
   checksums with the shipped files. On any difference, or on a store with a
   version and no checksums, refuse the open. A checksum is used instead of a
   hand-bumped number because it catches an edit nobody remembered to bump.
3. The refusal:
   - records a fault;
   - makes the hook path emit nothing, so the agent is not blocked;
   - prints, on the CLI, a plain message that the store was built by an older
     build, what `ctxoracle deinit --purge` deletes, and that `init` rebuilds
     it.
   - There is no automatic purge and no silent re-migrate.
4. Tests:
   - a store stamped by the `de66831` migrations is refused on every open path;
   - a one-byte edit to any migration file is refused;
   - the message names the recovery.
5. The "no store has shipped" premise goes (`002_phase_a_global.sql` L3, plan L2362). It was an unverified premise,
   and the check no longer depends on it.

## 2. When the edit warning reaches the agent: sources and function

**Source.** The Claude Code hooks reference, https://code.claude.com/docs/en/hooks.md,
was curl-fetched on 2026-09-28 and each quote was matched by `webquote.py`:
- On `PreToolUse`, `additionalContext` is "String added to Claude's context
  alongside the tool result" (L1799).
- "Claude reads the reminder on the next model request" (L986).
- "Permission denials fire `PreToolUse`" (L2087).

**What that means for function.** A `PreToolUse` hook runs before the edit, but
its text reaches the model with the edit's result. The only `PreToolUse` output
the model sees before the edit runs is a deny (`permissionDecision`).

**Checked against the mission** ("Deliver the fact that would change the agent's
next decision, at the moment of that decision"):
- **Delivery at the edit.** Once the edit has run, the agent's next decision is
  whether to keep it, revise it, or run the coupled tests. The warning arrives
  at that decision point, so the edit trigger does its job.
- **Delivery before the edit** needs a deny. That is a pre-emptive gate,
  rejected by Max Cogar (`OL-R4`). Reactive blocking exists only for `OL-C2`
  and `OL-C3`.
- **Delivery at read time** is FR-A2e / D-26's job, which batches 2–3 settled.
  Moving FR-A2d there would merge the two.

**The defect is the spec's wording, not the design.**
- "about to run": `spec-context-oracle.md` L168 (FR-A2d), L211 and L929 (AC-1c).
- "that text is preserved even if the tool call later fails" (FR-O2, L480). This
  is on no page of the hooks reference: `webquote.py` exit 1.

**The correction.**
- FR-A2d, AC-1c and L211 say the warning is delivered with the edit's result,
  citing the three quotes above.
- FR-O2 drops the unsourced "preserved" clause.
- These are spec lines, so the new wording goes to Max Cogar for sign-off as a
  wording correction under M38. It is not a design choice put to him.

**Not established.** The reference does not say whether `additionalContext`
reaches the model when:
- the call is then denied by a permission rule, or
- another hook denies it.

The correction pass settles that from the Claude Code documentation or with a
throwaway `/tmp` session. Until then no spec line may claim either way.
