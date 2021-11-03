'use strict';

const DiscountCardService = require('../services/DiscountCardService');

/**
 * Creates a new discount card
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.createDiscountCard = function createDiscountCard(req, res, next) {
  let discountCardService = new DiscountCardService(req.Logger);
  discountCardService.createDiscountCard(req, res, next);
};

/**
 * Get all day discount cards
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.getDiscountCardList = function getDiscountCardList(req, res, next) {
  let discountCardService = new DiscountCardService(req.Logger);
  discountCardService.getDiscountCardList(req.swagger.params, res, next);
};

/**
 * Get day discount cards with given discount_id
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.getDiscountCard = function getDiscountCard(req, res, next) {
  let discountCardService = new DiscountCardService(req.Logger);
  discountCardService.getDiscountCard(req.swagger.params, res, next);
};

/**
 * Update day discount card with given discount_id
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.updateDiscountCard = function updateDiscountCard(req, res, next) {
  let discountCardService = new DiscountCardService(req.Logger);
  discountCardService.updateDiscountCard(req.swagger.params, res, next);
};

/**
 * Upload card image with given discount_id
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
 module.exports.uploadCardImage = function uploadCardImage(req, res, next) {
  let discountCardService = new DiscountCardService(req.Logger);
  discountCardService.uploadCardImage(req.swagger.params, res, next);
};