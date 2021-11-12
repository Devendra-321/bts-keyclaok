"use strict";

const _ = require("lodash");
const path = require("path");
const async = require("async");
const { ServiceCharge } = require("../models");
const { QueryHelper } = require("../helpers/bts-query-utils");

const JWT = require('jsonwebtoken');
const {
  RuntimeError,
  ResourceNotFoundError,
} = require("../helpers/bts-error-utils");

/**
 * Creates an instance of service charge
 */
class ChargeService {
  constructor(logger) {
    this.logger = logger;
  }

  /**
   * Creates a new service charge
   *
   * @param {object} req - The http request object
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   createServiceCharge(req, res, next) {
    let userId = JWT.decode(req.headers['x-request-jwt']).sub; //req.authentication.jwt.payload.user_id;
    let charge = req.swagger.params.charge.value;
    let serviceChargeDetails = new ServiceCharge({
      tax: charge.tax,
      type: charge.type,
      min_order_value: charge.min_order_value,
      created_by: userId,
      is_deleted: charge.is_deleted,
      is_removed: charge.is_removed,
    });
    serviceChargeDetails.save((saveError, saveRecord) => {
      if (saveError) {
        let runtimeError = new RuntimeError(
          "There was an error while creating a new service charge",
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
   * Get all service charges
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   getServiceChargeList(swaggerParams, res, next) {
    let query = QueryHelper.getQuery(swaggerParams);
    query.is_removed = false;
    ServiceCharge.find(query)
    .sort({'created_at': 1})
    .exec((findError, findRecords) => {
      res.setHeader("Content-Type", "application/json");
      if (findError) {
        let runtimeError = new RuntimeError(
          "There was an error while fetching all service charges",
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
   * Get service charge with given id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   getServiceCharge(swaggerParams, res, next) {
    let conditionId = swaggerParams.condition_id.value;
    CheckServiceCharge(
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
   * Update service charge with given id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   updateServiceCharge(swaggerParams, res, next) {
    let conditionId = swaggerParams.condition_id.value;
    let charge = swaggerParams.charge.value;
    CheckServiceCharge({ _id: conditionId }, (checkError, chargeRecord) => {
      if (checkError) {
        return next(checkError);
      }
      chargeRecord.tax = charge.tax ? charge.tax : chargeRecord.tax;
      chargeRecord.type = charge.type ? charge.type : chargeRecord.type;
      chargeRecord.min_order_value = charge.min_order_value ? charge.min_order_value : chargeRecord.min_order_value;
      chargeRecord.is_deleted = charge.is_deleted != undefined ? charge.is_deleted : chargeRecord.is_deleted;
      chargeRecord.is_removed = charge.is_removed != undefined ? charge.is_removed : chargeRecord.is_removed;
      chargeRecord.save((saveError, saveCharge) => {
        if (saveError) {
          let runtimeError = new RuntimeError(
            "There was an error while updating a service charge",
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
 * Checks for service charge existence
 *
 * @param {Object} query - The service charge findOne query
 * @param {function} callback - The callback used to pass control to the next action/middleware
 *
 * @private
 */
function CheckServiceCharge(query, callback) {
  ServiceCharge.findOne(query).exec((findOneError, findRecord) => {
    if (findOneError) {
      let runtimeErrorObj = new RuntimeError(
        "There was an error while finding service charges",
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

module.exports = ChargeService;
