/**
 * @module response
 * @license MIT
 * @version 2017/11/28
 */

import { supportResponse } from './support';
import { extend } from './utils';
import Headers from './headers';
import Body from './body';

/**
 * @class Response
 * @param {any} body
 * @param {Object} options
 */
function Response(body, options) {
  if (!options) {
    options = {};
  }

  this.type = 'default';
  this.status = options.status === undefined ? 200 : options.status;

  // @see https://stackoverflow.com/questions/10046972/msie-returns-status-code-of-1223-for-ajax-request
  if (this.status === 1223) {
    this.status = 204;
  }

  this.ok = this.status >= 200 && this.status < 300;
  this.statusText = 'statusText' in options ? options.statusText : 'OK';
  this.headers = options.headers instanceof Headers ? options.headers : new Headers(options.headers);
  this.url = options.url || '';

  this._initBody(body);
}

extend(Body, Response);

Response.prototype.clone = function() {
  return new Response(this._bodyInit, {
    status: this.status,
    statusText: this.statusText,
    headers: new Headers(this.headers),
    url: this.url
  });
};

Response.error = function() {
  var response = new Response(null, { status: 0, statusText: '' });

  response.type = 'error';

  return response;
};

var redirectStatuses = [301, 302, 303, 307, 308];

Response.redirect = function(url, status) {
  if (redirectStatuses.indexOf(status) === -1) {
    throw new RangeError('Invalid status code');
  }

  return new Response(null, { status: status, headers: { location: url } });
};

if (!supportResponse) {
  window.Response = Response;
}

export default window.Response;
