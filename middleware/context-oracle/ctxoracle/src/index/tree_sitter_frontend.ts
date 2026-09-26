// tree-sitter frontend (Step 15; AD-12, V14 as corrected in plan §4, G12,
// G13, G14).
//
// `treeSitterFrontend(lang)` loads `tree-sitter-wasms/out/tree-sitter-<lang>.wasm`
// (the package's output directory and file naming, V14; resolved with
// `import.meta.resolve`) through `web-tree-sitter` 0.25.10 and extracts symbols
// and import specifiers with the grammar's query in `QUERIES`.
//
// Capabilities are declared from what is written here, never assumed (G13):
// a grammar with an entry in `QUERIES` gets `symbols: true`; one that also has
// a resolver in `RESOLVERS` (typescript, tsx, javascript, python) gets
// `imports: true`, and its query captures imports; every other grammar's query
// captures definitions only, so it yields no import. A grammar with no
// `QUERIES` entry is not given a tree-sitter frontend at all — its extension
// falls to the generic frontend — and `QUERIES` is the data `status` prints
// per language, so coverage is measured, not claimed.
//
// Query conventions: a match's `@def.<kind>` capture is the declaration node
// (its byte span is the symbol's span, which contains the name — T-15-1) and
// its `@name` capture the name; `@import` is a node whose text is an import
// specifier; `@import.from` is a Python `from <dots> import a, b` statement
// whose module part is dots only, expanded here to `<dots>a`, `<dots>b` (plan
// Step 15: `from . import mod` is captured as `.mod`). Captures starting with
// `_` are predicate operands. Definitions are declarations with a name the
// language itself binds (functions, methods, classes, types, modules,
// top-level constants) — never local variables, which would poison pointers
// (P4).
//
// Grammars with no query, and why (the build's call, plan Step 15): `css`,
// `html`, `json`, `toml` are style/markup/data formats with no named
// declaration of the kind a symbol is; `embedded_template` and `vue` parse the
// template layer only (the embedded code is an opaque text node), so a query
// there would find nothing the generic frontend's line heuristics cannot.
//
// `init()` calls `Parser.init()` once per process and loads the grammar once
// per process (cached); `parse` returns `{ok: false, error}` on any throwable
// — a `TypeError` from an unresolved scanner import, a `RuntimeError` from a
// trap — and discards the parser instance that threw (dead afterwards,
// executed, plan §4), so the next parse gets a fresh one. The indexer, which
// holds the store, then indexes the file through the generic frontend and
// records `frontend_parse_failed`. Parsers are pooled inside this process
// only (AD-1: no cross-process state).
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Parser, Language, Query, type Node as TsNode } from 'web-tree-sitter';
import type { ImportResolver, LanguageFrontend } from './frontend.js';
import type { CapturedImport, SymbolRow } from '../types/index_types.js';
import { resolvePythonImport, resolveTsImport, RESOLVER_RULES_VERSION } from './resolvers.js';
import { sha256Short } from '../util/hash.js';

// ---------------------------------------------------------------------------
// Queries, per grammar.

const TS_DEFS = `
(function_declaration name: (identifier) @name) @def.function
(generator_function_declaration name: (identifier) @name) @def.function
(class_declaration name: (type_identifier) @name) @def.class
(abstract_class_declaration name: (type_identifier) @name) @def.class
(interface_declaration name: (type_identifier) @name) @def.interface
(type_alias_declaration name: (type_identifier) @name) @def.type
(enum_declaration name: (identifier) @name) @def.enum
(method_definition name: (property_identifier) @name) @def.method
(program (lexical_declaration (variable_declarator name: (identifier) @name) @def.const))
(program (export_statement declaration: (lexical_declaration (variable_declarator name: (identifier) @name) @def.const)))
`;
const JS_DEFS = `
(function_declaration name: (identifier) @name) @def.function
(generator_function_declaration name: (identifier) @name) @def.function
(class_declaration name: (identifier) @name) @def.class
(method_definition name: (property_identifier) @name) @def.method
(program (lexical_declaration (variable_declarator name: (identifier) @name) @def.const))
(program (export_statement declaration: (lexical_declaration (variable_declarator name: (identifier) @name) @def.const)))
`;
/** Static and re-export sources, `import x = require()`, `require('x')`, and `import('x')` with a string literal. */
const JS_IMPORTS = `
(import_statement source: (string (string_fragment) @import))
(export_statement source: (string (string_fragment) @import))
(call_expression function: (identifier) @_req (#eq? @_req "require") arguments: (arguments . (string (string_fragment) @import) .))
(call_expression function: (import) arguments: (arguments . (string (string_fragment) @import) .))
`;
const TS_IMPORTS = `${JS_IMPORTS}
(import_require_clause source: (string (string_fragment) @import))
`;

const C_FUNCTION_NAMES = `
(function_definition declarator: (function_declarator declarator: (identifier) @name)) @def.function
(function_definition declarator: (pointer_declarator declarator: (function_declarator declarator: (identifier) @name))) @def.function
(function_definition declarator: (pointer_declarator declarator: (pointer_declarator declarator: (function_declarator declarator: (identifier) @name)))) @def.function
`;
const C_TYPES = `
(struct_specifier name: (type_identifier) @name body: (field_declaration_list)) @def.struct
(union_specifier name: (type_identifier) @name body: (field_declaration_list)) @def.union
(enum_specifier name: (type_identifier) @name body: (enumerator_list)) @def.enum
(type_definition declarator: (type_identifier) @name) @def.type
(preproc_def name: (identifier) @name) @def.macro
(preproc_function_def name: (identifier) @name) @def.macro
`;

export const QUERIES: Record<string, string> = {
  typescript: TS_DEFS + TS_IMPORTS,
  tsx: TS_DEFS + TS_IMPORTS,
  javascript: JS_DEFS + JS_IMPORTS,
  python: `
(function_definition name: (identifier) @name) @def.function
(class_definition name: (identifier) @name) @def.class
(import_statement name: (dotted_name) @import)
(import_statement name: (aliased_import name: (dotted_name) @import))
(import_from_statement module_name: (dotted_name) @import)
(import_from_statement module_name: (relative_import (import_prefix) (dotted_name)) @import)
(import_from_statement module_name: (relative_import . (import_prefix) .)) @import.from
`,
  c: C_FUNCTION_NAMES + C_TYPES,
  cpp: `${C_FUNCTION_NAMES}${C_TYPES}
(function_definition declarator: (function_declarator declarator: (field_identifier) @name)) @def.method
(function_definition declarator: (function_declarator declarator: (qualified_identifier name: (identifier) @name))) @def.method
(function_definition declarator: (reference_declarator (function_declarator declarator: (identifier) @name))) @def.function
(class_specifier name: (type_identifier) @name body: (field_declaration_list)) @def.class
(namespace_definition name: (namespace_identifier) @name) @def.namespace
`,
  c_sharp: `
(class_declaration name: (identifier) @name) @def.class
(interface_declaration name: (identifier) @name) @def.interface
(struct_declaration name: (identifier) @name) @def.struct
(enum_declaration name: (identifier) @name) @def.enum
(record_declaration name: (identifier) @name) @def.record
(method_declaration name: (identifier) @name) @def.method
(constructor_declaration name: (identifier) @name) @def.constructor
(property_declaration name: (identifier) @name) @def.property
(namespace_declaration name: (identifier) @name) @def.namespace
`,
  dart: `
(function_signature name: (identifier) @name) @def.function
(getter_signature name: (identifier) @name) @def.getter
(constructor_signature name: (identifier) @name) @def.constructor
(class_definition name: (identifier) @name) @def.class
(mixin_declaration (identifier) @name) @def.mixin
(enum_declaration name: (identifier) @name) @def.enum
(extension_declaration name: (identifier) @name) @def.extension
`,
  elisp: `
(function_definition name: (symbol) @name) @def.function
(macro_definition name: (symbol) @name) @def.macro
`,
  elixir: `
(call target: (identifier) @_kw (#any-of? @_kw "def" "defp" "defmacro" "defmacrop" "defguard" "defguardp" "defdelegate") (arguments . [(identifier) @name (call target: (identifier) @name)])) @def.function
(call target: (identifier) @_kw (#any-of? @_kw "defmodule" "defprotocol") (arguments . (alias) @name)) @def.module
`,
  go: `
(function_declaration name: (identifier) @name) @def.function
(method_declaration name: (field_identifier) @name) @def.method
(type_spec name: (type_identifier) @name) @def.type
(source_file (const_declaration (const_spec name: (identifier) @name) @def.const))
(source_file (var_declaration (var_spec name: (identifier) @name) @def.var))
`,
  java: `
(class_declaration name: (identifier) @name) @def.class
(interface_declaration name: (identifier) @name) @def.interface
(enum_declaration name: (identifier) @name) @def.enum
(record_declaration name: (identifier) @name) @def.record
(annotation_type_declaration name: (identifier) @name) @def.annotation
(method_declaration name: (identifier) @name) @def.method
(constructor_declaration name: (identifier) @name) @def.constructor
`,
  kotlin: `
(function_declaration (simple_identifier) @name) @def.function
(class_declaration (type_identifier) @name) @def.class
(object_declaration (type_identifier) @name) @def.object
(type_alias (type_identifier) @name) @def.type
(source_file (property_declaration (variable_declaration (simple_identifier) @name)) @def.property)
`,
  objc: `${C_FUNCTION_NAMES}${C_TYPES}
(class_interface . (identifier) @name) @def.class
(class_implementation . (identifier) @name) @def.class
(protocol_declaration . (identifier) @name) @def.protocol
(method_declaration (method_type) . (identifier) @name) @def.method
(method_definition (method_type) . (identifier) @name) @def.method
`,
  ocaml: `
(compilation_unit (value_definition (let_binding pattern: (value_name) @name) @def.value))
(structure (value_definition (let_binding pattern: (value_name) @name) @def.value))
(type_binding name: (type_constructor) @name) @def.type
(module_binding name: (module_name) @name) @def.module
(module_type_definition name: (module_type_name) @name) @def.module_type
(class_binding name: (class_name) @name) @def.class
(external (value_name) @name) @def.external
`,
  php: `
(function_definition name: (name) @name) @def.function
(method_declaration name: (name) @name) @def.method
(class_declaration name: (name) @name) @def.class
(interface_declaration name: (name) @name) @def.interface
(trait_declaration name: (name) @name) @def.trait
(enum_declaration name: (name) @name) @def.enum
`,
  rescript: `
(source_file (let_declaration (let_binding pattern: (value_identifier) @name) @def.value))
(module_declaration (module_binding definition: (block (let_declaration (let_binding pattern: (value_identifier) @name) @def.value))))
(type_binding name: (type_identifier) @name) @def.type
(module_binding name: (module_identifier) @name) @def.module
(external_declaration (value_identifier) @name) @def.external
`,
  ruby: `
(method name: (_) @name) @def.method
(singleton_method name: (_) @name) @def.method
(class name: (constant) @name) @def.class
(module name: (constant) @name) @def.module
`,
  rust: `
(function_item name: (identifier) @name) @def.function
(function_signature_item name: (identifier) @name) @def.function
(struct_item name: (type_identifier) @name) @def.struct
(enum_item name: (type_identifier) @name) @def.enum
(union_item name: (type_identifier) @name) @def.union
(trait_item name: (type_identifier) @name) @def.trait
(type_item name: (type_identifier) @name) @def.type
(const_item name: (identifier) @name) @def.const
(static_item name: (identifier) @name) @def.static
(mod_item name: (identifier) @name) @def.module
(macro_definition name: (identifier) @name) @def.macro
`,
  scala: `
(function_definition name: (identifier) @name) @def.function
(class_definition name: (identifier) @name) @def.class
(object_definition name: (identifier) @name) @def.object
(trait_definition name: (identifier) @name) @def.trait
`,
  solidity: `
(contract_declaration name: (identifier) @name) @def.contract
(interface_declaration name: (identifier) @name) @def.interface
(library_declaration name: (identifier) @name) @def.library
(function_definition name: (identifier) @name) @def.function
(modifier_definition name: (identifier) @name) @def.modifier
(event_definition name: (identifier) @name) @def.event
(struct_declaration name: (identifier) @name) @def.struct
`,
  swift: `
(function_declaration name: (simple_identifier) @name) @def.function
(class_declaration name: (type_identifier) @name) @def.class
(protocol_declaration name: (type_identifier) @name) @def.protocol
`,
  systemrdl: `
(component_named_def id: (id) @name) @def.component
(property_definition (id) @name) @def.property
(enum_def (id) @name) @def.enum
`,
  tlaplus: `
(module name: (identifier) @name) @def.module
(operator_definition name: (identifier) @name) @def.operator
(theorem name: (identifier) @name) @def.theorem
`,
  zig: `
(function_declaration name: (identifier) @name) @def.function
(source_file (variable_declaration (identifier) @name) @def.const)
`,
  // Outside the default table (`bash`'s scanner imports a symbol the runtime
  // never exports, so any `case … esac` parse throws — plan §4); written so a
  // caller that registers it explicitly (T-15-4) gets definitions from every
  // file whose parse succeeds.
  bash: `
(function_definition name: (word) @name) @def.function
`,
};

/**
 * A top-level binding whose value is a module load (`const x = require('./x')`,
 * `const x = await import('./x')`, zig's `const x = @import("x.zig")`) names
 * the imported module, not a definition of this file: kept, it would be a
 * same-named false symbol beside the real one (P4). True when `def` is one.
 */
function isModuleBinding(def: TsNode): boolean {
  let value = def.childForFieldName('value');
  if (value === null) {
    // zig: `variable_declaration (identifier) (builtin_function …)`, no field.
    value = def.namedChildren.find((c) => c?.type === 'builtin_function') ?? null;
    return value !== null && value.namedChildren[0]?.text === '@import';
  }
  if (value.type === 'await_expression') value = value.namedChildren[0] ?? null;
  if (value?.type !== 'call_expression') return false;
  const fn = value.childForFieldName('function');
  return fn !== null && (fn.type === 'import' || (fn.type === 'identifier' && fn.text === 'require'));
}

/** The grammars whose query captures imports, and each one's resolver (AD-12's stated external rules). */
const RESOLVERS: Record<string, ImportResolver> = {
  typescript: resolveTsImport,
  tsx: resolveTsImport,
  javascript: resolveTsImport,
  python: resolvePythonImport,
};

// ---------------------------------------------------------------------------
// Process-wide caches (AD-1: inside this process only).

let parserInit: Promise<void> | null = null;
const loaded = new Map<string, Promise<{ language: Language; query: Query }>>();

function load(lang: string): Promise<{ language: Language; query: Query }> {
  let p = loaded.get(lang);
  if (p === undefined) {
    p = (async () => {
      parserInit ??= Parser.init();
      await parserInit;
      const wasm = fileURLToPath(import.meta.resolve(`tree-sitter-wasms/out/tree-sitter-${lang}.wasm`));
      const language = await Language.load(wasm);
      return { language, query: new Query(language, QUERIES[lang] as string) };
    })();
    // A rejected load is not cached: a later pass may find the file restored.
    p.catch(() => loaded.delete(lang));
    loaded.set(lang, p);
  }
  return p;
}

/** A package's `version`, read from its `package.json` beside the resolved entry file; `unknown` when unreadable. */
function packageVersion(entrySpecifier: string, levelsUp: number): string {
  try {
    let dir = path.dirname(fileURLToPath(import.meta.resolve(entrySpecifier)));
    for (let i = 0; i < levelsUp; i++) dir = path.dirname(dir);
    const json = JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8')) as { version?: unknown };
    return typeof json.version === 'string' ? json.version : 'unknown';
  } catch {
    return 'unknown';
  }
}

let runtimeIdentity: string | null = null;
/** `web-tree-sitter@<v>+tree-sitter-wasms@<v>`: the runtime and grammar package versions, read once. */
function runtimeVersions(): string {
  runtimeIdentity ??= `web-tree-sitter@${packageVersion('web-tree-sitter', 0)}+tree-sitter-wasms@${packageVersion('tree-sitter-wasms/out/tree-sitter-c.wasm', 1)}`;
  return runtimeIdentity;
}

// ---------------------------------------------------------------------------
// Offsets: web-tree-sitter parses a JavaScript string and reports indices in
// UTF-16 code units (its C binding returns `byte >> 1` over UTF-16 input); a
// symbol's span is in bytes of the file (AD-12), so non-ASCII text is mapped.

const UTF8 = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true });

function byteOffsets(text: string): (i: number) => number {
  if (!/[^\x00-\x7f]/.test(text)) return (i) => i;
  const map = new Uint32Array(text.length + 1);
  let b = 0;
  for (let i = 0; i < text.length; i++) {
    map[i] = b;
    const c = text.charCodeAt(i);
    if (c < 0x80) b += 1;
    else if (c < 0x800) b += 2;
    else if (c >= 0xd800 && c <= 0xdbff && i + 1 < text.length) {
      const d = text.charCodeAt(i + 1);
      if (d >= 0xdc00 && d <= 0xdfff) {
        map[i + 1] = b;
        b += 4;
        i += 1;
        continue;
      }
      b += 3;
    } else b += 3;
  }
  map[text.length] = b;
  return (i) => map[i] as number;
}

/** `from <dots> import a, b as c` → `<dots>a`, `<dots>b`; `from <dots> import *` → `<dots>`. */
function expandFromImport(stmt: TsNode): string[] {
  const prefix = stmt.childForFieldName('module_name')?.text ?? '';
  const names = stmt.childrenForFieldName('name').flatMap((n) => {
    if (n === null) return [];
    if (n.type === 'aliased_import') return [n.childForFieldName('name')?.text ?? ''];
    return [n.text];
  });
  const real = names.filter((n) => n !== '');
  return real.length === 0 ? [prefix] : real.map((n) => prefix + n);
}

// ---------------------------------------------------------------------------

export function treeSitterFrontend(lang: string): LanguageFrontend {
  const queryText = Object.hasOwn(QUERIES, lang) ? QUERIES[lang] : undefined;
  if (queryText === undefined) {
    // Plan Step 15: a grammar with no written query gets no tree-sitter
    // frontend (defaultFrontends never asks for one).
    throw new Error(`treeSitterFrontend: no query is written for grammar ${JSON.stringify(lang)}`);
  }
  const resolver = RESOLVERS[lang];
  const imports = resolver !== undefined;
  let grammar: { language: Language; query: Query } | null = null;
  let parser: Parser | null = null;

  const discardParser = (): void => {
    const dead = parser;
    parser = null;
    try {
      dead?.delete();
    } catch {
      // A parser that threw may not delete cleanly; it is unreachable either way.
    }
  };

  const fe: LanguageFrontend = {
    lang,
    capabilities: { symbols: true, imports },
    version: `tree-sitter:${lang}:${runtimeVersions()}:query=${sha256Short(queryText)}${imports ? `:${RESOLVER_RULES_VERSION}` : ''}`,
    async init() {
      grammar = await load(lang);
    },
    parse(_path, content) {
      if (grammar === null) return { ok: false, error: `treeSitterFrontend(${lang}) used before init` };
      let text: string;
      try {
        text = UTF8.decode(content);
      } catch {
        return { ok: false, error: 'content is not valid UTF-8' };
      }
      let tree: ReturnType<Parser['parse']> = null;
      try {
        parser ??= new Parser();
        parser.setLanguage(grammar.language);
        tree = parser.parse(text);
        if (tree === null) throw new Error('parse returned no tree');
        const toByte = byteOffsets(text);
        const symbols: SymbolRow[] = [];
        const captured: CapturedImport[] = [];
        const seen = new Set<string>();
        for (const m of grammar.query.matches(tree.rootNode)) {
          let def: { kind: string; node: TsNode } | null = null;
          let name: TsNode | null = null;
          for (const c of m.captures) {
            if (c.name === 'name') name = c.node;
            else if (c.name.startsWith('def.')) def = { kind: c.name.slice(4), node: c.node };
            else if (imports && c.name === 'import') captured.push({ specifier: c.node.text, kind: 'import' });
            else if (imports && c.name === 'import.from') for (const s of expandFromImport(c.node)) captured.push({ specifier: s, kind: 'import' });
          }
          if (def === null || name === null || name.text === '') continue;
          if (def.kind === 'const' && isModuleBinding(def.node)) continue;
          const spanStart = toByte(def.node.startIndex);
          const spanEnd = toByte(def.node.endIndex);
          const key = `${def.kind}\0${name.text}\0${spanStart}`;
          if (seen.has(key)) continue;
          seen.add(key);
          symbols.push({ name: name.text, kind: def.kind, spanStart, spanEnd });
        }
        symbols.sort((a, b) => a.spanStart - b.spanStart || a.spanEnd - b.spanEnd);
        return { ok: true, symbols, imports: captured };
      } catch (e) {
        // A parser that threw is dead afterwards (plan §4, executed): discard
        // it so the next file gets a fresh instance.
        discardParser();
        return { ok: false, error: e instanceof Error ? `${e.name}: ${e.message}` : String(e) };
      } finally {
        try {
          tree?.delete();
        } catch {
          // A tree from a parser that then threw may not delete cleanly.
        }
      }
    },
  };
  if (resolver !== undefined) fe.resolve = resolver;
  return fe;
}
