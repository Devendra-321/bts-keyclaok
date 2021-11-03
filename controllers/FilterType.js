'use strict';

const FilterTypeService = require('../services/FilterTypeService');

/**
 * Created a new filter
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.createFilterType = function createFilterType(req, res, next) {
  let filterService = new FilterTypeService(req.Logger);
  filterService.createFilterType(req, res, next);
};

/**
 * Get all filters
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.getFilterTypeList = function getFilterTypeList(req, res, next) {
  let filterService = new FilterTypeService(req.Logger);
  filterService.getFilterTypeList(req.swagger.params, res, next);
};

/**
 * Get all filters with data
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
 module.exports.getFilterList = function getFilterList(req, res, next) {
  let filterService = new FilterTypeService(req.Logger);
  filterService.getFilterList(req.swagger.params, res, next);
};

/**
 * Get filter with given filter_id
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.getFilterType = function getFilterType(req, res, next) {
  let filterService = new FilterTypeService(req.Logger);
  filterService.getFilterType(req.swagger.params, res, next);
};

/**
 * Update filter with given filter_id
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.updateFilterType = function updateFilterType(req, res, next) {
  let filterService = new FilterTypeService(req.Logger);
  filterService.updateFilterType(req.swagger.params, res, next);
};