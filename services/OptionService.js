"use strict";

const _ = require("lodash");
const async = require("async");
const { Option } = require("../models");
const { QueryHelper } = require("../helpers/bts-query-utils");
const {
  RuntimeError,
  ResourceNotFoundError,
} = require("../helpers/bts-error-utils");

/**
 * Creates an instance of option service
 */
class OptionService {
  constructor(logger) {
    this.logger = logger;
  }

  /**
   * Creates a new option
   *
   * @param {object} req - The http request object
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   createOption(req, res, next) {
    let userId = req.authentication.jwt.payload.user_id;
    let option = req.swagger.params.option.value;
    let optionDetails = new Option({
      name: option.name,
      max_qty: option.max_qty,
      is_multi_selected: option.is_multi_selected,
      created_by: userId,
      is_deleted: option.is_deleted,
      is_removed: option.is_removed,
    });
    optionDetails.save((saveError, saveRecord) => {
      if (saveError) {
        let runtimeError = new RuntimeError(
          "There was an error while creating a new option",
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
   * Get all options
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   getOptionList(swaggerParams, res, next) {
    let query = QueryHelper.getQuery(swaggerParams);
    query.is_removed = false;
    Option.find(query, (findError, findRecords) => {
      res.setHeader("Content-Type", "application/json");
      if (findError) {
        let runtimeError = new RuntimeError(
          "There was an error while fetching all options",
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
   * Get option value with given id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   getOption(swaggerParams, res, next) {
    let optionId = swaggerParams.option_id.value;
    CheckOption(
      { _id: optionId },
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
   * Update option with given id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   updateOption(swaggerParams, res, next) {
    let optionId = swaggerParams.option_id.value;
    let option = swaggerParams.option.value;
    CheckOption({ _id: optionId }, (checkError, optionRecord) => {
      if (checkError) {
        return next(checkError);
      }
      optionRecord.name = option.name ? option.name : optionRecord.name;
      optionRecord.max_qty = option.max_qty ? option.max_qty : optionRecord.max_qty;
      optionRecord.is_multi_selected = option.is_multi_selected != undefined ? option.is_multi_selected : optionRecord.is_multi_selected;
      optionRecord.is_deleted = option.is_deleted != undefined ? option.is_deleted : optionRecord.is_deleted;
      optionRecord.is_removed = option.is_removed != undefined ? option.is_removed : optionRecord.is_removed;
      optionRecord.save((saveError, saveOption) => {
        if (saveError) {
          let runtimeError = new RuntimeError(
            "There was an error while updating a option",
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
 * Checks for option existence
 *
 * @param {Object} query - The option findOne query
 * @param {function} callback - The callback used to pass control to the next action/middleware
 *
 * @private
 */
function CheckOption(query, callback) {
  Option.findOne(query).exec((findOneError, findRecord) => {
    if (findOneError) {
      let runtimeErrorObj = new RuntimeError(
        "There was an error while finding option",
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

module.exports = OptionService;
