/**
 * @module response
 * @license MIT
 * @version 2017/11/28
 */

import { extend } from './utils';
import Headers from './headers';
import Body from './body';

var redirectStatuses = [301, 302, 303, 307, 308];

/**
 * @class Response
 * @constructor
 * @param {any} body
 * @param {Object} options
 */
export default function Response(body, options) {
  Body.call(this);

  options = options || {};

  this.type = 'basic';
  this.status = options.status === undefined ? 200 : options.status;

  // @see https://stackoverflow.com/questions/10046972/msie-returns-status-code-of-1223-for-ajax-request
  if (this.status === 1223) {
    this.status = 204;
  }

  this.redirected = redirectStatuses.indexOf(this.status) >= 0;
  this.ok = this.status >= 200 && this.status < 300;
  this.statusText = options.statusText || 'OK';
  this.headers = new Headers(options.headers);
  this.url = options.url || '';

  this._initBody(body);
}

extend(Body, Response);

/**
 * @method clone
 * @returns {Response}
 */
Response.prototype.clone = function() {
  return new Response(this._bodyInit, {
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
  if (redirectStatuses.indexOf(status) === -1) {
    throw new RangeError('Invalid status code');
  }

  return new Response(null, { status: status, headers: { location: url } });
};

window.Response = Response;
