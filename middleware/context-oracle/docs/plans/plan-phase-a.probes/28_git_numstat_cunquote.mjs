// Claims (Step 13, T-13-1): git's C-quoting of a `--numstat` path field is a
// total, invertible encoding, and C-unquoting a quoted field then UTF-8-decoding
// it yields the exact string key the structural indexer's `readdir` walk uses.
// Under `-c core.quotePath=false` a path is emitted raw UTF-8 unless it contains
// a literal double-quote, backslash, tab, newline, or a control byte < 0x20, in
// which case git wraps it in double quotes and C-escapes those bytes (`\"`, `\\`,
// `\t`, `\n`, `\NNN` octal, ...) — INCLUDING octal-escaping each byte of a
// non-ASCII run when the same name also carries a quote-forcing byte. Inverting
// that escape (C-unquote) recovers the exact raw bytes; those bytes UTF-8-decode
// to the `readdir` key string (comparison is on the decoded STRING, never the raw
// bytes — a name mixing `é` with a tab proves the two differ). So the miner
// DECODES a still-quoted field back to its raw path and decodes it to a string
// (deterministic, not a guess) rather than dropping it. This probe proves the
// round-trip across the backslash / non-ASCII / double-quote / tab / newline /
// control-byte / mixed classes.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const d = mkdtempSync(join(tmpdir(), 'cunquote-'));
const git = (...a) => execFileSync('git', ['-C', d, ...a], { encoding: 'buffer' });
try {
  git('init', '-q');
  git('config', 'user.email', 'p@x');
  git('config', 'user.name', 'p');
  git('config', 'commit.gpgsign', 'false');
  // Filenames as raw bytes (readdir keys). One class per pathological byte.
  const names = [
    Buffer.from('plain.txt'),
    Buffer.from('café.txt', 'utf8'),                 // non-ASCII (raw under quotePath=false)
    Buffer.from('a\\b.txt'),                          // literal backslash
    Buffer.from('q"z.txt'),                           // literal double-quote
    Buffer.from('ta\tb.txt'),                         // literal tab
    Buffer.from('ne\nwl.txt'),                        // literal newline
    Buffer.from('café\tx.txt', 'utf8'),              // non-ASCII AND a tab (octal + escape mix)
    Buffer.from([0x63, 0x74, 0x72, 0x6c, 0x01, 0x78, 0x2e, 0x74, 0x78, 0x74]), // ctrl<0x01>x.txt
  ];
  const sep = Buffer.from('/');
  for (let i = 0; i < names.length; i++) {
    // Raw-byte path (Buffer, no string round-trip) so non-ASCII names land on
    // disk as their exact UTF-8 bytes rather than being re-encoded.
    writeFileSync(Buffer.concat([Buffer.from(d), sep, names[i]]), Buffer.from([0x61 + i]));
  }
  git('add', '-A');
  git('commit', '-q', '-m', 'seed');

  // C-unquote: invert git's quote_c_style. `field` is the raw bytes of one path
  // field. If it does not begin with `"`, it is already raw. Returns raw bytes.
  const OCT = c => c >= 0x30 && c <= 0x37;
  const SIMPLE = { 0x61: 7, 0x62: 8, 0x74: 9, 0x6e: 10, 0x76: 11, 0x66: 12, 0x72: 13, 0x22: 34, 0x5c: 92 };
  function cUnquote(field) {
    if (field[0] !== 0x22) return field;               // not quoted
    const s = field.subarray(1, field.length - 1);     // strip surrounding quotes
    const out = [];
    for (let i = 0; i < s.length; ) {
      if (s[i] === 0x5c) {                              // backslash
        const n = s[i + 1];
        if (OCT(n)) {
          let j = i + 1, oct = '';
          while (j < s.length && OCT(s[j]) && oct.length < 3) { oct += String.fromCharCode(s[j]); j++; }
          out.push(parseInt(oct, 8)); i = j;
        } else { out.push(SIMPLE[n]); i += 2; }
      } else { out.push(s[i]); i++; }
    }
    return Buffer.from(out);
  }

  // Parse `git log --numstat` path fields (added TAB deleted TAB path). A newline
  // in a name is emitted as the two ASCII bytes `\n` inside the quoted field, so
  // the numstat LINE never carries a raw newline and line-splitting is safe.
  const raw = git('-c', 'core.quotePath=false', 'log', '-1', '--no-merges', '--numstat', '--format=');
  const decoded = [];
  for (const line of raw.toString('latin1').split('\n')) {
    if (!line.trim()) continue;
    const field = Buffer.from(line.split('\t').slice(2).join('\t'), 'latin1');
    decoded.push(cUnquote(field));
  }
  // The key is the UTF-8-DECODED string, matching the indexer's readdir walk.
  const readdirKeys = readdirSync(d, { encoding: 'buffer' })
    .map(b => b.toString('utf8')).filter(n => n !== '.git').sort();
  const decodedKeys = decoded.map(b => b.toString('utf8')).sort();

  // Render each string key as pure ASCII (printable code points raw, everything
  // else as `\xNN`) so the expected output is deterministic and terminal-safe.
  const esc = s => Array.from(s, ch => {
    const cp = ch.codePointAt(0);
    return (cp >= 0x20 && cp < 0x7f && ch !== '\\') ? ch : '\\x' + cp.toString(16).padStart(2, '0');
  }).join('');
  console.log('readdir keys:  ' + readdirKeys.map(esc).join('  '));
  console.log('c-unquoted:    ' + decodedKeys.map(esc).join('  '));
  console.log('invertible (decoded == readdir keys): ' +
    (JSON.stringify(readdirKeys) === JSON.stringify(decodedKeys)));
} finally {
  rmSync(d, { recursive: true, force: true });
}
