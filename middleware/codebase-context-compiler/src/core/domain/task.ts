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

export interface Task {
  original_request: string;
  normalized_task: string;
  task_types: TaskType[];
  scope_summary: string;
}
