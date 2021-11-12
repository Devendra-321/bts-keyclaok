"use strict";

const _ = require("lodash");
const path = require("path");
const async = require("async");
const { DiscountCategory } = require("../models");
const { QueryHelper } = require("../helpers/bts-query-utils");
const JWT = require("jsonwebtoken");

const {
  ValidationError,
  RuntimeError,
  ResourceNotFoundError,
} = require("../helpers/bts-error-utils");

/**
 * Creates an instance of discount category service
 */
class DiscountCategoryService {
  constructor(logger) {
    this.logger = logger;
  }

  /**
   * Creates a new discount category
   *
   * @param {object} req - The http request object
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  createDiscountCategory(req, res, next) {
    let userId = JWT.decode(req.headers["x-request-jwt"]).sub; //req.authentication.jwt.payload.user_id;
    let discount = req.swagger.params.discount.value;
    let discountDetails = new DiscountCategory({
      discount: discount.discount,
      type: discount.type,
      min_order_value: discount.min_order_value,
      discount_type: discount.discount_type,
      payment_type: discount.payment_type,
      expiry_time: discount.expiry_time,
      created_by: userId,
      is_deleted: discount.is_deleted,
      is_removed: discount.is_removed,
    });
    discountDetails.save((saveError, saveRecord) => {
      if (saveError) {
        let runtimeError = new RuntimeError(
          "There was an error while creating a new discount with category",
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
   * Get all day discounts with category
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   getDiscountCategoryList(swaggerParams, res, next) {
    let query = QueryHelper.getQuery(swaggerParams);
    query.is_removed = false;
    DiscountCategory.find(query)
    .sort({'created_at': 1})
    .exec((findError, findRecords) => {
      res.setHeader("Content-Type", "application/json");
      if (findError) {
        let runtimeError = new RuntimeError(
          "There was an error while fetching all discounts with category",
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
   * Get discount with given discount_id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   getDiscountCategory(swaggerParams, res, next) {
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
   * Update discount with given discount_id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   updateDiscountCategory(swaggerParams, res, next) {
    let discountId = swaggerParams.discount_id.value;
    let discount = swaggerParams.discount.value;
    CheckDiscount({ _id: discountId }, (checkError, discountRecord) => {
      if (checkError) {
        return next(checkError);
      }
      discountRecord.discount = discount.discount ? discount.discount : discountRecord.discount;
      discountRecord.type = discount.type ? discount.type : discountRecord.type;
      discountRecord.min_order_value = discount.min_order_value ? discount.min_order_value : discountRecord.min_order_value;
      discountRecord.discount_type = discount.discount_type ? discount.discount_type : discountRecord.discount_type;
      discountRecord.payment_type = discount.payment_type ? discount.payment_type : discountRecord.payment_type;
      discountRecord.expiry_time = discount.expiry_time ? discount.expiry_time : discountRecord.expiry_time;
      discountRecord.is_deleted = discount.is_deleted != undefined ? discount.is_deleted : discountRecord.is_deleted;
      discountRecord.is_removed = discount.is_removed != undefined ? discount.is_removed : discountRecord.is_removed;
      discountRecord.save((saveError, saveDiscount) => {
        if (saveError) {
          let runtimeError = new RuntimeError(
            "There was an error while updating a discount with category",
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
 * Checks for discount category existence
 *
 * @param {Object} query - The discount category findOne query
 * @param {function} callback - The callback used to pass control to the next action/middleware
 *
 * @private
 */
function CheckDiscount(query, callback) {
  DiscountCategory.findOne(query).exec((findOneError, findRecord) => {
    if (findOneError) {
      let runtimeErrorObj = new RuntimeError(
        "There was an error while finding discount with category",
        findOneError
      );
      return callback(runtimeErrorObj);
    }
    if (_.isEmpty(findRecord)) {
      let resourceNotFoundOErrorObj = new ResourceNotFoundError(
        "The discount category with id " + query._id + " does not exists"
      );
      return callback(resourceNotFoundOErrorObj);
    }
    return callback(null, findRecord);
  });
}

module.exports = DiscountCategoryService;
