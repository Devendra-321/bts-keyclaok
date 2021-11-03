'use strict';

const PaymentGatewayService = require('../services/PaymentGatewayService');

/**
 * Creates a new payment gateway
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.createPaymentGateway = function createPaymentGateway(req, res, next) {
  let paymentGatewayService = new PaymentGatewayService(req.Logger);
  paymentGatewayService.createPaymentGateway(req, res, next);
};

/**
 * Get all payment gateway
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.getPaymentGatewayList = function getPaymentGatewayList(req, res, next) {
  let paymentGatewayService = new PaymentGatewayService(req.Logger);
  paymentGatewayService.getPaymentGatewayList(req.swagger.params, res, next);
};

/**
 * Get payment gateway with given id
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.getPaymentGateway = function getPaymentGateway(req, res, next) {
  let paymentGatewayService = new PaymentGatewayService(req.Logger);
  paymentGatewayService.getPaymentGateway(req.swagger.params, res, next);
};

/**
 * Update payment gateway with given id
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.updatePaymentGateway = function updatePaymentGateway(req, res, next) {
  let paymentGatewayService = new PaymentGatewayService(req.Logger);
  paymentGatewayService.updatePaymentGateway(req.swagger.params, res, next);
};