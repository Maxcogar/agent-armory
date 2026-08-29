#!/usr/bin/env python3
"""Deterministic cross-document consistency gate for middleware/context-oracle.

Run by CI on every pull request that touches the project (and runnable locally:
`python3 middleware/context-oracle/tools/check_docs.py [--base origin/main]`).
A non-zero exit fails the PR. This exists because written rules did not hold
and in-session hooks are advisory: this is the one check no session can skip,
because the owner merges only green PRs.

Checks (content, always):
  1. Every FR-/AC-/NF-/P-/C-/D- requirement key cited in a current-authority
     document (CLAUDE.md, OWNER-LEDGER.md, docs/STATUS.md) resolves to the spec.
  2. Every OL- ledger key cited in the spec, CLAUDE.md, or docs/STATUS.md
     resolves to OWNER-LEDGER.md.
  3. Every spec-section reference (`§N` / `§N.M`) in CLAUDE.md or docs/STATUS.md
     names a section header that exists in the spec (lines naming RETHINK are
     exempt — their § numbers are RETHINK's).

Checks (git, only with --base REF — CI passes the PR base):
  4. No file added or modified under docs/handoffs/ (STATUS.md is the handoff).
  5. No existing file under docs/reviews/ modified (reviews are written once).
  6. If anything under the project changed, docs/STATUS.md changed too.
"""

import argparse
import re
import subprocess
import sys
from pathlib import Path

PROJECT = "middleware/context-oracle"
ROOT = Path(__file__).resolve().parents[3]
PROJ = ROOT / PROJECT

SPEC = PROJ / "docs/specs/spec-context-oracle.md"
LEDGER = PROJ / "OWNER-LEDGER.md"
CLAUDE_MD = PROJ / "CLAUDE.md"
STATUS = PROJ / "docs/STATUS.md"

# Retired IDs the spec's §8 resolution note documents; they may be cited in the
# spec itself (the note), and only there.
RETIRED_OK_IN_SPEC = {"FR-O4", "FR-O4a"}

REQ_KEY = re.compile(
    r"\b(FR-[A-Z]\d+[a-z]?|AC-\d+[a-z]*(?:-[iv]+)?|NF-\d+|D-\d+(?:bar)?|C-\d+|P\d+)\b"
)
OL_KEY = re.compile(r"\bOL-(?:[CRP]?\d+)\b")
# Generic placeholders like [OL-n], [D-n], FR-A2x used as pattern text — never keys.
GENERIC = re.compile(r"\b(?:OL-[CRP]?n|D-n|FR-[A-Z]n)\b")
SECTION_REF = re.compile(r"§(\d+(?:\.\d+)?)")


def fail(errors: list[str]) -> None:
    if errors:
        print("context-oracle doc-consistency check FAILED:\n", file=sys.stderr)
        for e in errors:
            print(f"  - {e}", file=sys.stderr)
        print(
            f"\n{len(errors)} problem(s). Fix the document(s) — or, if a key was"
            " genuinely renamed/retired, record the resolution in the spec §8"
            " retired-ID note and update this checker deliberately.",
            file=sys.stderr,
        )
        sys.exit(1)


def strip_generics(text: str) -> str:
    return GENERIC.sub("", text)


def check_content() -> list[str]:
    errors: list[str] = []
    spec_text = SPEC.read_text(encoding="utf-8")
    ledger_text = LEDGER.read_text(encoding="utf-8")

    spec_keys = set(REQ_KEY.findall(spec_text))
    ledger_keys = set(OL_KEY.findall(ledger_text))

    # 1. Requirement keys cited in current-authority docs resolve to the spec.
    for doc in (CLAUDE_MD, LEDGER, STATUS):
        text = strip_generics(doc.read_text(encoding="utf-8"))
        for lineno, line in enumerate(text.splitlines(), 1):
            for key in REQ_KEY.findall(line):
                if key not in spec_keys:
                    errors.append(
                        f"{doc.relative_to(ROOT)}:{lineno}: cites '{key}', which"
                        " does not appear in the spec — stale or invented key."
                    )

    # 1b. Retired IDs may be *cited as live* nowhere outside the spec's own
    # resolution note; a line that is itself about the retirement/resolution
    # (contains "retired" or "resolution") may name them.
    for doc in (CLAUDE_MD, LEDGER, STATUS):
        for lineno, line in enumerate(doc.read_text(encoding="utf-8").splitlines(), 1):
            if "retired" in line.lower() or "resolution" in line.lower():
                continue
            for key in RETIRED_OK_IN_SPEC:
                if re.search(rf"\b{re.escape(key)}\b", line):
                    errors.append(
                        f"{doc.relative_to(ROOT)}:{lineno}: cites retired ID"
                        f" '{key}' as live — it resolves per the spec §8 note"
                        " (FR-O4→FR-B3, FR-O4a→FR-B4); cite the live key."
                    )

    # 2. OL- keys cited anywhere current resolve to the ledger.
    for doc in (SPEC, CLAUDE_MD, STATUS):
        text = strip_generics(doc.read_text(encoding="utf-8"))
        for lineno, line in enumerate(text.splitlines(), 1):
            for key in OL_KEY.findall(line):
                if key not in ledger_keys:
                    errors.append(
                        f"{doc.relative_to(ROOT)}:{lineno}: cites '{key}', which"
                        " has no entry in OWNER-LEDGER.md — the exact defect the"
                        " ledger exists to prevent."
                    )

    # 3. §-references in CLAUDE.md / STATUS.md exist as spec section headers.
    spec_sections = set(
        m.group(1)
        for m in re.finditer(r"^#{2,3}\s+(\d+(?:\.\d+)?)[.\s]", spec_text, re.M)
    )
    # Sub-subsection references like §2.1 that appear as bold list items, not
    # headers, are collected too:
    spec_sections |= set(
        m.group(1) for m in re.finditer(r"^###?\s.*?§?(\d+\.\d+)\b", spec_text, re.M)
    )
    for doc in (CLAUDE_MD, STATUS):
        for lineno, line in enumerate(doc.read_text(encoding="utf-8").splitlines(), 1):
            if "RETHINK" in line:
                continue
            for sec in SECTION_REF.findall(line):
                top = sec.split(".")[0]
                if sec not in spec_sections and top not in spec_sections:
                    errors.append(
                        f"{doc.relative_to(ROOT)}:{lineno}: references spec"
                        f" §{sec}, but the spec has no such section header."
                    )
    return errors


def check_git(base: str) -> list[str]:
    errors: list[str] = []

    def git(*args: str) -> str:
        return subprocess.run(
            ["git", *args], cwd=ROOT, capture_output=True, text=True, check=False
        ).stdout

    merge_base = git("merge-base", base, "HEAD").strip() or base
    changed = git("diff", "--name-only", merge_base, "HEAD").splitlines()
    added = git("diff", "--name-only", "--diff-filter=A", merge_base, "HEAD").splitlines()
    modified = git("diff", "--name-only", "--diff-filter=M", merge_base, "HEAD").splitlines()

    proj_changed = [f for f in changed if f.startswith(f"{PROJECT}/")]
    if not proj_changed:
        return errors

    # 4. No handoff documents.
    handoffs = [f for f in added + modified if f.startswith(f"{PROJECT}/docs/handoffs/")]
    if handoffs:
        errors.append(
            f"handoff file(s) written ({', '.join(handoffs)}) — STATUS.md is the"
            " handoff; docs/handoffs/ is history only."
        )

    # 5. Reviews are written once, never edited.
    edited_reviews = [
        f
        for f in modified
        if f.startswith(f"{PROJECT}/docs/reviews/") and not f.endswith("README.md")
    ]
    if edited_reviews:
        errors.append(
            f"existing review file(s) edited ({', '.join(edited_reviews)}) —"
            " reviews are the closure record; corrections go in the next round's"
            " review."
        )

    # 6. STATUS.md rewritten whenever the project changed.
    if f"{PROJECT}/docs/STATUS.md" not in proj_changed:
        errors.append(
            "the project changed but docs/STATUS.md did not — STATUS.md is the"
            " state of record and the session protocol requires it rewritten."
        )
    return errors


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base", help="git ref to diff against (CI: the PR base)")
    args = parser.parse_args()

    errors = check_content()
    if args.base:
        errors += check_git(args.base)
    fail(errors)
    print("context-oracle doc-consistency check passed.")


if __name__ == "__main__":
    main()
