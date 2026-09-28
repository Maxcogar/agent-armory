// child_probe.mjs <repo> — what the early-exit reindex child costs off the event
// path: resolve HEAD through git (rev-parse, symbolic-ref) and compare, nothing written.
import { spawnSync } from 'node:child_process';
const repo = process.argv[2];
const t0 = performance.now();
const h = spawnSync('git', ['-C', repo, 'rev-parse', '--verify', '-q', 'HEAD'], { encoding: 'utf8' });
const r = spawnSync('git', ['-C', repo, 'symbolic-ref', '-q', 'HEAD'], { encoding: 'utf8' });
console.log(JSON.stringify({ head: h.stdout.trim().slice(0, 12), ref: r.stdout.trim(), gitMs: +(performance.now() - t0).toFixed(1) }));
