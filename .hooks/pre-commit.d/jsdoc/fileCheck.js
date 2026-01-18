/**
 * @fileoverview File-level JSDoc validation
 *
 * Validates that JavaScript files have a @fileoverview JSDoc comment
 * at the top of the file. This ensures every file has documentation
 * explaining its purpose.
 *
 * @module hooks/jsdoc/fileCheck
 */

const { extractJSDocComments, hasFileOverview } = require("./parsers");

/**
 * Check if a file has a valid @fileoverview comment
 *
 * The @fileoverview comment must appear at the top of the file,
 * before any code (shebang lines are allowed before it).
 *
 * @param {string} code - The source code string
 * @param {string} filename - The filename for error messages
 * @returns {{valid: boolean, error: string|null}} Validation result
 *
 * @example
 * checkFileOverview('/** @fileoverview Desc * / const x = 1;', 'foo.js')
 * // Returns { valid: true, error: null }
 *
 * @example
 * checkFileOverview('const x = 1;', 'foo.js')
 * // Returns { valid: false, error: 'foo.js: Missing @fileoverview comment' }
 */
function checkFileOverview(code, filename) {
  const comments = extractJSDocComments(code);

  if (comments.length === 0) {
    return {
      valid: false,
      error: `${filename}: Missing @fileoverview JSDoc comment at top of file`,
    };
  }

  // Check if the first JSDoc comment has @fileoverview
  // Allow for shebang and whitespace before it
  const firstComment = comments[0];
  const beforeComment = code.substring(0, firstComment.start).trim();

  // Only allow shebang or nothing before the @fileoverview
  const validBefore =
    beforeComment === "" ||
    beforeComment.startsWith("#!") ||
    beforeComment.match(/^#![^\n]*\n?\s*$/);

  if (!validBefore) {
    // Check if any JSDoc comment has @fileoverview
    const hasAny = comments.some((c) => hasFileOverview(c.comment));
    if (!hasAny) {
      return {
        valid: false,
        error: `${filename}: Missing @fileoverview JSDoc comment`,
      };
    }
    return {
      valid: false,
      error: `${filename}: @fileoverview comment should be at the top of the file`,
    };
  }

  if (!hasFileOverview(firstComment.comment)) {
    // Maybe it's in a later comment
    const hasLater = comments.slice(1).some((c) => hasFileOverview(c.comment));
    if (hasLater) {
      return {
        valid: false,
        error: `${filename}: @fileoverview comment should be at the top of the file`,
      };
    }
    return {
      valid: false,
      error: `${filename}: First JSDoc comment should contain @fileoverview`,
    };
  }

  return { valid: true, error: null };
}

module.exports = { checkFileOverview };
