/**
 * @module fetch
 * @license MIT
 * @version 2017/11/28
 */

import Request from './request';
import Response from './response';
import Headers from './headers';
import { typeOf } from './utils';
import { supportFetch, supportBlob, supportXMLHttpRequest, supportSearchParams } from './support';

/**
 * @function normalizeEvents
 * @param {XMLHttpRequest|XDomainRequest} xhr
 */
function normalizeEvents(xhr) {
  var events = {};

  ['load', 'error', 'timeout'].forEach(function(method) {
    xhr['on' + method] = function() {
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

function responseURL(xhr) {
  if ('responseURL' in xhr) {
    return xhr.responseURL;
  }

  // Avoid security warnings on getResponseHeader when not allowed by CORS
  if (xhr.getResponseHeader && /^X-Request-URL:/m.test(xhr.getAllResponseHeaders())) {
    return xhr.getResponseHeader('X-Request-URL');
  }
}

function fetch(input, init) {
  return new Promise(function(resolve, reject) {
    var request;

    if (!init && init instanceof Request) {
      request = input;
    } else {
      request = new Request(input, init);
    }

    var xhr = supportXMLHttpRequest ? new XMLHttpRequest() : new XDomainRequest();

    if (typeOf(request.timeout) === 'number') {
      xdr.timeout = request.timeout;
    }

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

    xhr.send(request._body === undefined ? null : request._body);
  });
}

fetch.polyfill = true;

if (!supportFetch) {
  window.fetch = fetch;
}
