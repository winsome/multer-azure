'use strict';

var fs = require('fs');
var path = require('path');
var multer = require('multer');
var stream = require('stream');
var FormData = require('form-data');
var onFinished = require('on-finished')
var multerAzure = require('../lib');
var mockAzure = require('./support/mockAzure');

function submitForm (multer, form, cb) {
  form.getLength(function (err, length) {
    if (err) {
      return cb(err);
    }

    var req = new stream.PassThrough();
    req.complete = false;
    form.once('end', function () {
      req.complete = true;
    });

    form.pipe(req);
    req.headers = {
      'content-type': 'multipart/form-data; boundary=' + form.getBoundary(),
      'content-length': length
    };

    multer(req, null, function(err) {
      onFinished(req, function () { cb(err, req); })
    });
  });
}

describe('multer-azure', function() {
  
  it('is exposed as a function', function() {
    expect(typeof multerAzure).toBe('function');
  });
    
  it('uploads a file', function(done) {
    var container = 'test';
    var blobService = mockAzure.createBlobService();
    var form = new FormData();
    var storage = multerAzure({ blobService: blobService, container: container });
    var upload = multer({ storage: storage });
    var parser = upload.single('image');
    var image = fs.createReadStream(path.join(__dirname, 'support', 'files', 'blob.jpg'));
    
    form.append('name', 'Multer');
    form.append('image', image);
    
    submitForm(parser, form, function(err, req) {
      expect(err).not.toBeDefined();
      expect(req.body.name).toBe('Multer');
      
      expect(req.file.blob).toMatch(/[0-9A-Za-z]{8}-([0-9A-Za-z]{4}-){3}[0-9A-Za-z]{12}/);
      expect(req.file.blobType).toBe('block');
      expect(req.file.container).toBe(container);
      expect(req.file.fieldname).toBe('image');
      expect(req.file.originalname).toBe('blob.jpg');
      expect(req.file.size).toBe(5344);
      expect(req.file.etag).toBe('mock-etag');
      expect(req.file.url).toContain('https://' + container + '.mock-azure.com/');
      
      done();
    });
  });
});
