#!/usr/bin/env python3
"""Execute the plan's evidence probes and compare each against its recorded output.

Every executed claim in docs/plans/plan-phase-a.md §11.4 is a script under
probes/ whose canonical output is committed under expected/. A claim that is
not reproduced by its probe fails this runner, so the plan cannot carry an
execution claim that no longer holds. Probes named *.optional.* may print a
first line `SKIPPED: <reason>` when their precondition (network, the `claude`
CLI, `unshare`) is absent; a skip is reported, never counted as a pass.

Usage: python3 run_probes.py [--layout DIR] [--only NAME] [--record]
  --layout DIR  reuse a prepared layout directory (default: a temp dir where
                `npm ci` installs layout/package.json's exact pins)
  --record      overwrite expected/<name>.txt with the observed output
"""
import argparse, os, shutil, subprocess, sys, tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent


def prepare_layout(explicit):
    if explicit:
        return Path(explicit)
    d = Path(tempfile.mkdtemp(prefix="ctxoracle-probe-layout-"))
    for f in ("package.json", "package-lock.json", "tsconfig.json"):
        shutil.copy(HERE / "layout" / f, d / f)
    (d / "src").mkdir(); (d / "test").mkdir()
    r = subprocess.run(["npm", "ci", "--loglevel", "error"], cwd=d, capture_output=True, text=True)
    if r.returncode != 0:
        print("layout npm ci failed:\n" + r.stderr); sys.exit(2)
    return d


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--layout"); ap.add_argument("--only"); ap.add_argument("--record", action="store_true")
    a = ap.parse_args()
    layout = prepare_layout(a.layout)
    env = dict(os.environ, PROBE_LAYOUT=str(layout), PROBE_DIR=str(HERE))
    results = []
    for probe in sorted((HERE / "probes").iterdir()):
        if a.only and a.only not in probe.name:
            continue
        name = probe.stem.replace(".optional", "")
        optional = ".optional" in probe.name
        cmd = {"sh": ["bash", str(probe)], "mjs": ["node", str(probe)], "cjs": ["node", str(probe)]}[probe.suffix[1:]]
        r = subprocess.run(cmd, cwd=layout, capture_output=True, text=True, env=env, timeout=600)
        out = (r.stdout or "").rstrip() + "\n"
        exp_path = HERE / "expected" / f"{name}.txt"
        if a.record:
            exp_path.write_text(out); status = "recorded"
        elif out.startswith("SKIPPED:") and optional:
            status = "skipped"
        elif exp_path.exists() and exp_path.read_text() == out:
            status = "pass"
        else:
            status = "FAIL"
        results.append((name, status))
        print(f"[{status:8}] {name}")
        if status == "FAIL":
            print("--- observed ---\n" + out + "--- expected ---\n" + (exp_path.read_text() if exp_path.exists() else "<none>") + ("--- stderr ---\n" + r.stderr[-2000:] if r.stderr else ""))
        elif status == "skipped":
            print("           " + out.splitlines()[0])
    fails = [n for n, s in results if s == "FAIL"]
    print(f"\n{len(results)} probes: {sum(1 for _, s in results if s == 'pass')} pass, {sum(1 for _, s in results if s == 'skipped')} skipped, {len(fails)} failed")
    if not a.layout:
        shutil.rmtree(layout, ignore_errors=True)
    sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
