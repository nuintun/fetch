/**
 * @module transport
 * @license MIT
 * @version 2017/11/28
 */

import { supportXDomainRequest } from './support';
import XDR from './transports/xdr';
import XHR from './transports/xhr';

/**
 * @class Transport
 * @param {Object} options
 */
export default function Transport(options) {
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
