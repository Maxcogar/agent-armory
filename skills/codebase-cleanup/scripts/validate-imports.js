#!/usr/bin/env node

/**
 * Validate Imports
 * Checks that all import statements resolve to actual files
 */

const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  extensions: ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'],
  ignoreDirs: ['node_modules', '.git', 'dist', 'build', 'coverage', '.next', '.cache'],
  aliasMap: {} // Will be populated from tsconfig/jsconfig if exists
};

// Store for errors and warnings
const errors = [];
const warnings = [];
const checkedFiles = 0;

/**
 * Load path aliases from tsconfig/jsconfig
 */
function loadPathAliases(projectRoot) {
  const configs = ['tsconfig.json', 'jsconfig.json'];
  
  for (const configFile of configs) {
    const configPath = path.join(projectRoot, configFile);
    if (fs.existsSync(configPath)) {
      try {
        const content = fs.readFileSync(configPath, 'utf8');
        // Remove comments (simple approach)
        const jsonContent = content.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');
        const config = JSON.parse(jsonContent);
        
        if (config.compilerOptions && config.compilerOptions.paths) {
          const baseUrl = config.compilerOptions.baseUrl || '.';
          const basePath = path.join(projectRoot, baseUrl);
          
          Object.entries(config.compilerOptions.paths).forEach(([alias, paths]) => {
            // Convert alias pattern to regex
            const aliasPattern = alias.replace('/*', '');
            const targetPath = paths[0].replace('/*', '');
            config.aliasMap[aliasPattern] = path.join(basePath, targetPath);
          });
        }
        
        console.log(`Loaded path aliases from ${configFile}`);
        break;
      } catch (error) {
        console.warn(`Failed to load ${configFile}: ${error.message}`);
      }
    }
  }
}

/**
 * Resolve import path considering aliases
 */
function resolveImportPath(fromFile, importPath, projectRoot) {
  // Skip external packages
  if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
    // Check if it's an alias
    for (const [alias, targetPath] of Object.entries(config.aliasMap)) {
      if (importPath.startsWith(alias)) {
        const relativePath = importPath.slice(alias.length);
        const resolved = path.join(targetPath, relativePath);
        return checkFileExists(resolved);
      }
    }
    
    // It's likely an npm package, skip
    return { type: 'external' };
  }

  // Resolve relative import
  const dir = path.dirname(fromFile);
  const resolved = path.resolve(dir, importPath);
  
  return checkFileExists(resolved);
}

/**
 * Check if file exists with various extensions
 */
function checkFileExists(basePath) {
  // Try exact path
  if (fs.existsSync(basePath)) {
    const stat = fs.statSync(basePath);
    if (stat.isFile()) {
      return { type: 'found', path: basePath };
    }
    if (stat.isDirectory()) {
      // Try index files
      for (const ext of config.extensions) {
        const indexPath = path.join(basePath, `index${ext}`);
        if (fs.existsSync(indexPath)) {
          return { type: 'found', path: indexPath };
        }
      }
    }
  }

  // Try with extensions
  for (const ext of config.extensions) {
    const withExt = basePath + ext;
    if (fs.existsSync(withExt)) {
      return { type: 'found', path: withExt };
    }
  }

  return { type: 'not_found', attemptedPath: basePath };
}

/**
 * Extract imports from file content
 */
function extractImports(content, filePath) {
  const imports = [];
  
  // Regex patterns for different import styles
  const patterns = [
    // ES6 imports
    /import\s+(?:(?:\*\s+as\s+\w+)|(?:\{[^}]*\})|(?:\w+))?\s*(?:,\s*(?:\{[^}]*\}|\w+))?\s*from\s*['"]([^'"]+)['"]/g,
    // Dynamic imports
    /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    // Require statements
    /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    // Re-exports
    /export\s+(?:\*|\{[^}]*\})\s+from\s*['"]([^'"]+)['"]/g
  ];

  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const importPath = match[1];
      const line = content.substring(0, match.index).split('\n').length;
      imports.push({
        path: importPath,
        line,
        type: pattern.source.includes('require') ? 'require' : 
              pattern.source.includes('import\\s*\\(') ? 'dynamic' : 'static'
      });
    }
  });

  return imports;
}

/**
 * Validate imports in a single file
 */
function validateFile(filePath, projectRoot) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const imports = extractImports(content, filePath);
    const fileErrors = [];
    const fileWarnings = [];

    imports.forEach(imp => {
      const result = resolveImportPath(filePath, imp.path, projectRoot);
      
      if (result.type === 'not_found') {
        fileErrors.push({
          file: path.relative(projectRoot, filePath),
          line: imp.line,
          import: imp.path,
          type: imp.type,
          error: 'Cannot resolve import'
        });
      } else if (result.type === 'found' && imp.type === 'dynamic') {
        fileWarnings.push({
          file: path.relative(projectRoot, filePath),
          line: imp.line,
          import: imp.path,
          warning: 'Dynamic import - may fail at runtime'
        });
      }
    });

    if (fileErrors.length > 0) {
      errors.push(...fileErrors);
    }
    if (fileWarnings.length > 0) {
      warnings.push(...fileWarnings);
    }

  } catch (error) {
    warnings.push({
      file: path.relative(projectRoot, filePath),
      warning: `Failed to parse file: ${error.message}`
    });
  }
}

/**
 * Walk directory recursively
 */
function walkDirectory(dir, projectRoot, callback) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!config.ignoreDirs.includes(file) && !file.startsWith('.')) {
        walkDirectory(filePath, projectRoot, callback);
      }
    } else if (stat.isFile()) {
      const ext = path.extname(file);
      
      if (config.extensions.includes(ext)) {
        callback(filePath, projectRoot);
        checkedFiles++;
      }
    }
  });
}

/**
 * Generate summary statistics
 */
function generateSummary() {
  const errorsByFile = {};
  errors.forEach(err => {
    if (!errorsByFile[err.file]) {
      errorsByFile[err.file] = 0;
    }
    errorsByFile[err.file]++;
  });

  return {
    totalFilesChecked: checkedFiles,
    totalErrors: errors.length,
    totalWarnings: warnings.length,
    filesWithErrors: Object.keys(errorsByFile).length,
    mostErrors: Object.entries(errorsByFile)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([file, count]) => ({ file, errorCount: count }))
  };
}

/**
 * Main execution
 */
function main() {
  const projectRoot = process.argv[2] || '.';
  const outputFormat = process.argv[3] || 'json';
  
  console.log(`Validating imports in: ${path.resolve(projectRoot)}\n`);
  
  // Load path aliases
  loadPathAliases(projectRoot);
  
  // Validate all files
  walkDirectory(projectRoot, projectRoot, validateFile);
  
  // Generate report
  const report = {
    summary: generateSummary(),
    errors: errors.sort((a, b) => a.file.localeCompare(b.file)),
    warnings: warnings.sort((a, b) => a.file.localeCompare(b.file)),
    pathAliases: Object.keys(config.aliasMap).length > 0 ? config.aliasMap : null,
    timestamp: new Date().toISOString()
  };

  // Output report
  if (outputFormat === 'json') {
    console.log(JSON.stringify(report, null, 2));
  } else {
    // Human-readable format
    console.log('=== Import Validation Report ===\n');
    console.log(`Files Checked: ${report.summary.totalFilesChecked}`);
    console.log(`Errors Found: ${report.summary.totalErrors}`);
    console.log(`Warnings: ${report.summary.totalWarnings}\n`);
    
    if (report.errors.length > 0) {
      console.log('=== Errors ===');
      report.errors.forEach(err => {
        console.log(`${err.file}:${err.line} - Cannot resolve '${err.import}'`);
      });
      console.log('');
    }
    
    if (report.warnings.length > 0) {
      console.log('=== Warnings ===');
      report.warnings.forEach(warn => {
        console.log(`${warn.file}:${warn.line || ''} - ${warn.warning}`);
      });
    }
    
    if (report.errors.length === 0 && report.warnings.length === 0) {
      console.log('✅ All imports are valid!');
    }
  }
  
  // Exit with error code if there are errors
  process.exit(errors.length > 0 ? 1 : 0);
}

// Run the script
main();
