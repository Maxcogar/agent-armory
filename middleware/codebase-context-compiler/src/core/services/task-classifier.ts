/**
 * Task classifier (Spec FR3). Deterministic keyword/pattern classification —
 * no model call (Architecture L4: MVP is deterministic). Emits one or more task
 * type labels plus extracted seed hints (file paths, symbol-like identifiers,
 * lexical keywords) used to seed graph expansion and lexical evidence search.
 */
import type { RuntimeDomain, Task, TaskIntent, TaskModifier, TaskType } from '../domain/task.js';

interface Rule { type: TaskType; patterns: RegExp[] }

const RULES: Rule[] = [
  { type: 'codebase_question', patterns: [/\b(how|where|why)\s+(does|do|is|are|can|could)\b/i, /\bwhat\b.{0,120}\b(can|could|does|do|is|are|seen|used|available|happens|data)\b/i, /\b(explain|trace|walk\s+through|show\s+me|understand|investigate|look\s+into)\b/i, /\bhow\s+.*\s+work(s|ed)?\b/i] },
  { type: 'frontend_ui_change', patterns: [/\b(ui|component|button|page|theme|dark\s*mode|light\s*mode|css|styl(e|ing)|render|layout|modal|dialog|form|view|screen|navbar|sidebar|toggle)\b/i, /\.(tsx|jsx|css|scss)\b/i] },
  { type: 'backend_api_change', patterns: [/\b(api|endpoint|route|handler|controller|request|response|rest|graphql|server|middleware)\b/i] },
  { type: 'database_schema_change', patterns: [/\b(schema|migration|table|column|model|database|db|sql|orm|query|index)\b/i] },
  { type: 'bug_fix', patterns: [/\b(bug|fix|broken|error|crash|regression|incorrect|wrong|fails?|failing|throws?)\b/i] },
  { type: 'refactor', patterns: [/\b(refactor|rename|extract|restructure|clean\s*up|reorganis?e|simplify|deduplicate)\b/i] },
  { type: 'test_creation', patterns: [/\b(test|spec|coverage|unit\s*test|e2e|integration\s*test)\b/i] },
  { type: 'build_deployment_change', patterns: [/\b(build|deploy(ment)?|ci|pipeline|docker|webpack|vite|rollup|bundl(e|ing)|release)\b/i] },
  { type: 'security_sensitive_change', patterns: [/\b(auth(entication|orization)?|security|password|token|secret|credential|encrypt|permission|login|session|oauth|jwt)\b/i] },
  { type: 'documentation_only_change', patterns: [/\b(docs?|documentation|readme|comment|changelog)\b/i] },
  { type: 'dependency_upgrade', patterns: [/\b(upgrade|bump|dependency|dependencies|package\s*version|npm\s*install|pip\s*install)\b/i] },
  { type: 'integration_change', patterns: [/\b(integrat(e|ion)|third[-\s]?party|webhook|connect|sdk|external\s*service)\b/i] },
];

const STOPWORDS = new Set([
  'the','a','an','to','for','of','in','on','and','or','with','add','remove','update','change','make',
  'create','new','use','using','that','this','it','is','be','set','get','should','need','want','please',
  'how','does','do','did','what','why','where','can','could','would','work','works','worked',
  'just','dont','answer','question','codebase','help','test',
  'okay','then','ill','ask','you','your','me','any','its','have','about','see','gave',
]);

const DOMAIN_BY_TYPE: Partial<Record<string, RuntimeDomain>> = {
  frontend_ui_change: 'frontend',
  backend_api_change: 'backend',
  database_schema_change: 'database',
  build_deployment_change: 'build_config',
  dependency_upgrade: 'build_config',
  integration_change: 'integration',
  documentation_only_change: 'docs',
};

export interface Classification {
  task: Task;
  /** Lexical search keywords (FR-evidence input, D12 step 5). */
  keywords: string[];
  /** File paths the user named explicitly. */
  mentionedPaths: string[];
  /** Identifier-like tokens that may be symbol names. */
  mentionedSymbols: string[];
}

export function classifyTask(request: string): Classification {
  const lower = request.toLowerCase();
  const task_types: TaskType[] = [];
  for (const rule of RULES) {
    if (rule.patterns.some((re) => re.test(lower))) task_types.push(rule.type);
  }
  if (task_types.includes('codebase_question') && task_types.includes('test_creation') && isMetaTestPrompt(lower) && !isExplicitTestCreationRequest(lower)) {
    task_types.splice(task_types.indexOf('test_creation'), 1);
  }
  if (task_types.length === 0) task_types.push('general_change');

  const mentionedPaths = unique(request.match(/[\w./-]+\.[a-z]{1,5}\b/gi) ?? [])
    .filter((p) => p.includes('/') || /\.(ts|tsx|js|jsx|py|json|css|scss|md)$/i.test(p));

  const mentionedSymbols = unique([
    ...(request.match(/\b[A-Z][A-Za-z0-9]+\b/g) ?? []),
    ...((request.match(/\b[a-z_$][A-Za-z0-9_$]*[A-Z][A-Za-z0-9_$]*\b/g) ?? [])),
    ...((request.match(/\b[A-Za-z_$][A-Za-z0-9_$]*\s*\(/g) ?? []).map((s) => s.replace(/\s*\($/, ''))),
    ...((request.match(/[`'"][A-Za-z_$][A-Za-z0-9_$]{2,}[`'"]/g) ?? []).map((s) => s.slice(1, -1))),
  ]).filter((s) => s.length > 2 && !STOPWORDS.has(s.toLowerCase()));

  const keywords = unique(
    lower.match(/[a-z0-9_]+/g) ?? []
  ).filter((w) => w.length > 2 && !STOPWORDS.has(w)).slice(0, 12);

  const intent = inferIntent(lower, task_types);
  const domains = inferDomains(lower, task_types, mentionedPaths);
  const modifiers = inferModifiers(task_types);

  return {
    task: {
      original_request: request,
      normalized_task: request.trim().replace(/\s+/g, ' '),
      task_types,
      intent,
      domains,
      modifiers,
      scope_summary: `Task classified as intent=${intent}; domains=${domains.join(', ')}; legacy=${task_types.join(', ')}.`,
    },
    keywords,
    mentionedPaths,
    mentionedSymbols,
  };
}

function unique<T>(arr: T[]): T[] { return [...new Set(arr)]; }

function inferIntent(lower: string, taskTypes: TaskType[]): TaskIntent {
  if (taskTypes.includes('codebase_question')) return 'locate_understand';
  if (/\b(review|audit\s+diff|inspect\s+diff|pr\s+review|pull\s+request)\b/.test(lower)) return 'review';
  if (/\b(audit|threat|vulnerability|security\s+review|source\s+to\s+sink|sink)\b/.test(lower)) return 'audit_security';
  if (taskTypes.includes('bug_fix')) return 'bug_fix';
  if (taskTypes.includes('refactor')) return 'refactor';
  if (taskTypes.includes('test_creation')) return 'test_creation';
  if (taskTypes.includes('documentation_only_change')) return 'documentation_update';
  if (taskTypes.includes('dependency_upgrade')) return 'dependency_maintenance';
  if (/\b(add|create|implement|build|new)\b/.test(lower) && !taskTypes.includes('build_deployment_change')) return 'feature';
  return 'general_change';
}

function inferDomains(lower: string, taskTypes: TaskType[], mentionedPaths: string[]): RuntimeDomain[] {
  const domains = new Set<RuntimeDomain>();
  for (const t of taskTypes) {
    const domain = DOMAIN_BY_TYPE[t];
    if (domain) domains.add(domain);
  }
  for (const path of mentionedPaths) {
    for (const domain of domainsForPath(path)) domains.add(domain);
  }
  if (/\b(frontend|ui|component|page|screen|tsx|jsx)\b/.test(lower)) domains.add('frontend');
  if (/\b(backend|server|route|api|endpoint|handler|middleware)\b/.test(lower)) domains.add('backend');
  if (/\b(database|schema|migration|table|sql|orm|query)\b/.test(lower)) domains.add('database');
  if (/\b(package|dependency|build|deploy|vite|webpack|docker|ci)\b/.test(lower)) domains.add('build_config');
  if (/\b(integration|webhook|sdk|external service|third-party|third party)\b/.test(lower)) domains.add('integration');
  if (/\b(docs|documentation|readme|adr|spec)\b/.test(lower)) domains.add('docs');
  if (domains.size === 0) domains.add('unknown');
  return [...domains];
}

export function domainsForPath(path: string): RuntimeDomain[] {
  const normalized = path.replace(/\\/g, '/').toLowerCase();
  const out = new Set<RuntimeDomain>();
  if (/\.(tsx|jsx|css|scss)$/.test(normalized) || /(^|\/)(components?|pages?|routes?|views?)\//.test(normalized)) out.add('frontend');
  if (/(^|\/)(backend|server|api|routes?|controllers?|middleware)\//.test(normalized)) out.add('backend');
  if (/(^|\/)(db|database|migrations?|models?|schema)\//.test(normalized) || /migration|schema|sql/.test(normalized)) out.add('database');
  if (/(^|\/)(package\.json|tsconfig.*\.json|.*\.config\.[a-z]+|dockerfile|docker-compose|\.github\/workflows)\b/.test(normalized)) out.add('build_config');
  if (/(^|\/)(integrations?|webhooks?|clients?|sdk)\//.test(normalized)) out.add('integration');
  if (/(^|\/)docs?\//.test(normalized) || /\.(md|mdx|rst|txt)$/.test(normalized)) out.add('docs');
  return [...out];
}

function inferModifiers(taskTypes: TaskType[]): TaskModifier[] {
  return taskTypes.includes('security_sensitive_change') ? ['security_sensitive'] : [];
}

function isMetaTestPrompt(lower: string): boolean {
  return /\b(just\s+)?test\s+this\b/.test(lower)
    || /\bfor\s+the\s+test\b/.test(lower)
    || /\bdon'?t\s+have\s+to\s+answer\b/.test(lower)
    || /\bsee\s+if\s+ctxpack\s+gave\s+you\s+any\s+help\b/.test(lower);
}

function isExplicitTestCreationRequest(lower: string): boolean {
  return /\b(write|add|create|implement|fix|update)\b.{0,80}\b(test|tests|spec|coverage|unit\s*test|e2e|integration\s*test)\b/.test(lower)
    || /\b(test|tests|spec)\s+(for|that|to|cover)\b/.test(lower);
}
