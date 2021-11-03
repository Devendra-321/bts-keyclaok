'use strict';

const CateringEnquiryService = require('../services/CateringEnquiryService');

/**
 * Creates a new enquiry
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.addEnquiry = function addEnquiry(req, res, next) {
  let cateringEnquiryService = new CateringEnquiryService(req.Logger);
  cateringEnquiryService.addEnquiry(req.swagger.params, res, next);
};

/**
 * Get all enquiry
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.getEnquiryList = function getEnquiryList(req, res, next) {
  let cateringEnquiryService = new CateringEnquiryService(req.Logger);
  cateringEnquiryService.getEnquiryList(req.swagger.params, res, next);
};

/**
 * Get enquiry with given enquiry_id
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.getEnquiry = function getEnquiry(req, res, next) {
  let cateringEnquiryService = new CateringEnquiryService(req.Logger);
  cateringEnquiryService.getEnquiry(req.swagger.params, res, next);
};

/**
 * Update enquiry with given enquiry_id
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.updateEnquiry = function updateEnquiry(req, res, next) {
  let cateringEnquiryService = new CateringEnquiryService(req.Logger);
  cateringEnquiryService.updateEnquiry(req.swagger.params, res, next);
};

/**
 * Delete enquiry with given enquiry_id
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
 module.exports.deleteEnquiry = function deleteEnquiry(req, res, next) {
  let cateringEnquiryService = new CateringEnquiryService(req.Logger);
  cateringEnquiryService.deleteEnquiry(req.swagger.params, res, next);
};