'use strict';

const ConfigService = require('../services/ConfigService');

/**
 * Creates a new config
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.createConfig = function createConfig(req, res, next) {
  let configService = new ConfigService(req.Logger);
  configService.createConfig(req, res, next);
};

/**
 * Get all config
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.getConfigList = function getConfigList(req, res, next) {
  let configService = new ConfigService(req.Logger);
  configService.getConfigList(req.swagger.params, res, next);
};

/**
 * Get config with given id
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.getConfig = function getConfig(req, res, next) {
  let configService = new ConfigService(req.Logger);
  configService.getConfig(req.swagger.params, res, next);
};

/**
 * Update config with given id
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.updateConfig = function updateConfig(req, res, next) {
  let configService = new ConfigService(req.Logger);
  configService.updateConfig(req.swagger.params, res, next);
};