'use strict';

const ItemService = require('../services/ItemService');

/**
 * Created a new item
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.createItem = function createItem(req, res, next) {
  let itemService = new ItemService(req.Logger);
  itemService.createItem(req, res, next);
};

/**
 * Get list of items
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.getItemList = function getItemList(req, res, next) {
  let itemService = new ItemService(req.Logger);
  itemService.getItemList(req.swagger.params, res, next);
};

/**
 * Gets item with given item_id
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.getItem = function getItem(req, res, next) {
  let itemService = new ItemService(req.Logger);
  itemService.getItem(req.swagger.params, res, next);
};

/**
 * Updates item with given item_id
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.updateItem = function updateItem(req, res, next) {
  let itemService = new ItemService(req.Logger);
  itemService.updateItem(req.swagger.params, res, next);
};

/**
 * Creates bulk item
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
 module.exports.bulkCreateItem = function bulkCreateItem(req, res, next) {
  let itemService = new ItemService(req.Logger);
  itemService.bulkCreateItem(req, res, next);
};

/**
 * Move item
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
 module.exports.moveItem = function moveItem(req, res, next) {
  let itemService = new ItemService(req.Logger);
  itemService.moveItem(req.swagger.params, res, next);
};

/**
 * Upload item-images in item with given item_id
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
 module.exports.uploadImages = function uploadImages(req, res, next) {
  let itemService = new ItemService(req.Logger);
  itemService.uploadImages(req.swagger.params, res, next);
};