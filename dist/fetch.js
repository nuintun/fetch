/**
 * @module fetch
 * @author nuintun
 * @license MIT
 * @version 0.0.1
 * @description A pure JavaScript window.fetch polyfill.
 * @see https://github.com/nuintun/fetch#readme
 */

(function () {
  'use strict';

  if (typeof window.fetch === 'function') return;

  /**
   * @module support
   * @license MIT
   * @version 2017/11/28
   */

  var supportFormData = 'FormData' in window;
  var supportArrayBuffer = 'ArrayBuffer' in window;
  var supportSearchParams = 'URLSearchParams' in window;
  var supportBlob = 'FileReader' in window && 'Blob' in window;
  var supportIterable = 'Symbol' in window && 'iterator' in Symbol;
  // IE10 support XMLHttpRequest 2.0, so ignore XDomainRequest support
  var supportXDomainRequest = 'XDomainRequest' in window && document.documentMode >> 0 < 10;

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
    if (value === null || value === undefined) {
      return String(value);
    }

    return toString
      .call(value)
      .replace(/\[object (\w+)\]/, '$1')
      .toLowerCase();
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

  // URL includes credentials
  var AUTH_RE = /^([a-z0-9.+-]+:)?\/\/([^/:]*)(?::([^/]*))?@/i;

  /**
   * @function hasAuth
   * @description Test url is include auth credentials
   * @param {string} url
   * @returns {boolean}
   */
  function hasAuth(url) {
    return AUTH_RE.test(url);
  }

  var A = document.createElement('a');

  /**
   * @function normalizeURL
   * @description Get full url. If URL includes credentials IE will can't read a.href
   * @param {string} url
   * @param {boolean} hash
   * @returns {string}
   */
  function normalizeURL(url, hash) {
    A.href = url;

    if (!A.host) {
      A.host = location.host;
    }

    return A.href;
  }

  var PORTS = { 'http:': '80', 'https:': '443' };
  var PORT = location.port || PORTS[location.protocol];

  /**
   * @function isCORS
   * @description Test URL is CORS. If URL includes credentials IE will can't read a.href
   * @param {string} url
   * @returns {boolean}
   */
  function isCORS(url) {
    A.href = url;

    if (!A.host) return false;

    var protocol = A.protocol;

    if (protocol && protocol !== location.protocol) return true;

    var port = A.port;

    if (port && port !== PORT) return true;

    if (A.hostname !== location.hostname) return true;

    return false;
  }

  /**
   * @function assertArguments
   * @param {string} method
   * @param {number} expect
   * @param {number} actual
   */
  function assertArguments(master, method, expect, actual) {
    if (actual < expect) {
      throw new TypeError(
        "Failed to execute '" +
          method +
          "' on '" +
          master +
          "': " +
          expect +
          ' arguments required, but only ' +
          actual +
          ' present'
      );
    }
  }

  /**
   * @module headers
   * @license MIT
   * @version 2017/11/28
   */

  /**
   * @function normalizeName
   * @param {string} name
   * @returns {string}
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Headers
   */
  function normalizeName(name) {
    name = String(name);

    if (!name || /[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(name)) {
      throw new TypeError('Invalid header name');
    }

    return name.toLowerCase();
  }

  /**
   * @function normalizeValue
   * @param {string} value
   * @returns {string}
   */
  function normalizeValue(value) {
    value = String(value);

    return value;
  }

  /**
   * @function iteratorFor
   * @description Build a destructive iterator for the value list
   * @param {Array} items
   * @returns {Object}
   */
  function iteratorFor(items) {
    var index = 0;
    var length = items.length;
    var iterator = {
      next: function() {
        var done = index >= length;
        var value = !done ? items[index++] : undefined;

        return { done: done, value: value };
      }
    };

    if (supportIterable) {
      iterator[Symbol.iterator] = function() {
        return iterator;
      };
    }

    return iterator;
  }

  /**
   * @class Headers
   * @constructor
   * @param {Object} headers
   */
  function Headers(headers) {
    this['<names>'] = {};
    this['<headers>'] = {};

    if (headers === undefined) return this;

    if (headers instanceof Headers) {
      headers.forEach(function(value, name) {
        this.append(name, value);
      }, this);
    } else if (Array.isArray(headers)) {
      headers.forEach(function(sequence) {
        if (sequence.length < 2) {
          throw new TypeError('Invalid header value');
        }

        var name = sequence[0];
        var value = sequence[1];

        this.append(name, value);
      }, this);
    } else if (typeOf(headers) === 'object') {
      for (var name in headers) {
        if (headers.hasOwnProperty(name)) {
          this.append(name, headers[name]);
        }
      }
    } else {
      throw new TypeError(
        "The headers provided value is not of type '(sequence<sequence<ByteString>> or record<ByteString, ByteString>)"
      );
    }
  }

  /**
   * @method append
   * @param {string} name
   * @param {string} value
   */
  Headers.prototype.append = function(name, value) {
    assertArguments('Headers', 'append', 2, arguments.length);

    var key = normalizeName(name);

    this['<names>'][key] = name;

    var oldValue = this['<headers>'][key];

    value = normalizeValue(value);

    this['<headers>'][key] = oldValue ? oldValue + ',' + value : value;
  };

  /**
   * @method delete
   * @param {string} name
   */
  Headers.prototype['delete'] = function(name) {
    assertArguments('Headers', 'delete', 1, arguments.length);

    name = normalizeName(name);

    delete this['<headers>'][name];
    delete this['<names>'][name];
  };

  /**
   * @method get
   * @param {string} name
   * @returns {string}
   */
  Headers.prototype.get = function(name) {
    assertArguments('Headers', 'get', 1, arguments.length);

    name = normalizeName(name);

    return this.has(name) ? this['<headers>'][name] : null;
  };

  /**
   * @method has
   * @param {string} name
   * @returns {boolean}
   */
  Headers.prototype.has = function(name) {
    assertArguments('Headers', 'has', 1, arguments.length);

    return this['<headers>'].hasOwnProperty(normalizeName(name));
  };

  /**
   * @method set
   * @param {string} name
   * @param {string} value
   */
  Headers.prototype.set = function(name, value) {
    assertArguments('Headers', 'set', 2, arguments.length);

    var key = normalizeName(name);

    this['<names>'][key] = name;
    this['<headers>'][key] = normalizeValue(value);
  };

  /**
   * @method forEach
   * @param {Function} callback
   * @param {any} context
   */
  Headers.prototype.forEach = function(callback, context) {
    assertArguments('Headers', 'forEach', 1, arguments.length);

    var headers = this['<headers>'];

    for (var name in headers) {
      if (headers.hasOwnProperty(name)) {
        callback.call(context, headers[name], name, this);
      }
    }
  };

  /**
   * @method keys
   * @returns {Array}
   */
  Headers.prototype.keys = function() {
    var items = [];

    this.forEach(function(value, name) {
      items.push(name);
    });

    return iteratorFor(items);
  };

  /**
   * @method values
   * @returns {Array}
   */
  Headers.prototype.values = function() {
    var items = [];

    this.forEach(function(value) {
      items.push(value);
    });

    return iteratorFor(items);
  };

  /**
   * @method entries
   * @returns {Array}
   */
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

  /**
   * @module body
   * @license MIT
   * @version 2017/11/28
   */

  if (supportArrayBuffer) {
    var viewClasses = [
      '[object Int8Array]',
      '[object Uint8Array]',
      '[object Uint8ClampedArray]',
      '[object Int16Array]',
      '[object Uint16Array]',
      '[object Int32Array]',
      '[object Uint32Array]',
      '[object Float32Array]',
      '[object Float64Array]'
    ];

    /**
     * @function isDataView
     * @param {Object} object
     * @returns {boolean}
     */
    var isDataView = function(object) {
      return object && DataView.prototype.isPrototypeOf(object);
    };

    /**
     * @function isArrayBufferView
     * @param {Object} object
     * @returns {boolean}
     */
    var isArrayBufferView =
      ArrayBuffer.isView ||
      function(object) {
        return object && viewClasses.indexOf(toString.call(object)) > -1;
      };
  }

  /**
   * @function consumed
   * @param {Body} body
   */
  function consumed(body) {
    if (body.bodyUsed) {
      throw new TypeError('Already read');
    }

    body.bodyUsed = true;
  }

  /**
   * @function fileReaderReady
   * @param {FileReader} reader
   * @returns {Promise}
   */
  function fileReaderReady(reader) {
    return new Promise(function(resolve, reject) {
      reader.onload = function() {
        resolve(reader.result);
      };

      reader.onerror = function() {
        reject(reader.error);
      };
    });
  }

  /**
   * @function readBlobAsArrayBuffer
   * @param {Blob} blob
   * @returns {Promise}
   */
  function readBlobAsArrayBuffer(blob) {
    var reader = new FileReader();
    var promise = fileReaderReady(reader);

    reader.readAsArrayBuffer(blob);

    return promise;
  }

  /**
   * @function readBlobAsText
   * @param {Blob} blob
   * @returns {Promise}
   */
  function readBlobAsText(blob) {
    var reader = new FileReader();
    var promise = fileReaderReady(reader);

    reader.readAsText(blob);

    return promise;
  }

  /**
   * @function readArrayBufferAsText
   * @param {ArrayBuffer} buffer
   * @returns {string}
   */
  function readArrayBufferAsText(buffer) {
    var view = new Uint8Array(buffer);
    var chars = new Array(view.length);

    for (var i = 0; i < view.length; i++) {
      chars[i] = String.fromCharCode(view[i]);
    }

    return chars.join('');
  }

  /**
   * @function bufferClone
   * @param {ArrayBuffer} buffer
   * @returns {ArrayBuffer}
   */
  function bufferClone(buffer) {
    if (buffer.slice) {
      return buffer.slice(0);
    } else {
      var view = new Uint8Array(buffer.byteLength);

      view.set(new Uint8Array(buffer));

      return view.buffer;
    }
  }

  /**
   * @function decode
   * @param {string} body
   * @returns {FormData}
   */
  function decode(body) {
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

    return form;
  }

  /**
   * @class Body
   * @constructor
   */
  function Body() {
    this.bodyUsed = false;
  }

  /**
   * @private
   * @method <body>
   * @description Init body
   * @param {any} body
   */
  Body.prototype['<body>'] = function(body) {
    this.body = body;

    var noContentType = !this.headers.has('Content-Type');

    if (typeOf(body) === 'string') {
      this['<text>'] = body;

      if (noContentType) {
        this.headers.set('Content-Type', 'text/plain;charset=UTF-8');
      }
    } else if (supportBlob && Blob.prototype.isPrototypeOf(body)) {
      this['<blob>'] = body;

      if (noContentType && this['<blob>'].type) {
        this.headers.set('Content-Type', this['<blob>'].type);
      }
    } else if (supportFormData && FormData.prototype.isPrototypeOf(body)) {
      this['<formData>'] = body;
    } else if (supportSearchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
      this['<text>'] = body.toString();

      if (noContentType) {
        this.headers.set('Content-Type', 'application/x-www-form-urlencoded;charset=UTF-8');
      }
    } else if (supportArrayBuffer && supportBlob && isDataView(body)) {
      this['<arrayBuffer>'] = bufferClone(body.buffer);
      // IE 10-11 can't handle a DataView body.
      this.body = new Blob([this['<arrayBuffer>']]);
    } else if (supportArrayBuffer && (ArrayBuffer.prototype.isPrototypeOf(body) || isArrayBufferView(body))) {
      this['<arrayBuffer>'] = bufferClone(body);
    } else {
      this.body = null;
      this['<text>'] = '';
    }
  };

  if (supportBlob) {
    /**
     * @method blob
     * @returns {Promise}
     */
    Body.prototype.blob = function() {
      consumed(this);

      if (this['<blob>']) {
        return Promise.resolve(this['<blob>']);
      } else if (this['<arrayBuffer>']) {
        return Promise.resolve(new Blob([this['<arrayBuffer>']]));
      } else if (this['<formData>']) {
        throw new Error('Could not read FormData body as blob');
      } else {
        return Promise.resolve(new Blob([this['<text>']]));
      }
    };

    /**
     * @method arrayBuffer
     * @returns {Promise}
     */
    Body.prototype.arrayBuffer = function() {
      if (this['<arrayBuffer>']) {
        consumed(this);

        return Promise.resolve(this['<arrayBuffer>']);
      } else {
        return this.blob().then(readBlobAsArrayBuffer);
      }
    };
  }

  /**
   * @method text
   * @returns {Promise}
   */
  Body.prototype.text = function() {
    consumed(this);

    if (this['<blob>']) {
      return readBlobAsText(this['<blob>']);
    } else if (this['<arrayBuffer>']) {
      return Promise.resolve(readArrayBufferAsText(this['<arrayBuffer>']));
    } else if (this['<formData>']) {
      throw new Error('Could not read FormData body as text');
    } else {
      return Promise.resolve(this['<text>']);
    }
  };

  if (supportFormData) {
    /**
     * @method formData
     * @returns {Promise}
     */
    Body.prototype.formData = function() {
      return this.text().then(decode);
    };
  }

  /**
   * @method json
   * @returns {Promise}
   */
  Body.prototype.json = function() {
    return this.text().then(JSON.parse);
  };

  /**
   * @module request
   * @license MIT
   * @version 2017/11/28
   */

  // HTTP methods whose capitalization should be normalized
  var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT'];

  /**
   * @function normalizeMethod
   * @param {string} method
   * @returns {string}
   */
  function normalizeMethod(method) {
    method = String(method);

    var upcased = method.toUpperCase();

    return methods.indexOf(upcased) > -1 ? upcased : method;
  }

  /**
   * @function normalizeMode
   * @param {string} mode
   * @returns {string}
   */
  function normalizeMode(mode) {
    switch (mode) {
      case 'no-cors':
      case 'navigate':
      case 'same-origin':
        return mode;
      default:
        return 'cors';
    }
  }

  /**
   * @class Request
   * @constructor
   * @param {Request|string} input
   * @param {Object} options
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Request
   */
  function Request(input, options) {
    var length = arguments.length;

    if (length < 1) {
      throw new TypeError('Request construct need 1 argument required, but only ' + length + ' present');
    }

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
      this.mode = normalizeMode(options.mode);
      this.method = options.hasOwnProperty('method') ? normalizeMethod(options.method) : 'GET';

      if ((this.method === 'GET' || this.method === 'HEAD') && body) {
        throw new TypeError('Request with GET/HEAD method cannot have body');
      }

      this.credentials = options.credentials || 'omit';
      this.redirect = options.redirect || 'follow';
      this.referrer = options.referrer || 'about:client';
      this.referrerPolicy = options.referrerPolicy || '';
      this.headers = new Headers(options.headers || {});
    }

    this['<body>'](body);
  }

  extend(Body, Request);

  /**
   * @method clone
   * @returns {Request}
   */
  Request.prototype.clone = function() {
    return new Request(this, { body: this.body });
  };

  /**
   * @module response
   * @license MIT
   * @version 2017/11/28
   */

  var redirectStatuses = [301, 302, 303, 307, 308];

  /**
   * @class Response
   * @constructor
   * @param {any} body
   * @param {Object} options
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Response
   */
  function Response(body, options) {
    Body.call(this);

    options = options || {};

    var status = options.hasOwnProperty('status') ? options.status >> 0 : 200;

    // https://stackoverflow.com/questions/10046972/msie-returns-status-code-of-1223-for-ajax-request
    if (status === 1223) {
      status = 204;
    }

    if (status < 200 || status > 599) {
      throw new TypeError('The response status provided (' + status + ') is outside the range [200, 599]');
    }

    this.status = status;
    this.ok = status >= 200 && status < 300;
    this.headers = new Headers(options.headers);
    this.statusText = options.statusText || (status === 200 ? 'OK' : '');

    this['<body>'](body);
  }

  extend(Body, Response);

  /**
   * @property url
   */
  Response.prototype.url = '';

  /**
   * @property type
   */
  Response.prototype.type = 'default';

  /**
   * @property redirected
   */
  Response.prototype.redirected = false;

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
      throw new RangeError('Invalid redirect status code');
    }

    return new Response(null, { status: status, headers: { location: url } });
  };

  /**
   * @module fetch
   * @license MIT
   * @version 2017/11/28
   */

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
            xhr.setRequestHeader(this._headerNames[name], value);
          }, headers);
        }

        xhr.send(request.body === undefined ? null : request.body);
      } catch (error) {
        cleanXHR(xhr);
        reject(error);
      }
    });
  }

  window.fetch = fetch;
  window.Headers = Headers;
  window.Request = Request;
  window.Response = Response;

}());
