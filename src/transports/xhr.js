/**
 * @module xhr
 * @license MIT
 * @version 2017/11/28
 */

var supportBlob = 'Blob' in window;

/**
 * @function XDR
 * @param {Object} options
 * @returns {XMLHttpRequest}
 */
export function XHR(options) {
  var xhr = new XMLHttpRequest();

  'load,error,timeout'.replace(/\w+/g, function(method) {
    xhr['on' + method] = function() {
      if (events[method]) {
        events[method](xhr);
      }
    };
  });

  var events = {};

  xhr.on = function(type, fn) {
    events[type] = fn;
  };

  xhr.onabort = function() {
    events = {};
  };

  if (options.credentials === 'include') {
    xhr.withCredentials = true;
  }

  if ('responseType' in xhr && supportBlob) {
    xhr.responseType = 'blob';
  }

  return xhr;
}
