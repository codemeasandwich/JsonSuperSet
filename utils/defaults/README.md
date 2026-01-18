# Default Plugins

This directory contains the built-in type plugins for JSS (JSON Super Set). Each plugin handles encoding and decoding of a specific JavaScript type.

## Plugin Interface

Each plugin exports an object with:

```javascript
{
  tag: 'D',                                    // Single character identifier
  toStringType: '[object Date]',               // Object.prototype.toString result
  check: (key, value) => boolean,              // Type detection
  encode: (path, key, value, context) => any,  // Serialization
  decode: (value, path, context) => any        // Deserialization
}
```

## Built-in Plugins

| Tag | File | Type | Encoded As |
|-----|------|------|------------|
| D | date.js | Date | Unix timestamp (ms) |
| R | regexp.js | RegExp | `/pattern/flags` string |
| E | error.js | Error | `[name, message, stack]` |
| U | undefined.js | undefined | `null` |
| M | map.js | Map | Object from entries |
| S | set.js | Set | Array of values |
| P | pointer.js | Circular ref | Path array |
| I | binary.js | Binary | Base64 string (decode-only) |

## Special Cases

### Pointer (P)
Handles circular references. Uses `context.visitedEncode` during encoding and `context.pointers2Res` during decoding for deferred resolution.

### Binary (I)
Decode-only plugin. Binary data is encoded externally; JSS only decodes base64 to Buffer/ArrayBuffer.

## Usage

These plugins are registered automatically. Access via the registry:

```javascript
const { getBuiltIn, getTagByToString } = require('./defaults');

const plugin = getBuiltIn('D');
const tag = getTagByToString('[object Date]'); // 'D'
```
