"use strict";

const _ = require("lodash");
const path = require("path");
const async = require("async");
const { HourDiscount } = require("../models");
const { QueryHelper } = require("../helpers/bts-query-utils");
const JWT = require("jsonwebtoken");

const {
  ValidationError,
  RuntimeError,
  ResourceNotFoundError,
} = require("../helpers/bts-error-utils");

/**
 * Creates an instance of hourly discount service
 */
class HourDiscountService {
  constructor(logger) {
    this.logger = logger;
  }

  /**
   * Creates a new hour discount
   *
   * @param {object} req - The http request object
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  createHourDiscount(req, res, next) {
    let userId = JWT.decode(req.headers["x-request-jwt"]).sub; // req.authentication.jwt.payload.user_id;
    let discount = req.swagger.params.discount.value;
    let discountDetails = new HourDiscount({
      discount: discount.discount,
      type: discount.type,
      day_time: discount.day_time,
      min_order_value: discount.min_order_value,
      created_by: userId,
      is_deleted: discount.is_deleted,
      is_removed: discount.is_removed,
    });
    discountDetails.save((saveError, saveRecord) => {
      if (saveError) {
        let runtimeError = new RuntimeError(
          "There was an error while creating a new discount",
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
   * Get all hourly discounts
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   getHourDiscountList(swaggerParams, res, next) {
    let query = QueryHelper.getQuery(swaggerParams);
    query.is_removed = false;
    HourDiscount.find(query)
    .sort({'created_at': 1})
    .exec((findError, findRecords) => {
      res.setHeader("Content-Type", "application/json");
      if (findError) {
        let runtimeError = new RuntimeError(
          "There was an error while fetching all discounts",
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
   * Get hourly discount with given discount_id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   getHourDiscount(swaggerParams, res, next) {
    let discountId = swaggerParams.discount_id.value;
    CheckDiscount(
      { _id: discountId },
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
   *  Update hourly discount with given discount_id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   updateHourDiscount(swaggerParams, res, next) {
    let discountId = swaggerParams.discount_id.value;
    let discount = swaggerParams.discount.value;
    CheckDiscount({ _id: discountId }, (checkError, discountRecord) => {
      if (checkError) {
        return next(checkError);
      }
      discountRecord.discount = discount.discount ? discount.discount : discountRecord.discount;
      discountRecord.type = discount.type ? discount.type : discountRecord.type;
      discountRecord.day_time = discount.day_time ? discount.day_time : discountRecord.day_time;
      discountRecord.min_order_value = discount.min_order_value ? discount.min_order_value : discountRecord.min_order_value;
      discountRecord.is_deleted = discount.is_deleted != undefined ? discount.is_deleted : discountRecord.is_deleted;
      discountRecord.is_removed = discount.is_removed != undefined ? discount.is_removed : discountRecord.is_removed;
      discountRecord.save((saveError, saveDiscount) => {
        if (saveError) {
          let runtimeError = new RuntimeError(
            "There was an error while updating a discount",
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
 * Checks for discount existence
 *
 * @param {Object} query - The discount findOne query
 * @param {function} callback - The callback used to pass control to the next action/middleware
 *
 * @private
 */
function CheckDiscount(query, callback) {
  HourDiscount.findOne(query).exec((findOneError, findRecord) => {
    if (findOneError) {
      let runtimeErrorObj = new RuntimeError(
        "There was an error while finding discount",
        findOneError
      );
      return callback(runtimeErrorObj);
    }
    if (_.isEmpty(findRecord)) {
      let resourceNotFoundOErrorObj = new ResourceNotFoundError(
        "The discount with id " + query._id + " does not exists"
      );
      return callback(resourceNotFoundOErrorObj);
    }
    return callback(null, findRecord);
  });
}

module.exports = HourDiscountService;
