/**
 * @module fetch
 * @license MIT
 * @version 2017/11/28
 */

import { typeOf } from './utils';
import Request from './request';
import Response from './response';
import Headers from './headers';
import Transport from './transport';
import { supportFetch } from './support';

if (!supportFetch) {
  function headers(xhr) {
    var head = new Headers();

    if (xhr.getAllResponseHeaders) {
      var headers = xhr.getAllResponseHeaders() || '';

      if (/\S/.test(headers)) {
        //http://www.w3.org/TR/XMLHttpRequest/#the-getallresponseheaders-method
        var headerPairs = headers.split('\u000d\u000a');

        for (var i = 0; i < headerPairs.length; i++) {
          var headerPair = headerPairs[i];
          // Can't use split() here because it does the wrong thing
          // if the header value has the string ": " in it.
          var index = headerPair.indexOf('\u003a\u0020');

          if (index > 0) {
            var key = headerPair.substring(0, index).trim();
            var value = headerPair.substring(index + 2).trim();

            head.append(key, value);
          }
        }
      }
    }

    return head;
  }

  function fetch(input, init) {
    return new Promise(function(resolve, reject) {
      var request;

      if (!init && init instanceof Request) {
        request = input;
      } else {
        request = new Request(input, init);
      }

      var xhr = new Transport(request);

      function responseURL() {
        if ('responseURL' in xhr) {
          return xhr.responseURL;
        }

        // Avoid security warnings on getResponseHeader when not allowed by CORS
        if (xhr.getResponseHeader && /^X-Request-URL:/m.test(xhr.getAllResponseHeaders())) {
          return xhr.getResponseHeader('X-Request-URL');
        }
      }

      xhr.on('load', function(event) {
        var options = {
          status: event.status,
          statusText: event.statusText,
          headers: headers(event),
          url: responseURL()
        };
        var body = 'response' in event ? event.response : event.responseText;

        resolve(new Response(body, options));
      });

      xhr.on('error', function() {
        reject(new TypeError('Network request failed'));
      });

      xhr.on('timeout', function() {
        reject(new TypeError('Network request timeout'));
      });

      xhr.open(request.method, request.url, true);

      request.headers.forEach(function(value, name) {
        xhr.setRequestHeader(name, value);
      });

      xhr.send(typeof request._body === 'undefined' ? null : request._body);
    });
  }

  fetch.polyfill = true;

  window.fetch = fetch;
}
