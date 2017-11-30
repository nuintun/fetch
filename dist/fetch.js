(function () {
  'use strict';

  if (window.fetch) return;

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

  var host = location.host;
  var A = document.createElement('a');

  /**
   * @function normalizeURL
   * @description Get full url
   * @param {string} href
   */
  function normalizeURL(href) {
    A.href = href;

    if (!A.host) {
      A.host = host;
    }

    return A.href;
  }

  /**
   * @module support
   * @license MIT
   * @version 2017/11/29
   */

  var supportFormData = 'FormData' in window;
  var supportArrayBuffer = 'ArrayBuffer' in window;
  var supportSearchParams = 'URLSearchParams' in window;
  var supportBlob = 'FileReader' in window && 'Blob' in window;
  var supportIterable = 'Symbol' in window && 'iterator' in Symbol;
  // IE10 support XMLHttpRequest 2.0, so ignore XDomainRequest support
  var supportXDomainRequest = 'VBArray' in window && document.documentMode < 10;

  /**
   * @module headers
   * @license MIT
   * @version 2017/11/28
   */

  /**
   * @function normalizeName
   * @param {string} name
   * @returns {string}
   */
  function normalizeName(name) {
    if (typeOf(name) !== 'string') {
      name = String(name);
    }

    if (/[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(name)) {
      throw new TypeError('Invalid character in header field name');
    }

    return name.toLowerCase();
  }

  /**
   * @function normalizeValue
   * @param {string} value
   * @returns {string}
   */
  function normalizeValue(value) {
    if (typeOf(value) !== 'string') {
      value = String(value);
    }

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
    this.map = {};
    this._headerNames = {};

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

  /**
   * @method append
   * @param {string} name
   * @param {string} value
   */
  Headers.prototype.append = function(name, value) {
    var key = normalizeName(name);

    this._headerNames[key] = name;

    var oldValue = this.map[key];

    value = normalizeValue(value);

    this.map[key] = oldValue ? oldValue + ',' + value : value;
  };

  /**
   * @method delete
   * @param {string} name
   */
  Headers.prototype['delete'] = function(name) {
    name = normalizeName(name);

    delete this.map[name];
    delete this._headerNames[name];
  };

  /**
   * @method get
   * @param {string} name
   * @returns {string}
   */
  Headers.prototype.get = function(name) {
    name = normalizeName(name);

    return this.has(name) ? this.map[name] : null;
  };

  /**
   * @method has
   * @param {string} name
   * @returns {boolean}
   */
  Headers.prototype.has = function(name) {
    return this.map.hasOwnProperty(normalizeName(name));
  };

  /**
   * @method set
   * @param {string} name
   * @param {string} value
   */
  Headers.prototype.set = function(name, value) {
    var key = normalizeName(name);

    this._headerNames[key] = name;
    this.map[key] = normalizeValue(value);
  };

  /**
   * @method forEach
   * @param {Function} callback
   * @param {any} context
   */
  Headers.prototype.forEach = function(callback, context) {
    for (var name in this.map) {
      if (this.map.hasOwnProperty(name)) {
        callback.call(context, this.map[name], name, this);
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

  window.Headers = Headers;

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
     */
    var isDataView = function(object) {
      return object && DataView.prototype.isPrototypeOf(object);
    };

    /**
     * @function isArrayBufferView
     * @param {Object} object
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
   * @method _initBody
   * @private
   * @param {any} body
   */
  Body.prototype._initBody = function(body) {
    this.body = body;

    var noContentType = !this.headers.has('Content-Type');

    if (typeOf(body) === 'string') {
      this._bodyText = body;

      if (noContentType) {
        this.headers.set('Content-Type', 'text/plain;charset=UTF-8');
      }
    } else if (supportBlob && Blob.prototype.isPrototypeOf(body)) {
      this._bodyBlob = body;

      if (noContentType && this._bodyBlob.type) {
        this.headers.set('Content-Type', this._bodyBlob.type);
      }
    } else if (supportFormData && FormData.prototype.isPrototypeOf(body)) {
      this._bodyFormData = body;
    } else if (supportSearchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
      this._bodyText = body.toString();

      if (noContentType) {
        this.headers.set('Content-Type', 'application/x-www-form-urlencoded;charset=UTF-8');
      }
    } else if (supportArrayBuffer && supportBlob && isDataView(body)) {
      this._bodyArrayBuffer = bufferClone(body.buffer);
      // IE 10-11 can't handle a DataView body.
      this.body = new Blob([this._bodyArrayBuffer]);
    } else if (supportArrayBuffer && (ArrayBuffer.prototype.isPrototypeOf(body) || isArrayBufferView(body))) {
      this._bodyArrayBuffer = bufferClone(body);
    } else {
      this.body = null;
    }
  };

  if (supportBlob) {
    /**
     * @method blob
     * @returns {Promise}
     */
    Body.prototype.blob = function() {
      consumed(this);

      if (this._bodyBlob) {
        return Promise.resolve(this._bodyBlob);
      } else if (this._bodyArrayBuffer) {
        return Promise.resolve(new Blob([this._bodyArrayBuffer]));
      } else if (this._bodyFormData) {
        throw new Error('Could not read FormData body as blob');
      } else {
        return Promise.resolve(new Blob([this._bodyText]));
      }
    };

    /**
     * @method arrayBuffer
     * @returns {Promise}
     */
    Body.prototype.arrayBuffer = function() {
      if (this._bodyArrayBuffer) {
        consumed(this);

        return Promise.resolve(this._bodyArrayBuffer);
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

    if (this._bodyBlob) {
      return readBlobAsText(this._bodyBlob);
    } else if (this._bodyArrayBuffer) {
      return Promise.resolve(readArrayBufferAsText(this._bodyArrayBuffer));
    } else if (this._bodyFormData) {
      throw new Error('Could not read FormData body as text');
    } else {
      return Promise.resolve(this._bodyText);
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
    var upcased = method.toUpperCase();

    return methods.indexOf(upcased) > -1 ? upcased : method;
  }

  /**
   * @class Request
   * @constructor
   * @param {Request|string} input
   * @param {Object} options
   */
  function Request(input, options) {
    Body.call(this);

    options = options || {};

    var body = options.body;

    if (input instanceof Request) {
      if (input.bodyUsed) {
        throw new TypeError('Already read');
      }

      this.url = input.url;
      this.credentials = input.credentials;

      if (!options.headers) {
        this.headers = new Headers(input.headers);
      }

      this.method = input.method;
      this.mode = input.mode;

      if (!body && input.body !== null) {
        body = input.body;
        input.bodyUsed = true;
      }
    } else {
      this.url = String(input);
    }

    this.credentials = options.credentials || this.credentials || 'omit';

    if (options.headers || !this.headers) {
      this.headers = new Headers(options.headers);
    }

    this.method = normalizeMethod(options.method || this.method || 'GET');
    this.mode = options.mode || this.mode || null;
    this.referrer = null;

    if ((this.method === 'GET' || this.method === 'HEAD') && body) {
      throw new TypeError('Request with GET/HEAD method cannot have body');
    }

    this._initBody(body);
  }

  extend(Body, Request);

  /**
   * @method clone
   * @returns {Request}
   */
  Request.prototype.clone = function() {
    return new Request(this, { body: this.body });
  };

  window.Request = Request;

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
   */
  function Response(body, options) {
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
    if (redirectStatuses.indexOf(status) === -1) {
      throw new RangeError('Invalid status code');
    }

    return new Response(null, { status: status, headers: { location: url } });
  };

  window.Response = Response;

  /**
   * @module fetch
   * @license MIT
   * @version 2017/11/28
   */

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
   * @param {Headers} headers
   * @param {string} url
   * @returns {string}
   */
  function responseURL(xhr, headers, url) {
    return 'responseURL' in xhr ? xhr.responseURL : headers.get('X-Request-URL') || normalizeURL(url);
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
    xhr.send(request.body === undefined ? null : request.body);
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
        var headers = parseHeaders(xhr);
        var body = 'response' in xhr ? xhr.response : xhr.responseText;
        var options = {
          headers: headers,
          status: xhr.status,
          statusText: xhr.statusText,
          url: responseURL(xhr, headers, request.url)
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
        var headers = request.headers;

        headers.forEach(function(value, name) {
          xhr.setRequestHeader(this._headerNames[name], value);
        }, headers);
      }

      if (useXDomainRequest) {
        setTimeout(function() {
          send(xhr, request);
        }, 0);
      } else {
        send(xhr, request);
      }
    });
  }

  window.fetch = fetch;

}());
