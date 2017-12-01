/**
 * @module request
 * @license MIT
 * @version 2017/11/28
 */

import { supportXDomainRequest } from './support';
import { normalizeURL, extend } from './utils';
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
  Body.call(this);

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
    this.referrer = input.referrer;

    if (!body && input.body !== null) {
      body = input.body;
      input.bodyUsed = true;
    }
  } else {
    this.url = String(input);
  }

  this.url = normalizeURL(this.url);
  this.credentials = options.credentials || this.credentials || 'omit';

  if (options.headers || !this.headers) {
    this.headers = new Headers(options.headers);
  }

  this.method = normalizeMethod(options.method || this.method || 'GET');
  this.mode = options.mode || this.mode || (supportXDomainRequest ? 'no-cors' : 'cors');
  this.referrer = options.referrer || this.referrer || 'about:client';

  if ((this.method === 'GET' || this.method === 'HEAD') && body) {
    throw new TypeError('Request with GET/HEAD method cannot have body');
  }

  this._initBody(body);
}

extend(Body, Request);

/**
 * @method clone
 * @returns {Request}
 */
Request.prototype.clone = function() {
  return new Request(this, { body: this.body });
};

window.Request = Request;
