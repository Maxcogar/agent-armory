import { z } from "zod";

// ── Reusable field schemas ───────────────────────────────────────────────────

export const TaskNoteSchema = z.object({
  content: z.string(),
  timestamp: z.string(),
});

// ── Entity output schemas (used in outputSchema + structuredContent) ─────────

export const ProjectOutputSchema = {
  id: z.string(),
  name: z.string(),
  project_type: z.enum(["new_feature", "refactor", "bug_fix", "migration", "integration"]),
  idea: z.string(),
  current_phase: z.coerce.number(),
  target_project_path: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
};

export const TaskOutputSchema = {
  id: z.string(),
  project_id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  acceptance_criteria: z.string().nullable(),
  constraints: z.string().nullable(),
  contracts: z.string().nullable(),
  test_expectations: z.string().nullable(),
  status: z.enum(["backlog", "ready", "in-progress", "review", "done", "blocked"]),
  phase: z.coerce.number().nullable(),
  assignee: z.string().nullable(),
  priority: z.enum(["critical", "high", "medium", "low"]),
  depends_on: z.array(z.string()),
  files_touched: z.array(z.string()),
  notes: z.array(TaskNoteSchema),
  previous_status: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
};

export const DocumentOutputSchema = {
  id: z.string(),
  project_id: z.string(),
  phase: z.coerce.number(),
  document_type: z.enum([
    "codebase_survey",
    "requirements",
    "constraints",
    "risk_assessment",
    "architecture",
    "contracts",
    "test_strategy",
    "task_breakdown",
  ]),
  title: z.string(),
  content: z.string(),
  status: z.enum(["template", "draft", "approved", "superseded"]),
  filled_by: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
};

export const ActivityEntryOutputSchema = {
  id: z.string(),
  project_id: z.string(),
  timestamp: z.string(),
  actor: z.string(),
  action: z.string(),
  target: z.string(),
  detail: z.string(),
};

// ── List output schemas ──────────────────────────────────────────────────────

export const ProjectListOutputSchema = {
  projects: z.array(z.object(ProjectOutputSchema)),
  count: z.number(),
};

export const TaskListOutputSchema = {
  tasks: z.array(z.object(TaskOutputSchema)),
  count: z.number(),
};

export const DocumentListOutputSchema = {
  documents: z.array(z.object(DocumentOutputSchema)),
  count: z.number(),
};

export const ActivityLogOutputSchema = {
  entries: z.array(z.object(ActivityEntryOutputSchema)),
  count: z.number(),
};