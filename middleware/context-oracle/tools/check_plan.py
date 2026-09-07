#!/usr/bin/env python3
"""Mechanical gate for middleware/context-oracle/docs/plans/plan-phase-a.md.

Why this exists. Two consecutive correction rounds on the Phase A plan
(2026-09-07, rounds 2 and 3) introduced defects the author's own checks could
not see: a step consuming a module or CLI verb that a *later* step creates, a
CI job invoking a script created thirty-seven steps later, prose counts and
attestations left stale by an edit elsewhere, a sweep record that never ends
with a zero-addition pass. The author's reconciliation script checked test IDs
and file paths; the reviewers checked what a step *needs at the moment it is
built*. This gate raises the author's floor to the reviewers' floor for every
class that is mechanical. A session runs it before every review dispatch;
CI runs it from the pull request that first makes the plan pass it, so the
gate never lands as a red check on a plan that predates it.

Checks (all over the plan file only; exit 1 on any failure):
  1. TEMPORAL — inside a step's text, every "(Step N)" / "Step N's" reference
     and every backticked path or CLI verb resolves to a step <= the current
     step (a step may cite the future only inside its Verification field's
     "Checkpoint" sentence, which is where deferred acceptance replays live).
  2. CREATION — every §5.1 source/test/script entry carries a "# Step N" or
     "# T<n>-<m>" annotation, and every backticked path under src/, test/,
     scripts/, or .github/ that a step names exists in §5.1.
  3. TESTS — every T-ID defined in §12 is named by its step's Verification
     field or a checkpoint; every T-ID cited anywhere is defined; every §12
     entry carries File / Verifies / Level / Real-doubles / Data / Fails when.
  4. DEPENDENCIES — every Dependencies field names earlier steps only, and
     every earlier step a step cites in its body is in its Dependencies.
  5. ATTESTATIONS — the "trivial steps are" list equals the set of steps
     without the four Gate 3 parts; the §12.4 step table has a row per step;
     the D-plan count in §10 equals the §10A entry count; the last recorded
     §14.4 pass states that it added zero entries; tier counts a step states
     ("N unit, M build, K conventions") equal the §5.1 tree.
  6. NARRATION — no self-correction or review-round narration in the plan
     body (citations of collapse-log entries by title are allowed).

Run: python3 middleware/context-oracle/tools/check_plan.py [path]
"""

import re
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
DEFAULT = ROOT / "middleware/context-oracle/docs/plans/plan-phase-a.md"
PKG_PREFIX = "middleware/context-oracle/ctxoracle/"


def section(lines, start_pat, end_pat):
    s = next((i for i, l in enumerate(lines) if re.match(start_pat, l)), None)
    if s is None:
        return None, None
    e = next((i for i in range(s + 1, len(lines)) if re.match(end_pat, lines[i])), len(lines))
    return s, e


def main(path):
    text = Path(path).read_text()
    L = text.splitlines()
    problems = []

    # ---------- §5.1 tree: creation index ----------
    s5, e5 = section(L, r"^### 5\.1 ", r"^### 5\.2 ")
    created_by = {}        # normalized path -> step or T-ID
    tree_paths = set()
    stack = []
    inblock = False
    for i in range(s5, e5):
        l = L[i]
        if l.startswith("```"):
            inblock = not inblock
            continue
        if not inblock or not l.strip():
            continue
        body = l.split("#")[0].rstrip()
        comment = l[len(body):]
        indent = (len(body) - len(body.lstrip())) // 2
        names = body.strip().split()
        stack = stack[:indent]
        for name in names:
            path = "/".join([x.rstrip("/") for x in stack] + [name.rstrip("/")])
            path = path.replace(PKG_PREFIX, "")
            tree_paths.add(path)
            m = re.search(r"Step (\d+)", comment)
            t = re.search(r"T(\d+)-\d+", comment)
            if m:
                created_by[path] = int(m.group(1))
            elif t:
                created_by[path] = int(t.group(1))
            elif not name.endswith("/") and re.search(r"\.(ts|mjs|sh|json|yml|sql)$", name):
                problems.append(f"§5.1 line {i+1}: `{path}` has no Step or T-ID annotation")
        stack.append(names[-1] if names else "")

    # ---------- steps ----------
    s7, e7 = section(L, r"^## 7\. ", r"^## 8\. ")
    steps = {}
    cur = None
    for i in range(s7, e7):
        m = re.match(r"^### Step (\d+) — ", L[i])
        if m:
            cur = int(m.group(1))
            steps[cur] = {"start": i, "lines": []}
        elif cur is not None:
            steps[cur]["lines"].append((i, L[i]))
    nsteps = max(steps)

    def field(step, name):
        out, on = [], False
        for i, l in steps[step]["lines"]:
            if l.startswith(f"**{name}.**") or l.startswith(f"**{name}"):
                on = True
            elif on and (l.startswith("**") or l.startswith("---") or l.startswith("###")):
                on = False
            if on:
                out.append((i, l))
        return out

    verb_files = {p for p in tree_paths if p.startswith("src/cli/") and p.endswith(".ts")}
    verb_step = {Path(p).stem: created_by.get(p) for p in verb_files}

    for n, st in sorted(steps.items()):
        deps_text = " ".join(l for _, l in field(n, "Dependencies"))
        deps = {int(x) for x in re.findall(r"\b(\d+)\b", re.sub(r"Steps? ", "", deps_text)) if int(x) <= nsteps}
        ver_lines = {i for i, _ in field(n, "Verification")}
        wc_lines = {i for i, _ in field(n, "What changes")}
        cited = set()
        for i, l in st["lines"]:
            if i in ver_lines and "Checkpoint" in " ".join(x for _, x in field(n, "Verification")):
                pass  # checkpoint sentences may cite deferred replays
            # forward step references: a failure only inside an enumerated
            # action item of What changes (the shape "1. Guard (Step 29)"),
            # where the step is stating what its own code does; a prose
            # mention of a future caller is explanation, not consumption.
            is_action_item = bool(re.match(r"^\s*(\d+\.|-)\s", l)) and i in wc_lines
            for m in re.finditer(r"Step (\d+)(?:'s)?", l):
                k = int(m.group(1))
                if k > n and is_action_item:
                    problems.append(f"Step {n} line {i+1}: action item consumes Step {k} (later) — `{l.strip()[:100]}`")
                elif k < n:
                    cited.add(k)
            # backticked paths / verbs
            for tok in re.findall(r"`([^`]+)`", l):
                tok2 = tok.replace(PKG_PREFIX, "").rstrip("/")
                if re.match(r"^(src|test|scripts|\.github)/[\w./\-]+$", tok2):
                    if tok2 not in tree_paths and not tok2.endswith("/**") and "*" not in tok2:
                        problems.append(f"Step {n} line {i+1}: names `{tok2}` which is not in §5.1")
                    elif tok2 in created_by and isinstance(created_by[tok2], int) and created_by[tok2] > n and i not in ver_lines:
                        problems.append(f"Step {n} line {i+1}: uses `{tok2}` created at Step {created_by[tok2]}")
                m = re.match(r"^(?:ctxoracle )?(hook )?([a-z][\w-]+)\b", tok)
                if m and m.group(1) and m.group(2) != "<event>":
                    verb = m.group(2).replace("-", "_")
                    k = verb_step.get(verb)
                    if k and k > n and i not in ver_lines:
                        problems.append(f"Step {n} line {i+1}: uses verb `{tok}` registered at Step {k}")
                elif tok.startswith("ctxoracle "):
                    verb = tok.split()[1].replace("-", "_")
                    k = verb_step.get(verb)
                    if k and k > n and i not in ver_lines:
                        problems.append(f"Step {n} line {i+1}: uses verb `{tok}` registered at Step {k}")
        for k in sorted(cited - deps):
            if k != n:
                problems.append(f"Step {n}: body cites Step {k} but Dependencies names only {sorted(deps)} (name every earlier step consumed)")
        bad = [d for d in deps if d >= n]
        if bad:
            problems.append(f"Step {n}: Dependencies names non-earlier steps {bad}")
        for fld in ("What changes", "Source", "Dependencies", "Verification", "Impact if wrong"):
            if not field(n, fld):
                problems.append(f"Step {n}: missing field **{fld}.**")

    # ---------- tests ----------
    s12, e12 = section(L, r"^## 12\. ", r"^## 13\. ")
    tests = {}
    cur = None
    for i in range(s12, e12):
        m = re.match(r"^\*\*(T\d+-\d+)(?: \(.*?\))? — ", L[i])
        if m:
            cur = m.group(1)
            tests[cur] = {"line": i + 1, "text": ""}
        elif cur:
            tests[cur]["text"] += L[i] + "\n"
    for t, d in tests.items():
        for fld in ("File", "Verifies", "Level", "Real/doubles", "Data", "NOT asserts"):
            if f"- **{fld}.**" not in d["text"]:
                problems.append(f"{t} (line {d['line']}): missing field {fld}")
        if not re.search(r"\*\*Fails\s+when\*\*", d["text"]):
            problems.append(f"{t} (line {d['line']}): missing 'Fails when'")
        for f in re.findall(r"`((?:src|test|scripts)/[^`]+)`", d["text"].split("- **Verifies.**")[0]):
            if f.rstrip("/") not in tree_paths:
                problems.append(f"{t}: File `{f}` not in §5.1")
        n = int(t.split("-")[0][1:])
        ver = " ".join(l for _, l in field(n, "Verification")) if n in steps else ""
        s9, e9 = section(L, r"^## 9\. ", r"^## 10\. ")
        cp = "\n".join(L[s9:e9])

        def named(txt):
            if t in txt:
                return True
            for a, b, c, d2 in re.findall(r"`T(\d+)-(\d+)`\s*[–-]\s*`T(\d+)-(\d+)`", txt):
                sn, si = map(int, t[1:].split("-"))
                if (int(a), int(b)) <= (sn, si) <= (int(c), int(d2)):
                    return True
            return False
        if not named(ver) and not named(cp):
            problems.append(f"{t}: not named by Step {n}'s Verification field nor by a checkpoint")
    for i, l in enumerate(L):
        for t in set(re.findall(r"\bT\d+-\d+\b", l)):
            if t not in tests:
                problems.append(f"line {i+1}: {t} referenced but not defined in §12")

    # ---------- attestations ----------
    m = re.search(r"trivial steps are \*\*([\d, and\s]+)\*\*", text)
    if m:
        declared = {int(x) for x in re.findall(r"\d+", m.group(1))}
        actual = {n for n in steps if "**Why this approach (Gate 3):**" not in "\n".join(l for _, l in steps[n]["lines"])}
        if declared != actual:
            problems.append(f"trivial-steps attestation says {sorted(declared)} but steps without Gate 3 are {sorted(actual)}")
    s124, e124 = section(L, r"^### 12\.4 ", r"^## 13\. ")
    rows = {int(l.split("|")[1]) for l in L[s124:e124] if re.match(r"^\| \d+ \|", l)}
    missing = set(steps) - rows
    if missing:
        problems.append(f"§12.4 step table lacks rows for steps {sorted(missing)}")
    d10 = len(re.findall(r"^- \*\*D-plan-\d+ — ", text, re.M))
    d10a = len(re.findall(r"^#### D-plan-\d+ ", text, re.M))
    if d10 != d10a:
        problems.append(f"§10 defines {d10} D-plan entries but §10A has {d10a} collapse-tests")
    s144, e144 = section(L, r"^### 14\.4 ", r"^## 15\. ")
    passes = [l for l in L[s144:e144] if re.match(r"^- \*\*Pass \d+", l)]
    if not passes:
        problems.append("§14.4: no pass record found")
    else:
        last_idx = L.index(passes[-1])
        last_text = " ".join(L[last_idx:e144])
        if re.search(r"entries added: *Q\d", last_text) or not re.search(r"added zero", last_text):
            problems.append("§14.4: the last recorded pass must be a full pass that added zero entries (a pass that added entries needs a further zero-addition pass after it)")
    tiers = defaultdict(int)
    for p in tree_paths:
        if p.startswith("test/") and p.endswith(".test.ts"):
            tiers[p.split("/")[1]] += 1
    for m in re.finditer(r"\((\d+) unit, (\d+) build, (\d+) conventions\)", text):
        u, b, c = map(int, m.groups())
        if (u, b, c) != (tiers["unit"], tiers["build"], tiers["conventions"]):
            problems.append(f"tier-count attestation ({u},{b},{c}) differs from §5.1 ({tiers['unit']},{tiers['build']},{tiers['conventions']})")

    # ---------- narration ----------
    for i, l in enumerate(L):
        if re.search(r"\b(retracted|prior wording|previous plan|earlier draft|this revision|was corrected|fix batch|round-\d+ (fix|correction|review)|the review(er)? (found|said|noted)|regression \(introduced)", l, re.I):
            problems.append(f"line {i+1}: narration — `{l.strip()[:100]}`")

    if problems:
        print("plan gate FAILED:\n")
        for p in problems:
            print(f"  - {p}")
        print(f"\n{len(problems)} problem(s).")
        return 1
    print("plan gate passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else DEFAULT))
