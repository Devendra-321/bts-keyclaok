'use strict';

const OptionAttributeService = require('../services/OptionAttributeService');

/**
 * Creates a new option attribute
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.createAttribute = function createAttribute(req, res, next) {
  let optionAttributeService = new OptionAttributeService(req.Logger);
  optionAttributeService.createAttribute(req, res, next);
};

/**
 * Get all option attributes
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.getAttributeList = function getAttributeList(req, res, next) {
  let optionAttributeService = new OptionAttributeService(req.Logger);
  optionAttributeService.getAttributeList(req.swagger.params, res, next);
};

/**
 * Get option attribute value with given id
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.getAttribute = function getAttribute(req, res, next) {
  let optionAttributeService = new OptionAttributeService(req.Logger);
  optionAttributeService.getAttribute(req.swagger.params, res, next);
};

/**
 * Update option attribute with given id
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.updateAttribute = function updateAttribute(req, res, next) {
  let optionAttributeService = new OptionAttributeService(req.Logger);
  optionAttributeService.updateAttribute(req.swagger.params, res, next);
};