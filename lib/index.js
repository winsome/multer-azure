'use strict';

var uuid = require('node-uuid');

function defaultBlob (req, file, cb) {
  cb(null, uuid.v4());
}

function staticValue (value) {
  return function (req, file, cb) {
    cb(null, value);
  };
}

function MulterAzure (opts) {
  switch (typeof opts.blobService) {
    case 'object': 
      this.service = opts.blobService; 
      break;
    default:
      throw new TypeError('Expected opts.blobService to be an object');
  } 
  
  switch (typeof opts.blob) {
    case 'function': 
      this.getKey = opts.blob; 
      break;
    case 'undefined': 
      this.getBlob = defaultBlob; 
      break;
    default: 
      throw new TypeError('Expected opts.key to be undefined or function');
  }
  
  switch (typeof opts.container) {
    case 'function': 
      this.getContainer = opts.container;
      break;
    case 'string': 
      this.getContainer = staticValue(opts.container); 
      break;
    default: 
      throw new TypeError('Expected opts.bucket to be a string or function');
  }
}


MulterAzure.prototype._handleFile = function _handleFile (req, file, cb) {
  throw new Error('not implemented');
};

MulterAzure.prototype._removeFile = function _removeFile (req, file, cb) {
  this.service.deleteBlob(this.container, this.filename, cb);
};

module.exports = function (opts) {
  return new MulterAzure(opts);
};