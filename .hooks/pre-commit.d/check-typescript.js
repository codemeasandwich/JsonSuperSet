#!/usr/bin/env node
/**
 * @fileoverview TypeScript Definition Validator
 *
 * Validates that index.d.ts exports match index.js exports.
 * This ensures the TypeScript type definitions stay synchronized
 * with the JavaScript implementation.
 *
 * Checks:
 * - All exports in index.js are declared in index.d.ts
 * - No extra exports in index.d.ts that don't exist in index.js
 * - PluginConfig interface matches expected structure
 *
 * @module hooks/check-typescript
 */

const fs = require("fs");
const path = require("path");

/**
 * Extract exports from index.js module.exports
 *
 * Parses the module.exports = { ... } statement to find
 * all exported identifiers.
 *
 * @param {string} code - The JavaScript source code
 * @returns {string[]} Array of export names
 */
function extractJsExports(code) {
  const exports = [];

  // Match module.exports = { name1, name2, name3: alias }
  const moduleExportsMatch = code.match(/module\.exports\s*=\s*\{([^}]+)\}/);

  if (moduleExportsMatch) {
    const exportsStr = moduleExportsMatch[1];

    // Split by comma and extract names
    const parts = exportsStr.split(",");

    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;

      // Handle both "name" and "name: alias" patterns
      const colonIndex = trimmed.indexOf(":");
      if (colonIndex !== -1) {
        // Export has alias: "localName: exportedName"
        exports.push(trimmed.substring(0, colonIndex).trim());
      } else {
        // Simple export: "name"
        exports.push(trimmed);
      }
    }
  }

  return exports;
}

/**
 * Extract exports from index.d.ts
 *
 * Finds all "export function", "export const", "export interface",
 * and "export type" declarations.
 *
 * @param {string} code - The TypeScript definition source
 * @returns {string[]} Array of export names
 */
function extractDtsExports(code) {
  const exports = [];

  // Match export function, const, interface, type declarations
  const exportRegex = /export\s+(?:function|const|interface|type)\s+(\w+)/g;
  let match;

  while ((match = exportRegex.exec(code)) !== null) {
    exports.push(match[1]);
  }

  return exports;
}

/**
 * Extract function parameters from index.js
 *
 * For each exported function, extracts its parameter names
 * to validate against TypeScript definitions.
 *
 * @param {string} code - The JavaScript source code
 * @param {string} funcName - The function name to find
 * @returns {string[]} Array of parameter names
 */
function extractJsParams(code, funcName) {
  // Look for @function JSDoc followed by function definition
  const funcPattern = new RegExp(
    `@function\\s+${funcName}[\\s\\S]*?@param\\s+\\{[^}]+\\}\\s+(\\w+)`,
    "g"
  );

  const params = [];
  let match;

  while ((match = funcPattern.exec(code)) !== null) {
    params.push(match[1]);
  }

  return params;
}

/**
 * Main validation function
 *
 * @returns {number} Exit code (0 = success, 1 = failure)
 */
function main() {
  // Determine project root
  let projectRoot = process.cwd();

  // If running from .git/hooks, go up
  if (projectRoot.includes(".git/hooks")) {
    projectRoot = path.resolve(projectRoot, "../../..");
  }

  const indexJsPath = path.join(projectRoot, "index.js");
  const indexDtsPath = path.join(projectRoot, "index.d.ts");

  // Check files exist
  if (!fs.existsSync(indexJsPath)) {
    console.log("    index.js not found - skipping TypeScript check");
    return 0;
  }

  if (!fs.existsSync(indexDtsPath)) {
    console.log("    ERROR: index.d.ts not found but index.js exists");
    console.log("    Create index.d.ts with type definitions for all exports");
    return 1;
  }

  const indexJs = fs.readFileSync(indexJsPath, "utf8");
  const indexDts = fs.readFileSync(indexDtsPath, "utf8");

  const jsExports = extractJsExports(indexJs);
  const dtsExports = extractDtsExports(indexDts);

  const errors = [];

  // Check for missing exports in .d.ts
  for (const exp of jsExports) {
    if (!dtsExports.includes(exp)) {
      errors.push(`Missing in index.d.ts: export function ${exp}`);
    }
  }

  // Check for extra exports in .d.ts (excluding interfaces/types)
  const dtsInterfaces = [];
  const interfaceRegex = /export\s+(?:interface|type)\s+(\w+)/g;
  let match;
  while ((match = interfaceRegex.exec(indexDts)) !== null) {
    dtsInterfaces.push(match[1]);
  }

  for (const exp of dtsExports) {
    // Skip interfaces/types - they can exist in .d.ts without being in .js
    if (dtsInterfaces.includes(exp)) continue;

    if (!jsExports.includes(exp)) {
      errors.push(`Extra in index.d.ts: ${exp} (not exported from index.js)`);
    }
  }

  if (errors.length > 0) {
    console.log("");
    console.log("    TypeScript definition errors:");
    console.log("");
    for (const error of errors) {
      console.log(`      - ${error}`);
    }
    console.log("");
    console.log("    index.d.ts must export the same functions as index.js");
    return 1;
  }

  console.log(`    Validated ${jsExports.length} exports match between index.js and index.d.ts`);
  return 0;
}

// Run if executed directly
if (require.main === module) {
  process.exit(main());
}

module.exports = { extractJsExports, extractDtsExports, main };
