'use strict';

const ServiceChargeService = require('../services/ServiceChargeService');

/**
 * Creates a new service charge
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.createServiceCharge = function createServiceCharge(req, res, next) {
  let serviceChargeService = new ServiceChargeService(req.Logger);
  serviceChargeService.createServiceCharge(req, res, next);
};

/**
 * Get all service charges
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.getServiceChargeList = function getServiceChargeList(req, res, next) {
  let serviceChargeService = new ServiceChargeService(req.Logger);
  serviceChargeService.getServiceChargeList(req.swagger.params, res, next);
};

/**
 * Get service charge with given id
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.getServiceCharge = function getServiceCharge(req, res, next) {
  let serviceChargeService = new ServiceChargeService(req.Logger);
  serviceChargeService.getServiceCharge(req.swagger.params, res, next);
};

/**
 * Update service charge with given id
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.updateServiceCharge = function updateServiceCharge(req, res, next) {
  let serviceChargeService = new ServiceChargeService(req.Logger);
  serviceChargeService.updateServiceCharge(req.swagger.params, res, next);
};