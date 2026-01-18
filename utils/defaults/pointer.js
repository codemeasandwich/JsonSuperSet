/**
 * @fileoverview Pointer Plugin - Handles circular references
 *
 * This plugin handles serialization and deserialization of circular references
 * in object graphs. When an object is encountered that has already been visited
 * during encoding, a pointer (path array) to the original location is stored
 * instead of the object itself, preventing infinite recursion.
 *
 * ## Encoding Process
 * The encoder tracks visited objects in a WeakMap. When a circular reference
 * is detected, this plugin returns the path to the original object.
 *
 * ## Decoding Process
 * During decoding, pointers are registered for later resolution. After the
 * entire object tree is decoded, pointers are resolved by navigating to the
 * referenced paths and replacing the null placeholders.
 *
 * @module utils/defaults/pointer
 * @see {@link module:utils/defaults} for the plugin registry
 *
 * @example
 * // Circular reference
 * const obj = { name: 'root' };
 * obj.self = obj;
 *
 * // After encoding, the structure becomes:
 * // { name: 'root', 'self<!P>': [] }
 * // The empty array [] is the path to the root object
 *
 * @example
 * // Nested circular reference
 * const a = { name: 'a' };
 * const b = { name: 'b', ref: a };
 * a.ref = b;
 *
 * // After encoding { a, b }, the structure becomes:
 * // { a: { name: 'a', 'ref<!P>': ['b'] }, b: { name: 'b', 'ref<!P>': ['a'] } }
 */

/**
 * @typedef {Object} PointerPlugin
 * @property {string} tag - Single character identifier ('P')
 * @property {boolean} requiresState - Indicates this plugin needs context state
 * @property {function} check - Type detection function (always returns false)
 * @property {function} encode - Serialization function
 * @property {function} decode - Deserialization function
 */

/**
 * @typedef {Object} EncodeContext
 * @property {WeakMap<Object, Array<string|number>>} visitedEncode - Map of visited objects to their paths
 */

/**
 * @typedef {Object} DecodeContext
 * @property {Array<[Array<string|number>, Array<string|number>]>} pointers2Res - Array of [sourcePath, targetPath] tuples
 */

/**
 * Pointer plugin configuration
 * @type {PointerPlugin}
 */
module.exports = {
  /**
   * Single character tag identifier
   * @type {string}
   */
  tag: "P",

  /**
   * Indicates this plugin requires state injection
   *
   * During encoding, context.visitedEncode (WeakMap) must be provided.
   * During decoding, context.pointers2Res (Array) must be provided.
   *
   * @type {boolean}
   */
  requiresState: true,

  /**
   * Type detection function - always returns false
   *
   * Circular reference detection is handled specially in the encoder's
   * main loop by checking visitedEncode.has(value), not through the
   * standard plugin check mechanism.
   *
   * @param {string|number} key - The property key or array index
   * @param {*} value - The value to check
   * @returns {boolean} Always returns false
   */
  check: (key, value) => false,

  /**
   * Encodes a circular reference as a path to the original object
   *
   * Called directly by the encoder when a circular reference is detected
   * (when visitedEncode.has(value) returns true).
   *
   * @param {Array<string|number>} path - Current path in the object tree
   * @param {string|number|null} key - The property key (unused)
   * @param {Object} value - The circular reference object
   * @param {EncodeContext} context - Must contain visitedEncode WeakMap
   * @returns {Array<string|number>} Path to the original object location
   *
   * @example
   * // context.visitedEncode has obj mapped to []
   * encode(['child', 'parent'], null, obj, { visitedEncode })
   * // Returns: [] (path to original obj)
   */
  encode: (path, key, value, context) => context.visitedEncode.get(value),

  /**
   * Registers a pointer for deferred resolution
   *
   * During the first decode pass, pointers cannot be immediately resolved
   * because the target object may not have been decoded yet. Instead,
   * pointers are registered in context.pointers2Res and resolved after
   * the entire tree is decoded.
   *
   * @param {Array<string|number>} value - Path to the referenced object
   * @param {Array<string|number>} path - Path where the reference should be placed
   * @param {DecodeContext} context - Must contain pointers2Res array
   * @returns {null} Placeholder value (replaced during resolution)
   *
   * @example
   * // Decoding { 'self<!P>': [] }
   * decode([], ['self'], { pointers2Res: [] })
   * // Returns: null
   * // Registers [[], ['self']] in pointers2Res for later resolution
   */
  decode: (value, path, context) => {
    // Register for later resolution
    context.pointers2Res.push([value, path]);
    return null; // Placeholder, will be replaced during resolution
  },
};
