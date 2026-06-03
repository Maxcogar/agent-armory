/**
 * Context recipe engine (Spec FR4). For each task type, defines the context
 * categories that must be satisfied before an agent can safely act. The package
 * builder reports each category as satisfied | unresolved | not_applicable
 * (FR4 acceptance, NFR6) — completeness is per-category, never a single score.
 */
import type { TaskType } from '../domain/task.js';

/** Canonical context categories. Open vocabulary; recipes may add more. */
export type ContextCategory =
  | 'investigation_targets'
  | 'target_files'
  | 'parent_route'
  | 'child_components'
  | 'state_management'
  | 'styling_theme_system'
  | 'existing_similar_implementation'
  | 'api_surface'
  | 'callers'
  | 'data_models'
  | 'schema_migrations'
  | 'validation_layer'
  | 'auth_security_boundary'
  | 'tests'
  | 'build_commands'
  | 'config'
  | 'documentation';

const RECIPES: Record<string, ContextCategory[]> = {
  codebase_question: ['investigation_targets'],
  frontend_ui_change: ['target_files', 'parent_route', 'child_components', 'state_management', 'styling_theme_system', 'existing_similar_implementation', 'tests', 'build_commands'],
  backend_api_change: ['target_files', 'api_surface', 'callers', 'validation_layer', 'data_models', 'tests', 'build_commands'],
  database_schema_change: ['target_files', 'data_models', 'schema_migrations', 'callers', 'tests'],
  bug_fix: ['target_files', 'callers', 'tests', 'existing_similar_implementation'],
  refactor: ['target_files', 'callers', 'existing_similar_implementation', 'tests'],
  test_creation: ['target_files', 'existing_similar_implementation', 'tests', 'build_commands'],
  build_deployment_change: ['config', 'build_commands'],
  security_sensitive_change: ['target_files', 'auth_security_boundary', 'validation_layer', 'callers', 'tests'],
  documentation_only_change: ['target_files', 'documentation'],
  dependency_upgrade: ['config', 'callers', 'tests', 'build_commands'],
  integration_change: ['target_files', 'api_surface', 'config', 'auth_security_boundary', 'tests'],
  general_change: ['target_files', 'callers', 'tests'],
};

/** Union of required categories across all matched task types. */
export function requiredCategories(taskTypes: TaskType[]): ContextCategory[] {
  const set = new Set<ContextCategory>();
  for (const t of taskTypes) {
    const cats = RECIPES[t] ?? RECIPES['general_change']!;
    for (const c of cats) set.add(c);
  }
  return [...set];
}
