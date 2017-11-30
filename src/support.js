/**
 * @module support
 * @license MIT
 * @version 2017/11/29
 */

import { isNativeMethod } from './utils';

export var supportFormData = isNativeMethod(window.FormData);
export var supportArrayBuffer = isNativeMethod(window.ArrayBuffer);
export var supportSearchParams = isNativeMethod(window.URLSearchParams);
export var supportBlob = isNativeMethod(window.FileReader) && isNativeMethod(window.Blob);
export var supportIterable = isNativeMethod(window.Symbol) && 'iterator' in window.Symbol;
// IE10 support XMLHttpRequest 2.0, so ignore XDomainRequest support
export var supportXDomainRequest = isNativeMethod(window.VBArray) && document.documentMode < 10;
