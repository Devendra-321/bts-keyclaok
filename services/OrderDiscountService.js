"use strict";

const _ = require("lodash");
const path = require("path");
const async = require("async");
const { OrderDiscount } = require("../models");
const { QueryHelper } = require("../helpers/bts-query-utils");
const {
  RuntimeError,
  ResourceNotFoundError,
} = require("../helpers/bts-error-utils");

/**
 * Creates an instance of minimum order discount service
 */
class OrderDiscountService {
  constructor(logger) {
    this.logger = logger;
  }

  /**
   * Creates a new minimum order value discount
   *
   * @param {object} req - The http request object
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   createOrderDiscount(req, res, next) {
    let userId = req.authentication.jwt.payload.user_id;
    let minimumValue = req.swagger.params.minimumValue.value;
    let orderDiscountDetails = new OrderDiscount({
      discount: minimumValue.discount,
      type: minimumValue.type,
      order_type: minimumValue.order_type,
      min_order_value: minimumValue.min_order_value,
      created_by: userId,
      is_deleted: minimumValue.is_deleted,
      is_removed: minimumValue.is_removed,
    });
    orderDiscountDetails.save((saveError, saveRecord) => {
      if (saveError) {
        let runtimeError = new RuntimeError(
          "There was an error while creating a new minimum order discount",
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
   * Get all minimum order discounts
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   getOrderDiscountList(swaggerParams, res, next) {
    let query = QueryHelper.getQuery(swaggerParams);
    query.is_removed = false;
    OrderDiscount.find(query)
    .sort({'created_at': 1})
    .exec((findError, findRecords) => {
      res.setHeader("Content-Type", "application/json");
      if (findError) {
        let runtimeError = new RuntimeError(
          "There was an error while fetching all minimum order discounts",
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
   * Get minimum order discount with given id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   getOrderDiscount(swaggerParams, res, next) {
    let conditionId = swaggerParams.condition_id.value;
    CheckMinOrderDiscount(
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
   * Update minimum order discount with given id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   updateOrderDiscount(swaggerParams, res, next) {
    let conditionId = swaggerParams.condition_id.value;
    let minimumValue = swaggerParams.minimumValue.value;
    CheckMinOrderDiscount({ _id: conditionId }, (checkError, minimumValueRecord) => {
      if (checkError) {
        return next(checkError);
      }
      minimumValueRecord.discount = minimumValue.discount ? minimumValue.discount : minimumValueRecord.discount;
      minimumValueRecord.type = minimumValue.type ? minimumValue.type : minimumValueRecord.type;
      minimumValueRecord.order_type = minimumValue.order_type ? minimumValue.order_type : minimumValueRecord.order_type;
      minimumValueRecord.min_order_value = minimumValue.min_order_value ? minimumValue.min_order_value : minimumValueRecord.min_order_value;
      minimumValueRecord.is_deleted = minimumValue.is_deleted != undefined ? minimumValue.is_deleted : minimumValueRecord.is_deleted;
      minimumValueRecord.is_removed = minimumValue.is_removed != undefined ? minimumValue.is_removed : minimumValueRecord.is_removed;
      minimumValueRecord.save((saveError, saveDiscount) => {
        if (saveError) {
          let runtimeError = new RuntimeError(
            "There was an error while updating a minimum order discount",
            saveError
          );
          return next(runtimeError);
        }
        res.setHeader("Content-Type", "application/json");
        res.statusCode = 200;
        res.end(JSON.stringify(saveDiscount));
      });
    });
  }
}

/**
 * Checks for minimum order discount existence
 *
 * @param {Object} query - The minimum order discount findOne query
 * @param {function} callback - The callback used to pass control to the next action/middleware
 *
 * @private
 */
function CheckMinOrderDiscount(query, callback) {
  OrderDiscount.findOne(query).exec((findOneError, findRecord) => {
    if (findOneError) {
      let runtimeErrorObj = new RuntimeError(
        "There was an error while finding minimum order discount",
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

module.exports = OrderDiscountService;
