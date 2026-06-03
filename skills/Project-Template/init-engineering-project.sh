#!/bin/bash
# init-engineering-project.sh
# Creates the workspace structure for engineering R&D projects

set -e

PROJECT_NAME=${1:-"engineering-project"}

echo "Creating project: $PROJECT_NAME"

mkdir -p "$PROJECT_NAME"
cd "$PROJECT_NAME"

# Create directory structure
mkdir -p .vscode
mkdir -p docs/{decisions,reference,research,journal}
mkdir -p calculations
mkdir -p design/{cad,drawings,iterations/v0.1}
mkdir -p testing/{data,analysis,logs}
mkdir -p manufacturing/{processes,toolpaths}

# Create .gitkeep files for empty directories
touch docs/reference/.gitkeep
touch docs/journal/.gitkeep
touch calculations/.gitkeep
touch testing/data/.gitkeep
touch testing/analysis/.gitkeep
touch testing/logs/.gitkeep
touch design/cad/.gitkeep
touch design/drawings/.gitkeep
touch manufacturing/processes/.gitkeep
touch manufacturing/toolpaths/.gitkeep

# Create starter files
cat > README.md << 'EOF'
# Project Name

[One paragraph description]

## Quick Links

- [[CONTEXT.md]] - AI session context
- [[TODO.md]] - Task planning
- [[docs/index.md]] - Project documentation

## Status

**Current Phase:** [phase]

**Last Updated:** YYYY-MM-DD
EOF

cat > docs/index.md << 'EOF'
# Project Documentation

## Overview

[Project description]

## Key Documents

- [[../CONTEXT.md]] - AI session handoff
- [[decisions/]] - Decision records
- [[reference/]] - Technical reference (Claude's learned knowledge)
- [[research/_sources.md]] - Research sources

## Architecture

[High-level description or link to diagrams]

## Critical Parameters

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| | | |
EOF

cat > docs/research/_sources.md << 'EOF'
# Research Sources

## To Process

- [ ] [URL] - [note]

## Processed

[Organized sources go here]
EOF

cat > manufacturing/bom.md << 'EOF'
# Bill of Materials

| Item | Part Number | Quantity | Supplier | Status |
|------|-------------|----------|----------|--------|
| | | | | |
EOF

# Create .gitignore
cat > .gitignore << 'EOF'
# Python
__pycache__/
*.pyc
.ipynb_checkpoints/

# OS
.DS_Store
Thumbs.db

# IDE
.idea/

# Large CAD files (use Git LFS for these)
# *.stl
# *.step
# *.stp

# Sensitive
.env
EOF

# Create VS Code settings
cat > .vscode/settings.json << 'EOF'
{
  "foam.edit.linkReferenceDefinitions": "withExtensions",
  "foam.openDailyNote.directory": "docs/journal",
  "foam.openDailyNote.filenameFormat": "yyyy-mm-dd",
  
  "todo-tree.general.tags": [
    "TODO",
    "FIXME",
    "QUESTION",
    "RESEARCH",
    "DECISION",
    "VERIFY"
  ],
  "todo-tree.highlights.customHighlight": {
    "QUESTION": {
      "icon": "question",
      "foreground": "#f4a460"
    },
    "RESEARCH": {
      "icon": "book",
      "foreground": "#6495ed"
    },
    "DECISION": {
      "icon": "check",
      "foreground": "#32cd32"
    },
    "VERIFY": {
      "icon": "alert",
      "foreground": "#ff6347"
    }
  },
  
  "files.exclude": {
    "**/__pycache__": true,
    "**/.ipynb_checkpoints": true
  },
  
  "editor.wordWrap": "on",
  "[markdown]": {
    "editor.wordWrap": "on",
    "editor.quickSuggestions": {
      "other": true,
      "comments": false,
      "strings": false
    }
  }
}
EOF

cat > .vscode/foam.json << 'EOF'
{
  "foam.files.ignore": [
    ".vscode/**/*",
    "node_modules/**/*",
    ".git/**/*"
  ]
}
EOF

echo ""
echo "Project structure created."
echo ""
echo "Next steps:"
echo "1. Copy CONTEXT.md and TODO.md templates to project root"
echo "2. Initialize git: cd $PROJECT_NAME && git init"
echo "3. Install VS Code extensions (see vscode-setup.md)"
echo "4. Open in VS Code: code $PROJECT_NAME"
