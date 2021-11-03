'use strict';

const SubCategoryService = require('../services/SubCategoryService');

/**
 * Created a new sub-category
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.createSubCategory = function createSubCategory(req, res, next) {
  let subCategoryService = new SubCategoryService(req.Logger);
  subCategoryService.createSubCategory(req, res, next);
};

/**
 * Get list of sub-categories
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.getSubCategoryList = function getSubCategoryList(req, res, next) {
  let subCategoryService = new SubCategoryService(req.Logger);
  subCategoryService.getSubCategoryList(req.swagger.params, res, next);
};

/**
 * Gets sub-category with given subCategory_id
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.getSubCategory = function getSubCategory(req, res, next) {
  let subCategoryService = new SubCategoryService(req.Logger);
  subCategoryService.getSubCategory(req.swagger.params, res, next);
};

/**
 * Updates sub-category with given subCategory_id
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.updateSubCategory = function updateSubCategory(req, res, next) {
  let subCategoryService = new SubCategoryService(req.Logger);
  subCategoryService.updateSubCategory(req.swagger.params, res, next);
};

/**
 * Creates bulk sub-category
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
 module.exports.bulkCreateSubCategory = function bulkCreateSubCategory(req, res, next) {
  let subCategoryService = new SubCategoryService(req.Logger);
  subCategoryService.bulkCreateSubCategory(req, res, next);
};

/**
 * Move sub-category
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
 module.exports.moveSubCategory = function moveSubCategory(req, res, next) {
  let subCategoryService = new SubCategoryService(req.Logger);
  subCategoryService.moveSubCategory(req.swagger.params, res, next);
};