# Project Initialization Rules for rule2hook

## Rule 1: Offer Project Templates on First Task
When starting work in a new project directory, check if project initialization is needed and offer template setup if appropriate.

**Trigger**: Before any task execution in an empty or new project directory
**Action**: Run project initialization script to offer BMAD and other templates
**Command**: `powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\maxco\OneDrive\Documents\GitHub\Coding Tools\Claude\project-initializer\scripts\Initialize-Project.ps1" -Silent`

## Rule 2: Auto-detect Project Setup Needs
Before reading or editing files in a project, check if development templates should be offered for better workflow.

**Trigger**: Before file operations in projects without Claude Code setup
**Action**: Silently check and offer project initialization if beneficial
**Command**: `powershell -NoProfile -ExecutionPolicy Bypass -File "C:\Users\maxco\OneDrive\Documents\GitHub\Coding Tools\Claude\project-initializer\scripts\Initialize-Project.ps1" -Silent`
