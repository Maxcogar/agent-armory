// Generic line-based frontend (Step 15; AD-12, L6). Deliberately weaker than a
// grammar: definition-shaped lines only, found by identifier-shape regexes,
// and no imports — the generic frontend declares `imports: false`, so it never
// yields an `import_edges` or `symbol_refs` row, which is what keeps a
// generic-frontend candidate structurally uncountable in the Reuse dominance
// test (Step 18, L6). Like every `LanguageFrontend` it returns `{symbols,
// imports}` only and writes no FTS row: `runIndex` (Step 14) tokenizes the
// names it finds into `fts_symbols` and `symbol_tokens`.
//
// It covers every file no tree-sitter frontend takes — an extension outside
// `index.ext_to_grammar` (`.sh`, `.lua`, `.yml`, …), a grammar with no written
// query (`QUERIES`, tree_sitter_frontend.ts), a disabled frontend — and every
// file whose tree-sitter parse failed (the indexer's fallback, Step 15).
import type { LanguageFrontend } from './frontend.js';
import type { SymbolRow } from '../types/index_types.js';
import { sha256Short } from '../util/hash.js';

/** Characters a shell function name cannot contain (bash accepts any other word, e.g. `foo-bar`, `my.method`, `Foo::Bar`). */
const SH_NAME = `[^\\s()<>|&;'"\`$=#{}\\\\]+`;

/** First match per line wins, in this order. */
const DEF: readonly { re: RegExp; kind: string }[] = [
  // JavaScript / TypeScript.
  { re: /^\s*(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)\s*\(/, kind: 'function' },
  { re: /^\s*(?:export\s+)?(?:default\s+)?(?:abstract\s+)?class\s+([A-Za-z_$][\w$]*)/, kind: 'class' },
  // Python (and Ruby's `def name`).
  { re: /^\s*(?:async\s+)?def\s+([A-Za-z_]\w*)/, kind: 'function' },
  // Rust.
  { re: /^\s*(?:pub(?:\([^)]*\))?\s+)?(?:async\s+)?fn\s+([A-Za-z_]\w*)/, kind: 'function' },
  // Lua (`function M.name(`, `local function name(`; lua is excluded from the tree-sitter table, §4).
  { re: /^\s*(?:local\s+)?function\s+([A-Za-z_][\w.:]*)\s*\(/, kind: 'function' },
  // Shell: `name() {` (POSIX) and `function name {` / `function name() {` (the keyword form).
  { re: new RegExp(`^\\s*function\\s+(${SH_NAME})\\s*(?:\\(\\s*\\)\\s*)?\\{`), kind: 'function' },
  { re: new RegExp(`^\\s*(${SH_NAME})\\s*\\(\\s*\\)\\s*\\{`), kind: 'function' },
];

const UTF8 = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true });

/**
 * The file's text in an encoding whose code units map to bytes exactly as
 * computed below: UTF-8 when the bytes are valid UTF-8, else `latin1` (one
 * byte per character), so a span always addresses the bytes on disk.
 */
function decode(content: Buffer): { text: string; encoding: 'utf8' | 'latin1' } {
  try {
    return { text: UTF8.decode(content), encoding: 'utf8' };
  } catch {
    return { text: content.toString('latin1'), encoding: 'latin1' };
  }
}

export const genericFrontend: LanguageFrontend = {
  lang: '*',
  capabilities: { symbols: true, imports: false },
  // Changes whenever the regexes (the only thing that shapes its rows) change.
  version: `generic:${sha256Short(DEF.map((d) => `${d.kind}:${d.re.source}`).join('\n'))}`,
  async init() {},
  parse(_path, content) {
    try {
      const { text, encoding } = decode(content);
      const symbols: SymbolRow[] = [];
      let offset = 0;
      for (const line of text.split('\n')) {
        for (const d of DEF) {
          const m = d.re.exec(line);
          if (m !== null) {
            const name = m[1] as string;
            // The span is the definition line, indentation and trailing
            // whitespace excluded: the nearest a line heuristic comes to the
            // declaration node's span a grammar gives (T-15-1), and it
            // contains the name.
            const start = offset + Buffer.byteLength(line.slice(0, line.length - line.trimStart().length), encoding);
            const end = offset + Buffer.byteLength(line.trimEnd(), encoding);
            symbols.push({ name, kind: d.kind, spanStart: start, spanEnd: end });
            break;
          }
        }
        offset += Buffer.byteLength(line, encoding) + 1;
      }
      return { ok: true, symbols, imports: [] };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? `${e.name}: ${e.message}` : String(e) };
    }
  },
};
