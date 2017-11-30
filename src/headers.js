/**
 * @module headers
 * @license MIT
 * @version 2017/11/28
 */

import { typeOf } from './utils';
import { supportIterable } from './support';

/**
 * @function normalizeName
 * @param {string} name
 * @returns {string}
 */
function normalizeName(name) {
  if (typeOf(name) !== 'string') {
    name = String(name);
  }

  if (/[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(name)) {
    throw new TypeError('Invalid character in header field name');
  }

  return name.toLowerCase();
}

/**
 * @function normalizeValue
 * @param {string} value
 * @returns {string}
 */
function normalizeValue(value) {
  if (typeOf(value) !== 'string') {
    value = String(value);
  }

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
      var value = items[index++];

      return { done: index >= length, value: value };
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

  if (headers instanceof Headers) {
    headers.forEach(function(value, name) {
      this.append(name, value);
    }, this);
  } else if (headers) {
    for (var name in headers) {
      if (headers.hasOwnProperty(name)) {
        this.append(name, headers[name]);
      }
    }
  }
}

/**
 * @method append
 * @param {string} name
 * @param {string} value
 */
Headers.prototype.append = function(name, value) {
  name = normalizeName(name);
  value = normalizeValue(value);

  var oldValue = this.map[name];

  this.map[name] = oldValue ? oldValue + ',' + value : value;
};

/**
 * @method delete
 * @param {string} name
 */
Headers.prototype['delete'] = function(name) {
  delete this.map[normalizeName(name)];
};

/**
 * @method get
 * @param {string} name
 * @returns {string}
 */
Headers.prototype.get = function(name) {
  name = normalizeName(name);

  return this.has(name) ? this.map[name] : null;
};

/**
 * @method has
 * @param {string} name
 * @returns {boolean}
 */
Headers.prototype.has = function(name) {
  return this.map.hasOwnProperty(normalizeName(name));
};

/**
 * @method set
 * @param {string} name
 * @param {string} value
 */
Headers.prototype.set = function(name, value) {
  this.map[normalizeName(name)] = normalizeValue(value);
};

/**
 * @method forEach
 * @param {Function} callback
 * @param {any} context
 */
Headers.prototype.forEach = function(callback, context) {
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
