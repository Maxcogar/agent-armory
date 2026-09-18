// Claim (Step 13, T-13-1, Q56): the co-change miner reads history with
// `git log -z --numstat --format=%x1e%H%x00%at%x00` and parses it on the ONLY
// delimiter git guarantees absent from a path — NUL (git forbids NUL and `/` in
// a pathname, nothing else). Splitting the stream on NUL:
//   (1) every path field is RAW — no core.quotePath C-quoting of any byte — so a
//       field equals the indexer's readdir key directly;
//   (2) a rename is TWO separate NUL fields (the entry `<added>\t<deleted>\t`
//       with an empty path, then `<old>\0<new>\0`), never `old => new`, so a real
//       file whose name contains ` => ` is one field, never a phantom rename;
//   (3) a binary entry is `-\t-\t<path>`.
// The `%x1e` Record Separator the format prepends marks a commit header ONLY when
// it BEGINS a NUL-delimited field and is followed by exactly 40 hex (`%H`). A
// path is never mistaken for a header: a numstat entry field always begins with
// its `<added>` count, and a rename's old/new fields are consumed positionally —
// so a path that CONTAINS or BEGINS WITH the RS byte `0x1e` (a legal filename
// byte git emits raw under -z) is parsed correctly, not split mid-path. This
// probe plants that exact case (`we<0x1e>ird.txt`) alongside the other classes,
// with core.quotePath at its DEFAULT (on).
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const d = mkdtempSync(join(tmpdir(), 'numstat-z-'));
const git = (...a) => execFileSync('git', ['-C', d, ...a], { encoding: 'buffer' });
const wr = (rel, byte) => writeFileSync(Buffer.concat([Buffer.from(d + '/'), Buffer.from(rel)]), Buffer.from([byte]));
try {
  git('init', '-q');
  git('config', 'user.email', 'p@x');
  git('config', 'user.name', 'p');
  git('config', 'commit.gpgsign', 'false');
  // core.quotePath deliberately LEFT AT DEFAULT (on) to prove -z overrides it.

  wr('anchor.txt', 0x41);
  git('add', '-A'); git('commit', '-q', '-m', 'c0');

  // Special-byte plain adds — each would be C-quoted in line mode; raw under -z.
  wr('café.txt', 0x42); git('add', '-A'); git('commit', '-q', '-m', 'RAW_cafe');
  wr('back\\slash.txt', 0x43); git('add', '-A'); git('commit', '-q', '-m', 'RAW_bs');
  wr('ta\tb.txt', 0x44); git('add', '-A'); git('commit', '-q', '-m', 'RAW_tab');
  wr('ne\nwl.txt', 0x45); git('add', '-A'); git('commit', '-q', '-m', 'RAW_nl');
  // A path CONTAINING the Record-Separator byte 0x1e — the byte the framing uses.
  wr('we\x1eird.txt', 0x4a); git('add', '-A'); git('commit', '-q', '-m', 'RAW_rs');

  // A real rename — two separate fields under -z.
  wr('oldname.txt', 0x46); git('add', '-A'); git('commit', '-q', '-m', 'REN0');
  git('mv', 'oldname.txt', 'newname.txt'); wr('anchor.txt', 0x47);
  git('add', '-A'); git('commit', '-q', '-m', 'REN1');

  // A real, non-renamed file literally named 'a => b.txt' — one field under -z.
  wr('a => b.txt', 0x48); git('add', '-A'); git('commit', '-q', '-m', 'LIT');

  // A binary file — '-\t-' entry.
  writeFileSync(join(d, 'bin.dat'), Buffer.from([0x00, 0x01, 0x02, 0xff]));
  git('add', '-A'); git('commit', '-q', '-m', 'BIN');

  // ---- the -z stream parser under test ----
  // NUL is the only byte a path cannot contain, so split the WHOLE stream on NUL.
  // A field beginning with RS + 40 hex is a commit header; a field beginning with
  // its <added> count is a numstat entry; a rename's old/new are consumed
  // positionally. A path with 0x1e in it therefore never cuts a record.
  const RS = 0x1e, NUL = 0x00, TAB = 0x09, LF = 0x0a;
  const isHeader = f => {
    if (f.length !== 41 || f[0] !== RS) return false;
    for (let k = 1; k < 41; k++) { const c = f[k]; if (!((c >= 0x30 && c <= 0x39) || (c >= 0x61 && c <= 0x66))) return false; }
    return true;
  };
  function parseZ(buf) {
    const fields = [];
    let s = 0;
    for (let i = 0; i <= buf.length; i++) if (i === buf.length || buf[i] === NUL) { fields.push(buf.subarray(s, i)); s = i + 1; }
    const commits = [];
    let cur = null, i = 0;
    while (i < fields.length) {
      let f = fields[i];
      if (isHeader(f)) {                                   // RS + 40 hex = header
        cur = { hash: f.subarray(1).toString('latin1'), paths: [], bad: false };
        commits.push(cur);
        i += 2;                                            // skip %at
        if (i < fields.length && fields[i].length === 0) i += 1;  // skip empty separator
        continue;
      }
      if (f.length && f[0] === LF) f = f.subarray(1);      // strip leading \n on first entry
      if (f.length === 0) { i += 1; continue; }            // trailing empty
      // numstat entry: <added>\t<deleted>\t<path>
      const parts = [];
      let ps = 0;
      for (let k = 0; k <= f.length; k++) if (k === f.length || f[k] === TAB) { parts.push(f.subarray(ps, k)); ps = k + 1; }
      if (parts.length < 3) { if (cur) cur.bad = true; i += 1; continue; }   // malformed -> guard
      const path = Buffer.concat(parts.slice(2).flatMap((p, idx) => idx ? [Buffer.from([TAB]), p] : [p]));
      if (path.length === 0) { cur.paths.push(fields[i + 1], fields[i + 2]); i += 3; }  // rename: positional
      else { cur.paths.push(path); i += 1; }
    }
    return commits;
  }

  const esc = b => Array.from(b.toString('utf8'), ch => {
    const cp = ch.codePointAt(0);
    return (cp >= 0x20 && cp < 0x7f && ch !== '\\') ? ch : '\\x' + cp.toString(16).padStart(2, '0');
  }).join('');
  function pathsFor(msg) {
    const raw = git('log', '--grep', msg, '-1', '-z', '--numstat', '--format=%x1e%H%x00%at%x00', '-M');
    const c = parseZ(raw)[0];
    return c.paths.map(esc).filter(p => p !== 'anchor.txt');
  }

  // (1) raw fields equal readdir keys (quotePath default ON) — incl. the 0x1e path
  const rawCases = ['RAW_cafe', 'RAW_bs', 'RAW_tab', 'RAW_nl', 'RAW_rs'].flatMap(pathsFor).sort();
  const want = ['caf\\xe9.txt', 'back\\x5cslash.txt', 'ta\\x09b.txt', 'ne\\x0awl.txt', 'we\\x1eird.txt'].sort();
  const onDisk = readdirSync(d, { encoding: 'buffer' }).map(esc).filter(n => want.includes(n)).sort();
  console.log('raw under -z (quotePath default ON): fields == readdir keys: ' +
    (JSON.stringify(rawCases) === JSON.stringify(onDisk) && JSON.stringify(onDisk) === JSON.stringify(want)));
  console.log('  ' + rawCases.join('  '));
  console.log("0x1e-in-path 'we\\x1eird.txt': ids=" + pathsFor('RAW_rs').length + ' [' + pathsFor('RAW_rs').join(', ') + ']');
  console.log('rename oldname.txt->newname.txt: ids=' + pathsFor('REN1').length + ' [' + pathsFor('REN1').sort().join(', ') + ']');
  console.log("literal 'a => b.txt' (plain add): ids=" + pathsFor('LIT').length + ' [' + pathsFor('LIT').join(', ') + ']');
  console.log('binary: [' + pathsFor('BIN').join(', ') + ']');
} finally {
  rmSync(d, { recursive: true, force: true });
}
