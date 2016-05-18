'use strict';

var uuid = require('node-uuid');
var BluePromise = require('bluebird');

function defaultBlob (req, file) {
  return BluePromise.resolve(uuid.v4());
}

function staticValue (value) {
  return function (req, file) {
    return BluePromise.resolve(value);
  };
}

function MulterAzure (opts) {
  switch (typeof opts.blobService) {
    case 'object': 
      this.blobService = opts.blobService; 
      break;
    default:
      throw new TypeError('Expected opts.blobService to be an object');
  } 
  
  switch (typeof opts.blob) {
    case 'function': 
      this.getBlob = BluePromise.promisify(opts.blob); 
      break;
    case 'undefined': 
      this.getBlob = defaultBlob; 
      break;
    default: 
      throw new TypeError('Expected opts.key to be undefined or function');
  }
  
  switch (typeof opts.container) {
    case 'function': 
      this.getContainer = BluePromise.promisify(opts.container);
      break;
    case 'string': 
      this.getContainer = staticValue(opts.container); 
      break;
    default: 
      throw new TypeError('Expected opts.bucket to be a string or function');
  }
}

MulterAzure.prototype._handleFile = function _handleFile (req, file, cb) {
  var self = this;
  BluePromise.all([
    this.getContainer(req, file), 
    this.getBlob(req, file)
  ]).
  spread(function(container, blob) {
    self.blobService.createBlockBlobFromStream(container, blob, file.stream, file.stream.length, function(error, azureBlob) {
      if(error) {
        return cb(error);
      }
      
      self.blobService.getBlobProperties(container, azureBlob, function(error, properties) {
        if(error) {
          return cb(error);
        }
        
        var getUrl = self.blobService.getUrl || self.blobService.getBlobUrl; // getBlobUrl was deprecated in favor of getUrl in v0.1.0
        
        cb(null, {
          container: properties.container,
          blob: properties.blob,
          blobType: properties.blobType,
          etag: properties.etag,
          size: properties.contentLength,
          metadata: properties.metadata,
          url: getUrl(container, blob)
        });  
      });
    });
  });
};

MulterAzure.prototype._removeFile = function _removeFile (req, file, cb) {
  this.service.deleteBlob(this.container, this.filename, cb);
};

module.exports = function (opts) {
  return new MulterAzure(opts);
};