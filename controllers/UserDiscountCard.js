'use strict';

const UserDiscountCardService = require('../services/UserDiscountCardService');

/**
 * Purchase a new gift card
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.purchaseGiftCard = function purchaseGiftCard(req, res, next) {
  let userDiscountCardService = new UserDiscountCardService(req.Logger);
  userDiscountCardService.purchaseGiftCard(req, res, next);
};

/**
 * Get all gift cards
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.getGiftCardList = function getGiftCardList(req, res, next) {
  let userDiscountCardService = new UserDiscountCardService(req.Logger);
  userDiscountCardService.getGiftCardList(req, res, next);
};

/**
 * Get gift card with given id
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.getGiftCard = function getGiftCard(req, res, next) {
  let userDiscountCardService = new UserDiscountCardService(req.Logger);
  userDiscountCardService.getGiftCard(req.swagger.params, res, next);
};

/**
 * Update gift card with given id
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.updateGiftCard = function updateGiftCard(req, res, next) {
  let userDiscountCardService = new UserDiscountCardService(req.Logger);
  userDiscountCardService.updateGiftCard(req.swagger.params, res, next);
};

/**
 * Remove gift card with given id from user account
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
 module.exports.removeGiftCard = function removeGiftCard(req, res, next) {
  let userDiscountCardService = new UserDiscountCardService(req.Logger);
  userDiscountCardService.removeGiftCard(req.swagger.params, res, next);
};