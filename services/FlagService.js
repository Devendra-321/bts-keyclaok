'use strict';

const _ = require("lodash");
const async = require('async');
const { Flag } = require('../models');
const { QueryHelper } = require('../helpers/bts-query-utils');
const { ObjectId } = require("mongoose").Types;
const { ValidationError, RuntimeError, ResourceNotFoundError } = require('../helpers/bts-error-utils');

/**
 * Creates an instance of flag service
 */
class FlagService {

  constructor(logger) {
    this.logger = logger;
  }

  /**
   * Creates a new flag
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   addFlag(swaggerParams, res, next) {
    let flag = swaggerParams.flag.value;
    let flagDetails = new Flag({
      name: flag.name,
      description: flag.description,
      value: flag.value,
      options: flag.options
    });
    flagDetails.save((saveError, saveFlag) => {
      if (saveError) {
        let runtimeError = new RuntimeError(
          'There was an error while adding a new flag',
          saveError
        );
        return next(runtimeError);
      }
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 201;
      res.end(JSON.stringify(saveFlag));
    });
  }

  /**
   * Get all flag
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   getFlagList(swaggerParams, res, next) {
    let query = QueryHelper.getQuery(swaggerParams);
    let keyword = query.keyword;
    if (keyword) {
      query.$or = [
        { name: { $regex: new RegExp(".*" + keyword + ".*", "i") } },
        { description: { $regex: new RegExp(".*" + keyword + ".*", "i") } },
        { value: { $regex: new RegExp(".*" + keyword + ".*", "i") } }
      ];
      delete query.keyword;
    }
    Flag.find(query)
    .sort({'created_at': 1})
    .exec((flagFindError, flagRecords) => {
      res.setHeader('Content-Type', 'application/json');
      if (flagFindError) {
        let runtimeError = new RuntimeError(
          'There was an error while fetching all flag',
          flagFindError
        );
        return next(runtimeError);
      }
      if (_.isEmpty(flagRecords)) {
        res.statusCode = 204;
        return res.end();
      }
      res.statusCode = 200;
      res.end(JSON.stringify(flagRecords));
    });
  }

  /**
   * Get flag with given flag_id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   getFlag(swaggerParams, res, next) {
    let flagId = swaggerParams.flag_id.value;
    CheckFlag({ _id: flagId }, (flagCheckError, flagCheckResult) => {
      if (flagCheckError) {
        return next(flagCheckError);
      }
      if (_.isEmpty(flagCheckResult)) {
        let resourceNotFoundOErrorObj = new ResourceNotFoundError(
          "The flag with id " + flagId + " does not exists"
        );
        return next(resourceNotFoundOErrorObj);
      }
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(flagCheckResult));
    });
  }

  /**
   * Update flag with given flag_id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   updateFlag(swaggerParams, res, next) {
    let flagId = swaggerParams.flag_id.value;
    let flag = swaggerParams.flag.value;
    CheckFlag({ _id: flagId }, (flagCheckError, flagCheckResult) => {
      if (flagCheckError) {
        return next(flagCheckError);
      }
      if (_.isEmpty(flagCheckResult)) {
        let resourceNotFoundOErrorObj = new ResourceNotFoundError(
          "The flag with id " + flagId + " does not exists"
        );
        return next(resourceNotFoundOErrorObj);
      }
      flagCheckResult.name = flag.name ? flag.name : flagCheckResult.name;
      flagCheckResult.description = flag.description ? flag.description : flagCheckResult.description;
      flagCheckResult.value = flag.value ? flag.value : flagCheckResult.value;
      flagCheckResult.options = flag.options ? flag.options : flagCheckResult.options;
      flagCheckResult.save((saveError, saveflag) => {
        if (saveError) {
          let runtimeError = new RuntimeError(
            'There was an error while updating a flag',
            saveError
          );
          return next(runtimeError);
        }
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify(saveflag));
      });
    });
  }
}

/**
 * Checks for flag existence
 *
 * @param {Object} query - The flag findOne query
 * @param {function} callback - The callback used to pass control to the next action/middleware
 *
 * @private
 */
function CheckFlag(query, callback) {
  Flag.findOne(query)
    .exec((findOneError, findRecord) => {
      if (findOneError) {
        let runtimeErrorObj = new RuntimeError(
          'There was an error while finding flag',
          findOneError
        );
        return callback(runtimeErrorObj);
      }
      return callback(null, findRecord);
    });
}

module.exports = FlagService;