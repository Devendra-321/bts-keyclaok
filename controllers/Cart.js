'use strict';

const CartService = require('../services/CartService');

/**
 * Creates a new cart item
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.createCart = function createCart(req, res, next) {
  let cartService = new CartService(req.Logger);
  cartService.createCart(req, res, next);
};

/**
 * Get all items in cart
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.getCartList = function getCartList(req, res, next) {
  let cartService = new CartService(req.Logger);
  cartService.getCartList(req, res, next);
};

/**
 * Get cart with given cart_id
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.getCart = function getCart(req, res, next) {
  let cartService = new CartService(req.Logger);
  cartService.getCart(req.swagger.params, res, next);
};

/**
 * Update cart with given cart_id
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.updateCart = function updateCart(req, res, next) {
  let cartService = new CartService(req.Logger);
  cartService.updateCart(req.swagger.params, res, next);
};

/**
 * Delete cart with given cart_id
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
 module.exports.deleteCart = function deleteCart(req, res, next) {
  let cartService = new CartService(req.Logger);
  cartService.deleteCart(req.swagger.params, res, next);
};