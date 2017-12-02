/**
 * @module response
 * @license MIT
 * @version 2017/11/28
 */

import { assertArguments, normalizeURL, extend } from './utils';
import Headers from './headers';
import Body from './body';

var redirectStatuses = [301, 302, 303, 307, 308];

/**
 * @function normalizeType
 * @param {string} type
 * @returns {string}
 */
function normalizeType(type) {
  switch (type) {
    case 'cors':
    case 'basic':
    case 'opaque':
      return type;
    default:
      return 'default';
  }
}

/**
 * @class Response
 * @constructor
 * @param {any} body
 * @param {Object} options
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Response
 */
export default function Response(body, options) {
  Body.call(this);

  options = options || {};

  this.url = options.url || '';
  this.type = normalizeType(options.type);
  this.headers = new Headers(options.headers);

  var status = options.status === undefined ? 200 : options.status;

  // https://stackoverflow.com/questions/10046972/msie-returns-status-code-of-1223-for-ajax-request
  if (status === 1223) {
    status = 204;
  }

  this.status = status;
  this.ok = status >= 200 && status < 300;
  this.redirected = redirectStatuses.indexOf(status) >= 0;
  this.statusText = options.statusText || (status === 200 ? 'OK' : '');

  this._initBody(body);
}

extend(Body, Response);

/**
 * @method clone
 * @returns {Response}
 */
Response.prototype.clone = function() {
  return new Response(this.body, {
    status: this.status,
    statusText: this.statusText,
    headers: new Headers(this.headers),
    url: this.url
  });
};

/**
 * @method error
 * @returns {Response}
 */
Response.error = function() {
  var response = new Response(null, { status: 0, statusText: '' });

  response.type = 'error';

  return response;
};

/**
 * @method redirect
 * @param {string} url
 * @param {number} status
 * @returns {Response}
 */
Response.redirect = function(url, status) {
  assertArguments('Response', 'redirect', 1, arguments);

  if (redirectStatuses.indexOf(status) === -1) {
    throw new RangeError('Response API: Invalid status code');
  }

  return new Response(null, { status: status, headers: { location: url } });
};

window.Response = Response;
