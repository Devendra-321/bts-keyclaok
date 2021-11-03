"use strict";

const _ = require("lodash");
const { DeliveryChargesType } = require("../models");
const { QueryHelper } = require("../helpers/bts-query-utils");
const {
  ValidationError,
  RuntimeError,
  ResourceNotFoundError,
} = require("../helpers/bts-error-utils");

/**
 * Creates an instance of delivery charge type service
 */
class DeliveryChargeTypeService {
  constructor(logger) {
    this.logger = logger;
  }

  /**
   * Creates a new delivery charge type
   *
   * @param {object} req - The http request object
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   createDeliveryChargeType(req, res, next) {
    let userId = req.authentication.jwt.payload.user_id;
    let chargeType = req.swagger.params.chargeType.value;
    let chargeTypeDetails = new DeliveryChargesType({
      type: chargeType.type,
      created_by: userId,
      is_deleted: chargeType.is_deleted
    });
    chargeTypeDetails.save((saveError, saveRecord) => {
      if (saveError) {
        let runtimeError = new RuntimeError(
          "There was an error while creating a new delivery charge type",
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
   * Get all delivery charge types
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   getDeliveryChargeTypeList(swaggerParams, res, next) {
    let query = QueryHelper.getQuery(swaggerParams);
    DeliveryChargesType.find(query, (findError, findRecords) => {
      res.setHeader("Content-Type", "application/json");
      if (findError) {
        let runtimeError = new RuntimeError(
          "There was an error while fetching all delivery charge types",
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
   * Get delivery charge type with given id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   getDeliveryChargeType(swaggerParams, res, next) {
    let chargeTypeId = swaggerParams.charge_type_id.value;
    CheckDeliveryChargeType(
      { _id: chargeTypeId },
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
   * Update delivery charge type with given id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   updateDeliveryChargeType(swaggerParams, res, next) {
    let chargeTypeId = swaggerParams.charge_type_id.value;
    let chargeType = swaggerParams.chargeType.value;
    CheckDeliveryChargeType({ _id: chargeTypeId }, (checkError, chargeTypeRecord) => {
      if (checkError) {
        return next(checkError);
      }
      chargeTypeRecord.is_deleted = chargeType.is_deleted != undefined ? chargeType.is_deleted : chargeTypeRecord.is_deleted;
      chargeTypeRecord.save((saveError, saveRecord) => {
        if (saveError) {
          let runtimeError = new RuntimeError(
            "There was an error while updating a delivery charge type",
            saveError
          );
          return next(runtimeError);
        }
        if (chargeTypeRecord.is_deleted != undefined && !chargeTypeRecord.is_deleted) {
          DeliveryChargesType.updateMany(
            {
              _id: { $ne: chargeTypeId }
            },
            {'$set': {is_deleted: true}}, 
            {'multi': true},
            (updateError) => {
              if (updateError) {
                let runtimeError = new RuntimeError(
                  'There was an error while updating delivery charge types',
                  updateError
                );
                return next(runtimeError);
              }
              res.setHeader("Content-Type", "application/json");
              res.statusCode = 200;
              res.end(JSON.stringify(saveRecord));
            }
          );
        } else {
            res.setHeader("Content-Type", "application/json");
            res.statusCode = 200;
            res.end(JSON.stringify(saveRecord));
        }
      });
    });
  }
}

/**
 * Checks for delivery charge type existence
 *
 * @param {Object} query - The delivery charge type findOne query
 * @param {function} callback - The callback used to pass control to the next action/middleware
 *
 * @private
 */
function CheckDeliveryChargeType(query, callback) {
  DeliveryChargesType.findOne(query).exec((findOneError, findRecord) => {
    if (findOneError) {
      let runtimeErrorObj = new RuntimeError(
        "There was an error while finding delivery charge type",
        findOneError
      );
      return callback(runtimeErrorObj);
    }
    if (_.isEmpty(findRecord)) {
      let resourceNotFoundOErrorObj = new ResourceNotFoundError(
        "The delivery charge type with id " + query._id + " does not exists"
      );
      return callback(resourceNotFoundOErrorObj);
    }
    return callback(null, findRecord);
  });
}

module.exports = DeliveryChargeTypeService;
