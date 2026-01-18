# JsonSuperSet

Extended JSON serialization supporting Date, RegExp, Error, undefined, Map, Set, and circular references.

## Installation

```bash
npm install jsonsuperset
```

## Quick Start

```javascript
const jss = require('jsonsuperset')

const data = {
  created: new Date(),
  pattern: /hello/gi,
  items: new Set([1, 2, 3]),
  config: new Map([['key', 'value']])
}

const json = jss.stringify(data)
const restored = jss.parse(json)

restored.created  // Date object
restored.pattern  // RegExp /hello/gi
restored.items    // Set {1, 2, 3}
restored.config   // Map {'key' => 'value'}
```

## Supported Types

| Type | Description |
|------|-------------|
| `Date` | Preserved as Date objects |
| `RegExp` | Pattern and flags preserved |
| `Error` | Type, message, and stack preserved |
| `undefined` | Preserved (normally lost in JSON) |
| `Map` | Key-value pairs preserved |
| `Set` | Unique values preserved |
| `Circular refs` | Self-references and shared objects maintained |

## API

### stringify(obj)

Serializes an object to a JSON string with type information.

```javascript
jss.stringify({ date: new Date('2025-01-01') })
// '{"date<!D>":1735689600000}'
```

### parse(str)

Deserializes a JSON string back to an object with types restored.

```javascript
jss.parse('{"date<!D>":1735689600000}')
// { date: Date('2025-01-01') }
```

### encode(obj) / decode(obj)

Low-level functions for inspecting the tagged format without JSON stringification.

```javascript
const encoded = jss.encode({ d: new Date(), s: new Set([1, 2]) })
// { "d<!D>": 1234567890, "s<!S>": [1, 2] }

const decoded = jss.decode(encoded)
// { d: Date, s: Set }
```

### custom(tag, config)

Register a custom type handler.

```javascript
jss.custom('B', {
  check: (key, value) => typeof value === 'bigint',
  encode: (path, key, value, context) => value.toString(),
  decode: (value, path, context) => BigInt(value)
})

jss.stringify({ big: 9007199254740993n })
// '{"big<!B>":"9007199254740993"}'
```

## Examples

### Error Preservation

```javascript
const error = new TypeError('Invalid input')
error.code = 'ERR_INVALID'

const result = jss.parse(jss.stringify({ err: error }))
result.err instanceof TypeError  // true
result.err.message               // 'Invalid input'
result.err.stack                 // original stack trace
```

### Circular References

```javascript
const obj = { name: 'root' }
obj.self = obj

const result = jss.parse(jss.stringify(obj))
result.self === result  // true
```

### Shared References

```javascript
const shared = { value: 42 }
const data = { a: shared, b: shared }

const result = jss.parse(jss.stringify(data))
result.a === result.b  // true (same object reference)
```

## Wire Format

Properties with special types are tagged using `<!TAG>` suffix:

```
key<!D>  → Date (stored as timestamp)
key<!R>  → RegExp (stored as "/pattern/flags")
key<!E>  → Error (stored as [name, message, stack])
key<!U>  → undefined (stored as null)
key<!M>  → Map (stored as object)
key<!S>  → Set (stored as array)
key<!P>  → Pointer (circular reference path)
```

Arrays with typed elements use compound tags: `arr<![D,D,D]>` or shorthand `arr<![*D]>` for homogeneous arrays.
