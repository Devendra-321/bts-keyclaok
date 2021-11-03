'use strict';

const _ = require("lodash");
const async = require('async');
const { CateringEnquiry } = require('../models');
const { QueryHelper } = require('../helpers/bts-query-utils');
const { ObjectId } = require("mongoose").Types;
const { ValidationError, RuntimeError, ResourceNotFoundError } = require('../helpers/bts-error-utils');

/**
 * Creates an instance of enquiry service
 */
class CateringEnquiryService {

  constructor(logger) {
    this.logger = logger;
  }

  /**
   * Creates a new enquiry
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   addEnquiry(swaggerParams, res, next) {
    let enquiry = swaggerParams.enquiry.value;
    let enquiryDetails = new CateringEnquiry({
      name: enquiry.name,
      mobile: enquiry.mobile,
      address: enquiry.address,
      email: enquiry.email,
      postcode: enquiry.postcode,
      item_id: enquiry.item_id,
      message: enquiry.message,
      is_deleted: false,
    });
    enquiryDetails.save((saveError, saveEnquiry) => {
      if (saveError) {
        let runtimeError = new RuntimeError(
          'There was an error while adding a new enquiry',
          saveError
        );
        return next(runtimeError);
      }
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 201;
      res.end(JSON.stringify(saveEnquiry));
    });
  }

  /**
   * Get all enquiry
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   getEnquiryList(swaggerParams, res, next) {
    let query = QueryHelper.getQuery(swaggerParams);
    let keyword = query.keyword;
    if (keyword) {
      query.$or = [
        { name: { $regex: new RegExp(".*" + keyword + ".*", "i") } },
        { address: { $regex: new RegExp(".*" + keyword + ".*", "i") } },
        { postcode: { $regex: new RegExp(".*" + keyword + ".*", "i") } },
        { message: { $regex: new RegExp(".*" + keyword + ".*", "i") } }
      ];
      delete query.keyword;
    }
    CateringEnquiry.find(query)
    .sort({'created_at': 1})
    .exec((enquiryFindError, enquiryRecords) => {
      res.setHeader('Content-Type', 'application/json');
      if (enquiryFindError) {
        let runtimeError = new RuntimeError(
          'There was an error while fetching all enquiry',
          enquiryFindError
        );
        return next(runtimeError);
      }
      if (_.isEmpty(enquiryRecords)) {
        res.statusCode = 204;
        return res.end();
      }
      res.statusCode = 200;
      res.end(JSON.stringify(enquiryRecords));
    });
  }

  /**
   * Get enquiry with given enquiry_id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   getEnquiry(swaggerParams, res, next) {
    let enquiryId = swaggerParams.enquiry_id.value;
    CheckCateringEnquiry({ _id: enquiryId }, (enquiryCheckError, enquiryCheckResult) => {
      if (enquiryCheckError) {
        return next(enquiryCheckError);
      }
      if (_.isEmpty(enquiryCheckResult)) {
        let resourceNotFoundOErrorObj = new ResourceNotFoundError(
          "The enquiry with id " + enquiryId + " does not exists"
        );
        return next(resourceNotFoundOErrorObj);
      }
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(enquiryCheckResult));
    });
  }

  /**
   * Update enquiry with given enquiry_id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   updateEnquiry(swaggerParams, res, next) {
    let enquiryId = swaggerParams.enquiry_id.value;
    let enquiry = swaggerParams;
    CheckCateringEnquiry({ _id: enquiryId }, (enquiryCheckError, enquiryCheckResult) => {
      if (enquiryCheckError) {
        return next(enquiryCheckError);
      }
      if (_.isEmpty(enquiryCheckResult)) {
        let resourceNotFoundOErrorObj = new ResourceNotFoundError(
          "The enquiry with id " + enquiryId + " does not exists"
        );
        return next(resourceNotFoundOErrorObj);
      }
      enquiryCheckResult.is_deleted = enquiry.is_deleted.value != undefined ? enquiry.is_deleted.value : enquiryCheckResult.is_deleted;
      enquiryCheckResult.save((saveError, saveEnquiry) => {
        if (saveError) {
          let runtimeError = new RuntimeError(
            'There was an error while updating a enquiry',
            saveError
          );
          return next(runtimeError);
        }
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify(saveEnquiry));
      });
    });
  }

  /**
   * Delete enquiry with given enquiry_id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   deleteEnquiry(swaggerParams, res, next) {
    let enquiryId = swaggerParams.enquiry_id.value;
    CheckCateringEnquiry({ _id: enquiryId }, (enquiryCheckError, enquiryCheckResult) => {
      if (enquiryCheckError) {
        return next(enquiryCheckError);
      }
      if (_.isEmpty(enquiryCheckResult)) {
        let resourceNotFoundOErrorObj = new ResourceNotFoundError(
          "The enquiry with id " + enquiryId + " does not exists"
        );
        return next(resourceNotFoundOErrorObj);
      }
      enquiryCheckResult.remove((removeError, removeEnquiry) => {
        if (removeError) {
          let runtimeError = new RuntimeError(
            'There was an error while removing a enquiry',
            removeError
          );
          return cb(runtimeError);
        }
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify(removeEnquiry));
      });
    });   
  }
}

/**
 * Checks for enquiry existence
 *
 * @param {Object} query - The enquiry findOne query
 * @param {function} callback - The callback used to pass control to the next action/middleware
 *
 * @private
 */
function CheckCateringEnquiry(query, callback) {
  CateringEnquiry.findOne(query)
    .exec((findOneError, findRecord) => {
      if (findOneError) {
        let runtimeErrorObj = new RuntimeError(
          'There was an error while finding enquiry',
          findOneError
        );
        return callback(runtimeErrorObj);
      }
      return callback(null, findRecord);
    });
}

module.exports = CateringEnquiryService;