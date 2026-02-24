import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiGet, apiPost, apiPatch, errorResult } from "../client.js";
import { TaskOutputSchema, TaskListOutputSchema } from "../schemas.js";
import type { Task } from "../types.js";

function formatTask(t: Task): string {
  const lines = [
    `## ${t.title} (${t.id})`,
    `- **Status**: ${t.status}${t.previous_status ? ` (was: ${t.previous_status})` : ""}`,
    `- **Priority**: ${t.priority}`,
    t.assignee ? `- **Assignee**: ${t.assignee}` : null,
    t.phase !== null ? `- **Phase**: ${t.phase}` : null,
    t.description ? `- **Description**: ${t.description}` : null,
    t.acceptance_criteria ? `- **Acceptance Criteria**: ${t.acceptance_criteria}` : null,
    t.constraints ? `- **Constraints**: ${t.constraints}` : null,
    t.contracts ? `- **Contracts**: ${t.contracts}` : null,
    t.test_expectations ? `- **Test Expectations**: ${t.test_expectations}` : null,
    t.depends_on.length ? `- **Depends On**: ${t.depends_on.join(", ")}` : null,
    t.files_touched.length ? `- **Files Touched**: ${t.files_touched.join(", ")}` : null,
  ].filter(Boolean);

  if (t.notes.length) {
    lines.push("- **Notes**:");
    t.notes.forEach((n) => lines.push(`  - [${n.timestamp}] ${n.content}`));
  }

  return lines.join("\n");
}

export function registerTaskTools(server: McpServer): void {
  // ── list_tasks ─────────────────────────────────────────────────────────────
  server.registerTool(
    "agentboard_list_tasks",
    {
      title: "List Tasks",
      description: `List tasks for a project with optional phase or status filters.

Args:
  - project_id (string): UUID of the project
  - phase (number, optional): Filter to a specific phase (1–13)
  - status (string, optional): backlog | ready | in-progress | review | done | blocked

Returns:
  tasks: Array of task objects with full details
  count: Number of tasks returned`,
      inputSchema: {
        project_id: z.string().uuid().describe("UUID of the project"),
        phase: z.number().int().min(1).max(13).optional().describe("Filter by phase number (1–13)"),
        status: z
          .enum(["backlog", "ready", "in-progress", "review", "done", "blocked"])
          .optional()
          .describe("Filter by task status"),
      },
      outputSchema: TaskListOutputSchema,
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ project_id, phase, status }) => {
      try {
        const params: Record<string, unknown> = {};
        if (phase !== undefined) params["phase"] = phase;
        if (status !== undefined) params["status"] = status;

        const tasks = await apiGet<Task[]>(`/projects/${project_id}/tasks`, params);
        const structuredContent = { tasks, count: tasks.length };

        if (!tasks.length) {
          return {
            content: [{ type: "text", text: "No tasks found matching the given filters." }],
            structuredContent,
          };
        }
        const text = `# Tasks (${tasks.length})\n\n${tasks.map(formatTask).join("\n\n---\n\n")}`;
        return { content: [{ type: "text", text }], structuredContent };
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  // ── get_next_task ──────────────────────────────────────────────────────────
  server.registerTool(
    "agentboard_get_next_task",
    {
      title: "Get Next Task",
      description: `Get the highest-priority unblocked task ready to work on.

Priority order: critical → high → medium → low.
A task is eligible when: status != blocked/done AND all depends_on tasks are 'done'.

Args:
  - project_id (string): UUID of the project

Returns: The next task object, or null if no tasks are available.
Use the returned id, acceptance_criteria, and contracts to guide your implementation.`,
      inputSchema: {
        project_id: z.string().uuid().describe("UUID of the project"),
      },
      outputSchema: {
        task: z.object(TaskOutputSchema).nullable(),
        available: z.boolean(),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ project_id }) => {
      try {
        const task = await apiGet<Task | null>(`/projects/${project_id}/tasks/next`);
        if (!task) {
          return {
            content: [{ type: "text", text: "No available tasks. All tasks are either done or blocked by dependencies." }],
            structuredContent: { task: null, available: false },
          };
        }
        return {
          content: [{ type: "text", text: `# Next Task\n\n${formatTask(task)}` }],
          structuredContent: { task, available: true },
        };
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  // ── create_task ────────────────────────────────────────────────────────────
  server.registerTool(
    "agentboard_create_task",
    {
      title: "Create Task",
      description: `Create a new task within a project.

State machine note: Tasks start as 'backlog'. To transition to 'in-progress' later:
  - assignee must be set
  - acceptance_criteria must be set

Args:
  - project_id (string): UUID of the project
  - title (string): Task title
  - description (string, optional): Detailed description
  - acceptance_criteria (string, optional): Required before starting work
  - constraints (string, optional): Technical or business constraints
  - contracts (string, optional): API contracts or interfaces this task must uphold
  - test_expectations (string, optional): What tests should verify
  - phase (number, optional): Phase this task belongs to (1–13)
  - priority (string, optional): critical | high | medium (default) | low
  - assignee (string, optional): Agent or person responsible
  - depends_on (string[], optional): UUIDs of tasks that must be done first

Returns: The created task object.`,
      inputSchema: {
        project_id: z.string().uuid().describe("UUID of the project"),
        title: z.string().min(1).max(500).describe("Task title"),
        description: z.string().optional().describe("Detailed description of the task"),
        acceptance_criteria: z.string().optional().describe("Criteria that must be met (required to start task)"),
        constraints: z.string().optional().describe("Technical or business constraints"),
        contracts: z.string().optional().describe("API or interface contracts to uphold"),
        test_expectations: z.string().optional().describe("What tests should verify"),
        phase: z.number().int().min(1).max(13).describe("Phase number this task belongs to (1–13, required)"),
        priority: z
          .enum(["critical", "high", "medium", "low"])
          .default("medium")
          .describe("Task priority (default: medium)"),
        assignee: z.string().optional().describe("Agent ID or name responsible for this task"),
        depends_on: z
          .array(z.string().uuid())
          .default([])
          .describe("UUIDs of tasks that must be completed first"),
      },
      outputSchema: TaskOutputSchema,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async ({ project_id, title, description, acceptance_criteria, constraints, contracts, test_expectations, phase, priority, assignee, depends_on }) => {
      try {
        const body: Record<string, unknown> = { title, priority, depends_on };
        if (description) body["description"] = description;
        if (acceptance_criteria) body["acceptance_criteria"] = acceptance_criteria;
        if (constraints) body["constraints"] = constraints;
        if (contracts) body["contracts"] = contracts;
        if (test_expectations) body["test_expectations"] = test_expectations;
        if (phase !== undefined) body["phase"] = phase;
        if (assignee) body["assignee"] = assignee;

        const task = await apiPost<Task>(`/projects/${project_id}/tasks`, body);
        return {
          content: [{ type: "text", text: `✅ Task created!\n\n${formatTask(task)}` }],
          structuredContent: task,
        };
      } catch (err) {
        return errorResult(err);
      }
    }
  );

  // ── update_task ────────────────────────────────────────────────────────────
  server.registerTool(
    "agentboard_update_task",
    {
      title: "Update Task",
      description: `Update a task's status, assignee, notes, files, or other fields.

State machine rules (server enforces these — illegal transitions are rejected):
  backlog → ready
  ready → in-progress       REQUIRES: assignee + acceptance_criteria set
  in-progress → review      REQUIRES: at least one note added
  review → done             REQUIRES: at least one note added
  any → blocked             Saves current status to previous_status
  blocked → (previous)      Returns to status before blocking

Args:
  - task_id (string): UUID of the task
  - status (string, optional): New status — must follow state machine rules
  - priority (string, optional): New priority
  - assignee (string, optional): New assignee
  - notes (array, optional): Notes to add — each with { content, timestamp }
  - files_touched (string[], optional): File paths modified
  - title / description / acceptance_criteria / constraints / contracts / test_expectations (optional)
  - depends_on (string[], optional): Replace the full dependency list

Returns: The updated task object with all current field values.`,
      inputSchema: {
        task_id: z.string().uuid().describe("UUID of the task to update"),
        status: z
          .enum(["backlog", "ready", "in-progress", "review", "done", "blocked"])
          .optional()
          .describe("New status — must follow state machine rules"),
        priority: z.enum(["critical", "high", "medium", "low"]).optional().describe("New priority"),
        assignee: z.string().optional().describe("New assignee agent ID or name"),
        notes: z
          .array(
            z.object({
              content: z.string().describe("Note text"),
              timestamp: z.string().describe("ISO8601 timestamp"),
            })
          )
          .optional()
          .describe("Notes to add (required when transitioning to 'review' or 'done')"),
        files_touched: z.array(z.string()).optional().describe("File paths modified during this task"),
        title: z.string().optional().describe("New task title"),
        description: z.string().optional().describe("New description"),
        acceptance_criteria: z.string().optional().describe("New acceptance criteria"),
        constraints: z.string().optional().describe("New constraints"),
        contracts: z.string().optional().describe("New contracts"),
        test_expectations: z.string().optional().describe("New test expectations"),
        depends_on: z.array(z.string().uuid()).optional().describe("Replace full dependency list"),
      },
      outputSchema: TaskOutputSchema,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    },
    async ({ task_id, ...fields }) => {
      try {
        const body: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(fields)) {
          if (v !== undefined) body[k] = v;
        }

        const task = await apiPatch<Task>(`/tasks/${task_id}`, body);
        return {
          content: [{ type: "text", text: `✅ Task updated!\n\n${formatTask(task)}` }],
          structuredContent: task,
        };
      } catch (err) {
        return errorResult(err);
      }
    }
  );
}