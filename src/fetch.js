/**
 * @module fetch
 * @license MIT
 * @version 2017/11/28
 */

import Request from './request';
import Response from './response';
import Headers from './headers';
import { typeOf } from './utils';
import { supportBlob, supportXDomainRequest, supportSearchParams } from './support';

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
    // https://tools.ietf.org/html/rfc7230#section-3.2
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
 * @returns {string}
 */
function responseURL(xhr) {
  if ('responseURL' in xhr) {
    return xhr.responseURL;
  }

  // Avoid security warnings on getResponseHeader when not allowed by CORS
  if (xhr.getResponseHeader && /^X-Request-URL:/m.test(xhr.getAllResponseHeaders())) {
    return xhr.getResponseHeader('X-Request-URL');
  }
}

/**
 * @function isUseXDomainRequest
 * @param {Request} request
 * @returns {boolean}
 */
function isUseXDomainRequest(request) {
  return supportXDomainRequest && (request.mode === 'cors' || request.credentials === 'include');
}

/**
 * @function send
 * @param {XMLHttpRequest|XDomainRequest} xhr
 * @param {Request} request
 */
function send(xhr, request) {
  xhr.send(request._bodyInit === undefined ? null : request._bodyInit);
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

    var useXDomainRequest = isUseXDomainRequest(request);
    var xhr = useXDomainRequest ? new XDomainRequest() : new XMLHttpRequest();

    normalizeEvents(xhr);

    xhr.on('load', function(xhr) {
      var options = {
        status: xhr.status,
        statusText: xhr.statusText,
        headers: parseHeaders(xhr),
        url: responseURL(xhr)
      };

      var body = 'response' in xhr ? xhr.response : xhr.responseText;

      resolve(new Response(body, options));
    });

    xhr.on('error', function() {
      reject(new TypeError('Network request failed'));
    });

    xhr.on('timeout', function() {
      reject(new TypeError('Network request timeout'));
    });

    xhr.open(request.method, request.url, true);

    if (typeOf(request.timeout) === 'number') {
      xdr.timeout = request.timeout;
    }

    if (request.credentials === 'include') {
      xhr.withCredentials = true;
    } else if (request.credentials === 'omit') {
      xhr.withCredentials = false;
    }

    if ('responseType' in xhr && supportBlob) {
      xhr.responseType = 'blob';
    }

    if (xhr.setRequestHeader) {
      request.headers.forEach(function(value, name) {
        xhr.setRequestHeader(name, value);
      });
    }

    if (useXDomainRequest) {
      window.setTimeout(function() {
        send(xhr, request);
      }, 0);
    } else {
      send(xhr, request);
    }
  });
}

window.fetch = fetch;
