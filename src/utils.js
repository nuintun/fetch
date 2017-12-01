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
 * @param {string} url
 * @param {boolean} hash
 * @returns {string}
 */
export function normalizeURL(url, hash) {
  var username;
  var password;

  url = url.replace(AUTH_RE, function(match, protocol, slash, user, pass) {
    username = user;
    password = pass;

    return protocol + slash;
  });

  A.href = url;

  if (!A.protocol) {
    A.protocol = location.protocol;
  }

  if (!A.host) {
    A.host = location.host;
  }

  var protocol = A.protocol;

  url = protocol + '//';

  if (username) {
    url += username;
  }

  if (password) {
    url += ':' + password;
  }

  if (username || password) {
    url += '@';
  }

  url += A.hostname;

  var port = A.port;

  if (port && ((protocol === 'http:' && port !== '80') || (protocol === 'https:' && port !== '443'))) {
    url += ':' + port;
  }

  if (A.pathname) {
    url += '/' + A.pathname;
  }

  url += A.search;

  if (hash) {
    url += A.hash;
  }

  return url;
}

var DOMAIN = document.domain;
var PORTS = { 'http:': '80', 'https:': '443' };
var PORT = location.port || PORTS[location.protocol];

/**
 * @function isCORS
 * @param {string} url
 * @returns {boolean}
 */
export function isCORS(url) {
  url = url.replace(AUTH_RE, '$1$2');

  A.href = url;

  if (!A.host) {
    return false;
  }

  var protocol = A.protocol;

  if (protocol && protocol !== location.protocol) {
    return true;
  }

  var port = A.port;

  if (port && port !== PORT) {
    return true;
  }

  try {
    document.domain = A.hostname;
  } catch (error) {
    return true;
  }

  document.domain = DOMAIN;

  return false;
}
