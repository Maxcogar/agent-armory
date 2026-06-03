import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DEFAULT_EXCLUDES } from './default-excludes.js';

export interface CtxpackConfig {
  excludes: string[];
  maxBytes: number;
  tokenBudget: number;
  enableTypeScriptEnrichment: boolean;
  staticAnalysis: string[];
}

export const DEFAULT_CONFIG: CtxpackConfig = {
  excludes: DEFAULT_EXCLUDES,
  maxBytes: 512 * 1024,
  tokenBudget: 8000,
  enableTypeScriptEnrichment: true,
  staticAnalysis: [],
};

export function loadConfig(root: string): CtxpackConfig {
  const paths = [join(root, 'ctxpack.config.json'), join(root, '.ctxpack.json')];
  const found = paths.find(existsSync);
  if (!found) return DEFAULT_CONFIG;

  const raw = JSON.parse(readFileSync(found, 'utf8').replace(/^\uFEFF/, '')) as Partial<CtxpackConfig>;
  return {
    excludes: Array.isArray(raw.excludes) ? raw.excludes : DEFAULT_CONFIG.excludes,
    maxBytes: positiveInt(raw.maxBytes, DEFAULT_CONFIG.maxBytes),
    tokenBudget: positiveInt(raw.tokenBudget, DEFAULT_CONFIG.tokenBudget),
    enableTypeScriptEnrichment: raw.enableTypeScriptEnrichment !== false,
    staticAnalysis: Array.isArray(raw.staticAnalysis) ? raw.staticAnalysis.filter((x): x is string => typeof x === 'string') : [],
  };
}

function positiveInt(value: unknown, fallback: number): number {
  return Number.isInteger(value) && (value as number) > 0 ? value as number : fallback;
}
