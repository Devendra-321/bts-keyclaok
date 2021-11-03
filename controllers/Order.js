'use strict';

const OrderService = require('../services/OrderService');

/**
 * Creates a new order
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.createOrder = function createOrder(req, res, next) {
  let orderService = new OrderService(req.Logger);
  orderService.createOrder(req, res, next);
};

/**
 * Get all orders
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.getOrderList = function getOrderList(req, res, next) {
  let orderService = new OrderService(req.Logger);
  orderService.getOrderList(req.swagger.params, res, next);
};

/**
 * Get order with given order_id
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.getOrder = function getOrder(req, res, next) {
  let orderService = new OrderService(req.Logger);
  orderService.getOrder(req.swagger.params, res, next);
};

/**
 * Update order with given order_id
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.updateOrder = function updateOrder(req, res, next) {
  let orderService = new OrderService(req.Logger);
  orderService.updateOrder(req.swagger.params, res, next);
};

/**
 * Check discount code validity
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
 module.exports.checkCodeValidity = function checkCodeValidity(req, res, next) {
  let orderService = new OrderService(req.Logger);
  orderService.checkCodeValidity(req.swagger.params, res, next);
};

/**
 * Get order statistics
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
 module.exports.orderStatistics = function orderStatistics(req, res, next) {
  let orderService = new OrderService(req.Logger);
  orderService.orderStatistics(req.swagger.params, res, next);
};

/**
 * Get user statistics
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
 module.exports.userStatistics = function userStatistics(req, res, next) {
  let orderService = new OrderService(req.Logger);
  orderService.userStatistics(req.swagger.params, res, next);
};

