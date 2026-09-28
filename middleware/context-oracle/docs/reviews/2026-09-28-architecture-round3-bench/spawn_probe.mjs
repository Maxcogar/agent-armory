// spawn_probe.mjs — the event path's cost of one detached, unref'd spawn of the
// early-exit child (n=200, 20 ms apart); the child itself runs off the path.
import { spawn } from 'node:child_process';
const ts = [];
for (let i = 0; i < 200; i++) {
  const t0 = performance.now();
  const c = spawn(process.execPath, ['child_probe.mjs', '/home/user/agent-armory'], { detached: true, stdio: 'ignore' });
  c.unref();
  ts.push(performance.now() - t0);
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 20);
}
ts.sort((a, b) => a - b);
const q = (p) => ts[Math.min(ts.length - 1, Math.floor(p * ts.length))].toFixed(3);
console.log(`n=${ts.length} p50=${q(0.5)} p95=${q(0.95)} max=${ts[ts.length - 1].toFixed(3)} ms`);
