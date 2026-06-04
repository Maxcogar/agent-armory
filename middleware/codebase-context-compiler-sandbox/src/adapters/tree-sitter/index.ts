/**
 * Tree-sitter parser adapter (Architecture D5). Implements the ParserAdapter
 * port. Reports a capability gap rather than guessing when a file's grammar is
 * unsupported or parsing fails (Core convention: adapters report gaps).
 */
import { extname } from 'node:path';
import type { ParserAdapter, ParseInput, ParseOutput } from '../../core/ports/parser-adapter.js';
import { getParserFor, grammarForExtension } from './grammar-loader.js';
import { extractFromTree } from './extract.js';

export class TreeSitterParserAdapter implements ParserAdapter {
  readonly name = 'tree-sitter';
  readonly extensions = ['.ts', '.tsx', '.mts', '.cts', '.js', '.jsx', '.mjs', '.cjs', '.py', '.pyi'];

  async parse(input: ParseInput): Promise<ParseOutput> {
    const grammar = grammarForExtension(extname(input.path));
    if (!grammar) {
      return { symbols: [], edges: [], gaps: [{ path: input.path, reason: `no grammar for ${extname(input.path)}` }] };
    }
    const parser = await getParserFor(grammar);
    if (!parser) {
      return { symbols: [], edges: [], gaps: [{ path: input.path, reason: `grammar ${grammar} failed to load` }] };
    }
    try {
      const tree = parser.parse(input.content);
      const { symbols, edges } = extractFromTree(grammar, input.path, tree.rootNode);
      const gaps = tree.rootNode.hasError
        ? [{ path: input.path, reason: 'syntax errors present; extraction may be partial' }]
        : [];
      return { symbols, edges, gaps };
    } catch (e) {
      return { symbols: [], edges: [], gaps: [{ path: input.path, reason: `parse failed: ${(e as Error).message}` }] };
    }
  }
}
