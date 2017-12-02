/**
 * @module headers
 * @license MIT
 * @version 2017/11/28
 */

import { supportIterable } from './support';
import { typeOf, assertArguments } from './utils';

/**
 * @function normalizeName
 * @param {string} name
 * @returns {string}
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Headers
 */
function normalizeName(name) {
  name = String(name);

  if (!name || /[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(name)) {
    throw new TypeError('Headers API: Invalid header name');
  }

  return name.toLowerCase();
}

/**
 * @function normalizeValue
 * @param {string} value
 * @returns {string}
 */
function normalizeValue(value) {
  value = String(value);

  return value;
}

/**
 * @function iteratorFor
 * @description Build a destructive iterator for the value list
 * @param {Array} items
 * @returns {Object}
 */
function iteratorFor(items) {
  var index = 0;
  var length = items.length;
  var iterator = {
    next: function() {
      var done = index >= length;
      var value = !done ? items[index++] : undefined;

      return { done: done, value: value };
    }
  };

  if (supportIterable) {
    iterator[Symbol.iterator] = function() {
      return iterator;
    };
  }

  return iterator;
}

/**
 * @class Headers
 * @constructor
 * @param {Object} headers
 */
export default function Headers(headers) {
  this.map = {};
  this._headerNames = {};

  if (headers === undefined) return this;

  if (headers instanceof Headers) {
    headers.forEach(function(value, name) {
      this.append(name, value);
    }, this);
  } else if (Array.isArray(headers)) {
    headers.forEach(function(sequence) {
      if (sequence.length < 2) {
        throw new TypeError('Headers API: Invalid header value');
      }

      var name = sequence[0];
      var value = sequence[1];

      this.append(name, value);
    }, this);
  } else if (typeOf(headers) === 'object') {
    for (var name in headers) {
      if (headers.hasOwnProperty(name)) {
        this.append(name, headers[name]);
      }
    }
  } else {
    throw new TypeError(
      "Headers API: The provided value is not of type '(sequence<sequence<ByteString>> or record<ByteString, ByteString>)"
    );
  }
}

/**
 * @method append
 * @param {string} name
 * @param {string} value
 */
Headers.prototype.append = function(name, value) {
  assertArguments('Headers', 'append', 2, arguments.length);

  var key = normalizeName(name);

  this._headerNames[key] = name;

  var oldValue = this.map[key];

  value = normalizeValue(value);

  this.map[key] = oldValue ? oldValue + ',' + value : value;
};

/**
 * @method delete
 * @param {string} name
 */
Headers.prototype['delete'] = function(name) {
  assertArguments('Headers', 'delete', 1, arguments.length);

  name = normalizeName(name);

  delete this.map[name];
  delete this._headerNames[name];
};

/**
 * @method get
 * @param {string} name
 * @returns {string}
 */
Headers.prototype.get = function(name) {
  assertArguments('Headers', 'get', 1, arguments.length);

  name = normalizeName(name);

  return this.has(name) ? this.map[name] : null;
};

/**
 * @method has
 * @param {string} name
 * @returns {boolean}
 */
Headers.prototype.has = function(name) {
  assertArguments('Headers', 'has', 1, arguments.length);

  return this.map.hasOwnProperty(normalizeName(name));
};

/**
 * @method set
 * @param {string} name
 * @param {string} value
 */
Headers.prototype.set = function(name, value) {
  assertArguments('Headers', 'set', 2, arguments.length);

  var key = normalizeName(name);

  this._headerNames[key] = name;
  this.map[key] = normalizeValue(value);
};

/**
 * @method forEach
 * @param {Function} callback
 * @param {any} context
 */
Headers.prototype.forEach = function(callback, context) {
  assertArguments('Headers', 'forEach', 1, arguments.length);

  for (var name in this.map) {
    if (this.map.hasOwnProperty(name)) {
      callback.call(context, this.map[name], name, this);
    }
  }
};

/**
 * @method keys
 * @returns {Array}
 */
Headers.prototype.keys = function() {
  var items = [];

  this.forEach(function(value, name) {
    items.push(name);
  });

  return iteratorFor(items);
};

/**
 * @method values
 * @returns {Array}
 */
Headers.prototype.values = function() {
  var items = [];

  this.forEach(function(value) {
    items.push(value);
  });

  return iteratorFor(items);
};

/**
 * @method entries
 * @returns {Array}
 */
Headers.prototype.entries = function() {
  var items = [];

  this.forEach(function(value, name) {
    items.push([name, value]);
  });

  return iteratorFor(items);
};

if (supportIterable) {
  Headers.prototype[Symbol.iterator] = Headers.prototype.entries;
}

window.Headers = Headers;
