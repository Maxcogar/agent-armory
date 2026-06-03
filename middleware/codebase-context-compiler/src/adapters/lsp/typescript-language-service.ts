import fg from 'fast-glob';
import { existsSync, readFileSync } from 'node:fs';
import { relative, resolve } from 'node:path';
import type { LanguageServiceAdapter } from '../../core/ports/language-service-adapter.js';
import type { EdgeRecord, CapabilityGap } from '../../core/domain/repository-map.js';

const EXT_RE = /\.(ts|tsx|mts|cts|js|jsx|mjs|cjs)$/i;

export class TypeScriptLanguageServiceAdapter implements LanguageServiceAdapter {
  readonly name = 'typescript-language-service';

  async available(): Promise<boolean> {
    try {
      await import('typescript');
      return true;
    } catch {
      return false;
    }
  }

  async enrich(snapshotId: string, root: string): Promise<{
    edges: Omit<EdgeRecord, 'snapshot_id'>[];
    gaps: Omit<CapabilityGap, 'adapter'>[];
  }> {
    const ts: any = await import('typescript');
    const files = discoverFiles(root, ts);
    if (files.length === 0) return { edges: [], gaps: [] };

    const service = createLanguageService(ts, root, files);
    const program = service.getProgram();
    const gaps: Omit<CapabilityGap, 'adapter'>[] = [];
    const edges = new Map<string, Omit<EdgeRecord, 'snapshot_id'>>();

    if (program) {
      for (const d of ts.getPreEmitDiagnostics(program)) {
        if (!d.file) continue;
        const rel = relPath(root, d.file.fileName);
        const pos = d.start === undefined ? null : d.file.getLineAndCharacterOfPosition(d.start).line + 1;
        gaps.push({ path: rel, reason: `TypeScript diagnostic ${d.code}${pos ? ` at line ${pos}` : ''}: ${flatten(ts, d.messageText)}` });
      }
    }

    for (const fileName of files) {
      const source = program?.getSourceFile(fileName);
      if (!source) continue;
      const declarations = exportedDeclarationIdentifiers(ts, source);
      for (const node of declarations) {
        const refs = service.findReferences(fileName, node.getStart(source)) ?? [];
        const target = relPath(root, fileName);
        for (const group of refs) {
          for (const ref of group.references ?? []) {
            const from = relPath(root, ref.fileName);
            if (from === target) continue;
            const key = `${from}->${target}:${node.getText(source)}`;
            edges.set(key, {
              from_path: from,
              to_path: target,
              kind: 'references',
              symbol: node.getText(source),
              from_line: lineForRef(ts, service, ref),
            });
          }
        }
      }
    }

    return { edges: [...edges.values()], gaps };
  }
}

function discoverFiles(root: string, ts: any): string[] {
  const configPath = ts.findConfigFile(root, ts.sys.fileExists, 'tsconfig.json');
  if (configPath && isInsideRoot(root, configPath)) {
    const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
    const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, root);
    return parsed.fileNames.filter((p: string) => EXT_RE.test(p));
  }
  return fg.sync(['**/*.{ts,tsx,mts,cts,js,jsx,mjs,cjs}'], {
    cwd: root,
    absolute: true,
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.git/**'],
  });
}

function createLanguageService(ts: any, root: string, fileNames: string[]) {
  const versions = new Map(fileNames.map((f) => [f, '0']));
  const host = {
    getScriptFileNames: () => fileNames,
    getScriptVersion: (fileName: string) => versions.get(fileName) ?? '0',
    getScriptSnapshot: (fileName: string) => {
      if (!existsSync(fileName)) return undefined;
      return ts.ScriptSnapshot.fromString(readFileSync(fileName, 'utf8'));
    },
    getCurrentDirectory: () => root,
    getCompilationSettings: () => ({ allowJs: true, checkJs: false, jsx: ts.JsxEmit.ReactJSX, moduleResolution: ts.ModuleResolutionKind.NodeNext }),
    getDefaultLibFileName: (options: unknown) => ts.getDefaultLibFilePath(options),
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
    readDirectory: ts.sys.readDirectory,
    directoryExists: ts.sys.directoryExists,
    getDirectories: ts.sys.getDirectories,
  };
  return ts.createLanguageService(host);
}

function exportedDeclarationIdentifiers(ts: any, source: any): any[] {
  const out: any[] = [];
  const visit = (node: any) => {
    if (node.name && ts.isIdentifier(node.name) && isExported(ts, node)) out.push(node.name);
    ts.forEachChild(node, visit);
  };
  ts.forEachChild(source, visit);
  return out;
}

function isExported(ts: any, node: any): boolean {
  return Boolean(node.modifiers?.some((m: any) => m.kind === ts.SyntaxKind.ExportKeyword));
}

function lineForRef(ts: any, service: any, ref: any): number | null {
  const program = service.getProgram();
  const file = program?.getSourceFile(ref.fileName);
  if (!file || ref.textSpan?.start === undefined) return null;
  return file.getLineAndCharacterOfPosition(ref.textSpan.start).line + 1;
}

function relPath(root: string, abs: string): string {
  return relative(resolve(root), resolve(abs)).replace(/\\/g, '/');
}

function isInsideRoot(root: string, file: string): boolean {
  const rel = relPath(root, file);
  return rel !== '' && !rel.startsWith('..') && !/^[A-Za-z]:/.test(rel);
}

function flatten(ts: any, msg: unknown): string {
  return ts.flattenDiagnosticMessageText(msg, ' ');
}
