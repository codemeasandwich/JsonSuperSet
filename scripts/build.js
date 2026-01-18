#!/usr/bin/env node
/**
 * @fileoverview Build script for JsonSuperSet
 *
 * Produces three output bundles:
 * - dist/jss.min.js (IIFE for browser <script> tags, global JSS)
 * - dist/jss.esm.js (ESM for modern bundlers)
 * - dist/jss.cjs.js (CommonJS for Node.js)
 */

const esbuild = require('esbuild');
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
    outfile: path.join(outdir, 'jss.esm.js'),
    target: ['es2018'],
    platform: 'neutral',
  });
  console.log('  Created dist/jss.esm.js (ESM)');
  console.log('  Created dist/jss.esm.js.map');

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
