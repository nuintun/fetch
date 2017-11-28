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
export function XDR(options) {
  var xdr = new XDomainRequest();

  'load,error,timeout'.replace(/\w+/g, function(method) {
    xdr['on' + method] = function() {
      if (events[method]) {
        events[method](xdr);
      }
    };
  });

  var events = {};

  xdr.on = function(type, fn) {
    events[type] = fn;
  };

  xdr.onabort = function() {
    events = {};
  };

  if (typeof options.timeout === 'number') {
    xdr.timeout = options.timeout;
  }

  return xdr;
}
