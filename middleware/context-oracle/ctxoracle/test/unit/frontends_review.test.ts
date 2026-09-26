// Step 15 build review — tests closing the gaps the reviewer's hand mutation
// run found in T-15-1…T-15-6 (docs/reviews/2026-09-26-step-15-build-review.md).
// RV15-1…RV15-10 were drafted by an earlier reviewer run lost to a container
// restart; each was re-checked against the plan's text, re-run on the real
// code, and re-killed on its mutation before it was kept. RV15-11…RV15-18 were
// added by the completing run.
// Written by the independent reviewer from the plan's text (Step 15 as amended
// at 42653ae, d616f1f, f22ce6b; §12 T-15-1/T-15-5 Data; architecture AD-12,
// AD-19). Each case names the sentence it pins and the mutation it kills.
//
// Real `web-tree-sitter` + `tree-sitter-wasms` grammars, real `node:sqlite`,
// real git, real `runIndex`; the resolver cases use the same literal-path
// `RepoFiles` fake T-15-5 uses (its contract is pure over that interface).

import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openStore, type Store } from '../../src/stores/adapter.js';
import { applyMigrations } from '../../src/stores/migration_runner.js';
import { seedDefaults, tuningReader } from '../../src/stores/dao/tuning.js';
import { runIndex } from '../../src/index/indexer.js';
import { defaultFrontends } from '../../src/index/frontends.js';
import { treeSitterFrontend, QUERIES } from '../../src/index/tree_sitter_frontend.js';
import { genericFrontend } from '../../src/index/generic_frontend.js';
import { resolveTsImport, resolvePythonImport, RESOLVER_RULES_VERSION } from '../../src/index/resolvers.js';
import type { ImportResolution, RepoFiles } from '../../src/index/frontend.js';
import { fixtureInit, fixtureCommit } from '../fixtures/generate.js';

const root = mkdtempSync(path.join(tmpdir(), 'ctxoracle-frontends-review-'));
process.on('exit', () => rmSync(root, { recursive: true, force: true }));
const diag = path.join(root, 'diagnostics');

/** Index `files` (committed to a fresh repository) with `defaultFrontends(tuning)`; the caller closes the store. */
async function indexRepo(name: string, files: { path: string; content: string | Buffer }[]): Promise<{ store: Store; repo: string }> {
  const repo = path.join(root, name);
  fixtureInit(repo);
  fixtureCommit(repo, files, { message: name, day: 0 });
  const store = openStore(path.join(root, `${name}-project.db`));
  applyMigrations(store, { fts: true });
  const global = openStore(path.join(root, `${name}-global.db`));
  applyMigrations(global, { fts: false, scope: 'global' });
  seedDefaults(global);
  try {
    const tuning = tuningReader(global, name, () => {});
    const r = await runIndex(store, repo, { full: false, frontends: defaultFrontends(tuning), tuning, diagnosticsDir: diag });
    assert.ok(!('refused' in r), 'runIndex was refused');
  } finally {
    global.close();
  }
  return { store, repo };
}

function symbolRows(store: Store, p: string): { name: string; spanStart: number; spanEnd: number }[] {
  return (
    store
      .prepare('SELECT s.name AS name, s.span_start AS spanStart, s.span_end AS spanEnd FROM symbols s JOIN files f ON f.id = s.file_id WHERE f.path = ? ORDER BY s.span_start')
      .all(p) as { name: string; spanStart: number; spanEnd: number }[]
  ).map((r) => ({ name: r.name, spanStart: Number(r.spanStart), spanEnd: Number(r.spanEnd) }));
}

// ---------------------------------------------------------------------------
// RV15-1 — spans are byte spans of the file on disk for non-ASCII text.
// T-15-1 Data: "A symbol's span is its declaration node's byte span — from the
// start of the declaration to its end — which contains the name". The file
// carries 2-byte (é), 3-byte (日本) and 4-byte (🎉, a UTF-16 surrogate pair)
// characters before and inside the declarations, so any span computed in
// UTF-16 code units or with a wrong UTF-8 width lands off the declaration.
// Kills: span conversion mutations (2-byte width, surrogate width, no mapping).

const UNICODE_TS = [
  "// é 日本 🎉 — a comment with every UTF-8 width before the first declaration",
  "export const greeting = 'héllo 🎉🎉';",
  '',
  'export function first(): string {',
  "  return '日本語🎉';",
  '}',
  '',
  'export class Ünïcode {',
  "  mëthod(): string { return '🎉'; }",
  '}',
  '',
  'export function last(): number {',
  '  return 1;',
  '}',
  '',
].join('\n');

test('RV15-1: tree-sitter symbol spans address the declaration bytes on disk in a file with 2-, 3- and 4-byte UTF-8 characters', async () => {
  const fe = treeSitterFrontend('typescript');
  await fe.init();
  const content = Buffer.from(UNICODE_TS, 'utf8');
  const r = fe.parse('src/u.ts', content);
  assert.ok(r.ok, `parse failed: ${r.ok ? '' : r.error}`);
  const expectStart: Record<string, string> = { first: 'function first', 'Ünïcode': 'class Ünïcode', 'mëthod': 'mëthod()', last: 'function last' };
  for (const [name, head] of Object.entries(expectStart)) {
    const s = r.symbols.find((x) => x.name === name);
    assert.ok(s !== undefined, `symbol ${name} is lost (${JSON.stringify(r.symbols.map((x) => x.name))})`);
    assert.ok(s.spanStart >= 0 && s.spanStart < s.spanEnd && s.spanEnd <= content.length, `${name}: span [${s.spanStart}, ${s.spanEnd}) is outside the file's ${content.length} bytes`);
    const bytes = content.subarray(s.spanStart, s.spanEnd).toString('utf8');
    assert.ok(bytes.startsWith(head), `${name}: span bytes do not start at the declaration: ${JSON.stringify(bytes.slice(0, 40))}`);
    assert.ok(bytes.endsWith('}'), `${name}: span bytes do not end at the declaration's end: ${JSON.stringify(bytes.slice(-20))}`);
  }
  const g = r.symbols.find((x) => x.name === 'greeting');
  assert.ok(g !== undefined, 'the top-level const greeting is lost');
  assert.equal(content.subarray(g.spanStart, g.spanEnd).toString('utf8'), "greeting = 'héllo 🎉🎉'", 'greeting: the span is not its declarator on disk');
});

// ---------------------------------------------------------------------------
// RV15-2 — a file that is not valid UTF-8 is still indexed with spans that
// address its bytes on disk. AD-12: the generic frontend covers everything a
// tree-sitter parse cannot (no language is invisible), and a span is a byte
// span of the file (T-15-1; AD-15's rumor rule re-reads spans on disk). The
// Python file carries one Latin-1 byte (0xE9) in a comment before its
// definitions. Kills: a lossy (non-fatal) UTF-8 decode in either frontend
// (U+FFFD is 3 bytes for 1 on disk, so every later span drifts) and the loss
// of the generic frontend's Python `def` rule.

test('RV15-2: a Python file with a non-UTF-8 byte is indexed with def symbols whose spans address the file on disk', async () => {
  const content = Buffer.concat([Buffer.from('# caf'), Buffer.from([0xe9]), Buffer.from(' -- latin-1 comment\n\ndef before_x():\n    return 1\n\n\ndef after_x():\n    return 2\n')]);
  const { store, repo } = await indexRepo('latin1', [{ path: 'tool.py', content }]);
  try {
    const onDisk = readFileSync(path.join(repo, 'tool.py'));
    assert.ok(onDisk.equals(content), 'precondition: the committed bytes are the non-UTF-8 bytes');
    const rows = symbolRows(store, 'tool.py');
    for (const name of ['before_x', 'after_x']) {
      const s = rows.find((x) => x.name === name);
      assert.ok(s !== undefined, `tool.py lacks its symbol ${name} (has ${JSON.stringify(rows.map((x) => x.name))})`);
      assert.ok(s.spanEnd <= onDisk.length, `${name}: span end ${s.spanEnd} is past the file's ${onDisk.length} bytes`);
      const at = onDisk.subarray(s.spanStart, s.spanEnd).toString('latin1');
      assert.ok(at.startsWith(`def ${name}`), `${name}: span [${s.spanStart}, ${s.spanEnd}) does not address its definition on disk: ${JSON.stringify(at.slice(0, 30))}`);
    }
  } finally {
    store.close();
  }
});

// ---------------------------------------------------------------------------
// RV15-3 — a frontend's `version` covers its query text and, for a resolving
// frontend, the resolver rules. AD-12: "a change in the frontend set (their
// languages, capabilities, and versions, stored as a fingerprint) makes the
// pass full" and "'unchanged' covers every input" of a file's derived rows —
// the query shapes the symbols and the resolver shapes the edges.
// Kills: the query hash or the resolver-rules identity dropped from `version`.

test('RV15-3: a frontend version changes with its query text and names the resolver rules of a resolving frontend', () => {
  const before = treeSitterFrontend('typescript').version;
  const saved = QUERIES.typescript as string;
  try {
    QUERIES.typescript = `${saved}\n; a comment changes the query text\n`;
    const after = treeSitterFrontend('typescript').version;
    assert.notEqual(after, before, 'the typescript frontend version did not change with its query text');
  } finally {
    QUERIES.typescript = saved;
  }
  assert.equal(treeSitterFrontend('typescript').version, before, 'precondition: restoring the query restores the version');
  for (const lang of ['typescript', 'tsx', 'javascript', 'python']) {
    assert.ok(treeSitterFrontend(lang).version.includes(RESOLVER_RULES_VERSION), `${lang}: version does not carry the resolver rules identity ${RESOLVER_RULES_VERSION}`);
  }
});

// ---------------------------------------------------------------------------
// RV15-4 — plan Step 15: "a grammar for which no query is written is not
// given a tree-sitter frontend at all — its extension falls to the generic
// frontend". Kills: the no-query guard in `treeSitterFrontend` removed.

test('RV15-4: treeSitterFrontend refuses a grammar with no QUERIES entry', () => {
  for (const lang of ['css', 'html', 'json', 'toml', 'embedded_template', 'vue', 'lua']) {
    assert.ok(!Object.hasOwn(QUERIES, lang), `precondition: ${lang} has no QUERIES entry`);
    assert.throws(() => treeSitterFrontend(lang), `${lang}: a tree-sitter frontend was built with no written query`);
  }
});

// ---------------------------------------------------------------------------
// RV15-5 — resolver cells the T-15-5 table leaves out, each from the plan's
// resolver text.

function repoFiles(paths: string[], deps: string[]): RepoFiles {
  const set = new Set(paths);
  const depSet: ReadonlySet<string> = new Set(deps);
  const hasTop = (name: string): boolean =>
    [...set].some((p) => p.endsWith('.py') && (p.split('/').at(-1) === `${name}.py` || p.split('/').slice(0, -1).includes(name)));
  return { has: (p) => set.has(p), nearestPackageJsonDeps: () => depSet, hasTopLevelModule: hasTop };
}

test('RV15-5: a bare specifier is external by its package name — `@scope/name` for a scoped package — and unresolved when undeclared', () => {
  // Plan Step 15: "A bare specifier whose package name (`name` or
  // `@scope/name`) is in the nearest package.json's … → external; anything
  // else (… an undeclared package) → unresolved".
  const repo = repoFiles(['package.json', 'src/a.ts'], ['@scope/pkg', 'react']);
  const cells: [string, ImportResolution][] = [
    ['@scope/pkg', { kind: 'external' }],
    ['@scope/pkg/deep/path', { kind: 'external' }],
    ['@scope/other', { kind: 'unresolved' }],
    ['react/jsx-runtime', { kind: 'external' }],
    ['fs/promises', { kind: 'external' }],
  ];
  for (const [spec, expected] of cells) assert.deepEqual(resolveTsImport('src/a.ts', spec, repo), expected, `${spec}`);
});

test('RV15-5: a trailing-slash specifier resolves to its directory index, and .jsx/.cjs specifiers try their .tsx/.cts source', () => {
  // Plan Step 15 (NodeNext for relative specifiers; `./d` → `d/index.ts` in
  // T-15-5's table; "a `.js`/`.jsx`/`.mjs`/`.cjs` specifier also tries its
  // source `.ts`/`.tsx`/`.mts`/`.cts`"). A written `./d/` names the directory
  // itself, never `d.ts`: TypeScript 5.9.3's resolveModuleName (NodeNext, a
  // CommonJS-mode importer) resolves it to `d/index.ts` (executed by the
  // reviewer, 2026-09-26).
  const repo = repoFiles(['src/a.ts', 'src/d/index.ts', 'src/d.ts'], []);
  assert.deepEqual(resolveTsImport('src/a.ts', './d/', repo), { kind: 'resolved', dst: 'src/d/index.ts' });
  assert.deepEqual(resolveTsImport('src/a.ts', './c.jsx', repoFiles(['src/a.ts', 'src/c.tsx'], [])), { kind: 'resolved', dst: 'src/c.tsx' });
  assert.deepEqual(resolveTsImport('src/a.ts', './e.cjs', repoFiles(['src/a.ts', 'src/e.cts'], [])), { kind: 'resolved', dst: 'src/e.cts' });
});

test('RV15-5: a relative Python specifier with more leading dots than the importer has parent directories is unresolved', () => {
  // Plan Step 15 (PEP 328): n leading dots resolve against the (n − 1)-th
  // parent package of fromPath's directory; from `a/u.py`, `...x` names the
  // parent of the repository root, which the repository does not hold. A
  // root-level `x.py` must not be taken for it.
  const repo = repoFiles(['a/u.py', 'x.py', 'a/y.py'], []);
  assert.deepEqual(resolvePythonImport('a/u.py', '..x', repo), { kind: 'resolved', dst: 'x.py' }, 'precondition: `..x` from a/u.py is the root x.py');
  assert.deepEqual(resolvePythonImport('a/u.py', '...x', repo), { kind: 'unresolved' });
  assert.deepEqual(resolvePythonImport('x.py', '..y', repo), { kind: 'unresolved' });
});

// ---------------------------------------------------------------------------
// RV15-6 — the indexer's real `RepoFiles.hasTopLevelModule` (plan Step 15,
// 115d176): "true when some present in-tree path is `<dir>/<name>.py`, or has
// a directory segment `<name>` with a `.py` file beneath it — which the
// indexer builds once per pass from the walk's present set". T-15-3 and
// T-15-5 exercise only the fake. From `app/run.py`: `helpers.missing`
// (`helpers/` holds a `.py` file: the repository's own → unresolved),
// `solo.missing` (`lib/solo.py` exists: `solo` is the repository's own →
// unresolved), `json` (no in-repo `json` → external, not counted).
// Kills: either half of the real hasTopLevelModule rule dropped.

test('RV15-6: runIndex counts an absolute Python import unresolved when its top-level name is an in-repo directory or module, and not when it is external', async () => {
  const { store } = await indexRepo('pytop', [
    { path: 'helpers/x.py', content: 'def x():\n    return 1\n' },
    { path: 'lib/solo.py', content: 'def solo():\n    return 1\n' },
    { path: 'app/run.py', content: 'import helpers.missing\nimport solo.missing\nimport json\n\n\ndef run():\n    return json\n' },
  ]);
  try {
    const n = Number((store.prepare("SELECT unresolved_imports AS n FROM files WHERE path = 'app/run.py'").get() as { n: number }).n);
    assert.equal(n, 2, 'app/run.py unresolved_imports is not 2 (helpers.missing and solo.missing unresolved; json external)');
  } finally {
    store.close();
  }
});

// ---------------------------------------------------------------------------
// RV15-7 — symbol names are redacted before they are stored. AD-19:
// "Redaction at every ingress … applied to any string entering a store";
// a symbol name is repo-derived text. The TypeScript function's name is the
// AWS-key-shaped string Step 11's `aws_key` pattern names. Kills: symbol names
// stored unredacted.

test('RV15-7: a secret-shaped symbol name never reaches the symbols table', async () => {
  const secret = 'AKIAIOSFODNN7EXAMPLE';
  const { store } = await indexRepo('secretname', [{ path: 'src/k.ts', content: `export function ${secret}(): number {\n  return 1;\n}\n\nexport function plain(): number {\n  return 2;\n}\n` }]);
  try {
    const names = symbolRows(store, 'src/k.ts').map((s) => s.name);
    assert.ok(names.includes('plain'), `precondition: src/k.ts was parsed (symbols ${JSON.stringify(names)})`);
    assert.equal(names.length, 2, `src/k.ts does not keep a (redacted) row for each definition (${JSON.stringify(names)})`);
    assert.ok(!names.some((n) => n.includes(secret)), `a symbols row stores the secret verbatim: ${JSON.stringify(names)}`);
  } finally {
    store.close();
  }
});

// ---------------------------------------------------------------------------
// RV15-8 — CommonJS and dynamic imports. Plan Step 15: `javascript` ships "an
// imports query … and a resolver (`imports: true`)". The builder's recorded
// capture forms (implementation-log Step 15: "TS/JS capture static imports,
// re-export sources, `import x = require()`, `require('…')` and `import('…')`
// with a string literal") are what `imports: true` declares for JavaScript,
// whose CommonJS files import only through `require`. The module-binding rule
// (same record, P4): `const util = require('./util.js')` binds the imported
// module, not a definition of the importer. Kills: the `require` capture
// dropped; module bindings kept as symbols.

test('RV15-8: a CommonJS require and a dynamic import each yield an import edge, and a require binding is not a symbol of the importer', async () => {
  const { store } = await indexRepo('cjs', [
    { path: 'lib/util.js', content: 'function util() {\n  return 1;\n}\nmodule.exports = { util };\n' },
    { path: 'lib/lazy.js', content: 'export function lazy() {\n  return 2;\n}\n' },
    { path: 'lib/app.js', content: "const util = require('./util.js');\n\nasync function app() {\n  const m = await import('./lazy.js');\n  return util.util() + m.lazy();\n}\nmodule.exports = { app };\n" },
  ]);
  try {
    const dsts = (
      store
        .prepare("SELECT d.path AS dst FROM import_edges e JOIN files s ON s.id = e.src_file JOIN files d ON d.id = e.dst_file WHERE s.path = 'lib/app.js' ORDER BY d.path")
        .all() as { dst: string }[]
    ).map((r) => r.dst);
    assert.deepEqual(dsts, ['lib/lazy.js', 'lib/util.js'], 'lib/app.js lacks the require or dynamic-import edge');
    const names = symbolRows(store, 'lib/app.js').map((s) => s.name);
    assert.ok(names.includes('app'), `precondition: lib/app.js was parsed (${JSON.stringify(names)})`);
    assert.ok(!names.includes('util'), `the require binding util is stored as a symbol of lib/app.js (${JSON.stringify(names)})`);
  } finally {
    store.close();
  }
});

// ---------------------------------------------------------------------------
// RV15-9 — a generic-frontend span starts at the definition, not at its
// indentation. T-15-1 Data: "A symbol's span is its declaration node's byte
// span — from the start of the declaration to its end — which contains the
// name"; the generic frontend has no node, and its nearest equivalent is the
// definition text on its line (generic_frontend.ts's own comment). An
// indented method's span must start at `def`. Kills: the span start moved to
// the line start.

test('RV15-9: a generic-frontend symbol span starts at the definition keyword of an indented definition', () => {
  const content = Buffer.from('class K:\n    def method_x(self):\n        return 1\n');
  const r = genericFrontend.parse('k.unknownext', content);
  assert.ok(r.ok, `generic parse failed: ${r.ok ? '' : r.error}`);
  const s = r.symbols.find((x) => x.name === 'method_x');
  assert.ok(s !== undefined, `method_x is lost (${JSON.stringify(r.symbols.map((x) => x.name))})`);
  assert.ok(content.subarray(s.spanStart, s.spanEnd).toString('utf8').startsWith('def method_x'), `the span does not start at the definition: ${JSON.stringify(content.subarray(s.spanStart, s.spanEnd).toString('utf8'))}`);
});

// ---------------------------------------------------------------------------
// RV15-10 — the C# definitions query captures each kind of named declaration
// the builder's recorded rule counts as a symbol (implementation-log Step 15:
// "functions, methods, classes, types, modules"). T-15-6 needs only one symbol
// per sample, so a C# frontend that lost methods still passed it; C# is one
// of this repository's four major languages (66 files). Kills: the C#
// `method_declaration` pattern dropped.

test('RV15-10: the C# frontend yields the namespace, type, constructor, method and property of a sample', async () => {
  const fe = treeSitterFrontend('c_sharp');
  await fe.init();
  const src = [
    'namespace Shop {',
    '  public interface IPriced { decimal Price { get; } }',
    '  public enum Kind { A, B }',
    '  public sealed class Cart {',
    '    public Cart() { }',
    '    public int Count { get; set; }',
    '    public decimal Total(int n) { return n; }',
    '  }',
    '}',
    '',
  ].join('\n');
  const r = fe.parse('Cart.cs', Buffer.from(src));
  assert.ok(r.ok, `parse failed: ${r.ok ? '' : r.error}`);
  const got = r.symbols.map((s) => `${s.kind}:${s.name}`).sort();
  for (const want of ['namespace:Shop', 'interface:IPriced', 'enum:Kind', 'class:Cart', 'constructor:Cart', 'property:Count', 'method:Total']) {
    assert.ok(got.includes(want), `C# symbol ${want} is lost (got ${JSON.stringify(got)})`);
  }
});

// ---------------------------------------------------------------------------
// RV15-11 — the TypeScript resolver's candidate order and the written path.
// Plan Step 15: "when the specifier's extension is a TS/JS extension …, the
// written path if it exists"; "any other specifier — extensionless … — tries
// the written path with `.ts`, `.tsx`, `.js`, `.jsx` appended, then `/index.`
// + those …; first existing file wins". T-15-5's cells never hold two
// candidates at once, so the order is unpinned there.
// Kills: the appended order changed; the written TS/JS path not tried.

test('RV15-11: resolveTsImport takes the written TS/JS path when it exists and tries appended extensions in the stated order', () => {
  const repo = repoFiles(['src/a.ts', 'src/only.js', 'src/x.ts', 'src/x.js', 'src/y.tsx', 'src/y.js', 'src/z.js', 'src/z.jsx', 'src/w/index.tsx', 'src/w/index.js'], []);
  const cells: [string, ImportResolution][] = [
    ['./only.js', { kind: 'resolved', dst: 'src/only.js' }], // a .js specifier with no .ts/.tsx source: the written path
    ['./x', { kind: 'resolved', dst: 'src/x.ts' }], // .ts before .js
    ['./y', { kind: 'resolved', dst: 'src/y.tsx' }], // .tsx before .js
    ['./z', { kind: 'resolved', dst: 'src/z.js' }], // .js before .jsx
    ['./w', { kind: 'resolved', dst: 'src/w/index.tsx' }], // /index.tsx before /index.js
  ];
  for (const [spec, expected] of cells) assert.deepEqual(resolveTsImport('src/a.ts', spec, repo), expected, spec);
});

// ---------------------------------------------------------------------------
// RV15-12 — spans stay byte spans when the only non-ASCII characters are in
// the Latin-1 range (U+0080–U+00FF, 2 bytes each in UTF-8). T-15-1 Data: "A
// symbol's span is its declaration node's byte span". RV15-1's file also holds
// characters above U+00FF, so it cannot see a conversion that treats the
// Latin-1 range as one byte per character. Kills: the ASCII fast path widened
// to U+00FF.

test('RV15-12: a TypeScript file whose only non-ASCII characters are Latin-1 gets spans that address its declarations on disk', async () => {
  const fe = treeSitterFrontend('typescript');
  await fe.init();
  const content = Buffer.from('// café naïve señor\nexport function déjà(): number {\n  return 1;\n}\n', 'utf8');
  assert.ok(![...content.toString('utf8')].some((c) => (c.codePointAt(0) as number) > 0xff), 'precondition: no character above U+00FF');
  const r = fe.parse('src/l.ts', content);
  assert.ok(r.ok, `parse failed: ${r.ok ? '' : r.error}`);
  const s = r.symbols.find((x) => x.name === 'déjà');
  assert.ok(s !== undefined, `déjà is lost (${JSON.stringify(r.symbols.map((x) => x.name))})`);
  const at = content.subarray(s.spanStart, s.spanEnd).toString('utf8');
  assert.ok(at.startsWith('function déjà') && at.endsWith('}'), `the span [${s.spanStart}, ${s.spanEnd}) is not the declaration on disk: ${JSON.stringify(at)}`);
});

// ---------------------------------------------------------------------------
// RV15-13 — a tree-sitter frontend's version names the grammar package
// version. Plan Step 14 (the interface Step 15 implements): "`version` is the
// frontend's identity …: a string that changes whenever the rows `parse` or
// `resolve` can produce change — a grammar package version, a query text, or
// a resolver rule." The runtime and grammar packages are read from their own
// package.json files, not hard-coded. Kills: the package versions dropped
// from `version`.

test('RV15-13: every tree-sitter frontend version names the installed web-tree-sitter and tree-sitter-wasms versions', () => {
  // The package root is three levels above this compiled file (dist/test/unit/).
  const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
  const pkgVersion = (name: string): string =>
    (JSON.parse(readFileSync(path.join(packageRoot, 'node_modules', name, 'package.json'), 'utf8')) as { version: string }).version;
  const wts = pkgVersion('web-tree-sitter');
  const wasms = pkgVersion('tree-sitter-wasms');
  for (const lang of Object.keys(QUERIES)) {
    const v = treeSitterFrontend(lang).version;
    assert.ok(v.includes(wts) && v.includes(wasms), `${lang}: version ${JSON.stringify(v)} does not name web-tree-sitter ${wts} and tree-sitter-wasms ${wasms}`);
  }
});

// ---------------------------------------------------------------------------
// RV15-14 — the import forms of the three import-declaring languages each
// yield their edge. Plan Step 15: `typescript`, `tsx`, `javascript` and
// `python` "ship a definitions query and an imports query and a resolver
// (`imports: true`)"; AD-12: `import_edges` is "what import extraction
// actually yields". A re-export (`export … from`, an ECMAScript module
// dependency), TypeScript's `import x = require()`, and Python's `import a.b
// as c` (Python reference §7.11) are import statements of their language.
// Kills: the re-export, import-require and aliased-import patterns dropped.

test('RV15-14: a re-export, an import-require and a Python aliased import each yield their import edge', async () => {
  const { store } = await indexRepo('forms', [
    { path: 'src/util.ts', content: 'export function util(): number {\n  return 1;\n}\n' },
    { path: 'src/legacy.ts', content: 'export function legacy(): number {\n  return 2;\n}\n' },
    { path: 'src/index.ts', content: "export { util } from './util.js';\nimport legacy = require('./legacy.js');\n\nexport function entry(): unknown {\n  return legacy;\n}\n" },
    { path: 'pkg/__init__.py', content: '' },
    { path: 'pkg/mod.py', content: 'def f():\n    return 1\n' },
    { path: 'app.py', content: 'import pkg.mod as m\n\n\ndef run():\n    return m.f()\n' },
  ]);
  try {
    const edges = (
      store.prepare('SELECT s.path AS src, d.path AS dst FROM import_edges e JOIN files s ON s.id = e.src_file JOIN files d ON d.id = e.dst_file ORDER BY s.path, d.path').all() as { src: string; dst: string }[]
    ).map((e) => `${e.src} -> ${e.dst}`);
    for (const want of ['src/index.ts -> src/util.ts', 'src/index.ts -> src/legacy.ts', 'app.py -> pkg/mod.py']) {
      assert.ok(edges.includes(want), `the import edge ${want} is missing (edges ${JSON.stringify(edges)})`);
    }
  } finally {
    store.close();
  }
});

// ---------------------------------------------------------------------------
// RV15-15 — a dots-only relative Python specifier names the package itself.
// Plan Step 15 (PEP 328): "a specifier with `n` leading dots resolves against
// the `n − 1`-th parent package of `fromPath`'s directory"; with no module
// name after the dots (`from . import *`, captured as `.`), that is the
// package's own `__init__.py` (PEP 328: `from . import` imports from the
// current package). Kills: the empty module path resolving to nothing.

test('RV15-15: `.` and `..` from a Python file resolve to the package __init__.py they name', () => {
  const repo = repoFiles(['pkg/__init__.py', 'pkg/sub/__init__.py', 'pkg/sub/u.py'], []);
  assert.deepEqual(resolvePythonImport('pkg/sub/u.py', '.', repo), { kind: 'resolved', dst: 'pkg/sub/__init__.py' });
  assert.deepEqual(resolvePythonImport('pkg/sub/u.py', '..', repo), { kind: 'resolved', dst: 'pkg/__init__.py' });
});

// ---------------------------------------------------------------------------
// RV15-16 — defaultFrontends is exactly the table grammars that have a query,
// and exactly typescript, tsx, javascript and python declare imports. Plan
// Step 15: "`defaultFrontends(tuning)` returns one `treeSitterFrontend(lang)`
// per grammar that has a query in `QUERIES` and appears in
// `index.ext_to_grammar` …, then `genericFrontend` last"; "`typescript`,
// `tsx`, `javascript`, and `python` ship a definitions query and an imports
// query and a resolver (`imports: true`); every other grammar in the default
// table ships the definitions query … (`symbols: true, imports: false`)".
// T-15-6 checks each returned frontend but not that none is missing, and its
// samples cannot tell a tsx frontend that silently lost its resolver (it then
// declares imports: false and captures nothing). Kills: a table grammar left
// out of the list; tsx without a resolver.

test('RV15-16: defaultFrontends returns one frontend per queried table grammar, generic last, with imports declared by exactly the four resolving grammars', async () => {
  const global = openStore(path.join(root, 'dflt-global.db'));
  applyMigrations(global, { fts: false, scope: 'global' });
  seedDefaults(global);
  try {
    const reader = tuningReader(global, 'dflt', () => {});
    const table = new Set(reader.list('index.ext_to_grammar').map((m) => m.slice(m.indexOf('=') + 1)));
    const expected = [...table].filter((l) => Object.hasOwn(QUERIES, l)).sort();
    const list = defaultFrontends(reader);
    assert.deepEqual(list.map((f) => f.lang), [...expected, '*'], 'defaultFrontends is not one frontend per queried table grammar, sorted, then generic');
    const importing = list.filter((f) => f.capabilities.imports).map((f) => f.lang).sort();
    assert.deepEqual(importing, ['javascript', 'python', 'tsx', 'typescript'], 'the imports: true set is not typescript, tsx, javascript and python');
    for (const f of list) assert.equal(f.capabilities.symbols, true, `${f.lang} does not declare symbols: true`);
  } finally {
    global.close();
  }
});

// ---------------------------------------------------------------------------
// RV15-17 — a top-level `const x = await import(…)` binds the imported module,
// not a definition of the importer (the builder's recorded module-binding
// rule, implementation-log Step 15, and P4: false symbols poison pointers).
// RV15-8's dynamic import sits inside a function, so it never reaches the
// top-level `const` capture. Kills: the `await` form of the rule dropped.

test('RV15-17: a top-level await import() binding is not a symbol of the importer', async () => {
  const fe = treeSitterFrontend('typescript');
  await fe.init();
  const r = fe.parse('src/m.ts', Buffer.from("const lazy = await import('./lazy.js');\nexport const LIMIT = 3;\n"));
  assert.ok(r.ok, `parse failed: ${r.ok ? '' : r.error}`);
  const names = r.symbols.map((s) => s.name);
  assert.ok(names.includes('LIMIT'), `precondition: the top-level const LIMIT is a symbol (${JSON.stringify(names)})`);
  assert.ok(!names.includes('lazy'), `the await import() binding lazy is a symbol (${JSON.stringify(names)})`);
  assert.deepEqual(r.imports.map((i) => i.specifier), ['./lazy.js'], 'the dynamic import is not captured');
});

// ---------------------------------------------------------------------------
// RV15-18 — a file that starts with a UTF-8 byte order mark keeps byte-exact
// spans in both frontends. T-15-1 Data: a span is the declaration's byte
// span; the BOM is three bytes of the file (EF BB BF), so a decoder that
// strips it shifts every span three bytes early. Kills: either decoder
// stripping the BOM.

test('RV15-18: spans in a file with a UTF-8 BOM address the declaration bytes on disk (tree-sitter and generic)', async () => {
  const ts = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from('export function bom(): number {\n  return 1;\n}\n')]);
  const fe = treeSitterFrontend('typescript');
  await fe.init();
  const r = fe.parse('src/bom.ts', ts);
  assert.ok(r.ok, `parse failed: ${r.ok ? '' : r.error}`);
  const s = r.symbols.find((x) => x.name === 'bom');
  assert.ok(s !== undefined, 'bom is lost');
  assert.ok(ts.subarray(s.spanStart, s.spanEnd).toString('utf8').startsWith('function bom'), `tree-sitter span [${s.spanStart}, ${s.spanEnd}) is off the declaration`);
  const sh = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from('deploy() {\n  echo go\n}\n')]);
  const g = genericFrontend.parse('deploy.sh', sh);
  assert.ok(g.ok, `generic parse failed: ${g.ok ? '' : g.error}`);
  const d = g.symbols.find((x) => x.name === 'deploy');
  assert.ok(d !== undefined, `deploy is lost (${JSON.stringify(g.symbols.map((x) => x.name))})`);
  assert.ok(sh.subarray(d.spanStart, d.spanEnd).toString('utf8').startsWith('deploy()'), `generic span [${d.spanStart}, ${d.spanEnd}) is off the definition`);
});
