/**
 * @module request
 * @license MIT
 * @version 2017/11/28
 */

import { hasAuth, normalizeURL, extend } from './utils';
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
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Request
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
    this.mode = input.mode;
    this.method = input.method;
    this.credentials = input.credentials;
    this.redirect = input.redirect;
    this.referrer = input.referrer;
    this.referrerPolicy = input.referrerPolicy;

    if (!options.headers) {
      this.headers = new Headers(input.headers);
    }

    if (!body && input.body !== null) {
      body = input.body;
      input.bodyUsed = true;
    }
  } else {
    var url = String(input);

    if (hasAuth(url)) {
      throw new TypeError('Request cannot be constructed from a URL that includes credentials: ' + url);
    }

    this.url = normalizeURL(url);
    this.mode = options.mode || 'cors';
    this.method = normalizeMethod(options.method || 'GET');

    if ((this.method === 'GET' || this.method === 'HEAD') && body) {
      throw new TypeError('Request with GET/HEAD method cannot have body');
    }

    this.credentials = options.credentials || 'omit';
    this.redirect = options.redirect || 'follow';
    this.referrer = options.referrer || 'about:client';
    this.referrerPolicy = options.referrerPolicy || '';
    this.headers = new Headers(options.headers || {});
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
