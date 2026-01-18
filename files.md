# JsonSuperSet Files

Extended JSON serialization supporting Date, RegExp, Error, undefined, Map, Set, and circular references.

## Directory Structure

```
├── index.js
├── index.test.js
└── utils/
```

## Files

### index.js
Main entry point. Exports: `parse`, `stringify`, `encode`, `decode`, `custom`, `clearPlugins`

### index.test.js
Test suite for the main module.

### utils/
Encoding, decoding, and plugin implementations. See [utils/files.md](utils/files.md).
