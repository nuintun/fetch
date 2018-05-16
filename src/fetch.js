/**
 * @module fetch
 * @license MIT
 * @version 2017/11/28
 */

import './intro';
import { supportBlob, supportXDomainRequest } from './support';
import { isCORS, assertArguments } from './utils';
import Request from './request';
import Response from './response';
import Headers from './headers';

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
 * @function createXHR
 * @param {boolean} cors
 * @returns {XMLHttpRequest|XDomainRequest}
 */
function createXHR(cors) {
  if (cors && supportXDomainRequest) {
    return new XDomainRequest();
  } else {
    return new XMLHttpRequest();
  }
}

/**
 * @function fetch
 * @param {Request|string} input
 * @param {Object|Request} init
 * @returns {Promise}
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
 */
function fetch(input, init) {
  assertArguments('Window', 'fetch', 1, arguments.length);

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
          var response = new Response();

          response.ok = false;
          response.status = 0;
          response.statusText = '';
          response.type = 'opaque';

          return resolve(response);
      }
    }

    var xhr = createXHR(cors);
    var supportLoad = 'onload' in xhr;

    /**
     * @function cleanXHR
     * @param {XMLHttpRequest|XDomainRequest} xhr
     */
    function cleanXHR(xhr) {
      if (supportLoad) {
        xhr.onload = null;
      } else {
        xhr.onreadystatechange = null;
      }

      xhr.onerror = null;
      xhr.ontimeout = null;
      xhr.onabort = null;
    }

    /**
     * @function rejectError
     * @param {string} message
     */
    function rejectError(message) {
      reject(new TypeError('Request ' + request.url + ' ' + message));
    }

    function onload() {
      cleanXHR(xhr);

      var headers = parseHeaders(xhr);
      var body = 'response' in xhr ? xhr.response : xhr.responseText;
      var options = {
        headers: headers,
        status: xhr.status || 200,
        statusText: xhr.statusText
      };

      try {
        var response = new Response(body, options);
      } catch (error) {
        return rejectError(error);
      }

      response.type = cors ? 'cors' : 'basic';
      response.url = responseURL(xhr, headers) || request.url.replace(/#.*/, '');

      resolve(response);
    }

    if (supportLoad) {
      xhr.onload = onload;
    } else {
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          onload();
        }
      };
    }

    xhr.onerror = function() {
      cleanXHR(xhr);
      rejectError('failed');
    };

    xhr.ontimeout = function() {
      cleanXHR(xhr);
      rejectError('timeout');
    };

    xhr.onabort = function() {
      cleanXHR(xhr);
      rejectError('aborted');
    };

    try {
      xhr.open(request.method, request.url, true);

      xhr.timeout = Math.max(request.timeout >> 0, 0);
      xhr.responseType = supportBlob ? 'blob' : 'text';

      if (request.credentials === 'include') {
        xhr.withCredentials = true;
      } else if (request.credentials === 'omit') {
        xhr.withCredentials = false;
      }

      if (xhr.setRequestHeader) {
        var headers = request.headers;

        headers.forEach(function(value, name) {
          xhr.setRequestHeader(this['<names>'][name], value);
        }, headers);
      }

      xhr.send(request.body === undefined ? null : request.body);
    } catch (error) {
      cleanXHR(xhr);
      reject(error);
    }
  });
}

this.fetch = fetch;
this.Headers = Headers;
this.Request = Request;
this.Response = Response;
