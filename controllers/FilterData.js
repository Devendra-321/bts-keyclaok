'use strict';

const FilterDataService = require('../services/FilterDataService');

/**
 * Created a new filter data
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.createFilterData = function createFilterData(req, res, next) {
  let filterService = new FilterDataService(req.Logger);
  filterService.createFilterData(req, res, next);
};

/**
 * Get all filter data
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.getFilterDataList = function getFilterDataList(req, res, next) {
  let filterService = new FilterDataService(req.Logger);
  filterService.getFilterDataList(req.swagger.params, res, next);
};

/**
 * Get filter data with given filter_id
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.getFilterData = function getFilterData(req, res, next) {
  let filterService = new FilterDataService(req.Logger);
  filterService.getFilterData(req.swagger.params, res, next);
};

/**
 * Update filter data with given filter_id
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.updateFilterData = function updateFilterData(req, res, next) {
  let filterService = new FilterDataService(req.Logger);
  filterService.updateFilterData(req.swagger.params, res, next);
};

/**
 * Creates bulk filter data
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
 module.exports.bulkCreateFilter = function bulkCreateFilter(req, res, next) {
  let filterService = new FilterDataService(req.Logger);
  filterService.bulkCreateFilter(req, res, next);
};