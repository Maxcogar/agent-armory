#!/usr/bin/env node
// run-plan-probes.mjs — re-execute a plan's executed evidence and diff it
// against the recorded expectation.
//
// A plan's "Verification of factual claims" section (output section 11) may
// rest a claim on something that was executed: a compiler's verdict, a runtime
// behaviour, a package layout, a timing schedule. Transcribing one run into
// prose is the form that drifts — the prose outlives the environment and no
// reviewer can re-run a sentence. A probe is that execution kept as a script,
// beside the plan, with its output recorded; the plan cites it as
// `probe:<name>` and derive-plan-sections.mjs checks the citation both ways.
// This script runs the probes and fails on any drift.
//
// Layout, relative to the plan file <dir>/<stem>.md:
//   <dir>/<stem>.probes/
//     NN-name.sh | NN-name.mjs | NN-name.cjs   probes, run in lexical order;
//                                              a name containing ".optional."
//                                              may print "SKIPPED: <why>" as
//                                              its first line when its
//                                              environment is absent
//     expected/NN-name.txt                     the recorded stdout
//     layout/prepare.sh                        optional; run once with the
//                                              layout directory as $1 before
//                                              any probe (e.g. npm ci into it)
//
// Each probe runs with cwd = the layout directory and the environment
// variables PROBE_DIR (the probes directory) and PROBE_LAYOUT (the layout
// directory). Its stdout, trailing whitespace trimmed, must equal the recorded
// expectation; a non-zero exit is a failure regardless of output.
//
// Usage:
//   node run-plan-probes.mjs <plan.md> [--layout DIR] [--only NAME] [--record]
//                           [--repeat N] [--load K]
//     --layout DIR  reuse a prepared layout directory instead of preparing a
//                   fresh temporary one
//     --only NAME   run a single probe
//     --record      write each probe's stdout as its expectation (authoring)
//     --repeat N    run every probe N times; each run must match (a probe
//                   whose output depends on timing shows itself here)
//     --load K      keep K CPU-bound sibling processes busy for the whole run,
//                   so a probe that only holds on an idle machine fails here
//                   rather than on a loaded CI runner

import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { probeDirFor } from './derive-plan-sections.mjs';

function fail(msg) {
  process.stderr.write(`run-plan-probes: ${msg}\n`);
  process.exit(2);
}

const args = process.argv.slice(2);
let layoutArg = null;
let only = null;
let record = false;
let repeat = 1;
let load = 0;
const operands = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--layout') layoutArg = args[++i];
  else if (a === '--only') only = args[++i];
  else if (a === '--record') record = true;
  else if (a === '--repeat') repeat = Math.max(1, Number(args[++i]) || 1);
  else if (a === '--load') load = Math.max(0, Number(args[++i]) || 0);
  else if (a.startsWith('-')) fail(`unknown flag '${a}'`);
  else operands.push(a);
}
if (operands.length !== 1) fail('usage: run-plan-probes.mjs <plan.md> [--layout DIR] [--only NAME] [--record]');
const planPath = operands[0];
if (!existsSync(planPath)) fail(`cannot read ${planPath}`);
const dir = resolve(probeDirFor(planPath));
if (!existsSync(dir)) fail(`no probes directory at ${dir}`);

const probes = readdirSync(dir).filter((f) => /\.(sh|mjs|cjs)$/.test(f)).sort();
if (probes.length === 0) fail(`${dir} holds no probes`);

let layout = layoutArg ? resolve(layoutArg) : null;
if (!layout) {
  layout = mkdtempSync(join(tmpdir(), 'plan-probe-layout-'));
  const prep = join(dir, 'layout', 'prepare.sh');
  if (existsSync(prep)) {
    const r = spawnSync('bash', [prep, layout], { cwd: dir, encoding: 'utf8', env: { ...process.env, PROBE_DIR: dir, PROBE_LAYOUT: layout } });
    if (r.status !== 0) fail(`layout preparation failed:\n${r.stdout}${r.stderr}`);
  }
}

const env = { ...process.env, PROBE_DIR: dir, PROBE_LAYOUT: layout };
const hogs = [];
for (let i = 0; i < load; i++) {
  hogs.push(spawn(process.execPath, ['-e', 'let x = 0; for (;;) { x = (x * 1103515245 + 12345) % 2147483648; }'], { stdio: 'ignore' }));
}
if (load > 0) process.stdout.write(`load: ${load} CPU-bound sibling process(es) running for the whole run\n`);
let failures = 0;
try {
  for (const f of probes) {
    const name = f.replace(/\.(sh|mjs|cjs)$/, '');
    if (only && name !== only) continue;
    const cmd = f.endsWith('.sh') ? ['bash', [join(dir, f)]] : ['node', [join(dir, f)]];
    const expPath = join(dir, 'expected', `${name}.txt`);
    let failed = false;
    for (let run = 1; run <= repeat && !failed; run++) {
      const tag = repeat > 1 ? `${name} (run ${run}/${repeat})` : name;
      const r = spawnSync(cmd[0], cmd[1], { cwd: layout, encoding: 'utf8', env, timeout: 600000 });
      const out = (r.stdout || '').replace(/\s+$/, '');
      if (r.status !== 0) {
        failed = true;
        process.stdout.write(`FAIL ${tag}: exit ${r.status}\n${(r.stderr || '').trim()}\n${out}\n`);
        break;
      }
      if (record) {
        mkdirSync(join(dir, 'expected'), { recursive: true });
        writeFileSync(expPath, out + '\n');
        process.stdout.write(`recorded ${name}\n`);
        break;
      }
      if (name.includes('.optional') && /^SKIPPED:/.test(out)) {
        process.stdout.write(`skip ${tag}: ${out.split('\n')[0]}\n`);
        break;
      }
      if (!existsSync(expPath)) {
        failed = true;
        process.stdout.write(`FAIL ${tag}: no expectation recorded at ${expPath}\n`);
        break;
      }
      const expected = readFileSync(expPath, 'utf8').replace(/\s+$/, '');
      if (out !== expected) {
        failed = true;
        process.stdout.write(`FAIL ${tag}: output drifted from ${expPath}\n--- expected\n${expected}\n--- actual\n${out}\n`);
        break;
      }
      if (run === repeat) process.stdout.write(`ok ${name}${repeat > 1 ? ` (${repeat} runs)` : ''}\n`);
    }
    if (failed) failures++;
  }
} finally {
  for (const h of hogs) h.kill();
}
if (failures > 0) {
  process.stdout.write(`${failures} probe(s) failed\n`);
  process.exit(1);
}
process.stdout.write(record ? 'expectations recorded\n' : 'all probes match their recorded expectations\n');
