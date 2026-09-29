// pow-samples.mjs <n> — F5-14: V8's 2 ** x at exponents AD-13 forms: x = d / (86,400 · h)
// for integer seconds d and a seeded or floor h, |x| <= 1,022. Prints "x y" per line,
// each double in its shortest round-trip form; pow-check.py compares y with 2^x exactly.
let seed = 99;
const rnd = () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const n = Number(process.argv[2] ?? 100000), out = [];
for (let i = 0; i < n; i++) {
  const h = [1.787, 20, 365][i % 3];
  const lim = Math.floor(1022 * 86400 * h);
  const d = Math.floor((rnd() * 2 - 1) * lim);
  const x = d / (86400 * h);
  out.push(`${x} ${2 ** x}`);
}
console.log(out.join('\n'));
