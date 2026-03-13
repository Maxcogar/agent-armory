// ============================================================
// AgentBoard TypeScript interfaces — mirrors the API spec
// Index signatures added so interfaces satisfy Record<string, unknown>
// which is required by the MCP SDK's structuredContent field.
// Named fields remain fully typed for all direct access.
// ============================================================

export type ProjectType = "new_feature" | "refactor" | "bug_fix" | "migration" | "integration";
export type TaskStatus = "backlog" | "ready" | "in-progress" | "review" | "done" | "blocked";
export type TaskPriority = "critical" | "high" | "medium" | "low";
export type DocumentStatus = "template" | "draft" | "approved" | "superseded";
export type DocumentType =
  | "codebase_survey"
  | "requirements"
  | "constraints"
  | "risk_assessment"
  | "architecture"
  | "contracts"
  | "test_strategy"
  | "task_breakdown";

export type LogAction =
  | "project_created"
  | "phase_approved"
  | "task_created"
  | "task_started"
  | "task_completed"
  | "task_updated"
  | "note_added"
  | "document_filled"
  | "document_approved"
  | "document_superseded"
  | "log_entry";

export interface TaskNote {
  content: string;
  timestamp: string;
  [key: string]: unknown;
}

export interface Project {
  id: string;
  name: string;
  project_type: ProjectType;
  idea: string;
  current_phase: number;
  target_project_path: string | null;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  acceptance_criteria: string | null;
  constraints: string | null;
  contracts: string | null;
  test_expectations: string | null;
  status: TaskStatus;
  phase: number | null;
  assignee: string | null;
  priority: TaskPriority;
  depends_on: string[];
  files_touched: string[];
  notes: TaskNote[];
  previous_status: string | null;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export interface Document {
  id: string;
  project_id: string;
  phase: number;
  document_type: DocumentType;
  title: string;
  content: string;
  status: DocumentStatus;
  filled_by: string | null;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

export interface ActivityEntry {
  id: string;
  project_id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  detail: string;
  [key: string]: unknown;
}
