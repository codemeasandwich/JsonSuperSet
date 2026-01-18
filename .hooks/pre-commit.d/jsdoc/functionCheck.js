/**
 * @fileoverview Function-level JSDoc validation
 *
 * Validates that all functions in a JavaScript file have proper JSDoc
 * documentation including:
 * - A description
 * - @param tags for each parameter
 * - @returns tag (unless void/undefined)
 *
 * @module hooks/jsdoc/functionCheck
 */

const { findFunctions } = require("./functions");
const {
  extractJSDocComments,
  parseJSDocComment,
  extractParams,
  hasReturns,
  hasDescription,
} = require("./parsers");

/**
 * Check if a function has a JSDoc comment immediately before it
 *
 * @param {Array<{comment: string, start: number, end: number}>} comments - All JSDoc comments
 * @param {number} funcStart - Start position of the function
 * @param {string} code - The source code
 * @returns {{found: boolean, comment: {comment: string, start: number, end: number}|null}} Result
 * @private
 */
function findPrecedingJSDoc(comments, funcStart, code) {
  // Look for a JSDoc comment that ends right before the function
  // Allow for whitespace, export keyword, async keyword between comment and function

  for (let i = comments.length - 1; i >= 0; i--) {
    const comment = comments[i];

    if (comment.end > funcStart) continue;

    // Check what's between the comment and the function
    const between = code.substring(comment.end, funcStart).trim();

    // Allow: empty, 'export', 'async', 'export async', 'export default', etc.
    const allowedBetween = /^(export\s+)?(default\s+)?(async\s+)?(function\s+)?$/;

    if (between === "" || allowedBetween.test(between) || between.match(/^(const|let|var)\s+\w+\s*=\s*(async\s*)?$/)) {
      return { found: true, comment };
    }

    // If there's too much between, this comment isn't for this function
    if (comment.end < funcStart - 500) {
      break;
    }
  }

  return { found: false, comment: null };
}

/**
 * Validate JSDoc for all functions in a file
 *
 * Checks each function for:
 * - Presence of JSDoc comment
 * - Description in the JSDoc
 * - @param tag for each parameter
 * - @returns tag
 *
 * @param {string} code - The source code string
 * @param {string} filename - The filename for error messages
 * @returns {{valid: boolean, errors: string[]}} Validation result
 *
 * @example
 * checkFunctions('function foo(a) { return a; }', 'bar.js')
 * // Returns { valid: false, errors: ['bar.js:1 foo(): Missing JSDoc comment'] }
 */
function checkFunctions(code, filename) {
  const errors = [];
  const functions = findFunctions(code);
  const comments = extractJSDocComments(code);

  for (const func of functions) {
    const { name, params, line } = func;
    const location = `${filename}:${line}`;

    // Skip internal/private functions (starting with _)
    if (name.startsWith("_")) {
      continue;
    }

    // Find the JSDoc comment for this function
    const { found, comment } = findPrecedingJSDoc(comments, func.start, code);

    if (!found) {
      errors.push(`${location} ${name}(): Missing JSDoc comment`);
      continue;
    }

    // Parse the JSDoc comment
    const parsed = parseJSDocComment(comment.comment);

    // Check for description
    if (!hasDescription(parsed.description)) {
      // Check if @function or @description tag provides it
      const hasDescTag = parsed.tags.some(
        (t) => t.tag === "description" || (t.tag === "function" && t.description)
      );
      if (!hasDescTag) {
        errors.push(`${location} ${name}(): Missing description in JSDoc`);
      }
    }

    // Check for @param tags
    const docParams = extractParams(parsed.tags);
    const docParamNames = docParams.map((p) => p.name);

    for (const param of params) {
      // Skip destructured params (they start with { or [)
      if (param.startsWith("{") || param.startsWith("[")) {
        continue;
      }

      if (!docParamNames.includes(param)) {
        errors.push(`${location} ${name}(): Missing @param for '${param}'`);
      }
    }

    // Check for @returns (skip if function is a setter or constructor-like)
    if (!hasReturns(parsed.tags)) {
      // Skip constructor functions, setters, and void functions
      const isConstructor = name[0] === name[0].toUpperCase() && /^[A-Z]/.test(name);
      const isSetter = name.startsWith("set") && name.length > 3 && name[3] === name[3].toUpperCase();

      // Check if @private tag indicates internal function
      const isPrivate = parsed.tags.some((t) => t.tag === "private");

      if (!isConstructor && !isSetter && !isPrivate) {
        // Check the function body for return statements
        const funcBody = code.substring(func.start, func.end);
        const hasReturnStatement = /\breturn\s+[^;]/.test(funcBody);

        if (hasReturnStatement) {
          errors.push(`${location} ${name}(): Missing @returns tag`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

module.exports = { checkFunctions };
