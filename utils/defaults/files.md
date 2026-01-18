# Files

```
defaults/
├── index.js      - Registry and exports (getBuiltIn, getTagByToString, builtInTags)
├── date.js       - D: Date ↔ Unix timestamp
├── regexp.js     - R: RegExp ↔ /pattern/flags string
├── error.js      - E: Error ↔ [name, message, stack]
├── undefined.js  - U: undefined ↔ null
├── map.js        - M: Map ↔ object entries
├── set.js        - S: Set ↔ array
├── pointer.js    - P: Circular reference handling
├── binary.js     - I: Base64 → Buffer/ArrayBuffer (decode-only)
├── README.md     - Documentation
└── files.md      - This file
```
