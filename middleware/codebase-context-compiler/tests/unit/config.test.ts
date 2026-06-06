import { describe, it, expect } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadConfig } from '../../src/config/config-schema.js';
import { DEFAULT_EXCLUDES } from '../../src/config/default-excludes.js';

describe('ctxpack config', () => {
  it('loads user config with safe defaults for omitted fields', () => {
    const root = mkdtempSync(join(tmpdir(), 'ctxpack-config-'));
    try {
      writeFileSync(join(root, 'ctxpack.config.json'), JSON.stringify({
        excludes: ['**/.cache/**'],
        tokenBudget: 12000,
        enableTypeScriptEnrichment: false,
        staticAnalysis: ['analysis.sarif'],
      }));

      const config = loadConfig(root);

      expect(config.excludes).toEqual(['**/.cache/**']);
      expect(config.maxBytes).toBe(512 * 1024);
      expect(config.tokenBudget).toBe(12000);
      expect(config.enableTypeScriptEnrichment).toBe(false);
      expect(config.staticAnalysis).toEqual(['analysis.sarif']);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('rejects invalid numeric overrides by falling back to defaults', () => {
    const root = mkdtempSync(join(tmpdir(), 'ctxpack-config-'));
    try {
      writeFileSync(join(root, '.ctxpack.json'), JSON.stringify({
        maxBytes: -1,
        tokenBudget: 'large',
      }));

      const config = loadConfig(root);

      expect(config.maxBytes).toBe(512 * 1024);
      expect(config.tokenBudget).toBe(8000);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('excludes recycled and backup folders by default', () => {
    expect(DEFAULT_EXCLUDES).toEqual(expect.arrayContaining([
      '**/_recycle_bin/**',
      '**/backup-*/**',
    ]));
  });
});
