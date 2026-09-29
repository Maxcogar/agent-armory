// synth.mjs <build-dir> <store.db> — rows the layout can hold but no verb or
// hook of any build of it writes, written through that build's own compiled
// DAOs (not raw SQL), so the mapping's rules for them run on real layout rows:
//   - a Coupling and an Orientation whisper row with file-id subject keys (every
//     genre generator of every build returns [] and handler.ts writes no
//     subject_key, so no build writes these); the second is corrected later by
//     the real `correct` verb;
//   - an invariant with two members (no verb writes invariants: `note --kind
//     invariant` is "not built" in every build).
// The rows name the highest file ids, the ones a fresh walk is least likely to
// give the same paths. Prints the ids it wrote as JSON.
import path from 'node:path';
const [build, dbPath] = process.argv.slice(2);
const dist = path.join(build, 'middleware/context-oracle/ctxoracle/dist/src/stores');
const { openStore } = await import(path.join(dist, 'adapter.js'));
const { whisperAuditDao } = await import(path.join(dist, 'dao/whisper_audit.js'));
const { invariantsDao } = await import(path.join(dist, 'dao/invariants.js'));
const s = openStore(dbPath);
const f = s.prepare('SELECT id, path FROM files ORDER BY id DESC LIMIT 3').all();
if (f.length < 2) throw new Error('synth: fewer than two files rows');
const a = f[0].id, b = f[1].id, c = (f[2] ?? f[0]).id;
const hasKey = s.prepare("SELECT 1 FROM pragma_table_info('whisper_audit') WHERE name = 'subject_key'").get() !== undefined;
const key = (k) => (hasKey ? { subject_key: k } : {});
const w = whisperAuditDao(s).append({
  session: 'S2', consumer: 'S2#main', kind: 'whisper', genre: 'coupling', ts: Date.now(),
  text: `${f[0].path} and ${f[1].path} change together (4 of 5).`,
  evidence_json: JSON.stringify({ pair: [f[0].path, f[1].path] }), confidence: 0.8,
  ...key(`coupling:${Math.min(a, b)}:${Math.max(a, b)}`),
});
const w2 = whisperAuditDao(s).append({
  session: 'S2', consumer: 'S2#main', kind: 'whisper', genre: 'orientation', ts: Date.now(),
  text: `Entry points: ${f[0].path}, ${(f[2] ?? f[0]).path}.`,
  ...key(`orientation:${[a, c].sort((x, y) => x - y).join(',')}`),
});
const inv = invariantsDao(s).create(
  { description: 'the first and third file share the export shape', prov: { prov_kind: 'human', prov_ref: 'synth', trust: 'human' } },
  [{ fileId: a, span: '1-1' }, { fileId: c, span: null }]
);
s.close();
console.log(JSON.stringify({ whisper: w, whisper2: w2, invariant: inv, files: f }));
