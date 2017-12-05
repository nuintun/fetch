/**
 * @module rollup
 * @license MIT
 * @version 2017/11/28
 */

'use strict';

const fs = require('fs');
const rollup = require('rollup');
const uglify = require('uglify-es');

const pkg = require('./package.json');

const banner = `/**
* @module ${pkg.name}
* @author ${pkg.author.name}
* @license ${pkg.license}
* @version ${pkg.version}
* @description ${pkg.description}
* @see ${pkg.homepage}
*/
`;

rollup
  .rollup({
    legacy: true,
    context: 'window',
    input: 'src/fetch.js'
  })
  .then(bundle => {
    fs.stat('dist', error => {
      if (error) {
        fs.mkdirSync('dist');
      }

      const src = 'dist/fetch.js';
      const min = 'dist/fetch.min.js';
      const map = 'fetch.js.map';

      bundle
        .generate({
          name: 'fetch',
          format: 'iife',
          indent: true,
          strict: true,
          banner: banner,
          intro: 'if (window.fetch) return;'
        })
        .then(result => {
          fs.writeFileSync(src, result.code);
          console.log(`  Build ${src} success!`);

          result = uglify.minify(
            {
              'fetch.js': result.code
            },
            {
              ecma: 5,
              ie8: true,
              mangle: { eval: true },
              sourceMap: { url: map }
            }
          );

          fs.writeFileSync(min, banner + result.code);
          console.log(`  Build ${min} success!`);
          fs.writeFileSync(src + '.map', result.map);
          console.log(`  Build ${src + '.map'} success!`);
        })
        .catch(error => {
          console.error(error);
        });
    });
  })
  .catch(error => {
    console.error(error);
  });
