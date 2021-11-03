'use strict';

const DeliveryChargeService = require('../services/DeliveryChargeService');

/**
 * Creates a new delivery charge
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.createDeliveryCharge = function createDeliveryCharge(req, res, next) {
  let deliveryChargeService = new DeliveryChargeService(req.Logger);
  deliveryChargeService.createDeliveryCharge(req, res, next);
};

/**
 * Get all delivery charges
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.getDeliveryChargeList = function getDeliveryChargeList(req, res, next) {
  let deliveryChargeService = new DeliveryChargeService(req.Logger);
  deliveryChargeService.getDeliveryChargeList(req.swagger.params, res, next);
};

/**
 * Get delivery charge with given id
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.getDeliveryCharge = function getDeliveryCharge(req, res, next) {
  let deliveryChargeService = new DeliveryChargeService(req.Logger);
  deliveryChargeService.getDeliveryCharge(req.swagger.params, res, next);
};

/**
 * Get delivery charge with given postcode
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
 module.exports.getDeliveryChargeByPostcode = function getDeliveryChargeByPostcode(req, res, next) {
  let deliveryChargeService = new DeliveryChargeService(req.Logger);
  deliveryChargeService.getDeliveryChargeByPostcode(req.swagger.params, res, next);
};


/**
 * Update delivery charge with given id
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.updateDeliveryCharge = function updateDeliveryCharge(req, res, next) {
  let deliveryChargeService = new DeliveryChargeService(req.Logger);
  deliveryChargeService.updateDeliveryCharge(req.swagger.params, res, next);
};