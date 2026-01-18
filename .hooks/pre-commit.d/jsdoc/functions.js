/**
 * @fileoverview Function finder for JavaScript source code
 *
 * Extracts function declarations, function expressions, and arrow functions
 * from JavaScript source code. Returns function names, parameters, and
 * their positions for JSDoc validation.
 *
 * @module hooks/jsdoc/functions
 */

const { findMatchingBrace, findMatchingParen, removeComments } = require("./utils");

/**
 * Replace all comments with whitespace to preserve positions
 *
 * This prevents the function finder from detecting function calls
 * inside JSDoc examples (like `new Date()`, `require()`) as actual functions.
 *
 * @param {string} code - The source code string
 * @returns {string} Code with comments replaced by spaces
 * @private
 */
function stripAllComments(code) {
  // Replace all block comments (/* ... */ and /** ... */) with spaces
  let result = code.replace(/\/\*[\s\S]*?\*\//g, (match) => {
    return match.replace(/[^\n]/g, " ");
  });
  // Replace single-line comments (// ...) with spaces
  result = result.replace(/\/\/[^\n]*/g, (match) => {
    return " ".repeat(match.length);
  });
  return result;
}

/**
 * Extract all functions from JavaScript source code
 *
 * Finds function declarations, named function expressions, method definitions,
 * and exported functions. Returns their names, parameters, and source positions.
 *
 * @param {string} code - The source code string
 * @returns {Array<{name: string, params: string[], start: number, end: number, line: number}>} Array of function info
 *
 * @example
 * findFunctions('function foo(a, b) { return a + b; }')
 * // Returns [{ name: 'foo', params: ['a', 'b'], start: 0, end: 35, line: 1 }]
 */
function findFunctions(code) {
  // Strip all comments to avoid detecting function calls in examples/comments
  const strippedCode = stripAllComments(code);
  const functions = [];

  // Calculate line numbers for positions
  const lineStarts = [0];
  for (let i = 0; i < code.length; i++) {
    if (code[i] === "\n") {
      lineStarts.push(i + 1);
    }
  }

  /**
   * Get line number for a position
   *
   * @param {number} pos - Character position
   * @returns {number} Line number (1-indexed)
   * @private
   */
  function getLineNumber(pos) {
    for (let i = lineStarts.length - 1; i >= 0; i--) {
      if (lineStarts[i] <= pos) {
        return i + 1;
      }
    }
    return 1;
  }

  /**
   * Parse parameter list from parentheses content
   *
   * @param {string} paramStr - The content between parentheses
   * @returns {string[]} Array of parameter names
   * @private
   */
  function parseParams(paramStr) {
    if (!paramStr || !paramStr.trim()) return [];

    const params = [];
    let depth = 0;
    let current = "";
    let inString = false;
    let stringChar = "";

    for (let i = 0; i < paramStr.length; i++) {
      const char = paramStr[i];

      // Handle strings
      if (!inString && (char === '"' || char === "'" || char === "`")) {
        inString = true;
        stringChar = char;
        current += char;
        continue;
      }

      if (inString) {
        current += char;
        if (char === "\\" && i + 1 < paramStr.length) {
          current += paramStr[i + 1];
          i++;
          continue;
        }
        if (char === stringChar) {
          inString = false;
        }
        continue;
      }

      // Track depth for nested structures
      if (char === "(" || char === "{" || char === "[") {
        depth++;
        current += char;
      } else if (char === ")" || char === "}" || char === "]") {
        depth--;
        current += char;
      } else if (char === "," && depth === 0) {
        // End of parameter
        const param = current.trim();
        if (param) {
          // Extract just the name (before = or : for destructuring/defaults)
          const name = param.split("=")[0].split(":")[0].trim();
          // Handle destructuring - skip it
          if (!name.startsWith("{") && !name.startsWith("[")) {
            params.push(name);
          } else {
            params.push(param); // Keep destructuring as-is for display
          }
        }
        current = "";
      } else {
        current += char;
      }
    }

    // Don't forget the last parameter
    const param = current.trim();
    if (param) {
      const name = param.split("=")[0].split(":")[0].trim();
      if (!name.startsWith("{") && !name.startsWith("[")) {
        params.push(name);
      } else {
        params.push(param);
      }
    }

    return params;
  }

  // Pattern 1: function declarations - function name(params)
  const funcDeclRegex = /\bfunction\s+(\w+)\s*\(/g;
  let match;

  while ((match = funcDeclRegex.exec(strippedCode)) !== null) {
    const name = match[1];
    const parenStart = match.index + match[0].length - 1;
    const parenEnd = findMatchingParen(code, parenStart);

    if (parenEnd !== -1) {
      const paramStr = code.substring(parenStart + 1, parenEnd);
      const params = parseParams(paramStr);

      // Find the function body
      const bodyStart = code.indexOf("{", parenEnd);
      if (bodyStart !== -1) {
        const bodyEnd = findMatchingBrace(code, bodyStart);
        functions.push({
          name,
          params,
          start: match.index,
          end: bodyEnd !== -1 ? bodyEnd + 1 : bodyStart + 1,
          line: getLineNumber(match.index),
        });
      }
    }
  }

  // Pattern 2: Method definitions in objects/classes - name(params) { or name: function(
  const methodRegex = /\b(\w+)\s*(?:\(|:\s*function\s*\()/g;

  while ((match = methodRegex.exec(strippedCode)) !== null) {
    const name = match[1];

    // Skip if it's a keyword, built-in method, or already found
    const skipNames = [
      // Control flow keywords
      "if", "else", "for", "while", "switch", "catch", "function", "return", "new", "typeof", "instanceof",
      // Built-in methods that might be called without being function definitions
      "require", "match", "includes", "has", "get", "set", "find", "filter", "map", "forEach",
      "push", "pop", "shift", "unshift", "slice", "splice", "concat", "join", "split",
      "startsWith", "endsWith", "indexOf", "lastIndexOf", "replace", "trim", "toLowerCase", "toUpperCase",
      "isArray", "keys", "values", "entries", "from", "toString", "valueOf", "call", "apply", "bind",
      "then", "catch", "finally", "resolve", "reject", "all", "race", "allSettled",
      "log", "warn", "error", "info", "debug", "trace", "assert", "dir", "table", "time", "timeEnd",
      "stringify", "parse", "assign", "create", "defineProperty", "freeze", "seal",
      "exec", "test", "check", "encode", "decode", "getBuiltIn", "getPlugin", "getAllPlugins"
    ];
    if (skipNames.includes(name)) {
      continue;
    }

    // Skip if already captured as function declaration
    if (functions.some((f) => f.name === name && Math.abs(f.start - match.index) < 20)) {
      continue;
    }

    const parenStart = code.indexOf("(", match.index);
    if (parenStart !== -1 && parenStart < match.index + match[0].length + 10) {
      const parenEnd = findMatchingParen(code, parenStart);

      if (parenEnd !== -1) {
        const paramStr = code.substring(parenStart + 1, parenEnd);
        const params = parseParams(paramStr);

        const bodyStart = code.indexOf("{", parenEnd);
        if (bodyStart !== -1 && bodyStart < parenEnd + 20) {
          const bodyEnd = findMatchingBrace(code, bodyStart);
          functions.push({
            name,
            params,
            start: match.index,
            end: bodyEnd !== -1 ? bodyEnd + 1 : bodyStart + 1,
            line: getLineNumber(match.index),
          });
        }
      }
    }
  }

  // Pattern 3: Arrow functions with names - const name = (params) => or const name = async (
  const arrowRegex = /\b(const|let|var)\s+(\w+)\s*=\s*(async\s*)?\(?/g;

  while ((match = arrowRegex.exec(strippedCode)) !== null) {
    const name = match[2];
    const afterEquals = code.substring(match.index + match[0].length - 1);

    // Check if it's an arrow function
    let parenStart = -1;
    let isArrow = false;

    if (afterEquals[0] === "(") {
      parenStart = match.index + match[0].length - 1;
      const parenEnd = findMatchingParen(code, parenStart);
      if (parenEnd !== -1) {
        const afterParen = code.substring(parenEnd + 1, parenEnd + 20).trim();
        isArrow = afterParen.startsWith("=>");
      }
    } else {
      // Check for single param arrow: const x = y =>
      const singleParamMatch = afterEquals.match(/^(\w+)\s*=>/);
      if (singleParamMatch) {
        isArrow = true;
      }
    }

    if (isArrow && !functions.some((f) => f.name === name)) {
      let params = [];
      if (parenStart !== -1) {
        const parenEnd = findMatchingParen(code, parenStart);
        if (parenEnd !== -1) {
          const paramStr = code.substring(parenStart + 1, parenEnd);
          params = parseParams(paramStr);
        }
      }

      // Find the arrow function body
      const arrowPos = code.indexOf("=>", match.index);
      if (arrowPos !== -1) {
        const afterArrow = code.substring(arrowPos + 2).trim();
        let end = arrowPos + 2;

        if (afterArrow[0] === "{") {
          const bodyStart = arrowPos + 2 + code.substring(arrowPos + 2).indexOf("{");
          const bodyEnd = findMatchingBrace(code, bodyStart);
          end = bodyEnd !== -1 ? bodyEnd + 1 : bodyStart + 1;
        }

        functions.push({
          name,
          params,
          start: match.index,
          end,
          line: getLineNumber(match.index),
        });
      }
    }
  }

  // Sort by position and deduplicate
  functions.sort((a, b) => a.start - b.start);

  return functions.filter((f, i, arr) => {
    // Remove duplicates (same name at similar position)
    if (i > 0) {
      const prev = arr[i - 1];
      if (prev.name === f.name && Math.abs(prev.start - f.start) < 5) {
        return false;
      }
    }
    return true;
  });
}

module.exports = { findFunctions };
