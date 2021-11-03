"use strict";

const AWS = require("aws-sdk");
const { RuntimeError } = require("../helpers/bts-error-utils");
const config = require("config");
const _ = require("lodash");
const spacesEndpoint = new AWS.Endpoint(config.get('aws.endpoint'));
const s3 = new AWS.S3({
  signatureVersion: config.get("aws.signature_version"),
  endpoint: spacesEndpoint,
  accessKeyId: config.get("aws.access_key"),
  secretAccessKey: config.get("aws.secret_key"),
});

module.exports = {
  uploadS3: (param, callback) => {
    let extendedParams = _.extend(
      param,
      {
        Bucket: config.get('aws.bucket_name'),
        ACL: 'public-read'
      }
    );
    s3.upload(extendedParams, (s3Err, data) => {
      if (s3Err) {
        let runtimeError = new RuntimeError(
          'An error occurred while uploading the file to S3 bucket',
          s3Err
        );
        return callback(runtimeError, {});
      }
      return callback(null, data);
    });
  },
};
