'use strict';

const AuthenticationService = require('../services/AuthenticationService');

/**
 * Creates a new user
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.userSignUp = function userSignUp(req, res, next) {
  let authenticationService = new AuthenticationService(req.Logger);
  authenticationService.userSignUp(req.swagger.params, res, next);
};

/**
 * User sign in
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.userSignIn = function userSignIn(req, res, next) {
  let authenticationService = new AuthenticationService(req.Logger);
  authenticationService.userSignIn(req.swagger.params, res, next);
};

/**
 * Verify an email
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
 module.exports.updateEmailStatus = function updateEmailStatus(req, res, next) {
  let authenticationService = new AuthenticationService(req.Logger);
  authenticationService.updateEmailStatus(req.swagger.params, res, next);
};

/**
 * Updates user details
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
 module.exports.updateUserDetails = function updateUserDetails(req, res, next) {
  let authenticationService = new AuthenticationService(req.Logger);
  authenticationService.updateUserDetails(req.swagger.params, res, next);
};

/**
 * Get user with user_id
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
 module.exports.getUser = function getUser(req, res, next) {
  let authenticationService = new AuthenticationService(req.Logger);
  authenticationService.getUser(req.swagger.params, res, next);
};

/**
 * Get list of users
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
 module.exports.getUserList = function getUserList(req, res, next) {
  let authenticationService = new AuthenticationService(req.Logger);
  authenticationService.getUserList(req.swagger.params, res, next);
};

/**
 * Email with link for Reset password
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
 module.exports.resetPasswordLink= function resetPasswordLink(req, res, next) {
  let authenticationService = new AuthenticationService(req.Logger);
  authenticationService.resetPasswordLink(req.swagger.params, res, next);
};

/**
 * Verify link for reset-password
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.verifyResetPasswordLink = function verifyResetPasswordLink(req, res, next) {
  let authenticationService = new AuthenticationService(req.Logger);
  authenticationService.verifyResetPasswordLink(req.swagger.params, res, next);
};