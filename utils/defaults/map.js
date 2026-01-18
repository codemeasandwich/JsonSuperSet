/**
 * @fileoverview Map Plugin - Converts Map objects to/from plain objects
 *
 * This plugin handles serialization and deserialization of JavaScript Map objects.
 * Maps are converted to plain objects using Object.fromEntries() for JSON-safe
 * transmission and restored to Map instances using Object.entries() on decode.
 *
 * Note: This encoding only supports string keys. Maps with non-string keys
 * will have their keys converted to strings.
 *
 * @module utils/defaults/map
 * @see {@link module:utils/defaults} for the plugin registry
 *
 * @example
 * // Encoding
 * const map = new Map([['name', 'Alice'], ['age', 30]]);
 * const encoded = plugin.encode([], 'data', map, {});
 * // encoded = { name: 'Alice', age: 30 }
 *
 * @example
 * // Decoding
 * const decoded = plugin.decode({ name: 'Alice', age: 30 }, [], {});
 * // decoded = Map { 'name' => 'Alice', 'age' => 30 }
 */

/**
 * @typedef {Object} MapPlugin
 * @property {string} tag - Single character identifier ('M')
 * @property {string} toStringType - Object.prototype.toString result for Map
 * @property {function} check - Type detection function
 * @property {function} encode - Serialization function
 * @property {function} decode - Deserialization function
 */

/**
 * Map plugin configuration
 * @type {MapPlugin}
 */
module.exports = {
  /**
   * Single character tag identifier
   * @type {string}
   */
  tag: "M",

  /**
   * Result of Object.prototype.toString.call() for Map objects
   * Used for fast type detection during encoding
   * @type {string}
   */
  toStringType: "[object Map]",

  /**
   * Determines if this plugin should handle the given value
   *
   * @param {string|number} key - The property key or array index
   * @param {*} value - The value to check
   * @returns {boolean} True if value is a Map object
   *
   * @example
   * check('data', new Map())           // true
   * check('data', { key: 'value' })    // false
   * check('data', new WeakMap())       // false
   */
  check: (key, value) =>
    Object.prototype.toString.call(value) === "[object Map]",

  /**
   * Encodes a Map object to a plain object
   *
   * Uses Object.fromEntries() to convert Map entries to object properties.
   * Note that Map keys will be converted to strings in this process.
   *
   * @param {Array<string|number>} path - Path to this value in the object tree
   * @param {string|number} key - The property key or array index
   * @param {Map} value - The Map object to encode
   * @param {Object} context - Encoding context (unused for Map)
   * @returns {Object} Plain object representation of the Map
   *
   * @example
   * const map = new Map([['a', 1], ['b', 2]]);
   * encode(['user'], 'settings', map, {})
   * // Returns: { a: 1, b: 2 }
   */
  encode: (path, key, value, context) => Object.fromEntries(value),

  /**
   * Decodes a plain object back to a Map
   *
   * Uses Object.entries() to extract key-value pairs from the object
   * and constructs a new Map from them.
   *
   * @param {Object} value - Plain object to convert to Map
   * @param {Array<string|number>} path - Path to this value in the object tree
   * @param {Object} context - Decoding context (unused for Map)
   * @returns {Map} Reconstructed Map object
   *
   * @example
   * decode({ a: 1, b: 2 }, ['user', 'settings'], {})
   * // Returns: Map { 'a' => 1, 'b' => 2 }
   */
  decode: (value, path, context) => new Map(Object.entries(value)),
};
