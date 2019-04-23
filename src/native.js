/**
 * @module native
 * @author nuintun
 * @license MIT
 */

// Used to match `RegExp`
// [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
var REGEXP_CHAR_RE = /[\\^$.*+?()[\]{}|]/g;
// Used to detect if a method is native
var IS_NATIVE_RE = Function.prototype.toString.call(Function);

IS_NATIVE_RE = IS_NATIVE_RE.replace(REGEXP_CHAR_RE, '\\$&');
IS_NATIVE_RE = IS_NATIVE_RE.replace(/Function|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?');
IS_NATIVE_RE = new RegExp('^' + IS_NATIVE_RE + '$');

/**
 * @function native
 * @param {any} value
 * @returns {boolean}
 */
export default function native(value) {
  return typeof value === 'function' && IS_NATIVE_RE.test(value);
}
