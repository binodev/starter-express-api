'use strict';

const aws = require('aws-sdk');
const uuid = require('uuid');
const multer = require('multer');
const multerS3 = require('multer-s3-transform');
var sharp = require('sharp');

const s3Options = {
  region: process.env.S3_REGION,
  secretAccessKey: process.env.S3_ACCESS_SECRET,
  accessKeyId: process.env.S3_ACCESS_KEY,
  bucket: process.env.S3_BUCKET,
};

aws.config.update({
  region: s3Options.region,
  accessKeyId: s3Options.accessKeyId,
  secretAccessKey: s3Options.secretAccessKey
});

const s3 = new aws.S3();

var uploadFile = multer({
  storage: multerS3({
    s3: s3,
    bucket: s3Options.bucket,
    shouldTransform: function (req, file, cb) {
      console.log(file.mimetype);
      cb(null, /^image/i.test(file.mimetype))
    },
    metadata: function (req, file, cb) {
      cb(null, {fieldName: file.fieldname});
    },
    key: function (req, file, cb) {
      let extension = file.originalname.split('.').pop();
      cb(null, uuid.v4() + '.' + extension)
    },
    transforms: [
      {
        id: 'original',
        key: function (req, file, cb) {
          let extension = file.originalname.split('.').pop();
          cb(null, uuid.v4() + '.webp')
        },
        transform: function (req, file, cb) {
          cb(null, sharp().resize({width: 1200, withoutEnlargement: true}).webp({quality: 80}))
        }
      }
    ]
  })
})

const saveFile = (name, data, callback) => {
  var params = {
    Bucket: s3Options.bucket,
    Key: name,
    Body: Buffer.from(data, "base64")
  };

  s3.upload(params, callback);
};

module.exports = {
  uploadFile,
  saveFile
};