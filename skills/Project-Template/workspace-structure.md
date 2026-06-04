# Project Workspace Structure

Create this structure for engineering R&D projects.

```
project-name/
├── .vscode/
│   ├── settings.json          # Workspace settings (see vscode-setup.md)
│   └── foam.json              # Foam configuration
│
├── docs/
│   ├── index.md               # Project overview, entry point
│   ├── decisions/             # Decision records
│   │   └── 001-example.md     # DEC-001: [Title]
│   ├── reference/             # Claude's learned knowledge (grows organically)
│   │   └── .gitkeep           # Empty until needed
│   ├── research/              # Your research notes, sources
│   │   └── _sources.md        # URL dump with annotations
│   └── journal/               # Daily/weekly engineering log
│       └── .gitkeep
│
├── calculations/              # Jupyter notebooks, scripts
│   └── .gitkeep
│
├── design/
│   ├── cad/                   # CAD files or links
│   ├── drawings/              # 2D drawings, schematics
│   └── iterations/            # Design version snapshots
│       └── v0.1/
│
├── testing/
│   ├── data/                  # Raw test data
│   ├── analysis/              # Analysis notebooks/scripts
│   └── logs/                  # Test logs, notes
│
├── manufacturing/
│   ├── processes/             # Process documentation
│   ├── toolpaths/             # CAM, G-code
│   └── bom.md                 # Bill of materials
│
├── CONTEXT.md                 # AI session handoff (critical)
├── TODO.md                    # Long-term planning
├── README.md                  # Project overview for humans
└── .gitignore
```

## Directory Purposes

### docs/
- **index.md**: Entry point. Project overview, links to key docs.
- **decisions/**: Numbered decision records. Why choices were made.
- **reference/**: Claude's documented learning. Each file = knowledge needed for a specific problem. Grows as project demands.
- **research/**: Your research. Consolidated browser tabs, papers, sources.
- **journal/**: Narrative engineering log. What happened, what you learned.

### calculations/
Jupyter notebooks and scripts for engineering calculations. Reproducible, documented math - not scratch paper.

### design/
CAD, drawings, design iterations. `iterations/` preserves snapshots at key points.

### testing/
Test data, analysis, logs. Keep raw data separate from analysis.

### manufacturing/
Process docs, toolpaths, BOM. What's needed to actually build it.

### Root Files
- **CONTEXT.md**: AI reads this at session start, updates at session end.
- **TODO.md**: Long-term planning, backlog, priorities.
- **README.md**: Human-readable project overview.

## Git Strategy

### Branch Structure
```
main                        # Stable baseline
├── design/[feature]        # Design iteration branches
├── research/[topic]        # Research deep-dives
├── experiment/[name]       # Test campaigns
└── calc/[model]            # Calculation development
```

### Commit Message Convention
```
[TYPE] Description

Types:
- DECISION: Design/engineering decision made
- CALC: Calculation added or updated
- TEST: Test data or analysis
- RESEARCH: Research documented
- DESIGN: Design files changed
- FIX: Correction to previous work
- DOC: Documentation update
```

### .gitignore Starter
```
# Python
__pycache__/
*.pyc
.ipynb_checkpoints/

# OS
.DS_Store
Thumbs.db

# IDE
.idea/

# Large files (if not using LFS)
*.stl
*.step
*.stp

# Sensitive
.env
```

## Initialization Script

Run in project root:

```bash
#!/bin/bash
# init-project.sh

mkdir -p .vscode
mkdir -p docs/{decisions,reference,research,journal}
mkdir -p calculations
mkdir -p design/{cad,drawings,iterations/v0.1}
mkdir -p testing/{data,analysis,logs}
mkdir -p manufacturing/{processes,toolpaths}

touch docs/reference/.gitkeep
touch docs/journal/.gitkeep
touch calculations/.gitkeep
touch testing/data/.gitkeep

# Copy templates if available
# cp /path/to/templates/CONTEXT.md ./CONTEXT.md
# cp /path/to/templates/TODO.md ./TODO.md

echo "# Project Name" > README.md
echo "# Sources" > docs/research/_sources.md

git init
git add -A
git commit -m "Initial project structure"
```
