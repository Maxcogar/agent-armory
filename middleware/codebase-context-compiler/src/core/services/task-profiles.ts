import type { RuntimeDomain, Task, TaskIntent, TaskModifier, TaskType } from '../domain/task.js';
import type { ContextCategory } from './recipe-engine.js';

export type RetrievalRubric =
  | 'precision'
  | 'recall'
  | 'diff_bounded'
  | 'failing_path'
  | 'precedent_contracts'
  | 'security_recall';

export interface EnforcementProfile {
  requirePlanBeforeEdit: boolean;
  blockSubagents: boolean;
  requirePrimaryReadsBeforeSearch: boolean;
  failClosed: boolean;
}

export interface TaskProfile {
  intent: TaskIntent;
  domains: RuntimeDomain[];
  modifiers: TaskModifier[];
  contextCategories: ContextCategory[];
  seedStrategies: string[];
  rubrics: RetrievalRubric[];
  outputThreads: string[];
  enforcement: EnforcementProfile;
}

interface IntentProfile {
  categories: ContextCategory[];
  seedStrategies: string[];
  rubrics: RetrievalRubric[];
  outputThreads: string[];
  enforcement: Partial<EnforcementProfile>;
}

const DEFAULT_ENFORCEMENT: EnforcementProfile = {
  requirePlanBeforeEdit: true,
  blockSubagents: false,
  requirePrimaryReadsBeforeSearch: false,
  failClosed: true,
};

const INTENT_PROFILES: Record<TaskIntent, IntentProfile> = {
  locate_understand: {
    categories: ['investigation_targets'],
    seedStrategies: ['natural_language', 'explicit_path', 'symbol', 'text_search'],
    rubrics: ['precision'],
    outputThreads: ['primary_investigation', 'excluded_with_reason'],
    enforcement: { requirePlanBeforeEdit: false, blockSubagents: true, requirePrimaryReadsBeforeSearch: true },
  },
  bug_fix: {
    categories: ['target_files', 'callers', 'tests', 'existing_similar_implementation'],
    seedStrategies: ['stack_trace', 'failing_test', 'explicit_path', 'symbol', 'text_search'],
    rubrics: ['failing_path'],
    outputThreads: ['failing_path', 'root_cause_candidates', 'supporting_tests', 'excluded_with_reason'],
    enforcement: {},
  },
  feature: {
    categories: ['target_files', 'existing_similar_implementation', 'callers', 'tests', 'build_commands'],
    seedStrategies: ['natural_language', 'precedent', 'explicit_path', 'symbol', 'text_search'],
    rubrics: ['precedent_contracts'],
    outputThreads: ['extension_points', 'precedent', 'contracts', 'supporting_tests', 'excluded_with_reason'],
    enforcement: {},
  },
  refactor: {
    categories: ['target_files', 'callers', 'existing_similar_implementation', 'tests'],
    seedStrategies: ['symbol', 'explicit_path', 'references'],
    rubrics: ['recall'],
    outputThreads: ['targets', 'all_call_sites', 'supporting_tests', 'excluded_with_reason'],
    enforcement: {},
  },
  review: {
    categories: ['target_files', 'callers', 'tests'],
    seedStrategies: ['diff', 'explicit_path'],
    rubrics: ['diff_bounded'],
    outputThreads: ['changed_files', 'blast_radius', 'contract_risks', 'supporting_tests', 'excluded_with_reason'],
    enforcement: { requirePlanBeforeEdit: false },
  },
  test_creation: {
    categories: ['target_files', 'existing_similar_implementation', 'tests', 'build_commands'],
    seedStrategies: ['target_behavior', 'explicit_path', 'symbol', 'text_search'],
    rubrics: ['precedent_contracts'],
    outputThreads: ['target_behavior', 'test_patterns', 'commands', 'excluded_with_reason'],
    enforcement: {},
  },
  documentation_update: {
    categories: ['target_files', 'documentation'],
    seedStrategies: ['explicit_path', 'doc_reference', 'changed_code'],
    rubrics: ['precision'],
    outputThreads: ['governing_docs', 'referenced_code', 'incidental_docs', 'excluded_with_reason'],
    enforcement: {},
  },
  dependency_maintenance: {
    categories: ['config', 'callers', 'tests', 'build_commands'],
    seedStrategies: ['package_manifest', 'lockfile', 'import_consumers'],
    rubrics: ['recall'],
    outputThreads: ['package_config', 'import_consumers', 'verification', 'excluded_with_reason'],
    enforcement: {},
  },
  audit_security: {
    categories: ['target_files', 'auth_security_boundary', 'validation_layer', 'callers', 'tests'],
    seedStrategies: ['source_sink', 'auth_boundary', 'explicit_path', 'symbol', 'text_search'],
    rubrics: ['security_recall'],
    outputThreads: ['sources', 'sinks', 'data_flow', 'auth_boundaries', 'persistence', 'excluded_with_reason'],
    enforcement: {},
  },
  general_change: {
    categories: ['target_files', 'callers', 'tests'],
    seedStrategies: ['explicit_path', 'symbol', 'text_search'],
    rubrics: ['precision'],
    outputThreads: ['primary', 'supporting_tests', 'excluded_with_reason'],
    enforcement: {},
  },
};

const DOMAIN_CATEGORIES: Record<RuntimeDomain, ContextCategory[]> = {
  frontend: ['parent_route', 'child_components', 'state_management', 'styling_theme_system'],
  backend: ['api_surface', 'validation_layer', 'data_models'],
  database: ['data_models', 'schema_migrations', 'callers'],
  build_config: ['config', 'build_commands'],
  integration: ['api_surface', 'config', 'auth_security_boundary'],
  docs: ['documentation'],
  unknown: [],
};

const LEGACY_INTENT: Partial<Record<string, TaskIntent>> = {
  codebase_question: 'locate_understand',
  bug_fix: 'bug_fix',
  refactor: 'refactor',
  test_creation: 'test_creation',
  documentation_only_change: 'documentation_update',
  dependency_upgrade: 'dependency_maintenance',
};

const LEGACY_DOMAIN: Partial<Record<string, RuntimeDomain>> = {
  frontend_ui_change: 'frontend',
  backend_api_change: 'backend',
  database_schema_change: 'database',
  build_deployment_change: 'build_config',
  integration_change: 'integration',
  documentation_only_change: 'docs',
  dependency_upgrade: 'build_config',
};

export function profileForTask(task: Task): TaskProfile {
  const intentProfile = INTENT_PROFILES[task.intent] ?? INTENT_PROFILES.general_change;
  const domains: RuntimeDomain[] = task.domains.length ? task.domains : ['unknown'];
  const categories = new Set<ContextCategory>(intentProfile.categories);
  for (const domain of domains) {
    for (const category of DOMAIN_CATEGORIES[domain] ?? []) categories.add(category);
  }
  if (task.modifiers.includes('security_sensitive')) {
    categories.add('auth_security_boundary');
    categories.add('validation_layer');
    categories.add('tests');
  }
  return {
    intent: task.intent,
    domains: [...domains],
    modifiers: task.modifiers,
    contextCategories: [...categories],
    seedStrategies: intentProfile.seedStrategies,
    rubrics: task.modifiers.includes('security_sensitive')
      ? [...new Set([...intentProfile.rubrics, 'security_recall' as const])]
      : intentProfile.rubrics,
    outputThreads: intentProfile.outputThreads,
    enforcement: { ...DEFAULT_ENFORCEMENT, ...intentProfile.enforcement },
  };
}

export function profileFromLegacyTypes(taskTypes: TaskType[]): TaskProfile {
  const intent = legacyIntent(taskTypes);
  const domains = legacyDomains(taskTypes);
  const modifiers = taskTypes.includes('security_sensitive_change') ? ['security_sensitive' as const] : [];
  return profileForTask({
    original_request: '',
    normalized_task: '',
    task_types: taskTypes,
    intent,
    domains,
    modifiers,
    scope_summary: '',
  });
}

function legacyIntent(taskTypes: TaskType[]): TaskIntent {
  if (taskTypes.includes('security_sensitive_change') && /\baudit\b/.test(taskTypes.join(' '))) return 'audit_security';
  for (const t of taskTypes) {
    const intent = LEGACY_INTENT[t];
    if (intent) return intent;
  }
  return 'general_change';
}

function legacyDomains(taskTypes: TaskType[]): RuntimeDomain[] {
  const out = new Set<RuntimeDomain>();
  for (const t of taskTypes) {
    const domain = LEGACY_DOMAIN[t];
    if (domain) out.add(domain);
  }
  if (out.size === 0) out.add('unknown');
  return [...out];
}
