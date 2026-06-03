#!/bin/bash

# Initialize Codebase Cleanup Audit
# Sets up the audit directory structure and initial files

set -e

echo "==================================="
echo "Codebase Cleanup Audit Initializer"
echo "==================================="
echo ""

# Check if we're in a git repository
if [ ! -d .git ]; then
    echo "⚠️  Warning: Not in a git repository. Version control is recommended."
    echo -n "Continue anyway? (y/n): "
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "Initialization cancelled."
        exit 1
    fi
fi

# Check for existing audit
if [ -d .cleanup-audit ]; then
    echo "⚠️  Existing cleanup audit found."
    echo -n "Remove existing audit and start fresh? (y/n): "
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        rm -rf .cleanup-audit
        echo "Removed existing audit."
    else
        echo "Initialization cancelled."
        exit 1
    fi
fi

# Create audit directory structure
echo "Creating audit directory structure..."
mkdir -p .cleanup-audit/{reports,backups,proposals,scripts}

# Initialize audit log
echo "$(date): Cleanup audit initialized" > .cleanup-audit/audit.log
echo "Project: $(basename "$(pwd)")" >> .cleanup-audit/audit.log
echo "Git Branch: $(git branch --show-current 2>/dev/null || echo 'N/A')" >> .cleanup-audit/audit.log
echo "Node Version: $(node -v 2>/dev/null || echo 'N/A')" >> .cleanup-audit/audit.log
echo "NPM Version: $(npm -v 2>/dev/null || echo 'N/A')" >> .cleanup-audit/audit.log
echo "" >> .cleanup-audit/audit.log

# Create .gitignore for audit directory
cat > .cleanup-audit/.gitignore << 'EOF'
# Cleanup audit files
backups/
*.backup
*.tar.gz
*.zip

# Keep reports and proposals
!reports/
!proposals/
EOF

# Generate initial inventory
echo "Generating file inventory..."
find . -type f \( \
    -name "*.js" -o -name "*.jsx" \
    -o -name "*.ts" -o -name "*.tsx" \
    -o -name "*.json" -o -name "*.md" \
    -o -name "*.yml" -o -name "*.yaml" \
    -o -name ".env*" -o -name "*.config.*" \
    \) ! -path "./node_modules/*" \
    ! -path "./.git/*" \
    ! -path "./dist/*" \
    ! -path "./build/*" \
    ! -path "./.cleanup-audit/*" | sort > .cleanup-audit/file-inventory.txt

# Count files and generate initial statistics
total_files=$(wc -l < .cleanup-audit/file-inventory.txt)
js_files=$(grep -c "\.jsx\?$" .cleanup-audit/file-inventory.txt || echo 0)
ts_files=$(grep -c "\.tsx\?$" .cleanup-audit/file-inventory.txt || echo 0)
config_files=$(grep -c "\.config\." .cleanup-audit/file-inventory.txt || echo 0)
md_files=$(grep -c "\.md$" .cleanup-audit/file-inventory.txt || echo 0)

# Create initial statistics file
cat > .cleanup-audit/initial-stats.json << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "statistics": {
    "totalFiles": $total_files,
    "jsFiles": $js_files,
    "tsFiles": $ts_files,
    "configFiles": $config_files,
    "markdownFiles": $md_files,
    "projectSize": "$(du -sh . 2>/dev/null | cut -f1 || echo 'N/A')",
    "nodeModulesSize": "$(du -sh node_modules 2>/dev/null | cut -f1 || echo 'N/A')"
  }
}
EOF

# Create rollback script
cat > .cleanup-audit/scripts/rollback.sh << 'EOF'
#!/bin/bash
# Rollback script for cleanup operations

if [ -z "$1" ]; then
    echo "Usage: ./rollback.sh <backup-file>"
    echo "Available backups:"
    ls -la ../backups/*.tar.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

if [ ! -f "$1" ]; then
    echo "Backup file not found: $1"
    exit 1
fi

echo "⚠️  This will restore from backup: $1"
echo "Current state will be lost!"
echo -n "Continue? (y/n): "
read -r response

if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo "Rollback cancelled."
    exit 1
fi

echo "Restoring from backup..."
tar -xzf "$1" -C ../../
echo "✅ Restored from backup: $1"
echo "$(date): Restored from backup $1" >> ../audit.log
EOF
chmod +x .cleanup-audit/scripts/rollback.sh

# Create emergency stop script
cat > .cleanup-audit/scripts/emergency-stop.sh << 'EOF'
#!/bin/bash
# Emergency stop for cleanup operations

echo "🛑 EMERGENCY STOP TRIGGERED"
touch ../STOP
echo "$(date): Emergency stop triggered" >> ../audit.log
echo "All cleanup operations have been halted."
echo "Remove .cleanup-audit/STOP file to resume."
EOF
chmod +x .cleanup-audit/scripts/emergency-stop.sh

# Create backup creation script
cat > .cleanup-audit/scripts/create-backup.sh << 'EOF'
#!/bin/bash
# Create a backup before cleanup operations

BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S).tar.gz"
BACKUP_PATH="../backups/$BACKUP_NAME"

echo "Creating backup: $BACKUP_NAME"
echo "This may take a few minutes..."

# Create backup excluding common directories
tar -czf "$BACKUP_PATH" \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=dist \
    --exclude=build \
    --exclude=.next \
    --exclude=.cache \
    --exclude=.cleanup-audit \
    ../../

if [ $? -eq 0 ]; then
    SIZE=$(du -h "$BACKUP_PATH" | cut -f1)
    echo "✅ Backup created: $BACKUP_NAME ($SIZE)"
    echo "$(date): Created backup $BACKUP_NAME ($SIZE)" >> ../audit.log
else
    echo "❌ Backup failed!"
    exit 1
fi
EOF
chmod +x .cleanup-audit/scripts/create-backup.sh

# Create phase tracker
cat > .cleanup-audit/phase-status.json << 'EOF'
{
  "currentPhase": 0,
  "phases": {
    "0": {"name": "Initialization", "status": "complete", "timestamp": null},
    "1": {"name": "Discovery & Inventory", "status": "pending", "timestamp": null},
    "2": {"name": "Analysis & Classification", "status": "pending", "timestamp": null},
    "3": {"name": "Validation & Testing", "status": "pending", "timestamp": null},
    "4": {"name": "Planning & Proposal", "status": "pending", "timestamp": null},
    "5": {"name": "Execution", "status": "pending", "timestamp": null}
  },
  "lastUpdate": null
}
EOF

# Update phase status
node -e "
const fs = require('fs');
const status = JSON.parse(fs.readFileSync('.cleanup-audit/phase-status.json'));
status.phases['0'].timestamp = new Date().toISOString();
status.lastUpdate = new Date().toISOString();
fs.writeFileSync('.cleanup-audit/phase-status.json', JSON.stringify(status, null, 2));
" 2>/dev/null || echo "Note: Node.js not available for JSON updates"

# Create README for audit directory
cat > .cleanup-audit/README.md << 'EOF'
# Codebase Cleanup Audit

This directory contains all files related to the codebase cleanup audit.

## Directory Structure

- `reports/` - Analysis reports from each phase
- `backups/` - Backup files before changes
- `proposals/` - Cleanup proposals awaiting approval
- `scripts/` - Utility scripts for cleanup operations

## Important Files

- `audit.log` - Chronological log of all operations
- `file-inventory.txt` - Complete list of project files
- `phase-status.json` - Current phase and progress
- `STOP` - If present, all operations are halted

## Scripts

- `scripts/create-backup.sh` - Create a project backup
- `scripts/rollback.sh` - Restore from backup
- `scripts/emergency-stop.sh` - Halt all operations

## Phases

1. **Discovery & Inventory** - Map the codebase
2. **Analysis & Classification** - Identify issues
3. **Validation & Testing** - Verify workflows
4. **Planning & Proposal** - Generate cleanup plan
5. **Execution** - Implement approved changes

## Safety Features

- Backups before any destructive operations
- Approval required at each phase
- Emergency stop capability
- Complete rollback functionality
EOF

# Final summary
echo ""
echo "✅ Cleanup audit initialized successfully!"
echo ""
echo "📊 Initial Statistics:"
echo "  - Total files: $total_files"
echo "  - JavaScript files: $js_files"
echo "  - TypeScript files: $ts_files"
echo "  - Config files: $config_files"
echo "  - Documentation files: $md_files"
echo ""
echo "📁 Audit directory: .cleanup-audit/"
echo ""
echo "Next steps:"
echo "1. Review .cleanup-audit/file-inventory.txt"
echo "2. Run Phase 1: Discovery & Inventory"
echo "3. Deploy subagents for parallel analysis"
echo ""
echo "To create a backup now, run:"
echo "  cd .cleanup-audit/scripts && ./create-backup.sh"
echo ""
