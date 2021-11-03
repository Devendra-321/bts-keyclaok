'use strict';

const DiscountCategoryService = require('../services/DiscountCategoryService');

/**
 * Creates a new discount category
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.createDiscountCategory = function createDiscountCategory(req, res, next) {
  let discountCategoryService = new DiscountCategoryService(req.Logger);
  discountCategoryService.createDiscountCategory(req, res, next);
};

/**
 * Get all day discounts with category
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.getDiscountCategoryList = function getDiscountCategoryList(req, res, next) {
  let discountCategoryService = new DiscountCategoryService(req.Logger);
  discountCategoryService.getDiscountCategoryList(req.swagger.params, res, next);
};

/**
 * Get discount with given discount_id
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.getDiscountCategory = function getDiscountCategory(req, res, next) {
  let discountCategoryService = new DiscountCategoryService(req.Logger);
  discountCategoryService.getDiscountCategory(req.swagger.params, res, next);
};

/**
 * Update discount with given discount_id
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.updateDiscountCategory = function updateDiscountCategory(req, res, next) {
  let discountCategoryService = new DiscountCategoryService(req.Logger);
  discountCategoryService.updateDiscountCategory(req.swagger.params, res, next);
};