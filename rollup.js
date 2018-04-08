/**
 * @module rollup
 * @license MIT
 * @version 2017/11/28
 */

'use strict';

const fs = require('fs-extra');
const rollup = require('rollup');
const uglify = require('uglify-es');
const pkg = require('./package.json');

/**
 * @function build
 * @param {Object} inputOptions
 * @param {Object} outputOptions
 */
async function build(inputOptions, outputOptions) {
  await fs.remove('dist');

  const bundle = await rollup.rollup(inputOptions);
  const result = await bundle.generate(outputOptions);

  const file = outputOptions.file;
  const min = file.replace(/\.js$/i, '.min.js');
  const map = `${file}.map`;
  const minify = uglify.minify(
    { 'fetch.js': result.code },
    { ecma: 5, ie8: true, mangle: { eval: true }, sourceMap: { url: map } }
  );

  await fs.outputFile(file, result.code);
  console.log(`Build ${file} success!`);

  await fs.outputFile(min, minify.code);
  console.log(`Build ${min} success!`);

  await fs.outputFile(map, minify.code);
  console.log(`Build ${map} success!`);
}

const banner = `/**
 * @module ${pkg.name}
 * @author ${pkg.author.name}
 * @license ${pkg.license}
 * @version ${pkg.version}
 * @description ${pkg.description}
 * @see ${pkg.homepage}
 */
`;

const inputOptions = {
  context: 'window',
  input: 'src/fetch.js'
};

const outputOptions = {
  name: 'fetch',
  format: 'iife',
  indent: true,
  strict: true,
  legacy: true,
  banner: banner,
  file: 'dist/fetch.js',
  intro: `if (typeof window.fetch === 'function') return;`
};

build(inputOptions, outputOptions);
