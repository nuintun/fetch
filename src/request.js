/**
 * @module request
 * @license MIT
 * @version 2017/11/28
 */

import { extend } from './utils';
import Headers from './headers';
import Body from './body';

// HTTP methods whose capitalization should be normalized
var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT'];

/**
 * @function normalizeMethod
 * @param {string} method
 * @returns {string}
 */
function normalizeMethod(method) {
  var upcased = method.toUpperCase();

  return methods.indexOf(upcased) > -1 ? upcased : method;
}

/**
 * @class Request
 * @constructor
 * @param {Request|string} input
 * @param {Object} options
 */
export default function Request(input, options) {
  options = options || {};

  var body = options.body;

  if (input instanceof Request) {
    if (input.bodyUsed) {
      throw new TypeError('Already read');
    }

    this.url = input.url;
    this.credentials = input.credentials;

    if (!options.headers) {
      this.headers = new Headers(input.headers);
    }

    this.method = input.method;
    this.mode = input.mode;

    if (!body && input._bodyInit !== null) {
      body = input._bodyInit;
      input.bodyUsed = true;
    }
  } else {
    this.url = String(input);
  }

  this.credentials = options.credentials || this.credentials || 'omit';

  if (options.headers || !this.headers) {
    this.headers = new Headers(options.headers);
  }

  this.method = normalizeMethod(options.method || this.method || 'GET');
  this.mode = options.mode || this.mode || null;
  this.referrer = null;

  if ((this.method === 'GET' || this.method === 'HEAD') && body) {
    throw new TypeError('Body not allowed for GET or HEAD requests');
  }

  this._initBody(body);
}

extend(Body, Request);

/**
 * @method clone
 * @returns {Request}
 */
Request.prototype.clone = function() {
  return new Request(this, { body: this._bodyInit });
};

window.Request = Request;
