#!/usr/bin/env node

/**
 * Find Unused Exports
 * Identifies exported functions, classes, and variables that are never imported
 */

const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

// Configuration
const config = {
  extensions: ['.js', '.jsx', '.ts', '.tsx'],
  ignoreDirs: ['node_modules', '.git', 'dist', 'build', 'coverage', '.next', '.cache'],
  ignorePatterns: [/\.test\.(js|jsx|ts|tsx)$/, /\.spec\.(js|jsx|ts|tsx)$/, /\.stories\.(js|jsx|ts|tsx)$/]
};

// Store for exports and imports
const exports = new Map(); // Map<filePath, Set<exportName>>
const imports = new Map(); // Map<exportName, Set<importingFile>>
const dynamicImports = new Set(); // Files with dynamic imports

/**
 * Parse a JavaScript/TypeScript file
 */
function parseFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    const ast = parser.parse(content, {
      sourceType: 'module',
      plugins: [
        'jsx',
        'typescript',
        'decorators-legacy',
        'dynamicImport',
        'classProperties',
        'optionalChaining',
        'nullishCoalescingOperator'
      ]
    });

    const fileExports = new Set();
    const fileImports = new Map();

    traverse(ast, {
      // Handle named exports
      ExportNamedDeclaration(nodePath) {
        if (nodePath.node.declaration) {
          // export const foo = 'bar'
          if (nodePath.node.declaration.declarations) {
            nodePath.node.declaration.declarations.forEach(dec => {
              if (dec.id.name) {
                fileExports.add(dec.id.name);
              }
            });
          }
          // export function foo() {}
          if (nodePath.node.declaration.id) {
            fileExports.add(nodePath.node.declaration.id.name);
          }
        }
        // export { foo, bar }
        if (nodePath.node.specifiers) {
          nodePath.node.specifiers.forEach(spec => {
            fileExports.add(spec.exported.name);
          });
        }
      },

      // Handle default exports
      ExportDefaultDeclaration(nodePath) {
        fileExports.add('default');
      },

      // Handle export all
      ExportAllDeclaration(nodePath) {
        // export * from './other'
        // This is complex to track, mark file as having dynamic exports
        fileExports.add('*');
      },

      // Handle imports
      ImportDeclaration(nodePath) {
        const source = nodePath.node.source.value;
        
        nodePath.node.specifiers.forEach(spec => {
          if (spec.type === 'ImportDefaultSpecifier') {
            addImport('default', source);
          } else if (spec.type === 'ImportSpecifier') {
            addImport(spec.imported.name, source);
          } else if (spec.type === 'ImportNamespaceSpecifier') {
            addImport('*', source);
          }
        });
      },

      // Handle dynamic imports
      CallExpression(nodePath) {
        if (nodePath.node.callee.type === 'Import') {
          dynamicImports.add(filePath);
        }
      }
    });

    function addImport(name, source) {
      if (!fileImports.has(source)) {
        fileImports.set(source, new Set());
      }
      fileImports.get(source).add(name);
    }

    // Store exports
    if (fileExports.size > 0) {
      exports.set(filePath, fileExports);
    }

    // Process imports
    fileImports.forEach((importedNames, source) => {
      const resolvedPath = resolveImportPath(filePath, source);
      if (resolvedPath) {
        importedNames.forEach(name => {
          if (!imports.has(name)) {
            imports.set(name, new Set());
          }
          imports.get(name).add(resolvedPath);
        });
      }
    });

  } catch (error) {
    console.error(`Error parsing ${filePath}: ${error.message}`);
  }
}

/**
 * Resolve import path to actual file
 */
function resolveImportPath(fromFile, importPath) {
  // Skip node_modules imports
  if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
    return null;
  }

  const dir = path.dirname(fromFile);
  let resolved = path.resolve(dir, importPath);

  // Try with different extensions
  if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
    return resolved;
  }

  for (const ext of config.extensions) {
    const withExt = resolved + ext;
    if (fs.existsSync(withExt)) {
      return withExt;
    }
  }

  // Try index file
  for (const ext of config.extensions) {
    const indexFile = path.join(resolved, `index${ext}`);
    if (fs.existsSync(indexFile)) {
      return indexFile;
    }
  }

  return null;
}

/**
 * Walk directory recursively
 */
function walkDirectory(dir, callback) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!config.ignoreDirs.includes(file)) {
        walkDirectory(filePath, callback);
      }
    } else if (stat.isFile()) {
      const ext = path.extname(file);
      const shouldIgnore = config.ignorePatterns.some(pattern => pattern.test(file));
      
      if (config.extensions.includes(ext) && !shouldIgnore) {
        callback(filePath);
      }
    }
  });
}

/**
 * Find unused exports
 */
function findUnusedExports() {
  const unused = [];

  exports.forEach((exportNames, filePath) => {
    const unusedInFile = [];

    exportNames.forEach(exportName => {
      // Skip if it's a wildcard export
      if (exportName === '*') return;

      // Check if this export is imported anywhere
      const importers = imports.get(exportName) || new Set();
      const isImported = Array.from(importers).some(importer => {
        // Check if the import actually refers to this file
        return importer === filePath || importer.includes(path.basename(filePath, path.extname(filePath)));
      });

      if (!isImported) {
        unusedInFile.push(exportName);
      }
    });

    if (unusedInFile.length > 0) {
      unused.push({
        file: filePath,
        exports: unusedInFile,
        hasDynamicImports: dynamicImports.has(filePath)
      });
    }
  });

  return unused;
}

/**
 * Main execution
 */
function main() {
  const projectRoot = process.argv[2] || '.';
  
  console.log(`Analyzing project at: ${path.resolve(projectRoot)}`);
  console.log('Finding all exports and imports...\n');

  // Parse all files
  walkDirectory(projectRoot, parseFile);

  // Find unused exports
  const unusedExports = findUnusedExports();

  // Generate report
  const report = {
    summary: {
      totalFiles: exports.size,
      filesWithUnusedExports: unusedExports.length,
      totalExports: Array.from(exports.values()).reduce((sum, set) => sum + set.size, 0),
      totalUnusedExports: unusedExports.reduce((sum, file) => sum + file.exports.length, 0),
      filesWithDynamicImports: dynamicImports.size
    },
    unusedExports: unusedExports.map(item => ({
      file: path.relative(projectRoot, item.file),
      unusedExports: item.exports,
      warning: item.hasDynamicImports ? 'File has dynamic imports - manual verification needed' : null
    })),
    warnings: []
  };

  // Add warnings
  if (dynamicImports.size > 0) {
    report.warnings.push(`Found ${dynamicImports.size} files with dynamic imports. These may use exports that appear unused.`);
  }

  // Output report
  console.log(JSON.stringify(report, null, 2));
}

// Check if required dependencies are installed
try {
  require('@babel/parser');
  require('@babel/traverse');
} catch (error) {
  console.error('Missing required dependencies. Please install:');
  console.error('npm install --save-dev @babel/parser @babel/traverse');
  process.exit(1);
}

// Run the script
main();
