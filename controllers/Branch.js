'use strict';

const BranchService = require('../services/BranchService');

/**
 * Creates a new branch
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.createBranch = function createBranch(req, res, next) {
  let branchService = new BranchService(req.Logger);
  branchService.createBranch(req, res, next);
};

/**
 * Get all branch
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.getBranchList = function getBranchList(req, res, next) {
  let branchService = new BranchService(req.Logger);
  branchService.getBranchList(req.swagger.params, res, next);
};

/**
 * Get branch with given branch_id
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.getBranch = function getBranch(req, res, next) {
  let branchService = new BranchService(req.Logger);
  branchService.getBranch(req.swagger.params, res, next);
};

/**
 * Update branch with given branch_id
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.updateBranch = function updateBranch(req, res, next) {
  let branchService = new BranchService(req.Logger);
  branchService.updateBranch(req.swagger.params, res, next);
};