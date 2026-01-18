/**
 * @fileoverview Yoda Condition Checker
 *
 * Detects non-Yoda comparisons where literals are on the right side
 * of equality operators instead of the left side.
 *
 * Yoda conditions place literals on the left:
 * - WRONG: `if (x === "foo")`
 * - CORRECT: `if ("foo" === x)`
 *
 * @module hooks/yoda/checker
 */

const { removeComments } = require("../jsdoc/utils");

/**
 * Literal pattern for matching string, number, boolean, null, undefined
 *
 * @constant {string}
 * @private
 */
const LITERAL_PATTERN = '(?:"(?:[^"\\\\]|\\\\.)*"|\'(?:[^\'\\\\]|\\\\.)*\'|-?\\d+(?:\\.\\d+)?|true|false|null|undefined)';

/**
 * Comparison operators to check
 *
 * @constant {string}
 * @private
 */
const OPERATOR_PATTERN = "===|!==|==|!=";

/**
 * Build an index of line start positions
 *
 * @param {string} code - Source code
 * @returns {number[]} Array where index i contains the character position where line i+1 starts
 * @private
 */
function buildLineIndex(code) {
    const lineStarts = [0];
    for (let i = 0; i < code.length; i++) {
        if ("\n" === code[i]) {
            lineStarts.push(i + 1);
        }
    }
    return lineStarts;
}

/**
 * Get line number for a character position
 *
 * @param {number[]} lineStarts - Array of line start positions
 * @param {number} position - Character position in the code
 * @returns {number} Line number (1-indexed)
 * @private
 */
function getLineNumber(lineStarts, position) {
    for (let i = lineStarts.length - 1; i >= 0; i--) {
        if (position >= lineStarts[i]) {
            return i + 1;
        }
    }
    return 1;
}

/**
 * Check if a position is inside a string literal in the original code
 *
 * @param {string} code - Original source code (with comments)
 * @param {number} position - Position to check
 * @returns {boolean} True if position is inside a string
 * @private
 */
function isInsideString(code, position) {
    let inString = false;
    let stringChar = "";

    for (let i = 0; i < position && i < code.length; i++) {
        const char = code[i];

        if (!inString && ("\"" === char || "'" === char || "`" === char)) {
            inString = true;
            stringChar = char;
            continue;
        }

        if (inString) {
            if ("\\" === char && i + 1 < code.length) {
                i++; // Skip escaped character
                continue;
            }
            if (char === stringChar) {
                inString = false;
                stringChar = "";
            }
        }
    }

    return inString;
}

/**
 * Check if the left side of a comparison is a literal
 *
 * @param {string} leftSide - The left side of the comparison
 * @returns {boolean} True if left side is a literal
 * @private
 */
function isLiteral(leftSide) {
    const trimmed = leftSide.trim();
    const literalRegex = new RegExp(`^${LITERAL_PATTERN}$`);
    return literalRegex.test(trimmed);
}

/**
 * Extract the comparison expression for error reporting
 *
 * @param {string} code - Source code
 * @param {number} matchStart - Start position of the match
 * @param {number} matchEnd - End position of the match
 * @returns {string} The comparison expression
 * @private
 */
function extractExpression(code, matchStart, matchEnd) {
    return code.slice(matchStart, matchEnd).trim();
}

/**
 * Generate the Yoda-compliant suggestion
 *
 * @param {string} left - Left side of comparison
 * @param {string} operator - Comparison operator
 * @param {string} right - Right side (literal)
 * @returns {string} Yoda-compliant expression
 * @private
 */
function generateSuggestion(left, operator, right) {
    return `${right.trim()} ${operator} ${left.trim()}`;
}

/**
 * Find all Yoda condition violations in code
 *
 * @param {string} code - Source code with comments removed
 * @param {string} originalCode - Original source code (for position mapping)
 * @param {number[]} lineStarts - Line start positions from original code
 * @returns {Array<{line: number, expression: string, suggestion: string, position: number, length: number}>} Array of violations
 * @private
 */
function findViolations(code, originalCode, lineStarts) {
    const violations = [];

    // Pattern: identifier/expression followed by operator followed by literal
    // Captures: (left side)(operator)(literal)
    const patterns = [
        // Typeof expression: typeof x === "string" (check first - more specific)
        new RegExp(`(typeof\\s+[a-zA-Z_$][a-zA-Z0-9_$]*(?:\\.[a-zA-Z_$][a-zA-Z0-9_$]*)*)\\s*(${OPERATOR_PATTERN})\\s*(${LITERAL_PATTERN})`, "g"),
        // Simple identifier: variable === "literal"
        new RegExp(`(\\b[a-zA-Z_$][a-zA-Z0-9_$]*(?:\\.[a-zA-Z_$][a-zA-Z0-9_$]*|\\[[^\\]]+\\])*)\\s*(${OPERATOR_PATTERN})\\s*(${LITERAL_PATTERN})`, "g"),
    ];

    for (const pattern of patterns) {
        let match;
        while (null !== (match = pattern.exec(code))) {
            const [fullMatch, left, operator, right] = match;
            const position = match.index;

            // Skip if left side is also a literal (e.g., "a" === "b")
            if (isLiteral(left)) {
                continue;
            }

            // Skip if this match is inside a string in the original code
            if (isInsideString(originalCode, position)) {
                continue;
            }

            const line = getLineNumber(lineStarts, position);
            const expression = extractExpression(code, position, position + fullMatch.length);
            const suggestion = generateSuggestion(left, operator, right);

            violations.push({
                line,
                expression,
                suggestion,
                position,
                length: fullMatch.length,
            });
        }
    }

    // Sort by position
    violations.sort((a, b) => a.position - b.position);

    // Remove overlapping matches - keep the longest match at each position
    // If one match contains another (e.g., "typeof x === 'string'" contains "x === 'string'"),
    // keep only the longer one
    const filtered = [];
    for (const v of violations) {
        const endPos = v.position + v.length;

        // Check if this violation overlaps with any already accepted violation
        let isOverlapping = false;
        for (const accepted of filtered) {
            const acceptedEnd = accepted.position + accepted.length;

            // Check if ranges overlap
            if (v.position < acceptedEnd && endPos > accepted.position) {
                isOverlapping = true;
                // If current is longer, replace the accepted one
                if (v.length > accepted.length) {
                    const idx = filtered.indexOf(accepted);
                    filtered[idx] = v;
                }
                break;
            }
        }

        if (!isOverlapping) {
            filtered.push(v);
        }
    }

    // Sort by line number for output
    filtered.sort((a, b) => a.line - b.line);

    return filtered;
}

/**
 * Check for Yoda condition violations in source code
 *
 * @param {string} code - Source code to check
 * @param {string} filename - Filename for error messages
 * @returns {{valid: boolean, errors: string[]}} Validation result
 *
 * @example
 * const result = checkYodaConditions('if (x === "foo") {}', 'test.js');
 * // result.valid === false
 * // result.errors[0] === 'test.js:1 \'x === "foo"\' should be \'"foo" === x\''
 */
function checkYodaConditions(code, filename) {
    const errors = [];

    // Build line index from original code
    const lineStarts = buildLineIndex(code);

    // Remove comments for analysis
    const codeWithoutComments = removeComments(code);

    // Find all violations
    const violations = findViolations(codeWithoutComments, code, lineStarts);

    for (const v of violations) {
        errors.push(`${filename}:${v.line} '${v.expression}' should be '${v.suggestion}'`);
    }

    return {
        valid: 0 === errors.length,
        errors,
    };
}

module.exports = {
    checkYodaConditions,
};
