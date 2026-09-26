// tree-sitter frontend (Step 15, AD-12, V14 as corrected in plan §4).
//
// WALKING SKELETON (2026-09-25). Loads `tree-sitter-wasms/out/tree-sitter-<lang>.wasm`
// through web-tree-sitter 0.25.10 and extracts symbols and import specifiers
// with per-language queries. A parse that throws falls back to the generic
// frontend with `frontend_parse_failed`, and the dead parser is discarded.
// SKELETON: G13 — the plan requires "per-language tree-sitter queries" for 32
// grammars but writes none; the skeleton carries queries for four languages, and
// every other grammar in the table goes to the generic frontend.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Parser, Language, Query } from 'web-tree-sitter';
import type { ImportResolution, LanguageFrontend, RepoFiles } from './frontend.js';
import type { CapturedImport, SymbolRow } from '../types/index_types.js';
import { genericFrontend } from './generic_frontend.js';

const TS_QUERY = `
(function_declaration name: (identifier) @def.function)
(class_declaration name: (type_identifier) @def.class)
(interface_declaration name: (type_identifier) @def.interface)
(type_alias_declaration name: (type_identifier) @def.type)
(method_definition name: (property_identifier) @def.method)
(lexical_declaration (variable_declarator name: (identifier) @def.const))
(import_statement source: (string (string_fragment) @import))
(export_statement source: (string (string_fragment) @import))
`;
const JS_QUERY = `
(function_declaration name: (identifier) @def.function)
(class_declaration name: (identifier) @def.class)
(method_definition name: (property_identifier) @def.method)
(lexical_declaration (variable_declarator name: (identifier) @def.const))
(import_statement source: (string (string_fragment) @import))
(export_statement source: (string (string_fragment) @import))
`;
const PY_QUERY = `
(function_definition name: (identifier) @def.function)
(class_definition name: (identifier) @def.class)
(import_from_statement module_name: (relative_import) @import)
`;

export const QUERIES: Record<string, string> = {
  typescript: TS_QUERY,
  tsx: TS_QUERY,
  javascript: JS_QUERY,
  python: PY_QUERY,
};

let parserInit: Promise<void> | null = null;

export interface FaultSink {
  (lang: string, path: string, error: unknown): void;
}

// SKELETON: 14 — the skeleton's relative-specifier resolver (formerly the
// indexer's G12 stand-in), moved here as this frontend's `resolve` because
// Step 14's interface puts resolution on the frontend: the path as written,
// then TypeScript's `.js`→`.ts` convention, then added extensions and
// `/index.*`; a found file is `resolved`, a relative miss `unresolved`, a bare
// (package) specifier `external` (the skeleton counted nothing for it) (plan §9
// row "Step 14's skeleton frontends"); retired by Step 15
function skeletonResolve(fromPath: string, spec: string, repo: RepoFiles): ImportResolution {
  if (!spec.startsWith('.')) return { kind: 'external' };
  const base = path.posix.normalize(path.posix.join(path.posix.dirname(fromPath), spec));
  const tries = [
    base,
    base.replace(/\.(m|c)?js$/, '.$1ts'),
    base.replace(/\.jsx$/, '.tsx'),
    ...['.ts', '.tsx', '.js', '.mjs', '.py'].map((e) => base + e),
    ...['/index.ts', '/index.js', '/__init__.py'].map((e) => base + e),
  ];
  for (const t of tries) if (t !== fromPath && repo.has(t)) return { kind: 'resolved', dst: t };
  return { kind: 'unresolved' };
}

// SKELETON: 14 — wrapped to Step 14's LanguageFrontend: `capabilities`
// {symbols: true, imports: true} (every skeleton query captures both), the
// existing `init`, `parse` returning `{ok: true, symbols, imports}` with the
// captured specifiers mapped from the skeleton's edges, and `resolve` above
// (plan §9 row "Step 14's skeleton frontends"); retired by Step 15
export function treeSitterFrontend(lang: string, onParseFailed: FaultSink): LanguageFrontend {
  let language: Language | null = null;
  let query: Query | null = null;
  let parser: Parser | null = null;
  return {
    lang,
    capabilities: { symbols: true, imports: true },
    resolve: skeletonResolve,
    async init() {
      parserInit ??= Parser.init();
      await parserInit;
      const wasm = fileURLToPath(import.meta.resolve(`tree-sitter-wasms/out/tree-sitter-${lang}.wasm`));
      language = await Language.load(wasm);
      query = new Query(language, QUERIES[lang] as string);
    },
    parse(path, content) {
      if (language === null || query === null) throw new Error(`treeSitterFrontend(${lang}) used before init`);
      try {
        parser ??= new Parser();
        parser.setLanguage(language);
        const tree = parser.parse(content.toString('utf8'));
        if (tree === null) throw new Error('parse returned null');
        const symbols: SymbolRow[] = [];
        const imports: CapturedImport[] = [];
        for (const c of query.captures(tree.rootNode)) {
          if (c.name === 'import') imports.push({ specifier: c.node.text, kind: 'import' });
          else if (c.name.startsWith('def.'))
            symbols.push({ name: c.node.text, kind: c.name.slice(4), spanStart: c.node.startIndex, spanEnd: c.node.endIndex });
        }
        tree.delete();
        return { ok: true, symbols, imports };
      } catch (e) {
        // A parser that threw is dead afterwards (probe:20_grammar_inventory):
        // discard it so the next file gets a fresh instance.
        parser = null;
        onParseFailed(lang, path, e);
        return genericFrontend.parse(path, content);
      }
    },
  };
}
