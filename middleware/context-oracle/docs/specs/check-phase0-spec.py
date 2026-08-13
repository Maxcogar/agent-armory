#!/usr/bin/env python3
"""Mechanical checks on the Phase 0 spec.

Every check here is one a human has gotten wrong on this document at least once.
None of them requires judgment: each is a set operation, a count, or a lookup.
Checks that would need semantic judgment (is this requirement's meaning the same
as v1's?) are deliberately absent — a claim that needs judgment to be true does
not belong in the document, because the judgment gets skipped and the claim goes
stale. See docs/collapse-log.md, 2026-08-01 round 4.

Run from anywhere:  python3 .claude/hooks/check-phase0-spec.py
Exit 0 = all checks pass. Exit 1 = at least one failed, with the failures listed.
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
V1 = ROOT / "docs/specs/spec-context-oracle.md"
P0 = ROOT / "docs/specs/spec-context-oracle-phase0.md"

REQ = r"FR-[A-Z]+\d+[a-z]?|NF-\d+|C-\d+"

failures = []
notes = []


def fail(check, detail):
    failures.append(f"{check}: {detail}")


def ok(check, detail):
    notes.append(f"{check}: {detail}")


def defined_ids(text):
    """Requirement IDs this document defines, i.e. bolded at a definition site."""
    return set(re.findall(rf"\*\*({REQ})\*\*", text))


def expand(segment):
    """IDs named in a §3 bucket, expanding FR-J1–FR-J5 and C-1–C-5 style ranges."""
    out = set(re.findall(rf"\b({REQ})\b", segment))
    for pre, a, b in re.findall(r"(FR-[A-Z]+)(\d+)–FR-[A-Z]+(\d+)", segment):
        out |= {f"{pre}{i}" for i in range(int(a), int(b) + 1)}
    for prefix in ("C", "NF"):
        for a, b in re.findall(rf"{prefix}-(\d+)–{prefix}-(\d+)", segment):
            out |= {f"{prefix}-{i}" for i in range(int(a), int(b) + 1)}
    return out


def section(text, start, end):
    try:
        return text.split(start, 1)[1].split(end, 1)[0]
    except IndexError:
        return ""


v1_text = V1.read_text()
p0_text = P0.read_text()

v1_ids = defined_ids(v1_text)
p0_ids = defined_ids(p0_text)

# ---------------------------------------------------------------- disposition
disp = section(p0_text, "## 3. Disposition", "## 4. Sources")
if not disp:
    fail("disposition", "could not locate §3")
else:
    deferred = expand(section(disp, "**Deferred whole", "**Principles."))
    in_phase0 = expand(disp) - deferred
    # Bucket labels change between rebuilds; membership is what matters, so the
    # check is two-state (in Phase 0 / deferred) and survives a relabelling.
    disposed = in_phase0 | deferred

    missing = sorted(v1_ids - disposed)
    if missing:
        fail("coverage", f"{len(missing)} v1 requirement(s) with no disposition: {missing}")
    else:
        ok("coverage", f"all {len(v1_ids)} v1 requirements disposed")

    extra = sorted(disposed - v1_ids)
    if extra:
        fail("coverage", f"§3 disposes identifiers absent from v1: {extra}")

    both = sorted(in_phase0 & deferred)
    if both:
        fail("coverage", f"requirement(s) both in-Phase-0 and deferred: {both}")

    # An in-Phase-0 requirement must actually be defined in the body; a deferred
    # one must not be. This is the check that catches a bucket edit that never
    # reached the requirement text.
    body = p0_text.split("## 5.", 1)[-1]
    undefined = sorted(i for i in in_phase0 if f"**{i}**" not in body)
    if undefined:
        fail("disposition", f"listed in Phase 0 but never defined in the body: {undefined}")
    else:
        ok("disposition", f"all {len(in_phase0)} in-Phase-0 requirements defined in the body")

    defined_but_deferred = sorted(i for i in deferred if f"**{i}**" in body)
    if defined_but_deferred:
        fail("disposition", f"listed as deferred but defined in the body: {defined_but_deferred}")

    # Three-set refinement. §3 splits the in-Phase-0 set into an "unchanged" prose
    # list and a "narrowed" table and claims they are disjoint and together cover
    # in_phase0. Check that, so the claim is mechanically backed rather than an
    # attestation the reader must trust (expert review round 5, m1).
    unchanged_seg = section(disp, "unchanged (", "**In force but narrowed")
    narrowed_seg = section(disp, "narrowed here (", "**Deferred whole")
    unchanged_ids = expand(unchanged_seg)
    narrowed_ids = set(re.findall(rf"(?m)^\|\s*({REQ})\s+—", narrowed_seg))
    overlap = sorted(unchanged_ids & narrowed_ids)
    if overlap:
        fail("disposition", f"listed as both unchanged and narrowed: {overlap}")
    union = unchanged_ids | narrowed_ids
    if union != in_phase0:
        lists_only = sorted(union - in_phase0)
        derived_only = sorted(in_phase0 - union)
        fail("disposition",
             f"unchanged∪narrowed ≠ in-Phase-0 set (lists-only {lists_only}, "
             f"derived-only {derived_only})")
    if not overlap and union == in_phase0:
        ok("disposition",
           f"unchanged ({len(unchanged_ids)}) and narrowed ({len(narrowed_ids)}) "
           f"disjoint and cover the {len(in_phase0)} in-Phase-0 requirements")

# ---------------------------------------------------------------- namespaces
minted = sorted(p0_ids - v1_ids)
if minted:
    fail("namespace", f"identifiers minted in v1's namespaces: {minted}")
else:
    ok("namespace", "no FR-*/NF-*/C-* identifiers minted")

# ---------------------------------------------------------------- criteria
acs = [int(n) for n in re.findall(r"\*\*AC-(\d+) \(", p0_text)]
if not acs:
    fail("criteria", "no acceptance criteria found")
else:
    expected = list(range(1, len(acs) + 1))
    if acs != expected:
        gaps = sorted(set(expected) - set(acs))
        dupes = sorted({n for n in acs if acs.count(n) > 1})
        fail("criteria", f"AC numbering not contiguous 1..{len(acs)} (missing {gaps}, duplicated {dupes})")
    else:
        ok("criteria", f"AC-1..AC-{len(acs)} contiguous")

# Every requirement the document defines is either tested or named as inspected.
ac_section = p0_text.split("## 14. Acceptance criteria", 1)[-1]
defined_here = set(re.findall(rf"\*\*({REQ}|P0-\d+)\*\*", p0_text.split("## 14.", 1)[0]))
uncovered = sorted(r for r in defined_here if not re.search(rf"\b{re.escape(r)}\b", ac_section))
if uncovered:
    fail("coverage", f"defined but no criterion and no inspection entry: {uncovered}")
else:
    ok("coverage", f"all {len(defined_here)} defined requirements covered by a criterion or inspection")

# ---------------------------------------------------------------- decisions
decl = set(re.findall(r"\*\*(P0-D-\d+)\s+—", p0_text))
cited = set(re.findall(r"`\[(P0-D-\d+)\]`", p0_text))
orphan = sorted(decl - cited, key=lambda s: int(s.rsplit("-", 1)[1]))
if orphan:
    fail("decisions", f"recorded but never referenced by any requirement: {orphan}")
dangling = sorted(cited - decl, key=lambda s: int(s.rsplit("-", 1)[1]))
if dangling:
    fail("decisions", f"referenced but never recorded: {dangling}")
if not orphan and not dangling:
    ok("decisions", f"all {len(decl)} decisions recorded and referenced")

# ---------------------------------------------------------------- references
# Catches the round-4 regression: renumbering criteria without re-deriving the
# clauses that cite them. Resolution only — that a reference *supports* the
# claim citing it is a judgment and is deliberately not checked here.
defined_all = defined_here | {f"AC-{n}" for n in acs} | decl | {
    m for m in re.findall(r"\*\*(P0-\d+)\*\*", p0_text)
}
referenced = set(re.findall(rf"\b(AC-\d+|P0-D-\d+|P0-\d+|{REQ})\b", p0_text))
v1_refs = set(re.findall(r"v1 (AC-\d+)", p0_text))
unresolved = sorted(referenced - defined_all - v1_ids - v1_refs)
if unresolved:
    fail("references", f"referenced but defined nowhere: {unresolved}")
else:
    ok("references", "every internal reference resolves")

# ---------------------------------------------------------------- report
print(f"Phase 0 spec checks — {P0.relative_to(ROOT)}\n")
for n in notes:
    print(f"  pass  {n}")
for f in failures:
    print(f"  FAIL  {f}")
print()
if failures:
    print(f"{len(failures)} check(s) failed.")
    sys.exit(1)
print(f"All {len(notes)} checks passed.")
