'use strict';

const OrderValueService = require('../services/OrderValueService');

/**
 * Created a new minimum order value
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.createOrderValue = function createOrderValue(req, res, next) {
  let orderValueService = new OrderValueService(req.Logger);
  orderValueService.createOrderValue(req, res, next);
};

/**
 * Get all minimum order values
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.getOrderValueList = function getOrderValueList(req, res, next) {
  let orderValueService = new OrderValueService(req.Logger);
  orderValueService.getOrderValueList(req.swagger.params, res, next);
};

/**
 * Get minimum order value with given id
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.getOrderValue = function getOrderValue(req, res, next) {
  let orderValueService = new OrderValueService(req.Logger);
  orderValueService.getOrderValue(req.swagger.params, res, next);
};

/**
 * Update minimum order value with given id
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.updateOrderValue = function updateOrderValue(req, res, next) {
  let orderValueService = new OrderValueService(req.Logger);
  orderValueService.updateOrderValue(req.swagger.params, res, next);
};