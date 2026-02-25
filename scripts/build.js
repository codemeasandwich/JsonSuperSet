#!/usr/bin/env node
/**
 * @fileoverview Build script for JsonSuperSet
 *
 * Produces three output bundles:
 * - dist/jss.min.js (IIFE for browser <script> tags, global JSS)
 * - dist/jss.esm.mjs (ESM for modern bundlers)
 * - dist/jss.cjs.js (CommonJS for Node.js)
 */

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const entryPoint = path.resolve(__dirname, '../index.js');
const outdir = path.resolve(__dirname, '../dist');

async function build() {
  console.log('Building JsonSuperSet bundles...\n');

  // IIFE bundle for browsers (minified with source map)
  await esbuild.build({
    entryPoints: [entryPoint],
    bundle: true,
    minify: true,
    sourcemap: true,
    format: 'iife',
    globalName: 'JSS',
    outfile: path.join(outdir, 'jss.min.js'),
    target: ['es2018'],
    platform: 'browser',
  });
  console.log('  Created dist/jss.min.js (IIFE, minified)');
  console.log('  Created dist/jss.min.js.map');

  // ESM bundle for modern bundlers
  await esbuild.build({
    entryPoints: [entryPoint],
    bundle: true,
    minify: true,
    sourcemap: true,
    format: 'esm',
    outfile: path.join(outdir, 'jss.esm.mjs'),
    target: ['es2018'],
    platform: 'neutral',
  });

  // Post-process: add named exports alongside default export
  const esmPath = path.join(outdir, 'jss.esm.mjs');
  let esmContent = fs.readFileSync(esmPath, 'utf8');
  const match = esmContent.match(/export default (\w+)\(\);/);
  if (!match) {
    throw new Error('ESM bundle: could not find "export default <var>();" pattern');
  }
  const varName = match[1];
  esmContent = esmContent.replace(
    /export default \w+\(\);/,
    `var _jss=${varName}();export default _jss;export var{parse,stringify,encode,decode,custom,clearPlugins}=_jss;`
  );
  fs.writeFileSync(esmPath, esmContent);

  console.log('  Created dist/jss.esm.mjs (ESM)');
  console.log('  Created dist/jss.esm.mjs.map');

  // CommonJS bundle for Node.js
  await esbuild.build({
    entryPoints: [entryPoint],
    bundle: true,
    minify: false,
    sourcemap: true,
    format: 'cjs',
    outfile: path.join(outdir, 'jss.cjs.js'),
    target: ['node14'],
    platform: 'node',
  });
  console.log('  Created dist/jss.cjs.js (CommonJS)');
  console.log('  Created dist/jss.cjs.js.map');

  console.log('\nBuild complete!');
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
