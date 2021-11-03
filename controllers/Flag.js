'use strict';

const FlagService = require('../services/FlagService');

/**
 * Creates a new flag
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.addFlag = function addFlag(req, res, next) {
  let flagService = new FlagService(req.Logger);
  flagService.addFlag(req.swagger.params, res, next);
};

/**
 * Get all flag
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.getFlagList = function getFlagList(req, res, next) {
  let flagService = new FlagService(req.Logger);
  flagService.getFlagList(req.swagger.params, res, next);
};

/**
 * Get flag with given flag_id
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.getFlag = function getFlag(req, res, next) {
  let flagService = new FlagService(req.Logger);
  flagService.getFlag(req.swagger.params, res, next);
};

/**
 * Update flag with given flag_id
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.updateFlag = function updateFlag(req, res, next) {
  let flagService = new FlagService(req.Logger);
  flagService.updateFlag(req.swagger.params, res, next);
};