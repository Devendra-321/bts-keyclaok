'use strict';

const CheckoutFacilityService = require('../services/CheckoutFacilityService');

/**
 * Creates a new checkout service
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.createCheckoutFacility = function createCheckoutFacility(req, res, next) {
  let checkoutFacilityService = new CheckoutFacilityService(req.Logger);
  checkoutFacilityService.createCheckoutFacility(req, res, next);
};

/**
 * Get all checkout services
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.getCheckoutFacilityList = function getCheckoutFacilityList(req, res, next) {
  let checkoutFacilityService = new CheckoutFacilityService(req.Logger);
  checkoutFacilityService.getCheckoutFacilityList(req.swagger.params, res, next);
};

/**
 * Get checkout service with given id
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.getCheckoutFacility = function getCheckoutFacility(req, res, next) {
  let checkoutFacilityService = new CheckoutFacilityService(req.Logger);
  checkoutFacilityService.getCheckoutFacility(req.swagger.params, res, next);
};

/**
 * Update checkout service with given id
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.updateCheckoutFacility = function updateCheckoutFacility(req, res, next) {
  let checkoutFacilityService = new CheckoutFacilityService(req.Logger);
  checkoutFacilityService.updateCheckoutFacility(req.swagger.params, res, next);
};