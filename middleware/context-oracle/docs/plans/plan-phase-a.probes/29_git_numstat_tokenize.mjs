// Claim (Step 13, T-13-1, Q56): a `git log --numstat` path field is parsed
// QUOTE-AWARE. git's two structural markers can collide inside one field — the
// ` => ` (and brace `prefix{old => new}suffix`) rename syntax, and the
// double-quote C-quoting of any identity holding a byte git must escape — because
// a single real path may itself contain ` => ` in its name. git resolves the
// collision at emission: whenever ANY identity needs quoting it emits the full
// `"old" => "new"` form (each identity quoted independently) and NEVER the brace
// form, so the ` => ` that separates a rename is always OUTSIDE any quoted token,
// and a ` => ` INSIDE a quoted token is filename content. The miner therefore
// treats ` => ` / a `{ … => … }` brace group as a rename separator only when it
// lies outside a quoted token: zero such separators → a single path; exactly one
// → a rename's two identities. This probe plants the pathological shapes and
// shows the tokenizer maps `"a => b\tc.txt"` (one quoted path whose name holds
// ` => `) to ONE identity while `"back\\slash.txt" => plainname.txt` (a rename
// with one quoted side) maps to TWO — the S1-class silent mis-key that a flat
// "contains ` => `" test would produce is impossible here. Executed against real
// git; the plain and brace renames confirm the unquoted separator forms.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const d = mkdtempSync(join(tmpdir(), 'numstat-tok-'));
const git = (...a) => execFileSync('git', ['-C', d, ...a], { encoding: 'buffer' });
const wr = (rel, byte) => writeFileSync(Buffer.concat([Buffer.from(d + '/'), Buffer.from(rel)]), Buffer.from([byte]));
try {
  git('init', '-q');
  git('config', 'user.email', 'p@x');
  git('config', 'user.name', 'p');
  git('config', 'commit.gpgsign', 'false');
  git('config', 'core.quotePath', 'false');

  wr('anchor.txt', 0x41);
  git('add', '-A'); git('commit', '-q', '-m', 'c0');

  // CASE C — one file whose NAME holds ' => ' and a TAB (the tab forces quoting).
  wr('a => b\tc.txt', 0x42);
  git('add', '-A'); git('commit', '-q', '-m', 'cC');

  // CASE D — rename a backslash-named file (quoted old side) to a plain new name.
  wr('back\\slash.txt', 0x43);
  git('add', '-A'); git('commit', '-q', '-m', 'cD0');
  git('mv', 'back\\slash.txt', 'plainname.txt'); wr('anchor.txt', 0x44);
  git('add', '-A'); git('commit', '-q', '-m', 'cD1');

  // Plain rename — both sides plain -> unquoted 'p.txt => q.txt'.
  wr('p.txt', 0x45); git('add', '-A'); git('commit', '-q', '-m', 'cP0');
  git('mv', 'p.txt', 'q.txt'); wr('anchor.txt', 0x46);
  git('add', '-A'); git('commit', '-q', '-m', 'cP1');

  // Brace rename — shared prefix, all plain -> 'src/{utils => other}/c.txt'.
  mkdirSync(join(d, 'src', 'utils'), { recursive: true });
  wr('src/utils/c.txt', 0x47); git('add', '-A'); git('commit', '-q', '-m', 'cB0');
  mkdirSync(join(d, 'src', 'other'), { recursive: true });
  git('mv', 'src/utils/c.txt', 'src/other/c.txt'); wr('anchor.txt', 0x48);
  git('add', '-A'); git('commit', '-q', '-m', 'cB1');

  // --- the tokenizer under test ---
  const SIMPLE = { 0x61: 7, 0x62: 8, 0x74: 9, 0x6e: 10, 0x76: 11, 0x66: 12, 0x72: 13, 0x22: 34, 0x5c: 92 };
  const OCT = c => c >= 0x30 && c <= 0x37;
  function cUnquote(buf) {                        // one token (raw bytes) -> raw bytes
    if (buf[0] !== 0x22) return buf;
    const s = buf.subarray(1, buf.length - 1), out = [];
    for (let i = 0; i < s.length;) {
      if (s[i] === 0x5c) {
        const n = s[i + 1];
        if (OCT(n)) { let j = i + 1, o = ''; while (j < s.length && OCT(s[j]) && o.length < 3) { o += String.fromCharCode(s[j]); j++; } out.push(parseInt(o, 8)); i = j; }
        else { out.push(SIMPLE[n]); i += 2; }
      } else { out.push(s[i]); i++; }
    }
    return Buffer.from(out);
  }
  // indices of ' => ' (0x20 3D 3E 20) lying OUTSIDE any double-quoted token
  function unquotedArrows(f) {
    const at = []; let inq = false;
    for (let i = 0; i < f.length; i++) {
      const c = f[i];
      if (c === 0x22) { inq = !inq; continue; }
      if (c === 0x5c && inq) { i++; continue; }   // escaped byte inside quotes
      if (!inq && c === 0x20 && f[i + 1] === 0x3d && f[i + 2] === 0x3e && f[i + 3] === 0x20) at.push(i);
    }
    return at;
  }
  function braceExpand(f) {                        // prefix{old => new}suffix, all unquoted
    const m = f.toString('latin1').match(/^([^"]*)\{(.*) => (.*)\}([^"]*)$/);
    if (!m) return null;
    const [, pre, oldp, newp, suf] = m;
    return [Buffer.from(pre + oldp + suf, 'latin1'), Buffer.from(pre + newp + suf, 'latin1')];
  }
  function resolve(f) {                            // -> [rawBytes,...] identities, or null if ambiguous
    const b = braceExpand(f);
    if (b) return b.map(cUnquote);
    const at = unquotedArrows(f);
    if (at.length === 0) return [cUnquote(f)];
    if (at.length === 1) return [cUnquote(f.subarray(0, at[0])), cUnquote(f.subarray(at[0] + 4))];
    return null;
  }

  // render raw bytes as the UTF-8 string key (readdir key type), non-printables as \xNN
  const esc = b => Array.from(b.toString('utf8'), ch => {
    const cp = ch.codePointAt(0);
    return (cp >= 0x20 && cp < 0x7f && ch !== '\\') ? ch : '\\x' + cp.toString(16).padStart(2, '0');
  }).join('');

  const cases = [
    ['CASE_C', 'cC'], ['CASE_D', 'cD1'], ['plain', 'cP1'], ['brace', 'cB1'],
  ];
  const kinds = [];
  for (const [label, msg] of cases) {
    const raw = git('-c', 'core.quotePath=false', 'log', '--grep', msg, '-1', '--numstat', '--format=');
    let field = null;
    for (const line of raw.toString('latin1').split('\n')) {
      if (!line.trim()) continue;
      const f = line.split('\t').slice(2).join('\t');
      if (f === 'anchor.txt') continue;
      field = Buffer.from(f, 'latin1');
    }
    const ids = resolve(field);
    const kind = ids === null ? 'ambiguous' : ids.length === 1 ? 'single' : 'rename';
    kinds.push(`${label}=${kind}`);
    console.log(`${label}: field=${field.toString('latin1')}`);
    console.log(`  ids=${ids === null ? '-' : ids.length}: ${ids === null ? 'UNRESOLVED' : ids.map(esc).join(' | ')}`);
  }
  console.log('rename iff exactly one unquoted " => ": ' + kinds.join(' '));
} finally {
  rmSync(d, { recursive: true, force: true });
}
