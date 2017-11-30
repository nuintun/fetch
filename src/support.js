/**
 * @module support
 * @license MIT
 * @version 2017/11/29
 */

export var supportFormData = 'FormData' in window;
export var supportArrayBuffer = 'ArrayBuffer' in window;
export var supportSearchParams = 'URLSearchParams' in window;
export var supportBlob = 'FileReader' in window && 'Blob' in window;
export var supportIterable = 'Symbol' in window && 'iterator' in Symbol;
// IE10 support XMLHttpRequest 2.0, so ignore XDomainRequest support
export var supportXDomainRequest = 'VBArray' in window && document.documentMode < 10;
