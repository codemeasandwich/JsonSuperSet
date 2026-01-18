/**
 * @fileoverview JSDoc comment parsing utilities
 *
 * Provides functions to extract and parse JSDoc comments from JavaScript
 * source code. Handles multi-line comments, tag extraction, and parameter
 * parsing.
 *
 * @module hooks/jsdoc/parsers
 */

/**
 * Extract all JSDoc comments from source code
 *
 * Finds all /** ... * / style comments and returns them with their
 * positions in the source. Ignores regular block comments (/* ... * /).
 *
 * @param {string} code - The source code string
 * @returns {Array<{comment: string, start: number, end: number}>} Array of JSDoc comments with positions
 *
 * @example
 * extractJSDocComments('/** Description * / function foo() {}')
 * // Returns [{ comment: '/** Description * /', start: 0, end: 18 }]
 */
function extractJSDocComments(code) {
  const comments = [];
  const regex = /\/\*\*[\s\S]*?\*\//g;
  let match;

  while ((match = regex.exec(code)) !== null) {
    comments.push({
      comment: match[0],
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  return comments;
}

/**
 * Parse a JSDoc comment into its components
 *
 * Extracts the description and all tags from a JSDoc comment.
 * Tags are returned as an array of { tag, type, name, description } objects.
 *
 * @param {string} comment - The JSDoc comment string (including delimiters)
 * @returns {{description: string, tags: Array<{tag: string, type: string, name: string, description: string}>}} Parsed comment
 *
 * @example
 * parseJSDocComment('/** Brief desc @param {string} name - The name * /')
 * // Returns {
 * //   description: 'Brief desc',
 * //   tags: [{ tag: 'param', type: 'string', name: 'name', description: 'The name' }]
 * // }
 */
function parseJSDocComment(comment) {
  // Remove /** and */ and clean up asterisks
  let content = comment
    .replace(/^\/\*\*\s*/, "")
    .replace(/\s*\*\/$/, "")
    .split("\n")
    .map((line) => line.replace(/^\s*\*\s?/, ""))
    .join("\n")
    .trim();

  const tags = [];
  let description = "";

  // Split by @tags
  const tagRegex = /@(\w+)(?:\s+\{([^}]*)\})?\s*(\S+)?\s*([\s\S]*?)(?=@\w+|$)/g;
  let match;

  // Find where tags start
  const firstTagIndex = content.search(/@\w+/);

  if (firstTagIndex > 0) {
    description = content.substring(0, firstTagIndex).trim();
    content = content.substring(firstTagIndex);
  } else if (firstTagIndex === -1) {
    description = content;
    content = "";
  }

  while ((match = tagRegex.exec(content)) !== null) {
    const [, tag, type, name, desc] = match;
    tags.push({
      tag: tag.toLowerCase(),
      type: type ? type.trim() : "",
      name: name ? name.replace(/^-\s*/, "").trim() : "",
      description: desc ? desc.trim() : "",
    });
  }

  return { description, tags };
}

/**
 * Check if a JSDoc comment has a @fileoverview tag
 *
 * @param {string} comment - The JSDoc comment string
 * @returns {boolean} True if the comment has @fileoverview
 *
 * @example
 * hasFileOverview('/** @fileoverview Description * /')
 * // Returns true
 */
function hasFileOverview(comment) {
  return /@fileoverview/i.test(comment);
}

/**
 * Extract @param tags from a parsed JSDoc
 *
 * @param {Array<{tag: string, type: string, name: string, description: string}>} tags - Parsed tags
 * @returns {Array<{name: string, type: string, description: string}>} Array of parameter info
 *
 * @example
 * extractParams([{ tag: 'param', type: 'string', name: 'foo', description: 'Foo param' }])
 * // Returns [{ name: 'foo', type: 'string', description: 'Foo param' }]
 */
function extractParams(tags) {
  return tags
    .filter((t) => t.tag === "param")
    .map((t) => ({
      name: t.name.replace(/^\[|\]$/g, "").split("=")[0], // Handle optional params [name] and defaults [name=value]
      type: t.type,
      description: t.description,
    }));
}

/**
 * Check if parsed JSDoc has a @returns or @return tag
 *
 * @param {Array<{tag: string, type: string, name: string, description: string}>} tags - Parsed tags
 * @returns {boolean} True if has return documentation
 *
 * @example
 * hasReturns([{ tag: 'returns', type: 'string', name: '', description: 'The result' }])
 * // Returns true
 */
function hasReturns(tags) {
  return tags.some((t) => t.tag === "returns" || t.tag === "return");
}

/**
 * Check if parsed JSDoc has a description
 *
 * @param {string} description - The description from parsed JSDoc
 * @returns {boolean} True if has non-empty description
 *
 * @example
 * hasDescription('This function does something')
 * // Returns true
 */
function hasDescription(description) {
  return description.trim().length > 0;
}

module.exports = {
  extractJSDocComments,
  parseJSDocComment,
  hasFileOverview,
  extractParams,
  hasReturns,
  hasDescription,
};
