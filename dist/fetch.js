(function () {
  'use strict';

  /**
   * @module utils
   * @license MIT
   * @version 2017/11/28
   */

  var toString = Object.prototype.toString;

  /**
   * @function typeOf
   * @param {any} value
   * @returns {string}
   */
  function typeOf(value) {
    return toString
      .call(value)
      .replace(/\[object (\w+)\]/, '$1')
      .toLowerCase();
  }

  /**
   * @function bindEvents
   * @param {XMLHttpRequest|XDomainRequest} xhr
   */
  function bindEvents(xhr) {
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

  /**
   * @function Blank
   * @description Use a blank constructor save memory for extend function.
   */
  function Blank() {}

  var objectCreate = Object.create;
  var setPrototypeOf = Object.setPrototypeOf;

  /**
   * @function extend
   * @param {Function} superclass
   * @param {Function} subclass
   */
  function extend(superclass, subclass) {
    var superPrototype = superclass.prototype;

    if (setPrototypeOf) {
      setPrototypeOf(subclass.prototype, superPrototype);
    } else if (objectCreate) {
      subclass.prototype = objectCreate(superPrototype);
    } else {
      Blank.prototype = superPrototype;

      subclass.prototype = new Blank();
    }

    subclass.prototype.constructor = subclass;
  }

  var FPToString = Function.prototype.toString;

  // Native function RegExp
  // @see https://github.com/kgryte/regex-native-function/blob/master/lib/index.js
  var NATIVE_RE = '';

  // Use a native function as a template...
  NATIVE_RE += FPToString.call(Function);
  // Escape special RegExp characters...
  NATIVE_RE = NATIVE_RE.replace(/([.*+?^=!:$(){}|[\]\/\\])/g, '\\$1');
  // Replace any mentions of `Function` to make template generic.
  // Replace `for ...` and additional info provided in other environments, such as Rhino (see lodash).
  NATIVE_RE = NATIVE_RE.replace(/Function|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?');
  // Bracket the regex:
  NATIVE_RE = '^' + NATIVE_RE + '$';

  // Get RegExp
  NATIVE_RE = new RegExp(NATIVE_RE);

  /**
   * @function isNativeMethod
   * @param {any} value
   * @returns {boolean}
   */
  function isNativeMethod(value) {
    if (typeOf(value) !== 'function') {
      return false;
    }

    return NATIVE_RE.test(FPToString.call(value));
  }

  /**
   * @module support
   * @license MIT
   * @version 2017/11/29
   */

  var supportFetch = isNativeMethod(window.fetch);
  var supportHeaders = isNativeMethod(window.Headers);
  var supportRequest = isNativeMethod(window.Request);
  var supportResponse = isNativeMethod(window.Response);
  var supportFormData = isNativeMethod(window.FormData);
  var supportSearchParams = isNativeMethod(window.URLSearchParams);
  var supportXDomainRequest = isNativeMethod(window.XDomainRequest);
  var supportBlob = isNativeMethod(window.FileReader) && isNativeMethod(window.Blob);
  var supportIterable = isNativeMethod(window.Symbol) && 'iterator' in window.Symbol;

  /**
   * @module headers
   * @license MIT
   * @version 2017/11/28
   */

  if (!supportHeaders) {
    /**
     * @class Headers
     * @param {Object} headers
     */
    function Headers(headers) {
      this.map = {};

      if (headers instanceof Headers) {
        headers.forEach(function(value, name) {
          this.append(name, value);
        }, this);
      } else if (headers) {
        for (var name in headers) {
          if (headers.hasOwnProperty(name)) {
            this.append(name, headers[name]);
          }
        }
      }
    }

    Headers.prototype.append = function(name, value) {
      name = normalizeName(name);
      value = normalizeValue(value);

      var list = this.map[name];

      if (!list) {
        list = [];
        this.map[name] = list;
      }

      list.push(value);
    };

    Headers.prototype['delete'] = function(name) {
      delete this.map[normalizeName(name)];
    };

    Headers.prototype.get = function(name) {
      var values = this.map[normalizeName(name)];
      return values ? values[0] : null;
    };

    Headers.prototype.getAll = function(name) {
      return this.map[normalizeName(name)] || [];
    };

    Headers.prototype.has = function(name) {
      return this.map.hasOwnProperty(normalizeName(name));
    };

    Headers.prototype.set = function(name, value) {
      this.map[normalizeName(name)] = [normalizeValue(value)];
    };

    Headers.prototype.forEach = function(callback, context) {
      for (var name in this.map) {
        if (this.map.hasOwnProperty(name)) {
          this.map[name].forEach(function(value) {
            callback.call(context, value, name, this);
          }, this);
        }
      }
    };

    Headers.prototype.keys = function() {
      var items = [];

      this.forEach(function(value, name) {
        items.push(name);
      });

      return iteratorFor(items);
    };

    Headers.prototype.values = function() {
      var items = [];

      this.forEach(function(value) {
        items.push(value);
      });

      return iteratorFor(items);
    };

    Headers.prototype.entries = function() {
      var items = [];

      this.forEach(function(value, name) {
        items.push([name, value]);
      });

      return iteratorFor(items);
    };

    if (supportIterable) {
      Headers.prototype[Symbol.iterator] = Headers.prototype.entries;
    }

    function normalizeName(name) {
      if (typeOf(name) !== 'string') {
        name = String(name);
      }

      if (/[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(name)) {
        throw new TypeError('Invalid character in header field name');
      }

      return name.toLowerCase();
    }

    function normalizeValue(value) {
      if (typeOf(value) !== 'string') {
        value = String(value);
      }

      return value;
    }

    // Build a destructive iterator for the value list
    function iteratorFor(items) {
      var index = 0;
      var length = items.length;
      var iterator = {
        next: function() {
          var value = items[index++];

          return { done: index >= length, value: value };
        }
      };

      if (supportIterable) {
        iterator[Symbol.iterator] = function() {
          return iterator;
        };
      }

      return iterator;
    }

    window.Headers = Headers;
  }

  var Headers$1 = window.Headers;

  /**
   * @module body
   * @license MIT
   * @version 2017/11/28
   */

  /**
   * @class Body
   */
  function Body() {
    this.bodyUsed = false;
  }

  ['text', 'blob', 'formData', 'json', 'arrayBuffer'].forEach(function(method) {
    Body.prototype[method] = function() {
      return consumeBody(this).then(function(body) {
        return convertBody(body, method);
      });
    };
  });

  Body.prototype._initBody = function(body) {
    this._body = body;

    if (!this.headers.get('content-type')) {
      var a = bodyType(body);

      switch (a) {
        case 'text':
          this.headers.set('content-type', 'text/plain;charset=UTF-8');
          break;
        case 'blob':
          if (body && body.type) {
            this.headers.set('content-type', body.type);
          }
          break;
        case 'searchParams':
          this.headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8');
          break;
      }
    }
  };

  function consumeBody(body) {
    if (body.bodyUsed) {
      return Promise.reject(new TypeError('Already read'));
    } else {
      body.bodyUsed = true;
      return Promise.resolve(body._body);
    }
  }

  function convertBody(body, to) {
    var from = bodyType(body);

    if (body === null || body === void 0 || !from || from === to) {
      return Promise.resolve(body);
    } else if (map[to] && map[to][from]) {
      return map[to][from](body);
    } else {
      return Promise.reject(new Error('Convertion from ' + from + ' to ' + to + ' not supported'));
    }
  }

  var map = {
    text: {
      json: function(body) {
        // json --> text
        return Promise.resolve(JSON.stringify(body));
      },
      blob: function(body) {
        // blob --> text
        return blob2text(body);
      },
      searchParams: function(body) {
        // searchParams --> text
        return Promise.resolve(body.toString());
      }
    },
    json: {
      text: function(body) {
        // text --> json
        return Promise.resolve(parseJSON(body));
      },
      blob: function(body) {
        // blob --> json
        return blob2text(body).then(parseJSON);
      }
    },
    formData: {
      text: function(body) {
        // text --> formData
        return text2FormData(body);
      }
    },
    blob: {
      text: function(body) {
        // json --> blob
        return Promise.resolve(new Blob([body]));
      },
      json: function(body) {
        // json --> blob
        return Promise.resolve(new Blob([JSON.stringify(body)]));
      }
    },
    arrayBuffer: {
      blob: function(body) {
        return blob2ArrayBuffer(body);
      }
    }
  };

  function bodyType(body) {
    var type = typeOf(body);

    if (type === 'string') {
      return 'text';
    } else if (supportBlob && body instanceof Blob) {
      return 'blob';
    } else if (supportFormData && body instanceof FormData) {
      return 'formData';
    } else if (supportSearchParams && body instanceof URLSearchParams) {
      return 'searchParams';
    } else if (body && type === 'object') {
      return 'json';
    } else {
      return null;
    }
  }

  function reader2Promise(reader) {
    return new Promise(function(resolve, reject) {
      reader.onload = function() {
        resolve(reader.result);
      };

      reader.onerror = function() {
        reject(reader.error);
      };
    });
  }

  function text2FormData(body) {
    var form = new FormData();

    body
      .trim()
      .split('&')
      .forEach(function(bytes) {
        if (bytes) {
          var split = bytes.split('=');
          var name = split.shift().replace(/\+/g, ' ');
          var value = split.join('=').replace(/\+/g, ' ');

          form.append(decodeURIComponent(name), decodeURIComponent(value));
        }
      });

    return Promise.resolve(form);
  }

  function blob2ArrayBuffer(blob) {
    var reader = new FileReader();

    reader.readAsArrayBuffer(blob);

    return reader2Promise(reader);
  }

  function blob2text(blob) {
    var reader = new FileReader();

    reader.readAsText(blob);

    return reader2Promise(reader);
  }

  function parseJSON(body) {
    return JSON.parse(body);
  }

  /**
   * @module request
   * @license MIT
   * @version 2017/11/28
   */

  if (!supportRequest) {
    /**
     * @class Request
     * @param {any} input
     * @param {Object} options
     */
    function Request(input, options) {
      options = options || {};

      var body = options.body;

      if (input instanceof Request) {
        if (input.bodyUsed) {
          throw new TypeError('Already read');
        }

        this.url = input.url;
        this.credentials = input.credentials;

        if (!options.headers) {
          var headers = (this.headers = new Headers$1(input.headers));

          if (!headers.map['x-requested-with']) {
            headers.set('X-Requested-With', 'XMLHttpRequest');
          }
        }

        this.method = input.method;
        this.mode = input.mode;

        if (!body) {
          body = input._body;
          input.bodyUsed = true;
        }
      } else {
        this.url = input;
      }

      this.credentials = options.credentials || this.credentials || 'omit';

      if (options.headers || !this.headers) {
        this.headers = new Headers$1(options.headers);
      }

      this.method = (options.method || this.method || 'GET').toUpperCase();
      this.mode = options.mode || this.mode || null;
      this.referrer = null;

      if ((this.method === 'GET' || this.method === 'HEAD') && body) {
        throw new TypeError('Body not allowed for GET or HEAD requests');
      }

      this._initBody(body);
    }

    extend(Body, Request);

    Request.prototype.clone = function() {
      return new Request(this);
    };

    window.Request = Request;
  }

  var Request$1 = window.Request;

  /**
   * @module response
   * @license MIT
   * @version 2017/11/28
   */

  if (!supportResponse) {
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
      this.status = options.status;

      // @see https://stackoverflow.com/questions/10046972/msie-returns-status-code-of-1223-for-ajax-request
      if (this.status === 1223) {
        this.status = 204;
      }

      this.ok = this.status >= 200 && this.status < 300;
      this.statusText = options.statusText;
      this.headers = options.headers instanceof Headers$1 ? options.headers : new Headers$1(options.headers);
      this.url = options.url || '';

      this._initBody(body);
    }

    extend(Body, Response);

    Response.prototype.clone = function() {
      return new Response(this._bodyInit, {
        status: this.status,
        statusText: this.statusText,
        headers: new Headers$1(this.headers),
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

    window.Response = Response;
  }

  var Response$1 = window.Response;

  /**
   * @module xdr
   * @license MIT
   * @version 2017/11/28
   */

  /**
   * @function XDR
   * @param {Object} options
   * @returns {XDomainRequest}
   * @see https://msdn.microsoft.com/en-us/library/cc288060(v=VS.85).aspx
   */
  function XDR(options) {
    var xdr = new XDomainRequest();

    bindEvents(xdr);

    if (typeOf(options.timeout) === 'number') {
      xdr.timeout = options.timeout;
    }

    return xdr;
  }

  /**
   * @module xhr
   * @license MIT
   * @version 2017/11/28
   */

  /**
   * @function XDR
   * @param {Object} options
   * @returns {XMLHttpRequest}
   */
  function XHR(options) {
    var xhr = new XMLHttpRequest();

    bindEvents(xhr);

    if (options.credentials === 'include') {
      xhr.withCredentials = true;
    }

    if ('responseType' in xhr && supportBlob) {
      xhr.responseType = 'blob';
    }

    return xhr;
  }

  /**
   * @module transport
   * @license MIT
   * @version 2017/11/28
   */

  /**
   * @class Transport
   * @param {Object} options
   */
  function Transport(options) {
    if (supportXDomainRequest) {
      this.xhr = new XDR(options);
    } else {
      this.xhr = new XHR(options);
    }
  }

  Transport.prototype.on = function(type, fn) {
    this.xhr.on(type, fn);
  };

  Transport.prototype.setRequestHeader = function(name, value) {
    if (this.xhr.setRequestHeader) {
      this.xhr.setRequestHeader(name, value);
    }
  };

  Transport.prototype.open = function(method, url, async, user, password) {
    if (this.xhr.open) {
      this.xhr.open(method, url, async, user, password);
    }
  };

  Transport.prototype.send = function(data) {
    if (this.xhr.send) {
      this.xhr.send(data);
    }
  };

  Transport.prototype.abort = function() {
    if (this.xhr.abort) {
      this.xhr.abort();
    }
  };

  /**
   * @module fetch
   * @license MIT
   * @version 2017/11/28
   */

  if (!supportFetch) {
    function headers(xhr) {
      var head = new Headers$1();

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

        if (!init && init instanceof Request$1) {
          request = input;
        } else {
          request = new Request$1(input, init);
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

          resolve(new Response$1(body, options));
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

}());
