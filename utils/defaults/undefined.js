/**
 * @fileoverview Undefined Plugin - Explicitly encodes undefined values
 *
 * This plugin handles serialization and deserialization of JavaScript undefined values.
 * Unlike standard JSON which omits undefined properties, JSS explicitly encodes them
 * as null with a 'U' tag, preserving the distinction between missing and undefined.
 *
 * @module utils/defaults/undefined
 * @see {@link module:utils/defaults} for the plugin registry
 *
 * @example
 * // Encoding
 * const encoded = plugin.encode([], 'value', undefined, {});
 * // encoded = null (with tag 'U' on the key)
 *
 * @example
 * // Decoding
 * const decoded = plugin.decode(null, [], {});
 * // decoded = undefined
 */

/**
 * @typedef {Object} UndefinedPlugin
 * @property {string} tag - Single character identifier ('U')
 * @property {string} toStringType - Object.prototype.toString result for undefined
 * @property {function} check - Type detection function
 * @property {function} encode - Serialization function
 * @property {function} decode - Deserialization function
 */

/**
 * Undefined plugin configuration
 * @type {UndefinedPlugin}
 */
module.exports = {
  /**
   * Single character tag identifier
   * @type {string}
   */
  tag: "U",

  /**
   * Result of Object.prototype.toString.call() for undefined
   * Used for fast type detection during encoding
   * @type {string}
   */
  toStringType: "[object Undefined]",

  /**
   * Determines if this plugin should handle the given value
   *
   * @param {string|number} key - The property key or array index
   * @param {*} value - The value to check
   * @returns {boolean} True if value is undefined
   *
   * @example
   * check('prop', undefined)  // true
   * check('prop', null)       // false
   * check('prop', '')         // false
   */
  check: (key, value) => undefined === value,

  /**
   * Encodes undefined as null for JSON compatibility
   *
   * Since JSON cannot represent undefined, we encode it as null.
   * The 'U' tag on the key indicates this null should be decoded as undefined.
   *
   * @param {Array<string|number>} path - Path to this value in the object tree
   * @param {string|number} key - The property key or array index
   * @param {undefined} value - The undefined value
   * @param {Object} context - Encoding context (unused for undefined)
   * @returns {null} JSON-compatible null representation
   *
   * @example
   * encode(['config'], 'optional', undefined, {})
   * // Returns: null
   */
  encode: (path, key, value, context) => null,

  /**
   * Decodes null back to undefined
   *
   * @param {null} value - The null placeholder value
   * @param {Array<string|number>} path - Path to this value in the object tree
   * @param {Object} context - Decoding context (unused for undefined)
   * @returns {undefined} The undefined value
   *
   * @example
   * decode(null, ['config', 'optional'], {})
   * // Returns: undefined
   */
  decode: (value, path, context) => undefined,
};
