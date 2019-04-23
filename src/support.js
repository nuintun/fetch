/**
 * @module support
 * @author nuintun
 * @license MIT
 */

export var supportFormData = 'FormData' in this;
export var supportArrayBuffer = 'ArrayBuffer' in this;
export var supportSearchParams = 'URLSearchParams' in this;
export var supportBlob = 'FileReader' in this && 'Blob' in this;
export var supportIterable = 'Symbol' in this && 'iterator' in Symbol;
// IE10 support XMLHttpRequest 2.0, so ignore XDomainRequest support
export var supportXDomainRequest = 'XDomainRequest' in this && document.documentMode >>> 0 < 10;
