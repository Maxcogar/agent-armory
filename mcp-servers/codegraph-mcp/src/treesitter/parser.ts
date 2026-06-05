import Parser from "tree-sitter";
import TypeScript from "tree-sitter-typescript";
import Python from "tree-sitter-python";
import Cpp from "tree-sitter-cpp";

import { Language } from "../types.js";

// ============================================================
// tree-sitter grammar loading (synchronous, native bindings)
// ============================================================
//
// Native tree-sitter bindings parse synchronously (no async WASM init), which
// matches the rest of codegraph's synchronous parse path. The tsx grammar is a
// superset that handles plain JS/TS *and* JSX/TSX, so the whole JS/TS family
// uses one grammar — no per-extension branching.

// tree-sitter-typescript exports both `typescript` and `tsx`; the runtime shape
// isn't reflected in its node-types .d.ts, so narrow it explicitly.
const TSX = (TypeScript as unknown as { tsx: unknown }).tsx;

type Grammar = unknown;

/** The tree-sitter grammar for a language, or null when unsupported. */
export function grammarFor(language: Language): Grammar | null {
  switch (language) {
    case "typescript":
    case "javascript":
      return TSX;
    case "python":
      return Python as unknown as Grammar;
    case "cpp":
    case "arduino":
      return Cpp as unknown as Grammar;
    default:
      return null;
  }
}

// One Parser per grammar, reused across files. A Parser holds no per-file state
// once parse() returns, so reuse is safe and avoids re-binding the language.
const parserCache = new Map<Grammar, Parser>();

function parserFor(grammar: Grammar): Parser {
  let parser = parserCache.get(grammar);
  if (!parser) {
    parser = new Parser();
    // setLanguage accepts the opaque native grammar object.
    parser.setLanguage(grammar as Parameters<Parser["setLanguage"]>[0]);
    parserCache.set(grammar, parser);
  }
  return parser;
}

/**
 * Parse source code for a language into a tree-sitter tree, or null when the
 * language has no grammar. tree-sitter is error-tolerant: malformed input still
 * yields a tree (with error nodes) rather than throwing.
 */
export function parseSource(language: Language, code: string): Parser.Tree | null {
  const grammar = grammarFor(language);
  if (!grammar) return null;
  return parserFor(grammar).parse(code);
}
