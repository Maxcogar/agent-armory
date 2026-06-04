import { describe, it, expect } from 'vitest';
import { classifyTask } from '../../src/core/services/task-classifier.js';
import { requiredCategories } from '../../src/core/services/recipe-engine.js';

describe('task classifier', () => {
  it('labels a frontend task and extracts mentions', () => {
    const c = classifyTask('Add a dark mode toggle to the SettingsPage in src/routes/SettingsPage.tsx');
    expect(c.task.task_types).toContain('frontend_ui_change');
    expect(c.mentionedPaths).toContain('src/routes/SettingsPage.tsx');
    expect(c.mentionedSymbols).toContain('SettingsPage');
  });
  it('labels backend + database for an API/schema task', () => {
    const c = classifyTask('Add a new API endpoint that writes to the users table');
    expect(c.task.task_types).toEqual(expect.arrayContaining(['backend_api_change', 'database_schema_change']));
  });
  it('falls back to general_change when nothing matches', () => {
    expect(classifyTask('xyzzy plugh').task.task_types).toEqual(['general_change']);
  });
  it('labels codebase comprehension questions separately from edit tasks', () => {
    const c = classifyTask('How does getPreference work and what data can it use?');
    expect(c.task.task_types).toContain('codebase_question');
    expect(c.task.intent).toBe('locate_understand');
    expect(c.mentionedSymbols).toContain('getPreference');
    expect(c.keywords).not.toContain('how');
  });
  it('does not mistake a meta test of ctxpack for test creation', () => {
    const c = classifyTask("okay then jsut test this. Ill ask a question about the codebase and you see if ctxpack gave you any help. you dont have to answer the question, its just for the test - what telemetry data can be seen in the detail cards of the plants in my collection?");
    expect(c.task.task_types).toContain('codebase_question');
    expect(c.task.task_types).not.toContain('test_creation');
    expect(c.task.intent).toBe('locate_understand');
  });
  it('separates intent, domain, and security modifier', () => {
    const c = classifyTask('Fix the login API route bug without leaking session tokens');
    expect(c.task.intent).toBe('bug_fix');
    expect(c.task.domains).toContain('backend');
    expect(c.task.modifiers).toContain('security_sensitive');
  });
  it('maps dependency and docs tasks to explicit intents', () => {
    expect(classifyTask('Upgrade vite and verify package.json scripts').task.intent).toBe('dependency_maintenance');
    expect(classifyTask('Update the README documentation for SettingsPage').task.intent).toBe('documentation_update');
    expect(classifyTask('Implement a new dashboard widget').task.intent).toBe('feature');
    expect(classifyTask('Review this diff for regressions').task.intent).toBe('review');
  });
  it('recipe unions categories across matched types', () => {
    const cats = requiredCategories(['frontend_ui_change', 'backend_api_change']);
    expect(cats).toEqual(expect.arrayContaining(['target_files', 'styling_theme_system', 'api_surface']));
  });
});
