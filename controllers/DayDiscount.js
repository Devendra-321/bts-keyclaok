'use strict';

const DayDiscountService = require('../services/DayDiscountService');

/**
 * Created a new day discount
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.createDayDiscount = function createDayDiscount(req, res, next) {
  let dayDiscountService = new DayDiscountService(req.Logger);
  dayDiscountService.createDayDiscount(req, res, next);
};

/**
 * Get all day discounts
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.getDayDiscountList = function getDayDiscountList(req, res, next) {
  let dayDiscountService = new DayDiscountService(req.Logger);
  dayDiscountService.getDayDiscountList(req.swagger.params, res, next);
};

/**
 * Get day discount with given discount_id
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.getDayDiscount = function getDayDiscount(req, res, next) {
  let dayDiscountService = new DayDiscountService(req.Logger);
  dayDiscountService.getDayDiscount(req.swagger.params, res, next);
};

/**
 * Update day discount with given discount_id
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.updateDayDiscount = function updateDayDiscount(req, res, next) {
  let dayDiscountService = new DayDiscountService(req.Logger);
  dayDiscountService.updateDayDiscount(req.swagger.params, res, next);
};