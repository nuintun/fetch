/**
 * @module body
 * @author nuintun
 * @license MIT
 */

import { toString, typeOf } from './utils';
import { supportArrayBuffer, supportBlob, supportFormData, supportSearchParams } from './support';

if (supportArrayBuffer) {
  var viewClasses = [
    '[object Int8Array]',
    '[object Uint8Array]',
    '[object Int16Array]',
    '[object Int32Array]',
    '[object Uint16Array]',
    '[object Uint32Array]',
    '[object Float32Array]',
    '[object Float64Array]',
    '[object Uint8ClampedArray]'
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
export default function Body() {
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
    this['<text>'] = toString.call(body);

    if (noContentType) {
      this.headers.set('Content-Type', 'text/plain;charset=UTF-8');
    }
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
