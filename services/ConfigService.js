"use strict";

const _ = require("lodash");
const path = require("path");
const async = require("async");
const { Config } = require("../models");
const { QueryHelper } = require("../helpers/bts-query-utils");
const JWT = require("jsonwebtoken");

const {
  ValidationError,
  RuntimeError,
  ResourceNotFoundError,
} = require("../helpers/bts-error-utils");

/**
 * Creates an instance of config service
 */
class ConfigService {
  constructor(logger) {
    this.logger = logger;
  }

  /**
   * Creates a new config
   *
   * @param {object} req - The http request object
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
  createConfig(req, res, next) {
    let userId = JWT.decode(req.headers["x-request-jwt"]).sub; //req.authentication.jwt.payload.user_id;
    let config = req.swagger.params.config.value;
    let configDetails = new Config({
      configs: config.configs,
      type: config.type,
      created_by: userId,
      is_deleted: config.is_deleted
    });
    configDetails.save((saveError, saveRecord) => {
      if (saveError) {
        let runtimeError = new RuntimeError(
          "There was an error while creating a new config",
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
   * Get all config
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   getConfigList(swaggerParams, res, next) {
    let query = QueryHelper.getQuery(swaggerParams);
    Config.find(query)
    .sort({'created_at': 1})
    .exec((findError, findRecords) => {
      res.setHeader("Content-Type", "application/json");
      if (findError) {
        let runtimeError = new RuntimeError(
          "There was an error while fetching all configs",
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
   * Get config with given id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   getConfig(swaggerParams, res, next) {
    let configId = swaggerParams.config_id.value;
    CheckConfig(
      { _id: configId },
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
   * Update config with given id
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   updateConfig(swaggerParams, res, next) {
    let configId = swaggerParams.config_id.value;
    let config = swaggerParams.config.value;
    CheckConfig({ _id: configId }, (checkError, configRecord) => {
      if (checkError) {
        return next(checkError);
      }
      configRecord.configs = config.configs ? config.configs : configRecord.configs;
      configRecord.type = config.type ? config.type : configRecord.type;
      configRecord.is_deleted = config.is_deleted != undefined ? config.is_deleted : configRecord.is_deleted;
      configRecord.save((saveError, saveRecord) => {
        if (saveError) {
          let runtimeError = new RuntimeError(
            "There was an error while updating a config",
            saveError
          );
          return next(runtimeError);
        }
        if (config.is_deleted != undefined && !config.is_deleted) {
          Config.updateMany(
            {
              _id: { $ne: configId }
            },
            {'$set': {is_deleted: true}}, 
            {'multi': true},
            (updateError) => {
              if (updateError) {
                let runtimeError = new RuntimeError(
                  'There was an error while updating configs',
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
 * Checks for config existence
 *
 * @param {Object} query - The config findOne query
 * @param {function} callback - The callback used to pass control to the next action/middleware
 *
 * @private
 */
function CheckConfig(query, callback) {
  Config.findOne(query).exec((findOneError, findRecord) => {
    if (findOneError) {
      let runtimeErrorObj = new RuntimeError(
        "There was an error while finding config",
        findOneError
      );
      return callback(runtimeErrorObj);
    }
    if (_.isEmpty(findRecord)) {
      let resourceNotFoundOErrorObj = new ResourceNotFoundError(
        "The config with id " + query._id + " does not exists"
      );
      return callback(resourceNotFoundOErrorObj);
    }
    return callback(null, findRecord);
  });
}

module.exports = ConfigService;
