"use strict";

const _ = require("lodash");
const { receiveMail } = require("../helpers/EmailHelper");
const { RuntimeError } = require("../helpers/bts-error-utils");

/**
 * Creates an instance of contact us service
 */
class ContactUsService {
  constructor(logger) {
    this.logger = logger;
  }

  /**
   * Send contact mail to the bts-support
   *
   * @param {object} swaggerParams - The swagger parameter
   * @param {IncomingMessage} res - The http response object
   * @param {function} next - The callback used to pass control to the next action/middleware
   */
   sendContactMail(swaggerParams, res, next) {
    const { email, message, subject, firstname, lastname } = swaggerParams.contact.value;
    _sendMail(email, message, `${subject} - ${firstname} ${lastname}`, (mailError) => {
      if (mailError) {
        let runtimeError = new RuntimeError(
          'There was an error while sending support mail to the bts-support mail-id',
          mailError
        );
        return next(runtimeError);
      }
      let response = {
        message: 'We will be in touch soon '
      };
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      res.end(JSON.stringify(response));
    });
  }
}

/**
 * Send mail notification to the bts support team
 *
 * @param {String} emailId - The email-id of user to send mail
 * @param {String} content - The email content
 * @param {String} subject - The email subject
 * @param {function} callback - The callback used to pass control to the next action/middleware
 *
 * @private
 */
 function _sendMail(emailId, content, subject, callback) {
  let options = {
    from: emailId,
    subject: subject,
    text: content
  };
  receiveMail(options, callback);
}

module.exports = ContactUsService;
