/**
 * @module support
 * @license MIT
 * @version 2017/11/29
 */

import { isNativeMethod } from './utils';

export var supportFetch = isNativeMethod(window.fetch);
export var supportHeaders = isNativeMethod(window.Headers);
export var supportRequest = isNativeMethod(window.Request);
export var supportResponse = isNativeMethod(window.Response);
export var supportFormData = isNativeMethod(window.FormData);
export var supportArrayBuffer = isNativeMethod(window.ArrayBuffer);
export var supportSearchParams = isNativeMethod(window.URLSearchParams);
export var supportXMLHttpRequest = isNativeMethod(window.XMLHttpRequest);
export var supportBlob = isNativeMethod(window.FileReader) && isNativeMethod(window.Blob);
export var supportIterable = isNativeMethod(window.Symbol) && 'iterator' in window.Symbol;
