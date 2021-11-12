"use strict";

const _ = require("lodash");
const async = require("async");
const { CheckoutFacility } = require("../models");
const { QueryHelper } = require("../helpers/bts-query-utils");
const JWT = require("jsonwebtoken");

const {
  RuntimeError,
  ResourceNotFoundError,
} = require("../helpers/bts-error-utils");

/**
 * Creates an instance of checkout facility
 */
class CheckoutFacilityService {
  constructor(logger) {
    this.logger = logger;
  }

  /**
   * Creates a new checkout service
   *
   * @param {object} req - The http request object
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  createCheckoutFacility(req, res, next) {
    let userId = JWT.decode(req.headers["x-request-jwt"]).sub; //req.authentication.jwt.payload.user_id;
    let facility = req.swagger.params.facility.value;
    let checkoutFacilityDetails = new CheckoutFacility({
      name: facility.name,
      value: facility.value,
      type: facility.type,
      created_by: userId,
      is_deleted: facility.is_deleted,
      is_removed: facility.is_removed,
    });
    checkoutFacilityDetails.save((saveError, saveRecord) => {
      if (saveError) {
        let runtimeError = new RuntimeError(
          "There was an error while creating a new checkout facility",
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
   * Get all checkout services
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   getCheckoutFacilityList(swaggerParams, res, next) {
    let query = QueryHelper.getQuery(swaggerParams);
    query.is_removed = false;
    CheckoutFacility.find(query)
    .sort({'created_at': 1})
    .exec((findError, findRecords) => {
      res.setHeader("Content-Type", "application/json");
      if (findError) {
        let runtimeError = new RuntimeError(
          "There was an error while fetching all checkout faclities",
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
   * Get checkout service with given id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   getCheckoutFacility(swaggerParams, res, next) {
    let serviceId = swaggerParams.service_id.value;
    CheckCheckoutFacility(
      { _id: serviceId },
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
   * Update checkout service with given id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   updateCheckoutFacility(swaggerParams, res, next) {
    let serviceId = swaggerParams.service_id.value;
    let facility = swaggerParams.facility.value;
    CheckCheckoutFacility({ _id: serviceId }, (checkError, facilityRecord) => {
      if (checkError) {
        return next(checkError);
      }
      facilityRecord.name = facility.name ? facility.name : facilityRecord.name;
      facilityRecord.value = facility.value ? facility.value : facilityRecord.value;
      facilityRecord.type = facility.type ? facility.type : facilityRecord.type;
      facilityRecord.is_deleted = facility.is_deleted != undefined ? facility.is_deleted : facilityRecord.is_deleted;
      facilityRecord.is_removed = facility.is_removed != undefined ? facility.is_removed : facilityRecord.is_removed;
      facilityRecord.save((saveError, saveCharge) => {
        if (saveError) {
          let runtimeError = new RuntimeError(
            "There was an error while updating a checkout facility",
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
 * Checks for checkout facility existence
 *
 * @param {Object} query - The checkout facility findOne query
 * @param {function} callback - The callback used to pass control to the next action/middleware
 *
 * @private
 */
function CheckCheckoutFacility(query, callback) {
  CheckoutFacility.findOne(query).exec((findOneError, findRecord) => {
    if (findOneError) {
      let runtimeErrorObj = new RuntimeError(
        "There was an error while finding checkout facility",
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

module.exports = CheckoutFacilityService;
