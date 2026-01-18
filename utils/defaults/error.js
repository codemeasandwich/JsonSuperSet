/**
 * @fileoverview Error Plugin - Preserves error type, message, and stack trace
 *
 * This plugin handles serialization and deserialization of JavaScript Error objects.
 * Errors are encoded as an array [name, message, stack] to preserve all information,
 * including the specific error type (TypeError, RangeError, etc.) and the full
 * stack trace for debugging.
 *
 * @module utils/defaults/error
 * @see {@link module:utils/defaults} for the plugin registry
 *
 * @example
 * // Encoding
 * const error = new TypeError('Invalid argument');
 * const encoded = plugin.encode([], 'err', error, {});
 * // encoded = ['TypeError', 'Invalid argument', 'TypeError: Invalid argument\n    at ...']
 *
 * @example
 * // Decoding
 * const decoded = plugin.decode(['TypeError', 'Invalid argument', 'stack...'], [], {});
 * // decoded = TypeError('Invalid argument') with preserved stack
 */

/**
 * @typedef {Object} ErrorPlugin
 * @property {string} tag - Single character identifier ('E')
 * @property {string} toStringType - Object.prototype.toString result for Error
 * @property {function} check - Type detection function
 * @property {function} encode - Serialization function
 * @property {function} decode - Deserialization function
 */

/**
 * Error plugin configuration
 * @type {ErrorPlugin}
 */
module.exports = {
  /**
   * Single character tag identifier
   * @type {string}
   */
  tag: "E",

  /**
   * Result of Object.prototype.toString.call() for Error objects
   * Used for fast type detection during encoding
   * @type {string}
   */
  toStringType: "[object Error]",

  /**
   * Determines if this plugin should handle the given value
   *
   * @param {string|number} key - The property key or array index
   * @param {*} value - The value to check
   * @returns {boolean} True if value is an Error object
   *
   * @example
   * check('error', new Error('test'))     // true
   * check('error', new TypeError('test')) // true
   * check('error', { message: 'test' })   // false
   */
  check: (key, value) =>
    Object.prototype.toString.call(value) === "[object Error]",

  /**
   * Encodes an Error object to an array of [name, message, stack]
   *
   * @param {Array<string|number>} path - Path to this value in the object tree
   * @param {string|number} key - The property key or array index
   * @param {Error} value - The Error object to encode
   * @param {Object} context - Encoding context (unused for Error)
   * @returns {Array<string>} Tuple of [name, message, stack]
   *
   * @example
   * const err = new TypeError('Invalid input');
   * encode(['response'], 'error', err, {})
   * // Returns: ['TypeError', 'Invalid input', 'TypeError: Invalid input\n    at ...']
   */
  encode: (path, key, value, context) => [value.name, value.message, value.stack],

  /**
   * Decodes an error tuple back to an Error object
   *
   * Attempts to reconstruct the original error type (TypeError, RangeError, etc.)
   * by looking up the constructor in the global scope. Falls back to a generic
   * Error with a custom name property if the specific type is not available.
   *
   * @param {Array<string>} value - Tuple of [name, message, stack]
   * @param {Array<string|number>} path - Path to this value in the object tree
   * @param {Object} context - Decoding context (unused for Error)
   * @returns {Error} Reconstructed Error object with preserved type and stack
   *
   * @example
   * decode(['TypeError', 'Invalid input', 'stack trace...'], ['response', 'error'], {})
   * // Returns: TypeError with message 'Invalid input' and preserved stack
   *
   * @example
   * // Custom error types fall back to Error with custom name
   * decode(['CustomError', 'Something failed', 'stack...'], [], {})
   * // Returns: Error with name='CustomError', message='Something failed'
   */
  decode: (value, path, context) => {
    const [name, message, stack] = value;
    let err;
    try {
      // Try to create the specific error type (TypeError, RangeError, etc.)
      err = new global[name](message);
      if (err instanceof Error) {
        err.stack = stack;
      } else {
        throw {}; // Force fallback if not a real Error
      }
    } catch (e) {
      // Fallback to generic Error with custom name
      err = new Error(message);
      err.name = name;
      err.stack = stack;
    }
    return err;
  },
};
