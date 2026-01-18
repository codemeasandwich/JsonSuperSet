/**
 * @fileoverview Binary Plugin - Decodes inline base64 binary data
 *
 * This plugin handles deserialization of inline binary data encoded as base64 strings.
 * It is a decode-only plugin - binary data is encoded by external sources (e.g., file
 * transfer systems) and JSS only needs to decode it back to Buffer or ArrayBuffer.
 *
 * ## Environment Detection
 * - **Node.js**: Returns a Buffer object using Buffer.from()
 * - **Browser**: Returns an ArrayBuffer using atob() and Uint8Array
 *
 * @module utils/defaults/binary
 * @see {@link module:utils/defaults} for the plugin registry
 *
 * @example
 * // Decoding in Node.js
 * const decoded = plugin.decode('SGVsbG8gV29ybGQ=', [], {});
 * // decoded = Buffer.from('Hello World')
 *
 * @example
 * // Decoding in browser
 * const decoded = plugin.decode('SGVsbG8gV29ybGQ=', [], {});
 * // decoded = ArrayBuffer containing 'Hello World' bytes
 */

/**
 * @typedef {Object} BinaryPlugin
 * @property {string} tag - Single character identifier ('I')
 * @property {boolean} decodeOnly - Indicates this plugin only supports decoding
 * @property {function} check - Type detection function (always returns false)
 * @property {null} encode - No encoding support
 * @property {function} decode - Deserialization function
 */

/**
 * Binary plugin configuration
 * @type {BinaryPlugin}
 */
module.exports = {
  /**
   * Single character tag identifier
   *
   * 'I' stands for "Inline" binary data, distinguishing it from
   * external binary transfers that use different mechanisms.
   *
   * @type {string}
   */
  tag: "I",

  /**
   * Indicates this plugin only supports decoding
   *
   * Binary data encoding is handled by external systems (e.g., file transfer).
   * JSS only needs to decode the base64 representation back to binary.
   *
   * @type {boolean}
   */
  decodeOnly: true,

  /**
   * Type detection function - always returns false
   *
   * Since this is a decode-only plugin, the check function is never used.
   * Binary data is not detected during encoding; it must be explicitly
   * tagged with 'I' by external systems.
   *
   * @param {string|number} key - The property key or array index
   * @param {*} value - The value to check
   * @returns {boolean} Always returns false
   */
  check: (key, value) => false,

  /**
   * No encoding support
   *
   * Binary encoding is handled by external systems. Set to null to
   * indicate this plugin cannot encode values.
   *
   * @type {null}
   */
  encode: null,

  /**
   * Decodes a base64 string to binary data
   *
   * Automatically detects the runtime environment and returns the
   * appropriate binary type:
   * - Node.js: Buffer
   * - Browser: ArrayBuffer
   *
   * @param {string} value - Base64 encoded string
   * @param {Array<string|number>} path - Path to this value in the object tree
   * @param {Object} context - Decoding context (unused for binary)
   * @returns {Buffer|ArrayBuffer} Decoded binary data
   *
   * @example
   * // Node.js environment
   * decode('SGVsbG8=', ['data', 'file'], {})
   * // Returns: <Buffer 48 65 6c 6c 6f>
   *
   * @example
   * // Browser environment
   * decode('SGVsbG8=', ['data', 'file'], {})
   * // Returns: ArrayBuffer { byteLength: 5 }
   */
  decode: (value, path, context) => {
    // In Node.js, return Buffer
    if ("undefined" !== typeof Buffer) {
      return Buffer.from(value, "base64");
    }
    // In browser, return ArrayBuffer
    const binaryStr = atob(value);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    return bytes.buffer;
  },
};
