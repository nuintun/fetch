/**
 * @module fetch
 * @license MIT
 * @version 2017/11/28
 */

import Request from './request';
import Response from './response';
import Headers from './headers';
import { isCORS } from './utils';
import { supportBlob, supportXDomainRequest } from './support';

/**
 * @function normalizeEvents
 * @param {XMLHttpRequest|XDomainRequest} xhr
 */
function normalizeEvents(xhr) {
  var events = {};

  if ('onload' in xhr) {
    xhr.onload = function() {
      if (events.load) {
        events.load(xhr);
      }
    };
  } else {
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4 && events.load) {
        events.load(xhr);
      }
    };
  }

  ['error', 'timeout'].forEach(function(method) {
    xhr['on' + method] = function(e) {
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
 * @function parseHeaders
 * @param {XMLHttpRequest|XDomainRequest} xhr
 * @returns {Headers}
 */
function parseHeaders(xhr) {
  var headers = new Headers();

  if (xhr.getAllResponseHeaders) {
    // Replace instances of \r\n and \n followed by at least one space or horizontal tab with a space
    // @see https://tools.ietf.org/html/rfc7230#section-3.2
    var rawHeaders = xhr.getAllResponseHeaders() || '';
    var preProcessedHeaders = rawHeaders.replace(/\r?\n[\t ]+/g, ' ');

    preProcessedHeaders.split(/\r?\n/).forEach(function(line) {
      var parts = line.split(':');
      var key = parts.shift().trim();

      if (key) {
        var value = parts.join(':').trim();

        headers.append(key, value);
      }
    });
  }

  return headers;
}

/**
 * @function responseURL
 * @param {XMLHttpRequest|XDomainRequest} xhr
 * @param {Headers} headers
 * @returns {string}
 */
function responseURL(xhr, headers, url) {
  return 'responseURL' in xhr ? xhr.responseURL : headers.get('X-Request-URL');
}

/**
 * @function isUseXDomainRequest
 * @param {Request} request
 * @returns {boolean}
 */
function isUseXDomainRequest(request) {
  return supportXDomainRequest && isCORS(request.url);
}

/**
 * @function fetch
 * @param {Request|string} input
 * @param {Object|Request} init
 * @returns {Promise}
 */
function fetch(input, init) {
  return new Promise(function(resolve, reject) {
    var request;

    if (!init && init instanceof Request) {
      request = input;
    } else {
      request = new Request(input, init);
    }

    var cors = isCORS(request.url);

    if (cors) {
      switch (request.mode) {
        case 'same-origin':
          return reject(
            new TypeError('Request mode is "same-origin" but the URL\'s origin is not same as the request origin')
          );
        case 'no-cors':
          return resolve(new Response(null, { status: 0, type: 'opaque' }));
      }
    }

    var xhr = cors && supportXDomainRequest ? new XDomainRequest() : new XMLHttpRequest();

    normalizeEvents(xhr);

    xhr.on('load', function(xhr) {
      var headers = parseHeaders(xhr);
      var body = 'response' in xhr ? xhr.response : xhr.responseText;
      var options = {
        headers: headers,
        status: xhr.status,
        statusText: xhr.statusText,
        type: cors ? 'cors' : 'basic',
        url: responseURL(xhr, headers) || request.url
      };

      resolve(new Response(body, options));
    });

    xhr.on('error', function() {
      reject(new TypeError('Network request failed'));
    });

    xhr.on('timeout', function() {
      reject(new TypeError('Network request timeout'));
    });

    xhr.open(request.method, request.url, true);

    xhr.timeout = Math.max(request.timeout >> 0, 0);

    if (request.credentials === 'include') {
      xhr.withCredentials = true;
    } else if (request.credentials === 'omit') {
      xhr.withCredentials = false;
    }

    if ('responseType' in xhr && supportBlob) {
      xhr.responseType = 'blob';
    }

    if (xhr.setRequestHeader) {
      var headers = request.headers;

      headers.forEach(function(value, name) {
        xhr.setRequestHeader(this._headerNames[name], value);
      }, headers);
    }

    xhr.send(request.body === undefined ? null : request.body);
  });
}

window.fetch = fetch;
