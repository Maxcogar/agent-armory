# Smart Project Initializer System

A sophisticated project initialization system that integrates with Claude Code CLI to automatically offer development templates when working in new projects.

## 🎯 Overview

This system eliminates the need to manually set up development frameworks (like BMAD) for each new project. Instead, it:

- **Auto-detects** new project directories
- **Offers relevant templates** through intelligent prompts
- **Integrates seamlessly** with Claude Code CLI workflows
- **Scales easily** with additional templates
- **Works across computers** via OneDrive sync

## 📁 Directory Structure

```
project-initializer/
├── setup.ps1                 # Master installation script
├── quick-setup.ps1           # Quick project setup command
├── scripts/
│   └── Initialize-Project.ps1 # Core initialization logic
├── hooks/
│   ├── Claude-Hooks.ps1      # PowerShell profile hooks
│   ├── rule2hook-config.md   # Configuration for rule2hook
│   └── project-init-rules.md # Human-readable rules
├── templates/
│   └── bmad-template/        # BMAD framework template
│       ├── .bmad-core/       # Core BMAD files
│       ├── .claude/          # Claude Code CLI rules
│       ├── .cursor/          # Cursor IDE rules
│       ├── .windsurf/        # Windsurf IDE rules
│       ├── web-bundles/      # Pre-built components
│       ├── docs/             # Documentation folder
│       └── template.json     # Template configuration
└── README.md                 # This file
```

## 🚀 Quick Start

### 1. Complete Setup (Recommended)
```powershell
cd "C:\Users\maxco\OneDrive\Documents\GitHub\Coding Tools\Claude\project-initializer"
.\setup.ps1 -All
```

### 2. Check Status
```powershell
.\setup.ps1 -Status
```

### 3. Use in Projects
```powershell
cd your-new-project
quick-setup
```

## ⚙️ Integration Options

### Option 1: Manual Usage (Always Available)
```powershell
# In any project directory
quick-setup                  # Interactive template selection
quick-setup -List           # Show available templates
quick-setup -Help           # Show help
```

### Option 2: rule2hook Integration (Recommended)
Automatically prompts when Claude Code CLI detects new projects:

1. **Setup hooks:**
   ```powershell
   .\setup.ps1 -SetupHooks
   ```

2. **Configure in Claude Code CLI:**
   ```
   /rule2hook
   ```
   Then provide: `C:\Users\maxco\OneDrive\Documents\GitHub\Coding Tools\Claude\project-initializer\hooks\rule2hook-config.md`

3. **Automatic behavior:** System will now offer templates when working in new projects

### Option 3: PowerShell Profile Integration
For PowerShell users who want automatic prompting:

1. **Find your profile:**
   ```powershell
   $PROFILE
   ```

2. **Add to profile:**
   ```powershell
   . "C:\Users\maxco\OneDrive\Documents\GitHub\Coding Tools\Claude\project-initializer\hooks\Claude-Hooks.ps1"
   ```

## 📦 Available Templates

### BMAD Template
- **Name:** BMAD Agile AI Development Framework
- **Description:** Complete agile development workflow with AI agents
- **Includes:** Product Owner, Scrum Master, Developer, QA agents
- **Usage:** Run `/PO` then `shard doc docs/prd.md docs/architecture.md`
- **Perfect for:** Structured AI-driven software development

## 🔧 Setup Commands

| Command | Description |
|---------|-------------|
| `.\setup.ps1 -All` | Complete setup (install + PATH + hooks) |
| `.\setup.ps1 -Install` | Install core system only |
| `.\setup.ps1 -AddToPath` | Add to system PATH for global access |
| `.\setup.ps1 -SetupHooks` | Configure rule2hook integration |
| `.\setup.ps1 -Status` | Show current setup status |
| `.\setup.ps1 -Help` | Show detailed help |

## 📝 Usage Examples

### New Project Workflow
```powershell
# Create new project
mkdir my-awesome-app
cd my-awesome-app
git init

# System automatically offers templates (with hooks)
# OR manually run:
quick-setup

# Choose BMAD template
# Files are copied to project

# Start development
claude
/PO
shard doc docs/prd.md docs/architecture.md
```

### Existing Project
```powershell
cd existing-project
quick-setup -Force    # Override safety checks
```

## 🆕 Adding New Templates

1. **Create template directory:**
   ```powershell
   mkdir "templates\my-new-template"
   ```

2. **Add template files:**
   - Place all template files in the directory
   - Create `template.json` with configuration

3. **Template configuration:**
   ```json
   {
     "name": "My New Template",
     "description": "Description of what this template provides",
     "version": "1.0.0",
     "requires": ["Node.js", "Git"],
     "usage": "How to use after setup"
   }
   ```

4. **Template appears automatically** in the menu

## 🔍 System Behavior

### When Templates Are Offered
- ✅ New/empty project directories
- ✅ Projects with basic files (README, .gitignore, package.json)
- ✅ Projects without existing Claude Code setup
- ❌ Projects with many files (use `-Force` to override)
- ❌ Projects already configured with Claude Code tools

### Smart Detection
- Recognizes common project indicators (package.json, .git, requirements.txt, etc.)
- Avoids interrupting established workflows
- Provides helpful suggestions only when beneficial

## 🛠️ Technical Details

### Components
- **PowerShell Scripts:** Core logic and user interface
- **JSON Configuration:** Template definitions and settings
- **File Templates:** Complete framework installations
- **Hook Integration:** Seamless Claude Code CLI integration

### File Operations
- Templates are **copied** (not linked) to projects
- Safe to modify template files within projects
- Original templates remain unchanged
- Supports OneDrive sync across multiple computers

### Error Handling
- Graceful fallbacks for missing dependencies
- Detailed logging to `~/.claude/project-init.log`
- Non-intrusive error messages
- Safe operation with existing files

## 🌟 Benefits

### For Developers
- **Instant Setup:** 30-second project initialization
- **Consistent Structure:** Same tools across all projects
- **Zero Learning Curve:** Works with existing workflows
- **Expandable:** Easy to add new templates

### For Teams
- **Standardization:** Everyone uses the same setup
- **Onboarding:** New team members get productive faster
- **Best Practices:** Templates enforce good patterns
- **Tool Integration:** Seamless with modern development tools

## 🚨 Troubleshooting

### Common Issues

**"Templates not found"**
```powershell
.\setup.ps1 -Status    # Check installation
```

**"quick-setup command not found"**
```powershell
.\setup.ps1 -AddToPath    # Add to PATH
# Then restart PowerShell
```

**"Hooks not working"**
```powershell
# Check rule2hook installation
Get-Content "$env:USERPROFILE\.claude\commands\rule2hook.md"
```

**"Permission denied"**
```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Debug Information
- **Logs:** `~/.claude/project-init.log`
- **Status:** `.\setup.ps1 -Status`
- **Test:** `quick-setup -List`

## 🔮 Future Enhancements

### Planned Features
- **VS Code Integration:** Workspace templates and settings
- **Git Hooks:** Automatic setup of pre-commit hooks
- **Docker Templates:** Containerized development environments
- **CI/CD Templates:** GitHub Actions, GitLab CI configurations
- **Framework-Specific:** React, Vue, Python, Go project templates

### Extension Points
- **Custom Templates:** Easy template creation system
- **Plugin Architecture:** Extensible template processing
- **Team Templates:** Shared template repositories
- **Smart Suggestions:** AI-powered template recommendations

## 📞 Support

### Getting Help
1. **Check Status:** `.\setup.ps1 -Status`
2. **View Logs:** Check `~/.claude/project-init.log`
3. **Test Manually:** `quick-setup -List`
4. **Reinstall:** `.\setup.ps1 -All`

### File Locations
- **Templates:** `project-initializer/templates/`
- **Scripts:** `project-initializer/scripts/`
- **Logs:** `~/.claude/project-init.log`
- **Hooks:** `~/.claude/hooks.json`

---

*Built for efficient, standardized development workflows with Claude Code CLI* 🤖
