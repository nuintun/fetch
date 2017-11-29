/**
 * @module utils
 * @license MIT
 * @version 2017/11/28
 */

var toString = Object.prototype.toString;

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
 * @function bindEvents
 * @param {XMLHttpRequest|XDomainRequest} xhr
 */
export function bindEvents(xhr) {
  var events = {};

  ['load', 'error', 'timeout'].forEach(function(method) {
    xhr['on' + method] = function() {
      if (events[method]) {
        events[method](xhr);
      }
    };
  });

  xhr.on = function(type, fn) {
    events[type] = fn;
  };

  xhr.onabort = function() {
    events = {};
  };
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

var FPToString = Function.prototype.toString;

// Native function RegExp
// @see https://github.com/kgryte/regex-native-function/blob/master/lib/index.js
var NATIVE_RE = '';

// Use a native function as a template...
NATIVE_RE += FPToString.call(Function);
// Escape special RegExp characters...
NATIVE_RE = NATIVE_RE.replace(/([.*+?^=!:$(){}|[\]\/\\])/g, '\\$1');
// Replace any mentions of `Function` to make template generic.
// Replace `for ...` and additional info provided in other environments, such as Rhino (see lodash).
NATIVE_RE = NATIVE_RE.replace(/Function|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?');
// Bracket the regex:
NATIVE_RE = '^' + NATIVE_RE + '$';

// Get RegExp
NATIVE_RE = new RegExp(NATIVE_RE);

/**
 * @function isNativeMethod
 * @param {any} value
 * @returns {boolean}
 */
export function isNativeMethod(value) {
  if (typeOf(value) !== 'function') {
    return false;
  }

  return NATIVE_RE.test(FPToString.call(value));
}
