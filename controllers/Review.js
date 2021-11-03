'use strict';

const ReviewService = require('../services/ReviewService');

/**
 * Creates a new review
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.addReview = function addReview(req, res, next) {
  let reviewService = new ReviewService(req.Logger);
  reviewService.addReview(req.swagger.params, res, next);
};

/**
 * Get all reviews
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.getReviewList = function getReviewList(req, res, next) {
  let reviewService = new ReviewService(req.Logger);
  reviewService.getReviewList(req.swagger.params, res, next);
};

/**
 * Get review with given review_id
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.getReview = function getReview(req, res, next) {
  let reviewService = new ReviewService(req.Logger);
  reviewService.getReview(req.swagger.params, res, next);
};

/**
 * Update review with given review_id
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.updateReview = function updateReview(req, res, next) {
  let reviewService = new ReviewService(req.Logger);
  reviewService.updateReview(req.swagger.params, res, next);
};

/**
 * Delete review with given review_id
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
 module.exports.deleteReview = function deleteReview(req, res, next) {
  let reviewService = new ReviewService(req.Logger);
  reviewService.deleteReview(req.swagger.params, res, next);
};