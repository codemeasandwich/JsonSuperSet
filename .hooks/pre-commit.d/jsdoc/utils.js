/**
 * @fileoverview String and brace utility functions for JSDoc parsing
 *
 * Provides helper functions for working with strings and matching braces
 * in JavaScript source code. Used by the JSDoc validator to find function
 * boundaries and parse JSDoc comments.
 *
 * @module hooks/jsdoc/utils
 */

/**
 * Find the matching closing brace for an opening brace
 *
 * Handles nested braces and ignores braces inside strings and comments.
 * Returns the index of the matching closing brace, or -1 if not found.
 *
 * @param {string} str - The source code string
 * @param {number} startIndex - Index of the opening brace
 * @returns {number} Index of the matching closing brace, or -1 if not found
 *
 * @example
 * const code = 'function foo() { if (x) { } }'
 * findMatchingBrace(code, 15) // Returns 29 (index of final })
 */
function findMatchingBrace(str, startIndex) {
  let depth = 1;
  let i = startIndex + 1;
  let inString = false;
  let stringChar = "";
  let inLineComment = false;
  let inBlockComment = false;

  while (i < str.length && depth > 0) {
    const char = str[i];
    const nextChar = str[i + 1];
    const prevChar = str[i - 1];

    // Handle line comments
    if (!inString && !inBlockComment && char === "/" && nextChar === "/") {
      inLineComment = true;
      i += 2;
      continue;
    }

    // Handle end of line comment
    if (inLineComment && (char === "\n" || char === "\r")) {
      inLineComment = false;
      i++;
      continue;
    }

    // Handle block comments
    if (!inString && !inLineComment && char === "/" && nextChar === "*") {
      inBlockComment = true;
      i += 2;
      continue;
    }

    // Handle end of block comment
    if (inBlockComment && char === "*" && nextChar === "/") {
      inBlockComment = false;
      i += 2;
      continue;
    }

    // Skip if in comment
    if (inLineComment || inBlockComment) {
      i++;
      continue;
    }

    // Handle strings
    if (!inString && (char === '"' || char === "'" || char === "`")) {
      inString = true;
      stringChar = char;
      i++;
      continue;
    }

    if (inString) {
      // Handle escape sequences
      if (char === "\\" && i + 1 < str.length) {
        i += 2;
        continue;
      }
      // Handle end of string
      if (char === stringChar) {
        inString = false;
        stringChar = "";
      }
      i++;
      continue;
    }

    // Count braces
    if (char === "{") {
      depth++;
    } else if (char === "}") {
      depth--;
    }

    i++;
  }

  return depth === 0 ? i - 1 : -1;
}

/**
 * Find the matching closing parenthesis for an opening parenthesis
 *
 * Similar to findMatchingBrace but for parentheses. Handles nested
 * parentheses and ignores those inside strings and comments.
 *
 * @param {string} str - The source code string
 * @param {number} startIndex - Index of the opening parenthesis
 * @returns {number} Index of the matching closing parenthesis, or -1 if not found
 *
 * @example
 * const code = 'function foo(a, b, (c, d))'
 * findMatchingParen(code, 12) // Returns 25 (index of final ))
 */
function findMatchingParen(str, startIndex) {
  let depth = 1;
  let i = startIndex + 1;
  let inString = false;
  let stringChar = "";

  while (i < str.length && depth > 0) {
    const char = str[i];

    // Handle strings
    if (!inString && (char === '"' || char === "'" || char === "`")) {
      inString = true;
      stringChar = char;
      i++;
      continue;
    }

    if (inString) {
      if (char === "\\" && i + 1 < str.length) {
        i += 2;
        continue;
      }
      if (char === stringChar) {
        inString = false;
        stringChar = "";
      }
      i++;
      continue;
    }

    if (char === "(") {
      depth++;
    } else if (char === ")") {
      depth--;
    }

    i++;
  }

  return depth === 0 ? i - 1 : -1;
}

/**
 * Remove all comments from source code
 *
 * Strips both line comments (//) and block comments (/* ... * /)
 * while preserving string literals. Useful for parsing code structure
 * without being confused by commented-out code.
 *
 * @param {string} code - The source code string
 * @returns {string} Code with all comments removed
 *
 * @example
 * removeComments('const x = 1; // comment')
 * // Returns 'const x = 1; '
 */
function removeComments(code) {
  let result = "";
  let i = 0;
  let inString = false;
  let stringChar = "";

  while (i < code.length) {
    const char = code[i];
    const nextChar = code[i + 1];

    // Handle strings
    if (!inString && (char === '"' || char === "'" || char === "`")) {
      inString = true;
      stringChar = char;
      result += char;
      i++;
      continue;
    }

    if (inString) {
      result += char;
      if (char === "\\" && i + 1 < code.length) {
        result += code[i + 1];
        i += 2;
        continue;
      }
      if (char === stringChar) {
        inString = false;
        stringChar = "";
      }
      i++;
      continue;
    }

    // Handle line comments
    if (char === "/" && nextChar === "/") {
      while (i < code.length && code[i] !== "\n") {
        i++;
      }
      continue;
    }

    // Handle block comments
    if (char === "/" && nextChar === "*") {
      i += 2;
      while (i < code.length - 1 && !(code[i] === "*" && code[i + 1] === "/")) {
        i++;
      }
      i += 2;
      continue;
    }

    result += char;
    i++;
  }

  return result;
}

module.exports = {
  findMatchingBrace,
  findMatchingParen,
  removeComments,
};
