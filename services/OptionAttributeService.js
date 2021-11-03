"use strict";

const _ = require("lodash");
const async = require("async");
const { OptionAttribute } = require("../models");
const { QueryHelper } = require("../helpers/bts-query-utils");
const {
  RuntimeError,
  ResourceNotFoundError,
} = require("../helpers/bts-error-utils");

/**
 * Creates an instance of attribute attribute service
 */
class AttributeService {
  constructor(logger) {
    this.logger = logger;
  }

  /**
   * Creates a new attribute attribute
   *
   * @param {object} req - The http request object
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   createAttribute(req, res, next) {
    let userId = req.authentication.jwt.payload.user_id;
    let attribute = req.swagger.params.attribute.value;
    let attributeDetails = new OptionAttribute({
      name: attribute.name,
      price: attribute.price,
      option_id: attribute.option_id,
      created_by: userId,
      is_deleted: attribute.is_deleted,
      is_removed: attribute.is_removed,
    });
    attributeDetails.save((saveError, saveRecord) => {
      if (saveError) {
        let runtimeError = new RuntimeError(
          "There was an error while creating a new attribute",
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
   * Get all option attributes
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   getAttributeList(swaggerParams, res, next) {
    let query = QueryHelper.getQuery(swaggerParams);
    query.is_removed = false;
    OptionAttribute.find(query, (findError, findRecords) => {
      res.setHeader("Content-Type", "application/json");
      if (findError) {
        let runtimeError = new RuntimeError(
          "There was an error while fetching all attributes",
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
   * Get option attribute value with given id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   getAttribute(swaggerParams, res, next) {
    let attributeId = swaggerParams.attribute_id.value;
    CheckAttribute(
      { _id: attributeId },
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
   * Update option attribute with given id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   updateAttribute(swaggerParams, res, next) {
    let attributeId = swaggerParams.attribute_id.value;
    let attribute = swaggerParams.attribute.value;
    CheckAttribute({ _id: attributeId }, (checkError, attributeRecord) => {
      if (checkError) {
        return next(checkError);
      }
      attributeRecord.name = attribute.name ? attribute.name : attributeRecord.name;
      attributeRecord.price = attribute.price ? attribute.price : attributeRecord.price;
      attributeRecord.option_id = attribute.option_id ? attribute.option_id : attributeRecord.option_id;
      attributeRecord.is_deleted = attribute.is_deleted != undefined ? attribute.is_deleted : attributeRecord.is_deleted;
      attributeRecord.is_removed = attribute.is_removed != undefined ? attribute.is_removed : attributeRecord.is_removed;
      attributeRecord.save((saveError, saveOption) => {
        if (saveError) {
          let runtimeError = new RuntimeError(
            "There was an error while updating a attribute",
            saveError
          );
          return next(runtimeError);
        }
        res.setHeader("Content-Type", "application/json");
        res.statusCode = 200;
        res.end(JSON.stringify(saveOption));
      });
    });
  }
}

/**
 * Checks for attribute existence
 *
 * @param {Object} query - The attribute findOne query
 * @param {function} callback - The callback used to pass control to the next action/middleware
 *
 * @private
 */
function CheckAttribute(query, callback) {
  OptionAttribute.findOne(query).exec((findOneError, findRecord) => {
    if (findOneError) {
      let runtimeErrorObj = new RuntimeError(
        "There was an error while finding attribute",
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

module.exports = AttributeService;
