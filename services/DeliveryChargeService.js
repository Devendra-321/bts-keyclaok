"use strict";

const _ = require("lodash");
const async = require("async");
const { ObjectId } = require("mongoose").Types;
const { DeliveryCharge, Branch } = require("../models");
const { QueryHelper } = require("../helpers/bts-query-utils");
const JWT = require('jsonwebtoken');
const {
  RuntimeError,
  ResourceNotFoundError,
} = require("../helpers/bts-error-utils");
const ValidationError = require("../helpers/bts-error-utils/ValidationError");

/**
 * Creates an instance of delivery charge
 */
class DeliveryChargeService {
  constructor(logger) {
    this.logger = logger;
  }

  /**
   * Creates a new delivery charge
   *
   * @param {object} req - The http request object
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   createDeliveryCharge(req, res, next) {
    let userId = JWT.decode(req.headers['x-request-jwt']).sub; //req.authentication.jwt.payload.user_id;
    let charge = req.swagger.params.charge.value;
    let deliveryChargeDetails = new DeliveryCharge({
      tax: charge.tax,
      type: charge.type,
      charge_type: charge.charge_type,
      postcode: charge.postcode,
      area: charge.area,
      min_order_value: charge.min_order_value,
      max_order_value: charge.max_order_value,
      branch_id: charge.branch_id,
      created_by: userId,
      is_deleted: charge.is_deleted,
      is_removed: charge.is_removed,
    });
    deliveryChargeDetails.save((saveError, saveRecord) => {
      if (saveError) {
        let runtimeError = new RuntimeError(
          "There was an error while creating a new delivery charge",
          saveError
        );
        return next(runtimeError);
      }
      res.setHeader("Content-Type", "application/json");
      res.statusCode = 201;
      res.end(JSON.stringify(saveRecord));
    });
  }

  /**
   * Get all delivery charges
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   getDeliveryChargeList(swaggerParams, res, next) {
    let query = QueryHelper.getQuery(swaggerParams);
//     let queryArray = [];
//     let condition = {
//       $match: {
//         is_removed: false
//       },
//     };
//     if (!_.isUndefined(query.is_deleted)) {
//       condition["$match"].is_deleted = query.is_deleted;
//     }

//     if (query.branch_id) {
//       condition["$match"].branch_id = ObjectId(query.branch_id);
//     }

//     if (query.charge_type) {
//       condition["$match"].charge_type = query.charge_type;
//     }
//     queryArray.push(condition);
//     queryArray.push({
//       $lookup: {
//         from: "Branch",
//         localField: "branch_id",
//         foreignField: "_id",
//         as: "branch_data",
//       },
//     });
//     DeliveryCharge.aggregate(queryArray)
//     .sort({'created_at': 1})
//     .exec((findError, findRecords) => {

    query.is_removed = false;
    DeliveryCharge.find(query)
    .sort({'created_at': 1})
    .exec((findError, findRecords) => {
      res.setHeader("Content-Type", "application/json");
      if (findError) {
        let runtimeError = new RuntimeError(
          "There was an error while fetching all delivery charges",
          findError
        );
        return next(runtimeError);
      }
      if (_.isEmpty(findRecords)) {
        res.statusCode = 204;
        return res.end();
      }
      res.statusCode = 200;
      res.end(JSON.stringify(findRecords));
    });
  }

  /**
   * Get delivery charge with given id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   getDeliveryCharge(swaggerParams, res, next) {
    let conditionId = swaggerParams.condition_id.value;
    CheckDeliveryCharge(
      { _id: conditionId },
      (checkError, checkResult) => {
        if (checkError) {
          return next(checkError);
        }
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(checkResult));
      }
    );
  }

  /**
   * Get delivery charge with given postcode
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   getDeliveryChargeByPostcode(swaggerParams, res, next) {
    let postcode = swaggerParams.postcode.value;
    CheckDeliveryCharge(
      { postcode },
      (checkError, checkResult) => {
        if (checkError) {
          return next(checkError);
        }
        CheckBranch({_id: checkResult.branch_id}, (branchError, branchResult) => {
          if (branchError) {
            return next(branchError);
          }
          checkResult = checkResult.toObject();
          checkResult.branch = branchResult;
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(checkResult));
        });
      }
    );
  }

  /**
   * Update delivery charge with given id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   updateDeliveryCharge(swaggerParams, res, next) {
    let conditionId = swaggerParams.condition_id.value;
    let charge = swaggerParams.charge.value;
    CheckDeliveryCharge({ _id: conditionId }, (checkError, chargeRecord) => {
      if (checkError) {
        return next(checkError);
      }
      chargeRecord.tax = charge.tax ? charge.tax : chargeRecord.tax;
      chargeRecord.type = charge.type ? charge.type : chargeRecord.type;
      chargeRecord.charge_type = charge.charge_type ? charge.charge_type : chargeRecord.charge_type;
      chargeRecord.postcode = charge.postcode ? charge.postcode : chargeRecord.postcode;
      chargeRecord.area = charge.area ? charge.area : chargeRecord.area;
      chargeRecord.min_order_value = charge.min_order_value ? charge.min_order_value : chargeRecord.min_order_value;
      chargeRecord.max_order_value = charge.max_order_value ? charge.max_order_value : chargeRecord.max_order_value;
      chargeRecord.branch_id = charge.branch_id ? charge.branch_id : chargeRecord.branch_id;
      chargeRecord.is_deleted = charge.is_deleted != undefined ? charge.is_deleted : chargeRecord.is_deleted;
      chargeRecord.is_removed = charge.is_removed != undefined ? charge.is_removed : chargeRecord.is_removed;
      chargeRecord.save((saveError, saveCharge) => {
        if (saveError) {
          let runtimeError = new RuntimeError(
            "There was an error while updating a delivery charge",
            saveError
          );
          return next(runtimeError);
        }
        res.setHeader("Content-Type", "application/json");
        res.statusCode = 200;
        res.end(JSON.stringify(saveCharge));
      });
    });
  }
}

/**
 * Checks for delivery charge existence
 *
 * @param {Object} query - The delivery charge findOne query
 * @param {function} callback - The callback used to pass control to the next action/middleware
 *
 * @private
 */
function CheckDeliveryCharge(query, callback) {
  DeliveryCharge.findOne(query).exec((findOneError, findRecord) => {
    if (findOneError) {
      let runtimeErrorObj = new RuntimeError(
        "There was an error while finding delivery charges",
        findOneError
      );
      return callback(runtimeErrorObj);
    }
    if (_.isEmpty(findRecord)) {
      let resourceNotFoundOErrorObj = new ResourceNotFoundError(
        "The value with id " + query._id + " does not exists"
      );
      return callback(resourceNotFoundOErrorObj);
    }
    return callback(null, findRecord);
  });
}

/**
 * Checks for branch existence
 *
 * @param {Object} query - The branch findOne query
 * @param {function} callback - The callback used to pass control to the next action/middleware
 *
 * @private
 */
 function CheckBranch(query, callback) {
  Branch.findOne(query).exec((findOneError, findRecord) => {
    if (findOneError) {
      let runtimeErrorObj = new RuntimeError(
        "There was an error while finding branch",
        findOneError
      );
      return callback(runtimeErrorObj);
    }
    if (_.isEmpty(findRecord)) {
      let validationError = new ValidationError(
        "The branch with id " + query._id + " does not exists"
      );
      return callback(validationError);
    }
    return callback(null, findRecord);
  });
}

module.exports = DeliveryChargeService;
