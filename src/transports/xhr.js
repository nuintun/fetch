/**
 * @module xhr
 * @license MIT
 * @version 2017/11/28
 */

import { bindEvents } from '../utils';
import { supportBlob } from '../support';

/**
 * @function XDR
 * @param {Request} request
 * @returns {XMLHttpRequest}
 */
export default function XHR(request) {
  var xhr = new XMLHttpRequest();

  bindEvents(xhr);

  if (request.credentials === 'include') {
    xhr.withCredentials = true;
  } else if (request.credentials === 'omit') {
    xhr.withCredentials = false;
  }

  if ('responseType' in xhr && supportBlob) {
    xhr.responseType = 'blob';
  }

  return xhr;
}
