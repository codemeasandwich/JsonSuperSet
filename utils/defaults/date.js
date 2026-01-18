/**
 * @fileoverview Date Plugin - Encodes Date objects as Unix timestamps
 *
 * This plugin handles serialization and deserialization of JavaScript Date objects.
 * Dates are converted to Unix timestamps (milliseconds since epoch) for JSON-safe
 * transmission and restored to Date instances on decode.
 *
 * @module utils/defaults/date
 * @see {@link module:utils/defaults} for the plugin registry
 *
 * @example
 * // Encoding
 * const date = new Date('2024-01-01T00:00:00.000Z');
 * const encoded = plugin.encode([], 'created', date, {});
 * // encoded = 1704067200000
 *
 * @example
 * // Decoding
 * const decoded = plugin.decode(1704067200000, [], {});
 * // decoded = Date('2024-01-01T00:00:00.000Z')
 */

/**
 * @typedef {Object} DatePlugin
 * @property {string} tag - Single character identifier ('D')
 * @property {string} toStringType - Object.prototype.toString result for Date
 * @property {function} check - Type detection function
 * @property {function} encode - Serialization function
 * @property {function} decode - Deserialization function
 */

/**
 * Date plugin configuration
 * @type {DatePlugin}
 */
module.exports = {
  /**
   * Single character tag identifier
   * @type {string}
   */
  tag: "D",

  /**
   * Result of Object.prototype.toString.call() for Date objects
   * Used for fast type detection during encoding
   * @type {string}
   */
  toStringType: "[object Date]",

  /**
   * Determines if this plugin should handle the given value
   *
   * @param {string|number} key - The property key or array index
   * @param {*} value - The value to check
   * @returns {boolean} True if value is a Date object
   *
   * @example
   * check('created', new Date())  // true
   * check('created', '2024-01-01') // false
   */
  check: (key, value) =>
    Object.prototype.toString.call(value) === "[object Date]",

  /**
   * Encodes a Date object to a Unix timestamp
   *
   * @param {Array<string|number>} path - Path to this value in the object tree
   * @param {string|number} key - The property key or array index
   * @param {Date} value - The Date object to encode
   * @param {Object} context - Encoding context (unused for Date)
   * @returns {number} Unix timestamp in milliseconds
   *
   * @example
   * encode(['user'], 'created', new Date('2024-01-01'), {})
   * // Returns: 1704067200000
   */
  encode: (path, key, value, context) => value.valueOf(),

  /**
   * Decodes a Unix timestamp back to a Date object
   *
   * @param {number} value - Unix timestamp in milliseconds
   * @param {Array<string|number>} path - Path to this value in the object tree
   * @param {Object} context - Decoding context (unused for Date)
   * @returns {Date} Reconstructed Date object
   *
   * @example
   * decode(1704067200000, ['user', 'created'], {})
   * // Returns: Date('2024-01-01T00:00:00.000Z')
   */
  decode: (value, path, context) => new Date(value),
};
