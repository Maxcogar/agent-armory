/**
 * Task domain types (Spec FR3 Task Classification, §10 task block).
 *
 * Task types are an open vocabulary in the spec; this enum captures the named
 * examples (Spec FR3) but classifiers may emit additional labels. We model the
 * label as a string union widened to `string` so new recipes can extend it
 * without a breaking schema change, while still giving editor help for the
 * known set.
 */
export type KnownTaskType =
  | 'frontend_ui_change'
  | 'backend_api_change'
  | 'database_schema_change'
  | 'bug_fix'
  | 'refactor'
  | 'test_creation'
  | 'build_deployment_change'
  | 'security_sensitive_change'
  | 'documentation_only_change'
  | 'dependency_upgrade'
  | 'integration_change'
  | 'codebase_question';

export type TaskType = KnownTaskType | (string & {});

export type TaskIntent =
  | 'locate_understand'
  | 'bug_fix'
  | 'feature'
  | 'refactor'
  | 'review'
  | 'test_creation'
  | 'documentation_update'
  | 'dependency_maintenance'
  | 'audit_security'
  | 'general_change';

export type RuntimeDomain =
  | 'frontend'
  | 'backend'
  | 'database'
  | 'build_config'
  | 'integration'
  | 'docs'
  | 'unknown';

export type TaskModifier =
  | 'security_sensitive';

export interface Task {
  original_request: string;
  normalized_task: string;
  /**
   * Legacy compatibility labels. They are still preserved for CLI output,
   * tests, and older package consumers, but profile policy should prefer the
   * intent/domain/modifier fields below.
   */
  task_types: TaskType[];
  intent: TaskIntent;
  domains: RuntimeDomain[];
  modifiers: TaskModifier[];
  scope_summary: string;
}
