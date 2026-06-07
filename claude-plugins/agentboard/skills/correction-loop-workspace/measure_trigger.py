#!/usr/bin/env python3
"""Windows-safe trigger measurement for a skill description.

The skill-creator's run_eval.py uses select.select() on subprocess pipes, which
raises WinError 10038 on Windows (select only works on sockets there). This script
reproduces run_eval's detection logic but Windows-safe: a reader thread does blocking
readline (no select), and we kill the claude process as soon as the first tool
decision is made (mirroring run_eval's early --include-partial-messages detection).

Detection matches the command-name PREFIX 'correction-loop-skill-' rather than an exact
uid: under parallel workers several temp command files (all carrying the SAME description)
coexist, and claude may fire any of them — every one represents "this description
triggered", so prefix match is the correct signal.

Usage:
  python measure_trigger.py <eval_set.json> <description_file.txt> [--runs N] [--limit N] [--workers N]
"""
import argparse, json, os, subprocess, sys, threading, uuid
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

SKILL_NAME = "correction-loop"
PREFIX = "correction-loop-skill-"


def find_project_root() -> Path:
    cur = Path.cwd()
    for parent in [cur, *cur.parents]:
        if (parent / ".claude").is_dir():
            return parent
    return cur


def _decide(line: str, state: dict) -> bool | None:
    """Return True/False once a decision is reached, else None to keep reading."""
    line = line.strip()
    if not line:
        return None
    try:
        ev = json.loads(line)
    except json.JSONDecodeError:
        return None
    t = ev.get("type")
    if t == "stream_event":
        se = ev.get("event", {})
        st = se.get("type")
        if st == "content_block_start":
            cb = se.get("content_block", {})
            if cb.get("type") == "tool_use":
                nm = cb.get("name", "")
                if nm in ("Skill", "Read"):
                    state["pending"] = nm
                    state["accum"] = ""
                else:
                    return False  # first tool is something else -> not triggered
        elif st == "content_block_delta" and state.get("pending"):
            d = se.get("delta", {})
            if d.get("type") == "input_json_delta":
                state["accum"] += d.get("partial_json", "")
                if PREFIX in state["accum"]:
                    return True
        elif st in ("content_block_stop", "message_stop"):
            if state.get("pending"):
                return PREFIX in state["accum"]
            if st == "message_stop":
                return False
    elif t == "assistant":
        for c in ev.get("message", {}).get("content", []):
            if c.get("type") == "tool_use":
                nm = c.get("name", "")
                inp = c.get("input", {}) or {}
                if nm == "Skill" and PREFIX in str(inp.get("skill", "")):
                    return True
                if nm == "Read" and PREFIX in str(inp.get("file_path", "")):
                    return True
                return False
    elif t == "result":
        return False
    return None


def run_once(query: str, description: str, project_root: Path) -> bool:
    uid = uuid.uuid4().hex[:8]
    clean = f"{SKILL_NAME}-skill-{uid}"
    cmddir = project_root / ".claude" / "commands"
    cmddir.mkdir(parents=True, exist_ok=True)
    cmdfile = cmddir / f"{clean}.md"
    indented = "\n  ".join(description.split("\n"))
    cmdfile.write_text(
        f"---\ndescription: |\n  {indented}\n---\n\n# {SKILL_NAME}\n\nThis skill handles: {description}\n",
        encoding="utf-8",
    )
    env = {k: v for k, v in os.environ.items() if k != "CLAUDECODE"}
    proc = subprocess.Popen(
        ["claude", "-p", query, "--output-format", "stream-json", "--verbose", "--include-partial-messages"],
        stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True, encoding="utf-8", errors="replace",
        cwd=str(project_root), env=env,
    )
    holder = {"result": False}

    def reader():
        state = {}
        try:
            for line in proc.stdout:
                d = _decide(line, state)
                if d is not None:
                    holder["result"] = d
                    return
        except Exception:
            pass

    th = threading.Thread(target=reader, daemon=True)
    th.start()
    th.join(timeout=90)
    try:
        proc.kill()
    except Exception:
        pass
    try:
        if cmdfile.exists():
            cmdfile.unlink()
    except Exception:
        pass
    return holder["result"]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("eval_set")
    ap.add_argument("description_file")
    ap.add_argument("--runs", type=int, default=3)
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--workers", type=int, default=4)
    args = ap.parse_args()

    queries = json.loads(Path(args.eval_set).read_text(encoding="utf-8"))
    if args.limit:
        pos = [q for q in queries if q["should_trigger"]][: max(1, args.limit // 2)]
        neg = [q for q in queries if not q["should_trigger"]][: max(1, args.limit - len(pos))]
        queries = pos + neg
    description = Path(args.description_file).read_text(encoding="utf-8").strip()
    project_root = find_project_root()

    # Clean any stale temp command files from prior crashed runs.
    for stale in (project_root / ".claude" / "commands").glob(f"{PREFIX}*.md"):
        try:
            stale.unlink()
        except Exception:
            pass

    print(f"project_root={project_root}  queries={len(queries)}  runs={args.runs}  workers={args.workers}", file=sys.stderr)

    tasks = [(item, ri) for item in queries for ri in range(args.runs)]
    trig = {q["query"]: [] for q in queries}
    with ThreadPoolExecutor(max_workers=args.workers) as ex:
        fut = {ex.submit(run_once, t[0]["query"], description, project_root): t for t in tasks}
        for f in as_completed(fut):
            item = fut[f][0]
            trig[item["query"]].append(f.result())

    results, passed = [], 0
    pos_pass = neg_pass = pos_total = neg_total = 0
    for q in queries:
        ts = trig[q["query"]]
        rate = sum(ts) / len(ts) if ts else 0.0
        st = q["should_trigger"]
        ok = (rate >= 0.5) if st else (rate < 0.5)
        passed += ok
        if st:
            pos_total += 1; pos_pass += ok
        else:
            neg_total += 1; neg_pass += ok
        results.append({"query": q["query"], "should_trigger": st, "triggers": sum(ts), "runs": len(ts), "rate": rate, "pass": ok})
        print(f"  [{'PASS' if ok else 'FAIL'}] {sum(ts)}/{len(ts)} exp={st}: {q['query'][:66]}", file=sys.stderr)
    print(f"TOTAL {passed}/{len(results)}  (should-trigger {pos_pass}/{pos_total}, should-not {neg_pass}/{neg_total})", file=sys.stderr)
    print(json.dumps({"passed": passed, "total": len(results),
                      "pos_pass": pos_pass, "pos_total": pos_total,
                      "neg_pass": neg_pass, "neg_total": neg_total, "results": results}, indent=2))


if __name__ == "__main__":
    main()
