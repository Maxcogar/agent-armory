// Claim (Steps 1, 15): fs.readdirSync recursive and import.meta.resolve work on this runtime; a module inside the package resolves a tree-sitter-wasms grammar path by import.meta.resolve.
import { readdirSync, mkdirSync, writeFileSync } from 'node:fs'; import path from 'node:path'; import { spawnSync } from 'node:child_process';
const layout = process.env.PROBE_LAYOUT; const d = path.join(layout, 'dist/test/deep/er'); mkdirSync(d, { recursive: true }); writeFileSync(path.join(d, 'x.test.js'), '');
console.log('readdirSync recursive finds nested test file:', readdirSync(path.join(layout, 'dist/test'), { recursive: true }).some(f => String(f).endsWith('er/x.test.js')));
const mod = path.join(layout, 'dist/src/probe10.mjs'); mkdirSync(path.dirname(mod), { recursive: true });
writeFileSync(mod, "const u = import.meta.resolve('tree-sitter-wasms/out/tree-sitter-typescript.wasm'); console.log('import.meta.resolve grammar from inside the package:', u.endsWith('/node_modules/tree-sitter-wasms/out/tree-sitter-typescript.wasm'));\n");
process.stdout.write(spawnSync(process.execPath, [mod], { cwd: layout, encoding: 'utf8' }).stdout);
