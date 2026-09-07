#!/usr/bin/env python3
"""Shared library for the correction loop hooks (serve / guard / judge).

The loop: once a review round's two files exist, every finding is queued where the
agent cannot read it, and issues are served one at a time as a packet: the finding
verbatim, the full text of every plan unit it touches, and the spec/architecture
sections those units cite. The agent writes a proposal, edits, writes a self-check;
the Stop hook judges in order (read all / proposal / edits / self-check) and either
fails the turn with the step number only, or serves the next issue.

Nothing here knows this plan's content: units are located by the expert-plan output
contract's structure (numbered steps, T-<step>-<n> test specs, D-plan-<n> decisions and
their collapse-test entries, Q<n> register entries, section-11 claims with a Steps
field, checkpoints), and sources by their IDs in the spec, architecture and ledger.
"""
import hashlib
import json
import os
import re
import subprocess
import sys
import time

HOOK_DIR = os.path.dirname(os.path.abspath(__file__))
STATE_DIR = os.path.join(HOOK_DIR, "state")
PROJECT_DIR = os.path.abspath(os.path.join(HOOK_DIR, "..", "..", ".."))  # middleware/context-oracle
SETTINGS_PATH = os.path.join(PROJECT_DIR, ".claude", "settings.json")
DERIVE_SCRIPT = os.path.join(PROJECT_DIR, ".claude", "skills", "expert-plan", "scripts", "derive-plan-sections.mjs")
PLAN_PATH = None  # resolved from the reviews of the active round (see plan_path_from_reviews)

QUEUE = os.path.join(STATE_DIR, "queue.json")          # never readable by the agent
CURRENT = os.path.join(STATE_DIR, "current.json")      # served issue metadata
PACKET_PREFIX = os.path.join(STATE_DIR, "current-issue")  # current-issue.part1.md ...
PROPOSAL = os.path.join(STATE_DIR, "proposal.md")
SELFCHECK = os.path.join(STATE_DIR, "selfcheck.md")
DONE = os.path.join(STATE_DIR, "done.json")
HASHES = os.path.join(STATE_DIR, "hashes.json")
VERDICTS_DIR = os.path.join(STATE_DIR, "verdicts")     # never readable by the agent
PLAN_SNAPSHOT = os.path.join(STATE_DIR, "plan-at-serve.md")
LOG = os.path.join(STATE_DIR, "log.txt")               # never readable by the agent

PACKET_PART_LINES = 1200  # keep every part inside the Read tool's default window

# ---------------------------------------------------------------- utilities

def log(msg):
    os.makedirs(STATE_DIR, exist_ok=True)
    with open(LOG, "a", encoding="utf-8") as f:
        f.write(f"{time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())} {msg}\n")


def read_json(path, default=None):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (OSError, json.JSONDecodeError):
        return default


def write_json(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2)
    os.replace(tmp, path)


def read_text(path):
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        return f.read()


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        h.update(f.read())
    return h.hexdigest()


def hook_files():
    out = []
    for root, _dirs, files in os.walk(HOOK_DIR):
        if os.path.abspath(root).startswith(os.path.abspath(STATE_DIR)):
            continue
        for fn in files:
            if fn.endswith((".py", ".json", ".md", ".sh")):
                out.append(os.path.join(root, fn))
    out.append(SETTINGS_PATH)
    return sorted(set(out))


def record_hashes():
    write_json(HASHES, {p: sha256_file(p) for p in hook_files() if os.path.isfile(p)})


def hashes_intact():
    recorded = read_json(HASHES, {})
    if not recorded:
        return False, "no recorded hashes"
    for p, h in recorded.items():
        if not os.path.isfile(p):
            return False, f"missing {p}"
        if sha256_file(p) != h:
            return False, f"modified {p}"
    for p in hook_files():
        if os.path.isfile(p) and p not in recorded:
            return False, f"added {p}"
    return True, "ok"


def loop_active():
    return os.path.isfile(CURRENT)


def packet_parts():
    parts = []
    i = 1
    while True:
        p = f"{PACKET_PREFIX}.part{i}.md"
        if not os.path.isfile(p):
            break
        parts.append(p)
        i += 1
    return parts

# ---------------------------------------------------------------- reviews → queue

FINDING_HEAD = re.compile(r"^(?:###\s+|\*\*)(S|SY|M|m|T)(-?)(\d+)\s+—\s+(.*)$")
SEVERITY_ORDER = {"S": 0, "SY": 0, "M": 1, "m": 2, "T": 3}


REVIEW_NAME = re.compile(r"round-(\d+)-(expert-review|collapse-hunt)\.md$")


def markdown_files(root=PROJECT_DIR):
    out = []
    for r, dirs, files in os.walk(root):
        dirs[:] = [d for d in dirs if d not in ("node_modules", ".git", "state", "__pycache__")]
        for fn in files:
            if fn.endswith(".md"):
                out.append(os.path.join(r, fn))
    return out


def find_round_pair(root=PROJECT_DIR):
    """Newest N with both a `…round-N-expert-review.md` and a `…round-N-collapse-hunt.md`
    anywhere under the project (the reviewer skills' file names)."""
    rounds = {}
    for path in markdown_files(root):
        m = REVIEW_NAME.search(os.path.basename(path))
        if m:
            rounds.setdefault(int(m.group(1)), {})[m.group(2)] = path
    complete = [n for n, d in rounds.items() if "expert-review" in d and "collapse-hunt" in d]
    if not complete:
        return None, None
    n = max(complete)
    return n, rounds[n]


PLAN_REF = re.compile(r"`?((?:[\w.-]+/)*[\w.-]+\.md):(\d+)")


def plan_path_from_reviews(round_files, root=PROJECT_DIR):
    """The plan under review is the markdown file the reviews cite by `path:line` most often."""
    counts = {}
    for path in round_files.values():
        for m in PLAN_REF.finditer(read_text(path)):
            rel = m.group(1)
            if "plan" not in rel.lower():
                continue
            counts[rel] = counts.get(rel, 0) + 1
    if not counts:
        return None
    rel = max(counts, key=counts.get)
    for cand in (os.path.join(root, rel), os.path.join(os.path.dirname(root), rel)):
        if os.path.isfile(cand):
            return os.path.abspath(cand)
    base = os.path.basename(rel)
    for path in markdown_files(root):
        if os.path.basename(path) == base:
            return path
    return None


def extract_findings(path, source_tag):
    """Findings are blocks starting at a heading `### S1 — …` / `### S-1 — …` or a bold
    paragraph `**M1 — …` and running to the next finding, `##`/`###` heading, or `---`."""
    lines = read_text(path).split("\n")
    findings = []
    cur = None
    for line in lines:
        m = FINDING_HEAD.match(line)
        starts = bool(m)
        ends = line.startswith("## ") or line.startswith("### ") or line.strip() == "---"
        if cur is not None and (starts or ends):
            findings.append(cur)
            cur = None
        if starts:
            sev, dash, num, title = m.group(1), m.group(2), m.group(3), m.group(4)
            fid = f"{sev}{dash}{num}"
            cur = {"source": source_tag, "id": fid, "severity": sev, "title": title.rstrip("*").strip(), "lines": [line]}
        elif cur is not None:
            cur["lines"].append(line)
    if cur is not None:
        findings.append(cur)
    for f in findings:
        f["text"] = "\n".join(f["lines"]).rstrip()
        del f["lines"]
    # Keep only findings from the findings sections (skip closure tables etc. by requiring a body)
    return [f for f in findings if len(f["text"]) > len(f["title"]) + 10]


def build_queue(round_files):
    items = []
    for tag, key in (("expert-review", "expert-review"), ("collapse-hunt", "collapse-hunt")):
        for f in extract_findings(round_files[key], tag):
            items.append(f)
    # severity order, then expert review before collapse-hunt within a severity, then id order
    def keyf(f):
        num = int(re.search(r"(\d+)$", f["id"]).group(1))
        return (SEVERITY_ORDER.get(f["severity"], 9), 0 if f["source"] == "expert-review" else 1, num)
    items.sort(key=keyf)
    return items

# ---------------------------------------------------------------- plan units

class Plan:
    def __init__(self, text):
        self.text = text
        self.lines = text.split("\n")
        self.n = len(self.lines)
        self._index()

    def _index(self):
        L = self.lines
        self.sections = []  # (line0, level, title)
        for i, l in enumerate(L):
            m = re.match(r"^(#{2,4})\s+(.*)$", l)
            if m:
                self.sections.append((i, len(m.group(1)), m.group(2).strip()))
        # steps: "### Step N — title" to next "### Step" or a heading of level <= 2
        self.steps = {}
        step_starts = [(i, int(re.match(r"^### Step (\d+)\b", l).group(1))) for i, l in enumerate(L) if re.match(r"^### Step (\d+)\b", l)]
        for k, (i, n) in enumerate(step_starts):
            end = self.n
            for j in range(i + 1, self.n):
                if re.match(r"^### Step \d+\b", L[j]) or re.match(r"^## ", L[j]):
                    end = j
                    break
            self.steps[n] = (i, end)
        # bullet-entry units: a line starting the entry, running to the next entry of the same
        # family or a heading. Families: T-<s>-<k>, D-plan-<n>, Q<n>, Claim
        self.tests, self.decisions, self.register, self.claims = {}, {}, {}, []
        self.collapse = {}
        def bullet_units(start_re, same_family_re, store, key_fn):
            starts = [(i, start_re.match(l)) for i, l in enumerate(L) if start_re.match(l)]
            for i, m in starts:
                end = self.n
                for j in range(i + 1, self.n):
                    lj = L[j]
                    if same_family_re.match(lj) or re.match(r"^#{2,4} ", lj) or lj.strip() == "---":
                        end = j
                        break
                    # a new top-level bullet of another family also ends it
                    if re.match(r"^- \*\*", lj) and not same_family_re.match(lj):
                        end = j
                        break
                store[key_fn(m)] = (i, end)
        bullet_units(re.compile(r"^- \*\*T-(\d+)-(\d+)\b"), re.compile(r"^- \*\*T-\d+-\d+\b"), self.tests, lambda m: f"T-{m.group(1)}-{m.group(2)}")
        bullet_units(re.compile(r"^- \*\*D-plan-(\d+)\b"), re.compile(r"^- \*\*D-plan-\d+\b"), self.decisions, lambda m: int(m.group(1)))
        bullet_units(re.compile(r"^- \*\*Q(\d+)\b"), re.compile(r"^- \*\*Q\d+\b"), self.register, lambda m: int(m.group(1)))
        # collapse-test entries: "#### D-plan-N" to next "####" / "---" / "## "
        for i, l in enumerate(L):
            m = re.match(r"^#### D-plan-(\d+)\b", l)
            if m:
                end = self.n
                for j in range(i + 1, self.n):
                    if re.match(r"^#{2,4} ", L[j]) or L[j].strip() == "---":
                        end = j
                        break
                self.collapse[int(m.group(1))] = (i, end)
        # claims: "- **Claim.**" to next "- **Claim.**" / heading
        cstarts = [i for i, l in enumerate(L) if l.startswith("- **Claim.**")]
        for i in cstarts:
            end = self.n
            for j in range(i + 1, self.n):
                if L[j].startswith("- **Claim.**") or re.match(r"^#{2,4} ", L[j]) or L[j].strip() == "---":
                    end = j
                    break
            self.claims.append((i, end))
        # checkpoints: bullets in the Checkpoints section
        self.checkpoints = []
        cp = [i for i, lvl, t in self.sections if re.match(r"^\d+\.\s+Checkpoints", t)]
        if cp:
            i0 = cp[0]
            end0 = self.n
            for j in range(i0 + 1, self.n):
                if re.match(r"^## ", L[j]):
                    end0 = j
                    break
            starts = [i for i in range(i0, end0) if L[i].startswith("- **")]
            for k, i in enumerate(starts):
                end = starts[k + 1] if k + 1 < len(starts) else end0
                self.checkpoints.append((i, end))
        # generated regions: never authored, never in a packet
        self.generated = []
        for i, l in enumerate(L):
            m = re.match(r"^<!-- generated:(\w+) begin -->", l)
            if m:
                for j in range(i + 1, self.n):
                    if re.match(r"^<!-- generated:%s end -->" % m.group(1), L[j]):
                        self.generated.append((i, j + 1))
                        break

    def span_text(self, span):
        a, b = span
        return "\n".join(self.lines[a:b]).rstrip()

    def step_tests(self, n):
        a, b = self.steps[n]
        m = re.search(r"^tests:\s*\[(.*?)\]", "\n".join(self.lines[a:b]), re.M)
        if not m:
            return []
        return [t.strip() for t in m.group(1).split(",") if t.strip()]

    def step_sources(self, n):
        a, b = self.steps[n]
        return "\n".join(l for l in self.lines[a:b] if l.startswith("**Source.**") or l.startswith("**Verifies"))

    def unit_at_line(self, line1):
        """Classify a 1-based line number into (kind, key)."""
        i = line1 - 1
        for n, (a, b) in self.steps.items():
            if a <= i < b:
                return ("step", n)
        for k, (a, b) in self.tests.items():
            if a <= i < b:
                return ("test", k)
        for k, (a, b) in self.decisions.items():
            if a <= i < b:
                return ("decision", k)
        for k, (a, b) in self.collapse.items():
            if a <= i < b:
                return ("collapse", k)
        for k, (a, b) in self.register.items():
            if a <= i < b:
                return ("register", k)
        for (a, b) in self.claims:
            if a <= i < b:
                return ("claim", a)
        for (a, b) in self.checkpoints:
            if a <= i < b:
                return ("checkpoint", a)
        # nearest heading above
        h = None
        for (li, lvl, t) in self.sections:
            if li <= i:
                h = (li, t)
        return ("section", h[0] if h else 0)

    def section_span(self, line0):
        lvl = None
        for (li, l, t) in self.sections:
            if li == line0:
                lvl = l
        if lvl is None:
            return (line0, min(self.n, line0 + 40))
        end = self.n
        for (li, l, t) in self.sections:
            if li > line0 and l <= lvl:
                end = li
                break
        return (line0, end)


REF_PATTERNS = {
    "step": re.compile(r"\bStep (\d+)\b"),
    "test": re.compile(r"\bT-(\d+)-(\d+)\b"),
    "decision": re.compile(r"\bD-plan-(\d+)\b"),
    "register": re.compile(r"\bQ(\d+)\b"),
    "checkpoint": re.compile(r"\bCheckpoint (\d)\b"),
    "planline": re.compile(r"(?:plan-phase-a\.md|\bplan|\br\d+):(\d+)(?:[–-](\d+))?"),
}


def units_for_finding(plan, finding_text):
    """Return an ordered list of (label, span) plan units the finding touches.

    Touched steps come from the finding's plan line references (plan-phase-a.md:NNN,
    plan:NNN, ranges), from T-<step>-<n> ids, and from "Step N" named in the finding's
    title line; a bare "Step N" in the body is not used, because reviews also name the
    skill's own process steps ("expert-plan Step 8") and the finding's own id ("S1")
    would otherwise read as a step."""
    steps, tests, decisions, register, cps, extra = set(), set(), set(), set(), set(), []
    title = finding_text.split("\n", 1)[0]
    for m in REF_PATTERNS["step"].finditer(title):
        n = int(m.group(1))
        if n in plan.steps:
            steps.add(n)
    for m in REF_PATTERNS["test"].finditer(finding_text):
        k = f"T-{m.group(1)}-{m.group(2)}"
        if k in plan.tests:
            tests.add(k)
            if int(m.group(1)) in plan.steps:
                steps.add(int(m.group(1)))
    for m in REF_PATTERNS["decision"].finditer(finding_text):
        n = int(m.group(1))
        if n in plan.decisions or n in plan.collapse:
            decisions.add(n)
    for m in REF_PATTERNS["register"].finditer(finding_text):
        n = int(m.group(1))
        if n in plan.register:
            register.add(n)
    for m in REF_PATTERNS["planline"].finditer(finding_text):
        if re.match(r"^r\d", finding_text[m.start():m.start() + 2]):
            continue  # a prior revision's line, not the current plan
        first, last = int(m.group(1)), int(m.group(2) or m.group(1))
        seen = set()
        for ln in (first, last):
            kind, key = plan.unit_at_line(ln)
            if (kind, key) in seen:
                continue
            seen.add((kind, key))
            if kind == "step":
                steps.add(key)
            elif kind == "test":
                tests.add(key)
            elif kind in ("decision", "collapse"):
                decisions.add(key)
            elif kind == "register":
                register.add(key)
            elif kind == "claim":
                extra.append(("claim", key))
            elif kind == "checkpoint":
                cps.add(key)
            elif kind == "section":
                extra.append(("section", key))
    for n in sorted(steps):
        for t in plan.step_tests(n):
            if t in plan.tests:
                tests.add(t)
    step_re = {n: re.compile(r"\bStep %d\b(?!\d)" % n) for n in steps}
    test_re = {n: re.compile(r"\bT-%d-\d+\b" % n) for n in steps}
    def mentions(text):
        return any(r.search(text) for r in step_re.values()) or any(r.search(text) for r in test_re.values())
    for k, span in plan.decisions.items():
        if mentions(plan.span_text(span)):
            decisions.add(k)
    for k, span in plan.collapse.items():
        if mentions(plan.span_text(span)):
            decisions.add(k)
    for k, span in plan.register.items():
        if mentions(plan.span_text(span)):
            register.add(k)
    claim_spans = []
    for span in plan.claims:
        t = plan.span_text(span)
        m = re.search(r"\*\*Steps\.\*\*\s*([^*]+?)\s*\*\*Evidence", t, re.S)
        field = m.group(1) if m else ""
        if any(re.search(r"\b%d\b" % n, field) for n in steps) or any(("claim", span[0]) == e for e in extra):
            claim_spans.append(span)
    for span in plan.checkpoints:
        if mentions(plan.span_text(span)) or span[0] in cps:
            cps.add(span[0])
    cross = []
    for n2, (a, b) in plan.steps.items():
        if n2 in steps:
            continue
        for i in range(a, b):
            if mentions(plan.lines[i]):
                cross.append((n2, i))
    units = []
    for n in sorted(steps):
        units.append((f"Step {n}", plan.steps[n]))
    for k in sorted(tests, key=lambda s: tuple(int(x) for x in s[2:].split("-"))):
        units.append((k, plan.tests[k]))
    for k in sorted(decisions):
        if k in plan.decisions:
            units.append((f"D-plan-{k} (section 10)", plan.decisions[k]))
        if k in plan.collapse:
            units.append((f"D-plan-{k} (section 10A collapse test)", plan.collapse[k]))
    for span in claim_spans:
        units.append((f"Section 11 claim at line {span[0] + 1}", span))
    for k in sorted(register):
        units.append((f"Q{k}", plan.register[k]))
    for a in sorted(cps):
        span = next(s for s in plan.checkpoints if s[0] == a)
        units.append((f"Checkpoint bullet at line {a + 1}", span))
    for kind, key in extra:
        if kind == "section":
            units.append((f"Section at line {key + 1}", plan.section_span(key)))
    return units, cross, sorted(steps)

# ---------------------------------------------------------------- sources by ID

# An identifier is a short letter prefix, optional dash, digits, optional suffix: AD-9,
# FR-B5, AC-2a, V12, L11, OL-C3, D-9, NF-1, P8, R-4 … — whatever vocabulary the project's
# documents use. It is cited by a finding or a step's Source line, and defined where a
# document carries it as a heading, a bullet, or a table row.
ID_RE = re.compile(r"(?<![\w-])([A-Z]{1,4}-?[A-Z]?\d{1,3}[a-z]?(?:-[a-z]+)?)(?![\w-])")
PLAN_INTERNAL = re.compile(r"^(T-?\d+|S-?\d+|M-?\d+|m-?\d+|SY-?\d+|Q\d+|D-plan-\d+)$")


def collect_ids(*texts):
    """Identifier-shaped tokens, excluding the plan's own vocabulary (steps, tests,
    register entries, decisions) and review finding ids, which are units, not sources."""
    ids = []
    for t in texts:
        for m in ID_RE.finditer(t):
            i = m.group(1)
            if PLAN_INTERNAL.match(i):
                continue
            if i not in ids:
                ids.append(i)
    return ids


def _block_from(lines, i, stop_re):
    end = len(lines)
    for j in range(i + 1, len(lines)):
        if stop_re.match(lines[j]):
            end = j
            break
    return "\n".join(lines[i:end]).rstrip()


def _paragraph(lines, i):
    a = i
    while a > 0 and lines[a - 1].strip() != "":
        a -= 1
    b = i
    while b < len(lines) and lines[b].strip() != "":
        b += 1
    return "\n".join(lines[a:b]).rstrip()


def source_documents(plan_path, root=PROJECT_DIR):
    """Every markdown document under the project except plans, reviews, and this loop,
    ordered by how often the plan cites each one (its basename), so an identifier that
    several documents carry resolves from the document the plan actually rests on."""
    plan_text = read_text(plan_path) if plan_path and os.path.isfile(plan_path) else ""
    docs = []
    for path in markdown_files(root):
        low = path.lower()
        if path == plan_path or "/plans/" in low or REVIEW_NAME.search(os.path.basename(path)) or "/reviews/" in low or "correction-loop" in low or "/.claude/" in low:
            continue
        docs.append(path)
    return sorted(docs, key=lambda p: (-plan_text.count(os.path.basename(p)), p))


_SRC_CACHE = {}


def source_section(ident, docs):
    """Find where a document defines an identifier: a heading `### ID …`, a bullet
    `- **ID …`, a bold paragraph `**ID …`, or a table row `| ID |` / `| **ID …`."""
    key = (ident, tuple(docs))
    if key in _SRC_CACHE:
        return _SRC_CACHE[key]
    esc = re.escape(ident)
    head = re.compile(r"^(#{1,4})\s+%s\b" % esc)
    bullet = re.compile(r"^- \*\*%s\b" % esc)
    bold = re.compile(r"^\*\*%s\b" % esc)
    row = re.compile(r"^\|\s*(?:\*\*)?%s\b" % esc)
    out = None
    for path in docs:
        L = read_text(path).split("\n")
        rel = os.path.relpath(path, PROJECT_DIR)
        for i, l in enumerate(L):
            hm = head.match(l)
            if hm:
                lvl = len(hm.group(1))
                out = (rel, _block_from(L, i, re.compile(r"^#{1,%d}\s" % lvl)))
                break
            if bullet.match(l):
                out = (rel, _block_from(L, i, re.compile(r"^- \*\*|^#{1,4}\s|^\s*$")))
                break
            if bold.match(l) or row.match(l):
                out = (rel, _paragraph(L, i))
                break
        if out:
            break
    _SRC_CACHE[key] = out
    return out

# ---------------------------------------------------------------- packet

def build_packet(plan, finding, issue_no, total, docs):
    units, cross, steps = units_for_finding(plan, finding["text"])
    src_text = finding["text"] + "\n" + "\n".join(plan.step_sources(n) for n in steps)
    ids = collect_ids(src_text)
    parts = []
    head = [
        f"# Correction loop — issue {issue_no} of {total}",
        "",
        f"Finding {finding['id']} from the round's {finding['source']}. The finding, every plan unit it touches, and the spec/architecture material those units cite are all below. Read all parts whole.",
        "",
        "## 1. The finding, verbatim",
        "",
        finding["text"],
        "",
        "## 2. Plan units this finding touches (full current text)",
        "",
    ]
    body = list(head)
    for label, span in units:
        body += [f"### Unit: {label} (plan lines {span[0] + 1}–{span[1]})", "", plan.span_text(span), ""]
    if cross:
        body += ["### Lines in other steps that name a touched step", ""]
        for n2, i in cross:
            body.append(f"- Step {n2}, line {i + 1}: {plan.lines[i].strip()}")
        body.append("")
    body += ["## 3. Spec, architecture and ledger material cited by the finding and the touched steps", ""]
    missing = []
    for ident in ids:
        s = source_section(ident, docs)
        if s is None:
            missing.append(ident)
            continue
        body += [f"### {ident} (from {s[0]})", "", s[1], ""]
    missing = [i for i in missing if "-" in i or re.match(r"^[A-Z]\d+$", i)]  # report id-shaped tokens only
    if missing:
        body += ["Identifiers cited but defined in no project document under that name: " + ", ".join(missing), ""]
    body += [
        "## 4. What the loop requires for this issue",
        "",
        f"- state/proposal.md: for every unit listed in section 2, the corrected text or the statement that it needs no change, with the spec/architecture line (from section 3 or the documents) that decides it, and the probe for any executed claim. The plan cannot be edited until this file exists.",
        "- The edits: exactly what the proposal states, nothing else; generated regions are regenerated by the derivation script, not edited.",
        "- state/selfcheck.md: the gate commands run (`derive-plan-sections.mjs --check`, the probe runner for any probe touched) with their output, and a read-after-edit attestation naming every unit of section 2 with its first line after the edit.",
        "- Ending the turn runs the judge; a failure names the step only.",
        "",
    ]
    text = "\n".join(body)
    lines = text.split("\n")
    for i in range(0, len(lines), PACKET_PART_LINES):
        parts.append("\n".join(lines[i:i + PACKET_PART_LINES]))
    return parts, [u[0] for u in units], ids, missing


def write_packet(parts):
    for p in packet_parts():
        os.remove(p)
    paths = []
    for i, content in enumerate(parts, 1):
        path = f"{PACKET_PREFIX}.part{i}.md"
        with open(path, "w", encoding="utf-8") as f:
            f.write(content + ("\n" if not content.endswith("\n") else ""))
        paths.append(path)
    return paths


def transcript_line_count(transcript_path):
    try:
        with open(transcript_path, "rb") as f:
            return sum(1 for _ in f)
    except OSError:
        return 0


def serve_issue(queue, index, transcript_path, plan_path):
    plan = Plan(read_text(plan_path))
    finding = queue[index]
    parts, unit_labels, ids, missing = build_packet(plan, finding, index + 1, len(queue), source_documents(plan_path))
    paths = write_packet(parts)
    with open(PLAN_SNAPSHOT, "w", encoding="utf-8") as f:
        f.write(plan.text)
    for p in (PROPOSAL, SELFCHECK):
        if os.path.isfile(p):
            os.remove(p)
    write_json(CURRENT, {
        "plan_path": plan_path,
        "index": index,
        "total": len(queue),
        "finding_id": finding["id"],
        "source": finding["source"],
        "served_at": time.time(),
        "transcript_path": transcript_path,
        "transcript_offset": transcript_line_count(transcript_path),
        "packet_parts": paths,
        "units": unit_labels,
        "source_ids": ids,
        "missing_ids": missing,
    })
    log(f"served issue {index + 1}/{len(queue)} {finding['id']} ({finding['source']}); units={len(unit_labels)} parts={len(paths)}")
    return paths, unit_labels

# ---------------------------------------------------------------- transcript reads

def tool_uses_since(transcript_path, offset):
    """Yield (name, input) for every tool_use block after the given line offset."""
    out = []
    try:
        with open(transcript_path, "r", encoding="utf-8", errors="replace") as f:
            for k, line in enumerate(f):
                if k < offset:
                    continue
                try:
                    d = json.loads(line)
                except json.JSONDecodeError:
                    continue
                if d.get("type") != "assistant":
                    continue
                c = (d.get("message") or {}).get("content")
                if not isinstance(c, list):
                    continue
                for b in c:
                    if isinstance(b, dict) and b.get("type") == "tool_use":
                        out.append((b.get("name"), b.get("input") or {}))
    except OSError:
        pass
    return out


def packet_read_whole(tool_uses, part_path):
    """True if some tool call read the whole part: Read without offset/limit, or a
    Bash `cat` of the path with no range-limiting filter."""
    base = os.path.basename(part_path)
    for name, inp in tool_uses:
        if name == "Read" and str(inp.get("file_path", "")).endswith(base):
            if not inp.get("offset") and not inp.get("limit"):
                return True
        if name == "Bash":
            cmd = str(inp.get("command", ""))
            if base in cmd and re.search(r"\bcat\b", cmd) and not re.search(r"\bhead\b|\btail\b|sed -n|\bgrep\b|\bawk\b|\|", cmd):
                return True
    return False

# ---------------------------------------------------------------- gate command

def run_derive_check(plan_path):
    try:
        p = subprocess.run(["node", DERIVE_SCRIPT, plan_path, "--check"], capture_output=True, text=True, timeout=120, cwd=PROJECT_DIR)
        return p.returncode, (p.stdout + p.stderr).strip()
    except (OSError, subprocess.TimeoutExpired) as e:
        return 99, repr(e)


def plan_diff(plan_path):
    try:
        p = subprocess.run(["git", "diff", "--no-index", "--", PLAN_SNAPSHOT, plan_path], capture_output=True, text=True, timeout=60)
        return p.stdout
    except (OSError, subprocess.TimeoutExpired) as e:
        return f"(diff unavailable: {e!r})"
