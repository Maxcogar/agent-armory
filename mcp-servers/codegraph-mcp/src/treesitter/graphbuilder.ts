import Parser from "tree-sitter";

import { Language } from "../types.js";
import type { SymbolGraph } from "../tscompiler/connections.js";

// ============================================================
// Shared symbol-graph construction (tree-sitter builders)
// ============================================================
//
// Every per-language connection builder produces the same {uses, usedBy, info,
// covered} shape and needs the same edge/dedup bookkeeping. This centralizes it
// so the builders carry only their language-specific resolution, and so the
// "who uses this" attribution is computed *structurally* (by enclosing
// declaration) rather than by a line-number heuristic that mis-assigns a
// reference sitting between two declarations.

type Node = Parser.SyntaxNode;

export const MODULE = "(module)";

/** Accumulates symbol-to-symbol edges with their readable info, de-duplicating
 *  edges and keeping the first-seen location for each key. */
export class SymbolGraphBuilder {
  readonly uses = new Map<string, Set<string>>();
  readonly usedBy = new Map<string, Set<string>>();
  readonly info = new Map<string, { file: string; name: string; line: number }>();
  readonly covered = new Set<string>();

  private ensure(m: Map<string, Set<string>>, k: string): Set<string> {
    let s = m.get(k);
    if (!s) m.set(k, (s = new Set()));
    return s;
  }

  /** Record that `from` references `to`. Self-edges are dropped. */
  addEdge(from: string, to: string): void {
    if (from === to) return;
    this.ensure(this.uses, from).add(to);
    this.ensure(this.usedBy, to).add(from);
  }

  /** Record a key's location, keeping the first one seen. */
  setInfo(key: string, file: string, name: string, line: number): void {
    if (!this.info.has(key)) this.info.set(key, { file, name, line });
  }

  /** The synthetic top-level node for a file (code that runs on load/import). */
  moduleKey(file: string): string {
    const key = `${file}#${MODULE}`;
    this.setInfo(key, file, "(module top-level)", 0);
    return key;
  }

  result(): SymbolGraph {
    return { uses: this.uses, usedBy: this.usedBy, info: this.info, covered: this.covered };
  }
}

// The declaration node types whose named declaration owns the references in its
// subtree, per language — the *same* nodes symbol extraction keys on, so the
// enclosing symbol is exactly one that appears in the graph (never a phantom).
const ENCLOSING_DECLS: Partial<Record<Language, ReadonlySet<string>>> = {
  go: new Set(["function_declaration", "method_declaration", "type_spec"]),
  rust: new Set([
    "function_item", "struct_item", "enum_item", "union_item",
    "trait_item", "type_item", "const_item", "static_item",
  ]),
  java: new Set([
    "class_declaration", "record_declaration", "interface_declaration",
    "enum_declaration", "method_declaration",
  ]),
  csharp: new Set([
    "class_declaration", "record_declaration", "struct_declaration",
    "interface_declaration", "enum_declaration", "method_declaration",
  ]),
  php: new Set([
    "function_definition", "class_declaration", "trait_declaration",
    "interface_declaration", "enum_declaration", "method_declaration",
  ]),
  ruby: new Set(["class", "module", "method", "singleton_method"]),
};

/**
 * If `node` is a named declaration for `language`, the symbol key it introduces
 * — so references anywhere in its subtree attribute to it. Returns null when the
 * node is not a declaration (the enclosing scope is unchanged). Mirrors symbol
 * extraction (`childForFieldName("name")`), so the key always matches a symbol.
 */
export function enclosingDeclKey(language: Language, node: Node, file: string): string | null {
  const decls = ENCLOSING_DECLS[language];
  if (!decls || !decls.has(node.type)) return null;
  const name = node.childForFieldName("name")?.text;
  return name ? `${file}#${name}` : null;
}
