'use strict';

function createMockAzure() {
  var bytesRead = 0;
  function createBlockBlobFromStream(container, blob, stream, streamLength, cb) {
    stream.on('data', function(chunk) {
      bytesRead += chunk.length;
    });
    
    stream.on('end', function() {
      cb(null, blob);
    });
  }
  
  function getUrl(container, blob) {
    return 'https://' + container + '.mock-azure.com/' + blob;
  }
  
  function getBlobProperties(container, blob, cb) {
    cb(null, {
      container: container,
      blob: blob,
      blobType: 'block',
      etag: 'mock-etag',
      contentLength: bytesRead
    });
  }
  
  return {
    createBlockBlobFromStream: createBlockBlobFromStream,
    getUrl: getUrl,
    getBlobProperties: getBlobProperties
  };
}

exports.createBlobService = createMockAzure;