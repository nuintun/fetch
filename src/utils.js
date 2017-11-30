/**
 * @module utils
 * @license MIT
 * @version 2017/11/28
 */

export var toString = Object.prototype.toString;

/**
 * @function typeOf
 * @param {any} value
 * @returns {string}
 */
export function typeOf(value) {
  return toString
    .call(value)
    .replace(/\[object (\w+)\]/, '$1')
    .toLowerCase();
}

/**
 * @function Blank
 * @description Use a blank constructor save memory for extend function.
 */
function Blank() {}

var objectCreate = Object.create;
var setPrototypeOf = Object.setPrototypeOf;

/**
 * @function extend
 * @param {Function} superclass
 * @param {Function} subclass
 */
export function extend(superclass, subclass) {
  var superPrototype = superclass.prototype;

  if (setPrototypeOf) {
    setPrototypeOf(subclass.prototype, superPrototype);
  } else if (objectCreate) {
    subclass.prototype = objectCreate(superPrototype);
  } else {
    Blank.prototype = superPrototype;

    subclass.prototype = new Blank();
  }

  subclass.prototype.constructor = subclass;
}

var host = location.host;
var A = document.createElement('a');

/**
 * @function normalizeURL
 * @description Get full url
 * @param {string} href
 */
export function normalizeURL(href) {
  A.href = href;

  if (!A.host) {
    A.host = host;
  }

  return A.href;
}
