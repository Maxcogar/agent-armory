/**
 * Symbol + import/export extraction from a Tree-sitter concrete syntax tree.
 *
 * Scope (Architecture L3): top-level declarations and import/export edges for
 * the JS/TS family and Python. Full call-graph extraction is a declared gap and
 * is reported via capability gaps, never silently assumed.
 */
import type { SymbolKind, SymbolRecord, EdgeRecord } from '../../core/domain/repository-map.js';

type Sym = Omit<SymbolRecord, 'snapshot_id'>;
type Edge = Omit<EdgeRecord, 'snapshot_id'>;

interface TSNode {
  type: string;
  text: string;
  namedChildCount: number;
  namedChild(i: number): TSNode | null;
  childForFieldName(name: string): TSNode | null;
  startPosition: { row: number; column: number };
  endPosition: { row: number; column: number };
}

const isPascal = (s: string) => /^[A-Z][A-Za-z0-9]*$/.test(s);
const stripQuotes = (s: string) => s.replace(/^['"`]|['"`]$/g, '');

function mkSym(path: string, name: string, kind: SymbolKind, node: TSNode, exported: boolean): Sym {
  return {
    name, kind, path,
    start_line: node.startPosition.row + 1,
    end_line: node.endPosition.row + 1,
    exported,
  };
}

// ---------- JS / TS family ----------

function extractJsDeclaration(path: string, node: TSNode, exported: boolean, out: Sym[]): void {
  const nameNode = node.childForFieldName('name');
  switch (node.type) {
    case 'function_declaration':
    case 'generator_function_declaration':
      if (nameNode) out.push(mkSym(path, nameNode.text, 'function', node, exported));
      return;
    case 'class_declaration':
    case 'abstract_class_declaration':
      if (nameNode) out.push(mkSym(path, nameNode.text, 'class', node, exported));
      return;
    case 'interface_declaration':
      if (nameNode) out.push(mkSym(path, nameNode.text, 'interface', node, exported));
      return;
    case 'type_alias_declaration':
      if (nameNode) out.push(mkSym(path, nameNode.text, 'type', node, exported));
      return;
    case 'enum_declaration':
      if (nameNode) out.push(mkSym(path, nameNode.text, 'type', node, exported));
      return;
    case 'lexical_declaration':
    case 'variable_declaration': {
      for (let i = 0; i < node.namedChildCount; i++) {
        const decl = node.namedChild(i);
        if (!decl || decl.type !== 'variable_declarator') continue;
        const n = decl.childForFieldName('name');
        const v = decl.childForFieldName('value');
        if (!n) continue;
        let kind: SymbolKind = 'variable';
        if (v && (v.type === 'arrow_function' || v.type === 'function' || v.type === 'function_expression')) {
          kind = isPascal(n.text) ? 'component' : 'function';
        } else if (isPascal(n.text)) {
          kind = 'component';
        }
        out.push(mkSym(path, n.text, kind, decl, exported));
      }
      return;
    }
    default:
      return;
  }
}

function extractJsImport(path: string, node: TSNode, out: Edge[]): void {
  const source = node.childForFieldName('source');
  if (!source) return;
  const spec = stripQuotes(source.text);
  const line = node.startPosition.row + 1;
  const names: string[] = [];
  // import_clause -> { named_imports -> import_specifier(name), namespace_import, identifier(default) }
  for (let i = 0; i < node.namedChildCount; i++) {
    const c = node.namedChild(i);
    if (!c || c.type !== 'import_clause') continue;
    collectImportedNames(c, names);
  }
  if (names.length === 0) {
    out.push({ from_path: path, to_path: spec, kind: 'imports', symbol: null, from_line: line });
  } else {
    for (const name of names) {
      out.push({ from_path: path, to_path: spec, kind: 'imports', symbol: name, from_line: line });
    }
  }
}

function collectImportedNames(node: TSNode, out: string[]): void {
  for (let i = 0; i < node.namedChildCount; i++) {
    const c = node.namedChild(i);
    if (!c) continue;
    if (c.type === 'identifier') out.push(c.text);
    else if (c.type === 'namespace_import') {
      const id = c.namedChild(c.namedChildCount - 1);
      if (id) out.push(id.text);
    } else if (c.type === 'named_imports') {
      for (let j = 0; j < c.namedChildCount; j++) {
        const spec = c.namedChild(j);
        if (spec && spec.type === 'import_specifier') {
          const n = spec.childForFieldName('name');
          if (n) out.push(n.text);
        }
      }
    }
  }
}

function extractJs(path: string, root: TSNode, symbols: Sym[], edges: Edge[]): void {
  for (let i = 0; i < root.namedChildCount; i++) {
    const node = root.namedChild(i);
    if (!node) continue;
    if (node.type === 'import_statement') {
      extractJsImport(path, node, edges);
    } else if (node.type === 'export_statement') {
      const decl = node.childForFieldName('declaration');
      if (decl) {
        extractJsDeclaration(path, decl, true, symbols);
      } else {
        // export { a, b } / export default X
        for (let j = 0; j < node.namedChildCount; j++) {
          const c = node.namedChild(j);
          if (!c) continue;
          if (c.type === 'export_clause') {
            for (let k = 0; k < c.namedChildCount; k++) {
              const spec = c.namedChild(k);
              if (spec && spec.type === 'export_specifier') {
                const n = spec.childForFieldName('name');
                if (n) symbols.push(mkSym(path, n.text, 'export', spec, true));
              }
            }
          }
        }
      }
    } else {
      extractJsDeclaration(path, node, false, symbols);
    }
  }
}

// ---------- Python ----------

function extractPython(path: string, root: TSNode, symbols: Sym[], edges: Edge[]): void {
  for (let i = 0; i < root.namedChildCount; i++) {
    const node = root.namedChild(i);
    if (!node) continue;
    const line = node.startPosition.row + 1;
    switch (node.type) {
      case 'function_definition': {
        const n = node.childForFieldName('name');
        if (n) symbols.push(mkSym(path, n.text, 'function', node, true));
        break;
      }
      case 'class_definition': {
        const n = node.childForFieldName('name');
        if (n) symbols.push(mkSym(path, n.text, 'class', node, true));
        break;
      }
      case 'decorated_definition': {
        const def = node.childForFieldName('definition');
        if (def) {
          const n = def.childForFieldName('name');
          const kind: SymbolKind = def.type === 'class_definition' ? 'class' : 'function';
          if (n) symbols.push(mkSym(path, n.text, kind, node, true));
        }
        break;
      }
      case 'import_statement': {
        for (let j = 0; j < node.namedChildCount; j++) {
          const c = node.namedChild(j);
          if (!c) continue;
          const mod = c.type === 'aliased_import' ? c.childForFieldName('name') : c;
          if (mod && (mod.type === 'dotted_name' || mod.type === 'identifier')) {
            edges.push({ from_path: path, to_path: mod.text, kind: 'imports', symbol: null, from_line: line });
          }
        }
        break;
      }
      case 'import_from_statement': {
        const mod = node.childForFieldName('module_name');
        if (mod) {
          edges.push({ from_path: path, to_path: mod.text, kind: 'imports', symbol: null, from_line: line });
        }
        break;
      }
      default:
        break;
    }
  }
}

export function extractFromTree(
  grammar: string, path: string, root: TSNode
): { symbols: Sym[]; edges: Edge[] } {
  const symbols: Sym[] = [];
  const edges: Edge[] = [];
  if (grammar === 'python') extractPython(path, root, symbols, edges);
  else extractJs(path, root, symbols, edges); // typescript | tsx | javascript
  return { symbols, edges };
}
