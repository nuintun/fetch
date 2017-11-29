/**
 * @module body
 * @license MIT
 * @version 2017/11/28
 */

import { typeOf } from './utils';
import { supportBlob, supportFormData, supportSearchParams, supportArrayBuffer } from './support';

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

  var isDataView = function(obj) {
    return obj && DataView.prototype.isPrototypeOf(obj);
  };

  var isArrayBufferView =
    ArrayBuffer.isView ||
    function(obj) {
      return obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1;
    };
}

function consumed(body) {
  if (body.bodyUsed) {
    return Promise.reject(new TypeError('Already read'));
  }
  body.bodyUsed = true;
}

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

function readBlobAsArrayBuffer(blob) {
  var reader = new FileReader();
  var promise = fileReaderReady(reader);

  reader.readAsArrayBuffer(blob);

  return promise;
}

function readBlobAsText(blob) {
  var reader = new FileReader();
  var promise = fileReaderReady(reader);

  reader.readAsText(blob);

  return promise;
}

function readArrayBufferAsText(buf) {
  var view = new Uint8Array(buf);
  var chars = new Array(view.length);

  for (var i = 0; i < view.length; i++) {
    chars[i] = String.fromCharCode(view[i]);
  }

  return chars.join('');
}

function bufferClone(buf) {
  if (buf.slice) {
    return buf.slice(0);
  } else {
    var view = new Uint8Array(buf.byteLength);

    view.set(new Uint8Array(buf));

    return view.buffer;
  }
}

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
 */
export default function Body() {
  this.bodyUsed = false;
}

Body.prototype._initBody = function(body) {
  this._bodyInit = body;

  if (!body) {
    this._bodyText = '';
  } else if (typeOf(body) === 'string') {
    this._bodyText = body;
  } else if (supportBlob && Blob.prototype.isPrototypeOf(body)) {
    this._bodyBlob = body;
  } else if (supportFormData && FormData.prototype.isPrototypeOf(body)) {
    this._bodyFormData = body;
  } else if (supportSearchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
    this._bodyText = body.toString();
  } else if (supportArrayBuffer && supportBlob && isDataView(body)) {
    this._bodyArrayBuffer = bufferClone(body.buffer);
    // IE 10-11 can't handle a DataView body.
    this._bodyInit = new Blob([this._bodyArrayBuffer]);
  } else if (supportArrayBuffer && (ArrayBuffer.prototype.isPrototypeOf(body) || isArrayBufferView(body))) {
    this._bodyArrayBuffer = bufferClone(body);
  } else {
    throw new Error('Unsupported BodyInit type');
  }

  if (!this.headers.get('content-type')) {
    if (typeOf(body) === 'string') {
      this.headers.set('content-type', 'text/plain;charset=UTF-8');
    } else if (this._bodyBlob && this._bodyBlob.type) {
      this.headers.set('content-type', this._bodyBlob.type);
    } else if (supportSearchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
      this.headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8');
    }
  }
};

if (supportBlob) {
  Body.prototype.blob = function() {
    var rejected = consumed(this);

    if (rejected) {
      return rejected;
    }

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

  Body.prototype.arrayBuffer = function() {
    if (this._bodyArrayBuffer) {
      return consumed(this) || Promise.resolve(this._bodyArrayBuffer);
    } else {
      return this.blob().then(readBlobAsArrayBuffer);
    }
  };
}

Body.prototype.text = function() {
  var rejected = consumed(this);
  if (rejected) {
    return rejected;
  }

  if (this._bodyBlob) {
    return readBlobAsText(this._bodyBlob);
  } else if (this._bodyArrayBuffer) {
    return Promise.resolve(readArrayBufferAsText(this._bodyArrayBuffer));
  } else if (this._bodyFormData) {
    throw new Error('could not read FormData body as text');
  } else {
    return Promise.resolve(this._bodyText);
  }
};

if (supportFormData) {
  Body.prototype.formData = function() {
    return this.text().then(decode);
  };
}

Body.prototype.json = function() {
  return this.text().then(JSON.parse);
};
