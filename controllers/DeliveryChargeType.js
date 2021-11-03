'use strict';

const DeliveryChargeTypeService = require('../services/DeliveryChargeTypeService');

/**
 * Creates a new delivery charge type
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.createDeliveryChargeType = function createDeliveryChargeType(req, res, next) {
  let deliveryChargeTypeService = new DeliveryChargeTypeService(req.Logger);
  deliveryChargeTypeService.createDeliveryChargeType(req, res, next);
};

/**
 * Get all delivery charge types
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.getDeliveryChargeTypeList = function getDeliveryChargeTypeList(req, res, next) {
  let deliveryChargeTypeService = new DeliveryChargeTypeService(req.Logger);
  deliveryChargeTypeService.getDeliveryChargeTypeList(req.swagger.params, res, next);
};

/**
 * Get delivery charge type with given id
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.getDeliveryChargeType = function getDeliveryChargeType(req, res, next) {
  let deliveryChargeTypeService = new DeliveryChargeTypeService(req.Logger);
  deliveryChargeTypeService.getDeliveryChargeType(req.swagger.params, res, next);
};

/**
 * Update delivery charge type with given id
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.updateDeliveryChargeType = function updateDeliveryChargeType(req, res, next) {
  let deliveryChargeTypeService = new DeliveryChargeTypeService(req.Logger);
  deliveryChargeTypeService.updateDeliveryChargeType(req.swagger.params, res, next);
};