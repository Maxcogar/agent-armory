#!/usr/bin/env node
// Deployment-provenance preflight (corrections-0.4.0, opining-without-reading-source, Part A).
// Deterministic, dependency-free report of WHICH deployment of a plugin is installed —
// cache path, installed version, marketplace commit — compared, when a working-tree path
// is supplied, against that working tree's manifest and .mcp.json. The canonical failure
// this closes: a live test run against a provably-stale cache, when the answer sat in
// installed_plugins.json the whole time. No agent, no tokens: it reads config files and
// byte-compares. Exit 0 on CURRENT (or provenance-only), 1 on STALE, 2 on unreadable —
// staleness and unreadability both fail closed.
//
// Usage: node preflight-deployment.mjs [plugin-name] [working-tree-path]
//   plugin-name        default "expert-dev-tools"; bare name or full "name@marketplace"
//   working-tree-path  the plugin's source checkout to compare against; omit outside
//                      the plugin's own repo (the report is then provenance-only)
// Env: CLAUDE_CONFIG_DIR overrides the config root (default ~/.claude) — also how the
// structural tier drives this script against fixture registries.

import { readFileSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname, isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export function configDir() {
  return process.env.CLAUDE_CONFIG_DIR || join(homedir(), '.claude');
}

function readJson(path, what, problems) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    problems.push(`${what} unreadable at ${path}: ${e.message}`);
    return null;
  }
}

// Byte-compare one relative file between the cache and the working tree.
// Both absent is not a diff; one-sided presence and differing bytes are.
function fileDiff(rel, cachePath, worktreePath) {
  const a = join(cachePath, rel);
  const b = join(worktreePath, rel);
  const aExists = existsSync(a);
  const bExists = existsSync(b);
  if (!aExists && !bExists) return null;
  if (!aExists) return `${rel}: missing in installed cache`;
  if (!bExists) return `${rel}: missing in working tree`;
  return readFileSync(a).equals(readFileSync(b)) ? null : `${rel}: bytes differ`;
}

// Build the provenance report. `problems` collects every unreadable surface; any
// entry makes the run UNREADABLE (fail closed), never a silent partial verdict.
export function preflightDeployment(pluginName, worktreePath, cfgDir = configDir()) {
  const problems = [];
  const registryPath = join(cfgDir, 'plugins', 'installed_plugins.json');
  const registry = readJson(registryPath, 'installed-plugins registry', problems);

  const report = {
    plugin: pluginName,
    config_dir: cfgDir,
    registry: registryPath,
    cache_path: null,
    installed_version: null,
    installed_commit: null,
    worktree_path: worktreePath || null,
    worktree_version: null,
    stale: null,
    diffs: [],
    installs: [],
    problems,
  };

  const plugins = registry && registry.plugins;
  if (registry && (typeof plugins !== 'object' || plugins === null)) {
    problems.push(`registry has no 'plugins' map (version ${registry.version ?? 'unknown'})`);
  }

  let records = [];
  if (plugins) {
    const keys = Object.keys(plugins)
      .filter((k) => k === pluginName || k.split('@')[0] === pluginName)
      .sort();
    if (keys.length === 0) problems.push(`plugin '${pluginName}' not found in ${registryPath}`);
    for (const key of keys)
      for (const rec of plugins[key]) records.push({ key, rec });
  }

  let worktreeManifest = null;
  if (worktreePath) {
    worktreeManifest = readJson(join(worktreePath, '.claude-plugin', 'plugin.json'), 'working-tree manifest', problems);
    if (worktreeManifest) report.worktree_version = worktreeManifest.version ?? null;
  }

  for (const { key, rec } of records) {
    // Real registries carry absolute installPaths; fixture registries may carry
    // paths relative to the registry file's directory (<config>/plugins/).
    const cachePath = isAbsolute(rec.installPath) ? rec.installPath : resolve(dirname(registryPath), rec.installPath);
    const cacheManifest = readJson(join(cachePath, '.claude-plugin', 'plugin.json'), `installed cache manifest (${key})`, problems);
    const entry = {
      key,
      scope: rec.scope ?? null,
      cache_path: cachePath,
      installed_version: rec.version ?? null,
      cache_manifest_version: cacheManifest ? cacheManifest.version ?? null : null,
      installed_commit: rec.gitCommitSha ?? null,
      stale: null,
      diffs: [],
    };
    if (worktreePath && worktreeManifest && cacheManifest) {
      if (entry.cache_manifest_version !== report.worktree_version)
        entry.diffs.push(`version: installed cache ${entry.cache_manifest_version} != working tree ${report.worktree_version}`);
      for (const rel of ['.claude-plugin/plugin.json', '.mcp.json']) {
        const d = fileDiff(rel, cachePath, worktreePath);
        if (d) entry.diffs.push(d);
      }
      entry.stale = entry.diffs.length > 0;
    }
    report.installs.push(entry);
  }

  // Primary record for the quotable top-level fields: the user-scope install if
  // one exists (the one a plain session runs), else the first record.
  const primary = report.installs.find((i) => i.scope === 'user') || report.installs[0] || null;
  if (primary) {
    report.cache_path = primary.cache_path;
    report.installed_version = primary.installed_version;
    report.installed_commit = primary.installed_commit;
    report.diffs = primary.diffs;
    report.stale = primary.stale;
  }

  if (problems.length > 0) report.verdict = 'UNREADABLE';
  else if (!worktreePath) report.verdict = 'PROVENANCE-ONLY';
  else report.verdict = report.installs.some((i) => i.stale) ? 'STALE' : 'CURRENT';
  return report;
}

function main() {
  const pluginName = process.argv[2] || 'expert-dev-tools';
  const worktreePath = process.argv[3] || null;
  const report = preflightDeployment(pluginName, worktreePath);
  console.log(JSON.stringify(report, null, 2));
  if (report.verdict === 'STALE') {
    console.log(`VERDICT: STALE (installed ${report.installed_version ?? '?'} at ${report.cache_path}; working tree ${report.worktree_version ?? '?'})`);
    process.exit(1);
  }
  if (report.verdict === 'UNREADABLE') {
    console.log(`VERDICT: UNREADABLE (${report.problems.join('; ')})`);
    process.exit(2);
  }
  if (report.verdict === 'PROVENANCE-ONLY') {
    console.log(`VERDICT: PROVENANCE-ONLY (installed ${report.installed_version ?? '?'} commit ${report.installed_commit ?? '?'} at ${report.cache_path}; no working tree supplied, no staleness determination)`);
    process.exit(0);
  }
  console.log(`VERDICT: CURRENT (installed ${report.installed_version ?? '?'} matches working tree ${report.worktree_version ?? '?'})`);
  process.exit(0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main();
}
