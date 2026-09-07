#!/usr/bin/env python3
"""PostToolUse hook (matcher: Agent). Fires when a subagent returns. When the newest
review round has both its files and has not been processed, queues every finding
where the agent cannot read it, serves issue 1 as a packet, records the tooling
hashes, and injects a factual notice as additionalContext. Otherwise does nothing.

    serve.py --dry-run OUTDIR   build the queue and the first packet into OUTDIR
                                without activating the loop (for testing)
"""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import loop_lib as L

GUARD_ENV = "CORRECTION_LOOP_JUDGE_RUN"


def emit(obj):
    print(json.dumps(obj))
    sys.exit(0)


def start_loop(transcript_path):
    n, files = L.find_round_pair()
    done = L.read_json(L.DONE, {"rounds": []})
    if n is None or n in done.get("rounds", []):
        return None
    queue = L.build_queue(files)
    if not queue:
        return None
    L.write_json(L.QUEUE, {"round": n, "files": files, "items": queue})
    L.record_hashes()
    paths, units = L.serve_issue(queue, 0, transcript_path)
    L.log(f"loop started for round {n}: {len(queue)} findings")
    return n, len(queue), queue[0], paths, units


def notice(n, total, finding, paths, units):
    return (
        f"Correction loop is active for review round {n}: {total} findings are queued and are served one at a time. "
        f"Issue 1 of {total} ({finding['id']}, {finding['source']}) is served now; its packet is "
        + ", ".join(os.path.relpath(p, L.PROJECT_DIR) for p in paths)
        + f" ({len(paths)} part(s), read each whole). The packet holds the finding verbatim, the full text of the {len(units)} plan units it touches, "
        "and the spec/architecture sections those units cite. While the loop is active the review files and the loop's own files are not readable, "
        "the loop tooling is not editable, and the plan is not editable until state/proposal.md exists. Ending the turn runs the judge, "
        "which rules in order (packet read whole; proposal covers every unit and re-derives from the cited sources; edits implement the proposal exactly; "
        "self-check complete) and reports only the failed step number."
    )


def main():
    if "--dry-run" in sys.argv:
        out = sys.argv[sys.argv.index("--dry-run") + 1]
        os.makedirs(out, exist_ok=True)
        n, files = L.find_round_pair()
        queue = L.build_queue(files)
        plan = L.Plan(L.read_text(L.PLAN_PATH))
        with open(os.path.join(out, "queue.json"), "w") as f:
            json.dump({"round": n, "items": [{k: v for k, v in q.items() if k != "text"} for q in queue]}, f, indent=2)
        for idx, finding in enumerate(queue):
            parts, units, ids, missing = L.build_packet(plan, finding, idx + 1, len(queue))
            with open(os.path.join(out, f"packet-{idx + 1:02d}-{finding['id']}.md"), "w") as f:
                f.write("\n\n".join(parts))
            print(f"{idx + 1:2d} {finding['source']:14s} {finding['id']:6s} units={len(units):2d} ids={len(ids):2d} missing={','.join(missing) or '-'} lines={sum(p.count(chr(10)) for p in parts)}")
        return
    if os.environ.get(GUARD_ENV) == "1":
        sys.exit(0)
    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        data = {}
    if L.loop_active():
        sys.exit(0)
    res = start_loop(data.get("transcript_path", ""))
    if res is None:
        sys.exit(0)
    n, total, finding, paths, units = res
    emit({"hookSpecificOutput": {"hookEventName": "PostToolUse", "additionalContext": notice(n, total, finding, paths, units)}})


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception as exc:  # a crash here must be visible, never a silent no-op
        L.log(f"serve.py crashed: {exc!r}")
        emit({"systemMessage": f"correction-loop serve.py crashed: {exc!r}"})
