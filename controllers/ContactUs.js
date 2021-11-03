'use strict';

const ContactUsService = require('../services/ContactUsService');

/**
 * Send contact mail to the bts-support
 *
 * @param {ClientRequest} req - The http request object
 * @param {IncomingMessage} res - The http response object
 * @param {function} next - The callback used to pass control to the next action/middleware
 */
module.exports.sendContactMail = function sendContactMail(req, res, next) {
  let contactUsService = new ContactUsService(req.Logger);
  contactUsService.sendContactMail(req.swagger.params, res, next);
};