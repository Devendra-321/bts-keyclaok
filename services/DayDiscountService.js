"use strict";

const _ = require("lodash");
const path = require("path");
const async = require("async");
const { DayDiscount } = require("../models");
const { QueryHelper } = require("../helpers/bts-query-utils");
const {
  ValidationError,
  RuntimeError,
  ResourceNotFoundError,
} = require("../helpers/bts-error-utils");

/**
 * Creates an instance of day discount service
 */
class DayDiscountService {
  constructor(logger) {
    this.logger = logger;
  }

  /**
   * Creates a new day discount
   *
   * @param {object} req - The http request object
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   createDayDiscount(req, res, next) {
    let userId = req.authentication.jwt.payload.user_id;
    let discount = req.swagger.params.discount.value;
    let discountDetails = new DayDiscount({
      discount: discount.discount,
      type: discount.type,
      discount_date: discount.discount_date,
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
   * Get all day discounts
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   getDayDiscountList(swaggerParams, res, next) {
    let query = QueryHelper.getQuery(swaggerParams);
    query.is_removed = false;
    DayDiscount.find(query)
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
   * Get day discount with given discount_id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   getDayDiscount(swaggerParams, res, next) {
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
   *  Update day discount with given discount_id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   updateDayDiscount(swaggerParams, res, next) {
    let discountId = swaggerParams.discount_id.value;
    let discount = swaggerParams.discount.value;
    CheckDiscount({ _id: discountId }, (checkError, discountRecord) => {
      if (checkError) {
        return next(checkError);
      }
      discountRecord.discount = discount.discount ? discount.discount : discountRecord.discount;
      discountRecord.type = discount.type ? discount.type : discountRecord.type;
      discountRecord.discount_date = discount.discount_date ? discount.discount_date : discountRecord.discount_date;
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
  DayDiscount.findOne(query).exec((findOneError, findRecord) => {
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

module.exports = DayDiscountService;
