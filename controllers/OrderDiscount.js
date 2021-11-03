'use strict';

const OrderDiscountService = require('../services/OrderDiscountService');

/**
 * Creates a new minimum order value discount
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.createOrderDiscount = function createOrderDiscount(req, res, next) {
  let orderDiscountService = new OrderDiscountService(req.Logger);
  orderDiscountService.createOrderDiscount(req, res, next);
};

/**
 * Get all minimum order discounts
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.getOrderDiscountList = function getOrderDiscountList(req, res, next) {
  let orderDiscountService = new OrderDiscountService(req.Logger);
  orderDiscountService.getOrderDiscountList(req.swagger.params, res, next);
};

/**
 * Get minimum order discount with given id
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.getOrderDiscount = function getOrderDiscount(req, res, next) {
  let orderDiscountService = new OrderDiscountService(req.Logger);
  orderDiscountService.getOrderDiscount(req.swagger.params, res, next);
};

/**
 * Update minimum order discount with given id
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.updateOrderDiscount = function updateOrderDiscount(req, res, next) {
  let orderDiscountService = new OrderDiscountService(req.Logger);
  orderDiscountService.updateOrderDiscount(req.swagger.params, res, next);
};