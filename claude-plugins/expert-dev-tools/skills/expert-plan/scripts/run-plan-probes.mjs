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
//     --layout DIR  reuse a prepared layout directory instead of preparing a
//                   fresh temporary one
//     --only NAME   run a single probe
//     --record      write each probe's stdout as its expectation (authoring)

import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { probeDirFor } from './derive-plan-sections.mjs';

function fail(msg) {
  process.stderr.write(`run-plan-probes: ${msg}\n`);
  process.exit(2);
}

const args = process.argv.slice(2);
let layoutArg = null;
let only = null;
let record = false;
const operands = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--layout') layoutArg = args[++i];
  else if (a === '--only') only = args[++i];
  else if (a === '--record') record = true;
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
let failures = 0;
for (const f of probes) {
  const name = f.replace(/\.(sh|mjs|cjs)$/, '');
  if (only && name !== only) continue;
  const cmd = f.endsWith('.sh') ? ['bash', [join(dir, f)]] : ['node', [join(dir, f)]];
  const r = spawnSync(cmd[0], cmd[1], { cwd: layout, encoding: 'utf8', env, timeout: 600000 });
  const out = (r.stdout || '').replace(/\s+$/, '');
  const expPath = join(dir, 'expected', `${name}.txt`);
  if (r.status !== 0) {
    failures++;
    process.stdout.write(`FAIL ${name}: exit ${r.status}\n${(r.stderr || '').trim()}\n${out}\n`);
    continue;
  }
  if (record) {
    mkdirSync(join(dir, 'expected'), { recursive: true });
    writeFileSync(expPath, out + '\n');
    process.stdout.write(`recorded ${name}\n`);
    continue;
  }
  if (name.includes('.optional') && /^SKIPPED:/.test(out)) {
    process.stdout.write(`skip ${name}: ${out.split('\n')[0]}\n`);
    continue;
  }
  if (!existsSync(expPath)) {
    failures++;
    process.stdout.write(`FAIL ${name}: no expectation recorded at ${expPath}\n`);
    continue;
  }
  const expected = readFileSync(expPath, 'utf8').replace(/\s+$/, '');
  if (out !== expected) {
    failures++;
    process.stdout.write(`FAIL ${name}: output drifted from ${expPath}\n--- expected\n${expected}\n--- actual\n${out}\n`);
    continue;
  }
  process.stdout.write(`ok ${name}\n`);
}
if (failures > 0) {
  process.stdout.write(`${failures} probe(s) failed\n`);
  process.exit(1);
}
process.stdout.write(record ? 'expectations recorded\n' : 'all probes match their recorded expectations\n');
