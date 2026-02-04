#!/usr/bin/env python3
"""
Interactive RAG setup that auto-detects your project structure
and generates constraint files from your actual code patterns.
"""
import json
import re
from pathlib import Path
from collections import Counter
import sys

class RAGSetup:
    def __init__(self):
        self.project_root = Path.cwd()
        self.frontend_root = None
        self.backend_root = None
        self.detected_patterns = {}
        
    def run(self):
        print("🚀 RAG Enforcer Setup\n")
        print("This will:")
        print("  1. Auto-detect your project structure")
        print("  2. Scan your code for actual patterns")
        print("  3. Generate constraint files from reality")
        print("  4. Set up the RAG system\n")
        
        # Step 1: Detect structure
        self.detect_structure()
        
        # Step 2: Scan for patterns
        print("\n📊 Scanning codebase for patterns...")
        self.scan_patterns()
        
        # Step 3: Generate files
        print("\n📝 Generating constraint files...")
        self.generate_architecture_yml()
        self.generate_patterns_docs()
        
        # Step 4: Create config
        print("\n⚙️  Creating rag_config.py...")
        self.generate_config()
        
        print("\n✅ Setup complete!")
        print("\nNext steps:")
        print("  1. Review generated files (ARCHITECTURE.yml, docs/patterns/)")
        print("  2. Run: python scripts/index_codebase.py")
        print("  3. Test: python scripts/check_constraints.py 'your change'")
        
    def detect_structure(self):
        print("🔍 Detecting project structure...\n")
        
        # Look for frontend
        frontend_candidates = [
            self.project_root / "frontend",
            self.project_root / "src",
            self.project_root / "client",
        ]
        
        for candidate in frontend_candidates:
            if candidate.exists():
                package_json = candidate / "package.json"
                if package_json.exists():
                    try:
                        pkg = json.loads(package_json.read_text(encoding='utf-8'))
                        deps = {**pkg.get('dependencies', {}), **pkg.get('devDependencies', {})}
                        
                        # Check for frontend frameworks
                        if any(fw in deps for fw in ['react', 'vue', 'angular', 'svelte', 'vite']):
                            confirm = input(f"Found frontend at {candidate.relative_to(self.project_root)}. Use this? [Y/n]: ").strip().lower()
                            if confirm in ['', 'y', 'yes']:
                                self.frontend_root = candidate
                                print(f"✅ Frontend: {candidate.relative_to(self.project_root)}")
                                break
                    except:
                        pass
        
        if not self.frontend_root:
            custom = input("Enter frontend directory path (or press Enter to skip): ").strip()
            if custom:
                self.frontend_root = self.project_root / custom
        
        # Look for backend
        backend_candidates = [
            self.project_root / "backend",
            self.project_root / "server",
            self.project_root / "api",
        ]
        
        for candidate in backend_candidates:
            if candidate.exists():
                # Check for common backend indicators
                if any((candidate / f).exists() for f in ['package.json', 'requirements.txt', 'go.mod']):
                    confirm = input(f"Found backend at {candidate.relative_to(self.project_root)}. Use this? [Y/n]: ").strip().lower()
                    if confirm in ['', 'y', 'yes']:
                        self.backend_root = candidate
                        print(f"✅ Backend: {candidate.relative_to(self.project_root)}")
                        break
        
        if not self.backend_root:
            custom = input("Enter backend directory path (or press Enter to skip): ").strip()
            if custom:
                self.backend_root = self.project_root / custom
    
    def scan_patterns(self):
        """Scan code to detect actual patterns in use"""
        
        # Scan backend patterns
        if self.backend_root:
            self.scan_backend_patterns()
        
        # Scan frontend patterns
        if self.frontend_root:
            self.scan_frontend_patterns()
    
    def scan_backend_patterns(self):
        """Detect backend patterns"""
        routes_dir = self.backend_root / "routes"
        if not routes_dir.exists():
            routes_dir = self.backend_root / "src" / "routes"
        
        if not routes_dir.exists():
            return
        
        print(f"  Scanning {routes_dir.relative_to(self.project_root)}...")
        
        middleware_patterns = Counter()
        response_patterns = Counter()
        
        for route_file in routes_dir.glob("**/*.js"):
            try:
                content = route_file.read_text(encoding='utf-8')
                
                # Find middleware usage
                middleware = re.findall(r'router\.\w+\([^,]+,\s*(\w+)', content)
                middleware_patterns.update(middleware)
                
                # Find response patterns
                if 'res.json({ success:' in content:
                    response_patterns['success_data_error'] += 1
                elif 'res.json({' in content:
                    response_patterns['generic_json'] += 1
                
            except:
                pass
        
        # Store detected patterns
        if middleware_patterns:
            common_middleware = [mw for mw, count in middleware_patterns.most_common(5)]
            self.detected_patterns['backend_middleware'] = common_middleware
            print(f"    Found middleware: {', '.join(common_middleware)}")
        
        if response_patterns:
            most_common = response_patterns.most_common(1)[0][0]
            self.detected_patterns['backend_response_format'] = most_common
            print(f"    Response format: {most_common}")
    
    def scan_frontend_patterns(self):
        """Detect frontend patterns"""
        components_dir = self.frontend_root / "components"
        if not components_dir.exists():
            components_dir = self.frontend_root / "src" / "components"
        
        if not components_dir.exists():
            return
        
        print(f"  Scanning {components_dir.relative_to(self.project_root)}...")
        
        import_patterns = Counter()
        
        for comp_file in list(components_dir.glob("**/*.jsx"))[:20]:  # Sample 20 files
            try:
                content = comp_file.read_text(encoding='utf-8')
                
                # Find common imports
                imports = re.findall(r'from [\'"](.+?)[\'"]', content)
                for imp in imports:
                    if imp.startswith('@/') or imp.startswith('../'):
                        import_patterns[imp.split('/')[0]] += 1
                
            except:
                pass
        
        if import_patterns:
            common_imports = [imp for imp, count in import_patterns.most_common(3)]
            self.detected_patterns['frontend_imports'] = common_imports
            print(f"    Common imports: {', '.join(common_imports)}")
    
    def generate_architecture_yml(self):
        """Generate ARCHITECTURE.yml from detected patterns"""
        
        frontend_framework = "Unknown"
        if self.frontend_root:
            try:
                pkg = json.loads((self.frontend_root / "package.json").read_text(encoding='utf-8'))
                deps = {**pkg.get('dependencies', {}), **pkg.get('devDependencies', {})}
                
                if 'react' in deps:
                    frontend_framework = "React"
                    if 'vite' in deps:
                        frontend_framework += " + Vite"
                    elif 'next' in deps:
                        frontend_framework += " + Next.js"
                elif 'vue' in deps:
                    frontend_framework = "Vue"
                elif 'angular' in deps:
                    frontend_framework = "Angular"
            except:
                pass
        
        backend_framework = "Unknown"
        if self.backend_root:
            if (self.backend_root / "package.json").exists():
                backend_framework = "Node.js + Express"
            elif (self.backend_root / "requirements.txt").exists():
                backend_framework = "Python"
            elif (self.backend_root / "go.mod").exists():
                backend_framework = "Go"
        
        middleware = self.detected_patterns.get('backend_middleware', ['auth', 'validate'])
        
        content = f"""# Architectural Constraints
# Auto-generated by RAG setup - customize as needed

system_architecture:
  frontend:
    framework: {frontend_framework}
    root: {self.frontend_root.relative_to(self.project_root) if self.frontend_root else 'src'}
  
  backend:
    framework: {backend_framework}
    root: {self.backend_root.relative_to(self.project_root) if self.backend_root else 'backend'}

constraints:
  authentication:
    rules:
      - All protected routes MUST use auth middleware
      - Tokens MUST be validated on backend
      - Frontend MUST handle 401 responses
    
    anti_patterns:
      - Client-side-only authentication
      - Hardcoded credentials
  
  api_design:
    rules:
      - ALL responses MUST use consistent format
      - ALL endpoints MUST validate input
      - ALL errors MUST be logged
    
    required_middleware_stack:
{chr(10).join(f'      - {mw}' for mw in middleware)}
    
    anti_patterns:
      - Inconsistent response shapes
      - Missing error handling
      - Skipping validation
  
  database:
    rules:
      - NEVER write raw SQL in route handlers
      - ALWAYS use parameterized queries
      - ALWAYS use connection pool
      - Migrations MUST be reversible
    
    anti_patterns:
      - String concatenation in SQL
      - Direct database imports in routes
  
  security:
    rules:
      - ALL user input MUST be sanitized
      - Secrets MUST use secret management
    
    anti_patterns:
      - Trusting client input
      - Logging sensitive data
      - Hardcoded secrets

patterns:
  new_api_endpoint:
    steps:
      1. Define route in routes/
      2. Add middleware stack
      3. Implement handler
      4. Return standard response
      5. Update types

critical_files:
  never_delete:
    - # Add files that break system if deleted
  
  edit_with_extreme_care:
    - # Add fragile files
"""
        
        output_path = self.project_root / "ARCHITECTURE.yml"
        output_path.write_text(content, encoding='utf-8')
        print(f"  Created: ARCHITECTURE.yml")
    
    def generate_patterns_docs(self):
        """Generate pattern documentation from detected patterns"""
        patterns_dir = self.project_root / "docs" / "patterns"
        patterns_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate API endpoints pattern
        if self.backend_root:
            middleware = self.detected_patterns.get('backend_middleware', ['auth', 'validate'])
            response_format = self.detected_patterns.get('backend_response_format', 'success_data_error')
            
            if response_format == 'success_data_error':
                success_example = "res.json({ success: true, data: { item } });"
                error_example = "res.status(400).json({ success: false, error: 'Invalid input' });"
            else:
                success_example = "res.json({ item });"
                error_example = "res.status(400).json({ error: 'Invalid input' });"
            
            content = f"""# API Endpoint Pattern

## Standard Pattern (Detected from Your Code)

When adding a new API endpoint:

### 1. Define Route

Create in `routes/[feature].js`

### 2. Apply Middleware Stack

Your codebase uses these middleware:

```javascript
router.post('/endpoint',
{chr(10).join(f'  {mw},' for mw in middleware)}
  handler
);
```

### 3. Response Format

Based on scanning your routes, you use this pattern:

**Success:**
```javascript
{success_example}
```

**Error:**
```javascript
{error_example}
```

### 4. Example from Your Codebase

See existing routes in `routes/` for reference implementations.
"""
            
            (patterns_dir / "api-endpoints.md").write_text(content, encoding='utf-8')
            print(f"  Created: docs/patterns/api-endpoints.md")
    
    def generate_config(self):
        """Generate rag_config.py"""
        
        frontend_path = self.frontend_root if self.frontend_root else self.project_root / "src"
        backend_path = self.backend_root if self.backend_root else self.project_root / "backend"
        
        content = f"""'''RAG system configuration - auto-generated'''
from pathlib import Path

# Project paths (relative to this file's location)
RAG_ROOT = Path(__file__).parent.parent
PROJECT_ROOT = RAG_ROOT.parent
CODE_ROOT = PROJECT_ROOT / "{frontend_path.relative_to(self.project_root)}"
BACKEND_ROOT = PROJECT_ROOT / "{backend_path.relative_to(self.project_root)}"

# ChromaDB settings
CHROMA_PERSIST_DIR = str(RAG_ROOT / "collections")
COLLECTION_CODE = "codebase"
COLLECTION_CONSTRAINTS = "constraints"
COLLECTION_PATTERNS = "patterns"

# Indexing rules
INCLUDE_EXTENSIONS = [
    ".js", ".jsx", ".ts", ".tsx",
    ".py", ".md", ".yml", ".yaml", ".json"
]

EXCLUDE_DIRS = [
    "node_modules", "__pycache__", ".git",
    "dist", "build", ".vite", "coverage", ".next"
]

# Chunking strategy
CHUNK_SIZE = 500
CHUNK_OVERLAP = 50

# Query settings
DEFAULT_RESULTS = 5
MAX_RESULTS = 20

# Embedding model
EMBEDDING_MODEL = "all-MiniLM-L6-v2"

# Weight multipliers for semantic search
WEIGHTS = {{
    "ARCHITECTURE.yml": 10.0,
    "CONSTRAINTS.md": 10.0,
    "docs/patterns/": 8.0,
    "README.md": 5.0,
    "CLAUDE.md": 7.0,
    "routes/": 3.0,
    "services/": 3.0,
    "components/": 2.0,
    "lib/": 2.0,
    "*.test.js": 1.0,
    "*.config.js": 1.5,
}}
"""
        
        scripts_dir = self.project_root / "rag" / "scripts"
        scripts_dir.mkdir(parents=True, exist_ok=True)
        
        (scripts_dir / "rag_config.py").write_text(content, encoding='utf-8')
        print(f"  Created: rag/scripts/rag_config.py")

if __name__ == "__main__":
    setup = RAGSetup()
    setup.run()
