'use strict';

const HourDiscountService = require('../services/HourDiscountService');

/**
 * Created a new hourly discount
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.createHourDiscount = function createHourDiscount(req, res, next) {
  let hourDiscountService = new HourDiscountService(req.Logger);
  hourDiscountService.createHourDiscount(req, res, next);
};

/**
 * Get all hourly discounts
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.getHourDiscountList = function getHourDiscountList(req, res, next) {
  let hourDiscountService = new HourDiscountService(req.Logger);
  hourDiscountService.getHourDiscountList(req.swagger.params, res, next);
};

/**
 * Get hourly discount with given discount_id
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.getHourDiscount = function getHourDiscount(req, res, next) {
  let hourDiscountService = new HourDiscountService(req.Logger);
  hourDiscountService.getHourDiscount(req.swagger.params, res, next);
};

/**
 * Update hourly discount with given discount_id
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.updateHourDiscount = function updateHourDiscount(req, res, next) {
  let hourDiscountService = new HourDiscountService(req.Logger);
  hourDiscountService.updateHourDiscount(req.swagger.params, res, next);
};