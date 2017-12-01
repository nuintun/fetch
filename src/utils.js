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

var A = document.createElement('a');
var AUTH_RE = /^([a-z0-9.+-]+:)?(\/\/)(?:([^@/:]*)(?::([^@/]*))?@)?/i;

/**
 * @function normalizeURL
 * @description Get full url
 * @param {string} href
 * @param {boolean} hash
 * @returns {string}
 */
export function normalizeURL(href, hash) {
  var username;
  var password;

  href = href.replace(AUTH_RE, function(match, protocol, slash, user, pass) {
    username = user;
    password = pass;

    return protocol + slash;
  });

  A.href = href;

  if (!A.protocol) {
    A.protocol = location.protocol;
  }

  if (!A.host) {
    A.host = location.host;
  }

  var protocol = A.protocol;

  href = protocol + '//';

  if (username) {
    href += username;
  }

  if (password) {
    href += ':' + password;
  }

  if (username || password) {
    href += '@';
  }

  href += A.hostname;

  var port = A.port;

  if (port && ((protocol === 'http' && port !== '80') || (protocol === 'https' && port !== '443'))) {
    href += ':' + port;
  }

  if (A.pathname) {
    href += '/' + A.pathname;
  }

  href += A.search;

  if (hash) {
    href += A.hash;
  }

  return href;
}
