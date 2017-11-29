/**
 * @module xhr
 * @license MIT
 * @version 2017/11/28
 */

import { bindEvents } from '../utils';
import { supportBlob } from '../support';

/**
 * @function XDR
 * @param {Object} options
 * @returns {XMLHttpRequest}
 */
export default function XHR(options) {
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
