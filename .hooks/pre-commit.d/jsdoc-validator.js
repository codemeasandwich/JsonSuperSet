#!/usr/bin/env node
/**
 * @fileoverview JSDoc Validator Entry Point
 *
 * Main entry point for the JSDoc validation system. Scans all JavaScript
 * files in the project and validates their JSDoc documentation.
 *
 * Validates:
 * - @fileoverview comment at top of each file
 * - JSDoc comment for each function with description, @param, @returns
 *
 * @module hooks/jsdoc-validator
 */

const fs = require("fs");
const path = require("path");
const { checkFileOverview } = require("./jsdoc/fileCheck");
const { checkFunctions } = require("./jsdoc/functionCheck");

/**
 * Recursively find all JavaScript files in a directory
 *
 * @param {string} dir - Directory to search
 * @param {string[]} exclude - Patterns to exclude
 * @returns {string[]} Array of file paths
 */
function findJsFiles(dir, exclude = []) {
  const files = [];

  /**
   * Check if path should be excluded
   *
   * @param {string} p - Path to check
   * @returns {boolean} True if should be excluded
   * @private
   */
  function shouldExclude(p) {
    return exclude.some((pattern) => p.includes(pattern));
  }

  /**
   * Recursively scan directory
   *
   * @param {string} currentDir - Current directory
   * @private
   */
  function scan(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      const relativePath = path.relative(dir, fullPath);

      if (shouldExclude(relativePath) || shouldExclude(entry.name)) {
        continue;
      }

      if (entry.isDirectory()) {
        scan(fullPath);
      } else if (entry.isFile() && entry.name.endsWith(".js") && !entry.name.endsWith(".test.js")) {
        files.push(fullPath);
      }
    }
  }

  scan(dir);
  return files;
}

/**
 * Validate a single JavaScript file
 *
 * @param {string} filePath - Path to the file
 * @param {string} rootDir - Root directory for relative paths
 * @returns {{valid: boolean, errors: string[]}} Validation result
 */
function validateFile(filePath, rootDir) {
  const errors = [];
  const relativePath = path.relative(rootDir, filePath);

  let code;
  try {
    code = fs.readFileSync(filePath, "utf8");
  } catch (err) {
    return { valid: false, errors: [`${relativePath}: Could not read file`] };
  }

  // Check @fileoverview
  const fileCheck = checkFileOverview(code, relativePath);
  if (!fileCheck.valid) {
    errors.push(fileCheck.error);
  }

  // Check function JSDoc
  const funcCheck = checkFunctions(code, relativePath);
  errors.push(...funcCheck.errors);

  return {
    valid: errors.length === 0,
    errors,
  };
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

  // Excluded directories
  const exclude = [
    "node_modules",
    ".git",
    ".hooks",
    "coverage",
    ".claude",
    "dist",
    "scripts",
  ];

  console.log("    Validating JSDoc comments...");

  const files = findJsFiles(projectRoot, exclude);
  const allErrors = [];

  for (const file of files) {
    const result = validateFile(file, projectRoot);
    allErrors.push(...result.errors);
  }

  if (allErrors.length > 0) {
    console.log("");
    console.log("    JSDoc validation errors:");
    console.log("");
    for (const error of allErrors) {
      console.log(`      - ${error}`);
    }
    console.log("");
    console.log(`    Found ${allErrors.length} JSDoc error(s) in ${files.length} file(s)`);
    return 1;
  }

  console.log(`    Validated ${files.length} file(s) - all have proper JSDoc`);
  return 0;
}

// Run if executed directly
if (require.main === module) {
  process.exit(main());
}

module.exports = { validateFile, findJsFiles, main };
