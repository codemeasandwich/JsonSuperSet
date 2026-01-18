/**
 * @fileoverview Built-in Plugins Registry
 *
 * This module serves as the central registry for all built-in JSS type plugins.
 * It provides fast lookup mechanisms for both encoding (by toString type) and
 * decoding (by tag character).
 *
 * ## Available Plugins
 *
 * | Tag | Type      | Description                              |
 * |-----|-----------|------------------------------------------|
 * | D   | Date      | Unix timestamp (milliseconds)            |
 * | R   | RegExp    | String pattern (/pattern/flags)          |
 * | E   | Error     | Array [name, message, stack]             |
 * | U   | undefined | null (with tag to distinguish from null) |
 * | M   | Map       | Plain object from entries                |
 * | S   | Set       | Array of values                          |
 * | P   | Pointer   | Path array for circular references       |
 * | I   | Binary    | Base64 string (decode-only)              |
 *
 * @module utils/defaults
 * @see {@link module:utils/defaults/date} Date plugin
 * @see {@link module:utils/defaults/regexp} RegExp plugin
 * @see {@link module:utils/defaults/error} Error plugin
 * @see {@link module:utils/defaults/undefined} Undefined plugin
 * @see {@link module:utils/defaults/map} Map plugin
 * @see {@link module:utils/defaults/set} Set plugin
 * @see {@link module:utils/defaults/pointer} Pointer plugin
 * @see {@link module:utils/defaults/binary} Binary plugin
 *
 * @example
 * const { getBuiltIn, getTagByToString } = require('./defaults');
 *
 * // Get a plugin by tag
 * const datePlugin = getBuiltIn('D');
 * const decoded = datePlugin.decode(1704067200000, [], {});
 *
 * // Get tag by toString type (for encoding)
 * const tag = getTagByToString('[object Date]'); // 'D'
 */

const date = require("./date");
const regexp = require("./regexp");
const error = require("./error");
const undefinedPlugin = require("./undefined");
const map = require("./map");
const set = require("./set");
const pointer = require("./pointer");
const binary = require("./binary");

/**
 * All built-in plugins indexed by their single-character tag
 *
 * @type {Map<string, Object>}
 * @example
 * builtInPlugins.get('D') // Date plugin
 * builtInPlugins.get('R') // RegExp plugin
 */
const builtInPlugins = new Map([
  ["D", date],
  ["R", regexp],
  ["E", error],
  ["U", undefinedPlugin],
  ["M", map],
  ["S", set],
  ["P", pointer],
  ["I", binary],
]);

/**
 * Lookup table mapping Object.prototype.toString results to tags
 *
 * Used for fast type detection during encoding. Only types with
 * a toStringType property are included.
 *
 * @type {Object.<string, string>}
 * @example
 * toStringTagLookup['[object Date]']   // 'D'
 * toStringTagLookup['[object RegExp]'] // 'R'
 * toStringTagLookup['[object Map]']    // 'M'
 */
const toStringTagLookup = {};
for (const [tag, plugin] of builtInPlugins) {
  if (plugin.toStringType) {
    toStringTagLookup[plugin.toStringType] = tag;
  }
}

/**
 * Array of all built-in tag characters
 *
 * Used by plugins.js to prevent custom plugins from overriding built-in types.
 *
 * @type {string[]}
 * @example
 * builtInTags // ['D', 'R', 'E', 'U', 'M', 'S', 'P', 'I']
 */
const builtInTags = Array.from(builtInPlugins.keys());

/**
 * Get a built-in plugin by its tag character
 *
 * @param {string} tag - Single character tag (e.g., 'D', 'R', 'E')
 * @returns {Object|undefined} The plugin configuration or undefined if not found
 *
 * @example
 * const datePlugin = getBuiltIn('D');
 * if (datePlugin) {
 *   const date = datePlugin.decode(1704067200000, [], {});
 * }
 *
 * @example
 * const unknown = getBuiltIn('X'); // undefined
 */
function getBuiltIn(tag) {
  return builtInPlugins.get(tag);
}

/**
 * Get the tag for a value based on its Object.prototype.toString result
 *
 * Used during encoding to quickly determine if a value is a built-in type.
 *
 * @param {string} toStringResult - Result of Object.prototype.toString.call(value)
 * @returns {string|undefined} The tag character or undefined if not a built-in type
 *
 * @example
 * const tag = getTagByToString('[object Date]'); // 'D'
 *
 * @example
 * const tag = getTagByToString('[object Array]'); // undefined (not a special type)
 */
function getTagByToString(toStringResult) {
  return toStringTagLookup[toStringResult];
}

module.exports = {
  /**
   * Map of all built-in plugins indexed by tag
   * @type {Map<string, Object>}
   */
  builtInPlugins,

  /**
   * Array of all built-in tag characters
   * @type {string[]}
   */
  builtInTags,

  /**
   * Get a built-in plugin by tag
   * @type {function(string): Object|undefined}
   */
  getBuiltIn,

  /**
   * Get tag by Object.prototype.toString result
   * @type {function(string): string|undefined}
   */
  getTagByToString,

  /**
   * Lookup table of toString results to tags
   * @type {Object.<string, string>}
   */
  toStringTagLookup,
};
