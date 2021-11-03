'use strict';

const fs = require('fs');
const _ = require("lodash");
const async = require('async');
const config = require("config");
const { Review } = require('../models');
const { QueryHelper } = require('../helpers/bts-query-utils');
const { ObjectId } = require("mongoose").Types;
const { uploadS3 } = require("../helpers/AWSHelper");
const { ValidationError, RuntimeError, ResourceNotFoundError } = require('../helpers/bts-error-utils');

/**
 * Creates an instance of review service
 */
class ReviewService {

  constructor(logger) {
    this.logger = logger;
  }

  /**
   * Creates a new review
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  addReview(swaggerParams, res, next) {
    let email = swaggerParams.email.value;
    let profilePic = swaggerParams.profile_img.value;
    let reviewDetails = new Review({
      _id: new ObjectId(),
      name: swaggerParams.name.value,
      email: swaggerParams.email.value,
      designation: swaggerParams.designation.value,
      message: swaggerParams.message.value,
      rate: swaggerParams.rate.value,
      is_highlighted: swaggerParams.is_highlighted.value,
      is_deleted: swaggerParams.is_deleted.value != undefined ? swaggerParams.is_deleted.value : true
    });
    async.parallel(
      [
        (cb) => {
          CheckReview({ email }, (reviewCheckError, reviewCheckResult) => {
            if (reviewCheckError) {
              return cb(reviewCheckError);
            }
            if (!_.isEmpty(reviewCheckResult)) {
              let validationError = new ValidationError(
                "The user with email " + email + " already given review"
              );
              return cb(validationError);
            }
            return cb();
          });
        },
        (cb) => {
          if (!_.isEmpty(profilePic)) {
            _uploadToS3(
              profilePic,
              reviewDetails._id,
              (uploadError, uploadFile) => {
                if (uploadError) {
                  return cb(uploadError);
                }
                return cb(null, uploadFile.Location);
              }
            );
          } else {
            return cb();
          }
        },
      ],
      (parallelError, parallelResult) => {
        if (parallelError) {
          return next(parallelError);
        }
        let uploadUrl = parallelResult[1];
        reviewDetails.profile_img = uploadUrl,
        reviewDetails.save((saveError, saveReview) => {
          if (saveError) {
            let runtimeError = new RuntimeError(
              'There was an error while adding a new review',
              saveError
            );
            return next(runtimeError);
          }
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 201;
          res.end(JSON.stringify(saveReview));
        });
      });
  }

  /**
   * Get all reviews
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  getReviewList(swaggerParams, res, next) {
    let query = QueryHelper.getQuery(swaggerParams);
    let keyword = query.keyword;
    if (keyword) {
      query.$or = [
        { name: { $regex: new RegExp(".*" + keyword + ".*", "i") } },
        { designation: { $regex: new RegExp(".*" + keyword + ".*", "i") } },
        { message: { $regex: new RegExp(".*" + keyword + ".*", "i") } }
      ];
      delete query.keyword;
    }
    Review.find(query)
    .sort({'created_at': 1})
    .exec((reviewFindError, reviewRecords) => {
      res.setHeader('Content-Type', 'application/json');
      if (reviewFindError) {
        let runtimeError = new RuntimeError(
          'There was an error while fetching all reviews',
          reviewFindError
        );
        return next(runtimeError);
      }
      if (_.isEmpty(reviewRecords)) {
        res.statusCode = 204;
        return res.end();
      }
      res.statusCode = 200;
      res.end(JSON.stringify(reviewRecords));
    });
  }

  /**
   * Get review with given review_id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  getReview(swaggerParams, res, next) {
    let reviewId = swaggerParams.review_id.value;
    CheckReview({ _id: reviewId }, (reviewCheckError, reviewCheckResult) => {
      if (reviewCheckError) {
        return next(reviewCheckError);
      }
      if (_.isEmpty(reviewCheckResult)) {
        let resourceNotFoundOErrorObj = new ResourceNotFoundError(
          "The review with id " + reviewId + " does not exists"
        );
        return next(resourceNotFoundOErrorObj);
      }
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(reviewCheckResult));
    });
  }

  /**
   * Update review with given review_id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  updateReview(swaggerParams, res, next) {
    let reviewId = swaggerParams.review_id.value;
    let review = swaggerParams;
    CheckReview({ _id: reviewId }, (reviewCheckError, reviewCheckResult) => {
      if (reviewCheckError) {
        return next(reviewCheckError);
      }
      if (_.isEmpty(reviewCheckResult)) {
        let resourceNotFoundOErrorObj = new ResourceNotFoundError(
          "The review with id " + reviewId + " does not exists"
        );
        return next(resourceNotFoundOErrorObj);
      }
      reviewCheckResult.is_highlighted = review.is_highlighted.value != undefined ? review.is_highlighted.value : reviewCheckResult.is_highlighted;
      reviewCheckResult.is_deleted = review.is_deleted.value != undefined ? review.is_deleted.value : reviewCheckResult.is_deleted;
      reviewCheckResult.save((saveError, saveReview) => {
        if (saveError) {
          let runtimeError = new RuntimeError(
            'There was an error while updating a review',
            saveError
          );
          return next(runtimeError);
        }
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify(saveReview));
      });
    });
  }

  /**
   * Delete review with given review_id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  deleteReview(swaggerParams, res, next) {
    let reviewId = swaggerParams.review_id.value;
    CheckReview({ _id: reviewId }, (reviewCheckError, reviewCheckResult) => {
      if (reviewCheckError) {
        return next(reviewCheckError);
      }
      if (_.isEmpty(reviewCheckResult)) {
        let resourceNotFoundOErrorObj = new ResourceNotFoundError(
          "The review with id " + reviewId + " does not exists"
        );
        return next(resourceNotFoundOErrorObj);
      }
      reviewCheckResult.remove((removeError, removeReview) => {
        if (removeError) {
          let runtimeError = new RuntimeError(
            'There was an error while removing a review',
            removeError
          );
          return cb(runtimeError);
        }
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify(removeReview));
      });
    });   
  }
}

/**
 * Checks for review existence
 *
 * @param {Object} query - The review findOne query
 * @param {function} callback - The callback used to pass control to the next action/middleware
 *
 * @private
 */
function CheckReview(query, callback) {
  Review.findOne(query)
    .exec((reviewFindOneError, reviewRecord) => {
      if (reviewFindOneError) {
        let runtimeErrorObj = new RuntimeError(
          'There was an error while finding review',
          reviewFindOneError
        );
        return callback(runtimeErrorObj);
      }
      return callback(null, reviewRecord);
    });
}

/**
 * Handles the file upload to S3
 *
 * @param {String} file - The file to upload
 * @param {String} foodTypeId - The foodTypeId for uploading file
 * @param {function} callback - The callback used to pass control to the next action/middleware
 *
 * @private
 */
function _uploadToS3(file, foodTypeId, callback) {
  let extention = file.originalname.split(".").pop();
  let fileName = new Date().getTime() + "." + extention;
  let awsFileLocation = "food-types/" + foodTypeId + "/" + fileName;
  let params = {
    Key: awsFileLocation,
    Body: file.buffer,
    ContentType: file.mimetype,
  };
  uploadS3(params, callback);
}

module.exports = ReviewService;