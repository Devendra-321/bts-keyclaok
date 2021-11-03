'use strict';

const OptionService = require('../services/OptionService');

/**
 * Creates a new option
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.createOption = function createOption(req, res, next) {
  let optionService = new OptionService(req.Logger);
  optionService.createOption(req, res, next);
};

/**
 * Get all options
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.getOptionList = function getOptionList(req, res, next) {
  let optionService = new OptionService(req.Logger);
  optionService.getOptionList(req.swagger.params, res, next);
};

/**
 * Get option value with given id
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.getOption = function getOption(req, res, next) {
  let optionService = new OptionService(req.Logger);
  optionService.getOption(req.swagger.params, res, next);
};

/**
 * Update option with given id
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.updateOption = function updateOption(req, res, next) {
  let optionService = new OptionService(req.Logger);
  optionService.updateOption(req.swagger.params, res, next);
};