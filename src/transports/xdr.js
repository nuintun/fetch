/**
 * @module xdr
 * @license MIT
 * @version 2017/11/28
 */

import { typeOf, bindEvents } from '../utils';

/**
 * @function XDR
 * @param {Request} request
 * @returns {XDomainRequest}
 * @see https://msdn.microsoft.com/en-us/library/cc288060(v=VS.85).aspx
 */
export default function XDR(request) {
  var xdr = new XDomainRequest();

  bindEvents(xdr);

  if (typeOf(request.timeout) === 'number') {
    xdr.timeout = request.timeout;
  }

  return xdr;
}
