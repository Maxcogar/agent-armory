// Copy non-TS runtime assets (JSON schemas, SQL migrations) into dist.
import { mkdirSync, readdirSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
const jobs = [
  { from: 'src/adapters/schema', to: 'dist/adapters/schema', ext: '.json' },
  { from: 'src/adapters/storage/migrations', to: 'dist/adapters/storage/migrations', ext: '.sql' },
];
for (const j of jobs) {
  mkdirSync(j.to, { recursive: true });
  for (const n of readdirSync(j.from)) if (n.endsWith(j.ext)) copyFileSync(join(j.from, n), join(j.to, n));
}
console.log('assets copied');
