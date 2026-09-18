// Claim (Step 13, T-13-1, Q56): the co-change miner reads history with
// `git log -z --numstat --format=%x1e%H%x00%at%x00`, and `-z` (machine mode)
// makes the format unambiguous with NO decoding and NO guessing:
//   (1) every path field is emitted RAW — no core.quotePath C-quoting of
//       non-ASCII, backslash, double-quote, tab, newline, or control bytes —
//       so a field equals the structural indexer's readdir key directly;
//   (2) a rename is emitted as TWO separate NUL-delimited fields (the entry
//       `<added>\t<deleted>\t` with an empty path, then `<old>\0<new>\0`), never
//       the ambiguous line-mode `old => new`, so a real file whose name literally
//       contains ` => ` is one field and cannot be confused with a rename;
//   (3) binary entries are `-\t-\t<path>`.
// The `%x00` format-header vs `-z` NUL collision that made the plan avoid `-z`
// is resolved by delimiting each commit record with a Record Separator
// (`\x1e`), a byte git never emits inside a path or numstat field. This probe
// plants the pathological paths (a tab forces line-mode quoting; a literal
// ` => ` name forces line-mode ambiguity) with core.quotePath at its DEFAULT
// (on) and shows `-z` still yields raw, unambiguous fields.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readdirSync, rmSync, mkdirSync } from 'node:fs';
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
  // Returns [{hash, paths:[Buffer,...]}] — paths are RAW bytes, renames expanded
  // to both identities, never guessed.
  const RS = 0x1e, NUL = 0x00, TAB = 0x09, LF = 0x0a;
  function parseZ(buf) {
    const commits = [];
    // split by RS
    const chunks = [];
    let start = -1;
    for (let i = 0; i < buf.length; i++) {
      if (buf[i] === RS) { if (start !== -1) chunks.push(buf.subarray(start, i)); start = i + 1; }
    }
    if (start !== -1) chunks.push(buf.subarray(start));
    for (const chunk of chunks) {
      // split chunk by NUL into fields
      const fields = [];
      let s = 0;
      for (let i = 0; i <= chunk.length; i++) {
        if (i === chunk.length || chunk[i] === NUL) { fields.push(chunk.subarray(s, i)); s = i + 1; }
      }
      // fields[0]=hash, [1]=at, [2]="" (header/numstat separator), [3..]=numstat tokens
      const hash = fields[0].toString('latin1');
      const paths = [];
      let i = 3;
      while (i < fields.length) {
        let tok = fields[i];
        if (tok.length && tok[0] === LF) tok = tok.subarray(1); // strip leading \n on first entry
        if (tok.length === 0) { i++; continue; }                // trailing empty
        // split tok by TAB: [added, deleted, ...pathparts]
        const parts = [];
        let ps = 0;
        for (let k = 0; k <= tok.length; k++) {
          if (k === tok.length || tok[k] === TAB) { parts.push(tok.subarray(ps, k)); ps = k + 1; }
        }
        const pathPart = parts.length > 2 ? Buffer.concat(parts.slice(2).flatMap((p, idx) => idx ? [Buffer.from([TAB]), p] : [p])) : Buffer.alloc(0);
        if (pathPart.length === 0) {
          // rename marker: next two fields are old, new (raw, no tabs stripped)
          paths.push(fields[i + 1], fields[i + 2]);
          i += 3;
        } else {
          paths.push(pathPart); // normal or binary ('-','-') entry
          i += 1;
        }
      }
      commits.push({ hash, paths });
    }
    return commits;
  }

  const esc = b => Array.from(b.toString('utf8'), ch => {
    const cp = ch.codePointAt(0);
    return (cp >= 0x20 && cp < 0x7f && ch !== '\\') ? ch : '\\x' + cp.toString(16).padStart(2, '0');
  }).join('');

  // Resolve one commit by message (non-anchor paths).
  function pathsFor(msg) {
    const raw = git('log', '--grep', msg, '-1', '-z', '--numstat', '--format=%x1e%H%x00%at%x00', '-M');
    const c = parseZ(raw)[0];
    return c.paths.map(esc).filter(p => p !== 'anchor.txt');
  }

  // (1) raw fields equal readdir keys (quotePath default ON)
  const rawCases = ['RAW_cafe', 'RAW_bs', 'RAW_tab', 'RAW_nl'].flatMap(pathsFor).sort();
  const onDisk = readdirSync(d, { encoding: 'buffer' })
    .map(b => esc(b)).filter(n => ['caf\\xe9.txt', 'back\\x5cslash.txt', 'ta\\x09b.txt', 'ne\\x0awl.txt'].includes(n)).sort();
  console.log('raw under -z (quotePath default ON): fields == readdir keys: ' +
    (JSON.stringify(rawCases) === JSON.stringify(onDisk)));
  console.log('  ' + rawCases.join('  '));
  // (2) rename -> two fields; (3) literal-arrow -> one field; binary -> path
  console.log('rename oldname.txt->newname.txt: ids=' + pathsFor('REN1').length + ' [' + pathsFor('REN1').sort().join(', ') + ']');
  console.log("literal 'a => b.txt' (plain add): ids=" + pathsFor('LIT').length + ' [' + pathsFor('LIT').join(', ') + ']');
  console.log('binary: [' + pathsFor('BIN').join(', ') + ']');
} finally {
  rmSync(d, { recursive: true, force: true });
}
