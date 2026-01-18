/**
 * @fileoverview RegExp Plugin - Encodes RegExp objects as string patterns
 *
 * This plugin handles serialization and deserialization of JavaScript RegExp objects.
 * Regular expressions are converted to their string representation (/pattern/flags)
 * and parsed back to RegExp instances on decode.
 *
 * @module utils/defaults/regexp
 * @see {@link module:utils/defaults} for the plugin registry
 *
 * @example
 * // Encoding
 * const regex = /hello\s+world/gi;
 * const encoded = plugin.encode([], 'pattern', regex, {});
 * // encoded = '/hello\\s+world/gi'
 *
 * @example
 * // Decoding
 * const decoded = plugin.decode('/hello\\s+world/gi', [], {});
 * // decoded = /hello\s+world/gi
 */

/**
 * @typedef {Object} RegExpPlugin
 * @property {string} tag - Single character identifier ('R')
 * @property {string} toStringType - Object.prototype.toString result for RegExp
 * @property {function} check - Type detection function
 * @property {function} encode - Serialization function
 * @property {function} decode - Deserialization function
 */

/**
 * RegExp plugin configuration
 * @type {RegExpPlugin}
 */
module.exports = {
  /**
   * Single character tag identifier
   * @type {string}
   */
  tag: "R",

  /**
   * Result of Object.prototype.toString.call() for RegExp objects
   * Used for fast type detection during encoding
   * @type {string}
   */
  toStringType: "[object RegExp]",

  /**
   * Determines if this plugin should handle the given value
   *
   * @param {string|number} key - The property key or array index
   * @param {*} value - The value to check
   * @returns {boolean} True if value is a RegExp object
   *
   * @example
   * check('pattern', /test/i)  // true
   * check('pattern', 'test')   // false
   */
  check: (key, value) =>
    Object.prototype.toString.call(value) === "[object RegExp]",

  /**
   * Encodes a RegExp object to its string representation
   *
   * @param {Array<string|number>} path - Path to this value in the object tree
   * @param {string|number} key - The property key or array index
   * @param {RegExp} value - The RegExp object to encode
   * @param {Object} context - Encoding context (unused for RegExp)
   * @returns {string} String representation (e.g., '/pattern/flags')
   *
   * @example
   * encode(['config'], 'pattern', /test/gi, {})
   * // Returns: '/test/gi'
   */
  encode: (path, key, value, context) => value.toString(),

  /**
   * Decodes a string pattern back to a RegExp object
   *
   * Parses the /pattern/flags format to extract the pattern and flags,
   * then constructs a new RegExp. Falls back to treating the entire
   * string as a pattern if parsing fails.
   *
   * @param {string} value - String representation of the RegExp
   * @param {Array<string|number>} path - Path to this value in the object tree
   * @param {Object} context - Decoding context (unused for RegExp)
   * @returns {RegExp} Reconstructed RegExp object
   *
   * @example
   * decode('/test/gi', ['config', 'pattern'], {})
   * // Returns: /test/gi
   *
   * @example
   * // Fallback for patterns without delimiters
   * decode('test', ['config', 'pattern'], {})
   * // Returns: /test/
   */
  decode: (value, path, context) => {
    const match = value.match(/^\/(.*)\/([gimsuy]*)$/);
    if (match) {
      return new RegExp(match[1], match[2]);
    }
    return new RegExp(value);
  },
};
