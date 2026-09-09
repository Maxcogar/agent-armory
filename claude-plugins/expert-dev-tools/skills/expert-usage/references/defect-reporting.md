# Reporting a defect in the plugin

## Where it goes, and why there

```
~/.claude/plugins/data/expert-dev-tools/defect-history.json
```

This path is reachable from every project on the machine, so a report can be filed from
wherever the defect was hit. It survives plugin updates — it is not version-keyed like
the plugin cache, and records written months ago are still present after later installs.
And it is already read: the workflow's recurrence machinery consults it to decide
whether a problem is a one-off course correction or a systemic defect, and whether a
prior correction failed.

Writing a report anywhere else — a notes file, a folder chosen at the time, the project
being worked on — strands it. Nothing reads those locations, so the report never reaches
the plugin and the defect stays.

## The record

The file holds one key, `signatures`, an array. Each signature is one *kind* of defect,
not one incident:

```json
{
  "signature": "short-kebab-name: one sentence stating the observed failure",
  "state": "open",
  "verdict_last": "course_correction",
  "responsible_component": "the component whose behavior is wrong",
  "occurrences": [
    {
      "project": "the project directory key where it happened",
      "session_file": "transcript or run identifier",
      "date": "YYYY-MM-DD",
      "plugin_version": "the version that exhibited it",
      "count": 1
    }
  ]
}
```

These fields carry the weight:

- **`signature`** — states the *observed behavior*, not a theory about it. A signature
  written as a cause ("the ledger schema is wrong") pre-commits every future reader to
  that diagnosis. Written as behavior ("phase advances with an empty verifier return"),
  it stays checkable.
- **`occurrences`** — recurrence is judged from these. Match an existing signature and
  append rather than creating a near-duplicate; two records for one defect read as two
  problems, and neither accumulates enough occurrences to be recognized as systemic.

`state` starts `open`. It becomes `corrected` only when a correction has shipped, and
that entry carries the version and the commit that fixed it.

## What makes a report actionable

**Report what happened and the evidence for it.** The exact error, the phase it happened
in, what the workflow returned, what was expected, and where a reader can see it —
transcript, run identifier, ledger revision.

**Do not propose a fix.** Diagnosis is a dispatched role with verification duties: a
diagnostician reads the source, confirms every premise, and drafts a correction the
owner approves. A fix guessed while blocked and written into the store becomes a false
premise a later session builds on, and the store is exactly the wrong place to be wrong
in — it is consulted for years and read as established.

**Do not report symptoms of one's own error as plugin defects.** A gate that fired
because a phase genuinely produced nothing is the gate working. Check the workflow's
returned diagnosis first; it usually names the cause.

## After filing

Filing does not resolve the immediate problem. If the lifecycle cannot continue, that is
a halt to bring to the owner with the filed report referenced — not a reason to patch
the plugin and proceed. A patched plugin invalidates the guarantees of the run in
progress and leaves every other project running the defect.
