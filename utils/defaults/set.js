/**
 * @fileoverview Set Plugin - Converts Set objects to/from arrays
 *
 * This plugin handles serialization and deserialization of JavaScript Set objects.
 * Sets are converted to arrays using Array.from() for JSON-safe transmission
 * and restored to Set instances on decode.
 *
 * @module utils/defaults/set
 * @see {@link module:utils/defaults} for the plugin registry
 *
 * @example
 * // Encoding
 * const set = new Set([1, 2, 3]);
 * const encoded = plugin.encode([], 'items', set, {});
 * // encoded = [1, 2, 3]
 *
 * @example
 * // Decoding
 * const decoded = plugin.decode([1, 2, 3], [], {});
 * // decoded = Set { 1, 2, 3 }
 */

/**
 * @typedef {Object} SetPlugin
 * @property {string} tag - Single character identifier ('S')
 * @property {string} toStringType - Object.prototype.toString result for Set
 * @property {function} check - Type detection function
 * @property {function} encode - Serialization function
 * @property {function} decode - Deserialization function
 */

/**
 * Set plugin configuration
 * @type {SetPlugin}
 */
module.exports = {
  /**
   * Single character tag identifier
   * @type {string}
   */
  tag: "S",

  /**
   * Result of Object.prototype.toString.call() for Set objects
   * Used for fast type detection during encoding
   * @type {string}
   */
  toStringType: "[object Set]",

  /**
   * Determines if this plugin should handle the given value
   *
   * @param {string|number} key - The property key or array index
   * @param {*} value - The value to check
   * @returns {boolean} True if value is a Set object
   *
   * @example
   * check('items', new Set())        // true
   * check('items', [1, 2, 3])        // false
   * check('items', new WeakSet())    // false
   */
  check: (key, value) =>
    Object.prototype.toString.call(value) === "[object Set]",

  /**
   * Encodes a Set object to an array
   *
   * Uses Array.from() to convert Set values to an array.
   * The order of elements is preserved.
   *
   * @param {Array<string|number>} path - Path to this value in the object tree
   * @param {string|number} key - The property key or array index
   * @param {Set} value - The Set object to encode
   * @param {Object} context - Encoding context (unused for Set)
   * @returns {Array} Array of Set values
   *
   * @example
   * const set = new Set(['admin', 'user']);
   * encode(['user'], 'roles', set, {})
   * // Returns: ['admin', 'user']
   */
  encode: (path, key, value, context) => Array.from(value),

  /**
   * Decodes an array back to a Set
   *
   * Constructs a new Set from the array values.
   * Duplicate values in the array will be deduplicated.
   *
   * @param {Array} value - Array to convert to Set
   * @param {Array<string|number>} path - Path to this value in the object tree
   * @param {Object} context - Decoding context (unused for Set)
   * @returns {Set} Reconstructed Set object
   *
   * @example
   * decode(['admin', 'user'], ['user', 'roles'], {})
   * // Returns: Set { 'admin', 'user' }
   */
  decode: (value, path, context) => new Set(value),
};
