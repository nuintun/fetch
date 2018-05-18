/**
 * @module utils
 * @license MIT
 * @version 2017/11/28
 */

import native from './native';

export var toString = Object.prototype.toString;

/**
 * @function typeOf
 * @param {any} value
 * @returns {string}
 */
export function typeOf(value) {
  if (value === null || value === undefined) {
    return String(value);
  }

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

var objectCreate = native(Object.create) ? Object.create : false;
var setPrototypeOf = native(Object.setPrototypeOf) ? Object.setPrototypeOf : false;

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

// URL includes credentials
var AUTH_RE = /^([a-z0-9.+-]+:)?\/\/([^/:]*)(?::([^/]*))?@/i;

/**
 * @function hasAuth
 * @description Test url is include auth credentials
 * @param {string} url
 * @returns {boolean}
 */
export function hasAuth(url) {
  return AUTH_RE.test(url);
}

var A = document.createElement('a');

/**
 * @function normalizeURL
 * @description Get full url. If URL includes credentials IE will can't read a.href
 * @param {string} url
 * @param {boolean} hash
 * @returns {string}
 */
export function normalizeURL(url, hash) {
  A.href = url;

  if (!A.host) {
    A.host = location.host;
  }

  return A.href;
}

var PORTS = { 'http:': '80', 'https:': '443' };
var PORT = location.port || PORTS[location.protocol];

/**
 * @function isCORS
 * @description Test URL is CORS. If URL includes credentials IE will can't read a.href
 * @param {string} url
 * @returns {boolean}
 */
export function isCORS(url) {
  A.href = url;

  if (!A.host) return false;

  var protocol = A.protocol;

  if (protocol && protocol !== location.protocol) return true;

  var port = A.port;

  if (port && port !== PORT) return true;

  if (A.hostname !== location.hostname) return true;

  return false;
}

/**
 * @function assertArguments
 * @param {string} method
 * @param {number} expect
 * @param {number} actual
 */
export function assertArguments(master, method, expect, actual) {
  if (actual < expect) {
    throw new TypeError(
      "Failed to execute '" +
        method +
        "' on '" +
        master +
        "': " +
        expect +
        ' arguments required, but only ' +
        actual +
        ' present'
    );
  }
}
